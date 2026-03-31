import { Request, Response } from 'express';
import { orm } from '../shared/db/orm.js'
import { Senia } from './senia.entity.js';

const em = orm.em;

async function findAll(req: Request, res: Response) {
  try {
      const senias = await em.find(
        Senia,
        {},
        { populate: ['propiedad', 'cliente'] }
      );
      res.status(200).json({ message: 'found all senias', data: senias });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
}

async function findOne(req: Request, res: Response) {
  try {
      const id = req.params.id;
      const senia = await em.findOneOrFail(
        Senia,
        { id: Number(id) },
        { populate: ['propiedad', 'cliente'] }
      );
      res.status(200).json({ message: 'found senia', data: senia });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
}

async function add(req: Request, res: Response) {
  try {
      const senia = em.create(Senia, req.body.sanitizedInput);
      await em.flush();
      res.status(201).json({ message: 'senia created', data: senia });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
}

async function update(req: Request, res: Response) {
  try {
      const id = req.params.id
      const seniaToUpdate = await em.findOneOrFail(Senia, { id: Number(id) })
      em.assign(seniaToUpdate, req.body.sanitizedInput)
      await em.flush()
      res
        .status(200)
        .json({ message: 'senia updated', data: seniaToUpdate })
    } catch (error: any) {
      res.status(500).json({ message: error.message })
    }
}

async function remove(req: Request, res: Response) {
  try {
      const id = req.params.id;
      const seniaToRemove = await em.findOneOrFail(Senia, { id: Number(id) });
      await em.removeAndFlush(seniaToRemove);
      res.status(200).json({ message: 'senia deleted', data: seniaToRemove });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
}

export { findAll, findOne, add, update, remove };
