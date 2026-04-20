import "server-only";

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "./schema";

type Drizzle = ReturnType<typeof drizzle<typeof schema>>;
type GlobalCache = {
  __datafast_db?: Drizzle;
  __datafast_pg?: ReturnType<typeof postgres>;
};

const g = globalThis as unknown as GlobalCache;

function createDb(): Drizzle {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL is not set. For local dev, run `docker compose -f docker-compose.dev.yml up -d` and set DATABASE_URL in .env.local.",
    );
  }
  const client = g.__datafast_pg ?? (g.__datafast_pg = postgres(url, { max: 10 }));
  return drizzle(client, { schema });
}

function getDb(): Drizzle {
  if (!g.__datafast_db) g.__datafast_db = createDb();
  return g.__datafast_db;
}

/**
 * Lazily-initialized Drizzle client. The actual `postgres()` connection is
 * created on first property access, which keeps `next build` happy when
 * DATABASE_URL isn't set (e.g., during image builds in CI).
 */
export const db: Drizzle = new Proxy({} as Drizzle, {
  get(_target, prop) {
    const real = getDb() as unknown as Record<string | symbol, unknown>;
    return real[prop as string];
  },
});

export { schema };
