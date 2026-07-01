import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { PhoneAuthForm } from "@/components/auth/phone-auth-form";
import { EmailPasswordForm } from "@/components/auth/email-password-form";

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

  // getfrp（en/海外）邮箱+密码直接注册;f1frp.com（zh）手机号 / 微信。
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4 py-16">
      {locale === "en" ? <EmailPasswordForm mode="signUp" /> : <PhoneAuthForm mode="signUp" />}
    </div>
  );
}
