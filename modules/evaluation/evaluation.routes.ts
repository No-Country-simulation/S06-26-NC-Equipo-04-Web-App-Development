import { Router } from 'express';
import { body } from 'express-validator';
import * as evaluationController from './evaluation.controller';
import { authenticate, authorize } from '../../infrastructure/middleware/auth.middleware';
import { validate } from '../../infrastructure/middleware/validate.middleware';

const router = Router({ mergeParams: true });

/**
 * @swagger
 * /api/tenders/{id}/evaluate:
 *   post:
 *     summary: Evaluar propuestas
 *     description: Ejecuta la evaluación de todas las propuestas de una licitación (solo ENTE_PUBLICO)
 *     tags: [Evaluation]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID de la licitación
 *     responses:
 *       200:
 *         description: Evaluación completada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/EvaluationResult'
 *       401:
 *         description: No autenticado
 *       403:
 *         description: No autorizado
 */
router.post('/evaluate', authenticate, authorize('ENTE_PUBLICO'), evaluationController.evaluate);

/**
 * @swagger
 * /api/tenders/{id}/ranking:
 *   get:
 *     summary: Obtener ranking de propuestas
 *     description: Retorna el ranking ordenado de propuestas evaluadas (solo ENTE_PUBLICO)
 *     tags: [Evaluation]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID de la licitación
 *     responses:
 *       200:
 *         description: Ranking de propuestas
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     tenderId:
 *                       type: string
 *                       format: uuid
 *                     ranking:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/ProviderRanking'
 *       401:
 *         description: No autenticado
 *       403:
 *         description: No autorizado
 */
router.get('/ranking', authenticate, authorize('ENTE_PUBLICO'), evaluationController.ranking);

/**
 * @swagger
 * /api/tenders/{id}/award/{proposalId}:
 *   patch:
 *     summary: Adjudicar propuesta
 *     description: Adjudica una propuesta como ganadora de la licitación (solo ENTE_PUBLICO)
 *     tags: [Evaluation]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID de la licitación
 *       - in: path
 *         name: proposalId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID de la propuesta
 *     responses:
 *       200:
 *         description: Propuesta adjudicada
 *       401:
 *         description: No autenticado
 *       403:
 *         description: No autorizado
 *       404:
 *         description: Propuesta no encontrada
 */
router.patch('/award/:proposalId', authenticate, authorize('ENTE_PUBLICO'), evaluationController.award);

/**
 * @swagger
 * /api/tenders/{id}/experience/{proposalId}:
 *   put:
 *     summary: Asignar experiencia a propuesta
 *     description: Asigna los años de experiencia validados a una propuesta (solo ENTE_PUBLICO)
 *     tags: [Evaluation]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID de la licitación
 *       - in: path
 *         name: proposalId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID de la propuesta
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SetExperienceDTO'
 *     responses:
 *       200:
 *         description: Experiencia asignada exitosamente
 *       401:
 *         description: No autenticado
 *       403:
 *         description: No autorizado
 */
router.put('/experience/:proposalId', authenticate, authorize('ENTE_PUBLICO'),
  validate([body('yearsExperience').isFloat({ min: 0 }).withMessage('Años de experiencia inválido')]),
  evaluationController.setExperience
);

export default router;
