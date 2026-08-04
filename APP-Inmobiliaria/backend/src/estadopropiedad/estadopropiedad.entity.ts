import { Collection, Entity, OneToMany, Property } from '@mikro-orm/core'
import { BaseEntity } from '../shared/db/baseEntity.entity.js'
import { Propiedad } from '../propiedad/propiedad.entity.js'

/** Valores de referencia; se cargan al iniciar (ver shared/db/seed.ts). */
export const ESTADOS_PROPIEDAD = ['disponible', 'reservada', 'señada', 'alquilada'] as const
export type DescripcionEstadoPropiedad = (typeof ESTADOS_PROPIEDAD)[number]

@Entity()
export class EstadoPropiedad extends BaseEntity {
  @Property({ nullable: false, unique: true })
  descripcion!: string

  @OneToMany(() => Propiedad, (propiedad) => propiedad.estadoPropiedad)
  propiedades = new Collection<Propiedad>(this)
}
