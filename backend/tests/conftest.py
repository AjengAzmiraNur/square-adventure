import pytest
from fastapi.testclient import TestClient

from app.config import Settings
from app.main import create_app
from app.routers.auth import limiter
from app.services.accounts import create_account

from .fakes import FakeAuth, MemoryRepository


@pytest.fixture
def settings():
    return Settings(_env_file=None, supabase_url="", supabase_anon_key="", supabase_service_role_key="",
                    student_password_secret="test-secret", login_rate_limit_per_minute=100)


@pytest.fixture
def env(settings):
    limiter.hits.clear()
    repo = MemoryRepository()
    auth = FakeAuth()
    app = create_app(settings, repo=repo, auth_provider=auth)
    client = TestClient(app)
    create_account(repo, auth, settings, full_name="Siswa Satu", class_name="9A", code="SA-TEST-01")
    create_account(repo, auth, settings, full_name="Siswa Dua", class_name="9A", code="SA-TEST-02")
    create_account(repo, auth, settings, full_name="Bu Guru", role="teacher", code="GURU-01")
    return {"repo": repo, "auth": auth, "client": client, "settings": settings}


def login(client, code):
    r = client.post("/api/auth/login", json={"code": code})
    assert r.status_code == 200, r.text
    return {"Authorization": f"Bearer {r.json()['access_token']}"}


@pytest.fixture
def student(env):
    return login(env["client"], "SA-TEST-01")


@pytest.fixture
def student2(env):
    return login(env["client"], "SA-TEST-02")


@pytest.fixture
def teacher(env):
    return login(env["client"], "GURU-01")
