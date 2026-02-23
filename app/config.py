"""Centralized application configuration using pydantic-settings.

All environment variables are read here and nowhere else.
Other modules should import `settings` from this module.
"""
import os
from functools import lru_cache
from typing import List, Optional

from pydantic_settings import BaseSettings
from pydantic import field_validator


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # --- Database ---
    database_url: str = "postgresql+asyncpg://user:password@localhost/dbname"
    database_echo: bool = False

    # --- Authentication ---
    bot_token: str = ""
    app_env: str = "development"
    init_data_max_age: int = 3600  # seconds

    # --- CORS ---
    cors_origins: str = "http://localhost:5173"

    @property
    def cors_origins_list(self) -> List[str]:
        """Split comma-separated origins into a list."""
        return [o.strip() for o in self.cors_origins.split(",")]

    @property
    def is_development(self) -> bool:
        return self.app_env == "development"

    @property
    def is_production(self) -> bool:
        return self.app_env == "production"

    @property
    def is_testing(self) -> bool:
        return self.app_env == "testing"

    @property
    def async_database_url(self) -> str:
        """Convert the raw DATABASE_URL to an asyncpg-compatible URL.

        Handles Neon/Koyeb/Supabase conventions:
        - postgres:// → postgresql+asyncpg://
        - postgresql:// → postgresql+asyncpg://
        """
        url = self.database_url

        if url.startswith("postgres://"):
            url = url.replace("postgres://", "postgresql+asyncpg://", 1)
        elif url.startswith("postgresql://") and "+asyncpg" not in url:
            url = url.replace("postgresql://", "postgresql+asyncpg://", 1)

        return url

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "extra": "ignore",
    }


@lru_cache
def get_settings() -> Settings:
    """Cached settings singleton."""
    return Settings()
