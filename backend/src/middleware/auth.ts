import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from '../utils/AppError';

export interface JwtPayload {
  userId: string;
  isAdmin: boolean;
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

function extractUser(req: Request): JwtPayload {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) throw new AppError('No autenticado', 401);
  const token = header.slice(7);
  try {
    return jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
  } catch {
    throw new AppError('Token inválido o expirado', 401);
  }
}

export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  try {
    req.user = extractUser(req);
    next();
  } catch (err) {
    next(err);
  }
}

export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) {
    try {
      req.user = jwt.verify(header.slice(7), process.env.JWT_SECRET!) as JwtPayload;
    } catch {
      // Token inválido → ignorar, continuar como invitado
    }
  }
  next();
}

export function requireAdmin(req: Request, _res: Response, next: NextFunction): void {
  try {
    req.user = extractUser(req);
    if (!req.user.isAdmin) throw new AppError('Acceso denegado', 403);
    next();
  } catch (err) {
    next(err);
  }
}
