import pg from "pg";
import { config } from "./config.js";
import { dbState } from "./seedData.js";

const { Pool } = pg;

const shouldUsePostgres = Boolean(config.databaseUrl);

export const pool = shouldUsePostgres
  ? new Pool({
      connectionString: config.databaseUrl,
      ssl: config.databaseUrl.includes("sslmode=require") ? { rejectUnauthorized: false } : undefined,
    })
  : null;

export function pgEnabled() {
  return Boolean(pool);
}

export async function query(text, params = []) {
  if (!pool) {
    throw new Error("PostgreSQL is not configured. Set DATABASE_URL or use the in-memory demo store.");
  }
  return pool.query(text, params);
}

export async function transaction(callback) {
  if (!pool) return callback(null);
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await callback(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export const store = dbState;

export async function healthCheck() {
  if (!pool) {
    return { mode: "memory", ok: true };
  }
  const result = await pool.query("select now() as now");
  return { mode: "postgres", ok: true, now: result.rows[0].now };
}