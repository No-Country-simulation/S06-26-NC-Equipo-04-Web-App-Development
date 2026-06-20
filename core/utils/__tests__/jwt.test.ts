import { describe, it, expect } from 'vitest';
import { generateToken, verifyToken } from '../jwt';

describe('JWT Utils', () => {
  const payload = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    email: 'test@example.com',
    role: 'PROVEEDOR' as const,
    ruc: '20123456789',
    name: 'Test User',
  };

  it('should generate a valid JWT token', () => {
    const token = generateToken(payload);
    expect(token).toBeDefined();
    expect(typeof token).toBe('string');
    expect(token.split('.')).toHaveLength(3);
  });

  it('should verify a valid token and return payload', () => {
    const token = generateToken(payload);
    const decoded = verifyToken(token);
    expect(decoded.id).toBe(payload.id);
    expect(decoded.email).toBe(payload.email);
    expect(decoded.role).toBe(payload.role);
  });

  it('should throw on invalid token', () => {
    expect(() => verifyToken('invalid-token')).toThrow();
  });
});
