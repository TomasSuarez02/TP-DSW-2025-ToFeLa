type Props = {
  titulo: string
  ubicacion: string
  precio: string
  imagen: string
}

export default function Card({ titulo, ubicacion, precio, imagen }: Props) {
  return (
    <div className="bg-white group relative">
      <img
        src={imagen}
        alt={titulo}
        className="w-full aspect-[3/2] object-cover bg-white group-hover:opacity-75" />
      <div className="mt-4 flex justify-between">
        <div>
          <h3 className="text-sm text-gray-700">{titulo}</h3>
          <p className="mt-1 text-sm text-gray-500">{ubicacion}</p>
        </div>
        <p className="text-sm font-medium text-gray-900">{precio}</p>
      </div>
    </div>
  )
}
