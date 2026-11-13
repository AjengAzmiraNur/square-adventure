"""Integrasi Supabase Auth (GoTrue).

Alur login kode siswa:
1. Backend memastikan kode terdaftar dan aktif di tabel profiles.
2. Backend menurunkan password akun Supabase dari kode siswa memakai HMAC-SHA256
   dengan STUDENT_PASSWORD_SECRET (rahasia server, tidak pernah dikirim ke frontend).
3. Backend login ke Supabase Auth dan mengembalikan sesi resmi (access/refresh token).
4. Frontend memasang sesi itu ke supabase-js; seluruh akses data dibatasi RLS.
"""

from __future__ import annotations

import hashlib
import hmac
import time

import httpx


class AuthError(RuntimeError):
    def __init__(self, message: str, status: int = 401):
        super().__init__(message)
        self.status = status


def derive_password(secret: str, code: str) -> str:
    digest = hmac.new(secret.encode(), code.encode(), hashlib.sha256).hexdigest()
    return f"Sa!{digest[:40]}"


def email_for_code(code: str, domain: str) -> str:
    return f"{code.lower()}@{domain}"


class SupabaseAuth:
    def __init__(self, url: str, anon_key: str, service_key: str, client: httpx.Client | None = None):
        self.base = url.rstrip("/") + "/auth/v1"
        self.anon_key = anon_key
        self.service_key = service_key
        self.client = client or httpx.Client(timeout=15.0)
        self._cache: dict[str, tuple[float, dict]] = {}

    def _admin_headers(self) -> dict[str, str]:
        headers = {"apikey": self.service_key}
        if self.service_key.startswith("eyJ"):
            headers["Authorization"] = f"Bearer {self.service_key}"
        return headers

    def sign_in(self, email: str, password: str) -> dict:
        resp = self.client.post(f"{self.base}/token", params={"grant_type": "password"},
                                json={"email": email, "password": password},
                                headers={"apikey": self.anon_key})
        if resp.status_code == 400:
            raise AuthError("Akun siswa belum siap. Hubungi guru untuk mendaftarkan ulang kode.")
        if resp.status_code >= 400:
            raise AuthError("Layanan login sedang bermasalah. Coba lagi sebentar lagi.", status=503)
        return resp.json()

    def get_user(self, access_token: str) -> dict:
        cached = self._cache.get(access_token)
        if cached and cached[0] > time.time():
            return cached[1]
        resp = self.client.get(f"{self.base}/user", headers={"apikey": self.anon_key,
                                                             "Authorization": f"Bearer {access_token}"})
        if resp.status_code != 200:
            raise AuthError("Sesi tidak valid atau sudah berakhir. Silakan masuk kembali.")
        user = resp.json()
        if len(self._cache) > 2000:
            self._cache.clear()
        self._cache[access_token] = (time.time() + 60, user)
        return user

    def create_user(self, email: str, password: str, metadata: dict | None = None) -> str:
        resp = self.client.post(f"{self.base}/admin/users", headers=self._admin_headers(),
                                json={"email": email, "password": password, "email_confirm": True,
                                      "user_metadata": metadata or {}})
        if resp.status_code >= 400:
            raise AuthError(f"Gagal membuat akun Supabase: {resp.text[:200]}", status=400)
        return resp.json()["id"]

    def delete_user(self, user_id: str) -> None:
        self.client.delete(f"{self.base}/admin/users/{user_id}", headers=self._admin_headers())
