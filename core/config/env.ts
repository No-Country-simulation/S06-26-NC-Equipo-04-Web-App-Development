import { config } from 'dotenv';

config();

export const env = {
  SERVER_PORT: Number(process.env.SERVER_PORT) || 8080,
  DB_USER: process.env.DB_USER || 'postgres',
  DB_HOST: process.env.DB_HOST || 'localhost',
  DB_NAME: process.env.DB_NAME || 'licitaciones_peru',
  DB_PASSWORD: process.env.DB_PASSWORD || 'postgres',
  DB_PORT: Number(process.env.DB_PORT) || 5432,
  JWT_SECRET: process.env.JWT_SECRET || 'dev-secret-change-in-production',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
} as const;

export function validateEnv(): void {
  const required = ['DB_USER', 'DB_HOST', 'DB_NAME', 'DB_PASSWORD', 'DB_PORT', 'JWT_SECRET'];
  const missing = required.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}
