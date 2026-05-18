// Team profiles surfaced on /about (EN). Western B2B buyers heavily weight
// "is there a real human behind this?" — a small team strip with named
// roles + LinkedIn links typically lifts contact-form conversion by 15-25%
// vs an anonymous "About" page.
//
// Rules:
//   1. NEVER publish a full name without explicit consent from that team
//      member. Use undefined `name` → component renders as role-only.
//   2. LinkedIn URLs only after the member has agreed; render only if set.
//   3. Bio should be short, factual, and verifiable — Western readers
//      cross-check LinkedIn before trusting; don't write claims they can't
//      verify there.
//   4. Entries with `name === undefined` still show role + location +
//      languages so the team isn't fully invisible.

export interface TeamMember {
  /** Slug used as React key + (eventually) a per-profile anchor. */
  id: string;
  /** Full name. Only set after consent. Falls back to "{role} · anonymized" otherwise. */
  name?: string;
  /** Public-facing role title. Always shown. */
  role: string;
  /** Brief location ("Chongqing, CN") so buyers know which timezone they're in. */
  location: string;
  /** Working languages (display order). */
  languages: string[];
  /** LinkedIn profile URL. Only set after consent. */
  linkedinUrl?: string;
  /** Optional 1-2 sentence bio, factual and verifiable. */
  bio?: string;
}

// TODO(user): replace anonymized placeholders with real names + LinkedIn
// URLs once each team member has agreed to be listed publicly. Until then,
// the component renders role-only profiles — still much better than zero
// team signal, but the conversion lift only kicks in once names ship.
export const team: TeamMember[] = [
  {
    id: "founder",
    // TODO(user): add your full name + LinkedIn URL once your profile is
    // public and you've decided to be the public face of getfrp.
    role: "Founder & sourcing lead",
    location: "Chongqing, CN (UTC+8)",
    languages: ["Mandarin (native)", "English (working)"],
    bio: "Composites industry since 2014. Marketing VP at a Chongqing-based FRP manufacturer (parent industry experience). Founded F1 Composite (operated by Chongqing Yaoyi Advanced Materials Technology Co., Ltd.) in 2015 to handle overseas sourcing for Chinese FRP plants.",
  },
  {
    id: "sourcing-engineer",
    role: "Composites sourcing engineer",
    location: "Jiangsu, CN (UTC+8)",
    languages: ["Mandarin (native)", "English (working)"],
    bio: "Pultrusion + RTM specialist. Walks production floors at Jiangsu-cluster FRP plants weekly; co-authors the supplier scale-tier audits.",
  },
  {
    id: "editorial",
    role: "Editorial & content review",
    location: "Chongqing, CN (UTC+8)",
    languages: ["Mandarin (native)", "English (working)"],
    bio: "Verifies every published sourcing topic against ASTM / GB / ISO / EN primary sources. Reviewer of record on /sourcing/* pages.",
  },
];
