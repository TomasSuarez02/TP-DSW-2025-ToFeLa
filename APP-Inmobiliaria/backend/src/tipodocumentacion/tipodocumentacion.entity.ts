import {Entity, ManyToMany, Property, Collection, Cascade, Rel } from "@mikro-orm/core";
import { BaseEntity } from '../shared/db/baseEntity.entity.js'
import { Cliente } from "../cliente/cliente.entity.js";

@Entity()
export class TipoDocumentacion extends BaseEntity {
    @Property({ nullable: false })
    nombre!: string;

    @Property({ nullable: false })
    descripcion!: string;

    @Property({ nullable: false })
    fechaVencimiento!: Date;

    /*@Property({ nullable: false })
    archivoURL!: string;*/

    @ManyToMany(() => Cliente, cliente => cliente.documentaciones, {nullable: true})
    clientes = new Collection<Rel<Cliente>>(this);
}