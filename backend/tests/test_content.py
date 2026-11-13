"""Validasi kebenaran matematis dan kelengkapan bank soal."""

import math

from app.content.questions import QUESTIONS_BY_QUIZ

ALL = [q for qs in QUESTIONS_BY_QUIZ.values() for q in qs]
BY_CODE = {q["code"]: q for q in ALL}

# Jawaban soal isian angka dihitung ulang secara independen.
EXPECTED_NUMBER = {
    "L1-1": 3 * 3, "L2-3": 25 + 11, "L3-1": 7 ** 2, "L3-3": math.isqrt(64),
    "L4-1": 7 ** 2, "L4-2": math.isqrt(100),
    "TB-01": 2 ** 2, "TB-02": 5 ** 2, "TB-08": 6 ** 2, "TB-12": 4 ** 2,
    "TI-03": 25 - 16, "TI-05": 9 ** 2, "TI-07": 7 ** 2 - 6 ** 2, "TI-11": 8 ** 2 - 7 ** 2,
    "TE-01": 9 ** 2, "TE-02": 12 ** 2, "TE-03": math.isqrt(225), "TE-05": 8 ** 2, "TE-06": 10 ** 2,
    "TE-07": math.isqrt(144), "TE-09": 10 ** 2 - 9 ** 2, "TE-12": 10 ** 2 - 9 ** 2,
    "FC-01": 4 ** 2, "FC-06": 11 ** 2, "FC-08": 2 * 5 + 1, "FC-10": 11 ** 2, "FC-11": 15 ** 2,
    "FC-12": math.isqrt(196), "FC-15": 9 ** 2, "FC-16": math.isqrt(121), "FC-17": 7 ** 2, "FC-18": 8 ** 2,
    "FC-20": 12 ** 2 - 30, "FC-23": math.isqrt(400), "FC-24": math.isqrt(50),
}


def is_square(n):
    return n >= 0 and math.isqrt(n) ** 2 == n


def test_codes_unique_and_fields_complete():
    codes = [q["code"] for q in ALL]
    assert len(codes) == len(set(codes))
    for q in ALL:
        assert q["prompt"] and q["hint"] and q["explanation"], q["code"]
        assert q["skill"] in {"identifikasi", "hubungan", "strategi", "konsep", "tafsir", "alasan"}


def test_every_number_question_independently_verified():
    number_codes = {q["code"] for q in ALL if q["type"] == "number"}
    assert number_codes == set(EXPECTED_NUMBER), number_codes ^ set(EXPECTED_NUMBER)
    for code, expected in EXPECTED_NUMBER.items():
        assert BY_CODE[code]["answer"]["value"] == expected, code


def test_choice_answers_in_range():
    for q in ALL:
        if q["type"] in ("mcq", "grid_choice"):
            assert 0 <= q["answer"]["index"] < len(q["options"]), q["code"]


def test_grid_choice_answer_is_the_only_square():
    for q in ALL:
        if q["type"] != "grid_choice":
            continue
        squares = [i for i, o in enumerate(q["options"]) if o["rows"] == o["cols"]]
        if q["code"] == "TB-09":  # syarat ganda: persegi DAN berisi 9 kotak
            squares = [i for i in squares if q["options"][i]["rows"] ** 2 == 9]
        assert squares == [q["answer"]["index"]], q["code"]


def test_sequences_are_consecutive_squares():
    for q in ALL:
        if q["type"] != "sequence":
            continue
        items = q["visual"]["items"]
        values = iter(q["answer"]["values"])
        filled = [v if v is not None else next(values) for v in items]
        roots = [math.isqrt(v) for v in filled]
        assert all(is_square(v) for v in filled), q["code"]
        assert roots == list(range(roots[0], roots[0] + len(roots))), q["code"]


def test_true_false_statements():
    expected = {"L1-3": is_square(10), "TB-04": 4 * 4 == 16, "TB-05": False, "TB-10": 1 * 1 == 1,
                "TI-08": True, "TI-12": 10 ** 2 == 90, "TE-11": is_square(50), "FC-03": is_square(36),
                "FC-14": 3 ** 2 == 6, "FC-22": all((n + 1) ** 2 - n ** 2 == 2 * n + 1 for n in range(1, 50))}
    tf_codes = {q["code"] for q in ALL if q["type"] == "tf"}
    assert tf_codes == set(expected)
    for code, value in expected.items():
        assert BY_CODE[code]["answer"]["value"] is value, code


def test_question_counts():
    assert len(QUESTIONS_BY_QUIZ["training-beginner"]) == 12
    assert len(QUESTIONS_BY_QUIZ["training-intermediate"]) == 12
    assert len(QUESTIONS_BY_QUIZ["training-expert"]) == 12
    assert len(QUESTIONS_BY_QUIZ["final-challenge"]) >= 20
