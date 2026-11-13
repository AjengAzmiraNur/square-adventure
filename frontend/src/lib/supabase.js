import { createClient } from '@supabase/supabase-js'
import { config } from './config'

export const isSupabaseConfigured = Boolean(config.supabaseUrl && config.supabaseAnonKey)

// Hanya anon/publishable key yang dipakai di frontend. Akses data dibatasi RLS.
export const supabase = isSupabaseConfigured
  ? createClient(config.supabaseUrl, config.supabaseAnonKey, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false },
    })
  : null
