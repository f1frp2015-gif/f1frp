// Single source of truth for sales / support contact.
// Used by /pricing, /dashboard/upgrade, /dashboard/supplier-upgrade and emails.

export const CONTACT = {
  name: "Doris Li",
  phone: "138 8333 8993",
  email: "doris.li@f1composite.com",
  // For tel: links — strip whitespace.
  phoneRaw: "13883338993",
  // WeChat handle is same as phone for most Chinese suppliers.
  wechat: "13883338993",
} as const;

// Technical / editorial channel — standards feedback, formula contributions,
// RFQ dispatch fallback. Surfaced alongside CONTACT in user-facing contact blocks.
export const CONTACT_TECH = {
  email: "f1frp2015@gmail.com",
} as const;
