import { Router } from 'express'
import { findAll, findOne, add, update, remove } from './cliente.controler.js'
import { sanitizeClienteInput } from '../shared/middlewares/sanitization.middleware.js'
import { validateBody } from '../shared/middlewares/validation.middleware.js'
import { clienteCreateSchema, clienteUpdateSchema } from '../shared/validation/schemas.js'
import { validateClienteUniqueFields } from '../shared/middlewares/business-rules.middleware.js'

export const clienteRouter = Router()

clienteRouter.get('/', findAll)
clienteRouter.get('/:id', findOne)
clienteRouter.post('/', sanitizeClienteInput, validateBody(clienteCreateSchema), validateClienteUniqueFields, add)
clienteRouter.put('/:id', sanitizeClienteInput, validateBody(clienteUpdateSchema), validateClienteUniqueFields, update)
clienteRouter.patch('/:id', sanitizeClienteInput, validateBody(clienteUpdateSchema), validateClienteUniqueFields, update)
clienteRouter.delete('/:id', remove)
/*clienteRouter.delete('/', (req, res) => {
  res.status(405).send('Method Not Allowed')
}) 
  Ver mas adelante  
*/ 