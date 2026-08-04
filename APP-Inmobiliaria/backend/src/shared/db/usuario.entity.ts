import { Entity, Enum, Property } from '@mikro-orm/core'
import { BaseEntity } from './baseEntity.entity.js'

/** Discriminador del modelo: CLI = Cliente, AGE = Agente Inmobiliario. */
export enum RolUsuario {
  CLIENTE = 'CLI',
  AGENTE = 'AGE',
}

/**
 * Tabla única `usuario` con discriminador `rol`, como en el modelo de datos.
 * Cliente y AgenteInmobiliario son subclases que comparten esta tabla: las
 * columnas declaradas solo en una subclase (fecha_ingreso, inmobiliaria_id)
 * viven igual en `usuario` y quedan nulables.
 */
@Entity({
  tableName: 'usuario',
  discriminatorColumn: 'rol',
  discriminatorMap: {
    [RolUsuario.CLIENTE]: 'Cliente',
    [RolUsuario.AGENTE]: 'AgenteInmobiliario',
  },
  abstract: true,
})
export abstract class Usuario extends BaseEntity {
  @Property({ nullable: false })
  nombre!: string

  @Property({ nullable: false })
  apellido!: string

  @Property({ nullable: false })
  tipo_doc!: string

  @Property({ nullable: false, unique: true })
  nro_doc!: number

  @Property({ nullable: false })
  telefono!: string

  @Property({ nullable: false, unique: true })
  mail!: string

  @Property({ nullable: false })
  contrasenia!: string

  @Enum({ items: () => RolUsuario, nullable: false })
  rol!: RolUsuario
}
