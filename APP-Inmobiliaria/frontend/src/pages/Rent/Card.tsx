type Inmobiliaria = {
  nombre: string
}

type TipoPropiedad = {
  descripcion: string
}

export type Propiedades = {
  id: number
  direccion: string
  precio: number
  estado: string
  imagen: string | null
  inmobiliaria: Inmobiliaria | null
  tiposPropiedad: TipoPropiedad[]
}

export default function Card({direccion, precio, estado, inmobiliaria, tiposPropiedad, imagen }: Propiedades) {
  return (
    <div className="bg-white group relative p-3 rounded-2xl shadow-md hover:shadow-lg transition-shadow duration-300">
      <img
        src={imagen ? imagen : 'src/assets/DeptoPrueba.jpg'}
        alt={direccion}
        className="w-full aspect-auto object-cover bg-white group-hover:opacity-80 rounded-xl mb-2 hover:cursor-pointer"
      />
      <div className="m-3 flex justify-end">
        <span className={`px-2 py-1 rounded text-xs font-semibold ${estado === 'disponible' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{estado.toUpperCase()}</span>
      </div>
      <h3 className="text-xl text-gray-700 font-bold mb-1">{direccion}</h3>
      <p className="text-sm text-gray-500 mb-1">Inmobiliaria: {inmobiliaria ? inmobiliaria.nombre : 'Sin inmobiliaria'}</p>
      <div className="flex flex-wrap gap-2 mb-2">
        {tiposPropiedad.length > 0 ? (
          tiposPropiedad.map((tipo, idx) => (
            <span key={idx} className="bg-[#f3e5d1] text-[#bfa383] px-2 py-1 rounded text-xs font-medium">{tipo.descripcion}</span>
          ))
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
