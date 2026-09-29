import React, { useState } from 'react';
import {
  GraduationCap,
  Heart,
  Calendar,
  Clock,
  MapPin,
  UserCheck,
  Search,
  Filter,
  Plus,
  Printer,
  Edit2,
  Trash2,
  CheckCircle2,
  X,
  BookOpen,
  FileText,
  AlertCircle,
  Users,
  Award,
  Archive,
  RotateCcw,
  FolderArchive,
  Check,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { JadwalKatekisasi } from '../../types';
import { DeleteConfirmModal } from '../DeleteConfirmModal';

export const JadwalKatekisasiModule: React.FC = () => {
  const {
    jadwalKatekisasiList,
    pelayananSakramenList,
    addJadwalKatekisasi,
    updateJadwalKatekisasi,
    deleteJadwalKatekisasi,
    openPrintReport,
    currentUser,
    wargaJemaatList,
    updateWargaJemaat,
    settings,
  } = useApp();

  const isManagementRole =
    !currentUser?.role ||
    currentUser?.role === 'admin' ||
    currentUser?.role === 'sekretaris' ||
    currentUser?.role === 'bendahara' ||
    currentUser?.role === 'mph' ||
    currentUser?.role === 'penatua' ||
    currentUser?.role === 'diakon';

  const defaultChurchLocation = settings.namaJemaat ? `Gedung Gereja GKE ${settings.namaJemaat}` : 'Gedung Gereja GKE';

  // Filters & State
  const [selectedCategory, setSelectedCategory] = useState<'semua' | 'sidi' | 'pernikahan'>('semua');
  const [selectedStatus, setSelectedStatus] = useState<string>('semua');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'jadwal' | 'arsip' | 'peserta'>('jadwal');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<JadwalKatekisasi | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<JadwalKatekisasi | null>(null);
  const [confirmActionModal, setConfirmActionModal] = useState<{
    type: 'baptis' | 'sidi' | 'nikah';
    warga: any;
  } | null>(null);
  const [weddingDateInput, setWeddingDateInput] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [isSavingStatus, setIsSavingStatus] = useState<boolean>(false);

  // Archive Modal & Progress State
  const [archiveModalTarget, setArchiveModalTarget] = useState<{
    item: JadwalKatekisasi;
    action: 'archive' | 'unarchive';
  } | null>(null);
  const [isSavingArchive, setIsSavingArchive] = useState<boolean>(false);
  const [archiveProgress, setArchiveProgress] = useState<number>(0);
  const [archiveReason, setArchiveReason] = useState<string>('');

  // Add Session Confirmation & Progress State
  const [isConfirmAddModalOpen, setIsConfirmAddModalOpen] = useState<boolean>(false);
  const [isSavingAddSession, setIsSavingAddSession] = useState<boolean>(false);
  const [addSessionProgress, setAddSessionProgress] = useState<number>(0);

  // Form State
  const [formData, setFormData] = useState<Omit<JadwalKatekisasi, 'id'>>({
    kategori: 'sidi',
    judulProgram: '',
    materiBahasan: '',
    pengajar: '',
    tanggal: new Date().toISOString().split('T')[0],
    waktu: '15:00 - 17:00 WIB',
    tempat: defaultChurchLocation,
    pesertaTarget: '',
    jumlahPertemuan: 'Pertemuan 1 dari 12',
    status: 'Terjadwal',
    persyaratan: '',
    keterangan: '',
    statusArsip: 'Aktif',
  });

  // Peserta SIDI / Nikah candidate status management
  const [candidateSearch, setCandidateSearch] = useState<string>('');
  const [selectedCandidateStatus, setSelectedCandidateStatus] = useState<string>('semua');

  // Handle open create/edit modal
  const handleOpenCreateModal = (kategori: 'sidi' | 'pernikahan' = 'sidi') => {
    setEditingItem(null);
    setFormData({
      kategori,
      judulProgram: kategori === 'sidi' ? `Katekisasi SIDI Angkatan ${new Date().getFullYear()} - Sesi ` : `Katekisasi Pra-Nikah Angkatan ${new Date().getFullYear()} - Sesi `,
      materiBahasan: '',
      pengajar: settings.namaKetuaJemaat || '',
      tanggal: new Date().toISOString().split('T')[0],
      waktu: kategori === 'sidi' ? '15:00 - 17:00 WIB' : '09:00 - 12:00 WIB',
      tempat: defaultChurchLocation,
      pesertaTarget: '',
      jumlahPertemuan: kategori === 'sidi' ? 'Pertemuan 1 dari 12' : 'Pertemuan 1 dari 6',
      status: 'Terjadwal',
      persyaratan: 'Membawa Alkitab & Modul Katekisasi',
      keterangan: '',
      statusArsip: 'Aktif',
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: JadwalKatekisasi) => {
    setEditingItem(item);
    setFormData({
      kategori: item.kategori,
      judulProgram: item.judulProgram,
      materiBahasan: item.materiBahasan,
      pengajar: item.pengajar,
      tanggal: item.tanggal,
      waktu: item.waktu,
      tempat: item.tempat,
      pesertaTarget: item.pesertaTarget,
      jumlahPertemuan: item.jumlahPertemuan || '',
      status: item.status,
      persyaratan: item.persyaratan || '',
      keterangan: item.keterangan || '',
      statusArsip: item.statusArsip || 'Aktif',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.judulProgram || !formData.pengajar || !formData.tanggal) {
      alert('Mohon lengkapi Judul Program, Pengajar, dan Tanggal Pelaksanaan.');
      return;
    }

    if (editingItem) {
      await updateJadwalKatekisasi(editingItem.id, formData);
      setIsModalOpen(false);
    } else {
      setIsConfirmAddModalOpen(true);
    }
  };

  const handleConfirmAddSession = async () => {
    setIsSavingAddSession(true);
    setAddSessionProgress(30);
    try {
      setAddSessionProgress(70);
      await addJadwalKatekisasi(formData);
      setAddSessionProgress(100);
      setTimeout(() => {
        setIsSavingAddSession(false);
        setIsConfirmAddModalOpen(false);
        setIsModalOpen(false);
        setAddSessionProgress(0);
      }, 300);
    } catch (err) {
      console.error('Error adding session:', err);
      alert('Gagal menambah sesi katekisasi. Silakan coba lagi.');
      setIsSavingAddSession(false);
      setAddSessionProgress(0);
    }
  };

  const handleDelete = (item: JadwalKatekisasi) => {
    setDeleteTarget(item);
  };

  // Handle Archive / Unarchive
  const handleOpenArchiveModal = (item: JadwalKatekisasi, action: 'archive' | 'unarchive') => {
    setArchiveReason('');
    setArchiveModalTarget({ item, action });
  };

  const handleConfirmArchive = async () => {
    if (!archiveModalTarget) return;
    setIsSavingArchive(true);
    setArchiveProgress(30);
    try {
      const isArchiving = archiveModalTarget.action === 'archive';
      const updatedData: Partial<JadwalKatekisasi> = isArchiving
        ? {
            statusArsip: 'Diarsipkan',
            tanggalArsip: new Date().toISOString().split('T')[0],
            alasanArsip: archiveReason.trim() || undefined,
          }
        : {
            statusArsip: 'Aktif',
            tanggalArsip: undefined,
            alasanArsip: undefined,
          };

      setArchiveProgress(70);
      await updateJadwalKatekisasi(archiveModalTarget.item.id, updatedData);
      setArchiveProgress(100);

      setTimeout(() => {
        setIsSavingArchive(false);
        setArchiveModalTarget(null);
        setArchiveProgress(0);
      }, 300);
    } catch (err) {
      console.error('Error archiving session:', err);
      alert('Gagal mengubah status arsip sesi. Silakan coba lagi.');
      setIsSavingArchive(false);
      setArchiveProgress(0);
    }
  };

  // Active vs Archived Lists
  const activeSessions = jadwalKatekisasiList.filter((j) => j.statusArsip !== 'Diarsipkan');
  const archivedSessions = jadwalKatekisasiList.filter((j) => j.statusArsip === 'Diarsipkan');

  const countActive = activeSessions.length;
  const countArchived = archivedSessions.length;

  // Filtered List based on Active Tab
  const baseListForFilter = activeTab === 'arsip' ? archivedSessions : activeSessions;
  const filteredJadwal = baseListForFilter.filter((item) => {
    const matchCategory = selectedCategory === 'semua' || item.kategori === selectedCategory;
    const matchStatus = selectedStatus === 'semua' || item.status === selectedStatus;
    const matchSearch =
      item.judulProgram.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.materiBahasan.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.pengajar.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.tempat.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.pesertaTarget.toLowerCase().includes(searchTerm.toLowerCase());

    return matchCategory && matchStatus && matchSearch;
  });

  // Candidate Members
  const filteredWarga = wargaJemaatList.filter((w) => {
    const searchMatch =
      w.namaLengkap.toLowerCase().includes(candidateSearch.toLowerCase()) ||
      w.rayon.toLowerCase().includes(candidateSearch.toLowerCase()) ||
      (w.nik && w.nik.includes(candidateSearch));

    const isSidi = w.statusSidi === true || (w.statusSidi as any) === 'Sudah Sidi';
    const isMenikah = w.statusNikah === 'Menikah';

    if (selectedCandidateStatus === 'sidi_belum') {
      return searchMatch && !isSidi;
    }
    if (selectedCandidateStatus === 'sidi_sudah') {
      return searchMatch && isSidi;
    }
    if (selectedCandidateStatus === 'nikah_belum') {
      return searchMatch && !isMenikah;
    }
    return searchMatch;
  });

  // Metrics for Active Sessions
  const countSidi = activeSessions.filter((j) => j.kategori === 'sidi').length;
  const countPernikahan = activeSessions.filter((j) => j.kategori === 'pernikahan').length;
  const countBerlangsung = activeSessions.filter((j) => j.status === 'Berlangsung' || j.status === 'Terjadwal').length;

  // Session Completion Progress Metrics
  const sidiList = activeSessions.filter((j) => j.kategori === 'sidi');
  const sidiCompleted = sidiList.filter((j) => j.status === 'Selesai').length;
  const sidiTotal = sidiList.length;
  const sidiPercent = sidiTotal > 0 ? Math.round((sidiCompleted / sidiTotal) * 100) : 0;

  const nikahList = activeSessions.filter((j) => j.kategori === 'pernikahan');
  const nikahCompleted = nikahList.filter((j) => j.status === 'Selesai').length;
  const nikahTotal = nikahList.length;
  const nikahPercent = nikahTotal > 0 ? Math.round((nikahCompleted / nikahTotal) * 100) : 0;

  const totalCompleted = activeSessions.filter((j) => j.status === 'Selesai').length;
  const totalSessions = activeSessions.length;
  const overallPercent = totalSessions > 0 ? Math.round((totalCompleted / totalSessions) * 100) : 0;

  return (
    <div className="space-y-6 w-full min-w-0">
      {/* Page Header */}
      <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-4 sm:p-5 md:p-6 shadow-xl backdrop-blur-md w-full min-w-0 overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold tracking-wider uppercase mb-1">
              <GraduationCap className="w-4 h-4 shrink-0" />
              <span>Pembinaan Iman & Sakramen GKE</span>
            </div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white tracking-tight truncate">
              Jadwal Katekisasi SIDI & Pernikahan
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-4xl leading-relaxed">
              Manajemen jadwal kelas katekisasi peneguhan SIDI, bimbingan konseling pra-nikah, materi pengajaran, tempat & pengajar, serta pendaftaran calon peserta.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {isManagementRole && (
              <button
                onClick={() => handleOpenCreateModal('sidi')}
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-emerald-600/20 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>+ Sesi Katekisasi</span>
              </button>
            )}
            <button
              onClick={() => openPrintReport({ reportType: 'jadwal_katekisasi' })}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-indigo-600/20 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer shrink-0"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Jadwal</span>
            </button>
          </div>
        </div>

        {/* View Switcher: Jadwal vs Arsip vs Peserta Candidate Tracker */}
        <div className="flex items-center gap-2 border-b border-slate-700/80 mt-6 pt-2 overflow-x-auto whitespace-nowrap scrollbar-none">
          <button
            onClick={() => setActiveTab('jadwal')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer shrink-0 ${
              activeTab === 'jadwal'
                ? 'border-emerald-500 text-emerald-400 bg-slate-700/40 rounded-t-lg'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Jadwal &amp; Sesi Aktif ({countActive})</span>
          </button>

          <button
            onClick={() => setActiveTab('arsip')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer shrink-0 ${
              activeTab === 'arsip'
                ? 'border-amber-500 text-amber-400 bg-slate-700/40 rounded-t-lg'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Archive className="w-4 h-4" />
            <span>Arsip Sesi Pengajaran ({countArchived})</span>
          </button>

          <button
            onClick={() => setActiveTab('peserta')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer shrink-0 ${
              activeTab === 'peserta'
                ? 'border-emerald-500 text-emerald-400 bg-slate-700/40 rounded-t-lg'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Status Kelulusan SIDI &amp; Pra-Nikah</span>
          </button>
        </div>
      </div>

      {activeTab === 'jadwal' && (
        <>
          {/* Key Metric Overview Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 w-full">
            <div className="bg-slate-800/80 border border-slate-700/70 rounded-2xl p-4 flex items-center gap-4 shadow-lg min-w-0">
              <div className="p-3 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl shrink-0">
                <BookOpen className="w-6 h-6" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-xs font-medium text-slate-400 block truncate">Total Sesi Aktif</span>
                <span className="text-2xl font-black text-white">{countActive}</span>
                <span className="text-[11px] text-slate-400 block truncate">Jadwal Berjalan</span>
              </div>
            </div>

            <div className="bg-slate-800/80 border border-slate-700/70 rounded-2xl p-4 flex items-center gap-4 shadow-lg min-w-0">
              <div className="p-3 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-xl shrink-0">
                <GraduationCap className="w-6 h-6" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-xs font-medium text-slate-400 block truncate">Katekisasi SIDI</span>
                <span className="text-2xl font-black text-blue-400">{countSidi}</span>
                <span className="text-[11px] text-slate-400 block truncate">Pengajaran Pemuda/i</span>
              </div>
            </div>

            <div className="bg-slate-800/80 border border-slate-700/70 rounded-2xl p-4 flex items-center gap-4 shadow-lg min-w-0">
              <div className="p-3 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-xl shrink-0">
                <Heart className="w-6 h-6" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-xs font-medium text-slate-400 block truncate">Katekisasi Pra-Nikah</span>
                <span className="text-2xl font-black text-rose-400">{countPernikahan}</span>
                <span className="text-[11px] text-slate-400 block truncate">Bimbingan Calon Mempelai</span>
              </div>
            </div>

            <div 
              onClick={() => setActiveTab('arsip')}
              className="bg-slate-800/80 border border-slate-700/70 hover:border-amber-500/40 rounded-2xl p-4 flex items-center gap-4 shadow-lg min-w-0 transition-all cursor-pointer group"
            >
              <div className="p-3 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-xl shrink-0 group-hover:scale-105 transition-transform">
                <FolderArchive className="w-6 h-6" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-xs font-medium text-slate-400 block truncate">Sesi Diarsipkan</span>
                <span className="text-2xl font-black text-amber-400">{countArchived}</span>
                <span className="text-[11px] text-amber-400/80 block truncate group-hover:underline">Klik untuk Buka Arsip →</span>
              </div>
            </div>
          </div>

          {/* Progres Sesi Katekisasi Card */}
          <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 sm:p-5 shadow-lg w-full space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-700/80 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    Progres Sesi Katekisasi SIDI &amp; Pernikahan
                  </h3>
                  <p className="text-xs text-slate-400">
                    Kemajuan pelaksanaan materi pengajaran &amp; bimbingan sakramen
                  </p>
                </div>
              </div>
              <div className="shrink-0">
                <span className="text-xs font-extrabold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-xl inline-block">
                  Total: {overallPercent}% Selesai ({totalCompleted}/{totalSessions} Sesi)
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* SIDI Progress Bar */}
              <div className="bg-slate-900/70 p-3.5 rounded-xl border border-slate-700/80 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-blue-400 flex items-center gap-1.5">
                    <GraduationCap className="w-4 h-4" /> Katekisasi SIDI
                  </span>
                  <span className="font-mono text-slate-300 font-semibold">
                    {sidiCompleted} / {sidiTotal} Sesi ({sidiPercent}%)
                  </span>
                </div>
                <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden border border-slate-700">
                  <div
                    className="bg-gradient-to-r from-blue-600 to-cyan-400 h-full rounded-full transition-all duration-500"
                    style={{ width: `${sidiPercent}%` }}
                  />
                </div>
                <div className="flex justify-between items-center text-[11px] text-slate-400 pt-0.5">
                  <span>{sidiTotal - sidiCompleted} Sesi Belum / Berlangsung</span>
                  <span className="font-bold text-blue-300">
                    {sidiPercent === 100 ? '✓ Program Tuntas' : 'Dalam Proses'}
                  </span>
                </div>
              </div>

              {/* Pernikahan Progress Bar */}
              <div className="bg-slate-900/70 p-3.5 rounded-xl border border-slate-700/80 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-rose-400 flex items-center gap-1.5">
                    <Heart className="w-4 h-4" /> Katekisasi Pra-Nikah
                  </span>
                  <span className="font-mono text-slate-300 font-semibold">
                    {nikahCompleted} / {nikahTotal} Sesi ({nikahPercent}%)
                  </span>
                </div>
                <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden border border-slate-700">
                  <div
                    className="bg-gradient-to-r from-rose-600 to-amber-400 h-full rounded-full transition-all duration-500"
                    style={{ width: `${nikahPercent}%` }}
                  />
                </div>
                <div className="flex justify-between items-center text-[11px] text-slate-400 pt-0.5">
                  <span>{nikahTotal - nikahCompleted} Sesi Belum / Berlangsung</span>
                  <span className="font-bold text-rose-300">
                    {nikahPercent === 100 ? '✓ Bimbingan Tuntas' : 'Dalam Proses'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Filters Bar */}
          <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 shadow-lg w-full space-y-4">
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
              {/* Category Pills */}
              <div className="flex items-center gap-2 overflow-x-auto whitespace-nowrap scrollbar-none pb-1">
                <button
                  onClick={() => setSelectedCategory('semua')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                    selectedCategory === 'semua'
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                      : 'bg-slate-700/70 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  Semua Program ({jadwalKatekisasiList.length})
                </button>
                <button
                  onClick={() => setSelectedCategory('sidi')}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                    selectedCategory === 'sidi'
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                      : 'bg-slate-700/70 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  <GraduationCap className="w-3.5 h-3.5" />
                  <span>Katekisasi SIDI ({countSidi})</span>
                </button>
                <button
                  onClick={() => setSelectedCategory('pernikahan')}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                    selectedCategory === 'pernikahan'
                      ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                      : 'bg-slate-700/70 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  <Heart className="w-3.5 h-3.5" />
                  <span>Pra-Nikah / Pernikahan ({countPernikahan})</span>
                </button>
              </div>

              {/* Status Select & Search */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full lg:w-auto">
                <div className="relative w-full sm:w-48">
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    <option value="semua">Semua Status</option>
                    <option value="Terjadwal">Terjadwal</option>
                    <option value="Berlangsung">Berlangsung</option>
                    <option value="Selesai">Selesai</option>
                    <option value="Ditunda">Ditunda</option>
                  </select>
                </div>

                <div className="relative w-full sm:w-64 md:w-80">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Cari program, pengajar, materi..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 text-slate-100 text-xs rounded-xl pl-9 pr-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:outline-none placeholder-slate-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Schedule List Responsive Full-Width Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-5 w-full">
            {filteredJadwal.map((item) => (
              <div
                key={item.id}
                className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-4 sm:p-5 shadow-xl hover:border-slate-600 transition-all flex flex-col justify-between space-y-4 w-full min-w-0"
              >
                <div className="space-y-3 min-w-0">
                  {/* Top Badges */}
                  <div className="flex flex-wrap items-center justify-between gap-2 min-w-0">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-extrabold uppercase tracking-wider ${
                        item.kategori === 'sidi'
                          ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                          : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      }`}
                    >
                      {item.kategori === 'sidi' ? <GraduationCap className="w-3.5 h-3.5" /> : <Heart className="w-3.5 h-3.5" />}
                      <span>{item.kategori === 'sidi' ? 'Katekisasi SIDI' : 'Pra-Nikah'}</span>
                    </span>

                    <span
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold ${
                        item.status === 'Berlangsung'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : item.status === 'Selesai'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : item.status === 'Ditunda'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : 'bg-slate-700 text-slate-300 border border-slate-600'
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>

                  {/* Program Title */}
                  <div className="min-w-0">
                    <h3 className="text-base font-bold text-white leading-snug break-words">{item.judulProgram}</h3>
                    {item.jumlahPertemuan && (
                      <span className="text-xs text-emerald-400 font-semibold block mt-0.5">
                        {item.jumlahPertemuan}
                      </span>
                    )}
                  </div>

                  {/* Topic / Materi */}
                  <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800 text-xs text-slate-300 space-y-1 min-w-0 overflow-hidden">
                    <span className="font-bold text-slate-400 block text-[11px] uppercase tracking-wider">
                      Materi Bahasan:
                    </span>
                    <p className="leading-relaxed break-words">{item.materiBahasan}</p>
                  </div>

                  {/* Schedule Details Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-300 min-w-0">
                    <div className="flex items-start gap-2 bg-slate-900/40 p-2.5 rounded-lg min-w-0">
                      <UserCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <div className="min-w-0 flex-1">
                        <span className="text-[10px] text-slate-400 block font-semibold">Pengajar / Pembimbing:</span>
                        <span className="font-bold text-white break-words">{item.pengajar}</span>
                      </div>
                    </div>

                    <div className="flex items-start gap-2 bg-slate-900/40 p-2.5 rounded-lg min-w-0">
                      <Calendar className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                      <div className="min-w-0 flex-1">
                        <span className="text-[10px] text-slate-400 block font-semibold">Waktu Pelaksanaan:</span>
                        <span className="font-bold text-white block">{item.tanggal}</span>
                        <span className="block text-[11px] text-slate-400 break-words">{item.waktu}</span>
                      </div>
                    </div>

                    <div className="flex items-start gap-2 bg-slate-900/40 p-2.5 rounded-lg sm:col-span-2 min-w-0">
                      <MapPin className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                      <div className="min-w-0 flex-1">
                        <span className="text-[10px] text-slate-400 block font-semibold">Tempat / Ruangan:</span>
                        <span className="font-medium text-slate-200 break-words">{item.tempat}</span>
                      </div>
                    </div>

                    <div className="flex items-start gap-2 bg-slate-900/40 p-2.5 rounded-lg sm:col-span-2 min-w-0">
                      <Users className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <div className="min-w-0 flex-1">
                        <span className="text-[10px] text-slate-400 block font-semibold">Peserta Target / Pasangan:</span>
                        <span className="font-medium text-slate-200 break-words">{item.pesertaTarget}</span>
                      </div>
                    </div>
                  </div>

                  {/* Requirements & Notes */}
                  {item.persyaratan && (
                    <div className="text-[11px] text-slate-400 bg-slate-900/30 p-2.5 rounded-lg border border-slate-800/50 break-words min-w-0">
                      <span className="font-semibold text-slate-300">Persyaratan: </span>
                      <span>{item.persyaratan}</span>
                    </div>
                  )}

                  {/* Catatan / Keterangan Kelulusan Sakramen */}
                  {item.keterangan && (
                    <div className="text-[11px] text-emerald-300 bg-emerald-950/40 p-2.5 rounded-xl border border-emerald-800/60 break-words min-w-0 space-y-1.5">
                      <div className="flex items-center gap-1.5 font-bold text-emerald-300">
                        <Award className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>Peserta Lulus & Didaftarkan ke Sakramen:</span>
                      </div>
                      <p className="text-emerald-100/90 leading-relaxed break-words font-medium pl-5 whitespace-pre-line text-[11px]">
                        {item.keterangan}
                      </p>
                    </div>
                  )}
                </div>

                {/* Actions Footer */}
                {isManagementRole && (
                  <div className="pt-3 border-t border-slate-700/80 flex items-center justify-end gap-2 flex-wrap">
                    <button
                      onClick={() => handleOpenEditModal(item)}
                      className="flex items-center gap-1.5 bg-slate-700 hover:bg-slate-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-all cursor-pointer min-h-[36px]"
                      title="Edit Data Sesi Katekisasi"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>

                    {/* Tombol Arsipkan Sesi Aktif diantara tombol Edit dan Hapus */}
                    <button
                      onClick={() => handleOpenArchiveModal(item, 'archive')}
                      className="flex items-center gap-1.5 bg-indigo-600/90 hover:bg-indigo-500 active:scale-95 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-all cursor-pointer shadow-sm shadow-indigo-600/20 min-h-[36px]"
                      title="Arsipkan Sesi Pengajaran ini"
                    >
                      <Archive className="w-3.5 h-3.5" />
                      <span>Arsipkan Sesi</span>
                    </button>

                    <button
                      onClick={() => handleDelete(item)}
                      className="flex items-center gap-1.5 bg-rose-600/80 hover:bg-rose-600 active:scale-95 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-all cursor-pointer min-w-[36px] min-h-[36px] justify-center"
                      title="Hapus Jadwal Katekisasi"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Hapus</span>
                    </button>
                  </div>
                )}
              </div>
            ))}

            {filteredJadwal.length === 0 && (
              <div className="col-span-full bg-slate-800/50 border border-slate-700/60 rounded-2xl p-8 text-center space-y-3">
                <AlertCircle className="w-10 h-10 text-slate-500 mx-auto" />
                <h3 className="text-base font-bold text-slate-300">Belum ada Jadwal Katekisasi Aktif</h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  Silakan ubah kata kunci pencarian atau klik "+ Sesi Katekisasi" untuk menambahkan jadwal katekisasi SIDI atau pra-nikah baru.
                </p>
              </div>
            )}
          </div>
        </>
      )}

      {/* Arsip Sesi Pengajaran Tab */}
      {activeTab === 'arsip' && (
        <div className="space-y-5 w-full min-w-0">
          {/* Arsip Information Banner */}
          <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-4 sm:p-5 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3">
              <div className="p-3 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-xl shrink-0">
                <FolderArchive className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                  <span>Arsip Sesi Pengajaran Katekisasi</span>
                  <span className="text-xs font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2.5 py-0.5 rounded-full">
                    {countArchived} Sesi Terarsip
                  </span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Daftar seluruh materi, riwayat kelas, dan sesi pengajaran yang telah diarsipkan. Anda dapat mengaktifkan kembali sesi ke jadwal aktif sewaktu-waktu.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => openPrintReport({ reportType: 'jadwal_katekisasi' })}
                className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-all cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Cetak Arsip</span>
              </button>
            </div>
          </div>

          {/* Filters Bar for Archived Items */}
          <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 shadow-lg w-full space-y-4">
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
              {/* Category Pills */}
              <div className="flex items-center gap-2 overflow-x-auto whitespace-nowrap scrollbar-none pb-1">
                <button
                  onClick={() => setSelectedCategory('semua')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                    selectedCategory === 'semua'
                      ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30'
                      : 'bg-slate-700/70 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  Semua Arsip ({archivedSessions.length})
                </button>
                <button
                  onClick={() => setSelectedCategory('sidi')}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                    selectedCategory === 'sidi'
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                      : 'bg-slate-700/70 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  <GraduationCap className="w-3.5 h-3.5" />
                  <span>SIDI ({archivedSessions.filter((j) => j.kategori === 'sidi').length})</span>
                </button>
                <button
                  onClick={() => setSelectedCategory('pernikahan')}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                    selectedCategory === 'pernikahan'
                      ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                      : 'bg-slate-700/70 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  <Heart className="w-3.5 h-3.5" />
                  <span>Pra-Nikah ({archivedSessions.filter((j) => j.kategori === 'pernikahan').length})</span>
                </button>
              </div>

              {/* Status Select & Search */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full lg:w-auto">
                <div className="relative w-full sm:w-48">
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  >
                    <option value="semua">Semua Status</option>
                    <option value="Selesai">Selesai</option>
                    <option value="Terjadwal">Terjadwal</option>
                    <option value="Berlangsung">Berlangsung</option>
                    <option value="Ditunda">Ditunda</option>
                  </select>
                </div>

                <div className="relative w-full sm:w-64 md:w-80">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Cari program, materi, pengajar arsip..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 text-slate-100 text-xs rounded-xl pl-9 pr-3 py-2 focus:ring-2 focus:ring-amber-500 focus:outline-none placeholder-slate-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Archived Cards List */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-5 w-full">
            {filteredJadwal.map((item) => (
              <div
                key={item.id}
                className="bg-slate-800/80 border border-slate-700/80 hover:border-amber-500/40 rounded-2xl p-4 sm:p-5 shadow-xl transition-all flex flex-col justify-between space-y-4 w-full min-w-0"
              >
                <div className="space-y-3 min-w-0">
                  {/* Top Badges */}
                  <div className="flex flex-wrap items-center justify-between gap-2 min-w-0">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-extrabold uppercase tracking-wider ${
                        item.kategori === 'sidi'
                          ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                          : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      }`}
                    >
                      {item.kategori === 'sidi' ? <GraduationCap className="w-3.5 h-3.5" /> : <Heart className="w-3.5 h-3.5" />}
                      <span>{item.kategori === 'sidi' ? 'Katekisasi SIDI' : 'Pra-Nikah'}</span>
                    </span>

                    <span className="inline-flex items-center gap-1 bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2.5 py-1 rounded-lg text-[11px] font-bold">
                      <Archive className="w-3 h-3" />
                      <span>Diarsipkan: {item.tanggalArsip || item.tanggal}</span>
                    </span>
                  </div>

                  {/* Program Title */}
                  <div className="min-w-0">
                    <h3 className="text-base font-bold text-white leading-snug break-words">{item.judulProgram}</h3>
                    {item.jumlahPertemuan && (
                      <span className="text-xs text-amber-400 font-semibold block mt-0.5">
                        {item.jumlahPertemuan}
                      </span>
                    )}
                  </div>

                  {/* Topic / Materi */}
                  <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800 text-xs text-slate-300 space-y-1 min-w-0 overflow-hidden">
                    <span className="font-bold text-slate-400 block text-[11px] uppercase tracking-wider">
                      Materi Bahasan:
                    </span>
                    <p className="leading-relaxed break-words">{item.materiBahasan}</p>
                  </div>

                  {/* Optional Archive Reason */}
                  {item.alasanArsip && (
                    <div className="bg-amber-950/30 border border-amber-800/40 p-2.5 rounded-lg text-xs text-amber-300">
                      <span className="font-bold">Catatan Arsip: </span>
                      <span>{item.alasanArsip}</span>
                    </div>
                  )}

                  {/* Schedule Details Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-300 min-w-0">
                    <div className="flex items-start gap-2 bg-slate-900/40 p-2.5 rounded-lg min-w-0">
                      <UserCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <div className="min-w-0 flex-1">
                        <span className="text-[10px] text-slate-400 block font-semibold">Pengajar / Pembimbing:</span>
                        <span className="font-bold text-white break-words">{item.pengajar}</span>
                      </div>
                    </div>

                    <div className="flex items-start gap-2 bg-slate-900/40 p-2.5 rounded-lg min-w-0">
                      <Calendar className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                      <div className="min-w-0 flex-1">
                        <span className="text-[10px] text-slate-400 block font-semibold">Waktu Pelaksanaan:</span>
                        <span className="font-bold text-white block">{item.tanggal}</span>
                        <span className="block text-[11px] text-slate-400 break-words">{item.waktu}</span>
                      </div>
                    </div>

                    <div className="flex items-start gap-2 bg-slate-900/40 p-2.5 rounded-lg sm:col-span-2 min-w-0">
                      <MapPin className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                      <div className="min-w-0 flex-1">
                        <span className="text-[10px] text-slate-400 block font-semibold">Tempat / Ruangan:</span>
                        <span className="font-medium text-slate-200 break-words">{item.tempat}</span>
                      </div>
                    </div>

                    <div className="flex items-start gap-2 bg-slate-900/40 p-2.5 rounded-lg sm:col-span-2 min-w-0">
                      <Users className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <div className="min-w-0 flex-1">
                        <span className="text-[10px] text-slate-400 block font-semibold">Peserta Target / Pasangan:</span>
                        <span className="font-medium text-slate-200 break-words">{item.pesertaTarget}</span>
                      </div>
                    </div>
                  </div>

                  {/* Catatan / Keterangan Kelulusan Sakramen */}
                  {item.keterangan && (
                    <div className="text-[11px] text-emerald-300 bg-emerald-950/40 p-2.5 rounded-xl border border-emerald-800/60 break-words min-w-0 space-y-1.5">
                      <div className="flex items-center gap-1.5 font-bold text-emerald-300">
                        <Award className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>Peserta Lulus & Didaftarkan ke Sakramen:</span>
                      </div>
                      <p className="text-emerald-100/90 leading-relaxed break-words font-medium pl-5 whitespace-pre-line text-[11px]">
                        {item.keterangan}
                      </p>
                    </div>
                  )}
                </div>

                {/* Actions Footer in Archive Card */}
                {isManagementRole && (
                  <div className="pt-3 border-t border-slate-700/80 flex items-center justify-end gap-2 flex-wrap">
                    <button
                      onClick={() => handleOpenEditModal(item)}
                      className="flex items-center gap-1.5 bg-slate-700 hover:bg-slate-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-all cursor-pointer min-h-[36px]"
                      title="Edit Data Sesi Katekisasi"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>

                    {/* Tombol Aktifkan Sesi dari Arsip diantara tombol Edit dan Hapus */}
                    <button
                      onClick={() => handleOpenArchiveModal(item, 'unarchive')}
                      className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-all cursor-pointer shadow-sm shadow-emerald-600/20 min-h-[36px]"
                      title="Aktifkan Kembali Sesi dari Arsip ke Jadwal Aktif"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Aktifkan Sesi</span>
                    </button>

                    <button
                      onClick={() => handleDelete(item)}
                      className="flex items-center gap-1.5 bg-rose-600/80 hover:bg-rose-600 active:scale-95 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-all cursor-pointer min-w-[36px] min-h-[36px] justify-center"
                      title="Hapus Permanen dari Database"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Hapus</span>
                    </button>
                  </div>
                )}
              </div>
            ))}

            {filteredJadwal.length === 0 && (
              <div className="col-span-full bg-slate-800/50 border border-slate-700/60 rounded-2xl p-8 text-center space-y-3">
                <FolderArchive className="w-10 h-10 text-slate-500 mx-auto" />
                <h3 className="text-base font-bold text-slate-300">Belum ada Sesi Pengajaran yang Diarsipkan</h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  Sesi katekisasi yang sudah selesai atau ingin disimpan sebagai riwayat dapat dipindahkan ke arsip menggunakan tombol "Arsipkan Sesi" pada jadwal aktif.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Candidate Status Tracker Tab */}
      {activeTab === 'peserta' && (
        <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-4 sm:p-6 shadow-xl space-y-5 w-full min-w-0">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 w-full">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <Award className="w-5 h-5 text-emerald-400 shrink-0" />
                <span>Pelacakan Status Kelulusan SIDI & Pernikahan Warga Jemaat</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Gunakan daftar ini untuk meninjau status Sidi dan Nikah warga jemaat yang sedang mengikuti atau lulus katekisasi.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full lg:w-auto">
              <select
                value={selectedCandidateStatus}
                onChange={(e) => setSelectedCandidateStatus(e.target.value)}
                className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-2 focus:ring-2 focus:ring-emerald-500"
              >
                <option value="semua">Semua Warga Jemaat</option>
                <option value="sidi_belum">Calon Sidi (Belum Sidi)</option>
                <option value="sidi_sudah">Sudah Lulus Sidi</option>
                <option value="nikah_belum">Belum Menikah (Calon Pra-Nikah)</option>
              </select>

              <div className="relative w-full sm:w-60">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cari nama warga..."
                  value={candidateSearch}
                  onChange={(e) => setCandidateSearch(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 text-slate-100 text-xs rounded-xl pl-9 pr-3 py-2 focus:ring-2 focus:ring-emerald-500 placeholder-slate-500"
                />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-700 w-full min-w-0">
            <table className="w-full text-left text-xs text-slate-300 min-w-[700px]">
              <thead className="bg-slate-900 text-slate-400 font-bold uppercase tracking-wider text-[11px] whitespace-nowrap">
                <tr>
                  <th className="p-3">Nama Lengkap & NIK</th>
                  <th className="p-3">Rayon</th>
                  <th className="p-3">Status Baptis</th>
                  <th className="p-3">Status SIDI</th>
                  <th className="p-3">Status Nikah</th>
                  {isManagementRole && <th className="p-3 text-center">Aksi Pengurus</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/80">
                {filteredWarga.map((warga) => {
                  const isBaptis = warga.statusBaptis === true || (warga.statusBaptis as any) === 'Sudah Baptis';
                  const isSidi = warga.statusSidi === true || (warga.statusSidi as any) === 'Sudah Sidi';
                  const isMenikah = warga.statusNikah === 'Menikah';

                  return (
                    <tr key={warga.id} className="hover:bg-slate-700/30 transition-colors">
                      <td className="p-3">
                        <div className="font-bold text-white">{warga.namaLengkap}</div>
                        <div className="text-[11px] text-slate-400">NIK: {warga.nik || '-'}</div>
                      </td>
                      <td className="p-3 font-medium text-slate-300 whitespace-nowrap">{warga.rayon}</td>
                      <td className="p-3 whitespace-nowrap">
                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold inline-flex items-center gap-1 ${
                          isBaptis ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-slate-700/60 text-slate-400 border border-slate-600/50'
                        }`}>
                          {isBaptis ? '✓ Sudah Baptis' : '✗ Belum Baptis'}
                        </span>
                      </td>
                      <td className="p-3 whitespace-nowrap">
                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold inline-flex items-center gap-1 ${
                          isSidi ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        }`}>
                          {isSidi ? '✓ Sudah Sidi' : '⏳ Belum Sidi'}
                        </span>
                      </td>
                      <td className="p-3 whitespace-nowrap">
                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold inline-flex items-center gap-1 ${
                          isMenikah ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : 'bg-slate-700/60 text-slate-400 border border-slate-600/50'
                        }`}>
                          {isMenikah ? '❤️ Menikah' : warga.statusNikah || 'Belum Menikah'}
                        </span>
                      </td>
                      {isManagementRole && (
                        <td className="p-3 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1.5">
                            {!isBaptis && (
                              <button
                                onClick={() => setConfirmActionModal({ type: 'baptis', warga })}
                                className="bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold px-2.5 py-1.5 rounded-lg transition-all shadow-sm cursor-pointer flex items-center gap-1 touch-manipulation active:scale-95"
                                title="Tandai Sudah Baptis di Data Keluarga Jemaat"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>+ Baptis</span>
                              </button>
                            )}

                            {!isSidi ? (
                              <button
                                onClick={() => setConfirmActionModal({ type: 'sidi', warga })}
                                className="bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-bold px-2.5 py-1.5 rounded-lg transition-all shadow-sm cursor-pointer flex items-center gap-1 touch-manipulation active:scale-95"
                                title="Tandai Lulus Sidi (Otomatis Sync ke Data Keluarga Jemaat)"
                              >
                                <Award className="w-3.5 h-3.5" />
                                <span>+ Lulus Sidi</span>
                              </button>
                            ) : (
                              <span className="text-[10px] font-bold text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-md">
                                Lulus Sidi
                              </span>
                            )}

                            {!isMenikah ? (
                              <button
                                onClick={() => {
                                  setWeddingDateInput(warga.tanggalPernikahan || new Date().toISOString().split('T')[0]);
                                  setConfirmActionModal({ type: 'nikah', warga });
                                }}
                                className="bg-rose-600 hover:bg-rose-500 text-white text-[10px] font-bold px-2.5 py-1.5 rounded-lg transition-all shadow-sm cursor-pointer flex items-center gap-1 touch-manipulation active:scale-95"
                                title="Tandai Menikah Kudus (Otomatis Sync ke Data Keluarga Jemaat)"
                              >
                                <Heart className="w-3.5 h-3.5" />
                                <span>+ Menikah</span>
                              </button>
                            ) : (
                              <span className="text-[10px] font-bold text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded-md">
                                Menikah
                              </span>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
                {filteredWarga.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-slate-400 italic">
                      Tidak ditemukan warga jemaat dengan kriteria ini.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Add / Edit Schedule */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4 overflow-hidden animate-in fade-in duration-150">
          <div className="bg-slate-850 bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[92dvh] sm:max-h-[88vh] flex flex-col overflow-hidden shadow-2xl my-auto">
            <div className="bg-slate-900 px-5 py-4 border-b border-slate-700 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold text-white">
                  {editingItem ? 'Edit Jadwal Katekisasi' : 'Tambah Jadwal Katekisasi Baru'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden text-xs text-slate-200">
              <div className="p-4 sm:p-6 space-y-4 flex-1 overflow-y-auto overscroll-contain">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Kategori Program</label>
                  <select
                    value={formData.kategori || 'sidi'}
                    onChange={(e) => setFormData({ ...formData, kategori: e.target.value as 'sidi' | 'pernikahan' })}
                    className="w-full bg-slate-900 border border-slate-700 text-slate-100 rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="sidi">Katekisasi Peneguhan SIDI</option>
                    <option value="pernikahan">Katekisasi Pra-Nikah / Pernikahan</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Status Sesi</label>
                  <select
                    value={formData.status || 'Terjadwal'}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full bg-slate-900 border border-slate-700 text-slate-100 rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="Terjadwal">Terjadwal</option>
                    <option value="Berlangsung">Berlangsung</option>
                    <option value="Selesai">Selesai</option>
                    <option value="Ditunda">Ditunda</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Status Arsip</label>
                  <select
                    value={formData.statusArsip || 'Aktif'}
                    onChange={(e) => setFormData({ ...formData, statusArsip: e.target.value as any })}
                    className="w-full bg-slate-900 border border-slate-700 text-slate-100 rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="Aktif">Aktif (Tampil di Jadwal Utama)</option>
                    <option value="Diarsipkan">Diarsipkan (Masuk Folder Arsip)</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-slate-300 font-semibold mb-1">Judul Program / Nama Sesi *</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Katekisasi SIDI Angkatan 2026 - Sesi 1: Pengenalan Alkitab"
                    value={formData.judulProgram || ''}
                    onChange={(e) => setFormData({ ...formData, judulProgram: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 text-slate-100 rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-slate-300 font-semibold mb-1">Materi Bahasan / Pokok Pengajaran</label>
                  <textarea
                    rows={2}
                    placeholder="Penjelasan ringkas pokok bahasan Alkitab/GKE..."
                    value={formData.materiBahasan || ''}
                    onChange={(e) => setFormData({ ...formData, materiBahasan: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 text-slate-100 rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Pengajar / Pembimbing *</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Pdt. Drs. Yansen K. M.Th"
                    value={formData.pengajar || ''}
                    onChange={(e) => setFormData({ ...formData, pengajar: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 text-slate-100 rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Urutan Pertemuan</label>
                  <input
                    type="text"
                    placeholder="Contoh: Pertemuan 1 dari 12"
                    value={formData.jumlahPertemuan || ''}
                    onChange={(e) => setFormData({ ...formData, jumlahPertemuan: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 text-slate-100 rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Tanggal Pelaksanaan *</label>
                  <input
                    type="date"
                    required
                    value={formData.tanggal || ''}
                    onChange={(e) => setFormData({ ...formData, tanggal: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 text-slate-100 rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Waktu / Jam</label>
                  <input
                    type="text"
                    placeholder="Contoh: 15:00 - 17:00 WIB"
                    value={formData.waktu || ''}
                    onChange={(e) => setFormData({ ...formData, waktu: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 text-slate-100 rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Tempat / Ruangan</label>
                  <input
                    type="text"
                    placeholder="Contoh: Gedung Serbaguna / Pastori Utama"
                    value={formData.tempat || ''}
                    onChange={(e) => setFormData({ ...formData, tempat: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 text-slate-100 rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Peserta Target / Pasangan</label>
                  <input
                    type="text"
                    placeholder="Contoh: Calon Mempelai / 28 Peserta Muda-Mudi"
                    value={formData.pesertaTarget || ''}
                    onChange={(e) => setFormData({ ...formData, pesertaTarget: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 text-slate-100 rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-slate-300 font-semibold mb-1">Persyaratan & Berkas</label>
                  <input
                    type="text"
                    placeholder="Contoh: Membawakan Alkitab TB LAI & Akta Baptis"
                    value={formData.persyaratan || ''}
                    onChange={(e) => setFormData({ ...formData, persyaratan: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 text-slate-100 rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="sm:col-span-2 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-slate-300 font-semibold">
                      Catatan / Peserta Lulus & Didaftarkan ke Sakramen
                    </label>
                  </div>

                  {/* Quick Select from Pelayanan Sakramen */}
                  {pelayananSakramenList && pelayananSakramenList.length > 0 && (
                    <div className="p-2.5 bg-slate-900/90 border border-slate-700/80 rounded-xl space-y-2">
                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <span className="font-semibold text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          Tautkan Data Sakramen Terdaftar:
                        </span>
                        <span className="text-[10px] text-slate-500">Klik untuk menyisipkan ke catatan</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1">
                        {pelayananSakramenList
                          .filter((s) => formData.kategori === 'pernikahan' ? s.jenisPelayanan === 'nikah' : s.jenisPelayanan === 'sidi' || s.jenisPelayanan === 'nikah')
                          .map((sakr) => {
                            const label = sakr.namaPasangan
                              ? `${sakr.namaUtama} & ${sakr.namaPasangan} (${sakr.noSuratResmi || 'No. Surat -'})`
                              : `${sakr.namaUtama} (${sakr.noSuratResmi || 'No. Surat -'})`;
                            const insertText = sakr.namaPasangan
                              ? `Lulus & Didaftarkan ke Sakramen (${sakr.namaUtama} & ${sakr.namaPasangan} - ${sakr.noSuratResmi || '-'})`
                              : `Lulus & Didaftarkan ke Sakramen (${sakr.namaUtama} - ${sakr.noSuratResmi || '-'})`;
                            return (
                              <button
                                key={sakr.id}
                                type="button"
                                onClick={() => {
                                  const current = (formData.keterangan || '').trim();
                                  if (!current) {
                                    setFormData({ ...formData, keterangan: insertText });
                                  } else if (!current.includes(sakr.noSuratResmi || sakr.namaUtama)) {
                                    setFormData({ ...formData, keterangan: `${current} • ${insertText}` });
                                  }
                                }}
                                className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-800 hover:bg-emerald-950/60 hover:border-emerald-500/50 border border-slate-700 text-[10px] text-slate-300 hover:text-emerald-300 transition cursor-pointer"
                                title={`Tambahkan ${label}`}
                              >
                                <Plus className="w-3 h-3 text-emerald-400 shrink-0" />
                                <span>{label}</span>
                              </button>
                            );
                          })}
                      </div>
                    </div>
                  )}

                  <textarea
                    rows={4}
                    placeholder="Contoh: Lulus & Didaftarkan ke Sakramen (ARDI FALLO & DELPI LIUKAE - 012/MPH-MJ.GKE/GC/KTN/IV/2026)..."
                    value={formData.keterangan || ''}
                    onChange={(e) => setFormData({ ...formData, keterangan: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 text-slate-100 rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-emerald-500 leading-relaxed font-normal"
                  />
                  <p className="text-[11px] text-slate-400">
                    Format: <em>Lulus & Didaftarkan ke Sakramen (Nama Lengkap Peserta / Pasangan - Nomor Surat Sakramen Resmi)</em> dipisahkan tanda bullet (•).
                  </p>
                </div>
              </div>
            </div>

            <div className="p-3.5 sm:p-4 bg-slate-900 border-t border-slate-700 flex items-center justify-end gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2.5 rounded-xl text-slate-300 hover:bg-slate-800 transition-colors font-medium cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-lg shadow-emerald-600/30 transition-all cursor-pointer"
              >
                {editingItem ? 'Simpan Perubahan' : 'Tambah Jadwal'}
              </button>
            </div>
          </form>
        </div>
      </div>
    )}

      {/* Modal Confirm Delete */}
      <DeleteConfirmModal
        isOpen={!!deleteTarget}
        title="Konfirmasi Hapus Jadwal Katekisasi"
        itemName={
          deleteTarget
            ? `${deleteTarget.judulProgram} (${deleteTarget.kategori === 'sidi' ? 'SIDI' : 'Pernikahan'}) - ${deleteTarget.tanggal}`
            : ''
        }
        onConfirm={async () => {
          if (deleteTarget) {
            await deleteJadwalKatekisasi(deleteTarget.id);
          }
        }}
        onClose={() => setDeleteTarget(null)}
      />

      {/* Touch-friendly Action Confirmation Modal (+ Baptis, + Sidi, + Menikah) */}
      {confirmActionModal && confirmActionModal.warga && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-700/80 pb-3">
              <div className="flex items-center gap-2">
                {confirmActionModal.type === 'nikah' && (
                  <div className="p-2 bg-rose-500/20 text-rose-400 rounded-xl">
                    <Heart className="w-5 h-5" />
                  </div>
                )}
                {confirmActionModal.type === 'sidi' && (
                  <div className="p-2 bg-blue-500/20 text-blue-400 rounded-xl">
                    <Award className="w-5 h-5" />
                  </div>
                )}
                {confirmActionModal.type === 'baptis' && (
                  <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                )}
                <h3 className="font-extrabold text-white text-base">
                  Konfirmasi Status {confirmActionModal.type === 'nikah' ? 'Pernikahan' : confirmActionModal.type === 'sidi' ? 'Kelulusan SIDI' : 'Baptisan'}
                </h3>
              </div>
              <button
                onClick={() => setConfirmActionModal(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-sm text-slate-300 space-y-2">
              <p>
                Apakah Anda yakin ingin menetapkan status{' '}
                <strong className="text-white">
                  {confirmActionModal.type === 'nikah' ? 'Sudah Menikah Kudus' : confirmActionModal.type === 'sidi' ? 'Lulus Sidi' : 'Sudah Baptis'}
                </strong>{' '}
                untuk:
              </p>
              <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-700/80 space-y-1">
                <p className="font-bold text-white text-base">{confirmActionModal.warga.namaLengkap}</p>
                <p className="text-xs text-slate-400">
                  No. KJJ / Rayon: {confirmActionModal.warga.noKjj || '-'} ({confirmActionModal.warga.rayon})
                </p>
              </div>

              {confirmActionModal.type === 'nikah' && (
                <div className="p-3 bg-rose-950/50 border border-rose-800/70 rounded-xl space-y-1.5">
                  <label className="block text-xs font-bold text-rose-200 flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>Tanggal Pernikahan Kudus</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={weddingDateInput || ''}
                    onChange={(e) => setWeddingDateInput(e.target.value)}
                    className="w-full p-2.5 bg-slate-900 border border-rose-500/50 rounded-xl text-xs font-bold text-white outline-none focus:border-rose-400 focus:ring-1 focus:ring-rose-400 cursor-pointer"
                  />
                  <p className="text-[11px] text-rose-300/80">
                    Tanggal pemberkatan / peneguhan pernikahan kudus untuk data jemaat ini.
                  </p>
                </div>
              )}

              <p className="text-xs text-emerald-400 flex items-center gap-1 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span>Data ini akan otomatis terhubung & memperbarui Data Keluarga Jemaat secara real-time.</span>
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmActionModal(null)}
                disabled={isSavingStatus}
                className="flex-1 py-2.5 px-4 bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold text-xs rounded-xl transition-all cursor-pointer min-h-[44px]"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isSavingStatus}
                onClick={async () => {
                  setIsSavingStatus(true);
                  try {
                    if (confirmActionModal.type === 'nikah') {
                      await updateWargaJemaat(confirmActionModal.warga.id, {
                        statusNikah: 'Menikah',
                        tanggalPernikahan: weddingDateInput || new Date().toISOString().split('T')[0],
                      });
                    } else if (confirmActionModal.type === 'sidi') {
                      await updateWargaJemaat(confirmActionModal.warga.id, { statusSidi: true, statusBaptis: true });
                    } else if (confirmActionModal.type === 'baptis') {
                      await updateWargaJemaat(confirmActionModal.warga.id, { statusBaptis: true });
                    }
                  } catch (err) {
                    console.error('Error updating status:', err);
                  } finally {
                    setIsSavingStatus(false);
                    setConfirmActionModal(null);
                  }
                }}
                className={`flex-1 py-2.5 px-4 text-white font-extrabold text-xs rounded-xl transition-all cursor-pointer min-h-[44px] flex items-center justify-center gap-2 shadow-lg ${
                  confirmActionModal.type === 'nikah'
                    ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/30'
                    : confirmActionModal.type === 'sidi'
                    ? 'bg-blue-600 hover:bg-blue-500 shadow-blue-600/30'
                    : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/30'
                }`}
              >
                {isSavingStatus ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Menyimpan...</span>
                  </>
                ) : (
                  <span>Ya, Tetapkan Status</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Adding New Katekisasi Session */}
      {isConfirmAddModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-700/80 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-white text-base">Konfirmasi Tambah Sesi Katekisasi</h3>
                  <p className="text-xs text-slate-400">Periksa kembali data jadwal sebelum ditambahkan.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsConfirmAddModalOpen(false)}
                disabled={isSavingAddSession}
                className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3.5 bg-slate-900/90 rounded-xl border border-slate-700/80 space-y-2 text-xs text-slate-300">
              <div className="flex justify-between items-start gap-2">
                <span className="text-slate-400 shrink-0">Program:</span>
                <span className="font-bold text-white text-right">{formData.judulProgram}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Kategori:</span>
                <span className={`font-extrabold px-2 py-0.5 rounded text-[11px] ${
                  formData.kategori === 'sidi' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                }`}>
                  {formData.kategori === 'sidi' ? 'Katekisasi SIDI' : 'Katekisasi Pra-Nikah'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Pengajar:</span>
                <span className="font-semibold text-emerald-300">{formData.pengajar}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Urutan Pertemuan:</span>
                <span className="font-semibold text-slate-200">{formData.jumlahPertemuan || '-'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Tanggal &amp; Jam:</span>
                <span className="font-bold text-amber-300">{formData.tanggal} ({formData.waktu})</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Tempat:</span>
                <span className="font-medium text-slate-200">{formData.tempat}</span>
              </div>
            </div>

            {/* Progress Bar during saving */}
            {isSavingAddSession && (
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between text-xs font-bold text-emerald-400">
                  <span>Menambahkan Sesi Katekisasi...</span>
                  <span>{addSessionProgress}%</span>
                </div>
                <div className="w-full bg-slate-700 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-emerald-500 to-teal-300 h-full transition-all duration-300"
                    style={{ width: `${addSessionProgress}%` }}
                  />
                </div>
              </div>
            )}

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsConfirmAddModalOpen(false)}
                disabled={isSavingAddSession}
                className="flex-1 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold text-xs rounded-xl transition-all cursor-pointer min-h-[44px]"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmAddSession}
                disabled={isSavingAddSession}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl transition-all shadow-lg shadow-emerald-600/30 cursor-pointer min-h-[44px] flex items-center justify-center gap-2"
              >
                {isSavingAddSession ? (
                  <span>Menyimpan...</span>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    <span>Ya, Tambahkan Sesi</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Archiving / Unarchiving Katekisasi Session */}
      {archiveModalTarget && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-700/80 pb-3">
              <div className="flex items-center gap-2.5">
                <div
                  className={`p-2.5 rounded-xl border ${
                    archiveModalTarget.action === 'archive'
                      ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30'
                      : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                  }`}
                >
                  {archiveModalTarget.action === 'archive' ? (
                    <Archive className="w-5 h-5" />
                  ) : (
                    <RotateCcw className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <h3 className="font-extrabold text-white text-base">
                    {archiveModalTarget.action === 'archive'
                      ? 'Arsipkan Sesi Katekisasi'
                      : 'Aktifkan Kembali Sesi Katekisasi'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {archiveModalTarget.action === 'archive'
                      ? 'Sesi ini akan dipindahkan ke folder Arsip Sesi Pengajaran.'
                      : 'Sesi ini akan dikembalikan ke daftar Jadwal & Sesi Aktif.'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setArchiveModalTarget(null)}
                disabled={isSavingArchive}
                className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3.5 bg-slate-900/90 rounded-xl border border-slate-700/80 space-y-2 text-xs text-slate-300">
              <div className="flex justify-between items-start gap-2">
                <span className="text-slate-400 shrink-0">Program:</span>
                <span className="font-bold text-white text-right">{archiveModalTarget.item.judulProgram}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Kategori:</span>
                <span
                  className={`font-extrabold px-2 py-0.5 rounded text-[11px] ${
                    archiveModalTarget.item.kategori === 'sidi'
                      ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                      : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                  }`}
                >
                  {archiveModalTarget.item.kategori === 'sidi' ? 'Katekisasi SIDI' : 'Katekisasi Pra-Nikah'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Pengajar:</span>
                <span className="font-semibold text-emerald-300">{archiveModalTarget.item.pengajar}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Urutan / Tanggal:</span>
                <span className="font-bold text-amber-300">
                  {archiveModalTarget.item.jumlahPertemuan || '-'} ({archiveModalTarget.item.tanggal})
                </span>
              </div>
            </div>

            {archiveModalTarget.action === 'archive' && (
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-300">
                  Catatan / Alasan Pengarsipan (Opsional):
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Sesi angkatan telah selesai / ditutup"
                  value={archiveReason || ''}
                  onChange={(e) => setArchiveReason(e.target.value)}
                  className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-200 placeholder-slate-500 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            )}

            {/* Progress Bar during saving */}
            {isSavingArchive && (
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between text-xs font-bold text-indigo-400">
                  <span>
                    {archiveModalTarget.action === 'archive'
                      ? 'Mengarsipkan Sesi...'
                      : 'Mengaktifkan Kembali Sesi...'}
                  </span>
                  <span>{archiveProgress}%</span>
                </div>
                <div className="w-full bg-slate-700 h-2.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      archiveModalTarget.action === 'archive'
                        ? 'bg-gradient-to-r from-indigo-500 to-cyan-300'
                        : 'bg-gradient-to-r from-emerald-500 to-teal-300'
                    }`}
                    style={{ width: `${archiveProgress}%` }}
                  />
                </div>
              </div>
            )}

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setArchiveModalTarget(null)}
                disabled={isSavingArchive}
                className="flex-1 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold text-xs rounded-xl transition-all cursor-pointer min-h-[44px]"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmArchive}
                disabled={isSavingArchive}
                className={`flex-1 py-2.5 text-white font-extrabold text-xs rounded-xl transition-all shadow-lg cursor-pointer min-h-[44px] flex items-center justify-center gap-2 ${
                  archiveModalTarget.action === 'archive'
                    ? 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/30'
                    : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/30'
                }`}
              >
                {isSavingArchive ? (
                  <span>Menyimpan...</span>
                ) : (
                  <>
                    {archiveModalTarget.action === 'archive' ? (
                      <>
                        <Archive className="w-4 h-4" />
                        <span>Ya, Arsipkan Sesi</span>
                      </>
                    ) : (
                      <>
                        <RotateCcw className="w-4 h-4" />
                        <span>Ya, Aktifkan Sesi</span>
                      </>
                    )}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
