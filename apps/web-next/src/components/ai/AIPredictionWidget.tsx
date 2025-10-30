"use client";
import React, { useState, useEffect } from 'react';
import { Brain, Target, TrendingUp, TrendingDown, Clock, Zap } from 'lucide-react';

interface PredictionData {
  symbol: string;
  direction: 'bullish' | 'bearish' | 'neutral';
  confidence: number;
  targetPrice: number;
  currentPrice: number;
  timeframe: string;
  lastUpdate: string;
  factors: string[];
}

interface AIPredictionWidgetProps {
  symbol: string;
  onPredictionClick?: (prediction: PredictionData) => void;
}

export default function AIPredictionWidget({ symbol, onPredictionClick }: AIPredictionWidgetProps) {
  const [prediction, setPrediction] = useState<PredictionData | null>(null);
  const [loading, setLoading] = useState(true);

  // Mock AI prediction data - would be replaced with real API
  useEffect(() => {
    const mockPrediction: PredictionData = {
      symbol,
      direction: Math.random() > 0.5 ? 'bullish' : 'bearish',
      confidence: 65 + Math.random() * 30,
      targetPrice: 42000 + (Math.random() - 0.5) * 5000,
      currentPrice: 41500 + (Math.random() - 0.5) * 1000,
      timeframe: '4h',
      lastUpdate: new Date().toISOString(),
      factors: ['RSI Oversold', 'Volume Spike', 'Support Level', 'MACD Bullish']
    };

    setTimeout(() => {
      setPrediction(mockPrediction);
      setLoading(false);
    }, 1000);
  }, [symbol]);

  if (loading) {
    return (
      <div className="bg-neutral-900/50 border border-neutral-800 rounded-lg p-4">
        <div className="animate-pulse">
          <div className="h-4 bg-neutral-700 rounded w-1/3 mb-2"></div>
          <div className="h-6 bg-neutral-700 rounded w-1/2 mb-2"></div>
          <div className="h-3 bg-neutral-700 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  if (!prediction) return null;

  const priceChange = ((prediction.targetPrice - prediction.currentPrice) / prediction.currentPrice) * 100;
  const isPositive = priceChange > 0;

  const getDirectionColor = () => {
    switch (prediction.direction) {
      case 'bullish': return 'text-green-400';
      case 'bearish': return 'text-red-400';
      default: return 'text-neutral-400';
    }
  };

  const getDirectionIcon = () => {
    switch (prediction.direction) {
      case 'bullish': return <TrendingUp className="size-4" />;
      case 'bearish': return <TrendingDown className="size-4" />;
      default: return <Target className="size-4" />;
    }
  };

  const getConfidenceColor = () => {
    if (prediction.confidence >= 80) return 'text-green-400';
    if (prediction.confidence >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div
      className="bg-neutral-900/50 border border-neutral-800 rounded-lg p-4 hover:bg-neutral-800/50 transition-colors cursor-pointer"
      onClick={() => onPredictionClick?.(prediction)}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Brain className="size-4 text-purple-400" />
          <span className="text-sm font-medium text-white">AI Tahmin</span>
        </div>
        <div className="text-xs text-neutral-400 flex items-center gap-1">
          <Clock className="size-3" />
          {new Date(prediction.lastUpdate).toLocaleTimeString('tr-TR', {
            hour: '2-digit',
            minute: '2-digit'
          })}
        </div>
      </div>

      {/* Symbol & Direction */}
      <div className="flex items-center justify-between mb-2">
        <span className="font-semibold text-white">{prediction.symbol}</span>
        <div className={`flex items-center gap-1 ${getDirectionColor()}`}>
          {getDirectionIcon()}
          <span className="text-sm font-medium capitalize">
            {prediction.direction === 'bullish' ? 'Yükseliş' :
             prediction.direction === 'bearish' ? 'Düşüş' : 'Nötr'}
          </span>
        </div>
      </div>

      {/* Price Target */}
      <div className="mb-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-neutral-400">Hedef Fiyat</span>
          <span className="text-lg font-semibold text-white">
            ${prediction.targetPrice.toLocaleString('tr-TR')}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-neutral-400">Mevcut Fiyat</span>
          <span className="text-sm text-neutral-300">
            ${prediction.currentPrice.toLocaleString('tr-TR')}
          </span>
        </div>
        <div className="flex items-center justify-between mt-1">
          <span className="text-sm text-neutral-400">Potansiyel</span>
          <span className={`text-sm font-medium ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
            {isPositive ? '+' : ''}{priceChange.toFixed(1)}%
          </span>
        </div>
      </div>

      {/* Confidence */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-neutral-400">Güven Seviyesi</span>
          <span className={`text-xs font-medium ${getConfidenceColor()}`}>
            %{prediction.confidence.toFixed(0)}
          </span>
        </div>
        <div className="w-full bg-neutral-700 rounded-full h-2">
          <div
            className={`h-2 rounded-full ${
              prediction.confidence >= 80 ? 'bg-green-500' :
              prediction.confidence >= 60 ? 'bg-yellow-500' : 'bg-red-500'
            }`}
            style={{ width: `${prediction.confidence}%` }}
          ></div>
        </div>
      </div>

      {/* Factors */}
      <div className="mb-3">
        <div className="text-xs text-neutral-400 mb-2">Analiz Faktörleri</div>
        <div className="flex flex-wrap gap-1">
          {prediction.factors.slice(0, 3).map((factor, index) => (
            <span
              key={index}
              className="px-2 py-1 bg-blue-600/20 text-blue-400 text-xs rounded"
            >
              {factor}
            </span>
          ))}
          {prediction.factors.length > 3 && (
            <span className="px-2 py-1 bg-neutral-700 text-neutral-400 text-xs rounded">
              +{prediction.factors.length - 3}
            </span>
          )}
        </div>
      </div>

      {/* Timeframe */}
      <div className="flex items-center justify-between text-xs text-neutral-400">
        <span>Zaman Dilimi: {prediction.timeframe}</span>
        <div className="flex items-center gap-1">
          <Zap className="size-3" />
          <span>AI Powered</span>
        </div>
      </div>
    </div>
  );
}
