// Baidu 普通收录 API — push URLs for accelerated indexing.
// Requires BAIDU_PUSH_TOKEN from https://ziyuan.baidu.com/linksubmit/index
// Silently no-ops when token is not configured.

const SITE = "f1frp.com";

export async function pushToBaidu(urls: string[]): Promise<
  | { skipped: true; reason: string }
  | { success: number; remain: number; not_same_site?: string[]; not_valid?: string[] }
> {
  const token = process.env.BAIDU_PUSH_TOKEN;
  if (!token) return { skipped: true, reason: "BAIDU_PUSH_TOKEN not set" };
  if (urls.length === 0) return { skipped: true, reason: "empty urls" };

  const body = urls.join("\n");
  const endpoint = `http://data.zz.baidu.com/urls?site=${SITE}&token=${token}`;
  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "text/plain" },
      body,
    });
    if (!res.ok) {
      return {
        skipped: true,
        reason: `http ${res.status}: ${await res.text().catch(() => "")}`,
      };
    }
    return (await res.json()) as {
      success: number;
      remain: number;
      not_same_site?: string[];
      not_valid?: string[];
    };
  } catch (e) {
    return {
      skipped: true,
      reason: e instanceof Error ? e.message : String(e),
    };
  }
}
