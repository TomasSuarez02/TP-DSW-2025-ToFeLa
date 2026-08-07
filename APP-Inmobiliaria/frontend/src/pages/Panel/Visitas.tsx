import { useEffect, useMemo, useState } from 'react'
import {
  ArrowsUpDownIcon,
  BellAlertIcon,
  MagnifyingGlassIcon,
  TrashIcon,
} from '@heroicons/react/24/outline'
import { formatearFechaHora, formatearMoneda } from '../../utils/formato'
import { useRecurso } from '../../hooks/useRecurso'
import { useNotificacion } from '../../hooks/useNotificacion'
import Badge from '../../components/ui/Badge'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import EstadoVista from '../../components/ui/EstadoVista'
import Tabla, { type Columna } from '../../components/ui/Tabla'
import {
  eliminarVisita,
  esHoy,
  esInminente,
  estadoVisita,
  obtenerVisitas,
  yaPaso,
  type Visita,
} from '../../services/visitas'

type Filtro = 'todas' | 'hoy' | 'pendientes' | 'pasadas'

const FILTROS: { id: Filtro; nombre: string }[] = [
  { id: 'todas', nombre: 'Todas' },
  { id: 'hoy', nombre: 'Hoy' },
  { id: 'pendientes', nombre: 'Pendientes' },
  { id: 'pasadas', nombre: 'Pasadas' },
]

export default function Visitas() {
  const { notificar } = useNotificacion()
  const [filtro, setFiltro] = useState<Filtro>('todas')
  const [busqueda, setBusqueda] = useState('')
  const [ascendente, setAscendente] = useState(false)
  const [aEliminar, setAEliminar] = useState<Visita | null>(null)

  const {
    datos: visitas,
    cargando,
    error,
    recargar,
  } = useRecurso<Visita[]>(() => obtenerVisitas(), [], [])

  // La agenda cambia mientras el agente la mira, pero el refresco ponía
  // `loading` en true cada 30 segundos: la pantalla entera parpadeaba a
  // "Cargando visitas…" y se perdía de vista lo que se estaba leyendo.
  const [yaCargoUnaVez, setYaCargoUnaVez] = useState(false)
  useEffect(() => {
    if (!cargando) setYaCargoUnaVez(true)
  }, [cargando])

  useEffect(() => {
    const id = setInterval(() => {
      // Si la pestaña está en segundo plano no hay nadie mirando la agenda.
      if (document.visibilityState === 'visible') void recargar()
    }, 30_000)
    return () => clearInterval(id)
  }, [recargar])

  const visitasFiltradas = useMemo(() => {
    const termino = busqueda.trim().toLowerCase()

    const resultado = visitas.filter((v) => {
      if (termino) {
        const texto = `${v.cliente?.nombre ?? ''} ${v.cliente?.apellido ?? ''} ${
          v.propiedad?.direccion ?? ''
        }`.toLowerCase()
        if (!texto.includes(termino)) return false
      }

      if (filtro === 'hoy') return esHoy(v.fecha_hora)
      if (filtro === 'pendientes') return !yaPaso(v.fecha_hora)
      if (filtro === 'pasadas') return yaPaso(v.fecha_hora)
      return true
    })

    return resultado.sort((a, b) => {
      const diferencia = new Date(a.fecha_hora).getTime() - new Date(b.fecha_hora).getTime()
      return ascendente ? diferencia : -diferencia
    })
  }, [visitas, busqueda, filtro, ascendente])

  const stats = useMemo(
    () => ({
      total: visitas.length,
      hoy: visitas.filter((v) => esHoy(v.fecha_hora)).length,
      pendientes: visitas.filter((v) => !yaPaso(v.fecha_hora)).length,
      inminentes: visitas.filter((v) => esInminente(v.fecha_hora)).length,
    }),
    [visitas],
  )

  const eliminar = async (visita: Visita) => {
    await eliminarVisita(visita.clave)
    setAEliminar(null)
    notificar('Visita eliminada')
    await recargar()
  }

  const columnas: Columna<Visita>[] = [
    {
      id: 'cuando',
      encabezado: 'Fecha y hora',
      principal: true,
      celda: (v) => {
        const estado = estadoVisita(v.fecha_hora)
        return (
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium text-tinta-900 tabular-nums">
              {formatearFechaHora(v.fecha_hora)}
            </span>
            <Badge tono={estado.tono}>{estado.texto}</Badge>
          </div>
        )
      },
    },
    {
      id: 'cliente',
      encabezado: 'Cliente',
      celda: (v) => (
        <div className="min-w-0">
          <p className="truncate text-tinta-900">
            {v.cliente?.apellido}, {v.cliente?.nombre}
          </p>
          <p className="truncate text-xs text-tinta-500">
            {v.cliente?.mail ?? '—'}
            {v.cliente?.telefono && ` · ${v.cliente.telefono}`}
          </p>
        </div>
      ),
    },
    {
      id: 'propiedad',
      encabezado: 'Propiedad',
      celda: (v) => <span className="text-tinta-700">{v.propiedad?.direccion ?? '—'}</span>,
    },
    {
      id: 'precio',
      encabezado: 'Precio',
      alinear: 'derecha',
      ocultarEnMobile: true,
      celda: (v) =>
        v.propiedad?.precio !== undefined ? (
          <span className="text-tinta-700">{formatearMoneda(v.propiedad.precio)}</span>
        ) : (
          '—'
        ),
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl text-tinta-900">Visitas</h1>
        <p className="mt-0.5 text-sm text-tinta-500">La agenda de recorridas por propiedad.</p>
      </div>

      <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Estadistica etiqueta="Agendadas" valor={stats.total} />
        <Estadistica etiqueta="Hoy" valor={stats.hoy} />
        <Estadistica etiqueta="Pendientes" valor={stats.pendientes} />
        <Estadistica etiqueta="En la próxima hora" valor={stats.inminentes} destacada={stats.inminentes > 0} />
      </dl>

      {stats.inminentes > 0 && (
        <p className="flex items-start gap-3 rounded-card border border-ambar-700/20 bg-ambar-50 px-4 py-3 text-sm text-ambar-700">
          <BellAlertIcon className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
          <span>
            Hay {stats.inminentes} visita{stats.inminentes > 1 ? 's' : ''} en la próxima hora. Revisá
            que las propiedades estén listas.
          </span>
        </p>
      )}

      <div className="flex flex-col gap-3 rounded-card border border-arena-200 bg-white p-4 shadow-card sm:flex-row sm:items-center sm:justify-between">
        <div className="relative min-w-0 flex-1 sm:max-w-xs">
          <label htmlFor="buscar-visita" className="sr-only">
            Buscar por cliente o dirección
          </label>
          <MagnifyingGlassIcon
            className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-tinta-500"
            aria-hidden="true"
          />
          <input
            id="buscar-visita"
            type="search"
            placeholder="Cliente o dirección…"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full rounded-lg border border-arena-300 bg-arena-50 py-2 ps-9 pe-3 text-sm text-tinta-900 transition-colors placeholder:text-tinta-500/70 focus:border-terra-600 focus:bg-white focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {FILTROS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFiltro(f.id)}
              aria-pressed={filtro === f.id}
              className={`accion accion-sm ${
                filtro === f.id ? 'accion-primaria' : 'accion-secundaria'
              }`}
            >
              {f.nombre}
            </button>
          ))}

          <button
            type="button"
            onClick={() => setAscendente((v) => !v)}
            className="accion accion-fantasma accion-sm"
          >
            <ArrowsUpDownIcon className="size-4" aria-hidden="true" />
            {ascendente ? 'Más antiguas' : 'Más recientes'}
          </button>
        </div>
      </div>

      <EstadoVista
        cargando={cargando && !yaCargoUnaVez}
        error={error}
        vacio={visitasFiltradas.length === 0}
        onReintentar={recargar}
        mensajeVacio={visitas.length === 0 ? 'No hay visitas agendadas' : 'Ninguna visita con esos filtros'}
        detalleVacio={
          visitas.length === 0
            ? 'Cuando un cliente pida una recorrida, aparece acá.'
            : 'Probá con otro filtro o limpiá la búsqueda.'
        }
      >
        <Tabla
          datos={visitasFiltradas}
          columnas={columnas}
          claveFila={(v) => v.clave}
          acciones={(v) => (
            <button
              type="button"
              onClick={() => setAEliminar(v)}
              className="accion accion-fantasma accion-sm text-alerta-700 hover:bg-alerta-50"
            >
              <TrashIcon className="size-4" aria-hidden="true" />
              <span className="sr-only">Eliminar la visita del {formatearFechaHora(v.fecha_hora)}</span>
            </button>
          )}
        />
      </EstadoVista>

      <ConfirmDialog
        open={aEliminar !== null}
        titulo="Eliminar visita"
        descripcion="Se cancela la recorrida agendada. No se puede deshacer."
        detalle={
          aEliminar
            ? `${formatearFechaHora(aEliminar.fecha_hora)} · ${aEliminar.propiedad?.direccion ?? ''}`
            : undefined
        }
        textoConfirmar="Eliminar"
        onConfirmar={() => (aEliminar ? eliminar(aEliminar) : undefined)}
        onCancelar={() => setAEliminar(null)}
      />
    </div>
  )
}

function Estadistica({
  etiqueta,
  valor,
  destacada = false,
}: {
  etiqueta: string
  valor: number
  destacada?: boolean
}) {
  return (
    <div
      className={`rounded-card border p-4 shadow-card ${
        destacada ? 'border-ambar-700/20 bg-ambar-50' : 'border-arena-200 bg-white'
      }`}
    >
      <dt className="text-xs font-semibold tracking-[0.06em] text-tinta-500 uppercase">{etiqueta}</dt>
      <dd
        className={`mt-1 font-display text-3xl tabular-nums ${
          destacada ? 'text-ambar-700' : 'text-tinta-900'
        }`}
      >
        {valor}
      </dd>
    </div>
  )
}
