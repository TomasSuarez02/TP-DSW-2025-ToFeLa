import type { ReactNode } from 'react'

/**
 * Los cinco tonos del sistema de estado. No hay un sexto: si un estado
 * nuevo no entra en ninguno, es que no está claro qué significa.
 *
 * salvia  — confirmado, aprobado, disponible
 * ambar   — pendiente, en revisión
 * alerta  — rechazado, cancelado
 * arena   — vencido, inactivo (deja de pedir atención)
 * terra   — acento; sólo la acción principal y el precio
 */
export type Tono = 'salvia' | 'ambar' | 'alerta' | 'arena' | 'terra'

/** El borde de 1px es lo que da canto: el relleno solo se lee como mancha. */
const TONOS: Record<Tono, string> = {
  salvia: 'bg-salvia-100 text-salvia-700 border-salvia-500/30',
  ambar: 'bg-ambar-100 text-ambar-700 border-ambar-700/20',
  alerta: 'bg-alerta-100 text-alerta-700 border-alerta-700/20',
  arena: 'bg-arena-100 text-tinta-500 border-arena-300',
  terra: 'bg-terra-100 text-terra-800 border-terra-500/25',
}

export default function Badge({
  tono = 'arena',
  children,
  className = '',
}: {
  tono?: Tono
  children: ReactNode
  className?: string
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs leading-none font-medium whitespace-nowrap ${TONOS[tono]} ${className}`}
    >
      {children}
    </span>
  )
}
