import React from 'react';
import { MathRenderer } from './MathRenderer';
import { BookOpen, ShieldAlert } from 'lucide-react';
import { sound } from '../utils/sound';

interface ManualModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ManualModal: React.FC<ManualModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/60 p-1 sm:p-2.5 md:p-3 font-mono-code select-none overflow-hidden">
      <div className="w-full max-w-lg lg:max-w-xl h-[96%] sm:h-[88%] max-h-[500px] bg-[#fcfbf7] brutal-border-2 sm:brutal-border-4 brutal-shadow-lg p-2 sm:p-3.5 my-auto text-neutral-900 animate-in fade-in zoom-in-95 duration-150 flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b-2 sm:border-b-4 border-black pb-1.5 mb-1.5 shrink-0">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-600" />
            <h3 className="font-bold text-[11px] sm:text-sm uppercase tracking-wider">
              PETUNJUK KASUS & FORMULA FORENSIK
            </h3>
          </div>
          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="w-5 h-5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center justify-center brutal-border-2 cursor-pointer"
          >
            ×
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 min-h-0 space-y-2 text-xs overflow-y-auto pr-0.5">
          {/* Rules Section */}
          <div className="bg-white p-2 sm:p-2.5 brutal-border-2 brutal-shadow-sm space-y-1">
            <div className="font-bold text-red-600 uppercase flex items-center gap-1.5 text-[11px] sm:text-xs">
              <ShieldAlert className="w-3.5 h-3.5" /> 1. ATURAN PENYELIDIKAN (STRICT MODE)
            </div>
            <ul className="list-disc pl-4 space-y-1 text-neutral-800 text-[10px] sm:text-[11px] leading-relaxed">
              <li>Terdapat 10 Berkas Kasus (<code>soal_1.exe</code> s/d <code>soal_10.exe</code>).</li>
              <li>Setiap berkas hanya dapat dibuka dan dijawab <strong>1 KALI</strong>.</li>
              <li>Jika jawaban Anda <strong>BENAR</strong>, berkas berstatus <strong>[SOLVED]</strong> dan poin bertambah.</li>
              <li>Jika jawaban Anda <strong>SALAH</strong>, berkas langsung <strong>[FAILED / TERKUNCI]</strong> dan tidak dapat diakses ulang.</li>
              <li>Anda dapat mengubah pilihan jawaban sebanyak mungkin sebelum menekan tombol <strong>CHECK ANSWER</strong>.</li>
            </ul>
          </div>

          {/* Formulas Cheatsheet Section */}
          <div className="bg-white p-2.5 brutal-border-2 brutal-shadow-sm space-y-2">
            <div className="font-bold text-black uppercase border-b border-black/20 pb-1 text-xs">
              2. FORMULA FORENSIK RESMI
            </div>

            <div className="space-y-1.5 text-[10px] sm:text-[11px]">
              <div className="p-1.5 bg-[#f4f1ea] brutal-border">
                <strong>A. Peluang Kejadian Tunggal:</strong>
                <MathRenderer content="$$P(A) = \frac{n(A)}{n(S)}$$" />
                <span className="text-neutral-600 block mt-0.5">
                  Di mana $0 \le P(A) \le 1$. Nilai 0 = kejadian mustahil, nilai 1 = kejadian pasti.
                </span>
              </div>

              <div className="p-1.5 bg-[#f4f1ea] brutal-border">
                <strong>B. Peluang Komplemen ($A'$):</strong>
                <MathRenderer content="$$P(A') = 1 - P(A) \iff P(A) = 1 - P(A')$$ " />
                <span className="text-neutral-600 block mt-0.5">
                  Sangat berguna ketika menghitung kejadian 'berbeda warna' atau 'paling sedikit satu'.
                </span>
              </div>

              <div className="p-1.5 bg-[#f4f1ea] brutal-border">
                <strong>C. Frekuensi Harapan ($F_h$):</strong>
                <MathRenderer content="$$F_h(A) = N \times P(A)$$" />
                <span className="text-neutral-600 block mt-0.5">
                  Dengan $N$ = banyaknya percobaan yang dilakukan.
                </span>
              </div>

              <div className="p-1.5 bg-[#f4f1ea] brutal-border">
                <strong>D. Aturan Kombinasi $C(n, r)$:</strong>
                <MathRenderer content="$$C(n, r) = \frac{n!}{r!(n - r)!}$$" />
                <span className="text-neutral-600 block mt-0.5">
                  Pengambilan objek sekaligus tanpa memperhatikan urutan (seperti mengambil 2 bola sekaligus).
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-2 pt-2 border-t-2 border-black/20 flex justify-end shrink-0">
          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="bg-black text-white hover:bg-neutral-800 px-4 py-1.5 brutal-border-2 font-bold text-xs uppercase cursor-pointer"
          >
            TUTUP PETUNJUK
          </button>
        </div>
      </div>
    </div>
  );
};
