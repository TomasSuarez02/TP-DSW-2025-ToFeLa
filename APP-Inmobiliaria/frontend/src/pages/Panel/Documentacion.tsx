import { useMemo, useState } from 'react'
import { MagnifyingGlassIcon, PlusIcon } from '@heroicons/react/24/outline'
import apiClient from '../../utils/apiClient'
import FormularioDocumento from '../../components/documentacion/FormularioDocumento'
import ListaDocumentos from '../../components/documentacion/ListaDocumentos'
import Modal from '../../components/Modal'
import Badge from '../../components/ui/Badge'
import Campo from '../../components/ui/Campo'
import EstadoVista from '../../components/ui/EstadoVista'
import { useRecurso } from '../../hooks/useRecurso'
import { useNotificacion } from '../../hooks/useNotificacion'
import {
  cargarDocumentoDeCliente,
  obtenerDocumentacionClientes,
} from '../../services/documentacionCliente'
import {
  documentacionEnRegla,
  refId,
  refObjeto,
  type ClienteRef,
  type DocumentacionCliente,
} from '../../types/senia'

interface Cliente {
  id: number
  nombre: string
  apellido: string
  mail?: string
}

function nombreCompleto(cliente: ClienteRef): string {
  return `${cliente.nombre ?? ''} ${cliente.apellido ?? ''}`.trim() || `Cliente #${cliente.id}`
}

/**
 * Registro de los papeles que hacen falta para cerrar un alquiler.
 *
 * Es la vista transversal: sirve para cargar documentación por adelantado
 * (cuando el cliente la manda antes de venir) y para consultar rápido el estado
 * de un cliente sin tener que entrar por la propiedad. El cierre en sí se hace
 * desde el modal de concretar en Señas, que reusa estos mismos componentes.
 */
export default function Documentacion() {
  const { notificar } = useNotificacion()
  const [busqueda, setBusqueda] = useState('')
  const [formAbierto, setFormAbierto] = useState(false)
  const [clienteForm, setClienteForm] = useState('')
  const [errorCliente, setErrorCliente] = useState<string | undefined>()

  const {
    datos: presentaciones,
    cargando,
    error,
    recargar,
  } = useRecurso<DocumentacionCliente[]>(() => obtenerDocumentacionClientes(), [], [])

  const { datos: clientes } = useRecurso<Cliente[]>(
    async () => (await apiClient.get('/clientes')).data?.data ?? [],
    [],
    [],
  )

  // Agrupado por cliente: es como el agente piensa el trámite ("¿este cliente
  // tiene los papeles?"), no documento por documento.
  const grupos = useMemo(() => {
    const porCliente = new Map<number, { cliente: ClienteRef; items: DocumentacionCliente[] }>()
    for (const dc of presentaciones) {
      const id = refId(dc.cliente)
      if (!id) continue
      const cliente = refObjeto<ClienteRef>(dc.cliente) ?? { id }
      if (!porCliente.has(id)) porCliente.set(id, { cliente, items: [] })
      porCliente.get(id)!.items.push(dc)
    }
    return [...porCliente.values()]
  }, [presentaciones])

  const gruposFiltrados = useMemo(() => {
    const termino = busqueda.trim().toLowerCase()
    if (!termino) return grupos
    return grupos.filter(({ cliente }) =>
      `${nombreCompleto(cliente)} ${cliente.mail ?? ''} ${cliente.id}`.toLowerCase().includes(termino),
    )
  }, [grupos, busqueda])

  const abrirFormulario = (clienteId?: number) => {
    setClienteForm(clienteId ? String(clienteId) : '')
    setErrorCliente(undefined)
    setFormAbierto(true)
  }

  const guardar = async (datos: {
    descripcion: string
    fecha_vencimiento: string
    archivo: File | null
    estado?: DocumentacionCliente['estado']
  }) => {
    if (!clienteForm) {
      setErrorCliente('Elegí a qué cliente pertenece el documento.')
      throw new Error('Falta elegir el cliente')
    }

    await cargarDocumentoDeCliente({
      clienteId: Number(clienteForm),
      descripcion: datos.descripcion,
      fecha_vencimiento: datos.fecha_vencimiento,
      archivo: datos.archivo,
      estado: datos.estado,
    })

    setFormAbierto(false)
    setClienteForm('')
    notificar('Documento cargado')
    await recargar()
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="max-w-prose">
          <h1 className="font-display text-2xl text-tinta-900">Documentación</h1>
          <p className="mt-0.5 text-sm leading-relaxed text-tinta-500">
            Papeles necesarios para cerrar un contrato. Podés cargarlos apenas el cliente los
            manda; después, al concretar el alquiler, ya están listos.
          </p>
        </div>

        <button type="button" onClick={() => abrirFormulario()} className="accion accion-primaria shrink-0">
          <PlusIcon className="size-5" aria-hidden="true" />
          Cargar documento
        </button>
      </div>

      <div className="relative max-w-md">
        <label htmlFor="buscar-cliente" className="sr-only">
          Buscar cliente por nombre o mail
        </label>
        <MagnifyingGlassIcon
          className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-tinta-500"
          aria-hidden="true"
        />
        <input
          id="buscar-cliente"
          type="search"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar cliente por nombre o mail…"
          className="w-full rounded-lg border border-arena-300 bg-white py-2 ps-9 pe-3 text-sm text-tinta-900 transition-colors placeholder:text-tinta-500/70 focus:border-terra-600 focus:outline-none"
        />
        {busqueda.trim() && (
          <p className="mt-1 text-xs text-tinta-500">
            {gruposFiltrados.length} de {grupos.length} clientes
          </p>
        )}
      </div>

      <EstadoVista
        cargando={cargando}
        error={error}
        vacio={gruposFiltrados.length === 0}
        onReintentar={recargar}
        mensajeVacio={grupos.length === 0 ? 'No hay documentación cargada' : 'Ningún cliente coincide'}
        detalleVacio={
          grupos.length === 0
            ? 'Cargá el primer documento de un cliente para tenerlo listo el día de la firma.'
            : 'Probá con otro nombre o mail.'
        }
        accionVacio={
          grupos.length === 0 && (
            <button type="button" onClick={() => abrirFormulario()} className="accion accion-primaria accion-sm">
              <PlusIcon className="size-4" aria-hidden="true" />
              Cargar documento
            </button>
          )
        }
      >
        <ul className="space-y-4">
          {gruposFiltrados.map(({ cliente, items }) => {
            const enRegla = documentacionEnRegla(items)
            return (
              <li
                key={cliente.id}
                className="rounded-card border border-arena-200 bg-white p-5 shadow-card"
              >
                <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <h2 className="font-medium text-tinta-900">{nombreCompleto(cliente)}</h2>
                    <Badge tono={enRegla ? 'salvia' : 'ambar'}>
                      {enRegla ? 'En regla' : 'Falta documentación'}
                    </Badge>
                  </div>

                  <button
                    type="button"
                    onClick={() => abrirFormulario(cliente.id)}
                    className="accion accion-secundaria accion-sm"
                  >
                    <PlusIcon className="size-4" aria-hidden="true" />
                    Agregar
                  </button>
                </div>

                <ListaDocumentos items={items} isAgent onCambio={recargar} />
              </li>
            )
          })}
        </ul>
      </EstadoVista>

      <Modal
        open={formAbierto}
        onClose={() => setFormAbierto(false)}
        titulo="Cargar documento"
        descripcion="Queda asociado al cliente que elijas."
      >
        <FormularioDocumento
          permiteEstado
          campoExtra={
            <Campo etiqueta="Cliente" error={errorCliente} requerido>
              {(props) => (
                <select
                  {...props}
                  value={clienteForm}
                  onChange={(e) => {
                    setClienteForm(e.target.value)
                    setErrorCliente(undefined)
                  }}
                >
                  <option value="">Elegí un cliente</option>
                  {clientes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombre} {c.apellido}
                    </option>
                  ))}
                </select>
              )}
            </Campo>
          }
          onGuardar={guardar}
          onCancelar={() => setFormAbierto(false)}
        />
      </Modal>
    </div>
  )
}
