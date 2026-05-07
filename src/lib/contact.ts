// Locale-aware contact source of truth.
//
// Doris is the en-side (getfrp.com) sourcing desk. On the zh side
// (f1frp.com) the product is anonymous tooling — no human sourcing desk
// is surfaced to users — so all user-facing UI must hide Doris's name,
// phone, WeChat, and personal email, and fall back to the tech mailbox.
//
// CONTACT keeps its structural shape so existing UI compiles without
// null guards; gate rendering with SHOW_SALES_CONTACT instead.
// PRIMARY_CONTACT_EMAIL is the single email safe to render on either
// side without conditional logic.

import { ACTIVE_LOCALE } from "./sites";

export const SHOW_SALES_CONTACT = ACTIVE_LOCALE === "en";

export const CONTACT_TECH = {
  email: "f1frp2015@gmail.com",
} as const;

export const CONTACT = {
  name: "Doris Li",
  phone: "138 8333 8993",
  email: "doris.li@f1composite.com",
  phoneRaw: "13883338993",
  wechat: "13883338993",
} as const;

export const PRIMARY_CONTACT_EMAIL = SHOW_SALES_CONTACT
  ? CONTACT.email
  : CONTACT_TECH.email;
