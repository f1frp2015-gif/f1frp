import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { PhoneAuthForm } from "@/components/auth/phone-auth-form";
import { EmailAuthForm } from "@/components/auth/email-auth-form";

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
  setRequestLocale(locale);

  // getfrp（en/海外）用邮箱 OTP;f1frp.com（zh）用手机号 / 微信。
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4 py-16">
      {locale === "en" ? <EmailAuthForm mode="signUp" /> : <PhoneAuthForm mode="signUp" />}
    </div>
  );
}
