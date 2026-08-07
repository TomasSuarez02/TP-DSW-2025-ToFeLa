import apiClient from '../utils/apiClient'
import type { Tono } from '../components/ui/Badge'

/**
 * Acceso a la API de visitas, más el vocabulario de estado que las dos
 * pantallas comparten. El estado no vive en la base: una visita "pendiente" o
 * "realizada" es su fecha comparada con ahora, y esa cuenta tiene que dar lo
 * mismo en la agenda del agente que en la del cliente.
 *
 * La visita se identifica por `clave`, la PK compuesta (propiedad + cliente +
 * fecha) que el backend codifica como string para poder usarla en las rutas.
 */

export interface Visita {
  /** PK compuesta (propiedad + cliente + fecha) codificada por el backend. */
  clave: string
  fecha_hora: string
  cliente: {
    id: number
    nombre: string
    apellido: string
    mail: string
    telefono?: string
  }
  propiedad: {
    id: number
    direccion: string
    precio: number
  }
}

function normalizarLista(datos: unknown): Visita[] {
  return Array.isArray(datos) ? (datos as Visita[]) : []
}

/** La agenda completa (vista de administración). */
export async function obtenerVisitas(): Promise<Visita[]> {
  const res = await apiClient.get('/visitas')
  return normalizarLista(res.data?.data ?? res.data)
}

/** Visitas del cliente autenticado. */
export async function obtenerMisVisitas(): Promise<Visita[]> {
  const res = await apiClient.get('/visitas/mis-visitas')
  return normalizarLista(res.data?.data ?? res.data)
}

/**
 * Da de baja la visita. El agente puede con cualquiera; al cliente el backend
 * sólo le acepta las propias y todavía futuras.
 */
export async function eliminarVisita(clave: string): Promise<void> {
  await apiClient.delete(`/visitas/${clave}`)
}

const UNA_HORA = 60 * 60 * 1000

export function esHoy(fecha: string): boolean {
  const visita = new Date(fecha)
  const hoy = new Date()
  return (
    visita.getDate() === hoy.getDate() &&
    visita.getMonth() === hoy.getMonth() &&
    visita.getFullYear() === hoy.getFullYear()
  )
}

export const yaPaso = (fecha: string) => new Date(fecha).getTime() < Date.now()

export const esInminente = (fecha: string) => {
  const falta = new Date(fecha).getTime() - Date.now()
  return falta > 0 && falta <= UNA_HORA
}

/** Un único vocabulario de estado, en vez de cinco combinaciones de color. */
export function estadoVisita(fecha: string): { tono: Tono; texto: string } {
  if (esInminente(fecha)) return { tono: 'ambar', texto: 'En menos de 1 h' }
  if (yaPaso(fecha)) return { tono: 'arena', texto: 'Realizada' }
  if (esHoy(fecha)) return { tono: 'ambar', texto: 'Hoy' }
  return { tono: 'salvia', texto: 'Pendiente' }
}
