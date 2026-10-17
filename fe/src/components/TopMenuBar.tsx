import React, { useState, useEffect } from 'react';
import type { InvestigatorProfile } from '../types/quiz';
import { FileText, Award } from 'lucide-react';
import { sound } from '../utils/sound';

interface TopMenuBarProps {
  profile: InvestigatorProfile | null;
  solvedCount: number;
  failedCount: number;
  totalQuestions: number;
  onOpenReport: () => void;
  onOpenManual: () => void;
}

export const TopMenuBar: React.FC<TopMenuBarProps> = ({
  profile,
  solvedCount,
  failedCount,
  totalQuestions,
  onOpenReport,
  onOpenManual,
}) => {
  const [timeStr, setTimeStr] = useState<string>('00:00:00');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString('en-US', {
          hour12: false,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const totalAttempted = solvedCount + failedCount;
  const progressPercent = Math.round((totalAttempted / totalQuestions) * 100);
  const accuracyPercent = totalAttempted > 0 ? Math.round((solvedCount / totalAttempted) * 100) : 0;
  const isFinished = totalAttempted === totalQuestions;

  return (
    <div className="w-full bg-[#f4f1ea] border-b-2 sm:border-b-4 border-black px-1.5 sm:px-2 py-0.5 sm:py-1 flex items-center justify-between gap-1 text-xs font-mono-code font-bold z-20 shrink-0 select-none">
      {/* Left: Vintage OS Start / Badge */}
      <div className="flex items-center gap-1 sm:gap-2 shrink-0">
        <div className="flex items-center gap-1 bg-black text-[#f4f1ea] px-1.5 sm:px-2 py-0.5 sm:py-1 brutal-border text-[9.5px] sm:text-xs">
          <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 bg-red-600 inline-block mr-0.5"></span>
          <span className="tracking-wider hidden sm:inline">CASE_DESKTOP</span>
          <span className="tracking-wider sm:hidden">DESKTOP</span>
        </div>

        {profile && (
          <div className="hidden lg:flex items-center gap-1 bg-white px-2 py-1 brutal-border text-xs">
            <span className="text-neutral-500">AGENT:</span>
            <span className="text-black uppercase">{profile.fullName}</span>
            <span className="text-neutral-400">|</span>
            <span className="text-neutral-500">NO:</span>
            <span className="text-black">{profile.presensiNumber}</span>
          </div>
        )}
      </div>

      {/* Center: Live Progress Bar & Accuracy */}
      <div className="flex items-center gap-1.5 sm:gap-3 bg-[#e8e4d8] px-1.5 sm:px-3 py-0.5 sm:py-1 brutal-border text-[9px] sm:text-[11px] shrink min-w-0">
        <div className="flex items-center gap-1 min-w-0">
          <span className="text-neutral-700 hidden sm:inline">PROGRESS:</span>
          {/* Retro Segmented Progress Bar */}
          <div className="w-12 sm:w-24 md:w-28 h-3 sm:h-4 bg-white brutal-border overflow-hidden flex shrink-0">
            <div
              className="bg-black h-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <span className="text-[9px] sm:text-[11px] shrink-0">
            {totalAttempted}/{totalQuestions}
          </span>
        </div>

        <div className="h-3 w-[1px] bg-black/40 hidden sm:block" />

        <div className="flex items-center gap-1 shrink-0">
          <span className="text-neutral-700 hidden md:inline">ACCURACY:</span>
          <span
            className={`px-1 py-0.2 sm:px-1.5 sm:py-0.5 text-[8.5px] sm:text-[11px] font-bold ${
              accuracyPercent >= 75
                ? 'bg-emerald-600 text-white'
                : accuracyPercent >= 50
                ? 'bg-amber-500 text-black'
                : 'bg-red-600 text-white'
            }`}
          >
            {accuracyPercent}%
          </span>
        </div>
      </div>

      {/* Right: Actions & Clock */}
      <div className="flex items-center gap-1 sm:gap-2 shrink-0">
        <button
          onClick={() => {
            sound.playClick();
            onOpenManual();
          }}
          className="bg-white hover:bg-neutral-100 text-black px-1.5 sm:px-2 py-0.5 sm:py-1 brutal-border brutal-shadow-sm flex items-center gap-1 cursor-pointer active:translate-x-0.5 active:translate-y-0.5 text-[9px] sm:text-xs"
          title="Buka Pedoman Investigasi"
        >
          <FileText className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
          <span className="hidden sm:inline">MANUAL</span>
        </button>

        {isFinished && (
          <button
            onClick={() => {
              sound.playClick();
              onOpenReport();
            }}
            className="bg-red-600 text-white px-1.5 sm:px-2.5 py-0.5 sm:py-1 brutal-border brutal-shadow-sm flex items-center gap-1 cursor-pointer animate-pulse active:translate-x-0.5 active:translate-y-0.5 text-[9px] sm:text-xs"
            title="Lihat Laporan Akhir"
          >
            <Award className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            <span>REPORT</span>
          </button>
        )}

        <div className="bg-black text-[#f4f1ea] px-1.5 sm:px-2 py-0.5 sm:py-1 brutal-border font-mono-code text-[9.5px] sm:text-xs tracking-wider">
          {timeStr}
        </div>
      </div>
    </div>
  );
};
