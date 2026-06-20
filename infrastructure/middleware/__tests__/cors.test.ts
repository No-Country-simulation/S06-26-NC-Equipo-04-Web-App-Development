import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import express from 'express';

let app: express.Express;

beforeAll(async () => {
  app = express();
  const { corsMiddleware } = await import('../cors.middleware');
  app.use(corsMiddleware);
  app.get('/test', (_req, res) => res.json({ ok: true }));
});

describe('CORS middleware', () => {
  it('should allow requests from localhost:4200', async () => {
    const res = await request(app)
      .options('/test')
      .set('Origin', 'http://localhost:4200');

    expect(res.headers['access-control-allow-origin']).toBe('http://localhost:4200');
  });

  it('should return 200 for GET from allowed origin', async () => {
    const res = await request(app)
      .get('/test')
      .set('Origin', 'http://localhost:4200');

    expect(res.status).toBe(200);
  });
});
