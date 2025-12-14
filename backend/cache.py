"""
Redis caching utility for Adaptive-CV
Provides caching for parsed resumes and generated PDFs
"""
import redis
import json
import hashlib
import os
from typing import Optional, Any
from functools import wraps

# Redis Configuration
REDIS_HOST = os.getenv("REDIS_HOST", "localhost")
REDIS_PORT = int(os.getenv("REDIS_PORT", 6379))
REDIS_DB = int(os.getenv("REDIS_DB", 0))
REDIS_PASSWORD = os.getenv("REDIS_PASSWORD", None)

# Cache TTLs (in seconds)
PARSED_RESUME_TTL = 3600 * 24  # 24 hours
GENERATED_PDF_TTL = 3600 * 6   # 6 hours
SESSION_TTL = 3600 * 2         # 2 hours

class RedisCache:
    """Redis cache wrapper with fallback for when Redis is unavailable"""
    
    def __init__(self):
        self._client: Optional[redis.Redis] = None
        self._available = False
        self._connect()
    
    def _connect(self):
        """Attempt to connect to Redis"""
        try:
            self._client = redis.Redis(
                host=REDIS_HOST,
                port=REDIS_PORT,
                db=REDIS_DB,
                password=REDIS_PASSWORD,
                decode_responses=False,  # We'll handle encoding ourselves
                socket_connect_timeout=2,
                socket_timeout=2
            )
            # Test connection
            self._client.ping()
            self._available = True
            print(f"✅ Redis connected at {REDIS_HOST}:{REDIS_PORT}")
        except (redis.ConnectionError, redis.TimeoutError) as e:
            self._available = False
            print(f"⚠️ Redis unavailable ({e}). Running without cache.")
    
    @property
    def is_available(self) -> bool:
        """Check if Redis is available"""
        return self._available
    
    def _generate_key(self, prefix: str, data: bytes) -> str:
        """Generate a cache key from content hash"""
        content_hash = hashlib.sha256(data).hexdigest()[:16]
        return f"adaptive_cv:{prefix}:{content_hash}"
    
    # ========== PARSED RESUME CACHING ==========
    
    def get_parsed_resume(self, file_content: bytes, provider: str, model: str) -> Optional[dict]:
        """Get cached parsed resume data"""
        if not self._available:
            return None
        
        try:
            key = self._generate_key(f"parsed:{provider}:{model}", file_content)
            data = self._client.get(key)
            if data:
                print(f"🎯 Cache HIT for parsed resume")
                return json.loads(data.decode('utf-8'))
        except Exception as e:
            print(f"Cache get error: {e}")
        return None
    
    def set_parsed_resume(self, file_content: bytes, provider: str, model: str, resume_data: dict):
        """Cache parsed resume data"""
        if not self._available:
            return
        
        try:
            key = self._generate_key(f"parsed:{provider}:{model}", file_content)
            self._client.setex(key, PARSED_RESUME_TTL, json.dumps(resume_data).encode('utf-8'))
            print(f"💾 Cached parsed resume (TTL: {PARSED_RESUME_TTL}s)")
        except Exception as e:
            print(f"Cache set error: {e}")
    
    # ========== GENERATED PDF CACHING ==========
    
    def get_generated_pdf(self, resume_json: str) -> Optional[bytes]:
        """Get cached generated PDF"""
        if not self._available:
            return None
        
        try:
            key = self._generate_key("pdf", resume_json.encode('utf-8'))
            data = self._client.get(key)
            if data:
                print(f"🎯 Cache HIT for generated PDF")
                return data
        except Exception as e:
            print(f"Cache get error: {e}")
        return None
    
    def set_generated_pdf(self, resume_json: str, pdf_content: bytes):
        """Cache generated PDF"""
        if not self._available:
            return
        
        try:
            key = self._generate_key("pdf", resume_json.encode('utf-8'))
            self._client.setex(key, GENERATED_PDF_TTL, pdf_content)
            print(f"💾 Cached generated PDF (TTL: {GENERATED_PDF_TTL}s)")
        except Exception as e:
            print(f"Cache set error: {e}")
    
    # ========== SESSION DATA ==========
    
    def get_session(self, session_id: str) -> Optional[dict]:
        """Get session data"""
        if not self._available:
            return None
        
        try:
            key = f"adaptive_cv:session:{session_id}"
            data = self._client.get(key)
            if data:
                return json.loads(data.decode('utf-8'))
        except Exception as e:
            print(f"Session get error: {e}")
        return None
    
    def set_session(self, session_id: str, data: dict):
        """Store session data"""
        if not self._available:
            return
        
        try:
            key = f"adaptive_cv:session:{session_id}"
            self._client.setex(key, SESSION_TTL, json.dumps(data).encode('utf-8'))
        except Exception as e:
            print(f"Session set error: {e}")
    
    # ========== CACHE MANAGEMENT ==========
    
    def clear_all(self):
        """Clear all Adaptive-CV cache entries"""
        if not self._available:
            return
        
        try:
            keys = self._client.keys("adaptive_cv:*")
            if keys:
                self._client.delete(*keys)
                print(f"🗑️ Cleared {len(keys)} cache entries")
        except Exception as e:
            print(f"Cache clear error: {e}")
    
    def get_stats(self) -> dict:
        """Get cache statistics"""
        if not self._available:
            return {"available": False}
        
        try:
            info = self._client.info()
            keys = self._client.keys("adaptive_cv:*")
            return {
                "available": True,
                "connected_clients": info.get("connected_clients", 0),
                "used_memory_human": info.get("used_memory_human", "N/A"),
                "cache_entries": len(keys),
                "uptime_seconds": info.get("uptime_in_seconds", 0)
            }
        except Exception as e:
            return {"available": False, "error": str(e)}


# Global cache instance
cache = RedisCache()


def get_cache() -> RedisCache:
    """Get the global cache instance"""
    return cache
