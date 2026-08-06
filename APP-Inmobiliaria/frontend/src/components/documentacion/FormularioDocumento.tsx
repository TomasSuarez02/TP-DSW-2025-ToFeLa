import { useState } from 'react'
import { PaperClipIcon } from '@heroicons/react/24/outline'
import Campo from '../ui/Campo'
import { useFormularioApi } from '../../hooks/useFormularioApi'
import type { EstadoDocumentacionCliente } from '../../types/senia'

export interface DatosDocumento {
  descripcion: string
  fecha_vencimiento: string
  archivo: File | null
  estado?: EstadoDocumentacionCliente
}

/**
 * Alta de un papel. Se usa desde los tres lugares donde se carga documentación:
 * el panel del agente, el modal de concretar y la vista del cliente.
 *
 * Es sólo el formulario: el título, el cierre y el fondo los pone el Modal que
 * lo contiene. Antes traía su propia tarjeta con título, pensada para vivir
 * dentro de un `<div className="fixed inset-0">` escrito a mano en cada
 * pantalla.
 *
 * El selector de estado solo aparece para el agente: si lo carga él es porque
 * ya vio el papel, así que puede darlo por aprobado en el acto. Lo que sube el
 * cliente siempre queda pendiente de revisión.
 */
export default function FormularioDocumento({
  permiteEstado = false,
  campoExtra,
  onGuardar,
  onCancelar,
}: {
  permiteEstado?: boolean
  /** Campos que solo tienen sentido en una pantalla; hoy, elegir el cliente. */
  campoExtra?: React.ReactNode
  onGuardar: (datos: DatosDocumento) => Promise<void>
  onCancelar: () => void
}) {
  const [descripcion, setDescripcion] = useState('')
  const [fechaVencimiento, setFechaVencimiento] = useState('')
  const [archivo, setArchivo] = useState<File | null>(null)
  const [estado, setEstado] = useState<EstadoDocumentacionCliente>('aprobada')
  const form = useFormularioApi()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const errores: Record<string, string> = {}
    if (descripcion.trim().length < 2) errores.descripcion = 'Escribí de qué documento se trata.'
    if (!fechaVencimiento) errores.fecha_vencimiento = 'Indicá hasta cuándo vale.'
    // Sin adjunto no hay nada que revisar; el backend también lo rechaza.
    if (!archivo) errores.base64 = 'Adjuntá el archivo del documento.'

    if (Object.keys(errores).length > 0) {
      form.setErroresCampo(errores)
      return
    }

    await form.enviar(() =>
      onGuardar({
        descripcion: descripcion.trim(),
        fecha_vencimiento: fechaVencimiento,
        archivo,
        ...(permiteEstado ? { estado } : {}),
      }),
    )
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      {form.error && (
        <p
          role="alert"
          className="rounded-lg border border-alerta-700/20 bg-alerta-50 px-4 py-3 text-sm text-alerta-700"
        >
          {form.error}
        </p>
      )}

      {campoExtra}

      <Campo etiqueta="Tipo de documento" error={form.erroresCampo.descripcion} requerido>
        {(props) => (
          <input
            {...props}
            type="text"
            placeholder="Recibo de sueldo, garantía propietaria, DNI…"
            value={descripcion}
            onChange={(e) => {
              setDescripcion(e.target.value)
              form.limpiarCampo('descripcion')
            }}
          />
        )}
      </Campo>

      <Campo
        etiqueta="Vence el"
        ayuda="Un documento vencido bloquea el cierre del alquiler."
        error={form.erroresCampo.fecha_vencimiento}
        requerido
      >
        {(props) => (
          <input
            {...props}
            type="date"
            value={fechaVencimiento}
            onChange={(e) => {
              setFechaVencimiento(e.target.value)
              form.limpiarCampo('fecha_vencimiento')
            }}
          />
        )}
      </Campo>

      <Campo etiqueta="Archivo" ayuda="PDF o imagen." error={form.erroresCampo.base64} requerido>
        {(props) => (
          <input
            {...props}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,.webp"
            onChange={(e) => {
              setArchivo(e.target.files?.[0] ?? null)
              form.limpiarCampo('base64')
            }}
            className={`${props.className} file:me-3 file:rounded-md file:border-0 file:bg-arena-200 file:px-3 file:py-1.5 file:text-sm file:text-tinta-900`}
          />
        )}
      </Campo>

      {archivo && (
        <p className="flex items-center gap-1.5 text-xs text-tinta-500">
          <PaperClipIcon className="size-4" aria-hidden="true" />
          {archivo.name}
        </p>
      )}

      {permiteEstado && (
        <Campo etiqueta="Estado">
          {(props) => (
            <select
              {...props}
              value={estado}
              onChange={(e) => setEstado(e.target.value as EstadoDocumentacionCliente)}
            >
              <option value="aprobada">Aprobada — ya verifiqué el papel</option>
              <option value="pendiente">Pendiente de revisión</option>
            </select>
          )}
        </Campo>
      )}

      <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
        <button type="button" onClick={onCancelar} className="accion accion-fantasma">
          Cancelar
        </button>
        <button type="submit" disabled={form.enviando} className="accion accion-primaria">
          {form.enviando ? 'Guardando…' : 'Guardar documento'}
        </button>
      </div>
    </form>
  )
}
