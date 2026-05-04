import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { SignIn } from "@clerk/nextjs";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "SignIn" });
  return { title: t("pageTitle") };
}

export default async function SignInPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  // getfrp（en）侧已取消会员体系，海外侧没有登录入口
  if (locale === "en") notFound();
  setRequestLocale(locale);

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4 py-16">
      <SignIn />
    </div>
  );
}
