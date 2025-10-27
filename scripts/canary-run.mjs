import fs from 'node:fs';
import path from 'node:path';
import { setTimeout as sleep } from 'node:timers/promises';

const WEB = process.env.WEB_ORIGIN ?? 'http://127.0.0.1:3003';
const EXEC = process.env.EXEC_ORIGIN ?? 'http://127.0.0.1:4001'; // optional
const N = Number(process.env.CANARY_N ?? 100);
const STAMP = new Date().toISOString().replace(/[-:TZ.]/g,'').slice(0,14);
const EVID = path.join('evidence','local','canary',STAMP);
fs.mkdirSync(EVID, { recursive: true });

async function ping(url) {
  const t0 = performance.now();
  let ok=false, status=0;
  try {
    const res = await fetch(url, { cache: 'no-store' });
    status = res.status;
    ok = res.ok;
    await res.text();
  } catch { /* ignore */ }
  const t1 = performance.now();
  return { ms: t1 - t0, ok, status };
}

function stats(arr){
  const a=[...arr].sort((x,y)=>x-y);
  const q = p => a[Math.min(a.length-1, Math.floor((p/100)*a.length))];
  const mean = a.reduce((s,x)=>s+x,0)/a.length;
  return { p50:q(50), p95:q(95), min:a[0], max:a[a.length-1], mean };
}

(async () => {
  const urls = [
    `${WEB}/api/public/health`,
    `${WEB}/api/public/metrics`,     // now exists
  ];
  // try executor if reachable
  urls.push(`${EXEC}/api/public/health`);

  const results = {};
  for (const url of urls) {
    const lat = [];
    for (let i=0;i<N;i++){
      const r = await ping(url);
      if (r.ok) lat.push(r.ms);
      await sleep(10);
    }
    results[url] = { count:N, ok_samples:lat.length, ...(lat.length?stats(lat):{}) };
  }
  fs.writeFileSync(path.join(EVID,'summary.json'), JSON.stringify({ N, results }, null, 2));
  console.log('EVIDENCE_DIR='+EVID);
})();
