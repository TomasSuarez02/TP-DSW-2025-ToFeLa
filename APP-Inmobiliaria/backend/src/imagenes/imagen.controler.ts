import { Request, Response, NextFunction } from 'express'
import { Imagen } from './imagen.entity.js'
import { orm } from '../shared/db/orm.js'
import fs from 'fs'
import path from 'path'

const em = orm.em;

function sanitizeImagenInput(req: Request, res: Response, next: NextFunction) {
  req.body.sanitizedInput = {
    propiedad: req.body.propiedad,
    base64: req.body.base64,
    filename: req.body.filename,
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
      const imagenes = await em.find(
        Imagen,
        {},
        { populate: ['propiedad'] }
      );
      res.status(200).json({ message: 'found all imagenes', data: imagenes });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
}

async function findOne(req: Request, res: Response) {
  try {
      const id = req.params.id;
      const imagen = await em.findOneOrFail(
        Imagen,
        { id: Number(id) },
        { populate: ['propiedad'] }
      );
      res.status(200).json({ message: 'found imagen', data: imagen });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
}

async function add(req: Request, res: Response) {
  try {
    // ✅ Usar directamente req.body 
    const { propiedad, base64, filename } = req.body;

    if (!base64 || !filename) {
      return res.status(400).json({ message: 'Falta la imagen o el nombre del archivo' });
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

    // Guardar referencia en BD
    const imagen = em.create(Imagen, {
      propiedad,
      path: `/images/${filename}`
    });
    await em.flush();

    res.status(201).json({ message: 'Imagen creada y guardada', data: imagen });
  } catch (error: any) {
    console.error('Error al crear imagen:', error);
    res.status(500).json({ message: error.message });
  }
}

async function update(req: Request, res: Response) {
  try {
    const id = req.params.id;
    const imagenToUpdate = await em.findOneOrFail(Imagen, { id: Number(id) });
    em.assign(imagenToUpdate, req.body.sanitizedInput);
    await em.flush();
    res.status(200).json({ message: 'imagen updated', data: imagenToUpdate });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

async function remove(req: Request, res: Response) {
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
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

export { sanitizeImagenInput, findAll, findOne, add, update, remove };
