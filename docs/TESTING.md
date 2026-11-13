# SQUARE ADVENTURE — Panduan & Status Pengujian

## Cara menjalankan pengujian otomatis

```bash
# Backend (dari folder backend)
.venv\Scripts\python -m pytest -q          # Windows
.venv/bin/python -m pytest -q              # macOS/Linux

# Frontend (dari folder frontend)
npm test          # unit test matematika + smoke test render
npm run build     # memastikan build produksi bebas error
```

## Yang sudah diuji otomatis (dijalankan 13 November 2026)

**Backend — 81 test lulus** (`pytest`). Menggunakan repositori in-memory dan auth tiruan yang **hanya ada di folder `tests/`**; aplikasi sungguhan selalu memakai Supabase.

| Area | Yang diuji |
|---|---|
| Konten | Setiap jawaban isian angka dihitung ulang secara independen; soal benar/salah dicek ulang; deret pada soal pola adalah bilangan persegi berurutan; indeks pilihan valid; kode soal unik |
| Autentikasi | Login kode valid, kode tidak terdaftar (401), kosong & format salah (422), akun nonaktif (403), rate limit (429), endpoint privat tanpa/ dengan token palsu (401), backend tanpa konfigurasi (503) |
| Guru | Hanya guru yang dapat membuka data siswa; siswa baru langsung bisa login; kode duplikat ditolak |
| Materi | Level terbuka berurutan; misi butuh latihan singkat; XP misi tidak bisa didapat dua kali |
| Latihan | Kunci/petunjuk/pembahasan tidak dikirim saat soal dimulai; salah → petunjuk; salah lagi → pembahasan; jawaban desimal ditolak; XP hanya untuk peningkatan skor; sesi milik siswa lain tidak bisa diakses |
| Evaluasi | Terkunci sebelum 4 level selesai; jumlah soal 10/15/20; tidak ada umpan balik selama ujian; skor & pembahasan benar; tidak bisa dikirim dua kali; review riwayat |
| Permainan | Generator 5 permainan diuji dengan 40 seed acak; kelima permainan dapat dimainkan sampai skor 100; jawaban salah → 0; ronde harus berurutan; petunjuk mengurangi poin; batas waktu; tidak bisa farming XP |
| Gamifikasi | Ambang level; lencana diberikan sesuai syarat (termasuk Playground Hero) |

**Frontend — 32 test lulus** (`vitest`) dan `vite build` berhasil.

- Utilitas matematika & validasi Formula Calculator (kosong, negatif, desimal, huruf, 0, > 1000).
- Smoke render: Landing, Login, Laboratory, 404, keempat ilustrasi materi, keenam jenis soal, daftar pembahasan, dan kelima permainan.

**Backend dijalankan dengan uvicorn**: `/api/health` merespons, login tanpa konfigurasi memberi pesan 503 yang jelas, preflight CORS dari `capacitor://localhost` = 200.

**Server laptop**: `uvicorn` menyajikan tampilan aplikasi (`/`, bundle JS, favicon → 200) dan API (`/api/health`) dari port yang sama.

**APK Android** (`SquareAdventure.apk`, 3,9 MB) berhasil dibuild dengan Gradle (JDK 17, SDK 34). Diperiksa dengan `aapt`: paket `id.squareadventure.app`, label "SQUARE ADVENTURE", minSdk 22 / targetSdk 34, izin INTERNET, cleartext diizinkan, aset web lengkap.

## Yang BELUM diuji (butuh kredensial / perangkat)

- APK belum dipasang di HP/emulator sungguhan.

Bagian ini **belum** diuji karena proyek Supabase dan perangkat Android belum tersedia saat pengembangan:

- Migrasi SQL & RLS pada proyek Supabase sungguhan.
- Login end-to-end (FastAPI → Supabase Auth → supabase-js) dan pembacaan data dashboard lewat RLS.
- Tampilan di browser nyata (laptop & HP) — layout responsif belum dicek secara visual.
- Build APK Android (butuh Android Studio + JDK).

## Daftar uji manual setelah Supabase dikonfigurasi

1. Login dengan kode valid → masuk dashboard; nama & kode sesuai.
2. Login kode salah / kosong → pesan kesalahan.
3. Buka `#/app` setelah logout → diarahkan ke halaman masuk.
4. Level 02 terkunci sebelum Level 01 selesai; materi bisa dibaca; Latihan Singkat dikerjakan; "Selesaikan misi" → notifikasi XP & lencana.
5. Laboratorium: pilih suku 1–6, slider builder, klik baris tabel, kalkulator (8 → 64; uji -1, 2.5, kosong).
6. Training Zone tiap tingkat: salah sekali → petunjuk; salah dua kali → pembahasan.
7. Mainkan kelima permainan sampai hasil akhir; "Main lagi".
8. Final Challenge (10 soal, dengan timer): navigasi nomor, periksa kembali, kirim, lihat pembahasan, buka lagi dari riwayat.
9. Logout lalu login lagi → XP, lencana, dan riwayat tetap ada.
10. Login sebagai siswa B → tidak ada data siswa A. Coba di Supabase SQL Editor (`set role authenticated`) bahwa `select * from quiz_questions` tidak mengembalikan baris.
11. Cek tampilan di lebar 360 px (HP) dan 1366 px (laptop).
