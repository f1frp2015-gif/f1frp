import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";

export const revalidate = 86400;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: locale === "en" ? "Terms of Use" : "使用条款",
    description:
      locale === "en"
        ? "Terms governing your use of getfrp / f1frp."
        : "复材站使用条款。",
  };
}

const LAST_UPDATED = "2026-05-03";

export default async function TermsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-20">
      {locale === "en" ? <TermsEn /> : <TermsZh />}
      <p className="mt-12 text-xs text-muted-foreground">
        {locale === "en" ? "Last updated" : "最近更新"}: {LAST_UPDATED}
      </p>
    </main>
  );
}

function TermsEn() {
  return (
    <div className="prose prose-sm dark:prose-invert max-w-none">
      <h1>Terms of Use</h1>
      <p>
        These Terms govern your use of getfrp.com (the &ldquo;Service&rdquo;),
        operated by Chongqing Yaoyi Advanced Materials Technology Co., Ltd.
        (&ldquo;F1 Composite&rdquo;). By using the Service you agree to
        these Terms.
      </p>

      <h2>1. The Service</h2>
      <p>
        getfrp is a sourcing and information platform for fiber-reinforced
        polymer (FRP / GFRP / CFRP) composites manufactured in China. We
        provide supplier directories, technical references, an AI
        assistant, and request-for-quotation (RFQ) routing.
      </p>

      <h2>2. No supply contract until signed</h2>
      <p>
        Quotes returned through getfrp are non-binding indications until a
        supply contract is signed between you and the relevant supplier
        (or between you and F1 Composite where F1 Composite acts as
        exporter of record). Specifications, prices, and lead times in
        material datasheets, AI answers, or supplier listings are
        informational and may change.
      </p>

      <h2>3. AI assistant — no professional advice</h2>
      <p>
        The AI assistant returns best-effort technical information and
        cites the underlying source where possible. It is not a
        substitute for qualified engineering judgement. F1 Composite
        accepts no liability for design, regulatory, or safety decisions
        made on the basis of AI output.
      </p>

      <h2>4. Acceptable use</h2>
      <ul>
        <li>No automated scraping outside published API rate limits.</li>
        <li>No misrepresentation of identity or affiliation.</li>
        <li>No infringement of third-party intellectual property.</li>
      </ul>

      <h2>5. Intellectual property</h2>
      <p>
        Curated databases, written commentary, the AI prompt stack, and
        the visual design are the property of F1 Composite. Standards
        text, papers, and patents indexed on the platform remain the
        property of their respective rights holders; we publish bibliographic
        metadata, structured highlights, and DOI / publication number
        references to enable lookup.
      </p>

      <h2>6. Limitation of liability</h2>
      <p>
        To the maximum extent permitted by law, F1 Composite&apos;s total
        liability arising from your use of the Service is limited to the
        fees you have paid to F1 Composite in the 12 months preceding the
        claim. We are not liable for indirect, incidental, or consequential
        damages.
      </p>

      <h2>7. Governing law &amp; venue</h2>
      <p>
        These Terms are governed by the laws of the People&apos;s Republic of
        China. Disputes shall be submitted to the China International
        Economic and Trade Arbitration Commission (CIETAC) for arbitration
        in Beijing.
      </p>

      <h2>8. Contact</h2>
      <p>
        Email{" "}
        <a href="mailto:f1frp2015@gmail.com">f1frp2015@gmail.com</a>{" "}
        for any question regarding these Terms.
      </p>
    </div>
  );
}

function TermsZh() {
  return (
    <div className="prose prose-sm dark:prose-invert max-w-none">
      <h1>使用条款</h1>
      <p>
        本站由重庆曜一新材料科技有限公司运营。访问与使用本站即表示您接受本条款。
      </p>
      <h2>1. 服务性质</h2>
      <p>
        本站为复合材料行业的资料、检索、AI 助手与询盘撮合平台。所提供的报价、规格、
        交期信息均为参考性质，最终以合同为准。
      </p>
      <h2>2. AI 助手免责</h2>
      <p>
        AI 助手返回信息不构成工程建议。在做设计、合规、安全决策前请咨询合格工程师。
      </p>
      <h2>3. 知识产权</h2>
      <p>
        本站数据库、文案、视觉设计归本公司所有；标准、论文、专利原文版权归各权利人所有。
      </p>
      <h2>4. 适用法律</h2>
      <p>本条款适用中华人民共和国法律。争议提交北京 CIETAC 仲裁。</p>
    </div>
  );
}
