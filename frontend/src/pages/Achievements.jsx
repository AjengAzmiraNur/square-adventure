import { Award, Lock, Star } from 'lucide-react'
import { useProgress } from '../context/ProgressContext'
import BadgeIcon from '../components/BadgeIcon'
import { formatDate, PageTitle, ProgressBar, Spinner } from '../components/ui'
import { ADVENTURER_LEVELS, levelInfo } from '../lib/levels'

export default function Achievements() {
  const { stats, achievements, earned, loading } = useProgress()
  if (loading) return <Spinner light />
  const info = levelInfo(stats.total_xp)
  const count = achievements.filter((a) => earned[a.id]).length

  return (
    <div>
      <PageTitle eyebrow="Pencapaian" title="Koleksi Pencapaian" icon={Award}>
        XP, level, bintang, dan lencana diberikan oleh server berdasarkan aktivitas yang benar-benar kamu selesaikan.
      </PageTitle>

      <section className="panel-dark mb-6 grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2">
          <p className="text-sm text-white/60">Level petualang</p>
          <p className="font-display text-3xl font-bold">
            Lv. {info.level} · {info.name}
          </p>
          <div className="mt-3">
            <ProgressBar value={info.progress} color="bg-sun" label="Progres level" />
          </div>
          <ol className="mt-4 flex flex-wrap gap-2 text-xs">
            {ADVENTURER_LEVELS.map((l, i) => (
              <li key={l.name} className={`rounded-lg px-2 py-1 font-bold ${i + 1 <= info.level ? 'bg-sun text-navy' : 'bg-white/10 text-white/60'}`}>
                {i + 1}. {l.name} ({l.min} XP)
              </li>
            ))}
          </ol>
        </div>
        <dl className="grid grid-cols-3 gap-3 text-center md:grid-cols-1">
          <div>
            <dd className="font-display text-3xl font-bold text-sun">{stats.total_xp}</dd>
            <dt className="text-xs text-white/60">Total XP</dt>
          </div>
          <div>
            <dd className="flex items-center justify-center gap-1 font-display text-3xl font-bold">
              {stats.stars} <Star className="fill-sun text-sun" size={22} />
            </dd>
            <dt className="text-xs text-white/60">Bintang (maks. 27)</dt>
          </div>
          <div>
            <dd className="font-display text-3xl font-bold">
              {count}/{achievements.length}
            </dd>
            <dt className="text-xs text-white/60">Lencana</dt>
          </div>
        </dl>
      </section>

      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {achievements.map((a) => {
          const e = earned[a.id]
          return (
            <li key={a.id} className={`flex items-center gap-4 rounded-2xl p-4 ${e ? 'bg-snow' : 'border-2 border-dashed border-white/15 text-white/70'}`}>
              <div className={`grid h-16 w-16 shrink-0 place-items-center rounded-2xl ${e ? 'bg-sun text-navy shadow-block' : 'bg-white/5 text-white/30'}`}>
                {e ? <BadgeIcon name={a.icon} size={30} /> : <Lock size={24} />}
              </div>
              <div>
                <p className={`font-display text-lg font-semibold ${e ? 'text-navy' : ''}`}>{a.title}</p>
                <p className={`text-sm ${e ? 'text-slate-600' : ''}`}>{a.description}</p>
                {e && <p className="mt-1 text-xs font-bold text-royal">Diperoleh {formatDate(e.earned_at)}</p>}
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
