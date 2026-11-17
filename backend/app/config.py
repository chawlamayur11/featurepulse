import os
from pydantic import BaseModel

class Settings(BaseModel):
    PROJECT_NAME: str = "FeaturePulse"
    VERSION: str = "1.0.0"
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./featurepulse.db")
    
    # Rate limiting & Emergency circuit breakers (managed by On-Call Agent)
    EMERGENCY_RATE_LIMIT_ENABLED: bool = False
    MAX_VOTES_PER_MINUTE_PER_USER: int = 60
    
    # Quarantined / shadow-banned client IDs
    QUARANTINED_USERS: set[str] = set()

settings = Settings()
