import { Router } from 'express'
import { findAll, findOne, add, update, remove } from './agenteinmobiliario.controler.js'
import { sanitizeAgenteInput } from '../shared/middlewares/sanitization.middleware.js'
import { validateBody } from '../shared/middlewares/validation.middleware.js'
import { agenteCreateSchema, agenteUpdateSchema } from '../shared/validation/schemas.js'

export const agenteInmobiliarioRouter = Router()

agenteInmobiliarioRouter.get('/', findAll)
agenteInmobiliarioRouter.get('/:id', findOne)
agenteInmobiliarioRouter.post('/', sanitizeAgenteInput, validateBody(agenteCreateSchema), add)
agenteInmobiliarioRouter.put('/:id', sanitizeAgenteInput, validateBody(agenteUpdateSchema), update)
agenteInmobiliarioRouter.delete('/:id', remove)
