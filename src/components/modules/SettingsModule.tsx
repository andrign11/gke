import React, { useState, useEffect, useRef } from 'react';
import {
  Church,
  Image,
  Save,
  Settings,
  ShieldAlert,
  CloudCheck,
  Cloud,
  Clock,
  Trash2,
  ShieldCheck as ShieldIcon,
  RefreshCw,
  Hash,
  FileText,
  Upload,
  CheckCircle2,
  Check,
  DollarSign,
  Layers,
  Loader2,
  X,
  AlertTriangle,
  Sparkles,
  UserCheck,
  Link2,
  Users,
  FileCheck2,
  Scale,
  Award,
  Database,
  Download,
  UploadCloud,
  FileJson,
  HardDrive,
  FileCheck,
  ShieldCheck,
  Construction,
  HardHat,
  Wrench,
  Eye,
  EyeOff,
  Radio,
  Power,
  Phone,
  MessageCircle,
  Sun,
  Moon,
  Palette,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import defaultGkeLogo from '../../assets/images/gke_logo_official_1785341836111.jpg';
import { KopSurat } from '../KopSurat';
import { UnderConstructionScreen } from '../UnderConstructionScreen';
import {
  extractOfficialSignatoriesFromOrg,
  buildSettingsPayloadFromSyncedOfficials,
  SyncedOfficialsResult,
} from '../../utils/officialsSync';
import { DatabaseBackupRestoreModal } from '../DatabaseBackupRestoreModal';
import {
  KNOWN_COLLECTIONS,
  CRITICAL_COLLECTION_IDS,
  exportFirestoreDatabase,
  exportCrucialDatabaseJson,
  downloadBackupJsonFile,
  validateBackupJson,
  restoreFirestoreDatabase,
  DatabaseBackupPayload,
  DatabaseBackupMetadata,
} from '../../utils/databaseBackupRestore';

// Helper to compress uploaded images to prevent exceeding localStorage quota and keep Firestore documents lightweight
const compressImageFile = (
  file: File,
  maxWidth = 400,
  maxHeight = 400,
  quality = 0.85
): Promise<string> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new window.Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(event.target?.result as string);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const isPng = file.type.includes('png');
        const compressedUrl = canvas.toDataURL(isPng ? 'image/png' : 'image/jpeg', quality);
        resolve(compressedUrl);
      };
      img.onerror = () => {
        resolve(event.target?.result as string);
      };
      img.src = event.target?.result as string;
    };
    reader.onerror = () => resolve('');
    reader.readAsDataURL(file);
  });
};

export const SettingsModule: React.FC = () => {
  const {
    settings,
    updateSettings,
    recordBackupCloud,
    currentUser,
    clearAppCache,
    setActiveTab,
    mphList,
    pengurusKategorialList,
    pengurusPembangunanList,
    syncOfficialsFromOrgData,
    addAuditLog,
    syncCloudData,
    wargaJemaatList,
    keuanganList,
    penatuaDiakonList,
    jadwalIbadahList,
    jabatanList,
    inventarisList,
    renunganList,
    pendaftaranList,
    rancanganKhotbahList,
    lingkunganList,
    agendaSuratList,
    pelayananSakramenList,
    beritaJemaatList,
    jadwalKatekisasiList,
    kegiatanKategorialList,
    proyekPembangunanList,
    auditLogs,
    userAccounts,
    themeAdmin,
    themePortal,
    setThemeAdmin,
    setThemePortal,
  } = useApp();

  const [form, setForm] = useState({ ...settings });
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isClearingCache, setIsClearingCache] = useState(false);
  const [isFormDirty, setIsFormDirty] = useState(false);

  // States for Under Construction & Maintenance Mode
  const [isPreviewMaintenanceModalOpen, setIsPreviewMaintenanceModalOpen] = useState(false);
  const [isTogglingMaintenanceQuick, setIsTogglingMaintenanceQuick] = useState(false);
  const [maintenanceToast, setMaintenanceToast] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // States for Database Backup & Restore Modal & Quick Action
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);
  const [isExportingQuickBackup, setIsExportingQuickBackup] = useState(false);
  const [isExportingCrucialBackup, setIsExportingCrucialBackup] = useState(false);
  const [crucialBackupProgress, setCrucialBackupProgress] = useState(0);
  const [crucialBackupStepLabel, setCrucialBackupStepLabel] = useState('');
  const [crucialBackupNotice, setCrucialBackupNotice] = useState<{
    success: boolean;
    message: string;
    totalRecords: number;
    timestamp: string;
  } | null>(null);

  const [lastBackupTime, setLastBackupTime] = useState<string | null>(() => {
    return localStorage.getItem('gke_last_backup_timestamp');
  });
  const [lastCrucialBackupTime, setLastCrucialBackupTime] = useState<string | null>(() => {
    return localStorage.getItem('gke_last_crucial_backup_timestamp');
  });

  // States for save confirmation modal & progress bar
  const [isConfirmSaveModalOpen, setIsConfirmSaveModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveProgress, setSaveProgress] = useState(0);
  const [saveStepLabel, setSaveStepLabel] = useState('');
  const [saveError, setSaveError] = useState<string | null>(null);

  // States for officials auto-syncing
  const [isSyncingOfficials, setIsSyncingOfficials] = useState(false);
  const [syncNotice, setSyncNotice] = useState<string | null>(null);

  // Live fallback state for complete backup
  const liveFallbackState: Record<string, any> = {
    settings,
    user_accounts: userAccounts,
    warga_jemaat: wargaJemaatList,
    keuangan: keuanganList,
    penatua_diakon: penatuaDiakonList,
    jadwal_ibadah: jadwalIbadahList,
    mph_jemaat: mphList,
    jabatan_organisasi: jabatanList,
    inventaris_aset: inventarisList,
    renungan: renunganList,
    pendaftaran: pendaftaranList,
    rancangan_khotbah: rancanganKhotbahList,
    lingkungan_jemaat: lingkunganList,
    agenda_surat: agendaSuratList,
    pelayanan_sakramen: pelayananSakramenList,
    berita_jemaat: beritaJemaatList,
    jadwal_katekisasi: jadwalKatekisasiList,
    pengurus_kategorial: pengurusKategorialList,
    kegiatan_kategorial: kegiatanKategorialList,
    pengurus_pembangunan: pengurusPembangunanList,
    proyek_pembangunan: proyekPembangunanList,
    audit_logs: auditLogs,
  };

  const totalLiveRecords = KNOWN_COLLECTIONS.reduce((acc, col) => {
    if (col.id === 'settings') return acc + 1;
    const arr = liveFallbackState[col.id];
    return acc + (Array.isArray(arr) ? arr.length : 0);
  }, 0);

  const crucialLiveRecords = KNOWN_COLLECTIONS.filter((c) => c.isCrucial).reduce((acc, col) => {
    if (col.id === 'settings') return acc + 1;
    const arr = liveFallbackState[col.id];
    return acc + (Array.isArray(arr) ? arr.length : 0);
  }, 0);

  // Skrip internal khusus untuk mencadangkan data krusial Firestore ke format JSON terstruktur
  const handleRunCrucialBackupScript = async () => {
    if (isExportingCrucialBackup) return;
    try {
      setIsExportingCrucialBackup(true);
      setCrucialBackupProgress(10);
      setCrucialBackupStepLabel('Mengidentifikasi snapshot 12 koleksi krusial gereja...');

      const payload = await exportCrucialDatabaseJson({
        fallbackState: liveFallbackState,
        currentUser,
        settings,
        onProgress: (progress, label) => {
          setCrucialBackupProgress(progress);
          setCrucialBackupStepLabel(label);
        },
      });

      setCrucialBackupProgress(90);
      setCrucialBackupStepLabel('Mengunduh file JSON data krusial...');

      downloadBackupJsonFile(payload, 'CADANGAN_KRUSIAL_FIRESTORE');

      const nowStr = new Date().toISOString();
      setLastBackupTime(nowStr);
      setLastCrucialBackupTime(nowStr);

      await recordBackupCloud({
        type: 'crucial',
        totalRecords: payload.metadata.totalRecords,
        filename: 'CADANGAN_KRUSIAL_FIRESTORE.json',
      });

      setCrucialBackupProgress(100);
      setCrucialBackupStepLabel('Cadangan data krusial berhasil diunduh!');
      setCrucialBackupNotice({
        success: true,
        message: `Skrip pencadangan keamanan berhasil mengekstrak ${payload.metadata.totalRecords} record krusial dari ${CRITICAL_COLLECTION_IDS.length} koleksi Firestore.`,
        totalRecords: payload.metadata.totalRecords,
        timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      });

      setTimeout(() => {
        setIsExportingCrucialBackup(false);
        setCrucialBackupProgress(0);
      }, 2500);
    } catch (err: any) {
      console.error('Crucial backup error:', err);
      setIsExportingCrucialBackup(false);
      setCrucialBackupNotice({
        success: false,
        message: err?.message || 'Terjadi kendala saat mengeksekusi skrip pencadangan data krusial.',
        totalRecords: 0,
        timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      });
    }
  };

  const handleQuickExportBackup = async () => {
    try {
      setIsExportingQuickBackup(true);
      const payload = await exportFirestoreDatabase({
        fallbackState: liveFallbackState,
        currentUser,
        settings,
        backupType: 'full',
      });

      downloadBackupJsonFile(payload, 'BACKUP_LENGKAP_FIRESTORE');

      const nowStr = new Date().toISOString();
      setLastBackupTime(nowStr);

      await recordBackupCloud({
        type: 'full',
        totalRecords: payload.metadata.totalRecords,
        filename: 'BACKUP_LENGKAP_FIRESTORE.json',
      });
    } catch (err) {
      console.error('Quick export backup error:', err);
    } finally {
      setIsExportingQuickBackup(false);
    }
  };

  // Live extracted signatories from organization structures (MPH, Seksi Kategorial & Panitia Pembangunan)
  const detectedOrgOfficials: SyncedOfficialsResult = extractOfficialSignatoriesFromOrg(
    mphList,
    pengurusKategorialList,
    pengurusPembangunanList
  );

  useEffect(() => {
    // Only update form from settings if user hasn't made unsaved edits or when settings change from external sync
    if (!isFormDirty && !isSaving) {
      setForm({ ...settings });
    }
  }, [settings, isFormDirty, isSaving]);

  const handleSyncOfficialsNow = async () => {
    setIsSyncingOfficials(true);
    try {
      const res = await syncOfficialsFromOrgData(true);
      const extracted = extractOfficialSignatoriesFromOrg(
        mphList,
        pengurusKategorialList,
        pengurusPembangunanList
      );
      const payload = buildSettingsPayloadFromSyncedOfficials(extracted);

      setForm((prev) => ({
        ...prev,
        ...payload,
      }));
      setIsFormDirty(true);

      setSyncNotice(
        `Berhasil menyinkronkan 17 nama pejabat penandatangan kop surat & laporan dari data Kepengurusan MPH, BPP, MP, Seksi Kategorial, dan Panitia Pembangunan!`
      );
      setTimeout(() => setSyncNotice(null), 5000);
    } catch (err) {
      console.error('Error syncing officials:', err);
    } finally {
      setIsSyncingOfficials(false);
    }
  };

  const handleApplySingleOfficial = (field: keyof typeof form, value: string) => {
    handleFieldChange(field, value);
    setSyncNotice(`Jabatan telah diperbarui dari struktur organisasi.`);
    setTimeout(() => setSyncNotice(null), 3000);
  };

  const handleFieldChange = <K extends keyof typeof form>(key: K, value: typeof form[K]) => {
    setIsFormDirty(true);
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleToggleMaintenanceQuick = async (targetState: boolean) => {
    try {
      setIsTogglingMaintenanceQuick(true);
      const updated = {
        ...form,
        maintenanceModeEnabled: targetState,
      };
      setForm(updated);
      const res = await updateSettings(updated);
      if (res && res.success === false) {
        throw new Error(res.error || 'Gagal menyimpan status perbaikan ke Cloud Firestore.');
      }
      addAuditLog({
        action: targetState ? 'MAINTENANCE_ENABLED' : 'MAINTENANCE_DISABLED',
        details: targetState
          ? 'Mengaktifkan mode perbaikan sistem (Under Construction)'
          : 'Menonaktifkan mode perbaikan sistem (Sistem normal kembali)',
        user: currentUser?.namaLengkap || 'Admin',
        module: 'Pengaturan Sistem',
      });
      setMaintenanceToast({
        type: 'success',
        message: targetState
          ? 'Mode Perbaikan (Under Construction) BERHASIL DIAKTIFKAN. Warga jemaat dialihkan ke tampilan pemeliharaan.'
          : 'Mode Perbaikan BERHASIL DINONAKTIFKAN. Sistem kembali beroperasi normal untuk seluruh pengguna.',
      });
      setTimeout(() => setMaintenanceToast(null), 5000);
    } catch (err: any) {
      console.error('Error toggling maintenance mode:', err);
      setMaintenanceToast({
        type: 'error',
        message: err?.message || 'Gagal memperbarui status mode perbaikan.',
      });
    } finally {
      setIsTogglingMaintenanceQuick(false);
    }
  };

  const handleToggleAllowedRole = (roleKey: string) => {
    const currentRoles = form.maintenanceAllowedRoles || ['admin'];
    let nextRoles: string[];
    if (currentRoles.includes(roleKey)) {
      if (roleKey === 'admin') {
        // Admin must always be allowed
        return;
      }
      nextRoles = currentRoles.filter((r) => r !== roleKey);
    } else {
      nextRoles = [...currentRoles, roleKey];
    }
    handleFieldChange('maintenanceAllowedRoles', nextRoles);
  };

  if (!currentUser || currentUser.role !== 'admin') {
    return (
      <div className="bg-amber-500/10 border border-amber-500/30 text-amber-300 p-6 rounded-2xl flex items-center gap-3 backdrop-blur-md">
        <ShieldAlert className="w-6 h-6 text-amber-400 flex-shrink-0" />
        <div>
          <h3 className="font-bold text-sm text-slate-100">Akses Terbatas</h3>
          <p className="text-xs text-amber-300/80 mt-0.5">
            Hanya akun dengan role <strong className="text-amber-200">Admin</strong> yang berhak mengubah Pengaturan Aplikasi.
          </p>
        </div>
      </div>
    );
  }

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSaveError(null);
    setIsConfirmSaveModalOpen(true);
  };

  const handleConfirmSave = async () => {
    if (isSaving) return;
    setIsSaving(true);
    setSaveError(null);
    setSaveProgress(15);
    setSaveStepLabel('Memverifikasi kelengkapan data identitas & kop surat...');

    try {
      await new Promise((r) => setTimeout(r, 200));
      setSaveProgress(45);
      setSaveStepLabel('Menyiapkan format dokumen & konfigurasi penomoran...');

      await new Promise((r) => setTimeout(r, 250));
      setSaveProgress(75);
      setSaveStepLabel('Menyimpan ke Cloud Firestore & Local Cache...');

      const res = await updateSettings(form);
      if (res && res.success === false) {
        throw new Error(res.error || 'Gagal menyimpan pengaturan ke Cloud Firestore.');
      }

      setSaveProgress(100);
      setSaveStepLabel('Pengaturan berhasil disimpan dan disinkronisasikan!');
      setIsFormDirty(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4500);

      await new Promise((r) => setTimeout(r, 450));
      setIsConfirmSaveModalOpen(false);
    } catch (err: any) {
      console.error('Gagal menyimpan pengaturan:', err);
      setSaveError(err?.message || 'Terjadi kendala jaringan saat menyimpan pengaturan.');
    } finally {
      setIsSaving(false);
      setSaveProgress(0);
    }
  };

  return (
    <div className="space-y-6 w-full pb-10">
      <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800/80 shadow-lg backdrop-blur-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                <Settings className="w-5 h-5" />
              </div>
              Pengaturan Identitas & Kop Surat Aplikasi
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Semua pengaturan, logo, dan isian form tersimpan secara otomatis di Cloud Firestore
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto justify-end">
          {saveSuccess && (
            <div className="bg-emerald-500/20 text-emerald-300 text-xs font-bold px-3.5 py-2 rounded-xl border border-emerald-500/40 shadow-md flex items-center gap-1.5 animate-bounce">
              ✓ Berhasil Disimpan!
            </div>
          )}

          {/* Shortcut Button to Database Backup & Restore */}
          <button
            type="button"
            onClick={() => setIsBackupModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 text-xs font-bold transition-all shadow-sm active:scale-95 cursor-pointer"
            title="Buka panel Backup & Restore Database Firestore"
          >
            <Database className="w-4 h-4 text-indigo-400" />
            <span>Backup & Restore Database</span>
            <span className="text-[10px] bg-indigo-500/30 text-indigo-200 px-1.5 py-0.5 rounded font-mono font-bold">
              JSON
            </span>
          </button>

          <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-3 py-2 rounded-xl border border-emerald-500/20 hidden md:flex items-center gap-1.5">
            <CloudCheck className="w-4 h-4 text-emerald-400" />
            <span>Cloud Sync Active</span>
          </span>
        </div>
      </div>

      {/* Banner Shortcut to Page Visibility Settings */}
      <div className="bg-gradient-to-r from-indigo-950/80 via-slate-900 to-blue-950/80 p-4 sm:p-5 rounded-2xl border border-indigo-500/30 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-500/20 text-indigo-300 rounded-2xl border border-indigo-500/30 shrink-0">
            <Layers className="w-6 h-6" />
          </div>
          <div className="space-y-0.5">
            <h4 className="font-extrabold text-slate-100 text-sm">
              Pengaturan Halaman User Warga Jemaat (Enabled / Disabled)
            </h4>
            <p className="text-xs text-indigo-200/80">
              Kelola visibilitas menu portal jemaat (Atur halaman mana saja yang ingin ditampilkan/disembunyikan untuk Warga Jemaat).
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setActiveTab('pengaturan_halaman_warga')}
          className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs transition-all shadow-md cursor-pointer shrink-0 active:scale-95 flex items-center justify-center gap-1.5"
        >
          <span>Kelola Visibilitas Halaman</span>
          <span>→</span>
        </button>
      </div>

      {/* Banner Shortcut to Church Background Settings */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/90 to-purple-950/80 p-4 sm:p-5 rounded-2xl border border-indigo-500/30 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-500/20 text-indigo-300 rounded-2xl border border-indigo-500/30 shrink-0">
            <Image className="w-6 h-6" />
          </div>
          <div className="space-y-0.5">
            <h4 className="font-extrabold text-slate-100 text-sm flex items-center gap-2">
              <span>Pengaturan Background Gereja & Halaman Login</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/30 text-indigo-200 border border-indigo-500/40">
                Baru
              </span>
            </h4>
            <p className="text-xs text-indigo-200/80">
              Atur foto latar belakang gereja untuk halaman login, sesuaikan opasitas cahaya terang, dan pilih dari koleksi preset foto gereja atau unggah foto gereja sendiri.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setActiveTab('pengaturan_background')}
          className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs transition-all shadow-md cursor-pointer shrink-0 active:scale-95 flex items-center justify-center gap-1.5"
        >
          <span>Buka Pengaturan Background</span>
          <span>→</span>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* SECTION: Mode Perbaikan (Under Construction & Pemeliharaan Sistem) */}
        <div
          className={`rounded-2xl p-6 border shadow-xl backdrop-blur-md space-y-5 text-xs transition-all duration-300 ${
            form.maintenanceModeEnabled
              ? 'bg-gradient-to-br from-amber-950/40 via-slate-900 to-amber-950/30 border-amber-500/50 shadow-amber-500/10'
              : 'bg-slate-900/80 border-slate-800/80'
          }`}
        >
          {/* Header & Status Indicator */}
          <div className="border-b border-slate-800 pb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div
                className={`p-2.5 rounded-2xl border transition-all ${
                  form.maintenanceModeEnabled
                    ? 'bg-amber-500/20 text-amber-400 border-amber-500/40 shadow-lg shadow-amber-500/20 animate-pulse'
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}
              >
                <Construction className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-bold text-slate-100 text-sm">
                    Mode Perbaikan Sistem (Under Construction Mode)
                  </h3>
                  {form.maintenanceModeEnabled ? (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1.5 shadow-xs">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                      Status: Aktif (Perbaikan)
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      Status: Nonaktif (Normal)
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Tampilkan halaman pemeliharaan &quot;Under Construction&quot; saat aplikasi dalam perbaikan atau pembaruan database.
                </p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={() => setIsPreviewMaintenanceModalOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 transition cursor-pointer active:scale-95"
                title="Lihat pratinjau halaman Under Construction"
              >
                <Eye className="w-4 h-4 text-indigo-400" />
                <span>Pratinjau Layar Penuh</span>
              </button>

              <button
                type="button"
                disabled={isTogglingMaintenanceQuick}
                onClick={() => handleToggleMaintenanceQuick(!form.maintenanceModeEnabled)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs transition shadow-md active:scale-95 cursor-pointer disabled:opacity-50 ${
                  form.maintenanceModeEnabled
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20'
                    : 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/20'
                }`}
              >
                {isTogglingMaintenanceQuick ? (
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                ) : (
                  <Power className="w-4 h-4" />
                )}
                <span>
                  {form.maintenanceModeEnabled
                    ? 'Matikan Perbaikan (Buka Normal)'
                    : 'Aktifkan Mode Perbaikan Sekarang'}
                </span>
              </button>
            </div>
          </div>

          {/* Maintenance Notice Toast */}
          {maintenanceToast && (
            <div
              className={`p-3 rounded-xl border flex items-center justify-between gap-2 text-xs font-semibold animate-in fade-in shadow-sm ${
                maintenanceToast.type === 'success'
                  ? 'bg-emerald-100 dark:bg-emerald-950/70 border-emerald-300 dark:border-emerald-500/40 text-emerald-950 dark:text-emerald-200'
                  : 'bg-rose-100 dark:bg-rose-950/70 border-rose-300 dark:border-rose-500/40 text-rose-950 dark:text-rose-200'
              }`}
            >
              <div className="flex items-center gap-2">
                {maintenanceToast.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-700 dark:text-emerald-400 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-rose-700 dark:text-rose-400 shrink-0" />
                )}
                <span className="font-bold">{maintenanceToast.message}</span>
              </div>
              <button
                type="button"
                onClick={() => setMaintenanceToast(null)}
                className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white p-1 rounded-md transition cursor-pointer"
                aria-label="Tutup pesan"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Switch Toggle & Explanations */}
          <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <label className="font-bold text-slate-200 text-xs flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={Boolean(form.maintenanceModeEnabled)}
                  onChange={(e) => handleFieldChange('maintenanceModeEnabled', e.target.checked)}
                  className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500 bg-slate-900 border-slate-700"
                />
                <span>Aktifkan Mode Perbaikan (Under Construction)</span>
              </label>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Saat opsi ini aktif, seluruh pengunjung dan warga jemaat yang membuka aplikasi akan melihat halaman informasi pemeliharaan dan tidak dapat mengakses menu portal hingga perbaikan selesai.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <span
                className={`text-xs font-bold ${
                  form.maintenanceModeEnabled ? 'text-amber-400 font-mono' : 'text-slate-500'
                }`}
              >
                {form.maintenanceModeEnabled ? 'AKTIF (UNDER CONSTRUCTION)' : 'NONAKTIF (SISTEM NORMAL)'}
              </span>
            </div>
          </div>

          {/* Configuration Form Inputs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">
                Judul Status Pemeliharaan (Tampil di Layar Under Construction)
              </label>
              <input
                type="text"
                value={form.maintenanceTitle || ''}
                onChange={(e) => handleFieldChange('maintenanceTitle', e.target.value)}
                placeholder="Contoh: Sistem Sedang Dalam Masa Pemeliharaan & Perbaikan"
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 font-bold focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">
                Estimasi Waktu Selesai Perbaikan
              </label>
              <input
                type="text"
                value={form.maintenanceEstimatedCompletion || ''}
                onChange={(e) => handleFieldChange('maintenanceEstimatedCompletion', e.target.value)}
                placeholder="Contoh: 27 Agustus 2026, Pukul 18:00 WIB / Segera"
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 font-medium focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">
                Pesan / Pengumuman Pemeliharaan untuk Warga Jemaat
              </label>
              <textarea
                rows={3}
                value={form.maintenanceMessage || ''}
                onChange={(e) => handleFieldChange('maintenanceMessage', e.target.value)}
                placeholder="Tuliskan pesan penjelasan kepada jemaat..."
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 leading-relaxed focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 resize-none"
              />
            </div>

            <div className="space-y-3">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Kontak Narahubung / WhatsApp Darurat
                </label>
                <input
                  type="text"
                  value={form.maintenanceContactPerson || ''}
                  onChange={(e) => handleFieldChange('maintenanceContactPerson', e.target.value)}
                  placeholder="Contoh: Sekretariat Majelis Jemaat / 0812-xxxx-xxxx"
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                />
              </div>

              {/* Allowed Roles Selection */}
              <div>
                <label className="block font-semibold text-slate-300 mb-1.5">
                  Role yang Diizinkan Masuk Saat Masa Perbaikan:
                </label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { id: 'admin', label: 'Administrator', locked: true },
                    { id: 'bendahara', label: 'Bendahara', locked: false },
                    { id: 'sekretaris', label: 'Sekretaris', locked: false },
                  ].map((role) => {
                    const isChecked =
                      role.id === 'admin' ||
                      (form.maintenanceAllowedRoles &&
                        form.maintenanceAllowedRoles.includes(role.id));
                    return (
                      <label
                        key={role.id}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold cursor-pointer transition ${
                          isChecked
                            ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-300'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <input
                          type="checkbox"
                          disabled={role.locked}
                          checked={isChecked}
                          onChange={() => handleToggleAllowedRole(role.id)}
                          className="rounded text-indigo-600 focus:ring-indigo-500"
                        />
                        <span>{role.label}</span>
                        {role.locked && (
                          <span className="text-[9px] text-slate-400">(Wajib)</span>
                        )}
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Real-time Interactive Mini Preview Box */}
          <div className="bg-slate-950 p-4 rounded-xl border border-amber-500/20 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-amber-400" />
                <span>Simulasi Tampilan Kartu di Layar Pengunjung:</span>
              </span>
              <span className="text-[10px] text-slate-400 font-mono">Live Simulation</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-sky-200 shadow-md space-y-2 text-center max-w-lg mx-auto">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-100 via-yellow-50 to-sky-100 border border-amber-300 mx-auto flex items-center justify-center text-amber-500 shadow-sm">
                <Construction className="w-6 h-6 animate-bounce" />
              </div>
              <p className="font-extrabold text-slate-900 text-xs">
                {form.maintenanceTitle || 'Sistem Sedang Dalam Masa Pemeliharaan & Perbaikan'}
              </p>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                {form.maintenanceMessage || 'Mohon maaf atas ketidaknyamanan ini...'}
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2 pt-1 text-[10px]">
                <span className="px-2.5 py-1 rounded-lg bg-sky-50 border border-sky-200 text-sky-800 font-semibold shadow-xs">
                  ⏱️ Selesai: {form.maintenanceEstimatedCompletion || 'Segera'}
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 font-semibold shadow-xs">
                  📞 {form.maintenanceContactPerson || 'Sekretariat'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION: Pengaturan Tema & Warna Tulisan Mandiri (Admin MPH & Warga Jemaat) */}
        <div className="bg-slate-900/80 rounded-2xl p-6 border border-indigo-500/30 shadow-xl backdrop-blur-md space-y-5 text-xs">
          <div className="border-b border-slate-800 pb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                <Palette className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm flex items-center gap-2">
                  <span>Pengaturan Tema Tampilan Mandiri (Admin &amp; Warga Jemaat)</span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 border border-indigo-500/30">
                    Independen
                  </span>
                </h3>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                  Atur tema secara terpisah antara Menu Admin (MPH) dan Portal Warga Jemaat. Warna tulisan otomatis beradaptasi dengan latar belakang untuk keterbacaan maksimal (anti-silau &amp; kontras tinggi).
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 font-mono">
                Admin: <strong className={themeAdmin === 'dark' ? 'text-indigo-600 dark:text-indigo-400' : 'text-amber-600 dark:text-amber-400'}>{themeAdmin === 'dark' ? 'Gelap 🌙' : 'Terang ☀️'}</strong> | Warga: <strong className={themePortal === 'dark' ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}>{themePortal === 'dark' ? 'Gelap 🌙' : 'Terang ☀️'}</strong>
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Card 1: Tema Default Panel Admin */}
            <div className="bg-slate-950/70 p-4 sm:p-5 rounded-2xl border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-slate-200 text-xs">Tema Menu Admin &amp; MPH</h4>
                    <p className="text-[10px] text-slate-600 dark:text-slate-400">Tampilan dashboard manajemen pengurus &amp; majelis</p>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-indigo-700 dark:text-indigo-300 border border-slate-200 dark:border-slate-700">
                  Default: {(form.defaultAdminTheme || 'dark') === 'dark' ? 'Gelap' : 'Terang'}
                </span>
              </div>

              {/* Selector Buttons */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    handleFieldChange('defaultAdminTheme', 'dark');
                    setThemeAdmin('dark');
                  }}
                  className={`theme-toggle-card p-3.5 rounded-xl border flex flex-col items-center text-center gap-2 transition cursor-pointer ${
                    (form.defaultAdminTheme || 'dark') === 'dark'
                      ? 'is-active-indigo bg-indigo-50 dark:bg-indigo-600/20 border-indigo-500 shadow-md shadow-indigo-500/10 ring-1 ring-indigo-500'
                      : 'is-inactive bg-white dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <div className="theme-toggle-icon-box w-8 h-8 rounded-lg bg-white dark:bg-slate-900 border border-indigo-200 dark:border-slate-700 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-xs">
                    <Moon className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="theme-toggle-title font-bold text-xs text-slate-900 dark:text-slate-100">Mode Gelap (Dark)</p>
                    <p className="theme-toggle-subtitle text-[10px] text-slate-600 dark:text-slate-400 mt-0.5">Latar pekat, teks kontras tinggi</p>
                  </div>
                  {(form.defaultAdminTheme || 'dark') === 'dark' && (
                    <span className="badge-theme-selected px-2.5 py-0.5 rounded-full text-[9px] font-extrabold bg-indigo-600 text-white shadow-xs badge-white-text">
                      Dipilih ✓
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    handleFieldChange('defaultAdminTheme', 'light');
                    setThemeAdmin('light');
                  }}
                  className={`theme-toggle-card p-3.5 rounded-xl border flex flex-col items-center text-center gap-2 transition cursor-pointer ${
                    form.defaultAdminTheme === 'light'
                      ? 'is-active-amber bg-amber-50 dark:bg-amber-500/20 border-amber-500 shadow-md shadow-amber-500/10 ring-1 ring-amber-500'
                      : 'is-inactive bg-white dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <div className="theme-toggle-icon-box w-8 h-8 rounded-lg bg-white dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400 shadow-xs">
                    <Sun className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="theme-toggle-title font-bold text-xs text-slate-900 dark:text-slate-100">Mode Terang (Light)</p>
                    <p className="theme-toggle-subtitle text-[10px] text-slate-600 dark:text-slate-400 mt-0.5">Latar cerah, teks hitam pekat</p>
                  </div>
                  {form.defaultAdminTheme === 'light' && (
                    <span className="badge-theme-selected px-2.5 py-0.5 rounded-full text-[9px] font-extrabold bg-amber-600 text-white shadow-xs badge-white-text">
                      Dipilih ✓
                    </span>
                  )}
                </button>
              </div>

              {/* Simulation Preview Pill */}
              <div className={`p-3 rounded-xl border text-[11px] space-y-1 transition-all ${
                (form.defaultAdminTheme || 'dark') === 'dark'
                  ? 'bg-slate-900 border-slate-800 text-slate-100'
                  : 'bg-slate-100 border-slate-300 text-slate-900'
              }`}>
                <div className="flex items-center justify-between font-bold text-[10px] opacity-75">
                  <span>Pratinjau Keterbacaan Teks Admin:</span>
                  <span>{(form.defaultAdminTheme || 'dark') === 'dark' ? '🌙 Dark Mode' : '☀️ Light Mode'}</span>
                </div>
                <p className="font-bold">Dashboard MPH &amp; Administrasi Gereja</p>
                <p className="opacity-80 text-[10px]">Teks judul dan isi tabel otomatis kontras dengan latar belakang tanpa blur.</p>
              </div>
            </div>

            {/* Card 2: Tema Default Portal Warga Jemaat */}
            <div className="bg-slate-950/70 p-4 sm:p-5 rounded-2xl border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-slate-200 text-xs">Tema Portal Warga Jemaat</h4>
                    <p className="text-[10px] text-slate-600 dark:text-slate-400">Tampilan jemaat untuk warta, jadwal ibadah, &amp; persembahan</p>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-emerald-700 dark:text-emerald-300 border border-slate-200 dark:border-slate-700">
                  Default: {(form.defaultPortalTheme || 'dark') === 'dark' ? 'Gelap' : 'Terang'}
                </span>
              </div>

              {/* Selector Buttons */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    handleFieldChange('defaultPortalTheme', 'dark');
                    setThemePortal('dark');
                  }}
                  className={`theme-toggle-card p-3.5 rounded-xl border flex flex-col items-center text-center gap-2 transition cursor-pointer ${
                    (form.defaultPortalTheme || 'dark') === 'dark'
                      ? 'is-active-emerald bg-emerald-50 dark:bg-emerald-600/20 border-emerald-500 shadow-md shadow-emerald-500/10 ring-1 ring-emerald-500'
                      : 'is-inactive bg-white dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <div className="theme-toggle-icon-box w-8 h-8 rounded-lg bg-white dark:bg-slate-900 border border-emerald-200 dark:border-slate-700 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-xs">
                    <Moon className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="theme-toggle-title font-bold text-xs text-slate-900 dark:text-slate-100">Mode Gelap (Dark)</p>
                    <p className="theme-toggle-subtitle text-[10px] text-slate-600 dark:text-slate-400 mt-0.5">Mewah &amp; sejuk di malam hari</p>
                  </div>
                  {(form.defaultPortalTheme || 'dark') === 'dark' && (
                    <span className="badge-theme-selected px-2.5 py-0.5 rounded-full text-[9px] font-extrabold bg-emerald-600 text-white shadow-xs badge-white-text">
                      Dipilih ✓
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    handleFieldChange('defaultPortalTheme', 'light');
                    setThemePortal('light');
                  }}
                  className={`theme-toggle-card p-3.5 rounded-xl border flex flex-col items-center text-center gap-2 transition cursor-pointer ${
                    form.defaultPortalTheme === 'light'
                      ? 'is-active-amber bg-amber-50 dark:bg-amber-500/20 border-amber-500 shadow-md shadow-amber-500/10 ring-1 ring-amber-500'
                      : 'is-inactive bg-white dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <div className="theme-toggle-icon-box w-8 h-8 rounded-lg bg-white dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400 shadow-xs">
                    <Sun className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="theme-toggle-title font-bold text-xs text-slate-900 dark:text-slate-100">Mode Terang (Light)</p>
                    <p className="theme-toggle-subtitle text-[10px] text-slate-600 dark:text-slate-400 mt-0.5">Segar &amp; ramah lansia/jemaat</p>
                  </div>
                  {form.defaultPortalTheme === 'light' && (
                    <span className="badge-theme-selected px-2.5 py-0.5 rounded-full text-[9px] font-extrabold bg-amber-600 text-white shadow-xs badge-white-text">
                      Dipilih ✓
                    </span>
                  )}
                </button>
              </div>

              {/* Simulation Preview Pill */}
              <div className={`p-3 rounded-xl border text-[11px] space-y-1 transition-all ${
                (form.defaultPortalTheme || 'dark') === 'dark'
                  ? 'bg-slate-900 border-slate-800 text-slate-100'
                  : 'bg-slate-100 border-slate-300 text-slate-900'
              }`}>
                <div className="flex items-center justify-between font-bold text-[10px] opacity-75">
                  <span>Pratinjau Keterbacaan Portal Jemaat:</span>
                  <span>{(form.defaultPortalTheme || 'dark') === 'dark' ? '🌙 Dark Mode' : '☀️ Light Mode'}</span>
                </div>
                <p className="font-bold">Warta Jemaat &amp; Jadwal Ibadah Hari Minggu</p>
                <p className="opacity-80 text-[10px]">Warna teks judul banner gereja, kartu pengumuman, dan nomor rekening persembahan terbaca 100% jelas.</p>
              </div>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-slate-300 text-[11px] flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <strong className="text-indigo-200 block">Jaminan Keterbacaan Tulisan &amp; Kemandirian Tema:</strong>
              <span>
                Pengaturan tema di atas disimpan secara permanen di database Cloud Firestore. Admin dapat bekerja dalam Mode Gelap sementara seluruh jemaat tetap menikmati Mode Terang yang bersih (atau sebaliknya) tanpa saling mengubah atau menimpa satu sama lain.
              </span>
            </div>
          </div>
        </div>
        <div className="bg-slate-50 dark:bg-slate-900/80 rounded-2xl p-6 border border-slate-200 dark:border-slate-800/80 shadow-md backdrop-blur-md space-y-4 text-xs">
          <h3 className="font-bold text-slate-900 dark:text-slate-100 border-b border-slate-200 dark:border-slate-800 pb-3 flex items-center gap-2 text-sm">
            <Church className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            Identitas Gereja &amp; Nama Aplikasi
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-800 dark:text-slate-300 mb-1">
                Nama Aplikasi (Sistem)
              </label>
              <input
                type="text"
                required
                value={form.namaAplikasi || ''}
                onChange={(e) => setForm({ ...form, namaAplikasi: e.target.value })}
                className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-slate-100 font-bold focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 shadow-xs"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-800 dark:text-slate-300 mb-1">
                Deskripsi / Sub-Nama Aplikasi (Tampil di Bawah Nama System)
              </label>
              <input
                type="text"
                required
                value={form.deskripsiAplikasi || ''}
                onChange={(e) => setForm({ ...form, deskripsiAplikasi: e.target.value })}
                placeholder="Contoh: Sistem Informasi Manajemen Jemaat & Pelayanan Digital"
                className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-slate-100 font-medium focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 shadow-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-800 dark:text-slate-300 mb-1">
                Nama Majelis Jemaat GKE
              </label>
              <input
                type="text"
                required
                value={form.namaJemaat || ''}
                onChange={(e) => setForm({ ...form, namaJemaat: e.target.value })}
                className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-slate-100 font-bold focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 shadow-xs"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-800 dark:text-slate-300 mb-1">
                Resort GKE (Wilayah)
              </label>
              <input
                type="text"
                required
                value={form.resortGke || ''}
                onChange={(e) => setForm({ ...form, resortGke: e.target.value })}
                className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 shadow-xs"
              />
            </div>
          </div>

          {/* Logo Upload Section */}
          <div className="bg-slate-100/80 dark:bg-slate-950/60 p-4 rounded-xl border border-slate-200 dark:border-slate-800/80 space-y-3">
            <div className="flex items-center justify-between">
              <label className="block font-bold text-slate-800 dark:text-slate-200">
                Logo Sistem &amp; Kop Surat Resmi (Ganti Logo Aplikasi)
              </label>
              <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                Tersimpan Permanen
              </span>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-700 overflow-hidden flex items-center justify-center p-1 shadow-md flex-shrink-0">
                {form.logoUrl ? (
                  <img
                    src={form.logoUrl}
                    alt="Logo Preview"
                    className="w-full h-full object-cover rounded-xl"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <Church className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
                )}
              </div>

              <div className="flex-1 space-y-2 text-center sm:text-left">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <label className="cursor-pointer inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition text-xs shadow-md">
                    <Image className="w-4 h-4" />
                    <span>Unggah Gambar Logo Baru</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const compressed = await compressImageFile(file, 400, 400, 0.85);
                          if (compressed) {
                            handleFieldChange('logoUrl', compressed);
                          }
                        }
                      }}
                      className="hidden"
                    />
                  </label>

                  {form.logoUrl ? (
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, logoUrl: '' })}
                      className="px-3 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-rose-500/20 text-slate-700 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-300 font-semibold transition text-xs border border-slate-300 dark:border-slate-700"
                    >
                      Hapus Logo (Gunakan Ikon Church)
                    </button>
                  ) : null}
                </div>
                <input
                  type="text"
                  value={form.logoUrl || ''}
                  onChange={(e) => setForm({ ...form, logoUrl: e.target.value })}
                  placeholder="Atau tempel URL gambar logo di sini (https://...)"
                  className="w-full p-2 rounded-lg bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-800 dark:text-slate-300 font-mono text-[11px] focus:outline-none focus:border-indigo-500 shadow-xs"
                />
                <p className="text-[10px] text-slate-600 dark:text-slate-400">
                  Logo yang Anda unggah akan diterapkan di seluruh sistem (Header, Sidebar, Kop Surat &amp; Laporan Cetak) dan tidak akan tereset otomatis.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block font-semibold text-slate-800 dark:text-slate-300 mb-1">No. Telepon / Fax</label>
              <input
                type="text"
                value={form.telepon || ''}
                onChange={(e) => setForm({ ...form, telepon: e.target.value })}
                className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 shadow-xs"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-800 dark:text-slate-300 mb-1">Email Resmi</label>
              <input
                type="email"
                value={form.email || ''}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 shadow-xs"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-800 dark:text-slate-300 mb-1">Website</label>
              <input
                type="text"
                value={form.website || ''}
                onChange={(e) => setForm({ ...form, website: e.target.value })}
                className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 shadow-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-800 dark:text-slate-300 mb-1">Alamat Lengkap Gereja</label>
              <input
                type="text"
                required
                value={form.alamatGereja || ''}
                onChange={(e) => setForm({ ...form, alamatGereja: e.target.value })}
                className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 shadow-xs"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-800 dark:text-slate-300 mb-1">
                Tempat / Kota Diterbitkan Surat &amp; Laporan
              </label>
              <input
                type="text"
                required
                value={form.tempatDiterbitkan || ''}
                onChange={(e) => setForm({ ...form, tempatDiterbitkan: e.target.value })}
                placeholder="Contoh: Palangka Raya"
                className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-slate-100 font-bold focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 shadow-xs"
              />
              <p className="text-[10px] text-slate-600 dark:text-slate-400 mt-1">
                Akan tercetak sebelum tanggal pada bagian tanda tangan laporan resmi (misal: "Palangka Raya, 29 Juli 2026").
              </p>
            </div>
          </div>
        </div>

        {/* Kop Surat Configuration */}
        <div className="bg-slate-50 dark:bg-slate-900/80 rounded-2xl p-6 border border-slate-200 dark:border-slate-800/80 shadow-md backdrop-blur-md space-y-4 text-xs">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                Pengaturan Teks Baris Header Kop Surat Resmi
              </h3>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                Atur 5 baris header kop surat sesuai dengan format resmi Majelis Jemaat GKE
              </p>
            </div>
            <span className="text-[10px] font-bold bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 px-2.5 py-1 rounded-lg border border-indigo-500/20">
              5 Baris Header Resmi
            </span>
          </div>

          {/* Baris Header 1 */}
          <div className="bg-slate-100/80 dark:bg-slate-950/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800/80 space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="font-bold text-slate-800 dark:text-slate-200">
                1. Baris Header 1 (Tercetak Underline / Garis Bawah)
              </label>
              <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold">Tercetak Underline</span>
            </div>
            <input
              type="text"
              required
              value={form.headerKopLine1 || ''}
              onChange={(e) => setForm({ ...form, headerKopLine1: e.target.value })}
              placeholder="Contoh: GEREJA KALIMANTAN EVANGELIS (GKE)"
              className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-slate-100 font-bold focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 shadow-xs"
            />
            <p className="text-[10px] text-slate-600 dark:text-slate-400">
              Nama Organisasi Induk / Sinode Gereja. Pada cetakan kop surat akan otomatis bergaris bawah.
            </p>
          </div>

          {/* Baris Header Baru di Bawah Header 1 (Ukuran -2 dari Header 1) */}
          <div className="bg-slate-100/80 dark:bg-slate-950/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800/80 space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="font-bold text-slate-800 dark:text-slate-200">
                1b. BARIS HEADER BARU (Di Bawah Header 1)
              </label>
              <span className="text-[10px] text-cyan-700 dark:text-cyan-400 font-semibold">Ukuran Font -2 dari Header 1</span>
            </div>
            <input
              type="text"
              value={form.headerKopLine1b ?? ''}
              onChange={(e) => setForm({ ...form, headerKopLine1b: e.target.value })}
              placeholder="Contoh: (Anggota Persekutuan Gereja-Gereja di Indonesia / PGI)"
              className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-slate-100 font-semibold focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 shadow-xs"
            />
            <p className="text-[10px] text-slate-600 dark:text-slate-400">
              Teks header tambahan tepat di bawah Baris Header 1 dengan ukuran font 2 lebih kecil dari Header 1.
            </p>
          </div>

          {/* Baris Header 2 */}
          <div className="bg-slate-100/80 dark:bg-slate-950/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800/80 space-y-1.5">
            <label className="block font-bold text-slate-800 dark:text-slate-200">
              2. BARIS HEADER 2 (Nama Majelis Jemaat / Lokasi)
            </label>
            <input
              type="text"
              required
              value={form.headerKopLine2 || ''}
              onChange={(e) => setForm({ ...form, headerKopLine2: e.target.value })}
              placeholder="Contoh: MAJELIS JEMAAT GKE EFATA PALANGKA RAYA"
              className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-slate-100 font-bold focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 shadow-xs"
            />
            <p className="text-[10px] text-slate-600 dark:text-slate-400">
              Nama Majelis Jemaat GKE setempat yang menerbitkan dokumen/laporan resmi.
            </p>
          </div>

          {/* Baris Header 3 (Badan Hukum - 2 Baris) */}
          <div className="bg-slate-100/80 dark:bg-slate-950/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800/80 space-y-2">
            <div className="flex justify-between items-center">
              <label className="block font-bold text-slate-800 dark:text-slate-200">
                3. BARIS HEADER 3 (Badan Hukum - Terdiri dari 2 Baris)
              </label>
              <span className="text-[10px] text-red-600 dark:text-red-400 font-semibold bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20">
                Tercetak Warna Merah
              </span>
            </div>

            <div className="space-y-2 pl-2 border-l-2 border-indigo-500/40">
              <div>
                <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                  • Baris 3a (Badan Hukum Line 1):
                </span>
                <input
                  type="text"
                  value={form.headerKopLine3a || ''}
                  onChange={(e) => setForm({ ...form, headerKopLine3a: e.target.value })}
                  placeholder="Contoh: Badan Hukum: Keputusan Menteri Agama RI No. 33 Tahun 1970 Tanggal 27 Mei 1970"
                  className="w-full p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-slate-100 font-medium focus:outline-none focus:border-indigo-500 shadow-xs"
                />
              </div>

              <div>
                <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                  • Baris 3b (Badan Hukum Line 2):
                </span>
                <input
                  type="text"
                  value={form.headerKopLine3b || ''}
                  onChange={(e) => setForm({ ...form, headerKopLine3b: e.target.value })}
                  placeholder="Contoh: SK Dirjen Bimas Kristen Depag RI No. 129 Tahun 1989 Tanggal 18 Juli 1989"
                  className="w-full p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-slate-100 font-medium focus:outline-none focus:border-indigo-500 shadow-xs"
                />
              </div>
            </div>
            <p className="text-[10px] text-slate-600 dark:text-slate-400">
              Meletakkan Keterangan Badan Hukum resmi yang terbagi dalam 2 baris terpisah dengan cetakan warna merah.
            </p>
          </div>

          {/* Baris Header 4 */}
          <div className="bg-slate-100/80 dark:bg-slate-950/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800/80 space-y-1.5">
            <label className="block font-bold text-slate-800 dark:text-slate-200">
              4. BARIS HEADER 4 (Digunakan untuk Majelis Resort)
            </label>
            <input
              type="text"
              value={form.headerKopLine4 || ''}
              onChange={(e) => setForm({ ...form, headerKopLine4: e.target.value })}
              placeholder="Contoh: MAJELIS RESORT GKE PALANGKA RAYA HULU"
              className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-slate-100 font-bold focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 shadow-xs"
            />
            <p className="text-[10px] text-slate-600 dark:text-slate-400">
              Identitas Majelis Resort tempat jemaat berkoordinasi dan bernaung.
            </p>
          </div>

          {/* Baris Header 5 */}
          <div className="bg-slate-100/80 dark:bg-slate-950/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800/80 space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="block font-bold text-slate-800 dark:text-slate-200">
                5. BARIS HEADER 5 (Digunakan untuk Alamat dan Nomor Telp / Kontak)
              </label>
              <span className="text-[10px] text-red-600 dark:text-red-400 font-semibold bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20">
                Tercetak Warna Merah
              </span>
            </div>
            <input
              type="text"
              value={form.headerKopLine5 || ''}
              onChange={(e) => setForm({ ...form, headerKopLine5: e.target.value })}
              placeholder="Contoh: Jl. Imam Bonjol No. 12, Palangka Raya 73111 | Telp: (0536) 3221840 | Email: info@gke-efata.org"
              className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-slate-100 font-medium focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 shadow-xs"
            />
            <p className="text-[10px] text-slate-600 dark:text-slate-400">
              Catatan alamat lengkap, nomor telepon, serta kontak email/website resmi dengan cetakan warna merah.
            </p>
          </div>

          {/* Live Preview Box */}
          <div className="pt-2">
            <div className="flex items-center justify-between mb-2">
              <label className="block font-bold text-slate-900 dark:text-slate-200 text-xs">
                🔍 Live Preview Tampilan Kop Surat Resmi:
              </label>
              <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                Format Warna &amp; Tata Letak Resmi Cetak Dokumen
              </span>
            </div>
            <div
              data-kop-surat="true"
              className="bg-white p-4 sm:p-6 rounded-2xl border-2 border-slate-300 shadow-md kop-surat-preview kop-surat-container print-paper-view overflow-x-auto"
              style={{ backgroundColor: '#ffffff', color: '#0f172a' }}
            >
              <KopSurat previewSettings={form} />
            </div>
          </div>
        </div>

        {/* Default Official Signatories with Automatic MPH & Kategorial Sync */}
        <div className="bg-slate-50 dark:bg-slate-900/80 rounded-2xl p-6 border border-slate-200 dark:border-slate-800/80 shadow-md backdrop-blur-md space-y-5 text-xs">
          {/* Sync Master Control Banner */}
          <div className="bg-gradient-to-r from-indigo-50 via-slate-100 to-blue-50 dark:from-indigo-950/60 dark:via-slate-900 dark:to-blue-950/60 p-4 rounded-xl border border-indigo-200 dark:border-indigo-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-sm">
                  Sinkronisasi Pejabat Penandatangan Laporan &amp; Kop Surat Resmi
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-500/30">
                  Otomatis MPH
                </span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                Data 17 nama pejabat penandatangan laporan (Ketua Majelis, Bendahara, Sekretaris, BPP, MP, Panitia Pembangunan, Seksi SPPer, SPB, SPPR/P, dan SPA Sekolah Minggu) terhubung langsung dengan modul Kepengurusan MPH &amp; Kategorial.
              </p>
            </div>

            <button
              type="button"
              disabled={isSyncingOfficials}
              onClick={handleSyncOfficialsNow}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-extrabold text-xs shadow-md shadow-indigo-600/30 border border-indigo-400/40 transition-all flex items-center gap-2 cursor-pointer active:scale-95 shrink-0 disabled:opacity-60"
            >
              {isSyncingOfficials ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Menyinkronkan...</span>
                </>
              ) : (
                <>
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Sinkronkan 17 Pejabat Sekarang</span>
                </>
              )}
            </button>
          </div>

          {/* Sync Success Feedback Notice */}
          {syncNotice && (
            <div className="bg-emerald-50 dark:bg-emerald-500/20 border border-emerald-300 dark:border-emerald-500/40 text-emerald-800 dark:text-emerald-300 p-3.5 rounded-xl flex items-center gap-2.5 animate-fade-in text-xs font-semibold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>{syncNotice}</span>
            </div>
          )}

          {/* 1. KEPENGURUSAN MPH MAJELIS JEMAAT GKE */}
          <div className="space-y-3">
            <h4 className="font-bold text-indigo-700 dark:text-indigo-300 text-xs flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
              <Church className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>1. Pejabat Majelis Pekerja Harian (MPH) Jemaat GKE</span>
            </h4>

            {/* Ketua Majelis Jemaat GKE */}
            <div className="bg-slate-100/80 dark:bg-slate-950/60 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="block font-bold text-slate-800 dark:text-slate-200">
                  Nama Ketua Majelis Jemaat GKE
                </label>
                {detectedOrgOfficials.namaKetuaJemaat?.nama && (
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-500/30 flex items-center gap-1">
                      <Check className="w-2.5 h-2.5" />
                      <span>MPH ({detectedOrgOfficials.namaKetuaJemaat.jabatanAsal}): {detectedOrgOfficials.namaKetuaJemaat.nama}</span>
                    </span>
                    {form.namaKetuaJemaat !== detectedOrgOfficials.namaKetuaJemaat.nama && (
                      <button
                        type="button"
                        onClick={() =>
                          handleApplySingleOfficial('namaKetuaJemaat', detectedOrgOfficials.namaKetuaJemaat?.nama || '')
                        }
                        className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 underline cursor-pointer"
                      >
                        Terapkan
                      </button>
                    )}
                  </div>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input
                  type="text"
                  required
                  value={form.namaKetuaJemaat || ''}
                  onChange={(e) => handleFieldChange('namaKetuaJemaat', e.target.value)}
                  placeholder="Nama Ketua Majelis Jemaat GKE"
                  className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-slate-100 font-semibold focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 shadow-xs"
                />
                <input
                  type="text"
                  value={form.nipKetuaJemaat || ''}
                  onChange={(e) => handleFieldChange('nipKetuaJemaat', e.target.value)}
                  placeholder="NIP / NIPG Ketua"
                  className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-slate-100 font-mono focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 shadow-xs"
                />
              </div>
            </div>

            {/* Bendahara Jemaat */}
            <div className="bg-slate-100/80 dark:bg-slate-950/60 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="block font-bold text-slate-800 dark:text-slate-200">
                  Nama Bendahara Jemaat
                </label>
                {detectedOrgOfficials.namaBendahara?.nama && (
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-500/30 flex items-center gap-1">
                      <Check className="w-2.5 h-2.5" />
                      <span>MPH ({detectedOrgOfficials.namaBendahara.jabatanAsal}): {detectedOrgOfficials.namaBendahara.nama}</span>
                    </span>
                    {form.namaBendahara !== detectedOrgOfficials.namaBendahara.nama && (
                      <button
                        type="button"
                        onClick={() =>
                          handleApplySingleOfficial('namaBendahara', detectedOrgOfficials.namaBendahara?.nama || '')
                        }
                        className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 underline cursor-pointer"
                      >
                        Terapkan
                      </button>
                    )}
                  </div>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input
                  type="text"
                  required
                  value={form.namaBendahara || ''}
                  onChange={(e) => handleFieldChange('namaBendahara', e.target.value)}
                  placeholder="Nama Bendahara Jemaat"
                  className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-slate-100 font-semibold focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 shadow-xs"
                />
                <input
                  type="text"
                  value={form.nipBendahara || ''}
                  onChange={(e) => handleFieldChange('nipBendahara', e.target.value)}
                  placeholder="NIP / NIPG Bendahara"
                  className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-slate-100 font-mono focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 shadow-xs"
                />
              </div>
            </div>

            {/* Sekretaris Majelis */}
            <div className="bg-slate-100/80 dark:bg-slate-950/60 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="block font-bold text-slate-800 dark:text-slate-200">
                  Nama Sekretaris Majelis
                </label>
                {detectedOrgOfficials.namaSekretaris?.nama && (
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-500/30 flex items-center gap-1">
                      <Check className="w-2.5 h-2.5" />
                      <span>MPH ({detectedOrgOfficials.namaSekretaris.jabatanAsal}): {detectedOrgOfficials.namaSekretaris.nama}</span>
                    </span>
                    {form.namaSekretaris !== detectedOrgOfficials.namaSekretaris.nama && (
                      <button
                        type="button"
                        onClick={() =>
                          handleApplySingleOfficial('namaSekretaris', detectedOrgOfficials.namaSekretaris?.nama || '')
                        }
                        className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 underline cursor-pointer"
                      >
                        Terapkan
                      </button>
                    )}
                  </div>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input
                  type="text"
                  required
                  value={form.namaSekretaris || ''}
                  onChange={(e) => handleFieldChange('namaSekretaris', e.target.value)}
                  placeholder="Nama Sekretaris Majelis"
                  className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-slate-100 font-semibold focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 shadow-xs"
                />
                <input
                  type="text"
                  value={form.nipSekretaris || ''}
                  onChange={(e) => handleFieldChange('nipSekretaris', e.target.value)}
                  placeholder="NIP / NIPG Sekretaris"
                  className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-slate-100 font-mono focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 shadow-xs"
                />
              </div>
            </div>

            {/* Periode Pelayanan MPH / Majelis Jemaat */}
            <div className="bg-slate-100/80 dark:bg-slate-950/60 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
              <label className="block font-bold text-slate-800 dark:text-slate-200">
                Periode Pelayanan / Masa Bakti MPH Jemaat (Untuk Laporan Cetak)
              </label>
              <input
                type="text"
                value={form.periodePelayananMPH || ''}
                onChange={(e) => handleFieldChange('periodePelayananMPH', e.target.value)}
                placeholder="Contoh: 2024 - 2029 atau Periode Pelayanan 2024 - 2029"
                className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-slate-100 font-semibold focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 shadow-xs"
              />
              <p className="text-[10px] text-slate-600 dark:text-slate-400">
                Periode pelayanan ini akan otomatis dijadikan acuan teks periode pada kop/subtitle laporan cetak struktur MPH &amp; SK.
              </p>
            </div>
          </div>
        </div>

        {/* Section Penandatanganan Laporan Khusus BPP dan MP */}
        <div className="bg-slate-50 dark:bg-slate-900/80 rounded-2xl p-6 border border-slate-200 dark:border-slate-800/80 shadow-md backdrop-blur-md space-y-5 text-xs">
          <div className="border-b border-slate-200 dark:border-slate-800 pb-3 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm flex items-center gap-2">
                <FileCheck2 className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                <span>Penandatanganan Laporan Khusus BPP dan MP</span>
              </h3>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                Pengaturan Pejabat Penandatangan Laporan &amp; Kop Surat Resmi untuk Badan Pemeriksa Perbendaharaan (BPP) dan Majelis Pertimbangan (MP) yang diselaraskan langsung dari kepengurusan MPH Jemaat.
              </p>
            </div>
            {(detectedOrgOfficials.namaKetuaBpp?.nama || detectedOrgOfficials.namaKetuaMp?.nama) && (
              <span className="text-[10px] text-teal-700 dark:text-teal-300 bg-teal-100 dark:bg-teal-500/10 px-2.5 py-1 rounded-full border border-teal-300 dark:border-teal-500/30 flex items-center gap-1 font-semibold">
                <Check className="w-3 h-3 text-teal-600 dark:text-teal-400" />
                <span>Terhubung MPH</span>
              </span>
            )}
          </div>

          {/* 1. Badan Pemeriksa Perbendaharaan (BPP) */}
          <div className="bg-slate-100/80 dark:bg-slate-950/60 p-4 rounded-xl border border-teal-200 dark:border-teal-500/20 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800/60 pb-2">
              <h4 className="font-bold text-teal-700 dark:text-teal-400 flex items-center gap-2 text-xs">
                <Scale className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                <span>1. Badan Pemeriksa Perbendaharaan (BPP) Jemaat GKE</span>
              </h4>
              {detectedOrgOfficials.namaKetuaBpp?.nama && (
                <span className="text-[10px] text-teal-700 dark:text-teal-300 bg-teal-100 dark:bg-teal-500/10 px-2 py-0.5 rounded-full border border-teal-300 dark:border-teal-500/30 font-medium">
                  ⚡ Terdeteksi dari: {detectedOrgOfficials.namaKetuaBpp.source} ({detectedOrgOfficials.namaKetuaBpp.jabatanAsal})
                </span>
              )}
            </div>

            {/* Ketua BPP */}
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="font-semibold text-slate-800 dark:text-slate-200">
                  Nama Ketua Badan Pemeriksa Perbendaharaan (BPP)
                </label>
                {detectedOrgOfficials.namaKetuaBpp?.nama && form.namaKetuaBpp !== detectedOrgOfficials.namaKetuaBpp.nama && (
                  <button
                    type="button"
                    onClick={() => handleApplySingleOfficial('namaKetuaBpp', detectedOrgOfficials.namaKetuaBpp?.nama || '')}
                    className="text-[10px] font-bold text-teal-600 dark:text-teal-400 hover:text-teal-800 dark:hover:text-teal-300 underline cursor-pointer"
                  >
                    Terapkan: {detectedOrgOfficials.namaKetuaBpp.nama}
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input
                  type="text"
                  value={form.namaKetuaBpp || ''}
                  onChange={(e) => handleFieldChange('namaKetuaBpp', e.target.value)}
                  placeholder="Nama Ketua BPP Jemaat (beserta gelar)"
                  className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-slate-100 font-semibold focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 shadow-xs"
                />
                <input
                  type="text"
                  value={form.nipKetuaBpp || ''}
                  onChange={(e) => handleFieldChange('nipKetuaBpp', e.target.value)}
                  placeholder="NIP / NIPG / No. HP Ketua BPP"
                  className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-slate-100 font-mono focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 shadow-xs"
                />
              </div>
              <p className="text-[10px] text-slate-600 dark:text-slate-400">
                Pejabat ini otomatis dicantumkan pada bagian bawah tengah tanda tangan laporan keuangan kas perbendaharaan sebagai pemeriksa/verifikator resmi.
              </p>
            </div>

            {/* Sekretaris / Anggota BPP */}
            <div className="space-y-1.5 pt-2 border-t border-slate-200 dark:border-slate-800/60">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="font-semibold text-slate-800 dark:text-slate-200">
                  Nama Sekretaris / Anggota Badan Pemeriksa Perbendaharaan (BPP)
                </label>
                {detectedOrgOfficials.namaSekretarisBpp?.nama && form.namaSekretarisBpp !== detectedOrgOfficials.namaSekretarisBpp.nama && (
                  <button
                    type="button"
                    onClick={() => handleApplySingleOfficial('namaSekretarisBpp', detectedOrgOfficials.namaSekretarisBpp?.nama || '')}
                    className="text-[10px] font-bold text-teal-600 dark:text-teal-400 hover:text-teal-800 dark:hover:text-teal-300 underline cursor-pointer"
                  >
                    Terapkan: {detectedOrgOfficials.namaSekretarisBpp.nama}
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input
                  type="text"
                  value={form.namaSekretarisBpp || ''}
                  onChange={(e) => handleFieldChange('namaSekretarisBpp', e.target.value)}
                  placeholder="Nama Sekretaris / Anggota BPP (opsional)"
                  className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 shadow-xs"
                />
                <input
                  type="text"
                  value={form.nipSekretarisBpp || ''}
                  onChange={(e) => handleFieldChange('nipSekretarisBpp', e.target.value)}
                  placeholder="NIP / NIPG / No. HP Sekretaris BPP"
                  className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-slate-100 font-mono focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 shadow-xs"
                />
              </div>
            </div>
          </div>

          {/* 2. Majelis Pertimbangan (MP) */}
          <div className="bg-slate-100/80 dark:bg-slate-950/60 p-4 rounded-xl border border-indigo-200 dark:border-indigo-500/20 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800/60 pb-2">
              <h4 className="font-bold text-indigo-700 dark:text-indigo-400 flex items-center gap-2 text-xs">
                <Award className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>2. Majelis Pertimbangan (MP) Jemaat GKE</span>
              </h4>
              {detectedOrgOfficials.namaKetuaMp?.nama && (
                <span className="text-[10px] text-indigo-700 dark:text-indigo-300 bg-indigo-100 dark:bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-300 dark:border-indigo-500/30 font-medium">
                  ⚡ Terdeteksi dari: {detectedOrgOfficials.namaKetuaMp.source} ({detectedOrgOfficials.namaKetuaMp.jabatanAsal})
                </span>
              )}
            </div>

            {/* Ketua MP */}
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="font-semibold text-slate-800 dark:text-slate-200">
                  Nama Ketua Majelis Pertimbangan (MP)
                </label>
                {detectedOrgOfficials.namaKetuaMp?.nama && form.namaKetuaMp !== detectedOrgOfficials.namaKetuaMp.nama && (
                  <button
                    type="button"
                    onClick={() => handleApplySingleOfficial('namaKetuaMp', detectedOrgOfficials.namaKetuaMp?.nama || '')}
                    className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 underline cursor-pointer"
                  >
                    Terapkan: {detectedOrgOfficials.namaKetuaMp.nama}
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input
                  type="text"
                  value={form.namaKetuaMp || ''}
                  onChange={(e) => handleFieldChange('namaKetuaMp', e.target.value)}
                  placeholder="Nama Ketua Majelis Pertimbangan (beserta gelar)"
                  className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-slate-100 font-semibold focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 shadow-xs"
                />
                <input
                  type="text"
                  value={form.nipKetuaMp || ''}
                  onChange={(e) => handleFieldChange('nipKetuaMp', e.target.value)}
                  placeholder="NIP / NIPG / No. HP Ketua MP"
                  className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-slate-100 font-mono focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 shadow-xs"
                />
              </div>
            </div>

            {/* Sekretaris / Anggota MP */}
            <div className="space-y-1.5 pt-2 border-t border-slate-200 dark:border-slate-800/60">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="font-semibold text-slate-800 dark:text-slate-200">
                  Nama Sekretaris / Anggota Majelis Pertimbangan (MP)
                </label>
                {detectedOrgOfficials.namaSekretarisMp?.nama && form.namaSekretarisMp !== detectedOrgOfficials.namaSekretarisMp.nama && (
                  <button
                    type="button"
                    onClick={() => handleApplySingleOfficial('namaSekretarisMp', detectedOrgOfficials.namaSekretarisMp?.nama || '')}
                    className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 underline cursor-pointer"
                  >
                    Terapkan: {detectedOrgOfficials.namaSekretarisMp.nama}
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input
                  type="text"
                  value={form.namaSekretarisMp || ''}
                  onChange={(e) => handleFieldChange('namaSekretarisMp', e.target.value)}
                  placeholder="Nama Sekretaris / Anggota MP (opsional)"
                  className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 shadow-xs"
                />
                <input
                  type="text"
                  value={form.nipSekretarisMp || ''}
                  onChange={(e) => handleFieldChange('nipSekretarisMp', e.target.value)}
                  placeholder="NIP / NIPG / No. HP Sekretaris MP"
                  className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-slate-100 font-mono focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 shadow-xs"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section Penandatangan Pos Kas & Seksi Kategori */}
        <div className="bg-slate-50 dark:bg-slate-900/80 rounded-2xl p-6 border border-slate-200 dark:border-slate-800/80 shadow-md backdrop-blur-md space-y-5 text-xs">
          <div className="border-b border-slate-200 dark:border-slate-800 pb-3 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm flex items-center gap-2">
                <Users className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                <span>Penandatangan Laporan Khusus Pos Kas, Seksi Kategorial &amp; Panitia Jemaat</span>
              </h3>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                Nama Ketua &amp; Bendahara Panitia Pembangunan, SPPer, SPB, SPPR/P, dan Sekolah Minggu (SPA) otomatis diselaraskan dengan struktur kepengurusan.
              </p>
            </div>
          </div>

          {/* 1. Kas Pembangunan */}
          <div className="bg-slate-100/80 dark:bg-slate-950/60 p-4 rounded-xl border border-amber-200 dark:border-amber-500/20 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-amber-700 dark:text-amber-400 flex items-center gap-2 text-xs">
                <span>🏗️ 1. Penandatangan Laporan Kas Panitia Pembangunan</span>
              </h4>
              {(detectedOrgOfficials.namaKetuaPembangunan?.nama || detectedOrgOfficials.namaBendaharaPembangunan?.nama) && (
                <span className="text-[10px] text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-300 dark:border-amber-500/30 font-medium">
                  ⚡ Terdeteksi dari: {detectedOrgOfficials.namaKetuaPembangunan?.source || detectedOrgOfficials.namaBendaharaPembangunan?.source || 'Panitia Pembangunan'}
                </span>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-slate-800 dark:text-slate-300">Bendahara Panitia Pembangunan</label>
                  {detectedOrgOfficials.namaBendaharaPembangunan?.nama && form.namaBendaharaPembangunan !== detectedOrgOfficials.namaBendaharaPembangunan.nama && (
                    <button
                      type="button"
                      onClick={() => handleApplySingleOfficial('namaBendaharaPembangunan', detectedOrgOfficials.namaBendaharaPembangunan?.nama || '')}
                      className="text-[10px] font-bold text-amber-600 dark:text-indigo-400 hover:text-amber-800 dark:hover:text-indigo-300 underline cursor-pointer"
                    >
                      Terapkan: {detectedOrgOfficials.namaBendaharaPembangunan.nama}
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  value={form.namaBendaharaPembangunan || ''}
                  onChange={(e) => handleFieldChange('namaBendaharaPembangunan', e.target.value)}
                  placeholder="Nama Bendahara Panitia Pembangunan"
                  className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500 shadow-xs"
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-slate-800 dark:text-slate-300">Ketua Panitia Pembangunan</label>
                  {detectedOrgOfficials.namaKetuaPembangunan?.nama && form.namaKetuaPembangunan !== detectedOrgOfficials.namaKetuaPembangunan.nama && (
                    <button
                      type="button"
                      onClick={() => handleApplySingleOfficial('namaKetuaPembangunan', detectedOrgOfficials.namaKetuaPembangunan?.nama || '')}
                      className="text-[10px] font-bold text-amber-600 dark:text-indigo-400 hover:text-amber-800 dark:hover:text-indigo-300 underline cursor-pointer"
                    >
                      Terapkan: {detectedOrgOfficials.namaKetuaPembangunan.nama}
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  value={form.namaKetuaPembangunan || ''}
                  onChange={(e) => handleFieldChange('namaKetuaPembangunan', e.target.value)}
                  placeholder="Nama Ketua Panitia Pembangunan"
                  className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500 shadow-xs"
                />
              </div>
            </div>
          </div>

          {/* 2. Kas SPPer */}
          <div className="bg-slate-100/80 dark:bg-slate-950/60 p-4 rounded-xl border border-pink-200 dark:border-pink-500/20 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-pink-700 dark:text-pink-400 flex items-center gap-2 text-xs">
                <span>👩 2. Penandatangan Laporan Kas SPPer (Pelayanan Perempuan)</span>
              </h4>
              {(detectedOrgOfficials.namaKetuaSpper?.nama || detectedOrgOfficials.namaBendaharaSpper?.nama) && (
                <span className="text-[10px] text-pink-700 dark:text-pink-300 bg-pink-100 dark:bg-pink-500/10 px-2 py-0.5 rounded-full border border-pink-300 dark:border-pink-500/30 font-medium">
                  ⚡ Terdeteksi dari: {detectedOrgOfficials.namaKetuaSpper?.source || detectedOrgOfficials.namaBendaharaSpper?.source || 'Seksi SPPer'}
                </span>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-slate-800 dark:text-slate-300">Bendahara SPPer</label>
                  {detectedOrgOfficials.namaBendaharaSpper?.nama && form.namaBendaharaSpper !== detectedOrgOfficials.namaBendaharaSpper.nama && (
                    <button
                      type="button"
                      onClick={() => handleApplySingleOfficial('namaBendaharaSpper', detectedOrgOfficials.namaBendaharaSpper?.nama || '')}
                      className="text-[10px] font-bold text-pink-600 dark:text-pink-400 hover:text-pink-800 dark:hover:text-pink-300 underline cursor-pointer"
                    >
                      Terapkan: {detectedOrgOfficials.namaBendaharaSpper.nama}
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  value={form.namaBendaharaSpper || ''}
                  onChange={(e) => handleFieldChange('namaBendaharaSpper', e.target.value)}
                  placeholder="Nama Bendahara Seksi SPPer"
                  className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-pink-500 shadow-xs"
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-slate-800 dark:text-slate-300">Ketua Seksi SPPer</label>
                  {detectedOrgOfficials.namaKetuaSpper?.nama && form.namaKetuaSpper !== detectedOrgOfficials.namaKetuaSpper.nama && (
                    <button
                      type="button"
                      onClick={() => handleApplySingleOfficial('namaKetuaSpper', detectedOrgOfficials.namaKetuaSpper?.nama || '')}
                      className="text-[10px] font-bold text-pink-600 dark:text-pink-400 hover:text-pink-800 dark:hover:text-pink-300 underline cursor-pointer"
                    >
                      Terapkan: {detectedOrgOfficials.namaKetuaSpper.nama}
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  value={form.namaKetuaSpper || ''}
                  onChange={(e) => handleFieldChange('namaKetuaSpper', e.target.value)}
                  placeholder="Nama Ketua Seksi SPPer"
                  className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-pink-500 shadow-xs"
                />
              </div>
            </div>
          </div>

          {/* 3. Kas SPB */}
          <div className="bg-slate-100/80 dark:bg-slate-950/60 p-4 rounded-xl border border-blue-200 dark:border-blue-500/20 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-blue-700 dark:text-blue-400 flex items-center gap-2 text-xs">
                <span>👨 3. Penandatangan Laporan Kas Seksi Pelayanan Bapak (SPB)</span>
              </h4>
              {(detectedOrgOfficials.namaKetuaSpb?.nama || detectedOrgOfficials.namaBendaharaSpb?.nama) && (
                <span className="text-[10px] text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-300 dark:border-blue-500/30 font-medium">
                  ⚡ Terdeteksi dari: {detectedOrgOfficials.namaKetuaSpb?.source || detectedOrgOfficials.namaBendaharaSpb?.source || 'Seksi SPB'}
                </span>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-slate-800 dark:text-slate-300">Bendahara Seksi SPB</label>
                  {detectedOrgOfficials.namaBendaharaSpb?.nama && form.namaBendaharaSpb !== detectedOrgOfficials.namaBendaharaSpb.nama && (
                    <button
                      type="button"
                      onClick={() => handleApplySingleOfficial('namaBendaharaSpb', detectedOrgOfficials.namaBendaharaSpb?.nama || '')}
                      className="text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline cursor-pointer"
                    >
                      Terapkan: {detectedOrgOfficials.namaBendaharaSpb.nama}
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  value={form.namaBendaharaSpb || ''}
                  onChange={(e) => handleFieldChange('namaBendaharaSpb', e.target.value)}
                  placeholder="Nama Bendahara Seksi SPB"
                  className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500 shadow-xs"
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-slate-800 dark:text-slate-300">Ketua Seksi SPB</label>
                  {detectedOrgOfficials.namaKetuaSpb?.nama && form.namaKetuaSpb !== detectedOrgOfficials.namaKetuaSpb.nama && (
                    <button
                      type="button"
                      onClick={() => handleApplySingleOfficial('namaKetuaSpb', detectedOrgOfficials.namaKetuaSpb?.nama || '')}
                      className="text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline cursor-pointer"
                    >
                      Terapkan: {detectedOrgOfficials.namaKetuaSpb.nama}
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  value={form.namaKetuaSpb || ''}
                  onChange={(e) => handleFieldChange('namaKetuaSpb', e.target.value)}
                  placeholder="Nama Ketua Seksi SPB"
                  className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500 shadow-xs"
                />
              </div>
            </div>
          </div>

          {/* 4. Kas SPPR/P */}
          <div className="bg-slate-100/80 dark:bg-slate-950/60 p-4 rounded-xl border border-violet-200 dark:border-violet-500/20 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-violet-700 dark:text-violet-400 flex items-center gap-2 text-xs">
                <span>🎸 4. Penandatangan Laporan Kas SPPR/P (Pemuda &amp; Remaja)</span>
              </h4>
              {(detectedOrgOfficials.namaKetuaSpprp?.nama || detectedOrgOfficials.namaBendaharaSpprp?.nama) && (
                <span className="text-[10px] text-violet-700 dark:text-violet-300 bg-violet-100 dark:bg-violet-500/10 px-2 py-0.5 rounded-full border border-violet-300 dark:border-violet-500/30 font-medium">
                  ⚡ Terdeteksi dari: {detectedOrgOfficials.namaKetuaSpprp?.source || detectedOrgOfficials.namaBendaharaSpprp?.source || 'Seksi SPPR/P'}
                </span>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-slate-800 dark:text-slate-300">Bendahara SPPR/P</label>
                  {detectedOrgOfficials.namaBendaharaSpprp?.nama && form.namaBendaharaSpprp !== detectedOrgOfficials.namaBendaharaSpprp.nama && (
                    <button
                      type="button"
                      onClick={() => handleApplySingleOfficial('namaBendaharaSpprp', detectedOrgOfficials.namaBendaharaSpprp?.nama || '')}
                      className="text-[10px] font-bold text-violet-600 dark:text-violet-400 hover:text-violet-800 dark:hover:text-violet-300 underline cursor-pointer"
                    >
                      Terapkan: {detectedOrgOfficials.namaBendaharaSpprp.nama}
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  value={form.namaBendaharaSpprp || ''}
                  onChange={(e) => handleFieldChange('namaBendaharaSpprp', e.target.value)}
                  placeholder="Nama Bendahara Seksi SPPR/P"
                  className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-violet-500 shadow-xs"
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-slate-800 dark:text-slate-300">Ketua Seksi SPPR/P</label>
                  {detectedOrgOfficials.namaKetuaSpprp?.nama && form.namaKetuaSpprp !== detectedOrgOfficials.namaKetuaSpprp.nama && (
                    <button
                      type="button"
                      onClick={() => handleApplySingleOfficial('namaKetuaSpprp', detectedOrgOfficials.namaKetuaSpprp?.nama || '')}
                      className="text-[10px] font-bold text-violet-600 dark:text-violet-400 hover:text-violet-800 dark:hover:text-violet-300 underline cursor-pointer"
                    >
                      Terapkan: {detectedOrgOfficials.namaKetuaSpprp.nama}
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  value={form.namaKetuaSpprp || ''}
                  onChange={(e) => handleFieldChange('namaKetuaSpprp', e.target.value)}
                  placeholder="Nama Ketua Seksi SPPR/P"
                  className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-violet-500 shadow-xs"
                />
              </div>
            </div>
          </div>

          {/* 5. Kas Anak Sekolah Hari Minggu */}
          <div className="bg-slate-100/80 dark:bg-slate-950/60 p-4 rounded-xl border border-emerald-200 dark:border-emerald-500/20 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-2 text-xs">
                <span>🎈 5. Penandatangan Laporan Kas SPA (Anak Sekolah Minggu)</span>
              </h4>
              {(detectedOrgOfficials.namaKetuaSpa?.nama || detectedOrgOfficials.namaBendaharaSpa?.nama) && (
                <span className="text-[10px] text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-500/30 font-medium">
                  ⚡ Terdeteksi dari: {detectedOrgOfficials.namaKetuaSpa?.source || detectedOrgOfficials.namaBendaharaSpa?.source || 'Seksi SPA'}
                </span>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-slate-800 dark:text-slate-300">Bendahara SPA / Sekolah Minggu</label>
                  {detectedOrgOfficials.namaBendaharaSpa?.nama && form.namaBendaharaSpa !== detectedOrgOfficials.namaBendaharaSpa.nama && (
                    <button
                      type="button"
                      onClick={() => handleApplySingleOfficial('namaBendaharaSpa', detectedOrgOfficials.namaBendaharaSpa?.nama || '')}
                      className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 underline cursor-pointer"
                    >
                      Terapkan: {detectedOrgOfficials.namaBendaharaSpa.nama}
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  value={form.namaBendaharaSpa || ''}
                  onChange={(e) => handleFieldChange('namaBendaharaSpa', e.target.value)}
                  placeholder="Nama Bendahara Seksi SPA"
                  className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500 shadow-xs"
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-slate-800 dark:text-slate-300">Ketua SPA / Sekolah Minggu</label>
                  {detectedOrgOfficials.namaKetuaSpa?.nama && form.namaKetuaSpa !== detectedOrgOfficials.namaKetuaSpa.nama && (
                    <button
                      type="button"
                      onClick={() => handleApplySingleOfficial('namaKetuaSpa', detectedOrgOfficials.namaKetuaSpa?.nama || '')}
                      className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 underline cursor-pointer"
                    >
                      Terapkan: {detectedOrgOfficials.namaKetuaSpa.nama}
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  value={form.namaKetuaSpa || ''}
                  onChange={(e) => handleFieldChange('namaKetuaSpa', e.target.value)}
                  placeholder="Nama Ketua Seksi SPA"
                  className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500 shadow-xs"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section Pengesetan Saldo Awal Custom Kas & Pos Kas */}
        <div className="bg-slate-50 dark:bg-slate-900/80 rounded-2xl p-6 border border-slate-200 dark:border-slate-800/80 shadow-md backdrop-blur-md space-y-4 text-xs">
          <div className="border-b border-slate-200 dark:border-slate-800 pb-3 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-amber-700 dark:text-amber-300 text-sm flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                Pengesetan Saldo Awal Custom (Base Opening Balance)
              </h3>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                Tentukan Saldo Awal Pokok (Sisa Kas awal periode sebelum pencatatan transaksi sistem). Saldo awal custom ini akan secara otomatis ditambahkan ke akumulasi kas pada setiap laporan mingguan, bulanan, dan tahunan.
              </p>
            </div>
            <span className="text-[10px] font-bold text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-300 dark:border-amber-500/20">
              Periode Base Awal
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-slate-950/70 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                Saldo Awal Custom - Kas Umum (Rp)
              </label>
              <input
                type="number"
                value={form.saldoAwalCustomKasUmum !== undefined ? form.saldoAwalCustomKasUmum : ''}
                onChange={(e) => setForm({ ...form, saldoAwalCustomKasUmum: parseFloat(e.target.value) || 0 })}
                placeholder="Contoh: 10000000"
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-emerald-600 dark:text-emerald-400 font-bold focus:outline-none focus:border-amber-500 shadow-xs"
              />
              <span className="text-[10px] text-slate-600 dark:text-slate-400 font-medium mt-1 block">
                Formatted: Rp {(form.saldoAwalCustomKasUmum || 0).toLocaleString('id-ID')}
              </span>
            </div>

            <div className="bg-white dark:bg-slate-950/70 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                Saldo Awal Custom - Kas Pembangunan (Rp)
              </label>
              <input
                type="number"
                value={form.saldoAwalCustomKasPembangunan !== undefined ? form.saldoAwalCustomKasPembangunan : ''}
                onChange={(e) => setForm({ ...form, saldoAwalCustomKasPembangunan: parseFloat(e.target.value) || 0 })}
                placeholder="Contoh: 25000000"
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-amber-600 dark:text-amber-400 font-bold focus:outline-none focus:border-amber-500 shadow-xs"
              />
              <span className="text-[10px] text-slate-600 dark:text-slate-400 font-medium mt-1 block">
                Formatted: Rp {(form.saldoAwalCustomKasPembangunan || 0).toLocaleString('id-ID')}
              </span>
            </div>

            <div className="bg-white dark:bg-slate-950/70 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                Saldo Awal Custom - Kas Diakonia (Rp)
              </label>
              <input
                type="number"
                value={form.saldoAwalCustomKasDiakonia !== undefined ? form.saldoAwalCustomKasDiakonia : ''}
                onChange={(e) => setForm({ ...form, saldoAwalCustomKasDiakonia: parseFloat(e.target.value) || 0 })}
                placeholder="Contoh: 5000000"
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-blue-600 dark:text-blue-400 font-bold focus:outline-none focus:border-amber-500 shadow-xs"
              />
              <span className="text-[10px] text-slate-600 dark:text-slate-400 font-medium mt-1 block">
                Formatted: Rp {(form.saldoAwalCustomKasDiakonia || 0).toLocaleString('id-ID')}
              </span>
            </div>

            <div className="bg-white dark:bg-slate-950/70 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                Saldo Awal Custom - SPPer / Perempuan (Rp)
              </label>
              <input
                type="number"
                value={form.saldoAwalCustomKasSpper !== undefined ? form.saldoAwalCustomKasSpper : ''}
                onChange={(e) => setForm({ ...form, saldoAwalCustomKasSpper: parseFloat(e.target.value) || 0 })}
                placeholder="Contoh: 3000000"
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-pink-600 dark:text-pink-400 font-bold focus:outline-none focus:border-amber-500 shadow-xs"
              />
              <span className="text-[10px] text-slate-600 dark:text-slate-400 font-medium mt-1 block">
                Formatted: Rp {(form.saldoAwalCustomKasSpper || 0).toLocaleString('id-ID')}
              </span>
            </div>

            <div className="bg-white dark:bg-slate-950/70 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                Saldo Awal Custom - SPB / Bapak (Rp)
              </label>
              <input
                type="number"
                value={form.saldoAwalCustomKasSpb !== undefined ? form.saldoAwalCustomKasSpb : ''}
                onChange={(e) => setForm({ ...form, saldoAwalCustomKasSpb: parseFloat(e.target.value) || 0 })}
                placeholder="Contoh: 2000000"
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-indigo-600 dark:text-indigo-400 font-bold focus:outline-none focus:border-amber-500 shadow-xs"
              />
              <span className="text-[10px] text-slate-600 dark:text-slate-400 font-medium mt-1 block">
                Formatted: Rp {(form.saldoAwalCustomKasSpb || 0).toLocaleString('id-ID')}
              </span>
            </div>

            <div className="bg-white dark:bg-slate-950/70 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                Saldo Awal Custom - SPPR/P / Pemuda (Rp)
              </label>
              <input
                type="number"
                value={form.saldoAwalCustomKasSpprp !== undefined ? form.saldoAwalCustomKasSpprp : ''}
                onChange={(e) => setForm({ ...form, saldoAwalCustomKasSpprp: parseFloat(e.target.value) || 0 })}
                placeholder="Contoh: 1500000"
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-violet-600 dark:text-violet-400 font-bold focus:outline-none focus:border-amber-500 shadow-xs"
              />
              <span className="text-[10px] text-slate-600 dark:text-slate-400 font-medium mt-1 block">
                Formatted: Rp {(form.saldoAwalCustomKasSpprp || 0).toLocaleString('id-ID')}
              </span>
            </div>
          </div>
        </div>

        {/* Pengaturan Form & Sistem Penomoran Pelaporan Standar Baku GKE */}
        <div className="bg-slate-50 dark:bg-slate-900/80 rounded-2xl p-6 border border-slate-200 dark:border-slate-800/80 shadow-md backdrop-blur-md space-y-5 text-xs">
          <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm flex items-center gap-2">
                <Hash className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                Standar Penomoran Surat & Dokumen Resmi (Baku Petunjuk Teknis GKE)
              </h3>
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-500/30">
                Juknis GKE U.I – U.VII
              </span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
              Konfigurasi penomoran persuratan resmi mengikuti <strong>Petunjuk Teknis Surat-Menyurat GKE</strong> (<span className="font-mono font-semibold text-cyan-700 dark:text-cyan-300">[No]/[Instansi]/[Kode Tujuan]/[Bulan]/[Tahun]</span>), serta nomor piagam sakramen Baptis, SIDI, Nikah, KJJ, dan nomor kas.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block font-semibold text-slate-800 dark:text-slate-300 mb-1">
                Tingkat Organisasi Persuratan GKE
              </label>
              <select
                value={form.tingkatOrganisasi || 'jemaat'}
                onChange={(e) => setForm({ ...form, tingkatOrganisasi: e.target.value as 'jemaat' | 'resort' | 'sinode' })}
                className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-slate-100 font-bold focus:outline-none focus:border-cyan-500 shadow-xs"
              >
                <option value="jemaat">Majelis Pekerja Harian Jemaat (MPHJ-GKE)</option>
                <option value="resort">Majelis Pekerja Harian Resort (MPHR-GKE)</option>
                <option value="sinode">Majelis Sinode GKE (MS-GKE)</option>
              </select>
              <span className="text-[10px] text-slate-600 dark:text-slate-500 mt-1 block">Menentukan instansi penomoran baku surat keluar & agenda</span>
            </div>

            <div>
              <label className="block font-semibold text-slate-800 dark:text-slate-300 mb-1">
                Kode / Singkatan Jemaat Penomoran (Baku)
              </label>
              <input
                type="text"
                value={form.kodeJemaatPenomoran || ''}
                onChange={(e) => setForm({ ...form, kodeJemaatPenomoran: e.target.value.toUpperCase() })}
                placeholder="Contoh: EPN (untuk Jemaat Epata)"
                className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-slate-100 font-bold font-mono focus:outline-none focus:border-cyan-500 shadow-xs"
              />
              <span className="text-[10px] text-slate-600 dark:text-slate-500 mt-1 block">Kode 3 huruf identitas Jemaat (misal: EPN, BTM, PNY)</span>
            </div>

            <div>
              <label className="block font-semibold text-slate-800 dark:text-slate-300 mb-1">
                Kode Organisasi Tambahan (Legacy)
              </label>
              <input
                type="text"
                value={form.kodeOrganisasiPenomoran || ''}
                onChange={(e) => setForm({ ...form, kodeOrganisasiPenomoran: e.target.value })}
                placeholder="Contoh: MJ-GKE"
                className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-slate-100 font-bold focus:outline-none focus:border-cyan-500 shadow-xs"
              />
              <span className="text-[10px] text-slate-600 dark:text-slate-500 mt-1 block">Digunakan untuk penomoran dokumen kustom</span>
            </div>

            <div>
              <label className="block font-semibold text-slate-800 dark:text-slate-300 mb-1">
                Kode Surat Baptisan Kudus (SBK)
              </label>
              <input
                type="text"
                value={form.prefixSuratBaptis || 'SBK'}
                onChange={(e) => setForm({ ...form, prefixSuratBaptis: e.target.value })}
                placeholder="Contoh: SBK"
                className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-slate-100 font-mono focus:outline-none focus:border-cyan-500 shadow-xs"
              />
              <span className="text-[10px] text-slate-600 dark:text-slate-500 mt-1 block">Hasil: 001/{form.kodeOrganisasiPenomoran || 'MPH-MJ.GKE'}/{form.kodeJemaatPenomoran || (form.namaJemaat ? form.namaJemaat.replace(/[^A-Za-z]/g, '').slice(0, 3).toUpperCase() : 'PR')}/{form.prefixSuratBaptis || 'SBK'}/XII/2026</span>
            </div>

            <div>
              <label className="block font-semibold text-slate-800 dark:text-slate-300 mb-1">
                Kode Surat Peneguhan Sidi (SIDI)
              </label>
              <input
                type="text"
                value={form.prefixSuratSidi || 'SIDI'}
                onChange={(e) => setForm({ ...form, prefixSuratSidi: e.target.value })}
                placeholder="Contoh: SIDI"
                className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-slate-100 font-mono focus:outline-none focus:border-cyan-500 shadow-xs"
              />
              <span className="text-[10px] text-slate-600 dark:text-slate-500 mt-1 block">Hasil: 001/{form.kodeOrganisasiPenomoran || 'MPH-MJ.GKE'}/{form.kodeJemaatPenomoran || (form.namaJemaat ? form.namaJemaat.replace(/[^A-Za-z]/g, '').slice(0, 3).toUpperCase() : 'PR')}/{form.prefixSuratSidi || 'SIDI'}/XII/2026</span>
            </div>

            <div>
              <label className="block font-semibold text-slate-800 dark:text-slate-300 mb-1">
                Kode Surat Nikah / Pemberkatan (SN)
              </label>
              <input
                type="text"
                value={form.prefixSuratNikah || 'SN'}
                onChange={(e) => setForm({ ...form, prefixSuratNikah: e.target.value })}
                placeholder="Contoh: SN"
                className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-slate-100 font-mono focus:outline-none focus:border-cyan-500 shadow-xs"
              />
              <span className="text-[10px] text-slate-600 dark:text-slate-500 mt-1 block">Hasil: 001/{form.kodeOrganisasiPenomoran || 'MPH-MJ.GKE'}/{form.kodeJemaatPenomoran || (form.namaJemaat ? form.namaJemaat.replace(/[^A-Za-z]/g, '').slice(0, 3).toUpperCase() : 'PR')}/{form.prefixSuratNikah || 'SN'}/XII/2026</span>
            </div>

            <div>
              <label className="block font-semibold text-slate-800 dark:text-slate-300 mb-1">
                Format Prefix Warta Jemaat
              </label>
              <input
                type="text"
                value={form.prefixWartaJemaat || 'WARTA-GKE'}
                onChange={(e) => setForm({ ...form, prefixWartaJemaat: e.target.value })}
                placeholder="Contoh: WARTA-GKE"
                className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-slate-100 font-mono font-bold focus:outline-none focus:border-cyan-500 shadow-xs"
              />
              <span className="text-[10px] text-slate-600 dark:text-slate-500 mt-1 block">Hasil: 001/{form.prefixWartaJemaat || 'WARTA-GKE'}/{form.kodeJemaatPenomoran || (form.namaJemaat ? form.namaJemaat.replace(/[^A-Za-z]/g, '').slice(0, 3).toUpperCase() : 'GCI')}/II/2026</span>
            </div>

            <div>
              <label className="block font-semibold text-slate-800 dark:text-slate-300 mb-1">
                Prefix Kartu Keluarga Jemaat (KJJ)
              </label>
              <input
                type="text"
                value={form.prefixKjj || 'KJJ-GKE'}
                onChange={(e) => setForm({ ...form, prefixKjj: e.target.value })}
                placeholder="Contoh: KJJ-GKE"
                className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-slate-100 font-mono focus:outline-none focus:border-cyan-500 shadow-xs"
              />
              <span className="text-[10px] text-slate-600 dark:text-slate-500 mt-1 block">Hasil: {(form.prefixKjj || 'KJJ-GKE')}-2026-001</span>
            </div>

            <div>
              <label className="block font-semibold text-slate-800 dark:text-slate-300 mb-1">
                Prefix No. Referensi Kas Keuangan
              </label>
              <input
                type="text"
                value={form.prefixKasKeuangan || 'MKK'}
                onChange={(e) => setForm({ ...form, prefixKasKeuangan: e.target.value })}
                placeholder="Contoh: MKK"
                className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-slate-100 font-mono focus:outline-none focus:border-cyan-500 shadow-xs"
              />
              <span className="text-[10px] text-slate-600 dark:text-slate-500 mt-1 block">Hasil: {(form.prefixKasKeuangan || 'MKK')}-2026001</span>
            </div>

            <div>
              <label className="block font-semibold text-slate-800 dark:text-slate-300 mb-1">
                Prefix Kode Aset Inventaris
              </label>
              <input
                type="text"
                value={form.prefixKodeAset || 'AST'}
                onChange={(e) => setForm({ ...form, prefixKodeAset: e.target.value })}
                placeholder="Contoh: AST"
                className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-slate-100 font-mono focus:outline-none focus:border-cyan-500 shadow-xs"
              />
              <span className="text-[10px] text-slate-600 dark:text-slate-500 mt-1 block">Hasil: {(form.prefixKodeAset || 'AST')}-2026-001</span>
            </div>
          </div>

          {/* Card Preview Live Samples */}
          <div className="bg-slate-100/90 dark:bg-slate-950/80 p-4 rounded-xl border border-cyan-200 dark:border-cyan-500/20 space-y-2">
            <h4 className="font-bold text-cyan-700 dark:text-cyan-300 text-xs flex items-center gap-2">
              <FileText className="w-3.5 h-3.5" />
              <span>Pratinjau Live Format Nomor Otomatis Dokumen & Pelaporan Sesuai Juknis GKE</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2 text-[11px] font-mono">
              <div className="bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200 dark:border-slate-800 shadow-xs">
                <span className="text-slate-600 dark:text-slate-400 block text-[10px] font-sans font-medium">Surat Keluar:</span>
                <span className="text-indigo-600 dark:text-indigo-400 font-bold">001/MPHJ-GKE-{form.kodeJemaatPenomoran || (form.namaJemaat ? form.namaJemaat.replace(/[^A-Za-z]/g, '').slice(0, 3).toUpperCase() : 'EPN')}/U.I/07/2026</span>
              </div>
              <div className="bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200 dark:border-slate-800 shadow-xs">
                <span className="text-slate-600 dark:text-slate-400 block text-[10px] font-sans font-medium">Surat Baptis (SBK):</span>
                <span className="text-cyan-700 dark:text-cyan-400 font-bold">001/{form.kodeOrganisasiPenomoran || 'MPH-MJ.GKE'}/{form.kodeJemaatPenomoran || (form.namaJemaat ? form.namaJemaat.replace(/[^A-Za-z]/g, '').slice(0, 3).toUpperCase() : 'PR')}/{form.prefixSuratBaptis || 'SBK'}/XII/2026</span>
              </div>
              <div className="bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200 dark:border-slate-800 shadow-xs">
                <span className="text-slate-600 dark:text-slate-400 block text-[10px] font-sans font-medium">Surat SIDI (SIDI):</span>
                <span className="text-emerald-700 dark:text-emerald-400 font-bold">001/{form.kodeOrganisasiPenomoran || 'MPH-MJ.GKE'}/{form.kodeJemaatPenomoran || (form.namaJemaat ? form.namaJemaat.replace(/[^A-Za-z]/g, '').slice(0, 3).toUpperCase() : 'PR')}/{form.prefixSuratSidi || 'SIDI'}/XII/2026</span>
              </div>
              <div className="bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200 dark:border-slate-800 shadow-xs">
                <span className="text-slate-600 dark:text-slate-400 block text-[10px] font-sans font-medium">Surat Nikah (SN):</span>
                <span className="text-amber-700 dark:text-amber-400 font-bold">001/{form.kodeOrganisasiPenomoran || 'MPH-MJ.GKE'}/{form.kodeJemaatPenomoran || (form.namaJemaat ? form.namaJemaat.replace(/[^A-Za-z]/g, '').slice(0, 3).toUpperCase() : 'PR')}/{form.prefixSuratNikah || 'SN'}/XII/2026</span>
              </div>
              <div className="bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200 dark:border-slate-800 shadow-xs">
                <span className="text-slate-600 dark:text-slate-400 block text-[10px] font-sans font-medium">Warta Jemaat:</span>
                <span className="text-rose-600 dark:text-rose-400 font-bold">001/{form.prefixWartaJemaat || 'WARTA-GKE'}/{form.kodeJemaatPenomoran || (form.namaJemaat ? form.namaJemaat.replace(/[^A-Za-z]/g, '').slice(0, 3).toUpperCase() : 'GCI')}/II/2026</span>
              </div>
            </div>
          </div>
        </div>

        {/* Fitur Keamanan & Auto Logout Inaktivitas */}
        <div className="bg-slate-50 dark:bg-slate-900/80 rounded-2xl p-6 border border-slate-200 dark:border-slate-800/80 shadow-md backdrop-blur-md space-y-4 text-xs">
          <h3 className="font-bold text-slate-900 dark:text-slate-100 border-b border-slate-200 dark:border-slate-800 pb-3 flex items-center gap-2 text-sm">
            <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            Pengaturan Logout Otomatis Inaktivitas (Auto Logout)
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
            <div>
              <label className="block font-semibold text-slate-800 dark:text-slate-300 mb-1">
                Batas Waktu Tanpa Aktivitas (Inactivity Timeout)
              </label>
              <select
                value={form.inactivityTimeoutMinutes !== undefined ? form.inactivityTimeoutMinutes : 15}
                onChange={(e) =>
                  setForm({ ...form, inactivityTimeoutMinutes: parseInt(e.target.value, 10) })
                }
                className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-slate-100 font-bold focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 shadow-xs"
              >
                <option value={5}>5 Menit (Keamanan Tinggi)</option>
                <option value={10}>10 Menit</option>
                <option value={15}>15 Menit (Rekomendasi Standar)</option>
                <option value={30}>30 Menit</option>
                <option value={60}>60 Menit (1 Jam)</option>
                <option value={0}>Nonaktifkan Auto-Logout</option>
              </select>
            </div>

            <div className="bg-amber-50/60 dark:bg-slate-950/60 p-3.5 rounded-xl border border-amber-200 dark:border-slate-800 text-slate-700 dark:text-slate-400 text-[11px] leading-relaxed">
              <p className="font-bold text-amber-800 dark:text-amber-300 mb-0.5 flex items-center gap-1.5">
                <ShieldIcon className="w-3.5 h-3.5" />
                Proteksi Akun Otomatis
              </p>
              Sistem akan secara otomatis mengeluarkan (logout) pengguna jika tidak ada aktivitas mouse, keyboard, atau sentuhan layar selama durasi yang dipilih.
            </div>
          </div>
        </div>

        {/* Prosedur Keamanan Sistem: Skrip Internal Pencadangan Data Krusial Firestore (.JSON) */}
        <div className="bg-slate-50 dark:bg-slate-900/90 rounded-2xl p-6 border-2 border-indigo-300 dark:border-indigo-500/40 shadow-lg dark:shadow-2xl backdrop-blur-md space-y-5 text-xs relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-indigo-500/10 via-sky-500/5 to-transparent rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
          
          {/* Header Section */}
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4 relative z-10">
            <div className="flex items-start sm:items-center gap-3.5">
              <div className="p-3 rounded-2xl bg-indigo-100 dark:bg-indigo-600/20 text-indigo-700 dark:text-indigo-400 border border-indigo-300 dark:border-indigo-500/30 shadow-inner shrink-0">
                <ShieldCheck className="w-6 h-6 text-indigo-600 dark:text-indigo-300" />
              </div>
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-extrabold text-slate-900 dark:text-white text-base tracking-wide flex items-center gap-2">
                    Prosedur Keamanan: Skrip Pencadangan Data Krusial Firestore
                  </h3>
                  <span className="text-[10px] bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 font-extrabold px-2.5 py-0.5 rounded-full border border-indigo-300 dark:border-indigo-500/40 font-mono">
                    JSON SECURE BACKUP
                  </span>
                </div>
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                  Skrip internal otomatis untuk mengekstrak dan mengarsipkan 12 data krusial inti jemaat langsung dari Cloud Firestore ke file <code className="text-indigo-700 dark:text-indigo-300 bg-indigo-100 dark:bg-indigo-950/80 px-1.5 py-0.5 rounded font-mono border border-indigo-300 dark:border-indigo-700/50">.json</code> terstruktur untuk proteksi keamanan dan pemulihan darurat.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 self-end lg:self-auto">
              <button
                type="button"
                onClick={() => setIsBackupModalOpen(true)}
                className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs shadow-xs border border-slate-300 dark:border-slate-700 transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
                title="Buka panel lengkap cadangkan & pulihkan database"
              >
                <Database className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>Panel Backup &amp; Restore</span>
              </button>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 relative z-10">
            <div className="bg-white dark:bg-slate-950/70 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800/80 shadow-xs flex items-center gap-3">
              <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20 shrink-0">
                <ShieldIcon className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[10px] text-slate-600 dark:text-slate-400 uppercase font-bold tracking-wider">Koleksi Krusial</p>
                <p className="text-sm font-extrabold text-indigo-700 dark:text-indigo-300">{CRITICAL_COLLECTION_IDS.length} Koleksi Inti</p>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-950/70 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800/80 shadow-xs flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 shrink-0">
                <FileCheck2 className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[10px] text-slate-600 dark:text-slate-400 uppercase font-bold tracking-wider">Record Krusial</p>
                <p className="text-sm font-extrabold text-emerald-700 dark:text-emerald-300">~{crucialLiveRecords} Dokumen</p>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-950/70 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800/80 shadow-xs flex items-center gap-3">
              <div className="p-2 rounded-lg bg-sky-50 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-200 dark:border-sky-500/20 shrink-0">
                <Layers className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[10px] text-slate-600 dark:text-slate-400 uppercase font-bold tracking-wider">Total Seluruh DB</p>
                <p className="text-sm font-extrabold text-sky-700 dark:text-sky-300">~{totalLiveRecords} Dokumen</p>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-950/70 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800/80 shadow-xs flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20 shrink-0">
                <Clock className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <p className="text-[10px] text-slate-600 dark:text-slate-400 uppercase font-bold tracking-wider">Cadangan Terakhir</p>
                  {(settings.lastCrucialBackupTimestamp || settings.lastBackupTimestamp) && (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/30">
                      <Cloud className="w-2.5 h-2.5 text-emerald-600 dark:text-emerald-400" />
                      Cloud Synced
                    </span>
                  )}
                </div>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate mt-0.5">
                  {settings.lastCrucialBackupTimestamp || settings.lastBackupTimestamp || lastCrucialBackupTime || lastBackupTime
                    ? new Date(settings.lastCrucialBackupTimestamp || settings.lastBackupTimestamp || lastCrucialBackupTime || lastBackupTime!).toLocaleString('id-ID', {
                        dateStyle: 'short',
                        timeStyle: 'short',
                      })
                    : 'Belum Dicadangkan'}
                </p>
                {(settings.lastCrucialBackupBy || settings.lastBackupBy) && (
                  <p className="text-[10px] text-emerald-700 dark:text-emerald-400/90 font-medium truncate">
                    Oleh {settings.lastCrucialBackupBy || settings.lastBackupBy} ({settings.lastCrucialBackupTotalRecords || settings.lastBackupTotalRecords || 0} rec)
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Crucial Collections Tags Grid */}
          <div className="bg-indigo-50/40 dark:bg-slate-950/80 p-4 rounded-xl border border-indigo-200 dark:border-indigo-500/20 space-y-2.5 relative z-10">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-indigo-700 dark:text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                Cakupan Data Krusial yang Diamankan oleh Skrip:
              </span>
              <span className="text-[10px] text-slate-600 dark:text-slate-400 font-mono font-medium">
                12 dari {KNOWN_COLLECTIONS.length} Koleksi
              </span>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
              {KNOWN_COLLECTIONS.filter((c) => c.isCrucial).map((col) => {
                const count = col.id === 'settings' ? 1 : Array.isArray(liveFallbackState[col.id]) ? liveFallbackState[col.id].length : 0;
                return (
                  <div
                    key={col.id}
                    className="p-2 rounded-lg bg-white dark:bg-slate-900/90 border border-indigo-200 dark:border-indigo-500/20 shadow-xs flex flex-col justify-between"
                  >
                    <span className="text-[10px] font-bold text-slate-800 dark:text-slate-200 line-clamp-1" title={col.label}>
                      {col.label}
                    </span>
                    <div className="flex items-center justify-between mt-1 text-[9px]">
                      <span className="text-slate-600 dark:text-slate-400 font-mono">{col.id}</span>
                      <span className="bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 font-bold px-1.5 py-0.2 rounded font-mono">
                        {count} rec
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Success / Error Notification */}
          {crucialBackupNotice && (
            <div
              className={`p-3.5 rounded-xl border flex items-start gap-3 animate-in fade-in duration-200 relative z-10 ${
                crucialBackupNotice.success
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-500/40 text-emerald-800 dark:text-emerald-300'
                  : 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-500/40 text-rose-800 dark:text-rose-300'
              }`}
            >
              <div
                className={`p-1.5 rounded-lg shrink-0 ${
                  crucialBackupNotice.success ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300' : 'bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300'
                }`}
              >
                {crucialBackupNotice.success ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : (
                  <AlertTriangle className="w-4 h-4" />
                )}
              </div>
              <div className="space-y-0.5 text-xs flex-1">
                <p className="font-bold">
                  {crucialBackupNotice.success
                    ? 'Prosedur Pencadangan Krusial Berhasil'
                    : 'Kendala Skrip Pencadangan'}
                </p>
                <p className="text-[11px] opacity-90 leading-relaxed">{crucialBackupNotice.message}</p>
                <p className="text-[10px] text-slate-600 dark:text-slate-400 font-mono pt-0.5">
                  Waktu Eksekusi: {crucialBackupNotice.timestamp} WIB
                </p>
              </div>
              <button
                type="button"
                onClick={() => setCrucialBackupNotice(null)}
                className="text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white p-1 rounded cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Execution Progress Bar */}
          {isExportingCrucialBackup && (
            <div className="space-y-2 bg-white dark:bg-slate-950/90 p-4 rounded-xl border border-indigo-300 dark:border-indigo-500/30 shadow-xs relative z-10 animate-in fade-in duration-200">
              <div className="flex items-center justify-between text-xs">
                <span className="text-indigo-700 dark:text-indigo-300 font-bold flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-indigo-600 dark:text-indigo-400" />
                  <span>{crucialBackupStepLabel || 'Sedang memproses ekstraksi data krusial...'}</span>
                </span>
                <span className="font-extrabold text-indigo-700 dark:text-indigo-300 font-mono">{crucialBackupProgress}%</span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden border border-slate-300 dark:border-slate-700">
                <div
                  className="bg-gradient-to-r from-indigo-500 via-sky-400 to-emerald-400 h-full rounded-full transition-all duration-300 shadow-md"
                  style={{ width: `${crucialBackupProgress}%` }}
                />
              </div>
              <p className="text-[10px] text-slate-600 dark:text-slate-400">
                Skrip sedang memindai dokumen Firestore dari koleksi identitas, akun, keuangan, warga jemaat, dan arsip pelayanan.
              </p>
            </div>
          )}

          {/* Action Trigger Row */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2 border-t border-slate-200 dark:border-slate-800/80 relative z-10">
            <div className="text-[11px] text-slate-600 dark:text-slate-400 flex items-center gap-2">
              <FileJson className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
              <span>Format output: <strong className="text-slate-800 dark:text-slate-200">JSON</strong> (dengan metadata schema &amp; audit timestamp)</span>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 justify-end">
              {/* Button: Backup Data Krusial */}
              <button
                type="button"
                onClick={handleRunCrucialBackupScript}
                disabled={isExportingCrucialBackup || isExportingQuickBackup}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-extrabold text-xs shadow-lg shadow-indigo-600/30 active:scale-95 disabled:opacity-50 transition cursor-pointer min-h-[42px]"
              >
                {isExportingCrucialBackup ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Mengekstrak ({crucialBackupProgress}%)...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 text-indigo-200" />
                    <span>Cadangkan Data Krusial (.JSON)</span>
                  </>
                )}
              </button>

              {/* Button: Backup Seluruh DB */}
              <button
                type="button"
                onClick={handleQuickExportBackup}
                disabled={isExportingCrucialBackup || isExportingQuickBackup}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs border border-slate-300 dark:border-slate-700 shadow-xs transition active:scale-95 disabled:opacity-50 cursor-pointer min-h-[42px]"
                title="Cadangkan semua 23 koleksi Firestore"
              >
                {isExportingQuickBackup ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-indigo-600 dark:text-indigo-300" />
                    <span>Menyiapkan Full DB...</span>
                  </>
                ) : (
                  <>
                    <Database className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <span>Unduh Semua Database (Full)</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Fitur Pembersihan History Cache Application */}
        <div className="bg-slate-50 dark:bg-slate-900/80 rounded-2xl p-6 border border-slate-200 dark:border-slate-800/80 shadow-md backdrop-blur-md space-y-4 text-xs">
          <h3 className="font-bold text-slate-900 dark:text-slate-100 border-b border-slate-200 dark:border-slate-800 pb-3 flex items-center gap-2 text-sm">
            <Trash2 className="w-4 h-4 text-rose-600 dark:text-rose-400" />
            Pembersihan History Data & Cache Aplikasi
          </h3>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-rose-50/50 dark:bg-slate-950/60 p-4 rounded-xl border border-rose-200 dark:border-slate-800">
            <div className="space-y-1">
              <h4 className="font-bold text-slate-900 dark:text-slate-200 text-xs">Hapus Cache & History Storage Local</h4>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed max-w-xl">
                Membersihkan cache browser, storage sementara, serta data pemicu history tanpa menghapus database utama di Cloud Firestore. Gunakan fitur ini jika tampilan aplikasi mengalami kendala atau perlu disegarkan secara total.
              </p>
            </div>

            <button
              type="button"
              onClick={async () => {
                setIsClearingCache(true);
                await clearAppCache();
                setTimeout(() => setIsClearingCache(false), 1000);
              }}
              disabled={isClearingCache}
              className="flex items-center gap-2 bg-rose-100 dark:bg-rose-600/20 hover:bg-rose-200 dark:hover:bg-rose-600/30 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-500/30 font-bold px-4 py-2.5 rounded-xl transition-all whitespace-nowrap active:scale-95 disabled:opacity-50"
            >
              {isClearingCache ? (
                <RefreshCw className="w-4 h-4 text-rose-600 dark:text-rose-400 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4 text-rose-600 dark:text-rose-400" />
              )}
              <span>{isClearingCache ? 'Membersihkan...' : 'Hapus Cache Aplikasi'}</span>
            </button>
          </div>
        </div>

        {/* Sticky Floating Action Bar for Easy Saving */}
        <div className="sticky bottom-4 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-4 rounded-2xl border border-indigo-300 dark:border-indigo-500/40 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-3 my-4">
          <div className="flex items-center gap-2.5 text-xs text-slate-800 dark:text-slate-200">
            <div className="p-2 rounded-xl bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-400 border border-indigo-300 dark:border-indigo-500/30">
              <Settings className="w-4 h-4" />
            </div>
            <div>
              <p className="font-bold text-slate-900 dark:text-slate-100">Simpan Identitas & Kop Surat</p>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 hidden sm:block">
                Perubahan langsung tersimpan secara realtime ke Cloud Firestore & Local Cache
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            {saveSuccess && (
              <span className="text-emerald-700 dark:text-emerald-400 font-bold text-xs bg-emerald-100 dark:bg-emerald-500/15 px-3 py-2 rounded-xl border border-emerald-300 dark:border-emerald-500/30 flex items-center gap-1.5 animate-pulse">
                ✓ Berhasil Disimpan!
              </span>
            )}
            <button
              type="button"
              disabled={isSaving}
              onClick={() => handleSubmit()}
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 active:scale-98 text-white font-bold text-sm px-7 py-3 rounded-xl shadow-lg shadow-indigo-600/30 transition-all hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 cursor-pointer"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin text-indigo-200" />
                  <span>Menyimpan ({saveProgress}%)...</span>
                </>
              ) : (
                <>
                  <Save className="w-5 h-5 text-indigo-200" />
                  <span>Simpan Sekarang</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      {/* Confirmation & Progress Modal for Saving Settings */}
      {isConfirmSaveModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-indigo-300 dark:border-indigo-500/40 text-slate-900 dark:text-slate-100 animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="bg-indigo-50 dark:bg-indigo-950/40 p-4 px-5 border-b border-indigo-100 dark:border-indigo-800/50 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/30">
                  <Save className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                    Konfirmasi Simpan Pengaturan Sistem
                  </h3>
                  <p className="text-[11px] text-indigo-700 dark:text-indigo-300/80">
                    Simpan pembaruan identitas gereja, logo, kop surat, dan format laporan
                  </p>
                </div>
              </div>
              {!isSaving && (
                <button
                  type="button"
                  onClick={() => setIsConfirmSaveModalOpen(false)}
                  className="text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4 text-xs max-h-[75vh] overflow-y-auto">
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                Apakah Anda yakin ingin menyimpan dan menerapkan pembaruan pengaturan aplikasi berikut ke Cloud Firestore?
              </p>

              {/* Summary Card */}
              <div className="bg-slate-50 dark:bg-slate-950/80 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2.5">
                <div className="flex justify-between items-start pb-2 border-b border-slate-200 dark:border-slate-800/80">
                  <span className="text-slate-600 dark:text-slate-400">Nama Aplikasi & Deskripsi</span>
                  <div className="text-right max-w-[240px]">
                    <p className="font-bold text-indigo-700 dark:text-indigo-300 truncate">{form.namaAplikasi || 'SIKA GKE'}</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{form.deskripsiAplikasi || '-'}</p>
                  </div>
                </div>

                <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-slate-800/80">
                  <span className="text-slate-600 dark:text-slate-400">Majelis Jemaat GKE</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200 text-right max-w-[240px] truncate">
                    {form.namaJemaat || '-'}
                  </span>
                </div>

                <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-slate-800/80">
                  <span className="text-slate-600 dark:text-slate-400">Resort & Lokasi</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200 text-right max-w-[240px] truncate">
                    {form.resortGke || '-'} {form.tempatDiterbitkan ? `(${form.tempatDiterbitkan})` : ''}
                  </span>
                </div>

                <div className="flex justify-between items-start pb-2 border-b border-slate-200 dark:border-slate-800/80">
                  <span className="text-slate-600 dark:text-slate-400">Kop Surat Resmi (Line 1 & 2)</span>
                  <div className="text-right max-w-[240px]">
                    <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">{form.headerKopLine1 || '-'}</p>
                    <p className="text-[10px] text-indigo-600 dark:text-indigo-400 truncate">{form.headerKopLine2 || '-'}</p>
                  </div>
                </div>

                <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-slate-800/80">
                  <span className="text-slate-600 dark:text-slate-400">Ketua Majelis Jemaat</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200 text-right max-w-[240px] truncate">
                    {form.namaKetuaJemaat || '-'} {form.nipKetuaJemaat ? `(NIP: ${form.nipKetuaJemaat})` : ''}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-slate-600 dark:text-slate-400">Bendahara & Sekretaris</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200 text-right max-w-[240px] truncate">
                    {form.namaBendahara || '-'} / {form.namaSekretaris || '-'}
                  </span>
                </div>
              </div>

              {/* Error Message if Any */}
              {saveError && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 text-rose-700 dark:text-rose-300 flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-bold text-[11px]">Gagal Menyimpan:</p>
                    <p className="text-[11px] leading-relaxed">{saveError}</p>
                  </div>
                </div>
              )}

              {/* Save Progress Bar Section */}
              {isSaving && (
                <div className="space-y-2 pt-2 bg-white dark:bg-slate-950/90 p-3.5 rounded-xl border border-indigo-200 dark:border-indigo-500/30 shadow-xs">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-indigo-700 dark:text-indigo-400 font-semibold flex items-center gap-2">
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600 dark:text-indigo-400" />
                      <span>{saveStepLabel || 'Sedang memproses penyimpanan ke Firestore database...'}</span>
                    </span>
                    <span className="font-extrabold text-indigo-700 dark:text-indigo-300 font-mono">{saveProgress}%</span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-900 rounded-full h-3 overflow-hidden border border-indigo-200 dark:border-indigo-500/30 p-0.5">
                    <div
                      className="bg-gradient-to-r from-indigo-500 via-blue-500 to-emerald-400 h-full rounded-full transition-all duration-300 ease-out shadow-xs"
                      style={{ width: `${saveProgress}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-slate-600 dark:text-slate-400 text-center">
                    Mohon tunggu sebentar, data sedang diamankan dan disinkronisasi ke seluruh modul sistem.
                  </p>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="px-5 py-3.5 bg-slate-50 dark:bg-slate-950/60 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2.5">
              <button
                type="button"
                disabled={isSaving}
                onClick={() => setIsConfirmSaveModalOpen(false)}
                className="px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold text-slate-700 dark:text-slate-300 text-xs transition disabled:opacity-50 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isSaving}
                onClick={handleConfirmSave}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 active:scale-98 text-white rounded-xl font-bold text-xs shadow-md shadow-indigo-600/30 transition flex items-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Menyimpan ({saveProgress}%)...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Ya, Simpan Pengaturan Sekarang</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fullscreen Preview of Under Construction */}
      {isPreviewMaintenanceModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <UnderConstructionScreen
            isPreview={true}
            onClosePreview={() => setIsPreviewMaintenanceModalOpen(false)}
          />
        </div>
      )}

      {/* Database Backup & Restore Modal */}
      <DatabaseBackupRestoreModal
        isOpen={isBackupModalOpen}
        onClose={() => setIsBackupModalOpen(false)}
      />
    </div>
  );
};
