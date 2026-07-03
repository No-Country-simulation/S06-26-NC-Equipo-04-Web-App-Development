import express, { Express } from 'express';
import { config } from 'dotenv';
import { verifyConnection } from './database/index';
import { errorHandler } from './middleware/error.middleware';
import { corsMiddleware } from './middleware/cors.middleware';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './swagger';
import authRoutes from '../modules/auth/auth.routes';
import onboardingRoutes from '../modules/onboarding/onboarding.routes';
import tenderRoutes from '../modules/tenders/tenders.routes';
import searchRoutes from '../modules/search/search.routes';
import { proposalRouter } from '../modules/proposals/proposals.routes';
import userRoutes from '../modules/users/users.routes';
import auditRoutes from '../modules/audits/audits.routes';
import { standaloneDocumentsRouter } from '../modules/documents/documents.routes';

config();

const app: Express = express();
const PORT = process.env.PORT || process.env.SERVER_PORT || 8080;

// Global middlewares
app.use(corsMiddleware);
app.use(express.json({ limit: '10mb' }));

// Swagger docs
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

/**
 * @swagger
 * /api/health:
 *   get:
 *     summary: Health check
 *     description: Verifica que el servidor esté funcionando correctamente
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Servidor funcionando
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ok
 *                 message:
 *                   type: string
 *                   example: GovTech API is running
 */
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', message: 'GovTech API is running' });
});

// Modular routes
app.use('/api/auth', authRoutes);
app.use('/api/onboarding', onboardingRoutes);
app.use('/api/tenders', tenderRoutes);
app.use('/api/proposals', proposalRouter);
app.use('/api/search', searchRoutes);
app.use('/api/users', userRoutes);
app.use('/api/audits', auditRoutes);
app.use('/api/documents', standaloneDocumentsRouter);

// Error handler (always last)
app.use(errorHandler);

// Start server only if not in test environment
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, async () => {
    await verifyConnection();
    console.log(`🚀 Servidor GovTech corriendo en puerto ${PORT}`);
  });
}

export default app;
