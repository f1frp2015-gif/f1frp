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
        : "复材站隐私政策:依据《个人信息保护法》披露我们如何收集、使用、共享、跨境提供与保护您的个人信息,以及您的权利和行使方式。",
  };
}

// 政策版本与生效日由这两个常量统一管理,变更时同时更新两个,在文末显示。
// 生效日变化即视为实质性更新,代码 review 时需评估是否要重新通知存量用户。
const POLICY_VERSION = "v2.0";
const EFFECTIVE_DATE = "2026-05-23";
const LAST_UPDATED = "2026-05-23";

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
      <div className="mt-12 space-y-1 border-t border-border/60 pt-6 text-xs text-muted-foreground">
        <p>
          {locale === "en" ? "Version" : "版本号"}: {POLICY_VERSION}
        </p>
        <p>
          {locale === "en" ? "Effective date" : "本版生效日期"}:{" "}
          {EFFECTIVE_DATE}
        </p>
        <p>
          {locale === "en" ? "Last updated" : "最近更新"}: {LAST_UPDATED}
        </p>
      </div>
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
        <a href="mailto:f1frp2015@gmail.com">f1frp2015@gmail.com</a>.
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
        Attn: Data Protection contact<br />
        Email:{" "}
        <a href="mailto:f1frp2015@gmail.com">f1frp2015@gmail.com</a>
      </p>
    </div>
  );
}

function PrivacyZh() {
  return (
    <div className="prose prose-sm dark:prose-invert max-w-none">
      <h1>隐私政策</h1>

      <p className="lead">
        本政策由<strong>重庆曜一新材料科技有限公司</strong>（以下简称
        &ldquo;我们&rdquo;）作为复材站（f1frp.com，以下简称&ldquo;本站&rdquo;）
        的个人信息处理者制定并发布。我们依据《中华人民共和国个人信息保护法》
        （以下简称&ldquo;《个保法》&rdquo;）、《中华人民共和国数据安全法》、
        《中华人民共和国网络安全法》以及其他相关法律法规，向您说明我们如何
        收集、使用、存储、共享、跨境提供和保护您的个人信息，以及您依法享有
        的权利和行使方式。
      </p>

      <div className="not-prose my-6 rounded-md border border-border bg-muted/30 p-4 text-[13px] leading-relaxed">
        <p className="m-0 mb-2 font-semibold text-foreground">摘要</p>
        <ul className="m-0 list-disc space-y-1 pl-5 text-muted-foreground">
          <li>我们仅收集为向您提供服务所必需的个人信息。</li>
          <li>我们<strong>不出售</strong>您的个人信息；不向任何第三方分享您的个人信息用于广告或营销。</li>
          <li>您的数据存储在 <strong>Neon Postgres 新加坡节点</strong>，属于跨境提供个人信息，详见第七节。</li>
          <li>站内 AI 助手回答时<strong>不会读取</strong>您历史的询盘、合同或私域文档；模型训练不使用您可识别的个人信息。</li>
          <li>您可随时通过 <a href="mailto:f1frp2015@gmail.com">f1frp2015@gmail.com</a> 行使查阅、复制、更正、删除、转移、撤回同意等全部权利，我们在 15 个工作日内答复。</li>
        </ul>
      </div>

      {/* ────────── 一、关于我们 ────────── */}
      <h2>第一节 关于我们</h2>

      <h3>1. 个人信息处理者（运营主体）</h3>
      <ul>
        <li>名称：重庆曜一新材料科技有限公司</li>
        <li>注册地：中华人民共和国 重庆市</li>
        <li>登记机关：详见&ldquo;国家企业信用信息公示系统&rdquo;（gsxt.gov.cn）公开信息</li>
        <li>ICP 备案：以本站页脚显示的备案号为准（工信部 ICP 备案系统 beian.miit.gov.cn 可查）</li>
        <li>联系邮箱：<a href="mailto:f1frp2015@gmail.com">f1frp2015@gmail.com</a></li>
      </ul>

      <h3>2. 个人信息保护负责人</h3>
      <p>
        我们指定专人负责个人信息保护事务，受理与个人信息相关的咨询、请求
        和投诉。您可通过 <a href="mailto:f1frp2015@gmail.com">f1frp2015@gmail.com</a>{" "}
        并在邮件主题注明&ldquo;个人信息保护负责人&rdquo;与其取得联系。
      </p>

      {/* ────────── 二、信息收集 ────────── */}
      <h2>第二节 我们收集您哪些个人信息</h2>

      <h3>3. 信息收集场景与种类</h3>

      <p>
        我们仅在以下场景中收集为实现相应功能所必需的个人信息。除注册必要
        信息外，其他信息您均可选择不提供，但可能影响相应功能的使用。
      </p>

      <h4>3.1 账号注册与登录</h4>
      <ul>
        <li><strong>必要</strong>：邮箱、密码（由 Clerk 加密处理，我们仅留存哈希值）；或微信开放平台 OpenID（使用微信登录时）。</li>
        <li><strong>可选</strong>：姓名、所在公司、职位、行业、所在城市。</li>
      </ul>

      <h4>3.2 询盘 / 选材 / RFQ 等业务请求</h4>
      <ul>
        <li>联系人姓名、公司名称、联系邮箱、联系电话（用于供应商回复）。</li>
        <li>技术规格、需求数量、目标国别、希望的交付方式与商务条件。</li>
        <li>您主动上传的附件（图纸、规格书等）。</li>
      </ul>

      <h4>3.3 内容贡献（问答、评论、文章、配方分享）</h4>
      <ul>
        <li>您发布的文本、图片、附件，以及与之关联的账号标识。</li>
        <li>您选择匿名发表时，我们仍会在后台保留账号关联以备合规追溯，但不会公开展示。</li>
      </ul>

      <h4>3.4 工厂入驻与企业认领</h4>
      <ul>
        <li>企业名称、统一社会信用代码、法定代表人姓名、营业执照影印件。</li>
        <li>资质证书（如 ISO 9001 / IATF 16949 等）影印件，用于人工核验。</li>
        <li>联系人姓名、职位、联系方式。</li>
      </ul>

      <h4>3.5 支付与开票</h4>
      <ul>
        <li>线上支付：通过 Stripe 收单，我们<strong>不接触</strong>您的完整银行卡号或 CVV，仅留存交易号与状态。</li>
        <li>对公转账：付款方名称、转账时间、金额、用途；您上传的转账凭证图片仅供我们核对入账。</li>
        <li>开票信息：发票抬头、税号、开票地址、收件邮箱。</li>
      </ul>

      <h4>3.6 浏览、检索与交互日志</h4>
      <ul>
        <li>IP 地址、设备型号、操作系统、浏览器 User-Agent、屏幕分辨率、访问时间戳。</li>
        <li>您访问的页面路径、搜索关键词、点击行为、停留时长。</li>
        <li>用途：站点性能监控、反爬虫与反滥用、产品体验改进。</li>
      </ul>

      <h4>3.7 Cookie 与同类技术</h4>
      <p>详见本政策第十三节。</p>

      <h3>4. 关于敏感个人信息</h3>
      <p>
        《个保法》第二十八条定义的&ldquo;敏感个人信息&rdquo;指一旦泄露或被
        非法使用容易导致自然人人格尊严受到侵害或人身、财产安全受到危害的
        个人信息。<strong>本站日常服务不主动收集您的敏感个人信息</strong>。
        若您在询盘附件、问答正文中自行上传含有敏感信息的内容（例如生物识别
        信息、医疗健康、行踪轨迹等），请审慎考虑必要性；我们将按照《个保法》
        第二十九条至第三十二条的要求采取严格保护措施，并仅在您单独同意的
        范围内处理。
      </p>

      {/* ────────── 三、信息使用 ────────── */}
      <h2>第三节 我们为什么收集、如何使用</h2>

      <h3>5. 处理目的、方式与法律依据</h3>

      <p>我们处理您个人信息的目的、方式与法律依据如下：</p>

      <ul>
        <li>
          <strong>履行合同或为订立合同所必需</strong>（《个保法》§13(1)(2)）：
          受理您的注册、询盘、采购、订阅、研报购买等请求并向您履约。
        </li>
        <li>
          <strong>履行法定义务</strong>（《个保法》§13(1)(3)）：
          税务发票、电信业务管理、网络安全应急响应、行政司法机关合法调取
          等场景下的强制留存或披露。
        </li>
        <li>
          <strong>基于您的同意</strong>（《个保法》§13(1)(1)）：
          营销邮件订阅、跨境提供个人信息、第三方分析工具加载等。您可随时
          撤回同意，撤回不影响此前基于同意已开展的处理活动。
        </li>
        <li>
          <strong>合理处理已公开的信息</strong>（《个保法》§13(1)(6)）：
          学术论文、专利文献等已合法公开的数据，我们在合理范围内予以
          检索、整理、展示。
        </li>
        <li>
          <strong>为公共利益开展统计与研究</strong>（《个保法》§13(1)(7)）：
          经匿名化处理后开展行业聚合研究、向上游品牌商提供市场情报。
        </li>
      </ul>

      <p>
        我们承诺：处理您的个人信息时遵循<strong>合法、正当、必要、诚信</strong>
        原则，限于实现处理目的的最小范围，不得进行与处理目的无关的处理。
      </p>

      {/* ────────── 四、信息共享与跨境提供 ────────── */}
      <h2>第四节 信息共享、委托处理与跨境提供</h2>

      <h3>6. 共享、委托处理、公开披露</h3>

      <p>
        <strong>我们不出售您的个人信息。</strong>在下列严格限定的情形下，
        我们才会与第三方共享或委托处理您的个人信息：
      </p>

      <ul>
        <li>
          <strong>您主动发起的供应商对接</strong>：当您通过本站向某家供应商
          发送询盘或样品申请时，我们会将您必要的联系方式与需求信息提供给
          您指定的该家供应商，以便其向您报价或寄样。
        </li>
        <li>
          <strong>受托服务商</strong>：为提供本站功能，我们委托外部服务商
          处理部分技术活动（如身份认证、邮件发送、对象存储、支付收单等）。
          完整清单见本政策第十四节。我们与每一家受托方签订书面协议，要求
          其按本政策的标准处理您的个人信息，不得用于约定范围之外的目的。
        </li>
        <li>
          <strong>法律要求或行政司法机关合法调取</strong>：依据法院判决、
          检察机关或公安机关的合法调取函等强制性法律文件。
        </li>
        <li>
          <strong>匿名化或去标识化后的聚合数据</strong>：用于发布行业研究
          报告、市场趋势统计。此类数据经处理后无法识别到您个人，且
          不可复原。
        </li>
      </ul>

      <h3>7. 跨境提供您的个人信息（数据出境）</h3>

      <p>
        <strong>这一节关系到您的重要权利，请仔细阅读。</strong>
      </p>

      <p>
        本站当前的应用数据库托管于 <strong>Neon Postgres（AWS
        ap-southeast-1，新加坡节点）</strong>。这意味着您提交给本站的个人
        信息会被传输至中华人民共和国境外存储。这构成《个保法》第三章第三节
        所规定的&ldquo;跨境提供个人信息&rdquo;。
      </p>

      <p><strong>境外接收方信息</strong>：</p>
      <ul>
        <li>名称：Neon, Inc.</li>
        <li>所在国家 / 地区：美国（运营总部）；数据物理存储节点：新加坡。</li>
        <li>处理目的：仅作为应用层数据库提供托管与读写服务。</li>
        <li>处理方式：受 Neon 服务条款及与我们签订的数据处理协议约束。</li>
        <li>处理种类：本政策第三节列明的全部已收集信息（不含支付密钥与登录密码哈希）。</li>
        <li>保存期限：与本站对应数据的保存期限一致（详见第八节）。</li>
      </ul>

      <p>
        此外，部分轻量级第三方服务（如 Vercel Analytics、Clerk 身份认证、
        Stripe 支付、Resend 邮件、AI 模型 API 等）由境外服务商提供，
        处理您的部分个人信息时同样涉及跨境传输，详见本政策第十四节。
      </p>

      <p><strong>我们采取的合规措施</strong>：</p>
      <ul>
        <li>已开展并定期更新<strong>个人信息保护影响评估（PIPIA）</strong>，评估出境的必要性、对个人权益的影响及风险防范措施。</li>
        <li>根据《个保法》第三十八条，通过<strong>订立个人信息出境标准合同</strong>（参照国家网信办《个人信息出境标准合同办法》范本）并向所在地省级网信部门完成备案的方式开展出境活动。</li>
        <li>对出境数据的访问范围、加密强度、日志审计提出明确合同要求。</li>
      </ul>

      <p><strong>您的单独同意权</strong>：</p>
      <p>
        依据《个保法》第三十九条，向境外提供您的个人信息需获得您的<strong>
        单独同意</strong>。您在本站完成注册或首次提交个人信息时，我们会
        以显著方式向您告知本节内容，您可选择同意或拒绝。若您拒绝跨境提供，
        我们将无法为您提供依赖境外服务的相应功能（如登录、AI 助手、付费
        服务等），但您可继续浏览本站公开内容。
      </p>

      <p>
        您可随时通过 <a href="mailto:f1frp2015@gmail.com">f1frp2015@gmail.com</a>{" "}
        撤回您对跨境提供的同意。撤回后我们将停止后续的跨境传输，并按您
        要求删除境外副本（除法律法规另有规定外）。
      </p>

      {/* ────────── 五、信息存储与保护 ────────── */}
      <h2>第五节 信息存储与保护</h2>

      <h3>8. 存储位置与期限</h3>
      <ul>
        <li><strong>应用数据库</strong>：Neon Postgres 新加坡节点（见第七节）。</li>
        <li><strong>文件存储</strong>：阿里云对象存储（OSS），华东 1（杭州）节点 — 用于支付凭证、企业资质影印件、用户上传图片。</li>
        <li><strong>邮件副本</strong>：业务邮箱（运营主体邮箱）— 询盘转发、客服对话。</li>
        <li><strong>边缘缓存</strong>：Vercel 全球边缘节点 — 仅缓存静态资源，不缓存身份相关动态内容。</li>
      </ul>

      <p>保存期限：</p>
      <ul>
        <li>账号资料：账号有效期内 + 注销后 30 天（用于异常恢复），届满硬删除。</li>
        <li>询盘、订单、合同相关信息：成交后 5 年（履行《电子商务法》§31 与税务档案要求），届满硬删除。</li>
        <li>访问日志（IP / UA / 路径）：最长 90 天，超期自动清除。</li>
        <li>聊天与 AI 对话记录：90 天，您可随时主动删除。</li>
        <li>财务凭证（发票、转账证明）：依《会计档案管理办法》留存 10 年。</li>
        <li>法律法规要求更长期限的，从其规定。</li>
      </ul>

      <h3>9. 安全保护措施</h3>
      <ul>
        <li><strong>传输加密</strong>：所有外部数据传输强制 HTTPS / TLS 1.2 以上。</li>
        <li><strong>存储加密</strong>：数据库与对象存储均启用磁盘级加密；登录密码仅以哈希形式保存。</li>
        <li><strong>最小权限</strong>：基于角色的访问控制；敏感操作要求二次认证。</li>
        <li><strong>审计</strong>：关键操作均有日志留痕；定期开展安全审计。</li>
        <li><strong>应急响应</strong>：发生或可能发生个人信息泄露、篡改、丢失的，我们将立即采取补救措施，并在<strong>72 小时内</strong>通过站内消息或邮件通知您与相应监管部门。</li>
      </ul>

      {/* ────────── 六、您的权利 ────────── */}
      <h2>第六节 您对自己个人信息的权利</h2>

      <h3>10. 个人信息权利清单与行使方式</h3>

      <p>依据《个保法》第四章，您对您的个人信息享有以下权利：</p>

      <ul>
        <li><strong>知情权 / 决定权</strong>（§44）：了解我们如何处理您的个人信息，并对处理活动作出决定。</li>
        <li><strong>查阅、复制权</strong>（§45）：查询并复制我们持有的关于您的个人信息。</li>
        <li><strong>可携权</strong>（§45）：将您的个人信息以结构化、通用的电子格式转移至您指定的其他个人信息处理者。</li>
        <li><strong>更正、补充权</strong>（§46）：要求我们更正错误或补充不完整的个人信息。</li>
        <li><strong>删除权</strong>（§47）：在处理目的已实现、您撤回同意、超过保存期限等情形下要求我们删除您的个人信息。</li>
        <li><strong>限制处理 / 拒绝处理权</strong>（§44）：在特定情形下要求限制处理或拒绝处理。</li>
        <li><strong>解释说明权</strong>（§48）：要求我们对个人信息处理规则进行解释说明。</li>
        <li><strong>撤回同意权</strong>（§15）：随时撤回此前基于同意作出的授权；撤回不影响此前已开展处理活动的效力。</li>
        <li><strong>身故后的近亲属权利</strong>（§49）：自然人死亡的，其近亲属可为自身合法、正当利益对死者相关个人信息行使上述权利。</li>
      </ul>

      <p><strong>行使方式</strong>：</p>
      <ul>
        <li>大多数权利可在登录后的&ldquo;控制台 → 账号设置&rdquo;中自助行使。</li>
        <li>无法自助行使或自助行使后仍有问题的，请发送邮件至 <a href="mailto:f1frp2015@gmail.com">f1frp2015@gmail.com</a>，并在邮件中说明您的诉求与身份核验信息。</li>
        <li>我们将在<strong>15 个工作日内</strong>答复；情况复杂的依法可延长至 30 个工作日。</li>
        <li>若您对答复结果不满意，可依本政策第十六节寻求外部救济。</li>
      </ul>

      {/* ────────── 七、特殊场景 ────────── */}
      <h2>第七节 特殊场景</h2>

      <h3>11. 未成年人保护</h3>
      <p>
        本站面向工业领域的工程师、采购、企业用户，<strong>不面向未满 14
        周岁的儿童</strong>。如您是未满 14 周岁的儿童，请在监护人陪同下
        阅读本政策，并由监护人代为决定是否使用本站及提供相关个人信息。
      </p>
      <p>
        若您是 14 周岁以上但未满 18 周岁的未成年人，建议您在监护人指导下
        使用本站。我们如发现已收集到未满 14 周岁儿童个人信息的，将依
        《未成年人保护法》《未成年人网络保护条例》立即停止处理并删除。
      </p>

      <h3>12. 自动化决策与生成式 AI 服务说明</h3>
      <p>
        本站的核心功能依赖 AI 模型，包括但不限于：选材推荐、配方分析、
        标准查询、供应商匹配、询盘自动起草、AI 问答等。
      </p>
      <ul>
        <li>本站使用的 AI 模型（详见第十四节）由境内外第三方服务商提供，我们仅作为服务调用方。</li>
        <li>本站<strong>不会</strong>使用您可识别的个人信息（如账号资料、询盘联系方式）训练 AI 模型。</li>
        <li>AI 输出仅供参考，<strong>不构成专业的工程、法律、合规建议</strong>。涉及设计、采购、合规决策时请咨询合格的工程师或顾问。</li>
        <li>依《生成式人工智能服务管理暂行办法》，本站 AI 输出会以显著方式（如标签、水印或前缀）告知您内容为 AI 生成。</li>
        <li>对于<strong>对您权益有重大影响的自动化决策</strong>（如付费功能的资格判定），您有权要求人工复核（《个保法》§24）。</li>
      </ul>

      <h3>13. Cookie 与同类技术</h3>
      <p>本站使用以下类型的 Cookie / Local Storage：</p>
      <ul>
        <li>
          <strong>必要 Cookie</strong>（无需同意，无法关闭）：维持登录会话
          （Clerk）、记录 Cookie 同意状态（cookie-consent-v1）、防 CSRF。
        </li>
        <li>
          <strong>偏好 Cookie</strong>：记录语言、深浅色模式、UI 状态。
        </li>
        <li>
          <strong>分析 Cookie</strong>（需您同意后才加载）：Vercel
          Analytics、Vercel Speed Insights，仅采集去标识化的聚合页面浏览
          与性能指标。
        </li>
      </ul>
      <p>
        您可随时通过浏览器设置清除本站 Cookie（清除
        <code>cookie-consent-v1</code> 后下次访问会再次请求同意），或在
        浏览器中禁用 Cookie，但可能影响登录与个性化体验。
      </p>

      {/* ────────── 八、第三方服务清单 ────────── */}
      <h2>第八节 第三方服务清单</h2>

      <h3>14. 我们使用的关键第三方服务</h3>
      <p>
        为提供本站功能，我们对接以下第三方服务。每家的隐私政策请见对应
        官方网站，您接受本政策即默示您理解并同意我们与下列服务商之间的
        必要数据交互。
      </p>

      <ul>
        <li><strong>Clerk</strong>（Clerk, Inc., 美国）— 身份认证与账号管理。处理：邮箱、密码哈希、登录设备指纹。</li>
        <li><strong>Neon</strong>（Neon, Inc., 美国 / 新加坡节点）— 主应用数据库托管。处理：本站全部数据库表。</li>
        <li><strong>阿里云对象存储 OSS</strong>（杭州节点）— 用户上传文件与支付凭证存储。</li>
        <li><strong>Stripe</strong>（Stripe, Inc., 美国）— 在线支付收单。处理：付款方姓名、邮箱、卡片标识（不含完整卡号 / CVV）。</li>
        <li><strong>Resend</strong>（Resend, Inc., 美国）— 交易性邮件发送。处理：收件人邮箱、邮件正文。</li>
        <li><strong>DeepSeek</strong>（杭州深度求索）— 国内 AI 对话主路径。处理：您的提问文本、对话上下文。</li>
        <li><strong>阿里通义千问 DashScope</strong>（阿里云）— RAG 向量化与备选 AI。处理：用于检索的文本片段（不含您的身份信息）。</li>
        <li><strong>Anthropic Claude / Google Gemini</strong>（仅海外侧）— 海外 AI 对话备用路径。</li>
        <li><strong>Tavily</strong>（Tavily, Inc., 美国）— AI 实时网络搜索。处理：您的搜索查询。</li>
        <li><strong>Svix</strong>（Svix, Inc., 美国）— Webhook 事件签名校验。处理：账号事件元数据。</li>
        <li><strong>Vercel</strong>（Vercel, Inc., 美国）— 边缘 CDN、Analytics、Speed Insights。处理：访问日志、聚合性能指标。</li>
        <li><strong>微信开放平台 / 公众平台</strong>（腾讯）— 微信登录、小程序、消息推送。处理：OpenID、UnionID（不含微信号）。</li>
        <li><strong>百度站长 / 神马 / 搜狗 / 头条搜索</strong>（仅外发推送）— 搜索引擎主动收录。处理：本站公开 URL（不含个人信息）。</li>
      </ul>

      <p>
        若上述服务商发生重大变更（更换、新增、终止），我们将通过更新本政策
        并以站内公告方式告知您。
      </p>

      {/* ────────── 九、其他 ────────── */}
      <h2>第九节 其他</h2>

      <h3>15. 本政策的变更与通知</h3>
      <p>
        本政策可能根据法律法规变化、业务调整或用户反馈进行更新。每次更新
        后，我们会更新本页顶部的版本号与生效日期。对于<strong>实质性
        变更</strong>（涉及处理目的、方式、种类、共享、跨境的实质改变，或
        您权利的实质削弱），我们会在变更生效前 7 个自然日通过站内公告、
        邮件等显著方式向您告知，并在适用时再次取得您的同意。
      </p>

      <h3>16. 申诉、投诉与监管举报渠道</h3>
      <p>
        如您认为本站的个人信息处理活动侵害了您的合法权益，您可通过以下
        渠道寻求救济：
      </p>
      <ul>
        <li><strong>本站投诉</strong>：发送邮件至 <a href="mailto:f1frp2015@gmail.com">f1frp2015@gmail.com</a>，主题注明&ldquo;个人信息保护投诉&rdquo;。</li>
        <li><strong>国家网信办违法和不良信息举报中心</strong>：<a href="https://www.12377.cn" rel="noopener noreferrer" target="_blank">12377.cn</a>，举报电话 12377。</li>
        <li><strong>工业和信息化部电信用户申诉受理中心</strong>：<a href="https://yhssglxt.miit.gov.cn" rel="noopener noreferrer" target="_blank">yhssglxt.miit.gov.cn</a>，申诉电话 12300（涉及电信服务）。</li>
        <li><strong>消费者权益保护</strong>：拨打 12315 或登录 <a href="https://www.12315.cn" rel="noopener noreferrer" target="_blank">12315.cn</a>。</li>
        <li><strong>司法途径</strong>：向本公司所在地（重庆市）有管辖权的人民法院提起诉讼。本政策的解释与争议适用<strong>中华人民共和国法律</strong>。</li>
      </ul>

      <p className="mt-8 text-xs text-muted-foreground">
        本政策的中文版本为正式版本。如本政策与本站发布的英文或其他语言
        版本存在不一致，以本中文版本为准。
      </p>
    </div>
  );
}
