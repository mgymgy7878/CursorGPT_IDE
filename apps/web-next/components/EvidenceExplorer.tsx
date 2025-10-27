"use client";
import { useEffect, useState } from "react";
import { Folder, File, ExternalLink, RefreshCw } from "lucide-react";

interface EvidenceData {
  nonce: string;
  step: string;
  paths: string[];
  evidenceRoot: string;
  ts: string;
}

export default function EvidenceExplorer() {
  const [data, setData] = useState<EvidenceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEvidence = async () => {
    try {
      const response = await fetch("/api/public/evidence/latest", {
        cache: "no-store",
        next: { revalidate: 0 }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const result = await response.json();
      if (result.ok) {
        setData(result);
        setError(null);
      } else {
        throw new Error(result.error || "Failed to fetch evidence");
      }
    } catch (err: any) {
      setError(err.message);
      console.error("Failed to fetch evidence:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvidence();
  }, []);

  const getFileIcon = (filename: string) => {
    if (filename.endsWith('.json')) return <File className="w-4 h-4 text-yellow-400" />;
    if (filename.endsWith('.csv')) return <File className="w-4 h-4 text-green-400" />;
    if (filename.endsWith('.txt')) return <File className="w-4 h-4 text-blue-400" />;
    if (filename.endsWith('.md')) return <File className="w-4 h-4 text-purple-400" />;
    return <File className="w-4 h-4 text-neutral-400" />;
  };

  const getFileType = (filename: string) => {
    if (filename.endsWith('.json')) return 'JSON';
    if (filename.endsWith('.csv')) return 'CSV';
    if (filename.endsWith('.txt')) return 'TXT';
    if (filename.endsWith('.md')) return 'MD';
    return 'FILE';
  };

  if (loading) {
    return (
      <div className="p-6 rounded-2xl border border-zinc-700/50 shadow-sm">
        <h3 className="text-lg font-semibold mb-4">Evidence Explorer</h3>
        <div className="text-center py-8 text-neutral-400">
          Loading evidence...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 rounded-2xl border border-zinc-700/50 shadow-sm">
        <h3 className="text-lg font-semibold mb-4">Evidence Explorer</h3>
        <div className="text-center py-8 text-red-400">
          Error: {error}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 rounded-2xl border border-zinc-700/50 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Evidence Explorer</h3>
        <button
          onClick={fetchEvidence}
          className="flex items-center space-x-1 px-2 py-1 bg-neutral-700 hover:bg-neutral-600 rounded text-xs transition-colors"
        >
          <RefreshCw className="w-3 h-3" />
          <span>Refresh</span>
        </button>
      </div>

      {data ? (
        <div className="space-y-4">
          {/* Current Session Info */}
          <div className="bg-neutral-800/30 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Folder className="w-4 h-4 text-blue-400" />
              <span className="font-medium">Current Session</span>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-neutral-400">Nonce:</span>
                <span className="ml-2 font-mono text-blue-400">{data.nonce || 'N/A'}</span>
              </div>
              <div>
                <span className="text-neutral-400">Step:</span>
                <span className="ml-2 font-mono text-green-400">{data.step || 'N/A'}</span>
              </div>
            </div>
            <div className="mt-2 text-xs text-neutral-500">
              Root: {data.evidenceRoot}
            </div>
          </div>

          {/* Files List */}
          <div>
            <div className="flex items-center space-x-2 mb-3">
              <File className="w-4 h-4 text-neutral-400" />
              <span className="font-medium text-sm">Evidence Files</span>
              <span className="text-xs text-neutral-500">({data.paths.length} files)</span>
            </div>
            
            {data.paths.length > 0 ? (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {data.paths.map((path, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 bg-neutral-800/20 rounded hover:bg-neutral-800/40 transition-colors"
                  >
                    <div className="flex items-center space-x-2">
                      {getFileIcon(path)}
                      <span className="text-sm font-mono">{path}</span>
                      <span className="text-xs text-neutral-500">({getFileType(path)})</span>
                    </div>
                    <button
                      onClick={() => {
                        // In a real app, this would open the file or download it
                        console.log(`Opening evidence file: ${path}`);
                      }}
                      className="flex items-center space-x-1 px-2 py-1 bg-neutral-700 hover:bg-neutral-600 rounded text-xs transition-colors"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>View</span>
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-neutral-400">
                <File className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No evidence files found</p>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="pt-4 border-t border-neutral-700">
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  // In a real app, this would open the evidence directory
                  console.log("Opening evidence directory");
                }}
                className="flex items-center justify-center space-x-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm transition-colors"
              >
                <Folder className="w-4 h-4" />
                <span>Open Directory</span>
              </button>
              <button
                onClick={() => {
                  // In a real app, this would download all evidence as zip
                  console.log("Downloading evidence archive");
                }}
                className="flex items-center justify-center space-x-2 px-3 py-2 bg-neutral-700 hover:bg-neutral-600 rounded text-sm transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Download All</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-8 text-neutral-400">
          <Folder className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>No evidence data available</p>
        </div>
      )}

      <div className="mt-4 text-xs text-neutral-500">
        Last updated: {data?.ts ? new Date(data.ts).toLocaleTimeString() : 'N/A'}
      </div>
    </div>
  );
} 