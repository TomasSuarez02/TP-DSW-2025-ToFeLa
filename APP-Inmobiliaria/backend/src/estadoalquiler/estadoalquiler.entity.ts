import { Collection, Entity, OneToMany, Property } from '@mikro-orm/core'
import { BaseEntity } from '../shared/db/baseEntity.entity.js'
import { Alquiler } from '../alquiler/alquiler.entity.js'

/** Valores de referencia; se cargan al iniciar (ver shared/db/seed.ts). */
export const ESTADOS_ALQUILER = ['pendiente', 'confirmado', 'cancelado', 'finalizado'] as const
export type DescripcionEstadoAlquiler = (typeof ESTADOS_ALQUILER)[number]

@Entity()
export class EstadoAlquiler extends BaseEntity {
  @Property({ nullable: false, unique: true })
  descripcion!: string

  @OneToMany(() => Alquiler, (alquiler) => alquiler.estadoAlquiler)
  alquileres = new Collection<Alquiler>(this)
}
