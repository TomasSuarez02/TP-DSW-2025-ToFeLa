import { Router } from 'express'
import { findAll, findOne, add, update, remove } from './agenteinmobiliario.controler.js'
import { sanitizeAgenteInput } from '../shared/middlewares/sanitization.middleware.js'

export const agenteInmobiliarioRouter = Router()

agenteInmobiliarioRouter.get('/', findAll)
agenteInmobiliarioRouter.get('/:id', findOne)
agenteInmobiliarioRouter.post('/', sanitizeAgenteInput, add)
agenteInmobiliarioRouter.put('/:id', sanitizeAgenteInput, update)
agenteInmobiliarioRouter.delete('/:id', remove)
