// Outbound links for the Pad Her Power resource cards.
//
// Kept apart from the card copy in lib/constants.ts on purpose: these point at
// other people's websites, which move and rot on their own schedule. Editing a
// URL here should never mean touching UI code. Keys are the `id` of the matching
// entry in PAD_HER_POWER_RESOURCES — a card whose id is missing from this map
// simply renders without a link rather than showing a dead button.
//
// Choosing links for this page has constraints most link lists don't:
//
//  - The audience is adolescent girls in Sierra Leone. Sources are picked for
//    plain language over clinical accuracy-at-all-costs; a page a 14-year-old
//    closes immediately has helped nobody.
//  - Data costs money here and the app ships a Lite Mode that strips images, so
//    every link below is a text-first page. No video-only destinations.
//  - Prefer institutions that will still exist in five years (NHS, UNFPA) over
//    blogs and content farms, which dominate search results on these topics.
//  - `source` is shown on the button. Naming the destination before the tap is
//    the difference between a link and an ambush — it also lets a girl decide
//    whether opening it is safe on a shared or borrowed phone.
//
// Reviewed and confirmed loading: 16 July 2026.

export type ResourceLink = {
  url: string;
  /** Shown on the card, e.g. "Read more on NHS". Name the destination. */
  source: string;
};

export const PAD_HER_POWER_LINKS: Record<string, ResourceLink> = {
  // Understanding Your Cycle — covers cycle length, what's normal, products,
  // PMS, and when to seek help. Almost entirely text.
  p1: {
    url: "https://www.nhs.uk/conditions/periods/",
    source: "NHS",
  },

  // Managing Period Pain — self-care measures, painkillers, and the "see a
  // doctor if" threshold the card's "when to seek help" promise implies.
  p2: {
    url: "https://www.nhs.uk/symptoms/period-pain/",
    source: "NHS",
  },

  // Contraception Options — 15 methods, each explained in a sentence.
  // See the note in the commit/PR: UNFPA's Sierra Leone family planning page
  // (https://sierraleone.unfpa.org/en/topics/family-planning) is the locally
  // specific source, but it is written for health officials and policymakers —
  // fertility-rate statistics and supply-chain reporting, not "what are my
  // options". Swap it in here if you'd rather have local framing than a page a
  // teenager can actually use.
  p3: {
    url: "https://www.nhs.uk/contraception/methods-of-contraception/",
    source: "NHS",
  },

  // Consent & Boundaries — AMAZE is purpose-built adolescent sex education.
  // The page leads with a video but carries the full explanation in text
  // beneath it, so it still works on a slow connection.
  p4: {
    url: "https://amaze.org/video/consent/",
    source: "AMAZE",
  },

  // Nutrition for Girls — iron specifically: why it matters, food sources,
  // deficiency. Iron is the nutrient that matters most for menstruating girls
  // (blood loss + growth is exactly the anaemia risk profile WHO and UNICEF
  // target). The card's copy also mentions folate, which this page does not
  // cover; https://www.nhs.uk/conditions/vitamins-and-minerals/vitamin-b/ is
  // the folate equivalent if you'd rather split it into two cards.
  p5: {
    url: "https://www.nhs.uk/conditions/vitamins-and-minerals/iron/",
    source: "NHS",
  },

  // Body Image & Self-Worth — practical self-esteem guidance. Chosen over the
  // NHS's regional body-image pages, which are better targeted but push UK-only
  // helplines (Kooth, The Mix) that are unreachable from Sierra Leone. This
  // page's advice stands on its own; local help is already one tap away on the
  // Safety page (SAFETY_RESOURCES).
  p6: {
    url: "https://www.nhs.uk/mental-health/self-help/tips-and-support/raise-low-self-esteem/",
    source: "NHS",
  },
};
