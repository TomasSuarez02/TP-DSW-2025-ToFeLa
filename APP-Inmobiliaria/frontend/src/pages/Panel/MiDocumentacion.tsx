import { useState } from 'react'
import { ArrowUpTrayIcon, CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import { useAuth } from '../../auth/useAuth'
import FormularioDocumento from '../../components/documentacion/FormularioDocumento'
import ListaDocumentos from '../../components/documentacion/ListaDocumentos'
import Modal from '../../components/Modal'
import EstadoVista from '../../components/ui/EstadoVista'
import { useRecurso } from '../../hooks/useRecurso'
import { useNotificacion } from '../../hooks/useNotificacion'
import {
  cargarDocumentoDeCliente,
  obtenerMiDocumentacion,
} from '../../services/documentacionCliente'
import { documentacionEnRegla, type DocumentacionCliente } from '../../types/senia'

/**
 * El cliente sube sus propios papeles y ve en qué quedó la revisión.
 *
 * Todo lo que carga acá entra como `pendiente`: la aprobación es del agente. La
 * ventaja es que puede mandarlos antes de ir a la inmobiliaria, y el día que se
 * concreta el alquiler ya están revisados.
 */
export default function MiDocumentacion() {
  const { userId } = useAuth()
  const { notificar } = useNotificacion()
  const [formAbierto, setFormAbierto] = useState(false)

  const {
    datos: items,
    cargando,
    error,
    recargar,
  } = useRecurso<DocumentacionCliente[]>(() => obtenerMiDocumentacion(), [], [])

  const guardar = async (datos: {
    descripcion: string
    fecha_vencimiento: string
    archivo: File | null
  }) => {
    if (!userId) throw new Error('Volvé a iniciar sesión para cargar documentación')

    // Sin `estado`: lo que sube el cliente queda pendiente de revisión.
    await cargarDocumentoDeCliente({
      clienteId: userId,
      descripcion: datos.descripcion,
      fecha_vencimiento: datos.fecha_vencimiento,
      archivo: datos.archivo,
    })

    setFormAbierto(false)
    notificar('Documento enviado', 'exito', 'Un agente lo va a revisar.')
    await recargar()
  }

  const enRegla = documentacionEnRegla(items)
  const rechazados = items.filter((dc) => dc.estado === 'rechazada').length

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="max-w-prose">
          <h1 className="font-display text-2xl text-tinta-900">Mi documentación</h1>
          <p className="mt-0.5 text-sm leading-relaxed text-tinta-500">
            Subí los papeles que te piden para alquilar. Un agente los revisa y, si están en regla,
            el día de la firma no tenés que traer nada más.
          </p>
        </div>

        <button type="button" onClick={() => setFormAbierto(true)} className="accion accion-primaria shrink-0">
          <ArrowUpTrayIcon className="size-5" aria-hidden="true" />
          Subir documento
        </button>
      </div>

      {!cargando && items.length > 0 && (
        <p
          className={`flex items-start gap-3 rounded-card border px-4 py-3 text-sm leading-relaxed ${
            enRegla
              ? 'border-salvia-500/30 bg-salvia-100 text-salvia-700'
              : 'border-ambar-700/20 bg-ambar-50 text-ambar-700'
          }`}
        >
          {enRegla ? (
            <CheckCircleIcon className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
          ) : (
            <ExclamationTriangleIcon className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
          )}
          <span>
            {enRegla
              ? 'Tu documentación está aprobada y vigente. Podés cerrar el alquiler.'
              : rechazados > 0
                ? `Tenés ${rechazados} ${
                    rechazados === 1 ? 'documento rechazado' : 'documentos rechazados'
                  }. Mirá el motivo abajo y volvé a subirlo corregido.`
                : 'Tus documentos están pendientes de revisión.'}
          </span>
        </p>
      )}

      <EstadoVista
        cargando={cargando}
        error={error}
        vacio={items.length === 0}
        onReintentar={recargar}
        mensajeVacio="Todavía no subiste ningún documento"
        detalleVacio="Suelen pedirte DNI, recibo de sueldo y una garantía."
        accionVacio={
          <button type="button" onClick={() => setFormAbierto(true)} className="accion accion-primaria accion-sm">
            <ArrowUpTrayIcon className="size-4" aria-hidden="true" />
            Subir documento
          </button>
        }
      >
        <div className="rounded-card border border-arena-200 bg-white p-5 shadow-card">
          <ListaDocumentos items={items} isAgent={false} onCambio={recargar} />
        </div>
      </EstadoVista>

      <Modal
        open={formAbierto}
        onClose={() => setFormAbierto(false)}
        titulo="Subir documento"
        descripcion="Queda pendiente hasta que un agente lo revise."
      >
        <FormularioDocumento onGuardar={guardar} onCancelar={() => setFormAbierto(false)} />
      </Modal>
    </div>
  )
}
