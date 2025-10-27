const { spawn } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

// Load configuration
const configPath = path.join(process.cwd(), "config", "runner.json");
let config = {
  timeouts: { idle_ms: 12000, hard_ms: 45000, grace_ms: 4000 },
  metrics: { endpoint: "http://127.0.0.1:4001", enabled: true },
  logging: { evidence_dir: "evidence/runner" }
};

try {
  if (fs.existsSync(configPath)) {
    config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  }
} catch (err) {
  console.warn('Config load failed, using defaults:', err.message);
}

const args = process.argv.slice(2);
if (args.length < 2) {
  console.error("Usage: node tools/runStepConfigurable.cjs \"<command>\" <command_type> [environment]");
  process.exit(2);
}

const cmdline = args[0];
const commandType = args[1];
const environment = args[2] || 'default';

// Get timeouts from config hierarchy
const getTimeout = (timeoutType) => {
  const envConfig = config.environments?.[environment];
  const typeConfig = config.command_types?.[commandType];
  const globalConfig = config.timeouts;
  
  return envConfig?.[timeoutType] || 
         typeConfig?.[timeoutType] || 
         globalConfig?.[timeoutType] ||
         (timeoutType === 'idle_ms' ? 12000 : 45000);
};

const idleMs = parseInt(process.env.RUNNER_IDLE_MS || getTimeout('idle_ms'), 10);
const hardMs = parseInt(process.env.RUNNER_HARD_MS || getTimeout('hard_ms'), 10);
const retryCount = config.command_types?.[commandType]?.retry_count || 1;

const EVID = path.join(process.cwd(), config.logging.evidence_dir);
fs.mkdirSync(EVID, { recursive: true });
const stallLog = path.join(EVID, "stall-events.jsonl");

// PII redaction for sensitive data
const redactCommand = (cmd) => {
  const patterns = [
    { regex: /AKIA[0-9A-Z]{16}/g, replacement: '[REDACTED_AWS_KEY]' },
    { regex: /api[_-]?key\s*=\s*[^\s]+/gi, replacement: 'api_key=[REDACTED]' },
    { regex: /password\s*=\s*[^\s]+/gi, replacement: 'password=[REDACTED]' },
    { regex: /secret\s*=\s*[^\s]+/gi, replacement: 'secret=[REDACTED]' },
    { regex: /token\s*=\s*[^\s]+/gi, replacement: 'token=[REDACTED]' }
  ];
  
  let redacted = cmd;
  patterns.forEach(pattern => {
    redacted = redacted.replace(pattern.regex, pattern.replacement);
  });
  return redacted;
};

// Root-cause classification
const classifyRootCause = (event, output, error) => {
  const out = (output || '').toLowerCase();
  const err = (error || '').toLowerCase();
  
  // I/O wait indicators
  if (out.includes('i/o') || out.includes('disk') || err.includes('eio') || err.includes('enospc')) {
    return 'io_wait';
  }
  
  // Network indicators
  if (out.includes('network') || out.includes('timeout') || err.includes('enet') || err.includes('econn')) {
    return 'network';
  }
  
  // Child process hang indicators
  if (event === 'idle-timeout' || event === 'hard-timeout') {
    return 'child_hang';
  }
  
  // Lock indicators
  if (out.includes('lock') || out.includes('mutex') || err.includes('deadlock')) {
    return 'lock';
  }
  
  // CPU starvation indicators
  if (out.includes('cpu') || out.includes('load') || err.includes('resource')) {
    return 'cpu_starve';
  }
  
  return 'unknown';
};

// Enhanced audit logging with root-cause classification
const writeAuditEvent = (obj) => {
  const redactedCommand = redactCommand(cmdline);
  const rootCause = classifyRootCause(obj.event, obj.out, obj.err);
  
  const entry = { 
    ts: new Date().toISOString(), 
    commandType,
    environment,
    command: redactedCommand,
    pid: process.pid,
    host: require('os').hostname(),
    rootCause,
    ...obj 
  };
  fs.appendFileSync(stallLog, JSON.stringify(entry)+"\n");
};

// Security validation
const validateCommand = (cmd) => {
  if (!config.security) return true;
  
  const blockedPatterns = config.security.blocked_patterns || [];
  for (const pattern of blockedPatterns) {
    if (new RegExp(pattern, 'i').test(cmd)) {
      throw new Error(`Blocked command pattern detected: ${pattern}`);
    }
  }
  
  const allowedCommands = config.security.allowed_commands || [];
  const firstWord = cmd.trim().split(/\s+/)[0];
  if (allowedCommands.length > 0 && !allowedCommands.includes(firstWord)) {
    throw new Error(`Command not in allowed list: ${firstWord}`);
  }
  
  return true;
};

// Metrics integration with native fetch (Node 18+)
const sendMetric = async (metricName, value, labels = {}) => {
  if (!config.metrics.enabled) return;
  
  try {
    // Use native fetch (Node 18+) or fallback to undici
    const fetch = globalThis.fetch || (await import('undici')).fetch;
    
    const url = new URL('/api/metrics/counter', config.metrics.endpoint);
    url.searchParams.set('name', metricName);
    url.searchParams.set('value', value);
    Object.entries(labels).forEach(([k, v]) => url.searchParams.set(`label_${k}`, v));
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), config.metrics.timeout_ms || 5000);
    
    await fetch(url.toString(), { 
      method: 'POST',
      signal: controller.signal
    });
    clearTimeout(timeoutId);
  } catch (err) {
    console.warn('Metrics gönderimi başarısız:', err.message);
  }
};

// Validate command before execution
try {
  validateCommand(cmdline);
} catch (err) {
  console.error('Security validation failed:', err.message);
  process.exit(126);
}

const startTime = Date.now();
let last = Date.now(), killed = false, out = "", err = "";

const writeStall = (obj) => {
  writeAuditEvent(obj);
  
  // Prometheus metrics gönder with root-cause
  if (obj.event === 'idle-timeout' || obj.event === 'hard-timeout') {
    sendMetric('spark_runner_stalls_total', 1, {
      event_type: obj.event,
      timeout_type: obj.event === 'idle-timeout' ? 'idle' : 'hard',
      command_type: commandType,
      environment: environment,
      root_cause: obj.rootCause || 'unknown'
    });
  }
};

const child = spawn(process.platform === "win32" ? "powershell" : "bash",
  process.platform === "win32" ? ["-NoProfile","-NonInteractive","-Command", cmdline] : ["-lc", cmdline],
  { stdio: ["ignore","pipe","pipe"] }
);

// Send started metric
sendMetric('spark_runner_executions_total', 1, { 
  status: 'started',
  command_type: commandType,
  environment: environment
});

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
  await sendMetric('spark_runner_executions_total', 1, { 
    status,
    command_type: commandType,
    environment: environment
  });
  await sendMetric('spark_runner_execution_duration_seconds', duration, { 
    command_type: commandType,
    environment: environment
  });
  
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
