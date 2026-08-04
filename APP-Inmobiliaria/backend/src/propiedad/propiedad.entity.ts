import { Entity, ManyToOne, Opt, Property, Collection, Rel, OneToMany } from "@mikro-orm/core";
import { BaseEntity } from '../shared/db/baseEntity.entity.js'
import { Inmobiliaria } from '../inmobiliaria/inmobiliaria.entity.js'
import { TipoPropiedad } from "../tipopropiedad/tipopropiedad.entity.js";
import { EstadoPropiedad } from "../estadopropiedad/estadopropiedad.entity.js";
import { Imagen } from "../imagenes/imagen.entity.js";
import { Senia } from "../senia/senia.entity.js";
import { Visita } from "../visita/visita.entity.js";
import { Alquiler } from "../alquiler/alquiler.entity.js";

@Entity()
export class Propiedad extends BaseEntity {
    @Property({ nullable: false })
    direccion!: string;

    @Property({ nullable: true })
    superficie?: string;

    @Property({ columnType: 'decimal(12,2)', nullable: false })
    precio!: number;

    @Property({ type: 'time', nullable: false })
    hora_desde!: string;

    @Property({ type: 'time', nullable: false })
    hora_hasta!: string;

    @Property({ nullable: true, type: 'text' })
    descripcion?: string

    @ManyToOne(() => EstadoPropiedad, { nullable: false })
    estadoPropiedad!: Rel<EstadoPropiedad>;

    @ManyToOne(() => TipoPropiedad, { nullable: false })
    tipoPropiedad!: Rel<TipoPropiedad>;

    @ManyToOne(() => Inmobiliaria, { nullable: true })
    inmobiliaria!: Rel<Inmobiliaria>;

    // Sin cascadas problemáticas, solo orphanRemoval
    @OneToMany(() => Imagen, imagen => imagen.propiedad, {
      nullable: true,
      orphanRemoval: true
    })
    imagenes = new Collection<Imagen>(this);

    @OneToMany(() => Senia, senia => senia.propiedad, {
      nullable: true,
      orphanRemoval: true
    })
    senias = new Collection<Senia>(this);

    @OneToMany(() => Visita, visita => visita.propiedad, {
      nullable: true,
      orphanRemoval: true
    })
    visitas = new Collection<Visita>(this);

    @OneToMany(() => Alquiler, alquiler => alquiler.propiedad, {
      nullable: true,
      orphanRemoval: true
    })
    alquileres = new Collection<Alquiler>(this);

    /**
     * La API sigue exponiendo el estado como texto ('disponible', 'señada', ...)
     * aunque en la base sea una FK. Derivado: no se persiste.
     */
    @Property({ persist: false })
    get estado(): Opt<string | undefined> {
      return this.estadoPropiedad?.descripcion;
    }
  }
