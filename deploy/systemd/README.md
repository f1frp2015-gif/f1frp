# f1frp ECS 端 cron（systemd timer）

替代 `vercel.json` 的 cron — Vercel cron 只在 Vercel 侧触发，国内 ECS 上不会跑。

## 单元清单

| Service | Timer (Asia/Shanghai) | 等价 vercel.json (UTC) |
|---|---|---|
| `f1frp-cron-ingest-daily` | 每天 10:00 | `0 2 * * *` |
| `f1frp-cron-rss-news`     | 每天 14:00 | `0 6 * * *` |
| `f1frp-cron-newsletter`   | 每周五 09:00 | `0 1 * * 5` |

所有 service 通过 `EnvironmentFile=/var/www/f1frp/.env.production.local` 读取 `CRON_SECRET`，`curl -H "Authorization: Bearer $CRON_SECRET"` 调本机 `:3000/api/cron/...`。

## 部署（在 ECS 上执行）

```bash
# 1. 复制单元到 systemd 目录
sudo cp /var/www/f1frp/deploy/systemd/f1frp-cron-*.{service,timer} /etc/systemd/system/

# 2. 重载 + 启用 + 立即启动 timers
sudo systemctl daemon-reload
sudo systemctl enable --now f1frp-cron-ingest-daily.timer
sudo systemctl enable --now f1frp-cron-rss-news.timer
sudo systemctl enable --now f1frp-cron-newsletter.timer

# 3. 检查
systemctl list-timers --all | grep f1frp
```

## 手动跑一次（测试）

```bash
sudo systemctl start f1frp-cron-rss-news.service
journalctl -u f1frp-cron-rss-news.service -n 100 --no-pager
```

或直接 curl 绕过 systemd：

```bash
source /var/www/f1frp/.env.production.local
curl -i -H "Authorization: Bearer $CRON_SECRET" http://127.0.0.1:3000/api/cron/rss-news
```

## 注意

- `OnCalendar` 用 `Asia/Shanghai` 时区后缀（systemd 250+ 支持）。如果系统 systemd 版本太老报错，去掉时区后缀改用本地时间触发（Alibaba Cloud Linux 默认 Asia/Shanghai 不变）。
- `EnvironmentFile` 解析的是简单 `KEY=VALUE` 格式，**不能有 `export`、不能有 shell 引号转义**。我们的 `.env.production.example` 已经按此格式生成，照搬即可。
- `Persistent=true` 表示 ECS 重启 / 错过触发时间时，下次启动会补跑一次。
- 排查日志：`journalctl -u f1frp-cron-<name>.service -n 200 --no-pager`
