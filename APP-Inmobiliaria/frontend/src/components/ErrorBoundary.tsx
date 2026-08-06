import { Component } from 'react'
import type { ErrorInfo, ReactNode } from 'react'
import { ArrowPathIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'

interface Props {
  children: ReactNode
  /** Cambia cuando cambia la ruta: al navegar, la sección rota se reintenta sola. */
  clave?: string
}

interface State {
  error: Error | null
}

/**
 * Atrapa los errores de render de una sección del panel.
 *
 * Antes esto era un try/catch alrededor del switch que elegía qué pantalla
 * mostrar. Nunca se ejecutaba: el bloque sólo envuelve la *creación* del
 * elemento de React, no su renderizado, así que un error dentro de
 * `<Propiedades />` pasaba de largo y tiraba abajo la app entera con la
 * pantalla en blanco. Un límite de error es la única forma de interceptarlo,
 * y hoy sigue requiriendo un componente de clase.
 */
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidUpdate(previas: Props) {
    // Sin esto, una sección que falló deja el panel bloqueado: el límite
    // recuerda el error y ninguna navegación posterior vuelve a intentar.
    if (this.state.error && previas.clave !== this.props.clave) {
      this.setState({ error: null })
    }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Error al renderizar la sección:', error, info.componentStack)
  }

  reintentar = () => {
    this.setState({ error: null })
  }

  render() {
    if (!this.state.error) return this.props.children

    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-card border border-arena-200 bg-white px-6 py-14 text-center shadow-card">
        <span className="grid size-11 place-items-center rounded-full bg-alerta-50">
          <ExclamationTriangleIcon className="size-6 text-alerta-700" aria-hidden="true" />
        </span>

        <div className="space-y-1">
          <p className="font-display text-lg text-tinta-900">Esta sección no se pudo mostrar</p>
          <p className="max-w-prose text-sm text-tinta-500">
            El resto del panel sigue funcionando. Si vuelve a pasar, avisale al equipo con el
            detalle de abajo.
          </p>
        </div>

        <button type="button" onClick={this.reintentar} className="accion accion-secundaria accion-sm">
          <ArrowPathIcon className="size-4" aria-hidden="true" />
          Reintentar
        </button>

        <p className="mt-1 font-mono text-xs break-all text-tinta-500">{this.state.error.message}</p>
      </div>
    )
  }
}
