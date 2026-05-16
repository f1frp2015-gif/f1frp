// Single source of truth for user-facing contact info.
//
// Policy: one contact channel, labelled as the technical service
// hotline, identical on both deploys (getfrp.com / f1frp.com).
// No sales-vs-tech split, no individual names, no phone, no WeChat.
// Buyers who want to talk to a human are routed through /rfq first;
// this email is the catch-all for everything else.

export const CONTACT = {
  email: "f1frp2015@gmail.com",
} as const;

export const PRIMARY_CONTACT_EMAIL = CONTACT.email;
