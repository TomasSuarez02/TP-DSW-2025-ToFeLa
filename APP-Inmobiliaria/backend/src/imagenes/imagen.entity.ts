import { Entity, ManyToOne, Property, Collection, Cascade, ManyToMany, Rel } from "@mikro-orm/core";
import { BaseEntity } from '../shared/db/baseEntity.entity.js'
import { Propiedad } from "../propiedad/propiedad.entity.js";


@Entity()
export class Imagen extends BaseEntity {
    @Property({ nullable: false })
    path!: string;

    @ManyToOne(() => Propiedad, { nullable: false })
    propiedad!: Rel<Propiedad>;
}

/*constructor(
    public id: string,
    public direccion: string,
    public precio: number,
    public estado: string,
    public tipoPropiedadId: string,
    public inmobiliariaCuit: string // Relación con inmobiliaria
  )*/
