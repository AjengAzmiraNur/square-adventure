"""Latihan singkat materi, TRAINING ZONE, dan FINAL CHALLENGE.

Mode 'instant' (latihan): setiap jawaban langsung diperiksa. Salah pertama → petunjuk,
salah kedua → pembahasan langkah demi langkah. Benar di percobaan pertama = 1 poin,
benar setelah petunjuk = 0,5 poin.

Mode 'exam' (evaluasi akhir): tidak ada umpan balik/kunci selama pengerjaan.
Semua jawaban dinilai saat dikirim, lalu pembahasan ditampilkan.
"""

from __future__ import annotations

import random
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from ..content.catalog import QUIZ_MAX_XP, stars_for_pct
from ..deps import current_user, get_repo
from ..repository import now_iso
from ..services import grading
from ..services.gamification import improvement_xp, refresh_progress
from .lessons import completed_levels, is_unlocked

router = APIRouter(prefix="/api/quizzes", tags=["quizzes"])

MAX_TRIES_INSTANT = 2
FINAL_COUNTS = (10, 15, 20)
SECONDS_PER_FINAL_QUESTION = 90
REASON_MAX = 500


class StartBody(BaseModel):
    quiz_slug: str
    count: int | None = None
    timed: bool = False


class CheckBody(BaseModel):
    question_id: str
    answer: object = None
    reason: str | None = Field(default=None, max_length=REASON_MAX)


class SubmitBody(BaseModel):
    answers: dict[str, object] = {}
    reasons: dict[str, str] = {}


def _parse_ts(value: str) -> datetime:
    return datetime.fromisoformat(value.replace("Z", "+00:00"))


def _own_attempt(repo, attempt_id: str, profile: dict) -> dict:
    attempt = repo.get_quiz_attempt(attempt_id)
    if not attempt or attempt["user_id"] != profile["id"]:
        raise HTTPException(404, "Sesi latihan tidak ditemukan.")
    return attempt


def _questions_in_order(repo, attempt: dict) -> list[dict]:
    by_id = {q["id"]: q for q in repo.get_questions(attempt["question_ids"])}
    return [by_id[i] for i in attempt["question_ids"] if i in by_id]


@router.post("/start")
def start_quiz(body: StartBody, profile=Depends(current_user), repo=Depends(get_repo)):
    quiz = repo.get_quiz(body.quiz_slug)
    if not quiz:
        raise HTTPException(404, "Kuis tidak ditemukan.")
    questions = repo.list_questions(quiz["id"])
    if not questions:
        raise HTTPException(409, "Bank soal belum diisi. Jalankan seed database.")
    is_teacher = profile.get("role") == "teacher"

    if quiz["kind"] == "lesson_check":
        lesson = repo.get_lesson(quiz["lesson_slug"])
        if not lesson or not is_unlocked(repo, profile, lesson):
            raise HTTPException(403, "Level ini masih terkunci.")
        selected = questions
    elif quiz["kind"] == "training":
        count = min(body.count or quiz.get("default_count") or 8, len(questions))
        selected = random.sample(questions, count)
    else:  # final
        if not is_teacher and len(completed_levels(repo, profile["id"])) < 4:
            raise HTTPException(403, "Final Challenge terbuka setelah keempat level materi selesai.")
        count = body.count or quiz.get("default_count") or 15
        if count not in FINAL_COUNTS:
            raise HTTPException(422, "Jumlah soal evaluasi harus 10, 15, atau 20.")
        selected = random.sample(questions, min(count, len(questions)))

    mode = "exam" if quiz["kind"] == "final" else "instant"
    time_limit = len(selected) * SECONDS_PER_FINAL_QUESTION if (mode == "exam" and body.timed) else None

    # Tutup sesi lama yang belum selesai untuk kuis yang sama.
    for old in repo.list_quiz_attempts(profile["id"], quiz_id=quiz["id"], status="in_progress"):
        repo.update_quiz_attempt(old["id"], {"status": "abandoned"}, only_status="in_progress")

    attempt = repo.create_quiz_attempt({
        "user_id": profile["id"], "quiz_id": quiz["id"], "kind": quiz["kind"], "mode": mode,
        "status": "in_progress", "question_ids": [q["id"] for q in selected], "responses": {},
        "total": len(selected), "timed": bool(time_limit), "time_limit_seconds": time_limit,
        "started_at": now_iso(),
    })
    return {
        "attempt_id": attempt["id"], "quiz": {"slug": quiz["slug"], "title": quiz["title"], "kind": quiz["kind"]},
        "mode": mode, "time_limit_seconds": time_limit, "started_at": attempt["started_at"],
        "questions": [grading.public_question(q) for q in selected],
    }


@router.post("/attempts/{attempt_id}/check")
def check_answer(attempt_id: str, body: CheckBody, profile=Depends(current_user), repo=Depends(get_repo)):
    attempt = _own_attempt(repo, attempt_id, profile)
    if attempt["mode"] != "instant":
        raise HTTPException(400, "Jawaban evaluasi akhir dinilai setelah semua soal dikirim.")
    if attempt["status"] != "in_progress":
        raise HTTPException(409, "Sesi latihan ini sudah selesai.")
    if body.question_id not in attempt["question_ids"]:
        raise HTTPException(404, "Soal tidak ada di sesi ini.")
    q = repo.get_questions([body.question_id])[0]

    responses = dict(attempt.get("responses") or {})
    prev = responses.get(body.question_id) or {"tries": 0}
    if prev.get("final"):
        raise HTTPException(409, "Soal ini sudah selesai dijawab.")
    try:
        answer = grading.normalize(q, body.answer)
    except grading.AnswerFormatError as exc:
        raise HTTPException(422, str(exc)) from exc

    tries = prev["tries"] + 1
    correct = grading.is_correct(q, answer)
    final = correct or tries >= MAX_TRIES_INSTANT
    points = (1.0 if tries == 1 else 0.5) if correct else 0.0
    responses[body.question_id] = {"answer": answer, "correct": correct, "tries": tries, "final": final,
                                   "points": points, "reason": (body.reason or prev.get("reason") or None)}
    repo.update_quiz_attempt(attempt_id, {"responses": responses})

    result = {"correct": correct, "tries": tries, "final": final, "points": points}
    if correct:
        result["explanation"] = q.get("explanation") or []
    elif not final:
        result["hint"] = q.get("hint")
    else:
        result["hint"] = q.get("hint")
        result["explanation"] = q.get("explanation") or []
        result["correct_answer"] = grading.correct_answer_value(q)
        result["correct_answer_label"] = grading.answer_label(q, grading.correct_answer_value(q))
    return result


@router.post("/attempts/{attempt_id}/submit")
def submit_attempt(attempt_id: str, body: SubmitBody, profile=Depends(current_user), repo=Depends(get_repo)):
    attempt = _own_attempt(repo, attempt_id, profile)
    if attempt["status"] != "in_progress":
        raise HTTPException(409, "Sesi ini sudah dikirim sebelumnya.")
    quiz = repo.get_quiz_by_id(attempt["quiz_id"])
    questions = _questions_in_order(repo, attempt)
    responses = dict(attempt.get("responses") or {})

    if attempt["mode"] == "exam":
        for q in questions:
            raw = body.answers.get(q["id"])
            reason = (body.reasons.get(q["id"]) or "")[:REASON_MAX] or None
            if raw is None or raw == "" or raw == []:
                responses[q["id"]] = {"answer": None, "correct": False, "points": 0.0, "reason": reason}
                continue
            try:
                ans = grading.normalize(q, raw)
            except grading.AnswerFormatError:
                responses[q["id"]] = {"answer": None, "correct": False, "points": 0.0, "reason": reason}
                continue
            ok = grading.is_correct(q, ans)
            responses[q["id"]] = {"answer": ans, "correct": ok, "points": 1.0 if ok else 0.0, "reason": reason}
    else:
        if attempt["kind"] == "lesson_check":
            unfinished = [q for q in questions if not (responses.get(q["id"]) or {}).get("final")]
            if unfinished:
                raise HTTPException(409, "Jawab semua soal latihan singkat terlebih dahulu.")
        for qid, text in body.reasons.items():
            if qid in responses and text:
                responses[qid]["reason"] = text[:REASON_MAX]

    total = len(questions)
    points = sum((responses.get(q["id"]) or {}).get("points", 0.0) for q in questions)
    correct_count = sum(1 for q in questions if (responses.get(q["id"]) or {}).get("correct"))
    score_pct = round(100 * points / total, 1) if total else 0.0
    stars = stars_for_pct(score_pct)

    started = _parse_ts(attempt["started_at"])
    duration = int((datetime.now(timezone.utc) - started).total_seconds())

    # XP: hanya peningkatan dari nilai XP terbaik sebelumnya pada kuis yang sama.
    xp, xp_value = 0, 0
    if attempt["kind"] in ("training", "final"):
        max_xp = QUIZ_MAX_XP["final"] if attempt["kind"] == "final" else QUIZ_MAX_XP["training"][quiz["difficulty"]]
        prev_best = max((a.get("xp_value") or 0 for a in
                         repo.list_quiz_attempts(profile["id"], quiz_id=attempt["quiz_id"], status="completed")),
                        default=0)
        xp_value = improvement_xp(max_xp, score_pct, 0)
        xp = improvement_xp(max_xp, score_pct, prev_best)

    updated = repo.update_quiz_attempt(attempt_id, {
        "status": "completed", "responses": responses, "score": correct_count, "points": points,
        "score_pct": score_pct, "stars": stars, "xp_awarded": xp, "xp_value": xp_value,
        "submitted_at": now_iso(), "duration_seconds": duration,
    }, only_status="in_progress")
    if not updated:
        raise HTTPException(409, "Sesi ini sudah dikirim sebelumnya.")

    repo.log_activity({"user_id": profile["id"], "activity_type": attempt["kind"], "title": quiz["title"],
                       "status": "completed", "detail": {"score_pct": score_pct, "correct": correct_count,
                                                         "total": total, "xp": xp}, "created_at": now_iso()})
    progress = refresh_progress(repo, profile["id"], xp=xp)
    return {
        "score_pct": score_pct, "correct": correct_count, "total": total, "points": points, "stars": stars,
        "duration_seconds": duration,
        "review": [grading.review_item(q, responses.get(q["id"])) for q in questions],
        **progress,
    }


@router.get("/attempts/{attempt_id}/review")
def review_attempt(attempt_id: str, profile=Depends(current_user), repo=Depends(get_repo)):
    attempt = _own_attempt(repo, attempt_id, profile)
    if attempt["status"] != "completed":
        raise HTTPException(409, "Pembahasan tersedia setelah sesi selesai.")
    questions = _questions_in_order(repo, attempt)
    responses = attempt.get("responses") or {}
    return {
        "score_pct": attempt.get("score_pct"), "correct": attempt.get("score"), "total": attempt.get("total"),
        "stars": attempt.get("stars"), "submitted_at": attempt.get("submitted_at"),
        "review": [grading.review_item(q, responses.get(q["id"])) for q in questions],
    }
