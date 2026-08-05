import { Entity, Property } from '@mikro-orm/core'
import { BaseEntity } from '../shared/db/baseEntity.entity.js'

export const ESTADOS_PAGO = ['pendiente', 'aprobado', 'rechazado'] as const
export type EstadoPago = (typeof ESTADOS_PAGO)[number]

export const MEDIOS_PAGO = ['tarjeta', 'efectivo', 'transferencia'] as const
export type MedioPago = (typeof MEDIOS_PAGO)[number]

/**
 * Cobro registrado por la inmobiliaria. Cubre los dos momentos del flujo:
 * la seña que el cliente paga online con tarjeta (`Senia.pago`) y el saldo
 * del primer mes que entrega presencialmente al firmar (`Alquiler.pagoSaldo`).
 *
 * Los campos de tarjeta son nulables porque un cobro en efectivo o por
 * transferencia no los tiene. Del número de tarjeta solo se guardan los
 * últimos cuatro dígitos; el número completo y el CVV nunca se persisten.
 */
@Entity()
export class Pago extends BaseEntity {
  @Property({ nullable: false, default: 'pendiente' })
  estado: EstadoPago = 'pendiente'

  @Property({ nullable: false, default: 'tarjeta' })
  medio: MedioPago = 'tarjeta'

  @Property({ columnType: 'decimal(12,2)', nullable: false })
  monto!: number

  @Property({ nullable: true, length: 4 })
  ultimosCuatro?: string | null

  @Property({ nullable: true })
  titular?: string | null

  @Property({ type: 'datetime', nullable: false })
  fecha: Date = new Date()

  @Property({ nullable: false })
  referencia!: string
}
