import { Request, Response, NextFunction } from 'express'
import { Propiedad } from './propiedad.entity.js'
import { orm } from '../shared/db/orm.js'
import fs from 'fs'
import path from 'path'

const em = orm.em;

function sanitizePropiedadInput(req: Request, res: Response, next: NextFunction) {
  req.body.sanitizedInput = {
    direccion: req.body.direccion,
    precio: req.body.precio,
    estado: req.body.estado,
    hora_desde: req.body.hora_desde,
    hora_hasta: req.body.hora_hasta,
    tipoPropiedad: req.body.tipoPropiedad,
    inmobiliaria: req.body.inmobiliaria,
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
      const propiedades = await em.find(
        Propiedad,
        {},
        { populate: ['tipoPropiedad', 'inmobiliaria', 'imagenes'] }
      );
      res.status(200).json({ message: 'found all propiedades', data: propiedades });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
}

async function findOne(req: Request, res: Response) {
  try {
      const id = req.params.id;
      const propiedad = await em.findOneOrFail(
        Propiedad,
        { id: Number(id) },
        { populate: ['tipoPropiedad', 'inmobiliaria', 'imagenes'] }
      );
      res.status(200).json({ message: 'found propiedad', data: propiedad });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
}

async function add(req: Request, res: Response) {
  try {
      const propiedad = em.create(Propiedad, req.body.sanitizedInput);
      await em.flush();
      res.status(201).json({ message: 'propiedad created', data: propiedad });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
}

async function update(req: Request, res: Response) {
  try {
      const id = req.params.id;
      const propiedadToUpdate = await em.findOneOrFail(Propiedad, { id: Number(id) });
      em.assign(propiedadToUpdate, req.body.sanitizedInput);
      await em.flush();
      res.status(200).json({ message: 'propiedad updated', data: propiedadToUpdate });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
}

async function remove(req: Request, res: Response) {
  try {
    const id = req.params.id;
    console.log('Intentando eliminar propiedad con ID:', id);
    
    const propiedad = await em.findOneOrFail(
      Propiedad, 
      { id: Number(id) },
      { populate: ['imagenes'] }
    );
    
    console.log('Propiedad encontrada:', propiedad);
    console.log('Imágenes asociadas:', propiedad.imagenes?.length || 0);
    
    // Eliminar imágenes solo si existen
    if (propiedad.imagenes && propiedad.imagenes.length > 0) {
      const imagenesArray = propiedad.imagenes.getItems();
      console.log('Eliminando', imagenesArray.length, 'imágenes');
      
      for (const imagen of imagenesArray) {
        try {
          // Eliminar archivo físico si existe
          const fileName = imagen.path.split('/').pop();
          if (fileName) {
            const filePath = path.join(process.cwd(), 'uploads/images', fileName);
            if (fs.existsSync(filePath)) {
              fs.unlinkSync(filePath);
              console.log('Archivo eliminado:', filePath);
            }
          }
          
          // Eliminar de BD
          em.remove(imagen);
        } catch (imgError) {
          console.error('Error al eliminar imagen:', imgError);
          // Continuar con las demás imágenes
        }
      }
    }
    
    // ✅ Eliminar la propiedad
    em.remove(propiedad);
    await em.flush();
    
    console.log('Propiedad eliminada correctamente');
    res.status(200).json({ message: 'Propiedad eliminada correctamente' });
  } catch (error: any) {
    console.error('Error al eliminar propiedad:', error);
    res.status(500).json({ message: error.message });
  }
}

export { sanitizePropiedadInput, findAll, findOne, add, update, remove };
