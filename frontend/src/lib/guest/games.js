// Port generator permainan dari backend/app/services/games.py untuk Mode Tamu.
// Aturan dan skor sama persis dengan versi server.

export const GAME_CONFIG = {
  'square-hunter': { maxTries: 1, timeLimit: null, difficulties: null },
  'complete-pattern': { maxTries: 2, timeLimit: null, difficulties: null },
  'next-number': { maxTries: 1, timeLimit: 60, difficulties: ['mudah', 'sedang', 'sulit'] },
  'formula-challenge': { maxTries: 2, timeLimit: null, difficulties: null },
  'adventure-quest': { maxTries: 2, timeLimit: null, difficulties: null },
}

const HINT_FACTOR = 0.75
const SECOND_TRY_FACTOR = 0.5

export function makeRng(random = Math.random) {
  const randint = (a, b) => a + Math.floor(random() * (b - a + 1))
  const choice = (arr) => arr[Math.floor(random() * arr.length)]
  const shuffle = (arr) => {
    const a = [...arr]
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1))
      ;[a[i], a[j]] = [a[j], a[i]]
    }
    return a
  }
  const sample = (arr, k) => shuffle(arr).slice(0, k)
  return { randint, choice, shuffle, sample, random }
}

const range = (a, b) => Array.from({ length: b - a }, (_, i) => a + i)
const SUB = '₀₁₂₃₄₅₆₇₈₉'
const sub = (n) => String(n).replace(/[0-9]/g, (d) => SUB[Number(d)])

const TRICKY = [[1, 4], [4, 1], [1, 9], [9, 1], [2, 8], [8, 2]]

function squareHunter(rng) {
  const rounds = []
  for (let r = 0; r < 5; r++) {
    const nSquares = r < 2 ? 2 : 3
    const cards = rng.sample(range(1, 7), nSquares).map((s) => [s, s])
    const tricky = rng.choice(TRICKY)
    cards.push(tricky)
    while (cards.length < 6) {
      const a = rng.randint(1, 6)
      const b = rng.randint(1, 6)
      if (a !== b && !cards.some(([x, y]) => x === a && y === b)) cards.push([a, b])
    }
    const shuffled = rng.shuffle(cards)
    const answer = shuffled.map(([a, b], i) => (a === b ? i : -1)).filter((i) => i >= 0)
    const squaresTxt = shuffled.filter(([a, b]) => a === b).map(([a, b]) => `${a} × ${b} (${a * b} kotak)`).join(', ')
    rounds.push({
      kind: 'select_squares',
      public: { cards: shuffled.map(([rows, cols]) => ({ rows, cols })), instruction: 'Pilih SEMUA susunan yang berbentuk persegi.' },
      answer,
      hint: 'Persegi selalu memiliki banyak baris = banyak kolom.',
      explanation: [
        `Susunan yang berbentuk persegi: ${squaresTxt}.`,
        'Baris dan kolomnya sama banyak, jadi bentuknya persegi.',
        `Hati-hati dengan ${tricky[0]} × ${tricky[1]}: banyak kotaknya ${tricky[0] * tricky[1]} (bilangan persegi), tetapi bentuknya persegi panjang.`,
      ],
      points: 20,
    })
  }
  return rounds
}

function completePattern(rng) {
  const plan = [[[1, 1], 1], [[1, 3], 1], [[2, 5], 2], [[4, 8], 2], [[6, 10], 3]]
  return plan.map(([[lo, hi], nBlanks]) => {
    const start = rng.randint(lo, hi)
    const ns = range(start, start + 6)
    const values = ns.map((n) => n * n)
    const keep = rng.randint(0, 4)
    const candidates = range(0, 6).filter((i) => i !== keep && i !== keep + 1)
    const blanks = rng.sample(candidates, nBlanks).sort((a, b) => a - b)
    return {
      kind: 'fill_sequence',
      public: { items: values.map((v, i) => (blanks.includes(i) ? null : v)), instruction: 'Isi kotak kosong dengan bilangan persegi yang tepat.' },
      answer: blanks.map((i) => values[i]),
      hint: `Ubah bilangan yang terlihat menjadi bentuk n × n, misalnya ${values[keep]} = ${ns[keep]} × ${ns[keep]}. Lalu lanjutkan urutannya.`,
      explanation: [
        `Tulis setiap suku sebagai n²: ${ns.map((n) => `${n}² = ${n * n}`).join(', ')}.`,
        `Bilangan yang hilang: ${blanks.map((i) => `${ns[i]}² = ${values[i]}`).join(', ')}.`,
        'Cara lain: selisih antarsuku adalah bilangan ganjil berurutan.',
      ],
      points: 20,
    }
  })
}

const sqList = (ns) => ns.map((n) => `${n}² = ${n * n}`).join(', ')

function nextMudah(rng) {
  const n0 = rng.randint(1, 6)
  const ns = range(n0, n0 + 4)
  const nxt = n0 + 4
  return [ns.map((n) => n * n), nxt * nxt, 'Ubah setiap bilangan menjadi n × n.', [`${sqList(ns)}.`, `Berikutnya ${nxt}² = ${nxt * nxt}.`]]
}

function nextSedang(rng) {
  if (rng.random() < 0.5) {
    const n0 = rng.randint(6, 12)
    const ns = [n0, n0 + 1, n0 + 2]
    const nxt = n0 + 3
    return [ns.map((n) => n * n), nxt * nxt, 'Bilangannya besar, tapi tetap n × n. Cari n-nya!', [`${sqList(ns)}.`, `Berikutnya ${nxt}² = ${nxt * nxt}.`]]
  }
  const m = rng.randint(7, 12)
  const ns = [m, m - 1, m - 2]
  const nxt = m - 3
  return [ns.map((n) => n * n), nxt * nxt, 'Perhatikan: polanya MENURUN.', [`${sqList(ns)} (n berkurang 1).`, `Berikutnya ${nxt}² = ${nxt * nxt}.`]]
}

function nextSulit(rng) {
  const kind = rng.choice(['genap', 'ganjil', 'plus1', 'minus1'])
  if (kind === 'genap') {
    const k = rng.randint(1, 3)
    const ns = range(0, 4).map((i) => 2 * (k + i))
    const nxt = 2 * (k + 4)
    return [ns.map((n) => n * n), nxt * nxt, 'Coba lihat bilangan yang dikuadratkan: 2, 4, 6, ...?', [`${ns.map((n) => `${n}²`).join(', ')} → kuadrat bilangan genap.`, `Berikutnya ${nxt}² = ${nxt * nxt}.`]]
  }
  if (kind === 'ganjil') {
    const k = rng.randint(0, 2)
    const ns = range(0, 4).map((i) => 2 * (k + i) + 1)
    const nxt = 2 * (k + 4) + 1
    return [ns.map((n) => n * n), nxt * nxt, 'Coba lihat bilangan yang dikuadratkan: 1, 3, 5, ...?', [`${ns.map((n) => `${n}²`).join(', ')} → kuadrat bilangan ganjil.`, `Berikutnya ${nxt}² = ${nxt * nxt}.`]]
  }
  if (kind === 'plus1') {
    const n0 = rng.randint(1, 5)
    const ns = range(n0, n0 + 4)
    const nxt = n0 + 4
    return [ns.map((n) => n * n + 1), nxt * nxt + 1, 'Setiap bilangan = bilangan persegi + 1.', [`${ns.map((n) => `${n}² + 1`).join(', ')}.`, `Berikutnya ${nxt}² + 1 = ${nxt * nxt + 1}.`]]
  }
  const n0 = rng.randint(2, 6)
  const ns = range(n0, n0 + 4)
  const nxt = n0 + 4
  return [ns.map((n) => n * n - 1), nxt * nxt - 1, 'Setiap bilangan = bilangan persegi − 1.', [`${ns.map((n) => `${n}² − 1`).join(', ')}.`, `Berikutnya ${nxt}² − 1 = ${nxt * nxt - 1}.`]]
}

function nextNumber(rng, difficulty) {
  const gen = { mudah: nextMudah, sedang: nextSedang, sulit: nextSulit }[difficulty || 'mudah']
  return range(0, 8).map(() => {
    const [seq, ans, hint, expl] = gen(rng)
    return { kind: 'number', public: { sequence: seq, instruction: 'Bilangan berikutnya adalah ...' }, answer: ans, hint, explanation: expl, points: 10 }
  })
}

function formulaChallenge(rng) {
  const compute = (n, pts) => ({
    kind: 'number',
    public: { mode: 'compute', n, instruction: `Hitung U${sub(n)} dengan rumus Uₙ = n².` },
    answer: n * n,
    hint: `U${sub(n)} berarti n = ${n}. Hitung ${n} × ${n}.`,
    explanation: [`Diketahui n = ${n}.`, `U${sub(n)} = ${n}² = ${n} × ${n} = ${n * n}.`],
    points: pts,
  })
  const build = (n, pts) => ({
    kind: 'build',
    public: { mode: 'build', target: n * n, instruction: `Bangun persegi yang berisi tepat ${n * n} kotak.` },
    answer: n,
    hint: `Cari n sehingga n × n = ${n * n}.`,
    explanation: [`${n} × ${n} = ${n * n}.`, `Jadi, persegi bersisi ${n} berisi ${n * n} kotak (suku ke-${n}).`],
    points: pts,
  })
  const findN = (n, pts) => ({
    kind: 'number',
    public: { mode: 'find_n', value: n * n, instruction: `Bilangan ${n * n} adalah suku ke berapa?` },
    answer: n,
    hint: `Cari bilangan yang jika dikalikan dirinya sendiri hasilnya ${n * n}.`,
    explanation: [`Kita mencari n dengan n² = ${n * n}.`, `${n} × ${n} = ${n * n}, jadi n = ${n}.`],
    points: pts,
  })
  return [compute(rng.randint(3, 6), 15), compute(rng.randint(7, 9), 15), build(rng.randint(3, 6), 15), build(rng.randint(7, 10), 15), compute(rng.randint(11, 20), 20), findN(rng.randint(10, 20), 20)]
}

function adventureQuest(rng) {
  const s = rng.randint(4, 9)
  const k = rng.randint(6, 10)
  const m = rng.randint(8, 12)
  const c = rng.randint(5, 10)
  const big = rng.randint(6, 9)
  const extra = rng.randint(1, 2 * big)
  const total = big * big + extra
  const c1 = (c + 1) ** 2
  return [
    {
      kind: 'number',
      public: { gate: 'Gerbang Desa Ubin', story: `Jalan menuju desa tertutup. Penjaga meminta ubin untuk lantai persegi dengan ${s} ubin di setiap sisi.`, question: 'Berapa banyak ubin yang dibutuhkan?', unit: 'ubin' },
      answer: s * s,
      hint: `Sisi ${s} ubin berarti ${s} baris dan ${s} kolom.`,
      explanation: [`Diketahui: sisi = ${s} ubin.`, `Banyak ubin = ${s} × ${s} = ${s * s}.`, `Jadi, dibutuhkan ${s * s} ubin.`],
      points: 20,
    },
    {
      kind: 'number',
      public: { gate: 'Hutan Taman Persegi', story: 'Peri taman menanam bunga: susunan ke-1 ada 1 bunga, ke-2 ada 4 bunga, ke-3 ada 9 bunga.', question: `Berapa banyak bunga pada susunan ke-${k}?`, unit: 'bunga' },
      answer: k * k,
      hint: `Pola 1, 4, 9 adalah pola bilangan persegi. Gunakan Uₙ = n² dengan n = ${k}.`,
      explanation: ['1, 4, 9, ... adalah pola bilangan persegi.', `U${sub(k)} = ${k}² = ${k * k}.`, `Jadi, ada ${k * k} bunga.`],
      points: 20,
    },
    {
      kind: 'number',
      public: { gate: 'Jembatan Lampu', story: `Jembatan akan menyala jika ${m * m} lampu disusun membentuk persegi.`, question: 'Berapa lampu di setiap sisi persegi tersebut?', unit: 'lampu' },
      answer: m,
      hint: `Cari n sehingga n × n = ${m * m}.`,
      explanation: [`Diketahui: total lampu = ${m * m}.`, `${m} × ${m} = ${m * m}.`, `Jadi, ada ${m} lampu di setiap sisi.`],
      points: 20,
    },
    {
      kind: 'number',
      public: { gate: 'Menara Kursi', story: `Di menara terdapat kursi yang disusun persegi ${c} × ${c}. Raja ingin menambah 1 baris dan 1 kolom agar tetap persegi.`, question: 'Berapa kursi tambahan yang dibutuhkan?', unit: 'kursi' },
      answer: c1 - c * c,
      hint: `Hitung kursi pada susunan ${c + 1} × ${c + 1}, lalu kurangi dengan ${c} × ${c}.`,
      explanation: [`Sekarang: ${c} × ${c} = ${c * c} kursi.`, `Nanti: ${c + 1} × ${c + 1} = ${c1} kursi.`, `Tambahan = ${c1} − ${c * c} = ${c1 - c * c} kursi.`],
      points: 20,
    },
    {
      kind: 'number',
      public: { gate: 'Kastel Persegi', story: `Pintu kastel terbuka jika kamu membangun persegi TERBESAR dari ${total} balok.`, question: 'Persegi terbesar itu adalah susunan ke berapa?', unit: '' },
      answer: big,
      hint: `Bandingkan ${total} dengan ${big}² dan ${big + 1}².`,
      explanation: [`${big}² = ${big * big} ≤ ${total} (cukup).`, `${big + 1}² = ${(big + 1) ** 2} > ${total} (tidak cukup).`, `Jadi, persegi terbesar adalah susunan ke-${big} dan tersisa ${extra} balok.`],
      points: 20,
    },
  ]
}

const GENERATORS = {
  'square-hunter': squareHunter,
  'complete-pattern': completePattern,
  'next-number': nextNumber,
  'formula-challenge': formulaChallenge,
  'adventure-quest': adventureQuest,
}

export const generateRounds = (slug, difficulty, rng = makeRng()) => GENERATORS[slug](rng, difficulty)

export const publicRound = (index, r) => ({ index, kind: r.kind, points: r.points, ...r.public })

export class AnswerFormatError extends Error {}

const toInt = (raw) => {
  if (typeof raw === 'boolean' || raw == null) throw new AnswerFormatError('Jawaban harus berupa bilangan bulat.')
  const text = String(raw).trim()
  if (!/^-?[0-9]{1,9}$/.test(text)) throw new AnswerFormatError('Jawaban harus berupa bilangan bulat.')
  return Number(text)
}

export function normalizeAnswer(r, raw) {
  if (r.kind === 'number' || r.kind === 'build') return toInt(raw)
  if (!Array.isArray(raw)) throw new AnswerFormatError('Format jawaban tidak valid.')
  if (r.kind === 'fill_sequence') {
    const v = raw.map(toInt)
    if (v.length !== r.answer.length) throw new AnswerFormatError('Isi semua kotak kosong.')
    return v
  }
  if (r.kind === 'select_squares') {
    const picked = [...new Set(raw.map(toInt))].sort((a, b) => a - b)
    if (picked.some((v) => v < 0 || v >= r.public.cards.length)) throw new AnswerFormatError('Pilihan tidak valid.')
    return picked
  }
  throw new AnswerFormatError('Jenis ronde tidak dikenal.')
}

export const isCorrect = (r, a) => JSON.stringify(a) === JSON.stringify(r.answer)

export function pointsFor(r, tries, hintUsed) {
  let pts = r.points
  if (tries > 1) pts *= SECOND_TRY_FACTOR
  if (hintUsed) pts *= HINT_FACTOR
  return Math.round(pts)
}
