import { Router } from 'express';
import {
  findAll,
  findOne,
  add,
  update,
  remove
} from './imagen.controler.js';
import { sanitizeImagenInput } from '../shared/middlewares/sanitization.middleware.js';
import { soloAgente } from '../shared/middlewares/auth.middleware.js';

const router = Router();

// Las fotos de las propiedades se ven en el sitio público.
router.get('/', findAll);
router.get('/:id', findOne);

// Subirlas y borrarlas es del backoffice.
router.post('/', soloAgente, add); // ✅ Sin sanitizer para POST
router.put('/:id', soloAgente, sanitizeImagenInput, update);
router.delete('/:id', soloAgente, remove);

export { router as imagenRouter };
