'use client';

import { useSystemHealth } from '@/hooks/useSystemHealth';

export default function SystemBadges() {
  const { health } = useSystemHealth(30000); // Check every 30 seconds

  const getBadgeClass = (status: string) => {
    switch (status) {
      case 'UP':
        return 'bg-green-500 text-white';
      case 'DOWN':
        return 'bg-red-500 text-white';
      case 'CHECKING':
        return 'bg-yellow-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'UP':
        return '✅';
      case 'DOWN':
        return '❌';
      case 'CHECKING':
        return '⏳';
      default:
        return '❓';
    }
  };

  return (
    <div className="flex items-center space-x-2 text-xs">
      <span className={`px-2 py-1 rounded-full flex items-center space-x-1 ${getBadgeClass(health.executor)}`}>
        <span>{getStatusIcon(health.executor)}</span>
        <span>EXECUTOR: {health.executor}</span>
      </span>
      
      <span className={`px-2 py-1 rounded-full flex items-center space-x-1 ${getBadgeClass(health.metrics)}`}>
        <span>{getStatusIcon(health.metrics)}</span>
        <span>METRICS: {health.metrics}</span>
      </span>
      
      <span className="text-gray-400 text-xs">
        {health.lastCheck > 0 && new Date(health.lastCheck).toLocaleTimeString()}
      </span>
    </div>
  );
}
