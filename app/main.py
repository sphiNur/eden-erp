import os
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from app.database import engine, Base
from app.routers import orders, purchases, products, users, stores, categories


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan: create tables on startup."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield


app = FastAPI(title="Eden Core ERP", version="0.2.0", lifespan=lifespan)

# --- CORS ---
cors_origins = os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in cors_origins],
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
