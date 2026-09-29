import React, { useState } from 'react';
import {
  Building2,
  Check,
  Edit2,
  MapPin,
  Plus,
  Printer,
  Search,
  Trash2,
  Users,
  X,
  UserCheck,
  Info,
  ChevronRight,
  ShieldAlert,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Lingkungan } from '../../types';
import { DeleteConfirmModal } from '../DeleteConfirmModal';

export const LingkunganModule: React.FC = () => {
  const {
    lingkunganList,
    addLingkungan,
    updateLingkungan,
    deleteLingkungan,
    wargaJemaatList,
    penatuaDiakonList,
    currentUser,
    openPrintReport,
  } = useApp();

  const isAdminOrSekretaris =
    !currentUser?.role ||
    currentUser?.role === 'admin' ||
    currentUser?.role === 'sekretaris' ||
    currentUser?.role === 'bendahara' ||
    currentUser?.role === 'mph' ||
    currentUser?.role === 'penatua' ||
    currentUser?.role === 'diakon';

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'Semua' | 'Aktif' | 'Nonaktif'>('Semua');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Lingkungan | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Lingkungan | null>(null);

  // Confirmation & Progress state for adding Lingkungan
  const [isConfirmAddModalOpen, setIsConfirmAddModalOpen] = useState(false);
  const [isSavingAdd, setIsSavingAdd] = useState(false);
  const [addProgress, setAddProgress] = useState(0);

  // Confirmation & Progress state for editing / syncing Lingkungan with relations
  const [isConfirmEditModalOpen, setIsConfirmEditModalOpen] = useState(false);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [editProgress, setEditProgress] = useState(0);

  const [formData, setFormData] = useState<Omit<Lingkungan, 'id'>>({
    kode: '',
    nama: '',
    wilayahSektor: '',
    ketuaLingkungan: '',
    sekretarisLingkungan: '',
    keterangan: '',
    status: 'Aktif',
  });

  const handleOpenModal = (item?: Lingkungan) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        kode: item.kode,
        nama: item.nama,
        wilayahSektor: item.wilayahSektor || '',
        ketuaLingkungan: item.ketuaLingkungan || '',
        sekretarisLingkungan: item.sekretarisLingkungan || '',
        keterangan: item.keterangan || '',
        status: item.status,
      });
    } else {
      setEditingItem(null);
      const nextCodeNum = lingkunganList.length + 1;
      setFormData({
        kode: `L-${nextCodeNum < 10 ? '0' + nextCodeNum : nextCodeNum}`,
        nama: `Lingkungan ${nextCodeNum} - `,
        wilayahSektor: '',
        ketuaLingkungan: '',
        sekretarisLingkungan: '',
        keterangan: '',
        status: 'Aktif',
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
  };

  // Get bound Penatua & Diakon for the item currently being edited or deleted
  const getBoundPenatuaDiakon = (lingkunganNama?: string) => {
    if (!lingkunganNama) return [];
    return penatuaDiakonList.filter(
      (p) => p.rayon?.trim().toLowerCase() === lingkunganNama.trim().toLowerCase()
    );
  };

  // Get bound Warga Jemaat for the item currently being edited or deleted
  const getBoundWarga = (lingkunganNama?: string) => {
    if (!lingkunganNama) return [];
    return wargaJemaatList.filter(
      (w) =>
        w.rayon?.trim().toLowerCase() === lingkunganNama.trim().toLowerCase() ||
        w.sektorRayon?.trim().toLowerCase() === lingkunganNama.trim().toLowerCase()
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nama.trim()) return;

    if (editingItem) {
      const boundPD = getBoundPenatuaDiakon(editingItem.nama);
      const boundW = getBoundWarga(editingItem.nama);
      const isNameChanged = formData.nama.trim() !== editingItem.nama.trim();
      const isStatusChanged = formData.status !== editingItem.status;

      // If name or status changed and there are bound Penatua/Diakon or Warga, ask for explicit confirmation
      if ((isNameChanged || isStatusChanged) && (boundPD.length > 0 || boundW.length > 0)) {
        setIsConfirmEditModalOpen(true);
        return;
      }

      await updateLingkungan(editingItem.id, formData);
      handleCloseModal();
    } else {
      setIsConfirmAddModalOpen(true);
    }
  };

  const handleConfirmEdit = async () => {
    if (!editingItem) return;
    setIsSavingEdit(true);
    setEditProgress(30);
    try {
      setEditProgress(60);
      await updateLingkungan(editingItem.id, formData);
      setEditProgress(100);
      setTimeout(() => {
        setIsSavingEdit(false);
        setIsConfirmEditModalOpen(false);
        handleCloseModal();
        setEditProgress(0);
      }, 300);
    } catch (err) {
      console.error('Error updating lingkungan with relations:', err);
      alert('Gagal memperbarui Lingkungan. Silakan coba lagi.');
      setIsSavingEdit(false);
      setEditProgress(0);
    }
  };

  const handleConfirmAdd = async () => {
    setIsSavingAdd(true);
    setAddProgress(30);
    try {
      setAddProgress(70);
      await addLingkungan(formData);
      setAddProgress(100);
      setTimeout(() => {
        setIsSavingAdd(false);
        setIsConfirmAddModalOpen(false);
        setIsModalOpen(false);
        setEditingItem(null);
        setAddProgress(0);
      }, 300);
    } catch (err) {
      console.error('Error adding lingkungan:', err);
      alert('Gagal menambahkan Lingkungan & Sektor. Silakan coba lagi.');
      setIsSavingAdd(false);
      setAddProgress(0);
    }
  };

  const filteredList = lingkunganList.filter((item) => {
    const matchSearch =
      item.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.kode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.wilayahSektor && item.wilayahSektor.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.ketuaLingkungan && item.ketuaLingkungan.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchStatus = filterStatus === 'Semua' || item.status === filterStatus;

    return matchSearch && matchStatus;
  });

  const activeCount = lingkunganList.filter((l) => l.status === 'Aktif').length;
  const totalWarga = wargaJemaatList.length;
  const totalPelayan = penatuaDiakonList.length;

  const boundPDForDelete = deleteTarget ? getBoundPenatuaDiakon(deleteTarget.nama) : [];
  const boundWargaForDelete = deleteTarget ? getBoundWarga(deleteTarget.nama) : [];

  const boundPDForEdit = editingItem ? getBoundPenatuaDiakon(editingItem.nama) : [];
  const boundWargaForEdit = editingItem ? getBoundWarga(editingItem.nama) : [];

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-indigo-600/10 to-transparent pointer-events-none" />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-4">
            <div className="p-3.5 rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 shadow-md">
              <MapPin className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
                Pengelolaan Lingkungan & Sektor Jemaat
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
                Kelola pembagian wilayah, nama lingkungan/rayon, serta penanggung jawab pelayanan jemaat
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() =>
                openPrintReport({
                  reportType: 'lingkungan_jemaat',
                  customTitle: 'Daftar Lingkungan & Wilayah Sektor Jemaat',
                })
              }
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
            >
              <Printer className="w-4 h-4 text-indigo-400" />
              <span>Cetak Laporan</span>
            </button>

            {isAdminOrSekretaris && (
              <button
                onClick={() => handleOpenModal()}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow-lg shadow-indigo-600/30"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Lingkungan</span>
              </button>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-slate-800/80">
          <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Total Lingkungan
              </p>
              <p className="text-xl font-extrabold text-white mt-0.5">{lingkunganList.length}</p>
            </div>
            <div className="p-2.5 rounded-lg bg-indigo-500/10 text-indigo-400">
              <Building2 className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Lingkungan Aktif
              </p>
              <p className="text-xl font-extrabold text-emerald-400 mt-0.5">{activeCount}</p>
            </div>
            <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400">
              <Check className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Pelayan Tahbisan
              </p>
              <p className="text-xl font-extrabold text-amber-400 mt-0.5">{totalPelayan} Orang</p>
            </div>
            <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-400">
              <UserCheck className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Total Jiwa Warga
              </p>
              <p className="text-xl font-extrabold text-sky-400 mt-0.5">{totalWarga} Jiwa</p>
            </div>
            <div className="p-2.5 rounded-lg bg-sky-500/10 text-sky-400">
              <Users className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Cari kode, nama lingkungan, atau ketua..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-slate-400 font-medium whitespace-nowrap">Status:</span>
          {(['Semua', 'Aktif', 'Nonaktif'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                filterStatus === st
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Cards Grid View */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredList.map((item) => {
          const boundW = wargaJemaatList.filter(
            (w) =>
              w.rayon?.trim().toLowerCase() === item.nama.trim().toLowerCase() ||
              w.sektorRayon?.trim().toLowerCase() === item.nama.trim().toLowerCase()
          );
          const boundPD = penatuaDiakonList.filter(
            (p) => p.rayon?.trim().toLowerCase() === item.nama.trim().toLowerCase()
          );

          return (
            <div
              key={item.id}
              className="bg-slate-900 border border-slate-800 hover:border-indigo-500/50 rounded-2xl p-5 shadow-lg flex flex-col justify-between transition group relative overflow-hidden"
            >
              <div className="space-y-3">
                {/* Header Badge & Code */}
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-md bg-indigo-500/15 text-indigo-300 font-bold text-[10px] uppercase border border-indigo-500/30">
                    {item.kode}
                  </span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] border ${
                      item.status === 'Aktif'
                        ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                        : 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                    }`}
                  >
                    {item.status}
                  </span>
                </div>

                {/* Title */}
                <div>
                  <h3 className="font-bold text-slate-100 text-base group-hover:text-indigo-300 transition">
                    {item.nama}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 flex items-start gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0 mt-0.5" />
                    <span>{item.wilayahSektor || 'Wilayah Sektor Belum Diatur'}</span>
                  </p>
                </div>

                {/* Officers / Penanggung Jawab */}
                <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between text-slate-300">
                    <span className="text-slate-500 font-medium">Ketua Lingkungan:</span>
                    <span className="font-semibold text-slate-200">
                      {item.ketuaLingkungan || '-'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-slate-300">
                    <span className="text-slate-500 font-medium">Sekretaris:</span>
                    <span className="font-semibold text-slate-200">
                      {item.sekretarisLingkungan || '-'}
                    </span>
                  </div>
                </div>

                {/* Assigned Penatua / Diakon preview */}
                {boundPD.length > 0 && (
                  <div className="bg-indigo-950/20 p-2.5 rounded-xl border border-indigo-500/20 space-y-1">
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-indigo-300">
                      <UserCheck className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Pelayan Tahbisan ({boundPD.length}):</span>
                    </div>
                    <p className="text-[10px] text-slate-300 line-clamp-2">
                      {boundPD.map((p) => `${p.jabatan} ${p.nama}`).join(', ')}
                    </p>
                  </div>
                )}

                {/* Description */}
                {item.keterangan && (
                  <p className="text-[11px] text-slate-400 italic line-clamp-2">
                    "{item.keterangan}"
                  </p>
                )}
              </div>

              {/* Card Footer Info & Actions */}
              <div className="pt-4 mt-4 border-t border-slate-800/80 flex items-center justify-between">
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="flex items-center gap-1.5 text-[11px] text-sky-400 font-bold bg-sky-500/10 px-2 py-0.5 rounded-lg border border-sky-500/20">
                    <Users className="w-3 h-3" />
                    <span>{boundW.length} Warga</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded-lg border border-amber-500/20">
                    <UserCheck className="w-3 h-3" />
                    <span>{boundPD.length} Pelayan</span>
                  </div>
                </div>

                {isAdminOrSekretaris && (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenModal(item);
                      }}
                      title="Edit Lingkungan"
                      className="p-2 sm:p-1.5 rounded-xl bg-slate-800 hover:bg-indigo-600/30 hover:text-indigo-300 text-slate-300 transition border border-slate-700 cursor-pointer min-w-[38px] min-h-[38px] sm:min-w-[34px] sm:min-h-[34px] flex items-center justify-center"
                    >
                      <Edit2 className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteTarget(item);
                      }}
                      title="Hapus Lingkungan & Sektor"
                      className="p-2 sm:p-1.5 rounded-xl bg-slate-800 hover:bg-rose-500/20 hover:text-rose-300 text-rose-400 sm:text-slate-400 transition border border-slate-700 cursor-pointer min-w-[38px] min-h-[38px] sm:min-w-[34px] sm:min-h-[34px] flex items-center justify-center"
                    >
                      <Trash2 className="w-4 h-4 sm:w-3.5 sm:h-3.5 text-rose-400" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {filteredList.length === 0 && (
          <div className="col-span-full bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-400 space-y-3">
            <MapPin className="w-10 h-10 mx-auto text-slate-600" />
            <p className="font-semibold text-slate-300">Tidak ada data Lingkungan ditemukan</p>
            <p className="text-xs text-slate-500">
              Coba kata kunci pencarian lain atau tambahkan Lingkungan baru.
            </p>
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in duration-200">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-100 text-base">
                    {editingItem ? 'Edit Data Lingkungan' : 'Tambah Lingkungan Baru'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Atur nama, kode, dan penanggung jawab sektor pelayanan
                  </p>
                </div>
              </div>
              <button
                onClick={handleCloseModal}
                className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Kode <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: L-01"
                    value={formData.kode || ''}
                    onChange={(e) => setFormData({ ...formData, kode: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 font-bold focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block font-semibold text-slate-300 mb-1">
                    Nama Lingkungan / Rayon <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Lingkungan I - Ebenezer"
                    value={formData.nama || ''}
                    onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 font-bold focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Wilayah / Sektor Cakupan Jalan
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Jl. Imam Bonjol, Jl. Ahmad Yani & Sekitarnya"
                  value={formData.wilayahSektor || ''}
                  onChange={(e) => setFormData({ ...formData, wilayahSektor: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Ketua Lingkungan
                  </label>
                  <input
                    type="text"
                    placeholder="Nama Ketua Lingkungan"
                    value={formData.ketuaLingkungan || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, ketuaLingkungan: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Sekretaris Lingkungan
                  </label>
                  <input
                    type="text"
                    placeholder="Nama Sekretaris Lingkungan"
                    value={formData.sekretarisLingkungan || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, sekretarisLingkungan: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Keterangan / Catatan Sektor
                </label>
                <textarea
                  rows={2}
                  placeholder="Informasi batas wilayah atau catatan khusus..."
                  value={formData.keterangan || ''}
                  onChange={(e) => setFormData({ ...formData, keterangan: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Status Sektor</label>
                <select
                  value={formData.status || 'Aktif'}
                  onChange={(e) =>
                    setFormData({ ...formData, status: e.target.value as 'Aktif' | 'Nonaktif' })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 font-semibold focus:outline-none focus:border-indigo-500"
                >
                  <option value="Aktif">Aktif</option>
                  <option value="Nonaktif">Nonaktif</option>
                </select>
              </div>

              {/* Modal Buttons */}
              <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition shadow-lg shadow-indigo-600/30 flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Simpan Data</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Confirmation Modal for Adding Lingkungan */}
      {isConfirmAddModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-700/80 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 bg-indigo-500/20 text-indigo-400 rounded-xl border border-indigo-500/30">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-white text-base">Konfirmasi Tambah Lingkungan</h3>
                  <p className="text-xs text-slate-400">Periksa kembali data sektor/lingkungan baru.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsConfirmAddModalOpen(false)}
                disabled={isSavingAdd}
                className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3.5 bg-slate-900/90 rounded-xl border border-slate-700/80 space-y-2 text-xs text-slate-300">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Kode Sektor:</span>
                <span className="font-mono font-bold text-amber-300">{formData.kode}</span>
              </div>
              <div className="flex justify-between items-start gap-2">
                <span className="text-slate-400 shrink-0">Nama Lingkungan:</span>
                <span className="font-bold text-white text-right">{formData.nama}</span>
              </div>
              {formData.wilayahSektor && (
                <div className="flex justify-between items-start gap-2">
                  <span className="text-slate-400 shrink-0">Wilayah / Sektor:</span>
                  <span className="font-medium text-slate-200 text-right">{formData.wilayahSektor}</span>
                </div>
              )}
              {formData.ketuaLingkungan && (
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Ketua Lingkungan:</span>
                  <span className="font-semibold text-emerald-300">{formData.ketuaLingkungan}</span>
                </div>
              )}
              {formData.sekretarisLingkungan && (
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Sekretaris Lingkungan:</span>
                  <span className="font-semibold text-slate-300">{formData.sekretarisLingkungan}</span>
                </div>
              )}
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Status:</span>
                <span className={`font-extrabold px-2 py-0.5 rounded text-[11px] ${
                  formData.status === 'Aktif' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                }`}>
                  {formData.status}
                </span>
              </div>
            </div>

            {/* Progress Bar during saving */}
            {isSavingAdd && (
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between text-xs font-bold text-indigo-400">
                  <span>Menyimpan Data Lingkungan...</span>
                  <span>{addProgress}%</span>
                </div>
                <div className="w-full bg-slate-700 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-indigo-500 to-cyan-400 h-full transition-all duration-300"
                    style={{ width: `${addProgress}%` }}
                  />
                </div>
              </div>
            )}

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsConfirmAddModalOpen(false)}
                disabled={isSavingAdd}
                className="flex-1 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold text-xs rounded-xl transition-all cursor-pointer min-h-[44px]"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmAdd}
                disabled={isSavingAdd}
                className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs rounded-xl transition-all shadow-lg shadow-indigo-600/30 cursor-pointer min-h-[44px] flex items-center justify-center gap-2"
              >
                {isSavingAdd ? (
                  <span>Menyimpan...</span>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    <span>Ya, Tambahkan Lingkungan</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Editing / Changing Lingkungan with Relations */}
      {isConfirmEditModalOpen && editingItem && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-700/80 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 bg-amber-500/20 text-amber-400 rounded-xl border border-amber-500/30">
                  <RefreshCw className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-white text-base">Konfirmasi Perubahan Lingkungan</h3>
                  <p className="text-xs text-slate-400">Sinkronisasi relasi data antar modul jemaat.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsConfirmEditModalOpen(false)}
                disabled={isSavingEdit}
                className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Relation Warning Box */}
            <div className="p-3.5 bg-amber-500/10 rounded-xl border border-amber-500/30 space-y-2 text-xs text-amber-200">
              <div className="flex items-center gap-2 font-bold text-amber-300">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>Pemberitahuan Integritas Relasi Data</span>
              </div>
              <p className="text-[11px] leading-relaxed text-slate-300">
                Perubahan nama atau status pada lingkungan <strong>"{editingItem.nama}"</strong> akan secara otomatis disinkronkan ke seluruh data terkait:
              </p>
              <div className="grid grid-cols-2 gap-2 pt-1 text-slate-200">
                <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-700/80 flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-amber-400" />
                  <div>
                    <p className="text-[10px] text-slate-400">Penatua / Diakon:</p>
                    <p className="font-bold">{boundPDForEdit.length} Pelayan</p>
                  </div>
                </div>
                <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-700/80 flex items-center gap-2">
                  <Users className="w-4 h-4 text-sky-400" />
                  <div>
                    <p className="text-[10px] text-slate-400">Warga Jemaat:</p>
                    <p className="font-bold">{boundWargaForEdit.length} Jiwa</p>
                  </div>
                </div>
              </div>

              {boundPDForEdit.length > 0 && (
                <div className="pt-1 text-[11px] text-slate-300">
                  <span className="font-semibold text-slate-400">Daftar Pelayan Terikat: </span>
                  {boundPDForEdit.map((p) => `${p.jabatan} ${p.nama}`).join(', ')}
                </div>
              )}
            </div>

            <div className="p-3.5 bg-slate-900/90 rounded-xl border border-slate-700/80 space-y-2 text-xs text-slate-300">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Nama Semula:</span>
                <span className="font-mono text-slate-300 line-through">{editingItem.nama}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Nama Baru:</span>
                <span className="font-bold text-white text-right">{formData.nama}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Status Sektor:</span>
                <span className={`font-bold px-2 py-0.5 rounded text-[11px] ${
                  formData.status === 'Aktif' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                }`}>
                  {formData.status}
                </span>
              </div>
            </div>

            {/* Progress Bar during saving */}
            {isSavingEdit && (
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between text-xs font-bold text-indigo-400">
                  <span>Menyimpan & Menyinkronkan Relasi Data...</span>
                  <span>{editProgress}%</span>
                </div>
                <div className="w-full bg-slate-700 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-amber-500 to-indigo-500 h-full transition-all duration-300"
                    style={{ width: `${editProgress}%` }}
                  />
                </div>
              </div>
            )}

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsConfirmEditModalOpen(false)}
                disabled={isSavingEdit}
                className="flex-1 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold text-xs rounded-xl transition-all cursor-pointer min-h-[44px]"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmEdit}
                disabled={isSavingEdit}
                className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs rounded-xl transition-all shadow-lg shadow-indigo-600/30 cursor-pointer min-h-[44px] flex items-center justify-center gap-2"
              >
                {isSavingEdit ? (
                  <span>Menyinkronkan...</span>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4" />
                    <span>Ya, Simpan & Sinkronkan</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Confirm Delete */}
      <DeleteConfirmModal
        isOpen={!!deleteTarget}
        title="Konfirmasi Hapus Data Lingkungan & Sektor"
        itemName={deleteTarget ? `${deleteTarget.nama} (${deleteTarget.kode})` : ''}
        description={
          deleteTarget
            ? boundPDForDelete.length > 0 || boundWargaForDelete.length > 0
              ? `PERINGATAN INTEGRITAS RELASI: Lingkungan/Sektor ini saat ini aktif terikat dengan ${boundPDForDelete.length} data Penatua/Diakon (${boundPDForDelete.map(p => `${p.jabatan} ${p.nama}`).join(', ') || '0'}) dan ${boundWargaForDelete.length} data Warga Jemaat. Menghapus lingkungan ini akan memutus data relasi pelayanan. Apakah Anda yakin ingin tetap menghapusnya?`
              : 'Apakah Anda yakin ingin menghapus data Lingkungan & Sektor ini? Data yang telah dihapus tidak dapat dikembalikan.'
            : ''
        }
        onConfirm={async () => {
          if (deleteTarget) {
            await deleteLingkungan(deleteTarget.id);
          }
        }}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
};
