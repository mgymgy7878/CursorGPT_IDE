const { spawn } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const args = process.argv.slice(2);
if (args.length < 1) {
  console.error("Usage: node tools/runStepWithMetrics.cjs \"<command>\" [command_type]");
  process.exit(2);
}

const cmdline = args[0];
const commandType = args[1] || 'unknown';
const idleMs = parseInt(process.env.RUNNER_IDLE_MS || "12000", 10);
const hardMs = parseInt(process.env.RUNNER_HARD_MS || "45000", 10);
const EVID = path.join(process.cwd(), "evidence", "runner");
fs.mkdirSync(EVID, { recursive: true });
const stallLog = path.join(EVID, "stall-events.jsonl");

// Metrics integration
const metricsEndpoint = process.env.SPARK_METRICS_ENDPOINT || 'http://127.0.0.1:4001';
const sendMetric = async (metricName, value, labels = {}) => {
  try {
    const fetch = require('node-fetch');
    const url = new URL('/api/metrics/counter', metricsEndpoint);
    url.searchParams.set('name', metricName);
    url.searchParams.set('value', value);
    Object.entries(labels).forEach(([k, v]) => url.searchParams.set(`label_${k}`, v));
    await fetch(url.toString(), { method: 'POST' });
  } catch (err) {
    // Metrics gönderimi başarısız olsa bile ana işlemi durdurmaz
    console.warn('Metrics gönderimi başarısız:', err.message);
  }
};

const startTime = Date.now();
let last = Date.now(), killed = false, out = "", err = "";

const writeStall = (obj) => {
  const entry = { ts: new Date().toISOString(), commandType, ...obj };
  fs.appendFileSync(stallLog, JSON.stringify(entry)+"\n");
  
  // Prometheus metrics gönder
  if (obj.event === 'idle-timeout' || obj.event === 'hard-timeout') {
    sendMetric('spark_runner_stalls_total', 1, {
      event_type: obj.event,
      timeout_type: obj.event === 'idle-timeout' ? 'idle' : 'hard'
    });
  }
};

const child = spawn(process.platform === "win32" ? "powershell" : "bash",
  process.platform === "win32" ? ["-NoProfile","-NonInteractive","-Command", cmdline] : ["-lc", cmdline],
  { stdio: ["ignore","pipe","pipe"] }
);

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

child.on("close", async (code)=>{
  clearInterval(idleTimer); clearTimeout(hardTimer);
  
  const duration = (Date.now() - startTime) / 1000;
  const status = killed ? 'killed' : (code === 0 ? 'success' : 'failed');
  
  // Execution metrics gönder
  await sendMetric('spark_runner_executions_total', 1, { status });
  await sendMetric('spark_runner_execution_duration_seconds', duration, { command_type: commandType });
  
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
