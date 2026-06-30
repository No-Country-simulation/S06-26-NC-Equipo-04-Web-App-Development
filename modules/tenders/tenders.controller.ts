import { Request, Response } from 'express';
import { asyncHandler } from '../../infrastructure/middleware/error.middleware';
import * as tendersService from './tenders.service';

export const create = asyncHandler(async (req: Request, res: Response) => {
  const tender = await tendersService.createTender(req.body, req.user!.id);
  res.status(201).json({ success: true, data: tender, message: 'Licitación creada exitosamente' });
});

export const list = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, state, search } = req.query;
  const result = await tendersService.getTenders({
    page: page ? parseInt(page as string) : undefined,
    limit: limit ? parseInt(limit as string) : undefined,
    state: state as any,
    search: search as string,
  });
  res.status(200).json({ success: true, data: result });
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  const tender = await tendersService.getTenderById(req.params.id as string);
  res.status(200).json({ success: true, data: tender });
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const tender = await tendersService.updateTender(req.params.id as string, req.body, req.user!.id);
  res.status(200).json({ success: true, data: tender, message: 'Licitación actualizada' });
});

export const publish = asyncHandler(async (req: Request, res: Response) => {
  const tender = await tendersService.publishTender(req.params.id as string, req.user!.id);
  res.status(200).json({ success: true, data: tender, message: 'Licitación publicada exitosamente' });
});

export const close = asyncHandler(async (req: Request, res: Response) => {
  const tender = await tendersService.closeTender(req.params.id as string, req.user!.id);
  res.status(200).json({ success: true, data: tender, message: 'Licitación cerrada' });
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  await tendersService.deleteTender(req.params.id as string, req.user!.id);
  res.status(204).json({ success: true, message: 'Licitación eliminada' });
});

export const myTenders = asyncHandler(async (req: Request, res: Response) => {
  const result = await tendersService.getTenders({
    userId: req.user!.id,
    page: req.query.page ? parseInt(req.query.page as string) : undefined,
    limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
  });
  res.status(200).json({ success: true, data: result.data });
});
