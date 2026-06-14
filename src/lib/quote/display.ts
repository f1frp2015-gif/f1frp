// 对外展示层 —— 把确定性引擎(pricing.ts)算出的 CNY 基线换算成各市场对外报价。
//
//   国内(f1frp.com / zh):原样 CNY。
//   海外(getfrp.com / en):× (1 + OVERSEAS_MARKUP) ÷ USD_CNY_RATE,以 USD 展示。
//
// 引擎保持纯 CNY(便于审计 / 回放 / quote_logs);加成与汇率只活在这一层,
// 改加价 / 汇率只动 prices.ts 的两个常数即可。
//
// 加成是曜一出口代理的服务 + margin,对买家是一口价、不在 breakdown 拆细
// (breakdown 在 UI 里只显示百分比,加成是均匀缩放 → 占比不变,买家看不到加价)。

import { OVERSEAS_MARKUP, USD_CNY_RATE } from "./prices";
import type { QuoteResult } from "./types";

export type DisplayMarket = "domestic" | "overseas";

export type PriceDisplay = {
  currency: "CNY" | "USD";
  symbol: "¥" | "$";
  // CNY 基线 → 展示币种的乘数(domestic = 1;overseas = (1 + markup) / fx)
  factor: number;
  markup_pct: number; // 加成百分比(domestic 0;overseas = OVERSEAS_MARKUP×100)
  fx_rate: number | null; // CNY per USD(仅海外;domestic 为 null)
  unit_price_low: number;
  unit_price_high: number;
  total_low: number;
  total_high: number;
};

// f1frp.com = zh = 国内;getfrp.com = en = 海外。host→locale 已在
// resolveServerLocale 里裁决,这里只按 locale 映射市场。
export function marketForLocale(locale: "zh" | "en"): DisplayMarket {
  return locale === "en" ? "overseas" : "domestic";
}

export function buildPriceDisplay(
  result: QuoteResult,
  market: DisplayMarket,
): PriceDisplay {
  const overseas = market === "overseas";
  const factor = overseas ? (1 + OVERSEAS_MARKUP) / USD_CNY_RATE : 1;
  const conv = (cny: number) => Math.round(cny * factor * 100) / 100;
  return {
    currency: overseas ? "USD" : "CNY",
    symbol: overseas ? "$" : "¥",
    factor,
    markup_pct: overseas ? Math.round(OVERSEAS_MARKUP * 100) : 0,
    fx_rate: overseas ? USD_CNY_RATE : null,
    unit_price_low: conv(result.unit_price_low_cny),
    unit_price_high: conv(result.unit_price_high_cny),
    total_low: conv(result.total_low_cny),
    total_high: conv(result.total_high_cny),
  };
}
