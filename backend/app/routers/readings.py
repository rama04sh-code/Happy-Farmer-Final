from fastapi import APIRouter, Depends, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db import get_db
from app.deps import get_owned_farm
from app.models import Farm, Notification, SensorReading
from app.schemas import ReadingCreate, ReadingOut
from app.services.irrigation import SEVERITY, classify_moisture, moisture_message

router = APIRouter(prefix="/api/farms/{farm_id}/readings", tags=["readings"])


@router.post("", response_model=ReadingOut, status_code=status.HTTP_201_CREATED)
def add_reading(data: ReadingCreate, farm: Farm = Depends(get_owned_farm), db: Session = Depends(get_db)):
    """إدخال قراءة (يدوي الآن، ومن حساس ESP32 لاحقاً بنفس الواجهة)."""
    reading = SensorReading(farm_id=farm.id, source="manual", **data.model_dump())
    db.add(reading)

    level = classify_moisture(data.soil_moisture)
    if level != "green":
        already_open = db.scalar(
            select(Notification.id).where(
                Notification.farm_id == farm.id,
                Notification.type == "low_moisture",
                Notification.is_read.is_(False),
            )
        )
        if not already_open:  # لا نكرر تنبيهاً غير مقروء
            db.add(Notification(
                farm_id=farm.id,
                type="low_moisture",
                severity=SEVERITY[level],
                message=moisture_message(level, data.soil_moisture),
            ))
    db.commit()
    db.refresh(reading)
    return reading


@router.get("", response_model=list[ReadingOut])
def list_readings(limit: int = 50, farm: Farm = Depends(get_owned_farm), db: Session = Depends(get_db)):
    limit = max(1, min(limit, 200))
    return db.scalars(
        select(SensorReading).where(SensorReading.farm_id == farm.id)
        .order_by(SensorReading.recorded_at.desc(), SensorReading.id.desc()).limit(limit)
    ).all()
