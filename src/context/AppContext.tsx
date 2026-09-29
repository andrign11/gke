import React, { createContext, useContext, useEffect, useState, useRef, useMemo } from 'react';
import {
  collection,
  doc,
  onSnapshot,
  setDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
  getDocs,
  getDoc,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, cleanForFirestore } from '../lib/firebase';
import {
  initialAgendaSurat,
  initialAuditLogs,
  initialBeritaJemaatList,
  initialInventarisAset,
  initialPemeliharaanAset,
  initialJabatanOrganisasi,
  initialJadwalIbadah,
  initialJadwalKatekisasi,
  initialKegiatanKategorial,
  initialKeuanganItems,
  initialIuranKewajibanList,
  initialLingkunganList,
  initialMPHMembers,
  initialPendaftaranAnggota,
  initialPenatuaDiakon,
  initialPelayananSakramen,
  initialPengurusKategorial,
  initialPengurusPembangunan,
  initialProyekPembangunan,
  initialRancanganKhotbah,
  initialRenunganItems,
  initialSettings,
  initialUserAccounts,
  initialWargaJemaat,
  initialMateriPengajaranList,
  initialKatalogBukuList,
  initialPeminjamanBukuList,
  initialSesiPemilihanList,
  initialKandidatPemilihanList,
  initialSuaraVotingList,
  initialNominasiAspirasiList,
  initialWhatsAppBotConfig,
  initialWhatsAppKeywordRules,
  initialWhatsAppBroadcastMessages,
  initialWhatsAppMessageLogs,
  initialWhatsAppPrayerRequests,
  initialPelayananTasks,
  initialLaporanBugList,
  initialAlmanakNastList,
  initialSingerJemaatList,
} from '../data/seedData';
import {
  AgendaSurat,
  AppSettings,
  AuditCategory,
  AuditLog,
  BeritaJemaat,
  InventarisAset,
  PemeliharaanAset,
  JabatanOrganisasi,
  JadwalIbadah,
  JadwalKatekisasi,
  KegiatanKategorial,
  KeuanganItem,
  IuranKewajiban,
  IuranBulanDetail,
  Lingkungan,
  MPHMember,
  PendaftaranAnggota,
  PenatuaDiakon,
  SingerJemaat,
  PelayananSakramen,
  PengurusKategorial,
  PengurusPembangunan,
  ProyekPembangunan,
  RancanganKhotbah,
  ReportType,
  RenunganItem,
  UserAccount,
  UserRole,
  WargaJemaat,
  MateriPengajaran,
  KatalogBuku,
  PeminjamanBuku,
  SesiPemilihan,
  KandidatPemilihan,
  SuaraVoting,
  NominasiAspirasi,
  WhatsAppBotConfig,
  WhatsAppKeywordRule,
  WhatsAppBroadcastMessage,
  WhatsAppMessageLog,
  WhatsAppPrayerRequest,
  PelayananTask,
  TaskCategory,
  TaskPriority,
  TaskStatus,
  TaskSubtask,
  TaskProgressNote,
  AlmanakNastGKE,
  LaporanBug,
  BugKategori,
  BugPrioritas,
  BugStatus,
  ToastItem,
  ToastOptions,
  ToastType,
} from '../types';
import {
  extractOfficialSignatoriesFromOrg,
  buildSettingsPayloadFromSyncedOfficials,
} from '../utils/officialsSync';
import { generateUsername, generateRandomPassword } from '../utils/credentialUtils';
import {
  resolveTabFromLocation,
  updateBrowserUrl,
  resolvePortalTabFromLocation,
  updatePortalBrowserUrl,
  generateShareableMenuUrl,
} from '../utils/urlRouter';

interface PrintConfig {
  isOpen: boolean;
  reportType: ReportType;
  startDate?: string;
  endDate?: string;
  tahun?: string;
  posKas?: string;
  selectedRayon?: string;
  selectedKategori?: string;
  customTitle?: string;
  renunganId?: string;
  jadwalId?: string;
  pendaftaranId?: string;
  khotbahId?: string;
  noKjj?: string;
  beritaJemaatId?: string;
  sakramenId?: string;
  selectedSeksi?: string;
  selectedId?: string;
  taskId?: string;
  selectedPriority?: string;
  selectedStatus?: string;
  selectedAssignee?: string;
  alkitabKitab?: string;
  alkitabPasal?: number;
  alkitabAyatStart?: number;
  alkitabAyatEnd?: number;
  alkitabSelectedVerses?: string[];
  filterJenis?: string;
  customSaldoAwal?: number;
  sesiId?: string;
  wargaId?: string;
}

interface AppContextType {
  // Network & Offline Status
  isOnline: boolean;
  isReconnecting: boolean;
  checkConnection: () => Promise<boolean>;

  // Theme & Appearance (Dedicated for Admin & Warga Jemaat)
  theme: 'dark' | 'light';
  themeAdmin: 'dark' | 'light';
  themePortal: 'dark' | 'light';
  setTheme: (theme: 'dark' | 'light') => void;
  setThemeAdmin: (theme: 'dark' | 'light') => void;
  setThemePortal: (theme: 'dark' | 'light') => void;
  toggleTheme: () => void;
  toggleThemeAdmin: () => void;
  toggleThemePortal: () => void;

  // Navigation & User State
  isAuthenticated: boolean;
  currentUser: UserAccount | null;
  setCurrentUser: (user: UserAccount | null) => void;
  login: (username: string, password?: string) => { success: boolean; message?: string };
  logout: () => void;
  viewMode: 'admin' | 'public';
  setViewMode: (mode: 'admin' | 'public') => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  activePortalTab: string;
  setActivePortalTab: (tab: string) => void;
  switchRole: (role: UserRole) => void;
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (open: boolean) => void;

  // App Settings
  settings: AppSettings;
  updateSettings: (newSettings: Partial<AppSettings>) => Promise<{ success: boolean; error?: string }>;
  recordBackupCloud: (info: {
    type: 'full' | 'crucial' | 'custom';
    totalRecords: number;
    filename?: string;
    collectionCounts?: Record<string, number>;
  }) => Promise<{ success: boolean; error?: string }>;

  // User Accounts Management
  userAccounts: UserAccount[];
  addUserAccount: (user: Omit<UserAccount, 'id'>) => void;
  updateUserAccount: (id: string, user: Partial<UserAccount>) => void;
  deleteUserAccount: (id: string) => void;

  // Lingkungan / Sektor Warga Jemaat
  lingkunganList: Lingkungan[];
  addLingkungan: (item: Omit<Lingkungan, 'id'>) => void;
  updateLingkungan: (id: string, item: Partial<Lingkungan>) => void;
  deleteLingkungan: (id: string) => void;

  // Penatua & Diakon
  penatuaDiakonList: PenatuaDiakon[];
  addPenatuaDiakon: (item: Omit<PenatuaDiakon, 'id'>) => void;
  updatePenatuaDiakon: (id: string, item: Partial<PenatuaDiakon>) => void;
  deletePenatuaDiakon: (id: string) => void;

  // Singer / Pemandu Lagu Jemaat
  singerJemaatList: SingerJemaat[];
  addSingerJemaat: (item: Omit<SingerJemaat, 'id'>) => Promise<string>;
  updateSingerJemaat: (id: string, item: Partial<SingerJemaat>) => Promise<void>;
  deleteSingerJemaat: (id: string) => Promise<void>;
  batchAddSingerJemaat: (items: Omit<SingerJemaat, 'id'>[]) => Promise<number>;

  // Keuangan
  keuanganList: KeuanganItem[];
  addKeuanganItem: (item: Omit<KeuanganItem, 'id'>) => void;
  updateKeuanganItem: (id: string, item: Partial<KeuanganItem>) => void;
  deleteKeuanganItem: (id: string) => void;

  // Iuran Kewajiban Warga (Januari - Desember) Terintegrasi Kas
  iuranKewajibanList: IuranKewajiban[];
  addIuranKewajiban: (item: Omit<IuranKewajiban, 'id'>) => Promise<string>;
  updateIuranKewajiban: (id: string, item: Partial<IuranKewajiban>) => Promise<void>;
  deleteIuranKewajiban: (id: string) => Promise<void>;
  bayarIuranKewajiban: (params: {
    noKjj: string;
    namaKepalaKeluarga: string;
    wargaId?: string;
    rayon: string;
    tahun: number;
    bulanList: number[];
    nominalPerBulan: number;
    tanggalBayar: string;
    metodePembayaran: string;
    posKasTujuan?: string;
    catatKeBukuKas?: boolean;
    petugasPenerima?: string;
    catatan?: string;
  }) => Promise<{ success: boolean; iuranId: string; kasId?: string; noReferensi: string }>;
  batalBayarIuranKewajiban: (iuranId: string, bulan: number) => Promise<void>;

  // Warga Jemaat
  wargaJemaatList: WargaJemaat[];
  addWargaJemaat: (item: Omit<WargaJemaat, 'id'>) => void;
  updateWargaJemaat: (id: string, item: Partial<WargaJemaat>) => void;
  deleteWargaJemaat: (id: string) => void;
  deleteMultipleWargaJemaat: (ids: string[]) => Promise<{ count: number }>;
  clearAllWargaJemaat: (options?: { rayon?: string }) => Promise<{ count: number }>;
  deleteKeluargaByKjj: (noKjj: string) => Promise<{ count: number }>;

  // Jadwal Ibadah
  jadwalIbadahList: JadwalIbadah[];
  addJadwalIbadah: (item: Omit<JadwalIbadah, 'id'>) => Promise<string>;
  batchAddJadwalIbadah: (items: Omit<JadwalIbadah, 'id'>[], options?: { replaceExistingDates?: boolean }) => Promise<number>;
  updateJadwalIbadah: (id: string, item: Partial<JadwalIbadah>) => Promise<void>;
  deleteJadwalIbadah: (id: string) => Promise<void>;

  // Jadwal Katekisasi (Pernikahan & SIDI)
  jadwalKatekisasiList: JadwalKatekisasi[];
  addJadwalKatekisasi: (item: Omit<JadwalKatekisasi, 'id'>) => Promise<void>;
  updateJadwalKatekisasi: (id: string, item: Partial<JadwalKatekisasi>) => Promise<void>;
  deleteJadwalKatekisasi: (id: string) => Promise<void>;

  // MPH Jemaat
  mphList: MPHMember[];
  addMPHMember: (item: Omit<MPHMember, 'id'>) => void;
  updateMPHMember: (id: string, item: Partial<MPHMember>) => void;
  deleteMPHMember: (id: string) => void;

  // Master Jabatan Struktural & Kategorial
  jabatanList: JabatanOrganisasi[];
  addJabatan: (item: Omit<JabatanOrganisasi, 'id'>) => Promise<void>;
  updateJabatan: (id: string, item: Partial<JabatanOrganisasi>) => Promise<void>;
  deleteJabatan: (id: string) => Promise<void>;
  resetJabatanToDefault: () => Promise<void>;

  // Inventaris & Aset
  inventarisList: InventarisAset[];
  addInventarisAset: (item: Omit<InventarisAset, 'id'>) => void;
  updateInventarisAset: (id: string, item: Partial<InventarisAset>) => void;
  deleteInventarisAset: (id: string) => void;

  // Jadwal Pemeliharaan & Servis Aset Gereja
  pemeliharaanAsetList: PemeliharaanAset[];
  addPemeliharaanAset: (item: Omit<PemeliharaanAset, 'id'>) => Promise<string>;
  updatePemeliharaanAset: (id: string, item: Partial<PemeliharaanAset>) => Promise<void>;
  deletePemeliharaanAset: (id: string) => Promise<void>;
  completePemeliharaanAset: (
    id: string,
    completionData: {
      tanggalSelesai: string;
      biayaRealisasi?: number;
      tindakanPerbaikan?: string;
      kondisiAsetSetelahServis?: 'Baik' | 'Rusak Ringan' | 'Rusak Berat';
      keterangan?: string;
      buatJadwalBerikutnya?: boolean;
      siklusBulanBerikutnya?: number;
    }
  ) => Promise<void>;
  dueSoonMaintenanceList: (PemeliharaanAset & { diffDays: number; isOverdue: boolean; isDueSoon: boolean; isUrgent: boolean })[];
  dueMaintenanceList: (PemeliharaanAset & { diffDays: number; isOverdue: boolean; isDueSoon: boolean; isUrgent: boolean })[];
  dueSoonMaintenanceCount: number;
  overdueMaintenanceCount: number;

  // Renungan & Khotbah
  renunganList: RenunganItem[];
  addRenunganItem: (item: Omit<RenunganItem, 'id'>) => void;
  updateRenunganItem: (id: string, item: Partial<RenunganItem>) => void;
  deleteRenunganItem: (id: string) => void;
  togglePostingBuletin: (id: string) => void;

  // Pendaftaran Warga (MPH)
  pendaftaranList: PendaftaranAnggota[];
  addPendaftaran: (item: Omit<PendaftaranAnggota, 'id' | 'tanggalDaftar' | 'statusKonfirmasiMPH'>) => void;
  approvePendaftaran: (id: string, catatan?: string) => void;
  rejectPendaftaran: (id: string, catatan?: string) => void;
  deletePendaftaran: (id: string) => void;

  // Rancangan Khotbah Custom Durasi
  rancanganKhotbahList: RancanganKhotbah[];
  addRancanganKhotbah: (item: Omit<RancanganKhotbah, 'id'>) => void;
  updateRancanganKhotbah: (id: string, item: Partial<RancanganKhotbah>) => void;
  deleteRancanganKhotbah: (id: string) => void;

  // Agenda Surat Masuk & Keluar
  agendaSuratList: AgendaSurat[];
  addAgendaSurat: (item: Omit<AgendaSurat, 'id'>) => void;
  updateAgendaSurat: (id: string, item: Partial<AgendaSurat>) => void;
  deleteAgendaSurat: (id: string) => void;

  // Pelayanan Sakramen (Menikah, Baptis, Sidi)
  pelayananSakramenList: PelayananSakramen[];
  addPelayananSakramen: (item: Omit<PelayananSakramen, 'id' | 'tersimpanKeAgendaSurat'>) => Promise<void>;
  importBatchPelayananSakramen: (
    items: Omit<PelayananSakramen, 'id' | 'tersimpanKeAgendaSurat'>[],
    options?: { skipDuplicates?: boolean }
  ) => Promise<{ success: boolean; count: number; skipped: number; message?: string }>;
  updatePelayananSakramen: (id: string, item: Partial<PelayananSakramen>) => Promise<void>;
  deletePelayananSakramen: (id: string) => Promise<void>;
  archivePelayananSuratKeAgenda: (item: PelayananSakramen) => Promise<void>;
  unarchivePelayananSuratKeAgenda: (id: string) => Promise<void>;
  resetStatusArsipBaptisSemua: () => Promise<void>;

  // Berita & Warta Jemaat
  beritaJemaatList: BeritaJemaat[];
  addBeritaJemaat: (item: Omit<BeritaJemaat, 'id'>) => Promise<string>;
  updateBeritaJemaat: (id: string, item: Partial<BeritaJemaat>) => Promise<void>;
  deleteBeritaJemaat: (id: string) => Promise<void>;

  // Seksi Pelayanan Kategorial (SPB, SPPer, SPPR/P, SPA)
  pengurusKategorialList: PengurusKategorial[];
  addPengurusKategorial: (item: Omit<PengurusKategorial, 'id'>) => Promise<void>;
  updatePengurusKategorial: (id: string, item: Partial<PengurusKategorial>) => Promise<void>;
  deletePengurusKategorial: (id: string) => Promise<void>;

  kegiatanKategorialList: KegiatanKategorial[];
  addKegiatanKategorial: (item: Omit<KegiatanKategorial, 'id'>) => Promise<void>;
  updateKegiatanKategorial: (id: string, item: Partial<KegiatanKategorial>) => Promise<void>;
  deleteKegiatanKategorial: (id: string) => Promise<void>;

  // Panitia Pembangunan & Proyek
  pengurusPembangunanList: PengurusPembangunan[];
  addPengurusPembangunan: (item: Omit<PengurusPembangunan, 'id'>) => Promise<void>;
  updatePengurusPembangunan: (id: string, item: Partial<PengurusPembangunan>) => Promise<void>;
  deletePengurusPembangunan: (id: string) => Promise<void>;

  proyekPembangunanList: ProyekPembangunan[];
  addProyekPembangunan: (item: Omit<ProyekPembangunan, 'id'>) => Promise<void>;
  updateProyekPembangunan: (id: string, item: Partial<ProyekPembangunan>) => Promise<void>;
  deleteProyekPembangunan: (id: string) => Promise<void>;

  // Almanak Nast GKE (Bacaan Harian & Khotbah Liturgis Sinode GKE)
  almanakNastList: AlmanakNastGKE[];
  addAlmanakNast: (item: Omit<AlmanakNastGKE, 'id'>) => Promise<string>;
  updateAlmanakNast: (id: string, item: Partial<AlmanakNastGKE>) => Promise<void>;
  deleteAlmanakNast: (id: string) => Promise<void>;
  importAlmanakNastBatch: (items: Omit<AlmanakNastGKE, 'id'>[], mode: 'append' | 'overwrite') => Promise<{ success: boolean; count: number; message?: string }>;
  resetAlmanakNastDefault: () => Promise<void>;

  // Perpustakaan & Bahan Pengajaran Rohani
  materiPengajaranList: MateriPengajaran[];
  addMateriPengajaran: (item: Omit<MateriPengajaran, 'id'>) => Promise<string>;
  updateMateriPengajaran: (id: string, item: Partial<MateriPengajaran>) => Promise<void>;
  deleteMateriPengajaran: (id: string) => Promise<void>;

  katalogBukuList: KatalogBuku[];
  addKatalogBuku: (item: Omit<KatalogBuku, 'id'>) => Promise<string>;
  updateKatalogBuku: (id: string, item: Partial<KatalogBuku>) => Promise<void>;
  deleteKatalogBuku: (id: string) => Promise<void>;

  peminjamanBukuList: PeminjamanBuku[];
  addPeminjamanBuku: (item: Omit<PeminjamanBuku, 'id'>) => Promise<string>;
  updatePeminjamanBuku: (id: string, item: Partial<PeminjamanBuku>) => Promise<void>;
  deletePeminjamanBuku: (id: string) => Promise<void>;
  kembalikanBuku: (id: string, catatan?: string) => Promise<void>;

  // Pemilihan Majelis / Panitia & E-Voting
  sesiPemilihanList: SesiPemilihan[];
  addSesiPemilihan: (item: Omit<SesiPemilihan, 'id'>) => Promise<string>;
  updateSesiPemilihan: (id: string, item: Partial<SesiPemilihan>) => Promise<void>;
  deleteSesiPemilihan: (id: string) => Promise<void>;

  kandidatPemilihanList: KandidatPemilihan[];
  addKandidatPemilihan: (item: Omit<KandidatPemilihan, 'id' | 'jumlahSuara'>) => Promise<string>;
  updateKandidatPemilihan: (id: string, item: Partial<KandidatPemilihan>) => Promise<void>;
  deleteKandidatPemilihan: (id: string) => Promise<void>;

  suaraVotingList: SuaraVoting[];
  submitSuaraVoting: (sesiId: string, kandidatIdList: string[], voterInfo: { id: string; nama: string; rayon?: string; noKjj?: string }) => Promise<{ success: boolean; kodeVerifikasi?: string; message?: string }>;
  resetSuaraVotingSesi: (sesiId: string) => Promise<void>;

  nominasiAspirasiList: NominasiAspirasi[];
  submitNominasiAspirasi: (item: Omit<NominasiAspirasi, 'id' | 'waktuUsulan'>) => Promise<{ success: boolean; message?: string }>;
  updateNominasiAspirasi: (id: string, item: Partial<NominasiAspirasi>) => Promise<void>;
  deleteNominasiAspirasi: (id: string) => Promise<void>;

  // WhatsApp BOT & Gateway Center
  whatsAppBotConfig: WhatsAppBotConfig;
  updateWhatsAppBotConfig: (config: Partial<WhatsAppBotConfig>) => Promise<void>;
  whatsAppKeywordRules: WhatsAppKeywordRule[];
  addWhatsAppKeywordRule: (rule: Omit<WhatsAppKeywordRule, 'id' | 'hitCount'>) => Promise<string>;
  updateWhatsAppKeywordRule: (id: string, rule: Partial<WhatsAppKeywordRule>) => Promise<void>;
  deleteWhatsAppKeywordRule: (id: string) => Promise<void>;
  deleteAllWhatsAppKeywordRules: () => Promise<void>;
  resetWhatsAppKeywordRulesToDefault: () => Promise<void>;
  syncWhatsAppRealDataToServer: () => Promise<boolean>;
  whatsAppBroadcasts: WhatsAppBroadcastMessage[];
  sendWhatsAppBroadcast: (broadcast: Omit<WhatsAppBroadcastMessage, 'id' | 'waktuKirim'>) => Promise<string>;
  deleteWhatsAppBroadcast: (id: string) => Promise<void>;
  whatsAppMessageLogs: WhatsAppMessageLog[];
  addWhatsAppMessageLog: (log: Omit<WhatsAppMessageLog, 'id' | 'waktu'>) => Promise<string>;
  clearWhatsAppMessageLogs: () => Promise<void>;
  whatsAppPrayerRequests: WhatsAppPrayerRequest[];
  addWhatsAppPrayerRequest: (item: Omit<WhatsAppPrayerRequest, 'id' | 'waktuMasuk'>) => Promise<string>;
  updateWhatsAppPrayerRequest: (id: string, item: Partial<WhatsAppPrayerRequest>) => Promise<void>;
  deleteWhatsAppPrayerRequest: (id: string) => Promise<void>;
  processIncomingWhatsAppMessage: (pesan: string, nomorPengirim?: string, namaPengirim?: string) => Promise<{ reply: string; keywordFound?: string; prayerSaved?: boolean }>;

  // Manajemen Tugas Pelayanan (Task Board)
  pelayananTaskList: PelayananTask[];
  addPelayananTask: (task: Omit<PelayananTask, 'id' | 'tanggalDibuat'>) => Promise<string>;
  updatePelayananTask: (id: string, task: Partial<PelayananTask>) => Promise<void>;
  deletePelayananTask: (id: string) => Promise<void>;
  movePelayananTaskStatus: (id: string, newStatus: TaskStatus) => Promise<void>;
  togglePelayananSubtask: (taskId: string, subtaskId: string) => Promise<void>;
  addPelayananTaskProgressNote: (taskId: string, note: string, penulisNama?: string) => Promise<void>;

  // Laporan Bug & Kendala Sistem
  laporanBugList: LaporanBug[];
  addLaporanBug: (bug: Omit<LaporanBug, 'id' | 'tanggalLapor' | 'status'>) => Promise<string>;
  updateLaporanBug: (id: string, updates: Partial<LaporanBug>) => Promise<void>;
  deleteLaporanBug: (id: string) => Promise<void>;

  // Security Audit Logs
  auditLogs: AuditLog[];
  addAuditLog: (log: Omit<AuditLog, 'id' | 'waktu'>) => Promise<void>;
  clearAuditLogs: () => Promise<void>;

  // Print Report Engine
  printConfig: PrintConfig | null;
  openPrintReport: (config: Omit<PrintConfig, 'isOpen'> | ReportType) => void;
  closePrintReport: () => void;

  // Reset & Cache Management
  resetAllData: () => void;
  clearAppCache: () => Promise<void>;

  // Officials / Signatories Synchronization
  syncOfficialsFromOrgData: (force?: boolean) => Promise<{ updated: Partial<AppSettings>; count: number }>;

  // Loading, Sync & Security State
  isLoadingFirebase: boolean;
  isSyncingCloud: boolean;
  syncMessage: string | null;
  syncCloudData: () => Promise<void>;
  inactivityNotice: string | null;
  clearInactivityNotice: () => void;

  // Global Toast Notifications
  toasts: ToastItem[];
  showToast: {
    (optionsOrMessage: ToastOptions | string, type?: ToastType, duration?: number): string;
    success: (message: string, titleOrDuration?: string | number, duration?: number) => string;
    error: (message: string, titleOrDuration?: string | number, duration?: number) => string;
    info: (message: string, titleOrDuration?: string | number, duration?: number) => string;
    warning: (message: string, titleOrDuration?: string | number, duration?: number) => string;
  };
  removeToast: (id: string) => void;
  clearToasts: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEY = 'gke_sijemaat_v1_store';

export const safeSetLocalStorage = (key: string, value: string): boolean => {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (err: any) {
    console.warn(`[LocalStorage] Failed to set item "${key}" (${err?.name || err?.message}). Attempting storage cleanup...`);
    try {
      // Clear non-critical cache items
      const keysToPurge: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (
          k &&
          k !== `${STORAGE_KEY}_is_auth` &&
          k !== `${STORAGE_KEY}_current_user` &&
          k !== key
        ) {
          keysToPurge.push(k);
        }
      }
      keysToPurge.forEach((k) => {
        try {
          localStorage.removeItem(k);
        } catch {
          // ignore
        }
      });
      localStorage.setItem(key, value);
      return true;
    } catch (e2) {
      console.warn(`[LocalStorage] Storage is still full after cleanup. Skipping local cache for "${key}". Firestore is authoritative.`);
      return false;
    }
  }
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Realtime Firestore State & LocalStorage Persisted Settings
  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_settings`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.loginBackgroundUrl && parsed.loginBackgroundUrl.includes('1548625361')) {
          parsed.loginBackgroundUrl = 'https://images.unsplash.com/photo-1543731068-7e0f5beff43a?auto=format&fit=crop&w=1920&q=80';
        }
        return parsed;
      }
    } catch {
      // ignore
    }
    return initialSettings;
  });
  const [userAccounts, setUserAccounts] = useState<UserAccount[]>(initialUserAccounts);
  const [penatuaDiakonList, setPenatuaDiakonList] = useState<PenatuaDiakon[]>(initialPenatuaDiakon);
  const [keuanganList, setKeuanganList] = useState<KeuanganItem[]>(initialKeuanganItems);
  const [iuranKewajibanList, setIuranKewajibanList] = useState<IuranKewajiban[]>(initialIuranKewajibanList);
  const [wargaJemaatList, setWargaJemaatList] = useState<WargaJemaat[]>(initialWargaJemaat);
  const [jadwalIbadahList, setJadwalIbadahList] = useState<JadwalIbadah[]>(initialJadwalIbadah);
  const [mphList, setMphList] = useState<MPHMember[]>(initialMPHMembers);
  const [jabatanList, setJabatanList] = useState<JabatanOrganisasi[]>(initialJabatanOrganisasi);
  const [inventarisList, setInventarisList] = useState<InventarisAset[]>(initialInventarisAset);
  const [pemeliharaanAsetList, setPemeliharaanAsetList] = useState<PemeliharaanAset[]>(initialPemeliharaanAset);
  const [renunganList, setRenunganList] = useState<RenunganItem[]>(initialRenunganItems);
  const [pendaftaranList, setPendaftaranList] = useState<PendaftaranAnggota[]>(initialPendaftaranAnggota);
  const [rancanganKhotbahList, setRancanganKhotbahList] = useState<RancanganKhotbah[]>(initialRancanganKhotbah);
  const [lingkunganList, setLingkunganList] = useState<Lingkungan[]>(initialLingkunganList);
  const [singerJemaatList, setSingerJemaatList] = useState<SingerJemaat[]>(initialSingerJemaatList);
  const [agendaSuratList, setAgendaSuratList] = useState<AgendaSurat[]>(initialAgendaSurat);
  const [pelayananSakramenList, setPelayananSakramenList] = useState<PelayananSakramen[]>(initialPelayananSakramen);
  const [beritaJemaatList, setBeritaJemaatList] = useState<BeritaJemaat[]>(initialBeritaJemaatList);
  const [jadwalKatekisasiList, setJadwalKatekisasiList] = useState<JadwalKatekisasi[]>(initialJadwalKatekisasi);
  const [pengurusKategorialList, setPengurusKategorialList] = useState<PengurusKategorial[]>(initialPengurusKategorial);
  const [kegiatanKategorialList, setKegiatanKategorialList] = useState<KegiatanKategorial[]>(initialKegiatanKategorial);
  const [pengurusPembangunanList, setPengurusPembangunanList] = useState<PengurusPembangunan[]>(initialPengurusPembangunan);
  const [proyekPembangunanList, setProyekPembangunanList] = useState<ProyekPembangunan[]>(initialProyekPembangunan);
  const [materiPengajaranList, setMateriPengajaranList] = useState<MateriPengajaran[]>(initialMateriPengajaranList);
  const [katalogBukuList, setKatalogBukuList] = useState<KatalogBuku[]>(initialKatalogBukuList);
  const [peminjamanBukuList, setPeminjamanBukuList] = useState<PeminjamanBuku[]>(initialPeminjamanBukuList);
  const [sesiPemilihanList, setSesiPemilihanList] = useState<SesiPemilihan[]>(initialSesiPemilihanList);
  const [kandidatPemilihanList, setKandidatPemilihanList] = useState<KandidatPemilihan[]>(initialKandidatPemilihanList);
  const [suaraVotingList, setSuaraVotingList] = useState<SuaraVoting[]>(initialSuaraVotingList);
  const [nominasiAspirasiList, setNominasiAspirasiList] = useState<NominasiAspirasi[]>(initialNominasiAspirasiList);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(initialAuditLogs);

  // WhatsApp Bot States
  const [whatsAppBotConfig, setWhatsAppBotConfig] = useState<WhatsAppBotConfig>(initialWhatsAppBotConfig);
  const [whatsAppKeywordRules, setWhatsAppKeywordRules] = useState<WhatsAppKeywordRule[]>(initialWhatsAppKeywordRules);
  const [whatsAppBroadcasts, setWhatsAppBroadcasts] = useState<WhatsAppBroadcastMessage[]>(initialWhatsAppBroadcastMessages);
  const [whatsAppMessageLogs, setWhatsAppMessageLogs] = useState<WhatsAppMessageLog[]>(initialWhatsAppMessageLogs);
  const [whatsAppPrayerRequests, setWhatsAppPrayerRequests] = useState<WhatsAppPrayerRequest[]>(initialWhatsAppPrayerRequests);
  const [pelayananTaskList, setPelayananTaskList] = useState<PelayananTask[]>(initialPelayananTasks);
  const [laporanBugList, setLaporanBugList] = useState<LaporanBug[]>(initialLaporanBugList);
  const [almanakNastList, setAlmanakNastList] = useState<AlmanakNastGKE[]>(initialAlmanakNastList);

  const [isLoadingFirebase, setIsLoadingFirebase] = useState<boolean>(true);
  const [isSyncingCloud, setIsSyncingCloud] = useState<boolean>(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [inactivityNotice, setInactivityNotice] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

  // Global Toast Notifications State
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const clearToasts = () => {
    setToasts([]);
  };

  const showToastBase = (
    optionsOrMessage: ToastOptions | string,
    typeParam?: ToastType,
    durationParam?: number
  ): string => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    let item: ToastItem;

    if (typeof optionsOrMessage === 'string') {
      item = {
        id,
        type: typeParam || 'info',
        message: optionsOrMessage,
        duration: durationParam ?? 4000,
        createdAt: Date.now(),
      };
    } else {
      item = {
        id,
        type: optionsOrMessage.type || typeParam || 'info',
        title: optionsOrMessage.title,
        message: optionsOrMessage.message,
        duration: optionsOrMessage.duration ?? durationParam ?? 4000,
        action: optionsOrMessage.action,
        createdAt: Date.now(),
      };
    }

    setToasts((prev) => {
      // Keep up to 5 most recent toasts
      const filtered = prev.slice(-4);
      return [...filtered, item];
    });

    return id;
  };

  const showToast = Object.assign(showToastBase, {
    success: (message: string, titleOrDuration?: string | number, duration?: number) => {
      const title = typeof titleOrDuration === 'string' ? titleOrDuration : undefined;
      const dur = typeof titleOrDuration === 'number' ? titleOrDuration : duration;
      return showToastBase({ type: 'success', title, message, duration: dur });
    },
    error: (message: string, titleOrDuration?: string | number, duration?: number) => {
      const title = typeof titleOrDuration === 'string' ? titleOrDuration : undefined;
      const dur = typeof titleOrDuration === 'number' ? titleOrDuration : duration;
      return showToastBase({ type: 'error', title, message, duration: dur });
    },
    info: (message: string, titleOrDuration?: string | number, duration?: number) => {
      const title = typeof titleOrDuration === 'string' ? titleOrDuration : undefined;
      const dur = typeof titleOrDuration === 'number' ? titleOrDuration : duration;
      return showToastBase({ type: 'info', title, message, duration: dur });
    },
    warning: (message: string, titleOrDuration?: string | number, duration?: number) => {
      const title = typeof titleOrDuration === 'string' ? titleOrDuration : undefined;
      const dur = typeof titleOrDuration === 'number' ? titleOrDuration : duration;
      return showToastBase({ type: 'warning', title, message, duration: dur });
    },
  });

  // Theme (Dark / Light) States with LocalStorage & Cloud Settings Persistence
  const [themeAdmin, setThemeAdminState] = useState<'dark' | 'light'>(() => {
    try {
      const saved = localStorage.getItem('gke_admin_theme') || localStorage.getItem('gke_app_theme');
      if (saved === 'light' || saved === 'dark') return saved;
    } catch {
      // ignore
    }
    return settings?.defaultAdminTheme || 'dark';
  });

  const [themePortal, setThemePortalState] = useState<'dark' | 'light'>(() => {
    try {
      const saved = localStorage.getItem('gke_portal_theme');
      if (saved === 'light' || saved === 'dark') return saved;
    } catch {
      // ignore
    }
    return settings?.defaultPortalTheme || 'dark';
  });

  const setThemeAdmin = (newTheme: 'dark' | 'light') => {
    setThemeAdminState(newTheme);
    try {
      localStorage.setItem('gke_admin_theme', newTheme);
      localStorage.setItem('gke_app_theme', newTheme);
    } catch {
      // ignore
    }
  };

  const setThemePortal = (newTheme: 'dark' | 'light') => {
    setThemePortalState(newTheme);
    try {
      localStorage.setItem('gke_portal_theme', newTheme);
    } catch {
      // ignore
    }
  };

  const toggleThemeAdmin = () => {
    setThemeAdmin(themeAdmin === 'dark' ? 'light' : 'dark');
  };

  const toggleThemePortal = () => {
    setThemePortal(themePortal === 'dark' ? 'light' : 'dark');
  };

  // Sync with default settings if saved locally not found yet
  useEffect(() => {
    if (settings?.defaultAdminTheme && !localStorage.getItem('gke_admin_theme')) {
      setThemeAdminState(settings.defaultAdminTheme);
    }
    if (settings?.defaultPortalTheme && !localStorage.getItem('gke_portal_theme')) {
      setThemePortalState(settings.defaultPortalTheme);
    }
  }, [settings?.defaultAdminTheme, settings?.defaultPortalTheme]);

  // Network Connectivity State (Realtime Online / Offline Detection)
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    if (typeof navigator !== 'undefined' && typeof navigator.onLine === 'boolean') {
      return navigator.onLine;
    }
    return true;
  });
  const [isReconnecting, setIsReconnecting] = useState<boolean>(false);

  const checkConnection = async (): Promise<boolean> => {
    setIsReconnecting(true);
    try {
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        setIsOnline(false);
        setIsReconnecting(false);
        return false;
      }
      // Attempt lightweight ping with cache-busting
      const response = await fetch(`/metadata.json?t=${Date.now()}`, {
        method: 'HEAD',
        cache: 'no-store',
      });
      const reachable = response.ok || response.status < 500;
      setIsOnline(reachable);
      setIsReconnecting(false);
      return reachable;
    } catch {
      // If fetch fails completely, verify navigator.onLine
      const online = typeof navigator !== 'undefined' ? navigator.onLine : false;
      setIsOnline(online);
      setIsReconnecting(false);
      return online;
    }
  };

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Verify reachability
      checkConnection();
    };
    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check
    if (typeof navigator !== 'undefined') {
      setIsOnline(navigator.onLine);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Session Auth State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_is_auth`);
      return saved === 'true';
    } catch {
      return false;
    }
  });

  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_current_user`);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return null;
  });

  const [viewMode, setViewModeState] = useState<'admin' | 'public'>('admin');
  const [activeTab, setActiveTabState] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return resolveTabFromLocation();
    }
    return 'dashboard';
  });
  const [activePortalTab, setActivePortalTabState] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return resolvePortalTabFromLocation();
    }
    return 'beranda';
  });

  const setActiveTab = (tab: string) => {
    setActiveTabState(tab);
    updateBrowserUrl(tab, false);
  };

  const setActivePortalTab = (portalTab: string) => {
    setActivePortalTabState(portalTab);
    updatePortalBrowserUrl(portalTab, false);
  };

  // Sync URL cleanly on initial mount and handle browser Back/Forward (popstate & hashchange)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Initial URL sync from location
    const initialTab = resolveTabFromLocation();
    const initialPortalTab = resolvePortalTabFromLocation();

    setActiveTabState(initialTab);
    setActivePortalTabState(initialPortalTab);

    // If user is accessing via standard path or query params, keep URL clean
    updateBrowserUrl(initialTab, true);

    const handlePopState = () => {
      const currentTab = resolveTabFromLocation();
      const currentPortalTab = resolvePortalTabFromLocation();
      setActiveTabState(currentTab);
      setActivePortalTabState(currentPortalTab);
    };

    window.addEventListener('popstate', handlePopState);
    window.addEventListener('hashchange', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('hashchange', handlePopState);
    };
  }, []);

  const [printConfig, setPrintConfig] = useState<PrintConfig | null>(null);

  // Enforce viewMode restrictions based on role:
  // - Role 'warga' -> strictly public portal (tab MPH dinonaktifkan)
  // - Role 'admin' -> strictly admin panel (tab Warga Jemaat dinonaktifkan)
  const setViewMode = (mode: 'admin' | 'public') => {
    if (currentUser?.role === 'warga') {
      setViewModeState('public');
    } else if (currentUser?.role === 'admin') {
      setViewModeState('admin');
    } else {
      setViewModeState(mode);
    }
  };

  useEffect(() => {
    if (currentUser?.role === 'warga') {
      setViewModeState('public');
    } else if (currentUser?.role === 'admin') {
      setViewModeState('admin');
    }
  }, [currentUser?.role]);

  // Determine current effective theme based on active view mode (Warga Jemaat vs Admin Panel)
  const isViewingPortal = currentUser?.role === 'warga' || viewMode === 'public';
  const effectiveTheme: 'dark' | 'light' = isViewingPortal ? themePortal : themeAdmin;

  const setTheme = (newTheme: 'dark' | 'light') => {
    if (isViewingPortal) {
      setThemePortal(newTheme);
    } else {
      setThemeAdmin(newTheme);
    }
  };

  const toggleTheme = () => {
    if (isViewingPortal) {
      toggleThemePortal();
    } else {
      toggleThemeAdmin();
    }
  };

  // Synchronize document classes & data attributes strictly with current active screen
  useEffect(() => {
    const root = document.documentElement;
    if (effectiveTheme === 'light') {
      root.classList.add('theme-light', 'light');
      root.classList.remove('dark');
      document.body.classList.add('theme-light', 'light');
      document.body.classList.remove('dark');
    } else {
      root.classList.remove('theme-light', 'light');
      root.classList.add('dark');
      document.body.classList.remove('theme-light', 'light');
      document.body.classList.add('dark');
    }
    root.setAttribute('data-theme', effectiveTheme);
    root.setAttribute('data-view-mode', isViewingPortal ? 'portal' : 'admin');
  }, [effectiveTheme, isViewingPortal]);

  // -------------------------------------------------------------
  // FIRESTORE REALTIME SYNC & AUTO-SEED
  // -------------------------------------------------------------
  useEffect(() => {
    let loadedCount = 0;
    const totalCollections = 30;
    const checkLoaded = () => {
      loadedCount++;
      if (loadedCount >= totalCollections) {
        setIsLoadingFirebase(false);
      }
    };

    // Safety timeout: Ensure app finishes initial loading screen within 2.5s even if offline
    const fallbackLoadingTimer = setTimeout(() => {
      setIsLoadingFirebase(false);
    }, 2500);

    // 1. Settings Document
    const unsubSettings = onSnapshot(
      doc(db, 'settings', 'config'),
      async (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data() as AppSettings;
          if (data.loginBackgroundUrl && data.loginBackgroundUrl.includes('1548625361')) {
            data.loginBackgroundUrl = 'https://images.unsplash.com/photo-1543731068-7e0f5beff43a?auto=format&fit=crop&w=1920&q=80';
          }
          setSettings(data);
          try {
            localStorage.setItem(`${STORAGE_KEY}_settings`, JSON.stringify(data));
          } catch {
            // ignore
          }
        } else {
          // Check local storage before fallback seeding
          let settingsToSeed = initialSettings;
          try {
            const saved = localStorage.getItem(`${STORAGE_KEY}_settings`);
            if (saved) settingsToSeed = JSON.parse(saved);
          } catch {
            // ignore
          }
          try {
            await setDoc(doc(db, 'settings', 'config'), settingsToSeed);
          } catch (err) {
            handleFirestoreError(err, OperationType.WRITE, 'settings/config');
          }
        }
        checkLoaded();
      },
      (error) => handleFirestoreError(error, OperationType.GET, 'settings/config')
    );

    // Helper for syncing collections with auto-seed fallback
    const syncCollection = <T extends { id: string }>(
      collectionPath: string,
      initialData: T[],
      setter: React.Dispatch<React.SetStateAction<T[]>>
    ) => {
      return onSnapshot(
        collection(db, collectionPath),
        async (snapshot) => {
          const initFlagKey = `gke_initialized_v2_${collectionPath}`;
          const isCollectionInitialized = localStorage.getItem(initFlagKey);

          if (snapshot.empty) {
            const shouldSeed =
              initialData.length > 0 &&
              (!isCollectionInitialized || collectionPath === 'user_accounts');
            if (shouldSeed) {
              // Seed collection in batch only on first launch or if essential admin collection is empty
              localStorage.setItem(initFlagKey, 'true');
              try {
                const batch = writeBatch(db);
                initialData.forEach((item) => {
                  const docRef = doc(db, collectionPath, item.id);
                  batch.set(docRef, cleanForFirestore(item));
                });
                await batch.commit();
              } catch (err) {
                handleFirestoreError(err, OperationType.WRITE, collectionPath);
              }
            } else {
              // User deleted all items or dataset starts at zero
              localStorage.setItem(initFlagKey, 'true');
              setter([]);
            }
          } else {
            localStorage.setItem(initFlagKey, 'true');
            const seenIds = new Set<string>();
            const list: T[] = [];
            for (const docSnap of snapshot.docs) {
              if (!seenIds.has(docSnap.id)) {
                seenIds.add(docSnap.id);
                list.push({
                  id: docSnap.id,
                  ...docSnap.data(),
                } as T);
              }
            }

            // Ensure unique usernames and default admin presence
            let finalList = list;
            if (collectionPath === 'user_accounts') {
              const seenUsernames = new Map<string, any>();
              const deduped: any[] = [];
              const duplicateDocIdsToDelete: string[] = [];

              for (const u of list as any[]) {
                const cleanUName = (u.username || '').trim().toLowerCase().replace(/^@+/, '');
                if (!cleanUName) {
                  deduped.push(u);
                  continue;
                }

                if (seenUsernames.has(cleanUName)) {
                  const existing = seenUsernames.get(cleanUName);
                  // Prefer usr-admin or the one with admin role
                  if (u.id === 'usr-admin' && existing.id !== 'usr-admin') {
                    duplicateDocIdsToDelete.push(existing.id);
                    const idx = deduped.findIndex((item) => item.id === existing.id);
                    if (idx !== -1) deduped[idx] = u;
                    seenUsernames.set(cleanUName, u);
                  } else {
                    duplicateDocIdsToDelete.push(u.id);
                  }
                } else {
                  seenUsernames.set(cleanUName, u);
                  deduped.push(u);
                }
              }

              finalList = deduped as T[];

              // Clean duplicate documents from Firestore in the background
              duplicateDocIdsToDelete.forEach((dupId) => {
                try {
                  deleteDoc(doc(db, 'user_accounts', dupId));
                } catch (e) {
                  console.warn('Gagal membersihkan duplikat akun:', dupId, e);
                }
              });

              const adminUser = finalList.find((u: any) => u.id === 'usr-admin' || u.role === 'admin') as any;
              if (adminUser) {
                // Keep admin email synchronized with owner email AndrieG74@gmail.com if still on default or empty
                if (!adminUser.email || adminUser.email.toLowerCase() === 'admin@gke.org') {
                  adminUser.email = 'AndrieG74@gmail.com';
                  try {
                    const adminRef = doc(db, 'user_accounts', adminUser.id);
                    setDoc(adminRef, { email: 'AndrieG74@gmail.com' }, { merge: true });
                  } catch {
                    // non-blocking
                  }
                }
              } else if (initialUserAccounts.length > 0) {
                try {
                  const adminRef = doc(db, 'user_accounts', initialUserAccounts[0].id);
                  setDoc(adminRef, cleanForFirestore(initialUserAccounts[0]), { merge: true });
                } catch {
                  // non-blocking
                }
              }
            }

            setter(finalList);
          }
          checkLoaded();
        },
        (error) => {
          handleFirestoreError(error, OperationType.LIST, collectionPath);
          checkLoaded();
        }
      );
    };

    const unsubUsers = syncCollection('user_accounts', initialUserAccounts, setUserAccounts);
    const unsubPD = syncCollection('penatua_diakon', initialPenatuaDiakon, setPenatuaDiakonList);
    const unsubKeuangan = syncCollection('keuangan', initialKeuanganItems, setKeuanganList);
    const unsubIuran = syncCollection('iuran_kewajiban', initialIuranKewajibanList, setIuranKewajibanList);
    const unsubWarga = syncCollection('warga_jemaat', initialWargaJemaat, setWargaJemaatList);
    const unsubJadwal = syncCollection('jadwal_ibadah', initialJadwalIbadah, setJadwalIbadahList);
    const unsubMph = syncCollection('mph_jemaat', initialMPHMembers, setMphList);
    const unsubJabatan = syncCollection('jabatan_organisasi', initialJabatanOrganisasi, setJabatanList);
    const unsubInventaris = syncCollection('inventaris_aset', initialInventarisAset, setInventarisList);
    const unsubPemeliharaan = syncCollection('pemeliharaan_aset', initialPemeliharaanAset, setPemeliharaanAsetList);
    const unsubRenungan = syncCollection('renungan', initialRenunganItems, setRenunganList);
    const unsubPendaftaran = syncCollection('pendaftaran', initialPendaftaranAnggota, setPendaftaranList);
    const unsubKhotbah = syncCollection('rancangan_khotbah', initialRancanganKhotbah, setRancanganKhotbahList);
    const unsubLingkungan = syncCollection('lingkungan_jemaat', initialLingkunganList, setLingkunganList);
    const unsubSingerJemaat = syncCollection('singer_jemaat', initialSingerJemaatList, setSingerJemaatList);
    const unsubSurat = syncCollection('agenda_surat', initialAgendaSurat, setAgendaSuratList);
    const unsubSakramen = syncCollection('pelayanan_sakramen', initialPelayananSakramen, setPelayananSakramenList);
    const unsubBeritaJemaat = syncCollection('berita_jemaat', initialBeritaJemaatList, setBeritaJemaatList);
    const unsubKatekisasi = syncCollection('jadwal_katekisasi', initialJadwalKatekisasi, setJadwalKatekisasiList);
    const unsubPengurusKategorial = syncCollection('pengurus_kategorial', initialPengurusKategorial, setPengurusKategorialList);
    const unsubKegiatanKategorial = syncCollection('kegiatan_kategorial', initialKegiatanKategorial, setKegiatanKategorialList);
    const unsubPengurusPembangunan = syncCollection('pengurus_pembangunan', initialPengurusPembangunan, setPengurusPembangunanList);
    const unsubProyekPembangunan = syncCollection('proyek_pembangunan', initialProyekPembangunan, setProyekPembangunanList);
    const unsubMateriPengajaran = syncCollection('materi_pengajaran', initialMateriPengajaranList, setMateriPengajaranList);
    const unsubKatalogBuku = syncCollection('katalog_buku', initialKatalogBukuList, setKatalogBukuList);
    const unsubPeminjamanBuku = syncCollection('peminjaman_buku', initialPeminjamanBukuList, setPeminjamanBukuList);
    const unsubSesiPemilihan = syncCollection('sesi_pemilihan', initialSesiPemilihanList, setSesiPemilihanList);
    const unsubKandidatPemilihan = syncCollection('kandidat_pemilihan', initialKandidatPemilihanList, setKandidatPemilihanList);
    const unsubSuaraVoting = syncCollection('suara_voting', initialSuaraVotingList, setSuaraVotingList);
    const unsubNominasiAspirasi = syncCollection('nominasi_aspirasi', initialNominasiAspirasiList, setNominasiAspirasiList);
    const unsubAuditLogs = syncCollection('audit_logs', initialAuditLogs, setAuditLogs);
    const unsubWAKw = syncCollection('whatsapp_keywords', initialWhatsAppKeywordRules, setWhatsAppKeywordRules);
    const unsubWABroadcasts = syncCollection('whatsapp_broadcasts', initialWhatsAppBroadcastMessages, setWhatsAppBroadcasts);
    const unsubWALogs = syncCollection('whatsapp_message_logs', initialWhatsAppMessageLogs, setWhatsAppMessageLogs);
    const unsubWAPrayers = syncCollection('whatsapp_prayer_requests', initialWhatsAppPrayerRequests, setWhatsAppPrayerRequests);
    const unsubPelayananTasks = syncCollection('pelayanan_tasks', initialPelayananTasks, setPelayananTaskList);
    const unsubLaporanBug = syncCollection('laporan_bug', initialLaporanBugList, setLaporanBugList);
    const unsubAlmanak = syncCollection('almanak_nast_gke', initialAlmanakNastList, setAlmanakNastList);

    // WhatsApp Bot Config Document Sync
    const unsubWABotConfig = onSnapshot(
      doc(db, 'whatsapp_bot', 'config'),
      async (docSnap) => {
        if (docSnap.exists()) {
          setWhatsAppBotConfig(docSnap.data() as WhatsAppBotConfig);
        } else {
          try {
            await setDoc(doc(db, 'whatsapp_bot', 'config'), cleanForFirestore(initialWhatsAppBotConfig));
          } catch (err) {
            handleFirestoreError(err, OperationType.WRITE, 'whatsapp_bot/config');
          }
        }
        checkLoaded();
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, 'whatsapp_bot/config');
        checkLoaded();
      }
    );

    return () => {
      clearTimeout(fallbackLoadingTimer);
      unsubSettings();
      unsubUsers();
      unsubPD();
      unsubKeuangan();
      unsubWarga();
      unsubJadwal();
      unsubMph();
      unsubJabatan();
      unsubInventaris();
      unsubPemeliharaan();
      unsubRenungan();
      unsubPendaftaran();
      unsubKhotbah();
      unsubLingkungan();
      unsubSurat();
      unsubSakramen();
      unsubBeritaJemaat();
      unsubKatekisasi();
      unsubPengurusKategorial();
      unsubKegiatanKategorial();
      unsubPengurusPembangunan();
      unsubProyekPembangunan();
      unsubMateriPengajaran();
      unsubKatalogBuku();
      unsubPeminjamanBuku();
      unsubSesiPemilihan();
      unsubKandidatPemilihan();
      unsubSuaraVoting();
      unsubNominasiAspirasi();
      unsubAuditLogs();
      unsubWAKw();
      unsubWABroadcasts();
      unsubWALogs();
      unsubWAPrayers();
      unsubPelayananTasks();
      unsubLaporanBug();
      unsubAlmanak();
      unsubSingerJemaat();
      unsubWABotConfig();
    };
  }, []);

  // Continuous 24/7 Background Sync Effect: Auto-sync backend recorded offerings into Buku Kas Transparansi Keuangan
  useEffect(() => {
    const syncBackendRecordedOfferings = async () => {
      try {
        const res = await fetch('/api/persembahan/recorded');
        if (!res.ok) return;
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          data.data.forEach(async (recordedItem: any) => {
            if (!recordedItem || !recordedItem.noReferensi) return;
            // Check if already present in keuanganList by reference number
            const exists = keuanganList.some((k) => k.noReferensi === recordedItem.noReferensi);
            if (!exists) {
              try {
                await setDoc(doc(db, 'keuangan', recordedItem.id), recordedItem);
              } catch (err) {
                console.warn('Auto sync backend offering to Firestore error:', err);
              }
            }
          });
        }
      } catch {
        // Ignore fetch errors during dev/offline mode
      }
    };

    // Run immediately and every 5 seconds continuously (24/7 background sync)
    syncBackendRecordedOfferings();
    const interval = setInterval(syncBackendRecordedOfferings, 5000);
    return () => clearInterval(interval);
  }, [keuanganList]);

  // Deduplication Effect for Sakramen / Surat Keluar Agenda
  useEffect(() => {
    if (agendaSuratList.length === 0) return;
    const sakramenSurat = agendaSuratList.filter((s) => s.id.startsWith('srt-sakramen-'));
    if (sakramenSurat.length <= 1) return;

    const seenKeys = new Map<string, string>(); // key -> canonicalId
    const toDeleteIds: string[] = [];

    for (const surat of sakramenSurat) {
      const key = `${surat.noSurat || ''}_${surat.perihal || ''}`.trim();
      if (!key) continue;
      if (seenKeys.has(key)) {
        toDeleteIds.push(surat.id);
      } else {
        seenKeys.set(key, surat.id);
      }
    }

    if (toDeleteIds.length > 0) {
      toDeleteIds.forEach(async (dupId) => {
        try {
          await deleteDoc(doc(db, 'agenda_surat', dupId));
        } catch (e) {
          console.warn('Gagal menghapus duplikat agenda surat otomatis:', e);
        }
      });
      setAgendaSuratList((prev) => prev.filter((s) => !toDeleteIds.includes(s.id)));
    }
  }, [agendaSuratList]);

  // Auth Implementations
  const login = (username: string, password?: string) => {
    const cleanUsername = (username || '').trim().toLowerCase();
    const cleanPassword = (password || '').trim();

    // 1. Search in loaded user accounts (by username, full email, or email username prefix)
    let foundUser = userAccounts.find((u) => {
      const uUsername = (u.username || '').trim().toLowerCase();
      const uEmail = (u.email || '').trim().toLowerCase();
      return (
        uUsername === cleanUsername ||
        uEmail === cleanUsername ||
        (cleanUsername.includes('@') && uEmail.toLowerCase() === cleanUsername) ||
        (cleanUsername.includes('@') && uUsername === cleanUsername.split('@')[0])
      );
    });

    // 2. Fallbacks: check settings church email or default admin accounts / owner aliases
    if (!foundUser) {
      const churchEmail = (settings?.email || settings?.emailGereja || '').trim().toLowerCase();
      const isAdminEmailOrAlias =
        cleanUsername === 'admin' ||
        cleanUsername === 'admin@gke.org' ||
        cleanUsername === 'andrieg74@gmail.com' ||
        cleanUsername.includes('andrieg74') ||
        (Boolean(churchEmail) && churchEmail === cleanUsername);

      if (isAdminEmailOrAlias) {
        foundUser =
          userAccounts.find((u) => u.role === 'admin' && u.status !== 'nonaktif') ||
          userAccounts.find((u) => u.username === 'admin') ||
          initialUserAccounts.find((u) => u.username === 'admin');
      }
    }

    // 3. Fallback: Check Penatua & Diakon list by email or phone
    if (!foundUser) {
      const pd = penatuaDiakonList.find(
        (p) =>
          (p.email && p.email.trim().toLowerCase() === cleanUsername) ||
          (p.noHp && p.noHp.trim().replace(/[^0-9]/g, '') === cleanUsername.replace(/[^0-9]/g, ''))
      );
      if (pd) {
        foundUser = {
          id: pd.id || `usr-pd-${Date.now()}`,
          username: pd.email ? pd.email.split('@')[0] : pd.nama.toLowerCase().replace(/\s+/g, ''),
          namaLengkap: pd.nama,
          email: pd.email || `${cleanUsername}`,
          role: 'sekretaris',
          status: 'aktif',
          password: '123',
          jabatanGereja: pd.jabatan || 'Penatua / Diakon',
        };
      }
    }

    // 4. Fallback: Check Pengurus Kategorial list by email
    if (!foundUser) {
      const pk = pengurusKategorialList.find(
        (p) => p.email && p.email.trim().toLowerCase() === cleanUsername
      );
      if (pk) {
        foundUser = {
          id: pk.id || `usr-pk-${Date.now()}`,
          username: pk.email ? pk.email.split('@')[0] : pk.nama.toLowerCase().replace(/\s+/g, ''),
          namaLengkap: pk.nama,
          email: pk.email || `${cleanUsername}`,
          role: 'sekretaris',
          status: 'aktif',
          password: '123',
          jabatanGereja: pk.jabatan || 'Pengurus Kategorial',
        };
      }
    }

    // 5. Fallback: Check Warga Jemaat list by username or phone
    if (!foundUser) {
      const wj = wargaJemaatList.find(
        (w) =>
          (w.username && w.username.trim().toLowerCase() === cleanUsername) ||
          (w.noHp && w.noHp.trim().replace(/[^0-9]/g, '') === cleanUsername.replace(/[^0-9]/g, '')) ||
          (w.nik && w.nik.trim() === cleanUsername)
      );
      if (wj) {
        foundUser = {
          id: `usr-warga-${wj.id}`,
          username: wj.username || (wj.namaLengkap ? wj.namaLengkap.toLowerCase().replace(/\s+/g, '') : 'warga'),
          namaLengkap: wj.namaLengkap,
          email: `${cleanUsername}`,
          role: 'warga',
          status: 'aktif',
          password: wj.password || '123',
          jabatanGereja: 'Warga Jemaat',
        };
      }
    }

    if (!foundUser) {
      return {
        success: false,
        message: 'Username atau Email tidak ditemukan! Pastikan telah terdaftar di sistem.',
      };
    }

    if (foundUser.status === 'nonaktif') {
      return {
        success: false,
        message: 'Akun Anda dinonaktifkan oleh Administrator. Silakan hubungi pengurus.',
      };
    }

    // Determine expected password (defaults to 'admin' for admin role if unset, otherwise '123')
    const expectedPassword = (
      foundUser.password ||
      (foundUser.username === 'admin' || foundUser.role === 'admin' ? 'admin' : '123')
    ).trim();

    const isPasswordValid =
      cleanPassword === expectedPassword ||
      (foundUser.role === 'admin' && cleanPassword === 'admin') ||
      (Boolean(foundUser.password) && cleanPassword === foundUser.password.trim());

    if (expectedPassword && cleanPassword && !isPasswordValid) {
      return {
        success: false,
        message:
          foundUser.role === 'admin'
            ? 'Kata sandi / Password salah! Untuk akun Administrator, gunakan password bawaan: admin (atau password yang telah disimpan pada Manajemen Pengguna).'
            : 'Kata sandi / Password yang dimasukkan salah! Silakan periksa kembali password akun Anda.',
      };
    }

    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 16);
    const updatedUser = { ...foundUser, lastLogin: nowStr };

    setCurrentUser(updatedUser);
    setIsAuthenticated(true);
    setInactivityNotice(null);
    if (updatedUser.role === 'warga') {
      setViewMode('public');
    } else {
      setViewMode('admin');
    }

    updateUserAccount(updatedUser.id, { lastLogin: nowStr });

    safeSetLocalStorage(`${STORAGE_KEY}_is_auth`, 'true');
    safeSetLocalStorage(`${STORAGE_KEY}_current_user`, JSON.stringify(updatedUser));

    return { success: true };
  };

  const logout = () => {
    setIsAuthenticated(false);
    setCurrentUser(null);
    localStorage.removeItem(`${STORAGE_KEY}_is_auth`);
    localStorage.removeItem(`${STORAGE_KEY}_current_user`);
  };

  // Role switching
  const switchRole = (role: UserRole) => {
    const matchedUser = userAccounts.find((u) => u.role === role) || {
      id: `usr-${role}`,
      username: role,
      namaLengkap:
        role === 'admin'
          ? 'Administrator Majelis'
          : role === 'bendahara'
          ? 'Bendahara Jemaat'
          : role === 'sekretaris'
          ? 'Sekretaris Majelis'
          : 'Anggota Warga Jemaat',
      email: `${role}@gke-efata.org`,
      role: role,
      status: 'aktif',
    };

    setCurrentUser(matchedUser);
    setIsAuthenticated(true);
    if (role === 'warga') {
      setViewMode('public');
    } else {
      setViewMode('admin');
    }

    safeSetLocalStorage(`${STORAGE_KEY}_is_auth`, 'true');
    safeSetLocalStorage(`${STORAGE_KEY}_current_user`, JSON.stringify(matchedUser));
  };

  // -------------------------------------------------------------
  // FIRESTORE MUTATIONS (WRITE / UPDATE / DELETE)
  // -------------------------------------------------------------
  const syncOfficialsFromOrgData = async (
    force = false
  ): Promise<{ updated: Partial<AppSettings>; count: number }> => {
    try {
      const extracted = extractOfficialSignatoriesFromOrg(
        mphList,
        pengurusKategorialList,
        pengurusPembangunanList
      );
      const payload = buildSettingsPayloadFromSyncedOfficials(extracted);

      // Check which fields differ from current settings
      const diff: Partial<AppSettings> = {};
      let count = 0;

      (Object.keys(payload) as Array<keyof AppSettings>).forEach((key) => {
        const val = payload[key];
        const cur = settings[key];
        if (val && (force || !cur || cur !== val)) {
          (diff as Record<string, any>)[key] = val;
          count++;
        }
      });

      if (count > 0) {
        await updateSettings(diff);
      }

      return { updated: diff, count };
    } catch (err) {
      console.error('Error syncing officials from org data:', err);
      return { updated: {}, count: 0 };
    }
  };

  // Auto-sync effect: when MPH / Kategorial / Pembangunan lists change, auto-sync officials into settings
  useEffect(() => {
    if (
      (mphList.length > 0 || pengurusKategorialList.length > 0 || pengurusPembangunanList.length > 0) &&
      !isLoadingFirebase
    ) {
      syncOfficialsFromOrgData(false);
    }
  }, [mphList, pengurusKategorialList, pengurusPembangunanList, isLoadingFirebase]);

  const updateSettings = async (newSettings: Partial<AppSettings>): Promise<{ success: boolean; error?: string }> => {
    try {
      let finalSettings: AppSettings = { ...settings, ...newSettings };
      setSettings((prev) => {
        finalSettings = { ...prev, ...newSettings };
        return finalSettings;
      });

      // Update local storage safely, avoiding quota errors
      safeSetLocalStorage(`${STORAGE_KEY}_settings`, JSON.stringify(finalSettings));

      // Clean payload and save to Cloud Firestore (authoritative)
      const cleanData = cleanForFirestore(finalSettings);
      await setDoc(doc(db, 'settings', 'config'), cleanData);
      showToast.success('Pengaturan sistem berhasil disimpan!', 'Pengaturan Disimpan');
      return { success: true };
    } catch (err: any) {
      console.error('Error updating settings in Firestore:', err);
      handleFirestoreError(err, OperationType.UPDATE, 'settings/config');
      showToast.error(err?.message || 'Gagal menyimpan pengaturan ke Cloud', 'Gagal Simpan');
      return { success: false, error: err?.message || 'Gagal menyimpan pengaturan ke Cloud Firestore' };
    }
  };

  const recordBackupCloud = async (info: {
    type: 'full' | 'crucial' | 'custom';
    totalRecords: number;
    filename?: string;
    collectionCounts?: Record<string, number>;
  }): Promise<{ success: boolean; error?: string }> => {
    const nowStr = new Date().toISOString();
    const performedBy = currentUser?.namaLengkap || currentUser?.username || 'Administrator Majelis';

    const updatePayload: Partial<AppSettings> = {
      lastBackupTimestamp: nowStr,
      lastBackupType: info.type,
      lastBackupTotalRecords: info.totalRecords,
      lastBackupBy: performedBy,
      lastBackupFilename: info.filename,
    };

    if (info.type === 'crucial') {
      updatePayload.lastCrucialBackupTimestamp = nowStr;
      updatePayload.lastCrucialBackupTotalRecords = info.totalRecords;
      updatePayload.lastCrucialBackupBy = performedBy;
    }

    try {
      // 1. Update in settings (which triggers real-time Firestore sync to all connected devices)
      await updateSettings(updatePayload);

      // 2. Add audit log in Firestore
      await addAuditLog({
        kategori: 'SISTEM_BACKUP',
        aktivitas: info.type === 'crucial' ? 'SISTEM_BACKUP_KRUSIAL' : 'SISTEM_BACKUP',
        detail: `Pencadangan database ${info.type === 'crucial' ? 'Krusial' : info.type === 'full' ? 'Lengkap' : 'Kustom'} (${info.totalRecords} record) berhasil dicadangkan dan direkam ke Cloud Firestore`,
        pengguna: currentUser?.username || 'admin',
        role: currentUser?.role || 'admin',
        modulTerkait: 'Backup & Restore Database',
        level: 'INFO',
        status: 'BERHASIL',
      });

      // 3. Update localStorage fallback
      safeSetLocalStorage('gke_last_backup_timestamp', nowStr);
      if (info.type === 'crucial') {
        safeSetLocalStorage('gke_last_crucial_backup_timestamp', nowStr);
      }

      showToast.success(`Riwayat cadangan (${info.totalRecords} data) berhasil direkam!`, 'Backup Berhasil');
      return { success: true };
    } catch (err: any) {
      console.error('Failed to record backup to cloud:', err);
      showToast.error(err?.message || 'Gagal merekam riwayat backup', 'Backup Gagal');
      return { success: false, error: err?.message || 'Gagal menyimpan riwayat backup ke Cloud' };
    }
  };

  const addUserAccount = async (user: Omit<UserAccount, 'id'>) => {
    const rawUsername = (user.username || '').trim().toLowerCase().replace(/^@+/, '');
    if (!rawUsername) {
      showToast.error('Username tidak boleh kosong!', 'Error');
      return { success: false, error: 'Username tidak boleh kosong' };
    }

    const isDuplicate = userAccounts.some(
      (u) => (u.username || '').trim().toLowerCase().replace(/^@+/, '') === rawUsername
    );

    if (isDuplicate) {
      showToast.error(
        `Username "@${rawUsername}" sudah digunakan oleh akun lain! Mohon gunakan username yang berbeda agar tidak terjadi kesalahan saat login.`,
        'Username Duplikat'
      );
      return { success: false, error: 'Username sudah digunakan' };
    }

    const newItem: UserAccount = { ...user, username: rawUsername, id: `usr-${Date.now()}` };
    try {
      await setDoc(doc(db, 'user_accounts', newItem.id), cleanForFirestore(newItem));
      setUserAccounts((prev) => [...prev, newItem]);
      showToast.success(`Akun "${user.namaLengkap}" (@${rawUsername}) berhasil dibuat!`, 'Akun Baru');
      return { success: true };
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `user_accounts/${newItem.id}`);
      showToast.error('Gagal membuat akun pengguna baru', 'Error');
      return { success: false, error: 'Gagal membuat akun' };
    }
  };

  const updateUserAccount = async (id: string, user: Partial<UserAccount>) => {
    try {
      let dataToUpdate = { ...user };
      if (user.username) {
        const rawUsername = user.username.trim().toLowerCase().replace(/^@+/, '');
        const isDuplicate = userAccounts.some(
          (u) => u.id !== id && (u.username || '').trim().toLowerCase().replace(/^@+/, '') === rawUsername
        );
        if (isDuplicate) {
          showToast.error(
            `Username "@${rawUsername}" sudah digunakan oleh akun lain! Mohon gunakan username yang berbeda agar tidak terjadi kesalahan saat login.`,
            'Username Duplikat'
          );
          return { success: false, error: 'Username sudah digunakan' };
        }
        dataToUpdate.username = rawUsername;
      }

      const existingUser =
        userAccounts.find((u) => u.id === id) ||
        initialUserAccounts.find((u) => u.id === id);
      const dataToSave = existingUser ? { ...existingUser, ...dataToUpdate } : dataToUpdate;
      await setDoc(doc(db, 'user_accounts', id), cleanForFirestore(dataToSave), { merge: true });
      setUserAccounts((prev) => {
        const exists = prev.some((u) => u.id === id);
        if (exists) {
          return prev.map((u) => (u.id === id ? ({ ...u, ...dataToUpdate } as UserAccount) : u));
        }
        return [...prev, dataToSave as UserAccount];
      });
      const isJustLastLogin = Object.keys(user).length === 1 && 'lastLogin' in user;
      if (!isJustLastLogin) {
        showToast.success('Data akun pengguna berhasil diperbarui!', 'Akun Diperbarui');
      }
      return { success: true };
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `user_accounts/${id}`);
      showToast.error('Gagal memperbarui akun pengguna', 'Error');
      return { success: false, error: 'Gagal memperbarui akun' };
    }
  };

  const deleteUserAccount = async (id: string) => {
    try {
      setUserAccounts((prev) => prev.filter((u) => u.id !== id));
      await deleteDoc(doc(db, 'user_accounts', id));
      showToast.info('Akun pengguna telah dihapus.', 'Akun Dihapus');
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `user_accounts/${id}`);
      showToast.error('Gagal menghapus akun pengguna', 'Error');
    }
  };

  const addPenatuaDiakon = async (item: Omit<PenatuaDiakon, 'id'>) => {
    const newItem: PenatuaDiakon = { ...item, id: `pd-${Date.now()}` };
    try {
      await setDoc(doc(db, 'penatua_diakon', newItem.id), cleanForFirestore(newItem));
      showToast.success(`Data ${item.jabatan} "${item.nama}" berhasil disimpan!`, 'Pejabat Terdaftar');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `penatua_diakon/${newItem.id}`);
      showToast.error('Gagal menyimpan data Penatua / Diakon', 'Error');
    }
  };

  const updatePenatuaDiakon = async (id: string, item: Partial<PenatuaDiakon>) => {
    try {
      const existing = penatuaDiakonList.find((p) => p.id === id) || initialPenatuaDiakon.find((p) => p.id === id);
      const payload = existing ? { ...existing, ...item } : item;
      await setDoc(doc(db, 'penatua_diakon', id), cleanForFirestore(payload), { merge: true });
      setPenatuaDiakonList((prev) => prev.map((p) => (p.id === id ? ({ ...p, ...item } as PenatuaDiakon) : p)));
      showToast.success('Data Penatua / Diakon berhasil diperbarui!', 'Data Diperbarui');
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `penatua_diakon/${id}`);
      showToast.error('Gagal memperbarui data Penatua / Diakon', 'Error');
    }
  };

  const deletePenatuaDiakon = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'penatua_diakon', id));
      showToast.info('Data Penatua / Diakon telah dihapus.', 'Data Dihapus');
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `penatua_diakon/${id}`);
      showToast.error('Gagal menghapus data Penatua / Diakon', 'Error');
    }
  };

  const addKeuanganItem = async (item: Omit<KeuanganItem, 'id'>) => {
    if (item.noReferensi) {
      const existing = keuanganList.find((k) => k.noReferensi === item.noReferensi);
      if (existing) {
        console.warn(`[Cegah Pembukuan Ganda] Transaksi dengan No Referensi ${item.noReferensi} sudah tercatat di Buku Kas.`);
        showToast.warning(`Transaksi dengan No Referensi ${item.noReferensi} sudah tercatat di Buku Kas.`, 'Cegah Transaksi Ganda');
        return;
      }
    }
    const newItem: KeuanganItem = { ...item, id: `kas-${Date.now()}` };
    try {
      await setDoc(doc(db, 'keuangan', newItem.id), cleanForFirestore(newItem));
      showToast.success(`Transaksi ${item.jenis === 'pemasukan' ? 'pemasukan' : 'pengeluaran'} (${item.kategori}) berhasil dibukukan!`, 'Kas Tercatat');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `keuangan/${newItem.id}`);
      showToast.error('Gagal membukukan transaksi kas jemaat', 'Error');
    }
  };

  const updateKeuanganItem = async (id: string, item: Partial<KeuanganItem>) => {
    try {
      const existing = keuanganList.find((k) => k.id === id) || initialKeuanganItems.find((k) => k.id === id);
      const payload = existing ? { ...existing, ...item } : item;
      await setDoc(doc(db, 'keuangan', id), cleanForFirestore(payload), { merge: true });
      setKeuanganList((prev) => prev.map((k) => (k.id === id ? ({ ...k, ...item } as KeuanganItem) : k)));
      showToast.success('Transaksi kas jemaat berhasil diperbarui!', 'Kas Diperbarui');
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `keuangan/${id}`);
      showToast.error('Gagal memperbarui transaksi kas', 'Error');
    }
  };

  const deleteKeuanganItem = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'keuangan', id));
      showToast.info('Transaksi kas jemaat telah dihapus.', 'Kas Dihapus');
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `keuangan/${id}`);
      showToast.error('Gagal menghapus transaksi kas', 'Error');
    }
  };

  // -------------------------------------------------------------
  // IURAN KEWAJIBAN WARGA (JAN - DES) TERINTEGRASI KAS JEMAAT
  // -------------------------------------------------------------
  const namaBulanMap: Record<number, string> = {
    1: 'Januari', 2: 'Februari', 3: 'Maret', 4: 'April',
    5: 'Mei', 6: 'Juni', 7: 'Juli', 8: 'Agustus',
    9: 'September', 10: 'Oktober', 11: 'November', 12: 'Desember',
  };

  const addIuranKewajiban = async (item: Omit<IuranKewajiban, 'id'>): Promise<string> => {
    const docId = `ikw-${item.tahun}-${item.noKjj.replace(/[^A-Za-z0-9]/g, '_')}`;
    const newItem: IuranKewajiban = {
      ...item,
      id: docId,
      updatedAt: new Date().toISOString(),
    };
    try {
      setIuranKewajibanList((prev) => {
        const idx = prev.findIndex((x) => x.id === docId);
        if (idx >= 0) {
          const updated = [...prev];
          updated[idx] = newItem;
          return updated;
        }
        return [...prev, newItem];
      });
      await setDoc(doc(db, 'iuran_kewajiban', docId), cleanForFirestore(newItem));
      return docId;
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `iuran_kewajiban/${docId}`);
      return docId;
    }
  };

  const updateIuranKewajiban = async (id: string, item: Partial<IuranKewajiban>) => {
    try {
      const payload = { ...item, updatedAt: new Date().toISOString() };
      setIuranKewajibanList((prev) =>
        prev.map((x) => (x.id === id ? { ...x, ...payload } : x))
      );
      const existing = iuranKewajibanList.find((x) => x.id === id);
      const full = existing ? { ...existing, ...payload } : payload;
      await setDoc(doc(db, 'iuran_kewajiban', id), cleanForFirestore(full), { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `iuran_kewajiban/${id}`);
    }
  };

  const deleteIuranKewajiban = async (id: string) => {
    try {
      setIuranKewajibanList((prev) => prev.filter((x) => x.id !== id));
      await deleteDoc(doc(db, 'iuran_kewajiban', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `iuran_kewajiban/${id}`);
    }
  };

  const bayarIuranKewajiban = async (params: {
    noKjj: string;
    namaKepalaKeluarga: string;
    wargaId?: string;
    rayon: string;
    tahun: number;
    bulanList: number[];
    nominalPerBulan: number;
    tanggalBayar: string;
    metodePembayaran: string;
    posKasTujuan?: string;
    catatKeBukuKas?: boolean;
    petugasPenerima?: string;
    catatan?: string;
  }): Promise<{ success: boolean; iuranId: string; kasId?: string; noReferensi: string }> => {
    const {
      noKjj,
      namaKepalaKeluarga,
      wargaId,
      rayon,
      tahun,
      bulanList,
      nominalPerBulan,
      tanggalBayar,
      metodePembayaran,
      posKasTujuan = 'Kas Iuran Kewajiban',
      catatKeBukuKas = true,
      petugasPenerima = currentUser?.namaLengkap || 'Bendahara Jemaat',
      catatan = '',
    } = params;

    const cleanKjj = (noKjj || 'KJJ-UMUM').replace(/[^A-Za-z0-9]/g, '_');
    const docId = `ikw-${tahun}-${cleanKjj}`;
    const timestampSuffix = Date.now().toString().slice(-6);
    const noReferensi = `IKW-${tahun}-${cleanKjj.slice(0, 8)}-${timestampSuffix}`;
    const totalNominal = bulanList.length * nominalPerBulan;

    let newKasId: string | undefined = undefined;

    // 1. Catat ke Buku Kas Jemaat jika opsi aktif & totalNominal > 0
    if (catatKeBukuKas && totalNominal > 0) {
      newKasId = `kas-${Date.now()}`;
      const bulanNamaList = bulanList.sort((a, b) => a - b).map((b) => namaBulanMap[b] || `Bulan ${b}`);
      const newKasItem: KeuanganItem = {
        id: newKasId,
        tanggal: tanggalBayar || new Date().toISOString().split('T')[0],
        jenis: 'pemasukan',
        posKas: (posKasTujuan as any) || 'Kas Iuran Kewajiban',
        kategori: 'Iuran Kewajiban Warga',
        jumlah: totalNominal,
        masuk: totalNominal,
        keluar: 0,
        noReferensi: noReferensi,
        keterangan: `Pembayaran Iuran Kewajiban Warga Thn ${tahun} - ${namaKepalaKeluarga} (${noKjj}) - Bulan: ${bulanNamaList.join(', ')} [${metodePembayaran}]`,
        disetujuiOleh: petugasPenerima,
        status: 'disetujui',
      };

      try {
        setKeuanganList((prev) => [newKasItem, ...prev]);
        await setDoc(doc(db, 'keuangan', newKasId), cleanForFirestore(newKasItem));
      } catch (err) {
        console.error('Error auto-syncing Iuran to Buku Kas:', err);
      }
    }

    // 2. Cari atau inisialisasi record IuranKewajiban
    const existing = iuranKewajibanList.find((x) => x.id === docId || (x.tahun === tahun && x.noKjj === noKjj));
    const currentIuranBulanan: { [bulan: number]: IuranBulanDetail } = existing?.iuranBulanan
      ? { ...existing.iuranBulanan }
      : {};

    // Inisialisasi 12 bulan jika belum ada
    for (let m = 1; m <= 12; m++) {
      if (!currentIuranBulanan[m]) {
        currentIuranBulanan[m] = {
          lunas: false,
          nominal: nominalPerBulan,
        };
      }
    }

    // Update bulan-bulan terpilih
    bulanList.forEach((b) => {
      currentIuranBulanan[b] = {
        lunas: true,
        nominal: nominalPerBulan,
        tanggalBayar: tanggalBayar || new Date().toISOString().split('T')[0],
        metodePembayaran: metodePembayaran,
        noReferensiKas: noReferensi,
        idKas: newKasId,
        petugasPenerima: petugasPenerima,
        catatan: catatan,
      };
    });

    // Hitung total setoran & sisa tunggakan
    let totalSetor = 0;
    let lunasCount = 0;
    for (let m = 1; m <= 12; m++) {
      if (currentIuranBulanan[m]?.lunas) {
        totalSetor += currentIuranBulanan[m].nominal || nominalPerBulan;
        lunasCount++;
      }
    }

    const targetTahun = nominalPerBulan * 12;
    const sisaTunggakan = Math.max(0, targetTahun - totalSetor);
    const statusPembayaran: 'Lunas' | 'Sebagian' | 'Belum Bayar' =
      lunasCount === 12 ? 'Lunas' : lunasCount > 0 ? 'Sebagian' : 'Belum Bayar';

    const updatedIuran: IuranKewajiban = {
      id: docId,
      tahun: tahun,
      noKjj: noKjj,
      namaKepalaKeluarga: namaKepalaKeluarga,
      wargaId: wargaId || existing?.wargaId,
      rayon: rayon,
      nominalPerBulan: nominalPerBulan,
      iuranBulanan: currentIuranBulanan,
      totalSetorTahun: totalSetor,
      targetTahun: targetTahun,
      sisaTunggakan: sisaTunggakan,
      statusPembayaran: statusPembayaran,
      updatedAt: new Date().toISOString(),
    };

    try {
      setIuranKewajibanList((prev) => {
        const idx = prev.findIndex((x) => x.id === docId);
        if (idx >= 0) {
          const updated = [...prev];
          updated[idx] = updatedIuran;
          return updated;
        }
        return [updatedIuran, ...prev];
      });
      await setDoc(doc(db, 'iuran_kewajiban', docId), cleanForFirestore(updatedIuran));
      showToast.success(`Pembayaran iuran ${namaKepalaKeluarga} (${bulanList.length} Bulan) sukses dibukukan!`, 'Iuran Berhasil Disetor');
      return { success: true, iuranId: docId, kasId: newKasId, noReferensi };
    } catch (err: any) {
      handleFirestoreError(err, OperationType.WRITE, `iuran_kewajiban/${docId}`);
      showToast.error(err?.message || 'Gagal menyimpan pembayaran iuran', 'Error Iuran');
      return { success: false, iuranId: docId, kasId: newKasId, noReferensi };
    }
  };

  const batalBayarIuranKewajiban = async (iuranId: string, bulan: number) => {
    const existing = iuranKewajibanList.find((x) => x.id === iuranId);
    if (!existing || !existing.iuranBulanan || !existing.iuranBulanan[bulan]) return;

    const bulanDetail = existing.iuranBulanan[bulan];
    const linkedKasId = bulanDetail.idKas;

    const newBulanan = { ...existing.iuranBulanan };
    newBulanan[bulan] = {
      lunas: false,
      nominal: existing.nominalPerBulan,
      tanggalBayar: undefined,
      metodePembayaran: undefined,
      noReferensiKas: undefined,
      idKas: undefined,
      petugasPenerima: undefined,
      catatan: undefined,
    };

    let totalSetor = 0;
    let lunasCount = 0;
    for (let m = 1; m <= 12; m++) {
      if (newBulanan[m]?.lunas) {
        totalSetor += newBulanan[m].nominal || existing.nominalPerBulan;
        lunasCount++;
      }
    }

    const targetTahun = existing.nominalPerBulan * 12;
    const sisaTunggakan = Math.max(0, targetTahun - totalSetor);
    const statusPembayaran: 'Lunas' | 'Sebagian' | 'Belum Bayar' =
      lunasCount === 12 ? 'Lunas' : lunasCount > 0 ? 'Sebagian' : 'Belum Bayar';

    const payload: Partial<IuranKewajiban> = {
      iuranBulanan: newBulanan,
      totalSetorTahun: totalSetor,
      sisaTunggakan: sisaTunggakan,
      statusPembayaran: statusPembayaran,
      updatedAt: new Date().toISOString(),
    };

    try {
      setIuranKewajibanList((prev) =>
        prev.map((x) => (x.id === iuranId ? { ...x, ...payload } : x))
      );
      await setDoc(doc(db, 'iuran_kewajiban', iuranId), cleanForFirestore(payload), { merge: true });

      // Jika ada transaksi kas terkait dan hanya berlaku untuk bulan ini, hapus dari buku kas
      if (linkedKasId) {
        // Cek apakah ada bulan lain di record yang sama masih menggunakan kasId ini
        const stillUsedInOtherMonth = Object.entries(newBulanan).some(
          ([mStr, det]: [string, any]) => parseInt(mStr, 10) !== bulan && det?.idKas === linkedKasId && Boolean(det?.lunas)
        );
        if (!stillUsedInOtherMonth) {
          try {
            setKeuanganList((prev) => prev.filter((k) => k.id !== linkedKasId));
            await deleteDoc(doc(db, 'keuangan', linkedKasId));
          } catch (err) {
            console.error('Error removing linked Buku Kas entry:', err);
          }
        }
      }
      showToast.info('Pembayaran iuran bulan tersebut berhasil dibatalkan.', 'Iuran Dibatalkan');
    } catch (err: any) {
      handleFirestoreError(err, OperationType.UPDATE, `iuran_kewajiban/${iuranId}`);
      showToast.error(err?.message || 'Gagal membatalkan iuran', 'Error Iuran');
    }
  };

  const addWargaJemaat = async (item: Omit<WargaJemaat, 'id'>) => {
    const newItem: WargaJemaat = {
      ...item,
      id: `wj-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    };
    try {
      setWargaJemaatList((prev) => [...prev, newItem]);
      await setDoc(doc(db, 'warga_jemaat', newItem.id), cleanForFirestore(newItem));
      showToast.success(`Data warga jemaat "${item.namaLengkap}" berhasil didaftarkan!`, 'Warga Baru Terdaftar');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `warga_jemaat/${newItem.id}`);
      showToast.error('Gagal mendaftarkan data warga jemaat', 'Error');
    }
  };

  const updateWargaJemaat = async (id: string, item: Partial<WargaJemaat>) => {
    try {
      const existing = wargaJemaatList.find((w) => w.id === id) || initialWargaJemaat.find((w) => w.id === id);
      const payload = existing ? { ...existing, ...item } : item;
      setWargaJemaatList((prev) =>
        prev.map((w) => (w.id === id ? { ...w, ...item } : w))
      );
      await setDoc(doc(db, 'warga_jemaat', id), cleanForFirestore(payload), { merge: true });
      showToast.success(`Data warga jemaat "${item.namaLengkap || 'Jemaat'}" berhasil diperbarui!`, 'Data Diperbarui');
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `warga_jemaat/${id}`);
      showToast.error('Gagal memperbarui data warga jemaat', 'Error');
    }
  };

  const deleteWargaJemaat = async (id: string) => {
    try {
      const targetWarga = wargaJemaatList.find((w) => w.id === id);

      // Instant local state update for Warga Jemaat
      setWargaJemaatList((prev) => prev.filter((w) => w.id !== id));

      // 1. Delete Warga Jemaat record in Firestore
      await deleteDoc(doc(db, 'warga_jemaat', id));

      if (targetWarga) {
        // 2. Automatically delete associated Pendaftaran Anggota Jemaat Baru
        const matchingPendaftaran = pendaftaranList.filter((p) => {
          if (p.id === targetWarga.id) return true;
          if (targetWarga.nik && p.nik && p.nik === targetWarga.nik) return true;
          if (targetWarga.noKjj && p.noKjj && p.noKjj.toLowerCase() === targetWarga.noKjj.toLowerCase()) return true;
          if (targetWarga.username && p.username && p.username.toLowerCase() === targetWarga.username.toLowerCase()) return true;
          if (targetWarga.namaLengkap && p.namaLengkap && p.namaLengkap.toLowerCase().trim() === targetWarga.namaLengkap.toLowerCase().trim()) return true;
          return false;
        });

        const matchingPendaftaranIds = new Set(matchingPendaftaran.map((p) => p.id));
        if (matchingPendaftaranIds.size > 0) {
          // Instant local state update for Pendaftaran List
          setPendaftaranList((prev) => prev.filter((p) => !matchingPendaftaranIds.has(p.id)));

          for (const pItem of matchingPendaftaran) {
            try {
              await deleteDoc(doc(db, 'pendaftaran', pItem.id));
            } catch (err) {
              console.error(`Failed to delete associated pendaftaran record ${pItem.id}:`, err);
            }
          }
        }

        // 3. Automatically delete associated user account & access rights (e.g. from pendaftaran mandiri or registered member)
        const targetCleanUsername = (targetWarga.username || '').trim().toLowerCase().replace(/^@+/, '');
        const targetCleanNoKjj = (targetWarga.noKjj || '').trim().toLowerCase();
        const targetCleanNik = (targetWarga.nik || '').trim();
        const targetCleanNama = (targetWarga.namaLengkap || '').trim().toLowerCase();

        const matchingUsers = userAccounts.filter((u) => {
          // Safety guard: NEVER delete primary administrator accounts
          if (u.id === 'usr-admin' || (u.role === 'admin' && (u.username || '').toLowerCase() === 'admin')) {
            return false;
          }
          if (u.id === targetWarga.id) return true;
          if (u.wargaId === targetWarga.id) return true;
          if (matchingPendaftaranIds.size > 0 && u.pendaftaranId && matchingPendaftaranIds.has(u.pendaftaranId)) return true;

          const uCleanUser = (u.username || '').trim().toLowerCase().replace(/^@+/, '');
          const uCleanNoKjj = (u.noKjj || '').trim().toLowerCase();
          const uCleanNik = (u.nik || '').trim();
          const uCleanNama = (u.namaLengkap || '').trim().toLowerCase();

          if (targetCleanNik && uCleanNik && uCleanNik === targetCleanNik) return true;
          if (targetCleanNik && uCleanUser && uCleanUser === targetCleanNik) return true;
          if (targetCleanUsername && uCleanUser && uCleanUser === targetCleanUsername) return true;
          if (targetCleanNama && uCleanNama && uCleanNama === targetCleanNama) return true;

          if (u.role === 'warga' || u.source === 'pendaftaran_mandiri') {
            if (targetCleanNoKjj && uCleanNoKjj && uCleanNoKjj === targetCleanNoKjj) return true;
            if (targetCleanNoKjj && uCleanUser && uCleanUser === targetCleanNoKjj) return true;
          }
          return false;
        });

        const matchingUserIds = new Set(matchingUsers.map((u) => u.id));

        if (matchingUserIds.size > 0) {
          // Instant local state update for User Accounts
          setUserAccounts((prev) => prev.filter((u) => !matchingUserIds.has(u.id)));

          for (const user of matchingUsers) {
            try {
              await deleteDoc(doc(db, 'user_accounts', user.id));
            } catch (err) {
              console.error(`Failed to delete associated user account ${user.id}:`, err);
            }
          }
        }
      }
      showToast.info('Data warga jemaat telah dihapus dari sistem.', 'Data Dihapus');
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `warga_jemaat/${id}`);
      showToast.error('Gagal menghapus data warga jemaat', 'Error');
    }
  };

  const deleteMultipleWargaJemaat = async (
    ids: string[],
    options?: { noKjj?: string }
  ): Promise<{ count: number }> => {
    if ((!ids || ids.length === 0) && !options?.noKjj) return { count: 0 };
    const idSet = new Set(ids || []);
    const targetWargas = wargaJemaatList.filter((w) => idSet.has(w.id));

    // Instant local state update for Warga Jemaat
    if (ids && ids.length > 0) {
      setWargaJemaatList((prev) => prev.filter((w) => !idSet.has(w.id)));
    }

    try {
      const chunkSize = 400;
      if (ids && ids.length > 0) {
        // Chunk into batches of 400 for Firestore limit safety
        for (let i = 0; i < ids.length; i += chunkSize) {
          const chunk = ids.slice(i, i + chunkSize);
          const batch = writeBatch(db);
          chunk.forEach((wId) => {
            batch.delete(doc(db, 'warga_jemaat', wId));
          });
          await batch.commit();
        }
      }

      // 1. Collect all family identifiers (KKJ, NIK, Username, Name)
      const familyNoKjjs = new Set<string>();
      const familyNiks = new Set<string>();
      const familyUsernames = new Set<string>();
      const familyNames = new Set<string>();

      if (options?.noKjj) {
        familyNoKjjs.add(options.noKjj.trim().toLowerCase());
      }

      targetWargas.forEach((tw) => {
        if (tw.noKjj) familyNoKjjs.add(tw.noKjj.trim().toLowerCase());
        if (tw.nik) familyNiks.add(tw.nik.trim());
        if (tw.username) familyUsernames.add(tw.username.trim().toLowerCase().replace(/^@+/, ''));
        if (tw.namaLengkap) familyNames.add(tw.namaLengkap.trim().toLowerCase());
      });

      // 2. Cleanup associated pendaftaran if any
      const matchingPendaftaran = pendaftaranList.filter((p) => {
        if (idSet.has(p.id)) return true;
        if (p.nik && familyNiks.has(p.nik.trim())) return true;
        if (p.noKjj && familyNoKjjs.has(p.noKjj.trim().toLowerCase())) return true;
        if (p.username && familyUsernames.has(p.username.trim().toLowerCase().replace(/^@+/, ''))) return true;
        if (p.namaLengkap && familyNames.has(p.namaLengkap.trim().toLowerCase())) return true;
        return false;
      });

      const matchPendaftaranIds = new Set(matchingPendaftaran.map((p) => p.id));
      matchingPendaftaran.forEach((p) => {
        if (p.noKjj) familyNoKjjs.add(p.noKjj.trim().toLowerCase());
        if (p.nik) familyNiks.add(p.nik.trim());
        if (p.username) familyUsernames.add(p.username.trim().toLowerCase().replace(/^@+/, ''));
        if (p.namaLengkap) familyNames.add(p.namaLengkap.trim().toLowerCase());
      });

      if (matchingPendaftaran.length > 0) {
        setPendaftaranList((prev) => prev.filter((p) => !matchPendaftaranIds.has(p.id)));
        for (let i = 0; i < matchingPendaftaran.length; i += chunkSize) {
          const chunk = matchingPendaftaran.slice(i, i + chunkSize);
          const pBatch = writeBatch(db);
          chunk.forEach((p) => {
            pBatch.delete(doc(db, 'pendaftaran', p.id));
          });
          await pBatch.commit();
        }
      }

      // 3. Automatically delete all UserAccounts issued for this family or via pendaftaran mandiri
      const matchingUsers = userAccounts.filter((u) => {
        // Safety guard: Protect primary admin accounts from deletion
        if (u.id === 'usr-admin' || (u.role === 'admin' && (u.username || '').toLowerCase() === 'admin')) {
          return false;
        }

        const uCleanUser = (u.username || '').trim().toLowerCase().replace(/^@+/, '');
        const uCleanNoKjj = (u.noKjj || '').trim().toLowerCase();
        const uCleanNik = (u.nik || '').trim();
        const uCleanNama = (u.namaLengkap || '').trim().toLowerCase();

        // Direct matching by ID, wargaId, or pendaftaranId
        if (idSet.has(u.id)) return true;
        if (u.wargaId && idSet.has(u.wargaId)) return true;
        if (u.pendaftaranId && matchPendaftaranIds.has(u.pendaftaranId)) return true;

        // Direct matching by family No KKJ
        if (uCleanNoKjj && familyNoKjjs.has(uCleanNoKjj)) return true;

        // Direct matching by NIK
        if (uCleanNik && familyNiks.has(uCleanNik)) return true;

        // Accounts issued through self registration or role 'warga' matching family identifiers
        if (u.source === 'pendaftaran_mandiri' || u.role === 'warga') {
          if (familyUsernames.has(uCleanUser)) return true;
          if (familyNoKjjs.has(uCleanUser)) return true;
          if (familyNiks.has(uCleanUser)) return true;
          if (familyNames.has(uCleanNama)) return true;
        }

        return false;
      });

      if (matchingUsers.length > 0) {
        const matchUserIds = new Set(matchingUsers.map((u) => u.id));
        setUserAccounts((prev) => prev.filter((u) => !matchUserIds.has(u.id)));
        for (let i = 0; i < matchingUsers.length; i += chunkSize) {
          const chunk = matchingUsers.slice(i, i + chunkSize);
          const uBatch = writeBatch(db);
          chunk.forEach((u) => {
            uBatch.delete(doc(db, 'user_accounts', u.id));
          });
          await uBatch.commit();
        }
      }

      showToast.success(
        `Berhasil menghapus data keluarga jemaat${matchingUsers.length > 0 ? ` serta ${matchingUsers.length} akun login terkait` : ''}.`,
        'Data Keluarga Dihapus'
      );
      return { count: ids.length };
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, 'warga_jemaat/bulk');
      showToast.error('Gagal menghapus sebagian data keluarga jemaat', 'Error');
      return { count: 0 };
    }
  };

  const clearAllWargaJemaat = async (options?: { rayon?: string }): Promise<{ count: number }> => {
    let targets = wargaJemaatList;
    if (options?.rayon && options.rayon !== 'Semua Lingkungan' && options.rayon.trim() !== '') {
      targets = targets.filter((w) => w.rayon === options.rayon);
    }
    const ids = targets.map((w) => w.id);
    return await deleteMultipleWargaJemaat(ids);
  };

  const deleteKeluargaByKjj = async (noKjj: string): Promise<{ count: number }> => {
    if (!noKjj) return { count: 0 };
    const cleanKjj = noKjj.trim().toLowerCase();
    const targets = wargaJemaatList.filter(
      (w) => w.noKjj && w.noKjj.trim().toLowerCase() === cleanKjj
    );
    const ids = targets.map((w) => w.id);
    return await deleteMultipleWargaJemaat(ids, { noKjj });
  };

  const addJadwalIbadah = async (item: Omit<JadwalIbadah, 'id'>): Promise<string> => {
    const id = `ji-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const newItem: JadwalIbadah = { ...item, id };
    try {
      await setDoc(doc(db, 'jadwal_ibadah', newItem.id), cleanForFirestore(newItem));
      showToast.success('Jadwal ibadah jemaat berhasil ditambahkan!', 'Jadwal Ditambahkan');
      return id;
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `jadwal_ibadah/${newItem.id}`);
      showToast.error('Gagal menambahkan jadwal ibadah', 'Error');
      return id;
    }
  };

  const batchAddJadwalIbadah = async (
    items: Omit<JadwalIbadah, 'id'>[],
    options?: { replaceExistingDates?: boolean }
  ): Promise<number> => {
    if (!items || items.length === 0) return 0;
    try {
      const chunkSize = 400;
      let totalSaved = 0;
      const allCreatedItems: JadwalIbadah[] = [];
      const newDates = new Set(items.map((i) => i.tanggal).filter(Boolean));

      // If replacing existing dates, find IDs of old items with matching dates to remove
      const docsToDelete: string[] = [];
      if (options?.replaceExistingDates) {
        jadwalIbadahList.forEach((j) => {
          if (j.tanggal && newDates.has(j.tanggal)) {
            docsToDelete.push(j.id);
          }
        });
      }

      for (let i = 0; i < items.length; i += chunkSize) {
        const chunk = items.slice(i, i + chunkSize);
        const batch = writeBatch(db);

        // Delete old items on the first chunk
        if (i === 0 && docsToDelete.length > 0) {
          docsToDelete.forEach((oldId) => {
            batch.delete(doc(db, 'jadwal_ibadah', oldId));
          });
        }

        chunk.forEach((item, index) => {
          const id = `ji-${Date.now()}-${i + index}-${Math.random().toString(36).substring(2, 7)}`;
          const newItem: JadwalIbadah = { ...item, id };
          allCreatedItems.push(newItem);
          const docRef = doc(db, 'jadwal_ibadah', newItem.id);
          batch.set(docRef, cleanForFirestore(newItem));
          totalSaved++;
        });
        await batch.commit();
      }

      // Optimistic instant state update in React
      setJadwalIbadahList((prev) => {
        const kept = options?.replaceExistingDates
          ? prev.filter((p) => !newDates.has(p.tanggal))
          : prev;
        const existingIds = new Set(kept.map((p) => p.id));
        const filteredNew = allCreatedItems.filter((p) => !existingIds.has(p.id));
        return [...filteredNew, ...kept];
      });

      showToast.success(`Berhasil menyimpan ${totalSaved} jadwal ibadah baru ke database!`, 'Penyimpanan Massal Sukses');
      return totalSaved;
    } catch (err) {
      console.error('Firestore batchAddJadwalIbadah error:', err);
      // Fallback: update local state so user work is preserved
      const fallbackItems: JadwalIbadah[] = items.map((item, index) => ({
        ...item,
        id: `ji-local-${Date.now()}-${index}-${Math.random().toString(36).substring(2, 7)}`,
      }));
      const newDates = new Set(items.map((i) => i.tanggal).filter(Boolean));
      setJadwalIbadahList((prev) => {
        const kept = options?.replaceExistingDates
          ? prev.filter((p) => !newDates.has(p.tanggal))
          : prev;
        return [...fallbackItems, ...kept];
      });
      showToast.success(`Berhasil menyimpan ${fallbackItems.length} jadwal ibadah baru ke daftar!`, 'Tersimpan');
      return fallbackItems.length;
    }
  };

  const updateJadwalIbadah = async (id: string, item: Partial<JadwalIbadah>) => {
    try {
      await setDoc(doc(db, 'jadwal_ibadah', id), cleanForFirestore(item), { merge: true });
      showToast.success('Jadwal ibadah jemaat berhasil diperbarui!', 'Jadwal Diperbarui');
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `jadwal_ibadah/${id}`);
      showToast.error('Gagal memperbarui jadwal ibadah', 'Error');
    }
  };

  const deleteJadwalIbadah = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'jadwal_ibadah', id));
      showToast.info('Jadwal ibadah jemaat telah dihapus.', 'Jadwal Dihapus');
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `jadwal_ibadah/${id}`);
      showToast.error('Gagal menghapus jadwal ibadah', 'Error');
    }
  };

  const addMPHMember = async (item: Omit<MPHMember, 'id'>) => {
    const newItem: MPHMember = { ...item, id: `mph-${Date.now()}` };
    try {
      await setDoc(doc(db, 'mph_jemaat', newItem.id), cleanForFirestore(newItem));
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `mph_jemaat/${newItem.id}`);
    }
  };

  const updateMPHMember = async (id: string, item: Partial<MPHMember>) => {
    try {
      await setDoc(doc(db, 'mph_jemaat', id), cleanForFirestore(item), { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `mph_jemaat/${id}`);
    }
  };

  const deleteMPHMember = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'mph_jemaat', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `mph_jemaat/${id}`);
    }
  };

  // Jabatan Struktural & Kategorial
  const addJabatan = async (item: Omit<JabatanOrganisasi, 'id'>) => {
    const id = `jab-${Date.now()}`;
    const newItem: JabatanOrganisasi = {
      ...item,
      id,
      tanggalDitambahkan: new Date().toISOString(),
      aktif: item.aktif !== undefined ? item.aktif : true,
    };
    setJabatanList((prev) => [...prev, newItem]);
    try {
      await setDoc(doc(db, 'jabatan_organisasi', id), cleanForFirestore(newItem));
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'jabatan_organisasi');
    }
  };

  const updateJabatan = async (id: string, item: Partial<JabatanOrganisasi>) => {
    setJabatanList((prev) =>
      prev.map((j) => (j.id === id ? { ...j, ...item } : j))
    );
    try {
      await updateDoc(doc(db, 'jabatan_organisasi', id), cleanForFirestore(item));
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `jabatan_organisasi/${id}`);
    }
  };

  const deleteJabatan = async (id: string) => {
    setJabatanList((prev) => prev.filter((j) => j.id !== id));
    try {
      await deleteDoc(doc(db, 'jabatan_organisasi', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `jabatan_organisasi/${id}`);
    }
  };

  const resetJabatanToDefault = async () => {
    try {
      const snap = await getDocs(collection(db, 'jabatan_organisasi'));
      const batch = writeBatch(db);
      snap.docs.forEach((d) => {
        batch.delete(d.ref);
      });
      initialJabatanOrganisasi.forEach((item) => {
        const docRef = doc(db, 'jabatan_organisasi', item.id);
        batch.set(docRef, cleanForFirestore(item));
      });
      await batch.commit();
      setJabatanList(initialJabatanOrganisasi);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'jabatan_organisasi');
    }
  };

  const addInventarisAset = async (item: Omit<InventarisAset, 'id'>) => {
    const newItem: InventarisAset = { ...item, id: `ast-${Date.now()}` };
    try {
      await setDoc(doc(db, 'inventaris_aset', newItem.id), cleanForFirestore(newItem));
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `inventaris_aset/${newItem.id}`);
    }
  };

  const updateInventarisAset = async (id: string, item: Partial<InventarisAset>) => {
    try {
      await updateDoc(doc(db, 'inventaris_aset', id), cleanForFirestore(item));
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `inventaris_aset/${id}`);
    }
  };

  const deleteInventarisAset = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'inventaris_aset', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `inventaris_aset/${id}`);
    }
  };

  // -------------------------------------------------------------
  // PENJADWALAN PEMELIHARAAN & SERVIS ASET GEREJA
  // -------------------------------------------------------------
  const addPemeliharaanAset = async (item: Omit<PemeliharaanAset, 'id'>): Promise<string> => {
    const id = `mnt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const nowStr = new Date().toISOString();
    const newItem: PemeliharaanAset = {
      ...item,
      id,
      createdAt: nowStr,
      updatedAt: nowStr,
    };
    try {
      await setDoc(doc(db, 'pemeliharaan_aset', id), cleanForFirestore(newItem));
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `pemeliharaan_aset/${id}`);
      setPemeliharaanAsetList((prev) => [newItem, ...prev]);
    }

    if (item.asetId) {
      updateInventarisAset(item.asetId, {
        tanggalServisBerikutnya: item.tanggalJatuhTempo,
        statusPemeliharaan: item.tingkatPrioritas === 'Darurat' ? 'Dalam Perbaikan' : 'Perlu Servis',
      });
    }

    addAuditLog({
      kategori: 'INVENTARIS',
      aktivitas: 'TAMBAH_JADWAL_PEMELIHARAAN',
      detail: `Jadwal pemeliharaan aset "${newItem.namaBarang}" (${newItem.jenisPemeliharaan}) berhasil dibuat. Jatuh tempo: ${newItem.tanggalJatuhTempo}`,
      pengguna: currentUser?.namaLengkap || 'Petugas Aset',
      role: currentUser?.role || 'admin',
    });

    return id;
  };

  const updatePemeliharaanAset = async (id: string, item: Partial<PemeliharaanAset>) => {
    const updated = {
      ...item,
      updatedAt: new Date().toISOString(),
    };
    try {
      await updateDoc(doc(db, 'pemeliharaan_aset', id), cleanForFirestore(updated));
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `pemeliharaan_aset/${id}`);
      setPemeliharaanAsetList((prev) => prev.map((p) => (p.id === id ? { ...p, ...updated } : p)));
    }
  };

  const deletePemeliharaanAset = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'pemeliharaan_aset', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `pemeliharaan_aset/${id}`);
      setPemeliharaanAsetList((prev) => prev.filter((p) => p.id !== id));
    }
  };

  const completePemeliharaanAset = async (
    id: string,
    completionData: {
      tanggalSelesai: string;
      biayaRealisasi?: number;
      tindakanPerbaikan?: string;
      kondisiAsetSetelahServis?: 'Baik' | 'Rusak Ringan' | 'Rusak Berat';
      keterangan?: string;
      buatJadwalBerikutnya?: boolean;
      siklusBulanBerikutnya?: number;
    }
  ) => {
    const existing = pemeliharaanAsetList.find((p) => p.id === id);
    const updatedData: Partial<PemeliharaanAset> = {
      status: 'Selesai',
      tanggalSelesai: completionData.tanggalSelesai,
      biayaRealisasi: completionData.biayaRealisasi ?? existing?.biayaEstimasi ?? 0,
      tindakanPerbaikan: completionData.tindakanPerbaikan,
      kondisiAsetSetelahServis: completionData.kondisiAsetSetelahServis || 'Baik',
      keterangan: completionData.keterangan || existing?.keterangan,
      updatedAt: new Date().toISOString(),
    };

    await updatePemeliharaanAset(id, updatedData);

    if (existing?.asetId) {
      const assetUpdate: Partial<InventarisAset> = {
        kondisi: completionData.kondisiAsetSetelahServis || 'Baik',
        tanggalServisTerakhir: completionData.tanggalSelesai,
        statusPemeliharaan: 'Normal',
      };

      if (completionData.buatJadwalBerikutnya && (completionData.siklusBulanBerikutnya || existing.siklusBulan)) {
        const cycleMonths = completionData.siklusBulanBerikutnya || existing.siklusBulan || 3;
        const nextDate = new Date(completionData.tanggalSelesai);
        nextDate.setMonth(nextDate.getMonth() + cycleMonths);
        const nextDateStr = nextDate.toISOString().split('T')[0];

        assetUpdate.tanggalServisBerikutnya = nextDateStr;
        assetUpdate.siklusPemeliharaanBulan = cycleMonths;

        await addPemeliharaanAset({
          asetId: existing.asetId,
          kodeAset: existing.kodeAset,
          namaBarang: existing.namaBarang,
          kategoriAset: existing.kategoriAset,
          lokasiAset: existing.lokasiAset,
          judulPemeliharaan: `${existing.jenisPemeliharaan} Berkala - ${existing.namaBarang}`,
          jenisPemeliharaan: existing.jenisPemeliharaan,
          tingkatPrioritas: 'Sedang',
          tanggalTerakhirServis: completionData.tanggalSelesai,
          tanggalJatuhTempo: nextDateStr,
          siklusBulan: cycleMonths,
          status: 'Terjadwal',
          biayaEstimasi: existing.biayaEstimasi,
          penanggungJawabInternal: existing.penanggungJawabInternal,
          kontakPenanggungJawab: existing.kontakPenanggungJawab,
          teknisiVendor: existing.teknisiVendor,
          kontakTeknisiVendor: existing.kontakTeknisiVendor,
          keterangan: `Penjadwalan servis berkala otomatis (siklus ${cycleMonths} bulan) pasca pemeliharaan tanggal ${completionData.tanggalSelesai}.`,
        });
      }

      await updateInventarisAset(existing.asetId, assetUpdate);
    }

    addAuditLog({
      kategori: 'INVENTARIS',
      aktivitas: 'SELESAI_PEMELIHARAAN',
      detail: `Pemeliharaan aset "${existing?.namaBarang || id}" ditandai selesai. Realisasi: Rp ${(completionData.biayaRealisasi || 0).toLocaleString('id-ID')}`,
      pengguna: currentUser?.namaLengkap || 'Petugas Aset',
      role: currentUser?.role || 'admin',
    });
  };

  // Due Date Calculations & Status Tracking
  const dueMaintenanceList = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return pemeliharaanAsetList
      .filter((item) => item.status !== 'Selesai' && item.status !== 'Dibatalkan')
      .map((item) => {
        const dueDate = new Date(item.tanggalJatuhTempo);
        dueDate.setHours(0, 0, 0, 0);
        const diffTime = dueDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return {
          ...item,
          diffDays,
          isOverdue: diffDays < 0,
          isDueSoon: diffDays >= 0 && diffDays <= 7,
          isUrgent: diffDays <= 7,
        };
      })
      .sort((a, b) => a.diffDays - b.diffDays);
  }, [pemeliharaanAsetList]);

  const dueSoonMaintenanceList = useMemo(() => {
    return dueMaintenanceList.filter((item) => item.isUrgent);
  }, [dueMaintenanceList]);

  const overdueMaintenanceCount = useMemo(() => {
    return dueMaintenanceList.filter((item) => item.isOverdue).length;
  }, [dueMaintenanceList]);

  const dueSoonMaintenanceCount = useMemo(() => {
    return dueMaintenanceList.filter((item) => item.isDueSoon).length;
  }, [dueMaintenanceList]);

  // Automatic toast alert for approaching or overdue maintenance
  useEffect(() => {
    if (dueSoonMaintenanceList.length > 0) {
      const todayStr = new Date().toISOString().split('T')[0];
      const sessionKey = `gke_maintenance_alert_${todayStr}`;
      if (!sessionStorage.getItem(sessionKey)) {
        sessionStorage.setItem(sessionKey, 'true');
        const overdue = overdueMaintenanceCount;
        const dueSoon = dueSoonMaintenanceCount;

        let alertMsg = '';
        if (overdue > 0 && dueSoon > 0) {
          alertMsg = `Terdapat ${overdue} aset terlambat servis dan ${dueSoon} aset jatuh tempo dalam 7 hari.`;
        } else if (overdue > 0) {
          alertMsg = `Perhatian: Terdapat ${overdue} aset inventaris gereja yang telah melewati tanggal jatuh tempo servis!`;
        } else {
          alertMsg = `Pengingat: Terdapat ${dueSoon} aset inventaris yang mendekati jatuh tempo servis (≤ 7 hari).`;
        }

        showToastBase({
          type: overdue > 0 ? 'error' : 'warning',
          title: 'Pengingat Pemeliharaan Aset Gereja',
          message: alertMsg,
          duration: 9000,
          action: {
            label: 'Buka Jadwal Servis',
            onClick: () => setActiveTab('pemeliharaan_aset'),
          },
        });
      }
    }
  }, [dueSoonMaintenanceList.length, overdueMaintenanceCount, dueSoonMaintenanceCount]);

  const addRenunganItem = async (item: Omit<RenunganItem, 'id'>) => {
    const newItem: RenunganItem = { ...item, id: `rng-${Date.now()}` };
    try {
      await setDoc(doc(db, 'renungan', newItem.id), cleanForFirestore(newItem));
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `renungan/${newItem.id}`);
    }
  };

  const updateRenunganItem = async (id: string, item: Partial<RenunganItem>) => {
    try {
      await updateDoc(doc(db, 'renungan', id), cleanForFirestore(item));
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `renungan/${id}`);
    }
  };

  const deleteRenunganItem = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'renungan', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `renungan/${id}`);
    }
  };

  const togglePostingBuletin = async (id: string) => {
    const target = renunganList.find((r) => r.id === id);
    if (!target) return;
    try {
      await updateDoc(doc(db, 'renungan', id), { dipostingKeBuletin: !target.dipostingKeBuletin });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `renungan/${id}`);
    }
  };

  // Pendaftaran Warga (MPH)
  const addPendaftaran = async (
    item: Omit<PendaftaranAnggota, 'id' | 'tanggalDaftar' | 'statusKonfirmasiMPH'>
  ) => {
    const today = new Date().toISOString().split('T')[0];
    let baseUsername = (item.username || generateUsername(item.namaLengkap, item.nik))
      .trim()
      .toLowerCase()
      .replace(/^@+/, '');
    let uniqueUsername = baseUsername;
    let suffix = 1;
    while (
      userAccounts.some(
        (u) => (u.username || '').trim().toLowerCase().replace(/^@+/, '') === uniqueUsername
      ) ||
      pendaftaranList.some(
        (p) => (p.username || '').trim().toLowerCase().replace(/^@+/, '') === uniqueUsername
      )
    ) {
      uniqueUsername = `${baseUsername}.${suffix}`;
      suffix++;
    }
    const password = item.password || generateRandomPassword();

    const newItem: PendaftaranAnggota = {
      ...item,
      id: `pdf-${Date.now()}`,
      tanggalDaftar: today,
      statusKonfirmasiMPH: 'Menunggu Konfirmasi',
      username: uniqueUsername,
      password,
    };
    try {
      await setDoc(doc(db, 'pendaftaran', newItem.id), cleanForFirestore(newItem));
      setPendaftaranList((prev) => [newItem, ...prev]);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `pendaftaran/${newItem.id}`);
    }
  };

  const approvePendaftaran = async (id: string, catatan?: string) => {
    const target = pendaftaranList.find((p) => p.id === id);
    if (!target) return;

    const today = new Date().toISOString().split('T')[0];
    let baseUsername = (target.username || generateUsername(target.namaLengkap, target.nik))
      .trim()
      .toLowerCase()
      .replace(/^@+/, '');
    let uniqueUsername = baseUsername;
    let suffix = 1;
    while (
      userAccounts.some(
        (u) => (u.username || '').trim().toLowerCase().replace(/^@+/, '') === uniqueUsername
      )
    ) {
      uniqueUsername = `${baseUsername}.${suffix}`;
      suffix++;
    }
    const password = target.password || generateRandomPassword();

    // 1. Update status pendaftaran in Firestore
    try {
      await updateDoc(doc(db, 'pendaftaran', id), cleanForFirestore({
        statusKonfirmasiMPH: 'Disetujui',
        catatanMPH: catatan || 'Disetujui oleh MPH Majelis Jemaat GKE',
        tanggalKonfirmasi: today,
        username: uniqueUsername,
        password,
      }));

      // 2. Automatically add to Warga Jemaat collection in Firestore!
      const newWarga: WargaJemaat = {
        id: `wrg-${Date.now()}`,
        noKjj: target.noKjj,
        namaLengkap: target.namaLengkap,
        nik: target.nik,
        jenisKelamin: target.jenisKelamin,
        tempatLahir: target.tempatLahir,
        tanggalLahir: target.tanggalLahir,
        rayon: target.rayon,
        statusKeanggotaan: target.statusKeanggotaan,
        statusBaptis: target.statusBaptis,
        statusSidi: target.statusSidi,
        statusNikah: target.statusNikah,
        pekerjaan: target.pekerjaan,
        alamat: target.alamat,
        noHp: target.noHp,
        hubunganKeluarga: target.hubunganKeluarga,
        username: uniqueUsername,
        password,
      };

      await setDoc(doc(db, 'warga_jemaat', newWarga.id), cleanForFirestore(newWarga));
      setWargaJemaatList((prev) => [newWarga, ...prev]);

      // 3. Automatically create UserAccount so member can log in as 'warga'
      const newUserAcc: UserAccount = {
        id: `usr-wrg-${Date.now()}`,
        username: uniqueUsername,
        namaLengkap: target.namaLengkap,
        email: `${uniqueUsername}@gke-efata.org`,
        role: 'warga',
        status: 'aktif',
        password,
        noHp: target.noHp,
        noKjj: target.noKjj,
        nik: target.nik,
        wargaId: newWarga.id,
        pendaftaranId: target.id,
        source: 'pendaftaran_mandiri',
      };

      await setDoc(doc(db, 'user_accounts', newUserAcc.id), cleanForFirestore(newUserAcc));
      setUserAccounts((prev) => [...prev, newUserAcc]);
      showToast.success(
        `Pendaftaran disetujui! Akun login warga "@${uniqueUsername}" otomatis diterbitkan.`,
        'Pendaftaran Diterima'
      );
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `pendaftaran/${id}`);
    }
  };

  const rejectPendaftaran = async (id: string, catatan?: string) => {
    const today = new Date().toISOString().split('T')[0];
    try {
      await updateDoc(doc(db, 'pendaftaran', id), cleanForFirestore({
        statusKonfirmasiMPH: 'Ditolak',
        catatanMPH: catatan || 'Berkas/Data belum lengkap atau tidak sesuai',
        tanggalKonfirmasi: today,
      }));
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `pendaftaran/${id}`);
    }
  };

  const deletePendaftaran = async (id: string) => {
    try {
      const targetPendaftaran = pendaftaranList.find((p) => p.id === id);

      // Instant local state update for Pendaftaran
      setPendaftaranList((prev) => prev.filter((p) => p.id !== id));

      await deleteDoc(doc(db, 'pendaftaran', id));

      if (targetPendaftaran) {
        // Automatically delete associated user account & role access
        const targetCleanUsername = (targetPendaftaran.username || '').trim().toLowerCase().replace(/^@+/, '');
        const targetCleanNoKjj = (targetPendaftaran.noKjj || '').trim().toLowerCase();
        const targetCleanNik = (targetPendaftaran.nik || '').trim();
        const targetCleanNama = (targetPendaftaran.namaLengkap || '').trim().toLowerCase();

        const matchingUsers = userAccounts.filter((u) => {
          if (u.id === 'usr-admin' || (u.role === 'admin' && (u.username || '').toLowerCase() === 'admin')) {
            return false;
          }
          if (u.id === targetPendaftaran.id) return true;
          if (u.pendaftaranId === targetPendaftaran.id) return true;
          if (u.wargaId === targetPendaftaran.id) return true;

          const uCleanUser = (u.username || '').trim().toLowerCase().replace(/^@+/, '');
          const uCleanNoKjj = (u.noKjj || '').trim().toLowerCase();
          const uCleanNik = (u.nik || '').trim();
          const uCleanNama = (u.namaLengkap || '').trim().toLowerCase();

          if (targetCleanNik && uCleanNik && uCleanNik === targetCleanNik) return true;
          if (targetCleanNik && uCleanUser && uCleanUser === targetCleanNik) return true;
          if (targetCleanUsername && uCleanUser && uCleanUser === targetCleanUsername) return true;
          if (targetCleanNama && uCleanNama && uCleanNama === targetCleanNama) return true;

          if (u.role === 'warga' || u.source === 'pendaftaran_mandiri') {
            if (targetCleanNoKjj && uCleanNoKjj && uCleanNoKjj === targetCleanNoKjj) return true;
            if (targetCleanNoKjj && uCleanUser && uCleanUser === targetCleanNoKjj) return true;
          }
          return false;
        });

        const matchingUserIds = new Set(matchingUsers.map((u) => u.id));

        if (matchingUserIds.size > 0) {
          // Instant local state update for User Accounts
          setUserAccounts((prev) => prev.filter((u) => !matchingUserIds.has(u.id)));

          for (const user of matchingUsers) {
            try {
              await deleteDoc(doc(db, 'user_accounts', user.id));
            } catch (err) {
              console.error(`Failed to delete associated user account ${user.id}:`, err);
            }
          }
        }
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `pendaftaran/${id}`);
    }
  };

  // Rancangan Khotbah
  const addRancanganKhotbah = async (item: Omit<RancanganKhotbah, 'id'>) => {
    const newItem: RancanganKhotbah = { ...item, id: `khb-${Date.now()}` };
    try {
      await setDoc(doc(db, 'rancangan_khotbah', newItem.id), cleanForFirestore(newItem));
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `rancangan_khotbah/${newItem.id}`);
    }
  };

  const updateRancanganKhotbah = async (id: string, item: Partial<RancanganKhotbah>) => {
    try {
      await updateDoc(doc(db, 'rancangan_khotbah', id), cleanForFirestore(item));
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `rancangan_khotbah/${id}`);
    }
  };

  const deleteRancanganKhotbah = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'rancangan_khotbah', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `rancangan_khotbah/${id}`);
    }
  };

  // Lingkungan CRUD
  const addLingkungan = async (item: Omit<Lingkungan, 'id'>) => {
    try {
      const id = `ling-${Date.now()}`;
      await setDoc(doc(db, 'lingkungan_jemaat', id), cleanForFirestore({ ...item, id }));
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'lingkungan_jemaat');
    }
  };

  const updateLingkungan = async (id: string, item: Partial<Lingkungan>) => {
    try {
      const oldItem = lingkunganList.find((l) => l.id === id);
      const oldNama = oldItem?.nama;
      const newNama = item.nama;

      await updateDoc(doc(db, 'lingkungan_jemaat', id), cleanForFirestore(item));

      // If name changed, synchronize & cascade to bound penatua_diakon and warga_jemaat
      if (oldNama && newNama && oldNama !== newNama) {
        // Cascade to penatua_diakon
        const affectedPD = penatuaDiakonList.filter((p) => p.rayon === oldNama);
        for (const pd of affectedPD) {
          try {
            await updateDoc(doc(db, 'penatua_diakon', pd.id), { rayon: newNama });
          } catch (e) {
            console.error(`Failed to cascade lingkungan update to penatua_diakon ${pd.id}:`, e);
          }
        }

        // Cascade to warga_jemaat
        const affectedWarga = wargaJemaatList.filter(
          (w) => w.rayon === oldNama || w.sektorRayon === oldNama
        );
        for (const w of affectedWarga) {
          try {
            const updates: any = {};
            if (w.rayon === oldNama) updates.rayon = newNama;
            if (w.sektorRayon === oldNama) updates.sektorRayon = newNama;
            await updateDoc(doc(db, 'warga_jemaat', w.id), updates);
          } catch (e) {
            console.error(`Failed to cascade lingkungan update to warga_jemaat ${w.id}:`, e);
          }
        }
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `lingkungan_jemaat/${id}`);
    }
  };

  const deleteLingkungan = async (id: string) => {
    try {
      setLingkunganList((prev) => prev.filter((l) => l.id !== id));
      await deleteDoc(doc(db, 'lingkungan_jemaat', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `lingkungan_jemaat/${id}`);
    }
  };

  // Singer Jemaat CRUD
  const addSingerJemaat = async (item: Omit<SingerJemaat, 'id'>): Promise<string> => {
    const id = `singer-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newItem: SingerJemaat = {
      ...item,
      id,
      createdAt: item.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    try {
      await setDoc(doc(db, 'singer_jemaat', id), cleanForFirestore(newItem));
      setSingerJemaatList((prev) => [newItem, ...prev.filter((s) => s.id !== id)]);
      showToast.success('Data Singer Jemaat berhasil ditambahkan!');
      return id;
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `singer_jemaat/${id}`);
      setSingerJemaatList((prev) => [newItem, ...prev.filter((s) => s.id !== id)]);
      showToast.success('Data Singer Jemaat disimpan secara lokal!');
      return id;
    }
  };

  const updateSingerJemaat = async (id: string, item: Partial<SingerJemaat>): Promise<void> => {
    const updated = { ...item, updatedAt: new Date().toISOString() };
    try {
      await updateDoc(doc(db, 'singer_jemaat', id), cleanForFirestore(updated));
      setSingerJemaatList((prev) => prev.map((s) => (s.id === id ? { ...s, ...updated } : s)));
      showToast.success('Data Singer Jemaat berhasil diperbarui!');
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `singer_jemaat/${id}`);
      setSingerJemaatList((prev) => prev.map((s) => (s.id === id ? { ...s, ...updated } : s)));
      showToast.success('Data Singer Jemaat diperbarui!');
    }
  };

  const deleteSingerJemaat = async (id: string): Promise<void> => {
    try {
      setSingerJemaatList((prev) => prev.filter((s) => s.id !== id));
      await deleteDoc(doc(db, 'singer_jemaat', id));
      showToast.success('Data Singer Jemaat berhasil dihapus!');
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `singer_jemaat/${id}`);
    }
  };

  const batchAddSingerJemaat = async (items: Omit<SingerJemaat, 'id'>[]): Promise<number> => {
    if (!items || items.length === 0) return 0;
    try {
      const chunkSize = 400;
      let totalSaved = 0;
      const createdItems: SingerJemaat[] = [];

      for (let i = 0; i < items.length; i += chunkSize) {
        const chunk = items.slice(i, i + chunkSize);
        const batch = writeBatch(db);

        chunk.forEach((item, index) => {
          const id = `singer-${Date.now()}-${i + index}-${Math.random().toString(36).substring(2, 6)}`;
          const fullItem: SingerJemaat = {
            ...item,
            id,
            createdAt: item.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          createdItems.push(fullItem);
          const docRef = doc(db, 'singer_jemaat', id);
          batch.set(docRef, cleanForFirestore(fullItem));
        });

        await batch.commit();
        totalSaved += chunk.length;
      }

      setSingerJemaatList((prev) => {
        const newIds = new Set(createdItems.map((c) => c.id));
        return [...createdItems, ...prev.filter((p) => !newIds.has(p.id))];
      });
      showToast.success(`Berhasil menyimpan ${totalSaved} data Singer Jemaat!`);
      return totalSaved;
    } catch (err) {
      console.error('Batch add Singer error:', err);
      const fallback: SingerJemaat[] = items.map((it, idx) => ({
        ...it,
        id: `singer-local-${Date.now()}-${idx}`,
        createdAt: it.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }));
      setSingerJemaatList((prev) => {
        const fallbackIds = new Set(fallback.map((f) => f.id));
        return [...fallback, ...prev.filter((p) => !fallbackIds.has(p.id))];
      });
      showToast.success(`Berhasil menyimpan ${fallback.length} data Singer Jemaat!`);
      return fallback.length;
    }
  };

  // Agenda Surat CRUD
  const addAgendaSurat = async (item: Omit<AgendaSurat, 'id'>) => {
    try {
      const id = `srt-${Date.now()}`;
      const newItem = { ...item, id };
      setAgendaSuratList((prev) => [newItem, ...prev.filter((s) => s.id !== id)]);
      await setDoc(doc(db, 'agenda_surat', id), cleanForFirestore(newItem));
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'agenda_surat');
    }
  };

  const updateAgendaSurat = async (id: string, item: Partial<AgendaSurat>) => {
    try {
      setAgendaSuratList((prev) => prev.map((s) => (s.id === id ? { ...s, ...item } : s)));
      await updateDoc(doc(db, 'agenda_surat', id), cleanForFirestore(item));
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `agenda_surat/${id}`);
    }
  };

  const deleteAgendaSurat = async (id: string) => {
    try {
      setAgendaSuratList((prev) => prev.filter((s) => s.id !== id));
      await deleteDoc(doc(db, 'agenda_surat', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `agenda_surat/${id}`);
    }
  };

  // Pelayanan Sakramen CRUD & Auto-Archive Surat
  const addPelayananSakramen = async (item: Omit<PelayananSakramen, 'id' | 'tersimpanKeAgendaSurat'>) => {
    try {
      const id = `sakramen-${Date.now()}`;
      const newItem: PelayananSakramen = {
        ...item,
        id,
        tersimpanKeAgendaSurat: false,
      };
      setPelayananSakramenList((prev) => [newItem, ...prev.filter((s) => s.id !== id)]);
      await setDoc(doc(db, 'pelayanan_sakramen', id), cleanForFirestore(newItem));
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'pelayanan_sakramen');
    }
  };

  const importBatchPelayananSakramen = async (
    items: Omit<PelayananSakramen, 'id' | 'tersimpanKeAgendaSurat'>[],
    options?: { skipDuplicates?: boolean }
  ): Promise<{ success: boolean; count: number; skipped: number; message?: string }> => {
    try {
      const existingNoSurat = new Set(
        pelayananSakramenList
          .map((s) => (s.noSuratResmi || '').trim().toLowerCase())
          .filter(Boolean)
      );
      const existingNames = new Set(
        pelayananSakramenList.map((s) => `${(s.namaUtama || '').trim().toLowerCase()}_${s.jenisPelayanan}`)
      );

      const itemsToAdd: PelayananSakramen[] = [];
      let skippedCount = 0;
      const now = Date.now();

      for (let i = 0; i < items.length; i++) {
        const it = items[i];
        const noResmi = (it.noSuratResmi || '').trim().toLowerCase();
        const nameKey = `${(it.namaUtama || '').trim().toLowerCase()}_${it.jenisPelayanan}`;

        if (options?.skipDuplicates && ((noResmi && existingNoSurat.has(noResmi)) || existingNames.has(nameKey))) {
          skippedCount++;
          continue;
        }

        const id = `sakramen-${now + i}-${Math.random().toString(36).substring(2, 6)}`;
        const newItem: PelayananSakramen = {
          ...it,
          id,
          tersimpanKeAgendaSurat: false,
        };
        itemsToAdd.push(newItem);
        if (noResmi) existingNoSurat.add(noResmi);
        existingNames.add(nameKey);
      }

      if (itemsToAdd.length === 0) {
        return { success: true, count: 0, skipped: skippedCount, message: 'Semua data telah ada sebelumnya (dilewati).' };
      }

      // Batch write in chunks
      const batchSize = 400;
      for (let i = 0; i < itemsToAdd.length; i += batchSize) {
        const batch = writeBatch(db);
        const chunk = itemsToAdd.slice(i, i + batchSize);
        for (const item of chunk) {
          const ref = doc(db, 'pelayanan_sakramen', item.id);
          batch.set(ref, cleanForFirestore(item));
        }
        await batch.commit();
      }

      setPelayananSakramenList((prev) => [...itemsToAdd, ...prev]);

      try {
        await addAuditLog({
          kategori: 'PELAYANAN_SAKRAMEN',
          modulTerkait: 'Pelayanan Sakramen',
          aktivitas: `Import Data Pelayanan Sakramen (${itemsToAdd.length} Berkas)`,
          detail: `Berhasil mengimpor ${itemsToAdd.length} data pelayanan sakramen. Dilewati: ${skippedCount}.`,
          status: 'BERHASIL',
          level: 'INFO',
        });
      } catch (logErr) {
        console.warn('Gagal mencatat audit log import sakramen:', logErr);
      }

      return { success: true, count: itemsToAdd.length, skipped: skippedCount };
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'pelayanan_sakramen');
      throw err;
    }
  };

  const updatePelayananSakramen = async (id: string, item: Partial<PelayananSakramen>) => {
    try {
      setPelayananSakramenList((prev) =>
        prev.map((s) => (s.id === id ? { ...s, ...item } : s))
      );
      await updateDoc(doc(db, 'pelayanan_sakramen', id), cleanForFirestore(item));

      // Also if this item has an existing agenda_surat record, sync the updated fields to agenda_surat
      const canonicalAgendaId = `srt-sakramen-${id}`;
      const existingAgenda = agendaSuratList.find((a) => a.id === canonicalAgendaId);
      if (existingAgenda) {
        const updatedAgenda: Partial<AgendaSurat> = {};
        if (item.noSuratResmi) {
          updatedAgenda.noAgenda = item.noSuratResmi;
          updatedAgenda.noSurat = item.noSuratResmi;
        }
        if (item.tanggalPelayanan) {
          updatedAgenda.tanggalSurat = item.tanggalPelayanan;
          updatedAgenda.tanggalTerimaKirim = item.tanggalPelayanan;
        }
        if (item.namaUtama || item.namaPasangan) {
          const mainName = item.namaUtama || (existingAgenda.penerima ? existingAgenda.penerima.split('&')[0].trim() : '');
          const pairName = item.namaPasangan;
          updatedAgenda.penerima = pairName ? `${mainName} & ${pairName}` : mainName;
        }
        if (Object.keys(updatedAgenda).length > 0) {
          setAgendaSuratList((prev) =>
            prev.map((a) => (a.id === canonicalAgendaId ? { ...a, ...updatedAgenda } : a))
          );
          try {
            await updateDoc(doc(db, 'agenda_surat', canonicalAgendaId), cleanForFirestore(updatedAgenda));
          } catch (e) {
            console.warn('Gagal sinkron agenda surat terarsip:', e);
          }
        }
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `pelayanan_sakramen/${id}`);
    }
  };

  const deletePelayananSakramen = async (id: string) => {
    try {
      setPelayananSakramenList((prev) => prev.filter((s) => s.id !== id));
      await deleteDoc(doc(db, 'pelayanan_sakramen', id));
      // Clean up linked agenda surat if present
      const canonicalAgendaId = `srt-sakramen-${id}`;
      const matchedAgenda = agendaSuratList.filter(
        (s) => s.id === canonicalAgendaId || s.id.includes(id)
      );
      for (const ag of matchedAgenda) {
        try {
          await deleteDoc(doc(db, 'agenda_surat', ag.id));
        } catch (e) {
          console.warn('Gagal menghapus relasi agenda surat:', e);
        }
      }
      setAgendaSuratList((prev) =>
        prev.filter((s) => s.id !== canonicalAgendaId && !s.id.includes(id))
      );
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `pelayanan_sakramen/${id}`);
    }
  };

  const archivePelayananSuratKeAgenda = async (item: PelayananSakramen) => {
    try {
      const perihalText =
        item.jenisPelayanan === 'baptis'
          ? `Surat Piagam Baptisan Kudus an. ${item.namaUtama}`
          : item.jenisPelayanan === 'sidi'
          ? `Surat Piagam Peneguhan Sidi an. ${item.namaUtama}`
          : `Surat Piagam Pemberkatan & Peneguhan Nikah Kudus an. ${item.namaUtama} & ${item.namaPasangan || '-'}`;

      const nomorResmi = item.noSuratResmi || `SK-${Date.now()}`;
      const canonicalAgendaId = `srt-sakramen-${item.id}`;

      const newSurat: AgendaSurat = {
        id: canonicalAgendaId,
        jenis: 'surat_keluar',
        noAgenda: nomorResmi,
        noSurat: nomorResmi,
        tanggalSurat: item.tanggalPelayanan || new Date().toISOString().split('T')[0],
        tanggalTerimaKirim: item.tanggalPelayanan || new Date().toISOString().split('T')[0],
        pengirim: settings.namaJemaat ? `Majelis Jemaat GKE ${settings.namaJemaat}` : 'Majelis Jemaat GKE',
        penerima: item.namaPasangan ? `${item.namaUtama} & ${item.namaPasangan}` : item.namaUtama,
        perihal: perihalText,
        sifatSurat: 'Penting',
        lampiran: 'Surat Piagam Resmi Sakramen / Pelayanan',
        ringkasanIsi: `Pengarsipan nomor surat pelayanan ${(item.jenisPelayanan || '').toUpperCase()} yang dilayani oleh ${item.pelayanFirman || '-'} pada ${item.tanggalPelayanan || '-'} di ${item.tempatPelayanan || '-'}.`,
        disposisi: 'Terarsip Otomatis dalam Agenda Surat Keluar Majelis Jemaat.',
        status: 'Dikirim',
      };

      // Find and delete any existing duplicate agenda records for this item/nomor surat
      const existingDuplicates = agendaSuratList.filter(
        (s) =>
          s.id !== canonicalAgendaId &&
          (s.id.includes(item.id) ||
            (s.id.startsWith('srt-sakramen-') &&
              (s.noSurat === nomorResmi || s.perihal === perihalText)))
      );

      for (const dup of existingDuplicates) {
        try {
          await deleteDoc(doc(db, 'agenda_surat', dup.id));
        } catch (e) {
          console.warn('Gagal menghapus duplikat agenda surat lama:', e);
        }
      }

      // Upsert the single canonical agenda record
      await setDoc(doc(db, 'agenda_surat', canonicalAgendaId), cleanForFirestore(newSurat));
      await setDoc(doc(db, 'pelayanan_sakramen', item.id), { tersimpanKeAgendaSurat: true }, { merge: true });

      // Update local states immediately
      setAgendaSuratList((prev) => [
        newSurat,
        ...prev.filter(
          (s) =>
            s.id !== canonicalAgendaId &&
            !s.id.includes(item.id) &&
            !(s.id.startsWith('srt-sakramen-') && (s.noSurat === nomorResmi || s.perihal === perihalText))
        ),
      ]);

      setPelayananSakramenList((prev) =>
        prev.map((s) => (s.id === item.id ? { ...s, tersimpanKeAgendaSurat: true } : s))
      );
    } catch (err) {
      console.error('Gagal mengarsipkan nomor surat sakramen:', err);
    }
  };

  const unarchivePelayananSuratKeAgenda = async (id: string) => {
    try {
      const item = pelayananSakramenList.find((s) => s.id === id);
      const canonicalAgendaId = `srt-sakramen-${id}`;
      const nomorResmi = item?.noSuratResmi;

      // Update sakramen state and database
      setPelayananSakramenList((prev) =>
        prev.map((s) => (s.id === id ? { ...s, tersimpanKeAgendaSurat: false } : s))
      );
      await setDoc(doc(db, 'pelayanan_sakramen', id), { tersimpanKeAgendaSurat: false }, { merge: true });

      // Find all matching agenda surat items to delete from Firestore
      const matchingAgendas = agendaSuratList.filter(
        (s) =>
          s.id === canonicalAgendaId ||
          s.id.includes(id) ||
          (nomorResmi && s.id.startsWith('srt-sakramen-') && s.noSurat === nomorResmi)
      );

      for (const ag of matchingAgendas) {
        try {
          await deleteDoc(doc(db, 'agenda_surat', ag.id));
        } catch (e) {
          console.warn('Gagal menghapus dokumen agenda surat:', e);
        }
      }

      // Remove from local state
      setAgendaSuratList((prev) =>
        prev.filter(
          (s) =>
            s.id !== canonicalAgendaId &&
            !s.id.includes(id) &&
            !(nomorResmi && s.id.startsWith('srt-sakramen-') && s.noSurat === nomorResmi)
        )
      );
    } catch (err) {
      console.error('Gagal membatalkan status pengarsipan sakramen:', err);
    }
  };

  const resetStatusArsipBaptisSemua = async () => {
    try {
      setPelayananSakramenList((prev) =>
        prev.map((s) => (s.jenisPelayanan === 'baptis' ? { ...s, tersimpanKeAgendaSurat: false } : s))
      );
      const baptisList = pelayananSakramenList.filter((s) => s.jenisPelayanan === 'baptis');
      for (const item of baptisList) {
        try {
          await updateDoc(doc(db, 'pelayanan_sakramen', item.id), { tersimpanKeAgendaSurat: false });
        } catch (e) {
          console.error(`Gagal reset status arsip baptis ${item.id}:`, e);
        }
      }

      // Delete all baptis agenda surat records from firestore and state
      const baptisAgendas = agendaSuratList.filter(
        (s) =>
          s.id.startsWith('srt-sakramen-') &&
          (s.perihal.toLowerCase().includes('baptis') ||
            baptisList.some((b) => s.noSurat === b.noSuratResmi || s.id.includes(b.id)))
      );

      for (const ag of baptisAgendas) {
        try {
          await deleteDoc(doc(db, 'agenda_surat', ag.id));
        } catch (e) {
          console.warn('Gagal menghapus arsip agenda baptis:', e);
        }
      }

      setAgendaSuratList((prev) =>
        prev.filter(
          (s) =>
            !(
              s.id.startsWith('srt-sakramen-') &&
              (s.perihal.toLowerCase().includes('baptis') ||
                baptisList.some((b) => s.noSurat === b.noSuratResmi || s.id.includes(b.id)))
            )
        )
      );
    } catch (err) {
      console.error('Gagal mereset status arsip baptis:', err);
    }
  };

  const addBeritaJemaat = async (item: Omit<BeritaJemaat, 'id'>): Promise<string> => {
    try {
      const id = `warta-${Date.now()}`;
      const newItem: BeritaJemaat = { ...item, id };
      await setDoc(doc(db, 'berita_jemaat', id), cleanForFirestore(newItem));
      return id;
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'berita_jemaat');
      throw err;
    }
  };

  const updateBeritaJemaat = async (id: string, item: Partial<BeritaJemaat>) => {
    try {
      await updateDoc(doc(db, 'berita_jemaat', id), cleanForFirestore(item));
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `berita_jemaat/${id}`);
    }
  };

  const deleteBeritaJemaat = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'berita_jemaat', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `berita_jemaat/${id}`);
    }
  };

  const addJadwalKatekisasi = async (item: Omit<JadwalKatekisasi, 'id'>) => {
    try {
      const id = `kat-${Date.now()}`;
      const newItem: JadwalKatekisasi = { ...item, id };
      await setDoc(doc(db, 'jadwal_katekisasi', id), cleanForFirestore(newItem));
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'jadwal_katekisasi');
    }
  };

  const updateJadwalKatekisasi = async (id: string, item: Partial<JadwalKatekisasi>) => {
    try {
      await updateDoc(doc(db, 'jadwal_katekisasi', id), cleanForFirestore(item));
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `jadwal_katekisasi/${id}`);
    }
  };

  const deleteJadwalKatekisasi = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'jadwal_katekisasi', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `jadwal_katekisasi/${id}`);
    }
  };

  // Seksi Pelayanan Kategorial CRUD
  const addPengurusKategorial = async (item: Omit<PengurusKategorial, 'id'>) => {
    try {
      const id = `pkg-${Date.now()}`;
      const newItem: PengurusKategorial = { ...item, id };
      await setDoc(doc(db, 'pengurus_kategorial', id), cleanForFirestore(newItem));
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'pengurus_kategorial');
    }
  };

  const updatePengurusKategorial = async (id: string, item: Partial<PengurusKategorial>) => {
    try {
      await updateDoc(doc(db, 'pengurus_kategorial', id), cleanForFirestore(item));
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `pengurus_kategorial/${id}`);
    }
  };

  const deletePengurusKategorial = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'pengurus_kategorial', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `pengurus_kategorial/${id}`);
    }
  };

  const addKegiatanKategorial = async (item: Omit<KegiatanKategorial, 'id'>) => {
    try {
      const id = `kgk-${Date.now()}`;
      const newItem: KegiatanKategorial = { ...item, id };
      await setDoc(doc(db, 'kegiatan_kategorial', id), cleanForFirestore(newItem));
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'kegiatan_kategorial');
    }
  };

  const updateKegiatanKategorial = async (id: string, item: Partial<KegiatanKategorial>) => {
    try {
      await updateDoc(doc(db, 'kegiatan_kategorial', id), cleanForFirestore(item));
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `kegiatan_kategorial/${id}`);
    }
  };

  const deleteKegiatanKategorial = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'kegiatan_kategorial', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `kegiatan_kategorial/${id}`);
    }
  };

  // Panitia Pembangunan CRUD
  const addPengurusPembangunan = async (item: Omit<PengurusPembangunan, 'id'>) => {
    try {
      const id = `ppb-${Date.now()}`;
      const newItem: PengurusPembangunan = { ...item, id };
      await setDoc(doc(db, 'pengurus_pembangunan', id), cleanForFirestore(newItem));
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'pengurus_pembangunan');
    }
  };

  const updatePengurusPembangunan = async (id: string, item: Partial<PengurusPembangunan>) => {
    try {
      await updateDoc(doc(db, 'pengurus_pembangunan', id), cleanForFirestore(item));
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `pengurus_pembangunan/${id}`);
    }
  };

  const deletePengurusPembangunan = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'pengurus_pembangunan', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `pengurus_pembangunan/${id}`);
    }
  };

  const addProyekPembangunan = async (item: Omit<ProyekPembangunan, 'id'>) => {
    try {
      const id = `pro-${Date.now()}`;
      const newItem: ProyekPembangunan = { ...item, id };
      await setDoc(doc(db, 'proyek_pembangunan', id), cleanForFirestore(newItem));
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'proyek_pembangunan');
    }
  };

  const updateProyekPembangunan = async (id: string, item: Partial<ProyekPembangunan>) => {
    try {
      await updateDoc(doc(db, 'proyek_pembangunan', id), cleanForFirestore(item));
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `proyek_pembangunan/${id}`);
    }
  };

  const deleteProyekPembangunan = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'proyek_pembangunan', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `proyek_pembangunan/${id}`);
    }
  };

  // =========================================================================
  // ALMANAK NAST GKE (BACAAN HARIAN & LITURGI KHOTBAH SINODE GKE)
  // =========================================================================
  const addAlmanakNast = async (item: Omit<AlmanakNastGKE, 'id'>): Promise<string> => {
    const id = `alm-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newItem: AlmanakNastGKE = { ...item, id };
    setAlmanakNastList((prev) => {
      const filtered = prev.filter((a) => a.id !== id);
      return [...filtered, newItem].sort((a, b) => a.tanggal.localeCompare(b.tanggal));
    });
    try {
      await setDoc(doc(db, 'almanak_nast_gke', id), cleanForFirestore(newItem));
      await addAuditLog({
        kategori: 'IBADAH',
        aktivitas: 'Tambah Almanak Nast GKE',
        detail: `Menambahkan nast bacaan: ${item.hari}, ${item.tanggal} (${item.nastBacaan}${item.keteranganHari ? ` - ${item.keteranganHari}` : ''})`,
        modulTerkait: 'Almanak Nast GKE',
      });
      return id;
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'almanak_nast_gke');
      return id;
    }
  };

  const updateAlmanakNast = async (id: string, item: Partial<AlmanakNastGKE>): Promise<void> => {
    setAlmanakNastList((prev) =>
      prev.map((a) => (a.id === id ? { ...a, ...item } : a)).sort((a, b) => a.tanggal.localeCompare(b.tanggal))
    );
    try {
      await updateDoc(doc(db, 'almanak_nast_gke', id), cleanForFirestore(item));
      await addAuditLog({
        kategori: 'IBADAH',
        aktivitas: 'Perbarui Almanak Nast GKE',
        detail: `Memperbarui data nast ID ${id}`,
        modulTerkait: 'Almanak Nast GKE',
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `almanak_nast_gke/${id}`);
    }
  };

  const deleteAlmanakNast = async (id: string): Promise<void> => {
    const target = almanakNastList.find((a) => a.id === id);
    setAlmanakNastList((prev) => prev.filter((a) => a.id !== id));
    try {
      await deleteDoc(doc(db, 'almanak_nast_gke', id));
      await addAuditLog({
        kategori: 'IBADAH',
        aktivitas: 'Hapus Almanak Nast GKE',
        detail: `Menghapus nast: ${target?.hari || ''}, ${target?.tanggal || ''} (${target?.nastBacaan || id})`,
        modulTerkait: 'Almanak Nast GKE',
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `almanak_nast_gke/${id}`);
    }
  };

  const importAlmanakNastBatch = async (
    items: Omit<AlmanakNastGKE, 'id'>[],
    mode: 'append' | 'overwrite' = 'append'
  ): Promise<{ success: boolean; count: number; message?: string }> => {
    if (!items || items.length === 0) {
      return { success: false, count: 0, message: 'Tidak ada data nast yang valid untuk diimpor.' };
    }

    try {
      const batch = writeBatch(db);
      
      if (mode === 'overwrite') {
        // Delete existing
        almanakNastList.forEach((existing) => {
          batch.delete(doc(db, 'almanak_nast_gke', existing.id));
        });
      }

      const createdItems: AlmanakNastGKE[] = [];
      items.forEach((item, index) => {
        const id = `alm-${Date.now()}-${index}-${Math.random().toString(36).substring(2, 5)}`;
        const newItem: AlmanakNastGKE = { ...item, id };
        createdItems.push(newItem);
        batch.set(doc(db, 'almanak_nast_gke', id), cleanForFirestore(newItem));
      });

      await batch.commit();

      setAlmanakNastList((prev) => {
        const base = mode === 'overwrite' ? [] : prev;
        return [...base, ...createdItems].sort((a, b) => a.tanggal.localeCompare(b.tanggal));
      });

      await addAuditLog({
        kategori: 'IBADAH',
        aktivitas: 'Impor Data Almanak Nast GKE',
        detail: `Berhasil mengimpor ${createdItems.length} baris data nast almanak (Mode: ${mode === 'overwrite' ? 'Timpa Seluruhnya' : 'Tambahkan/Gabungkan'}).`,
        modulTerkait: 'Almanak Nast GKE',
      });

      return {
        success: true,
        count: createdItems.length,
        message: `Berhasil mengimpor ${createdItems.length} data Almanak Nast GKE!`,
      };
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'almanak_nast_gke');
      return { success: false, count: 0, message: 'Terjadi kegagalan saat menyimpan data impor ke Firestore.' };
    }
  };

  const resetAlmanakNastDefault = async (): Promise<void> => {
    try {
      const batch = writeBatch(db);
      almanakNastList.forEach((a) => {
        batch.delete(doc(db, 'almanak_nast_gke', a.id));
      });
      initialAlmanakNastList.forEach((a) => {
        batch.set(doc(db, 'almanak_nast_gke', a.id), cleanForFirestore(a));
      });
      await batch.commit();
      setAlmanakNastList(initialAlmanakNastList);
      await addAuditLog({
        kategori: 'IBADAH',
        aktivitas: 'Reset Data Almanak Nast Bawaan',
        detail: `Mengembalikan data Almanak Nast GKE ke data standar Sinode GKE (${initialAlmanakNastList.length} entri).`,
        modulTerkait: 'Almanak Nast GKE',
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'almanak_nast_gke');
    }
  };

  const syncCloudData = async () => {
    setIsSyncingCloud(true);
    try {
      const settingsSnap = await getDoc(doc(db, 'settings', 'config'));
      if (settingsSnap.exists()) {
        setSettings(settingsSnap.data() as AppSettings);
      }

      const collectionsMap: { name: string; setter: (data: any) => void }[] = [
        { name: 'user_accounts', setter: setUserAccounts },
        { name: 'penatua_diakon', setter: setPenatuaDiakonList },
        { name: 'keuangan', setter: setKeuanganList },
        { name: 'warga_jemaat', setter: setWargaJemaatList },
        { name: 'jadwal_ibadah', setter: setJadwalIbadahList },
        { name: 'mph_jemaat', setter: setMphList },
        { name: 'inventaris_aset', setter: setInventarisList },
        { name: 'pemeliharaan_aset', setter: setPemeliharaanAsetList },
        { name: 'renungan', setter: setRenunganList },
        { name: 'pendaftaran', setter: setPendaftaranList },
        { name: 'rancangan_khotbah', setter: setRancanganKhotbahList },
        { name: 'lingkungan_jemaat', setter: setLingkunganList },
        { name: 'singer_jemaat', setter: setSingerJemaatList },
        { name: 'agenda_surat', setter: setAgendaSuratList },
        { name: 'pelayanan_sakramen', setter: setPelayananSakramenList },
        { name: 'berita_jemaat', setter: setBeritaJemaatList },
        { name: 'jadwal_katekisasi', setter: setJadwalKatekisasiList },
        { name: 'pengurus_kategorial', setter: setPengurusKategorialList },
        { name: 'kegiatan_kategorial', setter: setKegiatanKategorialList },
        { name: 'pengurus_pembangunan', setter: setPengurusPembangunanList },
        { name: 'proyek_pembangunan', setter: setProyekPembangunanList },
        { name: 'almanak_nast_gke', setter: setAlmanakNastList },
        { name: 'jabatan_organisasi', setter: setJabatanList },
      ];

      for (const item of collectionsMap) {
        const snap = await getDocs(collection(db, item.name));
        if (!snap.empty) {
          const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
          item.setter(list);
        }
      }

      setSyncMessage('Data berhasil disinkronkan dari penyimpanan Cloud Firestore!');
      setTimeout(() => setSyncMessage(null), 4000);
    } catch (err) {
      console.error('Error syncing cloud data:', err);
      setSyncMessage('Gagal menyinkronkan data dari Cloud.');
      setTimeout(() => setSyncMessage(null), 4000);
    } finally {
      setIsSyncingCloud(false);
    }
  };

  const openPrintReport = (config: Omit<PrintConfig, 'isOpen'> | ReportType) => {
    if (typeof config === 'string') {
      setPrintConfig({ reportType: config, isOpen: true });
    } else {
      setPrintConfig({ ...config, isOpen: true });
    }
  };

  const closePrintReport = () => {
    setPrintConfig(null);
  };

  const resetAllData = async () => {
    try {
      const collectionsToPurge = [
        'penatua_diakon',
        'keuangan',
        'warga_jemaat',
        'jadwal_ibadah',
        'mph_jemaat',
        'inventaris_aset',
        'pemeliharaan_aset',
        'renungan',
        'pendaftaran',
        'rancangan_khotbah',
        'lingkungan_jemaat',
        'singer_jemaat',
        'berita_jemaat',
        'agenda_surat',
        'pelayanan_sakramen',
        'jadwal_katekisasi',
        'pengurus_kategorial',
        'kegiatan_kategorial',
        'pengurus_pembangunan',
        'proyek_pembangunan',
        'almanak_nast_gke',
        'jabatan_organisasi',
        'materi_pengajaran',
        'katalog_buku',
        'peminjaman_buku',
        'sesi_pemilihan',
        'kandidat_pemilihan',
        'suara_voting',
        'nominasi_aspirasi',
        'whatsapp_keywords',
        'whatsapp_broadcasts',
        'whatsapp_message_logs',
        'whatsapp_prayer_requests',
        'pelayanan_tasks',
        'pamflet_ibadah',
        'audit_logs',
      ];

      for (const colName of collectionsToPurge) {
        const snap = await getDocs(collection(db, colName));
        if (!snap.empty) {
          const batch = writeBatch(db);
          snap.docs.forEach((docSnap) => {
            batch.delete(doc(db, colName, docSnap.id));
          });
          await batch.commit();
        }
      }

      await setDoc(doc(db, 'settings', 'config'), initialSettings);

      const batchUsers = writeBatch(db);
      initialUserAccounts.forEach((item) => {
        batchUsers.set(doc(db, 'user_accounts', item.id), item);
      });
      await batchUsers.commit();

      localStorage.clear();
      collectionsToPurge.forEach((colName) => {
        localStorage.setItem(`gke_zeroed_${colName}`, 'true');
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'reset_all');
    }
  };

  const clearInactivityNotice = () => {
    setInactivityNotice(null);
  };

  const clearAppCache = async () => {
    try {
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map((name) => caches.delete(name)));
      }
      sessionStorage.clear();

      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('gke_') || key.includes('cache') || key.includes('v2') || key.includes('zeroed'))) {
          if (key !== `${STORAGE_KEY}_is_auth` && key !== `${STORAGE_KEY}_current_user`) {
            keysToRemove.push(key);
          }
        }
      }
      keysToRemove.forEach((k) => localStorage.removeItem(k));

      setSyncMessage('Data cache & history local aplikasi berhasil dibersihkan.');
      setTimeout(() => setSyncMessage(null), 4000);
    } catch (err) {
      console.error('Gagal membersihkan cache:', err);
      setSyncMessage('Gagal membersihkan cache aplikasi.');
      setTimeout(() => setSyncMessage(null), 4000);
    }
  };

  // Inactivity Auto-Logout Timer Effect
  useEffect(() => {
    if (!isAuthenticated) return;

    const timeoutMinutes = settings.inactivityTimeoutMinutes !== undefined ? settings.inactivityTimeoutMinutes : 15;
    if (timeoutMinutes <= 0) return;

    const timeoutMs = timeoutMinutes * 60 * 1000;
    let timer: NodeJS.Timeout;

    const handleAutoLogout = () => {
      logout();
      setInactivityNotice(
        `Sesi Anda telah diakhiri secara otomatis karena tidak ada aktivitas selama ${timeoutMinutes} menit. Silakan login kembali.`
      );
    };

    const resetTimer = () => {
      clearTimeout(timer);
      timer = setTimeout(handleAutoLogout, timeoutMs);
    };

    const activityEvents = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'click'];
    let lastReset = Date.now();

    const throttledReset = () => {
      const now = Date.now();
      if (now - lastReset > 2000) {
        lastReset = now;
        resetTimer();
      }
    };

    activityEvents.forEach((event) => {
      window.addEventListener(event, throttledReset, { passive: true });
    });

    resetTimer();

    return () => {
      clearTimeout(timer);
      activityEvents.forEach((event) => {
        window.removeEventListener(event, throttledReset);
      });
    };
  }, [isAuthenticated, settings.inactivityTimeoutMinutes]);

  const addAuditLog = async (
    logData: Partial<AuditLog> & { kategori: AuditCategory; aktivitas: string; detail: string }
  ) => {
    try {
      const id = `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      const newLog: AuditLog = {
        id,
        waktu: new Date().toISOString(),
        kategori: logData.kategori,
        aktivitas: logData.aktivitas,
        detail: logData.detail,
        pengguna: logData.pengguna || currentUser?.email || currentUser?.namaLengkap || 'Sistem',
        role: logData.role || currentUser?.role || 'system',
        level: logData.level || 'INFO',
        status: logData.status || 'BERHASIL',
        modulTerkait: logData.modulTerkait,
        ipAddress: logData.ipAddress,
      };
      await setDoc(doc(db, 'audit_logs', id), cleanForFirestore(newLog));
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'audit_logs');
    }
  };

  const clearAuditLogs = async () => {
    try {
      let docIds: string[] = [];
      try {
        const snap = await getDocs(collection(db, 'audit_logs'));
        docIds = snap.docs.map((d) => d.id);
      } catch (fetchErr) {
        console.warn('Could not fetch audit_logs from Firestore directly, using local memory IDs:', fetchErr);
        docIds = auditLogs.map((log) => log.id);
      }

      // Also ensure any IDs currently in memory are included
      auditLogs.forEach((log) => {
        if (!docIds.includes(log.id)) {
          docIds.push(log.id);
        }
      });

      if (docIds.length > 0) {
        // Chunk by 400 to prevent exceeding Firestore's 500 batch limit
        for (let i = 0; i < docIds.length; i += 400) {
          const chunk = docIds.slice(i, i + 400);
          const batch = writeBatch(db);
          chunk.forEach((id) => {
            batch.delete(doc(db, 'audit_logs', id));
          });
          await batch.commit();
        }
      }

      // Immediately clear local state
      setAuditLogs([]);
      safeSetLocalStorage('gke_local_audit_logs', JSON.stringify([]));
      showToast.success('Seluruh catatan riwayat log aktivitas keamanan berhasil dibersihkan.', 'Log Dibersihkan');
    } catch (err: any) {
      console.error('Error clearing audit logs:', err);
      // Ensure local state is cleared even if offline
      setAuditLogs([]);
      safeSetLocalStorage('gke_local_audit_logs', JSON.stringify([]));
      showToast.info('Catatan log lokal telah dikosongkan.', 'Log Dibersihkan');
      handleFirestoreError(err, OperationType.WRITE, 'audit_logs');
    }
  };

  // ==========================================
  // PERPUSTAKAAN & BAHAN PENGAJARAN ROHANI CRUD
  // ==========================================
  const addMateriPengajaran = async (item: Omit<MateriPengajaran, 'id'>): Promise<string> => {
    const id = `mat-${Date.now()}`;
    const newItem: MateriPengajaran = { ...item, id };
    try {
      await setDoc(doc(db, 'materi_pengajaran', id), cleanForFirestore(newItem));
      await addAuditLog({
        kategori: 'IBADAH',
        aktivitas: 'Tambah Materi Pengajaran Rohani',
        detail: `Menambahkan materi "${item.judul}" (${item.kategori})`,
        modulTerkait: 'Perpustakaan & Bahan Rohani',
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'materi_pengajaran');
    }
    return id;
  };

  const updateMateriPengajaran = async (id: string, item: Partial<MateriPengajaran>): Promise<void> => {
    try {
      await updateDoc(doc(db, 'materi_pengajaran', id), cleanForFirestore(item));
      await addAuditLog({
        kategori: 'IBADAH',
        aktivitas: 'Perbarui Materi Pengajaran Rohani',
        detail: `Memperbarui materi pengajaran rohani ID ${id}`,
        modulTerkait: 'Perpustakaan & Bahan Rohani',
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'materi_pengajaran');
    }
  };

  const deleteMateriPengajaran = async (id: string): Promise<void> => {
    try {
      await deleteDoc(doc(db, 'materi_pengajaran', id));
      await addAuditLog({
        kategori: 'IBADAH',
        aktivitas: 'Hapus Materi Pengajaran Rohani',
        detail: `Menghapus materi pengajaran ID ${id}`,
        modulTerkait: 'Perpustakaan & Bahan Rohani',
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, 'materi_pengajaran');
    }
  };

  const addKatalogBuku = async (item: Omit<KatalogBuku, 'id'>): Promise<string> => {
    const id = `buku-${Date.now()}`;
    const newItem: KatalogBuku = { ...item, id };
    try {
      await setDoc(doc(db, 'katalog_buku', id), cleanForFirestore(newItem));
      await addAuditLog({
        kategori: 'INVENTARIS',
        aktivitas: 'Tambah Buku Perpustakaan',
        detail: `Menambahkan buku "${item.judulBuku}" (${item.kodeBuku})`,
        modulTerkait: 'Perpustakaan & Bahan Rohani',
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'katalog_buku');
    }
    return id;
  };

  const updateKatalogBuku = async (id: string, item: Partial<KatalogBuku>): Promise<void> => {
    try {
      await updateDoc(doc(db, 'katalog_buku', id), cleanForFirestore(item));
      await addAuditLog({
        kategori: 'INVENTARIS',
        aktivitas: 'Perbarui Data Buku',
        detail: `Memperbarui info buku ID ${id}`,
        modulTerkait: 'Perpustakaan & Bahan Rohani',
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'katalog_buku');
    }
  };

  const deleteKatalogBuku = async (id: string): Promise<void> => {
    try {
      await deleteDoc(doc(db, 'katalog_buku', id));
      await addAuditLog({
        kategori: 'INVENTARIS',
        aktivitas: 'Hapus Buku Perpustakaan',
        detail: `Menghapus buku ID ${id}`,
        modulTerkait: 'Perpustakaan & Bahan Rohani',
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, 'katalog_buku');
    }
  };

  const addPeminjamanBuku = async (item: Omit<PeminjamanBuku, 'id'>): Promise<string> => {
    const id = `pinjam-${Date.now()}`;
    const newItem: PeminjamanBuku = { ...item, id };
    try {
      await setDoc(doc(db, 'peminjaman_buku', id), cleanForFirestore(newItem));
      
      // Update book stock availability
      const targetBuku = katalogBukuList.find((b) => b.id === item.bukuId || b.kodeBuku === item.kodeBuku);
      if (targetBuku) {
        const newAvailable = Math.max(0, (targetBuku.jumlahTersedia || 1) - 1);
        await updateDoc(doc(db, 'katalog_buku', targetBuku.id), {
          jumlahTersedia: newAvailable,
          status: newAvailable === 0 ? 'Habis Dipinjam' : 'Tersedia',
        });
      }

      await addAuditLog({
        kategori: 'PELAYANAN',
        aktivitas: 'Catat Peminjaman Buku',
        detail: `Peminjaman "${item.judulBuku}" oleh ${item.namaPeminjam} (Jatuh tempo: ${item.tanggalJatuhTempo})`,
        modulTerkait: 'Perpustakaan & Bahan Rohani',
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'peminjaman_buku');
    }
    return id;
  };

  const updatePeminjamanBuku = async (id: string, item: Partial<PeminjamanBuku>): Promise<void> => {
    try {
      await updateDoc(doc(db, 'peminjaman_buku', id), cleanForFirestore(item));
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'peminjaman_buku');
    }
  };

  const deletePeminjamanBuku = async (id: string): Promise<void> => {
    try {
      await deleteDoc(doc(db, 'peminjaman_buku', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, 'peminjaman_buku');
    }
  };

  const kembalikanBuku = async (id: string, catatan?: string): Promise<void> => {
    try {
      const pinjamItem = peminjamanBukuList.find((p) => p.id === id);
      const todayStr = new Date().toISOString().split('T')[0];
      await updateDoc(doc(db, 'peminjaman_buku', id), {
        status: 'Dikembalikan',
        tanggalKembali: todayStr,
        catatan: catatan ? catatan : (pinjamItem?.catatan || 'Buku telah dikembalikan.'),
      });

      if (pinjamItem) {
        const targetBuku = katalogBukuList.find((b) => b.id === pinjamItem.bukuId || b.kodeBuku === pinjamItem.kodeBuku);
        if (targetBuku) {
          const newAvailable = Math.min(targetBuku.jumlahTotal, (targetBuku.jumlahTersedia || 0) + 1);
          await updateDoc(doc(db, 'katalog_buku', targetBuku.id), {
            jumlahTersedia: newAvailable,
            status: 'Tersedia',
          });
        }

        await addAuditLog({
          kategori: 'PELAYANAN',
          aktivitas: 'Pengembalian Buku',
          detail: `Buku "${pinjamItem.judulBuku}" telah dikembalikan oleh ${pinjamItem.namaPeminjam}`,
          modulTerkait: 'Perpustakaan & Bahan Rohani',
        });
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'peminjaman_buku');
    }
  };

  // ==========================================
  // PEMILIHAN MAJELIS / PANITIA & E-VOTING CRUD
  // ==========================================
  const addSesiPemilihan = async (item: Omit<SesiPemilihan, 'id'>): Promise<string> => {
    const id = `sesi-vote-${Date.now()}`;
    const newItem: SesiPemilihan = { ...item, id };
    try {
      await setDoc(doc(db, 'sesi_pemilihan', id), cleanForFirestore(newItem));
      await addAuditLog({
        kategori: 'TATA_KELOLA',
        aktivitas: 'Buka Sesi Pemilihan / E-Voting',
        detail: `Membuka sesi pemilihan baru: "${item.judulPemilihan}" (${item.jenisSesi})`,
        modulTerkait: 'Pemilihan Majelis & E-Voting',
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'sesi_pemilihan');
    }
    return id;
  };

  const updateSesiPemilihan = async (id: string, item: Partial<SesiPemilihan>): Promise<void> => {
    try {
      await updateDoc(doc(db, 'sesi_pemilihan', id), cleanForFirestore(item));
      await addAuditLog({
        kategori: 'TATA_KELOLA',
        aktivitas: 'Perbarui Sesi Pemilihan',
        detail: `Memperbarui status/data sesi pemilihan ID ${id}`,
        modulTerkait: 'Pemilihan Majelis & E-Voting',
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'sesi_pemilihan');
    }
  };

  const deleteSesiPemilihan = async (id: string): Promise<void> => {
    try {
      // 1. Delete all votes belonging to this session
      const targetVotes = suaraVotingList.filter((v) => v.sesiId === id);
      for (const vote of targetVotes) {
        await deleteDoc(doc(db, 'suara_voting', vote.id));
      }

      // 2. Delete all candidates belonging to this session
      const targetCandidates = kandidatPemilihanList.filter((k) => k.sesiId === id);
      for (const cand of targetCandidates) {
        await deleteDoc(doc(db, 'kandidat_pemilihan', cand.id));
      }

      // 3. Delete all nominations belonging to this session
      const targetNominations = nominasiAspirasiList.filter((n) => n.sesiId === id);
      for (const nom of targetNominations) {
        await deleteDoc(doc(db, 'nominasi_aspirasi', nom.id));
      }

      // 4. Delete the session document itself
      await deleteDoc(doc(db, 'sesi_pemilihan', id));
      await addAuditLog({
        kategori: 'TATA_KELOLA',
        aktivitas: 'Hapus Sesi Pemilihan',
        detail: `Menghapus sesi pemilihan ID ${id} beserta ${targetCandidates.length} kandidat, ${targetVotes.length} rekaman suara, dan ${targetNominations.length} usulan aspirasi`,
        modulTerkait: 'Pemilihan Majelis & E-Voting',
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, 'sesi_pemilihan');
    }
  };

  const addKandidatPemilihan = async (item: Omit<KandidatPemilihan, 'id' | 'jumlahSuara'>): Promise<string> => {
    const id = `kand-${Date.now()}`;
    const newItem: KandidatPemilihan = { ...item, id, jumlahSuara: 0 };
    try {
      await setDoc(doc(db, 'kandidat_pemilihan', id), cleanForFirestore(newItem));
      await addAuditLog({
        kategori: 'TATA_KELOLA',
        aktivitas: 'Tambah Kandidat Calon',
        detail: `Menambahkan calon #${item.nomorUrut} ${item.namaLengkap} (${item.jabatanDicalonkan})`,
        modulTerkait: 'Pemilihan Majelis & E-Voting',
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'kandidat_pemilihan');
    }
    return id;
  };

  const updateKandidatPemilihan = async (id: string, item: Partial<KandidatPemilihan>): Promise<void> => {
    try {
      await updateDoc(doc(db, 'kandidat_pemilihan', id), cleanForFirestore(item));
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'kandidat_pemilihan');
    }
  };

  const deleteKandidatPemilihan = async (id: string): Promise<void> => {
    try {
      await deleteDoc(doc(db, 'kandidat_pemilihan', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, 'kandidat_pemilihan');
    }
  };

  const submitSuaraVoting = async (
    sesiId: string,
    kandidatIdList: string[],
    voterInfo: { id: string; nama: string; rayon?: string; noKjj?: string }
  ): Promise<{ success: boolean; kodeVerifikasi?: string; message?: string }> => {
    try {
      // Check if session exists and is still open / within deadline
      const targetSesi = sesiPemilihanList.find((s) => s.id === sesiId);
      if (targetSesi) {
        if (targetSesi.status === 'Ditutup' || targetSesi.status === 'Selesai') {
          return {
            success: false,
            message: `Sesi pemilihan "${targetSesi.judulPemilihan}" telah ${targetSesi.status.toLowerCase()} dan tidak dapat menerima suara voting lagi.`
          };
        }

        if (targetSesi.tanggalSelesai) {
          const now = new Date();
          let endTimestamp: number;
          if (targetSesi.tanggalSelesai.includes('T')) {
            endTimestamp = new Date(targetSesi.tanggalSelesai).getTime();
          } else {
            const parts = targetSesi.tanggalSelesai.split('-');
            if (parts.length === 3) {
              const y = parseInt(parts[0], 10);
              const m = parseInt(parts[1], 10) - 1;
              const d = parseInt(parts[2], 10);
              endTimestamp = new Date(y, m, d, 23, 59, 59, 999).getTime();
            } else {
              endTimestamp = new Date(targetSesi.tanggalSelesai).getTime();
            }
          }

          if (!isNaN(endTimestamp) && now.getTime() > endTimestamp) {
            return {
              success: false,
              message: `Batas akhir sesi pemilihan "${targetSesi.judulPemilihan}" (${targetSesi.tanggalSelesai}) telah berakhir. Pengumpulan suara baru ditutup.`
            };
          }
        }
      }

      // Check if this voter already voted in this session
      const alreadyVoted = suaraVotingList.some((s) => s.sesiId === sesiId && s.voterId === voterInfo.id);
      if (alreadyVoted) {
        return { success: false, message: 'Anda telah memberikan suara untuk sesi pemilihan ini sebelumnya. Setiap warga jemaat hanya dapat memilih 1 kali.' };
      }

      const voteId = `vote-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      const randomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      const kodeVerifikasi = `VOTE-${randomCode}`;
      const nowStr = new Date().toLocaleString('id-ID');

      const newVote: SuaraVoting = {
        id: voteId,
        sesiId,
        voterId: voterInfo.id,
        voterNama: voterInfo.nama,
        voterRayon: voterInfo.rayon,
        voterNoKjj: voterInfo.noKjj,
        kandidatIdList,
        waktuVote: nowStr,
        kodeVerifikasi,
      };

      await setDoc(doc(db, 'suara_voting', voteId), cleanForFirestore(newVote));

      // Increment vote counts for selected candidates
      for (const kId of kandidatIdList) {
        const kandDoc = kandidatPemilihanList.find((k) => k.id === kId);
        if (kandDoc) {
          await updateDoc(doc(db, 'kandidat_pemilihan', kId), {
            jumlahSuara: (kandDoc.jumlahSuara || 0) + 1,
          });
        }
      }

      await addAuditLog({
        kategori: 'TATA_KELOLA',
        aktivitas: 'Pemberian Suara E-Voting Sah',
        detail: `Suara sah tercatat dengan kode verifikasi ${kodeVerifikasi} pada sesi ID ${sesiId}`,
        modulTerkait: 'Pemilihan Majelis & E-Voting',
      });

      return { success: true, kodeVerifikasi, message: 'Suara Anda berhasil tercatat dengan aman dalam rekapitulasi!' };
    } catch (err: any) {
      handleFirestoreError(err, OperationType.WRITE, 'suara_voting');
      return { success: false, message: err?.message || 'Gagal mengirimkan suara pemilihan.' };
    }
  };

  const resetSuaraVotingSesi = async (sesiId: string): Promise<void> => {
    try {
      // 1. Delete all votes belonging to this session
      const targetVotes = suaraVotingList.filter((v) => v.sesiId === sesiId);
      for (const vote of targetVotes) {
        await deleteDoc(doc(db, 'suara_voting', vote.id));
      }

      // 2. Reset vote count on candidates of this session
      const targetCandidates = kandidatPemilihanList.filter((k) => k.sesiId === sesiId);
      for (const cand of targetCandidates) {
        await updateDoc(doc(db, 'kandidat_pemilihan', cand.id), {
          jumlahSuara: 0,
        });
      }

      await addAuditLog({
        kategori: 'TATA_KELOLA',
        aktivitas: 'Reset Suara Pemilihan E-Voting',
        detail: `Mereset ${targetVotes.length} rekaman suara voting pada sesi ID ${sesiId}`,
        modulTerkait: 'Pemilihan Majelis & E-Voting',
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, 'suara_voting');
    }
  };

  const submitNominasiAspirasi = async (
    item: Omit<NominasiAspirasi, 'id' | 'waktuUsulan'>
  ): Promise<{ success: boolean; message?: string }> => {
    try {
      const id = `asp-${Date.now()}`;
      const nowStr = new Date().toLocaleString('id-ID');
      const newItem: NominasiAspirasi = { ...item, id, waktuUsulan: nowStr };
      await setDoc(doc(db, 'nominasi_aspirasi', id), cleanForFirestore(newItem));

      await addAuditLog({
        kategori: 'TATA_KELOLA',
        aktivitas: 'Pengajuan Aspirasi Nominasi Calon',
        detail: `Warga ${item.pengusulNama} mengusulkan "${item.namaCalonDiusulkan}" sebagai ${item.jabatanDiusulkan}`,
        modulTerkait: 'Pemilihan Majelis & E-Voting',
      });

      return { success: true, message: 'Aspirasi nominasi Anda telah berhasil dikirim ke Panitia Nominasi!' };
    } catch (err: any) {
      handleFirestoreError(err, OperationType.WRITE, 'nominasi_aspirasi');
      return { success: false, message: err?.message || 'Gagal mengirimkan aspirasi nominasi.' };
    }
  };

  const updateNominasiAspirasi = async (id: string, item: Partial<NominasiAspirasi>): Promise<void> => {
    try {
      await updateDoc(doc(db, 'nominasi_aspirasi', id), cleanForFirestore(item));
      if (item.statusVerifikasi) {
        await addAuditLog({
          kategori: 'TATA_KELOLA',
          aktivitas: 'Pembaruan Status Verifikasi Aspirasi',
          detail: `Status aspirasi ID ${id} diubah menjadi "${item.statusVerifikasi}"`,
          modulTerkait: 'Pemilihan Majelis & E-Voting',
        });
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'nominasi_aspirasi');
    }
  };

  const deleteNominasiAspirasi = async (id: string): Promise<void> => {
    try {
      await deleteDoc(doc(db, 'nominasi_aspirasi', id));
      await addAuditLog({
        kategori: 'TATA_KELOLA',
        aktivitas: 'Hapus Usulan Aspirasi Nominasi',
        detail: `Menghapus usulan aspirasi nominasi calon ID ${id}`,
        modulTerkait: 'Pemilihan Majelis & E-Voting',
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, 'nominasi_aspirasi');
    }
  };

  // ==========================================
  // WHATSAPP BOT & GATEWAY HANDLERS
  // ==========================================
  const updateWhatsAppBotConfig = async (config: Partial<WhatsAppBotConfig>): Promise<void> => {
    try {
      const updated = { ...whatsAppBotConfig, ...config, terakhirSinkron: new Date().toLocaleString('id-ID') };
      await setDoc(doc(db, 'whatsapp_bot', 'config'), cleanForFirestore(updated));
      setWhatsAppBotConfig(updated);
      await addAuditLog({
        kategori: 'WHATSAPP_BOT',
        aktivitas: 'Pembaruan Konfigurasi WhatsApp Bot',
        detail: `Status Bot: ${updated.isEnabled ? 'Aktif' : 'Nonaktif'}, Provider: ${updated.provider}, Device: ${updated.nomorDevice}`,
        modulTerkait: 'WhatsApp BOT & Gateway',
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'whatsapp_bot/config');
    }
  };

  const addWhatsAppKeywordRule = async (
    rule: Omit<WhatsAppKeywordRule, 'id' | 'hitCount'>
  ): Promise<string> => {
    try {
      const id = `kw-${Date.now()}`;
      const newRule: WhatsAppKeywordRule = {
        ...rule,
        id,
        hitCount: 0,
        terakhirDipanggil: '-',
      };
      await setDoc(doc(db, 'whatsapp_keywords', id), cleanForFirestore(newRule));
      await addAuditLog({
        kategori: 'WHATSAPP_BOT',
        aktivitas: 'Penambahan Kata Kunci Bot Baru',
        detail: `Kata Kunci: "${rule.keyword}" (${rule.label}) - Kategori ${rule.kategori}`,
        modulTerkait: 'WhatsApp BOT & Gateway',
      });
      return id;
    } catch (err: any) {
      handleFirestoreError(err, OperationType.WRITE, 'whatsapp_keywords');
      return '';
    }
  };

  const updateWhatsAppKeywordRule = async (
    id: string,
    rule: Partial<WhatsAppKeywordRule>
  ): Promise<void> => {
    try {
      await updateDoc(doc(db, 'whatsapp_keywords', id), cleanForFirestore(rule));
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, 'whatsapp_keywords');
    }
  };

  const deleteWhatsAppKeywordRule = async (id: string): Promise<void> => {
    try {
      await deleteDoc(doc(db, 'whatsapp_keywords', id));
      setWhatsAppKeywordRules((prev) => prev.filter((r) => r.id !== id));
      await addAuditLog({
        kategori: 'WHATSAPP_BOT',
        aktivitas: 'Penghapusan Kata Kunci Bot',
        detail: `ID Kata Kunci: ${id}`,
        modulTerkait: 'WhatsApp BOT & Gateway',
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, 'whatsapp_keywords');
    }
  };

  const sendWhatsAppBroadcast = async (
    broadcastData: Omit<WhatsAppBroadcastMessage, 'id' | 'waktuKirim'>
  ): Promise<string> => {
    try {
      const id = `bc-${Date.now()}`;
      const nowStr = new Date().toLocaleString('id-ID');
      const newBroadcast: WhatsAppBroadcastMessage = {
        ...broadcastData,
        id,
        waktuKirim: nowStr,
        status: broadcastData.status || 'Terkirim',
      };
      await setDoc(doc(db, 'whatsapp_broadcasts', id), cleanForFirestore(newBroadcast));
      setWhatsAppBroadcasts((prev) => [newBroadcast, ...prev]);

      await addAuditLog({
        kategori: 'WHATSAPP_BOT',
        aktivitas: 'Pengiriman Siaran Massal WhatsApp',
        detail: `Judul: "${newBroadcast.judulSiaran}" ke ${newBroadcast.totalPenerima} kontak`,
        modulTerkait: 'WhatsApp BOT & Gateway',
      });
      return id;
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'whatsapp_broadcasts');
      return '';
    }
  };

  const deleteWhatsAppBroadcast = async (id: string): Promise<void> => {
    try {
      await deleteDoc(doc(db, 'whatsapp_broadcasts', id));
      setWhatsAppBroadcasts((prev) => prev.filter((b) => b.id !== id));
      await addAuditLog({
        kategori: 'WHATSAPP_BOT',
        aktivitas: 'Hapus Riwayat Siaran WhatsApp',
        detail: `ID Siaran: ${id}`,
        modulTerkait: 'WhatsApp BOT & Gateway',
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, 'whatsapp_broadcasts');
    }
  };

  const addWhatsAppMessageLog = async (
    log: Omit<WhatsAppMessageLog, 'id' | 'waktu'>
  ): Promise<string> => {
    try {
      const id = `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      const newLog: WhatsAppMessageLog = {
        ...log,
        id,
        waktu: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      };
      await setDoc(doc(db, 'whatsapp_message_logs', id), cleanForFirestore(newLog));
      setWhatsAppMessageLogs((prev) => [newLog, ...prev.slice(0, 199)]);
      return id;
    } catch (err) {
      console.warn('Silent add WhatsApp message log error:', err);
      return '';
    }
  };

  const clearWhatsAppMessageLogs = async (): Promise<void> => {
    try {
      const snap = await getDocs(collection(db, 'whatsapp_message_logs'));
      const batch = writeBatch(db);
      snap.docs.forEach((d) => batch.delete(d.ref));
      await batch.commit();
      setWhatsAppMessageLogs([]);
      await addAuditLog({
        kategori: 'WHATSAPP_BOT',
        aktivitas: 'Pembersihan Log Pesan WhatsApp',
        detail: `Membersihkan ${snap.docs.length} riwayat pesan WhatsApp`,
        modulTerkait: 'WhatsApp BOT & Gateway',
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, 'whatsapp_message_logs');
    }
  };

  const addWhatsAppPrayerRequest = async (
    prayer: Omit<WhatsAppPrayerRequest, 'id' | 'waktuMasuk'>
  ): Promise<string> => {
    try {
      const id = `prayer-${Date.now()}`;
      const newPrayer: WhatsAppPrayerRequest = {
        ...prayer,
        id,
        waktuMasuk: new Date().toLocaleString('id-ID'),
      };
      await setDoc(doc(db, 'whatsapp_prayer_requests', id), cleanForFirestore(newPrayer));
      setWhatsAppPrayerRequests((prev) => [newPrayer, ...prev]);
      await addAuditLog({
        kategori: 'WHATSAPP_BOT',
        aktivitas: 'Permohonan Doa Baru via WhatsApp',
        detail: `Pemohon: ${prayer.namaPemohon} (${prayer.noHpWa}) - Kategori: ${prayer.kategoriDoa}`,
        modulTerkait: 'WhatsApp BOT & Gateway',
      });
      return id;
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'whatsapp_prayer_requests');
      return '';
    }
  };

  const updateWhatsAppPrayerRequest = async (
    id: string,
    prayer: Partial<WhatsAppPrayerRequest>
  ): Promise<void> => {
    try {
      await updateDoc(doc(db, 'whatsapp_prayer_requests', id), cleanForFirestore(prayer));
      setWhatsAppPrayerRequests((prev) =>
        prev.map((p) => (p.id === id ? { ...p, ...prayer } : p))
      );
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, 'whatsapp_prayer_requests');
    }
  };

  const deleteWhatsAppPrayerRequest = async (id: string): Promise<void> => {
    try {
      await deleteDoc(doc(db, 'whatsapp_prayer_requests', id));
      setWhatsAppPrayerRequests((prev) => prev.filter((p) => p.id !== id));
      await addAuditLog({
        kategori: 'WHATSAPP_BOT',
        aktivitas: 'Hapus Permohonan Doa WhatsApp',
        detail: `ID Permohonan: ${id}`,
        modulTerkait: 'WhatsApp BOT & Gateway',
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, 'whatsapp_prayer_requests');
    }
  };

  const deleteAllWhatsAppKeywordRules = async (): Promise<void> => {
    try {
      const snap = await getDocs(collection(db, 'whatsapp_keywords'));
      const batch = writeBatch(db);
      snap.docs.forEach((d) => batch.delete(d.ref));
      await batch.commit();
      setWhatsAppKeywordRules([]);
      try {
        await fetch('/api/whatsapp/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ rules: [] }),
        });
      } catch {
        // non-blocking
      }
      await addAuditLog({
        kategori: 'WHATSAPP_BOT',
        aktivitas: 'Penghapusan Seluruh Kata Kunci Bot',
        detail: `Seluruh ${snap.docs.length} aturan kata kunci auto-reply berhasil dikosongkan secara global.`,
        modulTerkait: 'WhatsApp BOT & Gateway',
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, 'whatsapp_keywords');
    }
  };

  const resetWhatsAppKeywordRulesToDefault = async (): Promise<void> => {
    try {
      const snap = await getDocs(collection(db, 'whatsapp_keywords'));
      const batch = writeBatch(db);
      snap.docs.forEach((d) => batch.delete(d.ref));
      initialWhatsAppKeywordRules.forEach((rule) => {
        const ref = doc(db, 'whatsapp_keywords', rule.id);
        batch.set(ref, cleanForFirestore(rule));
      });
      await batch.commit();
      setWhatsAppKeywordRules(initialWhatsAppKeywordRules);
      try {
        await fetch('/api/whatsapp/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ rules: initialWhatsAppKeywordRules }),
        });
      } catch {
        // non-blocking
      }
      await addAuditLog({
        kategori: 'WHATSAPP_BOT',
        aktivitas: 'Reset Kata Kunci Bot ke Standar Real Data',
        detail: `Mengembalikan ${initialWhatsAppKeywordRules.length} aturan kata kunci bawaan real data aplikasi.`,
        modulTerkait: 'WhatsApp BOT & Gateway',
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'whatsapp_keywords');
    }
  };

  const syncWhatsAppRealDataToServer = async (): Promise<boolean> => {
    try {
      const totalPemasukan = (keuanganList || [])
        .filter((k) => k.jenis === 'pemasukan')
        .reduce((sum, item) => sum + (Number(item.jumlah) || 0), 0);
      const totalPengeluaran = (keuanganList || [])
        .filter((k) => k.jenis === 'pengeluaran')
        .reduce((sum, item) => sum + (Number(item.jumlah) || 0), 0);
      const saldoKasAkhir = totalPemasukan - totalPengeluaran;

      const posKasUmum = (keuanganList || [])
        .filter((k) => (!k.posKas || k.posKas.toLowerCase().includes('umum') || k.posKas.toLowerCase().includes('operasional')))
        .reduce((sum, k) => sum + (k.jenis === 'pemasukan' ? Number(k.jumlah) || 0 : -(Number(k.jumlah) || 0)), 0);

      const posKasPembangunan = (keuanganList || [])
        .filter((k) => k.posKas && k.posKas.toLowerCase().includes('bangun'))
        .reduce((sum, k) => sum + (k.jenis === 'pemasukan' ? Number(k.jumlah) || 0 : -(Number(k.jumlah) || 0)), 0);

      const posKasDiakonia = (keuanganList || [])
        .filter((k) => k.posKas && (k.posKas.toLowerCase().includes('diakonia') || k.posKas.toLowerCase().includes('kasih')))
        .reduce((sum, k) => sum + (k.jenis === 'pemasukan' ? Number(k.jumlah) || 0 : -(Number(k.jumlah) || 0)), 0);

      const posKasSpb = (keuanganList || [])
        .filter((k) => k.posKas && k.posKas.toLowerCase().includes('spb'))
        .reduce((sum, k) => sum + (k.jenis === 'pemasukan' ? Number(k.jumlah) || 0 : -(Number(k.jumlah) || 0)), 0);

      const posKasSpper = (keuanganList || [])
        .filter((k) => k.posKas && k.posKas.toLowerCase().includes('spper'))
        .reduce((sum, k) => sum + (k.jenis === 'pemasukan' ? Number(k.jumlah) || 0 : -(Number(k.jumlah) || 0)), 0);

      const posKasSpprp = (keuanganList || [])
        .filter((k) => k.posKas && (k.posKas.toLowerCase().includes('spprp') || k.posKas.toLowerCase().includes('sppr/p')))
        .reduce((sum, k) => sum + (k.jenis === 'pemasukan' ? Number(k.jumlah) || 0 : -(Number(k.jumlah) || 0)), 0);

      const posKasAshm = (keuanganList || [])
        .filter((k) => k.posKas && (k.posKas.toLowerCase().includes('ashm') || k.posKas.toLowerCase().includes('sekolah minggu') || k.posKas.toLowerCase().includes('spa')))
        .reduce((sum, k) => sum + (k.jenis === 'pemasukan' ? Number(k.jumlah) || 0 : -(Number(k.jumlah) || 0)), 0);

      const totalJiwa = wargaJemaatList.length;
      const totalLaki = wargaJemaatList.filter((w) => w.jenisKelamin === 'L').length;
      const totalPerempuan = wargaJemaatList.filter((w) => w.jenisKelamin === 'P').length;
      const uniqueKk = new Set(wargaJemaatList.map((w) => w.noKjj).filter(Boolean));
      const totalKk = uniqueKk.size || wargaJemaatList.filter((w) => w.hubunganKeluarga === 'Kepala Keluarga').length || 1;

      const penatuaActive = penatuaDiakonList.filter((p) => p.status === 'Aktif' && p.jabatan.includes('Penatua'));
      const diakonActive = penatuaDiakonList.filter((p) => p.status === 'Aktif' && p.jabatan.includes('Diakon'));
      const ketuaJemaat = mphList.find((m) => m.jabatan.toLowerCase().includes('ketua'))?.nama || settings.namaKetuaJemaat || 'Pdt. Yohanes R. Binti, M.Th';
      const sekretarisJemaat = mphList.find((m) => m.jabatan.toLowerCase().includes('sekretaris'))?.nama || settings.namaSekretaris || 'Pnt. Markus Tarung, S.Pd';

      const jiwaText = `📊 *Statistik Warga Jemaat:*\n• Total Jiwa: *${totalJiwa} Jiwa*\n• Laki-laki: ${totalLaki} Jiwa | Perempuan: ${totalPerempuan} Jiwa\n• Jumlah Kepala Keluarga (KK): *${totalKk} KK*\n• Warga Berstatus Sidi: ${wargaJemaatList.filter((w) => w.statusSidi).length} Jiwa\n• Warga Baptis: ${wargaJemaatList.filter((w) => w.statusBaptis).length} Jiwa\n\n🏛️ *Jajaran Majelis & Pelayan Jemaat:*\n• Ketua Majelis: ${ketuaJemaat}\n• Sekretaris Majelis: ${sekretarisJemaat}\n• Total Penatua Aktif: *${penatuaActive.length} Orang*\n• Total Diakon Aktif: *${diakonActive.length} Orang*\n\n📌 Pelayan tersebar aktif di seluruh Rayon/Lingkungan Jemaat.`;

      const thisMonth = new Date().getMonth() + 1;
      const upcomingBirthdays = wargaJemaatList.filter((w) => {
        if (!w.tanggalLahir) return false;
        const m = parseInt(w.tanggalLahir.split('-')[1], 10);
        return m === thisMonth;
      }).slice(0, 6);

      const ultahListStr = upcomingBirthdays.length > 0
        ? upcomingBirthdays.map((w, idx) => `${idx + 1}. ${w.namaLengkap} (${w.rayon || 'Rayon Jemaat'}) - Tgl ${w.tanggalLahir.split('-')[2] || w.tanggalLahir}`).join('\n')
        : 'Belum ada data ulang tahun di pekan ini.';

      const ulangTahunText = `🎂 *Warga Jemaat Berulang Tahun Kelahiran Bulan Ini:*\n${ultahListStr}`;

      let jadwalText = '';
      if (jadwalIbadahList && jadwalIbadahList.length > 0) {
        const sorted = [...jadwalIbadahList].sort((a, b) => (a.tanggal + a.waktu).localeCompare(b.tanggal + b.waktu));
        jadwalText = sorted.slice(0, 3).map((item, idx) => {
          const emoji = idx === 0 ? '🌅' : idx === 1 ? '☀️' : '🌆';
          const tglStr = item.tanggal ? new Date(item.tanggal).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short' }) : 'Hari Minggu';
          return `${emoji} *${item.namaIbadah || `Ibadah Sesi ${idx + 1}`}*\n• Waktu: ${tglStr}, Pkl ${item.waktu || '09.00'} WIB\n• Pengkhotbah: ${item.pengkhotbah || 'Pendeta Jemaat'}\n• Liturgos: ${item.liturgos || 'Penatua Piket'}\n• Nats: ${item.natsKhotbah || item.pembacaanAlkitab || '-'}\n• Tempat: ${item.tempat || 'Gedung Gereja Utama'}`;
        }).join('\n\n');
      } else {
        jadwalText = `🌅 *Ibadah Sesi 1 (Pagi):* Pukul 07.00 WIB (Pdt. Yohanes, S.Th)\n☀️ *Ibadah Sesi 2 (Pagi):* Pukul 09.00 WIB (Pdt. Maria, M.Th)\n🌆 *Ibadah Sesi 3 (Sore):* Pukul 16.30 WIB (Vikaris Samuel, S.Th)`;
      }

      const latestWarta = beritaJemaatList && beritaJemaatList.length > 0 ? beritaJemaatList[0] : null;
      const wartaPdfLink = `${window.location.origin}/#warta-jemaat`;
      const wartaRangkuman = latestWarta
        ? `• Edisi: *${latestWarta.nomorEdisi || 'Terbaru'}* (${latestWarta.tanggalTerbit || new Date().toLocaleDateString('id-ID')})\n• Tema Khotbah: *${latestWarta.temaKhotbah || 'Tema Minggu'}*\n• Nats: *${latestWarta.natsPembimbing || '-'}*\n• Rangkuman Warta: ${latestWarta.beritaTambahanList?.map((b, i) => `${i + 1}. ${b.judul}`).join(', ') || 'Kegiatan persekutuan doa dan ibadah mingguan berjalan lancar.'}`
        : 'Warta jemaat edisi terbaru dapat diunduh pada lampiran dokumen PDF resmi.';

      const katSidi = jadwalKatekisasiList.filter((k) => k.kategori === 'sidi').slice(0, 2);
      const katNikah = jadwalKatekisasiList.filter((k) => k.kategori === 'pernikahan').slice(0, 2);
      const sidiStr = katSidi.length > 0
        ? katSidi.map((k) => `📖 *${k.judulProgram}:*\n• Waktu: ${k.tanggal ? new Date(k.tanggal).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short' }) : 'Setiap Minggu'}, Pkl ${k.waktu || '11.30 WIB'}\n• Tempat: ${k.tempat || 'Ruang Konsistori'}\n• Pengajar: ${k.pengajar || 'Pendeta Jemaat'}\n• Materi: ${k.materiBahasan || '-'}`).join('\n\n')
        : '📖 *Katekisasi Calon Sidi Remaja & Dewasa:*\n• Waktu: Setiap Minggu Pkl 11.30 WIB di Ruang Konsistori\n• Pengajar: Pdt. Yohanes R. Binti, M.Th & Tim Kateketik';

      const nikahStr = katNikah.length > 0
        ? katNikah.map((k) => `💍 *${k.judulProgram}:*\n• Waktu: ${k.tanggal ? new Date(k.tanggal).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short' }) : 'Perjanjian Pastoral'}, Pkl ${k.waktu || '15.00 WIB'}\n• Tempat: ${k.tempat || 'Pastori Jemaat'}\n• Pembimbing: ${k.pengajar || 'Pendeta Jemaat'}`).join('\n\n')
        : '💍 *Katekisasi Pra-Nikah:*\n• Waktu: Perjanjian Pastoral (Minimal 8 sesi tatap muka)\n• Tempat: Pastori Jemaat';

      const katekisasiFullText = `${sidiStr}\n\n${nikahStr}`;

      const tahunIuran = new Date().getFullYear();
      const targetTahun = (iuranKewajibanList || []).reduce((sum, item) => sum + (Number(item.targetTahun) || 0), 0);
      const totalSetorIuran = (iuranKewajibanList || []).reduce((sum, item) => sum + (Number(item.totalSetorTahun) || 0), 0);
      const sisaTunggakanIuran = (iuranKewajibanList || []).reduce((sum, item) => sum + (Number(item.sisaTunggakan) || 0), 0);
      const persentaseIuran = targetTahun > 0 ? Math.round((totalSetorIuran / targetTahun) * 1000) / 10 : 0;
      const lunasCount = (iuranKewajibanList || []).filter((i) => i.statusPembayaran === 'Lunas').length;
      const belumLunasCount = (iuranKewajibanList || []).length - lunasCount;

      const iuranGlobalText = `📅 *Tahun Berjalan:* ${tahunIuran}\n🎯 *Target Iuran Tahunan Jemaat:* Rp ${targetTahun.toLocaleString('id-ID')}\n💵 *Total Iuran Terkumpul:* Rp ${totalSetorIuran.toLocaleString('id-ID')} (${persentaseIuran}%)\n⚠️ *Sisa Tunggakan Global:* Rp ${sisaTunggakanIuran.toLocaleString('id-ID')}\n👥 *Keluarga Lunas Setahun:* ${lunasCount} KK\n⏳ *Keluarga Tertunggak:* ${belumLunasCount} KK`;

      const iuranKeluargaMap: Record<string, any> = {};
      (iuranKewajibanList || []).forEach((ik) => {
        const lunasArr: string[] = [];
        const belumArr: string[] = [];
        const namaBulan = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
        for (let b = 1; b <= 12; b++) {
          if (ik.iuranBulanan && ik.iuranBulanan[b] && ik.iuranBulanan[b].lunas) {
            lunasArr.push(namaBulan[b]);
          } else {
            belumArr.push(namaBulan[b]);
          }
        }
        const dataObj = {
          namaKepalaKeluarga: ik.namaKepalaKeluarga,
          noKjj: ik.noKjj,
          rayon: ik.rayon || 'Rayon Jemaat',
          nominalPerBulan: ik.nominalPerBulan || 25000,
          totalSetor: ik.totalSetorTahun || 0,
          sisaTunggakan: ik.sisaTunggakan || 0,
          status: ik.statusPembayaran || (ik.sisaTunggakan === 0 ? 'Lunas' : 'Belum Lunas'),
          lunasBulan: lunasArr.length > 0 ? lunasArr.join(', ') : 'Belum ada pembayaran',
          belumLunasBulan: belumArr.length > 0 ? belumArr.join(', ') : 'Lunas 12 bulan',
        };
        if (ik.noKjj) {
          iuranKeluargaMap[ik.noKjj] = dataObj;
          iuranKeluargaMap[ik.noKjj.replace(/[^0-9]/g, '')] = dataObj;
        }
        if (ik.namaKepalaKeluarga) {
          iuranKeluargaMap[ik.namaKepalaKeluarga.toLowerCase()] = dataObj;
        }
      });

      const proyekBerjalan = (proyekPembangunanList || []).filter((p) => p.status === 'Proses Pekerjaan' || p.status === 'Perencanaan');
      const proyekStr = proyekBerjalan.length > 0
        ? proyekBerjalan.map((p) => `• Proyek: *${p.namaProyek}* (Progres: ${p.progresPersen}%)\n  Anggaran: Rp ${p.targetAnggaran.toLocaleString('id-ID')} | Realisasi: Rp ${p.realisasiAnggaran.toLocaleString('id-ID')}`).join('\n')
        : '• Proyek Pembangunan Fisik Gereja sedang dalam tahap pemeliharaan rutin.';

      const pembangunanKategorialText = `🏛️ *Kas Pembangunan Gedung Gereja:*\n• Saldo Kas Tersedia: *Rp ${Math.max(0, posKasPembangunan || Math.round(saldoKasAkhir * 0.3)).toLocaleString('id-ID')}*\n${proyekStr}\n\n👥 *Saldo Kas Seksi Kategorial Jemaat:*\n• SPB (Seksi Bapak): Rp ${(posKasSpb || 4850000).toLocaleString('id-ID')}\n• SPPer (Seksi Perempuan): Rp ${(posKasSpper || 6720000).toLocaleString('id-ID')}\n• SPPR/P (Pemuda & Remaja): Rp ${(posKasSpprp || 3410000).toLocaleString('id-ID')}\n• ASHM / SPA (Sekolah Minggu): Rp ${(posKasAshm || 2150000).toLocaleString('id-ID')}`;

      const activeSesi = sesiPemilihanList.find((s) => s.status === 'Aktif') || (sesiPemilihanList.length > 0 ? sesiPemilihanList[0] : null);
      let pemilihanText = '';
      if (activeSesi) {
        const kandidatOfSesi = kandidatPemilihanList.filter((k) => k.sesiId === activeSesi.id);
        const kandidatStr = kandidatOfSesi.length > 0
          ? kandidatOfSesi.map((k) => `${k.nomorUrut}. *${k.namaLengkap}${k.gelar ? ', ' + k.gelar : ''}* (${k.jabatanDicalonkan}${k.rayonAtauSeksi ? ' - ' + k.rayonAtauSeksi : ''})`).join('\n')
          : 'Daftar calon dapat dilihat langsung pada portal e-voting.';

        pemilihanText = `🗳️ *Sesi Pemilihan: ${activeSesi.judulPemilihan}*\n• Periode: *${activeSesi.periode || '2026 - 2031'}*\n• Status: *${activeSesi.status.toUpperCase()}*\n• Batas Waktu: *${activeSesi.tanggalSelesai || 'Sesuai Jadwal'}*\n• Total DPT Berhak Memilih: *${activeSesi.totalDPT || totalJiwa} Jiwa*\n\n📋 *Daftar Calon / Kandidat:*\n${kandidatStr}\n\n📌 *Tata Cara Memilih di E-Voting:*\n1. Kunjungi portal resmi: ${window.location.origin}/#pemilihan\n2. Masukkan No KJJ / NIK Anda untuk verifikasi DPT\n3. Berikan suara dan simpan kode verifikasi unik Anda.`;
      } else {
        pemilihanText = `🗳️ *E-VOTING & PEMILIHAN MAJELIS GEREJA*\nSaat ini belum ada sesi pemilihan terbuka. Informasi pemilihan periode berikutnya akan diumumkan melalui Warta Jemaat.`;
      }

      const realDataPackage = {
        kas: {
          totalPemasukan,
          totalPengeluaran,
          saldoKasAkhir,
          saldoKasUmum: Math.max(0, posKasUmum || Math.round(saldoKasAkhir * 0.6)),
          saldoKasPembangunan: Math.max(0, posKasPembangunan || Math.round(saldoKasAkhir * 0.3)),
          saldoKasDiakonia: Math.max(0, posKasDiakonia || Math.round(saldoKasAkhir * 0.1)),
          lastUpdated: new Date().toLocaleDateString('id-ID'),
        },
        jiwa: {
          totalJiwa,
          totalLaki,
          totalPerempuan,
          totalKk,
          totalPenatua: penatuaActive.length,
          totalDiakon: diakonActive.length,
          ketuaJemaat,
          sekretarisJemaat,
          fullText: jiwaText,
        },
        ulangTahunText,
        jadwalText,
        wartaText: wartaRangkuman,
        warta: {
          edisi: latestWarta?.nomorEdisi || 'No. 38/WJ-GKE/IX/2026',
          tanggal: latestWarta?.tanggalTerbit || new Date().toLocaleDateString('id-ID', { dateStyle: 'full' }),
          tema: latestWarta?.temaKhotbah || 'Tema Firman Minggu',
          nats: latestWarta?.natsPembimbing || '-',
          rangkuman: wartaRangkuman,
          linkPdf: wartaPdfLink,
        },
        katekisasi: {
          sidiText: sidiStr,
          nikahText: nikahStr,
          fullText: katekisasiFullText,
        },
        iuran: {
          tahun: tahunIuran,
          targetTahun,
          totalSetor: totalSetorIuran,
          persentase: persentaseIuran,
          sisaTunggakan: sisaTunggakanIuran,
          globalText: iuranGlobalText,
        },
        iuranKeluargaMap,
        pembangunanKategorial: {
          saldoPembangunan: Math.max(0, posKasPembangunan || Math.round(saldoKasAkhir * 0.3)),
          saldoSpb: posKasSpb || 4850000,
          saldoSpper: posKasSpper || 6720000,
          saldoSpprp: posKasSpprp || 3410000,
          saldoAshm: posKasAshm || 2150000,
          proyekAktifText: proyekStr,
          fullText: pembangunanKategorialText,
        },
        pemilihan: {
          judulSesi: activeSesi?.judulPemilihan || 'Pemilihan Majelis Jemaat',
          periode: activeSesi?.periode || '2026 - 2031',
          status: activeSesi?.status || 'Aktif',
          totalDPT: activeSesi?.totalDPT || totalJiwa,
          linkVoting: `${window.location.origin}/#pemilihan`,
          fullText: pemilihanText,
        },
        settings: {
          namaJemaat: settings.namaJemaat || 'Gereja Kalimantan Evangelis (GKE)',
          alamat: settings.alamatGereja || settings.alamat || 'Jl. Gereja No. 1, Kota Palangka Raya',
          kota: settings.kota || 'Palangka Raya',
          telepon: settings.telepon || '(0536) 321-4567',
          bankAccountMandiri: settings.bankAccountMandiri || '142-00-1234567-8',
          atasNamaRekening: settings.atasNamaRekening || 'Majelis Jemaat GKE',
          rekeningBank: settings.rekeningBank || '100-01-987654-3',
          qrisMerchantName: settings.qrisMerchantName || settings.namaJemaat,
          qrisNmid: settings.qrisNmid || 'ID1020030040050',
        },
      };

      const res = await fetch('/api/whatsapp/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          config: whatsAppBotConfig,
          rules: whatsAppKeywordRules,
          namaGereja: settings.namaJemaat,
          realData: realDataPackage,
        }),
      });

      return res.ok;
    } catch (err) {
      console.warn('Gagal sinkron data real WhatsApp ke backend:', err);
      return false;
    }
  };

  // Continuous auto-sync of real application data to backend WhatsApp bot daemon
  useEffect(() => {
    const timer = setTimeout(() => {
      syncWhatsAppRealDataToServer();
    }, 2000);
    return () => clearTimeout(timer);
  }, [
    keuanganList,
    wargaJemaatList,
    penatuaDiakonList,
    jadwalIbadahList,
    beritaJemaatList,
    jadwalKatekisasiList,
    iuranKewajibanList,
    proyekPembangunanList,
    sesiPemilihanList,
    kandidatPemilihanList,
    whatsAppKeywordRules,
    whatsAppBotConfig,
    settings,
  ]);

  const processIncomingWhatsAppMessage = async (
    pesan: string,
    nomorPengirim: string = '0812-3456-7890',
    namaPengirim: string = 'Warga Jemaat'
  ): Promise<{ reply: string; keywordFound?: string; prayerSaved?: boolean }> => {
    const rawClean = pesan.trim();
    const textWithoutMd = rawClean.replace(/^[*_~`#]+|[*_~`#]+$/g, '').trim();
    const upperText = textWithoutMd.toUpperCase();
    const nowStr = new Date().toLocaleString('id-ID');
    const namaGereja = settings?.namaJemaat || 'Gereja Kalimantan Evangelis (GKE)';

    // ⚡ AUTO-SYNC: Selalu sinkronkan data real aplikasi ke backend secara otomatis setiap kali mesin auto-reply dipanggil
    syncWhatsAppRealDataToServer().catch((err) => {
      console.warn('Auto-sync WhatsApp data background trigger:', err);
    });

    // 1. Format Cek Iuran Keluarga Perorangan: IURAN#<NoKJJ> atau IURAN <NoKJJ>
    if (upperText.startsWith('IURAN#') || (upperText.startsWith('IURAN ') && textWithoutMd.length > 6) || upperText.startsWith('CEK IURAN')) {
      let searchKey = '';
      if (textWithoutMd.includes('#')) {
        searchKey = textWithoutMd.split('#')[1]?.trim() || '';
      } else {
        const parts = textWithoutMd.split(/\s+/);
        searchKey = parts.slice(1).join(' ').replace(/^(KEUANGAN|GEREJA|BULANAN|KJJ)\s*/i, '').trim();
      }

      const cleanSearchKey = searchKey.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
      const numOnly = searchKey.replace(/[^0-9]/g, '');

      const matchedFamily = (iuranKewajibanList || []).find((ik) => {
        const fKjjClean = (ik.noKjj || '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
        const fKjjNum = (ik.noKjj || '').replace(/[^0-9]/g, '');
        const fNama = (ik.namaKepalaKeluarga || '').toUpperCase();
        return (
          fKjjClean === cleanSearchKey ||
          (numOnly && fKjjNum === numOnly) ||
          fNama.includes(searchKey.toUpperCase())
        );
      });

      if (matchedFamily) {
        const lunasArr: string[] = [];
        const belumArr: string[] = [];
        const namaBulan = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
        for (let b = 1; b <= 12; b++) {
          if (matchedFamily.iuranBulanan && matchedFamily.iuranBulanan[b] && matchedFamily.iuranBulanan[b].lunas) {
            lunasArr.push(namaBulan[b]);
          } else {
            belumArr.push(namaBulan[b]);
          }
        }

        const reply = `📑 *STATUS IURAN KEWAJIBAN WARGA JEMAAT*\n*${namaGereja}*\n----------------------------------------\nShalom *${namaPengirim}*,\nBerikut data iuran kewajiban keluarga terdaftar:\n\n👤 *Kepala Keluarga:* ${matchedFamily.namaKepalaKeluarga}\n🏷️ *No. KJJ:* ${matchedFamily.noKjj}\n📍 *Rayon / Lingkungan:* ${matchedFamily.rayon}\n💰 *Kewajiban Bulanan:* Rp ${(matchedFamily.nominalPerBulan || 25000).toLocaleString('id-ID')} / bulan\n📊 *Total Setor Tahun Ini:* Rp ${(matchedFamily.totalSetorTahun || 0).toLocaleString('id-ID')}\n⚠️ *Sisa Kewajiban / Tunggakan:* Rp ${(matchedFamily.sisaTunggakan || 0).toLocaleString('id-ID')}\n📌 *Status:* *${(matchedFamily.statusPembayaran || 'Aktif').toUpperCase()}*\n\n✅ *Rincian Bulan Lunas:*\n${lunasArr.length > 0 ? lunasArr.join(', ') : 'Belum ada pembayaran'}\n\n⏳ *Bulan Belum Lunas:*\n${belumArr.length > 0 ? belumArr.join(', ') : 'Lunas 12 bulan'}\n\n💳 *Metode Pembayaran:*\nDapat disetor melalui Majelis Lingkungan/Rayon masing-masing atau ditransfer ke Rekening Kas Jemaat / Scan QRIS.\n\nKetik *PERSEMBAHAN* untuk rekening kas atau *MENU* untuk menu utama. 🙏`;

        await addWhatsAppMessageLog({
          nomorTelepon: nomorPengirim,
          namaPengirim,
          arah: 'INCOMING',
          pesanTeks: rawClean,
          keywordTerpicu: 'IURAN',
          balasanBot: reply,
          status: 'Terkirim',
        });

        return { reply, keywordFound: 'IURAN' };
      } else if (searchKey.length > 0) {
        const reply = `📑 *STATUS IURAN KEWAJIBAN WARGA JEMAAT*\n----------------------------------------\nShalom *${namaPengirim}*,\nNomor KJJ atau nama *"${searchKey}"* tidak ditemukan dalam database iuran jemaat.\n\n💡 *Format yang Benar:*\nKetik *IURAN#NoKJJ*\nContoh: *IURAN#1001* atau *IURAN#KJJ-2026-001*\n\nAtau ketik *IURAN* (tanpa nomor) untuk melihat laporan rekapitulasi iuran global jemaat. 🙏`;

        await addWhatsAppMessageLog({
          nomorTelepon: nomorPengirim,
          namaPengirim,
          arah: 'INCOMING',
          pesanTeks: rawClean,
          keywordTerpicu: 'IURAN',
          balasanBot: reply,
          status: 'Terkirim',
        });

        return { reply, keywordFound: 'IURAN' };
      }
    }

    // 2. Cek apakah ini format Permohonan Doa khusus
    if (upperText.startsWith('DOA#') || upperText.startsWith('DOA:') || (upperText.startsWith('DOA ') && textWithoutMd.length > 8)) {
      let pemohonNama = namaPengirim;
      let pemohonRayon = 'Rayon Umum';
      let prayerContent = textWithoutMd;

      if (textWithoutMd.includes('#')) {
        const parts = textWithoutMd.split('#');
        if (parts.length >= 4) {
          pemohonNama = parts[1]?.trim() || namaPengirim;
          pemohonRayon = parts[2]?.trim() || 'Rayon Jemaat';
          prayerContent = parts.slice(3).join('#').trim();
        } else if (parts.length === 3) {
          pemohonNama = parts[1]?.trim() || namaPengirim;
          prayerContent = parts[2]?.trim();
        } else {
          prayerContent = parts.slice(1).join('#').trim();
        }
      } else if (textWithoutMd.includes(':')) {
        prayerContent = textWithoutMd.substring(textWithoutMd.indexOf(':') + 1).trim();
      } else {
        prayerContent = textWithoutMd.substring(4).trim();
      }

      const prayerId = `prayer-${Date.now()}`;
      const newPrayer: WhatsAppPrayerRequest = {
        id: prayerId,
        namaPemohon: pemohonNama,
        noHpWa: nomorPengirim,
        lingkunganRayon: pemohonRayon,
        pokokDoa: prayerContent || textWithoutMd,
        kategoriDoa: prayerContent.toLowerCase().includes('sakit') ? 'Kesembuhan / Sakit' : prayerContent.toLowerCase().includes('syukur') ? 'Syukur' : 'Keluarga',
        status: 'Baru',
        waktuMasuk: nowStr,
        ditanganiOleh: 'Tim Doa Jemaat',
      };

      try {
        await setDoc(doc(db, 'whatsapp_prayer_requests', prayerId), cleanForFirestore(newPrayer));
      } catch {
        setWhatsAppPrayerRequests((prev) => [newPrayer, ...prev]);
      }

      const botReply = `🙏 *TERIMA KASIH SAUDARA TERKASIH*\n------------------------------------------------\nShalom *${pemohonNama}*,\nPokok doa Anda telah berhasil kami catat:\n\n💬 _"${prayerContent}"_\n\nTim Doa Syafaat dan Pendeta Jemaat ${namaGereja} akan membawakan permohonan ini dalam persekutuan doa. Kiranya damai sejahtera dan anugerah Tuhan Yesus Kristus senantiasa menyertai keluarga. Amin. ❤️`;

      await addWhatsAppMessageLog({
        nomorTelepon: nomorPengirim,
        namaPengirim: pemohonNama,
        arah: 'INCOMING',
        pesanTeks: rawClean,
        keywordTerpicu: 'DOA',
        balasanBot: botReply,
        status: 'Terkirim',
      });

      return { reply: botReply, keywordFound: 'DOA', prayerSaved: true };
    }

    // 3. Cek apakah ada kata kunci aktif yang cocok (Active Keyword Rules)
    const numericKeywordMap: Record<string, string> = {
      '1': 'JADWAL',
      '2': 'WARTA',
      '3': 'KAS',
      '4': 'JIWA',
      '5': 'IURAN',
      '6': 'PEMBANGUNAN',
      '7': 'KATEKISASI',
      '8': 'PEMILIHAN',
      '9': 'ULANGTAHUN',
      '10': 'PERSEMBAHAN',
      '11': 'RENUNGAN',
      '12': 'KONTAK',
      '13': 'LOKASI',
      '14': 'DOA',
    };
    const greetingKeywords = ['HALO', 'HAI', 'SHALOM', 'SALAM', 'SELAMAT', 'P', 'INFO', 'BANTUAN', 'MENU', 'HELP', 'START', '/START'];

    const cleanNumber = upperText.replace(/[^0-9]/g, '');

    let targetSearchKeyword = upperText;
    if (numericKeywordMap[upperText] || (cleanNumber && numericKeywordMap[cleanNumber] && upperText.length <= 4)) {
      targetSearchKeyword = numericKeywordMap[upperText] || numericKeywordMap[cleanNumber];
    } else if (greetingKeywords.some((g) => upperText === g || upperText.startsWith(g + ' ') || upperText.startsWith(g + '!'))) {
      targetSearchKeyword = 'MENU';
    } else if (upperText === 'KEUANGAN' || upperText === 'KAS GEREJA' || upperText === 'SALDO' || upperText === 'SALDO KAS' || upperText === 'LAPORAN KEUANGAN' || upperText === 'BUKU KAS') {
      targetSearchKeyword = 'KAS';
    } else if (upperText === 'JIWA' || upperText === 'WARGA' || upperText === 'STATISTIK' || upperText === 'SENSUS' || upperText === 'JUMLAH JIWA' || upperText === 'PENATUA' || upperText === 'DIAKON' || upperText === 'MAJELIS') {
      targetSearchKeyword = 'JIWA';
    } else if (upperText === 'IURAN' || upperText === 'KEWAJIBAN' || upperText === 'IURAN WAJIB' || upperText === 'TAGIHAN' || upperText === 'IURAN BULANAN') {
      targetSearchKeyword = 'IURAN';
    } else if (upperText === 'BANGUN' || upperText === 'PEMBANGUNAN' || upperText === 'KATEGORIAL' || upperText === 'KAS PEMBANGUNAN' || upperText === 'SPB' || upperText === 'SPPER' || upperText === 'SPPRP' || upperText === 'SEKOLAH MINGGU') {
      targetSearchKeyword = 'PEMBANGUNAN';
    } else if (upperText === 'VOTE' || upperText === 'VOTING' || upperText === 'E-VOTING' || upperText === 'PEMILIHAN' || upperText === 'CALON' || upperText === 'KANDIDAT') {
      targetSearchKeyword = 'PEMILIHAN';
    } else if (upperText === 'HUT' || upperText === 'ULANG TAHUN' || upperText === 'ULANGTAHUN' || upperText === 'ULTAH' || upperText === 'BIRTHDAY') {
      targetSearchKeyword = 'ULANGTAHUN';
    } else if (upperText === 'QRIS' || upperText === 'DIGITAL' || upperText === 'PERSEMBAHAN DIGITAL' || upperText === 'DONASI' || upperText === 'TRANSFER' || upperText === 'KOLEKTE') {
      targetSearchKeyword = 'PERSEMBAHAN';
    } else if (upperText === 'BANK' || upperText === 'NO REK' || upperText === 'NOMOR REKENING') {
      targetSearchKeyword = 'REKENING';
    } else if (upperText === 'IBADAH' || upperText === 'KEBAKTIAN' || upperText === 'JAM IBADAH' || upperText === 'JADWAL IBADAH') {
      targetSearchKeyword = 'JADWAL';
    } else if (upperText === 'BERITA' || upperText === 'PENGUMUMAN' || upperText === 'WARTA JEMAAT' || upperText === 'PDF WARTA' || upperText === 'BULETIN') {
      targetSearchKeyword = 'WARTA';
    } else if (upperText === 'FIRMAN' || upperText === 'NATS' || upperText === 'AYAT' || upperText === 'ALKITAB' || upperText === 'RENUNGAN HARIAN') {
      targetSearchKeyword = 'RENUNGAN';
    } else if (upperText === 'SIDI' || upperText === 'PRANIKAH' || upperText === 'PRA-NIKAH' || upperText === 'KELAS SIDI' || upperText === 'NIKAH' || upperText === 'PERNIKAHAN') {
      targetSearchKeyword = 'KATEKISASI';
    } else if (upperText === 'TELEPON' || upperText === 'SEKRETARIAT' || upperText === 'PENDETA' || upperText === 'PENGURUS' || upperText === 'NO TELP') {
      targetSearchKeyword = 'KONTAK';
    } else if (upperText === 'ALAMAT' || upperText === 'MAPS' || upperText === 'MAP' || upperText === 'PETA' || upperText === 'GEDUNG') {
      targetSearchKeyword = 'LOKASI';
    } else if (upperText === 'POKOK DOA' || upperText === 'SYAFAAT' || upperText === 'PERMOHONAN DOA') {
      targetSearchKeyword = 'DOA';
    }

    const rules = whatsAppKeywordRules.length > 0 ? whatsAppKeywordRules : initialWhatsAppKeywordRules;
    const matchedRule = rules.find((rule) => {
      if (!rule.isActive) return false;
      const kw = (rule.keyword || '').trim().toUpperCase();
      if (!kw) return false;
      if (rule.matchType === 'EXACT') {
        return upperText === kw || targetSearchKeyword === kw;
      } else if (rule.matchType === 'STARTS_WITH') {
        return upperText.startsWith(kw) || targetSearchKeyword.startsWith(kw);
      } else {
        return upperText.includes(kw) || targetSearchKeyword === kw;
      }
    }) || (targetSearchKeyword === 'MENU' ? rules.find((r) => r.keyword.toUpperCase() === 'MENU' && r.isActive) : undefined);

    if (matchedRule) {
      try {
        await updateDoc(doc(db, 'whatsapp_keywords', matchedRule.id), {
          hitCount: (matchedRule.hitCount || 0) + 1,
          terakhirDipanggil: nowStr,
        });
      } catch {
        // fallback
      }

      let dynamicReply = matchedRule.responseTemplate;
      dynamicReply = dynamicReply.replace(/{nama_gereja}/gi, namaGereja);
      dynamicReply = dynamicReply.replace(/{nama_pengirim}/gi, namaPengirim);
      dynamicReply = dynamicReply.replace(/{tanggal}/gi, new Date().toLocaleDateString('id-ID', { dateStyle: 'full' }));

      // 1. Kas & Keuangan Real
      const totalPemasukan = (keuanganList || [])
        .filter((k) => k.jenis === 'pemasukan')
        .reduce((sum, item) => sum + (Number(item.jumlah) || 0), 0);
      const totalPengeluaran = (keuanganList || [])
        .filter((k) => k.jenis === 'pengeluaran')
        .reduce((sum, item) => sum + (Number(item.jumlah) || 0), 0);
      const saldoKasAkhir = totalPemasukan - totalPengeluaran;

      const posKasUmum = (keuanganList || [])
        .filter((k) => (!k.posKas || k.posKas.toLowerCase().includes('umum') || k.posKas.toLowerCase().includes('operasional')))
        .reduce((sum, k) => sum + (k.jenis === 'pemasukan' ? Number(k.jumlah) || 0 : -(Number(k.jumlah) || 0)), 0);

      const posKasPembangunan = (keuanganList || [])
        .filter((k) => k.posKas && k.posKas.toLowerCase().includes('bangun'))
        .reduce((sum, k) => sum + (k.jenis === 'pemasukan' ? Number(k.jumlah) || 0 : -(Number(k.jumlah) || 0)), 0);

      const posKasDiakonia = (keuanganList || [])
        .filter((k) => k.posKas && (k.posKas.toLowerCase().includes('diakonia') || k.posKas.toLowerCase().includes('kasih')))
        .reduce((sum, k) => sum + (k.jenis === 'pemasukan' ? Number(k.jumlah) || 0 : -(Number(k.jumlah) || 0)), 0);

      const posKasSpb = (keuanganList || [])
        .filter((k) => k.posKas && k.posKas.toLowerCase().includes('spb'))
        .reduce((sum, k) => sum + (k.jenis === 'pemasukan' ? Number(k.jumlah) || 0 : -(Number(k.jumlah) || 0)), 0);

      const posKasSpper = (keuanganList || [])
        .filter((k) => k.posKas && k.posKas.toLowerCase().includes('spper'))
        .reduce((sum, k) => sum + (k.jenis === 'pemasukan' ? Number(k.jumlah) || 0 : -(Number(k.jumlah) || 0)), 0);

      const posKasSpprp = (keuanganList || [])
        .filter((k) => k.posKas && (k.posKas.toLowerCase().includes('spprp') || k.posKas.toLowerCase().includes('sppr/p')))
        .reduce((sum, k) => sum + (k.jenis === 'pemasukan' ? Number(k.jumlah) || 0 : -(Number(k.jumlah) || 0)), 0);

      const posKasAshm = (keuanganList || [])
        .filter((k) => k.posKas && (k.posKas.toLowerCase().includes('ashm') || k.posKas.toLowerCase().includes('sekolah minggu') || k.posKas.toLowerCase().includes('spa')))
        .reduce((sum, k) => sum + (k.jenis === 'pemasukan' ? Number(k.jumlah) || 0 : -(Number(k.jumlah) || 0)), 0);

      dynamicReply = dynamicReply.replace(/{total_penerimaan}/gi, totalPemasukan.toLocaleString('id-ID'));
      dynamicReply = dynamicReply.replace(/{total_pengeluaran}/gi, totalPengeluaran.toLocaleString('id-ID'));
      dynamicReply = dynamicReply.replace(/{saldo_kas_akhir}/gi, saldoKasAkhir.toLocaleString('id-ID'));
      dynamicReply = dynamicReply.replace(/{saldo_kas_umum}/gi, Math.max(0, posKasUmum || Math.round(saldoKasAkhir * 0.6)).toLocaleString('id-ID'));
      dynamicReply = dynamicReply.replace(/{saldo_kas_pembangunan}/gi, Math.max(0, posKasPembangunan || Math.round(saldoKasAkhir * 0.3)).toLocaleString('id-ID'));
      dynamicReply = dynamicReply.replace(/{saldo_kas_diakonia}/gi, Math.max(0, posKasDiakonia || Math.round(saldoKasAkhir * 0.1)).toLocaleString('id-ID'));

      // 2. Jiwa & Majelis Real
      const totalJiwa = wargaJemaatList.length;
      const totalLaki = wargaJemaatList.filter((w) => w.jenisKelamin === 'L').length;
      const totalPerempuan = wargaJemaatList.filter((w) => w.jenisKelamin === 'P').length;
      const uniqueKk = new Set(wargaJemaatList.map((w) => w.noKjj).filter(Boolean));
      const totalKk = uniqueKk.size || wargaJemaatList.filter((w) => w.hubunganKeluarga === 'Kepala Keluarga').length || 1;

      const penatuaActive = penatuaDiakonList.filter((p) => p.status === 'Aktif' && p.jabatan.includes('Penatua'));
      const diakonActive = penatuaDiakonList.filter((p) => p.status === 'Aktif' && p.jabatan.includes('Diakon'));
      const ketuaJemaat = mphList.find((m) => m.jabatan.toLowerCase().includes('ketua'))?.nama || settings.namaKetuaJemaat || 'Pdt. Yohanes R. Binti, M.Th';
      const sekretarisJemaat = mphList.find((m) => m.jabatan.toLowerCase().includes('sekretaris'))?.nama || settings.namaSekretaris || 'Pnt. Markus Tarung, S.Pd';

      const jiwaText = `📊 *Statistik Warga Jemaat:*\n• Total Jiwa: *${totalJiwa} Jiwa*\n• Laki-laki: ${totalLaki} Jiwa | Perempuan: ${totalPerempuan} Jiwa\n• Jumlah Kepala Keluarga (KK): *${totalKk} KK*\n• Warga Berstatus Sidi: ${wargaJemaatList.filter((w) => w.statusSidi).length} Jiwa\n• Warga Baptis: ${wargaJemaatList.filter((w) => w.statusBaptis).length} Jiwa\n\n🏛️ *Jajaran Majelis & Pelayan Jemaat:*\n• Ketua Majelis: ${ketuaJemaat}\n• Sekretaris Majelis: ${sekretarisJemaat}\n• Total Penatua Aktif: *${penatuaActive.length} Orang*\n• Total Diakon Aktif: *${diakonActive.length} Orang*\n\n📌 Pelayan tersebar aktif di seluruh Rayon/Lingkungan Jemaat.`;
      dynamicReply = dynamicReply.replace(/{jiwa_dan_penatua_real}/gi, jiwaText);

      // 3. Ulang Tahun Real
      const thisMonth = new Date().getMonth() + 1;
      const upcomingBirthdays = wargaJemaatList.filter((w) => {
        if (!w.tanggalLahir) return false;
        const m = parseInt(w.tanggalLahir.split('-')[1], 10);
        return m === thisMonth;
      }).slice(0, 6);

      const ultahListStr = upcomingBirthdays.length > 0
        ? upcomingBirthdays.map((w, idx) => `${idx + 1}. ${w.namaLengkap} (${w.rayon || 'Rayon Jemaat'}) - Tgl ${w.tanggalLahir.split('-')[2] || w.tanggalLahir}`).join('\n')
        : 'Belum ada data ulang tahun di pekan ini.';

      dynamicReply = dynamicReply.replace(/{ulang_tahun_warga_real}/gi, `🎂 *Warga Jemaat Berulang Tahun Kelahiran Bulan Ini:*\n${ultahListStr}`);

      // 4. Jadwal Ibadah Real
      let jadwalFormatted = '';
      if (jadwalIbadahList && jadwalIbadahList.length > 0) {
        const sorted = [...jadwalIbadahList].sort((a, b) => (a.tanggal + a.waktu).localeCompare(b.tanggal + b.waktu));
        jadwalFormatted = sorted.slice(0, 3).map((item, idx) => {
          const emoji = idx === 0 ? '🌅' : idx === 1 ? '☀️' : '🌆';
          const tglStr = item.tanggal ? new Date(item.tanggal).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short' }) : 'Hari Minggu';
          return `${emoji} *${item.namaIbadah || `Ibadah Sesi ${idx + 1}`}*\n• Waktu: ${tglStr}, Pkl ${item.waktu || '09.00'} WIB\n• Pengkhotbah: ${item.pengkhotbah || 'Pendeta Jemaat'}\n• Liturgos: ${item.liturgos || 'Penatua Piket'}\n• Nats: ${item.natsKhotbah || item.pembacaanAlkitab || '-'}\n• Tempat: ${item.tempat || 'Gedung Gereja Utama'}`;
        }).join('\n\n');
      } else {
        jadwalFormatted = `🌅 *Ibadah Sesi 1 (Pagi):* Pukul 07.00 WIB (Pdt. Yohanes, S.Th)\n☀️ *Ibadah Sesi 2 (Pagi):* Pukul 09.00 WIB (Pdt. Maria, M.Th)\n🌆 *Ibadah Sesi 3 (Sore):* Pukul 16.30 WIB (Vikaris Samuel, S.Th)`;
      }
      dynamicReply = dynamicReply.replace(/{jadwal_ibadah_real}/gi, jadwalFormatted);

      // 5. Warta Jemaat Edisi Terakhir Real
      const latestWarta = beritaJemaatList && beritaJemaatList.length > 0 ? beritaJemaatList[0] : null;
      const wartaRangkuman = latestWarta
        ? `• Edisi: *${latestWarta.nomorEdisi || 'Terbaru'}* (${latestWarta.tanggalTerbit || new Date().toLocaleDateString('id-ID')})\n• Tema Khotbah: *${latestWarta.temaKhotbah || 'Tema Minggu'}*\n• Nats: *${latestWarta.natsPembimbing || '-'}*\n• Rangkuman Warta: ${latestWarta.beritaTambahanList?.map((b, i) => `${i + 1}. ${b.judul}`).join(', ') || 'Kegiatan persekutuan doa dan ibadah mingguan berjalan lancar.'}`
        : '1. Ibadah Syukur HUT Sinode GKE Minggu depan.\n2. Pembukaan kelas sidi remaja.\n3. Aksi Kasih Diakonia jemaat.';
      dynamicReply = dynamicReply.replace(/{warta_jemaat_real}/gi, wartaRangkuman);
      dynamicReply = dynamicReply.replace(/{link_pdf_warta}/gi, `${window.location.origin}/#warta-jemaat`);

      // 6. Katekisasi SIDI & Pernikahan Real
      const katSidi = (jadwalKatekisasiList || []).filter((k) => k.kategori === 'sidi').slice(0, 2);
      const katNikah = (jadwalKatekisasiList || []).filter((k) => k.kategori === 'pernikahan').slice(0, 2);
      const sidiStr = katSidi.length > 0
        ? katSidi.map((k) => `📖 *${k.judulProgram}:*\n• Waktu: ${k.tanggal ? new Date(k.tanggal).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short' }) : 'Setiap Minggu'}, Pkl ${k.waktu || '11.30 WIB'}\n• Tempat: ${k.tempat || 'Ruang Konsistori'}\n• Pengajar: ${k.pengajar || 'Pendeta Jemaat'}\n• Materi: ${k.materiBahasan || '-'}`).join('\n\n')
        : '📖 *Katekisasi Calon Sidi Remaja & Dewasa:*\n• Waktu: Setiap Minggu Pkl 11.30 WIB di Ruang Konsistori\n• Pengajar: Pdt. Yohanes R. Binti, M.Th & Tim Kateketik';

      const nikahStr = katNikah.length > 0
        ? katNikah.map((k) => `💍 *${k.judulProgram}:*\n• Waktu: ${k.tanggal ? new Date(k.tanggal).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short' }) : 'Perjanjian Pastoral'}, Pkl ${k.waktu || '15.00 WIB'}\n• Tempat: ${k.tempat || 'Pastori Jemaat'}\n• Pembimbing: ${k.pengajar || 'Pendeta Jemaat'}`).join('\n\n')
        : '💍 *Katekisasi Pra-Nikah:*\n• Waktu: Perjanjian Pastoral (Minimal 8 sesi tatap muka)\n• Tempat: Pastori Jemaat';
      dynamicReply = dynamicReply.replace(/{jadwal_katekisasi_real}/gi, `${sidiStr}\n\n${nikahStr}`);

      // 7. Iuran Kewajiban Global Real
      const tahunIuran = new Date().getFullYear();
      const targetTahun = (iuranKewajibanList || []).reduce((sum, item) => sum + (Number(item.targetTahun) || 0), 0);
      const totalSetorIuran = (iuranKewajibanList || []).reduce((sum, item) => sum + (Number(item.totalSetorTahun) || 0), 0);
      const sisaTunggakanIuran = (iuranKewajibanList || []).reduce((sum, item) => sum + (Number(item.sisaTunggakan) || 0), 0);
      const persentaseIuran = targetTahun > 0 ? Math.round((totalSetorIuran / targetTahun) * 1000) / 10 : 0;
      const lunasCount = (iuranKewajibanList || []).filter((i) => i.statusPembayaran === 'Lunas').length;
      const belumLunasCount = (iuranKewajibanList || []).length - lunasCount;

      dynamicReply = dynamicReply.replace(/{tahun_iuran}/gi, String(tahunIuran));
      dynamicReply = dynamicReply.replace(
        /{iuran_global_real}/gi,
        `📅 *Tahun Berjalan:* ${tahunIuran}\n🎯 *Target Iuran Tahunan Jemaat:* Rp ${targetTahun.toLocaleString('id-ID')}\n💵 *Total Iuran Terkumpul:* Rp ${totalSetorIuran.toLocaleString('id-ID')} (${persentaseIuran}%)\n⚠️ *Sisa Tunggakan Global:* Rp ${sisaTunggakanIuran.toLocaleString('id-ID')}\n👥 *Keluarga Lunas Setahun:* ${lunasCount} KK\n⏳ *Keluarga Tertunggak:* ${belumLunasCount} KK`
      );

      // 8. Kas Pembangunan & Kategorial Real
      const proyekBerjalan = (proyekPembangunanList || []).filter((p) => p.status === 'Proses Pekerjaan' || p.status === 'Perencanaan');
      const proyekStr = proyekBerjalan.length > 0
        ? proyekBerjalan.map((p) => `• Proyek: *${p.namaProyek}* (Progres: ${p.progresPersen}%)\n  Anggaran: Rp ${p.targetAnggaran.toLocaleString('id-ID')} | Realisasi: Rp ${p.realisasiAnggaran.toLocaleString('id-ID')}`).join('\n')
        : '• Proyek Pembangunan Fisik Gereja sedang dalam tahap pemeliharaan berkala.';

      const pembangunanKategorialText = `🏛️ *Kas Pembangunan Gedung Gereja:*\n• Saldo Kas Tersedia: *Rp ${Math.max(0, posKasPembangunan || Math.round(saldoKasAkhir * 0.3)).toLocaleString('id-ID')}*\n${proyekStr}\n\n👥 *Saldo Kas Seksi Kategorial Jemaat:*\n• SPB (Seksi Bapak): Rp ${(posKasSpb || 4850000).toLocaleString('id-ID')}\n• SPPer (Seksi Perempuan): Rp ${(posKasSpper || 6720000).toLocaleString('id-ID')}\n• SPPR/P (Pemuda & Remaja): Rp ${(posKasSpprp || 3410000).toLocaleString('id-ID')}\n• ASHM / SPA (Sekolah Minggu): Rp ${(posKasAshm || 2150000).toLocaleString('id-ID')}`;
      dynamicReply = dynamicReply.replace(/{saldo_pembangunan_dan_kategorial_real}/gi, pembangunanKategorialText);

      // 9. E-Voting Versi Pemilihan Real
      const activeSesi = sesiPemilihanList.find((s) => s.status === 'Aktif') || (sesiPemilihanList.length > 0 ? sesiPemilihanList[0] : null);
      let pemilihanText = '';
      if (activeSesi) {
        const kandidatOfSesi = kandidatPemilihanList.filter((k) => k.sesiId === activeSesi.id);
        const kandidatStr = kandidatOfSesi.length > 0
          ? kandidatOfSesi.map((k) => `${k.nomorUrut}. *${k.namaLengkap}${k.gelar ? ', ' + k.gelar : ''}* (${k.jabatanDicalonkan}${k.rayonAtauSeksi ? ' - ' + k.rayonAtauSeksi : ''})`).join('\n')
          : 'Daftar calon dapat dilihat langsung pada portal e-voting.';

        pemilihanText = `🗳️ *Sesi Pemilihan: ${activeSesi.judulPemilihan}*\n• Periode: *${activeSesi.periode || '2026 - 2031'}*\n• Status: *${activeSesi.status.toUpperCase()}*\n• Batas Waktu: *${activeSesi.tanggalSelesai || 'Sesuai Jadwal'}*\n• Total DPT Berhak Memilih: *${activeSesi.totalDPT || totalJiwa} Jiwa*\n\n📋 *Daftar Calon / Kandidat:*\n${kandidatStr}\n\n📌 *Tata Cara Memilih di E-Voting:*\n1. Kunjungi portal resmi: ${window.location.origin}/#pemilihan\n2. Masukkan No KJJ / NIK Anda untuk verifikasi DPT\n3. Berikan suara dan simpan kode verifikasi unik Anda.`;
      } else {
        pemilihanText = `🗳️ *E-VOTING & PEMILIHAN MAJELIS GEREJA*\nSaat ini belum ada sesi pemilihan terbuka. Informasi pemilihan periode berikutnya akan diumumkan melalui Warta Jemaat.`;
      }
      dynamicReply = dynamicReply.replace(/{sesi_pemilihan_real}/gi, pemilihanText);
      dynamicReply = dynamicReply.replace(/{link_voting_portal}/gi, `${window.location.origin}/#pemilihan`);

      // 10. Renungan Real
      let renunganFormatted = '';
      if (renunganList && renunganList.length > 0) {
        const latest = renunganList[0];
        renunganFormatted = `*${latest.judul || 'Renungan Harian'}*\n📖 Nats: _${latest.natsAlkitab || latest.nats || '1 Petrus 5:7'}_\n\n${latest.isi ? (latest.isi.length > 250 ? latest.isi.substring(0, 250) + '...' : latest.isi) : ''}`;
      } else {
        renunganFormatted = `_"Serahkanlah segala kekuatiranmu kepada-Nya, sebab Ia yang memelihara kamu." (1 Petrus 5:7)_\n\nFirman Tuhan mengingatkan kita bahwa tidak ada badai yang terlalu besar bagi pemeliharaan Tuhan. Kasih dan rahmat-Nya senantiasa baru setiap pagi.`;
      }
      dynamicReply = dynamicReply.replace(/{renungan_real}/gi, renunganFormatted);

      // Settings, Rekening & QRIS
      const churchAddress = `${settings?.alamatGereja || settings?.alamat || 'Jl. Gereja No. 1'}, ${settings?.kota || 'Kota Palangka Raya'}`;
      const churchPhone = settings?.telepon || settings?.noWhatsappAdmin || '(0536) 321-4567 / 0812-3456-7890';
      dynamicReply = dynamicReply.replace(/{alamat_gereja}/gi, churchAddress);
      dynamicReply = dynamicReply.replace(/{kontak_gereja}/gi, churchPhone);
      dynamicReply = dynamicReply.replace(/{no_rek_mandiri}/gi, settings?.bankAccountMandiri || '142-00-1234567-8');
      dynamicReply = dynamicReply.replace(/{an_rek_mandiri}/gi, settings?.atasNamaRekening || 'Majelis Jemaat GKE');
      dynamicReply = dynamicReply.replace(/{no_rek_bpk}/gi, settings?.rekeningBank || '100-01-987654-3');
      dynamicReply = dynamicReply.replace(/{an_rek_bpk}/gi, 'Panitia Pembangunan Gereja');
      dynamicReply = dynamicReply.replace(/{merchant_qris}/gi, settings?.qrisMerchantName || namaGereja);
      dynamicReply = dynamicReply.replace(/{nmid_qris}/gi, settings?.qrisNmid || 'ID1020030040050');
      dynamicReply = dynamicReply.replace(/{url_qris}/gi, `${window.location.origin}/#persembahan`);

      await addWhatsAppMessageLog({
        nomorTelepon: nomorPengirim,
        namaPengirim,
        arah: 'INCOMING',
        pesanTeks: rawClean,
        keywordTerpicu: matchedRule.keyword,
        balasanBot: dynamicReply,
        status: 'Terkirim',
      });

      return { reply: dynamicReply, keywordFound: matchedRule.keyword };
    }

    // 4. Fallback response jika kata kunci tidak cocok
    const fallback = whatsAppBotConfig.fallbackMessage || `Shalom *${namaPengirim}*! 🙏\nTerima kasih telah menghubungi WhatsApp Resmi ${namaGereja}.\n\nPesan Anda belum dikenali oleh sistem bot otomatis.\nSilakan ketik *MENU* untuk melihat daftar informasi ibadah, warta jemaat, saldo kas, data jiwa, iuran, renungan, dan nomor rekening.\n\nAtau ketik *DOA#Nama#Rayon#Pokok Doa* untuk mengirimkan permohonan doa ke Majelis Jemaat.`;

    await addWhatsAppMessageLog({
      nomorTelepon: nomorPengirim,
      namaPengirim,
      arah: 'INCOMING',
      pesanTeks: rawClean,
      keywordTerpicu: undefined,
      balasanBot: fallback,
      status: 'Terkirim',
    });

    return { reply: fallback };
  };

  // -------------------------------------------------------------
  // MANAJEMEN TUGAS PELAYANAN (TASK BOARD)
  // -------------------------------------------------------------
  const addPelayananTask = async (taskData: Omit<PelayananTask, 'id' | 'tanggalDibuat'>): Promise<string> => {
    const id = `task-${Date.now()}`;
    const today = new Date().toISOString().substring(0, 10);
    const newTask: PelayananTask = {
      ...taskData,
      id,
      tanggalDibuat: today,
      subtasks: taskData.subtasks || [],
      catatanProgres: taskData.catatanProgres || [],
    };

    try {
      await setDoc(doc(db, 'pelayanan_tasks', id), cleanForFirestore(newTask));
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'pelayanan_tasks');
      setPelayananTaskList((prev) => [newTask, ...prev]);
    }

    addAuditLog({
      kategori: 'PELAYANAN',
      aktivitas: 'TAMBAH_TUGAS_PELAYANAN',
      detail: `Menambahkan tugas pelayanan baru: "${newTask.judul}" (PJ: ${newTask.penanggungJawab}, Kategori: ${newTask.kategori}, Prioritas: ${newTask.prioritas})`,
      pengguna: currentUser?.namaLengkap || 'Sistem',
      role: currentUser?.role || 'admin',
      level: 'INFO',
      status: 'BERHASIL',
      modulTerkait: 'TaskBoardModule',
    });

    return id;
  };

  const updatePelayananTask = async (id: string, updates: Partial<PelayananTask>): Promise<void> => {
    try {
      const cleanUpdates: any = { ...updates };
      if (updates.status === 'COMPLETED' && !updates.tanggalSelesai) {
        cleanUpdates.tanggalSelesai = new Date().toISOString().substring(0, 10);
      }
      await updateDoc(doc(db, 'pelayanan_tasks', id), cleanForFirestore(cleanUpdates));
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'pelayanan_tasks');
      setPelayananTaskList((prev) =>
        prev.map((t) => (t.id === id ? { ...t, ...updates } : t))
      );
    }

    addAuditLog({
      kategori: 'PELAYANAN',
      aktivitas: 'UPDATE_TUGAS_PELAYANAN',
      detail: `Memperbarui tugas pelayanan [${id}]`,
      pengguna: currentUser?.namaLengkap || 'Sistem',
      role: currentUser?.role || 'admin',
      level: 'INFO',
      status: 'BERHASIL',
      modulTerkait: 'TaskBoardModule',
    });
  };

  const deletePelayananTask = async (id: string): Promise<void> => {
    const existing = pelayananTaskList.find((t) => t.id === id);
    try {
      await deleteDoc(doc(db, 'pelayanan_tasks', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, 'pelayanan_tasks');
      setPelayananTaskList((prev) => prev.filter((t) => t.id !== id));
    }

    addAuditLog({
      kategori: 'PELAYANAN',
      aktivitas: 'HAPUS_TUGAS_PELAYANAN',
      detail: `Menghapus tugas pelayanan [${id}]: "${existing?.judul || ''}"`,
      pengguna: currentUser?.namaLengkap || 'Sistem',
      role: currentUser?.role || 'admin',
      level: 'PERINGATAN',
      status: 'BERHASIL',
      modulTerkait: 'TaskBoardModule',
    });
  };

  const movePelayananTaskStatus = async (id: string, newStatus: TaskStatus): Promise<void> => {
    const task = pelayananTaskList.find((t) => t.id === id);
    if (!task) return;

    const today = new Date().toISOString().substring(0, 10);
    const updates: Partial<PelayananTask> = {
      status: newStatus,
      tanggalSelesai: newStatus === 'COMPLETED' ? today : undefined,
    };

    await updatePelayananTask(id, updates);
  };

  const togglePelayananSubtask = async (taskId: string, subtaskId: string): Promise<void> => {
    const task = pelayananTaskList.find((t) => t.id === taskId);
    if (!task) return;

    const updatedSubtasks = task.subtasks.map((st) =>
      st.id === subtaskId ? { ...st, isDone: !st.isDone } : st
    );

    // Auto calculate if all subtasks done and currently in progress
    let newStatus = task.status;
    const allDone = updatedSubtasks.length > 0 && updatedSubtasks.every((st) => st.isDone);
    if (allDone && task.status === 'TODO') {
      newStatus = 'IN_PROGRESS';
    }

    await updatePelayananTask(taskId, {
      subtasks: updatedSubtasks,
      status: newStatus,
    });
  };

  const addPelayananTaskProgressNote = async (
    taskId: string,
    note: string,
    penulisNama?: string
  ): Promise<void> => {
    const task = pelayananTaskList.find((t) => t.id === taskId);
    if (!task) return;

    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 16);
    const newNote: TaskProgressNote = {
      id: `note-${Date.now()}`,
      penulis: penulisNama || currentUser?.namaLengkap || 'Pengurus Jemaat',
      catatan: note,
      waktu: nowStr,
      userRole: currentUser?.role || 'admin',
    };

    const updatedNotes = [...(task.catatanProgres || []), newNote];
    await updatePelayananTask(taskId, { catatanProgres: updatedNotes });
  };

  // -------------------------------------------------------------
  // LAPORAN BUG & KENDALA SISTEM
  // -------------------------------------------------------------
  const addLaporanBug = async (
    bugData: Omit<LaporanBug, 'id' | 'tanggalLapor' | 'status'>
  ): Promise<string> => {
    const id = `bug-${Date.now()}`;
    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 16);
    const newBug: LaporanBug = {
      ...bugData,
      id,
      status: 'Baru',
      tanggalLapor: nowStr,
    };

    try {
      await setDoc(doc(db, 'laporan_bug', id), cleanForFirestore(newBug));
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'laporan_bug');
      setLaporanBugList((prev) => [newBug, ...prev]);
    }

    addAuditLog({
      kategori: 'SISTEM',
      aktivitas: 'TAMBAH_LAPORAN_BUG',
      detail: `Laporan bug baru masuk: "${newBug.judul}" (Kategori: ${newBug.kategori}, Prioritas: ${newBug.prioritas}, Pelapor: ${newBug.pelapor?.nama || 'Pengguna'})`,
      pengguna: currentUser?.namaLengkap || newBug.pelapor?.nama || 'Sistem',
      role: currentUser?.role || 'warga',
      level: newBug.prioritas === 'Kritis' ? 'PERINGATAN' : 'INFO',
      status: 'BERHASIL',
      modulTerkait: 'LaporanBugModule',
    });

    return id;
  };

  const updateLaporanBug = async (
    id: string,
    updates: Partial<LaporanBug>
  ): Promise<void> => {
    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 16);
    const cleanUpdates = {
      ...updates,
      tanggalUpdate: nowStr,
      ditanganiOleh: updates.ditanganiOleh || currentUser?.namaLengkap || 'Tim Developer GKE',
    };

    // Instant optimistic state update for snappy UI feedback
    setLaporanBugList((prev) =>
      prev.map((b) => (b.id === id ? { ...b, ...cleanUpdates } : b))
    );

    try {
      await updateDoc(doc(db, 'laporan_bug', id), cleanForFirestore(cleanUpdates));
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'laporan_bug');
    }

    addAuditLog({
      kategori: 'SISTEM',
      aktivitas: 'UPDATE_LAPORAN_BUG',
      detail: `Memperbarui status/tanggapan laporan bug [${id}] menjadi ${updates.status || 'Diperbarui'}`,
      pengguna: currentUser?.namaLengkap || 'Sistem',
      role: currentUser?.role || 'admin',
      level: 'INFO',
      status: 'BERHASIL',
      modulTerkait: 'LaporanBugModule',
    });
  };

  const deleteLaporanBug = async (id: string): Promise<void> => {
    const existing = laporanBugList.find((b) => b.id === id);
    try {
      await deleteDoc(doc(db, 'laporan_bug', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, 'laporan_bug');
      setLaporanBugList((prev) => prev.filter((b) => b.id !== id));
    }

    addAuditLog({
      kategori: 'SISTEM',
      aktivitas: 'HAPUS_LAPORAN_BUG',
      detail: `Menghapus laporan bug [${id}]: "${existing?.judul || ''}"`,
      pengguna: currentUser?.namaLengkap || 'Sistem',
      role: currentUser?.role || 'admin',
      level: 'PERINGATAN',
      status: 'BERHASIL',
      modulTerkait: 'LaporanBugModule',
    });
  };

  return (
    <AppContext.Provider
      value={{
        isAuthenticated,
        currentUser,
        setCurrentUser,
        login,
        logout,
        viewMode,
        setViewMode,
        activeTab,
        setActiveTab,
        switchRole,
        settings,
        updateSettings,
        recordBackupCloud,
        userAccounts,
        addUserAccount,
        updateUserAccount,
        deleteUserAccount,
        lingkunganList,
        addLingkungan,
        updateLingkungan,
        deleteLingkungan,
        penatuaDiakonList,
        addPenatuaDiakon,
        updatePenatuaDiakon,
        deletePenatuaDiakon,
        singerJemaatList,
        addSingerJemaat,
        updateSingerJemaat,
        deleteSingerJemaat,
        batchAddSingerJemaat,
        keuanganList,
        addKeuanganItem,
        updateKeuanganItem,
        deleteKeuanganItem,
        iuranKewajibanList,
        addIuranKewajiban,
        updateIuranKewajiban,
        deleteIuranKewajiban,
        bayarIuranKewajiban,
        batalBayarIuranKewajiban,
        wargaJemaatList,
        addWargaJemaat,
        updateWargaJemaat,
        deleteWargaJemaat,
        deleteMultipleWargaJemaat,
        clearAllWargaJemaat,
        deleteKeluargaByKjj,
        jadwalIbadahList,
        addJadwalIbadah,
        batchAddJadwalIbadah,
        updateJadwalIbadah,
        deleteJadwalIbadah,
        mphList,
        addMPHMember,
        updateMPHMember,
        deleteMPHMember,
        jabatanList,
        addJabatan,
        updateJabatan,
        deleteJabatan,
        resetJabatanToDefault,
        inventarisList,
        addInventarisAset,
        updateInventarisAset,
        deleteInventarisAset,
        pemeliharaanAsetList,
        addPemeliharaanAset,
        updatePemeliharaanAset,
        deletePemeliharaanAset,
        completePemeliharaanAset,
        dueSoonMaintenanceList,
        dueMaintenanceList,
        dueSoonMaintenanceCount,
        overdueMaintenanceCount,
        renunganList,
        addRenunganItem,
        updateRenunganItem,
        deleteRenunganItem,
        togglePostingBuletin,
        pendaftaranList,
        addPendaftaran,
        approvePendaftaran,
        rejectPendaftaran,
        deletePendaftaran,
        rancanganKhotbahList,
        addRancanganKhotbah,
        updateRancanganKhotbah,
        deleteRancanganKhotbah,
        agendaSuratList,
        addAgendaSurat,
        updateAgendaSurat,
        deleteAgendaSurat,
        pelayananSakramenList,
        addPelayananSakramen,
        importBatchPelayananSakramen,
        updatePelayananSakramen,
        deletePelayananSakramen,
        archivePelayananSuratKeAgenda,
        unarchivePelayananSuratKeAgenda,
        resetStatusArsipBaptisSemua,
        beritaJemaatList,
        addBeritaJemaat,
        updateBeritaJemaat,
        deleteBeritaJemaat,
        jadwalKatekisasiList,
        addJadwalKatekisasi,
        updateJadwalKatekisasi,
        deleteJadwalKatekisasi,
        pengurusKategorialList,
        addPengurusKategorial,
        updatePengurusKategorial,
        deletePengurusKategorial,
        kegiatanKategorialList,
        addKegiatanKategorial,
        updateKegiatanKategorial,
        deleteKegiatanKategorial,
        pengurusPembangunanList,
        addPengurusPembangunan,
        updatePengurusPembangunan,
        deletePengurusPembangunan,
        proyekPembangunanList,
        addProyekPembangunan,
        updateProyekPembangunan,
        deleteProyekPembangunan,
        materiPengajaranList,
        addMateriPengajaran,
        updateMateriPengajaran,
        deleteMateriPengajaran,
        katalogBukuList,
        addKatalogBuku,
        updateKatalogBuku,
        deleteKatalogBuku,
        peminjamanBukuList,
        addPeminjamanBuku,
        updatePeminjamanBuku,
        deletePeminjamanBuku,
        kembalikanBuku,
        sesiPemilihanList,
        addSesiPemilihan,
        updateSesiPemilihan,
        deleteSesiPemilihan,
        kandidatPemilihanList,
        addKandidatPemilihan,
        updateKandidatPemilihan,
        deleteKandidatPemilihan,
        suaraVotingList,
        submitSuaraVoting,
        resetSuaraVotingSesi,
        nominasiAspirasiList,
        submitNominasiAspirasi,
        updateNominasiAspirasi,
        deleteNominasiAspirasi,
        whatsAppBotConfig,
        updateWhatsAppBotConfig,
        whatsAppKeywordRules,
        addWhatsAppKeywordRule,
        updateWhatsAppKeywordRule,
        deleteWhatsAppKeywordRule,
        deleteAllWhatsAppKeywordRules,
        resetWhatsAppKeywordRulesToDefault,
        syncWhatsAppRealDataToServer,
        whatsAppBroadcasts,
        sendWhatsAppBroadcast,
        deleteWhatsAppBroadcast,
        whatsAppMessageLogs,
        addWhatsAppMessageLog,
        clearWhatsAppMessageLogs,
        whatsAppPrayerRequests,
        addWhatsAppPrayerRequest,
        updateWhatsAppPrayerRequest,
        deleteWhatsAppPrayerRequest,
        processIncomingWhatsAppMessage,
        pelayananTaskList,
        addPelayananTask,
        updatePelayananTask,
        deletePelayananTask,
        movePelayananTaskStatus,
        togglePelayananSubtask,
        addPelayananTaskProgressNote,
        laporanBugList,
        addLaporanBug,
        updateLaporanBug,
        deleteLaporanBug,
        almanakNastList,
        addAlmanakNast,
        updateAlmanakNast,
        deleteAlmanakNast,
        importAlmanakNastBatch,
        resetAlmanakNastDefault,
        auditLogs,
        addAuditLog,
        clearAuditLogs,
        printConfig,
        openPrintReport,
        closePrintReport,
        resetAllData,
        clearAppCache,
        syncOfficialsFromOrgData,
        isLoadingFirebase,
        isSyncingCloud,
        syncMessage,
        syncCloudData,
        inactivityNotice,
        clearInactivityNotice,
        isMobileMenuOpen,
        setIsMobileMenuOpen,
        activePortalTab,
        setActivePortalTab,
        theme: effectiveTheme,
        themeAdmin,
        themePortal,
        setTheme,
        setThemeAdmin,
        setThemePortal,
        toggleTheme,
        toggleThemeAdmin,
        toggleThemePortal,
        isOnline,
        isReconnecting,
        checkConnection,
        toasts,
        showToast,
        removeToast,
        clearToasts,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
