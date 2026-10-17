import { useState, type FormEvent } from 'react';
import { ShieldAlert, KeyRound, Eye, EyeOff, Terminal, ArrowRight, Lock, AlertTriangle, ArrowLeft } from 'lucide-react';

interface AdminLoginProps {
  onLoginSuccess: () => void;
  onBackToStudent?: () => void;
}

const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || 'chrysaloki2949';

export function AdminLogin({ onLoginSuccess, onBackToStudent }: AdminLoginProps) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [shake, setShake] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    setTimeout(() => {
      if (password.trim() === ADMIN_PASSWORD) {
        setIsLoading(false);
        sessionStorage.setItem('cyber_admin_auth', 'authenticated');
        onLoginSuccess();
      } else {
        setIsLoading(false);
        setError('AKSES DITOLAK: Passcode otentikasi tidak valid!');
        setShake(true);
        setTimeout(() => setShake(false), 500);
      }
    }, 400);
  };

  return (
    <div className="min-h-screen bg-[#0c0d10] text-[#1a1a1a] flex flex-col items-center justify-center p-4 relative overflow-hidden font-mono-code">
      {/* Background Grid Pattern & Ambience */}
      <div 
        className="absolute inset-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(to right, #00ff66 1px, transparent 1px),
            linear-gradient(to bottom, #00ff66 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }}
      />

      {/* Floating Accent Glow */}
      <div className="absolute w-96 h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Terminal Card */}
      <div className={`w-full max-w-md relative z-10 transition-transform ${shake ? 'animate-bounce' : ''}`}>
        {/* Terminal Header Tab */}
        <div className="bg-[#1e222b] text-white px-4 py-2 border-t-4 border-x-4 border-black flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-[#00ff66]" />
            <span className="text-xs font-bold tracking-widest text-gray-200">
              SYS://ADMIN_GATEWAY.AUTH
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 bg-red-500 rounded-full border border-black inline-block" />
            <span className="w-3 h-3 bg-yellow-400 rounded-full border border-black inline-block" />
            <span className="w-3 h-3 bg-green-500 rounded-full border border-black inline-block" />
          </div>
        </div>

        {/* Content Box */}
        <div className="bg-[#f4f1ea] brutal-border brutal-shadow-lg p-6 sm:p-8">
          {/* Logo & Classification Header */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-red-500 brutal-border brutal-shadow-sm mb-3 text-white">
              <Lock className="w-7 h-7" />
            </div>
            
            <div className="inline-block px-2.5 py-0.5 bg-black text-[#00ff66] text-[10px] font-bold tracking-widest mb-2 uppercase">
              Clearance Level 5 // Restricted
            </div>

            <h1 className="text-xl sm:text-2xl font-black tracking-tight uppercase text-black">
              Command Dashboard
            </h1>
            <p className="text-xs text-gray-600 font-mono mt-1">
              Portal Verifikasi Pengawas & Administrator Ujian
            </p>
          </div>

          {/* Error Message Alert */}
          {error && (
            <div className="mb-5 p-3 bg-red-100 border-2 border-red-600 brutal-shadow-sm text-red-900 text-xs font-bold flex items-center gap-2.5">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label 
                htmlFor="admin-password" 
                className="block text-xs font-bold uppercase tracking-wider text-black mb-1.5 flex items-center gap-1.5"
              >
                <KeyRound className="w-3.5 h-3.5 text-black" />
                Passcode Akses Administrator
              </label>
              
              <div className="relative">
                <input
                  id="admin-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan password admin..."
                  autoFocus
                  required
                  className="w-full px-3.5 py-2.5 bg-white brutal-border text-sm font-mono tracking-wider focus:outline-none focus:ring-2 focus:ring-black pr-11 text-black"
                />
                
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-gray-600 hover:text-black transition-colors"
                  title={showPassword ? 'Sembunyikan' : 'Tampilkan'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || !password.trim()}
              className="w-full py-3 bg-black text-[#00ff66] hover:bg-[#1a1a1a] hover:text-white brutal-border brutal-shadow font-bold text-xs sm:text-sm tracking-wider uppercase flex items-center justify-center gap-2 transition-all active:translate-x-0.5 active:translate-y-0.5 active:shadow-none disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isLoading ? (
                <>
                  <span className="inline-block w-4 h-4 border-2 border-[#00ff66] border-t-transparent rounded-full animate-spin" />
                  MEMVERIFIKASI AKSES...
                </>
              ) : (
                <>
                  BUKA DASHBOARD PENGURUS
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Back to Student Portal Button */}
          {onBackToStudent && (
            <div className="mt-4 pt-3 border-t border-black/10 text-center">
              <button
                type="button"
                onClick={onBackToStudent}
                className="text-xs text-neutral-600 hover:text-black font-bold flex items-center justify-center gap-1.5 mx-auto cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Kembali ke Halaman Siswa</span>
              </button>
            </div>
          )}

          {/* Security Notice Footer */}
          <div className="mt-4 pt-3 border-t-2 border-black/15 flex items-start gap-2 text-[10.5px] text-gray-600 leading-relaxed font-mono">
            <ShieldAlert className="w-4 h-4 text-black shrink-0 mt-0.5" />
            <p>
              Akses hanya untuk guru dan pengawas. Seluruh tindakan pelepasan sanksi dan reset tercatat dalam riwayat audit.
            </p>
          </div>
        </div>

        {/* System Build Tag */}
        <div className="mt-3 text-center text-[10px] text-gray-500 font-mono tracking-widest uppercase">
          CYBER-EXAM ADMIN ENGINE v2.0 // 1994 OS
        </div>
      </div>
    </div>
  );
}
