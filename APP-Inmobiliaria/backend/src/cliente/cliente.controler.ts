import { NextFunction, Request, Response } from 'express'
import { Cliente } from './cliente.entity.js'
import { orm } from '../shared/db/orm.js'


const em = orm.em

async function findAll(req: Request, res: Response, next: NextFunction) {
  try {
    const clientes = await em.find(
      Cliente,
      {},
      { populate: ['documentaciones'] }
    )
    res.status(200).json({ message: 'found all clientes', data: clientes })
  } catch (error) {
    next(error)
  }
}


async function findOne(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id
    const cliente = await em.findOneOrFail(
      Cliente,
      { id: Number(id) }
      , { populate: ['documentaciones'] }
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
    const id = req.params.id
    const clienteToUpdate = await em.findOneOrFail(Cliente, { id: Number(id) })
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
