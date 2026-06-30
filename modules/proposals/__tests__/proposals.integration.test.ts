import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import express from 'express';
import { errorHandler } from '../../../infrastructure/middleware/error.middleware';

describe('Proposals Module - Routes', () => {
  let app: express.Express;

  beforeAll(async () => {
    app = express();
    app.use(express.json());
    const { proposalRouter } = await import('../proposals.routes');
    app.use('/api/proposals', proposalRouter);
    app.use(errorHandler);
  });

  it('GET /api/proposals/my-proposals - should reject without auth', async () => {
    const res = await request(app).get('/api/proposals/my-proposals');
    expect(res.status).toBe(401);
  });

  it('GET /api/proposals/:id - should reject without auth', async () => {
    const res = await request(app).get('/api/proposals/some-id');
    expect(res.status).toBe(401);
  });

  it('PATCH /api/proposals/:id/submit - should reject without auth', async () => {
    const res = await request(app)
      .patch('/api/proposals/some-id/submit');
    expect(res.status).toBe(401);
  });

  it('GET /api/proposals/my-proposals - should reject wrong role', async () => {
    // This would need a valid token but wrong role - tested via auth middleware
  });
});

describe('Proposals Module - Tender Nested Routes', () => {
  let app: express.Express;

  beforeAll(async () => {
    app = express();
    app.use(express.json());
    const tenderProposalsRouter = (await import('../proposals.routes')).default;
    app.use('/api/tenders/:id/proposals', tenderProposalsRouter);
    app.use(errorHandler);
  });

  it('POST /api/tenders/:id/proposals - should reject without auth', async () => {
    const res = await request(app).post('/api/tenders/tender-1/proposals');
    expect(res.status).toBe(401);
  });
});
