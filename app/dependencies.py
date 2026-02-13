import hashlib
import hmac
import json
import logging
import os
import time
from typing import List
from urllib.parse import unquote, parse_qs

from fastapi import Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.database import AsyncSessionLocal

logger = logging.getLogger(__name__)

BOT_TOKEN = os.getenv("BOT_TOKEN", "")
APP_ENV = os.getenv("APP_ENV", "development")
INIT_DATA_MAX_AGE = int(os.getenv("INIT_DATA_MAX_AGE", "3600"))  # seconds


async def get_db() -> AsyncSession:
    """Yield a database session for request-scoped dependency injection."""
    # DEBUG: Test if get_db is called
    # raise HTTPException(status_code=418, detail="Teapot from get_db")
    try:
        async with AsyncSessionLocal() as session:
            yield session
    except Exception as e:
        print(f"DB CONFIG ERROR: {e}")
        raise HTTPException(status_code=500, detail=f"DB Error: {str(e)}")


def _validate_telegram_init_data(init_data: str, bot_token: str) -> dict | None:
    """
    Validate Telegram Web App initData using HMAC-SHA256.
    Returns the parsed user dict if valid, None otherwise.
    
    See: https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
    """
    if not init_data or not bot_token:
        return None

    parsed = parse_qs(init_data, keep_blank_values=True)
    received_hash = parsed.pop("hash", [None])[0]
    if not received_hash:
        return None

    # Build data-check-string: sorted key=value pairs joined by \n
    data_check_parts = []
    for key in sorted(parsed.keys()):
        val = parsed[key][0]
        data_check_parts.append(f"{key}={val}")
    data_check_string = "\n".join(data_check_parts)

    # HMAC: secret_key = HMAC-SHA256("WebAppData", bot_token)
    secret_key = hmac.new(b"WebAppData", bot_token.encode(), hashlib.sha256).digest()
    computed_hash = hmac.new(secret_key, data_check_string.encode(), hashlib.sha256).hexdigest()

    if not hmac.compare_digest(computed_hash, received_hash):
        return None

    # Extract user JSON
    user_json = parsed.get("user", [None])[0]
    if not user_json:
        return None

    try:
        user_data = json.loads(unquote(user_json))
    except (json.JSONDecodeError, TypeError):
        return None

    # Validate auth_date is not too old (replay protection)
    auth_date_str = parsed.get("auth_date", [None])[0]
    if auth_date_str:
        try:
            auth_date = int(auth_date_str)
            if time.time() - auth_date > INIT_DATA_MAX_AGE:
                return None  # initData too old
        except (ValueError, TypeError):
            pass

    return user_data


async def get_current_user(request: Request, db: AsyncSession = Depends(get_db)):
    """
    Resolve current user from request.

    Production: Validate Telegram initData HMAC from X-Telegram-Init-Data header.
    Development: Allow X-Dev-Telegram-Id header override, or fall back to first user.
    """
    from app.models import User

    # --- Production path: Telegram initData ---
    init_data = request.headers.get("X-Telegram-Init-Data", "")
    if init_data and BOT_TOKEN:
        tg_user = _validate_telegram_init_data(init_data, BOT_TOKEN)
        if not tg_user:
            raise HTTPException(status_code=401, detail="Invalid Telegram initData signature")

        telegram_id = tg_user.get("id")
        if not telegram_id:
            raise HTTPException(status_code=401, detail="No user ID in initData")

        result = await db.execute(
            select(User).where(User.telegram_id == telegram_id)
        )
        user = result.scalars().first()
        if not user:
            raise HTTPException(status_code=403, detail="User not registered in system")
        return user

    # --- Development fallback ---
    if APP_ENV == "development":
        # Check dev header override
        dev_tid = request.headers.get("X-Dev-Telegram-Id", "")
        if dev_tid:
            result = await db.execute(
                select(User).where(User.telegram_id == int(dev_tid))
            )
            user = result.scalars().first()
            if user:
                return user

        # Fallback: first user in DB
        result = await db.execute(select(User))
        user = result.scalars().first()
        if user:
            logger.warning("DEV AUTH: falling back to first user (id=%s, role=%s)", user.id, user.role.value)
            return user

    raise HTTPException(status_code=401, detail="Not authenticated")


def require_role(allowed_roles: List[str]):
    """
    Dependency factory: returns a dependency that checks the current user's role.

    Usage:
        @router.post("/", dependencies=[Depends(require_role(["admin"]))])
        async def admin_only_endpoint(...):
            ...
    """
    async def role_checker(
        current_user=Depends(get_current_user)
    ):
        if current_user.role.value not in allowed_roles:
            raise HTTPException(
                status_code=403,
                detail=f"Role '{current_user.role.value}' not authorized. Required: {allowed_roles}"
            )
        return current_user
    return role_checker
