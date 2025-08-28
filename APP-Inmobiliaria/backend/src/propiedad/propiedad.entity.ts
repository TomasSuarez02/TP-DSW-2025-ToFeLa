import { Entity, ManyToOne, Property, Collection, Cascade, ManyToMany, Rel } from "@mikro-orm/core";
import { BaseEntity } from '../shared/db/baseEntity.entity.js'
import { Inmobiliaria } from '../inmobiliaria/inmobiliaria.entity.js'
import { TipoPropiedad } from "../tipopropiedad/tipopropiedad.entity.js";

@Entity()
export class Propiedad extends BaseEntity {
    @Property({ nullable: false })
    direccion!: string;

    @Property({ nullable: false })
    precio!: number;

    @Property({ nullable: false })
    estado!: string;

    @ManyToMany(() => TipoPropiedad, (tipoPropiedad) => tipoPropiedad.propiedades, { cascade: [Cascade.ALL], owner: true , nullable: true})
    tiposPropiedad = new Collection<TipoPropiedad>(this);

    @ManyToOne(() => Inmobiliaria, { nullable: true, cascade: [Cascade.ALL] })
    inmobiliaria!: Rel<Inmobiliaria>;
}

/*constructor(
    public id: string,
    public direccion: string,
    public precio: number,
    public estado: string,
    public tipoPropiedadId: string,
    public inmobiliariaCuit: string // Relación con inmobiliaria
  )*/
