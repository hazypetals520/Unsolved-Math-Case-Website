import React from 'react';
import type { StudentRecord } from '../types';
import { Users, Clock, CheckCircle2, ShieldAlert, Award } from 'lucide-react';

interface StatsCardsProps {
  students: StudentRecord[];
}

export const StatsCards: React.FC<StatsCardsProps> = ({ students }) => {
  const total = students.length;
  const inProgress = students.filter((s) => !s.isFinished && !s.isBlocked).length;
  const finished = students.filter((s) => s.isFinished).length;
  const blocked = students.filter((s) => s.isBlocked).length;

  const totalScore = students.reduce((acc, s) => acc + (s.score || 0), 0);
  const avgScore = total > 0 ? (totalScore / total).toFixed(1) : '0';

  const totalAccuracy = students.reduce((acc, s) => acc + (s.accuracy || 0), 0);
  const avgAccuracy = total > 0 ? Math.round(totalAccuracy / total) : 0;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3 select-none font-mono-code">
      {/* 1. Total Siswa */}
      <div className="bg-white p-3 brutal-border-2 brutal-shadow-sm flex flex-col justify-between">
        <div className="flex items-center justify-between text-neutral-500 text-[11px] font-bold uppercase tracking-wider">
          <span>TOTAL SISWA</span>
          <Users className="w-4 h-4 text-black" />
        </div>
        <div className="text-2xl sm:text-3xl font-extrabold text-black mt-1">
          {total}
        </div>
        <div className="text-[10px] text-neutral-600 mt-1">
          Terdaftar dalam sistem
        </div>
      </div>

      {/* 2. Sedang Mengerjakan */}
      <div className="bg-[#fff9e6] p-3 brutal-border-2 brutal-shadow-sm flex flex-col justify-between">
        <div className="flex items-center justify-between text-amber-800 text-[11px] font-bold uppercase tracking-wider">
          <span>SEDANG UJIAN</span>
          <Clock className="w-4 h-4 text-amber-700 animate-spin" />
        </div>
        <div className="text-2xl sm:text-3xl font-extrabold text-amber-900 mt-1">
          {inProgress}
        </div>
        <div className="text-[10px] text-amber-700 mt-1">
          Sesi aktif berjalan
        </div>
      </div>

      {/* 3. Selesai */}
      <div className="bg-[#e7f5ea] p-3 brutal-border-2 brutal-shadow-sm flex flex-col justify-between">
        <div className="flex items-center justify-between text-emerald-800 text-[11px] font-bold uppercase tracking-wider">
          <span>SUDAH SELESAI</span>
          <CheckCircle2 className="w-4 h-4 text-emerald-700" />
        </div>
        <div className="text-2xl sm:text-3xl font-extrabold text-emerald-900 mt-1">
          {finished}
        </div>
        <div className="text-[10px] text-emerald-700 mt-1">
          10 berkas terverifikasi
        </div>
      </div>

      {/* 4. Terblokir / Pelanggaran */}
      <div className={`p-3 brutal-border-2 brutal-shadow-sm flex flex-col justify-between transition-all ${
        blocked > 0 ? 'bg-red-100 border-red-700 text-red-950 animate-pulse' : 'bg-white text-neutral-900'
      }`}>
        <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider">
          <span className={blocked > 0 ? 'text-red-700 font-extrabold' : 'text-neutral-500'}>TERBLOKIR (2x)</span>
          <ShieldAlert className={`w-4 h-4 ${blocked > 0 ? 'text-red-600' : 'text-neutral-500'}`} />
        </div>
        <div className={`text-2xl sm:text-3xl font-extrabold mt-1 ${blocked > 0 ? 'text-red-600' : 'text-black'}`}>
          {blocked}
        </div>
        <div className={`text-[10px] mt-1 font-bold ${blocked > 0 ? 'text-red-700' : 'text-neutral-500'}`}>
          {blocked > 0 ? '⚠️ Butuh dibuka oleh admin' : 'Tidak ada pelanggaran fatal'}
        </div>
      </div>

      {/* 5. Rata-rata Kelas */}
      <div className="bg-white p-3 brutal-border-2 brutal-shadow-sm flex flex-col justify-between col-span-2 sm:col-span-1">
        <div className="flex items-center justify-between text-neutral-500 text-[11px] font-bold uppercase tracking-wider">
          <span>RATA-RATA KELAS</span>
          <Award className="w-4 h-4 text-amber-500" />
        </div>
        <div className="text-2xl sm:text-3xl font-extrabold text-black mt-1 flex items-baseline gap-1.5">
          <span>{avgScore}</span>
          <span className="text-xs font-bold text-neutral-500">/ 10</span>
          <span className="text-xs font-bold text-emerald-700 ml-1">({avgAccuracy}%)</span>
        </div>
        <div className="text-[10px] text-neutral-600 mt-1">
          Akurasi kumulatif siswa
        </div>
      </div>
    </div>
  );
};
