"""SQUARE PLAYGROUND — sesi permainan. Ronde, kunci, dan skor dikelola server."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from ..content.catalog import stars_for_pct
from ..deps import current_user, get_repo
from ..repository import now_iso
from ..services import games as engine
from ..services.gamification import improvement_xp, refresh_progress

router = APIRouter(prefix="/api/games", tags=["games"])

TIME_GRACE_SECONDS = 5


class StartBody(BaseModel):
    difficulty: str | None = None


class AnswerBody(BaseModel):
    round_index: int
    answer: object = None


class HintBody(BaseModel):
    round_index: int


def _parse(ts: str) -> datetime:
    return datetime.fromisoformat(ts.replace("Z", "+00:00"))


def _own_session(repo, session_id: str, profile: dict) -> dict:
    s = repo.get_game_session(session_id)
    if not s or s["user_id"] != profile["id"]:
        raise HTTPException(404, "Sesi permainan tidak ditemukan.")
    return s


def _time_up(session: dict) -> bool:
    if not session.get("expires_at"):
        return False
    return datetime.now(timezone.utc) > _parse(session["expires_at"]) + timedelta(seconds=TIME_GRACE_SECONDS)


def _current_index(state: list[dict]) -> int | None:
    for i, st in enumerate(state):
        if not st.get("done"):
            return i
    return None


def _score(session: dict) -> tuple[int, int]:
    score = sum(st.get("points", 0) for st in session["state"])
    max_score = sum(r["points"] for r in session["rounds"])
    return score, max_score


@router.post("/{slug}/start")
def start_game(slug: str, body: StartBody, profile=Depends(current_user), repo=Depends(get_repo)):
    game = repo.get_game(slug)
    if not game or slug not in engine.GAME_CONFIG:
        raise HTTPException(404, "Permainan tidak ditemukan.")
    cfg = engine.GAME_CONFIG[slug]
    difficulty = None
    if cfg["difficulties"]:
        difficulty = body.difficulty or cfg["difficulties"][0]
        if difficulty not in cfg["difficulties"]:
            raise HTTPException(422, "Tingkat kesulitan tidak valid.")

    rounds = engine.generate_rounds(slug, difficulty)
    now = datetime.now(timezone.utc)
    expires = (now + timedelta(seconds=cfg["time_limit"])).isoformat() if cfg["time_limit"] else None
    session = repo.create_game_session({
        "user_id": profile["id"], "game_id": game["id"], "game_slug": slug, "difficulty": difficulty,
        "rounds": rounds,
        "state": [{"tries": 0, "done": False, "correct": False, "points": 0, "hint_used": False} for _ in rounds],
        "status": "in_progress", "started_at": now.isoformat(), "expires_at": expires,
    })
    return {
        "session_id": session["id"], "game": {"slug": slug, "title": game["title"]},
        "difficulty": difficulty, "max_tries": cfg["max_tries"], "time_limit_seconds": cfg["time_limit"],
        "rounds": [engine.public_round(i, r) for i, r in enumerate(rounds)],
        "max_score": sum(r["points"] for r in rounds),
    }


@router.post("/sessions/{session_id}/hint")
def get_hint(session_id: str, body: HintBody, profile=Depends(current_user), repo=Depends(get_repo)):
    session = _own_session(repo, session_id, profile)
    if session["status"] != "in_progress":
        raise HTTPException(409, "Permainan sudah selesai.")
    if body.round_index != _current_index(session["state"]):
        raise HTTPException(409, "Ronde ini tidak sedang dimainkan.")
    state = session["state"]
    state[body.round_index]["hint_used"] = True
    repo.update_game_session(session_id, {"state": state})
    return {"hint": session["rounds"][body.round_index]["hint"], "penalty": "Poin ronde ini dikurangi 25%."}


@router.post("/sessions/{session_id}/answer")
def answer_round(session_id: str, body: AnswerBody, profile=Depends(current_user), repo=Depends(get_repo)):
    session = _own_session(repo, session_id, profile)
    if session["status"] != "in_progress":
        raise HTTPException(409, "Permainan sudah selesai.")
    state = session["state"]
    if _time_up(session):
        for st in state:
            st["done"] = True
        repo.update_game_session(session_id, {"state": state})
        score, max_score = _score(session)
        return {"time_up": True, "score": score, "max_score": max_score}

    idx = _current_index(state)
    if idx is None or body.round_index != idx:
        raise HTTPException(409, "Ronde ini tidak sedang dimainkan.")
    rnd = session["rounds"][idx]
    try:
        answer = engine.normalize_answer(rnd, body.answer)
    except engine.AnswerFormatError as exc:
        raise HTTPException(422, str(exc)) from exc

    cfg = engine.GAME_CONFIG[session["game_slug"]]
    st = state[idx]
    st["tries"] += 1
    correct = engine.is_correct(rnd, answer)
    final = correct or st["tries"] >= cfg["max_tries"]
    if correct:
        st["points"] = engine.points_for(rnd, st["tries"], st["hint_used"])
        st["correct"] = True
    if final:
        st["done"] = True
    repo.update_game_session(session_id, {"state": state})

    score, max_score = _score(session)
    result = {"correct": correct, "final": final, "tries": st["tries"], "points": st["points"],
              "score": score, "max_score": max_score, "finished": _current_index(state) is None}
    if final:
        result["explanation"] = rnd["explanation"]
        result["correct_answer"] = rnd["answer"]
    elif not correct:
        # Petunjuk otomatis setelah salah; pengurangan poin sudah tercakup oleh aturan percobaan kedua.
        result["hint"] = rnd["hint"]
    return result


@router.post("/sessions/{session_id}/finish")
def finish_game(session_id: str, profile=Depends(current_user), repo=Depends(get_repo)):
    session = _own_session(repo, session_id, profile)
    if session["status"] != "in_progress":
        raise HTTPException(409, "Permainan ini sudah selesai.")
    game = repo.get_game(session["game_slug"])

    finished = repo.update_game_session(session_id, {"status": "finished", "finished_at": now_iso()},
                                        only_status="in_progress")
    if not finished:
        raise HTTPException(409, "Permainan ini sudah selesai.")

    score, max_score = _score(session)
    pct = round(100 * score / max_score, 1) if max_score else 0.0
    stars = stars_for_pct(pct)
    correct_count = sum(1 for st in session["state"] if st.get("correct"))
    duration = int((datetime.now(timezone.utc) - _parse(session["started_at"])).total_seconds())

    prev_best = max((a.get("xp_value") or 0 for a in repo.list_game_attempts(profile["id"], game["id"])), default=0)
    xp_value = improvement_xp(game.get("max_xp", 40), pct, 0)
    xp = improvement_xp(game.get("max_xp", 40), pct, prev_best)

    repo.create_game_attempt({
        "user_id": profile["id"], "game_id": game["id"], "difficulty": session.get("difficulty"),
        "score": score, "max_score": max_score, "score_pct": pct, "stars": stars,
        "correct_count": correct_count, "rounds_count": len(session["rounds"]),
        "xp_awarded": xp, "xp_value": xp_value, "duration_seconds": duration, "created_at": now_iso(),
    })
    repo.log_activity({"user_id": profile["id"], "activity_type": "game", "title": game["title"],
                       "status": "completed", "detail": {"score": score, "max_score": max_score,
                                                         "score_pct": pct, "xp": xp,
                                                         "difficulty": session.get("difficulty")},
                       "created_at": now_iso()})
    progress = refresh_progress(repo, profile["id"], xp=xp)
    return {"score": score, "max_score": max_score, "score_pct": pct, "stars": stars,
            "correct": correct_count, "rounds": len(session["rounds"]), "duration_seconds": duration, **progress}
