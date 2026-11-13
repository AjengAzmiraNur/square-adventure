import SquareGrid, { GridSeries } from '../SquareGrid'

export const SKILL_LABEL = {
  identifikasi: 'Mengidentifikasi informasi',
  hubungan: 'Hubungan persegi & bilangan',
  strategi: 'Menentukan strategi',
  konsep: 'Menggunakan konsep & rumus',
  tafsir: 'Menafsirkan hasil',
  alasan: 'Menjelaskan alasan',
}

export function emptyValue(q) {
  if (q.type === 'sequence') return Array(q.blanks || 1).fill('')
  if (q.type === 'number') return ''
  return null
}

export function isAnswered(q, v) {
  if (q.type === 'sequence') return Array.isArray(v) && v.every((x) => String(x).trim() !== '')
  if (q.type === 'number') return String(v ?? '').trim() !== ''
  return v !== null && v !== undefined
}

export function toPayload(q, v) {
  if (q.type === 'sequence') return v.map((x) => String(x).trim())
  if (q.type === 'number') return String(v).trim()
  return v
}

function Visual({ visual }) {
  if (!visual) return null
  if (visual.kind === 'grid')
    return (
      <div className="flex justify-center rounded-xl bg-white p-4">
        <SquareGrid rows={visual.rows} cols={visual.cols} cell={24} maxSize={260} animate />
      </div>
    )
  if (visual.kind === 'grid_series')
    return (
      <div className="rounded-xl bg-white p-4">
        <GridSeries ns={visual.ns} cell={14} />
      </div>
    )
  return null
}

const optionBase = 'w-full rounded-xl border-2 px-4 py-3 text-left font-bold transition disabled:cursor-default'
const optionState = (selected, state) => {
  if (state === 'correct') return 'border-emerald-500 bg-emerald-50 text-emerald-900'
  if (state === 'wrong') return 'border-red-400 bg-red-50 text-red-800'
  return selected ? 'border-royal bg-blue-50 text-royal' : 'border-slate-200 bg-white hover:border-sky'
}

/**
 * Menampilkan soal dan input sesuai jenisnya.
 * reveal: { correct: value } untuk menandai jawaban benar setelah dinilai.
 */
export default function QuestionView({ q, value, onChange, disabled = false, reveal = null, onEnter }) {
  const key = (e) => {
    if (e.key === 'Enter' && onEnter) {
      e.preventDefault()
      onEnter()
    }
  }
  return (
    <div className="space-y-4">
      <p className="text-lg font-bold leading-snug text-navy sm:text-xl">{q.prompt}</p>
      <Visual visual={q.visual} />

      {q.type === 'mcq' && (
        <div className="grid gap-2" role="radiogroup">
          {q.options.map((opt, i) => {
            const state = reveal ? (i === reveal.correct ? 'correct' : i === value ? 'wrong' : null) : null
            return (
              <button key={i} type="button" role="radio" aria-checked={value === i} disabled={disabled} onClick={() => onChange(i)} className={`${optionBase} ${optionState(value === i, state)}`}>
                <span className="mr-2 inline-grid h-7 w-7 place-items-center rounded-lg bg-slate-100 text-sm text-slate-600">{String.fromCharCode(65 + i)}</span>
                {opt}
              </button>
            )
          })}
        </div>
      )}

      {q.type === 'grid_choice' && (
        <div className="grid grid-cols-2 gap-3" role="radiogroup">
          {q.options.map((o, i) => {
            const state = reveal ? (i === reveal.correct ? 'correct' : i === value ? 'wrong' : null) : null
            return (
              <button key={i} type="button" role="radio" aria-checked={value === i} disabled={disabled} onClick={() => onChange(i)} className={`${optionBase} flex flex-col items-center gap-2 ${optionState(value === i, state)}`}>
                <SquareGrid rows={o.rows} cols={o.cols} cell={16} gap={3} maxSize={130} />
                <span className="text-sm">
                  {String.fromCharCode(65 + i)}. {o.rows} baris × {o.cols} kolom
                </span>
              </button>
            )
          })}
        </div>
      )}

      {q.type === 'tf' && (
        <div className="grid grid-cols-2 gap-3" role="radiogroup">
          {[true, false].map((v) => {
            const state = reveal ? (v === reveal.correct ? 'correct' : v === value ? 'wrong' : null) : null
            return (
              <button key={String(v)} type="button" role="radio" aria-checked={value === v} disabled={disabled} onClick={() => onChange(v)} className={`${optionBase} text-center text-lg ${optionState(value === v, state)}`}>
                {v ? 'Benar' : 'Salah'}
              </button>
            )
          })}
        </div>
      )}

      {q.type === 'number' && (
        <label className="block">
          <span className="mb-1 block text-sm font-bold text-slate-600">Jawabanmu (bilangan bulat)</span>
          <input
            className="input max-w-xs text-2xl"
            inputMode="numeric"
            value={value ?? ''}
            onChange={(e) => onChange(e.target.value.replace(/[^0-9-]/g, ''))}
            onKeyDown={key}
            disabled={disabled}
            placeholder="ketik angka"
            aria-label="Jawaban angka"
          />
        </label>
      )}

      {q.type === 'sequence' && (
        <SequenceInput items={q.visual?.items || []} value={value || []} onChange={onChange} disabled={disabled} onEnter={onEnter} reveal={reveal} />
      )}
    </div>
  )
}

export function SequenceInput({ items, value, onChange, disabled, onEnter, reveal }) {
  let blank = -1
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl bg-white p-4">
      {items.map((v, i) => {
        if (v !== null) {
          return (
            <span key={i} className="grid h-14 min-w-14 place-items-center rounded-xl bg-sky/20 px-3 font-display text-2xl font-bold text-navy">
              {v}
            </span>
          )
        }
        blank += 1
        const b = blank
        const ok = reveal ? Number(value[b]) === reveal.correct?.[b] : null
        return (
          <input
            key={i}
            className={`h-14 w-20 rounded-xl border-2 border-dashed text-center font-display text-2xl font-bold focus:border-royal focus:outline-none ${
              ok === true ? 'border-emerald-500 bg-emerald-50' : ok === false ? 'border-red-400 bg-red-50' : 'border-royal/60 bg-blue-50'
            }`}
            inputMode="numeric"
            value={value[b] ?? ''}
            disabled={disabled}
            onChange={(e) => {
              const next = [...value]
              next[b] = e.target.value.replace(/[^0-9]/g, '')
              onChange(next)
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && onEnter) {
                e.preventDefault()
                onEnter()
              }
            }}
            aria-label={`Kotak kosong ke-${b + 1}`}
          />
        )
      })}
      <span className="font-display text-2xl text-slate-400">...</span>
    </div>
  )
}

export function Explanation({ steps, title = 'Pembahasan langkah demi langkah' }) {
  if (!steps?.length) return null
  return (
    <div className="rounded-xl bg-white p-4">
      <p className="mb-2 font-bold text-navy">{title}</p>
      <ol className="space-y-1.5">
        {steps.map((s, i) => (
          <li key={i} className="flex gap-2 text-slate-700">
            <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-md bg-royal text-xs font-bold text-white">{i + 1}</span>
            <span>{s}</span>
          </li>
        ))}
      </ol>
    </div>
  )
}
