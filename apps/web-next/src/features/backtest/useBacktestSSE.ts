"use client";

import { useState, useEffect, useCallback, useRef } from "react";

export interface BacktestProgress {
  progress: number;
  step: string;
  status: "pending" | "running" | "completed" | "failed";
}

export interface BacktestReport {
  jobId: string;
  status: string;
  metrics: {
    totalTrades: number;
    winRate: number;
    profitFactor: number;
    maxDrawdown: number;
    sharpeRatio: number;
    totalReturn: number;
    avgWinLoss: number;
  };
  equityCurve: Array<{ date: string; equity: number }>;
  trades: any[];
}

export function useBacktestSSE(jobId: string | null) {
  const [progress, setProgress] = useState<BacktestProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  const startListening = useCallback(() => {
    if (!jobId) return;

    // Close existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const eventSource = new EventSource(
      `http://localhost:4001/backtest/stream/${jobId}`
    );
    eventSourceRef.current = eventSource;

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === "connected") {
          console.log("SSE connected:", data.jobId);
        } else if (data.type === "progress") {
          setProgress({
            progress: data.progress,
            step: data.step,
            status: data.status,
          });
        } else if (data.type === "error") {
          setError(data.message);
          eventSource.close();
        }
      } catch (err) {
        console.error("Failed to parse SSE data:", err);
      }
    };

    eventSource.onerror = (err) => {
      console.error("SSE error:", err);
      if (eventSource.readyState === EventSource.CLOSED) {
        // Server closed connection - job completed
        setProgress((prev) => (prev ? { ...prev, status: "completed" } : null));
      } else {
        // Reconnection will be attempted automatically
      }
    };

    return () => {
      eventSource.close();
    };
  }, [jobId]);

  useEffect(() => {
    startListening();
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, [startListening]);

  const fetchReport = useCallback(async (): Promise<BacktestReport | null> => {
    if (!jobId) return null;

    try {
      const response = await fetch(
        `http://localhost:4001/backtest/report/${jobId}`
      );
      if (!response.ok) throw new Error("Failed to fetch report");
      return await response.json();
    } catch (err) {
      console.error("Failed to fetch report:", err);
      return null;
    }
  }, [jobId]);

  return { progress, error, fetchReport };
}
