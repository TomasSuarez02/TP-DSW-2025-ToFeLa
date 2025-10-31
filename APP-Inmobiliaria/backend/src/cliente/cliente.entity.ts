import {
  Entity,
  Property,
  ManyToMany,
  Cascade,
  Collection,
  OneToMany,
} from '@mikro-orm/core'
import { TipoDocumentacion } from '../tipodocumentacion/tipodocumentacion.entity.js'
import { Inmobiliaria } from '../inmobiliaria/inmobiliaria.entity.js'
import { Usuario } from '../shared/db/usuario.entity.js'
import { Senia } from '../senia/senia.entity.js';
import { Visita } from '../visita/visita.entity.js';

@Entity()
export class Cliente extends Usuario {

    @ManyToMany(() => TipoDocumentacion, documentacion => documentacion.clientes, { cascade: [Cascade.ALL] , owner: true , nullable: true})
    documentaciones = new Collection<TipoDocumentacion>(this);

    @ManyToMany(() => Inmobiliaria, (inmobiliaria) => inmobiliaria.clientes , {nullable: true})
    inmobiliarias = new Collection<Inmobiliaria>(this);

    @OneToMany(() => Senia, senia => senia.cliente, {
          nullable: true,
        })
        senias = new Collection<Senia>(this);

    @OneToMany(() => Visita, visita => visita.cliente, {
          nullable: true,
        })
        visitas = new Collection<Visita>(this);
}
    
    /*constructor(
        public nombre: string,
        public apellido: string,
        public mail: string,
        public telefono: string,
        public id: string
    ){}}
        */