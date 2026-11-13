import { useState } from 'react'
import { PenLine } from 'lucide-react'
import { useProgress } from '../context/ProgressContext'
import { useToast } from '../context/ToastContext'
import QuizRunner from '../components/quiz/QuizRunner'
import ResultView from '../components/quiz/ResultView'
import Kubi from '../components/Kubi'
import { PageTitle } from '../components/ui'

const LEVELS = [
  {
    slug: 'training-beginner',
    name: 'Beginner',
    tag: 'Level 1',
    color: 'bg-mint',
    points: ['Mengenal pola bilangan persegi', 'Mengidentifikasi susunan kotak', 'Menentukan jumlah kotak'],
  },
  {
    slug: 'training-intermediate',
    name: 'Intermediate',
    tag: 'Level 2',
    color: 'bg-sky',
    points: ['Melengkapi urutan bilangan', 'Menentukan selisih antarbilangan', 'Menentukan suku berikutnya'],
  },
  {
    slug: 'training-expert',
    name: 'Expert',
    tag: 'Level 3',
    color: 'bg-lilac',
    points: ['Menggunakan rumus Uₙ = n²', 'Menentukan suku ke-n', 'Soal cerita & menjelaskan alasan'],
  },
]

export default function Training() {
  const { bestQuiz, refresh } = useProgress()
  const { celebrate } = useToast()
  const [active, setActive] = useState(null)
  const [result, setResult] = useState(null)
  const [runKey, setRunKey] = useState(0)

  const level = LEVELS.find((l) => l.slug === active)

  if (active) {
    return (
      <div className="mx-auto max-w-3xl">
        <PageTitle eyebrow={`Training Zone · ${level.tag}`} title={level.name} icon={PenLine} />
        {result ? (
          <ResultView
            result={result}
            title={`Hasil Training ${level.name}`}
            onRetry={() => {
              setResult(null)
              setRunKey((k) => k + 1)
            }}
          >
            <button type="button" className="btn-primary" onClick={() => { setActive(null); setResult(null) }}>
              Pilih tingkat lain
            </button>
          </ResultView>
        ) : (
          <QuizRunner
            key={runKey}
            quizSlug={active}
            onCancel={() => setActive(null)}
            onFinished={(r) => {
              setResult(r)
              celebrate(r)
              refresh()
            }}
          />
        )}
      </div>
    )
  }

  return (
    <div>
      <PageTitle eyebrow="Training Zone" title="Zona Latihan" icon={PenLine}>
        Latihan bertingkat dari mudah ke sulit. Jika salah, Kubi memberi petunjuk dulu, lalu pembahasan langkah demi langkah.
      </PageTitle>
      <div className="mb-6 rounded-2xl bg-snow p-4">
        <Kubi mood="happy" size={56}>
          Mulailah dari Beginner, lalu naik ke Intermediate dan Expert. Setiap sesi berisi 8 soal acak.
        </Kubi>
      </div>
      <div className="space-y-4">
        {LEVELS.map((l, i) => {
          const best = bestQuiz(l.slug)
          return (
            <div key={l.slug} className="flex flex-col gap-4 rounded-2xl bg-white/5 p-5 text-white sm:flex-row sm:items-center" style={{ marginLeft: `${i * 4}%` }}>
              <div className={`grid h-16 w-16 shrink-0 place-items-center rounded-2xl font-display text-2xl font-bold text-navy ${l.color}`}>{i + 1}</div>
              <div className="flex-1">
                <p className="text-xs font-bold uppercase tracking-wider text-white/60">{l.tag}</p>
                <p className="font-display text-2xl font-semibold">{l.name}</p>
                <p className="text-sm text-white/70">{l.points.join(' · ')}</p>
              </div>
              <div className="flex items-center gap-3">
                {best != null && <span className="chip bg-sun/20 text-sun">Terbaik: {best}</span>}
                <button type="button" className="btn-sun" onClick={() => { setActive(l.slug); setResult(null) }}>
                  Mulai latihan
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
