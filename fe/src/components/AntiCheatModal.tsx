import React from 'react';
import { AlertTriangle, ShieldX, Ban } from 'lucide-react';
import { sound } from '../utils/sound';

interface AntiCheatModalProps {
  isOpen: boolean;
  violationsCount: number;
  isBlocked: boolean;
  onAcknowledge: () => void;
}

export const AntiCheatModal: React.FC<AntiCheatModalProps> = ({
  isOpen,
  violationsCount,
  isBlocked,
  onAcknowledge,
}) => {
  if (!isOpen && !isBlocked) return null;

  // BLOCKED mode: permanent full-screen overlay, no dismiss
  if (isBlocked) {
    return (
      <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/95 font-mono-code select-none p-3">
        <div className="w-full max-w-sm sm:max-w-md text-center space-y-4 p-4 relative z-10">
          {/* Flashing red border box */}
          <div className="bg-red-950 border-2 sm:border-4 border-red-600 p-4 animate-pulse">
            <Ban className="w-12 h-12 text-red-500 mx-auto mb-2" />
            <div className="text-red-400 text-lg sm:text-xl font-bold tracking-[0.2em] uppercase mb-1">
              AKSES DIBLOKIR
            </div>
            <div className="text-red-300 text-xs tracking-wider uppercase">
              INVESTIGASI DIHENTIKAN PAKSA
            </div>
          </div>

          <div className="bg-black border-2 border-red-800 p-3 text-left space-y-2">
            <div className="text-red-500 font-bold text-xs uppercase tracking-wider border-b border-red-800 pb-1.5">
              LOG PELANGGARAN SISTEM:
            </div>
            <div className="text-neutral-300 text-xs leading-relaxed">
              Pengguna telah melakukan <span className="text-red-400 font-bold">{violationsCount}x pelanggaran protokol keamanan</span> (terdeteksi aktivitas: layar belah / split-screen, floating app, mematikan layar, atau meninggalkan sesi).
            </div>
            <div className="text-neutral-400 text-[11px] leading-relaxed">
              Sesuai protokol keamanan investigasi: Sesi ini dihentikan paksa. Semua berkas yang belum diselesaikan telah ditandai sebagai <span className="text-red-400 font-bold">GAGAL</span>.
            </div>
            <div className="bg-red-900/40 border border-red-700 p-1.5 flex items-center justify-between">
              <span className="text-red-300 text-xs font-bold">STATUS SESI:</span>
              <span className="text-red-400 text-[11px] font-bold bg-red-900 px-2 py-0.5 border border-red-600">
                TERMINATED — {violationsCount}x VIOLATIONS
              </span>
            </div>
          </div>

          <div className="text-neutral-500 text-[10px]">
            Laporan akhir sedang dibuka otomatis...
          </div>
        </div>
      </div>
    );
  }

  // WARNING mode: normal dismissible warning (1st violation)
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-red-950/80 p-2 sm:p-3 font-mono-code select-none">
      <div className="w-full max-w-sm sm:max-w-md bg-[#fff1f2] brutal-border-2 sm:brutal-border-4 p-3.5 sm:p-4.5 brutal-shadow-lg animate-in fade-in zoom-in-90 duration-150 border-red-700">
        
        {/* Header */}
        <div className="bg-red-600 text-white p-2 brutal-border-2 flex items-center gap-2 mb-3">
          <ShieldX className="w-5 h-5 animate-pulse" />
          <div className="font-bold text-xs sm:text-sm tracking-wider uppercase">
            PELANGGARAN PROTOKOL TERDETEKSI!
          </div>
        </div>

        {/* Content */}
        <div className="space-y-3 text-xs text-neutral-900">
          <div className="bg-white p-2.5 brutal-border-2 font-bold text-red-600 text-xs leading-snug">
            &quot;Terdeteksi aktivitas terlarang: Layar belah (split screen), floating tab, mematikan layar ponsel, atau berpindah aplikasi!&quot;
          </div>

          <p className="leading-snug text-[11px] text-neutral-800">
            Protokol Ujian: <em>Dilarang membuka layar belah, floating apps, atau mematikan layar selama pengerjaan.</em>
          </p>

          <div className="bg-red-100 p-2 brutal-border-2 flex items-center justify-between font-bold text-red-900 text-xs">
            <span>TOTAL PELANGGARAN TERREKAM:</span>
            <span className="text-sm bg-red-600 text-white px-2 py-0.5 rounded-xs">
              {violationsCount}x
            </span>
          </div>

          {/* Warning for approaching limit */}
          <div className={`p-2 brutal-border-2 text-[10px] sm:text-[11px] font-bold ${
            violationsCount >= 1 ? 'bg-amber-100 border-amber-600 text-amber-900' : 'bg-neutral-100 text-neutral-700'
          }`}>
            ⚠ PERINGATAN: Batas maksimum pelanggaran adalah <strong>2x</strong>.
            Anda memiliki <strong>{Math.max(0, 2 - violationsCount)}x kesempatan tersisa</strong> sebelum kuis diblokir permanen!
          </div>

          <div className="text-[10px] sm:text-[11px] text-neutral-700 leading-normal">
            Peringatan ini telah dicatat dalam log integritas. Harap tetap berada di dalam aplikasi dalam satu layar penuh.
          </div>
        </div>

        {/* Button */}
        <div className="mt-4 flex justify-end">
          <button
            onClick={() => {
              sound.playClick();
              onAcknowledge();
            }}
            className="w-full sm:w-auto bg-black hover:bg-neutral-800 text-white px-5 py-2 brutal-border-2 brutal-shadow font-bold text-xs uppercase tracking-wider cursor-pointer active:translate-x-0.5 active:translate-y-0.5 flex items-center justify-center gap-2"
          >
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <span>SAYA MENGERTI, KEMBALI KE KASUS</span>
          </button>
        </div>
      </div>
    </div>
  );
};
