"use client";
import React, { useState, useRef, useEffect } from 'react';
import { TrendingUp, TrendingDown, Target, Shield, X } from 'lucide-react';

interface ChartTradingProps {
  symbol: string;
  currentPrice: number;
  onOrder: (type: 'buy' | 'sell', price: number, quantity: number, orderType: 'market' | 'limit') => void;
}

export default function ChartTrading({ symbol, currentPrice, onOrder }: ChartTradingProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragPrice, setDragPrice] = useState(currentPrice);
  const [quantity, setQuantity] = useState(0.01);
  const [orderType, setOrderType] = useState<'market' | 'limit'>('limit');
  const [showQuickActions, setShowQuickActions] = useState(false);
  const chartRef = useRef<HTMLDivElement>(null);

  // Drag price level on chart
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setShowQuickActions(true);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !chartRef.current) return;

    const rect = chartRef.current.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const height = rect.height;
    const priceRange = currentPrice * 0.1; // 10% range
    const newPrice = currentPrice + (priceRange * (0.5 - y / height));
    setDragPrice(Math.max(0, newPrice));
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Quick order actions
  const handleQuickOrder = (type: 'buy' | 'sell') => {
    onOrder(type, orderType === 'market' ? currentPrice : dragPrice, quantity, orderType);
    setShowQuickActions(false);
  };

  // TP/SL quick actions
  const handleTPSL = (type: 'tp' | 'sl', percentage: number) => {
    const targetPrice = type === 'tp'
      ? currentPrice * (1 + percentage / 100)
      : currentPrice * (1 - percentage / 100);
    setDragPrice(targetPrice);
  };

  return (
    <div className="relative">
      {/* Chart Area */}
      <div
        ref={chartRef}
        className="h-64 bg-neutral-900 border border-neutral-700 rounded-lg cursor-crosshair relative"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Price Level Line */}
        <div
          className="absolute left-0 right-0 h-0.5 bg-blue-500 z-10"
          style={{
            top: `${50 + ((currentPrice - dragPrice) / currentPrice) * 100}%`
          }}
        >
          <div className="absolute -top-2 -left-2 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
            <div className="w-2 h-2 bg-white rounded-full" />
          </div>
          <div className="absolute -top-8 -left-8 bg-blue-500 text-white text-xs px-2 py-1 rounded">
            {dragPrice.toFixed(2)}
          </div>
        </div>

        {/* Current Price Line */}
        <div className="absolute left-0 right-0 h-0.5 bg-green-500 z-5" style={{ top: '50%' }}>
          <div className="absolute -top-2 -left-2 w-4 h-4 bg-green-500 rounded-full" />
          <div className="absolute -top-8 -left-8 bg-green-500 text-white text-xs px-2 py-1 rounded">
            {currentPrice.toFixed(2)}
          </div>
        </div>

        {/* Chart placeholder - would be replaced with actual chart */}
        <div className="absolute inset-0 flex items-center justify-center text-neutral-500">
          <div className="text-center">
            <div className="text-sm font-medium">{symbol} Chart</div>
            <div className="text-xs">Click and drag to set price level</div>
          </div>
        </div>
      </div>

      {/* Quick Actions Panel */}
      {showQuickActions && (
        <div className="absolute top-4 right-4 bg-neutral-800 border border-neutral-700 rounded-lg p-4 shadow-xl z-20 min-w-[280px]">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-white">Hızlı İşlem</h3>
            <button
              onClick={() => setShowQuickActions(false)}
              className="text-neutral-400 hover:text-white"
            >
              <X className="size-4" />
            </button>
          </div>

          {/* Order Type */}
          <div className="flex gap-2 mb-3">
            <button
              onClick={() => setOrderType('market')}
              className={`px-3 py-1 text-xs rounded ${
                orderType === 'market'
                  ? 'bg-blue-600 text-white'
                  : 'bg-neutral-700 text-neutral-300'
              }`}
            >
              Market
            </button>
            <button
              onClick={() => setOrderType('limit')}
              className={`px-3 py-1 text-xs rounded ${
                orderType === 'limit'
                  ? 'bg-blue-600 text-white'
                  : 'bg-neutral-700 text-neutral-300'
              }`}
            >
              Limit
            </button>
          </div>

          {/* Quantity */}
          <div className="mb-3">
            <label className="block text-xs text-neutral-400 mb-1">Miktar</label>
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(parseFloat(e.target.value) || 0)}
              className="w-full px-2 py-1 bg-neutral-700 border border-neutral-600 rounded text-sm text-white"
              step="0.01"
              min="0"
            />
          </div>

          {/* Price (for limit orders) */}
          {orderType === 'limit' && (
            <div className="mb-3">
              <label className="block text-xs text-neutral-400 mb-1">Fiyat</label>
              <input
                type="number"
                value={dragPrice.toFixed(2)}
                onChange={(e) => setDragPrice(parseFloat(e.target.value) || 0)}
                className="w-full px-2 py-1 bg-neutral-700 border border-neutral-600 rounded text-sm text-white"
                step="0.01"
                min="0"
              />
            </div>
          )}

          {/* Order Buttons */}
          <div className="flex gap-2 mb-3">
            <button
              onClick={() => handleQuickOrder('buy')}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded text-sm font-medium flex items-center justify-center gap-1"
            >
              <TrendingUp className="size-4" />
              Al
            </button>
            <button
              onClick={() => handleQuickOrder('sell')}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded text-sm font-medium flex items-center justify-center gap-1"
            >
              <TrendingDown className="size-4" />
              Sat
            </button>
          </div>

          {/* TP/SL Quick Buttons */}
          <div className="border-t border-neutral-700 pt-3">
            <div className="text-xs text-neutral-400 mb-2">Hızlı TP/SL</div>
            <div className="grid grid-cols-2 gap-1">
              <button
                onClick={() => handleTPSL('tp', 2)}
                className="px-2 py-1 bg-green-600/20 hover:bg-green-600/30 text-green-400 text-xs rounded flex items-center justify-center gap-1"
              >
                <Target className="size-3" />
                TP +2%
              </button>
              <button
                onClick={() => handleTPSL('tp', 5)}
                className="px-2 py-1 bg-green-600/20 hover:bg-green-600/30 text-green-400 text-xs rounded flex items-center justify-center gap-1"
              >
                <Target className="size-3" />
                TP +5%
              </button>
              <button
                onClick={() => handleTPSL('sl', 2)}
                className="px-2 py-1 bg-red-600/20 hover:bg-red-600/30 text-red-400 text-xs rounded flex items-center justify-center gap-1"
              >
                <Shield className="size-3" />
                SL -2%
              </button>
              <button
                onClick={() => handleTPSL('sl', 5)}
                className="px-2 py-1 bg-red-600/20 hover:bg-red-600/30 text-red-400 text-xs rounded flex items-center justify-center gap-1"
              >
                <Shield className="size-3" />
                SL -5%
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
