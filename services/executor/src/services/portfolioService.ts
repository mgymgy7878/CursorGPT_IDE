// services/executor/src/services/portfolioService.ts
import type { PortfolioResponse, PortfolioAccount, AssetRow } from '../types/portfolio.js';
import * as binance from '../connectors/binance.js';
import * as btcturk from '../connectors/btcturk.js';
import { recordPortfolioRefresh, updatePortfolioMetrics } from '../metrics/portfolio.js';

/**
 * USD/TRY kuru için basit bir tahmin (gerçek production'da forex API kullanılmalı)
 */
const USD_TRY_RATE = 33.5;

interface BinanceBalance {
  asset: string;
  free: string;
  locked: string;
}

interface BTCTurkBalance {
  asset: string;
  assetname: string;
  balance: string;
  locked: string;
  free: string;
}

/**
 * Binance hesap bakiyesini alır ve PortfolioAccount formatına dönüştürür
 */
async function fetchBinanceAccount(): Promise<PortfolioAccount | null> {
  const startTime = Date.now();
  
  try {
    // API key kontrolü
    if (!process.env.BINANCE_API_KEY || !process.env.BINANCE_API_SECRET) {
      console.log('[Portfolio] Binance API credentials not configured, skipping...');
      return null;
    }

    const accountInfo = await binance.getAccountBalances();
    const balances: BinanceBalance[] = accountInfo.balances || [];
    
    // Tüm fiyatları bir kerede çek
    const allPrices = await binance.getAllTickerPrices();
    const priceMap = new Map<string, number>();
    for (const p of allPrices) {
      if (p.symbol && p.price) {
        priceMap.set(p.symbol, parseFloat(p.price));
      }
    }

    const assetRows: AssetRow[] = [];
    let totalUsd = 0;

    for (const bal of balances) {
      const amount = parseFloat(bal.free) + parseFloat(bal.locked);
      if (amount <= 0) continue; // Boş bakiyeleri atla

      const asset = bal.asset;
      let priceUsd = 0;
      let valueUsd = 0;

      if (asset === 'USDT' || asset === 'USDC' || asset === 'BUSD') {
        // Stablecoin'ler için fiyat 1 USD
        priceUsd = 1;
        valueUsd = amount;
      } else {
        // Diğer asset'ler için USDT paritesini ara
        const symbol = `${asset}USDT`;
        const price = priceMap.get(symbol);
        if (price) {
          priceUsd = price;
          valueUsd = amount * price;
        } else {
          // Fiyat bulunamazsa sadece miktarı kaydet
          valueUsd = 0;
        }
      }

      totalUsd += valueUsd;

      assetRows.push({
        asset,
        amount,
        priceUsd: priceUsd > 0 ? priceUsd : undefined,
        valueUsd: valueUsd > 0 ? valueUsd : undefined,
      });
    }

    // Bakiye büyüklüğüne göre sırala (büyükten küçüğe)
    assetRows.sort((a, b) => (b.valueUsd || 0) - (a.valueUsd || 0));

    // Metrics kaydet
    recordPortfolioRefresh('binance', startTime, true);
    updatePortfolioMetrics('binance', totalUsd, assetRows.length);

    return {
      exchange: 'binance',
      currency: 'USD',
      totals: { totalUsd },
      balances: assetRows,
    };
  } catch (err: any) {
    console.error('[Portfolio] Binance fetch error:', err.message);
    recordPortfolioRefresh('binance', startTime, false, err);
    return null;
  }
}

/**
 * BTCTurk hesap bakiyesini alır ve PortfolioAccount formatına dönüştürür
 */
async function fetchBTCTurkAccount(): Promise<PortfolioAccount | null> {
  const startTime = Date.now();
  
  try {
    // API key kontrolü
    if (!process.env.BTCTURK_API_KEY || !process.env.BTCTURK_API_SECRET_BASE64) {
      console.log('[Portfolio] BTCTurk API credentials not configured, skipping...');
      return null;
    }

    const balanceData = await btcturk.getAccountBalances();
    const balances: BTCTurkBalance[] = balanceData.data || [];

    // Tüm ticker fiyatlarını çek
    const tickers = await btcturk.getAllTickers();
    const tickerData = tickers.data || [];
    const priceMap = new Map<string, number>();
    
    for (const t of tickerData) {
      if (t.pair && t.last) {
        priceMap.set(t.pair, parseFloat(t.last));
      }
    }

    // USDTTRY kurunu al (USD hesaplamaları için)
    const usdtTryPrice = priceMap.get('USDTTRY') || USD_TRY_RATE;

    const assetRows: AssetRow[] = [];
    let totalTry = 0;
    let totalUsd = 0;

    for (const bal of balances) {
      const amount = parseFloat(bal.free) + parseFloat(bal.locked);
      if (amount <= 0) continue;

      const asset = bal.asset;
      let priceUsd = 0;
      let valueUsd = 0;
      let valueTry = 0;

      if (asset === 'TRY') {
        // TRY için direkt hesaplama
        valueTry = amount;
        priceUsd = 1 / usdtTryPrice;
        valueUsd = amount / usdtTryPrice;
      } else if (asset === 'USDT') {
        // USDT için
        priceUsd = 1;
        valueUsd = amount;
        valueTry = amount * usdtTryPrice;
      } else {
        // Diğer kripto paralar için önce TRY paritesini bul
        const pairTry = `${asset}TRY`;
        const priceTry = priceMap.get(pairTry);
        
        if (priceTry) {
          valueTry = amount * priceTry;
          priceUsd = priceTry / usdtTryPrice;
          valueUsd = valueTry / usdtTryPrice;
        }
      }

      totalTry += valueTry;
      totalUsd += valueUsd;

      assetRows.push({
        asset,
        amount,
        priceUsd: priceUsd > 0 ? priceUsd : undefined,
        valueUsd: valueUsd > 0 ? valueUsd : undefined,
      });
    }

    // Bakiye büyüklüğüne göre sırala
    assetRows.sort((a, b) => (b.valueUsd || 0) - (a.valueUsd || 0));

    // Metrics kaydet
    recordPortfolioRefresh('btcturk', startTime, true);
    updatePortfolioMetrics('btcturk', totalUsd, assetRows.length);

    return {
      exchange: 'btcturk',
      currency: 'TRY',
      totals: { totalUsd, totalTry },
      balances: assetRows,
    };
  } catch (err: any) {
    console.error('[Portfolio] BTCTurk fetch error:', err.message);
    recordPortfolioRefresh('btcturk', startTime, false, err);
    return null;
  }
}

/**
 * Tüm exchange'lerden portföy bilgilerini toplar
 */
export async function fetchAllPortfolios(): Promise<PortfolioResponse> {
  const accounts: PortfolioAccount[] = [];

  // Paralel olarak tüm exchange'leri sorgula
  const [binanceAcc, btcturkAcc] = await Promise.all([
    fetchBinanceAccount(),
    fetchBTCTurkAccount(),
  ]);

  if (binanceAcc) accounts.push(binanceAcc);
  if (btcturkAcc) accounts.push(btcturkAcc);

  return {
    accounts,
    updatedAt: new Date().toISOString(),
  };
}

