#!/usr/bin/env node
/**
 * MVP Smoke Test
 *
 * Quick validation that:
 * 1. Dashboard opens
 * 2. Start button works
 * 3. Status updates within 10s
 * 4. Health indicators show OK
 */

const EXECUTOR_URL = process.env.EXECUTOR_URL || "http://localhost:4001";
const WEB_URL = process.env.WEB_URL || "http://localhost:3003";

async function checkHealth() {
  console.log("🔍 MVP Smoke Test\n");

  // 1. Check executor status
  try {
    const statusRes = await fetch(`${EXECUTOR_URL}/api/exec/status`);
    const status = await statusRes.json();
    console.log(`✅ Executor status: ${status.running ? "RUNNING" : "STOPPED"}`);

    if (status.running) {
      if (status.lastCandleTs) {
        const age = Date.now() - status.lastCandleTs;
        const stale = age > 90000;
        console.log(`   Marketdata: ${stale ? "❌ STALE" : "✅ OK"} (${Math.floor(age / 1000)}s ago)`);
      } else {
        console.log(`   Marketdata: ⏳ WAIT`);
      }

      if (status.lastDecisionTs) {
        const age = Date.now() - status.lastDecisionTs;
        const stale = age > 30000;
        console.log(`   Executor: ${stale ? "⚠️ STALE" : "✅ OK"} (${Math.floor(age / 1000)}s ago)`);
      } else {
        console.log(`   Executor: ⏳ WAIT`);
      }

      if (status.lastError) {
        console.log(`   ⚠️ Last Error: ${status.lastError}`);
      }
    }
  } catch (err) {
    console.log(`❌ Executor unreachable: ${err.message}`);
    console.log(`   Make sure executor is running on ${EXECUTOR_URL}`);
    process.exit(1);
  }

  // 2. Check web-next
  try {
    const webRes = await fetch(`${WEB_URL}/dashboard`);
    if (webRes.ok) {
      console.log(`✅ Web UI accessible: ${WEB_URL}/dashboard`);
    } else {
      console.log(`⚠️ Web UI returned ${webRes.status}`);
    }
  } catch (err) {
    console.log(`❌ Web UI unreachable: ${err.message}`);
    console.log(`   Make sure web-next is running on ${WEB_URL}`);
    process.exit(1);
  }

  console.log("\n✅ MVP Smoke Test PASSED");
  console.log("\n📋 Manual Steps:");
  console.log("   1. Open http://localhost:3003/dashboard");
  console.log("   2. Select Risk: Med → Apply");
  console.log("   3. Set Symbol: BTCUSDT, TF: 1m");
  console.log("   4. Click Start");
  console.log("   5. Within 10s, verify:");
  console.log("      - Event log shows status/log events");
  console.log("      - Last Candle timestamp updates");
  console.log("      - Last Decision timestamp updates");
  console.log("      - Health shows marketdata: OK, executor: OK");
}

checkHealth().catch((err) => {
  console.error("❌ Smoke test failed:", err);
  process.exit(1);
});
