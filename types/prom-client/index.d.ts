declare module "prom-client" {
  export class Registry {
    constructor(opts?: any);
    registerMetric(metric: any): void;
    metrics(): Promise<string>;
    getSingleMetric?(name: string): any;
    getMetricsAsJSON?(): Promise<any[]>;
  }
  export class Counter<T = string> {
    constructor(cfg: any);
    inc(labels?: any, value?: number): void;
    labels?: (labels?: any)=>{ inc: (v?:number)=>void };
  }
  export class Gauge<T = string> {
    constructor(cfg: any);
    set(labels?: any, value?: number): void;
    inc?(labels?: any, value?: number): void;
    dec?(labels?: any, value?: number): void;
  }
  export class Histogram<T = string> {
    constructor(cfg: any);
    observe(labels?: any, value?: number): void;
  }
  export class Summary {
    constructor(cfg: any);
    observe(labels?: any, value?: number): void;
  }
  export function collectDefaultMetrics(opts?: any): void;
  export const register: Registry;
  export default {
    Registry,
    Counter,
    Gauge,
    Histogram,
    Summary,
    collectDefaultMetrics,
    register
  };
} 