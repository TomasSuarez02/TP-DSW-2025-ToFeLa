import { EntityManager } from '@mikro-orm/core'
import {
  EstadoPropiedad,
  type DescripcionEstadoPropiedad,
} from '../../estadopropiedad/estadopropiedad.entity.js'
import {
  EstadoAlquiler,
  type DescripcionEstadoAlquiler,
} from '../../estadoalquiler/estadoalquiler.entity.js'
import { HttpError } from '../errors/http.error.js'

/**
 * EstadoPropiedad y EstadoAlquiler son tablas de referencia: el código trabaja
 * con la descripción ('disponible', 'señada', ...) y acá se resuelve la fila.
 */

async function buscarEstado<T extends EstadoPropiedad | EstadoAlquiler>(
  em: EntityManager,
  entidad: { new (): T },
  descripcion: string,
): Promise<T> {
  const estado = await em.findOne(entidad, { descripcion } as any)
  if (!estado) {
    // Si falta, es que el seed no corrió: es un error de configuración, no del usuario.
    throw new HttpError(
      500,
      `No está cargado el estado '${descripcion}'`,
      [{ path: 'estado', message: `No está cargado el estado '${descripcion}'` }],
      'SERVER_ERROR',
    )
  }
  return estado
}

export function estadoPropiedad(
  em: EntityManager,
  descripcion: DescripcionEstadoPropiedad,
): Promise<EstadoPropiedad> {
  return buscarEstado(em, EstadoPropiedad, descripcion)
}

export function estadoAlquiler(
  em: EntityManager,
  descripcion: DescripcionEstadoAlquiler,
): Promise<EstadoAlquiler> {
  return buscarEstado(em, EstadoAlquiler, descripcion)
}
