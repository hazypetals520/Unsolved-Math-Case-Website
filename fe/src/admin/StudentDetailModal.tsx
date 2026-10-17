import React from 'react';
import type { StudentRecord } from './types';
import { QUIZ_QUESTIONS } from '../data/quizData';
import { 
  X, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Unlock, 
  User, 
  Hash, 
  Clock, 
  ShieldAlert 
} from 'lucide-react';

interface StudentDetailModalProps {
  student: StudentRecord;
  onClose: () => void;
  onUnblock: (presensiNumber: string) => void;
}

export const StudentDetailModal: React.FC<StudentDetailModalProps> = ({
  student,
  onClose,
  onUnblock,
}) => {
  const formatAnswer = (val: any) => {
    if (val === undefined || val === null || val === '') {
      return <span className="text-neutral-400 italic">Belum Dijawab</span>;
    }
    if (Array.isArray(val)) {
      return <span className="font-mono-code font-bold bg-neutral-200 px-1.5 py-0.5 border border-black/30">[{val.join(', ')}]</span>;
    }
    if (typeof val === 'object') {
      return (
        <div className="flex flex-wrap gap-1">
          {Object.entries(val).map(([k, v]) => (
            <span key={k} className="text-[10px] bg-neutral-100 border border-black/30 px-1 py-0.5 font-bold">
              #{k} → [{String(v)}]
            </span>
          ))}
        </div>
      );
    }
    return <span className="font-mono-code font-bold bg-neutral-100 px-1.5 py-0.5 border border-black/30">{String(val)}</span>;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-2 sm:p-4 select-none font-mono-code animate-in fade-in duration-150">
      <div className="w-full max-w-4xl max-h-[92vh] bg-[#f4f1ea] brutal-border-4 brutal-shadow-lg flex flex-col overflow-hidden text-neutral-900">
        
        {/* Modal Header */}
        <div className="bg-black text-[#f4f1ea] px-3 sm:px-4 py-2 flex items-center justify-between border-b-4 border-black shrink-0">
          <div className="flex items-center gap-2">
            <span className={`w-3 h-3 inline-block ${student.isBlocked ? 'bg-red-500 animate-pulse' : student.isFinished ? 'bg-emerald-400' : 'bg-amber-400'}`} />
            <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider">
              DOSSIER REKAP SISWA // PRESENSI #{student.presensiNumber} — {student.fullName}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-6 h-6 bg-red-600 hover:bg-red-500 text-white font-bold text-xs flex items-center justify-center brutal-border cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Top Info Banner & Quick Controls */}
        <div className="p-3 bg-[#e8e4d8] border-b-2 border-black/30 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5 bg-white px-2 py-1 brutal-border">
              <User className="w-3.5 h-3.5 text-neutral-600" />
              <span className="font-bold uppercase">{student.fullName}</span>
            </div>
            <div className="flex items-center gap-1.5 bg-white px-2 py-1 brutal-border">
              <Hash className="w-3.5 h-3.5 text-neutral-600" />
              <span>PRESENSI: <strong>#{student.presensiNumber}</strong></span>
            </div>
            <div className="flex items-center gap-1.5 bg-white px-2 py-1 brutal-border">
              <Clock className="w-3.5 h-3.5 text-neutral-600" />
              <span>SKOR: <strong className="text-emerald-700">{student.score} / 10</strong> ({Math.round(((student.score || 0) / 10) * 100)}%)</span>
            </div>
            <div className={`flex items-center gap-1.5 px-2 py-1 brutal-border font-bold ${
              student.violationsCount >= 2 ? 'bg-red-600 text-white animate-pulse' : student.violationsCount === 1 ? 'bg-amber-400 text-black' : 'bg-emerald-100 text-emerald-900'
            }`}>
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>PELANGGARAN: {student.violationsCount}x {student.isBlocked ? '(TERBLOKIR)' : ''}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {student.isBlocked && (
              <button
                onClick={() => onUnblock(student.presensiNumber)}
                className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 brutal-border brutal-shadow-sm font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 cursor-pointer animate-bounce"
              >
                <Unlock className="w-4 h-4" />
                <span>LEPASKAN & BUKA BLOKIR</span>
              </button>
            )}

          </div>
        </div>

        {/* Violations Warning Bar if Blocked */}
        {student.isBlocked && (
          <div className="bg-red-100 border-b-2 border-red-700 px-3 py-2 flex items-center justify-between text-xs text-red-950 font-bold shrink-0">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600 animate-pulse shrink-0" />
              <span>
                SISWA INI DIBLOKIR OTOMATIS KARENA TERDETEKSI PINDAH TAB / LAYAR BELAH SEBANYAK 2X.
              </span>
            </div>
            <span className="text-[11px] underline cursor-pointer hover:text-black" onClick={() => onUnblock(student.presensiNumber)}>
              Klik &quot;LEPASKAN &amp; BUKA BLOKIR&quot; di atas untuk membebaskan siswa.
            </span>
          </div>
        )}

        {/* Scrollable Questions Breakdown Table */}
        <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-3">
          <div className="bg-white brutal-border-2 overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-black text-white text-[11px] uppercase tracking-wider border-b-2 border-black">
                  <th className="p-2 border-r border-white/20 w-16 text-center">NO</th>
                  <th className="p-2 border-r border-white/20">JUDUL KASUS SOAL</th>
                  <th className="p-2 border-r border-white/20 w-32">KATEGORI</th>
                  <th className="p-2 border-r border-white/20 w-28 text-center">STATUS</th>
                  <th className="p-2 border-r border-white/20">JAWABAN SISWA</th>
                  <th className="p-2">KUNCI RESMI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/20 font-sans">
                {QUIZ_QUESTIONS.map((q) => {
                  const attempt = student.attempts?.[q.id];
                  const status = student.caseStatuses?.[q.id] || 'unopened';
                  const isSolved = status === 'solved' || attempt?.isCorrect;
                  const isFailed = status === 'failed';

                  return (
                    <tr
                      key={q.id}
                      className={
                        isSolved
                          ? 'bg-emerald-50/70 hover:bg-emerald-100/70'
                          : isFailed
                          ? 'bg-red-50/70 hover:bg-red-100/70'
                          : 'hover:bg-neutral-50'
                      }
                    >
                      <td className="p-2 font-mono-code font-bold text-center border-r border-black/20">
                        #{q.id}
                      </td>
                      <td className="p-2 font-bold text-neutral-900 border-r border-black/20">
                        {q.fileName} — {q.title}
                      </td>
                      <td className="p-2 font-mono-code text-[11px] text-neutral-600 border-r border-black/20">
                        {q.category}
                      </td>
                      <td className="p-2 border-r border-black/20 text-center">
                        {isSolved ? (
                          <span className="inline-flex items-center gap-1 bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 brutal-border">
                            <CheckCircle2 className="w-3 h-3" /> BENAR
                          </span>
                        ) : isFailed ? (
                          <span className="inline-flex items-center gap-1 bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 brutal-border">
                            <XCircle className="w-3 h-3" /> SALAH
                          </span>
                        ) : (
                          <span className="inline-block bg-neutral-200 text-neutral-700 text-[10px] font-bold px-2 py-0.5 border border-black/30">
                            BELUM
                          </span>
                        )}
                      </td>
                      <td className="p-2 border-r border-black/20">
                        {attempt ? formatAnswer(attempt.userAnswer) : <span className="text-neutral-400 italic text-[11px]">-</span>}
                      </td>
                      <td className="p-2 font-bold text-emerald-800">
                        {formatAnswer(q.correctAnswer)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Violation Log History */}
          {student.violationHistory && student.violationHistory.length > 0 && (
            <div className="bg-white brutal-border-2 p-3 space-y-1.5">
              <div className="font-bold text-xs uppercase tracking-wider text-red-600 flex items-center gap-1.5 border-b border-black/20 pb-1">
                <AlertTriangle className="w-4 h-4" />
                <span>CATATAN RIWAYAT PELANGGARAN TERDETEKSI:</span>
              </div>
              <ul className="space-y-1 text-xs">
                {student.violationHistory.map((item, idx) => (
                  <li key={idx} className="flex items-center justify-between p-1.5 bg-red-50 border border-red-300">
                    <span className="font-bold text-red-900">{idx + 1}. {item.reason}</span>
                    <span className="text-neutral-500 text-[10px] font-mono-code">{new Date(item.timestamp).toLocaleTimeString('id-ID')}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 bg-[#e8e4d8] border-t-2 border-black/30 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="bg-black hover:bg-neutral-800 text-white px-5 py-1.5 brutal-border brutal-shadow font-bold text-xs uppercase tracking-wider cursor-pointer"
          >
            TUTUP DETAIL
          </button>
        </div>

      </div>
    </div>
  );
};
