import React, { useState } from 'react';
import {
  BookOpen,
  BookMarked,
  Library,
  HelpCircle,
  Vote,
  Briefcase,
  Calendar,
  DollarSign,
  CreditCard,
  FolderArchive,
  LayoutDashboard,
  MapPin,
  Package,
  Settings,
  ShieldCheck,
  ShieldAlert,
  UserCheck,
  UserPlus,
  Users,
  Feather,
  Mail,
  HeartHandshake,
  GraduationCap,
  Hammer,
  X,
  Church,
  Mic2,
  Newspaper,
  QrCode,
  Webhook,
  LucideIcon,
  LogOut,
  Code2,
  Cloud,
  RefreshCw,
  FileText,
  FileCheck2,
  Cake,
  Layers,
  ToggleLeft,
  Bot,
  MessageSquare,
  CheckSquare,
  Wand2,
  Bug,
  HeartCrack,
  Wrench,
  Image as ImageIcon,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { AboutDeveloperModal } from './AboutDeveloperModal';

interface MenuItem {
  id: string;
  label: string;
  icon: LucideIcon;
  roles: string[];
  badge?: string;
  badgeColor?: 'amber' | 'emerald' | 'rose' | 'indigo' | 'purple';
}

interface MenuGroup {
  groupLabel: string;
  items: MenuItem[];
}

export const Sidebar: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    currentUser,
    pendaftaranList,
    laporanBugList,
    settings,
    isMobileMenuOpen,
    setIsMobileMenuOpen,
    logout,
    isSyncingCloud,
    syncCloudData,
    syncMessage,
    wargaJemaatList,
    singerJemaatList,
    dueSoonMaintenanceCount,
    overdueMaintenanceCount,
  } = useApp();

  const totalMeninggalCount = (wargaJemaatList || []).filter(
    (w) => w.statusKeanggotaan === 'Meninggal'
  ).length;

  const totalActiveSingerCount = (singerJemaatList || []).filter(
    (s) => s.status === 'Aktif'
  ).length;

  const pendingPendaftaranCount = pendaftaranList.filter(
    (p) => p.statusKonfirmasiMPH === 'Menunggu Konfirmasi'
  ).length;

  const pendingBugCount = laporanBugList.filter(
    (b) => b.status === 'Baru'
  ).length;

  const menuGroups: MenuGroup[] = [
    {
      groupLabel: 'Ringkasan & Informasi Utama',
      items: [
        {
          id: 'dashboard',
          label: 'Dashboard',
          icon: LayoutDashboard,
          roles: ['admin', 'bendahara', 'sekretaris', 'warga'],
        },
        {
          id: 'tutorial',
          label: 'Panduan',
          icon: HelpCircle,
          roles: ['admin', 'bendahara', 'sekretaris', 'warga'],
          badgeColor: 'indigo',
        },
        {
          id: 'berita_jemaat',
          label: 'Berita Jemaat',
          icon: Newspaper,
          roles: ['admin', 'sekretaris', 'bendahara', 'warga'],
          badgeColor: 'emerald',
        },
      ],
    },
    {
      groupLabel: 'Ibadah & Pembinaan Rohani',
      items: [
        {
          id: 'jadwal_ibadah',
          label: 'Jadwal Ibadah',
          icon: Calendar,
          roles: ['admin', 'sekretaris', 'bendahara', 'warga'],
        },
        {
          id: 'singer_jemaat',
          label: 'Singer',
          icon: Mic2,
          roles: ['admin', 'sekretaris', 'bendahara', 'warga'],
          badge: totalActiveSingerCount > 0 ? `${totalActiveSingerCount} Singer` : undefined,
          badgeColor: 'purple',
        },
        {
          id: 'alkitab',
          label: 'Alkitab',
          icon: BookMarked,
          roles: ['admin', 'sekretaris', 'bendahara', 'warga'],
          badge: 'TB',
          badgeColor: 'indigo',
        },
        {
          id: 'almanak_nast',
          label: 'Almanak Nast',
          icon: BookOpen,
          roles: ['admin', 'sekretaris', 'bendahara', 'warga'],
          badge: 'GKE',
          badgeColor: 'rose',
        },
        {
          id: 'rancangan_khotbah',
          label: 'Rancangan Khotbah',
          icon: Feather,
          roles: ['admin', 'sekretaris', 'bendahara', 'warga'],
        },
        {
          id: 'renungan_khotbah',
          label: 'Buletin & Renungan Harian',
          icon: BookOpen,
          roles: ['admin', 'sekretaris', 'bendahara', 'warga'],
        },
        {
          id: 'perpustakaan',
          label: 'Perpustakaan',
          icon: Library,
          roles: ['admin', 'sekretaris', 'bendahara', 'warga'],
          badge: 'E-Library',
          badgeColor: 'emerald',
        },
      ],
    },
    {
      groupLabel: 'Keanggotaan & Layanan Jemaat',
      items: [
        {
          id: 'warga_jemaat',
          label: 'Data Keluarga Jemaat',
          icon: Users,
          roles: ['admin', 'sekretaris', 'bendahara', 'warga'],
        },
        {
          id: 'kematian_jemaat',
          label: 'Data Kematian',
          icon: HeartCrack,
          roles: ['admin', 'sekretaris', 'bendahara', 'warga'],
          badge: totalMeninggalCount > 0 ? `${totalMeninggalCount} Jiwa` : undefined,
          badgeColor: 'rose',
        },
        {
          id: 'pendaftaran_warga',
          label: 'Form Pendaftaran Mandiri',
          icon: UserPlus,
          roles: ['admin', 'sekretaris', 'bendahara', 'warga'],
          badge: pendingPendaftaranCount > 0 ? `${pendingPendaftaranCount} Menunggu` : undefined,
          badgeColor: 'amber',
        },
        {
          id: 'lingkungan_jemaat',
          label: 'Lingkungan & Sektor Pelayanan',
          icon: MapPin,
          roles: ['admin', 'sekretaris', 'bendahara', 'warga'],
        },
        {
          id: 'ulang_tahun_jemaat',
          label: 'Ulang Tahun',
          icon: Cake,
          roles: ['admin', 'sekretaris', 'bendahara', 'warga'],
          badge: 'Otomatis',
          badgeColor: 'emerald',
        },
        {
          id: 'pelayanan_sakramen',
          label: 'Pelayanan Nikah, Baptis & Sidi',
          icon: HeartHandshake,
          roles: ['admin', 'sekretaris', 'bendahara', 'warga'],
          badge: 'Arsip Akta',
          badgeColor: 'emerald',
        },
        {
          id: 'surat_pelimpahan_nikah',
          label: 'Surat Pelimpahan Nikah',
          icon: FileCheck2,
          roles: ['admin', 'sekretaris', 'bendahara', 'warga'],
          badge: 'Ke Resort Lain',
          badgeColor: 'amber',
        },
        {
          id: 'jadwal_katekisasi',
          label: 'Jadwal Katekisasi',
          icon: GraduationCap,
          roles: ['admin', 'sekretaris', 'bendahara', 'warga'],
          badge: 'Sidi & Nikah',
          badgeColor: 'emerald',
        },
        {
          id: 'seksi_kategorial',
          label: 'Seksi Pelayanan Kategorial',
          icon: Users,
          roles: ['admin', 'sekretaris', 'bendahara', 'warga'],
          badge: 'SPB, SPPer, SPA',
          badgeColor: 'emerald',
        },
      ],
    },
    {
      groupLabel: 'Keuangan & Kas Jemaat',
      items: [
        {
          id: 'iuran_kewajiban',
          label: 'Iuran Kewajiban',
          icon: CreditCard,
          roles: ['admin', 'bendahara', 'sekretaris', 'warga'],
          badge: 'Jan - Des',
          badgeColor: 'indigo',
        },
        {
          id: 'keuangan',
          label: 'Transaksi Keuangan',
          icon: DollarSign,
          roles: ['admin', 'bendahara', 'sekretaris', 'warga'],
          badge: 'Buku Kas',
          badgeColor: 'emerald',
        },
        {
          id: 'persembahan_digital',
          label: 'Persembahan Digital',
          icon: QrCode,
          roles: ['admin', 'bendahara', 'sekretaris', 'warga'],
          badge: 'QRIS',
          badgeColor: 'emerald',
        },
        {
          id: 'gopay_webhook',
          label: 'Monitor Webhook & Callback',
          icon: Webhook,
          roles: ['admin', 'bendahara', 'sekretaris', 'warga'],
          badge: 'Live',
          badgeColor: 'emerald',
        },
        {
          id: 'panitia_pembangunan',
          label: 'Panitia Pembangunan & Proyek',
          icon: Hammer,
          roles: ['admin', 'sekretaris', 'bendahara', 'warga'],
          badge: 'Proyek Fisik',
          badgeColor: 'amber',
        },
      ],
    },
    {
      groupLabel: 'Tata Kelola, Aset & Persuratan',
      items: [
        {
          id: 'mph_jemaat',
          label: 'Pengurus MPH Jemaat',
          icon: ShieldCheck,
          roles: ['admin', 'sekretaris', 'bendahara'],
        },
        {
          id: 'penatua_diakon',
          label: 'Penatua & Diakon',
          icon: UserCheck,
          roles: ['admin', 'sekretaris', 'bendahara', 'warga'],
        },
        {
          id: 'jabatan_struktural',
          label: 'Jabatan Struktural',
          icon: Briefcase,
          roles: ['admin', 'sekretaris', 'bendahara', 'warga'],
          badge: 'Master SK',
          badgeColor: 'emerald',
        },
        {
          id: 'pemilihan',
          label: 'Pemilihan Majelis & E-Voting',
          icon: Vote,
          roles: ['admin', 'sekretaris', 'bendahara', 'warga'],
          badge: 'E-Voting',
          badgeColor: 'emerald',
        },
        {
          id: 'inventaris_aset',
          label: 'Inventaris & Nilai Aset',
          icon: Package,
          roles: ['admin', 'sekretaris', 'bendahara', 'warga'],
        },
        {
          id: 'pemeliharaan_aset',
          label: 'Jadwal Servis & Pemeliharaan',
          icon: Wrench,
          roles: ['admin', 'sekretaris', 'bendahara', 'warga'],
          badge:
            overdueMaintenanceCount > 0
              ? `${overdueMaintenanceCount} Terlambat`
              : dueSoonMaintenanceCount > 0
              ? `${dueSoonMaintenanceCount} Jatuh Tempo`
              : undefined,
          badgeColor: overdueMaintenanceCount > 0 ? 'rose' : 'amber',
        },
        {
          id: 'manajemen_tugas',
          label: 'Manajemen Tugas Pelayanan',
          icon: CheckSquare,
          roles: ['admin', 'sekretaris', 'bendahara', 'warga'],
          badge: 'Task Board',
          badgeColor: 'emerald',
        },
        {
          id: 'agenda_surat',
          label: 'Agenda Surat Masuk & Keluar',
          icon: Mail,
          roles: ['admin', 'sekretaris', 'bendahara', 'warga'],
        },
      ],
    },
    {
      groupLabel: 'Pengaturan Sistem & Hak Akses',
      items: [
        {
          id: 'pengaturan',
          label: 'Pengaturan Identitas & Kop Surat',
          icon: Settings,
          roles: ['admin'],
          badge: settings?.maintenanceModeEnabled ? 'Perbaikan Aktif' : undefined,
          badgeColor: 'amber',
        },
        {
          id: 'pengaturan_background',
          label: 'Pengaturan Background Gereja',
          icon: ImageIcon,
          roles: ['admin'],
          badge: 'Login',
          badgeColor: 'indigo',
        },
        {
          id: 'pengaturan_halaman_warga',
          label: 'Pengaturan Portal Warga Jemaat',
          icon: Layers,
          roles: ['admin'],
          badge: 'Portal Warga',
          badgeColor: 'emerald',
        },
        {
          id: 'pengaturan_qris',
          label: 'Pengaturan QRIS & Rekening Bank',
          icon: QrCode,
          roles: ['admin', 'bendahara'],
          badge: 'GoPay & Bank',
          badgeColor: 'emerald',
        },
        {
          id: 'whatsapp_bot',
          label: 'WhatsApp BOT & Gateway Center',
          icon: Bot,
          roles: ['admin', 'sekretaris', 'bendahara', 'warga'],
          badge: 'Bot WA',
          badgeColor: 'emerald',
        },
        {
          id: 'kelola_akun',
          label: 'Akun dan Akses',
          icon: FolderArchive,
          roles: ['admin'],
        },
        {
          id: 'audit_keamanan',
          label: 'Audit Keamanan & Log Aktivitas',
          icon: ShieldAlert,
          roles: ['admin', 'bendahara', 'sekretaris'],
          badge: 'Security Audit',
          badgeColor: 'amber',
        },
        {
          id: 'laporan_bug',
          label: 'Bug & Masukan',
          icon: Bug,
          roles: ['admin', 'bendahara', 'sekretaris', 'warga'],
          badge: pendingBugCount > 0 ? `${pendingBugCount} Baru` : undefined,
          badgeColor: 'rose',
        },
        {
          id: 'pengembangan_aplikasi',
          label: 'Pengembangan',
          icon: Code2,
          roles: ['admin', 'bendahara', 'sekretaris', 'warga'],
          badge: 'v3.0',
          badgeColor: 'emerald',
        },
      ],
    },
  ];

  const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);
  const userRole = currentUser?.role || 'warga';

  const filteredMenuGroups = menuGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => item.roles.includes(userRole)),
    }))
    .filter((group) => group.items.length > 0);

  const handleSelectTab = (tabId: string) => {
    if (tabId === 'pengembangan_aplikasi') {
      setIsAboutModalOpen(true);
      setIsMobileMenuOpen(false);
      return;
    }
    setActiveTab(tabId);
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar Drawer */}
      <aside
        className={`fixed lg:static top-0 left-0 z-50 h-full w-64 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-300 border-r border-slate-200 dark:border-slate-800/80 flex flex-col transition-transform duration-300 ease-in-out print:hidden backdrop-blur-md ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Top Header Mobile Dismiss & App Brand */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800/80 bg-slate-50/80 dark:bg-slate-900/60 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
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
                <Church className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
              )}
            </div>
            <div className="min-w-0">
              <p className="font-bold text-slate-900 dark:text-white text-xs truncate">{settings.namaAplikasi}</p>
              </div>
          </div>

          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="lg:hidden text-slate-400 hover:text-slate-800 dark:hover:text-white p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Role Banner */}
        <div className="px-4 py-2.5 border-b border-slate-200 dark:border-slate-800/60 bg-slate-50/90 dark:bg-slate-950/80 text-xs space-y-1.5">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-500 dark:text-slate-400 font-semibold">Nama User:</span>
            <span className="text-slate-900 dark:text-white font-extrabold truncate max-w-[140px]" title={currentUser?.namaLengkap || currentUser?.namaPanggilan || currentUser?.username || (currentUser as any)?.name || 'User Pengurus'}>
              {currentUser?.namaLengkap || currentUser?.namaPanggilan || currentUser?.username || (currentUser as any)?.name || 'User Pengurus'}
            </span>
          </div>
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-500 dark:text-slate-400 font-semibold">Akses User:</span>
            <span className="capitalize font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-500/15 dark:text-indigo-300 dark:border-indigo-500/30 text-[10px]">
              {userRole}
            </span>
          </div>
        </div>

        {/* Menu Navigation Items Grouped */}
        <nav className="flex-1 p-2.5 space-y-2.5 overflow-y-auto">
          {filteredMenuGroups.map((group, idx) => (
            <div key={idx} className="space-y-0.5">
              <p className="px-3 py-0.5 text-[10px] font-extrabold tracking-normal text-slate-600 dark:text-slate-400 uppercase select-none">
                {group.groupLabel}
              </p>
              <div className="space-y-0.5 mt-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleSelectTab(item.id)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer ${
                        isActive
                          ? 'active-menu-btn bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-md shadow-indigo-600/25 border border-indigo-500/30 font-bold'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900 hover:text-slate-950 dark:hover:text-white hover:translate-x-0.5 font-medium'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Icon
                          className={`w-4 h-4 transition-colors shrink-0 ${
                            isActive ? 'text-white' : 'text-slate-500 dark:text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400'
                          }`}
                        />
                        <span className={`truncate tracking-normal ${isActive ? 'text-white font-bold' : ''}`}>
                          {item.label}
                        </span>
                      </div>
                      {item.badge && (
                        <span
                          className={`text-[9px] px-2 py-0.5 rounded-full font-bold border shrink-0 ml-1.5 ${
                            isActive
                              ? 'bg-white/20 text-white border-white/30'
                              : item.badgeColor === 'amber'
                              ? 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-500/15 dark:text-amber-400 dark:border-amber-500/30 animate-pulse'
                              : item.badgeColor === 'rose'
                              ? 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-500/15 dark:text-rose-300 dark:border-rose-500/30'
                              : item.badgeColor === 'purple'
                              ? 'bg-purple-50 text-purple-800 border-purple-200 dark:bg-purple-500/20 dark:text-purple-300 dark:border-purple-500/30'
                              : item.badgeColor === 'indigo'
                              ? 'bg-indigo-50 text-indigo-800 border-indigo-200 dark:bg-indigo-500/20 dark:text-indigo-300 dark:border-indigo-500/30'
                              : 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-400 dark:border-emerald-500/30'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer Brand Info & Logout Button */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800/80 bg-slate-50/60 dark:bg-slate-900/40 text-[11px] text-slate-500 dark:text-slate-400 space-y-3">
          {userRole !== 'warga' && (
            <div className="space-y-1.5">
              <button
                type="button"
                id="btn-sidebar-sync-cloud"
                onClick={() => syncCloudData()}
                disabled={isSyncingCloud}
                title="Klik untuk singkron data dari penyimpanan cloud"
                className="w-full flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold border border-blue-700 text-xs transition-all duration-200 active:scale-95 disabled:opacity-60 cursor-pointer shadow-sm btn-sidebar-blue"
                style={{ backgroundColor: '#2563eb', color: '#ffffff' }}
              >
                {isSyncingCloud ? (
                  <RefreshCw className="w-4 h-4 text-white animate-spin shrink-0" />
                ) : (
                  <Cloud className="w-4 h-4 text-white shrink-0" />
                )}
                <span className="text-white !text-white font-bold" style={{ color: '#ffffff' }}>
                  {isSyncingCloud ? 'Singkron Data...' : 'Singkron Data'}
                </span>
              </button>

              {syncMessage && (
                <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/80 border border-blue-200 dark:border-blue-500/30 text-[10px] text-blue-800 dark:text-blue-300 font-medium text-center animate-fade-in">
                  {syncMessage}
                </div>
              )}
            </div>
          )}

          <button
            type="button"
            id="btn-sidebar-logout"
            onClick={() => {
              setIsMobileMenuOpen(false);
              logout();
            }}
            className="w-full flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold border border-blue-800 text-xs transition-all duration-200 shadow-sm active:scale-98 cursor-pointer group btn-sidebar-blue"
            style={{ backgroundColor: '#1d4ed8', color: '#ffffff' }}
          >
            <LogOut className="w-4 h-4 text-white group-hover:scale-105 transition-transform shrink-0" />
            <span className="text-white !text-white font-bold" style={{ color: '#ffffff' }}>
              Logout
            </span>
          </button>
        </div>
      </aside>

      <AboutDeveloperModal
        isOpen={isAboutModalOpen}
        onClose={() => setIsAboutModalOpen(false)}
      />
    </>
  );
};
