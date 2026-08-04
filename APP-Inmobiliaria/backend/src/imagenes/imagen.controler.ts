import { NextFunction, Request, Response } from 'express'
import { Imagen } from './imagen.entity.js'
import { orm } from '../shared/db/orm.js'
import fs from 'fs'
import path from 'path'
import { HttpError } from '../shared/errors/http.error.js'

const em = orm.em;

async function findAll(req: Request, res: Response, next: NextFunction) {
  try {
      const imagenes = await em.find(
        Imagen,
        {},
        { populate: ['propiedad'] }
      );
      res.status(200).json({ message: 'found all imagenes', data: imagenes });
    } catch (error) {
      next(error);
    }
}

async function findOne(req: Request, res: Response, next: NextFunction) {
  try {
      const id = req.params.id;
      const imagen = await em.findOneOrFail(
        Imagen,
        { id: Number(id) },
        { populate: ['propiedad'] }
      );
      res.status(200).json({ message: 'found imagen', data: imagen });
    } catch (error) {
      next(error);
    }
}

async function add(req: Request, res: Response, next: NextFunction) {
  try {
    const { propiedad, base64, filename } = req.body;

    if (!base64 || !filename) {
      return next(
        new HttpError(
          400,
          'Falta la imagen o el nombre del archivo',
          [{ path: 'base64', message: 'Falta la imagen o el nombre del archivo' }],
          'VALIDATION_ERROR',
        ),
      );
    }

    // Crear directorio si no existe
    const uploadDir = path.join(process.cwd(), 'uploads/images');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Guardar físicamente la imagen
    const imagePath = path.join(uploadDir, filename);
    const base64Data = base64.replace(/^data:image\/\w+;base64,/, '');
    fs.writeFileSync(imagePath, base64Data, 'base64');

    // Imagen es entidad débil: su PK es (id, propiedad), así que el id no es
    // autoincremental y se numera dentro de cada propiedad.
    const existentes = await em.find(Imagen, { propiedad: Number(propiedad) });
    const siguienteId = existentes.reduce((max, img) => Math.max(max, img.id), 0) + 1;

    // Guardar referencia en BD
    const imagen = em.create(Imagen, {
      id: siguienteId,
      propiedad,
      path: `/images/${filename}`
    });
    await em.flush();

    res.status(201).json({ message: 'Imagen creada y guardada', data: imagen });
  } catch (error) {
    console.error('Error al crear imagen:', error);
    next(error);
  }
}

async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id;
    const imagenToUpdate = await em.findOneOrFail(Imagen, { id: Number(id) });
    em.assign(imagenToUpdate, req.body.sanitizedInput);
    await em.flush();
    res.status(200).json({ message: 'imagen updated', data: imagenToUpdate });
  } catch (error) {
    next(error);
  }
}

async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id;
    const imagen = await em.findOneOrFail(Imagen, { id: Number(id) });
    
    // Eliminar archivo físico
    const filePath = path.join(process.cwd(), 'uploads', imagen.path);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    
    await em.removeAndFlush(imagen);
    res.status(200).json({ message: 'imagen removed' });
  } catch (error) {
    next(error);
  }
}

export { findAll, findOne, add, update, remove };
