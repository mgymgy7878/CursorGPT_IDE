// Guardrail Middleware
import { Counter, Gauge } from "prom-client";
import type { GuardrailPolicy, Order, GuardrailResult } from "./policy";
import { defaultPolicy } from "./policy";

// Prometheus Metrics
const blocks = new Counter({ 
  name: "guardrail_blocks_total", 
  help: "blocked orders", 
  labelNames: ["reason", "asset"] 
});

const riskScore = new Gauge({ 
  name: "guardrail_risk_score", 
  help: "0..100" 
});

const circuitBreakerTrips = new Counter({
  name: "circuit_breaker_trips_total",
  help: "circuit breaker trips",
  labelNames: ["trigger"]
});

const dryRunBlocks = new Counter({
  name: "guardrail_dryrun_blocks_total",
  help: "dry-run blocked orders",
  labelNames: ["reason", "asset"]
});

// State
let currentPolicy: GuardrailPolicy = defaultPolicy;
let dailyLoss = 0;
let openPositions = 0;
let dryRunMode = true; // Default to dry-run for first day
let circuitBreakerTripped = false;
let tripTime: number | null = null;

export function updatePolicy(policy: Partial<GuardrailPolicy>) {
  currentPolicy = { ...currentPolicy, ...policy };
  console.log("Guardrail policy updated:", currentPolicy);
}

export function guardrailMw(order: Order): GuardrailResult {
  // Circuit Breaker Check
  if (circuitBreakerTripped) {
    const blockReason = "circuit_breaker_tripped";
    if (dryRunMode) {
      dryRunBlocks.inc({ reason: blockReason, asset: order.asset });
      return { allowed: false, reason: blockReason, details: { dryRun: true } };
    } else {
      blocks.inc({ reason: blockReason, asset: order.asset });
      return { allowed: false, reason: blockReason };
    }
  }

  // Kill Switch Check
  if (currentPolicy.killSwitch) {
    const blockReason = "kill_switch";
    if (dryRunMode) {
      dryRunBlocks.inc({ reason: blockReason, asset: order.asset });
      return { allowed: false, reason: blockReason, details: { dryRun: true } };
    } else {
      blocks.inc({ reason: blockReason, asset: order.asset });
      return { allowed: false, reason: blockReason };
    }
  }

  // Max Notional Check
  if (currentPolicy.maxNotional && order.notional > currentPolicy.maxNotional) {
    const blockReason = "max_notional";
    if (dryRunMode) {
      dryRunBlocks.inc({ reason: blockReason, asset: order.asset });
      return { 
        allowed: false, 
        reason: blockReason, 
        details: { requested: order.notional, limit: currentPolicy.maxNotional, dryRun: true }
      };
    } else {
      blocks.inc({ reason: blockReason, asset: order.asset });
      return { 
        allowed: false, 
        reason: blockReason, 
        details: { requested: order.notional, limit: currentPolicy.maxNotional }
      };
    }
  }

  // Per-Asset Notional Check
  const assetPolicy = currentPolicy.perAsset?.[order.asset];
  if (assetPolicy?.maxNotional && order.notional > assetPolicy.maxNotional) {
    blocks.inc({ reason: "asset_max_notional", asset: order.asset });
    return { 
      allowed: false, 
      reason: "asset_max_notional", 
      details: { requested: order.notional, limit: assetPolicy.maxNotional }
    };
  }

  // Max Open Positions Check
  if (currentPolicy.maxOpenPositions && openPositions >= currentPolicy.maxOpenPositions) {
    blocks.inc({ reason: "max_open_positions", asset: order.asset });
    return { 
      allowed: false, 
      reason: "max_open_positions", 
      details: { current: openPositions, limit: currentPolicy.maxOpenPositions }
    };
  }

  // Max Daily Loss Check
  if (currentPolicy.maxDailyLoss && dailyLoss >= currentPolicy.maxDailyLoss) {
    blocks.inc({ reason: "max_daily_loss", asset: order.asset });
    return { 
      allowed: false, 
      reason: "max_daily_loss", 
      details: { current: dailyLoss, limit: currentPolicy.maxDailyLoss }
    };
  }

  // Canary Mode Check
  if (currentPolicy.canaryPct !== undefined) {
    const random = Math.random() * 100;
    if (random > currentPolicy.canaryPct) {
      return { allowed: false, reason: "canary_mode", details: { canaryPct: currentPolicy.canaryPct } };
    }
  }

  // Calculate Risk Score (0-100)
  const risk = calculateRiskScore(order);
  riskScore.set(risk);

  return { allowed: true };
}

function calculateRiskScore(order: Order): number {
  let score = 0;
  
  // Notional risk (0-40 points)
  if (currentPolicy.maxNotional) {
    score += (order.notional / currentPolicy.maxNotional) * 40;
  }
  
  // Position concentration risk (0-30 points)
  if (currentPolicy.maxOpenPositions) {
    score += (openPositions / currentPolicy.maxOpenPositions) * 30;
  }
  
  // Daily loss risk (0-30 points)
  if (currentPolicy.maxDailyLoss) {
    score += (dailyLoss / currentPolicy.maxDailyLoss) * 30;
  }
  
  return Math.min(100, Math.max(0, score));
}

export function recordLoss(amount: number) {
  dailyLoss += amount;
}

export function recordPositionChange(delta: number) {
  openPositions += delta;
}

export function tripCircuitBreaker(trigger: string) {
  circuitBreakerTripped = true;
  tripTime = Date.now();
  circuitBreakerTrips.inc({ trigger });
  console.log(`Circuit breaker tripped: ${trigger} at ${new Date(tripTime).toISOString()}`);
}

export function untripCircuitBreaker() {
  circuitBreakerTripped = false;
  tripTime = null;
  console.log(`Circuit breaker untripped at ${new Date().toISOString()}`);
}

export function setDryRunMode(enabled: boolean) {
  dryRunMode = enabled;
  console.log(`Dry-run mode ${enabled ? 'enabled' : 'disabled'}`);
}

export function getCircuitBreakerStatus() {
  return {
    tripped: circuitBreakerTripped,
    tripTime: tripTime ? new Date(tripTime).toISOString() : null,
    dryRunMode
  };
} 