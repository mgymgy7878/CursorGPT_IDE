import client from 'prom-client';

export const placeAckHist = new client.Histogram({
  name: 'spark_place_ack_duration_seconds',
  help: 'Place→ACK latency',
  labelNames: ['exchange', 'symbol', 'route'],
  buckets: [0.05, 0.1, 0.2, 0.3, 0.5, 0.8, 1, 1.5, 2, 3]
});

export async function measurePlaceAck<T>(
  labels: { exchange: string; symbol: string; route: string },
  f: () => Promise<T>
): Promise<T> {
  const end = placeAckHist.startTimer(labels);
  try {
    return await f();
  } finally {
    end();
  }
}

// Helper for dry-run mode
export function isDryRunMode(): boolean {
  return process.env.TRADING_MODE === 'paper' || process.env.DRY_RUN === 'true';
}

// Helper for kill-switch
export function isKillSwitchActive(): boolean {
  return process.env.KILL_SWITCH === 'true';
}
