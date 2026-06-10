import { permanentRedirect } from "next/navigation";
import { ACTIVE_LOCALE } from "@/lib/sites";

// 2026-05-24 起取消所有线上收费,/pricing 永久重定向。
// EN 站 (getfrp.com): /overseas 本身又 308 回 /,所以直接跳 / 避免重定向链
//   (Google 会把多跳 307/重定向链记为 "Redirect error")。
// ZH 站 (f1frp.com): /overseas 是真实的出海方案页,跳过去。
// 用 permanentRedirect(308) 而非 redirect(307):永久跳转才会让 Google 把
// 老 URL 的信号合并到目标并最终从索引中淘汰老 URL。
export const dynamic = "force-static";

export default function PricingPage() {
  permanentRedirect(ACTIVE_LOCALE === "en" ? "/" : "/overseas");
}
