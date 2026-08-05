/**
 * Formato de presentación. Vivía en config/senia.ts, junto a las reglas de
 * negocio de la seña, pero no es una regla de nada: es cómo se escribe un
 * número en pantalla, y lo usan pantallas que no tienen que ver con señas.
 */

export function formatearMoneda(monto: number): string {
  return monto.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 })
}

export function formatearFecha(fecha?: string | null): string {
  if (!fecha) return '—'
  const parsed = new Date(fecha)
  if (Number.isNaN(parsed.getTime())) return '—'
  return parsed.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

/** Fecha con hora, para agendas y visitas, donde el día solo no alcanza. */
export function formatearFechaHora(fecha?: string | null): string {
  if (!fecha) return '—'
  const parsed = new Date(fecha)
  if (Number.isNaN(parsed.getTime())) return '—'
  return parsed.toLocaleString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
