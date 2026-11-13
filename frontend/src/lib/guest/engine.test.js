import { beforeEach, describe, expect, it } from 'vitest'
import CONTENT from '../../content/generated/content.json'
import { createGuest, guestApi, guestSnapshot, loadStore, resetGuest } from './engine'
import { generateRounds, makeRng } from './games'

const byId = Object.fromEntries(CONTENT.questions.map((q) => [q.id, q]))
const key = (id) => {
  const q = byId[id]
  return q.type === 'mcq' || q.type === 'grid_choice' ? q.answer.index : q.type === 'sequence' ? q.answer.values : q.answer.value
}
const wrong = (id) => {
  const q = byId[id]
  if (q.type === 'mcq' || q.type === 'grid_choice') return (q.answer.index + 1) % q.options.length
  if (q.type === 'tf') return !q.answer.value
  if (q.type === 'sequence') return q.answer.values.map((v) => v + 1)
  return q.answer.value + 1
}

async function doLesson(slug, level) {
  await guestApi(`/api/lessons/${slug}/start`)
  const s = await guestApi('/api/quizzes/start', { body: { quiz_slug: `lesson-${level}-check` } })
  for (const q of s.questions) {
    const r = await guestApi(`/api/quizzes/attempts/${s.attempt_id}/check`, { body: { question_id: q.id, answer: key(q.id) } })
    expect(r.correct).toBe(true)
  }
  await guestApi(`/api/quizzes/attempts/${s.attempt_id}/submit`, { body: {} })
  return guestApi(`/api/lessons/${slug}/complete`)
}

async function play(slug, difficulty = null) {
  const s = await guestApi(`/api/games/${slug}/start`, { body: { difficulty } })
  s.rounds.forEach((r) => expect(r.answer).toBeUndefined())
  const secret = loadStore().game_sessions.find((g) => g.id === s.session_id).rounds
  for (let i = 0; i < secret.length; i++) {
    const r = await guestApi(`/api/games/sessions/${s.session_id}/answer`, { body: { round_index: i, answer: secret[i].answer } })
    expect(r.correct).toBe(true)
  }
  return guestApi(`/api/games/sessions/${s.session_id}/finish`)
}

const LESSONS = [['kenali-polanya', 1], ['lengkapi-pola', 2], ['temukan-rumus', 3], ['tantangan-matematika', 4]]

describe('Mode Tamu', () => {
  beforeEach(() => {
    resetGuest()
    createGuest('Tamu Uji')
  })

  it('menolak nama terlalu pendek', () => {
    resetGuest()
    expect(() => createGuest('a')).toThrow()
  })

  it('level terbuka berurutan dan XP misi hanya sekali', async () => {
    await expect(guestApi('/api/lessons/lengkapi-pola/start')).rejects.toMatchObject({ status: 403 })
    const r = await doLesson('kenali-polanya', 1)
    expect(r.newly_completed).toBe(true)
    expect(r.xp_awarded).toBe(50)
    expect(r.new_achievements.map((a) => a.slug).sort()).toEqual(['first-adventure', 'pattern-explorer'])
    const again = await guestApi('/api/lessons/kenali-polanya/complete')
    expect(again.xp_awarded).toBe(0)
    expect(again.stats.total_xp).toBe(50)
  })

  it('petunjuk lalu pembahasan, tanpa membocorkan kunci di awal', async () => {
    const s = await guestApi('/api/quizzes/start', { body: { quiz_slug: 'training-beginner' } })
    expect(s.questions).toHaveLength(8)
    s.questions.forEach((q) => expect(q.answer).toBeUndefined())
    const id = s.questions[0].id
    const url = `/api/quizzes/attempts/${s.attempt_id}/check`
    const r1 = await guestApi(url, { body: { question_id: id, answer: wrong(id) } })
    expect(r1.hint).toBeTruthy()
    expect(r1.explanation).toBeUndefined()
    const r2 = await guestApi(url, { body: { question_id: id, answer: wrong(id) } })
    expect(r2.final).toBe(true)
    expect(r2.explanation.length).toBeGreaterThan(0)
  })

  it('XP latihan hanya untuk peningkatan', async () => {
    const run = async () => {
      const s = await guestApi('/api/quizzes/start', { body: { quiz_slug: 'training-beginner' } })
      for (const q of s.questions) await guestApi(`/api/quizzes/attempts/${s.attempt_id}/check`, { body: { question_id: q.id, answer: key(q.id) } })
      return guestApi(`/api/quizzes/attempts/${s.attempt_id}/submit`, { body: {} })
    }
    expect((await run()).xp_awarded).toBe(30)
    expect((await run()).xp_awarded).toBe(0)
  })

  it('perjalanan lengkap: 4 level, evaluasi akhir, 5 permainan, lencana', async () => {
    for (const [slug, level] of LESSONS) await doLesson(slug, level)
    const s = await guestApi('/api/quizzes/start', { body: { quiz_slug: 'final-challenge', count: 10, timed: true } })
    expect(s.time_limit_seconds).toBe(900)
    await expect(guestApi(`/api/quizzes/attempts/${s.attempt_id}/check`, { body: { question_id: s.questions[0].id, answer: 1 } })).rejects.toMatchObject({ status: 400 })
    const answers = Object.fromEntries(s.questions.map((q) => [q.id, key(q.id)]))
    answers[s.questions[0].id] = wrong(s.questions[0].id)
    delete answers[s.questions[1].id]
    const res = await guestApi(`/api/quizzes/attempts/${s.attempt_id}/submit`, { body: { answers } })
    expect(res).toMatchObject({ correct: 8, total: 10, score_pct: 80, xp_awarded: 80 })
    expect(res.review[1].your_answer_label).toBe('Tidak dijawab')
    const rv = await guestApi(`/api/quizzes/attempts/${s.attempt_id}/review`, { method: 'GET' })
    expect(rv.review).toHaveLength(10)

    let last
    for (const g of CONTENT.games) {
      last = await play(g.slug, g.slug === 'next-number' ? 'sulit' : null)
      expect(last).toMatchObject({ score_pct: 100, stars: 3, xp_awarded: 40 })
    }
    expect(last.new_achievements.map((a) => a.slug)).toContain('playground-hero')
    expect((await play('square-hunter')).xp_awarded).toBe(0)

    const snap = guestSnapshot()
    expect(snap.stats.total_xp).toBe(200 + 80 + 200)
    expect(snap.stats.lessons_completed).toBe(4)
    expect(snap.earned.length).toBeGreaterThanOrEqual(7)
  })

  it('fitur guru tidak tersedia untuk tamu', async () => {
    await expect(guestApi('/api/admin/students', { method: 'GET' })).rejects.toMatchObject({ status: 403 })
  })
})

describe('generator permainan JS', () => {
  it('menghasilkan ronde valid untuk banyak seed', () => {
    let seed = 1
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647)
    for (let t = 0; t < 30; t++) {
      const rng = makeRng(rnd)
      generateRounds('square-hunter', null, rng).forEach((r) => {
        expect(r.answer).toEqual(r.public.cards.map((c, i) => (c.rows === c.cols ? i : -1)).filter((i) => i >= 0))
      })
      generateRounds('complete-pattern', null, rng).forEach((r) => {
        const vals = [...r.answer]
        const filled = r.public.items.map((v) => (v === null ? vals.shift() : v))
        const roots = filled.map(Math.sqrt)
        roots.forEach((x, i) => expect(x).toBe(roots[0] + i))
      })
      generateRounds('formula-challenge', null, rng)
        .filter((r) => r.kind === 'build')
        .forEach((r) => expect(r.answer ** 2).toBe(r.public.target))
      const castle = generateRounds('adventure-quest', null, rng)[4]
      const total = Number(castle.public.story.match(/dari (\d+)/)[1])
      expect(castle.answer ** 2 <= total && total < (castle.answer + 1) ** 2).toBe(true)
      ;['mudah', 'sedang', 'sulit'].forEach((d) => expect(generateRounds('next-number', d, rng)).toHaveLength(8))
    }
  })
})
