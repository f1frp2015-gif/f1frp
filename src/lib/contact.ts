// Locale-aware contact source of truth.
//
// 2026-05 update: removed all personal identifiers from CONTACT (name,
// phone, WeChat). The site no longer surfaces an individual person as
// the contact face — only a team alias and a tech mailbox. This applies
// to BOTH deploys (getfrp.com and f1frp.com).
//
// SHOW_SALES_CONTACT still gates the en side from the zh side: en gets
// a "sourcing desk" team alias + email; zh gets only the tech mailbox.

import { ACTIVE_LOCALE } from "./sites";

export const SHOW_SALES_CONTACT = ACTIVE_LOCALE === "en";

export const CONTACT_TECH = {
  email: "f1frp2015@gmail.com",
} as const;

// Sourcing desk (en/getfrp.com only). Anonymous team alias — no
// individual name, no phone, no WeChat. Email points at the existing
// service mailbox until a dedicated sourcing@f1composite.com is wired
// up in DNS.
export const CONTACT = {
  name: "F1 Composite sourcing desk",
  email: "f1frp2015@gmail.com",
} as const;

// Single email safe to render on either side.
export const PRIMARY_CONTACT_EMAIL = SHOW_SALES_CONTACT
  ? CONTACT.email
  : CONTACT_TECH.email;
