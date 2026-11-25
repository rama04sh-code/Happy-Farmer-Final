from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.db import get_db
from app.deps import get_owned_farm
from app.models import Crop, Farm, Notification, SensorReading
from app.schemas import DashboardOut
from app.services.irrigation import classify_moisture

router = APIRouter(prefix="/api/farms/{farm_id}/dashboard", tags=["dashboard"])


@router.get("", response_model=DashboardOut)
def dashboard(farm: Farm = Depends(get_owned_farm), db: Session = Depends(get_db)):
    latest = db.scalar(
        select(SensorReading).where(SensorReading.farm_id == farm.id)
        .order_by(SensorReading.recorded_at.desc(), SensorReading.id.desc()).limit(1)
    )
    crops_count = db.scalar(select(func.count(Crop.id)).where(Crop.farm_id == farm.id)) or 0
    unread = db.scalar(
        select(func.count(Notification.id)).where(Notification.farm_id == farm.id, Notification.is_read.is_(False))
    ) or 0
    recent = db.scalars(
        select(Notification).where(Notification.farm_id == farm.id)
        .order_by(Notification.created_at.desc(), Notification.id.desc()).limit(5)
    ).all()
    return DashboardOut(
        farm=farm,
        crops_count=crops_count,
        status=classify_moisture(latest.soil_moisture) if latest else "unknown",
        latest_reading=latest,
        unread_notifications=unread,
        recent_notifications=recent,
    )
