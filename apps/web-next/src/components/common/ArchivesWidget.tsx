"use client";
import { useEffect, useState } from "react";

type Archive = {
  archiveId: string;
  runId: string;
  timestamp: number;
  size: number;
  url?: string;
};

export default function ArchivesWidget() {
  const [archives, setArchives] = useState<Archive[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    loadArchives();
  }, []);

  async function loadArchives() {
    try {
      // Mock archives list - in production this would call /api/evidence/list
      const mockArchives: Archive[] = [
        {
          archiveId: "archive-1",
          runId: "canary-001",
          timestamp: Date.now() - 3600000,
          size: 512 * 1024,
          url: "https://mock-s3.example.com/evidence/canary-001.zip"
        },
        {
          archiveId: "archive-2",
          runId: "backtest-002",
          timestamp: Date.now() - 86400000,
          size: 768 * 1024,
          url: "https://mock-s3.example.com/evidence/backtest-002.zip"
        },
        {
          archiveId: "archive-3",
          runId: "optimize-003",
          timestamp: Date.now() - 172800000,
          size: 1024 * 1024,
          url: "https://mock-s3.example.com/evidence/optimize-003.zip"
        }
      ];
      
      setArchives(mockArchives.slice(0, 5));
      setTotal(15); // Mock total count
    } catch (e) {
      setArchives([]);
    } finally {
      setLoading(false);
    }
  }

  function formatSize(bytes: number) {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  }

  function formatTime(timestamp: number) {
    const now = Date.now();
    const diff = now - timestamp;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    
    if (hours < 1) return "< 1h";
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    return `${days}d`;
  }

  if (loading) {
    return (
      <div className="rounded-xl border border-neutral-800 p-4 bg-neutral-900/50">
        <div className="animate-pulse">
          <div className="h-4 w-24 bg-neutral-800 rounded mb-3"></div>
          <div className="space-y-2">
            <div className="h-3 bg-neutral-800 rounded w-full"></div>
            <div className="h-3 bg-neutral-800 rounded w-3/4"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-neutral-800 p-4 bg-neutral-900/50">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold">📦 Evidence Arşivleri</h3>
        <span className="text-xs text-neutral-500">{total} toplam</span>
      </div>

      {archives.length === 0 ? (
        <div className="text-center py-4 text-neutral-500 text-xs">
          Arşiv yok
        </div>
      ) : (
        <div className="space-y-2">
          {archives.map((archive) => (
            <div
              key={archive.archiveId}
              className="flex items-center justify-between p-2 rounded bg-neutral-800/50 hover:bg-neutral-800 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="text-xs font-mono text-neutral-300 truncate">
                  {archive.runId}
                </div>
                <div className="text-xs text-neutral-500">
                  {formatSize(archive.size)} · {formatTime(archive.timestamp)} önce
                </div>
              </div>
              {archive.url && (
                <a
                  href={archive.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-400 hover:text-blue-300 ml-2"
                  title="İndir"
                >
                  ⬇️
                </a>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="mt-3 pt-3 border-t border-neutral-800 text-center">
        <button className="text-xs text-neutral-500 hover:text-neutral-300">
          Tümünü Gör →
        </button>
      </div>
    </div>
  );
}

