const { spawn } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const args = process.argv.slice(2);
if (args.length < 1) {
  console.error("Usage: node tools/runStep.cjs \"<command>\"");
  process.exit(2);
}
const cmdline = args.join(" ");
const idleMs = parseInt(process.env.RUNNER_IDLE_MS || "12000", 10);
const hardMs = parseInt(process.env.RUNNER_HARD_MS || "45000", 10);
const graceMs = parseInt(process.env.RUNNER_GRACE_MS || "4000", 10);
const EVID = path.join(process.cwd(), "evidence", "runner");
fs.mkdirSync(EVID, { recursive: true });
const stallLog = path.join(EVID, "stall-events.jsonl");

const child = spawn(process.platform === "win32" ? "powershell" : "bash",
  process.platform === "win32" ? ["-NoProfile","-NonInteractive","-Command", cmdline] : ["-lc", cmdline],
  { stdio: ["ignore","pipe","pipe"] }
);

let last = Date.now(), killed = false, out = "", err = "";
const writeStall = (obj) => fs.appendFileSync(stallLog, JSON.stringify({ ts: new Date().toISOString(), ...obj })+"\n");

const idleTimer = setInterval(() => {
  if (Date.now() - last > idleMs) {
    writeStall({ event:"idle-timeout", pid: child.pid, idleMs });
    try { child.kill(); } catch {}
    if (process.platform === "win32") {
      spawn("taskkill", ["/PID", String(child.pid), "/T", "/F"]);
    }
    killed = true;
  }
}, 1000);

const hardTimer = setTimeout(() => {
  writeStall({ event:"hard-timeout", pid: child.pid, hardMs });
  try { child.kill(); } catch {}
  if (process.platform === "win32") {
    spawn("taskkill", ["/PID", String(child.pid), "/T", "/F"]);
  }
  killed = true;
}, hardMs);

child.stdout.on("data", (b)=>{ out += b; last = Date.now(); process.stdout.write(b); });
child.stderr.on("data", (b)=>{ err += b; last = Date.now(); process.stderr.write(b); });

child.on("close", (code)=>{
  clearInterval(idleTimer); clearTimeout(hardTimer);
  if (killed) {
    writeStall({ event:"killed", code, out: out.slice(-800), err: err.slice(-800) });
    console.log("::STEP::DONE::code="+code);
    process.exit(124);
  } else {
    writeStall({ event:"exit", code });
    console.log("::STEP::DONE::code="+code);
    process.exit(code ?? 0);
  }
});
