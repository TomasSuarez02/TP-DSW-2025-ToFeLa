import { Entity, ManyToOne, Property, Collection, Cascade, ManyToMany, Rel, OneToMany } from "@mikro-orm/core";
import { BaseEntity } from '../shared/db/baseEntity.entity.js'
import { Inmobiliaria } from '../inmobiliaria/inmobiliaria.entity.js'
import { TipoPropiedad } from "../tipopropiedad/tipopropiedad.entity.js";
import { Imagen } from "../imagenes/imagen.entity.js";

@Entity()
export class Propiedad extends BaseEntity {
    @Property({ nullable: false })
    direccion!: string;

    @Property({ nullable: false })
    precio!: number;

    @Property({ nullable: false })
    estado!: string;

    @Property({ type: 'time', nullable: false })
    hora_desde!: string;

    @Property({ type: 'time', nullable: false })
    hora_hasta!: string;

    @Property({ nullable: true, type: 'text' })
    descripcion?: string
    
    @ManyToOne(() => TipoPropiedad, { nullable: false })
    tipoPropiedad!: Rel<TipoPropiedad>;

    @ManyToOne(() => Inmobiliaria, { nullable: true })
    inmobiliaria!: Rel<Inmobiliaria>;

    // ✅ Sin cascadas problemáticas, solo orphanRemoval
    @OneToMany(() => Imagen, imagen => imagen.propiedad, { 
      nullable: true,
      orphanRemoval: true 
    })
    imagenes = new Collection<Imagen>(this);
}

/*constructor(
    public id: string,
    public direccion: string,
    public precio: number,
    public estado: string,
    public tipoPropiedadId: string,
    public inmobiliariaCuit: string // Relación con inmobiliaria
  )*/
