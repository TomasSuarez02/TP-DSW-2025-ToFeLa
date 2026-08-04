import { Entity, ManyToOne, PrimaryKey, Property, Rel } from "@mikro-orm/core";
import { Propiedad } from "../propiedad/propiedad.entity.js";

/** Entidad débil: su identidad depende de la propiedad a la que pertenece. */
@Entity()
export class Imagen {
    @PrimaryKey()
    id!: number;

    @ManyToOne(() => Propiedad, { nullable: false, primary: true })
    propiedad!: Rel<Propiedad>;

    @Property({ nullable: false })
    path!: string;
}
