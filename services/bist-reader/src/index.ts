import express from "express";
import cors from "cors";
import bodyParser from "body-parser";

const app = express();
app.use(cors());
app.use(bodyParser.json());

const HOST = process.env.BIST_HOST ?? process.env.HOST ?? "127.0.0.1";
const PORT = Number(process.env.BIST_PORT ?? process.env.PORT ?? 4301);

// Health endpoint
app.get("/health", (_req, res) => res.json({
  ok: true,
  ts: new Date().toISOString(),
  service: "bist-reader",
  host: HOST,
  port: PORT
}));

// Metrics
let messagesTotal = 0;
let wsReconnects = 0;
let seqGapTotal = 0;
let ingestLag = 0.5;
let dropRatio = 0.05;
let lastSeq = 0;
let expectedSeq = 0;

// Metrics endpoint
app.get("/metrics", (_req, res) => {
  res.set('Content-Type', 'text/plain');
  res.send(`
# HELP bist_reader_status BIST Reader service status
# TYPE bist_reader_status gauge
bist_reader_status{host="${HOST}",port="${PORT}"} 1

# HELP bist_reader_messages_total Total number of BIST messages processed
# TYPE bist_reader_messages_total counter
bist_reader_messages_total ${messagesTotal}

# HELP bist_reader_ingest_lag_seconds BIST data ingest lag
# TYPE bist_reader_ingest_lag_seconds gauge
bist_reader_ingest_lag_seconds ${ingestLag}

# HELP bist_ws_reconnects_total Total number of BIST WebSocket reconnections
# TYPE bist_ws_reconnects_total counter
bist_ws_reconnects_total ${wsReconnects}

# HELP bist_seq_gap_total Total number of sequence gaps detected
# TYPE bist_seq_gap_total counter
bist_seq_gap_total ${seqGapTotal}

# HELP bist_drop_ratio BIST data drop ratio (1-minute window)
# TYPE bist_drop_ratio gauge
bist_drop_ratio ${dropRatio}

# HELP bist_last_seq Last sequence number received
# TYPE bist_last_seq gauge
bist_last_seq ${lastSeq}

# HELP bist_expected_seq Expected sequence number
# TYPE bist_expected_seq gauge
bist_expected_seq ${expectedSeq}
  `.trim());
});

app.listen(PORT, HOST, () => {
  console.log("bist-reader listening on", HOST, PORT);
}); 