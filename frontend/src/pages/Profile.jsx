import { useNavigate } from 'react-router-dom'
import { LogOut, User } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useProgress } from '../context/ProgressContext'
import { KubiFace } from '../components/Kubi'
import BadgeIcon from '../components/BadgeIcon'
import { PageTitle, Spinner } from '../components/ui'
import { levelInfo } from '../lib/levels'

export default function Profile() {
  const { profile, logout } = useAuth()
  const { stats, achievements, earned, bestQuiz, gameAttempts, loading } = useProgress()
  const navigate = useNavigate()
  if (loading) return <Spinner light />
  const info = levelInfo(stats.total_xp)
  const badges = achievements.filter((a) => earned[a.id])
  const fmt = (v) => (v == null ? 'Belum ada' : v)

  const rows = [
    ['Nama siswa', profile.full_name],
    ['Kode siswa', profile.student_code],
    ['Kelas', profile.class_name || '-'],
    ['Total XP', stats.total_xp],
    ['Level', `${info.level} — ${info.name}`],
    ['Misi selesai', `${stats.lessons_completed} dari 4`],
    ['Jumlah permainan dimainkan', gameAttempts.length],
    ['Nilai latihan terbaik', `Beginner: ${fmt(bestQuiz('training-beginner'))} · Intermediate: ${fmt(bestQuiz('training-intermediate'))} · Expert: ${fmt(bestQuiz('training-expert'))}`],
    ['Nilai evaluasi terbaik', fmt(bestQuiz('final-challenge'))],
  ]

  const doLogout = async () => {
    await logout()
    navigate('/masuk', { replace: true })
  }

  return (
    <div className="mx-auto max-w-3xl">
      <PageTitle eyebrow="Profil" title="Profil Petualang" icon={User} />
      <section className="panel">
        <div className="mb-5 flex items-center gap-4">
          <KubiFace mood="cheer" size={72} />
          <div>
            <p className="font-display text-2xl font-bold text-navy">{profile.full_name}</p>
            <p className="text-slate-600">
              {profile.role === 'teacher' ? 'Guru' : 'Siswa'} · {profile.student_code}
            </p>
          </div>
        </div>
        <dl className="divide-y divide-slate-200">
          {rows.map(([k, v]) => (
            <div key={k} className="grid gap-1 py-3 sm:grid-cols-[14rem_1fr]">
              <dt className="font-bold text-slate-500">{k}</dt>
              <dd className="font-semibold text-navy">{v}</dd>
            </div>
          ))}
          <div className="grid gap-1 py-3 sm:grid-cols-[14rem_1fr]">
            <dt className="font-bold text-slate-500">Lencana diperoleh</dt>
            <dd className="flex flex-wrap gap-2">
              {badges.length === 0 && <span className="text-slate-500">Belum ada lencana.</span>}
              {badges.map((a) => (
                <span key={a.id} className="chip bg-sun/25 text-navy">
                  <BadgeIcon name={a.icon} size={14} /> {a.title}
                </span>
              ))}
            </dd>
          </div>
        </dl>
        <button type="button" className="btn mt-4 border-2 border-red-200 bg-red-50 text-red-700 hover:bg-red-100" onClick={doLogout}>
          <LogOut size={18} /> Keluar dari akun
        </button>
      </section>
    </div>
  )
}
