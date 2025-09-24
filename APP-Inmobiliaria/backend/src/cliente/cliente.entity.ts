import {
  Entity,
  Property,
  ManyToMany,
  Cascade,
  Collection,
} from '@mikro-orm/core'
import { TipoDocumentacion } from '../tipodocumentacion/tipodocumentacion.entity.js'
import { Inmobiliaria } from '../inmobiliaria/inmobiliaria.entity.js'
import { Usuario } from '../shared/db/usuario.entity.js'

@Entity()
export class Cliente extends Usuario {
    @Property({nullable: false})
    tipo_documento!:string

    @Property({nullable: false, unique: true})
    nro_doc!:number

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