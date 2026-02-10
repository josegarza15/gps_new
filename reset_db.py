import asyncio
from backend.database import engine, Base
from sqlalchemy import text

async def reset_db():
    async with engine.begin() as conn:
        print("Resetting database...")
        # Truncate tables with cascade to handle foreign keys
        await conn.execute(text("TRUNCATE TABLE locations, devices RESTART IDENTITY CASCADE"))
        print("Database reset complete.")

if __name__ == "__main__":
    asyncio.run(reset_db())
