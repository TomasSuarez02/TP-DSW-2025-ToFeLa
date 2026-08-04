import { Router } from 'express';
import { findAll, findOne, add, update, remove } from './documentacion.controler.js';
import { sanitizeDocumentacionInput } from '../shared/middlewares/sanitization.middleware.js';
import { validateBody } from '../shared/middlewares/validation.middleware.js';
import {
  documentacionCreateSchema,
  documentacionUpdateSchema,
} from '../shared/validation/schemas.js';

const router = Router();

router.get('/', findAll);
router.get('/:id', findOne);
router.post('/', sanitizeDocumentacionInput, validateBody(documentacionCreateSchema), add);
router.put('/:id', sanitizeDocumentacionInput, validateBody(documentacionUpdateSchema), update);
router.delete('/:id', remove);

export { router as documentacionRouter };
