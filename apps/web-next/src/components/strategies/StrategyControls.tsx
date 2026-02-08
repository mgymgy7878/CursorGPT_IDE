import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface StrategyControlsProps {
  onCreateNew: () => void;
  onRefresh: () => void;
  loading?: boolean;
  disabled?: boolean;
  disabledTooltip?: string;
}

export const StrategyControls: React.FC<StrategyControlsProps> = ({
  onCreateNew,
  onRefresh,
  loading = false,
  disabled = false,
  disabledTooltip,
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Strateji Yönetimi</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              onClick={onCreateNew}
              disabled={loading || disabled}
              title={disabled && disabledTooltip ? disabledTooltip : undefined}
            >
              Yeni Strateji
            </Button>

            <Button
              variant="outline"
              onClick={onRefresh}
              disabled={loading || disabled}
              title={disabled && disabledTooltip ? disabledTooltip : undefined}
            >
              {loading ? 'Yükleniyor...' : 'Yenile'}
            </Button>
          </div>

          <div className="text-sm text-neutral-400">
            Stratejilerinizi yönetin ve performanslarını takip edin
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
