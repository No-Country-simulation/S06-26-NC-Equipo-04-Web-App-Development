import { Router } from 'express';
import { body } from 'express-validator';
import * as auditsController from './audits.controller';
import { authenticate } from '../../infrastructure/middleware/auth.middleware';
import { validate } from '../../infrastructure/middleware/validate.middleware';

const router = Router();

const auditValidation = [
  body('isValid').optional().isBoolean().withMessage('isValid debe ser booleano'),
  body('reportFile').optional().isObject().withMessage('reportFile debe ser un objeto'),
];

/**
 * @swagger
 * /api/audits/{proposalId}:
 *   get:
 *     summary: Obtener auditoría de una propuesta
 *     description: Retorna la auditoría más reciente de una propuesta
 *     tags: [Audits]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: proposalId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID de la propuesta
 *     responses:
 *       200:
 *         description: Datos de la auditoría
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Audit'
 *       404:
 *         description: Auditoría no encontrada
 *   post:
 *     summary: Ejecutar auditoría de una propuesta
 *     description: Ejecuta una auditoría automatica sobre una propuesta validando score, documentos y estado
 *     tags: [Audits]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: proposalId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID de la propuesta
 *     responses:
 *       200:
 *         description: Auditoría completada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Audit'
 *                 message:
 *                   type: string
 *       404:
 *         description: Propuesta no encontrada
 */
router.get('/:proposalId', authenticate, auditsController.getByProposal);
router.post('/:proposalId', authenticate, auditsController.run);

export default router;
