import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { JabatanOrganisasi, KategoriJabatan } from '../../types';
import {
  Briefcase,
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  Layers,
  Users,
  ShieldAlert,
  Save,
  X,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';

export const JabatanModule: React.FC = () => {
  const {
    jabatanList,
    addJabatan,
    updateJabatan,
    deleteJabatan,
    mphList,
    pengurusKategorialList,
    currentUser,
  } = useApp();

  const canEdit =
    currentUser.role === 'admin' ||
    currentUser.role === 'sekretaris' ||
    currentUser.role === 'bendahara';

  // Filter & Search states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedKategori, setSelectedKategori] = useState<string>('Semua');
  const [selectedStatus, setSelectedStatus] = useState<'semua' | 'aktif' | 'nonaktif'>('semua');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Form states
  const [formData, setFormData] = useState<Omit<JabatanOrganisasi, 'id'>>({
    nama: '',
    kategori: 'Seksi Kategorial',
    deskripsi: '',
    urutan: 1,
    aktif: true,
  });

  // Processing state for progress bar & feedback
  const [isProcessing, setIsProcessing] = useState(false);
  const [processProgress, setProcessProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Kategori options
  const kategoriOptions: KategoriJabatan[] = [
    'MPH / Majelis Jemaat',
    'Seksi Kategorial',
    'Badan & Majelis Pertimbangan',
    'Panitia & Pokja',
  ];

  // Filtered list
  const filteredList = useMemo(() => {
    return jabatanList
      .filter((item) => {
        const matchesSearch =
          item.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (item.deskripsi && item.deskripsi.toLowerCase().includes(searchTerm.toLowerCase()));
        const matchesKategori =
          selectedKategori === 'Semua' || item.kategori === selectedKategori;
        const matchesStatus =
          selectedStatus === 'semua' ||
          (selectedStatus === 'aktif' && item.aktif) ||
          (selectedStatus === 'nonaktif' && !item.aktif);
        return matchesSearch && matchesKategori && matchesStatus;
      })
      .sort((a, b) => (a.urutan || 999) - (b.urutan || 999));
  }, [jabatanList, searchTerm, selectedKategori, selectedStatus]);

  // Statistics
  const stats = useMemo(() => {
    const total = jabatanList.length;
    const mphCount = jabatanList.filter((j) => j.kategori === 'MPH / Majelis Jemaat').length;
    const kategorialCount = jabatanList.filter((j) => j.kategori === 'Seksi Kategorial').length;
    const pertimbanganCount = jabatanList.filter((j) => j.kategori === 'Badan & Majelis Pertimbangan').length;
    const panitiaCount = jabatanList.filter((j) => j.kategori === 'Panitia & Pokja').length;
    return { total, mphCount, kategorialCount, pertimbanganCount, panitiaCount };
  }, [jabatanList]);

  // Check how many people currently use this position name
  const getUsageCount = (namaJabatan: string) => {
    const mphUsed = mphList.filter(
      (m) => m.jabatan.trim().toLowerCase() === namaJabatan.trim().toLowerCase()
    ).length;
    const katUsed = pengurusKategorialList.filter(
      (k) => k.jabatan.trim().toLowerCase() === namaJabatan.trim().toLowerCase()
    ).length;
    return mphUsed + katUsed;
  };

  // Open modal for add
  const handleOpenAddModal = () => {
    setIsEditing(false);
    setEditingId(null);
    setFormData({
      nama: '',
      kategori: 'Seksi Kategorial',
      deskripsi: '',
      urutan: jabatanList.length > 0 ? Math.max(...jabatanList.map((j) => j.urutan || 0)) + 1 : 1,
      aktif: true,
    });
    setIsModalOpen(true);
  };

  // Open modal for edit
  const handleOpenEditModal = (item: JabatanOrganisasi) => {
    setIsEditing(true);
    setEditingId(item.id);
    setFormData({
      nama: item.nama,
      kategori: item.kategori,
      deskripsi: item.deskripsi || '',
      urutan: item.urutan || 1,
      aktif: item.aktif !== undefined ? item.aktif : true,
    });
    setIsModalOpen(true);
  };

  // Handle Save with progress bar
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nama.trim()) {
      setStatusMessage({ type: 'error', text: 'Nama jabatan tidak boleh kosong!' });
      return;
    }

    setIsProcessing(true);
    setProcessProgress(25);

    try {
      const timer1 = setTimeout(() => setProcessProgress(65), 150);
      const timer2 = setTimeout(() => setProcessProgress(90), 300);

      if (isEditing && editingId) {
        await updateJabatan(editingId, {
          nama: formData.nama.trim(),
          kategori: formData.kategori,
          deskripsi: formData.deskripsi?.trim() || '',
          urutan: Number(formData.urutan),
          aktif: formData.aktif,
        });
        setStatusMessage({ type: 'success', text: `Jabatan "${formData.nama}" berhasil diperbarui!` });
      } else {
        await addJabatan({
          nama: formData.nama.trim(),
          kategori: formData.kategori,
          deskripsi: formData.deskripsi?.trim() || '',
          urutan: Number(formData.urutan),
          aktif: formData.aktif,
        });
        setStatusMessage({ type: 'success', text: `Jabatan "${formData.nama}" berhasil ditambahkan!` });
      }

      clearTimeout(timer1);
      clearTimeout(timer2);
      setProcessProgress(100);

      setTimeout(() => {
        setIsProcessing(false);
        setProcessProgress(0);
        setIsModalOpen(false);
        setTimeout(() => setStatusMessage(null), 4000);
      }, 300);
    } catch (err) {
      setIsProcessing(false);
      setProcessProgress(0);
      setStatusMessage({ type: 'error', text: 'Gagal menyimpan data jabatan.' });
    }
  };

  // Handle Delete with progress
  const handleDelete = async (id: string) => {
    setIsProcessing(true);
    setProcessProgress(30);

    try {
      setTimeout(() => setProcessProgress(75), 150);
      await deleteJabatan(id);
      setProcessProgress(100);

      setTimeout(() => {
        setIsProcessing(false);
        setProcessProgress(0);
        setDeleteConfirmId(null);
        setStatusMessage({ type: 'success', text: 'Jabatan berhasil dihapus dari daftar master.' });
        setTimeout(() => setStatusMessage(null), 4000);
      }, 300);
    } catch (err) {
      setIsProcessing(false);
      setProcessProgress(0);
      setDeleteConfirmId(null);
      setStatusMessage({ type: 'error', text: 'Gagal menghapus jabatan.' });
    }
  };

  // Handle Toggle Active
  const handleToggleAktif = async (item: JabatanOrganisasi) => {
    try {
      const newStatus = !(item.aktif !== undefined ? item.aktif : true);
      await updateJabatan(item.id, { aktif: newStatus });
      setStatusMessage({
        type: 'success',
        text: `Status jabatan "${item.nama}" diubah menjadi ${newStatus ? 'Aktif' : 'Nonaktif'}.`,
      });
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (err) {
      setStatusMessage({ type: 'error', text: 'Gagal mengubah status jabatan.' });
    }
  };

  return (
    <div id="jabatan-module" className="space-y-6">
      {/* Top Banner / Header Card */}
      <div
        id="jabatan-header-card"
        className="bg-slate-900/80 p-5 md:p-6 rounded-2xl border border-slate-800/80 shadow-lg backdrop-blur-md relative overflow-hidden flex flex-wrap items-center justify-between gap-4"
      >
        <div className="flex items-start space-x-3.5">
          <div className="p-2.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-xl shrink-0 mt-0.5">
            <Briefcase className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-lg md:text-xl font-bold text-slate-100 tracking-tight">
                Jabatan Struktural dan Kategorial
              </h2>
              <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[11px] font-semibold px-2.5 py-0.5 rounded-full">
                Master Data
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 max-w-3xl leading-relaxed">
              Kelola data master opsi dropdown Jabatan Struktural MPH &amp; SK Kategorial secara dinamis.
              Tambah, ubah, atau hapus jabatan tanpa perlu nomor urut pada nama jabatan.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2.5 shrink-0">
          {canEdit && (
            <button
              id="btn-tambah-jabatan"
              onClick={handleOpenAddModal}
              className="inline-flex items-center space-x-2 px-4 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-md shadow-indigo-600/30 transition-all cursor-pointer hover:-translate-y-0.5 active:translate-y-0"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Jabatan</span>
            </button>
          )}
        </div>

        {/* Top Progress Bar indicator */}
        {isProcessing && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-800 overflow-hidden">
            <div
              className="h-full bg-indigo-500 transition-all duration-300 ease-out"
              style={{ width: `${processProgress}%` }}
            />
          </div>
        )}
      </div>

      {/* Alert Status Notification */}
      {statusMessage && (
        <div
          id="jabatan-status-alert"
          className={`p-4 rounded-2xl border flex items-center justify-between transition-all backdrop-blur-md ${
            statusMessage.type === 'success'
              ? 'bg-emerald-950/40 border-emerald-800 text-emerald-200'
              : 'bg-rose-950/40 border-rose-800 text-rose-200'
          }`}
        >
          <div className="flex items-center space-x-3">
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            )}
            <span className="text-xs md:text-sm font-medium">{statusMessage.text}</span>
          </div>
          <button
            onClick={() => setStatusMessage(null)}
            className="text-slate-400 hover:text-slate-200 p-1 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Quick Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div
          onClick={() => setSelectedKategori('Semua')}
          className={`cursor-pointer p-4 rounded-2xl border transition-all backdrop-blur-md shadow-md ${
            selectedKategori === 'Semua'
              ? 'bg-indigo-950/60 border-indigo-500/70 ring-1 ring-indigo-500/50'
              : 'bg-slate-900/80 border-slate-800/80 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300">Semua Jabatan</span>
            <Layers className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="mt-2.5 flex items-baseline space-x-2">
            <span className="text-2xl font-black text-slate-100">{stats.total}</span>
            <span className="text-[11px] text-slate-400">posisi master</span>
          </div>
        </div>

        <div
          onClick={() => setSelectedKategori('Seksi Kategorial')}
          className={`cursor-pointer p-4 rounded-2xl border transition-all backdrop-blur-md shadow-md ${
            selectedKategori === 'Seksi Kategorial'
              ? 'bg-indigo-950/60 border-indigo-500/70 ring-1 ring-indigo-500/50'
              : 'bg-slate-900/80 border-slate-800/80 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300">Seksi Kategorial</span>
            <Users className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="mt-2.5 flex items-baseline space-x-2">
            <span className="text-2xl font-black text-slate-100">{stats.kategorialCount}</span>
            <span className="text-[11px] text-slate-400">posisi</span>
          </div>
        </div>

        <div
          onClick={() => setSelectedKategori('MPH / Majelis Jemaat')}
          className={`cursor-pointer p-4 rounded-2xl border transition-all backdrop-blur-md shadow-md ${
            selectedKategori === 'MPH / Majelis Jemaat'
              ? 'bg-amber-950/50 border-amber-500/70 ring-1 ring-amber-500/50'
              : 'bg-slate-900/80 border-slate-800/80 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300">MPH / Majelis</span>
            <Briefcase className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2.5 flex items-baseline space-x-2">
            <span className="text-2xl font-black text-slate-100">{stats.mphCount}</span>
            <span className="text-[11px] text-slate-400">posisi</span>
          </div>
        </div>

        <div
          onClick={() => setSelectedKategori('Badan & Majelis Pertimbangan')}
          className={`cursor-pointer p-4 rounded-2xl border transition-all backdrop-blur-md shadow-md ${
            selectedKategori === 'Badan & Majelis Pertimbangan'
              ? 'bg-purple-950/50 border-purple-500/70 ring-1 ring-purple-500/50'
              : 'bg-slate-900/80 border-slate-800/80 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300">Badan MP &amp; BPP</span>
            <ShieldAlert className="w-4 h-4 text-purple-400" />
          </div>
          <div className="mt-2.5 flex items-baseline space-x-2">
            <span className="text-2xl font-black text-slate-100">{stats.pertimbanganCount}</span>
            <span className="text-[11px] text-slate-400">posisi</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800/80 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs backdrop-blur-md">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            id="search-jabatan-input"
            type="text"
            placeholder="Cari nama jabatan atau tupoksi deskripsi..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-9 py-2.5 rounded-xl bg-slate-950/90 border border-slate-800 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-xs transition"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              id="filter-kategori-select"
              value={selectedKategori}
              onChange={(e) => setSelectedKategori(e.target.value)}
              className="py-2.5 px-3 rounded-xl bg-slate-950/90 border border-slate-800 text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-xs cursor-pointer [&>option]:bg-slate-900 [&>option]:text-slate-100"
            >
              <option value="Semua">Semua Kategori</option>
              {kategoriOptions.map((kat) => (
                <option key={kat} value={kat}>
                  {kat}
                </option>
              ))}
            </select>
          </div>

          <select
            id="filter-status-select"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value as any)}
            className="py-2.5 px-3 rounded-xl bg-slate-950/90 border border-slate-800 text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-xs cursor-pointer [&>option]:bg-slate-900 [&>option]:text-slate-100"
          >
            <option value="semua">Semua Status</option>
            <option value="aktif">Hanya Aktif</option>
            <option value="nonaktif">Hanya Nonaktif</option>
          </select>
        </div>
      </div>

      {/* Table List of Positions */}
      <div className="bg-slate-900/80 rounded-2xl border border-slate-800/80 shadow-lg overflow-hidden backdrop-blur-md">
        <div className="overflow-x-auto w-full max-w-full">
          <table className="w-full min-w-[750px] text-left border-collapse text-xs text-slate-300">
            <thead>
              <tr className="bg-slate-950/90 text-slate-300 font-bold border-b border-slate-800 uppercase text-[11px] tracking-wider whitespace-nowrap">
                <th className="py-3.5 px-4 w-14 text-center">Urutan</th>
                <th className="py-3.5 px-4">Nama Jabatan Organisasi</th>
                <th className="py-3.5 px-4">Kategori Struktur</th>
                <th className="py-3.5 px-4">Deskripsi / Keterangan Tupoksi</th>
                <th className="py-3.5 px-4 text-center w-28">Digunakan</th>
                <th className="py-3.5 px-4 text-center w-24">Status</th>
                {canEdit && <th className="py-3.5 px-4 text-center w-28">Aksi</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={canEdit ? 7 : 6} className="py-12 text-center text-slate-400">
                    <Briefcase className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                    <p className="font-semibold text-slate-200 text-sm">Tidak ada data jabatan yang ditemukan</p>
                    <p className="text-xs text-slate-500 mt-1">
                      Silakan sesuaikan filter pencarian atau klik tombol "Tambah Jabatan" di atas.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredList.map((item, index) => {
                  const usageCount = getUsageCount(item.nama);
                  const isAktif = item.aktif !== undefined ? item.aktif : true;
                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-800/40 transition-colors"
                      id={`jabatan-row-${item.id}`}
                    >
                      <td className="py-3.5 px-4 text-center font-mono text-xs font-bold text-slate-400">
                        {item.urutan || index + 1}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-100 text-sm tracking-wide">{item.nama}</div>
                        {item.tanggalDitambahkan && (
                          <div className="text-[10px] text-slate-500 mt-0.5">
                            Ditambahkan: {(() => {
                              try {
                                const d = new Date(item.tanggalDitambahkan);
                                return isNaN(d.getTime()) ? item.tanggalDitambahkan : d.toLocaleDateString('id-ID');
                              } catch {
                                return item.tanggalDitambahkan;
                              }
                            })()}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            item.kategori === 'MPH / Majelis Jemaat'
                              ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                              : item.kategori === 'Seksi Kategorial'
                              ? 'bg-indigo-500/10 text-indigo-300 border border-indigo-500/20'
                              : item.kategori === 'Badan & Majelis Pertimbangan'
                              ? 'bg-purple-500/10 text-purple-300 border border-purple-500/20'
                              : 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                          }`}
                        >
                          {item.kategori}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-300 text-xs max-w-sm">
                        {item.deskripsi ? (
                          <span>{item.deskripsi}</span>
                        ) : (
                          <span className="text-slate-600 italic">- Tidak ada keterangan -</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {usageCount > 0 ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-bold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                            {usageCount} Orang
                          </span>
                        ) : (
                          <span className="text-xs text-slate-500 font-mono">0</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {canEdit ? (
                          <button
                            onClick={() => handleToggleAktif(item)}
                            className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-semibold cursor-pointer transition-all ${
                              isAktif
                                ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/25'
                                : 'bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-750 hover:text-slate-300'
                            }`}
                            title="Klik untuk mengubah status aktif/nonaktif"
                          >
                            {isAktif ? (
                              <>
                                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                <span>Aktif</span>
                              </>
                            ) : (
                              <>
                                <XCircle className="w-3 h-3 text-slate-500" />
                                <span>Nonaktif</span>
                              </>
                            )}
                          </button>
                        ) : (
                          <span
                            className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                              isAktif
                                ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                                : 'bg-slate-800 text-slate-400 border border-slate-700'
                            }`}
                          >
                            {isAktif ? 'Aktif' : 'Nonaktif'}
                          </span>
                        )}
                      </td>
                      {canEdit && (
                        <td className="py-3.5 px-4 text-center">
                          <div className="flex items-center justify-center space-x-1.5">
                            <button
                              onClick={() => handleOpenEditModal(item)}
                              className="p-1.5 text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-colors cursor-pointer"
                              title="Edit Jabatan"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setDeleteConfirmId(item.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                              title="Hapus Jabatan"
                            >
                              <Trash2 className="w-4 h-4" />
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

        {/* Footer info */}
        <div className="p-4 bg-slate-950/80 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-2">
          <span>
            Menampilkan <strong className="text-slate-200">{filteredList.length}</strong> dari total{' '}
            <strong className="text-slate-200">{jabatanList.length}</strong> jabatan terdaftar
          </span>
          <div className="flex items-center space-x-1.5 text-slate-400">
            <HelpCircle className="w-3.5 h-3.5 text-indigo-400" />
            <span>Jabatan berstatus aktif akan otomatis tampil pada pilihan dropdown formulir MPH dan SK Kategorial.</span>
          </div>
        </div>
      </div>

      {/* MODAL: Tambah / Edit Jabatan */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full text-slate-100 shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-150">
            <div className="p-5 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-xl">
                  <Briefcase className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-100">
                    {isEditing ? 'Ubah Master Jabatan' : 'Tambah Master Jabatan Baru'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {isEditing
                      ? 'Perbarui rincian nama atau kategori jabatan organisasi'
                      : 'Data akan tersimpan dan dapat langsung dipilih pada dropdown form'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => !isProcessing && setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-200 p-1 cursor-pointer"
                disabled={isProcessing}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Progress bar inside modal */}
            {isProcessing && (
              <div className="h-1 bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-indigo-500 transition-all duration-300"
                  style={{ width: `${processProgress}%` }}
                />
              </div>
            )}

            <form onSubmit={handleSave} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Nama Jabatan Organisasi <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: KETUA SEKSI DIAKONIA (Tanpa nomor urut)"
                  value={formData.nama || ''}
                  onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                  disabled={isProcessing}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 placeholder:text-slate-500 font-bold focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 uppercase text-xs transition"
                />
                <p className="text-[11px] text-slate-400 mt-1.5">
                  Ketik nama jabatan langsung tanpa mencantumkan nomor awalan (misal: "KETUA SPP/R").
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Kategori Struktur <span className="text-rose-400">*</span>
                  </label>
                  <select
                    value={formData.kategori || 'Majelis Jemaat (MPH/Penatua/Diakon)'}
                    onChange={(e) => setFormData({ ...formData, kategori: e.target.value as KategoriJabatan })}
                    disabled={isProcessing}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 cursor-pointer [&>option]:bg-slate-900 [&>option]:text-slate-100"
                  >
                    {kategoriOptions.map((kat) => (
                      <option key={kat} value={kat}>
                        {kat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Urutan Dropdown
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={formData.urutan ?? 1}
                    onChange={(e) => setFormData({ ...formData, urutan: parseInt(e.target.value) || 1 })}
                    disabled={isProcessing}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 font-bold text-xs focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Deskripsi / Tupoksi Singkat (Opsional)
                </label>
                <textarea
                  rows={3}
                  placeholder="Keterangan wewenang, dasar SK, atau tugas pokok fungsi jabatan..."
                  value={formData.deskripsi || ''}
                  onChange={(e) => setFormData({ ...formData, deskripsi: e.target.value })}
                  disabled={isProcessing}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 placeholder:text-slate-500 text-xs focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="pt-2">
                <label className="flex items-center space-x-3 cursor-pointer bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                  <input
                    type="checkbox"
                    checked={formData.aktif}
                    onChange={(e) => setFormData({ ...formData, aktif: e.target.checked })}
                    disabled={isProcessing}
                    className="w-4 h-4 text-indigo-600 rounded border-slate-700 bg-slate-950 focus:ring-indigo-500"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-200">Status Jabatan Aktif</span>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Tampilkan jabatan ini dalam pilihan dropdown formulir MPH dan SK Kategorial.
                    </p>
                  </div>
                </label>
              </div>

              <div className="pt-4 border-t border-slate-800 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isProcessing}
                  className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="inline-flex items-center space-x-2 px-5 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-md shadow-indigo-600/30 transition-all disabled:opacity-50 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>{isProcessing ? 'Menyimpan...' : isEditing ? 'Simpan Perubahan' : 'Tambah Jabatan'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Konfirmasi Hapus Jabatan */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 text-slate-100 shadow-2xl animate-in fade-in zoom-in duration-150">
            <div className="flex items-center space-x-3 text-rose-400 mb-3">
              <div className="p-2.5 bg-rose-500/10 border border-rose-500/20 rounded-xl">
                <Trash2 className="w-6 h-6 text-rose-400" />
              </div>
              <h3 className="text-base font-bold text-slate-100">Hapus Master Jabatan?</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed mb-4">
              Apakah Anda yakin ingin menghapus jabatan ini dari daftar master? Jabatan ini tidak akan muncul lagi pada pilihan dropdown selanjutnya.
            </p>

            {isProcessing && (
              <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden mb-4">
                <div
                  className="h-full bg-rose-500 transition-all duration-300"
                  style={{ width: `${processProgress}%` }}
                />
              </div>
            )}

            <div className="flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                disabled={isProcessing}
                className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => handleDelete(deleteConfirmId)}
                disabled={isProcessing}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-xl shadow-md shadow-rose-600/30 transition-all disabled:opacity-50 cursor-pointer"
              >
                {isProcessing ? 'Menghapus...' : 'Ya, Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
