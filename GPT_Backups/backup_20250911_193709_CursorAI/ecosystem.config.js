module.exports = {
  apps: [
    {
      name: 'spark-web-next',
      script: 'pnpm',
      args: 'start',
      cwd: './apps/web-next',
      instances: 2,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3003,
        HOST: '0.0.0.0'
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3003,
        HOST: '0.0.0.0'
      },
      error_file: './logs/web-next-error.log',
      out_file: './logs/web-next-out.log',
      log_file: './logs/web-next-combined.log',
      time: true,
      max_memory_restart: '1G',
      watch: false,
      ignore_watch: ['node_modules', 'logs'],
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 10000
    },
    {
      name: 'spark-executor',
      script: 'pnpm',
      args: 'dev',
      cwd: './services/executor',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 4001,
        HOST: '0.0.0.0'
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 4001,
        HOST: '0.0.0.0'
      },
      error_file: './logs/executor-error.log',
      out_file: './logs/executor-out.log',
      log_file: './logs/executor-combined.log',
      time: true,
      max_memory_restart: '512M',
      watch: false,
      ignore_watch: ['node_modules', 'logs'],
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 10000
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