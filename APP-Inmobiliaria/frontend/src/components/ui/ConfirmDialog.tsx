import { useState } from 'react'
import Modal from '../Modal'

/**
 * Confirmación destructiva, sobre el Modal del sistema.
 *
 * Reemplaza a `window.confirm`, que además de verse ajeno bloquea el hilo y
 * no puede decir *qué* se está por borrar. Acá el diálogo espera a que la
 * acción termine —el botón queda ocupado y no se puede disparar dos veces—
 * y sólo se cierra si salió bien; si falla, el error se muestra adentro y el
 * usuario no pierde el contexto.
 */
export default function ConfirmDialog({
  open,
  titulo,
  descripcion,
  detalle,
  textoConfirmar = 'Confirmar',
  textoCancelar = 'Cancelar',
  tono = 'peligro',
  onConfirmar,
  onCancelar,
}: {
  open: boolean
  titulo: string
  descripcion?: string
  /** Lo concreto: la dirección, el nombre, el importe que está en juego. */
  detalle?: string
  textoConfirmar?: string
  textoCancelar?: string
  tono?: 'peligro' | 'primaria'
  /** Si lanza, el diálogo queda abierto mostrando el error. */
  onConfirmar: () => void | Promise<void>
  onCancelar: () => void
}) {
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const cerrar = () => {
    if (enviando) return
    setError(null)
    onCancelar()
  }

  const confirmar = async () => {
    if (enviando) return
    setEnviando(true)
    setError(null)
    try {
      await onConfirmar()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo completar la operación.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={cerrar}
      titulo={titulo}
      descripcion={descripcion}
      pie={
        <>
          <button
            type="button"
            onClick={cerrar}
            disabled={enviando}
            className="accion accion-fantasma"
          >
            {textoCancelar}
          </button>
          <button
            type="button"
            onClick={confirmar}
            disabled={enviando}
            className={`accion ${tono === 'peligro' ? 'accion-peligro' : 'accion-primaria'}`}
          >
            {enviando ? 'Procesando…' : textoConfirmar}
          </button>
        </>
      }
    >
      {detalle && (
        <p className="rounded-lg border border-arena-200 bg-arena-50 px-4 py-3 text-sm text-tinta-900">
          {detalle}
        </p>
      )}

      {error && (
        <p role="alert" className="mt-3 rounded-lg bg-alerta-50 px-4 py-3 text-sm text-alerta-700">
          {error}
        </p>
      )}
    </Modal>
  )
}
