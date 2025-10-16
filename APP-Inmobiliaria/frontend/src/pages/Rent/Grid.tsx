import {useEffect, useState } from "react"
import Card, { type Propiedades } from "./Card"
import axios from "axios"

// Datos de prueba, va lo de la fetch dentro de la funcion

export default function ListadoPropiedades() {
  const [propiedades, setPropiedades] = useState<Propiedades[]>([])
  useEffect(()=>{
      axios.get('http://localhost:3000/api/propiedades')
      .then(res => {
        setPropiedades(res.data.data)
      })
      .catch(e => console.error(e))
  },[])

  return (
    <div className="bg-[#e5ddcf] mx-auto max-w-screen-2xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8 ">
      <div className="mt-6 grid grid-cols-1 gap-x-4 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
        {propiedades.filter(p => String(p.estado).toLowerCase() === 'disponible').length === 0 ? (
          <div className="text-center text-gray-700 col-span-full">No hay propiedades disponibles</div>
        ) : (
          propiedades
            .filter(p => String(p.estado).toLowerCase() === 'disponible')
            .map((p) => (
              <Card key={p.id} {...p} />
            ))
        )}
      </div>
    </div>
  )
}
