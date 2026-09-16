import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { env } from "@/lib/env";

// neon-http: every query is its own HTTPS round-trip, with no pooled connection
// held open. That suits serverless request handlers, but it also means query
// *shape* is latency — a sequential await costs a full round-trip that a
// Promise.all or a join does not. The pages here are written accordingly.
//
// This driver never opens a WebSocket, so it needs no webSocketConstructor. The
// `ws` polyfill this file used to configure was dead weight.
const sql = neon(env.databaseUrl);

export const db = drizzle({ client: sql, casing: "snake_case" });
