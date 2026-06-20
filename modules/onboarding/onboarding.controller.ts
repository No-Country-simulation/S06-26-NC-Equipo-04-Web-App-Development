import { Request, Response } from 'express';
import { asyncHandler } from '../../infrastructure/middleware/error.middleware';
import * as onboardingService from './onboarding.service';

export const validateRuc = asyncHandler(async (req: Request, res: Response) => {
  const { ruc } = req.body;
  const result = await onboardingService.validateRuc(ruc);
  res.status(200).json({ success: true, data: result });
});

export const validateDni = asyncHandler(async (req: Request, res: Response) => {
  const { dni } = req.body;
  const result = await onboardingService.validateDni(dni);
  res.status(200).json({ success: true, data: result });
});

export const checkOsce = asyncHandler(async (req: Request, res: Response) => {
  const { ruc } = req.body;
  const result = await onboardingService.checkOsce(ruc);
  res.status(200).json({ success: true, data: result });
});

export const checkRnp = asyncHandler(async (req: Request, res: Response) => {
  const { ruc } = req.body;
  const result = await onboardingService.checkRnp(ruc);
  res.status(200).json({ success: true, data: result });
});

export const getStatus = asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.params;
  // En MVP, el estado se consulta contra el usuario en BD
  // Por ahora retornamos un status genérico
  res.status(200).json({
    success: true,
    data: {
      userId,
      completed: true,
      steps: ['RUC', 'DNI', 'OSCE', 'RNP'],
      allPassed: true,
    },
  });
});

export const runFull = asyncHandler(async (req: Request, res: Response) => {
  const { ruc, dni } = req.body;
  const result = await onboardingService.runFullOnboarding(ruc, dni);
  res.status(200).json({ success: true, data: result });
});

export const completeOnboarding = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  await onboardingService.completeOnboarding(userId);
  res.status(200).json({ success: true, message: 'Proveedor validado exitosamente' });
});
