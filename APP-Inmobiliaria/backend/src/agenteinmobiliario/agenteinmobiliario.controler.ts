import { NextFunction, Request, Response } from 'express';
import { AgenteInmobiliario } from './agenteinmobiliario.entity.js';
import { orm } from '../shared/db/orm.js';
import { conPasswordHasheada } from '../shared/utils/password.js';

const em = orm.em;

async function findAll(req: Request, res: Response, next: NextFunction) {
  try {
    const agentes = await em.find(AgenteInmobiliario, {}, {populate: ['inmobiliaria']});
    res.status(200).json({ message: 'found all agentes inmobiliarios', data: agentes });
  } catch (error) {
    next(error);
  }
}

async function findOne(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id;
    const agente = await em.findOneOrFail(AgenteInmobiliario, { id: Number(id) }, {populate: ['inmobiliaria']});
    res.status(200).json({ message: 'found agente inmobiliario', data: agente });
  } catch (error) {
    next(error);
  }
}

async function add(req: Request, res: Response, next: NextFunction) {
  try {
    const agente = em.create(AgenteInmobiliario, await conPasswordHasheada(req.body.sanitizedInput));
    await em.flush();
    res.status(201).json({ message: 'agente inmobiliario created', data: agente });
  } catch (error) {
    next(error);
  }
}

async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id;
    const agenteToUpdate = await em.findOneOrFail(AgenteInmobiliario, { id: Number(id) });
    em.assign(agenteToUpdate, await conPasswordHasheada(req.body.sanitizedInput));
    await em.flush();
    res.status(200).json({ message: 'agente inmobiliario updated', data: agenteToUpdate });
  } catch (error) {
    next(error);
  }
}

async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id;
    const agenteToRemove = await em.findOneOrFail(AgenteInmobiliario, { id: Number(id) });
    await em.removeAndFlush(agenteToRemove);
    res.status(200).json({ message: 'agente inmobiliario eliminado', data: agenteToRemove });
  } catch (error) {
    next(error);
  }
}

export { findAll, findOne, add, update, remove };
