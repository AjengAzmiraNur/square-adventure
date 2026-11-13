"""Alur materi, latihan, evaluasi, XP, dan lencana."""

from app.services.grading import correct_answer_value


def key_for(repo, question_id):
    q = repo.get_questions([question_id])[0]
    return correct_answer_value(q)


def wrong_for(repo, question_id):
    q = repo.get_questions([question_id])[0]
    if q["type"] in ("mcq", "grid_choice"):
        return (q["answer"]["index"] + 1) % len(q["options"])
    if q["type"] == "tf":
        return not q["answer"]["value"]
    if q["type"] == "sequence":
        return [v + 1 for v in q["answer"]["values"]]
    return q["answer"]["value"] + 1


def do_lesson(env, headers, slug, level):
    c, repo = env["client"], env["repo"]
    assert c.post(f"/api/lessons/{slug}/start", headers=headers).status_code == 200
    s = c.post("/api/quizzes/start", json={"quiz_slug": f"lesson-{level}-check"}, headers=headers).json()
    for q in s["questions"]:
        r = c.post(f"/api/quizzes/attempts/{s['attempt_id']}/check",
                   json={"question_id": q["id"], "answer": key_for(repo, q["id"])}, headers=headers)
        assert r.json()["correct"]
    assert c.post(f"/api/quizzes/attempts/{s['attempt_id']}/submit", json={}, headers=headers).status_code == 200
    return c.post(f"/api/lessons/{slug}/complete", headers=headers)


LESSONS = [("kenali-polanya", 1), ("lengkapi-pola", 2), ("temukan-rumus", 3), ("tantangan-matematika", 4)]


def test_levels_unlock_in_order(env, student):
    c = env["client"]
    assert c.post("/api/lessons/lengkapi-pola/start", headers=student).status_code == 403
    r = do_lesson(env, student, "kenali-polanya", 1)
    assert r.status_code == 200
    body = r.json()
    assert body["newly_completed"] and body["xp_awarded"] == 50
    assert {a["slug"] for a in body["new_achievements"]} == {"first-adventure", "pattern-explorer"}
    assert c.post("/api/lessons/lengkapi-pola/start", headers=student).status_code == 200


def test_lesson_complete_requires_check_and_no_double_xp(env, student):
    c = env["client"]
    c.post("/api/lessons/kenali-polanya/start", headers=student)
    assert c.post("/api/lessons/kenali-polanya/complete", headers=student).status_code == 409
    do_lesson(env, student, "kenali-polanya", 1)
    again = c.post("/api/lessons/kenali-polanya/complete", headers=student).json()
    assert again["newly_completed"] is False and again["xp_awarded"] == 0
    assert again["stats"]["total_xp"] == 50


def test_lesson_check_must_be_fully_answered(env, student):
    c = env["client"]
    s = c.post("/api/quizzes/start", json={"quiz_slug": "lesson-1-check"}, headers=student).json()
    r = c.post(f"/api/quizzes/attempts/{s['attempt_id']}/submit", json={}, headers=student)
    assert r.status_code == 409


def test_instant_feedback_hint_then_explanation(env, student):
    c, repo = env["client"], env["repo"]
    s = c.post("/api/quizzes/start", json={"quiz_slug": "training-beginner"}, headers=student).json()
    assert s["mode"] == "instant" and len(s["questions"]) == 8
    for q in s["questions"]:
        assert "answer" not in q and "explanation" not in q and "hint" not in q
    qid = s["questions"][0]["id"]
    url = f"/api/quizzes/attempts/{s['attempt_id']}/check"
    first = c.post(url, json={"question_id": qid, "answer": wrong_for(repo, qid)}, headers=student).json()
    assert first["correct"] is False and first["hint"] and "explanation" not in first
    second = c.post(url, json={"question_id": qid, "answer": key_for(repo, qid)}, headers=student).json()
    assert second["correct"] and second["points"] == 0.5 and second["explanation"]
    assert c.post(url, json={"question_id": qid, "answer": key_for(repo, qid)}, headers=student).status_code == 409


def test_wrong_twice_shows_step_by_step(env, student):
    c, repo = env["client"], env["repo"]
    s = c.post("/api/quizzes/start", json={"quiz_slug": "training-expert"}, headers=student).json()
    qid = s["questions"][0]["id"]
    url = f"/api/quizzes/attempts/{s['attempt_id']}/check"
    c.post(url, json={"question_id": qid, "answer": wrong_for(repo, qid)}, headers=student)
    r = c.post(url, json={"question_id": qid, "answer": wrong_for(repo, qid)}, headers=student).json()
    assert r["final"] and r["explanation"] and r["correct_answer_label"]


def test_invalid_answer_format_rejected(env, student):
    c = env["client"]
    s = c.post("/api/quizzes/start", json={"quiz_slug": "training-beginner"}, headers=student).json()
    q = next(q for q in s["questions"] if q["type"] == "number") if any(
        q["type"] == "number" for q in s["questions"]) else None
    if q:
        r = c.post(f"/api/quizzes/attempts/{s['attempt_id']}/check",
                   json={"question_id": q["id"], "answer": "2.5"}, headers=student)
        assert r.status_code == 422


def test_training_xp_only_for_improvement(env, student):
    c, repo = env["client"], env["repo"]

    def run(all_correct):
        s = c.post("/api/quizzes/start", json={"quiz_slug": "training-beginner"}, headers=student).json()
        for q in s["questions"]:
            ans = key_for(repo, q["id"]) if all_correct else wrong_for(repo, q["id"])
            c.post(f"/api/quizzes/attempts/{s['attempt_id']}/check",
                   json={"question_id": q["id"], "answer": ans}, headers=student)
        return c.post(f"/api/quizzes/attempts/{s['attempt_id']}/submit", json={}, headers=student).json()

    perfect = run(True)
    assert perfect["score_pct"] == 100 and perfect["xp_awarded"] == 30 and perfect["stars"] == 3
    again = run(True)
    assert again["xp_awarded"] == 0
    assert again["stats"]["total_xp"] == 30


def test_attempt_is_private(env, student, student2):
    c = env["client"]
    s = c.post("/api/quizzes/start", json={"quiz_slug": "training-beginner"}, headers=student).json()
    r = c.post(f"/api/quizzes/attempts/{s['attempt_id']}/check",
               json={"question_id": s["questions"][0]["id"], "answer": 1}, headers=student2)
    assert r.status_code == 404


def test_final_locked_until_all_levels(env, student):
    r = env["client"].post("/api/quizzes/start", json={"quiz_slug": "final-challenge"}, headers=student)
    assert r.status_code == 403


def test_full_journey_final_and_badges(env, student):
    c, repo = env["client"], env["repo"]
    for slug, level in LESSONS:
        assert do_lesson(env, student, slug, level).status_code == 200

    bad = c.post("/api/quizzes/start", json={"quiz_slug": "final-challenge", "count": 7}, headers=student)
    assert bad.status_code == 422
    s = c.post("/api/quizzes/start", json={"quiz_slug": "final-challenge", "count": 10, "timed": True},
               headers=student).json()
    assert s["mode"] == "exam" and len(s["questions"]) == 10 and s["time_limit_seconds"] == 900
    # Tidak ada umpan balik saat evaluasi berlangsung
    chk = c.post(f"/api/quizzes/attempts/{s['attempt_id']}/check",
                 json={"question_id": s["questions"][0]["id"], "answer": 1}, headers=student)
    assert chk.status_code == 400

    answers = {q["id"]: key_for(repo, q["id"]) for q in s["questions"]}
    wrong_id = s["questions"][0]["id"]
    answers[wrong_id] = wrong_for(repo, wrong_id)
    del answers[s["questions"][1]["id"]]  # satu soal tidak dijawab
    res = c.post(f"/api/quizzes/attempts/{s['attempt_id']}/submit",
                 json={"answers": answers, "reasons": {wrong_id: "karena n kali n"}}, headers=student).json()
    assert res["correct"] == 8 and res["total"] == 10 and res["score_pct"] == 80.0
    assert res["xp_awarded"] == 80
    assert len(res["review"]) == 10 and res["review"][0]["correct"] is False
    assert res["review"][0]["reason"] == "karena n kali n"
    assert res["review"][1]["your_answer_label"] == "Tidak dijawab"
    slugs = {a["slug"] for a in res["new_achievements"]}
    assert "adventure-champion" in slugs and "perfect-square" not in slugs

    assert c.post(f"/api/quizzes/attempts/{s['attempt_id']}/submit", json={"answers": answers},
                  headers=student).status_code == 409
    rv = c.get(f"/api/quizzes/attempts/{s['attempt_id']}/review", headers=student).json()
    assert rv["score_pct"] == 80.0 and len(rv["review"]) == 10

    stats = res["stats"]
    assert stats["lessons_completed"] == 4 and stats["total_xp"] == 200 + 80
    owned = {a["achievement_id"] for a in repo.list_user_achievements(stats["user_id"])}
    owned_slugs = {a["slug"] for a in repo.list_achievements() if a["id"] in owned}
    assert {"first-adventure", "pattern-explorer", "number-detective", "formula-master",
            "math-adventurer", "adventure-champion"} <= owned_slugs
