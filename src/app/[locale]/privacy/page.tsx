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
    title: locale === "en" ? "Privacy Policy" : "隐私政策",
    description:
      locale === "en"
        ? "How getfrp / f1frp collects, uses, and protects personal data — GDPR, CCPA and PIPL aligned."
        : "复材站如何收集、使用与保护您的个人数据。",
  };
}

const LAST_UPDATED = "2026-05-03";

export default async function PrivacyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-20">
      {locale === "en" ? <PrivacyEn /> : <PrivacyZh />}
      <p className="mt-12 text-xs text-muted-foreground">
        {locale === "en" ? "Last updated" : "最近更新"}: {LAST_UPDATED}
      </p>
    </main>
  );
}

function PrivacyEn() {
  return (
    <div className="prose prose-sm dark:prose-invert max-w-none">
      <h1>Privacy Policy</h1>
      <p>
        getfrp.com is operated by <strong>Chongqing Yaoyi Advanced Materials
        Technology Co., Ltd.</strong> (&ldquo;F1 Composite&rdquo;,
        &ldquo;we&rdquo;, &ldquo;our&rdquo;), a company registered in
        Chongqing, People&apos;s Republic of China. This Privacy Policy
        explains what personal data we collect when you use getfrp.com, why
        we collect it, and the rights you have under the EU General Data
        Protection Regulation (GDPR), the California Consumer Privacy Act
        (CCPA), and the PRC Personal Information Protection Law (PIPL).
      </p>

      <h2>1. Data we collect</h2>
      <ul>
        <li>
          <strong>RFQ &amp; contact submissions</strong>: name, company,
          country, email, phone, technical specifications, message body.
        </li>
        <li>
          <strong>Account data</strong> (if you sign in): email, profile
          name, authentication identifiers — managed by Clerk
          (clerk.com).
        </li>
        <li>
          <strong>Technical logs</strong>: IP address, user agent, request
          path, timestamps. Used for abuse prevention and operational
          debugging. Retained for up to 90 days.
        </li>
        <li>
          <strong>Optional analytics</strong>: aggregated, pseudonymized
          page-view data via Vercel Web Analytics and Google Analytics 4.
          Loaded only after you accept the cookie banner.
        </li>
      </ul>

      <h2>2. Why we collect it (legal basis)</h2>
      <ul>
        <li>To respond to your RFQ or sourcing inquiry — performance of a contract / pre-contractual steps (GDPR Art. 6(1)(b)).</li>
        <li>To operate the website, prevent fraud, secure the service — legitimate interest (GDPR Art. 6(1)(f)).</li>
        <li>Optional analytics — only with your consent (GDPR Art. 6(1)(a)).</li>
      </ul>

      <h2>3. Where data is stored</h2>
      <p>
        Application database: Neon Postgres, AWS region
        ap-southeast-1 (Singapore). Static assets and edge cache: Vercel
        (Frankfurt &amp; Washington D.C.). RFQ emails are sent via
        transactional email and copied to our China sourcing desk.
      </p>

      <h2>4. International transfers</h2>
      <p>
        Personal data submitted to getfrp may be transferred to the
        People&apos;s Republic of China for the purpose of supplier
        matching and RFQ routing. Such transfers rely on Standard
        Contractual Clauses (EU SCCs) between F1 Composite (importer) and
        the EU data subject (exporter), and on PIPL Art. 38 cross-border
        transfer rules. Contact us for the relevant SCC schedule.
      </p>

      <h2>5. Sharing with third parties</h2>
      <p>
        We do not sell personal data. We share contact details only with
        the specific Chinese suppliers you ask us to connect you to, and
        only after your explicit instruction. Payment processors and
        couriers receive only the minimum data required to perform their
        function.
      </p>

      <h2>6. Your rights</h2>
      <ul>
        <li>Access — get a copy of the personal data we hold about you.</li>
        <li>Rectification — correct inaccurate data.</li>
        <li>Erasure — delete data, subject to legal retention.</li>
        <li>Portability — receive data in a portable format.</li>
        <li>Object &amp; restrict processing.</li>
        <li>Withdraw consent at any time, without affecting prior processing.</li>
        <li>Lodge a complaint with your local supervisory authority.</li>
      </ul>
      <p>
        To exercise any right, email{" "}
        <a href="mailto:doris.li@f1composite.com">doris.li@f1composite.com</a>.
        We respond within 30 days.
      </p>

      <h2>7. Cookies</h2>
      <p>
        Strictly necessary cookies are set without consent (auth session,
        cookie-consent state). Analytics cookies load only after you
        accept the banner. You can withdraw consent by clearing the
        <code>cookie-consent-v1</code> cookie in your browser.
      </p>

      <h2>8. Contact</h2>
      <p>
        Chongqing Yaoyi Advanced Materials Technology Co., Ltd.<br />
        Attn: Doris Li (Data Protection contact)<br />
        Email:{" "}
        <a href="mailto:doris.li@f1composite.com">doris.li@f1composite.com</a>
      </p>
    </div>
  );
}

function PrivacyZh() {
  return (
    <div className="prose prose-sm dark:prose-invert max-w-none">
      <h1>隐私政策</h1>
      <p>
        本站由<strong>重庆曜一新材料科技有限公司</strong>运营。我们仅收集为提供
        服务所必需的个人信息（如询盘联系方式、账号邮箱），不出售用户数据。
      </p>
      <h2>1. 收集的信息</h2>
      <ul>
        <li>询盘 / 联系表单：姓名、公司、邮箱、电话、技术规格。</li>
        <li>账号信息：邮箱、登录标识（由 Clerk 管理）。</li>
        <li>技术日志：IP、UA、请求路径，最长保留 90 天，用于反滥用与运维。</li>
      </ul>
      <h2>2. 信息存储</h2>
      <p>应用数据库托管于 Neon Postgres（新加坡）。</p>
      <h2>3. 您的权利</h2>
      <p>
        您有权访问、更正、删除我们持有的您的个人信息。请发送邮件至{" "}
        <a href="mailto:f1frp2015@gmail.com">f1frp2015@gmail.com</a>。
      </p>
      <h2>4. 联系</h2>
      <p>重庆曜一新材料科技有限公司</p>
    </div>
  );
}
