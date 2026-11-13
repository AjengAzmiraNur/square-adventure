"""XP, level petualang, bintang, dan lencana. Dihitung hanya di server."""

from __future__ import annotations

from ..content.catalog import ADVENTURER_LEVELS, level_for_xp
from ..repository import now_iso


def improvement_xp(max_xp: int, score_pct: float, previous_best_xp: int) -> int:
    """XP hanya diberikan untuk peningkatan dari XP terbaik sebelumnya.

    Mengulang aktivitas dengan skor yang sama atau lebih rendah tidak menambah XP,
    sehingga refresh/pengulangan tidak bisa dipakai untuk 'menimbun' XP.
    """
    earned = int(round(max_xp * max(0.0, min(100.0, score_pct)) / 100))
    return max(0, earned - previous_best_xp)


def level_info(total_xp: int) -> dict:
    level = level_for_xp(total_xp)
    current_threshold, name = ADVENTURER_LEVELS[level - 1]
    next_threshold = ADVENTURER_LEVELS[level][0] if level < len(ADVENTURER_LEVELS) else None
    return {"level": level, "level_name": name, "level_min_xp": current_threshold,
            "next_level_xp": next_threshold}


def _best_by(rows: list[dict], key: str, field: str) -> dict:
    best: dict = {}
    for r in rows:
        k = r.get(key)
        best[k] = max(best.get(k, 0), r.get(field) or 0)
    return best


def refresh_progress(repo, user_id: str, *, xp: int = 0) -> dict:
    """Tambah XP (jika ada), hitung ulang statistik, dan beri lencana baru."""
    if xp > 0:
        total_xp = repo.add_xp(user_id, xp)
    else:
        total_xp = (repo.get_stats(user_id) or {}).get("total_xp", 0)

    lessons = {l["id"]: l for l in repo.list_lessons()}
    progress = repo.list_lesson_progress(user_id)
    completed_levels = {lessons[p["lesson_id"]]["level"] for p in progress
                        if p["status"] == "completed" and p["lesson_id"] in lessons}

    quiz_attempts = [a for a in repo.list_quiz_attempts(user_id, status="completed")
                     if a.get("kind") in ("training", "final")]
    game_attempts = repo.list_game_attempts(user_id)

    stars = sum(_best_by(quiz_attempts, "quiz_id", "stars").values()) + \
        sum(_best_by(game_attempts, "game_id", "stars").values())

    stats = repo.upsert_stats(user_id, {
        "total_xp": total_xp,
        "level": level_for_xp(total_xp),
        "lessons_completed": len(completed_levels),
        "games_played": len(game_attempts),
        "quizzes_completed": len(quiz_attempts),
        "stars": stars,
    })

    # ---------------- lencana
    expert = repo.get_quiz("training-expert")
    expert_ok = any(a["quiz_id"] == (expert or {}).get("id") and (a.get("score_pct") or 0) >= 70
                    for a in quiz_attempts)
    finals = [a for a in quiz_attempts if a.get("kind") == "final"]
    distinct_games = {a["game_id"] for a in game_attempts}
    all_games = repo.list_games()

    earned_rules = {
        "first-adventure": len(completed_levels) >= 1,
        "pattern-explorer": 1 in completed_levels,
        "number-detective": 2 in completed_levels,
        "formula-master": 3 in completed_levels,
        "square-expert": expert_ok,
        "math-adventurer": 4 in completed_levels,
        "adventure-champion": len(finals) >= 1,
        "playground-hero": bool(all_games) and len(distinct_games) >= len(all_games),
        "perfect-square": any((a.get("score_pct") or 0) >= 100 for a in finals),
    }

    owned = {ua["achievement_id"] for ua in repo.list_user_achievements(user_id)}
    new_achievements = []
    for ach in repo.list_achievements():
        if earned_rules.get(ach["slug"]) and ach["id"] not in owned:
            if repo.grant_achievement(user_id, ach["id"]):
                new_achievements.append({"slug": ach["slug"], "title": ach["title"],
                                         "description": ach["description"], "icon": ach["icon"]})
                repo.log_activity({"user_id": user_id, "activity_type": "achievement",
                                   "title": f"Lencana {ach['title']}", "status": "earned",
                                   "detail": {"slug": ach["slug"]}, "created_at": now_iso()})

    return {"xp_awarded": max(0, xp), "stats": {**stats, **level_info(stats["total_xp"])},
            "new_achievements": new_achievements}
