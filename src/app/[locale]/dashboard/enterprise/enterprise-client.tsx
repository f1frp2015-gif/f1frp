"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const CATEGORY_KEYS = [
  "manufacturer",
  "resin",
  "fiber",
  "core",
  "equipment",
  "mold",
  "testing",
  "trader",
  "consulting",
  "other",
] as const;

const PROCESS_KEYS = [
  "handLayup",
  "filamentWinding",
  "pultrusion",
  "compression",
  "rtm",
  "vartm",
  "spray",
  "prepreg",
  "print3d",
  "other",
] as const;

const CERT_KEYS = [
  "iso9001",
  "iso14001",
  "iso45001",
  "ce",
  "asme",
  "ccs",
  "gjb",
  "as9100",
  "api",
  "other",
] as const;

const EMPLOYEE_OPTS = [
  "employees50",
  "employees200",
  "employees500",
  "employees1000",
  "employeesOver1000",
] as const;

const labelCls = "block text-sm font-medium mb-1.5";

export function EnterpriseClient() {
  const t = useTranslations("Dashboard.enterprise");
  const tAuth = useTranslations("Auth");
  const router = useRouter();

  // ── 基本信息 ──
  const [name, setName] = useState("");
  const [shortName, setShortName] = useState("");
  const [category, setCategory] = useState("");
  const [founded, setFounded] = useState("");
  const [province, setProvince] = useState("");
  const [city, setCity] = useState("");
  const [employeeCount, setEmployeeCount] = useState("");
  const [address, setAddress] = useState("");
  const [description, setDescription] = useState("");
  const [products, setProducts] = useState("");
  const [selectedProcesses, setSelectedProcesses] = useState<string[]>([]);
  const [selectedCerts, setSelectedCerts] = useState<string[]>([]);

  // ── 联系方式 ──
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactWechat, setContactWechat] = useState("");
  const [website, setWebsite] = useState("");
  const [contactEmail, setContactEmail] = useState("");

  // ── 联系电话 OTP 验证 ──
  const [otpStep, setOtpStep] = useState<"idle" | "sent" | "verified">("idle");
  const [otpCode, setOtpCode] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpCooldown, setOtpCooldown] = useState(0);
  const [otpDevCode, setOtpDevCode] = useState<string | null>(null);
  const [otpError, setOtpError] = useState<string | null>(null);

  // ── 营业执照 ──
  const [licenseUrl, setLicenseUrl] = useState<string | null>(null);
  const [licenseName, setLicenseName] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // ── 提交 ──
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (otpCooldown <= 0) return;
    const timer = setInterval(() => setOtpCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(timer);
  }, [otpCooldown]);

  function toggleItem(list: string[], setList: (v: string[]) => void, item: string) {
    setList(list.includes(item) ? list.filter((i) => i !== item) : [...list, item]);
  }

  function onPhoneChange(v: string) {
    setContactPhone(v.replace(/\D/g, "").slice(0, 11));
    // 改号 → 需重新验证
    if (otpStep !== "idle") {
      setOtpStep("idle");
      setOtpCode("");
      setOtpDevCode(null);
    }
  }

  async function sendPhoneOtp() {
    if (!/^1[3-9]\d{9}$/.test(contactPhone)) {
      setOtpError(t("needVerifyPhone"));
      return;
    }
    setOtpLoading(true);
    setOtpError(null);
    try {
      const res = await fetch("/api/auth/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: contactPhone }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setOtpError(data?.error ?? t("submitError"));
        return;
      }
      setOtpStep("sent");
      setOtpCooldown(60);
      if (data?.devCode) setOtpDevCode(String(data.devCode));
    } catch {
      setOtpError(t("submitError"));
    } finally {
      setOtpLoading(false);
    }
  }

  async function confirmPhoneOtp() {
    if (!/^\d{6}$/.test(otpCode)) return;
    setOtpLoading(true);
    setOtpError(null);
    try {
      const res = await fetch("/api/auth/otp/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: contactPhone, code: otpCode }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setOtpError(data?.error ?? t("submitError"));
        return;
      }
      setOtpStep("verified");
    } catch {
      setOtpError(t("submitError"));
    } finally {
      setOtpLoading(false);
    }
  }

  async function onSelectLicense(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const signRes = await fetch("/api/uploads/business-license", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileName: file.name, contentType: file.type }),
      });
      const sign = await signRes.json().catch(() => ({}));
      if (!signRes.ok) {
        setError(sign?.error ?? t("submitError"));
        return;
      }
      const put = await fetch(sign.uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!put.ok) {
        setError(t("submitError"));
        return;
      }
      setLicenseUrl(sign.getUrl);
      setLicenseName(file.name);
    } catch {
      setError(t("submitError"));
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  const phoneVerified = otpStep === "verified";
  const canSubmit =
    name.trim() && category && contactName.trim() && contactPhone && phoneVerified && !submitting;

  async function submit() {
    setError(null);
    if (!phoneVerified) {
      setError(t("needVerifyPhone"));
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/v1/enterprises", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          shortName,
          category,
          established: founded,
          province,
          city,
          employeeCount,
          address,
          description,
          products,
          processes: selectedProcesses,
          certifications: selectedCerts,
          contactName,
          contactPhone,
          contactWechat,
          website,
          contactEmail,
          businessLicense: licenseUrl,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error ?? t("submitError"));
        return;
      }
      setSuccess(true);
      setTimeout(() => router.push("/dashboard"), 1800);
    } catch {
      setError(t("submitError"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t("h1")}</h1>
        <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("basicInfoTitle")}</CardTitle>
          <CardDescription>{t("basicInfoSub")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelCls}>{t("fullName")}</label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t("fullNamePlaceholder")}
              />
            </div>
            <div>
              <label className={labelCls}>{t("shortName")}</label>
              <Input
                value={shortName}
                onChange={(e) => setShortName(e.target.value)}
                placeholder={t("shortNamePlaceholder")}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelCls}>{t("type")}</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              >
                <option value="">{t("typeSelect")}</option>
                {CATEGORY_KEYS.map((k) => (
                  <option key={k} value={k}>{t(`categories.${k}`)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>{t("founded")}</label>
              <Input
                type="number"
                value={founded}
                onChange={(e) => setFounded(e.target.value)}
                placeholder={t("foundedPlaceholder")}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className={labelCls}>{t("province")}</label>
              <Input
                value={province}
                onChange={(e) => setProvince(e.target.value)}
                placeholder={t("provincePlaceholder")}
              />
            </div>
            <div>
              <label className={labelCls}>{t("city")}</label>
              <Input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder={t("cityPlaceholder")}
              />
            </div>
            <div>
              <label className={labelCls}>{t("employees")}</label>
              <select
                value={employeeCount}
                onChange={(e) => setEmployeeCount(e.target.value)}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              >
                <option value="">{t("employeesSelect")}</option>
                {EMPLOYEE_OPTS.map((k) => (
                  <option key={k} value={t(k)}>{t(k)}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className={labelCls}>{t("address")}</label>
            <Input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder={t("addressPlaceholder")}
            />
          </div>

          <div>
            <label className={labelCls}>{t("intro")}</label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t("introPlaceholder")}
              rows={4}
            />
          </div>

          <div>
            <label className={labelCls}>{t("products")}</label>
            <Input
              value={products}
              onChange={(e) => setProducts(e.target.value)}
              placeholder={t("productsPlaceholder")}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("processTitle")}</CardTitle>
          <CardDescription>{t("processSub")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {PROCESS_KEYS.map((k) => (
              <Badge
                key={k}
                variant={selectedProcesses.includes(k) ? "default" : "outline"}
                className="cursor-pointer px-3 py-1.5"
                onClick={() => toggleItem(selectedProcesses, setSelectedProcesses, k)}
              >
                {t(`processes.${k}`)}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("certTitle")}</CardTitle>
          <CardDescription>{t("certSub")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {CERT_KEYS.map((k) => (
              <Badge
                key={k}
                variant={selectedCerts.includes(k) ? "default" : "outline"}
                className="cursor-pointer px-3 py-1.5"
                onClick={() => toggleItem(selectedCerts, setSelectedCerts, k)}
              >
                {t(`certs.${k}`)}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("contactTitle")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelCls}>{t("contactPerson")}</label>
              <Input
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                placeholder={t("contactPersonPlaceholder")}
              />
            </div>
            <div>
              <label className={labelCls}>{t("contactPhone")}</label>
              <div className="flex gap-2">
                <Input
                  type="tel"
                  inputMode="numeric"
                  value={contactPhone}
                  disabled={phoneVerified}
                  onChange={(e) => onPhoneChange(e.target.value)}
                  placeholder={t("contactPhonePlaceholder")}
                />
                {phoneVerified ? (
                  <Badge variant="default" className="shrink-0 self-center">
                    ✓ {t("phoneVerified")}
                  </Badge>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    className="shrink-0"
                    disabled={otpLoading || otpCooldown > 0}
                    onClick={sendPhoneOtp}
                  >
                    {otpCooldown > 0 ? `${otpCooldown}s` : t("verifyPhone")}
                  </Button>
                )}
              </div>
              {otpStep === "sent" && (
                <div className="mt-2 flex gap-2">
                  <Input
                    type="text"
                    inputMode="numeric"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder={t("codePlaceholder")}
                  />
                  <Button
                    type="button"
                    className="shrink-0"
                    disabled={otpLoading || otpCode.length !== 6}
                    onClick={confirmPhoneOtp}
                  >
                    {t("verifyPhone")}
                  </Button>
                </div>
              )}
              {otpDevCode && (
                <p className="mt-1 text-xs text-amber-600">
                  {tAuth("devCodeHint", { code: otpDevCode })}
                </p>
              )}
              {otpError && <p className="mt-1 text-xs text-red-600">{otpError}</p>}
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelCls}>{t("wechat")}</label>
              <Input
                value={contactWechat}
                onChange={(e) => setContactWechat(e.target.value)}
                placeholder={t("wechatPlaceholder")}
              />
            </div>
            <div>
              <label className={labelCls}>{t("website")}</label>
              <Input
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder={t("websitePlaceholder")}
              />
            </div>
          </div>
          <div>
            <label className={labelCls}>{t("contactEmail")}</label>
            <Input
              type="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              placeholder={t("contactEmailPlaceholder")}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("licenseTitle")}</CardTitle>
          <CardDescription>{t("licenseSub")}</CardDescription>
        </CardHeader>
        <CardContent>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,application/pdf"
            className="hidden"
            onChange={onSelectLicense}
          />
          <div className="rounded-lg border-2 border-dashed p-8 text-center">
            <div className="text-3xl">📄</div>
            <p className="mt-2 text-sm font-medium">
              {licenseName ? `${t("licenseUploaded")}: ${licenseName}` : t("uploadHint")}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">{t("uploadFormats")}</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-3"
              disabled={uploading}
              onClick={() => fileRef.current?.click()}
            >
              {uploading ? t("uploading") : t("selectFile")}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Separator />

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-700 dark:border-green-900 dark:bg-green-950 dark:text-green-300">
          {t("submitSuccess")}
        </div>
      )}

      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">{t("submitNote")}</p>
        <Button size="lg" disabled={!canSubmit} onClick={submit}>
          {submitting ? t("submitting") : t("submit")}
        </Button>
      </div>
    </div>
  );
}
