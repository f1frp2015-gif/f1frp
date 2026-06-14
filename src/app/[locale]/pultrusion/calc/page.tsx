import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { CalcClient } from "./calc-client";

export const metadata: Metadata = {
  title: "FRP 型材受弯核算 | 复材站",
  description:
    "FRP 拉挤型材线弹性受弯快速核算:截面惯性矩、最大挠度、跨高比、弯曲应力。支持圆管/方管/矩管/工字梁。",
};

export default async function CalcPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <CalcClient />
    </div>
  );
}
