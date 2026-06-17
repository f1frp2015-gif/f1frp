"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export type PriceQuoteRow = {
  name: string;
  nameEn?: string;
  category: string;
  price: number;
  unit: string;
  change: number;
  region: string;
  source?: string;
};

export type AdminPriceReport = {
  id: string;
  weekOf: string;
  title: string;
  summary: string;
  status: "draft" | "published";
  generatedBy: string;
  publishedAt: string | null;
  quotes: PriceQuoteRow[];
  sources: string[];
};

export function AdminPricesManager({
  reports,
  baseline,
}: {
  reports: AdminPriceReport[];
  baseline: Record<string, number>;
}) {
  const t = useTranslations("Dashboard.adminPrices");
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [draft, setDraft] = useState<{ summary: string; quotes: PriceQuoteRow[] } | null>(null);

  function openEditor(r: AdminPriceReport) {
    setOpenId(r.id);
    setDraft({ summary: r.summary, quotes: r.quotes.map((q) => ({ ...q })) });
    setError(null);
  }
  function close() {
    setOpenId(null);
    setDraft(null);
  }

  async function call(url: string, init?: RequestInit) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(url, init);
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(body?.error ?? t("opFailed"));
        return false;
      }
      return true;
    } finally {
      setBusy(false);
    }
  }

  async function createDraft() {
    if (await call("/api/admin/prices", { method: "POST" }))
      startTransition(() => router.refresh());
  }
  async function save(id: string) {
    if (!draft) return;
    const ok = await call(`/api/admin/prices/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ summary: draft.summary, quotes: draft.quotes }),
    });
    if (ok) {
      close();
      startTransition(() => router.refresh());
    }
  }
  async function togglePublish(id: string, publish: boolean) {
    const ok = await call(`/api/admin/prices/${id}/publish`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ publish }),
    });
    if (ok) startTransition(() => router.refresh());
  }

  function updateQuote(i: number, patch: Partial<PriceQuoteRow>) {
    setDraft((d) =>
      d ? { ...d, quotes: d.quotes.map((q, idx) => (idx === i ? { ...q, ...patch } : q)) } : d,
    );
  }
  function removeQuote(i: number) {
    setDraft((d) => (d ? { ...d, quotes: d.quotes.filter((_, idx) => idx !== i) } : d));
  }
  function addQuote() {
    setDraft((d) =>
      d
        ? {
            ...d,
            quotes: [
              ...d.quotes,
              { name: "", category: "resin", price: 0, unit: "元/吨", change: 0, region: "华东" },
            ],
          }
        : d,
    );
  }

  // 对「最新已发布」一期同名材料的周环比%;无基线则 null
  function autoWoW(name: string, price: number): number | null {
    const b = baseline[name];
    return b && b > 0 ? Math.round(((price - b) / b) * 1000) / 10 : null;
  }
  function applyAutoWoW() {
    setDraft((d) =>
      d
        ? {
            ...d,
            quotes: d.quotes.map((q) => {
              const a = autoWoW(q.name, q.price);
              return a === null ? q : { ...q, change: a };
            }),
          }
        : d,
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button onClick={createDraft} disabled={busy}>
          {t("newDraft")}
        </Button>
        <span className="text-xs text-muted-foreground">{t("newDraftHint")}</span>
      </div>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-2 text-xs text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
          {error}
        </div>
      )}

      {reports.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            {t("noReports")}
          </CardContent>
        </Card>
      ) : (
        reports.map((r) => (
          <Card key={r.id}>
            <CardHeader className="pb-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{t("weekOf", { date: r.weekOf })}</span>
                  <Badge variant={r.status === "published" ? "default" : "outline"}>
                    {t(`status.${r.status}`)}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {t("quoteCount", { n: r.quotes.length })}
                    {r.generatedBy && ` · ${r.generatedBy}`}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => (openId === r.id ? close() : openEditor(r))}
                  >
                    {openId === r.id ? t("collapse") : t("edit")}
                  </Button>
                  {r.status === "draft" ? (
                    <Button size="sm" onClick={() => togglePublish(r.id, true)} disabled={busy}>
                      {t("publish")}
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => togglePublish(r.id, false)}
                      disabled={busy}
                    >
                      {t("unpublish")}
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>

            {openId === r.id && draft && (
              <CardContent className="space-y-3">
                <div>
                  <label className="mb-1 block text-xs font-medium">{t("summary")}</label>
                  <Textarea
                    rows={2}
                    value={draft.summary}
                    onChange={(e) => setDraft((d) => (d ? { ...d, summary: e.target.value } : d))}
                    placeholder={t("summaryPlaceholder")}
                  />
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs text-muted-foreground">
                        <th className="p-1">{t("colName")}</th>
                        <th className="p-1">{t("colPrice")}</th>
                        <th className="p-1">{t("colUnit")}</th>
                        <th className="p-1">{t("colChange")}</th>
                        <th className="p-1">{t("colRegion")}</th>
                        <th className="p-1">{t("colSource")}</th>
                        <th />
                      </tr>
                    </thead>
                    <tbody>
                      {draft.quotes.map((q, i) => (
                        <tr key={i} className="border-t">
                          <td className="p-1">
                            <Input
                              value={q.name}
                              onChange={(e) => updateQuote(i, { name: e.target.value })}
                              className="h-8 min-w-[140px]"
                            />
                          </td>
                          <td className="p-1">
                            <Input
                              type="number"
                              value={q.price}
                              onChange={(e) => updateQuote(i, { price: Number(e.target.value) })}
                              className="h-8 w-24"
                            />
                          </td>
                          <td className="p-1">
                            <Input
                              value={q.unit}
                              onChange={(e) => updateQuote(i, { unit: e.target.value })}
                              className="h-8 w-20"
                            />
                          </td>
                          <td className="p-1">
                            <Input
                              type="number"
                              step="0.1"
                              value={q.change}
                              onChange={(e) => updateQuote(i, { change: Number(e.target.value) })}
                              className="h-8 w-20"
                            />
                            {autoWoW(q.name, q.price) !== null && (
                              <button
                                type="button"
                                onClick={() => updateQuote(i, { change: autoWoW(q.name, q.price)! })}
                                className="mt-0.5 block text-[10px] text-muted-foreground hover:text-primary"
                                title={t("applyThisRow")}
                              >
                                {t("vsLast")} {autoWoW(q.name, q.price)}%
                              </button>
                            )}
                          </td>
                          <td className="p-1">
                            <Input
                              value={q.region}
                              onChange={(e) => updateQuote(i, { region: e.target.value })}
                              className="h-8 w-20"
                            />
                          </td>
                          <td className="p-1">
                            <Input
                              value={q.source ?? ""}
                              onChange={(e) => updateQuote(i, { source: e.target.value })}
                              className="h-8 min-w-[120px]"
                              placeholder={t("colSource")}
                            />
                          </td>
                          <td className="p-1">
                            <Button size="sm" variant="ghost" onClick={() => removeQuote(i)}>
                              ×
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={addQuote}>
                      {t("addRow")}
                    </Button>
                    <Button size="sm" variant="outline" onClick={applyAutoWoW}>
                      {t("autoWoW")}
                    </Button>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="ghost" onClick={close} disabled={busy}>
                      {t("cancel")}
                    </Button>
                    <Button size="sm" onClick={() => save(r.id)} disabled={busy}>
                      {busy ? t("saving") : t("save")}
                    </Button>
                  </div>
                </div>
              </CardContent>
            )}
          </Card>
        ))
      )}
    </div>
  );
}
