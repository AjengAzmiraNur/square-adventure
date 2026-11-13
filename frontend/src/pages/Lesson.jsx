import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, CheckCircle2, Flag, Lock, Map } from 'lucide-react'
import { useProgress } from '../context/ProgressContext'
import { useToast } from '../context/ToastContext'
import { api } from '../lib/api'
import { LESSON_CONTENT, LESSON_ORDER } from '../content/lessons'
import { REGIONS } from '../lib/levels'
import Kubi from '../components/Kubi'
import QuizRunner from '../components/quiz/QuizRunner'
import ResultView from '../components/quiz/ResultView'
import { Explanation } from '../components/quiz/QuestionView'
import { ILLUSTRATIONS } from '../components/lesson/Illustrations'
import { ErrorBox, Spinner } from '../components/ui'

const STEPS = ['Tujuan', 'Konsep', 'Ilustrasi', 'Contoh bilangan', 'Langkah', 'Contoh soal', 'Latihan singkat', 'Rangkuman']

function WorkedExample({ worked }) {
  const [shown, setShown] = useState(1)
  return (
    <div className="space-y-4">
      <div className="rounded-xl border-l-4 border-royal bg-white p-4">
        <p className="text-sm font-bold text-royal">Contoh soal</p>
        <p className="text-lg font-semibold text-navy">{worked.problem}</p>
      </div>
      <p className="font-bold text-navy">Penyelesaian bertahap</p>
      <ol className="space-y-2">
        {worked.steps.slice(0, shown).map((s, i) => (
          <li key={i} className="flex animate-rise gap-3 rounded-xl bg-white p-3">
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-royal text-sm font-bold text-white">{i + 1}</span>
            <span className="text-slate-700">{s}</span>
          </li>
        ))}
      </ol>
      {shown < worked.steps.length ? (
        <button type="button" className="btn-light btn-sm" onClick={() => setShown(shown + 1)}>
          Tampilkan langkah berikutnya ({shown}/{worked.steps.length})
        </button>
      ) : (
        <p className="flex items-center gap-2 font-bold text-emerald-700">
          <CheckCircle2 size={18} /> Semua langkah sudah ditampilkan.
        </p>
      )}
    </div>
  )
}

export default function Lesson() {
  const { slug } = useParams()
  const { lessons, progress, isUnlocked, loading, refresh } = useProgress()
  const { celebrate } = useToast()
  const [step, setStep] = useState(0)
  const [checkResult, setCheckResult] = useState(null)
  const [checkKey, setCheckKey] = useState(0)
  const [completing, setCompleting] = useState(false)
  const [error, setError] = useState('')
  const [justCompleted, setJustCompleted] = useState(false)

  const lesson = lessons.find((l) => l.slug === slug)
  const content = LESSON_CONTENT[slug]
  const open = lesson && isUnlocked(lesson)

  useEffect(() => {
    setStep(0)
    setCheckResult(null)
    setJustCompleted(false)
    setError('')
  }, [slug])

  useEffect(() => {
    if (open) api(`/api/lessons/${slug}/start`).catch(() => {})
  }, [slug, open])

  if (loading) return <Spinner light />
  if (!lesson || !content) return <ErrorBox message="Materi tidak ditemukan." />
  if (!open)
    return (
      <div className="panel mx-auto max-w-lg text-center">
        <Lock className="mx-auto text-slate-400" size={40} />
        <h1 className="mt-2 text-2xl font-bold text-navy">Level 0{lesson.level} masih terkunci</h1>
        <p className="mt-2 text-slate-600">Selesaikan Level 0{lesson.level - 1} terlebih dahulu untuk membuka wilayah ini.</p>
        <Link to="/app/peta" className="btn-primary mt-4">
          <Map size={18} /> Kembali ke peta
        </Link>
      </div>
    )

  const done = progress[slug]?.status === 'completed' || justCompleted
  const nextSlug = LESSON_ORDER[LESSON_ORDER.indexOf(slug) + 1]
  const Illustration = ILLUSTRATIONS[content.illustration]
  const region = REGIONS[slug]

  const complete = async () => {
    setCompleting(true)
    setError('')
    try {
      const r = await api(`/api/lessons/${slug}/complete`)
      celebrate(r)
      setJustCompleted(true)
      await refresh()
    } catch (e) {
      setError(e.message)
    } finally {
      setCompleting(false)
    }
  }

  const canNext = step !== 6 || checkResult
  const body = () => {
    switch (step) {
      case 0:
        return (
          <div className="space-y-4">
            <Kubi mood="happy" size={64}>
              {content.greeting}
            </Kubi>
            <div className="rounded-xl bg-white p-4">
              <p className="mb-2 font-bold text-navy">Tujuan pembelajaran</p>
              <ul className="space-y-2">
                {content.goals.map((g) => (
                  <li key={g} className="flex gap-2 text-slate-700">
                    <Flag className="mt-0.5 shrink-0 text-royal" size={18} /> {g}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )
      case 1:
        return (
          <dl className="space-y-3">
            {content.concept.map((c) => (
              <div key={c.term} className="rounded-xl bg-white p-4">
                <dt className="font-display text-lg font-semibold text-royal">{c.term}</dt>
                <dd className="text-slate-700">{c.text}</dd>
              </div>
            ))}
          </dl>
        )
      case 2:
        return (
          <div className="space-y-3">
            <p className="font-semibold text-slate-700">{content.illustrationNote}</p>
            <Illustration />
          </div>
        )
      case 3:
        return (
          <div className="space-y-3">
            <div className="overflow-x-auto rounded-xl">
              <table className="w-full min-w-[420px] text-center">
                <thead className="bg-navy text-white">
                  <tr>
                    {content.examples.head.map((h) => (
                      <th key={h} className="p-3">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white font-semibold">
                  {content.examples.rows.map((r, i) => (
                    <tr key={i} className="border-t border-slate-100">
                      {r.map((c, j) => (
                        <td key={j} className="p-3">
                          {c}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="rounded-xl bg-sun/25 p-3 font-bold text-navy">{content.examples.note}</p>
          </div>
        )
      case 4:
        return <Explanation steps={content.steps} title="Langkah menemukan pola" />
      case 5:
        return <WorkedExample worked={content.worked} />
      case 6:
        return checkResult ? (
          <ResultView
            result={checkResult}
            title="Hasil latihan singkat"
            onRetry={() => {
              setCheckResult(null)
              setCheckKey((k) => k + 1)
            }}
          />
        ) : (
          <QuizRunner
            key={checkKey}
            quizSlug={`lesson-${content.level}-check`}
            onFinished={(r) => {
              setCheckResult(r)
              refresh()
            }}
          />
        )
      default:
        return (
          <div className="space-y-4">
            <div className="rounded-xl bg-white p-4">
              <p className="mb-2 font-bold text-navy">Rangkuman</p>
              <ul className="space-y-2">
                {content.summary.map((s) => (
                  <li key={s} className="flex gap-2 text-slate-700">
                    <CheckCircle2 className="mt-0.5 shrink-0 text-emerald-600" size={18} /> {s}
                  </li>
                ))}
              </ul>
            </div>
            {error && <ErrorBox message={error} />}
            {done ? (
              <Kubi mood="cheer" size={64}>
                Luar biasa! Kamu berhasil {nextSlug ? 'membuka petualangan berikutnya' : 'menaklukkan semua wilayah'}!
              </Kubi>
            ) : !checkResult && !progress[slug]?.check_score ? (
              <p className="rounded-xl bg-amber-50 p-3 font-semibold text-amber-800">Kerjakan Latihan Singkat dulu sebelum menyelesaikan misi.</p>
            ) : null}
            <div className="flex flex-wrap gap-3">
              {!done && (
                <button type="button" className="btn-sun" onClick={complete} disabled={completing}>
                  <Flag size={18} /> {completing ? 'Menyimpan...' : 'Selesaikan misi'}
                </button>
              )}
              {done && nextSlug && (
                <Link to={`/app/materi/${nextSlug}`} className="btn-primary">
                  Materi berikutnya <ArrowRight size={18} />
                </Link>
              )}
              {done && !nextSlug && (
                <Link to="/app/evaluasi" className="btn-primary">
                  Menuju Final Challenge <ArrowRight size={18} />
                </Link>
              )}
              <Link to="/app/peta" className="btn-light">
                <Map size={18} /> Peta
              </Link>
            </div>
          </div>
        )
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-4 text-white">
        <Link to="/app/peta" className="inline-flex items-center gap-1 text-sm font-bold text-white/70 hover:text-white">
          <ArrowLeft size={16} /> Peta
        </Link>
        <p className="label-eyebrow mt-3" style={{ color: region.color }}>
          Level 0{content.level} — {lesson.title} · {region.region}
        </p>
        <h1 className="text-3xl font-bold">{content.title}</h1>
        {done && <span className="chip mt-2 bg-mint/20 text-mint"><CheckCircle2 size={14} /> Misi selesai</span>}
      </div>

      {/* Navigasi langkah */}
      <ol className="mb-4 flex gap-1 overflow-x-auto pb-1" aria-label="Langkah materi">
        {STEPS.map((s, i) => (
          <li key={s} className="shrink-0">
            <button
              type="button"
              onClick={() => (i <= 6 || checkResult || done ? setStep(i) : null)}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold ${i === step ? 'bg-sun text-navy' : i < step ? 'bg-white/20 text-white' : 'bg-white/5 text-white/60'}`}
              aria-current={i === step ? 'step' : undefined}
            >
              {i + 1}. {s}
            </button>
          </li>
        ))}
      </ol>

      <section className="panel animate-rise" key={step}>
        <h2 className="mb-4 text-xl font-bold text-navy">{STEPS[step]}</h2>
        {body()}
      </section>

      <div className="mt-4 flex justify-between">
        <button type="button" className="btn-ghost btn-sm" disabled={step === 0} onClick={() => setStep(step - 1)}>
          <ArrowLeft size={16} /> Sebelumnya
        </button>
        {step < STEPS.length - 1 && (
          <button type="button" className="btn-sun btn-sm" disabled={!canNext && !done} onClick={() => setStep(step + 1)}>
            Lanjut <ArrowRight size={16} />
          </button>
        )}
      </div>
    </div>
  )
}
