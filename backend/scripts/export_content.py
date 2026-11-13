"""Ekspor konten (bank soal, level, permainan, lencana) ke JSON untuk Mode Tamu di frontend.

Sumber kebenaran tetap backend/app/content. Jalankan dari folder backend:
    python -m scripts.export_content
"""

from __future__ import annotations

import json
from pathlib import Path

from app.content.catalog import ACHIEVEMENTS, ADVENTURER_LEVELS, GAMES, LESSONS, QUIZ_MAX_XP
from app.content.questions import QUESTIONS_BY_QUIZ, QUIZZES

OUT = Path(__file__).resolve().parents[2] / "frontend" / "src" / "content" / "generated" / "content.json"


def build() -> dict:
    questions = []
    for quiz_slug, items in QUESTIONS_BY_QUIZ.items():
        for pos, q in enumerate(items, start=1):
            questions.append({"id": q["code"], "quiz_id": quiz_slug, "position": pos, **q})
    return {
        "lessons": [{"id": l["slug"], **l} for l in LESSONS],
        "quizzes": [{"id": q["slug"], **q} for q in QUIZZES],
        "questions": questions,
        "games": [{"id": g["slug"], **g} for g in GAMES],
        "achievements": [{"id": a["slug"], **a} for a in ACHIEVEMENTS],
        "quiz_max_xp": QUIZ_MAX_XP,
        "levels": [{"min": m, "name": n} for m, n in ADVENTURER_LEVELS],
    }


if __name__ == "__main__":
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(build(), ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"Konten diekspor ke {OUT}")
