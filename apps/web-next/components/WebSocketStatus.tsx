"use client";
import { useState, useEffect } from "react";

interface WebSocketStatus {
  connected: boolean;
  timestamp: number;
}

export default function WebSocketStatus() {
  const [status, setStatus] = useState<WebSocketStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [connecting, setConnecting] = useState(false);

  async function loadStatus() {
    try {
      const r = await fetch("/api/private/websocket/status");
      const data = await r.json();
      if (r.ok) {
        setStatus(data.data);
      }
    } catch (e) {
      console.error('WebSocket status error:', e);
    }
  }

  async function connectWebSocket() {
    try {
      setConnecting(true);
      const r = await fetch("/api/private/websocket/connect", { method: "POST" });
      const data = await r.json();
      if (r.ok) {
        alert("WebSocket connected successfully!");
        loadStatus();
      } else {
        alert(`Connection failed: ${data.error}`);
      }
    } catch (e) {
      alert(`Connection error: ${e}`);
    } finally {
      setConnecting(false);
    }
  }

  useEffect(() => {
    loadStatus();
    const interval = setInterval(loadStatus, 5000); // Poll every 5 seconds
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-4 rounded-xl border bg-green-50 border-green-200">
      <div className="flex justify-between items-center mb-4">
        <div className="font-semibold text-green-800">WebSocket Status</div>
        <div className="flex gap-2">
          <button
            onClick={loadStatus}
            disabled={loading}
            className={`px-3 py-1 text-sm rounded ${
              loading
                ? 'bg-gray-300 cursor-not-allowed'
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
          >
            {loading ? 'Loading...' : 'Refresh'}
          </button>
          <button
            onClick={connectWebSocket}
            disabled={connecting || status?.connected}
            className={`px-3 py-1 text-sm rounded ${
              connecting || status?.connected
                ? 'bg-gray-300 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {connecting ? 'Connecting...' : status?.connected ? 'Connected' : 'Connect'}
          </button>
        </div>
      </div>

      {status && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white p-3 rounded border">
            <div className="text-sm font-medium text-gray-700">Connection Status</div>
            <div className={`text-2xl font-bold ${
              status.connected ? 'text-green-600' : 'text-red-600'
            }`}>
              {status.connected ? 'Connected' : 'Disconnected'}
            </div>
          </div>
          <div className="bg-white p-3 rounded border">
            <div className="text-sm font-medium text-gray-700">Last Update</div>
            <div className="text-lg font-medium text-gray-600">
              {new Date(status.timestamp).toLocaleTimeString()}
            </div>
          </div>
        </div>
      )}

      <div className="mt-4 text-sm text-gray-600">
        <div className="font-medium mb-2">WebSocket Features:</div>
        <ul className="list-disc list-inside space-y-1">
          <li>Real-time order updates</li>
          <li>Account balance changes</li>
          <li>Automatic reconnection</li>
          <li>Ping/pong health checks</li>
        </ul>
      </div>
    </div>
  );
} 