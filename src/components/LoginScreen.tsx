import React, { useState } from 'react';
import {
  Church,
  Lock,
  User,
  Eye,
  EyeOff,
  LogIn,
  AlertCircle,
  Clock,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export const LoginScreen: React.FC = () => {
  const { settings, login, inactivityNotice, clearInactivityNotice } = useApp();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Background gereja dari settings administrator atau fallback gambar gereja berkualitas tinggi
  const verifiedDefaultBg =
    'https://images.unsplash.com/photo-1543731068-7e0f5beff43a?auto=format&fit=crop&w=1920&q=80';

  const churchBgUrl =
    settings?.loginBackgroundUrl && !settings.loginBackgroundUrl.includes('1548625361')
      ? settings.loginBackgroundUrl
      : verifiedDefaultBg;

  const overlayOpacity =
    typeof settings?.loginBackgroundOverlayOpacity === 'number'
      ? settings.loginBackgroundOverlayOpacity
      : 0.35;

  const blurClass =
    settings?.loginBackgroundBlur === 'lg'
      ? 'blur-md scale-105'
      : settings?.loginBackgroundBlur === 'md'
      ? 'blur-sm scale-102'
      : settings?.loginBackgroundBlur === 'sm'
      ? 'blur-[2px]'
      : '';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsLoading(true);

    setTimeout(() => {
      const result = login(username, password);
      setIsLoading(false);
      if (!result.success) {
        setErrorMessage(result.message || 'Gagal masuk. Periksa kembali username dan password.');
      }
    }, 300);
  };

  return (
    <div className="min-h-screen w-full relative flex flex-col justify-between overflow-hidden font-sans select-none bg-slate-100 text-slate-800">
      {/* 1. Dynamic Church Background Image with graceful fallback */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <img
          src={churchBgUrl}
          alt="Gereja Background"
          className={`w-full h-full object-cover object-center transition-all duration-700 ${blurClass}`}
          referrerPolicy="no-referrer"
          onError={(e) => {
            (e.target as HTMLImageElement).src = verifiedDefaultBg;
          }}
        />

        {/* Dynamic Light Overlay (Warna Terang) to guarantee crystal clear typography & contrast */}
        <div
          className="absolute inset-0 transition-opacity duration-500 bg-gradient-to-b from-white/80 via-white/85 to-slate-100/90 backdrop-blur-[0.5px]"
          style={{ opacity: Math.max(0.2, Math.min(0.95, overlayOpacity + 0.45)) }}
        />

        {/* Ambient Warm Vignette & Geometric Pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(#94a3b8_1px,transparent_1px)] [background-size:24px_24px] opacity-25 pointer-events-none" />
      </div>

      {/* 2. Top Header Bar (Subtle & High Contrast) */}
      <header className="relative z-10 w-full py-4 px-6 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 flex items-center justify-center shrink-0" style={{ width: '40px', height: '40px' }}>
            {settings?.logoUrl ? (
              <img
                src={settings.logoUrl}
                alt="Logo Gereja"
                className="w-10 h-10 object-contain"
                style={{ width: '40px', height: '40px' }}
                referrerPolicy="no-referrer"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            ) : (
              <Church className="w-7 h-7 text-indigo-600" />
            )}
          </div>
          <div>
            <h1 className="text-base font-black text-slate-900 tracking-tight leading-tight" style={{ fontSize: '16px' }}>
              {settings?.namaAplikasi || 'SISTEM INFORMASI GEREJA'}
            </h1>
            <p className="text-xs font-normal" style={{ color: '#e2d8d8', fontSize: '12px', fontWeight: 'normal' }}>
              {settings?.resortGke || 'Gereja Kalimantan Evangelis'}
            </p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/90 border border-slate-200 shadow-2xs text-[11px] font-bold text-slate-700">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600"/>
            <span style={{ color: '#0d4ef3' }}>Portal Resmi Jemaat {settings?.namaJemaat || 'MARANATHA'}</span>
          </span>
        </div>
      </header>

      {/* 3. Main Login Container with Bright, Elegant Card */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-4 sm:p-6 my-auto">
        <div className="w-full max-w-md">
          {/* Card Wrapper in Pure Bright / Light Design */}
          <div className="app-login-card bg-white/95 backdrop-blur-xl border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-slate-900/15 relative">
            {/* Header / Church Identity */}
            <div className="text-center space-y-2 mb-6">
              <div className="inline-flex items-center justify-center w-20 h-20 mb-2 mx-auto transition-transform hover:scale-105">
                {settings?.logoUrl ? (
                  <img
                    src={settings.logoUrl}
                    alt="Logo Gereja"
                    className="w-full h-full object-contain"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        'https://picsum.photos/seed/gkelogo/100/100';
                    }}
                  />
                ) : (
                  <Church className="w-12 h-12 text-indigo-600" />
                )}
              </div>

              <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                Selamat Datang
              </h2>
              <p className="text-xs font-medium text-slate-600 max-w-xs mx-auto leading-relaxed">
                Silakan masuk dengan akun Anda untuk mengakses sistem informasi dan pelayanan Jemaat {settings?.namaJemaat || 'MARANATHA'}.
              </p>
            </div>

            {/* Inactivity Logout Notice */}
            {inactivityNotice && (
              <div className="mb-5 p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5 shadow-2xs">
                <Clock className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <span className="flex-1 font-semibold">{inactivityNotice}</span>
                <button
                  type="button"
                  onClick={clearInactivityNotice}
                  className="text-amber-700 hover:text-amber-950 text-sm font-bold leading-none cursor-pointer"
                >
                  ×
                </button>
              </div>
            )}

            {/* Error Message Alert */}
            {errorMessage && (
              <div className="mb-5 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-start gap-2.5 shadow-2xs">
                <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                <span className="flex-1 font-semibold">{errorMessage}</span>
              </div>
            )}

            {/* Form Input in Bright Theme */}
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-800 font-bold mb-1.5">
                  Username atau Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Masukan Username atau Email"
                    className="login-input app-login-input w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 hover:bg-slate-100/80 focus:bg-white border border-slate-300 text-slate-900 placeholder:text-slate-400 font-bold focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 transition-all text-xs"
                    style={{
                      color: '#0f172a',
                      WebkitTextFillColor: '#0f172a',
                      backgroundColor: '#f8fafc',
                    }}
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-800 font-bold mb-1.5">
                  Kata Sandi / Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Masukkan password"
                    className="login-input app-login-input w-full pl-10 pr-10 py-3 rounded-xl bg-slate-50 hover:bg-slate-100/80 focus:bg-white border border-slate-300 text-slate-900 placeholder:text-slate-400 font-bold focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 transition-all text-xs tracking-wider"
                    style={{
                      color: '#0f172a',
                      WebkitTextFillColor: '#0f172a',
                      backgroundColor: '#f8fafc',
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-800 cursor-pointer"
                    title={showPassword ? 'Sembunyikan password' : 'Lihat password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Remember & Assistance */}
              <div className="flex items-center justify-between text-[11px] pt-1 text-slate-600">
                <label className="flex items-center gap-2 cursor-pointer hover:text-slate-900 font-medium">
                  <input
                    type="checkbox"
                    defaultChecked
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                  />
                  <span>Ingat Sesi Saya</span>
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                id="btn-masuk-sistem"
                disabled={isLoading}
                className="btn-masuk-sistem w-full mt-2 py-4 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white !text-white font-black text-sm shadow-xl shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 cursor-pointer border border-indigo-500/40"
                style={{ color: '#ffffff', backgroundColor: '#4f46e5' }}
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <LogIn className="w-5 h-5 text-white !text-white shrink-0" style={{ color: '#ffffff' }} />
                    <span
                      className="text-white !text-white font-black text-sm tracking-wide"
                      style={{ color: '#ffffff', textShadow: '0 1px 2px rgba(0,0,0,0.35)' }}
                    >
                      MASUK
                    </span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </main>

      {/* 4. High-Contrast Light Footer */}
      <footer className="relative z-10 py-3.5 px-6 text-center text-xs font-semibold text-slate-700 bg-white/70 backdrop-blur-xs border-t border-slate-200/70">
        <p>
         Copyright &copy; {new Date().getFullYear()}  All Right Reserved - {settings?.namaAplikasi || 'Sistem Intformasi Gereja '}. 
         Hak Cipta Dilindungi.
        </p>
      </footer>
    </div>
  );
};
