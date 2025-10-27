"use client";
import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle, Clock, Database, Network, Shield, TrendingDown, Zap } from "lucide-react";

type GuardrailStatus = "PASS" | "DEG" | "TRIP";

interface Guardrail {
  id: string;
  name: string;
  description: string;
  icon: any;
  status: GuardrailStatus;
  value: number;
  threshold: number;
  unit: string;
}

export default function GuardrailStack() {
  const [guardrails, setGuardrails] = useState<Guardrail[]>([
    {
      id: "ack_p95",
      name: "ACK P95",
      description: "Acknowledgement latency 95th percentile",
      icon: Network,
      status: "PASS",
      value: 45,
      threshold: 1000,
      unit: "ms"
    },
    {
      id: "event_to_db",
      name: "Event→DB P95",
      description: "Event to database latency 95th percentile",
      icon: Database,
      status: "PASS",
      value: 48,
      threshold: 300,
      unit: "ms"
    },
    {
      id: "ingest_lag",
      name: "Ingest Lag P95",
      description: "Data ingestion lag 95th percentile",
      icon: Clock,
      status: "PASS",
      value: 0.048,
      threshold: 2.0,
      unit: "s"
    },
    {
      id: "seq_gap",
      name: "Seq Gap Total",
      description: "Total sequence gaps",
      icon: AlertTriangle,
      status: "PASS",
      value: 0,
      threshold: 0,
      unit: ""
    },
    {
      id: "reject_rate",
      name: "Reject Rate",
      description: "Order rejection rate percentage",
      icon: TrendingDown,
      status: "PASS",
      value: 0.0,
      threshold: 1.0,
      unit: "%"
    },
    {
      id: "slippage",
      name: "Slippage P95",
      description: "Slippage 95th percentile",
      icon: Shield,
      status: "PASS",
      value: 12,
      threshold: 20,
      unit: "bps"
    },
    {
      id: "daily_loss",
      name: "Daily Loss",
      description: "Daily loss limit",
      icon: TrendingDown,
      status: "PASS",
      value: 0,
      threshold: 300,
      unit: "$"
    },
    {
      id: "clock_drift",
      name: "Clock Drift P95",
      description: "Clock drift 95th percentile",
      icon: Clock,
      status: "PASS",
      value: 15,
      threshold: 250,
      unit: "ms"
    }
  ]);

  useEffect(() => {
    const fetchGuardrails = async () => {
      try {
        const response = await fetch("/api/public/canary/status", {
          cache: "no-store",
          next: { revalidate: 0 }
        });
        const data = await response.json();
        
        if (data.ok && data.data) {
          // Update guardrails with real data
          setGuardrails(prev => prev.map(guardrail => {
            const value = data.data[guardrail.id] || guardrail.value;
            let status: GuardrailStatus = "PASS";
            
            if (guardrail.id === "seq_gap") {
              status = value === 0 ? "PASS" : "TRIP";
            } else if (value > guardrail.threshold) {
              status = value > guardrail.threshold * 1.5 ? "TRIP" : "DEG";
            }
            
            return { ...guardrail, value, status };
          }));
        }
      } catch (error) {
        console.error("Failed to fetch guardrails:", error);
      }
    };

    fetchGuardrails();
    const interval = setInterval(fetchGuardrails, 5000);
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: GuardrailStatus) => {
    switch (status) {
      case "PASS": return "text-green-400 bg-green-900/20 border-green-800/50";
      case "DEG": return "text-amber-400 bg-amber-900/20 border-amber-800/50";
      case "TRIP": return "text-red-400 bg-red-900/20 border-red-800/50";
    }
  };

  const getStatusIcon = (status: GuardrailStatus) => {
    switch (status) {
      case "PASS": return <CheckCircle className="w-4 h-4" />;
      case "DEG": return <AlertTriangle className="w-4 h-4" />;
      case "TRIP": return <AlertTriangle className="w-4 h-4" />;
    }
  };

  const overallStatus = guardrails.every(g => g.status === "PASS") ? "PASS" : 
                       guardrails.some(g => g.status === "TRIP") ? "TRIP" : "DEG";

  return (
    <div className="card">
      <div className="card-header">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Shield className="w-5 h-5 text-blue-400" />
            <h3 className="text-lg font-semibold">Guardrails</h3>
          </div>
          <div className={`badge ${overallStatus === 'PASS' ? 'badge-success' : overallStatus === 'DEG' ? 'badge-warning' : 'badge-danger'}`}>
            {overallStatus}
          </div>
        </div>
      </div>
      
      <div className="card-body">
        <div className="grid grid-cols-2 gap-3">
          {guardrails.map((guardrail) => {
            const Icon = guardrail.icon;
            const isThresholdExceeded = guardrail.id === "seq_gap" 
              ? guardrail.value !== 0 
              : guardrail.value > guardrail.threshold;
            
            return (
              <div
                key={guardrail.id}
                className={`p-3 rounded-lg border ${getStatusColor(guardrail.status)} transition-all duration-200 ${
                  guardrail.status === 'TRIP' ? 'animate-pulse' : ''
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <Icon className="w-4 h-4" />
                    <span className="text-sm font-medium">{guardrail.name}</span>
                  </div>
                  {getStatusIcon(guardrail.status)}
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-lg font-mono font-semibold">
                    {guardrail.value}{guardrail.unit}
                  </span>
                  <span className="text-xs text-zinc-500 font-mono">
                    / {guardrail.threshold}{guardrail.unit}
                  </span>
                </div>
                
                <div className="mt-1 text-xs text-zinc-400">
                  {guardrail.description}
                </div>
              </div>
            );
          })}
        </div>
        
        <div className="mt-4 pt-3 border-t border-zinc-800/50">
          <div className="flex items-center justify-between text-sm">
            <span className="text-zinc-400">Overall Status:</span>
            <div className="flex items-center space-x-2">
              <span className={`font-medium ${
                overallStatus === 'PASS' ? 'text-green-400' : 
                overallStatus === 'DEG' ? 'text-amber-400' : 'text-red-400'
              }`}>
                {overallStatus}
              </span>
              <span className="text-xs text-zinc-500">
                {guardrails.filter(g => g.status === 'PASS').length}/{guardrails.length} PASS
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 