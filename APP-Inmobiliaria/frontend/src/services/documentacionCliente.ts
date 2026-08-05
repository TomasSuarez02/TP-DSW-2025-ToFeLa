import apiClient from '../utils/apiClient'
import { crearDocumentacion, eliminarDocumentacion } from './documentaciones'
import type { DocumentacionCliente, EstadoDocumentacionCliente } from '../types/senia'

/**
 * Documentación que presentan los clientes y su revisión por parte del agente.
 * Es la condición para concretar un alquiler: ver docs/api-senias.md
 */

/** Todas las presentaciones (vista del agente). */
export async function obtenerDocumentacionClientes(): Promise<DocumentacionCliente[]> {
  const res = await apiClient.get('/documentacionclientes')
  return (res.data?.data ?? []) as DocumentacionCliente[]
}

/** Documentación del cliente autenticado. */
export async function obtenerMiDocumentacion(): Promise<DocumentacionCliente[]> {
  const res = await apiClient.get('/documentacionclientes/mis-documentaciones')
  return (res.data?.data ?? []) as DocumentacionCliente[]
}

/**
 * Registra que un cliente presentó un documento.
 * Un agente puede darlo por aprobado en el mismo acto (lo cargó porque ya vio
 * el papel); si no se aclara, queda pendiente de revisión.
 */
export async function presentarDocumentacion(
  documentacionId: number,
  clienteId: number,
  estado?: EstadoDocumentacionCliente,
): Promise<DocumentacionCliente> {
  const res = await apiClient.post('/documentacionclientes', {
    documentacion: documentacionId,
    cliente: clienteId,
    ...(estado ? { estado } : {}),
  })
  return (res.data?.data ?? res.data) as DocumentacionCliente
}

/**
 * Retira un papel presentado. El backend borra además la `Documentacion` y su
 * archivo si no le quedan otros dueños, así que este es el endpoint a usar para
 * "eliminar un documento" — pegarle directo a `DELETE /documentaciones/:id`
 * choca con la foreign key cuando la presentación sigue viva.
 */
export async function eliminarPresentacion(
  documentacionId: number,
  clienteId: number,
): Promise<void> {
  await apiClient.delete(`/documentacionclientes/${documentacionId}/${clienteId}`)
}

/**
 * Alta completa en un paso: crea el documento (con su archivo) y lo vincula al
 * cliente. Si el vínculo falla se borra el documento, así no queda colgado.
 */
export async function cargarDocumentoDeCliente(datos: {
  clienteId: number
  descripcion: string
  fecha_vencimiento: string
  archivo?: File | null
  estado?: EstadoDocumentacionCliente
}): Promise<DocumentacionCliente> {
  const creado = await crearDocumentacion({
    descripcion: datos.descripcion,
    fecha_vencimiento: datos.fecha_vencimiento,
    archivo: datos.archivo,
  })

  try {
    return await presentarDocumentacion(creado.id, datos.clienteId, datos.estado)
  } catch (error) {
    await eliminarDocumentacion(creado.id).catch(() => undefined)
    throw error
  }
}

/** El agente aprueba o rechaza un documento presentado. */
export async function revisarDocumentacion(
  documentacionId: number,
  clienteId: number,
  estado: EstadoDocumentacionCliente,
  observaciones?: string,
): Promise<DocumentacionCliente> {
  const res = await apiClient.patch(
    `/documentacionclientes/${documentacionId}/${clienteId}/revisar`,
    { estado, ...(observaciones ? { observaciones } : {}) },
  )
  return (res.data?.data ?? res.data) as DocumentacionCliente
}
