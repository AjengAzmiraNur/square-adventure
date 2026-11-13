// Mode pemakaian: 'guest' (Mode Tamu, tersimpan di perangkat) atau 'account' (login kode siswa via Supabase).
const KEY = 'square-adventure:mode'

export function getMode() {
  try {
    return localStorage.getItem(KEY)
  } catch {
    return null
  }
}

export function setMode(mode) {
  try {
    if (mode) localStorage.setItem(KEY, mode)
    else localStorage.removeItem(KEY)
  } catch {
    /* abaikan */
  }
}

export const isGuestMode = () => getMode() === 'guest'
