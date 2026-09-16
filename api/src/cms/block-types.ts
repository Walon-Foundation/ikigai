/**
 * Block types and their default configuration.
 *
 * Extracted from the client's lib/blocks/registry.tsx, which also holds each
 * block's React renderer and its admin form fields. Only these two pieces are
 * server concerns: what a valid block type IS, and what config a newly added
 * one starts with. The renderers stay in the client, where they belong.
 *
 * The two must stay in step — adding a block type here without a renderer
 * produces a block the page cannot draw, and adding one there without an entry
 * here makes it unaddable. There is no build-time link between them, so this
 * comment is the link.
 */
export const BLOCK_DEFAULTS: Record<string, Record<string, unknown>> = {
  hero: {
    headline:
      'Helping young people discover purpose, build skills, and create change.',
    body: 'Ikigai is a youth-led organization empowering young people through personal development, wellbeing, mentorship, skills development and community action.',
    primaryLabel: 'Join a programme',
    primaryHref: '/get-involved',
    secondaryLabel: 'Partner with us',
    secondaryHref: '/get-involved#partner',
  },
  about_intro: {
    body: 'Ikigai exists to help young people understand who they are, discover their purpose, and develop the confidence and skills needed to create meaningful impact in their communities.',
  },
  four_pillars: {
    eyebrow: 'What we do',
    title: 'Four ways we help young people grow.',
  },
  impact_stats: { label: 'Our impact so far' },
  featured_programmes: { eyebrow: 'Programmes', title: 'Our initiatives.' },
  upcoming_events: { eyebrow: 'Events', title: "What's coming up." },
  stories: { eyebrow: 'Stories', title: 'Voices from Ikigai.' },
  partners: { label: 'In partnership with' },
  app_cta: {},
  final_cta: {},
};

export function isBlockType(value: string): boolean {
  return Object.hasOwn(BLOCK_DEFAULTS, value);
}
