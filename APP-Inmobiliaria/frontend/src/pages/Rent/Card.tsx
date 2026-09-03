import { Link } from 'react-router-dom'
import notFound from '../../assets/notFound.webp'

type Inmobiliaria = {
  descripcion: string
}

type TipoPropiedad = {
  id: number
  descripcion: string
}

type Imagenes = {
  id: number
  path: string
}

export interface Propiedades {
  id: number
  direccion: string
  precio: number
  estado: string
  descripcion?: string
  hora_desde?: string
  hora_hasta?: string
  imagenes: Imagenes[]
  inmobiliaria: Inmobiliaria | null
  tipoPropiedad: TipoPropiedad
}

export default function Card({ id, direccion, precio, estado, descripcion, tipoPropiedad, imagenes }: Propiedades) {
  const disponible = String(estado).toLowerCase() === 'disponible'

  return (
    <article className="group h-full">
      {/* La tarjeta entera es el destino, no sólo la imagen: el área
          de click pasa a ser toda la pieza y se navega sin recargar. */}
      <Link
        to={`/Rent/property/${id}`}
        className="flex h-full flex-col overflow-hidden rounded-card bg-white shadow-card transition-[box-shadow,transform] duration-300 hover:-translate-y-1 hover:shadow-card-hover"
      >
        <div className="relative overflow-hidden bg-arena-100">
          <img
            src={imagenes[0] ? imagenes[0].path : notFound}
            alt={`Fachada de ${direccion}`}
            loading="lazy"
            className="aspect-[4/3] w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />

          <span
            className={`absolute top-3 right-3 rounded-full px-2.5 py-1 text-[0.65rem] font-semibold tracking-wider uppercase backdrop-blur-sm ${
              disponible
                ? 'bg-salvia-500/95 text-white'
                : 'bg-tinta-900/70 text-arena-100'
            }`}
          >
            {estado}
          </span>
        </div>

        <div className="flex flex-1 flex-col p-5">
          {tipoPropiedad ? (
            <span className="mb-2 text-[0.7rem] font-semibold tracking-[0.12em] text-terra-800 uppercase">
              {tipoPropiedad.descripcion}
            </span>
          ) : (
            <span className="mb-2 text-[0.7rem] font-semibold tracking-[0.12em] text-tinta-500 uppercase">
              Sin categoría
            </span>
          )}

          <h3 className="font-semibold text-xl leading-snug text-tinta-900">
            {direccion}
          </h3>

          {descripcion && (
            <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-tinta-500">
              {descripcion}
            </p>
          )}

          {/* mt-auto ancla el precio abajo: en una grilla, las tarjetas
              tienen descripciones de distinto largo y los precios deben
              alinearse entre sí para poder compararse de un vistazo. */}
          <div className="mt-auto flex items-baseline justify-between gap-2 border-t border-arena-200 pt-4">
            <span className="font-sans text-2xl text-terra-600 tabular-nums">
              ${precio.toLocaleString('es-AR')}
            </span>
            <span className="text-xs text-tinta-500">por mes</span>
          </div>
        </div>
      </Link>
    </article>
  )
}
