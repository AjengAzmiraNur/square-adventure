from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException

from ..deps import current_user, get_repo
from ..repository import now_iso
from ..services.gamification import refresh_progress

router = APIRouter(prefix="/api/lessons", tags=["lessons"])

LESSON_CHECK_QUIZ = {1: "lesson-1-check", 2: "lesson-2-check", 3: "lesson-3-check", 4: "lesson-4-check"}


def completed_levels(repo, user_id: str) -> set[int]:
    lessons = {l["id"]: l["level"] for l in repo.list_lessons()}
    return {lessons[p["lesson_id"]] for p in repo.list_lesson_progress(user_id)
            if p["status"] == "completed" and p["lesson_id"] in lessons}


def is_unlocked(repo, profile: dict, lesson: dict) -> bool:
    if profile.get("role") == "teacher" or lesson["level"] == 1:
        return True
    return (lesson["level"] - 1) in completed_levels(repo, profile["id"])


def _lesson_or_404(repo, slug: str) -> dict:
    lesson = repo.get_lesson(slug)
    if not lesson:
        raise HTTPException(404, "Materi tidak ditemukan.")
    return lesson


@router.post("/{slug}/start")
def start_lesson(slug: str, profile=Depends(current_user), repo=Depends(get_repo)):
    lesson = _lesson_or_404(repo, slug)
    if not is_unlocked(repo, profile, lesson):
        raise HTTPException(403, f"Level ini masih terkunci. Selesaikan Level 0{lesson['level'] - 1} terlebih dahulu.")
    already = any(p["lesson_id"] == lesson["id"] for p in repo.list_lesson_progress(profile["id"]))
    repo.start_lesson(profile["id"], lesson["id"])
    if not already:
        repo.log_activity({"user_id": profile["id"], "activity_type": "lesson", "title": lesson["title"],
                           "status": "started", "detail": {"level": lesson["level"]}, "created_at": now_iso()})
    return {"ok": True}


@router.post("/{slug}/complete")
def complete_lesson(slug: str, profile=Depends(current_user), repo=Depends(get_repo)):
    lesson = _lesson_or_404(repo, slug)
    if not is_unlocked(repo, profile, lesson):
        raise HTTPException(403, "Level ini masih terkunci.")
    quiz = repo.get_quiz(LESSON_CHECK_QUIZ[lesson["level"]])
    attempts = repo.list_quiz_attempts(profile["id"], quiz_id=quiz["id"], status="completed")
    if not attempts:
        raise HTTPException(409, "Kerjakan dulu Latihan Singkat sebelum menyelesaikan misi.")
    best = max(a.get("score_pct") or 0 for a in attempts)

    newly = repo.complete_lesson(profile["id"], lesson["id"], int(best))
    xp = lesson.get("xp_reward", 50) if newly else 0
    if newly:
        repo.log_activity({"user_id": profile["id"], "activity_type": "lesson", "title": lesson["title"],
                           "status": "completed", "detail": {"level": lesson["level"], "check_score": best, "xp": xp},
                           "created_at": now_iso()})
    result = refresh_progress(repo, profile["id"], xp=xp)
    return {"newly_completed": newly, **result}
