import React from 'react';
import { ArrowRight } from 'lucide-react';
import { sound } from '../utils/sound';

interface LandingScreenProps {
  onStart: () => void;
}

export const LandingScreen: React.FC<LandingScreenProps> = ({ onStart }) => {
  return (
    <div className="flex-1 min-h-0 flex flex-col items-center justify-center p-2.5 sm:p-6 bg-[#f4f1ea] relative overflow-hidden select-none">
      {/* Exactly ONE Clean Centered Title Logo */}
      <div className="mb-4 sm:mb-8 shrink-0 flex items-center justify-center">
        <img
          src="/assets/unsolved_math_case_title.png"
          alt="The Unsolved Math Case"
          className="h-28 xs:h-36 sm:h-48 md:h-60 max-w-full object-contain select-none"
        />
      </div>

      {/* Chunky Retro Start Button */}
      <button
        onClick={() => {
          sound.playClick();
          onStart();
        }}
        className="group relative inline-flex items-center justify-center gap-2 sm:gap-3 bg-red-600 hover:bg-red-500 text-white font-mono-code font-bold text-xs sm:text-base px-6 sm:px-8 py-3 sm:py-4 brutal-border-2 sm:brutal-border-4 brutal-shadow-lg brutal-shadow-active transition-all cursor-pointer shrink-0"
      >
        <span>START INVESTIGATION</span>
        <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 transition-transform group-hover:translate-x-1" />
      </button>

      {/* Subtle Bottom Status */}
      <div className="absolute bottom-1.5 sm:bottom-2 left-0 right-0 text-center text-[9px] sm:text-[11px] font-mono-code text-neutral-600 select-none px-2 truncate">
        SECURITY LEVEL 4 // ANTI-CHEAT ACTIVE // JANGAN PINDAH TAB
      </div>
    </div>
  );
};
