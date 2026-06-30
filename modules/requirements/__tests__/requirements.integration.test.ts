import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import express from 'express';
import { errorHandler } from '../../../infrastructure/middleware/error.middleware';

describe('Requirements Module - Routes', () => {
  let app: express.Express;

  beforeAll(async () => {
    app = express();
    app.use(express.json());
    const reqRoutes = (await import('../requirements.routes')).default;
    app.use('/api/tenders/:id/requirements', reqRoutes);
    app.use(errorHandler);
  });

  it('GET /api/tenders/:id/requirements - should return list', async () => {
    const res = await request(app)
      .get('/api/tenders/some-tender-id/requirements');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('data');
  });

  it('POST /api/tenders/:id/requirements - should reject without auth', async () => {
    const res = await request(app)
      .post('/api/tenders/some-tender-id/requirements')
      .send({ name: 'Test Requirement' });
    expect(res.status).toBe(401);
  });

  it('POST /api/tenders/:id/requirements - should reject empty name', async () => {
    const res = await request(app)
      .post('/api/tenders/some-tender-id/requirements')
      .set('Authorization', 'Bearer test-token')
      .send({ name: '' });
    expect(res.status).toBe(400);
  });
});
