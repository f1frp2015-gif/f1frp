// Telegram channel notification — posts a digest of newly ingested items.
// No-ops when TELEGRAM_BOT_TOKEN or TELEGRAM_CHANNEL_ID are not set.

type TelegramItem = {
  title: string;
  url: string;
  kind: "paper" | "patent" | "article";
};

const KIND_EMOJI: Record<TelegramItem["kind"], string> = {
  paper: "📄",
  patent: "🔬",
  article: "📰",
};

const KIND_LABEL_ZH: Record<TelegramItem["kind"], string> = {
  paper: "论文",
  patent: "专利",
  article: "资讯",
};

function buildMessage(items: TelegramItem[]): string {
  const lines: string[] = [
    "🔧 *复材站 f1frp 今日更新*",
    "",
  ];

  for (const item of items) {
    const emoji = KIND_EMOJI[item.kind];
    const label = KIND_LABEL_ZH[item.kind];
    // Escape Markdown special chars for Telegram MarkdownV2
    const title = item.title
      .replace(/[_*[\]()~`>#+\-=|{}.!\\]/g, (c) => `\\${c}`)
      .slice(0, 80);
    lines.push(`${emoji} \\[${label}\\] [${title}](${item.url})`);
  }

  lines.push("", "_via [f1frp\\.com](https://f1frp.com)_");
  return lines.join("\n");
}

export async function notifyTelegram(items: TelegramItem[]): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHANNEL_ID;

  if (!token || !chatId) return;
  if (!items.length) return;

  const text = buildMessage(items);

  try {
    const res = await fetch(
      `https://api.telegram.org/bot${token}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text,
          parse_mode: "MarkdownV2",
          disable_web_page_preview: false,
        }),
        signal: AbortSignal.timeout(10_000),
      }
    );
    if (!res.ok) {
      const body = await res.text();
      console.warn("[telegram-notify] send failed:", res.status, body);
    }
  } catch (e) {
    console.warn("[telegram-notify] fetch error:", e instanceof Error ? e.message : e);
  }
}
