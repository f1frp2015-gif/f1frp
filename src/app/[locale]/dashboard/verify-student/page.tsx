"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";

export default function VerifyStudentPage() {
  const { user, isLoaded } = useUser();
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  const studentEmails = (user?.emailAddresses ?? []).filter((e) => {
    const d = e.emailAddress.split("@")[1]?.toLowerCase() ?? "";
    return /\.edu\.cn$|\.edu$|\.ac\.cn$|\.edu\.hk$|\.edu\.tw$/.test(d);
  });
  const verifiedStudent = studentEmails.find((e) => e.verification?.status === "verified");

  async function handleVerify() {
    setSubmitting(true);
    setResult(null);
    try {
      const res = await fetch("/api/student-verify", { method: "POST" });
      const json = (await res.json()) as { ok: boolean; reason?: string; expiresAt?: string };
      if (json.ok) {
        setResult({
          ok: true,
          message: `认证成功！学生版有效期至 ${json.expiresAt?.slice(0, 10)}。`,
        });
      } else {
        setResult({ ok: false, message: json.reason ?? "认证失败" });
      }
    } catch (e) {
      setResult({ ok: false, message: e instanceof Error ? e.message : "网络错误" });
    } finally {
      setSubmitting(false);
    }
  }

  if (!isLoaded) return <main className="container max-w-2xl mx-auto px-4 py-12">加载中…</main>;

  return (
    <main className="container max-w-2xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-2">学生认证</h1>
      <p className="text-zinc-500 dark:text-zinc-400 mb-8">
        在校生免费用学生版（AI 30 次/天 + 下载 50 次/月 + 完整中文摘录）。
      </p>

      <section className="rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 mb-6">
        <h2 className="text-lg font-semibold mb-3">第一步：添加学校邮箱</h2>
        <p className="text-sm text-zinc-500 mb-3">
          支持后缀：<code>.edu.cn</code> / <code>.edu</code> / <code>.ac.cn</code> /{" "}
          <code>.edu.hk</code> / <code>.edu.tw</code>
        </p>
        {studentEmails.length === 0 ? (
          <p className="text-sm">
            还没绑定学校邮箱？请到{" "}
            <a
              href="https://accounts.f1frp.com/user"
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-600 hover:underline"
            >
              账户设置
            </a>
            （或个人头像 → Manage account → Email addresses）添加并完成验证。
          </p>
        ) : (
          <ul className="space-y-2 text-sm">
            {studentEmails.map((e) => (
              <li key={e.id} className="flex items-center justify-between">
                <span>{e.emailAddress}</span>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${
                    e.verification?.status === "verified"
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-amber-100 text-amber-700"
                  }`}
                >
                  {e.verification?.status === "verified" ? "已验证" : "未验证"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 mb-6">
        <h2 className="text-lg font-semibold mb-3">第二步：开通学生版</h2>
        <button
          type="button"
          disabled={!verifiedStudent || submitting}
          onClick={handleVerify}
          className="px-5 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium"
        >
          {submitting ? "认证中…" : verifiedStudent ? "立即开通" : "请先验证学校邮箱"}
        </button>
        {result ? (
          <div
            className={`mt-4 text-sm p-3 rounded-lg ${
              result.ok
                ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300"
                : "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300"
            }`}
          >
            {result.message}
          </div>
        ) : null}
      </section>

      <p className="text-sm text-center text-zinc-500">
        毕业了？<Link href="/pricing" className="text-emerald-600 hover:underline">看专业版</Link>
      </p>
    </main>
  );
}
