import apiClient from '../utils/apiClient'
import { USA_PAGO_MOCK, calcularFechaVencimiento } from '../config/senia'
import { generarReferencia, guardarEstadoMock } from './mockPagos'
import { soloDigitos, tarjetaEsAprobada, ultimosCuatro } from '../utils/tarjeta'
import type { DatosTarjeta, Pago, Senia } from '../types/senia'

/**
 * Pasarela de pago simulada. No hay dinero real involucrado: el resultado se
 * decide por el número de tarjeta (ver docs/api-senias.md).
 */

export interface ResultadoPago {
  aprobado: boolean
  pago?: Pago
  mensaje?: string
  fechaVencimiento?: string
}

const DEMORA_SIMULADA_MS = 1500

function esperar(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/** Simula el pago íntegramente en el navegador, sin backend. */
async function procesarPagoMock(senia: Senia, datos: DatosTarjeta): Promise<ResultadoPago> {
  await esperar(DEMORA_SIMULADA_MS)

  const aprobado = tarjetaEsAprobada(datos.numeroTarjeta)
  const pago: Pago = {
    estado: aprobado ? 'aprobado' : 'rechazado',
    monto: senia.importe,
    ultimosCuatro: ultimosCuatro(datos.numeroTarjeta),
    fecha: new Date().toISOString(),
    referencia: generarReferencia(),
  }

  if (!aprobado) {
    return { aprobado: false, pago, mensaje: 'El pago fue rechazado por la entidad emisora' }
  }

  const fechaVencimiento = calcularFechaVencimiento().toISOString()
  guardarEstadoMock(senia.clave, { estado: 'confirmada', fechaVencimiento, pago })

  return { aprobado: true, pago, fechaVencimiento }
}

/**
 * Procesa el pago de una seña.
 * Con VITE_USE_MOCK=true no llega al backend; si no, hace POST /api/pagos.
 */
export async function procesarPago(senia: Senia, datos: DatosTarjeta): Promise<ResultadoPago> {
  if (USA_PAGO_MOCK) {
    return procesarPagoMock(senia, datos)
  }

  const res = await apiClient.post('/pagos', {
    senia: senia.clave,
    numeroTarjeta: soloDigitos(datos.numeroTarjeta),
    titular: datos.titular.trim(),
    vencimiento: datos.vencimiento,
    cvv: datos.cvv,
  })

  const pago = (res.data?.data ?? res.data) as Pago & { senia?: { fechaVencimiento?: string } }

  return {
    aprobado: pago?.estado === 'aprobado',
    pago,
    fechaVencimiento: pago?.senia?.fechaVencimiento,
    mensaje: res.data?.message,
  }
}
