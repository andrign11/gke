import React, { useState, useMemo, useEffect } from 'react';
import {
  CreditCard,
  Search,
  Filter,
  Plus,
  Printer,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Clock,
  DollarSign,
  Users,
  ChevronDown,
  X,
  Sparkles,
  Receipt,
  ArrowRight,
  TrendingUp,
  Wallet,
  Settings,
  RefreshCw,
  Building,
  Check,
  Calendar,
  Eye,
  ExternalLink,
  ChevronRight,
  Trash2,
  Copy,
  Info,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { IuranKewajiban, IuranBulanDetail, WargaJemaat, KeuanganItem } from '../../types';
import { DeleteConfirmModal } from '../DeleteConfirmModal';

const NAMA_BULAN: { [key: number]: string } = {
  1: 'Januari',
  2: 'Februari',
  3: 'Maret',
  4: 'April',
  5: 'Mei',
  6: 'Juni',
  7: 'Juli',
  8: 'Agustus',
  9: 'September',
  10: 'Oktober',
  11: 'November',
  12: 'Desember',
};

const SINGKAT_BULAN: { [key: number]: string } = {
  1: 'Jan',
  2: 'Feb',
  3: 'Mar',
  4: 'Apr',
  5: 'Mei',
  6: 'Jun',
  7: 'Jul',
  8: 'Ags',
  9: 'Sep',
  10: 'Okt',
  11: 'Nov',
  12: 'Des',
};

export const IuranKewajibanModule: React.FC = () => {
  const {
    iuranKewajibanList,
    wargaJemaatList,
    keuanganList,
    bayarIuranKewajiban,
    batalBayarIuranKewajiban,
    deleteIuranKewajiban,
    updateSettings,
    settings,
    currentUser,
    setActiveTab,
    lingkunganList,
    openPrintReport,
  } = useApp();

  // State Filters
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedRayon, setSelectedRayon] = useState<string>('semua');
  const [selectedStatus, setSelectedStatus] = useState<'semua' | 'Lunas' | 'Sebagian' | 'Belum Bayar'>('semua');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<'matriks' | 'kartu' | 'buku_kas_feed'>('matriks');

  // Modal States
  const [isBayarModalOpen, setIsBayarModalOpen] = useState<boolean>(false);
  const [isKwitansiModalOpen, setIsKwitansiModalOpen] = useState<boolean>(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState<boolean>(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState<boolean>(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  // Selected for Kwitansi / Rincian
  const [selectedKwitansiData, setSelectedKwitansiData] = useState<{
    iuran: IuranKewajiban;
    bulanBayar: number[];
    nominalTotal: number;
    tanggalBayar: string;
    metode: string;
    noReferensi: string;
    petugas: string;
    catatan?: string;
  } | null>(null);

  // Form Bayar State
  const defaultNominal = settings.nominalIuranWajibPerBulan || 25000;
  const [bayarForm, setBayarForm] = useState<{
    noKjj: string;
    namaKepalaKeluarga: string;
    wargaId: string;
    rayon: string;
    tahun: number;
    selectedBulan: number[];
    nominalPerBulan: number;
    tanggalBayar: string;
    metodePembayaran: string;
    posKasTujuan: string;
    catatKeBukuKas: boolean;
    petugasPenerima: string;
    catatan: string;
  }>({
    noKjj: '',
    namaKepalaKeluarga: '',
    wargaId: '',
    rayon: '',
    tahun: selectedYear,
    selectedBulan: [],
    nominalPerBulan: defaultNominal,
    tanggalBayar: new Date().toISOString().split('T')[0],
    metodePembayaran: 'Tunai',
    posKasTujuan: settings.posKasIuranKewajiban || 'Kas Iuran Kewajiban',
    catatKeBukuKas: true,
    petugasPenerima: currentUser?.namaLengkap || 'Bendahara Jemaat',
    catatan: '',
  });

  // Settings Modal State
  const [nominalSettingInput, setNominalSettingInput] = useState<number>(defaultNominal);
  const [posKasSettingInput, setPosKasSettingInput] = useState<string>(settings.posKasIuranKewajiban || 'Kas Iuran Kewajiban');

  useEffect(() => {
    if (settings.nominalIuranWajibPerBulan !== undefined) {
      setNominalSettingInput(settings.nominalIuranWajibPerBulan);
    }
    if (settings.posKasIuranKewajiban) {
      setPosKasSettingInput(settings.posKasIuranKewajiban);
    }
  }, [settings.nominalIuranWajibPerBulan, settings.posKasIuranKewajiban]);

  // Distinct KK List from Database Warga Jemaat
  const kepalaKeluargaList = useMemo(() => {
    const map = new Map<string, { noKjj: string; namaKepalaKeluarga: string; rayon: string; wargaId: string; alamat?: string; noHp?: string }>();

    // 1. First add from registered Warga Jemaat (prioritize Kepala Keluarga)
    wargaJemaatList.forEach((w) => {
      const kjj = (w.noKjj || '').trim();
      if (!kjj) return;

      if (!map.has(kjj)) {
        map.set(kjj, {
          noKjj: kjj,
          namaKepalaKeluarga: w.hubunganKeluarga === 'Kepala Keluarga' ? w.namaLengkap : `Kel. ${w.namaLengkap}`,
          rayon: w.rayon || 'Rayon 1',
          wargaId: w.id,
          alamat: w.alamat,
          noHp: w.noHp,
        });
      } else if (w.hubunganKeluarga === 'Kepala Keluarga') {
        const existing = map.get(kjj)!;
        existing.namaKepalaKeluarga = w.namaLengkap;
        existing.wargaId = w.id;
        if (w.rayon) existing.rayon = w.rayon;
        if (w.alamat) existing.alamat = w.alamat;
        if (w.noHp) existing.noHp = w.noHp;
      }
    });

    // 2. Also ensure all existing Iuran records are included even if not in warga table
    iuranKewajibanList.forEach((ik) => {
      if (ik.noKjj && !map.has(ik.noKjj)) {
        map.set(ik.noKjj, {
          noKjj: ik.noKjj,
          namaKepalaKeluarga: ik.namaKepalaKeluarga,
          rayon: ik.rayon || 'Rayon 1',
          wargaId: ik.wargaId || '',
          alamat: ik.alamat,
          noHp: ik.noHp,
        });
      }
    });

    return Array.from(map.values()).sort((a, b) => a.namaKepalaKeluarga.localeCompare(b.namaKepalaKeluarga));
  }, [wargaJemaatList, iuranKewajibanList]);

  // Merge Warga KK with Iuran Kewajiban for the selected year
  const mergedIuranData = useMemo(() => {
    return kepalaKeluargaList.map((kk) => {
      const docId = `ikw-${selectedYear}-${kk.noKjj.replace(/[^A-Za-z0-9]/g, '_')}`;
      const record = iuranKewajibanList.find(
        (x) => x.id === docId || (x.tahun === selectedYear && x.noKjj === kk.noKjj)
      );

      const nominalPerBulan = record?.nominalPerBulan || defaultNominal;
      const bulanan: { [key: number]: IuranBulanDetail } = {};

      let totalBayar = 0;
      let countLunas = 0;

      for (let m = 1; m <= 12; m++) {
        const det = record?.iuranBulanan?.[m];
        if (det && det.lunas) {
          bulanan[m] = det;
          totalBayar += det.nominal || nominalPerBulan;
          countLunas++;
        } else {
          bulanan[m] = {
            lunas: false,
            nominal: nominalPerBulan,
          };
        }
      }

      const targetTahun = nominalPerBulan * 12;
      const sisaTunggakan = Math.max(0, targetTahun - totalBayar);
      const statusPembayaran: 'Lunas' | 'Sebagian' | 'Belum Bayar' =
        countLunas === 12 ? 'Lunas' : countLunas > 0 ? 'Sebagian' : 'Belum Bayar';

      const computedIuran: IuranKewajiban = {
        id: record?.id || docId,
        tahun: selectedYear,
        noKjj: kk.noKjj,
        namaKepalaKeluarga: kk.namaKepalaKeluarga,
        wargaId: kk.wargaId,
        rayon: kk.rayon || 'Rayon 1',
        alamat: kk.alamat,
        noHp: kk.noHp,
        nominalPerBulan: nominalPerBulan,
        iuranBulanan: bulanan,
        totalSetorTahun: totalBayar,
        targetTahun: targetTahun,
        sisaTunggakan: sisaTunggakan,
        statusPembayaran: statusPembayaran,
        updatedAt: record?.updatedAt,
      };

      return computedIuran;
    });
  }, [kepalaKeluargaList, iuranKewajibanList, selectedYear, defaultNominal]);

  // Filtered List
  const filteredList = useMemo(() => {
    return mergedIuranData.filter((item) => {
      // Filter Rayon
      if (selectedRayon !== 'semua' && item.rayon !== selectedRayon) {
        return false;
      }
      // Filter Status
      if (selectedStatus !== 'semua' && item.statusPembayaran !== selectedStatus) {
        return false;
      }
      // Filter Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = item.namaKepalaKeluarga.toLowerCase().includes(q);
        const matchKjj = item.noKjj.toLowerCase().includes(q);
        const matchRayon = item.rayon.toLowerCase().includes(q);
        const matchAlamat = (item.alamat || '').toLowerCase().includes(q);
        return matchName || matchKjj || matchRayon || matchAlamat;
      }
      return true;
    });
  }, [mergedIuranData, selectedRayon, selectedStatus, searchQuery]);

  // Summary Metrics
  const summary = useMemo(() => {
    const totalKK = mergedIuranData.length;
    let totalTerkumpul = 0;
    let totalTarget = 0;
    let lunasCount = 0;
    let sebagianCount = 0;
    let belumBayarCount = 0;

    mergedIuranData.forEach((item) => {
      totalTerkumpul += item.totalSetorTahun;
      totalTarget += item.targetTahun;
      if (item.statusPembayaran === 'Lunas') lunasCount++;
      else if (item.statusPembayaran === 'Sebagian') sebagianCount++;
      else belumBayarCount++;
    });

    const sisaTunggakan = Math.max(0, totalTarget - totalTerkumpul);
    const persentase = totalTarget > 0 ? Math.min(100, Math.round((totalTerkumpul / totalTarget) * 100)) : 0;

    return {
      totalKK,
      totalTerkumpul,
      totalTarget,
      sisaTunggakan,
      lunasCount,
      sebagianCount,
      belumBayarCount,
      persentase,
    };
  }, [mergedIuranData]);

  // Linked Transaksi Kas for Iuran Kewajiban Warga
  const iuranKasTransactions = useMemo(() => {
    return keuanganList
      .filter(
        (k) =>
          k.kategori === 'Iuran Kewajiban Warga' ||
          k.posKas === 'Kas Iuran Kewajiban' ||
          (k.keterangan || '').toLowerCase().includes('iuran kewajiban')
      )
      .sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime());
  }, [keuanganList]);

  // Distinct Rayon List
  const availableRayons = useMemo(() => {
    const set = new Set<string>();
    lingkunganList.forEach((l) => set.add(l.namaLingkungan));
    wargaJemaatList.forEach((w) => {
      if (w.rayon) set.add(w.rayon);
    });
    iuranKewajibanList.forEach((i) => {
      if (i.rayon) set.add(i.rayon);
    });
    return Array.from(set).sort();
  }, [lingkunganList, wargaJemaatList, iuranKewajibanList]);

  // Helper format rupiah
  const formatRp = (num: number) => {
    return `Rp ${Number(num || 0).toLocaleString('id-ID')}`;
  };

  // Open Bayar Modal for a Specific KK
  const handleOpenBayarModal = (targetIuran?: IuranKewajiban, preselectedMonth?: number) => {
    const kk = targetIuran
      ? {
          noKjj: targetIuran.noKjj,
          namaKepalaKeluarga: targetIuran.namaKepalaKeluarga,
          wargaId: targetIuran.wargaId || '',
          rayon: targetIuran.rayon,
        }
      : kepalaKeluargaList[0] || {
          noKjj: '',
          namaKepalaKeluarga: '',
          wargaId: '',
          rayon: 'Rayon 1',
        };

    const curRecord = targetIuran || mergedIuranData.find((x) => x.noKjj === kk.noKjj);
    const nominal = curRecord?.nominalPerBulan || defaultNominal;

    let initialBulan: number[] = [];
    if (preselectedMonth) {
      initialBulan = [preselectedMonth];
    } else if (curRecord) {
      // Preselect the first unpaid month
      for (let m = 1; m <= 12; m++) {
        if (!curRecord.iuranBulanan[m]?.lunas) {
          initialBulan = [m];
          break;
        }
      }
    }

    setBayarForm({
      noKjj: kk.noKjj,
      namaKepalaKeluarga: kk.namaKepalaKeluarga,
      wargaId: kk.wargaId,
      rayon: kk.rayon,
      tahun: selectedYear,
      selectedBulan: initialBulan,
      nominalPerBulan: nominal,
      tanggalBayar: new Date().toISOString().split('T')[0],
      metodePembayaran: 'Tunai',
      posKasTujuan: settings.posKasIuranKewajiban || 'Kas Iuran Kewajiban',
      catatKeBukuKas: true,
      petugasPenerima: currentUser?.namaLengkap || 'Bendahara Jemaat',
      catatan: '',
    });
    setIsBayarModalOpen(true);
  };

  // Handle KK change inside Bayar Modal
  const handleKKChangeInModal = (noKjj: string) => {
    const found = kepalaKeluargaList.find((k) => k.noKjj === noKjj);
    if (!found) return;

    const curRecord = mergedIuranData.find((x) => x.noKjj === noKjj);
    const nominal = curRecord?.nominalPerBulan || defaultNominal;

    // Pick first unpaid month
    const unpaid: number[] = [];
    for (let m = 1; m <= 12; m++) {
      if (!curRecord?.iuranBulanan[m]?.lunas) {
        unpaid.push(m);
      }
    }

    setBayarForm((prev) => ({
      ...prev,
      noKjj: found.noKjj,
      namaKepalaKeluarga: found.namaKepalaKeluarga,
      wargaId: found.wargaId,
      rayon: found.rayon,
      nominalPerBulan: nominal,
      selectedBulan: unpaid.length > 0 ? [unpaid[0]] : [],
    }));
  };

  // Toggle Month in Bayar Modal
  const handleToggleMonth = (month: number) => {
    setBayarForm((prev) => {
      const exists = prev.selectedBulan.includes(month);
      const updated = exists
        ? prev.selectedBulan.filter((m) => m !== month)
        : [...prev.selectedBulan, month].sort((a, b) => a - b);
      return { ...prev, selectedBulan: updated };
    });
  };

  // Select Quick Sets
  const handleSelectQuickMonths = (type: 'all' | 'semester1' | 'semester2' | 'unpaid') => {
    const curRecord = mergedIuranData.find((x) => x.noKjj === bayarForm.noKjj);
    if (type === 'all') {
      setBayarForm((prev) => ({ ...prev, selectedBulan: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] }));
    } else if (type === 'semester1') {
      setBayarForm((prev) => ({ ...prev, selectedBulan: [1, 2, 3, 4, 5, 6] }));
    } else if (type === 'semester2') {
      setBayarForm((prev) => ({ ...prev, selectedBulan: [7, 8, 9, 10, 11, 12] }));
    } else if (type === 'unpaid' && curRecord) {
      const unpaid: number[] = [];
      for (let m = 1; m <= 12; m++) {
        if (!curRecord.iuranBulanan[m]?.lunas) unpaid.push(m);
      }
      setBayarForm((prev) => ({ ...prev, selectedBulan: unpaid }));
    }
  };

  // Submit Payment
  const handleSubmitBayar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bayarForm.noKjj) {
      alert('Pilih Warga / Kepala Keluarga terlebih dahulu.');
      return;
    }
    if (bayarForm.selectedBulan.length === 0) {
      alert('Pilih minimal satu bulan yang akan dibayar.');
      return;
    }

    const res = await bayarIuranKewajiban({
      noKjj: bayarForm.noKjj,
      namaKepalaKeluarga: bayarForm.namaKepalaKeluarga,
      wargaId: bayarForm.wargaId,
      rayon: bayarForm.rayon,
      tahun: bayarForm.tahun,
      bulanList: bayarForm.selectedBulan,
      nominalPerBulan: Number(bayarForm.nominalPerBulan),
      tanggalBayar: bayarForm.tanggalBayar,
      metodePembayaran: bayarForm.metodePembayaran,
      posKasTujuan: bayarForm.posKasTujuan,
      catatKeBukuKas: bayarForm.catatKeBukuKas,
      petugasPenerima: bayarForm.petugasPenerima,
      catatan: bayarForm.catatan,
    });

    if (res.success) {
      setIsBayarModalOpen(false);

      // Auto setup kwitansi for immediate preview & print
      const targetIuran = mergedIuranData.find((x) => x.noKjj === bayarForm.noKjj);
      if (targetIuran) {
        setSelectedKwitansiData({
          iuran: {
            ...targetIuran,
            namaKepalaKeluarga: bayarForm.namaKepalaKeluarga,
            noKjj: bayarForm.noKjj,
          },
          bulanBayar: bayarForm.selectedBulan,
          nominalTotal: bayarForm.selectedBulan.length * bayarForm.nominalPerBulan,
          tanggalBayar: bayarForm.tanggalBayar,
          metode: bayarForm.metodePembayaran,
          noReferensi: res.noReferensi,
          petugas: bayarForm.petugasPenerima,
          catatan: bayarForm.catatan,
        });
        setIsKwitansiModalOpen(true);
      }
    }
  };

  // Open Kwitansi for existing record
  const handleOpenKwitansiExisting = (item: IuranKewajiban) => {
    // Find all paid months
    const paidMonths: number[] = [];
    let latestTanggal = new Date().toISOString().split('T')[0];
    let latestMetode = 'Tunai';
    let latestNoRef = `IKW-${item.tahun}-${item.noKjj.slice(0, 8)}`;
    let latestPetugas = currentUser?.namaLengkap || 'Bendahara Jemaat';
    let latestCatatan = '';

    for (let m = 1; m <= 12; m++) {
      const b = item.iuranBulanan[m];
      if (b && b.lunas) {
        paidMonths.push(m);
        if (b.tanggalBayar) latestTanggal = b.tanggalBayar;
        if (b.metodePembayaran) latestMetode = b.metodePembayaran;
        if (b.noReferensiKas) latestNoRef = b.noReferensiKas;
        if (b.petugasPenerima) latestPetugas = b.petugasPenerima;
        if (b.catatan) latestCatatan = b.catatan;
      }
    }

    if (paidMonths.length === 0) {
      alert('Warga Jemaat ini belum memiliki catatan pembayaran iuran yang lunas.');
      return;
    }

    setSelectedKwitansiData({
      iuran: item,
      bulanBayar: paidMonths,
      nominalTotal: item.totalSetorTahun,
      tanggalBayar: latestTanggal,
      metode: latestMetode,
      noReferensi: latestNoRef,
      petugas: latestPetugas,
      catatan: latestCatatan,
    });
    setIsKwitansiModalOpen(true);
  };

  // Handle Save Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateSettings({
      nominalIuranWajibPerBulan: Number(nominalSettingInput),
      posKasIuranKewajiban: posKasSettingInput,
    });
    setIsSettingsModalOpen(false);
  };

  // Export to Excel CSV
  const handleExportCSV = () => {
    const headers = [
      'No',
      'No. KJJ',
      'Nama Kepala Keluarga',
      'Rayon/Lingkungan',
      'Januari',
      'Februari',
      'Maret',
      'April',
      'Mei',
      'Juni',
      'Juli',
      'Agustus',
      'September',
      'Oktober',
      'November',
      'Desember',
      'Total Setor (Rp)',
      'Target Tahun (Rp)',
      'Sisa Tunggakan (Rp)',
      'Status Pembayaran',
    ];

    const rows = filteredList.map((item, idx) => {
      const monthCols = [];
      for (let m = 1; m <= 12; m++) {
        const b = item.iuranBulanan[m];
        monthCols.push(b && b.lunas ? `LUNAS (${formatRp(b.nominal)})` : 'BELUM');
      }

      return [
        idx + 1,
        `"${item.noKjj}"`,
        `"${item.namaKepalaKeluarga}"`,
        `"${item.rayon}"`,
        ...monthCols.map((c) => `"${c}"`),
        item.totalSetorTahun,
        item.targetTahun,
        item.sisaTunggakan,
        `"${item.statusPembayaran}"`,
      ];
    });

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Rekap_Iuran_Kewajiban_GKE_${selectedYear}_${selectedRayon}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Terbilang Rupiah Helper
  const terbilang = (n: number): string => {
    const bilangan = [
      '',
      'Satu',
      'Dua',
      'Tiga',
      'Empat',
      'Lima',
      'Enam',
      'Tujuh',
      'Delapan',
      'Sembilan',
      'Sepuluh',
      'Sebelas',
    ];
    if (n < 12) return bilangan[n];
    if (n < 20) return `${terbilang(n - 10)} Belas`;
    if (n < 100) return `${terbilang(Math.floor(n / 10))} Puluh ${terbilang(n % 10)}`.trim();
    if (n < 200) return `Seratus ${terbilang(n - 100)}`.trim();
    if (n < 1000) return `${terbilang(Math.floor(n / 100))} Ratus ${terbilang(n % 100)}`.trim();
    if (n < 2000) return `Seribu ${terbilang(n - 1000)}`.trim();
    if (n < 1000000) return `${terbilang(Math.floor(n / 1000))} Ribu ${terbilang(n % 1000)}`.trim();
    if (n < 1000000000) return `${terbilang(Math.floor(n / 1000000))} Juta ${terbilang(n % 1000000)}`.trim();
    return `${terbilang(Math.floor(n / 1000000000))} Miliar ${terbilang(n % 1000000000)}`.trim();
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/80 to-slate-900 border border-indigo-900/40 rounded-2xl p-4 sm:p-6 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 bg-indigo-600/20 border border-indigo-500/30 rounded-xl text-indigo-400">
                <CreditCard className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2 flex-wrap">
                  <span>Iuran Kewajiban Warga Jemaat</span>
                  <span className="text-xs font-mono font-bold px-3 py-0.5 rounded-full bg-indigo-100 text-indigo-900 border border-indigo-300 dark:bg-indigo-950/80 dark:border-indigo-700 dark:text-indigo-200 shadow-2xs whitespace-nowrap inline-flex items-center">
                    Januari - Desember {selectedYear}
                  </span>
                </h1>
                <p className="text-xs sm:text-sm text-slate-400">
                  Pembukuan matriks 12 bulan iuran wajib warga terintegrasi real-time dengan Buku Kas Jemaat GKE
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => handleOpenBayarModal()}
              className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Bayar Iuran Baru</span>
            </button>

            <button
              onClick={() =>
                openPrintReport({
                  reportType: 'iuran_kewajiban',
                  title: `Rekapitulasi Iuran Kewajiban Warga Jemaat Tahun ${selectedYear}`,
                  selectedYear: selectedYear,
                  selectedRayon: selectedRayon,
                })
              }
              className="px-3 py-2 rounded-xl bg-slate-800/90 hover:bg-slate-700/90 border border-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-indigo-400" />
              <span>Cetak Rekap Matriks</span>
            </button>

            <button
              onClick={handleExportCSV}
              className="px-3 py-2 rounded-xl bg-slate-800/90 hover:bg-slate-700/90 border border-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span>Ekspor CSV</span>
            </button>

            <button
              onClick={() => setActiveTab('keuangan')}
              className="px-3 py-2 rounded-xl bg-emerald-950/40 hover:bg-emerald-900/50 border border-emerald-800/50 text-emerald-300 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Wallet className="w-3.5 h-3.5 text-emerald-400" />
              <span>Buka Buku Kas Jemaat</span>
              <ArrowRight className="w-3 h-3 ml-0.5" />
            </button>

            <button
              onClick={() => {
                setNominalSettingInput(defaultNominal);
                setPosKasSettingInput(settings.posKasIuranKewajiban || 'Kas Iuran Kewajiban');
                setIsSettingsModalOpen(true);
              }}
              title="Pengaturan Nominal Default"
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 transition-colors cursor-pointer"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Card 1: Total Terkumpul */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Total Masuk Kas ({selectedYear})</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-black text-emerald-400 font-mono">
              {formatRp(summary.totalTerkumpul)}
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
            <span>Capaian Target:</span>
            <span className="font-bold text-emerald-400 font-mono">{summary.persentase}%</span>
          </div>
          <div className="mt-1.5 w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${summary.persentase}%` }}
            ></div>
          </div>
        </div>

        {/* Card 2: Target 1 Tahun */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Target Iuran 1 Tahun</span>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-xl sm:text-2xl font-black text-indigo-300 font-mono">
              {formatRp(summary.totalTarget)}
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Basis: {summary.totalKK} KK Terdata</span>
            <span className="font-mono text-slate-300">{formatRp(defaultNominal)}/bln</span>
          </div>
        </div>

        {/* Card 3: Sisa Tunggakan */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Sisa Tunggakan Belum Terbayar</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-xl sm:text-2xl font-black text-amber-400 font-mono">
              {formatRp(summary.sisaTunggakan)}
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between">
            <span>KK Belum Bayar:</span>
            <span className="font-bold text-amber-400 font-mono">{summary.belumBayarCount} KK</span>
          </div>
        </div>

        {/* Card 4: Kepatuhan KK */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Tingkat Kepatuhan Warga</span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <span className="text-xl sm:text-2xl font-black text-purple-300 font-mono">
              {summary.lunasCount} <span className="text-xs text-slate-400 font-sans font-normal">/ {summary.totalKK} KK Lunas</span>
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between">
            <span className="text-emerald-400 font-bold">{summary.lunasCount} Lunas 12 Bln</span>
            <span className="text-indigo-400 font-bold">{summary.sebagianCount} Berjalan</span>
          </div>
        </div>
      </div>

      {/* Filter & View Mode Controls */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 sm:p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-md">
        {/* Left: Filters */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Year Selector */}
          <div className="flex items-center gap-1.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 px-3 py-1.5 rounded-xl shadow-xs">
            <Calendar className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Tahun:</span>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="bg-transparent text-slate-900 dark:text-white font-mono font-bold text-xs focus:outline-none cursor-pointer"
            >
              {[2027, 2026, 2025, 2024, 2023, 2022].map((y) => (
                <option key={y} value={y} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                  {y}
                </option>
              ))}
            </select>
          </div>

          {/* Rayon Selector */}
          <div className="flex items-center gap-1.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 px-3 py-1.5 rounded-xl shadow-xs">
            <Building className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
            <select
              value={selectedRayon}
              onChange={(e) => setSelectedRayon(e.target.value)}
              className="bg-transparent text-slate-800 dark:text-slate-200 text-xs font-medium focus:outline-none cursor-pointer max-w-[180px] truncate"
            >
              <option key="semua-rayon" value="semua" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                Semua Rayon / Lingkungan
              </option>
              {availableRayons.map((r, idx) => (
                <option key={`rayon-${r}-${idx}`} value={r} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                  {r}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 px-3 py-1.5 rounded-xl shadow-xs">
            <Filter className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as any)}
              className="bg-transparent text-slate-800 dark:text-slate-200 text-xs font-medium focus:outline-none cursor-pointer"
            >
              <option value="semua" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                Semua Status Kepatuhan
              </option>
              <option value="Lunas" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                Lunas 12 Bulan (100%)
              </option>
              <option value="Sebagian" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                Sebagian (Sedang Berjalan)
              </option>
              <option value="Belum Bayar" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                Belum Bayar (Menunggak)
              </option>
            </select>
          </div>

          {/* Search Box */}
          <div className="relative min-w-[200px] flex-1">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari nama KK, No. KJJ, atau alamat..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500 shadow-xs"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Right: View Mode Toggle */}
        <div className="flex items-center bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-300 dark:border-slate-800 self-start md:self-auto shadow-xs">
          <button
            onClick={() => setViewMode('matriks')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              viewMode === 'matriks'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            Matriks Jan - Des
          </button>
          <button
            onClick={() => setViewMode('kartu')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              viewMode === 'kartu'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            Kartu Keluarga
          </button>
          <button
            onClick={() => setViewMode('buku_kas_feed')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
              viewMode === 'buku_kas_feed'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <span>Feed Kas Jemaat</span>
            <span className="px-1.5 py-0.2 bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 rounded-full text-[10px] font-mono font-bold">
              {iuranKasTransactions.length}
            </span>
          </button>
        </div>
      </div>

      {/* VIEW 1: MATRIKS TABLE 12 BULAN (JAN - DES) */}
      {viewMode === 'matriks' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden">
          <div className="p-3.5 bg-slate-50 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
              <span className="font-bold text-slate-800 dark:text-slate-200">Menampilkan:</span>
              <span className="font-black text-indigo-700 dark:text-indigo-400 font-mono text-sm">{filteredList.length} KK / Warga Jemaat</span>
              <span className="text-slate-400 dark:text-slate-500">•</span>
              <span className="text-slate-700 dark:text-slate-300 font-medium">Nominal Wajib: <strong className="text-slate-900 dark:text-slate-100 font-mono text-sm font-black">{formatRp(defaultNominal)}/bln</strong></span>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-700 dark:text-slate-300">
              <span className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200">
                <span className="w-3.5 h-3.5 rounded bg-emerald-600 text-white flex items-center justify-center text-[9px] font-black shadow-xs">✓</span> Lunas
              </span>
              <span className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200">
                <span className="w-3.5 h-3.5 rounded bg-slate-200 dark:bg-slate-800 border border-slate-400 dark:border-slate-600 flex items-center justify-center text-[10px] text-slate-600 dark:text-slate-400 font-bold">-</span> Belum Lunas
              </span>
            </div>
          </div>

          <div className="overflow-x-auto relative">
            <table className="w-full text-left text-xs border-collapse min-w-[1100px]">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-950 text-slate-800 dark:text-slate-200 font-bold border-b-2 border-slate-300 dark:border-slate-800">
                  <th className="p-3 w-12 text-center sticky left-0 z-30 bg-slate-100 dark:bg-slate-950 border-r border-slate-300 dark:border-slate-800">No</th>
                  <th className="p-3 min-w-[210px] sticky left-12 z-30 bg-slate-100 dark:bg-slate-950 border-r-2 border-slate-300 dark:border-slate-700 shadow-md">No. KJJ & Kepala Keluarga</th>
                  <th className="p-3 min-w-[120px]">Rayon</th>
                  {/* 12 Bulan Columns */}
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                    <th key={m} className="p-2 text-center w-14 border-x border-slate-200 dark:border-slate-800">
                      <span className="block text-[11px] font-bold text-slate-800 dark:text-slate-200">{SINGKAT_BULAN[m]}</span>
                    </th>
                  ))}
                  <th className="p-3 text-right min-w-[110px]">Terbayar</th>
                  <th className="p-3 text-right min-w-[100px]">Tunggakan</th>
                  <th className="p-3 text-center min-w-[100px]">Status</th>
                  <th className="p-3 text-center min-w-[110px]">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 font-sans">
                {filteredList.length === 0 ? (
                  <tr>
                    <td colSpan={18} className="p-12 text-center text-slate-500">
                      <div className="max-w-md mx-auto space-y-2">
                        <CreditCard className="w-8 h-8 text-slate-400 dark:text-slate-600 mx-auto" />
                        <p className="font-bold text-slate-700 dark:text-slate-400">Tidak ada data iuran kewajiban yang cocok</p>
                        <p className="text-xs text-slate-500 dark:text-slate-500">
                          Pastikan sudah ada data warga di modul Sensus Warga Jemaat atau ubah kata kunci filter pencarian.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredList.map((item, idx) => (
                    <tr key={item.id} className="hover:bg-indigo-50/40 dark:hover:bg-slate-800/40 transition-colors group">
                      <td className="p-3 text-center text-slate-700 dark:text-slate-400 font-mono text-xs font-bold sticky left-0 z-20 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800">
                        {idx + 1}
                      </td>
                      <td className="p-3 sticky left-12 z-20 bg-white dark:bg-slate-900 border-r-2 border-slate-300 dark:border-slate-700 shadow-md">
                        <div className="font-bold text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition-colors text-xs">
                          {item.namaKepalaKeluarga}
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                          <span className="font-semibold text-slate-700 dark:text-slate-300">{item.noKjj}</span>
                          {item.noHp && <span>• {item.noHp}</span>}
                        </div>
                      </td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-[11px] font-semibold">
                          {item.rayon}
                        </span>
                      </td>

                      {/* 12 Bulan Cells */}
                      {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => {
                        const bDetail = item.iuranBulanan[m];
                        const isLunas = bDetail && bDetail.lunas;

                        return (
                          <td
                            key={m}
                            className={`p-1.5 text-center border-x border-slate-200 dark:border-slate-800/40 ${
                              isLunas ? 'bg-emerald-50/70 dark:bg-emerald-950/20' : ''
                            }`}
                          >
                            <button
                              type="button"
                              onClick={() => {
                                if (isLunas) {
                                  // Open option to cancel or view receipt
                                  if (
                                    confirm(
                                      `Iuran ${item.namaKepalaKeluarga} bulan ${NAMA_BULAN[m]} ${selectedYear} sudah Lunas (${formatRp(
                                        bDetail.nominal
                                      )} pada ${bDetail.tanggalBayar || '-'}). Apakah ingin membatalkan status lunas bulan ini?`
                                    )
                                  ) {
                                    batalBayarIuranKewajiban(item.id, m);
                                  }
                                } else {
                                  handleOpenBayarModal(item, m);
                                }
                              }}
                              title={
                                isLunas
                                  ? `Lunas ${formatRp(bDetail.nominal)} (${bDetail.tanggalBayar || '-'}) - Klik untuk batalkan/opsi`
                                  : `Belum Lunas - Klik untuk bayar bulan ${NAMA_BULAN[m]}`
                              }
                              className={`w-full py-1.5 px-1 rounded-lg text-[10px] font-mono font-bold flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer ${
                                isLunas
                                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white border border-emerald-700 shadow-xs'
                                  : 'bg-slate-100 hover:bg-indigo-50 dark:bg-slate-950 dark:hover:bg-indigo-950/60 border border-slate-300 dark:border-slate-800 text-slate-700 dark:text-slate-400 hover:text-indigo-700 dark:hover:text-indigo-300 hover:border-indigo-400'
                              }`}
                            >
                              {isLunas ? (
                                <>
                                  <Check className="w-3.5 h-3.5 text-white stroke-[3]" />
                                  <span className="text-[9px] font-black tracking-wider text-white">LUNAS</span>
                                </>
                              ) : (
                                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">-</span>
                              )}
                            </button>
                          </td>
                        );
                      })}

                      {/* Total Terbayar */}
                      <td className="p-3 text-right">
                        <div className="font-black text-emerald-700 dark:text-emerald-400 font-mono text-xs">
                          {formatRp(item.totalSetorTahun)}
                        </div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">
                          {Object.values(item.iuranBulanan || {}).filter((x: any) => Boolean(x?.lunas)).length} / 12 Bulan
                        </div>
                      </td>

                      {/* Sisa Tunggakan */}
                      <td className="p-3 text-right">
                        <div
                          className={`font-black font-mono text-xs ${
                            item.sisaTunggakan > 0 ? 'text-amber-700 dark:text-amber-400' : 'text-slate-400 dark:text-slate-500'
                          }`}
                        >
                          {formatRp(item.sisaTunggakan)}
                        </div>
                      </td>

                      {/* Status Badge */}
                      <td className="p-3 text-center">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            item.statusPembayaran === 'Lunas'
                              ? 'bg-emerald-100 text-emerald-900 border border-emerald-400 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-700'
                              : item.statusPembayaran === 'Sebagian'
                              ? 'bg-indigo-100 text-indigo-900 border border-indigo-400 dark:bg-indigo-950 dark:text-indigo-300 dark:border-indigo-700'
                              : 'bg-rose-100 text-rose-900 border border-rose-400 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-800'
                          }`}
                        >
                          {item.statusPembayaran}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleOpenBayarModal(item)}
                            title="Bayar Iuran Bulan Ini / Multi-Bulan"
                            className="p-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white shadow-xs transition-colors cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                          </button>

                          {item.totalSetorTahun > 0 && (
                            <button
                              onClick={() => handleOpenKwitansiExisting(item)}
                              title="Cetak Kwitansi / Tanda Terima Resmi"
                              className="p-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs transition-colors cursor-pointer"
                            >
                              <Receipt className="w-3.5 h-3.5 stroke-[2.5]" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 2: KARTU KELUARGA */}
      {viewMode === 'kartu' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredList.map((item) => {
            const lunasMonthsCount = Object.values(item.iuranBulanan || {}).filter((x: any) => Boolean(x?.lunas)).length;
            const progress = Math.round((lunasMonthsCount / 12) * 100);

            return (
              <div
                key={item.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 rounded-2xl p-4 shadow-sm flex flex-col justify-between transition-all"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white text-sm">{item.namaKepalaKeluarga}</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-mono font-medium">No. KJJ: {item.noKjj}</p>
                    </div>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        item.statusPembayaran === 'Lunas'
                          ? 'bg-emerald-100 text-emerald-900 border border-emerald-400 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-700'
                          : item.statusPembayaran === 'Sebagian'
                          ? 'bg-indigo-100 text-indigo-900 border border-indigo-400 dark:bg-indigo-950 dark:text-indigo-300 dark:border-indigo-700'
                          : 'bg-rose-100 text-rose-900 border border-rose-400 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-800'
                      }`}
                    >
                      {item.statusPembayaran}
                    </span>
                  </div>

                  <div className="mt-2 text-xs text-slate-600 dark:text-slate-400 flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-[11px] font-semibold text-slate-800 dark:text-slate-300">{item.rayon}</span>
                    {item.noHp && <span>• {item.noHp}</span>}
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-3.5 space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-600 dark:text-slate-400 font-medium">Progres 12 Bulan:</span>
                      <span className="font-bold text-indigo-700 dark:text-indigo-400 font-mono">
                        {lunasMonthsCount} / 12 Bln ({progress}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-indigo-600 h-2 rounded-full"
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* 12 Month Grid */}
                  <div className="mt-3.5 grid grid-cols-6 gap-1">
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => {
                      const b = item.iuranBulanan[m];
                      const isLunas = b && b.lunas;
                      return (
                        <div
                          key={m}
                          className={`text-center py-1 rounded text-[10px] font-mono font-black border ${
                            isLunas
                              ? 'bg-emerald-600 text-white border-emerald-700 shadow-2xs'
                              : 'bg-slate-100 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-500 font-medium'
                          }`}
                        >
                          {SINGKAT_BULAN[m]}
                        </div>
                      );
                    })}
                  </div>

                  {/* Financial Overview */}
                  <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800/80 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-slate-500 dark:text-slate-400 block text-[10px] font-medium">Total Terbayar:</span>
                      <span className="font-black text-emerald-700 dark:text-emerald-400 font-mono text-sm">{formatRp(item.totalSetorTahun)}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-slate-500 dark:text-slate-400 block text-[10px] font-medium">Sisa Tunggakan:</span>
                      <span className={`font-black font-mono text-sm ${item.sisaTunggakan > 0 ? 'text-amber-700 dark:text-amber-400' : 'text-slate-400'}`}>{formatRp(item.sisaTunggakan)}</span>
                    </div>
                  </div>
                </div>

                {/* Footer Buttons */}
                <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2">
                  <button
                    onClick={() => handleOpenBayarModal(item)}
                    className="flex-1 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Bayar Iuran</span>
                  </button>

                  {item.totalSetorTahun > 0 && (
                    <button
                      onClick={() => handleOpenKwitansiExisting(item)}
                      title="Cetak Kwitansi"
                      className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
                    >
                      <Receipt className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* VIEW 3: FEED TRANSAKSI KAS JEMAAT TERINTEGRASI */}
      {viewMode === 'buku_kas_feed' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
          <div className="p-4 bg-slate-950/80 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-bold text-white text-sm flex items-center gap-2">
                <Wallet className="w-4 h-4 text-emerald-400" />
                <span>Transaksi Pemasukan Iuran Kewajiban di Buku Kas Jemaat</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Setiap pembayaran iuran secara otomatis tercatat sebagai transaksi pemasukan kas jemaat.
              </p>
            </div>
            <button
              onClick={() => setActiveTab('keuangan')}
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <span>Kelola Buku Kas Lengkap</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-950/60 text-slate-400 font-semibold border-b border-slate-800">
                  <th className="p-3 w-12 text-center">No</th>
                  <th className="p-3 min-w-[100px]">Tanggal</th>
                  <th className="p-3 min-w-[130px]">No. Referensi</th>
                  <th className="p-3 min-w-[130px]">Pos Kas</th>
                  <th className="p-3 min-w-[300px]">Keterangan Transaksi</th>
                  <th className="p-3 text-right min-w-[120px]">Nominal (Masuk)</th>
                  <th className="p-3 min-w-[120px]">Petugas Penerima</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {iuranKasTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-12 text-center text-slate-500">
                      Belum ada transaksi Iuran Kewajiban Warga yang tercatat di Buku Kas.
                    </td>
                  </tr>
                ) : (
                  iuranKasTransactions.map((tx, idx) => (
                    <tr key={tx.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-3 text-center text-slate-500 font-mono">{idx + 1}</td>
                      <td className="p-3 font-mono text-slate-300">{tx.tanggal}</td>
                      <td className="p-3 font-mono text-indigo-400 font-bold">{tx.noReferensi || '-'}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded-md bg-indigo-950 text-indigo-300 border border-indigo-800 text-[11px]">
                          {tx.posKas || 'Kas Iuran Kewajiban'}
                        </span>
                      </td>
                      <td className="p-3 text-slate-200 font-medium">{tx.keterangan}</td>
                      <td className="p-3 text-right font-mono font-black text-emerald-400">
                        {formatRp(tx.masuk || tx.jumlah || 0)}
                      </td>
                      <td className="p-3 text-slate-400">{tx.disetujuiOleh || 'Bendahara'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 1: PEMBAYARAN IURAN & INTEGRASI BUKU KAS           */}
      {/* ========================================================= */}
      {isBayarModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-4 sm:p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base sm:text-lg">Form Pembayaran Iuran Kewajiban</h3>
                  <p className="text-xs text-slate-400">Tahun Pembukuan {bayarForm.tahun}</p>
                </div>
              </div>
              <button
                onClick={() => setIsBayarModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitBayar} className="space-y-4 text-xs">
              {/* Pilih KK / Warga Jemaat */}
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Pilih Kartu Keluarga / Warga Jemaat *</label>
                <select
                  required
                  value={bayarForm.noKjj || ''}
                  onChange={(e) => handleKKChangeInModal(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 font-medium focus:outline-none focus:border-indigo-500 cursor-pointer"
                >
                  <option key="kk-placeholder" value="" disabled>
                    -- Pilih Kepala Keluarga / No. KJJ --
                  </option>
                  {kepalaKeluargaList.map((kk, idx) => (
                    <option key={`kk-opt-${kk.noKjj}-${idx}`} value={kk.noKjj} className="bg-slate-900 text-white">
                      {kk.namaKepalaKeluarga} (KJJ: {kk.noKjj}) - {kk.rayon}
                    </option>
                  ))}
                </select>
              </div>

              {/* Grid Data KK */}
              {bayarForm.noKjj && (
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px]">
                  <div>
                    <span className="text-slate-500 block">Kepala Keluarga:</span>
                    <span className="font-bold text-slate-200">{bayarForm.namaKepalaKeluarga}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">No. KJJ:</span>
                    <span className="font-mono text-indigo-400 font-bold">{bayarForm.noKjj}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Rayon / Lingkungan:</span>
                    <span className="text-slate-200">{bayarForm.rayon}</span>
                  </div>
                </div>
              )}

              {/* Selector Bulan Pembayaran (Jan - Des) */}
              <div className="space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-1">
                  <label className="font-semibold text-slate-300">Pilih Bulan Pembayaran (Januari s/d Desember) *</label>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleSelectQuickMonths('all')}
                      className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-indigo-300 rounded text-[10px] font-semibold transition-colors cursor-pointer"
                    >
                      Pilih 12 Bulan Penuh
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSelectQuickMonths('semester1')}
                      className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[10px] font-semibold transition-colors cursor-pointer"
                    >
                      Semester 1 (Jan-Jun)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSelectQuickMonths('semester2')}
                      className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[10px] font-semibold transition-colors cursor-pointer"
                    >
                      Semester 2 (Jul-Des)
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => {
                    const isSelected = bayarForm.selectedBulan.includes(m);
                    // Check if already paid in database
                    const curRecord = mergedIuranData.find((x) => x.noKjj === bayarForm.noKjj);
                    const isAlreadyPaid = curRecord?.iuranBulanan[m]?.lunas;

                    return (
                      <button
                        key={m}
                        type="button"
                        onClick={() => handleToggleMonth(m)}
                        className={`p-2.5 rounded-xl border text-center font-mono font-bold text-xs flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-indigo-600 text-white border-indigo-400 shadow-md shadow-indigo-600/30'
                            : isAlreadyPaid
                            ? 'bg-emerald-950/40 border-emerald-700/60 text-emerald-400'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                        }`}
                      >
                        <span>{NAMA_BULAN[m]}</span>
                        <span className="text-[9px] font-sans font-normal opacity-80">
                          {isSelected ? '✓ Terpilih' : isAlreadyPaid ? '(Sudah Lunas)' : 'Belum'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Rincian Nominal & Hitungan */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Nominal Iuran Per Bulan (Rp)</label>
                  <input
                    type="number"
                    required
                    min={1000}
                    step={1000}
                    value={bayarForm.nominalPerBulan ?? 0}
                    onChange={(e) => setBayarForm({ ...bayarForm, nominalPerBulan: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono font-bold focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Total Pembayaran Terhitung</label>
                  <div className="w-full p-2.5 rounded-xl bg-indigo-950/60 border border-indigo-800/80 text-emerald-400 font-mono font-black text-sm flex items-center justify-between">
                    <span>{formatRp(bayarForm.selectedBulan.length * bayarForm.nominalPerBulan)}</span>
                    <span className="text-xs text-indigo-300 font-sans font-normal">
                      ({bayarForm.selectedBulan.length} Bulan)
                    </span>
                  </div>
                </div>
              </div>

              {/* Tanggal, Metode, Pos Kas */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Tanggal Pembayaran *</label>
                  <input
                    type="date"
                    required
                    value={bayarForm.tanggalBayar || ''}
                    onChange={(e) => setBayarForm({ ...bayarForm, tanggalBayar: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Metode Pembayaran</label>
                  <select
                    value={bayarForm.metodePembayaran || 'Tunai'}
                    onChange={(e) => setBayarForm({ ...bayarForm, metodePembayaran: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="Tunai">Tunai / Langsung</option>
                    <option value="Transfer Bank">Transfer Bank Kas Jemaat</option>
                    <option value="QRIS">QRIS Dinamis</option>
                    <option value="GoPay / Digital">GoPay / Digital</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Pos Kas Tujuan (Buku Kas)</label>
                  <select
                    value={bayarForm.posKasTujuan || 'Kas Iuran Kewajiban'}
                    onChange={(e) => setBayarForm({ ...bayarForm, posKasTujuan: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="Kas Iuran Kewajiban">Kas Iuran Kewajiban</option>
                    <option value="Kas Umum">Kas Umum</option>
                    <option value="Kas Pembangunan">Kas Pembangunan</option>
                  </select>
                </div>
              </div>

              {/* Petugas & Catatan */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Petugas Penerima (Bendahara)</label>
                  <input
                    type="text"
                    value={bayarForm.petugasPenerima || ''}
                    onChange={(e) => setBayarForm({ ...bayarForm, petugasPenerima: e.target.value })}
                    placeholder="Nama Bendahara / Petugas Penerima"
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Catatan Tambahan (Opsional)</label>
                  <input
                    type="text"
                    value={bayarForm.catatan || ''}
                    onChange={(e) => setBayarForm({ ...bayarForm, catatan: e.target.value })}
                    placeholder="Misal: Titipan setor via Majelis Lingkungan"
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Integrasi Buku Kas Toggle */}
              <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-800/40 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Wallet className="w-4 h-4 text-emerald-400" />
                  <div>
                    <span className="font-bold text-emerald-300 block">Otomatis Terintegrasi ke Buku Kas Jemaat</span>
                    <span className="text-[10px] text-slate-400">
                      Mencatat transaksi pemasukan {formatRp(bayarForm.selectedBulan.length * bayarForm.nominalPerBulan)} pada {bayarForm.posKasTujuan}
                    </span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={bayarForm.catatKeBukuKas}
                  onChange={(e) => setBayarForm({ ...bayarForm, catatKeBukuKas: e.target.checked })}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 bg-slate-900 border-slate-700 cursor-pointer"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsBayarModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={bayarForm.selectedBulan.length === 0}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Simpan Pembayaran & Catat Kas</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 2: KWITANSI / TANDA TERIMA PEMBAYARAN RESMI        */}
      {/* ========================================================= */}
      {isKwitansiModalOpen && selectedKwitansiData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-4 sm:p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/30">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base sm:text-lg">Kwitansi Tanda Terima Iuran Kewajiban</h3>
                  <p className="text-xs text-slate-400">Bukti Pembayaran Sah & Terintegrasi Kas Gereja</p>
                </div>
              </div>
              <button
                onClick={() => setIsKwitansiModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Kwitansi Body (Printable Paper Style) */}
            <div
              id="kwitansi-iuran-paper"
              className="bg-white text-slate-900 p-6 sm:p-8 rounded-2xl border-2 border-slate-300 shadow-inner space-y-4 font-serif"
            >
              {/* Header Kop */}
              <div className="text-center border-b-2 border-slate-900 pb-3 space-y-0.5">
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-800">
                  {settings.headerKopLine1 || 'GEREJA KALIMANTAN EVANGELIS (GKE)'}
                </h4>
                <h3 className="font-black text-sm sm:text-base uppercase text-slate-950">
                  {settings.headerKopLine2 || 'MAJELIS JEMAAT GKE'} {settings.namaJemaat ? settings.namaJemaat.toUpperCase() : ''}
                </h3>
                <p className="text-[10px] text-slate-600 font-sans">
                  {settings.alamatGereja || 'Kalimantan'} • Telp: {settings.telepon || '-'}
                </p>
              </div>

              {/* Title & No */}
              <div className="flex items-center justify-between text-xs pt-1">
                <div>
                  <span className="font-black text-sm uppercase tracking-wider border-b border-slate-900 pb-0.5 font-sans">
                    TANDA TERIMA IURAN KEWAJIBAN WARGA
                  </span>
                </div>
                <div className="text-right font-mono text-[11px]">
                  <span>No. Ref: </span>
                  <strong className="text-slate-950">{selectedKwitansiData.noReferensi}</strong>
                </div>
              </div>

              {/* Content Rows */}
              <div className="text-xs space-y-2 font-sans pt-2">
                <div className="grid grid-cols-4 gap-2">
                  <span className="text-slate-600 font-semibold">Telah Terima Dari</span>
                  <span className="col-span-3 font-bold text-slate-950">
                    : {selectedKwitansiData.iuran.namaKepalaKeluarga} (No. KJJ: {selectedKwitansiData.iuran.noKjj})
                  </span>
                </div>

                <div className="grid grid-cols-4 gap-2">
                  <span className="text-slate-600 font-semibold">Rayon / Lingkungan</span>
                  <span className="col-span-3 text-slate-900">: {selectedKwitansiData.iuran.rayon}</span>
                </div>

                <div className="grid grid-cols-4 gap-2">
                  <span className="text-slate-600 font-semibold">Untuk Pembayaran</span>
                  <span className="col-span-3 text-slate-900">
                    : Iuran Wajib Warga Jemaat Tahun <strong>{selectedKwitansiData.iuran.tahun}</strong>
                    <br />
                    <span className="text-indigo-900 font-semibold">
                      Bulan: {selectedKwitansiData.bulanBayar.map((b) => NAMA_BULAN[b]).join(', ')} ({selectedKwitansiData.bulanBayar.length} Bulan)
                    </span>
                  </span>
                </div>

                <div className="grid grid-cols-4 gap-2">
                  <span className="text-slate-600 font-semibold">Uang Sejumlah</span>
                  <span className="col-span-3 font-bold italic text-slate-900 bg-slate-100 p-2 rounded border border-slate-200">
                    "{terbilang(selectedKwitansiData.nominalTotal)} Rupiah"
                  </span>
                </div>

                <div className="grid grid-cols-4 gap-2">
                  <span className="text-slate-600 font-semibold">Metode Pembayaran</span>
                  <span className="col-span-3 text-slate-900">: {selectedKwitansiData.metode}</span>
                </div>

                {selectedKwitansiData.catatan && (
                  <div className="grid grid-cols-4 gap-2">
                    <span className="text-slate-600 font-semibold">Catatan</span>
                    <span className="col-span-3 text-slate-700 italic">: {selectedKwitansiData.catatan}</span>
                  </div>
                )}
              </div>

              {/* Total & Signatures */}
              <div className="pt-4 border-t border-slate-300 flex flex-col sm:flex-row items-center justify-between gap-4 font-sans text-xs">
                <div className="bg-slate-100 border border-slate-300 p-2.5 rounded-xl text-center sm:text-left">
                  <span className="text-[10px] text-slate-500 block uppercase font-bold">JUMLAH PEMBAYARAN:</span>
                  <span className="text-lg font-black text-slate-950 font-mono">
                    {formatRp(selectedKwitansiData.nominalTotal)}
                  </span>
                </div>

                <div className="text-center text-xs space-y-1">
                  <span className="text-slate-600 block text-[11px]">
                    {settings.tempatDiterbitkan || 'Tempat'}, {selectedKwitansiData.tanggalBayar}
                  </span>
                  <span className="text-slate-700 block font-semibold">Petugas / Bendahara Jemaat,</span>
                  <div className="h-10"></div>
                  <span className="font-bold text-slate-950 underline block">
                    {selectedKwitansiData.petugas || settings.namaBendahara || 'Bendahara Jemaat'}
                  </span>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsKwitansiModalOpen(false)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition-colors cursor-pointer"
              >
                Tutup
              </button>
              <button
                type="button"
                onClick={() => {
                  window.print();
                }}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center gap-2 shadow-lg shadow-emerald-600/30 transition-all cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak Kwitansi Ini</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 3: PENGATURAN NOMINAL DEFAULT IURAN                */}
      {/* ========================================================= */}
      {isSettingsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-4 sm:p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-indigo-400" />
                <h3 className="font-bold text-white text-base">Pengaturan Iuran Kewajiban Warga</h3>
              </div>
              <button
                onClick={() => setIsSettingsModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Nominal Wajib Bulanan Default (Rp)
                </label>
                <input
                  type="number"
                  required
                  min={1000}
                  step={1000}
                  value={nominalSettingInput ?? 25000}
                  onChange={(e) => setNominalSettingInput(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono font-bold focus:outline-none focus:border-indigo-500"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Nilai acuan standar per Kartu Keluarga (Contoh: Rp 25.000 / Rp 50.000 per bulan)
                </span>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Pos Kas Default di Buku Kas
                </label>
                <select
                  value={posKasSettingInput || 'Kas Iuran Kewajiban'}
                  onChange={(e) => setPosKasSettingInput(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="Kas Iuran Kewajiban">Kas Iuran Kewajiban</option>
                  <option value="Kas Umum">Kas Umum</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsSettingsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold"
                >
                  Simpan Pengaturan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
