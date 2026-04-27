#!/usr/bin/env bash
# 本地打包 standalone 产物 — 然后 scp 到 ECS
# 使用: ./deploy/build-standalone.sh [target-dir]
# 默认输出到 ./deploy/dist/

set -euo pipefail

TARGET="${1:-./deploy/dist}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

cd "$ROOT"

echo "==> Building Next.js standalone (BUILD_TARGET=ecs)…"
BUILD_TARGET=ecs pnpm build

echo "==> Assembling deploy bundle at $TARGET…"
rm -rf "$TARGET"
mkdir -p "$TARGET"

# Next.js standalone 不会自动复制 public 和 .next/static，要手动放进去
cp -r .next/standalone/. "$TARGET/"
mkdir -p "$TARGET/.next"
cp -r .next/static "$TARGET/.next/static"
cp -r public "$TARGET/public"

# 部署元数据
cp deploy/ecosystem.config.cjs "$TARGET/ecosystem.config.cjs"

echo "==> Bundle size:"
du -sh "$TARGET"

echo "==> Done. Push to ECS with:"
echo "    rsync -avz --delete $TARGET/ user@<ECS_IP>:/var/www/f1frp/"
