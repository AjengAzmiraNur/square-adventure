# SQUARE ADVENTURE — Penerapan Cognitive Load

Sumber: *Laporan Analisis Kebutuhan Pembelajaran Matematika — Analisis Beban Kognitif Siswa pada Materi Pola Bilangan Persegi* (Ajeng Azmira Nur, 2026). Wawancara tatap muka, Jumat 6 November 2026, informan **S01** (siswa kelas IX SMP Negeri 1 Warunggunung).

Dokumen ini membedakan dua hal:

- **Temuan wawancara (TW)** — hal yang benar-benar disampaikan informan (Lampiran "Ringkasan hasil Wawancara") atau disimpulkan laporan pada Bab IV.
- **Rekomendasi desain (RD)** — keputusan desain yang **tidak** berasal dari jawaban informan, melainkan dari landasan teori laporan (Bab II), master prompt, atau praktik desain umum.

## Catatan tentang sumber

1. Wawancara hanya melibatkan **satu informan (S01)**. Temuan menggambarkan kebutuhan satu siswa, bukan seluruh siswa (laporan sendiri menyarankan melibatkan lebih banyak siswa, Bab 5.2).
2. Bab IV laporan memakai frasa "Berdasarkan **contoh** jawaban informan". Mohon pastikan bahwa jawaban di Lampiran adalah jawaban nyata S01.
3. Paragraf penutup Lampiran menyebut materi **"Sistem Persamaan Linear Dua Variabel (SPLDV)"**. Ini tidak sesuai dengan topik laporan (pola bilangan persegi) dan tampaknya salah tempel; isi tersebut **tidak dipakai** dalam perancangan.

## Temuan wawancara → keputusan desain

| # | Temuan wawancara (kutipan Lampiran) | Aspek | Keputusan desain di aplikasi |
|---|---|---|---|
| 1 | "Pola bilangan persegi itu susunan angka yang berasal dari perkalian angka dengan angka itu sendiri. Contohnya 1, 4, 9, 16, dan 25." | Intrinsic | Siswa sudah punya dasar → Level 01 singkat dan langsung visual; fokus dipindah ke hubungan gambar–bilangan dan makna n. |
| 2 | "Yang paling sulit itu menentukan angka berikutnya dan mencari rumusnya … angka yang ditambahkan selalu berbeda." | Intrinsic | Level 02 khusus selisih (3, 5, 7, …) dengan ilustrasi kotak tambahan berbentuk L yang menjelaskan *mengapa* selisih bertambah 2; permainan *Complete the Pattern* dan *Find the Next Number*. |
| 3 | "Saya melihat selisih dari angka sebelumnya … selisihnya bertambah 2." | Intrinsic/Germane | Strategi selisih milik siswa dipakai sebagai jembatan sebelum rumus (Level 02 → Level 03), bukan diganti. |
| 4 | "Lumayan mudah kalau sudah diberikan contoh … Tapi kalau belum ada contoh, saya masih sedikit bingung." | Intrinsic | Setiap level memuat contoh soal dengan **penyelesaian bertahap yang dibuka satu langkah per klik** sebelum latihan. |
| 5 | "Kalau guru menjelaskan terlalu cepat saya suka ketinggalan … lebih mudah mengerti kalau … langkah demi langkah." | Extraneous | Materi dipecah menjadi 8 layar (satu bagian per layar), siswa mengatur kecepatannya sendiri dengan tombol Lanjut/Sebelumnya; pembahasan selalu berbentuk langkah bernomor. |
| 6 | "Saya lebih suka kalau ada gambar persegi, tabel, dan contoh soal." | Extraneous/Germane | Visual SVG susunan kotak di setiap level, tabel contoh bilangan, Square Laboratory (visualisasi, builder, tabel, kalkulator). |
| 7 | "Latihan soal dari yang mudah sampai yang sulit … ada pembahasan jawaban supaya kalau salah, saya bisa tahu letak kesalahan." | Germane | Training Zone 3 tingkat (Beginner → Intermediate → Expert); salah pertama → petunjuk, salah kedua → pembahasan langkah demi langkah; Final Challenge menampilkan pembahasan per soal. |
| 8 | Bab 4.2: siswa "terkadang bingung menentukan nilai n yang harus dimasukkan ke dalam rumus". | Intrinsic | Level 03 menyamakan *n = nomor suku = panjang sisi*; soal "suku ke berapa?" dan pengecoh n × 2 (TE-08, FC-14) dengan pembahasan khusus. |
| 9 | Bab 4.2: sulit "jika bentuk soal berbeda dari contoh yang diberikan oleh guru". | Intrinsic | Variasi bentuk soal: pilihan ganda, benar/salah, isian, melengkapi pola, memilih susunan, soal cerita; permainan membuat soal acak baru setiap main. |

## Rekomendasi desain (bukan temuan wawancara)

| Rekomendasi | Dasar |
|---|---|
| Karakter pendamping *Kubi* yang memberi sapaan, petunjuk, dan apresiasi | Master prompt (bagian 14) |
| XP, level, bintang, lencana | Master prompt (bagian 13) — wawancara tidak membahas gamifikasi |
| Lima permainan edukatif | Master prompt (bagian 11) |
| "Satu langkah per tampilan", tampilan bersih, simbol konsisten | Laporan Bab 2.10 & 4.5 (arah rancangan dari teori) |
| Kolom "Tuliskan alasanmu" pada soal cerita/Expert | Master prompt (bagian 16, Literasi Matematis) & laporan Bab 2.9 (menjelaskan alasan) |
| Visualisasi 3D Three.js (Menara 3D) | Master prompt (bagian 18); dibuat **opsional** di tab terpisah agar tidak menambah beban ekstrane |
| Mengurangi animasi; menghormati `prefers-reduced-motion` | Master prompt (bagian 15B) |
| Final Challenge terkunci sampai 4 level selesai | Urutan intrinsic load (bagian 15A): evaluasi setelah seluruh materi |

## Ringkasan penerapan tiga aspek

- **Intrinsic** — urutan: bentuk persegi → menghitung kotak → urutan bilangan → selisih/suku berikutnya → rumus Uₙ = n² → penerapan. Level berikutnya terbuka setelah level sebelumnya selesai; rumus tidak pernah diberikan sebelum alasannya divisualkan.
- **Extraneous** — satu bagian per layar, instruksi pendek, bahasa sederhana, navigasi tetap (bawah di HP, atas di laptop), panel konten berlatar terang untuk membaca, animasi lembut dan singkat.
- **Germane** — contoh bertahap, latihan singkat di setiap level, petunjuk saat salah, pembahasan setelah menjawab, ajakan menuliskan alasan, eksplorasi mandiri di laboratorium.
