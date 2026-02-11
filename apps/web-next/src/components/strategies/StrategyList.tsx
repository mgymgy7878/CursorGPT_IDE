import React from 'react';
import { Strategy } from '@/hooks/useStrategies';
import StatusBadge from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface StrategyListProps {
  strategies: Strategy[];
  onEdit: (strategy: Strategy) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: 'start' | 'stop' | 'pause') => void;
  loading?: boolean;
}

export const StrategyList: React.FC<StrategyListProps> = ({
  strategies,
  onEdit,
  onDelete,
  onStatusChange,
  loading = false,
}) => {
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
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-neutral-800 rounded w-1/3"></div>
              <div className="h-3 bg-neutral-800 rounded w-1/2"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="h-3 bg-neutral-800 rounded"></div>
                <div className="h-3 bg-neutral-800 rounded w-2/3"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (strategies.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <div className="text-center">
            <h3 className="text-lg font-medium text-neutral-200 mb-2">
              Henüz strateji bulunmuyor
            </h3>
            <p className="text-neutral-400">
              İlk stratejinizi oluşturmak için yukarıdaki "Yeni Strateji" butonuna tıklayın.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {strategies.map((strategy) => (
        <Card key={strategy.id} className="hover:shadow-md transition-shadow">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-lg">{strategy.name}</CardTitle>
                {strategy.description && (
                  <p className="text-sm text-neutral-400 mt-1">
                    {strategy.description}
                  </p>
                )}
              </div>
              <StatusBadge
                status={getStatusColor(strategy.status)}
                label={strategy.status}
              />
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div>
                <p className="text-xs text-neutral-400 uppercase tracking-wide">
                  Tip
                </p>
                <p className="text-sm font-medium text-neutral-200">
                  {strategy.type === 'automated' ? 'Otomatik' : 'Manuel'}
                </p>
              </div>
              <div>
                <p className="text-xs text-neutral-400 uppercase tracking-wide">
                  Risk Seviyesi
                </p>
                <p className="text-sm font-medium text-neutral-200 capitalize">
                  {strategy.riskLevel}
                </p>
              </div>
              <div>
                <p className="text-xs text-neutral-400 uppercase tracking-wide">
                  Kar/Zarar
                </p>
                <p className={`text-sm font-medium ${
                  (strategy.profitLoss || 0) >= 0 ? 'text-emerald-400' : 'text-red-400'
                }`}>
                  {formatCurrency(strategy.profitLoss)}
                </p>
              </div>
              <div>
                <p className="text-xs text-neutral-400 uppercase tracking-wide">
                  İşlem Sayısı
                </p>
                <p className="text-sm font-medium text-neutral-200">
                  {strategy.tradesCount || 0}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-neutral-800">
              <div className="text-xs text-neutral-400">
                Oluşturulma: {formatDate(strategy.createdAt)}
              </div>

              <div className="flex items-center space-x-2">
                {strategy.status === 'active' && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onStatusChange(strategy.id, 'pause')}
                  >
                    Duraklat
                  </Button>
                )}
                {strategy.status === 'paused' && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onStatusChange(strategy.id, 'start')}
                  >
                    Başlat
                  </Button>
                )}
                {strategy.status === 'inactive' && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onStatusChange(strategy.id, 'start')}
                  >
                    Başlat
                  </Button>
                )}
                {strategy.status === 'running' && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onStatusChange(strategy.id, 'stop')}
                  >
                    Durdur
                  </Button>
                )}

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onEdit(strategy)}
                >
                  Düzenle
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onDelete(strategy.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  Sil
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
