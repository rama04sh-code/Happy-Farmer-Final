import io

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.config import settings
from app.db import Base, get_db
from app.main import app
from app.routers.crops import classifier_dep


@pytest.fixture(autouse=True)
def isolated_uploads(tmp_path, monkeypatch):
    monkeypatch.setattr(settings, "upload_dir", str(tmp_path / "uploads"))


@pytest.fixture()
def client():
    engine = create_engine("sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)
    Base.metadata.create_all(engine)
    Session = sessionmaker(bind=engine, autoflush=False)

    def override():
        db = Session()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override
    yield TestClient(app)
    app.dependency_overrides.clear()


class FakeClassifier:
    version = "test-model"

    def __init__(self):
        self.result = [("Tomato___Early_blight", 0.93), ("Tomato___healthy", 0.04)]

    def predict(self, image, crop_key=None):
        return self.result


@pytest.fixture()
def fake_clf(client):
    clf = FakeClassifier()
    app.dependency_overrides[classifier_dep] = lambda: clf
    return clf


def register_and_login(client, email="a@test.com", password="password123"):
    client.post("/api/auth/register", json={"name": "مزارع", "email": email, "password": password})
    r = client.post("/api/auth/login", data={"username": email, "password": password})
    return {"Authorization": f"Bearer {r.json()['access_token']}"}


def make_image(fmt="PNG", size=(64, 64), color=(30, 140, 40)) -> bytes:
    from PIL import Image

    buf = io.BytesIO()
    Image.new("RGB", size, color).save(buf, format=fmt)
    return buf.getvalue()
