"use client";
import { useState, useEffect } from 'react';

interface SystemStatus {
  status: string;
  timestamp: string;
  uptime: number;
  memory: {
    used: number;
    total: number;
    external: number;
  };
  responseTime: number;
  version: string;
}

export default function SystemMonitor() {
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const response = await fetch('/api/health');
        if (response.ok) {
          const data = await response.json();
          setStatus(data);
          setError(null);
        } else {
          setError(`HTTP ${response.status}`);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setIsLoading(false);
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return (
      <div className="rounded-lg border p-4">
        <h3 className="font-semibold mb-2">System Status</h3>
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4">
        <h3 className="font-semibold text-red-800 mb-2">System Status</h3>
        <div className="text-red-600">Error: {error}</div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ok': return 'text-green-600 bg-green-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      case 'error': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const formatUptime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  return (
    <div className="rounded-lg border p-4">
      <h3 className="font-semibold mb-3">System Status</h3>
      
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span>Status:</span>
          <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(status?.status || 'unknown')}`}>
            {status?.status || 'unknown'}
          </span>
        </div>
        
        <div className="flex justify-between">
          <span>Uptime:</span>
          <span className="font-mono">{formatUptime(status?.uptime || 0)}</span>
        </div>
        
        <div className="flex justify-between">
          <span>Memory:</span>
          <span className="font-mono">
            {status?.memory.used || 0}MB / {status?.memory.total || 0}MB
          </span>
        </div>
        
        <div className="flex justify-between">
          <span>Response Time:</span>
          <span className="font-mono">{status?.responseTime || 0}ms</span>
        </div>
        
        <div className="flex justify-between">
          <span>Node Version:</span>
          <span className="font-mono text-xs">{status?.version || 'unknown'}</span>
        </div>
        
        <div className="flex justify-between">
          <span>Last Check:</span>
          <span className="font-mono text-xs">
            {status?.timestamp ? new Date(status.timestamp).toLocaleTimeString() : 'unknown'}
          </span>
        </div>
      </div>
    </div>
  );
}
