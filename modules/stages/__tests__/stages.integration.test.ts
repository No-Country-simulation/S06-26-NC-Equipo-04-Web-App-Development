import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import express from 'express';
import { errorHandler } from '../../../infrastructure/middleware/error.middleware';

describe('Stages Module - Routes', () => {
  let app: express.Express;

  beforeAll(async () => {
    app = express();
    app.use(express.json());
    const stagesRoutes = (await import('../stages.routes')).default;
    app.use('/api/tenders/:id/stages', stagesRoutes);
    app.use(errorHandler);
  });

  it('GET /api/tenders/:id/stages - should return list', async () => {
    const res = await request(app)
      .get('/api/tenders/some-tender-id/stages');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('data');
  });

  it('POST /api/tenders/:id/stages - should reject without auth', async () => {
    const res = await request(app)
      .post('/api/tenders/some-tender-id/stages')
      .send({
        stageType: 'POSTULACION',
        name: 'Test Stage',
        startDate: '2026-07-01T00:00:00Z',
        endDate: '2026-07-15T23:59:59Z',
      });
    expect(res.status).toBe(401);
  });

  it('POST /api/tenders/:id/stages - should reject missing fields', async () => {
    const res = await request(app)
      .post('/api/tenders/some-tender-id/stages')
      .set('Authorization', 'Bearer test-token')
      .send({});
    expect(res.status).toBe(400); // Validation failure
  });
});
