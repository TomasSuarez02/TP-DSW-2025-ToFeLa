import { Router } from 'express'
import { findAll, findOne, add, update, remove } from './tipopropiedad.controler.js'
import { sanitizeTipoPropiedadInput } from '../shared/middlewares/sanitization.middleware.js'

export const tipopropiedadRouter = Router()

tipopropiedadRouter.get('/', findAll)
tipopropiedadRouter.get('/:id', findOne)
tipopropiedadRouter.post('/', sanitizeTipoPropiedadInput, add)
tipopropiedadRouter.put('/:id', sanitizeTipoPropiedadInput, update)
tipopropiedadRouter.delete('/:id', remove)
/*tipopropiedadRouter.delete('/', (req, res) => {
  res.status(405).send('Method Not Allowed')
})*/