import { NextFunction, Request, Response } from 'express';
import { orm } from '../shared/db/orm.js'
import { Visita } from './visita.entity.js';
import { Propiedad } from '../propiedad/propiedad.entity.js';
import { Cliente } from '../cliente/cliente.entity.js';
import { HttpError } from '../shared/errors/http.error.js';
import { parsearClave } from '../shared/db/clave-compuesta.js';

const em = orm.em;

/** Resuelve la visita identificada por la clave compuesta de la URL. */
async function buscarPorClave(clave: string) {
  const parsed = parsearClave(clave);
  if (!parsed) {
    throw new HttpError(
      400,
      'La clave de la visita es inválida',
      [{ path: 'clave', message: 'La clave de la visita es inválida' }],
      'VALIDATION_ERROR',
    );
  }

  return em.findOneOrFail(
    Visita,
    {
      propiedad: parsed.propiedad,
      cliente: parsed.cliente,
      fecha_hora: parsed.fecha,
    },
    { populate: ['propiedad', 'cliente'] },
  );
}

async function findAll(req: Request, res: Response, next: NextFunction) {
  try {
      const visitas = await em.find(
        Visita,
        {},
        { populate: ['propiedad', 'cliente'] }
      );
      res.status(200).json({ message: 'found all visitas', data: visitas });
    } catch (error) {
      next(error);
    }
}

async function findOne(req: Request, res: Response, next: NextFunction) {
  try {
      const visita = await buscarPorClave(req.params.clave);
      res.status(200).json({ message: 'found visita', data: visita });
    } catch (error) {
      next(error);
    }
}

async function add(req: Request, res: Response, next: NextFunction) {
  try {
      const { propiedad, cliente, fecha_hora } = req.body.sanitizedInput;
      const propiedadEntity = await em.findOneOrFail(Propiedad, { id: Number(propiedad) });
      const clienteEntity = await em.findOneOrFail(Cliente, { id: Number(cliente) });

      const visita = em.create(Visita, {
        propiedad: propiedadEntity,
        cliente: clienteEntity,
        fecha_hora: new Date(fecha_hora),
      });

      await em.flush();
      await em.populate(visita, ['propiedad', 'cliente']);
      res.status(201).json({ message: 'visita created', data: visita });
    } catch (error) {
      next(error);
    }
}

async function update(req: Request, res: Response, next: NextFunction) {
  try {
      const visitaToUpdate = await buscarPorClave(req.params.clave)
      // La fecha forma parte de la PK: cambiarla es borrar y crear otra visita.
      const { propiedad: _p, cliente: _c, fecha_hora: _f, ...cambios } = req.body.sanitizedInput
      em.assign(visitaToUpdate, cambios)
      await em.flush()
      res
        .status(200)
        .json({ message: 'visita updated', data: visitaToUpdate })
    } catch (error) {
      next(error)
    }
}

async function remove(req: Request, res: Response, next: NextFunction) {
  try {
      const visitaToRemove = await buscarPorClave(req.params.clave);
      await em.removeAndFlush(visitaToRemove);
      res.status(200).json({ message: 'visita deleted', data: visitaToRemove });
    } catch (error) {
      next(error);
    }
}

export { findAll, findOne, add, update, remove };
