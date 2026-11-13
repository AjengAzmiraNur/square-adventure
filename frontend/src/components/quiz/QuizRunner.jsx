import { useCallback, useEffect, useState } from 'react'
import { ArrowRight, CheckCircle2, Lightbulb, Loader2, XCircle } from 'lucide-react'
import { api } from '../../lib/api'
import Kubi from '../Kubi'
import { ErrorBox, ProgressBar, Spinner } from '../ui'
import QuestionView, { emptyValue, Explanation, isAnswered, SKILL_LABEL, toPayload } from './QuestionView'

/**
 * Latihan mode 'instant': satu soal per layar.
 * Salah pertama → petunjuk & coba lagi; salah kedua → pembahasan lengkap.
 */
export default function QuizRunner({ quizSlug, count, onFinished, onCancel }) {
  const [session, setSession] = useState(null)
  const [error, setError] = useState('')
  const [idx, setIdx] = useState(0)
  const [value, setValue] = useState(null)
  const [reason, setReason] = useState('')
  const [feedback, setFeedback] = useState(null)
  const [busy, setBusy] = useState(false)

  const start = useCallback(async () => {
    setError('')
    setSession(null)
    try {
      const s = await api('/api/quizzes/start', { body: { quiz_slug: quizSlug, count } })
      setSession(s)
      setIdx(0)
      setValue(emptyValue(s.questions[0]))
      setFeedback(null)
      setReason('')
    } catch (e) {
      setError(e.message)
    }
  }, [quizSlug, count])

  useEffect(() => {
    start()
  }, [start])

  if (error && !session) return <ErrorBox message={error} onRetry={start} />
  if (!session) return <Spinner label="Menyiapkan soal..." />

  const q = session.questions[idx]
  const last = idx === session.questions.length - 1
  const locked = feedback && (feedback.correct || feedback.final)

  const check = async () => {
    if (!isAnswered(q, value) || busy || locked) return
    setBusy(true)
    setError('')
    try {
      const r = await api(`/api/quizzes/attempts/${session.attempt_id}/check`, {
        body: { question_id: q.id, answer: toPayload(q, value), reason: reason.trim() || null },
      })
      setFeedback(r)
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }

  const next = async () => {
    if (!last) {
      const nq = session.questions[idx + 1]
      setIdx(idx + 1)
      setValue(emptyValue(nq))
      setFeedback(null)
      setReason('')
      setError('')
      return
    }
    setBusy(true)
    try {
      const result = await api(`/api/quizzes/attempts/${session.attempt_id}/submit`, { body: {} })
      onFinished(result, start)
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }

  const retry = () => {
    setFeedback({ ...feedback, retrying: true })
    setValue(emptyValue(q))
  }

  const showRetry = feedback && !feedback.correct && !feedback.final && !feedback.retrying

  return (
    <div className="panel space-y-5">
      <div className="flex items-center gap-3">
        <span className="font-display text-sm font-bold text-slate-500">
          Soal {idx + 1}/{session.questions.length}
        </span>
        <ProgressBar value={((idx + (locked ? 1 : 0)) / session.questions.length) * 100} track="bg-slate-200" color="bg-royal" label="Progres latihan" />
      </div>
      {q.skill && <span className="chip bg-lilac/20 text-violet-700">{SKILL_LABEL[q.skill]}</span>}

      <QuestionView
        q={q}
        value={value}
        onChange={setValue}
        disabled={busy || locked || showRetry}
        onEnter={check}
        reveal={feedback?.final && !feedback.correct ? { correct: feedback.correct_answer } : null}
      />

      {q.ask_reason && !locked && (
        <label className="block">
          <span className="mb-1 block text-sm font-bold text-slate-600">Tuliskan alasan atau caramu menjawab (dianjurkan)</span>
          <textarea className="input min-h-20 text-base font-semibold" maxLength={500} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Contoh: Diketahui sisi 8 ubin, jadi aku hitung 8 × 8 ..." />
        </label>
      )}

      {error && <ErrorBox message={error} />}

      {/* Umpan balik */}
      {feedback?.correct && (
        <div className="animate-rise space-y-3 rounded-2xl bg-emerald-50 p-4">
          <p className="flex items-center gap-2 font-display text-lg font-semibold text-emerald-800">
            <CheckCircle2 /> {feedback.tries > 1 ? 'Benar! Kamu berhasil setelah memakai petunjuk.' : 'Hebat! Kamu berhasil menemukan pola yang tepat!'}
          </p>
          <Explanation steps={feedback.explanation} title="Kenapa jawabannya benar?" />
        </div>
      )}
      {feedback && !feedback.correct && !feedback.final && (
        <div className="animate-rise space-y-3 rounded-2xl bg-amber-50 p-4">
          <Kubi mood="encourage" size={52}>
            <span className="flex items-center gap-1 text-amber-700">
              <Lightbulb size={18} /> Hampir! Jangan menyerah.
            </span>
            <span className="font-normal">{feedback.hint}</span>
          </Kubi>
        </div>
      )}
      {feedback && !feedback.correct && feedback.final && (
        <div className="animate-rise space-y-3 rounded-2xl bg-red-50 p-4">
          <p className="flex items-center gap-2 font-display text-lg font-semibold text-red-800">
            <XCircle /> Belum tepat. Jawaban yang benar: {feedback.correct_answer_label}
          </p>
          <Kubi mood="encourage" size={48}>
            Tidak apa-apa! Yuk, pelajari langkahnya supaya soal berikutnya lebih mudah.
          </Kubi>
          <Explanation steps={feedback.explanation} />
        </div>
      )}

      <div className="flex flex-wrap justify-between gap-3">
        {onCancel ? (
          <button className="btn-light btn-sm" onClick={onCancel} type="button">
            Keluar
          </button>
        ) : (
          <span />
        )}
        {showRetry ? (
          <button className="btn-sun" onClick={retry} type="button">
            Coba lagi
          </button>
        ) : locked ? (
          <button className="btn-primary" onClick={next} disabled={busy} type="button">
            {busy ? <Loader2 className="animate-spin" size={18} /> : null}
            {last ? 'Lihat hasil' : 'Soal berikutnya'} <ArrowRight size={18} />
          </button>
        ) : (
          <button className="btn-primary" onClick={check} disabled={busy || !isAnswered(q, value)} type="button">
            {busy ? <Loader2 className="animate-spin" size={18} /> : null} Periksa jawaban
          </button>
        )}
      </div>
    </div>
  )
}
