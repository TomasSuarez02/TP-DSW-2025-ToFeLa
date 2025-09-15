type Props = {
  titulo: string
  ubicacion: string
  precio: string
  imagen: string
}

export default function Card({ titulo, ubicacion, precio, imagen }: Props) {
  return (
    <div className="bg-white group relative p-3 rounded-2xl shadow-md hover:shadow-lg transition-shadow duration-300">
      <img
        src={imagen}
        alt={titulo}
        className="w-full aspect-[3/2] object-cover bg-white group-hover:opacity-75 rounded-xl" />
      <div className="mt-4 flex justify-between">
        <div>
          <h3 className="text-xl text-gray-700 font-bold">{titulo}</h3>
          <p className="mt-1 text-sm text-gray-500 font-semibold">{ubicacion}</p>
        </div>
        <p className="text-xl font-medium text-gray-900">{precio}</p>
      </div>
    </div>
  )
}
