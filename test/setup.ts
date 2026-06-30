import { config } from 'dotenv';
import { beforeAll, afterAll } from 'vitest';

// Load .env.test if exists, otherwise .env
config({ path: '.env.test' });

beforeAll(async () => {
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test-secret-key';
  process.env.SERVER_PORT = '0'; // Random port for supertest
});

afterAll(async () => {
  // Cleanup
});
