import { Router } from 'express';
import {
  findAll,
  findOne,
  add,
  update,
  remove
} from './senia.controler.js';
import { sanitizeSeniaInput } from '../shared/middlewares/sanitization.middleware.js';
import { validateBody } from '../shared/middlewares/validation.middleware.js';
import { validateSeniaAmountAgainstProperty } from '../shared/middlewares/business-rules.middleware.js';
import { seniaCreateSchema, seniaUpdateSchema } from '../shared/validation/schemas.js';

const router = Router();

router.get('/', findAll);
router.get('/:id', findOne);
router.post('/', sanitizeSeniaInput, validateBody(seniaCreateSchema), validateSeniaAmountAgainstProperty, add);
router.put('/:id', sanitizeSeniaInput, validateBody(seniaUpdateSchema), validateSeniaAmountAgainstProperty, update);
router.delete('/:id', remove);

export { router as seniaRouter };
