import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight, KeyRound, Loader2, Settings, Smartphone, UserRound } from 'lucide-react'
import ServerSettings from '../components/ServerSettings'
import { useAuth } from '../context/AuthContext'
import Kubi from '../components/Kubi'
import { ErrorBox, FullPageLoader, Logo } from '../components/ui'
import { guestProfile } from '../lib/guest/engine'

const CODE_RE = /^[A-Z0-9-]{4,20}$/

function GuestCard({ primary }) {
  const { loginGuest } = useAuth()
  const navigate = useNavigate()
  const saved = guestProfile()
  const [name, setName] = useState(saved?.full_name || '')
  const [error, setError] = useState('')

  const start = (e) => {
    e.preventDefault()
    try {
      loginGuest(name)
      navigate('/app', { replace: true })
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <form onSubmit={start} className={`space-y-3 rounded-2xl p-4 ${primary ? 'bg-sun/15 ring-2 ring-sun' : 'bg-slate-100'}`} noValidate>
      <p className="flex items-center gap-2 font-display text-lg font-semibold text-navy">
        <UserRound size={20} /> Main sebagai Tamu
      </p>
      <p className="text-sm text-slate-600">Tanpa kode dan tanpa internet tambahan. Semua fitur bisa dipakai; progres tersimpan di perangkat ini saja.</p>
      <input className="input text-base" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nama panggilanmu" maxLength={40} aria-label="Nama panggilan" />
      {error && <ErrorBox message={error} />}
      <button type="submit" className={primary ? 'btn-sun w-full text-lg' : 'btn-light w-full'}>
        {saved ? `Lanjutkan petualangan` : 'Mulai sebagai tamu'} <ArrowRight size={18} />
      </button>
      {saved && (
        <p className="flex items-center gap-1 text-xs text-slate-500">
          <Smartphone size={14} /> Progres tamu sebelumnya ditemukan di perangkat ini.
        </p>
      )}
    </form>
  )
}

export default function Login() {
  const { session, profile, loading, login, configured } = useAuth()
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  if (loading) return <FullPageLoader />
  if (session && profile) return <Navigate to={location.state?.from || '/app'} replace />

  const submit = async (e) => {
    e.preventDefault()
    const clean = code.replace(/\s+/g, '').toUpperCase()
    if (!clean) return setError('Kode siswa wajib diisi.')
    if (!CODE_RE.test(clean)) return setError('Kode hanya boleh berisi huruf, angka, dan tanda hubung (4–20 karakter).')
    setError('')
    setBusy(true)
    try {
      await login(clean)
      navigate(location.state?.from || '/app', { replace: true })
    } catch (err) {
      setError(err.message || 'Gagal masuk. Coba lagi.')
    } finally {
      setBusy(false)
    }
  }

  const accountForm = (
    <form onSubmit={submit} className="space-y-3" noValidate>
      <p className="flex items-center gap-2 font-display text-lg font-semibold text-navy">
        <KeyRound size={20} /> Masuk dengan kode siswa
      </p>
      {!configured ? (
        <p className="text-sm text-slate-600">
          Login kode siswa membutuhkan server sekolah (Supabase + backend). Guru dapat mengaturnya lewat{' '}
          <button type="button" className="font-bold text-royal underline" onClick={() => setShowSettings(true)}>
            Pengaturan Server
          </button>
          .
        </p>
      ) : (
        <>
          <p className="text-sm text-slate-600">Progres tersimpan di akun sekolah dan dapat dilihat guru.</p>
          <input
            className="input uppercase tracking-widest"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="contoh: SA-9A-001"
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            maxLength={24}
            aria-label="Kode siswa"
            aria-invalid={Boolean(error)}
            disabled={busy}
          />
          {error && <ErrorBox message={error} />}
          <button type="submit" className="btn-primary w-full text-lg" disabled={busy}>
            {busy ? (
              <>
                <Loader2 className="animate-spin" size={20} /> Memeriksa kode...
              </>
            ) : (
              'Masuk'
            )}
          </button>
        </>
      )}
    </form>
  )

  return (
    <div className="world-bg grid min-h-dvh place-items-center px-4 py-10">
      {showSettings && <ServerSettings onClose={() => setShowSettings(false)} />}
      <div className="w-full max-w-md">
        <div className="mb-6 flex items-center justify-between">
          <Link to="/" className="inline-flex items-center gap-1 text-sm font-bold text-white/70 hover:text-white">
            <ArrowLeft size={16} /> Beranda
          </Link>
          <Logo size="sm" />
        </div>
        <div className="panel animate-rise space-y-5">
          <Kubi mood={error ? 'encourage' : 'happy'} size={64}>
            {error ? 'Ups, coba periksa kodenya lagi, ya.' : 'Halo! Pilih cara memulai petualanganmu.'}
          </Kubi>
          <h1 className="text-3xl font-bold text-navy">Selamat Datang, Petualang!</h1>

          {configured ? (
            <>
              {accountForm}
              <div className="flex items-center gap-3 text-xs font-bold uppercase text-slate-400">
                <span className="h-px flex-1 bg-slate-200" /> atau <span className="h-px flex-1 bg-slate-200" />
              </div>
              <GuestCard />
            </>
          ) : (
            <>
              <GuestCard primary />
              {accountForm}
            </>
          )}

          <button type="button" onClick={() => setShowSettings(true)} className="mx-auto flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-royal">
            <Settings size={14} /> Pengaturan Server
          </button>
        </div>
      </div>
    </div>
  )
}
