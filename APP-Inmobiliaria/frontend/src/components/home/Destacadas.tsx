import { Link } from 'react-router-dom'
import { ArrowRightIcon } from '@heroicons/react/24/outline'
import Card, { type Propiedades } from '../../pages/Rent/Card'
import TarjetaEsqueleto from '../ui/TarjetaEsqueleto'

/**
 * Las últimas propiedades publicadas, en la portada.
 *
 * Son las mismas tarjetas del listado a propósito: la persona que hace clic
 * desde acá llega a una grilla que ya reconoce. Si la carga falla, la sección
 * lo dice en una línea y no se lleva la página puesta — el resto de la home
 * (qué es esto, cómo se alquila, cómo contactarnos) sigue sirviendo sin la API.
 */
export default function Destacadas({
  propiedades,
  total,
  cargando,
  error,
}: {
  propiedades: Propiedades[]
  /** Disponibles en total, para el link al catálogo completo. */
  total: number
  cargando: boolean
  error: string | null
}) {
  return (
    <section className="border-t border-arena-200 bg-arena-50">
      <div className="mx-auto max-w-screen-xl px-4 py-16 sm:px-6 sm:py-20 xl:px-8">
        <header className="mb-10 flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
          <div>
            <h2 className="font-display text-3xl text-tinta-900 sm:text-4xl">Recién publicadas</h2>
            <p className="mt-2 text-sm text-tinta-500">
              Las últimas unidades que entraron al catálogo.
            </p>
          </div>

          {total > 0 && (
            <Link
              to="/Rent"
              className="group inline-flex items-center gap-2 text-sm font-semibold text-terra-700 transition-colors hover:text-terra-800"
            >
              Ver las {total} propiedades
              <ArrowRightIcon
                className="size-4 transition-transform duration-300 ease-salida group-hover:translate-x-1"
                aria-hidden="true"
              />
            </Link>
          )}
        </header>

        {cargando ? (
          <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3" aria-hidden="true">
            {Array.from({ length: 6 }).map((_, i) => (
              <li key={i}>
                <TarjetaEsqueleto />
              </li>
            ))}
          </ul>
        ) : error ? (
          <p className="rounded-card border border-arena-200 bg-white px-6 py-12 text-center text-sm text-tinta-500">
            No pudimos traer las propiedades en este momento.{' '}
            <Link to="/Rent" className="font-medium text-terra-700 underline-offset-4 hover:underline">
              Probá abrir el listado completo
            </Link>
            .
          </p>
        ) : propiedades.length === 0 ? (
          <p className="rounded-card border border-arena-200 bg-white px-6 py-12 text-center text-sm text-tinta-500">
            Todavía no hay unidades disponibles. Volvé a mirar en unos días: publicamos seguido.
          </p>
        ) : (
          <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {propiedades.map((p) => (
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
