import { Global, Module } from '@nestjs/common';
import { type Db, db, pool } from './db.js';

/**
 * Injection token for the Drizzle client.
 *
 * A token rather than importing `db` directly at every call site: modules
 * depend on the token, so a test can swap in a transaction-scoped client
 * without the module under test knowing.
 */
export const DATABASE = Symbol('DATABASE');

@Global()
@Module({
  providers: [{ provide: DATABASE, useValue: db }],
  exports: [DATABASE],
})
export class DatabaseModule {
  // Close the pool on shutdown so `bun run start:dev` restarts and tests do not
  // leak connections. Requires app.enableShutdownHooks() — set in main.ts.
  async onModuleDestroy() {
    await pool.end();
  }
}

export type { Db };
