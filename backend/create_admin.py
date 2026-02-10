from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from models import User

# Sync URL (remove +asyncpg)
SQLALCHEMY_DATABASE_URL = "postgresql://apis:q6IomrPZGhzIH8zZ395V2C@217.216.80.226:5432/gps_new"

# Setup DB connection
engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)
db = SessionLocal()

def create_admin():
    try:
        # 1. Add column if not exists (Migration)
        with engine.connect() as conn:
            conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;"))
            conn.commit() # Important for some drivers
            print("Migration: is_active column added (if missing).")

        # Check if admin exists
        existing_user = db.query(User).filter(User.username == "admin").first()
        if existing_user:
            print("User 'admin' found.")
            # FORCE RESET PASSWORD to 'admin' to ensure login works
            existing_user.password_hash = "admin"
            if not existing_user.is_active:
               existing_user.is_active = True
            
            db.commit()
            print("User 'admin' password reset to 'admin' and activated.")
            return

        # Create admin user
        # Note: In production, password should be hashed! But for this request, user specified "admin" / "admin"
        # and our backend currently stores plain text based on `models.py` (password_hash field but login logic compares directly).
        # Wait, let me double check login logic in main.py...
        # Yes: if not db_user or db_user.password_hash != user.password:
        
        new_user = User(username="admin", password_hash="admin", is_active=True)
        db.add(new_user)
        db.commit()
        print("User 'admin' created successfully with password 'admin'.")
        
    except Exception as e:
        print(f"Error creating admin: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    create_admin()
