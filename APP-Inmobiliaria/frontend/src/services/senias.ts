import apiClient from '../utils/apiClient'
import { USA_PAGO_MOCK } from '../config/senia'
import { leerEstadoMock, guardarEstadoMock } from './mockPagos'
import type { EstadoSenia, Senia } from '../types/senia'

/**
 * Acceso a la API de señas. Todos los componentes deben pasar por acá en vez de
 * llamar a axios directamente, así el día que cambie el contrato se toca un solo lugar.
 * Ver docs/api-senias.md
 */

type SeniaCruda = Partial<Senia> & { id: number }

/**
 * Completa los campos que el backend todavía puede no enviar.
 * En modo mock además aplica el estado guardado localmente tras pagar.
 */
function normalizarSenia(cruda: SeniaCruda): Senia {
  const senia: Senia = {
    id: cruda.id,
    importe: Number(cruda.importe ?? 0),
    estado: (cruda.estado as EstadoSenia) ?? 'pendiente_pago',
    fechaVencimiento: cruda.fechaVencimiento ?? null,
    fechaCreacion: cruda.fechaCreacion,
    propiedad: cruda.propiedad,
    cliente: cruda.cliente,
    pago: cruda.pago ?? null,
  }

  if (USA_PAGO_MOCK) {
    const mock = leerEstadoMock(senia.id)
    if (mock) {
      senia.estado = mock.estado
      senia.fechaVencimiento = mock.fechaVencimiento ?? null
      senia.pago = mock.pago ?? null
    }
  }

  return senia
}

function normalizarLista(datos: unknown): Senia[] {
  if (!Array.isArray(datos)) return []
  return datos.map((item) => normalizarSenia(item as SeniaCruda))
}

/** Señas del cliente autenticado. */
export async function obtenerMisSenias(): Promise<Senia[]> {
  const res = await apiClient.get('/senias/mis-senias')
  return normalizarLista(res.data?.data)
}

/** Todas las señas (vista de administración). */
export async function obtenerSenias(): Promise<Senia[]> {
  const res = await apiClient.get('/senias')
  return normalizarLista(res.data?.data)
}

export async function obtenerSenia(id: number): Promise<Senia> {
  const res = await apiClient.get(`/senias/${id}`)
  return normalizarSenia((res.data?.data ?? res.data) as SeniaCruda)
}

/** Crea la seña del cliente autenticado. Queda en `pendiente_pago` hasta que se pague. */
export async function crearSenia(propiedadId: number, importe: number): Promise<Senia> {
  const res = await apiClient.post('/senias/cliente', { propiedad: propiedadId, importe })
  return normalizarSenia((res.data?.data ?? res.data) as SeniaCruda)
}

/** Cancela una seña propia que todavía no fue pagada. */
export async function cancelarSenia(id: number): Promise<void> {
  if (USA_PAGO_MOCK) {
    guardarEstadoMock(id, { estado: 'cancelada', fechaVencimiento: null, pago: null })
    return
  }
  await apiClient.patch(`/senias/${id}/cancelar`)
}

/** Cambia el estado de una seña (administración). */
export async function actualizarEstadoSenia(id: number, estado: EstadoSenia): Promise<void> {
  if (USA_PAGO_MOCK) {
    const actual = leerEstadoMock(id)
    guardarEstadoMock(id, { ...actual, estado })
    return
  }
  await apiClient.patch(`/senias/${id}/estado`, { estado })
}

export async function eliminarSenia(id: number): Promise<void> {
  await apiClient.delete(`/senias/${id}`)
}

/** Marca la propiedad como alquilada una vez presentados papeles y saldo. */
export async function marcarPropiedadAlquilada(propiedadId: number): Promise<void> {
  await apiClient.put(`/propiedades/${propiedadId}`, { estado: 'alquilada' })
}

/** Libera la propiedad, por ejemplo al eliminar o cancelar una seña. */
export async function liberarPropiedad(propiedadId: number): Promise<void> {
  await apiClient.put(`/propiedades/${propiedadId}`, { estado: 'disponible' })
}
