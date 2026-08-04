/**
 * Tipos del dominio de señas y pagos.
 * El contrato completo con el backend está documentado en docs/api-senias.md
 */

export type EstadoSenia = 'pendiente_pago' | 'confirmada' | 'vencida' | 'cancelada'

export type EstadoPago = 'pendiente' | 'aprobado' | 'rechazado'

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
  email?: string
}

export interface Pago {
  id?: number
  estado: EstadoPago
  monto: number
  ultimosCuatro: string
  fecha: string
  referencia?: string
}

export interface Senia {
  id: number
  importe: number
  estado: EstadoSenia
  fechaVencimiento?: string | null
  fechaCreacion?: string
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
