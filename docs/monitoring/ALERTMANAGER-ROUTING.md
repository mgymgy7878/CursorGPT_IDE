# Alertmanager Routing (v1.11.8)

Save as `/etc/alertmanager/alertmanager.yml` and reload Alertmanager.

```yaml
route:
  group_by: ['alertname','service','env']
  group_wait: 30s
  group_interval: 5m
  repeat_interval: 2h
  receiver: spark-copilot
  routes:
    - matchers: [ 'service="executor"', 'env="prod"' ]
      receiver: spark-copilot
    - matchers: [ 'service="web-next"', 'env="prod"' ]
      receiver: spark-copilot
    - matchers: [ 'env!="prod"' ]
      receiver: spark-dev-null

receivers:
  - name: spark-copilot
    webhook_configs:
      - url: 'http://127.0.0.1:4001/util/alerts/copilot'
        send_resolved: true
        http_config:
          headers:
            X-Spark-Token: '${ALERT_TOKEN}'
  - name: spark-dev-null
    webhook_configs: []  # sink
```
