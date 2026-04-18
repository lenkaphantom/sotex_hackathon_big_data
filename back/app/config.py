from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    db_connection_string: str
    api_prefix: str = "/api"
    cors_origins: list[str] = ["http://localhost:4200"]

    class Config:
        env_file = ".env"

settings = Settings()