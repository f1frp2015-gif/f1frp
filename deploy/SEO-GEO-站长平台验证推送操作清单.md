# f1frp.com 各站长平台 验证 meta + 推送 token + sitemap 详细步骤（P0-1）

> 通用前提:每个平台都要先「添加网站 → 验证所有权」。验证方式统一选 **HTML 标签(meta)** —— 平台给一段 `<meta name="..." content="XXX">`,把 content 值填进对应 env,`layout.tsx` 自动输出该 meta;平台回抓页面看到 meta 即判已验证。
>
> **两种 env 机制**:
> - **build-time env**(`NEXT_PUBLIC_*`:ICP + 各站长验证 meta)→ GitHub **Variable**,`workflow_dispatch` 重建后生效。✅ ICP + 360 已上线。验证 env 名一律 `NEXT_PUBLIC_*` 前缀(见速查表);给值即设 GH Variable + 重建,无需 SSH。
> - **runtime env**(推送 token + INDEXNOW_KEY)→ 写 ECS `/var/www/f1frp/.env.production.local` → `pm2 reload ecosystem.config.cjs --update-env`,**无需 rebuild**。
>
> ⚠️ 下文各平台「验证 meta」步骤:env 名加 `NEXT_PUBLIC_` 前缀、设为 **GitHub Variable**(非 ECS .env);「推送 token」步骤仍是 runtime ECS .env。
>
> **正确顺序**:① 填 env + pm2 reload(让 meta 上线)→ ② 回平台点「完成验证」(平台回抓确认)→ ③ 验证通过后才能在该平台提交 sitemap + 用推送。

## 通用应用 + 自检

```bash
# 在 ECS 上(每填完一批跑一次)
ssh root@<ECS_IP>
cd /var/www/f1frp
nano .env.production.local        # 把下面各 env 填进去
pm2 reload ecosystem.config.cjs --update-env
```
```bash
# 自检(填完 + reload 后)
curl -sS https://f1frp.com/ | grep -ioE '(baidu|sogou|shenma|360|bytedance)-site-verification[^>]*content="[^"]*"'
curl -sS -o /dev/null -w '%{http_code}\n' https://f1frp.com/indexnow-key   # 配了 INDEXNOW_KEY 应 200
```

---

## 1. 百度搜索资源平台 `ziyuan.baidu.com`(价值最大:文心一言/百度AI 吃百度索引)

登录:百度账号。

**① 验证(meta)**
1. ziyuan.baidu.com → 用户中心 → 站点管理 → **添加网站** → 输入 `f1frp.com`
2. 验证方式选 **「HTML 标签」** → 平台显示 `<meta name="baidu-site-verification" content="XXXXXX" />` → 复制 `XXXXXX`
3. 填 `BAIDU_SITE_VERIFICATION=XXXXXX`(ECS .env)
4. 回平台点「完成验证」

**② 推送 token**
5. 左侧 **「普通收录 / 链接提交」→「主动推送(实时)」** → 平台显示接口调用地址:
   `http://data.zz.baidu.com/urls?site=f1frp.com&token=YYYYYYYYYYYYYYYY`
6. 复制 token(16 位 `YYYY...`)→ 填 `BAIDU_PUSH_TOKEN=YYYYYYYYYYYYYYYY`

**③ sitemap**
7. 「普通收录 / 链接提交」→ **「sitemap」** → 提交 `https://f1frp.com/sitemap.xml`

> 代码对照:`src/lib/ingest/baidu-push.ts` 用 `BAIDU_PUSH_TOKEN` 推到 `data.zz.baidu.com/urls`。

## 2. 360 搜索站长 `zhanzhang.so.com`(360AI 搜索)

登录:360 账号。

**① 验证(meta)**
1. zhanzhang.so.com → 我的网站 → **添加网站** → `f1frp.com`
2. 验证方式 **「HTML 标签验证」** → `<meta name="360-site-verification" content="XXXXXX" />` → 复制 content
3. 填 `SM_SITE_VERIFICATION=XXXXXX`(⚠️ meta 名是 `360-site-verification`,但 env 变量名是 `SM_*`)
4. 回平台点验证

**② 推送 token**
5. 「数据提交 / 链接提交」→ **「主动推送」** → 显示接口:
   `https://api.haosou.com/LinkSubmit/push?site=f1frp.com&token=YYYYYYYY`
6. 复制 token → 填 `SM_PUSH_TOKEN=YYYYYYYY`

**③ sitemap**
7. 「数据提交 / sitemap」→ 提交 `https://f1frp.com/sitemap.xml`

> 代码对照:`search-push.ts` 的 `push360` 用 `SM_PUSH_TOKEN` 推到 `api.haosou.com/LinkSubmit/push`。

## 3. 搜狗站长 `zhanzhang.sogou.com`(腾讯元宝/混元 用 Sogou 索引)

登录:搜狗 / QQ / 微信账号。

**① 验证(meta)**
1. zhanzhang.sogou.com → 用户中心 → 网站支持 → **添加网站** → `f1frp.com`
2. 验证 **「HTML 标签验证」** → `<meta name="sogou-site-verification" content="XXXXXX" />` → 复制 content
3. 填 `SOGOU_SITE_VERIFICATION=XXXXXX`
4. 回平台验证

**② 推送 token(两个值都要,缺一不可)**
5. 「链接提交 / URL 提交」→ 主动推送接口显示:
   `https://fankui.zhanzhang.sogou.com/linkSubmit/push?site=f1frp.com&user_id=UUUU&token=TTTT`
6. 复制 `user_id`(UUUU)→ 填 `SOGOU_USER_ID=UUUU`;复制 `token`(TTTT)→ 填 `SOGOU_PUSH_TOKEN=TTTT`

**③ sitemap**
7. 「网站支持 / sitemap」→ 提交 `https://f1frp.com/sitemap.xml`

> 代码对照:`search-push.ts` 的 `pushSogou` 同时要 `SOGOU_PUSH_TOKEN` + `SOGOU_USER_ID`。

## 4. 神马(UC/夸克)站长 `zhanzhang.sm.cn`(夸克/通义 移动端)

登录:UC / 淘宝 / 支付宝账号(神马属阿里)。

**① 验证(meta)**
1. zhanzhang.sm.cn → **添加网站** → `f1frp.com`
2. 验证 **「HTML 标签」** → `<meta name="shenma-site-verification" content="XXXXXX" />` → 复制 content
3. 填 `SHENMA_SITE_VERIFICATION=XXXXXX`
4. 回平台验证

**② 推送 token**:神马**无公开主动推送 API**(代码里也没神马 push),靠 sitemap + 抓取。

**③ sitemap**
5. 「sitemap 提交」→ 提交 `https://f1frp.com/sitemap.xml`

## 5. 字节/豆包(靠 Bytespider 抓取;优先级最低)

- 若有字节站长平台(如头条搜索站长):添加网站 → 验证「HTML 标签」→ `<meta name="bytedance-verification-code" content="XXXXXX" />` → 填 `BYTEDANCE_VERIFICATION=XXXXXX`
- **无推送 API**;豆包/今日头条/抖音搜索靠 `Bytespider` 抓取(robots.txt 已放行)。
- 这步可跳过——Bytespider 已能抓,验证 meta 仅锦上添花。

## 6. IndexNow(Bing / Yandex / Naver,一次推多引擎)

不是平台 UI,是协议:
1. 本地生成 key:`openssl rand -hex 16` → 得 32 位 hex 串
2. 填 `INDEXNOW_KEY=<32位hex>`(ECS .env + pm2 reload)
3. 自检:`curl https://f1frp.com/indexnow-key` → 应返回该 hex 串(`src/app/indexnow-key/route.ts` 读 env 返回明文)
4. cron 每次 ingest 新 papers/patents/articles 会自动把 URL 推到 IndexNow(Bing/Yandex 即收)
- 可选加速:Bing Webmaster Tools(`bing.com/webmaster`)→ 添加 f1frp.com → 验证 → 提交 sitemap + IndexNow key 一次性手推。

## 7. Google Search Console(海外/补充,国内侧优先级低)

- 已用 HTML 文件验证(`public/google4fd9359800160d16.html`)。
- GSC → **Sitemaps** → 提交 `https://f1frp.com/sitemap.xml`(在 f1frp.com 资源下)。
- 无需 push(`search-push.ts` 里 Google Indexing API 是 stub,靠 sitemap + 抓取)。

---

## env 速查表

| env 变量 | 来自平台 | 类型 |
|---|---|---|
| `NEXT_PUBLIC_ICP_BEIAN` | beian.miit.gov.cn | build-time ✅ |
| `NEXT_PUBLIC_BAIDU_SITE_VERIFICATION` | 百度 meta content | build-time |
| `NEXT_PUBLIC_SM_SITE_VERIFICATION` | 360 meta content(meta 名 360-site-verification) | build-time ✅ |
| `NEXT_PUBLIC_SOGOU_SITE_VERIFICATION` | 搜狗 meta content | build-time |
| `NEXT_PUBLIC_SHENMA_SITE_VERIFICATION` | 神马 meta content | build-time |
| `NEXT_PUBLIC_BYTEDANCE_VERIFICATION` | 字节 meta content(可选) | build-time |
| `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` | Google meta(已有 HTML 文件验证) | build-time |
| `BAIDU_PUSH_TOKEN` | 百度 主动推送 接口 token | runtime |
| `SM_PUSH_TOKEN` | 360 链接提交 token | runtime |
| `SOGOU_USER_ID` / `SOGOU_PUSH_TOKEN` | 搜狗 push URL user_id + token | runtime |
| `INDEXNOW_KEY` | `openssl rand -hex 16` 自生成 | runtime |

## 之后

- cron(systemd timer)每天 ingest 新内容时自动把新 URL 推到已配 token 的引擎(百度/搜狗/360/IndexNow)。
- 各站长平台「索引量 / 抓取诊断」看收录进度。
- 月度「引用测试」:拿目标问句问 文心/豆包/Kimi/智谱/秘塔/夸克/360AI/天工,看是否引用 f1frp.com。
- 公安备案(得号后):另加 env + footer 渲染(链 beian.mps.gov.cn)。
