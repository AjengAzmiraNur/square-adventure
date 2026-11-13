import { AlertTriangle, Loader2, Star } from 'lucide-react'

export function Logo({ size = 'md', light = true }) {
  const box = size === 'lg' ? 'h-12 w-12' : size === 'sm' ? 'h-8 w-8' : 'h-10 w-10'
  const text = size === 'lg' ? 'text-2xl' : size === 'sm' ? 'text-base' : 'text-xl'
  return (
    <span className="inline-flex items-center gap-2">
      <svg viewBox="0 0 40 40" className={box} aria-hidden="true">
        <rect width="40" height="40" rx="10" fill="#2563EB" />
        <rect x="6" y="24" width="8" height="8" rx="2" fill="#FACC15" />
        <rect x="16" y="24" width="8" height="8" rx="2" fill="#6EE7B7" />
        <rect x="16" y="14" width="8" height="8" rx="2" fill="#6EE7B7" />
        <rect x="26" y="24" width="8" height="8" rx="2" fill="#A78BFA" />
        <rect x="26" y="14" width="8" height="8" rx="2" fill="#A78BFA" />
        <rect x="26" y="4" width="8" height="8" rx="2" fill="#A78BFA" />
      </svg>
      <span className={`font-display font-bold leading-none ${text} ${light ? 'text-white' : 'text-navy'}`}>
        SQUARE<span className="text-sun"> ADVENTURE</span>
      </span>
    </span>
  )
}

export function Spinner({ label = 'Memuat...', light = false }) {
  return (
    <div className={`flex items-center justify-center gap-3 py-10 font-bold ${light ? 'text-white' : 'text-slate-600'}`} role="status">
      <Loader2 className="animate-spin" size={22} />
      <span>{label}</span>
    </div>
  )
}

export function FullPageLoader({ label = 'Menyiapkan petualangan...' }) {
  return (
    <div className="world-bg grid min-h-dvh place-items-center">
      <Spinner label={label} light />
    </div>
  )
}

export function ErrorBox({ message, onRetry }) {
  if (!message) return null
  return (
    <div className="flex items-start gap-3 rounded-xl border-2 border-red-200 bg-red-50 p-4 text-red-800" role="alert">
      <AlertTriangle className="mt-0.5 shrink-0" size={20} />
      <div className="flex-1">
        <p className="font-semibold">{message}</p>
        {onRetry && (
          <button onClick={onRetry} className="mt-2 text-sm font-bold underline">
            Coba lagi
          </button>
        )}
      </div>
    </div>
  )
}

export function Stars({ count = 0, max = 3, size = 20 }) {
  return (
    <span className="inline-flex gap-0.5" aria-label={`${count} dari ${max} bintang`}>
      {Array.from({ length: max }, (_, i) => (
        <Star key={i} size={size} className={i < count ? 'fill-sun text-sun' : 'text-slate-300'} />
      ))}
    </span>
  )
}

export function ProgressBar({ value, color = 'bg-mint', track = 'bg-white/15', label, height = 'h-3' }) {
  const pct = Math.max(0, Math.min(100, value || 0))
  return (
    <div className={`w-full overflow-hidden rounded-full ${track} ${height}`} role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={label}>
      <div className={`h-full rounded-full ${color} transition-all duration-500`} style={{ width: `${pct}%` }} />
    </div>
  )
}

export function PageTitle({ eyebrow, title, children, icon: Icon }) {
  return (
    <header className="mb-6 text-white">
      {eyebrow && <p className="label-eyebrow text-sun">{eyebrow}</p>}
      <h1 className="mt-1 flex items-center gap-3 text-3xl font-bold sm:text-4xl">
        {Icon && <Icon className="text-sky" size={32} />}
        {title}
      </h1>
      {children && <p className="mt-2 max-w-2xl text-white/75">{children}</p>}
    </header>
  )
}

export function formatDate(iso) {
  if (!iso) return '-'
  return new Date(iso).toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}
