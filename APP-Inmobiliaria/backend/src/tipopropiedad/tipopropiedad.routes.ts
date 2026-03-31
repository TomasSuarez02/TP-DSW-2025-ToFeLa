import { Router } from 'express'
import { findAll, findOne, add, update, remove } from './tipopropiedad.controler.js'
import { sanitizeTipoPropiedadInput } from '../shared/middlewares/sanitization.middleware.js'
import { validateBody } from '../shared/middlewares/validation.middleware.js'
import {
  tipoPropiedadCreateSchema,
  tipoPropiedadUpdateSchema,
} from '../shared/validation/schemas.js'

export const tipopropiedadRouter = Router()

tipopropiedadRouter.get('/', findAll)
tipopropiedadRouter.get('/:id', findOne)
tipopropiedadRouter.post('/', sanitizeTipoPropiedadInput, validateBody(tipoPropiedadCreateSchema), add)
tipopropiedadRouter.put('/:id', sanitizeTipoPropiedadInput, validateBody(tipoPropiedadUpdateSchema), update)
tipopropiedadRouter.delete('/:id', remove)
/*tipopropiedadRouter.delete('/', (req, res) => {
  res.status(405).send('Method Not Allowed')
})*/