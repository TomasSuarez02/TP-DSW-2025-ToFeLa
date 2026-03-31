import { NextFunction, Request, Response } from 'express';
import { TipoDocumentacion } from './tipodocumentacion.entity.js';
import { orm } from '../shared/db/orm.js';

const em = orm.em;

async function findAll(req: Request, res: Response, next: NextFunction) {
  try {
    const tipos = await em.find(TipoDocumentacion, {}, { populate: ['clientes'] });
    res.status(200).json({ message: 'found all tipos de documentacion', data: tipos });
  } catch (error) {
    next(error);
    
  }
}

async function findOne(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id;
    const tipo = await em.findOneOrFail(TipoDocumentacion, { id: Number(id) }, { populate: ['clientes'] });
    res.status(200).json({ message: 'found tipo de documentacion', data: tipo });
  } catch (error) {
    next(error);
  }
}

async function add(req: Request, res: Response, next: NextFunction) {
  try {
    const tipo = em.create(TipoDocumentacion, req.body.sanitizedInput);
    await em.flush();
    res.status(201).json({ message: 'tipo de documentacion created', data: tipo });
  } catch (error) {
    next(error);
  }
}

async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id;
    const tipoToUpdate = await em.findOneOrFail(TipoDocumentacion, { id: Number(id) });
    em.assign(tipoToUpdate, req.body.sanitizedInput);
    await em.flush();
    res.status(200).json({ message: 'tipo de documentacion updated', data: tipoToUpdate });
  } catch (error) {
    next(error);
  }
}

async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id;
    const tipoToRemove = await em.findOneOrFail(TipoDocumentacion, { id: Number(id) });
    await em.removeAndFlush(tipoToRemove);
    res.status(200).json({ message: 'tipo de documentacion removed', data: tipoToRemove });
  } catch (error) {
    next(error);
  }
}

export { findAll, findOne, add, update, remove };
