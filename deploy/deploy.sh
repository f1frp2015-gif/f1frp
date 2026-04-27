#!/usr/bin/env bash
# 本地一键部署到 ECS — build → rsync → restart
# 使用: ECS_HOST=user@1.2.3.4 ./deploy/deploy.sh

set -euo pipefail

if [[ -z "${ECS_HOST:-}" ]]; then
  echo "ERROR: ECS_HOST not set. Example:"
  echo "  ECS_HOST=root@1.2.3.4 $0"
  exit 1
fi

ECS_PATH="${ECS_PATH:-/var/www/f1frp}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

cd "$ROOT"

# 1. 本地打包
./deploy/build-standalone.sh

# 2. 同步到 ECS
echo "==> rsync → $ECS_HOST:$ECS_PATH …"
rsync -avz --delete \
  --exclude=".env*" \
  ./deploy/dist/ \
  "$ECS_HOST:$ECS_PATH/"

# 3. 远程重启 PM2
echo "==> Restarting PM2 on remote …"
ssh "$ECS_HOST" "cd $ECS_PATH && pm2 reload ecosystem.config.cjs --update-env || pm2 start ecosystem.config.cjs"

echo "==> Deploy complete."
echo "   Logs: ssh $ECS_HOST 'pm2 logs f1frp --lines 50'"
