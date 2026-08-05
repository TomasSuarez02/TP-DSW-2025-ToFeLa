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
import { authenticateToken, soloAgente } from '../shared/middlewares/auth.middleware.js';

const router = Router();

// El listado completo es del backoffice; el cliente tiene `/mis-senias`.
router.get('/', soloAgente, findAll);
router.get('/mis-senias', authenticateToken, findByClient);
router.get('/:clave', authenticateToken, findOne);
router.post('/cliente', authenticateToken, sanitizeSeniaInput, validateBody(seniaClienteCreateSchema), validateSeniaAmountAgainstProperty, createForClient);
// Alta y edición a nombre de un tercero: solo el agente. El cliente seña por
// `/senias/cliente`, que toma su id del token.
router.post('/', soloAgente, sanitizeSeniaInput, validateBody(seniaCreateSchema), validateSeniaAmountAgainstProperty, add);
router.put('/:clave', soloAgente, sanitizeSeniaInput, validateBody(seniaUpdateSchema), validateSeniaAmountAgainstProperty, update);
router.patch('/:clave/cancelar', authenticateToken, cancel);
router.patch('/:clave/estado', authenticateToken, sanitizeEstadoInput, validateBody(seniaEstadoSchema), changeEstado);
router.post('/:clave/concretar', authenticateToken, sanitizeConcretarInput, validateBody(seniaConcretarSchema), concretar);
router.delete('/:clave', soloAgente, remove);

export { router as seniaRouter };
