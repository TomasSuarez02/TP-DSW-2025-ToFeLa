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

const router = Router();

router.get('/', findAll);
router.get('/:id', findOne);
router.post('/', sanitizePropiedadInput, validateBody(propiedadCreateSchema), validatePropiedadTimeRange, add);
router.put('/:id', sanitizePropiedadInput, validateBody(propiedadUpdateSchema), validatePropiedadTimeRange, update);
router.delete('/:id', remove);

export { router as propiedadRouter };
