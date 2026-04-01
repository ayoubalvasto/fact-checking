# Deployment Guide

Complete step-by-step deployment instructions for different environments.

## 📋 Prerequisites

### System Requirements
- 4GB RAM minimum (8GB recommended)
- 20GB disk space minimum
- Docker & Docker Compose (v2+)
- Git

### Credentials & Access
- Database credentials
- Cloud provider accounts (optional)
- GitHub account (for CI/CD)

## 🐳 Docker Compose (Recommended)

### Local Development

```bash
# Clone repository
git clone <repository-url>
cd medical-factcheck

# Setup environment
cp .env.development .env.docker-local
# Edit as needed:
# - DB_PASSWORD
# - CORS_ORIGINS

# Generate SSL certificates
bash devops/generate-certs.sh

# Start services
docker-compose up -d

# Verify services
docker-compose ps
curl http://localhost:8000/api/v1/health/

# View logs
docker-compose logs -f backend
docker-compose logs -f frontend
```

**Access Points:**
- Frontend: http://localhost:3000
- Backend: http://localhost:8000
- API Docs: http://localhost:8000/api/docs
- Database: postgresql://medical_user:pass@localhost:5432/medical_factcheck

### Production Deployment (Docker)

```bash
# Setup production environment
cp .env.production .env.production.local
# Edit crucial variables:
# - DB_PASSWORD (strong password)
# - CORS_ORIGINS (your domain)
# - NEXT_PUBLIC_API_URL (your domain)

# Build images
docker-compose build

# Generate SSL certificates
bash devops/generate-certs.sh

# Start services
docker-compose up -d

# Initialize database
docker-compose exec backend python -c "from app.database import init_db; init_db()"

# Generate sample dataset (optional)
docker-compose exec backend python -c "
from ml_nlp.services.dataset_generator import DatasetGenerator
gen = DatasetGenerator()
gen.generate_sample_dataset(1000)
gen.save_as_parquet('data/claims.parquet')
"

# Verify deployment
docker-compose ps
docker-compose exec backend curl http://localhost:8000/api/v1/health/
```

### Stopping Services

```bash
# Stop without removing volumes
docker-compose stop

# Stop and remove (WILL DELETE DATA)
docker-compose down -v
```

## ☁️ AWS ECS Deployment

### Prerequisites
- AWS Account
- AWS CLI configured
- ECR repositories created

### Setup

```bash
# Set AWS environment variables
export AWS_REGION=us-east-1
export AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
export ECR_REGISTRY=$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com

# Create ECR repositories
aws ecr create-repository --repository-name medical-factcheck-backend --region $AWS_REGION
aws ecr create-repository --repository-name medical-factcheck-frontend --region $AWS_REGION

# Build and push images
docker build -f devops/Dockerfile.backend -t $ECR_REGISTRY/medical-factcheck-backend:latest .
docker build -f devops/Dockerfile.frontend -t $ECR_REGISTRY/medical-factcheck-frontend:latest .

# Authenticate with ECR
aws ecr get-login-password --region $AWS_REGION | docker login \
    --username AWS --password-stdin $ECR_REGISTRY

# Push images
docker push $ECR_REGISTRY/medical-factcheck-backend:latest
docker push $ECR_REGISTRY/medical-factcheck-frontend:latest
```

### ECS Cluster Creation

```bash
# Create cluster
aws ecs create-cluster --cluster-name medical-factcheck

# Create RDS PostgreSQL instance
aws rds create-db-instance \
    --db-instance-identifier medical-factcheck-db \
    --db-instance-class db.t3.small \
    --engine postgres \
    --master-username admin \
    --master-user-password '<strong-password>' \
    --allocated-storage 100

# Create ElastiCache Redis
aws elasticache create-cache-cluster \
    --cache-cluster-id medical-factcheck-redis \
    --cache-node-type cache.t3.small \
    --engine redis \
    --num-cache-nodes 1
```

### Task Definition & Service

```bash
# Register backend task
aws ecs register-task-definition --cli-input-json file://devops/ecs-backend-task.json

# Create backend service
aws ecs create-service \
    --cluster medical-factcheck \
    --service-name medical-factcheck-backend \
    --task-definition medical-factcheck-backend \
    --desired-count 2 \
    --load-balancers targetGroupArn=arn:aws:...,containerName=backend,containerPort=8000

# Register frontend task
aws ecs register-task-definition --cli-input-json file://devops/ecs-frontend-task.json

# Create frontend service
aws ecs create-service \
    --cluster medical-factcheck \
    --service-name medical-factcheck-frontend \
    --task-definition medical-factcheck-frontend \
    --desired-count 2 \
    --load-balancers targetGroupArn=arn:aws:...,containerName=frontend,containerPort=3000
```

## 🚂 Railway Deployment

### Prerequisites
- Railway Account
- Railway CLI installed

### Deployment

```bash
# Login to Railway
railway login

# Initialize project
railway init

# Create services
railway service create postgres
railway service create redis
railway service create backend
railway service create frontend

# Deploy
railway deploy

# View logs
railway logs backend
railway logs frontend

# Get service URLs
railway status
```

## ⚡ Vercel Deployment (Frontend Only)

### Prerequisites
- Vercel Account
- Vercel CLI installed

### Deployment

```bash
# Login to Vercel
vercel login

# Deploy frontend
cd frontend
vercel deploy --prod

# Set environment variables
vercel env add NEXT_PUBLIC_API_URL https://your-api-domain.com
```

## 🎨 Render Deployment

### Prerequisites
- Render Account
- Git repository pushed to GitHub

### Setup

1. Create `render.yaml`:

```yaml
services:
  - type: web
    name: backend
    env: python
    buildCommand: pip install -r backend/requirements.txt
    startCommand: python backend/main.py
    envVars:
      - key: DATABASE_URL
        fromDatabase:
          name: postgres
          property: connectionString
      - key: REDIS_URL
        fromService:
          name: redis
          property: connectionString

  - type: web
    name: frontend
    env: static
    buildCommand: npm run build
    staticPublishPath: frontend/.next

  - type: pserv
    name: postgres
    ipAllowList: []

  - type: redis
    name: redis
```

2. Push to GitHub and connect Render

## 📊 Database Initialization

### Automated (Docker)

```bash
docker-compose exec backend python -c "from app.database import init_db; init_db()"
```

### Manual

```bash
# Connect to PostgreSQL
psql -U medical_user -d medical_factcheck -h localhost

# Run schema
\i devops/init-db.sql
```

## 🔐 SSL/TLS Configuration

### Self-Signed Certificate (Development)

```bash
bash devops/generate-certs.sh
```

### Let's Encrypt (Production)

```bash
# Using Certbot
sudo certbot certonly --standalone -d yourdomain.com

# Copy certificates
sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem devops/ssl/cert.pem
sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem devops/ssl/key.pem

# Update nginx.conf with paths
```

## 🧪 Verification Tests

### Health Checks

```bash
# Backend
curl http://localhost:8000/api/v1/health/

# Frontend
curl http://localhost:3000

# Database connectivity
docker-compose exec backend python -c "
from app.database import SessionLocal
db = SessionLocal()
db.execute('SELECT 1')
print('✅ Database OK')
"

# Redis connectivity
docker-compose exec redis redis-cli ping
# Output: PONG
```

### Sample Verification

```bash
# Test API
curl -X POST http://localhost:8000/api/v1/verify/ \
  -H "Content-Type: application/json" \
  -d '{
    "text": "الحمى تعالج بالماء البارد فقط",
    "language": "ar"
  }' | jq .
```

## 📈 Monitoring & Logs

### Docker Compose

```bash
# View all logs
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend

# Real-time monitoring
docker stats
```

### Production Monitoring

```bash
# Check container status
docker ps

# View resource usage
docker stats

# Database connections
docker-compose exec db psql -U medical_user -c "SELECT count(*) FROM pg_stat_activity;"
```

## 🔄 Updates & Rollback

### Rolling Update (Docker)

```bash
# Pull latest changes
git pull

# Rebuild images
docker-compose build --no-cache

# Recreate containers (zero-downtime with proper config)
docker-compose up -d --no-deps --build backend frontend
```

### Rollback

```bash
# Stop services
docker-compose stop

# Checkout previous version
git checkout <previous-commit>

# Restart
docker-compose up -d
```

## 🗑️ Cleanup

### Remove Docker Resources

```bash
# Remove containers
docker-compose down

# Remove volumes (DATA LOSS)
docker-compose down -v

# Remove images
docker-compose down --rmi all
```

### Cleanup Old Images

```bash
docker image prune -a --force
docker volume prune -f
```

## 🆘 Troubleshooting

### Database Connection Failed

```bash
# Check PostgreSQL logs
docker-compose logs db

# Verify credentials
docker-compose exec db psql -U medical_user -c "\l"

# Reset database
docker-compose down -v
docker-compose up -d db
```

### Backend Service Crashes

```bash
# Check logs
docker-compose logs backend

# Verify migrations ran
docker-compose exec backend python -c "from app.database import init_db; init_db()"

# Check environment variables
docker-compose exec backend env | grep DATABASE_URL
```

### Frontend Not Loading

```bash
# Check frontend logs
docker-compose logs frontend

# Verify API URL
docker-compose exec frontend cat .env.local | grep API_URL

# Test API connectivity
curl http://localhost:8000/api/v1/health/
```

## ✅ Deployment Checklist

- [ ] Environment variables configured
- [ ] Database initialized
- [ ] SSL certificates generated/configured
- [ ] Backend health check passing
- [ ] Frontend loads and connects to API
- [ ] Sample verification test passes
- [ ] Logs monitored for errors
- [ ] Database backups configured
- [ ] Monitoring/alerting setup
- [ ] Documentation updated

---

**Deployment Guide v1.0**
*Last Updated: March 30, 2026*
