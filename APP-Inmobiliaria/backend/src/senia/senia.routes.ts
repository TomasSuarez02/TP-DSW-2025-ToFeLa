import { Router } from 'express';
import {
  findAll,
  findOne,
  add,
  update,
  remove
} from './senia.controler.js';
import { sanitizeSeniaInput } from '../shared/middlewares/sanitization.middleware.js';

const router = Router();

router.get('/', findAll);
router.get('/:id', findOne);
router.post('/', sanitizeSeniaInput, add);
router.put('/:id', sanitizeSeniaInput, update);
router.delete('/:id', remove);

export { router as seniaRouter };
