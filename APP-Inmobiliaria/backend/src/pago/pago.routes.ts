import { Router } from 'express'
import { procesar } from './pago.controler.js'
import { sanitizePagoInput } from '../shared/middlewares/sanitization.middleware.js'
import { validateBody } from '../shared/middlewares/validation.middleware.js'
import { pagoCreateSchema } from '../shared/validation/schemas.js'
import { authenticateToken } from '../shared/middlewares/auth.middleware.js'

const router = Router()

router.post('/', authenticateToken, sanitizePagoInput, validateBody(pagoCreateSchema), procesar)

export { router as pagoRouter }
