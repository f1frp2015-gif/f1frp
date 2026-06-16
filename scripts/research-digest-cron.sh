#!/bin/bash
# Odd-day deep-research digest for f1frp.com.
# Runs the f1frp-research-digest skill headless and drops ONE draft into the
# admin 草稿箱 (草稿状态, never auto-published). Triggered daily by launchd
# (com.f1frp.research-digest) and exits on even days, so it effectively fires
# on odd days of the month (1,3,5,...,31). Pass "force" to run regardless of day.
#
# Manual run:  bash scripts/research-digest-cron.sh force
set -uo pipefail

REPO="/Users/ori/Projects/f1frp"
CLAUDE="/Users/ori/.local/bin/claude"
LOG="$HOME/Library/Logs/f1frp-research-digest.log"
mkdir -p "$(dirname "$LOG")"

DAY=$(date +%e | tr -d ' ')
if [ "${1:-}" != "force" ] && [ $(( DAY % 2 )) -ne 1 ]; then
  echo "$(date '+%F %T') even day ($DAY) — skip" >> "$LOG"
  exit 0
fi

cd "$REPO" || { echo "$(date '+%F %T') repo not found" >> "$LOG"; exit 1; }

PROMPT="使用 f1frp-research-digest 技能，生成今天（$(date +%F)）的一篇深度行业研究资讯：选一个与已有文章不重复的主题，全网核实真实信息（复材网站/论文/专利/产品/应用/市场），写成专业学术范、数据翔实、证据有力、anti-ai 行文的中文长稿，存入超级管理员后台草稿箱（草稿状态，绝不发布）。完成后报告草稿后台链接。"

echo "=== $(date '+%F %T') odd day ($DAY) — running digest ===" >> "$LOG"
# Scoped allowlist (NOT a blanket permission bypass): only the tools the skill
# needs. In -p mode any non-allowlisted tool is auto-denied (not prompted), so
# the run can't hang and can't do anything outside this set. It only ever
# creates a DRAFT (never publishes), and a human reviews before publishing.
"$CLAUDE" -p "$PROMPT" \
  --model opus \
  --allowedTools "WebSearch" "WebFetch" "Read" "Write" "Edit" "Skill" "Bash(cd:*)" "Bash(pnpm:*)" \
  >> "$LOG" 2>&1
echo "=== $(date '+%F %T') done (exit $?) ===" >> "$LOG"
