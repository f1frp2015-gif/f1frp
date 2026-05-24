import { redirect } from "next/navigation";

// 2026-05-24 起取消所有线上收费,/pricing 永久重定向到 /overseas。
// 老外链 / 书签 / SEO 收录都跟着走过去,不会 404。
export const dynamic = "force-static";

export default function PricingPage() {
  redirect("/overseas");
}
