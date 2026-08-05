import { EntityManager } from '@mikro-orm/core'
import { Propiedad } from '../propiedad/propiedad.entity.js'
import { Senia } from './senia.entity.js'
import { estadoPropiedad } from '../shared/db/estados.js'

/**
 * Reglas de negocio de la seña. Están espejadas en el frontend
 * (frontend/src/config/senia.ts) y documentadas en docs/api-senias.md
 */

/** Porcentaje del precio de la propiedad que se exige como seña mínima. */
export const SENIA_PORCENTAJE = 0.2

/** Días corridos que la propiedad queda señada desde que se aprueba el pago. */
export const SENIA_DIAS_VENCIMIENTO = 10

export const ESTADOS_SENIA = ['pendiente_pago', 'confirmada', 'vencida', 'cancelada'] as const
export type EstadoSenia = (typeof ESTADOS_SENIA)[number]

/** Estados en los que la seña todavía compromete a la propiedad con ese cliente. */
export const ESTADOS_SENIA_ACTIVOS: EstadoSenia[] = ['pendiente_pago', 'confirmada']

/** Importe mínimo de seña para una propiedad de precio `precio`. */
export function calcularSeniaMinima(precio: number): number {
  return Math.round(Number(precio) * SENIA_PORCENTAJE)
}

/**
 * Saldo que el cliente todavía debe del primer mes: la seña es un adelanto
 * sobre el alquiler mensual, así que lo que falta es la diferencia.
 */
export function calcularSaldo(precio: number, importeSeniado: number): number {
  return Math.max(0, Number(precio) - Number(importeSeniado))
}

/** Fecha hasta la que queda señada una propiedad cuya seña se aprueba ahora. */
export function calcularFechaVencimiento(desde: Date = new Date()): Date {
  const vencimiento = new Date(desde)
  vencimiento.setDate(vencimiento.getDate() + SENIA_DIAS_VENCIMIENTO)
  return vencimiento
}

/** Marca la propiedad como señada: es el efecto de aprobar el pago de una seña. */
export async function senarPropiedad(em: EntityManager, propiedad: Propiedad): Promise<void> {
  propiedad.estadoPropiedad = await estadoPropiedad(em, 'señada')
}

/** Devuelve la propiedad a `disponible` si la estaba reteniendo una seña. */
export async function liberarPropiedad(em: EntityManager, propiedad: Propiedad): Promise<void> {
  if (propiedad.estado === 'señada' || propiedad.estado === 'reservada') {
    propiedad.estadoPropiedad = await estadoPropiedad(em, 'disponible')
  }
}

/**
 * Pasa a `vencida` toda seña confirmada cuyo plazo expiró y libera la propiedad.
 * Se ejecuta al consultar señas: alcanza para mantener los estados coherentes
 * sin depender de una tarea programada.
 */
export async function expirarSeniasVencidas(em: EntityManager): Promise<number> {
  const vencidas = await em.find(
    Senia,
    { estado: 'confirmada', fechaVencimiento: { $lt: new Date() } },
    { populate: ['propiedad', 'propiedad.estadoPropiedad'] },
  )

  let expiradas = 0
  for (const senia of vencidas) {
    // Si el agente ya concretó el alquiler, la seña cumplió su función.
    if (senia.propiedad.estado === 'alquilada') continue

    senia.estado = 'vencida'
    await liberarPropiedad(em, senia.propiedad)
    expiradas++
  }

  if (expiradas > 0) {
    await em.flush()
  }

  return expiradas
}
