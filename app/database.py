from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase

import os
import ssl as _ssl

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+asyncpg://user:password@localhost/dbname")

# Neon/Koyeb may provide postgres:// but asyncpg requires postgresql+asyncpg://
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql+asyncpg://", 1)
elif DATABASE_URL.startswith("postgresql://") and "+asyncpg" not in DATABASE_URL:
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://", 1)

# --- SSL handling for Neon / cloud Postgres ---
# asyncpg does NOT understand ?sslmode= or ?ssl= in URLs.
# We must strip them and pass SSL context via connect_args.
connect_args: dict = {}
_clean_url = DATABASE_URL
_needs_ssl = False

# Check for any ssl-related query params
for _ssl_param in ["?sslmode=require", "&sslmode=require", "?ssl=require", "&ssl=require"]:
    if _ssl_param in _clean_url:
        _clean_url = _clean_url.replace(_ssl_param, "")
        _needs_ssl = True

# Also strip channel_binding param (not supported by asyncpg)
for _cb_param in ["?channel_binding=require", "&channel_binding=require"]:
    if _cb_param in _clean_url:
        _clean_url = _clean_url.replace(_cb_param, "")

# Fix broken URL if stripping left a dangling ? or &
_clean_url = _clean_url.rstrip("?").rstrip("&")
if "?&" in _clean_url:
    _clean_url = _clean_url.replace("?&", "?")

if _needs_ssl:
    ssl_ctx = _ssl.create_default_context()
    ssl_ctx.check_hostname = False
    ssl_ctx.verify_mode = _ssl.CERT_NONE
    connect_args["ssl"] = ssl_ctx

# echo=False for production; set DATABASE_ECHO=1 env var to enable SQL logging
_echo = os.getenv("DATABASE_ECHO", "").lower() in ("1", "true", "yes")
engine = create_async_engine(_clean_url, echo=_echo, connect_args=connect_args)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
)

class Base(DeclarativeBase):
    pass
