"use client";

import { useState } from "react";
import { CONTACT } from "@/lib/contact";

type Listing = {
  listingId: string;
  name: string;
  currentTier: string;
  category: string;
  enterpriseLinked: boolean;
};

const FEATURED_CATEGORIES = [
  "玻纤", "碳纤", "玄武岩纤维", "芳纶纤维",
  "环氧树脂", "乙烯基酯树脂", "不饱和聚酯",
  "拉挤型材", "RTM 制品", "风电叶片",
  "桥梁加固", "管道", "储氢瓶", "汽车复材", "建筑结构件",
];

export default function SupplierUpgradeForm({ listings }: { listings: Listing[] }) {
  const [listingId, setListingId] = useState(listings[0]?.listingId ?? "");
  const [targetTier, setTargetTier] = useState<"basic" | "pro">("basic");
  const [targetCategory, setTargetCategory] = useState(FEATURED_CATEGORIES[0]);
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactWechat, setContactWechat] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  const selected = listings.find((l) => l.listingId === listingId);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setResult(null);
    try {
      const res = await fetch("/api/supplier-upgrade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          supplierListingId: listingId,
          targetTier,
          targetCategory: targetTier === "pro" ? targetCategory : undefined,
          contactName,
          contactPhone,
          contactWechat: contactWechat || undefined,
          note: note || undefined,
        }),
      });
      const json = (await res.json()) as {
        ok: boolean;
        reason?: string;
        nextStep?: string;
        discountApplied?: number | null;
      };
      if (json.ok) {
        const discountText = json.discountApplied ? `（享 ${json.discountApplied}% 折扣）` : "";
        setResult({
          ok: true,
          message: `${json.nextStep ?? "已提交"}${discountText}`,
        });
      } else {
        setResult({ ok: false, message: json.reason ?? "提交失败" });
      }
    } catch (err) {
      setResult({ ok: false, message: err instanceof Error ? err.message : "网络错误" });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">已认领企业</label>
          <select
            value={listingId}
            onChange={(e) => setListingId(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900"
          >
            {listings.map((l) => (
              <option key={l.listingId} value={l.listingId}>
                {l.name}（当前：{l.currentTier}）
              </option>
            ))}
          </select>
          {selected && !selected.enterpriseLinked ? (
            <p className="text-xs text-amber-600 mt-1">
              该 listing 尚未关联企业资料，提交后客服会先帮你补全。
            </p>
          ) : null}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">升级到</label>
          <div className="grid grid-cols-2 gap-3">
            <label
              className={`rounded-lg border p-3 cursor-pointer ${
                targetTier === "basic"
                  ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30"
                  : "border-zinc-200 dark:border-zinc-700"
              }`}
            >
              <input
                type="radio"
                name="tier"
                value="basic"
                checked={targetTier === "basic"}
                onChange={() => setTargetTier("basic")}
                className="sr-only"
              />
              <div className="font-semibold mb-0.5">Verified 蓝标</div>
              <div className="text-xs text-zinc-500">¥3,800/年（前 100 家半价）</div>
            </label>
            <label
              className={`rounded-lg border p-3 cursor-pointer ${
                targetTier === "pro"
                  ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30"
                  : "border-zinc-200 dark:border-zinc-700"
              }`}
            >
              <input
                type="radio"
                name="tier"
                value="pro"
                checked={targetTier === "pro"}
                onChange={() => setTargetTier("pro")}
                className="sr-only"
              />
              <div className="font-semibold mb-0.5">Featured 头部</div>
              <div className="text-xs text-zinc-500">¥18,800/年（每品类前 10）</div>
            </label>
          </div>
        </div>

        {targetTier === "pro" ? (
          <div>
            <label className="block text-sm font-medium mb-1">Featured 品类</label>
            <select
              value={targetCategory}
              onChange={(e) => setTargetCategory(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900"
            >
              {FEATURED_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <p className="text-xs text-zinc-500 mt-1">
              每品类只接受 10 家 Featured 企业，售完为止。客服核确名额后通知。
            </p>
          </div>
        ) : null}
      </div>

      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 space-y-4">
        <h3 className="text-sm font-semibold">联系方式（用于客服回访）</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input
            required
            placeholder="联系人姓名"
            value={contactName}
            onChange={(e) => setContactName(e.target.value)}
            className="px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900"
          />
          <input
            required
            type="tel"
            placeholder="手机号"
            value={contactPhone}
            onChange={(e) => setContactPhone(e.target.value)}
            className="px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900"
          />
          <input
            placeholder="微信号（可选）"
            value={contactWechat}
            onChange={(e) => setContactWechat(e.target.value)}
            className="px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 md:col-span-2"
          />
        </div>
        <textarea
          placeholder="备注（开票需求 / 特殊期望，可选）"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900"
        />
      </div>

      <button
        type="submit"
        disabled={submitting || !listingId || !contactName || !contactPhone}
        className="w-full px-5 py-3 rounded-lg bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium"
      >
        {submitting ? "提交中…" : "提交升级申请"}
      </button>

      {result ? (
        <div
          className={`p-4 rounded-lg text-sm ${
            result.ok
              ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300"
              : "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300"
          }`}
        >
          {result.message}
          {result.ok ? (
            <p className="mt-2 text-xs opacity-80">
              急需立刻处理？直接联系 {CONTACT.name}{" "}
              <a className="underline ml-1" href={`tel:+86${CONTACT.phoneRaw}`}>
                {CONTACT.phone}
              </a>
            </p>
          ) : null}
        </div>
      ) : null}
    </form>
  );
}
