import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { CalendarDaysIcon } from '@heroicons/react/24/outline'
import Badge from '../../components/ui/Badge'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import EstadoVista from '../../components/ui/EstadoVista'
import Tabla, { type Columna } from '../../components/ui/Tabla'
import { useRecurso } from '../../hooks/useRecurso'
import { useNotificacion } from '../../hooks/useNotificacion'
import { formatearFechaHora, formatearMoneda } from '../../utils/formato'
import {
  eliminarVisita,
  estadoVisita,
  obtenerMisVisitas,
  yaPaso,
  type Visita,
} from '../../services/visitas'

/**
 * Las recorridas que el cliente agendó desde la ficha de la propiedad.
 *
 * Hasta ahora esa visita se agendaba y desaparecía: el listado completo es del
 * backoffice, así que el cliente no tenía dónde volver a ver el día y la hora
 * que había elegido, ni cómo avisar que no iba. Acá las ve y puede cancelar las
 * que todavía no ocurrieron; las pasadas quedan como historial.
 *
 * Sin las estadísticas de agenda ni el refresco cada 30 s del panel del agente:
 * eso sirve para atender un día de visitas, no para mirar las tres propias.
 */
export default function MisVisitas() {
  const { notificar } = useNotificacion()
  const [aCancelar, setACancelar] = useState<Visita | null>(null)

  const {
    datos: visitas,
    cargando,
    error,
    recargar,
  } = useRecurso<Visita[]>(() => obtenerMisVisitas(), [], [])

  // El backend las manda de la más reciente a la más vieja, que para el
  // historial está bien pero deja la próxima recorrida en el medio de la lista:
  // primero lo que falta (la más cercana arriba), después lo que ya pasó.
  const ordenadas = useMemo(() => {
    const futuras = visitas
      .filter((v) => !yaPaso(v.fecha_hora))
      .sort((a, b) => new Date(a.fecha_hora).getTime() - new Date(b.fecha_hora).getTime())
    const pasadas = visitas
      .filter((v) => yaPaso(v.fecha_hora))
      .sort((a, b) => new Date(b.fecha_hora).getTime() - new Date(a.fecha_hora).getTime())
    return [...futuras, ...pasadas]
  }, [visitas])

  const proxima = ordenadas.find((v) => !yaPaso(v.fecha_hora))

  const cancelar = async (visita: Visita) => {
    await eliminarVisita(visita.clave)
    setACancelar(null)
    notificar('Visita cancelada', 'exito', 'Podés agendar otra cuando quieras.')
    await recargar()
  }

  const columnas: Columna<Visita>[] = [
    {
      id: 'propiedad',
      encabezado: 'Propiedad',
      principal: true,
      celda: (v) => (
        <div className="min-w-0">
          <p className="truncate font-medium text-tinta-900">{v.propiedad?.direccion ?? '—'}</p>
          {v.propiedad?.precio !== undefined && (
            <p className="truncate text-xs text-tinta-500">
              {formatearMoneda(v.propiedad.precio)} por mes
            </p>
          )}
        </div>
      ),
    },
    {
      id: 'cuando',
      encabezado: 'Fecha y hora',
      celda: (v) => (
        <span className="text-tinta-700 tabular-nums">{formatearFechaHora(v.fecha_hora)}</span>
      ),
    },
    {
      id: 'estado',
      encabezado: 'Estado',
      celda: (v) => {
        const estado = estadoVisita(v.fecha_hora)
        return <Badge tono={estado.tono}>{estado.texto}</Badge>
      },
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="max-w-prose">
          <h1 className="font-display text-2xl text-tinta-900">Mis visitas</h1>
          <p className="mt-0.5 text-sm leading-relaxed text-tinta-500">
            Las recorridas que agendaste. Si no vas a poder llegar, cancelala así se libera el
            horario.
          </p>
        </div>

        <Link to="/Rent" className="accion accion-secundaria shrink-0">
          <CalendarDaysIcon className="size-5" aria-hidden="true" />
          Agendar otra visita
        </Link>
      </div>

      {proxima && (
        <p className="flex items-start gap-3 rounded-card border border-salvia-500/30 bg-salvia-100 px-4 py-3 text-sm leading-relaxed text-salvia-700">
          <CalendarDaysIcon className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
          <span>
            Tu próxima visita es el{' '}
            <strong className="font-semibold">{formatearFechaHora(proxima.fecha_hora)}</strong> en{' '}
            {proxima.propiedad?.direccion ?? 'la propiedad agendada'}.
          </span>
        </p>
      )}

      <EstadoVista
        cargando={cargando}
        error={error}
        vacio={ordenadas.length === 0}
        onReintentar={recargar}
        mensajeVacio="Todavía no agendaste ninguna visita"
        detalleVacio="Elegí una propiedad del catálogo y coordiná el día y la hora que te queden bien."
        accionVacio={
          <Link to="/Rent" className="accion accion-primaria accion-sm">
            Ver propiedades
          </Link>
        }
      >
        <Tabla
          datos={ordenadas}
          columnas={columnas}
          claveFila={(v) => v.clave}
          acciones={(v) =>
            !yaPaso(v.fecha_hora) && (
              <button
                type="button"
                onClick={() => setACancelar(v)}
                className="accion accion-fantasma accion-sm"
              >
                Cancelar
              </button>
            )
          }
        />
      </EstadoVista>

      <ConfirmDialog
        open={aCancelar !== null}
        titulo="Cancelar la visita"
        descripcion="Se da de baja la recorrida agendada. Podés volver a pedir otra cuando quieras."
        detalle={
          aCancelar
            ? `${formatearFechaHora(aCancelar.fecha_hora)} · ${aCancelar.propiedad?.direccion ?? ''}`
            : undefined
        }
        textoConfirmar="Cancelar visita"
        textoCancelar="Volver"
        onConfirmar={() => (aCancelar ? cancelar(aCancelar) : undefined)}
        onCancelar={() => setACancelar(null)}
      />
    </div>
  )
}
