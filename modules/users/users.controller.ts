import { Request, Response } from 'express';
import { asyncHandler } from '../../infrastructure/middleware/error.middleware';
import * as usersService from './users.service';

export const list = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, role } = req.query;
  const result = await usersService.getUsers({
    page: page ? parseInt(page as string) : undefined,
    limit: limit ? parseInt(limit as string) : undefined,
    role: role as string,
  });
  res.status(200).json({ success: true, ...result });
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  if (req.user!.id !== req.params.id) {
    res.status(403).json({ success: false, error: 'No tienes permisos para ver este perfil' });
    return;
  }
  const user = await usersService.getUserById(req.params.id as string);
  res.status(200).json({ success: true, data: user });
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const user = await usersService.updateUser(req.params.id as string, req.body, req.user!.id);
  res.status(200).json({ success: true, data: user, message: 'Usuario actualizado exitosamente' });
});
