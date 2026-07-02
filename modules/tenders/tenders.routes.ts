import { Router } from 'express';
import { body } from 'express-validator';
import * as tendersController from './tenders.controller';
import { authenticate, authorize } from '../../infrastructure/middleware/auth.middleware';
import { validate } from '../../infrastructure/middleware/validate.middleware';
import stagesRoutes from '../stages/stages.routes';
import requirementsRoutes from '../requirements/requirements.routes';
import documentsRoutes from '../documents/documents.routes';
import { tenderProposalsRouter } from '../proposals/proposals.routes';
import evaluationRoutes from '../evaluation/evaluation.routes';

const router = Router();

const createValidation = [
  body('title').notEmpty().withMessage('El título es requerido'),
  body('nomenclatura').optional().isString().withMessage('La nomenclatura debe ser un texto'),
];

const updateValidation = [
  body('nomenclatura').optional().isString().withMessage('La nomenclatura debe ser un texto'),
];

/**
 * @swagger
 * /api/tenders:
 *   post:
 *     summary: Crear una licitación
 *     description: Crea una nueva licitación (solo ENTE_PUBLICO)
 *     tags: [Tenders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateTenderDTO'
 *     responses:
 *       201:
 *         description: Licitación creada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Tender'
 *                 message:
 *                   type: string
 *                   example: Licitación creada exitosamente
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
 *       403:
 *         description: No autorizado (solo ENTE_PUBLICO)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiErrorResponse'
 *   get:
 *     summary: Listar licitaciones
 *     description: Obtiene un listado paginado de licitaciones con filtros opcionales
 *     tags: [Tenders]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Número de página
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Cantidad de resultados por página
 *       - in: query
 *         name: state
 *         schema:
 *           type: string
 *           enum: [BORRADOR, PUBLICADA, CERRADA]
 *         description: Filtrar por estado
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Término de búsqueda
 *     responses:
 *       200:
 *         description: Listado de licitaciones
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TenderListResponse'
 */
router.post('/', authenticate, authorize('ENTE_PUBLICO'), validate(createValidation), tendersController.create);
router.get('/', tendersController.list);
router.get('/my', authenticate, authorize('ENTE_PUBLICO'), tendersController.myTenders);

/**
 * @swagger
 * /api/tenders/{id}:
 *   get:
 *     summary: Obtener licitación por ID
 *     description: Retorna los detalles completos de una licitación incluyendo etapas, requisitos y documentos
 *     tags: [Tenders]
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
 *         description: Detalle de la licitación
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Tender'
 *       404:
 *         description: Licitación no encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiErrorResponse'
 *   put:
 *     summary: Actualizar licitación
 *     description: Actualiza los datos de una licitación (solo ENTE_PUBLICO)
 *     tags: [Tenders]
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
 *             $ref: '#/components/schemas/UpdateTenderDTO'
 *     responses:
 *       200:
 *         description: Licitación actualizada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Tender'
 *                 message:
 *                   type: string
 *                   example: Licitación actualizada
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
 *         description: Licitación no encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiErrorResponse'
 *   delete:
 *     summary: Eliminar licitación
 *     description: Elimina una licitación (solo ENTE_PUBLICO)
 *     tags: [Tenders]
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
 *       204:
 *         description: Licitación eliminada (sin contenido)
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
 *         description: Licitación no encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiErrorResponse'
 */
router.get('/:id', tendersController.getById);
router.put('/:id', authenticate, authorize('ENTE_PUBLICO'), validate(updateValidation), tendersController.update);

/**
 * @swagger
 * /api/tenders/{id}/publish:
 *   patch:
 *     summary: Publicar licitación
 *     description: Cambia el estado de la licitación a PUBLICADA (solo ENTE_PUBLICO)
 *     tags: [Tenders]
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
 *         description: Licitación publicada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Tender'
 *                 message:
 *                   type: string
 *                   example: Licitación publicada exitosamente
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
 */
router.patch('/:id/publish', authenticate, authorize('ENTE_PUBLICO'), tendersController.publish);

/**
 * @swagger
 * /api/tenders/{id}/close:
 *   patch:
 *     summary: Cerrar licitación
 *     description: Cambia el estado de la licitación a CERRADA (solo ENTE_PUBLICO)
 *     tags: [Tenders]
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
 *         description: Licitación cerrada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Tender'
 *                 message:
 *                   type: string
 *                   example: Licitación cerrada
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
 */
router.patch('/:id/close', authenticate, authorize('ENTE_PUBLICO'), tendersController.close);

/**
 * @swagger
 * /api/tenders/{id}:
 *   delete:
 *     summary: Eliminar licitación
 *     description: Elimina una licitación (solo ENTE_PUBLICO)
 *     tags: [Tenders]
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
 *       204:
 *         description: Licitación eliminada (sin contenido)
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
 *         description: Licitación no encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiErrorResponse'
 */
router.delete('/:id', authenticate, authorize('ENTE_PUBLICO'), tendersController.remove);

// Sub-routes
router.use('/:id/stages', stagesRoutes);
router.use('/:id/requirements', requirementsRoutes);
router.use('/:id/documents', documentsRoutes);
router.use('/:id/proposals', tenderProposalsRouter);
router.use('/:id', evaluationRoutes);

export default router;
