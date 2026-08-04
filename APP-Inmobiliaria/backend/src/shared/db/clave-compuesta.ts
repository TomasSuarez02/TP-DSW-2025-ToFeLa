/**
 * Seña, Visita y Alquiler tienen clave primaria compuesta (propiedad + cliente +
 * fecha), como en el modelo de datos. Una PK compuesta no entra en una ruta REST
 * del estilo `/recurso/:id`, así que la codificamos en un string URL-safe:
 *
 *   19-13-1754325480000   →   propiedad 19, cliente 13, fecha en epoch ms
 *
 * Las entidades la exponen como `clave` y las rutas la reciben como `:clave`.
 */

export interface ClaveCompuesta {
  propiedad: number
  cliente: number
  fecha: Date
}

export function serializarClave(
  propiedad: number,
  cliente: number,
  fecha: Date,
): string {
  return `${propiedad}-${cliente}-${fecha.getTime()}`
}

/** Devuelve null si la clave está mal formada, para responder 400 en vez de romper. */
export function parsearClave(clave: string): ClaveCompuesta | null {
  const partes = String(clave ?? '').split('-')
  if (partes.length !== 3) return null

  const [propiedad, cliente, fechaMs] = partes.map(Number)
  if (![propiedad, cliente, fechaMs].every(Number.isFinite)) return null

  const fecha = new Date(fechaMs)
  if (Number.isNaN(fecha.getTime())) return null

  return { propiedad, cliente, fecha }
}
