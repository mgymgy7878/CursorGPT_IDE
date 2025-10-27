"use client";
import { TrendingUp, TrendingDown, DollarSign, BarChart3, Gauge } from "lucide-react";

interface PortfolioSummaryProps {
  totalNotional: number;
  realizedPnl: number;
  unrealizedPnl: number;
  exposurePct: number;
  leverageEst: number;
}

export default function PortfolioSummary({ 
  totalNotional, 
  realizedPnl, 
  unrealizedPnl, 
  exposurePct, 
  leverageEst 
}: PortfolioSummaryProps) {
  const getPnlColor = (pnl: number) => {
    return pnl >= 0 ? "text-green-400" : "text-red-400";
  };

  const getExposureColor = (exposure: number) => {
    if (exposure > 80) return "text-red-400";
    if (exposure > 60) return "text-amber-400";
    if (exposure > 40) return "text-blue-400";
    return "text-green-400";
  };

  const getLeverageColor = (leverage: number) => {
    if (leverage > 5) return "text-red-400";
    if (leverage > 3) return "text-amber-400";
    if (leverage > 1.5) return "text-blue-400";
    return "text-green-400";
  };

  const getPnlIcon = (pnl: number) => {
    return pnl >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />;
  };

  return (
    <div className="p-6 rounded-2xl border border-zinc-700/50 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold">Portfolio Summary</h3>
        <DollarSign className="w-5 h-5 text-blue-400" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {/* Total Notional */}
        <div className="p-4 bg-neutral-800/30 rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <DollarSign className="w-4 h-4 text-blue-400" />
            <span className="text-sm text-neutral-400">Total Notional</span>
          </div>
          <div className="text-2xl font-bold text-white">
            ${totalNotional.toLocaleString()}
          </div>
        </div>

        {/* Realized P&L */}
        <div className="p-4 bg-neutral-800/30 rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <TrendingUp className="w-4 h-4 text-green-400" />
            <span className="text-sm text-neutral-400">Realized P&L</span>
          </div>
          <div className={`text-2xl font-bold ${getPnlColor(realizedPnl)}`}>
            <div className="flex items-center space-x-1">
              {getPnlIcon(realizedPnl)}
              <span>${realizedPnl.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Unrealized P&L */}
        <div className="p-4 bg-neutral-800/30 rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <TrendingUp className="w-4 h-4 text-purple-400" />
            <span className="text-sm text-neutral-400">Unrealized P&L</span>
          </div>
          <div className={`text-2xl font-bold ${getPnlColor(unrealizedPnl)}`}>
            <div className="flex items-center space-x-1">
              {getPnlIcon(unrealizedPnl)}
              <span>${unrealizedPnl.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Exposure % */}
        <div className="p-4 bg-neutral-800/30 rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <BarChart3 className="w-4 h-4 text-amber-400" />
            <span className="text-sm text-neutral-400">Exposure %</span>
          </div>
          <div className={`text-2xl font-bold ${getExposureColor(exposurePct)}`}>
            {exposurePct.toFixed(1)}%
          </div>
        </div>

        {/* Leverage Est */}
        <div className="p-4 bg-neutral-800/30 rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <Gauge className="w-4 h-4 text-red-400" />
            <span className="text-sm text-neutral-400">Leverage Est</span>
          </div>
          <div className={`text-2xl font-bold ${getLeverageColor(leverageEst)}`}>
            {leverageEst.toFixed(2)}x
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="mt-6 p-4 bg-neutral-800/20 rounded-lg">
        <h4 className="text-sm font-medium mb-3">Portfolio Health</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-neutral-400">Total P&L:</span>
            <span className={`ml-2 font-medium ${getPnlColor(realizedPnl + unrealizedPnl)}`}>
              ${(realizedPnl + unrealizedPnl).toFixed(2)}
            </span>
          </div>
          <div>
            <span className="text-neutral-400">Exposure Level:</span>
            <span className={`ml-2 font-medium ${getExposureColor(exposurePct)}`}>
              {exposurePct > 80 ? "High" : exposurePct > 60 ? "Medium" : "Low"}
            </span>
          </div>
          <div>
            <span className="text-neutral-400">Leverage Risk:</span>
            <span className={`ml-2 font-medium ${getLeverageColor(leverageEst)}`}>
              {leverageEst > 5 ? "High" : leverageEst > 3 ? "Medium" : "Low"}
            </span>
          </div>
          <div>
            <span className="text-neutral-400">Portfolio Status:</span>
            <span className={`ml-2 font-medium ${
              (realizedPnl + unrealizedPnl) >= 0 && exposurePct < 80 && leverageEst < 3 
                ? "text-green-400" : "text-amber-400"
            }`}>
              {(realizedPnl + unrealizedPnl) >= 0 && exposurePct < 80 && leverageEst < 3 
                ? "Healthy" : "Monitor"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
} 