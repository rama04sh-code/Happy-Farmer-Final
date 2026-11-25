from datetime import date

import pytest

from app.services.diagnosis import interpret
from app.services.knowledge import KB, SUPPORTED_CROPS, canonical_crop
from app.services.yield_estimate import estimate, stage_for


def test_canonical_crop():
    assert canonical_crop("بندورة") == "tomato"
    assert canonical_crop("طماطم") == "tomato"
    assert canonical_crop("بطاطس") == "potato"
    assert canonical_crop("فلفل حار") == "pepper"
    assert canonical_crop("خيار") is None


def test_knowledge_base_complete():
    for label, e in KB.items():
        assert e["crop"] in SUPPORTED_CROPS and e["name_ar"] and e["description"] and e["advice"], label
    for crop in SUPPORTED_CROPS:
        assert any(e["crop"] == crop and e["healthy"] for e in KB.values()), crop


def test_interpret_cases():
    assert interpret([("Potato___healthy", 0.9)], "potato", 0.6).status == "healthy"
    assert interpret([("Potato___Late_blight", 0.9)], "potato", 0.6).severity == "critical"
    assert interpret([("Potato___Late_blight", 0.4)], "potato", 0.6).status == "uncertain"
    assert interpret([("Tomato___healthy", 0.99)], "potato", 0.6).status == "uncertain"
    assert interpret([("Potato___Unknown_new", 0.9)], "potato", 0.6).status == "disease"


def test_yield_estimate_and_stage():
    e = estimate("طماطم", 3, date(2026, 6, 1), today=date(2026, 7, 1))
    assert e.estimated_kg == 12000 and e.progress_pct == 25 and e.stage == "منتصف الموسم"
    assert e.expected_harvest_date == date(2026, 9, 29)
    assert stage_for(-3, 120) == "لم يبدأ الموسم بعد"
    assert stage_for(500, 120) == "تجاوز مدة الموسم المرجعية"
    with pytest.raises(ValueError):
        estimate("طماطم", None, date(2026, 6, 1))
    with pytest.raises(ValueError):
        estimate("خيار", 2, date(2026, 6, 1))
