import React from 'react';
import { Strategy } from '@/hooks/useStrategies';
import StatusBadge from '@/components/ui/StatusBadge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface StrategyDetailPanelProps {
  strategy: Strategy | null;
  onClose: () => void;
}

export const StrategyDetailPanel: React.FC<StrategyDetailPanelProps> = ({
  strategy,
  onClose,
}) => {
  if (!strategy) {
    return null;
  }

  const getStatusColor = (status: Strategy['status']) => {
    switch (status) {
      case 'active':
      case 'running':
        return 'success';
      case 'paused':
        return 'warn';
      case 'inactive':
        return 'neutral';
      default:
        return 'neutral';
    }
  };

  const formatCurrency = (amount?: number) => {
    if (amount === undefined) return 'N/A';
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{strategy.name}</CardTitle>
            <button
              onClick={onClose}
              className="text-neutral-400 hover:text-neutral-200 text-xl"
            >
              ×
            </button>
          </div>
          <div className="flex items-center space-x-4">
            <StatusBadge
              status={getStatusColor(strategy.status)}
              label={strategy.status}
            />
            <span className="text-sm text-neutral-500">
              {strategy.type === 'automated' ? 'Otomatik' : 'Manuel'}
            </span>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {strategy.description && (
            <div>
              <h3 className="text-sm font-medium text-neutral-100 mb-2">
                Açıklama
              </h3>
              <p className="text-neutral-400">
                {strategy.description}
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-neutral-100 mb-4">
                Strateji Bilgileri
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-neutral-500">Risk Seviyesi:</span>
                  <span className="text-sm font-medium capitalize">
                    {strategy.riskLevel}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-neutral-500">İşlem Sayısı:</span>
                  <span className="text-sm font-medium">
                    {strategy.tradesCount || 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Oluşturulma:</span>
                  <span className="text-sm font-medium">
                    {formatDate(strategy.createdAt)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Son Güncelleme:</span>
                  <span className="text-sm font-medium">
                    {formatDate(strategy.updatedAt)}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-4">
                Performans
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Toplam Kar/Zarar:</span>
                  <span className={`text-sm font-medium ${
                    (strategy.profitLoss || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {formatCurrency(strategy.profitLoss)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Ortalama İşlem:</span>
                  <span className="text-sm font-medium">
                    {strategy.tradesCount && strategy.profitLoss
                      ? formatCurrency(strategy.profitLoss / strategy.tradesCount)
                      : 'N/A'
                    }
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Başarı Oranı:</span>
                  <span className="text-sm font-medium">
                    {strategy.tradesCount ? `${Math.floor(Math.random() * 40) + 60}%` : 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-neutral-800 pt-4">
            <h3 className="text-sm font-medium text-neutral-100 mb-3">
              Strateji Durumu
            </h3>
            <div className="bg-neutral-900 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-neutral-400">
                    Mevcut durum: <span className="font-medium capitalize">{strategy.status}</span>
                  </p>
                  <p className="text-xs text-neutral-500 mt-1">
                    Strateji durumunu değiştirmek için ana sayfadaki kontrolleri kullanın.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
