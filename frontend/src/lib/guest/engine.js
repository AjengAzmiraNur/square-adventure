// Mode Tamu: meniru endpoint backend FastAPI sepenuhnya di browser.
// Data disimpan di localStorage perangkat ini (tidak tersinkron ke server/guru).
// Aturan penilaian, XP, level, bintang, dan lencana sama dengan backend.

import CONTENT from '../../content/generated/content.json'
import * as G from './games'

const STORE_KEY = 'square-adventure:guest-data'
const MAX_TRIES_INSTANT = 2
const FINAL_COUNTS = [10, 15, 20]
const SECONDS_PER_FINAL_QUESTION = 90
const TIME_GRACE_SECONDS = 5

export class GuestError extends Error {
  constructor(message, status = 400) {
    super(message)
    this.status = status
  }
}

const nowIso = () => new Date().toISOString()
const uid = () => (globalThis.crypto?.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`)
const clone = (x) => JSON.parse(JSON.stringify(x))

const EMPTY = () => ({
  profile: null,
  stats: { total_xp: 0, level: 1, lessons_completed: 0, games_played: 0, quizzes_completed: 0, stars: 0 },
  lesson_progress: [],
  quiz_attempts: [],
  game_sessions: [],
  game_attempts: [],
  user_achievements: [],
  activity_logs: [],
})

let memoryStore = null

export function loadStore() {
  if (memoryStore) return memoryStore
  try {
    memoryStore = { ...EMPTY(), ...(JSON.parse(localStorage.getItem(STORE_KEY) || 'null') || {}) }
  } catch {
    memoryStore = EMPTY()
  }
  return memoryStore
}

function save() {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(memoryStore))
  } catch {
    /* penyimpanan penuh/diblokir: data tetap ada selama tab terbuka */
  }
}

export function guestProfile() {
  return loadStore().profile
}

export function createGuest(name) {
  const clean = String(name || '').trim().replace(/\s+/g, ' ')
  if (clean.length < 2 || clean.length > 40) throw new GuestError('Nama minimal 2 dan maksimal 40 karakter.', 422)
  const s = loadStore()
  if (!s.profile) {
    s.profile = { id: `guest-${uid()}`, full_name: clean, student_code: 'TAMU', class_name: '', role: 'student', is_active: true, guest: true }
    s.activity_logs.unshift({ id: uid(), activity_type: 'login', title: 'Mulai sebagai tamu', status: 'success', detail: {}, created_at: nowIso() })
  } else {
    s.profile.full_name = clean
  }
  save()
  return clone(s.profile)
}

export function resetGuest() {
  memoryStore = EMPTY()
  try {
    localStorage.removeItem(STORE_KEY)
  } catch {
    /* abaikan */
  }
}

// ------------------------------------------------------------------ katalog
const lessonsBySlug = Object.fromEntries(CONTENT.lessons.map((l) => [l.slug, l]))
const quizzesBySlug = Object.fromEntries(CONTENT.quizzes.map((q) => [q.slug, q]))
const gamesBySlug = Object.fromEntries(CONTENT.games.map((g) => [g.slug, g]))
const questionsById = Object.fromEntries(CONTENT.questions.map((q) => [q.id, q]))
const questionsOf = (quizSlug) => CONTENT.questions.filter((q) => q.quiz_id === quizSlug).sort((a, b) => a.position - b.position)

export function levelForXp(xp) {
  let level = 1
  CONTENT.levels.forEach((l, i) => {
    if (xp >= l.min) level = i + 1
  })
  return level
}

export const starsForPct = (pct) => (pct >= 90 ? 3 : pct >= 70 ? 2 : pct >= 40 ? 1 : 0)
const improvementXp = (maxXp, pct, prevBest) => Math.max(0, Math.round((maxXp * Math.max(0, Math.min(100, pct))) / 100) - prevBest)

const log = (s, row) => s.activity_logs.unshift({ id: uid(), created_at: nowIso(), detail: {}, ...row })

function completedLevels(s) {
  return new Set(s.lesson_progress.filter((p) => p.status === 'completed').map((p) => lessonsBySlug[p.lesson_id]?.level))
}
const isUnlocked = (s, lesson) => lesson.level === 1 || completedLevels(s).has(lesson.level - 1)

// ------------------------------------------------------------------ penilaian soal
function blankCount(q) {
  return q.type === 'sequence' ? (q.visual?.items || []).filter((v) => v === null).length : null
}

function publicQuestion(q) {
  return { id: q.id, code: q.code, type: q.type, prompt: q.prompt, visual: q.visual, options: q.options, skill: q.skill, ask_reason: !!q.ask_reason, blanks: blankCount(q) }
}

function toInt(raw) {
  if (raw == null || typeof raw === 'boolean') throw new GuestError('Jawaban harus berupa bilangan bulat.', 422)
  if (typeof raw === 'number') {
    if (!Number.isInteger(raw)) throw new GuestError('Jawaban harus berupa bilangan bulat, bukan desimal.', 422)
    return raw
  }
  let text = String(raw).trim()
  if (/^-?[0-9]{1,3}(\.[0-9]{3})+$/.test(text)) text = text.replace(/\./g, '')
  if (!/^-?[0-9]{1,9}$/.test(text)) throw new GuestError('Jawaban harus berupa bilangan bulat.', 422)
  return Number(text)
}

function normalize(q, raw) {
  if (q.type === 'mcq' || q.type === 'grid_choice') {
    const i = toInt(raw)
    if (i < 0 || i >= (q.options || []).length) throw new GuestError('Pilihan jawaban tidak valid.', 422)
    return i
  }
  if (q.type === 'tf') {
    if (typeof raw === 'boolean') return raw
    throw new GuestError('Pilih Benar atau Salah.', 422)
  }
  if (q.type === 'number') return toInt(raw)
  if (q.type === 'sequence') {
    if (!Array.isArray(raw)) throw new GuestError('Isi semua kotak kosong.', 422)
    const v = raw.map(toInt)
    if (v.length !== blankCount(q)) throw new GuestError('Isi semua kotak kosong.', 422)
    return v
  }
  throw new GuestError('Jenis soal tidak dikenal.', 422)
}

const correctValue = (q) => (q.type === 'mcq' || q.type === 'grid_choice' ? q.answer.index : q.type === 'sequence' ? q.answer.values : q.answer.value)
const isCorrect = (q, a) => JSON.stringify(a) === JSON.stringify(correctValue(q))

function answerLabel(q, a) {
  if (a == null) return 'Tidak dijawab'
  if (q.type === 'mcq') return q.options[a]
  if (q.type === 'grid_choice') return `Susunan ${q.options[a].rows} × ${q.options[a].cols}`
  if (q.type === 'tf') return a ? 'Benar' : 'Salah'
  if (q.type === 'sequence') return a.join(', ')
  return String(a)
}

function reviewItem(q, r = {}) {
  const cv = correctValue(q)
  return {
    ...publicQuestion(q),
    your_answer: r.answer ?? null,
    your_answer_label: answerLabel(q, r.answer ?? null),
    correct_answer: cv,
    correct_answer_label: answerLabel(q, cv),
    correct: !!r.correct,
    explanation: q.explanation || [],
    hint: q.hint,
    reason: r.reason || null,
  }
}

// ------------------------------------------------------------------ progres & lencana
function refreshProgress(s, xp = 0) {
  s.stats.total_xp += Math.max(0, xp)
  const levels = completedLevels(s)
  const quizDone = s.quiz_attempts.filter((a) => a.status === 'completed' && (a.kind === 'training' || a.kind === 'final'))
  const best = (rows, key) => {
    const m = {}
    rows.forEach((r) => (m[r[key]] = Math.max(m[r[key]] || 0, r.stars || 0)))
    return Object.values(m).reduce((a, b) => a + b, 0)
  }
  Object.assign(s.stats, {
    level: levelForXp(s.stats.total_xp),
    lessons_completed: levels.size,
    games_played: s.game_attempts.length,
    quizzes_completed: quizDone.length,
    stars: best(quizDone, 'quiz_id') + best(s.game_attempts, 'game_id'),
    updated_at: nowIso(),
  })

  const finals = quizDone.filter((a) => a.kind === 'final')
  const rules = {
    'first-adventure': levels.size >= 1,
    'pattern-explorer': levels.has(1),
    'number-detective': levels.has(2),
    'formula-master': levels.has(3),
    'square-expert': quizDone.some((a) => a.quiz_id === 'training-expert' && a.score_pct >= 70),
    'math-adventurer': levels.has(4),
    'adventure-champion': finals.length >= 1,
    'playground-hero': new Set(s.game_attempts.map((a) => a.game_id)).size >= CONTENT.games.length,
    'perfect-square': finals.some((a) => a.score_pct >= 100),
  }
  const owned = new Set(s.user_achievements.map((u) => u.achievement_id))
  const fresh = []
  CONTENT.achievements.forEach((a) => {
    if (rules[a.slug] && !owned.has(a.id)) {
      s.user_achievements.push({ id: uid(), achievement_id: a.id, earned_at: nowIso() })
      fresh.push({ slug: a.slug, title: a.title, description: a.description, icon: a.icon })
      log(s, { activity_type: 'achievement', title: `Lencana ${a.title}`, status: 'earned', detail: { slug: a.slug } })
    }
  })
  save()
  return { xp_awarded: Math.max(0, xp), stats: clone(s.stats), new_achievements: fresh }
}

// ------------------------------------------------------------------ handler
function lessonStart(s, slug) {
  const lesson = lessonsBySlug[slug]
  if (!lesson) throw new GuestError('Materi tidak ditemukan.', 404)
  if (!isUnlocked(s, lesson)) throw new GuestError(`Level ini masih terkunci. Selesaikan Level 0${lesson.level - 1} terlebih dahulu.`, 403)
  if (!s.lesson_progress.some((p) => p.lesson_id === slug)) {
    s.lesson_progress.push({ id: uid(), lesson_id: slug, status: 'in_progress', started_at: nowIso() })
    log(s, { activity_type: 'lesson', title: lesson.title, status: 'started', detail: { level: lesson.level } })
    save()
  }
  return { ok: true }
}

function lessonComplete(s, slug) {
  const lesson = lessonsBySlug[slug]
  if (!lesson) throw new GuestError('Materi tidak ditemukan.', 404)
  if (!isUnlocked(s, lesson)) throw new GuestError('Level ini masih terkunci.', 403)
  const attempts = s.quiz_attempts.filter((a) => a.quiz_id === `lesson-${lesson.level}-check` && a.status === 'completed')
  if (!attempts.length) throw new GuestError('Kerjakan dulu Latihan Singkat sebelum menyelesaikan misi.', 409)
  const best = Math.max(...attempts.map((a) => a.score_pct))
  let p = s.lesson_progress.find((x) => x.lesson_id === slug)
  const newly = !p || p.status !== 'completed'
  if (!p) {
    p = { id: uid(), lesson_id: slug, started_at: nowIso() }
    s.lesson_progress.push(p)
  }
  let xp = 0
  if (newly) {
    Object.assign(p, { status: 'completed', check_score: Math.round(best), completed_at: nowIso() })
    xp = lesson.xp_reward
    log(s, { activity_type: 'lesson', title: lesson.title, status: 'completed', detail: { level: lesson.level, check_score: best, xp } })
  }
  return { newly_completed: newly, ...refreshProgress(s, xp) }
}

function quizStart(s, { quiz_slug, count, timed }) {
  const quiz = quizzesBySlug[quiz_slug]
  if (!quiz) throw new GuestError('Kuis tidak ditemukan.', 404)
  const all = questionsOf(quiz_slug)
  const rng = G.makeRng()
  let selected
  if (quiz.kind === 'lesson_check') {
    const lesson = lessonsBySlug[quiz.lesson_slug]
    if (!isUnlocked(s, lesson)) throw new GuestError('Level ini masih terkunci.', 403)
    selected = all
  } else if (quiz.kind === 'training') {
    selected = rng.sample(all, Math.min(count || quiz.default_count, all.length))
  } else {
    if (completedLevels(s).size < 4) throw new GuestError('Final Challenge terbuka setelah keempat level materi selesai.', 403)
    const n = count || quiz.default_count
    if (!FINAL_COUNTS.includes(n)) throw new GuestError('Jumlah soal evaluasi harus 10, 15, atau 20.', 422)
    selected = rng.sample(all, Math.min(n, all.length))
  }
  const mode = quiz.kind === 'final' ? 'exam' : 'instant'
  const timeLimit = mode === 'exam' && timed ? selected.length * SECONDS_PER_FINAL_QUESTION : null
  s.quiz_attempts.forEach((a) => {
    if (a.quiz_id === quiz.id && a.status === 'in_progress') a.status = 'abandoned'
  })
  const attempt = {
    id: uid(), quiz_id: quiz.id, kind: quiz.kind, mode, status: 'in_progress', question_ids: selected.map((q) => q.id),
    responses: {}, total: selected.length, timed: !!timeLimit, time_limit_seconds: timeLimit, started_at: nowIso(),
  }
  s.quiz_attempts.unshift(attempt)
  save()
  return {
    attempt_id: attempt.id, quiz: { slug: quiz.slug, title: quiz.title, kind: quiz.kind }, mode,
    time_limit_seconds: timeLimit, started_at: attempt.started_at, questions: selected.map(publicQuestion),
  }
}

const ownAttempt = (s, id) => {
  const a = s.quiz_attempts.find((x) => x.id === id)
  if (!a) throw new GuestError('Sesi latihan tidak ditemukan.', 404)
  return a
}

function quizCheck(s, id, { question_id, answer, reason }) {
  const a = ownAttempt(s, id)
  if (a.mode !== 'instant') throw new GuestError('Jawaban evaluasi akhir dinilai setelah semua soal dikirim.', 400)
  if (a.status !== 'in_progress') throw new GuestError('Sesi latihan ini sudah selesai.', 409)
  if (!a.question_ids.includes(question_id)) throw new GuestError('Soal tidak ada di sesi ini.', 404)
  const q = questionsById[question_id]
  const prev = a.responses[question_id] || { tries: 0 }
  if (prev.final) throw new GuestError('Soal ini sudah selesai dijawab.', 409)
  const ans = normalize(q, answer)
  const tries = prev.tries + 1
  const correct = isCorrect(q, ans)
  const final = correct || tries >= MAX_TRIES_INSTANT
  const points = correct ? (tries === 1 ? 1 : 0.5) : 0
  a.responses[question_id] = { answer: ans, correct, tries, final, points, reason: (reason || prev.reason || '').slice(0, 500) || null }
  save()
  const out = { correct, tries, final, points }
  if (correct) out.explanation = q.explanation
  else {
    out.hint = q.hint
    if (final) Object.assign(out, { explanation: q.explanation, correct_answer: correctValue(q), correct_answer_label: answerLabel(q, correctValue(q)) })
  }
  return out
}

function quizSubmit(s, id, { answers = {}, reasons = {} }) {
  const a = ownAttempt(s, id)
  if (a.status !== 'in_progress') throw new GuestError('Sesi ini sudah dikirim sebelumnya.', 409)
  const quiz = quizzesBySlug[a.quiz_id]
  const questions = a.question_ids.map((qid) => questionsById[qid])
  if (a.mode === 'exam') {
    questions.forEach((q) => {
      const raw = answers[q.id]
      const reason = (reasons[q.id] || '').slice(0, 500) || null
      let ans = null
      if (raw != null && raw !== '' && !(Array.isArray(raw) && !raw.length)) {
        try {
          ans = normalize(q, raw)
        } catch {
          ans = null
        }
      }
      const ok = ans != null && isCorrect(q, ans)
      a.responses[q.id] = { answer: ans, correct: ok, points: ok ? 1 : 0, reason }
    })
  } else {
    if (a.kind === 'lesson_check' && questions.some((q) => !a.responses[q.id]?.final)) throw new GuestError('Jawab semua soal latihan singkat terlebih dahulu.', 409)
    Object.entries(reasons).forEach(([qid, t]) => {
      if (a.responses[qid] && t) a.responses[qid].reason = t.slice(0, 500)
    })
  }
  const total = questions.length
  const points = questions.reduce((sum, q) => sum + (a.responses[q.id]?.points || 0), 0)
  const correct = questions.filter((q) => a.responses[q.id]?.correct).length
  const pct = total ? Math.round((1000 * points) / total) / 10 : 0
  const stars = starsForPct(pct)
  const duration = Math.round((Date.now() - new Date(a.started_at).getTime()) / 1000)

  let xp = 0
  let xpValue = 0
  if (a.kind === 'training' || a.kind === 'final') {
    const maxXp = a.kind === 'final' ? CONTENT.quiz_max_xp.final : CONTENT.quiz_max_xp.training[quiz.difficulty]
    const prevBest = Math.max(0, ...s.quiz_attempts.filter((x) => x.quiz_id === a.quiz_id && x.status === 'completed').map((x) => x.xp_value || 0))
    xpValue = improvementXp(maxXp, pct, 0)
    xp = improvementXp(maxXp, pct, prevBest)
  }
  Object.assign(a, { status: 'completed', score: correct, points, score_pct: pct, stars, xp_awarded: xp, xp_value: xpValue, submitted_at: nowIso(), duration_seconds: duration })
  log(s, { activity_type: a.kind, title: quiz.title, status: 'completed', detail: { score_pct: pct, correct, total, xp } })
  return { score_pct: pct, correct, total, points, stars, duration_seconds: duration, review: questions.map((q) => reviewItem(q, a.responses[q.id])), ...refreshProgress(s, xp) }
}

function quizReview(s, id) {
  const a = ownAttempt(s, id)
  if (a.status !== 'completed') throw new GuestError('Pembahasan tersedia setelah sesi selesai.', 409)
  const questions = a.question_ids.map((qid) => questionsById[qid])
  return { score_pct: a.score_pct, correct: a.score, total: a.total, stars: a.stars, submitted_at: a.submitted_at, review: questions.map((q) => reviewItem(q, a.responses[q.id])) }
}

function gameStart(s, slug, { difficulty }) {
  const game = gamesBySlug[slug]
  const cfg = G.GAME_CONFIG[slug]
  if (!game || !cfg) throw new GuestError('Permainan tidak ditemukan.', 404)
  let diff = null
  if (cfg.difficulties) {
    diff = difficulty || cfg.difficulties[0]
    if (!cfg.difficulties.includes(diff)) throw new GuestError('Tingkat kesulitan tidak valid.', 422)
  }
  const rounds = G.generateRounds(slug, diff)
  const now = Date.now()
  const session = {
    id: uid(), game_id: slug, difficulty: diff, rounds, status: 'in_progress', started_at: new Date(now).toISOString(),
    expires_at: cfg.timeLimit ? new Date(now + cfg.timeLimit * 1000).toISOString() : null,
    state: rounds.map(() => ({ tries: 0, done: false, correct: false, points: 0, hint_used: false })),
  }
  s.game_sessions = [session, ...s.game_sessions.filter((x) => x.status === 'in_progress').slice(0, 4)]
  save()
  return {
    session_id: session.id, game: { slug, title: game.title }, difficulty: diff, max_tries: cfg.maxTries, time_limit_seconds: cfg.timeLimit,
    rounds: rounds.map((r, i) => G.publicRound(i, r)), max_score: rounds.reduce((t, r) => t + r.points, 0),
  }
}

const ownSession = (s, id) => {
  const x = s.game_sessions.find((g) => g.id === id)
  if (!x) throw new GuestError('Sesi permainan tidak ditemukan.', 404)
  return x
}
const currentIndex = (state) => {
  const i = state.findIndex((st) => !st.done)
  return i < 0 ? null : i
}
const scoreOf = (x) => [x.state.reduce((t, st) => t + st.points, 0), x.rounds.reduce((t, r) => t + r.points, 0)]

function gameHint(s, id, { round_index }) {
  const x = ownSession(s, id)
  if (x.status !== 'in_progress') throw new GuestError('Permainan sudah selesai.', 409)
  if (round_index !== currentIndex(x.state)) throw new GuestError('Ronde ini tidak sedang dimainkan.', 409)
  x.state[round_index].hint_used = true
  save()
  return { hint: x.rounds[round_index].hint, penalty: 'Poin ronde ini dikurangi 25%.' }
}

function gameAnswer(s, id, { round_index, answer }) {
  const x = ownSession(s, id)
  if (x.status !== 'in_progress') throw new GuestError('Permainan sudah selesai.', 409)
  if (x.expires_at && Date.now() > new Date(x.expires_at).getTime() + TIME_GRACE_SECONDS * 1000) {
    x.state.forEach((st) => (st.done = true))
    save()
    const [score, max] = scoreOf(x)
    return { time_up: true, score, max_score: max }
  }
  const idx = currentIndex(x.state)
  if (idx == null || round_index !== idx) throw new GuestError('Ronde ini tidak sedang dimainkan.', 409)
  const r = x.rounds[idx]
  let ans
  try {
    ans = G.normalizeAnswer(r, answer)
  } catch (e) {
    throw new GuestError(e.message, 422)
  }
  const st = x.state[idx]
  st.tries += 1
  const correct = G.isCorrect(r, ans)
  const final = correct || st.tries >= G.GAME_CONFIG[x.game_id].maxTries
  if (correct) {
    st.points = G.pointsFor(r, st.tries, st.hint_used)
    st.correct = true
  }
  if (final) st.done = true
  save()
  const [score, max] = scoreOf(x)
  const out = { correct, final, tries: st.tries, points: st.points, score, max_score: max, finished: currentIndex(x.state) == null }
  if (final) Object.assign(out, { explanation: r.explanation, correct_answer: r.answer })
  else if (!correct) out.hint = r.hint
  return out
}

function gameFinish(s, id) {
  const x = ownSession(s, id)
  if (x.status !== 'in_progress') throw new GuestError('Permainan ini sudah selesai.', 409)
  x.status = 'finished'
  const game = gamesBySlug[x.game_id]
  const [score, max] = scoreOf(x)
  const pct = max ? Math.round((1000 * score) / max) / 10 : 0
  const stars = starsForPct(pct)
  const correct = x.state.filter((st) => st.correct).length
  const duration = Math.round((Date.now() - new Date(x.started_at).getTime()) / 1000)
  const prevBest = Math.max(0, ...s.game_attempts.filter((a) => a.game_id === x.game_id).map((a) => a.xp_value || 0))
  const xpValue = improvementXp(game.max_xp, pct, 0)
  const xp = improvementXp(game.max_xp, pct, prevBest)
  s.game_attempts.unshift({ id: uid(), game_id: x.game_id, difficulty: x.difficulty, score, max_score: max, score_pct: pct, stars, correct_count: correct, rounds_count: x.rounds.length, xp_awarded: xp, xp_value: xpValue, duration_seconds: duration, created_at: nowIso() })
  s.game_sessions = s.game_sessions.filter((g) => g.status === 'in_progress')
  log(s, { activity_type: 'game', title: game.title, status: 'completed', detail: { score, max_score: max, score_pct: pct, xp, difficulty: x.difficulty } })
  return { score, max_score: max, score_pct: pct, stars, correct, rounds: x.rounds.length, duration_seconds: duration, ...refreshProgress(s, xp) }
}

/** Dispatcher dengan bentuk rute yang sama seperti backend FastAPI. */
export async function guestApi(path, { method = 'POST', body = {} } = {}) {
  const s = loadStore()
  if (!s.profile) throw new GuestError('Sesi tamu belum dimulai.', 401)
  const b = body || {}
  let m
  if ((m = path.match(/^\/api\/lessons\/([^/]+)\/start$/))) return clone(lessonStart(s, m[1]))
  if ((m = path.match(/^\/api\/lessons\/([^/]+)\/complete$/))) return clone(lessonComplete(s, m[1]))
  if (path === '/api/quizzes/start') return clone(quizStart(s, b))
  if ((m = path.match(/^\/api\/quizzes\/attempts\/([^/]+)\/check$/))) return clone(quizCheck(s, m[1], b))
  if ((m = path.match(/^\/api\/quizzes\/attempts\/([^/]+)\/submit$/))) return clone(quizSubmit(s, m[1], b))
  if ((m = path.match(/^\/api\/quizzes\/attempts\/([^/]+)\/review$/)) && method === 'GET') return clone(quizReview(s, m[1]))
  if ((m = path.match(/^\/api\/games\/([^/]+)\/start$/))) return clone(gameStart(s, m[1], b))
  if ((m = path.match(/^\/api\/games\/sessions\/([^/]+)\/answer$/))) return clone(gameAnswer(s, m[1], b))
  if ((m = path.match(/^\/api\/games\/sessions\/([^/]+)\/hint$/))) return clone(gameHint(s, m[1], b))
  if ((m = path.match(/^\/api\/games\/sessions\/([^/]+)\/finish$/))) return clone(gameFinish(s, m[1]))
  throw new GuestError('Fitur ini hanya tersedia dengan akun siswa (login kode).', 403)
}

/** Data dalam bentuk yang sama seperti hasil query Supabase di ProgressContext. */
export function guestSnapshot() {
  const s = loadStore()
  return clone({
    stats: s.stats,
    lessons: CONTENT.lessons,
    progress: s.lesson_progress,
    achievements: CONTENT.achievements,
    earned: s.user_achievements,
    activities: s.activity_logs.slice(0, 200),
    quizzes: CONTENT.quizzes,
    quizAttempts: s.quiz_attempts.filter((a) => a.status === 'completed'),
    games: CONTENT.games,
    gameAttempts: s.game_attempts,
  })
}
