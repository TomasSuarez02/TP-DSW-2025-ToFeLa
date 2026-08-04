import { Property, Collection, Entity, OneToMany } from "@mikro-orm/core";
import { BaseEntity } from '../shared/db/baseEntity.entity.js'
import { Propiedad } from "../propiedad/propiedad.entity.js";

@Entity()
export class TipoPropiedad extends BaseEntity {
    @Property({ nullable: false })
    descripcion!: string;

    @OneToMany(() => Propiedad, propiedad => propiedad.tipoPropiedad )
    propiedades = new Collection<Propiedad>(this);
}
