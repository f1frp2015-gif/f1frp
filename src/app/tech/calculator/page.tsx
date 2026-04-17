import type { Metadata } from "next";
import ProfileCalculator from "./profile-calculator";

export const metadata: Metadata = {
  title: "FRP型材计算器 - 梁分析与钢材替换计算",
  description:
    "FRP拉挤型材工程计算器：梁挠度/弯曲应力分析，钢材→FRP等效替换计算，支持EN 13706、GB/T 31539、ASCE标准。",
};

export default function CalculatorPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">FRP型材计算器</h1>
        <p className="mt-2 text-muted-foreground">
          梁挠度与弯曲应力分析 · 钢材/铝材→FRP等效替换计算
        </p>
      </div>
      <ProfileCalculator />
    </div>
  );
}
