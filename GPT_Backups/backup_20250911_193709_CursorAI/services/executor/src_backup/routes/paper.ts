import type { RH, ApiRes } from "@spark/common";
import express from "express";
import { paperEngine } from "../brokers/paper";
import { 
  sparkPaperOrdersTotal, 
  sparkPaperFillsTotal, 
  sparkPaperPnlRealized, 
  sparkPaperPnlUnrealized,
  sparkPaperBalance,
  sparkPaperEquity,
  sparkPaperFeesTotal,
  sparkPaperRiskViolationsTotal,
  sparkPaperFeeTotal,
  sparkPaperSlippageTotal,
  sparkPaperRejectsTotal
} from "../metrics";

const router = express.Router();

router.get('/account', (req, res) => {
  try {
    const account = paperEngine.getAccount();
    sparkPaperBalance.set(account.balance);
    sparkPaperEquity.set(account.equity);
    sparkPaperPnlRealized.set({ symbol: 'total' }, account.realizedPnL);
    sparkPaperPnlUnrealized.set({ symbol: 'total' }, account.unrealizedPnL);
    res.json(account);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.get('/positions', (req, res) => {
  try {
    const positions = paperEngine.getPositions();
    res.json(positions);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.get('/orders', (req, res) => {
  try {
    const orders = paperEngine.getOrders();
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/orders', (req, res) => {
  try {
    const { symbol, side, type, quantity, price, stopPrice, tif } = req.body;
    
    // Validate required fields
    if (!symbol || !side || !type || !quantity) {
      return res.status(400).json({ error: 'Missing required fields: symbol, side, type, quantity' });
    }

    // Validate order type specific fields
    if ((type === 'LIMIT' || type === 'STOP_LIMIT') && !price) {
      return res.status(400).json({ error: 'Price required for LIMIT orders' });
    }

    if ((type === 'STOP_MARKET' || type === 'STOP_LIMIT') && !stopPrice) {
      return res.status(400).json({ error: 'Stop price required for STOP orders' });
    }

    const order = paperEngine.placeOrder({
      symbol: symbol.toUpperCase(),
      side,
      type,
      quantity: parseFloat(quantity),
      price: price ? parseFloat(price) : undefined,
      stopPrice: stopPrice ? parseFloat(stopPrice) : undefined,
      tif: tif || 'GTC'
    });

    // Update metrics
    sparkPaperOrdersTotal.inc({ type: order.type });
    
    res.json(order);
  } catch (error) {
    // Increment risk violation metric
    sparkPaperRiskViolationsTotal.inc({ rule: 'order_validation' });
    res.status(400).json({ error: (error as Error).message });
  }
});

router.delete('/orders/:id', (req, res) => {
  try {
    const { id } = req.params;
    const success = paperEngine.cancelOrder(id);
    
    if (success) {
      res.json({ success: true, message: 'Order cancelled' });
    } else {
      res.status(404).json({ error: 'Order not found or cannot be cancelled' });
    }
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.get('/fills', (req, res) => {
  try {
    const fills = paperEngine.getFills();
    res.json(fills);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.get('/risk', (req, res) => {
  try {
    const riskConfig = paperEngine.getRiskConfig();
    res.json(riskConfig);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/reset', (req, res) => {
  try {
    paperEngine.reset();
    res.json({ success: true, message: 'Paper trading reset' });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.get('/config/get', async (req, res) => {
  try {
    // Mock config for now
    const config = {
      maxPositionSize: 1000,
      maxDailyLoss: 500,
      maxLeverage: 10,
      symbolAllowlist: ['BTCUSDT', 'ETHUSDT', 'ADAUSDT'],
      makerFeeBps: 10,
      takerFeeBps: 15
    };
    res.json(config);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/config/set', async (req, res) => {
  try {
    // Mock config update for now
    const updates = req.body;
    res.json({ success: true, applied: updates, message: 'Config updated' });
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

router.get('/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  const sendEvent = (event: string, data: any) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  // Send initial state
  sendEvent('account', paperEngine.getAccount());
  sendEvent('positions', paperEngine.getPositions());
  sendEvent('orders', paperEngine.getOrders());

  const interval = setInterval(() => {
    sendEvent('account', paperEngine.getAccount());
    sendEvent('positions', paperEngine.getPositions());
  }, 5000);

  req.on('close', () => {
    clearInterval(interval);
  });
});

export default router; 