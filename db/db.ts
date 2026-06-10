import { neon, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

import ws from "ws";
import { env } from "@/lib/env";

neonConfig.webSocketConstructor = ws;

const sql = neon(env.databaseUrl);

export const db = drizzle({ client: sql, casing: "snake_case" });
