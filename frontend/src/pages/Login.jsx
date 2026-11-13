import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { ArrowLeft, KeyRound, Loader2, Settings } from 'lucide-react'
import ServerSettings from '../components/ServerSettings'
import { useAuth } from '../context/AuthContext'
import Kubi from '../components/Kubi'
import { ErrorBox, FullPageLoader, Logo } from '../components/ui'

const CODE_RE = /^[A-Z0-9-]{4,20}$/

export default function Login() {
  const { session, profile, loading, login, configured } = useAuth()
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [showSettings, setShowSettings] = useState(!configured)
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
        <div className="panel animate-rise">
          <Kubi mood={error ? 'encourage' : 'happy'} size={64}>
            {error ? 'Ups, coba periksa kodenya lagi, ya.' : 'Masukkan kode siswamu untuk memulai!'}
          </Kubi>
          <h1 className="mt-4 text-3xl font-bold text-navy">Selamat Datang, Petualang!</h1>

          {!configured && (
            <div className="mt-4">
              <ErrorBox message="Aplikasi belum terhubung ke server. Buka Pengaturan Server dan isi alamat Supabase serta backend." />
            </div>
          )}

          <form onSubmit={submit} className="mt-5 space-y-4" noValidate>
            <label className="block">
              <span className="mb-1 block font-bold text-slate-700">Kode siswa</span>
              <div className="relative">
                <KeyRound className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input
                  className="input pl-12 uppercase tracking-widest"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="contoh: SA-9A-001"
                  autoComplete="off"
                  autoCapitalize="characters"
                  spellCheck={false}
                  maxLength={24}
                  aria-invalid={Boolean(error)}
                  disabled={busy || !configured}
                />
              </div>
            </label>
            {error && <ErrorBox message={error} />}
            <button type="submit" className="btn-primary w-full text-lg" disabled={busy || !configured}>
              {busy ? (
                <>
                  <Loader2 className="animate-spin" size={20} /> Memeriksa kode...
                </>
              ) : (
                'Masuk'
              )}
            </button>
          </form>
          <p className="mt-4 text-center text-sm text-slate-500">Belum punya kode? Mintalah kepada guru matematikamu.</p>
          <button type="button" onClick={() => setShowSettings(true)} className="mx-auto mt-3 flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-royal">
            <Settings size={14} /> Pengaturan Server
          </button>
        </div>
      </div>
    </div>
  )
}
