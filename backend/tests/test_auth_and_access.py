from app.routers.auth import limiter


def test_login_valid_code(env):
    r = env["client"].post("/api/auth/login", json={"code": " sa-test-01 "})
    assert r.status_code == 200
    body = r.json()
    assert body["access_token"] and body["refresh_token"]
    assert body["profile"]["full_name"] == "Siswa Satu"
    assert body["profile"]["student_code"] == "SA-TEST-01"


def test_login_unregistered_code(env):
    r = env["client"].post("/api/auth/login", json={"code": "SA-NOPE-99"})
    assert r.status_code == 401
    assert "tidak terdaftar" in r.json()["detail"]


def test_login_empty_and_bad_format(env):
    c = env["client"]
    assert c.post("/api/auth/login", json={"code": ""}).status_code == 422
    assert c.post("/api/auth/login", json={"code": "ab"}).status_code == 422
    assert c.post("/api/auth/login", json={"code": "SA_01;drop"}).status_code == 422


def test_login_inactive_account(env, teacher):
    c = env["client"]
    sid = env["repo"].get_profile_by_code("SA-TEST-02")["id"]
    assert c.patch(f"/api/admin/students/{sid}", json={"is_active": False}, headers=teacher).status_code == 200
    assert c.post("/api/auth/login", json={"code": "SA-TEST-02"}).status_code == 403


def test_rate_limit(env):
    env["client"].app.state.settings.login_rate_limit_per_minute = 3
    limiter.hits.clear()
    codes = [env["client"].post("/api/auth/login", json={"code": "SA-NOPE-99"}).status_code for _ in range(4)]
    assert codes == [401, 401, 401, 429]


def test_protected_endpoints_require_session(env):
    c = env["client"]
    assert c.post("/api/lessons/kenali-polanya/start").status_code == 401
    assert c.post("/api/quizzes/start", json={"quiz_slug": "training-beginner"},
                  headers={"Authorization": "Bearer palsu"}).status_code == 401


def test_teacher_only_admin(env, student, teacher):
    c = env["client"]
    assert c.get("/api/admin/students", headers=student).status_code == 403
    r = c.get("/api/admin/students", headers=teacher)
    assert r.status_code == 200
    assert {s["student_code"] for s in r.json()["students"]} == {"SA-TEST-01", "SA-TEST-02"}


def test_teacher_adds_student_who_can_login(env, teacher):
    c = env["client"]
    r = c.post("/api/admin/students", json={"full_name": "Siswa Baru", "class_name": "9B"}, headers=teacher)
    assert r.status_code == 201, r.text
    code = r.json()["student"]["student_code"]
    assert code.startswith("SA-")
    assert c.post("/api/auth/login", json={"code": code}).status_code == 200
    dup = c.post("/api/admin/students", json={"full_name": "X Y", "student_code": code}, headers=teacher)
    assert dup.status_code == 422


def test_unconfigured_backend_returns_503(settings):
    from fastapi.testclient import TestClient

    from app.main import create_app

    c = TestClient(create_app(settings))
    assert c.get("/api/health").json()["configured"] is False
    assert c.post("/api/auth/login", json={"code": "SA-TEST-01"}).status_code == 503
