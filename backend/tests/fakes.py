"""Implementasi in-memory KHUSUS PENGUJIAN (tidak dipakai aplikasi).

MemoryRepository meniru perilaku SupabaseRepository (termasuk keunikan
lesson_progress dan user_achievements) agar alur API dapat diuji tanpa
koneksi ke Supabase. FakeAuth meniru Supabase Auth.
"""

from __future__ import annotations

import copy
import uuid

from app.auth_provider import AuthError
from app.content.catalog import ACHIEVEMENTS, GAMES, LESSONS
from app.content.questions import QUESTIONS_BY_QUIZ, QUIZZES
from app.repository import now_iso


def _id() -> str:
    return str(uuid.uuid4())


class MemoryRepository:
    def __init__(self):
        self.t: dict[str, list[dict]] = {k: [] for k in (
            "profiles", "lessons", "lesson_progress", "quizzes", "quiz_questions", "quiz_attempts",
            "games", "game_sessions", "game_attempts", "user_stats", "achievements",
            "user_achievements", "activity_logs")}
        for l in LESSONS:
            self.t["lessons"].append({"id": _id(), **l})
        for q in QUIZZES:
            quiz = {"id": _id(), **q}
            self.t["quizzes"].append(quiz)
            for pos, item in enumerate(QUESTIONS_BY_QUIZ[q["slug"]], start=1):
                self.t["quiz_questions"].append({"id": _id(), "quiz_id": quiz["id"], "position": pos,
                                                 **copy.deepcopy(item)})
        for g in GAMES:
            self.t["games"].append({"id": _id(), **g})
        for a in ACHIEVEMENTS:
            self.t["achievements"].append({"id": _id(), **a})

    # helpers
    def _find(self, table, **kw):
        return [r for r in self.t[table] if all(r.get(k) == v for k, v in kw.items())]

    def _first(self, table, **kw):
        rows = self._find(table, **kw)
        return copy.deepcopy(rows[0]) if rows else None

    # profiles
    def get_profile(self, user_id):
        return self._first("profiles", id=user_id)

    def get_profile_by_code(self, code):
        return self._first("profiles", student_code=code)

    def list_students(self):
        out = []
        for p in self._find("profiles", role="student"):
            out.append({**copy.deepcopy(p), "user_stats": self.get_stats(p["id"])})
        return out

    def insert_profile(self, row):
        if self.get_profile_by_code(row["student_code"]):
            raise RuntimeError("duplicate code")
        self.t["profiles"].append(dict(row))
        return dict(row)

    def update_profile(self, user_id, fields):
        for r in self.t["profiles"]:
            if r["id"] == user_id:
                r.update(fields)
                return copy.deepcopy(r)
        return None

    # catalog
    def list_lessons(self):
        return sorted(copy.deepcopy(self.t["lessons"]), key=lambda l: l["level"])

    def get_lesson(self, slug):
        return self._first("lessons", slug=slug)

    def get_quiz(self, slug):
        return self._first("quizzes", slug=slug)

    def get_quiz_by_id(self, quiz_id):
        return self._first("quizzes", id=quiz_id)

    def list_questions(self, quiz_id):
        return sorted(copy.deepcopy(self._find("quiz_questions", quiz_id=quiz_id)), key=lambda q: q["position"])

    def get_questions(self, ids):
        return [copy.deepcopy(q) for q in self.t["quiz_questions"] if q["id"] in ids]

    def get_game(self, slug):
        return self._first("games", slug=slug)

    def list_games(self):
        return copy.deepcopy(self.t["games"])

    def list_achievements(self):
        return sorted(copy.deepcopy(self.t["achievements"]), key=lambda a: a["sort_order"])

    # lessons
    def list_lesson_progress(self, user_id):
        return copy.deepcopy(self._find("lesson_progress", user_id=user_id))

    def start_lesson(self, user_id, lesson_id):
        if not self._find("lesson_progress", user_id=user_id, lesson_id=lesson_id):
            self.t["lesson_progress"].append({"id": _id(), "user_id": user_id, "lesson_id": lesson_id,
                                              "status": "in_progress", "started_at": now_iso()})

    def complete_lesson(self, user_id, lesson_id, check_score):
        rows = self._find("lesson_progress", user_id=user_id, lesson_id=lesson_id)
        if rows:
            if rows[0]["status"] == "completed":
                return False
            rows[0].update(status="completed", check_score=check_score, completed_at=now_iso())
            return True
        self.t["lesson_progress"].append({"id": _id(), "user_id": user_id, "lesson_id": lesson_id,
                                          "status": "completed", "check_score": check_score,
                                          "completed_at": now_iso()})
        return True

    # quizzes
    def create_quiz_attempt(self, row):
        row = {"id": _id(), **copy.deepcopy(row)}
        self.t["quiz_attempts"].append(row)
        return copy.deepcopy(row)

    def get_quiz_attempt(self, attempt_id):
        return self._first("quiz_attempts", id=attempt_id)

    def update_quiz_attempt(self, attempt_id, fields, *, only_status=None):
        for r in self.t["quiz_attempts"]:
            if r["id"] == attempt_id and (only_status is None or r["status"] == only_status):
                r.update(copy.deepcopy(fields))
                return copy.deepcopy(r)
        return None

    def list_quiz_attempts(self, user_id, quiz_id=None, status=None):
        rows = [r for r in self.t["quiz_attempts"] if r["user_id"] == user_id
                and (quiz_id is None or r["quiz_id"] == quiz_id) and (status is None or r["status"] == status)]
        return copy.deepcopy(rows[::-1])

    # games
    def create_game_session(self, row):
        row = {"id": _id(), **copy.deepcopy(row)}
        self.t["game_sessions"].append(row)
        return copy.deepcopy(row)

    def get_game_session(self, session_id):
        return self._first("game_sessions", id=session_id)

    def update_game_session(self, session_id, fields, *, only_status=None):
        for r in self.t["game_sessions"]:
            if r["id"] == session_id and (only_status is None or r["status"] == only_status):
                r.update(copy.deepcopy(fields))
                return copy.deepcopy(r)
        return None

    def create_game_attempt(self, row):
        row = {"id": _id(), **copy.deepcopy(row)}
        self.t["game_attempts"].append(row)
        return copy.deepcopy(row)

    def list_game_attempts(self, user_id, game_id=None):
        return copy.deepcopy([r for r in self.t["game_attempts"] if r["user_id"] == user_id
                              and (game_id is None or r["game_id"] == game_id)])

    # stats
    def get_stats(self, user_id):
        return self._first("user_stats", user_id=user_id)

    def upsert_stats(self, user_id, fields):
        for r in self.t["user_stats"]:
            if r["user_id"] == user_id:
                r.update(fields)
                return copy.deepcopy(r)
        row = {"user_id": user_id, "total_xp": 0, "level": 1, "lessons_completed": 0, "games_played": 0,
               "quizzes_completed": 0, "stars": 0, **fields}
        self.t["user_stats"].append(row)
        return copy.deepcopy(row)

    def add_xp(self, user_id, amount):
        stats = self.get_stats(user_id) or self.upsert_stats(user_id, {})
        return self.upsert_stats(user_id, {"total_xp": stats["total_xp"] + max(0, amount)})["total_xp"]

    # achievements
    def list_user_achievements(self, user_id):
        return copy.deepcopy(self._find("user_achievements", user_id=user_id))

    def grant_achievement(self, user_id, achievement_id):
        if self._find("user_achievements", user_id=user_id, achievement_id=achievement_id):
            return False
        self.t["user_achievements"].append({"id": _id(), "user_id": user_id, "achievement_id": achievement_id,
                                            "earned_at": now_iso()})
        return True

    def log_activity(self, row):
        self.t["activity_logs"].append({"id": _id(), **row})


class FakeAuth:
    """Meniru Supabase Auth: akun email+password dan token akses."""

    def __init__(self):
        self.users: dict[str, dict] = {}   # email -> {id, password}
        self.tokens: dict[str, str] = {}   # token -> user id

    def create_user(self, email, password, metadata=None):
        if email in self.users:
            raise AuthError("exists", status=400)
        uid = _id()
        self.users[email] = {"id": uid, "password": password}
        return uid

    def delete_user(self, user_id):
        self.users = {e: u for e, u in self.users.items() if u["id"] != user_id}

    def sign_in(self, email, password):
        u = self.users.get(email)
        if not u or u["password"] != password:
            raise AuthError("Akun siswa belum siap.")
        token = f"tok-{_id()}"
        self.tokens[token] = u["id"]
        return {"access_token": token, "refresh_token": f"ref-{_id()}", "expires_in": 3600}

    def get_user(self, token):
        if token not in self.tokens:
            raise AuthError("Sesi tidak valid atau sudah berakhir.")
        return {"id": self.tokens[token]}
