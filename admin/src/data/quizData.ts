export interface QuizQuestionMetadata {
  id: number;
  fileName: string;
  category: string;
  title: string;
  type: string;
  question: string;
  correctAnswer: any;
  unit?: string;
}

export const QUIZ_QUESTIONS: QuizQuestionMetadata[] = [
  {
    id: 1,
    fileName: 'soal_1.exe',
    category: 'PILIHAN GANDA',
    title: 'KASUS #01: Bola Berwarna dalam Kantong Misterius',
    type: 'multiple-choice',
    question: 'Sebuah kantong berisi 4 bola merah, 3 bola kuning, dan 3 bola hijau. Diambil dua bola sekaligus secara acak. Peluang terambilnya dua bola berwarna beda adalah ...',
    correctAnswer: 'C',
  },
  {
    id: 2,
    fileName: 'soal_2.exe',
    category: 'PILIHAN GANDA',
    title: 'KASUS #02: Pelemparan Sepasang Dadu Cyber',
    type: 'multiple-choice',
    question: 'Dua buah dadu adil bermata 6 dilempar bersama-sama satu kali. Peluang munculnya mata dadu pertama ganjil dan jumlah kedua mata dadu bernilai genap adalah ...',
    correctAnswer: 'A',
  },
  {
    id: 3,
    fileName: 'soal_3.exe',
    category: 'PILIHAN GANDA',
    title: 'KASUS #03: Frekuensi Harapan Tiga Koin',
    type: 'multiple-choice',
    question: 'Tiga buah koin adil dilempar bersama-sama sebanyak 160 kali. Frekuensi harapan munculnya paling banyak satu sisi gambar adalah ...',
    correctAnswer: 'B',
  },
  {
    id: 4,
    fileName: 'soal_4.exe',
    category: 'PILIHAN GANDA',
    title: 'KASUS #04: Kombinasi Kode Ratusan Rahasia',
    type: 'multiple-choice',
    question: 'Dari angka-angka 1, 2, 3, 4, 6, dan 7 akan disusun bilangan ratusan kurang dari 400 tanpa angka berulang. Peluang bilangan yang terambil habis dibagi 2 adalah ...',
    correctAnswer: 'C',
  },
  {
    id: 5,
    fileName: 'soal_5.exe',
    category: 'PILIHAN GANDA KOMPLEKS',
    title: 'KASUS #05: Audit Multi-Klaim Tiga Koin',
    type: 'complex-mc',
    question: 'Tiga koin adil dilempar secara bersamaan satu kali. Manakah pernyataan yang benar? Pilih semua pernyataan yang benar.',
    correctAnswer: ['A', 'B', 'C'],
  },
  {
    id: 6,
    fileName: 'soal_6.exe',
    category: 'PILIHAN GANDA KOMPLEKS',
    title: 'KASUS #06: Verifikasi Pernyataan Dua Dadu',
    type: 'complex-mc',
    question: 'Dua buah dadu dilempar bersamaan satu kali. Tentukan semua pernyataan peluang yang benar.',
    correctAnswer: ['A', 'B', 'C'],
  },
  {
    id: 7,
    fileName: 'soal_7.exe',
    category: 'MENJODOHKAN',
    title: 'KASUS #07: Menghubungkan Teori Dasar Peluang',
    type: 'matching',
    question: 'Pasangkan istilah atau konsep dasar peluang pada Kolom A dengan bentuk, rumus, atau deskripsi yang sesuai pada Kolom B.',
    correctAnswer: { '1': 'E', '2': 'D', '3': 'A', '4': 'C', '5': 'B' },
  },
  {
    id: 8,
    fileName: 'soal_8.exe',
    category: 'MENJODOHKAN',
    title: 'KASUS #08: Rekonstruksi Nilai Peluang Kejadian',
    type: 'matching',
    question: 'Pasangkan pelemparan pada Kolom A dengan nilai peluang yang sesuai pada Kolom B.',
    correctAnswer: { '1': 'B', '2': 'A', '3': 'E', '4': 'C', '5': 'D' },
  },
  {
    id: 9,
    fileName: 'soal_9.exe',
    category: 'ISIAN SINGKAT',
    title: 'KASUS #09: Teka-Teki Kelereng Biru Tersembunyi',
    type: 'short-answer',
    question: 'Dalam wadah terdapat 8 kelereng merah dan y kelereng biru. Jika peluang terambil kelereng biru adalah 3/5, banyak kelereng biru adalah ...',
    correctAnswer: '12',
    unit: 'kelereng',
  },
  {
    id: 10,
    fileName: 'soal_10.exe',
    category: 'ISIAN SINGKAT',
    title: 'KASUS #10: Estimasi Korban Tryout Ujian Sekolah',
    type: 'short-answer',
    question: 'Peluang seorang siswa lulus tryout adalah 0,85. Jika 200 siswa mengikuti tryout, perkiraan banyak siswa yang tidak lulus adalah ...',
    correctAnswer: '30',
    unit: 'siswa',
  },
];
