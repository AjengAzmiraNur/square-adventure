"""Pembuatan akun siswa/guru (dipakai oleh endpoint guru dan skrip CLI)."""

from __future__ import annotations

import re
import secrets

from ..auth_provider import AuthError, derive_password, email_for_code
from ..repository import now_iso

CODE_PATTERN = re.compile(r"^[A-Z0-9-]{4,20}$")
_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"  # tanpa O/0/I/1 agar tidak tertukar


class AccountError(ValueError):
    pass


def generate_code(repo, prefix: str = "SA") -> str:
    for _ in range(20):
        code = f"{prefix}-{''.join(secrets.choice(_ALPHABET) for _ in range(6))}"
        if not repo.get_profile_by_code(code):
            return code
    raise AccountError("Gagal membuat kode unik. Coba lagi.")


def create_account(repo, auth, settings, *, full_name: str, class_name: str = "",
                   role: str = "student", code: str | None = None) -> dict:
    full_name = (full_name or "").strip()
    if not 2 <= len(full_name) <= 80:
        raise AccountError("Nama harus 2–80 karakter.")
    if role not in ("student", "teacher"):
        raise AccountError("Peran tidak valid.")
    code = re.sub(r"\s+", "", code or "").upper() or generate_code(repo, "GURU" if role == "teacher" else "SA")
    if not CODE_PATTERN.match(code):
        raise AccountError("Kode harus 4–20 karakter: huruf kapital, angka, atau tanda hubung.")
    if repo.get_profile_by_code(code):
        raise AccountError("Kode tersebut sudah dipakai.")

    try:
        user_id = auth.create_user(email_for_code(code, settings.student_email_domain),
                                   derive_password(settings.student_password_secret, code),
                                   {"full_name": full_name, "role": role})
    except AuthError as exc:
        raise AccountError(str(exc)) from exc
    try:
        profile = repo.insert_profile({"id": user_id, "full_name": full_name, "student_code": code,
                                       "class_name": (class_name or "").strip()[:20], "role": role,
                                       "is_active": True, "created_at": now_iso()})
        repo.upsert_stats(user_id, {"total_xp": 0, "level": 1, "lessons_completed": 0,
                                    "games_played": 0, "quizzes_completed": 0, "stars": 0})
    except Exception:
        auth.delete_user(user_id)
        raise
    return profile
