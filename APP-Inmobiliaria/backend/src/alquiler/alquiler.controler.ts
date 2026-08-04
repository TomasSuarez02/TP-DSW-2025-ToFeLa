import { NextFunction, Request, Response } from 'express'
import { orm } from '../shared/db/orm.js'
import { Alquiler } from './alquiler.entity.js'
import { Propiedad } from '../propiedad/propiedad.entity.js'
import { Cliente } from '../cliente/cliente.entity.js'
import { HttpError } from '../shared/errors/http.error.js'
import { parsearClave } from '../shared/db/clave-compuesta.js'
import { estadoAlquiler, estadoPropiedad } from '../shared/db/estados.js'
import type { DescripcionEstadoAlquiler } from '../estadoalquiler/estadoalquiler.entity.js'

const em = orm.em

const POPULATE_ALQUILER = [
  'propiedad',
  'propiedad.estadoPropiedad',
  'cliente',
  'estadoAlquiler',
] as const satisfies readonly string[]

type AuthRequest = Request & { user?: { sub?: number; role?: string } }

function usuarioAutenticado(req: Request) {
  return (req as AuthRequest).user ?? {}
}

async function buscarPorClave(clave: string) {
  const parsed = parsearClave(clave)
  if (!parsed) {
    throw new HttpError(
      400,
      'La clave del alquiler es inválida',
      [{ path: 'clave', message: 'La clave del alquiler es inválida' }],
      'VALIDATION_ERROR',
    )
  }

  return em.findOneOrFail(
    Alquiler,
    {
      propiedad: parsed.propiedad,
      cliente: parsed.cliente,
      fecha_hora_firma: parsed.fecha,
    },
    { populate: [...POPULATE_ALQUILER] },
  )
}

/** Un alquiler confirmado ocupa la propiedad; cancelado o finalizado la libera. */
async function sincronizarPropiedad(alquiler: Alquiler, estado: DescripcionEstadoAlquiler) {
  if (estado === 'confirmado') {
    alquiler.propiedad.estadoPropiedad = await estadoPropiedad(em, 'alquilada')
  } else if (estado === 'cancelado' || estado === 'finalizado') {
    if (alquiler.propiedad.estado === 'alquilada') {
      alquiler.propiedad.estadoPropiedad = await estadoPropiedad(em, 'disponible')
    }
  }
}

async function findAll(_req: Request, res: Response, next: NextFunction) {
  try {
    const alquileres = await em.find(Alquiler, {}, { populate: [...POPULATE_ALQUILER] })
    res.status(200).json({ message: 'found all alquileres', data: alquileres })
  } catch (error) {
    next(error)
  }
}

async function findByClient(req: Request, res: Response, next: NextFunction) {
  try {
    const { sub: clientId } = usuarioAutenticado(req)
    if (!clientId) {
      return res.status(401).json({ message: 'No autorizado', data: [] })
    }

    const alquileres = await em.find(
      Alquiler,
      { cliente: clientId },
      { populate: [...POPULATE_ALQUILER] },
    )
    res.status(200).json({ message: 'found client alquileres', data: alquileres })
  } catch (error) {
    next(error)
  }
}

async function findOne(req: Request, res: Response, next: NextFunction) {
  try {
    const alquiler = await buscarPorClave(req.params.clave)

    const { sub: usuarioId, role } = usuarioAutenticado(req)
    if (role === 'cliente' && alquiler.cliente.id !== usuarioId) {
      throw new HttpError(
        403,
        'El alquiler pertenece a otro cliente',
        [{ path: 'general', message: 'El alquiler pertenece a otro cliente' }],
        'AUTH_ERROR',
      )
    }

    res.status(200).json({ message: 'found alquiler', data: alquiler })
  } catch (error) {
    next(error)
  }
}

async function add(req: Request, res: Response, next: NextFunction) {
  try {
    const { role } = usuarioAutenticado(req)
    if (role !== 'agente') {
      throw new HttpError(
        403,
        'Solo un agente puede registrar un alquiler',
        [{ path: 'general', message: 'Solo un agente puede registrar un alquiler' }],
        'AUTH_ERROR',
      )
    }

    const input = req.body.sanitizedInput
    const propiedadEntity = await em.findOneOrFail(
      Propiedad,
      { id: Number(input.propiedad) },
      { populate: ['estadoPropiedad'] },
    )
    const clienteEntity = await em.findOneOrFail(Cliente, { id: Number(input.cliente) })

    if (propiedadEntity.estado === 'alquilada') {
      throw new HttpError(
        409,
        'La propiedad ya está alquilada',
        [{ path: 'propiedad', message: 'La propiedad ya está alquilada' }],
        'BUSINESS_RULE_ERROR',
      )
    }

    if (new Date(input.fecha_fin) <= new Date(input.fecha_inicio)) {
      throw new HttpError(
        400,
        'La fecha de fin debe ser posterior a la de inicio',
        [{ path: 'fecha_fin', message: 'La fecha de fin debe ser posterior a la de inicio' }],
        'BUSINESS_RULE_ERROR',
      )
    }

    const descripcionEstado = (input.estado ?? 'pendiente') as DescripcionEstadoAlquiler

    const alquiler = em.create(Alquiler, {
      propiedad: propiedadEntity,
      cliente: clienteEntity,
      fecha_hora_firma: new Date(),
      fecha_inicio: new Date(input.fecha_inicio),
      fecha_fin: new Date(input.fecha_fin),
      monto_mensual: Number(input.monto_mensual),
      estadoAlquiler: await estadoAlquiler(em, descripcionEstado),
    })

    await sincronizarPropiedad(alquiler, descripcionEstado)
    await em.flush()
    await em.populate(alquiler, [...POPULATE_ALQUILER])

    res.status(201).json({ message: 'alquiler created', data: alquiler })
  } catch (error) {
    next(error)
  }
}

async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const alquiler = await buscarPorClave(req.params.clave)
    // La PK es inmutable: propiedad, cliente y fecha de firma no se actualizan.
    const { propiedad: _p, cliente: _c, estado, ...cambios } = req.body.sanitizedInput

    em.assign(alquiler, cambios)

    if (estado) {
      alquiler.estadoAlquiler = await estadoAlquiler(em, estado as DescripcionEstadoAlquiler)
      await sincronizarPropiedad(alquiler, estado as DescripcionEstadoAlquiler)
    }

    await em.flush()
    res.status(200).json({ message: 'alquiler updated', data: alquiler })
  } catch (error) {
    next(error)
  }
}

async function changeEstado(req: Request, res: Response, next: NextFunction) {
  try {
    const { role } = usuarioAutenticado(req)
    if (role !== 'agente') {
      throw new HttpError(
        403,
        'Solo un agente puede cambiar el estado de un alquiler',
        [{ path: 'general', message: 'Solo un agente puede cambiar el estado de un alquiler' }],
        'AUTH_ERROR',
      )
    }

    const estado = req.body.sanitizedInput.estado as DescripcionEstadoAlquiler
    const alquiler = await buscarPorClave(req.params.clave)

    alquiler.estadoAlquiler = await estadoAlquiler(em, estado)
    await sincronizarPropiedad(alquiler, estado)
    await em.flush()

    res.status(200).json({ message: 'alquiler updated', data: alquiler })
  } catch (error) {
    next(error)
  }
}

async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    const alquiler = await buscarPorClave(req.params.clave)

    if (alquiler.propiedad.estado === 'alquilada') {
      alquiler.propiedad.estadoPropiedad = await estadoPropiedad(em, 'disponible')
    }

    await em.removeAndFlush(alquiler)
    res.status(200).json({ message: 'alquiler deleted', data: alquiler })
  } catch (error) {
    next(error)
  }
}

export { findAll, findOne, findByClient, add, update, changeEstado, remove }
