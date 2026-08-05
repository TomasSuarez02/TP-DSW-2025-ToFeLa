import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import {
  CheckCircleIcon,
  ExclamationCircleIcon,
  InformationCircleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import { NotificacionContext } from '../../hooks/useNotificacion'
import type { Notificacion, TonoNotificacion } from '../../hooks/useNotificacion'

/** Un error se lee más despacio que un "listo", y no se auto-descarta igual. */
const DURACION: Record<TonoNotificacion, number> = {
  exito: 4000,
  info: 5000,
  error: 8000,
}

const ICONOS: Record<TonoNotificacion, typeof CheckCircleIcon> = {
  exito: CheckCircleIcon,
  error: ExclamationCircleIcon,
  info: InformationCircleIcon,
}

const COLOR_ICONO: Record<TonoNotificacion, string> = {
  exito: 'text-salvia-700',
  error: 'text-alerta-700',
  info: 'text-tinta-500',
}

/**
 * Provider de avisos. Va una sola vez, arriba del router.
 *
 * Los toasts se apilan abajo a la derecha en escritorio y arriba en mobile
 * (donde el pulgar y las barras fijas se pelean por el borde inferior).
 */
export function NotificacionProvider({ children }: { children: ReactNode }) {
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([])
  const siguienteId = useRef(1)
  const temporizadores = useRef(new Map<number, ReturnType<typeof setTimeout>>())

  const descartar = useCallback((id: number) => {
    const timer = temporizadores.current.get(id)
    if (timer) {
      clearTimeout(timer)
      temporizadores.current.delete(id)
    }
    setNotificaciones((previas) => previas.filter((n) => n.id !== id))
  }, [])

  const notificar = useCallback(
    (mensaje: string, tono: TonoNotificacion = 'exito', descripcion?: string) => {
      const id = siguienteId.current++
      setNotificaciones((previas) => [...previas.slice(-2), { id, mensaje, tono, descripcion }])
      temporizadores.current.set(
        id,
        setTimeout(() => descartar(id), DURACION[tono]),
      )
    },
    [descartar],
  )

  // Si la vista se desmonta con avisos en pantalla, los timers quedarían vivos.
  useEffect(() => {
    const timers = temporizadores.current
    return () => {
      for (const timer of timers.values()) clearTimeout(timer)
      timers.clear()
    }
  }, [])

  const valor = useMemo(() => ({ notificar, descartar }), [notificar, descartar])

  return (
    <NotificacionContext.Provider value={valor}>
      {children}

      <div
        /* assertive interrumpiría la lectura en curso; estos avisos informan
           un resultado, no piden una acción inmediata. */
        aria-live="polite"
        aria-atomic="false"
        className="pointer-events-none fixed inset-x-4 top-4 z-100 flex flex-col gap-2 sm:inset-x-auto sm:top-auto sm:right-6 sm:bottom-6 sm:w-90"
      >
        {notificaciones.map((n) => (
          <Aviso key={n.id} notificacion={n} onCerrar={() => descartar(n.id)} />
        ))}
      </div>
    </NotificacionContext.Provider>
  )
}

function Aviso({ notificacion, onCerrar }: { notificacion: Notificacion; onCerrar: () => void }) {
  const Icono = ICONOS[notificacion.tono]

  return (
    <div
      role={notificacion.tono === 'error' ? 'alert' : 'status'}
      className="pointer-events-auto flex items-start gap-3 rounded-card border border-arena-200 bg-white/95 px-4 py-3 shadow-card-hover backdrop-blur transition duration-300 ease-[var(--ease-salida)] starting:translate-y-2 starting:opacity-0"
    >
      <Icono className={`mt-0.5 size-5 shrink-0 ${COLOR_ICONO[notificacion.tono]}`} aria-hidden="true" />

      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-tinta-900">{notificacion.mensaje}</p>
        {notificacion.descripcion && (
          <p className="mt-0.5 text-xs leading-relaxed text-tinta-500">{notificacion.descripcion}</p>
        )}
      </div>

      <button
        type="button"
        onClick={onCerrar}
        aria-label="Cerrar aviso"
        className="-me-1 -mt-0.5 grid size-7 shrink-0 place-items-center rounded-full text-tinta-500 transition-colors hover:bg-arena-100 hover:text-tinta-900"
      >
        <XMarkIcon className="size-4" aria-hidden="true" />
      </button>
    </div>
  )
}
