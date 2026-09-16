// Enough environment for lib/env.ts to parse at import.
//
// These modules reach the database through @/db/db, which builds a Neon HTTP
// client at import — the client itself opens nothing until a query runs, so a
// well-formed URL is all that is needed to import the module under test. No
// test in this directory touches the database.
process.env.DATABASE_URL ||= "postgresql://user:pass@example.neon.tech/db";
process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ||= "pk_test_placeholder";
process.env.CLERK_SECRET_KEY ||= "sk_test_placeholder";

// `server-only` throws on import outside React Server Components, which is the
// whole point of the package — but it makes the modules that import it
// untestable in a plain runtime. Stubbing it here neutralises the guard for
// tests only; the real guard still protects the app at build time.
import { mock } from "bun:test";

mock.module("server-only", () => ({}));
