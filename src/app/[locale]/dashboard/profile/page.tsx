import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth/current-user";

import { ProfileClient } from "./profile-client";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Dashboard" });
  return { title: t("profilePage.metaTitle") };
}

export const dynamic = "force-dynamic";

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const me = await getCurrentUser();
  if (!me) redirect("/sign-in?redirect_url=/dashboard/profile");

  return (
    <ProfileClient
      initialName={me.name ?? ""}
      initialAvatarUrl={me.avatarUrl ?? ""}
      phone={me.phone ?? ""}
    />
  );
}
