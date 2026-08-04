import type { EstadoSenia, Pago } from '../types/senia'

/**
 * Estado simulado de las señas mientras el backend no expone `estado`, `pago` ni
 * `fechaVencimiento`. Se guarda en localStorage para que sobreviva a un refresh
 * durante una demo. Cuando el backend implemente el contrato de docs/api-senias.md
 * basta con poner VITE_USE_MOCK=false y este archivo deja de usarse.
 */

const CLAVE = 'mockSenias'

export interface EstadoMock {
  estado: EstadoSenia
  fechaVencimiento?: string | null
  pago?: Pago | null
}

type Almacen = Record<string, EstadoMock>

function leerAlmacen(): Almacen {
  try {
    const crudo = localStorage.getItem(CLAVE)
    return crudo ? (JSON.parse(crudo) as Almacen) : {}
  } catch {
    return {}
  }
}

function escribirAlmacen(almacen: Almacen): void {
  try {
    localStorage.setItem(CLAVE, JSON.stringify(almacen))
  } catch (error) {
    console.warn('No se pudo persistir el estado simulado de las señas', error)
  }
}

export function leerEstadoMock(clave: string): EstadoMock | undefined {
  return leerAlmacen()[clave]
}

export function guardarEstadoMock(clave: string, estado: EstadoMock): void {
  const almacen = leerAlmacen()
  almacen[clave] = estado
  escribirAlmacen(almacen)
}

export function generarReferencia(): string {
  return `MOCK-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
}
