import React, { useState } from 'react';
import {
  Church,
  Globe,
  HelpCircle,
  Info,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  Settings,
  Sparkles,
  Sun,
  User,
  X,
  Trash2,
  Bell,
  Construction,
  Bug,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { UserProfileModal } from './UserProfileModal';
import { AboutDeveloperModal } from './AboutDeveloperModal';
import { LaporkanBugModal } from './LaporkanBugModal';
import { NotifikasiResiModal } from './NotifikasiResiModal';

export const Header: React.FC = () => {
  const {
    settings,
    currentUser,
    viewMode,
    setViewMode,
    setActiveTab,
    setActivePortalTab,
    keuanganList,
    logout,
    isMobileMenuOpen,
    setIsMobileMenuOpen,
    clearAppCache,
    theme,
    toggleTheme,
  } = useApp();

  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);
  const [isBugModalOpen, setIsBugModalOpen] = useState(false);
  const [isNotifikasiResiModalOpen, setIsNotifikasiResiModalOpen] = useState(false);

  const displayName =
    currentUser?.namaPanggilan ||
    currentUser?.namaLengkap?.split(' ')[0] ||
    currentUser?.username ||
    'Pengguna';

  const pendingResiCount = keuanganList
    ? keuanganList
        .filter((k) => k.jenis === 'pemasukan')
        .filter((k) => k.status === 'pending' || k.disetujuiOleh?.includes('Menunggu'))
        .length
    : 0;

  const handleOpenNotifikasiResi = () => {
    setIsNotifikasiResiModalOpen(true);
  };

  return (
    <>
      <header className="bg-slate-950/95 text-white border-b border-slate-800/80 sticky top-0 z-30 shadow-xl backdrop-blur-md print:hidden">
        {/* Main Header Container - Rata Kiri & Kanan */}
        <div className="w-full px-3 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between gap-2.5 sm:gap-4">
          {/* Left Side: Mobile Hamburger + Logo + Title & Tagline Description */}
          <div className="flex items-center gap-2.5 sm:gap-4 min-w-0 flex-1">
            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition shrink-0"
              title="Buka Menu Sidebar"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            {/* System Logo - Tanpa Border */}
            <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11">
              {settings.logoUrl ? (
                <img
                  src={settings.logoUrl}
                  alt="Logo GKE"
                  className="w-full h-full object-contain"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              ) : (
                <Church className="w-7 h-7 sm:w-8 sm:h-8 text-indigo-600 dark:text-indigo-400" />
              )}
            </div>

            {/* Title & Editable Description */}
            <div className="min-w-0 flex-1">
              <h1 className="text-sm sm:text-lg font-black tracking-tight flex items-center gap-2">
                <span className="text-slate-900 dark:text-white app-brand-title font-black line-clamp-1 sm:line-clamp-none">
                  {settings.namaAplikasi}
                </span>
                <span className="hidden sm:inline-flex text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-500/15 dark:text-indigo-300 dark:border-indigo-500/30 items-center gap-1 app-badge-tag shrink-0">
                  <Sparkles className="w-2.5 h-2.5" /> GKE Digital
                </span>
              </h1>
              {/* Dynamic Editable Application Description - Never truncate on mobile, wrap cleanly */}
              <p className="text-[10.5px] sm:text-xs text-slate-600 dark:text-slate-400 font-medium leading-tight sm:leading-normal whitespace-normal break-words max-w-full sm:max-w-md lg:max-w-xl app-brand-desc mt-0.5">
                {settings.deskripsiAplikasi ||
                  'Sistem Informasi Manajemen Jemaat & Pelayanan Digital GKE'}
              </p>
            </div>
          </div>

          {/* Right Side: Mode Switcher, Warta Jemaat, Notifikasi Resi (Icon Only), & User Profile */}
          <div className="flex items-center gap-2 sm:gap-2.5 flex-shrink-0">
            {/* Mode Switcher */}
            <div className="hidden sm:flex items-center bg-slate-100 dark:bg-slate-900/90 p-1 rounded-xl border border-slate-200 dark:border-slate-800/80 shadow-inner">
              <button
                onClick={() => setViewMode('admin')}
                disabled={currentUser?.role === 'warga'}
                title={
                  currentUser?.role === 'warga'
                    ? 'Tab MPH dinonaktifkan untuk Warga Jemaat'
                    : 'Mode Panel MPH (Aktif)'
                }
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                  currentUser?.role === 'warga'
                    ? 'opacity-40 cursor-not-allowed text-slate-400 bg-slate-200/50 dark:text-slate-500 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 pointer-events-none'
                    : viewMode === 'admin'
                    ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-md shadow-indigo-600/30 font-bold cursor-default'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800/40 cursor-pointer'
                }`}
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span>MPH</span>
              </button>
              <button
                onClick={() => setViewMode('public')}
                disabled={currentUser?.role === 'admin'}
                title={
                  currentUser?.role === 'admin'
                    ? 'Tab Warga Jemaat dinonaktifkan untuk Admin'
                    : 'Mode Portal Warga Jemaat (Aktif / Pratinjau)'
                }
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                  currentUser?.role === 'admin'
                    ? 'opacity-40 cursor-not-allowed text-slate-400 bg-slate-200/50 dark:text-slate-500 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 pointer-events-none'
                    : viewMode === 'public'
                    ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-md shadow-indigo-600/30 font-bold cursor-default'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800/40 cursor-pointer'
                }`}
              >
                <Globe className="w-3.5 h-3.5" />
                <span>Warga Jemaat</span>
              </button>
            </div>

            {/* Maintenance Mode Status Pill (For Admins/Staff) */}
            {settings?.maintenanceModeEnabled && (
              <button
                type="button"
                onClick={() => setActiveTab('pengaturan')}
                title="Mode Perbaikan (Under Construction) sedang AKTIF! Klik untuk mengelola di Pengaturan."
                className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 font-bold text-xs transition shadow-sm active:scale-95 cursor-pointer animate-pulse"
              >
                <Construction className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-[11px]">Mode Perbaikan Aktif</span>
              </button>
            )}

            {/* Quick Notifikasi Resi Bell Icon Button */}
            <button
              type="button"
              onClick={() => setIsNotifikasiResiModalOpen(true)}
              className="relative p-2 sm:px-2.5 sm:py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-900/90 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white transition shadow-xs cursor-pointer flex items-center gap-1.5"
              title={`Notifikasi & Verifikasi Resi Persembahan (${pendingResiCount} Menunggu)`}
            >
              <Bell className="w-4 h-4 text-amber-500" />
              {pendingResiCount > 0 && (
                <span className="inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-black rounded-full bg-rose-600 text-white leading-none animate-pulse">
                  {pendingResiCount}
                </span>
              )}
              <span className="hidden xl:inline text-[11px] font-bold text-slate-800 dark:text-slate-200">
                Resi
              </span>
            </button>

            {/* Quick Theme Toggle Button */}
            <button
              type="button"
              onClick={toggleTheme}
              className="p-2 sm:px-2.5 sm:py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-900/90 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white transition shadow-xs cursor-pointer flex items-center gap-1.5"
              title={`Ganti Tema (${theme === 'dark' ? 'Sekarang Mode Gelap 🌙 - Klik untuk Terang' : 'Sekarang Mode Terang ☀️ - Klik untuk Gelap'})`}
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-500" />
              ) : (
                <Moon className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              )}
              <span className="hidden md:inline text-[11px] font-bold text-slate-800 dark:text-slate-200">
                {theme === 'dark' ? 'Gelap' : 'Terang'}
              </span>
            </button>

            {/* Active User Avatar & Dropdown (Profil) */}
            {currentUser && (
              <div className="relative">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="header-user-btn flex items-center gap-2.5 p-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-900/90 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-xs shadow-xs transition group cursor-pointer"
                  title="Profil Pengguna"
                >
                  {/* Avatar Photo or Initial */}
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-sky-500 flex items-center justify-center font-bold text-white text-xs shadow-xs overflow-hidden border border-indigo-200 dark:border-slate-700 shrink-0">
                    {currentUser.foto ? (
                      <img
                        src={currentUser.foto}
                        alt={displayName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span>{displayName.charAt(0).toUpperCase()}</span>
                    )}
                  </div>

                  <div className="hidden sm:block text-left pr-1">
                    <p className="header-user-name font-bold text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-300 leading-none">
                      {displayName}
                    </p>
                    <span className="header-user-role text-[10px] text-indigo-700 dark:text-indigo-400 capitalize font-bold">
                      {currentUser.role}
                    </span>
                  </div>
                </button>

                {/* User Dropdown Menu */}
                {isUserMenuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setIsUserMenuOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-60 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl z-50 p-1.5 space-y-0.5 text-xs animate-in fade-in zoom-in-95 duration-150">
                      {/* User Info Card */}
                      <div className="px-3.5 py-2.5 rounded-xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/80 dark:bg-slate-950/70 mb-1">
                        <p className="font-bold text-slate-900 dark:text-slate-100 text-xs truncate">
                          {currentUser.namaLengkap}
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{currentUser.email}</p>
                        <span className="inline-block mt-1 px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-500/20 dark:text-indigo-300 dark:border-indigo-500/30 text-[10px] font-extrabold uppercase">
                          Akses: {currentUser.role}
                        </span>
                      </div>

                      {/* Menu Items */}
                      <button
                        onClick={toggleTheme}
                        className="w-full text-left px-3.5 py-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-600 dark:hover:text-white font-semibold flex items-center justify-between transition-colors cursor-pointer group"
                      >
                        <div className="flex items-center gap-2.5">
                          {theme === 'dark' ? (
                            <Sun className="w-4 h-4 text-amber-500 group-hover:text-amber-200 transition-colors" />
                          ) : (
                            <Moon className="w-4 h-4 text-indigo-500 group-hover:text-white transition-colors" />
                          )}
                          <span className="group-hover:text-white font-semibold">Tema Tampilan</span>
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 group-hover:bg-white/20 group-hover:text-white group-hover:border-white/30 transition-colors">
                          {theme === 'dark' ? 'Gelap 🌙' : 'Terang ☀️'}
                        </span>
                      </button>

                      <button
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          setIsProfileModalOpen(true);
                        }}
                        className="w-full text-left px-3.5 py-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-600 dark:hover:text-white font-semibold flex items-center gap-2.5 transition-colors cursor-pointer group"
                      >
                        <User className="w-4 h-4 text-indigo-500 dark:text-indigo-400 group-hover:text-white transition-colors shrink-0" />
                        <span className="group-hover:text-white font-bold">Edit Profil Saya</span>
                      </button>

                      {/* Buku Panduan & Tutorial */}
                      <button
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          setIsMobileMenuOpen(false);
                          if (currentUser.role === 'warga') {
                            setActivePortalTab('panduan');
                          } else {
                            setViewMode('admin');
                            setActiveTab('tutorial');
                          }
                        }}
                        className="w-full text-left px-3.5 py-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-600 dark:hover:text-white font-semibold flex items-center gap-2.5 transition-colors cursor-pointer group"
                      >
                        <HelpCircle className="w-4 h-4 text-indigo-500 dark:text-indigo-400 group-hover:text-white transition-colors shrink-0" />
                        <span className="group-hover:text-white font-bold">Panduan & Tutorial</span>
                      </button>

                      {/* Notifikasi Status Resi Persembahan */}
                      <button
                        type="button"
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          handleOpenNotifikasiResi();
                        }}
                        className="w-full text-left px-3.5 py-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-600 dark:hover:text-white font-semibold flex items-center justify-between transition-colors cursor-pointer group"
                      >
                        <div className="flex items-center gap-2.5">
                          <Bell className="w-4 h-4 text-amber-500 group-hover:text-white transition-colors shrink-0" />
                          <span className="group-hover:text-white font-bold">Notifikasi Resi</span>
                        </div>
                        {pendingResiCount > 0 && (
                          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 shadow-sm animate-pulse">
                            {pendingResiCount} baru
                          </span>
                        )}
                      </button>

                      {/* Laporkan Bug / Kendala Button */}
                      <button
                        type="button"
                        id="btn-header-laporkan-bug"
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          setIsBugModalOpen(true);
                        }}
                        className="w-full text-left px-3.5 py-2 rounded-xl text-slate-800 dark:text-slate-100 hover:bg-rose-50 dark:hover:bg-rose-950/40 font-semibold flex items-center gap-2.5 transition-colors cursor-pointer group"
                      >
                        <Bug className="w-4 h-4 text-rose-600 dark:text-rose-400 group-hover:text-rose-700 dark:group-hover:text-rose-300 transition-colors shrink-0" />
                        <span className="text-slate-800 dark:text-slate-100 group-hover:text-rose-700 dark:group-hover:text-rose-300 font-bold">Laporkan Bug / Kendala</span>
                      </button>

                      {currentUser.role === 'admin' && (
                        <button
                          onClick={() => {
                            setIsUserMenuOpen(false);
                            setIsMobileMenuOpen(false);
                            setActiveTab('pengaturan');
                          }}
                          className="w-full text-left px-3.5 py-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-600 dark:hover:text-white font-semibold flex items-center gap-2.5 transition-colors cursor-pointer group"
                        >
                          <Settings className="w-4 h-4 text-indigo-500 dark:text-indigo-400 group-hover:text-white transition-colors shrink-0" />
                          <span className="group-hover:text-white font-semibold truncate">Pengaturan Identitas & Kop Surat</span>
                        </button>
                      )}

                      {viewMode !== 'public' && currentUser.role !== 'warga' && (
                        <>
                          <button
                            onClick={() => {
                              setIsUserMenuOpen(false);
                              setIsAboutModalOpen(true);
                            }}
                            className="w-full text-left px-3.5 py-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-600 dark:hover:text-white font-semibold flex items-center gap-2.5 transition-colors cursor-pointer group"
                          >
                            <Info className="w-4 h-4 text-indigo-500 dark:text-indigo-400 group-hover:text-white transition-colors shrink-0" />
                            <span className="group-hover:text-white font-semibold">Tentang Pengembang</span>
                          </button>

                          <button
                            onClick={() => {
                              setIsUserMenuOpen(false);
                              clearAppCache();
                            }}
                            className="w-full text-left px-3.5 py-2 rounded-xl text-amber-700 dark:text-amber-300 hover:bg-amber-600 hover:text-white dark:hover:bg-amber-600 dark:hover:text-white font-semibold flex items-center gap-2.5 transition-colors cursor-pointer group"
                          >
                            <Trash2 className="w-4 h-4 text-amber-600 dark:text-amber-400 group-hover:text-white transition-colors shrink-0" />
                            <span className="group-hover:text-white font-semibold">Bersihkan Cache</span>
                          </button>
                        </>
                      )}

                      <div className="border-t border-slate-100 dark:border-slate-800/80 pt-1 mt-1">
                        <button
                          type="button"
                          id="btn-header-logout"
                          onClick={() => {
                            setIsUserMenuOpen(false);
                            logout();
                          }}
                          className="w-full text-left px-3.5 py-2 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 font-bold flex items-center gap-2.5 transition-colors cursor-pointer group"
                        >
                          <LogOut className="w-4 h-4 text-rose-600 dark:text-rose-400 group-hover:text-rose-700 dark:group-hover:text-rose-300 transition-colors shrink-0" />
                          <span className="text-rose-600 dark:text-rose-400 group-hover:text-rose-700 dark:group-hover:text-rose-300 font-bold">Logout</span>
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Profile, About & Bug Report Modals */}
      <UserProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        onOpenNotifikasiResi={() => setIsNotifikasiResiModalOpen(true)}
      />
      <AboutDeveloperModal
        isOpen={isAboutModalOpen}
        onClose={() => setIsAboutModalOpen(false)}
      />
      <LaporkanBugModal
        isOpen={isBugModalOpen}
        onClose={() => setIsBugModalOpen(false)}
      />
      <NotifikasiResiModal
        isOpen={isNotifikasiResiModalOpen}
        onClose={() => setIsNotifikasiResiModalOpen(false)}
      />
    </>
  );
};
