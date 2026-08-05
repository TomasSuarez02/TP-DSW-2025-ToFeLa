import { NextFunction, Request, Response } from 'express'
import { Cliente } from './cliente.entity.js'
import { orm } from '../shared/db/orm.js'
import { HttpError } from '../shared/errors/http.error.js'


const em = orm.em

type AuthRequest = Request & { user?: { sub?: number; role?: string } }

/**
 * Corta si el que pide no es el agente ni el propio dueño de la ficha.
 * Sin esto, cualquier cliente logueado podría leer o editar los datos
 * personales de otro cambiando el id de la URL.
 */
function exigirAgenteODuenio(req: Request, clienteId: number) {
  const { sub, role } = (req as AuthRequest).user ?? {}
  if (role === 'agente' || sub === clienteId) return

  throw new HttpError(
    403,
    'No podés acceder a los datos de otro cliente',
    [{ path: 'general', message: 'No podés acceder a los datos de otro cliente' }],
    'AUTH_ERROR',
  )
}

async function findAll(req: Request, res: Response, next: NextFunction) {
  try {
    const clientes = await em.find(
      Cliente,
      {},
      { populate: ['documentaciones', 'documentaciones.documentacion'] }
    )
    res.status(200).json({ message: 'found all clientes', data: clientes })
  } catch (error) {
    next(error)
  }
}


async function findOne(req: Request, res: Response, next: NextFunction) {
  try {
    const id = Number(req.params.id)
    exigirAgenteODuenio(req, id)

    const cliente = await em.findOneOrFail(
      Cliente,
      { id }
      , { populate: ['documentaciones', 'documentaciones.documentacion'] }
    )
    res.status(200).json({ message: 'found cliente', data: cliente })
  } catch (error) {
    next(error)
  }
}


async function add(req: Request, res: Response, next: NextFunction) {
  try {
    const cliente = em.create(Cliente, req.body.sanitizedInput)
    await em.flush()
    res.status(201).json({ message: 'cliente created', data: cliente })
  } catch (error) {
    next(error)
  }
}



async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const id = Number(req.params.id)
    exigirAgenteODuenio(req, id)

    const clienteToUpdate = await em.findOneOrFail(Cliente, { id })
    em.assign(clienteToUpdate, req.body.sanitizedInput)
    await em.flush()
    res
      .status(200)
      .json({ message: 'cliente updated', data: clienteToUpdate })
  } catch (error) {
    next(error)
  }
}


async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id
    const cliente = em.getReference(Cliente, Number(id))
    await em.removeAndFlush(cliente)
    res.status(200).json({ message: 'cliente deleted' })
  } catch (error) {
    next(error)
  }
}

export { findAll, findOne, add, update, remove }
