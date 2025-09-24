import { Entity, PrimaryKey, Property, ManyToOne, Cascade, Rel } from '@mikro-orm/core';
import { Inmobiliaria } from '../inmobiliaria/inmobiliaria.entity.js';
import { BaseEntity } from '../shared/db/baseEntity.entity.js';
import { Cliente } from '../cliente/cliente.entity.js';

@Entity()
export class AgenteInmobiliario extends BaseEntity {
  @Property({ nullable: false })
  nombre!: string;

  @Property({ nullable: false })
  apellido!: string;

  @Property({ nullable: false, unique: true })
  email!: string;

  @Property({ nullable: false })
  telefono!: string;

  @Property({ nullable: false })
  fechaIngreso!: Date;

  @ManyToOne(() => Inmobiliaria , {nullable: true})
  inmobiliaria!: Rel<Inmobiliaria>;

}
//