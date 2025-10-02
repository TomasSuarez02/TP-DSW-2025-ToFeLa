import { Entity, ManyToOne, Property, Collection, Cascade, ManyToMany, Rel, Unique } from "@mikro-orm/core";
import { Propiedad } from "../propiedad/propiedad.entity.js";
import { Cliente } from "../cliente/cliente.entity.js";
import { BaseEntity } from "../shared/db/baseEntity.entity.js";


@Entity()
@Unique({ properties: ['propiedad', 'cliente'] })
export class Senia extends BaseEntity {
    @Property({ nullable: false})
    importe!: number;

    @ManyToOne(() => Propiedad, { nullable: false })
    propiedad!: Rel<Propiedad>;

    @ManyToOne(() => Cliente, { nullable: false })
    cliente!: Rel<Cliente>;
}

/*constructor(
    public id: string,
    public direccion: string,
    public precio: number,
    public estado: string,
    public tipoPropiedadId: string,
    public inmobiliariaCuit: string // Relación con inmobiliaria
  )*/
