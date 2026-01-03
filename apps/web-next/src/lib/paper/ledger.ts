/**
 * Paper Ledger - In-memory simulation ledger
 *
 * Minimal ama doğru "paper ledger" şeması:
 * - cashBalance
 * - positions: { symbol -> { qty, avgPrice } }
 * - fills: [{ts, symbol, side, qty, price, fee}]
 * - pnl: { unrealized, realized }
 *
 * Dev/demo için in-memory singleton. İleride DB'ye taşınabilir.
 */

export interface PaperPosition {
  symbol: string;
  qty: number;
  avgPrice: number;
}

export interface PaperFill {
  ts: number;
  symbol: string;
  side: 'buy' | 'sell';
  qty: number;
  price: number;
  fee: number;
  notional: number;
}

export interface PaperPnL {
  unrealized: number;
  realized: number;
  total: number;
}

export interface PaperLedgerState {
  cashBalance: number;
  positions: Record<string, PaperPosition>;
  fills: PaperFill[];
  pnl: PaperPnL;
}

class PaperLedger {
  // Deterministic starting values (smoke/QA tekrarlanabilirliği için)
  private readonly INITIAL_CASH = 10000; // $10,000 USDT
  private readonly FEE_BPS = 10; // 0.1% fee (10 basis points)
  private readonly SLIPPAGE_BPS = 0; // 0% slippage (opsiyonel, şimdilik 0)

  private state: PaperLedgerState = {
    cashBalance: this.INITIAL_CASH,
    positions: {},
    fills: [],
    pnl: {
      unrealized: 0,
      realized: 0,
      total: 0,
    },
  };

  private feeBps = this.FEE_BPS;
  private slippageBps = this.SLIPPAGE_BPS;

  /**
   * Get current ledger state
   */
  getState(): PaperLedgerState {
    // Recalculate unrealized PnL based on current positions
    const unrealized = this.calculateUnrealizedPnL();
    return {
      ...this.state,
      pnl: {
        ...this.state.pnl,
        unrealized,
        total: this.state.pnl.realized + unrealized,
      },
    };
  }

  /**
   * Reset ledger to initial state
   * 
   * Deterministic reset: her zaman aynı başlangıç durumuna döner (smoke/QA için).
   */
  reset(initialCash?: number): void {
    this.state = {
      cashBalance: initialCash ?? this.INITIAL_CASH,
      positions: {},
      fills: [],
      pnl: {
        unrealized: 0,
        realized: 0,
        total: 0,
      },
    };
  }

  /**
   * Simulate market order
   *
   * @param symbol - Trading symbol (e.g., "BTCUSDT")
   * @param side - "buy" or "sell"
   * @param qty - Quantity to trade
   * @param marketPrice - Current market price (from Market Data step)
   */
  simulateMarketOrder(
    symbol: string,
    side: 'buy' | 'sell',
    qty: number,
    marketPrice: number
  ): PaperFill {
    // Apply slippage (opsiyonel, şimdilik 0)
    const fillPrice = marketPrice * (1 + (side === 'buy' ? 1 : -1) * (this.slippageBps / 10000));

    // Calculate notional and fee
    const notional = qty * fillPrice;
    const fee = notional * (this.feeBps / 10000);

    // Update cash balance
    if (side === 'buy') {
      // Buy: reduce cash
      this.state.cashBalance -= (notional + fee);
    } else {
      // Sell: increase cash
      this.state.cashBalance += (notional - fee);
    }

    // Update positions
    const currentPosition = this.state.positions[symbol] || { symbol, qty: 0, avgPrice: 0 };

    if (side === 'buy') {
      // Buy: increase position
      const newQty = currentPosition.qty + qty;
      const newAvgPrice = currentPosition.qty === 0
        ? fillPrice
        : (currentPosition.qty * currentPosition.avgPrice + qty * fillPrice) / newQty;

      this.state.positions[symbol] = {
        symbol,
        qty: newQty,
        avgPrice: newAvgPrice,
      };
    } else {
      // Sell: decrease position
      const newQty = currentPosition.qty - qty;

      if (newQty <= 0) {
        // Position closed or reversed
        if (newQty < 0) {
          // Reversed position (short)
          this.state.positions[symbol] = {
            symbol,
            qty: newQty,
            avgPrice: fillPrice,
          };
        } else {
          // Position closed
          delete this.state.positions[symbol];
        }

        // Calculate realized PnL
        const realizedPnL = (fillPrice - currentPosition.avgPrice) * qty - fee;
        this.state.pnl.realized += realizedPnL;
      } else {
        // Partial close
        this.state.positions[symbol] = {
          symbol,
          qty: newQty,
          avgPrice: currentPosition.avgPrice, // Avg price stays same on partial close
        };

        // Calculate realized PnL on closed portion
        const closedQty = qty;
        const realizedPnL = (fillPrice - currentPosition.avgPrice) * closedQty - fee;
        this.state.pnl.realized += realizedPnL;
      }
    }

    // Record fill
    const fill: PaperFill = {
      ts: Date.now(),
      symbol,
      side,
      qty,
      price: fillPrice,
      fee,
      notional,
    };

    this.state.fills.push(fill);

    return fill;
  }

  /**
   * Calculate unrealized PnL based on current positions and market prices
   *
   * Note: This requires current market prices. For now, returns 0.
   * In real implementation, market prices would be passed in.
   */
  private calculateUnrealizedPnL(): number {
    // TODO: Accept market prices parameter and calculate unrealized PnL
    // For now, return 0 (positions exist but unrealized PnL not calculated)
    return 0;
  }

  /**
   * Update unrealized PnL with current market prices
   */
  updateUnrealizedPnL(marketPrices: Record<string, number>): void {
    let unrealized = 0;

    for (const [symbol, position] of Object.entries(this.state.positions)) {
      const currentPrice = marketPrices[symbol];
      if (currentPrice && position.qty !== 0) {
        unrealized += (currentPrice - position.avgPrice) * position.qty;
      }
    }

    this.state.pnl.unrealized = unrealized;
    this.state.pnl.total = this.state.pnl.realized + unrealized;
  }
}

// Singleton instance
export const paperLedger = new PaperLedger();

