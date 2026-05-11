import { headers } from "next/headers";
import { Webhook } from "svix";
import { db } from "@/db/db";
import { users } from "@/db/schema";

type ClerkUserCreatedEvent = {
  type: "user.created";
  data: {
    id: string;
    email_addresses: { email_address: string; id: string }[];
    primary_email_address_id: string;
    first_name: string | null;
    last_name: string | null;
    full_name: string | null;
  };
};

type ClerkEvent = ClerkUserCreatedEvent;

export async function POST(request: Request) {
  const secret = process.env.CLERK_WEBHOOK_SECRET;
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

  if (event.type === "user.created") {
    const {
      id: clerkId,
      email_addresses,
      primary_email_address_id,
      first_name,
      last_name,
    } = event.data;

    const primaryEmail =
      email_addresses.find((e) => e.id === primary_email_address_id)
        ?.email_address ??
      email_addresses[0]?.email_address ??
      null;

    const displayName =
      [first_name, last_name].filter(Boolean).join(" ") || "User";

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

  return Response.json({ received: true });
}
