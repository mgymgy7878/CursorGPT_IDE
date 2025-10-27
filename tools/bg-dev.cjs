const { spawn } = require('child_process');
const isWin = process.platform.startsWith('win');
const cmd = isWin ? 'pnpm.cmd' : 'pnpm';
const p = spawn(cmd, ['-w','run','dev:both'], { stdio: 'ignore', shell: true, detached: true });
p.unref();