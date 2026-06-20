import { Request, Response } from 'express';
import { asyncHandler } from '../../infrastructure/middleware/error.middleware';
import * as proposalsService from './proposals.service';

export const create = asyncHandler(async (req: Request, res: Response) => {
  const proposal = await proposalsService.createProposal(req.params.id, req.user!.id);
  res.status(201).json({ success: true, data: proposal, message: 'Propuesta creada' });
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  const proposal = await proposalsService.getProposalById(req.params.proposalId, req.user?.id);
  res.status(200).json({ success: true, data: proposal });
});

export const listByTender = asyncHandler(async (req: Request, res: Response) => {
  const proposals = await proposalsService.getTenderProposals(req.params.id, req.user!.id);
  res.status(200).json({ success: true, data: proposals });
});

export const attachDocument = asyncHandler(async (req: Request, res: Response) => {
  const file = req.file;
  if (!file) {
    res.status(400).json({ success: false, error: 'No se ha subido ningún archivo' });
    return;
  }
  const { requirementId } = req.body;
  if (!requirementId) {
    res.status(400).json({ success: false, error: 'requirementId es requerido' });
    return;
  }
  const doc = await proposalsService.attachDocument(req.params.proposalId, requirementId, file, req.user!.id);
  res.status(201).json({ success: true, data: doc, message: 'Documento adjuntado' });
});

export const submit = asyncHandler(async (req: Request, res: Response) => {
  const proposal = await proposalsService.submitProposal(req.params.proposalId, req.user!.id);
  res.status(200).json({ success: true, data: proposal, message: 'Propuesta enviada exitosamente' });
});

export const disqualify = asyncHandler(async (req: Request, res: Response) => {
  const { reason } = req.body;
  const proposal = await proposalsService.disqualifyProposal(req.params.proposalId, reason || 'Descalificada', req.user!.id);
  res.status(200).json({ success: true, data: proposal, message: 'Propuesta descalificada' });
});

export const updatePrice = asyncHandler(async (req: Request, res: Response) => {
  const { price } = req.body;
  const proposal = await proposalsService.updateProposalPrice(req.params.proposalId, price, req.user!.id);
  res.status(200).json({ success: true, data: proposal, message: 'Precio actualizado' });
});

export const myProposals = asyncHandler(async (req: Request, res: Response) => {
  const proposals = await proposalsService.getMyProposals(req.user!.id);
  res.status(200).json({ success: true, data: proposals });
});

export const getDocuments = asyncHandler(async (req: Request, res: Response) => {
  const docs = await proposalsService.getProposalDocuments(req.params.proposalId);
  res.status(200).json({ success: true, data: docs });
});

export const downloadDocument = asyncHandler(async (req: Request, res: Response) => {
  const { doc, fullPath } = await proposalsService.getProposalDocumentById(req.params.docId);
  res.download(fullPath, doc.file_name);
});
