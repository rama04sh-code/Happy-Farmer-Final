"""تقدير مبدئي للإنتاج (baseline). ليس نموذج تعلم آلة.

القيم المرجعية أدناه افتراضات مؤقتة ويجب استبدالها بأرقام حقيقية من
بيانات وزارة الزراعة / مهندس زراعي محلي، ويفضّل جعلها حسب المنطقة وطريقة الزراعة.
"""
from dataclasses import dataclass
from datetime import date, timedelta

from app.services.knowledge import SUPPORTED_CROPS, canonical_crop

REFERENCE = {
    "tomato": {"yield_kg_per_dunum": 4000, "cycle_days": 120},
    "potato": {"yield_kg_per_dunum": 2500, "cycle_days": 110},
    "pepper": {"yield_kg_per_dunum": 2000, "cycle_days": 130},
}
LOW_FACTOR, HIGH_FACTOR = 0.7, 1.3
METHOD = "baseline"
DISCLAIMER = ("تقدير مبدئي مبني على متوسط إنتاجية مرجعي للمحصول والمساحة فقط، ولا يأخذ بالحسبان "
              "الطقس أو الصنف أو الإصابات. يتفاوت الإنتاج الفعلي كثيراً.")


@dataclass
class Estimate:
    crop_key: str
    estimated_kg: float
    low_kg: float
    high_kg: float
    progress_pct: int
    stage: str
    expected_harvest_date: date


def stage_for(days: int, cycle: int) -> str:
    if days < 0:
        return "لم يبدأ الموسم بعد"
    p = days / cycle
    if p < 0.25:
        return "بداية الموسم"
    if p < 0.75:
        return "منتصف الموسم"
    if p < 1:
        return "قرب الحصاد"
    return "تجاوز مدة الموسم المرجعية"


def estimate(crop_name: str, area_dunum: float | None, planting_date: date, today: date | None = None) -> Estimate:
    key = canonical_crop(crop_name)
    if key is None:
        names = "، ".join(SUPPORTED_CROPS.values())
        raise ValueError(f"لا توجد بيانات مرجعية لهذا المحصول بعد (المتاح حالياً: {names})")
    if not area_dunum or area_dunum <= 0:
        raise ValueError("أدخل مساحة المحصول بالدونم أولاً")

    ref = REFERENCE[key]
    today = today or date.today()
    days = (today - planting_date).days
    progress = max(0.0, min(1.0, days / ref["cycle_days"]))
    est = area_dunum * ref["yield_kg_per_dunum"]
    return Estimate(
        crop_key=key,
        estimated_kg=round(est, -1),
        low_kg=round(est * LOW_FACTOR, -1),
        high_kg=round(est * HIGH_FACTOR, -1),
        progress_pct=round(progress * 100),
        stage=stage_for(days, ref["cycle_days"]),
        expected_harvest_date=planting_date + timedelta(days=ref["cycle_days"]),
    )
