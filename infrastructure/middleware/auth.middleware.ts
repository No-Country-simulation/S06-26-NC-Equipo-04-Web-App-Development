import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../../core/utils/jwt';
import { AppError } from './error.middleware';
import { AuthPayload, UserRole } from '../../shared/interfaces/index';

export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new AppError('Token de autenticación requerido', 401);
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    throw new AppError('Token inválido o expirado', 401);
  }
}

export function authorize(...roles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new AppError('No autenticado', 401);
    }
    if (!roles.includes(req.user.role)) {
      throw new AppError('No tienes permisos para realizar esta acción', 403);
    }
    next();
  };
}
