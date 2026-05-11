export const MOCK_USER = {
  id: "u1",
  clerkId: "clerk_abc",
  role: "mentee" as const,
  displayName: "Aminata Koroma",
  growthLevel: 1,
  interestTags: ["technology", "entrepreneurship", "environmental_science"],
  schoolId: "s1",
  createdAt: "2026-02-01",
};

export const INTEREST_TAGS = [
  "Technology",
  "Entrepreneurship",
  "Environmental Science",
  "Healthcare",
  "Education",
  "Arts & Culture",
  "Sports",
  "Agriculture",
  "Finance",
  "Engineering",
  "Media",
  "Law",
];

export const MOCK_MENTORS = [
  {
    id: "m1",
    displayName: "Dr. Ibrahim Sesay",
    role: "mentor",
    interestTags: ["technology", "engineering"],
    bio: "Software engineer at a Freetown tech startup. 8 years experience.",
    matchScore: 92,
    status: "active",
    verifiedAt: "2026-01-10",
  },
  {
    id: "m2",
    displayName: "Fatmata Bangura",
    role: "mentor",
    interestTags: ["entrepreneurship", "finance"],
    bio: "Founded two SMEs in Freetown. Passionate about women in business.",
    matchScore: 87,
    status: "icebreaker",
    verifiedAt: "2026-01-15",
  },
  {
    id: "m3",
    displayName: "Mohamed Jalloh",
    role: "mentor",
    interestTags: ["environmental_science", "agriculture"],
    bio: "Environmental researcher at Njala University.",
    matchScore: 78,
    status: null,
    verifiedAt: "2026-02-01",
  },
];

export const MOCK_MENTORSHIPS = [
  {
    id: "ms1",
    menteeId: "u1",
    mentorId: "m1",
    mentor: MOCK_MENTORS[0],
    status: "active",
    matchScore: 92,
    lastActivityAt: "2026-05-06",
    createdAt: "2026-03-01",
  },
];

export const MOCK_CHAT_MESSAGES = [
  {
    id: "c1",
    senderId: "m1",
    senderName: "Dr. Ibrahim Sesay",
    content:
      "Good morning Aminata! How did your weekend project go? Did you manage to start that mobile app?",
    timestamp: "2026-05-06T09:15:00Z",
    isMine: false,
  },
  {
    id: "c2",
    senderId: "u1",
    senderName: "Aminata Koroma",
    content:
      "Good morning Dr. Sesay! Yes, I got started with React Native. I built a simple to-do app following your advice.",
    timestamp: "2026-05-06T09:18:00Z",
    isMine: true,
  },
  {
    id: "c3",
    senderId: "m1",
    senderName: "Dr. Ibrahim Sesay",
    content:
      "That is excellent progress! A to-do app is the perfect starting point. Next week let us try adding local storage so the data persists. Keep it up!",
    timestamp: "2026-05-06T09:22:00Z",
    isMine: false,
  },
  {
    id: "c4",
    senderId: "u1",
    senderName: "Aminata Koroma",
    content:
      "Thank you! I will work on that. Should I share the code with you?",
    timestamp: "2026-05-06T09:25:00Z",
    isMine: true,
  },
];

export const MOCK_JOURNAL_ENTRIES = [
  {
    id: "j1",
    userId: "u1",
    content:
      "Today I reflected on my goal to study computer science. I feel like technology is where I can make the biggest impact in my community.",
    visibility: "private",
    keywordFlag: false,
    createdAt: "2026-05-06",
  },
  {
    id: "j2",
    userId: "u1",
    content:
      "Met with Dr. Sesay today. He encouraged me to start building small projects. Going to try building a mobile app this weekend.",
    visibility: "mentor_only",
    keywordFlag: false,
    createdAt: "2026-05-04",
  },
  {
    id: "j3",
    userId: "u1",
    content:
      "Feeling a bit overwhelmed with school exams and the mentorship programme. Taking it one day at a time.",
    visibility: "private",
    keywordFlag: false,
    createdAt: "2026-05-02",
  },
];

export const MOCK_MILESTONES = [
  {
    id: "ml1",
    userId: "u1",
    type: "purpose_quiz",
    label: "Purpose Quiz",
    completedAt: "2026-02-02",
  },
  {
    id: "ml2",
    userId: "u1",
    type: "first_journal",
    label: "First Journal Entry",
    completedAt: "2026-02-05",
  },
  {
    id: "ml3",
    userId: "u1",
    type: "mentor_matched",
    label: "Mentor Matched",
    completedAt: "2026-03-01",
  },
];

export const INCOMPLETE_MILESTONES = [
  { type: "pad_her_power", label: "Pad Her Power Module" },
  { type: "safety_module", label: "Safety Awareness Module" },
  { type: "advocate", label: "Reach Advocate Level" },
];

export const MOCK_SCHOOLS = [
  {
    id: "s1",
    name: "Annie Walsh Memorial School",
    region: "freetown",
    clubLeadId: "u3",
    verifiedAt: "2026-01-20",
    memberCount: 34,
  },
  {
    id: "s2",
    name: "St. Edward's Secondary School",
    region: "freetown",
    clubLeadId: null,
    verifiedAt: null,
    memberCount: 0,
  },
  {
    id: "s3",
    name: "Albert Academy",
    region: "western_rural",
    clubLeadId: null,
    verifiedAt: null,
    memberCount: 0,
  },
];

export const MOCK_SCHOOL_MEMBERS = [
  { id: "u2", displayName: "Isata Mansaray", role: "mentee", growthLevel: 2 },
  { id: "u4", displayName: "Sorie Kamara", role: "mentee", growthLevel: 1 },
  { id: "u5", displayName: "Mariama Turay", role: "mentee", growthLevel: 1 },
  { id: "u6", displayName: "Abu Bangura", role: "mentee", growthLevel: 3 },
];

export const MOCK_REPORTS = [
  {
    id: "r1",
    reporterId: "u1",
    reportedId: "m2",
    type: "inappropriate",
    notes: "Sent messages outside the platform asking for personal contact.",
    resolvedAt: null,
    createdAt: "2026-05-01",
    reporter: { displayName: "Isata Mansaray" },
    reported: { displayName: "A Mentor" },
  },
  {
    id: "r2",
    reporterId: "u5",
    reportedId: "m3",
    type: "concern",
    notes: "Mentor seemed disengaged and cancelled 3 sessions without notice.",
    resolvedAt: "2026-05-03",
    createdAt: "2026-04-28",
    reporter: { displayName: "Mariama Turay" },
    reported: { displayName: "Another Mentor" },
  },
];

export const MOCK_PENDING_MENTORS = [
  {
    id: "pm1",
    displayName: "Kadiatu Fofanah",
    email: "kadiatu@example.com",
    interestTags: ["healthcare", "education"],
    bio: "Nurse at Connaught Hospital, 5 years experience in community health.",
    submittedAt: "2026-05-05",
  },
  {
    id: "pm2",
    displayName: "Abu Kamara",
    email: "abu@example.com",
    interestTags: ["technology", "finance"],
    bio: "Software developer with experience in fintech.",
    submittedAt: "2026-05-04",
  },
  {
    id: "pm3",
    displayName: "Hawa Conteh",
    email: "hawa@example.com",
    interestTags: ["entrepreneurship", "arts_culture"],
    bio: "Fashion designer and entrepreneur, founded Freetown Threads.",
    submittedAt: "2026-05-03",
  },
];

export const MOCK_PENDING_SCHOOLS = [
  {
    id: "ps1",
    name: "Christo-Rama Secondary School",
    region: "freetown",
    submittedBy: "Sorie Kamara",
    submittedAt: "2026-05-06",
  },
  {
    id: "ps2",
    name: "Bo School",
    region: "western_rural",
    submittedBy: "Adama Bah",
    submittedAt: "2026-05-05",
  },
];

export const MOCK_ADMIN_STATS = {
  totalUsers: 523,
  mentees: 398,
  mentors: 87,
  clubLeads: 38,
  activeMentorships: 124,
  pendingMentors: 12,
  pendingSchools: 4,
  openReports: 3,
  schoolsEstablished: 18,
  avgResolutionHours: 4.2,
};

export const MOCK_ALL_USERS = [
  {
    id: "u1",
    displayName: "Aminata Koroma",
    role: "mentee",
    school: "Annie Walsh Memorial School",
    growthLevel: 1,
    createdAt: "2026-02-01",
    status: "active",
  },
  {
    id: "u2",
    displayName: "Isata Mansaray",
    role: "mentee",
    school: "Annie Walsh Memorial School",
    growthLevel: 2,
    createdAt: "2026-02-03",
    status: "active",
  },
  {
    id: "m1",
    displayName: "Dr. Ibrahim Sesay",
    role: "mentor",
    school: "—",
    growthLevel: 3,
    createdAt: "2026-01-10",
    status: "verified",
  },
  {
    id: "m2",
    displayName: "Fatmata Bangura",
    role: "mentor",
    school: "—",
    growthLevel: 3,
    createdAt: "2026-01-15",
    status: "verified",
  },
  {
    id: "u3",
    displayName: "Mariama Turay",
    role: "club_lead",
    school: "Annie Walsh Memorial School",
    growthLevel: 2,
    createdAt: "2026-01-18",
    status: "active",
  },
  {
    id: "u4",
    displayName: "Sorie Kamara",
    role: "mentee",
    school: "Albert Academy",
    growthLevel: 1,
    createdAt: "2026-02-10",
    status: "active",
  },
];

export const MOCK_SENT_NOTIFICATIONS = [
  {
    id: "n1",
    title: "New mentor match available!",
    body: "We found a great mentor match for you. Check your mentorship page.",
    type: "match",
    audience: "mentees",
    sentAt: "2026-05-06T10:00:00Z",
    sent: 398,
  },
  {
    id: "n2",
    title: "Check in with your mentees",
    body: "You have mentees who haven't heard from you in 4 days.",
    type: "nudge",
    audience: "mentors",
    sentAt: "2026-05-05T09:00:00Z",
    sent: 87,
  },
  {
    id: "n3",
    title: "Ikigai Platform Update",
    body: "New features are live: Journal sharing and improved Vibe-Match.",
    type: "broadcast",
    audience: "all",
    sentAt: "2026-05-01T08:00:00Z",
    sent: 523,
  },
];

export const PAD_HER_POWER_RESOURCES = [
  {
    id: "p1",
    category: "Menstrual Health",
    title: "Understanding Your Cycle",
    desc: "Learn about your menstrual cycle, what is normal, and when to seek help.",
  },
  {
    id: "p2",
    category: "Menstrual Health",
    title: "Managing Period Pain",
    desc: "Safe and effective ways to manage dysmenorrhoea.",
  },
  {
    id: "p3",
    category: "Contraception",
    title: "Contraception Options",
    desc: "Overview of family planning methods available in Sierra Leone.",
  },
  {
    id: "p4",
    category: "Safety",
    title: "Consent & Boundaries",
    desc: "Understanding consent, your rights, and how to set healthy boundaries.",
  },
  {
    id: "p5",
    category: "Nutrition",
    title: "Nutrition for Girls",
    desc: "Iron, folate, and other nutrients critical for adolescent girls.",
  },
  {
    id: "p6",
    category: "Mental Health",
    title: "Body Image & Self-Worth",
    desc: "Building a positive relationship with your body and identity.",
  },
];

export const SAFETY_RESOURCES = [
  {
    name: "Rainbo Initiative (Freetown)",
    phone: "+232 76 625 525",
    desc: "Sexual violence response & support",
  },
  {
    name: "UNFPA Sierra Leone",
    phone: "+232 22 237 701",
    desc: "Reproductive health support",
  },
  {
    name: "Ministry of Social Welfare Helpline",
    phone: "116",
    desc: "Child & family welfare, 24/7",
  },
  {
    name: "Police Family Support Unit",
    phone: "+232 76 644 401",
    desc: "Domestic & gender-based violence",
  },
];

export const QUIZ_QUESTIONS = [
  {
    id: "q1",
    question: "What motivates you most in life?",
    options: [
      "Making money and being financially secure",
      "Making a positive impact on my community",
      "Learning new things and growing as a person",
      "Building strong relationships with others",
    ],
  },
  {
    id: "q2",
    question: "Where do you see yourself in 5 years?",
    options: [
      "Running my own business",
      "Working in a professional career I love",
      "Contributing to social change",
      "Still figuring it out — and that's okay",
    ],
  },
  {
    id: "q3",
    question: "When you help someone, you feel most proud when...",
    options: [
      "They achieve something they didn't think was possible",
      "You solved a complex problem together",
      "You shared knowledge or a skill",
      "They feel heard and understood",
    ],
  },
  {
    id: "q4",
    question: "Your friends would describe you as someone who...",
    options: [
      "Always has a plan and gets things done",
      "Brings people together",
      "Asks deep questions and thinks critically",
      "Is creative and full of ideas",
    ],
  },
  {
    id: "q5",
    question: "If you could change one thing in Sierra Leone, it would be...",
    options: [
      "Education access for all young people",
      "Economic opportunities and jobs",
      "Healthcare and wellbeing",
      "Governance and community safety",
    ],
  },
];
