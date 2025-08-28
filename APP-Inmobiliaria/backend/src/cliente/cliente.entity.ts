import {
  Entity,
  Property,
  ManyToMany,
  Cascade,
  Collection,
} from '@mikro-orm/core'
import { BaseEntity } from '../shared/db/baseEntity.entity.js'
import { TipoDocumentacion } from '../tipodocumentacion/tipodocumentacion.entity.js'
import { Inmobiliaria } from '../inmobiliaria/inmobiliaria.entity.js'

@Entity()
export class Cliente extends BaseEntity {
    @Property({nullable: false})
    nombre!:string

    @Property({nullable: false})
    apellido!:string

    @Property({nullable: false})
    tipo_documento!:string

    @Property({nullable: false})
    nro_doc!:number

    @Property({nullable: false})
    telefono!:string

    @Property({nullable: false})
    direccion!:string

    @ManyToMany(() => TipoDocumentacion, documentacion => documentacion.clientes, { cascade: [Cascade.ALL] , owner: true , nullable: true})
    documentaciones = new Collection<TipoDocumentacion>(this);

    @ManyToMany(() => Inmobiliaria, (inmobiliaria) => inmobiliaria.clientes , {nullable: true})
    inmobiliarias = new Collection<Inmobiliaria>(this);
}
    
    /*constructor(
        public nombre: string,
        public apellido: string,
        public mail: string,
        public telefono: string,
        public id: string
    ){}}
        */