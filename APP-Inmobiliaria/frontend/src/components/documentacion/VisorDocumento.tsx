import { useEffect, useState } from 'react'
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline'
import { parseApiError } from '../../utils/apiErrors'
import {
  descargarDocumentacion,
  obtenerArchivoDocumentacion,
} from '../../services/documentaciones'
import { formatearFecha } from '../../utils/formato'
import Modal from '../Modal'
import { useNotificacion } from '../../hooks/useNotificacion'
import type { DocumentacionRef, EstadoDocumentacionCliente } from '../../types/senia'

/**
 * Muestra el papel en pantalla para poder revisarlo antes de decidir.
 *
 * Los PDF van en un `<iframe>` y las imágenes en un `<img>`; el archivo se baja
 * por XHR (la ruta exige token) y se muestra como blob. Aprobar y rechazar
 * están acá adentro a propósito: la decisión se toma mirando el documento, no
 * desde la lista.
 */
export default function VisorDocumento({
  documento,
  isAgent,
  onRevisar,
  onCerrar,
}: {
  documento: DocumentacionRef
  isAgent: boolean
  onRevisar?: (estado: EstadoDocumentacionCliente) => void
  onCerrar: () => void
}) {
  const { notificar } = useNotificacion()
  const [url, setUrl] = useState<string | null>(null)
  const [tipo, setTipo] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let revocar: string | null = null
    let cancelado = false

    obtenerArchivoDocumentacion(documento.id)
      .then(({ url: creada, tipo: mime }) => {
        // Si el modal se cerró mientras bajaba, se libera y no se setea estado.
        if (cancelado) {
          URL.revokeObjectURL(creada)
          return
        }
        revocar = creada
        setUrl(creada)
        setTipo(mime)
      })
      .catch((err) => {
        if (!cancelado) setError(parseApiError(err).message)
      })

    return () => {
      cancelado = true
      if (revocar) URL.revokeObjectURL(revocar)
    }
  }, [documento.id])

  const esImagen = tipo.startsWith('image/')
  const vencido = documento.fecha_vencimiento
    ? new Date(documento.fecha_vencimiento) < new Date()
    : false

  const descargar = () => {
    descargarDocumentacion(documento.id, documento.path).catch((err) =>
      notificar('No se pudo descargar', 'error', parseApiError(err).message),
    )
  }

  return (
    <Modal
      open
      onClose={onCerrar}
      ancho="xl"
      titulo={documento.descripcion ?? `Documento #${documento.id}`}
      descripcion={`${vencido ? 'Vencido el' : 'Vence el'} ${formatearFecha(documento.fecha_vencimiento)}`}
      pie={
        <>
          <button type="button" onClick={descargar} className="accion accion-secundaria sm:me-auto">
            <ArrowDownTrayIcon className="size-4" aria-hidden="true" />
            Descargar
          </button>

          {isAgent && onRevisar && (
            <>
              <button
                type="button"
                onClick={() => onRevisar('rechazada')}
                className="accion accion-secundaria"
              >
                Rechazar
              </button>
              <button
                type="button"
                onClick={() => onRevisar('aprobada')}
                className="accion accion-primaria"
              >
                Aprobar
              </button>
            </>
          )}
        </>
      }
    >
      <div className="flex h-[60vh] items-center justify-center overflow-auto rounded-lg border border-arena-200 bg-arena-50">
        {error ? (
          <p className="p-6 text-center text-sm text-alerta-700">{error}</p>
        ) : !url ? (
          <p className="p-6 text-sm text-tinta-500">Cargando documento…</p>
        ) : esImagen ? (
          <img src={url} alt={documento.descripcion ?? 'Documento'} className="max-w-full" />
        ) : (
          <iframe src={url} title="Documento" className="size-full border-0" />
        )}
      </div>
    </Modal>
  )
}
