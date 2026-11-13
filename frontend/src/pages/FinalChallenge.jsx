import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, ArrowLeft, ArrowRight, Castle, Clock, Eye, Lock, Send } from 'lucide-react'
import { useProgress } from '../context/ProgressContext'
import { useToast } from '../context/ToastContext'
import { api } from '../lib/api'
import QuestionView, { emptyValue, isAnswered, toPayload } from '../components/quiz/QuestionView'
import ResultView from '../components/quiz/ResultView'
import Kubi from '../components/Kubi'
import { ErrorBox, formatDate, PageTitle, ProgressBar, Spinner, Stars } from '../components/ui'

function Setup({ onStart, busy, error }) {
  const [count, setCount] = useState(15)
  const [timed, setTimed] = useState(false)
  return (
    <div className="panel space-y-5">
      <Kubi mood="happy" size={60}>
        Selamat datang di Kastel Persegi! Kerjakan dengan tenang. Pembahasan akan muncul setelah semua jawaban dikirim.
      </Kubi>
      <fieldset>
        <legend className="mb-2 font-bold text-navy">Jumlah soal</legend>
        <div className="flex gap-2">
          {[10, 15, 20].map((c) => (
            <button key={c} type="button" onClick={() => setCount(c)} className={`btn ${count === c ? 'bg-royal text-white' : 'border-2 border-slate-200 bg-white'}`} aria-pressed={count === c}>
              {c} soal
            </button>
          ))}
        </div>
      </fieldset>
      <label className="flex items-center gap-3 font-bold text-navy">
        <input type="checkbox" className="h-5 w-5 accent-royal" checked={timed} onChange={(e) => setTimed(e.target.checked)} />
        Gunakan timer ({Math.round((count * 90) / 60)} menit)
      </label>
      <ul className="list-disc space-y-1 pl-5 text-sm text-slate-600">
        <li>Soal mencakup seluruh materi: pengenalan, pola, rumus, dan soal cerita.</li>
        <li>Kamu bisa berpindah nomor soal dan memeriksa jawaban sebelum mengirim.</li>
        <li>Kunci jawaban tidak ditampilkan selama evaluasi berlangsung.</li>
      </ul>
      {error && <ErrorBox message={error} />}
      <button type="button" className="btn-sun text-lg" disabled={busy} onClick={() => onStart(count, timed)}>
        <Castle size={20} /> {busy ? 'Menyiapkan...' : 'Mulai Final Challenge'}
      </button>
    </div>
  )
}

function Exam({ session, onSubmitted }) {
  const [idx, setIdx] = useState(0)
  const [answers, setAnswers] = useState(() => Object.fromEntries(session.questions.map((q) => [q.id, emptyValue(q)])))
  const [reasons, setReasons] = useState({})
  const [reviewing, setReviewing] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const deadline = useRef(session.time_limit_seconds ? Date.now() + session.time_limit_seconds * 1000 : null)
  const [left, setLeft] = useState(session.time_limit_seconds)
  const submittedRef = useRef(false)

  const submit = useCallback(async () => {
    if (submittedRef.current) return
    submittedRef.current = true
    setBusy(true)
    setError('')
    const payload = {}
    session.questions.forEach((q) => {
      if (isAnswered(q, answers[q.id])) payload[q.id] = toPayload(q, answers[q.id])
    })
    try {
      const r = await api(`/api/quizzes/attempts/${session.attempt_id}/submit`, { body: { answers: payload, reasons } })
      onSubmitted(r)
    } catch (e) {
      submittedRef.current = false
      setError(e.message)
      setBusy(false)
    }
  }, [answers, reasons, session, onSubmitted])

  const submitRef = useRef(submit)
  submitRef.current = submit
  useEffect(() => {
    if (!deadline.current) return undefined
    const t = setInterval(() => {
      const s = Math.max(0, Math.round((deadline.current - Date.now()) / 1000))
      setLeft(s)
      if (s === 0) {
        clearInterval(t)
        submitRef.current()
      }
    }, 1000)
    return () => clearInterval(t)
  }, [])

  const q = session.questions[idx]
  const answeredCount = session.questions.filter((x) => isAnswered(x, answers[x.id])).length
  const unanswered = session.questions.map((x, i) => (isAnswered(x, answers[x.id]) ? null : i + 1)).filter(Boolean)

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3 text-white">
        <span className="font-bold">
          Terjawab {answeredCount}/{session.questions.length}
        </span>
        <div className="flex-1">
          <ProgressBar value={(answeredCount / session.questions.length) * 100} label="Progres pengerjaan" />
        </div>
        {left != null && (
          <span className={`chip text-sm ${left < 60 ? 'bg-red-500 text-white' : 'bg-white/10 text-white'}`}>
            <Clock size={14} /> {Math.floor(left / 60)}:{String(left % 60).padStart(2, '0')}
          </span>
        )}
      </div>

      <nav className="flex flex-wrap gap-2" aria-label="Navigasi nomor soal">
        {session.questions.map((x, i) => (
          <button
            key={x.id}
            type="button"
            onClick={() => {
              setIdx(i)
              setReviewing(false)
            }}
            className={`h-10 w-10 rounded-lg font-bold ${i === idx && !reviewing ? 'bg-sun text-navy' : isAnswered(x, answers[x.id]) ? 'bg-royal text-white' : 'bg-white/10 text-white'}`}
            aria-label={`Soal ${i + 1}${isAnswered(x, answers[x.id]) ? ' (terjawab)' : ''}`}
          >
            {i + 1}
          </button>
        ))}
      </nav>

      {reviewing ? (
        <div className="panel space-y-4">
          <h2 className="text-xl font-bold text-navy">Periksa kembali jawabanmu</h2>
          {unanswered.length > 0 ? (
            <p className="flex items-center gap-2 rounded-xl bg-amber-50 p-3 font-semibold text-amber-800">
              <AlertTriangle size={18} /> Soal belum dijawab: nomor {unanswered.join(', ')}. Soal kosong dinilai salah.
            </p>
          ) : (
            <p className="rounded-xl bg-emerald-50 p-3 font-semibold text-emerald-800">Semua soal sudah dijawab.</p>
          )}
          {error && <ErrorBox message={error} />}
          <div className="flex flex-wrap gap-3">
            <button type="button" className="btn-light" onClick={() => setReviewing(false)}>
              <ArrowLeft size={18} /> Kembali mengerjakan
            </button>
            <button type="button" className="btn-sun" onClick={submit} disabled={busy}>
              <Send size={18} /> {busy ? 'Mengirim...' : 'Kirim jawaban'}
            </button>
          </div>
        </div>
      ) : (
        <div className="panel space-y-5">
          <p className="font-display text-sm font-bold text-slate-500">
            Soal {idx + 1} dari {session.questions.length}
          </p>
          <QuestionView q={q} value={answers[q.id]} onChange={(v) => setAnswers((a) => ({ ...a, [q.id]: v }))} />
          {q.ask_reason && (
            <label className="block">
              <span className="mb-1 block text-sm font-bold text-slate-600">Jelaskan caramu (dianjurkan)</span>
              <textarea className="input min-h-20 text-base font-semibold" maxLength={500} value={reasons[q.id] || ''} onChange={(e) => setReasons((r) => ({ ...r, [q.id]: e.target.value }))} />
            </label>
          )}
          <div className="flex justify-between gap-3">
            <button type="button" className="btn-light btn-sm" disabled={idx === 0} onClick={() => setIdx(idx - 1)}>
              <ArrowLeft size={16} /> Sebelumnya
            </button>
            {idx < session.questions.length - 1 ? (
              <button type="button" className="btn-primary btn-sm" onClick={() => setIdx(idx + 1)}>
                Berikutnya <ArrowRight size={16} />
              </button>
            ) : (
              <button type="button" className="btn-sun btn-sm" onClick={() => setReviewing(true)}>
                <Eye size={16} /> Periksa & kirim
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function PastAttempts({ attempts, onOpen }) {
  if (!attempts.length) return null
  return (
    <section className="mt-8 text-white">
      <h2 className="mb-3 text-xl font-bold">Riwayat Final Challenge</h2>
      <ul className="divide-y divide-white/10 rounded-xl bg-white/5">
        {attempts.map((a) => (
          <li key={a.id} className="flex flex-wrap items-center justify-between gap-3 p-3">
            <div>
              <p className="font-bold">Nilai {Number(a.score_pct)}</p>
              <p className="text-xs text-white/60">
                {a.score}/{a.total} benar · {formatDate(a.submitted_at)}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Stars count={a.stars} size={16} />
              <button type="button" className="btn-ghost btn-sm" onClick={() => onOpen(a.id)}>
                Lihat pembahasan
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}

export default function FinalChallenge() {
  const { completedLevels, isTeacher, quizAttempts, quizBySlug, refresh, loading } = useProgress()
  const { celebrate } = useToast()
  const [session, setSession] = useState(null)
  const [result, setResult] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  if (loading) return <Spinner light />
  const finalQuiz = quizBySlug['final-challenge']
  const past = quizAttempts.filter((a) => a.quiz_id === finalQuiz?.id)
  const open = isTeacher || completedLevels.size >= 4

  const start = async (count, timed) => {
    setBusy(true)
    setError('')
    try {
      setSession(await api('/api/quizzes/start', { body: { quiz_slug: 'final-challenge', count, timed } }))
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }

  const openReview = async (id) => {
    setError('')
    try {
      const r = await api(`/api/quizzes/attempts/${id}/review`, { method: 'GET' })
      setResult({ ...r, xp_awarded: 0, past: true })
      window.scrollTo(0, 0)
    } catch (e) {
      setError(e.message)
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <PageTitle eyebrow="Final Challenge" title="Evaluasi Akhir" icon={Castle}>
        Tantangan terakhir di Kastel Persegi untuk mengukur pemahamanmu tentang seluruh materi.
      </PageTitle>

      {result ? (
        <ResultView result={result} title={result.past ? 'Pembahasan evaluasi sebelumnya' : 'Hasil Final Challenge'}>
          <button
            type="button"
            className="btn-primary"
            onClick={() => {
              setResult(null)
              setSession(null)
            }}
          >
            Selesai
          </button>
        </ResultView>
      ) : session ? (
        <Exam
          session={session}
          onSubmitted={(r) => {
            setResult(r)
            setSession(null)
            celebrate(r)
            refresh()
            window.scrollTo(0, 0)
          }}
        />
      ) : open ? (
        <Setup onStart={start} busy={busy} error={error} />
      ) : (
        <div className="panel text-center">
          <Lock className="mx-auto text-slate-400" size={40} />
          <p className="mt-2 text-lg font-bold text-navy">Kastel Persegi masih terkunci</p>
          <p className="text-slate-600">Selesaikan keempat level materi terlebih dahulu ({completedLevels.size}/4 selesai).</p>
          <Link to="/app/peta" className="btn-primary mt-4">
            Ke Adventure Map
          </Link>
        </div>
      )}
      {!session && !result && <PastAttempts attempts={past} onOpen={openReview} />}
      {!session && error && result === null && open === false && <ErrorBox message={error} />}
    </div>
  )
}
