import React, { useState, useEffect } from 'react';
import {
  Church,
  Hammer,
  Wrench,
  Clock,
  ShieldAlert,
  ShieldCheck,
  Phone,
  MessageCircle,
  LogIn,
  RefreshCw,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  Lock,
  User,
  Sparkles,
  ArrowRight,
  HardHat,
  Construction,
  Power,
  Calendar,
  X,
  Radio,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import underConstructionBg from '../assets/images/under_construction_bg_1789852399505.jpg';

interface UnderConstructionScreenProps {
  isPreview?: boolean;
  onClosePreview?: () => void;
}

export const UnderConstructionScreen: React.FC<UnderConstructionScreenProps> = ({
  isPreview = false,
  onClosePreview,
}) => {
  const {
    settings,
    updateSettings,
    currentUser,
    login,
    logout,
    syncCloudData,
    isSyncingCloud,
  } = useApp();

  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isDisablingMaintenance, setIsDisablingMaintenance] = useState(false);
  const [currentTime, setCurrentTime] = useState<string>(() =>
    new Date().toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  );

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(
        new Date().toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setIsLoggingIn(true);

    try {
      await new Promise((res) => setTimeout(res, 350));
      const res = login(username, password);
      if (res.success) {
        setIsAdminModalOpen(false);
      } else {
        setLoginError(res.message || 'Kredensial login tidak valid.');
      }
    } catch (err: any) {
      setLoginError(err?.message || 'Gagal masuk ke sistem.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleDisableMaintenance = async () => {
    try {
      setIsDisablingMaintenance(true);
      await updateSettings({
        ...settings,
        maintenanceModeEnabled: false,
      });
      if (onClosePreview) {
        onClosePreview();
      }
    } catch (err) {
      console.error('Gagal menonaktifkan mode perbaikan:', err);
    } finally {
      setIsDisablingMaintenance(false);
    }
  };

  const titleText =
    settings?.maintenanceTitle ||
    'Sistem Sedang Dalam Masa Pemeliharaan & Perbaikan';

  const messageText =
    settings?.maintenanceMessage ||
    'Mohon maaf atas ketidaknyamanan ini. Majelis Jemaat dan Tim IT saat ini sedang melakukan pembaruan sistem, optimasi database, dan peningkatan fitur pelayanan jemaat. Sistem informasi akan segera aktif kembali.';

  const estimatedTime =
    settings?.maintenanceEstimatedCompletion ||
    'Perkiraan selesai segera dalam beberapa saat';

  const contactPerson =
    settings?.maintenanceContactPerson ||
    'Sekretariat Majelis Jemaat';

  const churchName = settings?.namaJemaat || 'Majelis Jemaat GKE';
  const resortName = settings?.resortGke || 'Resort GKE';

  return (
    <div
      className="min-h-screen min-h-[100dvh] w-full text-slate-800 flex flex-col justify-between relative overflow-hidden font-sans selection:bg-amber-500 selection:text-white bg-sky-100 bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: `url(${underConstructionBg})` }}
    >
      {/* Light Atmosphere Enhancements */}
      <div className="absolute inset-0 bg-gradient-to-b from-sky-900/10 via-transparent to-sky-950/20 pointer-events-none" />

      {/* Top Banner (If Preview Mode or Logged In As Admin) */}
      {isPreview && (
        <div className="bg-amber-500 text-slate-950 px-4 py-2 text-xs font-bold flex items-center justify-between z-20 shadow-lg">
          <div className="flex items-center gap-2">
            <span className="bg-slate-950 text-amber-400 px-2 py-0.5 rounded font-mono text-[10px] uppercase">
              Mode Pratinjau
            </span>
            <span>Ini adalah tampilan yang dilihat oleh publik/warga saat sistem dalam perbaikan.</span>
          </div>
          {onClosePreview && (
            <button
              onClick={onClosePreview}
              className="px-3 py-1 bg-slate-950 text-white rounded-lg hover:bg-slate-900 transition flex items-center gap-1.5 cursor-pointer text-xs"
            >
              <X className="w-3.5 h-3.5" />
              <span>Tutup Pratinjau</span>
            </button>
          )}
        </div>
      )}

      {/* Top Navbar */}
      <header className="relative z-10 w-full px-4 sm:px-8 py-3.5 flex items-center justify-between border-b border-white/60 bg-white/85 backdrop-blur-md shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-white border border-sky-100 p-1 flex items-center justify-center shadow-md overflow-hidden">
            {settings?.logoUrl ? (
              <img
                src={settings.logoUrl}
                alt="Logo Gereja"
                className="w-full h-full object-cover rounded-xl"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    'https://picsum.photos/seed/gkelogo/100/100';
                }}
              />
            ) : (
              <Church className="w-6 h-6 text-sky-600" />
            )}
          </div>
          <div>
            <h1 className="font-extrabold text-sm sm:text-base text-slate-900 tracking-tight leading-tight">
              {churchName}
            </h1>
            <p className="text-[11px] text-slate-600 font-semibold">
              {resortName} • {settings?.namaAplikasi || 'Sistem Informasi Jemaat'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Live System Time Badge */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/90 border border-sky-200 text-xs font-mono text-sky-900 shadow-xs">
            <Radio className="w-3 h-3 text-amber-500 animate-pulse" />
            <span>{currentTime} WIB</span>
          </div>

          {/* Admin Action Button */}
          {currentUser && currentUser.role === 'admin' ? (
            <button
              onClick={handleDisableMaintenance}
              disabled={isDisablingMaintenance}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-md shadow-emerald-600/30 cursor-pointer"
              title="Nonaktifkan status perbaikan dan buka akses aplikasi"
            >
              <Power className="w-3.5 h-3.5" />
              <span>{isDisablingMaintenance ? 'Memproses...' : 'Nonaktifkan Perbaikan'}</span>
            </button>
          ) : (
            <button
              onClick={() => setIsAdminModalOpen(true)}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs font-semibold transition cursor-pointer shadow-xs"
              title="Masuk bagi Majelis / Administrator"
            >
              <LogIn className="w-3.5 h-3.5 text-amber-600" />
              <span>Login Majelis / Admin</span>
            </button>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-4 sm:p-6 md:p-10 my-auto">
        <div className="w-full max-w-2xl space-y-6">
          {/* Main Card */}
          <div className="bg-white/95 sm:bg-white/90 border border-white/90 rounded-3xl p-6 sm:p-10 shadow-2xl shadow-sky-900/15 backdrop-blur-xl relative overflow-hidden text-center space-y-6">
            {/* Animated Construction Ribbon Accent */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500" />

            {/* Central Animated Illustration / Icon - Bright & Cheerful */}
            <div className="relative inline-flex items-center justify-center">
              <div className="absolute -inset-4 bg-amber-400/25 rounded-full blur-xl animate-pulse" />
              <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-br from-amber-100 via-yellow-50 to-sky-100 border-2 border-amber-300 flex items-center justify-center shadow-xl shadow-amber-500/15">
                <Construction className="w-10 h-10 sm:w-12 sm:h-12 text-amber-500 animate-bounce" />
              </div>

              {/* Orbiting Bright Mini Tools */}
              <div className="absolute -top-1 -right-1 p-2 rounded-xl bg-white border border-sky-200 text-sky-600 shadow-md">
                <Wrench className="w-3.5 h-3.5 animate-spin duration-3000" />
              </div>
              <div className="absolute -bottom-1 -left-1 p-2 rounded-xl bg-white border border-amber-200 text-amber-500 shadow-md">
                <HardHat className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Badge Indicator */}
            <div>
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold bg-amber-50 text-amber-900 border border-amber-300 uppercase tracking-wider shadow-xs">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                <span>Status: Masa Pemeliharaan &amp; Perbaikan Sistem</span>
              </span>
            </div>

            {/* Main Headings */}
            <div className="space-y-2 max-w-xl mx-auto">
              <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900 tracking-tight leading-snug">
                {titleText}
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
                {messageText}
              </p>
            </div>

            {/* Information Grid (Estimated Time & Helpdesk Contact) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-left pt-2">
              {/* Estimated Completion Box */}
              <div className="bg-sky-50/90 p-4 rounded-2xl border border-sky-200/80 space-y-1.5 shadow-xs">
                <div className="flex items-center gap-2 text-sky-700 text-xs font-bold">
                  <Clock className="w-4 h-4 text-sky-600" />
                  <span>Estimasi Selesai:</span>
                </div>
                <p className="text-xs sm:text-sm font-extrabold text-slate-900">
                  {estimatedTime}
                </p>
                <p className="text-[10px] text-slate-500 font-medium">
                  Pembaruan data dan optimasi server sedang berlangsung.
                </p>
              </div>

              {/* Helpdesk Contact Box */}
              <div className="bg-emerald-50/90 p-4 rounded-2xl border border-emerald-200/80 space-y-1.5 shadow-xs">
                <div className="flex items-center gap-2 text-emerald-700 text-xs font-bold">
                  <MessageCircle className="w-4 h-4 text-emerald-600" />
                  <span>Kontak / Narahubung:</span>
                </div>
                <p className="text-xs sm:text-sm font-extrabold text-slate-900">
                  {contactPerson}
                </p>
                <p className="text-[10px] text-slate-500 font-medium">
                  Hubungi sekretariat bila ada urusan administrasi darurat.
                </p>
              </div>
            </div>

            {/* Interactive Action Bar */}
            <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs transition border border-slate-300 active:scale-95 cursor-pointer shadow-sm"
              >
                <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
                <span>Segarkan / Periksa Status Aplikasi</span>
              </button>

              {currentUser && currentUser.role === 'admin' ? (
                <button
                  type="button"
                  onClick={handleDisableMaintenance}
                  disabled={isDisablingMaintenance}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition shadow-lg shadow-emerald-600/30 active:scale-95 cursor-pointer"
                >
                  <Power className="w-3.5 h-3.5" />
                  <span>Buka Akses Sistem (Selesai Perbaikan)</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsAdminModalOpen(true)}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs transition shadow-lg shadow-sky-600/30 active:scale-95 cursor-pointer"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Masuk Sebagai Pengurus / Majelis</span>
                </button>
              )}
            </div>

            {/* Current User Notice if Logged In as Non-Admin */}
            {currentUser && currentUser.role !== 'admin' && (
              <div className="p-3 rounded-xl bg-sky-50 border border-sky-200 text-[11px] text-slate-700 flex items-center justify-between">
                <span>
                  Login sebagai: <strong className="text-slate-900">{currentUser.namaLengkap}</strong> ({currentUser.role})
                </span>
                <button
                  onClick={logout}
                  className="text-rose-600 hover:text-rose-700 underline font-semibold cursor-pointer"
                >
                  Keluar / Ganti Akun
                </button>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full px-4 py-3 text-center text-[11px] text-slate-600 border-t border-white/60 bg-white/80 backdrop-blur-md">
        <p>
          © {new Date().getFullYear()} {churchName} • Hak Cipta Dilindungi • {settings?.headerKopLine1 || 'GEREJA KALIMANTAN EVANGELIS'}
        </p>
      </footer>

      {/* ADMIN LOGIN MODAL */}
      {isAdminModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white border border-slate-200 rounded-3xl shadow-2xl w-full max-w-md p-6 sm:p-7 space-y-5 text-slate-800 relative">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-sky-50 text-sky-600 border border-sky-200">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-slate-900">
                    Autentikasi Majelis / Admin
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Akses khusus pengelola selama masa pemeliharaan
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAdminModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Error Message */}
            {loginError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleAdminLogin} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">
                  Username Akun
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. admin"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:bg-white focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">
                  Kata Sandi / Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Masukkan password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-9 pr-10 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:bg-white focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-[11px] flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  Hanya akun dengan role <strong>Admin</strong> atau role yang diizinkan yang dapat mengelola sistem selama perbaikan.
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAdminModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isLoggingIn}
                  className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold transition shadow-md shadow-sky-600/30 cursor-pointer disabled:opacity-50 flex items-center gap-2"
                >
                  {isLoggingIn ? 'Memverifikasi...' : 'Masuk ke Sistem'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
