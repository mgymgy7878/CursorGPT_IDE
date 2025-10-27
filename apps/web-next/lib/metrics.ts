// Simple Prometheus metrics for auth guard, executor sync, RBAC, audit UI, backtest, and metrics rollup
class Metrics {
  private authGuardBlocked = 0;
  private executorSyncSuccess = 0;
  private executorSyncFailed = 0;
  private rbacBlocked = 0;
  private auditUiQueries = 0;
  private backtestRuns = 0;
  private optimizeRuns = 0;
  private metricsRollupJobs = 0;
  private metricsRollupEvents = 0;

  incAuthGuardBlocked() {
    this.authGuardBlocked++;
  }

  incExecutorSyncSuccess() {
    this.executorSyncSuccess++;
  }

  incExecutorSyncFailed() {
    this.executorSyncFailed++;
  }

  incRbacBlocked() {
    this.rbacBlocked++;
  }

  incAuditUiQueries() {
    this.auditUiQueries++;
  }

  incBacktestRuns() {
    this.backtestRuns++;
  }

  incOptimizeRuns() {
    this.optimizeRuns++;
  }

  incMetricsRollupJobs() {
    this.metricsRollupJobs++;
  }

  incMetricsRollupEvents() {
    this.metricsRollupEvents++;
  }

  renderProm(): string {
    return `# HELP auth_guard_blocked_total Total number of auth guard blocks
# TYPE auth_guard_blocked_total counter
auth_guard_blocked_total ${this.authGuardBlocked}

# HELP executor_sync_success_total Total number of successful executor syncs
# TYPE executor_sync_success_total counter
executor_sync_success_total ${this.executorSyncSuccess}

# HELP executor_sync_failed_total Total number of failed executor syncs
# TYPE executor_sync_failed_total counter
executor_sync_failed_total ${this.executorSyncFailed}

# HELP rbac_blocked_total Total number of RBAC blocks
# TYPE rbac_blocked_total counter
rbac_blocked_total ${this.rbacBlocked}

# HELP audit_ui_queries_total Total number of audit UI queries
# TYPE audit_ui_queries_total counter
audit_ui_queries_total ${this.auditUiQueries}

# HELP backtest_runs_total Total number of backtest runs
# TYPE backtest_runs_total counter
backtest_runs_total ${this.backtestRuns}

# HELP optimize_runs_total Total number of optimize runs
# TYPE optimize_runs_total counter
optimize_runs_total ${this.optimizeRuns}

# HELP metrics_rollup_jobs_total Total number of metrics rollup jobs
# TYPE metrics_rollup_jobs_total counter
metrics_rollup_jobs_total ${this.metricsRollupJobs}

# HELP metrics_rollup_events_total Total number of metrics rollup events
# TYPE metrics_rollup_events_total counter
metrics_rollup_events_total ${this.metricsRollupEvents}
`;
  }
}

export const metrics = new Metrics(); 