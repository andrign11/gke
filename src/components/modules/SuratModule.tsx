import React, { useState, useEffect } from 'react';
import {
  FileText,
  Inbox,
  Send,
  Plus,
  Printer,
  Search,
  Edit2,
  Trash2,
  X,
  FileCheck2,
  Clock,
  CheckCircle2,
  Tag,
  Share2,
  Info,
  HelpCircle,
  Building2,
  AlertTriangle,
  AlertCircle,
  Loader2,
  Database,
  ShieldCheck,
  Check,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { AgendaSurat } from '../../types';

export interface GkeKodeTujuanItem {
  code: 'U.I' | 'U.II' | 'U.III' | 'U.IV' | 'U.V' | 'U.VI' | 'U.VII';
  label: string;
  title: string;
  short?: string;
  category: string;
  description: string;
}

export const GKE_KODE_TUJUAN_LIST: GkeKodeTujuanItem[] = [
  {
    code: 'U.I',
    label: 'U.I - Pribadi, Mandat & Rekomendasi',
    title: 'Pribadi, Mandat & Rekomendasi',
    short: 'Pribadi & Rekomendasi',
    category: 'Pribadi / Pastoral',
    description: 'Surat pribadi, mandat dinas pelayanan, dan surat rekomendasi jemaat/organisasi.',
  },
  {
    code: 'U.II',
    label: 'U.II - Sinode / Resort / Jemaat / Yayasan GKE',
    title: 'Lingkungan Internal GKE',
    short: 'Internal GKE',
    category: 'Internal Lingkungan GKE',
    description: 'Surat ke Sinode, Resort, Jemaat, Yayasan, dan lembaga di lingkungan GKE.',
  },
  {
    code: 'U.III',
    label: 'U.III - Undangan & Panggilan',
    title: 'Undangan & Panggilan',
    short: 'Undangan',
    category: 'Undangan / Rapat',
    description: 'Surat undangan resmi peribadahan, rapat dinas, sidang majelis, dan pertemuan.',
  },
  {
    code: 'U.IV',
    label: 'U.IV - Instansi Pemerintah',
    title: 'Pemerintah',
    short: 'Instansi Pemerintah',
    category: 'Pemerintahan',
    description: 'Surat dinas kepada instansi pemerintah pusat / daerah, kepolisian, dan dinas terkait.',
  },
  {
    code: 'U.V',
    label: 'U.V - Mitra Dalam Negeri / Luar GKE',
    title: 'Mitra Dalam Negeri / Non-GKE',
    short: 'Mitra Dalam Negeri',
    category: 'Mitra Dalam Negeri',
    description: 'Surat kepada mitra kerja dalam negeri, perbankan, badan usaha, dan yayasan di luar GKE.',
  },
  {
    code: 'U.VI',
    label: 'U.VI - Mitra Luar Negeri',
    title: 'Mitra Luar Negeri',
    short: 'Mitra Luar Negeri',
    category: 'Mitra Internasional',
    description: 'Surat kepada gereja mitra luar negeri, badan misi, dan organisasi internasional.',
  },
  {
    code: 'U.VII',
    label: 'U.VII - Keterangan Tugas / Surat Jalan',
    title: 'Keterangan Tugas / Jalan',
    short: 'Surat Tugas / Jalan',
    category: 'Tugas / Pelayanan',
    description: 'Surat tugas dinas pengurus/pelayan dan surat jalan perjalanan dinas gereja.',
  },
];

export const SuratModule: React.FC = () => {
  const {
    agendaSuratList,
    addAgendaSurat,
    updateAgendaSurat,
    deleteAgendaSurat,
    openPrintReport,
    currentUser,
    settings,
    viewMode,
  } = useApp();

  const isWarga = currentUser?.role === 'warga' || viewMode === 'public';

  const [activeTab, setActiveTab] = useState<'semua' | 'surat_masuk' | 'surat_keluar'>('semua');
  const [search, setSearch] = useState('');
  const [selectedSifat, setSelectedSifat] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedKodeTujuan, setSelectedKodeTujuan] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDisposisiModalOpen, setIsDisposisiModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<AgendaSurat | null>(null);
  const [disposisiItem, setDisposisiItem] = useState<AgendaSurat | null>(null);

  const [disposisiText, setDisposisiText] = useState('');
  const [disposisiStatus, setDisposisiStatus] = useState<AgendaSurat['status']>('Proses Disposisi');

  // Custom Delete Modal State (immune to iframe/webview window.confirm suppressions)
  const [deleteConfirmItem, setDeleteConfirmItem] = useState<AgendaSurat | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Progress Popup Modal State for Saving & Updating Letters / Disposisi
  const [progressModal, setProgressModal] = useState<{
    isOpen: boolean;
    type: 'create' | 'update' | 'disposisi';
    jenisSurat: 'surat_masuk' | 'surat_keluar';
    nomor: string;
    perihal: string;
    pihakLabel: string;
    pihakValue: string;
    sifatSurat?: string;
    statusSurat?: string;
    progress: number;
    stageMessage: string;
    currentStepIndex: number;
    isComplete: boolean;
    error?: string | null;
  }>({
    isOpen: false,
    type: 'create',
    jenisSurat: 'surat_masuk',
    nomor: '',
    perihal: '',
    pihakLabel: 'Pengirim',
    pihakValue: '',
    progress: 0,
    stageMessage: '',
    currentStepIndex: 0,
    isComplete: false,
    error: null,
  });

  const [autoCloseCountdown, setAutoCloseCountdown] = useState<number | null>(null);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (progressModal.isOpen && progressModal.isComplete) {
      setAutoCloseCountdown(3);
      const interval = setInterval(() => {
        setAutoCloseCountdown((prev) => {
          if (prev === null || prev <= 1) {
            clearInterval(interval);
            setProgressModal((p) => ({ ...p, isOpen: false }));
            return null;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    } else {
      setAutoCloseCountdown(null);
    }
  }, [progressModal.isOpen, progressModal.isComplete]);

  const canEdit =
    currentUser?.role === 'admin' ||
    currentUser?.role === 'sekretaris' ||
    currentUser?.role === 'bendahara';

  // Helper formatting according to Petunjuk Teknis Surat-Menyurat Sinode GKE
  const getMonthTwoDigit = (dateStr?: string) => {
    const d = dateStr ? new Date(dateStr) : new Date();
    const monthIndex = isNaN(d.getTime()) ? new Date().getMonth() : d.getMonth();
    return String(monthIndex + 1).padStart(2, '0');
  };

  const getYearStr = (dateStr?: string) => {
    const d = dateStr ? new Date(dateStr) : new Date();
    return isNaN(d.getTime()) ? String(new Date().getFullYear()) : String(d.getFullYear());
  };

  const getEffectiveKodeInstansi = (customKodeJemaat?: string) => {
    if (customKodeJemaat && customKodeJemaat.trim()) {
      const raw = customKodeJemaat.trim().toUpperCase();
      if (raw.startsWith('MPH')) return raw;
      return `MPHJ-GKE-${raw}`;
    }

    if (settings.kodeOrganisasiPenomoran && /^MPH[SRJ]-GKE/i.test(settings.kodeOrganisasiPenomoran)) {
      return (settings.kodeOrganisasiPenomoran || '').toUpperCase();
    }

    const tingkat = settings.tingkatOrganisasi || 'jemaat';
    const rawShort = (
      settings.kodeJemaatPenomoran ||
      (settings.kodeOrganisasiPenomoran && !settings.kodeOrganisasiPenomoran.includes('GKE') ? settings.kodeOrganisasiPenomoran : '') ||
      (settings.namaJemaat ? settings.namaJemaat.replace(/[^A-Za-z0-9]/g, '').slice(0, 3).toUpperCase() : '')
    ).toUpperCase();

    if (tingkat === 'sinode') return 'MPHS-GKE';
    if (tingkat === 'resort') return rawShort ? `MPHR-GKE-${rawShort}` : 'MPHR-GKE';
    return rawShort ? `MPHJ-GKE-${rawShort}` : 'MPHJ-GKE';
  };

  const generateBakuNoSuratGKE = (
    type: 'surat_masuk' | 'surat_keluar',
    kodeTujuan: string = 'U.I',
    dateStr?: string,
    customInstansi?: string
  ) => {
    const currentYear = dateStr ? new Date(dateStr).getFullYear() : new Date().getFullYear();
    const existingSameType = agendaSuratList.filter((s) => {
      if (s.jenis !== type) return false;
      const y = s.tanggalSurat ? new Date(s.tanggalSurat).getFullYear() : new Date().getFullYear();
      return y === currentYear;
    });

    let maxNum = 0;
    existingSameType.forEach((s) => {
      const match = (s.noSurat || s.noAgenda || '').match(/^(\d+)\//);
      if (match) {
        const parsed = parseInt(match[1], 10);
        if (!isNaN(parsed) && parsed > maxNum) {
          maxNum = parsed;
        }
      }
    });

    const nextNum = maxNum + 1;
    const numPadded = String(nextNum).padStart(3, '0');
    const monthStr = getMonthTwoDigit(dateStr);
    const yearStr = getYearStr(dateStr);
    const instansi = customInstansi || getEffectiveKodeInstansi();

    if (type === 'surat_masuk') {
      const prefix = settings.prefixSuratMasuk || 'SM';
      return `${numPadded}/${prefix}/${instansi}/${kodeTujuan}/${monthStr}/${yearStr}`;
    } else {
      return `${numPadded}/${instansi}/${kodeTujuan}/${monthStr}/${yearStr}`;
    }
  };

  const defaultFormData: Omit<AgendaSurat, 'id'> = {
    jenis: 'surat_masuk',
    noAgenda: generateBakuNoSuratGKE('surat_masuk', 'U.II'),
    noSurat: '',
    tanggalSurat: new Date().toISOString().split('T')[0],
    tanggalTerimaKirim: new Date().toISOString().split('T')[0],
    pengirim: '',
    penerima: settings.namaJemaat ? `Ketua & Sekretaris Majelis Jemaat GKE ${settings.namaJemaat}` : 'Ketua & Sekretaris Majelis Jemaat GKE',
    perihal: '',
    sifatSurat: 'Biasa',
    kodeTujuan: 'U.II',
    lampiran: '1 Berkas',
    ringkasanIsi: '',
    disposisi: '',
    status: 'Diterima',
  };

  const [formData, setFormData] = useState<Omit<AgendaSurat, 'id'>>(defaultFormData);

  const handleOpenAdd = (type: 'surat_masuk' | 'surat_keluar' = 'surat_masuk') => {
    setEditingItem(null);
    const today = new Date().toISOString().split('T')[0];
    const initialKodeTujuan = type === 'surat_keluar' ? 'U.I' : 'U.II';
    const bakuNoAgenda = generateBakuNoSuratGKE(type, initialKodeTujuan, today);
    const bakuNoSurat = type === 'surat_keluar' ? generateBakuNoSuratGKE('surat_keluar', initialKodeTujuan, today) : '';

    setFormData({
      ...defaultFormData,
      jenis: type,
      kodeTujuan: initialKodeTujuan,
      noAgenda: bakuNoAgenda,
      noSurat: bakuNoSurat,
      tanggalSurat: today,
      tanggalTerimaKirim: today,
      pengirim: type === 'surat_masuk' ? '' : (settings.namaJemaat ? `Majelis Jemaat GKE ${settings.namaJemaat}` : 'Majelis Jemaat GKE'),
      penerima: type === 'surat_masuk' ? (settings.namaJemaat ? `Ketua & Sekretaris Majelis Jemaat GKE ${settings.namaJemaat}` : 'Ketua & Sekretaris Majelis Jemaat GKE') : '',
      status: type === 'surat_masuk' ? 'Diterima' : 'Dikirim',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: AgendaSurat) => {
    setEditingItem(item);
    setFormData({
      ...item,
      kodeTujuan: item.kodeTujuan || (item.jenis === 'surat_keluar' ? 'U.I' : 'U.II'),
    });
    setIsModalOpen(true);
  };

  const handleOpenDisposisi = (item: AgendaSurat) => {
    setDisposisiItem(item);
    setDisposisiText(item.disposisi || '');
    setDisposisiStatus(item.status);
    setIsDisposisiModalOpen(true);
  };

  const handleSubmitDisposisi = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!disposisiItem) return;
    if (!disposisiText.trim()) {
      alert('Mohon isi catatan atau petunjuk disposisi MPH!');
      return;
    }

    const targetItem = disposisiItem;
    setIsDisposisiModalOpen(false);

    setProgressModal({
      isOpen: true,
      type: 'disposisi',
      jenisSurat: targetItem.jenis,
      nomor: targetItem.noAgenda || targetItem.noSurat || '-',
      perihal: targetItem.perihal,
      pihakLabel: targetItem.jenis === 'surat_keluar' ? 'Penerima' : 'Pengirim',
      pihakValue: targetItem.jenis === 'surat_keluar' ? targetItem.penerima : targetItem.pengirim,
      sifatSurat: targetItem.sifatSurat,
      statusSurat: disposisiStatus,
      progress: 20,
      stageMessage: 'Memvalidasi instruksi disposisi MPH Jemaat...',
      currentStepIndex: 0,
      isComplete: false,
      error: null,
    });

    try {
      await new Promise((r) => setTimeout(r, 350));
      setProgressModal((prev) => ({
        ...prev,
        progress: 60,
        stageMessage: 'Menyimpan pembaruan status dan disposisi ke Firestore...',
        currentStepIndex: 1,
      }));

      await updateAgendaSurat(targetItem.id, {
        disposisi: disposisiText,
        status: disposisiStatus,
      });

      await new Promise((r) => setTimeout(r, 400));
      setProgressModal((prev) => ({
        ...prev,
        progress: 85,
        stageMessage: 'Memperbarui status agenda persuratan & buku register...',
        currentStepIndex: 2,
      }));

      await new Promise((r) => setTimeout(r, 350));
      setProgressModal((prev) => ({
        ...prev,
        progress: 100,
        stageMessage: 'Disposisi surat berhasil diperbarui & tercatat di buku agenda!',
        currentStepIndex: 3,
        isComplete: true,
      }));
    } catch (err: any) {
      console.error('Gagal memperbarui disposisi surat:', err);
      setProgressModal((prev) => ({
        ...prev,
        error: err?.message || 'Terjadi kesalahan saat memperbarui disposisi.',
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.perihal || !formData.perihal.trim()) {
      alert('Mohon isi perihal surat!');
      return;
    }
    if (!formData.noAgenda && !formData.noSurat) {
      alert('Mohon pastikan nomor agenda atau nomor surat terisi!');
      return;
    }

    const isUpdate = !!editingItem;
    const currentJenis = formData.jenis;
    const currentNomor = formData.noAgenda || formData.noSurat || '-';
    const currentPihak = currentJenis === 'surat_keluar' ? formData.penerima : formData.pengirim;
    const currentPihakLabel = currentJenis === 'surat_keluar' ? 'Penerima' : 'Pengirim';

    setIsModalOpen(false);

    setProgressModal({
      isOpen: true,
      type: isUpdate ? 'update' : 'create',
      jenisSurat: currentJenis,
      nomor: currentNomor,
      perihal: formData.perihal,
      pihakLabel: currentPihakLabel,
      pihakValue: currentPihak,
      sifatSurat: formData.sifatSurat,
      statusSurat: formData.status,
      progress: 20,
      stageMessage: isUpdate
        ? `Memvalidasi pembaruan ${currentJenis === 'surat_keluar' ? 'Surat Keluar' : 'Surat Masuk'}...`
        : `Menyiapkan & memvalidasi data ${currentJenis === 'surat_keluar' ? 'Surat Keluar' : 'Surat Masuk'} baru...`,
      currentStepIndex: 0,
      isComplete: false,
      error: null,
    });

    try {
      await new Promise((r) => setTimeout(r, 400));
      setProgressModal((prev) => ({
        ...prev,
        progress: 55,
        stageMessage: 'Menyimpan & merekam data ke basis data cloud Firestore...',
        currentStepIndex: 1,
      }));

      if (isUpdate && editingItem) {
        await updateAgendaSurat(editingItem.id, formData);
      } else {
        await addAgendaSurat(formData);
      }

      await new Promise((r) => setTimeout(r, 450));
      setProgressModal((prev) => ({
        ...prev,
        progress: 85,
        stageMessage: 'Memperbarui buku agenda persuratan, indeks nomor & arsip...',
        currentStepIndex: 2,
      }));

      await new Promise((r) => setTimeout(r, 350));
      setProgressModal((prev) => ({
        ...prev,
        progress: 100,
        stageMessage: isUpdate
          ? `Data ${currentJenis === 'surat_keluar' ? 'Surat Keluar' : 'Surat Masuk'} berhasil diperbarui!`
          : `Data ${currentJenis === 'surat_keluar' ? 'Surat Keluar' : 'Surat Masuk'} berhasil disimpan ke buku agenda!`,
        currentStepIndex: 3,
        isComplete: true,
      }));
    } catch (err: any) {
      console.error('Gagal menyimpan data agenda surat:', err);
      setProgressModal((prev) => ({
        ...prev,
        error: err?.message || 'Terjadi kesalahan saat menyimpan data agenda surat.',
      }));
    }
  };

  const handleExecuteDelete = async () => {
    if (!deleteConfirmItem) return;
    setIsDeleting(true);
    try {
      await deleteAgendaSurat(deleteConfirmItem.id);
      setDeleteConfirmItem(null);
    } catch (err) {
      console.error('Gagal menghapus agenda surat:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredList = agendaSuratList.filter((item) => {
    const matchesTab =
      activeTab === 'semua' ? true : item.jenis === activeTab;
    const matchesSearch =
      (item.noAgenda || '').toLowerCase().includes(search.toLowerCase()) ||
      (item.noSurat || '').toLowerCase().includes(search.toLowerCase()) ||
      (item.pengirim || '').toLowerCase().includes(search.toLowerCase()) ||
      (item.penerima || '').toLowerCase().includes(search.toLowerCase()) ||
      (item.perihal || '').toLowerCase().includes(search.toLowerCase()) ||
      (item.kodeTujuan || '').toLowerCase().includes(search.toLowerCase());
    const matchesSifat = !selectedSifat || item.sifatSurat === selectedSifat;
    const matchesStatus = !selectedStatus || item.status === selectedStatus;
    const matchesKodeTujuan = !selectedKodeTujuan || item.kodeTujuan === selectedKodeTujuan;

    return matchesTab && matchesSearch && matchesSifat && matchesStatus && matchesKodeTujuan;
  });

  const totalMasuk = agendaSuratList.filter((s) => s.jenis === 'surat_masuk').length;
  const totalKeluar = agendaSuratList.filter((s) => s.jenis === 'surat_keluar').length;
  const totalProsesDisposisi = agendaSuratList.filter((s) => s.status === 'Proses Disposisi').length;
  const totalSelesai = agendaSuratList.filter((s) => s.status === 'Selesai' || s.status === 'Dikirim').length;

  const getSifatBadge = (sifat: AgendaSurat['sifatSurat']) => {
    switch (sifat) {
      case 'Penting':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'Rahasia / Khusus':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      case 'Undangan':
        return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
      case 'Permohonan':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      default:
        return 'bg-slate-700/50 text-slate-300 border-slate-600/50';
    }
  };

  const getStatusBadge = (status: AgendaSurat['status']) => {
    switch (status) {
      case 'Diterima':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'Proses Disposisi':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'Selesai':
      case 'Dikirim':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      default:
        return 'bg-slate-700/50 text-slate-300 border-slate-600/50';
    }
  };

  const getKodeTujuanInfo = (code?: string) => {
    return GKE_KODE_TUJUAN_LIST.find((item) => item.code === code) || null;
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-800/80 p-5 rounded-2xl border border-slate-700/60 shadow-xl backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2.5 bg-blue-500/10 rounded-xl border border-blue-500/20 text-blue-400">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">
                Agenda Surat Masuk & Surat Keluar
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                {isWarga
                  ? 'Pencatatan dan arsip agenda persuratan dinas jemaat'
                  : 'Pencatatan persuratan dinas jemaat menurut Petunjuk Teknis Surat-Menyurat MPH Sinode GKE'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => openPrintReport({ reportType: 'agenda_surat' })}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-slate-700 hover:bg-slate-600 text-slate-100 text-xs font-semibold px-4 py-2.5 rounded-xl transition-all shadow-md cursor-pointer border border-slate-600"
          >
            <Printer className="w-4 h-4 text-slate-300" />
            <span>Cetak / Ekspor Agenda</span>
          </button>

          {canEdit && (
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={() => handleOpenAdd('surat_masuk')}
                className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-3.5 py-2.5 rounded-xl transition-all shadow-md cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Catat Surat Masuk</span>
              </button>
              <button
                onClick={() => handleOpenAdd('surat_keluar')}
                className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-3.5 py-2.5 rounded-xl transition-all shadow-md cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>Catat Surat Keluar</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Juknis GKE Info Callout Banner - Hanya ditampilkan untuk petugas/pengurus/admin, disembunyikan untuk warga jemaat */}
      {!isWarga && (
        <div className="bg-slate-900/90 border border-blue-500/20 rounded-2xl p-4 shadow-lg backdrop-blur-md">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-blue-500/10 rounded-xl border border-blue-500/20 text-blue-400 mt-0.5 shrink-0">
              <Building2 className="w-5 h-5" />
            </div>
            <div className="space-y-1.5 text-xs">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-bold text-slate-100">
                  Petunjuk Teknis Surat-Menyurat MPH Sinode GKE
                </h3>
                <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-mono text-[10px] font-semibold border border-blue-500/30">
                  Format Baku: [No. Agenda]/[Instansi GKE]/[Kode Tujuan]/[Bulan 2-Digit]/[Tahun]
                </span>
              </div>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Penomoran surat baku di lingkungan GKE: Majelis Jemaat (<span className="text-slate-200 font-mono">001/MPHJ-GKE-SL/U.I/09/2026</span>), Majelis Resort (<span className="text-slate-200 font-mono">001/MPHR-GKE-KK/U.I/09/2026</span>), Majelis Sinode (<span className="text-slate-200 font-mono">374/MPHS-GKE/U.II/09/2021</span>).
              </p>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {GKE_KODE_TUJUAN_LIST.map((item) => (
                  <span
                    key={item.code}
                    title={item.description}
                    className="px-2 py-0.5 bg-slate-800/80 rounded-md border border-slate-700/60 text-[10px] text-slate-300"
                  >
                    <strong className="text-blue-400 font-mono">{item.code}</strong>: {item.short}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700/50 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Total Surat Masuk</span>
            <Inbox className="w-5 h-5 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-white mt-2">{totalMasuk}</p>
          <p className="text-[11px] text-slate-400 mt-1">Dokumen diterima jemaat</p>
        </div>

        <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700/50 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Total Surat Keluar</span>
            <Send className="w-5 h-5 text-indigo-400" />
          </div>
          <p className="text-2xl font-bold text-white mt-2">{totalKeluar}</p>
          <p className="text-[11px] text-slate-400 mt-1">Dokumen resmi terbit</p>
        </div>

        <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700/50 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Proses Disposisi</span>
            <Clock className="w-5 h-5 text-amber-400" />
          </div>
          <p className="text-2xl font-bold text-amber-400 mt-2">{totalProsesDisposisi}</p>
          <p className="text-[11px] text-slate-400 mt-1">Perlu tindak lanjut MPH</p>
        </div>

        <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700/50 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Arsip / Selesai</span>
            <CheckCircle2 className="w-5 h-5 text-blue-400" />
          </div>
          <p className="text-2xl font-bold text-blue-400 mt-2">{totalSelesai}</p>
          <p className="text-[11px] text-slate-400 mt-1">Dokumen terarsip lengkap</p>
        </div>
      </div>

      {/* Tabs & Controls */}
      <div className="bg-slate-800/60 p-4 rounded-2xl border border-slate-700/50 space-y-4">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-700/60 pb-3 overflow-x-auto">
          <button
            onClick={() => setActiveTab('semua')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'semua'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Semua Agenda ({agendaSuratList.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('surat_masuk')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'surat_masuk'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Inbox className="w-4 h-4" />
            <span>Surat Masuk ({totalMasuk})</span>
          </button>
          <button
            onClick={() => setActiveTab('surat_keluar')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'surat_keluar'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Send className="w-4 h-4" />
            <span>Surat Keluar ({totalKeluar})</span>
          </button>
        </div>

        {/* Search & Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Cari No Agenda, No Surat, Pengirim, Perihal..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <select
              value={selectedKodeTujuan}
              onChange={(e) => setSelectedKodeTujuan(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
            >
              <option value="">Semua Kode Tujuan (U.I - U.VII)</option>
              {GKE_KODE_TUJUAN_LIST.map((item) => (
                <option key={item.code} value={item.code}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={selectedSifat}
              onChange={(e) => setSelectedSifat(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
            >
              <option value="">Semua Sifat Surat</option>
              <option value="Biasa">Biasa</option>
              <option value="Penting">Penting</option>
              <option value="Rahasia / Khusus">Rahasia / Khusus</option>
              <option value="Undangan">Undangan</option>
              <option value="Pemberitahuan">Pemberitahuan</option>
              <option value="Permohonan">Permohonan</option>
            </select>
          </div>

          <div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
            >
              <option value="">Semua Status Disposisi</option>
              <option value="Diterima">Diterima</option>
              <option value="Proses Disposisi">Proses Disposisi</option>
              <option value="Selesai">Selesai</option>
              <option value="Dikirim">Dikirim</option>
            </select>
          </div>
        </div>

        {/* Data Table */}
        <div className="hidden md:block overflow-x-auto w-full max-w-full rounded-xl border border-slate-700/60">
          <table className="w-full min-w-[800px] text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-900/80 text-slate-300 font-semibold border-b border-slate-700 whitespace-nowrap">
                <th className="p-3.5 w-10 text-center">No</th>
                <th className="p-3.5">Jenis & No. Agenda</th>
                <th className="p-3.5">No. Surat Resmi / Tgl</th>
                <th className="p-3.5">Kode Tujuan GKE</th>
                <th className="p-3.5">Pengirim & Penerima</th>
                <th className="p-3.5">Perihal & Sifat</th>
                <th className="p-3.5">Disposisi & Catatan</th>
                <th className="p-3.5 text-center">Status</th>
                {canEdit && <th className="p-3.5 text-center w-28">Aksi</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50 bg-slate-800/30">
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-400">
                    <FileText className="w-8 h-8 mx-auto text-slate-500 mb-2 opacity-60" />
                    Belum ada agenda surat terdaftar sesuai kriteria filter.
                  </td>
                </tr>
              ) : (
                filteredList.map((item, index) => {
                  const tujuanInfo = getKodeTujuanInfo(item.kodeTujuan);
                  return (
                    <tr key={item.id} className="hover:bg-slate-800/80 transition-colors">
                      <td className="p-3.5 text-center text-slate-400 font-mono">{index + 1}</td>
                      <td className="p-3.5">
                        <div className="flex items-center gap-1.5 mb-1">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase ${
                              item.jenis === 'surat_masuk'
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                            }`}
                          >
                            {item.jenis === 'surat_masuk' ? 'Surat Masuk' : 'Surat Keluar'}
                          </span>
                        </div>
                        <div className="font-mono text-slate-100 font-bold">{item.noAgenda}</div>
                      </td>

                      <td className="p-3.5">
                        <div className="font-semibold text-slate-200 font-mono">{item.noSurat || '-'}</div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          Tgl: {item.tanggalSurat}
                        </div>
                      </td>

                      <td className="p-3.5">
                        {item.kodeTujuan ? (
                          <div className="space-y-0.5">
                            <span className="inline-block px-2 py-0.5 bg-blue-500/10 text-blue-300 border border-blue-500/30 rounded font-mono font-bold text-[10px]">
                              {item.kodeTujuan}
                            </span>
                            <div className="text-[10px] text-slate-400 leading-tight">
                              {tujuanInfo ? tujuanInfo.short : item.kodeTujuan}
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-500 text-[10px] italic">-</span>
                        )}
                      </td>

                      <td className="p-3.5">
                        <div className="text-slate-200 font-medium">
                          <span className="text-slate-400">Dari:</span> {item.pengirim}
                        </div>
                        <div className="text-slate-300 text-[11px] mt-0.5">
                          <span className="text-slate-400">Kepada:</span> {item.penerima}
                        </div>
                      </td>

                      <td className="p-3.5 max-w-xs">
                        <div className="font-semibold text-white leading-snug">{item.perihal}</div>
                        <div className="flex items-center gap-2 mt-1">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-medium border ${getSifatBadge(
                              item.sifatSurat
                            )}`}
                          >
                            Sifat: {item.sifatSurat}
                          </span>
                          {item.lampiran && (
                            <span className="text-[10px] text-slate-400">
                              Lamp: {item.lampiran}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="p-3.5 max-w-xs">
                        {item.disposisi ? (
                          <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-700/50 text-[11px] text-slate-300 leading-relaxed">
                            <span className="font-semibold text-amber-400">Disposisi: </span>
                            {item.disposisi}
                          </div>
                        ) : (
                          <span className="text-slate-500 italic text-[11px]">Belum ada disposisi</span>
                        )}
                      </td>

                      <td className="p-3.5 text-center">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold border ${getStatusBadge(
                            item.status
                          )}`}
                        >
                          {item.status}
                        </span>
                      </td>

                      {canEdit && (
                        <td className="p-3.5 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => handleOpenDisposisi(item)}
                              className="p-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 rounded-lg transition-all"
                              title="Tulis Disposisi Cepat"
                            >
                              <FileCheck2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleOpenEdit(item)}
                              className="p-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-lg transition-all"
                              title="Edit Data Surat"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setDeleteConfirmItem(item)}
                              className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-lg transition-all cursor-pointer"
                              title="Hapus Surat"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
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

        {/* Mobile View Cards */}
        <div className="grid grid-cols-1 gap-3 md:hidden">
          {filteredList.map((item) => (
            <div
              key={item.id}
              className="bg-slate-800/80 border border-slate-700/80 p-4 rounded-xl space-y-3 shadow-md"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border uppercase ${
                        item.jenis === 'surat_masuk'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                      }`}
                    >
                      {item.jenis === 'surat_masuk' ? 'Surat Masuk' : 'Surat Keluar'}
                    </span>
                    {item.kodeTujuan && (
                      <span className="px-1.5 py-0.5 bg-blue-500/10 text-blue-300 rounded font-mono font-bold text-[10px] border border-blue-500/30">
                        {item.kodeTujuan}
                      </span>
                    )}
                  </div>
                  <h4 className="font-mono text-sm font-bold text-white">{item.noAgenda}</h4>
                  <p className="text-xs text-slate-400 font-mono">{item.noSurat || 'No. Surat (-)'}</p>
                </div>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadge(
                    item.status
                  )}`}
                >
                  {item.status}
                </span>
              </div>

              <div>
                <p className="text-xs font-bold text-white leading-snug">{item.perihal}</p>
                <p className="text-[11px] text-slate-300 mt-1">
                  <span className="text-slate-400">Pengirim:</span> {item.pengirim}
                </p>
                <p className="text-[11px] text-slate-300">
                  <span className="text-slate-400">Penerima:</span> {item.penerima}
                </p>
              </div>

              {item.disposisi && (
                <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-700 text-xs text-slate-200">
                  <span className="font-bold text-amber-400">Disposisi: </span>
                  {item.disposisi}
                </div>
              )}

              {canEdit && (
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-700/60">
                  <button
                    onClick={() => handleOpenDisposisi(item)}
                    className="flex items-center gap-1 text-xs bg-amber-500/10 text-amber-400 px-2.5 py-1.5 rounded-lg border border-amber-500/20 cursor-pointer"
                  >
                    <FileCheck2 className="w-3.5 h-3.5" />
                    <span>Disposisi</span>
                  </button>
                  <button
                    onClick={() => handleOpenEdit(item)}
                    className="flex items-center gap-1 text-xs bg-blue-500/10 text-blue-400 px-2.5 py-1.5 rounded-lg border border-blue-500/20 cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={() => setDeleteConfirmItem(item)}
                    className="p-1.5 bg-rose-500/10 text-rose-400 rounded-lg border border-rose-500/20 hover:bg-rose-500/20 transition-colors cursor-pointer"
                    title="Hapus Agenda Surat"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Main Add/Edit Modal with GKE Juknis Standard */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-hidden animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-3xl rounded-2xl shadow-2xl flex flex-col max-h-[92dvh] sm:max-h-[88vh] overflow-hidden my-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 p-4 sm:p-5 shrink-0 bg-slate-900/95">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-400" />
                  <span>{editingItem ? 'Edit Data Surat' : 'Catat Agenda Persuratan GKE'}</span>
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Format penomoran baku sesuai Petunjuk Teknis Surat-Menyurat MPH Sinode GKE
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden text-xs">
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 overscroll-contain">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">
                      Jenis Persuratan
                    </label>
                  <select
                    value={formData.jenis || 'surat_masuk'}
                    onChange={(e) => {
                      const newType = e.target.value as 'surat_masuk' | 'surat_keluar';
                      const defaultKode = newType === 'surat_keluar' ? 'U.I' : 'U.II';
                      const bakuAgenda = generateBakuNoSuratGKE(newType, defaultKode, formData.tanggalSurat);
                      const bakuSurat = newType === 'surat_keluar' ? generateBakuNoSuratGKE('surat_keluar', defaultKode, formData.tanggalSurat) : formData.noSurat;
                      setFormData({
                        ...formData,
                        jenis: newType,
                        kodeTujuan: defaultKode,
                        noAgenda: bakuAgenda,
                        noSurat: bakuSurat,
                        pengirim: newType === 'surat_masuk' ? '' : (settings.namaJemaat ? `Majelis Jemaat GKE ${settings.namaJemaat}` : 'Majelis Jemaat GKE'),
                        penerima: newType === 'surat_masuk' ? (settings.namaJemaat ? `Ketua & Sekretaris Majelis Jemaat GKE ${settings.namaJemaat}` : 'Ketua & Sekretaris Majelis Jemaat GKE') : '',
                        status: newType === 'surat_masuk' ? 'Diterima' : 'Dikirim',
                      });
                    }}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-semibold focus:outline-none focus:border-blue-500"
                  >
                    <option value="surat_masuk">Surat Masuk (Buku Agenda Penerimaan)</option>
                    <option value="surat_keluar">Surat Keluar (Penomoran Resmi GKE)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Kode Tujuan Surat (Petunjuk Teknis GKE)
                  </label>
                  <select
                    value={formData.kodeTujuan || 'U.I'}
                    onChange={(e) => {
                      const newKode = e.target.value;
                      const autoSurat = formData.jenis === 'surat_keluar' ? generateBakuNoSuratGKE('surat_keluar', newKode, formData.tanggalSurat) : formData.noSurat;
                      const autoAgenda = generateBakuNoSuratGKE(formData.jenis, newKode, formData.tanggalSurat);
                      setFormData({
                        ...formData,
                        kodeTujuan: newKode,
                        noSurat: autoSurat,
                        noAgenda: autoAgenda,
                      });
                    }}
                    className="w-full bg-slate-800 border border-blue-500/40 rounded-xl px-3 py-2 text-blue-300 font-mono font-semibold focus:outline-none focus:border-blue-500"
                  >
                    {GKE_KODE_TUJUAN_LIST.map((item) => (
                      <option key={item.code} value={item.code}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Juknis GKE Interactive Code Selector Chips */}
              <div className="bg-slate-950/80 p-3.5 rounded-xl border border-blue-500/25 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-blue-300 flex items-center gap-1.5 text-[11px]">
                    <Tag className="w-3.5 h-3.5" />
                    Pilih Cepat Kode Tujuan Surat (U.I s/d U.VII):
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    Instansi: <span className="text-emerald-400 font-bold">{getEffectiveKodeInstansi()}</span>
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-1.5">
                  {GKE_KODE_TUJUAN_LIST.map((item) => {
                    const isSelected = (formData.kodeTujuan || 'U.I') === item.code;
                    return (
                      <button
                        key={item.code}
                        type="button"
                        onClick={() => {
                          const autoSurat = formData.jenis === 'surat_keluar' ? generateBakuNoSuratGKE('surat_keluar', item.code, formData.tanggalSurat) : formData.noSurat;
                          const autoAgenda = generateBakuNoSuratGKE(formData.jenis, item.code, formData.tanggalSurat);
                          setFormData({
                            ...formData,
                            kodeTujuan: item.code,
                            noSurat: autoSurat,
                            noAgenda: autoAgenda,
                          });
                        }}
                        className={`p-2 rounded-lg text-left transition-all border text-[10px] ${
                          isSelected
                            ? 'bg-blue-600 border-blue-400 text-white shadow-md'
                            : 'bg-slate-900 border-slate-700/80 text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        <div className="font-mono font-bold text-[11px]">{item.code}</div>
                        <div className="line-clamp-2 leading-tight text-[9px] mt-0.5 opacity-90">
                          {item.title}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Selected Code Explanation & Live Number Breakdown */}
                {formData.kodeTujuan && (
                  <div className="bg-slate-900/90 p-2.5 rounded-lg border border-slate-800 text-[11px] flex flex-col sm:row sm:items-center justify-between gap-2">
                    <div className="space-y-0.5">
                      <span className="text-blue-300 font-semibold">
                        Penjelasan {formData.kodeTujuan}:{' '}
                      </span>
                      <span className="text-slate-300">
                        {getKodeTujuanInfo(formData.kodeTujuan)?.description}
                      </span>
                    </div>
                    <div className="font-mono text-emerald-400 font-bold bg-slate-950 px-2.5 py-1 rounded border border-emerald-500/30 whitespace-nowrap text-right">
                      {formData.jenis === 'surat_keluar'
                        ? formData.noSurat || generateBakuNoSuratGKE('surat_keluar', formData.kodeTujuan, formData.tanggalSurat)
                        : formData.noAgenda}
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-slate-300 font-semibold">
                      Nomor Agenda Persuratan (Baku GKE)
                    </label>
                    <button
                      type="button"
                      onClick={() =>
                        setFormData({
                          ...formData,
                          noAgenda: generateBakuNoSuratGKE(formData.jenis, formData.kodeTujuan, formData.tanggalSurat),
                        })
                      }
                      className="text-[10px] text-blue-400 hover:text-blue-300 underline"
                    >
                      Baku Juknis
                    </button>
                  </div>
                  <input
                    type="text"
                    required
                    value={formData.noAgenda || ''}
                    onChange={(e) => setFormData({ ...formData, noAgenda: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-mono font-bold focus:outline-none focus:border-blue-500"
                    placeholder={`001/${formData.jenis === 'surat_masuk' ? 'SM/' : ''}${getEffectiveKodeInstansi()}/${formData.kodeTujuan || 'U.I'}/${getMonthTwoDigit()}/${getYearStr()}`}
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    Format Juknis: [No]/[Instansi]/[Kode Tujuan]/[Bulan 2-Digit]/[Tahun]
                  </span>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-slate-300 font-semibold">
                      {formData.jenis === 'surat_keluar' ? 'Nomor Surat Resmi Keluar' : 'Nomor Surat Resmi Pengirim'}
                    </label>
                    {formData.jenis === 'surat_keluar' && (
                      <button
                        type="button"
                        onClick={() =>
                          setFormData({
                            ...formData,
                            noSurat: generateBakuNoSuratGKE('surat_keluar', formData.kodeTujuan, formData.tanggalSurat),
                          })
                        }
                        className="text-[10px] text-blue-400 hover:text-blue-300 underline"
                      >
                        Generate Baku
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    required
                    value={formData.noSurat || ''}
                    onChange={(e) => setFormData({ ...formData, noSurat: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-mono font-bold focus:outline-none focus:border-blue-500"
                    placeholder={
                      formData.jenis === 'surat_keluar'
                        ? `001/${getEffectiveKodeInstansi()}/${formData.kodeTujuan || 'U.I'}/${getMonthTwoDigit()}/${getYearStr()}`
                        : 'Contoh: 374/MPHS-GKE/U.II/09/2021 atau 001/MPHR-GKE-KK/U.I/09/2021'
                    }
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    {formData.jenis === 'surat_keluar'
                      ? 'Nomor surat keluar baku yang diterbitkan majelis jemaat'
                      : 'Nomor surat resmi yang tertera pada surat fisik / PDF yang diterima'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Tanggal Surat
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.tanggalSurat || ''}
                    onChange={(e) => {
                      const newDate = e.target.value;
                      const autoSurat = formData.jenis === 'surat_keluar' ? generateBakuNoSuratGKE('surat_keluar', formData.kodeTujuan, newDate) : formData.noSurat;
                      const autoAgenda = generateBakuNoSuratGKE(formData.jenis, formData.kodeTujuan, newDate);
                      setFormData({
                        ...formData,
                        tanggalSurat: newDate,
                        noSurat: autoSurat,
                        noAgenda: autoAgenda,
                      });
                    }}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    {formData.jenis === 'surat_masuk' ? 'Tanggal Diterima' : 'Tanggal Dikirim'}
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.tanggalTerimaKirim || ''}
                    onChange={(e) => setFormData({ ...formData, tanggalTerimaKirim: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Pengirim / Asal Surat
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.pengirim || ''}
                    onChange={(e) => setFormData({ ...formData, pengirim: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-blue-500"
                    placeholder="Majelis Sinode GKE / Majelis Resort / Mitra"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Penerima / Tujuan Surat
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.penerima || ''}
                    onChange={(e) => setFormData({ ...formData, penerima: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-blue-500"
                    placeholder="Ketua & Sekretaris Majelis Jemaat / Instansi Tujuan"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Perihal / Subjek Surat
                </label>
                <input
                  type="text"
                  required
                  value={formData.perihal || ''}
                  onChange={(e) => setFormData({ ...formData, perihal: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-blue-500"
                  placeholder="Contoh: Petunjuk Teknis Surat-Menyurat / Undangan Sidang Majelis"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Sifat Surat
                  </label>
                  <select
                    value={formData.sifatSurat || 'Biasa'}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        sifatSurat: e.target.value as AgendaSurat['sifatSurat'],
                      })
                    }
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-blue-500"
                  >
                    <option value="Biasa">Biasa</option>
                    <option value="Penting">Penting</option>
                    <option value="Rahasia / Khusus">Rahasia / Khusus</option>
                    <option value="Undangan">Undangan</option>
                    <option value="Pemberitahuan">Pemberitahuan</option>
                    <option value="Permohonan">Permohonan</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Lampiran
                  </label>
                  <input
                    type="text"
                    value={formData.lampiran || ''}
                    onChange={(e) => setFormData({ ...formData, lampiran: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-blue-500"
                    placeholder="1 Berkas / 2 Lembar / -"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Status Surat
                  </label>
                  <select
                    value={formData.status || 'Diterima'}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        status: e.target.value as AgendaSurat['status'],
                      })
                    }
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-blue-500"
                  >
                    <option value="Diterima">Diterima</option>
                    <option value="Proses Disposisi">Proses Disposisi</option>
                    <option value="Selesai">Selesai</option>
                    <option value="Dikirim">Dikirim</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Ringkasan Isi / Catatan Disposisi MPH Jemaat
                </label>
                <textarea
                  rows={2}
                  value={formData.disposisi || ''}
                  onChange={(e) => setFormData({ ...formData, disposisi: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-blue-500"
                  placeholder="Instruksi disposisi Ketua/Sekretaris atau ringkasan isi surat..."
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 p-3.5 sm:p-4 border-t border-slate-800 shrink-0 bg-slate-900/95">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-all cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl shadow-md transition-all cursor-pointer"
              >
                Simpan Data Persuratan
              </button>
            </div>
          </form>
        </div>
      </div>
    )}

    {/* Disposisi Cepat Modal */}
    {isDisposisiModalOpen && disposisiItem && (
      <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-hidden animate-in fade-in duration-150">
        <div className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-2xl shadow-2xl flex flex-col max-h-[92dvh] sm:max-h-[88vh] overflow-hidden my-auto">
          <div className="flex items-center justify-between border-b border-slate-800 p-4 sm:p-5 shrink-0 bg-slate-900/95">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <FileCheck2 className="w-5 h-5 text-amber-400" />
                <span>Catat Disposisi MPH Jemaat</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5 font-mono">{disposisiItem.noAgenda}</p>
            </div>
            <button
              type="button"
              onClick={() => setIsDisposisiModalOpen(false)}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmitDisposisi} className="flex flex-col flex-1 min-h-0 overflow-hidden text-xs">
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 overscroll-contain">
              <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/60 text-xs text-slate-200 space-y-1">
                <p>
                  <span className="text-slate-400 font-semibold">Perihal:</span> {disposisiItem.perihal}
                </p>
                <p>
                  <span className="text-slate-400 font-semibold">Dari:</span> {disposisiItem.pengirim}
                </p>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Isi Disposisi / Petunjuk MPH
                </label>
                <textarea
                  rows={4}
                  required
                  value={disposisiText || ''}
                  onChange={(e) => setDisposisiText(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-slate-100 focus:outline-none focus:border-amber-500"
                  placeholder="Misal: Disposisi Ketua: Sekretaris tindak lanjuti surat edaran dan koordinasikan dengan Seksi Kategorial."
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Update Status</label>
                <select
                  value={disposisiStatus || 'Proses Disposisi'}
                  onChange={(e) => setDisposisiStatus(e.target.value as AgendaSurat['status'])}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500"
                >
                  <option value="Proses Disposisi">Proses Disposisi</option>
                  <option value="Selesai">Selesai / Terarsip</option>
                  <option value="Dikirim">Dikirim</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 p-3.5 sm:p-4 border-t border-slate-800 shrink-0 bg-slate-900/95">
              <button
                type="button"
                onClick={() => setIsDisposisiModalOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-white font-semibold rounded-xl shadow-md cursor-pointer"
              >
                Simpan Disposisi
              </button>
            </div>
          </form>
        </div>
      </div>
    )}

    {/* Custom Delete Confirmation Modal (Immune to Mobile/IFrame window.confirm block) */}
    {deleteConfirmItem && (
      <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
        <div className="bg-slate-900 border border-slate-700/90 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden p-5 space-y-4">
          <div className="flex items-start gap-3.5">
            <div className="p-3 bg-rose-500/15 border border-rose-500/30 text-rose-400 rounded-xl shrink-0">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-base font-bold text-slate-100">
                Hapus {deleteConfirmItem.jenis === 'surat_keluar' ? 'Surat Keluar' : 'Surat Masuk'}?
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Data agenda surat ini akan dihapus secara permanen dari basis data Firestore. Tindakan ini tidak dapat dibatalkan.
              </p>
            </div>
          </div>

          <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800 space-y-1.5 text-xs">
            <div className="flex items-center justify-between gap-2">
              <span className="text-slate-400">No. Agenda:</span>
              <span className="font-mono font-bold text-slate-200 truncate">{deleteConfirmItem.noAgenda}</span>
            </div>
            {deleteConfirmItem.noSurat && (
              <div className="flex items-center justify-between gap-2">
                <span className="text-slate-400">No. Surat:</span>
                <span className="font-mono font-semibold text-slate-300 truncate">{deleteConfirmItem.noSurat}</span>
              </div>
            )}
            <div className="pt-1 border-t border-slate-800/80">
              <span className="text-slate-400 block mb-0.5">Perihal:</span>
              <span className="font-semibold text-white line-clamp-2">{deleteConfirmItem.perihal}</span>
            </div>
            <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-800/80 text-[11px]">
              <span className="text-slate-400">
                {deleteConfirmItem.jenis === 'surat_keluar' ? 'Tujuan / Penerima:' : 'Pengirim:'}
              </span>
              <span className="text-slate-300 truncate max-w-[200px]">
                {deleteConfirmItem.jenis === 'surat_keluar' ? deleteConfirmItem.penerima : deleteConfirmItem.pengirim}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              disabled={isDeleting}
              onClick={() => setDeleteConfirmItem(null)}
              className="px-4 py-2.5 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="button"
              disabled={isDeleting}
              onClick={handleExecuteDelete}
              className="px-4 py-2.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-xl shadow-lg shadow-rose-600/30 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isDeleting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Menghapus...</span>
                </>
              ) : (
                <>
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Ya, Hapus Surat</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    )}

    {/* Real-time Storage & Update Progress Popup Modal for Surat Masuk, Surat Keluar, and Disposisi */}
    {progressModal.isOpen && (
      <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
        <div className="bg-slate-900 border border-slate-700/90 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden p-5 sm:p-6 space-y-5">
          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div
                className={`p-3 rounded-2xl border ${
                  progressModal.isComplete
                    ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                    : progressModal.error
                    ? 'bg-rose-500/20 border-rose-500/40 text-rose-400'
                    : progressModal.jenisSurat === 'surat_keluar'
                    ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                    : 'bg-blue-500/20 border-blue-500/40 text-blue-400'
                }`}
              >
                {progressModal.isComplete ? (
                  <CheckCircle2 className="w-6 h-6 animate-in zoom-in-50 duration-200" />
                ) : progressModal.error ? (
                  <AlertCircle className="w-6 h-6" />
                ) : (
                  <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${
                      progressModal.jenisSurat === 'surat_keluar'
                        ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                        : 'bg-blue-500/15 border-blue-500/30 text-blue-400'
                    }`}
                  >
                    {progressModal.jenisSurat === 'surat_keluar' ? 'Surat Keluar' : 'Surat Masuk'}
                  </span>
                  <span className="text-[10px] font-semibold text-slate-400">
                    {progressModal.type === 'create'
                      ? 'Penyimpanan Baru'
                      : progressModal.type === 'update'
                      ? 'Pembaruan Data'
                      : 'Pembaruan Disposisi'}
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-bold text-white mt-0.5">
                  {progressModal.isComplete
                    ? 'Proses Persuratan Selesai!'
                    : progressModal.error
                    ? 'Penyimpanan Gagal'
                    : progressModal.type === 'create'
                    ? `Menyimpan ${progressModal.jenisSurat === 'surat_keluar' ? 'Surat Keluar' : 'Surat Masuk'} Baru`
                    : progressModal.type === 'update'
                    ? `Memperbarui Data ${progressModal.jenisSurat === 'surat_keluar' ? 'Surat Keluar' : 'Surat Masuk'}`
                    : 'Memperbarui Disposisi MPH Jemaat'}
                </h3>
              </div>
            </div>

            {progressModal.isComplete && (
              <button
                type="button"
                onClick={() => setProgressModal((p) => ({ ...p, isOpen: false }))}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Letter Info Preview Card */}
          <div className="p-3.5 bg-slate-950/80 rounded-xl border border-slate-800 space-y-2 text-xs">
            <div className="flex items-center justify-between gap-2">
              <span className="text-slate-400 font-semibold">Nomor Persuratan:</span>
              <span className="font-mono font-bold text-cyan-300 truncate max-w-[260px]">
                {progressModal.nomor}
              </span>
            </div>
            <div className="flex items-start justify-between gap-2 pt-1 border-t border-slate-800/80">
              <span className="text-slate-400 font-semibold shrink-0">Perihal:</span>
              <span className="font-semibold text-slate-100 text-right line-clamp-1">
                {progressModal.perihal}
              </span>
            </div>
            <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-800/80">
              <span className="text-slate-400 font-semibold">{progressModal.pihakLabel}:</span>
              <span className="text-slate-300 text-right truncate max-w-[240px]">
                {progressModal.pihakValue || '-'}
              </span>
            </div>
          </div>

          {/* Progress Bar & Percentage */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                {!progressModal.isComplete && !progressModal.error && (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-400" />
                )}
                <span>{progressModal.stageMessage}</span>
              </span>
              <span
                className={`font-mono font-black ${
                  progressModal.isComplete
                    ? 'text-emerald-400'
                    : progressModal.error
                    ? 'text-rose-400'
                    : 'text-blue-400'
                }`}
              >
                {progressModal.progress}%
              </span>
            </div>
            <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden p-0.5 border border-slate-700/80">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  progressModal.isComplete
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-400 shadow-sm shadow-emerald-500/50'
                    : progressModal.error
                    ? 'bg-gradient-to-r from-rose-500 to-amber-500'
                    : 'bg-gradient-to-r from-blue-500 via-indigo-500 to-cyan-400 shadow-sm shadow-blue-500/50'
                }`}
                style={{ width: `${progressModal.progress}%` }}
              />
            </div>
          </div>

          {/* Real-time Step Timeline */}
          <div className="space-y-2 pt-1">
            {[
              {
                title: 'Validasi Format & Nomor Baku',
                desc: 'Pengecekan perihal, tanggal, dan format nomor juknis Sinode GKE',
              },
              {
                title: 'Sinkronisasi Basis Data Cloud',
                desc: 'Perekaman dokumen persuratan ke database Firestore cloud',
              },
              {
                title: 'Pembaruan Indeks & Buku Agenda',
                desc: 'Sinkronisasi riwayat disposisi, status arsip, dan daftar agenda',
              },
              {
                title: 'Verifikasi & Selesai',
                desc: 'Data terverifikasi dan siap dicetak atau ditindaklanjuti',
              },
            ].map((step, idx) => {
              const isFinished = progressModal.currentStepIndex > idx || progressModal.isComplete;
              const isCurrent = progressModal.currentStepIndex === idx && !progressModal.isComplete;
              return (
                <div
                  key={idx}
                  className={`flex items-start gap-3 p-2.5 rounded-xl border transition-all ${
                    isFinished
                      ? 'bg-emerald-950/20 border-emerald-500/30'
                      : isCurrent
                      ? 'bg-blue-950/30 border-blue-500/40 shadow-sm shadow-blue-500/10'
                      : 'bg-slate-950/30 border-slate-800/60 opacity-50'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5 transition-colors ${
                      isFinished
                        ? 'bg-emerald-500 text-slate-950'
                        : isCurrent
                        ? 'bg-blue-500 text-white'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {isFinished ? (
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    ) : isCurrent ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      idx + 1
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-xs font-bold ${
                          isFinished
                            ? 'text-emerald-300'
                            : isCurrent
                            ? 'text-blue-300'
                            : 'text-slate-400'
                        }`}
                      >
                        {step.title}
                      </span>
                      {isFinished && (
                        <span className="text-[10px] font-semibold text-emerald-400">Selesai</span>
                      )}
                      {isCurrent && (
                        <span className="text-[10px] font-semibold text-blue-400 animate-pulse">
                          Memproses...
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer Action / Status Notification */}
          <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-3">
            {progressModal.isComplete ? (
              <>
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>
                    {autoCloseCountdown !== null
                      ? `Menutup otomatis dalam ${autoCloseCountdown}s...`
                      : 'Data persuratan berhasil disimpan.'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setProgressModal((p) => ({ ...p, isOpen: false }))}
                  className="px-4 py-2 text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-xl shadow-lg shadow-emerald-500/20 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Selesai</span>
                </button>
              </>
            ) : progressModal.error ? (
              <>
                <span className="text-xs text-rose-400 font-semibold">{progressModal.error}</span>
                <button
                  type="button"
                  onClick={() => setProgressModal((p) => ({ ...p, isOpen: false }))}
                  className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 rounded-xl transition-all cursor-pointer"
                >
                  Tutup
                </button>
              </>
            ) : (
              <div className="w-full flex items-center justify-center gap-2 text-xs text-slate-400 py-1">
                <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
                <span>Pengurus dapat memantau progres penyimpanan di atas...</span>
              </div>
            )}
          </div>
        </div>
      </div>
    )}
    </div>
  );
};

