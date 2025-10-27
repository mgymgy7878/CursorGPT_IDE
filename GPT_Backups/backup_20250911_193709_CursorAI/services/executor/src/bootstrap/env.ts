// Side-effect env loader: .env.local (varsa) > .env
import fs from "node:fs";
import path from "node:path";
import dotenv from "dotenv";

function load(p: string) { 
  if (fs.existsSync(p)) dotenv.config({ path: p }); 
}

const cwd = process.cwd();
load(path.join(cwd, ".env.local"));
load(path.join(cwd, ".env"));

process.env.PORT ??= "4001";
process.env.LIVE_TRADING ??= "1";          // 1=arm_only, 2=confirm, diğer=invalid→400
process.env.TRADE_WHITELIST ??= "BTCUSDT"; // virgüllü liste
process.env.LIVE_MAX_NOTIONAL ??= "20";    // USDT cinsinden
process.env.TRADE_WINDOW ??= "07:00-23:30";// HH:mm-HH:mm
process.env.TRADING_KILL_SWITCH ??= "0";   // 1 => tüm emirler blok

// Fusion env defaults and directories
const cacheSnapshot = process.env.FUSION_ONLINE_CACHE_SNAPSHOT || path.join(cwd, 'evidence', 'cache', 'fusion_online_cache.json');
const reportDir = process.env.RISK_REPORT_DIR || path.join(cwd, 'evidence', 'reports');
process.env.FUSION_ONLINE_CACHE_SNAPSHOT = cacheSnapshot;
process.env.RISK_REPORT_DIR = reportDir;
process.env.FUSION_GATE_ENABLE ??= '0';

try {
  fs.mkdirSync(path.dirname(cacheSnapshot), { recursive: true });
  fs.mkdirSync(reportDir, { recursive: true });
} catch {} 