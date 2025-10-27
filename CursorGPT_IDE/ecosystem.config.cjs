module.exports = {
  apps: [
    {
      name: 'executor-lite',
      cwd: 'C:/dev/CursorGPT_IDE/CursorGPT_IDE/services/executor-lite',
      script: 'dist/server.js',
      interpreter: 'node',
      args: '--enable-source-maps',
      env: {
        NODE_ENV: 'production',
        PORT: '4010',
        HOST: '127.0.0.1',
        ADMIN_TOKEN: 'test-secret-123'
      },
      watch: false,
      autorestart: true,
      max_restarts: 10,
      error_file: '../../logs/executor-lite-error.log',
      out_file: '../../logs/executor-lite-out.log',
      log_file: '../../logs/executor-lite-combined.log',
      time: true,
      max_memory_restart: '512M',
      kill_timeout: 5000
    },
    {
      name: 'spark-web',
      cwd: 'C:/dev/CursorGPT_IDE/CursorGPT_IDE/apps/web-next',
      script: './node_modules/next/dist/bin/next',
      args: 'start -p 3003 -H 127.0.0.1',
      interpreter: 'node',
      env: {
        NODE_ENV: 'production',
        PORT: '3003',
        HOST: '127.0.0.1',
        EXECUTOR_URL: 'http://127.0.0.1:4010',
        BACKTEST_MODE: 'executor',
        ADMIN_TOKEN: 'test-secret-123',
        NEXT_PUBLIC_ADMIN_ENABLED: 'true'
      },
      watch: false,
      autorestart: true,
      max_restarts: 10,
      error_file: './logs/web-next-error.log',
      out_file: './logs/web-next-out.log',
      log_file: './logs/web-next-combined.log',
      time: true,
      max_memory_restart: '1G',
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 10000,
      health_check: {
        url: 'http://127.0.0.1:3003/api/public/healthz',
        interval: 30000,
        timeout: 5000,
        retries: 3
      }
    },
    {
      name: 'spark-executor',
      cwd: 'C:/dev/CursorGPT_IDE/CursorGPT_IDE',
      script: 'services/executor/dist/server.js',
      interpreter: 'node',
      env: {
        NODE_ENV: 'production',
        HOST: '0.0.0.0',
        PORT: '4001',
        METRICS_ENABLED: 'true',
        FUSION_GATE_ENABLE: '1',
        FUSION_GATE_MODE: 'shadow',          // shadow | enforce
        FUSION_PAUSE_MINUTES: '15',
        FUSION_LIMIT_RPS: '0.5',
        // GC jitter azaltma / heap dengeleme
        NODE_OPTIONS: '--max-old-space-size=1536 --heapsnapshot-near-heap-limit=1',
        // I/O concurrency ve DNS caching için iyi defaults
        UV_THREADPOOL_SIZE: '8'
      },
      watch: false,
      autorestart: true,
      max_restarts: 10,
      error_file: './logs/executor-error.log',
      out_file: './logs/executor-out.log',
      log_file: './logs/executor-combined.log',
      time: true,
      max_memory_restart: '1536M',
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 10000,
      health_check: {
        url: 'http://127.0.0.1:4001/__ping',
        interval: 30000,
        timeout: 5000,
        retries: 3
      }
    }
  ],

  deploy: {
    production: {
      user: 'spark',
      host: 'localhost',
      ref: 'origin/main',
      repo: 'git@github.com:your-org/spark-trading.git',
      path: '/var/www/spark-trading',
      'pre-deploy-local': '',
      'post-deploy': 'npm install && pm2 reload ecosystem.config.js --env production',
      'pre-setup': ''
    }
  }
}; 