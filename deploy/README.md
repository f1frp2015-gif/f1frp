# f1frp 双轨部署 (Vercel + 阿里云 ECS)

## 部署侧分工（2026-04-30 实际）

| 域名 | 部署 | 默认语言 | AI provider |
|---|---|---|---|
| **f1frp.com** | 阿里云 ECS（华东 1 杭州，120.26.111.236） | zh | OpenRouter（首选）/ DeepSeek（兜底） |
| **getfrp.com** | Vercel | en | Anthropic + Google 直连 |

详见 `~/CLAUDE.md` §9。

---

## 海外侧（Vercel / getfrp.com）

Vercel 自动从 GitHub main 部署。在 Vercel Dashboard 配 env：

```
AI_PROFILE=global
CHAT_PROVIDER=openrouter            # 或 google 直连
NEXT_PUBLIC_LOCALES=en
NEXT_PUBLIC_DEFAULT_LOCALE=en
NEXT_PUBLIC_SITE_URL=https://getfrp.com
OPENROUTER_API_KEY=sk-or-v1-...
GOOGLE_GENERATIVE_AI_API_KEY=...
DATABASE_URL=...
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=...
CLERK_SECRET_KEY=...
CRON_SECRET=...
```

Vercel cron（vercel.json）只在海外侧生效。

---

## 国内侧（阿里云 ECS / f1frp.com / 120.26.111.236）

> ECS 规格：`ecs.e-c1m1.large`（2 vCPU / 2 GB / 3 Mbps / Alibaba Cloud Linux 3.2104 LTS）  
> 关键约束：内存小（必加 swap）；带宽小（静态资源未来必走 OSS+CDN）

### 1. 一次性 ECS 初始化（在 ECS 上执行）

Alibaba Cloud Linux 3 是 RHEL 系，包管理用 `dnf`。

```bash
# Node 20（NodeSource RPM 仓库）
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo dnf install -y nodejs nginx git rsync

# pnpm + PM2 全局
sudo npm i -g pnpm pm2

# 应用目录
sudo mkdir -p /var/www/f1frp /var/log/pm2
sudo chown -R $USER:$USER /var/www/f1frp /var/log/pm2

# Nginx 启动
sudo systemctl enable --now nginx

# PM2 开机自启（按提示执行返回的 sudo 命令）
pm2 startup
```

### 2. 加 4 GB swap（2 GB 内存太小，防 OOM）

```bash
sudo fallocate -l 4G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
free -h   # 验证
```

### 3. 阿里云安全组放行

控制台 → ECS → 安全组 → 入方向放行：
- TCP 22（SSH）
- TCP 80（HTTP）
- TCP 443（HTTPS）

> 备案前用 80 走 IP 也可以临时测试，但不要绑域名。

### 4. Nginx 配置

```bash
# 把 nginx.conf 拷到 ECS
sudo cp /var/www/f1frp/nginx.conf /etc/nginx/conf.d/f1frp.conf
sudo nginx -t
sudo systemctl reload nginx
```

### 5. 环境变量

在 `/var/www/f1frp/.env.production.local` 写入（参考同目录 `.env.production.example`）：

```
AI_PROFILE=domestic
CHAT_PROVIDER=openrouter
NEXT_PUBLIC_LOCALES=zh
NEXT_PUBLIC_DEFAULT_LOCALE=zh
NEXT_PUBLIC_SITE_URL=https://f1frp.com
NEXT_PUBLIC_ICP_BEIAN=蜀 ICP 备 xxxxxxxx 号
NODE_ENV=production
HOSTNAME=0.0.0.0
PORT=3000

# DB / Auth（与 Vercel 共用 Neon + Clerk）
DATABASE_URL=...
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=...
CLERK_SECRET_KEY=...

# AI - 国内必填
OPENROUTER_API_KEY=sk-or-v1-...
DEEPSEEK_API_KEY=sk-...                 # 兜底
GOOGLE_AI_GATEWAY_URL=https://...       # embedding 必走的代理

# Cron 自调用（systemd timer 用）
CRON_SECRET=<openssl rand -hex 32>

# 站长平台验证（可选）
BAIDU_SITE_VERIFICATION=...
SOGOU_SITE_VERIFICATION=...
```

### 6. 一键部署（在本机 Mac mini 执行）

```bash
cd ~/Projects/f1frp
ECS_HOST=root@120.26.111.236 ./deploy/deploy.sh
```

脚本流程：
1. `BUILD_TARGET=ecs pnpm build` — 在**本机**跑（ECS 2GB 内存装不下 build）
2. 拼装 bundle（standalone + public + .next/static）
3. rsync → `/var/www/f1frp/`
4. ssh `pm2 reload ecosystem.config.cjs --update-env`

> 第一次运行前先在 ECS 上 `pm2 start /var/www/f1frp/ecosystem.config.cjs`。

### 7. ECS 端 cron（替代 vercel.json 的 cron）

vercel.json 的 cron **只在 Vercel 侧触发**，ECS 不会跑。在 ECS 上启用 systemd timer：

```bash
sudo cp /var/www/f1frp/deploy/systemd/f1frp-cron-*.{service,timer} /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now f1frp-cron-ingest-daily.timer
sudo systemctl enable --now f1frp-cron-rss-news.timer
sudo systemctl enable --now f1frp-cron-newsletter.timer
sudo systemctl list-timers | grep f1frp
```

每个 timer 会用 `Authorization: Bearer $CRON_SECRET` 调本机 `/api/cron/...`。

### 8. ICP 备案后切 SSL + DNS

1. 阿里云控制台申请 f1frp.com 免费 SSL，下载 Nginx 格式
2. 上传到 `/etc/nginx/ssl/f1frp.com.{pem,key}`
3. 编辑 `/etc/nginx/conf.d/f1frp.conf`，取消 HTTPS 块注释 + HTTP→HTTPS 跳转
4. `sudo nginx -t && sudo systemctl reload nginx`
5. DNS：f1frp.com / www.f1frp.com A 记录 → `120.26.111.236`
6. 工信部备案号填到 `NEXT_PUBLIC_ICP_BEIAN`，重新部署生效

### 9. 静态资源走 CDN（带宽 3 Mbps 撑不住直出，**Phase 2 必做**）

短期：Nginx 强缓存（已配 `_next/static` 365d immutable）  
中期：阿里云 OSS + CDN，把 `/_next/static/` 和 `/public/` 镜像过去；在 `next.config.ts` 设 `assetPrefix`

---

## 运维速查

```bash
pm2 logs f1frp --lines 100        # 看日志
pm2 reload f1frp                  # 零停机重启
pm2 monit                         # 实时监控
sudo nginx -t && sudo systemctl reload nginx   # Nginx 改完后

# Cron 单跑测试
curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/rss-news

# 看 systemd timer 状态
systemctl list-timers --all | grep f1frp
journalctl -u f1frp-cron-rss-news.service -n 50
```

## 回滚

Vercel 项目暂不归档，f1frp.com DNS 切回 Vercel 即可立即回滚。
