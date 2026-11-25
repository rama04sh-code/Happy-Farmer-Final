from tests.conftest import register_and_login


def test_register_duplicate_and_short_password(client):
    body = {"name": "أحمد", "email": "x@test.com", "password": "password123"}
    assert client.post("/api/auth/register", json=body).status_code == 201
    assert client.post("/api/auth/register", json=body).status_code == 409
    bad = {**body, "email": "y@test.com", "password": "123"}
    assert client.post("/api/auth/register", json=bad).status_code == 422


def test_login_wrong_password(client):
    register_and_login(client)
    r = client.post("/api/auth/login", data={"username": "a@test.com", "password": "wrong-pass"})
    assert r.status_code == 401


def test_farm_and_crop_flow(client):
    h = register_and_login(client)
    farm = client.post("/api/farms", json={"name": "مزرعة الوادي"}, headers=h).json()
    r = client.post(f"/api/farms/{farm['id']}/crops",
                    json={"name": "طماطم", "planting_date": "2026-03-01"}, headers=h)
    assert r.status_code == 201
    assert len(client.get(f"/api/farms/{farm['id']}/crops", headers=h).json()) == 1


def test_farmer_cannot_access_other_farm(client):
    h1 = register_and_login(client, "a@test.com")
    h2 = register_and_login(client, "b@test.com")
    farm = client.post("/api/farms", json={"name": "مزرعة أ"}, headers=h1).json()
    assert client.get(f"/api/farms/{farm['id']}", headers=h2).status_code == 404
    assert client.get(f"/api/farms/{farm['id']}/crops", headers=h2).status_code == 404


def test_requires_auth(client):
    assert client.get("/api/farms").status_code == 401
