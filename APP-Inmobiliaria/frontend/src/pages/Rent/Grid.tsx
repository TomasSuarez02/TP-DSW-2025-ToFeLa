import { useEffect, useState } from "react"
import Card, { type Propiedades } from "./Card"

// Datos de prueba, va lo de la fetch dentro de la funcion

export default function ListadoPropiedades() {
  const [propiedades, setPropiedades] = useState<Propiedades[]>([])
  useEffect(()=>{
    try{
      fetch('http://localhost:3000/api/propiedades')
      .then(res => res.json())
      .then(data => setPropiedades(data.data))
    }catch(e){
      console.error(e)
    }
  },[])

  return (
    <div className="bg-[#e5ddcf] mx-auto max-w-screen-2xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8 ">
      <div className="mt-6 grid grid-cols-1 gap-x-4 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
        {propiedades.map((p, i) => (
          <Card key={i} {...p} />
        ))}
      </div>
    </div>
  )
}
