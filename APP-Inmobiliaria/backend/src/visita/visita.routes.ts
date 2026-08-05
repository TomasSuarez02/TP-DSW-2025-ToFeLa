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
import { authenticateToken, soloAgente } from '../shared/middlewares/auth.middleware.js';

const router = Router();

// La agenda completa es del backoffice: expone qué cliente visita qué propiedad.
router.get('/', soloAgente, findAll);
router.get('/:clave', soloAgente, findOne);

// Pedir una visita lo hace el cliente desde la ficha de la propiedad.
router.post('/', authenticateToken, sanitizeVisitaInput, validateBody(visitaCreateSchema), validateVisitaFutureDate, add);

router.put('/:clave', soloAgente, sanitizeVisitaInput, validateBody(visitaUpdateSchema), validateVisitaFutureDate, update);
router.delete('/:clave', soloAgente, remove);

export { router as visitaRouter };
