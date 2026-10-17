import { useState, useEffect, useCallback, useMemo } from 'react';
import type { StudentRecord } from './types';
import { StatsCards } from './StatsCards';
import { StudentDetailModal } from './StudentDetailModal';
import { AdminLogin } from './AdminLogin';
import { 
  ShieldAlert, 
  Search, 
  RotateCw, 
  Download, 
  Unlock, 
  Eye, 
  Radio, 
  CheckCircle2, 
  Clock, 
  AlertOctagon,
  Sparkles,
  LogOut,
  ArrowLeft
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface AdminDashboardProps {
  onBackToStudent?: () => void;
}

const configuredApiUrl = import.meta.env.VITE_API_URL;
const isLocalApiUrl = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?(\/|$)/i.test(configuredApiUrl || '');
const API_BASE = (
  import.meta.env.PROD && isLocalApiUrl
    ? '/api'
    : configuredApiUrl ||
      (typeof window !== 'undefined' && window.location.hostname !== 'localhost' ? '/api' : 'http://localhost:3001/api')
).replace(/\/+$/, '');

export function AdminDashboard({ onBackToStudent }: AdminDashboardProps) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem('cyber_admin_auth') === 'authenticated';
  });

  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<StudentRecord | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'blocked' | 'finished' | 'in_progress'>('all');
  const [isServerConnected, setIsServerConnected] = useState<boolean>(true);
  const [lastSyncedTime, setLastSyncedTime] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 4000);
  };

  // Fetch students from backend
  const fetchStudents = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/students`);
      if (res.ok) {
        const data = await res.json();
        setStudents(data);
        setIsServerConnected(true);
        setLastSyncedTime(new Date().toLocaleTimeString('id-ID'));
      } else {
        setIsServerConnected(false);
      }
    } catch {
      setIsServerConnected(false);
    }
  }, []);

  // Poll server every 2 seconds for live real-time exam monitoring
  useEffect(() => {
    fetchStudents();
    const interval = setInterval(fetchStudents, 2000);
    return () => clearInterval(interval);
  }, [fetchStudents]);

  // Also listen to BroadcastChannel for instant local updates across tabs
  useEffect(() => {
    if (typeof BroadcastChannel !== 'undefined') {
      const channel = new BroadcastChannel('cyber_exam_channel');
      channel.onmessage = () => {
        fetchStudents();
      };
      return () => {
        channel.close();
      };
    }
  }, [fetchStudents]);

  // Unblock student action (LEPASKAN)
  const handleUnblock = async (presensiNumber: string) => {
    try {
      const res = await fetch(`${API_BASE}/students/${presensiNumber}/unblock`, {
        method: 'POST',
      });
      if (res.ok) {
        const data = await res.json();
        showToast(`BERHASIL: Blokir siswa presensi #${presensiNumber} telah dilepaskan! Siswa dapat melanjutkan ujian.`);
        try {
          confetti({ particleCount: 50, spread: 60, origin: { y: 0.5 } });
        } catch {}

        // Broadcast to student tab immediately
        if (typeof BroadcastChannel !== 'undefined') {
          const channel = new BroadcastChannel('cyber_exam_channel');
          channel.postMessage({ type: 'UNBLOCKED', presensiNumber });
          channel.close();
        }

        fetchStudents();
        if (selectedStudent?.presensiNumber === presensiNumber && data.student) {
          setSelectedStudent(data.student);
        }
      }
    } catch (err) {
      console.error(err);
      showToast('Gagal membuka blokir: Backend tidak merespon');
    }
  };

  // Reset a student's exam state without clearing the block status or violation record.
  const handleReset = async (presensiNumber: string) => {
    try {
      const res = await fetch(`${API_BASE}/students/${presensiNumber}/reset`, {
        method: 'POST',
      });
      if (res.ok) {
        const data = await res.json();
        showToast(`BERHASIL: Data jawaban siswa presensi #${presensiNumber} direset ulang.`);

        if (typeof BroadcastChannel !== 'undefined') {
          const channel = new BroadcastChannel('cyber_exam_channel');
          channel.postMessage({ type: 'RESET', presensiNumber });
          channel.close();
        }

        fetchStudents();
        if (selectedStudent?.presensiNumber === presensiNumber && data.student) {
          setSelectedStudent(data.student);
        }
      } else {
        showToast('Gagal reset data siswa: backend menolak permintaan');
      }
    } catch (err) {
      console.error(err);
      showToast('Gagal reset data siswa: Backend tidak merespon');
    }
  };

  // Export to CSV
  const handleExportCSV = () => {
    if (students.length === 0) {
      alert('Belum ada data siswa untuk diexport.');
      return;
    }

    const headers = [
      'No. Presensi',
      'Nama Lengkap',
      'Waktu Login',
      'Soal Terjawab',
      'Benar (Skor)',
      'Akurasi (%)',
      'Pelanggaran',
      'Status Ujian',
      'Status Blokir'
    ];

    const rows = students.map((s) => [
      `"${s.presensiNumber}"`,
      `"${s.fullName}"`,
      `"${new Date(s.loggedInAt).toLocaleString('id-ID')}"`,
      s.totalAttempted || 0,
      s.score || 0,
      s.accuracy || 0,
      s.violationsCount || 0,
      s.isFinished ? 'SELESAI' : 'SEDANG BERJALAN',
      s.isBlocked ? 'TERBLOKIR (2x)' : 'NORMAL'
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `rekap_ujian_matematika_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtered students
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      // Search
      const matchesSearch =
        s.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.presensiNumber.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchesSearch) return false;

      // Status Filter
      if (statusFilter === 'blocked') return s.isBlocked;
      if (statusFilter === 'finished') return s.isFinished;
      if (statusFilter === 'in_progress') return !s.isFinished && !s.isBlocked;
      return true;
    });
  }, [students, searchQuery, statusFilter]);

  const blockedCount = students.filter((s) => s.isBlocked).length;
  const finishedCount = students.filter((s) => s.isFinished).length;
  const inProgressCount = students.filter((s) => !s.isFinished && !s.isBlocked).length;

  if (!isAuthenticated) {
    return <AdminLogin onLoginSuccess={() => setIsAuthenticated(true)} onBackToStudent={onBackToStudent} />;
  }

  const handleLogout = () => {
    sessionStorage.removeItem('cyber_admin_auth');
    setIsAuthenticated(false);
  };

  return (
    <div className="h-screen min-h-0 bg-[#0c0d10] text-[#f4f1ea] font-mono-code p-2 sm:p-4 select-none overflow-y-auto">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-black text-amber-300 px-4 py-2 brutal-border-2 brutal-shadow flex items-center gap-2 text-xs font-bold animate-in slide-in-from-top-3">
          <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="ml-2 text-white hover:text-red-400 font-bold">×</button>
        </div>
      )}

      {/* Main Container */}
      <div className="max-w-7xl mx-auto space-y-3 sm:space-y-4">
        
        {/* Top Header Bar */}
        <header className="bg-[#f4f1ea] text-black brutal-border-4 brutal-shadow-lg p-3 sm:p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-black text-[#f4f1ea] brutal-border flex items-center justify-center shrink-0">
              <ShieldAlert className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <div className="text-[10px] text-red-600 font-bold tracking-widest uppercase">
                BIRO PENGAWAS UJIAN MATEMATIKA SIBER 1994 // INTEGRATED SYSTEM
              </div>
              <h1 className="text-sm sm:text-lg font-extrabold uppercase tracking-wider text-black">
                DASHBOARD ADMIN // REKAP HASIL & KONTROL PENGAWASAN
              </h1>
            </div>
          </div>

          {/* Server Connection Badge, Live Status & Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
            <div className={`px-2.5 py-1 brutal-border flex items-center gap-1.5 ${
              isServerConnected ? 'bg-emerald-100 text-emerald-900 border-emerald-800' : 'bg-red-100 text-red-900 border-red-800'
            }`}>
              <Radio className={`w-3.5 h-3.5 ${isServerConnected ? 'text-emerald-700 animate-pulse' : 'text-red-600'}`} />
              <span>{isServerConnected ? 'SERVER ONLINE' : 'SERVER OFFLINE'}</span>
            </div>

            <div className="bg-white px-2.5 py-1 brutal-border text-neutral-800">
              SYNC: {lastSyncedTime || '-'}
            </div>

            <button
              onClick={fetchStudents}
              className="bg-black hover:bg-neutral-800 text-[#f4f1ea] px-3 py-1 brutal-border brutal-shadow-sm flex items-center gap-1.5 cursor-pointer active:translate-x-0.5 active:translate-y-0.5"
              title="Refresh Data Sekarang"
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span>REFRESH</span>
            </button>

            {onBackToStudent && (
              <button
                onClick={onBackToStudent}
                className="bg-neutral-800 hover:bg-black text-[#00ff66] px-3 py-1 brutal-border brutal-shadow-sm flex items-center gap-1.5 cursor-pointer active:translate-x-0.5 active:translate-y-0.5"
                title="Kembali ke Layar Ujian Siswa"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>KE UJIAN SISWA</span>
              </button>
            )}

            <button
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 brutal-border brutal-shadow-sm flex items-center gap-1.5 cursor-pointer active:translate-x-0.5 active:translate-y-0.5"
              title="Keluar dari Akun Admin"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>LOGOUT</span>
            </button>
          </div>
        </header>

        {/* Global Stats Summary Cards */}
        <StatsCards students={students} />

        {/* Action Controls & Filters Toolbar */}
        <div className="bg-[#f4f1ea] text-black brutal-border-2 brutal-shadow p-3 flex flex-col md:flex-row md:items-center justify-between gap-3">
          
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-500" />
            <input
              type="text"
              placeholder="Cari berdasarkan Nama atau No. Presensi..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-white text-black text-xs font-bold brutal-border focus:outline-none focus:bg-amber-50"
            />
          </div>

          {/* Filter Status Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs font-bold">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-2.5 py-1 brutal-border transition-all cursor-pointer ${
                statusFilter === 'all' ? 'bg-black text-white brutal-shadow-sm' : 'bg-white hover:bg-neutral-100 text-black'
              }`}
            >
              SEMUA ({students.length})
            </button>

            <button
              onClick={() => setStatusFilter('blocked')}
              className={`px-2.5 py-1 brutal-border transition-all cursor-pointer flex items-center gap-1 ${
                statusFilter === 'blocked'
                  ? 'bg-red-600 text-white brutal-shadow-sm'
                  : blockedCount > 0
                  ? 'bg-red-100 text-red-900 border-red-700 font-extrabold animate-pulse'
                  : 'bg-white hover:bg-neutral-100 text-black'
              }`}
            >
              <AlertOctagon className="w-3.5 h-3.5" />
              <span>TERBLOKIR ({blockedCount})</span>
            </button>

            <button
              onClick={() => setStatusFilter('finished')}
              className={`px-2.5 py-1 brutal-border transition-all cursor-pointer flex items-center gap-1 ${
                statusFilter === 'finished' ? 'bg-emerald-700 text-white brutal-shadow-sm' : 'bg-white hover:bg-neutral-100 text-black'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>SELESAI ({finishedCount})</span>
            </button>

            <button
              onClick={() => setStatusFilter('in_progress')}
              className={`px-2.5 py-1 brutal-border transition-all cursor-pointer flex items-center gap-1 ${
                statusFilter === 'in_progress' ? 'bg-amber-600 text-black brutal-shadow-sm' : 'bg-white hover:bg-neutral-100 text-black'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>SEDANG UJIAN ({inProgressCount})</span>
            </button>
          </div>

          {/* Export Tools */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 brutal-border brutal-shadow-sm font-bold text-xs uppercase flex items-center gap-1.5 cursor-pointer active:translate-x-0.5 active:translate-y-0.5"
              title="Download File Rekap CSV untuk Excel"
            >
              <Download className="w-3.5 h-3.5" />
              <span>EXPORT CSV</span>
            </button>

          </div>
        </div>

        {/* Main Rekap Table Container */}
        <div className="bg-[#f4f1ea] text-black brutal-border-4 brutal-shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-black text-[#f4f1ea] uppercase text-[11px] tracking-wider border-b-4 border-black">
                  <th className="p-2.5 border-r border-white/20 w-16 text-center">PRESENSI</th>
                  <th className="p-2.5 border-r border-white/20">NAMA LENGKAP SISWA</th>
                  <th className="p-2.5 border-r border-white/20 text-center w-36">STATUS UJIAN</th>
                  <th className="p-2.5 border-r border-white/20 w-44">PROGRESS SOAL</th>
                  <th className="p-2.5 border-r border-white/20 text-center w-28">SKOR NILAI</th>
                  <th className="p-2.5 border-r border-white/20 text-center w-24">AKURASI</th>
                  <th className="p-2.5 border-r border-white/20 text-center w-36">PELANGGARAN TAB</th>
                  <th className="p-2.5 border-r border-white/20 text-center w-28">AKTIF TERAKHIR</th>
                  <th className="p-2.5 text-center w-52">AKSI PENGAWAS</th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-black/20 font-sans">
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-neutral-500 font-mono-code font-bold">
                      {students.length === 0
                        ? 'BELUM ADA SISWA YANG LOGIN ATAU MENGERJAKAN UJIAN. SISWA AKAN MUNCUL SECARA OTOMATIS DI SINI SAAT LOGIN DI FE.'
                        : 'TIDAK ADA SISWA YANG SESUAI DENGAN FILTER PENCARIAN.'}
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((s) => {
                    const isBlocked = s.isBlocked;
                    const isFinished = s.isFinished;
                    const progressPercent = Math.round(((s.totalAttempted || 0) / 10) * 100);

                    return (
                      <tr
                        key={s.presensiNumber}
                        className={`transition-colors ${
                          isBlocked
                            ? 'bg-red-100/90 hover:bg-red-200/90'
                            : isFinished
                            ? 'bg-emerald-50/70 hover:bg-emerald-100/70'
                            : 'hover:bg-white/80'
                        }`}
                      >
                        {/* No Presensi */}
                        <td className="p-2.5 text-center font-mono-code font-bold text-sm border-r-2 border-black/20">
                          #{s.presensiNumber}
                        </td>

                        {/* Nama Siswa */}
                        <td className="p-2.5 font-bold text-sm text-neutral-900 border-r-2 border-black/20">
                          <div className="flex items-center gap-1.5">
                            <span className="uppercase">{s.fullName}</span>
                            {isBlocked && (
                              <span className="bg-red-600 text-white text-[9px] font-bold px-1.5 py-0.2 rounded-xs font-mono-code animate-pulse">
                                TERBLOKIR
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Status Ujian */}
                        <td className="p-2.5 text-center border-r-2 border-black/20">
                          {isBlocked ? (
                            <span className="inline-flex items-center gap-1 bg-red-600 text-white px-2 py-0.5 text-[10px] font-bold brutal-border font-mono-code animate-pulse">
                              <AlertOctagon className="w-3 h-3" />
                              <span>TERBLOKIR (2x)</span>
                            </span>
                          ) : isFinished ? (
                            <span className="inline-flex items-center gap-1 bg-emerald-600 text-white px-2 py-0.5 text-[10px] font-bold brutal-border font-mono-code">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>SELESAI (10/10)</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 bg-amber-400 text-black px-2 py-0.5 text-[10px] font-bold brutal-border font-mono-code">
                              <Clock className="w-3 h-3" />
                              <span>BERJALAN</span>
                            </span>
                          )}
                        </td>

                        {/* Progress Soal */}
                        <td className="p-2.5 border-r-2 border-black/20 font-mono-code">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-3.5 bg-white border border-black overflow-hidden flex">
                              <div
                                className="bg-black h-full transition-all duration-300"
                                style={{ width: `${progressPercent}%` }}
                              />
                            </div>
                            <span className="text-[11px] font-bold shrink-0">{s.totalAttempted || 0}/10</span>
                          </div>
                        </td>

                        {/* Skor Nilai */}
                        <td className="p-2.5 text-center font-mono-code font-bold text-sm border-r-2 border-black/20 text-emerald-800">
                          {s.score || 0} <span className="text-[11px] text-neutral-500">/ 10</span>
                        </td>

                        {/* Akurasi (Selalu dihitung terhadap total 10 soal) */}
                        <td className="p-2.5 text-center font-mono-code border-r-2 border-black/20">
                          {(() => {
                            const calculatedAccuracy = Math.round(((s.score || 0) / 10) * 100);
                            return (
                              <span
                                className={`px-1.5 py-0.5 text-[11px] font-bold ${
                                  calculatedAccuracy >= 75
                                    ? 'bg-emerald-600 text-white'
                                    : calculatedAccuracy >= 50
                                    ? 'bg-amber-400 text-black'
                                    : 'bg-red-600 text-white'
                                }`}
                              >
                                {calculatedAccuracy}%
                              </span>
                            );
                          })()}
                        </td>

                        {/* Pelanggaran */}
                        <td className="p-2.5 text-center font-mono-code border-r-2 border-black/20">
                          <span
                            className={`px-2 py-0.5 text-[11px] font-bold border ${
                              s.violationsCount >= 2
                                ? 'bg-red-600 text-white border-black animate-pulse'
                                : s.violationsCount === 1
                                ? 'bg-amber-300 text-black border-black'
                                : 'bg-neutral-100 text-neutral-700 border-black/30'
                            }`}
                          >
                            {s.violationsCount || 0}x DETEKSI
                          </span>
                        </td>

                        {/* Waktu Aktif */}
                        <td className="p-2.5 text-center font-mono-code text-[11px] text-neutral-600 border-r-2 border-black/20">
                          {s.lastActiveAt ? new Date(s.lastActiveAt).toLocaleTimeString('id-ID') : '-'}
                        </td>

                        {/* Aksi Pengawas */}
                        <td className="p-2.5 text-center font-mono-code">
                          <div className="flex items-center justify-center gap-1.5 flex-wrap">
                            {/* Tombol Lepaskan / Buka Blokir jika terdeteksi 2x */}
                            {isBlocked ? (
                              <button
                                onClick={() => handleUnblock(s.presensiNumber)}
                                className="bg-emerald-600 hover:bg-emerald-500 text-white px-2.5 py-1 brutal-border brutal-shadow-sm font-bold text-[10.5px] uppercase flex items-center gap-1 cursor-pointer animate-bounce"
                                title="Buka blokir dan izinkan siswa melanjutkan ujian"
                              >
                                <Unlock className="w-3.5 h-3.5" />
                                <span>LEPASKAN</span>
                              </button>
                            ) : null}

                            {/* Tombol Reset Ulang Jawaban Siswa */}
                            <button
                              onClick={() => handleReset(s.presensiNumber)}
                              className="bg-amber-500 hover:bg-amber-400 text-black px-2 py-1 brutal-border brutal-shadow-sm font-bold text-[10.5px] uppercase flex items-center gap-1 cursor-pointer"
                              title="Reset jawaban siswa agar mulai dari awal"
                            >
                              <RotateCw className="w-3.5 h-3.5" />
                              <span>RESET</span>
                            </button>

                            {/* Tombol Detail Rekap */}
                            <button
                              onClick={() => setSelectedStudent(s)}
                              className="bg-white hover:bg-neutral-100 text-black px-2 py-1 brutal-border brutal-shadow-sm font-bold text-[10.5px] uppercase flex items-center gap-1 cursor-pointer"
                              title="Lihat rincian jawaban per nomor soal"
                            >
                              <Eye className="w-3.5 h-3.5 text-neutral-700" />
                              <span>DETAIL</span>
                            </button>

                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* Student Detail Modal */}
      {selectedStudent && (
        <StudentDetailModal
          student={selectedStudent}
          onClose={() => setSelectedStudent(null)}
          onUnblock={handleUnblock}
          onReset={handleReset}
        />
      )}

    </div>
  );
}
export default AdminDashboard;
