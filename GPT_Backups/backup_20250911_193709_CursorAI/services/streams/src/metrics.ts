import { Counter, Gauge, Histogram } from "prom-client";

// Counters
export const streamsMessagesTotal = new Counter({
  name: 'streams_messages_total',
  help: 'Total messages received from streams',
  labelNames: ['src', 'symbol', 'type']
});

export const streamsSeqGapTotal = new Counter({
  name: 'streams_seq_gap_total',
  help: 'Total sequence gaps detected',
  labelNames: ['src', 'symbol']
});

export const streamsDupTotal = new Counter({
  name: 'streams_dup_total',
  help: 'Total duplicate messages detected',
  labelNames: ['src', 'symbol']
});

export const streamsOutOfOrderTotal = new Counter({
  name: 'streams_out_of_order_total',
  help: 'Total out-of-order messages',
  labelNames: ['src', 'symbol']
});

// Gauges
export const streamsIngestLagSeconds = new Gauge({
  name: 'streams_ingest_lag_seconds',
  help: 'Ingest lag in seconds',
  labelNames: ['src', 'symbol']
});

export const streamsLastSeq = new Gauge({
  name: 'streams_last_seq',
  help: 'Last sequence number received',
  labelNames: ['src', 'symbol']
});

export const streamsHeartbeat = new Gauge({
  name: 'streams_heartbeat',
  help: 'Last heartbeat timestamp',
  labelNames: ['src']
});

// Histograms
export const streamsEventToDbMs = new Histogram({
  name: 'streams_event_to_db_ms',
  help: 'Event to database latency',
  labelNames: ['src', 'symbol'],
  buckets: [10, 50, 100, 200, 300, 500, 1000, 2000, 5000]
});

export const streamsWsRoundtripMs = new Histogram({
  name: 'streams_ws_roundtrip_ms',
  help: 'WebSocket roundtrip latency',
  labelNames: ['src'],
  buckets: [1, 5, 10, 25, 50, 100, 250, 500, 1000]
}); 