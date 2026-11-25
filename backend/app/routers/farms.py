from pathlib import Path

from fastapi import APIRouter, Depends, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db import get_db
from app.deps import get_current_user, get_owned_farm
from app.models import Crop, DiseaseDiagnosis, Farm, User
from app.schemas import CropCreate, CropOut, FarmCreate, FarmOut

router = APIRouter(prefix="/api/farms", tags=["farms"])


def _remove_images(filenames: list[str]) -> None:
    base = (Path(settings.upload_dir) / "diagnoses").resolve()
    for filename in filenames:
        if Path(filename).name != filename:
            continue
        path = (base / filename).resolve()
        if path.parent == base and path.is_file():
            path.unlink(missing_ok=True)


@router.post("", response_model=FarmOut, status_code=status.HTTP_201_CREATED)
def create_farm(data: FarmCreate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    farm = Farm(owner_id=user.id, **data.model_dump())
    db.add(farm)
    db.commit()
    db.refresh(farm)
    return farm


@router.get("", response_model=list[FarmOut])
def list_farms(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.scalars(select(Farm).where(Farm.owner_id == user.id).order_by(Farm.id)).all()


@router.get("/{farm_id}", response_model=FarmOut)
def get_farm(farm: Farm = Depends(get_owned_farm)):
    return farm


@router.delete("/{farm_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_farm(farm: Farm = Depends(get_owned_farm), db: Session = Depends(get_db)):
    filenames = db.scalars(select(DiseaseDiagnosis.image_path).join(Crop).where(Crop.farm_id == farm.id)).all()
    db.delete(farm)
    db.commit()
    _remove_images(filenames)


@router.post("/{farm_id}/crops", response_model=CropOut, status_code=status.HTTP_201_CREATED)
def add_crop(data: CropCreate, farm: Farm = Depends(get_owned_farm), db: Session = Depends(get_db)):
    crop = Crop(farm_id=farm.id, **data.model_dump())
    db.add(crop)
    db.commit()
    db.refresh(crop)
    return crop


@router.get("/{farm_id}/crops", response_model=list[CropOut])
def list_crops(farm: Farm = Depends(get_owned_farm), db: Session = Depends(get_db)):
    return db.scalars(select(Crop).where(Crop.farm_id == farm.id).order_by(Crop.id)).all()
