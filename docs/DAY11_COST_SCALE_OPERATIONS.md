# DAY-11 Cost & Scale Pack - Operations Guide

## Overview

DAY-11 Cost & Scale Pack, production-scale autoscaling, multi-tenant güvenliği ve cost optimization sağlayan kapsamlı bir sistemdir. Docker containerization, Kubernetes deployment, HPA autoscaling, cold-start warmup ve tenant guardrails ile sistem ölçeklenebilirliğini artırır.

## Components

### 1. Production Docker
- **Multi-Stage Build**: Alpine build + distroless runtime
- **Small Image**: <120MB optimized bundle
- **Security**: Distroless base image
- **Health Checks**: Built-in health monitoring

### 2. Kubernetes Deployment
- **Deployment**: Rolling updates, replicas management
- **Service**: Load balancing, service discovery
- **HPA**: CPU/Memory based autoscaling
- **PDB**: Pod disruption budget protection

### 3. Autoscaling (HPA v2)
- **CPU Scaling**: 70% CPU utilization target
- **Memory Scaling**: 80% memory utilization target
- **Scale Range**: 2-12 replicas
- **Stabilization**: Scale up/down windows

### 4. Cold-Start Warmup
- **Schema Preload**: Fast-json-stringify compilation
- **Exchange Info**: Symbol data preloading
- **WebSocket**: Connection establishment
- **Cache Warming**: Frequently used data

### 5. Multi-Tenant Guardrails
- **Authentication**: X-Org-Id + X-Api-Key validation
- **Rate Limiting**: Token bucket algorithm
- **Quotas**: Per-tenant QPS limits
- **Metrics**: Tenant-labeled monitoring

### 6. Cost Optimization
- **HTTP Keep-Alive**: Connection reuse
- **Fast JSON**: Zero-copy serialization
- **Source Maps**: Disabled in production
- **Log Levels**: INFO only in production

## Environment Variables

```bash
# ---- SCALE ----
HTTP_SERVER_CONCURRENCY=512
OUTBOUND_MAX_CONCURRENCY=64
HPA_MIN_REPLICAS=2
HPA_MAX_REPLICAS=12
HPA_TARGET_CPU=70

# ---- TENANT GUARD ----
TENANT_KEYS_FILE=runtime/tenants.json
TENANT_DEFAULT_QPS=2
TENANT_BURST=4

# ---- WARMUP ----
WARMUP_ENABLED=true
WARMUP_PRELOAD_SYMBOLS=BTCUSDT,ETHUSDT,BNBUSDT
```

## Docker Operations

### Build Process
```bash
# Multi-stage build
docker build -t spark-executor:v0.3.3 -f services/executor/Dockerfile .

# Image size optimization
docker images spark-executor:v0.3.3
```

### Registry Push
```bash
# Tag and push
docker tag spark-executor:v0.3.3 YOUR_REGISTRY/spark-executor:v0.3.3
docker push YOUR_REGISTRY/spark-executor:v0.3.3
```

### Image Security
- **Distroless Base**: Minimal attack surface
- **Non-Root User**: Security best practices
- **Health Checks**: Built-in monitoring
- **Layer Optimization**: Minimal layers

## Kubernetes Operations

### Deployment
```bash
# Apply manifests
kubectl apply -f ops/k8s/executor.yaml

# Check status
kubectl rollout status deploy/spark-executor
kubectl get pods -l app=spark-executor
```

### Autoscaling
```bash
# Check HPA
kubectl get hpa spark-executor-hpa

# Monitor scaling
kubectl describe hpa spark-executor-hpa
```

### Resource Management
```bash
# Resource requests/limits
kubectl describe pod -l app=spark-executor

# Resource usage
kubectl top pods -l app=spark-executor
```

## Multi-Tenant Operations

### Tenant Configuration
```json
{
  "orgA": {
    "apiKey": "REDACTED_ORG_A_KEY",
    "qps": 5
  },
  "orgB": {
    "apiKey": "REDACTED_ORG_B_KEY",
    "qps": 20
  }
}
```

### Authentication Flow
1. **X-Org-Id**: Organization identifier
2. **X-Api-Key**: Authentication token
3. **Rate Limiting**: Token bucket algorithm
4. **Response Headers**: X-Tenant header

### Rate Limiting
- **Token Bucket**: Configurable QPS limits
- **Burst Protection**: Burst allowance
- **429 Response**: Rate limit exceeded
- **Metrics**: Tenant-labeled counters

## Performance Testing

### Load Testing
```bash
# Autocannon load test
npx autocannon -c 50 -d 30 -p 10 http://localhost:4001/api/private/open-orders

# Expected: HPA scaling triggered
kubectl get hpa spark-executor-hpa
```

### Tenant Testing
```bash
# Authentication test
curl -H "X-Org-Id:orgA" -H "X-Api-Key:KEY" http://localhost:4001/api/private/health

# Rate limit test
for i in {1..10}; do
  curl -H "X-Org-Id:orgA" -H "X-Api-Key:KEY" http://localhost:4001/api/private/health
done
```

### Cold-Start Testing
```bash
# Pod restart test
kubectl delete pod -l app=spark-executor

# Check warmup logs
kubectl logs -l app=spark-executor | grep WARMUP
```

## Monitoring & Metrics

### Key Metrics

#### Autoscaling Metrics
- `kube_horizontalpodautoscaler_status_current_replicas`: Current replicas
- `kube_horizontalpodautoscaler_status_target_metrics`: Target metrics
- `kube_pod_container_resource_requests_cpu_cores`: CPU requests
- `kube_pod_container_resource_limits_cpu_cores`: CPU limits

#### Tenant Metrics
- `spark_tenant_requests_total{org=...}`: Request count by tenant
- `spark_tenant_errors_total{org=...}`: Error count by tenant
- `spark_tenant_rejects_total{org=...,reason=...}`: Rejection reasons

#### Performance Metrics
- `spark_perf_http_duration_ms`: HTTP response times
- `spark_outbound_concurrency`: Outbound request concurrency
- `spark_warmup_duration_ms`: Cold-start warmup time

### Grafana Queries

#### HPA Scaling
```promql
kube_horizontalpodautoscaler_status_current_replicas{horizontalpodautoscaler="spark-executor-hpa"}
```

#### Tenant Performance
```promql
rate(spark_tenant_requests_total[5m])
```

#### Resource Utilization
```promql
kube_pod_container_resource_usage_cpu_cores{container="executor"}
```

## Cost Optimization

### Resource Optimization
- **CPU Requests**: 200m (0.2 cores)
- **Memory Requests**: 256Mi
- **CPU Limits**: 1 core
- **Memory Limits**: 1Gi

### Image Optimization
- **Multi-Stage Build**: Separate build and runtime
- **Distroless Base**: Minimal runtime image
- **Bundle Only**: Single executable file
- **No Source Maps**: Reduced size

### Performance Optimization
- **HTTP Keep-Alive**: Connection reuse
- **Fast JSON**: Schema-based serialization
- **Outbound Limits**: Concurrency control
- **Warmup**: Cold-start optimization

## Troubleshooting

### Docker Issues

#### Build Failures
```bash
# Check build context
docker build --no-cache -t spark-executor:v0.3.3 .

# Check image size
docker images spark-executor:v0.3.3
```

#### Runtime Issues
```bash
# Check container logs
docker logs <container_id>

# Check health status
docker inspect <container_id> | grep Health
```

### Kubernetes Issues

#### Pod Startup Failures
```bash
# Check pod events
kubectl describe pod -l app=spark-executor

# Check pod logs
kubectl logs -l app=spark-executor
```

#### HPA Not Scaling
```bash
# Check HPA status
kubectl describe hpa spark-executor-hpa

# Check metrics
kubectl top pods -l app=spark-executor
```

#### Resource Issues
```bash
# Check resource usage
kubectl top pods -l app=spark-executor

# Check resource limits
kubectl describe pod -l app=spark-executor
```

### Tenant Issues

#### Authentication Failures
```bash
# Check tenant configuration
cat runtime/tenants.json

# Check tenant middleware logs
kubectl logs -l app=spark-executor | grep TENANT
```

#### Rate Limiting Issues
```bash
# Check rate limit settings
echo $TENANT_DEFAULT_QPS
echo $TENANT_BURST

# Test rate limiting
curl -H "X-Org-Id:orgA" -H "X-Api-Key:KEY" http://localhost:4001/api/private/health
```

## Emergency Procedures

### Pod Scaling Emergency
```bash
# Force scale down
kubectl scale deploy spark-executor --replicas=1

# Disable HPA
kubectl patch hpa spark-executor-hpa -p '{"spec":{"minReplicas":1,"maxReplicas":1}}'
```

### Tenant Emergency
```bash
# Disable tenant middleware
kubectl set env deploy/spark-executor TENANT_DEFAULT_QPS=1000

# Restart deployment
kubectl rollout restart deploy/spark-executor
```

### Resource Emergency
```bash
# Increase resource limits
kubectl patch deploy spark-executor -p '{"spec":{"template":{"spec":{"containers":[{"name":"executor","resources":{"limits":{"cpu":"2","memory":"2Gi"}}}]}}}}'

# Check resource usage
kubectl top pods -l app=spark-executor
```

## Best Practices

### Deployment Strategy
1. **Rolling Updates**: Zero-downtime deployments
2. **Health Checks**: Readiness and liveness probes
3. **Resource Limits**: Proper resource allocation
4. **Pod Disruption Budget**: High availability protection

### Scaling Strategy
1. **Horizontal Scaling**: Add more replicas
2. **Vertical Scaling**: Increase resource limits
3. **Auto Scaling**: HPA for dynamic scaling
4. **Manual Scaling**: Emergency override capability

### Security Strategy
1. **Multi-Tenant Isolation**: Tenant guardrails
2. **Rate Limiting**: Prevent abuse
3. **Authentication**: API key validation
4. **Authorization**: Resource access control

### Cost Strategy
1. **Resource Optimization**: Right-size resources
2. **Image Optimization**: Minimal container images
3. **Performance Optimization**: Efficient code
4. **Monitoring**: Cost-aware metrics

## Monitoring Checklist

### Daily Checks
- [ ] Pod health and readiness
- [ ] HPA scaling status
- [ ] Resource utilization
- [ ] Tenant authentication
- [ ] Rate limiting effectiveness

### Weekly Reviews
- [ ] Scaling performance analysis
- [ ] Cost optimization review
- [ ] Tenant usage patterns
- [ ] Resource allocation optimization
- [ ] Security audit review

### Monthly Assessments
- [ ] Scaling strategy review
- [ ] Cost optimization analysis
- [ ] Tenant growth planning
- [ ] Infrastructure scaling plan
- [ ] Security policy updates

---

**Bu operasyon kılavuzu, DAY-11 Cost & Scale Pack'in etkili kullanımı için gerekli tüm bilgileri içerir. Tüm operasyonlar production-safe olarak tasarlanmıştır.** 