from tests.conftest import register_and_login


def make_farm(client, h, name="مزرعة"):
    return client.post("/api/farms", json={"name": name}, headers=h).json()["id"]


def test_normal_reading_no_notification(client):
    h = register_and_login(client)
    fid = make_farm(client, h)
    r = client.post(f"/api/farms/{fid}/readings", json={"soil_moisture": 55, "temperature": 24}, headers=h)
    assert r.status_code == 201
    assert client.get(f"/api/farms/{fid}/notifications", headers=h).json() == []
    assert client.get(f"/api/farms/{fid}/dashboard", headers=h).json()["status"] == "green"


def test_low_moisture_creates_one_notification(client):
    h = register_and_login(client)
    fid = make_farm(client, h)
    client.post(f"/api/farms/{fid}/readings", json={"soil_moisture": 15}, headers=h)
    client.post(f"/api/farms/{fid}/readings", json={"soil_moisture": 12}, headers=h)  # لا تكرار
    notes = client.get(f"/api/farms/{fid}/notifications", headers=h).json()
    assert len(notes) == 1
    assert notes[0]["severity"] == "critical"
    dash = client.get(f"/api/farms/{fid}/dashboard", headers=h).json()
    assert dash["status"] == "red" and dash["unread_notifications"] == 1


def test_mark_read_then_new_alert_allowed(client):
    h = register_and_login(client)
    fid = make_farm(client, h)
    client.post(f"/api/farms/{fid}/readings", json={"soil_moisture": 25}, headers=h)
    nid = client.get(f"/api/farms/{fid}/notifications", headers=h).json()[0]["id"]
    assert client.post(f"/api/notifications/{nid}/read", headers=h).json()["is_read"] is True
    client.post(f"/api/farms/{fid}/readings", json={"soil_moisture": 10}, headers=h)
    assert len(client.get(f"/api/farms/{fid}/notifications", headers=h).json()) == 2


def test_invalid_reading_rejected(client):
    h = register_and_login(client)
    fid = make_farm(client, h)
    assert client.post(f"/api/farms/{fid}/readings", json={"soil_moisture": 150}, headers=h).status_code == 422


def test_dashboard_unknown_without_readings(client):
    h = register_and_login(client)
    fid = make_farm(client, h)
    d = client.get(f"/api/farms/{fid}/dashboard", headers=h).json()
    assert d["status"] == "unknown" and d["latest_reading"] is None


def test_other_farmer_cannot_touch_data(client):
    h1 = register_and_login(client, "a@test.com")
    h2 = register_and_login(client, "b@test.com")
    fid = make_farm(client, h1)
    client.post(f"/api/farms/{fid}/readings", json={"soil_moisture": 10}, headers=h1)
    nid = client.get(f"/api/farms/{fid}/notifications", headers=h1).json()[0]["id"]
    assert client.get(f"/api/farms/{fid}/dashboard", headers=h2).status_code == 404
    assert client.post(f"/api/farms/{fid}/readings", json={"soil_moisture": 50}, headers=h2).status_code == 404
    assert client.post(f"/api/notifications/{nid}/read", headers=h2).status_code == 404
