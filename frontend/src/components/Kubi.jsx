/**
 * Kubi — karakter pendamping SQUARE ADVENTURE: kubus petualang yang ramah.
 * mood: 'happy' | 'think' | 'cheer' | 'encourage' | 'wave'
 */
export function KubiFace({ mood = 'happy', size = 96, className = '' }) {
  const eyes = {
    happy: (
      <>
        <circle cx="38" cy="52" r="6" fill="#0f1a3d" />
        <circle cx="62" cy="52" r="6" fill="#0f1a3d" />
        <circle cx="40" cy="50" r="2" fill="#fff" />
        <circle cx="64" cy="50" r="2" fill="#fff" />
      </>
    ),
    think: (
      <>
        <circle cx="40" cy="50" r="6" fill="#0f1a3d" />
        <circle cx="64" cy="50" r="6" fill="#0f1a3d" />
        <circle cx="42" cy="48" r="2" fill="#fff" />
        <circle cx="66" cy="48" r="2" fill="#fff" />
        <path d="M30 40 l14 -3" stroke="#0f1a3d" strokeWidth="3" strokeLinecap="round" />
      </>
    ),
    cheer: (
      <>
        <path d="M31 54 q7 -9 14 0" stroke="#0f1a3d" strokeWidth="4" fill="none" strokeLinecap="round" />
        <path d="M55 54 q7 -9 14 0" stroke="#0f1a3d" strokeWidth="4" fill="none" strokeLinecap="round" />
      </>
    ),
    encourage: (
      <>
        <circle cx="38" cy="53" r="6" fill="#0f1a3d" />
        <circle cx="62" cy="53" r="6" fill="#0f1a3d" />
        <circle cx="40" cy="51" r="2" fill="#fff" />
        <circle cx="64" cy="51" r="2" fill="#fff" />
        <path d="M30 42 l12 3 M70 42 l-12 3" stroke="#0f1a3d" strokeWidth="3" strokeLinecap="round" />
      </>
    ),
  }
  const mouth = {
    happy: <path d="M40 66 q10 9 20 0" stroke="#0f1a3d" strokeWidth="4" fill="none" strokeLinecap="round" />,
    think: <path d="M43 69 h14" stroke="#0f1a3d" strokeWidth="4" strokeLinecap="round" />,
    cheer: <path d="M37 63 q13 16 26 0 z" fill="#0f1a3d" />,
    encourage: <path d="M41 68 q9 6 18 0" stroke="#0f1a3d" strokeWidth="4" fill="none" strokeLinecap="round" />,
  }
  const m = eyes[mood] ? mood : 'happy'
  return (
    <svg viewBox="0 0 100 110" width={size} height={size * 1.1} className={className} role="img" aria-label="Kubi, pemandu petualangan">
      {/* antena bendera */}
      <path d="M50 18 V4" stroke="#FACC15" strokeWidth="3" strokeLinecap="round" />
      <path d="M50 4 h12 l-3 4 l3 4 h-12 z" fill="#FACC15" />
      {/* badan kubus */}
      <path d="M14 30 L28 18 H86 L86 76 L72 90 H14 Z" fill="#1d4ed8" />
      <path d="M14 30 L28 18 H86 L72 30 Z" fill="#60A5FA" />
      <path d="M72 30 L86 18 V76 L72 90 Z" fill="#1e40af" />
      <rect x="14" y="30" width="58" height="60" rx="6" fill="#2563EB" />
      <rect x="20" y="36" width="46" height="48" rx="8" fill="#DBEAFE" />
      {eyes[m]}
      {mouth[m]}
      <circle cx="29" cy="64" r="4" fill="#A78BFA" opacity="0.6" />
      <circle cx="71" cy="64" r="4" fill="#A78BFA" opacity="0.6" />
      {/* syal petualang */}
      <path d="M14 84 H72 V92 H14 Z" fill="#FACC15" />
      <path d="M24 92 l-4 14 l8 -3 l2 -11 z" fill="#FACC15" />
      {/* kaki */}
      <rect x="22" y="96" width="12" height="8" rx="3" fill="#172554" />
      <rect x="52" y="96" width="12" height="8" rx="3" fill="#172554" />
    </svg>
  )
}

/** Kubi dengan balon ucapan. tone: 'light' (di panel terang) | 'dark' (di latar navy) */
export default function Kubi({ mood = 'happy', children, size = 72, tone = 'light', className = '' }) {
  const bubble =
    tone === 'dark' ? 'bg-white text-ink' : 'bg-white text-ink border-2 border-sky/40'
  return (
    <div className={`flex items-end gap-3 ${className}`}>
      <KubiFace mood={mood} size={size} className="shrink-0 animate-bob" />
      {children && (
        <div className={`relative mb-4 max-w-prose rounded-2xl px-4 py-3 text-[15px] font-semibold leading-snug shadow-soft ${bubble}`}>
          <span className="absolute -left-2 bottom-4 h-4 w-4 rotate-45 bg-white" aria-hidden="true" />
          <div className="relative">{children}</div>
        </div>
      )}
    </div>
  )
}
