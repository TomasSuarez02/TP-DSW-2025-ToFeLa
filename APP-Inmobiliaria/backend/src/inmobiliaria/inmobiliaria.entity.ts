import { Collection, Entity, OneToMany, Property, Rel } from "@mikro-orm/core";
import { BaseEntity } from "../shared/db/baseEntity.entity.js";
import { Propiedad } from "../propiedad/propiedad.entity.js";
import { AgenteInmobiliario } from "../agenteinmobiliario/agenteinmobiliario.entity.js";

@Entity()
export class Inmobiliaria extends BaseEntity {
  @Property({ nullable: false })
  descripcion!: string;

  @Property({ nullable: false })
  direccion!: string;

  @Property({ nullable: false })
  telefono!: string;

  @OneToMany(() => Propiedad, propiedad => propiedad.inmobiliaria, {nullable: true})
  propiedades = new Collection<Rel<Propiedad>>(this);

  @OneToMany(() => AgenteInmobiliario, (agente) => agente.inmobiliaria, {nullable: true})
  agentes = new Collection<AgenteInmobiliario>(this);
}
