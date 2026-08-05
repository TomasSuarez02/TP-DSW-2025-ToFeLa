import { Router } from 'express'
import { findAll, findByClient, add, revisar, remove } from './documentacioncliente.controler.js'
import { sanitizeDocumentacionClienteInput } from '../shared/middlewares/sanitization.middleware.js'
import { validateBody } from '../shared/middlewares/validation.middleware.js'
import {
  documentacionClienteCreateSchema,
  documentacionClienteEstadoSchema,
} from '../shared/validation/schemas.js'
import { authenticateToken } from '../shared/middlewares/auth.middleware.js'

const router = Router()

router.get('/', authenticateToken, findAll)
router.get('/mis-documentaciones', authenticateToken, findByClient)
router.post(
  '/',
  authenticateToken,
  sanitizeDocumentacionClienteInput,
  validateBody(documentacionClienteCreateSchema),
  add,
)
router.patch(
  '/:documentacion/:cliente/revisar',
  authenticateToken,
  sanitizeDocumentacionClienteInput,
  validateBody(documentacionClienteEstadoSchema),
  revisar,
)
router.delete('/:documentacion/:cliente', authenticateToken, remove)

export { router as documentacionClienteRouter }
