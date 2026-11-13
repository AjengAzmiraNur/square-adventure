# SQUARE ADVENTURE

**Explore the Pattern, Discover the Square!**

| | Link |
|---|---|
| 🌐 Web aplikasi | **https://ajengazmiranur.github.io/square-adventure/** |
| 📱 APK Android | https://github.com/AjengAzmiraNur/square-adventure/releases/latest |
| 💻 Kode sumber | https://github.com/AjengAzmiraNur/square-adventure |

Web aplikasi diperbarui otomatis oleh GitHub Actions setiap ada commit ke `main` (lihat `.github/workflows/deploy-pages.yml`). Agar bisa login dari web, backend FastAPI perlu berjalan di alamat **HTTPS** (mis. Render.com memakai `render.yaml` di repo ini), lalu alamatnya diisi di *Pengaturan Server* pada halaman masuk. Lihat bagian [Deploy backend](#7-deploy-backend-https-rendercom).

SQUARE ADVENTURE adalah aplikasi pembelajaran matematika berbasis permainan untuk siswa SMP dengan materi **Pola Bilangan Persegi**. Siswa berperan sebagai petualang yang menjelajahi empat wilayah — Lembah Kotak, Hutan Pola, Gua Rumus, dan Puncak Tantangan — lalu menaklukkan Kastel Persegi (evaluasi akhir), ditemani karakter pemandu **Kubi**.

Desain penyajiannya didasarkan pada hasil wawancara Cognitive Load (lihat [docs/COGNITIVE_LOAD.md](docs/COGNITIVE_LOAD.md)).

---

## Fitur utama

| Fitur | Isi |
|---|---|
| Landing page | Hero, tentang aplikasi, apa yang dipelajari, fitur unggulan, cara menggunakan |
| Login kode siswa | Kode diverifikasi backend → sesi Supabase Auth asli; rate limit; logout |
| Dashboard | Sapaan, kode, progres, XP & level, misi selesai, bintang, lencana, aktivitas terakhir, rekomendasi misi, peta mini |
| Adventure Map | 4 level terbuka bertahap + Kastel Persegi; level terbuka dapat diulang |
| Materi 4 level | 8 langkah per level: tujuan, konsep, ilustrasi interaktif, contoh bilangan, langkah, contoh soal bertahap, latihan singkat, rangkuman + selesaikan misi |
| Square Laboratory | Visualisasi pola, Interactive Pattern Builder, Number Pattern Explorer, Formula Calculator (dengan validasi), Menara 3D (Three.js) |
| Training Zone | Beginner / Intermediate / Expert, 36 soal, 9 jenis soal; petunjuk → pembahasan langkah demi langkah |
| Square Playground | Square Hunter, Complete the Pattern, Find the Next Number (berwaktu, 3 tingkat), Square Formula Challenge, Square Adventure Quest |
| Final Challenge | 10/15/20 soal, timer opsional, navigasi nomor, periksa kembali, skor otomatis, pembahasan, riwayat |
| Gamifikasi | XP, 6 level petualang, bintang, 9 lencana, notifikasi |
| Profil & Riwayat | Data pribadi, nilai, lencana, riwayat aktivitas dengan filter |
| Data Siswa (guru) | Tambah siswa & kode, aktif/nonaktifkan |

## Teknologi

- **Frontend**: React 18 + Vite 5, Tailwind CSS 3, Lucide React, React Router, supabase-js, Three.js, SVG, CSS animation
- **Backend**: Python + FastAPI (penilaian, XP, lencana, login kode, data guru)
- **Database & Auth**: Supabase (PostgreSQL + Supabase Auth) dengan Row Level Security
- **Android**: Capacitor 6

### Arsitektur singkat

```
Browser / Android (React)
   ├── baca data milik sendiri ──► Supabase (anon key + RLS)
   └── login, jawab soal, main game ──► FastAPI ──► Supabase (service role, hanya di server)
```

- Kunci jawaban (`quiz_questions`) dan ronde permainan (`game_sessions`) **tidak dapat dibaca siswa** (RLS tanpa policy). Semua penilaian dilakukan di server.
- Siswa hanya bisa **membaca** data miliknya; semua penulisan skor/XP/lencana dilakukan backend, sehingga skor tidak dapat dimanipulasi dari frontend.
- XP hanya diberikan untuk peningkatan skor terbaik → refresh atau mengulang tidak menimbun XP.

## Struktur folder

```
.
├── README.md
├── docs/
│   ├── COGNITIVE_LOAD.md        # hasil wawancara → keputusan desain
│   └── TESTING.md               # panduan & status pengujian
├── supabase/
│   ├── migrations/0001_square_adventure_schema.sql   # tabel, index, fungsi, RLS
│   └── seed.sql                 # level, kuis, 72 soal, 5 game, 9 lencana (dibuat otomatis)
├── backend/
│   ├── .env.example
│   ├── requirements.txt / requirements-dev.txt
│   ├── app/
│   │   ├── main.py              # aplikasi FastAPI
│   │   ├── config.py, deps.py
│   │   ├── auth_provider.py     # Supabase Auth (GoTrue)
│   │   ├── repository.py        # akses data Supabase (PostgREST)
│   │   ├── content/             # bank soal & katalog (sumber seed)
│   │   ├── services/            # grading, games, gamification, accounts
│   │   └── routers/             # auth, lessons, quizzes, games, admin
│   ├── scripts/
│   │   ├── generate_seed.py     # membuat supabase/seed.sql
│   │   └── create_user.py       # membuat akun guru/siswa dari terminal
│   └── tests/                   # 81 test pytest
└── frontend/
    ├── .env.example
    ├── capacitor.config.json
    ├── android/                 # proyek Android (Capacitor)
    └── src/
        ├── pages/               # Landing, Login, Dashboard, AdventureMap, Lesson, Laboratory,
        │                        # Training, Playground, GamePage, FinalChallenge, Achievements,
        │                        # Profile, History, TeacherStudents, NotFound
        ├── components/          # AppShell, Kubi, SquareGrid, MapPath, quiz/, games/, lesson/, lab/
        ├── context/             # Auth, Progress, Toast
        ├── content/             # konten materi & info permainan
        └── lib/                 # supabase, api, squares (matematika), levels
```

---

## Cara cepat memakai aplikasi

> Langkah sekali saja: buat proyek Supabase dan isi database (Instalasi langkah 1–2), lalu isi `backend/.env` (langkah 3) dan buat akun guru (langkah 4).

**Laptop** — klik dua kali **`MULAI-SQUARE-ADVENTURE.bat`**. Server berjalan dan browser terbuka di <http://localhost:8000>. Backend sekaligus menyajikan tampilan aplikasi, jadi tidak perlu Node.js untuk memakai.

**HP Android** — pasang **`SquareAdventure.apk`** (izinkan "instal dari sumber tidak dikenal"). Saat pertama dibuka, layar **Pengaturan Server** muncul:

| Kolom | Isi |
|---|---|
| Supabase Project URL | `https://xxxx.supabase.co` |
| Supabase anon key | anon / publishable key (bukan service role) |
| Alamat backend | `http://IP-LAPTOP:8000` (ditampilkan di jendela `MULAI-SQUARE-ADVENTURE.bat`; HP & laptop di Wi-Fi yang sama) atau URL HTTPS backend yang sudah di-deploy |

Tekan **Tes koneksi**, lalu **Simpan**. Pengaturan bisa diubah lagi lewat tautan *Pengaturan Server* di halaman masuk. HP juga bisa langsung membuka `http://IP-LAPTOP:8000` di browser tanpa memasang APK.

> Jika HP tidak bisa terhubung ke laptop, izinkan Python melalui Windows Firewall (jaringan *Private*) saat diminta.

## Instalasi

Prasyarat: **Node.js 20+** dan **Python 3.11+**.

### 1. Membuat proyek Supabase

1. Daftar/masuk di <https://supabase.com> → **New project**. Simpan password database.
2. Buka **Project Settings → API**, catat:
   - Project URL → `SUPABASE_URL` / `VITE_SUPABASE_URL`
   - anon / publishable key → `SUPABASE_ANON_KEY` / `VITE_SUPABASE_ANON_KEY`
   - service_role / secret key → `SUPABASE_SERVICE_ROLE_KEY` (**hanya** untuk backend)
3. **Authentication → Sign In / Providers → Email**: pastikan provider Email aktif. (Akun siswa dibuat backend dengan email internal yang sudah dikonfirmasi; tidak ada email yang dikirim.)

### 2. Migrasi database

Cara termudah — Supabase **SQL Editor**:

1. Tempel dan jalankan isi `supabase/migrations/0001_square_adventure_schema.sql`.
2. Tempel dan jalankan isi `supabase/seed.sql`.

Atau dengan Supabase CLI: `supabase link --project-ref <ref>` lalu `supabase db push`, kemudian jalankan `seed.sql` di SQL Editor.

Jika bank soal di `backend/app/content/questions.py` diubah, buat ulang seed: `python -m scripts.generate_seed` (dari folder `backend`), lalu jalankan lagi `seed.sql` (aman diulang).

### 3. Backend (FastAPI)

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate            # Windows   (macOS/Linux: source .venv/bin/activate)
pip install -r requirements-dev.txt
copy .env.example .env            # macOS/Linux: cp .env.example .env
```

Isi `backend/.env` (lihat komentar di dalamnya). Buat `STUDENT_PASSWORD_SECRET` acak:

```bash
python -c "import secrets;print(secrets.token_urlsafe(48))"
```

> Jangan ubah `STUDENT_PASSWORD_SECRET` setelah siswa didaftarkan, karena password akun Supabase diturunkan dari rahasia ini.

Jalankan:

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Cek <http://localhost:8000/api/health> → `"configured": true`. Dokumentasi API: <http://localhost:8000/docs>.

### 4. Membuat akun guru dan siswa

```bash
# dari folder backend, venv aktif
python -m scripts.create_user --name "Nama Guru" --role teacher --code GURU-01
python -m scripts.create_user --name "Ajeng" --class 9A --code SA-9A-001
```

Setelah ada akun guru, siswa lain bisa ditambahkan dari aplikasi: login dengan kode guru → menu ☰ → **Data Siswa**. Kode: 4–20 karakter (huruf kapital, angka, `-`); jika dikosongkan dibuat otomatis (mis. `SA-7KQ2MX`).

### 5. Frontend (laptop)

```bash
cd frontend
npm install
copy .env.example .env            # isi VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_API_URL
npm run dev
```

Buka <http://localhost:5173>. Untuk versi produksi: `npm run build` lalu `npm run preview`, atau unggah folder `dist/` ke hosting statis (aplikasi memakai HashRouter sehingga tidak perlu aturan rewrite).

### 6. Android (Capacitor)

Prasyarat: **Android Studio** (beserta Android SDK & JDK 17).

APK debug siap pakai sudah tersedia: **`SquareAdventure.apk`** di folder utama. Alamat server diatur dari dalam aplikasi (lihat *Cara cepat*), jadi APK tidak perlu dibuild ulang ketika kredensial berubah.

- Backend dapat berupa laptop di Wi-Fi yang sama (`http://IP-LAPTOP:8000`) atau FastAPI yang di-deploy dengan HTTPS (Render, Railway, Fly.io, VPS). Supabase bukan hosting FastAPI.
- `capacitor.config.json` memakai `androidScheme: "http"` dan `cleartext: true` agar backend HTTP di jaringan lokal dapat dihubungi. Untuk rilis publik dengan backend HTTPS, sebaiknya ubah ke `"androidScheme": "https"` dan hapus `cleartext`.

Membangun ulang APK (Android Studio, atau JDK 17 + Android SDK 34):

```bash
cd frontend
npm run cap:sync                      # vite build + cap sync android
cd android && gradlew assembleDebug   # hasil: android/app/build/outputs/apk/debug/app-debug.apk
# atau: npm run cap:open → Android Studio → Build → Build APK(s)
```

Untuk rilis Play Store gunakan **Build → Generate Signed App Bundle** di Android Studio.

### 7. Deploy backend HTTPS (Render.com)

Web di GitHub Pages memakai HTTPS, sehingga backend juga harus HTTPS.

1. Masuk ke <https://render.com> dengan akun GitHub → **New → Blueprint** → pilih repo `square-adventure`.
2. Render membaca `render.yaml`. Isi `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, dan `STUDENT_PASSWORD_SECRET` (sama persis dengan `backend/.env` di laptop agar akun siswa tetap bisa login).
3. Setelah aktif, buka `https://<nama-service>.onrender.com/api/health` → `"configured": true`.
4. Buka web aplikasi → *Pengaturan Server* → isi alamat backend `https://<nama-service>.onrender.com` → **Tes koneksi** → **Simpan**.

> Paket gratis Render "tertidur" saat tidak dipakai; permintaan pertama bisa butuh ±1 menit.

## Pengujian

```bash
cd backend && .venv\Scripts\python -m pytest -q     # 81 test
cd frontend && npm test && npm run build            # 32 test + build
```

Status lengkap (termasuk apa yang **belum** diuji) ada di [docs/TESTING.md](docs/TESTING.md).

## Keamanan

- Service role key hanya di `backend/.env`; frontend hanya memakai anon key.
- RLS aktif di semua tabel; siswa hanya dapat membaca baris miliknya.
- Kunci jawaban & ronde permainan hanya dapat dibaca backend.
- Validasi input di frontend dan backend; rate limit login; penilaian & XP di server.
- File `.env` tidak boleh di-commit (sudah ada di `.gitignore`).

## Materi (ringkas)

Pola bilangan persegi: 1, 4, 9, 16, 25, 36, … Suku ke-n berbentuk persegi n × n, sehingga **Uₙ = n²**. Selisih antarsuku 3, 5, 7, 9, … karena memperbesar persegi (n−1) × (n−1) menjadi n × n menambah 2n − 1 kotak.
