"use client";

import { useState } from "react";
import { useRouter, Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ArticleBody } from "@/components/article-body";

type Draft = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  category: string;
  readTime: string;
  forZh: boolean;
  forEn: boolean;
  hot: boolean;
  isPublished: boolean;
  publishedAt: string | null;
};

const CATEGORIES = [
  { id: "industry", name: "行业动态" },
  { id: "policy", name: "政策法规" },
  { id: "tech", name: "技术前沿" },
  { id: "company", name: "企业新闻" },
  { id: "expo", name: "展会活动" },
];

export function EditDraftClient({ article }: { article: Draft }) {
  const router = useRouter();
  const [title, setTitle] = useState(article.title);
  const [excerpt, setExcerpt] = useState(article.excerpt);
  const [body, setBody] = useState(article.body);
  const [category, setCategory] = useState(article.category);
  const [readTime, setReadTime] = useState(article.readTime);
  const [forZh, setForZh] = useState(article.forZh);
  const [forEn, setForEn] = useState(article.forEn);
  const [hot, setHot] = useState(article.hot);
  const [published, setPublished] = useState(article.isPublished);

  const [busy, setBusy] = useState<null | string>(null);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  async function save() {
    setBusy("save");
    setMsg(null);
    try {
      const res = await fetch(`/api/admin/articles/${article.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ title, excerpt, body, category, readTime, forZh, forEn, hot }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j?.error ?? "保存失败");
      setMsg({ kind: "ok", text: "已保存草稿" });
      router.refresh();
    } catch (e) {
      setMsg({ kind: "err", text: e instanceof Error ? e.message : "保存失败" });
    } finally {
      setBusy(null);
    }
  }

  async function togglePublish(unpublish: boolean) {
    // Save edits first so the published version matches what's on screen.
    if (!unpublish) await save();
    setBusy("publish");
    setMsg(null);
    try {
      const res = await fetch(`/api/admin/articles/${article.id}/publish`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ unpublish }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j?.error ?? "操作失败");
      setPublished(!unpublish);
      setMsg({
        kind: "ok",
        text: unpublish ? "已取消发布（回到草稿）" : "已发布，已对外可见",
      });
      router.refresh();
    } catch (e) {
      setMsg({ kind: "err", text: e instanceof Error ? e.message : "操作失败" });
    } finally {
      setBusy(null);
    }
  }

  async function remove() {
    if (!confirm("确认删除这篇文章？不可恢复。")) return;
    setBusy("delete");
    setMsg(null);
    try {
      const res = await fetch(`/api/admin/articles/${article.id}`, { method: "DELETE" });
      const j = await res.json();
      if (!res.ok) throw new Error(j?.error ?? "删除失败");
      router.push("/dashboard/admin/articles");
    } catch (e) {
      setMsg({ kind: "err", text: e instanceof Error ? e.message : "删除失败" });
      setBusy(null);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/admin/articles"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            ← 草稿箱
          </Link>
          <Badge variant={published ? "default" : "secondary"}>
            {published ? "已发布" : "草稿"}
          </Badge>
          <span className="text-xs text-muted-foreground">/articles/{article.slug}</span>
        </div>
        {published && (
          <Link
            href={`/articles/${article.slug}` as "/articles/[slug]"}
            target="_blank"
            className="text-sm text-primary hover:underline"
          >
            查看公开页 ↗
          </Link>
        )}
      </div>

      {msg && (
        <div
          className={`rounded-md border px-3 py-2 text-sm ${
            msg.kind === "ok"
              ? "border-green-500/40 bg-green-500/10 text-green-700 dark:text-green-400"
              : "border-red-500/40 bg-red-500/10 text-red-700 dark:text-red-400"
          }`}
        >
          {msg.text}
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Editor */}
        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground">标题</label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1" />
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-xs font-medium text-muted-foreground">分类</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="w-32">
              <label className="text-xs font-medium text-muted-foreground">阅读时长</label>
              <Input value={readTime} onChange={(e) => setReadTime(e.target.value)} placeholder="6分钟" className="mt-1" />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground">摘要</label>
            <Textarea value={excerpt} onChange={(e) => setExcerpt(e.target.value)} rows={3} className="mt-1" />
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground">正文（Markdown）</label>
            <Textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={22}
              className="mt-1 font-mono text-xs leading-relaxed"
            />
          </div>

          <div className="flex flex-wrap items-center gap-4 text-sm">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={forZh} onChange={(e) => setForZh(e.target.checked)} />
              国内站(f1frp.com)
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={forEn} onChange={(e) => setForEn(e.target.checked)} />
              海外站(getfrp.com)
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={hot} onChange={(e) => setHot(e.target.checked)} />
              热门
            </label>
          </div>

          <div className="flex flex-wrap gap-2 border-t pt-4">
            <Button onClick={save} disabled={busy !== null}>
              {busy === "save" ? "保存中…" : "保存草稿"}
            </Button>
            {!published ? (
              <Button onClick={() => togglePublish(false)} disabled={busy !== null} variant="default">
                {busy === "publish" ? "发布中…" : "发布"}
              </Button>
            ) : (
              <Button onClick={() => togglePublish(true)} disabled={busy !== null} variant="outline">
                {busy === "publish" ? "处理中…" : "取消发布"}
              </Button>
            )}
            <Button onClick={remove} disabled={busy !== null} variant="destructive" className="ml-auto">
              删除
            </Button>
          </div>
        </div>

        {/* Live preview */}
        <div className="space-y-2">
          <div className="text-xs font-medium text-muted-foreground">预览</div>
          <Card>
            <CardContent className="py-5">
              <h1 className="text-xl font-bold leading-snug">{title || "（无标题）"}</h1>
              {excerpt && <p className="mt-2 text-sm text-muted-foreground">{excerpt}</p>}
              <div className="mt-4">
                <ArticleBody content={body} />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
