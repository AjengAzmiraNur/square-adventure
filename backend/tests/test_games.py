"""Generator dan sesi kelima permainan SQUARE PLAYGROUND."""

import math
import random
from datetime import datetime, timedelta, timezone

import pytest

from app.content.catalog import level_for_xp
from app.services import games as engine
from app.services.gamification import improvement_xp

SLUGS = list(engine.GAME_CONFIG)


@pytest.mark.parametrize("seed", range(40))
def test_generators_produce_valid_rounds(seed):
    rng = random.Random(seed)
    for slug in SLUGS:
        for diff in (engine.GAME_CONFIG[slug]["difficulties"] or [None]):
            rounds = engine.generate_rounds(slug, diff, rng)
            assert rounds
            for r in rounds:
                assert r["hint"] and r["explanation"] and r["points"] > 0
                pub = engine.public_round(0, r)
                assert "answer" not in pub
                if r["kind"] == "select_squares":
                    cards = r["public"]["cards"]
                    assert r["answer"] == [i for i, c in enumerate(cards) if c["rows"] == c["cols"]]
                    assert 2 <= len(r["answer"]) <= 3
                if r["kind"] == "fill_sequence":
                    items = list(r["public"]["items"])
                    vals = iter(r["answer"])
                    filled = [v if v is not None else next(vals) for v in items]
                    roots = [math.isqrt(v) for v in filled]
                    assert all(x * x == v for x, v in zip(roots, filled))
                    assert roots == list(range(roots[0], roots[0] + 6))
                if r["kind"] == "build":
                    assert r["answer"] ** 2 == r["public"]["target"]


def test_next_number_rules_hold():
    rng = random.Random(7)
    for diff in ("mudah", "sedang", "sulit"):
        for r in engine.generate_rounds("next-number", diff, rng):
            seq = r["public"]["sequence"] + [r["answer"]]
            # Setiap deret (dikurangi/ditambah konstanta 0/±1) adalah kuadrat yang teratur
            for shift in (0, -1, 1):
                roots = [math.isqrt(v + shift) for v in seq]
                if all(x * x == v + shift for x, v in zip(roots, seq)):
                    steps = {b - a for a, b in zip(roots, roots[1:])}
                    assert len(steps) == 1 and steps.pop() in (1, -1, 2)
                    break
            else:
                pytest.fail(f"Deret tidak sesuai aturan: {seq}")


def test_adventure_quest_answers():
    for seed in range(30):
        rounds = engine.generate_rounds("adventure-quest", None, random.Random(seed))
        castle = rounds[4]
        total = int(castle["public"]["story"].split(" dari ")[1].split()[0])
        assert castle["answer"] ** 2 <= total < (castle["answer"] + 1) ** 2


def test_scoring_helpers():
    assert engine.points_for({"points": 20}, 1, False) == 20
    assert engine.points_for({"points": 20}, 2, False) == 10
    assert engine.points_for({"points": 20}, 1, True) == 15
    assert improvement_xp(40, 100, 0) == 40
    assert improvement_xp(40, 50, 40) == 0
    assert improvement_xp(40, 100, 20) == 20
    assert [level_for_xp(x) for x in (0, 79, 80, 600, 5000)] == [1, 1, 2, 6, 6]


def play(env, headers, slug, difficulty=None, correct=True):
    c, repo = env["client"], env["repo"]
    s = c.post(f"/api/games/{slug}/start", json={"difficulty": difficulty}, headers=headers)
    assert s.status_code == 200, s.text
    s = s.json()
    for rnd in s["rounds"]:
        assert "answer" not in rnd
    secret = repo.get_game_session(s["session_id"])["rounds"]
    for i, r in enumerate(secret):
        ans = r["answer"]
        if not correct:
            ans = [0] if r["kind"] == "select_squares" else ([v + 1 for v in ans] if isinstance(ans, list) else ans + 1)
        res = c.post(f"/api/games/sessions/{s['session_id']}/answer",
                     json={"round_index": i, "answer": ans}, headers=headers).json()
        if not correct and not res.get("final"):
            res = c.post(f"/api/games/sessions/{s['session_id']}/answer",
                         json={"round_index": i, "answer": ans}, headers=headers).json()
        assert res["correct"] is correct and res["final"]
    return c.post(f"/api/games/sessions/{s['session_id']}/finish", headers=headers).json()


@pytest.mark.parametrize("slug", SLUGS)
def test_each_game_playable_perfect(env, student, slug):
    diff = "sulit" if slug == "next-number" else None
    res = play(env, student, slug, diff)
    assert res["score_pct"] == 100 and res["stars"] == 3 and res["xp_awarded"] == 40


def test_game_wrong_answers_score_zero_and_feedback(env, student):
    res = play(env, student, "complete-pattern", correct=False)
    assert res["score"] == 0 and res["xp_awarded"] == 0


def test_game_rounds_must_be_sequential_and_private(env, student, student2):
    c = env["client"]
    s = c.post("/api/games/adventure-quest/start", json={}, headers=student).json()
    r = c.post(f"/api/games/sessions/{s['session_id']}/answer", json={"round_index": 2, "answer": 1}, headers=student)
    assert r.status_code == 409
    r = c.post(f"/api/games/sessions/{s['session_id']}/answer", json={"round_index": 0, "answer": 1}, headers=student2)
    assert r.status_code == 404
    h = c.post(f"/api/games/sessions/{s['session_id']}/hint", json={"round_index": 0}, headers=student).json()
    assert h["hint"]


def test_hint_reduces_points(env, student):
    c, repo = env["client"], env["repo"]
    s = c.post("/api/games/adventure-quest/start", json={}, headers=student).json()
    c.post(f"/api/games/sessions/{s['session_id']}/hint", json={"round_index": 0}, headers=student)
    ans = repo.get_game_session(s["session_id"])["rounds"][0]["answer"]
    res = c.post(f"/api/games/sessions/{s['session_id']}/answer",
                 json={"round_index": 0, "answer": ans}, headers=student).json()
    assert res["points"] == 15


def test_finish_twice_rejected_and_xp_no_farming(env, student):
    first = play(env, student, "square-hunter")
    assert first["xp_awarded"] == 40
    second = play(env, student, "square-hunter")
    assert second["xp_awarded"] == 0 and second["stats"]["total_xp"] == 40


def test_timed_game_time_up(env, student):
    c, repo = env["client"], env["repo"]
    s = c.post("/api/games/next-number/start", json={"difficulty": "mudah"}, headers=student).json()
    assert s["time_limit_seconds"] == 60
    past = (datetime.now(timezone.utc) - timedelta(minutes=5)).isoformat()
    repo.update_game_session(s["session_id"], {"expires_at": past})
    r = c.post(f"/api/games/sessions/{s['session_id']}/answer", json={"round_index": 0, "answer": 1},
               headers=student).json()
    assert r["time_up"] is True
    fin = c.post(f"/api/games/sessions/{s['session_id']}/finish", headers=student).json()
    assert fin["score"] == 0


def test_invalid_difficulty(env, student):
    r = env["client"].post("/api/games/next-number/start", json={"difficulty": "dewa"}, headers=student)
    assert r.status_code == 422


def test_playground_hero_badge(env, student):
    for slug in SLUGS:
        res = play(env, student, slug, "mudah" if slug == "next-number" else None)
    assert "playground-hero" in {a["slug"] for a in res["new_achievements"]}
