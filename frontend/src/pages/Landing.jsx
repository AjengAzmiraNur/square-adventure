import { Link } from 'react-router-dom'
import { ArrowRight, BookOpen, Calculator, CheckCircle2, FlaskConical, Gamepad2, LogIn, PenLine, Sparkles, Trophy } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import Kubi from '../components/Kubi'
import SquareGrid from '../components/SquareGrid'
import { Logo } from '../components/ui'

const LEARN = [
  'Mengenal pola bilangan persegi',
  'Mengamati susunan bilangan persegi',
  'Menentukan suku berikutnya',
  'Menemukan hubungan antarbilangan',
  'Memahami rumus pola bilangan persegi',
  'Menerapkan pola dalam permasalahan kontekstual',
]

const FEATURES = [
  { icon: BookOpen, title: 'Materi interaktif', text: 'Empat level, satu langkah per layar.' },
  { icon: FlaskConical, title: 'Visualisasi pola persegi', text: 'Susun, ubah, dan amati kotak secara langsung.' },
  { icon: PenLine, title: 'Latihan soal', text: 'Petunjuk dan pembahasan langkah demi langkah.' },
  { icon: Gamepad2, title: 'Permainan edukatif', text: 'Lima permainan dengan cara main berbeda.' },
  { icon: Calculator, title: 'Tantangan matematika', text: 'Soal cerita dari kehidupan sehari-hari.' },
  { icon: CheckCircle2, title: 'Evaluasi pembelajaran', text: 'Final Challenge dengan pembahasan lengkap.' },
  { icon: Trophy, title: 'Skor & pencapaian', text: 'Kumpulkan XP, bintang, dan lencana.' },
]

const STEPS = ['Masukkan kode siswa', 'Masuk ke aplikasi', 'Pelajari materi', 'Selesaikan setiap misi', 'Kumpulkan poin', 'Ikuti evaluasi akhir']

function HeroIllustration() {
  return (
    <div className="relative mx-auto flex max-w-md items-end justify-center gap-4 sm:gap-6" aria-hidden="true">
      {[1, 2, 3, 4].map((n, i) => (
        <div key={n} className="flex animate-rise flex-col items-center gap-2" style={{ animationDelay: `${i * 0.15}s` }}>
          <SquareGrid rows={n} cell={n === 4 ? 16 : 18} gap={3} highlightFrom={n - 1} />
          <span className="rounded-full bg-white/10 px-3 py-1 font-display text-lg font-semibold text-sun">{n * n}</span>
        </div>
      ))}
    </div>
  )
}

export default function Landing() {
  const { session } = useAuth()
  const startTo = session ? '/app' : '/masuk'
  return (
    <div className="world-bg min-h-dvh text-white">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Logo />
        <Link to={startTo} className="btn-ghost btn-sm">
          <LogIn size={18} /> {session ? 'Buka Aplikasi' : 'Masuk'}
        </Link>
      </header>

      {/* HERO */}
      <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 pb-16 pt-8 lg:grid-cols-2 lg:pt-14">
        <div>
          <p className="chip bg-sun/15 text-sun">
            <Sparkles size={14} /> Explore the Pattern, Discover the Square!
          </p>
          <h1 className="mt-4 text-4xl font-bold leading-tight sm:text-5xl">
            Petualangan Menaklukkan <span className="text-sky">Dunia Pola Persegi</span>
          </h1>
          <p className="mt-4 max-w-xl text-lg text-white/80">
            Jelajahi empat wilayah, amati susunan kotak, temukan rahasia bilangan 1, 4, 9, 16, 25, ..., dan kuasai rumus
            U<sub>n</sub> = n² lewat materi, laboratorium, latihan, dan permainan.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link to={startTo} className="btn-sun text-lg">
              MULAI PETUALANGAN <ArrowRight size={20} />
            </Link>
            <Link to="/masuk" className="btn-ghost">
              Masuk dengan kode siswa
            </Link>
          </div>
        </div>
        <div className="panel-dark py-10">
          <HeroIllustration />
          <p className="mt-6 text-center text-sm text-white/70">
            Setiap susunan berikutnya bertambah <span className="font-bold text-sun">kotak kuning</span> — 3, 5, 7, ... kotak.
          </p>
        </div>
      </section>

      {/* TENTANG */}
      <section className="bg-snow py-16 text-ink">
        <div className="mx-auto grid max-w-6xl items-center gap-8 px-4 md:grid-cols-[1fr_1.3fr]">
          <Kubi mood="wave" size={110}>
            Halo, petualang! Aku <b>Kubi</b>. Aku akan menemanimu menjelajah dunia pola persegi.
          </Kubi>
          <div>
            <p className="label-eyebrow text-royal">Tentang SQUARE ADVENTURE</p>
            <h2 className="mt-2 text-3xl font-bold text-navy">Belajar matematika sambil berpetualang</h2>
            <p className="mt-3 text-lg text-slate-700">
              SQUARE ADVENTURE adalah media pembelajaran matematika interaktif berbasis permainan untuk siswa SMP. Materinya
              disajikan bertahap — dari gambar susunan persegi, ke tabel bilangan, lalu ke rumus — supaya kamu memahami
              <i> mengapa</i> rumusnya benar, bukan hanya menghafal.
            </p>
          </div>
        </div>
      </section>

      {/* APA YANG DIPELAJARI */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <p className="label-eyebrow text-sun">Apa yang akan dipelajari?</p>
        <h2 className="mt-2 text-3xl font-bold">Enam keterampilan di dunia persegi</h2>
        <ol className="mt-8 grid gap-x-10 gap-y-4 sm:grid-cols-2">
          {LEARN.map((item, i) => (
            <li key={item} className="flex items-center gap-4 border-b border-white/10 pb-4">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-royal font-display text-lg font-bold">{i + 1}</span>
              <span className="text-lg font-semibold">{item}</span>
            </li>
          ))}
        </ol>
      </section>

      {/* FITUR UNGGULAN */}
      <section className="bg-navy-900/60 py-16">
        <div className="mx-auto max-w-6xl px-4">
          <p className="label-eyebrow text-mint">Fitur unggulan</p>
          <h2 className="mt-2 text-3xl font-bold">Perlengkapan petualanganmu</h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((f, i) => (
              <div key={f.title} className={`flex gap-3 ${i === 0 ? 'lg:col-span-2' : ''}`}>
                <f.icon className="mt-1 shrink-0 text-sky" size={26} />
                <div>
                  <h3 className="text-lg font-semibold">{f.title}</h3>
                  <p className="text-white/70">{f.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CARA MENGGUNAKAN */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <p className="label-eyebrow text-sun">Cara menggunakan</p>
        <h2 className="mt-2 text-3xl font-bold">Enam langkah menuju Kastel Persegi</h2>
        <div className="mt-10 flex flex-col gap-4 md:flex-row md:items-end">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-3 md:flex-1 md:flex-col md:items-start">
              <div className="grid shrink-0 place-items-center rounded-lg bg-sky/90 font-display font-bold text-navy" style={{ width: 28 + i * 6, height: 28 + i * 6 }}>
                {i + 1}
              </div>
              <p className="font-semibold">{s}</p>
            </div>
          ))}
        </div>
        <div className="mt-12 text-center">
          <Link to={startTo} className="btn-sun text-lg">
            MULAI PETUALANGAN <ArrowRight size={20} />
          </Link>
        </div>
      </section>

      <footer className="border-t border-white/10 py-6 text-center text-sm text-white/60">
        SQUARE ADVENTURE · Media pembelajaran pola bilangan persegi untuk siswa SMP
      </footer>
    </div>
  )
}
