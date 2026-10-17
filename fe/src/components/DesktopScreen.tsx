import React, { useState } from 'react';
import type { QuizQuestion, CaseStatus } from '../types/quiz';
import { 
  FileCode2, 
  CheckCircle2, 
  XCircle, 
  FolderLock, 
  Trash2, 
  FileQuestion,
  HelpCircle,
  Archive,
  Info
} from 'lucide-react';
import { sound } from '../utils/sound';

interface DesktopScreenProps {
  questions: QuizQuestion[];
  caseStatuses: Record<number, CaseStatus>;
  onOpenFile: (question: QuizQuestion) => void;
  onOpenManual: () => void;
  onOpenReport: () => void;
  allAttempted: boolean;
}

export const DesktopScreen: React.FC<DesktopScreenProps> = ({
  questions,
  caseStatuses,
  onOpenFile,
  onOpenManual,
  onOpenReport,
  allAttempted,
}) => {
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3000);
  };

  const handleFileExecute = (question: QuizQuestion) => {
    sound.playWindowOpen();
    onOpenFile(question);
  };

  return (
    <div className="flex-1 min-h-0 bg-[#f4f1ea] p-1.5 sm:p-3 md:p-4 flex flex-col justify-between relative overflow-y-auto sm:overflow-hidden font-mono-code select-none">
      {/* Toast Notification Bar */}
      {toastMessage && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 z-40 bg-black text-amber-300 px-3 py-1 text-xs font-bold brutal-border brutal-shadow-sm flex items-center gap-1.5 animate-bounce">
          <Info className="w-3.5 h-3.5 text-amber-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Desktop Workspace Grid (Takes flex-1 without scrolling) */}
      <div className="flex-1 min-h-0 flex flex-col justify-between">
        {/* Section Title & Path */}
        <div className="mb-1 sm:mb-2 flex items-center justify-between gap-1 border-b-2 border-black/30 pb-0.5 sm:pb-1 shrink-0">
          <div className="flex items-center gap-1.5">
            <FolderLock className="w-3.5 h-3.5 text-neutral-800" />
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-neutral-800">
              C:\BERKAS_SOAL\MATEMATIKA\ (*.EXE)
            </span>
          </div>
          <div className="text-[9px] sm:text-[10px] text-neutral-600 bg-white/80 px-1 sm:px-1.5 py-0.2 border border-black/20 hidden xs:block">
            KLIK BERKAS UNTUK PENYELIDIKAN
          </div>
        </div>

        {/* 10 Case File Icons Grid (2 Rows of 5, ultra-compact) */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-1 sm:gap-2 md:gap-2.5 my-auto">
          {questions.map((q) => {
            const status = caseStatuses[q.id] || 'unopened';

            return (
              <div
                key={q.id}
                onClick={() => handleFileExecute(q)}
                className={`relative group flex flex-col items-center justify-between p-1 sm:p-2 brutal-border-2 transition-all cursor-pointer select-none ${
                  status === 'solved'
                    ? 'bg-[#e7f5ea] text-neutral-900 brutal-shadow-sm opacity-95'
                    : status === 'failed'
                    ? 'bg-[#fae6e6] text-neutral-900 brutal-shadow-sm opacity-85'
                    : 'bg-white hover:bg-[#fff9e6] text-neutral-900 brutal-shadow-sm brutal-shadow-active'
                }`}
              >
                {/* Status Stamp Top-Right */}
                <div className="absolute top-0.5 right-0.5 sm:top-1 sm:right-1 z-10">
                  {status === 'solved' && (
                    <span className="flex items-center gap-0.5 bg-emerald-600 text-white text-[7.5px] sm:text-[9px] font-bold px-1 py-0.2 rounded-xs border border-black">
                      <CheckCircle2 className="w-2 h-2 sm:w-2.5 sm:h-2.5" /> SOLVED
                    </span>
                  )}
                  {status === 'failed' && (
                    <span className="flex items-center gap-0.5 bg-red-600 text-white text-[7.5px] sm:text-[9px] font-bold px-1 py-0.2 rounded-xs border border-black">
                      <XCircle className="w-2 h-2 sm:w-2.5 sm:h-2.5" /> FAILED
                    </span>
                  )}
                  {status === 'unopened' && (
                    <span className="text-[7.5px] sm:text-[8px] bg-neutral-200 text-neutral-800 font-bold px-1 border border-black">
                      READY
                    </span>
                  )}
                </div>

                {/* Case File Graphic */}
                <div className="my-0.5 sm:my-1 p-0.5 relative flex items-center justify-center">
                  {status === 'solved' ? (
                    <div className="w-6 h-6 sm:w-10 sm:h-10 bg-emerald-100 brutal-border-2 flex items-center justify-center text-emerald-800">
                      <CheckCircle2 className="w-4 h-4 sm:w-6 sm:h-6" />
                    </div>
                  ) : status === 'failed' ? (
                    <div className="w-6 h-6 sm:w-10 sm:h-10 bg-red-100 brutal-border-2 flex items-center justify-center text-red-800">
                      <FolderLock className="w-4 h-4 sm:w-6 sm:h-6" />
                    </div>
                  ) : (
                    <div className="w-6 h-6 sm:w-10 sm:h-10 bg-[#fbe7c6] brutal-border-2 flex items-center justify-center text-neutral-900 group-hover:scale-105 transition-transform">
                      <FileCode2 className="w-4 h-4 sm:w-6 sm:h-6 text-neutral-900" />
                    </div>
                  )}
                </div>

                {/* File Label & Category */}
                <div className="text-center w-full">
                  <div className="font-bold text-[10px] sm:text-xs truncate w-full tracking-wide">
                    {q.fileName}
                  </div>
                  <div
                    className="text-[8px] sm:text-[9px] uppercase font-bold truncate mt-0.5 px-0.5 text-neutral-500"
                  >
                    {q.category === 'PILIHAN GANDA'
                      ? 'PG (1)'
                      : q.category === 'PILIHAN GANDA KOMPLEKS'
                      ? 'PGK (MULTI)'
                      : q.category === 'MENJODOHKAN'
                      ? 'JODOHKAN'
                      : 'ISIAN'}
                  </div>
                </div>

                {/* Quick Action Button */}
                <div className="w-full mt-0.5 sm:mt-1 pt-0.5 sm:pt-1 border-t border-black/20">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleFileExecute(q);
                    }}
                    className={`w-full py-0.5 text-[8px] sm:text-[10px] font-bold border border-black transition-colors cursor-pointer ${
                      status === 'solved'
                        ? 'bg-emerald-600 text-white hover:bg-emerald-500'
                        : status === 'failed'
                        ? 'bg-red-600 text-white hover:bg-red-500'
                        : 'bg-black text-[#f4f1ea] hover:bg-neutral-800'
                    }`}
                  >
                    {status === 'solved' ? 'REVIEW (SOLVED)' : status === 'failed' ? 'REVIEW (FAILED)' : 'BUKA BERKAS'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Desktop Bottom Auxiliary Utilities (Compact) */}
      <div className="mt-1 sm:mt-2 pt-1 border-t-2 border-black/30 flex flex-wrap items-center justify-between gap-1 sm:gap-2 text-xs shrink-0">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            onClick={() => {
              sound.playClick();
              onOpenManual();
            }}
            className="flex items-center gap-1 bg-white hover:bg-neutral-100 px-2 sm:px-2.5 py-0.5 sm:py-1 brutal-border-2 brutal-shadow-sm font-bold text-neutral-900 cursor-pointer text-[9.5px] sm:text-[11px]"
          >
            <HelpCircle className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-neutral-800" />
            <span>PETUNJUK KASUS.TXT</span>
          </button>

          <button
            onClick={() => {
              sound.playClick();
              showToast('KERANJANG SAMPAH KOSONG: TIDAK ADA BERKAS YANG DIHAPUS');
            }}
            className="flex items-center gap-1 bg-white hover:bg-neutral-100 px-1.5 sm:px-2 py-0.5 sm:py-1 brutal-border-2 brutal-shadow-sm font-bold text-neutral-900 cursor-pointer text-[9.5px] sm:text-[11px]"
          >
            <Trash2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-neutral-600" />
            <span className="hidden sm:inline">RECYCLE_BIN</span>
          </button>
        </div>

        {allAttempted ? (
          <button
            onClick={() => {
              sound.playGodmode();
              onOpenReport();
            }}
            className="flex items-center gap-1.5 bg-red-600 hover:bg-red-500 text-white px-2 sm:px-3 py-0.5 sm:py-1 brutal-border-2 brutal-shadow font-bold animate-bounce cursor-pointer text-[9.5px] sm:text-[11px]"
          >
            <Archive className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            <span>SEMUA SELESAI: LIHAT LAPORAN AKHIR</span>
          </button>
        ) : (
          <div className="flex items-center gap-1 text-neutral-700 text-[9px] sm:text-[10px]">
            <FileQuestion className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-neutral-500" />
            <span className="hidden sm:inline">Pilih salah satu dari 10 berkas untuk penyelidikan.</span>
            <span className="sm:hidden">Pilih berkas untuk mulai.</span>
          </div>
        )}
      </div>
    </div>
  );
};
