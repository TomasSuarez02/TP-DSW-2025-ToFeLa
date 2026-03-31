import { Router } from 'express'
import { findAll, findOne, add, update, remove } from './cliente.controler.js'
import { sanitizeClienteInput } from '../shared/middlewares/sanitization.middleware.js'

export const clienteRouter = Router()

clienteRouter.get('/', findAll)
clienteRouter.get('/:id', findOne)
clienteRouter.post('/', sanitizeClienteInput, add)
clienteRouter.put('/:id', sanitizeClienteInput, update)
clienteRouter.patch('/:id', sanitizeClienteInput, update)
clienteRouter.delete('/:id', remove)
/*clienteRouter.delete('/', (req, res) => {
  res.status(405).send('Method Not Allowed')
}) 
  Ver mas adelante  
*/ 