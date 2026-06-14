/**
 * 企业注册「证照/文档 → AI 结构化阅读」的文档类型与抽取结果 Schema。
 *
 * 4 类文档:营业执照 / 产品资料 / 检测报告 / 认证证书。
 * 每类有一个 Zod schema 描述「AI 应当抽出的结构化字段」,抽取后 safeParse 校验
 * (沿用 quote/extract 的 generateText→JSON→Zod 范式)。
 *
 * 纯数据模块(无 React / 无外部调用),供上传路由、抽取路由、前端共用。
 */
import { z } from "zod";

export const DOC_KINDS = ["license", "product", "test", "cert"] as const;
export type DocKind = (typeof DOC_KINDS)[number];

export const DOC_KIND_LABELS: Record<DocKind, { zh: string; en: string }> = {
  license: { zh: "营业执照", en: "Business license" },
  product: { zh: "产品资料", en: "Product brochure" },
  test: { zh: "检测报告", en: "Test report" },
  cert: { zh: "认证证书", en: "Certificate" },
};

/** OSS key 前缀(按 kind 分目录,统一在 enterprise-docs/ 下) */
export function docPrefix(kind: DocKind): string {
  return `enterprise-docs/${kind}`;
}

// ── 各类文档的结构化抽取结果(字段尽量可空,低置信度交给人工补) ──

/** 营业执照 → 公司主体信息(优先用阿里云营业执照 OCR 专项接口) */
export const LicenseSchema = z.object({
  companyName: z.string().optional(), // 名称
  creditCode: z.string().optional(), // 统一社会信用代码
  legalRep: z.string().optional(), // 法定代表人
  address: z.string().optional(), // 住所
  businessScope: z.string().optional(), // 经营范围
  establishedDate: z.string().optional(), // 成立日期 YYYY-MM-DD
  registeredCapital: z.string().optional(), // 注册资本
});
export type LicenseData = z.infer<typeof LicenseSchema>;

/** 产品资料 → 产品清单(将映射到 materials 库,带 UGC 标记) */
export const ProductItemSchema = z.object({
  name: z.string(),
  category: z.string().optional(), // 型材/格栅/管材/树脂/纤维…
  model: z.string().optional(),
  properties: z.record(z.string(), z.string()).optional(), // {tensile_strength:"320 MPa", density:"1.9 g/cm³"}
  applications: z.array(z.string()).optional(),
});
export const ProductSchema = z.object({
  products: z.array(ProductItemSchema).default([]),
});
export type ProductData = z.infer<typeof ProductSchema>;

/** 检测报告 → 检测项与结果(补强 materials 的 properties + 作为认证佐证) */
export const TestReportSchema = z.object({
  productName: z.string().optional(),
  standard: z.string().optional(), // 检测依据,如 GB/T 1447
  lab: z.string().optional(), // 检测机构
  reportDate: z.string().optional(),
  items: z
    .array(
      z.object({
        name: z.string(), // 检测项,如 拉伸强度
        value: z.string(), // 结果,如 320 MPa
        method: z.string().optional(),
      }),
    )
    .default([]),
});
export type TestReportData = z.infer<typeof TestReportSchema>;

/** 认证证书 → 认证信息(映射到 enterprises.certifications + 结构化认证记录) */
export const CertSchema = z.object({
  certType: z.string().optional(), // ISO9001 / ISO14001 / CE / IATF16949 …
  certNo: z.string().optional(),
  issuer: z.string().optional(), // 发证机构
  scope: z.string().optional(), // 认证范围
  validUntil: z.string().optional(), // 有效期至 YYYY-MM-DD
});
export type CertData = z.infer<typeof CertSchema>;

export const SCHEMA_BY_KIND = {
  license: LicenseSchema,
  product: ProductSchema,
  test: TestReportSchema,
  cert: CertSchema,
} as const;

/** AI 抽取的统一返回:kind + 置信度(0-100) + 该类的结构化 data */
export type DocExtractResult =
  | { kind: "license"; confidence: number; data: LicenseData }
  | { kind: "product"; confidence: number; data: ProductData }
  | { kind: "test"; confidence: number; data: TestReportData }
  | { kind: "cert"; confidence: number; data: CertData };
