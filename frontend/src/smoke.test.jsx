// Smoke test: memastikan halaman dan permainan dapat dirender tanpa error runtime.
import { describe, expect, it } from 'vitest'
import { renderToString } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ToastProvider } from './context/ToastContext'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Laboratory from './pages/Laboratory'
import NotFound from './pages/NotFound'
import { AdventureQuest, CompletePattern, FormulaChallenge, NextNumber, SquareHunter } from './components/games/Games'
import QuestionView from './components/quiz/QuestionView'
import { ReviewList } from './components/quiz/ResultView'
import { ILLUSTRATIONS } from './components/lesson/Illustrations'

const wrap = (el) =>
  renderToString(
    <MemoryRouter>
      <AuthProvider>
        <ToastProvider>{el}</ToastProvider>
      </AuthProvider>
    </MemoryRouter>,
  )

const actions = { answer: async () => ({}), hint: async () => ({}), finish: async () => ({}) }

describe('render halaman', () => {
  it('landing berisi judul dan tombol utama', () => {
    const html = wrap(<Landing />)
    expect(html).toContain('Dunia Pola Persegi')
    expect(html).toContain('MULAI PETUALANGAN')
  })
  it('login menampilkan sapaan dan peringatan konfigurasi', () => {
    const html = wrap(<Login />)
    expect(html).toContain('Selamat Datang, Petualang!')
    expect(html).toContain('Main sebagai Tamu')
  })
  it('laboratorium dan 404', () => {
    expect(wrap(<Laboratory />)).toContain('Laboratorium Persegi')
    expect(wrap(<NotFound />)).toContain('tersesat')
  })
  it('semua ilustrasi materi', () => {
    Object.values(ILLUSTRATIONS).forEach((C) => expect(wrap(<C />).length).toBeGreaterThan(100))
  })
})

describe('render soal', () => {
  const qs = [
    { id: '1', type: 'mcq', prompt: 'A?', options: ['x', 'y'] },
    { id: '2', type: 'tf', prompt: 'B?' },
    { id: '3', type: 'number', prompt: 'C?', visual: { kind: 'grid', rows: 3, cols: 3 } },
    { id: '4', type: 'sequence', prompt: 'D?', visual: { kind: 'sequence', items: [1, 4, null] }, blanks: 1 },
    { id: '5', type: 'grid_choice', prompt: 'E?', options: [{ rows: 2, cols: 2 }, { rows: 1, cols: 3 }] },
    { id: '6', type: 'number', prompt: 'F?', visual: { kind: 'grid_series', ns: [1, 2, 3] } },
  ]
  it.each(qs)('jenis $type', (q) => {
    const v = q.type === 'sequence' ? [''] : q.type === 'number' ? '' : null
    expect(wrap(<QuestionView q={q} value={v} onChange={() => {}} />)).toContain(q.prompt)
  })
  it('daftar pembahasan', () => {
    const html = wrap(<ReviewList review={[{ id: 'a', prompt: 'P', correct: false, your_answer_label: '3', correct_answer_label: '4', explanation: ['x'] }]} />)
    expect(html).toContain('Jawaban benar')
  })
})

describe('render permainan', () => {
  const base = { session_id: 's', max_score: 100, time_limit_seconds: 60 }
  it('Square Hunter', () => {
    const s = { ...base, rounds: [{ index: 0, kind: 'select_squares', points: 20, instruction: 'Pilih', cards: [{ rows: 2, cols: 2 }, { rows: 1, cols: 4 }] }] }
    expect(wrap(<SquareHunter session={s} actions={actions} />)).toContain('Pilih')
  })
  it('Complete the Pattern', () => {
    const s = { ...base, rounds: [{ index: 0, kind: 'fill_sequence', points: 20, instruction: 'Isi', items: [1, null, 9] }] }
    expect(wrap(<CompletePattern session={s} actions={actions} />)).toContain('Isi')
  })
  it('Find the Next Number', () => {
    const s = { ...base, rounds: [{ index: 0, kind: 'number', points: 10, sequence: [1, 4, 9, 16] }] }
    expect(wrap(<NextNumber session={s} actions={actions} />)).toContain('16')
  })
  it('Formula Challenge (hitung & bangun)', () => {
    const s = {
      ...base,
      rounds: [
        { index: 0, kind: 'build', points: 15, mode: 'build', target: 25, instruction: 'Bangun 25' },
        { index: 1, kind: 'number', points: 15, mode: 'compute', n: 4, instruction: 'Hitung' },
      ],
    }
    expect(wrap(<FormulaChallenge session={s} actions={actions} />)).toContain('Bangun 25')
  })
  it('Adventure Quest', () => {
    const s = { ...base, rounds: [{ index: 0, kind: 'number', points: 20, gate: 'Gerbang Desa Ubin', story: 'Cerita', question: 'Berapa?', unit: 'ubin' }] }
    expect(wrap(<AdventureQuest session={s} actions={actions} />)).toContain('Gerbang Desa Ubin')
  })
})
