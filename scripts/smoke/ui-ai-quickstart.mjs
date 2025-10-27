#!/usr/bin/env node

import fs from "fs";
import path from "path";

const args = process.argv.slice(2);
const val = (key, defaultValue) => {
  const idx = args.indexOf(`--${key}`);
  return idx >= 0 && idx + 1 < args.length ? args[idx + 1] : defaultValue;
};

const outDir = val("out", "docs/evidence/dev/v2.2-ui");
const symbol = val("symbol", "BTCUSDT");
const qty = Number(val("qty", "0.001"));
const leverage = Number(val("leverage", "5"));
const risk = val("risk", "low");
const timeout = Number(val("timeout", "30"));
const webPort = Number(val("web-port", "3005"));
const executorPort = Number(val("executor-port", "4001"));

// Ensure output directory exists
fs.mkdirSync(outDir, { recursive: true });

const timestamp = new Date().toISOString().replace(/[-:T]/g, "").slice(0, 15);
const outFile = path.join(outDir, `ai_quickstart_${timestamp}.txt`);

const results = {
  timestamp: new Date().toISOString(),
  symbol,
  qty,
  leverage,
  risk,
  tests: []
};

async function testEndpoint(name, url, options = {}) {
  const startTime = Date.now();
  try {
    const response = await fetch(url, {
      timeout: timeout * 1000,
      ...options
    });
    const latency = Date.now() - startTime;
    const text = await response.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = { raw: text };
    }

    const result = {
      name,
      url,
      status: response.status,
      latency,
      ok: response.ok,
      data: response.ok ? data : { error: data }
    };

    results.tests.push(result);
    return result;
  } catch (error) {
    const latency = Date.now() - startTime;
    const result = {
      name,
      url,
      status: 0,
      latency,
      ok: false,
      error: error.message
    };
    results.tests.push(result);
    return result;
  }
}

async function runAISmokeTests() {
  console.log(`[ai-smoke] Starting AI Quickstart smoke tests...`);
  console.log(`[ai-smoke] Symbol: ${symbol}, Qty: ${qty}, Leverage: ${leverage}, Risk: ${risk}`);

  // Test 1: AI Advisor Suggest
  const suggestBody = {
    symbol,
    side: "BUY",
    qty,
    leverage,
    risk,
    testnet: true
  };

  const suggestResult = await testEndpoint(
    "advisor_suggest",
    `http://127.0.0.1:${webPort}/api/advisor/suggest`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(suggestBody)
    }
  );

  console.log(`[ai-smoke] Advisor suggest: ${suggestResult.ok ? "✅" : "❌"} (${suggestResult.status})`);

  // Test 2: Canary Plan (if suggest was successful)
  let planResult = null;
  if (suggestResult.ok && suggestResult.data?.id) {
    const planBody = {
      ...suggestBody,
      suggestId: suggestResult.data.id,
      dryRun: true
    };

    planResult = await testEndpoint(
      "canary_plan",
      `http://127.0.0.1:${webPort}/api/canary/live-trade.plan`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(planBody)
      }
    );

    console.log(`[ai-smoke] Canary plan: ${planResult.ok ? "✅" : "❌"} (${planResult.status})`);
  }

  // Test 3: Dry Run Order (expect 403 + confirm_required)
  const orderBody = {
    symbol,
    side: "BUY",
    type: "MARKET",
    quantity: qty
  };

  const orderResult = await testEndpoint(
    "dry_run_order",
    `http://127.0.0.1:${executorPort}/api/futures/order`,
    {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "x-dry-run": "1"
      },
      body: JSON.stringify(orderBody)
    }
  );

  const orderExpected = orderResult.status === 403 && 
    (orderResult.data?.confirm_required || orderResult.data?.error?.includes("confirm"));

  console.log(`[ai-smoke] Dry run order: ${orderExpected ? "✅" : "❌"} (${orderResult.status})`);

  // Test 4: Metrics endpoint
  const metricsResult = await testEndpoint(
    "metrics",
    `http://127.0.0.1:${webPort}/api/public/metrics`
  );

  const hasAdvisorMetrics = metricsResult.ok && 
    metricsResult.data?.raw?.includes("advisor_suggest_total");

  console.log(`[ai-smoke] Metrics: ${hasAdvisorMetrics ? "✅" : "❌"} (advisor metrics found)`);

  // Test 5: Advisor Health
  const healthResult = await testEndpoint(
    "advisor_health",
    `http://127.0.0.1:${executorPort}/api/advisor/health`
  );

  console.log(`[ai-smoke] Advisor health: ${healthResult.ok ? "✅" : "❌"} (${healthResult.status})`);

  // Summary
  const passed = results.tests.filter(t => t.ok || (t.name === "dry_run_order" && t.status === 403)).length;
  const total = results.tests.length;
  const success = passed === total;

  results.summary = {
    passed,
    total,
    success,
    timestamp: new Date().toISOString()
  };

  // Write results
  const lines = [
    `# AI Quickstart Smoke Test Results`,
    `Timestamp: ${results.timestamp}`,
    `Symbol: ${symbol}, Qty: ${qty}, Leverage: ${leverage}, Risk: ${risk}`,
    ``,
    `## Summary`,
    `Passed: ${passed}/${total}`,
    `Success: ${success ? "✅ YES" : "❌ NO"}`,
    ``,
    `## Test Results`,
    ...results.tests.map(test => [
      `### ${test.name}`,
      `- URL: ${test.url}`,
      `- Status: ${test.status}`,
      `- Latency: ${test.latency}ms`,
      `- OK: ${test.ok ? "✅" : "❌"}`,
      test.error ? `- Error: ${test.error}` : "",
      test.data ? `- Data: ${JSON.stringify(test.data, null, 2)}` : "",
      ``
    ].filter(Boolean).join("\n")),
    ``,
    `## Raw Results`,
    JSON.stringify(results, null, 2)
  ];

  fs.writeFileSync(outFile, lines.join("\n"), "utf8");
  console.log(`[ai-smoke] Results written to: ${outFile}`);
  console.log(`[ai-smoke] Overall: ${success ? "✅ PASS" : "❌ FAIL"}`);

  return success;
}

// Run tests
runAISmokeTests()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error("[ai-smoke] Fatal error:", error);
    process.exit(1);
  });
