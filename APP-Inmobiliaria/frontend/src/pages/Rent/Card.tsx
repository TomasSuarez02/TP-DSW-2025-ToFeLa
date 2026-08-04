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

export default function Card({id, direccion, precio, estado, descripcion, tipoPropiedad, imagenes }: Propiedades) {
  return (
    <div className="bg-white group relative rounded-2xl shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden">
      
      <div className="relative">
        <img
          src={imagenes[0] ? imagenes[0].path : 'src/assets/notFound.webp'}
          alt={direccion}
          onClick={() => window.location.href = `/Rent/property/${id}`}
          className="w-full h-64 object-cover group-hover:opacity-90 transition-opacity cursor-pointer"
        />
        
        <div className="absolute top-4 right-4">
          <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase ${
            estado === 'disponible' 
              ? 'bg-green-500 text-white' 
              : 'bg-red-500 text-white'
          }`}>
            {estado}
          </span>
        </div>
      </div>

      
      <div className="p-4">
        
        <h3 className="text-lg font-bold text-gray-800 mb-2 line-clamp-1">
          {direccion}
        </h3>

        
        {tipoPropiedad ? (
          <span className="inline-block bg-[#dcc7af] text-[#846a41] px-3 py-1 rounded-full text-sm font-medium mb-3">
            {tipoPropiedad.descripcion}
          </span>
        ) : (
          <span className="text-xs text-gray-400 mb-3 block">Sin tipo de propiedad</span>
        )}

        {descripcion && (
          <p className="text-sm text-gray-600 line-clamp-2 mb-3">
            {descripcion}
          </p>
        )}

        <div className="mt-3 pt-3 border-t border-gray-100">
          <span className="text-2xl font-bold text-[#846a41]">
            ${precio.toLocaleString('es-AR')}
          </span>
        </div>
      </div>
    </div>
  )
}
