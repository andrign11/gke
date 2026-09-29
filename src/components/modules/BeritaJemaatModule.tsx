import React, { useState, useEffect, useMemo } from 'react';
import {
  Newspaper,
  Calendar,
  DollarSign,
  Gift,
  Heart,
  Plus,
  Edit,
  Edit2,
  Trash2,
  Printer,
  Search,
  FileText,
  CheckCircle,
  CheckCircle2,
  Loader2,
  Clock,
  MapPin,
  User,
  Sparkles,
  BookOpen,
  Bell,
  RefreshCw,
  X,
  ChevronRight,
  Shield,
  Send,
  AlertCircle,
  Coins,
  QrCode,
  List,
  Layers,
  Download,
  ArrowDownToLine,
  Filter,
  CheckSquare,
  Square,
  BookmarkCheck,
  Users,
  ExternalLink,
  Wallet,
  Lock,
  Unlock,
  ShieldAlert,
  AlertTriangle,
  Info,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { QrisPersembahanModal } from '../QrisPersembahanModal';
import {
  BeritaDukaItem,
  BeritaJemaat,
  BeritaKeuanganItem,
  BeritaKeuanganRincian,
  BeritaKeuanganTransaksiItem,
  BeritaPelayananItem,
  BeritaTambahanUmum,
  BeritaUlangTahunItem,
  UndanganPernikahanItem,
  KegiatanKategorial,
  WargaJemaat,
  Lingkungan,
  JadwalIbadah,
  KeuanganItem,
} from '../../types';

// Safe date formatting and parsing helpers to prevent 'Invalid time value' crashes
const safeFormatDate = (
  dateInput?: string | number | Date | null,
  options?: Intl.DateTimeFormatOptions,
  fallback = '-'
): string => {
  if (!dateInput) return fallback;
  try {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return String(dateInput) || fallback;
    return d.toLocaleDateString('id-ID', options || { day: 'numeric', month: 'long', year: 'numeric' });
  } catch {
    return String(dateInput) || fallback;
  }
};

const safeISODate = (dateInput?: string | number | Date | null): string => {
  if (!dateInput) return new Date().toISOString().split('T')[0];
  try {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return new Date().toISOString().split('T')[0];
    return d.toISOString().split('T')[0];
  } catch {
    return new Date().toISOString().split('T')[0];
  }
};

const safeDateObj = (dateInput?: string | number | Date | null): Date => {
  if (!dateInput) return new Date();
  try {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return new Date();
    return d;
  } catch {
    return new Date();
  }
};

// Helper to check if a service date is within the 1-week (7 days) upcoming window relative to tanggalTerbit (inclusive of all categories)
const isDateInOneWeekWindow = (dateInput?: string, referenceDateInput?: string): boolean => {
  if (!dateInput) return false;
  const refIso = safeISODate(referenceDateInput || safeISODate());
  const refObj = safeDateObj(refIso);
  const startDay = new Date(refObj.getFullYear(), refObj.getMonth(), refObj.getDate(), 0, 0, 0, 0);
  const endDay = new Date(startDay.getTime() + 7 * 24 * 60 * 60 * 1000);
  endDay.setHours(23, 59, 59, 999);

  const targetObj = safeDateObj(dateInput);
  const targetTime = targetObj.getTime();
  return targetTime >= startDay.getTime() && targetTime <= endDay.getTime();
};

const getOneWeekDateRangeText = (referenceDateInput?: string): string => {
  const refIso = safeISODate(referenceDateInput || safeISODate());
  const refObj = safeDateObj(refIso);
  const startDay = new Date(refObj.getFullYear(), refObj.getMonth(), refObj.getDate(), 0, 0, 0, 0);
  const endDay = new Date(startDay.getTime() + 7 * 24 * 60 * 60 * 1000);
  
  const startStr = safeFormatDate(startDay, { day: 'numeric', month: 'short', year: 'numeric' });
  const endStr = safeFormatDate(endDay, { day: 'numeric', month: 'short', year: 'numeric' });
  return `${startStr} s/d ${endStr}`;
};

// Date parser helper for Warga Jemaat records (YYYY-MM-DD or DD-MM-YYYY)
function parseWargaDate(dateStr?: string): { year: number; month: number; day: number } | null {
  if (!dateStr || !dateStr.trim()) return null;
  const s = dateStr.trim();
  const ymd = s.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (ymd) {
    const y = parseInt(ymd[1], 10);
    const m = parseInt(ymd[2], 10);
    const d = parseInt(ymd[3], 10);
    if (m >= 1 && m <= 12 && d >= 1 && d <= 31) return { year: y, month: m, day: d };
  }
  const dmy = s.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
  if (dmy) {
    const d = parseInt(dmy[1], 10);
    const m = parseInt(dmy[2], 10);
    const y = parseInt(dmy[3], 10);
    if (m >= 1 && m <= 12 && d >= 1 && d <= 31) return { year: y, month: m, day: d };
  }
  return null;
}

// Function to automatically extract birthdays and wedding anniversaries from live wargaJemaatList
const extractUlangTahunFromWarga = (
  wargaList: WargaJemaat[],
  targetDateStr: string,
  mode: 'week' | 'month' = 'week'
): BeritaUlangTahunItem[] => {
  if (!wargaList || wargaList.length === 0) return [];
  const targetDate = safeDateObj(targetDateStr);
  const targetYear = targetDate.getFullYear();
  const targetMonth = targetDate.getMonth() + 1; // 1-12
  const targetDay = targetDate.getDate();

  // For week mode: calculate window of +/- 4 days around targetDate (full 7-8 day week)
  const targetTime = new Date(targetYear, targetMonth - 1, targetDay).getTime();
  const startWindowTime = targetTime - 3 * 24 * 3600 * 1000;
  const endWindowTime = targetTime + 4 * 24 * 3600 * 1000;

  const result: BeritaUlangTahunItem[] = [];

  // 1. Birthdays (Ulang Tahun Kelahiran)
  wargaList.forEach((w) => {
    if (!w.tanggalLahir) return;
    const parsed = parseWargaDate(w.tanggalLahir);
    if (!parsed) return;

    const bDateThisYear = new Date(targetYear, parsed.month - 1, parsed.day);
    let isMatch = false;

    if (mode === 'month') {
      isMatch = parsed.month === targetMonth;
    } else {
      isMatch = bDateThisYear.getTime() >= startWindowTime && bDateThisYear.getTime() <= endWindowTime;
    }

    if (isMatch) {
      const age = targetYear - parsed.year;
      const formattedDate = `${targetYear}-${String(parsed.month).padStart(2, '0')}-${String(parsed.day).padStart(2, '0')}`;
      result.push({
        id: `ut-birth-${w.id}-${targetYear}`,
        jenis: 'kelahiran',
        nama: w.namaLengkap,
        rayon: w.rayon || 'Lingkungan Jemaat',
        tanggal: formattedDate,
        keterangan: age > 0 ? `Ulang Tahun Kelahiran ke-${age}` : 'Ulang Tahun Kelahiran',
      });
    }
  });

  // 2. Wedding Anniversaries (Ulang Tahun Pernikahan)
  const processedCouplesKeys = new Set<string>();
  wargaList.forEach((w) => {
    if (w.tanggalPernikahan && w.tanggalPernikahan.trim() !== '' && w.statusNikah === 'Menikah') {
      const parsed = parseWargaDate(w.tanggalPernikahan);
      if (!parsed) return;

      const coupleKey = `${w.noKjj || ''}_${w.tanggalPernikahan}`;
      if (processedCouplesKeys.has(coupleKey)) return;
      processedCouplesKeys.add(coupleKey);

      const mDateThisYear = new Date(targetYear, parsed.month - 1, parsed.day);
      let isMatch = false;

      if (mode === 'month') {
        isMatch = parsed.month === targetMonth;
      } else {
        isMatch = mDateThisYear.getTime() >= startWindowTime && mDateThisYear.getTime() <= endWindowTime;
      }

      if (isMatch) {
        // Find spouse
        const family = wargaList.filter((m) => m.noKjj === w.noKjj && m.statusNikah === 'Menikah');
        const suami = family.find((m) => m.hubunganKeluarga === 'Kepala Keluarga' || m.jenisKelamin === 'L');
        const istri = family.find((m) => m.hubunganKeluarga === 'Istri' || (m.jenisKelamin === 'P' && m.id !== suami?.id));

        let labelPasangan = '';
        if (suami && istri) {
          labelPasangan = `Kel. Bpk. ${suami.namaLengkap} & Ibu ${istri.namaLengkap}`;
        } else if (suami) {
          labelPasangan = `Kel. Bpk. ${suami.namaLengkap}`;
        } else if (istri) {
          labelPasangan = `Kel. Ibu ${istri.namaLengkap}`;
        } else {
          labelPasangan = `Kel. ${w.namaLengkap}`;
        }

        const marriageYears = targetYear - parsed.year;
        const formattedDate = `${targetYear}-${String(parsed.month).padStart(2, '0')}-${String(parsed.day).padStart(2, '0')}`;
        result.push({
          id: `ut-wed-${w.id}-${targetYear}`,
          jenis: 'pernikahan',
          nama: labelPasangan,
          rayon: w.rayon || 'Lingkungan Jemaat',
          tanggal: formattedDate,
          keterangan: marriageYears > 0 ? `Ulang Tahun Pernikahan ke-${marriageYears}` : 'Ulang Tahun Pernikahan',
        });
      }
    }
  });

  // If no items matched in 7-day window, fallback to month items so it's not empty
  if (result.length === 0 && mode === 'week') {
    return extractUlangTahunFromWarga(wargaList, targetDateStr, 'month');
  }

  // Sort chronologically by date
  return result.sort((a, b) => (a.tanggal || '').localeCompare(b.tanggal || ''));
};

/**
 * Helper to calculate age at time of death from birth date and death date.
 */
export const calculateAgeAtDeath = (birthDate?: string, deathDate?: string): number => {
  if (!birthDate) return 0;
  const b = new Date(birthDate);
  if (isNaN(b.getTime())) return 0;
  const d = deathDate ? new Date(deathDate) : new Date();
  if (isNaN(d.getTime())) return 0;
  let age = d.getFullYear() - b.getFullYear();
  const m = d.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && d.getDate() < b.getDate())) {
    age--;
  }
  return Math.max(0, age);
};

/**
 * Function to extract deceased church members from wargaJemaatList into BeritaDukaItem records
 */
export const extractDukaFromWarga = (
  wargaList: WargaJemaat[],
  existingDukaList: BeritaDukaItem[] = []
): BeritaDukaItem[] => {
  if (!wargaList || wargaList.length === 0) return existingDukaList;

  const deceased = wargaList.filter(
    (w) => w.statusKeanggotaan === 'Meninggal' || !!w.tanggalMeninggal
  );

  if (deceased.length === 0) return existingDukaList;

  const result: BeritaDukaItem[] = [...existingDukaList];

  deceased.forEach((w) => {
    const normName = (w.namaLengkap || '').toLowerCase().trim();
    const existingIndex = result.findIndex(
      (d) => (d.namaMeninggal || '').toLowerCase().trim() === normName
    );

    const calculatedAge = calculateAgeAtDeath(w.tanggalLahir, w.tanggalMeninggal);
    const tempatDuka = w.tempatMeninggal || w.alamat || 'Kediaman Keluarga';
    const jadwalPemakaman = [
      w.tempatPemakaman || '',
      w.pelayanPemakaman ? `Pelayan: ${w.pelayanPemakaman}` : '',
    ].filter(Boolean).join(' • ') || 'TPU Kristen';
    const keluargaYangBerduka = w.keluargaDitinggalkan || `Keluarga Besar Alm. ${w.namaLengkap}`;
    const keterangan = [
      w.keteranganMeninggal || '',
      w.nomorSuratKematian ? `Surat Kematian No: ${w.nomorSuratKematian}` : '',
    ].filter(Boolean).join(' | ');

    const dukaItem: BeritaDukaItem = {
      id: existingIndex >= 0 ? result[existingIndex].id : `bd-warga-${w.id}`,
      namaMeninggal: w.namaLengkap,
      usia: calculatedAge > 0 ? calculatedAge : 70,
      rayon: w.rayon || 'Rayon 1',
      tanggalMeninggal: w.tanggalMeninggal || safeISODate(),
      tempatDuka,
      jadwalPemakaman,
      keluargaYangBerduka,
      keterangan: keterangan || 'Ibadah penghiburan keluarga dilaksanakan di rumah duka.',
    };

    if (existingIndex >= 0) {
      result[existingIndex] = {
        ...result[existingIndex],
        ...dukaItem,
        id: result[existingIndex].id,
      };
    } else {
      result.push(dukaItem);
    }
  });

  return result.sort((a, b) => (b.tanggalMeninggal || '').localeCompare(a.tanggalMeninggal || ''));
};

/**
 * Computes financial snapshot for Warta Jemaat specifically for the 1-week period
 * prior to publication date (data minggu sebelum diterbitkan warta jemaat baru).
 */
export const computeWartaKeuangan = (
  tanggalTerbit?: string,
  keuanganList: KeuanganItem[] = [],
  settings?: any,
  customStartDate?: string,
  customEndDate?: string
): BeritaKeuanganItem => {
  const endDate = safeISODate(customEndDate || tanggalTerbit || safeISODate());
  const endObj = safeDateObj(endDate);
  // Period is 7 days before publication date up to the publication date
  const defaultStartDate = safeISODate(new Date(endObj.getTime() - 7 * 24 * 3600 * 1000));
  const startDate = safeISODate(customStartDate || defaultStartDate);

  const validKeuangan = (keuanganList || []).filter((k) => k.status !== 'pending' && k.status !== 'ditolak');

  const baseSaldoAwal =
    (settings?.saldoAwalCustomKasUmum || 0) +
    (settings?.saldoAwalCustomKasPembangunan || 0) +
    (settings?.saldoAwalCustomKasDiakonia || 0) +
    (settings?.saldoAwalCustomKasSpper || 0) +
    (settings?.saldoAwalCustomKasSpb || 0) +
    (settings?.saldoAwalCustomKasSpprp || 0) +
    (settings?.saldoAwalCustomKasSpa || 0);

  // Transactions before startDate form the beginning balance (saldo awal)
  const priorTransactions = validKeuangan.filter((k) => (k.tanggal || '') < startDate);
  const computedSaldoAwal = baseSaldoAwal + priorTransactions.reduce((acc, curr) => {
    const inVal = curr.jumlah || curr.masuk || 0;
    const outVal = curr.jumlah || curr.keluar || 0;
    return curr.jenis === 'pemasukan' ? acc + inVal : acc - outVal;
  }, 0);

  // Transactions strictly within the 1-week window before publication [startDate, endDate]
  const periodTransactions = validKeuangan
    .filter((k) => (k.tanggal || '') >= startDate && (k.tanggal || '') <= endDate)
    .sort((a, b) => (b.tanggal || '').localeCompare(a.tanggal || '') || (b.id || '').localeCompare(a.id || ''));

  const totalIn = periodTransactions.reduce(
    (acc, curr) => (curr.jenis === 'pemasukan' ? acc + (curr.jumlah || curr.masuk || 0) : acc),
    0
  );
  const totalOut = periodTransactions.reduce(
    (acc, curr) => (curr.jenis === 'pengeluaran' ? acc + (curr.jumlah || curr.keluar || 0) : acc),
    0
  );

  const standardPosList = [
    'Kas Umum',
    'Kas Pembangunan',
    'Kas Kupon',
    'Kas Diakonia',
    'Kas Iuran Kewajiban',
    'Kas Iuran Pembangunan',
    'Kas SPPer',
    'Kas SPB',
    'Kas SPPR/P',
    'Kas Anak Sekolah Hari Minggu',
  ];

  const posKasMap: Record<string, { pemasukan: number; pengeluaran: number; saldo: number }> = {};
  standardPosList.forEach((pos) => {
    posKasMap[pos] = { pemasukan: 0, pengeluaran: 0, saldo: 0 };
  });

  periodTransactions.forEach((k) => {
    const pos = k.posKas || 'Kas Umum';
    if (!posKasMap[pos]) {
      posKasMap[pos] = { pemasukan: 0, pengeluaran: 0, saldo: 0 };
    }
    const inVal = k.jumlah || k.masuk || 0;
    const outVal = k.jumlah || k.keluar || 0;
    if (k.jenis === 'pemasukan') {
      posKasMap[pos].pemasukan += inVal;
    } else {
      posKasMap[pos].pengeluaran += outVal;
    }
    posKasMap[pos].saldo = posKasMap[pos].pemasukan - posKasMap[pos].pengeluaran;
  });

  const rincianPosKas: BeritaKeuanganRincian[] = Object.keys(posKasMap)
    .filter(
      (pos) =>
        posKasMap[pos].pemasukan > 0 ||
        posKasMap[pos].pengeluaran > 0 ||
        pos === 'Kas Umum' ||
        pos === 'Kas Pembangunan'
    )
    .map((key) => ({
      namaPos: key,
      pemasukan: posKasMap[key].pemasukan,
      pengeluaran: posKasMap[key].pengeluaran,
      saldo: posKasMap[key].saldo,
    }));

  const rincianTransaksi: BeritaKeuanganTransaksiItem[] = periodTransactions.map((k) => ({
    id: k.id || `tr-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    tanggal: k.tanggal || safeISODate(),
    jenis: k.jenis || (k.masuk ? 'pemasukan' : 'pengeluaran'),
    namaPosKas: k.posKas || 'Kas Umum',
    kategori: k.kategori || 'Kas Jemaat',
    keterangan: k.keterangan || '-',
    jumlah: k.jumlah || k.masuk || k.keluar || 0,
    noBukti: (k as any).noBukti || k.noReferensi,
  }));

  const startFmt = safeFormatDate(startDate, { day: 'numeric', month: 'short' });
  const endFmt = safeFormatDate(endDate, { day: 'numeric', month: 'short', year: 'numeric' });

  return {
    periodeJudul: `Rekapitulasi Kas Keuangan (${startFmt} s.d ${endFmt})`,
    tanggalMulai: startDate,
    tanggalSelesai: endDate,
    saldoAwal: computedSaldoAwal,
    totalPemasukan: totalIn,
    totalPengeluaran: totalOut,
    saldoAkhir: computedSaldoAwal + totalIn - totalOut,
    rincianPosKas: rincianPosKas.length > 0 ? rincianPosKas : [
      { namaPos: 'Kas Umum', pemasukan: totalIn, pengeluaran: totalOut, saldo: computedSaldoAwal + totalIn - totalOut },
    ],
    rincianTransaksiMingguIni: rincianTransaksi,
    catatanKeuangan: `Rincian penerimaan dan pengeluaran kas minggu sebelum diterbitkan warta jemaat baru (${startFmt} s.d ${endFmt}).`,
  };
};

/**
 * Helper to calculate 60-minute edit lock status for published Warta Jemaat editions.
 * Rule: Editions with status 'Diterbitkan' CAN still be edited during the first 60 minutes after publication (Grace Period).
 * After 60 minutes have elapsed, the edition is PERMANENTLY LOCKED from any further modifications, syncs, or deletions.
 */
export const getWartaLockStatus = (warta?: BeritaJemaat | null) => {
  if (!warta) {
    return {
      isLocked: false,
      canEdit: true,
      isWithinGracePeriod: false,
      remainingMinutes: 0,
      remainingSeconds: 0,
      formattedRemaining: '',
      lockEndTime: null as Date | null,
      publishedAtDate: null as Date | null,
    };
  }

  // Draf is always editable, never locked
  if (warta.status === 'Draf') {
    return {
      isLocked: false,
      canEdit: true,
      isWithinGracePeriod: false,
      remainingMinutes: 0,
      remainingSeconds: 0,
      formattedRemaining: 'Draf',
      lockEndTime: null as Date | null,
      publishedAtDate: null as Date | null,
    };
  }

  // Arsip is permanently locked
  if (warta.status === 'Arsip') {
    return {
      isLocked: true,
      canEdit: false,
      isWithinGracePeriod: false,
      remainingMinutes: 0,
      remainingSeconds: 0,
      formattedRemaining: 'Arsip (Terkunci)',
      lockEndTime: null as Date | null,
      publishedAtDate: null as Date | null,
    };
  }

  // Status is 'Diterbitkan'
  // Determine publication timestamp (publishedAt preferred, fallback to tanggalTerbit)
  const pubTimestamp = warta.publishedAt
    ? new Date(warta.publishedAt).getTime()
    : new Date(warta.tanggalTerbit).getTime();

  if (isNaN(pubTimestamp)) {
    return {
      isLocked: false,
      canEdit: true,
      isWithinGracePeriod: false,
      remainingMinutes: 0,
      remainingSeconds: 0,
      formattedRemaining: '',
      lockEndTime: null as Date | null,
      publishedAtDate: null as Date | null,
    };
  }

  const LOCK_DURATION_MS = 60 * 60 * 1000; // 60 minutes
  const now = Date.now();
  const elapsed = now - pubTimestamp;
  const remainingMs = LOCK_DURATION_MS - elapsed;
  const lockEndTime = new Date(pubTimestamp + LOCK_DURATION_MS);
  const publishedAtDate = new Date(pubTimestamp);

  // During the first 60 minutes after publication: EDIT IS STILL ALLOWED (Grace Period)
  if (remainingMs > 0) {
    const totalSec = Math.floor(remainingMs / 1000);
    const remainingMinutes = Math.ceil(remainingMs / 60000);
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    const formattedRemaining = `${mins}m ${secs < 10 ? '0' : ''}${secs}s`;
    return {
      isLocked: false, // BISA DIEDIT!
      canEdit: true,
      isWithinGracePeriod: true, // Masa toleransi edit aktif
      remainingMinutes,
      remainingSeconds: totalSec,
      lockEndTime,
      formattedRemaining,
      publishedAtDate,
    };
  }

  // After 60 minutes: PERMANENTLY LOCKED
  return {
    isLocked: true, // SUDAH TERKUNCI PERMANEN
    canEdit: false,
    isWithinGracePeriod: false,
    remainingMinutes: 0,
    remainingSeconds: 0,
    formattedRemaining: 'Terkunci Permanen',
    lockEndTime,
    publishedAtDate,
  };
};

export const BeritaJemaatModule: React.FC = () => {
  const {
    beritaJemaatList,
    addBeritaJemaat,
    updateBeritaJemaat,
    deleteBeritaJemaat,
    openPrintReport,
    currentUser,
    jadwalIbadahList,
    keuanganList,
    wargaJemaatList,
    lingkunganList,
    pelayananSakramenList,
    kegiatanKategorialList,
    settings,
    setActiveTab: setGlobalActiveTab,
  } = useApp();

  const isManagement = currentUser?.role === 'admin' || currentUser?.role === 'sekretaris' || currentUser?.role === 'bendahara';
  const isAdmin = currentUser?.role === 'admin';

  // Compute available Rayon / Lingkungan from the application's lingkunganList
  const availableLingkunganList = useMemo(() => {
    if (lingkunganList && lingkunganList.length > 0) {
      const active = lingkunganList.filter((l) => l.status === 'Aktif');
      if (active.length > 0) return active;
      return lingkunganList;
    }
    return [];
  }, [lingkunganList]);

  const defaultRayon = availableLingkunganList[0]?.nama || 'Lingkungan 1';

  // Compute Real Kas Jemaat state directly from master keuanganList & settings
  const realKasData = useMemo(() => {
    const validTx = (keuanganList || []).filter((k) => k.status !== 'pending' && k.status !== 'ditolak');

    // Base Saldo Awal from settings
    const baseSaldoAwal =
      (settings.saldoAwalCustomKasUmum || 0) +
      (settings.saldoAwalCustomKasPembangunan || 0) +
      (settings.saldoAwalCustomKasDiakonia || 0) +
      (settings.saldoAwalCustomKasSpper || 0) +
      (settings.saldoAwalCustomKasSpb || 0) +
      (settings.saldoAwalCustomKasSpprp || 0) +
      (settings.saldoAwalCustomKasSpa || 0);

    const totalIn = validTx.reduce((acc, curr) => {
      const amt = curr.jumlah || curr.masuk || 0;
      return curr.jenis === 'pemasukan' ? acc + amt : acc;
    }, 0);

    const totalOut = validTx.reduce((acc, curr) => {
      const amt = curr.jumlah || curr.keluar || 0;
      return curr.jenis === 'pengeluaran' ? acc + amt : acc;
    }, 0);

    // Standard pos kas master list
    const standardPosList = [
      'Kas Umum',
      'Kas Pembangunan',
      'Kas Kupon',
      'Kas Diakonia',
      'Kas Iuran Kewajiban',
      'Kas Iuran Pembangunan',
      'Kas SPPer',
      'Kas SPB',
      'Kas SPPR/P',
      'Kas Anak Sekolah Hari Minggu',
    ];

    const posKasMap: Record<string, { pemasukan: number; pengeluaran: number; saldo: number }> = {};

    // Seed standard pos kas
    standardPosList.forEach((pos) => {
      posKasMap[pos] = { pemasukan: 0, pengeluaran: 0, saldo: 0 };
    });

    validTx.forEach((k) => {
      const pos = k.posKas || 'Kas Umum';
      if (!posKasMap[pos]) {
        posKasMap[pos] = { pemasukan: 0, pengeluaran: 0, saldo: 0 };
      }
      const inVal = k.jumlah || k.masuk || 0;
      const outVal = k.jumlah || k.keluar || 0;
      if (k.jenis === 'pemasukan') {
        posKasMap[pos].pemasukan += inVal;
      } else {
        posKasMap[pos].pengeluaran += outVal;
      }
      posKasMap[pos].saldo = posKasMap[pos].pemasukan - posKasMap[pos].pengeluaran;
    });

    const posKasRincian: BeritaKeuanganRincian[] = Object.keys(posKasMap)
      .filter(
        (pos) =>
          posKasMap[pos].pemasukan > 0 ||
          posKasMap[pos].pengeluaran > 0 ||
          pos === 'Kas Umum' ||
          pos === 'Kas Pembangunan'
      )
      .map((pos) => ({
        namaPos: pos,
        pemasukan: posKasMap[pos].pemasukan,
        pengeluaran: posKasMap[pos].pengeluaran,
        saldo: posKasMap[pos].saldo,
      }));

    const sortedTransactions = [...validTx].sort((a, b) => (b.tanggal || '').localeCompare(a.tanggal || ''));

    return {
      saldoAwal: baseSaldoAwal,
      totalPemasukan: totalIn,
      totalPengeluaran: totalOut,
      saldoAkhir: baseSaldoAwal + totalIn - totalOut,
      posKasRincian,
      transactions: sortedTransactions,
    };
  }, [keuanganList, settings]);

  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('semua');
  const [selectedWartaId, setSelectedWartaId] = useState<string>(
    beritaJemaatList.length > 0 ? beritaJemaatList[0].id : ''
  );

  // Quick Select states for auto-filling sub-item modals from Warga Jemaat
  const [selectedWargaIdForUltah, setSelectedWargaIdForUltah] = useState<string>('');
  const [selectedWargaIdForDuka, setSelectedWargaIdForDuka] = useState<string>('');
  const [selectedWargaIdForNikahPria, setSelectedWargaIdForNikahPria] = useState<string>('');
  const [selectedWargaIdForNikahWanita, setSelectedWargaIdForNikahWanita] = useState<string>('');
  const [selectedDukaSyncIds, setSelectedDukaSyncIds] = useState<string[]>([]);
  const [dukaSyncSearch, setDukaSyncSearch] = useState<string>('');
  const [dukaSyncMode, setDukaSyncMode] = useState<'merge' | 'replace'>('merge');

  useEffect(() => {
    if (beritaJemaatList.length > 0) {
      if (!selectedWartaId || !beritaJemaatList.some((w) => w.id === selectedWartaId)) {
        setSelectedWartaId(beritaJemaatList[0].id);
      }
    } else {
      setSelectedWartaId('');
    }
  }, [beritaJemaatList, selectedWartaId]);

  const [activeTab, setActiveTab] = useState<'pelayanan' | 'keuangan' | 'ulang_tahun' | 'berita_tambahan'>('pelayanan');

  // Modals state
  const [isWartaModalOpen, setIsWartaModalOpen] = useState(false);
  const [isListModalOpen, setIsListModalOpen] = useState(false);
  const [isQrisOpen, setIsQrisOpen] = useState(false);
  const [editingWarta, setEditingWarta] = useState<BeritaJemaat | null>(null);

  // Real-time second tick to update lock remaining countdown
  const [currentTime, setCurrentTime] = useState<number>(Date.now());
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Lock Notice Modal Dialog State
  const [lockNotice, setLockNotice] = useState<{
    isOpen: boolean;
    mode: 'grace_period' | 'locked';
    wartaTitle: string;
    nomorEdisi: string;
    publishedAtText: string;
    remainingText: string;
    lockEndTimeText: string;
  } | null>(null);

  // Custom Delete Confirmation Modal State (Mobile & Desktop immune to window.confirm block)
  const [deleteTarget, setDeleteTarget] = useState<{
    type: 'warta' | 'pelayanan' | 'transaksi' | 'ulang_tahun' | 'duka' | 'nikah' | 'pengumuman';
    id: string;
    title: string;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Save Progress Animation State
  const [saveProgressState, setSaveProgressState] = useState<{
    isSaving: boolean;
    progress: number;
    title: string;
    step: string;
  }>({
    isSaving: false,
    progress: 0,
    title: 'Menyimpan Data...',
    step: 'Memproses...',
  });

  const runWithProgress = async (title: string, asyncTask: () => Promise<void>) => {
    setSaveProgressState({
      isSaving: true,
      progress: 20,
      title,
      step: 'Memvalidasi data & menyiapkan dokumen...',
    });

    await new Promise((resolve) => setTimeout(resolve, 180));
    setSaveProgressState((prev) => ({
      ...prev,
      progress: 55,
      step: 'Mengirimkan pembaruan ke Firestore Database...',
    }));

    try {
      await asyncTask();
      setSaveProgressState((prev) => ({
        ...prev,
        progress: 88,
        step: 'Memproses sinkronisasi data warta...',
      }));
      await new Promise((resolve) => setTimeout(resolve, 220));

      setSaveProgressState((prev) => ({
        ...prev,
        progress: 100,
        step: 'Berhasil disimpan 100%!',
      }));
      await new Promise((resolve) => setTimeout(resolve, 400));
    } catch (err) {
      console.error('Error during save:', err);
    } finally {
      setSaveProgressState({
        isSaving: false,
        progress: 0,
        title: 'Menyimpan Data...',
        step: '',
      });
    }
  };

  // Sub-item modal state
  const [modalType, setModalType] = useState<
    'pelayanan' | 'keuangan' | 'ulang_tahun' | 'duka' | 'nikah' | 'pengumuman' | 'sync_duka' | null
  >(null);
  const [editingSubId, setEditingSubId] = useState<string | null>(null);

  // Kategorial & Service Filters & Import Modals
  const [pelayananKategoriFilter, setPelayananKategoriFilter] = useState<string>('semua');
  const [isImportKategorialModalOpen, setIsImportKategorialModalOpen] = useState(false);
  const [isImportJadwalMingguModalOpen, setIsImportJadwalMingguModalOpen] = useState(false);
  const [isChoosePrintEditionModalOpen, setIsChoosePrintEditionModalOpen] = useState(false);
  const [selectedKatIdsToImport, setSelectedKatIdsToImport] = useState<string[]>([]);
  const [selectedJadwalIdsToImport, setSelectedJadwalIdsToImport] = useState<string[]>([]);
  const [importKatSeksiFilter, setImportKatSeksiFilter] = useState<'ALL' | 'SPB' | 'SPPer' | 'SPPR/P' | 'SPA'>('ALL');
  const [importKatSearch, setImportKatSearch] = useState('');

  const [transaksiFilter, setTransaksiFilter] = useState<'semua' | 'pemasukan' | 'pengeluaran'>('semua');
  const [transaksiSearch, setTransaksiSearch] = useState<string>('');
  const [transaksiPosFilter, setTransaksiPosFilter] = useState<string>('semua');
  const [transaksiTampilanMode, setTransaksiTampilanMode] = useState<'minggu_ini' | 'semua'>('minggu_ini');

  // Helper to generate standardized Warta Jemaat Numbering integrated with app settings (e.g. 001/WARTA-GKE/GCI/II/2026)
  const generateAutoNomorWarta = (targetDate?: string) => {
    const targetD = targetDate ? new Date(targetDate) : new Date();
    const currentYear = isNaN(targetD.getTime()) ? new Date().getFullYear() : targetD.getFullYear();
    const currentMonth = isNaN(targetD.getTime()) ? new Date().getMonth() : targetD.getMonth();

    // Reset otomatis ke 001 setiap awal tahun (filter beritaJemaatList pada tahun yang sama)
    const listThisYear = beritaJemaatList.filter((w) => {
      const y = w.tanggalTerbit
        ? new Date(w.tanggalTerbit).getFullYear()
        : w.nomorEdisi?.match(/\/(\d{4})$/)
        ? parseInt(w.nomorEdisi.match(/\/(\d{4})$/)![1], 10)
        : currentYear;
      return y === currentYear;
    });

    let maxNum = 0;
    listThisYear.forEach((w) => {
      const match = (w.nomorEdisi || '').match(/^(\d+)\//) || (w.nomorEdisi || '').match(/No\.\s*(\d+)/i);
      if (match) {
        const parsed = parseInt(match[1], 10);
        if (!isNaN(parsed) && parsed > maxNum) {
          maxNum = parsed;
        }
      }
    });

    const nextNum = maxNum + 1;
    const count = String(nextNum).padStart(3, '0');
    const monthRoman = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'][
      currentMonth
    ];
    const prefixWarta = settings.prefixWartaJemaat || 'WARTA-GKE';
    const kodeJemaat =
      settings.kodeJemaatPenomoran ||
      (settings.namaJemaat
        ? settings.namaJemaat.replace(/[^A-Za-z]/g, '').slice(0, 3).toUpperCase()
        : 'GCI');

    return `${count}/${prefixWarta}/${kodeJemaat}/${monthRoman}/${currentYear}`;
  };

  // Form state for creating/editing Main Warta Jemaat Header
  const [wartaForm, setWartaForm] = useState<{
    nomorEdisi: string;
    tanggalTerbit: string;
    judulWarta: string;
    temaKhotbah: string;
    natsPembimbing: string;
    status: 'Draf' | 'Diterbitkan' | 'Arsip';
    catatanGembala: string;
  }>({
    nomorEdisi: '',
    tanggalTerbit: new Date().toISOString().split('T')[0],
    judulWarta: 'Warta Jemaat Minggu Ini',
    temaKhotbah: 'Menjadi Pelayan yang Setia dan Rendah Hati',
    natsPembimbing: 'Matius 20 : 26-28',
    status: 'Diterbitkan',
    catatanGembala: 'Tuhan Yesus memberkati seluruh warga Jemaat.',
  });

  // Forms for Sub Items
  const [pelayananForm, setPelayananForm] = useState<Omit<BeritaPelayananItem, 'id'>>({
    namaIbadah: 'Ibadah Minggu Pagi',
    kategoriIbadah: 'Minggu Utama',
    tanggal: new Date().toISOString().split('T')[0],
    waktu: '09.00 WIB',
    tempat: 'Gereja Efata Utama',
    pelayanFirman: 'Pdt. Drs. Yansen K. M.Th',
    liturgos: 'Pnt. Dr. Hendra Wijaya',
    pemusik: 'Sdr. Kevin Rantau, S.Kom.',
    pemanduLagu: 'Tim Cantoria SPPR/P',
    operatorMultimedia: 'Tim IT & Multimedia',
    kolektan: 'Majelis Rayon I',
    penerimaTamu: 'Panitia Penerima Tamu',
    pembacaanAlkitab: 'Yeremia 2: 4-13',
    keteranganKhusus: '',
  });

  const [keuanganForm, setKeuanganForm] = useState<BeritaKeuanganItem>({
    periodeJudul: 'Rekapitulasi Keuangan Minggu Ini',
    tanggalMulai: new Date(Date.now() - 6 * 24 * 3600 * 1000).toISOString().split('T')[0],
    tanggalSelesai: new Date().toISOString().split('T')[0],
    saldoAwal: 100000000,
    totalPemasukan: 15000000,
    totalPengeluaran: 5000000,
    saldoAkhir: 110000000,
    rincianPosKas: [
      { namaPos: 'Kas Umum Jemaat', pemasukan: 10000000, pengeluaran: 3000000, saldo: 70000000 },
      { namaPos: 'Kas Pembangunan', pemasukan: 3000000, pengeluaran: 1000000, saldo: 25000000 },
      { namaPos: 'Kas Diakonia', pemasukan: 1000000, pengeluaran: 1000000, saldo: 8000000 },
      { namaPos: 'Kas Kategorial (SPPer/SPB/SPPR/ASHM)', pemasukan: 1000000, pengeluaran: 0, saldo: 7000000 },
    ],
    catatanKeuangan: 'Laporan pertanggungjawaban kas dapat diperiksa di sekretariat Majelis.',
  });

  const [ulangTahunForm, setUlangTahunForm] = useState<Omit<BeritaUlangTahunItem, 'id'>>({
    jenis: 'kelahiran',
    nama: '',
    rayon: defaultRayon,
    tanggal: new Date().toISOString().split('T')[0],
    keterangan: 'Ulang Tahun Kelahiran',
  });

  const [dukaForm, setDukaForm] = useState<Omit<BeritaDukaItem, 'id'>>({
    namaMeninggal: '',
    usia: 70,
    rayon: defaultRayon,
    tanggalMeninggal: new Date().toISOString().split('T')[0],
    tempatDuka: 'Kediaman Keluarga',
    jadwalPemakaman: 'Pukul 10.00 WIB',
    keluargaYangBerduka: 'Keluarga Besar',
    keterangan: 'Ibadah penghiburan dilaksanakan malam ini.',
  });

  const [nikahForm, setNikahForm] = useState<Omit<UndanganPernikahanItem, 'id'>>({
    namaMempelaiPria: '',
    namaMempelaiWanita: '',
    orangTuaPria: '',
    orangTuaWanita: '',
    rayonAtauJemaatAsal: defaultRayon,
    tanggalPemberkatan: new Date().toISOString().split('T')[0],
    waktuPemberkatan: '09.00 WIB',
    tempatGereja: 'Gereja Efata Utama',
    keterangan: 'Pengumuman / Warta Pernikahan I',
  });

  const [pengumumanForm, setPengumumanForm] = useState<Omit<BeritaTambahanUmum, 'id'>>({
    judul: '',
    kategori: 'Pengumuman Umum',
    tanggal: new Date().toISOString().split('T')[0],
    isi: '',
  });

  // Filtered Warta List
  const filteredWartaList = beritaJemaatList.filter((item) => {
    const matchSearch =
      (item.judulWarta || item.judul || '').toLowerCase().includes(search.toLowerCase()) ||
      (item.nomorEdisi || '').toLowerCase().includes(search.toLowerCase()) ||
      (item.temaKhotbah || '').toLowerCase().includes(search.toLowerCase());
    const matchStatus = selectedStatus === 'semua' ? true : item.status === selectedStatus;
    return matchSearch && matchStatus;
  });

  // Get current active selected Warta document
  const activeWarta = beritaJemaatList.find((w) => w.id === selectedWartaId) || beritaJemaatList[0];

  // Financial data computed specifically for 1 week prior to this warta's publication date
  const activeWartaKeuangan = useMemo(() => {
    if (!activeWarta) return null;
    return computeWartaKeuangan(
      activeWarta.tanggalTerbit,
      keuanganList,
      settings,
      activeWarta.beritaKeuangan?.tanggalMulai,
      activeWarta.beritaKeuangan?.tanggalSelesai
    );
  }, [
    activeWarta?.tanggalTerbit,
    activeWarta?.beritaKeuangan?.tanggalMulai,
    activeWarta?.beritaKeuangan?.tanggalSelesai,
    keuanganList,
    settings,
  ]);

  // Real-time lock status for the currently active selected warta
  const activeLockStatus = useMemo(() => {
    return getWartaLockStatus(activeWarta);
  }, [activeWarta, currentTime]);

  // Deceased church members from live sensus warga jemaat
  const deceasedWargaList = useMemo(() => {
    return (wargaJemaatList || []).filter(
      (w) => w.statusKeanggotaan === 'Meninggal' || !!w.tanggalMeninggal
    );
  }, [wargaJemaatList]);

  // Existing names in active warta's duka list to prevent duplicates or flag status
  const existingWartaDukaNames = useMemo(() => {
    return new Set(
      (activeWarta?.beritaDukaList || []).map((b) => (b.namaMeninggal || '').toLowerCase().trim())
    );
  }, [activeWarta?.beritaDukaList]);

  // Filtered deceased list for sync modal search
  const filteredDeceasedList = useMemo(() => {
    if (!dukaSyncSearch.trim()) return deceasedWargaList;
    const q = dukaSyncSearch.toLowerCase();
    return deceasedWargaList.filter(
      (w) =>
        (w.namaLengkap || '').toLowerCase().includes(q) ||
        (w.rayon || '').toLowerCase().includes(q) ||
        (w.tanggalMeninggal || '').toLowerCase().includes(q) ||
        (w.tempatMeninggal || '').toLowerCase().includes(q)
    );
  }, [deceasedWargaList, dukaSyncSearch]);

  // Helper to open lock / grace period information modal
  const showLockInfoModal = (targetWarta?: BeritaJemaat | null) => {
    const w = targetWarta || activeWarta;
    if (!w) return;
    const lock = getWartaLockStatus(w);
    const pubStr = lock.publishedAtDate
      ? lock.publishedAtDate.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB'
      : 'Penerbitan';
    const endStr = lock.lockEndTime
      ? lock.lockEndTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB'
      : 'Batas 60 Menit';
    setLockNotice({
      isOpen: true,
      mode: lock.isWithinGracePeriod ? 'grace_period' : 'locked',
      wartaTitle: w.judulWarta,
      nomorEdisi: w.nomorEdisi,
      publishedAtText: pubStr,
      remainingText: lock.formattedRemaining,
      lockEndTimeText: endStr,
    });
  };

  // Security Lock Barrier: prevents modifying/deleting published warta once 60 minutes have elapsed
  const checkLockOrWarn = (targetWarta?: BeritaJemaat | null): boolean => {
    const w = targetWarta || activeWarta;
    if (!w) return false;
    const lock = getWartaLockStatus(w);
    if (lock.isLocked) {
      showLockInfoModal(w);
      return true;
    }
    return false;
  };

  // Helper to open Warta Modal for create/edit
  const handleOpenWartaModal = (warta?: BeritaJemaat) => {
    if (warta) {
      if (checkLockOrWarn(warta)) return;
      setEditingWarta(warta);
      setWartaForm({
        nomorEdisi: warta.nomorEdisi,
        tanggalTerbit: warta.tanggalTerbit,
        judulWarta: warta.judulWarta,
        temaKhotbah: warta.temaKhotbah,
        natsPembimbing: warta.natsPembimbing,
        status: warta.status,
        catatanGembala: warta.catatanGembala || '',
      });
    } else {
      setEditingWarta(null);
      const initialDate = new Date().toISOString().split('T')[0];
      setWartaForm({
        nomorEdisi: generateAutoNomorWarta(initialDate),
        tanggalTerbit: initialDate,
        judulWarta: 'Warta Jemaat Minggu Ini',
        temaKhotbah: 'Menjadi Pelayan yang Setia dan Rendah Hati',
        natsPembimbing: 'Matius 20 : 26-28',
        status: 'Diterbitkan',
        catatanGembala: settings.namaJemaat ? `Tuhan Yesus memberkati seluruh warga Jemaat ${settings.namaJemaat}.` : 'Tuhan Yesus memberkati seluruh warga Jemaat.',
      });
    }
    setIsWartaModalOpen(true);
  };

  // Helper to Save Warta Header
  const handleSaveWarta = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingWarta && checkLockOrWarn(editingWarta)) return;

    await runWithProgress(
      editingWarta ? `Memperbarui Edisi Warta ${wartaForm.nomorEdisi}` : `Membuat Edisi Warta ${wartaForm.nomorEdisi}`,
      async () => {
        if (editingWarta) {
          const updatedData: Partial<BeritaJemaat> = {
            ...wartaForm,
            publishedAt:
              wartaForm.status === 'Diterbitkan'
                ? editingWarta.publishedAt || new Date().toISOString()
                : undefined,
          };
          await updateBeritaJemaat(editingWarta.id, JSON.parse(JSON.stringify(updatedData)));
        } else {
          // Auto populate from existing Jadwal Ibadah Minggu and Kegiatan Seksi Kategorial within the 1-week upcoming window (all categories)
          const refDate = wartaForm.tanggalTerbit || safeISODate();
          const sundayServices: BeritaPelayananItem[] = (jadwalIbadahList || [])
            .filter((j) => isDateInOneWeekWindow(j.tanggal, refDate))
            .map((j) => ({
            id: `bp-sun-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            namaIbadah: j.namaIbadah || 'Ibadah Minggu',
            kategoriIbadah: j.namaIbadah?.toLowerCase().includes('spper')
              ? ('SPPer (Perempuan)' as const)
              : j.namaIbadah?.toLowerCase().includes('spb')
              ? ('SPB (Bapak)' as const)
              : j.namaIbadah?.toLowerCase().includes('sppr')
              ? ('SPPR/P (Pemuda)' as const)
              : j.namaIbadah?.toLowerCase().includes('sekolah minggu') || j.namaIbadah?.toLowerCase().includes('spa') || j.namaIbadah?.toLowerCase().includes('ashm')
              ? ('ASHM (Sekolah Minggu)' as const)
              : j.namaIbadah?.toLowerCase().includes('lingkungan') || j.namaIbadah?.toLowerCase().includes('rayon')
              ? ('Kebaktian Lingkungan/Rayon' as const)
              : ('Minggu Utama' as const),
            tanggal: j.tanggal || wartaForm.tanggalTerbit,
            waktu: j.waktu || '09.00 WIB',
            tempat: j.tempat || 'Gereja Efata Utama',
            pelayanFirman: j.pelayanFirman || j.pengkhotbah || 'Pdt. Majelis Jemaat',
            liturgos: j.liturgos || 'Penatua / Diakon',
            pemusik: j.pemusik || 'Organis Jemaat',
            pemanduLagu: j.pemanduLagu || j.kantoria || 'Cantoria',
            operatorMultimedia: j.operatorMultimedia || 'Tim Sound & Multimedia',
            kolektan: 'Majelis Rayon / Panitia Penerima Tamu',
            penerimaTamu: 'Panitia Penerima Tamu',
            pembacaanAlkitab: j.pembacaanAlkitab || 'Sesuai Almanak GKE',
            keteranganKhusus: j.wartaKhusus || '',
          }));

          const kategorialServices: BeritaPelayananItem[] = (kegiatanKategorialList || [])
            .filter(
              (keg) =>
                isDateInOneWeekWindow(keg.tanggal, refDate) &&
                (keg.kategori === 'Ibadah / Kebaktian Seksi' ||
                keg.namaProgram?.toLowerCase().includes('ibadah') ||
                keg.namaProgram?.toLowerCase().includes('kebaktian') ||
                keg.namaProgram?.toLowerCase().includes('persekutuan'))
            )
            .map((keg) => ({
              id: `bp-kat-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
              namaIbadah: keg.namaProgram || `Ibadah Seksi Pelayanan ${keg.seksi}`,
              kategoriIbadah:
                keg.seksi === 'SPB'
                  ? ('SPB (Bapak)' as const)
                  : keg.seksi === 'SPPer'
                  ? ('SPPer (Perempuan)' as const)
                  : keg.seksi === 'SPPR/P'
                  ? ('SPPR/P (Pemuda)' as const)
                  : ('ASHM (Sekolah Minggu)' as const),
              tanggal: keg.tanggal || wartaForm.tanggalTerbit,
              waktu: keg.waktu || '17.00 WIB',
              tempat: keg.tempat || 'Gedung Gereja GKE Efata',
              pelayanFirman: 'Pdt. / Pembina Seksi ' + keg.seksi,
              liturgos: keg.penanggungJawab || 'Pengurus ' + keg.seksi,
              pemusik: 'Tim Musik ' + keg.seksi,
              pemanduLagu: 'Singer / Cantoria ' + keg.seksi,
              operatorMultimedia: 'Tim Multimedia',
              kolektan: 'Pengurus ' + keg.seksi,
              penerimaTamu: 'Seksi Pelayanan ' + keg.seksi,
              pembacaanAlkitab: 'Sesuai Almanak Renungan Seksi ' + keg.seksi + ' GKE',
              keteranganKhusus: keg.keterangan || `Program Kerja Seksi Pelayanan ${keg.seksi}`,
            }));

          const freshPelayanan: BeritaPelayananItem[] = [...sundayServices, ...kategorialServices];

          // Calculate Keuangan summary directly for the 1-week period prior to publication date
          const freshKeuangan = computeWartaKeuangan(
            wartaForm.tanggalTerbit,
            keuanganList,
            settings
          );

          // Auto scan birthdays & wedding anniversaries using exact wargaJemaatList
          const birthdays: BeritaUlangTahunItem[] = extractUlangTahunFromWarga(
            wargaJemaatList,
            wartaForm.tanggalTerbit || safeISODate(),
            'week'
          );

          // Auto scan upcoming wedding announcements from pelayananSakramenList
          const nikahAnnouncements: UndanganPernikahanItem[] = (pelayananSakramenList || [])
            .filter((s) => s.jenisPelayanan === 'nikah')
            .map((s, idx) => ({
              id: `up-${Date.now()}-${idx}`,
              namaMempelaiPria: s.namaUtama || 'Sdr. Mempelai Pria',
              namaMempelaiWanita: s.namaPasangan || 'Sdri. Mempelai Wanita',
              orangTuaPria: s.namaOrangTuaPria || 'Keluarga Mempelai Pria',
              orangTuaWanita: s.namaOrangTuaWanita || 'Keluarga Mempelai Wanita',
              rayonAtauJemaatAsal: s.rayon || 'GKE Efata',
              tanggalPemberkatan: s.tanggalPelayanan || wartaForm.tanggalTerbit || safeISODate(),
              waktuPemberkatan: s.jamPelayanan || '09.00 WIB',
              tempatGereja: s.tempatPelayanan || 'Gereja Efata Utama',
              keterangan: 'Pengumuman Peneguhan & Pemberkatan Nikah Kudus',
            }));

          // Auto scan deceased church members from wargaJemaatList
          const dukaList: BeritaDukaItem[] = extractDukaFromWarga(wargaJemaatList, []);

          const publishedAt = wartaForm.status === 'Diterbitkan' ? new Date().toISOString() : undefined;

          const newWarta: Omit<BeritaJemaat, 'id'> = JSON.parse(
            JSON.stringify({
              ...wartaForm,
              publishedAt,
              beritaPelayananList: freshPelayanan.length > 0 ? freshPelayanan : [],
              beritaKeuangan: freshKeuangan,
              beritaUlangTahunList: birthdays,
              beritaDukaList: dukaList,
              undanganPernikahanList: nikahAnnouncements,
              beritaTambahanList: [],
            })
          );

          const newId = await addBeritaJemaat(newWarta);
          if (newId) {
            setSelectedWartaId(newId);
          }
        }
        setIsWartaModalOpen(false);
      }
    );
  };

  // Helper to trigger custom delete modal for Warta Edisi
  const handleDeleteWarta = (id: string) => {
    const targetWarta = beritaJemaatList.find((w) => w.id === id);
    if (!isAdmin && targetWarta && checkLockOrWarn(targetWarta)) return;
    const isLocked = targetWarta ? getWartaLockStatus(targetWarta).isLocked : false;
    const label = targetWarta ? `${targetWarta.nomorEdisi} - ${targetWarta.judulWarta}` : 'Edisi Warta';
    setDeleteTarget({
      type: 'warta',
      id,
      title: isLocked ? `${label} (Terkunci - Wewenang Khusus Admin)` : label,
    });
  };

  const handleDeletePelayananItem = (itemId: string) => {
    if (checkLockOrWarn()) return;
    const item = activeWarta?.beritaPelayananList.find((i) => i.id === itemId);
    setDeleteTarget({
      type: 'pelayanan',
      id: itemId,
      title: item ? `Jadwal Pelayanan: ${item.namaIbadah}` : 'Jadwal Pelayanan',
    });
  };

  const handleDeleteTransaksiItem = (trId: string) => {
    if (checkLockOrWarn()) return;
    const item = activeWarta?.beritaKeuangan?.rincianTransaksiMingguIni?.find((i) => i.id === trId);
    setDeleteTarget({
      type: 'transaksi',
      id: trId,
      title: item ? `Rincian Transaksi: ${item.keterangan}` : 'Rincian Transaksi',
    });
  };

  const handleDeleteUlangTahunItem = (itemId: string) => {
    if (checkLockOrWarn()) return;
    const item = activeWarta?.beritaUlangTahunList.find((i) => i.id === itemId);
    setDeleteTarget({
      type: 'ulang_tahun',
      id: itemId,
      title: item ? `Ulang Tahun: ${item.nama}` : 'Berita Ulang Tahun',
    });
  };

  const handleDeleteDukaItem = (itemId: string) => {
    if (checkLockOrWarn()) return;
    const item = activeWarta?.beritaDukaList.find((i) => i.id === itemId);
    setDeleteTarget({
      type: 'duka',
      id: itemId,
      title: item ? `Berita Duka: ${item.namaAlmarhum}` : 'Berita Duka',
    });
  };

  const handleDeleteNikahItem = (itemId: string) => {
    if (checkLockOrWarn()) return;
    const item = activeWarta?.undanganPernikahanList.find((i) => i.id === itemId);
    setDeleteTarget({
      type: 'nikah',
      id: itemId,
      title: item ? `Warta Pernikahan: ${item.namaMempelaiPria} & ${item.namaMempelaiWanita}` : 'Warta Pernikahan',
    });
  };

  const handleDeletePengumumanItem = (itemId: string) => {
    if (checkLockOrWarn()) return;
    const item = activeWarta?.beritaTambahanList.find((i) => i.id === itemId);
    setDeleteTarget({
      type: 'pengumuman',
      id: itemId,
      title: item ? `Pengumuman: ${item.judul}` : 'Pengumuman / Informasi',
    });
  };

  // Master confirmation executor for all delete actions
  const confirmExecuteDelete = async () => {
    if (!deleteTarget) return;

    if (deleteTarget.type === 'warta') {
      const targetWarta = beritaJemaatList.find((w) => w.id === deleteTarget.id);
      if (!isAdmin && targetWarta && checkLockOrWarn(targetWarta)) {
        setDeleteTarget(null);
        return;
      }
    } else {
      if (checkLockOrWarn(activeWarta)) {
        setDeleteTarget(null);
        return;
      }
    }

    setIsDeleting(true);
    await runWithProgress(`Menghapus ${deleteTarget.title}`, async () => {
      const { type, id } = deleteTarget;
      if (type === 'warta') {
        await deleteBeritaJemaat(id);
        const remaining = beritaJemaatList.filter((w) => w.id !== id);
        if (remaining.length > 0) {
          setSelectedWartaId(remaining[0].id);
        } else {
          setSelectedWartaId('');
        }
      } else if (activeWarta) {
        if (type === 'pelayanan') {
          const updatedList = activeWarta.beritaPelayananList.filter((item) => item.id !== id);
          await updateBeritaJemaat(activeWarta.id, { beritaPelayananList: updatedList });
        } else if (type === 'transaksi') {
          const currentKeuangan = activeWarta.beritaKeuangan || activeWartaKeuangan;
          const currentList = currentKeuangan?.rincianTransaksiMingguIni || [];
          const updatedTransaksi = currentList.filter((tr) => tr.id !== id);
          const calcTotalIn = updatedTransaksi.reduce((acc, curr) => (curr.jenis === 'pemasukan' ? acc + curr.jumlah : acc), 0);
          const calcTotalOut = updatedTransaksi.reduce((acc, curr) => (curr.jenis === 'pengeluaran' ? acc + curr.jumlah : acc), 0);

          const updatedKeuangan: BeritaKeuanganItem = {
            ...(currentKeuangan as BeritaKeuanganItem),
            totalPemasukan: calcTotalIn,
            totalPengeluaran: calcTotalOut,
            saldoAkhir: ((currentKeuangan?.saldoAwal) || 0) + (calcTotalIn - calcTotalOut),
            rincianTransaksiMingguIni: updatedTransaksi,
          };
          await updateBeritaJemaat(activeWarta.id, { beritaKeuangan: updatedKeuangan });
        } else if (type === 'ulang_tahun') {
          const updatedList = activeWarta.beritaUlangTahunList.filter((item) => item.id !== id);
          await updateBeritaJemaat(activeWarta.id, { beritaUlangTahunList: updatedList });
        } else if (type === 'duka') {
          const updatedList = activeWarta.beritaDukaList.filter((item) => item.id !== id);
          await updateBeritaJemaat(activeWarta.id, { beritaDukaList: updatedList });
        } else if (type === 'nikah') {
          const updatedList = activeWarta.undanganPernikahanList.filter((item) => item.id !== id);
          await updateBeritaJemaat(activeWarta.id, { undanganPernikahanList: updatedList });
        } else if (type === 'pengumuman') {
          const updatedList = activeWarta.beritaTambahanList.filter((item) => item.id !== id);
          await updateBeritaJemaat(activeWarta.id, { beritaTambahanList: updatedList });
        }
      }
      setIsDeleting(false);
      setDeleteTarget(null);
    });
  };

  // -------------------------------------------------------------
  // SUB ITEM FORM SAVE HANDLERS & KEUANGAN SYNC
  // -------------------------------------------------------------
  const handleExecuteImportKategorial = async () => {
    if (!activeWarta || selectedKatIdsToImport.length === 0) return;
    if (checkLockOrWarn()) return;
    const selectedItems = (kegiatanKategorialList || []).filter((k) => selectedKatIdsToImport.includes(k.id));
    if (selectedItems.length === 0) return;

    const newPelayananItems: BeritaPelayananItem[] = selectedItems.map((keg) => {
      const mappedCategory =
        keg.seksi === 'SPB'
          ? ('SPB (Bapak)' as const)
          : keg.seksi === 'SPPer'
          ? ('SPPer (Perempuan)' as const)
          : keg.seksi === 'SPPR/P'
          ? ('SPPR/P (Pemuda)' as const)
          : ('ASHM (Sekolah Minggu)' as const);

      return {
        id: `bp-kat-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        namaIbadah: keg.namaProgram || `Ibadah Seksi Pelayanan ${keg.seksi}`,
        kategoriIbadah: mappedCategory,
        tanggal: keg.tanggal || activeWarta.tanggalTerbit,
        waktu: keg.waktu || '17.00 WIB',
        tempat: keg.tempat || 'Gedung Gereja GKE Efata',
        pelayanFirman: 'Pdt. / Pembina Seksi ' + keg.seksi,
        liturgos: keg.penanggungJawab || 'Pengurus Seksi ' + keg.seksi,
        pemusik: 'Tim Musik ' + keg.seksi,
        pemanduLagu: 'Vocal Group / Singer ' + keg.seksi,
        operatorMultimedia: 'Tim Multimedia',
        kolektan: 'Pengurus Seksi ' + keg.seksi,
        penerimaTamu: 'Seksi Pelayanan ' + keg.seksi,
        pembacaanAlkitab: 'Sesuai Renungan Almanak ' + keg.seksi + ' GKE',
        keteranganKhusus: keg.keterangan || `Program Kerja Seksi Pelayanan ${keg.seksi}`,
      };
    });

    await runWithProgress(`Mengimpor ${newPelayananItems.length} Ibadah Kategorial ke Warta`, async () => {
      const updatedList = [...(activeWarta.beritaPelayananList || []), ...newPelayananItems];
      await updateBeritaJemaat(activeWarta.id, { beritaPelayananList: updatedList });
      setIsImportKategorialModalOpen(false);
      setSelectedKatIdsToImport([]);
    });
  };

  const handleExecuteImportJadwalMinggu = async () => {
    if (!activeWarta || selectedJadwalIdsToImport.length === 0) return;
    if (checkLockOrWarn()) return;
    const selectedItems = (jadwalIbadahList || []).filter((j) => selectedJadwalIdsToImport.includes(j.id));
    if (selectedItems.length === 0) return;

    const newPelayananItems: BeritaPelayananItem[] = selectedItems.map((j) => ({
      id: `bp-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      namaIbadah: j.namaIbadah || 'Ibadah Minggu',
      kategoriIbadah: j.namaIbadah?.toLowerCase().includes('spper')
        ? ('SPPer (Perempuan)' as const)
        : j.namaIbadah?.toLowerCase().includes('spb')
        ? ('SPB (Bapak)' as const)
        : j.namaIbadah?.toLowerCase().includes('sppr')
        ? ('SPPR/P (Pemuda)' as const)
        : j.namaIbadah?.toLowerCase().includes('sekolah minggu') || j.namaIbadah?.toLowerCase().includes('spa') || j.namaIbadah?.toLowerCase().includes('ashm')
        ? ('ASHM (Sekolah Minggu)' as const)
        : j.namaIbadah?.toLowerCase().includes('lingkungan') || j.namaIbadah?.toLowerCase().includes('rayon')
        ? ('Kebaktian Lingkungan/Rayon' as const)
        : ('Minggu Utama' as const),
      tanggal: j.tanggal || activeWarta.tanggalTerbit,
      waktu: j.waktu || '09.00 WIB',
      tempat: j.tempat || 'Gereja Efata Utama',
      pelayanFirman: j.pelayanFirman || j.pengkhotbah || 'Pdt. Majelis Jemaat',
      liturgos: j.liturgos || 'Penatua / Diakon',
      pemusik: j.pemusik || 'Organis Jemaat',
      pemanduLagu: j.pemanduLagu || j.kantoria || 'Cantoria',
      operatorMultimedia: j.operatorMultimedia || 'Tim Sound & Multimedia',
      kolektan: 'Majelis Rayon / Panitia Penerima Tamu',
      penerimaTamu: 'Panitia Penerima Tamu',
      pembacaanAlkitab: j.pembacaanAlkitab || 'Sesuai Almanak GKE',
      keteranganKhusus: j.wartaKhusus || '',
    }));

    await runWithProgress(`Mengimpor ${newPelayananItems.length} Jadwal Ibadah ke Warta`, async () => {
      const updatedList = [...(activeWarta.beritaPelayananList || []), ...newPelayananItems];
      await updateBeritaJemaat(activeWarta.id, { beritaPelayananList: updatedList });
      setIsImportJadwalMingguModalOpen(false);
      setSelectedJadwalIdsToImport([]);
    });
  };

  const handleSavePelayananItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeWarta) return;
    if (checkLockOrWarn()) return;

    await runWithProgress('Menyimpan Jadwal Pelayanan', async () => {
      let updatedList = [...activeWarta.beritaPelayananList];
      if (editingSubId) {
        updatedList = updatedList.map((item) =>
          item.id === editingSubId ? { ...pelayananForm, id: editingSubId } : item
        );
      } else {
        updatedList.push({
          ...pelayananForm,
          id: `bp-${Date.now()}`,
        });
      }

      await updateBeritaJemaat(activeWarta.id, { beritaPelayananList: updatedList });
      setModalType(null);
      setEditingSubId(null);
    });
  };

  const handleSaveKeuangan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeWarta) return;
    if (checkLockOrWarn()) return;

    await runWithProgress('Menyimpan Ringkasan Keuangan Warta', async () => {
      await updateBeritaJemaat(activeWarta.id, { beritaKeuangan: keuanganForm });
      setModalType(null);
    });
  };

  const handleSyncKeuanganLive = async () => {
    if (!activeWarta) return;
    if (checkLockOrWarn()) return;

    await runWithProgress('Sinkronisasi Keuangan 1 Minggu Sebelum Terbit Warta', async () => {
      const updatedKeuangan = computeWartaKeuangan(
        activeWarta.tanggalTerbit,
        keuanganList,
        settings,
        activeWarta.beritaKeuangan?.tanggalMulai,
        activeWarta.beritaKeuangan?.tanggalSelesai
      );

      await updateBeritaJemaat(activeWarta.id, { beritaKeuangan: updatedKeuangan });
    });
  };

  const handleSyncJadwalIbadahLive = async () => {
    if (!activeWarta) return;
    if (checkLockOrWarn()) return;

    await runWithProgress('Sinkronisasi Jadwal Ibadah 1 Minggu ke Depan dengan Database Terkini', async () => {
      const refDate = activeWarta.tanggalTerbit || safeISODate();
      const liveList: BeritaPelayananItem[] = (jadwalIbadahList || [])
        .filter((j) => isDateInOneWeekWindow(j.tanggal, refDate))
        .map((j) => ({
          id: j.id || `bp-ji-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          namaIbadah: j.namaIbadah || 'Ibadah Jemaat',
          kategoriIbadah: j.kategoriIbadah || (j.seksi ? `Kategorial ${j.seksi}` : j.rayon ? `Rayon ${j.rayon}` : 'Minggu Utama'),
          seksi: j.seksi,
          rayon: j.rayon,
          tanggal: j.tanggal || activeWarta.tanggalTerbit,
          waktu: j.waktu || '09.00 WIB',
          tempat: j.tempat || 'Gedung Gereja Utama',
          tuanRumah: j.tuanRumah || '',
          pelayanFirman: j.pelayanFirman || j.pengkhotbah || 'Pdt. Majelis Jemaat',
          natsKhotbah: j.natsKhotbah || j.pembacaanAlkitab || '',
          koordinatorPelayanan: j.koordinatorPelayanan || '',
          liturgos: j.liturgos || 'Penatua / Diakon',
          pemusik: j.pemusik || 'Organis Jemaat',
          pemanduLagu: j.pemanduLagu || j.kantoria || 'Cantoria / Singer',
          kantoria: j.pemanduLagu || j.kantoria || 'Cantoria / Singer',
          operatorMultimedia: j.operatorMultimedia || '',
          kolektan: j.kolektan || '',
          penerimaTamu: j.penerimaTamu || '',
          pembacaanAlkitab: j.pembacaanAlkitab || '',
          pewartaBerita: j.pewartaBerita || '',
          kuponUndian: j.kuponUndian || '',
          keteranganKhusus: j.wartaKhusus || j.keteranganKhusus || '',
        }));

      liveList.sort((a, b) => {
        const dateComp = (a.tanggal || '').localeCompare(b.tanggal || '');
        if (dateComp !== 0) return dateComp;
        return (a.waktu || '').localeCompare(b.waktu || '');
      });

      await updateBeritaJemaat(activeWarta.id, { beritaPelayananList: liveList });
    });
  };

  const handleSyncAllWartaLive = async () => {
    if (!activeWarta) return;
    if (checkLockOrWarn()) return;

    await runWithProgress('Sinkronisasi Komprehensif Seluruh Data Warta Jemaat', async () => {
      // 1. Sync Jadwal Ibadah (Filtered strictly to 1 week upcoming window relative to tanggalTerbit across all categories)
      const refDate = activeWarta.tanggalTerbit || safeISODate();
      const liveList: BeritaPelayananItem[] = (jadwalIbadahList || [])
        .filter((j) => isDateInOneWeekWindow(j.tanggal, refDate))
        .map((j) => ({
          id: j.id || `bp-ji-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          namaIbadah: j.namaIbadah || 'Ibadah Jemaat',
          kategoriIbadah: j.kategoriIbadah || (j.seksi ? `Kategorial ${j.seksi}` : j.rayon ? `Rayon ${j.rayon}` : 'Minggu Utama'),
          seksi: j.seksi,
          rayon: j.rayon,
          tanggal: j.tanggal || activeWarta.tanggalTerbit,
          waktu: j.waktu || '09.00 WIB',
          tempat: j.tempat || 'Gedung Gereja Utama',
          tuanRumah: j.tuanRumah || '',
          pelayanFirman: j.pelayanFirman || j.pengkhotbah || 'Pdt. Majelis Jemaat',
          natsKhotbah: j.natsKhotbah || j.pembacaanAlkitab || '',
          koordinatorPelayanan: j.koordinatorPelayanan || '',
          liturgos: j.liturgos || 'Penatua / Diakon',
          pemusik: j.pemusik || 'Organis Jemaat',
          pemanduLagu: j.pemanduLagu || j.kantoria || 'Cantoria / Singer',
          kantoria: j.pemanduLagu || j.kantoria || 'Cantoria / Singer',
          operatorMultimedia: j.operatorMultimedia || '',
          kolektan: j.kolektan || '',
          penerimaTamu: j.penerimaTamu || '',
          pembacaanAlkitab: j.pembacaanAlkitab || '',
          pewartaBerita: j.pewartaBerita || '',
          kuponUndian: j.kuponUndian || '',
          keteranganKhusus: j.wartaKhusus || j.keteranganKhusus || '',
        }));

      liveList.sort((a, b) => {
        const dateComp = (a.tanggal || '').localeCompare(b.tanggal || '');
        if (dateComp !== 0) return dateComp;
        return (a.waktu || '').localeCompare(b.waktu || '');
      });

      // 2. Sync Keuangan (1 Minggu Sebelum Terbit Warta Baru)
      const updatedKeuangan = computeWartaKeuangan(
        activeWarta.tanggalTerbit,
        keuanganList,
        settings,
        activeWarta.beritaKeuangan?.tanggalMulai,
        activeWarta.beritaKeuangan?.tanggalSelesai
      );

      // 3. Sync Ulang Tahun Kelahiran & Pernikahan
      const liveBirthdays = extractUlangTahunFromWarga(
        wargaJemaatList,
        activeWarta.tanggalTerbit || safeISODate(),
        'week'
      );

      // 4. Sync Berita Duka dari Arsip Kematian Warga Jemaat
      const liveDuka = extractDukaFromWarga(
        wargaJemaatList,
        activeWarta.beritaDukaList || []
      );

      await updateBeritaJemaat(activeWarta.id, {
        beritaPelayananList: liveList,
        beritaKeuangan: updatedKeuangan,
        beritaUlangTahunList: liveBirthdays,
        beritaDukaList: liveDuka,
      });
    });
  };

  const handleSyncUlangTahunLive = async () => {
    if (!activeWarta) return;
    if (checkLockOrWarn()) return;

    await runWithProgress('Sinkronisasi Ulang Tahun dari Database Warga Jemaat', async () => {
      const extracted = extractUlangTahunFromWarga(
        wargaJemaatList,
        activeWarta.tanggalTerbit || safeISODate(),
        'week'
      );
      await updateBeritaJemaat(activeWarta.id, {
        beritaUlangTahunList: extracted,
      });
    });
  };

  const handleSyncDukaFromWargaLive = async (targetIds?: string[], mode: 'merge' | 'replace' = 'merge') => {
    if (!activeWarta) return;
    if (checkLockOrWarn()) return;

    await runWithProgress('Sinkronisasi Berita Duka dari Arsip Kematian Jemaat', async () => {
      const candidates = targetIds && targetIds.length > 0
        ? deceasedWargaList.filter((w) => targetIds.includes(w.id))
        : deceasedWargaList;

      if (candidates.length === 0) {
        setModalType(null);
        return;
      }

      let updatedList = mode === 'replace' ? [] : [...(activeWarta.beritaDukaList || [])];

      candidates.forEach((w) => {
        const calculatedAge = calculateAgeAtDeath(w.tanggalLahir, w.tanggalMeninggal);
        const tempatDuka = w.tempatMeninggal || w.alamat || 'Kediaman Keluarga';
        const jadwalPemakaman = [
          w.tempatPemakaman || '',
          w.pelayanPemakaman ? `Pelayan: ${w.pelayanPemakaman}` : '',
        ].filter(Boolean).join(' • ') || 'TPU Kristen';
        const keluargaYangBerduka = w.keluargaDitinggalkan || `Keluarga Besar Alm. ${w.namaLengkap}`;
        const keterangan = [
          w.keteranganMeninggal || '',
          w.nomorSuratKematian ? `Surat Kematian No: ${w.nomorSuratKematian}` : '',
        ].filter(Boolean).join(' | ');

        const normName = (w.namaLengkap || '').toLowerCase().trim();
        const existingIdx = updatedList.findIndex(
          (d) => (d.namaMeninggal || '').toLowerCase().trim() === normName
        );

        const dukaItem: BeritaDukaItem = {
          id: existingIdx >= 0 ? updatedList[existingIdx].id : `bd-warga-${w.id}`,
          namaMeninggal: w.namaLengkap,
          usia: calculatedAge > 0 ? calculatedAge : 70,
          rayon: w.rayon || defaultRayon,
          tanggalMeninggal: w.tanggalMeninggal || safeISODate(),
          tempatDuka,
          jadwalPemakaman,
          keluargaYangBerduka,
          keterangan: keterangan || 'Ibadah penghiburan keluarga dilaksanakan di rumah duka.',
        };

        if (existingIdx >= 0) {
          updatedList[existingIdx] = {
            ...updatedList[existingIdx],
            ...dukaItem,
            id: updatedList[existingIdx].id,
          };
        } else {
          updatedList.push(dukaItem);
        }
      });

      // Sort recent first
      updatedList.sort((a, b) => (b.tanggalMeninggal || '').localeCompare(a.tanggalMeninggal || ''));

      await updateBeritaJemaat(activeWarta.id, { beritaDukaList: updatedList });
      setModalType(null);
    });
  };

  const handleSaveUlangTahunItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeWarta) return;
    if (checkLockOrWarn()) return;

    await runWithProgress('Menyimpan Data Ulang Tahun', async () => {
      let updatedList = [...activeWarta.beritaUlangTahunList];
      if (editingSubId) {
        updatedList = updatedList.map((item) =>
          item.id === editingSubId ? { ...ulangTahunForm, id: editingSubId } : item
        );
      } else {
        updatedList.push({
          ...ulangTahunForm,
          id: `ut-${Date.now()}`,
        });
      }

      await updateBeritaJemaat(activeWarta.id, { beritaUlangTahunList: updatedList });
      setModalType(null);
      setEditingSubId(null);
    });
  };

  const handleSaveDukaItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeWarta) return;
    if (checkLockOrWarn()) return;

    await runWithProgress('Menyimpan Berita Duka Cita', async () => {
      let updatedList = [...activeWarta.beritaDukaList];
      if (editingSubId) {
        updatedList = updatedList.map((item) => (item.id === editingSubId ? { ...dukaForm, id: editingSubId } : item));
      } else {
        updatedList.push({ ...dukaForm, id: `bd-${Date.now()}` });
      }

      await updateBeritaJemaat(activeWarta.id, { beritaDukaList: updatedList });
      setModalType(null);
      setEditingSubId(null);
    });
  };

  const handleSaveNikahItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeWarta) return;
    if (checkLockOrWarn()) return;

    await runWithProgress('Menyimpan Undangan Pernikahan', async () => {
      let updatedList = [...activeWarta.undanganPernikahanList];
      if (editingSubId) {
        updatedList = updatedList.map((item) => (item.id === editingSubId ? { ...nikahForm, id: editingSubId } : item));
      } else {
        updatedList.push({ ...nikahForm, id: `up-${Date.now()}` });
      }

      await updateBeritaJemaat(activeWarta.id, { undanganPernikahanList: updatedList });
      setModalType(null);
      setEditingSubId(null);
    });
  };

  const handleSavePengumumanItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeWarta) return;
    if (checkLockOrWarn()) return;

    await runWithProgress('Menyimpan Pengumuman / Informasi', async () => {
      let updatedList = [...activeWarta.beritaTambahanList];
      if (editingSubId) {
        updatedList = updatedList.map((item) =>
          item.id === editingSubId ? { ...pengumumanForm, id: editingSubId } : item
        );
      } else {
        updatedList.push({ ...pengumumanForm, id: `bt-${Date.now()}` });
      }

      await updateBeritaJemaat(activeWarta.id, { beritaTambahanList: updatedList });
      setModalType(null);
      setEditingSubId(null);
    });
  };

  return (
    <div className="space-y-6">
      {/* Module Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 rounded-2xl p-5 md:p-6 shadow-xl relative overflow-hidden">
        <div className="absolute -right-6 -bottom-6 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 text-indigo-400 font-semibold text-xs tracking-wider uppercase mb-1">
              <Newspaper className="w-4 h-4" />
              <span>Publikasi & Warta Resmi Gereja</span>
            </div>
            <h1 className="text-xl md:text-2xl font-black text-slate-100 flex items-center gap-2">
              <span>Berita & Warta Jemaat</span>
              <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Edisi Pelayanan
              </span>
            </h1>
            <p className="text-slate-400 text-xs mt-1 max-w-2xl leading-relaxed">
              Pusat informasi berita pelayanan ibadah kategorial & Minggu, rekapitulasi keuangan, warta sukacita ulang tahun, serta berita duka dan warta pernikahan.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {isManagement && (
              <button
                onClick={() => handleOpenWartaModal()}
                className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition shadow-lg shadow-indigo-600/20 flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>Buat Warta Baru</span>
              </button>
            )}

            {activeWarta && (
              <button
                onClick={() =>
                  openPrintReport({
                    reportType: 'berita_jemaat',
                    beritaJemaatId: activeWarta.id,
                    customTitle: `WARTA JEMAAT - ${activeWarta.nomorEdisi}`,
                  })
                }
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs transition flex items-center gap-2"
              >
                <Printer className="w-4 h-4 text-cyan-400" />
                <span>Cetak / Pratinjau Warta</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Selector Edisi Warta & Filter Toolbar */}
      <div className="bg-slate-900/80 rounded-2xl p-4 border border-slate-800/80 shadow-md backdrop-blur-md flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 text-xs">
        {/* Left Search & Status Filter */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-1">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari edisi, judul, atau tema khotbah..."
              className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-xs"
            />
          </div>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-indigo-500 font-medium text-xs shrink-0"
          >
            <option value="semua">Semua Status</option>
            <option value="Diterbitkan">Diterbitkan</option>
            <option value="Draf">Draf</option>
            <option value="Arsip">Arsip</option>
          </select>
        </div>

        {/* Right Edisi Dropdown List & Quick Actions */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-2 border-t border-slate-800/60 lg:pt-0 lg:border-0">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span className="text-slate-400 font-medium shrink-0 text-xs">Pilih Edisi:</span>
            <select
              value={selectedWartaId}
              onChange={(e) => setSelectedWartaId(e.target.value)}
              className="w-full sm:w-auto min-w-0 flex-1 px-3 py-2.5 rounded-xl bg-indigo-950/80 border border-indigo-500/30 text-indigo-200 font-bold focus:outline-none focus:border-indigo-400 truncate text-xs"
            >
              {filteredWartaList.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.nomorEdisi} ({safeFormatDate(w.tanggalTerbit, { day: 'numeric', month: 'short', year: 'numeric' })})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 justify-end shrink-0">
            {isManagement && (
              <button
                onClick={() => setIsListModalOpen(true)}
                className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-slate-700 font-semibold text-xs transition flex items-center gap-1.5 shrink-0"
                title="Kelola & Lihat Semua Edisi Warta"
              >
                <List className="w-4 h-4 text-indigo-400" />
                <span>Daftar Edisi ({beritaJemaatList.length})</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Active Warta Header Card */}
      {activeWarta ? (
        <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-4 sm:p-5 shadow-lg space-y-4">
          {/* Header Card: 4-Row Layout */}
          <div className="flex flex-col gap-2.5 border-b border-slate-800 pb-4">
            {/* Baris 1: Nomor Warta Jemaat */}
            <div>
              <span className="warta-badge-nomor inline-flex items-center gap-1.5 font-mono text-xs font-bold text-white bg-blue-600 px-3 py-1 rounded-lg border border-blue-400/50 shadow-sm tracking-wide">
                <FileText className="w-3.5 h-3.5 text-blue-100" />
                <span>Nomor: {activeWarta.nomorEdisi}</span>
              </span>
            </div>

            {/* Baris 2: Warta Jemaat Minggu ini */}
            <div>
              <h2 className="text-xl md:text-2xl font-black text-slate-100 tracking-tight leading-snug">
                {activeWarta.judulWarta}
              </h2>
            </div>

            {/* Baris 3: Tanggal dan Status Diterbitkan */}
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="text-xs text-slate-300 flex items-center gap-1.5 font-medium">
                <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                <span>
                  {safeFormatDate(activeWarta.tanggalTerbit, {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </span>
              </span>
              <span className="text-slate-600">•</span>
              <span
                className={`warta-badge-status text-[11px] font-bold px-2.5 py-0.5 rounded-md flex items-center gap-1.5 border shadow-xs ${
                  activeWarta.status === 'Diterbitkan'
                    ? 'bg-emerald-600 text-white border-emerald-400/60'
                    : activeWarta.status === 'Draf'
                    ? 'bg-amber-600 text-white border-amber-400/60 status-draf'
                    : 'bg-slate-700 text-slate-200 border-slate-500 status-arsip'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-white shadow-xs"></span>
                <span>Status: {activeWarta.status}</span>
              </span>
            </div>

            {/* Baris 4: Semua Tombol */}
            <div className="flex flex-wrap items-center gap-2 pt-1.5">
              {isManagement && (
                <button
                  type="button"
                  onClick={() => {
                    if (checkLockOrWarn(activeWarta)) return;
                    handleSyncAllWartaLive();
                  }}
                  className={`px-3.5 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 transition shadow-md cursor-pointer ${
                    activeLockStatus.isLocked
                      ? 'bg-slate-800 text-rose-300 border border-rose-500/40 hover:bg-slate-700'
                      : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30'
                  }`}
                  title={
                    activeLockStatus.isLocked
                      ? 'Edisi terkunci permanen (> 60 menit setelah diterbitkan)'
                      : activeLockStatus.isWithinGracePeriod
                      ? `Masa revisi aktif (sisa waktu edit: ${activeLockStatus.formattedRemaining})`
                      : 'Sinkronkan Jadwal Ibadah, Keuangan Kas, Ulang Tahun, Pernikahan & Kematian Secara Otomatis'
                  }
                >
                  {activeLockStatus.isLocked ? (
                    <Lock className="w-3.5 h-3.5 text-rose-400" />
                  ) : (
                    <RefreshCw className="w-3.5 h-3.5" />
                  )}
                  <span>Sinkronkan Semua Data</span>
                </button>
              )}

              <button
                type="button"
                onClick={() =>
                  openPrintReport({
                    reportType: 'berita_jemaat',
                    beritaJemaatId: activeWarta.id,
                    customTitle: `WARTA JEMAAT GKE - ${activeWarta.nomorEdisi}`,
                  })
                }
                className="px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center gap-1.5 transition shadow-md shadow-cyan-600/30 cursor-pointer"
                title="Cetak Dokumen Laporan Resmi Warta Jemaat GKE"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Cetak Warta ({activeWarta.nomorEdisi})</span>
              </button>

              <button
                type="button"
                onClick={() => setIsChoosePrintEditionModalOpen(true)}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/40 font-bold text-xs flex items-center gap-1.5 transition shadow-sm cursor-pointer"
                title="Pilih edisi warta jemaat lain yang ingin dicetak"
              >
                <FileText className="w-3.5 h-3.5 text-cyan-400" />
                <span>Pilih Edisi Cetak</span>
              </button>

              {isManagement && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      if (checkLockOrWarn(activeWarta)) return;
                      handleOpenWartaModal(activeWarta);
                    }}
                    className={`px-3.5 py-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                      activeLockStatus.isLocked
                        ? 'bg-slate-800 text-rose-300 border border-rose-500/40 hover:bg-slate-700'
                        : 'bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-slate-700'
                    }`}
                    title={
                      activeLockStatus.isLocked
                        ? 'Edisi terkunci permanen (> 60 menit setelah diterbitkan)'
                        : 'Edit Header Edisi'
                    }
                  >
                    {activeLockStatus.isLocked ? (
                      <Lock className="w-3.5 h-3.5 text-rose-400" />
                    ) : (
                      <Edit2 className="w-3.5 h-3.5" />
                    )}
                    <span>Edit Edisi</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (!isAdmin && checkLockOrWarn(activeWarta)) return;
                      handleDeleteWarta(activeWarta.id);
                    }}
                    className={`px-3.5 py-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                      activeLockStatus.isLocked
                        ? (isAdmin
                            ? 'bg-rose-950/80 hover:bg-rose-900 text-rose-200 border border-rose-600 shadow-xs'
                            : 'bg-slate-800 text-rose-300 border border-rose-500/40 hover:bg-slate-700')
                        : 'bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-800/60'
                    }`}
                    title={
                      activeLockStatus.isLocked
                        ? (isAdmin
                            ? 'Hapus Edisi Warta Terkunci (Wewenang Khusus Akun Admin)'
                            : 'Edisi terkunci permanen (> 60 menit setelah diterbitkan)')
                        : 'Hapus Edisi Warta Ini'
                    }
                  >
                    {activeLockStatus.isLocked && !isAdmin ? (
                      <Lock className="w-3.5 h-3.5 text-rose-400" />
                    ) : (
                      <Trash2 className="w-3.5 h-3.5" />
                    )}
                    <span>Hapus{activeLockStatus.isLocked && isAdmin ? ' (Admin)' : ''}</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Banner 1: Masa Revisi / Edit Terbuka (0 - 60 Menit Sejak Diterbitkan) */}
          {activeLockStatus.isWithinGracePeriod && (
            <div className="bg-gradient-to-r from-emerald-950/80 via-slate-900 to-indigo-950/80 border border-emerald-500/50 rounded-2xl p-4 sm:p-5 text-emerald-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl relative overflow-hidden">
              <div className="flex items-start gap-3.5">
                <div className="p-2.5 bg-emerald-500/20 text-emerald-300 rounded-xl shrink-0 border border-emerald-500/40 shadow-inner">
                  <Clock className="w-5 h-5 animate-pulse" />
                </div>
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="font-bold text-emerald-200 text-sm">
                      Masa Revisi / Edit Terbuka (60 Menit Sejak Diterbitkan)
                    </h4>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-500/30 text-emerald-200 border border-emerald-400/40 font-mono tracking-wider">
                      Sisa Waktu Edit: {activeLockStatus.formattedRemaining}
                    </span>
                  </div>
                  <p className="text-xs text-emerald-200/80 leading-relaxed max-w-3xl">
                    Edisi warta ini telah diterbitkan resmi pada pukul{' '}
                    <strong className="text-emerald-100">
                      {activeLockStatus.publishedAtDate?.toLocaleTimeString('id-ID', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}{' '}
                      WIB
                    </strong>
                    . Anda masih dapat melakukan koreksi, perubahan data, atau sinkronisasi selama kurun waktu{' '}
                    <strong className="text-emerald-100">60 menit</strong> sejak diterbitkan (hingga pukul{' '}
                    <strong className="text-emerald-100">
                      {activeLockStatus.lockEndTime?.toLocaleTimeString('id-ID', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}{' '}
                      WIB
                    </strong>
                    ). Setelah batas waktu tersebut, warta akan otomatis terkunci permanen.
                  </p>
                </div>
              </div>
              <div className="shrink-0 flex items-center gap-2 self-end sm:self-center">
                <button
                  type="button"
                  onClick={() => showLockInfoModal(activeWarta)}
                  className="px-3.5 py-2 rounded-xl bg-emerald-900/60 hover:bg-emerald-800 text-emerald-200 border border-emerald-600/50 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition shadow"
                >
                  <Info className="w-4 h-4 text-emerald-300" />
                  <span>Info Batas Waktu</span>
                </button>
              </div>
            </div>
          )}

          {/* Banner 2: Edisi Telah Terkunci Permanen (> 60 Menit Sejak Diterbitkan) */}
          {activeLockStatus.isLocked && (
            <div className="bg-gradient-to-r from-rose-950/70 via-slate-900 to-amber-950/70 border border-rose-500/50 rounded-2xl p-4 sm:p-5 text-rose-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl relative overflow-hidden">
              <div className="flex items-start gap-3.5">
                <div className="p-2.5 bg-rose-500/20 text-rose-300 rounded-xl shrink-0 border border-rose-500/40 shadow-inner">
                  <Lock className="w-5 h-5 text-rose-400" />
                </div>
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="font-bold text-rose-200 text-sm">
                      Edisi Telah Terkunci Permanen (&gt; 60 Menit)
                    </h4>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-rose-500/30 text-rose-200 border border-rose-400/40 font-mono tracking-wider">
                      Terkunci Permanen
                    </span>
                  </div>
                  <p className="text-xs text-rose-200/80 leading-relaxed max-w-3xl">
                    Edisi warta ini telah diterbitkan resmi pada pukul{' '}
                    <strong className="text-rose-100">
                      {activeLockStatus.publishedAtDate?.toLocaleTimeString('id-ID', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}{' '}
                      WIB
                    </strong>{' '}
                    dan telah melampaui batas waktu toleransi revisi 60 menit (pukul{' '}
                    <strong className="text-rose-100">
                      {activeLockStatus.lockEndTime?.toLocaleTimeString('id-ID', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}{' '}
                      WIB
                    </strong>
                    ). Demi menjaga keabsahan dan integritas dokumen warta jemaat yang beredar, edisi ini{' '}
                    <strong>tidak dapat diubah atau disinkronkan kembali</strong>.
                    {isAdmin && (
                      <span className="block mt-1.5 font-semibold text-rose-300 bg-rose-950/50 p-2 rounded-lg border border-rose-800/60 text-[11px]">
                        *Sebagai Administrator, Anda memiliki hak khusus untuk menghapus edisi warta ini jika terjadi kesalahan fatal atau kebutuhan pengelolaan arsip.
                      </span>
                    )}
                  </p>
                </div>
              </div>
              <div className="shrink-0 flex items-center gap-2 self-end sm:self-center">
                <button
                  type="button"
                  onClick={() => showLockInfoModal(activeWarta)}
                  className="px-3.5 py-2 rounded-xl bg-rose-900/60 hover:bg-rose-800 text-rose-200 border border-rose-600/50 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition shadow"
                >
                  <ShieldAlert className="w-4 h-4 text-rose-300" />
                  <span>Info Penguncian</span>
                </button>
              </div>
            </div>
          )}

          {/* Row 2: Tema Khotbah & Nats Pembimbing */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1">
              <span className="text-indigo-400 text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
                Tema Khotbah Minggu Ini
              </span>
              <p className="text-slate-200 font-semibold leading-snug">{activeWarta.temaKhotbah || '-'}</p>
            </div>

            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1">
              <span className="text-cyan-400 text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                Nats Pembimbing
              </span>
              <p className="text-slate-200 font-semibold italic leading-snug">{activeWarta.natsPembimbing || '-'}</p>
            </div>
          </div>

          {activeWarta.catatanGembala && (
            <div className="bg-indigo-950/30 border border-indigo-500/20 rounded-xl p-3 text-xs text-indigo-200 flex items-start gap-2.5">
              <Sparkles className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-indigo-300 block mb-0.5">Pesan Pastoral Gembala Jemaat:</span>
                <p className="italic text-slate-300 leading-relaxed">{activeWarta.catatanGembala}</p>
              </div>
            </div>
          )}

          {/* Sub-Tabs Navigation for 4 Main Prompt Scope Sections */}
          <div className="flex border-b border-slate-800 overflow-x-auto no-scrollbar gap-1 pt-2">
            <button
              onClick={() => setActiveTab('pelayanan')}
              className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition flex items-center gap-2 border-b-2 whitespace-nowrap ${
                activeTab === 'pelayanan'
                  ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500'
                  : 'text-slate-400 hover:text-slate-200 border-transparent'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>1. Berita Pelayanan & Petugas ({activeWarta.beritaPelayananList?.length || 0})</span>
            </button>

            <button
              onClick={() => setActiveTab('keuangan')}
              className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition flex items-center gap-2 border-b-2 whitespace-nowrap ${
                activeTab === 'keuangan'
                  ? 'bg-emerald-600/20 text-emerald-300 border-emerald-500'
                  : 'text-slate-400 hover:text-slate-200 border-transparent'
              }`}
            >
              <DollarSign className="w-4 h-4" />
              <span>2. Rekapitulasi Keuangan</span>
            </button>

            <button
              onClick={() => setActiveTab('ulang_tahun')}
              className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition flex items-center gap-2 border-b-2 whitespace-nowrap ${
                activeTab === 'ulang_tahun'
                  ? 'bg-amber-600/20 text-amber-300 border-amber-500'
                  : 'text-slate-400 hover:text-slate-200 border-transparent'
              }`}
            >
              <Gift className="w-4 h-4" />
              <span>3. Berita Ulang Tahun ({activeWarta.beritaUlangTahunList?.length || 0})</span>
            </button>

            <button
              onClick={() => setActiveTab('berita_tambahan')}
              className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition flex items-center gap-2 border-b-2 whitespace-nowrap ${
                activeTab === 'berita_tambahan'
                  ? 'bg-rose-600/20 text-rose-300 border-rose-500'
                  : 'text-slate-400 hover:text-slate-200 border-transparent'
              }`}
            >
              <Bell className="w-4 h-4" />
              <span>
                4. Berita Tambahan (Duka, Pernikahan & Pengumuman) (
                {(activeWarta.beritaDukaList?.length || 0) +
                  (activeWarta.undanganPernikahanList?.length || 0) +
                  (activeWarta.beritaTambahanList?.length || 0)}
                )
              </span>
            </button>
          </div>

          {/* TAB 1: BERITA PELAYANAN & PETUGAS */}
          {activeTab === 'pelayanan' && (() => {
            const refDateStr = activeWarta.tanggalTerbit || safeISODate();
            const oneWeekRangeText = getOneWeekDateRangeText(refDateStr);
            const oneWeekJadwalList = (jadwalIbadahList || []).filter((j) =>
              isDateInOneWeekWindow(j.tanggal, refDateStr)
            );

            // Fallback to activeWarta.beritaPelayananList filtered to the week if live list has no matching items yet
            const displayList = oneWeekJadwalList.length > 0
              ? oneWeekJadwalList
              : (activeWarta.beritaPelayananList || [])
                  .filter((p) => isDateInOneWeekWindow(p.tanggal, refDateStr))
                  .map((p) => ({
                    id: p.id,
                    namaIbadah: p.namaIbadah,
                    kategoriIbadah: (p as any).kategoriIbadah || (p as any).kategori,
                    seksi: (p as any).seksi,
                    rayon: (p as any).rayon,
                    tanggal: p.tanggal,
                    waktu: p.waktu,
                    tempat: p.tempat,
                    tuanRumah: (p as any).tuanRumah || '',
                    pelayanFirman: p.pelayanFirman,
                    pengkhotbah: p.pelayanFirman,
                    natsKhotbah: (p as any).natsKhotbah || p.pembacaanAlkitab || '',
                    liturgos: p.liturgos,
                    pemusik: p.pemusik,
                    pemanduLagu: p.pemanduLagu,
                    kantoria: (p as any).kantoria || p.pemanduLagu,
                    operatorMultimedia: p.operatorMultimedia,
                    kolektan: p.kolektan,
                    penerimaTamu: p.penerimaTamu,
                    pembacaanAlkitab: p.pembacaanAlkitab,
                    wartaKhusus: p.keteranganKhusus,
                    keteranganKhusus: p.keteranganKhusus,
                  } as JadwalIbadah));

            return (
              <div className="space-y-4 pt-2">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-900/80 p-4 rounded-xl border border-indigo-500/20 shadow-md">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-indigo-400" />
                      <h3 className="text-sm font-bold text-slate-100">
                        Jadwal &amp; Pelayanan Ibadah Jemaat &amp; Kategorial (1 Minggu ke Depan)
                      </h3>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                        1 Minggu yang Akan Datang
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Menampilkan khusus data jadwal ibadah 7 hari ke depan (<strong className="text-indigo-300 font-mono">{oneWeekRangeText}</strong>) untuk semua kategori: Minggu Umum, Seksi Kategorial (SPB, SPPer, SPPR/P, ASHM), dan Rayon/Lingkungan.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {isManagement && (
                      <button
                        type="button"
                        onClick={handleSyncJadwalIbadahLive}
                        className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-slate-700 font-bold text-xs transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                        title="Sinkronkan Jadwal Ibadah 1 Minggu ke Depan secara instan dari database Jadwal Ibadah"
                      >
                        <RefreshCw className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Sinkronkan 1 Minggu ke Depan</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() =>
                        openPrintReport({
                          reportType: 'berita_jemaat',
                          beritaJemaatId: activeWarta.id,
                          customTitle: `WARTA JEMAAT GKE - ${activeWarta.nomorEdisi}`,
                        })
                      }
                      className="px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs transition flex items-center gap-1.5 cursor-pointer shadow-md shadow-cyan-600/20"
                      title="Cetak Warta Jemaat Resmi"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Cetak Warta Resmi GKE</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setGlobalActiveTab('jadwal')}
                      className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition flex items-center gap-2 cursor-pointer shadow-lg shadow-indigo-600/30 hover:-translate-y-0.5 active:translate-y-0"
                      title="Buka form input di modul Jadwal Ibadah & Liturgi"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Input di Jadwal Ibadah</span>
                    </button>
                  </div>
                </div>

                {/* Category Filter Pills for 1-week window */}
                <div className="flex flex-wrap items-center gap-1.5 pb-1">
                  {[
                    { id: 'semua', label: 'Semua Kategori (1 Minggu)', count: displayList.length },
                    {
                      id: 'Minggu Utama',
                      label: 'Ibadah Minggu / Umum',
                      count: displayList.filter(
                        (i) => !i.kategoriIbadah || i.kategoriIbadah === 'Umum / Hari Minggu'
                      ).length,
                    },
                    {
                      id: 'SPB',
                      label: 'SPB (Bapak)',
                      count: displayList.filter(
                        (i) => i.seksi === 'SPB' || i.namaIbadah?.toLowerCase().includes('spb')
                      ).length,
                    },
                    {
                      id: 'SPPer',
                      label: 'SPPer (Perempuan)',
                      count: displayList.filter(
                        (i) => i.seksi === 'SPPer' || i.namaIbadah?.toLowerCase().includes('spper')
                      ).length,
                    },
                    {
                      id: 'SPPR/P',
                      label: 'SPPR/P (Pemuda)',
                      count: displayList.filter(
                        (i) =>
                          i.seksi === 'SPPR/P' ||
                          i.namaIbadah?.toLowerCase().includes('sppr') ||
                          i.namaIbadah?.toLowerCase().includes('pemuda')
                      ).length,
                    },
                    {
                      id: 'ASHM',
                      label: 'ASHM (Sekolah Minggu)',
                      count: displayList.filter(
                        (i) =>
                          i.seksi === 'ASHM' ||
                          i.namaIbadah?.toLowerCase().includes('sekolah minggu') ||
                          i.namaIbadah?.toLowerCase().includes('ashm')
                      ).length,
                    },
                    {
                      id: 'Rayon',
                      label: 'Rayon / Lingkungan',
                      count: displayList.filter(
                        (i) =>
                          i.kategoriIbadah === 'Rayon / Lingkungan' ||
                          !!i.rayon ||
                          i.namaIbadah?.toLowerCase().includes('rayon') ||
                          i.namaIbadah?.toLowerCase().includes('lingkungan')
                      ).length,
                    },
                  ].map((filterBtn) => (
                    <button
                      key={filterBtn.id}
                      type="button"
                      onClick={() => setPelayananKategoriFilter(filterBtn.id)}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                        pelayananKategoriFilter === filterBtn.id
                          ? 'bg-indigo-600 text-white shadow-xs font-bold'
                          : 'bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800'
                      }`}
                    >
                      <span>{filterBtn.label}</span>
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                          pelayananKategoriFilter === filterBtn.id ? 'bg-indigo-700 text-white' : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {filterBtn.count}
                      </span>
                    </button>
                  ))}
                </div>

                {displayList.length > 0 ? (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {displayList
                      .filter((item) => {
                        if (pelayananKategoriFilter === 'semua') return true;
                        if (pelayananKategoriFilter === 'Minggu Utama')
                          return !item.kategoriIbadah || item.kategoriIbadah === 'Umum / Hari Minggu';
                        if (pelayananKategoriFilter === 'SPB')
                          return item.seksi === 'SPB' || item.namaIbadah?.toLowerCase().includes('spb');
                        if (pelayananKategoriFilter === 'SPPer')
                          return item.seksi === 'SPPer' || item.namaIbadah?.toLowerCase().includes('spper');
                        if (pelayananKategoriFilter === 'SPPR/P')
                          return (
                            item.seksi === 'SPPR/P' ||
                            item.namaIbadah?.toLowerCase().includes('sppr') ||
                            item.namaIbadah?.toLowerCase().includes('pemuda')
                          );
                        if (pelayananKategoriFilter === 'ASHM')
                          return (
                            item.seksi === 'ASHM' ||
                            item.namaIbadah?.toLowerCase().includes('sekolah minggu') ||
                            item.namaIbadah?.toLowerCase().includes('ashm')
                          );
                        if (pelayananKategoriFilter === 'Rayon')
                          return (
                            item.kategoriIbadah === 'Rayon / Lingkungan' ||
                            !!item.rayon ||
                            item.namaIbadah?.toLowerCase().includes('rayon') ||
                            item.namaIbadah?.toLowerCase().includes('lingkungan')
                          );
                        return true;
                      })
                      .map((item) => {
                        const isKategorial = item.kategoriIbadah === 'Kategorial' || !!item.seksi;
                        const isRayon = item.kategoriIbadah === 'Rayon / Lingkungan' || !!item.rayon;

                        const categoryBadgeStyle =
                          item.seksi === 'SPB'
                            ? 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                            : item.seksi === 'SPPer'
                            ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                            : item.seksi === 'SPPR/P'
                            ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                            : item.seksi === 'ASHM'
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                            : isRayon
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                            : 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40';

                        const badgeLabel = item.seksi
                          ? `Kategorial • ${item.seksi}`
                          : item.rayon
                          ? `Rayon • ${item.rayon}`
                          : item.kategoriIbadah || 'Ibadah Minggu Umum';

                        return (
                          <div
                            key={item.id}
                            className="bg-slate-950 rounded-xl p-4 border border-slate-800/90 shadow-md space-y-3 relative group hover:border-indigo-500/40 transition"
                          >
                            <div className="flex items-start justify-between gap-2 border-b border-slate-800/80 pb-2.5">
                              <div>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${categoryBadgeStyle}`}>
                                  {badgeLabel}
                                </span>
                                <h4 className="font-black text-slate-100 text-sm mt-1">{item.namaIbadah}</h4>
                              </div>

                              <button
                                type="button"
                                onClick={() => setGlobalActiveTab('jadwal')}
                                className="px-2 py-1 text-[11px] font-semibold text-indigo-400 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 rounded-lg transition flex items-center gap-1 cursor-pointer"
                                title="Buka & Edit di Modul Jadwal Ibadah"
                              >
                                <Edit2 className="w-3 h-3" />
                                <span>Kelola</span>
                              </button>
                            </div>

                            {/* Time, Venue & Host */}
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-300">
                              <span className="flex items-center gap-1 font-semibold text-indigo-300">
                                <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                                {item.tanggal}
                              </span>
                              <span className="flex items-center gap-1 text-cyan-300 font-mono font-bold">
                                <Clock className="w-3.5 h-3.5 text-cyan-400" />
                                {item.waktu}
                              </span>
                              <span className="flex items-center gap-1 text-slate-300">
                                <MapPin className="w-3.5 h-3.5 text-amber-400" />
                                {item.tempat}
                              </span>
                            </div>

                            {item.tuanRumah && (
                              <div className="text-[11px] text-emerald-400 font-bold bg-emerald-950/30 px-2.5 py-1 rounded-lg border border-emerald-800/40">
                                Tuan Rumah: Kel. {item.tuanRumah}
                              </div>
                            )}

                            {/* Detailed Officers Rincian Petugas Grid */}
                            <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-900/80 p-3 rounded-lg border border-slate-800/80">
                              <div>
                                <span className="text-slate-400 block font-medium">Pelayan Firman:</span>
                                <span className="font-bold text-indigo-300">{item.pelayanFirman || item.pengkhotbah}</span>
                              </div>
                              <div>
                                <span className="text-slate-400 block font-medium">Liturgos:</span>
                                <span className="font-semibold text-slate-200">{item.liturgos}</span>
                              </div>
                              <div>
                                <span className="text-slate-400 block font-medium">Pemusik:</span>
                                <span className="text-slate-300">{item.pemusik}</span>
                              </div>
                              <div>
                                <span className="text-slate-400 block font-medium">Pemandu Lagu / Cantoria:</span>
                                <span className="text-slate-300">{item.pemanduLagu || item.kantoria}</span>
                              </div>
                              {item.operatorMultimedia && (
                                <div>
                                  <span className="text-slate-400 block font-medium">Sound &amp; Multimedia:</span>
                                  <span className="text-slate-300">{item.operatorMultimedia}</span>
                                </div>
                              )}
                              {item.kolektan && (
                                <div>
                                  <span className="text-slate-400 block font-medium">Kolektan:</span>
                                  <span className="text-slate-300">{item.kolektan}</span>
                                </div>
                              )}
                              {item.penerimaTamu && (
                                <div className="col-span-2">
                                  <span className="text-slate-400 block font-medium">Penerima Tamu:</span>
                                  <span className="text-slate-300">{item.penerimaTamu}</span>
                                </div>
                              )}
                            </div>

                            <div className="text-[11px] space-y-1">
                              {item.pembacaanAlkitab && (
                                <p className="text-slate-400">
                                  <strong className="text-indigo-300 font-semibold">Pembacaan Alkitab:</strong> {item.pembacaanAlkitab}
                                </p>
                              )}
                              {(item.wartaKhusus || item.keteranganKhusus) && (
                                <p className="text-amber-300/90 italic bg-amber-950/20 p-2 rounded border border-amber-500/20">
                                  <strong>Catatan:</strong> {item.wartaKhusus || item.keteranganKhusus}
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                  </div>
                ) : (
                  <div className="text-center py-8 bg-slate-950/80 rounded-xl border border-slate-800 text-slate-400 text-xs space-y-2">
                    <Calendar className="w-8 h-8 text-indigo-400/60 mx-auto mb-1" />
                    <p className="font-semibold text-slate-200">
                      Tidak ada jadwal pelayanan untuk periode 1 minggu ke depan ({oneWeekRangeText}).
                    </p>
                    <p className="text-[11px] text-slate-400 max-w-md mx-auto">
                      Jadwal pelayanan hanya menampilkan kegiatan dalam rentang 7 hari terhitung sejak tanggal terbit warta edisi ini.
                    </p>
                    {isManagement && (
                      <div className="pt-2">
                        <button
                          type="button"
                          onClick={handleSyncJadwalIbadahLive}
                          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer shadow-md"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          <span>Perbarui / Sinkronkan Data Jadwal</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })()}

          {/* TAB 2: BERITA KEUANGAN & REKAPITULASI (REAL KAS JEMAAT - 1 MINGGU SEBELUM TERBIT) */}
          {activeTab === 'keuangan' && (
            <div className="space-y-4 pt-2">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-900/60 p-3.5 rounded-2xl border border-slate-800">
                <div>
                  <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-emerald-400" />
                    <span>Rekapitulasi Keuangan &amp; Rincian Kas Jemaat</span>
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Rincian Transaksi Penerimaan &amp; Pengeluaran Kas Minggu Ini memuat data kas 1 minggu sebelum diterbitkan warta jemaat baru.
                  </p>
                  <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-indigo-950/70 border border-indigo-500/40 text-indigo-200 text-xs font-semibold">
                    <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                    <span>
                      Periode Kas: <strong>{safeFormatDate(activeWartaKeuangan?.tanggalMulai, { day: 'numeric', month: 'short' })}</strong> s.d. <strong>{safeFormatDate(activeWartaKeuangan?.tanggalSelesai, { day: 'numeric', month: 'short', year: 'numeric' })}</strong> (1 Minggu Sebelum Terbit Warta)
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => setIsQrisOpen(true)}
                    className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-sky-600 hover:from-emerald-500 hover:to-sky-500 text-white font-extrabold text-xs transition shadow-md flex items-center gap-1.5 cursor-pointer"
                  >
                    <QrCode className="w-4 h-4 text-emerald-200" />
                    <span>Persembahan QRIS &amp; GoPay</span>
                  </button>

                  {isManagement && (
                    <button
                      onClick={() => {
                        if (checkLockOrWarn()) return;
                        setKeuanganForm({
                          ...(activeWartaKeuangan || {}),
                          ...(activeWarta.beritaKeuangan || {}),
                          periodeJudul: activeWarta.beritaKeuangan?.periodeJudul || activeWartaKeuangan?.periodeJudul || 'Rekapitulasi Keuangan Minggu Ini',
                          tanggalMulai: activeWarta.beritaKeuangan?.tanggalMulai || activeWartaKeuangan?.tanggalMulai || safeISODate(),
                          tanggalSelesai: activeWarta.beritaKeuangan?.tanggalSelesai || activeWartaKeuangan?.tanggalSelesai || safeISODate(),
                          saldoAwal: activeWarta.beritaKeuangan?.saldoAwal ?? activeWartaKeuangan?.saldoAwal ?? 0,
                          totalPemasukan: activeWarta.beritaKeuangan?.totalPemasukan ?? activeWartaKeuangan?.totalPemasukan ?? 0,
                          totalPengeluaran: activeWarta.beritaKeuangan?.totalPengeluaran ?? activeWartaKeuangan?.totalPengeluaran ?? 0,
                          saldoAkhir: activeWarta.beritaKeuangan?.saldoAkhir ?? activeWartaKeuangan?.saldoAkhir ?? 0,
                        });
                        setModalType('keuangan');
                      }}
                      className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs transition flex items-center gap-1.5 cursor-pointer"
                      title="Sesuaikan judul periode atau angka rekapitulasi warta"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-amber-400" />
                      <span>Edit Rekap Keuangan</span>
                    </button>
                  )}

                  {isManagement && (
                    <button
                      onClick={handleSyncKeuanganLive}
                      className="px-3.5 py-2 rounded-xl bg-cyan-950 hover:bg-cyan-900/70 text-cyan-300 border border-cyan-800 font-bold text-xs transition flex items-center gap-1.5 cursor-pointer"
                      title="Sinkronkan data warta ke snapshot kas jemaat 1 minggu sebelum terbit warta"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Satu-Klik Sync Kas Live</span>
                    </button>
                  )}

                  <button
                    onClick={() => setGlobalActiveTab('keuangan')}
                    className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition flex items-center gap-1.5 shadow-md shadow-emerald-600/30 cursor-pointer"
                    title="Buka modul utama Kas Jemaat untuk menginput transaksi baru"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Buka Modul Kas Jemaat</span>
                  </button>
                </div>
              </div>

              {/* Informational Banner: Centralized Data Notice with accurate weekly scope */}
              <div className="bg-gradient-to-r from-cyan-950/40 via-indigo-950/40 to-slate-900 border border-cyan-500/30 rounded-2xl p-3.5 sm:p-4 text-xs text-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 shrink-0 mt-0.5">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-cyan-300 text-xs mb-0.5">
                      Integrasi Data Real Kas Jemaat (1 Minggu Sebelum Terbit Warta)
                    </h4>
                    <p className="text-slate-300 text-[11px] leading-relaxed">
                      Sesuai pedoman pelaporan warta jemaat gereja, rincian penerimaan dan pengeluaran kas minggu ini menyajikan transaksi yang terjadi pada rentang <strong>1 minggu sebelum tanggal terbit warta jemaat</strong> ({safeFormatDate(activeWartaKeuangan?.tanggalMulai, { day: 'numeric', month: 'short' })} s.d. {safeFormatDate(activeWartaKeuangan?.tanggalSelesai, { day: 'numeric', month: 'short', year: 'numeric' })}). Saldo awal dihitung dari akumulasi transaksi sebelum periode tersebut.
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setGlobalActiveTab('keuangan')}
                  className="px-3 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 font-bold text-[11px] flex items-center justify-center gap-1.5 transition shrink-0 cursor-pointer self-start sm:self-auto"
                >
                  <span>Kelola Transaksi di Kas Jemaat</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>

              {/* Summary Metric Cards for the 1-Week Period */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-slate-400 text-[11px] font-medium block">Saldo Awal Periode:</span>
                  <span className="text-base font-black text-slate-200">
                    Rp {(activeWartaKeuangan?.saldoAwal ?? 0).toLocaleString('id-ID')}
                  </span>
                  <span className="text-[10px] text-slate-500 block">
                    Posisi kas per {safeFormatDate(activeWartaKeuangan?.tanggalMulai, { day: 'numeric', month: 'short' })}
                  </span>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-emerald-500/30 space-y-1">
                  <span className="text-emerald-400 text-[11px] font-medium block">Total Pemasukan Minggu Ini:</span>
                  <span className="text-base font-black text-emerald-300">
                    + Rp {(activeWartaKeuangan?.totalPemasukan ?? 0).toLocaleString('id-ID')}
                  </span>
                  <span className="text-[10px] text-emerald-500/80 block">Kas masuk 1 minggu sebelum terbit</span>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-rose-500/30 space-y-1">
                  <span className="text-rose-400 text-[11px] font-medium block">Total Pengeluaran Minggu Ini:</span>
                  <span className="text-base font-black text-rose-300">
                    - Rp {(activeWartaKeuangan?.totalPengeluaran ?? 0).toLocaleString('id-ID')}
                  </span>
                  <span className="text-[10px] text-rose-500/80 block">Belanja kas 1 minggu sebelum terbit</span>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-indigo-500/30 space-y-1">
                  <span className="text-indigo-400 text-[11px] font-medium block">Saldo Kas Akhir Periode:</span>
                  <span className="text-base font-black text-indigo-200">
                    Rp {(activeWartaKeuangan?.saldoAkhir ?? 0).toLocaleString('id-ID')}
                  </span>
                  <span className="text-[10px] text-indigo-400/80 block">
                    Saldo akhir per {safeFormatDate(activeWartaKeuangan?.tanggalSelesai, { day: 'numeric', month: 'short' })}
                  </span>
                </div>
              </div>

              {/* Rincian Pos Kas Table for the 1-Week Period */}
              <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden text-xs">
                <div className="bg-slate-900/90 px-4 py-2.5 font-bold text-slate-200 border-b border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Wallet className="w-4 h-4 text-cyan-400" />
                    <span>Rincian Pos Kas (Periode 1 Minggu Sebelum Terbit Warta)</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {activeWartaKeuangan?.rincianPosKas.length || 0} Pos Terdata
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-900/50 text-slate-400 border-b border-slate-800 font-semibold text-[11px]">
                        <th className="p-3">Nama Pos Kas</th>
                        <th className="p-3 text-right">Pemasukan Minggu Ini (Rp)</th>
                        <th className="p-3 text-right">Pengeluaran Minggu Ini (Rp)</th>
                        <th className="p-3 text-right">Saldo Pos Periode (Rp)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {activeWartaKeuangan && activeWartaKeuangan.rincianPosKas.length > 0 ? (
                        activeWartaKeuangan.rincianPosKas.map((pos, idx) => (
                          <tr key={idx} className="hover:bg-slate-900/40 transition-colors">
                            <td className="p-3 font-semibold text-slate-200 flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-cyan-400/80"></span>
                              <span>{pos.namaPos}</span>
                            </td>
                            <td className="p-3 text-right font-mono text-emerald-400 font-medium">
                              Rp {pos.pemasukan.toLocaleString('id-ID')}
                            </td>
                            <td className="p-3 text-right font-mono text-rose-400 font-medium">
                              Rp {pos.pengeluaran.toLocaleString('id-ID')}
                            </td>
                            <td className="p-3 text-right font-mono font-bold text-indigo-300">
                              Rp {pos.saldo.toLocaleString('id-ID')}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4} className="p-6 text-center text-slate-400 italic">
                            Belum ada pergerakan pos kas pada periode 1 minggu sebelum terbit warta ini.
                          </td>
                        </tr>
                      )}
                    </tbody>
                    {activeWartaKeuangan && activeWartaKeuangan.rincianPosKas.length > 0 && (
                      <tfoot>
                        <tr className="bg-slate-900/80 border-t-2 border-slate-700 font-bold text-slate-200">
                          <td className="p-3 text-cyan-300 uppercase tracking-wider">Total Pos Kas Minggu Ini</td>
                          <td className="p-3 text-right font-mono text-emerald-300">
                            Rp {(activeWartaKeuangan.totalPemasukan ?? 0).toLocaleString('id-ID')}
                          </td>
                          <td className="p-3 text-right font-mono text-rose-300">
                            Rp {(activeWartaKeuangan.totalPengeluaran ?? 0).toLocaleString('id-ID')}
                          </td>
                          <td className="p-3 text-right font-mono text-indigo-300">
                            Rp {((activeWartaKeuangan.totalPemasukan ?? 0) - (activeWartaKeuangan.totalPengeluaran ?? 0)).toLocaleString('id-ID')}
                          </td>
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>
              </div>

              {/* Rincian Transaksi Penerimaan & Pengeluaran Kas Minggu Ini */}
              <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden text-xs space-y-0">
                <div className="bg-slate-900/90 px-4 py-3 font-bold text-slate-100 border-b border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <Coins className="w-4 h-4 text-emerald-400" />
                      <span className="text-sm">Rincian Transaksi Penerimaan &amp; Pengeluaran Kas Minggu Ini</span>
                    </div>
                    <p className="text-[11px] font-normal text-slate-400 mt-0.5">
                      Memuat data kas 1 minggu sebelum diterbitkan warta jemaat baru ({safeFormatDate(activeWartaKeuangan?.tanggalMulai, { day: 'numeric', month: 'short' })} s.d. {safeFormatDate(activeWartaKeuangan?.tanggalSelesai, { day: 'numeric', month: 'short', year: 'numeric' })})
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {/* Mode Toggle: Minggu Ini vs Semua */}
                    <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
                      <button
                        type="button"
                        onClick={() => setTransaksiTampilanMode('minggu_ini')}
                        className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                          transaksiTampilanMode === 'minggu_ini'
                            ? 'bg-emerald-600 text-white shadow'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <span>Minggu Ini ({activeWartaKeuangan?.rincianTransaksiMingguIni.length || 0})</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setTransaksiTampilanMode('semua')}
                        className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                          transaksiTampilanMode === 'semua'
                            ? 'bg-indigo-600 text-white shadow'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <span>Semua Riwayat ({realKasData.transactions.length})</span>
                      </button>
                    </div>

                    {/* Search Bar */}
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={transaksiSearch}
                        onChange={(e) => setTransaksiSearch(e.target.value)}
                        placeholder="Cari transaksi..."
                        className="pl-8 pr-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-[11px] text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 w-36 sm:w-44"
                      />
                    </div>

                    {/* Filter Pos Kas */}
                    <select
                      value={transaksiPosFilter}
                      onChange={(e) => setTransaksiPosFilter(e.target.value)}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-[11px] text-slate-300 focus:outline-none focus:border-cyan-500"
                    >
                      <option value="semua">Semua Pos Kas</option>
                      {(transaksiTampilanMode === 'minggu_ini' ? activeWartaKeuangan?.rincianPosKas : realKasData.posKasRincian)?.map((p, i) => (
                        <option key={i} value={p.namaPos}>
                          {p.namaPos}
                        </option>
                      ))}
                    </select>

                    {/* Filter Jenis Tabs */}
                    <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800">
                      <button
                        type="button"
                        onClick={() => setTransaksiFilter('semua')}
                        className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
                          transaksiFilter === 'semua'
                            ? 'bg-indigo-600 text-white font-bold'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        Semua
                      </button>
                      <button
                        type="button"
                        onClick={() => setTransaksiFilter('pemasukan')}
                        className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
                          transaksiFilter === 'pemasukan'
                            ? 'bg-emerald-600 text-white font-bold'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        Pemasukan
                      </button>
                      <button
                        type="button"
                        onClick={() => setTransaksiFilter('pengeluaran')}
                        className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
                          transaksiFilter === 'pengeluaran'
                            ? 'bg-rose-600 text-white font-bold'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        Pengeluaran
                      </button>
                    </div>
                  </div>
                </div>

                {/* Filtered Transaksi Table */}
                {(() => {
                  const sourceList =
                    transaksiTampilanMode === 'minggu_ini'
                      ? (activeWartaKeuangan?.rincianTransaksiMingguIni || [])
                      : realKasData.transactions;

                  const filteredTx = sourceList.filter((tr) => {
                    const matchJenis = transaksiFilter === 'semua' ? true : tr.jenis === transaksiFilter;
                    const posName = tr.namaPosKas || tr.posKas || 'Kas Umum';
                    const matchPos = transaksiPosFilter === 'semua' ? true : posName === transaksiPosFilter;
                    const q = transaksiSearch.toLowerCase();
                    const matchSearch =
                      !q ||
                      (tr.kategori || '').toLowerCase().includes(q) ||
                      (tr.keterangan || '').toLowerCase().includes(q) ||
                      posName.toLowerCase().includes(q) ||
                      (tr.noBukti || '').toLowerCase().includes(q);
                    return matchJenis && matchPos && matchSearch;
                  });

                  if (filteredTx.length === 0) {
                    return (
                      <div className="p-8 text-center text-slate-400 text-xs italic space-y-2">
                        <p>
                          {transaksiTampilanMode === 'minggu_ini'
                            ? `Tidak ada transaksi kas pada periode minggu sebelum terbit warta (${safeFormatDate(activeWartaKeuangan?.tanggalMulai, { day: 'numeric', month: 'short' })} s.d. ${safeFormatDate(activeWartaKeuangan?.tanggalSelesai, { day: 'numeric', month: 'short', year: 'numeric' })}).`
                            : 'Tidak ada transaksi kas yang sesuai dengan filter.'}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          Transaksi yang dicatat di Modul <strong>Kas Jemaat</strong> pada rentang tanggal tersebut akan otomatis tampil di sini dan di lembar cetak Warta Jemaat.
                        </p>
                      </div>
                    );
                  }

                  return (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-900/50 text-slate-400 border-b border-slate-800 font-semibold text-[11px]">
                            <th className="p-3 w-10 text-center">No</th>
                            <th className="p-3 w-28">Tanggal</th>
                            <th className="p-3 w-28">Jenis</th>
                            <th className="p-3 w-36">Pos Kas</th>
                            <th className="p-3">Kategori &amp; Uraian Transaksi</th>
                            <th className="p-3 text-right w-40">Jumlah (Rp)</th>
                            {isManagement && <th className="p-3 text-center w-14">Aksi</th>}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60">
                          {filteredTx.map((tr, idx) => (
                            <tr key={tr.id || idx} className="hover:bg-slate-900/40 transition-colors">
                              <td className="p-3 text-center font-medium text-slate-400">{idx + 1}</td>
                              <td className="p-3 font-mono text-slate-300 whitespace-nowrap">
                                {safeFormatDate(tr.tanggal, { day: 'numeric', month: 'short', year: 'numeric' })}
                              </td>
                              <td className="p-3">
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase inline-block ${
                                    tr.jenis === 'pemasukan'
                                      ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800'
                                      : 'bg-rose-950/80 text-rose-300 border border-rose-800'
                                  }`}
                                >
                                  {tr.jenis}
                                </span>
                              </td>
                              <td className="p-3 font-medium text-slate-300 whitespace-nowrap">
                                <span className="bg-slate-900 text-cyan-300 px-2 py-0.5 rounded border border-slate-800 text-[11px]">
                                  {tr.namaPosKas || tr.posKas || 'Kas Umum'}
                                </span>
                              </td>
                              <td className="p-3">
                                <p className="font-bold text-slate-100">{tr.kategori}</p>
                                <p className="text-slate-400 text-[11px] leading-relaxed">{tr.keterangan || '-'}</p>
                                {tr.noBukti && (
                                  <span className="text-[10px] font-mono text-slate-500 mt-0.5 inline-block">
                                    Ref: {tr.noBukti}
                                  </span>
                                )}
                              </td>
                              <td
                                className={`p-3 text-right font-mono font-bold whitespace-nowrap ${
                                  tr.jenis === 'pemasukan' ? 'text-emerald-400' : 'text-rose-400'
                                }`}
                              >
                                {tr.jenis === 'pemasukan' ? '+' : '-'} Rp{' '}
                                {(tr.jumlah || tr.masuk || tr.keluar || 0).toLocaleString('id-ID')}
                              </td>
                              {isManagement && (
                                <td className="p-3 text-center">
                                  <button
                                    onClick={() => handleDeleteTransaksiItem(tr.id)}
                                    className="p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
                                    title="Keluarkan transaksi ini dari cetakan warta jemaat"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </td>
                              )}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  );
                })()}

                <div className="bg-slate-900/60 p-3 border-t border-slate-800/80 text-[11px] text-slate-400 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Rincian transaksi otomatis menyaring data 1 minggu sebelum terbit warta baru</span>
                  </div>
                  <span className="text-slate-500">Pencatatan kas baru dilakukan pada Modul Kas Jemaat</span>
                </div>
              </div>

              {activeWarta.beritaKeuangan?.catatanKeuangan && (
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs text-slate-300">
                  <strong className="text-emerald-400 block mb-1">Catatan Keuangan &amp; Pertanggungjawaban:</strong>
                  <p>{activeWarta.beritaKeuangan.catatanKeuangan}</p>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: BERITA ULANG TAHUN KELAHIRAN & PERNIKAHAN */}
          {activeTab === 'ulang_tahun' && (
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                    <Gift className="w-4 h-4 text-amber-400" />
                    <span>Warta Sukacita Ulang Tahun Kelahiran & Pernikahan</span>
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Daftar warga jemaat dan keluarga yang merayakan ulang tahun pada minggu ini.
                  </p>
                </div>

                {isManagement && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleSyncUlangTahunLive}
                      className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-semibold text-xs transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                      title="Ambil dan sinkronkan otomatis data ulang tahun kelahiran & pernikahan dari database warga jemaat"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Refresh Data Otomatis</span>
                    </button>
                    <button
                      onClick={() => {
                        setEditingSubId(null);
                        setSelectedWargaIdForUltah('');
                        setUlangTahunForm({
                          jenis: 'kelahiran',
                          nama: '',
                          rayon: defaultRayon,
                          tanggal: activeWarta?.tanggalTerbit || new Date().toISOString().split('T')[0],
                          keterangan: 'Ulang Tahun Kelahiran',
                        });
                        setModalType('ulang_tahun');
                      }}
                      className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs transition flex items-center gap-1.5 shadow-md shadow-amber-600/20 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Tambah Data Ulang Tahun</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Banner Ucapan Selamat */}
              <div className="bg-gradient-to-r from-amber-950/40 via-amber-900/20 to-amber-950/40 p-4 rounded-xl border border-amber-500/30 text-xs text-amber-200 flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-bold text-amber-300 text-sm block">Ucapan Selamat Majelis Jemaat:</span>
                  <p className="leading-relaxed text-amber-100/90">
                    "Majelis Jemaat GKE Efata mengucapkan Selamat Ulang Tahun Kelahiran dan Selamat Berbahagia Ulang Tahun Pernikahan kepada Bapak/Ibu/Saudara/i. Kiranya Kasih dan Anugerah Tuhan Yesus Kristus senantiasa memberkati kehidupan dan keluarga!"
                  </p>
                </div>
              </div>

              {activeWarta.beritaUlangTahunList && activeWarta.beritaUlangTahunList.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {activeWarta.beritaUlangTahunList.map((item) => (
                    <div
                      key={item.id}
                      className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2 relative group hover:border-amber-500/40 transition"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            item.jenis === 'kelahiran'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          }`}
                        >
                          {item.jenis === 'kelahiran' ? 'Ulang Tahun Kelahiran' : 'Ulang Tahun Pernikahan'}
                        </span>

                        {isManagement && (
                          <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition">
                            <button
                              onClick={() => {
                                setEditingSubId(item.id);
                                setUlangTahunForm({
                                  jenis: item.jenis || 'kelahiran',
                                  nama: item.nama || '',
                                  rayon: item.rayon || defaultRayon,
                                  tanggal: item.tanggal || '',
                                  keterangan: item.keterangan || '',
                                });
                                setModalType('ulang_tahun');
                              }}
                              className="p-1 text-slate-400 hover:text-amber-300"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => handleDeleteUlangTahunItem(item.id)}
                              className="p-1 text-slate-400 hover:text-rose-400"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </div>

                      <h4 className="font-bold text-slate-100 text-sm">{item.nama}</h4>

                      <div className="text-xs text-slate-400 space-y-0.5">
                        <p className="flex items-center gap-1 text-slate-300 font-medium">
                          <MapPin className="w-3.5 h-3.5 text-indigo-400" />
                          {item.rayon}
                        </p>
                        <p className="flex items-center gap-1 text-amber-300 font-mono">
                          <Calendar className="w-3.5 h-3.5 text-amber-400" />
                          {safeFormatDate(item.tanggal, {
                            day: 'numeric',
                            month: 'long',
                          })}
                        </p>
                        {item.keterangan && <p className="text-[11px] text-slate-400 italic">{item.keterangan}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 bg-slate-950 rounded-xl border border-slate-800 text-slate-400 text-xs">
                  Belum ada warta ulang tahun pada edisi ini.
                </div>
              )}
            </div>
          )}

          {/* TAB 4: BERITA TAMBAHAN (DUKA, UNDANGAN NIKAH & PENGUMUMAN) */}
          {activeTab === 'berita_tambahan' && (
            <div className="space-y-6 pt-2">
              {/* SUB 4A: BERITA DUKA & BELASUNGKAWA */}
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <h4 className="text-xs font-bold text-rose-300 uppercase tracking-wider flex items-center gap-2">
                    <Heart className="w-4 h-4 text-rose-400" />
                    <span>Berita Duka & Belasungkawa</span>
                  </h4>

                  {isManagement && (
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          if (checkLockOrWarn()) return;
                          const existingNames = new Set(
                            (activeWarta.beritaDukaList || []).map((b) => (b.namaMeninggal || '').toLowerCase().trim())
                          );
                          const notYetInWarta = deceasedWargaList.filter(
                            (w) => !existingNames.has((w.namaLengkap || '').toLowerCase().trim())
                          );
                          setSelectedDukaSyncIds(
                            notYetInWarta.length > 0
                              ? notYetInWarta.map((w) => w.id)
                              : deceasedWargaList.map((w) => w.id)
                          );
                          setDukaSyncSearch('');
                          setDukaSyncMode('merge');
                          setModalType('sync_duka');
                        }}
                        className="px-2.5 py-1 rounded-lg bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/40 text-[11px] font-semibold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                        title="Sinkronkan data kematian jemaat dari database sensus warga jemaat"
                      >
                        <RefreshCw className="w-3 h-3 text-rose-400" />
                        <span>Sinkronkan Data Kematian</span>
                        {deceasedWargaList.length > 0 && (
                          <span className="px-1.5 py-0.2 bg-rose-500 text-white rounded-md text-[9px] font-bold">
                            {deceasedWargaList.length} Jiwa
                          </span>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          if (checkLockOrWarn()) return;
                          setEditingSubId(null);
                          setSelectedWargaIdForDuka('');
                          setDukaForm({
                            namaMeninggal: '',
                            usia: 70,
                            rayon: defaultRayon,
                            tanggalMeninggal: new Date().toISOString().split('T')[0],
                            tempatDuka: 'Kediaman Keluarga',
                            jadwalPemakaman: 'Pukul 10.00 WIB',
                            keluargaYangBerduka: 'Keluarga Besar',
                            keterangan: 'Ibadah penghiburan keluarga dilaksanakan di rumah duka.',
                          });
                          setModalType('duka');
                        }}
                        className="px-2.5 py-1 rounded-lg bg-rose-950 hover:bg-rose-900/60 text-rose-200 border border-rose-800 text-[11px] font-semibold transition flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Tambah Berita Duka</span>
                      </button>
                    </div>
                  )}
                </div>

                {activeWarta.beritaDukaList && activeWarta.beritaDukaList.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {activeWarta.beritaDukaList.map((item) => (
                      <div
                        key={item.id}
                        className="bg-slate-950 p-4 rounded-xl border border-rose-900/50 space-y-2 relative group hover:border-rose-500/50 transition"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                            Telah Dipanggil Tuhan
                          </span>

                          {isManagement && (
                            <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition">
                              <button
                                onClick={() => {
                                  setEditingSubId(item.id);
                                  setDukaForm({
                                    namaMeninggal: item.namaMeninggal || '',
                                    usia: item.usia !== undefined ? item.usia : 70,
                                    rayon: item.rayon || defaultRayon,
                                    tanggalMeninggal: item.tanggalMeninggal || '',
                                    tempatDuka: item.tempatDuka || '',
                                    jadwalPemakaman: item.jadwalPemakaman || '',
                                    keluargaYangBerduka: item.keluargaYangBerduka || '',
                                    keterangan: item.keterangan || '',
                                  });
                                  setModalType('duka');
                                }}
                                className="p-1 text-slate-400 hover:text-rose-300"
                              >
                                <Edit2 className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => handleDeleteDukaItem(item.id)}
                                className="p-1 text-slate-400 hover:text-rose-400"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                        </div>

                        <h5 className="font-bold text-slate-100 text-sm">
                          {item.namaMeninggal} ({item.usia} Tahun)
                        </h5>

                        <div className="text-xs text-slate-300 space-y-1 bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                          <p>
                            <strong className="text-slate-400">Rayon:</strong> {item.rayon}
                          </p>
                          <p>
                            <strong className="text-slate-400">Tanggal Meninggal:</strong>{' '}
                            {safeFormatDate(item.tanggalMeninggal, {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                            })}
                          </p>
                          <p>
                            <strong className="text-slate-400">Tempat Duka:</strong> {item.tempatDuka}
                          </p>
                          <p>
                            <strong className="text-slate-400">Jadwal Pemakaman:</strong> {item.jadwalPemakaman}
                          </p>
                          <p>
                            <strong className="text-slate-400">Keluarga Berduka:</strong> {item.keluargaYangBerduka}
                          </p>
                          {item.keterangan && <p className="text-rose-300 italic">{item.keterangan}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-5 text-center space-y-3">
                    <div className="w-10 h-10 mx-auto rounded-full bg-rose-950/50 border border-rose-800/40 flex items-center justify-center text-rose-400">
                      <Heart className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-slate-300 font-medium text-xs">Belum ada warta berita duka pada edisi ini.</p>
                      <p className="text-slate-500 text-[11px] mt-0.5">
                        Anda dapat menyinkronkan data kematian jemaat langsung dari arsip database atau menambahkannya secara manual.
                      </p>
                    </div>
                    {isManagement && (
                      <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            if (checkLockOrWarn()) return;
                            const existingNames = new Set(
                              (activeWarta.beritaDukaList || []).map((b) => (b.namaMeninggal || '').toLowerCase().trim())
                            );
                            const notYetInWarta = deceasedWargaList.filter(
                              (w) => !existingNames.has((w.namaLengkap || '').toLowerCase().trim())
                            );
                            setSelectedDukaSyncIds(
                              notYetInWarta.length > 0
                                ? notYetInWarta.map((w) => w.id)
                                : deceasedWargaList.map((w) => w.id)
                            );
                            setDukaSyncSearch('');
                            setDukaSyncMode('merge');
                            setModalType('sync_duka');
                          }}
                          className="px-3 py-1.5 rounded-lg bg-rose-600/30 hover:bg-rose-600/40 text-rose-200 border border-rose-500/50 text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                        >
                          <RefreshCw className="w-3.5 h-3.5 text-rose-300" />
                          <span>Sinkronkan Data Kematian Jemaat ({deceasedWargaList.length} Jiwa)</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (checkLockOrWarn()) return;
                            setEditingSubId(null);
                            setSelectedWargaIdForDuka('');
                            setDukaForm({
                              namaMeninggal: '',
                              usia: 70,
                              rayon: defaultRayon,
                              tanggalMeninggal: new Date().toISOString().split('T')[0],
                              tempatDuka: 'Kediaman Keluarga',
                              jadwalPemakaman: 'Pukul 10.00 WIB',
                              keluargaYangBerduka: 'Keluarga Besar',
                              keterangan: 'Ibadah penghiburan keluarga dilaksanakan di rumah duka.',
                            });
                            setModalType('duka');
                          }}
                          className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 text-xs font-medium transition flex items-center gap-1 cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Tambah Berita Duka Manual</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* SUB 4B: UNDANGAN & WARTA PERNIKAHAN */}
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <h4 className="text-xs font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-2">
                    <Heart className="w-4 h-4 text-indigo-400" />
                    <span>Warta & Undangan Pernikahan Kudus</span>
                  </h4>

                  {isManagement && (
                    <button
                      onClick={() => {
                        setEditingSubId(null);
                        setSelectedWargaIdForNikahPria('');
                        setSelectedWargaIdForNikahWanita('');
                        setNikahForm({
                          namaMempelaiPria: '',
                          namaMempelaiWanita: '',
                          orangTuaPria: '',
                          orangTuaWanita: '',
                          rayonAtauJemaatAsal: defaultRayon,
                          tanggalPemberkatan: new Date().toISOString().split('T')[0],
                          waktuPemberkatan: '09.00 WIB',
                          tempatGereja: 'Gereja Efata Utama',
                          keterangan: 'Pengumuman Pernikahan (Warta I)',
                        });
                        setModalType('nikah');
                      }}
                      className="px-2.5 py-1 rounded-lg bg-indigo-950 hover:bg-indigo-900/60 text-indigo-200 border border-indigo-800 text-[11px] font-semibold transition flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Tambah Warta Nikah</span>
                    </button>
                  )}
                </div>

                {activeWarta.undanganPernikahanList && activeWarta.undanganPernikahanList.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {activeWarta.undanganPernikahanList.map((item) => (
                      <div
                        key={item.id}
                        className="bg-slate-950 p-4 rounded-xl border border-indigo-900/50 space-y-2 relative group hover:border-indigo-500/50 transition"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                            Warta Pernikahan Kudus
                          </span>

                          {isManagement && (
                            <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition">
                              <button
                                onClick={() => {
                                  setEditingSubId(item.id);
                                  setNikahForm({
                                    namaMempelaiPria: item.namaMempelaiPria || '',
                                    namaMempelaiWanita: item.namaMempelaiWanita || '',
                                    orangTuaPria: item.orangTuaPria || '',
                                    orangTuaWanita: item.orangTuaWanita || '',
                                    rayonAtauJemaatAsal: item.rayonAtauJemaatAsal || defaultRayon,
                                    tanggalPemberkatan: item.tanggalPemberkatan || '',
                                    waktuPemberkatan: item.waktuPemberkatan || '',
                                    tempatGereja: item.tempatGereja || '',
                                    keterangan: item.keterangan || '',
                                  });
                                  setModalType('nikah');
                                }}
                                className="p-1 text-slate-400 hover:text-indigo-300"
                              >
                                <Edit2 className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => handleDeleteNikahItem(item.id)}
                                className="p-1 text-slate-400 hover:text-rose-400"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                        </div>

                        <h5 className="font-bold text-slate-100 text-sm">
                          {item.namaMempelaiPria} & {item.namaMempelaiWanita}
                        </h5>

                        <div className="text-xs text-slate-300 space-y-1 bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                          <p>
                            <strong className="text-slate-400">Orang Tua Pria:</strong> {item.orangTuaPria}
                          </p>
                          <p>
                            <strong className="text-slate-400">Orang Tua Wanita:</strong> {item.orangTuaWanita}
                          </p>
                          <p>
                            <strong className="text-slate-400">Asal Rayon / Jemaat:</strong> {item.rayonAtauJemaatAsal}
                          </p>
                          <p>
                            <strong className="text-slate-400">Pelaksanaan Pemberkatan:</strong>{' '}
                            {safeFormatDate(item.tanggalPemberkatan, {
                              weekday: 'long',
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                            })}{' '}
                            Pukul {item.waktuPemberkatan}
                          </p>
                          <p>
                            <strong className="text-slate-400">Tempat Gereja:</strong> {item.tempatGereja}
                          </p>
                          {item.keterangan && <p className="text-indigo-300 italic">{item.keterangan}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-500 text-xs italic">Tidak ada warta pernikahan pada edisi ini.</p>
                )}
              </div>

              {/* SUB 4C: PENGUMUMAN UMUM & RAPAT */}
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <h4 className="text-xs font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-2">
                    <Bell className="w-4 h-4 text-cyan-400" />
                    <span>Pengumuman Umum & Kegiatan Majelis</span>
                  </h4>

                  {isManagement && (
                    <button
                      onClick={() => {
                        setEditingSubId(null);
                        setPengumumanForm({
                          judul: '',
                          kategori: 'Pengumuman Umum',
                          tanggal: new Date().toISOString().split('T')[0],
                          isi: '',
                        });
                        setModalType('pengumuman');
                      }}
                      className="px-2.5 py-1 rounded-lg bg-cyan-950 hover:bg-cyan-900/60 text-cyan-200 border border-cyan-800 text-[11px] font-semibold transition flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Tambah Pengumuman</span>
                    </button>
                  )}
                </div>

                {activeWarta.beritaTambahanList && activeWarta.beritaTambahanList.length > 0 ? (
                  <div className="space-y-3">
                    {activeWarta.beritaTambahanList.map((item) => (
                      <div
                        key={item.id}
                        className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2 relative group hover:border-cyan-500/40 transition"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                              {item.kategori}
                            </span>
                            <h5 className="font-bold text-slate-100 text-sm mt-1">{item.judul}</h5>
                          </div>

                          {isManagement && (
                            <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition">
                              <button
                                onClick={() => {
                                  setEditingSubId(item.id);
                                  setPengumumanForm({
                                    judul: item.judul || '',
                                    kategori: item.kategori || 'Pengumuman Umum',
                                    tanggal: item.tanggal || '',
                                    isi: item.isi || '',
                                  });
                                  setModalType('pengumuman');
                                }}
                                className="p-1 text-slate-400 hover:text-cyan-300"
                              >
                                <Edit2 className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => handleDeletePengumumanItem(item.id)}
                                className="p-1 text-slate-400 hover:text-rose-400"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                        </div>

                        <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/80 p-3 rounded-lg border border-slate-800">
                          {item.isi}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-500 text-xs italic">Belum ada pengumuman umum tambahan.</p>
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-slate-900 rounded-2xl p-12 text-center border border-slate-800 text-slate-400 space-y-3">
          <Newspaper className="w-12 h-12 text-slate-600 mx-auto" />
          <p className="font-semibold text-slate-200">Belum ada dokumen Warta Jemaat yang tersedia.</p>
          {isManagement && (
            <button
              onClick={() => handleOpenWartaModal()}
              className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold hover:bg-indigo-500 transition"
            >
              Buat Edisi Warta Jemaat Pertama
            </button>
          )}
        </div>
      )}

      {/* MODAL 1: EDIT / CREATE MAIN WARTA HEADER */}
      {isWartaModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4 overflow-hidden animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl w-full max-w-xl flex flex-col max-h-[92dvh] sm:max-h-[88vh] overflow-hidden my-auto">
            <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between shrink-0 bg-slate-950/80">
              <h3 className="font-bold text-slate-100 text-sm sm:text-base flex items-center gap-2">
                <Newspaper className="w-5 h-5 text-indigo-400" />
                <span>{editingWarta ? 'Edit Header Warta Jemaat' : 'Buat Edisi Warta Jemaat Baru'}</span>
              </h3>
              <button onClick={() => setIsWartaModalOpen(false)} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveWarta} className="flex flex-col flex-1 min-h-0 overflow-hidden text-xs">
              <div className="p-4 sm:p-5 space-y-4 flex-1 overflow-y-auto overscroll-contain">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-slate-300 font-semibold">Nomor Edisi Warta</label>
                    <button
                      type="button"
                      onClick={() =>
                        setWartaForm({
                          ...wartaForm,
                          nomorEdisi: generateAutoNomorWarta(wartaForm.tanggalTerbit),
                        })
                      }
                      className="text-[10px] font-bold text-cyan-400 hover:text-cyan-300 bg-cyan-950/60 hover:bg-cyan-900/60 border border-cyan-800/60 px-2 py-0.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <Sparkles className="w-3 h-3 text-cyan-400" />
                      <span>Format Baku Sesuai Pengaturan</span>
                    </button>
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: 001/WARTA-GKE/GCI/II/2026"
                    value={wartaForm.nomorEdisi || ''}
                    onChange={(e) => setWartaForm({ ...wartaForm, nomorEdisi: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 font-mono font-bold focus:outline-none focus:border-cyan-500"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    Format baku: [Nomor Urut]/[Prefix Warta]/[Kode Jemaat]/[Bulan Romawi]/[Tahun] (Reset otomatis ke 001 setiap awal tahun)
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Tanggal Terbit</label>
                    <input
                      type="date"
                      required
                      value={wartaForm.tanggalTerbit || ''}
                      onChange={(e) => setWartaForm({ ...wartaForm, tanggalTerbit: e.target.value })}
                      className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Status Warta</label>
                    <select
                      value={wartaForm.status || 'Diterbitkan'}
                      onChange={(e) =>
                        setWartaForm({ ...wartaForm, status: e.target.value as 'Draf' | 'Diterbitkan' | 'Arsip' })
                      }
                      className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 font-bold"
                    >
                      <option value="Diterbitkan">Diterbitkan</option>
                      <option value="Draf">Draf</option>
                      <option value="Arsip">Arsip</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Judul Warta Jemaat</label>
                  <input
                    type="text"
                    required
                    value={wartaForm.judulWarta || ''}
                    onChange={(e) => setWartaForm({ ...wartaForm, judulWarta: e.target.value })}
                    placeholder="Contoh: Warta Jemaat Minggu X Setelah Trinitatis"
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Tema Khotbah</label>
                    <input
                      type="text"
                      value={wartaForm.temaKhotbah || ''}
                      onChange={(e) => setWartaForm({ ...wartaForm, temaKhotbah: e.target.value })}
                      className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Nats Pembimbing</label>
                    <input
                      type="text"
                      value={wartaForm.natsPembimbing || ''}
                      onChange={(e) => setWartaForm({ ...wartaForm, natsPembimbing: e.target.value })}
                      className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 font-semibold text-cyan-300"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Pesan Pastoral / Gembala</label>
                  <textarea
                    rows={3}
                    value={wartaForm.catatanGembala || ''}
                    onChange={(e) => setWartaForm({ ...wartaForm, catatanGembala: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100"
                  />
                </div>
              </div>

              <div className="p-3.5 sm:p-4 flex items-center justify-end gap-2 border-t border-slate-800 bg-slate-950/80 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsWartaModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition shadow-lg shadow-indigo-600/20 cursor-pointer"
                >
                  Simpan Edisi Warta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL SUB-ITEM: PELAYANAN */}
      {modalType === 'pelayanan' && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4 overflow-hidden animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[92dvh] sm:max-h-[88vh] overflow-hidden my-auto">
            <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between shrink-0 bg-slate-950/80">
              <h3 className="font-bold text-slate-100 text-sm sm:text-base">
                {editingSubId ? 'Edit Jadwal Pelayanan' : 'Tambah Jadwal Pelayanan & Petugas'}
              </h3>
              <button onClick={() => setModalType(null)} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePelayananItem} className="flex flex-col flex-1 min-h-0 overflow-hidden text-xs">
              <div className="p-4 sm:p-5 space-y-4 flex-1 overflow-y-auto overscroll-contain">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Nama Kebaktian / Ibadah</label>
                    <input
                      type="text"
                      required
                      value={pelayananForm.namaIbadah || ''}
                      onChange={(e) => setPelayananForm({ ...pelayananForm, namaIbadah: e.target.value })}
                      className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Kategori Ibadah</label>
                    <select
                      value={pelayananForm.kategoriIbadah || 'Minggu Utama'}
                      onChange={(e) => setPelayananForm({ ...pelayananForm, kategoriIbadah: e.target.value as any })}
                      className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 font-bold"
                    >
                      <option value="Minggu Utama">Minggu Utama</option>
                      <option value="SPPer (Perempuan)">SPPer (Perempuan)</option>
                      <option value="SPB (Bapak)">SPB (Bapak)</option>
                      <option value="SPPR/P (Pemuda)">SPPR/P (Pemuda)</option>
                      <option value="ASHM (Sekolah Minggu)">ASHM (Sekolah Minggu)</option>
                      <option value="Kebaktian Lingkungan/Rayon">Kebaktian Lingkungan/Rayon</option>
                      <option value="Ibadah Sakramen">Ibadah Sakramen</option>
                      <option value="Ibadah Kasual/Khusus">Ibadah Kasual/Khusus</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Tanggal</label>
                    <input
                      type="date"
                      required
                      value={pelayananForm.tanggal || ''}
                      onChange={(e) => setPelayananForm({ ...pelayananForm, tanggal: e.target.value })}
                      className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Waktu</label>
                    <input
                      type="text"
                      required
                      value={pelayananForm.waktu || ''}
                      onChange={(e) => setPelayananForm({ ...pelayananForm, waktu: e.target.value })}
                      placeholder="Contoh: 09.00 WIB"
                      className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Tempat</label>
                    <input
                      type="text"
                      required
                      value={pelayananForm.tempat || ''}
                      onChange={(e) => setPelayananForm({ ...pelayananForm, tempat: e.target.value })}
                      className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-800/80">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Pelayan Firman / Pengkhotbah</label>
                    <input
                      type="text"
                      required
                      value={pelayananForm.pelayanFirman || ''}
                      onChange={(e) => setPelayananForm({ ...pelayananForm, pelayanFirman: e.target.value })}
                      className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Liturgos / Penuntun</label>
                    <input
                      type="text"
                      required
                      value={pelayananForm.liturgos || ''}
                      onChange={(e) => setPelayananForm({ ...pelayananForm, liturgos: e.target.value })}
                      className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Pemusik / Organis</label>
                    <input
                      type="text"
                      value={pelayananForm.pemusik || ''}
                      onChange={(e) => setPelayananForm({ ...pelayananForm, pemusik: e.target.value })}
                      className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Pemandu Lagu / Cantor</label>
                    <input
                      type="text"
                      value={pelayananForm.pemanduLagu || ''}
                      onChange={(e) => setPelayananForm({ ...pelayananForm, pemanduLagu: e.target.value })}
                      className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Operator Sound & Multimedia</label>
                    <input
                      type="text"
                      value={pelayananForm.operatorMultimedia || ''}
                      onChange={(e) => setPelayananForm({ ...pelayananForm, operatorMultimedia: e.target.value })}
                      className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Kolektan & Penerima Tamu</label>
                    <input
                      type="text"
                      value={pelayananForm.kolektan || ''}
                      onChange={(e) => setPelayananForm({ ...pelayananForm, kolektan: e.target.value })}
                      className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Pembacaan Alkitab</label>
                  <input
                    type="text"
                    value={pelayananForm.pembacaanAlkitab || ''}
                    onChange={(e) => setPelayananForm({ ...pelayananForm, pembacaanAlkitab: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100"
                  />
                </div>
              </div>

              <div className="p-3.5 sm:p-4 flex items-center justify-end gap-2 border-t border-slate-800 bg-slate-950/80 shrink-0">
                <button
                  type="button"
                  onClick={() => setModalType(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition shadow-lg shadow-indigo-600/20 cursor-pointer"
                >
                  Simpan Pelayanan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL SUB-ITEM: KEUANGAN */}
      {modalType === 'keuangan' && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4 overflow-hidden animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl w-full max-w-xl flex flex-col max-h-[92dvh] sm:max-h-[88vh] overflow-hidden my-auto">
            <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between shrink-0 bg-slate-950/80">
              <h3 className="font-bold text-slate-100 text-sm sm:text-base">Edit Rekapitulasi Keuangan</h3>
              <button onClick={() => setModalType(null)} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveKeuangan} className="flex flex-col flex-1 min-h-0 overflow-hidden text-xs">
              <div className="p-4 sm:p-5 space-y-4 flex-1 overflow-y-auto overscroll-contain">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Judul Periode Rekap</label>
                  <input
                    type="text"
                    required
                    value={keuanganForm.periodeJudul || ''}
                    onChange={(e) => setKeuanganForm({ ...keuanganForm, periodeJudul: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Saldo Awal Periode (Rp)</label>
                  <input
                    type="number"
                    required
                    value={keuanganForm.saldoAwal ?? 0}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setKeuanganForm({
                        ...keuanganForm,
                        saldoAwal: val,
                        saldoAkhir: val + (keuanganForm.totalPemasukan || 0) - (keuanganForm.totalPengeluaran || 0),
                      });
                    }}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-cyan-400 font-bold font-mono"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Total Pemasukan (Rp)</label>
                    <input
                      type="number"
                      required
                      value={keuanganForm.totalPemasukan ?? 0}
                      onChange={(e) =>
                        setKeuanganForm({
                          ...keuanganForm,
                          totalPemasukan: Number(e.target.value),
                          saldoAkhir: (keuanganForm.saldoAwal || 0) + Number(e.target.value) - (keuanganForm.totalPengeluaran || 0),
                        })
                      }
                      className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-emerald-400 font-bold font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Total Pengeluaran (Rp)</label>
                    <input
                      type="number"
                      required
                      value={keuanganForm.totalPengeluaran ?? 0}
                      onChange={(e) =>
                        setKeuanganForm({
                          ...keuanganForm,
                          totalPengeluaran: Number(e.target.value),
                          saldoAkhir: (keuanganForm.saldoAwal || 0) + (keuanganForm.totalPemasukan || 0) - Number(e.target.value),
                        })
                      }
                      className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-rose-400 font-bold font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Catatan Keuangan</label>
                  <textarea
                    rows={3}
                    value={keuanganForm.catatanKeuangan || ''}
                    onChange={(e) => setKeuanganForm({ ...keuanganForm, catatanKeuangan: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100"
                  />
                </div>
              </div>

              <div className="p-3.5 sm:p-4 flex items-center justify-end gap-2 border-t border-slate-800 bg-slate-950/80 shrink-0">
                <button
                  type="button"
                  onClick={() => setModalType(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition shadow-lg shadow-emerald-600/20 cursor-pointer"
                >
                  Simpan Rekap Keuangan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL SUB-ITEM: ULANG TAHUN */}
      {modalType === 'ulang_tahun' && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4 overflow-hidden animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl w-full max-w-md flex flex-col max-h-[92dvh] sm:max-h-[88vh] overflow-hidden my-auto">
            <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between shrink-0 bg-slate-950/80">
              <h3 className="font-bold text-slate-100 text-sm sm:text-base">
                {editingSubId ? 'Edit Warta Ulang Tahun' : 'Tambah Warta Ulang Tahun'}
              </h3>
              <button onClick={() => setModalType(null)} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveUlangTahunItem} className="flex flex-col flex-1 min-h-0 overflow-hidden text-xs">
              <div className="p-4 sm:p-5 space-y-4 flex-1 overflow-y-auto overscroll-contain">
                {/* Auto Fill Quick Picker from Warga Jemaat */}
                <div className="p-3 bg-amber-950/30 border border-amber-500/30 rounded-xl space-y-1.5">
                  <label className="block text-amber-300 font-semibold text-[11px] flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5" />
                    <span>Pilih Cepat dari Data Warga Jemaat (Otomatis Terisi)</span>
                  </label>
                  <select
                    value={selectedWargaIdForUltah || ''}
                    onChange={(e) => {
                      const wId = e.target.value;
                      setSelectedWargaIdForUltah(wId);
                      if (!wId) return;
                      const w = wargaJemaatList.find((item) => item.id === wId);
                      if (!w) return;

                      const targetYear = activeWarta ? safeDateObj(activeWarta.tanggalTerbit).getFullYear() : new Date().getFullYear();

                      if (ulangTahunForm.jenis === 'pernikahan' && w.tanggalPernikahan) {
                        const parsedM = parseWargaDate(w.tanggalPernikahan);
                        const mYear = parsedM ? parsedM.year : targetYear;
                        const years = targetYear - mYear;
                        const formattedDate = parsedM
                          ? `${targetYear}-${String(parsedM.month).padStart(2, '0')}-${String(parsedM.day).padStart(2, '0')}`
                          : w.tanggalPernikahan;

                        const family = wargaJemaatList.filter((m) => m.noKjj === w.noKjj && m.statusNikah === 'Menikah');
                        const suami = family.find((m) => m.hubunganKeluarga === 'Kepala Keluarga' || m.jenisKelamin === 'L');
                        const istri = family.find((m) => m.hubunganKeluarga === 'Istri' || (m.jenisKelamin === 'P' && m.id !== suami?.id));

                        let labelPasangan = '';
                        if (suami && istri) {
                          labelPasangan = `Kel. Bpk. ${suami.namaLengkap} & Ibu ${istri.namaLengkap}`;
                        } else if (suami) {
                          labelPasangan = `Kel. Bpk. ${suami.namaLengkap}`;
                        } else if (istri) {
                          labelPasangan = `Kel. Ibu ${istri.namaLengkap}`;
                        } else {
                          labelPasangan = `Kel. ${w.namaLengkap}`;
                        }

                        setUlangTahunForm((prev) => ({
                          ...prev,
                          nama: labelPasangan,
                          rayon: w.rayon || defaultRayon,
                          tanggal: formattedDate,
                          keterangan: years > 0 ? `Ulang Tahun Pernikahan ke-${years}` : 'Ulang Tahun Pernikahan',
                        }));
                      } else {
                        const parsedB = parseWargaDate(w.tanggalLahir);
                        const bYear = parsedB ? parsedB.year : targetYear;
                        const age = targetYear - bYear;
                        const formattedDate = parsedB
                          ? `${targetYear}-${String(parsedB.month).padStart(2, '0')}-${String(parsedB.day).padStart(2, '0')}`
                          : (w.tanggalLahir || safeISODate());

                        setUlangTahunForm((prev) => ({
                          ...prev,
                          jenis: 'kelahiran',
                          nama: w.namaLengkap,
                          rayon: w.rayon || defaultRayon,
                          tanggal: formattedDate,
                          keterangan: age > 0 ? `Ulang Tahun Kelahiran ke-${age}` : 'Ulang Tahun Kelahiran',
                        }));
                      }
                    }}
                    className="w-full p-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-100 text-xs"
                  >
                    <option value="">-- Pilih Warga Jemaat untuk Auto-Fill --</option>
                    {wargaJemaatList.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.namaLengkap} ({w.rayon || 'Tanpa Rayon'} {w.tanggalLahir ? `• Tgl Lahir: ${w.tanggalLahir}` : ''})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Jenis Ulang Tahun</label>
                  <select
                    value={ulangTahunForm.jenis || 'kelahiran'}
                    onChange={(e) =>
                      setUlangTahunForm({ ...ulangTahunForm, jenis: e.target.value as 'kelahiran' | 'pernikahan' })
                    }
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 font-bold"
                  >
                    <option value="kelahiran">Ulang Tahun Kelahiran</option>
                    <option value="pernikahan">Ulang Tahun Pernikahan</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Nama Anggota / Pasangan Keluarga</label>
                  <input
                    type="text"
                    required
                    value={ulangTahunForm.nama || ''}
                    onChange={(e) => setUlangTahunForm({ ...ulangTahunForm, nama: e.target.value })}
                    placeholder="Contoh: Pnt. Dr. Hendra Wijaya"
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Rayon / Lingkungan</label>
                    <select
                      value={ulangTahunForm.rayon || defaultRayon}
                      onChange={(e) => setUlangTahunForm({ ...ulangTahunForm, rayon: e.target.value })}
                      className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 font-medium"
                    >
                      {availableLingkunganList.map((l) => (
                        <option key={l.id} value={l.nama}>
                          {l.nama} {l.keterangan ? `(${l.keterangan})` : ''}
                        </option>
                      ))}
                      {ulangTahunForm.rayon && !availableLingkunganList.some((l) => l.nama === ulangTahunForm.rayon) && (
                        <option value={ulangTahunForm.rayon}>{ulangTahunForm.rayon}</option>
                      )}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Tanggal</label>
                    <input
                      type="date"
                      required
                      value={ulangTahunForm.tanggal || ''}
                      onChange={(e) => setUlangTahunForm({ ...ulangTahunForm, tanggal: e.target.value })}
                      className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Keterangan / Milestone</label>
                  <input
                    type="text"
                    value={ulangTahunForm.keterangan || ''}
                    onChange={(e) => setUlangTahunForm({ ...ulangTahunForm, keterangan: e.target.value })}
                    placeholder="Contoh: Ulang Tahun Kelahiran ke-48"
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100"
                  />
                </div>
              </div>

              <div className="p-3.5 sm:p-4 flex items-center justify-end gap-2 border-t border-slate-800 bg-slate-950/80 shrink-0">
                <button
                  type="button"
                  onClick={() => setModalType(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold transition shadow-lg shadow-amber-600/20 cursor-pointer"
                >
                  Simpan Warta Ultah
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL SUB-ITEM: DUKA */}
      {modalType === 'duka' && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4 overflow-hidden animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl w-full max-w-lg flex flex-col max-h-[92dvh] sm:max-h-[88vh] overflow-hidden my-auto">
            <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between shrink-0 bg-slate-950/80">
              <h3 className="font-bold text-slate-100 text-sm sm:text-base">
                {editingSubId ? 'Edit Berita Duka' : 'Tambah Berita Duka'}
              </h3>
              <button onClick={() => setModalType(null)} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveDukaItem} className="flex flex-col flex-1 min-h-0 overflow-hidden text-xs">
              <div className="p-4 sm:p-5 space-y-4 flex-1 overflow-y-auto overscroll-contain">
                {/* Auto Fill Quick Picker from Warga Jemaat */}
                <div className="p-3 bg-rose-950/30 border border-rose-500/30 rounded-xl space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-rose-300 font-semibold text-[11px] flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5" />
                      <span>Pilih Cepat dari Data Kematian & Warga Jemaat (Otomatis Terisi)</span>
                    </label>
                    {deceasedWargaList.length > 0 && (
                      <span className="text-[10px] text-rose-400 font-semibold">
                        {deceasedWargaList.length} Arsip Kematian
                      </span>
                    )}
                  </div>
                  <select
                    value={selectedWargaIdForDuka || ''}
                    onChange={(e) => {
                      const wId = e.target.value;
                      setSelectedWargaIdForDuka(wId);
                      if (!wId) return;
                      const w = wargaJemaatList.find((item) => item.id === wId);
                      if (!w) return;

                      const calculatedAge = calculateAgeAtDeath(w.tanggalLahir, w.tanggalMeninggal);
                      const tempatDuka = w.tempatMeninggal || w.alamat || 'Kediaman Keluarga';
                      const jadwalPemakaman = [
                        w.tempatPemakaman || '',
                        w.pelayanPemakaman ? `Pelayan: ${w.pelayanPemakaman}` : '',
                      ].filter(Boolean).join(' • ') || 'TPU Kristen';
                      const keluargaYangBerduka = w.keluargaDitinggalkan || `Keluarga Besar Alm. ${w.namaLengkap}`;
                      const keterangan = [
                        w.keteranganMeninggal || '',
                        w.nomorSuratKematian ? `Surat Kematian No: ${w.nomorSuratKematian}` : '',
                      ].filter(Boolean).join(' | ');

                      setDukaForm((prev) => ({
                        ...prev,
                        namaMeninggal: w.namaLengkap,
                        usia: calculatedAge > 0 ? calculatedAge : 70,
                        rayon: w.rayon || defaultRayon,
                        tanggalMeninggal: w.tanggalMeninggal || prev.tanggalMeninggal || safeISODate(),
                        tempatDuka: tempatDuka || prev.tempatDuka,
                        jadwalPemakaman: jadwalPemakaman || prev.jadwalPemakaman,
                        keluargaYangBerduka: keluargaYangBerduka || prev.keluargaYangBerduka,
                        keterangan: keterangan || prev.keterangan || 'Ibadah penghiburan keluarga dilaksanakan di rumah duka.',
                      }));
                    }}
                    className="w-full p-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-100 text-xs"
                  >
                    <option value="">-- Pilih Warga Jemaat untuk Auto-Fill --</option>
                    {deceasedWargaList.length > 0 && (
                      <optgroup label="⚰️ Data Kematian Jemaat (Warga Berpulang)">
                        {deceasedWargaList.map((w) => (
                          <option key={w.id} value={w.id}>
                            ⚰️ Alm./Almh. {w.namaLengkap} ({w.rayon || 'Tanpa Rayon'}) - Wafat: {w.tanggalMeninggal || '-'}
                          </option>
                        ))}
                      </optgroup>
                    )}
                    <optgroup label="👥 Seluruh Warga Jemaat Lainnya">
                      {wargaJemaatList
                        .filter((w) => !deceasedWargaList.some((d) => d.id === w.id))
                        .map((w) => (
                          <option key={w.id} value={w.id}>
                            {w.namaLengkap} ({w.rayon || 'Tanpa Rayon'})
                          </option>
                        ))}
                    </optgroup>
                  </select>
                  {selectedWargaIdForDuka && (
                    <p className="text-[10px] text-emerald-400 font-medium">
                      ✓ Data almarhum/ah, usia, tgl meninggal, tempat duka & pemakaman otomatis terisi dari database!
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-slate-300 font-semibold mb-1">Nama Almarhum / Almarhumah</label>
                    <input
                      type="text"
                      required
                      value={dukaForm.namaMeninggal || ''}
                      onChange={(e) => setDukaForm({ ...dukaForm, namaMeninggal: e.target.value })}
                      className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Usia (Tahun)</label>
                    <input
                      type="text"
                      required
                      value={dukaForm.usia ?? ''}
                      onChange={(e) => setDukaForm({ ...dukaForm, usia: e.target.value })}
                      className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Rayon / Lingkungan</label>
                    <select
                      value={dukaForm.rayon || defaultRayon}
                      onChange={(e) => setDukaForm({ ...dukaForm, rayon: e.target.value })}
                      className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 font-medium"
                    >
                      {availableLingkunganList.map((l) => (
                        <option key={l.id} value={l.nama}>
                          {l.nama} {l.keterangan ? `(${l.keterangan})` : ''}
                        </option>
                      ))}
                      {dukaForm.rayon && !availableLingkunganList.some((l) => l.nama === dukaForm.rayon) && (
                        <option value={dukaForm.rayon}>{dukaForm.rayon}</option>
                      )}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Tanggal Meninggal</label>
                    <input
                      type="date"
                      required
                      value={dukaForm.tanggalMeninggal || ''}
                      onChange={(e) => setDukaForm({ ...dukaForm, tanggalMeninggal: e.target.value })}
                      className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Tempat Duka / Rumah Duka</label>
                  <input
                    type="text"
                    value={dukaForm.tempatDuka || ''}
                    onChange={(e) => setDukaForm({ ...dukaForm, tempatDuka: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Jadwal & Tempat Pemakaman</label>
                  <input
                    type="text"
                    value={dukaForm.jadwalPemakaman || ''}
                    onChange={(e) => setDukaForm({ ...dukaForm, jadwalPemakaman: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Keluarga yang Berduka</label>
                  <input
                    type="text"
                    value={dukaForm.keluargaYangBerduka || ''}
                    onChange={(e) => setDukaForm({ ...dukaForm, keluargaYangBerduka: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Catatan / Ibadah Penghiburan / Ayat Penghiburan
                  </label>
                  <textarea
                    rows={2}
                    value={dukaForm.keterangan || ''}
                    onChange={(e) => setDukaForm({ ...dukaForm, keterangan: e.target.value })}
                    placeholder="Contoh: Ibadah penghiburan keluarga dilaksanakan di rumah duka. (Yohanes 11:25-26)"
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-500"
                  />
                </div>
              </div>

              <div className="p-3.5 sm:p-4 flex items-center justify-end gap-2 border-t border-slate-800 bg-slate-950/80 shrink-0">
                <button
                  type="button"
                  onClick={() => setModalType(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold transition shadow-lg shadow-rose-600/20 cursor-pointer"
                >
                  Simpan Berita Duka
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL SUB-ITEM: SYNC DUKA DARI SENSUS DATA KEMATIAN JEMAAT */}
      {modalType === 'sync_duka' && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4 overflow-hidden animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[92dvh] sm:max-h-[88vh] overflow-hidden my-auto">
            <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between shrink-0 bg-slate-950/80">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400">
                  <Heart className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-100 text-sm sm:text-base">
                    Sinkronisasi Data Kematian Jemaat
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Pilih arsip data warga berpulang/meninggal dari database Sensus untuk disinkronkan ke warta
                  </p>
                </div>
              </div>
              <button
                onClick={() => setModalType(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex flex-col flex-1 min-h-0 overflow-hidden text-xs">
              <div className="p-4 sm:p-5 space-y-4 flex-1 overflow-y-auto overscroll-contain">
                {/* Information Header & Mode Options */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-950/70 p-3 rounded-xl border border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-semibold text-slate-300">Mode Sinkronisasi:</span>
                    <label className="flex items-center gap-1 text-[11px] text-slate-300 cursor-pointer">
                      <input
                        type="radio"
                        name="dukaSyncMode"
                        checked={dukaSyncMode === 'merge'}
                        onChange={() => setDukaSyncMode('merge')}
                        className="text-rose-600 focus:ring-rose-500 cursor-pointer"
                      />
                      <span>Gabungkan (Disarankan)</span>
                    </label>
                    <label className="flex items-center gap-1 text-[11px] text-slate-300 cursor-pointer ml-2">
                      <input
                        type="radio"
                        name="dukaSyncMode"
                        checked={dukaSyncMode === 'replace'}
                        onChange={() => setDukaSyncMode('replace')}
                        className="text-rose-600 focus:ring-rose-500 cursor-pointer"
                      />
                      <span>Timpa Seluruhnya</span>
                    </label>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const allIds = deceasedWargaList.map((w) => w.id);
                        if (selectedDukaSyncIds.length === allIds.length) {
                          setSelectedDukaSyncIds([]);
                        } else {
                          setSelectedDukaSyncIds(allIds);
                        }
                      }}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-medium transition cursor-pointer"
                    >
                      {selectedDukaSyncIds.length === deceasedWargaList.length && deceasedWargaList.length > 0
                        ? 'Batalkan Semua'
                        : 'Pilih Semua'}
                    </button>
                    {existingWartaDukaNames.size > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          const notInWarta = deceasedWargaList.filter(
                            (w) => !existingWartaDukaNames.has((w.namaLengkap || '').toLowerCase().trim())
                          );
                          setSelectedDukaSyncIds(notInWarta.map((w) => w.id));
                        }}
                        className="px-2.5 py-1 rounded-lg bg-rose-950/60 hover:bg-rose-900/60 text-rose-300 border border-rose-800 text-[11px] font-medium transition cursor-pointer"
                      >
                        Pilih Yang Baru ({deceasedWargaList.filter((w) => !existingWartaDukaNames.has((w.namaLengkap || '').toLowerCase().trim())).length})
                      </button>
                    )}
                  </div>
                </div>

                {/* Search Bar */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
                  <input
                    type="text"
                    value={dukaSyncSearch || ''}
                    onChange={(e) => setDukaSyncSearch(e.target.value)}
                    placeholder="Cari nama almarhum, rayon, atau tanggal meninggal..."
                    className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-rose-500"
                  />
                </div>

                {/* Deceased Warga List */}
                {filteredDeceasedList.length > 0 ? (
                  <div className="space-y-2.5">
                    {filteredDeceasedList.map((w) => {
                      const isSelected = selectedDukaSyncIds.includes(w.id);
                      const isAlreadyInWarta = existingWartaDukaNames.has(
                        (w.namaLengkap || '').toLowerCase().trim()
                      );
                      const deathAge = calculateAgeAtDeath(w.tanggalLahir, w.tanggalMeninggal);

                      return (
                        <div
                          key={w.id}
                          onClick={() => {
                            setSelectedDukaSyncIds((prev) =>
                              prev.includes(w.id) ? prev.filter((id) => id !== w.id) : [...prev, w.id]
                            );
                          }}
                          className={`p-3.5 rounded-xl border transition cursor-pointer flex items-start gap-3 select-none ${
                            isSelected
                              ? 'bg-rose-950/30 border-rose-500/50 text-slate-100 shadow-sm'
                              : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-300'
                          }`}
                        >
                          <div className="pt-0.5">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {}}
                              className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500 border-slate-700 bg-slate-900 cursor-pointer"
                            />
                          </div>

                          <div className="flex-1 min-w-0 space-y-1">
                            <div className="flex flex-wrap items-center justify-between gap-1.5">
                              <div className="flex items-center gap-2">
                                <h4 className="font-bold text-slate-100 text-xs sm:text-sm">
                                  Alm. / Almh. {w.namaLengkap}
                                </h4>
                                {deathAge > 0 && (
                                  <span className="text-[10px] font-semibold text-rose-300 bg-rose-950/80 px-2 py-0.5 rounded border border-rose-800/60">
                                    Usia {deathAge} Thn
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-1.5">
                                <span className="text-[10px] font-medium text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                                  {w.rayon || 'Tanpa Rayon'}
                                </span>
                                {isAlreadyInWarta ? (
                                  <span className="text-[9px] font-bold text-cyan-300 bg-cyan-950/80 border border-cyan-800/60 px-2 py-0.5 rounded">
                                    Sudah Ada di Warta
                                  </span>
                                ) : (
                                  <span className="text-[9px] font-bold text-emerald-300 bg-emerald-950/80 border border-emerald-800/60 px-2 py-0.5 rounded">
                                    Belum Masuk Warta
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-0.5 text-[11px] text-slate-400">
                              <p>
                                <strong className="text-slate-500">Tgl Wafat:</strong>{' '}
                                {safeFormatDate(w.tanggalMeninggal, {
                                  day: 'numeric',
                                  month: 'long',
                                  year: 'numeric',
                                })}
                              </p>
                              <p>
                                <strong className="text-slate-500">Rumah Duka:</strong>{' '}
                                {w.tempatMeninggal || w.alamat || 'Kediaman Keluarga'}
                              </p>
                              {(w.tempatPemakaman || w.pelayanPemakaman) && (
                                <p className="sm:col-span-2 text-slate-400">
                                  <strong className="text-slate-500">Pemakaman:</strong>{' '}
                                  {w.tempatPemakaman || '-'}
                                  {w.pelayanPemakaman ? ` (Pelayan: ${w.pelayanPemakaman})` : ''}
                                </p>
                              )}
                              {w.keluargaDitinggalkan && (
                                <p className="sm:col-span-2 text-slate-400">
                                  <strong className="text-slate-500">Keluarga:</strong> {w.keluargaDitinggalkan}
                                </p>
                              )}
                              {w.keteranganMeninggal && (
                                <p className="sm:col-span-2 text-rose-300/90 italic">
                                  <strong className="text-slate-500 not-italic">Catatan:</strong> {w.keteranganMeninggal}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-8 text-center bg-slate-950/50 rounded-xl border border-slate-800/80 space-y-2">
                    <AlertCircle className="w-8 h-8 mx-auto text-slate-500" />
                    <p className="text-slate-300 font-semibold text-xs">
                      {deceasedWargaList.length === 0
                        ? 'Belum Ada Data Warga Berpulang / Meninggal di Database'
                        : 'Tidak Ada Data yang Cocok dengan Pencarian'}
                    </p>
                    <p className="text-slate-500 text-[11px] max-w-sm mx-auto">
                      {deceasedWargaList.length === 0
                        ? 'Data kematian dicatat melalui modul Sensus Warga Jemaat (Ubah status keanggotaan menjadi Meninggal) atau tambahkan secara manual.'
                        : 'Coba ubah kata kunci pencarian Anda.'}
                    </p>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-3.5 sm:p-4 flex items-center justify-between border-t border-slate-800 bg-slate-950/80 shrink-0">
                <span className="text-[11px] text-slate-400">
                  <strong className="text-rose-400">{selectedDukaSyncIds.length}</strong> jiwa dipilih dari{' '}
                  {deceasedWargaList.length} total data kematian
                </span>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setModalType(null)}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    disabled={selectedDukaSyncIds.length === 0}
                    onClick={() => handleSyncDukaFromWargaLive(selectedDukaSyncIds, dukaSyncMode)}
                    className={`px-4 py-2 rounded-xl font-bold transition flex items-center gap-1.5 shadow-lg cursor-pointer ${
                      selectedDukaSyncIds.length === 0
                        ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                        : 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/20'
                    }`}
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Sinkronkan ke Warta Jemaat ({selectedDukaSyncIds.length})</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL SUB-ITEM: NIKAH */}
      {modalType === 'nikah' && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4 overflow-hidden animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl w-full max-w-lg flex flex-col max-h-[92dvh] sm:max-h-[88vh] overflow-hidden my-auto">
            <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between shrink-0 bg-slate-950/80">
              <h3 className="font-bold text-slate-100 text-sm sm:text-base">
                {editingSubId ? 'Edit Warta Pernikahan' : 'Tambah Warta / Undangan Pernikahan'}
              </h3>
              <button onClick={() => setModalType(null)} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveNikahItem} className="flex flex-col flex-1 min-h-0 overflow-hidden text-xs">
              <div className="p-4 sm:p-5 space-y-4 flex-1 overflow-y-auto overscroll-contain">
                {/* Auto Fill Quick Picker for Mempelai */}
                <div className="p-3 bg-indigo-950/30 border border-indigo-500/30 rounded-xl space-y-2">
                  <label className="block text-indigo-300 font-semibold text-[11px] flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5" />
                    <span>Pilih Cepat Mempelai dari Data Warga Jemaat (Opsional)</span>
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <select
                      value={selectedWargaIdForNikahPria || ''}
                      onChange={(e) => {
                        const wId = e.target.value;
                        setSelectedWargaIdForNikahPria(wId);
                        if (!wId) return;
                        const w = wargaJemaatList.find((item) => item.id === wId);
                        if (!w) return;
                        setNikahForm((prev) => ({
                          ...prev,
                          namaMempelaiPria: w.namaLengkap,
                          rayonAtauJemaatAsal: w.rayon || prev.rayonAtauJemaatAsal || defaultRayon,
                        }));
                      }}
                      className="w-full p-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-100 text-xs"
                    >
                      <option value="">-- Pilih Calon Pria --</option>
                      {wargaJemaatList
                        .filter((w) => w.jenisKelamin === 'L' || !w.jenisKelamin)
                        .map((w) => (
                          <option key={w.id} value={w.id}>
                            {w.namaLengkap} ({w.rayon || 'Tanpa Rayon'})
                          </option>
                        ))}
                    </select>

                    <select
                      value={selectedWargaIdForNikahWanita || ''}
                      onChange={(e) => {
                        const wId = e.target.value;
                        setSelectedWargaIdForNikahWanita(wId);
                        if (!wId) return;
                        const w = wargaJemaatList.find((item) => item.id === wId);
                        if (!w) return;
                        setNikahForm((prev) => ({
                          ...prev,
                          namaMempelaiWanita: w.namaLengkap,
                          rayonAtauJemaatAsal: prev.rayonAtauJemaatAsal || w.rayon || defaultRayon,
                        }));
                      }}
                      className="w-full p-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-100 text-xs"
                    >
                      <option value="">-- Pilih Calon Wanita --</option>
                      {wargaJemaatList
                        .filter((w) => w.jenisKelamin === 'P' || !w.jenisKelamin)
                        .map((w) => (
                          <option key={w.id} value={w.id}>
                            {w.namaLengkap} ({w.rayon || 'Tanpa Rayon'})
                          </option>
                        ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Mempelai Pria</label>
                    <input
                      type="text"
                      required
                      value={nikahForm.namaMempelaiPria || ''}
                      onChange={(e) => setNikahForm({ ...nikahForm, namaMempelaiPria: e.target.value })}
                      className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Mempelai Wanita</label>
                    <input
                      type="text"
                      required
                      value={nikahForm.namaMempelaiWanita || ''}
                      onChange={(e) => setNikahForm({ ...nikahForm, namaMempelaiWanita: e.target.value })}
                      className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Orang Tua Pria</label>
                    <input
                      type="text"
                      value={nikahForm.orangTuaPria || ''}
                      onChange={(e) => setNikahForm({ ...nikahForm, orangTuaPria: e.target.value })}
                      placeholder="Bpk. ... & Ibu ..."
                      className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Orang Tua Wanita</label>
                    <input
                      type="text"
                      value={nikahForm.orangTuaWanita || ''}
                      onChange={(e) => setNikahForm({ ...nikahForm, orangTuaWanita: e.target.value })}
                      placeholder="Bpk. ... & Ibu ..."
                      className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Rayon / Lingkungan / Jemaat Asal</label>
                  <div className="space-y-1.5">
                    <select
                      value={nikahForm.rayonAtauJemaatAsal || defaultRayon}
                      onChange={(e) => setNikahForm({ ...nikahForm, rayonAtauJemaatAsal: e.target.value })}
                      className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 font-medium"
                    >
                      {availableLingkunganList.map((l) => (
                        <option key={l.id} value={l.nama}>
                          {l.nama} {l.keterangan ? `(${l.keterangan})` : ''}
                        </option>
                      ))}
                      {nikahForm.rayonAtauJemaatAsal && !availableLingkunganList.some((l) => l.nama === nikahForm.rayonAtauJemaatAsal) && (
                        <option value={nikahForm.rayonAtauJemaatAsal}>{nikahForm.rayonAtauJemaatAsal}</option>
                      )}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Tanggal Pemberkatan</label>
                    <input
                      type="date"
                      required
                      value={nikahForm.tanggalPemberkatan || ''}
                      onChange={(e) => setNikahForm({ ...nikahForm, tanggalPemberkatan: e.target.value })}
                      className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Waktu</label>
                    <input
                      type="text"
                      required
                      value={nikahForm.waktuPemberkatan || ''}
                      onChange={(e) => setNikahForm({ ...nikahForm, waktuPemberkatan: e.target.value })}
                      placeholder="09.00 WIB"
                      className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Gereja / Tempat</label>
                    <input
                      type="text"
                      required
                      value={nikahForm.tempatGereja || ''}
                      onChange={(e) => setNikahForm({ ...nikahForm, tempatGereja: e.target.value })}
                      className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Catatan Warta (e.g. Warta I / Warta II)</label>
                  <input
                    type="text"
                    value={nikahForm.keterangan || ''}
                    onChange={(e) => setNikahForm({ ...nikahForm, keterangan: e.target.value })}
                    placeholder="Pengumuman Pernikahan Kedua (Warta II)"
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100"
                  />
                </div>
              </div>

              <div className="p-3.5 sm:p-4 flex items-center justify-end gap-2 border-t border-slate-800 bg-slate-950/80 shrink-0">
                <button
                  type="button"
                  onClick={() => setModalType(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition shadow-lg shadow-indigo-600/20 cursor-pointer"
                >
                  Simpan Warta Nikah
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL SUB-ITEM: PENGUMUMAN */}
      {modalType === 'pengumuman' && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4 overflow-hidden animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl w-full max-w-lg flex flex-col max-h-[92dvh] sm:max-h-[88vh] overflow-hidden my-auto">
            <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between shrink-0 bg-slate-950/80">
              <h3 className="font-bold text-slate-100 text-sm sm:text-base">
                {editingSubId ? 'Edit Pengumuman' : 'Tambah Pengumuman Umum'}
              </h3>
              <button onClick={() => setModalType(null)} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePengumumanItem} className="flex flex-col flex-1 min-h-0 overflow-hidden text-xs">
              <div className="p-4 sm:p-5 space-y-4 flex-1 overflow-y-auto overscroll-contain">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Judul Pengumuman</label>
                  <input
                    type="text"
                    required
                    value={pengumumanForm.judul || ''}
                    onChange={(e) => setPengumumanForm({ ...pengumumanForm, judul: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 font-bold"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Kategori</label>
                    <select
                      value={pengumumanForm.kategori || 'Pengumuman Umum'}
                      onChange={(e) => setPengumumanForm({ ...pengumumanForm, kategori: e.target.value as any })}
                      className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 font-bold"
                    >
                      <option value="Pengumuman Umum">Pengumuman Umum</option>
                      <option value="Rapat & Sidang">Rapat & Sidang</option>
                      <option value="Kegiatan Kategorial">Kegiatan Kategorial</option>
                      <option value="Lain-lain">Lain-lain</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Tanggal</label>
                    <input
                      type="date"
                      required
                      value={pengumumanForm.tanggal || ''}
                      onChange={(e) => setPengumumanForm({ ...pengumumanForm, tanggal: e.target.value })}
                      className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Isi Pengumuman</label>
                  <textarea
                    rows={4}
                    required
                    value={pengumumanForm.isi || ''}
                    onChange={(e) => setPengumumanForm({ ...pengumumanForm, isi: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 leading-relaxed"
                  />
                </div>
              </div>

              <div className="p-3.5 sm:p-4 flex items-center justify-end gap-2 border-t border-slate-800 bg-slate-950/80 shrink-0">
                <button
                  type="button"
                  onClick={() => setModalType(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold transition shadow-lg shadow-cyan-600/20 cursor-pointer"
                >
                  Simpan Pengumuman
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 0: DAFTAR KELOLA SEMUA EDISI WARTA */}
      {isListModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4 overflow-hidden">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl w-full max-w-4xl flex flex-col max-h-[92dvh] sm:max-h-[88vh] overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between shrink-0 bg-slate-950/80">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-500/20 text-indigo-400 rounded-xl border border-indigo-500/30">
                  <List className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-100 text-sm sm:text-base">
                    Daftar Kelola Semua Edisi Warta Jemaat
                  </h3>
                  <p className="text-xs text-slate-400">
                    Total {beritaJemaatList.length} edisi warta terdaftar dalam database
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsListModalOpen(false)}
                className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 cursor-pointer transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-5 space-y-4 flex-1 overflow-y-auto overscroll-contain">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                <div className="relative flex-1 w-full">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Cari edisi, judul, atau tema..."
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsListModalOpen(false);
                    handleOpenWartaModal();
                  }}
                  className="w-full sm:w-auto px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl flex items-center justify-center gap-1.5 shrink-0 cursor-pointer shadow-md shadow-indigo-600/20 transition text-xs"
                >
                  <Plus className="w-4 h-4" />
                  <span>Buat Warta Baru</span>
                </button>
              </div>

              <div className="overflow-x-auto border border-slate-800/80 rounded-xl">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-950 text-slate-400 border-b border-slate-800 font-semibold">
                      <th className="p-3">No. Edisi</th>
                      <th className="p-3">Tanggal Terbit</th>
                      <th className="p-3">Judul Warta</th>
                      <th className="p-3">Tema Khotbah</th>
                      <th className="p-3 text-center">Status</th>
                      <th className="p-3 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {filteredWartaList.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-6 text-center text-slate-500 italic">
                          Tidak ada edisi warta jemaat ditemukan.
                        </td>
                      </tr>
                    ) : (
                      filteredWartaList.map((w) => (
                        <tr key={w.id} className="hover:bg-slate-800/40 transition">
                          <td className="p-3 font-mono font-bold text-cyan-400">{w.nomorEdisi}</td>
                          <td className="p-3 text-slate-300">{w.tanggalTerbit}</td>
                          <td className="p-3 font-bold text-slate-100">{w.judulWarta}</td>
                          <td className="p-3 text-slate-400 text-[11px]">{w.temaKhotbah}</td>
                          <td className="p-3 text-center">
                            {(() => {
                              const lock = getWartaLockStatus(w);
                              return (
                                <div className="flex flex-col items-center gap-1">
                                  <span
                                    className={`warta-badge-status px-2.5 py-0.5 rounded text-[10px] font-extrabold border shadow-2xs ${
                                      w.status === 'Diterbitkan'
                                        ? 'bg-emerald-600 text-white border-emerald-400/60'
                                        : w.status === 'Draf'
                                        ? 'bg-amber-600 text-white border-amber-400/60 status-draf'
                                        : 'bg-slate-700 text-slate-200 border-slate-500 status-arsip'
                                    }`}
                                  >
                                    {w.status}
                                  </span>
                                  {lock.isWithinGracePeriod && (
                                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-emerald-600/90 text-white border border-emerald-400/60 rounded text-[9px] font-bold shadow-2xs">
                                      <Clock className="w-2.5 h-2.5 animate-pulse" />
                                      <span>Sisa: {lock.formattedRemaining}</span>
                                    </span>
                                  )}
                                  {lock.isLocked && (
                                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded text-[9px] font-bold">
                                      <Lock className="w-2.5 h-2.5" />
                                      <span>Terkunci</span>
                                    </span>
                                  )}
                                </div>
                              );
                            })()}
                          </td>
                          <td className="p-3 text-center">
                            {(() => {
                              const lock = getWartaLockStatus(w);
                              return (
                                <div className="flex items-center justify-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedWartaId(w.id);
                                      setIsListModalOpen(false);
                                    }}
                                    className="px-2.5 py-1 bg-indigo-950 text-indigo-300 hover:bg-indigo-900 border border-indigo-700 rounded-lg text-[11px] font-semibold cursor-pointer transition"
                                  >
                                    Tampilkan
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setIsListModalOpen(false);
                                      openPrintReport({
                                        reportType: 'berita_jemaat',
                                        beritaJemaatId: w.id,
                                        customTitle: `WARTA JEMAAT GKE - ${w.nomorEdisi}`,
                                      });
                                    }}
                                    className="px-2.5 py-1 bg-cyan-950 text-cyan-300 hover:bg-cyan-900 border border-cyan-700 rounded-lg text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition"
                                    title="Cetak Edisi Warta Ini"
                                  >
                                    <Printer className="w-3 h-3 text-cyan-400" />
                                    <span>Cetak</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (checkLockOrWarn(w)) return;
                                      setIsListModalOpen(false);
                                      handleOpenWartaModal(w);
                                    }}
                                    className={`p-1.5 rounded-lg border cursor-pointer transition ${
                                      lock.isLocked
                                        ? 'bg-slate-800 text-rose-300 border-rose-500/40 hover:bg-slate-700'
                                        : 'bg-slate-800 hover:bg-slate-700 text-indigo-300 border-slate-700'
                                    }`}
                                    title={
                                      lock.isLocked
                                        ? 'Edisi telah terkunci permanen (> 60 menit setelah diterbitkan)'
                                        : lock.isWithinGracePeriod
                                        ? `Masa revisi aktif (sisa waktu edit: ${lock.formattedRemaining})`
                                        : 'Edit Header Edisi'
                                    }
                                  >
                                    {lock.isLocked ? (
                                      <Lock className="w-3.5 h-3.5 text-rose-400" />
                                    ) : (
                                      <Edit2 className="w-3.5 h-3.5" />
                                    )}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (!isAdmin && checkLockOrWarn(w)) return;
                                      handleDeleteWarta(w.id);
                                    }}
                                    className={`p-1.5 rounded-lg border cursor-pointer transition ${
                                      lock.isLocked
                                        ? (isAdmin
                                            ? 'bg-rose-950/80 hover:bg-rose-900 text-rose-200 border border-rose-600'
                                            : 'bg-slate-800 text-rose-300 border-rose-500/40 hover:bg-slate-700')
                                        : 'bg-slate-800 hover:bg-rose-950 text-rose-400 border-slate-700'
                                    }`}
                                    title={
                                      lock.isLocked
                                        ? (isAdmin
                                            ? 'Hapus Edisi Warta Terkunci (Wewenang Khusus Akun Admin)'
                                            : 'Edisi telah terkunci permanen (> 60 menit setelah diterbitkan)')
                                        : 'Hapus Edisi Warta'
                                    }
                                  >
                                    {lock.isLocked && !isAdmin ? (
                                      <Lock className="w-3.5 h-3.5 text-rose-400" />
                                    ) : (
                                      <Trash2 className="w-3.5 h-3.5" />
                                    )}
                                  </button>
                                </div>
                              );
                            })()}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-3.5 sm:p-4 flex items-center justify-between border-t border-slate-800 bg-slate-950/80 shrink-0">
              <span className="text-xs text-slate-400">
                Menampilkan <strong>{filteredWartaList.length}</strong> dari {beritaJemaatList.length} edisi
              </span>
              <button
                type="button"
                onClick={() => setIsListModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer transition"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: PILIH EDISI WARTA JEMAAT UNTUK DICETAK */}
      {isChoosePrintEditionModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4 overflow-hidden">
          <div className="bg-slate-900 border border-cyan-500/40 rounded-2xl shadow-2xl w-full max-w-4xl flex flex-col max-h-[92dvh] sm:max-h-[88vh] overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between shrink-0 bg-slate-950/80">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-cyan-500/20 text-cyan-400 rounded-xl border border-cyan-500/30">
                  <Printer className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-100 text-sm sm:text-base">
                    Pilih Edisi Warta Jemaat yang Ingin Dicetak
                  </h3>
                  <p className="text-xs text-slate-400">
                    Pilih salah satu edisi warta dari daftar untuk membuka pratinjau dan mencetak format resmi GKE.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsChoosePrintEditionModalOpen(false)}
                className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 cursor-pointer transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-5 space-y-3.5 flex-1 overflow-y-auto overscroll-contain">
              {/* Search Bar inside Choose Modal */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Cari berdasarkan no. edisi, judul, tema khotbah, atau nats..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-cyan-500"
                />
              </div>

              {/* List of Editions to Print */}
              <div className="space-y-2.5">
                {filteredWartaList.length === 0 ? (
                  <div className="text-center py-12 bg-slate-950/60 rounded-xl border border-slate-800 text-slate-400 text-xs">
                    Tidak ada edisi warta jemaat yang sesuai pencarian.
                  </div>
                ) : (
                  filteredWartaList.map((w) => {
                    const isCurrent = activeWarta?.id === w.id;
                    return (
                      <div
                        key={w.id}
                        className={`p-4 rounded-xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                          isCurrent
                            ? 'bg-cyan-950/30 border-cyan-500/50 shadow-sm'
                            : 'bg-slate-950 hover:bg-slate-900 border-slate-800'
                        }`}
                      >
                        <div className="space-y-1 flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono text-xs font-bold text-cyan-400 bg-cyan-950/80 px-2.5 py-0.5 rounded-lg border border-cyan-800/60">
                              {w.nomorEdisi}
                            </span>
                            <span className="text-xs text-slate-400 flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                              {safeFormatDate(w.tanggalTerbit, {
                                weekday: 'long',
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric',
                              })}
                            </span>
                            <span
                              className={`warta-badge-status text-[10px] font-extrabold px-2.5 py-0.5 rounded border shadow-2xs ${
                                w.status === 'Diterbitkan'
                                  ? 'bg-emerald-600 text-white border-emerald-400/60'
                                  : w.status === 'Draf'
                                  ? 'bg-amber-600 text-white border-amber-400/60 status-draf'
                                  : 'bg-slate-700 text-slate-200 border-slate-500 status-arsip'
                              }`}
                            >
                              {w.status}
                            </span>
                            {isCurrent && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                                Sedang Aktif
                              </span>
                            )}
                          </div>

                          <h4 className="font-bold text-slate-100 text-sm truncate">{w.judulWarta}</h4>

                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
                            {w.temaKhotbah && (
                              <span className="text-[11px]">
                                <strong className="text-indigo-300">Tema:</strong> {w.temaKhotbah}
                              </span>
                            )}
                            {w.natsPembimbing && (
                              <span className="text-[11px]">
                                <strong className="text-cyan-300">Nats:</strong> {w.natsPembimbing}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-0 border-slate-800">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedWartaId(w.id);
                              setIsChoosePrintEditionModalOpen(false);
                            }}
                            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-indigo-300 text-xs font-semibold transition border border-slate-700 cursor-pointer"
                          >
                            Buka di Layar
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setSelectedWartaId(w.id);
                              setIsChoosePrintEditionModalOpen(false);
                              openPrintReport({
                                reportType: 'berita_jemaat',
                                beritaJemaatId: w.id,
                                customTitle: `WARTA JEMAAT GKE - ${w.nomorEdisi}`,
                              });
                            }}
                            className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-md shadow-cyan-600/30 transition flex items-center gap-1.5 cursor-pointer"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span>Cetak Edisi Ini</span>
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-3.5 sm:p-4 flex items-center justify-between border-t border-slate-800 bg-slate-950/80 shrink-0">
              <span className="text-xs text-slate-400">
                Total <strong>{filteredWartaList.length}</strong> edisi warta tersedia
              </span>
              <button
                type="button"
                onClick={() => setIsChoosePrintEditionModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer transition"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QRIS Persembahan Modal */}
      <QrisPersembahanModal
        isOpen={isQrisOpen}
        onClose={() => setIsQrisOpen(false)}
      />

      {/* MODAL IMPOR JADWAL KEGIATAN KATEGORIAL KE WARTA */}
      {isImportKategorialModalOpen && activeWarta && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4 overflow-hidden">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl w-full max-w-3xl flex flex-col max-h-[92dvh] sm:max-h-[88vh] overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between shrink-0 bg-slate-950/80">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-cyan-500/20 text-cyan-400 rounded-xl border border-cyan-500/30">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-100 text-sm sm:text-base">
                    Impor Ibadah dari Seksi Pelayanan Kategorial
                  </h3>
                  <p className="text-xs text-slate-400">
                    Pilih kegiatan ibadah kategorial (SPB, SPPer, SPPR/P, ASHM/SPA) untuk diintegrasikan ke Warta Jemaat.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsImportKategorialModalOpen(false)}
                className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 cursor-pointer transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-5 space-y-4 flex-1 overflow-y-auto overscroll-contain">
              {/* Filter Bar */}
              <div className="flex flex-col sm:flex-row gap-2.5">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Cari program ibadah / tempat..."
                    value={importKatSearch}
                    onChange={(e) => setImportKatSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-hidden focus:border-cyan-500"
                  />
                </div>

                <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
                  {(['ALL', 'SPB', 'SPPer', 'SPPR/P', 'SPA'] as const).map((seksiTab) => (
                    <button
                      key={seksiTab}
                      type="button"
                      onClick={() => setImportKatSeksiFilter(seksiTab)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                        importKatSeksiFilter === seksiTab
                          ? 'bg-cyan-600 text-white font-bold'
                          : 'bg-slate-950 hover:bg-slate-800 text-slate-400 border border-slate-800'
                      }`}
                    >
                      {seksiTab === 'ALL' ? 'Semua Seksi' : seksiTab}
                    </button>
                  ))}
                </div>
              </div>

              {/* List of Kategorial Items */}
              {(() => {
                const filteredKat = (kegiatanKategorialList || []).filter((k) => {
                  const matchSeksi = importKatSeksiFilter === 'ALL' || k.seksi === importKatSeksiFilter;
                  const matchSearch =
                    !importKatSearch ||
                    k.namaProgram?.toLowerCase().includes(importKatSearch.toLowerCase()) ||
                    k.tempat?.toLowerCase().includes(importKatSearch.toLowerCase()) ||
                    k.penanggungJawab?.toLowerCase().includes(importKatSearch.toLowerCase());
                  return matchSeksi && matchSearch;
                });

                if (filteredKat.length === 0) {
                  return (
                    <div className="text-center py-12 bg-slate-950/60 rounded-xl border border-slate-800 text-slate-400 text-xs space-y-2">
                      <BookmarkCheck className="w-8 h-8 text-slate-600 mx-auto" />
                      <p>Tidak ada kegiatan ibadah kategorial yang cocok dengan filter.</p>
                      <p className="text-[11px] text-slate-500">
                        Tambahkan kegiatan terlebih dahulu pada modul Seksi Pelayanan Kategorial.
                      </p>
                    </div>
                  );
                }

                const allFilteredSelected =
                  filteredKat.length > 0 && filteredKat.every((k) => selectedKatIdsToImport.includes(k.id));

                return (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between px-2 py-1 text-xs text-slate-400 border-b border-slate-800/80">
                      <span>Ditemukan {filteredKat.length} kegiatan kategorial</span>
                      <button
                        type="button"
                        onClick={() => {
                          if (allFilteredSelected) {
                            setSelectedKatIdsToImport((prev) =>
                              prev.filter((id) => !filteredKat.some((k) => k.id === id))
                            );
                          } else {
                            const newIds = Array.from(
                              new Set([...selectedKatIdsToImport, ...filteredKat.map((k) => k.id)])
                            );
                            setSelectedKatIdsToImport(newIds);
                          }
                        }}
                        className="text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1 cursor-pointer"
                      >
                        {allFilteredSelected ? (
                          <>
                            <CheckSquare className="w-3.5 h-3.5" /> Batal Pilih Semua
                          </>
                        ) : (
                          <>
                            <Square className="w-3.5 h-3.5" /> Pilih Semua
                          </>
                        )}
                      </button>
                    </div>

                    {filteredKat.map((keg) => {
                      const isSelected = selectedKatIdsToImport.includes(keg.id);
                      const seksiBadgeStyle =
                        keg.seksi === 'SPB'
                          ? 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                          : keg.seksi === 'SPPer'
                          ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                          : keg.seksi === 'SPPR/P'
                          ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                          : 'bg-amber-500/20 text-amber-300 border-amber-500/30';

                      return (
                        <div
                          key={keg.id}
                          onClick={() => {
                            setSelectedKatIdsToImport((prev) =>
                              prev.includes(keg.id) ? prev.filter((id) => id !== keg.id) : [...prev, keg.id]
                            );
                          }}
                          className={`p-3.5 rounded-xl border transition cursor-pointer flex items-start gap-3 ${
                            isSelected
                              ? 'bg-cyan-950/40 border-cyan-500/60 shadow-xs'
                              : 'bg-slate-950 hover:bg-slate-900 border-slate-800'
                          }`}
                        >
                          <div className="mt-0.5 text-cyan-400 shrink-0">
                            {isSelected ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4 text-slate-600" />}
                          </div>

                          <div className="flex-1 min-w-0 space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${seksiBadgeStyle}`}>
                                Seksi {keg.seksi}
                              </span>
                              <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                                {keg.kategori}
                              </span>
                              <h4 className="font-bold text-slate-100 text-xs md:text-sm truncate">
                                {keg.namaProgram}
                              </h4>
                            </div>

                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-400">
                              <span className="flex items-center gap-1 text-slate-300">
                                <Calendar className="w-3 h-3 text-indigo-400" />
                                {keg.tanggal || 'Sesuai Warta'}
                              </span>
                              <span className="flex items-center gap-1 text-cyan-300">
                                <Clock className="w-3 h-3 text-cyan-400" />
                                {keg.waktu || '17.00 WIB'}
                              </span>
                              <span className="flex items-center gap-1 text-slate-300">
                                <MapPin className="w-3 h-3 text-amber-400" />
                                {keg.tempat || 'Gereja GKE Efata'}
                              </span>
                              {keg.penanggungJawab && (
                                <span className="flex items-center gap-1 text-slate-300">
                                  <User className="w-3 h-3 text-emerald-400" />
                                  PJ: {keg.penanggungJawab}
                                </span>
                              )}
                            </div>

                            {keg.keterangan && (
                              <p className="text-[11px] text-slate-400 italic bg-slate-900/60 px-2 py-1 rounded border border-slate-800/80 mt-1">
                                {keg.keterangan}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>

            {/* Modal Footer */}
            <div className="p-3.5 sm:p-4 flex items-center justify-between border-t border-slate-800 bg-slate-950/80 shrink-0">
              <div className="text-xs text-slate-300">
                <span className="font-bold text-cyan-300">{selectedKatIdsToImport.length}</span> kegiatan kategorial dipilih
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsImportKategorialModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold text-xs hover:bg-slate-700 transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={selectedKatIdsToImport.length === 0}
                  onClick={handleExecuteImportKategorial}
                  className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-lg shadow-cyan-600/20 transition flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  <ArrowDownToLine className="w-4 h-4" />
                  <span>Impor ke Warta Jemaat ({selectedKatIdsToImport.length})</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL IMPOR MASTER JADWAL IBADAH MINGGU */}
      {isImportJadwalMingguModalOpen && activeWarta && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4 overflow-hidden">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl w-full max-w-3xl flex flex-col max-h-[92dvh] sm:max-h-[88vh] overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between shrink-0 bg-slate-950/80">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-500/20 text-blue-400 rounded-xl border border-blue-500/30">
                  <Download className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-100 text-sm sm:text-base">
                    Tarik Jadwal dari Master Jadwal Ibadah
                  </h3>
                  <p className="text-xs text-slate-400">
                    Pilih jadwal ibadah Minggu umum atau kebaktian khusus untuk dimasukkan ke Warta Jemaat.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsImportJadwalMingguModalOpen(false)}
                className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 cursor-pointer transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-5 space-y-4 flex-1 overflow-y-auto overscroll-contain">
              {/* List of Master Jadwal Items */}
              {(() => {
                const list = jadwalIbadahList || [];
                if (list.length === 0) {
                  return (
                    <div className="text-center py-12 bg-slate-950/60 rounded-xl border border-slate-800 text-slate-400 text-xs">
                      Tidak ada master Jadwal Ibadah yang tersimpan.
                    </div>
                  );
                }

                const allSelected = list.length > 0 && list.every((j) => selectedJadwalIdsToImport.includes(j.id));

                return (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between px-2 py-1 text-xs text-slate-400 border-b border-slate-800/80">
                      <span>Total {list.length} jadwal ibadah tersedia</span>
                      <button
                        type="button"
                        onClick={() => {
                          if (allSelected) {
                            setSelectedJadwalIdsToImport([]);
                          } else {
                            setSelectedJadwalIdsToImport(list.map((j) => j.id));
                          }
                        }}
                        className="text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1 cursor-pointer"
                      >
                        {allSelected ? (
                          <>
                            <CheckSquare className="w-3.5 h-3.5" /> Batal Pilih Semua
                          </>
                        ) : (
                          <>
                            <Square className="w-3.5 h-3.5" /> Pilih Semua
                          </>
                        )}
                      </button>
                    </div>

                    {list.map((j) => {
                      const isSelected = selectedJadwalIdsToImport.includes(j.id);
                      return (
                        <div
                          key={j.id}
                          onClick={() => {
                            setSelectedJadwalIdsToImport((prev) =>
                              prev.includes(j.id) ? prev.filter((id) => id !== j.id) : [...prev, j.id]
                            );
                          }}
                          className={`p-3.5 rounded-xl border transition cursor-pointer flex items-start gap-3 ${
                            isSelected
                              ? 'bg-blue-950/40 border-blue-500/60 shadow-xs'
                              : 'bg-slate-950 hover:bg-slate-900 border-slate-800'
                          }`}
                        >
                          <div className="mt-0.5 text-blue-400 shrink-0">
                            {isSelected ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4 text-slate-600" />}
                          </div>

                          <div className="flex-1 min-w-0 space-y-1">
                            <h4 className="font-bold text-slate-100 text-xs md:text-sm">
                              {j.namaIbadah || 'Ibadah Minggu'}
                            </h4>

                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-400">
                              <span className="flex items-center gap-1 text-slate-300">
                                <Calendar className="w-3 h-3 text-indigo-400" />
                                {j.tanggal || 'Sesuai Warta'}
                              </span>
                              <span className="flex items-center gap-1 text-cyan-300">
                                <Clock className="w-3 h-3 text-cyan-400" />
                                {j.waktu || '09.00 WIB'}
                              </span>
                              <span className="flex items-center gap-1 text-slate-300">
                                <MapPin className="w-3 h-3 text-amber-400" />
                                {j.tempat || 'Gereja Efata'}
                              </span>
                              {(j.pelayanFirman || j.pengkhotbah) && (
                                <span className="flex items-center gap-1 text-slate-300">
                                  <User className="w-3 h-3 text-indigo-400" />
                                  Firman: {j.pelayanFirman || j.pengkhotbah}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>

            {/* Modal Footer */}
            <div className="p-3.5 sm:p-4 flex items-center justify-between border-t border-slate-800 bg-slate-950/80 shrink-0">
              <div className="text-xs text-slate-300">
                <span className="font-bold text-blue-300">{selectedJadwalIdsToImport.length}</span> jadwal dipilih
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsImportJadwalMingguModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold text-xs hover:bg-slate-700 transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={selectedJadwalIdsToImport.length === 0}
                  onClick={handleExecuteImportJadwalMinggu}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/20 transition flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  <ArrowDownToLine className="w-4 h-4" />
                  <span>Tarik ke Warta Jemaat ({selectedJadwalIdsToImport.length})</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL KONFIRMASI HAPUS (MOBILE & DESKTOP IMMUNE TO WINDOW.CONFIRM BLOCK) */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[70] flex items-center justify-center p-2 sm:p-4 overflow-hidden">
          <div className="bg-slate-900 border border-rose-500/40 rounded-2xl shadow-2xl w-full max-w-md flex flex-col max-h-[92dvh] sm:max-h-[88vh] overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between shrink-0 bg-slate-950/80">
              <div className="flex items-center gap-3 text-rose-400">
                <div className="p-2.5 bg-rose-500/20 rounded-xl border border-rose-500/30 shrink-0">
                  <Trash2 className="w-5 h-5 text-rose-400" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-100 text-sm sm:text-base">Konfirmasi Hapus</h3>
                  <p className="text-xs text-slate-400">Tindakan ini permanen dan tidak dapat dibatalkan.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 cursor-pointer transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-5 space-y-4 flex-1 overflow-y-auto overscroll-contain">
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-xs text-slate-200 space-y-1">
                <span className="text-slate-400 block text-[11px]">Item yang akan dihapus:</span>
                <p className="font-bold text-rose-300 text-sm leading-snug break-words">{deleteTarget.title}</p>
              </div>
              {deleteTarget.type === 'warta' && (() => {
                const targetW = beritaJemaatList.find((w) => w.id === deleteTarget.id);
                const isLocked = targetW ? getWartaLockStatus(targetW).isLocked : false;
                if (isLocked) {
                  return (
                    <div className="bg-amber-950/40 border border-amber-500/40 rounded-xl p-3 text-xs text-amber-200 space-y-1">
                      <p className="font-bold flex items-center gap-1.5 text-amber-300">
                        <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
                        <span>Penghapusan Khusus Administrator (Edisi Terkunci)</span>
                      </p>
                      <p className="text-[11px] text-amber-200/90 leading-relaxed">
                        Edisi warta ini berstatus terkunci permanen (&gt; 60 menit). Anda melakukan penghapusan menggunakan wewenang khusus akun Administrator.
                      </p>
                    </div>
                  );
                }
                return null;
              })()}
              <p className="text-xs text-slate-400">
                Apakah Anda yakin ingin menghapus data ini dari sistem Warta Jemaat?
              </p>
            </div>

            {/* Modal Footer */}
            <div className="p-3.5 sm:p-4 flex items-center justify-end gap-2 border-t border-slate-800 bg-slate-950/80 shrink-0">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition cursor-pointer disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={confirmExecuteDelete}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-rose-600/20 transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? (
                  <span>Menghapus...</span>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>Ya, Hapus Sekarang</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* MODAL ANIMASI PROGRESS SAAT MENYIMPAN */}
      {saveProgressState.isSaving && (
        <div className="fixed inset-0 z-[80] bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700/80 rounded-2xl p-6 w-full max-w-sm space-y-5 shadow-2xl animate-in fade-in zoom-in-95 duration-200 text-center">
            <div className="flex justify-center">
              {saveProgressState.progress >= 100 ? (
                <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center border border-emerald-500/40 animate-bounce">
                  <CheckCircle2 className="w-9 h-9" />
                </div>
              ) : (
                <div className="w-16 h-16 bg-indigo-500/20 text-indigo-400 rounded-full flex items-center justify-center border border-indigo-500/40 relative">
                  <Loader2 className="w-8 h-8 animate-spin" />
                  <span className="absolute text-[11px] font-bold text-indigo-300">
                    {saveProgressState.progress}%
                  </span>
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <h3 className="text-base font-bold text-slate-100 leading-snug">
                {saveProgressState.title}
              </h3>
              <p className="text-xs text-indigo-300 font-medium animate-pulse">
                {saveProgressState.step}
              </p>
            </div>

            {/* Progress Bar Container */}
            <div className="space-y-1.5">
              <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden border border-slate-800 p-0.5">
                <div
                  className={`h-full rounded-full transition-all duration-300 ease-out ${
                    saveProgressState.progress >= 100
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                      : 'bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-400'
                  }`}
                  style={{ width: `${saveProgressState.progress}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-slate-400 font-medium px-1">
                <span>Proses Menyimpan</span>
                <span>{saveProgressState.progress}%</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: 60-MINUTE EDIT LOCK & REVISION NOTICE DIALOG */}
      {lockNotice?.isOpen && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-md p-5 sm:p-6 space-y-4 text-center my-auto animate-in fade-in zoom-in-95 duration-150">
            <div
              className={`w-14 h-14 mx-auto rounded-2xl flex items-center justify-center border shadow-inner ${
                lockNotice.mode === 'grace_period'
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                  : 'bg-rose-500/20 text-rose-400 border-rose-500/30'
              }`}
            >
              {lockNotice.mode === 'grace_period' ? (
                <Clock className="w-7 h-7 animate-pulse" />
              ) : (
                <Lock className="w-7 h-7" />
              )}
            </div>

            <div className="space-y-2">
              <span className="inline-block font-mono text-[11px] font-bold text-cyan-300 bg-slate-950 px-2.5 py-0.5 rounded-lg border border-slate-800">
                {lockNotice.nomorEdisi}
              </span>
              <h3 className="text-base sm:text-lg font-black text-slate-100">
                {lockNotice.mode === 'grace_period'
                  ? 'Masa Revisi / Edit Masih Terbuka'
                  : 'Edisi Warta Terkunci Permanen'}
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                {lockNotice.mode === 'grace_period' ? (
                  <>
                    Edisi warta ini telah diterbitkan resmi. Pengelola masih diberikan toleransi waktu selama{' '}
                    <strong className="text-emerald-300">60 menit</strong> sejak terbit untuk melakukan perbaikan, penyesuaian, atau sinkronisasi data sebelum terkunci secara permanen.
                  </>
                ) : (
                  <>
                    Edisi Berita & Warta Jemaat yang sudah diterbitkan lebih dari <strong className="text-white">60 menit</strong> telah terkunci secara permanen demi menjaga integritas dokumen jemaat.
                    {isAdmin && (
                      <span className="block mt-2 font-medium text-rose-300 bg-rose-950/40 p-2 rounded-lg border border-rose-800/40 text-[11px]">
                        Khusus akun Administrator, Anda tetap diizinkan untuk menghapus edisi warta ini bila diperlukan melalui tombol &ldquo;Hapus (Admin)&rdquo;.
                      </span>
                    )}
                  </>
                )}
              </p>
            </div>

            <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 text-left space-y-2 text-xs">
              <div className="flex justify-between items-center text-slate-400">
                <span>Waktu Terbit:</span>
                <span className="font-semibold text-slate-200">{lockNotice.publishedAtText}</span>
              </div>
              <div className="flex justify-between items-center text-slate-400">
                <span>Batas Waktu Revisi:</span>
                <span className="font-semibold text-slate-200">{lockNotice.lockEndTimeText}</span>
              </div>
              <div
                className={`flex justify-between items-center pt-1.5 border-t border-slate-800/80 font-bold ${
                  lockNotice.mode === 'grace_period' ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                <span>{lockNotice.mode === 'grace_period' ? 'Sisa Waktu Edit:' : 'Status Dokumen:'}</span>
                <span
                  className={`font-mono px-2 py-0.5 rounded border ${
                    lockNotice.mode === 'grace_period'
                      ? 'text-emerald-300 bg-emerald-950/60 border-emerald-500/30'
                      : 'text-rose-300 bg-rose-950/60 border-rose-500/30'
                  }`}
                >
                  {lockNotice.remainingText}
                </span>
              </div>
            </div>

            <div className="bg-indigo-950/30 border border-indigo-500/20 rounded-xl p-2.5 text-[11px] text-indigo-300/90 text-left flex items-start gap-2">
              <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
              <span>
                {lockNotice.mode === 'grace_period'
                  ? 'Gunakan sisa waktu ini untuk memastikan seluruh jadwal ibadah, keuangan kas, dan berita telah tepat sebelum edisi warta terkunci permanen.'
                  : 'Penguncian permanen ini memastikan dokumen warta jemaat yang telah dibaca dan dicetak tidak mengalami perubahan data yang membingungkan.'}
              </span>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setLockNotice(null)}
                className={`w-full py-2.5 text-white font-bold rounded-xl text-xs shadow-lg transition cursor-pointer ${
                  lockNotice.mode === 'grace_period'
                    ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-900/30'
                    : 'bg-slate-700 hover:bg-slate-600 shadow-slate-900/30'
                }`}
              >
                Mengerti & Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
