import { Link } from 'react-router-dom'
import { Check, Lock, Map, RotateCcw } from 'lucide-react'
import { useProgress } from '../context/ProgressContext'
import MapPath from '../components/MapPath'
import { ErrorBox, PageTitle, Spinner } from '../components/ui'
import { REGIONS } from '../lib/levels'

export default function AdventureMap() {
  const { lessons, progress, isUnlocked, loading, error, refresh } = useProgress()
  if (loading) return <Spinner light />
  if (error) return <ErrorBox message={error} onRetry={refresh} />

  return (
    <div>
      <PageTitle eyebrow="Adventure Map" title="Peta Dunia Pola Persegi" icon={Map}>
        Selesaikan setiap wilayah untuk membuka wilayah berikutnya. Wilayah yang sudah terbuka bisa kamu ulangi kapan saja.
      </PageTitle>
      <MapPath />
      <ol className="mt-6 space-y-3">
        {lessons.map((l) => {
          const p = progress[l.slug]
          const done = p?.status === 'completed'
          const open = isUnlocked(l)
          return (
            <li key={l.id} className={`flex flex-wrap items-center gap-4 rounded-2xl p-4 ${open ? 'bg-snow text-ink' : 'bg-white/5 text-white/60'}`}>
              <span className="grid h-12 w-12 place-items-center rounded-xl font-display text-xl font-bold text-navy" style={{ background: open ? REGIONS[l.slug].color : '#475569' }}>
                0{l.level}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold uppercase tracking-wider opacity-70">
                  Level 0{l.level} · {REGIONS[l.slug].region}
                </p>
                <p className="font-display text-xl font-semibold">{l.title}</p>
                <p className="text-sm opacity-80">{l.topic}</p>
              </div>
              {done && <span className="chip bg-mint/30 text-emerald-800"><Check size={14} /> Selesai · nilai latihan {p.check_score}</span>}
              {open ? (
                <Link to={`/app/materi/${l.slug}`} className={done ? 'btn-light btn-sm' : 'btn-primary btn-sm'}>
                  {done ? <><RotateCcw size={16} /> Ulangi</> : p ? 'Lanjutkan' : 'Mulai'}
                </Link>
              ) : (
                <span className="chip bg-white/10"><Lock size={14} /> Selesaikan Level 0{l.level - 1}</span>
              )}
            </li>
          )
        })}
      </ol>
    </div>
  )
}
