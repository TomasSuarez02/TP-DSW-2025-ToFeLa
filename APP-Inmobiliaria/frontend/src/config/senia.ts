/**
 * Reglas de negocio de las señas.
 * Si en algún momento el porcentaje pasa a definirse por propiedad, estos valores
 * quedan como fallback y se lee el de la propiedad cuando venga en la API.
 */

/** Porcentaje del precio de la propiedad que se exige como seña mínima. */
export const SENIA_PORCENTAJE = 0.2

/** Días corridos que la propiedad queda reservada desde que se aprueba el pago. */
export const SENIA_DIAS_VENCIMIENTO = 10

/** Con este flag el pago se simula en el navegador, sin llamar al backend. */
export const USA_PAGO_MOCK = import.meta.env.VITE_USE_MOCK === 'true'

/** Importe mínimo de seña para una propiedad de precio `precio`. */
export function calcularSeniaMinima(precio: number): number {
  return Math.round(precio * SENIA_PORCENTAJE)
}

/** Fecha hasta la que queda reservada una propiedad señada hoy. */
export function calcularFechaVencimiento(desde: Date = new Date()): Date {
  const vencimiento = new Date(desde)
  vencimiento.setDate(vencimiento.getDate() + SENIA_DIAS_VENCIMIENTO)
  return vencimiento
}

/**
 * Días que faltan para una fecha de vencimiento.
 * Negativo si ya venció, null si no hay fecha.
 */
export function diasRestantes(fechaVencimiento?: string | null): number | null {
  if (!fechaVencimiento) return null
  const vencimiento = new Date(fechaVencimiento)
  if (Number.isNaN(vencimiento.getTime())) return null
  const msPorDia = 1000 * 60 * 60 * 24
  return Math.ceil((vencimiento.getTime() - Date.now()) / msPorDia)
}

export function formatearMoneda(monto: number): string {
  return monto.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 })
}

export function formatearFecha(fecha?: string | null): string {
  if (!fecha) return '—'
  const parsed = new Date(fecha)
  if (Number.isNaN(parsed.getTime())) return '—'
  return parsed.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}
