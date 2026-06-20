import { Router } from 'express';
import { body } from 'express-validator';
import * as stagesController from './stages.controller';
import { authenticate, authorize } from '../../infrastructure/middleware/auth.middleware';
import { validate } from '../../infrastructure/middleware/validate.middleware';

const router = Router({ mergeParams: true });

const stageValidation = [
  body('stageType').isIn(['CONVOCATORIA', 'CONSULTAS', 'POSTULACION', 'EVALUACION', 'RESULTADOS'])
    .withMessage('Tipo de etapa inválido'),
  body('name').notEmpty().withMessage('El nombre es requerido'),
  body('startDate').isISO8601().withMessage('Fecha de inicio inválida (use ISO8601)'),
  body('endDate').isISO8601().withMessage('Fecha de fin inválida (use ISO8601)'),
];

/**
 * @swagger
 * /api/tenders/{id}/stages:
 *   post:
 *     summary: Agregar etapa a una licitación
 *     description: Crea una nueva etapa para la licitación (solo ENTE_PUBLICO)
 *     tags: [Tender Stages]
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateStageDTO'
 *     responses:
 *       201:
 *         description: Etapa agregada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/TenderStage'
 *                 message:
 *                   type: string
 *                   example: Etapa agregada
 *       400:
 *         description: Error de validación
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiErrorResponse'
 *       401:
 *         description: No autenticado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiErrorResponse'
 *   get:
 *     summary: Listar etapas de una licitación
 *     description: Obtiene todas las etapas asociadas a una licitación
 *     tags: [Tender Stages]
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
 *         description: Listado de etapas
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/TenderStage'
 *       404:
 *         description: Licitación no encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiErrorResponse'
 */
router.post('/', authenticate, authorize('ENTE_PUBLICO'), validate(stageValidation), stagesController.create);
router.get('/', stagesController.list);

/**
 * @swagger
 * /api/tenders/{id}/stages/{stageId}:
 *   put:
 *     summary: Actualizar etapa
 *     description: Actualiza los datos de una etapa (solo ENTE_PUBLICO)
 *     tags: [Tender Stages]
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
 *         name: stageId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID de la etapa
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateStageDTO'
 *     responses:
 *       200:
 *         description: Etapa actualizada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/TenderStage'
 *                 message:
 *                   type: string
 *                   example: Etapa actualizada
 *       401:
 *         description: No autenticado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiErrorResponse'
 *       403:
 *         description: No autorizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiErrorResponse'
 *       404:
 *         description: Etapa no encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiErrorResponse'
 *   delete:
 *     summary: Eliminar etapa
 *     description: Elimina una etapa de la licitación (solo ENTE_PUBLICO)
 *     tags: [Tender Stages]
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
 *         name: stageId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID de la etapa
 *     responses:
 *       204:
 *         description: Etapa eliminada (sin contenido)
 *       401:
 *         description: No autenticado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiErrorResponse'
 *       403:
 *         description: No autorizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiErrorResponse'
 *       404:
 *         description: Etapa no encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiErrorResponse'
 */
router.put('/:stageId', authenticate, authorize('ENTE_PUBLICO'), validate(stageValidation), stagesController.update);
router.delete('/:stageId', authenticate, authorize('ENTE_PUBLICO'), stagesController.remove);

export default router;
