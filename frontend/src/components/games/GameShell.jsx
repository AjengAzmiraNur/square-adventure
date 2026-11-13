import { useCallback, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Gamepad2, Play, RotateCcw } from 'lucide-react'
import { api } from '../../lib/api'
import { useProgress } from '../../context/ProgressContext'
import { useToast } from '../../context/ToastContext'
import Kubi from '../Kubi'
import BadgeIcon from '../BadgeIcon'
import { ErrorBox, Stars } from '../ui'

/**
 * Kerangka umum permainan: petunjuk & aturan → bermain → hasil akhir.
 * Ronde, kunci jawaban, dan skor dikelola server; komponen permainan hanya
 * mengirim jawaban melalui `actions`.
 */
export default function GameShell({ slug, meta, Game }) {
  const { refresh } = useProgress()
  const { celebrate } = useToast()
  const [phase, setPhase] = useState('intro')
  const [session, setSession] = useState(null)
  const [result, setResult] = useState(null)
  const [difficulty, setDifficulty] = useState(meta.difficulties?.[0]?.value || null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const start = async () => {
    setBusy(true)
    setError('')
    try {
      const s = await api(`/api/games/${slug}/start`, { body: { difficulty } })
      setSession(s)
      setResult(null)
      setPhase('play')
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }

  const answer = useCallback(
    (roundIndex, value) => api(`/api/games/sessions/${session.session_id}/answer`, { body: { round_index: roundIndex, answer: value } }),
    [session],
  )
  const hint = useCallback((roundIndex) => api(`/api/games/sessions/${session.session_id}/hint`, { body: { round_index: roundIndex } }), [session])
  const finish = useCallback(async () => {
    try {
      const r = await api(`/api/games/sessions/${session.session_id}/finish`)
      setResult(r)
      setPhase('result')
      celebrate(r)
      refresh()
    } catch (e) {
      setError(e.message)
    }
  }, [session, celebrate, refresh])

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-4 flex items-center justify-between text-white">
        <Link to="/app/playground" className="inline-flex items-center gap-1 text-sm font-bold text-white/70 hover:text-white">
          <ArrowLeft size={16} /> Playground
        </Link>
        {phase === 'play' && session && <span className="chip bg-white/10">Skor maks. {session.max_score}</span>}
      </div>
      <h1 className="mb-4 flex items-center gap-3 text-3xl font-bold text-white">
        <Gamepad2 className="text-sky" /> {meta.title}
      </h1>

      {phase === 'intro' && (
        <div className="panel space-y-5">
          <Kubi mood="happy" size={60}>
            {meta.intro}
          </Kubi>
          <div>
            <p className="mb-2 font-bold text-navy">Petunjuk permainan</p>
            <p className="text-slate-700">{meta.howTo}</p>
          </div>
          <div>
            <p className="mb-2 font-bold text-navy">Aturan & skor</p>
            <ul className="list-disc space-y-1 pl-5 text-slate-700">
              {meta.rules.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
          </div>
          {meta.difficulties && (
            <fieldset>
              <legend className="mb-2 font-bold text-navy">Tingkat kesulitan</legend>
              <div className="flex flex-wrap gap-2">
                {meta.difficulties.map((d) => (
                  <button key={d.value} type="button" onClick={() => setDifficulty(d.value)} className={`btn btn-sm ${difficulty === d.value ? 'bg-royal text-white' : 'border-2 border-slate-200 bg-white'}`} aria-pressed={difficulty === d.value}>
                    {d.label}
                  </button>
                ))}
              </div>
              <p className="mt-1 text-sm text-slate-500">{meta.difficulties.find((d) => d.value === difficulty)?.text}</p>
            </fieldset>
          )}
          {error && <ErrorBox message={error} />}
          <button type="button" className="btn-sun text-lg" onClick={start} disabled={busy}>
            <Play size={20} /> {busy ? 'Menyiapkan...' : 'Mulai bermain'}
          </button>
        </div>
      )}

      {phase === 'play' && session && (
        <>
          {error && (
            <div className="mb-3">
              <ErrorBox message={error} />
            </div>
          )}
          <Game session={session} actions={{ answer, hint, finish }} />
        </>
      )}

      {phase === 'result' && result && (
        <div className="panel animate-rise space-y-5 text-center">
          <p className="label-eyebrow text-royal">Hasil akhir</p>
          <p className="font-display text-5xl font-bold text-navy">
            {result.score}
            <span className="text-2xl text-slate-400">/{result.max_score}</span>
          </p>
          <Stars count={result.stars} size={36} />
          <p className="text-slate-600">
            {result.correct} dari {result.rounds} ronde benar · +{result.xp_awarded} XP
          </p>
          {result.xp_awarded === 0 && <p className="text-xs text-slate-500">XP hanya bertambah jika skormu melampaui skor terbaikmu.</p>}
          <div className="flex justify-center">
            <Kubi mood={result.stars >= 2 ? 'cheer' : 'encourage'} size={60}>
              {result.stars >= 3 ? 'Sempurna! Kamu juara persegi!' : result.stars >= 2 ? 'Hebat! Sedikit lagi bintang tiga!' : 'Ayo coba lagi — setiap percobaan membuatmu makin jago!'}
            </Kubi>
          </div>
          {result.new_achievements?.map((a) => (
            <p key={a.slug} className="inline-flex animate-pop items-center gap-2 rounded-xl bg-sun/20 px-3 py-2 font-bold text-navy">
              <BadgeIcon name={a.icon} /> Lencana baru: {a.title}
            </p>
          ))}
          <div className="flex flex-wrap justify-center gap-3">
            <button type="button" className="btn-sun" onClick={start} disabled={busy}>
              <RotateCcw size={18} /> Main lagi
            </button>
            <Link to="/app/playground" className="btn-light">
              Pilih permainan lain
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}

/** Panel umpan balik umum setelah menjawab ronde. */
export function RoundFeedback({ res, onNext, nextLabel }) {
  if (!res) return null
  const good = res.correct
  return (
    <div className={`animate-rise space-y-3 rounded-2xl p-4 ${good ? 'bg-emerald-50' : res.final ? 'bg-red-50' : 'bg-amber-50'}`}>
      <Kubi mood={good ? 'cheer' : 'encourage'} size={48}>
        {good ? `Benar! +${res.points} poin.` : res.final ? 'Belum tepat. Yuk lihat cara yang benar.' : 'Hampir! Coba perhatikan petunjuk ini:'}
        {!good && !res.final && res.hint && <span className="block font-normal">{res.hint}</span>}
      </Kubi>
      {res.final && res.explanation && (
        <ol className="list-decimal space-y-1 rounded-xl bg-white p-3 pl-8 text-left text-slate-700">
          {res.explanation.map((e) => (
            <li key={e}>{e}</li>
          ))}
        </ol>
      )}
      {res.final && onNext && (
        <button type="button" className="btn-primary" onClick={onNext}>
          {nextLabel || 'Lanjut'}
        </button>
      )}
    </div>
  )
}
