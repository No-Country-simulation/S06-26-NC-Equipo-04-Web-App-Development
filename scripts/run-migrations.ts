import { config } from 'dotenv';
import { Pool } from 'pg';
import fs from 'fs/promises';
import path from 'path';

config();

async function runMigrations() {
  const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: Number(process.env.DB_PORT),
  });

  const migrationsDir = path.join(process.cwd(), 'infrastructure', 'database', 'migrations');
  
  try {
    const files = await fs.readdir(migrationsDir);
    const sqlFiles = files.filter(f => f.endsWith('.sql')).sort();

    for (const file of sqlFiles) {
      console.log(`📦 Running migration: ${file}`);
      const sql = await fs.readFile(path.join(migrationsDir, file), 'utf-8');
      try {
        await pool.query(sql);
        console.log(`✅ Migration ${file} completed`);
      } catch (error: any) {
        console.error(`❌ Migration ${file} failed:`, error.message);
      }
    }

    console.log('🎉 All migrations executed');
  } catch (error) {
    console.error('❌ Error running migrations:', error);
  } finally {
    await pool.end();
  }
}

runMigrations();
