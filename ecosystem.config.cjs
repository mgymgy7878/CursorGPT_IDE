module.exports = {
  apps: [
    {
      name: "spark-web-dev",
      cwd: "apps/web-next",
      script: "node_modules/next/dist/bin/next",
      args: "dev -p 3003",
      env: {
        NODE_ENV: "development",
        EXECUTOR_BASE_URL: "http://127.0.0.1:4001",
        NEXT_PUBLIC_WS_URL: "ws://127.0.0.1:4001/ws/live",
        NEXT_PUBLIC_ADMIN_ENABLED: "1"
      },
      autorestart: true,
      max_restarts: 10,
      kill_timeout: 5000,
      watch: false,
      windowsHide: true
    }
  ]
};
