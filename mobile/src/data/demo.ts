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

// ---------------------------------------------------------------------------
// Onboarding
// ---------------------------------------------------------------------------

export const interestOptions = [
  'Technology', 'Science', 'Art', 'Music', 'Sport', 'Agriculture', 'Health',
  'Business', 'Writing', 'Fashion', 'Community', 'Environment', 'Teaching', 'Engineering',
];

export const assessmentQuestions: { key: 'love' | 'skills' | 'community' | 'opportunity'; title: string; hint: string }[] = [
  { key: 'love', title: 'What do you love?', hint: 'Things you could do for hours without noticing the time.' },
  { key: 'skills', title: 'What are you good at?', hint: 'Things people come to you for.' },
  { key: 'community', title: 'What does your community need?', hint: 'Problems you see around you.' },
  { key: 'opportunity', title: 'What could you be paid for?', hint: 'Work that exists, or could exist, near you.' },
];

export const valueOptions = [
  'Family', 'Faith', 'Honesty', 'Courage', 'Kindness', 'Learning', 'Independence', 'Justice', 'Creativity', 'Service',
];

export const personalityScales: { key: string; left: string; right: string }[] = [
  { key: 'introvertExtrovert', left: 'Quiet', right: 'Outgoing' },
  { key: 'structuredFlexible', left: 'Planned', right: 'Spontaneous' },
  { key: 'creativeAnalytical', left: 'Creative', right: 'Analytical' },
  { key: 'independentCollaborative', left: 'On my own', right: 'With others' },
];

export const expertiseOptions = [
  'Engineering', 'Medicine', 'Nursing', 'Law', 'Teaching', 'Business', 'Agriculture',
  'Software', 'Design', 'Journalism', 'Finance', 'Public service',
];

// ---------------------------------------------------------------------------
// Goals & purpose book
// ---------------------------------------------------------------------------

export type Goal = { id: string; title: string; detail?: string; target?: string; done: boolean };

export const goals: Goal[] = [
  { id: 'g1', title: 'Finish my purpose book', detail: 'One section a week', target: '31 Oct', done: false },
  { id: 'g2', title: 'Learn to solder', detail: 'Ask Isatu at the club', target: '15 Nov', done: false },
  { id: 'g3', title: 'Read one book this month', done: true },
];

export const purposeBook = {
  statement:
    'You are a balanced, creative individual passionate about technology and community development. You are driven by learning and committed to making a meaningful impact.',
  interests: ['Technology', 'Engineering', 'Community', 'Science'],
  values: ['Learning', 'Family', 'Service'],
  personalityLabel: 'Balanced, Creative',
  lifeVision:
    'I want to run a repair workshop in Kissy that also teaches girls how to fix things.',
};

// ---------------------------------------------------------------------------
// Clubs
// ---------------------------------------------------------------------------

export type Club = {
  id: string;
  name: string;
  description: string;
  members: number;
  stage?: Stage;
  tags: string[];
  joined: boolean;
  messages: { id: string; from: string; text: string; mine?: boolean }[];
};

export const clubs: Club[] = [
  {
    id: 'c1',
    name: 'STEM Girls Freetown',
    description: 'We build things. Saturdays, 10am, at the community centre.',
    members: 24,
    stage: 'thrive',
    tags: ['Science', 'Engineering'],
    joined: true,
    messages: [
      { id: 'cm1', from: 'Isatu', text: 'Saturday we build the water filter' },
      { id: 'cm2', from: 'Mariatu', text: 'I can bring the sand and gravel' },
      { id: 'cm3', from: 'You', text: 'I will bring bottles', mine: true },
    ],
  },
  {
    id: 'c2',
    name: 'Young Writers Circle',
    description: 'Short stories, poems and letters. We share one piece every two weeks.',
    members: 11,
    tags: ['Writing', 'Art'],
    joined: false,
    messages: [],
  },
  {
    id: 'c3',
    name: 'Green Kissy',
    description: 'Clean-ups and tree planting across Kissy.',
    members: 38,
    stage: 'build',
    tags: ['Environment', 'Community'],
    joined: false,
    messages: [],
  },
];

// ---------------------------------------------------------------------------
// Activities / events
// ---------------------------------------------------------------------------

export type EventItem = {
  id: string;
  title: string;
  when: string;
  where: string;
  description: string;
  capacity?: number;
  registered: number;
  unlockAtPercent?: number;
  status: 'upcoming' | 'ongoing' | 'past';
  rsvp: 'none' | 'registered' | 'attended';
};

/** The mentee's roadmap completion, which gates some events. */
export const roadmapPercent = 57;

export const events: EventItem[] = [
  {
    id: 'e1',
    title: 'Finding Yourself Picnic',
    when: 'Sat 28 Sep · 11:00',
    where: 'Lumley Beach',
    description: 'A day with your mentor and other mentees. Food, games, and a purpose circle.',
    capacity: 60,
    registered: 41,
    unlockAtPercent: 50,
    status: 'upcoming',
    rsvp: 'none',
  },
  {
    id: 'e2',
    title: 'Pad Her Power workshop',
    when: 'Today · 14:00–16:00',
    where: 'Kissy Community Centre',
    description: 'Making reusable pads, and a safe space to ask questions.',
    capacity: 30,
    registered: 30,
    status: 'ongoing',
    rsvp: 'registered',
  },
  {
    id: 'e3',
    title: 'CV and interview day',
    when: 'Sat 12 Oct · 10:00',
    where: 'Online',
    description: 'Practise interviews with volunteers from local businesses.',
    registered: 18,
    unlockAtPercent: 75,
    status: 'upcoming',
    rsvp: 'none',
  },
  {
    id: 'e4',
    title: 'Tree planting, Regent',
    when: 'Sat 7 Sep',
    where: 'Regent',
    description: 'Planted 120 seedlings with Green Kissy.',
    registered: 25,
    status: 'past',
    rsvp: 'attended',
  },
];

// ---------------------------------------------------------------------------
// Task detail
// ---------------------------------------------------------------------------

export const taskDetail = {
  id: 'task-1',
  title: 'Interview an elder about your community',
  description:
    'Ask an elder how your community has changed in their lifetime. Write down what surprised you, and take a photo of your notes.',
  due: 'Friday',
  from: 'Fatmata Sesay',
  requiresEvidence: true,
  questions: [
    {
      id: 'q1',
      prompt: 'Who did you interview?',
      options: ['An elder in my family or community', 'A friend my age', 'Nobody yet'],
    },
    {
      id: 'q2',
      prompt: 'What is the most useful thing to write down during an interview?',
      options: ['Exact quotes and surprises', 'Only the date', 'Nothing — just listen'],
    },
  ],
};

// ---------------------------------------------------------------------------
// Mentorship
// ---------------------------------------------------------------------------

export type CurriculumItem = {
  id: string;
  title: string;
  description?: string;
  status: 'planned' | 'in_progress' | 'done';
  target?: string;
};

export const curriculum: CurriculumItem[] = [
  { id: 'cu1', title: 'Getting to know you', description: 'First meeting and purpose quiz review', status: 'done' },
  { id: 'cu2', title: 'Your community', description: 'Interviews and observation', status: 'in_progress', target: '4 Oct' },
  { id: 'cu3', title: 'Skills you already have', status: 'planned', target: '25 Oct' },
  { id: 'cu4', title: 'Your first project', status: 'planned', target: '15 Nov' },
];

export const meetings = [
  { number: 1, label: 'First meeting', verified: true, when: '17 Aug', method: 'Location' },
  { number: 2, label: 'Mid-point check-in', verified: true, when: '7 Sep', method: 'Photo' },
  { number: 3, label: 'Graduation meeting', verified: false },
];

export type MentorProfile = {
  id: string;
  displayName: string;
  initials: string;
  headline: string;
  bio: string;
  expertise: string[];
  languages: string[];
  rating: number;
  reviews: { author: string; text: string; stars: number }[];
  score?: number;
  isMine?: boolean;
};

export const mentorProfiles: MentorProfile[] = [
  {
    id: 'demo-mentor',
    displayName: 'Fatmata Sesay',
    initials: 'FS',
    headline: 'Civil engineer · Freetown',
    bio: 'I design water systems for communities around the Western Area. I mentor because nobody told me engineering was for girls until I was twenty.',
    expertise: ['Engineering', 'Environment', 'Public service'],
    languages: ['Krio', 'English'],
    rating: 4.9,
    reviews: [
      { author: 'A parent', text: 'My daughter talks about her future now.', stars: 5 },
      { author: 'A mentee', text: 'She listens properly.', stars: 5 },
    ],
    isMine: true,
  },
  {
    id: 's1',
    displayName: 'Mariama Conteh',
    initials: 'MC',
    headline: 'Electrical engineer · Freetown',
    bio: 'I work on solar mini-grids and teach basic electronics on weekends.',
    expertise: ['Engineering', 'Software'],
    languages: ['Krio', 'English', 'Temne'],
    rating: 4.8,
    reviews: [{ author: 'A mentee', text: 'Very patient.', stars: 5 }],
    score: 86,
  },
  {
    id: 's2',
    displayName: 'Ibrahim Kamara',
    initials: 'IK',
    headline: 'Agronomist · Waterloo',
    bio: 'Farming is a business. I help young people see it that way.',
    expertise: ['Agriculture', 'Business'],
    languages: ['Krio', 'English', 'Mende'],
    rating: 4.6,
    reviews: [],
    score: 71,
  },
  {
    id: 's3',
    displayName: 'Hawa Bangura',
    initials: 'HB',
    headline: 'Nurse · Freetown',
    bio: 'Twelve years in maternity care. I mentor girls interested in health.',
    expertise: ['Nursing', 'Medicine'],
    languages: ['Krio', 'English'],
    rating: 5,
    reviews: [{ author: 'A parent', text: 'Kind and honest.', stars: 5 }],
    score: 64,
  },
];

// ---------------------------------------------------------------------------
// Notifications
// ---------------------------------------------------------------------------

export const notifications: { id: string; icon: string; title: string; body: string; time: string; read: boolean }[] = [
  { id: 'n1', icon: 'chat', title: 'New message from Fatmata', body: 'How did the interview go?', time: '9:14', read: false },
  { id: 'n2', icon: 'assignment', title: 'New mission', body: 'Interview an elder about your community', time: 'Mon', read: false },
  { id: 'n3', icon: 'park', title: 'A new leaf', body: 'You joined STEM Girls Freetown', time: 'Sun', read: true },
  { id: 'n4', icon: 'event', title: 'Picnic unlocked', body: 'You reached 50% — the Finding Yourself Picnic is open', time: '12 Sep', read: true },
];

// ---------------------------------------------------------------------------
// Pad Her Power & safety
// ---------------------------------------------------------------------------

export const resources: { id: string; name: string; kind: string; area: string; distance: string; phone?: string; lat: number; lng: number }[] = [
  { id: 'r1', name: 'Kissy Community Centre', kind: 'Free pads · Safe space', area: 'Kissy', distance: '1.2 km', phone: '+232 76 000 101', lat: 8.4712, lng: -13.1897 },
  { id: 'r2', name: 'Princess Christian Maternity Hospital', kind: 'Health clinic', area: 'Cline Town', distance: '3.4 km', phone: '+232 76 000 102', lat: 8.4891, lng: -13.2206 },
  { id: 'r3', name: 'Rainbo Initiative', kind: 'Support after violence', area: 'Central Freetown', distance: '5.0 km', phone: '116', lat: 8.4844, lng: -13.2344 },
  { id: 'r4', name: 'Wellington Health Post', kind: 'Health clinic', area: 'Wellington', distance: '6.1 km', lat: 8.4378, lng: -13.1542 },
];

export const helpLines: { id: string; name: string; number: string; note: string }[] = [
  { id: 'h1', name: 'Emergency', number: '999', note: 'Police, fire or ambulance' },
  { id: 'h2', name: 'Child protection', number: '116', note: 'Free · 24 hours' },
  { id: 'h3', name: 'Rainbo Initiative', number: '+232 76 000 103', note: 'Support after sexual violence' },
];

// ---------------------------------------------------------------------------
// Mentor portal
// ---------------------------------------------------------------------------

export const mentorRequests: { id: string; menteeName: string; initials: string; score: number; interests: string[]; note: string }[] = [
  { id: 'rq1', menteeName: 'Kadiatu Turay', initials: 'KT', score: 82, interests: ['Engineering', 'Environment'], note: 'Wants to build solar lamps' },
  { id: 'rq2', menteeName: 'Mohamed Jalloh', initials: 'MJ', score: 67, interests: ['Business', 'Technology'], note: 'Starting a phone repair stall' },
];

export const mentorMentees: { id: string; name: string; initials: string; stage: Stage; percent: number; lastActive: string; needsReview: number }[] = [
  { id: 'demo-mentee', name: 'Aminata Kargbo', initials: 'AK', stage: 'thrive', percent: 57, lastActive: 'Today', needsReview: 1 },
  { id: 'mt2', name: 'Salamatu Koroma', initials: 'SK', stage: 'discover', percent: 30, lastActive: '5 days ago', needsReview: 0 },
];

export const mentorCapacity = 2;

export const pendingReviews: { id: string; menteeId: string; milestone: string; evidence: string; submitted: string }[] = [
  { id: 'pr1', menteeId: 'demo-mentee', milestone: 'Interview an elder', evidence: 'Test passed 2/2 · photo of notes', submitted: 'Today' },
];

// ---------------------------------------------------------------------------
// Parent portal
// ---------------------------------------------------------------------------

export const parentView = {
  parentName: 'Mrs Kargbo',
  child: {
    name: 'Aminata',
    initials: 'AK',
    stage: 'Thrive' as const,
    percent: 57,
    mentor: 'Fatmata Sesay',
    lastActive: 'Today',
    recent: [
      'Joined STEM Girls Freetown',
      'Completed 4 of 7 milestones in Thrive',
      'Verified second meeting with her mentor',
    ],
  },
  pendingInvite: { email: 'kadi@example.com', code: 'IK-4F9K2A' },
};
