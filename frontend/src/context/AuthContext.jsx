import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { api } from '../lib/api'
import { isSupabaseConfigured, supabase } from '../lib/supabase'
import { getMode, setMode } from '../lib/mode'
import { createGuest, guestProfile } from '../lib/guest/engine'

const AuthContext = createContext(null)

async function fetchProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, student_code, class_name, role, is_active')
    .eq('id', userId)
    .maybeSingle()
  if (error) throw error
  return data
}

const guestSession = (p) => ({ guest: true, user: { id: p.id } })

export function AuthProvider({ children }) {
  const initialGuest = getMode() === 'guest' ? guestProfile() : null
  const [session, setSession] = useState(initialGuest ? guestSession(initialGuest) : null)
  const [profile, setProfile] = useState(initialGuest)
  const [loading, setLoading] = useState(!initialGuest && isSupabaseConfigured)

  useEffect(() => {
    if (initialGuest || !isSupabaseConfigured) return undefined
    let active = true

    supabase.auth.getSession().then(async ({ data }) => {
      if (!active) return
      setSession(data.session)
      if (data.session) {
        try {
          setProfile(await fetchProfile(data.session.user.id))
        } catch {
          setProfile(null)
        }
      }
      setLoading(false)
    })

    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      if (getMode() === 'guest') return
      setSession(next)
      if (!next) setProfile(null)
    })
    return () => {
      active = false
      sub.subscription.unsubscribe()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /** Login kode siswa (akun Supabase sungguhan). */
  const login = useCallback(async (code) => {
    setMode('account')
    const result = await api('/api/auth/login', { body: { code }, auth: false })
    const { data, error } = await supabase.auth.setSession({
      access_token: result.access_token,
      refresh_token: result.refresh_token,
    })
    if (error) throw new Error('Gagal menyimpan sesi. Coba lagi.')
    setSession(data.session)
    setProfile(await fetchProfile(data.session.user.id))
    return result.profile
  }, [])

  /** Mode Tamu: tanpa server, progres disimpan di perangkat ini. */
  const loginGuest = useCallback((name) => {
    const p = createGuest(name)
    setMode('guest')
    setSession(guestSession(p))
    setProfile(p)
    return p
  }, [])

  const logout = useCallback(async () => {
    if (getMode() === 'guest') {
      setMode(null) // data tamu tetap tersimpan; bisa dilanjutkan lagi
    } else {
      await supabase?.auth.signOut()
      setMode(null)
    }
    setSession(null)
    setProfile(null)
  }, [])

  const value = useMemo(
    () => ({ session, profile, loading, login, loginGuest, logout, configured: isSupabaseConfigured, isGuest: Boolean(profile?.guest) }),
    [session, profile, loading, login, loginGuest, logout],
  )
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)
