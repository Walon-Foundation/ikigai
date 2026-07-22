import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

// Indexing note: every query below runs over Neon's HTTP driver, where each
// statement is its own network round-trip — so an unindexed sequential scan
// costs real wall-clock time on every page render, not just CPU. Columns are
// indexed here wherever a query filters, joins or orders on them. Columns
// already covered by a `unique()` constraint (which creates its own index, and
// whose leading column is usable on its own) are deliberately not re-indexed.

export const roleEnum = pgEnum("role", [
  "mentee",
  "mentor",
  "club_lead",
  "parent",
  "admin",
]);

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    clerkId: text("clerk_id").notNull().unique(),
    email: text("email"),
    role: roleEnum("role").notNull().default("mentee"),
    displayName: text("display_name"),
    avatarUrl: text("avatar_url"), // profile photo (UploadThing URL); null = initials
    bio: text("bio"),
    interestTags: text("interest_tags").array(),
    schoolId: uuid("school_id").references(() => schools.id),
    growthLevel: integer("growth_level").default(1), // 1=Explorer, 2=Advocate, 3=Mentor
    // What a new journal entry defaults to: 'private' | 'mentor_only'.
    // The settings toggle for this has always existed but had nothing behind it
    // — it was React state that reset on reload, and it defaulted to ON while
    // the journal itself hard-coded new entries to 'private'. So it was wrong
    // in both directions at once: a mentee who left it on and assumed their
    // mentor could see their entries was mistaken, and a mentee who turned it
    // off to hide them had changed nothing.
    journalDefaultVisibility: text("journal_default_visibility").default(
      "private",
    ),
    verifiedAt: timestamp("verified_at"),
    // Set when the user asks for their account to be deleted. The account is
    // scrubbed by the purge job after a grace period, during which the user can
    // change their mind from Settings. Deletion is deliberately not instant: a
    // distressed teenager erasing their account at 2am is a foreseeable
    // scenario on this platform, and that tap should be recoverable.
    // A purged account keeps this row (scrubbed) rather than dropping it: safety
    // reports point at users.id, and someone reported for harming a child must
    // not be able to erase the report by deleting themselves. See lib/purge.ts.
    deletionRequestedAt: timestamp("deletion_requested_at"),
    deletedAt: timestamp("deleted_at"),
    pushSubscription: jsonb("push_subscription"), // Web Push subscription object
    onboardingData: jsonb("onboarding_data"),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (t) => [
    // The mentor marketplace filters on exactly this pair.
    index("users_role_verified_idx").on(t.role, t.verifiedAt),
    // Guardian links resolve a child by email.
    index("users_email_idx").on(t.email),
  ],
);

// Vetting documents a mentor applicant submits: government ID and CV.
//
// Stores the UploadThing file KEY, not a URL. These files are set to a private
// ACL on upload, so there is no URL that works on its own — the admin screen
// mints a short-lived signed URL from the key at view time. A government ID
// sitting at a permanent public link, however unguessable, is not something
// this platform should have in a database column.
//
// The bytes never pass through this backend: the browser uploads straight to
// UploadThing, and onUploadComplete only ever receives the stored file's
// metadata. See app/api/uploadthing/core.ts.
export const mentorDocuments = pgTable(
  "mentor_documents",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    kind: text("kind").notNull(), // 'government_id' | 'cv'
    fileKey: text("file_key").notNull(),
    fileName: text("file_name"),
    uploadedAt: timestamp("uploaded_at").defaultNow(),
  },
  (t) => [
    // The admin verify screen loads a mentor's documents by user.
    index("mentor_documents_user_idx").on(t.userId, t.kind),
  ],
);

export const mentorships = pgTable(
  "mentorships",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    menteeId: uuid("mentee_id").references(() => users.id),
    mentorId: uuid("mentor_id").references(() => users.id),
    status: text("status").default("requested"), // 'requested' | 'active' | 'declined' | 'closed'
    matchScore: integer("match_score"), // 0–100, interest-tag overlap at request time
    lastActivityAt: timestamp("last_activity_at"),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (t) => [
    // Both portals list a person's mentorships newest-activity-first; the
    // trailing lastActivityAt lets the index satisfy the ORDER BY too.
    index("mentorships_mentee_idx").on(t.menteeId, t.lastActivityAt),
    index("mentorships_mentor_idx").on(t.mentorId, t.lastActivityAt),
  ],
);

// A unit of work a mentor assigns inside a mentorship. Completing it grows the
// mentee's tree; failing it wilts the tree. See lib/growth.ts.
export const tasks = pgTable(
  "tasks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    mentorshipId: uuid("mentorship_id").references(() => mentorships.id),
    title: text("title").notNull(),
    description: text("description"),
    status: text("status").notNull().default("assigned"), // 'assigned' | 'completed' | 'failed'
    growthPoints: integer("growth_points").notNull().default(10),
    dueDate: timestamp("due_date"), // display only — never auto-fails
    completedAt: timestamp("completed_at"),
    failedAt: timestamp("failed_at"),
    createdAt: timestamp("created_at").defaultNow(),
  },
  // The dashboard reads open tasks for one mentorship: (mentorshipId, status).
  (t) => [index("tasks_mentorship_idx").on(t.mentorshipId, t.status)],
);

// An ordered curriculum a mentor builds for a mentorship (a growth roadmap
// above the short-lived `tasks`). Both parties see the list; the mentee tracks
// their own progress against each item and the mentor authors/edits them.
export const curriculumItems = pgTable(
  "curriculum_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    mentorshipId: uuid("mentorship_id")
      .notNull()
      .references(() => mentorships.id),
    title: text("title").notNull(),
    description: text("description"),
    orderIndex: integer("order_index").notNull().default(0),
    status: text("status").notNull().default("planned"), // 'planned' | 'in_progress' | 'done'
    targetDate: timestamp("target_date"),
    completedAt: timestamp("completed_at"),
    createdAt: timestamp("created_at").defaultNow(),
  },
  // Always read as an ordered list scoped to one mentorship.
  (t) => [index("curriculum_mentorship_idx").on(t.mentorshipId, t.orderIndex)],
);

// One stateful growth tree per mentee. `stage` (and growthPoints) only ever
// increase — permanent growth. `health` falls when tasks fail and recovers when
// tasks complete — the wilt/recover dial.
export const growthTrees = pgTable("growth_trees", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .unique()
    .references(() => users.id),
  health: integer("health").notNull().default(100), // 0–100
  growthPoints: integer("growth_points").notNull().default(0), // cumulative
  stage: integer("stage").notNull().default(1), // derived from growthPoints
  updatedAt: timestamp("updated_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Parent ↔ child relationship, gated by the child's in-app consent. The parent
// sees nothing about the child until status = 'accepted'.
export const guardianLinks = pgTable(
  "guardian_links",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    parentId: uuid("parent_id")
      .notNull()
      .references(() => users.id),
    childId: uuid("child_id").references(() => users.id), // set once the child exists/claims
    childEmail: text("child_email"),
    inviteCode: text("invite_code").unique(), // for the no-account flow
    relationship: text("relationship").default("parent"), // 'parent' | 'guardian' | 'other'
    status: text("status").notNull().default("pending"), // 'pending' | 'accepted' | 'declined'
    respondedAt: timestamp("responded_at"),
    createdAt: timestamp("created_at").defaultNow(),
  },
  // Read from both ends: the parent portal by parentId, and the child's consent
  // prompt by childId/childEmail (a child may be matched before they sign up).
  (t) => [
    index("guardian_links_parent_idx").on(t.parentId),
    index("guardian_links_child_idx").on(t.childId),
    index("guardian_links_child_email_idx").on(t.childEmail),
  ],
);

export const journalEntries = pgTable(
  "journal_entries",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").references(() => users.id),
    content: text("content").notNull(),
    visibility: text("visibility").default("private"), // 'private' | 'mentor_only' | 'community'
    entryType: text("entry_type").default("free"), // 'reflection' | 'gratitude' | 'goal' | 'free'
    promptKey: text("prompt_key"), // which prompt this entry answered, if any
    keywordFlag: boolean("keyword_flag").default(false), // v1: client-side keyword match only
    syncedAt: timestamp("synced_at"),
    createdAt: timestamp("created_at").defaultNow(),
  },
  // One person's entries, newest first (journal page + dashboard latest-entry).
  (t) => [
    index("journal_entries_user_idx").on(t.userId, t.createdAt),
    // Same reason as messages_created_at_idx: the index above leads with
    // userId, so a platform-wide date range can't use it.
    index("journal_entries_created_at_idx").on(t.createdAt),
  ],
);

// Mentor feedback on a (shared) journal entry — part of the growth archive.
export const journalFeedback = pgTable("journal_feedback", {
  id: uuid("id").primaryKey().defaultRandom(),
  entryId: uuid("entry_id")
    .notNull()
    .references(() => journalEntries.id),
  mentorId: uuid("mentor_id")
    .notNull()
    .references(() => users.id),
  comment: text("comment").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Goal tracking (PRD §15).
export const goals = pgTable(
  "goals",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    title: text("title").notNull(),
    detail: text("detail"),
    targetDate: timestamp("target_date"),
    status: text("status").notNull().default("open"), // 'open' | 'done'
    createdAt: timestamp("created_at").defaultNow(),
    completedAt: timestamp("completed_at"),
  },
  (t) => [index("goals_user_idx").on(t.userId)],
);

export const schools = pgTable("schools", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  region: text("region"), // 'freetown' | 'western_rural'
  clubLeadId: uuid("club_lead_id"),
  verifiedAt: timestamp("verified_at"),
  // A school an admin turned down. Without this there was nowhere to record a
  // rejection, so the vetting route simply had no else branch: "Reject" wrote
  // nothing, reported success, and left the school in the pending queue for the
  // next admin to review again. Pending is (verified_at IS NULL AND
  // rejected_at IS NULL) — see admin/schools/page.tsx.
  rejectedAt: timestamp("rejected_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const milestones = pgTable(
  "milestones",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").references(() => users.id),
    type: text("type"), // 'purpose_quiz' | 'pad_her_power' | 'safety_module'
    completedAt: timestamp("completed_at").defaultNow(),
  },
  (t) => [unique().on(t.userId, t.type)],
);

export const safetyReports = pgTable("safety_reports", {
  id: uuid("id").primaryKey().defaultRandom(),
  reporterId: uuid("reporter_id").references(() => users.id),
  reportedId: uuid("reported_id").references(() => users.id),
  type: text("type"), // 'inappropriate' | 'concern'
  // The REPORTER's account of what happened. Not the admin's.
  notes: text("notes"),
  // What the admin did about it. The review screen has always had a notes
  // textarea, but there was no column behind it — the text was captured into
  // React state and dropped on navigation, so the record of what action was
  // taken on a safeguarding report was lost every time.
  adminNotes: text("admin_notes"),
  resolvedAt: timestamp("resolved_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const pushNotifications = pgTable(
  "push_notifications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").references(() => users.id),
    title: text("title").notNull(),
    body: text("body").notNull(),
    type: text("type"), // 'nudge' | 'match' | 'milestone' | 'broadcast' | 'task' | 'guardian'
    url: text("url"), // deep link opened on notification click / feed row tap
    readAt: timestamp("read_at"), // null = unread (drives the bell badge)
    sentAt: timestamp("sent_at").defaultNow(),
  },
  // Polled by the bell on an interval for every signed-in user, so this is a
  // constant background read: one user's feed, newest first.
  (t) => [index("push_notifications_user_idx").on(t.userId, t.sentAt)],
);

export const messages = pgTable(
  "messages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    // A message belongs to either a 1:1 mentorship or a group.
    mentorshipId: uuid("mentorship_id").references(() => mentorships.id),
    groupId: uuid("group_id").references(() => groups.id),
    senderId: uuid("sender_id").references(() => users.id),
    content: text("content").notNull(),
    attachmentUrl: text("attachment_url"), // requires a storage provider
    attachmentType: text("attachment_type"), // 'voice' | 'file' | 'image'
    keywordFlag: boolean("keyword_flag").default(false), // safeguarding heuristic
    createdAt: timestamp("created_at").defaultNow(),
  },
  // Threads are polled every few seconds, so these are the hottest reads in the
  // app: fetch one thread in time order (and, for polling, only rows after a
  // cursor — which the trailing createdAt makes an index range scan).
  (t) => [
    index("messages_mentorship_idx").on(t.mentorshipId, t.createdAt),
    index("messages_group_idx").on(t.groupId, t.createdAt),
    // Admin analytics counts messages platform-wide in a date range. The two
    // indexes above lead with a scope id, so neither can serve a global
    // `created_at >= x` — without this it is a seq scan of the largest table in
    // the app on every analytics load.
    index("messages_created_at_idx").on(t.createdAt),
  ],
);

// Payment plans (PRD §20): mentor subscriptions, one-time packages,
// scholarship sponsorships. Seeded by admins.
export const paymentPlans = pgTable("payment_plans", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  kind: text("kind").notNull(), // 'subscription' | 'package' | 'scholarship'
  amount: integer("amount").notNull(), // minor units (e.g. cents/leones)
  interval: text("interval"), // 'monthly' | null for one-time
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// A payment attempt/record. `provider` is 'stub' until Monime is wired.
export const payments = pgTable("payments", {
  id: uuid("id").primaryKey().defaultRandom(),
  payerId: uuid("payer_id")
    .notNull()
    .references(() => users.id),
  planId: uuid("plan_id").references(() => paymentPlans.id),
  menteeId: uuid("mentee_id").references(() => users.id),
  amount: integer("amount").notNull(),
  status: text("status").notNull().default("pending"), // 'pending'|'paid'|'failed'|'refunded'
  provider: text("provider").notNull().default("stub"), // 'monime' | 'stub'
  providerRef: text("provider_ref"),
  createdAt: timestamp("created_at").defaultNow(),
  paidAt: timestamp("paid_at"),
});

export const invoices = pgTable("invoices", {
  id: uuid("id").primaryKey().defaultRandom(),
  paymentId: uuid("payment_id")
    .notNull()
    .references(() => payments.id),
  number: text("number").notNull(),
  issuedAt: timestamp("issued_at").defaultNow(),
});

// Group discussions (PRD §14). Any signed-in member can post.
export const groups = pgTable("groups", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  description: text("description"),
  createdBy: uuid("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const groupMembers = pgTable(
  "group_members",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    groupId: uuid("group_id")
      .notNull()
      .references(() => groups.id),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    createdAt: timestamp("created_at").defaultNow(),
  },
  // The unique constraint already indexes (groupId, userId) — so "who is in this
  // group" is covered. The reverse lookup, "which groups is this user in", needs
  // its own index because userId is not the leading column there.
  (t) => [
    unique().on(t.groupId, t.userId),
    index("group_members_user_idx").on(t.userId),
  ],
);

// Events / activities organised on the platform. Created and managed by admins.
export const events = pgTable(
  "events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    title: text("title").notNull(),
    description: text("description"),
    location: text("location"),
    region: text("region"), // 'freetown' | 'western_rural'
    startsAt: timestamp("starts_at").notNull(),
    endsAt: timestamp("ends_at"),
    capacity: integer("capacity"), // null = unlimited
    // 'workshop'|'training'|'networking'|'wellness'|'camp'|'picnic'
    type: text("type").default("workshop"),
    // Roadmap completion % required to register (e.g. Picnic = 50). 0 = open.
    unlockAtPercent: integer("unlock_at_percent").default(0),
    createdBy: uuid("created_by").references(() => users.id),
    createdAt: timestamp("created_at").defaultNow(),

    // --- Public site fields (added with the marketing CMS) ---------------
    // Deliberately nullable/defaulted: the app reads this table with
    // `db.select().from(events)` and must keep working untouched.
    //
    // isPublic defaults to FALSE so no internal activity — a safeguarding
    // session, a mentor training — appears on the public website because
    // somebody forgot a checkbox. Publishing is a decision, not a default.
    // Uniqueness is enforced by a unique INDEX in the table config below, not by
    // .unique() here. Adding a unique *constraint* to a table that already has
    // rows makes drizzle-kit push offer to truncate it — and this table holds
    // live event and attendance data for the app. A unique index gets the same
    // guarantee with no such offer. NULLs are distinct in Postgres, so existing
    // rows without a slug do not collide.
    slug: text("slug"),
    imageUrl: text("image_url"),
    isPublic: boolean("is_public").default(false),
    // The post-event report the public Events page shows for past events.
    reportSummary: text("report_summary"),
    reportPartners: text("report_partners"),
    reportImpact: text("report_impact"),
  },
  // The activities list is always ordered by start time.
  (t) => [
    index("events_starts_at_idx").on(t.startsAt),
    // The public Events page filters on isPublic and orders by start time; the
    // trailing column lets one index satisfy both.
    index("events_public_idx").on(t.isPublic, t.startsAt),
    uniqueIndex("events_slug_idx").on(t.slug),
  ],
);

// One row per user signed up to an event. `status` tracks attendance so admins
// can report event-attendance rates.
export const eventAttendance = pgTable(
  "event_attendance",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    eventId: uuid("event_id")
      .notNull()
      .references(() => events.id),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    status: text("status").notNull().default("registered"), // 'registered' | 'attended' | 'no_show'
    rsvpAt: timestamp("rsvp_at").defaultNow(),
    checkedInAt: timestamp("checked_in_at"),
    createdAt: timestamp("created_at").defaultNow(),
  },
  // As above: unique() covers the eventId-leading lookup; "which events has this
  // user signed up for" (activities page, parent portal) needs userId indexed.
  (t) => [
    unique().on(t.eventId, t.userId),
    index("event_attendance_user_idx").on(t.userId),
  ],
);

// Lightweight satisfaction survey responses (1–5). Feeds the satisfaction KPI
// on the admin analytics page.
export const satisfactionSurveys = pgTable("satisfaction_surveys", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id),
  score: integer("score").notNull(), // 1–5
  comment: text("comment"),
  context: text("context").default("general"), // 'general' | 'mentorship' | 'event'
  createdAt: timestamp("created_at").defaultNow(),
});

// Verified in-person meetings for a mentorship (PRD §18). Three required:
// 1 Introduction, 2 Progress Review, 3 Graduation. Verified by GPS, QR or photo.
export const meetingVerifications = pgTable(
  "meeting_verifications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    mentorshipId: uuid("mentorship_id")
      .notNull()
      .references(() => mentorships.id),
    meetingNumber: integer("meeting_number").notNull(), // 1 | 2 | 3
    method: text("method").notNull(), // 'gps' | 'qr' | 'photo'
    lat: text("lat"),
    lng: text("lng"),
    photoUrl: text("photo_url"),
    verifiedAt: timestamp("verified_at").defaultNow(),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (t) => [unique().on(t.mentorshipId, t.meetingNumber)],
);

// ---------------------------------------------------------------------------
// Public website content (CMS)
//
// Everything below backs findingyourikigai.org and is edited from /admin/cms.
// None of it is read by the PWA.
//
// Two conventions hold across every table here:
//
//   published  — defaults to FALSE. The public readers in lib/cms.ts filter on
//                it; the admin screens ignore it. Nothing reaches the website
//                because somebody saved a half-written draft.
//   orderIndex — the site is a curated page, not a feed. Which programme leads
//                the homepage is an editorial decision, so ordering is stored
//                rather than derived from createdAt.
//
// Reads are cached by tag and invalidated on write — see lib/cms.ts. The
// indexes below are therefore for the admin screens and cache misses, not for
// every visitor.
// ---------------------------------------------------------------------------

// The four pillars every programme sits under: Discover, Thrive, Build, Lead.
// Structural rather than editorial, but editable so the organisation can grow a
// fifth without a deploy.
export const pillars = pgTable(
  "pillars",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: text("slug").notNull().unique(),
    name: text("name").notNull(),
    tagline: text("tagline"),
    description: text("description"),
    icon: text("icon"), // emoji shown on the pillar card
    // One of the GlowCard variants already in components/marketing/glow-card.tsx:
    // 'green' | 'amber' | 'earth' | 'sage'. Kept as a token name, not a colour,
    // so pillars stay inside the design system when the palette changes.
    accent: text("accent").default("green"),
    orderIndex: integer("order_index").default(0),
    published: boolean("published").default(false),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (t) => [index("pillars_published_idx").on(t.published, t.orderIndex)],
);

// An initiative: PadHer, Spark The STEM, Mentorship, and so on.
export const programmes = pgTable(
  "programmes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: text("slug").notNull().unique(),
    pillarId: uuid("pillar_id").references(() => pillars.id),
    name: text("name").notNull(),
    summary: text("summary"), // one-liner for cards
    heroImageUrl: text("hero_image_url"),
    about: text("about"), // why this programme exists
    objectives: jsonb("objectives"), // string[] — what participants gain
    activities: jsonb("activities"), // string[] — what actually happens
    // Impact is text, not a number: "2,000+" and "Multiple" are both real
    // answers on this site, and rounding them into an integer would force the
    // CMS to lie about precision the organisation does not have.
    impactValue: text("impact_value"),
    impactLabel: text("impact_label"),
    ctaLabel: text("cta_label"),
    ctaUrl: text("cta_url"),
    featured: boolean("featured").default(false), // surfaces on the homepage
    orderIndex: integer("order_index").default(0),
    published: boolean("published").default(false),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (t) => [
    index("programmes_published_idx").on(t.published, t.orderIndex),
    index("programmes_pillar_idx").on(t.pillarId),
  ],
);

// Participant, volunteer, partner and impact stories — the blog.
export const stories = pgTable(
  "stories",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: text("slug").notNull().unique(),
    title: text("title").notNull(),
    // 'participant' | 'volunteer' | 'partner' | 'impact'
    category: text("category").notNull().default("impact"),
    excerpt: text("excerpt"),
    body: text("body"),
    coverImageUrl: text("cover_image_url"),
    authorName: text("author_name"),
    programmeId: uuid("programme_id").references(() => programmes.id),
    // When it went live, which is not when the row was created — a story can be
    // drafted for weeks. The public list orders on this.
    publishedAt: timestamp("published_at"),
    published: boolean("published").default(false),
    orderIndex: integer("order_index").default(0),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (t) => [
    index("stories_published_idx").on(t.published, t.publishedAt),
    index("stories_category_idx").on(t.category),
  ],
);

// The photo archive. An item belongs to a named album ("PadHer Initiative",
// "School Outreach") and optionally to a programme, so a programme page can
// show its own photos without the albums being duplicated per programme.
export const galleryItems = pgTable(
  "gallery_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    album: text("album").notNull(),
    programmeId: uuid("programme_id").references(() => programmes.id),
    imageUrl: text("image_url").notNull(),
    caption: text("caption"),
    orderIndex: integer("order_index").default(0),
    published: boolean("published").default(false),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (t) => [
    index("gallery_album_idx").on(t.album, t.orderIndex),
    index("gallery_programme_idx").on(t.programmeId),
  ],
);

export const partners = pgTable(
  "partners",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    logoUrl: text("logo_url"),
    websiteUrl: text("website_url"),
    description: text("description"),
    orderIndex: integer("order_index").default(0),
    published: boolean("published").default(false),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (t) => [index("partners_published_idx").on(t.published, t.orderIndex)],
);

// The homepage impact dashboard. Text values for the same reason as
// programmes.impactValue.
export const impactStats = pgTable(
  "impact_stats",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    value: text("value").notNull(), // "2,000+"
    label: text("label").notNull(), // "Girls Reached"
    orderIndex: integer("order_index").default(0),
    published: boolean("published").default(false),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (t) => [index("impact_stats_published_idx").on(t.published, t.orderIndex)],
);

export const teamMembers = pgTable(
  "team_members",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    role: text("role"),
    bio: text("bio"),
    photoUrl: text("photo_url"),
    orderIndex: integer("order_index").default(0),
    published: boolean("published").default(false),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (t) => [index("team_members_published_idx").on(t.published, t.orderIndex)],
);

// Singleton copy blocks: the homepage hero, the mission, the vision, the values
// list. Keyed rather than one row per field so adding an editable block is a
// CMS entry, not a migration. `value` is jsonb because some blocks are a single
// string and others (values, hero with headline + sub + two CTAs) are shaped.
//
// No `published` column: these are edits to live copy, not drafts. There is no
// sensible "unpublished homepage headline" — the page would render a hole.
export const siteCopy = pgTable("site_copy", {
  key: text("key").primaryKey(), // 'hero' | 'mission' | 'vision' | 'values' | 'about_intro'
  value: jsonb("value").notNull(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// A shared media library. Images uploaded here are not tied to any one record —
// the admin builds up a stock of campaign photos and logos as they come in, and
// pastes a URL into whichever programme, story or partner needs it later. This
// is why the CMS image fields also accept a pasted URL, not only a fresh
// upload: the same photo often belongs to several places.
//
// Only the URL is stored (bytes live in UploadThing, uploaded browser-direct).
export const mediaAssets = pgTable(
  "media_assets",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    url: text("url").notNull(),
    label: text("label"),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (t) => [index("media_assets_created_idx").on(t.createdAt)],
);

// Everything submitted through the public site: the four Get Involved forms and
// the contact form.
//
// This exists because the contact form never stored anything — it built a
// `mailto:` link and handed the visitor to their own mail client, so every
// enquiry that did not survive that handoff was simply lost, with nobody aware
// it had been sent. A volunteer offering their time deserves better than that.
export const enquiries = pgTable(
  "enquiries",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    // 'volunteer' | 'mentor' | 'partner' | 'programme' | 'contact'
    type: text("type").notNull(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    phone: text("phone"),
    organization: text("organization"),
    message: text("message"),
    // Type-specific answers — skills and interest area for a volunteer,
    // availability for a mentor, chosen programme for a registration. Kept as
    // jsonb so a new form field does not need a migration and an unrelated
    // form does not carry a column it never fills.
    details: jsonb("details"),
    status: text("status").notNull().default("new"), // 'new' | 'in_progress' | 'handled'
    handledBy: uuid("handled_by").references(() => users.id),
    handledAt: timestamp("handled_at"),
    createdAt: timestamp("created_at").defaultNow(),
  },
  // The inbox is filtered by status and type, newest first.
  (t) => [
    index("enquiries_status_idx").on(t.status, t.createdAt),
    index("enquiries_type_idx").on(t.type),
  ],
);

// Mentee/parent reviews of a mentor — powers marketplace ratings + testimonials.
// One review per author per mentor.
export const mentorReviews = pgTable(
  "mentor_reviews",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    mentorId: uuid("mentor_id")
      .notNull()
      .references(() => users.id),
    authorId: uuid("author_id")
      .notNull()
      .references(() => users.id),
    rating: integer("rating").notNull(), // 1–5
    comment: text("comment"),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (t) => [unique().on(t.mentorId, t.authorId)],
);
