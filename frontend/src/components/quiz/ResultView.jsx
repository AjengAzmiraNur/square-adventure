import { useState } from 'react'
import { CheckCircle2, ChevronDown, XCircle } from 'lucide-react'
import Kubi from '../Kubi'
import BadgeIcon from '../BadgeIcon'
import { Stars } from '../ui'
import { Explanation } from './QuestionView'

export function ReviewList({ review }) {
  const [open, setOpen] = useState(null)
  return (
    <ol className="space-y-2">
      {review.map((r, i) => (
        <li key={r.id} className={`rounded-xl border-2 ${r.correct ? 'border-emerald-200 bg-emerald-50/60' : 'border-red-200 bg-red-50/60'}`}>
          <button type="button" className="flex w-full items-start gap-3 p-3 text-left" onClick={() => setOpen(open === i ? null : i)} aria-expanded={open === i}>
            {r.correct ? <CheckCircle2 className="mt-0.5 shrink-0 text-emerald-600" /> : <XCircle className="mt-0.5 shrink-0 text-red-500" />}
            <span className="flex-1">
              <span className="block font-bold text-navy">
                {i + 1}. {r.prompt}
              </span>
              <span className="block text-sm text-slate-600">
                Jawabanmu: <b>{r.your_answer_label}</b>
                {!r.correct && (
                  <>
                    {' '}
                    · Jawaban benar: <b className="text-emerald-700">{r.correct_answer_label}</b>
                  </>
                )}
              </span>
            </span>
            <ChevronDown className={`shrink-0 transition ${open === i ? 'rotate-180' : ''}`} />
          </button>
          {open === i && (
            <div className="space-y-2 px-3 pb-3">
              {r.visual?.items && (
                <p className="text-sm text-slate-600">
                  Pola: {r.visual.items.map((v) => (v === null ? '__' : v)).join(', ')}
                </p>
              )}
              <Explanation steps={r.explanation} />
              {r.reason && (
                <p className="rounded-lg bg-white p-3 text-sm text-slate-700">
                  <b>Alasanmu:</b> {r.reason}
                </p>
              )}
            </div>
          )}
        </li>
      ))}
    </ol>
  )
}

export default function ResultView({ result, title, onRetry, children }) {
  const pct = Number(result.score_pct)
  const mood = pct >= 70 ? 'cheer' : pct >= 40 ? 'happy' : 'encourage'
  const msg =
    pct >= 90 ? 'Luar biasa! Kamu benar-benar menguasai pola persegi!' : pct >= 70 ? 'Hebat! Sedikit lagi menuju sempurna.' : pct >= 40 ? 'Usaha yang bagus! Pelajari pembahasannya, lalu coba lagi.' : 'Jangan menyerah! Baca pembahasan langkah demi langkah di bawah, ya.'
  return (
    <div className="panel animate-rise space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="label-eyebrow text-royal">{title}</p>
          <p className="font-display text-5xl font-bold text-navy">{pct}</p>
          <p className="text-slate-600">
            {result.correct} dari {result.total} soal benar
          </p>
        </div>
        <div className="text-right">
          <Stars count={result.stars} size={32} />
          <p className="mt-1 font-display text-lg font-semibold text-royal">+{result.xp_awarded} XP</p>
          {result.xp_awarded === 0 && <p className="text-xs text-slate-500">XP hanya bertambah jika skormu lebih tinggi dari sebelumnya.</p>}
        </div>
      </div>
      <Kubi mood={mood} size={60}>
        {msg}
      </Kubi>
      {result.new_achievements?.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {result.new_achievements.map((a) => (
            <div key={a.slug} className="flex animate-pop items-center gap-2 rounded-xl bg-sun/20 px-3 py-2 font-bold text-navy">
              <BadgeIcon name={a.icon} /> {a.title}
            </div>
          ))}
        </div>
      )}
      {children}
      {result.review?.length > 0 && (
        <div>
          <h3 className="mb-2 text-lg font-bold text-navy">Pembahasan</h3>
          <ReviewList review={result.review} />
        </div>
      )}
      {onRetry && (
        <button className="btn-light" type="button" onClick={onRetry}>
          Ulangi latihan
        </button>
      )}
    </div>
  )
}
