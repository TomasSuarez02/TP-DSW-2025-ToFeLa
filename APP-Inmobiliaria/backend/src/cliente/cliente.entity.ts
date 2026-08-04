import { Cascade, Collection, Entity, ManyToMany, OneToMany } from '@mikro-orm/core'
import { Documentacion } from '../documentacion/documentacion.entity.js'
import { Usuario } from '../shared/db/usuario.entity.js'
import { Senia } from '../senia/senia.entity.js'
import { Visita } from '../visita/visita.entity.js'
import { Alquiler } from '../alquiler/alquiler.entity.js'

/** Usuario con rol CLI. Comparte la tabla `usuario` con AgenteInmobiliario. */
@Entity({ discriminatorValue: 'CLI' })
export class Cliente extends Usuario {
  /** Tabla intermedia DocumentacionCliente del modelo. */
  @ManyToMany(() => Documentacion, (documentacion) => documentacion.clientes, {
    cascade: [Cascade.ALL],
    owner: true,
    nullable: true,
    pivotTable: 'documentacion_cliente',
  })
  documentaciones = new Collection<Documentacion>(this)

  @OneToMany(() => Senia, (senia) => senia.cliente, { nullable: true })
  senias = new Collection<Senia>(this)

  @OneToMany(() => Visita, (visita) => visita.cliente, { nullable: true })
  visitas = new Collection<Visita>(this)

  @OneToMany(() => Alquiler, (alquiler) => alquiler.cliente, { nullable: true })
  alquileres = new Collection<Alquiler>(this)
}
