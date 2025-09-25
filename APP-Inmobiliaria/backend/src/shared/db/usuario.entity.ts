import { PrimaryKey, Property } from '@mikro-orm/core'

export abstract class Usuario {
  @PrimaryKey()
  id?: number

  @Property({nullable:false})
  nombre!:string

  @Property({nullable:false})
  apellido!:string

  @Property({nullable:false, unique: true})
  email!:string

  @Property({nullable:false})
  telefono!:string

  @Property({nullable: false})
  tipo_documento!:string

  @Property({nullable: false, unique: true})
  nro_doc!:number
  

  /*

  @Property({ type: DateTimeType })
  createdAt? = new Date()

  @Property({
    type: DateTimeType,
    onUpdate: () => new Date(),
  })
  updatedAt? = new Date()

  */
}
