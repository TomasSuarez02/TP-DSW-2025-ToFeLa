import { NextFunction, Request, Response } from 'express';
import type { RequiredEntityData } from '@mikro-orm/core';
import { Documentacion } from './documentacion.entity.js';
import { orm } from '../shared/db/orm.js';
import { HttpError } from '../shared/errors/http.error.js';
import { borrarArchivo, guardarBase64, rutaAbsoluta } from '../shared/utils/archivo.js';

const em = orm.em;

/** Los documentos personales no se sirven estáticos; ver `descargar`. */
const CARPETA = 'documentos';

/**
 * Separa el archivo del resto de los campos: si vino `base64`+`filename` se
 * escribe a disco y lo que se persiste es solo el nombre, en `path`.
 */
function separarArchivo(input: Record<string, unknown>) {
  const { base64, filename, ...datos } = input;
  if (!base64) return { datos, archivo: undefined };

  if (!filename) {
    throw new HttpError(
      400,
      'Falta el nombre del archivo',
      [{ path: 'filename', message: 'Falta el nombre del archivo' }],
      'VALIDATION_ERROR',
    );
  }

  return { datos, archivo: guardarBase64(CARPETA, String(filename), String(base64)) };
}

async function findAll(_req: Request, res: Response, next: NextFunction) {
  try {
    const documentaciones = await em.find(Documentacion, {}, { populate: ['clientes', 'clientes.cliente'] });
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
    const { datos, archivo } = separarArchivo(req.body.sanitizedInput);
    const documentacion = em.create(Documentacion, {
      ...datos,
      ...(archivo ? { path: archivo } : {}),
    } as RequiredEntityData<Documentacion>);
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
    const { datos, archivo } = separarArchivo(req.body.sanitizedInput);

    // Reemplazar el archivo deja huérfano al anterior.
    if (archivo) borrarArchivo(CARPETA, documentacionToUpdate.path);

    em.assign(documentacionToUpdate, { ...datos, ...(archivo ? { path: archivo } : {}) });
    await em.flush();
    res.status(200).json({ message: 'documentacion updated', data: documentacionToUpdate });
  } catch (error) {
    next(error);
  }
}

/**
 * Descarga el archivo. A diferencia de las fotos de propiedades, esto son
 * papeles personales (recibos de sueldo, garantías), así que no se sirven por
 * `express.static`: pasan por acá, que exige token y rol de agente.
 */
async function descargar(req: Request, res: Response, next: NextFunction) {
  try {
    const { role } = (req as Request & { user?: { role?: string } }).user ?? {};
    if (role !== 'agente') {
      throw new HttpError(
        403,
        'Solo un agente puede descargar documentación',
        [{ path: 'general', message: 'Solo un agente puede descargar documentación' }],
        'AUTH_ERROR',
      );
    }

    const documentacion = await em.findOneOrFail(Documentacion, { id: Number(req.params.id) });
    if (!documentacion.path) {
      throw new HttpError(
        404,
        'La documentación no tiene archivo adjunto',
        [{ path: 'path', message: 'La documentación no tiene archivo adjunto' }],
        'NOT_FOUND',
      );
    }

    res.sendFile(rutaAbsoluta(CARPETA, documentacion.path));
  } catch (error) {
    next(error);
  }
}

async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id;
    const documentacionToRemove = await em.findOneOrFail(Documentacion, { id: Number(id) });
    borrarArchivo(CARPETA, documentacionToRemove.path);
    await em.removeAndFlush(documentacionToRemove);
    res.status(200).json({ message: 'documentacion deleted', data: documentacionToRemove });
  } catch (error) {
    next(error);
  }
}

export { findAll, findOne, add, update, descargar, remove };
