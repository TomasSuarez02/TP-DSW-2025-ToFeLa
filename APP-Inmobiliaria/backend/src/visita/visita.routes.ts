import { Router } from 'express';
import {
  findAll,
  findOne,
  add,
  update,
  remove,
  sanitizeVisitaInput
} from './visita.controler.js';

const router = Router();

router.get('/', findAll);
router.get('/:id', findOne);
router.post('/', sanitizeVisitaInput, add);
router.put('/:id', sanitizeVisitaInput, update);
router.delete('/:id', remove);

export { router as visitaRouter };
