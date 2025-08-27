import { Entity, PrimaryKey, Property, ManyToOne, Cascade } from '@mikro-orm/core';
import { Inmobiliaria } from '../inmobiliaria/inmobiliaria.entity.js';
import { BaseEntity } from '../shared/db/baseEntity.entity.js';

@Entity()
export class AgenteInmobiliario extends BaseEntity {
  @Property({ nullable: false })
  nombre!: string;

  @Property({ nullable: false })
  apellido!: string;

  @Property({ nullable: false })
  email!: string;

  @Property({ nullable: false })
  telefono!: number;

  @Property({ nullable: false })
  fechaIngreso!: Date;

  @ManyToOne(() => Inmobiliaria, { nullable: false, cascade: [Cascade.ALL] })
  inmobiliaria!: Inmobiliaria;
}
