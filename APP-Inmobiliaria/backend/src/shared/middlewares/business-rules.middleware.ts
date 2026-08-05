import { NextFunction, Request, Response } from 'express'
import { orm } from '../db/orm.js'
import { Propiedad } from '../../propiedad/propiedad.entity.js'
import { Usuario } from '../db/usuario.entity.js'
import { HttpError } from '../errors/http.error.js'

function parseTimeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

export async function validateSeniaAmountAgainstProperty(
  req: Request,
  _res: Response,
  next: NextFunction,
) {
  try {
    const input = req.body?.sanitizedInput
    const propiedadId = Number(input?.propiedad)
    const importe = Number(input?.importe)

    if (!Number.isFinite(propiedadId) || !Number.isFinite(importe)) {
      return next()
    }

    const propiedad = await orm.em.findOne(Propiedad, { id: propiedadId })
    if (!propiedad) {
      return next(
        new HttpError(
          400,
          'La propiedad indicada no existe',
          [{ path: 'propiedad', message: 'La propiedad indicada no existe' }],
          'BUSINESS_RULE_ERROR',
        ),
      )
    }

    if (importe > propiedad.precio) {
      return next(
        new HttpError(
          400,
          'El importe de la seña no puede superar el precio de la propiedad',
          [
            {
              path: 'importe',
              message: 'El importe de la seña no puede superar el precio de la propiedad',
            },
          ],
          'BUSINESS_RULE_ERROR',
        ),
      )
    }

    next()
  } catch (error) {
    next(error)
  }
}

export function validateVisitaFutureDate(
  req: Request,
  _res: Response,
  next: NextFunction,
) {
  const input = req.body?.sanitizedInput
  const fechaHora = input?.fecha_hora

  if (!fechaHora) {
    return next()
  }

  const date = fechaHora instanceof Date ? fechaHora : new Date(String(fechaHora))
  if (Number.isNaN(date.getTime())) {
    return next(
      new HttpError(
        400,
        'La fecha y hora son inválidas',
        [{ path: 'fecha_hora', message: 'La fecha y hora son inválidas' }],
        'BUSINESS_RULE_ERROR',
      ),
    )
  }

  if (date <= new Date()) {
    return next(
      new HttpError(
        400,
        'La visita debe programarse en una fecha futura',
        [{ path: 'fecha_hora', message: 'La visita debe programarse en una fecha futura' }],
        'BUSINESS_RULE_ERROR',
      ),
    )
  }

  next()
}

export async function validatePropiedadTimeRange(
  req: Request,
  _res: Response,
  next: NextFunction,
) {
  try {
    const input = req.body?.sanitizedInput
    let horaDesde = input?.hora_desde as string | undefined
    let horaHasta = input?.hora_hasta as string | undefined

    if ((!horaDesde || !horaHasta) && req.params.id) {
      const propiedad = await orm.em.findOne(Propiedad, { id: Number(req.params.id) })
      if (!propiedad) {
        return next(
          new HttpError(
            404,
            'Propiedad no encontrada',
            [{ path: 'propiedad', message: 'Propiedad no encontrada' }],
            'BUSINESS_RULE_ERROR',
          ),
        )
      }

      horaDesde = horaDesde ?? propiedad.hora_desde
      horaHasta = horaHasta ?? propiedad.hora_hasta
    }

    if (!horaDesde || !horaHasta) {
      return next()
    }

    if (parseTimeToMinutes(String(horaDesde)) >= parseTimeToMinutes(String(horaHasta))) {
      return next(
        new HttpError(
          400,
          'La hora de inicio debe ser menor a la hora de fin',
          [{ path: 'hora_desde', message: 'La hora de inicio debe ser menor a la hora de fin' }],
          'BUSINESS_RULE_ERROR',
        ),
      )
    }

    next()
  } catch (error) {
    next(error)
  }
}

/**
 * Rechaza un mail o un número de documento que ya esté tomado, con un mensaje
 * legible. Sin esto lo frena la constraint de MySQL, pero con un texto genérico.
 *
 * Consulta `Usuario`, no `Cliente` ni `AgenteInmobiliario`: los dos comparten la
 * tabla `usuario`, así que la unicidad es entre ambos. Mirando un solo rol, un
 * agente podía usar el mail de un cliente, pasar por acá y romper recién contra
 * la base. Por eso el mensaje habla de "una cuenta" y no del rol: el conflicto
 * puede ser con el otro tipo de usuario.
 */
export async function validateUsuarioUniqueFields(
  req: Request,
  _res: Response,
  next: NextFunction,
) {
  try {
    const input = req.body?.sanitizedInput
    const email = typeof input?.mail === 'string' ? input.mail : undefined
    const nroDoc =
      input?.nro_doc !== undefined && input?.nro_doc !== null
        ? Number(input.nro_doc)
        : undefined
    const currentId = req.params.id ? Number(req.params.id) : undefined

    const enConflicto = async (filtro: Record<string, unknown>) => {
      const existente = await orm.em.findOne(Usuario, filtro)
      return existente !== null && existente.id !== currentId
    }

    if (email && (await enConflicto({ mail: email }))) {
      const mensaje = 'Ya existe una cuenta con ese email'
      return next(
        new HttpError(409, mensaje, [{ path: 'mail', message: mensaje }], 'BUSINESS_RULE_ERROR'),
      )
    }

    if (nroDoc !== undefined && Number.isFinite(nroDoc) && (await enConflicto({ nro_doc: nroDoc }))) {
      const mensaje = 'Ya existe una cuenta con ese número de documento'
      return next(
        new HttpError(409, mensaje, [{ path: 'nro_doc', message: mensaje }], 'BUSINESS_RULE_ERROR'),
      )
    }

    next()
  } catch (error) {
    next(error)
  }
}
