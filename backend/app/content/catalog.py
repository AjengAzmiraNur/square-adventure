"""Katalog level materi, permainan, lencana, dan level petualang."""

LESSONS = [
    {"slug": "kenali-polanya", "level": 1, "title": "Kenali Polanya",
     "topic": "Mengenal Pola Bilangan Persegi", "xp_reward": 50},
    {"slug": "lengkapi-pola", "level": 2, "title": "Lengkapi Pola",
     "topic": "Menentukan Suku Berikutnya", "xp_reward": 50},
    {"slug": "temukan-rumus", "level": 3, "title": "Temukan Rumus",
     "topic": "Rumus Pola Bilangan Persegi", "xp_reward": 50},
    {"slug": "tantangan-matematika", "level": 4, "title": "Tantangan Matematika",
     "topic": "Penerapan Pola Bilangan Persegi", "xp_reward": 50},
]

GAMES = [
    {"slug": "square-hunter", "title": "Square Hunter",
     "description": "Temukan semua susunan yang membentuk persegi.", "max_xp": 40},
    {"slug": "complete-pattern", "title": "Complete the Pattern",
     "description": "Isi bilangan yang hilang pada pola.", "max_xp": 40},
    {"slug": "next-number", "title": "Find the Next Number",
     "description": "Tebak bilangan berikutnya sebelum waktu habis.", "max_xp": 40},
    {"slug": "formula-challenge", "title": "Square Formula Challenge",
     "description": "Bangun persegi dan gunakan rumus Uₙ = n².", "max_xp": 40},
    {"slug": "adventure-quest", "title": "Square Adventure Quest",
     "description": "Buka gerbang demi gerbang menuju Kastel Persegi.", "max_xp": 40},
]

# XP maksimum per jenis kuis. XP hanya diberikan untuk PENINGKATAN skor terbaik.
QUIZ_MAX_XP = {"training": {"beginner": 30, "intermediate": 40, "expert": 50}, "final": 100}

ACHIEVEMENTS = [
    {"slug": "first-adventure", "title": "First Adventure", "icon": "flag",
     "description": "Menyelesaikan misi pertama.", "sort_order": 1},
    {"slug": "pattern-explorer", "title": "Pattern Explorer", "icon": "compass",
     "description": "Menyelesaikan materi Level 01 — Kenali Polanya.", "sort_order": 2},
    {"slug": "number-detective", "title": "Number Detective", "icon": "search",
     "description": "Berhasil melengkapi pola pada Level 02 — Lengkapi Pola.", "sort_order": 3},
    {"slug": "formula-master", "title": "Formula Master", "icon": "sigma",
     "description": "Memahami rumus pola bilangan persegi (Level 03).", "sort_order": 4},
    {"slug": "square-expert", "title": "Square Expert", "icon": "gem",
     "description": "Menyelesaikan Training Expert dengan skor minimal 70.", "sort_order": 5},
    {"slug": "math-adventurer", "title": "Math Adventurer", "icon": "mountain",
     "description": "Menyelesaikan Level 04 — Tantangan Matematika.", "sort_order": 6},
    {"slug": "adventure-champion", "title": "Adventure Champion", "icon": "trophy",
     "description": "Menyelesaikan Final Challenge.", "sort_order": 7},
    {"slug": "playground-hero", "title": "Playground Hero", "icon": "gamepad",
     "description": "Memainkan kelima permainan di Square Playground.", "sort_order": 8},
    {"slug": "perfect-square", "title": "Perfect Square", "icon": "star",
     "description": "Meraih skor 100 pada Final Challenge.", "sort_order": 9},
]

ADVENTURER_LEVELS = [
    (0, "Petualang Pemula"),
    (80, "Penjelajah Kotak"),
    (180, "Pencari Pola"),
    (300, "Detektif Bilangan"),
    (450, "Ahli Rumus"),
    (600, "Juara Persegi"),
]


def level_for_xp(xp: int) -> int:
    level = 1
    for i, (threshold, _name) in enumerate(ADVENTURER_LEVELS):
        if xp >= threshold:
            level = i + 1
    return level


def stars_for_pct(pct: float) -> int:
    if pct >= 90:
        return 3
    if pct >= 70:
        return 2
    if pct >= 40:
        return 1
    return 0
