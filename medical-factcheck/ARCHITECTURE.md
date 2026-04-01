# Architecture Documentation

## System Overview

The Medical Fact-Check Platform is a multi-tier, microservices-based system designed for scalability, reliability, and production-grade performance.

## Technology Stack

### Backend
- **Framework**: FastAPI 0.104.1
- **ASGI Server**: Uvicorn with Gunicorn
- **ORM**: SQLAlchemy 2.0
- **Database**: PostgreSQL 16
- **Cache**: Redis 7
- **Async**: Python asyncio

### ML/NLP
- **Transformers**: Hugging Face Transformers 4.35.0
- **Base Models**: 
  - Zero-shot classification: facebook/bart-large-mnli
  - NER: dslim/bert-base-multilingual-cased-ner
- **Audio Processing**: OpenAI Whisper
- **Misc**: librosa, scikit-learn, pandas

### Frontend
- **Framework**: Next.js 14 with React 18
- **Language**: TypeScript 5.3
- **Styling**: Tailwind CSS 3.3
- **Visualization**: Recharts 2.10
- **HTTP Client**: Axios 1.6

### DevOps
- **Containerization**: Docker
- **Orchestration**: Docker Compose
- **Web Server**: Nginx Alpine
- **CI/CD**: GitHub Actions

## Directory Structure

```
medical-factcheck/
├── backend/                    # FastAPI application
│   ├── app/
│   │   ├── __init__.py
│   │   ├── database.py        # SQLAlchemy setup
│   │   ├── models/
│   │   │   └── claim.py       # Database models
│   │   ├── schemas.py         # Pydantic schemas
│   │   ├── routes/            # API endpoints
│   │   │   ├── verify.py
│   │   │   ├── dataset.py
│   │   │   ├── analytics.py
│   │   │   └── health.py
│   │   └── services/          # Business logic
│   │       ├── cache.py       # Redis operations
│   │       └── verification.py
│   ├── main.py               # FastAPI app entry
│   └── requirements.txt
│
├── ml_nlp/                    # ML/NLP pipeline
│   ├── pipeline/
│   │   ├── claim_extractor.py
│   │   ├── darija_translator.py
│   │   └── rag_verifier.py
│   └── services/
│       ├── video_transcriber.py
│       └── dataset_generator.py
│
├── frontend/                  # Next.js application
│   ├── src/
│   │   ├── app/
│   │   │   └── page.tsx      # Home page
│   │   ├── pages/
│   │   │   ├── verify.tsx    # Verification page
│   │   │   └── dashboard.tsx  # Analytics
│   │   ├── components/        # React components
│   │   │   ├── VerificationCard.tsx
│   │   │   └── AnalyticsDashboard.tsx
│   │   └── services/
│   │       └── api.ts         # API client
│   ├── package.json
│   └── tsconfig.json
│
├── devops/                    # Deployment config
│   ├── Dockerfile.backend
│   ├── Dockerfile.frontend
│   ├── nginx.conf
│   ├── init-db.sql
│   ├── deploy.sh
│   └── generate-certs.sh
│
├── .github/
│   └── workflows/
│       └── ci-cd.yml
│
├── docker-compose.yml         # Orchestration
├── docker-compose.dev.yml     # Dev services only
├── .env.production
├── .env.development
└── README.md
```

## Data Models

### ClaimRecord (PostgreSQL)
```python
{
  id: int (pk),
  original_text: str (indexed),
  original_language: str,
  darija_latin: str,
  darija_arabic: str,
  claim: str (indexed),
  claim_type: str (indexed),
  verification_label: str (indexed),  # true/false/partial/unverifiable
  explanation: str,
  confidence_score: float (indexed),
  source_url: str,
  medical_domain: str (indexed),
  created_at: datetime (indexed),
  updated_at: datetime,
  user_id: str,
  video_file_path: str,
  transcription: str,
  raw_response: json
}
```

### VerificationLog (PostgreSQL)
- Tracks every verification attempt
- Performance metrics
- Error tracking
- Analytics source

### Statistics (PostgreSQL)
- Daily aggregated metrics
- Domain distribution
- Confidence scores
- Pre-computed for dashboard

## API Contract

### Request Path
```
Client → Nginx (443/80) → FastAPI → Services Layer → Database/Cache
```

### Response Flow
```
Database/Cache → Services Layer → FastAPI → Nginx → Client
```

## Processing Pipeline

### Text Verification Flow
```
1. Input Validation
   - Length check (10-5000 chars)
   - Language detection

2. Cache Check
   - Check Redis for duplicate
   - Return cached if exists (TTL: 7 days)

3. Claim Extraction
   - Entity recognition (NER)
   - Claim type classification
   - Main claim identification

4. Darija Translation
   - Convert to Moroccan Darija
   - Generate Latin script (Moroccan transcription)
   - Generate Arabic script (Unicode)

5. LLM Verification
   - Retrieve from knowledge base (RAG)
   - Score against trusted sources
   - Generate explanation
   - Classify medical domain
   - Calculate confidence score

6. Storage
   - Write to PostgreSQL
   - Cache result in Redis
   - Log verification attempt

7. Response
   - Return to client
   - Update analytics
```

### Video Verification Flow
```
1. Video Upload
   - File validation
   - Size check (<500MB)
   - Format check

2. Audio Extraction
   - MoviePy video processing
   - WAV file generation

3. Transcription
   - Whisper model processing
   - Language detection
   - Confidence estimation

4. Claim Extraction
   - Per-segment processing
   - Timestamp tracking

5. Parallel Verification
   - Queue each claim
   - Batch processing

6. Results Aggregation
   - Combine results
   - Generate report
```

## Caching Strategy

### Redis Keys
```
verification:{text_hash}  → {result_json}  (TTL: 7 days)
stats:{date}              → {stats_json}   (TTL: 24 hours)
job:{job_id}              → {status_json}  (TTL: 1 hour)
```

### Cache Invalidation
- Automatic TTL expiration
- Manual invalidation on model updates
- LRU eviction policy

## Database Indexing Strategy

```sql
-- Fast lookups
CREATE INDEX claims_created_at ON claims(created_at DESC);
CREATE INDEX claims_verification_label ON claims(verification_label);
CREATE INDEX claims_medical_domain ON claims(medical_domain);

-- Analytics queries
CREATE INDEX claims_user_id ON claims(user_id);
CREATE INDEX logs_claim_id ON verification_logs(claim_id);

-- Materialized view for dashboard
CREATE MATERIALIZED VIEW claim_stats_mv AS
SELECT verification_label, medical_domain, date, COUNT(*)
FROM claims GROUP BY ...;
```

## Performance Characteristics

### Response Times (Target)
- Cached verification: <100ms
- New verification: 1-3s
- Video transcription: 10-60s (background)
- Dashboard load: <2s

### Throughput
- API: 1000+ req/sec (with Redis)
- Database: 100-500 concurrent connections
- Video processing: 5-10 parallel (configurable)

## Scalability Considerations

### Horizontal Scaling
1. **Multiple Backend Instances**
   - Load balance with Nginx
   - Shared PostgreSQL
   - Shared Redis

2. **Database Scaling**
   - Read replicas for analytics
   - Sharding by medical_domain (future)
   - Hot data vs cold data separation

3. **Cache Distribution**
   - Redis cluster for HA
   - Key partitioning strategy

### Vertical Scaling
- Increase container resources
- Larger GPU for ML models
- Database tuning

## Security Architecture

### Network
- HTTPS/TLS encryption
- CORS policy enforcement
- Rate limiting (TODO)

### Data
- SQL injection prevention (ORM)
- XSS protection (CSP headers)
- CSRF tokens (frontend)

### Authentication
- JWT token scheme (ready)
- User ID tracking
- Audit logging

## Monitoring & Observability

### Health Checks
- `/api/v1/health/` - System health
- `/api/v1/health/ready` - Readiness probe
- Database connectivity
- Redis connectivity
- ML service availability

### Logging
- Structured JSON logs
- Request ID tracking
- Error aggregation
- Performance metrics

### Metrics
- Request latency
- Error rates
- Cache hit ratio
- Database query times
- ML model accuracy

## Deployment Architecture

### Local Development
```
Docker Desktop
└── docker-compose.yml
    ├── PostgreSQL
    ├── Redis
    ├── Backend
    ├── Frontend
    └── Nginx
```

### Cloud Deployment (AWS ECS)
```
AWS ECR (Container Registry)
├── medical-factcheck-backend:latest
└── medical-factcheck-frontend:latest

AWS ECS
├── Backend Service (auto-scaling)
├── Frontend Service
└── RDS PostgreSQL

ElastiCache Redis
AWS ALB (Load Balancer)
CloudFront CDN
```

### Alternative Platforms
- **Railway**: Simple git push deployments
- **Vercel**: Frontend with serverless API
- **Render**: Full-stack in containers
- **DigitalOcean**: App Platform

## Future Enhancements

1. **ML Model Improvements**
   - Custom fine-tuned models
   - Knowledge graph for medical facts
   - Multi-language support

2. **Features**
   - User authentication
   - Claim history
   - Expert annotations
   - Real-time collaboration

3. **Infrastructure**
   - Kubernetes orchestration
   - Service mesh (Istio)
   - Advanced monitoring (Prometheus)
   - Log aggregation (ELK)

4. **Performance**
   - GraphQL API
   - Database query optimization
   - Client-side caching strategies
   - CDN for static assets

---

**Architecture Version**: 1.0
**Last Updated**: March 30, 2026
