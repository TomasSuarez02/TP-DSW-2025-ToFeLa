/**
 * Traducción de los estados del dominio a los tonos del sistema visual.
 *
 * Antes cada estado traía su propia tira de clases de Tailwind pegada al
 * tipo (`bg-amber-100 text-amber-800 ...` dentro de types/senia.ts), así que
 * el dominio decidía colores y había cinco vocabularios de badge conviviendo.
 * Acá el dominio decide *significado* —pendiente, aprobado, vencido— y el
 * tono sale de un único sistema (ver components/ui/Badge.tsx).
 */

import type { Tono } from '../components/ui/Badge'
import type { EstadoDocumentacionCliente, EstadoPago, EstadoSenia } from '../types/senia'

export const TONO_ESTADO_SENIA: Record<EstadoSenia, Tono> = {
  pendiente_pago: 'ambar',
  confirmada: 'salvia',
  /** Vencida no es un error: es algo que dejó de estar vigente y baja el volumen. */
  vencida: 'arena',
  cancelada: 'alerta',
}

export const TONO_ESTADO_DOC: Record<EstadoDocumentacionCliente, Tono> = {
  pendiente: 'ambar',
  aprobada: 'salvia',
  rechazada: 'alerta',
}

export const TONO_ESTADO_PAGO: Record<EstadoPago, Tono> = {
  pendiente: 'ambar',
  aprobado: 'salvia',
  rechazado: 'alerta',
}

/** Disponible es el único estado de propiedad que se celebra; el resto informa. */
export function tonoEstadoPropiedad(estado?: string | null): Tono {
  const normalizado = (estado ?? '').trim().toLowerCase()
  if (normalizado === 'disponible') return 'salvia'
  if (normalizado === 'reservada' || normalizado === 'reservado') return 'ambar'
  return 'arena'
}
