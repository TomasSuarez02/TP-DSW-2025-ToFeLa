import { Router } from 'express';
import {
  findAll,
  findOne,
  findByClient,
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
// El cliente ve la suya por `/mis-visitas`, que se declara antes de `/:clave`
// para que 'mis-visitas' no se lea como una clave compuesta.
router.get('/', soloAgente, findAll);
router.get('/mis-visitas', authenticateToken, findByClient);
router.get('/:clave', soloAgente, findOne);

// Pedir una visita lo hace el cliente desde la ficha de la propiedad.
router.post('/', authenticateToken, sanitizeVisitaInput, validateBody(visitaCreateSchema), validateVisitaFutureDate, add);

router.put('/:clave', soloAgente, sanitizeVisitaInput, validateBody(visitaUpdateSchema), validateVisitaFutureDate, update);
// El cliente cancela una visita propia y futura; el control de pertenencia está
// en el controller, que es el único que puede ver de quién es la visita.
router.delete('/:clave', authenticateToken, remove);

export { router as visitaRouter };
