import { useCallback, useEffect, useState } from 'react'
import { UserPlus, Users } from 'lucide-react'
import { api } from '../lib/api'
import { ErrorBox, PageTitle, Spinner } from '../components/ui'

export default function TeacherStudents() {
  const [students, setStudents] = useState(null)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ full_name: '', class_name: '', student_code: '' })
  const [busy, setBusy] = useState(false)
  const [created, setCreated] = useState('')

  const load = useCallback(async () => {
    setError('')
    try {
      const r = await api('/api/admin/students', { method: 'GET' })
      setStudents(r.students)
    } catch (e) {
      setError(e.message)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const add = async (e) => {
    e.preventDefault()
    if (form.full_name.trim().length < 2) return setError('Nama siswa minimal 2 karakter.')
    setBusy(true)
    setError('')
    setCreated('')
    try {
      const body = { full_name: form.full_name.trim(), class_name: form.class_name.trim(), student_code: form.student_code.trim() || null }
      const r = await api('/api/admin/students', { body })
      setCreated(`${r.student.full_name} terdaftar dengan kode ${r.student.student_code}`)
      setForm({ full_name: '', class_name: '', student_code: '' })
      load()
    } catch (e2) {
      setError(e2.message)
    } finally {
      setBusy(false)
    }
  }

  const toggle = async (s) => {
    try {
      await api(`/api/admin/students/${s.id}`, { method: 'PATCH', body: { is_active: !s.is_active } })
      load()
    } catch (e) {
      setError(e.message)
    }
  }

  return (
    <div>
      <PageTitle eyebrow="Khusus guru" title="Data Siswa" icon={Users}>
        Daftarkan kode siswa. Siswa masuk dengan kode tersebut dan hanya dapat melihat data miliknya.
      </PageTitle>
      <form onSubmit={add} className="panel mb-6 grid gap-3 sm:grid-cols-[2fr_1fr_1.2fr_auto] sm:items-end">
        <label>
          <span className="text-sm font-bold text-slate-600">Nama lengkap</span>
          <input className="input text-base" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} maxLength={80} />
        </label>
        <label>
          <span className="text-sm font-bold text-slate-600">Kelas</span>
          <input className="input text-base" value={form.class_name} onChange={(e) => setForm({ ...form, class_name: e.target.value })} maxLength={20} placeholder="9A" />
        </label>
        <label>
          <span className="text-sm font-bold text-slate-600">Kode (opsional)</span>
          <input className="input text-base uppercase" value={form.student_code} onChange={(e) => setForm({ ...form, student_code: e.target.value.toUpperCase() })} maxLength={20} placeholder="otomatis" />
        </label>
        <button className="btn-primary" type="submit" disabled={busy}>
          <UserPlus size={18} /> {busy ? 'Menyimpan...' : 'Tambah'}
        </button>
        {created && <p className="rounded-xl bg-emerald-50 p-3 font-bold text-emerald-800 sm:col-span-4">{created}</p>}
      </form>
      {error && (
        <div className="mb-4">
          <ErrorBox message={error} onRetry={load} />
        </div>
      )}
      {!students ? (
        !error && <Spinner light />
      ) : (
        <div className="overflow-x-auto rounded-2xl bg-snow">
          <table className="w-full min-w-[680px] text-left text-sm">
            <thead className="bg-navy text-white">
              <tr>
                <th className="p-3">Nama</th>
                <th className="p-3">Kode</th>
                <th className="p-3">Kelas</th>
                <th className="p-3">XP</th>
                <th className="p-3">Misi</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s) => (
                <tr key={s.id} className="border-t border-slate-200">
                  <td className="p-3 font-bold text-navy">{s.full_name}</td>
                  <td className="p-3 font-mono">{s.student_code}</td>
                  <td className="p-3">{s.class_name || '-'}</td>
                  <td className="p-3">{s.total_xp}</td>
                  <td className="p-3">{s.lessons_completed}/4</td>
                  <td className="p-3">
                    <button type="button" onClick={() => toggle(s)} className={`chip ${s.is_active ? 'bg-mint/40 text-emerald-800' : 'bg-slate-200 text-slate-600'}`}>
                      {s.is_active ? 'Aktif' : 'Nonaktif'} — ubah
                    </button>
                  </td>
                </tr>
              ))}
              {students.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-slate-500">
                    Belum ada siswa terdaftar.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
