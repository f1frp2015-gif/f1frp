# f1frp.com 站长平台验证 + 主动推送 操作清单（P0-1）

> 目的：把"建好但没开"的进索引通道打开。sitemap 分片（P0-2）已上线，但各引擎站长验证 / 主动推送 token 全未配 → cron `fanOutSearchPush` 在静默 no-op。本清单逐平台把 secret 填上。
>
> 对应代码：`src/lib/ingest/search-push.ts`（推送）、`src/app/[locale]/layout.tsx`（验证 meta）、`deploy/.env.production.example`（env 清单）。

## 两种 env 机制（别搞混）

| 机制 | 放哪 | 生效方式 | 涉及变量 |
|---|---|---|---|
| **runtime server env** | ECS `/var/www/f1frp/.env.production.local` | `pm2 reload ecosystem.config.cjs --update-env`，**无需 rebuild** | 站长验证 meta、推送 token、INDEXNOW_KEY |
| **build-time env**（`NEXT_PUBLIC_*`） | GitHub **Variable**（repo Settings → Secrets and variables → Variables） | 下次 `push main` → CI 构建时 inline | `NEXT_PUBLIC_ICP_BEIAN` |

> 陷阱：`NEXT_PUBLIC_ICP_BEIAN` 是 build 时 inline。CI 部署（push→main→`deploy-ecs.yml`）时只读 GitHub Variable；**仅在 ECS `.env` 里设对 CI 构建无效**。手动 `deploy.sh` 部署才读本地 `.env`。

## 0. ICP 备案号（build-time / GitHub Variable）—— 最先做

1. 确认备案号已下号（蜀ICP备XXXX号-1）。
2. GitHub repo → **Settings → Secrets and variables → Variables** → New variable：
   - Name：`NEXT_PUBLIC_ICP_BEIAN`
   - Value：`蜀ICP备XXXXXXXX号-1`
3. 下次 push main 后 footer 自动展示备案号（`src/components/layout/footer.tsx`）。

## 1. 百度搜索资源平台 `ziyuan.baidu.com`（验证 + 推送 + sitemap，全有）

- **验证**：用户中心 → 添加站点 `https://f1frp.com` → 验证方式选「HTML 标签」→ 复制 `<meta name="baidu-site-verification" content="XXXX">` 的 content → 填 `BAIDU_SITE_VERIFICATION=XXXX`
- **主动推送**：链接提交 → 主动推送（实时）→ 复制准入密钥（16 位 token）→ 填 `BAIDU_PUSH_TOKEN=XXXX`
- **sitemap**：链接提交 → sitemap → 提交 `https://f1frp.com/sitemap.xml`
- 价值最大：文心一言/百度AI搜索 直接吃百度索引。

## 2. 360 搜索站长 `zhanzhang.so.com`（验证 + 推送 + sitemap）

- **验证**：添加站点 → 「HTML 标签」→ 复制 content → 填 `SM_SITE_VERIFICATION=XXXX`
  （注意：渲染出的 meta 是 `360-site-verification`，但 env 变量名是 `SM_*`）
- **主动推送**：链接提交 → 复制 token → 填 `SM_PUSH_TOKEN=XXXX`（推到 `api.haosou.com`）
- **sitemap**：提交 `https://f1frp.com/sitemap.xml`
- 价值：360AI 搜索吃 360 索引。

## 3. 搜狗站长 `zhanzhang.sogou.com`（验证 + 推送 + sitemap）

- **验证**：添加站点 → meta 标签验证 → 复制 content → 填 `SOGOU_SITE_VERIFICATION=XXXX`
- **主动推送**：链接提交 → 复制 **user_id** 和 **token** → 填 `SOGOU_USER_ID=XXXX` + `SOGOU_PUSH_TOKEN=XXXX`（两个都要）
- **sitemap**：提交 `https://f1frp.com/sitemap.xml`
- 价值：腾讯元宝/混元 用 Sogou 索引。

## 4. 神马（UC/夸克移动搜索）站长 `zhanzhang.sm.cn`（仅验证 + sitemap，无推送 API）

- **验证**：添加站点 → meta 标签 → content → 填 `SHENMA_SITE_VERIFICATION=XXXX`
- **sitemap**：提交 `https://f1frp.com/sitemap.xml`
- 无独立推送 API（`search-push.ts` 里没有神马 push）；靠 sitemap + 抓取。
- 价值：夸克/UC 移动搜索 + 通义千问 移动端。

## 5. 字节/豆包（仅验证，靠 Bytespider 抓取）

- **验证**（若有字节站长平台）：拿 `bytedance-verification-code` 的 content → 填 `BYTEDANCE_VERIFICATION=XXXX`
- 无推送 API；豆包/今日头条搜索主要靠 `Bytespider` 抓取（robots.txt 已放行）。
- 价值：豆包 / 抖音搜索。

## 6. IndexNow（Bing / Yandex / Naver，一次提交多引擎）

- **生成 key**：`openssl rand -hex 16` → 填 `INDEXNOW_KEY=<32位hex>`
- **自检**：`curl https://f1frp.com/indexnow-key` 应返回该 key（`src/app/indexnow-key/route.ts` 读本 env）。现在未配 → 404，配后 → 200。
- 可选：到 `bing.com/indexnow` 手动提交一次加速首次发现。
- cron 每次 ingest 新 papers/patents/articles 会自动推。

## 7. Google（已有 HTML 文件验证；Indexing API 是 stub）

- 验证：`public/google4fd9359800160d16.html` 已在，meta 方式可选填 `GOOGLE_SITE_VERIFICATION`。
- 主动推送：`search-push.ts` 里 `pushGoogleIndexing` 是 stub（需服务账号 JWT，未实现）——靠 sitemap + 抓取即可，海外侧 getfrp.com 更需要，国内侧优先级低。

---

## 应用 runtime env（每填一批就可做一次）

```bash
# 在 ECS 上
ssh root@<ECS_IP>
cd /var/www/f1frp
# 编辑 .env.production.local，把上面 BAIDU_*/SOGOU_*/SM_*/SHENMA_*/BYTEDANCE_*/INDEXNOW_KEY 填进去
pm2 reload ecosystem.config.cjs --update-env
```

## 验证已生效

```bash
# 各验证 meta 是否出现在 HTML（runtime env 填了 + pm2 reload 后即应出现）
curl -sS https://f1frp.com/ | grep -ioE '(baidu|sogou|shenma|360|bytedance)-site-verification[^>]*content="[^"]*"'
# ICP 是否在 footer（需 push main 触发 CI rebuild 后）
curl -sS https://f1frp.com/ | grep -i ICP
# indexnow-key
curl -sS -o /dev/null -w '%{http_code}\n' https://f1frp.com/indexnow-key   # 配了 INDEXNOW_KEY 应 200
```

## 之后

- cron（systemd timer）每天 ingest 新内容时会自动把新 URL 推到已配 token 的引擎（百度/搜狗/360/IndexNow）。
- 各站长平台「索引量 / 抓取诊断」可看收录进度。
- 月度做一次「引用测试」：拿目标问句问 文心/豆包/Kimi/智谱/秘塔/夸克/360AI/天工，看是否引用 f1frp.com（见记忆 `project_f1frp_geo` 的测量闭环）。
