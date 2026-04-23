import { MessageCircle, Bell } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default async function MessagesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "Dashboard" });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t("nav.messages")}</h1>
        <p className="text-sm text-muted-foreground">{t("home.subtitle")}</p>
      </div>

      <Tabs defaultValue="inquiries">
        <TabsList>
          <TabsTrigger value="inquiries">{t("messagesPage.tabInquiries")}</TabsTrigger>
          <TabsTrigger value="system">{t("messagesPage.tabSystem")}</TabsTrigger>
        </TabsList>

        <TabsContent value="inquiries" className="mt-4">
          <Card>
            <CardContent className="py-16 text-center text-muted-foreground">
              <MessageCircle size={32} strokeWidth={1.25} className="mx-auto text-muted-foreground/60" />
              <p className="mt-3 text-sm font-medium">{t("messagesPage.inquiriesEmptyTitle")}</p>
              <p className="mt-1 text-xs">{t("messagesPage.inquiriesEmptySub")}</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system" className="mt-4">
          <Card>
            <CardContent className="py-16 text-center text-muted-foreground">
              <Bell size={32} strokeWidth={1.25} className="mx-auto text-muted-foreground/60" />
              <p className="mt-3 text-sm font-medium">{t("messagesPage.systemEmptyTitle")}</p>
              <p className="mt-1 text-xs">{t("messagesPage.systemEmptySub")}</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
