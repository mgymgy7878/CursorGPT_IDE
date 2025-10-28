// Feed Metrics
// feed_* ve event_to_db_ms histogramları (import * as prom from '@metrics')

import * as prom from '@metrics';

export const feedEventsTotal = new prom.Counter({
  name: 'feed_events_total',
  help: 'Feed events total',
  labelNames: ['source'],
});

export const wsReconnectsTotal = new prom.Counter({
  name: 'ws_reconnects_total',
  help: 'WS reconnect attempts',
  labelNames: ['source'],
});

export const feedLatencyMs = new prom.Histogram({
  name: 'feed_latency_ms',
  help: 'Latency from source event to orchestrator',
  buckets: [50, 100, 200, 400, 800, 1600, 3200, 6400],
  labelNames: ['source'],
});

export const eventToDbMs = new prom.Histogram({
  name: 'event_to_db_ms',
  help: 'Event to DB pipeline latency',
  buckets: [5, 10, 20, 40, 80, 160, 320, 640],
  labelNames: ['table'],
});
