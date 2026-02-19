from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "postgresql+asyncpg://user:password@localhost:5432/appdb"
    app_env: str = "development"

    model_config = {"env_file": ".env"}


settings = Settings()
