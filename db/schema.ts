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
  keywordFlag: boolean("keyword_flag").default(false), // v1: client-side keyword match only
  syncedAt: timestamp("synced_at"),
  createdAt: timestamp("created_at").defaultNow(),
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
  sentAt: timestamp("sent_at").defaultNow(),
});

export const messages = pgTable("messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  mentorshipId: uuid("mentorship_id").references(() => mentorships.id),
  senderId: uuid("sender_id").references(() => users.id),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

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
