import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import express from 'express';
import { errorHandler } from '../../../infrastructure/middleware/error.middleware';

describe('Evaluation Module - Routes', () => {
  let app: express.Express;

  beforeAll(async () => {
    app = express();
    app.use(express.json());
    const evaluationRoutes = (await import('../evaluation.routes')).default;
    app.use('/api/tenders/:id', evaluationRoutes);
    app.use(errorHandler);
  });

  it('POST /api/tenders/:id/evaluate - should reject without auth', async () => {
    const res = await request(app)
      .post('/api/tenders/some-tender-id/evaluate');
    expect(res.status).toBe(401);
  });

  it('GET /api/tenders/:id/ranking - should reject without auth', async () => {
    const res = await request(app)
      .get('/api/tenders/some-tender-id/ranking');
    expect(res.status).toBe(401);
  });

  it('PATCH /api/tenders/:id/award/:proposalId - should reject without auth', async () => {
    const res = await request(app)
      .patch('/api/tenders/some-tender-id/award/some-proposal-id');
    expect(res.status).toBe(401);
  });

  it('PUT /api/tenders/:id/experience/:proposalId - should reject without auth', async () => {
    const res = await request(app)
      .put('/api/tenders/some-tender-id/experience/some-proposal-id')
      .send({ yearsExperience: 5 });
    expect(res.status).toBe(401);
  });
});
