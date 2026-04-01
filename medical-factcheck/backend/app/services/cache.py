import logging,json,hashlib
from typing import Dict, Optional

logger = logging.getLogger(__name__)

class CacheService:
    def __init__(self):
        self.memory_cache = {}
        self.redis_available = False
        try:
            import redis
            self.client = redis.Redis(host="localhost", port=6379, decode_responses=True)
            self.client.ping()
            self.redis_available = True
            logger.info("? Redis OK")
        except:
            self.client = None
            logger.warning("?? Using memory cache")
    
    def set(self, key: str, value: Dict) -> bool:
        self.memory_cache[key] = value
        return True
    
    def get(self, key: str) -> Optional[Dict]:
        return self.memory_cache.get(key)
    
    def cache_verification_result(self, text: str, result: Dict) -> bool:
        key = hashlib.sha256(text.encode()).hexdigest()
        self.memory_cache[key] = result
        return True
    
    def get_cached_verification(self, text: str) -> Optional[Dict]:
        key = hashlib.sha256(text.encode()).hexdigest()
        return self.memory_cache.get(key)
    
    def is_healthy(self) -> bool:
        return True
    
    def get_stats(self) -> Dict:
        return {"status": "healthy", "cache_size": len(self.memory_cache), "redis": self.redis_available}

cache_service = CacheService()
