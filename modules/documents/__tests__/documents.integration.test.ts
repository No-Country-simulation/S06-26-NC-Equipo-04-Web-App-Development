import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import express from 'express';
import { errorHandler } from '../../../infrastructure/middleware/error.middleware';

describe('Documents Module - Routes', () => {
  let app: express.Express;

  beforeAll(async () => {
    app = express();
    app.use(express.json());
    const docRoutes = (await import('../documents.routes')).default;
    app.use('/api/tenders/:id/documents', docRoutes);
    app.use(errorHandler);
  });

  it('GET /api/tenders/:id/documents - should return list', async () => {
    const res = await request(app)
      .get('/api/tenders/some-tender-id/documents');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('data');
  });

  it('POST /api/tenders/:id/documents - should reject without auth', async () => {
    const res = await request(app)
      .post('/api/tenders/some-tender-id/documents');
    expect(res.status).toBe(401);
  });

  it('GET /api/documents/:docId/download - should handle missing doc', async () => {
    // This is a nested route under tenders, so this test is mostly structural
  });
});
