# Quick Start Guide

Get the Medical Fact-Check Platform running in 5 minutes.

## 🚀 30-Second Start (Docker)

```bash
# Clone and navigate
git clone <repo> && cd medical-factcheck

# Copy env file
cp .env.development .env

# Generate SSL certs
bash devops/generate-certs.sh

# Start all services
docker-compose up -d

# Done! Open browser
echo "Visit http://localhost:3000"
```

## 🧪 Test It Works

```bash
# Test backend
curl http://localhost:8000/api/v1/health/ | jq .

# Test claim verification
curl -X POST http://localhost:8000/api/v1/verify/ \
  -H "Content-Type: application/json" \
  -d '{"text":"الحمى تعالج بالماء البارد فقط","language":"ar"}' | jq .

# Open frontend
open http://localhost:3000
```

## 🛑 Stop Services

```bash
docker-compose stop
```

## 🔄 Restart Services

```bash
docker-compose start
```

## 🗑️ Complete Cleanup

```bash
docker-compose down -v
```

## 📍 Access Points

| Service | URL | Purpose |
|---------|-----|---------|
| Frontend | http://localhost:3000 | UI |
| Backend | http://localhost:8000 | API |
| API Docs | http://localhost:8000/api/docs | Swagger |
| Database | localhost:5432 | PostgreSQL |
| Cache | localhost:6379 | Redis |

## 🔧 Configuration

Edit `.env` for:
- Database credentials
- API URLs
- Environment (dev/prod)

## 📝 Next Steps

1. Review [ARCHITECTURE.md](./ARCHITECTURE.md) for system design
2. Read [DEPLOYMENT.md](./DEPLOYMENT.md) for production setup
3. Check [README.md](./README.md) for detailed docs
4. View API docs at http://localhost:8000/api/docs

## ❓ Common Issues

### Port Already in Use
```bash
# Change port in .env
BACKEND_PORT=8001
FRONTEND_PORT=3001

# Or kill existing process
lsof -ti:3000 | xargs kill -9
```

### Database Won't Connect
```bash
# Recreate database
docker-compose down -v
docker-compose up -d
```

### Logs Full of Errors
```bash
# Check specific service
docker-compose logs backend
docker-compose logs frontend
docker-compose logs db
```

## ✅ You're Done!

The platform is now running. Visit http://localhost:3000 to start verifying medical claims.

---

**Need Help?** Check README.md or DEPLOYMENT.md
