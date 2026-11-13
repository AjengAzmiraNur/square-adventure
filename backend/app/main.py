"""SQUARE ADVENTURE — backend FastAPI.

Tugas backend:
- login kode siswa → sesi Supabase Auth resmi,
- penilaian latihan/evaluasi/permainan di server (kunci jawaban tidak dikirim ke browser),
- pemberian XP, level, bintang, dan lencana (tidak bisa dimanipulasi dari frontend),
- pengelolaan data siswa oleh guru.
"""

from __future__ import annotations

import logging
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

from .config import Settings, get_settings
from .repository import RepositoryError
from .routers import admin, auth, games, lessons, quizzes

log = logging.getLogger("square_adventure")


def create_app(settings: Settings | None = None, *, repo=None, auth_provider=None) -> FastAPI:
    settings = settings or get_settings()
    app = FastAPI(title="SQUARE ADVENTURE API", version="1.0.0")
    app.state.settings = settings

    if repo is None and auth_provider is None and settings.is_configured:
        from .auth_provider import SupabaseAuth
        from .repository import SupabaseRepository

        repo = SupabaseRepository(settings.supabase_url, settings.supabase_service_role_key)
        auth_provider = SupabaseAuth(settings.supabase_url, settings.supabase_anon_key,
                                     settings.supabase_service_role_key)
    elif repo is None:
        log.warning("Supabase belum dikonfigurasi: endpoint data akan mengembalikan 503.")
    app.state.repo = repo
    app.state.auth = auth_provider

    app.add_middleware(CORSMiddleware, allow_origins=settings.cors_origin_list, allow_credentials=False,
                       allow_methods=["GET", "POST", "PATCH", "OPTIONS"],
                       allow_headers=["Authorization", "Content-Type"])

    @app.exception_handler(RepositoryError)
    async def repository_error(_request: Request, exc: RepositoryError):
        log.error("Repository error: %s", exc)
        return JSONResponse(status_code=502, content={"detail": "Gagal menghubungi database. Coba lagi sebentar lagi."})

    @app.get("/api/health")
    def health():
        return {"status": "ok", "app": "SQUARE ADVENTURE", "configured": app.state.repo is not None}

    for r in (auth.router, lessons.router, quizzes.router, games.router, admin.router):
        app.include_router(r)

    # Sajikan hasil build frontend (frontend/dist) dari server yang sama, sehingga
    # di laptop cukup menjalankan satu server: http://localhost:8000
    dist = Path(__file__).resolve().parents[2] / "frontend" / "dist"
    if dist.is_dir():
        app.mount("/", StaticFiles(directory=dist, html=True), name="frontend")
    return app


app = create_app()
