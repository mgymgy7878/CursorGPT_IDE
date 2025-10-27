import { paperEngine } from "../brokers/paper";
import { sparkPaperStopsTriggeredTotal } from "../metrics";
// import { triggerStop } from "@spark/paper-broker/matching/engine";

// Simple trigger function
function triggerStop(side: string, stop: number, last: number): boolean {
  return side === 'BUY' ? (last >= stop) : (last <= stop);
}

interface StopWatcherConfig {
  intervalMs: number;
  enabled: boolean;
}

class StopWatcher {
  private timer: NodeJS.Timeout | null = null;
  private config: StopWatcherConfig;
  private inFlight: Set<string> = new Set();

  constructor(config: StopWatcherConfig = { intervalMs: 1000, enabled: true }) {
    this.config = config;
  }

  start(): void {
    if (!this.config.enabled || this.timer) return;
    
    this.timer = setInterval(() => {
      this.checkPendingStops();
    }, this.config.intervalMs);
    
    console.log(`[StopWatcher] Started with ${this.config.intervalMs}ms interval`);
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
      console.log('[StopWatcher] Stopped');
    }
  }

  updateConfig(config: Partial<StopWatcherConfig>): void {
    this.config = { ...this.config, ...config };
    
    if (this.config.enabled && !this.timer) {
      this.start();
    } else if (!this.config.enabled && this.timer) {
      this.stop();
    }
  }

  private checkPendingStops(): void {
    try {
      const orders = paperEngine.getOrders();
      const pendingStops = orders.filter(order => 
        (order.type === 'STOP_MARKET' || order.type === 'STOP_LIMIT') && 
        order.status === 'pending' &&
        !this.inFlight.has(order.id)
      );

      for (const order of pendingStops) {
        if (!order.stopPrice) continue;
        
        const lastPrice = paperEngine.getCurrentPrice();
        if (!lastPrice || lastPrice <= 0) continue;

        const triggered = triggerStop(order.side, order.stopPrice, lastPrice);
        
        if (triggered) {
          this.inFlight.add(order.id);
          
          try {
            // Convert STOP order to MARKET/LIMIT
            const convertedOrder = {
              symbol: order.symbol,
              side: order.side,
              type: order.type === 'STOP_MARKET' ? 'MARKET' : 'LIMIT',
              quantity: order.quantity - order.filledQuantity,
              price: order.type === 'STOP_LIMIT' ? order.price : undefined,
              tif: 'IOC' // Immediate execution
            };

            const result = paperEngine.placeOrder(convertedOrder);
            
            // Update original order status
            order.status = result.status;
            order.filledQuantity = result.filledQuantity;
            order.updatedAt = Date.now();
            
            // Increment metric
            sparkPaperStopsTriggeredTotal.inc({ 
              type: order.type, 
              symbol: order.symbol 
            });
            
            console.log(`[StopWatcher] Triggered ${order.type} ${order.symbol} at ${lastPrice}`);
          } catch (error) {
            console.error(`[StopWatcher] Error processing triggered order ${order.id}:`, error);
          } finally {
            this.inFlight.delete(order.id);
          }
        }
      }
    } catch (error) {
      console.error('[StopWatcher] Error checking pending stops:', error);
    }
  }
}

export const stopWatcher = new StopWatcher();
export default stopWatcher; 