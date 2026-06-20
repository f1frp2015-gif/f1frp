import type { Metadata } from "next";
import { alternates } from "@/lib/seo";
import {
  Cpu,
  Database,
  Workflow,
  Compass,
  Sparkles,
  Rocket,
} from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import {
  PlatformHero,
  PlatformCardGrid,
  PlatformCard,
} from "@/components/platform-card";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Platform.Hub" });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: alternates("/platform"),
  };
}

type Topic = {
  href: string;
  Icon: typeof Cpu;
  mono: string;
  key: string;
  number: number;
  accent?: boolean;
};

const TOPICS: Topic[] = [
  {
    href: "/platform/architecture",
    Icon: Cpu,
    mono: "ARCHITECTURE",
    key: "architecture",
    number: 1,
    accent: true,
  },
  {
    href: "/platform/advantages",
    Icon: Compass,
    mono: "ADVANTAGES",
    key: "advantages",
    number: 2,
  },
  {
    href: "/platform/capabilities",
    Icon: Sparkles,
    mono: "CAPABILITIES",
    key: "capabilities",
    number: 3,
  },
  {
    href: "/platform/roadmap",
    Icon: Rocket,
    mono: "ROADMAP",
    key: "roadmap",
    number: 4,
  },
];

export default async function PlatformHubPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Platform.Hub");
  const tt = await getTranslations("Platform.Topics");

  return (
    <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
      <PlatformHero
        eyebrow={t("eyebrow")}
        title={t("h1")}
        description={t("lead")}
      />

      <PlatformCardGrid columns={2}>
        {TOPICS.map((tp) => (
          <Link
            key={tp.href}
            href={tp.href as never}
            className={[
              "group relative flex flex-col gap-6 p-6 transition-colors sm:p-8",
              tp.accent
                ? "bg-foreground text-background hover:bg-foreground/95"
                : "bg-background hover:bg-muted/30",
            ].join(" ")}
          >
            <div className="flex items-start justify-between">
              <tp.Icon
                size={24}
                strokeWidth={1.5}
                className={tp.accent ? "text-background" : "text-foreground"}
              />
              <span
                className={[
                  "font-mono text-[10px] uppercase tracking-[0.18em]",
                  tp.accent ? "text-background/70" : "text-muted-foreground",
                ].join(" ")}
              >
                {tp.mono}
              </span>
            </div>
            <div>
              <div
                className={[
                  "flex items-center gap-2 text-base font-semibold tracking-tight sm:text-lg",
                  tp.accent ? "text-background" : "text-foreground",
                ].join(" ")}
              >
                <span>{numToCircle(tp.number)}</span>
                <span>{tt(`${tp.key}.title`)}</span>
                <span
                  className={
                    tp.accent
                      ? "text-background/70 transition-transform group-hover:translate-x-0.5"
                      : "text-muted-foreground/50 transition-all group-hover:translate-x-0.5 group-hover:text-foreground"
                  }
                >
                  →
                </span>
              </div>
              <p
                className={[
                  "mt-3 text-sm leading-relaxed",
                  tp.accent ? "text-background/85" : "text-muted-foreground",
                ].join(" ")}
              >
                {tt(`${tp.key}.lead`)}
              </p>
            </div>
          </Link>
        ))}
      </PlatformCardGrid>

      {/* Short 4-layer stack visual to anchor the VI */}
      <section className="mt-16 border-t border-border/80 pt-12">
        <div className="mb-6 flex items-end justify-between border-b border-border/70 pb-3">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              {t("stackLabel")}
            </div>
            <h2 className="mt-2 text-xl font-semibold tracking-tight sm:text-2xl">
              {t("stackTitle")}
            </h2>
          </div>
        </div>
        <PlatformCardGrid columns={3}>
          <PlatformCard Icon={Cpu} monoLabel="AI AGENT" number={1} title={t("stack.ai")} accent>
            <p>{t("stack.aiBody")}</p>
          </PlatformCard>
          <PlatformCard Icon={Database} monoLabel="DATA" number={2} title={t("stack.data")}>
            <p>{t("stack.dataBody")}</p>
          </PlatformCard>
          <PlatformCard Icon={Workflow} monoLabel="DELIVER" number={3} title={t("stack.deliver")}>
            <p>{t("stack.deliverBody")}</p>
          </PlatformCard>
        </PlatformCardGrid>
      </section>
    </div>
  );
}

function numToCircle(n: number): string {
  return ["①", "②", "③", "④", "⑤"][n - 1] ?? `${n}.`;
}
