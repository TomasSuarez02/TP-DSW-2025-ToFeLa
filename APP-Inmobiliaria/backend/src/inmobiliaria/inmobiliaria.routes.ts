import { Router } from 'express'
import { findAll, findOne, add, update, remove } from './inmobiliaria.controler.js'
import { sanitizeInmobiliariaInput } from '../shared/middlewares/sanitization.middleware.js'

export const inmobiliariaRouter = Router()

inmobiliariaRouter.get('/', findAll)
inmobiliariaRouter.get('/:id', findOne)
inmobiliariaRouter.post('/', sanitizeInmobiliariaInput, add)
inmobiliariaRouter.put('/:id', sanitizeInmobiliariaInput, update)
inmobiliariaRouter.delete('/:id', remove)
inmobiliariaRouter.delete('/', (req, res) => {
  res.status(405).send('Method Not Allowed')
})