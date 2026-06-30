import { Router } from 'express';
import { body } from 'express-validator';
import * as requirementsController from './requirements.controller';
import { authenticate, authorize } from '../../infrastructure/middleware/auth.middleware';
import { validate } from '../../infrastructure/middleware/validate.middleware';

const router = Router({ mergeParams: true });

const reqValidation = [
  body('name').notEmpty().withMessage('El nombre del requisito es requerido'),
];

/**
 * @swagger
 * /api/tenders/{id}/requirements:
 *   post:
 *     summary: Agregar requisito a una licitación
 *     description: Crea un nuevo requisito documentario para la licitación (solo ENTE_PUBLICO)
 *     tags: [Tender Requirements]
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
 *             $ref: '#/components/schemas/CreateRequirementDTO'
 *     responses:
 *       201:
 *         description: Requisito agregado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/TenderRequirement'
 *                 message:
 *                   type: string
 *                   example: Requisito agregado
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
 *     summary: Listar requisitos de una licitación
 *     description: Obtiene todos los requisitos documentarios de una licitación
 *     tags: [Tender Requirements]
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
 *         description: Listado de requisitos
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
 *                     $ref: '#/components/schemas/TenderRequirement'
 *       404:
 *         description: Licitación no encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiErrorResponse'
 */
router.post('/', authenticate, authorize('ENTE_PUBLICO'), validate(reqValidation), requirementsController.create);
router.get('/', requirementsController.list);

/**
 * @swagger
 * /api/tenders/{id}/requirements/{reqId}:
 *   delete:
 *     summary: Eliminar requisito
 *     description: Elimina un requisito documentario de la licitación (solo ENTE_PUBLICO)
 *     tags: [Tender Requirements]
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
 *         name: reqId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID del requisito
 *     responses:
 *       204:
 *         description: Requisito eliminado (sin contenido)
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
 *         description: Requisito no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiErrorResponse'
 */
router.delete('/:reqId', authenticate, authorize('ENTE_PUBLICO'), requirementsController.remove);

export default router;
