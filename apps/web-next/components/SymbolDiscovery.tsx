"use client";
import { useState, useEffect } from "react";

interface DiscoveredSymbol {
  symbol: string;
  baseAsset: string;
  quoteAsset: string;
  status: string;
  baseAssetPrecision: number;
  quoteAssetPrecision: number;
  filters: {
    priceFilter?: {
      minPrice: string;
      maxPrice: string;
      tickSize: string;
    };
    lotSize?: {
      minQty: string;
      maxQty: string;
      stepSize: string;
    };
    minNotional?: {
      minNotional: string;
    };
  };
}

export default function SymbolDiscovery() {
  const [symbols, setSymbols] = useState<DiscoveredSymbol[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  async function loadSymbols() {
    try {
      setLoading(true);
      const r = await fetch("/api/private/symbols");
      const data = await r.json();
      if (r.ok) {
        setSymbols(data.data || []);
        setLastUpdate(new Date());
      } else {
        console.error('Failed to load symbols:', data.error);
      }
    } catch (e) {
      console.error('Symbol discovery error:', e);
    } finally {
      setLoading(false);
    }
  }

  async function syncSymbols() {
    try {
      setSyncing(true);
      const r = await fetch("/api/private/symbols/sync", { method: "POST" });
      const data = await r.json();
      if (r.ok) {
        alert("Symbols synced successfully!");
        loadSymbols(); // Reload after sync
      } else {
        alert(`Sync failed: ${data.error}`);
      }
    } catch (e) {
      alert(`Sync error: ${e}`);
    } finally {
      setSyncing(false);
    }
  }

  useEffect(() => {
    loadSymbols();
  }, []);

  const tradingSymbols = symbols.filter(s => s.status === 'TRADING');
  const usdtSymbols = tradingSymbols.filter(s => s.quoteAsset === 'USDT');

  return (
    <div className="p-4 rounded-xl border bg-blue-50 border-blue-200">
      <div className="flex justify-between items-center mb-4">
        <div className="font-semibold text-blue-800">Symbol Discovery</div>
        <div className="flex gap-2">
          <button
            onClick={loadSymbols}
            disabled={loading}
            className={`px-3 py-1 text-sm rounded ${
              loading
                ? 'bg-gray-300 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {loading ? 'Loading...' : 'Refresh'}
          </button>
          <button
            onClick={syncSymbols}
            disabled={syncing}
            className={`px-3 py-1 text-sm rounded ${
              syncing
                ? 'bg-gray-300 cursor-not-allowed'
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
          >
            {syncing ? 'Syncing...' : 'Auto-Sync'}
          </button>
        </div>
      </div>

      {lastUpdate && (
        <div className="text-sm text-gray-600 mb-3">
          Last updated: {lastUpdate.toLocaleString()}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-white p-3 rounded border">
          <div className="text-sm font-medium text-gray-700">Total Symbols</div>
          <div className="text-2xl font-bold text-blue-600">{symbols.length}</div>
        </div>
        <div className="bg-white p-3 rounded border">
          <div className="text-sm font-medium text-gray-700">Trading</div>
          <div className="text-2xl font-bold text-green-600">{tradingSymbols.length}</div>
        </div>
        <div className="bg-white p-3 rounded border">
          <div className="text-sm font-medium text-gray-700">USDT Pairs</div>
          <div className="text-2xl font-bold text-purple-600">{usdtSymbols.length}</div>
        </div>
      </div>

      <div className="mt-4">
        <div className="font-medium text-gray-700 mb-2">Top USDT Symbols</div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse border border-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="border border-gray-200 px-3 py-2 text-left">Symbol</th>
                <th className="border border-gray-200 px-3 py-2 text-left">Base</th>
                <th className="border border-gray-200 px-3 py-2 text-left">Min Qty</th>
                <th className="border border-gray-200 px-3 py-2 text-left">Tick Size</th>
                <th className="border border-gray-200 px-3 py-2 text-left">Min Notional</th>
              </tr>
            </thead>
            <tbody>
              {usdtSymbols.slice(0, 10).map((symbol, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="border border-gray-200 px-3 py-2 font-medium">{symbol.symbol}</td>
                  <td className="border border-gray-200 px-3 py-2">{symbol.baseAsset}</td>
                  <td className="border border-gray-200 px-3 py-2">{symbol.filters.lotSize?.minQty || 'N/A'}</td>
                  <td className="border border-gray-200 px-3 py-2">{symbol.filters.priceFilter?.tickSize || 'N/A'}</td>
                  <td className="border border-gray-200 px-3 py-2">{symbol.filters.minNotional?.minNotional || 'N/A'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
} 