from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

# --- Devices ---
class DeviceBase(BaseModel):
    device_id: str
    name: Optional[str] = None
    brand: Optional[str] = None
    model: Optional[str] = None
    mac_address: Optional[str] = None

class DeviceCreate(DeviceBase):
    pass

class DeviceResponse(DeviceBase):
    id: int
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

# --- Locations ---
class LocationBase(BaseModel):
    latitude: float
    longitude: float
    timestamp: datetime

class LocationCreate(LocationBase):
    device_unique_id: str # We receive the string ID from the device

class LocationResponse(LocationBase):
    id: int
    server_received_at: datetime
    device_id_fk: int

    class Config:
        from_attributes = True

# --- Auth ---
class UserLogin(BaseModel):
    username: str
    password: str

class UserResponse(BaseModel):
    id: int
    username: str

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

# --- Safe Zones ---
class SafeZoneBase(BaseModel):
    name: str
    latitude: float
    longitude: float
    radius: float = 100.0

class SafeZoneCreate(SafeZoneBase):
    device_unique_id: str

class SafeZoneResponse(SafeZoneBase):
    id: int
    created_at: datetime
    device_id_fk: int

    class Config:
        from_attributes = True
