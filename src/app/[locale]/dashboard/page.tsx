import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { auth } from "@clerk/nextjs/server";
import { and, count, eq, ne, sql } from "drizzle-orm";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { db } from "@/lib/db";
import { users, posts, inquiries } from "@/lib/db/schema";
import { tierLabel, isExpired } from "@/lib/membership";

async function loadStats(clerkId: string) {
  const [me] = await db
    .select()
    .from(users)
    .where(eq(users.clerkId, clerkId))
    .limit(1);

  if (!me) {
    return { me: null, postCount: 0, inquiryCount: 0, viewCount: 0 };
  }

  const [[{ postCount }], [{ inquiryCount }], [{ viewCount }]] =
    await Promise.all([
      db
        .select({ postCount: count() })
        .from(posts)
        .where(and(eq(posts.authorId, me.id), ne(posts.status, "removed"))),
      db
        .select({ inquiryCount: count() })
        .from(inquiries)
        .where(eq(inquiries.toUserId, me.id)),
      db
        .select({ viewCount: sql<number>`COALESCE(SUM(${posts.viewCount}), 0)::int` })
        .from(posts)
        .where(eq(posts.authorId, me.id)),
    ]);

  return { me, postCount, inquiryCount, viewCount };
}

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "Dashboard" });

  const { userId } = await auth();
  const stats = userId
    ? await loadStats(userId)
    : { me: null, postCount: 0, inquiryCount: 0, viewCount: 0 };

  const expired = stats.me ? isExpired(stats.me.membershipExpiry) : false;
  const tierText = stats.me
    ? expired
      ? t("home.tierExpired")
      : tierLabel(stats.me.membershipTier)
    : t("home.tierFree");

  const welcomeText = stats.me?.name
    ? t("home.welcomeName", { name: stats.me.name })
    : t("home.welcome");

  const rules = [
    t("home.rule1"),
    t("home.rule2"),
    t("home.rule3"),
    t("home.rule4"),
    t("home.rule5"),
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{welcomeText}</h1>
        <p className="text-sm text-muted-foreground">{t("home.subtitle")}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground">{t("home.statPosts")}</div>
            <div className="mt-1 text-2xl font-bold">{stats.postCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground">{t("home.statInquiries")}</div>
            <div className="mt-1 text-2xl font-bold">{stats.inquiryCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground">{t("home.statViews")}</div>
            <div className="mt-1 text-2xl font-bold">{stats.viewCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground">{t("home.statTier")}</div>
            <div className="mt-1 text-2xl font-bold">{tierText}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("home.quickTitle")}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2 sm:grid-cols-2">
            <Link href="/dashboard/posts/new" className={buttonVariants({ variant: "default", size: "sm" })}>
              {t("home.postBuy")}
            </Link>
            <Link href="/dashboard/posts/new" className={buttonVariants({ variant: "outline", size: "sm" })}>
              {t("home.postSell")}
            </Link>
            <Link href="/dashboard/enterprise" className={buttonVariants({ variant: "outline", size: "sm" })}>
              {t("home.completeEnterprise")}
            </Link>
            <Link href="/dashboard/posts/new" className={buttonVariants({ variant: "outline", size: "sm" })}>
              {t("home.postQA")}
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("home.rulesTitle")}</CardTitle>
            <CardDescription>{t("home.rulesSub")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            {rules.map((rule, i) => (
              <div key={i} className="flex items-start gap-2">
                <Badge variant="outline" className="mt-0.5 shrink-0 text-[10px]">{i + 1}</Badge>
                <span>{rule}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
