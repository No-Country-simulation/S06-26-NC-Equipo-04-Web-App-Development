import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import express from 'express';
import { errorHandler } from '../../../infrastructure/middleware/error.middleware';

describe('Search Module - Routes', () => {
  let app: express.Express;

  beforeAll(async () => {
    app = express();
    app.use(express.json());
    const searchRoutes = (await import('../search.routes')).default;
    app.use('/api/search', searchRoutes);
    app.use(errorHandler);
  });

  it('GET /api/search/tenders - should return results', async () => {
    const res = await request(app)
      .get('/api/search/tenders')
      .query({ q: 'test', page: 1, limit: 10 });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('data');
    expect(res.body).toHaveProperty('total');
  });

  it('GET /api/search/tenders - should work without query', async () => {
    const res = await request(app).get('/api/search/tenders');
    expect(res.status).toBe(200);
  });

  it('GET /api/search/suggestions - should return suggestions', async () => {
    const res = await request(app)
      .get('/api/search/suggestions')
      .query({ q: 'test' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('data');
  });

  it('GET /api/search/suggestions - should return empty for short query', async () => {
    const res = await request(app)
      .get('/api/search/suggestions')
      .query({ q: 'a' });

    expect(res.status).toBe(200);
    expect(res.body.data.suggestions).toEqual([]);
  });
});
