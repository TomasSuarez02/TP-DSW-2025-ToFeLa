import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CreditCardIcon, PencilSquareIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline'
import apiClient from '../../utils/apiClient'
import {
  actualizarEstadoSenia,
  cancelarSenia,
  concretarAlquiler,
  eliminarSenia,
  obtenerMisSenias,
  obtenerSenias,
} from '../../services/senias'
import {
  cargarDocumentoDeCliente,
  obtenerDocumentacionClientes,
} from '../../services/documentacionCliente'
import FormularioDocumento from '../../components/documentacion/FormularioDocumento'
import ListaDocumentos from '../../components/documentacion/ListaDocumentos'
import Modal from '../../components/Modal'
import Badge from '../../components/ui/Badge'
import Campo from '../../components/ui/Campo'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import EstadoVista from '../../components/ui/EstadoVista'
import Tabla, { type Columna } from '../../components/ui/Tabla'
import { useRecurso } from '../../hooks/useRecurso'
import { useFormularioApi } from '../../hooks/useFormularioApi'
import { useNotificacion } from '../../hooks/useNotificacion'
import { diasRestantes } from '../../config/senia'
import { formatearFecha, formatearMoneda } from '../../utils/formato'
import { TONO_ESTADO_SENIA } from '../../lib/estados'
import {
  documentacionEnRegla,
  ETIQUETAS_ESTADO_SENIA,
  refId,
  refObjeto,
  type ClienteRef,
  type DocumentacionCliente,
  type EstadoSenia,
  type MedioPago,
  type PropiedadRef,
  type Senia,
} from '../../types/senia'

interface SeniasProps {
  isAgent?: boolean
}

interface ClienteLista {
  id: number
  nombre: string
  apellido: string
}

type Filtro = 'todos' | EstadoSenia

const FILTROS: { id: Filtro; nombre: string }[] = [
  { id: 'todos', nombre: 'Todas' },
  { id: 'pendiente_pago', nombre: 'Pendientes de pago' },
  { id: 'confirmada', nombre: 'Confirmadas' },
  { id: 'vencida', nombre: 'Vencidas' },
  { id: 'cancelada', nombre: 'Canceladas' },
]

function nombreCliente(cliente?: number | ClienteRef): string {
  const obj = refObjeto<ClienteRef>(cliente)
  if (obj) {
    const nombre = `${obj.nombre ?? ''} ${obj.apellido ?? ''}`.trim()
    return nombre || obj.mail || `#${obj.id}`
  }
  const id = refId(cliente)
  return id ? `#${id}` : '—'
}

function nombrePropiedad(propiedad?: number | PropiedadRef): string {
  const obj = refObjeto<PropiedadRef>(propiedad)
  if (obj) return obj.direccion ?? `#${obj.id}`
  const id = refId(propiedad)
  return id ? `#${id}` : '—'
}

export default function Senias({ isAgent = true }: SeniasProps) {
  const navigate = useNavigate()
  const { notificar } = useNotificacion()

  const {
    datos: senias,
    cargando,
    error,
    recargar,
  } = useRecurso<Senia[]>(() => (isAgent ? obtenerSenias() : obtenerMisSenias()), [isAgent], [])

  // El formulario del agente pedía los ids de propiedad y cliente escritos a
  // mano en dos <input type="number">. Ahora son listas.
  const { datos: propiedades } = useRecurso<PropiedadRef[]>(
    async () => (isAgent ? ((await apiClient.get('/propiedades')).data?.data ?? []) : []),
    [isAgent],
    [],
  )

  const { datos: clientes } = useRecurso<ClienteLista[]>(
    async () => (isAgent ? ((await apiClient.get('/clientes')).data?.data ?? []) : []),
    [isAgent],
    [],
  )

  /** Toda la documentación presentada, para avisar antes de intentar concretar. */
  const { datos: presentaciones, recargar: recargarDocumentacion } = useRecurso<DocumentacionCliente[]>(
    async () => (isAgent ? await obtenerDocumentacionClientes() : []),
    [isAgent],
    [],
  )

  const docsPorCliente = useMemo(() => {
    const mapa = new Map<number, DocumentacionCliente[]>()
    for (const dc of presentaciones) {
      const id = refId(dc.cliente)
      if (!id) continue
      const previas = mapa.get(id) ?? []
      previas.push(dc)
      mapa.set(id, previas)
    }
    return mapa
  }, [presentaciones])

  const [filtro, setFiltro] = useState<Filtro>('todos')
  const [formAbierto, setFormAbierto] = useState(false)
  const [editando, setEditando] = useState<Senia | null>(null)
  const [formData, setFormData] = useState({ propiedad: '', cliente: '', importe: '' })
  const form = useFormularioApi()

  const [aEliminar, setAEliminar] = useState<Senia | null>(null)
  const [aCancelar, setACancelar] = useState<Senia | null>(null)
  const [aVencer, setAVencer] = useState<Senia | null>(null)
  const [concretando, setConcretando] = useState<Senia | null>(null)

  const visibles = filtro === 'todos' ? senias : senias.filter((s) => s.estado === filtro)

  const cambiar = (campo: keyof typeof formData, valor: string) => {
    setFormData((prev) => ({ ...prev, [campo]: valor }))
    form.limpiarCampo(campo)
  }

  const cerrarFormulario = () => {
    setFormAbierto(false)
    setEditando(null)
    setFormData({ propiedad: '', cliente: '', importe: '' })
    form.limpiar()
  }

  const abrirEdicion = (s: Senia) => {
    setEditando(s)
    setFormData({
      propiedad: String(refId(s.propiedad) ?? ''),
      cliente: String(refId(s.cliente) ?? ''),
      importe: String(s.importe ?? ''),
    })
    form.limpiar()
    setFormAbierto(true)
  }

  const precioDe = (propiedadId: number): number | undefined =>
    propiedades.find((p) => p.id === propiedadId)?.precio

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault()

    const errores: Record<string, string> = {}
    if (!editando && !formData.propiedad) errores.propiedad = 'Elegí la propiedad.'
    if (!editando && !formData.cliente) errores.cliente = 'Elegí el cliente.'

    const importe = Number(formData.importe)
    const propiedadId = Number(formData.propiedad) || refId(editando?.propiedad)
    const precio =
      (propiedadId ? precioDe(propiedadId) : undefined) ??
      refObjeto<PropiedadRef>(editando?.propiedad)?.precio

    if (!formData.importe.trim()) errores.importe = 'Ingresá el importe.'
    else if (!Number.isFinite(importe) || importe <= 0) errores.importe = 'Tiene que ser mayor a cero.'
    else if (precio !== undefined && importe > precio)
      errores.importe = `No puede superar el precio de la propiedad (${formatearMoneda(precio)}).`

    if (Object.keys(errores).length > 0) {
      form.setErroresCampo(errores)
      return
    }

    const ok = await form.enviar(async () => {
      const payload = { propiedad: propiedadId, cliente: Number(formData.cliente), importe }
      if (editando?.clave) await apiClient.put(`/senias/${editando.clave}`, payload)
      else await apiClient.post('/senias', payload)
    })

    if (!ok) return

    notificar(editando ? 'Seña actualizada' : 'Seña creada')
    cerrarFormulario()
    await recargar()
  }

  const eliminar = async (senia: Senia) => {
    // El backend libera la propiedad solo si la seña estaba confirmada
    // (senia.controler.ts). Acá se hacía además un PUT para liberarla a mano.
    await eliminarSenia(senia.clave)
    setAEliminar(null)
    notificar('Seña eliminada')
    await recargar()
  }

  const cancelar = async (senia: Senia) => {
    await cancelarSenia(senia.clave)
    setACancelar(null)
    notificar('Seña cancelada')
    await recargar()
  }

  const vencer = async (senia: Senia) => {
    // Cambiar el estado a 'vencida' ya dispara liberarPropiedad en el backend.
    await actualizarEstadoSenia(senia.clave, 'vencida')
    setAVencer(null)
    notificar('Seña vencida', 'exito', 'La propiedad volvió a quedar disponible.')
    await recargar()
  }

  const concretar = async (
    senia: Senia,
    datos: { fecha_inicio: string; fecha_fin: string; medioPago: MedioPago },
  ) => {
    const resultado = await concretarAlquiler(senia.clave, datos)
    setConcretando(null)
    notificar(
      'Alquiler registrado',
      'exito',
      `${formatearMoneda(resultado.alquiler.monto_mensual)} por mes · saldo cobrado ${formatearMoneda(
        resultado.saldoCobrado,
      )}.`,
    )
    await recargar()
  }

  const columnas: Columna<Senia>[] = [
    {
      id: 'propiedad',
      encabezado: 'Propiedad',
      principal: true,
      celda: (s) => (
        <div className="min-w-0">
          <p className="truncate font-medium text-tinta-900">{nombrePropiedad(s.propiedad)}</p>
          {isAgent && <p className="truncate text-xs text-tinta-500">{nombreCliente(s.cliente)}</p>}
        </div>
      ),
    },
    {
      id: 'importe',
      encabezado: 'Importe',
      alinear: 'derecha',
      celda: (s) => <span className="font-medium text-terra-600">{formatearMoneda(s.importe)}</span>,
    },
    {
      id: 'estado',
      encabezado: 'Estado',
      celda: (s) => <EstadoSeniaCelda senia={s} isAgent={isAgent} documentos={docsPorCliente.get(refId(s.cliente) ?? -1)} />,
    },
    {
      id: 'vencimiento',
      encabezado: 'Reserva',
      ocultarEnMobile: true,
      celda: (s) => <Vencimiento senia={s} />,
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="font-display text-2xl text-tinta-900">{isAgent ? 'Señas' : 'Mis señas'}</h1>
          <p className="mt-0.5 text-sm text-tinta-500">
            {isAgent
              ? 'Reservas tomadas y su estado de pago.'
              : 'Las propiedades que reservaste y lo que falta para cerrarlas.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <label htmlFor="filtro-senias" className="sr-only">
            Filtrar señas por estado
          </label>
          <select
            id="filtro-senias"
            value={filtro}
            onChange={(e) => setFiltro(e.target.value as Filtro)}
            className="rounded-lg border border-arena-300 bg-white px-3 py-2 text-sm text-tinta-900"
          >
            {FILTROS.map((f) => (
              <option key={f.id} value={f.id}>
                {f.nombre}
              </option>
            ))}
          </select>

          {isAgent && (
            <button type="button" onClick={() => setFormAbierto(true)} className="accion accion-primaria">
              <PlusIcon className="size-5" aria-hidden="true" />
              Nueva seña
            </button>
          )}
        </div>
      </div>

      <EstadoVista
        cargando={cargando}
        error={error}
        vacio={visibles.length === 0}
        onReintentar={recargar}
        mensajeVacio={senias.length === 0 ? 'Todavía no hay señas' : 'Ninguna seña con ese estado'}
        detalleVacio={
          senias.length === 0
            ? isAgent
              ? 'Cuando un cliente reserve una propiedad, aparece acá.'
              : 'Cuando reserves una propiedad, la vas a ver en esta lista.'
            : 'Probá con otro estado.'
        }
      >
        <Tabla
          datos={visibles}
          columnas={columnas}
          claveFila={(s) => s.clave}
          acciones={(s) =>
            isAgent ? (
              <>
                {s.estado === 'confirmada' && !s.concretada && (
                  <button
                    type="button"
                    onClick={() => setConcretando(s)}
                    className="accion accion-secundaria accion-sm"
                  >
                    Concretar
                  </button>
                )}
                {s.estado === 'confirmada' && esVencida(s) && (
                  <button type="button" onClick={() => setAVencer(s)} className="accion accion-fantasma accion-sm">
                    Vencer
                  </button>
                )}
                <button type="button" onClick={() => abrirEdicion(s)} className="accion accion-fantasma accion-sm">
                  <PencilSquareIcon className="size-4" aria-hidden="true" />
                  <span className="sr-only">Editar la seña de {nombrePropiedad(s.propiedad)}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAEliminar(s)}
                  className="accion accion-fantasma accion-sm text-alerta-700 hover:bg-alerta-50"
                >
                  <TrashIcon className="size-4" aria-hidden="true" />
                  <span className="sr-only">Eliminar la seña de {nombrePropiedad(s.propiedad)}</span>
                </button>
              </>
            ) : (
              s.estado === 'pendiente_pago' && (
                <>
                  <button
                    type="button"
                    onClick={() => navigate(`/checkout/${s.clave}`)}
                    className="accion accion-primaria accion-sm"
                  >
                    <CreditCardIcon className="size-4" aria-hidden="true" />
                    Pagar seña
                  </button>
                  <button type="button" onClick={() => setACancelar(s)} className="accion accion-fantasma accion-sm">
                    Cancelar
                  </button>
                </>
              )
            )
          }
        />
      </EstadoVista>

      {/* --- Alta y edición (solo agente) ---------------------------------- */}
      <Modal
        open={formAbierto}
        onClose={cerrarFormulario}
        titulo={editando ? 'Editar seña' : 'Nueva seña'}
        descripcion={
          editando
            ? 'La propiedad y el cliente son parte de la clave: no se pueden cambiar.'
            : 'Nace pendiente de pago; la propiedad se retiene al confirmarla.'
        }
        pie={
          <>
            <button type="button" onClick={cerrarFormulario} className="accion accion-fantasma">
              Cancelar
            </button>
            <button type="submit" form="form-senia" disabled={form.enviando} className="accion accion-primaria">
              {form.enviando ? 'Guardando…' : editando ? 'Guardar cambios' : 'Crear seña'}
            </button>
          </>
        }
      >
        <form id="form-senia" onSubmit={guardar} noValidate className="space-y-4">
          {form.error && (
            <p
              role="alert"
              className="rounded-lg border border-alerta-700/20 bg-alerta-50 px-4 py-3 text-sm text-alerta-700"
            >
              {form.error}
            </p>
          )}

          {editando ? (
            <div className="rounded-lg border border-arena-200 bg-arena-50 px-4 py-3">
              <p className="text-sm font-medium text-tinta-900">{nombrePropiedad(editando.propiedad)}</p>
              <p className="text-xs text-tinta-500">{nombreCliente(editando.cliente)}</p>
            </div>
          ) : (
            <>
              <Campo etiqueta="Propiedad" error={form.erroresCampo.propiedad} requerido>
                {(props) => (
                  <select {...props} value={formData.propiedad} onChange={(e) => cambiar('propiedad', e.target.value)}>
                    <option value="">Elegí una propiedad</option>
                    {propiedades.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.direccion ?? `#${p.id}`}
                        {p.precio !== undefined && ` — ${formatearMoneda(p.precio)}`}
                      </option>
                    ))}
                  </select>
                )}
              </Campo>

              <Campo etiqueta="Cliente" error={form.erroresCampo.cliente} requerido>
                {(props) => (
                  <select {...props} value={formData.cliente} onChange={(e) => cambiar('cliente', e.target.value)}>
                    <option value="">Elegí un cliente</option>
                    {clientes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nombre} {c.apellido}
                      </option>
                    ))}
                  </select>
                )}
              </Campo>
            </>
          )}

          <Campo etiqueta="Importe" error={form.erroresCampo.importe} requerido>
            {(props) => (
              <input
                {...props}
                type="number"
                min="0"
                step="1000"
                value={formData.importe}
                onChange={(e) => cambiar('importe', e.target.value)}
              />
            )}
          </Campo>
        </form>
      </Modal>

      {concretando && (
        <ModalConcretar
          senia={concretando}
          documentos={docsPorCliente.get(refId(concretando.cliente) ?? -1) ?? []}
          onDocumentosCambiados={recargarDocumentacion}
          onCancelar={() => setConcretando(null)}
          onConfirmar={(datos) => concretar(concretando, datos)}
        />
      )}

      <ConfirmDialog
        open={aEliminar !== null}
        titulo="Eliminar seña"
        descripcion="Si la seña estaba confirmada, la propiedad vuelve a quedar disponible."
        detalle={aEliminar ? `${nombrePropiedad(aEliminar.propiedad)} · ${formatearMoneda(aEliminar.importe)}` : undefined}
        textoConfirmar="Eliminar"
        onConfirmar={() => (aEliminar ? eliminar(aEliminar) : undefined)}
        onCancelar={() => setAEliminar(null)}
      />

      <ConfirmDialog
        open={aCancelar !== null}
        titulo="Cancelar la seña"
        descripcion="La reserva se da de baja y la propiedad queda libre para otro cliente."
        detalle={aCancelar ? nombrePropiedad(aCancelar.propiedad) : undefined}
        textoConfirmar="Cancelar seña"
        textoCancelar="Volver"
        onConfirmar={() => (aCancelar ? cancelar(aCancelar) : undefined)}
        onCancelar={() => setACancelar(null)}
      />

      <ConfirmDialog
        open={aVencer !== null}
        titulo="Vencer la reserva"
        descripcion="El plazo se dio por terminado: la propiedad vuelve al listado."
        detalle={aVencer ? nombrePropiedad(aVencer.propiedad) : undefined}
        textoConfirmar="Vencer y liberar"
        onConfirmar={() => (aVencer ? vencer(aVencer) : undefined)}
        onCancelar={() => setAVencer(null)}
      />
    </div>
  )
}

const esVencida = (senia: Senia) => {
  const dias = diasRestantes(senia.fechaVencimiento)
  return dias !== null && dias < 0
}

/** El estado, más la única línea de contexto que hace falta en cada caso. */
function EstadoSeniaCelda({
  senia,
  isAgent,
  documentos,
}: {
  senia: Senia
  isAgent: boolean
  documentos?: DocumentacionCliente[]
}) {
  const sinDocumentacion = !documentos || documentos.length === 0
  const docsEnRegla = !sinDocumentacion && documentacionEnRegla(documentos)

  return (
    <div className="flex flex-col items-start gap-1">
      <Badge tono={TONO_ESTADO_SENIA[senia.estado]}>{ETIQUETAS_ESTADO_SENIA[senia.estado]}</Badge>

      {senia.concretada && (
        <span className="text-xs text-salvia-700">Alquiler concretado</span>
      )}

      {isAgent && senia.estado === 'confirmada' && !senia.concretada && !docsEnRegla && (
        <span className="text-xs text-ambar-700">
          {sinDocumentacion ? 'Sin documentación presentada' : 'Falta aprobar documentación'}
        </span>
      )}

      {!isAgent && senia.estado === 'pendiente_pago' && (
        <span className="text-xs text-ambar-700">La propiedad no queda reservada hasta pagarla</span>
      )}

      {senia.pago?.estado === 'aprobado' && senia.pago.ultimosCuatro && (
        <span className="text-xs text-tinta-500">
          Pagada el {formatearFecha(senia.pago.fecha)} · ****{senia.pago.ultimosCuatro}
        </span>
      )}
    </div>
  )
}

function Vencimiento({ senia }: { senia: Senia }) {
  if (senia.estado !== 'confirmada' || !senia.fechaVencimiento) {
    return <span className="text-sm text-tinta-500">—</span>
  }

  const dias = diasRestantes(senia.fechaVencimiento)
  const vencida = dias !== null && dias < 0

  return (
    <div className="text-sm">
      <p className={vencida ? 'text-alerta-700' : 'text-tinta-700'}>
        {formatearFecha(senia.fechaVencimiento)}
      </p>
      {dias !== null && (
        <p className="text-xs text-tinta-500">
          {vencida ? 'Vencida' : `${dias} ${dias === 1 ? 'día restante' : 'días restantes'}`}
        </p>
      )}
    </div>
  )
}

/**
 * Cierre del alquiler. La seña es un adelanto del primer mes, así que el saldo
 * a cobrar es el precio de la propiedad menos lo ya señado.
 *
 * La documentación se resuelve acá mismo: se muestra lo que el cliente ya tenía
 * cargado y se puede aprobar, rechazar o sumar lo que falte sin salir del flujo.
 * `Confirmar` queda bloqueado hasta que esté todo aprobado y vigente, que es la
 * misma condición que valida el backend.
 */
function ModalConcretar({
  senia,
  documentos,
  onDocumentosCambiados,
  onCancelar,
  onConfirmar,
}: {
  senia: Senia
  documentos: DocumentacionCliente[]
  onDocumentosCambiados: () => void
  onCancelar: () => void
  onConfirmar: (datos: { fecha_inicio: string; fecha_fin: string; medioPago: MedioPago }) => Promise<void>
}) {
  const hoy = new Date().toISOString().slice(0, 10)
  const enUnAnio = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)

  const [fechaInicio, setFechaInicio] = useState(hoy)
  const [fechaFin, setFechaFin] = useState(enUnAnio)
  const [medioPago, setMedioPago] = useState<MedioPago>('efectivo')
  const [subiendoDoc, setSubiendoDoc] = useState(false)
  const form = useFormularioApi()

  const precio = refObjeto<PropiedadRef>(senia.propiedad)?.precio
  const saldo = precio !== undefined ? Math.max(0, precio - senia.importe) : undefined
  const clienteId = refId(senia.cliente)
  const enRegla = documentacionEnRegla(documentos)

  const subirDocumento = async (datos: {
    descripcion: string
    fecha_vencimiento: string
    archivo: File | null
    estado?: DocumentacionCliente['estado']
  }) => {
    if (!clienteId) throw new Error('No se pudo identificar al cliente de la seña')

    await cargarDocumentoDeCliente({
      clienteId,
      descripcion: datos.descripcion,
      fecha_vencimiento: datos.fecha_vencimiento,
      archivo: datos.archivo,
      estado: datos.estado,
    })

    setSubiendoDoc(false)
    onDocumentosCambiados()
  }

  const confirmar = async () => {
    await form.enviar(() => onConfirmar({ fecha_inicio: fechaInicio, fecha_fin: fechaFin, medioPago }))
  }

  if (subiendoDoc) {
    return (
      <Modal
        open
        onClose={() => setSubiendoDoc(false)}
        titulo="Agregar documento"
        descripcion={`Se carga a nombre de ${nombreCliente(senia.cliente)}.`}
      >
        <FormularioDocumento
          permiteEstado
          onGuardar={subirDocumento}
          onCancelar={() => setSubiendoDoc(false)}
        />
      </Modal>
    )
  }

  return (
    <Modal
      open
      onClose={onCancelar}
      ancho="lg"
      titulo="Concretar alquiler"
      descripcion={`${nombreCliente(senia.cliente)} · ${nombrePropiedad(senia.propiedad)}`}
      pie={
        <>
          <button type="button" onClick={onCancelar} className="accion accion-fantasma">
            Cancelar
          </button>
          <button
            type="button"
            onClick={confirmar}
            disabled={fechaFin <= fechaInicio || !enRegla || form.enviando}
            title={!enRegla ? 'Falta aprobar la documentación del cliente' : undefined}
            className="accion accion-primaria"
          >
            {form.enviando ? 'Registrando…' : 'Confirmar alquiler'}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        {form.error && (
          <p
            role="alert"
            className="rounded-lg border border-alerta-700/20 bg-alerta-50 px-4 py-3 text-sm text-alerta-700"
          >
            {form.error}
          </p>
        )}

        <section className="rounded-lg border border-arena-200 p-4">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
            <h3 className="font-medium text-tinta-900">Documentación del cliente</h3>
            <button
              type="button"
              onClick={() => setSubiendoDoc(true)}
              className="accion accion-secundaria accion-sm"
            >
              <PlusIcon className="size-4" aria-hidden="true" />
              Agregar
            </button>
          </div>

          <ListaDocumentos
            items={documentos}
            isAgent
            onCambio={onDocumentosCambiados}
            vacio="El cliente no presentó documentación. Cargá los papeles para poder cerrar."
          />

          {!enRegla && documentos.length > 0 && (
            <p className="mt-3 text-sm text-ambar-700">
              Falta aprobar, o está vencido, alguno de los papeles.
            </p>
          )}
        </section>

        <dl className="space-y-1 rounded-lg border border-arena-200 bg-arena-50 p-4 text-sm">
          <div className="flex justify-between">
            <dt className="text-tinta-500">Alquiler mensual</dt>
            <dd className="text-tinta-900 tabular-nums">
              {precio !== undefined ? formatearMoneda(precio) : '—'}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-tinta-500">Ya señado</dt>
            <dd className="text-tinta-900 tabular-nums">− {formatearMoneda(senia.importe)}</dd>
          </div>
          <div className="flex justify-between border-t border-arena-200 pt-1.5">
            <dt className="font-medium text-tinta-900">Saldo a cobrar</dt>
            <dd className="font-semibold text-terra-600 tabular-nums">
              {saldo !== undefined ? formatearMoneda(saldo) : '—'}
            </dd>
          </div>
        </dl>

        <div className="grid gap-4 sm:grid-cols-2">
          <Campo etiqueta="Inicio del contrato">
            {(props) => (
              <input {...props} type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} />
            )}
          </Campo>

          <Campo
            etiqueta="Fin del contrato"
            error={fechaFin <= fechaInicio ? 'Tiene que ser posterior al inicio.' : undefined}
          >
            {(props) => (
              <input {...props} type="date" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} />
            )}
          </Campo>
        </div>

        <Campo etiqueta="Cómo se cobró el saldo">
          {(props) => (
            <select {...props} value={medioPago} onChange={(e) => setMedioPago(e.target.value as MedioPago)}>
              <option value="efectivo">Efectivo</option>
              <option value="transferencia">Transferencia</option>
              <option value="tarjeta">Tarjeta</option>
            </select>
          )}
        </Campo>
      </div>
    </Modal>
  )
}
