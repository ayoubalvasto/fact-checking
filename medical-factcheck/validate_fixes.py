#!/usr/bin/env python3
"""
System Validation Script
Verifies all production fixes are working correctly
"""
import asyncio
import logging
import sys

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

async def test_cache_service():
    """Test cache service with health checks"""
    try:
        sys.path.insert(0, 'backend')
        from app.services.cache import cache_service
        
        logger.info("🧪 Testing Cache Service...")
        
        # Test health check
        is_healthy = cache_service.is_healthy()
        assert is_healthy, "Cache is not healthy"
        logger.info("✅ Cache health check passed")
        
        # Test basic operations
        cache_service.set("test_key", {"data": "test"})
        result = cache_service.get("test_key")
        assert result == {"data": "test"}, "Cache set/get failed"
        logger.info("✅ Cache set/get operations passed")
        
        # Test stats
        stats = cache_service.get_stats()
        assert stats["status"] == "healthy", "Cache stats show unhealthy"
        logger.info(f"✅ Cache stats: {stats}")
        
        return True
    except Exception as e:
        logger.error(f"❌ Cache test failed: {e}")
        return False

async def test_verification_service():
    """Test verification service with error handling"""
    try:
        sys.path.insert(0, 'backend')
        sys.path.insert(0, 'ml_nlp')
        from app.services.verification import verification_service
        
        logger.info("🧪 Testing Verification Service...")
        
        # Test initialization
        assert verification_service.claim_extractor is not None
        assert verification_service.darija_translator is not None
        assert verification_service.rag_verifier is not None
        logger.info("✅ All components initialized")
        
        # Test with mock DB
        from unittest.mock import MagicMock
        mock_db = MagicMock()
        
        # Test invalid input
        try:
            await verification_service.verify_claim("short", "ar", mock_db)
            assert False, "Should fail on short text"
        except ValueError as e:
            logger.info(f"✅ Correctly rejected short text: {e}")
        
        return True
    except Exception as e:
        logger.error(f"❌ Verification test failed: {e}")
        return False

async def test_rag_verifier():
    """Test RAG verifier with knowledge base"""
    try:
        sys.path.insert(0, 'ml_nlp')
        from pipeline.rag_verifier import RAGVerifier
        
        logger.info("🧪 Testing RAG Verifier...")
        
        verifier = RAGVerifier()
        
        # Test verification with various claims
        test_claims = [
            ("Fever treatment includes rest and fluids", "symptom_treatment"),
            ("Fever should only be treated by staying cold", "general_health"),
            ("Vaccines prevent disease", "vaccine"),
        ]
        
        for claim, claim_type in test_claims:
            result = verifier.verify(claim, claim_type)
            assert "label" in result
            assert "explanation" in result
            assert "confidence" in result
            assert 0 <= result["confidence"] <= 1
            logger.info(f"✅ Verified '{claim}' → {result['label']} (confidence: {result['confidence']})")
        
        return True
    except Exception as e:
        logger.error(f"❌ RAG Verifier test failed: {e}")
        return False

async def test_claim_extractor():
    """Test claim extractor with fallback"""
    try:
        sys.path.insert(0, 'ml_nlp')
        from pipeline.claim_extractor_v2 import ClaimExtractor
        
        logger.info("🧪 Testing Claim Extractor...")
        
        extractor = ClaimExtractor()
        
        # Test extraction
        text = "الحمى تعالج بالراحة والسوائل والعقاقير الخافضة للحرارة"
        result = extractor.extract(text, "ar")
        
        assert "claim" in result
        assert "claim_type" in result
        assert "entities" in result
        assert "method" in result  # Should be "fallback" or "transformer"
        logger.info(f"✅ Extracted claim: {result['claim']}")
        logger.info(f"✅ Method used: {result['method']}")
        
        return True
    except Exception as e:
        logger.error(f"❌ Claim Extractor test failed: {e}")
        return False

async def test_darija_translator():
    """Test Darija translator"""
    try:
        sys.path.insert(0, 'ml_nlp')
        from pipeline.darija_translator import DarijaTranslator
        
        logger.info("🧪 Testing Darija Translator...")
        
        translator = DarijaTranslator()
        
        # Test translation
        text = "الحمى"
        result = translator.translate(text, ["latin", "arabic"])
        
        assert "latin" in result
        assert "arabic" in result
        assert len(result["latin"]) > 0
        logger.info(f"✅ Translated '{text}':")
        logger.info(f"   Latin: {result['latin']}")
        logger.info(f"   Arabic: {result['arabic']}")
        
        return True
    except Exception as e:
        logger.error(f"❌ Darija Translator test failed: {e}")
        return False

async def test_dataset_generator():
    """Test dataset generator with real translations"""
    try:
        sys.path.insert(0, 'ml_nlp')
        from services.dataset_generator import DatasetGenerator
        
        logger.info("🧪 Testing Dataset Generator...")
        
        generator = DatasetGenerator()
        
        # Generate small dataset
        dataset = generator.generate_sample_dataset(5)
        
        assert len(dataset) == 5
        assert "darija_latin" in dataset[0]
        assert "darija_arabic" in dataset[0]
        assert len(dataset[0]["darija_latin"]) > 0, "Darija Latin should not be empty"
        logger.info(f"✅ Generated {len(dataset)} sample claims with Darija")
        
        # Check statistics
        stats = generator.get_statistics()
        assert stats["total_records"] == 5
        logger.info(f"✅ Statistics: {stats['total_records']} records")
        
        return True
    except Exception as e:
        logger.error(f"❌ Dataset Generator test failed: {e}")
        return False

async def test_api_error_handling():
    """Test API error handling"""
    try:
        sys.path.insert(0, 'backend')
        from app.schemas import VerifyRequest
        from pydantic import ValidationError
        
        logger.info("🧪 Testing API Error Handling...")
        
        # Test valid request
        valid_req = VerifyRequest(text="This is a valid medical claim about fever")
        assert valid_req.text == "This is a valid medical claim about fever"
        logger.info("✅ Valid request accepted")
        
        # Test invalid request (too short)
        try:
            invalid_req = VerifyRequest(text="short")
            assert False, "Should reject short text"
        except ValidationError as e:
            logger.info(f"✅ Correctly rejected short text: {len(e.errors())} error(s)")
        
        # Test invalid request (too long)
        long_text = "a" * 10000
        try:
            invalid_req = VerifyRequest(text=long_text)
            assert False, "Should reject long text"
        except ValidationError:
            logger.info("✅ Correctly rejected overly long text")
        
        return True
    except Exception as e:
        logger.error(f"❌ API Error Handling test failed: {e}")
        return False

async def main():
    """Run all tests"""
    logger.info("=" * 60)
    logger.info("🧪 PRODUCTION FIX VALIDATION")
    logger.info("=" * 60)
    
    tests = [
        ("Cache Service", test_cache_service),
        ("Verification Service", test_verification_service),
        ("RAG Verifier", test_rag_verifier),
        ("Claim Extractor", test_claim_extractor),
        ("Darija Translator", test_darija_translator),
        ("Dataset Generator", test_dataset_generator),
        ("API Error Handling", test_api_error_handling),
    ]
    
    results = {}
    for test_name, test_func in tests:
        try:
            result = await test_func()
            results[test_name] = result
        except Exception as e:
            logger.error(f"Unexpected error in {test_name}: {e}")
            results[test_name] = False
    
    # Summary
    logger.info("=" * 60)
    logger.info("📊 TEST SUMMARY")
    logger.info("=" * 60)
    
    passed = sum(1 for v in results.values() if v)
    total = len(results)
    
    for test_name, passed_flag in results.items():
        status = "✅ PASS" if passed_flag else "❌ FAIL"
        logger.info(f"{status}: {test_name}")
    
    logger.info("=" * 60)
    logger.info(f"Results: {passed}/{total} tests passed")
    
    if passed == total:
        logger.info("✅ ALL TESTS PASSED - System is Production Ready!")
        return 0
    else:
        logger.error(f"❌ {total - passed} test(s) failed")
        return 1

if __name__ == "__main__":
    exit_code = asyncio.run(main())
    sys.exit(exit_code)
