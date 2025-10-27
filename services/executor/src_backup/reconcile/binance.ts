import { getOpenOrders, getAccount, getOrder } from "../broker/binance.live";
import { 
  getOrdersByStatus, 
  updateOrderFromExchange, 
  getAllPositions,
  upsertPosition 
} from "../services/orderStore";

export interface ReconciliationResult {
  ordersDrift: number;
  positionsDrift: number;
  totalDrift: number;
  details: {
    orders: {
      new: number;
      updated: number;
      errors: number;
    };
    positions: {
      new: number;
      updated: number;
      errors: number;
    };
  };
}

let reconciliationRunning = false;

export async function reconcileOrders(): Promise<ReconciliationResult['details']['orders']> {
  const result = { new: 0, updated: 0, errors: 0 };

  try {
    // Get open orders from exchange
    const exchangeOrders = await getOpenOrders();
    
    // Get pending orders from DB
    const dbOrders = await getOrdersByStatus('NEW');
    
    // Create maps for efficient lookup
    const exchangeOrderMap = new Map();
    exchangeOrders.forEach(order => {
      exchangeOrderMap.set(order.clientOrderId, order);
    });

    const dbOrderMap = new Map();
    dbOrders.forEach(order => {
      dbOrderMap.set(order.clientId, order);
    });

    // Check for orders in DB but not in exchange
    for (const dbOrder of dbOrders) {
      if (dbOrder.clientId && !exchangeOrderMap.has(dbOrder.clientId)) {
        try {
          // Order might be filled or cancelled - check status
          if (dbOrder.exchangeId) {
            const exchangeOrder = await getOrder(dbOrder.exchangeId, dbOrder.symbol);
            if (exchangeOrder) {
              await updateOrderFromExchange(dbOrder.id, {
                status: exchangeOrder.status,
                price: exchangeOrder.price
              });
              result.updated++;
            } else {
              // Order not found in exchange - mark as cancelled
              await updateOrderFromExchange(dbOrder.id, {
                status: 'CANCELED',
                reason: 'Order not found in exchange'
              });
              result.updated++;
            }
          }
        } catch (error) {
          console.error('Error reconciling order:', dbOrder.id, error);
          result.errors++;
        }
      }
    }

    // Check for orders in exchange but not in DB (shouldn't happen with our flow)
    for (const exchangeOrder of exchangeOrders) {
      if (!dbOrderMap.has(exchangeOrder.clientOrderId)) {
        console.warn('Found order in exchange but not in DB:', exchangeOrder);
        result.new++;
      }
    }

  } catch (error) {
    console.error('Order reconciliation error:', error);
    result.errors++;
  }

  return result;
}

export async function reconcilePositions(): Promise<ReconciliationResult['details']['positions']> {
  const result = { new: 0, updated: 0, errors: 0 };

  try {
    // Get account info from exchange
    const account = await getAccount();
    
    // Get positions from DB
    const dbPositions = await getAllPositions();
    
    // Create maps for efficient lookup
    const exchangeBalanceMap = new Map();
    account.balances.forEach(balance => {
      const qty = parseFloat(balance.free) + parseFloat(balance.locked);
      if (qty > 0) {
        exchangeBalanceMap.set(balance.asset, qty);
      }
    });

    const dbPositionMap = new Map();
    dbPositions.forEach(position => {
      dbPositionMap.set(position.symbol, position);
    });

    // Check for positions in exchange but not in DB
    for (const [asset, qty] of exchangeBalanceMap) {
      const symbol = asset + 'USDT'; // Simplified - would need proper symbol mapping
      
      if (!dbPositionMap.has(symbol)) {
        try {
          await upsertPosition({
            symbol,
            qty,
            avgPrice: 0, // Would need to calculate from trades
            unrealized: 0
          });
          result.new++;
        } catch (error) {
          console.error('Error creating position:', symbol, error);
          result.errors++;
        }
      } else {
        const dbPosition = dbPositionMap.get(symbol);
        if (Math.abs(Number(dbPosition.qty) - qty) > 0.000001) { // Small tolerance for floating point
          try {
            await upsertPosition({
              symbol,
              qty,
              avgPrice: Number(dbPosition.avgPrice),
              unrealized: dbPosition.unrealized ? Number(dbPosition.unrealized) : 0
            });
            result.updated++;
          } catch (error) {
            console.error('Error updating position:', symbol, error);
            result.errors++;
          }
        }
      }
    }

    // Check for positions in DB but not in exchange (zero balance)
    for (const dbPosition of dbPositions) {
      const asset = dbPosition.symbol.replace('USDT', '');
      if (!exchangeBalanceMap.has(asset) && Number(dbPosition.qty) > 0) {
        try {
          await upsertPosition({
            symbol: dbPosition.symbol,
            qty: 0,
            avgPrice: Number(dbPosition.avgPrice),
            unrealized: 0
          });
          result.updated++;
        } catch (error) {
          console.error('Error zeroing position:', dbPosition.symbol, error);
          result.errors++;
        }
      }
    }

  } catch (error) {
    console.error('Position reconciliation error:', error);
    result.errors++;
  }

  return result;
}

export async function runReconciliation(): Promise<ReconciliationResult> {
  if (reconciliationRunning) {
    console.log('Reconciliation already running, skipping...');
    return {
      ordersDrift: 0,
      positionsDrift: 0,
      totalDrift: 0,
      details: { orders: { new: 0, updated: 0, errors: 0 }, positions: { new: 0, updated: 0, errors: 0 } }
    };
  }

  reconciliationRunning = true;
  const startTime = Date.now();

  try {
    console.log('Starting reconciliation...');

    // Reconcile orders and positions
    const [orderResult, positionResult] = await Promise.all([
      reconcileOrders(),
      reconcilePositions()
    ]);

    const ordersDrift = orderResult.new + orderResult.updated;
    const positionsDrift = positionResult.new + positionResult.updated;
    const totalDrift = ordersDrift + positionsDrift;

    const result: ReconciliationResult = {
      ordersDrift,
      positionsDrift,
      totalDrift,
      details: {
        orders: orderResult,
        positions: positionResult
      }
    };

    const duration = Date.now() - startTime;
    console.log(`Reconciliation completed in ${duration}ms:`, result);

    // Update metrics
    if (global.sparkLiveMetrics) {
      global.sparkLiveMetrics.reconciliation.inc({ type: 'orders' });
      global.sparkLiveMetrics.reconciliation.inc({ type: 'positions' });
    }

    return result;

  } catch (error) {
    console.error('Reconciliation failed:', error);
    throw error;
  } finally {
    reconciliationRunning = false;
  }
}

// Start reconciliation loop
let reconciliationInterval: NodeJS.Timeout | null = null;

export function startReconciliationLoop(intervalMs: number = 30000) {
  if (reconciliationInterval) {
    clearInterval(reconciliationInterval);
  }

  reconciliationInterval = setInterval(async () => {
    try {
      await runReconciliation();
    } catch (error) {
      console.error('Reconciliation loop error:', error);
    }
  }, intervalMs);

  console.log(`Reconciliation loop started with ${intervalMs}ms interval`);
}

export function stopReconciliationLoop() {
  if (reconciliationInterval) {
    clearInterval(reconciliationInterval);
    reconciliationInterval = null;
    console.log('Reconciliation loop stopped');
  }
} 