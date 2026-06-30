import { Request, Response } from 'express';
import { asyncHandler } from '../../infrastructure/middleware/error.middleware';
import * as stagesService from './stages.service';

export const create = asyncHandler(async (req: Request, res: Response) => {
  const stage = await stagesService.addStage(req.params.id as string, req.body, req.user!.id);
  res.status(201).json({ success: true, data: stage, message: 'Etapa agregada' });
});

export const list = asyncHandler(async (req: Request, res: Response) => {
  const stages = await stagesService.getStages(req.params.id as string);
  res.status(200).json({ success: true, data: stages });
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const stage = await stagesService.updateStage(req.params.id as string, req.params.stageId as string, req.body, req.user!.id);
  res.status(200).json({ success: true, data: stage, message: 'Etapa actualizada' });
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  await stagesService.deleteStage(req.params.id as string, req.params.stageId as string, req.user!.id);
  res.status(204).json({ success: true, message: 'Etapa eliminada' });
});
