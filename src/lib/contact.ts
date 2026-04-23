// Single source of truth for sales / support contact.
// Used by /pricing, /dashboard/upgrade, /dashboard/supplier-upgrade and emails.

export const CONTACT = {
  name: "Doris Li",
  phone: "138 8333 8993",
  email: "f1frp2015@gmail.com",
  // For tel: links — strip whitespace.
  phoneRaw: "13883338993",
  // WeChat handle is same as phone for most Chinese suppliers.
  wechat: "13883338993",
} as const;
