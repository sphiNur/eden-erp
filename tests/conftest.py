"""
Shared test fixtures for Eden ERP.

Uses an in-memory SQLite database (via aiosqlite) so tests
run fast without requiring PostgreSQL.
"""
import os
import pytest
from uuid import uuid4

# Force test DATABASE_URL BEFORE any app module import
os.environ["DATABASE_URL"] = "sqlite+aiosqlite://"
os.environ["APP_ENV"] = "testing"
os.environ["BOT_TOKEN"] = ""

from httpx import ASGITransport, AsyncClient  # noqa: E402
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker  # noqa: E402

from app.database import Base  # noqa: E402
from app.models import User, UserRole, Store  # noqa: E402
from app.dependencies import get_db, get_current_user  # noqa: E402
from app.main import app  # noqa: E402


# --- In-memory SQLite engine for tests ---
test_engine = create_async_engine(
    "sqlite+aiosqlite://",
    echo=False,
    connect_args={"check_same_thread": False},
)

TestSessionLocal = async_sessionmaker(
    bind=test_engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
)


# --- Fixtures ---

@pytest.fixture(autouse=True)
async def setup_database():
    """Create all tables before each test, drop them after."""
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


async def override_get_db():
    """Dependency override: yield a test database session."""
    async with TestSessionLocal() as session:
        yield session


# Test admin user
_test_user = None


async def override_get_current_user():
    """Dependency override: return a pre-seeded admin user."""
    return _test_user


@pytest.fixture(autouse=True)
async def seed_test_user():
    """Seed a test admin user into the database before each test."""
    global _test_user
    async with TestSessionLocal() as session:
        user = User(
            id=uuid4(),
            telegram_id=123456789,
            username="test_admin",
            role=UserRole.ADMIN,
        )
        session.add(user)
        await session.commit()
        await session.refresh(user)
        _test_user = user


@pytest.fixture(autouse=True)
async def seed_test_store():
    """Seed a test store into the database."""
    async with TestSessionLocal() as session:
        store = Store(
            id=uuid4(),
            name="Test Store",
            address="123 Test St",
        )
        session.add(store)
        await session.commit()


@pytest.fixture
def app_with_overrides():
    """Return the FastAPI app with dependency overrides applied."""
    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = override_get_current_user
    yield app
    app.dependency_overrides.clear()


@pytest.fixture
async def client(app_with_overrides):
    """Async HTTP test client using httpx."""
    transport = ASGITransport(app=app_with_overrides)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac
