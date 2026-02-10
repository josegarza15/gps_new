import asyncio
from database import engine
from models import User
from sqlalchemy.future import select

async def create_admin():
    async with engine.begin() as conn:
        from database import AsyncSessionLocal
        async with AsyncSessionLocal() as session:
             # Check if admin exists
             result = await session.execute(select(User).where(User.username == "admin"))
             user = result.scalar_one_or_none()
             
             if not user:
                 print("Creating admin user...")
                 new_user = User(username="admin", password_hash="admin") # In real app, hash this!
                 session.add(new_user)
                 await session.commit()
                 print("Admin user created (admin/admin).")
             else:
                 print("Admin user already exists.")

if __name__ == "__main__":
    asyncio.run(create_admin())
