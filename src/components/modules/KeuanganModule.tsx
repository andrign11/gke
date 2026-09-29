import React, { useState, useEffect } from 'react';
import {
  ArrowDownCircle,
  ArrowUpCircle,
  Building2,
  Calendar,
  Coins,
  DollarSign,
  Edit2,
  Hammer,
  Plus,
  Printer,
  QrCode,
  Search,
  ShieldCheck,
  Smartphone,
  Trash2,
  X,
  CheckCircle2,
  XCircle,
  Clock,
  BarChart3,
  PieChart,
  TrendingUp,
  Table as TableIcon,
  LayoutGrid,
  CreditCard,
  ArrowRight,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { KeuanganItem } from '../../types';
import { QrisPersembahanModal } from '../QrisPersembahanModal';
import { DeleteConfirmModal } from '../DeleteConfirmModal';
import { KeuanganVisualisasi } from '../KeuanganVisualisasi';

// Helper date calculations
const getTodayStr = () => new Date().toISOString().split('T')[0];

const get7DaysAgoStr = () => {
  const d = new Date();
  d.setDate(d.getDate() - 7);
  return d.toISOString().split('T')[0];
};

const getStartOfMonthStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
};

const getEndOfMonthStr = () => {
  const d = new Date();
  const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
};

const getQuarterRangeStr = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = d.getMonth();
  let startMonth = 0;
  let endMonth = 2;
  if (month >= 3 && month <= 5) {
    startMonth = 3; endMonth = 5;
  } else if (month >= 6 && month <= 8) {
    startMonth = 6; endMonth = 8;
  } else if (month >= 9) {
    startMonth = 9; endMonth = 11;
  }
  const startDate = `${year}-${String(startMonth + 1).padStart(2, '0')}-01`;
  const lastDay = new Date(year, endMonth + 1, 0).getDate();
  const endDate = `${year}-${String(endMonth + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
  return { startDate, endDate };
};

export const KeuanganModule: React.FC = () => {
  const {
    keuanganList,
    addKeuanganItem,
    updateKeuanganItem,
    deleteKeuanganItem,
    openPrintReport,
    setActiveTab,
    currentUser,
    settings,
  } = useApp();

  const [activePosKas, setActivePosKas] = useState<string>('semua');
  const [mainViewMode, setMainViewMode] = useState<'visualisasi' | 'transaksi' | 'keduanya'>('keduanya');
  const [search, setSearch] = useState('');
  const [filterJenis, setFilterJenis] = useState<'semua' | 'pemasukan' | 'pengeluaran'>('semua');
  const [filterKategori, setFilterKategori] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isQrisModalOpen, setIsQrisModalOpen] = useState(false);
  const [isSaldoAwalModalOpen, setIsSaldoAwalModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<KeuanganItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<KeuanganItem | null>(null);

  const { updateSettings } = useApp();

  const [saldoAwalForm, setSaldoAwalForm] = useState({
    saldoAwalCustomKasUmum: settings.saldoAwalCustomKasUmum || 0,
    saldoAwalCustomKasPembangunan: settings.saldoAwalCustomKasPembangunan || 0,
    saldoAwalCustomKasDiakonia: settings.saldoAwalCustomKasDiakonia || 0,
    saldoAwalCustomKasSpper: settings.saldoAwalCustomKasSpper || 0,
    saldoAwalCustomKasSpb: settings.saldoAwalCustomKasSpb || 0,
    saldoAwalCustomKasSpprp: settings.saldoAwalCustomKasSpprp || 0,
    saldoAwalCustomKasSpa: settings.saldoAwalCustomKasSpa || 0,
  });

  useEffect(() => {
    setSaldoAwalForm({
      saldoAwalCustomKasUmum: settings.saldoAwalCustomKasUmum || 0,
      saldoAwalCustomKasPembangunan: settings.saldoAwalCustomKasPembangunan || 0,
      saldoAwalCustomKasDiakonia: settings.saldoAwalCustomKasDiakonia || 0,
      saldoAwalCustomKasSpper: settings.saldoAwalCustomKasSpper || 0,
      saldoAwalCustomKasSpb: settings.saldoAwalCustomKasSpb || 0,
      saldoAwalCustomKasSpprp: settings.saldoAwalCustomKasSpprp || 0,
      saldoAwalCustomKasSpa: settings.saldoAwalCustomKasSpa || 0,
    });
  }, [settings]);

  // States for printing custom ranges & years
  const [printStartDate, setPrintStartDate] = useState(getStartOfMonthStr());
  const [printEndDate, setPrintEndDate] = useState(getTodayStr());
  const [printTahun, setPrintTahun] = useState(new Date().getFullYear().toString());

  const availableYears = Array.from(
    new Set([
      ...keuanganList.map((k) => k.tanggal.split('-')[0]),
      new Date().getFullYear().toString(),
      (new Date().getFullYear() - 1).toString(),
      (new Date().getFullYear() - 2).toString(),
    ])
  ).sort((a, b) => b.localeCompare(a));

  const canEdit =
    currentUser.role === 'admin' || currentUser.role === 'bendahara';

  const categories = [
    'Persembahan Minggu',
    'Persembahan Perpuluhan',
    'Ucapan Syukur',
    'Pembangunan & Renovasi',
    'Sumbangan Donatur Pembangunan',
    'Janji Iman Pembangunan',
    'Bahan Bangunan & Material',
    'Upah Tukang & Pekerja',
    'Kupon Pembangunan/Bazar',
    'Diakonia & Duka',
    'Iuran Kewajiban Warga',
    'Iuran Pembangunan Warga',
    'Persembahan SPPer (Perempuan)',
    'Persembahan SPB (Bapak)',
    'Persembahan SPPR/P (Pemuda/i)',
    'Persembahan ASHM (Sekolah Minggu)',
    'Persembahan Kebaktian Lingkungan',
    'Beban Operasional & Listrik/Air',
    'Honorarium Pelayan Firman',
    'Pemeliharaan Aset',
    'Lain-lain',
  ] as const;

  const posKasOptions = [
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
  ] as const;

  const [formData, setFormData] = useState<Omit<KeuanganItem, 'id'>>({
    tanggal: new Date().toISOString().split('T')[0],
    jenis: 'pemasukan',
    posKas: 'Kas Umum',
    kategori: 'Persembahan Minggu',
    jumlah: 0,
    keterangan: '',
    noReferensi: `MKK-${new Date().getFullYear()}${String(
      new Date().getMonth() + 1
    ).padStart(2, '0')}-${String(Math.floor(Math.random() * 900) + 100)}`,
    disetujuiOleh: settings.namaBendahara,
  });

  const handleOpenAdd = () => {
    setEditingItem(null);
    const targetPos = (activePosKas !== 'semua' ? activePosKas : 'Kas Umum') as KeuanganItem['posKas'];
    
    let targetKategori: KeuanganItem['kategori'] = 'Persembahan Minggu';
    if (targetPos === 'Kas Pembangunan') targetKategori = 'Pembangunan & Renovasi';
    else if (targetPos === 'Kas Kupon') targetKategori = 'Kupon Pembangunan/Bazar';
    else if (targetPos === 'Kas Diakonia') targetKategori = 'Diakonia & Duka';
    else if (targetPos === 'Kas Iuran Kewajiban') targetKategori = 'Iuran Kewajiban Warga';
    else if (targetPos === 'Kas Iuran Pembangunan') targetKategori = 'Iuran Pembangunan Warga';
    else if (targetPos === 'Kas SPPer') targetKategori = 'Persembahan SPPer (Perempuan)';
    else if (targetPos === 'Kas SPB') targetKategori = 'Persembahan SPB (Bapak)';
    else if (targetPos === 'Kas SPPR/P') targetKategori = 'Persembahan SPPR/P (Pemuda/i)';
    else if (targetPos === 'Kas Anak Sekolah Hari Minggu') targetKategori = 'Persembahan ASHM (Sekolah Minggu)';

    const prefix = settings.prefixKasKeuangan || 'MKK';
    setFormData({
      tanggal: new Date().toISOString().split('T')[0],
      jenis: 'pemasukan',
      posKas: targetPos,
      kategori: targetKategori,
      jumlah: 0,
      keterangan: '',
      noReferensi: `${prefix}-${new Date().getFullYear()}${String(
        new Date().getMonth() + 1
      ).padStart(2, '0')}-${String(Math.floor(Math.random() * 900) + 100)}`,
      disetujuiOleh: settings.namaBendahara,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: KeuanganItem) => {
    setEditingItem(item);
    setFormData({
      tanggal: item.tanggal,
      jenis: item.jenis,
      posKas: item.posKas || 'Kas Umum',
      kategori: item.kategori,
      jumlah: item.jumlah,
      keterangan: item.keterangan,
      noReferensi: item.noReferensi,
      disetujuiOleh: item.disetujuiOleh || settings.namaBendahara,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingItem) {
      updateKeuanganItem(editingItem.id, formData);
    } else {
      addKeuanganItem(formData);
    }
    setIsModalOpen(false);
  };

  const filteredList = keuanganList.filter((item) => {
    const itemPos = item.posKas || 'Kas Umum';
    const matchesPos = activePosKas === 'semua' || itemPos === activePosKas;
    const matchesSearch =
      (item.keterangan || '').toLowerCase().includes(search.toLowerCase()) ||
      (item.noReferensi || '').toLowerCase().includes(search.toLowerCase());
    const matchesJenis = filterJenis === 'semua' || item.jenis === filterJenis;
    const matchesKategori = !filterKategori || item.kategori === filterKategori;
    const isApprovedOrRegular = item.status !== 'pending' && item.status !== 'ditolak';
    return matchesPos && matchesSearch && matchesJenis && matchesKategori && isApprovedOrRegular;
  });

  const pendingItemsCount = keuanganList.filter((k) => k.status === 'pending').length;

  const totalPemasukan = filteredList
    .filter((k) => k.jenis === 'pemasukan' && k.status !== 'pending' && k.status !== 'ditolak')
    .reduce((acc, curr) => acc + curr.jumlah, 0);

  const totalPengeluaran = filteredList
    .filter((k) => k.jenis === 'pengeluaran' && k.status !== 'pending' && k.status !== 'ditolak')
    .reduce((acc, curr) => acc + curr.jumlah, 0);

  const saldoKas = totalPemasukan - totalPengeluaran;

  // Kas Pembangunan Stats
  const pembMasuk = keuanganList
    .filter((k) => (k.posKas || 'Kas Umum') === 'Kas Pembangunan' && k.jenis === 'pemasukan' && k.status !== 'pending' && k.status !== 'ditolak')
    .reduce((acc, curr) => acc + curr.jumlah, 0);
  const pembKeluar = keuanganList
    .filter((k) => (k.posKas || 'Kas Umum') === 'Kas Pembangunan' && k.jenis === 'pengeluaran' && k.status !== 'pending' && k.status !== 'ditolak')
    .reduce((acc, curr) => acc + curr.jumlah, 0);
  const saldoPembangunan = pembMasuk - pembKeluar;

  // Calculation of Saldo Awal & Periode stats for active pos / print range
  const targetPosKasForCalc = activePosKas !== 'semua' ? activePosKas : null;
  const validKeuanganForPos = keuanganList.filter((k) => {
    const matchesPos = !targetPosKasForCalc || (k.posKas || 'Kas Umum') === targetPosKasForCalc;
    const isApproved = k.status !== 'pending' && k.status !== 'ditolak';
    return matchesPos && isApproved;
  });

  const getCustomBaseSaldoAwal = (pos: string | null) => {
    if (!pos || pos === 'semua' || pos === 'Kas Umum') {
      return settings.saldoAwalCustomKasUmum || 0;
    }
    if (pos === 'Kas Pembangunan') return settings.saldoAwalCustomKasPembangunan || 0;
    if (pos === 'Kas Diakonia' || pos.includes('Diakonia')) return settings.saldoAwalCustomKasDiakonia || 0;
    if (pos.includes('SPPer') || pos.includes('Perempuan')) return settings.saldoAwalCustomKasSpper || 0;
    if (pos.includes('SPB') || pos.includes('Bapak')) return settings.saldoAwalCustomKasSpb || 0;
    if (pos.includes('SPPR') || pos.includes('Pemuda')) return settings.saldoAwalCustomKasSpprp || 0;
    if (pos.includes('SPA') || pos.includes('Sekolah Minggu')) return settings.saldoAwalCustomKasSpa || 0;
    return 0;
  };

  const customBaseSaldo = getCustomBaseSaldoAwal(activePosKas);

  const saldoAwalSelectedRange = customBaseSaldo + validKeuanganForPos
    .filter((k) => k.tanggal < printStartDate)
    .reduce((acc, k) => (k.jenis === 'pemasukan' ? acc + k.jumlah : acc - k.jumlah), 0);

  const pemasukanSelectedRange = validKeuanganForPos
    .filter((k) => k.tanggal >= printStartDate && k.tanggal <= printEndDate)
    .reduce((acc, k) => (k.jenis === 'pemasukan' ? acc + k.jumlah : 0), 0);

  const pengeluaranSelectedRange = validKeuanganForPos
    .filter((k) => k.tanggal >= printStartDate && k.tanggal <= printEndDate)
    .reduce((acc, k) => (k.jenis === 'pengeluaran' ? acc + k.jumlah : 0), 0);

  const totalDikelolaSelectedRange = saldoAwalSelectedRange + pemasukanSelectedRange;
  const saldoAkhirSelectedRange = totalDikelolaSelectedRange - pengeluaranSelectedRange;

  const currentPosKasParam = activePosKas !== 'semua' ? activePosKas : undefined;

  const handlePrintMingguan = () => {
    const start = get7DaysAgoStr();
    const end = getTodayStr();
    setPrintStartDate(start);
    setPrintEndDate(end);
    openPrintReport({
      reportType: 'keuangan_mingguan',
      startDate: start,
      endDate: end,
      posKas: currentPosKasParam,
    });
  };

  const handlePrintBulanan = () => {
    const start = getStartOfMonthStr();
    const end = getEndOfMonthStr();
    setPrintStartDate(start);
    setPrintEndDate(end);
    openPrintReport({
      reportType: 'keuangan_bulanan',
      startDate: start,
      endDate: end,
      posKas: currentPosKasParam,
    });
  };

  const handlePrintTriwulan = () => {
    const { startDate, endDate } = getQuarterRangeStr();
    setPrintStartDate(startDate);
    setPrintEndDate(endDate);
    openPrintReport({
      reportType: 'keuangan_triwulan',
      startDate,
      endDate,
      posKas: currentPosKasParam,
    });
  };

  const handlePrintTahunan = () => {
    const yr = printTahun || new Date().getFullYear().toString();
    openPrintReport({
      reportType: 'keuangan_tahunan',
      tahun: yr,
      startDate: `${yr}-01-01`,
      endDate: `${yr}-12-31`,
      posKas: currentPosKasParam,
    });
  };

  const handlePrintCustomRange = () => {
    const titlePos = activePosKas === 'Kas Pembangunan' ? 'PEMBANGUNAN GEREJA' : 'KEUANGAN KAS';
    openPrintReport({
      reportType: 'keuangan_bulanan',
      startDate: printStartDate,
      endDate: printEndDate,
      posKas: currentPosKasParam,
      customTitle: `LAPORAN REKAPITULASI ${titlePos} PERIODE (${printStartDate} S/D ${printEndDate})`,
    });
  };

  const saldoAwalCustomKas = React.useMemo(() => {
    if (activePosKas === 'Kas Pembangunan') return settings.saldoAwalCustomKasPembangunan || 0;
    if (activePosKas === 'Kas Diakonia') return settings.saldoAwalCustomKasDiakonia || 0;
    if (activePosKas === 'Kas SPPer') return settings.saldoAwalCustomKasSpper || 0;
    if (activePosKas === 'Kas SPB') return settings.saldoAwalCustomKasSpb || 0;
    if (activePosKas === 'Kas SPPR/P') return settings.saldoAwalCustomKasSpprp || 0;
    if (activePosKas === 'Kas Anak Sekolah Hari Minggu') return settings.saldoAwalCustomKasSpa || 0;
    return settings.saldoAwalCustomKasUmum || 0;
  }, [activePosKas, settings]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800/80 shadow-lg backdrop-blur-md flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <DollarSign className="w-5 h-5" />
            </div>
            Buku Kas Jemaat GKE
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Pengelolaan Buku Kas Umum, Kas Pembangunan & Kas Kategorial Gereja dengan Visualisasi Data Recharts & Laporan Resmi
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsQrisModalOpen(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 via-teal-600 to-sky-600 hover:from-emerald-500 hover:to-sky-500 text-white text-xs font-extrabold px-4 py-2.5 rounded-xl transition-all shadow-md shadow-emerald-600/30 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
          >
            <QrCode className="w-4 h-4 text-emerald-200" />
            <span>Persembahan QRIS & GoPay</span>
          </button>

          {canEdit && (
            <>
              <button
                onClick={() => setIsSaldoAwalModalOpen(true)}
                className="flex items-center gap-2 bg-amber-600/90 hover:bg-amber-500 text-white text-xs font-bold px-3.5 py-2.5 rounded-xl transition-all shadow-md shadow-amber-600/20 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer border border-amber-500/30"
                title="Pengesetan Saldo Awal Periode Custom Base Kas & Pos Kas"
              >
                <DollarSign className="w-4 h-4 text-amber-200" />
                <span>Saldo Awal Custom</span>
              </button>

              <button
                onClick={handleOpenAdd}
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-all shadow-md shadow-emerald-600/30 hover:-translate-y-0.5 active:translate-y-0"
              >
                <Plus className="w-4 h-4" />
                <span>
                  {activePosKas === 'Kas Pembangunan'
                    ? 'Input Transaksi Kas Pembangunan'
                    : 'Input Transaksi Kas'}
                </span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* VIEW MODE SELECTOR (VISUALISASI RECHARTS / BUKU KAS / KEDUANYA) */}
      <div className="bg-slate-900/90 p-2.5 rounded-2xl border border-indigo-500/30 shadow-xl backdrop-blur-md flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <BarChart3 className="w-4 h-4 text-indigo-400" />
          </div>
          <span className="text-xs font-bold text-slate-200">Mode Tampilan Modul Keuangan:</span>
        </div>

        <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
          <button
            onClick={() => setMainViewMode('visualisasi')}
            className={`px-3.5 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
              mainViewMode === 'visualisasi'
                ? 'bg-gradient-to-r from-indigo-600 to-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5 text-emerald-300" />
            <span>Visualisasi & Grafik Recharts</span>
          </button>

          <button
            onClick={() => setMainViewMode('transaksi')}
            className={`px-3.5 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
              mainViewMode === 'transaksi'
                ? 'bg-gradient-to-r from-indigo-600 to-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <TableIcon className="w-3.5 h-3.5 text-indigo-300" />
            <span>Buku Kas & Transaksi</span>
          </button>

          <button
            onClick={() => setMainViewMode('keduanya')}
            className={`px-3.5 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
              mainViewMode === 'keduanya'
                ? 'bg-gradient-to-r from-indigo-600 to-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5 text-sky-300" />
            <span>Tampilan Lengkap</span>
          </button>
        </div>
      </div>

      {/* RECHARTS DATA VISUALIZATION SECTION */}
      {(mainViewMode === 'visualisasi' || mainViewMode === 'keduanya') && (
        <KeuanganVisualisasi
          keuanganList={keuanganList}
          activePosKas={activePosKas}
          onSelectPosKas={(pos) => setActivePosKas(pos)}
          saldoAwalCustom={saldoAwalCustomKas}
        />
      )}

      {/* TRANSAKSI & BUKU KAS SECTION */}
      {(mainViewMode === 'transaksi' || mainViewMode === 'keduanya') && (
        <div className="space-y-6">
          {/* Banner Peringatan Persembahan Digital Ditunda (Menunggu Admin) */}
          {pendingItemsCount > 0 && (
            <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center justify-between gap-3 text-amber-300">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  <Clock className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <h4 className="font-bold text-xs text-amber-300">
                    Terdapat {pendingItemsCount} Persembahan Digital Menunggu Konfirmasi & Verifikasi Admin
                  </h4>
                  <p className="text-[11px] text-slate-300 mt-0.5">
                    Pencatatan belum dimasukkan ke Buku Kas Jemaat. Silakan buka menu <strong>Persembahan Digital</strong> untuk menyetujui dan memverifikasi persembahan ini.
                  </p>
                </div>
              </div>
            </div>
          )}

      {/* POS KAS SUB-TAB SWITCHER */}
      <div className="bg-slate-950 p-2 rounded-2xl border border-slate-800 space-y-2">
        <div className="text-[11px] font-bold text-slate-400 px-2 flex items-center justify-between">
          <span>Pilih Pos Kas & Rekening Keuangan Jemaat:</span>
          <span className="text-emerald-400 font-mono text-[10px]">
            Aktif: {activePosKas === 'semua' ? 'Semua Pos Kas' : activePosKas}
          </span>
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-slate-700">
          <button
            onClick={() => setActivePosKas('semua')}
            className={`whitespace-nowrap py-2 px-3.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
              activePosKas === 'semua'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 ring-1 ring-indigo-400'
                : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Coins className="w-3.5 h-3.5" />
            <span>Semua Pos Kas (Gabungan)</span>
          </button>

          {posKasOptions.map((pos) => {
            const isActive = activePosKas === pos;
            return (
              <button
                key={pos}
                onClick={() => setActivePosKas(pos)}
                className={`whitespace-nowrap py-2 px-3.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
                  isActive
                    ? pos === 'Kas Pembangunan' || pos === 'Kas Iuran Pembangunan' || pos === 'Kas Kupon'
                      ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/30 ring-1 ring-amber-400'
                      : pos === 'Kas Diakonia'
                      ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30 ring-1 ring-rose-400'
                      : 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30 ring-1 ring-emerald-400'
                    : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-slate-800/80'
                }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>{pos}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* BANNER INFORMASI KAS PEMBANGUNAN GEREJA (Tampil Jika Tab Pembangunan Aktif) */}
      {activePosKas === 'Kas Pembangunan' && (
        <div className="bg-gradient-to-r from-amber-950/60 via-slate-900 to-amber-950/40 p-4 rounded-2xl border border-amber-500/30 shadow-xl backdrop-blur-md text-xs space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-amber-500/20 pb-2">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                <Hammer className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <h3 className="font-bold text-amber-200 text-sm">Pengelolaan Kas Pembangunan & Renovasi Gereja</h3>
                <p className="text-[11px] text-slate-300">
                  Transparansi penerimaan persembahan pembangunan, donatur, janji iman, serta belanja material & pekerja
                </p>
              </div>
            </div>
            <span className="text-[10px] font-bold bg-amber-500/20 text-amber-300 px-3 py-1 rounded-lg border border-amber-500/30">
              Pos Rekening Khusus Pembangunan
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            <div className="bg-slate-950/70 p-2.5 rounded-xl border border-amber-500/20">
              <span className="text-[10px] text-amber-400/80 font-semibold block">Total Pemasukan Pembangunan</span>
              <p className="text-sm font-black text-emerald-400">Rp {pembMasuk.toLocaleString('id-ID')}</p>
            </div>
            <div className="bg-slate-950/70 p-2.5 rounded-xl border border-amber-500/20">
              <span className="text-[10px] text-amber-400/80 font-semibold block">Total Pengeluaran Pembangunan</span>
              <p className="text-sm font-black text-rose-400">Rp {pembKeluar.toLocaleString('id-ID')}</p>
            </div>
            <div className="bg-slate-950/70 p-2.5 rounded-xl border border-amber-500/30 bg-amber-500/5">
              <span className="text-[10px] text-amber-300 font-bold block">Saldo Kas Pembangunan Tersedia</span>
              <p className="text-sm font-black text-amber-300">Rp {saldoPembangunan.toLocaleString('id-ID')}</p>
            </div>
          </div>
        </div>
      )}

      {/* BANNER INFORMASI KAS IURAN KEWAJIBAN WARGA */}
      {activePosKas === 'Kas Iuran Kewajiban' && (
        <div className="bg-gradient-to-r from-indigo-950/60 via-slate-900 to-indigo-950/40 p-4 rounded-2xl border border-indigo-500/30 shadow-xl backdrop-blur-md text-xs space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-indigo-500/20 pb-2.5">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                <CreditCard className="w-5 h-5 text-indigo-400" />
              </div>
              <div>
                <h3 className="font-bold text-indigo-200 text-sm">Buku Kas Iuran Kewajiban Warga Jemaat (Jan - Des)</h3>
                <p className="text-[11px] text-slate-300">
                  Semua transaksi pembayaran iuran kewajiban warga secara otomatis dibukukan di sini.
                </p>
              </div>
            </div>
            <button
              onClick={() => setActiveTab('iuran_kewajiban')}
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
            >
              <span>Buka Matriks Iuran 12 Bulan</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* OPSI CETAK LAPORAN BERDASARKAN PERIODE */}
      <div className="bg-slate-900/90 p-4 rounded-2xl border border-indigo-500/30 shadow-xl backdrop-blur-md space-y-3 text-xs">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-2.5">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Printer className="w-4 h-4 text-indigo-400" />
            </div>
            <div>
              <h3 className="font-bold text-slate-100 text-xs">
                Opsi Cetak Laporan {activePosKas === 'Kas Pembangunan' ? 'Kas Pembangunan' : 'Kas'} Menurut Periode
              </h3>
              <p className="text-[11px] text-slate-400">Pilih rentang tanggal (Awal s/d Akhir) atau periode tahunan kas</p>
            </div>
          </div>
          <span className="text-[10px] font-bold bg-emerald-500/10 text-emerald-400 px-2.5 py-1 rounded-lg border border-emerald-500/20">
            Laporan Resmi Berstempel
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
          {/* Tanggal Awal & Akhir */}
          <div className="md:col-span-5 grid grid-cols-2 gap-2 bg-slate-950/70 p-2.5 rounded-xl border border-slate-800">
            <div>
              <label className="block text-[10px] font-bold text-slate-300 mb-1 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-indigo-400" />
                Periode Awal:
              </label>
              <input
                type="date"
                value={printStartDate}
                onChange={(e) => setPrintStartDate(e.target.value)}
                className="w-full p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-100 font-medium focus:outline-none focus:border-indigo-500 text-xs"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-300 mb-1 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-indigo-400" />
                Periode Akhir:
              </label>
              <input
                type="date"
                value={printEndDate}
                onChange={(e) => setPrintEndDate(e.target.value)}
                className="w-full p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-100 font-medium focus:outline-none focus:border-indigo-500 text-xs"
              />
            </div>
          </div>

          {/* Pilih Tahun Kas */}
          <div className="md:col-span-3 bg-slate-950/70 p-2.5 rounded-xl border border-slate-800">
            <label className="block text-[10px] font-bold text-slate-300 mb-1 flex items-center gap-1">
              <Calendar className="w-3 h-3 text-emerald-400" />
              Pilihan Tahun Kas (Tahunan):
            </label>
            <select
              value={printTahun}
              onChange={(e) => setPrintTahun(e.target.value)}
              className="w-full p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-100 font-bold focus:outline-none focus:border-emerald-500 text-xs cursor-pointer"
            >
              {availableYears.map((yr) => (
                <option key={yr} value={yr}>
                  Tahun Kas {yr}
                </option>
              ))}
            </select>
          </div>

          {/* Tombol-tombol Cetak Periode */}
          <div className="md:col-span-4 flex flex-wrap gap-1.5">
            <button
              onClick={handlePrintMingguan}
              title="Cetak Laporan 7 Hari Terakhir"
              className="flex-1 min-w-[70px] py-2 px-2.5 bg-slate-800 hover:bg-slate-700 text-slate-100 font-semibold rounded-xl border border-slate-700 flex items-center justify-center gap-1 transition-all hover:border-indigo-500 active:scale-95 text-[11px]"
            >
              <Printer className="w-3.5 h-3.5 text-indigo-400" />
              Mingguan
            </button>
            <button
              onClick={handlePrintBulanan}
              title="Cetak Laporan Bulanan Saat Ini"
              className="flex-1 min-w-[70px] py-2 px-2.5 bg-slate-800 hover:bg-slate-700 text-slate-100 font-semibold rounded-xl border border-slate-700 flex items-center justify-center gap-1 transition-all hover:border-indigo-500 active:scale-95 text-[11px]"
            >
              <Printer className="w-3.5 h-3.5 text-indigo-400" />
              Bulanan
            </button>
            <button
              onClick={handlePrintTriwulan}
              title="Cetak Laporan Triwulan Saat Ini"
              className="flex-1 min-w-[70px] py-2 px-2.5 bg-slate-800 hover:bg-slate-700 text-slate-100 font-semibold rounded-xl border border-slate-700 flex items-center justify-center gap-1 transition-all hover:border-indigo-500 active:scale-95 text-[11px]"
            >
              <Printer className="w-3.5 h-3.5 text-indigo-400" />
              Triwulan
            </button>
            <button
              onClick={handlePrintTahunan}
              title={`Cetak Laporan Tahun Kas ${printTahun}`}
              className="flex-1 min-w-[80px] py-2 px-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-md flex items-center justify-center gap-1 transition-all active:scale-95 text-[11px]"
            >
              <Printer className="w-3.5 h-3.5 text-emerald-300" />
              Tahunan ({printTahun})
            </button>
            <button
              onClick={handlePrintCustomRange}
              title="Cetak Dengan Rentang Tanggal Awal s/d Akhir Yang Dipilih"
              className="w-full py-2 px-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-md flex items-center justify-center gap-1.5 transition-all active:scale-95 text-[11px] mt-1"
            >
              <Printer className="w-3.5 h-3.5 text-white" />
              Cetak Laporan Rentang Pilih ({printStartDate} s/d {printEndDate})
            </button>
          </div>
        </div>

        {/* Live Calculation Badge for Selected Period */}
        <div className="bg-slate-950/80 p-3 rounded-xl border border-indigo-500/20 grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center text-xs">
          <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800/80">
            <span className="text-slate-400 text-[10px] block font-medium">Saldo Awal (Sebelum {printStartDate}):</span>
            <span className="font-bold text-amber-400 text-xs">Rp {saldoAwalSelectedRange.toLocaleString('id-ID')}</span>
          </div>
          <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800/80">
            <span className="text-emerald-400 text-[10px] block font-medium">Pemasukan Periode Ini:</span>
            <span className="font-bold text-emerald-400 text-xs">+ Rp {pemasukanSelectedRange.toLocaleString('id-ID')}</span>
          </div>
          <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800/80">
            <span className="text-rose-400 text-[10px] block font-medium">Pengeluaran Periode Ini:</span>
            <span className="font-bold text-rose-400 text-xs">- Rp {pengeluaranSelectedRange.toLocaleString('id-ID')}</span>
          </div>
          <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800/80 bg-indigo-500/5">
            <span className="text-indigo-300 text-[10px] block font-bold">Saldo Kas Akhir Periode Terhitung:</span>
            <span className="font-extrabold text-indigo-300 text-xs">Rp {saldoAkhirSelectedRange.toLocaleString('id-ID')}</span>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900/80 border border-emerald-500/20 p-5 rounded-2xl shadow-lg backdrop-blur-md">
          <div className="flex items-center justify-between text-emerald-400">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Pemasukan ({activePosKas})
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
              <ArrowDownCircle className="w-5 h-5 text-emerald-400" />
            </div>
          </div>
          <h3 className="text-2xl font-black text-emerald-400 mt-2 tracking-tight">
            Rp {totalPemasukan.toLocaleString('id-ID')}
          </h3>
          <p className="text-[11px] text-slate-400 mt-1">
            {activePosKas === 'Kas Pembangunan'
              ? 'Donatur, Janji Iman, Kotak Pembangunan'
              : 'Persembahan, Perpuluhan, Ucapan Syukur'}
          </p>
        </div>

        <div className="bg-slate-900/80 border border-rose-500/20 p-5 rounded-2xl shadow-lg backdrop-blur-md">
          <div className="flex items-center justify-between text-rose-400">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Pengeluaran ({activePosKas})
            </span>
            <div className="w-9 h-9 rounded-xl bg-rose-500/10 flex items-center justify-center border border-rose-500/20">
              <ArrowUpCircle className="w-5 h-5 text-rose-400" />
            </div>
          </div>
          <h3 className="text-2xl font-black text-rose-400 mt-2 tracking-tight">
            Rp {totalPengeluaran.toLocaleString('id-ID')}
          </h3>
          <p className="text-[11px] text-slate-400 mt-1">
            {activePosKas === 'Kas Pembangunan'
              ? 'Material Bangunan, Upah Tukang & Konstruksi'
              : 'Operasional, Diakonia, Honor, Pemeliharaan'}
          </p>
        </div>

        <div className="bg-slate-900/80 border border-indigo-500/20 p-5 rounded-2xl shadow-lg backdrop-blur-md">
          <div className="flex items-center justify-between text-indigo-400">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Saldo Netto ({activePosKas})
            </span>
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
              <DollarSign className="w-5 h-5 text-indigo-400" />
            </div>
          </div>
          <h3 className="text-2xl font-black text-indigo-300 mt-2 tracking-tight">
            Rp {saldoKas.toLocaleString('id-ID')}
          </h3>
          <p className="text-[11px] text-slate-400 mt-1">
            Saldo Tersedia {activePosKas === 'Kas Pembangunan' ? 'Panitia Pembangunan' : 'Majelis Jemaat'}
          </p>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-900/80 p-4 rounded-2xl border border-slate-800/80 text-xs backdrop-blur-md">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Cari transaksi / no ref / keterangan..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-xs"
          />
        </div>

        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setFilterJenis('semua')}
            className={`flex-1 py-1.5 rounded-lg text-center font-medium transition-colors ${
              filterJenis === 'semua' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Semua
          </button>
          <button
            onClick={() => setFilterJenis('pemasukan')}
            className={`flex-1 py-1.5 rounded-lg text-center font-medium transition-colors ${
              filterJenis === 'pemasukan'
                ? 'bg-emerald-600 text-white font-bold'
                : 'text-emerald-400 hover:text-emerald-300'
            }`}
          >
            Pemasukan
          </button>
          <button
            onClick={() => setFilterJenis('pengeluaran')}
            className={`flex-1 py-1.5 rounded-lg text-center font-medium transition-colors ${
              filterJenis === 'pengeluaran' ? 'bg-rose-600 text-white font-bold' : 'text-rose-400 hover:text-rose-300'
            }`}
          >
            Pengeluaran
          </button>
        </div>

        <div>
          <select
            value={filterKategori}
            onChange={(e) => setFilterKategori(e.target.value)}
            className="w-full py-2.5 px-3 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-xs"
          >
            <option value="" className="bg-slate-900">Semua Kategori</option>
            {categories.map((c) => (
              <option key={c} value={c} className="bg-slate-900">
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-900/80 rounded-2xl border border-slate-800/80 overflow-hidden shadow-lg backdrop-blur-md">
        <div className="overflow-x-auto w-full max-w-full">
          <table className="w-full min-w-[850px] text-xs text-left text-slate-300">
            <thead className="bg-slate-950/80 text-slate-200 font-bold border-b border-slate-800 uppercase text-[11px] tracking-wider whitespace-nowrap">
              <tr>
                <th className="p-3.5 w-12 text-center">No</th>
                <th className="p-3.5">Tanggal</th>
                <th className="p-3.5">Pos Kas</th>
                <th className="p-3.5">No. Referensi</th>
                <th className="p-3.5">Kategori</th>
                <th className="p-3.5">Keterangan</th>
                <th className="p-3.5 text-right">Pemasukan</th>
                <th className="p-3.5 text-right">Pengeluaran</th>
                <th className="p-3.5 text-center">Status Verifikasi</th>
                {canEdit && <th className="p-3.5 text-center">Aksi</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-slate-500">
                    Tidak ada transaksi keuangan ditemukan untuk pos kas ini.
                  </td>
                </tr>
              ) : (
                filteredList.map((item, idx) => {
                  const pos = item.posKas || 'Kas Umum';
                  return (
                    <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-3.5 text-center font-mono text-slate-500">{idx + 1}</td>
                      <td className="p-3.5 font-mono text-slate-400 whitespace-nowrap">{item.tanggal}</td>
                      <td className="p-3.5">
                        <span
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-bold whitespace-nowrap ${
                            pos === 'Kas Pembangunan'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                          }`}
                        >
                          {pos}
                        </span>
                      </td>
                      <td className="p-3.5 font-mono text-[11px] text-slate-400">{item.noReferensi}</td>
                      <td className="p-3.5">
                        <span
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${
                            item.jenis === 'pemasukan'
                              ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                              : 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                          }`}
                        >
                          {item.kategori}
                        </span>
                      </td>
                      <td className="p-3.5 font-medium text-slate-100">{item.keterangan}</td>
                      <td className="p-3.5 text-right font-bold text-emerald-400">
                        {item.jenis === 'pemasukan'
                          ? `Rp ${item.jumlah.toLocaleString('id-ID')}`
                          : '-'}
                      </td>
                      <td className="p-3.5 text-right font-bold text-rose-400">
                        {item.jenis === 'pengeluaran'
                          ? `Rp ${item.jumlah.toLocaleString('id-ID')}`
                          : '-'}
                      </td>
                      <td className="p-3.5 text-center whitespace-nowrap">
                        {item.status === 'pending' ? (
                          <span className="inline-flex items-center gap-1 bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2.5 py-1 rounded-full text-[10px] font-bold">
                            <Clock className="w-3 h-3 text-amber-400 animate-pulse" />
                            Ditunda (Perlu Admin)
                          </span>
                        ) : item.status === 'ditolak' ? (
                          <span className="inline-flex items-center gap-1 bg-rose-500/20 text-rose-300 border border-rose-500/40 px-2.5 py-1 rounded-full text-[10px] font-bold">
                            <XCircle className="w-3 h-3 text-rose-400" />
                            Ditolak
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 px-2.5 py-1 rounded-full text-[10px] font-bold">
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                            Kas Live
                          </span>
                        )}
                      </td>
                      {canEdit && (
                        <td className="p-3.5 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1.5">
                            {item.status === 'pending' && (
                              <>
                                <button
                                  onClick={() =>
                                    updateKeuanganItem(item.id, {
                                      status: 'disetujui',
                                      disetujuiOleh: currentUser.namaLengkap,
                                    })
                                  }
                                  className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 transition-colors shadow-sm"
                                  title="Setujui dan masukkan ke Kas Keuangan"
                                >
                                  <CheckCircle2 className="w-3 h-3" />
                                  Setujui Kas
                                </button>
                                <button
                                  onClick={() =>
                                    updateKeuanganItem(item.id, {
                                      status: 'ditolak',
                                      disetujuiOleh: 'Ditolak Admin',
                                    })
                                  }
                                  className="px-2 py-1 bg-rose-900/80 hover:bg-rose-800 text-rose-200 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-colors"
                                  title="Tolak persembahan ini"
                                >
                                  <XCircle className="w-3 h-3" />
                                  Tolak
                                </button>
                              </>
                            )}
                            <button
                              onClick={() => handleOpenEdit(item)}
                              className="p-1.5 text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-colors"
                              title="Edit"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setDeleteTarget(item)}
                              className="p-2 sm:p-1.5 text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 rounded-lg transition-colors cursor-pointer flex items-center justify-center min-w-[36px] min-h-[36px]"
                              title="Hapus Transaksi"
                            >
                              <Trash2 className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )}

      {/* Form Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4 overflow-hidden animate-in fade-in duration-150">
          <div className="bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg border border-slate-800 text-slate-100 flex flex-col max-h-[92dvh] sm:max-h-[88vh] overflow-hidden my-auto">
            <div className="bg-slate-950 p-4 px-5 border-b border-slate-800 flex items-center justify-between shrink-0">
              <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
                <Coins className="w-4 h-4 text-emerald-400" />
                <span>{editingItem ? 'Edit Transaksi Kas' : 'Input Transaksi Kas Baru'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden text-xs">
              <div className="p-4 sm:p-5 space-y-4 flex-1 overflow-y-auto overscroll-contain">
                {/* POS REKENING KAS */}
              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Pos Rekening Kas
                </label>
                <select
                  value={formData.posKas || 'Kas Umum'}
                  onChange={(e) => {
                    const newPos = e.target.value as KeuanganItem['posKas'];
                    let targetKategori: KeuanganItem['kategori'] = formData.kategori;
                    if (newPos === 'Kas Pembangunan') targetKategori = 'Pembangunan & Renovasi';
                    else if (newPos === 'Kas Kupon') targetKategori = 'Kupon Pembangunan/Bazar';
                    else if (newPos === 'Kas Diakonia') targetKategori = 'Diakonia & Duka';
                    else if (newPos === 'Kas Iuran Kewajiban') targetKategori = 'Iuran Kewajiban Warga';
                    else if (newPos === 'Kas Iuran Pembangunan') targetKategori = 'Iuran Pembangunan Warga';
                    else if (newPos === 'Kas SPPer') targetKategori = 'Persembahan SPPer (Perempuan)';
                    else if (newPos === 'Kas SPB') targetKategori = 'Persembahan SPB (Bapak)';
                    else if (newPos === 'Kas SPPR/P') targetKategori = 'Persembahan SPPR/P (Pemuda/i)';
                    else if (newPos === 'Kas Anak Sekolah Hari Minggu') targetKategori = 'Persembahan ASHM (Sekolah Minggu)';
                    else if (newPos === 'Kas Umum') targetKategori = 'Persembahan Minggu';

                    setFormData({
                      ...formData,
                      posKas: newPos,
                      kategori: targetKategori,
                    });
                  }}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 font-bold focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                >
                  {posKasOptions.map((p) => (
                    <option key={p} value={p} className="bg-slate-900">
                      {p}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Jenis Transaksi</label>
                  <select
                    value={formData.jenis || 'pemasukan'}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        jenis: e.target.value as 'pemasukan' | 'pengeluaran',
                      })
                    }
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 font-bold focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="pemasukan" className="bg-slate-900 text-emerald-400">
                      Pemasukan (Kas Masuk)
                    </option>
                    <option value="pengeluaran" className="bg-slate-900 text-rose-400">
                      Pengeluaran (Kas Keluar)
                    </option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Tanggal Transaksi</label>
                  <input
                    type="date"
                    required
                    value={formData.tanggal || ''}
                    onChange={(e) => setFormData({ ...formData, tanggal: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Kategori Keuangan</label>
                  <select
                    value={formData.kategori || categories[0]}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        kategori: e.target.value as KeuanganItem['kategori'],
                      })
                    }
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  >
                    {categories.map((c) => (
                      <option key={c} value={c} className="bg-slate-900">
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Jumlah Nominal (Rp)</label>
                  <input
                    type="number"
                    min={0}
                    step="any"
                    required
                    value={formData.jumlah || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, jumlah: Number(e.target.value) })
                    }
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-indigo-300 font-bold focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">No. Referensi / Bukti Nota</label>
                <input
                  type="text"
                  required
                  value={formData.noReferensi || ''}
                  onChange={(e) => setFormData({ ...formData, noReferensi: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 font-mono focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Keterangan / Uraian</label>
                <textarea
                  rows={2}
                  required
                  value={formData.keterangan || ''}
                  onChange={(e) => setFormData({ ...formData, keterangan: e.target.value })}
                  placeholder={
                    formData.posKas === 'Kas Pembangunan'
                      ? 'Uraian sumbangan donatur, janji iman, atau nota bahan material...'
                      : 'Detail uraian persembahan atau pembayaran...'
                  }
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="p-3.5 sm:p-4 flex justify-end gap-2 border-t border-slate-800 bg-slate-950/90 shrink-0">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 border border-slate-700 rounded-xl hover:bg-slate-800 font-semibold text-slate-300 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold shadow-md shadow-emerald-600/30 cursor-pointer"
              >
                Simpan Transaksi
              </button>
            </div>
          </form>
        </div>
      </div>
    )}

      {/* Qris Persembahan Modal */}
      <QrisPersembahanModal
        isOpen={isQrisModalOpen}
        onClose={() => setIsQrisModalOpen(false)}
        defaultPosKas={activePosKas !== 'semua' ? (activePosKas as KeuanganItem['posKas']) : 'Kas Umum'}
      />

      {/* MODAL PENGESETAN SALDO AWAL CUSTOM */}
      {isSaldoAwalModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-2xl shadow-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <DollarSign className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-100">
                    Pengesetan Saldo Awal Custom Base Kas
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Atur saldo kas awal (sisa kas sebelum pencatatan sistem) untuk setiap pos kas.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsSaldoAwalModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 max-h-[60vh] overflow-y-auto pr-1">
              <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800">
                <label className="block font-bold text-slate-200 mb-1">
                  Kas Umum (Rp)
                </label>
                <input
                  type="number"
                  value={saldoAwalForm.saldoAwalCustomKasUmum ?? 0}
                  onChange={(e) =>
                    setSaldoAwalForm({
                      ...saldoAwalForm,
                      saldoAwalCustomKasUmum: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-emerald-400 font-bold focus:outline-none focus:border-amber-500"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Formatted: Rp {(saldoAwalForm.saldoAwalCustomKasUmum || 0).toLocaleString('id-ID')}
                </span>
              </div>

              <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800">
                <label className="block font-bold text-slate-200 mb-1">
                  Kas Pembangunan (Rp)
                </label>
                <input
                  type="number"
                  value={saldoAwalForm.saldoAwalCustomKasPembangunan ?? 0}
                  onChange={(e) =>
                    setSaldoAwalForm({
                      ...saldoAwalForm,
                      saldoAwalCustomKasPembangunan: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-amber-400 font-bold focus:outline-none focus:border-amber-500"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Formatted: Rp {(saldoAwalForm.saldoAwalCustomKasPembangunan || 0).toLocaleString('id-ID')}
                </span>
              </div>

              <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800">
                <label className="block font-bold text-slate-200 mb-1">
                  Kas Diakonia (Rp)
                </label>
                <input
                  type="number"
                  value={saldoAwalForm.saldoAwalCustomKasDiakonia ?? 0}
                  onChange={(e) =>
                    setSaldoAwalForm({
                      ...saldoAwalForm,
                      saldoAwalCustomKasDiakonia: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-blue-400 font-bold focus:outline-none focus:border-amber-500"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Formatted: Rp {(saldoAwalForm.saldoAwalCustomKasDiakonia || 0).toLocaleString('id-ID')}
                </span>
              </div>

              <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800">
                <label className="block font-bold text-slate-200 mb-1">
                  Kas SPPer / Perempuan (Rp)
                </label>
                <input
                  type="number"
                  value={saldoAwalForm.saldoAwalCustomKasSpper ?? 0}
                  onChange={(e) =>
                    setSaldoAwalForm({
                      ...saldoAwalForm,
                      saldoAwalCustomKasSpper: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-pink-400 font-bold focus:outline-none focus:border-amber-500"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Formatted: Rp {(saldoAwalForm.saldoAwalCustomKasSpper || 0).toLocaleString('id-ID')}
                </span>
              </div>

              <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800">
                <label className="block font-bold text-slate-200 mb-1">
                  Kas SPB / Bapak (Rp)
                </label>
                <input
                  type="number"
                  value={saldoAwalForm.saldoAwalCustomKasSpb ?? 0}
                  onChange={(e) =>
                    setSaldoAwalForm({
                      ...saldoAwalForm,
                      saldoAwalCustomKasSpb: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-indigo-400 font-bold focus:outline-none focus:border-amber-500"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Formatted: Rp {(saldoAwalForm.saldoAwalCustomKasSpb || 0).toLocaleString('id-ID')}
                </span>
              </div>

              <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800">
                <label className="block font-bold text-slate-200 mb-1">
                  Kas SPPR/P / Pemuda (Rp)
                </label>
                <input
                  type="number"
                  value={saldoAwalForm.saldoAwalCustomKasSpprp ?? 0}
                  onChange={(e) =>
                    setSaldoAwalForm({
                      ...saldoAwalForm,
                      saldoAwalCustomKasSpprp: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-violet-400 font-bold focus:outline-none focus:border-amber-500"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Formatted: Rp {(saldoAwalForm.saldoAwalCustomKasSpprp || 0).toLocaleString('id-ID')}
                </span>
              </div>
            </div>

            <div className="pt-3 flex justify-end gap-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsSaldoAwalModalOpen(false)}
                className="px-4 py-2 border border-slate-700 rounded-xl hover:bg-slate-800 font-semibold text-slate-300"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={async () => {
                  await updateSettings(saldoAwalForm);
                  setIsSaldoAwalModalOpen(false);
                }}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl font-bold shadow-md shadow-amber-600/30"
              >
                Simpan Saldo Awal Custom
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Confirm Delete */}
      <DeleteConfirmModal
        isOpen={!!deleteTarget}
        title="Konfirmasi Hapus Transaksi Kas"
        itemName={
          deleteTarget
            ? `${deleteTarget.keterangan || 'Transaksi'} - Rp ${(deleteTarget.nominal || 0).toLocaleString('id-ID')} (${deleteTarget.posKas || 'Kas Umum'})`
            : ''
        }
        onConfirm={async () => {
          if (deleteTarget) {
            await deleteKeuanganItem(deleteTarget.id);
          }
        }}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
};
