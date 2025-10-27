let lastPong = Date.now();

export function notePong() {
  lastPong = Date.now();
}

export function isStale(ms = 15000) {
  return (Date.now() - lastPong) > ms;
}

export function watchdogTick(reconnect: () => void) {
  if (isStale()) {
    console.log("[WS Watchdog] Connection stale, reconnecting...");
    reconnect();
  }
} 