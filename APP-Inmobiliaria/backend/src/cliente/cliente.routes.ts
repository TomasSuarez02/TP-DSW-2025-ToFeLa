import { Router } from 'express'
import { findAll, findOne, add, update, remove } from './cliente.controler.js'
import { sanitizeClienteInput } from '../shared/middlewares/sanitization.middleware.js'
import { validateBody } from '../shared/middlewares/validation.middleware.js'
import { clienteCreateSchema, clienteUpdateSchema } from '../shared/validation/schemas.js'
import { validateUsuarioUniqueFields } from '../shared/middlewares/business-rules.middleware.js'
import { authenticateToken, soloAgente } from '../shared/middlewares/auth.middleware.js'

export const clienteRouter = Router()

// El padrón de clientes es del backoffice: nombre, mail, teléfono y documento.
clienteRouter.get('/', soloAgente, findAll)

// El alta es el registro público del sitio.
clienteRouter.post('/', sanitizeClienteInput, validateBody(clienteCreateSchema), validateUsuarioUniqueFields, add)

// La ficha individual la lee el agente y el propio cliente (ver `findOne`).
clienteRouter.get('/:id', authenticateToken, findOne)
clienteRouter.put('/:id', authenticateToken, sanitizeClienteInput, validateBody(clienteUpdateSchema), validateUsuarioUniqueFields, update)
clienteRouter.patch('/:id', authenticateToken, sanitizeClienteInput, validateBody(clienteUpdateSchema), validateUsuarioUniqueFields, update)
clienteRouter.delete('/:id', soloAgente, remove)
/*clienteRouter.delete('/', (req, res) => {
  res.status(405).send('Method Not Allowed')
}) 
  Ver mas adelante  
*/ 