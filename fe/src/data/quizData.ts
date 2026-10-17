import type { QuizQuestion } from '../types/quiz';

export const QUIZ_QUESTIONS: QuizQuestion[] = [
  // ==========================================
  // BAGIAN 1: PILIHAN GANDA (4 Soal)
  // ==========================================
  {
    id: 1,
    fileName: 'soal_1.exe',
    category: 'PILIHAN GANDA',
    title: 'KASUS #01: Bola Berwarna dalam Kantong Misterius',
    type: 'multiple-choice',
    question:
      'Sebuah kantong berisi $4$ bola merah, $3$ bola kuning, dan $3$ bola hijau. Diambil dua bola sekaligus secara acak dari dalam kantong. Peluang terambilnya dua bola berwarna beda adalah ...',
    options: [
      { key: 'A', label: '$\\frac{2}{15}$' },
      { key: 'B', label: '$\\frac{1}{3}$' },
      { key: 'C', label: '$\\frac{11}{15}$' },
      { key: 'D', label: '$\\frac{4}{5}$' },
    ],
    correctAnswer: 'C',
    explanation: `**Langkah Analisis Forensik Kasus:**
1. **Total Bola:**
   $4 + 3 + 3 = 10$ bola dalam kantong.
2. **Ruang Sampel Pengambilan 2 Bola:**
   $$n(S) = C(10, 2) = \\frac{10 \\times 9}{2 \\times 1} = 45$$
3. **Menggunakan Prinsip Komplemen Peluang ($A'$):**
   $A'$ = Kejadian terambil **dua bola berwarna sama**:
   - $2$ bola Merah dari $4$: $C(4, 2) = \\frac{4 \\times 3}{2 \\times 1} = 6$
   - $2$ bola Kuning dari $3$: $C(3, 2) = 3$
   - $2$ bola Hijau dari $3$: $C(3, 2) = 3$
   $$n(A') = 6 + 3 + 3 = 12$$
4. **Peluang Warna Sama:**
   $$P(A') = \\frac{n(A')}{n(S)} = \\frac{12}{45} = \\frac{4}{15}$$
5. **Peluang Terambil Dua Bola Berwarna Beda:**
   $$P(A) = 1 - P(A') = 1 - \\frac{4}{15} = \\frac{11}{15}$$

**Kesimpulan:** Jawaban yang benar adalah **C**.`,
  },
  {
    id: 2,
    fileName: 'soal_2.exe',
    category: 'PILIHAN GANDA',
    title: 'KASUS #02: Pelemparan Sepasang Dadu Cyber',
    type: 'multiple-choice',
    question:
      'Dua buah dadu adil bermata 6 dilempar undi bersama-sama satu kali. Peluang munculnya mata dadu pertama ganjil DAN jumlah kedua mata dadu bernilai genap adalah ...',
    options: [
      { key: 'A', label: '$\\frac{1}{4}$' },
      { key: 'B', label: '$\\frac{1}{3}$' },
      { key: 'C', label: '$\\frac{1}{2}$' },
      { key: 'D', label: '$\\frac{2}{3}$' },
    ],
    correctAnswer: 'A',
    explanation: `**Langkah Analisis Forensik Kasus:**
1. **Ruang Sampel Dua Dadu:**
   $$n(S) = 6 \\times 6 = 36$$
2. **Kondisi Khusus yang Diminta:**
   - Dadu pertama bernilai **ganjil**: $\\{1, 3, 5\\}$ ($3$ pilihan).
   - Jumlah kedua mata dadu bernilai **genap**. Karena (Ganjil + Ganjil = Genap) dan (Ganjil + Genap = Ganjil), maka dadu kedua **wajib bernilai ganjil**: $\\{1, 3, 5\\}$ ($3$ pilihan).
3. **Banyak Pasangan Terbentuk:**
   $$n(A) = 3 \\times 3 = 9\\text{ pasangan}$$
   Himpunannya:
   $\\{(1,1), (1,3), (1,5), (3,1), (3,3), (3,5), (5,1), (5,3), (5,5)\\}$
4. **Perhitungan Peluang Kejadian:**
   $$P(A) = \\frac{n(A)}{n(S)} = \\frac{9}{36} = \\frac{1}{4}$$

**Kesimpulan:** Jawaban yang benar adalah **A**.`,
  },
  {
    id: 3,
    fileName: 'soal_3.exe',
    category: 'PILIHAN GANDA',
    title: 'KASUS #03: Frekuensi Harapan Tiga Koin',
    type: 'multiple-choice',
    question:
      'Tiga buah koin adil dilempar bersama-sama sebanyak $160$ kali. Frekuensi harapan munculnya paling banyak satu sisi Gambar adalah ...',
    options: [
      { key: 'A', label: '$40\\text{ kali}$' },
      { key: 'B', label: '$80\\text{ kali}$' },
      { key: 'C', label: '$100\\text{ kali}$' },
      { key: 'D', label: '$120\\text{ kali}$' },
    ],
    correctAnswer: 'B',
    explanation: `**Langkah Analisis Forensik Kasus:**
1. **Ruang Sampel 3 Koin:**
   $$n(S) = 2^3 = 8$$
2. **Definisi "Paling Banyak Satu Sisi Gambar":**
   Artinya bisa $0$ Gambar (ketiganya Angka) ATAU $1$ Gambar:
   - $0$ Gambar: $\\{AAA\\} \\rightarrow 1\\text{ titik sampel}$
   - $1$ Gambar: $\\{AAG, AGA, GAA\\} \\rightarrow 3\\text{ titik sampel}$
   $$n(A) = 1 + 3 = 4$$
3. **Peluang Muncul Paling Banyak Satu Gambar:**
   $$P(A) = \\frac{n(A)}{n(S)} = \\frac{4}{8} = \\frac{1}{2}$$
4. **Frekuensi Harapan dengan Percobaan $N = 160$ kali:**
   $$F_h(A) = N \\times P(A) = 160 \\times \\frac{1}{2} = 80\\text{ kali}$$

**Kesimpulan:** Jawaban yang benar adalah **B**.`,
  },
  {
    id: 4,
    fileName: 'soal_4.exe',
    category: 'PILIHAN GANDA',
    title: 'KASUS #04: Kombinasi Kode Ratusan Rahasia',
    type: 'multiple-choice',
    question:
      'Dari angka-angka $1, 2, 3, 4, 6,$ dan $7$ akan disusun bilangan ratusan yang nilainya kurang dari 400 dengan syarat tidak ada angka yang berulang. Jika satu bilangan diambil secara acak, peluang terambilnya bilangan yang habis dibagi 2 adalah ...',
    options: [
      { key: 'A', label: '$\\frac{1}{3}$' },
      { key: 'B', label: '$\\frac{2}{5}$' },
      { key: 'C', label: '$\\frac{8}{15}$' },
      { key: 'D', label: '$\\frac{2}{3}$' },
    ],
    correctAnswer: 'C',
    explanation: `**Langkah Analisis Forensik Kasus:**
1. **Daftar Digit Tersedia:**
   $\\{1, 2, 3, 4, 6, 7\\}$ (total ada 6 angka).
2. **Mencari Ruang Sampel $n(S)$ (Bilangan Ratusan $< 400$):**
   - Angka ratusan harus kurang dari 4: digit $\\{1, 2, 3\\}$ ($3$ pilihan).
   - Angka puluhan: sisa $5$ pilihan.
   - Angka satuan: sisa $4$ pilihan.
   $$n(S) = 3 \\times 5 \\times 4 = 60$$
3. **Mencari Bilangan Genap (Habis Dibagi 2, Berakhiran Genap $\\{2, 4, 6\\}$):**
   - **Kasus Ratusan Ganjil** ($\\{1, 3\\} \\rightarrow 2\\text{ cara}$):
     Satuan genap $\\{2, 4, 6\\}$ ($3$ cara), Puluhan sisa $4$ angka.
     Banyak bilangan $= 2 \\times 4 \\times 3 = 24$.
   - **Kasus Ratusan Genap** ($\\{2\\} \\rightarrow 1\\text{ cara}$):
     Satuan genap sisa $\\{4, 6\\}$ ($2$ cara), Puluhan sisa $4$ angka.
     Banyak bilangan $= 1 \\times 4 \\times 2 = 8$.
   $$n(A) = 24 + 8 = 32$$
4. **Peluang:**
   $$P(A) = \\frac{32}{60} = \\frac{8}{15}$$

**Kesimpulan:** Jawaban yang benar adalah **C**.`,
  },

  // ==========================================
  // BAGIAN 2: PILIHAN GANDA KOMPLEKS (2 Soal)
  // ==========================================
  {
    id: 5,
    fileName: 'soal_5.exe',
    category: 'PILIHAN GANDA KOMPLEKS',
    title: 'KASUS #05: Audit Multi-Klaim Tiga Koin',
    type: 'complex-mc',
    question:
      'Tiga koin adil dilempar secara bersamaan satu kali. Manakah dari pernyataan-pernyataan berikut yang BENAR? *(Pilih semua pernyataan yang benar)*',
    options: [
      { key: 'A', label: 'Banyaknya seluruh anggota ruang sampel $n(S)$ adalah $8$.' },
      { key: 'B', label: 'Peluang munculnya tepat dua sisi Gambar adalah $\\frac{3}{8}$.' },
      { key: 'C', label: 'Peluang komplemen dari kejadian munculnya ketiga sisi Angka adalah $\\frac{7}{8}$.' },
      { key: 'D', label: 'Kejadian munculnya empat sisi Angka merupakan kejadian pasti ($P=1$).' },
    ],
    correctAnswer: ['A', 'B', 'C'],
    explanation: `**Evaluasi Klaim Forensik:**
- **Pernyataan A (BENAR):**
  Untuk pelemparan 3 koin, ruang sampel $n(S) = 2^3 = 8$.
  $S = \\{AAA, AAG, AGA, GAA, AGG, GAG, GGA, GGG\\}$.
- **Pernyataan B (BENAR):**
  Kejadian tepat dua sisi Gambar: $\\{AGG, GAG, GGA\\}$ ada $3$ titik sampel.
  Maka peluangnya $= \\frac{3}{8}$.
- **Pernyataan C (BENAR):**
  Kejadian ketiga sisi Angka: $\\{AAA\\}$ ($1$ titik sampel, $P = \\frac{1}{8}$).
  Komplemennya $= 1 - \\frac{1}{8} = \\frac{7}{8}$.
- **Pernyataan D (SALAH):**
  Hanya ada $3$ koin yang dilempar, sehingga mustahil muncul empat sisi Angka ($P = 0$, bukan kejadian pasti).

**Pernyataan yang BENAR:** **A, B, dan C**.`,
  },
  {
    id: 6,
    fileName: 'soal_6.exe',
    category: 'PILIHAN GANDA KOMPLEKS',
    title: 'KASUS #06: Verifikasi Pernyataan Dua Dadu',
    type: 'complex-mc',
    question:
      'Dua buah dadu dilempar bersamaan satu kali. Tentukan pernyataan berikut yang BENAR: *(Pilih semua yang benar)*',
    options: [
      { key: 'A', label: 'Peluang munculnya mata dadu berjumlah $12$ adalah $\\frac{1}{36}$.' },
      { key: 'B', label: 'Peluang munculnya mata dadu berjumlah kurang dari atau sama dengan $3$ adalah $\\frac{1}{12}$.' },
      { key: 'C', label: 'Peluang munculnya mata dadu bermata kembar (sama) adalah $\\frac{1}{6}$.' },
      { key: 'D', label: 'Peluang munculnya jumlah mata dadu bernilai $13$ adalah $\\frac{1}{36}$.' },
    ],
    correctAnswer: ['A', 'B', 'C'],
    explanation: `**Evaluasi Klaim Forensik ($n(S) = 36$):**
- **Pernyataan A (BENAR):**
  Mata dadu berjumlah 12 hanya ada 1 pasangan: $(6,6)$.
  Peluang $= \\frac{1}{36}$.
- **Pernyataan B (BENAR):**
  Mata dadu berjumlah $\\le 3$:
  - Jumlah 2: $(1,1)$ $\\rightarrow 1$
  - Jumlah 3: $(1,2), (2,1)$ $\\rightarrow 2$
  Total $= 3$ pasangan. Peluang $= \\frac{3}{36} = \\frac{1}{12}$.
- **Pernyataan C (BENAR):**
  Mata dadu kembar: $\\{(1,1), (2,2), (3,3), (4,4), (5,5), (6,6)\\}$ ($6$ pasangan).
  Peluang $= \\frac{6}{36} = \\frac{1}{6}$.
- **Pernyataan D (SALAH):**
  Jumlah maksimal mata dadu 6 sisi adalah $6 + 6 = 12$. Jumlah $13$ adalah hal mustahil ($P = 0$).

**Pernyataan yang BENAR:** **A, B, dan C**.`,
  },

  // ==========================================
  // BAGIAN 3: MENJODOHKAN (2 Soal)
  // ==========================================
  {
    id: 7,
    fileName: 'soal_7.exe',
    category: 'MENJODOHKAN',
    title: 'KASUS #07: Menghubungkan Teori Dasar Peluang',
    type: 'matching',
    question:
      'Pasangkanlah istilah/konsep dasar peluang pada Kolom A dengan bentuk/rumus/deskripsi yang sesuai pada Kolom B:',
    leftItems: [
      { id: '1', leftText: '1. Ruang Sampel ($S$)' },
      { id: '2', leftText: '2. Titik Sampel' },
      { id: '3', leftText: '3. Rumus Peluang Kejadian' },
      { id: '4', leftText: '4. Rumus Komplemen Kejadian' },
      { id: '5', leftText: '5. Rumus Frekuensi Harapan' },
    ],
    rightOptions: [
      { key: 'A', rightText: '$P(A) = \\frac{n(A)}{n(S)}$' },
      { key: 'B', rightText: '$F_h(A) = n \\times P(A)$' },
      { key: 'C', rightText: '$P(A\') = 1 - P(A)$' },
      { key: 'D', rightText: 'Setiap anggota tunggal dalam ruang sampel' },
      { key: 'E', rightText: 'Himpunan seluruh hasil yang mungkin' },
    ],
    correctAnswer: {
      '1': 'E',
      '2': 'D',
      '3': 'A',
      '4': 'C',
      '5': 'B',
    },
    explanation: `**Daftar Pasangan yang Tepat:**
1. **Ruang Sampel ($S$)** $\\rightarrow$ **E**: Himpunan seluruh hasil yang mungkin
2. **Titik Sampel** $\\rightarrow$ **D**: Setiap anggota tunggal dalam ruang sampel
3. **Rumus Peluang Kejadian** $\\rightarrow$ **A**: $P(A) = \\frac{n(A)}{n(S)}$
4. **Rumus Komplemen Kejadian** $\\rightarrow$ **C**: $P(A') = 1 - P(A)$
5. **Rumus Frekuensi Harapan** $\\rightarrow$ **B**: $F_h(A) = n \\times P(A)$

Semua konsep cocok secara matematis dan teoritis.`,
  },
  {
    id: 8,
    fileName: 'soal_8.exe',
    category: 'MENJODOHKAN',
    title: 'KASUS #08: Rekonstruksi Nilai Peluang Kejadian',
    type: 'matching',
    question:
      'Pasangkanlah pelemparan pada Kolom A dengan nilai peluangnya pada Kolom B:',
    leftItems: [
      { id: '1', leftText: '1. Peluang muncul mata dadu ganjil pada 1 dadu' },
      { id: '2', leftText: '2. Peluang muncul (Gambar, Dadu Genap) pada 1 koin & 1 dadu' },
      { id: '3', leftText: '3. Peluang muncul tiga Angka pada 3 koin' },
      { id: '4', leftText: '4. Peluang komplemen dari munculnya dua Gambar pada 2 koin' },
      { id: '5', leftText: '5. Peluang muncul mata dadu berjumlah 10 pada 2 dadu' },
    ],
    rightOptions: [
      { key: 'A', rightText: '$\\frac{1}{4}$' },
      { key: 'B', rightText: '$\\frac{1}{2}$' },
      { key: 'C', rightText: '$\\frac{3}{4}$' },
      { key: 'D', rightText: '$\\frac{1}{12}$' },
      { key: 'E', rightText: '$\\frac{1}{8}$' },
    ],
    correctAnswer: {
      '1': 'B',
      '2': 'A',
      '3': 'E',
      '4': 'C',
      '5': 'D',
    },
    acceptedAlternatives: {
      '1': ['B'],
      '2': ['A'],
      '3': ['E'],
      '4': ['C'],
      '5': ['D'],
    },
    explanation: `**Perhitungan Nilai Peluang Kolom A:**
1. **Dadu ganjil $\\{1,3,5\\}$ pada 1 dadu:**
   $$\\frac{3}{6} = \\frac{1}{2} \\rightarrow \\mathbf{B}$$
2. **Muncul (Gambar, Dadu Genap) pada 1 koin & 1 dadu:**
   Ruang sampel $= 2 \\times 6 = 12$. Kejadian: $\\{(G,2), (G,4), (G,6)\\} = 3$ titik.
   Peluang $= \\frac{3}{12} = \\frac{1}{4} \\rightarrow \\mathbf{A}$$
3. **Muncul tiga Angka pada 3 koin:**
   Ruang sampel $= 2^3 = 8$. Kejadian $\\{AAA\\} = 1$ titik.
   Peluang $= \\frac{1}{8} \\rightarrow \\mathbf{E}$$
4. **Peluang komplemen dari munculnya dua Gambar pada 2 koin:**
   Dua Gambar $= \\frac{1}{4}$. Komplemennya $= 1 - \\frac{1}{4} = \\frac{3}{4} \\rightarrow \\mathbf{C}$$
5. **Peluang muncul dadu berjumlah 10 pada 2 dadu:**
   Pasangan berjumlah 10: $\\{(4,6), (5,5), (6,4)\\} = 3$ pasangan.
   Peluang $= \\frac{3}{36} = \\frac{1}{12} \\rightarrow \\mathbf{D}$$`,
  },

  // ==========================================
  // BAGIAN 4: ISIAN SINGKAT (2 Soal)
  // ==========================================
  {
    id: 9,
    fileName: 'soal_9.exe',
    category: 'ISIAN SINGKAT',
    title: 'KASUS #09: Teka-Teki Kelereng Biru Tersembunyi',
    type: 'short-answer',
    question:
      'Dalam sebuah wadah terdapat $8$ kelereng merah dan $y$ kelereng biru. Jika sebuah kelereng diambil secara acak dan peluang terambilnya kelereng biru bernilai $\\frac{3}{5}$, maka banyaknya kelereng biru di dalam wadah tersebut adalah ... kelereng.',
    unit: 'kelereng',
    correctAnswer: '12',
    acceptedAnswers: ['12', '12 kelereng'],
    explanation: `**Langkah Aljabar Forensik:**
1. **Jumlah Bola:**
   - Kelereng merah $= 8$
   - Kelereng biru $= y$
   - Total kelereng $= y + 8$
2. **Persamaan Peluang Kelereng Biru:**
   $$P(\\text{Biru}) = \\frac{y}{y + 8} = \\frac{3}{5}$$
3. **Perkalian Silang:**
   $$5 \\times y = 3 \\times (y + 8)$$
   $$5y = 3y + 24$$
   $$5y - 3y = 24$$
   $$2y = 24$$
   $$y = 12$$

**Kesimpulan:** Banyaknya kelereng biru dalam wadah adalah **12** kelereng.`,
  },
  {
    id: 10,
    fileName: 'soal_10.exe',
    category: 'ISIAN SINGKAT',
    title: 'KASUS #10: Estimasi Korban Tryout Ujian Sekolah',
    type: 'short-answer',
    question:
      'Sebuah sekolah melakukan tryout ujian sekolah. Peluang seorang siswa lulus tryout tersebut adalah $0{,}85$. Jika terdapat $200$ siswa yang mengikuti tryout, perkiraan banyaknya siswa yang TIDAK lulus tryout adalah ... siswa.',
    unit: 'siswa',
    correctAnswer: '30',
    acceptedAnswers: ['30', '30 siswa'],
    explanation: `**Langkah Analisis Forensik Kasus:**
1. **Peluang Lulus:**
   $$P(\\text{Lulus}) = 0{,}85$$
2. **Peluang Tidak Lulus (Komplemen):**
   $$P(\\text{Tidak Lulus}) = 1 - P(\\text{Lulus}) = 1 - 0{,}85 = 0{,}15$$
3. **Banyak Peserta ($n$):**
   $$n = 200\\text{ siswa}$$
4. **Frekuensi Harapan Siswa Tidak Lulus:**
   $$F_h(\\text{Tidak Lulus}) = n \\times P(\\text{Tidak Lulus}) = 200 \\times 0{,}15 = 30\\text{ siswa}$$

**Kesimpulan:** Perkiraan banyaknya siswa yang tidak lulus tryout adalah **30** siswa.`,
  },
];
