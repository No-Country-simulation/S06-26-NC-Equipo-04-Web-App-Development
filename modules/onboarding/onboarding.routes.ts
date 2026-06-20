import { Router } from 'express';
import { body } from 'express-validator';
import * as onboardingController from './onboarding.controller';
import { validate } from '../../infrastructure/middleware/validate.middleware';
import { authenticate } from '../../infrastructure/middleware/auth.middleware';

const router = Router();

const rucValidation = [
  body('ruc').matches(/^\d{11}$/).withMessage('El RUC debe tener 11 dígitos'),
];

const dniValidation = [
  body('dni').matches(/^\d{8}$/).withMessage('El DNI debe tener 8 dígitos'),
];

/**
 * @swagger
 * /api/onboarding/validate-ruc:
 *   post:
 *     summary: Validar RUC
 *     description: Valida un número de RUC contra SUNAT
 *     tags: [Onboarding]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RucDTO'
 *     responses:
 *       200:
 *         description: Resultado de validación de RUC
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     valid:
 *                       type: boolean
 *                     detail:
 *                       type: string
 *       400:
 *         description: RUC inválido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiErrorResponse'
 */
router.post('/validate-ruc', validate(rucValidation), onboardingController.validateRuc);

/**
 * @swagger
 * /api/onboarding/validate-dni:
 *   post:
 *     summary: Validar DNI
 *     description: Valida un número de DNI contra RENIEC
 *     tags: [Onboarding]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DniDTO'
 *     responses:
 *       200:
 *         description: Resultado de validación de DNI
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     valid:
 *                       type: boolean
 *                     detail:
 *                       type: string
 *       400:
 *         description: DNI inválido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiErrorResponse'
 */
router.post('/validate-dni', validate(dniValidation), onboardingController.validateDni);

/**
 * @swagger
 * /api/onboarding/check-osce:
 *   post:
 *     summary: Verificar OSCE
 *     description: Verifica si el proveedor tiene registro limpio en OSCE
 *     tags: [Onboarding]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RucDTO'
 *     responses:
 *       200:
 *         description: Resultado de verificación OSCE
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *       400:
 *         description: RUC inválido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiErrorResponse'
 */
router.post('/check-osce', validate(rucValidation), onboardingController.checkOsce);

/**
 * @swagger
 * /api/onboarding/check-rnp:
 *   post:
 *     summary: Verificar RNP
 *     description: Verifica si el proveedor está registrado en el Registro Nacional de Proveedores
 *     tags: [Onboarding]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RucDTO'
 *     responses:
 *       200:
 *         description: Resultado de verificación RNP
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *       400:
 *         description: RUC inválido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiErrorResponse'
 */
router.post('/check-rnp', validate(rucValidation), onboardingController.checkRnp);

/**
 * @swagger
 * /api/onboarding/full:
 *   post:
 *     summary: Ejecutar onboarding completo
 *     description: Ejecuta todas las validaciones (RUC, DNI, OSCE, RNP) en una sola llamada
 *     tags: [Onboarding]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/FullOnboardingDTO'
 *     responses:
 *       200:
 *         description: Resultado del onboarding completo
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/OnboardingResult'
 *       400:
 *         description: Datos inválidos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiErrorResponse'
 */
router.post('/full', validate([...rucValidation, ...dniValidation]), onboardingController.runFull);

/**
 * @swagger
 * /api/onboarding/status/{userId}:
 *   get:
 *     summary: Obtener estado del onboarding
 *     description: Retorna el estado actual del proceso de onboarding para un usuario
 *     tags: [Onboarding]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID del usuario
 *     responses:
 *       200:
 *         description: Estado del onboarding
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/OnboardingStatus'
 *       404:
 *         description: Usuario no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiErrorResponse'
 */
router.get('/status/:userId', onboardingController.getStatus);
router.post('/complete', authenticate, onboardingController.completeOnboarding);

export default router;
