import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  out: './src/db/migrations',
  schema: './src/db/schema.ts',
  dialect: 'postgresql',
  // MUST match the `casing` passed to drizzle() in src/db/db.ts. The client's
  // drizzle.config.ts omits this while its db.ts sets it — invisible there
  // because every column has an explicit SQL name, and silent breakage the
  // first time one does not. Kept in step here from the start.
  casing: 'snake_case',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
