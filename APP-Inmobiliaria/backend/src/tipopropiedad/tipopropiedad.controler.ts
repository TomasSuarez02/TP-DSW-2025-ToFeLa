import { Request, Response, NextFunction } from 'express'
import { TipoPropiedad } from './tipopropiedad.entity.js'
import { orm } from '../shared/db/orm.js'

const em = orm.em

async function sanitizeTipoPropiedadInput(req: Request, res: Response, next: NextFunction) {
  req.body.sanitizedInput = {
    nombre: req.body.nombre,
    descripcion: req.body.descripcion,
    estado: req.body.estado,
  }
  next()
}

async function findAll(req: Request, res: Response) {
  try {
      const tipos = em.find(TipoPropiedad, {});
      res.status(200).json({ message: 'found all tipos de propiedades', data: tipos });
    } catch (error: any) {
      res.status(500).json({ message: error.message });  
  }
}

async function findOne(req: Request, res: Response) {
  try {
      const id = req.params.id;
      const tipo = em.findOneOrFail(TipoPropiedad, { id: Number(id) });
      res.status(200).json({ message: 'found tipo de propiedad', data: tipo });
    } catch (error:any) {
      res.status(500).json({ message: error.message });
    }
}

async function add(req: Request, res: Response) {
  try {
      const tipo = em.create(TipoPropiedad, req.body.sanitizedInput);
      await em.flush();
      res.status(201).json({ message: 'tipo de propiedad created', data: tipo });
    } catch (error:any) {
      res.status(500).json({ message: error.message });
    }
}

async function update(req: Request, res: Response) {
  try {
      const id = req.params.id;
      const tipoToUpdate = await em.findOneOrFail(TipoPropiedad, { id: Number(id) });
      em.assign(tipoToUpdate, req.body.sanitizedInput);
      await em.flush();
      res.status(200).json({ message: 'tipo de propiedad updated', data: tipoToUpdate });
    } catch (error:any) {
      res.status(500).json({ message: error.message });
    }
}

async function remove(req: Request, res: Response) {
  try {
      const id = req.params.id;
      const tipoToRemove = await em.findOneOrFail(TipoPropiedad, { id: Number(id) });
      await em.removeAndFlush(tipoToRemove);
      res.status(200).json({ message: 'tipo de documentacion removed', data: tipoToRemove });
    } catch (error:any) {
      res.status(500).json({ message: error.message });
    }
}

export { sanitizeTipoPropiedadInput, findAll, findOne, add, update, remove };
