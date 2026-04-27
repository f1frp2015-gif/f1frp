// PM2 配置 — 阿里云 ECS 部署 f1frp.com 国内侧
// 启动: pm2 start deploy/ecosystem.config.cjs
// 重启: pm2 reload f1frp
// 日志: pm2 logs f1frp
module.exports = {
  apps: [
    {
      name: "f1frp",
      script: "./.next/standalone/server.js",
      cwd: "/var/www/f1frp",
      instances: 1, // 2c4g 单实例够用，跑满后改成 "max" cluster mode
      exec_mode: "fork",
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "production",
        HOSTNAME: "0.0.0.0",
        PORT: 3000,
      },
      out_file: "/var/log/pm2/f1frp.out.log",
      error_file: "/var/log/pm2/f1frp.err.log",
      merge_logs: true,
      time: true,
    },
  ],
};
