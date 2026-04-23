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
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Icon } from "@/components/icon";

type PostType = "buy" | "sell" | "question";

const POST_TYPES: Array<{ id: PostType; iconKey: string; labelKey: "typeBuyLabel" | "typeSellLabel" | "typeQALabel"; descKey: "typeBuyDesc" | "typeSellDesc" | "typeQADesc" }> = [
  { id: "buy", iconKey: "buy", labelKey: "typeBuyLabel", descKey: "typeBuyDesc" },
  { id: "sell", iconKey: "sell", labelKey: "typeSellLabel", descKey: "typeSellDesc" },
  { id: "question", iconKey: "question", labelKey: "typeQALabel", descKey: "typeQADesc" },
];

const MATERIAL_CAT_KEYS = [
  "upr", "vinylEster", "epoxy", "phenolic",
  "glassRoving", "glassFabric", "carbon", "basalt", "aramid",
  "pvcCore", "balsaCore",
  "frpPipe", "frpTank", "frpGrating", "frpProfile", "frpBridge",
  "curingAgent", "gelcoat", "releaseAgent", "other",
] as const;

const TECH_CAT_KEYS = [
  "handLayup", "filamentWinding", "pultrusion", "compression", "rtm",
  "vartm", "matSelect", "equipment", "quality", "standards", "other",
] as const;

const UNIT_KEYS = ["ton", "kg", "sqm", "m", "pc", "set"] as const;

export function NewPostClient() {
  const t = useTranslations("Dashboard.newPost");
  const [type, setType] = useState<PostType | null>(null);

  const titlePlaceholder = type === "buy"
    ? t("titlePlaceholderBuy")
    : type === "sell"
      ? t("titlePlaceholderSell")
      : type === "question"
        ? t("titlePlaceholderQA")
        : "";

  const descPlaceholder = type === "buy"
    ? t("descPlaceholderBuy")
    : type === "sell"
      ? t("descPlaceholderSell")
      : type === "question"
        ? t("descPlaceholderQA")
        : "";

  const typeTitle = type ? t(`typeLabels.${type}`) : "";
  const note = type === "question" ? t("noteQA") : t("noteTrade");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t("h1")}</h1>
        <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
      </div>

      {!type && (
        <div className="grid gap-4 sm:grid-cols-3">
          {POST_TYPES.map((pt) => (
            <Card
              key={pt.id}
              className="cursor-pointer transition-colors hover:border-primary/50"
              onClick={() => setType(pt.id)}
            >
              <CardContent className="p-6 text-center">
                <Icon name={pt.iconKey} size={32} className="mx-auto text-foreground" />
                <h3 className="mt-4 font-bold">{t(pt.labelKey)}</h3>
                <p className="mt-1 text-xs text-muted-foreground">{t(pt.descKey)}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {type && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">
                <span className="inline-flex items-center gap-2">
                  <Icon name={type} size={16} />
                  {typeTitle}
                </span>
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setType(null)}>
                {t("backSelect")}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">{t("titleLabel")}</label>
              <Input placeholder={titlePlaceholder} />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">{t("categoryLabel")}</label>
              <div className="flex flex-wrap gap-1.5">
                {(type === "question" ? TECH_CAT_KEYS : MATERIAL_CAT_KEYS).map((k) => {
                  const label = type === "question"
                    ? t(`techCategories.${k}` as never)
                    : t(`materialCategories.${k}` as never);
                  return (
                    <Badge key={k} variant="outline" className="cursor-pointer px-2 py-1 text-xs hover:bg-primary hover:text-primary-foreground">
                      {label}
                    </Badge>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">{t("descLabel")}</label>
              <Textarea rows={6} placeholder={descPlaceholder} />
            </div>

            {(type === "buy" || type === "sell") && (
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <label className="block text-sm font-medium mb-1.5">{t("qtyLabel")}</label>
                  <Input placeholder={t("qtyPlaceholder")} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">{t("unitLabel")}</label>
                  <select className="w-full rounded-md border bg-background px-3 py-2 text-sm">
                    {UNIT_KEYS.map((u) => (
                      <option key={u}>{t(`units.${u}`)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">{t("priceLabel")}</label>
                  <Input placeholder={t("pricePlaceholder")} />
                </div>
              </div>
            )}

            {(type === "buy" || type === "sell") && (
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium mb-1.5">{t("regionLabel")}</label>
                  <Input placeholder={t("regionPlaceholder")} />
                </div>
                <div className="flex items-end gap-2">
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" className="rounded" />
                    {t("urgentLabel")}
                  </label>
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-1.5">{t("imageLabel")}</label>
              <div className="rounded-lg border-2 border-dashed p-6 text-center">
                <p className="text-xs text-muted-foreground">{t("imageHint")}</p>
                <Button variant="outline" size="sm" className="mt-2">{t("selectImage")}</Button>
              </div>
            </div>

            <div className="flex items-center gap-2 rounded-md bg-muted/50 px-4 py-3 text-xs text-muted-foreground">
              <span>📌</span>
              <span>{note}</span>
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="outline">{t("saveDraft")}</Button>
              <Button>{t("submit")}</Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
