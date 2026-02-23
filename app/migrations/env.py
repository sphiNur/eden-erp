"""Alembic async migration environment for Eden ERP.

Reads database URL from environment (same as app.database),
supports both online (connected) and offline (SQL-only) migrations.
"""
import asyncio
import os
import sys
from logging.config import fileConfig

from alembic import context
from sqlalchemy import pool
from sqlalchemy.ext.asyncio import create_async_engine

# Ensure project root is on sys.path so we can import app modules
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))

from app.database import Base  # noqa: E402
from app.models import *  # noqa: E402, F401, F403  — force all models to register with Base.metadata

# Alembic Config object — provides access to .ini file values
config = context.config

# Set up Python logging from the config file
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Target metadata for 'autogenerate' support
target_metadata = Base.metadata


def _get_url() -> str:
    """Build the async database URL from environment, same logic as app.database."""
    url = os.getenv("DATABASE_URL", "postgresql+asyncpg://user:password@localhost/dbname")

    if url.startswith("postgres://"):
        url = url.replace("postgres://", "postgresql+asyncpg://", 1)
    elif url.startswith("postgresql://") and "+asyncpg" not in url:
        url = url.replace("postgresql://", "postgresql+asyncpg://", 1)

    # Strip SSL params that asyncpg doesn't understand in the URL
    for param in ["?sslmode=require", "&sslmode=require", "?ssl=require", "&ssl=require",
                  "?channel_binding=require", "&channel_binding=require"]:
        url = url.replace(param, "")

    url = url.rstrip("?").rstrip("&")
    if "?&" in url:
        url = url.replace("?&", "?")

    return url


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode — generates SQL without connecting."""
    url = _get_url()
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection):
    """Shared migration runner used by the async online path."""
    context.configure(connection=connection, target_metadata=target_metadata)
    with context.begin_transaction():
        context.run_migrations()


async def run_async_migrations() -> None:
    """Create an async engine and run migrations within its connection."""
    connectable = create_async_engine(_get_url(), poolclass=pool.NullPool)

    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)

    await connectable.dispose()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode — connects to the database."""
    asyncio.run(run_async_migrations())


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
