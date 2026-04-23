import { setRequestLocale } from "next-intl/server";
import { EnterpriseClient } from "./enterprise-client";

export default async function EnterprisePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <EnterpriseClient />;
}
