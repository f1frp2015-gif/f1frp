#!/usr/bin/env bash
# 本地打包 standalone 产物 — 然后 scp 到 ECS
# 使用: ./deploy/build-standalone.sh [target-dir]
# 默认输出到 ./deploy/dist/

set -euo pipefail

TARGET="${1:-./deploy/dist}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

cd "$ROOT"

# ─── Build-time env（NEXT_PUBLIC_* 在 build 时被 inline，必须在此设置）───
export BUILD_TARGET=ecs
export AI_PROFILE="${AI_PROFILE:-domestic}"
export CHAT_PROVIDER="${CHAT_PROVIDER:-openrouter}"
export NEXT_PUBLIC_LOCALES="${NEXT_PUBLIC_LOCALES:-zh}"
export NEXT_PUBLIC_DEFAULT_LOCALE="${NEXT_PUBLIC_DEFAULT_LOCALE:-zh}"
export NEXT_PUBLIC_SITE_URL="${NEXT_PUBLIC_SITE_URL:-https://f1frp.com}"
# ICP 备案号：不在此处设默认空值，以免 Next.js env loader 因 process.env 已存在而跳过 .env.production.local。
# 若需覆盖，请在调用脚本前 `export NEXT_PUBLIC_ICP_BEIAN=...`，或写入 .env.production.local。

echo "==> Build env:"
echo "    BUILD_TARGET=$BUILD_TARGET"
echo "    AI_PROFILE=$AI_PROFILE"
echo "    CHAT_PROVIDER=$CHAT_PROVIDER"
echo "    NEXT_PUBLIC_LOCALES=$NEXT_PUBLIC_LOCALES"
echo "    NEXT_PUBLIC_DEFAULT_LOCALE=$NEXT_PUBLIC_DEFAULT_LOCALE"
echo "    NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL"
echo "    NEXT_PUBLIC_ICP_BEIAN=${NEXT_PUBLIC_ICP_BEIAN:-<from .env.production.local at build time>}"

echo "==> Building Next.js standalone..."
pnpm build

echo "==> Assembling deploy bundle at $TARGET..."
rm -rf "$TARGET"
mkdir -p "$TARGET"

# Next.js 16 + pnpm 的 standalone tracing 偶尔会指向不存在的依赖目录（broken symlink），
# 主要是 transitive dep 版本误判。先扫掉 broken symlink 防止 cp 中断。
# 运行时若真用到这些包，需要在 next.config.ts 的 outputFileTracingIncludes 里补回。
broken_count=$(find .next/standalone -xtype l 2>/dev/null | wc -l | tr -d ' ')
if [[ "$broken_count" != "0" ]]; then
  echo "    清理 $broken_count 个 broken symlinks"
  find .next/standalone -xtype l -delete
fi

# 用 rsync -a 比 cp -r 处理 symlink 更稳健
rsync -a .next/standalone/ "$TARGET/"
mkdir -p "$TARGET/.next"
rsync -a .next/static/ "$TARGET/.next/static/"
rsync -a public/ "$TARGET/public/"

# 部署元数据 / Nginx / systemd / env 模板
cp deploy/ecosystem.config.cjs "$TARGET/ecosystem.config.cjs"
cp deploy/nginx.conf "$TARGET/nginx.conf"
cp deploy/.env.production.example "$TARGET/.env.production.example"
mkdir -p "$TARGET/deploy"
cp -r deploy/systemd "$TARGET/deploy/systemd"
cp deploy/README.md "$TARGET/deploy/README.md"

echo "==> Bundle size:"
du -sh "$TARGET"

echo "==> Done. Push to ECS with:"
echo "    rsync -avz --delete $TARGET/ user@<ECS_IP>:/var/www/f1frp/"
