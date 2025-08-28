import { Request, Response, NextFunction } from 'express';
import { Propiedad } from './propiedad.entity.js';
import { orm } from '../shared/db/orm.js'

const em = orm.em;

function sanitizePropiedadInput(req: Request, res: Response, next: NextFunction) {
  req.body.sanitizedInput = {
    direccion: req.body.direccion,
    precio: req.body.precio,
    estado: req.body.estado,
    tipoPropiedadId: req.body.tipoPropiedadId,
    inmobiliariaCuit: req.body.inmobiliariaCuit,
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
      const propiedades = await em.find(
        Propiedad,
        {},
        { populate: ['tiposPropiedad', 'inmobiliaria'] }
      );
      res.status(200).json({ message: 'found all propiedades', data: propiedades });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
}

async function findOne(req: Request, res: Response) {
  try {
      const id = req.params.id;
      const propiedad = await em.findOneOrFail(
        Propiedad,
        { id: Number(id) },
        { populate: ['tiposPropiedad', 'inmobiliaria'] }
      );
      res.status(200).json({ message: 'found propiedad', data: propiedad });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
}

async function add(req: Request, res: Response) {
  try {
      const propiedad = em.create(Propiedad, req.body.sanitizedInput);
      await em.flush();
      res.status(201).json({ message: 'propiedad created', data: propiedad });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
}

async function update(req: Request, res: Response) {
  try {
      const id = req.params.id
      const propiedadToUpdate = await em.findOneOrFail(Propiedad, { id: Number(id) })
      em.assign(propiedadToUpdate, req.body.sanitizedInput)
      await em.flush()
      res
        .status(200)
        .json({ message: 'propiedad updated', data: propiedadToUpdate })
    } catch (error: any) {
      res.status(500).json({ message: error.message })
    }
}

async function remove(req: Request, res: Response) {
  try {
      const id = req.params.id;
      const propiedadToRemove = await em.findOneOrFail(Propiedad, { id: Number(id) });
      await em.removeAndFlush(propiedadToRemove);
      res.status(200).json({ message: 'propiedad deleted', data: propiedadToRemove });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
}

export { sanitizePropiedadInput, findAll, findOne, add, update, remove };
