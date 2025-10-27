"use client";

import { useEffect, useState } from "react";

interface SystemStatus {
  exchange: "up" | "down";
  ws: "up" | "down";
  risk: "ok" | "warning" | "error";
  gate: "open" | "closed";
  fills: number;
  ordersPlaced: number;
}

interface StatusBarProps {
  className?: string;
}

export default function StatusBar({ className = "" }: StatusBarProps) {
  const [status, setStatus] = useState<SystemStatus>({
    exchange: "down",
    ws: "down", 
    risk: "error",
    gate: "closed",
    fills: 0,
    ordersPlaced: 0
  });

  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const response = await fetch("/api/local/live/health");
        if (response.ok) {
                  const data = await response.json();
        setStatus({
          exchange: data.exchange,
          ws: data.ws,
          risk: data.killSwitch === 0 ? "ok" : "error",
          gate: data.circuit === "closed" ? "open" : "closed",
          fills: data.fills || 0,
          ordersPlaced: data.ordersPlaced || 0
        });
        }
      } catch (error) {
        console.error("Status fetch error:", error);
      }
      setLastUpdate(new Date());
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 5000); // 5 saniyede bir güncelle

    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "up":
      case "ok":
      case "open":
        return "bg-green-500";
      case "down":
      case "error":
      case "closed":
        return "bg-red-500";
      case "warning":
        return "bg-yellow-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "up":
      case "ok":
      case "open":
        return "✓";
      case "down":
      case "error":
      case "closed":
        return "✗";
      case "warning":
        return "⚠";
      default:
        return "?";
    }
  };

  return (
    <div className={`flex items-center space-x-4 p-2 bg-gray-800 text-white text-sm ${className}`}>
      <div className="flex items-center space-x-2">
        <span className="text-gray-400">Exchange:</span>
        <div className={`w-2 h-2 rounded-full ${getStatusColor(status.exchange)}`}></div>
        <span>{getStatusText(status.exchange)} {status.exchange}</span>
      </div>

      <div className="flex items-center space-x-2">
        <span className="text-gray-400">WebSocket:</span>
        <div className={`w-2 h-2 rounded-full ${getStatusColor(status.ws)}`}></div>
        <span>{getStatusText(status.ws)} {status.ws}</span>
      </div>

      <div className="flex items-center space-x-2">
        <span className="text-gray-400">Risk:</span>
        <div className={`w-2 h-2 rounded-full ${getStatusColor(status.risk)}`}></div>
        <span>{getStatusText(status.risk)} {status.risk}</span>
      </div>

      <div className="flex items-center space-x-2">
        <span className="text-gray-400">Gate:</span>
        <div className={`w-2 h-2 rounded-full ${getStatusColor(status.gate)}`}></div>
        <span>{getStatusText(status.gate)} {status.gate}</span>
      </div>

      <div className="flex items-center space-x-2">
        <span className="text-gray-400">Fills:</span>
        <span className="text-green-400 font-mono">{status.fills}</span>
      </div>

      <div className="flex items-center space-x-2">
        <span className="text-gray-400">Orders:</span>
        <span className="text-blue-400 font-mono">{status.ordersPlaced}</span>
      </div>

      <div className="text-gray-400 text-xs">
        Last update: {lastUpdate.toLocaleTimeString()}
      </div>
    </div>
  );
} 