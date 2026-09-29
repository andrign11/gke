import React, { useState, useEffect } from 'react';
import {
  ToggleLeft,
  ToggleRight,
  Eye,
  EyeOff,
  Check,
  RotateCcw,
  Save,
  ShieldAlert,
  Church,
  Calendar,
  BookOpen,
  UserPlus,
  Users,
  GitFork,
  QrCode,
  Bell,
  DollarSign,
  ShieldCheck,
  Package,
  Layers,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Laptop,
  FileText,
  Cake,
  MapPin,
  Heart,
  GraduationCap,
  Users2,
  Building2,
  ScrollText,
  FileCheck2,
  Mail,
  Loader2,
  X,
  AlertTriangle,
  BookMarked,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export interface PageVisibilityConfig {
  beranda: boolean;
  warta_jemaat: boolean;
  jadwal: boolean;
  alkitab: boolean;
  rancangan_khotbah: boolean;
  renungan: boolean;
  ulang_tahun: boolean;
  lingkungan_sektor: boolean;
  pendaftaran: boolean;
  sensus: boolean;
  kartu_keluarga: boolean;
  sakramen_sidi: boolean;
  surat_pelimpahan_nikah: boolean;
  katekisasi: boolean;
  kategorial: boolean;
  panitia_pembangunan: boolean;
  agenda_surat: boolean;
  persembahan_qris: boolean;
  notifikasi_persembahan: boolean;
  keuangan: boolean;
  kepengurusan: boolean;
  aset: boolean;
  [key: string]: boolean;
}

const DEFAULT_VISIBILITY: PageVisibilityConfig = {
  beranda: true,
  warta_jemaat: true,
  jadwal: true,
  alkitab: true,
  rancangan_khotbah: true,
  renungan: true,
  ulang_tahun: true,
  lingkungan_sektor: true,
  pendaftaran: true,
  sensus: true,
  kartu_keluarga: true,
  sakramen_sidi: true,
  surat_pelimpahan_nikah: true,
  katekisasi: true,
  kategorial: true,
  panitia_pembangunan: true,
  agenda_surat: true,
  persembahan_qris: true,
  notifikasi_persembahan: true,
  keuangan: true,
  kepengurusan: true,
  aset: true,
};

interface PageItemDef {
  key: keyof PageVisibilityConfig;
  title: string;
  description: string;
  category: 'ibadah' | 'keanggotaan' | 'keuangan' | 'organisasi';
  icon: React.ElementType;
  badge?: string;
  recommended?: boolean;
}

const PAGE_DEFINITIONS: PageItemDef[] = [
  // Category 1: Ibadah & Spiritual
  {
    key: 'beranda',
    title: 'Beranda Portal',
    description: 'Halaman utama portal warga, pengumuman ringkas, dan statistik jemaat.',
    category: 'ibadah',
    icon: Church,
    badge: 'Utama',
    recommended: true,
  },
  {
    key: 'warta_jemaat',
    title: 'Edisi Warta Jemaat (Cetak & Simpan)',
    description: 'Arsip dan publikasi edisi Warta Jemaat mingguan lengkap untuk diunduh, disimpan, atau dicetak.',
    category: 'ibadah',
    icon: FileText,
    badge: 'PDF / Cetak',
    recommended: true,
  },
  {
    key: 'jadwal',
    title: 'Jadwal Ibadah & Pelayanan',
    description: 'Jadwal kebaktian minggu, petugas ibadah, pelayan firman, pemusik, liturgos, dan pewarta.',
    category: 'ibadah',
    icon: Calendar,
    recommended: true,
  },
  {
    key: 'rancangan_khotbah',
    title: 'Rancangan Khotbah Aktif',
    description: 'Daftar rancangan khotbah aktif, nats Alkitab, poin utama homiletika, dan aplikasi pastoral.',
    category: 'ibadah',
    icon: ScrollText,
    badge: 'Khotbah',
    recommended: true,
  },
  {
    key: 'renungan',
    title: 'Buletin & Renungan Harian',
    description: 'Renungan harian, suara gembala, buletin doa, dan penguatan firman untuk jemaat.',
    category: 'ibadah',
    icon: BookOpen,
    recommended: true,
  },
  {
    key: 'alkitab',
    title: 'Alkitab Terjemahan Baru (TB Lengkap)',
    description: 'Teks lengkap Alkitab 66 Kitab (Perjanjian Lama & Baru), pencarian kata/frasa ayat, ayat harian, dan cetak naskah bacaan.',
    category: 'ibadah',
    icon: BookMarked,
    badge: '66 Kitab',
    recommended: true,
  },

  // Category 2: Pelayanan Keanggotaan & Warga
  {
    key: 'ulang_tahun',
    title: 'Ulang Tahun Kelahiran & Pernikahan',
    description: 'Daftar ulang tahun kelahiran & ulang tahun pernikahan warga jemaat minggu/bulan ini.',
    category: 'keanggotaan',
    icon: Cake,
    badge: 'HUT Warga',
    recommended: true,
  },
  {
    key: 'lingkungan_sektor',
    title: 'Data Lingkungan & Sektor Jemaat',
    description: 'Informasi struktur lingkungan, sektor pelayanan, pengurus, dan statistik wilayah jemaat.',
    category: 'keanggotaan',
    icon: MapPin,
    recommended: true,
  },
  {
    key: 'pendaftaran',
    title: 'Form Pendaftaran Anggota (Sensus Mandiri)',
    description: 'Formulir online pendaftaran mandiri warga baru atau pembaruan data keluarga.',
    category: 'keanggotaan',
    icon: UserPlus,
    badge: 'Form Mandiri',
    recommended: true,
  },
  {
    key: 'sensus',
    title: 'Pencarian Sensus Jemaat',
    description: 'Pencarian data warga jemaat berdasarkan nama, sektor/rayon, dan status keanggotaan.',
    category: 'keanggotaan',
    icon: Users,
  },
  {
    key: 'kartu_keluarga',
    title: 'Kartu Keluarga (KKJ) & Cetak',
    description: 'Detail Kartu Keluarga Jemaat (KKJ) dan tombol cetak sertifikat anggota keluarga.',
    category: 'keanggotaan',
    icon: GitFork,
  },

  // Category 3: Sakramen, Katekisasi & Kategorial
  {
    key: 'sakramen_sidi',
    title: 'Data Pernikahan Kudus, Baptisan Kudus & Sidi',
    description: 'Rekapitulasi data pelayanan sakramen Baptisan Kudus, Peneguhan Sidi, dan Pemberkatan Pernikahan Kudus.',
    category: 'organisasi',
    icon: Heart,
    badge: 'Sakramen',
    recommended: true,
  },
  {
    key: 'surat_pelimpahan_nikah',
    title: 'Surat Pelimpahan Nikah Kudus',
    description: 'Informasi dan rekapitulasi Surat Pelimpahan Pemberkatan Pernikahan Kudus antar Resort / Gereja.',
    category: 'organisasi',
    icon: FileCheck2,
    badge: 'Pelimpahan',
    recommended: true,
  },
  {
    key: 'katekisasi',
    title: 'Jadwal Katekisasi Sidi & Pernikahan',
    description: 'Jadwal kelas pengajaran/pembinaan Katekisasi Sidi dan Katekisasi Pra-Nikah beserta mentor/materi.',
    category: 'organisasi',
    icon: GraduationCap,
    recommended: true,
  },
  {
    key: 'kategorial',
    title: 'Seksi Pelayanan Kategorial GKE',
    description: 'Struktur kepengurusan dan program kerja Seksi Bapak (SPB), Seksi Perempuan (SPPer), Pemuda (SPPR/P), Sekolah Minggu (ASHM).',
    category: 'organisasi',
    icon: Users2,
    badge: 'SPB/SPPer/SPPR/P',
    recommended: true,
  },
  {
    key: 'panitia_pembangunan',
    title: 'Panitia Pembangunan GKE',
    description: 'Struktur Panitia Pembangunan, daftar proyek, progres pengerjaan fisik, dan laporan dana pembangunan.',
    category: 'organisasi',
    icon: Building2,
    badge: 'Proyek Fisik',
    recommended: true,
  },
  {
    key: 'agenda_surat',
    title: 'Agenda & Arsip Surat Gereja',
    description: 'Informasi daftar agenda surat masuk dan surat keluar resmi gereja.',
    category: 'organisasi',
    icon: Mail,
    badge: 'Surat Masuk/Keluar',
  },
  {
    key: 'kepengurusan',
    title: 'Pengurus MPH & Majelis Jemaat',
    description: 'Daftar nama dan struktur pengurus Majelis Pekerja Harian (MPH), Penatua, dan Diakon.',
    category: 'organisasi',
    icon: ShieldCheck,
  },
  {
    key: 'aset',
    title: 'Daftar Aset & Inventaris Gereja',
    description: 'Transparansi daftar aset gereja, peralatan ibadah, kendaraan operasional, dan perlengkapan.',
    category: 'organisasi',
    icon: Package,
  },

  // Category 4: Keuangan & Persembahan
  {
    key: 'persembahan_qris',
    title: 'Persembahan QRIS & GoPay',
    description: 'Tombol modal pemindaian QRIS dinamis, transfer GoPay/Bank, dan pengiriman bukti resi.',
    category: 'keuangan',
    icon: QrCode,
    badge: 'QRIS & GoPay',
    recommended: true,
  },
  {
    key: 'notifikasi_persembahan',
    title: 'Notifikasi Status Resi Persembahan',
    description: 'Halaman lacak status verifikasi resi persembahan digital dan unduh kwitansi resmi.',
    category: 'keuangan',
    icon: Bell,
    badge: 'Lacak Resi',
    recommended: true,
  },
  {
    key: 'keuangan',
    title: 'Buku Kas Jemaat (Transparansi Kas)',
    description: 'Transparansi laporan buku kas umum, kas pembangunan, dan kas kategorial untuk warga jemaat.',
    category: 'keuangan',
    icon: DollarSign,
  },
];

export const PengaturanHalamanWargaModule: React.FC = () => {
  const { settings, updateSettings, currentUser } = useApp();

  const [visibility, setVisibility] = useState<PageVisibilityConfig>(() => {
    return {
      ...DEFAULT_VISIBILITY,
      ...(settings.portalPageVisibility || {}),
    };
  });

  const [saveSuccess, setSaveSuccess] = useState(false);
  const [activeTabCategory, setActiveTabCategory] = useState<'semua' | 'ibadah' | 'keanggotaan' | 'keuangan' | 'organisasi'>('semua');
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  // States for save confirmation modal & progress
  const [isConfirmSaveModalOpen, setIsConfirmSaveModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveProgress, setSaveProgress] = useState(0);
  const [saveStepLabel, setSaveStepLabel] = useState('');
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (settings.portalPageVisibility && !isSaving) {
      setVisibility({
        ...DEFAULT_VISIBILITY,
        ...settings.portalPageVisibility,
      });
    }
  }, [settings.portalPageVisibility, isSaving]);

  if (!currentUser || currentUser.role !== 'admin') {
    return (
      <div className="bg-amber-500/10 border border-amber-500/30 text-amber-300 p-6 rounded-2xl flex items-center gap-3 backdrop-blur-md">
        <ShieldAlert className="w-6 h-6 text-amber-400 flex-shrink-0" />
        <div>
          <h3 className="font-bold text-sm text-slate-100">Akses Terbatas</h3>
          <p className="text-xs text-amber-300/80 mt-0.5">
            Hanya akun dengan role <strong className="text-amber-200">Admin</strong> yang berhak mengelola Pengaturan Visibilitas Halaman Portal Warga.
          </p>
        </div>
      </div>
    );
  }

  const handleToggle = (key: keyof PageVisibilityConfig) => {
    setVisibility((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleEnableAll = () => {
    const updated: PageVisibilityConfig = { ...DEFAULT_VISIBILITY };
    Object.keys(updated).forEach((k) => {
      updated[k as keyof PageVisibilityConfig] = true;
    });
    setVisibility(updated);
  };

  const handleDisableAllExceptHome = () => {
    const updated: PageVisibilityConfig = { ...DEFAULT_VISIBILITY };
    Object.keys(updated).forEach((k) => {
      updated[k as keyof PageVisibilityConfig] = k === 'beranda';
    });
    setVisibility(updated);
  };

  const handleResetDefault = () => {
    setVisibility({ ...DEFAULT_VISIBILITY });
  };

  const handleOpenSaveModal = () => {
    setSaveError(null);
    setIsConfirmSaveModalOpen(true);
  };

  const handleConfirmSave = async () => {
    if (isSaving) return;
    setIsSaving(true);
    setSaveError(null);
    setSaveProgress(20);
    setSaveStepLabel('Memverifikasi status hak akses & visibilitas halaman...');

    try {
      await new Promise((r) => setTimeout(r, 200));
      setSaveProgress(50);
      setSaveStepLabel('Menyiapkan rute navigasi dan sinkronisasi Portal Warga...');

      await new Promise((r) => setTimeout(r, 250));
      setSaveProgress(80);
      setSaveStepLabel('Menyimpan konfigurasi ke Cloud Firestore & Local Cache...');

      const res = await updateSettings({
        portalPageVisibility: visibility,
      });

      if (res && res.success === false) {
        throw new Error(res.error || 'Gagal menyimpan konfigurasi visibilitas halaman.');
      }

      setSaveProgress(100);
      setSaveStepLabel('Pengaturan halaman warga berhasil diterapkan!');
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4500);

      await new Promise((r) => setTimeout(r, 450));
      setIsConfirmSaveModalOpen(false);
    } catch (err: any) {
      console.error('Gagal menyimpan visibilitas portal:', err);
      setSaveError(err?.message || 'Terjadi kesalahan saat menyimpan pengaturan ke Cloud Firestore.');
    } finally {
      setIsSaving(false);
      setSaveProgress(0);
    }
  };

  const enabledCount = Object.values(visibility).filter(Boolean).length;
  const totalCount = Object.keys(DEFAULT_VISIBILITY).length;
  const disabledCount = totalCount - enabledCount;

  const filteredItems = PAGE_DEFINITIONS.filter((item) => {
    if (activeTabCategory === 'semua') return true;
    return item.category === activeTabCategory;
  });

  return (
    <div className="space-y-6 w-full pb-12 animate-fade-in">
      {/* Header Banner */}
      <div className="bg-slate-900/90 p-5 sm:p-6 rounded-2xl border border-slate-800/80 shadow-xl backdrop-blur-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1.5 min-w-0">
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-500/20 to-blue-500/20 text-indigo-400 border border-indigo-500/30">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-extrabold text-slate-100 flex items-center gap-2">
                <span>Pengaturan Halaman User Warga Jemaat</span>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                  Portal Warga
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Atur halaman &amp; fitur mana saja yang dapat diakses atau disembunyikan (Enabled / Disabled) untuk tampilan warga jemaat/publik.
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls & Badges */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-end shrink-0">
          <button
            type="button"
            onClick={() => setShowPreviewModal(true)}
            className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition-all flex items-center gap-2 cursor-pointer active:scale-95 shadow-sm"
          >
            <Laptop className="w-4 h-4 text-indigo-400" />
            <span>Simulasi Tampilan Portal</span>
          </button>

          <button
            type="button"
            onClick={handleOpenSaveModal}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-extrabold text-xs shadow-lg shadow-indigo-600/30 border border-indigo-400/40 transition-all flex items-center gap-2 cursor-pointer active:scale-95"
          >
            <Save className="w-4 h-4" />
            <span>Simpan Pengaturan</span>
          </button>
        </div>
      </div>

      {/* Save Success Toast */}
      {saveSuccess && (
        <div className="bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 p-4 rounded-2xl flex items-center justify-between gap-3 shadow-lg backdrop-blur-md animate-bounce">
          <div className="flex items-center gap-2.5 text-xs font-bold">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>Pengaturan visibilitas halaman berhasil disimpan dan langsung aktif di Portal Warga Jemaat!</span>
          </div>
          <span className="text-[10px] text-emerald-400 font-mono">Status: Synced Cloud</span>
        </div>
      )}

      {/* Summary Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-slate-400">Total Halaman Terdaftar</p>
            <p className="text-xl font-extrabold text-slate-100 mt-0.5">{totalCount} Halaman</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-900/80 p-4 rounded-2xl border border-emerald-500/30 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-emerald-400">Halaman Aktif (Enabled)</p>
            <p className="text-xl font-extrabold text-emerald-300 mt-0.5">{enabledCount} Halaman</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Eye className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-900/80 p-4 rounded-2xl border border-rose-500/30 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-rose-400">Halaman Disembunyikan (Disabled)</p>
            <p className="text-xl font-extrabold text-rose-300 mt-0.5">{disabledCount} Halaman</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400">
            <EyeOff className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Batch Control Toolbar & Category Filter */}
      <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800/80 shadow-lg space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 text-xs">
            <button
              type="button"
              onClick={() => setActiveTabCategory('semua')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer shrink-0 ${
                activeTabCategory === 'semua'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              Semua ({totalCount})
            </button>
            <button
              type="button"
              onClick={() => setActiveTabCategory('ibadah')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer shrink-0 ${
                activeTabCategory === 'ibadah'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              ⛪ Ibadah &amp; Spiritual
            </button>
            <button
              type="button"
              onClick={() => setActiveTabCategory('keanggotaan')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer shrink-0 ${
                activeTabCategory === 'keanggotaan'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              👥 Keanggotaan
            </button>
            <button
              type="button"
              onClick={() => setActiveTabCategory('keuangan')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer shrink-0 ${
                activeTabCategory === 'keuangan'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              💰 Keuangan &amp; QRIS
            </button>
            <button
              type="button"
              onClick={() => setActiveTabCategory('organisasi')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer shrink-0 ${
                activeTabCategory === 'organisasi'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              🏢 Organisasi &amp; Aset
            </button>
          </div>

          {/* Batch Actions */}
          <div className="flex items-center gap-2 justify-end shrink-0">
            <button
              type="button"
              onClick={handleEnableAll}
              className="px-2.5 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 active:scale-95"
              title="Aktifkan Semua Halaman"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Aktifkan Semua</span>
            </button>

            <button
              type="button"
              onClick={handleDisableAllExceptHome}
              className="px-2.5 py-1.5 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 active:scale-95"
              title="Sembunyikan Semua Kecuali Beranda"
            >
              <EyeOff className="w-3.5 h-3.5" />
              <span>Matikan Semua (Kecuali Beranda)</span>
            </button>

            <button
              type="button"
              onClick={handleResetDefault}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 active:scale-95"
              title="Reset ke Pengaturan Bawaan"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          </div>
        </div>

        <p className="text-[11px] text-slate-400 italic flex items-center gap-1.5">
          <HelpCircle className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
          <span>
            Klik tombol toggle di setiap kartu halaman untuk mengaktifkan (<strong className="text-emerald-300 font-bold">Enabled</strong>) atau menyembunyikan (<strong className="text-rose-300 font-bold">Disabled</strong>) menu tersebut dari tampilan Warga Jemaat.
          </span>
        </p>
      </div>

      {/* Grid of Page Items */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredItems.map((item) => {
          const isEnabled = !!visibility[item.key];
          const ItemIcon = item.icon;

          return (
            <div
              key={item.key}
              className={`p-4 rounded-2xl border transition-all duration-200 flex flex-col justify-between gap-3 ${
                isEnabled
                  ? 'bg-slate-900/90 border-emerald-500/40 shadow-lg shadow-emerald-950/20'
                  : 'bg-slate-950/60 border-slate-800/80 opacity-75 hover:opacity-100'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <div
                    className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${
                      isEnabled
                        ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                        : 'bg-slate-800 border-slate-700 text-slate-400'
                    }`}
                  >
                    <ItemIcon className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 space-y-0.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-bold text-slate-100 text-xs sm:text-sm truncate">
                        {item.title}
                      </h4>
                      {item.badge && (
                        <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                          {item.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>

                {/* Toggle Button Switch */}
                <button
                  type="button"
                  onClick={() => handleToggle(item.key)}
                  className={`relative inline-flex h-7 w-13 items-center rounded-full transition-colors duration-200 focus:outline-none cursor-pointer shrink-0 ${
                    isEnabled ? 'bg-emerald-600' : 'bg-slate-800 border border-slate-700'
                  }`}
                  title={isEnabled ? 'Klik untuk mematikan (Disable)' : 'Klik untuk mengaktifkan (Enable)'}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition duration-200 ease-in-out flex items-center justify-center ${
                      isEnabled ? 'translate-x-7' : 'translate-x-1'
                    }`}
                  >
                    {isEnabled ? (
                      <Check className="w-3 h-3 text-emerald-600 stroke-[3]" />
                    ) : (
                      <EyeOff className="w-3 h-3 text-slate-500" />
                    )}
                  </span>
                </button>
              </div>

              {/* Card Footer Status Indicator */}
              <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px]">
                <span className="text-slate-500 font-semibold">Status Akses Warga:</span>
                {isEnabled ? (
                  <span className="text-emerald-400 font-bold bg-emerald-500/10 px-2.5 py-0.5 rounded-md border border-emerald-500/20 flex items-center gap-1">
                    <Eye className="w-3 h-3" />
                    <span>Aktif (Tampil)</span>
                  </span>
                ) : (
                  <span className="text-rose-400 font-bold bg-rose-500/10 px-2.5 py-0.5 rounded-md border border-rose-500/20 flex items-center gap-1">
                    <EyeOff className="w-3 h-3" />
                    <span>Nonaktif (Disembunyikan)</span>
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom Save Action Bar */}
      <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-3 sticky bottom-4 z-20 backdrop-blur-md">
        <div className="flex items-center gap-2 text-xs text-slate-300">
          <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
          <span>
            Perubahan yang Anda buat akan langsung memengaruhi menu di Portal Warga Jemaat secara real-time.
          </span>
        </div>

        <button
          type="button"
          onClick={handleOpenSaveModal}
          className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-extrabold text-xs shadow-lg shadow-indigo-600/30 border border-indigo-400/40 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 shrink-0"
        >
          <Save className="w-4 h-4" />
          <span>Simpan Perubahan Sekarang</span>
        </button>
      </div>

      {/* Confirmation Modal for Saving Portal Visibility */}
      {isConfirmSaveModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl animate-scale-in">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-800 bg-slate-950/90 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-400">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-100 text-base flex items-center gap-2">
                    <span>Konfirmasi Simpan Pengaturan Halaman Portal Warga</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Tinjau ringkasan akses halaman portal warga sebelum diterapkan ke sistem jemaat &amp; Cloud.
                  </p>
                </div>
              </div>
              {!isSaving && (
                <button
                  type="button"
                  onClick={() => setIsConfirmSaveModalOpen(false)}
                  className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-4 bg-slate-950/50 text-xs">
              {/* Alert Info Banner */}
              <div className="bg-indigo-950/40 border border-indigo-500/30 p-3.5 rounded-xl flex items-start gap-3 text-indigo-200">
                <AlertCircle className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold text-xs text-indigo-100">
                    Penerapan Visibilitas Menu Portal Warga
                  </p>
                  <p className="text-[11px] text-indigo-300/90 leading-relaxed">
                    Halaman yang diaktifkan (<strong className="text-emerald-300">Enabled</strong>) akan langsung dapat diakses oleh warga jemaat di menu navigasi, sedangkan halaman yang dinonaktifkan (<strong className="text-rose-300">Disabled</strong>) akan disembunyikan secara aman.
                  </p>
                </div>
              </div>

              {/* Status Metric Pill Summary */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800 text-center">
                  <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total Halaman</p>
                  <p className="text-lg font-extrabold text-slate-100 mt-0.5">{totalCount}</p>
                </div>
                <div className="bg-slate-900/90 p-3 rounded-xl border border-emerald-500/30 text-center">
                  <p className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">Tampil (Aktif)</p>
                  <p className="text-lg font-extrabold text-emerald-300 mt-0.5">{enabledCount} Halaman</p>
                </div>
                <div className="bg-slate-900/90 p-3 rounded-xl border border-rose-500/30 text-center">
                  <p className="text-[10px] uppercase font-bold text-rose-400 tracking-wider">Sembunyi</p>
                  <p className="text-lg font-extrabold text-rose-300 mt-0.5">{disabledCount} Halaman</p>
                </div>
              </div>

              {/* Detailed Breakdown List */}
              <div className="space-y-2">
                <h4 className="font-bold text-slate-200 text-xs flex items-center justify-between">
                  <span>Rincian Status Halaman yang Diubah:</span>
                  <span className="text-[10px] text-slate-400 font-normal">
                    {enabledCount} dari {totalCount} halaman terbuka
                  </span>
                </h4>

                <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 max-h-56 overflow-y-auto space-y-1.5 divide-y divide-slate-800/40">
                  {PAGE_DEFINITIONS.map((p) => {
                    const isVisible = visibility[p.key];
                    const IconComp = p.icon;
                    return (
                      <div
                        key={p.key}
                        className="pt-1.5 first:pt-0 flex items-center justify-between gap-2 text-xs"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <IconComp
                            className={`w-3.5 h-3.5 shrink-0 ${
                              isVisible ? 'text-indigo-400' : 'text-slate-600'
                            }`}
                          />
                          <span
                            className={`font-semibold truncate ${
                              isVisible ? 'text-slate-200' : 'text-slate-500 line-through'
                            }`}
                          >
                            {p.title}
                          </span>
                        </div>

                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 flex items-center gap-1 ${
                            isVisible
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                          }`}
                        >
                          {isVisible ? (
                            <>
                              <Check className="w-2.5 h-2.5 stroke-[3]" />
                              <span>Tampil</span>
                            </>
                          ) : (
                            <>
                              <EyeOff className="w-2.5 h-2.5" />
                              <span>Sembunyi</span>
                            </>
                          )}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Progress & Status Message during save */}
              {isSaving && (
                <div className="bg-slate-900 p-4 rounded-xl border border-indigo-500/40 space-y-2 animate-fade-in">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-indigo-300 flex items-center gap-2">
                      <Loader2 className="w-4 h-4 text-indigo-400 animate-spin" />
                      <span>{saveStepLabel}</span>
                    </span>
                    <span className="font-mono text-indigo-400">{saveProgress}%</span>
                  </div>
                  <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                    <div
                      className="bg-gradient-to-r from-indigo-500 via-blue-500 to-emerald-400 h-full transition-all duration-300 rounded-full"
                      style={{ width: `${saveProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Error Message */}
              {saveError && (
                <div className="bg-rose-500/15 border border-rose-500/30 text-rose-300 p-3.5 rounded-xl flex items-start gap-2 text-xs">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Gagal Menyimpan:</span> {saveError}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between gap-3">
              <button
                type="button"
                disabled={isSaving}
                onClick={() => setIsConfirmSaveModalOpen(false)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                Batal / Kembali Periksa
              </button>

              <button
                type="button"
                disabled={isSaving}
                onClick={handleConfirmSave}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-blue-600 to-emerald-600 hover:from-indigo-500 hover:to-emerald-500 text-white font-extrabold text-xs shadow-lg shadow-indigo-600/30 border border-indigo-400/40 transition-all flex items-center gap-2 cursor-pointer active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Menerapkan Pengaturan ({saveProgress}%)...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-white" />
                    <span>Ya, Simpan &amp; Terapkan Sekarang</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preview Simulation Modal */}
      {showPreviewModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full max-h-[85vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
              <div className="flex items-center gap-2">
                <Laptop className="w-5 h-5 text-indigo-400" />
                <h3 className="font-bold text-slate-100 text-sm">
                  Simulasi Tampilan Sidebar Warga Jemaat
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowPreviewModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-4 overflow-y-auto space-y-3 bg-slate-950 text-xs">
              <p className="text-slate-400 text-[11px] mb-2">
                Berikut adalah simulasi daftar menu yang akan terlihat oleh warga jemaat berdasarkan konfigurasi Anda saat ini ({enabledCount} aktif):
              </p>

              <div className="space-y-1 bg-slate-900 p-3 rounded-xl border border-slate-800">
                {PAGE_DEFINITIONS.map((p) => {
                  const isVisible = visibility[p.key];
                  const IconComp = p.icon;
                  return (
                    <div
                      key={p.key}
                      className={`flex items-center justify-between p-2 rounded-lg ${
                        isVisible
                          ? 'bg-slate-800/80 text-slate-200 border border-slate-700/60'
                          : 'bg-slate-950 text-slate-600 border border-slate-900 line-through opacity-50'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <IconComp className={`w-4 h-4 ${isVisible ? 'text-indigo-400' : 'text-slate-600'}`} />
                        <span className="font-semibold">{p.title}</span>
                      </div>
                      <span
                        className={`text-[9px] font-bold px-2 py-0.5 rounded ${
                          isVisible
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        }`}
                      >
                        {isVisible ? 'Tampil' : 'Sembunyi'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="p-3 border-t border-slate-800 bg-slate-950 flex justify-end">
              <button
                type="button"
                onClick={() => setShowPreviewModal(false)}
                className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-500 cursor-pointer"
              >
                Tutup Simulasi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
