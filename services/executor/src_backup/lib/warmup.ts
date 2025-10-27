import { getExchangeInfo } from "./exchangeInfo";
import { WebSocketManager } from "./websocketManager";

// Schema compilation cache
const schemaCache = new Map<string, any>();

export async function compileSchemasOnce() {
  if (schemaCache.size > 0) return; // Already compiled
  
  try {
    // Pre-compile common JSON schemas
    const schemas = [
      { name: "OpenOrders", schema: { type: "object", properties: { orders: { type: "array" } } } },
      { name: "PnL", schema: { type: "object", properties: { unrealized: { type: "number" }, realized: { type: "number" } } } },
      { name: "Signal", schema: { type: "object", properties: { id: { type: "string" }, symbol: { type: "string" }, action: { type: "string" } } } }
    ];
    
    for (const { name, schema } of schemas) {
      schemaCache.set(name, schema);
    }
    
    console.log(`[WARMUP] Compiled ${schemas.length} schemas`);
  } catch (error) {
    console.error("[WARMUP] Schema compilation failed:", error);
  }
}

export async function warmup() {
  if (process.env.WARMUP_ENABLED !== "true") {
    console.log("[WARMUP] Disabled");
    return;
  }
  
  console.log("[WARMUP] Starting cold-start warmup...");
  
  try {
    // 1. Compile schemas
    await compileSchemasOnce();
    
    // 2. Preload exchange info
    const symbols = process.env.WARMUP_PRELOAD_SYMBOLS?.split(",") || ["BTCUSDT", "ETHUSDT"];
    for (const symbol of symbols) {
      try {
        await getExchangeInfo(process.env.BINANCE_API_BASE!);
        console.log(`[WARMUP] Exchange info loaded for ${symbol}`);
        break; // Only need to load once
      } catch (error) {
        console.warn(`[WARMUP] Failed to load exchange info for ${symbol}:`, error);
      }
    }
    
    // 3. Initialize WebSocket connection (if configured)
    if (process.env.BINANCE_API_KEY && process.env.BINANCE_API_SECRET) {
      try {
        const wsManager = new WebSocketManager(
          process.env.BINANCE_API_BASE!,
          process.env.BINANCE_API_KEY,
          process.env.BINANCE_API_SECRET
        );
        await wsManager.connect();
        console.log("[WARMUP] WebSocket connected");
      } catch (error) {
        console.warn("[WARMUP] WebSocket connection failed:", error);
      }
    }
    
    console.log("[WARMUP] Cold-start warmup completed");
  } catch (error) {
    console.error("[WARMUP] Warmup failed:", error);
    // Don't throw - warmup failure shouldn't prevent startup
  }
} 