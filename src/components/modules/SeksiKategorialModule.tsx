import React, { useState, useMemo } from 'react';
import {
  Users,
  Calendar,
  DollarSign,
  Plus,
  Edit2,
  Trash2,
  Search,
  Printer,
  Phone,
  CheckCircle2,
  Clock,
  Building,
  Heart,
  Sparkles,
  UserCheck,
  Briefcase,
  AlertCircle,
  TrendingUp,
  FileText,
  MessageSquare,
  ShieldCheck,
  ExternalLink,
  ArrowRight,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { KegiatanKategorial, KeuanganItem } from '../../types';
import { DeleteConfirmModal } from '../DeleteConfirmModal';
import { formatIndonesianDate } from '../../utils/dateUtils';

export const SeksiKategorialModule: React.FC = () => {
  const {
    mphList,
    setActiveTab,
    kegiatanKategorialList,
    addKegiatanKategorial,
    updateKegiatanKategorial,
    deleteKegiatanKategorial,
    keuanganList,
    addKeuanganItem,
    openPrintReport,
    settings,
  } = useApp();

  const [activeSeksi, setActiveSeksi] = useState<'ALL' | 'SPB' | 'SPPer' | 'SPPR/P' | 'SPA'>('ALL');
  const [activeSubTab, setActiveSubTab] = useState<'pengurus' | 'kegiatan' | 'kas'>('pengurus');
  const [searchTerm, setSearchTerm] = useState('');

  // Modals state
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'kegiatan'; id: string; name: string } | null>(null);

  const [isKegiatanModalOpen, setIsKegiatanModalOpen] = useState(false);
  const [editingKegiatan, setEditingKegiatan] = useState<KegiatanKategorial | null>(null);
  const [kegiatanForm, setKegiatanForm] = useState<Omit<KegiatanKategorial, 'id'>>({
    seksi: 'SPB',
    namaProgram: '',
    kategori: 'Ibadah / Kebaktian Seksi',
    tanggal: new Date().toISOString().split('T')[0],
    waktu: '18:00 WIB',
    tempat: 'Gedung Gereja Utama GKE Efata',
    penanggungJawab: '',
    anggaranEstimasi: 0,
    realisasiBiaya: 0,
    status: 'Rencana',
    keterangan: '',
  });

  const [isKasModalOpen, setIsKasModalOpen] = useState(false);
  const [kasForm, setKasForm] = useState<{
    seksi: 'SPB' | 'SPPer' | 'SPPR/P' | 'SPA';
    jenis: 'masuk' | 'keluar';
    jumlah: number;
    keterangan: string;
    tanggal: string;
  }>({
    seksi: 'SPB',
    jenis: 'masuk',
    jumlah: 0,
    keterangan: '',
    tanggal: new Date().toISOString().split('T')[0],
  });

  // Deteksi Seksi Kategorial berdasarkan Nama Jabatan di Data MPH Jemaat
  const detectSeksiFromJabatan = (jabatan: string): 'SPB' | 'SPPer' | 'SPPR/P' | 'SPA' | 'LAINNYA' => {
    const jabUpper = (jabatan || '').toUpperCase();
    if (jabUpper.includes('SPB') || jabUpper.includes('BAPAK')) {
      return 'SPB';
    }
    if (
      jabUpper.includes('SPPER') ||
      jabUpper.includes('SP PER') ||
      jabUpper.includes('PEREMPUAN') ||
      jabUpper.includes('WANITA')
    ) {
      return 'SPPer';
    }
    if (
      jabUpper.includes('SPPR') ||
      jabUpper.includes('SPP/R') ||
      jabUpper.includes('PEMUDA') ||
      jabUpper.includes('REMAJA')
    ) {
      return 'SPPR/P';
    }
    if (
      jabUpper.includes('SPA') ||
      jabUpper.includes('ASHM') ||
      jabUpper.includes('SEKOLAH MINGGU') ||
      jabUpper.includes('ANAK') ||
      jabUpper.includes('GRARP')
    ) {
      return 'SPA';
    }
    return 'LAINNYA';
  };

  // Data Pengurus Seksi yang bersumber langsung dari Pengurus MPH Jemaat
  const seksiPengurusList = useMemo(() => {
    return mphList.map((m) => {
      const seksi = detectSeksiFromJabatan(m.jabatan);
      return {
        id: m.id,
        nama: m.nama,
        gelar: m.gelar || '',
        jabatan: m.jabatan,
        periode: m.periode || settings.periodePelayananMPH || '2024 - 2029',
        noHp: m.noHp || '',
        seksi,
        status: 'Aktif' as const,
        rawMPH: m,
      };
    });
  }, [mphList, settings.periodePelayananMPH]);

  // Filtered list pengurus dari MPH
  const filteredPengurus = useMemo(() => {
    return seksiPengurusList.filter((p) => {
      const isKategorial = p.seksi !== 'LAINNYA';
      const matchSeksi = activeSeksi === 'ALL' ? isKategorial || true : p.seksi === activeSeksi;
      const matchSearch =
        (p.nama || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.gelar || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.jabatan || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.seksi || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.noHp || '').toLowerCase().includes(searchTerm.toLowerCase());
      return matchSeksi && matchSearch;
    });
  }, [seksiPengurusList, activeSeksi, searchTerm]);

  const filteredKegiatan = useMemo(() => {
    return kegiatanKategorialList.filter((k) => {
      const matchSeksi = activeSeksi === 'ALL' || k.seksi === activeSeksi;
      const matchSearch =
        (k.namaProgram || k.namaKegiatan || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (k.penanggungJawab || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (k.tempat || k.lokasi || '').toLowerCase().includes(searchTerm.toLowerCase());
      return matchSeksi && matchSearch;
    });
  }, [kegiatanKategorialList, activeSeksi, searchTerm]);

  // Financial transactions for Seksi
  const seksiKeuanganList = useMemo(() => {
    return keuanganList.filter((k) => {
      const pos = (k.posAnggaran || '').toUpperCase();
      const ket = (k.keterangan || '').toUpperCase();
      if (activeSeksi === 'ALL') {
        return (
          pos.includes('SPB') ||
          pos.includes('SPPER') ||
          pos.includes('SPPR') ||
          pos.includes('SPA') ||
          ket.includes('SPB') ||
          ket.includes('SPPER') ||
          ket.includes('SPPR') ||
          ket.includes('SPA')
        );
      }
      const target = activeSeksi.replace('/', '').toUpperCase();
      return (
        pos.includes(target) ||
        ket.includes(target) ||
        pos.includes(activeSeksi.toUpperCase()) ||
        ket.includes(activeSeksi.toUpperCase())
      );
    });
  }, [keuanganList, activeSeksi]);

  const getMasukVal = (k: any): number => {
    if (typeof k.masuk === 'number' && k.masuk > 0) return k.masuk;
    if (k.jenis === 'pemasukan' || k.jenis === 'masuk') {
      return typeof k.jumlah === 'number' && k.jumlah > 0 ? k.jumlah : 0;
    }
    return 0;
  };

  const getKeluarVal = (k: any): number => {
    if (typeof k.keluar === 'number' && k.keluar > 0) return k.keluar;
    if (k.jenis === 'pengeluaran' || k.jenis === 'keluar') {
      return typeof k.jumlah === 'number' && k.jumlah > 0 ? k.jumlah : 0;
    }
    return 0;
  };

  const totalSeksiMasuk = useMemo(() => {
    return seksiKeuanganList.reduce((acc, curr) => acc + getMasukVal(curr), 0);
  }, [seksiKeuanganList]);

  const totalSeksiKeluar = useMemo(() => {
    return seksiKeuanganList.reduce((acc, curr) => acc + getKeluarVal(curr), 0);
  }, [seksiKeuanganList]);

  const saldoSeksi = totalSeksiMasuk - totalSeksiKeluar;

  // Handlers for Kegiatan Modal
  const handleOpenAddKegiatan = () => {
    setEditingKegiatan(null);
    setKegiatanForm({
      seksi: activeSeksi === 'ALL' ? 'SPB' : activeSeksi,
      namaProgram: '',
      kategori: 'Ibadah / Kebaktian Seksi',
      tanggal: new Date().toISOString().split('T')[0],
      waktu: '18:00 WIB',
      tempat: 'Gedung Gereja Utama GKE Efata',
      penanggungJawab: '',
      anggaranEstimasi: 0,
      realisasiBiaya: 0,
      status: 'Rencana',
      keterangan: '',
    });
    setIsKegiatanModalOpen(true);
  };

  const handleOpenEditKegiatan = (k: KegiatanKategorial) => {
    setEditingKegiatan(k);
    setKegiatanForm({
      seksi: k.seksi,
      namaProgram: k.namaProgram,
      kategori: k.kategori,
      tanggal: k.tanggal,
      waktu: k.waktu,
      tempat: k.tempat,
      penanggungJawab: k.penanggungJawab,
      anggaranEstimasi: k.anggaranEstimasi,
      realisasiBiaya: k.realisasiBiaya,
      status: k.status,
      keterangan: k.keterangan || '',
    });
    setIsKegiatanModalOpen(true);
  };

  const handleSaveKegiatan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!kegiatanForm.namaProgram.trim()) return;

    if (editingKegiatan) {
      updateKegiatanKategorial(editingKegiatan.id, kegiatanForm);
    } else {
      addKegiatanKategorial(kegiatanForm);
    }
    setIsKegiatanModalOpen(false);
  };

  const handleDeleteKegiatan = (id: string, nama: string) => {
    setDeleteTarget({ type: 'kegiatan', id, name: nama });
  };

  // Handlers for Kas Entry
  const handleSaveKas = (e: React.FormEvent) => {
    e.preventDefault();
    if (kasForm.jumlah <= 0 || !kasForm.keterangan.trim()) return;

    const seksiName = kasForm.seksi;
    const item: Omit<KeuanganItem, 'id'> = {
      tanggal: kasForm.tanggal,
      jenis: kasForm.jenis === 'masuk' ? 'pemasukan' : 'pengeluaran',
      posKas:
        seksiName === 'SPB'
          ? 'Kas SPB'
          : seksiName === 'SPPer'
          ? 'Kas SPPer'
          : seksiName === 'SPPR/P'
          ? 'Kas SPPR/P'
          : 'Kas Anak Sekolah Hari Minggu',
      kategori: 'Lain-lain',
      jumlah: kasForm.jumlah,
      keterangan: `[KAS ${seksiName}] ${kasForm.keterangan}`,
      noReferensi: `KAT-${seksiName}-${Date.now().toString().slice(-6)}`,
      posAnggaran: `Kas Seksi Pelayanan ${seksiName}`,
      masuk: kasForm.jenis === 'masuk' ? kasForm.jumlah : 0,
      keluar: kasForm.jenis === 'keluar' ? kasForm.jumlah : 0,
      tipe: kasForm.jenis === 'masuk' ? 'penerimaan' : 'pengeluaran',
      kasSumber: `Kas Seksi ${seksiName}`,
      status: 'disetujui',
    };

    addKeuanganItem(item);
    setIsKasModalOpen(false);
  };

  const getSeksiColor = (seksi: string) => {
    switch (seksi) {
      case 'SPB':
        return 'bg-blue-600 text-white border-blue-700';
      case 'SPPer':
        return 'bg-pink-600 text-white border-pink-700';
      case 'SPPR/P':
        return 'bg-amber-600 text-white border-amber-700';
      case 'SPA':
        return 'bg-emerald-600 text-white border-emerald-700';
      default:
        return 'bg-gray-800 text-white border-gray-900';
    }
  };

  const getSeksiBadgeLight = (seksi: string) => {
    switch (seksi) {
      case 'SPB':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'SPPer':
        return 'bg-pink-50 text-pink-700 border-pink-200';
      case 'SPPR/P':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'SPA':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      default:
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
    }
  };

  const getSeksiFullTitle = (seksi: string) => {
    switch (seksi) {
      case 'SPB':
        return 'Seksi Pelayanan Bapak (SPB)';
      case 'SPPer':
        return 'Seksi Pelayanan Perempuan (SPPer)';
      case 'SPPR/P':
        return 'Seksi Pelayanan Pemuda & Remaja (SPPR/P)';
      case 'SPA':
        return 'Seksi Pelayanan Anak / Sekolah Minggu (SPA / ASHM)';
      default:
        return 'Semua Seksi Pelayanan Kategorial';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-1/4 -translate-y-1/4 opacity-10 pointer-events-none">
          <Users className="w-96 h-96 text-white" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-blue-300 font-semibold text-xs tracking-wider uppercase mb-1">
              <Users className="w-4 h-4" />
              <span>Keanggotaan & Pelayanan Kategorial</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
              Seksi Pelayanan Kategorial GKE
            </h1>
            <p className="text-blue-100/80 text-sm mt-1 max-w-2xl">
              Integrasi tata kelola kepengurusan, agenda program kerja, dan keandalan akuntabilitas kas keuangan untuk SPB, SPPer, SPPR/P, dan SPA.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => openPrintReport({ reportType: 'seksi_kategorial', selectedSeksi: activeSeksi })}
              className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white backdrop-blur-md px-4 py-2.5 rounded-xl font-medium text-sm transition-all shadow-sm border border-white/20 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Laporan Seksi</span>
            </button>
            <button
              onClick={() => setActiveTab('mph_jemaat')}
              className="inline-flex items-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-md hover:shadow-lg cursor-pointer"
              title="Kelola data kepengurusan seksi di modul Pengurus MPH Jemaat"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Kelola Pengurus di MPH</span>
            </button>
          </div>
        </div>

        {/* Quick Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6 pt-6 border-t border-white/10">
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-3">
            <p className="text-xs text-blue-200">Pengurus Terintegrasi (MPH)</p>
            <p className="text-xl font-bold mt-0.5">
              {filteredPengurus.length} Orang
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-3">
            <p className="text-xs text-blue-200">Program Kerja Terjadwal</p>
            <p className="text-xl font-bold mt-0.5">{filteredKegiatan.length} Agenda</p>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-3">
            <p className="text-xs text-blue-200">Total Penerimaan Kas Seksi</p>
            <p className="text-xl font-bold mt-0.5 text-emerald-300">
              Rp {totalSeksiMasuk.toLocaleString('id-ID')}
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-3">
            <p className="text-xs text-blue-200">Estimasi Saldo Kas Seksi</p>
            <p className="text-xl font-bold mt-0.5 text-amber-300">
              Rp {saldoSeksi.toLocaleString('id-ID')}
            </p>
          </div>
        </div>
      </div>

      {/* Seksi Filter Selector */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-2.5 rounded-2xl border border-gray-200 shadow-sm">
        <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto">
          <button
            onClick={() => setActiveSeksi('ALL')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer btn-solid-white-text ${
              activeSeksi === 'ALL'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
            style={activeSeksi === 'ALL' ? { backgroundColor: '#0f172a', color: '#ffffff' } : undefined}
          >
            <span style={activeSeksi === 'ALL' ? { color: '#ffffff' } : undefined}>Semua Seksi</span>
          </button>
          <button
            onClick={() => setActiveSeksi('SPB')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer btn-solid-white-text ${
              activeSeksi === 'SPB'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
            }`}
            style={activeSeksi === 'SPB' ? { backgroundColor: '#2563eb', color: '#ffffff' } : undefined}
          >
            <span style={activeSeksi === 'SPB' ? { color: '#ffffff' } : undefined}>SPB (Bapak)</span>
          </button>
          <button
            onClick={() => setActiveSeksi('SPPer')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer btn-solid-white-text ${
              activeSeksi === 'SPPer'
                ? 'bg-pink-600 text-white shadow-sm'
                : 'bg-pink-50 text-pink-700 hover:bg-pink-100'
            }`}
            style={activeSeksi === 'SPPer' ? { backgroundColor: '#db2777', color: '#ffffff' } : undefined}
          >
            <span style={activeSeksi === 'SPPer' ? { color: '#ffffff' } : undefined}>SPPer (Perempuan)</span>
          </button>
          <button
            onClick={() => setActiveSeksi('SPPR/P')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer btn-solid-white-text ${
              activeSeksi === 'SPPR/P'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
            }`}
            style={activeSeksi === 'SPPR/P' ? { backgroundColor: '#d97706', color: '#ffffff' } : undefined}
          >
            <span style={activeSeksi === 'SPPR/P' ? { color: '#ffffff' } : undefined}>SPPR/P (Pemuda & Remaja)</span>
          </button>
          <button
            onClick={() => setActiveSeksi('SPA')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer btn-solid-white-text ${
              activeSeksi === 'SPA'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
            }`}
            style={activeSeksi === 'SPA' ? { backgroundColor: '#059669', color: '#ffffff' } : undefined}
          >
            <span style={activeSeksi === 'SPA' ? { color: '#ffffff' } : undefined}>SPA (Anak / Sek. Minggu)</span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative min-w-[220px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari nama, jabatan, program..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />
        </div>
      </div>

      {/* Sub-Tabs: Pengurus vs Kegiatan vs Kas */}
      <div className="border-b border-gray-200 flex flex-wrap items-center justify-between gap-3">
        <nav className="flex space-x-6">
          <button
            onClick={() => setActiveSubTab('pengurus')}
            className={`pb-3 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeSubTab === 'pengurus'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Struktur Pengurus Seksi</span>
            <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs">
              {filteredPengurus.length}
            </span>
          </button>
          <button
            onClick={() => setActiveSubTab('kegiatan')}
            className={`pb-3 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeSubTab === 'kegiatan'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Program Kerja & Agenda</span>
            <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs">
              {filteredKegiatan.length}
            </span>
          </button>
          <button
            onClick={() => setActiveSubTab('kas')}
            className={`pb-3 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeSubTab === 'kas'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <DollarSign className="w-4 h-4" />
            <span>Transparansi Kas Seksi</span>
            <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs">
              {seksiKeuanganList.length}
            </span>
          </button>
        </nav>

        <div className="pb-2 flex items-center gap-2">
          <button
            onClick={() => openPrintReport({ reportType: 'seksi_kategorial', selectedSeksi: activeSeksi })}
            className="inline-flex items-center gap-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-3 py-1.5 rounded-lg font-semibold text-xs transition-all border border-indigo-200 cursor-pointer"
            title="Cetak Laporan Resmi Seksi Pelayanan Kategorial GKE"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Cetak Laporan</span>
          </button>

          {activeSubTab === 'pengurus' && (
            <button
              onClick={() => setActiveTab('mph_jemaat')}
              className="inline-flex items-center gap-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 px-3 py-1.5 rounded-lg font-semibold text-xs transition-all border border-indigo-200 cursor-pointer"
              title="Input, ubah, atau kelola data kepengurusan melalui modul Pengurus MPH Jemaat"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Kelola di Pengurus MPH</span>
            </button>
          )}
          {activeSubTab === 'kegiatan' && (
            <button
              onClick={handleOpenAddKegiatan}
              className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 px-3 py-1.5 rounded-lg font-semibold text-xs transition-all border border-blue-200 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Program</span>
            </button>
          )}
          {activeSubTab === 'kas' && (
            <button
              onClick={() => {
                setKasForm({
                  seksi: activeSeksi === 'ALL' ? 'SPB' : activeSeksi,
                  jenis: 'masuk',
                  jumlah: 0,
                  keterangan: '',
                  tanggal: new Date().toISOString().split('T')[0],
                });
                setIsKasModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 px-3 py-1.5 rounded-lg font-semibold text-xs transition-all border border-emerald-200 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Input Transaksi Kas</span>
            </button>
          )}
        </div>
      </div>

      {/* Sub-Tab 1: Pengurus Cards */}
      {activeSubTab === 'pengurus' && (
        <div className="space-y-4">
          {/* Banner Integrasi Pengurus dari MPH */}
          <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-slate-50 border border-blue-200/80 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-blue-950 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-blue-600 text-white rounded-xl shadow-sm shrink-0 mt-0.5">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div className="text-xs space-y-0.5">
                <p className="font-bold text-sm text-blue-950 flex items-center gap-2">
                  <span>Data Terintegrasi dari Pengurus MPH Jemaat</span>
                  <span className="bg-blue-200/80 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                    SK Majelis Jemaat
                  </span>
                </p>
                <p className="text-slate-600 leading-relaxed max-w-3xl">
                  Struktur susunan pengurus seksi kategorial (SPB, SPPer, SPPR/P, SPA) bersumber dan dikelola secara terpusat melalui halaman <strong>Pengurus MPH Jemaat</strong>. Penambahan, perubahan jabatan, kontak, maupun penghapusan pengurus dilakukan pada modul Pengurus MPH Jemaat.
                </p>
              </div>
            </div>
            <button
              onClick={() => setActiveTab('mph_jemaat')}
              className="inline-flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-xs font-semibold shrink-0 shadow-sm transition-all cursor-pointer hover:shadow"
            >
              <Briefcase className="w-4 h-4" />
              <span>Buka Pengurus MPH Jemaat</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex items-center justify-between text-xs text-gray-500 font-medium px-1">
            <span>Menampilkan data kepengurusan {getSeksiFullTitle(activeSeksi)}</span>
            <span>Total: {filteredPengurus.length} Pengurus Terdaftar</span>
          </div>

          {filteredPengurus.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center shadow-sm">
              <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-gray-800">
                Belum Ada Pengurus untuk {getSeksiFullTitle(activeSeksi)}
              </h3>
              <p className="text-xs text-gray-500 mt-1 max-w-md mx-auto leading-relaxed">
                Data kepengurusan seksi kategorial bersumber dari data yang dimasukkan melalui halaman Pengurus MPH Jemaat. Silakan masukkan data pengurus pada modul Pengurus MPH Jemaat.
              </p>
              <button
                onClick={() => setActiveTab('mph_jemaat')}
                className="mt-4 inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl text-xs font-semibold cursor-pointer shadow-sm transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Input Pengurus di Modul MPH Jemaat</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredPengurus.map((p) => (
                <div
                  key={p.id}
                  className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-sm hover:shadow-md transition-all relative overflow-hidden flex flex-col justify-between"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center font-bold text-slate-700 border border-slate-200 shrink-0 text-base">
                        {p.nama.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5 mb-1">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold uppercase border ${getSeksiBadgeLight(
                              p.seksi
                            )}`}
                          >
                            {p.seksi !== 'LAINNYA' ? p.seksi : 'MPH'}
                          </span>
                          <span className="inline-flex items-center gap-1 text-[9px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                            <ShieldCheck className="w-2.5 h-2.5 text-blue-600" />
                            <span>SK MPH</span>
                          </span>
                        </div>
                        <h3 className="text-sm font-bold text-gray-900 leading-snug">
                          {p.nama} {p.gelar ? `, ${p.gelar}` : ''}
                        </h3>
                        <p className="text-xs font-semibold text-blue-700 mt-0.5">{p.jabatan}</p>
                      </div>
                    </div>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        p.status === 'Aktif'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {p.status}
                    </span>
                  </div>

                  <div className="my-4 pt-3 border-t border-gray-100 text-xs space-y-1.5 text-gray-600">
                    <div className="flex items-center justify-between text-gray-500">
                      <span>Periode Masa Bakti:</span>
                      <span className="font-semibold text-gray-800 font-mono">{p.periode}</span>
                    </div>
                    {p.noHp ? (
                      <div className="flex items-center justify-between">
                        <span>No. Telepon / WhatsApp:</span>
                        <a
                          href={`https://wa.me/${p.noHp.replace(/[^0-9]/g, '')}`}
                          target="_blank"
                          rel="noreferrer"
                          className="font-semibold text-emerald-600 hover:underline flex items-center gap-1 font-mono"
                        >
                          <Phone className="w-3 h-3" />
                          <span>{p.noHp}</span>
                        </a>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between text-gray-400">
                        <span>Kontak / WhatsApp:</span>
                        <span>-</span>
                      </div>
                    )}
                  </div>

                  <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs">
                    <span className="text-[11px] text-gray-400">Sumber: MPH Jemaat</span>
                    <button
                      onClick={() => setActiveTab('mph_jemaat')}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 hover:underline cursor-pointer"
                      title="Kelola data pengurus ini di modul Pengurus MPH Jemaat"
                    >
                      <span>Kelola di MPH</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Sub-Tab 2: Kegiatan & Program Kerja */}
      {activeSubTab === 'kegiatan' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-gray-500 font-medium">
            <span>Daftar program kerja {getSeksiFullTitle(activeSeksi)}</span>
            <span>Total: {filteredKegiatan.length} Program</span>
          </div>

          {filteredKegiatan.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
              <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-gray-800">Belum Ada Program Kerja</h3>
              <p className="text-xs text-gray-500 mt-1 max-w-md mx-auto">
                Silakan buat agenda atau program kerja seksi kategorial untuk periode berjalan.
              </p>
              <button
                onClick={handleOpenAddKegiatan}
                className="mt-4 inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Buat Program Kerja</span>
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredKegiatan.map((k) => (
                <div
                  key={k.id}
                  className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase border ${getSeksiBadgeLight(
                          k.seksi
                        )}`}
                      >
                        {k.seksi}
                      </span>
                      <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md">
                        {k.kategori}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          k.status === 'Selesai'
                            ? 'bg-emerald-100 text-emerald-800'
                            : k.status === 'Berlangsung'
                            ? 'bg-blue-100 text-blue-800'
                            : k.status === 'Batal'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {k.status}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-gray-900">{k.namaProgram}</h3>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 pt-1">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-gray-400" />
                        {formatIndonesianDate(k.tanggal)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-gray-400" />
                        {k.waktu}
                      </span>
                      <span className="flex items-center gap-1">
                        <Building className="w-3.5 h-3.5 text-gray-400" />
                        {k.tempat}
                      </span>
                      <span className="flex items-center gap-1 font-medium text-gray-700">
                        <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                        PJ: {k.penanggungJawab}
                      </span>
                    </div>

                    {k.keterangan && (
                      <p className="text-xs text-gray-500 pt-1 italic">{k.keterangan}</p>
                    )}
                  </div>

                  <div className="flex flex-row md:flex-col items-end justify-between md:justify-center border-t md:border-t-0 md:border-l border-gray-100 pt-3 md:pt-0 md:pl-6 gap-3">
                    <div className="text-left md:text-right">
                      <p className="text-[11px] text-gray-400">Estimasi Anggaran</p>
                      <p className="text-sm font-bold text-gray-900">
                        Rp {k.anggaranEstimasi.toLocaleString('id-ID')}
                      </p>
                      {k.realisasiBiaya > 0 && (
                        <p className="text-[11px] font-semibold text-emerald-600">
                          Realisasi: Rp {k.realisasiBiaya.toLocaleString('id-ID')}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleOpenEditKegiatan(k)}
                        className="p-1.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all cursor-pointer"
                        title="Edit Program"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteKegiatan(k.id, k.namaProgram)}
                        className="p-2.5 sm:p-1.5 text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-all cursor-pointer min-w-[36px] min-h-[36px] flex items-center justify-center"
                        title="Hapus Program"
                      >
                        <Trash2 className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Sub-Tab 3: Transparansi Kas Seksi */}
      {activeSubTab === 'kas' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                <span>Penerimaan Kas {activeSeksi !== 'ALL' ? activeSeksi : ''}</span>
                <span className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
                  <TrendingUp className="w-4 h-4" />
                </span>
              </div>
              <p className="text-xl font-bold text-emerald-600">
                Rp {totalSeksiMasuk.toLocaleString('id-ID')}
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                <span>Pengeluaran Kas {activeSeksi !== 'ALL' ? activeSeksi : ''}</span>
                <span className="p-1.5 bg-rose-50 text-rose-600 rounded-lg">
                  <DollarSign className="w-4 h-4" />
                </span>
              </div>
              <p className="text-xl font-bold text-rose-600">
                Rp {totalSeksiKeluar.toLocaleString('id-ID')}
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                <span>Saldo Bersih Kas {activeSeksi !== 'ALL' ? activeSeksi : ''}</span>
                <span className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
                  <Sparkles className="w-4 h-4" />
                </span>
              </div>
              <p className="text-xl font-bold text-blue-700">
                Rp {saldoSeksi.toLocaleString('id-ID')}
              </p>
            </div>
          </div>

          {/* Table List of Transactions */}
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
            <div className="p-4 border-b border-gray-200 flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-bold text-gray-900">
                Buku Transaksi Kas Seksi Pelayanan Kategorial
              </h3>
              <span className="text-xs text-gray-500">
                Sinkronisasi otomatis dengan Modul Perbendaharaan Jemaat
              </span>
            </div>

            {seksiKeuanganList.length === 0 ? (
              <div className="p-12 text-center text-gray-400">
                <DollarSign className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Belum ada transaksi kas untuk seksi ini.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-gray-50 text-gray-600 font-semibold border-b border-gray-200">
                    <tr>
                      <th className="p-3 w-10 text-center">No</th>
                      <th className="p-3">Tanggal</th>
                      <th className="p-3">Keterangan Transaksi</th>
                      <th className="p-3">Pos Kas Anggaran</th>
                      <th className="p-3 text-right">Pemasukan</th>
                      <th className="p-3 text-right">Pengeluaran</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {seksiKeuanganList.map((k, idx) => {
                      const itemMasuk = getMasukVal(k);
                      const itemKeluar = getKeluarVal(k);
                      return (
                        <tr key={k.id} className="hover:bg-gray-50 transition-colors">
                          <td className="p-3 text-center text-gray-400">{idx + 1}</td>
                          <td className="p-3 whitespace-nowrap">{formatIndonesianDate(k.tanggal)}</td>
                          <td className="p-3 font-medium text-gray-900">{k.keterangan}</td>
                          <td className="p-3 text-gray-600">{k.posAnggaran || k.posKas}</td>
                          <td className="p-3 text-right font-semibold text-emerald-600">
                            {itemMasuk > 0 ? `Rp ${itemMasuk.toLocaleString('id-ID')}` : '-'}
                          </td>
                          <td className="p-3 text-right font-semibold text-rose-600">
                            {itemKeluar > 0 ? `Rp ${itemKeluar.toLocaleString('id-ID')}` : '-'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal: Tambah/Edit Kegiatan */}
      {isKegiatanModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl relative animate-in fade-in zoom-in-95 border border-slate-200 text-slate-900">
            <h3 className="text-lg font-bold text-slate-900 border-b border-slate-200 pb-3 mb-4">
              {editingKegiatan ? 'Edit Program Kerja' : 'Tambah Program Kerja Seksi'}
            </h3>

            <form onSubmit={handleSaveKegiatan} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Seksi Pelayanan</label>
                  <select
                    value={kegiatanForm.seksi || 'SPB'}
                    onChange={(e) =>
                      setKegiatanForm({ ...kegiatanForm, seksi: e.target.value as any })
                    }
                    className="w-full px-3 py-2 bg-white text-slate-900 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium shadow-sm"
                  >
                    <option value="SPB" className="bg-white text-slate-900">SPB (Bapak)</option>
                    <option value="SPPer" className="bg-white text-slate-900">SPPer (Perempuan)</option>
                    <option value="SPPR/P" className="bg-white text-slate-900">SPPR/P (Pemuda & Remaja)</option>
                    <option value="SPA" className="bg-white text-slate-900">SPA (Anak / Sek. Minggu)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Kategori Program</label>
                  <select
                    value={kegiatanForm.kategori || 'Ibadah / Kebaktian Seksi'}
                    onChange={(e) =>
                      setKegiatanForm({ ...kegiatanForm, kategori: e.target.value as any })
                    }
                    className="w-full px-3 py-2 bg-white text-slate-900 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium shadow-sm"
                  >
                    <option value="Ibadah / Kebaktian Seksi" className="bg-white text-slate-900">Ibadah / Kebaktian Seksi</option>
                    <option value="Pembinaan / Pelatihan" className="bg-white text-slate-900">Pembinaan / Pelatihan</option>
                    <option value="Aksi Kasih / Sosial" className="bg-white text-slate-900">Aksi Kasih / Sosial</option>
                    <option value="Penggalangan Dana" className="bg-white text-slate-900">Penggalangan Dana</option>
                    <option value="Latihan Vokal Group / Paduan Suara" className="bg-white text-slate-900">Latihan Vokal Group / PS</option>
                    <option value="Retreat / Camping" className="bg-white text-slate-900">Retreat / Camping</option>
                    <option value="Lain-lain" className="bg-white text-slate-900">Lain-lain</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nama Program Kerja</label>
                <input
                  type="text"
                  required
                  value={kegiatanForm.namaProgram || ''}
                  onChange={(e) => setKegiatanForm({ ...kegiatanForm, namaProgram: e.target.value })}
                  placeholder="Contoh: Kebaktian Rutin Seksi Bapak & Kebersamaan"
                  className="w-full px-3 py-2 bg-white text-slate-900 placeholder:text-slate-400 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium shadow-sm"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tanggal</label>
                  <input
                    type="date"
                    required
                    value={kegiatanForm.tanggal || ''}
                    onChange={(e) => setKegiatanForm({ ...kegiatanForm, tanggal: e.target.value })}
                    className="w-full px-3 py-2 bg-white text-slate-900 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium shadow-sm"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Waktu</label>
                  <input
                    type="text"
                    required
                    value={kegiatanForm.waktu || ''}
                    onChange={(e) => setKegiatanForm({ ...kegiatanForm, waktu: e.target.value })}
                    placeholder="18:00 WIB"
                    className="w-full px-3 py-2 bg-white text-slate-900 placeholder:text-slate-400 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium shadow-sm"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Penanggung Jawab</label>
                  <input
                    type="text"
                    required
                    value={kegiatanForm.penanggungJawab || ''}
                    onChange={(e) => setKegiatanForm({ ...kegiatanForm, penanggungJawab: e.target.value })}
                    placeholder="Nama Koordinator"
                    className="w-full px-3 py-2 bg-white text-slate-900 placeholder:text-slate-400 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium shadow-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tempat Pelaksanaan</label>
                <input
                  type="text"
                  required
                  value={kegiatanForm.tempat || ''}
                  onChange={(e) => setKegiatanForm({ ...kegiatanForm, tempat: e.target.value })}
                  placeholder="Gedung Gereja Utama / Ruang Serbaguna"
                  className="w-full px-3 py-2 bg-white text-slate-900 placeholder:text-slate-400 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium shadow-sm"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Estimasi Anggaran (Rp)</label>
                  <input
                    type="number"
                    value={kegiatanForm.anggaranEstimasi ?? ''}
                    onChange={(e) =>
                      setKegiatanForm({ ...kegiatanForm, anggaranEstimasi: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 bg-white text-slate-900 placeholder:text-slate-400 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium shadow-sm"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Realisasi Biaya (Rp)</label>
                  <input
                    type="number"
                    value={kegiatanForm.realisasiBiaya ?? ''}
                    onChange={(e) =>
                      setKegiatanForm({ ...kegiatanForm, realisasiBiaya: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 bg-white text-slate-900 placeholder:text-slate-400 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium shadow-sm"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Status Program</label>
                  <select
                    value={kegiatanForm.status || 'Rencana'}
                    onChange={(e) =>
                      setKegiatanForm({ ...kegiatanForm, status: e.target.value as any })
                    }
                    className="w-full px-3 py-2 bg-white text-slate-900 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium shadow-sm"
                  >
                    <option value="Rencana" className="bg-white text-slate-900">Rencana</option>
                    <option value="Berlangsung" className="bg-white text-slate-900">Berlangsung</option>
                    <option value="Selesai" className="bg-white text-slate-900">Selesai</option>
                    <option value="Batal" className="bg-white text-slate-900">Batal</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Keterangan Tambahan</label>
                <input
                  type="text"
                  value={kegiatanForm.keterangan || ''}
                  onChange={(e) => setKegiatanForm({ ...kegiatanForm, keterangan: e.target.value })}
                  placeholder="Catatan khusus atau agenda acara..."
                  className="w-full px-3 py-2 bg-white text-slate-900 placeholder:text-slate-400 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium shadow-sm"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsKegiatanModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-sm hover:shadow transition-all cursor-pointer"
                >
                  Simpan Program
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Input Transaksi Kas Seksi */}
      {isKasModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl relative animate-in fade-in zoom-in-95 border border-slate-200 text-slate-900">
            <h3 className="text-lg font-bold text-slate-900 border-b border-slate-200 pb-3 mb-4">
              Input Transaksi Kas Seksi Pelayanan
            </h3>

            <form onSubmit={handleSaveKas} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Target Seksi Pelayanan</label>
                <select
                  value={kasForm.seksi || 'SPB'}
                  onChange={(e) => setKasForm({ ...kasForm, seksi: e.target.value as any })}
                  className="w-full px-3 py-2.5 bg-white text-slate-900 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium text-xs shadow-sm"
                >
                  <option value="SPB" className="bg-white text-slate-900">SPB (Seksi Bapak)</option>
                  <option value="SPPer" className="bg-white text-slate-900">SPPer (Seksi Perempuan)</option>
                  <option value="SPPR/P" className="bg-white text-slate-900">SPPR/P (Seksi Pemuda & Remaja)</option>
                  <option value="SPA" className="bg-white text-slate-900">SPA (Seksi Anak / Sek. Minggu)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Jenis Transaksi</label>
                  <select
                    value={kasForm.jenis || 'masuk'}
                    onChange={(e) => setKasForm({ ...kasForm, jenis: e.target.value as any })}
                    className="w-full px-3 py-2.5 bg-white text-slate-900 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium text-xs shadow-sm"
                  >
                    <option value="masuk" className="bg-white text-slate-900">Pemasukan / Penerimaan (+)</option>
                    <option value="keluar" className="bg-white text-slate-900">Pengeluaran / Biaya (-)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tanggal</label>
                  <input
                    type="date"
                    required
                    value={kasForm.tanggal || ''}
                    onChange={(e) => setKasForm({ ...kasForm, tanggal: e.target.value })}
                    className="w-full px-3 py-2.5 bg-white text-slate-900 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium text-xs shadow-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Jumlah Uang (Rp)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-xs">
                    Rp
                  </span>
                  <input
                    type="number"
                    required
                    min="1"
                    value={kasForm.jumlah || ''}
                    onChange={(e) => setKasForm({ ...kasForm, jumlah: Number(e.target.value) })}
                    placeholder="0"
                    className="w-full pl-9 pr-3 py-2.5 bg-white text-slate-900 placeholder:text-slate-400 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-bold text-sm shadow-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Keterangan Transaksi</label>
                <input
                  type="text"
                  required
                  value={kasForm.keterangan || ''}
                  onChange={(e) => setKasForm({ ...kasForm, keterangan: e.target.value })}
                  placeholder="Contoh: Persembahan Kebaktian Bulanan SPB / Iuran Sembako SPPer"
                  className="w-full px-3 py-2.5 bg-white text-slate-900 placeholder:text-slate-400 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium text-xs shadow-sm"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsKasModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium cursor-pointer transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl cursor-pointer shadow-sm hover:shadow transition-all"
                >
                  Simpan ke Buku Kas
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Confirm Delete Kegiatan */}
      <DeleteConfirmModal
        isOpen={!!deleteTarget}
        title="Konfirmasi Hapus Program Kerja"
        itemName={deleteTarget?.name || ''}
        onConfirm={async () => {
          if (deleteTarget && deleteTarget.type === 'kegiatan') {
            await deleteKegiatanKategorial(deleteTarget.id);
          }
        }}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
};
