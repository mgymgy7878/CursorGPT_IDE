// Single import point for all metrics across the service
const METRICS_DISABLED =
  process.env.METRICS_DISABLED === '1' || process.env.NODE_ENV === 'test';

let impl: any;
try {
  impl = METRICS_DISABLED ? require('./metrics-noop') : require('prom-client');
} catch {
  impl = require('./metrics-noop');
}

// re-export the chosen implementation
export = impl;
