// Customer testimonials surfaced on /source-from-china and on every
// /sourcing/[topic] page. Western B2B buyers heavily weight peer-buyer
// quotes — three real testimonials usually convert better than ten more
// pages of editorial content.
//
// Rules:
//   1. NEVER fabricate. Every entry must come from a real buyer's email /
//      Slack / LinkedIn message; "verifiable" must be true.
//   2. Anonymization is fine — overseas buyers expect to see "Procurement
//      lead at a Tier-1 EU EPC" rather than full names, especially for
//      commodity sourcing. Keep enough context (geography, sector, role,
//      project size) to make it credible.
//   3. The component renders nothing if this array is empty — better to
//      hide the block than show "Coming soon" (negative signal).
//   4. Once 3+ verifiable testimonials are in, also enable Review schema
//      (see TestimonialsBlock JSON-LD branch).

export interface Testimonial {
  id: string;
  /** The quote itself — keep to 1-3 sentences, no marketing edit. */
  quote: string;
  /** Author identity, with anonymization fields if name not consented. */
  author: {
    /** Real name if consented; otherwise undefined → renders as anonymized role. */
    name?: string;
    /** Role at company — always shown. */
    role: string;
    /** Company name if consented; otherwise short description ("Tier-1 EU EPC"). */
    company?: string;
    /** Country code (ISO 3166-1 alpha-2). Helps Western readers locate the buyer. */
    countryCode?: string;
  };
  /** When the project was delivered — increases credibility vs undated quotes. */
  date: string;
  /** Optional context line: project type, product, scale. */
  context?: string;
  /** Marker for editorial integrity — never set true without an actual source on file. */
  verifiable: boolean;
}

// Empty until first real testimonial lands. Component below renders null
// when the array is empty, so the absence doesn't produce a visible gap.
//
// TODO(user): after the first 3-5 paying buyers (Phase 1 H1 validation
// loop), ask permission to quote them and seed this array. Anonymization
// is fine — see header rule (2) above.
export const testimonials: Testimonial[] = [];
