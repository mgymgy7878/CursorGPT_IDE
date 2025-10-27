'use client';

import { useState, useEffect } from "react";
import { fetchStrategies, Strategy } from "@/lib/api/lab";
import StrategyRow from "./StrategyRow";
import { bus } from "@/lib/event-bus";

interface SavedStrategiesProps {
  onEdit?: (strategy: Strategy) => void;
  onBacktest?: (strategy: Strategy) => void;
  onOptimize?: (strategy: Strategy) => void;
  onRun?: (strategy: Strategy) => void;
}

export default function SavedStrategies({ onEdit, onBacktest, onOptimize, onRun }: SavedStrategiesProps) {
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadStrategies = async () => {
      try {
        setLoading(true);
        const response = await fetchStrategies({ page: 1, sort: 'updatedAt:desc' });
        setStrategies(response.items);
      } catch (err) {
        console.error('Failed to load strategies:', err);
        setError('Stratejiler yüklenemedi');
      } finally {
        setLoading(false);
      }
    };

    loadStrategies();
  }, []);

  const handleEdit = (strategy: Strategy) => {
    if (onEdit) {
      onEdit(strategy);
    } else {
      // localStorage'a kaydet ve editörü güncelle
      localStorage.setItem('spark:lab:code', (strategy as any).code || '// Mock code');
      bus.emit('lab:editor:refresh' as any);
    }
  };

  const handleBacktest = (strategy: Strategy) => {
    if (onBacktest) {
      onBacktest(strategy);
    } else {
      bus.emit('lab:open:backtest' as any, { code: (strategy as any).code || '// Mock code' });
    }
  };

  const handleOptimize = (strategy: Strategy) => {
    if (onOptimize) {
      onOptimize(strategy);
    } else {
      bus.emit('lab:open:optimize' as any, { code: (strategy as any).code || '// Mock code' });
    }
  };

  const handleRun = (strategy: Strategy) => {
    if (onRun) {
      onRun(strategy);
    } else {
      bus.emit('lab:open:run' as any, { code: (strategy as any).code || '// Mock code' });
    }
  };

  if (loading) {
    return (
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-white">Kaydedilen Stratejiler</h3>
        <div className="p-4 bg-gray-800 border border-gray-700 rounded-md">
          <div className="text-gray-400">Yükleniyor...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-white">Kaydedilen Stratejiler</h3>
        <div className="p-4 bg-red-900/20 border border-red-700 rounded-md">
          <div className="text-red-400">{error}</div>
        </div>
      </div>
    );
  }

  if (strategies.length === 0) {
    return (
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-white">Kaydedilen Stratejiler</h3>
        <div className="p-4 bg-gray-800 border border-gray-700 rounded-md">
          <div className="text-gray-400">Henüz kaydedilmiş strateji yok</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <h3 className="text-lg font-semibold text-white">Kaydedilen Stratejiler</h3>
      <div className="space-y-2">
        {strategies.map((strategy) => (
          <StrategyRow
            key={strategy.id}
            strategy={strategy}
            onEdit={() => handleEdit(strategy)}
            onBacktest={() => handleBacktest(strategy)}
            onOptimize={() => handleOptimize(strategy)}
            onRun={() => handleRun(strategy)}
          />
        ))}
      </div>
    </div>
  );
} 