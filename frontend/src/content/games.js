export const GAME_META = {
  'square-hunter': {
    title: 'Square Hunter',
    tagline: 'Berburu susunan persegi',
    intro: 'Di antara banyak susunan kotak, hanya beberapa yang benar-benar persegi. Bisakah kamu menemukan semuanya?',
    howTo: 'Ketuk semua kartu susunan yang berbentuk persegi, lalu tekan "Periksa pilihan".',
    rules: [
      '5 ronde, setiap ronde berisi 6 susunan kotak.',
      'Pilih SEMUA susunan persegi — jawaban dianggap benar jika pilihanmu tepat dan lengkap.',
      'Setiap ronde benar bernilai 20 poin. Hanya ada satu kesempatan per ronde.',
      'Hati-hati: ada susunan yang jumlah kotaknya bilangan persegi, tetapi bentuknya bukan persegi!',
    ],
  },
  'complete-pattern': {
    title: 'Complete the Pattern',
    tagline: 'Isi kotak yang hilang',
    intro: 'Beberapa bilangan dalam pola persegi hilang tertiup angin. Bantu aku mengembalikannya!',
    howTo: 'Ketik bilangan yang tepat di setiap kotak kosong, lalu tekan "Periksa".',
    rules: [
      '5 ronde, makin lama makin banyak kotak kosong.',
      'Benar pada percobaan pertama = 20 poin, setelah petunjuk = 10 poin.',
      'Jika salah dua kali, pembahasan akan ditampilkan.',
    ],
  },
  'next-number': {
    title: 'Find the Next Number',
    tagline: 'Adu cepat menebak bilangan',
    intro: 'Waktu terus berjalan! Tebak bilangan berikutnya secepat dan setepat mungkin.',
    howTo: 'Lihat deretnya, ketik bilangan berikutnya, tekan Enter atau "Jawab". Soal berikutnya langsung muncul.',
    rules: ['8 soal dalam 60 detik.', 'Setiap jawaban benar bernilai 10 poin.', 'Satu kesempatan per soal. Pembahasan singkat muncul setelah menjawab.'],
    difficulties: [
      { value: 'mudah', label: 'Mudah', text: 'Pola persegi berurutan dari bilangan kecil.' },
      { value: 'sedang', label: 'Sedang', text: 'Bilangan lebih besar dan pola menurun.' },
      { value: 'sulit', label: 'Sulit', text: 'Kuadrat bilangan genap/ganjil dan pola n² ± 1.' },
    ],
  },
  'formula-challenge': {
    title: 'Square Formula Challenge',
    tagline: 'Bangun & hitung dengan Uₙ = n²',
    intro: 'Saatnya memakai rumus Uₙ = n²! Ada tahap menghitung, membangun persegi, dan mencari n.',
    howTo: 'Tahap "Hitung": ketik nilai Uₙ. Tahap "Bangun": atur sisi persegi sampai jumlah kotaknya sama dengan target. Tahap "Cari n": tentukan nomor sukunya.',
    rules: ['6 tahap bertingkat, total 100 poin.', 'Dua kesempatan di setiap tahap; percobaan kedua bernilai setengah.', 'Pembahasan ditampilkan di akhir setiap tahap.'],
  },
  'adventure-quest': {
    title: 'Square Adventure Quest',
    tagline: 'Buka 5 gerbang menuju kastel',
    intro: 'Jalan menuju Kastel Persegi dijaga 5 gerbang. Setiap gerbang terbuka jika kamu memecahkan masalah persegi di dalamnya!',
    howTo: 'Baca ceritanya, tentukan informasi penting, lalu ketik jawabanmu. Gunakan tombol petunjuk jika kesulitan.',
    rules: [
      '5 gerbang, masing-masing 20 poin.',
      'Petunjuk sukarela mengurangi poin gerbang 25%.',
      'Jika salah, Kubi memberi petunjuk dan kamu boleh mencoba sekali lagi (poin setengah).',
    ],
  },
}

export const GAME_ORDER = ['square-hunter', 'complete-pattern', 'next-number', 'formula-challenge', 'adventure-quest']
