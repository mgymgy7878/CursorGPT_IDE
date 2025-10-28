module.exports = {
  apps: [
    {
      name: "spark-web-dev",
      cwd: "apps/web-next",
      script: "node_modules/next/dist/bin/next",
      args: "dev -p 3003",
      env: { NODE_ENV: "development" },
      autorestart: true,
      max_restarts: 10,
      kill_timeout: 5000,
      watch: false,
      windowsHide: false
    },
    {
      name: "spark-executor-dev",
      cwd: "services/executor",
      // derlemesiz çalışma: ts-node/transpile-only runner
      script: "node",
      args: "run-dev.cjs",
      env: { NODE_ENV: "development", PORT: "4001" },
      interpreter: "none",
      autorestart: true,
      max_restarts: 10,
      kill_timeout: 5000,
      watch: false,
      windowsHide: false
    }
  ]
};
