from app.core.config import settings
from app.services.yield_estimate import REFERENCE
from tests.conftest import make_image, register_and_login


def setup_crop(client, h, name="طماطم", area=2):
    fid = client.post("/api/farms", json={"name": "مزرعة"}, headers=h).json()["id"]
    body = {"name": name, "planting_date": "2026-08-01"}
    if area is not None:
        body["area_dunum"] = area
    cid = client.post(f"/api/farms/{fid}/crops", json=body, headers=h).json()["id"]
    return fid, cid


def upload(client, h, cid, data=None, name="leaf.png", ctype="image/png"):
    return client.post(f"/api/crops/{cid}/diagnoses", headers=h,
                       files={"file": (name, data if data is not None else make_image(), ctype)})


# ---------- التشخيص ----------
def test_disease_diagnosis_creates_notification(client, fake_clf):
    h = register_and_login(client)
    fid, cid = setup_crop(client, h)
    r = upload(client, h, cid)
    assert r.status_code == 201
    d = r.json()
    assert d["status"] == "disease" and d["disease_name"] == "اللفحة المبكرة"
    assert d["confidence"] == 0.93 and d["is_demo"] is False
    assert "الإرشاد الأولي" in d["recommendation"]
    notes = client.get(f"/api/farms/{fid}/notifications", headers=h).json()
    assert len(notes) == 1 and notes[0]["type"] == "disease"


def test_late_blight_is_critical(client, fake_clf):
    fake_clf.result = [("Tomato___Late_blight", 0.9)]
    h = register_and_login(client)
    fid, cid = setup_crop(client, h)
    upload(client, h, cid)
    assert client.get(f"/api/farms/{fid}/notifications", headers=h).json()[0]["severity"] == "critical"


def test_healthy_has_no_notification(client, fake_clf):
    fake_clf.result = [("Tomato___healthy", 0.97)]
    h = register_and_login(client)
    fid, cid = setup_crop(client, h)
    assert upload(client, h, cid).json()["status"] == "healthy"
    assert client.get(f"/api/farms/{fid}/notifications", headers=h).json() == []


def test_low_confidence_is_uncertain(client, fake_clf):
    fake_clf.result = [("Tomato___Early_blight", settings.diagnosis_min_confidence - 0.1)]
    h = register_and_login(client)
    fid, cid = setup_crop(client, h)
    assert upload(client, h, cid).json()["status"] == "uncertain"
    assert client.get(f"/api/farms/{fid}/notifications", headers=h).json() == []


def test_wrong_crop_prediction_is_uncertain(client, fake_clf):
    h = register_and_login(client)
    _, cid = setup_crop(client, h, name="بطاطا")  # النموذج الوهمي يرجع صنف طماطم
    assert upload(client, h, cid).json()["status"] == "uncertain"


def test_unsupported_crop_rejected(client, fake_clf):
    h = register_and_login(client)
    _, cid = setup_crop(client, h, name="خيار")
    assert upload(client, h, cid).status_code == 422


def test_not_an_image_rejected(client, fake_clf):
    h = register_and_login(client)
    _, cid = setup_crop(client, h)
    assert upload(client, h, cid, data=b"this is not an image", name="x.jpg", ctype="image/jpeg").status_code == 400


def test_oversize_rejected(client, fake_clf, monkeypatch):
    monkeypatch.setattr(settings, "max_upload_mb", 1)
    h = register_and_login(client)
    _, cid = setup_crop(client, h)
    big = b"\x89PNG\r\n\x1a\n" + b"0" * (1024 * 1024 + 10)
    assert upload(client, h, cid, data=big).status_code == 413


def test_jpeg_upload_ok(client, fake_clf):
    h = register_and_login(client)
    _, cid = setup_crop(client, h)
    assert upload(client, h, cid, data=make_image("JPEG"), name="a.jpg", ctype="image/jpeg").status_code == 201


def test_model_unavailable_returns_503(client, monkeypatch):
    monkeypatch.setattr(settings, "model_path", "does/not/exist.pt")
    monkeypatch.setattr(settings, "diagnosis_demo_mode", False)
    h = register_and_login(client)
    _, cid = setup_crop(client, h)
    assert upload(client, h, cid).status_code == 503


def test_image_served_only_to_owner(client, fake_clf):
    h1 = register_and_login(client, "a@test.com")
    h2 = register_and_login(client, "b@test.com")
    _, cid = setup_crop(client, h1)
    d = upload(client, h1, cid).json()
    r = client.get(d["image_url"], headers=h1)
    assert r.status_code == 200 and r.headers["content-type"] == "image/jpeg" and r.content[:2] == b"\xff\xd8"
    assert client.get(d["image_url"], headers=h2).status_code == 404
    assert client.get(d["image_url"]).status_code == 401


def test_other_farmer_cannot_diagnose_or_list(client, fake_clf):
    h1 = register_and_login(client, "a@test.com")
    h2 = register_and_login(client, "b@test.com")
    _, cid = setup_crop(client, h1)
    assert upload(client, h2, cid).status_code == 404
    assert client.get(f"/api/crops/{cid}/diagnoses", headers=h2).status_code == 404
    assert client.get(f"/api/crops/{cid}", headers=h2).status_code == 404


def test_diagnosis_history_newest_first(client, fake_clf):
    h = register_and_login(client)
    _, cid = setup_crop(client, h)
    a = upload(client, h, cid).json()["id"]
    b = upload(client, h, cid).json()["id"]
    ids = [d["id"] for d in client.get(f"/api/crops/{cid}/diagnoses", headers=h).json()]
    assert ids == [b, a]


# ---------- توقع الإنتاج ----------
def test_yield_prediction(client):
    h = register_and_login(client)
    _, cid = setup_crop(client, h, area=2)
    r = client.post(f"/api/crops/{cid}/yield-prediction", headers=h)
    assert r.status_code == 201
    y = r.json()
    expected = 2 * REFERENCE["tomato"]["yield_kg_per_dunum"]
    assert y["estimated_kg"] == expected and y["low_kg"] < expected < y["high_kg"]
    assert y["disclaimer"] and y["stage"]
    hist = client.get(f"/api/crops/{cid}/yield-predictions", headers=h).json()
    assert len(hist) == 1 and hist[0]["estimated_kg"] == expected


def test_yield_requires_area(client):
    h = register_and_login(client)
    _, cid = setup_crop(client, h, area=None)
    assert client.post(f"/api/crops/{cid}/yield-prediction", headers=h).status_code == 422


def test_yield_unknown_crop(client):
    h = register_and_login(client)
    _, cid = setup_crop(client, h, name="خيار")
    assert client.post(f"/api/crops/{cid}/yield-prediction", headers=h).status_code == 422


def test_yield_other_farmer_blocked(client):
    h1 = register_and_login(client, "a@test.com")
    h2 = register_and_login(client, "b@test.com")
    _, cid = setup_crop(client, h1)
    assert client.post(f"/api/crops/{cid}/yield-prediction", headers=h2).status_code == 404
