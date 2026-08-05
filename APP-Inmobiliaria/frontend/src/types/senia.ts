/**
 * Tipos del dominio de señas y pagos.
 * El contrato completo con el backend está documentado en docs/api-senias.md
 */

export type EstadoSenia = 'pendiente_pago' | 'confirmada' | 'vencida' | 'cancelada'

export type EstadoPago = 'pendiente' | 'aprobado' | 'rechazado'

export type MedioPago = 'tarjeta' | 'efectivo' | 'transferencia'

export type EstadoDocumentacionCliente = 'pendiente' | 'aprobada' | 'rechazada'

export interface PropiedadRef {
  id: number
  direccion?: string
  precio?: number
  estado?: string
}

export interface ClienteRef {
  id: number
  nombre?: string
  apellido?: string
  mail?: string
}

export interface Pago {
  id?: number
  estado: EstadoPago
  /** La seña se cobra con tarjeta; el saldo, presencialmente. */
  medio?: MedioPago
  monto: number
  /** Solo en pagos con tarjeta. */
  ultimosCuatro?: string | null
  titular?: string | null
  fecha: string
  referencia?: string
}

/** El papel en sí. Viene populado dentro de cada `DocumentacionCliente`. */
export interface DocumentacionRef {
  id: number
  descripcion?: string
  fecha_vencimiento?: string
  /** Nombre del archivo en el servidor; si falta, se cargó sin adjunto. */
  path?: string | null
}

/** Documento que el cliente presentó, con el resultado de su revisión. */
export interface DocumentacionCliente {
  documentacion: number | DocumentacionRef
  cliente: number | ClienteRef
  estado: EstadoDocumentacionCliente
  fecha_carga?: string
  observaciones?: string | null
}

/**
 * Un cliente está en regla cuando presentó al menos un papel y todos están
 * aprobados y sin vencer. Es la misma condición que valida el backend antes de
 * dejar concretar un alquiler (ver `exigirDocumentacionAprobada`).
 */
export function documentacionEnRegla(items: DocumentacionCliente[]): boolean {
  if (items.length === 0) return false
  return items.every((dc) => {
    if (dc.estado !== 'aprobada') return false
    const vence = refObjeto<DocumentacionRef>(dc.documentacion)?.fecha_vencimiento
    return !vence || new Date(vence) >= new Date()
  })
}

export interface Senia {
  /**
   * Clave primaria compuesta (propiedad + cliente + fecha) codificada por el
   * backend como "19-13-1754325480000". Ver backend/src/shared/db/clave-compuesta.ts
   */
  clave: string
  importe: number
  estado: EstadoSenia
  fechaVencimiento?: string | null
  /**
   * La seña sigue `confirmada` después de concretarse, así que este flag es lo
   * único que distingue "lista para concretar" de "ya concretada".
   */
  concretada?: boolean
  /** Fecha de creación: es también el tercer componente de la clave. */
  fecha_hora_senia?: string
  propiedad?: number | PropiedadRef
  cliente?: number | ClienteRef
  pago?: Pago | null
}

/** Datos de tarjeta que se envían al procesar un pago. */
export interface DatosTarjeta {
  numeroTarjeta: string
  titular: string
  vencimiento: string
  cvv: string
}

export const ETIQUETAS_ESTADO_SENIA: Record<EstadoSenia, string> = {
  pendiente_pago: 'Pendiente de pago',
  confirmada: 'Confirmada',
  vencida: 'Vencida',
  cancelada: 'Cancelada',
}

export const ETIQUETAS_ESTADO_DOC: Record<EstadoDocumentacionCliente, string> = {
  pendiente: 'Pendiente de revisión',
  aprobada: 'Aprobada',
  rechazada: 'Rechazada',
}

export const ESTILOS_ESTADO_DOC: Record<EstadoDocumentacionCliente, string> = {
  pendiente: 'bg-amber-100 text-amber-800 border-amber-200',
  aprobada: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  rechazada: 'bg-red-100 text-red-800 border-red-200',
}

/** Clases de Tailwind para el badge de cada estado. */
export const ESTILOS_ESTADO_SENIA: Record<EstadoSenia, string> = {
  pendiente_pago: 'bg-amber-100 text-amber-800 border-amber-200',
  confirmada: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  vencida: 'bg-neutral-200 text-neutral-700 border-neutral-300',
  cancelada: 'bg-red-100 text-red-800 border-red-200',
}

/** Extrae el id de una relación que puede venir como número o como objeto populado. */
export function refId(rel?: number | { id?: number } | null): number | undefined {
  if (typeof rel === 'number') return rel
  if (rel && typeof rel === 'object' && typeof rel.id === 'number') return rel.id
  return undefined
}

/** Devuelve el objeto populado de una relación, o undefined si vino solo el id. */
export function refObjeto<T extends { id?: number }>(rel?: number | T | null): T | undefined {
  if (rel && typeof rel === 'object') return rel
  return undefined
}
