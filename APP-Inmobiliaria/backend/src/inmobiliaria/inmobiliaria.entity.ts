import { Cascade, Collection, ManyToMany, Property } from "@mikro-orm/core";
import { Cliente } from "../cliente/cliente.entity.js";
import { BaseEntity } from "../shared/db/baseEntity.entity.js";
import { Propiedad } from "../propiedad/propiedad.entity.js";
import { AgenteInmobiliario } from "../agenteinmobiliario/agenteinmobiliario.entity.js";

export class Inmobiliaria extends BaseEntity {
  @Property({ nullable: false })
  nombre!: string;

  @Property({ nullable: false })
  direccion!: string;

  @Property({ nullable: false })
  telefono!: string;

  @ManyToMany(() => Cliente, cliente => cliente.inmobiliarias, { cascade: [Cascade.ALL] })
  clientes = new Collection<Cliente>(this);

  @ManyToMany(() => Propiedad, propiedad => propiedad.inmobiliaria, { cascade: [Cascade.ALL] })
  propiedades = new Collection<Propiedad>(this);

  @ManyToMany(() => AgenteInmobiliario, agente => agente.inmobiliaria, { cascade: [Cascade.ALL] })
  agentes = new Collection<AgenteInmobiliario>(this);
}

//chequear agente.inmobiliaria porqeu creo que es agente.inmobiliarias (ver en one note)