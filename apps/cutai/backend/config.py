from functools import lru_cache
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    openai_api_key: str
    openai_llm_model: str = "gpt-4o"
    openai_image_model: str = "gpt-image-2"
    image_size: str = "1024x1024"
    image_quality: str = "medium"
    database_url: str = "sqlite+aiosqlite:///./cutai.db"
    cors_origins: str = "http://localhost:5173,http://localhost:3000"
    llm_temperature: float = 0.7
    max_scenes: int = 8
    frames_dir: str = "generated/frames"

    @property
    def cors_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache
def get_settings() -> Settings:
    return Settings()
