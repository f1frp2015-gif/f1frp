import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Badge } from "@/components/ui/badge";
import { FIBERS } from "@/lib/data/matrix";
import { alternates } from "@/lib/seo";

export const revalidate = 3600;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const isEn = locale === "en";
  return {
    title: isEn
      ? "Composite Fibers Index — Glass / Carbon / Basalt / Aramid / Bio | f1frp"
      : "复材纤维体系总览 — 玻纤 / 碳纤 / 玄武岩 / 芳纶 / 生物基 | 复材站",
    description: isEn
      ? "Index of composite reinforcement fiber families with grades, applications, and links to materials, papers, and patents per fiber type."
      : "复合材料增强纤维家族总览:玻璃纤维、碳纤维、玄武岩、芳纶、生物基。每种纤维下挂材料牌号、论文、专利数据。",
    alternates: alternates("/fibers"),
  };
}

export default async function FibersHubPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const isEn = locale === "en";
  const t = await getTranslations({ locale, namespace: "Fibers" });

  return (
    <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16">
      <header className="mb-12 sm:mb-16">
        <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
          {t("breadcrumbFibers")}
        </div>
        <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">
          {isEn ? "Composite reinforcement fibers" : "复合材料增强纤维家族"}
        </h1>
        <p className="mt-5 max-w-3xl text-[15px] leading-relaxed text-muted-foreground">
          {isEn
            ? "Pick a fiber family to drill into grade ranges, suppliers, papers, patents, and process compatibility — all linked into the rest of the f1frp libraries."
            : "选择纤维家族,进入对应的牌号区间、供应商、论文、专利、工艺兼容性 — 全部交叉链接到 f1frp 六大库。"}
        </p>
      </header>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {FIBERS.map((f) => {
          const name = isEn ? f.nameEn : f.name;
          // getfrp.com (en): never show the Chinese name as a subtitle.
          const altName = isEn ? null : f.nameEn;
          const grades = isEn ? f.gradesEn ?? f.grades : f.grades;
          const keywords = isEn
            ? f.keywords.filter((k) => !/[一-鿿]/.test(k))
            : f.keywords;
          return (
            <Link
              key={f.slug}
              href={`/fibers/${f.slug}` as never}
              className="group flex flex-col rounded-lg border border-border/70 bg-background p-6 transition-colors hover:border-foreground/60"
            >
              <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                {f.mono}
              </div>
              <h2 className="mt-3 text-xl font-semibold tracking-tight">
                {name}
              </h2>
              {altName && (
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {altName}
                </p>
              )}
              <p className="mt-4 text-[13px] leading-relaxed text-muted-foreground">
                <span className="text-muted-foreground/70">
                  {isEn ? "Grade families" : "牌号体系"}:
                </span>{" "}
                <span className="font-medium text-foreground/90">
                  {grades}
                </span>
              </p>
              <div className="mt-4 flex flex-wrap gap-1.5">
                {keywords.slice(0, 4).map((k) => (
                  <Badge
                    key={k}
                    variant="outline"
                    className="text-[10px] font-normal"
                  >
                    {k}
                  </Badge>
                ))}
              </div>
              <div className="mt-5 inline-flex items-center gap-1 text-[13px] font-medium text-foreground/80 transition-colors group-hover:text-foreground">
                {isEn ? "Open dossier" : "进入档案"}
                <ArrowRight
                  size={14}
                  className="transition-transform group-hover:translate-x-0.5"
                />
              </div>
            </Link>
          );
        })}
      </div>
    </main>
  );
}
