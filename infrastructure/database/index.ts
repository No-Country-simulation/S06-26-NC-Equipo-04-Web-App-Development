import { config } from "dotenv";
import { Pool } from "pg";

config();

const isProduction = process.env.NODE_ENV === "production";

const poolConfig: any = process.env.DATABASE_URL
  ? {
      connectionString: process.env.DATABASE_URL,
      ssl: isProduction ? { rejectUnauthorized: false } : false,
    }
  : {
      user: process.env.DB_USER,
      host: process.env.DB_HOST,
      database: process.env.DB_NAME,
      password: process.env.DB_PASSWORD,
      port: Number(process.env.DB_PORT),
    };

const pool = new Pool(poolConfig);

export async function verifyConnection(): Promise<void> {
  try {
    const client = await pool.connect();
    const res = await client.query("SELECT NOW()");
    console.log("✅ Connected to PostgreSQL database. Ping at: ", res.rows[0].now);
    client.release();
  } catch (error) {
    console.error("❌ Error connecting to the database: ", error);
    if (!isProduction) {
      throw error;
    }
    console.warn("⚠️ Continuing without database — some features will be unavailable");
  }
};

export default pool;