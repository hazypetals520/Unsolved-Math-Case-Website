import React from 'react';
import { Volume2, VolumeX, ShieldAlert } from 'lucide-react';

interface CRTFrameProps {
  children: React.ReactNode;
  isMuted: boolean;
  onToggleMute: () => void;
  agentName?: string;
  violationsCount?: number;
}

export const CRTFrame: React.FC<CRTFrameProps> = ({
  children,
  isMuted,
  onToggleMute,
  agentName,
  violationsCount = 0,
}) => {
  return (
    <div className="h-[100dvh] w-screen fixed inset-0 bg-[#0c0d10] flex flex-col p-0.5 sm:p-2 md:p-3 overflow-hidden select-none">
      {/* Outer Vintage Monitor Housing - Fills Screen & Stays Fixed */}
      <div className="h-full w-full bg-[#dcd7c9] brutal-border-2 sm:brutal-border-4 rounded-md sm:rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.9),_inset_0_2px_4px_rgba(255,255,255,0.7),_inset_0_-3px_6px_rgba(0,0,0,0.4)] p-0.5 sm:p-1.5 md:p-2 flex flex-col justify-between overflow-hidden relative">
        
        {/* Monitor Top Brand & Status Badge (Ultra Compact) */}
        <div className="flex items-center justify-between pb-0.5 sm:pb-1 px-1 sm:px-2 text-[9px] sm:text-xs font-mono-code border-b border-black/30 sm:border-b-2 mb-0.5 sm:mb-1 shrink-0">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className="bg-black text-[#f4f1ea] px-1.5 sm:px-2 py-0.5 font-bold tracking-wider uppercase text-[8.5px] sm:text-[11px] brutal-border truncate max-w-[150px] sm:max-w-none">
              CYBER-OS 1994 // PROBABILITY
            </span>
            <span className="hidden lg:inline text-neutral-700 font-semibold text-[10px]">
              RETRO-CRTX 486-DX2
            </span>
          </div>

          <div className="flex items-center gap-1 sm:gap-2">
            {violationsCount > 0 && (
              <div className="flex items-center gap-1 bg-red-600 text-white px-1 sm:px-2 py-0.2 sm:py-0.5 text-[8.5px] sm:text-[10px] font-bold animate-pulse brutal-border">
                <ShieldAlert className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                <span>VIOLATIONS: {violationsCount}</span>
              </div>
            )}

            <button
              onClick={onToggleMute}
              className="flex items-center gap-1 bg-[#f4f1ea] hover:bg-neutral-200 text-black px-1.5 sm:px-2 py-0.2 sm:py-0.5 text-[8.5px] sm:text-[11px] font-bold brutal-border brutal-shadow-sm active:translate-x-0.5 active:translate-y-0.5 cursor-pointer shrink-0"
              title={isMuted ? 'Unmute Sound' : 'Mute Sound'}
            >
              {isMuted ? <VolumeX className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-red-600" /> : <Volume2 className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-green-700" />}
              <span className="hidden sm:inline">{isMuted ? 'SOUND: OFF' : 'SOUND: ON'}</span>
            </button>
          </div>
        </div>

        {/* The CRT Screen Viewport - Takes exact remaining height, never overflows screen */}
        <div className="relative w-full flex-1 min-h-0 bg-[#f4f1ea] brutal-border-2 sm:brutal-border-4 rounded-sm sm:rounded-md overflow-hidden flex flex-col shadow-[inset_0_0_15px_rgba(0,0,0,0.15)] crt-screen-container">

          {/* Inner Content Area */}
          <div className="relative z-10 flex-1 min-h-0 flex flex-col overflow-hidden">
            {children}
          </div>
        </div>

        {/* Vintage Monitor Bottom Control Bar & Vents (Compact) */}
        <div className="mt-0.5 sm:mt-1 flex items-center justify-between px-1 sm:px-2 pt-0.5 border-t border-black/20 shrink-0">
          {/* Speaker Vent Grill (Inspired by Image 1) */}
          <div className="flex flex-col gap-0.5 w-8 sm:w-20">
            <div className="h-0.5 bg-neutral-800 rounded-full" />
            <div className="h-0.5 bg-neutral-800 rounded-full" />
            <div className="h-0.5 bg-neutral-800 rounded-full" />
          </div>

          {/* Agent on Duty Label */}
          <div className="text-center font-bold tracking-wider text-[8px] sm:text-[10px] font-mono-code text-neutral-800 uppercase truncate px-1 max-w-[200px] sm:max-w-none">
            {agentName ? `AGENT: ${agentName}` : 'CASE TERMINAL // 10 FILES'}
          </div>

          {/* Power Button & Green LED */}
          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-500 shadow-[0_0_6px_#10b981] animate-pulse" />
            <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 bg-[#beb9a8] brutal-border brutal-shadow-sm flex items-center justify-center">
              <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-black rounded-xs" />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
