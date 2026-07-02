import { Router } from 'express';
import * as documentsController from './documents.controller';
import { authenticate, authorize } from '../../infrastructure/middleware/auth.middleware';
import multer from 'multer';

const router = Router({ mergeParams: true });

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (_req, file, cb) => {
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (allowedTypes.includes(file.mimetype) || file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Formato de archivo no permitido. Use PDF, Word o imágenes'));
    }
  },
});

/**
 * @swagger
 * /api/tenders/{id}/documents:
 *   post:
 *     summary: Subir documento a una licitación
 *     description: Sube un archivo (PDF, Word o imagen) como documento de la licitación (solo ENTE_PUBLICO)
 *     tags: [Tender Documents]
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
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: Archivo a subir (PDF, Word o imagen)
 *               documentType:
 *                 type: string
 *                 enum: [BASE, TDR, ADICIONAL]
 *                 description: Tipo de documento
 *     responses:
 *       201:
 *         description: Documento subido exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/TenderDocument'
 *                 message:
 *                   type: string
 *                   example: Documento subido exitosamente
 *       400:
 *         description: Error de validación o archivo no permitido
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
 *     summary: Listar documentos de una licitación
 *     description: Obtiene todos los documentos asociados a una licitación
 *     tags: [Tender Documents]
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
 *         description: Listado de documentos
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
 *                     $ref: '#/components/schemas/TenderDocument'
 *       404:
 *         description: Licitación no encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiErrorResponse'
 */
router.post('/', authenticate, authorize('ENTE_PUBLICO'), upload.single('file'), documentsController.upload);
router.get('/', documentsController.list);

/**
 * @swagger
 * /api/tenders/{id}/documents/download/{docId}:
 *   get:
 *     summary: Descargar documento
 *     description: Descarga un archivo específico de una licitación
 *     tags: [Tender Documents]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID de la licitación
 *       - in: path
 *         name: docId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID del documento
 *     responses:
 *       200:
 *         description: Archivo descargado
 *         content:
 *           application/octet-stream:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: Documento no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiErrorResponse'
 */
router.get('/download/:docId', documentsController.download);

/**
 * @swagger
 * /api/tenders/{id}/documents/{docId}:
 *   delete:
 *     summary: Eliminar documento
 *     description: Elimina un documento de la licitación (solo ENTE_PUBLICO)
 *     tags: [Tender Documents]
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
 *         name: docId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID del documento
 *     responses:
 *       204:
 *         description: Documento eliminado (sin contenido)
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
 *         description: Documento no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiErrorResponse'
 */
router.delete('/:docId', authenticate, authorize('ENTE_PUBLICO'), documentsController.remove);

// ─── Standalone documents router (mounted at /api/documents) ────
export const standaloneDocumentsRouter = Router();

standaloneDocumentsRouter.get('/:docId/download', documentsController.download);

export default router;
