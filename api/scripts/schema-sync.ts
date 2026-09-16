#!/usr/bin/env bun
/**
 * api/src/db/schema.ts is the canonical schema. client/db/schema.ts is a copy
 * that exists only until the client stops querying Postgres directly and goes
 * through the API proxy instead — at which point client/db/ is deleted and so
 * is this script.
 *
 * Two copies are a drift hazard, and the drift would be silent: the client
 * would keep querying columns the API had already migrated away. This makes it
 * loud instead.
 *
 *   bun run schema:check   fails if the copies differ   (use in CI / pre-merge)
 *   bun run schema:sync    copies canonical -> client
 *
 * The copies are kept byte-identical so the comparison stays trivial. Do not
 * add a banner to either file.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const CANONICAL = join(here, '../src/db/schema.ts');
const COPY = join(here, '../../client/db/schema.ts');

const mode = process.argv[2] === 'sync' ? 'sync' : 'check';
const canonical = readFileSync(CANONICAL, 'utf8');
const copy = readFileSync(COPY, 'utf8');

if (canonical === copy) {
  console.log('schema: client copy matches api/src/db/schema.ts');
  process.exit(0);
}

if (mode === 'sync') {
  writeFileSync(COPY, canonical);
  console.log('schema: synced api/src/db/schema.ts -> client/db/schema.ts');
  process.exit(0);
}

console.error(
  'schema: client/db/schema.ts has DRIFTED from api/src/db/schema.ts.\n' +
    'The API is canonical. Run `bun run schema:sync` from api/, or move the\n' +
    'change into api/src/db/schema.ts first if it was made on the client side.',
);
process.exit(1);
