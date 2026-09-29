import React, { useState } from 'react';
import {
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  Edit2,
  Eye,
  Loader2,
  Newspaper,
  Plus,
  Printer,
  Search,
  Share2,
  ShieldAlert,
  Trash2,
  X,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { RenunganItem } from '../../types';

export const RenunganModule: React.FC = () => {
  const {
    renunganList,
    addRenunganItem,
    updateRenunganItem,
    deleteRenunganItem,
    togglePostingBuletin,
    openPrintReport,
    currentUser,
    settings,
  } = useApp();

  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<RenunganItem | null>(null);
  const [readingRenungan, setReadingRenungan] = useState<RenunganItem | null>(
    renunganList[0] || null
  );

  // States for save confirmation & progress bar
  const [isConfirmSaveModalOpen, setIsConfirmSaveModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveProgress, setSaveProgress] = useState(0);

  // States for delete confirmation & progress bar
  const [itemToDelete, setItemToDelete] = useState<RenunganItem | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteProgress, setDeleteProgress] = useState(0);

  const canEdit =
    currentUser.role === 'admin' || currentUser.role === 'sekretaris';

  const [formData, setFormData] = useState<Omit<RenunganItem, 'id'>>({
    tanggal: new Date().toISOString().split('T')[0],
    judul: '',
    natsAlkitab: 'Yohanes 3:16',
    penulis: settings.namaKetuaJemaat,
    isi: '',
    aplikasiDoa: '',
    kategori: 'Renungan Harian',
    dipublikasikan: true,
  });

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormData({
      tanggal: new Date().toISOString().split('T')[0],
      judul: '',
      natsAlkitab: 'Yohanes 3:16',
      penulis: settings.namaKetuaJemaat,
      isi: '',
      aplikasiDoa: '',
      kategori: 'Renungan Harian',
      dipublikasikan: true,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: RenunganItem) => {
    setEditingItem(item);
    setFormData({ ...item });
    setIsModalOpen(true);
  };

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    setIsConfirmSaveModalOpen(true);
  };

  const handleConfirmSave = async () => {
    if (isSaving) return;
    setIsSaving(true);
    setSaveProgress(15);

    try {
      setSaveProgress(45);
      if (editingItem) {
        await updateRenunganItem(editingItem.id, formData);
        setSaveProgress(85);
        if (readingRenungan?.id === editingItem.id) {
          setReadingRenungan({ ...editingItem, ...formData });
        }
      } else {
        await addRenunganItem(formData);
        setSaveProgress(85);
      }

      setSaveProgress(100);
      await new Promise((resolve) => setTimeout(resolve, 350));
      setIsConfirmSaveModalOpen(false);
      setIsModalOpen(false);
    } catch (err) {
      console.error('Gagal menyimpan renungan:', err);
    } finally {
      setIsSaving(false);
      setSaveProgress(0);
    }
  };

  const handleRequestDelete = (item: RenunganItem) => {
    setItemToDelete(item);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete || isDeleting) return;
    setIsDeleting(true);
    setDeleteProgress(20);

    try {
      setDeleteProgress(60);
      await deleteRenunganItem(itemToDelete.id);
      setDeleteProgress(95);

      if (readingRenungan?.id === itemToDelete.id) {
        const remaining = renunganList.filter((r) => r.id !== itemToDelete.id);
        setReadingRenungan(remaining[0] || null);
      }

      setDeleteProgress(100);
      await new Promise((resolve) => setTimeout(resolve, 350));
      setIsDeleteModalOpen(false);
      setItemToDelete(null);
    } catch (err) {
      console.error('Gagal menghapus renungan:', err);
    } finally {
      setIsDeleting(false);
      setDeleteProgress(0);
    }
  };

  const filteredList = renunganList.filter((item) => {
    return (
      item.judul.toLowerCase().includes(search.toLowerCase()) ||
      item.natsAlkitab.toLowerCase().includes(search.toLowerCase()) ||
      item.penulis.toLowerCase().includes(search.toLowerCase())
    );
  });

  return (
    <div className="space-y-6">
      <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800/80 shadow-lg backdrop-blur-md flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <BookOpen className="w-5 h-5" />
            </div>
            Bahan Khotbah & Buletin Renungan Harian GKE
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Penyusunan renungan harian, khotbah minggu, dan cetak buletin rohani jemaat
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {canEdit && (
            <button
              onClick={handleOpenAdd}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-all shadow-md shadow-indigo-600/30 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Tulis Renungan Baru</span>
            </button>
          )}

          {readingRenungan && (
            <button
              onClick={() =>
                openPrintReport({
                  reportType: 'buletin_renungan',
                  renunganId: readingRenungan.id,
                })
              }
              className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-4 py-2.5 rounded-xl transition-all border border-slate-700 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
            >
              <Printer className="w-4 h-4 text-emerald-400" />
              <span>Cetak Buletin Renungan</span>
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Archives & List */}
        <div className="space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Cari judul / ayat..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-xs"
            />
          </div>

          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
            {filteredList.map((item) => {
              const isSelected = readingRenungan?.id === item.id;
              return (
                <div
                  key={item.id}
                  onClick={() => setReadingRenungan(item)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer backdrop-blur-md ${
                    isSelected
                      ? 'bg-indigo-500/10 border-indigo-500/40 shadow-lg'
                      : 'bg-slate-900/80 border-slate-800/80 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                    <span className="font-bold text-indigo-400 uppercase tracking-wider">{item.kategori}</span>
                    <div className="flex items-center gap-1.5">
                      {item.dipostingKeBuletin && (
                        <span className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.5 rounded font-bold text-[9px] flex items-center gap-1">
                          <Newspaper className="w-2.5 h-2.5" />
                          <span>Buletin</span>
                        </span>
                      )}
                      <span className="font-mono">{item.tanggal}</span>
                    </div>
                  </div>
                  <h4 className="font-bold text-slate-100 text-xs leading-snug">{item.judul}</h4>
                  <p className="text-[11px] font-serif text-indigo-300 italic mt-1 font-semibold">
                    {item.natsAlkitab}
                  </p>

                  <div className="mt-3 pt-2.5 border-t border-slate-800/60 flex items-center justify-between text-[11px]">
                    <span className="text-slate-400 text-[10px]">Oleh: {item.penulis}</span>
                    <div className="flex items-center gap-2">
                      {canEdit && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            togglePostingBuletin(item.id);
                          }}
                          className={`text-[10px] px-2 py-0.5 rounded-lg border font-semibold transition-all cursor-pointer ${
                            item.dipostingKeBuletin
                              ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20'
                              : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
                          }`}
                          title="Posting / Hapus Posting Buletin"
                        >
                          {item.dipostingKeBuletin ? '✓ Buletin' : '+ Buletin'}
                        </button>
                      )}
                      {canEdit && (
                        <>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenEdit(item);
                            }}
                            className="text-indigo-400 hover:text-indigo-300 font-medium text-[11px] cursor-pointer"
                          >
                            Edit
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRequestDelete(item);
                            }}
                            className="text-rose-400 hover:text-rose-300 font-medium text-[11px] cursor-pointer"
                          >
                            Hapus
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Bulletin Reader Preview */}
        <div className="lg:col-span-2 bg-slate-900/80 rounded-2xl border border-slate-800/80 p-6 shadow-lg backdrop-blur-md">
          {readingRenungan ? (
            <div className="space-y-6">
              <div className="border-b border-slate-800 pb-5 text-center">
                <span className="text-[10px] font-bold font-sans tracking-widest text-indigo-300 uppercase bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20">
                  Buletin Renungan Harian GKE
                </span>
                <h2 className="text-2xl font-extrabold text-slate-100 mt-3 font-serif">
                  {readingRenungan.judul}
                </h2>
                <p className="text-sm font-semibold text-indigo-400 italic mt-1 font-serif">
                  Nats Alkitab: {readingRenungan.natsAlkitab}
                </p>
                <div className="text-xs font-sans text-slate-400 mt-2 flex justify-center gap-4">
                  <span>Penulis: <strong className="text-slate-200">{readingRenungan.penulis}</strong></span>
                  <span>•</span>
                  <span>Tanggal: {readingRenungan.tanggal}</span>
                </div>
              </div>

              {/* Main Content */}
              <div className="text-xs leading-relaxed text-slate-300 whitespace-pre-line text-justify font-serif">
                {readingRenungan.isi}
              </div>

              {/* Prayer & Application Card */}
              <div className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border-l-4 border-indigo-500 p-4 rounded-r-2xl text-xs font-sans text-slate-200 border border-slate-800/50">
                <h4 className="font-bold text-indigo-300 text-xs mb-1 uppercase tracking-wider">APLIKASI & DOA HARIAN:</h4>
                <p className="italic leading-relaxed text-slate-300">{readingRenungan.aplikasiDoa}</p>
              </div>

              <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs font-sans">
                <span className="text-slate-400">
                  {settings.namaJemaat} - Publikasi Resmi Majelis Jemaat GKE
                </span>

                <button
                  onClick={() =>
                    openPrintReport({
                      reportType: 'buletin_renungan',
                      renunganId: readingRenungan.id,
                    })
                  }
                  className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-4 py-2.5 rounded-xl transition-all shadow-md shadow-indigo-600/30 cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Cetak Buletin Ini</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-16 text-slate-500 font-sans">
              Pilih renungan di sebelah kiri untuk membaca atau mencetak buletin.
            </div>
          )}
        </div>
      </div>

      {/* Main Input/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden border border-slate-800 text-slate-100">
            <div className="bg-slate-950 p-4 px-5 border-b border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-100">
                {editingItem ? 'Edit Renungan' : 'Tulis Renungan / Bahan Khotbah Baru'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="p-5 space-y-4 text-xs max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Tanggal Renungan</label>
                  <input
                    type="date"
                    required
                    value={formData.tanggal || ''}
                    onChange={(e) => setFormData({ ...formData, tanggal: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 font-semibold focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Kategori</label>
                  <select
                    value={formData.kategori || 'Renungan Harian'}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        kategori: e.target.value as RenunganItem['kategori'],
                      })
                    }
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="Renungan Harian" className="bg-slate-900">Renungan Harian</option>
                    <option value="Khotbah Minggu" className="bg-slate-900">Khotbah Minggu</option>
                    <option value="Suara Gembala" className="bg-slate-900">Suara Gembala</option>
                    <option value="Warta Sukacita" className="bg-slate-900">Warta Sukacita</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Judul Renungan</label>
                <input
                  type="text"
                  required
                  value={formData.judul || ''}
                  onChange={(e) => setFormData({ ...formData, judul: e.target.value })}
                  placeholder="Judul renungan rohani..."
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 font-bold focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Nats Alkitab (Verses)</label>
                  <input
                    type="text"
                    required
                    value={formData.natsAlkitab || ''}
                    onChange={(e) => setFormData({ ...formData, natsAlkitab: e.target.value })}
                    placeholder="e.g. Yohanes 3:16"
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-indigo-300 font-semibold focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Penulis / Pengkhotbah</label>
                  <input
                    type="text"
                    required
                    value={formData.penulis || ''}
                    onChange={(e) => setFormData({ ...formData, penulis: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Isi Renungan Rohani</label>
                <textarea
                  rows={6}
                  required
                  value={formData.isi || ''}
                  onChange={(e) => setFormData({ ...formData, isi: e.target.value })}
                  placeholder="Uraian firman dan bahan renungan..."
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 font-serif leading-relaxed focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Aplikasi Praktis & Doa Harian</label>
                <textarea
                  rows={2}
                  required
                  value={formData.aplikasiDoa || ''}
                  onChange={(e) => setFormData({ ...formData, aplikasiDoa: e.target.value })}
                  placeholder="Pokok doa dan komitmen firman..."
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-700 rounded-xl hover:bg-slate-800 font-semibold text-slate-300 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold shadow-md shadow-indigo-600/30 cursor-pointer transition"
                >
                  {editingItem ? 'Lanjut Simpan Perubahan' : 'Lanjut Simpan & Terbitkan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation & Progress Modal for Saving */}
      {isConfirmSaveModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-indigo-500/40 text-slate-100">
            <div className="bg-indigo-950/40 p-4 px-5 border-b border-indigo-800/50 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-100">
                    Konfirmasi Simpan Renungan
                  </h3>
                  <p className="text-[11px] text-indigo-300/80">
                    {editingItem ? 'Simpan pembaruan renungan rohani' : 'Terbitkan renungan rohani baru ke sistem'}
                  </p>
                </div>
              </div>
              {!isSaving && (
                <button
                  type="button"
                  onClick={() => setIsConfirmSaveModalOpen(false)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            <div className="p-5 space-y-4 text-xs">
              <p className="text-slate-300 leading-relaxed">
                Apakah data renungan harian berikut sudah lengkap dan siap disimpan?
              </p>

              {/* Summary Card */}
              <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 space-y-2">
                <div className="flex justify-between items-start pb-2 border-b border-slate-800/80">
                  <span className="text-slate-400">Judul Renungan</span>
                  <span className="font-bold text-indigo-300 text-right max-w-[200px] truncate">
                    {formData.judul}
                  </span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-slate-800/80">
                  <span className="text-slate-400">Kategori &amp; Tanggal</span>
                  <span className="font-medium text-slate-200">
                    {formData.kategori} ({formData.tanggal})
                  </span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-slate-800/80">
                  <span className="text-slate-400">Nats Alkitab</span>
                  <span className="font-medium text-indigo-400 font-serif italic">
                    {formData.natsAlkitab}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Penulis</span>
                  <span className="font-medium text-slate-200 text-right max-w-[200px] truncate">
                    {formData.penulis}
                  </span>
                </div>
              </div>

              {/* Save Progress Bar */}
              {isSaving && (
                <div className="space-y-1.5 pt-2">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-indigo-400 font-semibold flex items-center gap-1.5">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Sedang memproses penyimpanan ke database...
                    </span>
                    <span className="font-bold text-slate-300">{saveProgress}%</span>
                  </div>
                  <div className="w-full bg-slate-950 rounded-full h-2.5 overflow-hidden border border-slate-800 p-0.5">
                    <div
                      className="bg-gradient-to-r from-indigo-500 to-indigo-400 h-full rounded-full transition-all duration-300 ease-out"
                      style={{ width: `${saveProgress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="px-5 py-3.5 bg-slate-950/60 border-t border-slate-800 flex items-center justify-end gap-2.5">
              <button
                type="button"
                disabled={isSaving}
                onClick={() => setIsConfirmSaveModalOpen(false)}
                className="px-4 py-2 border border-slate-700 rounded-xl hover:bg-slate-800 font-semibold text-slate-300 text-xs transition disabled:opacity-50 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isSaving}
                onClick={handleConfirmSave}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 active:scale-98 text-white rounded-xl font-bold text-xs shadow-md shadow-indigo-600/30 transition flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Menyimpan...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Ya, Simpan Renungan</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation & Progress Modal for Deleting */}
      {isDeleteModalOpen && itemToDelete && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-rose-500/40 text-slate-100">
            <div className="bg-rose-950/40 p-4 px-5 border-b border-rose-800/50 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-100">
                    Konfirmasi Hapus Renungan
                  </h3>
                  <p className="text-[11px] text-rose-300/80">
                    Tindakan ini permanen dan tidak dapat dibatalkan
                  </p>
                </div>
              </div>
              {!isDeleting && (
                <button
                  type="button"
                  onClick={() => {
                    setIsDeleteModalOpen(false);
                    setItemToDelete(null);
                  }}
                  className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            <div className="p-5 space-y-3.5 text-xs">
              <p className="text-slate-300 leading-relaxed">
                Apakah Anda yakin ingin menghapus data renungan rohani berikut dari sistem?
              </p>

              {/* Summary Card */}
              <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 space-y-2">
                <div className="flex justify-between items-start pb-2 border-b border-slate-800/80">
                  <span className="text-slate-400">Judul Renungan</span>
                  <span className="font-bold text-rose-300 text-right max-w-[200px] truncate">
                    {itemToDelete.judul}
                  </span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-slate-800/80">
                  <span className="text-slate-400">Kategori &amp; Tanggal</span>
                  <span className="font-medium text-slate-200">
                    {itemToDelete.kategori} ({itemToDelete.tanggal})
                  </span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-slate-800/80">
                  <span className="text-slate-400">Nats Alkitab</span>
                  <span className="font-medium text-indigo-400 font-serif italic">
                    {itemToDelete.natsAlkitab}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Penulis</span>
                  <span className="font-medium text-slate-200 text-right max-w-[200px] truncate">
                    {itemToDelete.penulis}
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                <span className="text-[11px] leading-relaxed">
                  Data renungan yang dihapus akan ditarik dari peredaran buletin dan arsip jemaat.
                </span>
              </div>

              {/* Delete Progress Bar */}
              {isDeleting && (
                <div className="space-y-1.5 pt-2">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-rose-400 font-semibold flex items-center gap-1.5">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Menghapus data dari Firestore database...
                    </span>
                    <span className="font-bold text-slate-300">{deleteProgress}%</span>
                  </div>
                  <div className="w-full bg-slate-950 rounded-full h-2.5 overflow-hidden border border-slate-800 p-0.5">
                    <div
                      className="bg-gradient-to-r from-rose-500 to-rose-400 h-full rounded-full transition-all duration-300 ease-out"
                      style={{ width: `${deleteProgress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="px-5 py-3.5 bg-slate-950/60 border-t border-slate-800 flex items-center justify-end gap-2.5">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setItemToDelete(null);
                }}
                className="px-4 py-2 border border-slate-700 rounded-xl hover:bg-slate-800 font-semibold text-slate-300 text-xs transition disabled:opacity-50 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 active:scale-98 text-white rounded-xl font-bold text-xs shadow-md shadow-rose-600/30 transition flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Menghapus...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Ya, Hapus Renungan</span>
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

