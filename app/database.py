"""Database engine and session setup.

Uses centralized settings from app.config for all configuration.
URL cleanup uses urllib.parse instead of fragile string replacement.
"""
import logging
import ssl as _ssl
from urllib.parse import urlparse, parse_qs, urlencode, urlunparse

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase

from app.config import get_settings

logger = logging.getLogger(__name__)

settings = get_settings()

# --- URL Cleanup ---
# asyncpg does NOT understand ?sslmode= or ?ssl= or ?channel_binding= in URLs.
# We must strip them and pass SSL context via connect_args.

_STRIP_PARAMS = {"sslmode", "ssl", "channel_binding"}
_SSL_TRIGGER_VALUES = {"require", "verify-ca", "verify-full", "prefer"}


def _clean_database_url(raw_url: str) -> tuple[str, bool]:
    """
    Parse the database URL, strip asyncpg-incompatible query params,
    and detect if SSL is needed.

    Returns:
        (cleaned_url, needs_ssl)
    """
    parsed = urlparse(raw_url)
    query_params = parse_qs(parsed.query, keep_blank_values=True)

    needs_ssl = False

    # Check SSL params and remove them
    for param in _STRIP_PARAMS:
        values = query_params.pop(param, [])
        if any(v.lower() in _SSL_TRIGGER_VALUES for v in values):
            needs_ssl = True

    # Rebuild query string without stripped params
    remaining_params = {k: v[0] for k, v in query_params.items() if v}
    new_query = urlencode(remaining_params) if remaining_params else ""

    cleaned = urlunparse((
        parsed.scheme,
        parsed.netloc,
        parsed.path,
        parsed.params,
        new_query,
        parsed.fragment,
    ))

    return cleaned, needs_ssl


# Get the asyncpg-compatible URL from settings
_raw_url = settings.async_database_url
_is_placeholder = "user:password@localhost" in _raw_url or "no_user:no_password" in _raw_url

if _is_placeholder:
    logger.warning("DATABASE_URL is not configured. Database operations will fail.")
    _clean_url = "postgresql+asyncpg://no_user:no_password@no_host/no_db"
    _needs_ssl = False
else:
    _clean_url, _needs_ssl = _clean_database_url(_raw_url)

# --- SSL Context ---
connect_args: dict = {}
if _needs_ssl:
    ssl_ctx = _ssl.create_default_context()
    ssl_ctx.check_hostname = False
    ssl_ctx.verify_mode = _ssl.CERT_NONE
    connect_args["ssl"] = ssl_ctx

# --- Engine & Session ---
engine = create_async_engine(
    _clean_url,
    echo=settings.database_echo,
    connect_args=connect_args,
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
)


class Base(DeclarativeBase):
    pass
