import { setRequestLocale } from "next-intl/server";
import { NewPostClient } from "./new-post-client";

export default async function NewPostPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <NewPostClient />;
}
