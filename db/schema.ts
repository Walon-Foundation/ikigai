import {pgTable, uuid, text, integer, timestamp, jsonb, pgEnum, boolean  } from "drizzle-orm/pg-core"

export const roleEnum = pgEnum("role", ["mentee", "mentor", "club_lead", "admin"])

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  clerkId: text("clerk_id").notNull().unique(),
  role: roleEnum("role").notNull().default("mentee"),
  displayName: text("display_name"),
  bio: text("bio"),
  interestTags: text("interest_tags").array(),
  schoolId: uuid("school_id").references(() => schools.id),
  growthLevel: integer("growth_level").default(1), // 1=Explorer, 2=Advocate, 3=Mentor
  verifiedAt: timestamp("verified_at"),
  pushSubscription: jsonb("push_subscription"),    // Web Push subscription object
  createdAt: timestamp("created_at").defaultNow(),
});

export const mentorships = pgTable("mentorships", {
  id: uuid("id").primaryKey().defaultRandom(),
  menteeId: uuid("mentee_id").references(() => users.id),
  mentorId: uuid("mentor_id").references(() => users.id),
  status: text("status").default("icebreaker"), // 'icebreaker' | 'active' | 'flagged' | 'closed'
  matchScore: integer("match_score"),
  lastActivityAt: timestamp("last_activity_at"),
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
  region: text("region"),                  // 'freetown' | 'western_rural'
  clubLeadId: uuid("club_lead_id"),
  verifiedAt: timestamp("verified_at"),
});

export const milestones = pgTable("milestones", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id),
  type: text("type"),                      // 'purpose_quiz' | 'pad_her_power' | 'safety_module'
  completedAt: timestamp("completed_at").defaultNow(),
});

export const safetyReports = pgTable("safety_reports", {
  id: uuid("id").primaryKey().defaultRandom(),
  reporterId: uuid("reporter_id").references(() => users.id),
  reportedId: uuid("reported_id").references(() => users.id),
  type: text("type"),                      // 'inappropriate' | 'concern'
  notes: text("notes"),
  resolvedAt: timestamp("resolved_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const pushNotifications = pgTable("push_notifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id),
  title: text("title").notNull(),
  body: text("body").notNull(),
  type: text("type"),                      // 'nudge' | 'match' | 'milestone' | 'broadcast'
  sentAt: timestamp("sent_at").defaultNow(),
});

export const messages = pgTable("messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  mentorshipId: uuid("mentorship_id").references(() => mentorships.id),
  senderId: uuid("sender_id").references(() => users.id),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});