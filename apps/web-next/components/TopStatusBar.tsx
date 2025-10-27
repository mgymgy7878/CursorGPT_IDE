"use client";
import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle, Clock, DollarSign, Target, Zap } from "lucide-react";

type StatusData = {
  env: string;
  killSwitch: boolean;
  step: string;
  fills: number;
  target: number;
  pnl: number;
  clockDrift: number;
  tripStatus: "PASS" | "DEG" | "TRIP";
  seqGap: number;
};

export default function TopStatusBar() {
  const [status, setStatus] = useState<StatusData>({
    env: "testnet",
    killSwitch: true,
    step: "stepG",
    fills: 5,
    target: 360,
    pnl: 125.50,
    clockDrift: 15,
    tripStatus: "PASS",
    seqGap: 0
  });

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const response = await fetch("/api/public/canary/status", {
          cache: "no-store",
          next: { revalidate: 0 }
        });
        const data = await response.json();
        
        if (data.ok && data.data) {
          setStatus(prev => ({
            ...prev,
            step: data.data.step || "unknown",
            fills: data.data.fills || 0,
            target: data.data.target || 0,
            pnl: data.data.pnl || 0,
            tripStatus: data.data.guardrails?.state === "PASS" ? "PASS" : "DEG"
          }));
        }
      } catch (error) {
        console.error("Failed to fetch status:", error);
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PASS": return "text-green-400";
      case "DEG": return "text-amber-400";
      case "TRIP": return "text-red-400";
      default: return "text-gray-400";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "PASS": return <CheckCircle className="w-4 h-4" />;
      case "DEG": return <AlertTriangle className="w-4 h-4" />;
      case "TRIP": return <AlertTriangle className="w-4 h-4 text-red-500" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  return (
    <div className="bg-neutral-900 border-b border-neutral-800 px-6 py-3">
      <div className="flex items-center justify-between">
        {/* Left Side - Environment & Kill Switch */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium">ENV:</span>
            <span className={`px-2 py-1 rounded text-xs font-mono ${
              status.env === "production" ? "bg-red-900 text-red-200" : "bg-blue-900 text-blue-200"
            }`}>
              {status.env.toUpperCase()}
            </span>
          </div>
          
          <div className="flex items-center space-x-2">
            <Zap className={`w-4 h-4 ${status.killSwitch ? "text-green-400" : "text-red-400"}`} />
            <span className="text-sm font-medium">Kill-Switch:</span>
            <span className={`px-2 py-1 rounded text-xs ${status.killSwitch ? "bg-green-900 text-green-200" : "bg-red-900 text-red-200"}`}>
              {status.killSwitch ? "ON" : "OFF"}
            </span>
          </div>
        </div>

        {/* Center - Step & Progress */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium">Step:</span>
            <span className="px-2 py-1 rounded text-xs bg-purple-900 text-purple-200 font-mono">
              {status.step}
            </span>
          </div>
          
          <div className="flex items-center space-x-2">
            <Target className="w-4 h-4 text-blue-400" />
            <span className="text-sm">
              {status.fills}/{status.target}
            </span>
          </div>
          
          <div className="flex items-center space-x-2">
            <DollarSign className="w-4 h-4 text-green-400" />
            <span className={`text-sm ${status.pnl >= 0 ? "text-green-400" : "text-red-400"}`}>
              ${status.pnl.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Right Side - Status & Metrics */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium">Drift:</span>
            <span className={`text-sm ${status.clockDrift < 100 ? "text-green-400" : "text-amber-400"}`}>
              {status.clockDrift}ms
            </span>
          </div>
          
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium">Seq Gap:</span>
            <span className={`text-sm ${status.seqGap === 0 ? "text-green-400" : "text-red-400"}`}>
              {status.seqGap}
            </span>
          </div>
          
          <div className={`flex items-center space-x-2 ${getStatusColor(status.tripStatus)}`}>
            {getStatusIcon(status.tripStatus)}
            <span className="text-sm font-medium">
              {status.tripStatus}
            </span>
          </div>
        </div>
      </div>

      {/* TRIP Banner */}
      {status.tripStatus === "TRIP" && (
        <div className="mt-2 p-2 bg-red-900 border border-red-700 rounded text-red-200 text-sm font-medium text-center">
          🚨 TRIP TRIGGERED - IMMEDIATE ACTION REQUIRED 🚨
        </div>
      )}
    </div>
  );
} 