from __future__ import annotations

import re
import threading
import time
from collections import defaultdict, deque

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel

from ..auth_provider import AuthError, derive_password, email_for_code
from ..deps import get_auth, get_repo
from ..repository import now_iso
from ..services.accounts import CODE_PATTERN

router = APIRouter(prefix="/api/auth", tags=["auth"])

def normalize_code(raw: str) -> str:
    return re.sub(r"\s+", "", raw or "").upper()


class LoginBody(BaseModel):
    code: str = ""


class _RateLimiter:
    def __init__(self):
        self.hits: dict[str, deque] = defaultdict(deque)
        self.lock = threading.Lock()

    def allow(self, key: str, limit: int, window: float = 60.0) -> bool:
        now = time.monotonic()
        with self.lock:
            q = self.hits[key]
            while q and now - q[0] > window:
                q.popleft()
            if len(q) >= limit:
                return False
            q.append(now)
            return True


limiter = _RateLimiter()


@router.post("/login")
def login(body: LoginBody, request: Request, repo=Depends(get_repo), auth=Depends(get_auth)):
    settings = request.app.state.settings
    code = normalize_code(body.code)
    if not code:
        raise HTTPException(422, "Kode siswa wajib diisi.")
    if not CODE_PATTERN.match(code):
        raise HTTPException(422, "Format kode tidak valid. Gunakan 4–20 huruf, angka, atau tanda hubung (-).")

    client_ip = request.client.host if request.client else "unknown"
    if not limiter.allow(client_ip, settings.login_rate_limit_per_minute):
        raise HTTPException(429, "Terlalu banyak percobaan masuk. Tunggu 1 menit lalu coba lagi.")

    profile = repo.get_profile_by_code(code)
    if not profile:
        raise HTTPException(401, "Kode siswa tidak terdaftar. Periksa kembali kodenya, ya.")
    if not profile.get("is_active", True):
        raise HTTPException(403, "Akun ini sedang dinonaktifkan. Hubungi guru.")

    try:
        session = auth.sign_in(email_for_code(code, settings.student_email_domain),
                               derive_password(settings.student_password_secret, code))
    except AuthError as exc:
        raise HTTPException(exc.status, str(exc)) from exc

    repo.log_activity({"user_id": profile["id"], "activity_type": "login", "title": "Masuk ke aplikasi",
                       "status": "success", "detail": {}, "created_at": now_iso()})
    return {
        "access_token": session["access_token"],
        "refresh_token": session["refresh_token"],
        "expires_in": session.get("expires_in"),
        "profile": {k: profile.get(k) for k in ("id", "full_name", "student_code", "class_name", "role")},
    }
