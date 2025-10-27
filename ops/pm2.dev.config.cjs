module.exports = {
  apps: [
    {
      name: "executor-dev",
      cwd: "services/executor",
      script: process.platform.startsWith('win') ? "pnpm.cmd" : "pnpm",
      args: "run dev",
      env: { PORT: "4001" },
      watch: false
    },
    {
      name: "web-next-dev",
      cwd: "apps/web-next",
      script: process.platform.startsWith('win') ? "pnpm.cmd" : "pnpm",
      args: "run dev",
      env: { PORT: "3003", NEXT_DISABLE_TURBOPACK: "1", EXECUTOR_BASE: "http://127.0.0.1:4001" },
      watch: false
    }
  ]
};
