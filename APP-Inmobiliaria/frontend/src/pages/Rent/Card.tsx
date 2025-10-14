type Inmobiliaria = {
  nombre: string
}

type TipoPropiedad = {
  descripcion: string
}
type Imagenes = {
  id: number
  path: string
}

export type Propiedades = {
  id: number
  direccion: string
  precio: number
  estado: string
  imagenes: Imagenes[]
  inmobiliaria: Inmobiliaria | null
  tipoPropiedad: TipoPropiedad
}

export default function Card({id, direccion, precio, estado, inmobiliaria, tipoPropiedad, imagenes }: Propiedades) {
  return (
    <div className="bg-white group relative p-3 rounded-2xl shadow-md hover:shadow-lg transition-shadow duration-300">
      <img
        src={imagenes[1] ? imagenes[1].path : 'src/assets/notFound.webp'}
        alt={direccion}
        onClick={() => window.location.href = `/Rent/property/${id}`}
        className="w-full max-h-80 aspect-auto object-cover bg-white group-hover:opacity-80 rounded-xl mb-2 hover:cursor-pointer"
      />
      <div className="m-3 flex justify-end">
        <span className={`px-2 py-1 rounded text-xs font-semibold ${estado === 'disponible' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{estado.toUpperCase()}</span>
      </div>
      <h3 className="text-xl text-gray-700 font-bold mb-1">{direccion}</h3>
      <p className="text-sm text-gray-500 mb-1">Inmobiliaria: {inmobiliaria ? inmobiliaria.nombre : 'Sin inmobiliaria'}</p>
      <div className="flex flex-wrap gap-2 mb-2">
        {tipoPropiedad ? (
          <span className="bg-[#846a41] text-white px-2 py-1 mt-2 rounded text-sm font-medium">{tipoPropiedad.descripcion}</span>
        ) : (
          <span className="text-xs text-gray-400">Sin tipo de propiedad</span>
        )}
      </div>
      <div className="flex justify-between items-center mt-2">
        <span className="text-lg font-bold text-gray-900">${precio.toLocaleString()}</span>
      </div>
    </div>
  )
}
