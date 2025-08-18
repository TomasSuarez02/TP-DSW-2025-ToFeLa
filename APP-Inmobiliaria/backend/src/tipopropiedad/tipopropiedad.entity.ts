import { ManyToMany, Property, Collection, Cascade } from "@mikro-orm/core";
import { BaseEntity } from '../shared/db/baseEntity.entity.js'
import { Cliente } from "../cliente/cliente.entity.js";
import { Propiedad } from "../propiedad/propiedad.entity.js";


export class TipoPropiedad extends BaseEntity {
    @Property({ nullable: false })
    nombre!: string;

    @Property({ nullable: false })
    descripcion!: string;

    @Property({ nullable: false })
    estado!: string;

    @ManyToMany(() => Propiedad, propiedad => propiedad.tiposPropiedad, { cascade: [Cascade.ALL] })
    propiedades = new Collection<Propiedad>(this);
}
/*constructor(
    public id: string,
    public nombre: string,
    public descripcion: string,
    public estado: string*/