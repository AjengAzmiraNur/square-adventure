import { Link } from 'react-router-dom'
import { Castle, Check, Lock } from 'lucide-react'
import { REGIONS } from '../lib/levels'
import { useProgress } from '../context/ProgressContext'

// Posisi simpul pada kanvas 100 × 100 (persen) — jalur berliku.
const POS = [
  { x: 14, y: 78 },
  { x: 40, y: 56 },
  { x: 66, y: 74 },
  { x: 82, y: 40 },
]
const FINAL = { x: 52, y: 14 }

/** Peta petualangan: 4 wilayah materi + Kastel Persegi (Final Challenge). */
export default function MapPath({ compact = false }) {
  const { lessons, progress, isUnlocked, completedLevels, isTeacher } = useProgress()
  const finalOpen = isTeacher || completedLevels.size >= 4
  const points = [...POS, FINAL].map((p) => `${p.x},${p.y}`).join(' ')

  return (
    <div className={`relative w-full overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-navy-700/40 to-navy-900/60 ${compact ? 'h-64' : 'h-[460px] sm:h-[520px]'}`}>
      {/* dekorasi kotak-kotak */}
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        <polyline points={points} fill="none" stroke="#ffffff22" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
        <polyline points={points} fill="none" stroke="#FACC15" strokeWidth="2" strokeDasharray="2 3" strokeLinecap="round" vectorEffect="non-scaling-stroke" opacity="0.7" />
      </svg>
      {lessons.map((lesson, i) => {
        const p = POS[i]
        if (!p) return null
        const done = progress[lesson.slug]?.status === 'completed'
        const open = isUnlocked(lesson)
        const region = REGIONS[lesson.slug]
        const node = (
          <>
            <span
              className={`grid place-items-center rounded-xl border-4 font-display font-bold shadow-block transition ${compact ? 'h-12 w-12 text-lg' : 'h-16 w-16 text-2xl'} ${
                done ? 'border-white bg-mint text-navy' : open ? 'border-white bg-royal text-white group-hover:scale-110' : 'border-white/30 bg-slate-600 text-white/60'
              }`}
              style={open && !done ? { boxShadow: `0 0 0 6px ${region.color}55` } : undefined}
            >
              {done ? <Check size={compact ? 22 : 28} /> : open ? `0${lesson.level}` : <Lock size={compact ? 18 : 22} />}
            </span>
            <span className={`mt-1 whitespace-nowrap rounded-lg bg-navy-900/80 px-2 py-0.5 text-center font-bold text-white ${compact ? 'text-[11px]' : 'text-xs sm:text-sm'}`}>
              {region.region}
            </span>
            {!compact && <span className="hidden text-center text-xs text-white/70 sm:block">{lesson.title}</span>}
          </>
        )
        const style = { left: `${p.x}%`, top: `${p.y}%` }
        return open ? (
          <Link key={lesson.id} to={`/app/materi/${lesson.slug}`} className="group absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center" style={style} aria-label={`Level ${lesson.level}: ${lesson.title}${done ? ' (selesai)' : ''}`}>
            {node}
          </Link>
        ) : (
          <div key={lesson.id} className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center" style={style} aria-label={`Level ${lesson.level} terkunci`}>
            {node}
          </div>
        )
      })}
      <Link
        to="/app/evaluasi"
        className="group absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center"
        style={{ left: `${FINAL.x}%`, top: `${FINAL.y}%` }}
        aria-label="Kastel Persegi: Final Challenge"
      >
        <span className={`grid place-items-center rounded-2xl border-4 shadow-block ${compact ? 'h-12 w-12' : 'h-16 w-16'} ${finalOpen ? 'border-white bg-sun text-navy group-hover:scale-110' : 'border-white/30 bg-slate-600 text-white/60'}`}>
          {finalOpen ? <Castle size={compact ? 22 : 30} /> : <Lock size={20} />}
        </span>
        <span className={`mt-1 rounded-lg bg-navy-900/80 px-2 py-0.5 font-bold text-white ${compact ? 'text-[11px]' : 'text-xs sm:text-sm'}`}>Kastel Persegi</span>
      </Link>
    </div>
  )
}
