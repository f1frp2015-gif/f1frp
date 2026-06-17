#!/bin/bash
# Weekly composite raw-material price digest for f1frp.com.
# Runs the f1frp-price-digest skill headless and writes ONE weekly price report
# DRAFT into the admin 价格行情 (草稿状态, never auto-published). Scheduled by
# launchd (com.f1frp.price-digest) for Monday 06:30; a Monday guard makes manual
# runs safe. Pass "force" to run regardless of weekday.
#
# Manual run:  bash scripts/price-digest-cron.sh force
set -uo pipefail

REPO="/Users/ori/Projects/f1frp"
CLAUDE="/Users/ori/.local/bin/claude"
LOG="$HOME/Library/Logs/f1frp-price-digest.log"
mkdir -p "$(dirname "$LOG")"

DOW=$(date +%u) # 1 = Monday
if [ "${1:-}" != "force" ] && [ "$DOW" != "1" ]; then
  echo "$(date '+%F %T') not Monday ($DOW) — skip" >> "$LOG"
  exit 0
fi

cd "$REPO" || { echo "$(date '+%F %T') repo not found" >> "$LOG"; exit 1; }

PROMPT="使用 f1frp-price-digest 技能，生成本周（$(date +%F)）复材原材料价格行情：先读 scripts/price-context.ts 的上期基线，再全网核实权威来源真实价格（生意社/卓创/隆众/百川盈孚/玻纤协会/碳纤维资讯/上市公司公告），覆盖玻纤/树脂/碳纤/拉挤成品，算周环比，写市场综述，存入后台价格行情草稿（draft，绝不发布）。完成后报告后台链接与已核实来源。"

echo "=== $(date '+%F %T') Monday — running price digest ===" >> "$LOG"
# Scoped allowlist (NOT a blanket bypass): only the tools the skill needs. In -p
# mode non-allowlisted tools are auto-denied, so the run can't hang or escape the
# set. It only ever writes a DRAFT (never publishes); a human reviews before publish.
"$CLAUDE" -p "$PROMPT" \
  --model opus \
  --allowedTools "WebSearch" "WebFetch" "Read" "Write" "Edit" "Skill" "Bash(cd:*)" "Bash(pnpm:*)" \
  >> "$LOG" 2>&1
echo "=== $(date '+%F %T') done (exit $?) ===" >> "$LOG"
