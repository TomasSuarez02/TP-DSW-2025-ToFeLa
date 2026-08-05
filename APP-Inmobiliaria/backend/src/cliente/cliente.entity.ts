import { Collection, Entity, OneToMany } from '@mikro-orm/core'
import { DocumentacionCliente } from '../documentacioncliente/documentacioncliente.entity.js'
import { Usuario } from '../shared/db/usuario.entity.js'
import { Senia } from '../senia/senia.entity.js'
import { Visita } from '../visita/visita.entity.js'
import { Alquiler } from '../alquiler/alquiler.entity.js'

/** Usuario con rol CLI. Comparte la tabla `usuario` con AgenteInmobiliario. */
@Entity({ discriminatorValue: 'CLI' })
export class Cliente extends Usuario {
  /** Entidad DocumentacionCliente del modelo: la presentación y su revisión. */
  @OneToMany(() => DocumentacionCliente, (dc) => dc.cliente, {
    nullable: true,
    orphanRemoval: true,
  })
  documentaciones = new Collection<DocumentacionCliente>(this)

  @OneToMany(() => Senia, (senia) => senia.cliente, { nullable: true })
  senias = new Collection<Senia>(this)

  @OneToMany(() => Visita, (visita) => visita.cliente, { nullable: true })
  visitas = new Collection<Visita>(this)

  @OneToMany(() => Alquiler, (alquiler) => alquiler.cliente, { nullable: true })
  alquileres = new Collection<Alquiler>(this)
}
