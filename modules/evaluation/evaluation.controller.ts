import { Request, Response } from 'express';
import { asyncHandler } from '../../infrastructure/middleware/error.middleware';
import * as evaluationService from './evaluation.service';

export const evaluate = asyncHandler(async (req: Request, res: Response) => {
  const result = await evaluationService.evaluateProposals(req.params.id, req.user!.id);
  res.status(200).json({ success: true, data: result, message: 'Evaluación completada' });
});

export const ranking = asyncHandler(async (req: Request, res: Response) => {
  const result = await evaluationService.getRanking(req.params.id, req.user!.id);
  res.status(200).json({ success: true, data: result });
});

export const award = asyncHandler(async (req: Request, res: Response) => {
  const result = await evaluationService.awardProposal(
    req.params.id,
    req.params.proposalId,
    req.user!.id
  );
  res.status(200).json({ success: true, data: result, message: 'Propuesta adjudicada exitosamente' });
});

export const setExperience = asyncHandler(async (req: Request, res: Response) => {
  const { yearsExperience } = req.body;
  await evaluationService.setExperienceScore(req.params.proposalId, yearsExperience, req.user!.id);
  res.status(200).json({ success: true, message: 'Puntaje de experiencia actualizado' });
});
