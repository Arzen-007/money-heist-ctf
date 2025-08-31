import redis
import json
from typing import Any, Optional
from ..core.config import settings

class RedisClient:
    def __init__(self):
        self.client = redis.Redis(
            host=settings.REDIS_HOST,
            port=settings.REDIS_PORT,
            db=settings.REDIS_DB,
            decode_responses=True
        )

    def get(self, key: str) -> Optional[str]:
        return self.client.get(key)

    def set(self, key: str, value: Any, expire: Optional[int] = None) -> bool:
        if isinstance(value, (dict, list)):
            value = json.dumps(value)
        return self.client.set(key, value, ex=expire)

    def delete(self, key: str) -> int:
        return self.client.delete(key)

    def exists(self, key: str) -> bool:
        return self.client.exists(key)

    def incr(self, key: str) -> int:
        return self.client.incr(key)

    def expire(self, key: str, time: int) -> bool:
        return self.client.expire(key, time)

    def publish(self, channel: str, message: Any) -> int:
        if isinstance(message, (dict, list)):
            message = json.dumps(message)
        return self.client.publish(channel, message)

    def subscribe(self, channel: str):
        pubsub = self.client.pubsub()
        pubsub.subscribe(channel)
        return pubsub

    # Cache decorators
    def cache_get(self, key: str):
        """Get cached value and parse JSON if needed"""
        value = self.get(key)
        if value:
            try:
                return json.loads(value)
            except json.JSONDecodeError:
                return value
        return None

    def cache_set(self, key: str, value: Any, expire: Optional[int] = None):
        """Set cache value with JSON serialization"""
        return self.set(key, value, expire)

# Global Redis instance
redis_client = RedisClient()

# Rate limiting
class RateLimiter:
    def __init__(self, redis_client: RedisClient):
        self.redis = redis_client

    def is_allowed(self, key: str, limit: int, window: int) -> bool:
        """Check if request is within rate limit"""
        current = self.redis.incr(key)
        if current == 1:
            self.redis.expire(key, window)
        return current <= limit

    def get_remaining(self, key: str, limit: int) -> int:
        """Get remaining requests in current window"""
        current = int(self.redis.get(key) or 0)
        return max(0, limit - current)

# Session management
class SessionManager:
    def __init__(self, redis_client: RedisClient):
        self.redis = redis_client
        self.session_prefix = "session:"

    def create_session(self, user_id: int, data: dict, expire: int = 3600) -> str:
        """Create a new session"""
        import uuid
        session_id = str(uuid.uuid4())
        key = f"{self.session_prefix}{session_id}"
        session_data = {"user_id": user_id, **data}
        self.redis.cache_set(key, session_data, expire)
        return session_id

    def get_session(self, session_id: str) -> Optional[dict]:
        """Get session data"""
        key = f"{self.session_prefix}{session_id}"
        return self.redis.cache_get(key)

    def update_session(self, session_id: str, data: dict, expire: Optional[int] = None):
        """Update session data"""
        key = f"{self.session_prefix}{session_id}"
        current = self.redis.cache_get(key)
        if current:
            current.update(data)
            self.redis.cache_set(key, current, expire)

    def delete_session(self, session_id: str):
        """Delete session"""
        key = f"{self.session_prefix}{session_id}"
        self.redis.delete(key)

# Initialize components
rate_limiter = RateLimiter(redis_client)
session_manager = SessionManager(redis_client)
