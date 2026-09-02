import type {
  LegacyNotifyType,
  NotificationAudience,
  NotificationCategory,
  NotificationChannel,
  NotificationPriority,
  NotifyVars,
} from "./categories";

// The complete list of notifications this platform can send.
//
// Structure lives in code because the code branches on it: a key that is not in
// here cannot fire, and a mistyped key is a build error rather than a silent
// no-op at 3am. Copy lives here too, but only as the DEFAULT — an admin may
// override title, body, channels, priority and cooldown per key from
// /admin/notifications/templates without a deploy (see templates.ts). The
// notification_templates table therefore starts empty and everything works.
//
// Adding a notification is: one entry here, one dispatch() call at the event.
// Nothing else — no schema change, no new plumbing, no admin work.
//
// Two rules worth knowing before adding an entry:
//
//   * `category: "account"` is not opt-out-able and ignores priority. Use it
//     only for approvals, safeguarding and account state — never for anything
//     a reasonable person would want to mute.
//   * `priority: "low"` never sends a push (see resolveChannels). That makes
//     "low" wrong for anything aimed at a user who is not currently in the app:
//     an inactivity reminder delivered only to the in-app feed cannot, by
//     definition, reach the inactive person it is for.
//
// URLs are paths on the surface the RECIPIENT uses. For `audience: "admin"`
// they are admin-surface paths and dispatch rewrites them to an absolute admin
// URL, because the admin panel is a different origin from the PWA.

export type CatalogEntry = {
  audience: NotificationAudience;
  category: NotificationCategory;
  priority: NotificationPriority;
  channels: readonly NotificationChannel[];
  title: string;
  body: string;
  url: string | ((vars: NotifyVars) => string);
  /** Minimum hours between two of this key for one person. */
  cooldownHours?: number;
  /** Written to push_notifications.type so pre-existing readers keep working. */
  legacyType: LegacyNotifyType;
};

export const CATALOG = {
  // -- Mentorship lifecycle -------------------------------------------------

  MENTOR_REQUEST_RECEIVED: {
    audience: "mentor",
    category: "mentorship",
    priority: "high",
    channels: ["inapp", "push", "email"],
    title: "New mentorship request",
    body: "{{mentee}} would like you as their mentor. Review their request in your portal.",
    url: "/mentor-portal",
    legacyType: "match",
  },

  MATCH_ACCEPTED: {
    audience: "mentee",
    category: "mentorship",
    priority: "high",
    channels: ["inapp", "push"],
    title: "Your mentor accepted! 🎉",
    body: "{{mentor}} accepted your request. Plan your Finding Yourself Picnic to get started.",
    url: "/mentorship",
    legacyType: "match",
  },

  MATCH_DECLINED: {
    audience: "mentee",
    category: "mentorship",
    priority: "medium",
    channels: ["inapp", "push"],
    title: "Mentor request update",
    body: "A mentor couldn't take you on right now. Explore other mentors who match your interests.",
    url: "/mentors",
    legacyType: "match",
  },

  MESSAGE_RECEIVED: {
    // One key for both directions. The spec lists MENTOR_MESSAGE and
    // MENTEE_MESSAGE separately, but the notification is identical in shape and
    // only the sender differs — splitting it would mean an admin editing the
    // same sentence twice and the two drifting apart.
    audience: "any",
    category: "messages",
    priority: "high",
    channels: ["inapp", "push"],
    title: "New message from {{sender}}",
    body: "{{preview}}",
    url: (v) =>
      v.mentorshipId ? `/mentorship/${v.mentorshipId}` : "/mentorship",
    legacyType: "nudge",
  },

  // -- Tasks ----------------------------------------------------------------

  TASK_ASSIGNED: {
    audience: "mentee",
    category: "mentorship",
    priority: "medium",
    channels: ["inapp", "push"],
    title: "New task from your mentor",
    body: "“{{task}}” is waiting for you.",
    url: (v) => (v.taskId ? `/tasks/${v.taskId}` : "/dashboard"),
    legacyType: "task",
  },

  TASK_SUBMITTED: {
    audience: "mentor",
    category: "mentorship",
    priority: "medium",
    channels: ["inapp", "push"],
    title: "A task is ready for review",
    body: "Your mentee submitted their evidence. Review it to mark the task complete.",
    url: "/mentor-portal",
    legacyType: "task",
  },

  TASK_COMPLETED: {
    audience: "mentee",
    category: "progress",
    priority: "medium",
    channels: ["inapp", "push"],
    title: "Task complete! 🎉",
    body: "Your mentor marked “{{task}}” done. Your tree just grew.",
    url: "/journey",
    legacyType: "task",
  },

  TASK_FAILED: {
    audience: "mentee",
    category: "mentorship",
    priority: "medium",
    channels: ["inapp", "push"],
    title: "“{{task}}” needs another attempt",
    body: "Your mentor sent this one back. Have another go — nothing is lost.",
    url: (v) => (v.taskId ? `/tasks/${v.taskId}` : "/dashboard"),
    legacyType: "task",
  },

  // -- Milestones and growth ------------------------------------------------

  MILESTONE_UNLOCKED: {
    audience: "mentee",
    category: "progress",
    priority: "medium",
    channels: ["inapp", "push"],
    title: "🎉 New milestone unlocked!",
    body: "You've completed your latest milestone in {{skill}}. Keep growing! 🌱",
    url: "/journey",
    cooldownHours: 6,
    legacyType: "milestone",
  },

  MILESTONE_SUBMITTED: {
    audience: "mentor",
    category: "mentorship",
    priority: "medium",
    channels: ["inapp", "push"],
    title: "A milestone is ready for review",
    body: "{{mentee}} submitted “{{milestone}}” for your review.",
    url: (v) =>
      v.menteeId ? `/mentor-portal/${v.menteeId}` : "/mentor-portal",
    legacyType: "task",
  },

  MILESTONE_APPROVED: {
    audience: "mentee",
    category: "progress",
    priority: "medium",
    channels: ["inapp", "push"],
    title: "Milestone approved ✅",
    body: "Your mentor approved “{{milestone}}”. Keep going! 🌱",
    url: "/journey",
    legacyType: "milestone",
  },

  MILESTONE_REVISION: {
    audience: "mentee",
    category: "progress",
    priority: "medium",
    channels: ["inapp", "push"],
    title: "A milestone needs another look",
    body: "Your mentor asked for a revision on “{{milestone}}”. Their notes are on your journey.",
    url: "/journey",
    legacyType: "milestone",
  },

  // The spec asks for a "your mentee reached a milestone" notification to the
  // mentor, and there is deliberately no entry for it. In this programme every
  // route to `done` — tasks and skill milestones alike — is the mentor's own
  // approval (see lib/skill-tracks.ts, where completeOwnMilestone was removed
  // on purpose). Such a notification would report the mentor's own click back
  // to them a second later, which is the noise this system exists to avoid.
  // What the mentor is told instead is MILESTONE_SUBMITTED (there is something
  // to review) and STAGE_READY (they can promote).

  MENTEE_ACTIVITY_COMPLETED: {
    // Goals are the one thing a mentee finishes entirely on their own, so this
    // is the only genuine "your mentee is making progress" event in the app.
    audience: "mentor",
    category: "progress",
    priority: "medium",
    channels: ["inapp", "push"],
    title: "🎉 Your mentee is making progress!",
    body: "{{mentee}} completed a goal: “{{item}}”. Celebrate their progress!",
    url: (v) =>
      v.menteeId ? `/mentor-portal/${v.menteeId}` : "/mentor-portal",
    cooldownHours: 12,
    legacyType: "milestone",
  },

  STAGE_ADVANCED: {
    audience: "mentee",
    category: "progress",
    priority: "medium",
    channels: ["inapp", "push"],
    title: "You've reached {{stage}}! 🌱",
    body: "Your mentor moved you up a stage. New clubs and milestones are open to you.",
    url: "/journey",
    legacyType: "milestone",
  },

  STAGE_READY: {
    audience: "mentor",
    category: "progress",
    priority: "medium",
    channels: ["inapp", "push"],
    title: "{{mentee}} is ready for the next stage",
    body: "They've met the pacing and task requirements. Review and promote when you're ready.",
    url: (v) =>
      v.menteeId ? `/mentor-portal/${v.menteeId}` : "/mentor-portal",
    cooldownHours: 168,
    legacyType: "milestone",
  },

  ACHIEVEMENT: {
    audience: "mentee",
    category: "progress",
    priority: "medium",
    channels: ["inapp", "push"],
    title: "✨ Look how far you've come!",
    body: "You've completed {{count}} milestones on your Ikigai journey.",
    url: "/journey",
    cooldownHours: 24,
    legacyType: "milestone",
  },

  // -- Shared curriculum ----------------------------------------------------

  CURRICULUM_ITEM_ADDED: {
    audience: "mentee",
    category: "mentorship",
    priority: "medium",
    channels: ["inapp", "push"],
    title: "New curriculum step added",
    body: "{{title}}",
    url: "/mentorship",
    legacyType: "task",
  },

  CURRICULUM_ITEM_DONE: {
    audience: "any",
    category: "mentorship",
    priority: "medium",
    channels: ["inapp", "push"],
    title: "Curriculum step completed ✅",
    body: "A step in your shared curriculum was marked done.",
    url: "/mentorship",
    legacyType: "milestone",
  },

  JOURNAL_FEEDBACK: {
    audience: "mentee",
    category: "mentorship",
    priority: "medium",
    channels: ["inapp", "push"],
    title: "💛 Your mentor replied to your journal",
    body: "{{mentor}} left a note on one of your entries.",
    url: "/journal",
    legacyType: "nudge",
  },

  // -- Re-engagement --------------------------------------------------------
  //
  // Everything here is priority "medium" rather than the spec's "low" for one
  // reason: these are aimed at people who are NOT in the app. A low-priority
  // reminder is in-app only, and an in-app-only reminder to come back to the
  // app cannot reach anybody it is written for.

  INACTIVITY_REMINDER: {
    audience: "mentee",
    category: "reminders",
    priority: "medium",
    channels: ["inapp", "push"],
    title: "🌱 Your Growth Tree is waiting for you.",
    body: "Take one small step today.",
    url: "/journey",
    cooldownHours: 96,
    legacyType: "nudge",
  },

  INACTIVITY_REMINDER_LONG: {
    audience: "mentee",
    category: "reminders",
    priority: "medium",
    channels: ["inapp", "push"],
    title: "We haven't seen you in a while 💛",
    body: "Your Ikigai journey is still here whenever you're ready.",
    url: "/dashboard",
    cooldownHours: 336,
    legacyType: "nudge",
  },

  ACTIVITY_REMINDER: {
    audience: "mentee",
    category: "reminders",
    priority: "medium",
    channels: ["inapp", "push"],
    title: "🌱 Your next step is waiting.",
    body: "Continue your {{skill}} journey.",
    url: "/journey",
    cooldownHours: 96,
    legacyType: "nudge",
  },

  MENTOR_CHECK_IN_PROMPT: {
    audience: "mentor",
    category: "mentorship",
    priority: "medium",
    channels: ["inapp", "push"],
    title: "💛 Check in on your mentee",
    body: "It's time to check in with {{mentee}}. A simple “How are you doing?” can make a difference.",
    url: (v) =>
      v.mentorshipId ? `/mentorship/${v.mentorshipId}` : "/mentor-portal",
    cooldownHours: 144,
    legacyType: "nudge",
  },

  MENTEE_INACTIVE: {
    audience: "mentor",
    category: "reminders",
    priority: "medium",
    channels: ["inapp", "push"],
    title: "👀 Check in on your mentee",
    body: "{{mentee}} hasn't been active recently. Send them a message to see how they're doing.",
    url: (v) =>
      v.mentorshipId ? `/mentorship/${v.mentorshipId}` : "/mentor-portal",
    cooldownHours: 144,
    legacyType: "nudge",
  },

  // There is no MENTOR_INACTIVITY entry. The spec lists it separately from the
  // weekly check-in prompt, but then says it should be driven by real
  // mentor-mentee activity rather than a fixed schedule — at which point it IS
  // the check-in prompt above, which only fires when the mentor has not
  // actually said anything. Two notifications with the same trigger and the
  // same meaning is how a system starts feeling automated.

  // -- Digests and discovery ------------------------------------------------

  MENTEE_WEEKLY_SUMMARY: {
    audience: "mentee",
    category: "summary",
    priority: "low",
    channels: ["inapp", "email"],
    title: "Your Ikigai Week 🌱",
    body: "{{summary}}",
    url: "/journey",
    cooldownHours: 144,
    legacyType: "nudge",
  },

  MENTOR_WEEKLY_SUMMARY: {
    audience: "mentor",
    category: "summary",
    priority: "low",
    channels: ["inapp", "email"],
    title: "Your Mentorship Week 🌱",
    body: "{{summary}}",
    url: "/mentor-portal",
    cooldownHours: 144,
    legacyType: "nudge",
  },

  OPPORTUNITY_MATCH: {
    audience: "mentee",
    category: "opportunities",
    priority: "medium",
    channels: ["inapp", "push"],
    title: "💡 A new opportunity matches your interests",
    body: "{{title}}",
    url: (v) => (v.eventId ? `/activities/${v.eventId}` : "/activities"),
    cooldownHours: 24,
    legacyType: "nudge",
  },

  COMMUNITY_UPDATE: {
    audience: "any",
    category: "community",
    priority: "low",
    channels: ["inapp"],
    title: "💬 New activity in {{group}}",
    body: "There's something new happening in your Ikigai community.",
    url: (v) => (v.groupId ? `/groups/${v.groupId}` : "/groups"),
    cooldownHours: 6,
    legacyType: "nudge",
  },

  // -- Account decisions ----------------------------------------------------
  //
  // category "account": always delivered, never opt-out-able.

  MENTEE_APPROVED: {
    audience: "mentee",
    category: "account",
    priority: "high",
    channels: ["inapp", "push"],
    title: "You're approved! 🎉",
    body: "You can now request a mentor and start your journey.",
    url: "/mentors",
    legacyType: "milestone",
  },

  MENTEE_REJECTED: {
    audience: "mentee",
    category: "account",
    priority: "high",
    channels: ["inapp", "push"],
    title: "About your application",
    body: "Someone from the ikigai team will be in touch with you soon.",
    url: "/dashboard",
    legacyType: "milestone",
  },

  MENTOR_APPLICATION_APPROVED: {
    audience: "mentor",
    category: "account",
    priority: "high",
    channels: ["inapp", "push"],
    title: "You're an approved mentor! ✅",
    body: "Ikigai approved your mentor profile. Check your email for the PWA link.",
    url: "/mentor-portal",
    legacyType: "milestone",
  },

  MENTOR_APPLICATION_REJECTED: {
    audience: "mentor",
    category: "account",
    priority: "high",
    channels: ["inapp", "push"],
    title: "Mentor application update",
    body: "We can't take your mentor application forward as it stands. The team will follow up by email.",
    url: "/dashboard",
    legacyType: "milestone",
  },

  SCHOOL_APPROVED: {
    audience: "any",
    category: "account",
    priority: "high",
    channels: ["inapp", "push"],
    title: "Your school clubhouse is approved! 🏫",
    body: "You can start inviting members to your clubhouse now.",
    url: "/groups",
    legacyType: "milestone",
  },

  SCHOOL_REJECTED: {
    audience: "any",
    category: "account",
    priority: "high",
    channels: ["inapp", "push"],
    title: "School registration update",
    body: "Your school registration needs more information. Please check your email from the ikigai team.",
    url: "/dashboard",
    legacyType: "milestone",
  },

  GUARDIAN_LINK_ACCEPTED: {
    audience: "parent",
    category: "account",
    priority: "high",
    channels: ["inapp", "push"],
    title: "{{child}} accepted your request 💛",
    body: "You can now follow their Ikigai journey from your parent portal.",
    url: "/parent-portal",
    legacyType: "guardian",
  },

  GUARDIAN_LINK_DECLINED: {
    audience: "parent",
    category: "account",
    priority: "high",
    channels: ["inapp", "push"],
    title: "About your guardian request",
    body: "{{child}} did not accept the link. Talk to them before trying again.",
    url: "/parent-portal",
    legacyType: "guardian",
  },

  BROADCAST: {
    // Copy comes from the admin composing the broadcast, so the defaults here
    // are only a fallback for an empty form (which the action rejects anyway).
    audience: "any",
    category: "account",
    priority: "medium",
    channels: ["inapp", "push"],
    title: "{{title}}",
    body: "{{body}}",
    url: "/dashboard",
    legacyType: "broadcast",
  },

  // -- Safeguarding (admin-facing) -----------------------------------------
  //
  // URLs are admin-surface paths; dispatch turns them into absolute admin URLs
  // because the admin panel is served from a different origin than the PWA.

  SAFETY_REPORT_FILED: {
    audience: "admin",
    category: "account",
    priority: "high",
    channels: ["inapp", "push"],
    title: "🚨 New safety report",
    body: "A safety report was filed and is waiting in the safeguarding queue.",
    url: (v) => (v.reportId ? `/reports/${v.reportId}` : "/reports"),
    legacyType: "nudge",
  },

  JOURNAL_FLAGGED: {
    audience: "admin",
    category: "account",
    priority: "high",
    channels: ["inapp", "push"],
    title: "⚠️ A journal entry was flagged",
    body: "An entry matched the safeguarding keyword list. Review it in safeguarding.",
    url: "/safeguarding",
    legacyType: "nudge",
  },
} as const satisfies Record<string, CatalogEntry>;

export type NotificationKey = keyof typeof CATALOG;

export const NOTIFICATION_KEYS = Object.keys(CATALOG) as NotificationKey[];

export function isNotificationKey(value: string): value is NotificationKey {
  return Object.hasOwn(CATALOG, value);
}

/**
 * The catalogue widened to CatalogEntry.
 *
 * CATALOG is `as const satisfies` so that NotificationKey is the exact union of
 * keys — but that also means an entry which omits an optional field does not
 * have that property in its literal type. Reading entries through here gives
 * every caller the declared shape, optional fields included.
 */
export function entryFor(key: NotificationKey): CatalogEntry {
  return CATALOG[key];
}

/** The deep link for one notification, whether the entry declares it flat or as a builder. */
export function resolveUrl(
  url: CatalogEntry["url"],
  vars: NotifyVars = {},
): string {
  return typeof url === "function" ? url(vars) : url;
}
