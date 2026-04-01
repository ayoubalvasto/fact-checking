import logging,asyncio,time
from typing import Dict, Optional, List

logger = logging.getLogger(__name__)

class DummyClaimExtractor:
    def extract(self, text, lang):
        return {"claim": text, "claim_type": "general", "entities": []}

class DummyTranslator:
    def translate(self, text, scripts=None):
        return {"latin": text, "arabic": text}

class DummyRAGVerifier:
    def verify(self, claim, claim_type="general", language="ar"):
        return {"label": "true", "confidence": 0.8, "explanation": "Verified", "domain": "general_medicine"}

class VerificationService:
    def __init__(self):
        try:
            self.claim_extractor = DummyClaimExtractor()
            self.darija_translator = DummyTranslator()
            self.rag_verifier = DummyRAGVerifier()
            logger.info("? VerificationService initialized")
        except Exception as e:
            logger.error(f"? Init failed: {e}", exc_info=True)
            raise
    
    async def verify_claim(self, text: str, language: str, db, user_id: Optional[str] = None) -> Dict:
        start_time = time.time()
        if not text or len(text) < 10 or len(text) > 5000:
            raise ValueError("Text must be 10-5000 characters")
        
        claim_data = self.claim_extractor.extract(text, language)
        darija_data = self.darija_translator.translate(claim_data["claim"])
        verification = self.rag_verifier.verify(claim_data["claim"])
        
        return {
            "original_text": text,
            "claim": claim_data["claim"],
            "verification_label": verification["label"],
            "confidence_score": verification["confidence"],
            "darija_latin": darija_data["latin"],
            "darija_arabic": darija_data["arabic"],
            "processing_time_ms": round((time.time() - start_time) * 1000, 2)
        }

verification_service = VerificationService()
