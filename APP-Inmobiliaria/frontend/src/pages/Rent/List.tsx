import { useEffect, useState } from "react"
import Card from "./Card"
import type { Propiedades } from "./Card"

export default function List() {
  const [propiedades, setPropiedades] = useState<Propiedades[]>([])

  useEffect(() => {
    fetch("https://midominio.com/api/propiedades") // Cambia esta URL por la de tu backend
      .then(res => res.json())
      .then(data => setPropiedades(data))
  }, [])

  return (
    <div className="grid grid-cols-3 gap-4">
      {propiedades.map(prop => (
        <Card key={prop.id} {...prop} />
      ))}
    </div>
  )
}