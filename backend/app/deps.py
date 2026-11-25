from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import decode_token_claims
from app.db import get_db
from app.models import Crop, Farm, User

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    claims = decode_token_claims(token)
    user = db.get(User, claims[0]) if claims else None
    if not user or claims[1] != user.token_version:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "جلسة غير صالحة، سجّل الدخول من جديد")
    return user


def get_owned_farm(farm_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> Farm:
    farm = db.get(Farm, farm_id)
    if not farm or farm.owner_id != user.id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "المزرعة غير موجودة")
    return farm


def get_owned_crop(crop_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> Crop:
    crop = db.scalar(
        select(Crop).join(Farm, Farm.id == Crop.farm_id).where(Crop.id == crop_id, Farm.owner_id == user.id)
    )
    if not crop:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "المحصول غير موجود")
    return crop
