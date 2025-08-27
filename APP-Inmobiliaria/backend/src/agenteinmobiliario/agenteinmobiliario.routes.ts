import { Router } from 'express'
import { sanitizeAgenteInput, findAll, findOne, add, update, remove } from './agenteinmobiliario.controler.js'

export const agenteInmobiliarioRouter = Router()

agenteInmobiliarioRouter.get('/', findAll)
agenteInmobiliarioRouter.get('/:id', findOne)
agenteInmobiliarioRouter.post('/', sanitizeAgenteInput, add)
agenteInmobiliarioRouter.put('/:id', sanitizeAgenteInput, update)
agenteInmobiliarioRouter.delete('/:id', remove)
