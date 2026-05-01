// 通用 Resend 邮件发送（best-effort，失败不抛）
// 用于支付订单状态变更通知 / 后续其它系统邮件

const FROM = "f1frp <noreply@f1frp.com>";
const CC_OPS = "doris.li@f1composite.com";

interface SendOpts {
  to: string;
  subject: string;
  html: string;
  cc?: string[];
}

export async function sendEmail({ to, subject, html, cc }: SendOpts): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("[email] RESEND_API_KEY not set — skipping send", { to, subject });
    return false;
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: FROM,
        to,
        cc: cc ?? [CC_OPS],
        subject,
        html,
      }),
    });
    if (!res.ok) {
      console.error("[email] Resend error", res.status, await res.text());
      return false;
    }
    return true;
  } catch (err) {
    console.error("[email] fetch failed", err);
    return false;
  }
}

// ─── 支付订单状态变更通知模板 ────────────────────────

interface ConfirmCtx {
  orderType: "rfq" | "report" | "pro_membership" | "agency_deposit" | "other";
  orderNo: string;
  payerName: string;
  amountCents: number;
  // 业务侧上下文
  reportTitle?: string;
  reportSlug?: string;
  planName?: string;
  expiresAt?: Date;
  rfqMaterial?: string;
}

export async function sendOrderConfirmedEmail(
  to: string,
  ctx: ConfirmCtx,
): Promise<void> {
  const yuan = (ctx.amountCents / 100).toFixed(2);
  let subject = "";
  let body = "";
  switch (ctx.orderType) {
    case "report":
      subject = `研报购买已开通 — ${ctx.reportTitle ?? ctx.orderNo}`;
      body = `
        <p>您好 ${ctx.payerName}，</p>
        <p>您的研报订单 <code>${ctx.orderNo}</code> 已对账完成（¥${yuan}），现在可以下载阅读：</p>
        <p><a href="https://f1frp.com/reports/${ctx.reportSlug ?? ""}" style="display:inline-block;padding:10px 20px;background:#0070f3;color:#fff;border-radius:6px;text-decoration:none">查看研报</a></p>
        <p style="color:#888;font-size:12px">如需电子发票请回复本邮件并附公司抬头与税号。</p>
      `;
      break;
    case "pro_membership":
      subject = `Pro 会员已开通 — ${ctx.planName ?? ""}`;
      body = `
        <p>您好 ${ctx.payerName}，</p>
        <p>您的 ${ctx.planName ?? "Pro 会员"} 订单 <code>${ctx.orderNo}</code> 已对账完成（¥${yuan}）。</p>
        <p>会员权益已激活${ctx.expiresAt ? `，到期时间：<strong>${ctx.expiresAt.toISOString().slice(0, 10)}</strong>` : ""}。</p>
        <p><a href="https://f1frp.com/dashboard" style="display:inline-block;padding:10px 20px;background:#0070f3;color:#fff;border-radius:6px;text-decoration:none">进入控制台</a></p>
      `;
      break;
    case "rfq":
      subject = `RFQ 付款已确认 — ${ctx.orderNo}`;
      body = `
        <p>您好 ${ctx.payerName}，</p>
        <p>您的 RFQ 付款 <code>${ctx.orderNo}</code> 已对账完成（¥${yuan}${ctx.rfqMaterial ? ` · ${ctx.rfqMaterial}` : ""}）。</p>
        <p>询盘已发送给目标供应商；通常会在 48 小时内收到首次回复。</p>
      `;
      break;
    default:
      subject = `订单已确认 — ${ctx.orderNo}`;
      body = `<p>您的订单 ${ctx.orderNo} 已对账完成（¥${yuan}）。</p>`;
  }

  await sendEmail({
    to,
    subject,
    html: wrapHtml(subject, body),
  });
}

// 用户刚建单（init）— 发"订单已建立 + 收款信息"邮件，方便用户保存
interface InitCtx {
  orderType: "rfq" | "report" | "pro_membership" | "agency_deposit" | "other";
  orderNo: string;
  payerName: string;
  amountCents: number;
  expiresAt: Date;
  bank?: { payeeName: string; bankName: string; account: string; branch?: string };
  qrUrl?: string;
}

const ORDER_TYPE_LABEL: Record<InitCtx["orderType"], string> = {
  rfq: "付费询盘",
  report: "研报购买",
  pro_membership: "Pro 会员",
  agency_deposit: "代理保证金",
  other: "订单",
};

export async function sendOrderInitEmail(to: string, ctx: InitCtx): Promise<void> {
  const yuan = (ctx.amountCents / 100).toFixed(2);
  const subject = `订单已建立 ${ctx.orderNo} — 请按以下信息转账`;
  const exp = ctx.expiresAt.toISOString().slice(0, 16).replace("T", " ");
  const bankBlock = ctx.bank
    ? `<table style="width:100%;border-collapse:collapse;margin-top:8px;font-size:13px"><tbody>
        <tr><td style="padding:6px 8px;background:#f5f5f5;width:30%">收款方</td><td style="padding:6px 8px;border-bottom:1px solid #eee"><strong>${escapeHtml(ctx.bank.payeeName)}</strong></td></tr>
        <tr><td style="padding:6px 8px;background:#f5f5f5">开户行</td><td style="padding:6px 8px;border-bottom:1px solid #eee">${escapeHtml(ctx.bank.bankName)}</td></tr>
        <tr><td style="padding:6px 8px;background:#f5f5f5">账号</td><td style="padding:6px 8px;border-bottom:1px solid #eee;font-family:monospace">${escapeHtml(ctx.bank.account)}</td></tr>
        ${ctx.bank.branch ? `<tr><td style="padding:6px 8px;background:#f5f5f5">支行</td><td style="padding:6px 8px;border-bottom:1px solid #eee">${escapeHtml(ctx.bank.branch)}</td></tr>` : ""}
      </tbody></table>`
    : "";
  const body = `
    <p>您好 ${escapeHtml(ctx.payerName)}，</p>
    <p>您的 <strong>${ORDER_TYPE_LABEL[ctx.orderType]}</strong> 订单已建立：</p>
    <ul>
      <li>订单号：<code>${ctx.orderNo}</code></li>
      <li>金额：<strong>¥ ${yuan}</strong></li>
      <li>有效期至：${exp}</li>
    </ul>
    <p><strong>转账到以下对公账户，并在备注栏填订单号 <code>${ctx.orderNo}</code></strong>：</p>
    ${bankBlock}
    <p>转账完成后，请回到 f1frp.com 提交转账凭证（金额、时间、付款方账号后 4 位等），便于我们 1 个工作日内对账。</p>
    <p style="color:#888;font-size:12px">紧急问题：doris.li@f1composite.com / 138 8333 8993</p>
  `;
  await sendEmail({ to, subject, html: wrapHtml(subject, body) });
}

// 用户已提交转账凭证（confirm）— "我们已收到，1 工作日内对账"
interface EvidenceCtx {
  orderNo: string;
  payerName: string;
  amountCents: number;
  payerTransferAmountCents?: number | null;
}

export async function sendEvidenceReceivedEmail(to: string, ctx: EvidenceCtx): Promise<void> {
  const yuan = (ctx.amountCents / 100).toFixed(2);
  const transferred = ctx.payerTransferAmountCents != null
    ? `（您填写的实付：¥ ${(ctx.payerTransferAmountCents / 100).toFixed(2)}${ctx.payerTransferAmountCents !== ctx.amountCents ? "，与应付金额不一致，对账时会重点核对" : ""}）`
    : "";
  const subject = `转账凭证已收到 ${ctx.orderNo} — 等待对账`;
  const body = `
    <p>您好 ${escapeHtml(ctx.payerName)}，</p>
    <p>我们已收到您的转账凭证，订单 <code>${ctx.orderNo}</code>（应付 ¥ ${yuan}）${transferred}进入对账队列。</p>
    <p>预计 <strong>1 个工作日</strong>内核对完成，对账成功后您会收到一封"权益已开通"的邮件；如有金额或备注不符的问题，我们会通过邮件与您沟通。</p>
    <p style="color:#888;font-size:12px">紧急问题：doris.li@f1composite.com / 138 8333 8993</p>
  `;
  await sendEmail({ to, subject, html: wrapHtml(subject, body) });
}

interface RejectCtx {
  orderNo: string;
  payerName: string;
  amountCents: number;
  reason: string;
}

export async function sendOrderRejectedEmail(
  to: string,
  ctx: RejectCtx,
): Promise<void> {
  const yuan = (ctx.amountCents / 100).toFixed(2);
  const subject = `订单未通过对账 — ${ctx.orderNo}`;
  const body = `
    <p>您好 ${ctx.payerName}，</p>
    <p>您的订单 <code>${ctx.orderNo}</code>（¥${yuan}）未能通过对账，原因：</p>
    <blockquote style="border-left:3px solid #ef4444;padding-left:12px;color:#444">${escapeHtml(ctx.reason)}</blockquote>
    <p>请回复本邮件提供补充凭证（转账截图 / 银行回单），我们会重新核对。</p>
    <p style="color:#888;font-size:12px">紧急问题：doris.li@f1composite.com / 138 8333 8993</p>
  `;
  await sendEmail({ to, subject, html: wrapHtml(subject, body) });
}

function wrapHtml(title: string, inner: string): string {
  return `<!DOCTYPE html><html lang="zh"><head><meta charset="UTF-8"><title>${escapeHtml(title)}</title></head>
<body style="font-family:-apple-system,sans-serif;max-width:600px;margin:auto;padding:24px;color:#1a1a1a">
${inner}
<hr style="margin-top:32px;border:0;border-top:1px solid #eee">
<p style="color:#888;font-size:11px">此邮件由 f1frp.com 自动发出 · 重庆曜一新材料科技有限公司</p>
</body></html>`;
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[c]!);
}
