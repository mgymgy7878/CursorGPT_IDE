import { Counter, Gauge } from "prom-client";

export const paperRejects = new Counter({
  name: 'spark_paper_rejects_total',
  help: 'rejected orders',
  labelNames: ['reason']
});

export const paperFee = new Counter({
  name: 'spark_paper_fee_total',
  help: 'total fees charged',
  labelNames: ['type']
});

export const paperSlippage = new Counter({
  name: 'spark_paper_slippage_total',
  help: 'slippage bps',
  labelNames: ['symbol']
});

export const paperOrders = new Gauge({
  name: 'spark_paper_orders_active',
  help: 'active orders count',
  labelNames: ['symbol', 'side']
});

export const paperPositions = new Gauge({
  name: 'spark_paper_positions_value',
  help: 'position value',
  labelNames: ['symbol']
});

export const paperBalance = new Gauge({
  name: 'spark_paper_balance_usdt',
  help: 'USDT balance'
}); 