// Konten materi SQUARE ADVENTURE. Disusun bertahap (gambar → tabel → rumus) dan
// dipecah menjadi langkah-langkah pendek agar beban kognitif tetap ringan.

export const LESSON_CONTENT = {
  'kenali-polanya': {
    level: 1,
    title: 'Mengenal Pola Bilangan Persegi',
    greeting: 'Hai, petualang! Yuk, kita amati bagaimana kotak-kotak ini membentuk sebuah persegi.',
    goals: [
      'Menjelaskan pengertian pola bilangan.',
      'Mengenali bentuk susunan persegi 1 × 1, 2 × 2, 3 × 3, dan seterusnya.',
      'Menghubungkan banyak kotak pada susunan persegi dengan bilangan persegi.',
    ],
    concept: [
      { term: 'Pola bilangan', text: 'Susunan bilangan yang mengikuti aturan tertentu. Contoh: 2, 4, 6, 8, ... (aturannya: tambah 2).' },
      { term: 'Pola bilangan persegi', text: 'Pola yang banyak bendanya selalu dapat disusun membentuk persegi.' },
      { term: 'Bilangan persegi', text: 'Bilangan yang diperoleh dari mengalikan bilangan asli dengan dirinya sendiri, misalnya 3 × 3 = 9.' },
    ],
    illustration: 'count',
    illustrationNote: 'Ubah nomor susunan dan amati: banyak baris selalu sama dengan banyak kolom.',
    examples: {
      head: ['Susunan ke-', 'Bentuk', 'Banyak kotak'],
      rows: [
        ['1', '1 × 1', '1'],
        ['2', '2 × 2', '4'],
        ['3', '3 × 3', '9'],
        ['4', '4 × 4', '16'],
        ['5', '5 × 5', '25'],
        ['6', '6 × 6', '36'],
      ],
      note: 'Jadi, pola bilangan persegi adalah 1, 4, 9, 16, 25, 36, ...',
    },
    steps: [
      'Amati gambar susunan kotaknya.',
      'Hitung banyak baris dan banyak kotak di setiap baris.',
      'Pastikan baris dan kolomnya sama banyak (bentuknya persegi).',
      'Kalikan banyak baris dengan banyak kolom.',
    ],
    worked: {
      problem: 'Sebuah susunan persegi memiliki 4 kotak di setiap barisnya. Berapa banyak kotak pada susunan itu?',
      steps: [
        'Diketahui: setiap baris berisi 4 kotak, dan karena bentuknya persegi, banyak barisnya juga 4.',
        'Ditanya: banyak kotak seluruhnya.',
        'Jawab: 4 baris × 4 kotak = 16 kotak.',
        'Jadi, susunan itu berisi 16 kotak. Angka 16 adalah bilangan persegi.',
      ],
    },
    summary: [
      'Pola bilangan persegi: 1, 4, 9, 16, 25, 36, ...',
      'Setiap bilangannya dapat disusun menjadi persegi (baris = kolom).',
      'Banyak kotak = banyak baris × banyak kolom.',
    ],
  },

  'lengkapi-pola': {
    level: 2,
    title: 'Menentukan Suku Berikutnya',
    greeting: 'Perhatikan susunan kotaknya. Menurutmu, angka berapa yang akan muncul berikutnya?',
    goals: [
      'Mengamati urutan bilangan persegi.',
      'Menemukan hubungan (selisih) antarbilangan.',
      'Menentukan suku berikutnya dari pola bilangan persegi.',
    ],
    concept: [
      { term: 'Suku', text: 'Setiap bilangan dalam pola. Pada 1, 4, 9, 16, ... suku pertama adalah 1, suku kedua 4, dan seterusnya.' },
      { term: 'Selisih', text: 'Hasil pengurangan suatu suku dengan suku sebelumnya. Contoh: 9 − 4 = 5.' },
      { term: 'Selisih bertambah 2', text: 'Pada pola persegi, selisihnya 3, 5, 7, 9, ... selalu bertambah 2.' },
    ],
    illustration: 'difference',
    illustrationNote: 'Kotak kuning menunjukkan kotak tambahan dari susunan sebelumnya.',
    examples: {
      head: ['Suku', 'Bilangan', 'Selisih dari suku sebelumnya'],
      rows: [
        ['ke-1', '1', '—'],
        ['ke-2', '4', '4 − 1 = 3'],
        ['ke-3', '9', '9 − 4 = 5'],
        ['ke-4', '16', '16 − 9 = 7'],
        ['ke-5', '25', '25 − 16 = 9'],
        ['ke-6', '36', '36 − 25 = 11'],
      ],
      note: 'Selisih: 3, 5, 7, 9, 11, ... (bilangan ganjil berurutan).',
    },
    steps: [
      'Tuliskan suku-suku yang diketahui.',
      'Hitung selisih setiap dua suku yang berdekatan.',
      'Temukan aturan selisihnya (bertambah 2).',
      'Tambahkan selisih berikutnya ke suku terakhir.',
      'Periksa: apakah hasilnya bisa ditulis n × n?',
    ],
    worked: {
      problem: 'Tentukan dua bilangan berikutnya dari pola 1, 4, 9, 16, ...',
      steps: [
        'Selisih antarsuku: 4 − 1 = 3, 9 − 4 = 5, 16 − 9 = 7.',
        'Selisihnya bertambah 2, jadi selisih berikutnya 9, lalu 11.',
        '16 + 9 = 25, dan 25 + 11 = 36.',
        'Periksa: 25 = 5 × 5 dan 36 = 6 × 6. Jadi, dua bilangan berikutnya adalah 25 dan 36.',
      ],
    },
    summary: [
      'Selisih antarsuku pola persegi: 3, 5, 7, 9, ... (bertambah 2).',
      'Suku berikutnya = suku terakhir + selisih berikutnya.',
      'Selalu periksa: hasilnya harus bilangan persegi (n × n).',
    ],
  },

  'temukan-rumus': {
    level: 3,
    title: 'Rumus Pola Bilangan Persegi',
    greeting: 'Sekarang kita cari jalan pintas: bagaimana menemukan suku ke-100 tanpa menghitung satu per satu?',
    goals: [
      'Menghubungkan nomor suku dengan panjang sisi persegi.',
      'Menemukan sendiri rumus Uₙ = n².',
      'Menggunakan rumus untuk menentukan suku ke-n dan nomor suku.',
    ],
    concept: [
      { term: 'n (nomor suku)', text: 'Urutan suku: 1, 2, 3, ... Pada gambar, n sama dengan banyak kotak di setiap sisi persegi.' },
      { term: 'Uₙ (nilai suku ke-n)', text: 'Banyak kotak pada susunan ke-n.' },
      { term: 'Mengapa n²?', text: 'Susunan ke-n berbentuk persegi n baris × n kolom, jadi banyak kotaknya n × n = n².' },
    ],
    illustration: 'formula',
    illustrationNote: 'Perhatikan: nomor suku selalu sama dengan panjang sisi perseginya.',
    examples: {
      head: ['Nomor suku (n)', 'Bentuk perkalian', 'Uₙ'],
      rows: [
        ['1', '1 × 1 = 1²', '1'],
        ['2', '2 × 2 = 2²', '4'],
        ['3', '3 × 3 = 3²', '9'],
        ['4', '4 × 4 = 4²', '16'],
        ['5', '5 × 5 = 5²', '25'],
        ['6', '6 × 6 = 6²', '36'],
      ],
      note: 'Polanya selalu: Uₙ = n × n = n².',
    },
    steps: [
      'Tentukan nomor suku yang ditanyakan (n).',
      'Ingat: suku ke-n berbentuk persegi n × n.',
      'Gunakan rumus Uₙ = n².',
      'Hitung n × n (bukan n × 2!).',
      'Untuk mencari n dari nilai suku, cari bilangan yang jika dikalikan dirinya sendiri menghasilkan nilai itu.',
    ],
    worked: {
      problem: 'Tentukan suku ke-6 pola bilangan persegi. Lalu, 81 adalah suku ke berapa?',
      steps: [
        'Suku ke-6 berarti n = 6.',
        'U₆ = 6² = 6 × 6 = 36. Jadi, suku ke-6 adalah 36.',
        'Untuk 81: cari n sehingga n × n = 81.',
        '9 × 9 = 81, jadi n = 9. Artinya, 81 adalah suku ke-9.',
      ],
    },
    summary: [
      'Rumus pola bilangan persegi: Uₙ = n².',
      'n = nomor suku = panjang sisi persegi; Uₙ = banyak kotak.',
      'n² artinya n × n, bukan n × 2.',
    ],
  },

  'tantangan-matematika': {
    level: 4,
    title: 'Penerapan Pola Bilangan Persegi',
    greeting: 'Pola persegi ada di sekitar kita: ubin, kursi, tanaman, lampu. Ayo pecahkan masalahnya!',
    goals: [
      'Mengenali pola bilangan persegi dalam kehidupan sehari-hari.',
      'Mengidentifikasi informasi penting dari soal cerita.',
      'Menggunakan rumus untuk menyelesaikan masalah dan menafsirkan hasilnya.',
    ],
    concept: [
      { term: 'Soal cerita', text: 'Masalah sehari-hari yang perlu diubah menjadi bentuk matematika.' },
      { term: 'Diketahui – Ditanya – Jawab', text: 'Tulis informasi yang diketahui, apa yang ditanyakan, lalu selesaikan langkah demi langkah.' },
      { term: 'Tafsirkan hasil', text: 'Akhiri dengan kalimat kesimpulan beserta satuannya, misalnya “Jadi, diperlukan 49 ubin.”' },
    ],
    illustration: 'context',
    illustrationNote: 'Pilih konteks dan ubah ukuran sisinya. Rumusnya tetap sama: sisi × sisi.',
    examples: {
      head: ['Konteks', 'Informasi', 'Perhitungan'],
      rows: [
        ['Ubin lantai', '7 ubin tiap sisi', '7 × 7 = 49 ubin'],
        ['Kursi aula', 'Total 100 kursi, persegi', '10 × 10 = 100 → 10 kursi per baris'],
        ['Tanaman', 'Susunan ke-6', 'U₆ = 6² = 36 tanaman'],
        ['Lampu hias', 'Susunan ke-12', 'U₁₂ = 12² = 144 lampu'],
      ],
      note: 'Kuncinya: kenali bahwa susunannya berbentuk persegi.',
    },
    steps: [
      'Baca soal dengan teliti, cari kata kunci “persegi” atau pola 1, 4, 9, ...',
      'Diketahui: tulis informasi penting (sisi, nomor susunan, atau total benda).',
      'Ditanya: tentukan apa yang dicari (Uₙ atau n).',
      'Jawab: gunakan Uₙ = n² atau cari n dari n × n.',
      'Simpulkan jawaban dengan kalimat dan satuannya.',
    ],
    worked: {
      problem:
        'Sebuah taman memiliki tanaman yang disusun membentuk persegi. Susunan pertama ada 1 tanaman, susunan kedua 4 tanaman, dan susunan ketiga 9 tanaman. Tentukan banyak tanaman pada susunan ke-6.',
      steps: [
        'Diketahui: banyak tanaman 1, 4, 9, ... → ini pola bilangan persegi.',
        'Ditanya: banyak tanaman pada susunan ke-6, yaitu U₆.',
        'Jawab: U₆ = 6² = 6 × 6 = 36.',
        'Jadi, banyak tanaman pada susunan ke-6 adalah 36 tanaman.',
      ],
    },
    summary: [
      'Banyak benda pada susunan persegi = sisi × sisi.',
      'Gunakan langkah Diketahui – Ditanya – Jawab – Kesimpulan.',
      'Jika diketahui totalnya, cari sisinya dengan mencari n × n = total.',
    ],
  },
}

export const LESSON_ORDER = ['kenali-polanya', 'lengkapi-pola', 'temukan-rumus', 'tantangan-matematika']
