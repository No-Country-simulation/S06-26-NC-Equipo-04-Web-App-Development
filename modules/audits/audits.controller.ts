import { Request, Response } from 'express';
import { asyncHandler } from '../../infrastructure/middleware/error.middleware';
import * as auditsService from './audits.service';

export const getByProposal = asyncHandler(async (req: Request, res: Response) => {
  const audit = await auditsService.getAuditByProposal(req.params.proposalId as string);
  if (!audit) {
    return res.status(404).json({ success: false, error: 'No se encontró auditoría para esta propuesta' });
  }
  res.status(200).json({ success: true, data: audit });
});

export const run = asyncHandler(async (req: Request, res: Response) => {
  const audit = await auditsService.runAudit(req.params.proposalId as string);
  res.status(200).json({ success: true, data: audit, message: 'Auditoría completada exitosamente' });
});
