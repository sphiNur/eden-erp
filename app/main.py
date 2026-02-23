from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from app.config import get_settings
from app.routers import orders, purchases, products, users, stores, categories, stalls, expenses, bills, templates, ai

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan.

    Database schema is managed by Alembic migrations.
    Run `alembic upgrade head` before starting the app in a new environment.
    """
    yield


app = FastAPI(title="Eden Core ERP", version="0.3.0", lifespan=lifespan)

# --- CORS ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- API Routers (all under /api prefix) ---
app.include_router(orders.router, prefix="/api")
app.include_router(purchases.router, prefix="/api")
app.include_router(products.router, prefix="/api")
app.include_router(users.router, prefix="/api")
app.include_router(stores.router, prefix="/api")
app.include_router(categories.router, prefix="/api")
app.include_router(stalls.router, prefix="/api")
app.include_router(expenses.router, prefix="/api")
app.include_router(bills.router, prefix="/api")
app.include_router(templates.router, prefix="/api")
app.include_router(ai.router, prefix="/api")

# --- Static Files & SPA Catch-All (Production) ---
# When deployed to Koyeb, FastAPI serves the React build.
# In development (Vite dev server), these paths are never hit.

DIST_DIR = Path("web/dist")

if DIST_DIR.exists():
    # Serve JS/CSS/images from /assets
    app.mount("/assets", StaticFiles(directory=str(DIST_DIR / "assets")), name="assets")

    # SPA catch-all: any non-API path returns index.html
    @app.get("/{full_path:path}")
    async def serve_react_app(full_path: str):
        return FileResponse(str(DIST_DIR / "index.html"))
