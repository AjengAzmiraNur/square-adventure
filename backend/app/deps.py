from __future__ import annotations

from fastapi import Depends, HTTPException, Request


def get_repo(request: Request):
    repo = request.app.state.repo
    if repo is None:
        raise HTTPException(503, "Backend belum dikonfigurasi. Isi kredensial Supabase pada file backend/.env.")
    return repo


def get_auth(request: Request):
    auth = request.app.state.auth
    if auth is None:
        raise HTTPException(503, "Backend belum dikonfigurasi. Isi kredensial Supabase pada file backend/.env.")
    return auth


def current_user(request: Request, repo=Depends(get_repo), auth=Depends(get_auth)) -> dict:
    from .auth_provider import AuthError

    header = request.headers.get("Authorization", "")
    if not header.lower().startswith("bearer "):
        raise HTTPException(401, "Silakan masuk terlebih dahulu.")
    token = header.split(" ", 1)[1].strip()
    try:
        user = auth.get_user(token)
    except AuthError as exc:
        raise HTTPException(exc.status, str(exc)) from exc
    profile = repo.get_profile(user["id"])
    if not profile:
        raise HTTPException(403, "Profil siswa tidak ditemukan.")
    if not profile.get("is_active", True):
        raise HTTPException(403, "Akun ini sedang dinonaktifkan. Hubungi guru.")
    return profile


def teacher_user(profile: dict = Depends(current_user)) -> dict:
    if profile.get("role") != "teacher":
        raise HTTPException(403, "Halaman ini khusus guru.")
    return profile
