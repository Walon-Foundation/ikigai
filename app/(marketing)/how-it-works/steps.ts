// The step copy, in its own module so the page can stay a server component
// while the reveal animation lives in a client leaf. Previously all of this
// prose was duplicated into the JS bundle as well as the RSC payload, because
// the page itself was marked "use client".
export const STEPS = [
  {
    num: "01",
    eyebrow: "Assessment",
    title: "Discover Your Ikigai",
    body: "Complete our comprehensive self-discovery assessment — what you love, what you are good at, what your community needs, and what creates opportunity for you. At the end, you receive a personalised Purpose Profile and a Purpose Statement written just for you.",
    tag: "Self-Discovery",
  },
  {
    num: "02",
    eyebrow: "AI Matching",
    title: "Meet Your Mentor",
    body: "Our algorithm matches you with the top five mentors based on shared interests, values, personality, and career alignment. Browse the mentor marketplace, choose yours, and begin a 3-day icebreaker phase before committing to the relationship.",
    tag: "Mentor Marketplace",
  },
  {
    num: "03",
    eyebrow: "Your Plan",
    title: "Choose Your Plan",
    body: "Select a mentor subscription, a one-time package, or apply for a sponsored scholarship — no one is left behind due to financial barriers. Payment unlocks full mentorship access, and your invoice history and reminders are all managed in the app.",
    tag: "Flexible Plans",
  },
  {
    num: "04",
    eyebrow: "Growth Roadmap",
    title: "Follow Your Roadmap",
    body: "Work through four structured phases — Find Yourself, Build Yourself, Discover Purpose, and Create Impact. Every milestone you complete — a session, journal entry, workshop, or assessment — grows your personal Growth Tree and contributes to your overall progress.",
    tag: "4 Phases",
  },
  {
    num: "05",
    eyebrow: "Community",
    title: "Create Impact",
    body: "Attend signature events like the Finding Yourself Picnic, complete three verified in-person mentor meetings, engage in community projects and advocacy, and graduate as a confident, purpose-driven leader ready to give back to Sierra Leone.",
    tag: "Graduate & Lead",
  },
] as const;

export type Step = (typeof STEPS)[number];
