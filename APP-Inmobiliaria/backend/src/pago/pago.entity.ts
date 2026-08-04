import { Entity, Property } from '@mikro-orm/core'
import { BaseEntity } from '../shared/db/baseEntity.entity.js'

export const ESTADOS_PAGO = ['pendiente', 'aprobado', 'rechazado'] as const
export type EstadoPago = (typeof ESTADOS_PAGO)[number]

/**
 * Intento de pago de una seña contra la pasarela simulada.
 * Del número de tarjeta solo se guardan los últimos cuatro dígitos; el número
 * completo y el CVV nunca se persisten.
 */
@Entity()
export class Pago extends BaseEntity {
  @Property({ nullable: false, default: 'pendiente' })
  estado: EstadoPago = 'pendiente'

  @Property({ nullable: false })
  monto!: number

  @Property({ nullable: false, length: 4 })
  ultimosCuatro!: string

  @Property({ nullable: false })
  titular!: string

  @Property({ type: 'datetime', nullable: false })
  fecha: Date = new Date()

  @Property({ nullable: false })
  referencia!: string
}
