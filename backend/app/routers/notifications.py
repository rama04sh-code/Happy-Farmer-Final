from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db import get_db
from app.deps import get_current_user, get_owned_farm
from app.models import Farm, Notification, User
from app.schemas import NotificationOut

router = APIRouter(tags=["notifications"])


@router.get("/api/farms/{farm_id}/notifications", response_model=list[NotificationOut])
def list_notifications(unread_only: bool = False, farm: Farm = Depends(get_owned_farm), db: Session = Depends(get_db)):
    q = select(Notification).where(Notification.farm_id == farm.id)
    if unread_only:
        q = q.where(Notification.is_read.is_(False))
    return db.scalars(q.order_by(Notification.created_at.desc(), Notification.id.desc())).all()


@router.post("/api/notifications/{notification_id}/read", response_model=NotificationOut)
def mark_read(notification_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    n = db.scalar(
        select(Notification).join(Farm, Farm.id == Notification.farm_id)
        .where(Notification.id == notification_id, Farm.owner_id == user.id)
    )
    if not n:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "التنبيه غير موجود")
    n.is_read = True
    db.commit()
    db.refresh(n)
    return n
