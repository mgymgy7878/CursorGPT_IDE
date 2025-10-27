/**
 * Stability Badge - UI Dashboard
 * Tag/sha + P95 < 1000ms ise "STABLE"
 */

'use client';

import { useState, useEffect } from 'react';

interface VersionInfo {
  version: string;
  tag: string;
  sha: string;
  ts: string;
}

interface StabilityInfo {
  stable: boolean;
  p95PlaceAck: number;
  p95FeedDb: number;
  lastCheck: string;
}

export default function StabilityBadge() {
  const [version, setVersion] = useState<VersionInfo | null>(null);
  const [stability, setStability] = useState<StabilityInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Version bilgisi
        const versionRes = await fetch('/api/version');
        if (versionRes.ok) {
          const versionData = await versionRes.json();
          setVersion(versionData);
        }

        // Stability bilgisi (PromQL'den)
        const stabilityRes = await fetch('/api/stability');
        if (stabilityRes.ok) {
          const stabilityData = await stabilityRes.json();
          setStability(stabilityData);
        }
      } catch (error) {
        console.error('Failed to fetch stability data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 30000); // 30s refresh
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center space-x-2 text-sm text-gray-500">
        <div className="w-2 h-2 bg-gray-300 rounded-full animate-pulse"></div>
        <span>Checking stability...</span>
      </div>
    );
  }

  const isStable = stability?.stable && 
                  stability.p95PlaceAck < 1000 && 
                  stability.p95FeedDb < 300;

  return (
    <div className="flex items-center space-x-3 p-3 bg-white rounded-lg border border-gray-200 shadow-sm">
      {/* Stability Indicator */}
      <div className="flex items-center space-x-2">
        <div className={`w-3 h-3 rounded-full ${
          isStable ? 'bg-green-500' : 'bg-red-500'
        }`}></div>
        <span className={`text-sm font-medium ${
          isStable ? 'text-green-700' : 'text-red-700'
        }`}>
          {isStable ? 'STABLE' : 'UNSTABLE'}
        </span>
      </div>

      {/* Version Info */}
      {version && (
        <div className="text-xs text-gray-600">
          <div className="font-mono">{version.tag}</div>
          <div className="text-gray-400">{version.sha.substring(0, 8)}</div>
        </div>
      )}

      {/* P95 Metrics */}
      {stability && (
        <div className="text-xs text-gray-600">
          <div>P95 Place→ACK: <span className="font-mono">{stability.p95PlaceAck}ms</span></div>
          <div>P95 Feed→DB: <span className="font-mono">{stability.p95FeedDb}ms</span></div>
        </div>
      )}

      {/* Last Check */}
      {stability && (
        <div className="text-xs text-gray-400">
          Last: {new Date(stability.lastCheck).toLocaleTimeString()}
        </div>
      )}
    </div>
  );
}
