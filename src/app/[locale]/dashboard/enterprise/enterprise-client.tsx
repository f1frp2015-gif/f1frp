"use client";

import { useState } from "react";
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

const labelCls = "block text-sm font-medium mb-1.5";

export function EnterpriseClient() {
  const t = useTranslations("Dashboard.enterprise");
  const [category, setCategory] = useState("");
  const [selectedProcesses, setSelectedProcesses] = useState<string[]>([]);
  const [selectedCerts, setSelectedCerts] = useState<string[]>([]);

  function toggleItem(list: string[], setList: (v: string[]) => void, item: string) {
    setList(list.includes(item) ? list.filter((i) => i !== item) : [...list, item]);
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
              <Input placeholder={t("fullNamePlaceholder")} />
            </div>
            <div>
              <label className={labelCls}>{t("shortName")}</label>
              <Input placeholder={t("shortNamePlaceholder")} />
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
              <Input type="number" placeholder={t("foundedPlaceholder")} />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className={labelCls}>{t("province")}</label>
              <Input placeholder={t("provincePlaceholder")} />
            </div>
            <div>
              <label className={labelCls}>{t("city")}</label>
              <Input placeholder={t("cityPlaceholder")} />
            </div>
            <div>
              <label className={labelCls}>{t("employees")}</label>
              <select className="w-full rounded-md border bg-background px-3 py-2 text-sm">
                <option value="">{t("employeesSelect")}</option>
                <option>{t("employees50")}</option>
                <option>{t("employees200")}</option>
                <option>{t("employees500")}</option>
                <option>{t("employees1000")}</option>
                <option>{t("employeesOver1000")}</option>
              </select>
            </div>
          </div>

          <div>
            <label className={labelCls}>{t("address")}</label>
            <Input placeholder={t("addressPlaceholder")} />
          </div>

          <div>
            <label className={labelCls}>{t("intro")}</label>
            <Textarea placeholder={t("introPlaceholder")} rows={4} />
          </div>

          <div>
            <label className={labelCls}>{t("products")}</label>
            <Input placeholder={t("productsPlaceholder")} />
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
            {PROCESS_KEYS.map((k) => {
              const label = t(`processes.${k}`);
              return (
                <Badge
                  key={k}
                  variant={selectedProcesses.includes(k) ? "default" : "outline"}
                  className="cursor-pointer px-3 py-1.5"
                  onClick={() => toggleItem(selectedProcesses, setSelectedProcesses, k)}
                >
                  {label}
                </Badge>
              );
            })}
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
            {CERT_KEYS.map((k) => {
              const label = t(`certs.${k}`);
              return (
                <Badge
                  key={k}
                  variant={selectedCerts.includes(k) ? "default" : "outline"}
                  className="cursor-pointer px-3 py-1.5"
                  onClick={() => toggleItem(selectedCerts, setSelectedCerts, k)}
                >
                  {label}
                </Badge>
              );
            })}
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
              <Input placeholder={t("contactPersonPlaceholder")} />
            </div>
            <div>
              <label className={labelCls}>{t("contactPhone")}</label>
              <Input placeholder={t("contactPhonePlaceholder")} />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelCls}>{t("wechat")}</label>
              <Input placeholder={t("wechatPlaceholder")} />
            </div>
            <div>
              <label className={labelCls}>{t("website")}</label>
              <Input placeholder={t("websitePlaceholder")} />
            </div>
          </div>
          <div>
            <label className={labelCls}>{t("contactEmail")}</label>
            <Input type="email" placeholder={t("contactEmailPlaceholder")} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("licenseTitle")}</CardTitle>
          <CardDescription>{t("licenseSub")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border-2 border-dashed p-8 text-center">
            <div className="text-3xl">📄</div>
            <p className="mt-2 text-sm font-medium">{t("uploadHint")}</p>
            <p className="mt-1 text-xs text-muted-foreground">{t("uploadFormats")}</p>
            <Button variant="outline" size="sm" className="mt-3">
              {t("selectFile")}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Separator />

      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">{t("submitNote")}</p>
        <Button size="lg">{t("submit")}</Button>
      </div>
    </div>
  );
}
