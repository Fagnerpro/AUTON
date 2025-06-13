
from pydantic_settings import BaseSettings
from pydantic import validator


class Settings(BaseSettings):
    PROJECT_NAME: str = "AUTON"
    API_VERSION: str = "v1"
    BACKEND_CORS_ORIGINS: list[str] = ["*"]
    DATABASE_URL: str = "sqlite:///./auton.db"

    @validator("BACKEND_CORS_ORIGINS", pre=True)
    def assemble_cors_origins(cls, v):
        if isinstance(v, str):
            return [i.strip() for i in v.split(",")]
        return v

    class Config:
        case_sensitive = True


settings = Settings()
