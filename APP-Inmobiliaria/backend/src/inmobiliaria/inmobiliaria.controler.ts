import { NextFunction, Request, Response } from 'express'
import { Inmobiliaria } from './inmobiliaria.entity.js'
import { orm } from '../shared/db/orm.js'

const em = orm.em

async function findAll(req: Request, res: Response, next: NextFunction) {
  try {
    const inmobiliarias = await em.find(Inmobiliaria, {}, {populate: ['propiedades', 'agentes']})
    res.status(200).json({ message: 'found all inmobiliarias', data: inmobiliarias })
  } catch (error) {
    next(error)
  }
}

async function findOne(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id
    const inmobiliaria = await em.findOneOrFail(Inmobiliaria, { id: Number(id) }, {populate: ['propiedades', 'agentes']})
    res.status(200).json({ message: 'found inmobiliaria', data: inmobiliaria })
  } catch (error) {
    next(error)
  }
}

async function add(req: Request, res: Response, next: NextFunction) {
  try {
    const cliente = em.create(Inmobiliaria, req.body.sanitizedInput)
    await em.flush()
    res.status(201).json({ message: 'inmobiliaria created', data: cliente })
  } catch (error) {
    next(error)
  }
}

async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id
    const inmobiliariaToUpdate = await em.findOneOrFail(Inmobiliaria, { id: Number(id) })
    em.assign(inmobiliariaToUpdate, req.body.sanitizedInput)
    await em.flush()
    res.status(200).json({ message: 'inmobiliaria updated', data: inmobiliariaToUpdate })
  } catch (error) {
    next(error)
  }
}

async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id
    const inmobiliaria = await em.findOneOrFail(Inmobiliaria, { id: Number(id) })
    await em.removeAndFlush(inmobiliaria)
    res.status(200).json({ message: 'inmobiliaria deleted' })
  } catch (error) {
    next(error)
  }
}

export { findAll, findOne, add, update, remove }
