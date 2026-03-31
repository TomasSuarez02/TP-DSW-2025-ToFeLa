import { NextFunction, Request, Response } from 'express'
import { NotFoundError, UniqueConstraintViolationException } from '@mikro-orm/core'
import { HttpError } from '../errors/http.error.js'

/**
 * Middleware que captura excepciones de MikroORM y las estandariza
 * NotFoundError -> 404 NOT_FOUND
 * UniqueConstraintViolationException -> 409 CONFLICT (si no fue capturada antes)
 */
export function ormErrorHandler(
  error: unknown,
  _req: Request,
  _res: Response,
  next: NextFunction,
) {
  // NotFoundError: cuando findOneOrFail no encuentra el recurso
  if (error instanceof NotFoundError) {
    return next(
      new HttpError(
        404,
        'Recurso no encontrado',
        undefined,
        'NOT_FOUND',
      ),
    )
  }

  // UniqueConstraintViolationException: violación de constraint único en BD
  if (error instanceof UniqueConstraintViolationException) {
    // Extraer el campo que viola el constraint
    const message = error.message || ''
    const fieldMatch = message.match(/unique_(\w+)/) || message.match(/on table `\w+` \((\w+)\)/)
    const field = fieldMatch?.[1] || 'unknown_field'

    return next(
      new HttpError(
        409,
        `El valor para ${field} ya existe en el sistema`,
        [
          {
            path: field,
            message: `El valor para ${field} ya existe en el sistema`,
          },
        ],
        'CONFLICT',
      ),
    )
  }

  // Propagar el error si no es de ORM
  next(error)
}
