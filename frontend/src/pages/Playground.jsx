import { Link } from 'react-router-dom'
import { Castle, Grid3x3, Hash, Gamepad2, Search, Timer } from 'lucide-react'
import { useProgress } from '../context/ProgressContext'
import { GAME_META, GAME_ORDER } from '../content/games'
import { PageTitle, Stars } from '../components/ui'

const ICON = { 'square-hunter': Search, 'complete-pattern': Hash, 'next-number': Timer, 'formula-challenge': Grid3x3, 'adventure-quest': Castle }
const COLOR = { 'square-hunter': 'bg-mint', 'complete-pattern': 'bg-sky', 'next-number': 'bg-sun', 'formula-challenge': 'bg-lilac', 'adventure-quest': 'bg-royal text-white' }

export default function Playground() {
  const { bestGame } = useProgress()
  const [feature, ...rest] = GAME_ORDER.slice().reverse()
  const FIcon = ICON[feature]
  return (
    <div>
      <PageTitle eyebrow="Square Playground" title="Taman Bermain Persegi" icon={Gamepad2}>
        Lima permainan dengan cara main yang berbeda. Raih bintang tiga di semuanya!
      </PageTitle>

      {/* Permainan utama ditonjolkan */}
      <Link to={`/app/playground/${feature}`} className="mb-5 flex flex-col gap-4 rounded-3xl bg-gradient-to-r from-royal to-lilac p-6 text-white shadow-soft transition hover:-translate-y-0.5 sm:flex-row sm:items-center">
        <div className="grid h-20 w-20 shrink-0 place-items-center rounded-2xl bg-white/20">
          <FIcon size={40} />
        </div>
        <div className="flex-1">
          <p className="label-eyebrow text-sun">Petualangan utama</p>
          <p className="font-display text-3xl font-bold">{GAME_META[feature].title}</p>
          <p className="text-white/85">{GAME_META[feature].intro}</p>
        </div>
        <Stars count={bestGame(feature)?.stars || 0} size={24} />
      </Link>

      <div className="grid gap-4 sm:grid-cols-2">
        {rest.reverse().map((slug) => {
          const Icon = ICON[slug]
          const best = bestGame(slug)
          return (
            <Link key={slug} to={`/app/playground/${slug}`} className="group flex items-center gap-4 rounded-2xl bg-snow p-4 transition hover:-translate-y-0.5">
              <div className={`grid h-16 w-16 shrink-0 place-items-center rounded-2xl text-navy ${COLOR[slug]}`}>
                <Icon size={30} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-display text-xl font-semibold text-navy group-hover:text-royal">{GAME_META[slug].title}</p>
                <p className="text-sm text-slate-600">{GAME_META[slug].tagline}</p>
                <div className="mt-1 flex items-center gap-2">
                  <Stars count={best?.stars || 0} size={16} />
                  {best && <span className="text-xs font-bold text-slate-500">Terbaik {best.pct}</span>}
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
