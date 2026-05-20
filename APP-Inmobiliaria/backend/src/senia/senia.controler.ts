import { NextFunction, Request, Response } from 'express';
import { orm } from '../shared/db/orm.js'
import { Senia } from './senia.entity.js';
import { Propiedad } from '../propiedad/propiedad.entity.js';
import { Cliente } from '../cliente/cliente.entity.js';

const em = orm.em;

async function findAll(req: Request, res: Response, next: NextFunction) {
  try {
      const senias = await em.find(
        Senia,
        {},
        { populate: ['propiedad', 'cliente'] }
      );
      res.status(200).json({ message: 'found all senias', data: senias });
    } catch (error) {
      next(error);
    }
}

async function findOne(req: Request, res: Response, next: NextFunction) {
  try {
      const id = req.params.id;
      const senia = await em.findOneOrFail(
        Senia,
        { id: Number(id) },
        { populate: ['propiedad', 'cliente'] }
      );
      res.status(200).json({ message: 'found senia', data: senia });
    } catch (error) {
      next(error);
    }
}

async function add(req: Request, res: Response, next: NextFunction) {
  try {
      const senia = em.create(Senia, req.body.sanitizedInput);
      await em.flush();
      res.status(201).json({ message: 'senia created', data: senia });
    } catch (error) {
      next(error);
    }
}

async function createForClient(req: Request, res: Response, next: NextFunction) {
  try {
      const authReq = req as Request & { user?: { sub?: number; role?: string } };
      const clientId = authReq.user?.sub;
      const role = authReq.user?.role;

      if (!clientId || role !== 'cliente') {
        return res.status(403).json({ message: 'Acceso restringido' });
      }

      const { propiedad, importe } = req.body.sanitizedInput;
      if (!propiedad || importe == null) {
        return res.status(400).json({ message: 'Propiedad e importe son obligatorios' });
      }

      const propiedadEntity = await em.findOneOrFail(Propiedad, { id: Number(propiedad) });
      if (['reservada', 'alquilada'].includes((propiedadEntity.estado || '').toLowerCase())) {
        return res.status(400).json({ message: 'La propiedad no está disponible para señar' });
      }

      const clienteEntity = await em.findOneOrFail(Cliente, { id: clientId });

      const senia = em.create(Senia, {
        propiedad: propiedadEntity,
        cliente: clienteEntity,
        importe: Number(importe),
      });

      propiedadEntity.estado = 'reservada';
      await em.flush();

      res.status(201).json({ message: 'senia created', data: senia });
    } catch (error) {
      next(error);
    }
}

async function update(req: Request, res: Response, next: NextFunction) {
  try {
      const id = req.params.id
      const seniaToUpdate = await em.findOneOrFail(Senia, { id: Number(id) })
      em.assign(seniaToUpdate, req.body.sanitizedInput)
      await em.flush()
      res
        .status(200)
        .json({ message: 'senia updated', data: seniaToUpdate })
    } catch (error) {
      next(error)
    }
}

async function remove(req: Request, res: Response, next: NextFunction) {
  try {
      const id = req.params.id;
      const seniaToRemove = await em.findOneOrFail(Senia, { id: Number(id) });
      await em.removeAndFlush(seniaToRemove);
      res.status(200).json({ message: 'senia deleted', data: seniaToRemove });
    } catch (error) {
      next(error);
    }
}

async function findByClient(req: Request, res: Response, next: NextFunction) {
  try {
      const authReq = req as Request & { user?: { sub: number } };
      const clientId = authReq.user?.sub;
      if (!clientId) {
        return res.status(401).json({ message: 'No autorizado', data: [] });
      }

      const senias = await em.find(
        Senia,
        { cliente: clientId },
        { populate: ['propiedad', 'cliente'] }
      );
      res.status(200).json({ message: 'found client senias', data: senias });
    } catch (error) {
      next(error);
    }
}

export { findAll, findOne, add, createForClient, update, remove, findByClient };
