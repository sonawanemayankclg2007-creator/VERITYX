from pathlib import Path
from typing import List, Union
from pydantic_settings import BaseSettings
from pydantic import field_validator

BASE_DIR = Path(__file__).resolve().parent.parent.parent
ENV_FILE_PATH = BASE_DIR / ".env"

class Settings(BaseSettings):
    PROJECT_NAME: str = "VERITYX"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Supabase Configuration
    SUPABASE_URL: str = "https://cfdzutredjuweiszdias.supabase.co"
    SUPABASE_ANON_KEY: str = "sb_publishable_FuUlPeqUHsG6altp1qcdfg_E48T2Brp"
    SUPABASE_SERVICE_ROLE_KEY: str = ""
    SUPABASE_JWT_SECRET: str = ""
    DATABASE_URL: str = ""
    
    # AI Engine Configuration
    GEMINI_API_KEY: str = ""
    GEMINI_MODEL: str = "gemini-3.5-flash-lite"
    
    # Security & CORS
    SECRET_KEY: str = "verityx-super-secret-key-32-chars-long-secure-token"
    FRONTEND_URL: str = "http://localhost:5173"
    BACKEND_URL: str = "http://localhost:8000"
    CORS_ORIGINS: Union[List[str], str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
    ]

    @field_validator("CORS_ORIGINS", mode="before")
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",")]
        elif isinstance(v, str) and v.startswith("["):
            import json
            try:
                return json.loads(v)
            except Exception:
                return ["http://localhost:5173", "http://127.0.0.1:5173"]
        return v

    class Config:
        env_file = (str(ENV_FILE_PATH), ".env")
        extra = "allow"

settings = Settings()

