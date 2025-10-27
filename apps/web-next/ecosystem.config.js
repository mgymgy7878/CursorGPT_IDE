module.exports = {
  apps: [{
    name: "spark-web",
    cwd: "C:/dev/CursorGPT_IDE/apps/web-next",
    script: "C:/Windows/System32/cmd.exe",
    args: "/c pnpm run dev -- -p 3015",
    interpreter: "",               // Önemli: Node ile yorumlama!
    env: {
      PORT: 3015,
      NODE_ENV: "development",
      NODE_OPTIONS: "--max-old-space-size=4096"
    },
    windowsHide: false,
    watch: false,
    max_restarts: 10,
    restart_delay: 2000
  }]
};
