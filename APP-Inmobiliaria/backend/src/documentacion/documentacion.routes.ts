import { Router } from 'express';
import { findAll, findOne, add, update, descargar, remove } from './documentacion.controler.js';
import { sanitizeDocumentacionInput } from '../shared/middlewares/sanitization.middleware.js';
import { validateBody } from '../shared/middlewares/validation.middleware.js';
import {
  documentacionCreateSchema,
  documentacionUpdateSchema,
} from '../shared/validation/schemas.js';
import { authenticateToken } from '../shared/middlewares/auth.middleware.js';

const router = Router();

router.get('/', authenticateToken, findAll);
// Antes de /:id, si no la ruta con id se come el path del archivo.
router.get('/:id/archivo', authenticateToken, descargar);
router.get('/:id', authenticateToken, findOne);
router.post('/', authenticateToken, sanitizeDocumentacionInput, validateBody(documentacionCreateSchema), add);
router.put('/:id', authenticateToken, sanitizeDocumentacionInput, validateBody(documentacionUpdateSchema), update);
router.delete('/:id', authenticateToken, remove);

export { router as documentacionRouter };
