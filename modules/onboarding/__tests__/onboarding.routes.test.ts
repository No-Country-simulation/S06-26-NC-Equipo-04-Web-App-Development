import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import express from 'express';
import { errorHandler } from '../../../infrastructure/middleware/error.middleware';

describe('Onboarding Module - Routes', () => {
  let app: express.Express;

  beforeAll(async () => {
    app = express();
    app.use(express.json());
    const onboardingRoutes = (await import('../onboarding.routes')).default;
    app.use('/api/onboarding', onboardingRoutes);
    app.use(errorHandler);
  });

  it('POST /api/onboarding/validate-ruc - should validate RUC format', async () => {
    const res = await request(app)
      .post('/api/onboarding/validate-ruc')
      .send({ ruc: '20123456789' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('valid');
  });

  it('POST /api/onboarding/validate-ruc - should reject invalid RUC', async () => {
    const res = await request(app)
      .post('/api/onboarding/validate-ruc')
      .send({ ruc: '12345' });
    expect(res.status).toBe(400);
  });

  it('POST /api/onboarding/validate-dni - should validate DNI format', async () => {
    const res = await request(app)
      .post('/api/onboarding/validate-dni')
      .send({ dni: '12345678' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('POST /api/onboarding/validate-dni - should reject invalid DNI', async () => {
    const res = await request(app)
      .post('/api/onboarding/validate-dni')
      .send({ dni: '123' });
    expect(res.status).toBe(400);
  });

  it('POST /api/onboarding/check-osce - should check OSCE status', async () => {
    const res = await request(app)
      .post('/api/onboarding/check-osce')
      .send({ ruc: '20123456789' });
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('inhabilitado');
  });

  it('POST /api/onboarding/check-rnp - should check RNP status', async () => {
    const res = await request(app)
      .post('/api/onboarding/check-rnp')
      .send({ ruc: '20123456789' });
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('inscrito');
  });

  it('POST /api/onboarding/full - should run full onboarding', async () => {
    const res = await request(app)
      .post('/api/onboarding/full')
      .send({ ruc: '20123456789', dni: '12345678' });
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('isApto');
    expect(res.body.data.isApto).toBe(true);
  });

  it('GET /api/onboarding/status/:userId - should return status', async () => {
    const res = await request(app)
      .get('/api/onboarding/status/test-user-id');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('userId');
  });
});
