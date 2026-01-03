/**
 * Binance Spot Client - Read-only data layer
 *
 * Testnet ve mainnet base URL seçimi:
 * - testnet: https://testnet.binance.vision/api
 * - mainnet: https://api.binance.com
 *
 * Prod guard: sparkMode=prod iken testnet baseUrl kullanılmaz (assert).
 */

import { getSparkMode, getExchangeNetwork } from '@/lib/spark/config';

export type BinanceNetwork = 'testnet' | 'mainnet';

/**
 * getBinanceSpotBaseUrl - Binance Spot API base URL
 *
 * Spark mode ve exchange network'e göre doğru base URL'i döndürür.
 * Prod guard: prod modunda testnet URL kullanılmaz.
 */
export function getBinanceSpotBaseUrl(): string {
  const mode = getSparkMode();
  const network = getExchangeNetwork();

  // Prod guard: prod modunda testnet URL kullanılmaz (controlled error, assert değil)
  if (mode === 'prod') {
    if (network === 'testnet') {
      // Assert yerine controlled error (prod'da crash olmasın)
      console.error('[Binance] Prod mode cannot use testnet URL - falling back to mainnet');
      // Audit log için: ileride audit service'e gönderilebilir
      return 'https://api.binance.com'; // Fallback to mainnet
    }
    return 'https://api.binance.com';
  }

  // Testnet veya paper mode
  if (network === 'testnet' || mode === 'testnet') {
    return 'https://testnet.binance.vision/api';
  }

  // Default: mainnet
  return 'https://api.binance.com';
}

/**
 * BinanceSpotClient - Read-only Binance Spot API client
 *
 * Sadece read-only endpoint'ler: exchangeInfo, klines, ticker
 */
export class BinanceSpotClient {
  private baseUrl: string;
  private timeout: number;
  private requestId?: string;

  constructor(options?: { timeout?: number; requestId?: string }) {
    this.baseUrl = getBinanceSpotBaseUrl();
    this.timeout = options?.timeout || 5000;
    this.requestId = options?.requestId;
  }

  /**
   * Normalize interval - Binance format'a çevir
   * UI tarafında "1min" gibi değerler varsa "1m" gibi Binance format'ına dönüştür
   */
  private normalizeInterval(interval: string): string {
    const mapping: Record<string, string> = {
      '1min': '1m',
      '5min': '5m',
      '15min': '15m',
      '1hour': '1h',
      '4hour': '4h',
      '1day': '1d',
    };
    return mapping[interval.toLowerCase()] || interval;
  }

  /**
   * Fetch klines (candlestick data)
   */
  async getKlines(params: {
    symbol: string;
    interval: string;
    limit?: number;
    startTime?: number;
    endTime?: number;
  }): Promise<any[]> {
    // Base URL kontrolü: çift /api olmamalı
    // testnet.binance.vision/api zaten /api içeriyor, /v3/klines ekleniyor
    const apiPath = this.baseUrl.endsWith('/api') 
      ? `${this.baseUrl}/v3/klines`
      : `${this.baseUrl}/api/v3/klines`;
    
    const url = new URL(apiPath);
    url.searchParams.set('symbol', params.symbol.toUpperCase());
    url.searchParams.set('interval', this.normalizeInterval(params.interval));
    if (params.limit) url.searchParams.set('limit', String(params.limit));
    if (params.startTime) url.searchParams.set('startTime', String(params.startTime));
    if (params.endTime) url.searchParams.set('endTime', String(params.endTime));

    const headers: HeadersInit = {
      'Accept': 'application/json',
    };
    if (this.requestId) {
      headers['X-Request-ID'] = this.requestId;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers,
        signal: controller.signal,
        cache: 'no-store',
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        throw new Error(`Binance API error ${response.status}: ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(`Binance API timeout after ${this.timeout}ms`);
      }
      throw error;
    }
  }

  /**
   * Fetch exchange info
   */
  async getExchangeInfo(): Promise<any> {
    // Base URL kontrolü: çift /api olmamalı
    const apiPath = this.baseUrl.endsWith('/api')
      ? `${this.baseUrl}/v3/exchangeInfo`
      : `${this.baseUrl}/api/v3/exchangeInfo`;
    
    const url = new URL(apiPath);

    const headers: HeadersInit = {
      'Accept': 'application/json',
    };
    if (this.requestId) {
      headers['X-Request-ID'] = this.requestId;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers,
        signal: controller.signal,
        cache: 'no-store',
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Binance API error ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(`Binance API timeout after ${this.timeout}ms`);
      }
      throw error;
    }
  }

  /**
   * Fetch 24h ticker
   */
  async getTicker24h(symbol?: string): Promise<any> {
    // Base URL kontrolü: çift /api olmamalı
    const apiPath = this.baseUrl.endsWith('/api')
      ? `${this.baseUrl}/v3/ticker/24hr`
      : `${this.baseUrl}/api/v3/ticker/24hr`;
    
    const url = new URL(apiPath);
    if (symbol) {
      url.searchParams.set('symbol', symbol.toUpperCase());
    }

    const headers: HeadersInit = {
      'Accept': 'application/json',
    };
    if (this.requestId) {
      headers['X-Request-ID'] = this.requestId;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers,
        signal: controller.signal,
        cache: 'no-store',
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Binance API error ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(`Binance API timeout after ${this.timeout}ms`);
      }
      throw error;
    }
  }
}

