import { describe, it, expect } from 'vitest';
import { hashPassword, comparePassword } from '../password';

describe('Password Utils', () => {
  it('should hash a password', async () => {
    const hash = await hashPassword('TestPass123!');
    expect(hash).toBeDefined();
    expect(hash).not.toBe('TestPass123!');
  });

  it('should compare a correct password', async () => {
    const hash = await hashPassword('TestPass123!');
    const isValid = await comparePassword('TestPass123!', hash);
    expect(isValid).toBe(true);
  });

  it('should reject an incorrect password', async () => {
    const hash = await hashPassword('TestPass123!');
    const isValid = await comparePassword('WrongPassword', hash);
    expect(isValid).toBe(false);
  });
});
