import { Router } from 'express';
import {
  findAll,
  findOne,
  add,
  update,
  remove,
  findByClient,
  createForClient,
  cancel,
  changeEstado,
  concretar,
} from './senia.controler.js';
import {
  sanitizeSeniaInput,
  sanitizeEstadoInput,
  sanitizeConcretarInput,
} from '../shared/middlewares/sanitization.middleware.js';
import { validateBody } from '../shared/middlewares/validation.middleware.js';
import { validateSeniaAmountAgainstProperty } from '../shared/middlewares/business-rules.middleware.js';
import {
  seniaClienteCreateSchema,
  seniaConcretarSchema,
  seniaCreateSchema,
  seniaEstadoSchema,
  seniaUpdateSchema,
} from '../shared/validation/schemas.js';
import { authenticateToken } from '../shared/middlewares/auth.middleware.js';

const router = Router();

router.get('/', findAll);
router.get('/mis-senias', authenticateToken, findByClient);
router.get('/:clave', authenticateToken, findOne);
router.post('/cliente', authenticateToken, sanitizeSeniaInput, validateBody(seniaClienteCreateSchema), validateSeniaAmountAgainstProperty, createForClient);
router.post('/', sanitizeSeniaInput, validateBody(seniaCreateSchema), validateSeniaAmountAgainstProperty, add);
router.put('/:clave', sanitizeSeniaInput, validateBody(seniaUpdateSchema), validateSeniaAmountAgainstProperty, update);
router.patch('/:clave/cancelar', authenticateToken, cancel);
router.patch('/:clave/estado', authenticateToken, sanitizeEstadoInput, validateBody(seniaEstadoSchema), changeEstado);
router.post('/:clave/concretar', authenticateToken, sanitizeConcretarInput, validateBody(seniaConcretarSchema), concretar);
router.delete('/:clave', remove);

export { router as seniaRouter };
