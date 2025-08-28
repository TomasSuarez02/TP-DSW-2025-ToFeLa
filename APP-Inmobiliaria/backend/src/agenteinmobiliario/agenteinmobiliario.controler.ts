import { Request, Response, NextFunction } from 'express';
import { AgenteInmobiliario } from './agenteinmobiliario.entity.js';
import { orm } from '../shared/db/orm.js';

const em = orm.em;

function sanitizeAgenteInput(req: Request, res: Response, next: NextFunction) {
  req.body.sanitizedInput = {
    id: req.body.id,
    nombre: req.body.nombre,
    apellido: req.body.apellido,
    email: req.body.email,
    telefono: req.body.telefono,
    fechaIngreso: req.body.fechaIngreso,
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
    const agentes = await em.find(AgenteInmobiliario, {});
    res.status(200).json({ message: 'found all agentes inmobiliarios', data: agentes });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

async function findOne(req: Request, res: Response) {
  try {
    const id = req.params.id;
    const agente = await em.findOneOrFail(AgenteInmobiliario, { id: Number(id) });
    res.status(200).json({ message: 'found agente inmobiliario', data: agente });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

async function add(req: Request, res: Response) {
  try {
    const agente = em.create(AgenteInmobiliario, req.body.sanitizedInput);
    await em.flush();
    res.status(201).json({ message: 'agente inmobiliario created', data: agente });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

async function update(req: Request, res: Response) {
  try {
    const id = req.params.id;
    const agenteToUpdate = await em.findOneOrFail(AgenteInmobiliario, { id: Number(id) });
    em.assign(agenteToUpdate, req.body.sanitizedInput);
    await em.flush();
    res.status(200).json({ message: 'agente inmobiliario updated', data: agenteToUpdate });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

async function remove(req: Request, res: Response) {
  try {
    const id = req.params.id;
    const agenteToRemove = await em.findOneOrFail(AgenteInmobiliario, { id: Number(id) });
    await em.removeAndFlush(agenteToRemove);
    res.status(200).json({ message: 'agente inmobiliario eliminado', data: agenteToRemove });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

export { sanitizeAgenteInput, findAll, findOne, add, update, remove };
