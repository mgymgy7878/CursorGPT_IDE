import fs from "fs";

type Resp = { code: number; ms: number };
type Step = { t: number; code: number; delay_ms: number };

const jitter = (b: number, s: number) => b + Math.floor(Math.random() * s);
const pctl = (xs: number[], q: number) => {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b);
  const i = Math.min(s.length - 1, Math.floor(q * s.length));
  return s[i];
};

// Fake exchange sequencer for scenarios
async function scenarioA(n = 20) { // all 200s, small delays
  const lat: number[] = [];
  let retries = 0;
  let success = 0;
  for (let i = 0; i < n; i++) {
    const dt = jitter(50, 50);
    await new Promise(r => setTimeout(r, dt));
    lat.push(dt);
    success++;
  }
  return { name: "A", ack_decision_ms: lat, p50_ms: pctl(lat, 0.5), p95_ms: pctl(lat, 0.95), success, retries };
}

async function scenarioB(n = 20) { // 429 burst with exponential backoff + jitter
  const lat: number[] = [];
  let retries = 0;
  let success = 0;
  for (let i = 0; i < n; i++) {
    // 40% chance of initial 429 needing up to 2 retries
    let attempt = 0;
    let ok = false;
    let acc = 0;
    while (attempt < 3 && !ok) {
      if (attempt === 0 && Math.random() < 0.4) { // 429
        const back = jitter(200 * (attempt + 1), 300);
        await new Promise(r => setTimeout(r, back));
        acc += back;
        retries++;
        attempt++;
        continue;
      }
      const dt = jitter(60, 80);
      await new Promise(r => setTimeout(r, dt));
      acc += dt;
      ok = true;
      success++;
    }
    lat.push(acc);
  }
  return { name: "B", ack_decision_ms: lat, p50_ms: pctl(lat, 0.5), p95_ms: pctl(lat, 0.95), success, retries };
}

async function scenarioC(n = 20) { // two consecutive 5xx -> circuit open for cooldown
  const lat: number[] = [];
  let errors = 0;
  let skipped = 0;
  let success = 0;
  let circuit_open = 0;
  const COOLDOWN = 1000;
  let open = false;
  let cooldownLeft = 0;
  for (let i = 0; i < n; i++) {
    if (open) {
      skipped++;
      continue;
    }
    if (i === 2 || i === 3) { // induce two 5xx
      errors++;
      if (i === 3) {
        open = 1 as any;
        circuit_open = 1;
        setTimeout(() => {
          open = false;
        }, COOLDOWN);
      }
      continue;
    }
    const dt = jitter(70, 90);
    await new Promise(r => setTimeout(r, dt));
    lat.push(dt);
    success++;
  }
  return { name: "C", ack_decision_ms: lat, p50_ms: pctl(lat, 0.5), p95_ms: pctl(lat, 0.95), success, errors, skipped, circuit_open };
}

async function scenarioD(n = 20) { // notional guard + kill-switch
  const lat: number[] = [];
  let blocked = 0;
  let kill_switch = 0;
  const PRICE = 100;
  const QTY = 1;
  const MAX_NOTIONAL = 1000; // after 10 orders, blocks begin
  let notion = 0;
  for (let i = 0; i < n; i++) {
    const next = PRICE * QTY;
    if (kill_switch || notion + next > MAX_NOTIONAL) {
      blocked++;
      kill_switch = 1;
      continue;
    }
    const dt = jitter(60, 60);
    await new Promise(r => setTimeout(r, dt));
    lat.push(dt);
    notion += next;
  }
  return { name: "D", ack_decision_ms: lat, p50_ms: pctl(lat, 0.5), p95_ms: pctl(lat, 0.95), blocked, kill_switch };
}

(async () => {
  const A = await scenarioA(20);
  const B = await scenarioB(20);
  const C = await scenarioC(20);
  const D = await scenarioD(20);
  const out = {
    scenarios: { A, B, B_raw: B.ack_decision_ms, C, D },
    summary: {
      scenA_p50_ms: A.p50_ms,
      scenA_p95_ms: A.p95_ms,
      scenB_p50_ms: B.p50_ms,
      scenB_p95_ms: B.p95_ms,
      scenB_retries: B.retries,
      scenC_p95_ms: C.p95_ms,
      scenC_circuit_open: C.circuit_open,
      scenC_skipped: C.skipped,
      scenC_errors: C.errors,
      scenD_p95_ms: D.p95_ms,
      scenD_blocked: D.blocked,
      scenD_kill_switch: D.kill_switch
    }
  };
  fs.writeFileSync(process.argv[2], JSON.stringify(out, null, 2));
  console.log(JSON.stringify({ A_p95_ms: A.p95_ms, B_p95_ms: B.p95_ms, circuit_open: C.circuit_open, blocks: D.blocked }));
})().catch(e => {
  console.error(e);
  process.exit(1);
}); 