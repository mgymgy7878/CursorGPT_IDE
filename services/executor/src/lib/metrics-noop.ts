// Minimal NOOP shim for prom-client API we might be using
class NoopMetric {
  labels() { return this; }
  inc() {}
  dec() {}
  set() {}
  observe() {}
  startTimer() { return () => {}; }
}

class NoopRegistry {
  contentType = 'text/plain; version=0.0.4; charset=utf-8';
  async metrics() { return ''; }
  registerMetric() {}
  getMetricsAsJSON() { return []; }
}

export const register = new NoopRegistry();
export const registry = register;
export class Registry { constructor() { return new NoopRegistry(); } }

export class Counter { 
  constructor(_: any) { 
    return new NoopMetric(); 
  } 
}

export class Gauge { 
  constructor(_: any) { 
    return new NoopMetric(); 
  } 
}

export class Histogram { 
  constructor(_: any) { 
    return new NoopMetric(); 
  } 
}

export class Summary { 
  constructor(_: any) { 
    return new NoopMetric(); 
  } 
}

export function collectDefaultMetrics(_: any = {}) {}
