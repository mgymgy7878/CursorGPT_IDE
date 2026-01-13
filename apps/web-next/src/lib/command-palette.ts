/**
 * Command Palette - Quick Actions
 * Canary, Smoke Test, Health Check komutları
 */

export interface CommandAction {
  id: string;
  label: string;
  description: string;
  icon: string;
  category: "test" | "health" | "deploy" | "dev" | "checkpoint";
  handler: () => Promise<CommandResult>;
}

export interface CommandResult {
  success: boolean;
  message: string;
  details?: any;
}

// Canary Dry-Run (Mock Mode)
export const runCanaryMock: CommandAction = {
  id: "canary.mock",
  label: "Canary Dry-Run (Mock)",
  description: "6/6 smoke test + SLO check (mock executor)",
  icon: "🧪",
  category: "test",
  handler: async () => {
    try {
      const response = await fetch("/api/tools/canary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "mock", autoOk: true }),
      });

      const result = await response.json();

      return {
        success: result.pass === result.total,
        message: `Canary: ${result.pass}/${result.total} PASS`,
        details: result,
      };
    } catch (err) {
      return {
        success: false,
        message: `Canary failed: ${err}`,
      };
    }
  },
};

// Canary Dry-Run (Real API)
export const runCanaryReal: CommandAction = {
  id: "canary.real",
  label: "Canary Dry-Run (Real)",
  description: "6/6 smoke test + SLO check (real APIs)",
  icon: "🚀",
  category: "test",
  handler: async () => {
    try {
      const response = await fetch("/api/tools/canary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "real", autoOk: false }),
      });

      const result = await response.json();

      return {
        success: result.pass === result.total,
        message: `Canary (Real): ${result.pass}/${result.total} PASS`,
        details: result,
      };
    } catch (err) {
      return {
        success: false,
        message: `Canary failed: ${err}`,
      };
    }
  },
};

// Health Check
export const checkHealth: CommandAction = {
  id: "health.check",
  label: "Health Check",
  description: "SLO metrics + executor status",
  icon: "🏥",
  category: "health",
  handler: async () => {
    try {
      const response = await fetch("/api/healthz");
      const health = await response.json();

      const slo = health.slo;
      const thresholds = health.thresholds;

      const issues: string[] = [];

      if (slo.latencyP95 > thresholds.latencyP95Target) {
        issues.push(`P95 latency high: ${slo.latencyP95}ms`);
      }

      if (slo.errorRate > thresholds.errorRateTarget) {
        issues.push(`Error rate high: ${slo.errorRate}%`);
      }

      if (slo.stalenessSec > thresholds.stalenessTarget) {
        issues.push(`Staleness high: ${slo.stalenessSec}s`);
      }

      return {
        success: issues.length === 0,
        message:
          issues.length === 0
            ? `Health OK (P95: ${slo.latencyP95}ms, Errors: ${slo.errorRate}%)`
            : `Health Issues: ${issues.join(", ")}`,
        details: health,
      };
    } catch (err) {
      return {
        success: false,
        message: `Health check failed: ${err}`,
      };
    }
  },
};

// Smoke Test (Quick)
export const runSmokeTest: CommandAction = {
  id: "smoke.quick",
  label: "Quick Smoke Test",
  description: "Test 3 main pages (dashboard, portfolio, strategies)",
  icon: "💨",
  category: "test",
  handler: async () => {
    const pages = ["/dashboard", "/portfolio", "/strategies"];
    const results = await Promise.all(
      pages.map(async (page) => {
        try {
          const start = Date.now();
          const response = await fetch(page);
          const duration = Date.now() - start;

          return {
            page,
            status: response.status,
            duration,
            pass: response.ok,
          };
        } catch (err) {
          return {
            page,
            status: 0,
            duration: 0,
            pass: false,
          };
        }
      })
    );

    const passCount = results.filter((r) => r.pass).length;

    return {
      success: passCount === pages.length,
      message: `Smoke: ${passCount}/${pages.length} pages OK`,
      details: results,
    };
  },
};

// Export Evidence (ZIP)
export const exportEvidence: CommandAction = {
  id: "export.evidence",
  label: "Export Evidence",
  description: "Download health + smoke test results (ZIP)",
  icon: "📦",
  category: "dev",
  handler: async () => {
    try {
      // Collect evidence
      const health = await fetch("/api/healthz").then((r) => r.json());
      const canary = await fetch("/api/tools/canary", {
        method: "POST",
        body: JSON.stringify({ mode: "mock", autoOk: true }),
      }).then((r) => r.json());

      const evidence = {
        timestamp: new Date().toISOString(),
        health,
        canary,
        environment: {
          url: window.location.origin,
          userAgent: navigator.userAgent,
        },
      };

      // Create blob and download
      const blob = new Blob([JSON.stringify(evidence, null, 2)], {
        type: "application/json",
      });

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `spark-evidence-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);

      return {
        success: true,
        message: "Evidence exported successfully",
        details: evidence,
      };
    } catch (err) {
      return {
        success: false,
        message: `Export failed: ${err}`,
      };
    }
  },
};

// Daily Risk Report (ZIP)
export const dailyRiskReport: CommandAction = {
  id: "ops.risk-report",
  label: "Daily Risk Report (ZIP)",
  description: "Download daily evidence package (health + canary + metrics)",
  icon: "📋",
  category: "dev",
  handler: async () => {
    try {
      const response = await fetch("/api/tools/risk-report?emitZip=true");

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `spark-risk-report-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);

      return {
        success: true,
        message: "Risk report downloaded successfully",
      };
    } catch (err) {
      return {
        success: false,
        message: `Download failed: ${err}`,
      };
    }
  },
};

// Canary with ZIP
export const canaryMockZip: CommandAction = {
  id: "ops.canary-mock",
  label: "Canary Mock + ZIP",
  description: "Canary test with evidence package (mock mode)",
  icon: "📦",
  category: "test",
  handler: async () => {
    try {
      const response = await fetch("/api/tools/canary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "mock", autoOk: true }),
      });

      const result = await response.json();

      // Also download evidence
      const riskResponse = await fetch("/api/tools/risk-report?emitZip=true");
      const blob = await riskResponse.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `canary-mock-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);

      return {
        success: result.pass === result.total,
        message: `Canary: ${result.pass}/${result.total} PASS (Evidence downloaded)`,
        details: result,
      };
    } catch (err) {
      return {
        success: false,
        message: `Canary failed: ${err}`,
      };
    }
  },
};

// Widgets Smoke (5m)
export const widgetsSmoke: CommandAction = {
  id: "test.widgets-5m",
  label: "Widgets Smoke (5m)",
  description: "5-minute continuous widget test (real data)",
  icon: "🔄",
  category: "test",
  handler: async () => {
    try {
      // This would typically trigger the PowerShell script
      // For browser execution, we do a quick check instead
      const response = await fetch("/api/healthz");
      const health = await response.json();

      const venueOk =
        (health.venues?.btcturk?.stalenessSec ?? 999) < 30 &&
        (health.venues?.bist?.stalenessSec ?? 999) < 30;

      return {
        success: venueOk,
        message: venueOk
          ? "Venues fresh (run smoke-widgets-real.ps1 for full test)"
          : "Venue staleness high, check console",
        details: health.venues,
      };
    } catch (err) {
      return {
        success: false,
        message: `Widget check failed: ${err}`,
      };
    }
  },
};

// Kill Switch Toggle
export const toggleKillSwitch: CommandAction = {
  id: "ops.toggle-kill-switch",
  label: "Toggle Kill Switch (REAL↔MOCK)",
  description: "Switch between real and mock data modes",
  icon: "🔄",
  category: "dev" as const,
  handler: async () => {
    try {
      const response = await fetch("/api/tools/kill-switch/toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "toggle" }),
      });

      const result = await response.json();

      return {
        success: result.success,
        message: result.message,
        details: result,
      };
    } catch (err) {
      return {
        success: false,
        message: `Kill switch failed: ${err}`,
      };
    }
  },
};

// Venue Metrics
export const showVenueMetrics: CommandAction = {
  id: "ops.venue-metrics",
  label: "Show Venue Metrics",
  description: "Display current venue metrics and staleness",
  icon: "📊",
  category: "dev" as const,
  handler: async () => {
    try {
      const response = await fetch("/api/tools/metrics?format=prometheus");
      const metrics = await response.text();

      // Extract key metrics
      const lines = metrics.split('\n');
      const venueMetrics = lines.filter(line =>
        line.includes('venue_staleness_') ||
        line.includes('venue_http_429_total') ||
        line.includes('ws_reconnects_total')
      );

      return {
        success: true,
        message: "Venue metrics retrieved",
        details: venueMetrics.join('\n'),
      };
    } catch (err) {
      return {
        success: false,
        message: `Metrics failed: ${err}`,
      };
    }
  },
};

// Checkpoint: PRE
export const checkpointPre: CommandAction = {
  id: "checkpoint.pre",
  label: "Checkpoint: PRE",
  description: "Create checkpoint before starting work (safety backup)",
  icon: "💾",
  category: "checkpoint",
  handler: async () => {
    const message = prompt("Task description (optional):") || "checkpoint";
    try {
      const response = await fetch("/api/tools/checkpoint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "pre", message }),
      });

      const result = await response.json();

      return {
        success: result.success,
        message: result.message,
        details: result.output,
      };
    } catch (err) {
      return {
        success: false,
        message: `Checkpoint PRE failed: ${err}`,
      };
    }
  },
};

// Checkpoint: POST (with VerifyUi)
export const checkpointPost: CommandAction = {
  id: "checkpoint.post",
  label: "Checkpoint: POST (VerifyUi)",
  description: "Create checkpoint after work (auto VerifyUi if UI-touch detected)",
  icon: "✅",
  category: "checkpoint",
  handler: async () => {
    const message = prompt("Task description (optional):") || "checkpoint";
    const verifyUi = confirm("Run VerifyUi checks? (Auto-enabled if UI-touch detected)");

    try {
      const response = await fetch("/api/tools/checkpoint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "post", message, verifyUi }),
      });

      const result = await response.json();

      return {
        success: result.success,
        message: result.message,
        details: result.output,
      };
    } catch (err) {
      return {
        success: false,
        message: `Checkpoint POST failed: ${err}`,
      };
    }
  },
};

// Rollback: Last Checkpoint
export const rollbackLast: CommandAction = {
  id: "checkpoint.rollback",
  label: "Rollback: Last Checkpoint",
  description: "Rollback to last checkpoint (uncommitted changes will be stashed)",
  icon: "⏪",
  category: "checkpoint",
  handler: async () => {
    const confirmed = confirm(
      "⚠️ This will reset your working directory to the last checkpoint.\n\n" +
      "Uncommitted changes will be automatically stashed and backed up.\n\n" +
      "Continue?"
    );

    if (!confirmed) {
      return {
        success: false,
        message: "Rollback cancelled",
      };
    }

    try {
      const response = await fetch("/api/tools/checkpoint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "rollback" }),
      });

      const result = await response.json();

      return {
        success: result.success,
        message: result.message,
        details: result.output,
      };
    } catch (err) {
      return {
        success: false,
        message: `Rollback failed: ${err}`,
      };
    }
  },
};

// Rollback: Golden Master
export const rollbackGolden: CommandAction = {
  id: "checkpoint.rollback-golden",
  label: "Rollback: Golden Master",
  description: "Rollback to golden master (ui/golden-master/v1)",
  icon: "🏆",
  category: "checkpoint",
  handler: async () => {
    const confirmed = confirm(
      "⚠️ This will reset your working directory to golden master (ui/golden-master/v1).\n\n" +
      "Uncommitted changes will be automatically stashed and backed up.\n\n" +
      "Continue?"
    );

    if (!confirmed) {
      return {
        success: false,
        message: "Rollback cancelled",
      };
    }

    try {
      const response = await fetch("/api/tools/checkpoint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "rollback-golden" }),
      });

      const result = await response.json();

      return {
        success: result.success,
        message: result.message,
        details: result.output,
      };
    } catch (err) {
      return {
        success: false,
        message: `Rollback failed: ${err}`,
      };
    }
  },
};

// UI: Reset Layout
export const resetUILayout: CommandAction = {
  id: "ui.reset-layout",
  label: "UI: Reset Layout",
  description: "Clear localStorage layout/panel states (panels, last page, open popovers)",
  icon: "🔄",
  category: "dev",
  handler: async () => {
    try {
      // Clear layout-related localStorage keys
      const layoutKeys = [
        "ui.copilotRecentCommands.v1",
        "copilot.greeting.shown",
        "ui.rightRail.collapsed",
        "ui.sidebar.collapsed",
        "ui.lastPage",
        "ui.openPopovers",
      ];

      layoutKeys.forEach((key) => {
        localStorage.removeItem(key);
      });

      // Soft refresh
      if (typeof window !== "undefined") {
        window.location.reload();
      }

      return {
        success: true,
        message: "UI layout reset successfully. Page will refresh.",
        details: { clearedKeys: layoutKeys },
      };
    } catch (err) {
      return {
        success: false,
        message: `Reset failed: ${err}`,
      };
    }
  },
};

// All commands
export const COMMANDS: CommandAction[] = [
  runCanaryMock,
  runCanaryReal,
  checkHealth,
  runSmokeTest,
  exportEvidence,
  dailyRiskReport,
  canaryMockZip,
  widgetsSmoke,
  toggleKillSwitch,
  showVenueMetrics,
  checkpointPre,
  checkpointPost,
  rollbackLast,
  rollbackGolden,
  resetUILayout,
];

// Get commands by category
export function getCommandsByCategory(category: CommandAction["category"]) {
  return COMMANDS.filter((cmd) => cmd.category === category);
}

// Execute command by ID
export async function executeCommand(id: string): Promise<CommandResult> {
  const command = COMMANDS.find((cmd) => cmd.id === id);

  if (!command) {
    return {
      success: false,
      message: `Command not found: ${id}`,
    };
  }

  return command.handler();
}

