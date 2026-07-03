import { config } from "dotenv";
import { Pool } from "pg";
import fs from "fs/promises";
import path from "path";

config();

const DATABASE_URL =
  process.env.DATABASE_URL ||
  `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`;

async function runMigrations() {
  const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: DATABASE_URL.includes("supabase")
      ? { rejectUnauthorized: false }
      : false,
    family: 4,
  } as any);

  const schemaPath = path.join(
    process.cwd(),
    "infrastructure",
    "database",
    "schema.sql"
  );

  try {
    console.log(`📦 Running schema: ${schemaPath}`);
    const sql = await fs.readFile(schemaPath, "utf-8");
    await pool.query(sql);
    console.log("✅ Schema migration completed successfully");
  } catch (error: any) {
    console.error("❌ Migration failed:", error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigrations();
