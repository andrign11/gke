import React, { useState } from 'react';
import {
  Edit2,
  Package,
  Plus,
  Printer,
  Search,
  Trash2,
  X,
  BarChart3,
  Table as TableIcon,
  Layers,
  Sparkles,
  Wrench,
  Calendar,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { InventarisAset } from '../../types';
import { DeleteConfirmModal } from '../DeleteConfirmModal';
import { AsetVisualisasi } from '../AsetVisualisasi';
import { PemeliharaanAsetModule } from './PemeliharaanAsetModule';

export const InventarisModule: React.FC = () => {
  const {
    inventarisList,
    addInventarisAset,
    updateInventarisAset,
    deleteInventarisAset,
    openPrintReport,
    currentUser,
    settings,
    dueSoonMaintenanceCount,
    overdueMaintenanceCount,
  } = useApp();

  const [activeView, setActiveView] = useState<'tabel' | 'grafik' | 'pemeliharaan' | 'semua'>('semua');
  const [selectedAssetForSchedule, setSelectedAssetForSchedule] = useState<string | undefined>(undefined);
  const [search, setSearch] = useState('');
  const [selectedKategori, setSelectedKategori] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventarisAset | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<InventarisAset | null>(null);

  const canEdit =
    currentUser.role === 'admin' || currentUser.role === 'sekretaris' || currentUser.role === 'bendahara';

  const categories = [
    'Bangunan & Tanah',
    'Kendaraan Operasional',
    'Sound System & Peralatan Musik',
    'Mebel & Furnitur',
    'Alat Elektronik & IT',
    'Peralatan Sakramen & Ibadah',
  ] as const;

  const [formData, setFormData] = useState<Omit<InventarisAset, 'id'>>({
    kodeAset: `AST-${new Date().getFullYear()}-00${Math.floor(Math.random() * 90) + 10}`,
    namaBarang: '',
    kategori: 'Sound System & Peralatan Musik',
    tanggalPerolehan: new Date().toISOString().split('T')[0],
    kuantitas: 1,
    satuan: 'Unit',
    kondisi: 'Baik',
    nilaiAset: 0,
    lokasiPenyimpanan: 'Gereja Utama',
    penanggungJawab: 'Majelis Jemaat',
  });

  const handleOpenAdd = () => {
    setEditingItem(null);
    const prefix = settings.prefixKodeAset || 'AST';
    setFormData({
      kodeAset: `${prefix}-${new Date().getFullYear()}-00${Math.floor(Math.random() * 90) + 10}`,
      namaBarang: '',
      kategori: 'Sound System & Peralatan Musik',
      tanggalPerolehan: new Date().toISOString().split('T')[0],
      kuantitas: 1,
      satuan: 'Unit',
      kondisi: 'Baik',
      nilaiAset: 0,
      lokasiPenyimpanan: 'Gereja Utama',
      penanggungJawab: 'Majelis Jemaat',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: InventarisAset) => {
    setEditingItem(item);
    setFormData({ ...item });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingItem) {
      updateInventarisAset(editingItem.id, formData);
    } else {
      addInventarisAset(formData);
    }
    setIsModalOpen(false);
  };

  const filteredList = inventarisList.filter((item) => {
    const matchesSearch =
      item.namaBarang.toLowerCase().includes(search.toLowerCase()) ||
      item.kodeAset.toLowerCase().includes(search.toLowerCase()) ||
      item.lokasiPenyimpanan.toLowerCase().includes(search.toLowerCase());
    const matchesKategori = !selectedKategori || item.kategori === selectedKategori;
    return matchesSearch && matchesKategori;
  });

  const totalNilaiAset = filteredList.reduce(
    (sum, item) => sum + item.nilaiAset * item.kuantitas,
    0
  );

  return (
    <div className="space-y-6">
      <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800/80 shadow-lg backdrop-blur-md flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Package className="w-5 h-5" />
            </div>
            Pencatatan Inventaris & Valuasi Nilai Aset
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Aset Sarana Prasarana, Peralatan Sakramen, Sound System, dan Valuasi Nilai Perolehan
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {canEdit && (
            <button
              onClick={handleOpenAdd}
              className="flex items-center gap-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-all shadow-md shadow-amber-600/30 hover:-translate-y-0.5 active:translate-y-0"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Data Aset</span>
            </button>
          )}

          <button
            onClick={() => openPrintReport({ reportType: 'inventaris_aset' })}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-4 py-2.5 rounded-xl transition-all border border-slate-700 hover:-translate-y-0.5 active:translate-y-0"
          >
            <Printer className="w-4 h-4 text-emerald-400" />
            <span>Cetak Laporan Nilai Aset</span>
          </button>
        </div>
      </div>

      {/* View Switcher Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/80 p-2.5 rounded-2xl border border-slate-800 shadow-md">
        <div className="flex items-center gap-1.5 p-1 bg-slate-950 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveView('semua')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeView === 'semua'
                ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Tampilan Terpadu (Grafik &amp; Tabel)</span>
          </button>
          <button
            onClick={() => setActiveView('grafik')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeView === 'grafik'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Grafik &amp; Analisis Aset</span>
          </button>
          <button
            onClick={() => setActiveView('tabel')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeView === 'tabel'
                ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <TableIcon className="w-3.5 h-3.5" />
            <span>Tabel Data Inventaris</span>
          </button>
          <button
            onClick={() => setActiveView('pemeliharaan')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeView === 'pemeliharaan'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Wrench className="w-3.5 h-3.5" />
            <span>Jadwal Pemeliharaan &amp; Servis</span>
            {(overdueMaintenanceCount > 0 || dueSoonMaintenanceCount > 0) && (
              <span
                className={`px-1.5 py-0.2 rounded-full text-[9px] font-extrabold text-white ${
                  overdueMaintenanceCount > 0 ? 'bg-rose-500 animate-pulse' : 'bg-amber-500'
                }`}
              >
                {overdueMaintenanceCount > 0
                  ? `${overdueMaintenanceCount} Terlambat`
                  : `${dueSoonMaintenanceCount}`}
              </span>
            )}
          </button>
        </div>

        <div className="text-[11px] text-slate-400 px-2 font-medium">
          Total Valuasi: <strong className="text-amber-300 font-mono">Rp {totalNilaiAset.toLocaleString('id-ID')}</strong>
        </div>
      </div>

      {/* RENDER MODUL PEMELIHARAAN & SERVIS */}
      {activeView === 'pemeliharaan' && (
        <PemeliharaanAsetModule
          onOpenPrint={(reportType) => openPrintReport({ reportType: reportType as any })}
          selectedAssetIdForNewSchedule={selectedAssetForSchedule}
          onClearSelectedAsset={() => setSelectedAssetForSchedule(undefined)}
        />
      )}

      {/* RENDER GRAFIK ANALISIS */}
      {(activeView === 'grafik' || activeView === 'semua') && (
        <AsetVisualisasi
          inventarisList={inventarisList}
          onFilterKategori={(kat) => setSelectedKategori(kat)}
        />
      )}

      {/* RENDER TABEL DATA */}
      {(activeView === 'tabel' || activeView === 'semua') && (
        <div className="space-y-4">
          {/* Table Header Label for Unified View */}
          {activeView === 'semua' && (
            <div className="flex items-center justify-between pt-2">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <TableIcon className="w-4 h-4 text-cyan-400" />
                <span>Daftar Rincian Inventaris &amp; Nilai Buku Barang</span>
              </h3>
              <span className="text-xs text-slate-400 font-mono">
                {filteredList.length} dari {inventarisList.length} Item
              </span>
            </div>
          )}

          {/* Filter */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-900/80 p-4 rounded-2xl border border-slate-800/80 text-xs backdrop-blur-md">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Cari nama barang / kode aset / lokasi..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-xs"
              />
            </div>

            <div>
              <select
                value={selectedKategori}
                onChange={(e) => setSelectedKategori(e.target.value)}
                className="w-full py-2.5 px-3 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-xs"
              >
                <option value="" className="bg-slate-900">Semua Kategori Aset</option>
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
                    <th className="p-3.5">Kode Aset</th>
                    <th className="p-3.5">Nama Barang / Aset</th>
                    <th className="p-3.5">Kategori</th>
                    <th className="p-3.5 text-center">Jml</th>
                    <th className="p-3.5 text-center">Kondisi</th>
                    <th className="p-3.5 text-right">Nilai Perolehan (Rp)</th>
                    <th className="p-3.5 text-right">Total Subtotal (Rp)</th>
                    <th className="p-3.5">Lokasi / PJ</th>
                    {canEdit && <th className="p-3.5 text-center">Aksi</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredList.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="p-8 text-center text-slate-500">
                        Tidak ada data inventaris dan aset ditemukan.
                      </td>
                    </tr>
                  ) : (
                    filteredList.map((item, idx) => {
                      const subtotal = item.nilaiAset * item.kuantitas;
                      return (
                        <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="p-3.5 text-center font-mono text-slate-500">{idx + 1}</td>
                          <td className="p-3.5 font-mono text-[11px] font-bold text-amber-400">
                            {item.kodeAset}
                          </td>
                          <td className="p-3.5 font-bold text-slate-100">{item.namaBarang}</td>
                          <td className="p-3.5 font-medium text-slate-300">{item.kategori}</td>
                          <td className="p-3.5 text-center font-bold text-slate-200">
                            {item.kuantitas} {item.satuan}
                          </td>
                          <td className="p-3.5 text-center">
                            <span
                              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${
                                item.kondisi === 'Baik'
                                  ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                                  : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                              }`}
                            >
                              {item.kondisi}
                            </span>
                          </td>
                          <td className="p-3.5 text-right font-medium text-slate-300">
                            Rp {item.nilaiAset.toLocaleString('id-ID')}
                          </td>
                          <td className="p-3.5 text-right font-bold text-amber-300">
                            Rp {subtotal.toLocaleString('id-ID')}
                          </td>
                          <td className="p-3.5">
                            <div className="font-medium text-slate-200">{item.lokasiPenyimpanan}</div>
                            <div className="text-[10px] text-slate-500">PJ: {item.penanggungJawab}</div>
                          </td>
                          {canEdit && (
                            <td className="p-3.5 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  onClick={() => {
                                    setSelectedAssetForSchedule(item.id);
                                    setActiveView('pemeliharaan');
                                  }}
                                  className="p-1.5 text-amber-400 hover:bg-amber-500/10 rounded-lg transition-colors cursor-pointer"
                                  title="Jadwalkan Pemeliharaan / Servis"
                                >
                                  <Wrench className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleOpenEdit(item)}
                                  className="p-1.5 text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-colors cursor-pointer"
                                  title="Edit"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => setDeleteTarget(item)}
                                  className="p-2 sm:p-1.5 text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 rounded-lg transition-colors cursor-pointer flex items-center justify-center min-w-[36px] min-h-[36px]"
                                  title="Hapus"
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

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4 overflow-hidden animate-in fade-in duration-150">
          <div className="bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg border border-slate-800 text-slate-100 flex flex-col max-h-[92dvh] sm:max-h-[88vh] overflow-hidden my-auto">
            <div className="bg-slate-950 p-4 px-5 border-b border-slate-800 flex items-center justify-between shrink-0">
              <h3 className="font-bold text-sm text-slate-100">
                {editingItem ? 'Edit Data Aset' : 'Tambah Aset Inventaris Baru'}
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
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">Kode Aset</label>
                    <input
                      type="text"
                      required
                      value={formData.kodeAset || ''}
                      onChange={(e) => setFormData({ ...formData, kodeAset: e.target.value })}
                      className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-amber-300 font-mono font-bold focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">Kategori Aset</label>
                    <select
                      value={formData.kategori || categories[0]}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          kategori: e.target.value as InventarisAset['kategori'],
                        })
                      }
                      className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 font-medium focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    >
                      {categories.map((c) => (
                        <option key={c} value={c} className="bg-slate-900">
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Nama Barang / Aset</label>
                  <input
                    type="text"
                    required
                    value={formData.namaBarang || ''}
                    onChange={(e) => setFormData({ ...formData, namaBarang: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 font-bold focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">Jumlah Kuantitas</label>
                    <input
                      type="number"
                      min={1}
                      required
                      value={formData.kuantitas ?? 1}
                      onChange={(e) =>
                        setFormData({ ...formData, kuantitas: Number(e.target.value) })
                      }
                      className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 font-bold focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">Satuan (Unit/Set/Pcs)</label>
                    <input
                      type="text"
                      required
                      value={formData.satuan || ''}
                      onChange={(e) => setFormData({ ...formData, satuan: e.target.value })}
                      className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">Kondisi Barang</label>
                    <select
                      value={formData.kondisi || 'Baik'}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          kondisi: e.target.value as InventarisAset['kondisi'],
                        })
                      }
                      className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    >
                      <option value="Baik" className="bg-slate-900">Baik</option>
                      <option value="Rusak Ringan" className="bg-slate-900">Rusak Ringan</option>
                      <option value="Rusak Berat" className="bg-slate-900">Rusak Berat</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">Nilai Perolehan per Satuan (Rp)</label>
                    <input
                      type="number"
                      min={0}
                      step="any"
                      required
                      value={formData.nilaiAset ?? 0}
                      onChange={(e) =>
                        setFormData({ ...formData, nilaiAset: Number(e.target.value) })
                      }
                      className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-indigo-300 font-bold focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">Tanggal Perolehan</label>
                    <input
                      type="date"
                      required
                      value={formData.tanggalPerolehan || ''}
                      onChange={(e) =>
                        setFormData({ ...formData, tanggalPerolehan: e.target.value })
                      }
                      className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">Lokasi Penyimpanan</label>
                    <input
                      type="text"
                      required
                      value={formData.lokasiPenyimpanan || ''}
                      onChange={(e) =>
                        setFormData({ ...formData, lokasiPenyimpanan: e.target.value })
                      }
                      className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">Penanggung Jawab Aset</label>
                    <input
                      type="text"
                      required
                      value={formData.penanggungJawab || ''}
                      onChange={(e) =>
                        setFormData({ ...formData, penanggungJawab: e.target.value })
                      }
                      className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
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
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl font-bold shadow-md shadow-amber-600/30 cursor-pointer"
                >
                  Simpan Aset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Confirm Delete */}
      <DeleteConfirmModal
        isOpen={!!deleteTarget}
        title="Konfirmasi Hapus Aset Inventaris"
        itemName={
          deleteTarget
            ? `${deleteTarget.namaBarang} (${deleteTarget.kategori || 'Inventaris'})`
            : ''
        }
        description={
          deleteTarget
            ? `Apakah Anda yakin ingin menghapus aset "${deleteTarget.namaBarang}" dengan kode aset [${deleteTarget.kodeAset || '-'}] yang berlokasi di ${deleteTarget.lokasiPenyimpanan}? Data inventaris yang dihapus tidak dapat dipulihkan.`
            : 'Apakah Anda yakin ingin menghapus aset inventaris ini?'
        }
        onConfirm={async () => {
          if (deleteTarget) {
            await deleteInventarisAset(deleteTarget.id);
          }
        }}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
};
