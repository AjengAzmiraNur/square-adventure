// Konfigurasi koneksi. Nilai dari .env (saat build) bisa ditimpa dari layar
// "Pengaturan Server" di halaman masuk, sehingga satu APK dapat dipakai
// dengan proyek Supabase/backend mana pun tanpa build ulang.
// Hanya berisi nilai PUBLIK (URL dan anon key) — tidak pernah service role key.

const KEY = 'square-adventure:server-config'

function readStored() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '{}') || {}
  } catch {
    return {}
  }
}

const stored = typeof localStorage !== 'undefined' ? readStored() : {}

/** Alamat backend bawaan: jika halaman disajikan oleh backend FastAPI (mis.
 *  http://192.168.1.10:8000), gunakan alamat yang sama; saat `npm run dev`
 *  (port 5173) atau di aplikasi Android, pakai localhost:8000 sampai diatur. */
function defaultApiUrl() {
  if (typeof window === 'undefined') return 'http://localhost:8000'
  const { protocol, port, origin } = window.location
  const native = Boolean(window.Capacitor?.isNativePlatform?.())
  if (!native && /^https?:$/.test(protocol) && port !== '5173') return origin
  return 'http://localhost:8000'
}

export const config = {
  supabaseUrl: (stored.supabaseUrl || import.meta.env.VITE_SUPABASE_URL || '').trim(),
  supabaseAnonKey: (stored.supabaseAnonKey || import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim(),
  apiUrl: (stored.apiUrl || import.meta.env.VITE_API_URL || defaultApiUrl()).trim().replace(/\/$/, ''),
}

export const hasStoredConfig = Boolean(stored.supabaseUrl || stored.apiUrl)

export function validateServerConfig({ supabaseUrl, supabaseAnonKey, apiUrl }) {
  const isUrl = (u) => /^https?:\/\/[^\s/]+/i.test(u || '')
  if (!isUrl(supabaseUrl)) return 'Supabase URL harus diawali https:// (contoh: https://abcd.supabase.co).'
  if (!supabaseAnonKey || supabaseAnonKey.length < 20) return 'Anon key Supabase belum diisi dengan benar.'
  if (/service_role|sb_secret_/i.test(supabaseAnonKey)) return 'Jangan memakai service role / secret key di aplikasi. Gunakan anon / publishable key.'
  if (!isUrl(apiUrl)) return 'Alamat backend harus diawali http:// atau https:// (contoh: http://192.168.1.10:8000).'
  return ''
}

export function saveServerConfig(values) {
  localStorage.setItem(
    KEY,
    JSON.stringify({
      supabaseUrl: values.supabaseUrl.trim(),
      supabaseAnonKey: values.supabaseAnonKey.trim(),
      apiUrl: values.apiUrl.trim().replace(/\/$/, ''),
    }),
  )
}

export function resetServerConfig() {
  localStorage.removeItem(KEY)
}
