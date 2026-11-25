from datetime import date, datetime, timezone

from sqlalchemy import Boolean, Date, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db import Base


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(120))
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    role: Mapped[str] = mapped_column(String(20), default="farmer")
    token_version: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    farms: Mapped[list["Farm"]] = relationship(back_populates="owner", cascade="all, delete-orphan")
    password_reset_tokens: Mapped[list["PasswordResetToken"]] = relationship(back_populates="user", cascade="all, delete-orphan")


class Farm(Base):
    __tablename__ = "farms"

    id: Mapped[int] = mapped_column(primary_key=True)
    owner_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    name: Mapped[str] = mapped_column(String(120))
    location: Mapped[str | None] = mapped_column(String(255), default=None)
    area_dunum: Mapped[float | None] = mapped_column(default=None)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    owner: Mapped[User] = relationship(back_populates="farms")
    crops: Mapped[list["Crop"]] = relationship(back_populates="farm", cascade="all, delete-orphan")
    readings: Mapped[list["SensorReading"]] = relationship(back_populates="farm", cascade="all, delete-orphan")
    notifications: Mapped[list["Notification"]] = relationship(back_populates="farm", cascade="all, delete-orphan")


class Crop(Base):
    __tablename__ = "crops"

    id: Mapped[int] = mapped_column(primary_key=True)
    farm_id: Mapped[int] = mapped_column(ForeignKey("farms.id"), index=True)
    name: Mapped[str] = mapped_column(String(120))
    planting_date: Mapped[date] = mapped_column(Date)
    area_dunum: Mapped[float | None] = mapped_column(Float, default=None)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    farm: Mapped[Farm] = relationship(back_populates="crops")
    diagnoses: Mapped[list["DiseaseDiagnosis"]] = relationship(back_populates="crop", cascade="all, delete-orphan")
    predictions: Mapped[list["YieldPrediction"]] = relationship(back_populates="crop", cascade="all, delete-orphan")


class DiseaseDiagnosis(Base):
    __tablename__ = "disease_diagnoses"

    id: Mapped[int] = mapped_column(primary_key=True)
    crop_id: Mapped[int] = mapped_column(ForeignKey("crops.id"), index=True)
    image_path: Mapped[str] = mapped_column(String(500))
    disease_name: Mapped[str | None] = mapped_column(String(200), default=None)
    confidence: Mapped[float | None] = mapped_column(Float, default=None)
    recommendation: Mapped[str | None] = mapped_column(Text, default=None)
    status: Mapped[str | None] = mapped_column(String(20), default=None)
    model_version: Mapped[str | None] = mapped_column(String(50), default=None)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    crop: Mapped[Crop] = relationship(back_populates="diagnoses")


class SensorReading(Base):
    __tablename__ = "sensor_readings"

    id: Mapped[int] = mapped_column(primary_key=True)
    farm_id: Mapped[int] = mapped_column(ForeignKey("farms.id"), index=True)
    soil_moisture: Mapped[float] = mapped_column(Float)
    temperature: Mapped[float | None] = mapped_column(Float, default=None)
    source: Mapped[str] = mapped_column(String(20), default="manual")
    recorded_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, index=True)

    farm: Mapped[Farm] = relationship(back_populates="readings")


class Notification(Base):
    __tablename__ = "notifications"

    id: Mapped[int] = mapped_column(primary_key=True)
    farm_id: Mapped[int] = mapped_column(ForeignKey("farms.id"), index=True)
    type: Mapped[str] = mapped_column(String(40))
    severity: Mapped[str] = mapped_column(String(20))
    message: Mapped[str] = mapped_column(Text)
    is_read: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, index=True)

    farm: Mapped[Farm] = relationship(back_populates="notifications")


class YieldPrediction(Base):
    __tablename__ = "yield_predictions"

    id: Mapped[int] = mapped_column(primary_key=True)
    crop_id: Mapped[int] = mapped_column(ForeignKey("crops.id"), index=True)
    estimated_kg: Mapped[float] = mapped_column(Float)
    method: Mapped[str] = mapped_column(String(40), default="baseline")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    crop: Mapped[Crop] = relationship(back_populates="predictions")


class LoginAttempt(Base):
    __tablename__ = "login_attempts"

    id: Mapped[int] = mapped_column(primary_key=True)
    email_hash: Mapped[str] = mapped_column(String(64), index=True)
    ip_address: Mapped[str | None] = mapped_column(String(64), index=True, default=None)
    attempted_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, index=True)


class PasswordResetToken(Base):
    __tablename__ = "password_reset_tokens"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    token_hash: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    used_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), default=None)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    user: Mapped[User] = relationship(back_populates="password_reset_tokens")
