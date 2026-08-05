import { useId } from 'react'
import type { ReactNode } from 'react'

/** Props que Campo inyecta al control: id y cableado de accesibilidad. */
export interface PropsControl {
  id: string
  className: string
  'aria-invalid': boolean | undefined
  'aria-describedby': string | undefined
}

/**
 * Un campo de formulario: etiqueta, control, ayuda y error.
 *
 * El motivo de que exista es el cableado, no el margen. Los formularios del
 * panel tenían labels sueltos sin `htmlFor` y mensajes de error que ningún
 * lector de pantalla asociaba al input. Acá el id se genera una vez y baja
 * al control junto con aria-invalid y aria-describedby:
 *
 *   <Campo etiqueta="Importe" error={errores.importe}>
 *     {(p) => <input {...p} name="importe" value={v} onChange={onChange} />}
 *   </Campo>
 *
 * Si el control necesita más control del que permite el render prop, se le
 * pasan hijos normales y se cablea a mano con las clases de abajo.
 */
export default function Campo({
  etiqueta,
  ayuda,
  error,
  requerido = false,
  className = '',
  children,
}: {
  etiqueta: string
  /** Contexto antes de escribir. Va arriba del control, no debajo. */
  ayuda?: string
  error?: string
  requerido?: boolean
  className?: string
  children: ReactNode | ((props: PropsControl) => ReactNode)
}) {
  const id = useId()
  const idAyuda = ayuda ? `${id}-ayuda` : undefined
  const idError = error ? `${id}-error` : undefined
  const descrito = [idError, idAyuda].filter(Boolean).join(' ') || undefined

  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-tinta-900">
        {etiqueta}
        {requerido && (
          <span className="ms-1 text-terra-600" aria-hidden="true">
            *
          </span>
        )}
      </label>

      {ayuda && (
        <p id={idAyuda} className="mb-1.5 text-xs leading-relaxed text-tinta-500">
          {ayuda}
        </p>
      )}

      {typeof children === 'function'
        ? children({
            id,
            className: claseControl(error),
            'aria-invalid': error ? true : undefined,
            'aria-describedby': descrito,
          })
        : children}

      {error && (
        <p id={idError} className="mt-1.5 text-xs font-medium text-alerta-700">
          {error}
        </p>
      )}
    </div>
  )
}

/**
 * Superficie hundida con canto: el control se lee como un hueco en la tarjeta,
 * no como otra tarjeta encima. En foco sube a blanco y el anillo lo levanta.
 */
export const CLASE_CONTROL =
  'w-full rounded-lg border bg-arena-50 px-3 py-2.5 text-sm text-tinta-900 placeholder:text-tinta-500/70 transition-colors focus:bg-white focus:outline-none disabled:cursor-not-allowed disabled:opacity-60'

export const CLASE_CONTROL_NORMAL = 'border-arena-300 focus:border-terra-600'

export const CLASE_CONTROL_ERROR = 'border-alerta-700 bg-alerta-50 focus:border-alerta-700'

function claseControl(error?: string): string {
  return `${CLASE_CONTROL} ${error ? CLASE_CONTROL_ERROR : CLASE_CONTROL_NORMAL}`
}
