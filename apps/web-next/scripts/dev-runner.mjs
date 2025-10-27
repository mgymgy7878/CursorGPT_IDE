#!/usr/bin/env node
import net from 'node:net';
import { spawn } from 'node:child_process';

const prefer = Number(process.env.PORT || 3003);
const ceil   = Number(process.env.PORT_MAX || prefer + 20);

function isFree(port) {
  return new Promise((resolve) => {
    const srv = net.createServer();
    srv.once('error', () => resolve(false));
    srv.once('listening', () => srv.close(() => resolve(true)));
    srv.listen(port, '0.0.0.0');
  });
}

(async () => {
  let chosen = prefer;
  while (chosen <= ceil && !(await isFree(chosen))) chosen++;
  if (chosen > ceil) {
    console.error(`No free port in range ${prefer}-${ceil}.`);
    process.exit(1);
  }
  const note = chosen === prefer
    ? `Using preferred port ${chosen}`
    : `Port ${prefer} is busy → falling back to ${chosen}`;
  console.log(`\n[dev-runner] ${note}\n`);
  const child = spawn('next', ['dev', '-p', String(chosen)], {
    stdio: 'inherit',
    shell: process.platform === 'win32',
    env: { ...process.env, PORT: String(chosen) },
  });
  child.on('exit', (code) => process.exit(code ?? 0));
})(); 