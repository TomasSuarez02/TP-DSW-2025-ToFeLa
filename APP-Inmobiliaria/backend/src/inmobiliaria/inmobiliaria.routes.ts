import { Router } from 'express'
import { findAll, findOne, add, update, remove } from './inmobiliaria.controler.js'
import { sanitizeInmobiliariaInput } from '../shared/middlewares/sanitization.middleware.js'
import { validateBody } from '../shared/middlewares/validation.middleware.js'
import {
  inmobiliariaCreateSchema,
  inmobiliariaUpdateSchema,
} from '../shared/validation/schemas.js'

export const inmobiliariaRouter = Router()

inmobiliariaRouter.get('/', findAll)
inmobiliariaRouter.get('/:id', findOne)
inmobiliariaRouter.post('/', sanitizeInmobiliariaInput, validateBody(inmobiliariaCreateSchema), add)
inmobiliariaRouter.put('/:id', sanitizeInmobiliariaInput, validateBody(inmobiliariaUpdateSchema), update)
inmobiliariaRouter.delete('/:id', remove)
inmobiliariaRouter.delete('/', (req, res) => {
  res.status(405).send('Method Not Allowed')
})