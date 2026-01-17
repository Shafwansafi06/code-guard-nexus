from pydantic_settings import BaseSettings
from typing import List, Optional


class Settings(BaseSettings):
    # Supabase
    SUPABASE_URL: str
    SUPABASE_KEY: str
    SUPABASE_SERVICE_KEY: str
    
    # API
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "CodeGuard Nexus API"
    DEBUG: bool = True
    ALLOWED_ORIGINS: str = "http://localhost:5173,http://localhost:3000,http://localhost:8080"
    
    # JWT
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # Google
    GOOGLE_CLIENT_ID: Optional[str] = None
    GOOGLE_API_KEY: Optional[str] = None
    GOOGLE_CLIENT_SECRETS_FILE: Optional[str] = "client_secret.json"
    GOOGLE_OAUTH_REDIRECT_URI: Optional[str] = "http://localhost:5173/auth/google/callback"
    
    @property
    def allowed_origins_list(self) -> List[str]:
        return [origin.strip() for origin in self.ALLOWED_ORIGINS.split(",")]
    
    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
