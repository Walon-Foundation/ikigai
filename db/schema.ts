import { sql } from "drizzle-orm";
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

// The four programme stages a mentee moves through. Declared up here rather
// than beside the skill tables because `users.currentStage` needs it: a const
// is in its temporal dead zone until evaluated, so a pgEnum used by an earlier
// pgTable has to be defined before it.
export const skillStageEnum = pgEnum("skill_stage", [
  "discover",
  "thrive",
  "build",
  "lead",
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
    // The mentee's programme stage: DISCOVER → THRIVE → BUILD → LEAD.
    //
    // Distinct from skillTracks.currentStage, which is per-skill — a mentee
    // tracking three interests has three of those, at three different stages.
    // This is the single stage the mentee IS at, and it is what club
    // recommendations and the mentor's promote button read. Only a mentor
    // moves it (see lib/mentorship.ts promoteMenteeStage); nothing the mentee
    // does advances it on its own.
    currentStage: skillStageEnum("current_stage").notNull().default("discover"),
    // When the mentee entered currentStage. The pacing floor is measured from
    // here, so it resets on every promotion rather than running from signup.
    stageStartedAt: timestamp("stage_started_at").defaultNow(),
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
    // A mentor application an admin turned down, and the reason they gave.
    //
    // Rejection used to be recorded by writing `role` back to "mentee". That
    // destroyed the record instead of deciding it: every admin mentor query
    // filters on role = 'mentor', so a rejected applicant disappeared from
    // Pending and Verified alike, their verify URL 404'd, and no admin screen
    // can set a role back — a misclick was unrecoverable in-product, and the
    // government ID and CV they had submitted stayed on a row that no longer
    // looked like an application at all. `role` is what a person IS on the
    // platform; a verification decision is a fact ABOUT their application, and
    // the two must not share a column. Same reasoning as schools.rejected_at:
    // pending means undecided (verified_at IS NULL AND rejected_at IS NULL),
    // not merely unverified — see admin/mentors/page.tsx.
    //
    // The reason is mandatory in the admin UI before Reject is enabled. It is
    // an internal note for whoever follows up, not a column the applicant is
    // shown: the rejection email says the team will be in touch, and this is
    // what the team reads when they are. Before it existed the applicant was
    // told "your application needs more information" and nobody — including the
    // admin who sent that — could say what information was missing.
    rejectedAt: timestamp("rejected_at"),
    rejectionReason: text("rejection_reason"),
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
    // The mentor marketplace filters on exactly this pair — and so does the
    // mentee approval queue, which reuses these same decision columns.
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
    // When the mentor accepted, and when the 3-month base mentorship is up.
    //
    // baseEndsAt is stored rather than computed from startedAt because the base
    // duration is a term of THIS agreement: changing BASE_MENTORSHIP_MONTHS
    // later must not silently move the end date of a mentorship already under
    // way. It is a marker, not a kill switch — nothing expires on its own, and
    // the pair keep working past it until someone closes the mentorship.
    startedAt: timestamp("started_at"),
    baseEndsAt: timestamp("base_ends_at"),
    lastActivityAt: timestamp("last_activity_at"),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (t) => [
    // Both portals list a person's mentorships newest-activity-first; the
    // trailing lastActivityAt lets the index satisfy the ORDER BY too.
    index("mentorships_mentee_idx").on(t.menteeId, t.lastActivityAt),
    index("mentorships_mentor_idx").on(t.mentorId, t.lastActivityAt),
    // One mentor at a time. A partial unique index, so the constraint binds
    // only the ACTIVE row — a mentee may still have many 'requested',
    // 'declined' and 'closed' rows, including several closed mentorships with
    // the same mentor over time.
    //
    // Enforced here as well as in the accept action because the action's check
    // is read-then-write: two mentors accepting the same mentee in the same
    // moment both read zero active mentorships and both write one. Only the
    // database can refuse the second.
    uniqueIndex("mentorships_one_active_mentor_idx")
      .on(t.menteeId)
      .where(sql`${t.status} = 'active'`),
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
    // 'assigned' → 'submitted' (mentee sent evidence) → 'completed' | 'failed'.
    // Only a mentor writes 'completed' or 'failed'; see the note on
    // requiresEvidence below and lib/mentorship.ts.
    status: text("status").notNull().default("assigned"),
    growthPoints: integer("growth_points").notNull().default(10),
    // Which programme stage this task counts towards. Stage promotion counts
    // completed tasks in the mentee's current stage, so a task with no stage
    // counts towards none of them.
    stage: skillStageEnum("stage"),
    // Whether the mentee must file evidence before the mentor can complete it.
    // Default true: the programme rule is that every task is evidenced. The
    // column exists so a mentor can waive it for something evidence does not
    // fit — a conversation, a visit — rather than being forced to fake a PDF.
    requiresEvidence: boolean("requires_evidence").notNull().default(true),
    dueDate: timestamp("due_date"), // display only — never auto-fails
    submittedAt: timestamp("submitted_at"),
    completedAt: timestamp("completed_at"),
    failedAt: timestamp("failed_at"),
    createdAt: timestamp("created_at").defaultNow(),
  },
  // The dashboard reads open tasks for one mentorship: (mentorshipId, status).
  (t) => [index("tasks_mentorship_idx").on(t.mentorshipId, t.status)],
);

// A question on a task's on-platform test. Multiple choice, authored by the
// mentor alongside the task, graded by the platform.
//
// `correctIndex` is why every read of this table for a mentee must select
// columns explicitly: `SELECT *` here hands the answer key to the browser.
// See lib/tasks.ts, which is the only place that reads it.
export const taskQuestions = pgTable(
  "task_questions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    taskId: uuid("task_id")
      .notNull()
      .references(() => tasks.id),
    prompt: text("prompt").notNull(),
    options: text("options").array().notNull(),
    correctIndex: integer("correct_index").notNull(),
    orderIndex: integer("order_index").notNull().default(0),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (t) => [index("task_questions_task_idx").on(t.taskId, t.orderIndex)],
);

// The evidence a mentee files against a task.
//
// The programme accepts one of exactly two bundles, which is what `kind`
// names:
//   'test_and_photo' — pass the task's on-platform test AND attach a photo
//   'pdf'            — submit the assignment as a PDF
// Neither is a partial credit: isComplete() in lib/tasks.ts decides whether a
// row actually satisfies its own kind, and the mentor's complete button is
// refused until it does.
//
// One row per task, replaced on resubmission — the same
// upload-replaces-previous shape as mentorDocuments. Files are stored as
// UploadThing keys under a private ACL, so there is no URL until the reviewer
// mints a signed one.
export const taskSubmissions = pgTable(
  "task_submissions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    taskId: uuid("task_id")
      .notNull()
      .unique()
      .references(() => tasks.id),
    menteeId: uuid("mentee_id")
      .notNull()
      .references(() => users.id),
    kind: text("kind").notNull(), // 'test_and_photo' | 'pdf'
    // 'test_and_photo' half.
    testScore: integer("test_score"),
    testTotal: integer("test_total"),
    testPassedAt: timestamp("test_passed_at"),
    photoFileKey: text("photo_file_key"),
    photoFileName: text("photo_file_name"),
    // 'pdf' half.
    pdfFileKey: text("pdf_file_key"),
    pdfFileName: text("pdf_file_name"),
    note: text("note"),
    submittedAt: timestamp("submitted_at").defaultNow(),
  },
  (t) => [index("task_submissions_mentee_idx").on(t.menteeId)],
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

// A category of skill (Advocacy, Software Engineering, Fashion & Tailoring,
// ...) with the milestone templates that define its automatic DISCOVER→
// THRIVE→BUILD→LEAD track. Admin-managed at /admin/skills — unlike the
// marketing CMS tables below, these ARE read by the PWA. `aliases` classifies
// a mentee's free-text users.interestTags entry into a category (see
// lib/skill-classifier.ts); a tag matching nothing falls back to whichever
// category has isFallback = true.
export const skillCategories = pgTable(
  "skill_categories",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: text("slug").notNull().unique(),
    name: text("name").notNull(),
    description: text("description"),
    aliases: text("aliases").array(),
    isFallback: boolean("is_fallback").notNull().default(false),
    orderIndex: integer("order_index").default(0),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (t) => [index("skill_categories_order_idx").on(t.orderIndex)],
);

// One generated milestone in a category's track — the content library behind
// automatic milestone generation, written once per category instead of
// hand-built per mentee. `dimension` is one of the seven formula dimensions
// ('knowledge'|'tools'|'practice'|'output'|'feedback'|'real_world'|'impact').
// `requiresMentorReview` splits that formula into what a mentee can self-check
// (knowledge/tools/practice) and what needs a mentor's sign-off before it
// counts (output/feedback/real_world/impact).
export const milestoneTemplates = pgTable(
  "milestone_templates",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    categoryId: uuid("category_id")
      .notNull()
      .references(() => skillCategories.id),
    stage: skillStageEnum("stage").notNull(),
    dimension: text("dimension").notNull(),
    label: text("label").notNull(),
    requiresMentorReview: boolean("requires_mentor_review")
      .notNull()
      .default(false),
    growthPoints: integer("growth_points").notNull().default(10),
    orderIndex: integer("order_index").default(0),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  // A category's full track, read in stage/order to instantiate a mentee's
  // track and to render the admin list grouped the same way.
  (t) => [
    index("milestone_templates_category_idx").on(
      t.categoryId,
      t.stage,
      t.orderIndex,
    ),
  ],
);

// One mentee's auto-generated track for one of their interest tags — created
// lazily the first time they view Journey (see lib/skill-tracks.ts).
// `mentorshipId` is whichever active mentorship it's reviewed under, if any: a
// mentee can be tracking a skill before being matched with a mentor for it.
export const skillTracks = pgTable(
  "skill_tracks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    menteeId: uuid("mentee_id")
      .notNull()
      .references(() => users.id),
    interestTag: text("interest_tag").notNull(), // the raw tag this was generated from
    categoryId: uuid("category_id")
      .notNull()
      .references(() => skillCategories.id),
    mentorshipId: uuid("mentorship_id").references(() => mentorships.id),
    currentStage: skillStageEnum("current_stage").notNull().default("discover"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (t) => [
    unique().on(t.menteeId, t.interestTag),
    index("skill_tracks_mentorship_idx").on(t.mentorshipId),
  ],
);

// A skillTrack's instantiated copy of one milestoneTemplate — what the mentee
// actually sees and checks off, and what a mentor reviews. Status progression:
// 'locked' (a future stage) → 'available' → 'submitted' (mentor-review items
// only) → 'done'. Completing one awards its growthPoints via the same
// lib/growth-tree.ts applyTaskComplete tasks already use.
export const skillMilestones = pgTable(
  "skill_milestones",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    skillTrackId: uuid("skill_track_id")
      .notNull()
      .references(() => skillTracks.id),
    templateId: uuid("template_id")
      .notNull()
      .references(() => milestoneTemplates.id),
    status: text("status").notNull().default("locked"),
    mentorFeedback: text("mentor_feedback"),
    submittedAt: timestamp("submitted_at"),
    completedAt: timestamp("completed_at"),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (t) => [
    unique().on(t.skillTrackId, t.templateId),
    index("skill_milestones_track_idx").on(t.skillTrackId, t.status),
  ],
);

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
// A club. Created by a mentee inside the PWA, and — per the programme rule —
// listed on the public website automatically, with no approval step.
//
// `hiddenAt` is the counterweight to that. Automatic publication means
// mentee-written text reaches a public page with no human in front of it, so
// there has to be a way to take one down after the fact; `keywordFlag` runs the
// same safeguarding check the journal and group messages use (lib/journal.ts)
// so the admin queue surfaces the risky ones rather than waiting to be told.
// A hidden club still works inside the app — hiding is not deleting.
export const groups = pgTable(
  "groups",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    // Public URL segment, derived from the name at creation and never changed
    // after — a live /clubs/<slug> link must not rot because someone renamed
    // their club.
    slug: text("slug").notNull().unique(),
    description: text("description"),
    // What this club is about, in the same free vocabulary as
    // users.interestTags — that is what makes the two comparable, and club
    // recommendation is tag overlap between them (lib/clubs.ts).
    interestTags: text("interest_tags").array(),
    // The programme stage this club suits, or null for "any stage".
    stage: skillStageEnum("stage"),
    createdBy: uuid("created_by").references(() => users.id),
    keywordFlag: boolean("keyword_flag").notNull().default(false),
    hiddenAt: timestamp("hidden_at"),
    hiddenReason: text("hidden_reason"),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (t) => [
    // The public listing reads visible clubs newest-first.
    index("groups_hidden_idx").on(t.hiddenAt, t.createdAt),
  ],
);

// Every stage promotion, and who pressed it.
//
// The mentee's stage lives on users.currentStage, which only ever holds the
// latest value. This is the record of how they got there: a promotion is a
// mentor's judgement about a young person's progress, and "who decided this,
// when, and against which mentorship" is not something to leave inferable only
// from a timestamp that the next promotion overwrites.
export const menteeStagePromotions = pgTable(
  "mentee_stage_promotions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    menteeId: uuid("mentee_id")
      .notNull()
      .references(() => users.id),
    mentorId: uuid("mentor_id").references(() => users.id),
    mentorshipId: uuid("mentorship_id").references(() => mentorships.id),
    fromStage: skillStageEnum("from_stage").notNull(),
    toStage: skillStageEnum("to_stage").notNull(),
    // Filled when an admin overrides the pacing floor, so an early promotion is
    // never silent.
    overrodePacing: boolean("overrode_pacing").notNull().default(false),
    note: text("note"),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (t) => [index("stage_promotions_mentee_idx").on(t.menteeId, t.createdAt)],
);

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
    // Admin toggle — when false the event is still listed as upcoming/ongoing
    // but volunteering/joining is blocked (same semantics as programmes.allowVolunteer).
    // Defaults to true so existing rows remain joinable. Date lifecycle via
    // endsAt is the primary gate; this is the manual override.
    allowVolunteer: boolean("allow_volunteer").default(true),
    allowJoin: boolean("allow_join").default(true),
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
    // Date lifecycle — a volunteer must not be able to volunteer for a past
    // programme. When both are null the programme is considered date-less and
    // therefore always active (backwards-compat for seeded rows). Otherwise
    // endsAt is the authoritative end; startsAt alone means a single-day or
    // start-only programme. allowVolunteer lets an admin close volunteering
    // even when the date is still in the future (and also gates the Join CTA).
    startsAt: timestamp("starts_at"),
    endsAt: timestamp("ends_at"),
    allowVolunteer: boolean("allow_volunteer").default(true),
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
    // 'new' | 'in_progress' | 'handled' | 'closed'
    //
    // 'handled' is the ACCEPTED outcome: it sends the enquirer a congratulatory
    // acceptance email. That is not what the word means in ordinary English —
    // an operator marking a declined volunteer "handled" (I dealt with this)
    // was congratulating them, unrecallably. 'closed' is the outcome that sends
    // nothing, and the admin dropdown now labels both by their consequence.
    // 'handled' is kept rather than renamed because rows already carry it and a
    // rename would silently reclassify decisions that were already made.
    status: text("status").notNull().default("new"),
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

// ---------------------------------------------------------------------------
// Page builder — drag-and-drop block ordering for marketing pages.
//
// A page (keyed by a route string, e.g. "home") is an ordered stack of blocks.
// `type` looks up a renderer and an admin field schema in
// lib/blocks/registry.ts; `config` is that block's own shape — a hero's
// headline/body/CTAs, a dynamic section's optional heading override, and so
// on — kept as jsonb because every block type has a different shape and a new
// block type must not need a migration.
//
// Same conventions as the CMS tables above: `published` defaults to true here
// (unlike the CMS defaulting to false) because a block is placed on a live
// page by an admin who is already looking at where it lands, not drafted in
// isolation the way a story or programme is — but it still exists so a block
// can be hidden without deleting and losing its configured copy. `orderIndex`
// is curated, not derived from createdAt, same reasoning as everywhere else.
export const pageBlocks = pgTable(
  "page_blocks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    page: text("page").notNull(),
    type: text("type").notNull(),
    config: jsonb("config").notNull().default({}),
    orderIndex: integer("order_index").notNull().default(0),
    published: boolean("published").notNull().default(true),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  // The renderer always reads one page's blocks in display order.
  (t) => [index("page_blocks_page_order_idx").on(t.page, t.orderIndex)],
);

// A marketing page an admin created from scratch — content that wasn't part
// of the original site design and has no dedicated route file. Rendered by
// the catch-all app/(marketing)/[slug]/page.tsx, which looks up a published
// row here and then renders `<PageBlocks page={slug} />` — the exact same
// block system the coded pages use, so nothing about page_blocks or the
// registry needed to change for this to work. The 14 built-in routes (home +
// the 13 named pages) do NOT get a row here; they're real files and don't
// need a URL to be resolved at request time.
export const marketingPages = pgTable("marketing_pages", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  metaDescription: text("meta_description"),
  published: boolean("published").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Singleton copy blocks for the authenticated app (PWA) — the app_copy
// counterpart to siteCopy above. A separate table rather than reusing
// siteCopy because these are two different products with two different admin
// screens (/admin/cms/copy vs /admin/app-copy), and a key typo should not be
// able to make a website edit land in the app or vice versa. Same shape and
// the same reasoning: `value` is jsonb because some blocks are a single
// string and others are shaped objects, and there's no `published` column
// because these are edits to live app copy, not drafts — a missing key falls
// back to the code default in lib/app-copy.ts rather than rendering a hole.
export const appCopy = pgTable("app_copy", {
  key: text("key").primaryKey(),
  value: jsonb("value").notNull(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

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
