"""Membuat akun guru atau siswa dari terminal (memakai kredensial di backend/.env).

Contoh (dari folder backend):
    python -m scripts.create_user --name "Bu Guru" --role teacher --code GURU-01
    python -m scripts.create_user --name "Ajeng" --class 9A --code SA-9A-001
"""

from __future__ import annotations

import argparse
import sys

from app.auth_provider import SupabaseAuth
from app.config import get_settings
from app.repository import SupabaseRepository
from app.services.accounts import AccountError, create_account


def main() -> int:
    parser = argparse.ArgumentParser(description="Buat akun SQUARE ADVENTURE")
    parser.add_argument("--name", required=True)
    parser.add_argument("--class", dest="class_name", default="")
    parser.add_argument("--role", choices=["student", "teacher"], default="student")
    parser.add_argument("--code", default=None, help="Kode login (kosongkan untuk dibuat otomatis)")
    args = parser.parse_args()

    settings = get_settings()
    if not settings.is_configured:
        print("backend/.env belum lengkap. Lihat backend/.env.example.", file=sys.stderr)
        return 1
    repo = SupabaseRepository(settings.supabase_url, settings.supabase_service_role_key)
    auth = SupabaseAuth(settings.supabase_url, settings.supabase_anon_key, settings.supabase_service_role_key)
    try:
        profile = create_account(repo, auth, settings, full_name=args.name, class_name=args.class_name,
                                 role=args.role, code=args.code)
    except AccountError as exc:
        print(f"Gagal: {exc}", file=sys.stderr)
        return 1
    print(f"Akun dibuat: {profile['full_name']} ({profile['role']}) — kode login: {profile['student_code']}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
