import { Request, Response } from 'express';
import { orm } from '../shared/db/orm.js'
import { Visita } from './visita.entity.js';

const em = orm.em;

async function findAll(req: Request, res: Response) {
  try {
      const visitas = await em.find(
        Visita,
        {},
        { populate: ['propiedad', 'cliente'] }
      );
      res.status(200).json({ message: 'found all visitas', data: visitas });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
}

async function findOne(req: Request, res: Response) {
  try {
      const id = req.params.id;
      const visita = await em.findOneOrFail(
        Visita,
        { id: Number(id) },
        { populate: ['propiedad', 'cliente'] }
      );
      res.status(200).json({ message: 'found visita', data: visita });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
}

async function add(req: Request, res: Response) {
  try {
      const visita = em.create(Visita, req.body.sanitizedInput);
      await em.flush();
      res.status(201).json({ message: 'visita created', data: visita });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
}

async function update(req: Request, res: Response) {
  try {
      const id = req.params.id
      const visitaToUpdate = await em.findOneOrFail(Visita, { id: Number(id) })
      em.assign(visitaToUpdate, req.body.sanitizedInput)
      await em.flush()
      res
        .status(200)
        .json({ message: 'visita updated', data: visitaToUpdate })
    } catch (error: any) {
      res.status(500).json({ message: error.message })
    }
}

async function remove(req: Request, res: Response) {
  try {
      const id = req.params.id;
      const visitaToRemove = await em.findOneOrFail(Visita, { id: Number(id) });
      await em.removeAndFlush(visitaToRemove);
      res.status(200).json({ message: 'visita deleted', data: visitaToRemove });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
}

export { findAll, findOne, add, update, remove };
