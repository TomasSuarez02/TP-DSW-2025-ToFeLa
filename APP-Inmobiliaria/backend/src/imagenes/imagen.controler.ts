import { Request, Response, NextFunction } from 'express';
import { orm } from '../shared/db/orm.js'
import { Imagen } from './imagen.entity.js';

const em = orm.em;

function sanitizeImagenInput(req: Request, res: Response, next: NextFunction) {
  req.body.sanitizedInput = {
    path: req.body.path,
    propiedad: req.body.propiedad,
  };
  
  Object.keys(req.body.sanitizedInput).forEach((key) => {
    if (req.body.sanitizedInput[key] === undefined) {
      delete req.body.sanitizedInput[key];
    }
  });
  next();
}

async function findAll(req: Request, res: Response) {
  try {
      const imagenes = await em.find(
        Imagen,
        {},
        { populate: ['propiedad'] }
      );
      res.status(200).json({ message: 'found all imagenes', data: imagenes });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
}

async function findOne(req: Request, res: Response) {
  try {
      const id = req.params.id;
      const imagen = await em.findOneOrFail(
        Imagen,
        { id: Number(id) },
        { populate: ['propiedad'] }
      );
      res.status(200).json({ message: 'found imagen', data: imagen });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
}

async function add(req: Request, res: Response) {
  try {
      const imagen = em.create(Imagen, req.body.sanitizedInput);
      await em.flush();
      res.status(201).json({ message: 'imagen created', data: imagen });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
}

async function update(req: Request, res: Response) {
  try {
      const id = req.params.id
      const imagenToUpdate = await em.findOneOrFail(Imagen, { id: Number(id) })
      em.assign(imagenToUpdate, req.body.sanitizedInput)
      await em.flush()
      res
        .status(200)
        .json({ message: 'imagen updated', data: imagenToUpdate })
    } catch (error: any) {
      res.status(500).json({ message: error.message })
    }
}

async function remove(req: Request, res: Response) {
  try {
      const id = req.params.id;
      const imagenToRemove = await em.findOneOrFail(Imagen, { id: Number(id) });
      await em.removeAndFlush(imagenToRemove);
      res.status(200).json({ message: 'imagen deleted', data: imagenToRemove });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
}

export { sanitizeImagenInput, findAll, findOne, add, update, remove };
