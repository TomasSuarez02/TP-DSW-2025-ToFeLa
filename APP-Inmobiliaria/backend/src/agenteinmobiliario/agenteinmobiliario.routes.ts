import { Router } from 'express'
import { findAll, findOne, add, update, remove } from './agenteinmobiliario.controler.js'
import { sanitizeAgenteInput } from '../shared/middlewares/sanitization.middleware.js'
import { validateBody } from '../shared/middlewares/validation.middleware.js'
import { agenteCreateSchema, agenteUpdateSchema } from '../shared/validation/schemas.js'
import { soloAgente } from '../shared/middlewares/auth.middleware.js'

export const agenteInmobiliarioRouter = Router()

// Datos del personal: nada de esto es público. El alta de un agente la hace
// otro agente, no hay registro abierto.
agenteInmobiliarioRouter.get('/', soloAgente, findAll)
agenteInmobiliarioRouter.get('/:id', soloAgente, findOne)
agenteInmobiliarioRouter.post('/', soloAgente, sanitizeAgenteInput, validateBody(agenteCreateSchema), add)
agenteInmobiliarioRouter.put('/:id', soloAgente, sanitizeAgenteInput, validateBody(agenteUpdateSchema), update)
agenteInmobiliarioRouter.delete('/:id', soloAgente, remove)
