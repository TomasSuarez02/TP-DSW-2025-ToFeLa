import { MikroORM } from '@mikro-orm/core'
import {
  EstadoPropiedad,
  ESTADOS_PROPIEDAD,
} from '../../estadopropiedad/estadopropiedad.entity.js'
import {
  EstadoAlquiler,
  ESTADOS_ALQUILER,
} from '../../estadoalquiler/estadoalquiler.entity.js'

/**
 * Carga los datos de referencia de EstadoPropiedad y EstadoAlquiler.
 * Es idempotente: solo inserta las descripciones que falten, así que se puede
 * ejecutar en cada arranque sin duplicar filas.
 */
export async function seedEstados(orm: MikroORM): Promise<void> {
  const em = orm.em.fork()

  const propiedadExistentes = await em.find(EstadoPropiedad, {})
  const faltantesPropiedad = ESTADOS_PROPIEDAD.filter(
    (descripcion) => !propiedadExistentes.some((e) => e.descripcion === descripcion),
  )
  for (const descripcion of faltantesPropiedad) {
    em.create(EstadoPropiedad, { descripcion })
  }

  const alquilerExistentes = await em.find(EstadoAlquiler, {})
  const faltantesAlquiler = ESTADOS_ALQUILER.filter(
    (descripcion) => !alquilerExistentes.some((e) => e.descripcion === descripcion),
  )
  for (const descripcion of faltantesAlquiler) {
    em.create(EstadoAlquiler, { descripcion })
  }

  if (faltantesPropiedad.length > 0 || faltantesAlquiler.length > 0) {
    await em.flush()
    console.log(
      `[seed] estados cargados: ${faltantesPropiedad.length} de propiedad, ${faltantesAlquiler.length} de alquiler`,
    )
  }
}
