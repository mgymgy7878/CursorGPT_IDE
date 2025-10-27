'use client';

import { Edit, Play, Settings, Zap } from "lucide-react";
import { Strategy } from "@/lib/api/lab";

interface StrategyRowProps {
  strategy: Strategy;
  onEdit: () => void;
  onBacktest: () => void;
  onOptimize: () => void;
  onRun: () => void;
}

export default function StrategyRow({
  strategy,
  onEdit,
  onBacktest,
  onOptimize,
  onRun
}: StrategyRowProps) {
  return (
    <div className="flex items-center justify-between p-3 bg-gray-800 border border-gray-700 rounded-md">
      <div className="flex-1">
        <h4 className="font-medium text-white">{strategy.name}</h4>
        <p className="text-sm text-gray-400">
          {strategy.versionsCount} versiyon • {new Date(strategy.updatedAt).toLocaleDateString('tr-TR')}
        </p>
      </div>
      
      <div className="flex items-center space-x-1">
        <button
          onClick={onEdit}
          className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-md transition-colors"
          title="Düzenle"
        >
          <Edit className="w-4 h-4" />
        </button>
        <button
          onClick={onBacktest}
          className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-md transition-colors"
          title="Backtest"
        >
          <Play className="w-4 h-4" />
        </button>
        <button
          onClick={onOptimize}
          className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-md transition-colors"
          title="Optimize"
        >
          <Settings className="w-4 h-4" />
        </button>
        <button
          onClick={onRun}
          className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-md transition-colors"
          title="Çalıştır"
        >
          <Zap className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
} 