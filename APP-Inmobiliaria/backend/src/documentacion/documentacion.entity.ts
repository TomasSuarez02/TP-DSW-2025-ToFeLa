import { Collection, Entity, OneToMany, Property } from '@mikro-orm/core'
import { BaseEntity } from '../shared/db/baseEntity.entity.js'
import { DocumentacionCliente } from '../documentacioncliente/documentacioncliente.entity.js'

@Entity()
export class Documentacion extends BaseEntity {
  @Property({ nullable: false })
  descripcion!: string

  @Property({ type: 'date', nullable: false })
  fecha_vencimiento!: Date

  /** Ruta del archivo subido. */
  @Property({ nullable: true })
  path?: string

  @OneToMany(() => DocumentacionCliente, (dc) => dc.documentacion, {
    nullable: true,
    orphanRemoval: true,
  })
  clientes = new Collection<DocumentacionCliente>(this)
}
