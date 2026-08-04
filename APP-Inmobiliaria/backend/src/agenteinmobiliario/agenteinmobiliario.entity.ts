import { Entity, ManyToOne, Property, Rel } from '@mikro-orm/core'
import { Usuario } from '../shared/db/usuario.entity.js'
import { Inmobiliaria } from '../inmobiliaria/inmobiliaria.entity.js'

/**
 * Usuario con rol AGE. Comparte la tabla `usuario` con Cliente, así que estas
 * columnas existen en esa tabla y son nulables para las filas de rol CLI.
 */
@Entity({ discriminatorValue: 'AGE' })
export class AgenteInmobiliario extends Usuario {
  @Property({ type: 'date', nullable: true })
  fecha_ingreso?: Date | null

  @ManyToOne(() => Inmobiliaria, { nullable: true })
  inmobiliaria?: Rel<Inmobiliaria> | null
}
