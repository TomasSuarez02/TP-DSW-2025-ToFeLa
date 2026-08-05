import { Router } from 'express'
import { findAll, findOne, add, update, remove } from './inmobiliaria.controler.js'
import { sanitizeInmobiliariaInput } from '../shared/middlewares/sanitization.middleware.js'
import { validateBody } from '../shared/middlewares/validation.middleware.js'
import {
  inmobiliariaCreateSchema,
  inmobiliariaUpdateSchema,
} from '../shared/validation/schemas.js'
import { soloAgente } from '../shared/middlewares/auth.middleware.js'

export const inmobiliariaRouter = Router()

// Datos de contacto de la sucursal: se muestran en el sitio.
inmobiliariaRouter.get('/', findAll)
inmobiliariaRouter.get('/:id', findOne)

inmobiliariaRouter.post('/', soloAgente, sanitizeInmobiliariaInput, validateBody(inmobiliariaCreateSchema), add)
inmobiliariaRouter.put('/:id', soloAgente, sanitizeInmobiliariaInput, validateBody(inmobiliariaUpdateSchema), update)
inmobiliariaRouter.delete('/:id', soloAgente, remove)
inmobiliariaRouter.delete('/', (req, res) => {
  res.status(405).send('Method Not Allowed')
})