import fs from "node:fs";
import path from "node:path";

const STAMP = new Date().toISOString().replace(/[-:TZ.]/g,"").slice(0,14);
const EVID = path.join("evidence","local","btcturk",STAMP);
fs.mkdirSync(EVID,{recursive:true});

async function main(){
  // Simple REST API test to BTCTurk public endpoint
  const restBase = process.env.BTCTURK_REST_BASE ?? "https://api.btcturk.com/api/v2";
  const wsUrl = process.env.BTCTURK_WS_URL ?? "";
  
  const t0 = Date.now();
  let restResult = { ok: false, status: 0, ms: 0, data: null };
  
  try {
    const response = await fetch(`${restBase}/server/time`, { cache: "no-store" });
    const ms = Date.now() - t0;
    const data = await response.json();
    restResult = { ok: response.ok, status: response.status, ms, data };
  } catch (error) {
    const ms = Date.now() - t0;
    restResult = { ok: false, status: 0, ms, data: error.message };
  }

  const wsResult = { 
    connected: false, 
    durationMs: 0, 
    messages: 0, 
    errors: 0,
    note: wsUrl ? "WebSocket probe would run here" : "No WS URL configured"
  };

  const summary = { 
    rest: restResult, 
    ws: wsResult, 
    env: {
      BTCTURK_REST_BASE: restBase,
      BTCTURK_WS_URL: wsUrl || null
    }
  };
  
  fs.writeFileSync(path.join(EVID,"summary.json"), JSON.stringify(summary,null,2));
  console.log("EVIDENCE_DIR="+EVID);
}

main().catch(e=>{ console.error(e); process.exitCode=1; });
