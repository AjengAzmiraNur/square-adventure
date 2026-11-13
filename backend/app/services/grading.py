"""Penilaian soal latihan dan evaluasi. Semua penilaian terjadi di server."""

from __future__ import annotations

import re
from typing import Any


class AnswerFormatError(ValueError):
    pass


def public_question(q: dict) -> dict:
    """Data soal yang aman dikirim ke siswa (tanpa kunci, petunjuk, dan pembahasan)."""
    return {
        "id": q["id"],
        "code": q["code"],
        "type": q["type"],
        "prompt": q["prompt"],
        "visual": q.get("visual"),
        "options": q.get("options"),
        "skill": q.get("skill"),
        "ask_reason": bool(q.get("ask_reason")),
        "blanks": _blank_count(q),
    }


def _blank_count(q: dict) -> int | None:
    if q["type"] != "sequence":
        return None
    items = (q.get("visual") or {}).get("items") or []
    return sum(1 for v in items if v is None)


_THOUSANDS = re.compile(r"^-?[0-9]{1,3}(\.[0-9]{3})+$")  # format Indonesia, mis. 1.000


def _to_int(raw: Any) -> int:
    if isinstance(raw, bool) or raw is None:
        raise AnswerFormatError("Jawaban harus berupa bilangan bulat.")
    if isinstance(raw, int):
        return raw
    if isinstance(raw, float):
        if raw.is_integer():
            return int(raw)
        raise AnswerFormatError("Jawaban harus berupa bilangan bulat, bukan desimal.")
    text = str(raw).strip()
    if _THOUSANDS.match(text):
        text = text.replace(".", "")
    if not re.fullmatch(r"-?[0-9]{1,9}", text):
        raise AnswerFormatError("Jawaban harus berupa bilangan bulat.")
    return int(text)


def normalize(q: dict, raw: Any) -> Any:
    """Ubah jawaban mentah menjadi bentuk baku, atau lempar AnswerFormatError."""
    qtype = q["type"]
    if qtype in ("mcq", "grid_choice"):
        idx = _to_int(raw)
        if not 0 <= idx < len(q.get("options") or []):
            raise AnswerFormatError("Pilihan jawaban tidak valid.")
        return idx
    if qtype == "tf":
        if isinstance(raw, bool):
            return raw
        if str(raw).lower() in ("true", "benar"):
            return True
        if str(raw).lower() in ("false", "salah"):
            return False
        raise AnswerFormatError("Pilih Benar atau Salah.")
    if qtype == "number":
        return _to_int(raw)
    if qtype == "sequence":
        if not isinstance(raw, (list, tuple)):
            raise AnswerFormatError("Isi semua kotak kosong.")
        values = [_to_int(v) for v in raw]
        if len(values) != _blank_count(q):
            raise AnswerFormatError("Isi semua kotak kosong.")
        return values
    raise AnswerFormatError("Jenis soal tidak dikenal.")


def is_correct(q: dict, answer: Any) -> bool:
    key = q["answer"]
    qtype = q["type"]
    if qtype in ("mcq", "grid_choice"):
        return answer == key["index"]
    if qtype in ("tf", "number"):
        return answer == key["value"]
    if qtype == "sequence":
        return list(answer) == list(key["values"])
    return False


def answer_label(q: dict, answer: Any) -> str:
    """Teks jawaban yang mudah dibaca untuk pembahasan."""
    if answer is None:
        return "Tidak dijawab"
    qtype = q["type"]
    if qtype == "mcq":
        return q["options"][answer]
    if qtype == "grid_choice":
        o = q["options"][answer]
        return f"Susunan {o['rows']} × {o['cols']}"
    if qtype == "tf":
        return "Benar" if answer else "Salah"
    if qtype == "sequence":
        return ", ".join(str(v) for v in answer)
    return str(answer)


def correct_answer_value(q: dict) -> Any:
    key = q["answer"]
    if q["type"] in ("mcq", "grid_choice"):
        return key["index"]
    if q["type"] == "sequence":
        return key["values"]
    return key["value"]


def review_item(q: dict, response: dict | None) -> dict:
    response = response or {}
    given = response.get("answer")
    correct_value = correct_answer_value(q)
    return {
        **public_question(q),
        "your_answer": given,
        "your_answer_label": answer_label(q, given),
        "correct_answer": correct_value,
        "correct_answer_label": answer_label(q, correct_value),
        "correct": bool(response.get("correct")),
        "explanation": q.get("explanation") or [],
        "hint": q.get("hint"),
        "reason": response.get("reason"),
    }
