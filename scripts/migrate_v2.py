import asyncio
import os
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text
from app.database import Base, engine

async def migrate():
    # --- Check if database URL is configured ---
    db_url = os.getenv("DATABASE_URL", "")
    if not db_url or "user:password" in db_url:
        print("SKIPPING MIGRATION: DATABASE_URL is not configured or is using the default placeholder.")
        print("Please set the DATABASE_URL secret in your environment/GitHub.")
        return

    print("Starting migration...")
    
    # First, make sure all new tables are created
    # Base.metadata.create_all only creates tables that don't exist
    async with engine.begin() as conn:
        print("Ensuring new tables exist...")
        await conn.run_sync(Base.metadata.create_all)
    
    # Now manually add columns that have been added to existing tables
    async with engine.connect() as conn:
        print("Checking for missing columns...")
        
        # Check if default_stall_id exists in products
        result = await conn.execute(text(
            "SELECT column_name FROM information_schema.columns "
            "WHERE table_name='products' AND column_name='default_stall_id'"
        ))
        column_exists = result.scalar() is not None
        
        if not column_exists:
            print("Adding default_stall_id to products table...")
            await conn.execute(text(
                "ALTER TABLE products ADD COLUMN default_stall_id UUID REFERENCES stalls(id)"
            ))
            await conn.commit()
            print("Column added successfully.")
        else:
            print("Column default_stall_id already exists.")

    print("Migration completed.")

if __name__ == "__main__":
    asyncio.run(migrate())
