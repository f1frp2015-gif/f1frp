"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const AVATAR_ALLOWED = ["image/jpeg", "image/png", "image/webp"];
const MAX_AVATAR_BYTES = 2 * 1024 * 1024; // 2MB

export function ProfileClient({
  initialName,
  initialAvatarUrl,
  phone,
}: {
  initialName: string;
  initialAvatarUrl: string;
  phone: string;
}) {
  const t = useTranslations("Dashboard.profilePage");
  const fileRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(initialName);
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function handleAvatar(file: File) {
    setError(null);
    setSaved(false);
    if (!AVATAR_ALLOWED.includes(file.type)) {
      setError(t("avatarAllowedHint"));
      return;
    }
    if (file.size > MAX_AVATAR_BYTES) {
      setError(t("avatarTooLarge"));
      return;
    }
    setUploading(true);
    try {
      // 1) 取签名直传 URL
      const signRes = await fetch("/api/uploads/avatar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileName: file.name, contentType: file.type }),
      });
      const sign = await signRes.json().catch(() => ({}));
      if (!signRes.ok) {
        setError(sign?.error ?? t("uploadError"));
        return;
      }
      // 2) PUT 上传到 OSS
      const put = await fetch(sign.uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!put.ok) {
        setError(t("uploadError"));
        return;
      }
      // 仅预览,真正落库在「保存」时随 PATCH 一起提交
      setAvatarUrl(sign.getUrl);
    } catch {
      setError(t("uploadError"));
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function handleSave() {
    setError(null);
    setSaved(false);
    const trimmed = name.trim();
    if (trimmed.length < 1) {
      setError(t("nameRequired"));
      return;
    }
    if (trimmed.length > 100) {
      setError(t("nameTooLong"));
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/auth/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed, avatarUrl: avatarUrl || null }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(body?.error ?? t("saveError"));
        return;
      }
      setSaved(true);
      // 顶栏头像/昵称在独立的 useSession 树里拉取一次,router.refresh 不会更新它,
      // 整页刷新让顶栏与本页都拿到新值。
      window.location.reload();
    } catch {
      setError(t("saveError"));
    } finally {
      setSaving(false);
    }
  }

  const initial = (name.trim()[0] || phone.slice(-2, -1) || "用").toUpperCase();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("title")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* 头像 */}
          <div className="flex items-center gap-4">
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatarUrl}
                alt=""
                className="h-16 w-16 rounded-full object-cover"
              />
            ) : (
              <span className="flex h-16 w-16 items-center justify-center rounded-full bg-foreground text-xl font-semibold text-background">
                {initial}
              </span>
            )}
            <div className="space-y-1.5">
              <div className="text-sm font-medium">{t("avatarLabel")}</div>
              <input
                ref={fileRef}
                type="file"
                accept=".jpg,.jpeg,.png,.webp,image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void handleAvatar(f);
                }}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileRef.current?.click()}
                disabled={uploading || saving}
              >
                {uploading ? t("uploading") : t("pickAvatar")}
              </Button>
              <div className="text-xs text-muted-foreground">
                {t("avatarAllowedHint")}
              </div>
            </div>
          </div>

          {/* 手机号(只读) */}
          {phone && (
            <div>
              <label className="mb-1.5 block text-sm font-medium">
                {t("phoneLabel")}
              </label>
              <Input value={phone} disabled readOnly />
            </div>
          )}

          {/* 昵称 */}
          <div>
            <label className="mb-1.5 block text-sm font-medium">
              {t("nameLabel")}
            </label>
            <Input
              value={name}
              maxLength={100}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("namePlaceholder")}
            />
          </div>

          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 p-2 text-xs text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
              {error}
            </div>
          )}
          {saved && (
            <div className="rounded-md border border-emerald-200 bg-emerald-50 p-2 text-xs text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200">
              {t("saved")}
            </div>
          )}

          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={saving || uploading}>
              {saving ? t("saving") : t("save")}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
