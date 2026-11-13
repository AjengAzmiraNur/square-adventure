"""Generator ronde dan pemeriksa jawaban untuk lima permainan SQUARE PLAYGROUND.

Ronde dibuat di server agar kunci jawaban tidak pernah berada di browser
sebelum siswa menjawab. Setiap ronde berbentuk:

    {"kind": ..., "public": {...}, "answer": ..., "hint": str,
     "explanation": [str, ...], "points": int}
"""

from __future__ import annotations

import random
import re
from typing import Any

GAME_CONFIG: dict[str, dict[str, Any]] = {
    "square-hunter": {"max_tries": 1, "time_limit": None, "difficulties": None},
    "complete-pattern": {"max_tries": 2, "time_limit": None, "difficulties": None},
    "next-number": {"max_tries": 1, "time_limit": 60, "difficulties": ["mudah", "sedang", "sulit"]},
    "formula-challenge": {"max_tries": 2, "time_limit": None, "difficulties": None},
    "adventure-quest": {"max_tries": 2, "time_limit": None, "difficulties": None},
}

HINT_FACTOR = 0.75
SECOND_TRY_FACTOR = 0.5


class AnswerFormatError(ValueError):
    pass


# --------------------------------------------------------------------------
# Game 1 — SQUARE HUNTER
# --------------------------------------------------------------------------
_TRICKY = [(1, 4), (4, 1), (1, 9), (9, 1), (2, 8), (8, 2)]  # luasnya bilangan persegi, bentuknya bukan


def _square_hunter(rng: random.Random, _difficulty):
    rounds = []
    for r in range(5):
        n_squares = 2 if r < 2 else 3
        sizes = rng.sample(range(1, 7), n_squares)
        cards = [(s, s) for s in sizes]
        tricky = rng.choice(_TRICKY)
        cards.append(tricky)
        while len(cards) < 6:
            a, b = rng.randint(1, 6), rng.randint(1, 6)
            if a != b and (a, b) not in cards:
                cards.append((a, b))
        rng.shuffle(cards)
        answer = sorted(i for i, (a, b) in enumerate(cards) if a == b)
        squares_txt = ", ".join(f"{a} × {b} ({a * b} kotak)" for a, b in cards if a == b)
        ta, tb = tricky
        rounds.append({
            "kind": "select_squares",
            "public": {"cards": [{"rows": a, "cols": b} for a, b in cards],
                       "instruction": "Pilih SEMUA susunan yang berbentuk persegi."},
            "answer": answer,
            "hint": "Persegi selalu memiliki banyak baris = banyak kolom.",
            "explanation": [
                f"Susunan yang berbentuk persegi: {squares_txt}.",
                "Baris dan kolomnya sama banyak, jadi bentuknya persegi.",
                f"Hati-hati dengan {ta} × {tb}: banyak kotaknya {ta * tb} (bilangan persegi), "
                "tetapi bentuknya persegi panjang.",
            ],
            "points": 20,
        })
    return rounds


# --------------------------------------------------------------------------
# Game 2 — COMPLETE THE PATTERN
# --------------------------------------------------------------------------
def _complete_pattern(rng: random.Random, _difficulty):
    plan = [((1, 1), 1), ((1, 3), 1), ((2, 5), 2), ((4, 8), 2), ((6, 10), 3)]
    rounds = []
    for (lo, hi), n_blanks in plan:
        start = rng.randint(lo, hi)
        ns = list(range(start, start + 6))
        values = [n * n for n in ns]
        # Sisakan minimal dua angka berurutan yang terlihat agar pola dapat dikenali.
        keep = rng.randint(0, 4)
        candidates = [i for i in range(6) if i not in (keep, keep + 1)]
        blanks = sorted(rng.sample(candidates, n_blanks))
        items = [None if i in blanks else v for i, v in enumerate(values)]
        rounds.append({
            "kind": "fill_sequence",
            "public": {"items": items, "instruction": "Isi kotak kosong dengan bilangan persegi yang tepat."},
            "answer": [values[i] for i in blanks],
            "hint": "Ubah bilangan yang terlihat menjadi bentuk n × n, misalnya "
                    f"{values[keep]} = {ns[keep]} × {ns[keep]}. Lalu lanjutkan urutannya.",
            "explanation": [
                "Tulis setiap suku sebagai n²: " + ", ".join(f"{n}² = {n * n}" for n in ns) + ".",
                "Bilangan yang hilang: " + ", ".join(f"{ns[i]}² = {values[i]}" for i in blanks) + ".",
                "Cara lain: selisih antarsuku adalah bilangan ganjil berurutan.",
            ],
            "points": 20,
        })
    return rounds


# --------------------------------------------------------------------------
# Game 3 — FIND THE NEXT NUMBER (bertingkat, berbatas waktu)
# --------------------------------------------------------------------------
def _next_mudah(rng):
    n0 = rng.randint(1, 6)
    ns = list(range(n0, n0 + 4))
    nxt = n0 + 4
    return ([n * n for n in ns], nxt * nxt,
            "Ubah setiap bilangan menjadi n × n.",
            [", ".join(f"{n}² = {n * n}" for n in ns) + ".", f"Berikutnya {nxt}² = {nxt * nxt}."])


def _next_sedang(rng):
    if rng.random() < 0.5:
        n0 = rng.randint(6, 12)
        ns = [n0, n0 + 1, n0 + 2]
        nxt = n0 + 3
        return ([n * n for n in ns], nxt * nxt, "Bilangannya besar, tapi tetap n × n. Cari n-nya!",
                [", ".join(f"{n}² = {n * n}" for n in ns) + ".", f"Berikutnya {nxt}² = {nxt * nxt}."])
    m = rng.randint(7, 12)
    ns = [m, m - 1, m - 2]
    nxt = m - 3
    return ([n * n for n in ns], nxt * nxt, "Perhatikan: polanya MENURUN.",
            [", ".join(f"{n}² = {n * n}" for n in ns) + " (n berkurang 1).",
             f"Berikutnya {nxt}² = {nxt * nxt}."])


def _next_sulit(rng):
    kind = rng.choice(["genap", "ganjil", "plus1", "minus1"])
    if kind == "genap":
        k = rng.randint(1, 3)
        ns = [2 * (k + i) for i in range(4)]
        nxt = 2 * (k + 4)
        return ([n * n for n in ns], nxt * nxt, "Coba lihat bilangan yang dikuadratkan: 2, 4, 6, ...?",
                [", ".join(f"{n}²" for n in ns) + " → kuadrat bilangan genap.", f"Berikutnya {nxt}² = {nxt * nxt}."])
    if kind == "ganjil":
        k = rng.randint(0, 2)
        ns = [2 * (k + i) + 1 for i in range(4)]
        nxt = 2 * (k + 4) + 1
        return ([n * n for n in ns], nxt * nxt, "Coba lihat bilangan yang dikuadratkan: 1, 3, 5, ...?",
                [", ".join(f"{n}²" for n in ns) + " → kuadrat bilangan ganjil.", f"Berikutnya {nxt}² = {nxt * nxt}."])
    if kind == "plus1":
        n0 = rng.randint(1, 5)
        ns = list(range(n0, n0 + 4))
        nxt = n0 + 4
        return ([n * n + 1 for n in ns], nxt * nxt + 1, "Setiap bilangan = bilangan persegi + 1.",
                [", ".join(f"{n}² + 1" for n in ns) + ".", f"Berikutnya {nxt}² + 1 = {nxt * nxt + 1}."])
    n0 = rng.randint(2, 6)
    ns = list(range(n0, n0 + 4))
    nxt = n0 + 4
    return ([n * n - 1 for n in ns], nxt * nxt - 1, "Setiap bilangan = bilangan persegi − 1.",
            [", ".join(f"{n}² − 1" for n in ns) + ".", f"Berikutnya {nxt}² − 1 = {nxt * nxt - 1}."])


def _next_number(rng: random.Random, difficulty):
    gen = {"mudah": _next_mudah, "sedang": _next_sedang, "sulit": _next_sulit}[difficulty or "mudah"]
    rounds = []
    for _ in range(8):
        seq, ans, hint, expl = gen(rng)
        rounds.append({
            "kind": "number",
            "public": {"sequence": seq, "instruction": "Bilangan berikutnya adalah ..."},
            "answer": ans, "hint": hint, "explanation": expl, "points": 10,
        })
    return rounds


# --------------------------------------------------------------------------
# Game 4 — SQUARE FORMULA CHALLENGE
# --------------------------------------------------------------------------
def _formula_challenge(rng: random.Random, _difficulty):
    def compute(n, pts):
        return {"kind": "number",
                "public": {"mode": "compute", "n": n, "instruction": f"Hitung U{_sub(n)} dengan rumus Uₙ = n²."},
                "answer": n * n, "hint": f"U{_sub(n)} berarti n = {n}. Hitung {n} × {n}.",
                "explanation": [f"Diketahui n = {n}.", f"U{_sub(n)} = {n}² = {n} × {n} = {n * n}."],
                "points": pts}

    def build(n, pts):
        t = n * n
        return {"kind": "build",
                "public": {"mode": "build", "target": t,
                           "instruction": f"Bangun persegi yang berisi tepat {t} kotak."},
                "answer": n, "hint": f"Cari n sehingga n × n = {t}.",
                "explanation": [f"{n} × {n} = {t}.", f"Jadi, persegi bersisi {n} berisi {t} kotak (suku ke-{n})."],
                "points": pts}

    def find_n(n, pts):
        t = n * n
        return {"kind": "number",
                "public": {"mode": "find_n", "value": t,
                           "instruction": f"Bilangan {t} adalah suku ke berapa?"},
                "answer": n, "hint": f"Cari bilangan yang jika dikalikan dirinya sendiri hasilnya {t}.",
                "explanation": [f"Kita mencari n dengan n² = {t}.", f"{n} × {n} = {t}, jadi n = {n}."],
                "points": pts}

    return [
        compute(rng.randint(3, 6), 15),
        compute(rng.randint(7, 9), 15),
        build(rng.randint(3, 6), 15),
        build(rng.randint(7, 10), 15),
        compute(rng.randint(11, 20), 20),
        find_n(rng.randint(10, 20), 20),
    ]


# --------------------------------------------------------------------------
# Game 5 — SQUARE ADVENTURE QUEST
# --------------------------------------------------------------------------
def _adventure_quest(rng: random.Random, _difficulty):
    s = rng.randint(4, 9)
    k = rng.randint(6, 10)
    m = rng.randint(8, 12)
    c = rng.randint(5, 10)
    big = rng.randint(6, 9)
    extra = rng.randint(1, 2 * big)
    total = big * big + extra
    return [
        {"kind": "number", "public": {
            "gate": "Gerbang Desa Ubin",
            "story": f"Jalan menuju desa tertutup. Penjaga meminta ubin untuk lantai persegi dengan {s} ubin di setiap sisi.",
            "question": "Berapa banyak ubin yang dibutuhkan?", "unit": "ubin"},
         "answer": s * s, "hint": f"Sisi {s} ubin berarti {s} baris dan {s} kolom.",
         "explanation": [f"Diketahui: sisi = {s} ubin.", f"Banyak ubin = {s} × {s} = {s * s}.",
                         f"Jadi, dibutuhkan {s * s} ubin."], "points": 20},
        {"kind": "number", "public": {
            "gate": "Hutan Taman Persegi",
            "story": "Peri taman menanam bunga: susunan ke-1 ada 1 bunga, ke-2 ada 4 bunga, ke-3 ada 9 bunga.",
            "question": f"Berapa banyak bunga pada susunan ke-{k}?", "unit": "bunga"},
         "answer": k * k, "hint": f"Pola 1, 4, 9 adalah pola bilangan persegi. Gunakan Uₙ = n² dengan n = {k}.",
         "explanation": ["1, 4, 9, ... adalah pola bilangan persegi.", f"U{_sub(k)} = {k}² = {k * k}.",
                         f"Jadi, ada {k * k} bunga."], "points": 20},
        {"kind": "number", "public": {
            "gate": "Jembatan Lampu",
            "story": f"Jembatan akan menyala jika {m * m} lampu disusun membentuk persegi.",
            "question": "Berapa lampu di setiap sisi persegi tersebut?", "unit": "lampu"},
         "answer": m, "hint": f"Cari n sehingga n × n = {m * m}.",
         "explanation": [f"Diketahui: total lampu = {m * m}.", f"{m} × {m} = {m * m}.",
                         f"Jadi, ada {m} lampu di setiap sisi."], "points": 20},
        {"kind": "number", "public": {
            "gate": "Menara Kursi",
            "story": f"Di menara terdapat kursi yang disusun persegi {c} × {c}. Raja ingin menambah 1 baris dan 1 kolom agar tetap persegi.",
            "question": "Berapa kursi tambahan yang dibutuhkan?", "unit": "kursi"},
         "answer": (c + 1) ** 2 - c * c,
         "hint": f"Hitung kursi pada susunan {c + 1} × {c + 1}, lalu kurangi dengan {c} × {c}.",
         "explanation": [f"Sekarang: {c} × {c} = {c * c} kursi.", f"Nanti: {c + 1} × {c + 1} = {(c + 1) ** 2} kursi.",
                         f"Tambahan = {(c + 1) ** 2} − {c * c} = {(c + 1) ** 2 - c * c} kursi."], "points": 20},
        {"kind": "number", "public": {
            "gate": "Kastel Persegi",
            "story": f"Pintu kastel terbuka jika kamu membangun persegi TERBESAR dari {total} balok.",
            "question": "Persegi terbesar itu adalah susunan ke berapa?", "unit": ""},
         "answer": big, "hint": f"Bandingkan {total} dengan {big}² dan {big + 1}².",
         "explanation": [f"{big}² = {big * big} ≤ {total} (cukup).",
                         f"{big + 1}² = {(big + 1) ** 2} > {total} (tidak cukup).",
                         f"Jadi, persegi terbesar adalah susunan ke-{big} dan tersisa {extra} balok."],
         "points": 20},
    ]


_SUBSCRIPT = str.maketrans("0123456789", "₀₁₂₃₄₅₆₇₈₉")


def _sub(n: int) -> str:
    return str(n).translate(_SUBSCRIPT)


GENERATORS = {
    "square-hunter": _square_hunter,
    "complete-pattern": _complete_pattern,
    "next-number": _next_number,
    "formula-challenge": _formula_challenge,
    "adventure-quest": _adventure_quest,
}


def generate_rounds(slug: str, difficulty: str | None, rng: random.Random | None = None) -> list[dict]:
    rng = rng or random.Random()
    return GENERATORS[slug](rng, difficulty)


def public_round(index: int, rnd: dict) -> dict:
    return {"index": index, "kind": rnd["kind"], "points": rnd["points"], **rnd["public"]}


def normalize_answer(rnd: dict, raw: Any) -> Any:
    kind = rnd["kind"]
    try:
        if kind in ("number", "build"):
            return _to_int(raw)
        if kind == "fill_sequence":
            values = [_to_int(v) for v in raw]
            if len(values) != len(rnd["answer"]):
                raise AnswerFormatError("Isi semua kotak kosong.")
            return values
        if kind == "select_squares":
            n_cards = len(rnd["public"]["cards"])
            picked = sorted({_to_int(v) for v in raw})
            if any(not 0 <= v < n_cards for v in picked):
                raise AnswerFormatError("Pilihan tidak valid.")
            return picked
    except TypeError as exc:
        raise AnswerFormatError("Format jawaban tidak valid.") from exc
    raise AnswerFormatError("Jenis ronde tidak dikenal.")


def _to_int(raw: Any) -> int:
    if isinstance(raw, bool) or raw is None:
        raise AnswerFormatError("Jawaban harus berupa bilangan bulat.")
    if isinstance(raw, int):
        return raw
    text = str(raw).strip()
    if not re.fullmatch(r"-?[0-9]{1,9}", text):
        raise AnswerFormatError("Jawaban harus berupa bilangan bulat.")
    return int(text)


def is_correct(rnd: dict, answer: Any) -> bool:
    return answer == rnd["answer"]


def points_for(rnd: dict, tries: int, hint_used: bool) -> int:
    pts = rnd["points"]
    if tries > 1:
        pts *= SECOND_TRY_FACTOR
    if hint_used:
        pts *= HINT_FACTOR
    return int(round(pts))
