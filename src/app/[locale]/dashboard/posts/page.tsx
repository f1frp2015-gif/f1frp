import { FileText } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "@/i18n/navigation";
import { buttonVariants } from "@/components/ui/button";

export default async function MyPostsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "Dashboard" });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t("posts.h1")}</h1>
          <p className="text-sm text-muted-foreground">{t("posts.subtitle")}</p>
        </div>
        <Link href="/dashboard/posts/new" className={buttonVariants()}>
          {t("posts.newPost")}
        </Link>
      </div>

      <div className="flex gap-2">
        <Badge variant="default" className="cursor-pointer px-3 py-1">{t("posts.filterAll")}</Badge>
        <Badge variant="outline" className="cursor-pointer px-3 py-1">{t("posts.filterBuy")}</Badge>
        <Badge variant="outline" className="cursor-pointer px-3 py-1">{t("posts.filterSell")}</Badge>
        <Badge variant="outline" className="cursor-pointer px-3 py-1">{t("posts.filterQA")}</Badge>
      </div>

      <Card>
        <CardContent className="py-16 text-center text-muted-foreground">
          <FileText size={32} strokeWidth={1.25} className="mx-auto text-muted-foreground/60" />
          <p className="mt-3 text-sm font-medium">{t("posts.noPostsMsg")}</p>
          <p className="mt-1 text-xs">{t("posts.noPostsSub")}</p>
          <Link href="/dashboard/posts/new" className={buttonVariants({ size: "sm", className: "mt-4" })}>
            {t("posts.postNow")}
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
