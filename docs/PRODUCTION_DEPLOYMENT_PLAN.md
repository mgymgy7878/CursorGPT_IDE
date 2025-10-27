# 🚀 Spark Trading Platform - Production Deployment Plan

## 📋 **GENEL BAKIŞ**

**Plan Tarihi**: 2025-01-16  
**Versiyon**: 0.3.3  
**Hedef**: Production-ready deployment pipeline

---

## 🎯 **DEPLOYMENT STRATEJİSİ**

### **Mimari Yaklaşım**
- **Containerization**: Docker + docker-compose
- **Orchestration**: Kubernetes (production)
- **Service Mesh**: Istio (advanced routing)
- **CI/CD**: GitHub Actions
- **Monitoring**: Prometheus + Grafana

### **Deployment Modelleri**
1. **Development**: Docker Compose (local)
2. **Staging**: Kubernetes (test cluster)
3. **Production**: Kubernetes (prod cluster)

---

## 📦 **PHASE 1: DOCKER CONTAINERIZATION**

### **1.1 Backend Container (Executor)**

```dockerfile
# packages/executor/Dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM node:18-alpine AS runtime
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY package*.json ./

EXPOSE 4001
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:4001/public/health || exit 1

CMD ["node", "dist/server.js"]
```

### **1.2 Frontend Container (Next.js)**

```dockerfile
# apps/web-next/Dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:18-alpine AS runtime
WORKDIR /app
COPY --from=builder /app/next.config.mjs ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3003
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3003/api/local/health || exit 1

CMD ["node", "server.js"]
```

### **1.3 Docker Compose**

```yaml
# docker-compose.yml
version: '3.8'

services:
  executor:
    build:
      context: .
      dockerfile: packages/executor/Dockerfile
    ports:
      - "4001:4001"
    environment:
      - EXECUTOR_PORT=4001
      - EXECUTOR_LOG_LEVEL=info
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:4001/public/health"]
      interval: 30s
      timeout: 10s
      retries: 3
    networks:
      - spark-network

  web-next:
    build:
      context: .
      dockerfile: apps/web-next/Dockerfile
    ports:
      - "3003:3003"
    environment:
      - NEXT_PUBLIC_EXECUTOR_ORIGIN=http://executor:4001
      - EXECUTOR_ORIGIN=http://executor:4001
      - NEXT_PUBLIC_API_BASE_URL=/api
    depends_on:
      executor:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3003/api/local/health"]
      interval: 30s
      timeout: 10s
      retries: 3
    networks:
      - spark-network

  prometheus:
    image: prom/prometheus:latest
    ports:
      - "9090:9090"
    volumes:
      - ./ops/prometheus/prometheus.yml:/etc/prometheus/prometheus.yml
    networks:
      - spark-network

  grafana:
    image: grafana/grafana:latest
    ports:
      - "3000:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
    volumes:
      - grafana-storage:/var/lib/grafana
    networks:
      - spark-network

networks:
  spark-network:
    driver: bridge

volumes:
  grafana-storage:
```

---

## ☸️ **PHASE 2: KUBERNETES DEPLOYMENT**

### **2.1 Namespace ve RBAC**

```yaml
# k8s/namespace.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: spark-trading
  labels:
    name: spark-trading
```

```yaml
# k8s/rbac.yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: spark-executor
  namespace: spark-trading
---
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: spark-executor-role
  namespace: spark-trading
rules:
  - apiGroups: [""]
    resources: ["pods", "services"]
    verbs: ["get", "list", "watch"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: spark-executor-binding
  namespace: spark-trading
subjects:
  - kind: ServiceAccount
    name: spark-executor
    namespace: spark-trading
roleRef:
  kind: Role
  name: spark-executor-role
  apiGroup: rbac.authorization.k8s.io
```

### **2.2 ConfigMap ve Secrets**

```yaml
# k8s/configmap.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: spark-config
  namespace: spark-trading
data:
  EXECUTOR_PORT: "4001"
  EXECUTOR_LOG_LEVEL: "info"
  NEXT_PUBLIC_API_BASE_URL: "/api"
```

```yaml
# k8s/secrets.yaml
apiVersion: v1
kind: Secret
metadata:
  name: spark-secrets
  namespace: spark-trading
type: Opaque
data:
  # Base64 encoded secrets
  API_KEY: <base64-encoded-api-key>
  JWT_SECRET: <base64-encoded-jwt-secret>
```

### **2.3 Backend Deployment**

```yaml
# k8s/executor-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: spark-executor
  namespace: spark-trading
spec:
  replicas: 3
  selector:
    matchLabels:
      app: spark-executor
  template:
    metadata:
      labels:
        app: spark-executor
    spec:
      serviceAccountName: spark-executor
      containers:
      - name: executor
        image: spark-executor:latest
        ports:
        - containerPort: 4001
        env:
        - name: EXECUTOR_PORT
          valueFrom:
            configMapKeyRef:
              name: spark-config
              key: EXECUTOR_PORT
        - name: EXECUTOR_LOG_LEVEL
          valueFrom:
            configMapKeyRef:
              name: spark-config
              key: EXECUTOR_LOG_LEVEL
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /public/health
            port: 4001
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /public/health
            port: 4001
          initialDelaySeconds: 5
          periodSeconds: 5
```

### **2.4 Frontend Deployment**

```yaml
# k8s/web-next-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: spark-web-next
  namespace: spark-trading
spec:
  replicas: 2
  selector:
    matchLabels:
      app: spark-web-next
  template:
    metadata:
      labels:
        app: spark-web-next
    spec:
      containers:
      - name: web-next
        image: spark-web-next:latest
        ports:
        - containerPort: 3003
        env:
        - name: NEXT_PUBLIC_EXECUTOR_ORIGIN
          value: "http://spark-executor-service:4001"
        - name: EXECUTOR_ORIGIN
          value: "http://spark-executor-service:4001"
        - name: NEXT_PUBLIC_API_BASE_URL
          valueFrom:
            configMapKeyRef:
              name: spark-config
              key: NEXT_PUBLIC_API_BASE_URL
        resources:
          requests:
            memory: "512Mi"
            cpu: "250m"
          limits:
            memory: "1Gi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /api/local/health
            port: 3003
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /api/local/health
            port: 3003
          initialDelaySeconds: 5
          periodSeconds: 5
```

### **2.5 Services**

```yaml
# k8s/services.yaml
apiVersion: v1
kind: Service
metadata:
  name: spark-executor-service
  namespace: spark-trading
spec:
  selector:
    app: spark-executor
  ports:
  - protocol: TCP
    port: 4001
    targetPort: 4001
  type: ClusterIP
---
apiVersion: v1
kind: Service
metadata:
  name: spark-web-next-service
  namespace: spark-trading
spec:
  selector:
    app: spark-web-next
  ports:
  - protocol: TCP
    port: 3003
    targetPort: 3003
  type: ClusterIP
```

### **2.6 Ingress**

```yaml
# k8s/ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: spark-ingress
  namespace: spark-trading
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /
    cert-manager.io/cluster-issuer: letsencrypt-prod
spec:
  tls:
  - hosts:
    - spark-trading.example.com
    secretName: spark-tls
  rules:
  - host: spark-trading.example.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: spark-web-next-service
            port:
              number: 3003
      - path: /api
        pathType: Prefix
        backend:
          service:
            name: spark-executor-service
            port:
              number: 4001
```

---

## 🔄 **PHASE 3: CI/CD PIPELINE**

### **3.1 GitHub Actions Workflow**

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v4
    
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: pnpm install
    
    - name: Run typecheck
      run: pnpm typecheck
    
    - name: Run tests
      run: pnpm test
    
    - name: Build packages
      run: pnpm build:packages
    
    - name: Build apps
      run: pnpm build:apps

  build-and-push:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
    - uses: actions/checkout@v4
    
    - name: Set up Docker Buildx
      uses: docker/setup-buildx-action@v3
    
    - name: Log in to Container Registry
      uses: docker/login-action@v3
      with:
        registry: ${{ env.REGISTRY }}
        username: ${{ github.actor }}
        password: ${{ secrets.GITHUB_TOKEN }}
    
    - name: Build and push executor
      uses: docker/build-push-action@v5
      with:
        context: .
        file: packages/executor/Dockerfile
        push: true
        tags: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}/executor:${{ github.sha }}
    
    - name: Build and push web-next
      uses: docker/build-push-action@v5
      with:
        context: .
        file: apps/web-next/Dockerfile
        push: true
        tags: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}/web-next:${{ github.sha }}

  deploy:
    needs: build-and-push
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
    - uses: actions/checkout@v4
    
    - name: Set up kubectl
      uses: azure/setup-kubectl@v3
    
    - name: Configure kubectl
      run: |
        echo "${{ secrets.KUBE_CONFIG }}" | base64 -d > kubeconfig.yaml
        export KUBECONFIG=kubeconfig.yaml
    
    - name: Deploy to Kubernetes
      run: |
        kubectl apply -f k8s/
        kubectl set image deployment/spark-executor executor=${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}/executor:${{ github.sha }} -n spark-trading
        kubectl set image deployment/spark-web-next web-next=${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}/web-next:${{ github.sha }} -n spark-trading
        kubectl rollout status deployment/spark-executor -n spark-trading
        kubectl rollout status deployment/spark-web-next -n spark-trading
```

---

## 📊 **PHASE 4: MONITORING & OBSERVABILITY**

### **4.1 Prometheus Configuration**

```yaml
# ops/prometheus/prometheus.yml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'spark-executor'
    static_configs:
      - targets: ['spark-executor-service:4001']
    metrics_path: '/public/metrics/prom'
  
  - job_name: 'spark-web-next'
    static_configs:
      - targets: ['spark-web-next-service:3003']
    metrics_path: '/api/local/metrics/prom'
```

### **4.2 Grafana Dashboards**

```json
// ops/grafana/dashboards/spark-overview.json
{
  "dashboard": {
    "title": "Spark Trading Platform Overview",
    "panels": [
      {
        "title": "Executor Health",
        "type": "stat",
        "targets": [
          {
            "expr": "up{job=\"spark-executor\"}",
            "legendFormat": "Executor Status"
          }
        ]
      },
      {
        "title": "Web Next Health",
        "type": "stat",
        "targets": [
          {
            "expr": "up{job=\"spark-web-next\"}",
            "legendFormat": "Web Next Status"
          }
        ]
      },
      {
        "title": "Response Time",
        "type": "graph",
        "targets": [
          {
            "expr": "http_request_duration_seconds",
            "legendFormat": "{{service}} - {{endpoint}}"
          }
        ]
      }
    ]
  }
}
```

---

## 🔒 **PHASE 5: SECURITY & COMPLIANCE**

### **5.1 Network Policies**

```yaml
# k8s/network-policies.yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: spark-network-policy
  namespace: spark-trading
spec:
  podSelector: {}
  policyTypes:
  - Ingress
  - Egress
  ingress:
  - from:
    - namespaceSelector:
        matchLabels:
          name: ingress-nginx
    ports:
    - protocol: TCP
      port: 3003
    - protocol: TCP
      port: 4001
  egress:
  - to:
    - namespaceSelector:
        matchLabels:
          name: kube-system
    ports:
    - protocol: TCP
      port: 53
```

### **5.2 Security Context**

```yaml
# Security context for deployments
securityContext:
  runAsNonRoot: true
  runAsUser: 1000
  fsGroup: 2000
  capabilities:
    drop:
    - ALL
```

---

## 🚀 **DEPLOYMENT CHECKLIST**

### **Pre-Deployment**
- [ ] All tests passing
- [ ] Security scan completed
- [ ] Performance benchmarks met
- [ ] Documentation updated
- [ ] Rollback plan prepared

### **Deployment**
- [ ] Docker images built and pushed
- [ ] Kubernetes manifests applied
- [ ] Services healthy
- [ ] Ingress configured
- [ ] SSL certificates valid

### **Post-Deployment**
- [ ] Health checks passing
- [ ] Monitoring alerts configured
- [ ] Performance metrics normal
- [ ] User acceptance testing
- [ ] Documentation updated

---

## 📞 **ROLLBACK PROCEDURE**

### **Quick Rollback**
```bash
# Rollback to previous version
kubectl rollout undo deployment/spark-executor -n spark-trading
kubectl rollout undo deployment/spark-web-next -n spark-trading

# Verify rollback
kubectl rollout status deployment/spark-executor -n spark-trading
kubectl rollout status deployment/spark-web-next -n spark-trading
```

### **Emergency Rollback**
```bash
# Scale down to zero
kubectl scale deployment spark-executor --replicas=0 -n spark-trading
kubectl scale deployment spark-web-next --replicas=0 -n spark-trading

# Deploy stable version
kubectl apply -f k8s/stable/
```

---

*Bu plan, Spark Trading Platform'un production deployment sürecini detaylandırır. Her phase sırayla uygulanmalı ve test edilmelidir.* 