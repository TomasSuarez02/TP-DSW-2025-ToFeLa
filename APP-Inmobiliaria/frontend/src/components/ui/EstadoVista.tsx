import { ArrowPathIcon, ExclamationTriangleIcon, InboxIcon } from '@heroicons/react/24/outline'
import type { ReactNode } from 'react'

/**
 * Los tres estados que toda vista con datos remotos tiene y casi ninguna
 * pantalla del panel tenía completos: cargando, error y vacío.
 *
 * Se envuelve el contenido y se le pasan las banderas; mientras haya algo que
 * mostrar en lugar de los datos, los hijos no se montan.
 *
 *   <EstadoVista cargando={cargando} error={error} vacio={items.length === 0}
 *                onReintentar={recargar} mensajeVacio="Todavía no hay señas.">
 *     <Tabla ... />
 *   </EstadoVista>
 */
export default function EstadoVista({
  cargando,
  error,
  vacio = false,
  onReintentar,
  mensajeVacio = 'Todavía no hay nada acá.',
  detalleVacio,
  accionVacio,
  children,
}: {
  cargando: boolean
  error?: string | null
  vacio?: boolean
  onReintentar?: () => void
  mensajeVacio?: string
  /** Una línea de contexto: por qué está vacío o qué hacer al respecto. */
  detalleVacio?: string
  /** La acción que llena el vacío. Un vacío sin salida es un callejón. */
  accionVacio?: ReactNode
  children: ReactNode
}) {
  if (cargando) {
    return (
      <Marco>
        <ArrowPathIcon
          className="size-6 animate-spin text-tinta-500 motion-reduce:animate-none"
          aria-hidden="true"
        />
        <p className="text-sm text-tinta-500" role="status">
          Cargando…
        </p>
      </Marco>
    )
  }

  if (error) {
    return (
      <Marco>
        <span className="grid size-11 place-items-center rounded-full bg-alerta-50">
          <ExclamationTriangleIcon className="size-6 text-alerta-700" aria-hidden="true" />
        </span>
        <div className="space-y-1">
          <p className="font-display text-lg text-tinta-900">No se pudieron cargar los datos</p>
          <p className="text-sm text-tinta-500">{error}</p>
        </div>
        {onReintentar && (
          <button type="button" onClick={onReintentar} className="accion accion-secundaria accion-sm">
            <ArrowPathIcon className="size-4" aria-hidden="true" />
            Reintentar
          </button>
        )}
      </Marco>
    )
  }

  if (vacio) {
    return (
      <Marco>
        <span className="grid size-11 place-items-center rounded-full bg-arena-100">
          <InboxIcon className="size-6 text-tinta-500" aria-hidden="true" />
        </span>
        <div className="space-y-1">
          <p className="font-display text-lg text-tinta-900">{mensajeVacio}</p>
          {detalleVacio && <p className="text-sm text-tinta-500">{detalleVacio}</p>}
        </div>
        {accionVacio}
      </Marco>
    )
  }

  return <>{children}</>
}

/** La misma caja para los tres: cambia el contenido, no el lugar. */
function Marco({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-card border border-arena-200 bg-white px-6 py-14 text-center shadow-card">
      {children}
    </div>
  )
}
