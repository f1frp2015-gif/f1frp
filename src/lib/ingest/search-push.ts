// Multi-engine search-engine fan-out.
// Each provider no-ops silently when its credentials are missing, so this is
// safe to call on every ingest — just configure the engines you want enabled.

import { pushToBaidu } from "./baidu-push";
import { CURRENT_SITE_URL } from "@/lib/sites";

// 按部署侧动态取站点(getfrp.com / f1frp.com)。曾写死 "f1frp.com" → getfrp 侧
// 发布的英文页从不进 IndexNow(Bing/Yandex),而 ChatGPT 搜索的发现层走 Bing,
// 等于 getfrp 的新页/更新页对 ChatGPT 搜索"隐形"。
const SITE = new URL(CURRENT_SITE_URL).hostname;
const KEY_LOCATION = `${CURRENT_SITE_URL}/indexnow-key`;

type PushResult =
  | { engine: string; skipped: true; reason: string }
  | { engine: string; ok: true; detail: unknown };

async function pushIndexNow(urls: string[]): Promise<PushResult> {
  const key = process.env.INDEXNOW_KEY;
  if (!key) return { engine: "indexnow", skipped: true, reason: "INDEXNOW_KEY not set" };
  if (urls.length === 0) return { engine: "indexnow", skipped: true, reason: "empty urls" };
  try {
    // IndexNow is accepted by Bing, Yandex, Naver, Seznam — one hit fans out.
    const res = await fetch("https://api.indexnow.org/IndexNow", {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({
        host: SITE,
        key,
        keyLocation: KEY_LOCATION,
        urlList: urls,
      }),
    });
    return res.ok
      ? { engine: "indexnow", ok: true, detail: { status: res.status } }
      : { engine: "indexnow", skipped: true, reason: `http ${res.status}` };
  } catch (e) {
    return { engine: "indexnow", skipped: true, reason: e instanceof Error ? e.message : String(e) };
  }
}

async function pushSogou(urls: string[]): Promise<PushResult> {
  // Sogou webmaster platform: https://zhanzhang.sogou.com/
  // Submit via user_id + site-verified token.
  const token = process.env.SOGOU_PUSH_TOKEN;
  const userId = process.env.SOGOU_USER_ID;
  if (!token || !userId) {
    return { engine: "sogou", skipped: true, reason: "SOGOU_PUSH_TOKEN / SOGOU_USER_ID not set" };
  }
  if (urls.length === 0) return { engine: "sogou", skipped: true, reason: "empty urls" };
  try {
    const res = await fetch(
      `https://fankui.zhanzhang.sogou.com/linkSubmit/push?site=${SITE}&user_id=${userId}&token=${token}`,
      {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        body: urls.join("\n"),
      }
    );
    return res.ok
      ? { engine: "sogou", ok: true, detail: { status: res.status } }
      : { engine: "sogou", skipped: true, reason: `http ${res.status}` };
  } catch (e) {
    return { engine: "sogou", skipped: true, reason: e instanceof Error ? e.message : String(e) };
  }
}

async function push360(urls: string[]): Promise<PushResult> {
  // 360 搜索站长平台: https://zhanzhang.so.com/
  const token = process.env.SM_PUSH_TOKEN;
  if (!token) return { engine: "360", skipped: true, reason: "SM_PUSH_TOKEN not set" };
  if (urls.length === 0) return { engine: "360", skipped: true, reason: "empty urls" };
  try {
    const res = await fetch(`https://api.haosou.com/LinkSubmit/push?site=${SITE}&token=${token}`, {
      method: "POST",
      headers: { "Content-Type": "text/plain" },
      body: urls.join("\n"),
    });
    return res.ok
      ? { engine: "360", ok: true, detail: { status: res.status } }
      : { engine: "360", skipped: true, reason: `http ${res.status}` };
  } catch (e) {
    return { engine: "360", skipped: true, reason: e instanceof Error ? e.message : String(e) };
  }
}

async function pushGoogleIndexing(urls: string[]): Promise<PushResult> {
  // Google Indexing API requires a service-account JWT. Most sites don't qualify
  // (it's officially for JobPosting/BroadcastEvent), but for our needs it's
  // wired here with a no-op stub — fill GOOGLE_INDEXING_SA_JSON to enable.
  const sa = process.env.GOOGLE_INDEXING_SA_JSON;
  if (!sa) return { engine: "google", skipped: true, reason: "GOOGLE_INDEXING_SA_JSON not set" };
  if (urls.length === 0) return { engine: "google", skipped: true, reason: "empty urls" };
  // Stub — real implementation needs google-auth-library. Left as a hook.
  return { engine: "google", skipped: true, reason: "stub: implement with google-auth-library" };
}

export async function fanOutSearchPush(urls: string[]): Promise<{
  urlCount: number;
  results: Array<PushResult | { engine: "baidu"; detail: unknown }>;
}> {
  if (!urls.length) return { urlCount: 0, results: [] };

  const [indexnow, sogou, sm, google, baidu] = await Promise.all([
    pushIndexNow(urls),
    pushSogou(urls),
    push360(urls),
    pushGoogleIndexing(urls),
    pushToBaidu(urls).then((d) => ({ engine: "baidu" as const, detail: d })),
  ]);
  return {
    urlCount: urls.length,
    results: [indexnow, sogou, sm, google, baidu],
  };
}
