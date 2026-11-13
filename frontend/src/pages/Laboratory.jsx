import { lazy, Suspense, useState } from 'react'
import { Box, Calculator, FlaskConical, Grid3x3, Minus, Plus, SlidersHorizontal, Table2 } from 'lucide-react'
import SquareGrid from '../components/SquareGrid'
import Kubi from '../components/Kubi'
import { ErrorBox, PageTitle, Spinner } from '../components/ui'
import { formatId, formulaSteps, square, sub, validateTermInput } from '../lib/squares'

const Square3D = lazy(() => import('../components/lab/Square3D'))

const TABS = [
  { key: 'visual', label: 'Visualisasi Pola', icon: Grid3x3 },
  { key: 'builder', label: 'Pattern Builder', icon: SlidersHorizontal },
  { key: 'explorer', label: 'Number Explorer', icon: Table2 },
  { key: 'calc', label: 'Formula Calculator', icon: Calculator },
  { key: '3d', label: 'Menara 3D', icon: Box },
]

function Visualization() {
  const [n, setN] = useState(3)
  return (
    <div className="grid gap-6 md:grid-cols-[1fr_1.1fr]">
      <div>
        <p className="mb-2 font-bold text-slate-600">Pilih nomor suku</p>
        <div className="grid grid-cols-6 gap-2">
          {[1, 2, 3, 4, 5, 6].map((k) => (
            <button key={k} type="button" onClick={() => setN(k)} className={`rounded-xl py-3 font-display text-xl font-bold ${k === n ? 'bg-royal text-white shadow-block' : 'bg-white text-navy hover:bg-sky/20'}`} aria-pressed={k === n}>
              {k}
            </button>
          ))}
        </div>
        <div className="mt-4 flex min-h-[260px] items-center justify-center rounded-xl bg-white p-4">
          <SquareGrid key={n} rows={n} cell={34} maxSize={250} animate />
        </div>
      </div>
      <dl className="grid content-start gap-3 sm:grid-cols-2">
        {[
          ['Nomor suku', `ke-${n}`],
          ['Panjang sisi persegi', `${n} kotak`],
          ['Jumlah kotak', `${square(n)} kotak`],
          ['Bentuk perhitungan', `U${sub(n)} = ${n} × ${n} = ${square(n)}`],
        ].map(([k, v]) => (
          <div key={k} className="rounded-xl bg-white p-4">
            <dt className="text-sm font-bold text-slate-500">{k}</dt>
            <dd className="font-display text-xl font-semibold text-navy">{v}</dd>
          </div>
        ))}
        <div className="rounded-xl bg-sky/15 p-4 sm:col-span-2">
          <p className="font-bold text-navy">Hubungan nomor suku dan jumlah kotak</p>
          <p className="text-slate-700">
            Suku ke-{n} membentuk persegi dengan sisi {n}. Karena ada {n} baris dan setiap baris berisi {n} kotak, jumlah kotaknya {n} × {n} = {square(n)}.
          </p>
        </div>
      </dl>
    </div>
  )
}

function Builder() {
  const [n, setN] = useState(5)
  return (
    <div className="grid gap-6 md:grid-cols-[1.1fr_1fr]">
      <div className="flex min-h-[300px] items-center justify-center rounded-xl bg-white p-4">
        <SquareGrid rows={n} cell={30} maxSize={300} highlightFrom={n > 1 ? n - 1 : null} />
      </div>
      <div className="space-y-4">
        <label className="block">
          <span className="font-bold text-slate-600">Ukuran sisi: {n}</span>
          <input type="range" min={1} max={15} value={n} onChange={(e) => setN(Number(e.target.value))} className="mt-2 w-full accent-royal" aria-label="Ukuran sisi persegi" />
        </label>
        <div className="flex gap-2">
          <button type="button" className="btn-light btn-sm" onClick={() => setN(Math.max(1, n - 1))} disabled={n <= 1}>
            <Minus size={16} /> Kecilkan
          </button>
          <button type="button" className="btn-light btn-sm" onClick={() => setN(Math.min(15, n + 1))} disabled={n >= 15}>
            <Plus size={16} /> Besarkan
          </button>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center">
          {[
            ['Baris', n],
            ['Kolom', n],
            ['Total kotak', square(n)],
          ].map(([k, v]) => (
            <div key={k} className="rounded-xl bg-white p-3">
              <p className="text-xs font-bold text-slate-500">{k}</p>
              <p className="font-display text-2xl font-bold text-navy">{v}</p>
            </div>
          ))}
        </div>
        <div className="rounded-xl bg-lilac/20 p-4 font-display text-lg font-semibold text-navy">
          <p>Uₙ = n × n = n²</p>
          <p>
            U{sub(n)} = {n} × {n} = {n}² = {square(n)}
          </p>
        </div>
        {n > 1 && (
          <p className="text-sm text-slate-600">
            Kotak kuning = tambahan dari persegi {n - 1} × {n - 1}: {square(n)} − {square(n - 1)} = {2 * n - 1} kotak.
          </p>
        )}
      </div>
    </div>
  )
}

function Explorer() {
  const [sel, setSel] = useState(4)
  const rows = Array.from({ length: 12 }, (_, i) => i + 1)
  return (
    <div className="grid gap-6 md:grid-cols-[1.2fr_1fr]">
      <div className="overflow-hidden rounded-xl">
        <table className="w-full text-center">
          <thead className="bg-navy text-white">
            <tr>
              <th className="p-2">Nomor Suku</th>
              <th className="p-2">Bentuk Perkalian</th>
              <th className="p-2">Bilangan Persegi</th>
            </tr>
          </thead>
          <tbody className="bg-white font-semibold">
            {rows.map((k) => (
              <tr key={k} onClick={() => setSel(k)} className={`cursor-pointer border-t border-slate-100 ${k === sel ? 'bg-sun/30' : 'hover:bg-sky/10'}`}>
                <td className="p-2">
                  <button type="button" className="w-full" onClick={() => setSel(k)} aria-pressed={k === sel}>
                    {k}
                  </button>
                </td>
                <td className="p-2">
                  {k} × {k}
                </td>
                <td className="p-2">{square(k)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="space-y-3">
        <div className="flex justify-center rounded-xl bg-white p-4">
          <SquareGrid rows={sel} cell={20} maxSize={220} />
        </div>
        <p className="rounded-xl bg-white p-4 text-slate-700">
          Suku ke-<b>{sel}</b> → {sel} × {sel} = <b>{square(sel)}</b>.
          {sel > 1 && (
            <>
              {' '}
              Dibanding suku sebelumnya ({square(sel - 1)}), bertambah <b>{2 * sel - 1}</b>.
            </>
          )}
        </p>
        <Kubi mood="think" size={52}>
          Perhatikan kolom pertama dan kolom ketiga. Bilangan persegi = nomor suku dikali dirinya sendiri!
        </Kubi>
      </div>
    </div>
  )
}

function FormulaCalculator() {
  const [raw, setRaw] = useState('')
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const calc = (e) => {
    e.preventDefault()
    const v = validateTermInput(raw)
    if (!v.ok) {
      setError(v.error)
      setResult(null)
      return
    }
    setError('')
    setResult(v.value)
  }
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <form onSubmit={calc} className="space-y-3" noValidate>
        <label className="block">
          <span className="mb-1 block font-bold text-slate-600">Nomor suku (n)</span>
          <input className="input text-2xl" value={raw} onChange={(e) => setRaw(e.target.value)} placeholder="contoh: 8" inputMode="numeric" aria-invalid={Boolean(error)} />
        </label>
        <button className="btn-primary" type="submit">
          <Calculator size={18} /> Hitung
        </button>
        {error && <ErrorBox message={error} />}
        <p className="text-sm text-slate-500">Rumus yang digunakan: Uₙ = n². Masukkan bilangan bulat 1 – 1.000.</p>
      </form>
      {result != null ? (
        <div className="animate-rise space-y-3 rounded-xl bg-white p-4">
          <p className="text-sm font-bold text-slate-500">Hasil</p>
          <p className="font-display text-4xl font-bold text-royal">{formatId(square(result))}</p>
          <p className="font-display text-lg font-semibold text-navy">
            U{sub(result)} = {result}² = {formatId(square(result))}
          </p>
          <ol className="list-decimal space-y-1 pl-5 text-slate-700">
            {formulaSteps(result).map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ol>
          <p className="rounded-lg bg-mint/30 p-3 text-slate-700">
            Artinya, suku ke-{result} pola bilangan persegi adalah {formatId(square(result))}: persegi dengan {result} kotak di setiap sisi berisi {formatId(square(result))} kotak.
          </p>
        </div>
      ) : (
        <div className="grid place-items-center rounded-xl border-2 border-dashed border-slate-300 p-6 text-center text-slate-500">Hasil dan langkah perhitungan akan muncul di sini.</div>
      )}
    </div>
  )
}

function Tower3D() {
  const [n, setN] = useState(4)
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <span className="font-bold text-slate-600">Tampilkan persegi 1 sampai</span>
        {[3, 4, 5, 6].map((k) => (
          <button key={k} type="button" onClick={() => setN(k)} className={`btn-sm btn ${k === n ? 'bg-royal text-white' : 'border-2 border-slate-200 bg-white'}`} aria-pressed={k === n}>
            {k}
          </button>
        ))}
      </div>
      <Suspense fallback={<Spinner label="Memuat 3D..." />}>
        <Square3D n={n} />
      </Suspense>
      <p className="text-sm text-slate-600">
        Seret untuk memutar. Kubus berjajar: {Array.from({ length: n }, (_, i) => square(i + 1)).join(', ')} — pola bilangan persegi.
      </p>
    </div>
  )
}

const PANELS = { visual: Visualization, builder: Builder, explorer: Explorer, calc: FormulaCalculator, '3d': Tower3D }

export default function Laboratory() {
  const [tab, setTab] = useState('visual')
  const Panel = PANELS[tab]
  return (
    <div>
      <PageTitle eyebrow="Square Laboratory" title="Laboratorium Persegi" icon={FlaskConical}>
        Tempat bereksperimen: ubah ukuran, amati tabel, dan hitung dengan rumus.
      </PageTitle>
      <div className="mb-4 flex gap-2 overflow-x-auto pb-1" role="tablist">
        {TABS.map((t) => (
          <button key={t.key} type="button" role="tab" aria-selected={tab === t.key} onClick={() => setTab(t.key)} className={`btn btn-sm shrink-0 ${tab === t.key ? 'bg-sun text-navy' : 'bg-white/10 text-white hover:bg-white/20'}`}>
            <t.icon size={16} /> {t.label}
          </button>
        ))}
      </div>
      <section className="panel">
        <Panel />
      </section>
    </div>
  )
}
