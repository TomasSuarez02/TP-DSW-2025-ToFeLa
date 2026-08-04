import { Collection, Entity, ManyToMany, Property, Rel } from '@mikro-orm/core'
import { BaseEntity } from '../shared/db/baseEntity.entity.js'
import { Cliente } from '../cliente/cliente.entity.js'

@Entity()
export class Documentacion extends BaseEntity {
  @Property({ nullable: false })
  descripcion!: string

  @Property({ type: 'date', nullable: false })
  fecha_vencimiento!: Date

  /** Ruta del archivo subido. */
  @Property({ nullable: true })
  path?: string

  @ManyToMany(() => Cliente, (cliente) => cliente.documentaciones, { nullable: true })
  clientes = new Collection<Rel<Cliente>>(this)
}
