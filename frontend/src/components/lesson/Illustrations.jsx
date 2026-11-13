import { useState } from 'react'
import { Minus, Plus } from 'lucide-react'
import SquareGrid from '../SquareGrid'
import { differences, square, squareSequence, sub } from '../../lib/squares'

function Stepper({ value, setValue, min = 1, max = 10, label = 'Nomor suku (n)' }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm font-bold text-slate-600">{label}</span>
      <button type="button" className="btn-light btn-sm" onClick={() => setValue(Math.max(min, value - 1))} disabled={value <= min} aria-label="Kurangi">
        <Minus size={16} />
      </button>
      <span className="w-10 text-center font-display text-2xl font-bold text-navy" aria-live="polite">
        {value}
      </span>
      <button type="button" className="btn-light btn-sm" onClick={() => setValue(Math.min(max, value + 1))} disabled={value >= max} aria-label="Tambah">
        <Plus size={16} />
      </button>
    </div>
  )
}

/** Level 1 — mengamati susunan 1×1, 2×2, ... dan menghitung kotaknya baris demi baris. */
function CountSquares() {
  const [n, setN] = useState(3)
  return (
    <div className="grid items-center gap-6 md:grid-cols-2">
      <div className="flex justify-center rounded-xl bg-white p-4">
        <SquareGrid key={n} rows={n} cell={30} maxSize={260} animate />
      </div>
      <div className="space-y-3">
        <Stepper value={n} setValue={setN} max={6} label="Susunan ke-" />
        <p className="text-slate-700">
          Ada <b>{n} baris</b>, dan setiap baris berisi <b>{n} kotak</b>.
        </p>
        <p className="text-slate-700">
          Hitung per baris: {Array.from({ length: n }, () => n).join(' + ')} = <b>{square(n)}</b>
        </p>
        <p className="rounded-xl bg-sky/15 p-3 font-display text-xl font-semibold text-navy">
          {n} × {n} = {square(n)} kotak
        </p>
      </div>
    </div>
  )
}

/** Level 2 — selisih antarsuku dan kotak tambahan berbentuk huruf L. */
function DifferencePattern() {
  const [n, setN] = useState(3)
  const seq = squareSequence(6)
  const diffs = differences(seq)
  return (
    <div className="space-y-5">
      <div className="overflow-x-auto rounded-xl bg-white p-4">
        <div className="flex min-w-max items-start gap-1">
          {seq.map((v, i) => (
            <div key={v} className="flex items-start">
              <div className="flex flex-col items-center">
                <span className="grid h-12 w-12 place-items-center rounded-xl bg-sky/20 font-display text-xl font-bold text-navy">{v}</span>
              </div>
              {i < diffs.length && (
                <span className="mx-1 mt-12 rounded-full bg-sun/30 px-2 py-0.5 text-sm font-bold text-amber-800">+{diffs[i]}</span>
              )}
            </div>
          ))}
        </div>
        <p className="mt-2 text-sm text-slate-600">Selisihnya 3, 5, 7, 9, 11 — bilangan ganjil yang selalu bertambah 2.</p>
      </div>
      <div className="grid items-center gap-6 md:grid-cols-2">
        <div className="flex justify-center rounded-xl bg-white p-4">
          <SquareGrid rows={n} cell={30} maxSize={240} highlightFrom={n - 1} />
        </div>
        <div className="space-y-3">
          <Stepper value={n} setValue={setN} min={2} max={6} label="Susunan ke-" />
          <p className="text-slate-700">
            Dari susunan {n - 1} × {n - 1} ({square(n - 1)} kotak) ke susunan {n} × {n} ({square(n)} kotak), kita menambah{' '}
            <b className="text-amber-700">kotak kuning</b> berbentuk huruf L.
          </p>
          <p className="rounded-xl bg-sun/20 p-3 font-display text-lg font-semibold text-navy">
            Tambahan = {n - 1} + {n - 1} + 1 = {2 * n - 1} kotak
          </p>
          <p className="text-sm text-slate-600">Itulah sebabnya selisihnya selalu ganjil!</p>
        </div>
      </div>
    </div>
  )
}

/** Level 3 — nomor suku = panjang sisi → Uₙ = n × n = n². */
function FormulaDiscovery() {
  const [n, setN] = useState(4)
  return (
    <div className="grid items-start gap-6 md:grid-cols-2">
      <div className="flex flex-col items-center gap-2 rounded-xl bg-white p-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-royal">sisi = {n}</span>
        </div>
        <SquareGrid rows={n} cell={26} maxSize={240} />
        <p className="text-sm text-slate-600">Suku ke-{n} berbentuk persegi dengan sisi {n} kotak.</p>
      </div>
      <div className="space-y-3">
        <Stepper value={n} setValue={setN} max={10} />
        <table className="w-full overflow-hidden rounded-xl text-center">
          <thead className="bg-navy text-white">
            <tr>
              <th className="p-2">Nomor suku (n)</th>
              <th className="p-2">Sisi persegi</th>
              <th className="p-2">Banyak kotak (U{sub('n')})</th>
            </tr>
          </thead>
          <tbody className="bg-white font-bold">
            {[n - 1, n, n + 1]
              .filter((k) => k >= 1)
              .map((k) => (
                <tr key={k} className={k === n ? 'bg-sun/30' : ''}>
                  <td className="p-2">{k}</td>
                  <td className="p-2">{k}</td>
                  <td className="p-2">
                    {k} × {k} = {square(k)}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
        <p className="rounded-xl bg-lilac/20 p-3 font-display text-xl font-semibold text-navy">
          U{sub(n)} = {n} × {n} = {n}² = {square(n)}
        </p>
      </div>
    </div>
  )
}

const SCENES = {
  ubin: { label: 'Ubin lantai', variant: 'tile', unit: 'ubin', text: (n) => `Lantai persegi dengan ${n} ubin di setiap sisi.` },
  kursi: { label: 'Kursi aula', variant: 'chair', unit: 'kursi', text: (n) => `Kursi disusun ${n} baris, setiap baris ${n} kursi.` },
  tanaman: { label: 'Tanaman taman', variant: 'plant', unit: 'tanaman', text: (n) => `Tanaman ditanam membentuk persegi ${n} × ${n}.` },
  lampu: { label: 'Lampu hias', variant: 'lamp', unit: 'lampu', text: (n) => `Lampu hias susunan ke-${n} berbentuk persegi.` },
}

/** Level 4 — pola persegi dalam kehidupan sehari-hari. */
function ContextScenes() {
  const [scene, setScene] = useState('ubin')
  const [n, setN] = useState(5)
  const s = SCENES[scene]
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2" role="tablist">
        {Object.entries(SCENES).map(([key, v]) => (
          <button key={key} type="button" role="tab" aria-selected={scene === key} onClick={() => setScene(key)} className={`btn-sm btn ${scene === key ? 'bg-royal text-white' : 'border-2 border-slate-200 bg-white text-ink'}`}>
            {v.label}
          </button>
        ))}
      </div>
      <div className="grid items-center gap-6 md:grid-cols-2">
        <div className="flex justify-center rounded-xl bg-white p-4">
          <SquareGrid rows={n} cell={28} maxSize={240} variant={s.variant} label={`${n * n} ${s.unit}`} />
        </div>
        <div className="space-y-3">
          <Stepper value={n} setValue={setN} max={9} label="Sisi" />
          <p className="text-slate-700">{s.text(n)}</p>
          <p className="rounded-xl bg-mint/30 p-3 font-display text-lg font-semibold text-navy">
            Banyak {s.unit} = {n} × {n} = {square(n)} {s.unit}
          </p>
        </div>
      </div>
    </div>
  )
}

export const ILLUSTRATIONS = { count: CountSquares, difference: DifferencePattern, formula: FormulaDiscovery, context: ContextScenes }
