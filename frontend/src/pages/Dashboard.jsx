import { Link } from 'react-router-dom'
import { Award, BookOpen, Gamepad2, PenLine, Play, Star, Trophy, Zap } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useProgress } from '../context/ProgressContext'
import Kubi from '../components/Kubi'
import MapPath from '../components/MapPath'
import BadgeIcon from '../components/BadgeIcon'
import { ErrorBox, formatDate, ProgressBar, Spinner } from '../components/ui'
import { ACTIVITY_LABEL, levelInfo } from '../lib/levels'

function greeting() {
  const h = new Date().getHours()
  if (h < 11) return 'Selamat pagi'
  if (h < 15) return 'Selamat siang'
  if (h < 18) return 'Selamat sore'
  return 'Selamat malam'
}

function useNextMission() {
  const { lessons, progress, isUnlocked, bestQuiz } = useProgress()
  const next = lessons.find((l) => progress[l.slug]?.status !== 'completed' && isUnlocked(l))
  if (next) {
    const started = progress[next.slug]
    return {
      to: `/app/materi/${next.slug}`,
      title: `Level 0${next.level} — ${next.title}`,
      text: started ? 'Kamu sudah memulai level ini. Yuk, lanjutkan!' : `Misi berikutnya: ${next.topic.toLowerCase()}.`,
    }
  }
  if (bestQuiz('training-expert') == null || bestQuiz('training-expert') < 70) {
    return { to: '/app/latihan', title: 'Training Zone — Expert', text: 'Semua level selesai! Asah kemampuanmu di latihan tingkat Expert.' }
  }
  if (bestQuiz('final-challenge') == null) {
    return { to: '/app/evaluasi', title: 'Final Challenge', text: 'Kamu siap menaklukkan Kastel Persegi. Ikuti evaluasi akhir!' }
  }
  return { to: '/app/playground', title: 'Square Playground', text: 'Petualangan utama selesai. Raih bintang 3 di semua permainan!' }
}

export default function Dashboard() {
  const { profile } = useAuth()
  const { stats, lessons, activities, achievements, earned, loading, error, refresh } = useProgress()
  const next = useNextMission()

  if (loading) return <Spinner light label="Memuat data petualanganmu..." />
  if (error) return <ErrorBox message={error} onRetry={refresh} />

  const info = levelInfo(stats.total_xp)
  const earnedList = achievements.filter((a) => earned[a.id])
  const recent = activities.filter((a) => a.activity_type !== 'login').slice(0, 5)
  const lastLesson = activities.find((a) => a.activity_type === 'lesson')

  const actions = [
    { to: next.to, label: 'Lanjutkan Belajar', icon: Play, cls: 'btn-sun' },
    { to: '/app/peta', label: 'Jelajahi Materi', icon: BookOpen, cls: 'btn-ghost' },
    { to: '/app/playground', label: 'Mulai Permainan', icon: Gamepad2, cls: 'btn-ghost' },
    { to: '/app/latihan', label: 'Kerjakan Latihan', icon: PenLine, cls: 'btn-ghost' },
    { to: '/app/evaluasi', label: 'Ikuti Evaluasi', icon: Trophy, cls: 'btn-ghost' },
    { to: '/app/pencapaian', label: 'Lihat Pencapaian', icon: Award, cls: 'btn-ghost' },
  ]

  return (
    <div className="space-y-8 text-white">
      {/* Sapaan + level */}
      <section className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div>
          <p className="label-eyebrow text-sun">{greeting()}</p>
          <h1 className="mt-1 text-3xl font-bold sm:text-4xl">Halo, {profile.full_name.split(' ')[0]}!</h1>
          {profile.guest ? (
            <p className="mt-1 text-white/70">
              <span className="chip bg-sun/20 text-sun">Mode Tamu</span> Progres tersimpan di perangkat ini.
            </p>
          ) : (
            <p className="mt-1 text-white/70">
              Kode siswa <span className="font-bold text-white">{profile.student_code}</span>
              {profile.class_name ? ` · Kelas ${profile.class_name}` : ''}
            </p>
          )}
          <div className="mt-5 rounded-2xl bg-snow p-4 text-ink">
            <Kubi mood="happy" size={60}>
              <p className="text-royal">Rekomendasi misi:</p>
              <p className="font-display text-lg text-navy">{next.title}</p>
              <p className="font-normal text-slate-600">{next.text}</p>
              <Link to={next.to} className="btn-primary btn-sm mt-2">
                <Play size={16} /> Ayo mulai
              </Link>
            </Kubi>
          </div>
        </div>

        <div className="panel-dark flex flex-col justify-between gap-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-white/60">Level petualang</p>
              <p className="font-display text-2xl font-bold">
                Lv. {info.level} · {info.name}
              </p>
            </div>
            <div className="grid h-14 w-14 place-items-center rounded-xl bg-sun font-display text-2xl font-bold text-navy">{info.level}</div>
          </div>
          <div>
            <ProgressBar value={info.progress} color="bg-sun" label="Progres menuju level berikutnya" />
            <p className="mt-1 text-xs text-white/60">
              {info.next ? `${stats.total_xp} / ${info.next} XP menuju level berikutnya` : 'Level tertinggi tercapai!'}
            </p>
          </div>
          <dl className="grid grid-cols-2 gap-3 text-center sm:grid-cols-4 lg:grid-cols-2">
            {[
              { k: 'Total XP', v: stats.total_xp, icon: Zap },
              { k: 'Misi selesai', v: `${stats.lessons_completed}/4`, icon: BookOpen },
              { k: 'Bintang', v: stats.stars, icon: Star },
              { k: 'Lencana', v: earnedList.length, icon: Award },
            ].map((s) => (
              <div key={s.k} className="rounded-xl bg-white/5 p-3">
                <s.icon className="mx-auto text-sky" size={18} />
                <dd className="font-display text-xl font-bold">{s.v}</dd>
                <dt className="text-xs text-white/60">{s.k}</dt>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* Progres belajar per level */}
      <section>
        <div className="mb-3 flex items-end justify-between">
          <h2 className="text-2xl font-bold">Peta petualanganmu</h2>
          <Link to="/app/peta" className="text-sm font-bold text-sky hover:underline">
            Buka peta lengkap
          </Link>
        </div>
        <MapPath compact />
        <div className="mt-3">
          <ProgressBar value={(stats.lessons_completed / Math.max(1, lessons.length)) * 100} label="Progres pembelajaran" />
          <p className="mt-1 text-sm text-white/60">Progres pembelajaran: {stats.lessons_completed} dari {lessons.length} level selesai</p>
        </div>
      </section>

      {/* Tombol aksi */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {actions.map((a) => (
          <Link key={a.label} to={a.to} className={`${a.cls} justify-start`}>
            <a.icon size={20} /> {a.label}
          </Link>
        ))}
      </section>

      {/* Aktivitas & pencapaian */}
      <section className="grid gap-6 lg:grid-cols-2">
        <div>
          <h2 className="mb-3 text-xl font-bold">Aktivitas terakhir</h2>
          {lastLesson && (
            <p className="mb-2 text-sm text-white/60">
              Materi terakhir: <span className="font-bold text-white">{lastLesson.title}</span> ({formatDate(lastLesson.created_at)})
            </p>
          )}
          {recent.length === 0 ? (
            <p className="rounded-xl bg-white/5 p-4 text-white/70">Belum ada aktivitas. Mulailah dari Level 01!</p>
          ) : (
            <ul className="divide-y divide-white/10 rounded-xl bg-white/5">
              {recent.map((a) => (
                <li key={a.id} className="flex items-center justify-between gap-3 p-3">
                  <div className="min-w-0">
                    <p className="truncate font-bold">{a.title}</p>
                    <p className="text-xs text-white/60">
                      {ACTIVITY_LABEL[a.activity_type]} · {formatDate(a.created_at)}
                    </p>
                  </div>
                  {a.detail?.score_pct != null && <span className="chip bg-mint/20 text-mint">{Number(a.detail.score_pct)}</span>}
                </li>
              ))}
            </ul>
          )}
        </div>
        <div>
          <h2 className="mb-3 text-xl font-bold">Pencapaian</h2>
          <div className="flex flex-wrap gap-3">
            {achievements.map((a) => (
              <div
                key={a.id}
                title={`${a.title}: ${a.description}`}
                className={`grid h-14 w-14 place-items-center rounded-xl border-2 ${earned[a.id] ? 'border-sun bg-sun/20 text-sun' : 'border-white/10 text-white/25'}`}
              >
                <BadgeIcon name={a.icon} />
              </div>
            ))}
          </div>
          <p className="mt-2 text-sm text-white/60">
            {earnedList.length} dari {achievements.length} lencana diperoleh.{' '}
            <Link to="/app/pencapaian" className="font-bold text-sky hover:underline">
              Lihat semua
            </Link>
          </p>
        </div>
      </section>
    </div>
  )
}
