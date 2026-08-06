import { useEffect, useMemo, useState } from "react"
import { useSearchParams } from "react-router-dom"
import { ChevronDownIcon, XMarkIcon } from "@heroicons/react/24/outline"
import Card, { type Propiedades } from "./Card"
import TarjetaEsqueleto from "../../components/ui/TarjetaEsqueleto"
import apiClient from "../../utils/apiClient";

type Estado = 'cargando' | 'listo' | 'error'
type Orden = 'recientes' | 'precio-asc' | 'precio-desc'

const ORDENES: { valor: Orden; etiqueta: string }[] = [
  { valor: 'recientes', etiqueta: 'Más recientes' },
  { valor: 'precio-asc', etiqueta: 'Precio: menor a mayor' },
  { valor: 'precio-desc', etiqueta: 'Precio: mayor a menor' },
]

/* "Perón" y "Peron" tienen que encontrar lo mismo: nadie escribe los acentos
   en un buscador, y la dirección los tiene. */
function sinAcentos(texto: string): string {
  return texto.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()
}

export default function ListadoPropiedades() {
  const [propiedades, setPropiedades] = useState<Propiedades[]>([])
  const [estado, setEstado] = useState<Estado>('cargando')
  const [orden, setOrden] = useState<Orden>('recientes')

  /* El filtro vive en la URL, no en el estado del componente: así el buscador
     de la portada puede mandar acá, el resultado se comparte con un link y el
     botón "atrás" del navegador deshace el filtro en vez de salir del sitio. */
  const [params, setParams] = useSearchParams()
  const busqueda = params.get('q')?.trim() ?? ''
  const tipoParam = params.get('tipo')
  const tipo: number | 'todos' = tipoParam && /^\d+$/.test(tipoParam) ? Number(tipoParam) : 'todos'

  const actualizarParams = (cambios: { q?: string | null; tipo?: number | 'todos' }) => {
    const siguientes = new URLSearchParams(params)
    if (cambios.q !== undefined) {
      if (cambios.q) siguientes.set('q', cambios.q)
      else siguientes.delete('q')
    }
    if (cambios.tipo !== undefined) {
      if (cambios.tipo === 'todos') siguientes.delete('tipo')
      else siguientes.set('tipo', String(cambios.tipo))
    }
    // replace: filtrar no es navegar, no tiene por qué llenar el historial.
    setParams(siguientes, { replace: true })
  }

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

  /* El término busca en dirección, descripción y tipo. La descripción es la que
     nombra el barrio ("PH en Fisherton…"), así que buscar "fisherton" funciona
     aunque el barrio no sea un campo propio de la propiedad. */
  const porTexto = useMemo(() => {
    const termino = sinAcentos(busqueda)
    if (!termino) return disponibles
    return disponibles.filter(p =>
      sinAcentos(
        `${p.direccion} ${p.descripcion ?? ''} ${p.tipoPropiedad?.descripcion ?? ''}`,
      ).includes(termino),
    )
  }, [disponibles, busqueda])

  /* Los tipos salen de lo que hay publicado, no de una lista fija: un
     filtro que ofrece "Local comercial" cuando no hay ninguno sólo sirve
     para llevar a un resultado vacío. Con una búsqueda activa se cuentan
     sobre los resultados, así el número del chip nunca miente. */
  const tipos = useMemo(() => {
    const cuenta = new Map<number, { descripcion: string; total: number }>()
    for (const p of porTexto) {
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
  }, [porTexto])

  const visibles = useMemo(() => {
    const filtradas =
      tipo === 'todos' ? porTexto : porTexto.filter(p => p.tipoPropiedad?.id === tipo)

    if (orden === 'recientes') return filtradas
    return [...filtradas].sort((a, b) =>
      orden === 'precio-asc' ? a.precio - b.precio : b.precio - a.precio,
    )
  }, [porTexto, tipo, orden])

  const hayFiltros = tipos.length > 1 && porTexto.length > 3

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

        {/* Qué se buscó, y cómo salir de esa búsqueda. Sin esto, quien llega
            desde la portada ve una lista corta y no sabe por qué. */}
        {busqueda && (
          <p className="mb-6 flex flex-wrap items-center gap-2 text-sm text-tinta-700">
            Resultados para
            <span className="inline-flex items-center gap-1.5 rounded-full border border-arena-300 bg-white py-1 ps-3 pe-1.5 font-medium text-tinta-900">
              {busqueda}
              <button
                type="button"
                onClick={() => actualizarParams({ q: null })}
                className="grid size-5 place-items-center rounded-full text-tinta-500 transition-colors hover:bg-arena-100 hover:text-tinta-900"
              >
                <XMarkIcon className="size-3.5" aria-hidden="true" />
                <span className="sr-only">Quitar la búsqueda</span>
              </button>
            </span>
          </p>
        )}

        {/* Filtros: aparecen sólo cuando hay algo que filtrar. Con cuatro
            propiedades, una barra de controles es ruido. */}
        {estado === 'listo' && hayFiltros && (
          <div className="mb-8 flex flex-wrap items-center justify-between gap-x-6 gap-y-4">
            <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar por tipo">
              {[{ id: 'todos' as const, descripcion: 'Todas', total: porTexto.length }, ...tipos].map(t => {
                const activo = tipo === t.id
                return (
                  <button
                    key={t.id}
                    type="button"
                    aria-pressed={activo}
                    onClick={() => actualizarParams({ tipo: t.id })}
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
              <li key={i}>
                <TarjetaEsqueleto />
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
        ) : porTexto.length === 0 ? (
          <div className="rounded-card border border-arena-200 bg-white px-6 py-16 text-center">
            <p className="font-display text-xl text-tinta-900">
              No encontramos nada para «{busqueda}»
            </p>
            <p className="mt-2 text-sm text-tinta-500">
              Probá con el nombre de la calle o del barrio, o mirá el catálogo completo.
            </p>
            <button
              type="button"
              onClick={() => actualizarParams({ q: null, tipo: 'todos' })}
              className="accion accion-secundaria mt-6"
            >
              Ver todas
            </button>
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
              onClick={() => actualizarParams({ tipo: 'todos' })}
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
