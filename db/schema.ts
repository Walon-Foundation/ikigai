import {
  boolean,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";

export const roleEnum = pgEnum("role", [
  "mentee",
  "mentor",
  "club_lead",
  "parent",
  "admin",
]);

export const users = pgTable("users", {
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
  verifiedAt: timestamp("verified_at"),
  pushSubscription: jsonb("push_subscription"), // Web Push subscription object
  onboardingData: jsonb("onboarding_data"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const mentorships = pgTable("mentorships", {
  id: uuid("id").primaryKey().defaultRandom(),
  menteeId: uuid("mentee_id").references(() => users.id),
  mentorId: uuid("mentor_id").references(() => users.id),
  status: text("status").default("requested"), // 'requested' | 'active' | 'declined' | 'closed'
  matchScore: integer("match_score"), // 0–100, interest-tag overlap at request time
  lastActivityAt: timestamp("last_activity_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// A unit of work a mentor assigns inside a mentorship. Completing it grows the
// mentee's tree; failing it wilts the tree. See lib/growth.ts.
export const tasks = pgTable("tasks", {
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
});

// An ordered curriculum a mentor builds for a mentorship (a growth roadmap
// above the short-lived `tasks`). Both parties see the list; the mentee tracks
// their own progress against each item and the mentor authors/edits them.
export const curriculumItems = pgTable("curriculum_items", {
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
});

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
export const guardianLinks = pgTable("guardian_links", {
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
});

export const journalEntries = pgTable("journal_entries", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id),
  content: text("content").notNull(),
  visibility: text("visibility").default("private"), // 'private' | 'mentor_only' | 'community'
  entryType: text("entry_type").default("free"), // 'reflection' | 'gratitude' | 'goal' | 'free'
  promptKey: text("prompt_key"), // which prompt this entry answered, if any
  keywordFlag: boolean("keyword_flag").default(false), // v1: client-side keyword match only
  syncedAt: timestamp("synced_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

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
export const goals = pgTable("goals", {
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
});

export const schools = pgTable("schools", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  region: text("region"), // 'freetown' | 'western_rural'
  clubLeadId: uuid("club_lead_id"),
  verifiedAt: timestamp("verified_at"),
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
  notes: text("notes"),
  resolvedAt: timestamp("resolved_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const pushNotifications = pgTable("push_notifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id),
  title: text("title").notNull(),
  body: text("body").notNull(),
  type: text("type"), // 'nudge' | 'match' | 'milestone' | 'broadcast' | 'task' | 'guardian'
  url: text("url"), // deep link opened on notification click / feed row tap
  readAt: timestamp("read_at"), // null = unread (drives the bell badge)
  sentAt: timestamp("sent_at").defaultNow(),
});

export const messages = pgTable("messages", {
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
});

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
  (t) => [unique().on(t.groupId, t.userId)],
);

// Events / activities organised on the platform. Created and managed by admins.
export const events = pgTable("events", {
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
});

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
  (t) => [unique().on(t.eventId, t.userId)],
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
