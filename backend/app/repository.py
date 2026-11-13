"""Lapisan akses data Supabase (PostgREST) menggunakan Service Role Key.

Service Role Key HANYA berada di backend. Frontend memakai anon key dan dibatasi RLS.
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

import httpx


class RepositoryError(RuntimeError):
    pass


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _service_headers(key: str) -> dict[str, str]:
    headers = {"apikey": key, "Content-Type": "application/json"}
    # Kunci legacy berbentuk JWT dikirim juga sebagai Bearer. Kunci baru (sb_secret_...)
    # cukup melalui header apikey.
    if key.startswith("eyJ"):
        headers["Authorization"] = f"Bearer {key}"
    return headers


class SupabaseRepository:
    def __init__(self, url: str, service_key: str, client: httpx.Client | None = None):
        self.base = url.rstrip("/") + "/rest/v1"
        self.client = client or httpx.Client(timeout=15.0, headers=_service_headers(service_key))

    # ---------------------------------------------------------------- helpers
    def _check(self, resp: httpx.Response) -> Any:
        if resp.status_code >= 400:
            raise RepositoryError(f"Supabase error {resp.status_code}: {resp.text[:300]}")
        if not resp.content:
            return None
        return resp.json()

    def _select(self, table: str, params: dict[str, str]) -> list[dict]:
        return self._check(self.client.get(f"{self.base}/{table}", params=params)) or []

    def _one(self, table: str, params: dict[str, str]) -> dict | None:
        rows = self._select(table, {**params, "limit": "1"})
        return rows[0] if rows else None

    def _insert(self, table: str, row: dict | list, *, prefer: str = "return=representation",
                on_conflict: str | None = None) -> list[dict]:
        params = {"on_conflict": on_conflict} if on_conflict else None
        resp = self.client.post(f"{self.base}/{table}", json=row, params=params, headers={"Prefer": prefer})
        return self._check(resp) or []

    def _update(self, table: str, params: dict[str, str], fields: dict) -> list[dict]:
        resp = self.client.patch(f"{self.base}/{table}", params=params, json=fields,
                                 headers={"Prefer": "return=representation"})
        return self._check(resp) or []

    # ---------------------------------------------------------------- profiles
    def get_profile(self, user_id: str) -> dict | None:
        return self._one("profiles", {"id": f"eq.{user_id}", "select": "*"})

    def get_profile_by_code(self, code: str) -> dict | None:
        return self._one("profiles", {"student_code": f"eq.{code}", "select": "*"})

    def list_students(self) -> list[dict]:
        return self._select("profiles", {"select": "*,user_stats(total_xp,level,lessons_completed,games_played)",
                                         "role": "eq.student", "order": "class_name.asc,full_name.asc"})

    def insert_profile(self, row: dict) -> dict:
        return self._insert("profiles", row)[0]

    def update_profile(self, user_id: str, fields: dict) -> dict | None:
        rows = self._update("profiles", {"id": f"eq.{user_id}"}, fields)
        return rows[0] if rows else None

    # ---------------------------------------------------------------- catalog
    def list_lessons(self) -> list[dict]:
        return self._select("lessons", {"select": "*", "order": "level.asc"})

    def get_lesson(self, slug: str) -> dict | None:
        return self._one("lessons", {"slug": f"eq.{slug}", "select": "*"})

    def get_quiz(self, slug: str) -> dict | None:
        return self._one("quizzes", {"slug": f"eq.{slug}", "select": "*"})

    def get_quiz_by_id(self, quiz_id: str) -> dict | None:
        return self._one("quizzes", {"id": f"eq.{quiz_id}", "select": "*"})

    def list_questions(self, quiz_id: str) -> list[dict]:
        return self._select("quiz_questions", {"quiz_id": f"eq.{quiz_id}", "select": "*", "order": "position.asc"})

    def get_questions(self, ids: list[str]) -> list[dict]:
        if not ids:
            return []
        return self._select("quiz_questions", {"id": f"in.({','.join(ids)})", "select": "*"})

    def get_game(self, slug: str) -> dict | None:
        return self._one("games", {"slug": f"eq.{slug}", "select": "*"})

    def list_games(self) -> list[dict]:
        return self._select("games", {"select": "*"})

    def list_achievements(self) -> list[dict]:
        return self._select("achievements", {"select": "*", "order": "sort_order.asc"})

    # ---------------------------------------------------------------- lessons
    def list_lesson_progress(self, user_id: str) -> list[dict]:
        return self._select("lesson_progress", {"user_id": f"eq.{user_id}", "select": "*"})

    def start_lesson(self, user_id: str, lesson_id: str) -> None:
        self._insert("lesson_progress",
                     {"user_id": user_id, "lesson_id": lesson_id, "status": "in_progress",
                      "started_at": now_iso(), "updated_at": now_iso()},
                     prefer="resolution=ignore-duplicates,return=minimal", on_conflict="user_id,lesson_id")

    def complete_lesson(self, user_id: str, lesson_id: str, check_score: int) -> bool:
        """Tandai selesai. True hanya jika baru selesai sekarang (mencegah XP ganda)."""
        now = now_iso()
        fields = {"status": "completed", "check_score": check_score, "completed_at": now, "updated_at": now}
        changed = self._update("lesson_progress", {"user_id": f"eq.{user_id}", "lesson_id": f"eq.{lesson_id}",
                                                   "status": "neq.completed"}, fields)
        if changed:
            return True
        inserted = self._insert("lesson_progress", {"user_id": user_id, "lesson_id": lesson_id,
                                                    "started_at": now, **fields},
                                prefer="resolution=ignore-duplicates,return=representation",
                                on_conflict="user_id,lesson_id")
        return bool(inserted)

    # ---------------------------------------------------------------- quizzes
    def create_quiz_attempt(self, row: dict) -> dict:
        return self._insert("quiz_attempts", row)[0]

    def get_quiz_attempt(self, attempt_id: str) -> dict | None:
        return self._one("quiz_attempts", {"id": f"eq.{attempt_id}", "select": "*"})

    def update_quiz_attempt(self, attempt_id: str, fields: dict, *, only_status: str | None = None) -> dict | None:
        params = {"id": f"eq.{attempt_id}"}
        if only_status:
            params["status"] = f"eq.{only_status}"
        rows = self._update("quiz_attempts", params, fields)
        return rows[0] if rows else None

    def list_quiz_attempts(self, user_id: str, quiz_id: str | None = None,
                           status: str | None = None) -> list[dict]:
        params = {"user_id": f"eq.{user_id}", "select": "*", "order": "started_at.desc"}
        if quiz_id:
            params["quiz_id"] = f"eq.{quiz_id}"
        if status:
            params["status"] = f"eq.{status}"
        return self._select("quiz_attempts", params)

    # ---------------------------------------------------------------- games
    def create_game_session(self, row: dict) -> dict:
        return self._insert("game_sessions", row)[0]

    def get_game_session(self, session_id: str) -> dict | None:
        return self._one("game_sessions", {"id": f"eq.{session_id}", "select": "*"})

    def update_game_session(self, session_id: str, fields: dict, *, only_status: str | None = None) -> dict | None:
        params = {"id": f"eq.{session_id}"}
        if only_status:
            params["status"] = f"eq.{only_status}"
        rows = self._update("game_sessions", params, fields)
        return rows[0] if rows else None

    def create_game_attempt(self, row: dict) -> dict:
        return self._insert("game_attempts", row)[0]

    def list_game_attempts(self, user_id: str, game_id: str | None = None) -> list[dict]:
        params = {"user_id": f"eq.{user_id}", "select": "*", "order": "created_at.desc"}
        if game_id:
            params["game_id"] = f"eq.{game_id}"
        return self._select("game_attempts", params)

    # ---------------------------------------------------------------- stats
    def get_stats(self, user_id: str) -> dict | None:
        return self._one("user_stats", {"user_id": f"eq.{user_id}", "select": "*"})

    def upsert_stats(self, user_id: str, fields: dict) -> dict:
        rows = self._insert("user_stats", {"user_id": user_id, **fields, "updated_at": now_iso()},
                            prefer="resolution=merge-duplicates,return=representation", on_conflict="user_id")
        return rows[0]

    def add_xp(self, user_id: str, amount: int) -> int:
        """Tambah XP secara atomik melalui fungsi database. Mengembalikan total XP baru."""
        resp = self.client.post(f"{self.base}/rpc/add_user_xp", json={"p_user_id": user_id, "p_xp": amount})
        return int(self._check(resp))

    # ---------------------------------------------------------------- achievements
    def list_user_achievements(self, user_id: str) -> list[dict]:
        return self._select("user_achievements", {"user_id": f"eq.{user_id}", "select": "*"})

    def grant_achievement(self, user_id: str, achievement_id: str) -> bool:
        rows = self._insert("user_achievements", {"user_id": user_id, "achievement_id": achievement_id},
                            prefer="resolution=ignore-duplicates,return=representation",
                            on_conflict="user_id,achievement_id")
        return bool(rows)

    # ---------------------------------------------------------------- activity
    def log_activity(self, row: dict) -> None:
        self._insert("activity_logs", row, prefer="return=minimal")
