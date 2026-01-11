import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface StrategyControlsProps {
  onCreateNew: () => void;
  onRefresh: () => void;
  loading?: boolean;
}

export const StrategyControls: React.FC<StrategyControlsProps> = ({
  onCreateNew,
  onRefresh,
  loading = false,
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
              disabled={loading}
            >
              Yeni Strateji
            </Button>

            <Button
              variant="outline"
              onClick={onRefresh}
              disabled={loading}
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
