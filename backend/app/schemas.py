from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator


def _validate_bcrypt_password(value: str) -> str:
    # bcrypt accepts at most 72 UTF-8 bytes; reject instead of silently truncating.
    if len(value.encode("utf-8")) > 72:
        raise ValueError("كلمة المرور يجب ألا تتجاوز 72 بايتاً")
    return value


class UserCreate(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)

    @field_validator("password")
    @classmethod
    def password_byte_limit(cls, value: str) -> str:
        return _validate_bcrypt_password(value)


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    email: EmailStr
    role: str


class PasswordChange(BaseModel):
    current_password: str = Field(min_length=8, max_length=128)
    new_password: str = Field(min_length=8, max_length=128)

    @field_validator("current_password", "new_password")
    @classmethod
    def password_byte_limit(cls, value: str) -> str:
        return _validate_bcrypt_password(value)


class PasswordResetRequest(BaseModel):
    email: EmailStr


class PasswordResetConfirm(BaseModel):
    token: str = Field(min_length=20, max_length=200)
    new_password: str = Field(min_length=8, max_length=128)

    @field_validator("new_password")
    @classmethod
    def password_byte_limit(cls, value: str) -> str:
        return _validate_bcrypt_password(value)


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class FarmCreate(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    location: str | None = Field(default=None, max_length=255)
    area_dunum: float | None = Field(default=None, gt=0)


class FarmOut(FarmCreate):
    model_config = ConfigDict(from_attributes=True)
    id: int


class CropCreate(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    planting_date: date
    area_dunum: float | None = Field(default=None, gt=0)


class CropOut(CropCreate):
    model_config = ConfigDict(from_attributes=True)
    id: int
    farm_id: int


class ReadingCreate(BaseModel):
    soil_moisture: float = Field(ge=0, le=100)
    temperature: float | None = Field(default=None, ge=-30, le=70)


class ReadingOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    farm_id: int
    soil_moisture: float
    temperature: float | None
    source: str
    recorded_at: datetime


class NotificationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    farm_id: int
    type: str
    severity: str
    message: str
    is_read: bool
    created_at: datetime


class DashboardOut(BaseModel):
    farm: FarmOut
    crops_count: int
    status: Literal["green", "yellow", "red", "unknown"]
    latest_reading: ReadingOut | None
    unread_notifications: int
    recent_notifications: list[NotificationOut]


class DiagnosisOut(BaseModel):
    id: int
    crop_id: int
    status: Literal["healthy", "disease", "uncertain"]
    disease_name: str | None
    confidence: float | None
    recommendation: str | None
    model_version: str | None
    is_demo: bool
    image_url: str
    created_at: datetime


class YieldPredictionOut(BaseModel):
    id: int
    crop_id: int
    estimated_kg: float
    low_kg: float
    high_kg: float
    method: str
    created_at: datetime


class YieldEstimateOut(YieldPredictionOut):
    progress_pct: int
    stage: str
    expected_harvest_date: date
    disclaimer: str
