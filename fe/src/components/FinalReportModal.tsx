import React from 'react';
import type { QuizQuestion, CaseAttempt, InvestigatorProfile } from '../types/quiz';
import { MathRenderer } from './MathRenderer';
import { 
  Award, 
  CheckCircle2, 
  XCircle, 
  Printer, 
  ShieldCheck, 
  FileText,
  ExternalLink,
  BookOpen
} from 'lucide-react';
import { sound } from '../utils/sound';

interface FinalReportModalProps {
  isOpen: boolean;
  profile: InvestigatorProfile | null;
  questions: QuizQuestion[];
  attempts: Record<number, CaseAttempt>;
  violationsCount: number;
  onClose: () => void;
  onReset?: () => void;
  onReviewQuestion: (q: QuizQuestion) => void;
}

export const FinalReportModal: React.FC<FinalReportModalProps> = ({
  isOpen,
  profile,
  questions,
  attempts,
  violationsCount,
  onClose,
  onReviewQuestion,
}) => {
  if (!isOpen) return null;

  const solvedCount = Object.values(attempts).filter((a) => a.isCorrect).length;
  const accuracy = Math.round((solvedCount / questions.length) * 100);

  // Title rank based on accuracy
  const getRankBadge = () => {
    if (solvedCount === 10) {
      return {
        title: 'CASE CLOSED // MATHEMATICAL GODMODE',
        subtitle: 'You made it. You have reached math GODMODE. Zero unresolved anomalies.',
        badgeClass: 'bg-black text-[#f4f1ea] border-red-600',
        stamp: 'GODMODE 100%',
      };
    }
    if (accuracy >= 80) {
      return {
        title: 'CASE RESOLVED // CHIEF DETECTIVE',
        subtitle: 'Outstanding analytical capability. Almost all cyber cases successfully neutralized.',
        badgeClass: 'bg-emerald-800 text-white border-emerald-950',
        stamp: 'HIGH HONORS',
      };
    }
    if (accuracy >= 60) {
      return {
        title: 'CASE ARCHIVED // SENIOR INVESTIGATOR',
        subtitle: 'Sufficient mathematical evidence secured. Investigation officially concluded.',
        badgeClass: 'bg-amber-600 text-black border-amber-900',
        stamp: 'RESOLVED',
      };
    }
    return {
      title: 'CASE SEALED // FIELD AGENT',
      subtitle: 'Investigation closed with partial anomalies. Remedial training recommended.',
      badgeClass: 'bg-red-800 text-white border-red-950',
      stamp: 'SEALED',
    };
  };

  const rankInfo = getRankBadge();

  const getFormattedCorrectAnswer = (q: QuizQuestion) => {
    if (q.type === 'multiple-choice') {
      const opt = q.options.find((o) => o.key.toUpperCase() === q.correctAnswer.toUpperCase());
      return (
        <span className="inline-flex items-center gap-1.5 flex-wrap">
          <span className="bg-emerald-700 text-white px-1.5 py-0.2 font-bold font-mono-code text-[11px]">
            [{q.correctAnswer}]
          </span>
          {opt && <MathRenderer content={opt.label} inline />}
        </span>
      );
    }
    if (q.type === 'complex-mc') {
      return (
        <span className="font-bold bg-emerald-700 text-white px-2 py-0.5 font-mono-code text-[11px]">
          [{q.correctAnswer.join(', ')}]
        </span>
      );
    }
    if (q.type === 'matching') {
      return (
        <div className="flex flex-wrap gap-1.5 mt-1">
          {q.leftItems.map((item) => (
            <span
              key={item.id}
              className="bg-emerald-100 text-emerald-900 border border-emerald-600 px-1.5 py-0.5 text-[10px] font-bold"
            >
              #{item.id} → [{q.correctAnswer[item.id]}]
            </span>
          ))}
        </div>
      );
    }
    if (q.type === 'short-answer') {
      return (
        <span className="font-bold bg-emerald-100 text-emerald-900 border border-emerald-600 px-2 py-0.5">
          {q.correctAnswer} {q.unit || ''}
        </span>
      );
    }
    return null;
  };

  const getFormattedUserAnswer = (q: QuizQuestion, attempt?: CaseAttempt) => {
    if (!attempt) return <span className="text-neutral-400 italic">Belum dijawab</span>;
    if (q.type === 'multiple-choice') {
      return (
        <span className="font-bold bg-neutral-200 text-black px-1.5 py-0.2 font-mono-code text-[11px] border border-black/40">
          [{attempt.userAnswer as string}]
        </span>
      );
    }
    if (q.type === 'complex-mc') {
      const arr = Array.isArray(attempt.userAnswer) ? attempt.userAnswer : [];
      return (
        <span className="font-bold bg-neutral-200 text-black px-2 py-0.5 font-mono-code text-[11px] border border-black/40">
          [{arr.join(', ')}]
        </span>
      );
    }
    if (q.type === 'matching') {
      const obj = typeof attempt.userAnswer === 'object' && !Array.isArray(attempt.userAnswer)
        ? (attempt.userAnswer as Record<string, string>)
        : {};
      return (
        <div className="flex flex-wrap gap-1.5 mt-1">
          {Object.entries(obj).map(([k, v]) => (
            <span key={k} className="bg-neutral-100 border border-black/40 px-1.5 py-0.5 text-[10px] font-bold">
              #{k} → [{v}]
            </span>
          ))}
        </div>
      );
    }
    if (q.type === 'short-answer') {
      return (
        <span className="font-bold bg-neutral-100 border border-black/40 px-2 py-0.5">
          {String(attempt.userAnswer)} {q.unit || ''}
        </span>
      );
    }
    return null;
  };

  return (
    <div className="absolute inset-0 z-40 bg-[#fcfbf7] flex flex-col p-2 sm:p-2.5 font-mono-code select-none overflow-hidden text-neutral-900 animate-in fade-in duration-150">
      
      {/* Top Header Bar */}
      <div className="border-b-2 sm:border-b-4 border-black pb-1 sm:pb-1.5 flex items-center justify-between gap-1.5 sm:gap-2 shrink-0">
        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
          <div className="w-6 h-6 sm:w-8 sm:h-8 bg-black text-[#f4f1ea] flex items-center justify-center brutal-border shrink-0">
            <Award className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />
          </div>
          <div className="min-w-0">
            <div className="text-[8px] sm:text-[10px] font-bold text-red-600 tracking-widest uppercase truncate">
              BIRO INVESTIGASI SIBER // DIVISI PROBABILITAS
            </div>
            <h2 className="text-[11px] sm:text-sm font-bold uppercase tracking-wider text-black leading-tight truncate">
              LAPORAN AKHIR RESMI // FORENSIK HASIL
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          <button
            onClick={() => {
              sound.playClick();
              window.print();
            }}
            className="bg-white hover:bg-neutral-100 text-black px-2 sm:px-2.5 py-0.5 sm:py-1 brutal-border-2 brutal-shadow-sm font-bold text-[10px] sm:text-xs flex items-center gap-1 cursor-pointer"
            title="Cetak Laporan Resmi"
          >
            <Printer className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            <span className="hidden sm:inline">CETAK</span>
          </button>
          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="w-5 h-5 sm:w-6 sm:h-6 bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center justify-center brutal-border-2 cursor-pointer"
            title="Tutup Laporan"
          >
            ×
          </button>
        </div>
      </div>

      {/* Main 2-Column Split Body */}
      <div className="flex-1 min-h-0 flex flex-col md:flex-row gap-2 sm:gap-2.5 overflow-y-auto md:overflow-hidden mt-1 sm:mt-2">
        
        {/* ========================================================= */}
        {/* LEFT COLUMN: Congratulate / Rank Banner, Stats, & Index   */}
        {/* ========================================================= */}
        <div className="w-full md:w-[35%] lg:w-[33%] flex flex-col justify-between md:overflow-y-auto space-y-1.5 sm:space-y-2 pr-0 md:pr-0.5 shrink-0">
          <div className="space-y-1.5 sm:space-y-2">
            
            {/* Rank / Congratulate Banner */}
            <div className={`p-2 sm:p-2.5 brutal-border-2 relative overflow-hidden ${rankInfo.badgeClass}`}>
              <div className="flex items-start justify-between gap-1.5 sm:gap-2 relative z-10">
                <div>
                  <div className="text-[8px] sm:text-[9px] tracking-widest text-red-400 font-bold uppercase mb-0.5">
                    // CLASSIFICATION
                  </div>
                  <div className="text-xs sm:text-base font-bold font-pixel tracking-wider leading-tight">
                    {rankInfo.title}
                  </div>
                  <p className="text-[9.5px] sm:text-[11px] opacity-90 mt-0.5 sm:mt-1 font-sans leading-snug">
                    {rankInfo.subtitle}
                  </p>
                </div>
                <div className="border border-white/60 px-1.5 sm:px-2 py-0.5 text-center font-bold font-pixel text-[10px] sm:text-sm uppercase tracking-widest rotate-1 bg-black/50 shrink-0">
                  {rankInfo.stamp}
                </div>
              </div>
            </div>

            {/* Investigator Credentials & Stats Grid */}
            <div className="grid grid-cols-2 gap-1 sm:gap-1.5 text-xs">
              <div className="bg-white p-1.5 sm:p-2 brutal-border-2">
                <span className="text-neutral-500 uppercase font-bold text-[8px] sm:text-[9px] block">NAMA AGEN:</span>
                <span className="font-bold text-[10.5px] sm:text-xs text-black uppercase truncate block">
                  {profile?.fullName || 'ANONYMOUS'}
                </span>
              </div>

              <div className="bg-white p-1.5 sm:p-2 brutal-border-2">
                <span className="text-neutral-500 uppercase font-bold text-[8px] sm:text-[9px] block">NO. PRESENSI:</span>
                <span className="font-bold text-[10.5px] sm:text-xs text-black block">
                  #{profile?.presensiNumber || '00'}
                </span>
              </div>

              <div className="bg-white p-1.5 sm:p-2 brutal-border-2">
                <span className="text-neutral-500 uppercase font-bold text-[8px] sm:text-[9px] block">SKOR & AKURASI:</span>
                <span className="font-bold text-[10.5px] sm:text-xs text-emerald-700 block">
                  {solvedCount} / {questions.length} ({accuracy}%)
                </span>
              </div>

              <div className="bg-white p-1.5 sm:p-2 brutal-border-2">
                <span className="text-neutral-500 uppercase font-bold text-[8px] sm:text-[9px] block">PELANGGARAN TAB:</span>
                <span className={`font-bold text-[10.5px] sm:text-xs block ${violationsCount > 0 ? 'text-red-600' : 'text-neutral-700'}`}>
                  {violationsCount}x TERDETEKSI
                </span>
              </div>
            </div>
          </div>

          {/* Left Footer Action */}
          <div className="pt-1.5 sm:pt-2 border-t border-black/20 space-y-1 mt-1 sm:mt-2">
            <div className="flex items-center gap-1.5 text-neutral-600 text-[8.5px] sm:text-[9px] leading-tight">
              <ShieldCheck className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-600 shrink-0" />
              <span>ARSIP RESMI TERKUNCI PERMANEN</span>
            </div>
            <button
              onClick={() => {
                sound.playClick();
                onClose();
              }}
              className="w-full bg-black hover:bg-neutral-800 text-white py-1.5 sm:py-2 brutal-border-2 brutal-shadow font-bold text-[11px] sm:text-xs uppercase tracking-wider cursor-pointer active:translate-x-0.5 active:translate-y-0.5"
            >
              KEMBALI KE DESKTOP
            </button>
          </div>
        </div>

        {/* ========================================================= */}
        {/* RIGHT COLUMN: All 10 Solutions DIRECTLY OPEN AND VISIBLE */}
        {/* ========================================================= */}
        <div className="flex-1 min-w-0 flex flex-col min-h-[380px] md:min-h-0 md:h-full bg-[#f4f1ea] brutal-border-2 overflow-hidden shrink-0 md:shrink">
          
          {/* Right Header Bar */}
          <div className="bg-black text-[#f4f1ea] px-3 py-1.5 flex items-center justify-between border-b-2 border-black shrink-0">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-red-500" />
              <span className="font-bold text-xs uppercase tracking-wider">
                PEMBAHASAN RESMI & LANGKAH FORENSIK 10 KASUS (LENGKAP)
              </span>
            </div>
            <span className="text-[10px] text-neutral-400 font-bold hidden sm:inline">
              SEMUA SOLUSI TERBUKA PENUH
            </span>
          </div>

          {/* Scrollable Container with All 10 Cases Directly Visible */}
          <div className="flex-1 min-h-0 overflow-y-auto p-2.5 sm:p-3 space-y-3.5">
            {questions.map((q) => {
              const attempt = attempts[q.id];
              const isSuccess = attempt?.isCorrect;

              return (
                <div
                  key={q.id}
                  id={`case-report-${q.id}`}
                  className="bg-[#fcfbf7] brutal-border-2 p-3 space-y-2.5 brutal-shadow-sm transition-all"
                >
                  {/* Card Title Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-1.5 border-b border-black/20 pb-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="bg-black text-white px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                        KASUS #{q.id}
                      </span>
                      <span className="text-xs font-bold text-neutral-900 font-mono-code">
                        {q.fileName} — {q.title}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {isSuccess ? (
                        <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-900 border border-emerald-700 px-2 py-0.5 text-[10px] font-bold">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                          SOLVED (+1)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 bg-red-100 text-red-900 border border-red-700 px-2 py-0.5 text-[10px] font-bold">
                          <XCircle className="w-3.5 h-3.5 text-red-700" />
                          FAILED (0)
                        </span>
                      )}

                      <button
                        onClick={() => {
                          sound.playClick();
                          onReviewQuestion(q);
                        }}
                        className="bg-white hover:bg-neutral-100 text-black px-2 py-0.5 text-[10px] font-bold brutal-border inline-flex items-center gap-1 cursor-pointer"
                        title="Buka tampilan modal interaktif"
                      >
                        <span>LIHAT SOAL</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {/* Soal Kasus Box */}
                  <div className="bg-white p-2.5 brutal-border">
                    <div className="text-[10px] uppercase font-bold text-neutral-500 mb-1 flex items-center gap-1">
                      <FileText className="w-3 h-3 text-neutral-800" />
                      <span>PERNYATAAN / SOAL KASUS:</span>
                    </div>
                    <div className="text-xs sm:text-[13px] text-neutral-900 font-sans font-medium leading-relaxed">
                      <MathRenderer content={q.question} />
                    </div>
                  </div>

                  {/* Jawaban Comparison Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div className={`p-2 brutal-border ${
                      isSuccess
                        ? 'bg-emerald-50/70 border-emerald-600'
                        : 'bg-red-50/70 border-red-600'
                    }`}>
                      <span className="text-[9px] uppercase font-bold text-neutral-600 block mb-0.5">
                        JAWABAN ANDA:
                      </span>
                      <div className="text-xs">{getFormattedUserAnswer(q, attempt)}</div>
                    </div>

                    <div className="bg-emerald-50 border-2 border-emerald-700 p-2 text-emerald-950">
                      <span className="text-[9px] uppercase font-bold text-emerald-800 block mb-0.5">
                        KUNCI JAWABAN RESMI:
                      </span>
                      <div className="text-xs">{getFormattedCorrectAnswer(q)}</div>
                    </div>
                  </div>

                  {/* PEMBAHASAN LENGKAP & LANGKAH FORENSIK (DIRECTLY VISIBLE IN FULL) */}
                  <div className="bg-white brutal-border-2 p-3 space-y-2">
                    <div className="bg-amber-300 text-black px-2.5 py-1 font-bold text-xs flex items-center gap-1.5 border border-black">
                      <BookOpen className="w-3.5 h-3.5 text-red-600" />
                      <span>PEMBAHASAN LANGKAH FORENSIK MATEMATIKA:</span>
                    </div>
                    <div className="text-xs sm:text-[13px] text-neutral-900 space-y-1.5 leading-relaxed font-sans">
                      <MathRenderer content={q.explanation} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
