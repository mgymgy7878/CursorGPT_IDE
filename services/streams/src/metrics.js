import client from 'prom-client';
export const registry = new client.Registry();
client.collectDefaultMetrics({ register: registry });
// WebSocket messages total
export const wsMsgs = new client.Counter({
    name: 'ws_msgs_total',
    help: 'WS messages',
    labelNames: ['exchange', 'channel'],
    registers: [registry]
});
// WebSocket reconnects total
export const wsReconnects = new client.Counter({
    name: 'ws_reconnects_total',
    help: 'WS reconnects',
    labelNames: ['exchange', 'reason'],
    registers: [registry]
});
// WebSocket sequence gap total
export const wsSeqGap = new client.Counter({
    name: 'ws_seq_gap_total',
    help: 'Out-of-order/sequence gaps',
    labelNames: ['exchange', 'channel'],
    registers: [registry]
});
// WebSocket connection state
export const wsConn = new client.Gauge({
    name: 'ws_conn_state',
    help: '0=down 1=up',
    labelNames: ['exchange'],
    registers: [registry]
});
// WebSocket gap (lag) histogram
export const wsGap = new client.Histogram({
    name: 'ws_gap_ms_bucket',
    help: 'Event lag (ms)',
    buckets: [5, 10, 25, 50, 100, 200, 400, 800, 1500, 3000],
    labelNames: ['exchange', 'channel'],
    registers: [registry]
});
// Ingestion latency histogram
export const ingestLatency = new client.Histogram({
    name: 'ingest_latency_ms_bucket',
    help: 'Ingest latency (ms)',
    buckets: [5, 10, 20, 40, 80, 160, 320, 640, 1280],
    labelNames: ['exchange', 'channel'],
    registers: [registry]
});
// Ingestion dropped total
export const ingestDropped = new client.Counter({
    name: 'ingest_dropped_total',
    help: 'Dropped events during ingestion',
    labelNames: ['reason'],
    registers: [registry]
});
// SSE heartbeat metric
export const sseClients = new client.Gauge({
    name: 'sse_clients',
    help: 'SSE connected clients',
    labelNames: ['route'],
    registers: [registry]
});
// Optimization best sharpe
export const optBestSharpe = new client.Gauge({
    name: 'opt_best_sharpe',
    help: 'Best sharpe ratio from optimization',
    labelNames: ['strategy'],
    registers: [registry]
});
export const prometheus = {
    wsMsgs,
    wsReconnects,
    wsSeqGap,
    wsConn,
    wsGap,
    ingestLatency,
    ingestDropped,
    sseClients,
    optBestSharpe
};
export function getMetrics() {
    return registry.metrics();
}
export function getContentType() {
    return registry.contentType;
}
