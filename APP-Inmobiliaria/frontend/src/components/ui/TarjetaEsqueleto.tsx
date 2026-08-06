/**
 * La silueta de una tarjeta de propiedad mientras llegan los datos.
 *
 * Tiene la forma real de `Card` —misma proporción de imagen, mismo padding—
 * para que la grilla no salte cuando la lista se reemplaza. Vive acá y no
 * dentro de la grilla de alquiler porque la home muestra las mismas tarjetas:
 * si el esqueleto estuviera escrito dos veces, tarde o temprano una de las dos
 * copias dejaría de parecerse a la tarjeta.
 */
export default function TarjetaEsqueleto() {
  return (
    <div className="overflow-hidden rounded-card bg-white shadow-card">
      <div className="aspect-4/3 w-full animate-pulse bg-arena-100" />
      <div className="space-y-3 p-5">
        <div className="h-2.5 w-20 animate-pulse rounded-full bg-arena-100" />
        <div className="h-4 w-3/4 animate-pulse rounded-full bg-arena-100" />
        <div className="h-3 w-full animate-pulse rounded-full bg-arena-100" />
        <div className="h-6 w-28 animate-pulse rounded-full bg-arena-100" />
      </div>
    </div>
  )
}
