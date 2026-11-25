from app.core.config import settings
from .conftest import make_image, register_and_login


def test_login_attempts_are_rate_limited(client, monkeypatch):
    monkeypatch.setattr(settings, "login_max_attempts", 2)
    monkeypatch.setattr(settings, "login_window_minutes", 15)
    client.post("/api/auth/register", json={"name": "مزارع", "email": "limit@test.com", "password": "password123"})

    first = client.post("/api/auth/login", data={"username": "limit@test.com", "password": "wrong-pass"})
    second = client.post("/api/auth/login", data={"username": "limit@test.com", "password": "wrong-pass"})
    client.post("/api/auth/register", json={"name": "مزارع آخر", "email": "other-limit@test.com", "password": "password123"})
    other_login = client.post("/api/auth/login", data={"username": "other-limit@test.com", "password": "password123"})
    third = client.post("/api/auth/login", data={"username": "limit@test.com", "password": "password123"})

    assert first.status_code == 401
    assert second.status_code == 401
    assert other_login.status_code == 200  # one account's failures do not lock out every user behind a shared IP
    assert third.status_code == 429
    assert third.headers.get("Retry-After") == "900"


def test_change_password_invalidates_existing_session(client):
    headers = register_and_login(client, "change@test.com")
    changed = client.patch("/api/auth/password", headers=headers,
                           json={"current_password": "password123", "new_password": "newpassword456"})
    assert changed.status_code == 200
    assert client.get("/api/auth/me", headers=headers).status_code == 401

    new_login = client.post("/api/auth/login", data={"username": "change@test.com", "password": "newpassword456"})
    assert new_login.status_code == 200


def test_password_reset_token_is_single_use(client, monkeypatch):
    sent = {}

    def fake_send(recipient, token):
        sent["recipient"] = recipient
        sent["token"] = token
        return True

    monkeypatch.setattr("app.routers.auth.send_password_reset_email", fake_send)
    client.post("/api/auth/register", json={"name": "مزارع", "email": "reset@test.com", "password": "password123"})

    request = client.post("/api/auth/password-reset/request", json={"email": "reset@test.com"})
    assert request.status_code == 200
    assert sent["recipient"] == "reset@test.com"

    confirm = client.post("/api/auth/password-reset/confirm", json={
        "token": sent["token"], "new_password": "updatedpassword789",
    })
    assert confirm.status_code == 200
    reused = client.post("/api/auth/password-reset/confirm", json={
        "token": sent["token"], "new_password": "anotherpassword789",
    })
    assert reused.status_code == 400

    login = client.post("/api/auth/login", data={"username": "reset@test.com", "password": "updatedpassword789"})
    assert login.status_code == 200


def test_deleting_crop_removes_attached_diagnosis_images(client, fake_clf, tmp_path):
    headers = register_and_login(client, "delete-crop@test.com")
    farm = client.post("/api/farms", headers=headers, json={"name": "مزرعة التجربة"}).json()
    crop = client.post(f"/api/farms/{farm['id']}/crops", headers=headers,
                       json={"name": "Tomato", "planting_date": "2026-01-01"}).json()
    diagnosis = client.post(f"/api/crops/{crop['id']}/diagnoses", headers=headers,
                            files={"file": ("leaf.png", make_image(), "image/png")})
    assert diagnosis.status_code == 201
    image_dir = tmp_path / "uploads" / "diagnoses"
    assert len(list(image_dir.glob("*.jpg"))) == 1

    deleted = client.delete(f"/api/crops/{crop['id']}", headers=headers)
    assert deleted.status_code == 204
    assert list(image_dir.glob("*.jpg")) == []
    assert client.get(f"/api/crops/{crop['id']}", headers=headers).status_code == 404


def test_deleting_diagnosis_removes_image(client, fake_clf, tmp_path):
    headers = register_and_login(client, "delete-diag@test.com")
    farm = client.post("/api/farms", headers=headers, json={"name": "مزرعة الصور"}).json()
    crop = client.post(f"/api/farms/{farm['id']}/crops", headers=headers,
                       json={"name": "Tomato", "planting_date": "2026-01-01"}).json()
    diagnosis = client.post(f"/api/crops/{crop['id']}/diagnoses", headers=headers,
                            files={"file": ("leaf.png", make_image(), "image/png")}).json()
    image_dir = tmp_path / "uploads" / "diagnoses"
    saved = list(image_dir.glob("*.jpg"))
    assert len(saved) == 1

    deleted = client.delete(f"/api/diagnoses/{diagnosis['id']}", headers=headers)
    assert deleted.status_code == 204
    assert not saved[0].exists()


def test_deleting_farm_removes_attached_files(client, fake_clf, tmp_path):
    headers = register_and_login(client, "delete-farm@test.com")
    farm = client.post("/api/farms", headers=headers, json={"name": "مزرعة للحذف"}).json()
    crop = client.post(f"/api/farms/{farm['id']}/crops", headers=headers,
                       json={"name": "Tomato", "planting_date": "2026-01-01"}).json()
    diagnosis = client.post(f"/api/crops/{crop['id']}/diagnoses", headers=headers,
                            files={"file": ("leaf.png", make_image(), "image/png")})
    assert diagnosis.status_code == 201
    image_dir = tmp_path / "uploads" / "diagnoses"
    saved = list(image_dir.glob("*.jpg"))
    assert len(saved) == 1

    deleted = client.delete(f"/api/farms/{farm['id']}", headers=headers)
    assert deleted.status_code == 204
    assert not saved[0].exists()
    assert client.get(f"/api/farms/{farm['id']}", headers=headers).status_code == 404


def test_other_farmer_cannot_delete_resources(client):
    owner_headers = register_and_login(client, "delete-owner@test.com")
    other_headers = register_and_login(client, "delete-other@test.com")
    farm = client.post("/api/farms", headers=owner_headers, json={"name": "مزرعة محمية"}).json()
    crop = client.post(f"/api/farms/{farm['id']}/crops", headers=owner_headers,
                       json={"name": "Tomato", "planting_date": "2026-01-01"}).json()

    assert client.delete(f"/api/farms/{farm['id']}", headers=other_headers).status_code == 404
    assert client.delete(f"/api/crops/{crop['id']}", headers=other_headers).status_code == 404
    assert client.get(f"/api/crops/{crop['id']}", headers=owner_headers).status_code == 200
