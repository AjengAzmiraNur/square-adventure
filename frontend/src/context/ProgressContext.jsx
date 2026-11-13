import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './AuthContext'

const ProgressContext = createContext(null)

const EMPTY = {
  stats: null,
  lessons: [],
  progress: {},
  achievements: [],
  earned: {},
  activities: [],
  quizzes: [],
  quizAttempts: [],
  games: [],
  gameAttempts: [],
}

/**
 * Memuat data milik siswa yang sedang login langsung dari Supabase.
 * RLS memastikan setiap query hanya mengembalikan baris milik siswa ini.
 */
export function ProgressProvider({ children }) {
  const { session, profile } = useAuth()
  const isTeacher = profile?.role === 'teacher'
  const [data, setData] = useState(EMPTY)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const refresh = useCallback(async () => {
    if (!session) return
    setError('')
    const uid = session.user.id
    const results = await Promise.all([
      supabase.from('user_stats').select('*').eq('user_id', uid).maybeSingle(),
      supabase.from('lessons').select('*').order('level'),
      supabase.from('lesson_progress').select('*').eq('user_id', uid),
      supabase.from('achievements').select('*').order('sort_order'),
      supabase.from('user_achievements').select('*').eq('user_id', uid),
      supabase.from('activity_logs').select('*').eq('user_id', uid).order('created_at', { ascending: false }).limit(200),
      supabase.from('quizzes').select('id, slug, kind, title, difficulty'),
      supabase
        .from('quiz_attempts')
        .select('id, quiz_id, kind, status, score, total, score_pct, stars, xp_awarded, started_at, submitted_at')
        .eq('user_id', uid)
        .eq('status', 'completed')
        .order('submitted_at', { ascending: false }),
      supabase.from('games').select('*'),
      supabase.from('game_attempts').select('*').eq('user_id', uid).order('created_at', { ascending: false }),
    ])
    const failed = results.find((r) => r.error)
    if (failed) {
      setError('Gagal memuat data petualanganmu. Periksa koneksi lalu coba lagi.')
      setLoading(false)
      return
    }
    const [stats, lessons, progress, achievements, earned, activities, quizzes, quizAttempts, games, gameAttempts] =
      results.map((r) => r.data)
    const lessonById = Object.fromEntries(lessons.map((l) => [l.id, l]))
    setData({
      stats: stats || { total_xp: 0, level: 1, lessons_completed: 0, games_played: 0, quizzes_completed: 0, stars: 0 },
      lessons,
      progress: Object.fromEntries(progress.filter((p) => lessonById[p.lesson_id]).map((p) => [lessonById[p.lesson_id].slug, p])),
      achievements,
      earned: Object.fromEntries(earned.map((e) => [e.achievement_id, e])),
      activities,
      quizzes,
      quizAttempts,
      games,
      gameAttempts,
    })
    setLoading(false)
  }, [session])

  useEffect(() => {
    if (session) {
      setLoading(true)
      refresh()
    } else {
      setData(EMPTY)
    }
  }, [session, refresh])

  const helpers = useMemo(() => {
    const completedLevels = new Set(
      data.lessons.filter((l) => data.progress[l.slug]?.status === 'completed').map((l) => l.level),
    )
    const isUnlocked = (lesson) => isTeacher || lesson.level === 1 || completedLevels.has(lesson.level - 1)
    const quizBySlug = Object.fromEntries(data.quizzes.map((q) => [q.slug, q]))
    const gameBySlug = Object.fromEntries(data.games.map((g) => [g.slug, g]))
    const bestQuiz = (slug) => {
      const q = quizBySlug[slug]
      if (!q) return null
      const rows = data.quizAttempts.filter((a) => a.quiz_id === q.id)
      return rows.length ? Math.max(...rows.map((a) => Number(a.score_pct))) : null
    }
    const bestGame = (slug) => {
      const g = gameBySlug[slug]
      if (!g) return null
      const rows = data.gameAttempts.filter((a) => a.game_id === g.id)
      return rows.length ? { pct: Math.max(...rows.map((a) => Number(a.score_pct))), stars: Math.max(...rows.map((a) => a.stars)) } : null
    }
    return { completedLevels, isUnlocked, quizBySlug, gameBySlug, bestQuiz, bestGame, isTeacher }
  }, [data, isTeacher])

  const value = useMemo(() => ({ ...data, ...helpers, loading, error, refresh }), [data, helpers, loading, error, refresh])
  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>
}

export const useProgress = () => useContext(ProgressContext)
