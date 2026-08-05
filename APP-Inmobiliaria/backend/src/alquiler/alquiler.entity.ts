import { Entity, ManyToOne, OneToOne, Opt, PrimaryKey, Property, Rel } from '@mikro-orm/core'
import { Propiedad } from '../propiedad/propiedad.entity.js'
import { Cliente } from '../cliente/cliente.entity.js'
import { EstadoAlquiler } from '../estadoalquiler/estadoalquiler.entity.js'
import { Senia } from '../senia/senia.entity.js'
import { Pago } from '../pago/pago.entity.js'
import { serializarClave } from '../shared/db/clave-compuesta.js'

/** PK compuesta (propiedad, cliente, fecha_hora_firma), como en el modelo de datos. */
@Entity()
export class Alquiler {
  @ManyToOne(() => Propiedad, { primary: true })
  propiedad!: Rel<Propiedad>

  @ManyToOne(() => Cliente, { primary: true })
  cliente!: Rel<Cliente>

  // datetime(3): ver la nota en senia.entity.ts
  @PrimaryKey({ type: 'datetime', columnType: 'datetime(3)' })
  fecha_hora_firma: Date = new Date()

  @Property({ type: 'date', nullable: false })
  fecha_inicio!: Date

  @Property({ type: 'date', nullable: false })
  fecha_fin!: Date

  @Property({ columnType: 'decimal(12,2)', nullable: false })
  monto_mensual!: number

  @ManyToOne(() => EstadoAlquiler, { nullable: false })
  estadoAlquiler!: Rel<EstadoAlquiler>

  /**
   * Seña que originó este alquiler. Nulable porque un agente puede cargar un
   * alquiler a mano, sin que haya habido seña previa. Es el lado dueño de la
   * 1:1 para que desde la seña se pueda saber si ya se concretó.
   */
  @OneToOne(() => Senia, (senia) => senia.alquiler, { nullable: true, owner: true })
  senia?: Rel<Senia> | null

  /**
   * Cobro del saldo del primer mes (monto_mensual menos lo ya señado), que el
   * cliente entrega presencialmente al firmar.
   */
  @OneToOne(() => Pago, { nullable: true, owner: true, orphanRemoval: true })
  pagoSaldo?: Rel<Pago> | null

  /** Clave compuesta codificada para las rutas REST. Derivada: no se persiste. */
  @Property({ persist: false })
  get clave(): Opt<string> {
    return serializarClave(this.propiedad.id!, this.cliente.id!, this.fecha_hora_firma)
  }

  /**
   * La API sigue exponiendo el estado como texto ('pendiente', 'confirmado', ...)
   * aunque en la base sea una FK. Derivado: no se persiste.
   */
  @Property({ persist: false })
  get estado(): Opt<string | undefined> {
    return this.estadoAlquiler?.descripcion
  }
}
