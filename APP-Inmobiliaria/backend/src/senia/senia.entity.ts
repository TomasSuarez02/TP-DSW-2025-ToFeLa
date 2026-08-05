import { Entity, ManyToOne, OneToOne, Opt, PrimaryKey, Property, Rel } from "@mikro-orm/core";
import { Propiedad } from "../propiedad/propiedad.entity.js";
import { Cliente } from "../cliente/cliente.entity.js";
import { Pago } from "../pago/pago.entity.js";
import { Alquiler } from "../alquiler/alquiler.entity.js";
import { serializarClave } from "../shared/db/clave-compuesta.js";
import type { EstadoSenia } from "./senia.rules.js";

/**
 * PK compuesta (propiedad, cliente, fecha_hora_senia), como en el modelo de datos.
 * `importe`, `estado` y `pago` no están en el diagrama pero los exige el flujo de
 * pago de la seña (ver docs/api-senias.md).
 */
@Entity()
export class Senia {
    @ManyToOne(() => Propiedad, { primary: true })
    propiedad!: Rel<Propiedad>;

    @ManyToOne(() => Cliente, { primary: true })
    cliente!: Rel<Cliente>;

    // datetime(3): la clave compuesta viaja en la URL con precisión de
    // milisegundos, así que la columna tiene que guardarlos para que matchee.
    @PrimaryKey({ type: 'datetime', columnType: 'datetime(3)' })
    fecha_hora_senia: Date = new Date();

    @Property({ columnType: 'decimal(12,2)', nullable: false })
    importe!: number;

    /** Ver ESTADOS_SENIA en senia.rules.ts */
    @Property({ nullable: false, default: 'pendiente_pago' })
    estado: EstadoSenia = 'pendiente_pago';

    /**
     * Fin de la reserva. Se completa recién cuando el pago se aprueba, porque
     * el plazo corre desde ahí y no desde que se crea la seña.
     */
    @Property({ type: 'datetime', nullable: true })
    fechaVencimiento?: Date | null;

    /** Último intento de pago. Se reescribe si el cliente reintenta tras un rechazo. */
    @OneToOne(() => Pago, { nullable: true, owner: true, orphanRemoval: true })
    pago?: Rel<Pago> | null;

    /**
     * Alquiler que salió de esta seña, si ya se concretó. Lado inverso: la FK
     * vive en Alquiler. Hay que popularlo para que llegue serializado.
     */
    @OneToOne(() => Alquiler, (alquiler) => alquiler.senia, { nullable: true })
    alquiler?: Rel<Alquiler> | null;

    /**
     * La seña queda `confirmada` aun después de concretarse, así que el estado
     * no alcanza para saber si todavía hay algo que hacer con ella.
     */
    @Property({ persist: false })
    get concretada(): Opt<boolean> {
      return !!this.alquiler;
    }

    /** Clave compuesta codificada para las rutas REST. Derivada: no se persiste. */
    @Property({ persist: false })
    get clave(): Opt<string> {
      return serializarClave(this.propiedad.id!, this.cliente.id!, this.fecha_hora_senia);
    }
}
