#!/usr/bin/env bash
# ECS 一次性初始化脚本（Alibaba Cloud Linux 3.2104 LTS）
#
# 用法：
#   1. 在阿里云 Workbench 远程连接 ECS（root 登录）
#   2. 把整个文件内容粘贴到终端，回车运行
#   3. 全部成功后再跑首次部署（在 Mac mini 本机：ECS_HOST=root@120.26.111.236 ./deploy/deploy.sh）
#
# 这个脚本是幂等的（重复跑也安全）。

set -euo pipefail

echo "========================================"
echo "  f1frp ECS 初始化"
echo "  地域：华东 1（杭州） / IP：120.26.111.236"
echo "========================================"

# ─── 1. Node 20 + Nginx + Git + rsync ───────────────────────────
if ! command -v node >/dev/null 2>&1 || ! node -v | grep -q '^v20\.'; then
  echo "==> [1/7] 安装 Node.js 20..."
  curl -fsSL https://rpm.nodesource.com/setup_20.x | bash -
  dnf install -y nodejs
else
  echo "==> [1/7] Node.js 20 已装：$(node -v)"
fi

echo "==> [2/7] 安装 Nginx / git / rsync / curl..."
dnf install -y nginx git rsync curl

# ─── 3. pnpm + PM2 全局 ───────────────────────────
if ! command -v pnpm >/dev/null 2>&1; then
  echo "==> [3/7] 安装 pnpm + PM2..."
  npm i -g pnpm pm2
else
  echo "==> [3/7] pnpm 已装：$(pnpm -v)"
  command -v pm2 >/dev/null || npm i -g pm2
fi

# ─── 4. 应用目录 ───────────────────────────
echo "==> [4/7] 创建应用目录..."
mkdir -p /var/www/f1frp /var/log/pm2 /etc/nginx/ssl
chown -R root:root /var/www/f1frp /var/log/pm2

# ─── 5. 4GB swap（2GB 内存太小，防 OOM）───────────────────────────
if [[ ! -f /swapfile ]]; then
  echo "==> [5/7] 创建 4GB swap..."
  fallocate -l 4G /swapfile
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  if ! grep -q '^/swapfile' /etc/fstab; then
    echo '/swapfile none swap sw 0 0' >> /etc/fstab
  fi
else
  echo "==> [5/7] swap 已存在"
fi
free -h

# ─── 6. 启动 Nginx + PM2 开机自启 ───────────────────────────
echo "==> [6/7] 启动 Nginx + PM2 开机自启..."
systemctl enable --now nginx
pm2 startup systemd -u root --hp /root | tail -1 | bash || true

# ─── 7. 防火墙（如果 firewalld 在跑）+ 提示安全组 ───────────────────────────
echo "==> [7/7] 检查 firewalld..."
if systemctl is-active --quiet firewalld 2>/dev/null; then
  firewall-cmd --permanent --add-service=http
  firewall-cmd --permanent --add-service=https
  firewall-cmd --reload
  echo "    firewalld 已放行 80/443"
else
  echo "    firewalld 未启用，跳过"
fi

cat <<'EOF'

========================================
  ✅ ECS 初始化完成
========================================

下一步（在阿里云控制台）：
  ECS → 安全组 → 配置规则 → 入方向放行 TCP 22/80/443

下一步（在 Mac mini 本机）：
  cd ~/Projects/f1frp
  ECS_HOST=root@120.26.111.236 ./deploy/deploy.sh

部署完成后（在 ECS 上）：
  # 1. 首次启动 PM2
  pm2 start /var/www/f1frp/ecosystem.config.cjs
  pm2 save

  # 2. 复制环境变量模板，填实际值
  cp /var/www/f1frp/.env.production.example /var/www/f1frp/.env.production.local
  vi /var/www/f1frp/.env.production.local
  pm2 reload f1frp

  # 3. 配 Nginx
  cp /var/www/f1frp/nginx.conf /etc/nginx/conf.d/f1frp.conf
  nginx -t && systemctl reload nginx

  # 4. 启用 cron timers
  cp /var/www/f1frp/deploy/systemd/f1frp-cron-*.{service,timer} /etc/systemd/system/
  systemctl daemon-reload
  for t in ingest-daily rss-news newsletter; do
    systemctl enable --now "f1frp-cron-${t}.timer"
  done
  systemctl list-timers | grep f1frp

  # 5. 验证
  curl -I http://127.0.0.1:3000   # PM2 起来后应该返回 200
  curl -I http://120.26.111.236    # Nginx 反代应该返回 200

EOF
