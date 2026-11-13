import { createContext, useCallback, useContext, useState } from 'react'
import { X } from 'lucide-react'
import BadgeIcon from '../components/BadgeIcon'

const ToastContext = createContext(null)

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const dismiss = useCallback((id) => setToasts((t) => t.filter((x) => x.id !== id)), [])

  const push = useCallback(
    (toast) => {
      const id = Math.random().toString(36).slice(2)
      setToasts((t) => [...t, { id, ...toast }])
      setTimeout(() => dismiss(id), toast.duration || 6000)
    },
    [dismiss],
  )

  /** Tampilkan notifikasi XP dan lencana baru dari respons backend. */
  const celebrate = useCallback(
    (result) => {
      if (!result) return
      if (result.xp_awarded > 0) push({ kind: 'xp', title: `+${result.xp_awarded} XP`, text: 'Kerja bagus, petualang!' })
      ;(result.new_achievements || []).forEach((a) =>
        push({ kind: 'badge', icon: a.icon, title: `Lencana baru: ${a.title}`, text: a.description, duration: 8000 }),
      )
    },
    [push],
  )

  return (
    <ToastContext.Provider value={{ push, celebrate }}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 top-3 z-[60] flex flex-col items-center gap-2 px-4" aria-live="polite">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="pointer-events-auto flex w-full max-w-sm animate-pop items-center gap-3 rounded-2xl border-2 border-sun bg-navy-900 p-3 text-white shadow-soft"
          >
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-sun text-navy">
              {t.kind === 'badge' ? <BadgeIcon name={t.icon} size={22} /> : <span className="font-display text-sm font-bold">XP</span>}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-display font-semibold">{t.title}</p>
              {t.text && <p className="text-sm text-white/75">{t.text}</p>}
            </div>
            <button onClick={() => dismiss(t.id)} className="rounded-lg p-1 text-white/60 hover:text-white" aria-label="Tutup notifikasi">
              <X size={18} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export const useToast = () => useContext(ToastContext)
