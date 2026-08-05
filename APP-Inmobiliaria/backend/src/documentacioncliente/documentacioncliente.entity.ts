import { Entity, ManyToOne, Property, Rel } from '@mikro-orm/core'
import { Documentacion } from '../documentacion/documentacion.entity.js'
import { Cliente } from '../cliente/cliente.entity.js'

/** Estado de revisión del documento que presentó el cliente. */
export const ESTADOS_DOCUMENTACION_CLIENTE = ['pendiente', 'aprobada', 'rechazada'] as const
export type EstadoDocumentacionCliente = (typeof ESTADOS_DOCUMENTACION_CLIENTE)[number]

/**
 * Documentación que un cliente presentó, con el resultado de su revisión.
 * En el modelo de datos es la entidad DocumentacionCliente, con PK compuesta
 * (documentacion, cliente). Antes era un M:N sin atributos; ahora guarda el
 * estado porque concretar un alquiler exige tener la documentación aprobada.
 */
@Entity({ tableName: 'documentacion_cliente' })
export class DocumentacionCliente {
  @ManyToOne(() => Documentacion, { primary: true })
  documentacion!: Rel<Documentacion>

  @ManyToOne(() => Cliente, { primary: true })
  cliente!: Rel<Cliente>

  @Property({ nullable: false, default: 'pendiente' })
  estado: EstadoDocumentacionCliente = 'pendiente'

  @Property({ type: 'datetime', nullable: false })
  fecha_carga: Date = new Date()

  /** Motivo del rechazo, para que el cliente sepa qué corregir. */
  @Property({ nullable: true, type: 'text' })
  observaciones?: string | null
}
