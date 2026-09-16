import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { env } from '../env.js';
import * as schema from './schema.js';

// node-postgres with a real pool, NOT neon-http as the client uses.
//
// The client is on drizzle-orm/neon-http because Next.js serverless handlers
// hold no connection between requests, so every query is its own HTTPS
// round-trip. This process is long-running and has no such constraint, which
// buys two things:
//
//   1. Interactive transactions. neon-http does not merely lack them, it
//      throws: "No transactions support in neon-http driver". Better Auth's
//      create-user-and-account path is transactional, so this driver choice is
//      what makes docs/02-auth.md's top risk go away rather than needing a
//      workaround.
//   2. Query shape stops being latency. Over HTTP a sequential await costs a
//      full round-trip that a join does not; over a pooled connection it does
//      not.
//
// The same connection string works against Neon in production — Neon speaks
// ordinary Postgres over TCP as well as HTTP. Only the host changes.
export const pool = new Pool({
  connectionString: env.databaseUrl,
  // Neon terminates idle connections; keep the pool modest and let it recycle
  // rather than holding connections open against a serverless Postgres.
  max: 10,
  idleTimeoutMillis: 30_000,
});

// `casing: "snake_case"` matches the client's db/db.ts. Every existing column
// carries an explicit SQL name so this changes nothing today — but a new column
// that relies on the default would otherwise be queried as "userId" while the
// migration created user_id. drizzle.config.ts sets the same value; the two
// must never disagree.
export const db = drizzle({ client: pool, schema, casing: 'snake_case' });

export type Db = typeof db;
