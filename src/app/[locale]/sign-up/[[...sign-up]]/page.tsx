import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { PhoneAuthForm } from "@/components/auth/phone-auth-form";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "SignUp" });
  return { title: t("pageTitle") };
}

export default async function SignUpPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  // getfrp（en）侧已取消会员体系，海外侧没有注册入口
  if (locale === "en") notFound();
  setRequestLocale(locale);

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4 py-16">
      <PhoneAuthForm mode="signUp" />
    </div>
  );
}
