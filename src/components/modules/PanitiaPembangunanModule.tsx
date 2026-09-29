import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Hammer,
  HardHat,
  Building,
  DollarSign,
  Plus,
  Edit2,
  Trash2,
  Search,
  Printer,
  Phone,
  CheckCircle2,
  Clock,
  Briefcase,
  TrendingUp,
  AlertCircle,
  FileText,
  UserCheck,
  Calendar,
  X,
  Coins,
  ChevronDown,
  Check,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { PengurusPembangunan, ProyekPembangunan, KeuanganItem } from '../../types';
import { formatIndonesianDate } from '../../utils/dateUtils';

const DEFAULT_JABATAN_PANITIA = [
  'Ketua Panitia Pembangunan',
  'Wakil Ketua Panitia Pembangunan',
  'Sekretaris Panitia Pembangunan',
  'Wakil Sekretaris Panitia Pembangunan',
  'Bendahara Panitia Pembangunan',
  'Wakil Bendahara Panitia Pembangunan',
  'Koordinator Seksi Teknis & Perencanaan',
  'Koordinator Seksi Pengawasan & Konstruksi',
  'Koordinator Seksi Usaha Dana / Penggalian Dana',
  'Koordinator Seksi Logistik & Pengadaan Bahan',
  'Koordinator Seksi Konsumsi & Akomodasi',
  'Koordinator Seksi Publikasi, Dokumentasi & Humas',
  'Koordinator Seksi Keamanan & Perlengkapan',
  'Koordinator Teknis & Pengawasan',
  'Anggota Seksi Teknis Lapangan',
  'Anggota Seksi Penggalian Dana',
  'Anggota Seksi Logistik & Bahan',
  'Anggota Panitia Pembangunan',
  'Penasihat / Pembina Panitia Pembangunan',
];

export const PanitiaPembangunanModule: React.FC = () => {
  const {
    pengurusPembangunanList,
    addPengurusPembangunan,
    updatePengurusPembangunan,
    deletePengurusPembangunan,
    proyekPembangunanList,
    addProyekPembangunan,
    updateProyekPembangunan,
    deleteProyekPembangunan,
    keuanganList,
    addKeuanganItem,
    openPrintReport,
    settings,
    jabatanList,
  } = useApp();

  const [activeSubTab, setActiveSubTab] = useState<'panitia' | 'proyek' | 'kas'>('proyek');
  const [searchTerm, setSearchTerm] = useState('');

  // Modals
  const [isPanitiaModalOpen, setIsPanitiaModalOpen] = useState(false);
  const [editingPanitia, setEditingPanitia] = useState<PengurusPembangunan | null>(null);
  const [panitiaForm, setPanitiaForm] = useState<Omit<PengurusPembangunan, 'id'>>({
    jabatan: 'Ketua Panitia Pembangunan',
    nama: '',
    gelar: '',
    periode: '2024 - 2026',
    noHp: '',
    alamat: '',
    status: 'Aktif',
  });

  const [isJabatanDropdownOpen, setIsJabatanDropdownOpen] = useState(false);
  const jabatanComboboxRef = useRef<HTMLDivElement>(null);

  // Close combobox dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (jabatanComboboxRef.current && !jabatanComboboxRef.current.contains(e.target as Node)) {
        setIsJabatanDropdownOpen(false);
      }
    };
    if (isJabatanDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isJabatanDropdownOpen]);

  const availableJabatanOptions = useMemo(() => {
    const customFromDB = (jabatanList || [])
      .filter((j) => j.aktif !== false)
      .map((j) => j.nama);

    const fromExisting = pengurusPembangunanList
      .map((p) => p.jabatan)
      .filter(Boolean);

    return Array.from(new Set([...DEFAULT_JABATAN_PANITIA, ...customFromDB, ...fromExisting]));
  }, [jabatanList, pengurusPembangunanList]);

  const filteredJabatanOptions = useMemo(() => {
    const query = (panitiaForm.jabatan || '').trim().toLowerCase();
    if (!query) return availableJabatanOptions;
    return availableJabatanOptions.filter((opt) => opt.toLowerCase().includes(query));
  }, [availableJabatanOptions, panitiaForm.jabatan]);

  const [deleteTarget, setDeleteTarget] = useState<{
    type: 'panitia' | 'proyek';
    id: string;
    nama: string;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [isProyekModalOpen, setIsProyekModalOpen] = useState(false);
  const [editingProyek, setEditingProyek] = useState<ProyekPembangunan | null>(null);
  const [proyekForm, setProyekForm] = useState<Omit<ProyekPembangunan, 'id'>>({
    namaProyek: '',
    kategoriProyek: 'Pembuatan Pagar / Kanopi',
    targetAnggaran: 50000000,
    realisasiAnggaran: 0,
    progresPersen: 0,
    tanggalMulai: new Date().toISOString().split('T')[0],
    targetSelesai: new Date(Date.now() + 90 * 86400000).toISOString().split('T')[0],
    status: 'Perencanaan',
    penanggungJawabTeknis: '',
    keterangan: '',
  });

  const [isKasModalOpen, setIsKasModalOpen] = useState(false);
  const [kasForm, setKasForm] = useState<{
    jenis: 'masuk' | 'keluar';
    jumlah: number;
    keterangan: string;
    tanggal: string;
  }>({
    jenis: 'masuk',
    jumlah: 0,
    keterangan: '',
    tanggal: new Date().toISOString().split('T')[0],
  });

  // Filtered Lists
  const filteredPanitia = useMemo(() => {
    return pengurusPembangunanList.filter(
      (p) =>
        (p.nama || p.namaLengkap || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.jabatan || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [pengurusPembangunanList, searchTerm]);

  const filteredProyek = useMemo(() => {
    return proyekPembangunanList.filter(
      (pr) =>
        (pr.namaProyek || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (pr.penanggungJawabTeknis || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (pr.kategoriProyek || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [proyekPembangunanList, searchTerm]);

  // Financial transactions for Panitia Pembangunan
  const pembangunanKeuanganList = useMemo(() => {
    return keuanganList.filter((k) => {
      if (k.status === 'ditolak') return false;
      const pos = (k.posAnggaran || '').toUpperCase();
      const ket = (k.keterangan || '').toUpperCase();
      const pk = (k.posKas || '').toUpperCase();
      const kat = (k.kategori || '').toUpperCase();
      const tipe = (k.tipe || '').toUpperCase();
      const kasSumber = (k.kasSumber || '').toUpperCase();
      return (
        pk.includes('PEMBANGUNAN') ||
        pos.includes('PEMBANGUNAN') ||
        ket.includes('PEMBANGUNAN') ||
        kat.includes('PEMBANGUNAN') ||
        tipe.includes('PEMBANGUNAN') ||
        kasSumber.includes('PEMBANGUNAN') ||
        pos.includes('RENOVASI') ||
        ket.includes('RENOVASI') ||
        kat.includes('RENOVASI') ||
        pos.includes('KANOPI') ||
        ket.includes('KANOPI') ||
        pos.includes('DONATUR') ||
        ket.includes('DONATUR') ||
        pos.includes('JANJI IMAN') ||
        ket.includes('JANJI IMAN') ||
        kat.includes('JANJI IMAN') ||
        kat.includes('BAHAN BANGUNAN') ||
        kat.includes('UPAH TUKANG') ||
        kat.includes('KUPON PEMBANGUNAN') ||
        kat.includes('IURAN PEMBANGUNAN') ||
        pk.includes('KUPON') ||
        pk.includes('IURAN PEMBANGUNAN')
      );
    });
  }, [keuanganList]);

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

  const totalKasPembangunanMasuk = useMemo(() => {
    return pembangunanKeuanganList.reduce((acc, curr) => acc + getMasukVal(curr), 0);
  }, [pembangunanKeuanganList]);

  const totalKasPembangunanKeluar = useMemo(() => {
    return pembangunanKeuanganList.reduce((acc, curr) => acc + getKeluarVal(curr), 0);
  }, [pembangunanKeuanganList]);

  const saldoPembangunan = totalKasPembangunanMasuk - totalKasPembangunanKeluar;

  const totalTargetAnggaranProyek = useMemo(() => {
    return proyekPembangunanList.reduce((acc, curr) => acc + (curr.targetAnggaran || 0), 0);
  }, [proyekPembangunanList]);

  // Handlers for Panitia Modal
  const handleOpenAddPanitia = () => {
    setEditingPanitia(null);
    setPanitiaForm({
      jabatan: 'Ketua Panitia Pembangunan',
      nama: '',
      gelar: '',
      periode: '2024 - 2026',
      noHp: '',
      alamat: '',
      status: 'Aktif',
    });
    setIsPanitiaModalOpen(true);
  };

  const handleOpenEditPanitia = (p: PengurusPembangunan) => {
    setEditingPanitia(p);
    setPanitiaForm({
      jabatan: p.jabatan,
      nama: p.nama,
      gelar: p.gelar || '',
      periode: p.periode,
      noHp: p.noHp,
      alamat: p.alamat || '',
      status: p.status,
    });
    setIsPanitiaModalOpen(true);
  };

  const handleSavePanitia = (e: React.FormEvent) => {
    e.preventDefault();
    if (!panitiaForm.nama.trim()) return;

    if (editingPanitia) {
      updatePengurusPembangunan(editingPanitia.id, panitiaForm);
    } else {
      addPengurusPembangunan(panitiaForm);
    }
    setIsPanitiaModalOpen(false);
  };

  const handleDeletePanitia = (id: string, nama: string) => {
    setDeleteTarget({ type: 'panitia', id, nama });
  };

  const handleDeleteProyek = (id: string, nama: string) => {
    setDeleteTarget({ type: 'proyek', id, nama });
  };

  const confirmExecuteDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      if (deleteTarget.type === 'panitia') {
        await deletePengurusPembangunan(deleteTarget.id);
      } else {
        await deleteProyekPembangunan(deleteTarget.id);
      }
    } catch (err) {
      console.error('Error deleting item:', err);
    } finally {
      setIsDeleting(false);
      setDeleteTarget(null);
    }
  };

  // Handlers for Proyek Modal
  const handleOpenAddProyek = () => {
    setEditingProyek(null);
    setProyekForm({
      namaProyek: '',
      kategoriProyek: 'Pembuatan Pagar / Kanopi',
      targetAnggaran: 50000000,
      realisasiAnggaran: 0,
      progresPersen: 0,
      tanggalMulai: new Date().toISOString().split('T')[0],
      targetSelesai: new Date(Date.now() + 90 * 86400000).toISOString().split('T')[0],
      status: 'Perencanaan',
      penanggungJawabTeknis: '',
      keterangan: '',
    });
    setIsProyekModalOpen(true);
  };

  const handleOpenEditProyek = (pr: ProyekPembangunan) => {
    setEditingProyek(pr);
    setProyekForm({
      namaProyek: pr.namaProyek,
      kategoriProyek: pr.kategoriProyek,
      targetAnggaran: pr.targetAnggaran,
      realisasiAnggaran: pr.realisasiAnggaran,
      progresPersen: pr.progresPersen,
      tanggalMulai: pr.tanggalMulai,
      targetSelesai: pr.targetSelesai,
      status: pr.status,
      penanggungJawabTeknis: pr.penanggungJawabTeknis,
      keterangan: pr.keterangan || '',
    });
    setIsProyekModalOpen(true);
  };

  const handleSaveProyek = (e: React.FormEvent) => {
    e.preventDefault();
    if (!proyekForm.namaProyek.trim()) return;

    if (editingProyek) {
      updateProyekPembangunan(editingProyek.id, proyekForm);
    } else {
      addProyekPembangunan(proyekForm);
    }
    setIsProyekModalOpen(false);
  };

  // Handlers for Kas Donasi Pembangunan
  const handleSaveKas = (e: React.FormEvent) => {
    e.preventDefault();
    if (kasForm.jumlah <= 0 || !kasForm.keterangan.trim()) return;

    const item: Omit<KeuanganItem, 'id'> = {
      tanggal: kasForm.tanggal,
      jenis: kasForm.jenis === 'masuk' ? 'pemasukan' : 'pengeluaran',
      posKas: 'Kas Pembangunan',
      kategori: 'Pembangunan & Renovasi',
      jumlah: kasForm.jumlah,
      keterangan: `[PEMBANGUNAN] ${kasForm.keterangan}`,
      noReferensi: `PEMB-${Date.now().toString().slice(-6)}`,
      posAnggaran: 'Kas Panitia Pembangunan Gereja',
      masuk: kasForm.jenis === 'masuk' ? kasForm.jumlah : 0,
      keluar: kasForm.jenis === 'keluar' ? kasForm.jumlah : 0,
      tipe: kasForm.jenis === 'masuk' ? 'penerimaan' : 'pengeluaran',
      kasSumber: 'Kas Pembangunan',
      status: 'disetujui',
    };

    addKeuanganItem(item);
    setIsKasModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Banner Header */}
      <div className="bg-gradient-to-r from-amber-900 via-stone-900 to-slate-900 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-1/4 -translate-y-1/4 opacity-10 pointer-events-none">
          <Hammer className="w-96 h-96 text-white" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-amber-300 font-semibold text-xs tracking-wider uppercase mb-1">
              <HardHat className="w-4 h-4" />
              <span>Pembangunan & Infrastruktur Gereja</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
              Panitia Pembangunan GKE
            </h1>
            <p className="text-amber-100/80 text-sm mt-1 max-w-2xl">
              Manajemen struktur panitia, progres pengerjaan fisik proyek, donasi janji iman, serta akuntabilitas pencatatan dana pembangunan.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => openPrintReport('panitia_pembangunan')}
              className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white backdrop-blur-md px-4 py-2.5 rounded-xl font-medium text-sm transition-all shadow-sm border border-white/20"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Laporan Pembangunan</span>
            </button>
            <button
              onClick={handleOpenAddProyek}
              className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-4 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-md hover:shadow-lg"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Proyek Baru</span>
            </button>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6 pt-6 border-t border-white/10">
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-3">
            <p className="text-xs text-amber-200">Total Target Anggaran Proyek</p>
            <p className="text-xl font-bold mt-0.5 text-white">
              Rp {totalTargetAnggaranProyek.toLocaleString('id-ID')}
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-3">
            <p className="text-xs text-amber-200">Dana Terkumpul (Donasi / Kas)</p>
            <p className="text-xl font-bold mt-0.5 text-emerald-300">
              Rp {totalKasPembangunanMasuk.toLocaleString('id-ID')}
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-3">
            <p className="text-xs text-amber-200">Total Pengeluaran Fisik</p>
            <p className="text-xl font-bold mt-0.5 text-red-300">
              Rp {totalKasPembangunanKeluar.toLocaleString('id-ID')}
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-3">
            <p className="text-xs text-amber-200">Sisa Saldo Kas Pembangunan</p>
            <p className="text-xl font-bold mt-0.5 text-amber-300">
              Rp {saldoPembangunan.toLocaleString('id-ID')}
            </p>
          </div>
        </div>
      </div>

      {/* Sub-Tabs & Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-200 pb-2">
        <nav className="flex space-x-6">
          <button
            onClick={() => setActiveSubTab('proyek')}
            className={`pb-3 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
              activeSubTab === 'proyek'
                ? 'border-amber-600 text-amber-700'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Building className="w-4 h-4" />
            <span>Agenda & Proyek Fisik</span>
            <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full text-xs">
              {filteredProyek.length}
            </span>
          </button>
          <button
            onClick={() => setActiveSubTab('panitia')}
            className={`pb-3 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
              activeSubTab === 'panitia'
                ? 'border-amber-600 text-amber-700'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <HardHat className="w-4 h-4" />
            <span>Struktur Panitia Pembangunan</span>
            <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full text-xs">
              {filteredPanitia.length}
            </span>
          </button>
          <button
            onClick={() => setActiveSubTab('kas')}
            className={`pb-3 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
              activeSubTab === 'kas'
                ? 'border-amber-600 text-amber-700'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <DollarSign className="w-4 h-4" />
            <span>Kas & Donasi Pembangunan</span>
            <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full text-xs">
              {pembangunanKeuanganList.length}
            </span>
          </button>
        </nav>

        <div className="flex items-center gap-2 pb-2">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari proyek / nama panitia..."
              className="pl-9 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
            />
          </div>

          {activeSubTab === 'proyek' && (
            <button
              onClick={handleOpenAddProyek}
              className="bg-amber-600 hover:bg-amber-700 text-white px-3 py-1.5 rounded-xl font-semibold text-xs inline-flex items-center gap-1.5 transition-all shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Proyek</span>
            </button>
          )}
          {activeSubTab === 'panitia' && (
            <button
              onClick={handleOpenAddPanitia}
              className="bg-amber-600 hover:bg-amber-700 text-white px-3 py-1.5 rounded-xl font-semibold text-xs inline-flex items-center gap-1.5 transition-all shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Panitia</span>
            </button>
          )}
          {activeSubTab === 'kas' && (
            <button
              onClick={() => {
                setKasForm({
                  jenis: 'masuk',
                  jumlah: 0,
                  keterangan: '',
                  tanggal: new Date().toISOString().split('T')[0],
                });
                setIsKasModalOpen(true);
              }}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-xl font-semibold text-xs inline-flex items-center gap-1.5 transition-all shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Input Kas Pembangunan</span>
            </button>
          )}
        </div>
      </div>

      {/* Sub-Tab 1: Proyek Pembangunan */}
      {activeSubTab === 'proyek' && (
        <div className="space-y-4">
          {filteredProyek.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
              <Building className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-gray-800">Belum Ada Proyek Pembangunan</h3>
              <p className="text-xs text-gray-500 mt-1 max-w-md mx-auto">
                Silakan tambahkan proyek pembangunan atau renovasi gedung gereja.
              </p>
              <button
                onClick={handleOpenAddProyek}
                className="mt-4 inline-flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-xl text-xs font-semibold"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Proyek Baru</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredProyek.map((pr) => (
                <div
                  key={pr.id}
                  className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                        {pr.kategoriProyek}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          pr.status === 'Selesai'
                            ? 'bg-emerald-100 text-emerald-800'
                            : pr.status === 'Proses Pekerjaan'
                            ? 'bg-blue-100 text-blue-800'
                            : pr.status === 'Tertunda'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {pr.status}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-gray-900 leading-snug">{pr.namaProyek}</h3>
                    {pr.keterangan && (
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">{pr.keterangan}</p>
                    )}

                    {/* Progress Bar */}
                    <div className="mt-4 bg-gray-50 p-3 rounded-xl border border-gray-100">
                      <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
                        <span className="text-gray-600">Progres Pekerjaan Fisik</span>
                        <span className="text-amber-700 font-bold">{pr.progresPersen}%</span>
                      </div>
                      <div className="w-full h-2.5 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-amber-500 rounded-full transition-all duration-500"
                          style={{ width: `${pr.progresPersen}%` }}
                        />
                      </div>
                    </div>

                    {/* Financial details */}
                    <div className="mt-3 text-xs space-y-1 text-gray-600">
                      <div className="flex items-center justify-between">
                        <span>Target Anggaran:</span>
                        <span className="font-bold text-gray-900">
                          Rp {pr.targetAnggaran.toLocaleString('id-ID')}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Realisasi Dana:</span>
                        <span className="font-semibold text-emerald-600">
                          Rp {pr.realisasiAnggaran.toLocaleString('id-ID')}
                        </span>
                      </div>
                      <div className="flex items-center justify-between pt-1 text-[11px] text-gray-500">
                        <span>Penanggung Jawab Teknis:</span>
                        <span className="font-medium text-gray-800">{pr.penanggungJawabTeknis}</span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-gray-500">
                        <span>Timeline:</span>
                        <span>
                          {pr.tanggalMulai} s.d {pr.targetSelesai}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-end gap-2">
                    <button
                      onClick={() => handleOpenEditProyek(pr)}
                      className="p-1.5 text-gray-600 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all"
                      title="Edit Proyek"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteProyek(pr.id, pr.namaProyek)}
                      className="p-1.5 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                      title="Hapus Proyek"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Sub-Tab 2: Struktur Panitia Pembangunan */}
      {activeSubTab === 'panitia' && (
        <div className="space-y-4">
          {filteredPanitia.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
              <HardHat className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-gray-800">Belum Ada Struktur Panitia</h3>
              <p className="text-xs text-gray-500 mt-1 max-w-md mx-auto">
                Silakan bentuk panitia pembangunan gereja untuk mengelola proyek fisik.
              </p>
              <button
                onClick={handleOpenAddPanitia}
                className="mt-4 inline-flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-xl text-xs font-semibold"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Panitia</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredPanitia.map((p) => (
                <div
                  key={p.id}
                  className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center font-bold border border-amber-200 shrink-0">
                          {p.nama.charAt(0)}
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-gray-900 leading-snug">
                            {p.nama} {p.gelar ? `, ${p.gelar}` : ''}
                          </h3>
                          <p className="text-xs font-semibold text-amber-700">{p.jabatan}</p>
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
                        <span>Periode SK:</span>
                        <span className="font-semibold text-gray-800">{p.periode}</span>
                      </div>
                      {p.noHp && (
                        <div className="flex items-center justify-between">
                          <span>No. Telepon/WA:</span>
                          <a
                            href={`https://wa.me/${p.noHp.replace(/[^0-9]/g, '')}`}
                            target="_blank"
                            rel="noreferrer"
                            className="font-semibold text-emerald-600 hover:underline flex items-center gap-1"
                          >
                            <Phone className="w-3 h-3" />
                            <span>{p.noHp}</span>
                          </a>
                        </div>
                      )}
                      {p.alamat && (
                        <p className="text-gray-500 truncate pt-1">
                          <span className="font-medium">Alamat:</span> {p.alamat}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-gray-100 flex items-center justify-end gap-2">
                    <button
                      onClick={() => handleOpenEditPanitia(p)}
                      className="p-1.5 text-gray-600 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all"
                      title="Edit Panitia"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeletePanitia(p.id, p.nama)}
                      className="p-1.5 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                      title="Hapus Panitia"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Sub-Tab 3: Kas & Donasi Pembangunan */}
      {activeSubTab === 'kas' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm">
              <span className="text-xs text-gray-500">Total Transaksi Kas Pembangunan</span>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {pembangunanKeuanganList.length} Transaksi
              </p>
            </div>
            <div className="bg-white rounded-2xl p-4 border border-emerald-100 shadow-sm">
              <span className="text-xs text-emerald-600 font-medium">Total Donasi & Penerimaan</span>
              <p className="text-2xl font-bold text-emerald-600 mt-1">
                Rp {totalKasPembangunanMasuk.toLocaleString('id-ID')}
              </p>
            </div>
            <div className="bg-white rounded-2xl p-4 border border-red-100 shadow-sm">
              <span className="text-xs text-red-600 font-medium">Total Pengeluaran Pembangunan</span>
              <p className="text-2xl font-bold text-red-600 mt-1">
                Rp {totalKasPembangunanKeluar.toLocaleString('id-ID')}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-900">
                Laporan Transaksi Kas & Donasi Janji Iman Pembangunan
              </h3>
              <button
                onClick={() => {
                  setKasForm({
                    jenis: 'masuk',
                    jumlah: 0,
                    keterangan: '',
                    tanggal: new Date().toISOString().split('T')[0],
                  });
                  setIsKasModalOpen(true);
                }}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Input Kas Pembangunan</span>
              </button>
            </div>

            {pembangunanKeuanganList.length === 0 ? (
              <div className="p-8 text-center text-gray-500 text-xs">
                Belum ada transaksi khusus kas pembangunan. Klik "Input Kas Pembangunan" di atas.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-semibold uppercase tracking-wider">
                    <tr>
                      <th className="px-4 py-3">Tanggal</th>
                      <th className="px-4 py-3">Keterangan / Donatur</th>
                      <th className="px-4 py-3">Pos Anggaran</th>
                      <th className="px-4 py-3 text-right">Pemasukan (Rp)</th>
                      <th className="px-4 py-3 text-right">Pengeluaran (Rp)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {pembangunanKeuanganList.map((k) => {
                      const itemMasuk = getMasukVal(k);
                      const itemKeluar = getKeluarVal(k);
                      return (
                        <tr key={k.id} className="hover:bg-gray-50/80">
                          <td className="px-4 py-3 font-medium text-gray-700">{formatIndonesianDate(k.tanggal)}</td>
                          <td className="px-4 py-3 font-medium text-gray-900">{k.keterangan}</td>
                          <td className="px-4 py-3 text-gray-600">{k.posAnggaran || k.posKas || 'Kas Pembangunan'}</td>
                          <td className="px-4 py-3 text-right text-emerald-600 font-semibold">
                            {itemMasuk > 0 ? `Rp ${itemMasuk.toLocaleString('id-ID')}` : '-'}
                          </td>
                          <td className="px-4 py-3 text-right text-red-600 font-semibold">
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

      {/* Modal: Tambah/Edit Panitia */}
      {isPanitiaModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-hidden animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl flex flex-col max-h-[92dvh] sm:max-h-[88vh] overflow-hidden my-auto border border-slate-200">
            <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between shrink-0 bg-slate-50">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <HardHat className="w-4 h-4 text-amber-600" />
                <span>{editingPanitia ? 'Edit Anggota Panitia' : 'Tambah Panitia Pembangunan Baru'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsPanitiaModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePanitia} className="flex flex-col flex-1 min-h-0 overflow-hidden text-xs">
              <div className="p-4 sm:p-5 space-y-4 flex-1 overflow-y-auto overscroll-contain">
                <div ref={jabatanComboboxRef} className="relative">
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-bold text-slate-900 text-xs flex items-center gap-1.5">
                      <Briefcase className="w-3.5 h-3.5 text-amber-600" />
                      <span>Jabatan dalam Panitia</span>
                    </label>
                    <span className="text-[10px] text-slate-500 font-medium">Pilih atau Ketik Jabatan</span>
                  </div>

                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={panitiaForm.jabatan || ''}
                      onChange={(e) => {
                        setPanitiaForm({ ...panitiaForm, jabatan: e.target.value });
                        setIsJabatanDropdownOpen(true);
                      }}
                      onFocus={() => setIsJabatanDropdownOpen(true)}
                      placeholder="Pilih atau ketik jabatan panitia..."
                      className="w-full p-2.5 pr-16 bg-white border border-slate-300 rounded-xl text-slate-900 font-bold text-xs placeholder:text-slate-400 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 focus:outline-none shadow-xs transition"
                    />

                    <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
                      {panitiaForm.jabatan && (
                        <button
                          type="button"
                          onClick={() => {
                            setPanitiaForm({ ...panitiaForm, jabatan: '' });
                            setIsJabatanDropdownOpen(true);
                          }}
                          className="p-1 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-100 transition cursor-pointer"
                          title="Hapus / Kosongkan"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setIsJabatanDropdownOpen((prev) => !prev)}
                        className="p-1.5 text-slate-500 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition cursor-pointer"
                        title="Buka Pilihan Jabatan"
                      >
                        <ChevronDown
                          className={`w-4 h-4 transition-transform duration-200 ${
                            isJabatanDropdownOpen ? 'rotate-180 text-amber-600' : ''
                          }`}
                        />
                      </button>
                    </div>
                  </div>

                  {/* Quick Preset Buttons */}
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {[
                      'Ketua Panitia Pembangunan',
                      'Sekretaris Panitia Pembangunan',
                      'Bendahara Panitia Pembangunan',
                      'Koordinator Teknis & Pengawasan',
                      'Anggota Panitia Pembangunan',
                    ].map((role) => {
                      const isSelected = panitiaForm.jabatan === role;
                      const shortLabel = role.replace(' Panitia Pembangunan', '');
                      return (
                        <button
                          key={role}
                          type="button"
                          onClick={() => {
                            setPanitiaForm({ ...panitiaForm, jabatan: role });
                            setIsJabatanDropdownOpen(false);
                          }}
                          className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold border transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                              : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-amber-50 hover:border-amber-300 hover:text-amber-900'
                          }`}
                        >
                          {shortLabel}
                        </button>
                      );
                    })}
                  </div>

                  {/* Combobox Dropdown Popover */}
                  {isJabatanDropdownOpen && (
                    <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-white rounded-xl border border-slate-200 shadow-xl overflow-hidden max-h-56 flex flex-col animate-in fade-in slide-in-from-top-1 duration-150">
                      <div className="px-3 py-1.5 bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-500 flex items-center justify-between">
                        <span>DAFTAR JABATAN PANITIA ({filteredJabatanOptions.length})</span>
                        <span className="text-amber-600 font-normal">Klik untuk memilih</span>
                      </div>

                      <div className="overflow-y-auto overscroll-contain divide-y divide-slate-100 flex-1 p-1">
                        {filteredJabatanOptions.length > 0 ? (
                          filteredJabatanOptions.map((opt) => {
                            const isSelected =
                              panitiaForm.jabatan.trim().toLowerCase() === opt.trim().toLowerCase();
                            return (
                              <button
                                key={opt}
                                type="button"
                                onClick={() => {
                                  setPanitiaForm({ ...panitiaForm, jabatan: opt });
                                  setIsJabatanDropdownOpen(false);
                                }}
                                className={`w-full px-3 py-2 text-left rounded-lg text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer ${
                                  isSelected
                                    ? 'bg-amber-50 text-amber-900 font-bold'
                                    : 'text-slate-800 hover:bg-slate-50'
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  <Briefcase
                                    className={`w-3.5 h-3.5 ${
                                      isSelected ? 'text-amber-600' : 'text-slate-400'
                                    }`}
                                  />
                                  <span>{opt}</span>
                                </div>
                                {isSelected && <Check className="w-4 h-4 text-amber-600 shrink-0" />}
                              </button>
                            );
                          })
                        ) : (
                          <div className="p-3 text-center">
                            <p className="text-xs text-slate-600 font-medium">
                              Tidak ada opsi preset yang cocok dengan &quot;{panitiaForm.jabatan}&quot;
                            </p>
                            {panitiaForm.jabatan.trim() && (
                              <button
                                type="button"
                                onClick={() => setIsJabatanDropdownOpen(false)}
                                className="mt-2 text-xs font-bold text-amber-600 hover:text-amber-700 underline cursor-pointer"
                              >
                                Gunakan &quot;{panitiaForm.jabatan}&quot; sebagai nama jabatan khusus
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2">
                    <label className="block font-bold text-slate-900 mb-1">Nama Lengkap</label>
                    <input
                      type="text"
                      required
                      value={panitiaForm.nama || ''}
                      onChange={(e) => setPanitiaForm({ ...panitiaForm, nama: e.target.value })}
                      placeholder="Nama Lengkap Panitia"
                      className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 font-bold text-xs placeholder:text-slate-400 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 focus:outline-none shadow-xs"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-900 mb-1">Gelar (Opsional)</label>
                    <input
                      type="text"
                      value={panitiaForm.gelar || ''}
                      onChange={(e) => setPanitiaForm({ ...panitiaForm, gelar: e.target.value })}
                      placeholder="S.T., M.T."
                      className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 font-bold text-xs placeholder:text-slate-400 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 focus:outline-none shadow-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-900 mb-1">Periode Masa SK</label>
                    <input
                      type="text"
                      required
                      value={panitiaForm.periode || ''}
                      onChange={(e) => setPanitiaForm({ ...panitiaForm, periode: e.target.value })}
                      placeholder="2024 - 2026"
                      className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 font-bold text-xs placeholder:text-slate-400 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 focus:outline-none shadow-xs"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-900 mb-1">No. HP / WhatsApp</label>
                    <input
                      type="text"
                      required
                      value={panitiaForm.noHp || ''}
                      onChange={(e) => setPanitiaForm({ ...panitiaForm, noHp: e.target.value })}
                      placeholder="0812-3456-7890"
                      className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 font-bold text-xs placeholder:text-slate-400 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 focus:outline-none shadow-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-900 mb-1">Alamat Domisili</label>
                  <input
                    type="text"
                    value={panitiaForm.alamat || ''}
                    onChange={(e) => setPanitiaForm({ ...panitiaForm, alamat: e.target.value })}
                    placeholder="Alamat tempat tinggal"
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 font-bold text-xs placeholder:text-slate-400 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 focus:outline-none shadow-xs"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-900 mb-1">Status Keaktifan</label>
                  <select
                    value={panitiaForm.status || 'Aktif'}
                    onChange={(e) =>
                      setPanitiaForm({ ...panitiaForm, status: e.target.value as any })
                    }
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 font-bold text-xs focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 focus:outline-none shadow-xs"
                  >
                    <option value="Aktif" className="text-slate-900 bg-white">Aktif</option>
                    <option value="Demisioner" className="text-slate-900 bg-white">Demisioner</option>
                  </select>
                </div>
              </div>

              <div className="p-3.5 sm:p-4 flex items-center justify-end gap-2 border-t border-slate-200 bg-slate-50 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsPanitiaModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-semibold rounded-xl hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-600 text-white font-bold rounded-xl hover:bg-amber-700 shadow-md transition-colors cursor-pointer"
                >
                  Simpan Panitia
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Tambah/Edit Proyek */}
      {isProyekModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-hidden animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl flex flex-col max-h-[92dvh] sm:max-h-[88vh] overflow-hidden my-auto border border-slate-200">
            <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between shrink-0 bg-slate-50">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Building className="w-4 h-4 text-amber-600" />
                <span>{editingProyek ? 'Edit Proyek Pembangunan' : 'Tambah Proyek Pembangunan Baru'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsProyekModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProyek} className="flex flex-col flex-1 min-h-0 overflow-hidden text-xs">
              <div className="p-4 sm:p-5 space-y-4 flex-1 overflow-y-auto overscroll-contain">
                <div>
                  <label className="block font-bold text-slate-900 mb-1">Nama Proyek Pembangunan / Renovasi</label>
                  <input
                    type="text"
                    required
                    value={proyekForm.namaProyek || ''}
                    onChange={(e) => setProyekForm({ ...proyekForm, namaProyek: e.target.value })}
                    placeholder="Nama Proyek Pembangunan/Renovasi"
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 font-bold text-xs placeholder:text-slate-400 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 focus:outline-none shadow-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-900 mb-1">Kategori Proyek</label>
                    <select
                      value={proyekForm.kategoriProyek || 'Pembuatan Pagar / Kanopi'}
                      onChange={(e) =>
                        setProyekForm({ ...proyekForm, kategoriProyek: e.target.value as any })
                      }
                      className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 font-bold text-xs focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 focus:outline-none shadow-xs"
                    >
                      <option value="Pembuatan Pagar / Kanopi" className="text-slate-900 bg-white">Pembuatan Pagar / Kanopi</option>
                      <option value="Pembangunan Gedung" className="text-slate-900 bg-white">Pembangunan Gedung</option>
                      <option value="Renovasi" className="text-slate-900 bg-white">Renovasi Gedung</option>
                      <option value="Infrastruktur & Parkir" className="text-slate-900 bg-white">Infrastruktur & Parkir</option>
                      <option value="Pengadaan Sound & Alat" className="text-slate-900 bg-white">Pengadaan Sound & Alat</option>
                      <option value="Perbaikan Pastori" className="text-slate-900 bg-white">Perbaikan Pastori</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-slate-900 mb-1">
                      Penanggung Jawab Teknis
                    </label>
                    <input
                      type="text"
                      required
                      value={proyekForm.penanggungJawabTeknis || ''}
                      onChange={(e) =>
                        setProyekForm({ ...proyekForm, penanggungJawabTeknis: e.target.value })
                      }
                      placeholder="Nama Penanggung Jawab Teknis"
                      className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 font-bold text-xs placeholder:text-slate-400 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 focus:outline-none shadow-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block font-bold text-slate-900 mb-1">Target Anggaran (Rp)</label>
                    <input
                      type="number"
                      required
                      value={proyekForm.targetAnggaran ?? ''}
                      onChange={(e) =>
                        setProyekForm({ ...proyekForm, targetAnggaran: Number(e.target.value) })
                      }
                      placeholder="0"
                      className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 font-bold text-xs placeholder:text-slate-400 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 focus:outline-none shadow-xs"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-900 mb-1">Realisasi Dana (Rp)</label>
                    <input
                      type="number"
                      value={proyekForm.realisasiAnggaran ?? ''}
                      onChange={(e) =>
                        setProyekForm({ ...proyekForm, realisasiAnggaran: Number(e.target.value) })
                      }
                      placeholder="0"
                      className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 font-bold text-xs placeholder:text-slate-400 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 focus:outline-none shadow-xs"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-900 mb-1">Progres Fisik (%)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={proyekForm.progresPersen ?? 0}
                      onChange={(e) =>
                        setProyekForm({ ...proyekForm, progresPersen: Number(e.target.value) })
                      }
                      placeholder="0"
                      className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 font-bold text-xs placeholder:text-slate-400 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 focus:outline-none shadow-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block font-bold text-slate-900 mb-1">Tanggal Mulai</label>
                    <input
                      type="date"
                      required
                      value={proyekForm.tanggalMulai || ''}
                      onChange={(e) => setProyekForm({ ...proyekForm, tanggalMulai: e.target.value })}
                      className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 font-bold text-xs focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 focus:outline-none shadow-xs"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-900 mb-1">Target Selesai</label>
                    <input
                      type="date"
                      required
                      value={proyekForm.targetSelesai || ''}
                      onChange={(e) => setProyekForm({ ...proyekForm, targetSelesai: e.target.value })}
                      className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 font-bold text-xs focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 focus:outline-none shadow-xs"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-900 mb-1">Status Proyek</label>
                    <select
                      value={proyekForm.status || 'Perencanaan'}
                      onChange={(e) =>
                        setProyekForm({ ...proyekForm, status: e.target.value as any })
                      }
                      className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 font-bold text-xs focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 focus:outline-none shadow-xs"
                    >
                      <option value="Perencanaan" className="text-slate-900 bg-white">Perencanaan</option>
                      <option value="Proses Pekerjaan" className="text-slate-900 bg-white">Proses Pekerjaan</option>
                      <option value="Selesai" className="text-slate-900 bg-white">Selesai</option>
                      <option value="Tertunda" className="text-slate-900 bg-white">Tertunda</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-900 mb-1">Catatan Teknis / Spesifikasi Material</label>
                  <input
                    type="text"
                    value={proyekForm.keterangan || ''}
                    onChange={(e) => setProyekForm({ ...proyekForm, keterangan: e.target.value })}
                    placeholder="Catatan spesifikasi material / vendor"
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 font-bold text-xs placeholder:text-slate-400 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 focus:outline-none shadow-xs"
                  />
                </div>
              </div>

              <div className="p-3.5 sm:p-4 flex items-center justify-end gap-2 border-t border-slate-200 bg-slate-50 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsProyekModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-semibold rounded-xl hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-600 text-white font-bold rounded-xl hover:bg-amber-700 shadow-md transition-colors cursor-pointer"
                >
                  Simpan Proyek
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Input Kas Pembangunan */}
      {isKasModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-hidden animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl flex flex-col max-h-[92dvh] sm:max-h-[88vh] overflow-hidden my-auto border border-slate-200">
            <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between shrink-0 bg-slate-50">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Coins className="w-4 h-4 text-emerald-600" />
                <span>Input Transaksi Kas Pembangunan Gereja</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsKasModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveKas} className="flex flex-col flex-1 min-h-0 overflow-hidden text-xs">
              <div className="p-4 sm:p-5 space-y-4 flex-1 overflow-y-auto overscroll-contain">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-900 mb-1">Jenis Transaksi</label>
                    <select
                      value={kasForm.jenis || 'masuk'}
                      onChange={(e) => setKasForm({ ...kasForm, jenis: e.target.value as any })}
                      className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 font-bold text-xs focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 focus:outline-none shadow-xs"
                    >
                      <option value="masuk" className="text-slate-900 bg-white">Penerimaan / Donasi (+)</option>
                      <option value="keluar" className="text-slate-900 bg-white">Pengeluaran Fisik (-)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-slate-900 mb-1">Tanggal Transaksi</label>
                    <input
                      type="date"
                      required
                      value={kasForm.tanggal || ''}
                      onChange={(e) => setKasForm({ ...kasForm, tanggal: e.target.value })}
                      className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 font-bold text-xs focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 focus:outline-none shadow-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-900 mb-1">Jumlah Uang (Rp)</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={kasForm.jumlah ?? ''}
                    onChange={(e) => setKasForm({ ...kasForm, jumlah: Number(e.target.value) })}
                    placeholder="0"
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 text-sm font-bold placeholder:text-slate-400 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 focus:outline-none shadow-xs"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-900 mb-1">Keterangan Transaksi / Nama Donatur</label>
                  <input
                    type="text"
                    required
                    value={kasForm.keterangan || ''}
                    onChange={(e) => setKasForm({ ...kasForm, keterangan: e.target.value })}
                    placeholder="Rincian donasi atau nota belanja"
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 font-bold text-xs placeholder:text-slate-400 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 focus:outline-none shadow-xs"
                  />
                </div>
              </div>

              <div className="p-3.5 sm:p-4 flex items-center justify-end gap-2 border-t border-slate-200 bg-slate-50 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsKasModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-semibold rounded-xl hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 shadow-md transition-colors cursor-pointer"
                >
                  Simpan ke Kas Pembangunan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Konfirmasi Hapus Data */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 text-center">
            <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-xl font-bold">⚠️</span>
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-2">Konfirmasi Hapus Data</h3>
            <p className="text-xs text-slate-600 mb-6">
              Apakah Anda yakin ingin menghapus {deleteTarget.type === 'panitia' ? 'panitia' : 'proyek'} <strong className="text-slate-900">"{deleteTarget.nama}"</strong>? Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 bg-slate-100 text-slate-700 font-semibold rounded-xl hover:bg-slate-200 transition-colors text-xs"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={confirmExecuteDelete}
                className="px-5 py-2 bg-rose-600 text-white font-bold rounded-xl hover:bg-rose-700 shadow-md transition-colors text-xs flex items-center gap-2"
              >
                {isDeleting ? 'Menghapus...' : 'Ya, Hapus Permanen'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
