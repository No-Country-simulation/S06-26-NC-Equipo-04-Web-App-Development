import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import express from 'express';
import { errorHandler } from '../../../infrastructure/middleware/error.middleware';

// We'll test the controller/service logic directly by mocking the pool
// For integration tests that need DB, we use a lightweight approach

describe('Auth Module - Service Logic', () => {
  it('should validate RUC format (11 digits)', async () => {
    const { registerUser } = await import('../auth.service');
    try {
      await registerUser({
        name: 'Test',
        email: 'test@test.com',
        ruc: '12345',
        dni: '12345678',
        password: 'Password123!',
        role: 'PROVEEDOR',
      });
      expect.fail('Should have thrown');
    } catch (error: any) {
      expect(error.statusCode).toBe(400);
      expect(error.message).toContain('11 dígitos');
    }
  });

  it('should validate DNI format (8 digits)', async () => {
    const { registerUser } = await import('../auth.service');
    try {
      await registerUser({
        name: 'Test',
        email: 'test@test.com',
        ruc: '20123456789',
        dni: '1234',
        password: 'Password123!',
        role: 'PROVEEDOR',
      });
      expect.fail('Should have thrown');
    } catch (error: any) {
      expect(error.statusCode).toBe(400);
      expect(error.message).toContain('8 dígitos');
    }
  });

  it('should validate email format', async () => {
    const { registerUser } = await import('../auth.service');
    try {
      await registerUser({
        name: 'Test',
        email: 'invalid-email',
        ruc: '20123456789',
        dni: '12345678',
        password: 'Password123!',
        role: 'PROVEEDOR',
      });
      expect.fail('Should have thrown');
    } catch (error: any) {
      expect(error.statusCode).toBe(400);
      expect(error.message).toContain('Email inválido');
    }
  });

  it('should validate minimum password length', async () => {
    const { registerUser } = await import('../auth.service');
    try {
      await registerUser({
        name: 'Test',
        email: 'test@test.com',
        ruc: '20123456789',
        dni: '12345678',
        password: '123',
        role: 'PROVEEDOR',
      });
      expect.fail('Should have thrown');
    } catch (error: any) {
      expect(error.statusCode).toBe(400);
      expect(error.message).toContain('6 caracteres');
    }
  });
});

describe('Auth Module - Routes', () => {
  let app: express.Express;

  beforeAll(async () => {
    app = express();
    app.use(express.json());
    const authRoutes = (await import('../auth.routes')).default;
    app.use('/api/auth', authRoutes);
    app.use(errorHandler);
  });

  it('POST /api/auth/register - should reject empty body', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({});
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('POST /api/auth/register - should validate fields', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: '',
        email: 'bad',
        ruc: '123',
        dni: '12',
        password: '12',
        role: 'INVALID',
      });
    expect(res.status).toBe(400);
  });

  it('POST /api/auth/login - should reject empty body', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({});
    expect(res.status).toBe(400);
  });

  it('POST /api/auth/login - should validate fields', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'bad', password: '' });
    expect(res.status).toBe(400);
  });

  it('GET /api/auth/me - should reject without token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('GET /api/auth/me - should reject invalid token', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer invalid_token_here');
    expect(res.status).toBe(401);
  });
});
