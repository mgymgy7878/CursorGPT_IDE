"use client";
import { useMarketTicker } from "@/hooks/useMarketTicker";
import { useMarketDataHealth, getWsState } from "@/hooks/useMarketDataHealth";
import KpiGrid from "./KpiGrid";
import { formatNumber } from "@/lib/format";

interface MarketKpisProps {
  symbol?: string;
}

/**
 * MarketKpis - Feed'den gelen market KPI'ları (executor'dan bağımsız)
 * - Last Price
 * - 24h %
 * - 24h Volume
 * - Feed Freshness (now-ts)
 */
export default function MarketKpis({ symbol = "BTCUSDT" }: MarketKpisProps) {
  const { ticker, loading, error } = useMarketTicker(symbol);
  const { health: marketDataHealth } = useMarketDataHealth();

  // P7.1: WS state mapping'i tek helper'dan kullan (güvenli wrapper)
  let wsStateInfo;
  try {
    wsStateInfo = getWsState(marketDataHealth);
  } catch (e) {
    console.error("[MarketKpis] getWsState error:", e);
    // Fallback: basit mapping
    wsStateInfo = {
      state: marketDataHealth.wsConnected
        ? "CONNECTED"
        : ("DISCONNECTED" as const),
      label: marketDataHealth.wsConnected ? "CONNECTED" : "DISCONNECTED",
      color: marketDataHealth.wsConnected ? "success" : ("danger" as const),
    };
  }

  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="rounded-2xl border border-white/10 bg-neutral-900/70 p-4 animate-pulse"
          >
            <div className="h-4 bg-neutral-800 rounded mb-2" />
            <div className="h-6 bg-neutral-800 rounded" />
          </div>
        ))}
      </div>
    );
  }

  // P6: Kanal bazlı feed durumu - sadece hepsi öldüğünde "Feed yok" demek
  const tickerOk =
    !error &&
    !!ticker &&
    ticker.lastUpdate &&
    Date.now() - ticker.lastUpdate < 30000; // 30s içinde güncellenmişse OK
  const tickerStale =
    !error &&
    !!ticker &&
    ticker.lastUpdate &&
    Date.now() - ticker.lastUpdate >= 30000 &&
    Date.now() - ticker.lastUpdate < 60000; // 30-60s arası STALE

  // P7.1: WS state mapping'i tek helper'dan kullan (yukarıda try-catch ile alındı)
  const wsState = wsStateInfo.state;

  // P7.3: Kanal yaşları
  const tickerAgeMs = ticker?.lastUpdate
    ? Date.now() - ticker.lastUpdate
    : null;
  const wsAgeMs = marketDataHealth.ageMs;
  const candlesOk =
    marketDataHealth.status === "healthy" ||
    marketDataHealth.status === "lagging";

  // Sadece tüm kanallar öldüğünde "Feed yok" demek
  const allChannelsDead =
    !tickerOk &&
    !tickerStale &&
    wsState === "DISCONNECTED" &&
    marketDataHealth.ageMs > 30000 &&
    !candlesOk;

  if (allChannelsDead) {
    return (
      <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-center text-sm text-red-400">
        Feed yok • Piyasa verisi alınamıyor
      </div>
    );
  }

  // Ticker yoksa (loading bitti, hata yok ama veri henüz gelmedi) placeholder
  if (!ticker) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="rounded-2xl border border-white/10 bg-neutral-900/70 p-4 text-center text-sm text-neutral-400">
          Henüz veri yok
        </div>
      </div>
    );
  }

  // NOT: "Market Data: DEGRADED" büyük kartı kaldırıldı (North-Star refactor)
  // Degraded durum bilgisi artık SystemHealthCard'da gösteriliyor
  // Burada sadece KPI grid'i gösteriyoruz (normal durumda)

  const freshnessAge = ticker.lastUpdate
    ? Math.floor((Date.now() - ticker.lastUpdate) / 1000)
    : null;
  const freshnessColor =
    freshnessAge === null
      ? "text-neutral-400"
      : freshnessAge < 3
        ? "text-emerald-400"
        : freshnessAge < 15
          ? "text-amber-400"
          : "text-red-400";

  // P7.2: Lag metriği - ingest_ms - lastTradeTime_ms
  // lastTradeTime: Binance avgPrice closeTime (Last trade time) - lag metriği için
  // asOfMs: Sistemin veriyi aldığı zaman (ingest time)
  const lastTradeTime = ticker.lastTradeTime; // P7.2: avgPrice closeTime (Last trade time)
  const asOfMs = ticker.asOfMs || ticker.lastUpdate;
  const lagMs = lastTradeTime && asOfMs ? asOfMs - lastTradeTime : null;
  const lagText = lagMs !== null ? `${lagMs}ms` : null;

  // Trade time (UTC) - lastTradeTime kullanıyoruz (avgPrice closeTime)
  const tradeTime =
    lastTradeTime || (ticker.lastUpdate ? ticker.lastUpdate : null);

  const cards = [
    {
      label: "Last Price",
      value: `$${formatNumber(ticker.price, { locale: "tr-TR", maximumFractionDigits: 2 })}`,
      trend:
        ticker.change24h != null
          ? `${ticker.change24h >= 0 ? "+" : ""}${ticker.change24h.toFixed(2)}%`
          : undefined,
      subtext: lagText ? `Lag: ${lagText}` : undefined, // P5.2: Lag metriği
      lastUpdatedAt: asOfMs, // Feed asOf (ingest time)
      tradeTime: tradeTime, // Trade time (UTC) - eventTime
      source: "feed/binance",
      refreshInterval: 1,
      dataType: "lastTrade",
      timezone: "Local" as const,
    },
    {
      label: "24h Change",
      value:
        ticker.change24h != null
          ? `${ticker.change24h >= 0 ? "+" : ""}${ticker.change24h.toFixed(2)}%`
          : "—",
      trend:
        ticker.high24h && ticker.low24h
          ? `H: $${formatNumber(ticker.high24h, { locale: "tr-TR", maximumFractionDigits: 0 })} L: $${formatNumber(ticker.low24h, { locale: "tr-TR", maximumFractionDigits: 0 })}`
          : undefined,
      lastUpdatedAt: ticker.lastUpdate, // Feed asOf
      tradeTime: tradeTime, // Trade time (UTC)
      source: "feed/binance",
      refreshInterval: 1,
      dataType: "lastTrade",
      timezone: "Local" as const,
    },
    {
      label: "24h Volume",
      value:
        ticker.volume24h != null
          ? `$${formatNumber(ticker.volume24h / 1_000_000, { locale: "tr-TR", maximumFractionDigits: 1 })}M`
          : "—",
      lastUpdatedAt: ticker.lastUpdate, // Feed asOf
      tradeTime: tradeTime, // Trade time (UTC)
      source: "feed/binance",
      refreshInterval: 1,
      dataType: "lastTrade",
      timezone: "Local" as const,
    },
    {
      label: "Feed Freshness",
      value:
        freshnessAge !== null
          ? freshnessAge < 60
            ? `${freshnessAge}s`
            : `${Math.floor(freshnessAge / 60)}m`
          : "—",
      trend:
        freshnessAge !== null
          ? freshnessAge < 3
            ? "LIVE"
            : freshnessAge < 15
              ? "STALE"
              : "OFFLINE"
          : undefined,
      lastUpdatedAt: ticker.lastUpdate, // Feed asOf
      tradeTime: tradeTime, // Trade time (UTC)
      source: "feed/binance",
      refreshInterval: 1,
      dataType: "lastTrade",
      timezone: "Local" as const,
    },
  ];

  return <KpiGrid cards={cards} />;
}
