import { NextFunction, Request, Response } from 'express'
import { Propiedad } from './propiedad.entity.js'
import { orm } from '../shared/db/orm.js'
import { estadoPropiedad } from '../shared/db/estados.js'
import { expirarSeniasVencidas } from '../senia/senia.rules.js'
import type { DescripcionEstadoPropiedad } from '../estadopropiedad/estadopropiedad.entity.js'
import fs from 'fs'
import path from 'path'

const em = orm.em;

const POPULATE_PROPIEDAD = [
  'estadoPropiedad',
  'tipoPropiedad',
  'inmobiliaria',
  'imagenes',
] as const satisfies readonly string[]

/**
 * La API sigue recibiendo y devolviendo `estado` como texto ('disponible',
 * 'señada', ...); acá se traduce a la fila de EstadoPropiedad que corresponde.
 */
async function separarEstado(input: Record<string, unknown>) {
  const { estado, ...resto } = input
  if (estado === undefined) {
    return { datos: resto, estadoEntity: undefined }
  }

  return {
    datos: resto,
    estadoEntity: await estadoPropiedad(em, estado as DescripcionEstadoPropiedad),
  }
}

async function findAll(req: Request, res: Response, next: NextFunction) {
  try {
      // El catálogo es la vista donde importa que una seña vencida ya no
      // retenga la propiedad, así que se barre antes de listar.
      await expirarSeniasVencidas(em);
      const propiedades = await em.find(Propiedad, {}, { populate: [...POPULATE_PROPIEDAD] });
      res.status(200).json({ message: 'found all propiedades', data: propiedades });
    } catch (error) {
      next(error);
    }
}

async function findOne(req: Request, res: Response, next: NextFunction) {
  try {
      const id = req.params.id;
      await expirarSeniasVencidas(em);
      const propiedad = await em.findOneOrFail(
        Propiedad,
        { id: Number(id) },
        { populate: [...POPULATE_PROPIEDAD] }
      );
      res.status(200).json({ message: 'found propiedad', data: propiedad });
    } catch (error) {
      next(error);
    }
}

async function add(req: Request, res: Response, next: NextFunction) {
  try {
      const { datos, estadoEntity } = await separarEstado(req.body.sanitizedInput);
      const propiedad = em.create(Propiedad, {
        ...datos,
        estadoPropiedad: estadoEntity ?? (await estadoPropiedad(em, 'disponible')),
      } as any);
      await em.flush();
      await em.populate(propiedad, [...POPULATE_PROPIEDAD]);
      res.status(201).json({ message: 'propiedad created', data: propiedad });
    } catch (error) {
      next(error);
    }
}

async function update(req: Request, res: Response, next: NextFunction) {
  try {
      const id = req.params.id;
      const propiedadToUpdate = await em.findOneOrFail(
        Propiedad,
        { id: Number(id) },
        { populate: [...POPULATE_PROPIEDAD] }
      );

      const { datos, estadoEntity } = await separarEstado(req.body.sanitizedInput);
      em.assign(propiedadToUpdate, datos);
      if (estadoEntity) {
        propiedadToUpdate.estadoPropiedad = estadoEntity;
      }

      await em.flush();
      res.status(200).json({ message: 'propiedad updated', data: propiedadToUpdate });
    } catch (error) {
      next(error);
    }
}

async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id;
    const propiedad = await em.findOneOrFail(
      Propiedad,
      { id: Number(id) },
      { populate: ['imagenes'] }
    );

    // Eliminar imágenes solo si existen
    if (propiedad.imagenes && propiedad.imagenes.length > 0) {
      for (const imagen of propiedad.imagenes.getItems()) {
        try {
          // Eliminar archivo físico si existe
          const fileName = imagen.path.split('/').pop();
          if (fileName) {
            const filePath = path.join(process.cwd(), 'uploads/images', fileName);
            if (fs.existsSync(filePath)) {
              fs.unlinkSync(filePath);
            }
          }

          em.remove(imagen);
        } catch (imgError) {
          console.error('Error al eliminar imagen:', imgError);
          // Continuar con las demás imágenes
        }
      }
    }

    em.remove(propiedad);
    await em.flush();

    res.status(200).json({ message: 'Propiedad eliminada correctamente' });
  } catch (error) {
    console.error('Error al eliminar propiedad:', error);
    next(error);
  }
}

export { findAll, findOne, add, update, remove };
