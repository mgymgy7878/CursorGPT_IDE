module.exports = {
  apps: [
    {
      name: 'web-next',
      script: 'pnpm',
      args: 'dev',
      cwd: './apps/web-next',
      instances: 2,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'development',
        PORT: 3003,
        HOSTNAME: '127.0.0.1'
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3003,
        HOSTNAME: '0.0.0.0'
      },
      error_file: './logs/web-next-error.log',
      out_file: './logs/web-next-out.log',
      log_file: './logs/web-next-combined.log',
      time: true,
      max_memory_restart: '1G',
      watch: false,
      ignore_watch: ['node_modules', 'logs', 'dist'],
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 10000
    },
    {
      name: 'executor',
      script: 'pnpm',
      args: 'dev',
      cwd: './services/executor',
      instances: 2,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'development',
        PORT: 4001,
        HOSTNAME: '127.0.0.1'
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 4001,
        HOSTNAME: '0.0.0.0'
      },
      error_file: './logs/executor-error.log',
      out_file: './logs/executor-out.log',
      log_file: './logs/executor-combined.log',
      time: true,
      max_memory_restart: '2G',
      watch: false,
      ignore_watch: ['node_modules', 'logs', 'dist'],
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 10000
    },
    {
      name: 'backtest-engine',
      script: 'pnpm',
      args: 'dev',
      cwd: './services/backtest-engine',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'development',
        PORT: 4501,
        HOSTNAME: '127.0.0.1'
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 4501,
        HOSTNAME: '0.0.0.0'
      },
      error_file: './logs/backtest-engine-error.log',
      out_file: './logs/backtest-engine-out.log',
      log_file: './logs/backtest-engine-combined.log',
      time: true,
      max_memory_restart: '1G',
      watch: false,
      ignore_watch: ['node_modules', 'logs', 'dist'],
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 10000
    },
    {
      name: 'streams',
      script: 'pnpm',
      args: 'dev',
      cwd: './services/streams',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'development',
        PORT: 4601,
        HOSTNAME: '127.0.0.1'
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 4601,
        HOSTNAME: '0.0.0.0'
      },
      error_file: './logs/streams-error.log',
      out_file: './logs/streams-out.log',
      log_file: './logs/streams-combined.log',
      time: true,
      max_memory_restart: '1G',
      watch: false,
      ignore_watch: ['node_modules', 'logs', 'dist'],
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 10000
    },
    {
      name: 'ml-engine',
      script: 'pnpm',
      args: 'dev',
      cwd: './services/ml-engine',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'development',
        PORT: 4701,
        HOSTNAME: '127.0.0.1'
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 4701,
        HOSTNAME: '0.0.0.0'
      },
      error_file: './logs/ml-engine-error.log',
      out_file: './logs/ml-engine-out.log',
      log_file: './logs/ml-engine-combined.log',
      time: true,
      max_memory_restart: '2G',
      watch: false,
      ignore_watch: ['node_modules', 'logs', 'dist'],
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 10000
    }
  ]
}; 