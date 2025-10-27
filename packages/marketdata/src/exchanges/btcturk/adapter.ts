/**
 * BTCTurk Data Adapter
 * Normalizes BTCTurk data to Spark Trading Platform format
 */

import type { 
  NormalizedTrade, 
  OrderBookDelta, 
  NormalizedTicker,
  BTCTurkRawTrade,
  BTCTurkRawOrderBook,
  BTCTurkRawTicker,
  BTCTurkWSMessage
} from './types.js';
import { 
  marketdataNormalizedTradesTotal,
  marketdataNormalizedOrderbookTotal,
  marketdataNormalizedTickerTotal,
  btcturkErrorsTotal
} from './metrics.js';

export class BTCTurkAdapter {
  private exchange = 'btcturk' as const;

  /**
   * Normalize BTCTurk trade data
   */
  normalizeTrade(raw: BTCTurkRawTrade, symbol: string): NormalizedTrade {
    try {
      const trade: NormalizedTrade = {
        ts: parseInt(raw.time),
        symbol,
        side: raw.side.toLowerCase() as 'buy' | 'sell',
        price: parseFloat(raw.price),
        qty: parseFloat(raw.quantity),
        exchange: this.exchange
      };

      marketdataNormalizedTradesTotal.inc({ exchange: this.exchange, symbol });
      return trade;
    } catch (error) {
      btcturkErrorsTotal.inc({ type: 'normalize_trade', symbol });
      throw new Error(`Failed to normalize trade: ${error}`);
    }
  }

  /**
   * Normalize BTCTurk orderbook data
   */
  normalizeOrderBook(raw: BTCTurkRawOrderBook, symbol: string): OrderBookDelta {
    try {
      const orderbook: OrderBookDelta = {
        ts: raw.timestamp,
        symbol,
        bids: raw.bids.map(([price, qty]) => [parseFloat(price), parseFloat(qty)]),
        asks: raw.asks.map(([price, qty]) => [parseFloat(price), parseFloat(qty)]),
        exchange: this.exchange
      };

      marketdataNormalizedOrderbookTotal.inc({ exchange: this.exchange, symbol });
      return orderbook;
    } catch (error) {
      btcturkErrorsTotal.inc({ type: 'normalize_orderbook', symbol });
      throw new Error(`Failed to normalize orderbook: ${error}`);
    }
  }

  /**
   * Normalize BTCTurk ticker data
   */
  normalizeTicker(raw: BTCTurkRawTicker): NormalizedTicker {
    try {
      const ticker: NormalizedTicker = {
        ts: raw.timestamp,
        symbol: raw.pair,
        price: parseFloat(raw.price),
        volume24h: parseFloat(raw.volume),
        change24h: parseFloat(raw.change),
        exchange: this.exchange
      };

      marketdataNormalizedTickerTotal.inc({ exchange: this.exchange, symbol: raw.pair });
      return ticker;
    } catch (error) {
      btcturkErrorsTotal.inc({ type: 'normalize_ticker', symbol: raw.pair });
      throw new Error(`Failed to normalize ticker: ${error}`);
    }
  }

  /**
   * Process WebSocket message
   */
  processWSMessage(message: BTCTurkWSMessage): NormalizedTrade | OrderBookDelta | NormalizedTicker | null {
    try {
      switch (message.type) {
        case 'trades':
          return this.normalizeTrade(message.data, message.symbol);
        case 'orderbook':
          return this.normalizeOrderBook(message.data, message.symbol);
        case 'ticker':
          return this.normalizeTicker(message.data);
        default:
          btcturkErrorsTotal.inc({ type: 'unknown_message_type', symbol: message.symbol });
          return null;
      }
    } catch (error) {
      btcturkErrorsTotal.inc({ type: 'process_ws_message', symbol: message.symbol });
      return null;
    }
  }

  /**
   * Validate normalized data
   */
  validateTrade(trade: NormalizedTrade): boolean {
    return (
      trade.ts > 0 &&
      trade.symbol.length > 0 &&
      ['buy', 'sell'].includes(trade.side) &&
      trade.price > 0 &&
      trade.qty > 0 &&
      trade.exchange === this.exchange
    );
  }

  validateOrderBook(orderbook: OrderBookDelta): boolean {
    return (
      orderbook.ts > 0 &&
      orderbook.symbol.length > 0 &&
      Array.isArray(orderbook.bids) &&
      Array.isArray(orderbook.asks) &&
      orderbook.exchange === this.exchange
    );
  }

  validateTicker(ticker: NormalizedTicker): boolean {
    return (
      ticker.ts > 0 &&
      ticker.symbol.length > 0 &&
      ticker.price > 0 &&
      ticker.volume24h >= 0 &&
      ticker.exchange === this.exchange
    );
  }
}
