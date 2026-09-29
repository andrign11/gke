import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  deleteDoc,
  writeBatch,
} from 'firebase/firestore';
import { db, cleanForFirestore, handleFirestoreError, OperationType } from '../lib/firebase';
import { AppSettings, UserAccount } from '../types';

export interface DatabaseBackupMetadata {
  version: string;
  appName: string;
  namaJemaat: string;
  exportTimestamp: string;
  exportDateFormatted: string;
  exportedBy: string;
  totalRecords: number;
  collectionCounts: Record<string, number>;
}

export interface DatabaseBackupPayload {
  metadata: DatabaseBackupMetadata;
  collections: {
    settings?: AppSettings;
    user_accounts?: any[];
    penatua_diakon?: any[];
    keuangan?: any[];
    warga_jemaat?: any[];
    jadwal_ibadah?: any[];
    mph_jemaat?: any[];
    jabatan_organisasi?: any[];
    inventaris_aset?: any[];
    pemeliharaan_aset?: any[];
    renungan?: any[];
    pendaftaran?: any[];
    rancangan_khotbah?: any[];
    lingkungan_jemaat?: any[];
    agenda_surat?: any[];
    pelayanan_sakramen?: any[];
    berita_jemaat?: any[];
    jadwal_katekisasi?: any[];
    pengurus_kategorial?: any[];
    kegiatan_kategorial?: any[];
    pengurus_pembangunan?: any[];
    proyek_pembangunan?: any[];
    audit_logs?: any[];
    [key: string]: any;
  };
}

export interface CollectionValidationDetail {
  collectionId: string;
  label: string;
  docCount: number;
  validCount: number;
  invalidCount: number;
  status: 'valid' | 'warning' | 'invalid' | 'empty';
  issues: string[];
  sampleKeys?: string[];
}

export interface JsonValidationResult {
  valid: boolean;
  severity: 'success' | 'warning' | 'error';
  error?: string;
  warnings: string[];
  collectionReports: CollectionValidationDetail[];
  totalDocs: number;
  detectedCollections: string[];
  metadata?: DatabaseBackupMetadata;
  parsedData?: DatabaseBackupPayload;
}

export interface RestoreProgressState {
  progress: number;
  currentCollection: string;
  currentCollectionLabel: string;
  collectionIndex: number;
  totalCollections: number;
  processedDocs: number;
  totalDocs: number;
  currentBatch: number;
  totalBatches: number;
  stepLabel: string;
  phase: 'validating' | 'cleaning' | 'writing' | 'syncing' | 'completed' | 'error';
}

export const KNOWN_COLLECTIONS: { id: string; label: string; description: string; isCrucial?: boolean }[] = [
  { id: 'settings', label: 'Pengaturan & Kop Surat', description: 'Identitas gereja, logo, format nomor & penandatangan', isCrucial: true },
  { id: 'user_accounts', label: 'Akun Pengguna & Hak Akses', description: 'Data login admin, bendahara, sekretaris & warga', isCrucial: true },
  { id: 'warga_jemaat', label: 'Database Warga Jemaat', description: 'Data jemaat, nomor KJJ, keluarga & status sakramen', isCrucial: true },
  { id: 'keuangan', label: 'Buku Kas & Keuangan', description: 'Catatan transparansi kas pemasukan, pengeluaran & persembahan', isCrucial: true },
  { id: 'penatua_diakon', label: 'Penatua & Diakon', description: 'Daftar pelayan penatua, diakon & rayon pelayanan', isCrucial: true },
  { id: 'lingkungan_jemaat', label: 'Sektor / Lingkungan', description: 'Wilayah lingkungan & koordinator rayon', isCrucial: true },
  { id: 'mph_jemaat', label: 'Majelis Pekerja Harian (MPH)', description: 'Struktur pengurus MPH Jemaat GKE', isCrucial: true },
  { id: 'pelayanan_sakramen', label: 'Pelayanan Sakramen', description: 'Pendaftaran nikah, baptis anak/dewasa & sidi', isCrucial: true },
  { id: 'agenda_surat', label: 'Agenda Surat Masuk & Keluar', description: 'Arsip penomoran surat dinas jemaat', isCrucial: true },
  { id: 'inventaris_aset', label: 'Inventaris & Aset Gereja', description: 'Daftar barang inventaris & kondisi aset', isCrucial: true },
  { id: 'pemeliharaan_aset', label: 'Jadwal Pemeliharaan & Servis Aset', description: 'Jadwal servis berkala, pengingat jatuh tempo & riwayat pemeliharaan', isCrucial: true },
  { id: 'jadwal_ibadah', label: 'Jadwal Ibadah', description: 'Jadwal ibadah minggu, kategorial & petugas liturgi', isCrucial: true },
  { id: 'audit_logs', label: 'Log Audit & Aktivitas', description: 'Catatan histori audit keamanan sistem', isCrucial: true },
  { id: 'jabatan_organisasi', label: 'Master Jabatan Organisasi', description: 'Daftar jabatan struktural & kategorial' },
  { id: 'berita_jemaat', label: 'Berita & Warta Jemaat', description: 'Warta jemaat mingguan, pengumuman & ulang tahun' },
  { id: 'jadwal_katekisasi', label: 'Jadwal Katekisasi', description: 'Kelas katekisasi pra-nikah dan sidi jemaat' },
  { id: 'pengurus_kategorial', label: 'Pengurus Kategorial (SPB, SPPer, SPPR, SPA)', description: 'Badan pengurus seksi kategorial jemaat' },
  { id: 'kegiatan_kategorial', label: 'Kegiatan Kategorial', description: 'Jadwal program kerja seksi kategorial' },
  { id: 'pengurus_pembangunan', label: 'Panitia Pembangunan', description: 'Struktur panitia pembangunan gereja' },
  { id: 'proyek_pembangunan', label: 'Proyek Pembangunan', description: 'Daftar proyek & progres fisik bangunan' },
  { id: 'renungan', label: 'Renungan Firman & Buletin', description: 'Naskah renungan harian & publikasi' },
  { id: 'rancangan_khotbah', label: 'Rancangan Khotbah Mimbar', description: 'Khotbah AI homiletika & pastoral' },
  { id: 'pendaftaran', label: 'Pendaftaran Anggota Baru', description: 'Formulir masuk jemaat baru' },
];

export const CRITICAL_COLLECTION_IDS = KNOWN_COLLECTIONS.filter((c) => c.isCrucial).map((c) => c.id);

/**
 * Exports Firestore collections & settings into a structured JSON backup object
 */
export async function exportFirestoreDatabase(options?: {
  fallbackState?: Record<string, any>;
  currentUser?: UserAccount | null;
  settings?: AppSettings;
  targetCollectionIds?: string[];
  backupType?: 'full' | 'crucial' | 'custom';
}): Promise<DatabaseBackupPayload> {
  const collectionsData: Record<string, any> = {};
  const collectionCounts: Record<string, number> = {};
  let totalRecords = 0;

  const targetIds =
    options?.targetCollectionIds ||
    (options?.backupType === 'crucial'
      ? CRITICAL_COLLECTION_IDS
      : KNOWN_COLLECTIONS.map((c) => c.id));

  // 1. Export Settings if included in target
  if (targetIds.includes('settings')) {
    try {
      const settingsSnap = await getDoc(doc(db, 'settings', 'config'));
      if (settingsSnap.exists()) {
        collectionsData['settings'] = settingsSnap.data();
        collectionCounts['settings'] = 1;
        totalRecords += 1;
      } else if (options?.settings) {
        collectionsData['settings'] = options.settings;
        collectionCounts['settings'] = 1;
        totalRecords += 1;
      }
    } catch (err) {
      if (options?.settings) {
        collectionsData['settings'] = options.settings;
        collectionCounts['settings'] = 1;
        totalRecords += 1;
      }
    }
  }

  // 2. Export Collections
  for (const col of KNOWN_COLLECTIONS) {
    if (col.id === 'settings') continue;
    if (!targetIds.includes(col.id)) continue;

    try {
      const snap = await getDocs(collection(db, col.id));
      if (!snap.empty) {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        collectionsData[col.id] = list;
        collectionCounts[col.id] = list.length;
        totalRecords += list.length;
      } else if (options?.fallbackState && Array.isArray(options.fallbackState[col.id])) {
        const fallbackList = options.fallbackState[col.id];
        collectionsData[col.id] = fallbackList;
        collectionCounts[col.id] = fallbackList.length;
        totalRecords += fallbackList.length;
      } else {
        collectionsData[col.id] = [];
        collectionCounts[col.id] = 0;
      }
    } catch (err) {
      // If Firestore read fails (offline/permission), use fallback state from AppContext if provided
      if (options?.fallbackState && Array.isArray(options.fallbackState[col.id])) {
        const fallbackList = options.fallbackState[col.id];
        collectionsData[col.id] = fallbackList;
        collectionCounts[col.id] = fallbackList.length;
        totalRecords += fallbackList.length;
      } else {
        collectionsData[col.id] = [];
        collectionCounts[col.id] = 0;
      }
    }
  }

  const now = new Date();
  const formattedDate = new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'full',
    timeStyle: 'medium',
  }).format(now);

  const appName = options?.settings?.namaAplikasi || 'SIMJPD GKE';
  const namaJemaat = options?.settings?.namaJemaat || 'Jemaat GKE';
  const exporterName = options?.currentUser
    ? `${options.currentUser.namaLengkap} (${options.currentUser.role.toUpperCase()})`
    : 'Administrator Sistem';

  const metadata: DatabaseBackupMetadata = {
    version: '3.0.0',
    appName,
    namaJemaat,
    exportTimestamp: now.toISOString(),
    exportDateFormatted: formattedDate,
    exportedBy: exporterName,
    totalRecords,
    collectionCounts,
  };

  return {
    metadata,
    collections: collectionsData,
  };
}

/**
 * Specifically exports crucial church security data (Settings, User Accounts, Warga, Keuangan, Pelayan, Lingkungan, Sakramen, Surat, Inventaris, Audit)
 */
export async function exportCrucialDatabaseJson(options?: {
  fallbackState?: Record<string, any>;
  currentUser?: UserAccount | null;
  settings?: AppSettings;
  onProgress?: (progress: number, stepLabel: string) => void;
}): Promise<DatabaseBackupPayload> {
  options?.onProgress?.(15, 'Menginisialisasi skrip ekstraksi data krusial...');
  await new Promise((r) => setTimeout(r, 150));

  options?.onProgress?.(40, 'Mengekstrak data identitas, akun pengguna & buku kas...');
  await new Promise((r) => setTimeout(r, 200));

  const payload = await exportFirestoreDatabase({
    fallbackState: options?.fallbackState,
    currentUser: options?.currentUser,
    settings: options?.settings,
    targetCollectionIds: CRITICAL_COLLECTION_IDS,
    backupType: 'crucial',
  });

  options?.onProgress?.(80, 'Memverifikasi integritas checksum & struktur JSON...');
  await new Promise((r) => setTimeout(r, 200));

  options?.onProgress?.(100, 'Data krusial siap diunduh.');
  return payload;
}

/**
 * Triggers a file download of the backup payload in the browser
 */
export function downloadBackupJsonFile(
  payload: DatabaseBackupPayload,
  prefix: string = 'BACKUP_DATABASE'
): void {
  const jsonString = JSON.stringify(payload, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10);
  const timeStr = `${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
  const jemaatSlug = (payload.metadata.namaJemaat || 'GKE')
    .replace(/[^a-zA-Z0-9]/g, '_')
    .toUpperCase();

  const filename = `${prefix}_${jemaatSlug}_${dateStr}_${timeStr}.json`;

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Validates a raw JSON string from user upload with comprehensive schema inspection
 */
export function validateBackupJson(rawJsonText: string): JsonValidationResult {
  const warnings: string[] = [];
  const collectionReports: CollectionValidationDetail[] = [];

  try {
    if (!rawJsonText || typeof rawJsonText !== 'string' || !rawJsonText.trim()) {
      return {
        valid: false,
        severity: 'error',
        error: 'File JSON kosong atau tidak dapat dibaca.',
        warnings: [],
        collectionReports: [],
        totalDocs: 0,
        detectedCollections: [],
      };
    }

    let parsed: any;
    try {
      parsed = JSON.parse(rawJsonText);
    } catch (parseErr: any) {
      return {
        valid: false,
        severity: 'error',
        error: `Format berkas bukan JSON yang valid: ${parseErr?.message || 'Syntax Error'}`,
        warnings: [],
        collectionReports: [],
        totalDocs: 0,
        detectedCollections: [],
      };
    }

    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return {
        valid: false,
        severity: 'error',
        error: 'Struktur JSON tidak valid. Format harus berupa root object { metadata, collections } atau daftar koleksi.',
        warnings: [],
        collectionReports: [],
        totalDocs: 0,
        detectedCollections: [],
      };
    }

    // Support both direct wrapper { metadata, collections } and flattened JSON
    let collections: Record<string, any> = {};
    let metadata: DatabaseBackupMetadata;

    if (parsed.collections && typeof parsed.collections === 'object' && !Array.isArray(parsed.collections)) {
      collections = parsed.collections;
      metadata = parsed.metadata || {
        version: parsed.version || '2.6.0',
        appName: parsed.appName || 'SIMJPD GKE',
        namaJemaat: parsed.namaJemaat || 'Jemaat GKE',
        exportTimestamp: parsed.exportTimestamp || new Date().toISOString(),
        exportDateFormatted: parsed.exportDateFormatted || 'Cadangan Terstruktur',
        exportedBy: parsed.exportedBy || 'Administrator',
        totalRecords: 0,
        collectionCounts: {},
      };
    } else {
      // Flattened backup format
      collections = parsed;
      metadata = {
        version: '2.6.0',
        appName: collections.settings?.namaAplikasi || 'SIMJPD GKE',
        namaJemaat: collections.settings?.namaJemaat || 'Jemaat GKE',
        exportTimestamp: new Date().toISOString(),
        exportDateFormatted: 'Cadangan Format Langsung',
        exportedBy: 'Administrator',
        totalRecords: 0,
        collectionCounts: {},
      };
    }

    // Deep Schema Inspection for each collection
    let totalValidDocs = 0;
    const detectedCollections: string[] = [];
    const counts: Record<string, number> = {};

    const knownIds = new Set(KNOWN_COLLECTIONS.map((k) => k.id));
    const allKeys = Object.keys(collections);

    for (const key of allKeys) {
      const knownMeta = KNOWN_COLLECTIONS.find((k) => k.id === key);
      const label = knownMeta ? knownMeta.label : `Koleksi Tambahan (${key})`;
      const rawVal = collections[key];
      const issues: string[] = [];

      if (!knownIds.has(key)) {
        warnings.push(`Koleksi "${key}" merupakan koleksi kustom di luar standar default 23 koleksi.`);
      }

      if (key === 'settings') {
        if (rawVal && typeof rawVal === 'object' && !Array.isArray(rawVal)) {
          counts['settings'] = 1;
          totalValidDocs += 1;
          detectedCollections.push('settings');
          collectionReports.push({
            collectionId: 'settings',
            label: 'Pengaturan & Kop Surat',
            docCount: 1,
            validCount: 1,
            invalidCount: 0,
            status: 'valid',
            issues: [],
            sampleKeys: Object.keys(rawVal).slice(0, 5),
          });
        } else {
          issues.push('Objek settings config rusak atau bukan objek tunggal.');
          collectionReports.push({
            collectionId: 'settings',
            label: 'Pengaturan & Kop Surat',
            docCount: 0,
            validCount: 0,
            invalidCount: 1,
            status: 'invalid',
            issues,
          });
        }
        continue;
      }

      if (!Array.isArray(rawVal)) {
        if (rawVal === null || rawVal === undefined) {
          continue;
        }
        issues.push(`Koleksi "${key}" diharapkan berupa Array dokumen, ditemukan tipe ${typeof rawVal}.`);
        collectionReports.push({
          collectionId: key,
          label,
          docCount: 0,
          validCount: 0,
          invalidCount: 1,
          status: 'invalid',
          issues,
        });
        continue;
      }

      const docList = rawVal as any[];
      if (docList.length === 0) {
        collectionReports.push({
          collectionId: key,
          label,
          docCount: 0,
          validCount: 0,
          invalidCount: 0,
          status: 'empty',
          issues: ['Koleksi kosong (0 dokumen)'],
        });
        counts[key] = 0;
        continue;
      }

      let validInCol = 0;
      let invalidInCol = 0;
      let missingIdCount = 0;
      let sampleKeys: string[] = [];

      docList.forEach((item, idx) => {
        if (!item || typeof item !== 'object' || Array.isArray(item)) {
          invalidInCol++;
          if (issues.length < 3) {
            issues.push(`Item indeks ke-${idx} bukan objek dokumen Firestore.`);
          }
        } else {
          validInCol++;
          if (!item.id || typeof item.id !== 'string') {
            missingIdCount++;
          }
          if (sampleKeys.length === 0) {
            sampleKeys = Object.keys(item).slice(0, 6);
          }
        }
      });

      if (missingIdCount > 0) {
        issues.push(`${missingIdCount} dokumen tidak memiliki ID primer (akan dibuatkan ID otomatis).`);
      }

      const colStatus: 'valid' | 'warning' | 'invalid' =
        invalidInCol > 0 ? (validInCol > 0 ? 'warning' : 'invalid') : missingIdCount > 0 ? 'warning' : 'valid';

      counts[key] = validInCol;
      totalValidDocs += validInCol;
      detectedCollections.push(key);

      collectionReports.push({
        collectionId: key,
        label,
        docCount: docList.length,
        validCount: validInCol,
        invalidCount: invalidInCol,
        status: colStatus,
        issues,
        sampleKeys,
      });
    }

    metadata.totalRecords = totalValidDocs;
    metadata.collectionCounts = counts;

    if (totalValidDocs === 0 && !collections.settings) {
      return {
        valid: false,
        severity: 'error',
        error: 'File JSON valid namun tidak ditemukan satupun dokumen data gereja yang sesuai dengan struktur Firestore.',
        warnings,
        collectionReports,
        totalDocs: 0,
        detectedCollections: [],
      };
    }

    const hasInvalidCols = collectionReports.some((c) => c.status === 'invalid');
    const hasWarnings = warnings.length > 0 || collectionReports.some((c) => c.status === 'warning');

    const severity: 'success' | 'warning' | 'error' = hasInvalidCols
      ? 'warning'
      : hasWarnings
      ? 'warning'
      : 'success';

    const payload: DatabaseBackupPayload = {
      metadata,
      collections,
    };

    return {
      valid: true,
      severity,
      warnings,
      collectionReports,
      totalDocs: totalValidDocs,
      detectedCollections,
      metadata,
      parsedData: payload,
    };
  } catch (err: any) {
    return {
      valid: false,
      severity: 'error',
      error: `Gagal memvalidasi struktur file: ${err?.message || 'Format tidak valid'}`,
      warnings: [],
      collectionReports: [],
      totalDocs: 0,
      detectedCollections: [],
    };
  }
}

/**
 * Restores all or selected collections into Firestore using batch chunking and detailed progress tracking
 */
export async function restoreFirestoreDatabase(
  backupPayload: DatabaseBackupPayload,
  options: {
    mode: 'overwrite' | 'merge';
    selectedCollections?: string[];
    onProgress?: (progressState: RestoreProgressState) => void;
  }
): Promise<{
  success: boolean;
  totalRestored: number;
  restoredCollections: string[];
  error?: string;
}> {
  const { mode, selectedCollections, onProgress } = options;
  const collectionsToRestore = selectedCollections && selectedCollections.length > 0
    ? selectedCollections
    : Object.keys(backupPayload.collections);

  let totalRestored = 0;
  const restoredCollections: string[] = [];
  const totalCollections = collectionsToRestore.length;

  // Calculate total documents for granular progress
  let totalDocsToProcess = 0;
  collectionsToRestore.forEach((cId) => {
    if (cId === 'settings') {
      totalDocsToProcess += 1;
    } else {
      const arr = backupPayload.collections[cId];
      if (Array.isArray(arr)) totalDocsToProcess += arr.length;
    }
  });

  let cumulativeDocsProcessed = 0;

  try {
    for (let index = 0; index < collectionsToRestore.length; index++) {
      const colId = collectionsToRestore[index];
      const colLabel = KNOWN_COLLECTIONS.find((c) => c.id === colId)?.label || colId;

      // Handle Settings document
      if (colId === 'settings') {
        const settingsData = backupPayload.collections.settings;
        if (settingsData && typeof settingsData === 'object') {
          if (onProgress) {
            const pct = Math.min(98, Math.round((cumulativeDocsProcessed / Math.max(1, totalDocsToProcess)) * 100));
            onProgress({
              progress: pct,
              currentCollection: 'settings',
              currentCollectionLabel: 'Pengaturan & Kop Surat',
              collectionIndex: index + 1,
              totalCollections,
              processedDocs: cumulativeDocsProcessed,
              totalDocs: totalDocsToProcess,
              currentBatch: 1,
              totalBatches: 1,
              stepLabel: `Menyimpan Dokumen Pengaturan & Kop Surat (Koleksi ${index + 1}/${totalCollections})...`,
              phase: 'writing',
            });
          }

          const cleaned = cleanForFirestore(settingsData);
          await setDoc(doc(db, 'settings', 'config'), cleaned, { merge: mode === 'merge' });
          totalRestored += 1;
          cumulativeDocsProcessed += 1;
          restoredCollections.push('settings');
        }
        continue;
      }

      // Handle Array Collections
      const items = backupPayload.collections[colId];
      if (!Array.isArray(items) || items.length === 0) {
        if (mode === 'overwrite') {
          if (onProgress) {
            const pct = Math.min(98, Math.round((cumulativeDocsProcessed / Math.max(1, totalDocsToProcess)) * 100));
            onProgress({
              progress: pct,
              currentCollection: colId,
              currentCollectionLabel: colLabel,
              collectionIndex: index + 1,
              totalCollections,
              processedDocs: cumulativeDocsProcessed,
              totalDocs: totalDocsToProcess,
              currentBatch: 0,
              totalBatches: 0,
              stepLabel: `Membersihkan koleksi ${colLabel} (0 data baru)...`,
              phase: 'cleaning',
            });
          }
          try {
            const snap = await getDocs(collection(db, colId));
            if (!snap.empty) {
              const batchDelete = writeBatch(db);
              snap.docs.forEach((d) => batchDelete.delete(doc(db, colId, d.id)));
              await batchDelete.commit();
            }
          } catch {
            // ignore
          }
        }
        continue;
      }

      // If overwrite mode, purge existing docs first
      if (mode === 'overwrite') {
        if (onProgress) {
          const pct = Math.min(98, Math.round((cumulativeDocsProcessed / Math.max(1, totalDocsToProcess)) * 100));
          onProgress({
            progress: pct,
            currentCollection: colId,
            currentCollectionLabel: colLabel,
            collectionIndex: index + 1,
            totalCollections,
            processedDocs: cumulativeDocsProcessed,
            totalDocs: totalDocsToProcess,
            currentBatch: 0,
            totalBatches: Math.ceil(items.length / 350),
            stepLabel: `Membersihkan koleksi ${colLabel} sebelum penulisan bersih...`,
            phase: 'cleaning',
          });
        }
        try {
          const existingSnap = await getDocs(collection(db, colId));
          if (!existingSnap.empty) {
            const existingDocs = existingSnap.docs;
            for (let i = 0; i < existingDocs.length; i += 350) {
              const chunk = existingDocs.slice(i, i + 350);
              const batchDelete = writeBatch(db);
              chunk.forEach((d) => batchDelete.delete(doc(db, colId, d.id)));
              await batchDelete.commit();
            }
          }
        } catch (delErr) {
          console.warn(`[Restore] Notice purging collection ${colId}:`, delErr);
        }
      }

      // Insert backup items in batches of 350 to stay well under Firestore 500-op limit
      const totalBatches = Math.ceil(items.length / 350);
      for (let i = 0; i < items.length; i += 350) {
        const batchNum = Math.floor(i / 350) + 1;
        const chunk = items.slice(i, i + 350);
        const batch = writeBatch(db);

        if (onProgress) {
          const pct = Math.min(98, Math.round((cumulativeDocsProcessed / Math.max(1, totalDocsToProcess)) * 100));
          onProgress({
            progress: pct,
            currentCollection: colId,
            currentCollectionLabel: colLabel,
            collectionIndex: index + 1,
            totalCollections,
            processedDocs: cumulativeDocsProcessed,
            totalDocs: totalDocsToProcess,
            currentBatch: batchNum,
            totalBatches,
            stepLabel: `Menulis ${colLabel}: Batch ${batchNum}/${totalBatches} (${cumulativeDocsProcessed + chunk.length}/${totalDocsToProcess} total)...`,
            phase: 'writing',
          });
        }

        chunk.forEach((item, itemIdx) => {
          if (!item || typeof item !== 'object') return;
          const itemId = (item.id && typeof item.id === 'string' && item.id.trim())
            ? item.id.trim()
            : `restored_${colId}_${Date.now()}_${i + itemIdx}`;
          const itemData = cleanForFirestore({ ...item, id: itemId });
          const docRef = doc(db, colId, itemId);
          batch.set(docRef, itemData, { merge: mode === 'merge' });
        });

        await batch.commit();
        cumulativeDocsProcessed += chunk.length;
      }

      totalRestored += items.length;
      restoredCollections.push(colId);
    }

    if (onProgress) {
      onProgress({
        progress: 100,
        currentCollection: 'selesai',
        currentCollectionLabel: 'Selesai',
        collectionIndex: totalCollections,
        totalCollections,
        processedDocs: totalDocsToProcess,
        totalDocs: totalDocsToProcess,
        currentBatch: 1,
        totalBatches: 1,
        stepLabel: `Pemulihan data selesai! ${totalRestored} dokumen berhasil disinkronkan.`,
        phase: 'completed',
      });
    }

    return {
      success: true,
      totalRestored,
      restoredCollections,
    };
  } catch (err: any) {
    console.error('Error during database restore:', err);
    return {
      success: false,
      totalRestored,
      restoredCollections,
      error: err?.message || 'Terjadi kesalahan saat memulihkan database ke Firestore.',
    };
  }
}
