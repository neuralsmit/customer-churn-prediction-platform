import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "Customer Churn Prediction Platform"
    API_V1_STR: str = "/api"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "supersecretkeyforjwtchurnpredictionplatform")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 1 day
    
    # Database config with SQLite fallback for local developer running without Postgres
    RUNNING_IN_DOCKER: bool = os.getenv("RUNNING_IN_DOCKER", "false").lower() == "true" or os.path.exists("/.dockerenv")
    
    POSTGRES_SERVER: str = os.getenv("POSTGRES_SERVER", "db")
    POSTGRES_USER: str = os.getenv("POSTGRES_USER", "postgres")
    POSTGRES_PASSWORD: str = os.getenv("POSTGRES_PASSWORD", "postgres")
    POSTGRES_DB: str = os.getenv("POSTGRES_DB", "churn_db")
    
    @property
    def DATABASE_URL(self) -> str:
        if self.RUNNING_IN_DOCKER:
            return f"postgresql://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_SERVER}:5432/{self.POSTGRES_DB}"
        else:
            # Fall back to SQLite database file on local machine
            return "sqlite:///./churn.db"

    class Config:
        case_sensitive = True

settings = Settings()
