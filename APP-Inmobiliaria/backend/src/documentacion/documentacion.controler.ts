import { NextFunction, Request, Response } from 'express';
import type { RequiredEntityData } from '@mikro-orm/core';
import { Documentacion } from './documentacion.entity.js';
import { orm } from '../shared/db/orm.js';
import { HttpError } from '../shared/errors/http.error.js';
import { borrarArchivo, guardarBase64, rutaAbsoluta } from '../shared/utils/archivo.js';
import { CARPETA_DOCUMENTOS as CARPETA } from '../shared/utils/documentos.js';
import { DocumentacionCliente } from '../documentacioncliente/documentacioncliente.entity.js';

const em = orm.em;

type AuthRequest = Request & { user?: { sub?: number; role?: string } };

function usuarioAutenticado(req: Request) {
  return (req as AuthRequest).user ?? {};
}

/**
 * Devuelve la presentación del documento a nombre del cliente autenticado, o
 * null si el documento no es suyo. Es lo que habilita a un cliente a ver o
 * borrar sus propios papeles sin darle acceso a los del resto.
 */
async function presentacionPropia(documentacionId: number, clienteId?: number) {
  if (!clienteId) return null;
  return em.findOne(DocumentacionCliente, { documentacion: documentacionId, cliente: clienteId });
}

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

async function findAll(req: Request, res: Response, next: NextFunction) {
  try {
    const { sub, role } = usuarioAutenticado(req);

    // El agente ve el padrón completo; el cliente, solo lo que presentó él.
    if (role !== 'agente' && !sub) {
      return res.status(401).json({ message: 'No autorizado', data: [] });
    }
    const filtro = role === 'agente' ? {} : { clientes: { cliente: sub } };

    const documentaciones = await em.find(Documentacion, filtro, {
      populate: ['clientes', 'clientes.cliente'],
    });
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
 * `express.static`: pasan por acá, que exige token y comprueba quién pide.
 * Lo bajan el agente (revisa) y el cliente dueño (verifica qué mandó).
 */
async function descargar(req: Request, res: Response, next: NextFunction) {
  try {
    const { sub, role } = usuarioAutenticado(req);
    const id = Number(req.params.id);

    if (role !== 'agente' && !(await presentacionPropia(id, sub))) {
      throw new HttpError(
        403,
        'No podés descargar documentación de otro cliente',
        [{ path: 'general', message: 'No podés descargar documentación de otro cliente' }],
        'AUTH_ERROR',
      );
    }

    const documentacion = await em.findOneOrFail(Documentacion, { id });
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
    const id = Number(req.params.id);
    const { sub, role } = usuarioAutenticado(req);

    // Un cliente puede retirar un papel suyo mientras nadie lo haya aprobado;
    // una vez aprobado es respaldo del contrato y solo lo saca el agente.
    if (role !== 'agente') {
      const propia = await presentacionPropia(id, sub);
      if (!propia) {
        throw new HttpError(
          403,
          'No podés eliminar documentación de otro cliente',
          [{ path: 'general', message: 'No podés eliminar documentación de otro cliente' }],
          'AUTH_ERROR',
        );
      }
      if (propia.estado === 'aprobada') {
        throw new HttpError(
          409,
          'La documentación ya fue aprobada: pedile al agente que la dé de baja',
          [{ path: 'estado', message: 'La documentación ya fue aprobada' }],
          'BUSINESS_RULE_ERROR',
        );
      }
    }

    // La colección tiene que venir inicializada para que `orphanRemoval` borre
    // las filas de `documentacion_cliente`; si no, la FK rechaza el DELETE.
    const documentacionToRemove = await em.findOneOrFail(
      Documentacion,
      { id },
      { populate: ['clientes'] },
    );
    borrarArchivo(CARPETA, documentacionToRemove.path);
    await em.removeAndFlush(documentacionToRemove);
    res.status(200).json({ message: 'documentacion deleted', data: documentacionToRemove });
  } catch (error) {
    next(error);
  }
}

export { findAll, findOne, add, update, descargar, remove };
