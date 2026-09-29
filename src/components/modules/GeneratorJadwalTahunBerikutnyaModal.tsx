import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  X,
  Sparkles,
  Calendar,
  Shuffle,
  Clock,
  MapPin,
  Users,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  FileSpreadsheet,
  Download,
  Trash2,
  Edit2,
  Search,
  Filter,
  ArrowRight,
  Info,
  Loader2,
  Plus,
  RefreshCw,
  Sliders,
  Check,
  Music,
  Mic2,
  LayoutList,
  LayoutGrid,
  ShieldCheck,
} from 'lucide-react';
import ExcelJS from 'exceljs';
import Papa from 'papaparse';
import { JadwalIbadah, Lingkungan, PenatuaDiakon, WargaJemaat } from '../../types';
import { useApp } from '../../context/AppContext';

interface GeneratorJadwalModalProps {
  isOpen: boolean;
  onClose?: () => void;
  existingJadwalList: JadwalIbadah[];
  lingkunganList: Lingkungan[];
  onBatchSave: (items: Omit<JadwalIbadah, 'id'>[], options?: { replaceExistingDates?: boolean }) => Promise<number>;
  penatuaDiakonList?: PenatuaDiakon[];
  wargaJemaatList?: WargaJemaat[];
}

interface GeneratedJadwalRow {
  tempId: string;
  isSelected: boolean;
  tanggal: string; // YYYY-MM-DD
  hariNama: string; // 'Sabtu', dll
  waktu: string;
  namaIbadah: string;
  kategoriIbadah: string;
  seksi?: string;
  rayon?: string;
  pelayanFirman: string;
  pengkhotbah: string;
  natsKhotbah?: string;
  liturgos: string;
  pemusik: string;
  pemanduLagu: string;
  kolektan: string;
  operatorMultimedia?: string;
  penerimaTamu?: string;
  pewartaBerita?: string;
  koordinatorPelayanan?: string;
  kuponUndian?: string;
  pembacaanAlkitab: string;
  tempat: string;
  tuanRumah?: string;
  wartaKhusus?: string;
}

interface PenatuaDiakonMember {
  id?: string;
  displayName: string;
  cleanName: string;
  gender: 'L' | 'P';
  jabatan: 'Penatua' | 'Diakon';
  rayon?: string;
}

const HARI_OPTIONS = [
  { value: 6, label: 'Sabtu (Default Rekomendasi)', short: 'Sabtu' },
  { value: 0, label: 'Minggu (Kebaktian Utama)', short: 'Minggu' },
  { value: 5, label: 'Jumat (Ibadah Pemuda / Kategorial)', short: 'Jumat' },
  { value: 4, label: 'Kamis (Ibadah Doa / Rumah Tangga)', short: 'Kamis' },
  { value: 3, label: 'Rabu (Ibadah PA / Tengah Pekan)', short: 'Rabu' },
  { value: 2, label: 'Selasa', short: 'Selasa' },
  { value: 1, label: 'Senin', short: 'Senin' },
];

const BULAN_NAMES = [
  { value: 1, label: 'Januari' },
  { value: 2, label: 'Februari' },
  { value: 3, label: 'Maret' },
  { value: 4, label: 'April' },
  { value: 5, label: 'Mei' },
  { value: 6, label: 'Juni' },
  { value: 7, label: 'Juli' },
  { value: 8, label: 'Agustus' },
  { value: 9, label: 'September' },
  { value: 10, label: 'Oktober' },
  { value: 11, label: 'November' },
  { value: 12, label: 'Desember' },
];

// Helper to normalize person names for comparison
const cleanPersonName = (str: string): string => {
  if (!str) return '';
  let cleaned = str
    .replace(/,\s*(s\.th|m\.th|s\.pd|se|sh|st|s\.sos|mm|m\.pd|s\.kom|skm|s\.si|m\.si|dr\.|dra\.|drs\.)/gi, '')
    .trim();
  while (/^(pnt\.|dkn\.|pdt\.|penatua|diakon|pendeta|kel\.|keluarga|bpk\.|bapak|ibu|ny\.|sdri\.|sdr\.|mama|papa|rumah|gedung)\s+/i.test(cleaned)) {
    cleaned = cleaned.replace(/^(pnt\.|dkn\.|pdt\.|penatua|diakon|pendeta|kel\.|keluarga|bpk\.|bapak|ibu|ny\.|sdri\.|sdr\.|mama|papa|rumah|gedung)\s+/i, '').trim();
  }
  return cleaned.toLowerCase().replace(/[^a-z0-9]/g, '');
};

// Check if two name strings refer to the same person
const isSamePerson = (nameA?: string, nameB?: string): boolean => {
  if (!nameA || !nameB) return false;
  const a = cleanPersonName(nameA);
  const b = cleanPersonName(nameB);
  if (!a || !b) return false;
  if (a === b) return true;
  if (a.length >= 4 && b.length >= 4) {
    if (a.includes(b) || b.includes(a)) return true;
  }
  return false;
};

// Check if an officer is a member of the host's family (Kepala Keluarga / Anggota Keluarga di KK / rumah tersebut)
const checkIsFamilyMemberOfHost = (
  officerStr: string,
  tuanRumahStr: string,
  tempatStr: string,
  hostCandidate: WargaJemaat | null | undefined,
  wargaList: WargaJemaat[]
): boolean => {
  if (!officerStr) return false;

  const cleanOfficer = cleanPersonName(officerStr);
  const cleanHost = cleanPersonName(tuanRumahStr);
  const cleanTempat = (tempatStr || '').toLowerCase();

  if (!cleanOfficer) return false;

  // 1. Direct name match in tuanRumah or tempat
  if (cleanHost && cleanHost.length >= 3) {
    if (cleanOfficer.includes(cleanHost) || cleanHost.includes(cleanOfficer)) {
      return true;
    }
  }

  if (cleanTempat && cleanTempat.length >= 3) {
    if (cleanTempat.includes(cleanOfficer)) {
      return true;
    }
  }

  // 2. Family relation check via WargaJemaat (same KK / address)
  if (wargaList && wargaList.length > 0) {
    const targetHost =
      hostCandidate ||
      (cleanHost
        ? wargaList.find((w) => {
            const c = cleanPersonName(w.namaLengkap);
            return c && (c === cleanHost || c.includes(cleanHost) || cleanHost.includes(c));
          })
        : null);

    if (targetHost) {
      // Find all family members of this host (Kepala Keluarga, Istri, Anak, Famili Lain)
      const familyMembers = wargaList.filter((w) => {
        if (targetHost.noKjj && w.noKjj && targetHost.noKjj.trim() === w.noKjj.trim()) {
          return true;
        }
        if (
          targetHost.alamat &&
          w.alamat &&
          targetHost.alamat.trim().toLowerCase() === w.alamat.trim().toLowerCase()
        ) {
          return true;
        }
        return false;
      });

      // Check if officer matches ANY member of this host family (Kepala Keluarga or Anggota Keluarga)
      for (const member of familyMembers) {
        const cMember = cleanPersonName(member.namaLengkap);
        if (
          cMember &&
          (cMember === cleanOfficer || cMember.includes(cleanOfficer) || cleanOfficer.includes(cMember))
        ) {
          return true;
        }
      }
    }

    // Also check if officer's own home/address matches tempat
    const officerWarga = wargaList.find((w) => {
      const c = cleanPersonName(w.namaLengkap);
      return c && (c === cleanOfficer || c.includes(cleanOfficer) || cleanOfficer.includes(c));
    });

    if (officerWarga && officerWarga.alamat) {
      const cleanAddr = officerWarga.alamat.trim().toLowerCase();
      if (cleanTempat && cleanTempat.includes(cleanAddr)) {
        return true;
      }
    }
  }

  return false;
};

// Legacy alias for checkIsFamilyMemberOfHost
const checkIsServingAtOwnHome = (
  liturgosStr: string,
  tuanRumahStr: string,
  tempatStr: string,
  wargaList: WargaJemaat[],
  hostCandidate?: WargaJemaat | null
): boolean => {
  return checkIsFamilyMemberOfHost(liturgosStr, tuanRumahStr, tempatStr, hostCandidate, wargaList);
};

// Known female names/keywords for reliable gender classification
const FEMALE_NAMES = new Set([
  'maria', 'debora', 'ester', 'esther', 'ruth', 'sarah', 'martha', 'naomi', 'elisabeth',
  'lydia', 'priskila', 'ribka', 'rachel', 'eva', 'yanti', 'sri', 'dina', 'lina',
  'novita', 'dewi', 'ana', 'ani', 'rina', 'retno', 'nur', 'mariana', 'magdalena',
  'grace', 'claudia', 'angela', 'kristina', 'christina', 'natalia', 'susan', 'susana',
  'yuliana', 'juliana', 'helena', 'beatrix', 'vera', 'dorkas', 'dorcas', 'hanna', 'yohana',
  'mercy', 'elizabeth', 'merlin', 'norlin', 'yunita', 'yuni', 'tini', 'wati', 'rahayu',
  'enny', 'erni', 'lusia', 'lucia', 'titik', 'endang', 'marlina', 'herlina', 'ratna'
]);

const getGenderOfPenatuaDiakon = (
  pd: PenatuaDiakon,
  wargaList: WargaJemaat[]
): 'L' | 'P' => {
  const rawName = (pd.nama || '').trim();
  const clean = cleanPersonName(rawName);

  // 1. Honorific prefix
  if (/\b(ny\.|ibu|sdri\.|mama|perempuan|wanita)\b/i.test(rawName)) return 'P';
  if (/\b(bpk\.|bapak|sdr\.|papa|pria|laki)\b/i.test(rawName)) return 'L';

  // 2. Cross-reference with Warga Jemaat database
  if (wargaList && wargaList.length > 0) {
    const match = wargaList.find((w) => {
      const wClean = cleanPersonName(w.namaLengkap);
      return wClean === clean || (wClean && clean && (wClean.includes(clean) || clean.includes(wClean)));
    });
    if (match && match.jenisKelamin) {
      const jk = match.jenisKelamin.toUpperCase();
      if (jk.startsWith('P') || jk.startsWith('W')) return 'P';
      if (jk.startsWith('L')) return 'L';
    }
  }

  // 3. First name keyword check
  const firstWord = clean.split(' ')[0] || '';
  if (FEMALE_NAMES.has(firstWord)) return 'P';
  for (const fem of FEMALE_NAMES) {
    if (clean.includes(fem)) return 'P';
  }

  return 'L';
};

// Pick smart liturgos avoiding own home / host family members and avoiding consecutive duplicates
const pickSmartLiturgos = (
  pool: PenatuaDiakonMember[],
  tuanRumah: string,
  tempat: string,
  lastLiturgosDisplayName: string,
  usageMap: Map<string, number>,
  wargaList: WargaJemaat[],
  hostCandidate?: WargaJemaat | null
): string => {
  if (!pool || pool.length === 0) return 'Pnt. Majelis Jemaat';

  // 1. Filter out anyone serving at their own home or belonging to the host family (Kepala Keluarga / Anggota Keluarga di KK tersebut)
  const nonHomeCandidates = pool.filter(
    (c) => !checkIsFamilyMemberOfHost(c.displayName, tuanRumah, tempat, hostCandidate, wargaList)
  );

  const candidates = nonHomeCandidates.length > 0 ? nonHomeCandidates : pool;

  // 2. Sort by usage count with anti-consecutive priority
  const sorted = [...candidates].sort((a, b) => {
    const countA = usageMap.get(a.displayName) || 0;
    const countB = usageMap.get(b.displayName) || 0;
    const penaltyA = a.displayName === lastLiturgosDisplayName ? 50 : 0;
    const penaltyB = b.displayName === lastLiturgosDisplayName ? 50 : 0;
    const scoreA = countA + penaltyA;
    const scoreB = countB + penaltyB;
    if (scoreA !== scoreB) return scoreA - scoreB;
    return Math.random() - 0.5;
  });

  const selected = sorted[0];
  usageMap.set(selected.displayName, (usageMap.get(selected.displayName) || 0) + 1);
  return selected.displayName;
};

// Pick smart kolektan (Diakon) ensuring not same as liturgos and not member of the host family
const pickSmartKolektan = (
  diakonPool: PenatuaDiakonMember[],
  tuanRumah: string,
  tempat: string,
  assignedLiturgos: string,
  usageMap: Map<string, number>,
  wargaList: WargaJemaat[],
  hostCandidate?: WargaJemaat | null
): string => {
  if (!diakonPool || diakonPool.length === 0) return 'Dkn. Majelis Jemaat';

  const cleanLiturgos = cleanPersonName(assignedLiturgos);

  // Filter candidates: NOT liturgos, and NOT member of the host's family
  const eligibleCandidates = diakonPool.filter((d) => {
    if (d.displayName === assignedLiturgos || (cleanLiturgos && d.cleanName === cleanLiturgos)) {
      return false;
    }
    if (checkIsFamilyMemberOfHost(d.displayName, tuanRumah, tempat, hostCandidate, wargaList)) {
      return false;
    }
    return true;
  });

  const poolToUse =
    eligibleCandidates.length > 0
      ? eligibleCandidates
      : diakonPool.filter((d) => d.displayName !== assignedLiturgos);

  if (poolToUse.length === 0) return 'Dkn. Majelis Jemaat';

  const sorted = [...poolToUse].sort((a, b) => {
    const countA = usageMap.get(a.displayName) || 0;
    const countB = usageMap.get(b.displayName) || 0;
    if (countA !== countB) return countA - countB;
    return Math.random() - 0.5;
  });

  const selected = sorted[0];
  usageMap.set(selected.displayName, (usageMap.get(selected.displayName) || 0) + 1);
  return selected.displayName;
};

const shuffleArray = <T,>(arr: T[]): T[] => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

const buildRotatingSequence = <T,>(source: T[], count: number, fallback: T): T[] => {
  if (!source || source.length === 0) return Array(count).fill(fallback);
  const res: T[] = [];
  while (res.length < count) {
    const sh = shuffleArray(source);
    if (res.length > 0 && sh.length > 1 && res[res.length - 1] === sh[0]) {
      [sh[0], sh[sh.length - 1]] = [sh[sh.length - 1], sh[0]];
    }
    res.push(...sh);
  }
  return res.slice(0, count);
};

export const GeneratorJadwalTahunBerikutnyaModal: React.FC<GeneratorJadwalModalProps> = ({
  isOpen,
  onClose,
  existingJadwalList,
  lingkunganList,
  onBatchSave,
  penatuaDiakonList: propPenatuaDiakonList,
  wargaJemaatList: propWargaJemaatList,
}) => {
  const {
    penatuaDiakonList: contextPenatuaDiakonList,
    wargaJemaatList: contextWargaJemaatList,
    singerJemaatList,
    showToast,
    setActiveTab,
  } = useApp();
  const rawPenatuaDiakonList = propPenatuaDiakonList || contextPenatuaDiakonList || [];
  const rawWargaJemaatList = propWargaJemaatList || contextWargaJemaatList || [];

  const handleSafeClose = () => {
    if (typeof onClose === 'function') {
      onClose();
    }
  };

  // Current calendar year and default target (next year)
  const currentCalendarYear = new Date().getFullYear();
  const defaultTargetYear = currentCalendarYear + 1; // e.g. 2027 if 2026

  // Configuration States
  const [targetYear, setTargetYear] = useState<number>(defaultTargetYear);
  const [targetDayOfWeek, setTargetDayOfWeek] = useState<number>(6); // 6 = Sabtu
  const [startMonth, setStartMonth] = useState<number>(1); // Januari
  const [endMonth, setEndMonth] = useState<number>(11); // November
  const [defaultWaktu, setDefaultWaktu] = useState<string>('17.00 WIB');
  const [overrideWaktu, setOverrideWaktu] = useState<boolean>(true);
  const [namaIbadahOption, setNamaIbadahOption] = useState<'asli' | 'kustom'>('asli');
  const [kustomNamaIbadah, setKustomNamaIbadah] = useState<string>('Ibadah Hari Sabtu');
  const [usePDForLiturgos, setUsePDForLiturgos] = useState<boolean>(true);

  // Synchronize Host & Venues with Warga Jemaat per Rayon
  const [syncWargaJemaatHosts, setSyncWargaJemaatHosts] = useState<boolean>(true);

  // Aturan Berhenti & Urutan Keluarga (Tanpa Mengulang)
  const [stopWhenFamiliesCompleted, setStopWhenFamiliesCompleted] = useState<boolean>(true);
  const [familySequenceOrder, setFamilySequenceOrder] = useState<'by_lingkungan' | 'sequential' | 'shuffled'>('by_lingkungan');

  // Rayon list from Warga Jemaat database & Lingkungan
  const allRayons = useMemo(() => {
    const fromWarga = (rawWargaJemaatList || []).map((w) => (w.rayon || '').trim()).filter(Boolean);
    const fromLingkungan = (lingkunganList || []).map((l) => (l.nama || '').trim()).filter(Boolean);
    const combined = Array.from(new Set([...fromLingkungan, ...fromWarga])).sort();
    return combined.length > 0 ? combined : ['Lingkungan I', 'Lingkungan II', 'Lingkungan III'];
  }, [rawWargaJemaatList, lingkunganList]);

  // Active Warga Jemaat (tidak meninggal / pindah)
  const activeWargaList = useMemo(() => {
    return (rawWargaJemaatList || []).filter(
      (w) => !w.statusKeanggotaan || (w.statusKeanggotaan !== 'Meninggal' && w.statusKeanggotaan !== 'Pindah')
    );
  }, [rawWargaJemaatList]);

  // Data Kepala Keluarga di Warga Jemaat (Digunakan untuk Ibadah Rayon / Lingkungan & SPB)
  const kepalaKeluargaList = useMemo(() => {
    const list = activeWargaList.filter((w) => {
      const hub = (w.hubunganKeluarga || '').toLowerCase();
      if (hub.includes('kepala')) return true;
      if (w.jenisKelamin === 'L' && !hub.includes('anak') && (w.statusNikah === 'Menikah' || w.statusNikah === 'Duda')) return true;
      return false;
    });
    return list.length > 0 ? list : activeWargaList.filter((w) => w.jenisKelamin === 'L');
  }, [activeWargaList]);

  // Data Istri Keluarga Jemaat di Warga Jemaat (Digunakan untuk Ibadah SPPer)
  const istriKeluargaList = useMemo(() => {
    const list = activeWargaList.filter((w) => {
      const hub = (w.hubunganKeluarga || '').toLowerCase();
      if (hub.includes('istri')) return true;
      if (w.jenisKelamin === 'P' && (w.statusNikah === 'Menikah' || w.statusNikah === 'Janda') && !hub.includes('anak')) return true;
      return false;
    });
    return list.length > 0 ? list : activeWargaList.filter((w) => w.jenisKelamin === 'P');
  }, [activeWargaList]);

  // Kepala Keluarga Unik (1 per keluarga jemaat, menjaga urutan data jemaat dari awal ke akhir)
  const uniqueKepalaKeluargaList = useMemo(() => {
    const seen = new Set<string>();
    const list: WargaJemaat[] = [];
    kepalaKeluargaList.forEach((w) => {
      const key = (w.noKjj && w.noKjj.trim())
        ? `kjj:${w.noKjj.trim().toLowerCase()}`
        : `name:${w.namaLengkap.trim().toLowerCase()}`;
      if (!seen.has(key)) {
        seen.add(key);
        list.push(w);
      }
    });
    return list;
  }, [kepalaKeluargaList]);

  // Istri Keluarga Unik (1 per keluarga jemaat, menjaga urutan data jemaat dari awal ke akhir)
  const uniqueIstriKeluargaList = useMemo(() => {
    const seen = new Set<string>();
    const list: WargaJemaat[] = [];
    istriKeluargaList.forEach((w) => {
      const key = (w.noKjj && w.noKjj.trim())
        ? `kjj:${w.noKjj.trim().toLowerCase()}`
        : `name:${w.namaLengkap.trim().toLowerCase()}`;
      if (!seen.has(key)) {
        seen.add(key);
        list.push(w);
      }
    });
    return list;
  }, [istriKeluargaList]);

  // Kepala Keluarga dikelompokkan per Rayon (untuk Ibadah Rayon/Lingkungan)
  const kepalaKeluargaPerRayon = useMemo(() => {
    const map: Record<string, WargaJemaat[]> = {};
    allRayons.forEach((r) => {
      map[r] = [];
    });
    uniqueKepalaKeluargaList.forEach((w) => {
      const r = (w.rayon || '').trim();
      if (!r) return;
      if (!map[r]) map[r] = [];
      map[r].push(w);
    });
    return map;
  }, [allRayons, uniqueKepalaKeluargaList]);

  // Istri Keluarga dikelompokkan per Rayon (untuk Ibadah SPPer per Rayon jika ada)
  const istriKeluargaPerRayon = useMemo(() => {
    const map: Record<string, WargaJemaat[]> = {};
    allRayons.forEach((r) => {
      map[r] = [];
    });
    uniqueIstriKeluargaList.forEach((w) => {
      const r = (w.rayon || '').trim();
      if (!r) return;
      if (!map[r]) map[r] = [];
      map[r].push(w);
    });
    return map;
  }, [allRayons, uniqueIstriKeluargaList]);

  // Group Warga Jemaat by Rayon (prioritizing Kepala Keluarga)
  const wargaPerRayon = useMemo(() => {
    const map: Record<string, WargaJemaat[]> = {};
    allRayons.forEach((r) => {
      map[r] = [];
    });

    (rawWargaJemaatList || []).forEach((w) => {
      const r = (w.rayon || '').trim();
      if (!r) return;
      if (!map[r]) map[r] = [];
      map[r].push(w);
    });

    Object.keys(map).forEach((k) => {
      map[k].sort((a, b) => {
        const aIsKK = (a.hubunganKeluarga || '').toLowerCase().includes('kepala');
        const bIsKK = (b.hubunganKeluarga || '').toLowerCase().includes('kepala');
        if (aIsKK && !bIsKK) return -1;
        if (!aIsKK && bIsKK) return 1;
        return 0;
      });
    });

    return map;
  }, [allRayons, rawWargaJemaatList]);

  // Classified Penatua & Diakon with gender and display title
  const classifiedPenatuaDiakon = useMemo<PenatuaDiakonMember[]>(() => {
    const source = rawPenatuaDiakonList && rawPenatuaDiakonList.length > 0 ? rawPenatuaDiakonList : [];
    const activeMembers = source.filter((p) => !p.status || p.status.toLowerCase() === 'aktif');
    const validPool = activeMembers.length > 0 ? activeMembers : source;

    return validPool
      .map((p) => {
        const rawName = (p.nama || '').trim();
        if (!rawName) return null;
        const cleanGelar = (p.gelar || '').trim();
        const isDiakon = (p.jabatan || '').toLowerCase().includes('diakon');
        const hasTitle = /^(pnt\.|dkn\.|pdt\.|penatua|diakon)/i.test(rawName);

        let prefix = '';
        if (!hasTitle) {
          prefix = isDiakon ? 'Dkn. ' : 'Pnt. ';
        }
        const nameWithTitle = `${prefix}${rawName}`;
        const displayName = cleanGelar ? `${nameWithTitle}, ${cleanGelar}` : nameWithTitle;

        const gender = getGenderOfPenatuaDiakon(p, rawWargaJemaatList);

        return {
          id: p.id,
          displayName,
          cleanName: cleanPersonName(rawName),
          gender,
          jabatan: isDiakon ? 'Diakon' : 'Penatua',
          rayon: p.rayon || '',
        };
      })
      .filter((item): item is PenatuaDiakonMember => item !== null);
  }, [rawPenatuaDiakonList, rawWargaJemaatList]);

  // Liturgos Pools by Gender
  const liturgosFemalePool = useMemo(() => {
    return classifiedPenatuaDiakon.filter((p) => p.gender === 'P');
  }, [classifiedPenatuaDiakon]);

  const liturgosMalePool = useMemo(() => {
    return classifiedPenatuaDiakon.filter((p) => p.gender === 'L');
  }, [classifiedPenatuaDiakon]);

  const liturgosAllPool = useMemo(() => {
    return classifiedPenatuaDiakon;
  }, [classifiedPenatuaDiakon]);

  // Backward compatibility string pool
  const liturgosPool = useMemo(() => {
    return classifiedPenatuaDiakon.map((p) => p.displayName);
  }, [classifiedPenatuaDiakon]);

  // Diakon Pool for Kolektan / Diakonia service
  const diakonPool = useMemo(() => {
    const onlyDiakons = classifiedPenatuaDiakon.filter((p) => p.jabatan === 'Diakon');
    return onlyDiakons.length > 0 ? onlyDiakons : classifiedPenatuaDiakon;
  }, [classifiedPenatuaDiakon]);

  // Set of Penatua & Diakon clean names
  const penatuaDiakonCleanNameSet = useMemo(() => {
    const set = new Set<string>();
    classifiedPenatuaDiakon.forEach((pd) => {
      if (pd.cleanName) set.add(pd.cleanName);
      const raw = cleanPersonName(pd.displayName);
      if (raw) set.add(raw);
    });
    return set;
  }, [classifiedPenatuaDiakon]);

  // Set of all regular Warga Jemaat clean names (both Kepala Keluarga and Anggota Keluarga)
  const allWargaNamesSet = useMemo(() => {
    const set = new Set<string>();
    (rawWargaJemaatList || []).forEach((w) => {
      const c = cleanPersonName(w.namaLengkap);
      if (c) set.add(c);
    });
    return set;
  }, [rawWargaJemaatList]);

  // Helper to check if a name matches regular Warga Jemaat (Kepala Keluarga / Anggota Keluarga yang BUKAN Penatua/Diakon)
  const isRegularWargaFamily = (name: string): boolean => {
    if (!name) return false;
    const trimmed = name.trim();
    if (!trimmed) return false;

    // Official ecclesiastical & service titles are not regular warga
    if (
      /^(pdt\.|pendeta|vik\.|vikaris|pnt\.|penatua|dkn\.|diakon|tim\s|organis|singer|kantoria|majelis|petugas|operator|koordinator|song\s*leader|pelayan\s*firman)/i.test(
        trimmed
      )
    ) {
      return false;
    }

    const c = cleanPersonName(trimmed);
    if (!c || c.length < 3) return false;

    // If matches any active Penatua/Diakon, they are ordained Majelis
    for (const pdName of penatuaDiakonCleanNameSet) {
      if (c === pdName || c.includes(pdName) || pdName.includes(c)) {
        return false;
      }
    }

    // If matches any Warga Jemaat (Kepala Keluarga or Anggota Keluarga), return true
    for (const wName of allWargaNamesSet) {
      if (c === wName || c.includes(wName) || wName.includes(c)) {
        return true;
      }
    }

    return false;
  };

  // State: Aturan Proteksi Petugas - Tidak menggunakan Kepala Keluarga & Anggota Keluarga sebagai petugas
  const [excludeWargaFromPetugas, setExcludeWargaFromPetugas] = useState<boolean>(true);

  // Source Data Filters
  const [sourceCategory, setSourceCategory] = useState<string>('semua');
  const [sourceSeksi, setSourceSeksi] = useState<string>('semua');
  const [sourceRayon, setSourceRayon] = useState<string>('semua');
  const [sourceYearFilter, setSourceYearFilter] = useState<string>('semua');

  // Helper resolusi pool keluarga berdasarkan kategori, seksi & rayon
  const resolveHostFamilyPool = (category: string, seksi: string, rayon: string) => {
    if (category === 'Rayon / Lingkungan') {
      if (rayon && rayon !== 'semua' && kepalaKeluargaPerRayon[rayon]?.length > 0) {
        return kepalaKeluargaPerRayon[rayon];
      }
      return uniqueKepalaKeluargaList;
    }
    if (category === 'Kategorial') {
      const isSPPer = seksi === 'SPPer' || /spper|perempuan|wanita/i.test(seksi);
      const isSPB = seksi === 'SPB' || /spb|bapak|pria/i.test(seksi);
      if (isSPPer) {
        if (rayon && rayon !== 'semua' && istriKeluargaPerRayon[rayon]?.length > 0) {
          return istriKeluargaPerRayon[rayon];
        }
        return uniqueIstriKeluargaList;
      }
      if (isSPB) {
        if (rayon && rayon !== 'semua' && kepalaKeluargaPerRayon[rayon]?.length > 0) {
          return kepalaKeluargaPerRayon[rayon];
        }
        return uniqueKepalaKeluargaList;
      }
    }
    return uniqueKepalaKeluargaList;
  };

  // Pool Tuan Rumah Aktif untuk konfigurasi saat ini
  const activeHostFamilyPool = useMemo(() => {
    return resolveHostFamilyPool(sourceCategory, sourceSeksi, sourceRayon);
  }, [sourceCategory, sourceSeksi, sourceRayon, kepalaKeluargaPerRayon, uniqueKepalaKeluargaList, istriKeluargaPerRayon, uniqueIstriKeluargaList]);

  // Shuffle & Distribution Mode
  const [shuffleMode, setShuffleMode] = useState<'paket_utuh' | 'acak_silang'>('paket_utuh');

  // External file upload for source data
  const [uploadedSourceData, setUploadedSourceData] = useState<Omit<JadwalIbadah, 'id'>[] | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Generated Items State
  const [generatedRows, setGeneratedRows] = useState<GeneratedJadwalRow[]>([]);
  const [previewSearch, setPreviewSearch] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveProgress, setSaveProgress] = useState<{ current: number; total: number }>({ current: 0, total: 0 });
  const [editingRow, setEditingRow] = useState<GeneratedJadwalRow | null>(null);
  const [skipExistingDates, setSkipExistingDates] = useState<boolean>(true);
  const [previewViewMode, setPreviewViewMode] = useState<'table' | 'cards'>('table');

  // Extract distinct available source years
  const availableSourceYears = useMemo(() => {
    const years = new Set<number>();
    existingJadwalList.forEach((j) => {
      if (j.tanggal) {
        const y = parseInt(j.tanggal.split('-')[0], 10);
        if (!isNaN(y)) years.add(y);
      }
    });
    return Array.from(years).sort((a, b) => b - a);
  }, [existingJadwalList]);

  // Filter the source pool of templates
  const sourcePool = useMemo(() => {
    if (uploadedSourceData && uploadedSourceData.length > 0) {
      return uploadedSourceData;
    }

    return existingJadwalList.filter((j) => {
      if (sourceCategory !== 'semua') {
        if (sourceCategory === 'Rayon / Lingkungan') {
          if (j.kategoriIbadah !== 'Rayon / Lingkungan' && !(!j.kategoriIbadah && j.rayon && !j.seksi)) return false;
        } else if (sourceCategory === 'Kategorial') {
          if (j.kategoriIbadah === 'Rayon / Lingkungan') return false;
          if (j.kategoriIbadah !== 'Kategorial' && !j.seksi) return false;
        } else {
          if (j.kategoriIbadah !== sourceCategory) return false;
        }
      }
      if (sourceSeksi !== 'semua' && j.seksi !== sourceSeksi) return false;
      if (sourceRayon !== 'semua' && j.rayon !== sourceRayon) return false;
      if (sourceYearFilter !== 'semua' && j.tanggal) {
        const y = j.tanggal.split('-')[0];
        if (y !== sourceYearFilter) return false;
      }
      return true;
    });
  }, [existingJadwalList, uploadedSourceData, sourceCategory, sourceSeksi, sourceRayon, sourceYearFilter]);

  // Compute existing scheduled dates in the target year to detect duplicates
  const existingTargetDatesSet = useMemo(() => {
    const set = new Set<string>();
    existingJadwalList.forEach((j) => {
      if (j.tanggal && j.tanggal.startsWith(`${targetYear}-`)) {
        set.add(j.tanggal);
      }
    });
    return set;
  }, [existingJadwalList, targetYear]);

  // Pool of available singers/pemandu lagu diambil HANYA dari master data Singer Jemaat
  // Sesuai aturan: "singer/pemandu lagu diambil dari data data Singer Jemaat(buatkan halaman baru). jika tidak ada data biarkan saja kosong."
  const allAvailableSingers = useMemo(() => {
    const rawSingers = new Set<string>();
    const activeSingers = (singerJemaatList || []).filter(
      (s) => !s.status || s.status.toLowerCase() === 'aktif'
    );

    activeSingers.forEach((s) => {
      const name = (s.nama || '').trim();
      if (name) {
        rawSingers.add(name);
      }
    });

    // Deduplicate by clean name so no duplicates exist in pool
    const uniquePool: string[] = [];
    const seenClean = new Set<string>();
    Array.from(rawSingers).forEach((s) => {
      const c = cleanPersonName(s);
      if (c && !seenClean.has(c)) {
        seenClean.add(c);
        uniquePool.push(s);
      }
    });

    return uniquePool;
  }, [singerJemaatList]);

  // Smart singer picker enforcing strict uniqueness:
  // 1. Not the same as recently assigned singers (cooling window)
  // 2. Not the same as any other officer on this date (Liturgos, PF, Pemusik, Kolektan, Tuan Rumah, Penerima Tamu)
  // 3. For duets, singer 1 and singer 2 are NEVER the same person
  // 4. Fair usage distribution using singerUsageMap
  const pickSmartSinger = ({
    singerPool,
    lastAssignedSinger,
    recentSingers = [],
    avoidNextSinger = '',
    currentSinger = '',
    resolvedLiturgos,
    resolvedPelayanFirman,
    resolvedPemusik,
    resolvedKolektan,
    resolvedTuanRumah,
    resolvedPenerimaTamu,
    resolvedTempat,
    hostCandidate,
    singerUsageMap,
    preferDualSingers = false,
  }: {
    singerPool: string[];
    lastAssignedSinger: string;
    recentSingers?: string[];
    avoidNextSinger?: string;
    currentSinger?: string;
    resolvedLiturgos?: string;
    resolvedPelayanFirman?: string;
    resolvedPemusik?: string;
    resolvedKolektan?: string;
    resolvedTuanRumah?: string;
    resolvedPenerimaTamu?: string;
    resolvedTempat?: string;
    hostCandidate?: WargaJemaat | null;
    singerUsageMap: Map<string, number>;
    preferDualSingers?: boolean;
  }): string => {
    const forbiddenCleanNames = new Set<string>();

    const addForbidden = (nameStr?: string) => {
      if (!nameStr) return;
      const parts = nameStr.split(/(?:\s*&\s*|\s*,\s*|\s+dan\s+|\s*\/\s*|\s*\+\s*)/i);
      parts.forEach((p) => {
        const c = cleanPersonName(p);
        if (c) forbiddenCleanNames.add(c);
      });
    };

    // Rule 1: Not the same person as recent weeks' singers (cooling window)
    addForbidden(lastAssignedSinger);
    recentSingers.forEach((s) => addForbidden(s));
    addForbidden(avoidNextSinger);
    addForbidden(currentSinger);

    // Rule 2: Not the same person as other officers on this date
    addForbidden(resolvedPelayanFirman);
    addForbidden(resolvedLiturgos);
    addForbidden(resolvedPemusik);
    addForbidden(resolvedKolektan);
    addForbidden(resolvedTuanRumah);
    addForbidden(resolvedPenerimaTamu);

    // Filter candidates strictly
    const candidates = singerPool.filter((cand) => {
      const c = cleanPersonName(cand);
      if (!c) return false;
      if (forbiddenCleanNames.has(c)) return false;

      // Protection: cannot be host family member
      if (excludeWargaFromPetugas && resolvedTuanRumah) {
        if (checkIsFamilyMemberOfHost(cand, resolvedTuanRumah, resolvedTempat || '', hostCandidate, rawWargaJemaatList)) {
          return false;
        }
      }
      return true;
    });

    // Fallback if strictly filtered list is too small (relax recent cooling, but NEVER other officers on this date!)
    const fallbackList =
      candidates.length > 0
        ? candidates
        : singerPool.filter((cand) => {
            const c = cleanPersonName(cand);
            if (!c) return false;
            if (c === cleanPersonName(resolvedLiturgos) || isSamePerson(cand, resolvedLiturgos)) return false;
            if (c === cleanPersonName(resolvedPelayanFirman) || isSamePerson(cand, resolvedPelayanFirman)) return false;
            if (c === cleanPersonName(resolvedPemusik) || isSamePerson(cand, resolvedPemusik)) return false;
            if (c === cleanPersonName(resolvedKolektan) || isSamePerson(cand, resolvedKolektan)) return false;
            if (c === cleanPersonName(resolvedTuanRumah) || isSamePerson(cand, resolvedTuanRumah)) return false;
            return true;
          });

    const activeList = fallbackList.length > 0 ? fallbackList : singerPool;

    // Sort by usage frequency (ascending) for fair rotation
    const sorted = [...activeList].sort((a, b) => {
      const countA = singerUsageMap.get(a) || 0;
      const countB = singerUsageMap.get(b) || 0;
      if (countA !== countB) return countA - countB;
      return Math.random() - 0.5;
    });

    if (sorted.length === 0) return '';

    if (preferDualSingers) {
      const first = sorted[0];
      const firstClean = cleanPersonName(first);

      // Singer 2 MUST be completely different person from Singer 1
      const secondCandidate = sorted.slice(1).find((s) => {
        const sClean = cleanPersonName(s);
        return sClean !== firstClean && !isSamePerson(s, first);
      });

      let second = secondCandidate;
      if (!second) {
        // Look in activeList or singerPool for any singer different from first and not serving other roles
        second = singerPool.find((s) => {
          const sClean = cleanPersonName(s);
          return (
            sClean !== firstClean &&
            !isSamePerson(s, first) &&
            sClean !== cleanPersonName(resolvedLiturgos) &&
            sClean !== cleanPersonName(resolvedPelayanFirman) &&
            sClean !== cleanPersonName(resolvedPemusik) &&
            sClean !== cleanPersonName(resolvedKolektan)
          );
        });
      }

      if (second && !isSamePerson(first, second)) {
        singerUsageMap.set(first, (singerUsageMap.get(first) || 0) + 1);
        singerUsageMap.set(second, (singerUsageMap.get(second) || 0) + 1);
        return `${first} & ${second}`;
      } else {
        // Fallback to single singer rather than having identical person in duet
        singerUsageMap.set(first, (singerUsageMap.get(first) || 0) + 1);
        return first;
      }
    } else {
      const picked = sorted[0];
      singerUsageMap.set(picked, (singerUsageMap.get(picked) || 0) + 1);
      return picked;
    }
  };

  // Generate target dates (e.g., every Saturday in target year between startMonth and endMonth)
  const targetDates = useMemo(() => {
    const dates: { dateStr: string; hariNama: string; displayDate: string }[] = [];
    const namaHariList = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const selectedHariName = namaHariList[targetDayOfWeek] || 'Sabtu';

    // Start date: 1st day of startMonth
    const d = new Date(targetYear, startMonth - 1, 1);
    // End date: last day of endMonth
    const end = new Date(targetYear, endMonth, 0);

    while (d <= end) {
      if (d.getDay() === targetDayOfWeek) {
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        const dateStr = `${yyyy}-${mm}-${dd}`;

        const bulanNama = BULAN_NAMES[d.getMonth()]?.label || '';
        const displayDate = `${selectedHariName}, ${dd} ${bulanNama} ${yyyy}`;

        dates.push({
          dateStr,
          hariNama: selectedHariName,
          displayDate,
        });
      }
      d.setDate(d.getDate() + 1);
    }
    return dates;
  }, [targetYear, targetDayOfWeek, startMonth, endMonth]);

  // Smart Randomization Algorithm
  const handleGenerateAndShuffle = () => {
    if (targetDates.length === 0) {
      showToast.warning('Tidak ada tanggal yang ditemukan untuk kriteria bulan dan hari yang dipilih.');
      return;
    }

    if (sourcePool.length === 0) {
      showToast.warning(
        'Data sumber tidak ditemukan pada filter yang dipilih. Silakan pilih kategori "Semua" atau pastikan sudah mengimpor data ke Jadwal Ibadah & Liturgi.'
      );
      return;
    }

    setIsGenerating(true);

    setTimeout(() => {
      try {
        const poolCopy = [...sourcePool];
        const liturgosUsageMap = new Map<string, number>();
        const kolektanUsageMap = new Map<string, number>();
        const singerUsageMap = new Map<string, number>();
        let lastAssignedLiturgos = '';
        let lastAssignedSinger = '';

        // Sanitizer to enforce church rule: Never use Kepala Keluarga & Anggota Keluarga as officers
        const sanitizeOfficer = (
          rawName: string | undefined,
          fallback: string,
          tuanRumah: string,
          tempat: string,
          hostCandidate?: WargaJemaat | null
        ): string => {
          if (!rawName || !rawName.trim()) return fallback;
          const trimmed = rawName.trim();

          if (excludeWargaFromPetugas) {
            // 1. Never allow someone who is a member of the host's family
            if (checkIsFamilyMemberOfHost(trimmed, tuanRumah, tempat, hostCandidate, rawWargaJemaatList)) {
              return fallback;
            }
            // 2. Never allow any regular citizen / family member (KK or Anggota Keluarga who is not ordained Penatua/Diakon/Pendeta)
            if (isRegularWargaFamily(trimmed)) {
              return fallback;
            }
          }
          return trimmed;
        };

        // Tentukan pool keluarga tuan rumah yang relevan
        const currentFamilyPool = activeHostFamilyPool.length > 0 ? activeHostFamilyPool : uniqueKepalaKeluargaList;

        // Cek apakah aturan berhenti saat data keluarga selesai aktif (tanpa mengulang)
        const shouldStopAtEndOfFamilies =
          syncWargaJemaatHosts &&
          stopWhenFamiliesCompleted &&
          currentFamilyPool.length > 0 &&
          (sourceCategory === 'Rayon / Lingkungan' || sourceCategory === 'Kategorial' || sourceCategory === 'semua');

        // Jumlah jadwal efektif: dihentikan tepat setelah data keluarga selesai (tanpa mengulang)
        const effectiveNumDates = shouldStopAtEndOfFamilies
          ? Math.min(targetDates.length, currentFamilyPool.length)
          : targetDates.length;

        const effectiveTargetDates = targetDates.slice(0, effectiveNumDates);

        // Siapkan urutan keluarga unik (berdasarkan lingkungan, dari awal hingga akhir data warga jemaat, atau acak tanpa pengulangan)
        let hostCandidatesList: WargaJemaat[] = [];
        if (currentFamilyPool.length > 0) {
          if (familySequenceOrder === 'by_lingkungan') {
            // Pengurutan berdasarkan Lingkungan / Rayon (Lingkungan 1, Lingkungan 2, Lingkungan 3...)
            const lingOrderMap = new Map<string, number>();
            (lingkunganList || []).forEach((ling, idx) => {
              if (ling.nama) lingOrderMap.set(ling.nama.trim().toLowerCase(), idx);
              if (ling.kode) lingOrderMap.set(ling.kode.trim().toLowerCase(), idx);
            });

            const sorted = [...currentFamilyPool].sort((a, b) => {
              const rayonA = (a.rayon || a.sektorRayon || '').trim();
              const rayonB = (b.rayon || b.sektorRayon || '').trim();

              if (rayonA.toLowerCase() !== rayonB.toLowerCase()) {
                const idxA = lingOrderMap.has(rayonA.toLowerCase()) ? lingOrderMap.get(rayonA.toLowerCase())! : 9999;
                const idxB = lingOrderMap.has(rayonB.toLowerCase()) ? lingOrderMap.get(rayonB.toLowerCase())! : 9999;
                if (idxA !== idxB) {
                  return idxA - idxB;
                }
                return rayonA.localeCompare(rayonB, undefined, { numeric: true, sensitivity: 'base' });
              }

              // Jika dalam lingkungan yang sama, pertahankan urutan data warga jemaat
              return 0;
            });
            hostCandidatesList = sorted;
          } else if (familySequenceOrder === 'sequential') {
            // Sesuai aturan: dari awal hingga akhir data warga jemaat (tanpa ulang)
            hostCandidatesList = [...currentFamilyPool];
          } else {
            // Acak urutan, tetap 1x per keluarga tanpa pengulangan
            const shuffled = [...currentFamilyPool];
            for (let i = shuffled.length - 1; i > 0; i--) {
              const j = Math.floor(Math.random() * (i + 1));
              [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
            }
            hostCandidatesList = shuffled;
          }
        }

        const newRows: GeneratedJadwalRow[] = [];
        const recentSingersQueue: string[] = [];

        if (shuffleMode === 'paket_utuh') {
          // MODE 1: Shuffles full packets and cycles cleanly with anti-consecutive protection
          const shuffledPool: Omit<JadwalIbadah, 'id'>[] = [];

          while (shuffledPool.length < effectiveNumDates) {
            // Fisher-Yates shuffle
            const round = [...poolCopy];
            for (let i = round.length - 1; i > 0; i--) {
              const j = Math.floor(Math.random() * (i + 1));
              [round[i], round[j]] = [round[j], round[i]];
            }

            // Anti-consecutive check between round boundary
            if (
              shuffledPool.length > 0 &&
              round.length > 1 &&
              shuffledPool[shuffledPool.length - 1].pelayanFirman === round[0].pelayanFirman
            ) {
              [round[0], round[round.length - 1]] = [round[round.length - 1], round[0]];
            }

            shuffledPool.push(...round);
          }

          // Assign each target date to a shuffled packet with smart constraint resolution
          effectiveTargetDates.forEach((td, index) => {
            const item = shuffledPool[index];

            // Determine hostCandidate from congregation family database if enabled
            const hostCandidate =
              syncWargaJemaatHosts && hostCandidatesList.length > 0
                ? shouldStopAtEndOfFamilies
                  ? hostCandidatesList[index]
                  : (hostCandidatesList[index % hostCandidatesList.length] || null)
                : null;

            // 1. Determine Category & Seksi strictly
            let resolvedKategori = item.kategoriIbadah || 'Umum / Hari Minggu';
            let resolvedSeksi = item.seksi || '';

            if (sourceCategory === 'Rayon / Lingkungan') {
              resolvedKategori = 'Rayon / Lingkungan';
              resolvedSeksi = ''; // Rayon/lingkungan bukan termasuk kategorial!
            } else if (sourceCategory === 'Kategorial') {
              resolvedKategori = 'Kategorial';
              resolvedSeksi = sourceSeksi !== 'semua' ? sourceSeksi : (item.seksi || 'SPB');
            } else {
              // Auto-detect based on item data
              if (
                item.kategoriIbadah === 'Rayon / Lingkungan' ||
                (!item.kategoriIbadah && item.rayon && !item.seksi)
              ) {
                resolvedKategori = 'Rayon / Lingkungan';
                resolvedSeksi = ''; // Rayon/lingkungan bukan termasuk kategorial!
              } else if (item.kategoriIbadah === 'Kategorial' || item.seksi) {
                resolvedKategori = 'Kategorial';
                resolvedSeksi = item.seksi || 'SPB';
              }
            }

            // 2. Determine Rayon, Tuan Rumah, Tempat
            let resolvedRayon = item.rayon || '';
            let resolvedTuanRumah = item.tuanRumah || '';
            let resolvedTempat = item.tempat || 'Gedung Gereja';

            if (resolvedKategori === 'Rayon / Lingkungan') {
              // Rayon comes from allRayons (from Warga Jemaat database & Lingkungan)
              if (sourceRayon !== 'semua') {
                resolvedRayon = sourceRayon;
              } else if (allRayons.length > 0) {
                resolvedRayon = allRayons[index % allRayons.length];
              }

              // Aturan User: Gunakan data KEPALA KELUARGA di warga jemaat, 1x tanpa ulang, berhenti di akhir data
              if (syncWargaJemaatHosts && hostCandidate) {
                resolvedTuanRumah = hostCandidate.namaLengkap;
                if (hostCandidate.rayon) {
                  resolvedRayon = hostCandidate.rayon;
                }
                resolvedTempat = hostCandidate.alamat
                  ? `Rumah Kel. ${hostCandidate.namaLengkap}, ${hostCandidate.alamat}`
                  : `Rumah Kel. ${hostCandidate.namaLengkap} (${resolvedRayon || 'Rayon'})`;
              } else if (!resolvedTuanRumah && resolvedTempat) {
                const matchKel = resolvedTempat.match(/(?:Rumah\s+)?Kel(?:uarga|\.)?\s*([A-Za-z0-9\s.,-]+)/i);
                if (matchKel && matchKel[1]) {
                  resolvedTuanRumah = matchKel[1].trim();
                }
              }
            } else if (resolvedKategori === 'Kategorial') {
              const isSPB = resolvedSeksi === 'SPB' || /spb|bapak|pria/i.test(item.namaIbadah || '');
              const isSPPer = resolvedSeksi === 'SPPer' || /spper|perempuan|wanita/i.test(item.namaIbadah || '');

              if (syncWargaJemaatHosts && hostCandidate) {
                resolvedTuanRumah = hostCandidate.namaLengkap;
                if (hostCandidate.rayon) {
                  resolvedRayon = hostCandidate.rayon;
                }
                resolvedTempat = hostCandidate.alamat
                  ? (isSPPer
                      ? `Rumah Kel. Ny. ${hostCandidate.namaLengkap}, ${hostCandidate.alamat}`
                      : `Rumah Kel. ${hostCandidate.namaLengkap}, ${hostCandidate.alamat}`)
                  : (isSPPer
                      ? `Rumah Kel. Ny. ${hostCandidate.namaLengkap}`
                      : `Rumah Kel. ${hostCandidate.namaLengkap}`);
              }

              if (!resolvedTuanRumah && resolvedTempat && resolvedTempat.toLowerCase().includes('kel')) {
                const matchKel = resolvedTempat.match(/(?:Rumah\s+)?Kel(?:uarga|\.)?\s*([A-Za-z0-9\s.,-]+)/i);
                if (matchKel && matchKel[1]) {
                  resolvedTuanRumah = matchKel[1].trim();
                }
              }
            }

            // 3. Determine Name of Service
            const resolvedNamaIbadah =
              namaIbadahOption === 'kustom' && kustomNamaIbadah.trim()
                ? kustomNamaIbadah.trim()
                : item.namaIbadah ||
                  (resolvedKategori === 'Rayon / Lingkungan'
                    ? `Ibadah ${resolvedRayon || 'Rayon'}`
                    : resolvedKategori === 'Kategorial'
                    ? `Ibadah ${resolvedSeksi || 'Kategorial'}`
                    : `Ibadah ${td.hariNama}`);

            const resolvedWaktu =
              overrideWaktu && defaultWaktu.trim() ? defaultWaktu.trim() : item.waktu || '17.00 WIB';

            // 4. Liturgos Selection with Strict Rules:
            // - Khusus Majelis Jemaat (Penatua & Diakon)
            // - Bebas dari anggota keluarga tuan rumah
            // - Gender matching (SPPer -> Perempuan, SPB -> Laki-laki)
            let resolvedLiturgos = item.liturgos || 'Pnt. Majelis Jemaat';

            if (usePDForLiturgos && classifiedPenatuaDiakon.length > 0) {
              let eligiblePool = liturgosAllPool;

              const isSPPer =
                resolvedSeksi === 'SPPer' ||
                /spper|perempuan|wanita/i.test(resolvedNamaIbadah) ||
                /spper|perempuan|wanita/i.test(item.namaIbadah || '');

              const isSPB =
                resolvedSeksi === 'SPB' ||
                /spb|bapak|pria/i.test(resolvedNamaIbadah) ||
                /spb|bapak|pria/i.test(item.namaIbadah || '');

              if (isSPPer && liturgosFemalePool.length > 0) {
                eligiblePool = liturgosFemalePool;
              } else if (isSPB && liturgosMalePool.length > 0) {
                eligiblePool = liturgosMalePool;
              } else {
                eligiblePool = liturgosAllPool;
              }

              resolvedLiturgos = pickSmartLiturgos(
                eligiblePool,
                resolvedTuanRumah,
                resolvedTempat,
                lastAssignedLiturgos,
                liturgosUsageMap,
                rawWargaJemaatList,
                hostCandidate
              );
              lastAssignedLiturgos = resolvedLiturgos;
            } else {
              resolvedLiturgos = sanitizeOfficer(
                resolvedLiturgos,
                'Pnt. Majelis Jemaat',
                resolvedTuanRumah,
                resolvedTempat,
                hostCandidate
              );
            }

            // 5. Kolektan Selection (Diakon Majelis, bukan liturgos, bukan tuan rumah)
            let resolvedKolektan = item.kolektan || 'Dkn. Majelis Jemaat';
            if (diakonPool.length > 0) {
              resolvedKolektan = pickSmartKolektan(
                diakonPool,
                resolvedTuanRumah,
                resolvedTempat,
                resolvedLiturgos,
                kolektanUsageMap,
                rawWargaJemaatList,
                hostCandidate
              );
            } else {
              resolvedKolektan = sanitizeOfficer(
                item.kolektan,
                'Dkn. Majelis Jemaat',
                resolvedTuanRumah,
                resolvedTempat,
                hostCandidate
              );
            }

            // 6. Proteksi Seluruh Petugas Ibadah (Jangan gunakan Kepala Keluarga & Anggota Keluarga biasa)
            const rawPf = item.pelayanFirman || item.pengkhotbah || 'Pdt. Jemaat';
            const resolvedPelayanFirman = sanitizeOfficer(
              rawPf,
              'Pdt. Jemaat',
              resolvedTuanRumah,
              resolvedTempat,
              hostCandidate
            );

            const resolvedPemusik = sanitizeOfficer(
              item.pemusik,
              'Organis Jemaat',
              resolvedTuanRumah,
              resolvedTempat,
              hostCandidate
            );

            // Singer / Pemandu Lagu: pastikan orang berbeda, tidak berturut-turut, dan bukan petugas lain
            let rawSinger = (item.pemanduLagu || item.kantoria || '').trim();
            const isConflictingSinger = (candidate: string): boolean => {
              if (!candidate || candidate === 'Singer Jemaat') return true;
              const parts = candidate
                .split(/(?:\s*&\s*|\s*,\s*|\s+dan\s+|\s*\/\s*|\s*\+\s*)/i)
                .map((p) => p.trim())
                .filter(Boolean);
              if (parts.length > 1 && isSamePerson(parts[0], parts[1])) return true;
              for (const p of parts) {
                const cp = cleanPersonName(p);
                if (recentSingersQueue.some((rec) => isSamePerson(rec, p))) return true;
                if (cp === cleanPersonName(resolvedLiturgos) || isSamePerson(p, resolvedLiturgos)) return true;
                if (cp === cleanPersonName(resolvedPelayanFirman) || isSamePerson(p, resolvedPelayanFirman)) return true;
                if (cp === cleanPersonName(resolvedPemusik) || isSamePerson(p, resolvedPemusik)) return true;
                if (cp === cleanPersonName(resolvedKolektan) || isSamePerson(p, resolvedKolektan)) return true;
                if (cp === cleanPersonName(resolvedTuanRumah) || isSamePerson(p, resolvedTuanRumah)) return true;
                if (checkIsFamilyMemberOfHost(p, resolvedTuanRumah, resolvedTempat, hostCandidate, rawWargaJemaatList)) return true;
              }
              return false;
            };

            let resolvedPemanduLagu = '';
            if (allAvailableSingers.length > 0) {
              resolvedPemanduLagu = pickSmartSinger({
                singerPool: allAvailableSingers,
                lastAssignedSinger,
                recentSingers: recentSingersQueue,
                resolvedLiturgos,
                resolvedPelayanFirman,
                resolvedPemusik,
                resolvedKolektan,
                resolvedTuanRumah,
                resolvedTempat,
                hostCandidate,
                singerUsageMap,
                preferDualSingers: Boolean(rawSinger && (rawSinger.includes('&') || rawSinger.includes(','))),
              });
              lastAssignedSinger = resolvedPemanduLagu;
              const singerPartsM1 = resolvedPemanduLagu.split(/(?:\s*&\s*|\s*,\s*|\s+dan\s+|\s*\/\s*|\s*\+\s*)/i);
              singerPartsM1.forEach((p) => {
                const tr = p.trim();
                if (tr) {
                  singerUsageMap.set(tr, (singerUsageMap.get(tr) || 0) + 1);
                  recentSingersQueue.push(tr);
                  if (recentSingersQueue.length > 8) recentSingersQueue.shift();
                }
              });
            } else {
              // Jika tidak ada data singer jemaat, biarkan kosong sesuai instruksi pengguna
              resolvedPemanduLagu = '';
            }

            const resolvedPenerimaTamu = sanitizeOfficer(
              item.penerimaTamu,
              'Majelis Penerima Tamu',
              resolvedTuanRumah,
              resolvedTempat,
              hostCandidate
            );

            const resolvedPewartaBerita = sanitizeOfficer(
              item.pewartaBerita,
              'Pewarta Jemaat',
              resolvedTuanRumah,
              resolvedTempat,
              hostCandidate
            );

            const resolvedKoordinator = sanitizeOfficer(
              item.koordinatorPelayanan,
              resolvedRayon ? `Koordinator ${resolvedRayon}` : 'Koordinator Pelayanan',
              resolvedTuanRumah,
              resolvedTempat,
              hostCandidate
            );

            newRows.push({
              tempId: `gen-${td.dateStr}-${index}-${Math.random().toString(36).substring(2, 6)}`,
              isSelected: true,
              tanggal: td.dateStr,
              hariNama: td.hariNama,
              waktu: resolvedWaktu,
              namaIbadah: resolvedNamaIbadah,
              kategoriIbadah: resolvedKategori,
              seksi: resolvedSeksi,
              rayon: resolvedRayon,
              pelayanFirman: resolvedPelayanFirman,
              pengkhotbah: resolvedPelayanFirman,
              natsKhotbah: item.natsKhotbah || '',
              liturgos: resolvedLiturgos,
              pemusik: resolvedPemusik,
              pemanduLagu: resolvedPemanduLagu,
              kolektan: resolvedKolektan,
              operatorMultimedia: item.operatorMultimedia || 'Tim Multimedia',
              penerimaTamu: resolvedPenerimaTamu,
              pewartaBerita: resolvedPewartaBerita,
              koordinatorPelayanan: resolvedKoordinator,
              kuponUndian: item.kuponUndian || '',
              pembacaanAlkitab: item.pembacaanAlkitab || 'Alkitab',
              tempat: resolvedTempat,
              tuanRumah: resolvedTuanRumah,
              wartaKhusus: `Jadwal Acak Tahun ${targetYear} (${resolvedKategori}${
                resolvedSeksi ? ` - ${resolvedSeksi}` : resolvedRayon ? ` - ${resolvedRayon}` : ''
              })`,
            });
          });
        } else {
          // MODE 2: Acak Silang Mandiri (cross-shuffle different roles with all constraints)
          const pelayanFirmanList = Array.from(
            new Set(poolCopy.map((p) => p.pelayanFirman || p.pengkhotbah).filter(Boolean))
          ).filter((name) => !excludeWargaFromPetugas || !isRegularWargaFamily(name));

          const pemusikList = Array.from(new Set(poolCopy.map((p) => p.pemusik).filter(Boolean)))
            .filter((name) => !excludeWargaFromPetugas || !isRegularWargaFamily(name));

          const pemanduList = Array.from(new Set(poolCopy.map((p) => p.pemanduLagu || p.kantoria).filter(Boolean)))
            .filter((name) => !excludeWargaFromPetugas || !isRegularWargaFamily(name));

          const tempatList = Array.from(new Set(poolCopy.map((p) => p.tempat).filter(Boolean)));
          const tuanRumahList = Array.from(
            new Set(
              poolCopy
                .map((p) => {
                  if (p.tuanRumah) return p.tuanRumah;
                  const match = (p.tempat || '').match(/(?:Rumah\s+)?Kel(?:uarga|\.)?\s*([A-Za-z0-9\s.,-]+)/i);
                  return match ? match[1].trim() : '';
                })
                .filter(Boolean)
            )
          );
          const natsList = Array.from(new Set(poolCopy.map((p) => p.natsKhotbah).filter(Boolean)));
          const pembacaanList = Array.from(new Set(poolCopy.map((p) => p.pembacaanAlkitab).filter(Boolean)));
          const kolektanList = Array.from(new Set(poolCopy.map((p) => p.kolektan).filter(Boolean)))
            .filter((name) => !excludeWargaFromPetugas || !isRegularWargaFamily(name));
          const seksiList = Array.from(new Set(poolCopy.map((p) => p.seksi).filter(Boolean)));

          const pfSeq = buildRotatingSequence(pelayanFirmanList, effectiveNumDates, 'Pdt. Jemaat');
          const musSeq = buildRotatingSequence(pemusikList, effectiveNumDates, 'Organis Jemaat');
          const singSeq = buildRotatingSequence(pemanduList, effectiveNumDates, 'Singer Jemaat');
          const tmpSeq = buildRotatingSequence(tempatList, effectiveNumDates, 'Gedung Gereja');
          const trSeq = buildRotatingSequence(tuanRumahList, effectiveNumDates, '');
          const natsSeq = buildRotatingSequence(natsList, effectiveNumDates, '');
          const alkSeq = buildRotatingSequence(pembacaanList, effectiveNumDates, 'Alkitab');
          const kolSeq = buildRotatingSequence(kolektanList, effectiveNumDates, 'Dkn. Majelis Jemaat');
          const seksiSeq = buildRotatingSequence(seksiList, effectiveNumDates, 'SPB');

          effectiveTargetDates.forEach((td, idx) => {
            // Determine hostCandidate from congregation family database if enabled
            const hostCandidate =
              syncWargaJemaatHosts && hostCandidatesList.length > 0
                ? shouldStopAtEndOfFamilies
                  ? hostCandidatesList[idx]
                  : (hostCandidatesList[idx % hostCandidatesList.length] || null)
                : null;

            let resolvedKategori = 'Umum / Hari Minggu';
            let resolvedSeksi = '';

            if (sourceCategory === 'Rayon / Lingkungan') {
              resolvedKategori = 'Rayon / Lingkungan';
              resolvedSeksi = '';
            } else if (sourceCategory === 'Kategorial') {
              resolvedKategori = 'Kategorial';
              resolvedSeksi = sourceSeksi !== 'semua' ? sourceSeksi : (seksiSeq[idx] || 'SPB');
            } else {
              resolvedKategori = 'Kategorial';
              resolvedSeksi = seksiSeq[idx] || 'SPB';
            }

            let resolvedRayon = '';
            let resolvedTuanRumah = trSeq[idx] || '';
            let resolvedTempat = tmpSeq[idx] || 'Gedung Gereja';

            if (resolvedKategori === 'Rayon / Lingkungan') {
              resolvedRayon = sourceRayon !== 'semua' ? sourceRayon : allRayons[idx % allRayons.length];
              if (syncWargaJemaatHosts && hostCandidate) {
                resolvedTuanRumah = hostCandidate.namaLengkap;
                if (hostCandidate.rayon) {
                  resolvedRayon = hostCandidate.rayon;
                }
                resolvedTempat = hostCandidate.alamat
                  ? `Rumah Kel. ${hostCandidate.namaLengkap}, ${hostCandidate.alamat}`
                  : `Rumah Kel. ${hostCandidate.namaLengkap} (${resolvedRayon || 'Rayon'})`;
              }
            } else if (resolvedKategori === 'Kategorial') {
              resolvedRayon = allRayons[idx % allRayons.length] || '';
              const isSPB = resolvedSeksi === 'SPB' || /spb|bapak|pria/i.test(resolvedSeksi);
              const isSPPer = resolvedSeksi === 'SPPer' || /spper|perempuan|wanita/i.test(resolvedSeksi);

              if (syncWargaJemaatHosts && hostCandidate) {
                resolvedTuanRumah = hostCandidate.namaLengkap;
                if (hostCandidate.rayon) {
                  resolvedRayon = hostCandidate.rayon;
                }
                resolvedTempat = hostCandidate.alamat
                  ? (isSPPer
                      ? `Rumah Kel. Ny. ${hostCandidate.namaLengkap}, ${hostCandidate.alamat}`
                      : `Rumah Kel. ${hostCandidate.namaLengkap}, ${hostCandidate.alamat}`)
                  : (isSPPer
                      ? `Rumah Kel. Ny. ${hostCandidate.namaLengkap}`
                      : `Rumah Kel. ${hostCandidate.namaLengkap}`);
              }
            }

            const resolvedNamaIbadah =
              namaIbadahOption === 'kustom' && kustomNamaIbadah.trim()
                ? kustomNamaIbadah.trim()
                : resolvedKategori === 'Rayon / Lingkungan'
                ? `Ibadah ${resolvedRayon || 'Rayon'}`
                : resolvedKategori === 'Kategorial'
                ? `Ibadah ${resolvedSeksi || 'Kategorial'}`
                : `Ibadah ${td.hariNama}`;

            const resolvedWaktu =
              overrideWaktu && defaultWaktu.trim() ? defaultWaktu.trim() : '17.00 WIB';

            // Liturgos Selection for acak_silang (Penatua & Diakon Majelis, bebas dari keluarga tuan rumah)
            let eligiblePool = liturgosAllPool;
            const isSPPer =
              resolvedSeksi === 'SPPer' || /spper|perempuan|wanita/i.test(resolvedNamaIbadah);
            const isSPB =
              resolvedSeksi === 'SPB' || /spb|bapak|pria/i.test(resolvedNamaIbadah);

            if (isSPPer && liturgosFemalePool.length > 0) {
              eligiblePool = liturgosFemalePool;
            } else if (isSPB && liturgosMalePool.length > 0) {
              eligiblePool = liturgosMalePool;
            } else {
              eligiblePool = liturgosAllPool;
            }

            let resolvedLiturgos = usePDForLiturgos && classifiedPenatuaDiakon.length > 0
              ? pickSmartLiturgos(
                  eligiblePool,
                  resolvedTuanRumah,
                  resolvedTempat,
                  lastAssignedLiturgos,
                  liturgosUsageMap,
                  rawWargaJemaatList,
                  hostCandidate
                )
              : liturgosPool[idx % liturgosPool.length] || 'Pnt. Majelis Jemaat';

            resolvedLiturgos = sanitizeOfficer(
              resolvedLiturgos,
              'Pnt. Majelis Jemaat',
              resolvedTuanRumah,
              resolvedTempat,
              hostCandidate
            );
            lastAssignedLiturgos = resolvedLiturgos;

            // Kolektan Selection (Diakon Majelis, bukan Liturgos, bukan keluarga tuan rumah)
            let resolvedKolektan = 'Dkn. Majelis Jemaat';
            if (diakonPool.length > 0) {
              resolvedKolektan = pickSmartKolektan(
                diakonPool,
                resolvedTuanRumah,
                resolvedTempat,
                resolvedLiturgos,
                kolektanUsageMap,
                rawWargaJemaatList,
                hostCandidate
              );
            } else {
              resolvedKolektan = sanitizeOfficer(
                kolSeq[idx],
                'Dkn. Majelis Jemaat',
                resolvedTuanRumah,
                resolvedTempat,
                hostCandidate
              );
            }

            // Proteksi Seluruh Petugas Ibadah
            const resolvedPelayanFirman = sanitizeOfficer(
              pfSeq[idx],
              'Pdt. Jemaat',
              resolvedTuanRumah,
              resolvedTempat,
              hostCandidate
            );

            const resolvedPemusik = sanitizeOfficer(
              musSeq[idx],
              'Organis Jemaat',
              resolvedTuanRumah,
              resolvedTempat,
              hostCandidate
            );

            const resolvedPemanduLagu = allAvailableSingers.length > 0
              ? pickSmartSinger({
                  singerPool: allAvailableSingers,
                  lastAssignedSinger,
                  recentSingers: recentSingersQueue,
                  resolvedLiturgos,
                  resolvedPelayanFirman,
                  resolvedPemusik,
                  resolvedKolektan,
                  resolvedTuanRumah,
                  resolvedTempat,
                  hostCandidate,
                  singerUsageMap,
                  preferDualSingers: singSeq[idx] ? (singSeq[idx].includes('&') || singSeq[idx].includes(',')) : false,
                })
              : '';
            lastAssignedSinger = resolvedPemanduLagu;
            if (resolvedPemanduLagu) {
              const singerPartsM2 = resolvedPemanduLagu.split(/(?:\s*&\s*|\s*,\s*|\s+dan\s+|\s*\/\s*|\s*\+\s*)/i);
              singerPartsM2.forEach((p) => {
                const tr = p.trim();
                if (tr) {
                  singerUsageMap.set(tr, (singerUsageMap.get(tr) || 0) + 1);
                  recentSingersQueue.push(tr);
                  if (recentSingersQueue.length > 8) recentSingersQueue.shift();
                }
              });
            }

            const resolvedPenerimaTamu = sanitizeOfficer(
              '',
              'Majelis Penerima Tamu',
              resolvedTuanRumah,
              resolvedTempat,
              hostCandidate
            );

            const resolvedPewartaBerita = sanitizeOfficer(
              '',
              'Pewarta Jemaat',
              resolvedTuanRumah,
              resolvedTempat,
              hostCandidate
            );

            const resolvedKoordinator = sanitizeOfficer(
              '',
              resolvedRayon ? `Koordinator ${resolvedRayon}` : 'Koordinator Pelayanan',
              resolvedTuanRumah,
              resolvedTempat,
              hostCandidate
            );

            newRows.push({
              tempId: `gen-${td.dateStr}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
              isSelected: true,
              tanggal: td.dateStr,
              hariNama: td.hariNama,
              waktu: resolvedWaktu,
              namaIbadah: resolvedNamaIbadah,
              kategoriIbadah: resolvedKategori,
              seksi: resolvedSeksi,
              rayon: resolvedRayon,
              pelayanFirman: resolvedPelayanFirman,
              pengkhotbah: resolvedPelayanFirman,
              natsKhotbah: natsSeq[idx] || '',
              liturgos: resolvedLiturgos,
              pemusik: resolvedPemusik,
              pemanduLagu: resolvedPemanduLagu,
              kolektan: resolvedKolektan,
              operatorMultimedia: 'Tim Multimedia',
              penerimaTamu: resolvedPenerimaTamu,
              pewartaBerita: resolvedPewartaBerita,
              koordinatorPelayanan: resolvedKoordinator,
              kuponUndian: '',
              pembacaanAlkitab: alkSeq[idx] || 'Alkitab',
              tempat: resolvedTempat,
              tuanRumah: resolvedTuanRumah,
              wartaKhusus: `Jadwal Acak Silang Tahun ${targetYear}`,
            });
          });
        }

        setGeneratedRows(newRows);
        setIsGenerating(false);
      } catch (err) {
        console.error('Generator error:', err);
        showToast.error('Terjadi kesalahan saat mengacak jadwal.');
        setIsGenerating(false);
      }
    }, 200);
  };

  // Quick swap liturgos for an individual row
  const handleQuickSwapLiturgos = (tempId: string) => {
    setGeneratedRows((prev) =>
      prev.map((r) => {
        if (r.tempId !== tempId) return r;
        const isSPPer = r.seksi === 'SPPer' || /spper|perempuan|wanita/i.test(r.namaIbadah);
        const isSPB = r.seksi === 'SPB' || /spb|bapak|pria/i.test(r.namaIbadah);

        let pool = liturgosAllPool;
        if (isSPPer && liturgosFemalePool.length > 0) pool = liturgosFemalePool;
        else if (isSPB && liturgosMalePool.length > 0) pool = liturgosMalePool;

        const nonHome = pool.filter(
          (p) =>
            p.displayName !== r.liturgos &&
            !checkIsFamilyMemberOfHost(p.displayName, r.tuanRumah || '', r.tempat, null, rawWargaJemaatList)
        );

        const candidates = nonHome.length > 0 ? nonHome : pool.filter((p) => p.displayName !== r.liturgos);
        const nextServant =
          candidates.length > 0 ? candidates[Math.floor(Math.random() * candidates.length)] : pool[0];

        return {
          ...r,
          liturgos: nextServant ? nextServant.displayName : r.liturgos,
        };
      })
    );
  };

  // Quick swap kolektan for an individual row (Diakon Majelis, beda dengan liturgos & bukan tuan rumah)
  const handleQuickSwapKolektan = (tempId: string) => {
    setGeneratedRows((prev) =>
      prev.map((r) => {
        if (r.tempId !== tempId) return r;
        const pool = diakonPool.length > 0 ? diakonPool : classifiedPenatuaDiakon;
        const nonHomeAndDiff = pool.filter(
          (p) =>
            p.displayName !== r.kolektan &&
            p.displayName !== r.liturgos &&
            !checkIsFamilyMemberOfHost(p.displayName, r.tuanRumah || '', r.tempat, null, rawWargaJemaatList)
        );
        const candidates =
          nonHomeAndDiff.length > 0 ? nonHomeAndDiff : pool.filter((p) => p.displayName !== r.liturgos);
        const nextServant =
          candidates.length > 0 ? candidates[Math.floor(Math.random() * candidates.length)] : pool[0];

        return {
          ...r,
          kolektan: nextServant ? nextServant.displayName : r.kolektan,
        };
      })
    );
  };

  // Quick swap singer for an individual row (orang berbeda, rotasi adil, bukan petugas lain)
  const handleQuickSwapSinger = (tempId: string) => {
    if (allAvailableSingers.length === 0) {
      showToast.info(
        'Belum ada data Singer Jemaat. Buka menu "Singer & Pemandu Lagu" untuk mendaftarkan singer.',
        'Data Singer Kosong'
      );
      return;
    }
    setGeneratedRows((prev) => {
      const idx = prev.findIndex((r) => r.tempId === tempId);
      if (idx === -1) return prev;
      const r = prev[idx];
      const prevRow = idx > 0 ? prev[idx - 1] : null;
      const nextRow = idx < prev.length - 1 ? prev[idx + 1] : null;

      const nextSinger = pickSmartSinger({
        singerPool: allAvailableSingers,
        lastAssignedSinger: prevRow?.pemanduLagu || '',
        avoidNextSinger: nextRow?.pemanduLagu || '',
        currentSinger: r.pemanduLagu,
        resolvedLiturgos: r.liturgos,
        resolvedPelayanFirman: r.pelayanFirman,
        resolvedPemusik: r.pemusik,
        resolvedKolektan: r.kolektan,
        resolvedTuanRumah: r.tuanRumah || '',
        resolvedTempat: r.tempat,
        hostCandidate: null,
        singerUsageMap: new Map(),
        preferDualSingers: r.pemanduLagu.includes('&') || r.pemanduLagu.includes(','),
      });

      return prev.map((item) => (item.tempId === tempId ? { ...item, pemanduLagu: nextSinger } : item));
    });
    showToast.success('Singer/Pemandu Lagu berhasil dirotasi ke petugas berbeda!', 'Singer Diperbarui');
  };

  // Auto-generate preview on first open if source pool exists
  useEffect(() => {
    if (isOpen && generatedRows.length === 0 && sourcePool.length > 0) {
      handleGenerateAndShuffle();
    }
  }, [isOpen]);

  // Handle uploaded Excel file for source data
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const isCsv = file.name.endsWith('.csv');
      const items: Omit<JadwalIbadah, 'id'>[] = [];

      if (isCsv) {
        Papa.parse(file, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            (results.data as any[]).forEach((row) => {
              const pf = row['Pelayan Firman'] || row['pelayanFirman'] || row['Pengkhotbah'] || row['pengkhotbah'] || '';
              if (pf || row['namaIbadah'] || row['Nama Ibadah']) {
                items.push({
                  tanggal: row['Tanggal'] || row['tanggal'] || '',
                  waktu: row['Waktu'] || row['waktu'] || '17.00 WIB',
                  namaIbadah: row['Nama Ibadah'] || row['namaIbadah'] || 'Ibadah Seksi',
                  kategoriIbadah: row['Kategori'] || row['kategoriIbadah'] || 'Kategorial',
                  seksi: row['Seksi'] || row['seksi'] || '',
                  rayon: row['Rayon'] || row['rayon'] || '',
                  tempat: row['Tempat'] || row['tempat'] || 'Gereja',
                  tuanRumah: row['Tuan Rumah'] || row['tuanRumah'] || '',
                  pelayanFirman: pf,
                  pengkhotbah: pf,
                  natsKhotbah: row['Nats'] || row['natsKhotbah'] || '',
                  liturgos: row['Liturgos'] || row['liturgos'] || '',
                  pemusik: row['Pemusik'] || row['pemusik'] || '',
                  pemanduLagu: row['Pemandu Lagu'] || row['pemanduLagu'] || row['Singer'] || '',
                  kolektan: row['Kolektan'] || row['kolektan'] || '',
                  pembacaanAlkitab: row['Pembacaan Alkitab'] || row['pembacaanAlkitab'] || '',
                });
              }
            });
            setUploadedSourceData(items);
            setUploadedFileName(file.name);
          },
        });
      } else {
        const buffer = await file.arrayBuffer();
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(buffer);
        const worksheet = workbook.worksheets[0];
        if (worksheet) {
          const headerMap: Record<string, number> = {};
          worksheet.getRow(1).eachCell((cell, colNum) => {
            const val = String(cell.value || '').trim().toLowerCase();
            headerMap[val] = colNum;
          });

          worksheet.eachRow((row, rowNumber) => {
            if (rowNumber === 1) return;
            const getVal = (possibleKeys: string[]) => {
              for (const k of possibleKeys) {
                const col = headerMap[k.toLowerCase()];
                if (col) {
                  const val = row.getCell(col).value;
                  if (val !== null && val !== undefined) return String(val).trim();
                }
              }
              return '';
            };

            const pf = getVal(['pelayan firman', 'pelayanfirman', 'pengkhotbah', 'khotbah']);
            const nama = getVal(['nama ibadah', 'namaibadah', 'kebaktian']);

            if (pf || nama) {
              items.push({
                tanggal: getVal(['tanggal', 'tgl']),
                waktu: getVal(['waktu', 'jam']) || '17.00 WIB',
                namaIbadah: nama || 'Ibadah Hari Sabtu',
                kategoriIbadah: getVal(['kategori', 'kategoriibadah']) || 'Kategorial',
                seksi: getVal(['seksi']) || '',
                rayon: getVal(['rayon', 'lingkungan']) || '',
                tempat: getVal(['tempat', 'lokasi']) || 'Gereja',
                tuanRumah: getVal(['tuan rumah', 'tuanrumah', 'keluarga']) || '',
                pelayanFirman: pf,
                pengkhotbah: pf,
                natsKhotbah: getVal(['nats', 'nats khotbah', 'natskhotbah']),
                liturgos: getVal(['liturgos', 'liturgis']),
                pemusik: getVal(['pemusik', 'organis']),
                pemanduLagu: getVal(['pemandu lagu', 'pemandulagu', 'singer', 'kantoria']),
                kolektan: getVal(['kolektan', 'persembahan']),
                pembacaanAlkitab: getVal(['pembacaan alkitab', 'alkitab']),
              });
            }
          });

          setUploadedSourceData(items);
          setUploadedFileName(file.name);
        }
      }
    } catch (err) {
      console.error('Failed reading file:', err);
      alert('Gagal membaca file Excel/CSV.');
    }
  };

  // Toggle selection
  const handleToggleSelect = (tempId: string) => {
    setGeneratedRows((prev) =>
      prev.map((r) => (r.tempId === tempId ? { ...r, isSelected: !r.isSelected } : r))
    );
  };

  const handleSelectAll = (select: boolean) => {
    setGeneratedRows((prev) => prev.map((r) => ({ ...r, isSelected: select })));
  };

  const handleDeleteRow = (tempId: string) => {
    setGeneratedRows((prev) => prev.filter((r) => r.tempId !== tempId));
  };

  // Filtered rows for preview table search
  const filteredPreviewRows = useMemo(() => {
    if (!previewSearch.trim()) return generatedRows;
    const s = previewSearch.toLowerCase();
    return generatedRows.filter(
      (r) =>
        r.tanggal.includes(s) ||
        r.namaIbadah.toLowerCase().includes(s) ||
        r.pelayanFirman.toLowerCase().includes(s) ||
        r.liturgos.toLowerCase().includes(s) ||
        r.pemusik.toLowerCase().includes(s) ||
        r.tempat.toLowerCase().includes(s) ||
        (r.tuanRumah && r.tuanRumah.toLowerCase().includes(s))
    );
  }, [generatedRows, previewSearch]);

  // Total selected
  const selectedRows = useMemo(() => {
    return generatedRows.filter((r) => r.isSelected);
  }, [generatedRows]);

  // Duplicate dates count
  const duplicateDatesInPreview = useMemo(() => {
    return selectedRows.filter((r) => existingTargetDatesSet.has(r.tanggal));
  }, [selectedRows, existingTargetDatesSet]);

  // Export preview to Excel
  const handleExportPreviewExcel = async () => {
    if (selectedRows.length === 0) {
      showToast.warning('Pilih minimal satu jadwal untuk diekspor.');
      return;
    }

    try {
      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'Sistem Informasi Majelis Jemaat GKE';
      const worksheet = workbook.addWorksheet(`Jadwal Ibadah ${targetYear}`);

      worksheet.columns = [
        { header: 'No', key: 'no', width: 6 },
        { header: 'Tanggal', key: 'tanggal', width: 14 },
        { header: 'Hari', key: 'hariNama', width: 12 },
        { header: 'Waktu', key: 'waktu', width: 12 },
        { header: 'Nama Ibadah', key: 'namaIbadah', width: 30 },
        { header: 'Kategori', key: 'kategoriIbadah', width: 18 },
        { header: 'Seksi', key: 'seksi', width: 12 },
        { header: 'Rayon / Lingkungan', key: 'rayon', width: 22 },
        { header: 'Tempat', key: 'tempat', width: 26 },
        { header: 'Tuan Rumah', key: 'tuanRumah', width: 24 },
        { header: 'Pelayan Firman', key: 'pelayanFirman', width: 28 },
        { header: 'Nats Khotbah', key: 'natsKhotbah', width: 24 },
        { header: 'Liturgos', key: 'liturgos', width: 24 },
        { header: 'Pemusik', key: 'pemusik', width: 22 },
        { header: 'Pemandu Lagu', key: 'pemanduLagu', width: 24 },
        { header: 'Pembacaan Alkitab', key: 'pembacaanAlkitab', width: 24 },
        { header: 'Kolektan', key: 'kolektan', width: 22 },
        { header: 'Catatan', key: 'wartaKhusus', width: 30 },
      ];

      // Header styling
      const headerRow = worksheet.getRow(1);
      headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF1E293B' }, // Slate 800
      };

      selectedRows.forEach((row, idx) => {
        worksheet.addRow({
          no: idx + 1,
          tanggal: row.tanggal,
          hariNama: row.hariNama,
          waktu: row.waktu,
          namaIbadah: row.namaIbadah,
          kategoriIbadah: row.kategoriIbadah,
          seksi: row.seksi || '',
          rayon: row.rayon || '',
          tempat: row.tempat,
          tuanRumah: row.tuanRumah || '',
          pelayanFirman: row.pelayanFirman,
          natsKhotbah: row.natsKhotbah || '',
          liturgos: row.liturgos,
          pemusik: row.pemusik,
          pemanduLagu: row.pemanduLagu,
          pembacaanAlkitab: row.pembacaanAlkitab,
          kolektan: row.kolektan,
          wartaKhusus: row.wartaKhusus || '',
        });
      });

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Jadwal_Ibadah_${targetYear}_${HARI_OPTIONS.find((h) => h.value === targetDayOfWeek)?.short || 'Hari'}_Jan_Nov.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
      showToast.success('File Excel jadwal ibadah berhasil diunduh!');
    } catch (err) {
      console.error('Export error:', err);
      showToast.error('Gagal mengekspor file Excel.');
    }
  };

  // State: In-app confirmation dialog for saving to database
  const [showSaveConfirmModal, setShowSaveConfirmModal] = useState<boolean>(false);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);
  const [saveDuplicateMode, setSaveDuplicateMode] = useState<'replace' | 'all' | 'skip'>('replace');

  // Triggered when clicking "Simpan Jadwal ke Database"
  const handleSaveToDatabase = () => {
    // If no row is selected, but generated rows exist, auto-select all
    if (selectedRows.length === 0) {
      if (generatedRows.length > 0) {
        setGeneratedRows((prev) => prev.map((r) => ({ ...r, isSelected: true })));
      } else {
        showToast.warning('Belum ada jadwal yang diacak. Klik "Generate & Acak Jadwal" terlebih dahulu.');
        return;
      }
    }

    setShowSaveConfirmModal(true);
  };

  // Execution of the batch save (no browser window.confirm!)
  const executeBatchSave = async (mode: 'replace' | 'all' | 'skip' = saveDuplicateMode) => {
    let baseRows = selectedRows.length > 0 ? selectedRows : generatedRows;
    let rowsToSave = baseRows;

    if (mode === 'skip' && duplicateDatesInPreview.length > 0) {
      rowsToSave = rowsToSave.filter((r) => !existingTargetDatesSet.has(r.tanggal));
    }

    if (rowsToSave.length === 0) {
      showToast.warning(
        'Tidak ada jadwal untuk disimpan (semua tanggal dilewati). Ubah pilihan ke "Timpa / Perbarui" atau "Simpan Semua".'
      );
      return;
    }

    setShowSaveConfirmModal(false);
    setIsSaving(true);
    setSaveProgress({ current: 0, total: rowsToSave.length });

    try {
      const itemsToSave: Omit<JadwalIbadah, 'id'>[] = rowsToSave.map((r) => ({
        tanggal: r.tanggal,
        waktu: r.waktu,
        namaIbadah: r.namaIbadah,
        kategoriIbadah: r.kategoriIbadah,
        seksi: r.seksi,
        rayon: r.rayon,
        pelayanFirman: r.pelayanFirman,
        pengkhotbah: r.pengkhotbah,
        natsKhotbah: r.natsKhotbah || '',
        liturgos: r.liturgos,
        pemusik: r.pemusik,
        pemanduLagu: r.pemanduLagu,
        kantoria: r.pemanduLagu,
        kolektan: r.kolektan,
        operatorMultimedia: r.operatorMultimedia || 'Tim Multimedia',
        penerimaTamu: r.penerimaTamu || '',
        pewartaBerita: r.pewartaBerita || '',
        pembacaanAlkitab: r.pembacaanAlkitab,
        tempat: r.tempat,
        tuanRumah: r.tuanRumah || '',
        wartaKhusus: r.wartaKhusus || `Jadwal Acak Otomatis Tahun ${targetYear}`,
      }));

      const totalSaved = await onBatchSave(itemsToSave, {
        replaceExistingDates: mode === 'replace',
      });
      setIsSaving(false);
      const savedCount = totalSaved || itemsToSave.length;
      setSaveSuccessMessage(`Berhasil menyimpan ${savedCount} jadwal ibadah tahun ${targetYear} ke database!`);

      setTimeout(() => {
        handleSafeClose();
      }, 1400);
    } catch (err: any) {
      console.error('Error saving batch schedules:', err);
      setIsSaving(false);
      showToast.error(err?.message || 'Terjadi kendala saat menyimpan jadwal.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/90 rounded-2xl w-full max-w-6xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-100">
                Generator &amp; Pengacak Jadwal Ibadah
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Acak dan distribusikan jadwal ibadah otomatis per tahun pelayanan (Januari - November) menggunakan data liturgi dan Kepengurusan Penatua &amp; Diakon.
              </p>
            </div>
          </div>

          <button
            onClick={handleSafeClose}
            disabled={isSaving}
            className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-xl transition cursor-pointer disabled:opacity-50"
            title="Tutup Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* Step 1: Configuration Parameters Card */}
          <div className="bg-slate-950/50 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2 border-b border-slate-800/80 pb-3">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-purple-400" />
                <h4 className="text-xs sm:text-sm font-bold text-slate-200 uppercase tracking-wider">
                  Parameter Jadwal &amp; Pengacakan
                </h4>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-400">Tahun Target Pelayanan:</span>
                <span className="font-mono font-bold text-xs text-purple-300 bg-purple-950/80 px-2.5 py-0.5 rounded-lg border border-purple-800/50">
                  {targetYear}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
              {/* Target Year Selector - Directly editable for any year going forward */}
              <div className="space-y-1.5">
                <label className="block text-slate-300 font-semibold flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-purple-400" />
                    <span>Tahun Target</span>
                  </span>
                  <span className="text-[10px] text-slate-400">Dapat diedit bebas</span>
                </label>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setTargetYear((prev) => Math.max(2020, prev - 1))}
                    className="px-2.5 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 rounded-xl font-bold transition cursor-pointer"
                    title="Kurangi 1 tahun"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min="2020"
                    max="2100"
                    value={targetYear}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      if (!isNaN(val)) setTargetYear(val);
                    }}
                    className="w-full text-center bg-slate-900 border border-slate-700 rounded-xl px-2 py-2 text-slate-100 font-mono font-bold text-sm focus:outline-none focus:border-purple-500"
                    placeholder="Contoh: 2027"
                    title="Ketik tahun target untuk pengacakan jadwal (misal: 2027, 2028, 2029, dst)"
                  />
                  <button
                    type="button"
                    onClick={() => setTargetYear((prev) => prev + 1)}
                    className="px-2.5 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 rounded-xl font-bold transition cursor-pointer"
                    title="Tambah 1 tahun"
                  >
                    +
                  </button>
                </div>
                <div className="flex items-center gap-1 overflow-x-auto pt-0.5 text-[10px]">
                  {[currentCalendarYear, currentCalendarYear + 1, currentCalendarYear + 2, currentCalendarYear + 3, currentCalendarYear + 4].map((yr) => (
                    <button
                      key={yr}
                      type="button"
                      onClick={() => setTargetYear(yr)}
                      className={`px-2 py-0.5 rounded font-mono transition cursor-pointer ${
                        targetYear === yr
                          ? 'bg-purple-600 text-white font-bold'
                          : 'bg-slate-900 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {yr}
                    </button>
                  ))}
                </div>
              </div>

              {/* Day of the Week (Hari) */}
              <div className="space-y-1.5">
                <label className="block text-slate-300 font-semibold flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-blue-400" />
                  <span>Hari Pelaksanaan</span>
                </label>
                <select
                  value={targetDayOfWeek}
                  onChange={(e) => setTargetDayOfWeek(parseInt(e.target.value, 10))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-bold focus:outline-none focus:border-purple-500"
                >
                  {HARI_OPTIONS.map((h) => (
                    <option key={h.value} value={h.value}>
                      {h.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Start Month */}
              <div className="space-y-1.5">
                <label className="block text-slate-300 font-semibold">Bulan Mulai</label>
                <select
                  value={startMonth}
                  onChange={(e) => setStartMonth(parseInt(e.target.value, 10))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-semibold focus:outline-none focus:border-purple-500"
                >
                  {BULAN_NAMES.slice(0, 11).map((b) => (
                    <option key={b.value} value={b.value}>
                      {b.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* End Month */}
              <div className="space-y-1.5">
                <label className="block text-slate-300 font-semibold">
                  Bulan Selesai <span className="text-[10px] text-purple-400 font-normal">(Efektif)</span>
                </label>
                <select
                  value={endMonth}
                  onChange={(e) => setEndMonth(parseInt(e.target.value, 10))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-semibold focus:outline-none focus:border-purple-500"
                >
                  {BULAN_NAMES.map((b) => (
                    <option key={b.value} value={b.value}>
                      {b.label} {b.value === 11 ? '(Default Rekomendasi)' : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Sub-parameters: Waktu, Mode Acak, Sumber Data Filter */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2 border-t border-slate-800/60 text-xs">
              {/* Default Waktu */}
              <div className="space-y-1.5">
                <label className="block text-slate-300 font-semibold">Waktu Ibadah Default</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={defaultWaktu}
                    onChange={(e) => setDefaultWaktu(e.target.value)}
                    placeholder="cth: 17.00 WIB"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-mono focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              {/* Mode Pengacakan */}
              <div className="space-y-1.5">
                <label className="block text-slate-300 font-semibold flex items-center gap-1.5">
                  <Shuffle className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Mode Pengacakan</span>
                </label>
                <select
                  value={shuffleMode}
                  onChange={(e) => setShuffleMode(e.target.value as any)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-medium focus:outline-none focus:border-purple-500"
                >
                  <option value="paket_utuh">Acak Paket Lengkap Utuh (Rekomendasi)</option>
                  <option value="acak_silang">Acak Silang Petugas (Kombinasi Dinamis)</option>
                </select>
              </div>

              {/* Filter Sumber Kategori */}
              <div className="space-y-1.5">
                <label className="block text-slate-300 font-semibold flex items-center gap-1.5">
                  <Filter className="w-3.5 h-3.5 text-amber-400" />
                  <span>Kategori Ibadah</span>
                </label>
                <select
                  value={sourceCategory}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSourceCategory(val);
                    if (val === 'Rayon / Lingkungan') {
                      setSourceSeksi('semua');
                    }
                  }}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-medium focus:outline-none focus:border-purple-500"
                >
                  <option value="semua">Semua Kategori ({existingJadwalList.length} total)</option>
                  <option value="Rayon / Lingkungan">Rayon / Lingkungan (Non-Kategorial)</option>
                  <option value="Kategorial">Kategorial (SPB, SPPer, SPPR/P, ASHM)</option>
                  <option value="Umum / Hari Minggu">Umum / Hari Minggu</option>
                  <option value="Sakramen / Khusus">Sakramen / Khusus</option>
                </select>
              </div>
            </div>

            {/* Dynamic Sub-filter according to Selected Category */}
            {sourceCategory === 'Rayon / Lingkungan' && (
              <div className="p-3 bg-emerald-950/25 border border-emerald-800/40 rounded-xl space-y-2.5 text-xs">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                      Kategori Mandiri (Non-Kategorial)
                    </span>
                    <span className="text-slate-300 font-medium">
                      Tuan Rumah dari <b>Data Kepala Keluarga</b> ({kepalaKeluargaList.length} Kepala Keluarga, {allRayons.length} Rayon)
                    </span>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer bg-slate-900/80 px-2.5 py-1 rounded-lg border border-slate-700 hover:border-emerald-500/50 transition">
                    <input
                      type="checkbox"
                      checked={syncWargaJemaatHosts}
                      onChange={(e) => setSyncWargaJemaatHosts(e.target.checked)}
                      className="rounded border-slate-700 bg-slate-800 text-emerald-500 focus:ring-0 cursor-pointer"
                    />
                    <span className="text-[11px] font-semibold text-slate-200">
                      Gunakan Kepala Keluarga sebagai Tuan Rumah
                    </span>
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-slate-400 text-[11px] mb-1 font-semibold">
                      Pilih Rayon Spesifik / Semua Rayon:
                    </label>
                    <select
                      value={sourceRayon}
                      onChange={(e) => setSourceRayon(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-100 font-medium"
                    >
                      <option value="semua">Semua Rayon Bergilir ({allRayons.length} Rayon)</option>
                      {allRayons.map((r) => (
                        <option key={r} value={r}>
                          {r} {kepalaKeluargaPerRayon[r] ? `(${kepalaKeluargaPerRayon[r].length} Kepala Keluarga)` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center text-[11px] text-emerald-300/80 bg-emerald-950/40 p-2 rounded-lg border border-emerald-800/30">
                    <p>
                      📌 <b>Aturan Rayon / Lingkungan:</b> Tuan rumah diisi dari data <b>Kepala Keluarga</b> sesuai rayon.
                      Liturgos terbuka bagi seluruh Penatua &amp; Diakon ({classifiedPenatuaDiakon.length} pelayan), otomatis dicegah bertugas di rumah sendiri.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {sourceCategory === 'Kategorial' && (
              <div className="p-3 bg-purple-950/25 border border-purple-800/40 rounded-xl space-y-2.5 text-xs">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40">
                      Kategori Kategorial
                    </span>
                    <span className="text-slate-300 font-medium">
                      Tuan Rumah: <b>Kepala Keluarga</b> (SPB) &amp; <b>Istri Keluarga</b> (SPPer)
                    </span>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer bg-slate-900/80 px-2.5 py-1 rounded-lg border border-slate-700 hover:border-purple-500/50 transition">
                    <input
                      type="checkbox"
                      checked={syncWargaJemaatHosts}
                      onChange={(e) => setSyncWargaJemaatHosts(e.target.checked)}
                      className="rounded border-slate-700 bg-slate-800 text-purple-500 focus:ring-0 cursor-pointer"
                    />
                    <span className="text-[11px] font-semibold text-slate-200">
                      Sinkron Tuan Rumah Warga Jemaat
                    </span>
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-slate-400 text-[11px] mb-1 font-semibold">
                      Pilih Seksi Kategorial:
                    </label>
                    <select
                      value={sourceSeksi}
                      onChange={(e) => setSourceSeksi(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-100 font-medium"
                    >
                      <option value="semua">Semua Seksi Kategorial</option>
                      <option value="SPB">SPB (Tuan Rumah: KK • Liturgos: Pnt/Dkn Laki-laki)</option>
                      <option value="SPPer">SPPer (Tuan Rumah: Istri • Liturgos: Pnt/Dkn Perempuan)</option>
                      <option value="SPPR">SPPR / Pemuda Remaja</option>
                      <option value="SPP">SPP / Anak Remaja</option>
                      <option value="ASHM">ASHM / Sekolah Minggu</option>
                    </select>
                  </div>
                  <div className="flex items-center text-[11px] text-purple-300/90 bg-purple-950/40 p-2 rounded-lg border border-purple-800/30">
                    <p>
                      👨 <b>SPB:</b> Tuan Rumah dari {kepalaKeluargaList.length} Kepala Keluarga • Liturgos {liturgosMalePool.length} Penatua/Diakon Laki-laki.
                      <br />
                      👩 <b>SPPer:</b> Tuan Rumah dari {istriKeluargaList.length} Istri Keluarga Jemaat • Liturgos {liturgosFemalePool.length} Penatua/Diakon Perempuan.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Sumber Data Liturgos: Terintegrasi dengan Penatua & Diakon */}
            <div className="bg-purple-950/30 border border-purple-800/40 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-purple-500/20 text-purple-300 border border-purple-500/30 shrink-0">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-slate-100">Sumber Liturgos: Data Kepengurusan Penatua &amp; Diakon</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      {liturgosPool.length} Pelayan Aktif Terdata
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-pink-500/20 text-pink-300 border border-pink-500/30">
                      👩 {liturgosFemalePool.length} Perempuan (SPPer)
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                      👨 {liturgosMalePool.length} Laki-laki (SPB)
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    🛡️ <b>Pencegahan Rumah Sendiri:</b> Petugas liturgos tidak akan ditugaskan di kediaman / keluarganya sendiri.
                  </p>
                </div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer bg-slate-900/80 px-3 py-1.5 rounded-lg border border-slate-700/80 hover:border-purple-500/50 transition">
                <input
                  type="checkbox"
                  checked={usePDForLiturgos}
                  onChange={(e) => setUsePDForLiturgos(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-800 text-purple-600 focus:ring-0 cursor-pointer"
                />
                <span className="text-xs font-semibold text-slate-200">Gunakan Data Penatua &amp; Diakon</span>
              </label>
            </div>

            {/* Proteksi Petugas Ibadah: Jangan Gunakan Kepala Keluarga & Anggota Keluarga Biasa */}
            <div className="bg-emerald-950/30 border border-emerald-800/40 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-slate-100">Proteksi Petugas Ibadah: Khusus Majelis / Petugas Terpilih</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      Aktif: KK &amp; Anggota Keluarga Bukan Petugas
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    🚫 <b>Aturan Baku Gereja:</b> Nama Kepala Keluarga dan Anggota Keluarga warga jemaat tidak dijadikan petugas (Liturgos, Kolektan, dsb) di jadwal ibadah, serta dilarang bertugas di rumah/keluarganya sendiri.
                  </p>
                </div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer bg-slate-900/80 px-3 py-1.5 rounded-lg border border-slate-700/80 hover:border-emerald-500/50 transition">
                <input
                  type="checkbox"
                  checked={excludeWargaFromPetugas}
                  onChange={(e) => setExcludeWargaFromPetugas(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-800 text-emerald-600 focus:ring-0 cursor-pointer"
                />
                <span className="text-xs font-semibold text-emerald-200">Kecualikan Warga/KK dari Petugas</span>
              </label>
            </div>

            {/* Aturan Berhenti & Urutan Tuan Rumah Keluarga Jemaat */}
            <div className="bg-slate-900/90 border border-slate-700/80 rounded-xl p-3.5 space-y-3 text-xs">
              <div className="flex items-start justify-between flex-wrap gap-2">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      Aturan Data Keluarga Warga Jemaat
                    </span>
                    <h5 className="font-bold text-slate-100 text-xs">
                      Batas Pengacakan Tuan Rumah (Tanpa Pengulangan)
                    </h5>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Pengacakan dihentikan tepat setelah data keluarga selesai dari awal hingga akhir data warga jemaat, tanpa mengulang lagi keluarga yang sudah terjadwal.
                  </p>
                </div>

                <label className="flex items-center gap-2 cursor-pointer bg-slate-950 px-3 py-1.5 rounded-lg border border-amber-600/40 hover:border-amber-500 transition">
                  <input
                    type="checkbox"
                    checked={stopWhenFamiliesCompleted}
                    onChange={(e) => setStopWhenFamiliesCompleted(e.target.checked)}
                    className="rounded border-slate-700 bg-slate-800 text-amber-500 focus:ring-0 cursor-pointer"
                  />
                  <span className="text-xs font-semibold text-amber-200">
                    Hentikan Setelah Data Keluarga Selesai (Tanpa Mengulang)
                  </span>
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-slate-800">
                <div>
                  <label className="block text-slate-400 text-[11px] mb-1 font-semibold">
                    Urutan Penjadwalan Tuan Rumah:
                  </label>
                  <select
                    value={familySequenceOrder}
                    onChange={(e) => setFamilySequenceOrder(e.target.value as 'by_lingkungan' | 'sequential' | 'shuffled')}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 font-medium focus:outline-none focus:border-amber-500"
                  >
                    <option value="by_lingkungan">
                      Urut Berdasarkan Lingkungan / Rayon (Lingkungan 1, 2, 3...)
                    </option>
                    <option value="sequential">
                      Urut dari Awal hingga Akhir Data Jemaat (Sesuai Urutan Asli)
                    </option>
                    <option value="shuffled">
                      Acak Urutan (1x per Keluarga, Tanpa Mengulang)
                    </option>
                  </select>
                </div>

                <div className="flex items-center gap-2 bg-slate-950/70 p-2.5 rounded-lg border border-slate-800 text-[11px] text-slate-300">
                  <Info className="w-4 h-4 text-amber-400 shrink-0" />
                  <div>
                    <span>Tersedia: </span>
                    <b className="text-amber-300 font-mono">{activeHostFamilyPool.length} Keluarga</b>
                    <span> • Estimasi Jadwal: </span>
                    <b className="text-emerald-300 font-mono">
                      {stopWhenFamiliesCompleted
                        ? `${Math.min(targetDates.length, activeHostFamilyPool.length)} Jadwal (Tuntas Tanpa Ulang)`
                        : `${targetDates.length} Jadwal (Melanjutkan Siklus)`}
                    </b>
                  </div>
                </div>
              </div>
            </div>

            {/* Pool Statistics & Upload alternative */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-1 rounded-lg bg-slate-900 text-slate-300 border border-slate-700 font-medium flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-purple-400" />
                  Pool Materi: <b className="text-purple-300">{sourcePool.length} Data Roster</b>
                </span>

                <span className="px-2.5 py-1 rounded-lg bg-slate-900 text-slate-300 border border-slate-700 font-medium flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-blue-400" />
                  Target Kalender: <b className="text-blue-300">{targetDates.length} Pekan</b>
                </span>

                {syncWargaJemaatHosts && (
                  <span className="px-2.5 py-1 rounded-lg bg-amber-950/40 text-amber-300 border border-amber-800/50 font-medium flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
                    Keluarga Terjadwal: <b className="text-amber-200">
                      {stopWhenFamiliesCompleted
                        ? `${Math.min(targetDates.length, activeHostFamilyPool.length)} / ${activeHostFamilyPool.length} (Tanpa Ulang)`
                        : `${activeHostFamilyPool.length} Keluarga`}
                    </b>
                  </span>
                )}

                <button
                  type="button"
                  onClick={() => {
                    handleSafeClose();
                    setActiveTab('singer_jemaat');
                  }}
                  className="px-2.5 py-1 rounded-lg bg-purple-950/40 hover:bg-purple-900/50 text-purple-300 border border-purple-800/50 font-medium flex items-center gap-1.5 transition cursor-pointer"
                  title="Klik untuk membuka Master Data Singer Jemaat"
                >
                  <Mic2 className="w-3.5 h-3.5 text-purple-400" />
                  Singer Jemaat:{' '}
                  <b className="text-purple-200">
                    {allAvailableSingers.length > 0 ? `${allAvailableSingers.length} Aktif` : 'Kosong (Biarkan Kosong)'}
                  </b>
                </button>

                {uploadedFileName && (
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-950/60 text-emerald-300 border border-emerald-800 text-[11px] flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    File Eksternal: {uploadedFileName}
                    <button
                      onClick={() => {
                        setUploadedSourceData(null);
                        setUploadedFileName(null);
                      }}
                      className="ml-1 text-slate-400 hover:text-rose-400"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                {/* Alternative File Upload for Source */}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept=".xlsx,.xls,.csv"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 transition cursor-pointer text-[11px]"
                  title="Gunakan file Excel atau CSV lain sebagai acuan pengacakan"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{uploadedFileName ? 'Ganti File Roster' : 'Gunakan File Roster Lain'}</span>
                </button>

                {/* Shuffle Button */}
                <button
                  type="button"
                  onClick={handleGenerateAndShuffle}
                  disabled={isGenerating || sourcePool.length === 0}
                  className="flex items-center gap-2 px-4 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-bold shadow-md shadow-purple-600/30 transition cursor-pointer disabled:opacity-50"
                >
                  {isGenerating ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Shuffle className="w-3.5 h-3.5" />
                  )}
                  <span>{generatedRows.length > 0 ? 'Acak Ulang (Re-shuffle)' : 'Generate & Acak'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Step 2: Generated Results & Interactive Preview Table */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <h4 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                  <span>Hasil Pengacakan Jadwal</span>
                  <span className="px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-purple-900/50 text-purple-300 border border-purple-700/50">
                    {generatedRows.length} Tanggal
                  </span>
                </h4>

                {duplicateDatesInPreview.length > 0 && (
                  <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-amber-950/60 border border-amber-800 text-amber-300 text-[11px]">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>{duplicateDatesInPreview.length} tanggal sudah ada di sistem</span>
                  </div>
                )}

                {syncWargaJemaatHosts && stopWhenFamiliesCompleted && generatedRows.length > 0 && (
                  <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-[11px] font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Tuntas sesuai data keluarga (1x per keluarga, tanpa mengulang)</span>
                  </div>
                )}
              </div>

              {/* Search & View Mode in preview */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={previewSearch}
                    onChange={(e) => setPreviewSearch(e.target.value)}
                    placeholder="Cari petugas/tempat..."
                    className="bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 w-36 sm:w-52 focus:outline-none focus:border-purple-500"
                  />
                  {previewSearch && (
                    <button
                      onClick={() => setPreviewSearch('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {/* View Mode Toggle: Table vs Cards */}
                <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl p-0.5">
                  <button
                    type="button"
                    onClick={() => setPreviewViewMode('table')}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                      previewViewMode === 'table'
                        ? 'bg-purple-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                    title="Tampilan Tabel Standar Modul"
                  >
                    <LayoutList className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Tabel</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewViewMode('cards')}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                      previewViewMode === 'cards'
                        ? 'bg-purple-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                    title="Tampilan Kartu Ringkas (Optimal untuk HP)"
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Kartu</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleExportPreviewExcel}
                  disabled={selectedRows.length === 0}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-semibold rounded-xl border border-cyan-500/30 transition cursor-pointer disabled:opacity-50"
                  title="Unduh jadwal hasil acakan ini ke file Excel"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Ekspor Excel</span>
                </button>
              </div>
            </div>

            {/* Content View: Table or Cards */}
            {previewViewMode === 'table' ? (
              <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-inner max-h-[440px] overflow-y-auto">
                <div className="overflow-x-auto w-full max-w-full">
                  <table className="w-full min-w-[900px] text-xs text-left text-slate-300 border-collapse">
                    <thead className="bg-slate-900/95 sticky top-0 z-10 border-b border-slate-800 text-slate-200 font-bold uppercase text-[10px] tracking-wider whitespace-nowrap">
                      <tr>
                        <th className="p-3.5 w-10 text-center">
                          <input
                            type="checkbox"
                            checked={generatedRows.length > 0 && selectedRows.length === generatedRows.length}
                            onChange={(e) => handleSelectAll(e.target.checked)}
                            className="rounded border-slate-700 bg-slate-800 text-purple-600 focus:ring-0 cursor-pointer"
                            title="Pilih Semua"
                          />
                        </th>
                        <th className="p-3.5 w-12 text-center">No</th>
                        <th className="p-3.5">Tgl &amp; Waktu</th>
                        <th className="p-3.5">Kategori &amp; Nama Ibadah</th>
                        <th className="p-3.5">Tempat &amp; Tuan Rumah</th>
                        <th className="p-3.5">Pelayan Firman, Liturgos &amp; Kolektan</th>
                        <th className="p-3.5">Pemusik &amp; Singer</th>
                        <th className="p-3.5 text-center w-20">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/80">
                      {filteredPreviewRows.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="p-8 text-center text-slate-500">
                            {generatedRows.length === 0 ? (
                              <div className="space-y-2">
                                <Info className="w-6 h-6 mx-auto text-slate-600" />
                                <p>Belum ada jadwal yang di-generate.</p>
                                <p className="text-[11px] text-slate-600">
                                  Klik tombol "Generate & Acak" di atas untuk mulai membuat jadwal tahun {targetYear}.
                                </p>
                              </div>
                            ) : (
                              'Tidak ada data yang cocok dengan pencarian.'
                            )}
                          </td>
                        </tr>
                      ) : (
                        filteredPreviewRows.map((row, idx) => {
                          const isDuplicate = existingTargetDatesSet.has(row.tanggal);
                          const isKategorial = row.kategoriIbadah === 'Kategorial' || !!row.seksi;
                          const isRayon = row.kategoriIbadah === 'Rayon / Lingkungan' || !!row.rayon;
                          const cleanTuanRumah = row.tuanRumah
                            ? row.tuanRumah.toLowerCase().startsWith('kel')
                              ? row.tuanRumah
                              : `Kel. ${row.tuanRumah}`
                            : '';

                          return (
                            <tr
                              key={`${row.tempId}-${idx}`}
                              className={`hover:bg-slate-900/60 transition ${
                                !row.isSelected
                                  ? 'opacity-40 bg-slate-950'
                                  : isDuplicate
                                  ? 'bg-amber-950/15'
                                  : ''
                              }`}
                            >
                              <td className="p-3.5 text-center">
                                <input
                                  type="checkbox"
                                  checked={row.isSelected}
                                  onChange={() => handleToggleSelect(row.tempId)}
                                  className="rounded border-slate-700 bg-slate-800 text-purple-600 focus:ring-0 cursor-pointer"
                                />
                              </td>
                              <td className="p-3.5 text-center font-mono text-slate-500">{idx + 1}</td>

                              {/* Tgl & Waktu */}
                              <td className="p-3.5 whitespace-nowrap font-medium">
                                <div className="font-bold text-slate-100">{row.tanggal}</div>
                                <div className="text-[10px] text-purple-400 font-bold">{row.hariNama}</div>
                                <div className="text-[11px] text-indigo-400 font-mono font-bold flex items-center gap-1 mt-0.5">
                                  <Clock className="w-3 h-3" />
                                  <span>{row.waktu}</span>
                                </div>
                                {isDuplicate && (
                                  <span className="inline-block mt-1 px-1.5 py-0.5 text-[9px] rounded bg-amber-900/60 text-amber-300 font-medium border border-amber-800/40">
                                    Ada di DB
                                  </span>
                                )}
                              </td>

                              {/* Kategori & Nama Ibadah */}
                              <td className="p-3.5">
                                <div className="flex flex-wrap items-center gap-1 mb-1">
                                  {isKategorial && (
                                    <span className="text-[10px] font-extrabold text-purple-300 bg-purple-950/80 px-2 py-0.5 rounded border border-purple-800/50">
                                      Kategorial {row.seksi ? `• ${row.seksi}` : ''}
                                    </span>
                                  )}
                                  {isRayon && (
                                    <span className="text-[10px] font-extrabold text-emerald-300 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800/50">
                                      Rayon {row.rayon ? `• ${row.rayon}` : ''}
                                    </span>
                                  )}
                                  {!isKategorial && !isRayon && (
                                    <span className="text-[10px] font-extrabold text-blue-300 bg-blue-950/80 px-2 py-0.5 rounded border border-blue-800/50">
                                      Umum / Minggu
                                    </span>
                                  )}
                                </div>
                                <div className="font-black text-slate-100 text-sm leading-snug">{row.namaIbadah}</div>
                                {row.natsKhotbah && (
                                  <div className="text-[10px] text-amber-300 mt-1 font-semibold flex items-center gap-1">
                                    <span className="bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-800/40">
                                      Nats: {row.natsKhotbah}
                                    </span>
                                  </div>
                                )}
                                {row.pembacaanAlkitab && !row.natsKhotbah && (
                                  <div className="text-[10px] text-indigo-300 mt-1 font-semibold">
                                    Bacaan: {row.pembacaanAlkitab}
                                  </div>
                                )}
                              </td>

                              {/* Tempat & Tuan Rumah (Format sama dengan Manajemen Jadwal Ibadah & Pelayan Firman) */}
                              <td className="p-3.5">
                                <div className="text-slate-300 font-medium flex items-center gap-1">
                                  <MapPin className="w-3 h-3 text-rose-400 shrink-0" />
                                  <span>{row.tempat || 'Gedung Gereja'}</span>
                                </div>
                                {cleanTuanRumah && (
                                  <div className="text-[10px] text-emerald-400 font-bold mt-1 pl-4">
                                    Tuan Rumah: {cleanTuanRumah}
                                  </div>
                                )}
                              </td>

                              {/* Pelayan Firman, Liturgos & Kolektan */}
                              <td className="p-3.5">
                                <div className="font-bold text-indigo-300">
                                  {row.pelayanFirman || row.pengkhotbah}
                                </div>
                                {row.liturgos && (
                                  <div className="flex items-center gap-1.5 mt-1">
                                    <div className="text-[11px] text-slate-400">
                                      Liturgos: <span className="text-slate-200 font-semibold">{row.liturgos}</span>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => handleQuickSwapLiturgos(row.tempId)}
                                      className="p-1 text-slate-500 hover:text-purple-300 hover:bg-slate-800 rounded transition cursor-pointer"
                                      title="Ganti liturgos ini (Majelis Jemaat & bukan keluarga tuan rumah)"
                                    >
                                      <Shuffle className="w-3 h-3" />
                                    </button>
                                  </div>
                                )}
                                {row.kolektan && (
                                  <div className="flex items-center gap-1.5 mt-0.5">
                                    <div className="text-[11px] text-slate-400">
                                      Kolektan: <span className="text-emerald-300 font-semibold">{row.kolektan}</span>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => handleQuickSwapKolektan(row.tempId)}
                                      className="p-1 text-slate-500 hover:text-emerald-300 hover:bg-slate-800 rounded transition cursor-pointer"
                                      title="Ganti kolektan ini (Diakon Majelis & bukan keluarga tuan rumah)"
                                    >
                                      <Shuffle className="w-3 h-3" />
                                    </button>
                                  </div>
                                )}
                              </td>

                              {/* Pemusik & Singer */}
                              <td className="p-3.5">
                                <div className="text-slate-300 font-medium flex items-center gap-1">
                                  <Music className="w-3 h-3 text-amber-400 shrink-0" />
                                  <span>{row.pemusik || '-'}</span>
                                </div>
                                {row.pemanduLagu && (
                                  <div className="flex items-center gap-1.5 mt-0.5">
                                    <div className="text-[10px] text-slate-400">
                                      Singer: <span className="text-purple-300 font-medium">{row.pemanduLagu}</span>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => handleQuickSwapSinger(row.tempId)}
                                      className="p-1 text-slate-500 hover:text-purple-300 hover:bg-slate-800 rounded transition cursor-pointer"
                                      title="Ganti singer ini (rotasi adil, orang berbeda & bukan petugas lain)"
                                    >
                                      <Shuffle className="w-3 h-3" />
                                    </button>
                                  </div>
                                )}
                              </td>

                              {/* Aksi */}
                              <td className="p-3.5 text-center whitespace-nowrap">
                                <div className="flex items-center justify-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => setEditingRow(row)}
                                    className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition cursor-pointer"
                                    title="Edit baris jadwal ini"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteRow(row.tempId)}
                                    className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 rounded-lg transition cursor-pointer"
                                    title="Hapus tanggal ini dari preview"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              /* Mobile Card View */
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3 max-h-[440px] overflow-y-auto space-y-3">
                {filteredPreviewRows.length === 0 ? (
                  <div className="p-8 text-center text-slate-500">
                    <Info className="w-6 h-6 mx-auto text-slate-600 mb-2" />
                    <p>Tidak ada data jadwal ditemukan.</p>
                  </div>
                ) : (
                  filteredPreviewRows.map((row, idx) => {
                    const isDuplicate = existingTargetDatesSet.has(row.tanggal);
                    const isKategorial = row.kategoriIbadah === 'Kategorial' || !!row.seksi;
                    const isRayon = row.kategoriIbadah === 'Rayon / Lingkungan' || !!row.rayon;
                    const cleanTuanRumah = row.tuanRumah
                      ? row.tuanRumah.toLowerCase().startsWith('kel')
                        ? row.tuanRumah
                        : `Kel. ${row.tuanRumah}`
                      : '';

                    return (
                      <div
                        key={`${row.tempId}-${idx}`}
                        className={`p-3 rounded-xl border transition ${
                          !row.isSelected
                            ? 'bg-slate-950/40 border-slate-800/50 opacity-40'
                            : isDuplicate
                            ? 'bg-amber-950/15 border-amber-800/40'
                            : 'bg-slate-900/80 border-slate-800'
                        }`}
                      >
                        {/* Header card: checkbox, no, tanggal, waktu, aksi */}
                        <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-800/60">
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={row.isSelected}
                              onChange={() => handleToggleSelect(row.tempId)}
                              className="rounded border-slate-700 bg-slate-800 text-purple-600 focus:ring-0 cursor-pointer"
                            />
                            <span className="font-mono text-slate-500 text-xs">#{idx + 1}</span>
                            <span className="font-bold text-slate-100 text-xs">{row.tanggal}</span>
                            <span className="text-[10px] font-bold text-purple-400">({row.hariNama})</span>
                            {isDuplicate && (
                              <span className="px-1.5 py-0.2 text-[9px] rounded bg-amber-900/60 text-amber-300 font-medium border border-amber-800/40">
                                Ada di DB
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-[11px] text-indigo-400 font-mono font-bold flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {row.waktu}
                            </span>
                            <button
                              type="button"
                              onClick={() => setEditingRow(row)}
                              className="p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded ml-1"
                              title="Edit"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteRow(row.tempId)}
                              className="p-1 text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 rounded"
                              title="Hapus"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Nama Ibadah */}
                        <div className="pt-2">
                          <div className="flex flex-wrap items-center gap-1 mb-1">
                            {isKategorial && (
                              <span className="text-[10px] font-extrabold text-purple-300 bg-purple-950/80 px-2 py-0.5 rounded border border-purple-800/50">
                                Kategorial {row.seksi ? `• ${row.seksi}` : ''}
                              </span>
                            )}
                            {isRayon && (
                              <span className="text-[10px] font-extrabold text-emerald-300 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800/50">
                                Rayon {row.rayon ? `• ${row.rayon}` : ''}
                              </span>
                            )}
                          </div>
                          <div className="font-bold text-slate-100 text-sm">{row.namaIbadah}</div>
                        </div>

                        {/* Tempat & Tuan Rumah (Format sama dengan Manajemen Jadwal Ibadah & Pelayan Firman) */}
                        <div className="mt-2 bg-slate-950/70 p-2 rounded-lg border border-slate-800/80">
                          <div className="text-slate-300 font-medium text-xs flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                            <span>{row.tempat || 'Gedung Gereja'}</span>
                          </div>
                          {cleanTuanRumah && (
                            <div className="text-[11px] text-emerald-400 font-bold mt-1 pl-5">
                              Tuan Rumah: {cleanTuanRumah}
                            </div>
                          )}
                        </div>

                        {/* Petugas */}
                        <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="text-slate-400 text-[10px] block">Pelayan Firman:</span>
                            <span className="font-bold text-indigo-300">{row.pelayanFirman}</span>
                            {row.liturgos && (
                              <div className="flex items-center gap-1 text-slate-400 text-[10px] mt-0.5">
                                <span>Liturgos: <span className="text-slate-200 font-semibold">{row.liturgos}</span></span>
                                <button
                                  type="button"
                                  onClick={() => handleQuickSwapLiturgos(row.tempId)}
                                  className="p-0.5 text-slate-500 hover:text-purple-300 transition cursor-pointer"
                                  title="Ganti liturgos"
                                >
                                  <Shuffle className="w-2.5 h-2.5" />
                                </button>
                              </div>
                            )}
                            {row.kolektan && (
                              <div className="flex items-center gap-1 text-slate-400 text-[10px] mt-0.5">
                                <span>Kolektan: <span className="text-emerald-300 font-semibold">{row.kolektan}</span></span>
                                <button
                                  type="button"
                                  onClick={() => handleQuickSwapKolektan(row.tempId)}
                                  className="p-0.5 text-slate-500 hover:text-emerald-300 transition cursor-pointer"
                                  title="Ganti kolektan"
                                >
                                  <Shuffle className="w-2.5 h-2.5" />
                                </button>
                              </div>
                            )}
                          </div>
                          <div>
                            <span className="text-slate-400 text-[10px] block">Pemusik &amp; Singer:</span>
                            <div className="text-slate-300 flex items-center gap-1">
                              <Music className="w-3 h-3 text-amber-400 shrink-0" />
                              <span>{row.pemusik || '-'}</span>
                            </div>
                            {row.pemanduLagu && (
                              <div className="flex items-center justify-between gap-1 text-slate-400 text-[10px] mt-0.5">
                                <span>Singer: <span className="text-purple-300 font-medium">{row.pemanduLagu}</span></span>
                                <button
                                  type="button"
                                  onClick={() => handleQuickSwapSinger(row.tempId)}
                                  className="p-0.5 text-slate-500 hover:text-purple-300 transition cursor-pointer"
                                  title="Ganti singer ini"
                                >
                                  <Shuffle className="w-2.5 h-2.5" />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* Selection & Duplicate info note */}
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400 px-1">
              <div>
                Terpilih <span className="font-bold text-purple-300">{selectedRows.length}</span> dari{' '}
                {generatedRows.length} tanggal ibadah.
              </div>

              {duplicateDatesInPreview.length > 0 && (
                <label className="flex items-center gap-2 cursor-pointer text-amber-300 font-medium">
                  <input
                    type="checkbox"
                    checked={skipExistingDates}
                    onChange={(e) => setSkipExistingDates(e.target.checked)}
                    className="rounded border-slate-700 bg-slate-800 text-amber-500 focus:ring-0"
                  />
                  <span>Lewati {duplicateDatesInPreview.length} tanggal yang sudah ada di database</span>
                </label>
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-950/80 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-slate-400 flex items-center gap-2">
            <Info className="w-4 h-4 text-purple-400" />
            <span>
              Jadwal akan disimpan ke database Majelis Jemaat dan langsung tersedia di sistem warta & cetak resmi.
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleSafeClose}
              disabled={isSaving}
              className="px-4 py-2 border border-slate-700 rounded-xl hover:bg-slate-800 font-semibold text-slate-300 text-xs transition cursor-pointer disabled:opacity-50"
            >
              Batal
            </button>

            <button
              type="button"
              onClick={handleSaveToDatabase}
              disabled={isSaving || generatedRows.length === 0}
              className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-purple-600/30 transition cursor-pointer disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Menyimpan ke Database...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 text-white" />
                  <span>
                    Simpan {selectedRows.length > 0 ? selectedRows.length : generatedRows.length} Jadwal ke Database
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Edit Single Row Modal */}
      {editingRow && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-purple-400" />
                <span>Sesuaikan Jadwal ({editingRow.tanggal})</span>
              </h4>
              <button
                onClick={() => setEditingRow(null)}
                className="text-slate-400 hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Nama Ibadah</label>
                <input
                  type="text"
                  value={editingRow.namaIbadah || ''}
                  onChange={(e) => setEditingRow({ ...editingRow, namaIbadah: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Waktu</label>
                  <input
                    type="text"
                    value={editingRow.waktu || ''}
                    onChange={(e) => setEditingRow({ ...editingRow, waktu: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Pelayan Firman</label>
                  <input
                    type="text"
                    value={editingRow.pelayanFirman || ''}
                    onChange={(e) =>
                      setEditingRow({
                        ...editingRow,
                        pelayanFirman: e.target.value,
                        pengkhotbah: e.target.value,
                      })
                    }
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-slate-300 font-semibold">Liturgos</label>
                    {liturgosPool.length > 0 && (
                      <span className="text-[10px] text-purple-400 font-medium">Dari Penatua &amp; Diakon</span>
                    )}
                  </div>
                  <input
                    type="text"
                    list="penatua-diakon-liturgos-list"
                    value={editingRow.liturgos || ''}
                    onChange={(e) => setEditingRow({ ...editingRow, liturgos: e.target.value })}
                    placeholder="Contoh: Pnt. John Doe, S.Th"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-purple-500"
                  />
                  <datalist id="penatua-diakon-liturgos-list">
                    {liturgosPool.map((p, pIdx) => (
                      <option key={`${p}-${pIdx}`} value={p} />
                    ))}
                  </datalist>
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Pemusik</label>
                  <input
                    type="text"
                    value={editingRow.pemusik || ''}
                    onChange={(e) => setEditingRow({ ...editingRow, pemusik: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Pemandu Lagu / Singer</label>
                  <input
                    type="text"
                    value={editingRow.pemanduLagu || ''}
                    onChange={(e) => setEditingRow({ ...editingRow, pemanduLagu: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Tempat (Gedung / Alamat)</label>
                  <input
                    type="text"
                    value={editingRow.tempat || ''}
                    onChange={(e) => setEditingRow({ ...editingRow, tempat: e.target.value })}
                    placeholder="Contoh: Gedung Gereja / Rumah Jemaat"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Tuan Rumah (Nama Keluarga)</label>
                  <input
                    type="text"
                    value={editingRow.tuanRumah || ''}
                    onChange={(e) => setEditingRow({ ...editingRow, tuanRumah: e.target.value })}
                    placeholder="Contoh: Norlin Cana / Kel. Bpk. John"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Nats Khotbah</label>
                  <input
                    type="text"
                    value={editingRow.natsKhotbah || ''}
                    onChange={(e) => setEditingRow({ ...editingRow, natsKhotbah: e.target.value })}
                    placeholder="Contoh: Mazmur 23:1-6"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setEditingRow(null)}
                className="px-3 py-1.5 border border-slate-700 rounded-xl hover:bg-slate-800 text-slate-300 font-semibold text-xs"
              >
                Tutup
              </button>
              <button
                type="button"
                onClick={() => {
                  setGeneratedRows((prev) =>
                    prev.map((r) => (r.tempId === editingRow.tempId ? editingRow : r))
                  );
                  setEditingRow(null);
                }}
                className="px-4 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-bold text-xs"
              >
                Terapkan Perubahan
              </button>
            </div>
          </div>
        </div>
      )}
      {/* In-App Confirmation Modal for Saving to Database */}
      {showSaveConfirmModal && (
        <div className="fixed inset-0 z-70 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-purple-500/40 rounded-2xl w-full max-w-md p-5 sm:p-6 space-y-4 shadow-2xl text-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-600/20 border border-purple-500/40 flex items-center justify-center text-purple-400 shrink-0">
                <Check className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-100">Konfirmasi Simpan Jadwal</h4>
                <p className="text-xs text-slate-400">Penyimpanan massal jadwal ibadah ke database</p>
              </div>
            </div>

            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 space-y-2.5 text-xs">
              <div className="flex items-center justify-between text-slate-300">
                <span>Tahun Sasaran:</span>
                <span className="font-bold text-purple-300 font-mono text-sm">{targetYear}</span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span>Total Jadwal Hasil Acak:</span>
                <span className="font-bold text-slate-100">
                  {selectedRows.length > 0 ? selectedRows.length : generatedRows.length} kegiatan ibadah
                </span>
              </div>

              {duplicateDatesInPreview.length > 0 && (
                <div className="p-3 rounded-xl bg-purple-950/30 border border-purple-800/40 space-y-2">
                  <div className="text-amber-300 text-xs font-semibold flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>Ditemukan {duplicateDatesInPreview.length} tanggal yang sudah memiliki jadwal di database:</span>
                  </div>

                  <div className="space-y-1.5 pt-1">
                    <label
                      className={`flex items-start gap-2 p-2 rounded-lg border cursor-pointer transition ${
                        saveDuplicateMode === 'replace'
                          ? 'bg-purple-900/40 border-purple-500 text-purple-200'
                          : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:bg-slate-800/60'
                      }`}
                    >
                      <input
                        type="radio"
                        name="saveDuplicateMode"
                        value="replace"
                        checked={saveDuplicateMode === 'replace'}
                        onChange={() => setSaveDuplicateMode('replace')}
                        className="mt-0.5 text-purple-600 focus:ring-purple-500"
                      />
                      <div className="text-[11px] leading-tight">
                        <strong className="text-white block font-semibold">Timpa / Perbarui Jadwal Lama (Rekomendasi)</strong>
                        <span>Jadwal acak baru akan menggantikan jadwal lama di tanggal yang sama agar tidak terjadi duplikasi.</span>
                      </div>
                    </label>

                    <label
                      className={`flex items-start gap-2 p-2 rounded-lg border cursor-pointer transition ${
                        saveDuplicateMode === 'all'
                          ? 'bg-purple-900/40 border-purple-500 text-purple-200'
                          : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:bg-slate-800/60'
                      }`}
                    >
                      <input
                        type="radio"
                        name="saveDuplicateMode"
                        value="all"
                        checked={saveDuplicateMode === 'all'}
                        onChange={() => setSaveDuplicateMode('all')}
                        className="mt-0.5 text-purple-600 focus:ring-purple-500"
                      />
                      <div className="text-[11px] leading-tight">
                        <strong className="text-white block font-semibold">Simpan Semua Sebagai Tambahan</strong>
                        <span>Tetap simpan semua jadwal hasil acak tanpa menghapus jadwal yang sudah ada sebelumnya.</span>
                      </div>
                    </label>

                    <label
                      className={`flex items-start gap-2 p-2 rounded-lg border cursor-pointer transition ${
                        saveDuplicateMode === 'skip'
                          ? 'bg-purple-900/40 border-purple-500 text-purple-200'
                          : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:bg-slate-800/60'
                      }`}
                    >
                      <input
                        type="radio"
                        name="saveDuplicateMode"
                        value="skip"
                        checked={saveDuplicateMode === 'skip'}
                        onChange={() => setSaveDuplicateMode('skip')}
                        className="mt-0.5 text-purple-600 focus:ring-purple-500"
                      />
                      <div className="text-[11px] leading-tight">
                        <strong className="text-white block font-semibold">Lewati Tanggal Duplikat</strong>
                        <span>
                          Hanya simpan jadwal di tanggal baru (sebanyak{' '}
                          {(selectedRows.length > 0 ? selectedRows.length : generatedRows.length) -
                            duplicateDatesInPreview.length}{' '}
                          jadwal).
                        </span>
                      </div>
                    </label>
                  </div>
                </div>
              )}

              <div className="text-[11px] text-slate-400 pt-1 border-t border-slate-800">
                Jadwal yang disimpan akan langsung tampil di menu Jadwal Ibadah, Pelayan Firman, Warta Jemaat, dan siap dicetak/diekspor.
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowSaveConfirmModal(false)}
                className="px-4 py-2 border border-slate-700 hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => executeBatchSave(saveDuplicateMode)}
                className="px-5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-purple-600/30 transition cursor-pointer flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Simpan Jadwal Sekarang</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Save Success Notice */}
      {saveSuccessMessage && (
        <div className="fixed inset-0 z-80 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-emerald-500/50 rounded-2xl w-full max-w-sm p-6 text-center space-y-3 shadow-2xl">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 mx-auto">
              <Check className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-slate-100">Berhasil Disimpan!</h4>
            <p className="text-xs text-slate-300 leading-relaxed">{saveSuccessMessage}</p>
          </div>
        </div>
      )}
    </div>
  );
};
