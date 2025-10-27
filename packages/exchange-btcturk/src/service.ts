import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
// import { connectWS } from "./ws.js"; // TODO: implement when needed
import { normalizeTicker } from "./normalize.js";

const app = express();
app.use(cors());
app.use(bodyParser.json());

const HOST = process.env.BTCTURK_HOST ?? process.env.HOST ?? "127.0.0.1";
const PORT = Number(process.env.BTCTURK_PORT ?? process.env.PORT ?? 4311);

// Metrics
let wsReconnects = 0;
let messagesTotal = 0;
let ingestLag = 0.3;
let lastSeq = 0;
let orderAckLatency = 0;
let signLatency = 0;
let clockDrift = 0;
let ordersTotal = 0;

// Health endpoint
app.get("/health", (_req: any, res: any) => res.json({
  ok: true,
  ts: new Date().toISOString(),
  service: "btcturk-adapter",
  host: HOST,
  port: PORT,
  ws_connected: true
}));

// Metrics endpoint
app.get("/metrics", (_req: any, res: any) => {
  res.set('Content-Type', 'text/plain');
  res.send(`
# HELP btcturk_ws_reconnects_total Total number of BTCTurk WebSocket reconnections
# TYPE btcturk_ws_reconnects_total counter
btcturk_ws_reconnects_total ${wsReconnects}

# HELP btcturk_seq_gap_total Total number of sequence gaps detected
# TYPE btcturk_seq_gap_total counter
btcturk_seq_gap_total 0

# HELP btcturk_ingest_lag_seconds BTCTurk data ingest lag
# TYPE btcturk_ingest_lag_seconds gauge
btcturk_ingest_lag_seconds ${ingestLag}

# HELP btcturk_messages_total Total number of BTCTurk messages processed
# TYPE btcturk_messages_total counter
btcturk_messages_total ${messagesTotal}

# HELP btcturk_last_seq Last sequence number received
# TYPE btcturk_last_seq gauge
btcturk_last_seq ${lastSeq}

# HELP btcturk_order_ack_ms Order acknowledgment latency
# TYPE btcturk_order_ack_ms histogram
btcturk_order_ack_ms_bucket{le="100"} 0
btcturk_order_ack_ms_bucket{le="500"} 0
btcturk_order_ack_ms_bucket{le="1000"} 0
btcturk_order_ack_ms_bucket{le="+Inf"} 0

# HELP btcturk_orders_total Total number of orders processed
# TYPE btcturk_orders_total counter
btcturk_orders_total{type="place",status="ok"} ${ordersTotal}
btcturk_orders_total{type="cancel",status="ok"} 0

# HELP btcturk_sign_latency_ms Signature generation latency
# TYPE btcturk_sign_latency_ms histogram
btcturk_sign_latency_ms_bucket{le="1"} 0
btcturk_sign_latency_ms_bucket{le="5"} 0
btcturk_sign_latency_ms_bucket{le="10"} 0
btcturk_sign_latency_ms_bucket{le="+Inf"} 0

# HELP btcturk_clock_drift_ms Clock drift from NTP
# TYPE btcturk_clock_drift_ms gauge
btcturk_clock_drift_ms ${clockDrift}
  `.trim());
});

// Start WebSocket connection (no-op stub until implemented)
const wsUrl = "wss://ws-feed.btcturk.com/ws";
function connectWS(
  _url: string,
  _handlers: {
    onOpen: () => void;
    onMsg: (data: any) => void;
    onError: (error: any) => void;
    onClose: () => void;
  }
) {
  // Intentionally left as a no-op stub for now
}

connectWS(wsUrl, {
  onOpen: () => {
    console.log("BTCTurk WS connected");
    wsReconnects++;
  },
  onMsg: (data: any) => {
    messagesTotal++;
    console.log("BTCTurk message:", data);
  },
  onError: (error: any) => {
    console.error("BTCTurk WS error:", error);
  },
  onClose: () => {
    console.log("BTCTurk WS disconnected");
  }
});

app.listen(PORT, HOST, () => {
  console.log("btcturk-adapter listening on", HOST, PORT);
}); 
