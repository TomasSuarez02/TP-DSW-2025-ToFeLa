import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ChevronDownIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import heroInterior from '../../assets/hero-inicio.jpg'

export interface TipoDisponible {
  id: number
  descripcion: string
}

/**
 * La primera pantalla del sitio.
 *
 * Antes era una `<img>` sola, a sangre, apuntando a "src/assets/nuevoFondo.png":
 * una ruta que el navegador pide tal cual al servidor y que además tenía la N
 * mayúscula de más, así que en pantalla se veía el ícono de imagen rota. Ahora
 * la imagen entra por el bundler (con hash y tamaño resuelto en build) y, sobre
 * todo, la portada hace algo: se busca desde acá.
 *
 * El buscador no filtra en esta página, arma una URL y lleva al listado. Así el
 * resultado se puede compartir, guardar y recargar, y hay un solo lugar en todo
 * el sitio que sabe filtrar propiedades.
 */
export default function Hero({
  tipos,
  totalDisponibles,
  cargando,
}: {
  tipos: TipoDisponible[]
  totalDisponibles: number
  cargando: boolean
}) {
  const navigate = useNavigate()
  const [termino, setTermino] = useState('')
  const [tipo, setTipo] = useState<string>('todos')

  const buscar = (e: FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams()
    if (termino.trim()) params.set('q', termino.trim())
    if (tipo !== 'todos') params.set('tipo', tipo)
    const query = params.toString()
    navigate(query ? `/Rent?${query}` : '/Rent')
  }

  return (
    <section className="bg-arena-50">
      <div className="mx-auto grid max-w-screen-xl items-center gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1.05fr_1fr] lg:gap-16 lg:py-20 xl:px-8">
        <div>
          <p className="inline-flex items-center rounded-full bg-terra-100 px-3 py-1 text-xs font-semibold tracking-[0.12em] text-terra-800 uppercase">
            Alquileres en Rosario
          </p>

          <h1 className="mt-5 font-display text-4xl leading-[1.1] text-tinta-900 sm:text-5xl lg:text-6xl">
            Buscá, visitá y señá desde acá.
          </h1>

          <p className="mt-5 max-w-prose text-base leading-relaxed text-tinta-700 sm:text-lg">
            Publicamos con el precio a la vista y el estado real de cada unidad. Coordinás la visita
            con el agente, reservás con una seña y subís la documentación sin pasar por la oficina.
          </p>

          {/* El buscador va sobre superficie tarjeta —blanco, borde y sombra—
              para que se lea como una pieza apoyada sobre el fondo y no como
              tres controles sueltos. */}
          <form
            onSubmit={buscar}
            aria-label="Buscar propiedades en alquiler"
            className="mt-8 flex flex-col gap-2 rounded-card border border-arena-200 bg-white p-2 shadow-card sm:flex-row sm:items-center"
          >
            <div className="relative flex-1">
              <label htmlFor="hero-termino" className="sr-only">
                Calle, barrio o zona
              </label>
              <MagnifyingGlassIcon
                className="pointer-events-none absolute start-3 top-1/2 size-5 -translate-y-1/2 text-tinta-500"
                aria-hidden="true"
              />
              <input
                id="hero-termino"
                type="search"
                value={termino}
                onChange={(e) => setTermino(e.target.value)}
                placeholder="Calle, barrio o zona…"
                className="w-full rounded-lg bg-transparent py-3 ps-11 pe-3 text-sm text-tinta-900 placeholder:text-tinta-500/70"
              />
            </div>

            <div className="relative border-t border-arena-200 sm:w-52 sm:border-t-0 sm:border-s">
              <label htmlFor="hero-tipo" className="sr-only">
                Tipo de propiedad
              </label>
              <select
                id="hero-tipo"
                value={tipo}
                onChange={(e) => setTipo(e.target.value)}
                className="w-full appearance-none rounded-lg bg-transparent py-3 ps-3 pe-9 text-sm text-tinta-900"
              >
                <option value="todos">Cualquier tipo</option>
                {tipos.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.descripcion}
                  </option>
                ))}
              </select>
              <ChevronDownIcon
                className="pointer-events-none absolute end-3 top-1/2 size-4 -translate-y-1/2 text-tinta-500"
                aria-hidden="true"
              />
            </div>

            <button type="submit" className="accion accion-primaria">
              <MagnifyingGlassIcon className="size-5 sm:hidden" aria-hidden="true" />
              Buscar
            </button>
          </form>

          {/* Reserva su altura desde el primer pintado: si el dato apareciera
              de golpe, el buscador se correría hacia arriba justo cuando el
              usuario ya está por hacer clic. */}
          <p className="mt-4 min-h-5 text-sm text-tinta-500">
            {!cargando && totalDisponibles > 0 && (
              <>
                <Link
                  to="/Rent"
                  className="font-medium text-terra-700 underline-offset-4 hover:underline"
                >
                  {totalDisponibles} propiedades
                </Link>{' '}
                disponibles ahora mismo.
              </>
            )}
          </p>
        </div>

        <img
          src={heroInterior}
          alt="Living luminoso de un departamento en alquiler"
          fetchPriority="high"
          className="aspect-4/3 w-full rounded-card object-cover shadow-card-hover lg:aspect-square"
        />
      </div>
    </section>
  )
}
