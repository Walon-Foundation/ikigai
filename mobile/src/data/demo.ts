/**
 * Demo data for the mentee app.
 *
 * Every shape here mirrors a response from the NestJS API (api/src), so moving
 * a screen onto real data is a change to where the data comes from, not to the
 * screen. The people are sample content only — not real users.
 */

export type Stage = 'discover' | 'thrive' | 'build' | 'lead';

export type Me = {
  id: string;
  displayName: string;
  initials: string;
  currentStage: Stage;
  weekInStage: number;
};

/** A message in a thread. `mission` messages carry a task the mentor set. */
export type Message =
  | { id: string; kind: 'text'; fromMe: boolean; text: string; timestamp: string }
  | {
      id: string;
      kind: 'mission';
      fromMe: false;
      title: string;
      detail: string;
      due: string;
      timestamp: string;
    }
  | { id: string; kind: 'day'; label: string };

export type JournalVisibility = 'private' | 'mentor_only';

export type JournalEntry = {
  id: string;
  day: string;
  content: string;
  visibility: JournalVisibility;
  /** Present only on shared entries the mentor answered. */
  mentorReply?: string;
};

export type Milestone = { id: string; label: string; done: boolean; due?: string };

export type ChatSummary = {
  id: string;
  kind: 'mentor' | 'club' | 'journal' | 'event';
  title: string;
  preview: string;
  time: string;
  unread?: number;
  initials?: string;
  /** Material Symbol name for rows that show an icon instead of initials. */
  icon?: string;
  /** Route the row opens. Absent rows are not interactive yet. */
  href?: '/thread/mentor' | '/thread/journal';
};

export const me: Me = {
  id: 'demo-mentee',
  displayName: 'Aminata',
  initials: 'AK',
  currentStage: 'thrive',
  weekInStage: 6,
};

export const mentor = {
  id: 'demo-mentor',
  displayName: 'Fatmata Sesay',
  initials: 'FS',
};

export const chats: ChatSummary[] = [
  {
    id: 'mentor',
    kind: 'mentor',
    title: 'Fatmata · mentor',
    preview: 'How did the interview go? Tell me one thing that surprised you.',
    time: '9:14',
    unread: 2,
    initials: 'FS',
    href: '/thread/mentor',
  },
  {
    id: 'club',
    kind: 'club',
    title: 'STEM Girls Freetown',
    preview: 'Isatu: Saturday we build the water filter',
    time: 'Yesterday',
    initials: 'SG',
  },
  {
    id: 'journal',
    kind: 'journal',
    title: 'My journal',
    preview: 'Only you can see this · 4-day streak',
    time: 'Mon',
    icon: 'menu_book',
    href: '/thread/journal',
  },
  {
    id: 'event',
    kind: 'event',
    title: 'Finding Yourself Picnic',
    preview: "Unlocks at 50% — you're at 57%",
    time: 'Sep 28',
    icon: 'event',
  },
];

export const mentorThread: Message[] = [
  { id: 'd1', kind: 'day', label: 'Monday' },
  { id: 'm1', kind: 'text', fromMe: false, text: 'Kushe Aminata! Great session on Saturday.', timestamp: '10:02' },
  {
    id: 'm2',
    kind: 'mission',
    fromMe: false,
    title: 'Interview an elder about your community',
    detail: 'Record what you learn. Needs a photo of your notes.',
    due: 'Due Friday',
    timestamp: '10:03',
  },
  { id: 'm3', kind: 'text', fromMe: true, text: "I'll ask my grandmother. She's lived on Kissy Road for 60 years", timestamp: '10:15' },
  { id: 'm4', kind: 'text', fromMe: false, text: 'Perfect choice. Ask her how the market has changed.', timestamp: '10:17' },
  { id: 'd2', kind: 'day', label: 'Today' },
  { id: 'm5', kind: 'text', fromMe: false, text: 'How did the interview go? Tell me one thing that surprised you.', timestamp: '9:14' },
];

export const treeThread: Message[] = [
  { id: 't1', kind: 'text', fromMe: false, text: "You've been growing for six weeks, Aminata. Here's where you are.", timestamp: '' },
  { id: 't2', kind: 'text', fromMe: false, text: 'One more milestone and you grow a new branch.', timestamp: '' },
  { id: 't3', kind: 'text', fromMe: true, text: "What's after Thrive?", timestamp: '' },
  {
    id: 't4',
    kind: 'text',
    fromMe: false,
    text: "Build — where you start making something of your own. Fatmata decides when you're ready.",
    timestamp: '',
  },
];

export const journal: JournalEntry[] = [
  {
    id: 'j1',
    day: 'Sunday',
    content: "I realised I love fixing things. I fixed Mama's radio and nobody showed me how.",
    visibility: 'private',
  },
  {
    id: 'j2',
    day: 'Monday',
    content: 'Grandma said the market used to flood every rainy season. People moved their stalls onto the church steps.',
    visibility: 'mentor_only',
    mentorReply: "That's a brilliant detail. Ask her who organised the move.",
  },
];

export const journalPrompt = "What is something you're good at that nobody taught you?";

export const stages: { id: Stage; label: string; note: string }[] = [
  { id: 'discover', label: 'Discover', note: 'Finished in 5 weeks' },
  { id: 'thrive', label: 'Thrive', note: 'Current stage' },
  { id: 'build', label: 'Build', note: "Fatmata unlocks this when you're ready" },
  { id: 'lead', label: 'Lead', note: 'Mentor others' },
];

export const thriveMilestones: Milestone[] = [
  { id: 'ms1', label: 'Name three things you love', done: true },
  { id: 'ms2', label: 'Write your first journal entry', done: true },
  { id: 'ms3', label: 'Meet your mentor in person', done: true },
  { id: 'ms4', label: 'Join a club', done: true },
  { id: 'ms5', label: 'Interview an elder', done: false, due: 'Fri' },
  { id: 'ms6', label: 'Share your purpose statement', done: false },
  { id: 'ms7', label: 'Attend a community event', done: false },
];

export const suggestedMentors = [
  { id: 's1', displayName: 'Mariama Conteh', initials: 'MC', focus: 'Engineering · Freetown', score: 86 },
  { id: 's2', displayName: 'Ibrahim Kamara', initials: 'IK', focus: 'Agriculture · Waterloo', score: 71 },
  { id: 's3', displayName: 'Hawa Bangura', initials: 'HB', focus: 'Health · Freetown', score: 64 },
];
