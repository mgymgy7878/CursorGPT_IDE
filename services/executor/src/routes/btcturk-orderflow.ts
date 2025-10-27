// services/executor/src/routes/btcturk-orderflow.ts
import type { FastifyInstance } from "fastify";
import { httpRequestsTotal } from "../metrics.js";

export async function btcturkOrderflowRoutes(app: FastifyInstance) {
  // BTCTurk Spot Order Create (Dry-Run)
  app.post("/api/btcturk/orders/create", async (req, reply) => {
    const body = req.body as any;
    const { symbol, side, quantity, price, orderType = "LIMIT" } = body;
    
    // Validation
    if (!symbol || !side || !quantity) {
      return reply.code(400).send({
        ok: false,
        error: "Missing required fields: symbol, side, quantity"
      });
    }
    
    // Guardrails
    const maxNotional = 1000; // TRY
    const notional = quantity * (price || 0);
    
    if (notional > maxNotional) {
      return reply.code(400).send({
        ok: false,
        error: "Notional exceeds maximum limit",
        maxNotional,
        actualNotional: notional
      });
    }
    
    // Dry-run simulation
    const orderId = `dry_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const simulatedPrice = price || 100000; // Mock price for BTCTRY
    
    const result = {
      ok: true,
      dryRun: true,
      orderId,
      symbol,
      side,
      quantity,
      price: simulatedPrice,
      orderType,
      status: "SIMULATED",
      timestamp: Date.now(),
      guardrails: {
        maxNotional,
        actualNotional: notional,
        paperTrading: true
      }
    };
    
    httpRequestsTotal.inc({ route: "/api/btcturk/orders/create", method: "POST", status: "200" });
    return reply.code(200).send(result);
  });
  
  // BTCTurk Spot Order Cancel (Dry-Run)
  app.delete("/api/btcturk/orders/:orderId", async (req, reply) => {
    const { orderId } = req.params as any;
    
    // Dry-run simulation
    const result = {
      ok: true,
      dryRun: true,
      orderId,
      status: "CANCELLED_SIMULATED",
      timestamp: Date.now(),
      message: "Order cancellation simulated (dry-run mode)"
    };
    
    httpRequestsTotal.inc({ route: "/api/btcturk/orders/:orderId", method: "DELETE", status: "200" });
    return reply.code(200).send(result);
  });
  
  // BTCTurk Spot Order Status (Dry-Run)
  app.get("/api/btcturk/orders/:orderId", async (req, reply) => {
    const { orderId } = req.params as any;
    
    // Dry-run simulation
    const result = {
      ok: true,
      dryRun: true,
      orderId,
      status: "FILLED_SIMULATED",
      symbol: "BTCTRY",
      side: "BUY",
      quantity: 0.001,
      price: 100000,
      filledQuantity: 0.001,
      timestamp: Date.now(),
      message: "Order status simulated (dry-run mode)"
    };
    
    httpRequestsTotal.inc({ route: "/api/btcturk/orders/:orderId", method: "GET", status: "200" });
    return reply.code(200).send(result);
  });
  
  // BTCTurk Spot Orders List (Dry-Run)
  app.get("/api/btcturk/orders", async (req, reply) => {
    // Dry-run simulation - return mock orders
    const mockOrders = [
      {
        orderId: "dry_1",
        symbol: "BTCTRY",
        side: "BUY",
        quantity: 0.001,
        price: 100000,
        status: "FILLED_SIMULATED",
        timestamp: Date.now() - 3600000
      },
      {
        orderId: "dry_2", 
        symbol: "BTCTRY",
        side: "SELL",
        quantity: 0.002,
        price: 101000,
        status: "PENDING_SIMULATED",
        timestamp: Date.now() - 1800000
      }
    ];
    
    const result = {
      ok: true,
      dryRun: true,
      orders: mockOrders,
      total: mockOrders.length,
      timestamp: Date.now()
    };
    
    httpRequestsTotal.inc({ route: "/api/btcturk/orders", method: "GET", status: "200" });
    return reply.code(200).send(result);
  });
}
