from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    PROJECT_NAME: str = "EmailCheck Pro"
    VERSION: str = "1.0.0"
    API_V1_PREFIX: str = "/api/v1"
    
    # Database
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/emailcheck_pro"
    SQLITE_FALLBACK: bool = True
    
    # Upload limits
    MAX_UPLOAD_SIZE_MB: int = 10
    MAX_UPLOAD_ROWS: int = 10000
    
    # DNS timeouts
    DNS_TIMEOUT_SECONDS: float = 2.5
    
    # CORS
    CORS_ORIGINS: List[str] = ["http://localhost:3000", "http://127.0.0.1:3000"]
    
    # Guest and Auth
    ENABLE_GUEST_MODE: bool = True
    DATA_RETENTION_DAYS: int = 30

    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()
