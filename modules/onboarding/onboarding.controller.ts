import { Request, Response } from 'express';
import { asyncHandler } from '../../infrastructure/middleware/error.middleware';
import * as onboardingService from './onboarding.service';
import pool from '../../infrastructure/database/index';

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
  const result = await pool.query('SELECT provider_status FROM users WHERE id = $1', [userId]);

  if (result.rows.length === 0) {
    res.status(404).json({ success: false, error: 'Usuario no encontrado' });
    return;
  }

  const providerStatus = result.rows[0].provider_status;
  const completed = providerStatus === 'VALIDADO';

  res.status(200).json({
    success: true,
    data: {
      userId,
      providerStatus,
      completed,
      steps: ['RUC', 'DNI', 'OSCE', 'RNP'],
      allPassed: completed,
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
