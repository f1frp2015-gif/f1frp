// 收款方信息 — 重庆曜一新材料有限公司对公账户。
// 真实银行账号通过环境变量注入（不写死代码、不进 git）。
// ECS 上的 .env.production.local 设置：
//   F1FRP_BANK_PAYEE_NAME / F1FRP_BANK_NAME / F1FRP_BANK_ACCOUNT / F1FRP_ALIPAY_QR_URL / F1FRP_WECHAT_QR_URL

export interface BankInfo {
  payeeName: string;
  bankName: string;
  account: string;
  branch?: string;
  swift?: string;
}

export interface OfflineChannelsConfig {
  bankTransfer: BankInfo;
  alipay: { available: boolean; qrUrl?: string; merchantId?: string };
  wechat: { available: boolean; qrUrl?: string; merchantId?: string };
  contactEmail: string;
  contactPhone: string;
}

const PLACEHOLDER_BANK: BankInfo = {
  payeeName: "重庆曜一新材料有限公司",
  bankName: "（请联系客服获取银行信息）",
  account: "（请联系客服获取账号）",
};

export function getOfflineChannels(): OfflineChannelsConfig {
  const env = process.env;
  const bankConfigured =
    !!env.F1FRP_BANK_PAYEE_NAME &&
    !!env.F1FRP_BANK_NAME &&
    !!env.F1FRP_BANK_ACCOUNT;

  return {
    bankTransfer: bankConfigured
      ? {
          payeeName: env.F1FRP_BANK_PAYEE_NAME!,
          bankName: env.F1FRP_BANK_NAME!,
          account: env.F1FRP_BANK_ACCOUNT!,
          branch: env.F1FRP_BANK_BRANCH || undefined,
          swift: env.F1FRP_BANK_SWIFT || undefined,
        }
      : PLACEHOLDER_BANK,
    alipay: {
      available: !!env.F1FRP_ALIPAY_QR_URL,
      qrUrl: env.F1FRP_ALIPAY_QR_URL,
      merchantId: env.F1FRP_ALIPAY_MERCHANT_ID,
    },
    wechat: {
      available: !!env.F1FRP_WECHAT_QR_URL,
      qrUrl: env.F1FRP_WECHAT_QR_URL,
      merchantId: env.F1FRP_WECHAT_MERCHANT_ID,
    },
    contactEmail: "doris.li@f1composite.com",
    contactPhone: "138 8333 8993",
  };
}

// 短订单号：YYMMDD-{type}-{6 hex} → 例如 260430-RFQ-A1B2C3
// 用户转账备注栏写这个，便于人工对账。
export function generateOrderNo(orderType: string): string {
  const d = new Date();
  const yy = String(d.getFullYear()).slice(2);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const rand = Math.random().toString(16).slice(2, 8).toUpperCase();
  const typeAbbr =
    orderType === "rfq" ? "RFQ"
    : orderType === "report" ? "RPT"
    : orderType === "pro_membership" ? "PRO"
    : orderType === "agency_deposit" ? "AGD"
    : "OTH";
  return `${yy}${mm}${dd}-${typeAbbr}-${rand}`;
}
