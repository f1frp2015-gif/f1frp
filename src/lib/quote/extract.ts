// 自然语言 → QuoteInput 抽取(AI 层,DeepSeek 主 / Gemini 副)
//
// 设计哲学:
//   - AI 只做语义抽取 + 反问,不算钱
//   - 抽不全直接返回 missing[] + followup_question,前端走多轮
//   - 任何置信度 < 60 强制走表单(quoteTool.tsx 处理)
//
// 实现风格:用 generateText + 显式 JSON 提示 + Zod 校验,而不是 Output.object()。
// 跟 src/app/api/followups/route.ts 注释保持一致 — DeepSeek / OpenRouter 上
// structured-output 不稳,plain-text JSON 解析跨 provider 最可靠。

import { generateText } from "ai";
import { getChatModelForRequest } from "@/lib/ai/provider";
import { ExtractResultSchema, type ExtractResult } from "./types";

const SYSTEM_ZH = `你是 f1frp.com 拉挤型材 AI 粗测报价助手的"输入解析器"。
你的任务:把用户用自然语言描述的拉挤型材需求,提取为严格 JSON。

规则:
1. 七种支持的截面 geometry.type:round / square / rect / angle / channel / i_beam / custom
   - round: { type:"round", od: 外径mm, id: 内径mm }(实心 id=0)
   - square: { type:"square", side: 边长mm, t: 壁厚mm }
   - rect: { type:"rect", w, h, t }
   - angle: { type:"angle", leg: 腿长mm, t }
   - channel: { type:"channel", w, h, t }
   - i_beam: { type:"i_beam", bf: 翼缘宽mm, tf: 翼缘厚mm, h: 总高mm, tw: 腹板厚mm }
     关键词:工字钢 / 工字梁 / 工字 / H 型 / H-beam / I-beam / W-section
     "100×100×6×8" 这种 4 维标注 → bf=100, h=100, tw=6, tf=8 (GB/T 706 习惯,前两位是 bf×h)
   - custom: { type:"custom", area_mm2, outer_perim_mm, inner_perim_mm, complexity, note }
     关键词:异形 / 异型 / 自定义 / 非标 / custom / non-standard / odd-shape
     用户明说"截面积 XXX mm² 外周长 YYY mm" 或 "异形 + 形状描述"时用 custom
     complexity 三档:simple / medium(默认) / complex,看用户用词:
       "简单异形 / 对称" → simple
       "多腔 / 嵌件 / 双密度 / 薄壁多特征" → complex
       其他 → medium
     note 是 50 字内的形状描述(给后续解释用)
     无法从用户输入抽出 area_mm2 + outer_perim_mm 两数字时,不要瞎填,放 missing
2. fiber: e_glass(无碱玻纤,默认)/ ecr_glass(耐腐 ECR)/ carbon(碳纤)/ hybrid(混编)
3. resin: up(不饱和聚酯)/ epoxy(环氧)/ ve(乙烯基酯)/ phenolic(酚醛)/ pu(聚氨酯)
4. 单位:所有长度统一 mm。length_mm 是单根定尺(常见 6000),quantity 是根数
5. 用户只说总米数时:length_mm=6000,quantity = ceil(总米数 / 6),并把 length_mm 放 missing 提示用户确认
6. 缺关键参数(geometry / fiber / resin / quantity 任一)→ confidence < 60,并填 missing
7. 不要编造数字 — 不确定的字段宁可缺,也别瞎填
8. followup_question 只在 missing 非空时填,最多 1 个问题,口语化中文
9. 关键词映射:户外/UV → uv_coating: true;阻燃/防火 → fire_retardant: true;食品 → food_grade: true
10. color: 灰/默认 → gray,黑 → black,白 → white,其他 → custom
11. surface_veil 默认 true(户外/防腐场景),其余 false
12. inner_veil:用户提到"内毡 / 内表面增强 / 防腐内层 / inner mat" → true;否则 false。
    且仅闭口型材(round / square / rect)有意义,开口型材忽略即可
13. fiber_content_pct 缺省 70
14. cavities(模具出数 1 出 N):用户提到"一模 N 件 / 1 出 N / 同模多腔" → 填整数 N;否则不填(走该型材默认通常 1)
15. machining(机加工):用户提到"机加 / 钻孔 / 倒角 / 切割 / 攻丝 / 打磨" → true
16. painting(喷涂):用户提到"喷涂 / 涂装 / 油漆 / 喷漆 / 装饰漆" → true
17. packaging(包装):用户明说"含包装 / 木托盘 / 纸箱" → true;否则 false
18. freight(运费):用户明说"含运费 / 含运 / 到厂价 / 含送货" → true;否则 false

严格输出单行 JSON,符合以下结构,无任何 markdown 或多余文字:
{"confidence": 0-100, "partial": {...}, "missing": ["..."], "followup_question": "..."}`;

const SYSTEM_EN = `You are the input parser for f1frp.com's AI pultruded profile quote tool.
Your job: extract STRICT JSON from a natural-language profile request.

Rules:
1. Supported geometry.type: round / square / rect / angle / channel / i_beam / custom
   - round: { type:"round", od, id }   (solid → id=0)
   - square: { type:"square", side, t }
   - rect: { type:"rect", w, h, t }
   - angle: { type:"angle", leg, t }
   - channel: { type:"channel", w, h, t }
   - i_beam: { type:"i_beam", bf, tf, h, tw }  (bf=flange width, tf=flange thk, h=total height, tw=web thk)
     Keywords: I-beam / H-beam / H-section / W-section / wide-flange / 工字 / 工字梁
     A "W6x9" or "150×150×7×10" annotation → bf=150, h=150, tw=7, tf=10
   - custom: { type:"custom", area_mm2, outer_perim_mm, inner_perim_mm, complexity, note }
     Keywords: custom / non-standard / odd-shape / asymmetric / multi-cavity / 异形 / 非标
     complexity: simple / medium (default) / complex — based on user's words
     note: ≤50-word shape description for explain generator
     If you can't extract both area_mm2 AND outer_perim_mm, put them in missing — don't guess
2. fiber: e_glass (default) / ecr_glass / carbon / hybrid.
3. resin: up / epoxy / ve / phenolic / pu.
4. All lengths in mm. length_mm is single-piece length (typically 6000); quantity is piece count.
5. If user only gives total meters: length_mm=6000, quantity = ceil(total / 6), add length_mm to missing.
6. Missing any critical field (geometry / fiber / resin / quantity) → confidence < 60, list it.
7. NEVER fabricate numbers. Unsure → leave it out.
8. followup_question only when missing is non-empty; one short conversational question.
9. Keywords: outdoor/UV → uv_coating: true; flame retardant → fire_retardant: true; food → food_grade: true.
10. color: gray (default) / black / white / custom.
11. surface_veil defaults true (outdoor/corrosion contexts), else false.
12. inner_veil: user mentions "inner mat / inner liner / corrosion barrier inside / 内毡" → true; else false.
    Only meaningful for closed sections (round / square / rect); ignore for open.
13. fiber_content_pct defaults 70.
14. cavities (1-out-of-N mold): user mentions "1 out of N / multi-cavity mold" → integer N; otherwise leave it out (defaults usually 1).
15. machining: user mentions "machining / drilling / chamfer / cutting / tap" → true
16. painting: user mentions "paint / coating / spray / decorative finish" → true
17. packaging: user mentions "packaging / pallet / crate / box included" → true; else false
18. freight: user mentions "freight / shipping / delivered / CIP / DDP / 含运" → true; else false

Output ONLY a single-line JSON, no markdown, no prose:
{"confidence": 0-100, "partial": {...}, "missing": ["..."], "followup_question": "..."}`;

const FAILURE_FALLBACK: ExtractResult = {
  confidence: 0,
  partial: {},
  missing: ["AI 暂时无法解析这段描述,请改用下方表单"],
  followup_question: undefined,
};

export async function extractQuoteInput(
  userText: string,
  req: Request,
  locale: "zh" | "en",
): Promise<ExtractResult> {
  const model = getChatModelForRequest(req);

  let text = "";
  try {
    const result = await generateText({
      model,
      system: locale === "en" ? SYSTEM_EN : SYSTEM_ZH,
      prompt: userText,
      temperature: 0.2,
      maxOutputTokens: 800,
    });
    text = result.text;
  } catch (e) {
    console.warn(
      "[quote-extract] generateText failed:",
      e instanceof Error ? e.message : e,
    );
    return FAILURE_FALLBACK;
  }

  const parsed = tryParseJson(text);
  if (!parsed) {
    console.warn("[quote-extract] non-JSON output:", text.slice(0, 200));
    return FAILURE_FALLBACK;
  }

  // Zod 二次校验 — AI 偶尔会返回错的 enum / 越界数字,容错直接降为 fallback
  const safe = ExtractResultSchema.safeParse(parsed);
  if (!safe.success) {
    console.warn(
      "[quote-extract] zod rejected:",
      safe.error.issues.slice(0, 3),
    );
    return FAILURE_FALLBACK;
  }
  return safe.data;
}

// AI 返回偶尔带 ``` 围栏或前后说明 — 提取第一段大括号内容
function tryParseJson(s: string): unknown {
  const trimmed = s.trim();
  // 直接尝试
  try { return JSON.parse(trimmed); } catch { /* fall through */ }
  // 提取 ```json ... ``` 围栏
  const fence = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fence) {
    try { return JSON.parse(fence[1]); } catch { /* fall through */ }
  }
  // 抓第一个 { ... } 平衡段
  const first = trimmed.indexOf("{");
  const last = trimmed.lastIndexOf("}");
  if (first >= 0 && last > first) {
    try { return JSON.parse(trimmed.slice(first, last + 1)); } catch { /* */ }
  }
  return null;
}
