/**
 * PM2 Ecosystem Configuration
 * For running Spark TA Module outside Docker
 * 
 * Usage:
 *   pm2 start ecosystem.config.js
 *   pm2 logs
 *   pm2 monit
 *   pm2 stop all
 */

module.exports = {
  apps: [
    {
      name: 'spark-executor-1',
      script: './services/executor/dist/server.js',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 4001,
        HOST: '0.0.0.0',
        REDIS_URL: 'redis://localhost:6379',
        SCHEDULER_ENABLED: 'true',
        SCHEDULER_INTERVAL_SEC: '30',
        SCHEDULER_LEASE_SEC: '35',
        ALERT_COOLDOWN_SEC: '600',
        ALERT_EVAL_CONCURRENCY: '5',
        TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN,
        TELEGRAM_CHAT_ID: process.env.TELEGRAM_CHAT_ID,
        NOTIFY_RATE_LIMIT: '10',
        NOTIFY_ALLOWED_HOSTS: 'hooks.slack.com,discord.com',
      },
      min_uptime: 5000,
      max_restarts: 10,
      restart_delay: 2000,
      max_memory_restart: '300M',
      error_file: './logs/executor-1-error.log',
      out_file: './logs/executor-1-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      watch: false,
    },
    {
      name: 'spark-executor-2',
      script: './services/executor/dist/server.js',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 4002,
        HOST: '0.0.0.0',
        REDIS_URL: 'redis://localhost:6379',
        SCHEDULER_ENABLED: 'true',
        SCHEDULER_INTERVAL_SEC: '30',
        SCHEDULER_LEASE_SEC: '35',
        ALERT_COOLDOWN_SEC: '600',
        ALERT_EVAL_CONCURRENCY: '5',
        TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN,
        TELEGRAM_CHAT_ID: process.env.TELEGRAM_CHAT_ID,
        NOTIFY_RATE_LIMIT: '10',
        NOTIFY_ALLOWED_HOSTS: 'hooks.slack.com,discord.com',
      },
      min_uptime: 5000,
      max_restarts: 10,
      restart_delay: 2000,
      max_memory_restart: '300M',
      error_file: './logs/executor-2-error.log',
      out_file: './logs/executor-2-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      watch: false,
    },
    {
      name: 'spark-web-next',
      script: 'node_modules/next/dist/bin/next',
      args: 'start -p 3003',
      cwd: './apps/web-next',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3003,
        EXECUTOR_URL: 'http://localhost:4001',
        NEXT_TELEMETRY_DISABLED: '1',
      },
      min_uptime: 5000,
      max_restarts: 10,
      restart_delay: 2000,
      max_memory_restart: '600M',
      error_file: './logs/web-next-error.log',
      out_file: './logs/web-next-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      watch: false,
    },
    {
      name: 'spark-marketdata',
      script: './services/marketdata/dist/server.js',
      env: {
        PORT: 5001,
        HOST: '0.0.0.0'
      },
      instances: 1,
      exec_mode: 'fork',
      min_uptime: 5000,
      max_restarts: 10,
      restart_delay: 2000,
      max_memory_restart: '300M',
      error_file: './logs/marketdata-error.log',
      out_file: './logs/marketdata-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      watch: false,
    },
  ],

  deploy: {
    production: {
      user: 'spark',
      host: 'your-production-server.com',
      ref: 'origin/main',
      repo: 'git@github.com:your-org/spark-trading-platform.git',
      path: '/var/www/spark-ta',
      'pre-deploy-local': '',
      'post-deploy': 'pnpm install && pnpm build && pm2 reload ecosystem.config.js --env production',
      'pre-setup': '',
    },
  },
};

