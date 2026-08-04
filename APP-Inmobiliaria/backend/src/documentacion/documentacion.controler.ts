import { NextFunction, Request, Response } from 'express';
import { Documentacion } from './documentacion.entity.js';
import { orm } from '../shared/db/orm.js';

const em = orm.em;

async function findAll(_req: Request, res: Response, next: NextFunction) {
  try {
    const documentaciones = await em.find(Documentacion, {}, { populate: ['clientes'] });
    res.status(200).json({ message: 'found all documentaciones', data: documentaciones });
  } catch (error) {
    next(error);
  }
}

async function findOne(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id;
    const documentacion = await em.findOneOrFail(
      Documentacion,
      { id: Number(id) },
      { populate: ['clientes'] },
    );
    res.status(200).json({ message: 'found documentacion', data: documentacion });
  } catch (error) {
    next(error);
  }
}

async function add(req: Request, res: Response, next: NextFunction) {
  try {
    const documentacion = em.create(Documentacion, req.body.sanitizedInput);
    await em.flush();
    res.status(201).json({ message: 'documentacion created', data: documentacion });
  } catch (error) {
    next(error);
  }
}

async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id;
    const documentacionToUpdate = await em.findOneOrFail(Documentacion, { id: Number(id) });
    em.assign(documentacionToUpdate, req.body.sanitizedInput);
    await em.flush();
    res.status(200).json({ message: 'documentacion updated', data: documentacionToUpdate });
  } catch (error) {
    next(error);
  }
}

async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id;
    const documentacionToRemove = await em.findOneOrFail(Documentacion, { id: Number(id) });
    await em.removeAndFlush(documentacionToRemove);
    res.status(200).json({ message: 'documentacion deleted', data: documentacionToRemove });
  } catch (error) {
    next(error);
  }
}

export { findAll, findOne, add, update, remove };
