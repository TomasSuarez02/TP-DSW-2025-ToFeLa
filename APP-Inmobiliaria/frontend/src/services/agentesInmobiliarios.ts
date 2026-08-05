import apiClient from '../utils/apiClient'

/**
 * Alta de agentes del backoffice. A diferencia de Cliente, no hay registro
 * público: solo un agente ya logueado puede crear a otro.
 */

export interface InmobiliariaRef {
  id: number
  descripcion?: string
}

export interface Agente {
  id: number
  nombre: string
  apellido: string
  mail: string
  telefono: string
  tipo_doc: string
  nro_doc: number
  fecha_ingreso?: string | null
  inmobiliaria?: number | InmobiliariaRef | null
}

export interface DatosAgente {
  nombre: string
  apellido: string
  mail: string
  telefono: string
  tipo_doc: string
  nro_doc: string
  fecha_ingreso: string
  inmobiliaria?: string
  /** Solo se manda si se está definiendo o cambiando la contraseña. */
  contrasenia?: string
}

export async function obtenerAgentes(): Promise<Agente[]> {
  const res = await apiClient.get('/agentesinmobiliarios')
  return (res.data?.data ?? []) as Agente[]
}

function aPayload(datos: DatosAgente) {
  return {
    nombre: datos.nombre.trim(),
    apellido: datos.apellido.trim(),
    mail: datos.mail.trim(),
    telefono: datos.telefono.trim(),
    tipo_doc: datos.tipo_doc.trim(),
    nro_doc: datos.nro_doc.trim(),
    fecha_ingreso: datos.fecha_ingreso,
    ...(datos.inmobiliaria ? { inmobiliaria: Number(datos.inmobiliaria) } : {}),
    ...(datos.contrasenia ? { contrasenia: datos.contrasenia } : {}),
  }
}

export async function crearAgente(datos: DatosAgente): Promise<Agente> {
  const res = await apiClient.post('/agentesinmobiliarios', aPayload(datos))
  return (res.data?.data ?? res.data) as Agente
}

export async function actualizarAgente(id: number, datos: DatosAgente): Promise<Agente> {
  const res = await apiClient.put(`/agentesinmobiliarios/${id}`, aPayload(datos))
  return (res.data?.data ?? res.data) as Agente
}

export async function eliminarAgente(id: number): Promise<void> {
  await apiClient.delete(`/agentesinmobiliarios/${id}`)
}
