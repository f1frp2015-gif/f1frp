import type { Metadata } from "next";
import UValueCalculator from "./u-value-calculator";

export const metadata: Metadata = {
  title: "窗户U值计算器 - FRP窗框整窗传热系数计算",
  description:
    "按EN ISO 10077-1标准计算整窗传热系数(Uw)，比较FRP、铝合金、PVC、木材窗框热工性能，对照国内外节能标准。",
};

export default function UValueCalculatorPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">窗户U值计算器</h1>
        <p className="mt-2 text-muted-foreground">
          按EN ISO 10077-1标准计算整窗传热系数(U<sub>w</sub>) · 框材/玻璃/间隔条对比
        </p>
      </div>
      <UValueCalculator />
    </div>
  );
}
