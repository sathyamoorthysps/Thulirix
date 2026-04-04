# Deployment Guide

This guide covers deploying Thulirix to various environments.

## Docker Compose (Development/Production)

### Prerequisites
- Docker 20+
- Docker Compose 2.0+

### Development Deployment
```bash
# Clone repo
git clone <repo-url>
cd thulirix

# Start all services
docker-compose up --build

# Or run in background
docker-compose up -d --build
```

Services:
- PostgreSQL: localhost:6004
- Redis: localhost:6005
- Backend: localhost:6001
- Frontend: localhost:6002
- Nginx: localhost:6003

### Production Deployment
```bash
# Use production overrides
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

Production differences:
- Optimized builds
- Environment-specific configs
- Secrets management
- Health checks enabled

### Environment Variables for Production
Create `.env` files or use Docker secrets:

#### Backend Production Config
```env
DB_HOST=prod-db-host
DB_PASS=secure-password
REDIS_PASSWORD=secure-redis-pass
JWT_SECRET=256-bit-secret-key
APP_BASE_URL=https://api.thulirix.io
```

#### Frontend Production Config
```env
VITE_API_BASE_URL=https://api.thulirix.io/api/v1
```

## Kubernetes Deployment

### Prerequisites
- Kubernetes cluster
- kubectl configured
- Helm (optional)

### Using Docker Compose to K8s
1. Use `kompose` to convert docker-compose.yml to K8s manifests:
   ```bash
   kompose convert -f docker-compose.yml
   ```

2. Apply the generated YAMLs:
   ```bash
   kubectl apply -f .
   ```

### Manual K8s Deployment

#### 1. PostgreSQL StatefulSet
```yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: postgres
spec:
  serviceName: postgres
  replicas: 1
  selector:
    matchLabels:
      app: postgres
  template:
    metadata:
      labels:
        app: postgres
    spec:
      containers:
      - name: postgres
        image: postgres:16-alpine
        env:
        - name: POSTGRES_DB
          value: "thulirix"
        - name: POSTGRES_USER
          value: "thulirix_user"
        - name: POSTGRES_PASSWORD
          valueFrom:
            secretKeyRef:
              name: postgres-secret
              key: password
        ports:
        - containerPort: 5432
        volumeMounts:
        - name: postgres-storage
          mountPath: /var/lib/postgresql/data
  volumeClaimTemplates:
  - metadata:
      name: postgres-storage
    spec:
      accessModes: ["ReadWriteOnce"]
      resources:
        requests:
          storage: 10Gi
```

#### 2. Redis Deployment
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: redis
spec:
  replicas: 1
  selector:
    matchLabels:
      app: redis
  template:
    metadata:
      labels:
        app: redis
    spec:
      containers:
      - name: redis
        image: redis:7-alpine
        command: ["redis-server", "--requirepass", "$(REDIS_PASSWORD)"]
        env:
        - name: REDIS_PASSWORD
          valueFrom:
            secretKeyRef:
              name: redis-secret
              key: password
        ports:
        - containerPort: 6379
        volumeMounts:
        - name: redis-storage
          mountPath: /data
      volumes:
      - name: redis-storage
        persistentVolumeClaim:
          claimName: redis-pvc
```

#### 3. Backend Deployment
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: thulirix-backend
spec:
  replicas: 2
  selector:
    matchLabels:
      app: thulirix-backend
  template:
    metadata:
      labels:
        app: thulirix-backend
    spec:
      containers:
      - name: backend
        image: thulirix/backend:latest
        env:
        - name: SPRING_PROFILES_ACTIVE
          value: "prod"
        - name: DB_HOST
          value: "postgres"
        - name: DB_USER
          value: "thulirix_user"
        - name: DB_PASS
          valueFrom:
            secretKeyRef:
              name: postgres-secret
              key: password
        - name: REDIS_HOST
          value: "redis"
        - name: REDIS_PASSWORD
          valueFrom:
            secretKeyRef:
              name: redis-secret
              key: password
        - name: JWT_SECRET
          valueFrom:
            secretKeyRef:
              name: jwt-secret
              key: secret
        ports:
        - containerPort: 6001
        livenessProbe:
          httpGet:
            path: /actuator/health
            port: 6001
          initialDelaySeconds: 60
          periodSeconds: 30
        readinessProbe:
          httpGet:
            path: /actuator/health
            port: 6001
          initialDelaySeconds: 30
          periodSeconds: 10
```

#### 4. Frontend Deployment
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: thulirix-frontend
spec:
  replicas: 2
  selector:
    matchLabels:
      app: thulirix-frontend
  template:
    metadata:
      labels:
        app: thulirix-frontend
    spec:
      containers:
      - name: frontend
        image: thulirix/frontend:latest
        env:
        - name: VITE_API_BASE_URL
          value: "https://api.thulirix.io/api/v1"
        ports:
        - containerPort: 80
        livenessProbe:
          httpGet:
            path: /
            port: 80
          initialDelaySeconds: 30
          periodSeconds: 30
        readinessProbe:
          httpGet:
            path: /
            port: 80
          initialDelaySeconds: 10
          periodSeconds: 10
```

#### 5. Nginx Ingress
```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: thulirix-ingress
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /
spec:
  rules:
  - host: thulirix.io
    http:
      paths:
      - path: /api
        pathType: Prefix
        backend:
          service:
            name: thulirix-backend
            port:
              number: 6001
      - path: /
        pathType: Prefix
        backend:
          service:
            name: thulirix-frontend
            port:
              number: 80
```

### Services
Create ClusterIP services for backend and frontend.

### Secrets
Create Kubernetes secrets for passwords and JWT secret.

## Cloud Deployments

### Azure Container Apps
1. Build and push images to ACR
2. Create Container Apps for each service
3. Use Azure Database for PostgreSQL and Azure Cache for Redis
4. Configure networking and secrets

### AWS ECS/Fargate
1. Build images and push to ECR
2. Create ECS cluster
3. Use RDS PostgreSQL and ElastiCache Redis
4. Deploy services with task definitions

### Google Cloud Run
1. Build images and push to GCR/Artifact Registry
2. Use Cloud SQL PostgreSQL and Memorystore Redis
3. Deploy as Cloud Run services

## Monitoring

### Health Checks
- Backend: `/actuator/health`
- Frontend: `/` (200 OK)
- Database: Connection pool monitoring
- Redis: Connection and memory monitoring

### Logging
- Centralized logging with ELK stack or similar
- Application logs to stdout/stderr
- Nginx access/error logs

### Metrics
- Spring Boot Actuator metrics
- Prometheus/Grafana for monitoring
- Custom metrics for business logic

## Backup & Recovery

### Database Backup
- Automated PostgreSQL backups
- Point-in-time recovery
- Cross-region replication for HA

### Application Backup
- Container images in registry
- Config as code
- Database schema migrations

## Scaling

### Horizontal Scaling
- Increase replica count for backend/frontend
- Database read replicas
- Redis cluster for caching

### Vertical Scaling
- Increase CPU/memory for containers
- Database instance sizing

## Security

### Network Security
- Use internal networking for service communication
- Expose only necessary ports
- Use TLS/SSL for external traffic

### Secrets Management
- Use Kubernetes secrets or cloud secret managers
- Rotate secrets regularly
- Never commit secrets to code

### Compliance
- Data encryption at rest and in transit
- Regular security audits
- Vulnerability scanning for containers</content>
<parameter name="filePath">c:\Users\sathy\thulirix\docs\Deployment.md