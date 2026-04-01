# Medical Fact-Check Platform

A production-ready AI-powered medical claim verification system with support for Arabic, Moroccan Darija, and multiple languages. Built with FastAPI, React, PostgreSQL, and modern ML/NLP techniques.

## 🚀 Quick Start

### Prerequisites
- Python 3.11+
- Node.js 18+
- Docker & Docker Compose
- PostgreSQL 16 (if running locally)
- Redis (if running locally)

### Local Development (Docker)

```bash
# Clone repository
git clone <repo>
cd medical-factcheck

# Setup environment
cp .env.development .env.local

# Generate SSL certificates
bash devops/generate-certs.sh

# Start all services
docker-compose up -d

# Verify services
docker-compose ps
```

**Access:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/api/docs
- Redis: localhost:6379
- PostgreSQL: localhost:5432

### Local Development (Native)

```bash
# Backend setup
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Start backend
python -m uvicorn main:app --reload

# In another terminal - Frontend setup
cd frontend
npm install
npm run dev
```

## 🏗️ Architecture

### System Design

```
┌─────────────┐       ┌──────────────┐       ┌─────────┐
│   Frontend  │───────│   Backend    │───────│ Cache   │
│  (React)    │       │  (FastAPI)   │       │(Redis)  │
└─────────────┘       └──────────────┘       └─────────┘
                             │
                    ┌────────┼────────┐
                    │        │        │
              ┌──────────┐ ┌───────┐ ┌──────────┐
              │ Database │ │ ML/NLP│ │ Message  │
              │(PostgreSQL)│Pipeline│ │ Queue    │
              └──────────┘ └───────┘ └──────────┘
```

### Component Responsibilities

**Backend Agent (FastAPI)**
- RESTful API endpoints
- Database orchestration
- Request/response handling
- Async job processing
- Caching layer management

**ML/NLP Agent**
- Claim extraction
- Medical entity recognition
- Darija translation (Latin & Arabic)
- LLM-based verification (RAG)
- Video transcription
- Confidence scoring

**Frontend Agent (React)**
- Claim verification interface
- Video upload UI
- Results display
- Analytics dashboard
- Real-time metrics

**DevOps Agent**
- Docker containerization
- Service orchestration
- Database initialization
- Deployment automation
- Cloud provider integration

## 📊 Data Pipeline

```
Input (Text/Video)
    ↓
Text Extraction (Audio → Text via Whisper)
    ↓
Claim Extraction (NER + Classification)
    ↓
Darija Translation (Arabic & Latin scripts)
    ↓
LLM Verification (RAG + Confidence Scoring)
    ↓
Database Storage + Cache
    ↓
Analytics Aggregation
    ↓
Dashboard Display
```

## 🔌 API Endpoints

### Verification
- `POST /api/v1/verify/` - Verify medical claim
- `GET /api/v1/verify/cached/{hash}` - Get cached result

### Dataset
- `GET /api/v1/dataset/claims` - Retrieve claims with filters
- `GET /api/v1/dataset/stats/domains` - Domain distribution

### Analytics
- `GET /api/v1/analytics/dashboard` - Dashboard metrics
- `GET /api/v1/analytics/trending` - Trending claims
- `GET /api/v1/analytics/confidence-distribution` - Score distribution

### Health
- `GET /api/v1/health/` - System health
- `GET /api/v1/health/ready` - Readiness probe

## 📝 Request/Response Schema

### Verification Request
```json
{
  "text": "الحمى تعالج بالماء البارد فقط",
  "language": "ar",
  "user_id": "user123"
}
```

### Verification Response
```json
{
  "success": true,
  "data": {
    "original_text": "الحمى تعالج بالماء البارد فقط",
    "darija_latin": "smia ttal7 b wayl brrd fqq",
    "darija_arabic": "سميا تتالح بوايل برد فقق",
    "claim": "Fever can only be treated with cold water",
    "claim_type": "treatment",
    "verification_label": "false",
    "explanation": "This claim is contradicted by medical evidence...",
    "confidence_score": 0.92,
    "medical_domain": "general_medicine"
  },
  "claim_id": 42,
  "processing_time_ms": 1250.5
}
```

## 🗄️ Database Schema

### Claims Table
- `id` - Primary key
- `original_text` - Input claim
- `darija_latin/arabic` - Translations
- `claim` - Extracted claim
- `claim_type` - Classification
- `verification_label` - true/false/partially_true/unverifiable
- `confidence_score` - 0.0-1.0
- `medical_domain` - cardiology/oncology/etc
- `created_at` - Timestamp
- Content fields for metadata

### Verification Logs
- Tracks all verification attempts
- Performance metrics
- Error tracking
- Analytics source

### Statistics
- Daily aggregated stats
- Domain distribution
- Confidence metrics

## 🚢 Deployment

### Docker Compose (Recommended for dev/staging)
```bash
docker-compose up -d
```

### AWS ECS
```bash
bash devops/deploy.sh aws
```

### Railway
```bash
bash devops/deploy.sh railway
```

### Vercel (Frontend only)
```bash
bash devops/deploy.sh vercel
```

### Render
```bash
bash devops/deploy.sh render
```

## 🔧 Configuration

### Backend (.env)
```
DATABASE_URL=postgresql://user:pass@host/db
REDIS_URL=redis://host:6379/0
CORS_ORIGINS=http://localhost:3000
ENVIRONMENT=production/development
DEBUG=False
```

### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## 📈 Performance Optimization

### Caching
- Redis for verification results (7-day TTL)
- Daily statistics cached
- Dataset materialized views in DB

### Async Processing
- Video transcription queued
- Batch verification support
- Background analytics aggregation

### Database
- Indexes on frequently accessed columns
- Materialized views for analytics
- Connection pooling

## 🔍 Monitoring

Health check endpoints:
```bash
curl http://localhost:8000/api/v1/health/
```

Docker health status:
```bash
docker-compose ps
```

## 🧪 Testing

Backend:
```bash
cd backend
pytest tests/ -v
```

Frontend:
```bash
cd frontend
npm run test
```

## 📚 Documentation

- API Docs: http://localhost:8000/api/docs
- Swagger UI: http://localhost:8000/api/redoc
- Repository docs: See ARCHITECTURE.md

## 🛠️ Development

### Code Style
- Backend: Black + Flake8
- Frontend: Prettier + ESLint

### Logging
- Structured JSON logging
- Request/response tracking
- Error aggregation

## 🔐 Security

- HTTPS/TLS encryption
- CORS protection
- Input validation
- SQL injection prevention (SQLAlchemy ORM)
- Rate limiting (to implement)
- Authentication (JWT ready)

## 📊 Dataset Statistics

- 100,000+ sample medical claims
- 10+ medical domains
- Multi-label classification
- Confidence-weighted scoring
- Expandable to 1M+ records

## 🌍 Multilingual Support

- Arabic (Modern Standard Arabic)
- Moroccan Darija:
  - Latin script (Morocco standard)
  - Arabic script (Unicode)
- English
- French (basic)
- Extensible to other languages

## 🐛 Troubleshooting

### Database Connection Issues
```bash
# Check PostgreSQL
docker-compose logs db

# Reset database
docker-compose down -v
docker-compose up -d
```

### API Connection Issues
```bash
# Check backend logs
docker-compose logs backend

# Test API
curl -X GET http://localhost:8000/api/v1/health/
```

### Frontend Not Loading
```bash
# Check frontend logs
docker-compose logs frontend

# Check environment variables
cat frontend/.env.local
```

## 📞 Support

For issues, create GitHub issues or contact the development team.

## 📄 License

MIT License - See LICENSE file

## 👥 Contributors

Medical Fact-Check Platform Team

---

**Built with ❤️ for accurate medical information**
