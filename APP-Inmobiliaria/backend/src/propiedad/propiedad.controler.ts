import { NextFunction, Request, Response } from 'express'
import { wrap } from '@mikro-orm/core'
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
 * Para el agente se agrega quién tiene tomada la propiedad. No va en el
 * populate por defecto porque este endpoint es público (alimenta el catálogo):
 * los nombres de los clientes solo se exponen a un agente autenticado.
 */
const POPULATE_OCUPACION = [
  ...POPULATE_PROPIEDAD,
  'senias',
  'senias.cliente',
  'alquileres',
  'alquileres.cliente',
  'alquileres.estadoAlquiler',
] as const satisfies readonly string[]

type AuthRequest = Request & { user?: { sub?: number; role?: string } }

function esAgente(req: Request): boolean {
  return (req as AuthRequest).user?.role === 'agente'
}

/**
 * Explica por qué una propiedad no está disponible: quién la tiene y desde
 * cuándo. Devuelve null si el estado no responde a ninguna seña ni alquiler
 * registrado — que es justamente lo que hay que poder distinguir.
 */
function calcularOcupacion(propiedad: Propiedad) {
  const nombre = (cliente: { nombre?: string; apellido?: string; id?: number }) =>
    `${cliente.nombre ?? ''} ${cliente.apellido ?? ''}`.trim() || `#${cliente.id}`

  if (propiedad.estado === 'alquilada') {
    const alquiler = propiedad.alquileres
      .getItems()
      .filter((a) => a.estado === 'confirmado')
      .sort((a, b) => b.fecha_hora_firma.getTime() - a.fecha_hora_firma.getTime())[0]

    if (!alquiler) return null
    return {
      origen: 'alquiler' as const,
      cliente: { id: alquiler.cliente.id, nombre: nombre(alquiler.cliente) },
      desde: alquiler.fecha_inicio,
      hasta: alquiler.fecha_fin,
    }
  }

  if (propiedad.estado === 'señada') {
    const senia = propiedad.senias
      .getItems()
      .filter((s) => s.estado === 'confirmada')
      .sort((a, b) => b.fecha_hora_senia.getTime() - a.fecha_hora_senia.getTime())[0]

    if (!senia) return null
    return {
      origen: 'senia' as const,
      cliente: { id: senia.cliente.id, nombre: nombre(senia.cliente) },
      desde: senia.fecha_hora_senia,
      hasta: senia.fechaVencimiento ?? null,
    }
  }

  return null
}

/** Serializa la propiedad agregando `ocupacion` solo si el pedido es de un agente. */
function serializar(propiedad: Propiedad) {
  return { ...wrap(propiedad).toJSON(), ocupacion: calcularOcupacion(propiedad) }
}

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
      const agente = esAgente(req);
      const propiedades = await em.find(
        Propiedad,
        {},
        { populate: [...(agente ? POPULATE_OCUPACION : POPULATE_PROPIEDAD)] },
      );
      res.status(200).json({
        message: 'found all propiedades',
        data: agente ? propiedades.map(serializar) : propiedades,
      });
    } catch (error) {
      next(error);
    }
}

async function findOne(req: Request, res: Response, next: NextFunction) {
  try {
      const id = req.params.id;
      await expirarSeniasVencidas(em);
      const agente = esAgente(req);
      const propiedad = await em.findOneOrFail(
        Propiedad,
        { id: Number(id) },
        { populate: [...(agente ? POPULATE_OCUPACION : POPULATE_PROPIEDAD)] }
      );
      res.status(200).json({
        message: 'found propiedad',
        data: agente ? serializar(propiedad) : propiedad,
      });
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
