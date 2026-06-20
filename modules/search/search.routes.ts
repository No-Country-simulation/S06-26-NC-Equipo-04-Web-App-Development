import { Router } from 'express';
import * as searchController from './search.controller';

const router = Router();

/**
 * @swagger
 * /api/search/tenders:
 *   get:
 *     summary: Buscar licitaciones
 *     description: Busca licitaciones por término, estado, fechas y otros filtros
 *     tags: [Search]
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Término de búsqueda
 *       - in: query
 *         name: state
 *         schema:
 *           type: string
 *           enum: [BORRADOR, PUBLICADA, CERRADA]
 *         description: Filtrar por estado
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
 *         description: Resultados por página
 *     responses:
 *       200:
 *         description: Resultados de búsqueda
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SearchResults'
 */
router.get('/tenders', searchController.search);

/**
 * @swagger
 * /api/search/suggestions:
 *   get:
 *     summary: Obtener sugerencias de búsqueda
 *     description: Retorna sugerencias de búsqueda basadas en el término ingresado
 *     tags: [Search]
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: Término para sugerencias
 *     responses:
 *       200:
 *         description: Sugerencias de búsqueda
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuggestionsResult'
 */
router.get('/suggestions', searchController.suggestions);

export default router;
