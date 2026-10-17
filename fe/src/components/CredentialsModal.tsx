import React, { useState } from 'react';
import type { InvestigatorProfile } from '../types/quiz';
import { ShieldCheck, AlertOctagon, User, Hash, Lock } from 'lucide-react';
import { sound } from '../utils/sound';

interface CredentialsModalProps {
  isOpen: boolean;
  onLogin: (profile: InvestigatorProfile) => void;
  onCancel: () => void;
}

export const CredentialsModal: React.FC<CredentialsModalProps> = ({
  isOpen,
  onLogin,
  onCancel,
}) => {
  const [fullName, setFullName] = useState('');
  const [presensiNumber, setPresensiNumber] = useState('');
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const handleInitialSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !presensiNumber.trim()) {
      sound.playWrong();
      setErrorMessage('Harap isi Nama Lengkap dan Nomor Presensi secara lengkap!');
      return;
    }
    sound.playClick();
    setErrorMessage('');
    setShowWarningModal(true);
  };

  const handleFinalConfirm = () => {
    sound.playWindowOpen();
    onLogin({
      fullName: fullName.trim(),
      presensiNumber: presensiNumber.trim(),
      loggedInAt: new Date().toISOString(),
    });
  };

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/60 p-1 sm:p-2.5 font-mono-code select-none overflow-hidden">
      {/* Warning Confirmation Step */}
      {showWarningModal ? (
        <div className="w-full max-w-sm sm:max-w-md bg-[#fff1f2] brutal-border-2 sm:brutal-border-4 p-2.5 sm:p-4 brutal-shadow-lg animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center gap-2 border-b-2 sm:border-b-4 border-black pb-1.5 mb-2.5 bg-red-600 text-white p-1.5">
            <AlertOctagon className="w-4 h-4 sm:w-5 sm:h-5 animate-pulse" />
            <span className="font-bold tracking-wider text-xs sm:text-sm uppercase">
              PERINGATAN KEAMANAN INVESTIGASI
            </span>
          </div>

          <div className="space-y-2 sm:space-y-3 text-neutral-900 text-xs">
            <div className="bg-white brutal-border-2 p-2 sm:p-2.5 font-bold text-red-600 text-[11.5px] sm:text-sm leading-snug">
              &quot;PERINGATAN: Dilarang membuka layar belah (split screen), floating app, mematikan layar ponsel, atau berpindah aplikasi selama ujian.&quot;
            </div>

            <p className="leading-relaxed text-[10.5px] sm:text-xs">
              Sistem pengawasan terhubung aktif. Tindakan meninggalkan layar ujian, membagi layar (split screen), membuka floating tab/calculator, atau mematikan layar akan dicatat sebagai <strong>PELANGGARAN PROTOKOL (Maksimal 2x)</strong> sebelum akses diblokir permanen.
            </p>

            <div className="bg-[#e8e4d8] p-1.5 sm:p-2 brutal-border-2 text-[10px] sm:text-[11px] leading-normal text-neutral-800">
              Agen: <strong>{fullName.toUpperCase()}</strong> (Presensi: <strong>#{presensiNumber}</strong>)
              <br />
              Status: Menunggu konfirmasi kesiapan penyelidikan.
            </div>
          </div>

          <div className="mt-3 sm:mt-4 flex flex-col sm:flex-row gap-1.5 sm:gap-2 justify-end">
            <button
              type="button"
              onClick={() => {
                sound.playClick();
                setShowWarningModal(false);
              }}
              className="bg-white hover:bg-neutral-200 text-black px-3 py-1.5 brutal-border-2 brutal-shadow-sm font-bold text-xs cursor-pointer active:translate-x-0.5 active:translate-y-0.5"
            >
              KEMBALI EDIT DATA
            </button>
            <button
              type="button"
              onClick={handleFinalConfirm}
              className="bg-red-600 hover:bg-red-500 text-white px-4 py-1.5 brutal-border-2 brutal-shadow font-bold text-xs tracking-wider cursor-pointer active:translate-x-0.5 active:translate-y-0.5"
            >
              I UNDERSTAND / PROCEED
            </button>
          </div>
        </div>
      ) : (
        /* Agent Credentials Form */
        <div className="w-full max-w-sm sm:max-w-md bg-[#fcfbf7] brutal-border-2 sm:brutal-border-4 p-2.5 sm:p-4.5 brutal-shadow-lg animate-in fade-in zoom-in-95 duration-150">
          {/* Retro Window Header */}
          <div className="flex items-center justify-between border-b-2 sm:border-b-4 border-black pb-1.5 mb-2.5">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-red-600" />
              <span className="font-bold text-xs sm:text-sm tracking-wider uppercase">
                SECURE AGENT LOGIN // AUTH
              </span>
            </div>
            <button
              onClick={() => {
                sound.playClick();
                onCancel();
              }}
              className="w-5 h-5 bg-red-600 text-white font-bold text-xs flex items-center justify-center brutal-border hover:bg-red-700 cursor-pointer"
            >
              ×
            </button>
          </div>

          <p className="text-[11px] text-neutral-700 mb-3 leading-snug">
            Masukkan identitas agen penyelidik resmi untuk mendapatkan izin akses ke 10 berkas kasus matematika.
          </p>

          {errorMessage && (
            <div className="bg-red-100 border-2 border-red-600 text-red-800 px-2.5 py-1.5 text-xs font-bold mb-3">
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleInitialSubmit} className="space-y-3">
            <div>
              <label className="block text-[11px] font-bold text-black uppercase mb-1 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-neutral-700" />
                Nama Lengkap Penyelidik:
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => {
                  sound.playKey();
                  setFullName(e.target.value);
                }}
                placeholder="Contoh: Sherlock Cyber"
                className="w-full bg-white text-black px-2.5 py-2 text-xs font-bold brutal-border-2 focus:outline-none focus:bg-amber-50"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-black uppercase mb-1 flex items-center gap-1.5">
                <Hash className="w-3.5 h-3.5 text-neutral-700" />
                Nomor Presensi / ID Agen:
              </label>
              <input
                type="text"
                value={presensiNumber}
                onChange={(e) => {
                  sound.playKey();
                  setPresensiNumber(e.target.value);
                }}
                placeholder="Contoh: 18 atau AG-018"
                className="w-full bg-white text-black px-2.5 py-2 text-xs font-bold brutal-border-2 focus:outline-none focus:bg-amber-50"
              />
            </div>

            <div className="pt-1.5">
              <button
                type="submit"
                className="w-full bg-black hover:bg-neutral-800 text-[#f4f1ea] py-2.5 text-xs sm:text-sm font-bold uppercase tracking-wider brutal-border brutal-shadow brutal-shadow-active flex items-center justify-center gap-2 cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>VERIFIKASI & AKSES TERMINAL</span>
              </button>
            </div>
          </form>

          <div className="mt-2.5 text-center text-[10px] text-neutral-500">
            ENCRYPTION: 128-BIT SHA-2 // SESSION ID: #8820-MATH
          </div>
        </div>
      )}
    </div>
  );
};
