import React from 'react';
import { Maximize2, ShieldCheck, Unlock, ArrowRight } from 'lucide-react';
import { sound } from '../utils/sound';

interface UnblockedFullscreenModalProps {
  isOpen: boolean;
  onEnterFullscreen: () => void;
}

export const UnblockedFullscreenModal: React.FC<UnblockedFullscreenModalProps> = ({
  isOpen,
  onEnterFullscreen,
}) => {
  if (!isOpen) return null;

  return (
    <div 
      className="absolute inset-0 z-50 flex items-center justify-center bg-black/90 p-3 sm:p-4 font-mono-code select-none animate-in fade-in duration-200"
      onClick={onEnterFullscreen}
    >
      <div 
        className="w-full max-w-sm sm:max-w-md bg-[#0d1f14] brutal-border-4 border-[#00ff66] brutal-shadow-lg p-5 sm:p-6 text-center space-y-4 relative z-10"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glowing Badge */}
        <div className="inline-flex items-center justify-center w-14 h-14 bg-black border-2 border-[#00ff66] text-[#00ff66] shadow-[0_0_15px_rgba(0,255,102,0.4)] mb-1">
          <Unlock className="w-8 h-8 animate-bounce" />
        </div>

        {/* Header */}
        <div>
          <div className="inline-block px-2.5 py-0.5 bg-[#00ff66] text-black text-[10px] font-bold tracking-widest uppercase mb-1.5">
            Sanksi Dibatalkan // Access Restored
          </div>
          <h2 className="text-lg sm:text-xl font-extrabold text-[#00ff66] tracking-wider uppercase drop-shadow-[0_0_8px_rgba(0,255,102,0.6)]">
            AKSES DIBUKA OLEH PENGAWAS
          </h2>
          <p className="text-xs text-neutral-300 font-mono mt-1">
            Pengawas telah memaafkan pelanggaran dan memulihkan sesi ujian Anda.
          </p>
        </div>

        {/* Information box */}
        <div className="bg-black/80 border-2 border-[#00ff66]/40 p-3 text-left space-y-2 text-xs">
          <div className="flex items-center gap-2 text-[#00ff66] font-bold text-[11px] uppercase tracking-wide border-b border-[#00ff66]/30 pb-1">
            <ShieldCheck className="w-4 h-4 text-[#00ff66]" />
            <span>Protokol Integritas Ujian</span>
          </div>
          <p className="text-neutral-300 text-[11px] leading-relaxed">
            Sesuai regulasi investigasi siber, seluruh pengerjaan soal wajib dilakukan dalam <strong>Mode Layar Penuh (Fullscreen)</strong> satu layar.
          </p>
          <div className="bg-[#00ff66]/10 border border-[#00ff66]/30 p-2 text-[10.5px] text-[#00ff66] font-semibold">
            ✦ Berkas kasus yang belum terjawab telah dikembalikan ke status terbuka. Silakan lanjutkan investigasi Anda.
          </div>
        </div>

        {/* Enter Fullscreen Button */}
        <button
          onClick={() => {
            sound.playCorrect();
            onEnterFullscreen();
          }}
          className="w-full py-3 sm:py-3.5 bg-[#00ff66] hover:bg-[#20ff77] text-black font-extrabold text-xs sm:text-sm tracking-wider uppercase brutal-border brutal-shadow flex items-center justify-center gap-2 transition-transform active:translate-x-0.5 active:translate-y-0.5 cursor-pointer shadow-[0_0_20px_rgba(0,255,102,0.5)]"
        >
          <Maximize2 className="w-4 h-4 text-black shrink-0" />
          <span>MASUK LAYAR PENUH & LANJUTKAN UJIAN</span>
          <ArrowRight className="w-4 h-4 text-black shrink-0" />
        </button>

        <div className="text-[10px] text-neutral-400 font-mono">
          (Atau klik di mana saja pada layar ini untuk mengaktifkan Layar Penuh)
        </div>
      </div>
    </div>
  );
};
