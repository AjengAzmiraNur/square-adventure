// Cermin tabel level di backend (app/content/catalog.py). Nilai level resmi dihitung server.
export const ADVENTURER_LEVELS = [
  { min: 0, name: 'Petualang Pemula' },
  { min: 80, name: 'Penjelajah Kotak' },
  { min: 180, name: 'Pencari Pola' },
  { min: 300, name: 'Detektif Bilangan' },
  { min: 450, name: 'Ahli Rumus' },
  { min: 600, name: 'Juara Persegi' },
]

export function levelInfo(xp = 0) {
  let idx = 0
  ADVENTURER_LEVELS.forEach((l, i) => {
    if (xp >= l.min) idx = i
  })
  const current = ADVENTURER_LEVELS[idx]
  const next = ADVENTURER_LEVELS[idx + 1] || null
  const progress = next ? Math.round(((xp - current.min) / (next.min - current.min)) * 100) : 100
  return { level: idx + 1, name: current.name, min: current.min, next: next ? next.min : null, progress }
}

export const REGIONS = {
  'kenali-polanya': { region: 'Lembah Kotak', color: '#6EE7B7' },
  'lengkapi-pola': { region: 'Hutan Pola', color: '#60A5FA' },
  'temukan-rumus': { region: 'Gua Rumus', color: '#A78BFA' },
  'tantangan-matematika': { region: 'Puncak Tantangan', color: '#FACC15' },
}

export const ACTIVITY_LABEL = {
  login: 'Masuk',
  lesson: 'Materi',
  lesson_check: 'Latihan Singkat',
  training: 'Latihan Soal',
  final: 'Evaluasi Akhir',
  game: 'Permainan',
  achievement: 'Lencana',
}
