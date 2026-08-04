import { Entity, ManyToOne, Opt, PrimaryKey, Property, Rel } from "@mikro-orm/core";
import { Propiedad } from "../propiedad/propiedad.entity.js";
import { Cliente } from "../cliente/cliente.entity.js";
import { serializarClave } from "../shared/db/clave-compuesta.js";

/** PK compuesta (propiedad, cliente, fecha_hora), como en el modelo de datos. */
@Entity()
export class Visita {
    @ManyToOne(() => Propiedad, { primary: true })
    propiedad!: Rel<Propiedad>;

    @ManyToOne(() => Cliente, { primary: true })
    cliente!: Rel<Cliente>;

    // datetime(3): ver la nota en senia.entity.ts
    @PrimaryKey({ type: 'datetime', columnType: 'datetime(3)' })
    fecha_hora!: Date;

    /** Clave compuesta codificada para las rutas REST. Derivada: no se persiste. */
    @Property({ persist: false })
    get clave(): Opt<string> {
      return serializarClave(this.propiedad.id!, this.cliente.id!, this.fecha_hora);
    }
}
