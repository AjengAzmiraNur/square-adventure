import { useState } from 'react'
import { CheckCircle2, Loader2, Plug, RotateCcw, Save, X } from 'lucide-react'
import { config, hasStoredConfig, resetServerConfig, saveServerConfig, validateServerConfig } from '../lib/config'
import { ErrorBox } from './ui'

/** Form pengaturan koneksi Supabase & backend (disimpan di perangkat ini). */
export default function ServerSettings({ onClose }) {
  const [form, setForm] = useState({ ...config })
  const [error, setError] = useState('')
  const [status, setStatus] = useState('')
  const [testing, setTesting] = useState(false)

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  const test = async () => {
    setError('')
    setStatus('')
    const msg = validateServerConfig(form)
    if (msg) return setError(msg)
    setTesting(true)
    try {
      const res = await fetch(`${form.apiUrl.replace(/\/$/, '')}/api/health`)
      const data = await res.json()
      if (!data.configured) throw new Error('Backend aktif, tetapi backend/.env belum berisi kredensial Supabase.')
      const sb = await fetch(`${form.supabaseUrl.replace(/\/$/, '')}/auth/v1/settings`, { headers: { apikey: form.supabaseAnonKey } })
      if (!sb.ok) throw new Error('Backend OK, tetapi Supabase URL atau anon key tidak valid.')
      setStatus('Koneksi berhasil: backend dan Supabase dapat dihubungi.')
    } catch (e) {
      setError(e instanceof TypeError ? 'Backend tidak dapat dihubungi. Pastikan backend berjalan dan alamatnya benar (HP & laptop di Wi-Fi yang sama).' : e.message)
    } finally {
      setTesting(false)
    }
  }

  const save = () => {
    const msg = validateServerConfig(form)
    if (msg) return setError(msg)
    saveServerConfig(form)
    window.location.reload()
  }

  const reset = () => {
    resetServerConfig()
    window.location.reload()
  }

  const field = (k, label, placeholder, hint) => (
    <label className="block">
      <span className="text-sm font-bold text-slate-600">{label}</span>
      <input className="input text-sm font-semibold" value={form[k]} onChange={set(k)} placeholder={placeholder} autoCapitalize="off" autoCorrect="off" spellCheck={false} />
      {hint && <span className="mt-1 block text-xs text-slate-500">{hint}</span>}
    </label>
  )

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-navy-900/80 p-4" role="dialog" aria-modal="true" aria-labelledby="server-title">
      <div className="panel max-h-[92dvh] w-full max-w-lg space-y-4 overflow-y-auto">
        <div className="flex items-center justify-between">
          <h2 id="server-title" className="text-xl font-bold text-navy">
            Pengaturan Server
          </h2>
          <button type="button" onClick={onClose} className="rounded-lg p-1 text-slate-500 hover:text-navy" aria-label="Tutup">
            <X />
          </button>
        </div>
        <p className="text-sm text-slate-600">Diisi sekali oleh guru. Pengaturan disimpan di perangkat ini.</p>
        {field('supabaseUrl', 'Supabase Project URL', 'https://xxxx.supabase.co')}
        {field('supabaseAnonKey', 'Supabase anon / publishable key', 'eyJ... atau sb_publishable_...', 'Jangan pernah memakai service role key di sini.')}
        {field('apiUrl', 'Alamat backend FastAPI', 'http://192.168.1.10:8000', 'Laptop: http://localhost:8000 · HP: http://IP-laptop:8000 atau URL HTTPS backend.')}
        {error && <ErrorBox message={error} />}
        {status && (
          <p className="flex items-center gap-2 rounded-xl bg-emerald-50 p-3 font-semibold text-emerald-800">
            <CheckCircle2 size={18} /> {status}
          </p>
        )}
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn-light btn-sm" onClick={test} disabled={testing}>
            {testing ? <Loader2 className="animate-spin" size={16} /> : <Plug size={16} />} Tes koneksi
          </button>
          <button type="button" className="btn-primary btn-sm" onClick={save}>
            <Save size={16} /> Simpan
          </button>
          {hasStoredConfig && (
            <button type="button" className="btn-light btn-sm" onClick={reset}>
              <RotateCcw size={16} /> Kembali ke bawaan
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
