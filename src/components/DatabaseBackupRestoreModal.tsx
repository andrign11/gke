import React, { useState, useRef } from 'react';
import {
  Database,
  Download,
  UploadCloud,
  FileJson,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  X,
  FileCheck,
  HardDrive,
  ShieldCheck,
  Clock,
  Layers,
  ArrowRight,
  HelpCircle,
  Sparkles,
  Info,
  Server,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle,
  Cloud,
  History,
  User,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  KNOWN_COLLECTIONS,
  exportFirestoreDatabase,
  downloadBackupJsonFile,
  validateBackupJson,
  restoreFirestoreDatabase,
  DatabaseBackupPayload,
  DatabaseBackupMetadata,
  JsonValidationResult,
  RestoreProgressState,
} from '../utils/databaseBackupRestore';

interface DatabaseBackupRestoreModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DatabaseBackupRestoreModal: React.FC<DatabaseBackupRestoreModalProps> = ({
  isOpen,
  onClose,
}) => {
  const {
    settings,
    recordBackupCloud,
    currentUser,
    addAuditLog,
    syncCloudData,
    wargaJemaatList,
    keuanganList,
    penatuaDiakonList,
    jadwalIbadahList,
    mphList,
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
    pengurusKategorialList,
    kegiatanKategorialList,
    pengurusPembangunanList,
    proyekPembangunanList,
    auditLogs,
    userAccounts,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'backup' | 'restore'>('backup');

  // Backup State
  const [isExporting, setIsExporting] = useState(false);
  const [lastBackupTime, setLastBackupTime] = useState<string | null>(() => {
    return localStorage.getItem('gke_last_backup_timestamp');
  });
  const [selectedBackupCollections, setSelectedBackupCollections] = useState<string[]>(() =>
    KNOWN_COLLECTIONS.map((c) => c.id)
  );

  // Restore State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [validationResult, setValidationResult] = useState<JsonValidationResult | null>(null);
  const [parsedBackupData, setParsedBackupData] = useState<DatabaseBackupPayload | null>(null);
  const [parsedMetadata, setParsedMetadata] = useState<DatabaseBackupMetadata | null>(null);
  const [restoreError, setRestoreError] = useState<string | null>(null);
  const [restoreMode, setRestoreMode] = useState<'overwrite' | 'merge'>('overwrite');
  const [selectedRestoreCollections, setSelectedRestoreCollections] = useState<string[]>([]);
  const [isRestoring, setIsRestoring] = useState(false);
  const [restoreProgressState, setRestoreProgressState] = useState<RestoreProgressState | null>(null);
  const [isRestoreConfirmModalOpen, setIsRestoreConfirmModalOpen] = useState(false);
  const [restoreSuccessNotice, setRestoreSuccessNotice] = useState<{
    total: number;
    collections: string[];
  } | null>(null);

  if (!isOpen) return null;

  // Build current live record counts
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

  const getLiveCount = (colId: string): number => {
    if (colId === 'settings') return 1;
    const arr = liveFallbackState[colId];
    return Array.isArray(arr) ? arr.length : 0;
  };

  const totalLiveRecords = KNOWN_COLLECTIONS.reduce(
    (acc, col) => acc + getLiveCount(col.id),
    0
  );

  // Handle Export Backup
  const handleExportBackup = async () => {
    try {
      setIsExporting(true);
      const payload = await exportFirestoreDatabase({
        fallbackState: liveFallbackState,
        currentUser,
        settings,
      });

      // Filter collections if user customized selection
      if (selectedBackupCollections.length < KNOWN_COLLECTIONS.length) {
        const filteredCols: Record<string, any> = {};
        const filteredCounts: Record<string, number> = {};
        let filteredTotal = 0;

        selectedBackupCollections.forEach((id) => {
          if (payload.collections[id] !== undefined) {
            filteredCols[id] = payload.collections[id];
            const c = payload.metadata.collectionCounts[id] || 0;
            filteredCounts[id] = c;
            filteredTotal += c;
          }
        });

        payload.collections = filteredCols;
        payload.metadata.collectionCounts = filteredCounts;
        payload.metadata.totalRecords = filteredTotal;
      }

      // Download file
      downloadBackupJsonFile(payload);

      // Save last backup timestamp & record to Cloud Firestore
      const nowStr = new Date().toISOString();
      setLastBackupTime(nowStr);

      await recordBackupCloud({
        type: selectedBackupCollections.length < KNOWN_COLLECTIONS.length ? 'custom' : 'full',
        totalRecords: payload.metadata.totalRecords,
        filename: `BACKUP_DATABASE_GKE_${new Date().toISOString().slice(0, 10)}.json`,
        collectionCounts: payload.metadata.collectionCounts,
      });
    } catch (err: any) {
      console.error('Export backup failed:', err);
    } finally {
      setIsExporting(false);
    }
  };

  // Handle File Input Selection & Drag-and-drop
  const handleFileProcess = (file: File) => {
    setRestoreError(null);
    setRestoreSuccessNotice(null);
    setUploadedFileName(file.name);

    if (!file.name.endsWith('.json')) {
      setRestoreError('Format berkas tidak valid. Harap pilih file berekstensi .JSON');
      setValidationResult(null);
      setParsedBackupData(null);
      setParsedMetadata(null);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (!content) {
        setRestoreError('File kosong atau tidak terbaca dari media penyimpanan.');
        setValidationResult(null);
        return;
      }

      const result = validateBackupJson(content);
      setValidationResult(result);

      if (!result.valid || !result.parsedData || !result.metadata) {
        setRestoreError(result.error || 'Struktur file JSON tidak sesuai dengan skema database Firestore SIMJPD GKE.');
        setParsedBackupData(null);
        setParsedMetadata(null);
      } else {
        setParsedBackupData(result.parsedData);
        setParsedMetadata(result.metadata);
        setSelectedRestoreCollections(result.detectedCollections);
      }
    };
    reader.onerror = () => {
      setRestoreError('Gagal membaca file dari penyimpanan lokal perangkat.');
    };
    reader.readAsText(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  // Handle Execute Restore
  const handleExecuteRestore = async () => {
    if (!parsedBackupData) return;

    try {
      setIsRestoring(true);
      setIsRestoreConfirmModalOpen(false);
      setRestoreProgressState({
        progress: 2,
        currentCollection: 'inisialisasi',
        currentCollectionLabel: 'Inisialisasi',
        collectionIndex: 1,
        totalCollections: selectedRestoreCollections.length,
        processedDocs: 0,
        totalDocs: parsedMetadata?.totalRecords || 0,
        currentBatch: 1,
        totalBatches: 1,
        stepLabel: 'Memverifikasi koneksi dan inisialisasi batch Firestore...',
        phase: 'validating',
      });

      const result = await restoreFirestoreDatabase(parsedBackupData, {
        mode: restoreMode,
        selectedCollections: selectedRestoreCollections,
        onProgress: (pState) => {
          setRestoreProgressState(pState);
        },
      });

      if (!result.success) {
        setRestoreError(result.error || 'Gagal memulihkan database.');
      } else {
        setRestoreSuccessNotice({
          total: result.totalRestored,
          collections: result.restoredCollections,
        });

        // Trigger cloud data refresh
        await syncCloudData();

        // Audit Log
        await addAuditLog({
          userId: currentUser?.id || 'admin',
          username: currentUser?.username || 'admin',
          role: currentUser?.role || 'admin',
          action: 'SISTEM_BACKUP',
          detail: `Memulihkan database Firestore (Mode: ${restoreMode}, ${result.totalRestored} record berhasil dipulihkan)`,
          ipAddress: 'Client-Device',
        });
      }
    } catch (err: any) {
      setRestoreError(err?.message || 'Terjadi kesalahan sistem saat pemulihan.');
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[70] flex items-center justify-center p-2 sm:p-4 overflow-hidden">
      <div className="bg-slate-900 rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden border border-slate-700/80 text-slate-100 flex flex-col max-h-[92dvh] sm:max-h-[90vh] my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 shrink-0">
              <Database className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-sm sm:text-lg text-slate-100">
                  Backup &amp; Pemulihan Database Firestore
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  JSON Standar
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-400 line-clamp-1 sm:line-clamp-none">
                Unduh salinan cadangan data Firestore atau pulihkan arsip JSON ke sistem
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 bg-slate-950/60 p-1.5 gap-2 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('backup')}
            className={`flex-1 py-2.5 px-4 rounded-xl font-bold flex items-center justify-center gap-2 transition cursor-pointer min-h-[44px] ${
              activeTab === 'backup'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
          >
            <Download className="w-4 h-4" />
            <span>Ekspor / Backup Database (.JSON)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('restore')}
            className={`flex-1 py-2.5 px-4 rounded-xl font-bold flex items-center justify-center gap-2 transition cursor-pointer min-h-[44px] ${
              activeTab === 'restore'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
          >
            <UploadCloud className="w-4 h-4" />
            <span>Impor / Restore Database</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-3 sm:p-5 overflow-y-auto space-y-4 sm:space-y-6 flex-1 text-xs">
          {/* TAB 1: BACKUP DATABASE */}
          {activeTab === 'backup' && (
            <div className="space-y-4 sm:space-y-5 animate-in fade-in duration-150">
              {/* Quick Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800 space-y-1">
                  <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs">
                    <Database className="w-4 h-4" />
                    <span>Total Koleksi Firestore</span>
                  </div>
                  <p className="text-xl font-black text-slate-100">
                    {KNOWN_COLLECTIONS.length} Koleksi
                  </p>
                  <p className="text-[10px] text-slate-500">Mencakup semua data SIMJPD</p>
                </div>

                <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800 space-y-1">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                    <Layers className="w-4 h-4" />
                    <span>Total Rekaman Aktif</span>
                  </div>
                  <p className="text-xl font-black text-emerald-400">
                    {totalLiveRecords} Dokumen
                  </p>
                  <p className="text-[10px] text-slate-500">Data terdaftar di cloud</p>
                </div>

                <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800 space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
                      <Clock className="w-4 h-4" />
                      <span>Cadangan Terakhir</span>
                    </div>
                    {(settings.lastBackupTimestamp || settings.lastCrucialBackupTimestamp) && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                        <Cloud className="w-2.5 h-2.5 text-emerald-400" />
                        Cloud Synced
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-bold text-slate-200 truncate">
                    {settings.lastBackupTimestamp || settings.lastCrucialBackupTimestamp || lastBackupTime
                      ? new Intl.DateTimeFormat('id-ID', {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        }).format(new Date(settings.lastBackupTimestamp || settings.lastCrucialBackupTimestamp || lastBackupTime!))
                      : 'Belum Pernah Dicadangkan'}
                  </p>
                  <p className="text-[10px] text-emerald-400/90 truncate">
                    {settings.lastBackupBy
                      ? `Oleh ${settings.lastBackupBy} (${settings.lastBackupTotalRecords || 0} rec) • Cloud Firestore`
                      : 'Tersimpan & tersinkronisasi di Cloud Firestore'}
                  </p>
                </div>
              </div>

              {/* Action Banner Card */}
              <div className="bg-gradient-to-r from-indigo-950/50 via-slate-900 to-slate-950 p-4 sm:p-5 rounded-2xl border border-indigo-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1 max-w-xl">
                  <h4 className="font-bold text-sm text-indigo-200 flex items-center gap-2">
                    <FileJson className="w-4 h-4 text-indigo-400 shrink-0" />
                    <span>Unduh Arsip Cadangan Database Lengkap (.JSON)</span>
                  </h4>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    Sistem akan menyusun seluruh salinan dokumen Firestore (Warga, Keuangan, Kas, Agenda Surat, Jadwal, Pelayanan Sakramen, Inventaris, Akun, dan Pengaturan Kop Surat) menjadi file JSON berstruktur baku untuk arsip mandiri offline.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleExportBackup}
                  disabled={isExporting}
                  className="w-full sm:w-auto px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer whitespace-nowrap disabled:opacity-50 min-h-[44px]"
                >
                  {isExporting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-indigo-200" />
                      <span>Sedang Mengunduh Data...</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4 text-indigo-200" />
                      <span>Unduh Backup Database (.JSON)</span>
                    </>
                  )}
                </button>
              </div>

              {/* Collections Checklist & Breakdown */}
              <div className="bg-slate-950/70 p-3 sm:p-4 rounded-xl border border-slate-800 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
                  <div className="flex items-center gap-2">
                    <HardDrive className="w-4 h-4 text-slate-400" />
                    <span className="font-bold text-slate-200">
                      Rincian Koleksi yang Dicadangkan ({selectedBackupCollections.length}/
                      {KNOWN_COLLECTIONS.length})
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px]">
                    <button
                      type="button"
                      onClick={() => setSelectedBackupCollections(KNOWN_COLLECTIONS.map((c) => c.id))}
                      className="text-indigo-400 hover:underline cursor-pointer"
                    >
                      Pilih Semua
                    </button>
                    <span className="text-slate-600">•</span>
                    <button
                      type="button"
                      onClick={() => setSelectedBackupCollections(['settings', 'warga_jemaat', 'keuangan'])}
                      className="text-indigo-400 hover:underline cursor-pointer"
                    >
                      Data Utama Saja
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 max-h-60 overflow-y-auto pr-1">
                  {KNOWN_COLLECTIONS.map((col) => {
                    const count = getLiveCount(col.id);
                    const isChecked = selectedBackupCollections.includes(col.id);

                    return (
                      <label
                        key={col.id}
                        className={`flex items-center justify-between p-2.5 rounded-lg border transition cursor-pointer select-none ${
                          isChecked
                            ? 'bg-slate-900 border-indigo-500/40 text-slate-200'
                            : 'bg-slate-950/40 border-slate-800/60 text-slate-500 opacity-60'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0 pr-2">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedBackupCollections([...selectedBackupCollections, col.id]);
                              } else {
                                setSelectedBackupCollections(
                                  selectedBackupCollections.filter((id) => id !== col.id)
                                );
                              }
                            }}
                            className="rounded border-slate-700 text-indigo-600 focus:ring-0"
                          />
                          <div className="min-w-0">
                            <p className="font-semibold text-[11px] truncate">{col.label}</p>
                            <p className="text-[9px] text-slate-400 truncate">{col.id}</p>
                          </div>
                        </div>
                        <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-800 text-indigo-300 border border-slate-700 shrink-0">
                          {count}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Riwayat Log Cadangan Cloud Terakhir (Realtime Synced across all devices) */}
              <div className="bg-slate-950/70 p-3 sm:p-4 rounded-xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                  <div className="flex items-center gap-2">
                    <History className="w-4 h-4 text-emerald-400" />
                    <span className="font-bold text-slate-200 text-xs sm:text-sm">
                      Riwayat Log Cadangan Cloud Terakhir (Semua Perangkat)
                    </span>
                  </div>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                    <Cloud className="w-3 h-3 text-emerald-400" />
                    Tersinkronisasi Realtime
                  </span>
                </div>

                {auditLogs.filter((l) => l.kategori === 'SISTEM_BACKUP' || (l.aktivitas && l.aktivitas.includes('BACKUP'))).length === 0 &&
                !settings.lastBackupTimestamp &&
                !settings.lastCrucialBackupTimestamp ? (
                  <div className="p-4 text-center text-slate-500 text-xs">
                    Belum ada riwayat backup cloud yang tercatat. Silakan unduh backup database di atas untuk mencadangkan.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {/* Latest Cloud Record from Settings if available */}
                    {(settings.lastBackupTimestamp || settings.lastCrucialBackupTimestamp) && (
                      <div className="p-2.5 rounded-lg bg-emerald-950/20 border border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                        <div className="flex items-start sm:items-center gap-2.5">
                          <div className="p-1.5 rounded-md bg-emerald-500/20 text-emerald-400 shrink-0 mt-0.5 sm:mt-0">
                            <Cloud className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-200">
                                {settings.lastCrucialBackupTimestamp ? 'Cadangan Krusial Firestore' : 'Cadangan Database Lengkap'}
                              </span>
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-mono font-bold">
                                Cloud Active
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-400 mt-0.5">
                              {settings.lastBackupBy ? `Oleh ${settings.lastBackupBy}` : 'Oleh Administrator'} •{' '}
                              {settings.lastBackupTotalRecords || settings.lastCrucialBackupTotalRecords || 0} record dicadangkan
                            </p>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-[11px] font-mono text-emerald-300 font-bold block">
                            {new Date(
                              settings.lastCrucialBackupTimestamp || settings.lastBackupTimestamp!
                            ).toLocaleString('id-ID', {
                              dateStyle: 'medium',
                              timeStyle: 'short',
                            })}
                          </span>
                          <span className="text-[9px] text-slate-500">Tersinkron ke HP/PC</span>
                        </div>
                      </div>
                    )}

                    {/* Audit Logs list */}
                    {auditLogs
                      .filter((l) => l.kategori === 'SISTEM_BACKUP' || (l.aktivitas && l.aktivitas.includes('BACKUP')))
                      .slice(0, 5)
                      .map((log) => (
                        <div
                          key={log.id}
                          className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                        >
                          <div className="flex items-start sm:items-center gap-2.5">
                            <div className="p-1.5 rounded-md bg-indigo-500/10 text-indigo-400 shrink-0 mt-0.5 sm:mt-0">
                              <FileJson className="w-3.5 h-3.5" />
                            </div>
                            <div>
                              <p className="font-semibold text-slate-300 line-clamp-1">{log.detail}</p>
                              <p className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1.5">
                                <span className="text-slate-300 font-medium">{log.pengguna}</span>
                                <span>•</span>
                                <span className="capitalize">{log.role}</span>
                                <span>•</span>
                                <span>{log.aktivitas}</span>
                              </p>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="text-[11px] font-mono text-slate-300 block">
                              {new Date(log.waktu).toLocaleString('id-ID', {
                                dateStyle: 'short',
                                timeStyle: 'short',
                              })}
                            </span>
                            <span className="text-[9px] text-slate-500">Audit Log</span>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: RESTORE DATABASE */}
          {activeTab === 'restore' && (
            <div className="space-y-4 sm:space-y-5 animate-in fade-in duration-150">
              {/* Instructions Banner */}
              <div className="bg-slate-950/70 p-3 sm:p-4 rounded-xl border border-amber-500/20 text-slate-300 space-y-1.5">
                <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
                  <ShieldCheck className="w-4 h-4 shrink-0" />
                  <span>Petunjuk Validasi Schema &amp; Pemulihan Database Firestore</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Unggah file cadangan JSON hasil ekspor SIMJPD GKE. Sistem secara otomatis menjalankan validasi schema mendalam untuk memastikan integritas tipe data dan mencegah data korup sebelum proses restore.
                </p>
              </div>

              {/* Drag and Drop Zone */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-5 sm:p-6 text-center cursor-pointer transition-all ${
                  isDragging
                    ? 'border-emerald-400 bg-emerald-950/20'
                    : uploadedFileName
                    ? 'border-emerald-500/50 bg-slate-950/60'
                    : 'border-slate-700/80 hover:border-indigo-500/60 bg-slate-950/40'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json,application/json"
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      handleFileProcess(e.target.files[0]);
                    }
                  }}
                  className="hidden"
                />

                <div className="flex flex-col items-center justify-center gap-2.5">
                  <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    <UploadCloud className="w-8 h-8" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-100 text-sm">
                      {uploadedFileName ? uploadedFileName : 'Klik atau Tarik File Cadangan (.JSON) ke Sini'}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Mendukung file backup hasil ekspor SIMJPD GKE
                    </p>
                  </div>
                  <button
                    type="button"
                    className="mt-1 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition min-h-[38px]"
                  >
                    Pilih File JSON
                  </button>
                </div>
              </div>

              {/* Error Alert */}
              {restoreError && (
                <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 flex items-start gap-3">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                  <div className="space-y-0.5">
                    <p className="font-bold text-xs">Validasi File Menemukan Masalah:</p>
                    <p className="text-[11px] leading-relaxed">{restoreError}</p>
                  </div>
                </div>
              )}

              {/* Success Notice */}
              {restoreSuccessNotice && (
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-xs">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Database Berhasil Dipulihkan!</span>
                  </div>
                  <p className="text-[11px] text-emerald-200/90 leading-relaxed">
                    Sebanyak <strong>{restoreSuccessNotice.total} record</strong> pada{' '}
                    <strong>{restoreSuccessNotice.collections.length} koleksi</strong> telah berhasil
                    dimasukkan dan disinkronisasi ke Cloud Firestore.
                  </p>
                </div>
              )}

              {/* SCHEMA VALIDATION INSPECTOR PANEL */}
              {validationResult && validationResult.valid && parsedMetadata && parsedBackupData && (
                <div className="bg-slate-950/80 p-4 sm:p-5 rounded-2xl border border-emerald-500/30 space-y-4">
                  {/* Status Banner */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2">
                      <FileCheck className="w-5 h-5 text-emerald-400" />
                      <div>
                        <h4 className="font-bold text-slate-100 text-xs sm:text-sm">
                          Hasil Validasi Integritas Schema JSON
                        </h4>
                        <p className="text-[10px] text-slate-400">
                          {validationResult.totalDocs} Dokumen Terverifikasi &bull; Siap Dipulihkan
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {validationResult.severity === 'success' ? (
                        <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                          <CheckCircle className="w-3 h-3 text-emerald-400" /> Schema 100% Valid
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3 text-amber-400" /> Ada Catatan Schema
                        </span>
                      )}
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 font-mono">
                        v{parsedMetadata.version || '3.0.0'}
                      </span>
                    </div>
                  </div>

                  {/* Metadata Info Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5 text-[11px]">
                    <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                      <span className="text-slate-400 block text-[10px]">Aplikasi &amp; Jemaat:</span>
                      <span className="font-bold text-slate-200 truncate block">
                        {parsedMetadata.appName} ({parsedMetadata.namaJemaat})
                      </span>
                    </div>

                    <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                      <span className="text-slate-400 block text-[10px]">Waktu Cadangan:</span>
                      <span className="font-bold text-slate-200 truncate block">
                        {parsedMetadata.exportDateFormatted || parsedMetadata.exportTimestamp}
                      </span>
                    </div>

                    <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                      <span className="text-slate-400 block text-[10px]">Pengekspor:</span>
                      <span className="font-bold text-slate-200 truncate block">
                        {parsedMetadata.exportedBy || 'Admin'}
                      </span>
                    </div>

                    <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                      <span className="text-slate-400 block text-[10px]">Total Rekaman:</span>
                      <span className="font-bold text-emerald-400 font-mono block">
                        {parsedMetadata.totalRecords} Record
                      </span>
                    </div>
                  </div>

                  {/* Warnings & Notes if any */}
                  {validationResult.warnings.length > 0 && (
                    <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 space-y-1">
                      <p className="font-bold text-[11px] flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>Catatan Integritas Data ({validationResult.warnings.length}):</span>
                      </p>
                      <ul className="list-disc list-inside text-[10px] text-amber-200/80 space-y-0.5">
                        {validationResult.warnings.map((w, idx) => (
                          <li key={idx}>{w}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Detailed Collections Schema Inspection Breakdown */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="font-bold text-slate-200 block text-xs">
                        Pemeriksaan Validasi Per-Koleksi ({validationResult.collectionReports.length} Terdeteksi):
                      </label>
                      <span className="text-[10px] text-slate-400">
                        {selectedRestoreCollections.length} Dipilih untuk Restore
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-56 overflow-y-auto pr-1">
                      {validationResult.collectionReports.map((report) => {
                        const isChecked = selectedRestoreCollections.includes(report.collectionId);

                        return (
                          <label
                            key={report.collectionId}
                            className={`p-2.5 rounded-xl border text-[11px] flex items-center justify-between cursor-pointer transition select-none ${
                              isChecked
                                ? 'bg-slate-900 border-emerald-500/40 text-slate-200'
                                : 'bg-slate-950/40 border-slate-800 text-slate-500 opacity-50'
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0 pr-1">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedRestoreCollections([
                                      ...selectedRestoreCollections,
                                      report.collectionId,
                                    ]);
                                  } else {
                                    setSelectedRestoreCollections(
                                      selectedRestoreCollections.filter((k) => k !== report.collectionId)
                                    );
                                  }
                                }}
                                className="rounded border-slate-700 text-emerald-600 focus:ring-0 shrink-0"
                              />
                              <div className="min-w-0">
                                <p className="font-semibold text-[11px] truncate">{report.label}</p>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  {report.status === 'valid' && (
                                    <span className="text-[9px] text-emerald-400 font-bold flex items-center gap-0.5">
                                      <CheckCircle className="w-2.5 h-2.5" /> Valid
                                    </span>
                                  )}
                                  {report.status === 'warning' && (
                                    <span className="text-[9px] text-amber-400 font-bold flex items-center gap-0.5">
                                      <AlertTriangle className="w-2.5 h-2.5" /> Perhatian
                                    </span>
                                  )}
                                  {report.status === 'empty' && (
                                    <span className="text-[9px] text-slate-500 font-bold">Kosong</span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <span className="font-mono text-[10px] text-emerald-300 bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700 shrink-0 font-bold">
                              {report.validCount}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  {/* Mode Selection */}
                  <div className="pt-2 border-t border-slate-800 space-y-2">
                    <label className="font-bold text-slate-200 block text-xs">
                      Pilih Mode Pemulihan Data:
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <label
                        className={`p-3 rounded-xl border flex items-start gap-2.5 cursor-pointer transition ${
                          restoreMode === 'overwrite'
                            ? 'bg-rose-950/20 border-rose-500/50 text-slate-100'
                            : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-300'
                        }`}
                      >
                        <input
                          type="radio"
                          name="restoreMode"
                          value="overwrite"
                          checked={restoreMode === 'overwrite'}
                          onChange={() => setRestoreMode('overwrite')}
                          className="mt-0.5 text-rose-500 focus:ring-0"
                        />
                        <div className="space-y-0.5">
                          <p className="font-bold text-xs text-rose-300">Mode Timpa Bersih (Full Replace)</p>
                          <p className="text-[10px] text-slate-400 leading-relaxed">
                            Menghapus data lama pada koleksi yang dipilih dan menggantikannya dengan isi file cadangan secara bersih.
                          </p>
                        </div>
                      </label>

                      <label
                        className={`p-3 rounded-xl border flex items-start gap-2.5 cursor-pointer transition ${
                          restoreMode === 'merge'
                            ? 'bg-emerald-950/20 border-emerald-500/50 text-slate-100'
                            : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-300'
                        }`}
                      >
                        <input
                          type="radio"
                          name="restoreMode"
                          value="merge"
                          checked={restoreMode === 'merge'}
                          onChange={() => setRestoreMode('merge')}
                          className="mt-0.5 text-emerald-500 focus:ring-0"
                        />
                        <div className="space-y-0.5">
                          <p className="font-bold text-xs text-emerald-300">Mode Gabung &amp; Perbarui (Merge / Upsert)</p>
                          <p className="text-[10px] text-slate-400 leading-relaxed">
                            Menambahkan data baru dan memperbarui data yang sama ID-nya tanpa menghapus record lain yang sudah ada.
                          </p>
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* Action Restore Button */}
                  <div className="pt-3 border-t border-slate-800 flex justify-end">
                    <button
                      type="button"
                      disabled={isRestoring || selectedRestoreCollections.length === 0}
                      onClick={() => setIsRestoreConfirmModalOpen(true)}
                      className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition active:scale-95 cursor-pointer disabled:opacity-50 min-h-[44px]"
                    >
                      <UploadCloud className="w-4 h-4 text-emerald-200" />
                      <span>Proses Pemulihan ke Cloud Firestore Sekarang</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* DYNAMIC PROGRESS BAR & REALTIME RESTORE INDICATOR */}
          {isRestoring && restoreProgressState && (
            <div className="p-4 sm:p-5 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 rounded-2xl border-2 border-emerald-500/50 shadow-2xl space-y-3.5 animate-in fade-in duration-200">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2 text-emerald-300 font-bold">
                  <RefreshCw className="w-4 h-4 animate-spin text-emerald-400 shrink-0" />
                  <span className="truncate">{restoreProgressState.stepLabel}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[11px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700 font-bold">
                    {restoreProgressState.processedDocs} / {restoreProgressState.totalDocs} Dokumen
                  </span>
                  <span className="font-mono font-black text-emerald-400 text-base">
                    {restoreProgressState.progress}%
                  </span>
                </div>
              </div>

              {/* Progress Bar with Shimmer Animation */}
              <div className="w-full bg-slate-950 rounded-full h-4 overflow-hidden border border-emerald-500/40 p-0.5 relative shadow-inner">
                <div
                  className="bg-gradient-to-r from-teal-500 via-emerald-400 to-green-300 h-full rounded-full transition-all duration-300 ease-out relative overflow-hidden"
                  style={{ width: `${restoreProgressState.progress}%` }}
                >
                  <div className="absolute inset-0 bg-white/20 animate-pulse" />
                </div>
              </div>

              {/* Progress Steps Detail */}
              <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-400 pt-1">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span>Koleksi Aktif: <strong className="text-slate-200">{restoreProgressState.currentCollectionLabel}</strong> ({restoreProgressState.collectionIndex}/{restoreProgressState.totalCollections})</span>
                </span>
                <span className="text-amber-400/90 font-medium">
                  ⚠️ Mohon jangan menutup tab atau menyegarkan halaman browser
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 sm:p-4 bg-slate-950 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 text-slate-400 text-[11px]">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="truncate">Format Ekspor: JSON Standar Bersih (Firestore Batching &amp; Validated)</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2 border border-slate-700 rounded-xl hover:bg-slate-800 font-semibold text-slate-300 transition cursor-pointer min-h-[38px]"
          >
            Tutup
          </button>
        </div>
      </div>

      {/* Confirmation Modal before executing restore */}
      {isRestoreConfirmModalOpen && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-[80] flex items-center justify-center p-3 sm:p-4">
          <div className="bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-amber-500/50 text-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-amber-950/40 p-4 border-b border-amber-800/40 flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-100">Konfirmasi Pemulihan Database</h4>
                <p className="text-[11px] text-amber-300">Tindakan ini akan memodifikasi data Firestore</p>
              </div>
            </div>

            <div className="p-4 sm:p-5 space-y-3 text-xs leading-relaxed text-slate-300">
              <p>
                Anda akan memulihkan data dari file <strong>{uploadedFileName}</strong> sebanyak{' '}
                <strong className="text-emerald-400">{parsedMetadata?.totalRecords} record</strong> ke
                Cloud Firestore.
              </p>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
                <p className="font-bold text-slate-200">
                  Mode: {restoreMode === 'overwrite' ? '🔴 Timpa Bersih (Full Replace)' : '🟢 Gabung & Perbarui (Merge)'}
                </p>
                <p className="text-[11px] text-slate-400">
                  {restoreMode === 'overwrite'
                    ? 'Data lama pada koleksi yang dipilih akan digantikan dengan data baru dari file backup.'
                    : 'Data lama akan digabungkan dan diperbarui tanpa menghapus record lain.'}
                </p>
              </div>

              <p className="text-amber-400 text-[11px] font-semibold">
                Apakah Anda yakin ingin melanjutkan proses pemulihan sekarang?
              </p>
            </div>

            <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsRestoreConfirmModalOpen(false)}
                className="px-4 py-2 border border-slate-700 rounded-xl hover:bg-slate-800 font-semibold text-slate-300 text-xs transition min-h-[38px]"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleExecuteRestore}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 transition flex items-center gap-2 cursor-pointer min-h-[38px]"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Ya, Mulai Pulihkan Sekarang</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
