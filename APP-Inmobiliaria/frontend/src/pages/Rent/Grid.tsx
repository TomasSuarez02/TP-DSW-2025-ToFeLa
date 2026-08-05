import { useEffect, useMemo, useState } from "react"
import { ChevronDownIcon } from "@heroicons/react/24/outline"
import Card, { type Propiedades } from "./Card"
import apiClient from "../../utils/apiClient";

type Estado = 'cargando' | 'listo' | 'error'
type Orden = 'recientes' | 'precio-asc' | 'precio-desc'

const ORDENES: { valor: Orden; etiqueta: string }[] = [
  { valor: 'recientes', etiqueta: 'Más recientes' },
  { valor: 'precio-asc', etiqueta: 'Precio: menor a mayor' },
  { valor: 'precio-desc', etiqueta: 'Precio: mayor a menor' },
]

export default function ListadoPropiedades() {
  const [propiedades, setPropiedades] = useState<Propiedades[]>([])
  const [estado, setEstado] = useState<Estado>('cargando')
  const [tipo, setTipo] = useState<number | 'todos'>('todos')
  const [orden, setOrden] = useState<Orden>('recientes')

  useEffect(() => {
    apiClient.get('/propiedades')
      .then(res => {
        setPropiedades(res.data.data)
        setEstado('listo')
      })
      .catch(e => {
        console.error(e)
        setEstado('error')
      })
  }, [])

  const disponibles = useMemo(
    () => propiedades.filter(p => String(p.estado).toLowerCase() === 'disponible'),
    [propiedades],
  )

  /* Los tipos salen de lo que hay publicado, no de una lista fija: un
     filtro que ofrece "Local comercial" cuando no hay ninguno sólo sirve
     para llevar a un resultado vacío. */
  const tipos = useMemo(() => {
    const cuenta = new Map<number, { descripcion: string; total: number }>()
    for (const p of disponibles) {
      if (!p.tipoPropiedad) continue
      const previo = cuenta.get(p.tipoPropiedad.id)
      cuenta.set(p.tipoPropiedad.id, {
        descripcion: p.tipoPropiedad.descripcion,
        total: (previo?.total ?? 0) + 1,
      })
    }
    return [...cuenta.entries()]
      .map(([id, v]) => ({ id, ...v }))
      .sort((a, b) => a.descripcion.localeCompare(b.descripcion, 'es'))
  }, [disponibles])

  const visibles = useMemo(() => {
    const filtradas =
      tipo === 'todos' ? disponibles : disponibles.filter(p => p.tipoPropiedad?.id === tipo)

    if (orden === 'recientes') return filtradas
    return [...filtradas].sort((a, b) =>
      orden === 'precio-asc' ? a.precio - b.precio : b.precio - a.precio,
    )
  }, [disponibles, tipo, orden])

  const hayFiltros = tipos.length > 1 && disponibles.length > 3

  return (
    <section className="bg-arena-50">
      <div className="mx-auto max-w-screen-2xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">

        <header className="mb-10 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2 border-b border-arena-200 pb-6">
          <h1 className="font-display text-3xl text-tinta-900 sm:text-4xl">
            Propiedades en alquiler
          </h1>
          {estado === 'listo' && disponibles.length > 0 && (
            <p className="text-sm text-tinta-500 tabular-nums">
              {visibles.length}{' '}
              {visibles.length === 1 ? 'propiedad disponible' : 'propiedades disponibles'}
            </p>
          )}
        </header>

        {/* Filtros: aparecen sólo cuando hay algo que filtrar. Con cuatro
            propiedades, una barra de controles es ruido. */}
        {estado === 'listo' && hayFiltros && (
          <div className="mb-8 flex flex-wrap items-center justify-between gap-x-6 gap-y-4">
            <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar por tipo">
              {[{ id: 'todos' as const, descripcion: 'Todas', total: disponibles.length }, ...tipos].map(t => {
                const activo = tipo === t.id
                return (
                  <button
                    key={t.id}
                    type="button"
                    aria-pressed={activo}
                    onClick={() => setTipo(t.id)}
                    className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                      activo
                        ? 'border-terra-600 bg-terra-600 text-white'
                        : 'border-arena-300 bg-white text-tinta-700 hover:border-arena-400 hover:bg-white'
                    }`}
                  >
                    {t.descripcion}
                    <span className={`ms-1.5 tabular-nums ${activo ? 'text-white/70' : 'text-tinta-500'}`}>
                      {t.total}
                    </span>
                  </button>
                )
              })}
            </div>

            <div className="relative">
              <label htmlFor="orden" className="sr-only">Ordenar por</label>
              <select
                id="orden"
                value={orden}
                onChange={e => setOrden(e.target.value as Orden)}
                className="appearance-none rounded-lg border border-arena-300 bg-white py-2 pe-10 ps-4 text-sm text-tinta-900 transition-colors hover:border-arena-400"
              >
                {ORDENES.map(o => (
                  <option key={o.valor} value={o.valor}>{o.etiqueta}</option>
                ))}
              </select>
              <ChevronDownIcon
                className="pointer-events-none absolute end-3 top-1/2 size-4 -translate-y-1/2 text-tinta-500"
                aria-hidden="true"
              />
            </div>
          </div>
        )}

        {estado === 'cargando' ? (
          /* Esqueletos con la forma real de la tarjeta: la grilla no salta
             cuando llegan los datos. Antes esta pantalla afirmaba que no
             había propiedades mientras todavía estaba cargando. */
          <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3" aria-hidden="true">
            {Array.from({ length: 6 }).map((_, i) => (
              <li key={i} className="overflow-hidden rounded-card bg-white shadow-card">
                <div className="aspect-4/3 w-full animate-pulse bg-arena-100" />
                <div className="space-y-3 p-5">
                  <div className="h-2.5 w-20 animate-pulse rounded-full bg-arena-100" />
                  <div className="h-4 w-3/4 animate-pulse rounded-full bg-arena-100" />
                  <div className="h-3 w-full animate-pulse rounded-full bg-arena-100" />
                  <div className="h-6 w-28 animate-pulse rounded-full bg-arena-100" />
                </div>
              </li>
            ))}
          </ul>
        ) : estado === 'error' ? (
          <div className="rounded-card border border-arena-200 bg-white px-6 py-16 text-center">
            <p className="font-display text-xl text-tinta-900">
              No pudimos cargar las propiedades
            </p>
            <p className="mt-2 text-sm text-tinta-500">
              Revisá tu conexión e intentá de nuevo.
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="accion accion-primaria mt-6"
            >
              Reintentar
            </button>
          </div>
        ) : disponibles.length === 0 ? (
          <div className="rounded-card border border-arena-200 bg-white px-6 py-16 text-center">
            <p className="font-display text-xl text-tinta-900">
              Todavía no hay propiedades disponibles
            </p>
            <p className="mt-2 text-sm text-tinta-500">
              Volvé a mirar en unos días: publicamos nuevas unidades seguido.
            </p>
          </div>
        ) : visibles.length === 0 ? (
          /* Vacío por filtro, no por catálogo: el mensaje tiene que decir
             eso y dar la salida, no repetir que no hay propiedades. */
          <div className="rounded-card border border-arena-200 bg-white px-6 py-16 text-center">
            <p className="font-display text-xl text-tinta-900">
              No hay propiedades de este tipo disponibles
            </p>
            <p className="mt-2 text-sm text-tinta-500">
              Probá con otro tipo o mirá el catálogo completo.
            </p>
            <button
              type="button"
              onClick={() => setTipo('todos')}
              className="accion accion-secundaria mt-6"
            >
              Ver todas
            </button>
          </div>
        ) : (
          <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {visibles.map(p => (
              <li key={p.id}>
                <Card {...p} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}
