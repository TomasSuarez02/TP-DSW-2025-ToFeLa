import { createContext, useContext } from 'react'

export type TonoNotificacion = 'exito' | 'error' | 'info'

export interface Notificacion {
  id: number
  mensaje: string
  /** Segunda línea opcional: el detalle que no entra en el título. */
  descripcion?: string
  tono: TonoNotificacion
}

export interface NotificacionContextValue {
  notificar: (mensaje: string, tono?: TonoNotificacion, descripcion?: string) => void
  descartar: (id: number) => void
}

export const NotificacionContext = createContext<NotificacionContextValue | null>(null)

/**
 * Aviso de resultado, en reemplazo de `alert()`.
 *
 * `alert` congela la pestaña, se dibuja con la piel del navegador y obliga a
 * hacer clic para volver a trabajar: para "guardado con éxito" es un peaje.
 * El toast informa sin interrumpir; lo que sí necesita una decisión sigue
 * yendo a un ConfirmDialog.
 */
export function useNotificacion(): NotificacionContextValue {
  const ctx = useContext(NotificacionContext)
  if (!ctx) throw new Error('useNotificacion debe usarse dentro de <NotificacionProvider>')
  return ctx
}
