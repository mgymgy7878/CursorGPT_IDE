module.exports = {
  apps: [
    {
      name: 'web-next',
      cwd: 'apps/web-next',
      script: 'node_modules/next/dist/bin/next',
      args: 'start -p 3003',
      node_args: '--trace-uncaught --trace-warnings',
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: '3003',
        EXECUTOR_ORIGIN: 'http://127.0.0.1:4001'
      },
      out_file: '../../evidence/local/ui/pm2.web.out.log',
      error_file: '../../evidence/local/ui/pm2.web.err.log',
      merge_logs: true,
      time: true
    },
    {
      name: 'executor',
      cwd: 'services/executor',
      script: 'node',
      args: 'dist/index.js',
      interpreter: '',
      exec_mode: 'fork',
      max_restarts: 10,
      min_uptime: 5000,
      restart_delay: 2000,
      watch: false,
      env: {
        NODE_ENV: 'production',
        HOST: '0.0.0.0',
        PORT: '4001',
        CANARY_ENABLED: '0',
        NODE_OPTIONS: '--unhandled-rejections=strict --trace-warnings'
      },
      out_file: '../../evidence/local/executor/pm2.out.log',
      error_file: '../../evidence/local/executor/pm2.err.log',
      merge_logs: true,
      time: true
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