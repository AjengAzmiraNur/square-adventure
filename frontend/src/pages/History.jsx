import { useState } from 'react'
import { ScrollText } from 'lucide-react'
import { useProgress } from '../context/ProgressContext'
import { ErrorBox, formatDate, PageTitle, Spinner } from '../components/ui'
import { ACTIVITY_LABEL } from '../lib/levels'

const FILTERS = [
  ['all', 'Semua'],
  ['lesson', 'Materi'],
  ['training', 'Latihan'],
  ['game', 'Permainan'],
  ['final', 'Evaluasi'],
  ['achievement', 'Lencana'],
]

const STATUS = { started: 'Dimulai', completed: 'Selesai', earned: 'Diperoleh', success: 'Berhasil' }

function scoreText(a) {
  const d = a.detail || {}
  if (d.score_pct != null && d.total != null) return `${Number(d.score_pct)} (${d.correct}/${d.total})`
  if (d.score != null) return `${d.score}/${d.max_score}`
  if (d.check_score != null) return `Latihan singkat ${d.check_score}`
  return '—'
}

export default function History() {
  const { activities, loading, error, refresh } = useProgress()
  const [filter, setFilter] = useState('all')
  if (loading) return <Spinner light />
  const rows = activities.filter((a) => (filter === 'all' ? a.activity_type !== 'login' : a.activity_type === filter || (filter === 'training' && a.activity_type === 'lesson_check')))

  return (
    <div>
      <PageTitle eyebrow="Riwayat" title="Riwayat Belajar" icon={ScrollText}>
        Catatan aktivitas belajarmu. Hanya kamu yang dapat melihat riwayat ini.
      </PageTitle>
      {error && <ErrorBox message={error} onRetry={refresh} />}
      <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
        {FILTERS.map(([k, label]) => (
          <button key={k} type="button" onClick={() => setFilter(k)} className={`btn btn-sm shrink-0 ${filter === k ? 'bg-sun text-navy' : 'bg-white/10 text-white'}`} aria-pressed={filter === k}>
            {label}
          </button>
        ))}
      </div>
      {rows.length === 0 ? (
        <p className="rounded-2xl bg-white/5 p-6 text-center text-white/70">Belum ada aktivitas pada kategori ini.</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl bg-snow">
          <table className="w-full min-w-[640px] text-left">
            <thead className="bg-navy text-sm text-white">
              <tr>
                <th className="p-3">Tanggal</th>
                <th className="p-3">Aktivitas</th>
                <th className="p-3">Jenis</th>
                <th className="p-3">Nilai</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {rows.map((a) => (
                <tr key={a.id} className="border-t border-slate-200">
                  <td className="p-3 text-slate-600">{formatDate(a.created_at)}</td>
                  <td className="p-3 font-bold text-navy">
                    {a.title}
                    {a.detail?.difficulty && <span className="ml-1 text-xs font-normal text-slate-500">({a.detail.difficulty})</span>}
                  </td>
                  <td className="p-3">{ACTIVITY_LABEL[a.activity_type]}</td>
                  <td className="p-3">{scoreText(a)}</td>
                  <td className="p-3">
                    <span className={`chip ${a.status === 'started' ? 'bg-sky/20 text-blue-800' : 'bg-mint/40 text-emerald-800'}`}>{STATUS[a.status] || a.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
