import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from fastapi.concurrency import run_in_threadpool
from fastapi.responses import FileResponse
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db import get_db
from app.deps import get_current_user, get_owned_crop
from app.models import Crop, DiseaseDiagnosis, Farm, Notification, User, YieldPrediction
from app.schemas import CropOut, DiagnosisOut, YieldEstimateOut, YieldPredictionOut
from app.services import yield_estimate
from app.services.diagnosis import ModelUnavailable, interpret, load_classifier
from app.services.images import ImageError, encode_jpeg, prepare_image
from app.services.knowledge import SUPPORTED_CROPS, canonical_crop


def _remove_diagnosis_image(filename: str) -> None:
    if Path(filename).name != filename:
        return
    base = (_diagnosis_dir()).resolve()
    path = (base / filename).resolve()
    if path.parent == base and path.is_file():
        path.unlink(missing_ok=True)

router = APIRouter(tags=["crops"])


def classifier_dep():
    try:
        return load_classifier(settings.model_path, settings.labels_path, settings.diagnosis_demo_mode)
    except ModelUnavailable as e:
        raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, str(e))


def _diagnosis_dir() -> Path:
    d = Path(settings.upload_dir) / "diagnoses"
    d.mkdir(parents=True, exist_ok=True)
    return d


def _diag_out(d: DiseaseDiagnosis) -> DiagnosisOut:
    return DiagnosisOut(
        id=d.id, crop_id=d.crop_id, status=d.status or "uncertain", disease_name=d.disease_name,
        confidence=d.confidence, recommendation=d.recommendation, model_version=d.model_version,
        is_demo=d.model_version == "demo", image_url=f"/api/diagnoses/{d.id}/image", created_at=d.created_at,
    )


@router.get("/api/crops/{crop_id}", response_model=CropOut)
def get_crop(crop: Crop = Depends(get_owned_crop)):
    return crop


@router.delete("/api/crops/{crop_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_crop(crop: Crop = Depends(get_owned_crop), db: Session = Depends(get_db)):
    filenames = db.scalars(select(DiseaseDiagnosis.image_path).where(DiseaseDiagnosis.crop_id == crop.id)).all()
    db.delete(crop)
    db.commit()
    for filename in filenames:
        _remove_diagnosis_image(filename)



# ---------------- التشخيص ----------------
@router.post("/api/crops/{crop_id}/diagnoses", response_model=DiagnosisOut, status_code=status.HTTP_201_CREATED)
async def diagnose(
    file: UploadFile = File(...),
    crop: Crop = Depends(get_owned_crop),
    classifier=Depends(classifier_dep),
    db: Session = Depends(get_db),
):
    crop_key = canonical_crop(crop.name)
    if crop_key is None:
        names = "، ".join(SUPPORTED_CROPS.values())
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, f"التشخيص متاح حالياً للمحاصيل: {names}")

    max_bytes = settings.max_upload_mb * 1024 * 1024
    data = await file.read(max_bytes + 1)
    if len(data) > max_bytes:
        raise HTTPException(status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, f"حجم الصورة يتجاوز {settings.max_upload_mb} ميغابايت")

    try:
        img = await run_in_threadpool(prepare_image, data)
    except ImageError as e:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, str(e))

    try:
        predictions = await run_in_threadpool(classifier.predict, img, crop_key)
    except ModelUnavailable as e:
        raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, str(e))

    result = interpret(predictions, crop_key, settings.diagnosis_min_confidence)

    filename = f"{uuid.uuid4().hex}.jpg"  # اسم عشوائي، لا نستخدم اسم ملف المستخدم أبداً
    (_diagnosis_dir() / filename).write_bytes(encode_jpeg(img))

    diag = DiseaseDiagnosis(
        crop_id=crop.id, image_path=filename, disease_name=result.disease_name,
        confidence=round(result.confidence, 4), recommendation=result.recommendation,
        status=result.status, model_version=getattr(classifier, "version", "unknown"),
    )
    db.add(diag)

    if result.status == "disease":
        msg = f"تشخيص محتمل في محصول {crop.name}: {result.disease_name} (ثقة {result.confidence * 100:.0f}%). راجع التفاصيل."
        if getattr(classifier, "version", "") == "demo":
            msg = "[تجريبي] " + msg
        exists = db.scalar(select(Notification.id).where(
            Notification.farm_id == crop.farm_id, Notification.type == "disease",
            Notification.message == msg, Notification.is_read.is_(False)))
        if not exists:
            db.add(Notification(farm_id=crop.farm_id, type="disease", severity=result.severity, message=msg))

    db.commit()
    db.refresh(diag)
    return _diag_out(diag)


@router.get("/api/crops/{crop_id}/diagnoses", response_model=list[DiagnosisOut])
def list_diagnoses(crop: Crop = Depends(get_owned_crop), db: Session = Depends(get_db)):
    rows = db.scalars(select(DiseaseDiagnosis).where(DiseaseDiagnosis.crop_id == crop.id)
                      .order_by(DiseaseDiagnosis.created_at.desc(), DiseaseDiagnosis.id.desc())).all()
    return [_diag_out(d) for d in rows]


@router.delete("/api/diagnoses/{diagnosis_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_diagnosis(diagnosis_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    diagnosis = db.scalar(
        select(DiseaseDiagnosis).join(Crop, Crop.id == DiseaseDiagnosis.crop_id)
        .join(Farm, Farm.id == Crop.farm_id)
        .where(DiseaseDiagnosis.id == diagnosis_id, Farm.owner_id == user.id)
    )
    if not diagnosis:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "التشخيص غير موجود")
    filename = diagnosis.image_path
    db.delete(diagnosis)
    db.commit()
    _remove_diagnosis_image(filename)


@router.get("/api/diagnoses/{diagnosis_id}/image")
def diagnosis_image(diagnosis_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    d = db.scalar(
        select(DiseaseDiagnosis).join(Crop, Crop.id == DiseaseDiagnosis.crop_id)
        .join(Farm, Farm.id == Crop.farm_id)
        .where(DiseaseDiagnosis.id == diagnosis_id, Farm.owner_id == user.id)
    )
    if not d or Path(d.image_path).name != d.image_path:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "الصورة غير موجودة")
    path = _diagnosis_dir() / d.image_path
    if not path.is_file():
        raise HTTPException(status.HTTP_404_NOT_FOUND, "الصورة غير موجودة")
    return FileResponse(path, media_type="image/jpeg", headers={"Cache-Control": "private, max-age=86400"})


# ---------------- توقع الإنتاج ----------------
def _pred_out(p: YieldPrediction) -> dict:
    return dict(id=p.id, crop_id=p.crop_id, estimated_kg=p.estimated_kg,
                low_kg=round(p.estimated_kg * yield_estimate.LOW_FACTOR, -1),
                high_kg=round(p.estimated_kg * yield_estimate.HIGH_FACTOR, -1),
                method=p.method, created_at=p.created_at)


@router.post("/api/crops/{crop_id}/yield-prediction", response_model=YieldEstimateOut,
             status_code=status.HTTP_201_CREATED)
def predict_yield(crop: Crop = Depends(get_owned_crop), db: Session = Depends(get_db)):
    try:
        est = yield_estimate.estimate(crop.name, crop.area_dunum, crop.planting_date)
    except ValueError as e:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, str(e))
    row = YieldPrediction(crop_id=crop.id, estimated_kg=est.estimated_kg, method=yield_estimate.METHOD)
    db.add(row)
    db.commit()
    db.refresh(row)
    return YieldEstimateOut(
        **_pred_out(row), progress_pct=est.progress_pct, stage=est.stage,
        expected_harvest_date=est.expected_harvest_date, disclaimer=yield_estimate.DISCLAIMER)


@router.get("/api/crops/{crop_id}/yield-predictions", response_model=list[YieldPredictionOut])
def list_predictions(crop: Crop = Depends(get_owned_crop), db: Session = Depends(get_db)):
    rows = db.scalars(select(YieldPrediction).where(YieldPrediction.crop_id == crop.id)
                      .order_by(YieldPrediction.created_at.desc(), YieldPrediction.id.desc())).all()
    return [YieldPredictionOut(**_pred_out(p)) for p in rows]
