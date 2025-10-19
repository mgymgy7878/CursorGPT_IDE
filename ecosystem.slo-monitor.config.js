/**
 * PM2 Ecosystem Config - SLO Monitor
 * Start: pm2 start ecosystem.slo-monitor.config.js
 */

module.exports = {
  apps: [{
    name: 'slo-monitor',
    script: 'powershell.exe',
    args: ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', 'scripts/slo-monitor.ps1', '-IntervalSec', '30'],
    cwd: process.cwd(),
    interpreter: 'none',
    autorestart: true,
    watch: false,
    max_memory_restart: '100M',
    env: {
      NODE_ENV: 'production'
    },
    error_file: '.logs/slo-monitor.err.log',
    out_file: '.logs/slo-monitor.out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
    merge_logs: true,
    restart_delay: 5000,
    max_restarts: 10,
    min_uptime: '10s'
  }]
};

