import { Suspense, useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { Award, FlaskConical, Gamepad2, Home, LogOut, Map, Menu, PenLine, ScrollText, Trophy, User, Users, X } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { Logo, Spinner } from './ui'

const MAIN_NAV = [
  { to: '/app', label: 'Beranda', icon: Home, end: true },
  { to: '/app/peta', label: 'Peta', icon: Map },
  { to: '/app/lab', label: 'Lab', icon: FlaskConical },
  { to: '/app/latihan', label: 'Latihan', icon: PenLine },
  { to: '/app/playground', label: 'Main', icon: Gamepad2 },
]

const MORE_NAV = [
  { to: '/app/evaluasi', label: 'Final Challenge', icon: Trophy },
  { to: '/app/pencapaian', label: 'Pencapaian', icon: Award },
  { to: '/app/riwayat', label: 'Riwayat Belajar', icon: ScrollText },
  { to: '/app/profil', label: 'Profil', icon: User },
]

export default function AppShell() {
  const { profile, logout } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const more = profile?.role === 'teacher' ? [...MORE_NAV, { to: '/app/guru', label: 'Data Siswa', icon: Users }] : MORE_NAV

  const doLogout = async () => {
    setOpen(false)
    await logout()
    navigate('/masuk', { replace: true })
  }

  const linkClass = ({ isActive }) =>
    `flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold transition ${isActive ? 'bg-white text-navy' : 'text-white/80 hover:bg-white/10 hover:text-white'}`

  return (
    <div className="world-bg min-h-dvh pb-24 lg:pb-10">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-navy/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <NavLink to="/app" aria-label="Beranda SQUARE ADVENTURE">
            <Logo size="sm" />
          </NavLink>
          <nav className="hidden items-center gap-1 lg:flex" aria-label="Navigasi utama">
            {MAIN_NAV.map((n) => (
              <NavLink key={n.to} to={n.to} end={n.end} className={linkClass}>
                <n.icon size={18} /> {n.label}
              </NavLink>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <span className="hidden text-right text-sm leading-tight text-white sm:block">
              <span className="block font-bold">{profile?.full_name}</span>
              <span className="text-white/60">{profile?.guest ? 'Mode Tamu' : profile?.student_code}</span>
            </span>
            <button onClick={() => setOpen((v) => !v)} className="rounded-xl border-2 border-white/20 p-2 text-white hover:bg-white/10" aria-expanded={open} aria-label="Menu lainnya">
              {open ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
        {open && (
          <div className="border-t border-white/10 bg-navy-900">
            <nav className="mx-auto grid max-w-6xl gap-1 px-4 py-3 sm:grid-cols-3" aria-label="Menu lainnya">
              {more.map((n) => (
                <NavLink key={n.to} to={n.to} className={linkClass} onClick={() => setOpen(false)}>
                  <n.icon size={18} /> {n.label}
                </NavLink>
              ))}
              <button onClick={doLogout} className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold text-red-300 hover:bg-red-500/10">
                <LogOut size={18} /> Keluar
              </button>
            </nav>
          </div>
        )}
      </header>

      <main className="mx-auto max-w-6xl px-4 pt-6">
        <Suspense fallback={<Spinner light />}>
          <Outlet />
        </Suspense>
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-navy-900/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden" aria-label="Navigasi bawah">
        <div className="mx-auto grid max-w-md grid-cols-5">
          {MAIN_NAV.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.end}
              className={({ isActive }) => `flex flex-col items-center gap-1 py-2.5 text-[11px] font-bold ${isActive ? 'text-sun' : 'text-white/70'}`}
            >
              <n.icon size={22} />
              {n.label}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}
