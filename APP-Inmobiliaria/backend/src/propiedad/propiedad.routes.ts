import { Router } from 'express';
import {
  findAll,
  findOne,
  add,
  update,
  remove
} from './propiedad.controler.js';
import { sanitizePropiedadInput } from '../shared/middlewares/sanitization.middleware.js';
import { validateBody } from '../shared/middlewares/validation.middleware.js';
import { propiedadCreateSchema, propiedadUpdateSchema } from '../shared/validation/schemas.js';
import { validatePropiedadTimeRange } from '../shared/middlewares/business-rules.middleware.js';
import { attachUserIfPresent, soloAgente } from '../shared/middlewares/auth.middleware.js';

const router = Router();

// El catálogo es público, pero si el que pide es un agente se le suma la
// información de ocupación (quién tiene tomada cada propiedad).
router.get('/', attachUserIfPresent, findAll);
router.get('/:id', attachUserIfPresent, findOne);

// Publicar, editar y dar de baja propiedades es del backoffice.
router.post('/', soloAgente, sanitizePropiedadInput, validateBody(propiedadCreateSchema), validatePropiedadTimeRange, add);
router.put('/:id', soloAgente, sanitizePropiedadInput, validateBody(propiedadUpdateSchema), validatePropiedadTimeRange, update);
router.delete('/:id', soloAgente, remove);

export { router as propiedadRouter };
