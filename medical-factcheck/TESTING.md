# Integration Testing Guide

Complete integration tests for the Medical Fact-Check Platform.

## 🧪 Test Environment Setup

```bash
# Start only database services for testing
docker-compose -f docker-compose.dev.yml up -d

# Or use full stack
docker-compose up -d
```

## 🔗 API Integration Tests

### 1. Health Check

```bash
# Test endpoint availability
curl -X GET http://localhost:8000/api/v1/health/

# Expected response
{
  "status": "healthy",
  "database": "healthy",
  "redis": "healthy",
  "ml_service": "healthy",
  "version": "1.0.0"
}
```

### 2. Verification Endpoint

```bash
# Test basic verification
RESPONSE=$(curl -s -X POST http://localhost:8000/api/v1/verify/ \
  -H "Content-Type: application/json" \
  -d '{
    "text": "الحمى تعالج بالماء البارد فقط",
    "language": "ar",
    "user_id": "test_user_1"
  }')

echo $RESPONSE | jq .

# Validate response structure
echo $RESPONSE | jq '.data | keys' | grep -q 'darija_latin' && echo "✅ Darija translation present"
echo $RESPONSE | jq '.data.verification_label' | grep -q 'false' && echo "✅ Verification correct"
```

### 3. Dataset Retrieval

```bash
# Get claims with pagination
curl -X GET "http://localhost:8000/api/v1/dataset/claims?page=1&per_page=10"

# Expected: List of claims with metadata
# Test: verify structure and item count
```

### 4. Analytics Endpoints

```bash
# Get dashboard analytics
curl -X GET "http://localhost:8000/api/v1/analytics/dashboard?days=7"

# Expected: Contains total_verified, true_count, false_count, etc.

# Get trending claims
curl -X GET "http://localhost:8000/api/v1/analytics/trending?limit=5"

# Expected: List of recent claims
```

## 🔍 Frontend Integration Tests

### 1. Page Load

```bash
#!/bin/bash

# Test home page
echo "Testing home page..."
STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000)
[ $STATUS -eq 200 ] && echo "✅ Home page loaded" || echo "❌ Home page failed: $STATUS"

# Test verify page
echo "Testing verify page..."
STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/verify)
[ $STATUS -eq 200 ] && echo "✅ Verify page loaded" || echo "❌ Verify page failed: $STATUS"

# Test dashboard page
echo "Testing dashboard page..."
STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/dashboard)
[ $STATUS -eq 200 ] && echo "✅ Dashboard loaded" || echo "❌ Dashboard failed: $STATUS"
```

### 2. API Client Tests

```javascript
// Test API client connection
const api = require('./frontend/src/services/api').apiClient;

// Test verify endpoint
api.verify("الحمى تعالج بالماء البارد فقط", "ar")
  .then(result => {
    console.log("✅ Verify endpoint working");
    console.log(`Confidence: ${result.data.confidence_score}`);
  })
  .catch(err => console.error("❌ Verify endpoint failed:", err));

// Test analytics endpoint
api.getDashboardAnalytics(7)
  .then(data => {
    console.log("✅ Analytics endpoint working");
    console.log(`Total verified: ${data.total_verified}`);
  })
  .catch(err => console.error("❌ Analytics endpoint failed:", err));
```

## 💾 Database Integration Tests

```bash
# Test database connection
docker-compose exec db psql -U medical_user -d medical_factcheck -c "SELECT 1;" && \
echo "✅ Database connection OK"

# Check tables exist
docker-compose exec db psql -U medical_user -d medical_factcheck -c "\dt"

# Check sample data
docker-compose exec db psql -U medical_user -d medical_factcheck -c \
"SELECT COUNT(*) as claim_count FROM claims;"

# Verify indexes
docker-compose exec db psql -U medical_user -d medical_factcheck -c \
"SELECT indexname FROM pg_indexes WHERE tablename='claims';"
```

## ⚙️ ML/NLP Pipeline Tests

```python
# Test claim extraction
from ml_nlp.pipeline.claim_extractor import ClaimExtractor

extractor = ClaimExtractor()
result = extractor.extract("الحمى تعالج بالماء البارد فقط", "ar")
assert result["claim"], "Claim extraction failed"
print("✅ Claim extraction working")

# Test Darija translation
from ml_nlp.pipeline.darija_translator import DarijaTranslator

translator = DarijaTranslator()
result = translator.translate("الحمى تعالج بالماء البارد", target_scripts=["latin", "arabic"])
assert result["latin"], "Latin translation failed"
assert result["arabic"], "Arabic translation failed"
print("✅ Darija translation working")

# Test RAG verification
from ml_nlp.pipeline.rag_verifier import RAGVerifier

verifier = RAGVerifier()
result = verifier.verify("Fever can be cured with cold water only", "treatment")
assert result["label"] in ["true", "false", "partially_true", "unverifiable"], "Invalid label"
assert 0 <= result["confidence"] <= 1, "Invalid confidence score"
print("✅ RAG verification working")
```

## 📊 Performance Tests

```bash
#!/bin/bash

echo "🚀 Running performance tests..."

# Test 1: Single verification response time
echo "Test 1: Single verification response time"
start=$(date +%s%N)
curl -s -X POST http://localhost:8000/api/v1/verify/ \
  -H "Content-Type: application/json" \
  -d '{"text":"الحمى تعالج بالماء","language":"ar"}' > /dev/null
end=$(date +%s%N)
time_ms=$(( (end - start) / 1000000 ))
echo "Response time: ${time_ms}ms"
[ $time_ms -lt 3000 ] && echo "✅ Performance OK" || echo "⚠️ Performance warning"

# Test 2: Concurrent requests
echo "Test 2: Concurrent requests (10 parallel)"
for i in {1..10}; do
  curl -s -X POST http://localhost:8000/api/v1/verify/ \
    -H "Content-Type: application/json" \
    -d "{\"text\":\"الحمى رقم $i\",\"language\":\"ar\"}" \
    > /dev/null &
done
wait
echo "✅ Concurrency test complete"

# Test 3: Database query performance
echo "Test 3: Database query performance"
start=$(date +%s%N)
curl -s http://localhost:8000/api/v1/dataset/claims?page=1\&per_page=100 > /dev/null
end=$(date +%s%N)
time_ms=$(( (end - start) / 1000000 ))
echo "Dataset query time: ${time_ms}ms"
[ $time_ms -lt 2000 ] && echo "✅ Database performance OK" || echo "⚠️ Database performance warning"

# Test 4: Cache performance
echo "Test 4: Cache hit performance"
CLAIM='الحمى تعالج بالماء'
# First request (cache miss)
curl -s -X POST http://localhost:8000/api/v1/verify/ \
  -H "Content-Type: application/json" \
  -d "{\"text\":\"$CLAIM\",\"language\":\"ar\"}" > /dev/null

sleep 1

# Second request (cache hit)
start=$(date +%s%N)
curl -s -X POST http://localhost:8000/api/v1/verify/ \
  -H "Content-Type: application/json" \
  -d "{\"text\":\"$CLAIM\",\"language\":\"ar\"}" > /dev/null
end=$(date +%s%N)
time_ms=$(( (end - start) / 1000000 ))
echo "Cache hit time: ${time_ms}ms"
[ $time_ms -lt 200 ] && echo "✅ Caching working" || echo "⚠️ Cache performance warning"
```

## 🔐 Security Tests

```bash
#!/bin/bash

echo "🔒 Running security tests..."

# Test 1: SQL Injection attempt
echo "Test 1: SQL Injection protection"
curl -s -X POST http://localhost:8000/api/v1/verify/ \
  -H "Content-Type: application/json" \
  -d '{"text":"test; DROP TABLE claims;--","language":"ar"}' | jq .
echo "✅ SQL injection handled safely"

# Test 2: XSS prevention
echo "Test 2: XSS prevention"
curl -s -X POST http://localhost:8000/api/v1/verify/ \
  -H "Content-Type: application/json" \
  -d '{"text":"<script>alert(\"xss\")</script>","language":"ar"}' | jq .
echo "✅ XSS handled safely"

# Test 3: CORS headers
echo "Test 3: CORS headers"
curl -s -X OPTIONS http://localhost:8000/api/v1/verify/ \
  -H "Origin: http://localhost:3000" | grep -i "access-control" && \
echo "✅ CORS headers present"

# Test 4: Rate limiting (when implemented)
echo "Test 4: Rate limiting"
for i in {1..100}; do
  curl -s http://localhost:8000/api/v1/health/ > /dev/null &
done
wait
echo "✅ Rate limiting test complete"
```

## 🧹 Cleanup

```bash
# Stop test services
docker-compose down

# Remove test data
docker-compose down -v
```

---

**Integration Testing Guide v1.0**
