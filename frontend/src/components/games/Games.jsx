import { useEffect, useRef, useState } from 'react'
import { Castle, Check, DoorOpen, Lightbulb, Lock, Minus, Plus, Timer } from 'lucide-react'
import SquareGrid from '../SquareGrid'
import { SequenceInput } from '../quiz/QuestionView'
import { ErrorBox, ProgressBar } from '../ui'
import { RoundFeedback } from './GameShell'
import { square, sub } from '../../lib/squares'

function useRounds(session) {
  const [idx, setIdx] = useState(0)
  const [res, setRes] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const round = session.rounds[idx]
  const last = idx === session.rounds.length - 1
  return { idx, setIdx, res, setRes, busy, setBusy, error, setError, round, last, total: session.rounds.length }
}

async function submitAnswer(ctx, actions, value) {
  ctx.setBusy(true)
  ctx.setError('')
  try {
    const r = await actions.answer(ctx.idx, value)
    ctx.setRes(r)
    return r
  } catch (e) {
    ctx.setError(e.message)
    return null
  } finally {
    ctx.setBusy(false)
  }
}

function RoundHeader({ ctx, children }) {
  return (
    <div className="mb-4 flex items-center gap-3">
      <span className="shrink-0 font-display text-sm font-bold text-slate-500">
        Ronde {ctx.idx + 1}/{ctx.total}
      </span>
      <ProgressBar value={(ctx.idx / ctx.total) * 100} track="bg-slate-200" color="bg-royal" label="Progres permainan" />
      {children}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* GAME 1 — SQUARE HUNTER: pilih semua susunan berbentuk persegi       */
/* ------------------------------------------------------------------ */
export function SquareHunter({ session, actions }) {
  const ctx = useRounds(session)
  const [picked, setPicked] = useState([])
  const toggle = (i) => !ctx.res && setPicked((p) => (p.includes(i) ? p.filter((x) => x !== i) : [...p, i]))
  const next = () => {
    if (ctx.last) return actions.finish()
    ctx.setIdx(ctx.idx + 1)
    ctx.setRes(null)
    setPicked([])
  }
  const correctSet = ctx.res ? ctx.res.correct_answer : null
  return (
    <div className="panel">
      <RoundHeader ctx={ctx} />
      <p className="mb-3 text-lg font-bold text-navy">{ctx.round.instruction}</p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {ctx.round.cards.map((c, i) => {
          const sel = picked.includes(i)
          const isSq = correctSet?.includes(i)
          const cls = ctx.res
            ? isSq
              ? 'border-emerald-500 bg-emerald-50'
              : sel
                ? 'border-red-400 bg-red-50'
                : 'border-slate-200 bg-white opacity-60'
            : sel
              ? 'border-royal bg-blue-50 ring-4 ring-sky/40'
              : 'border-slate-200 bg-white hover:border-sky'
          return (
            <button key={i} type="button" onClick={() => toggle(i)} aria-pressed={sel} className={`flex min-h-36 flex-col items-center justify-center gap-2 rounded-2xl border-2 p-3 transition ${cls}`}>
              <SquareGrid rows={c.rows} cols={c.cols} cell={14} gap={2} maxSize={120} />
              {ctx.res && (
                <span className="text-xs font-bold text-slate-600">
                  {c.rows} × {c.cols}
                </span>
              )}
              {sel && !ctx.res && <Check className="text-royal" size={18} />}
            </button>
          )
        })}
      </div>
      {ctx.error && <div className="mt-3"><ErrorBox message={ctx.error} /></div>}
      <div className="mt-4">
        {ctx.res ? (
          <RoundFeedback res={ctx.res} onNext={next} nextLabel={ctx.last ? 'Lihat hasil' : 'Ronde berikutnya'} />
        ) : (
          <button type="button" className="btn-primary" disabled={!picked.length || ctx.busy} onClick={() => submitAnswer(ctx, actions, picked)}>
            Periksa pilihan ({picked.length})
          </button>
        )}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* GAME 2 — COMPLETE THE PATTERN: isi bilangan yang hilang             */
/* ------------------------------------------------------------------ */
export function CompletePattern({ session, actions }) {
  const ctx = useRounds(session)
  const blanks = ctx.round.items.filter((v) => v === null).length
  const [vals, setVals] = useState(Array(blanks).fill(''))
  const ready = vals.every((v) => v !== '')
  const next = () => {
    if (ctx.last) return actions.finish()
    const nb = session.rounds[ctx.idx + 1].items.filter((v) => v === null).length
    ctx.setIdx(ctx.idx + 1)
    ctx.setRes(null)
    setVals(Array(nb).fill(''))
  }
  const check = () => ready && !ctx.busy && !ctx.res?.final && submitAnswer(ctx, actions, vals)
  return (
    <div className="panel">
      <RoundHeader ctx={ctx} />
      <p className="mb-3 text-lg font-bold text-navy">{ctx.round.instruction}</p>
      <SequenceInput items={ctx.round.items} value={vals} onChange={setVals} disabled={ctx.busy || ctx.res?.final || ctx.res?.correct} onEnter={check} reveal={ctx.res?.final && !ctx.res.correct ? { correct: ctx.res.correct_answer } : null} />
      {ctx.error && <div className="mt-3"><ErrorBox message={ctx.error} /></div>}
      <div className="mt-4 space-y-3">
        <RoundFeedback res={ctx.res} onNext={next} nextLabel={ctx.last ? 'Lihat hasil' : 'Ronde berikutnya'} />
        {!ctx.res?.final && (
          <button type="button" className="btn-primary" disabled={!ready || ctx.busy} onClick={check}>
            {ctx.res ? 'Periksa lagi' : 'Periksa'}
          </button>
        )}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* GAME 3 — FIND THE NEXT NUMBER: cepat & tepat sebelum waktu habis    */
/* ------------------------------------------------------------------ */
export function NextNumber({ session, actions }) {
  const ctx = useRounds(session)
  const [value, setValue] = useState('')
  const [log, setLog] = useState([])
  const [left, setLeft] = useState(session.time_limit_seconds)
  const finished = useRef(false)
  const inputRef = useRef(null)

  const end = () => {
    if (finished.current) return
    finished.current = true
    actions.finish()
  }
  const endRef = useRef(end)
  endRef.current = end

  useEffect(() => {
    const deadline = Date.now() + session.time_limit_seconds * 1000
    const t = setInterval(() => {
      const s = Math.max(0, Math.round((deadline - Date.now()) / 1000))
      setLeft(s)
      if (s === 0) {
        clearInterval(t)
        endRef.current()
      }
    }, 250)
    return () => clearInterval(t)
  }, [session])

  const submit = async (e) => {
    e?.preventDefault()
    if (value === '' || ctx.busy || finished.current) return
    const r = await submitAnswer(ctx, actions, value)
    if (!r) return
    if (r.time_up) return end()
    setLog((l) => [{ seq: ctx.round.sequence, answer: value, ...r }, ...l])
    setValue('')
    ctx.setRes(null)
    if (r.finished) return end()
    ctx.setIdx(ctx.idx + 1)
    inputRef.current?.focus()
  }

  const press = (d) => setValue((v) => (d === 'del' ? v.slice(0, -1) : (v + d).slice(0, 6)))
  const lastLog = log[0]

  return (
    <div className="panel space-y-4">
      <div className="flex items-center gap-3">
        <Timer className={left <= 10 ? 'text-red-500' : 'text-royal'} />
        <ProgressBar value={(left / session.time_limit_seconds) * 100} track="bg-slate-200" color={left <= 10 ? 'bg-red-500' : 'bg-sun'} label="Sisa waktu" />
        <span className="w-12 text-right font-display text-xl font-bold text-navy">{left}s</span>
      </div>
      <p className="text-sm font-bold text-slate-500">
        Soal {ctx.idx + 1}/{ctx.total} · Skor {log.reduce((s, l) => s + (l.points || 0), 0)}
      </p>
      <div className="flex flex-wrap items-center justify-center gap-2 rounded-2xl bg-navy p-5">
        {ctx.round.sequence.map((v, i) => (
          <span key={i} className="rounded-xl bg-white/10 px-3 py-2 font-display text-2xl font-bold text-white sm:text-3xl">
            {v}
          </span>
        ))}
        <span className="rounded-xl border-2 border-dashed border-sun px-4 py-2 font-display text-2xl font-bold text-sun sm:text-3xl">{value || '?'}</span>
      </div>
      <form onSubmit={submit} className="flex gap-2">
        <input ref={inputRef} className="input text-2xl" inputMode="numeric" value={value} onChange={(e) => setValue(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))} placeholder="bilangan berikutnya" aria-label="Bilangan berikutnya" autoFocus />
        <button className="btn-primary" type="submit" disabled={!value || ctx.busy}>
          Jawab
        </button>
      </form>
      <div className="grid grid-cols-6 gap-2 sm:hidden" aria-label="Papan angka">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', 'del'].map((d) => (
          <button key={d} type="button" onClick={() => press(d)} className={`rounded-xl bg-white py-3 font-display text-xl font-bold text-navy shadow ${d === 'del' ? 'col-span-2' : ''}`}>
            {d === 'del' ? '⌫' : d}
          </button>
        ))}
      </div>
      {ctx.error && <ErrorBox message={ctx.error} />}
      {lastLog && (
        <div className={`rounded-xl p-3 text-sm ${lastLog.correct ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-800'}`} aria-live="polite">
          <b>{lastLog.correct ? 'Benar!' : `Belum tepat — jawabannya ${lastLog.correct_answer}.`}</b> {lastLog.explanation?.join(' ')}
        </div>
      )}
      <button type="button" className="btn-light btn-sm" onClick={end}>
        Selesai sekarang
      </button>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* GAME 4 — SQUARE FORMULA CHALLENGE: hitung & bangun dengan Uₙ = n²   */
/* ------------------------------------------------------------------ */
export function FormulaChallenge({ session, actions }) {
  const ctx = useRounds(session)
  const [value, setValue] = useState('')
  const [size, setSize] = useState(1)
  const r = ctx.round
  const next = () => {
    if (ctx.last) return actions.finish()
    ctx.setIdx(ctx.idx + 1)
    ctx.setRes(null)
    setValue('')
    setSize(1)
  }
  const locked = ctx.res?.final
  const send = () => {
    if (ctx.busy || locked) return
    if (r.mode === 'build') return submitAnswer(ctx, actions, size)
    if (value !== '') submitAnswer(ctx, actions, value)
  }
  return (
    <div className="panel">
      <RoundHeader ctx={ctx}>
        <span className="chip shrink-0 bg-lilac/20 text-violet-700">{r.mode === 'build' ? 'Bangun' : r.mode === 'find_n' ? 'Cari n' : 'Hitung'}</span>
      </RoundHeader>
      <p className="mb-4 text-xl font-bold text-navy">{r.instruction}</p>

      {r.mode === 'build' ? (
        <div className="grid items-center gap-5 md:grid-cols-2">
          <div className="flex min-h-[240px] items-center justify-center rounded-xl bg-white p-3">
            <SquareGrid rows={size} cell={26} maxSize={230} variant={size * size === r.target ? 'plant' : 'block'} />
          </div>
          <div className="space-y-3">
            <p className="text-slate-700">
              Target: <b>{r.target}</b> kotak
            </p>
            <div className="flex items-center gap-3">
              <button type="button" className="btn-light btn-sm" onClick={() => setSize(Math.max(1, size - 1))} disabled={locked || size <= 1} aria-label="Kecilkan">
                <Minus size={16} />
              </button>
              <span className="font-display text-2xl font-bold text-navy">sisi {size}</span>
              <button type="button" className="btn-light btn-sm" onClick={() => setSize(Math.min(12, size + 1))} disabled={locked || size >= 12} aria-label="Besarkan">
                <Plus size={16} />
              </button>
            </div>
            <input type="range" min={1} max={12} value={size} disabled={locked} onChange={(e) => setSize(Number(e.target.value))} className="w-full accent-royal" aria-label="Sisi persegi" />
            <p className={`rounded-xl p-3 font-display text-lg font-semibold ${size * size === r.target ? 'bg-mint/40' : 'bg-slate-100'} text-navy`}>
              {size} × {size} = {square(size)} kotak
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="rounded-xl bg-lilac/15 p-3 font-display text-lg text-navy">
            {r.mode === 'compute' ? `U${sub(r.n)} = ${r.n}² = ?` : `n² = ${r.value} → n = ?`}
          </p>
          <input className="input max-w-xs text-2xl" inputMode="numeric" value={value} disabled={locked} onChange={(e) => setValue(e.target.value.replace(/[^0-9]/g, ''))} onKeyDown={(e) => e.key === 'Enter' && send()} placeholder="jawaban" aria-label="Jawaban" />
        </div>
      )}
      {ctx.error && <div className="mt-3"><ErrorBox message={ctx.error} /></div>}
      <div className="mt-4 space-y-3">
        <RoundFeedback res={ctx.res} onNext={next} nextLabel={ctx.last ? 'Lihat hasil' : 'Tahap berikutnya'} />
        {!locked && (
          <button type="button" className="btn-primary" onClick={send} disabled={ctx.busy || (r.mode !== 'build' && value === '')}>
            {r.mode === 'build' ? 'Kunci persegi' : 'Periksa'}
          </button>
        )}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* GAME 5 — SQUARE ADVENTURE QUEST: buka 5 gerbang menuju kastel       */
/* ------------------------------------------------------------------ */
export function AdventureQuest({ session, actions }) {
  const ctx = useRounds(session)
  const [value, setValue] = useState('')
  const [hint, setHint] = useState('')
  const [opened, setOpened] = useState([])
  const r = ctx.round
  const locked = ctx.res?.final
  const send = () => !ctx.busy && !locked && value !== '' && submitAnswer(ctx, actions, value).then((res) => res?.correct && setOpened((o) => [...o, ctx.idx]))
  const askHint = async () => {
    try {
      const h = await actions.hint(ctx.idx)
      setHint(`${h.hint} (${h.penalty})`)
    } catch (e) {
      ctx.setError(e.message)
    }
  }
  const next = () => {
    if (ctx.last) return actions.finish()
    ctx.setIdx(ctx.idx + 1)
    ctx.setRes(null)
    setValue('')
    setHint('')
  }
  const allDone = ctx.last && locked
  return (
    <div className="space-y-4">
      {/* jalur petualangan */}
      <div className="panel-dark">
        <div className="flex items-center justify-between gap-1">
          {session.rounds.map((g, i) => {
            const isOpen = opened.includes(i)
            const current = i === ctx.idx
            return (
              <div key={i} className="flex flex-1 items-center">
                <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl border-2 sm:h-14 sm:w-14 ${isOpen ? 'animate-pop border-mint bg-mint text-navy' : current ? 'border-sun bg-sun/20 text-sun' : 'border-white/20 text-white/40'}`} title={g.gate}>
                  {i === session.rounds.length - 1 ? <Castle size={22} /> : isOpen ? <DoorOpen size={22} /> : <Lock size={18} />}
                </div>
                {i < session.rounds.length - 1 && <div className={`mx-1 h-1 flex-1 rounded ${isOpen ? 'bg-mint' : 'bg-white/15'}`} />}
              </div>
            )
          })}
        </div>
        <p className="mt-3 text-center font-display text-lg text-sun">{r.gate}</p>
      </div>

      <div className="panel space-y-4">
        <p className="rounded-xl bg-sky/15 p-4 text-slate-700">{r.story}</p>
        <p className="text-xl font-bold text-navy">{r.question}</p>
        <div className="flex items-center gap-2">
          <input className="input max-w-[12rem] text-2xl" inputMode="numeric" value={value} disabled={locked} onChange={(e) => setValue(e.target.value.replace(/[^0-9]/g, ''))} onKeyDown={(e) => e.key === 'Enter' && send()} placeholder="jawaban" aria-label="Jawaban" />
          {r.unit && <span className="font-bold text-slate-500">{r.unit}</span>}
        </div>
        {hint && !ctx.res && (
          <p className="flex gap-2 rounded-xl bg-amber-50 p-3 text-amber-800">
            <Lightbulb className="shrink-0" size={18} /> {hint}
          </p>
        )}
        {ctx.error && <ErrorBox message={ctx.error} />}
        <RoundFeedback res={ctx.res} onNext={next} nextLabel={ctx.last ? 'Lihat hasil petualangan' : 'Menuju gerbang berikutnya'} />
        {allDone && ctx.res?.correct && (
          <p className="animate-pop text-center font-display text-2xl font-bold text-royal">🏰 Kastel Persegi terbuka!</p>
        )}
        {!locked && (
          <div className="flex flex-wrap gap-3">
            <button type="button" className="btn-primary" onClick={send} disabled={ctx.busy || value === ''}>
              Buka gerbang
            </button>
            {!hint && !ctx.res && (
              <button type="button" className="btn-light" onClick={askHint}>
                <Lightbulb size={18} /> Minta petunjuk (−25%)
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
