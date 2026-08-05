import { NextFunction, Request, Response } from 'express';
import jwt, { type JwtPayload } from 'jsonwebtoken';
import { HttpError } from '../errors/http.error.js';

export interface AuthPayload {
  sub: number;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

const JWT_SECRET = process.env.JWT_SECRET || 'secret';

/**
 * Deja `req.user` si vino un token válido, pero no exige que venga.
 * Sirve para rutas públicas que muestran datos extra a un agente logueado:
 * el catálogo de propiedades es público, pero solo el agente puede ver quién
 * tiene tomada cada una.
 */
export function attachUserIfPresent(req: Request, _res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[0] === 'Bearer' ? authHeader.split(' ')[1] : undefined;
  if (!token) return next();

  try {
    const verified = jwt.verify(token, JWT_SECRET);
    if (verified && typeof verified === 'object' && !Array.isArray(verified)) {
      const payload = verified as JwtPayload & AuthPayload;
      if (typeof payload.sub === 'number' && typeof payload.role === 'string') {
        (req as Request & { user?: AuthPayload }).user = payload;
      }
    }
  } catch {
    // Token inválido en una ruta pública: se sigue como anónimo.
  }

  next();
}

/**
 * Exige que el token traiga alguno de los roles indicados.
 * Va siempre después de `authenticateToken`, que es quien deja `req.user`.
 */
export function requireRole(...roles: string[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const { role } = (req as Request & { user?: AuthPayload }).user ?? {};
    if (!role || !roles.includes(role)) {
      return next(
        new HttpError(
          403,
          'No tenés permisos para esta operación',
          [{ path: 'general', message: 'No tenés permisos para esta operación' }],
          'AUTH_ERROR',
        ),
      );
    }
    next();
  };
}

/**
 * Atajo para el backoffice: token válido + rol de agente.
 * Express acepta un array de middlewares donde espera uno solo.
 */
export const soloAgente = [authenticateToken, requireRole('agente')];

export function authenticateToken(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[0] === 'Bearer' ? authHeader.split(' ')[1] : undefined;

  if (!token) {
    return next(new HttpError(401, 'Token de acceso faltante', [{ path: 'authorization', message: 'Token de acceso faltante' }], 'AUTH_ERROR'));
  }

  try {
    const verified = jwt.verify(token, JWT_SECRET);
    if (!verified || typeof verified !== 'object' || Array.isArray(verified)) {
      throw new Error('Payload inválido');
    }

    const payload = verified as JwtPayload & AuthPayload;
    if (typeof payload.sub !== 'number' || typeof payload.email !== 'string' || typeof payload.role !== 'string') {
      throw new Error('Payload inválido');
    }

    (req as Request & { user?: AuthPayload }).user = payload;
    next();
  } catch (error) {
    return next(new HttpError(401, 'Token inválido', [{ path: 'authorization', message: 'Token inválido' }], 'AUTH_ERROR'));
  }
}
