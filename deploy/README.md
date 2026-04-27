# f1frp 双轨部署 (Vercel + 阿里云 ECS)

## 部署侧分工

| 域名 | 部署 | 默认语言 | AI |
|---|---|---|---|
| **f1frp.com** | 阿里云 ECS (杭州) | zh | DeepSeek + Google embedding via Gateway |
| **getfrp.com** | Vercel | en | Anthropic + Google 直连 |

详见 `~/CLAUDE.md` §9。

---

## 海外侧 (Vercel / getfrp.com)

Vercel 自动从 GitHub main 部署。环境变量在 Vercel Dashboard 配：

```
AI_PROFILE=global
NEXT_PUBLIC_DEFAULT_LOCALE=en
GOOGLE_GENERATIVE_AI_API_KEY=...
DATABASE_URL=...
CLERK_*=...
```

---

## 国内侧 (阿里云 ECS / f1frp.com)

### 一次性 ECS 初始化

ssh 到 ECS 后:

```bash
# Node 20 + pnpm + PM2 + Nginx
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs nginx
sudo npm i -g pnpm pm2

# 应用目录
sudo mkdir -p /var/www/f1frp /var/log/pm2
sudo chown -R $USER:$USER /var/www/f1frp /var/log/pm2

# Nginx 配置
sudo cp deploy/nginx.conf /etc/nginx/conf.d/f1frp.conf
sudo nginx -t && sudo systemctl reload nginx

# PM2 开机自启
pm2 startup  # 按提示执行返回的 sudo 命令
```

### 环境变量 (ECS 上)

在 `/var/www/f1frp/.env.production.local` 写：

```
AI_PROFILE=domestic
NEXT_PUBLIC_DEFAULT_LOCALE=zh
NODE_ENV=production
HOSTNAME=0.0.0.0
PORT=3000

# DB / Auth (与 Vercel 共用)
DATABASE_URL=...
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=...
CLERK_SECRET_KEY=...

# AI - 国内必填
DEEPSEEK_API_KEY=sk-...
GOOGLE_AI_GATEWAY_URL=https://gateway.ai.cloudflare.com/v1/<account>/<gateway>/google-ai-studio/v1beta
# (或自建 Vercel AI Gateway)
```

### 一键部署 (本地 → ECS)

```bash
ECS_HOST=root@<ECS_PUBLIC_IP> ./deploy/deploy.sh
```

脚本流程:
1. `BUILD_TARGET=ecs pnpm build` — 生成 `.next/standalone`
2. 拼装 bundle (含 public + .next/static)
3. rsync 到 `/var/www/f1frp/`
4. `pm2 reload` 重启

### ICP 备案进行中怎么办

备案下号前 **不能绑域名走 80/443**。临时验证:

```bash
# ECS 上改 nginx.conf 临时监听 8080，server_name _
# 阿里云安全组放开 8080
# 浏览器访问 http://<ECS_IP>:8080
```

备案下号后:
1. 上传 SSL 证书到 `/etc/nginx/ssl/`
2. 取消注释 `nginx.conf` 里的 HTTPS 块
3. DNS f1frp.com A 记录指 ECS 公网 IP
4. `sudo nginx -t && sudo systemctl reload nginx`

### 运维速查

```bash
pm2 logs f1frp --lines 100        # 看日志
pm2 reload f1frp                  # 零停机重启
pm2 monit                         # 实时监控
sudo nginx -t && sudo systemctl reload nginx   # Nginx 改完后
```
