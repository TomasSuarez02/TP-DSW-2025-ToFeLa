import CardPropiedad from "./Card"

const propiedades = [
  { titulo: "Casa en el centro", ubicacion: "Rosario", precio: "$120.000", imagen: "url1" },
  { titulo: "Departamento moderno", ubicacion: "Buenos Aires", precio: "$80.000", imagen: "url2" },
  // ... las demás propiedades
]

export default function ListadoPropiedades() {
  return (
    <div className="bg-white">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <h2 className="text-2xl font-bold tracking-tight text-gray-900">Propiedades en alquiler</h2>

        <div className="mt-6 grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4 xl:gap-x-8">
          {propiedades.map((p, i) => (
            <CardPropiedad key={i} {...p} />
          ))}
        </div>
      </div>
    </div>
  )
}
