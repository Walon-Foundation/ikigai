import { db } from "@/db/db";
import { appCopy } from "@/db/schema";

// Seeds the app_copy rows for the handful of PWA strings wired through
// getAppCopy() so far — see lib/app-copy.ts. Each value here is exactly the
// text that was hard-coded in the component before, so seeding this does not
// change what a user sees; it just moves the source of truth into a row an
// admin can edit at /admin/app-copy.
//
// Idempotent: every insert conflicts on its natural key (the `key` column,
// app_copy's primary key) and does nothing, so re-running this is safe on a
// database an admin has already edited.
//
// Run with:  bun scripts/seed-app-copy.ts

const APP_COPY: { key: string; value: Record<string, unknown> }[] = [
  {
    key: "pad_her_power_intro",
    value: {
      title: "Reproductive Health Resources",
      body: "Evidence-based health information for young women in Sierra Leone. Everything here is private and for you.",
    },
  },
  {
    key: "safety_crisis_banner",
    value: {
      title: "Need immediate help?",
      body: "View crisis helplines — always available",
    },
  },
  {
    key: "dashboard_no_mentor",
    value: {
      title: "Mentorship",
      body: "You don't have a mentor yet.",
      cta: "Find a Mentor",
    },
  },
  {
    key: "dashboard_active_modules_heading",
    value: { label: "Active Modules" },
  },
];

async function main() {
  await db
    .insert(appCopy)
    .values(APP_COPY)
    .onConflictDoNothing({ target: appCopy.key });

  const count = (await db.select({ key: appCopy.key }).from(appCopy)).length;
  console.log("app_copy seed complete:", { rows: count });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
