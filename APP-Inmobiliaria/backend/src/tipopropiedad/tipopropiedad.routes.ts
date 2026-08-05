import { Router } from 'express'
import { findAll, findOne, add, update, remove } from './tipopropiedad.controler.js'
import { sanitizeTipoPropiedadInput } from '../shared/middlewares/sanitization.middleware.js'
import { validateBody } from '../shared/middlewares/validation.middleware.js'
import {
  tipoPropiedadCreateSchema,
  tipoPropiedadUpdateSchema,
} from '../shared/validation/schemas.js'
import { soloAgente } from '../shared/middlewares/auth.middleware.js'

export const tipopropiedadRouter = Router()

// Nomenclador público: alimenta los filtros del catálogo.
tipopropiedadRouter.get('/', findAll)
tipopropiedadRouter.get('/:id', findOne)

tipopropiedadRouter.post('/', soloAgente, sanitizeTipoPropiedadInput, validateBody(tipoPropiedadCreateSchema), add)
tipopropiedadRouter.put('/:id', soloAgente, sanitizeTipoPropiedadInput, validateBody(tipoPropiedadUpdateSchema), update)
tipopropiedadRouter.delete('/:id', soloAgente, remove)
/*tipopropiedadRouter.delete('/', (req, res) => {
  res.status(405).send('Method Not Allowed')
})*/