import { NextFunction, Request, Response } from 'express';
import { orm } from '../shared/db/orm.js'
import { Senia } from './senia.entity.js';
import { Propiedad } from '../propiedad/propiedad.entity.js';
import { Cliente } from '../cliente/cliente.entity.js';
import { HttpError } from '../shared/errors/http.error.js';
import { parsearClave } from '../shared/db/clave-compuesta.js';
import {
  ESTADOS_SENIA_ACTIVOS,
  calcularFechaVencimiento,
  calcularSeniaMinima,
  expirarSeniasVencidas,
  liberarPropiedad,
  senarPropiedad,
  type EstadoSenia,
} from './senia.rules.js';

const em = orm.em;

/** Relaciones que el frontend necesita en cada seña. */
const POPULATE_SENIA = [
  'propiedad',
  'propiedad.estadoPropiedad',
  'cliente',
  'pago',
] as const satisfies readonly string[];

type AuthRequest = Request & { user?: { sub?: number; role?: string } };

function usuarioAutenticado(req: Request) {
  return (req as AuthRequest).user ?? {};
}

/** Resuelve la seña identificada por la clave compuesta de la URL. */
async function buscarPorClave(clave: string) {
  const parsed = parsearClave(clave);
  if (!parsed) {
    throw new HttpError(
      400,
      'La clave de la seña es inválida',
      [{ path: 'clave', message: 'La clave de la seña es inválida' }],
      'VALIDATION_ERROR',
    );
  }

  return em.findOneOrFail(
    Senia,
    {
      propiedad: parsed.propiedad,
      cliente: parsed.cliente,
      fecha_hora_senia: parsed.fecha,
    },
    { populate: [...POPULATE_SENIA] },
  );
}

async function findAll(req: Request, res: Response, next: NextFunction) {
  try {
      await expirarSeniasVencidas(em);
      const senias = await em.find(Senia, {}, { populate: [...POPULATE_SENIA] });
      res.status(200).json({ message: 'found all senias', data: senias });
    } catch (error) {
      next(error);
    }
}

async function findOne(req: Request, res: Response, next: NextFunction) {
  try {
      await expirarSeniasVencidas(em);
      const senia = await buscarPorClave(req.params.clave);

      // Un cliente solo puede ver sus propias señas; el agente las ve todas.
      const { sub: usuarioId, role } = usuarioAutenticado(req);
      if (role === 'cliente' && senia.cliente.id !== usuarioId) {
        throw new HttpError(
          403,
          'La seña pertenece a otro cliente',
          [{ path: 'general', message: 'La seña pertenece a otro cliente' }],
          'AUTH_ERROR',
        );
      }

      res.status(200).json({ message: 'found senia', data: senia });
    } catch (error) {
      next(error);
    }
}

async function add(req: Request, res: Response, next: NextFunction) {
  try {
      const { propiedad, cliente, importe, estado } = req.body.sanitizedInput;
      const propiedadEntity = await em.findOneOrFail(Propiedad, { id: Number(propiedad) });
      const clienteEntity = await em.findOneOrFail(Cliente, { id: Number(cliente) });

      const senia = em.create(Senia, {
        propiedad: propiedadEntity,
        cliente: clienteEntity,
        fecha_hora_senia: new Date(),
        importe: Number(importe),
        estado: (estado ?? 'pendiente_pago') as EstadoSenia,
      });

      await em.flush();
      await em.populate(senia, [...POPULATE_SENIA]);
      res.status(201).json({ message: 'senia created', data: senia });
    } catch (error) {
      next(error);
    }
}

/**
 * Crea la seña del cliente autenticado. Queda en `pendiente_pago`: la propiedad
 * no se seña hasta que el pago se aprueba (ver pago.controler.ts).
 */
async function createForClient(req: Request, res: Response, next: NextFunction) {
  try {
      const { sub: clientId, role } = usuarioAutenticado(req);

      if (!clientId || role !== 'cliente') {
        throw new HttpError(
          403,
          'Solo un cliente puede señar una propiedad',
          [{ path: 'general', message: 'Solo un cliente puede señar una propiedad' }],
          'AUTH_ERROR',
        );
      }

      const { propiedad, importe } = req.body.sanitizedInput;

      const propiedadEntity = await em.findOneOrFail(
        Propiedad,
        { id: Number(propiedad) },
        { populate: ['estadoPropiedad'] },
      );
      if (propiedadEntity.estado !== 'disponible') {
        throw new HttpError(
          400,
          'La propiedad no está disponible para señar',
          [{ path: 'propiedad', message: 'La propiedad no está disponible para señar' }],
          'BUSINESS_RULE_ERROR',
        );
      }

      const seniaMinima = calcularSeniaMinima(propiedadEntity.precio);
      if (Number(importe) < seniaMinima) {
        throw new HttpError(
          400,
          `La seña mínima para esta propiedad es de ${seniaMinima}`,
          [{ path: 'importe', message: `La seña mínima para esta propiedad es de ${seniaMinima}` }],
          'BUSINESS_RULE_ERROR',
        );
      }

      const seniaActiva = await em.findOne(Senia, {
        propiedad: propiedadEntity.id,
        cliente: clientId,
        estado: { $in: ESTADOS_SENIA_ACTIVOS },
      });
      if (seniaActiva) {
        throw new HttpError(
          409,
          'Ya tenés una seña en curso para esta propiedad',
          [{ path: 'propiedad', message: 'Ya tenés una seña en curso para esta propiedad' }],
          'BUSINESS_RULE_ERROR',
        );
      }

      const clienteEntity = await em.findOneOrFail(Cliente, { id: clientId });

      const senia = em.create(Senia, {
        propiedad: propiedadEntity,
        cliente: clienteEntity,
        fecha_hora_senia: new Date(),
        importe: Number(importe),
        estado: 'pendiente_pago' as EstadoSenia,
      });

      await em.flush();
      await em.populate(senia, [...POPULATE_SENIA]);

      res.status(201).json({ message: 'senia created', data: senia });
    } catch (error) {
      next(error);
    }
}

async function update(req: Request, res: Response, next: NextFunction) {
  try {
      const seniaToUpdate = await buscarPorClave(req.params.clave)
      // La PK es inmutable: solo se actualizan los atributos no identificatorios.
      const { propiedad: _p, cliente: _c, ...cambios } = req.body.sanitizedInput
      em.assign(seniaToUpdate, cambios)
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
      const seniaToRemove = await buscarPorClave(req.params.clave);

      // Si la seña estaba reteniendo la propiedad, al borrarla vuelve al mercado.
      if (seniaToRemove.estado === 'confirmada') {
        await liberarPropiedad(em, seniaToRemove.propiedad);
      }

      await em.removeAndFlush(seniaToRemove);
      res.status(200).json({ message: 'senia deleted', data: seniaToRemove });
    } catch (error) {
      next(error);
    }
}

async function findByClient(req: Request, res: Response, next: NextFunction) {
  try {
      const { sub: clientId } = usuarioAutenticado(req);
      if (!clientId) {
        return res.status(401).json({ message: 'No autorizado', data: [] });
      }

      await expirarSeniasVencidas(em);

      const senias = await em.find(
        Senia,
        { cliente: clientId },
        { populate: [...POPULATE_SENIA] }
      );
      res.status(200).json({ message: 'found client senias', data: senias });
    } catch (error) {
      next(error);
    }
}

/** El cliente cancela una seña propia que todavía no pagó. */
async function cancel(req: Request, res: Response, next: NextFunction) {
  try {
      const { sub: usuarioId, role } = usuarioAutenticado(req);
      const senia = await buscarPorClave(req.params.clave);

      if (role === 'cliente' && senia.cliente.id !== usuarioId) {
        throw new HttpError(
          403,
          'La seña pertenece a otro cliente',
          [{ path: 'general', message: 'La seña pertenece a otro cliente' }],
          'AUTH_ERROR',
        );
      }

      if (senia.estado !== 'pendiente_pago') {
        throw new HttpError(
          409,
          `No se puede cancelar una seña ${senia.estado === 'confirmada' ? 'ya pagada' : senia.estado}`,
          [{ path: 'estado', message: 'Solo se puede cancelar una seña pendiente de pago' }],
          'BUSINESS_RULE_ERROR',
        );
      }

      senia.estado = 'cancelada';
      await em.flush();

      res.status(200).json({ message: 'senia cancelled', data: senia });
    } catch (error) {
      next(error);
    }
}

/** Cambio de estado manual del agente, con su efecto sobre la propiedad. */
async function changeEstado(req: Request, res: Response, next: NextFunction) {
  try {
      const { role } = usuarioAutenticado(req);
      if (role !== 'agente') {
        throw new HttpError(
          403,
          'Solo un agente puede cambiar el estado de una seña',
          [{ path: 'general', message: 'Solo un agente puede cambiar el estado de una seña' }],
          'AUTH_ERROR',
        );
      }

      const estado = req.body.sanitizedInput.estado as EstadoSenia;
      const senia = await buscarPorClave(req.params.clave);

      if (estado === 'confirmada') {
        senia.fechaVencimiento = calcularFechaVencimiento();
        if (senia.propiedad.estado === 'disponible') {
          await senarPropiedad(em, senia.propiedad);
        }
      } else {
        // vencida o cancelada: la propiedad deja de estar retenida.
        await liberarPropiedad(em, senia.propiedad);
      }

      senia.estado = estado;
      await em.flush();

      res.status(200).json({ message: 'senia updated', data: senia });
    } catch (error) {
      next(error);
    }
}

export { findAll, findOne, add, createForClient, update, remove, findByClient, cancel, changeEstado };
