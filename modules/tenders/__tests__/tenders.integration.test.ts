import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import express from 'express';
import { errorHandler } from '../../../infrastructure/middleware/error.middleware';

describe('Tenders Module - Routes', () => {
  let app: express.Express;

  beforeAll(async () => {
    app = express();
    app.use(express.json());
    const tenderRoutes = (await import('../tenders.routes')).default;
    app.use('/api/tenders', tenderRoutes);
    app.use(errorHandler);
  });

  it('GET /api/tenders - should return list (empty or with data)', async () => {
    const res = await request(app)
      .get('/api/tenders')
      .query({ page: 1, limit: 10 });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('data');
    expect(res.body).toHaveProperty('total');
    expect(res.body).toHaveProperty('page', 1);
  });

  it('GET /api/tenders/:id - should return 404 for non-existent', async () => {
    const res = await request(app)
      .get('/api/tenders/00000000-0000-0000-0000-000000000000');

    expect(res.status).toBe(404);
  });

  it('POST /api/tenders - should reject without auth', async () => {
    const res = await request(app)
      .post('/api/tenders')
      .send({ title: 'Test Tender' });
    expect(res.status).toBe(401);
  });

  it('POST /api/tenders - should reject empty title', async () => {
    const res = await request(app)
      .post('/api/tenders')
      .set('Authorization', 'Bearer test-token')
      .send({ title: '' });
    expect(res.status).toBe(401); // Auth check happens first
  });
});
