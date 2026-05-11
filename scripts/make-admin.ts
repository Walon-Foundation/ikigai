import "dotenv/config";
import { neon } from "@neondatabase/serverless";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-http";
import { users } from "../db/schema";

const email = process.argv[2];
if (!email) {
  console.error("Usage: bun scripts/make-admin.ts <email>");
  process.exit(1);
}

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.error("DATABASE_URL is not set");
  process.exit(1);
}

const db = drizzle({
  client: neon(dbUrl),
  casing: "snake_case",
});

const [user] = await db
  .update(users)
  .set({ role: "admin" })
  .where(eq(users.email, email))
  .returning({
    id: users.id,
    displayName: users.displayName,
    email: users.email,
    role: users.role,
  });

if (!user) {
  console.error(`No user found with email: ${email}`);
  process.exit(1);
}

console.log(`✓ ${user.displayName} (${user.email}) is now admin`);
