import { Router } from 'express';
import {
  findAll,
  findOne,
  add,
  update,
  remove,
  findByClient,
  createForClient,
} from './senia.controler.js';
import { sanitizeSeniaInput } from '../shared/middlewares/sanitization.middleware.js';
import { validateBody } from '../shared/middlewares/validation.middleware.js';
import { validateSeniaAmountAgainstProperty } from '../shared/middlewares/business-rules.middleware.js';
import { seniaCreateSchema, seniaUpdateSchema } from '../shared/validation/schemas.js';
import { authenticateToken } from '../shared/middlewares/auth.middleware.js';

const router = Router();

router.get('/', findAll);
router.get('/mis-senias', authenticateToken, findByClient);
router.get('/:id', findOne);
router.post('/cliente', authenticateToken, sanitizeSeniaInput, validateBody(seniaCreateSchema), validateSeniaAmountAgainstProperty, createForClient);
router.post('/', sanitizeSeniaInput, validateBody(seniaCreateSchema), validateSeniaAmountAgainstProperty, add);
router.put('/:id', sanitizeSeniaInput, validateBody(seniaUpdateSchema), validateSeniaAmountAgainstProperty, update);
router.delete('/:id', remove);

export { router as seniaRouter };
