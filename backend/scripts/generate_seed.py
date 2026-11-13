"""Membuat supabase/seed.sql dari konten Python (sumber kebenaran tunggal).

Jalankan dari folder backend:
    python -m scripts.generate_seed
"""

from __future__ import annotations

import json
from pathlib import Path

from app.content.catalog import ACHIEVEMENTS, GAMES, LESSONS
from app.content.questions import QUESTIONS_BY_QUIZ, QUIZZES

OUT = Path(__file__).resolve().parents[2] / "supabase" / "seed.sql"


def lit(value) -> str:
    if value is None:
        return "null"
    if isinstance(value, bool):
        return "true" if value else "false"
    if isinstance(value, (int, float)):
        return str(value)
    return "'" + str(value).replace("'", "''") + "'"


def jlit(value) -> str:
    if value is None:
        return "null"
    return lit(json.dumps(value, ensure_ascii=False)) + "::jsonb"


def build() -> str:
    out = ["-- SQUARE ADVENTURE — seed data (dibuat otomatis oleh backend/scripts/generate_seed.py)",
           "-- Aman dijalankan berulang kali (upsert).", "begin;", ""]

    out.append("-- Level materi")
    for l in LESSONS:
        out.append(
            "insert into public.lessons (slug, level, title, topic, xp_reward) values "
            f"({lit(l['slug'])}, {l['level']}, {lit(l['title'])}, {lit(l['topic'])}, {l['xp_reward']}) "
            "on conflict (slug) do update set level = excluded.level, title = excluded.title, "
            "topic = excluded.topic, xp_reward = excluded.xp_reward;")

    out += ["", "-- Kuis"]
    for q in QUIZZES:
        out.append(
            "insert into public.quizzes (slug, kind, title, difficulty, lesson_slug, default_count) values "
            f"({lit(q['slug'])}, {lit(q['kind'])}, {lit(q['title'])}, {lit(q['difficulty'])}, "
            f"{lit(q['lesson_slug'])}, {q['default_count']}) "
            "on conflict (slug) do update set kind = excluded.kind, title = excluded.title, "
            "difficulty = excluded.difficulty, lesson_slug = excluded.lesson_slug, "
            "default_count = excluded.default_count;")

    out += ["", "-- Bank soal"]
    for quiz_slug, questions in QUESTIONS_BY_QUIZ.items():
        for pos, q in enumerate(questions, start=1):
            out.append(
                "insert into public.quiz_questions (quiz_id, code, position, type, prompt, visual, options, "
                "answer, hint, explanation, skill, ask_reason) values ("
                f"(select id from public.quizzes where slug = {lit(quiz_slug)}), {lit(q['code'])}, {pos}, "
                f"{lit(q['type'])}, {lit(q['prompt'])}, {jlit(q['visual'])}, {jlit(q['options'])}, "
                f"{jlit(q['answer'])}, {lit(q['hint'])}, {jlit(q['explanation'])}, {lit(q['skill'])}, "
                f"{lit(q['ask_reason'])}) "
                "on conflict (code) do update set quiz_id = excluded.quiz_id, position = excluded.position, "
                "type = excluded.type, prompt = excluded.prompt, visual = excluded.visual, "
                "options = excluded.options, answer = excluded.answer, hint = excluded.hint, "
                "explanation = excluded.explanation, skill = excluded.skill, ask_reason = excluded.ask_reason;")

    out += ["", "-- Permainan"]
    for g in GAMES:
        out.append(
            "insert into public.games (slug, title, description, max_xp) values "
            f"({lit(g['slug'])}, {lit(g['title'])}, {lit(g['description'])}, {g['max_xp']}) "
            "on conflict (slug) do update set title = excluded.title, description = excluded.description, "
            "max_xp = excluded.max_xp;")

    out += ["", "-- Lencana"]
    for a in ACHIEVEMENTS:
        out.append(
            "insert into public.achievements (slug, title, description, icon, sort_order) values "
            f"({lit(a['slug'])}, {lit(a['title'])}, {lit(a['description'])}, {lit(a['icon'])}, {a['sort_order']}) "
            "on conflict (slug) do update set title = excluded.title, description = excluded.description, "
            "icon = excluded.icon, sort_order = excluded.sort_order;")

    out += ["", "commit;", ""]
    return "\n".join(out)


if __name__ == "__main__":
    OUT.write_text(build(), encoding="utf-8")
    print(f"Seed ditulis ke {OUT}")
