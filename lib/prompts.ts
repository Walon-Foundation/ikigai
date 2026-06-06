// Rotating journal prompts (PRD §15). Pure — pick a stable daily prompt so it
// doesn't change on every render.

export const REFLECTION_PROMPTS = [
  "What did you learn about yourself today?",
  "What challenged you this week, and how did you respond?",
  "Describe a moment you felt proud recently.",
  "What is one thing you want to improve, and why?",
  "Who inspired you lately, and what did they teach you?",
  "What does success look like for you right now?",
  "What fear would you like to overcome?",
];

export const GRATITUDE_PROMPTS = [
  "Name three things you're grateful for today.",
  "Who is someone you appreciate, and why?",
  "What small thing made you smile recently?",
  "What strength of yours are you thankful for?",
];

function pick(list: string[]): string {
  // Deterministic by day so the prompt is stable within a day.
  const day = Math.floor(Date.now() / 86_400_000);
  return list[day % list.length];
}

export function dailyReflectionPrompt(): string {
  return pick(REFLECTION_PROMPTS);
}

export function dailyGratitudePrompt(): string {
  return pick(GRATITUDE_PROMPTS);
}
