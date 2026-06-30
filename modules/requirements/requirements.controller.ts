import { Request, Response } from 'express';
import { asyncHandler } from '../../infrastructure/middleware/error.middleware';
import * as requirementsService from './requirements.service';

export const create = asyncHandler(async (req: Request, res: Response) => {
  const reqItem = await requirementsService.addRequirement(req.params.id as string, req.body, req.user!.id);
  res.status(201).json({ success: true, data: reqItem, message: 'Requisito agregado' });
});

export const list = asyncHandler(async (req: Request, res: Response) => {
  const requirements = await requirementsService.getRequirements(req.params.id as string);
  res.status(200).json({ success: true, data: requirements });
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  await requirementsService.deleteRequirement(req.params.id as string, req.params.reqId as string, req.user!.id);
  res.status(204).json({ success: true, message: 'Requisito eliminado' });
});
