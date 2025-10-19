'use client';

import React, { useState } from 'react';
import { useStrategies, Strategy } from '@/hooks/useStrategies';
import { StrategyList } from '@/components/strategies/StrategyList';
import { CreateStrategyModal } from '@/components/strategies/CreateStrategyModal';
import { StrategyDetailPanel } from '@/components/strategies/StrategyDetailPanel';
import { StrategyControls } from '@/components/strategies/StrategyControls';
import { PageHeader } from '@/components/ui/PageHeader';

export default function StrategiesPage() {
  const {
    strategies,
    loading,
    error,
    list,
    create,
    update,
    remove,
    setStatus,
  } = useStrategies();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedStrategy, setSelectedStrategy] = useState<Strategy | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const handleCreateStrategy = async (data: any) => {
    setActionLoading(true);
    try {
      await create(data);
      setShowCreateModal(false);
    } catch (err) {
      console.error('Failed to create strategy:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditStrategy = (strategy: Strategy) => {
    setSelectedStrategy(strategy);
  };

  const handleDeleteStrategy = async (id: string) => {
    if (!confirm('Bu stratejiyi silmek istediğinizden emin misiniz?')) {
      return;
    }

    setActionLoading(true);
    try {
      await remove(id);
    } catch (err) {
      console.error('Failed to delete strategy:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleStatusChange = async (id: string, status: 'start' | 'stop' | 'pause') => {
    setActionLoading(true);
    try {
      await setStatus(id, status);
    } catch (err) {
      console.error('Failed to update strategy status:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRefresh = async () => {
    await list();
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <PageHeader
        title="Stratejiler"
        desc="Trading stratejilerinizi yönetin ve performanslarını takip edin"
      />

      {error && (
        <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                Hata
              </h3>
              <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                {error}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-6">
        <StrategyControls
          onCreateNew={() => setShowCreateModal(true)}
          onRefresh={handleRefresh}
          loading={loading || actionLoading}
        />

        <StrategyList
          strategies={strategies}
          onEdit={handleEditStrategy}
          onDelete={handleDeleteStrategy}
          onStatusChange={handleStatusChange}
          loading={loading}
        />
      </div>

      {showCreateModal && (
        <CreateStrategyModal
          onSubmit={handleCreateStrategy}
          onCancel={() => setShowCreateModal(false)}
          loading={actionLoading}
        />
      )}

      {selectedStrategy && (
        <StrategyDetailPanel
          strategy={selectedStrategy}
          onClose={() => setSelectedStrategy(null)}
        />
      )}
    </div>
  );
}