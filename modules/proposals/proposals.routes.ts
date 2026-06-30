import { Router } from 'express';
import { body } from 'express-validator';
import * as proposalsController from './proposals.controller';
import { authenticate, authorize } from '../../infrastructure/middleware/auth.middleware';
import { validate } from '../../infrastructure/middleware/validate.middleware';
import multer from 'multer';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

/**
 * @swagger
 * /api/tenders/{id}/proposals:
 *   post:
 *     summary: Crear propuesta
 *     description: Crea una nueva propuesta para una licitación (solo PROVEEDOR)
 *     tags: [Proposals]
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
 *       201:
 *         description: Propuesta creada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Proposal'
 *                 message:
 *                   type: string
 *                   example: Propuesta creada
 *       401:
 *         description: No autenticado
 *       403:
 *         description: No autorizado (solo PROVEEDOR)
 *   get:
 *     summary: Listar propuestas de una licitación
 *     description: Obtiene todas las propuestas para una licitación (solo ENTE_PUBLICO)
 *     tags: [Proposals]
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
 *         description: Listado de propuestas
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
 *                     $ref: '#/components/schemas/Proposal'
 *       401:
 *         description: No autenticado
 *       403:
 *         description: No autorizado (solo ENTE_PUBLICO)
 */
// ─── Sub-router for /api/tenders/:id/proposals ─────────────────
const tenderProposalsRouter = Router({ mergeParams: true });

tenderProposalsRouter.post('/', authenticate, authorize('PROVEEDOR'), proposalsController.create);
tenderProposalsRouter.get('/list', authenticate, authorize('ENTE_PUBLICO'), proposalsController.listByTender);

/**
 * @swagger
 * /api/tenders/{id}/proposals/{proposalId}:
 *   get:
 *     summary: Obtener propuesta por ID
 *     description: Retorna los detalles de una propuesta específica
 *     tags: [Proposals]
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
 *         description: Detalle de la propuesta
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Proposal'
 *       404:
 *         description: Propuesta no encontrada
 */
tenderProposalsRouter.get('/:proposalId', authenticate, proposalsController.getById);

/**
 * @swagger
 * /api/tenders/{id}/proposals/{proposalId}/documents:
 *   put:
 *     summary: Adjuntar documento a propuesta
 *     description: Sube un archivo como documento de la propuesta (solo PROVEEDOR)
 *     tags: [Proposals]
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
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: Archivo a adjuntar
 *     responses:
 *       200:
 *         description: Documento adjuntado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Proposal'
 *                 message:
 *                   type: string
 *                   example: Documento adjuntado
 *       401:
 *         description: No autenticado
 *       403:
 *         description: No autorizado
 */
tenderProposalsRouter.put('/:proposalId/documents', authenticate, authorize('PROVEEDOR'), upload.single('file'), proposalsController.attachDocument);

/**
 * @swagger
 * /api/tenders/{id}/proposals/{proposalId}/submit:
 *   patch:
 *     summary: Enviar propuesta
 *     description: Cambia el estado de la propuesta a ENVIADO (solo PROVEEDOR)
 *     tags: [Proposals]
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
 *         description: Propuesta enviada exitosamente
 *       401:
 *         description: No autenticado
 *       403:
 *         description: No autorizado
 */
tenderProposalsRouter.patch('/:proposalId/submit', authenticate, authorize('PROVEEDOR'), proposalsController.submit);

/**
 * @swagger
 * /api/tenders/{id}/proposals/{proposalId}/disqualify:
 *   patch:
 *     summary: Descalificar propuesta
 *     description: Descalifica una propuesta (solo ENTE_PUBLICO)
 *     tags: [Proposals]
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
 *         description: Propuesta descalificada
 *       401:
 *         description: No autenticado
 *       403:
 *         description: No autorizado
 */
tenderProposalsRouter.patch('/:proposalId/disqualify', authenticate, authorize('ENTE_PUBLICO'), proposalsController.disqualify);

/**
 * @swagger
 * /api/tenders/{id}/proposals/{proposalId}/price:
 *   patch:
 *     summary: Actualizar precio de propuesta
 *     description: Actualiza el precio ofertado en la propuesta (solo PROVEEDOR)
 *     tags: [Proposals]
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
 *             $ref: '#/components/schemas/UpdatePriceDTO'
 *     responses:
 *       200:
 *         description: Precio actualizado
 *       401:
 *         description: No autenticado
 *       403:
 *         description: No autorizado
 */
tenderProposalsRouter.patch('/:proposalId/price', authenticate, authorize('PROVEEDOR'),
  validate([body('price').isFloat({ min: 0.01 }).withMessage('Precio inválido')]),
  proposalsController.updatePrice
);

// ─── Top-level router for /api/proposals ────────────────────────
const topLevelRouter = Router();

/**
 * @swagger
 * /api/proposals/my-proposals:
 *   get:
 *     summary: Mis propuestas
 *     description: Obtiene las propuestas del proveedor autenticado
 *     tags: [Proposals]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Listado de mis propuestas
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Proposal'
 *       401:
 *         description: No autenticado
 *       403:
 *         description: No autorizado (solo PROVEEDOR)
 */
topLevelRouter.get('/my-proposals', authenticate, authorize('PROVEEDOR'), proposalsController.myProposals);

/**
 * @swagger
 * /api/proposals/{proposalId}:
 *   get:
 *     summary: Obtener propuesta por ID (top-level)
 *     tags: [Proposals]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: proposalId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Detalle de la propuesta
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Proposal'
 *       404:
 *         description: Propuesta no encontrada
 */
topLevelRouter.get('/:proposalId', authenticate, proposalsController.getById);

/**
 * @swagger
 * /api/proposals/{proposalId}/documents:
 *   put:
 *     summary: Adjuntar documento a propuesta (top-level)
 *     tags: [Proposals]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: proposalId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Documento adjuntado
 *       401:
 *         description: No autenticado
 *       403:
 *         description: No autorizado
 */
topLevelRouter.put('/:proposalId/documents', authenticate, authorize('PROVEEDOR'), upload.single('file'), proposalsController.attachDocument);

/**
 * @swagger
 * /api/proposals/{proposalId}/submit:
 *   patch:
 *     summary: Enviar propuesta (top-level)
 *     tags: [Proposals]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: proposalId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Propuesta enviada
 *       401:
 *         description: No autenticado
 *       403:
 *         description: No autorizado
 */
topLevelRouter.patch('/:proposalId/submit', authenticate, authorize('PROVEEDOR'), proposalsController.submit);

/**
 * @swagger
 * /api/proposals/{proposalId}/disqualify:
 *   patch:
 *     summary: Descalificar propuesta (top-level)
 *     tags: [Proposals]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: proposalId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Propuesta descalificada
 *       401:
 *         description: No autenticado
 *       403:
 *         description: No autorizado
 */
topLevelRouter.patch('/:proposalId/disqualify', authenticate, authorize('ENTE_PUBLICO'), proposalsController.disqualify);

/**
 * @swagger
 * /api/proposals/{proposalId}/price:
 *   patch:
 *     summary: Actualizar precio de propuesta (top-level)
 *     tags: [Proposals]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: proposalId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdatePriceDTO'
 *     responses:
 *       200:
 *         description: Precio actualizado
 *       401:
 *         description: No autenticado
 *       403:
 *         description: No autorizado
 */
topLevelRouter.patch('/:proposalId/price', authenticate, authorize('PROVEEDOR'),
  validate([body('price').isFloat({ min: 0.01 }).withMessage('Precio inválido')]),
  proposalsController.updatePrice
);

topLevelRouter.get('/:proposalId/documents', authenticate, proposalsController.getDocuments);
topLevelRouter.get('/:proposalId/documents/:docId/download', authenticate, proposalsController.downloadDocument);

export { tenderProposalsRouter, topLevelRouter as proposalRouter };
export default tenderProposalsRouter;
