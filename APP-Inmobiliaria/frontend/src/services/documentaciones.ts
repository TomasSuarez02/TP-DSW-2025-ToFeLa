import apiClient from '../utils/apiClient'

/**
 * Catálogo de documentos: el papel en sí (descripción, vencimiento, archivo).
 * Quién lo presentó y si está aprobado vive en `documentacionCliente.ts`.
 */

export interface Documentacion {
  id: number
  descripcion: string
  fecha_vencimiento: string
  /** Nombre del archivo en el servidor. El contenido se baja por `descargarUrl`. */
  path?: string | null
}

export async function obtenerDocumentaciones(): Promise<Documentacion[]> {
  const res = await apiClient.get('/documentaciones')
  return (res.data?.data ?? []) as Documentacion[]
}

/** Crea el documento; si viene `archivo` lo manda en base64 dentro del JSON. */
export async function crearDocumentacion(datos: {
  descripcion: string
  fecha_vencimiento: string
  archivo?: File | null
}): Promise<Documentacion> {
  const cuerpo: Record<string, unknown> = {
    descripcion: datos.descripcion,
    fecha_vencimiento: datos.fecha_vencimiento,
  }

  if (datos.archivo) {
    cuerpo.base64 = await leerComoBase64(datos.archivo)
    cuerpo.filename = datos.archivo.name
  }

  const res = await apiClient.post('/documentaciones', cuerpo)
  return (res.data?.data ?? res.data) as Documentacion
}

export async function eliminarDocumentacion(id: number): Promise<void> {
  await apiClient.delete(`/documentaciones/${id}`)
}

/**
 * Descarga el archivo. No se puede usar un `<a href>` directo porque la ruta
 * exige el header Authorization, así que se baja por XHR y se abre como blob.
 */
export async function descargarDocumentacion(id: number, nombre?: string | null): Promise<void> {
  const res = await apiClient.get(`/documentaciones/${id}/archivo`, { responseType: 'blob' })
  const url = URL.createObjectURL(res.data as Blob)
  const link = document.createElement('a')
  link.href = url
  link.download = nombre ?? `documento-${id}`
  link.click()
  URL.revokeObjectURL(url)
}

function leerComoBase64(archivo: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(archivo)
  })
}
