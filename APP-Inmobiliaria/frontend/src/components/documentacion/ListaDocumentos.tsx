import { useState } from 'react'
import { EyeIcon, TrashIcon } from '@heroicons/react/24/outline'
import { formatearFecha } from '../../utils/formato'
import Badge from '../ui/Badge'
import Campo from '../ui/Campo'
import ConfirmDialog from '../ui/ConfirmDialog'
import Modal from '../Modal'
import { TONO_ESTADO_DOC } from '../../lib/estados'
import { useNotificacion } from '../../hooks/useNotificacion'
import { useFormularioApi } from '../../hooks/useFormularioApi'
import { eliminarPresentacion, revisarDocumentacion } from '../../services/documentacionCliente'
import VisorDocumento from './VisorDocumento'
import {
  ETIQUETAS_ESTADO_DOC,
  refId,
  refObjeto,
  type DocumentacionCliente,
  type DocumentacionRef,
  type EstadoDocumentacionCliente,
} from '../../types/senia'

/**
 * Lista de papeles presentados por un cliente, con sus acciones.
 *
 * El agente aprueba, rechaza y da de baja; el cliente solo ve el estado y puede
 * retirar lo que todavía no le aprobaron (esa misma regla la valida el backend,
 * acá solo se esconde el botón).
 *
 * Para aprobar hay que haber abierto el documento antes: aprobar a ciegas desde
 * la lista es exactamente lo que no queremos que pase.
 */
export default function ListaDocumentos({
  items,
  isAgent,
  onCambio,
  vacio = 'No hay documentación cargada.',
}: {
  items: DocumentacionCliente[]
  isAgent: boolean
  /** Se llama después de aprobar, rechazar o eliminar, para refrescar. */
  onCambio: () => void
  vacio?: string
}) {
  const { notificar } = useNotificacion()

  /** Documento abierto en el visor, con el papel ya resuelto. */
  const [viendo, setViendo] = useState<{ dc: DocumentacionCliente; doc: DocumentacionRef } | null>(null)
  /** Ids ya inspeccionados en esta pantalla; habilitan el botón de aprobar. */
  const [inspeccionados, setInspeccionados] = useState<Set<number>>(new Set())
  const [aRechazar, setARechazar] = useState<DocumentacionCliente | null>(null)
  const [aEliminar, setAEliminar] = useState<DocumentacionCliente | null>(null)

  const abrirVisor = (dc: DocumentacionCliente, doc: DocumentacionRef) => {
    setInspeccionados((previos) => new Set(previos).add(doc.id))
    setViendo({ dc, doc })
  }

  const revisar = async (
    dc: DocumentacionCliente,
    estado: EstadoDocumentacionCliente,
    observaciones?: string,
  ) => {
    const docId = refId(dc.documentacion)
    const cliId = refId(dc.cliente)
    if (!docId || !cliId) return

    await revisarDocumentacion(docId, cliId, estado, observaciones)
    setViendo(null)
    notificar(estado === 'aprobada' ? 'Documento aprobado' : 'Documento rechazado')
    onCambio()
  }

  const eliminar = async (dc: DocumentacionCliente) => {
    const docId = refId(dc.documentacion)
    const cliId = refId(dc.cliente)
    if (!docId || !cliId) return

    await eliminarPresentacion(docId, cliId)
    setAEliminar(null)
    notificar('Documento eliminado')
    onCambio()
  }

  if (items.length === 0) {
    return <p className="py-3 text-sm text-tinta-500">{vacio}</p>
  }

  return (
    <>
      <ul className="divide-y divide-arena-200">
        {items.map((dc) => {
        const doc = refObjeto<DocumentacionRef>(dc.documentacion)
        const docId = refId(dc.documentacion)
        const cliId = refId(dc.cliente)
        const vencido = doc?.fecha_vencimiento ? new Date(doc.fecha_vencimiento) < new Date() : false
        const puedeEliminar = isAgent || dc.estado !== 'aprobada'
        const inspeccionado = docId !== undefined && inspeccionados.has(docId)

        return (
          <li key={`${docId}-${cliId}`} className="flex flex-wrap items-center gap-3 py-3">
            <div className="min-w-[200px] flex-1">
              <p className="text-sm font-medium text-tinta-900">
                {doc?.descripcion ?? `Documento #${docId}`}
              </p>
              <p className={`text-xs ${vencido ? 'text-alerta-700' : 'text-tinta-500'}`}>
                {vencido ? 'Vencido el ' : 'Vence el '}
                {formatearFecha(doc?.fecha_vencimiento)}
                {dc.observaciones && ` · ${dc.observaciones}`}
              </p>
            </div>

            <Badge tono={TONO_ESTADO_DOC[dc.estado]}>{ETIQUETAS_ESTADO_DOC[dc.estado]}</Badge>

            {doc?.path && (
              <button
                type="button"
                onClick={() => abrirVisor(dc, doc)}
                className="accion accion-secundaria accion-sm"
              >
                <EyeIcon className="size-4" aria-hidden="true" />
                Inspeccionar
              </button>
            )}

            {isAgent && dc.estado !== 'aprobada' && (
              <button
                type="button"
                onClick={() => revisar(dc, 'aprobada')}
                disabled={!inspeccionado}
                title={inspeccionado ? undefined : 'Inspeccioná el documento antes de aprobarlo'}
                className="accion accion-primaria accion-sm"
              >
                Aprobar
              </button>
            )}

            {isAgent && dc.estado !== 'rechazada' && (
              <button
                type="button"
                onClick={() => setARechazar(dc)}
                className="accion accion-fantasma accion-sm"
              >
                Rechazar
              </button>
            )}

            {puedeEliminar && (
              <button
                type="button"
                onClick={() => setAEliminar(dc)}
                className="accion accion-fantasma accion-sm text-alerta-700 hover:bg-alerta-50"
              >
                <TrashIcon className="size-4" aria-hidden="true" />
                <span className="sr-only">Eliminar {doc?.descripcion ?? 'el documento'}</span>
              </button>
            )}
            </li>
          )
        })}
      </ul>

      {viendo && (
        <VisorDocumento
          documento={viendo.doc}
          isAgent={isAgent}
          onRevisar={
            isAgent
              ? (estado) => {
                  if (estado === 'rechazada') {
                    setARechazar(viendo.dc)
                    setViendo(null)
                    return
                  }
                  void revisar(viendo.dc, estado)
                }
              : undefined
          }
          onCerrar={() => setViendo(null)}
        />
      )}

      {aRechazar && (
        <DialogoRechazo
          onCancelar={() => setARechazar(null)}
          onConfirmar={async (observaciones) => {
            await revisar(aRechazar, 'rechazada', observaciones)
            setARechazar(null)
          }}
        />
      )}

      <ConfirmDialog
        open={aEliminar !== null}
        titulo="Eliminar documento"
        descripcion="Se borra la presentación y su archivo del servidor."
        detalle={
          aEliminar
            ? (refObjeto<DocumentacionRef>(aEliminar.documentacion)?.descripcion ?? 'Documento')
            : undefined
        }
        textoConfirmar="Eliminar"
        onConfirmar={() => (aEliminar ? eliminar(aEliminar) : undefined)}
        onCancelar={() => setAEliminar(null)}
      />
    </>
  )
}

/**
 * El motivo del rechazo se pedía con `prompt()`: una caja del sistema operativo
 * que bloquea el hilo, no se puede estilar y en la que no se ve qué documento
 * se está rechazando. Además, cancelarla devolvía null y el rechazo se aplicaba
 * igual, sin observaciones.
 */
function DialogoRechazo({
  onCancelar,
  onConfirmar,
}: {
  onCancelar: () => void
  onConfirmar: (observaciones?: string) => Promise<void>
}) {
  const [motivo, setMotivo] = useState('')
  const form = useFormularioApi()

  return (
    <Modal
      open
      onClose={onCancelar}
      titulo="Rechazar documento"
      descripcion="El cliente ve el motivo y puede volver a subirlo corregido."
      pie={
        <>
          <button type="button" onClick={onCancelar} className="accion accion-fantasma">
            Cancelar
          </button>
          <button
            type="submit"
            form="form-rechazo"
            disabled={form.enviando}
            className="accion accion-peligro"
          >
            {form.enviando ? 'Rechazando…' : 'Rechazar'}
          </button>
        </>
      }
    >
      <form
        id="form-rechazo"
        noValidate
        onSubmit={async (e) => {
          e.preventDefault()
          await form.enviar(() => onConfirmar(motivo.trim() || undefined))
        }}
      >
        {form.error && (
          <p
            role="alert"
            className="mb-4 rounded-lg border border-alerta-700/20 bg-alerta-50 px-4 py-3 text-sm text-alerta-700"
          >
            {form.error}
          </p>
        )}

        <Campo etiqueta="Motivo" ayuda="Opcional, pero le ahorra un viaje al cliente.">
          {(props) => (
            <textarea
              {...props}
              rows={3}
              placeholder="Está vencido, no se lee, falta la firma…"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              className={`${props.className} resize-y`}
            />
          )}
        </Campo>
      </form>
    </Modal>
  )
}
