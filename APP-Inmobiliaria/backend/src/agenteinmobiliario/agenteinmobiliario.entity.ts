import { Entity, PrimaryKey, Property, ManyToOne, Cascade, Rel } from '@mikro-orm/core';
import { Inmobiliaria } from '../inmobiliaria/inmobiliaria.entity.js';
import { Usuario } from '../shared/db/usuario.entity.js'

@Entity()
export class AgenteInmobiliario extends Usuario {

  @Property({ nullable: false })
  fechaIngreso!: Date;

  @ManyToOne(() => Inmobiliaria , {nullable: true})
  inmobiliaria!: Rel<Inmobiliaria>;

}
//