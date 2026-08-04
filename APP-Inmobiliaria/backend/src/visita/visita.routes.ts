import { Router } from 'express';
import {
  findAll,
  findOne,
  add,
  update,
  remove
} from './visita.controler.js';
import { sanitizeVisitaInput } from '../shared/middlewares/sanitization.middleware.js';
import { validateBody } from '../shared/middlewares/validation.middleware.js';
import { validateVisitaFutureDate } from '../shared/middlewares/business-rules.middleware.js';
import { visitaCreateSchema, visitaUpdateSchema } from '../shared/validation/schemas.js';

const router = Router();

router.get('/', findAll);
router.get('/:clave', findOne);
router.post('/', sanitizeVisitaInput, validateBody(visitaCreateSchema), validateVisitaFutureDate, add);
router.put('/:clave', sanitizeVisitaInput, validateBody(visitaUpdateSchema), validateVisitaFutureDate, update);
router.delete('/:clave', remove);

export { router as visitaRouter };
