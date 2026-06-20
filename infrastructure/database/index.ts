import { config } from "dotenv";
import { Pool } from "pg";

config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: Number(process.env.DB_PORT)
});

async function verifyConnection(): Promise<void> {
  try {
    const client = await pool.connect();
    const res = await client.query("SELECT NOW()");
    console.log("✅ Connected to PostgreSQL database. Ping at: ", res.rows[0].now);
    client.release();
  } catch (error) {
    console.error("❌ Error connecting to the database: ", error);
  }
};

verifyConnection();
process.exit(1);

export default pool;