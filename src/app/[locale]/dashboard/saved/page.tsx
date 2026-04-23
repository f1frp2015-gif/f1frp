import type { Metadata } from "next";
import { auth } from "@clerk/nextjs/server";
import { desc, eq } from "drizzle-orm";
import { Bookmark } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { db } from "@/lib/db";
import { users, savedItems } from "@/lib/db/schema";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { UnsaveButton } from "./unsave-button";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Saved" });
  return { title: t("pageTitle") };
}

const SOURCE_COLORS: Record<string, string> = {
  material: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200",
  formula: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200",
  standard: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200",
  paper: "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-200",
  patent: "bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-200",
  supplier: "bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-200",
  article: "bg-slate-100 text-slate-800 dark:bg-slate-800/60 dark:text-slate-200",
};

export default async function SavedPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Saved");

  const { userId: clerkId } = await auth();
  if (!clerkId) {
    return (
      <div className="max-w-xl py-10">
        <h1 className="text-2xl font-bold">{t("pageTitle")}</h1>
        <p className="mt-4 text-sm text-muted-foreground">{t("needLogin")}</p>
        <Link
          href="/sign-in"
          className="mt-4 inline-block text-sm text-primary hover:underline"
        >
          {t("signIn")} →
        </Link>
      </div>
    );
  }

  const [me] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.clerkId, clerkId))
    .limit(1);

  const rows = me
    ? await db
        .select({
          id: savedItems.id,
          sourceType: savedItems.sourceType,
          sourceId: savedItems.sourceId,
          title: savedItems.title,
          url: savedItems.url,
          note: savedItems.note,
          createdAt: savedItems.createdAt,
        })
        .from(savedItems)
        .where(eq(savedItems.userId, me.id))
        .orderBy(desc(savedItems.createdAt))
    : [];

  // Group by sourceType for a clean at-a-glance layout.
  const groups = new Map<string, typeof rows>();
  for (const r of rows) {
    const g = groups.get(r.sourceType) ?? [];
    g.push(r);
    groups.set(r.sourceType, g);
  }

  const ORDER: string[] = ["material", "formula", "standard", "paper", "patent", "supplier", "article"];

  return (
    <div className="max-w-5xl">
      <header className="mb-8">
        <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
          <Bookmark size={14} />
          {t("eyebrow")}
        </div>
        <h1 className="mt-2 text-3xl font-bold">{t("pageTitle")}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {t("totalCount", { count: rows.length })}
        </p>
      </header>

      {rows.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Bookmark size={24} strokeWidth={1.5} className="mx-auto text-muted-foreground" />
            <p className="mt-3 text-sm text-muted-foreground">{t("empty")}</p>
            <div className="mt-4 flex flex-wrap justify-center gap-3 text-[12px]">
              <Link href="/materials" className="text-primary hover:underline">
                /materials
              </Link>
              <Link href="/papers" className="text-primary hover:underline">
                /papers
              </Link>
              <Link href="/patents" className="text-primary hover:underline">
                /patents
              </Link>
              <Link href="/formulas" className="text-primary hover:underline">
                /formulas
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {ORDER.filter((s) => groups.has(s)).map((source) => {
            const list = groups.get(source)!;
            return (
              <section key={source}>
                <div className="mb-3 flex items-center gap-2 border-b border-border/70 pb-2">
                  <Badge
                    className={`font-mono text-[10px] uppercase tracking-[0.14em] ${SOURCE_COLORS[source]}`}
                  >
                    {t(`sources.${source}`)}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {list.length}
                  </span>
                </div>
                <div className="grid gap-2 md:grid-cols-2">
                  {list.map((r) => (
                    <div
                      key={r.id}
                      className="group relative flex items-start justify-between gap-3 rounded-md border bg-background p-3 transition-colors hover:border-primary/40 hover:bg-muted/30"
                    >
                      <div className="min-w-0 flex-1">
                        {r.url ? (
                          <a
                            href={r.url}
                            className="block font-medium leading-snug line-clamp-2 hover:text-primary"
                          >
                            {r.title}
                          </a>
                        ) : (
                          <div className="font-medium leading-snug line-clamp-2">
                            {r.title}
                          </div>
                        )}
                        <div className="mt-1 font-mono text-[10px] text-muted-foreground">
                          {r.createdAt.toISOString().slice(0, 10)}
                        </div>
                        {r.note && (
                          <p className="mt-1.5 text-xs text-muted-foreground line-clamp-3">
                            {r.note}
                          </p>
                        )}
                      </div>
                      <UnsaveButton
                        sourceType={r.sourceType as string}
                        sourceId={r.sourceId}
                      />
                    </div>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
