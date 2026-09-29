import React, { useState, useMemo } from 'react';
import {
  Bug,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertOctagon,
  AlertTriangle,
  FileText,
  Trash2,
  Edit3,
  ExternalLink,
  ChevronRight,
  User,
  Laptop,
  Smartphone,
  Info,
  Printer,
  ShieldCheck,
  Sparkles,
  X,
  MessageSquare,
  Eye,
  Check,
  Send,
  HelpCircle,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { LaporanBug, BugStatus, BugPrioritas, BugKategori } from '../../types';
import { LaporkanBugModal } from '../LaporkanBugModal';

export const LaporanBugModule: React.FC = () => {
  const {
    laporanBugList,
    updateLaporanBug,
    deleteLaporanBug,
    currentUser,
    settings,
  } = useApp();

  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [selectedBug, setSelectedBug] = useState<LaporanBug | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isImagePreviewOpen, setIsImagePreviewOpen] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState('');

  // Editing state inside detail modal
  const [tanggapanText, setTanggapanText] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<BugStatus>('Baru');
  const [penanganNama, setPenanganNama] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('semua');
  const [prioritasFilter, setPrioritasFilter] = useState<string>('semua');
  const [kategoriFilter, setKategoriFilter] = useState<string>('semua');

  // Stats calculation
  const stats = useMemo(() => {
    const total = laporanBugList.length;
    const baru = laporanBugList.filter((b) => b.status === 'Baru').length;
    const proses = laporanBugList.filter((b) => b.status === 'Dalam Penanganan').length;
    const selesai = laporanBugList.filter((b) => b.status === 'Selesai').length;
    const kritis = laporanBugList.filter((b) => b.prioritas === 'Kritis' && b.status !== 'Selesai').length;

    return { total, baru, proses, selesai, kritis };
  }, [laporanBugList]);

  // Filtered bugs
  const filteredBugs = useMemo(() => {
    return laporanBugList.filter((bug) => {
      // Search
      const q = searchQuery.toLowerCase();
      const matchSearch =
        !q ||
        bug.judul.toLowerCase().includes(q) ||
        bug.deskripsi.toLowerCase().includes(q) ||
        bug.halamanTerkait.toLowerCase().includes(q) ||
        bug.pelapor.nama.toLowerCase().includes(q) ||
        (bug.tanggapanAdmin && bug.tanggapanAdmin.toLowerCase().includes(q));

      // Status
      const matchStatus = statusFilter === 'semua' || bug.status === statusFilter;

      // Prioritas
      const matchPrioritas = prioritasFilter === 'semua' || bug.prioritas === prioritasFilter;

      // Kategori
      const matchKategori = kategoriFilter === 'semua' || bug.kategori === kategoriFilter;

      return matchSearch && matchStatus && matchPrioritas && matchKategori;
    });
  }, [laporanBugList, searchQuery, statusFilter, prioritasFilter, kategoriFilter]);

  const handleOpenDetail = (bug: LaporanBug) => {
    setSelectedBug(bug);
    setSelectedStatus(bug.status);
    setTanggapanText(bug.tanggapanAdmin || '');
    setPenanganNama(bug.ditanganiOleh || currentUser?.namaLengkap || 'Tim Developer');
    setIsDetailModalOpen(true);
  };

  const handleSaveUpdate = async () => {
    if (!selectedBug) return;
    setIsUpdating(true);
    try {
      const trimmedTanggapan = tanggapanText.trim();
      let finalTanggapan = trimmedTanggapan;
      
      // If no response text was entered but status is updated, provide a helpful default note
      if (!finalTanggapan) {
        if (selectedStatus === 'Selesai') {
          finalTanggapan = 'Laporan kendala telah ditangani dan dinyatakan selesai.';
        } else if (selectedStatus === 'Dalam Penanganan') {
          finalTanggapan = 'Laporan kendala sedang dalam proses investigasi dan penanganan teknis.';
        } else if (selectedStatus === 'Ditolak') {
          finalTanggapan = 'Laporan telah ditinjau dan ditutup.';
        }
      }

      const effectiveDitanganiOleh = penanganNama.trim() || currentUser?.namaLengkap || 'Tim Developer GKE';

      await updateLaporanBug(selectedBug.id, {
        status: selectedStatus,
        tanggapanAdmin: finalTanggapan || undefined,
        ditanganiOleh: effectiveDitanganiOleh,
      });

      // Update local view
      setSelectedBug((prev) =>
        prev
          ? {
              ...prev,
              status: selectedStatus,
              tanggapanAdmin: finalTanggapan || undefined,
              ditanganiOleh: effectiveDitanganiOleh,
              tanggalUpdate: new Date().toISOString().replace('T', ' ').substring(0, 16),
            }
          : null
      );
      setIsDetailModalOpen(false);
    } catch (err) {
      console.error('Gagal memperbarui status bug:', err);
      alert('Terjadi kendala saat memperbarui status laporan.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async (id: string, judul: string) => {
    if (confirm(`Apakah Anda yakin ingin menghapus laporan bug: "${judul}"?`)) {
      await deleteLaporanBug(id);
      if (selectedBug?.id === id) {
        setIsDetailModalOpen(false);
        setSelectedBug(null);
      }
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const getStatusBadge = (status: BugStatus) => {
    switch (status) {
      case 'Baru':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center gap-1">
            <Clock className="w-3 h-3" /> Baru
          </span>
        );
      case 'Dalam Penanganan':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-sky-500/15 text-sky-300 border border-sky-500/30 flex items-center gap-1">
            <Sparkles className="w-3 h-3" /> Dalam Penanganan
          </span>
        );
      case 'Selesai':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Selesai
          </span>
        );
      case 'Ditolak':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-500/15 text-slate-400 border border-slate-500/30 flex items-center gap-1">
            <X className="w-3 h-3" /> Ditolak / Duplikat
          </span>
        );
    }
  };

  const getPrioritasBadge = (prioritas: BugPrioritas) => {
    switch (prioritas) {
      case 'Kritis':
        return (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-rose-600/20 text-rose-300 border border-rose-600/40">
            🔴 Kritis
          </span>
        );
      case 'Tinggi':
        return (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40">
            🟠 Tinggi
          </span>
        );
      case 'Sedang':
        return (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
            🟡 Sedang
          </span>
        );
      case 'Rendah':
        return (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
            🟢 Rendah
          </span>
        );
    }
  };

  const getResponseStatusBadge = (bug: LaporanBug) => {
    // 1. If admin provided a written response / notes
    if (bug.tanggapanAdmin && bug.tanggapanAdmin.trim().length > 0) {
      return (
        <span className="text-[11px] font-medium text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20 flex items-center gap-1.5 shadow-sm">
          <MessageSquare className="w-3.5 h-3.5 text-emerald-400" /> Ada Tanggapan
        </span>
      );
    }

    // 2. If status is Selesai
    if (bug.status === 'Selesai') {
      return (
        <span className="text-[11px] font-medium text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20 flex items-center gap-1.5 shadow-sm">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Sudah Selesai
        </span>
      );
    }

    // 3. If status is Dalam Penanganan
    if (bug.status === 'Dalam Penanganan') {
      return (
        <span className="text-[11px] font-medium text-sky-400 bg-sky-500/10 px-2.5 py-1 rounded-lg border border-sky-500/20 flex items-center gap-1.5 shadow-sm">
          <Sparkles className="w-3.5 h-3.5 text-sky-400" /> Sedang Ditangani
        </span>
      );
    }

    // 4. If status is Ditolak
    if (bug.status === 'Ditolak') {
      return (
        <span className="text-[11px] font-medium text-slate-400 bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700 flex items-center gap-1.5 shadow-sm">
          <X className="w-3.5 h-3.5 text-slate-400" /> Selesai Ditinjau
        </span>
      );
    }

    // 5. Default: Status Baru (Menunggu Respon)
    return (
      <span className="text-[11px] font-medium text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20 flex items-center gap-1.5 shadow-sm">
        <Clock className="w-3.5 h-3.5 text-amber-400" /> Menunggu Respon
      </span>
    );
  };

  const isAdminOrStaff = currentUser?.role === 'admin' || currentUser?.role === 'sekretaris' || currentUser?.role === 'bendahara';

  return (
    <div className="space-y-6">
      {/* Module Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-950/80 p-4 sm:p-6 rounded-2xl border border-slate-800 shadow-xl backdrop-blur-sm print:hidden">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-2xl bg-gradient-to-tr from-rose-600 to-rose-500 text-white shadow-lg shadow-rose-600/30 flex-shrink-0">
            <Bug className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              <span>Laporan Bug & Kendala Sistem</span>
              {stats.baru > 0 && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-500 text-white animate-pulse">
                  {stats.baru} Baru
                </span>
              )}
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
              Pusat pelaporan kendala teknis, masukan fitur, dan pemantauan perbaikan sistem informasi GKE
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={handlePrint}
            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white font-semibold text-xs transition flex items-center gap-2 cursor-pointer shadow-sm"
          >
            <Printer className="w-4 h-4 text-indigo-400" />
            <span>Cetak Rekap</span>
          </button>
          <button
            type="button"
            onClick={() => setIsReportModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-bold text-xs shadow-lg shadow-rose-600/30 transition flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Laporkan Bug Baru</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-4 print:hidden">
        <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80 shadow-md">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total Laporan</p>
          <p className="text-2xl font-black text-white mt-1">{stats.total}</p>
          <span className="text-[10px] text-slate-500 mt-0.5 block">Seluruh kendala tercatat</span>
        </div>

        <div className="bg-slate-950/60 p-4 rounded-2xl border border-amber-500/20 shadow-md">
          <p className="text-[11px] font-semibold text-amber-400 uppercase tracking-wider flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" /> Menunggu Tindak
          </p>
          <p className="text-2xl font-black text-amber-300 mt-1">{stats.baru}</p>
          <span className="text-[10px] text-amber-400/70 mt-0.5 block">Laporan status baru</span>
        </div>

        <div className="bg-slate-950/60 p-4 rounded-2xl border border-sky-500/20 shadow-md">
          <p className="text-[11px] font-semibold text-sky-400 uppercase tracking-wider flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5" /> Sedang Ditangani
          </p>
          <p className="text-2xl font-black text-sky-300 mt-1">{stats.proses}</p>
          <span className="text-[10px] text-sky-400/70 mt-0.5 block">Dalam proses perbaikan</span>
        </div>

        <div className="bg-slate-950/60 p-4 rounded-2xl border border-emerald-500/20 shadow-md">
          <p className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> Telah Selesai
          </p>
          <p className="text-2xl font-black text-emerald-300 mt-1">{stats.selesai}</p>
          <span className="text-[10px] text-emerald-400/70 mt-0.5 block">Berhasil diperbaiki</span>
        </div>

        <div className="col-span-2 sm:col-span-1 bg-slate-950/60 p-4 rounded-2xl border border-rose-500/20 shadow-md">
          <p className="text-[11px] font-semibold text-rose-400 uppercase tracking-wider flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5" /> Kritis Aktif
          </p>
          <p className="text-2xl font-black text-rose-400 mt-1">{stats.kritis}</p>
          <span className="text-[10px] text-rose-400/70 mt-0.5 block">Perlu prioritas utama</span>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 shadow-md space-y-3 print:hidden">
        <div className="flex flex-col md:flex-row items-center gap-3">
          {/* Search Box */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari judul masalah, modul, nama pelapor, deskripsi..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Filter Status */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full md:w-auto px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="semua">Semua Status</option>
              <option value="Baru">Status: Baru</option>
              <option value="Dalam Penanganan">Status: Dalam Penanganan</option>
              <option value="Selesai">Status: Selesai</option>
              <option value="Ditolak">Status: Ditolak</option>
            </select>

            {/* Filter Prioritas */}
            <select
              value={prioritasFilter}
              onChange={(e) => setPrioritasFilter(e.target.value)}
              className="w-full md:w-auto px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="semua">Semua Prioritas</option>
              <option value="Kritis">🔴 Prioritas Kritis</option>
              <option value="Tinggi">🟠 Prioritas Tinggi</option>
              <option value="Sedang">🟡 Prioritas Sedang</option>
              <option value="Rendah">🟢 Prioritas Rendah</option>
            </select>
          </div>
        </div>
      </div>

      {/* Bug Report List */}
      <div className="bg-slate-950/80 rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
        {filteredBugs.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-slate-800 text-slate-500 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-7 h-7 text-emerald-400" />
            </div>
            <h3 className="font-bold text-white text-base">Tidak Ada Laporan Bug yang Sesuai</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              {searchQuery || statusFilter !== 'semua' || prioritasFilter !== 'semua'
                ? 'Coba sesuaikan kata kunci pencarian atau filter status untuk menemukan laporan.'
                : 'Belum ada kendala sistem yang dilaporkan. Sistem berjalan lancar!'}
            </p>
            <button
              type="button"
              onClick={() => setIsReportModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-indigo-300 text-xs font-semibold inline-flex items-center gap-1.5 transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Buat Laporan Baru
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-800/80">
            {filteredBugs.map((bug) => (
              <div
                key={bug.id}
                onClick={() => handleOpenDetail(bug)}
                className="p-4 sm:p-5 hover:bg-slate-900/60 transition cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
              >
                <div className="space-y-2 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    {getStatusBadge(bug.status)}
                    {getPrioritasBadge(bug.prioritas)}
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                      {bug.kategori}
                    </span>
                    <span className="text-[11px] text-slate-400">• {bug.halamanTerkait}</span>
                  </div>

                  <div>
                    <h4 className="font-bold text-slate-100 text-sm sm:text-base group-hover:text-indigo-300 transition-colors line-clamp-1">
                      {bug.judul}
                    </h4>
                    <p className="text-xs text-slate-400 line-clamp-2 mt-0.5 leading-relaxed">
                      {bug.deskripsi}
                    </p>
                  </div>

                  {/* Submitter & Device Meta */}
                  <div className="flex items-center gap-4 text-[11px] text-slate-400 flex-wrap pt-1">
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3 text-indigo-400" />
                      <strong>{bug.pelapor.nama}</strong> ({bug.pelapor.role})
                    </span>
                    <span>Waktu Lapor: {bug.tanggalLapor}</span>
                    {bug.infoPerangkat?.browser && (
                      <span className="hidden md:inline-flex items-center gap-1 text-slate-400">
                        <Laptop className="w-3 h-3 text-slate-400" />
                        {bug.infoPerangkat.browser} ({bug.infoPerangkat.os})
                      </span>
                    )}
                    {bug.lampiranUrl && (
                      <span className="inline-flex items-center gap-1 text-sky-400 font-semibold">
                        <FileText className="w-3 h-3" /> Ada Tangkapan Layar
                      </span>
                    )}
                  </div>
                </div>

                {/* Right Action Trigger */}
                <div className="flex items-center gap-3 flex-shrink-0 self-end sm:self-center">
                  {getResponseStatusBadge(bug)}
                  <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-white transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Detail & Tindak Lanjut Modal */}
      {isDetailModalOpen && selectedBug && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col my-auto animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-800 bg-slate-950/90 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
                  <Bug className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs text-indigo-400">#{selectedBug.id}</span>
                    {getStatusBadge(selectedBug.status)}
                    {getPrioritasBadge(selectedBug.prioritas)}
                  </div>
                  <h3 className="font-bold text-slate-100 text-base mt-0.5 line-clamp-1">
                    {selectedBug.judul}
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsDetailModalOpen(false)}
                className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-5 text-xs text-slate-200">
              {/* Info Badges Row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Kategori</span>
                  <span className="font-semibold text-slate-200">{selectedBug.kategori}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Modul / Halaman</span>
                  <span className="font-semibold text-slate-200">{selectedBug.halamanTerkait}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Waktu Lapor</span>
                  <span className="font-semibold text-slate-200">{selectedBug.tanggalLapor}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Pelapor</span>
                  <span className="font-semibold text-indigo-300">
                    {selectedBug.pelapor.nama} ({selectedBug.pelapor.role})
                  </span>
                  {selectedBug.pelapor.noHp && (
                    <span className="text-[10px] text-slate-400 block">WA: {selectedBug.pelapor.noHp}</span>
                  )}
                </div>
              </div>

              {/* Deskripsi Masalah */}
              <div className="space-y-1.5">
                <h4 className="font-bold text-slate-100 flex items-center gap-1.5 text-xs uppercase tracking-wider text-indigo-400">
                  <Info className="w-3.5 h-3.5" /> Deskripsi Masalah Lengkap
                </h4>
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 leading-relaxed whitespace-pre-line text-xs">
                  {selectedBug.deskripsi}
                </div>
              </div>

              {/* Langkah Reproduksi & Pesan Error */}
              {(selectedBug.langkahReproduksi || selectedBug.pesanError) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {selectedBug.langkahReproduksi && (
                    <div className="space-y-1.5">
                      <h4 className="font-bold text-slate-300 text-xs">Langkah Memicu Masalah:</h4>
                      <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 whitespace-pre-line text-slate-300 text-[11px]">
                        {selectedBug.langkahReproduksi}
                      </div>
                    </div>
                  )}

                  {selectedBug.pesanError && (
                    <div className="space-y-1.5">
                      <h4 className="font-bold text-rose-300 text-xs">Pesan / Kode Error:</h4>
                      <div className="p-3 rounded-xl bg-slate-950 border border-rose-500/30 text-rose-300 font-mono text-[11px] whitespace-pre-line">
                        {selectedBug.pesanError}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Screenshot Preview */}
              {selectedBug.lampiranUrl && (
                <div className="space-y-1.5">
                  <h4 className="font-bold text-slate-300 text-xs flex items-center justify-between">
                    <span>Tangkapan Layar Bukti Kendala:</span>
                    <button
                      type="button"
                      onClick={() => {
                        setPreviewImageUrl(selectedBug.lampiranUrl || '');
                        setIsImagePreviewOpen(true);
                      }}
                      className="text-[11px] text-indigo-400 hover:text-indigo-200 underline cursor-pointer flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" /> Buka Ukuran Penuh
                    </button>
                  </h4>
                  <div
                    onClick={() => {
                      setPreviewImageUrl(selectedBug.lampiranUrl || '');
                      setIsImagePreviewOpen(true);
                    }}
                    className="p-2 rounded-xl bg-slate-950 border border-slate-800 inline-block cursor-pointer hover:border-indigo-500 transition"
                  >
                    <img
                      src={selectedBug.lampiranUrl}
                      alt="Bukti Bug"
                      className="max-h-48 rounded-lg object-contain"
                    />
                  </div>
                </div>
              )}

              {/* Technical Environment Details */}
              {selectedBug.infoPerangkat && (
                <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 space-y-1.5 text-[11px]">
                  <span className="font-bold text-slate-300 flex items-center gap-1.5">
                    <Laptop className="w-3.5 h-3.5 text-indigo-400" />
                    Informasi Lingkungan & Perangkat Pelapor
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-slate-400">
                    <div>Browser: <strong className="text-slate-200">{selectedBug.infoPerangkat.browser || '-'}</strong></div>
                    <div>Sistem Operasi: <strong className="text-slate-200">{selectedBug.infoPerangkat.os || '-'}</strong></div>
                    <div>Resolusi Layar: <strong className="text-slate-200">{selectedBug.infoPerangkat.screenResolution || '-'}</strong></div>
                    <div>Jaringan: <strong className="text-emerald-400">{selectedBug.infoPerangkat.onlineStatus ? 'Online' : 'Offline'}</strong></div>
                  </div>
                </div>
              )}

              {/* Tindak Lanjut & Tanggapan Admin / Developer */}
              <div className="p-4 bg-indigo-950/30 rounded-xl border border-indigo-500/30 space-y-3">
                <h4 className="font-bold text-indigo-200 flex items-center gap-1.5 text-xs">
                  <ShieldCheck className="w-4 h-4 text-indigo-400" />
                  Tindak Lanjut & Tanggapan Tim Developer GKE
                </h4>

                {isAdminOrStaff ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                          Ubah Status Penanganan
                        </label>
                        <select
                          value={selectedStatus}
                          onChange={(e) => setSelectedStatus(e.target.value as BugStatus)}
                          className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-indigo-500"
                        >
                          <option value="Baru">Baru (Menunggu Tindak Lanjut)</option>
                          <option value="Dalam Penanganan">Dalam Penanganan (Sedang Dikerjakan)</option>
                          <option value="Selesai">Selesai (Sudah Diperbaiki / Fixed)</option>
                          <option value="Ditolak">Ditolak / Bukan Bug / Duplikat</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                          Penanggung Jawab / Ditangani Oleh
                        </label>
                        <input
                          type="text"
                          value={penanganNama || ''}
                          onChange={(e) => setPenanganNama(e.target.value)}
                          placeholder="Nama developer atau pengurus..."
                          className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                        Catatan Tanggapan Teknis / Solusi Perbaikan
                      </label>
                      <textarea
                        rows={3}
                        value={tanggapanText || ''}
                        onChange={(e) => setTanggapanText(e.target.value)}
                        placeholder="Tuliskan catatan perbaikan, commit ID, penjelasan teknis, atau solusi yang telah diterapkan..."
                        className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-y"
                      />
                    </div>
                  </div>
                ) : (
                  <div>
                    {selectedBug.tanggapanAdmin ? (
                      <div className="p-3 bg-slate-900 rounded-lg text-slate-200 text-xs leading-relaxed">
                        <p className="font-semibold text-indigo-300 mb-1">
                          Oleh {selectedBug.ditanganiOleh || 'Tim Developer'}:
                        </p>
                        <p>{selectedBug.tanggapanAdmin}</p>
                        {selectedBug.tanggalUpdate && (
                          <span className="text-[10px] text-slate-400 block mt-2">
                            Pembaruan: {selectedBug.tanggalUpdate}
                          </span>
                        )}
                      </div>
                    ) : (
                      <p className="text-slate-400 italic text-xs">
                        Laporan ini belum memiliki catatan tanggapan resmi dari tim pengembang.
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="px-6 py-3.5 border-t border-slate-800 bg-slate-950 flex items-center justify-between gap-3">
              {isAdminOrStaff ? (
                <button
                  type="button"
                  onClick={() => handleDelete(selectedBug.id, selectedBug.judul)}
                  className="px-3 py-2 rounded-xl bg-rose-950/60 hover:bg-rose-900 border border-rose-800/80 text-rose-300 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Hapus Laporan</span>
                </button>
              ) : <div />}

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsDetailModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition cursor-pointer"
                >
                  Tutup
                </button>
                {isAdminOrStaff && (
                  <button
                    type="button"
                    onClick={handleSaveUpdate}
                    disabled={isUpdating}
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-indigo-600/30 transition cursor-pointer disabled:opacity-50"
                  >
                    {isUpdating ? (
                      <span>Menyimpan...</span>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Simpan Pembaruan</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Image Preview Modal */}
      {isImagePreviewOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={() => setIsImagePreviewOpen(false)}
        >
          <div className="relative max-w-5xl max-h-[90vh] overflow-hidden rounded-2xl bg-slate-900 border border-slate-800 p-2">
            <button
              type="button"
              onClick={() => setIsImagePreviewOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-xl bg-slate-950/80 text-white hover:bg-slate-900 transition cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>
            <img
              src={previewImageUrl}
              alt="Preview Full"
              className="max-h-[85vh] max-w-full rounded-xl object-contain mx-auto"
            />
          </div>
        </div>
      )}

      {/* Bug Report Submission Modal */}
      <LaporkanBugModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
      />
    </div>
  );
};
