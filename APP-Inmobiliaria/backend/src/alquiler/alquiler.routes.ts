import { Router } from 'express'
import {
  findAll,
  findOne,
  findByClient,
  add,
  update,
  changeEstado,
  remove,
} from './alquiler.controler.js'
import {
  sanitizeAlquilerInput,
  sanitizeEstadoInput,
} from '../shared/middlewares/sanitization.middleware.js'
import { validateBody } from '../shared/middlewares/validation.middleware.js'
import {
  alquilerCreateSchema,
  alquilerEstadoSchema,
  alquilerUpdateSchema,
} from '../shared/validation/schemas.js'
import { authenticateToken, soloAgente } from '../shared/middlewares/auth.middleware.js'

const router = Router()

// Lista todos los contratos con sus clientes: backoffice.
router.get('/', soloAgente, findAll)
router.get('/mis-alquileres', authenticateToken, findByClient)
router.get('/:clave', authenticateToken, findOne)
router.post('/', authenticateToken, sanitizeAlquilerInput, validateBody(alquilerCreateSchema), add)
router.put('/:clave', authenticateToken, sanitizeAlquilerInput, validateBody(alquilerUpdateSchema), update)
router.patch('/:clave/estado', authenticateToken, sanitizeEstadoInput, validateBody(alquilerEstadoSchema), changeEstado)
router.delete('/:clave', authenticateToken, remove)

export { router as alquilerRouter }
