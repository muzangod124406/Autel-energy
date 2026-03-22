import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";

const rawUrl = process.env.SUPABASE_DATABASE_URL || process.env.DATABASE_URL;

if (!rawUrl) {
  throw new Error("SUPABASE_DATABASE_URL or DATABASE_URL must be set");
}

function buildPoolConfig(url: string): pg.PoolConfig {
  try {
    const withoutProto = url.replace(/^(postgresql|postgres):\/\//, "");
    const lastAt = withoutProto.lastIndexOf("@");
    const credsPart = withoutProto.substring(0, lastAt);
    const hostPart = withoutProto.substring(lastAt + 1);

    const colonIdx = credsPart.indexOf(":");
    const user = credsPart.substring(0, colonIdx);
    const password = credsPart.substring(colonIdx + 1);

    const slashIdx = hostPart.indexOf("/");
    const hostPortStr = hostPart.substring(0, slashIdx);
    const database = hostPart.substring(slashIdx + 1);
    const lastColon = hostPortStr.lastIndexOf(":");
    const host = hostPortStr.substring(0, lastColon);
    const port = parseInt(hostPortStr.substring(lastColon + 1), 10);

    console.log("[DB] Connecting to Supabase:", { user, host, port, database });
    return { user, password, host, port, database, ssl: { rejectUnauthorized: false } };
  } catch (e) {
    console.log("[DB] URL parse failed, using raw connection string:", e);
    return { connectionString: url, ssl: { rejectUnauthorized: false } };
  }
}

const isSupabase = !!process.env.SUPABASE_DATABASE_URL;
const poolConfig = isSupabase ? buildPoolConfig(rawUrl) : { connectionString: rawUrl };

const pool = new pg.Pool(poolConfig);

export const db = drizzle(pool, { schema });
