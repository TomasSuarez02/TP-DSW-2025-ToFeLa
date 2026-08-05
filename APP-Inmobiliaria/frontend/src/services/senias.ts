import apiClient from '../utils/apiClient'
import { USA_PAGO_MOCK } from '../config/senia'
import { leerEstadoMock, guardarEstadoMock } from './mockPagos'
import type { EstadoSenia, MedioPago, Senia } from '../types/senia'

/** Lo que devuelve el backend al concretar: el alquiler creado y el saldo cobrado. */
export interface ResultadoConcretar {
  alquiler: { clave: string; monto_mensual: number }
  senia: { clave: string; importe: number }
  saldoCobrado: number
}

/**
 * Acceso a la API de señas. Todos los componentes deben pasar por acá en vez de
 * llamar a axios directamente, así el día que cambie el contrato se toca un solo lugar.
 * Ver docs/api-senias.md
 *
 * La seña se identifica por `clave`, la PK compuesta (propiedad + cliente + fecha)
 * que el backend codifica como string para poder usarla en las rutas.
 */

type SeniaCruda = Partial<Senia> & { clave: string }

/**
 * Completa los campos que el backend todavía puede no enviar.
 * En modo mock además aplica el estado guardado localmente tras pagar.
 */
function normalizarSenia(cruda: SeniaCruda): Senia {
  const senia: Senia = {
    clave: cruda.clave,
    importe: Number(cruda.importe ?? 0),
    estado: (cruda.estado as EstadoSenia) ?? 'pendiente_pago',
    fechaVencimiento: cruda.fechaVencimiento ?? null,
    concretada: cruda.concretada ?? false,
    fecha_hora_senia: cruda.fecha_hora_senia,
    propiedad: cruda.propiedad,
    cliente: cruda.cliente,
    pago: cruda.pago ?? null,
  }

  if (USA_PAGO_MOCK) {
    const mock = leerEstadoMock(senia.clave)
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

export async function obtenerSenia(clave: string): Promise<Senia> {
  const res = await apiClient.get(`/senias/${clave}`)
  return normalizarSenia((res.data?.data ?? res.data) as SeniaCruda)
}

/** Crea la seña del cliente autenticado. Queda en `pendiente_pago` hasta que se pague. */
export async function crearSenia(propiedadId: number, importe: number): Promise<Senia> {
  const res = await apiClient.post('/senias/cliente', { propiedad: propiedadId, importe })
  return normalizarSenia((res.data?.data ?? res.data) as SeniaCruda)
}

/** Cancela una seña propia que todavía no fue pagada. */
export async function cancelarSenia(clave: string): Promise<void> {
  if (USA_PAGO_MOCK) {
    guardarEstadoMock(clave, { estado: 'cancelada', fechaVencimiento: null, pago: null })
    return
  }
  await apiClient.patch(`/senias/${clave}/cancelar`)
}

/** Cambia el estado de una seña (administración). */
export async function actualizarEstadoSenia(clave: string, estado: EstadoSenia): Promise<void> {
  if (USA_PAGO_MOCK) {
    const actual = leerEstadoMock(clave)
    guardarEstadoMock(clave, { ...actual, estado })
    return
  }
  await apiClient.patch(`/senias/${clave}/estado`, { estado })
}

export async function eliminarSenia(clave: string): Promise<void> {
  await apiClient.delete(`/senias/${clave}`)
}

/**
 * Cierra el flujo: convierte la seña en un alquiler.
 * El backend crea el Alquiler, registra el cobro del saldo y pone la propiedad
 * en `alquilada`, siempre que la documentación del cliente esté aprobada.
 */
export async function concretarAlquiler(
  clave: string,
  datos: { fecha_inicio: string; fecha_fin: string; medioPago: MedioPago },
): Promise<ResultadoConcretar> {
  const res = await apiClient.post(`/senias/${clave}/concretar`, datos)
  return (res.data?.data ?? res.data) as ResultadoConcretar
}

/** Libera la propiedad, por ejemplo al eliminar o cancelar una seña. */
export async function liberarPropiedad(propiedadId: number): Promise<void> {
  await apiClient.put(`/propiedades/${propiedadId}`, { estado: 'disponible' })
}
