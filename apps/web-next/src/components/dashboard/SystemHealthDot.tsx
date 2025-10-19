"use client";
import { useEffect, useState } from "react";

interface HealthData {
  status: "UP" | "DEGRADED" | "DOWN";
  slo?: {
    latencyP95: number | null;
    stalenessSec: number;
    errorRate: number;
    uptimeMin: number;
  };
  thresholds?: {
    latencyP95Target: number;
    stalenessTarget: number;
    errorRateTarget: number;
  };
}

export default function SystemHealthDot() {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;

    const checkHealth = async () => {
      try {
        const response = await fetch("/api/healthz", {
          cache: "no-store",
        });
        
        const data = await response.json();
        
        if (alive) {
          setHealth(data);
          setLoading(false);
        }
      } catch (err) {
        if (alive) {
          setHealth({ status: "DOWN" });
          setLoading(false);
        }
      }
    };

    checkHealth();

    // Poll every 30 seconds
    const interval = setInterval(() => {
      if (!document.hidden && alive) {
        checkHealth();
      }
    }, 30000);

    const handleVisibilityChange = () => {
      if (!document.hidden && alive) {
        checkHealth();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      alive = false;
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-neutral-600 animate-pulse"></div>
        <span className="text-xs text-neutral-500">Checking...</span>
      </div>
    );
  }

  if (!health) {
    return (
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-red-500"></div>
        <span className="text-xs text-red-400">Unknown</span>
      </div>
    );
  }

  // Determine color based on status and SLO thresholds
  let dotColor = "bg-green-500";
  let textColor = "text-green-400";
  let statusText = "Healthy";

  if (health.status === "DOWN") {
    dotColor = "bg-red-500";
    textColor = "text-red-400";
    statusText = "Down";
  } else if (health.status === "DEGRADED") {
    dotColor = "bg-amber-500";
    textColor = "text-amber-400";
    statusText = "Degraded";
  } else if (health.slo && health.thresholds) {
    // Check SLO thresholds
    const { latencyP95, errorRate, stalenessSec } = health.slo;
    const { latencyP95Target, errorRateTarget, stalenessTarget } = health.thresholds;

    if (
      (latencyP95 !== null && latencyP95 > latencyP95Target * 1.5) ||
      errorRate > errorRateTarget * 1.5 ||
      stalenessSec > stalenessTarget
    ) {
      dotColor = "bg-amber-500";
      textColor = "text-amber-400";
      statusText = "Warning";
    }
  }

  return (
    <div className="flex items-center gap-2 group relative">
      <div className={`w-2 h-2 rounded-full ${dotColor} animate-pulse`}></div>
      <span className={`text-xs ${textColor}`}>{statusText}</span>
      
      {/* Tooltip with SLO metrics */}
      {health.slo && (
        <div className="absolute top-full right-0 mt-2 hidden group-hover:block z-50">
          <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-3 shadow-xl min-w-[200px]">
            <div className="text-xs space-y-2">
              <div className="font-semibold text-white mb-2">SLO Metrics</div>
              
              <div className="flex justify-between">
                <span className="text-neutral-400">P95 Latency:</span>
                <span className={`font-mono ${
                  health.slo.latencyP95 !== null && 
                  health.thresholds && 
                  health.slo.latencyP95 > health.thresholds.latencyP95Target
                    ? "text-amber-400"
                    : "text-white"
                }`}>
                  {health.slo.latencyP95 !== null ? `${health.slo.latencyP95}ms` : "—"}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-neutral-400">Staleness:</span>
                <span className={`font-mono ${
                  health.thresholds && 
                  health.slo.stalenessSec > health.thresholds.stalenessTarget
                    ? "text-amber-400"
                    : "text-white"
                }`}>
                  {health.slo.stalenessSec}s
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-neutral-400">Error Rate:</span>
                <span className={`font-mono ${
                  health.thresholds && 
                  health.slo.errorRate > health.thresholds.errorRateTarget
                    ? "text-amber-400"
                    : "text-white"
                }`}>
                  {health.slo.errorRate.toFixed(1)}%
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-neutral-400">Uptime:</span>
                <span className="font-mono text-white">
                  {health.slo.uptimeMin}m
                </span>
              </div>

              {health.thresholds && (
                <>
                  <div className="border-t border-neutral-800 my-2"></div>
                  <div className="text-[10px] text-neutral-500">
                    <div>Targets: P95 &lt;{health.thresholds.latencyP95Target}ms</div>
                    <div>Staleness &lt;{health.thresholds.stalenessTarget}s</div>
                    <div>Errors &lt;{health.thresholds.errorRateTarget}%</div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

