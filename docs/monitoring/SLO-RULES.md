# Spark Smoke SLO Rules (v1.11.7)

Save as `/etc/prometheus/rules/spark-smoke.yml` and reload Prometheus.

```yaml
groups:
  - name: spark-smoke
    interval: 30s
    rules:
      - alert: SparkSmokeExitCodeCritical
        expr: spark_smoke_exit_code != 0
        for: 5m
        labels:
          severity: critical
          job: spark-executor
          service: spark
        annotations:
          summary: "Smoke exit_code critical"
          description: "exit_code={{ $value }}"

      - alert: SparkSmokeP95Warning
        expr: spark_smoke_p95_latency_ms > 1200
        for: 5m
        labels:
          severity: warning
          job: spark-executor
          service: spark
        annotations:
          summary: "Smoke p95 latency warning"
          description: "p95={{ $value }}ms > 1200ms"

      - alert: SparkSmokeP95Critical
        expr: spark_smoke_p95_latency_ms > 2400
        for: 3m
        labels:
          severity: critical
          job: spark-executor
          service: spark
        annotations:
          summary: "Smoke p95 latency critical"
          description: "p95={{ $value }}ms > 2400ms"

      - alert: SparkSmokeStalenessWarning
        expr: spark_smoke_staleness_seconds > 30
        for: 5m
        labels:
          severity: warning
          job: spark-executor
          service: spark
        annotations:
          summary: "Smoke staleness warning"
          description: "staleness={{ $value }}s > 30s"
```
