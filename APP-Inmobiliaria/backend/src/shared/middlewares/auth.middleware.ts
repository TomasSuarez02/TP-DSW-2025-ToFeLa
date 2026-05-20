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
