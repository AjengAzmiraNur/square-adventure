import { supabase } from './supabase'
import { config } from './config'

export const API_URL = config.apiUrl

export class ApiError extends Error {
  constructor(message, status) {
    super(message)
    this.status = status
  }
}

/** Panggil backend FastAPI dengan token sesi Supabase siswa yang sedang login. */
export async function api(path, { method = 'POST', body, auth = true } = {}) {
  const headers = { 'Content-Type': 'application/json' }
  if (auth && supabase) {
    const { data } = await supabase.auth.getSession()
    const token = data.session?.access_token
    if (!token) throw new ApiError('Sesi berakhir. Silakan masuk kembali.', 401)
    headers.Authorization = `Bearer ${token}`
  }
  let res
  try {
    res = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch {
    throw new ApiError('Tidak dapat terhubung ke server. Periksa koneksi internet atau pastikan backend berjalan.', 0)
  }
  let data = null
  try {
    data = await res.json()
  } catch {
    data = null
  }
  if (!res.ok) {
    let message = data?.detail
    if (Array.isArray(message)) message = 'Data yang dikirim belum lengkap atau tidak valid.'
    throw new ApiError(message || `Terjadi kesalahan (${res.status}).`, res.status)
  }
  return data
}
