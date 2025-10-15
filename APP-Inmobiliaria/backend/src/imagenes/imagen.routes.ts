import { Router } from 'express';
import {
  findAll,
  findOne,
  add,
  update,
  remove,
  sanitizeImagenInput
} from './imagen.controler.js';

const router = Router();

router.get('/', findAll);
router.get('/:id', findOne);
router.post('/', add); // ✅ Sin sanitizer para POST
router.put('/:id', sanitizeImagenInput, update);
router.delete('/:id', remove);

export { router as imagenRouter };
