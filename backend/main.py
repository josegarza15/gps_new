from fastapi import FastAPI, Depends, HTTPException, status
from sqlalchemy.future import select
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from datetime import datetime
import pytz

from database import engine, Base, get_db
from models import Device, Location, User
from schemas import DeviceCreate, DeviceResponse, LocationCreate, LocationResponse, UserLogin, Token

app = FastAPI(title="GPS Tracker API")

# --- Startup ---
@app.on_event("startup")
async def startup():
    async with engine.begin() as conn:
        # Create tables
        await conn.run_sync(Base.metadata.create_all)

# --- Devices ---
@app.post("/devices/", response_model=DeviceResponse)
async def register_device(device: DeviceCreate, db: AsyncSession = Depends(get_db)):
    # Check if device exists
    result = await db.execute(select(Device).where(Device.device_id == device.device_id))
    existing_device = result.scalar_one_or_none()
    
    if existing_device:
        # Update existing device info if changed (optional logic)
        existing_device.name = device.name or existing_device.name
        existing_device.model = device.model or existing_device.model
        existing_device.brand = device.brand or existing_device.brand
        existing_device.mac_address = device.mac_address or existing_device.mac_address
        await db.commit()
        await db.refresh(existing_device)
        return existing_device
    
    new_device = Device(
        device_id=device.device_id,
        name=device.name,
        brand=device.brand,
        model=device.model,
        mac_address=device.mac_address
    )
    db.add(new_device)
    await db.commit()
    await db.refresh(new_device)
    return new_device

@app.get("/devices/", response_model=List[DeviceResponse])
async def get_devices(skip: int = 0, limit: int = 100, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Device).offset(skip).limit(limit))
    return result.scalars().all()

# --- Locations ---
@app.post("/locations/", response_model=LocationResponse)
async def create_location(location: LocationCreate, db: AsyncSession = Depends(get_db)):
    # Find device by unique ID
    result = await db.execute(select(Device).where(Device.device_id == location.device_unique_id))
    device = result.scalar_one_or_none()
    
    if not device:
        # Auto-register device if not found (optional, but robust)
        # For strict security, return 404
        raise HTTPException(status_code=404, detail="Device not registered")
    
    # Timezone conversion
    utc_time = location.timestamp
    monterrey_tz = pytz.timezone('America/Monterrey')
    
    # Assuming location.timestamp comes as aware UTC or naive (treated as UTC)
    if utc_time.tzinfo is None:
        utc_time = pytz.utc.localize(utc_time)
    
    monterrey_time = utc_time.astimezone(monterrey_tz)

    new_location = Location(
        device_id_fk=device.id,
        latitude=location.latitude,
        longitude=location.longitude,
        timestamp=monterrey_time.replace(tzinfo=None), # Naive for DB, but now in Monterrey time
        server_received_at=datetime.utcnow() # Server time usually kept as UTC
    )
    db.add(new_location)
    await db.commit()
    await db.refresh(new_location)
    return new_location

# --- Auth (Simplified) ---
@app.post("/login", response_model=Token)
@app.post("/login", response_model=Token)
async def login(user: UserLogin, db: AsyncSession = Depends(get_db)):
    # Real DB check
    result = await db.execute(select(User).where(User.username == user.username))
    db_user = result.scalar_one_or_none()
    
    if not db_user or db_user.password_hash != user.password: 
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
        )
    
    return {"access_token": f"token-for-{user.username}", "token_type": "bearer"}

@app.get("/devices/{device_id}", response_model=DeviceResponse)
async def get_device(device_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Device).where(Device.device_id == device_id))
    device = result.scalar_one_or_none()
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")
    return device

@app.get("/")
def read_root():
    return {"status": "ok", "service": "GPS Tracker API"}
