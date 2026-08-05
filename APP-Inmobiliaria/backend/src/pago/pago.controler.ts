import { NextFunction, Request, Response } from 'express'
import { orm } from '../shared/db/orm.js'
import { Pago, type EstadoPago } from './pago.entity.js'
import { Senia } from '../senia/senia.entity.js'
import { calcularFechaVencimiento, senarPropiedad } from '../senia/senia.rules.js'
import { HttpError } from '../shared/errors/http.error.js'
import { parsearClave } from '../shared/db/clave-compuesta.js'
import {
  esLuhnValido,
  generarReferencia,
  soloDigitos,
  tarjetaEsAprobada,
  ultimosCuatro,
} from '../shared/utils/tarjeta.js'

const em = orm.em

type AuthRequest = Request & { user?: { sub?: number; role?: string } }

function serializarPago(pago: Pago) {
  return {
    id: pago.id,
    estado: pago.estado,
    medio: pago.medio,
    monto: pago.monto,
    ultimosCuatro: pago.ultimosCuatro,
    fecha: pago.fecha,
    referencia: pago.referencia,
  }
}

/**
 * Procesa el pago de una seña contra la pasarela simulada.
 * Si se aprueba: la seña pasa a `confirmada`, se fija el vencimiento de la
 * reserva y la propiedad queda `reservada`.
 */
async function procesar(req: Request, res: Response, next: NextFunction) {
  try {
    const { sub: clienteId, role } = (req as AuthRequest).user ?? {}
    if (!clienteId || role !== 'cliente') {
      throw new HttpError(
        403,
        'Solo un cliente puede pagar una seña',
        [{ path: 'general', message: 'Solo un cliente puede pagar una seña' }],
        'AUTH_ERROR',
      )
    }

    const { senia: claveSenia, numeroTarjeta, titular } = req.body.sanitizedInput

    const parsed = parsearClave(claveSenia)
    if (!parsed) {
      throw new HttpError(
        400,
        'La clave de la seña es inválida',
        [{ path: 'senia', message: 'La clave de la seña es inválida' }],
        'VALIDATION_ERROR',
      )
    }

    const senia = await em.findOneOrFail(
      Senia,
      {
        propiedad: parsed.propiedad,
        cliente: parsed.cliente,
        fecha_hora_senia: parsed.fecha,
      },
      { populate: ['propiedad', 'propiedad.estadoPropiedad', 'cliente', 'pago'] },
    )

    if (senia.cliente.id !== clienteId) {
      throw new HttpError(
        403,
        'La seña pertenece a otro cliente',
        [{ path: 'general', message: 'La seña pertenece a otro cliente' }],
        'AUTH_ERROR',
      )
    }

    if (senia.estado === 'confirmada') {
      throw new HttpError(
        409,
        'La seña ya fue pagada',
        [{ path: 'senia', message: 'La seña ya fue pagada' }],
        'BUSINESS_RULE_ERROR',
      )
    }

    if (senia.estado !== 'pendiente_pago') {
      throw new HttpError(
        409,
        `No se puede pagar una seña ${senia.estado}`,
        [{ path: 'senia', message: `No se puede pagar una seña ${senia.estado}` }],
        'BUSINESS_RULE_ERROR',
      )
    }

    const numero = soloDigitos(numeroTarjeta)
    if (numero.length !== 16 || !esLuhnValido(numero)) {
      throw new HttpError(
        400,
        'El número de tarjeta no es válido',
        [{ path: 'numeroTarjeta', message: 'El número de tarjeta no es válido' }],
        'VALIDATION_ERROR',
      )
    }

    // Entre que se creó la seña y el pago, otro cliente pudo señar la propiedad.
    if (senia.propiedad.estado !== 'disponible') {
      throw new HttpError(
        409,
        'La propiedad ya no está disponible',
        [{ path: 'propiedad', message: 'La propiedad ya no está disponible' }],
        'BUSINESS_RULE_ERROR',
      )
    }

    const aprobado = tarjetaEsAprobada(numero)
    const datosPago = {
      estado: (aprobado ? 'aprobado' : 'rechazado') as EstadoPago,
      medio: 'tarjeta' as const,
      monto: senia.importe,
      ultimosCuatro: ultimosCuatro(numero),
      titular: String(titular).trim(),
      fecha: new Date(),
      referencia: generarReferencia(),
    }

    // Si el cliente reintenta tras un rechazo se reescribe el intento anterior.
    const pago = senia.pago ? em.assign(senia.pago, datosPago) : em.create(Pago, datosPago)
    senia.pago = pago

    if (!aprobado) {
      await em.flush()
      return res.status(402).json({
        message: 'El pago fue rechazado por la entidad emisora',
        data: serializarPago(pago),
      })
    }

    senia.estado = 'confirmada'
    senia.fechaVencimiento = calcularFechaVencimiento()
    await senarPropiedad(em, senia.propiedad)
    await em.flush()

    res.status(201).json({
      message: 'pago aprobado',
      data: {
        ...serializarPago(pago),
        senia: {
          clave: senia.clave,
          estado: senia.estado,
          fechaVencimiento: senia.fechaVencimiento,
        },
      },
    })
  } catch (error) {
    next(error)
  }
}

export { procesar }
