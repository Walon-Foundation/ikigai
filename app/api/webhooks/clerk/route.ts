import { desc, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { Webhook } from "svix";
import { db } from "@/db/db";
import { users } from "@/db/schema";
import { env } from "@/lib/env";

type ClerkUserEvent = {
  type: "user.created" | "user.updated";
  data: {
    id: string;
    email_addresses: { email_address: string; id: string }[];
    primary_email_address_id: string;
    first_name: string | null;
    last_name: string | null;
    full_name: string | null;
    image_url?: string | null;
  };
};

type ClerkEvent = ClerkUserEvent;

export async function POST(request: Request) {
  const secret = env.clerkWebhookSecret;
  if (!secret) {
    return Response.json(
      { error: "Webhook secret not configured" },
      { status: 500 },
    );
  }

  const headersList = await headers();
  const svixId = headersList.get("svix-id");
  const svixTimestamp = headersList.get("svix-timestamp");
  const svixSignature = headersList.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
    return Response.json({ error: "Missing svix headers" }, { status: 400 });
  }

  const body = await request.text();

  const wh = new Webhook(secret);
  let event: ClerkEvent;
  try {
    event = wh.verify(body, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as ClerkEvent;
  } catch {
    return Response.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "user.created" || event.type === "user.updated") {
    const {
      id: clerkId,
      email_addresses,
      primary_email_address_id,
      first_name,
      last_name,
      full_name,
    } = event.data;

    const primaryEmail =
      email_addresses.find((e) => e.id === primary_email_address_id)
        ?.email_address ??
      email_addresses[0]?.email_address ??
      null;

    const parts = [first_name, last_name].filter(Boolean).join(" ").trim();
    const displayName = full_name?.trim() || parts || "User";

    if (event.type === "user.updated") {
      // Clerk name/email changed after signup — sync it. Don't overwrite a
      // real custom name the user set in Settings with the generic "User"
      // fallback.
      const [existing] = await db
        .select({ id: users.id, displayName: users.displayName })
        .from(users)
        .where(eq(users.clerkId, clerkId))
        .limit(1);
      if (existing) {
        const isPlaceholder =
          !existing.displayName ||
          existing.displayName.trim() === "" ||
          existing.displayName === "User";
        const shouldUpdate =
          displayName !== "User" && (isPlaceholder || displayName !== existing.displayName);
        // Only update when we have a real name to write — otherwise a
        // user.updated that carries no name would blank a good name.
        if (shouldUpdate) {
          await db
            .update(users)
            .set({ displayName, ...(primaryEmail ? { email: primaryEmail } : {}) })
            .where(eq(users.clerkId, clerkId));
        } else if (primaryEmail) {
          // Email may still have changed even if name didn't.
          await db
            .update(users)
            .set({ email: primaryEmail })
            .where(eq(users.clerkId, clerkId));
        }
        return Response.json({ received: true });
      }
      // No row for this clerkId yet — fall through to re-link/insert as
      // for user.created (covers webhook arriving before getOrCreateDbUser).
    }

    // Same re-link as lib/db-user.ts's getOrCreateDbUser: if this email
    // already has a row under a different (now-stale) clerkId, point that row
    // at the new one instead of inserting a second account for the same
    // person. See that file for why this happens.
    const [byEmail] = primaryEmail
      ? await db
          .select({ id: users.id, displayName: users.displayName })
          .from(users)
          .where(eq(users.email, primaryEmail))
          .orderBy(desc(users.createdAt))
          .limit(1)
      : [];

    if (byEmail) {
      const isPlaceholder =
        !byEmail.displayName ||
        byEmail.displayName.trim() === "" ||
        byEmail.displayName === "User";
      await db
        .update(users)
        .set({
          clerkId,
          ...(isPlaceholder && displayName !== "User" ? { displayName } : {}),
        })
        .where(eq(users.id, byEmail.id));
    } else {
      await db
        .insert(users)
        .values({
          clerkId,
          email: primaryEmail,
          displayName,
          role: "mentee",
          growthLevel: 1,
          interestTags: [],
        })
        .onConflictDoNothing({ target: users.clerkId });
    }
  }

  return Response.json({ received: true });
}
