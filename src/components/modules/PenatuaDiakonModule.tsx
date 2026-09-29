import React, { useState } from 'react';
import {
  Edit2,
  Filter,
  Plus,
  Printer,
  Search,
  Trash2,
  UserCheck,
  X,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { PenatuaDiakon } from '../../types';
import { DeleteConfirmModal } from '../DeleteConfirmModal';

export const PenatuaDiakonModule: React.FC = () => {
  const {
    penatuaDiakonList,
    addPenatuaDiakon,
    updatePenatuaDiakon,
    deletePenatuaDiakon,
    openPrintReport,
    currentUser,
    lingkunganList,
  } = useApp();

  const [search, setSearch] = useState('');
  const [selectedRayon, setSelectedRayon] = useState('');
  const [selectedJabatan, setSelectedJabatan] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PenatuaDiakon | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PenatuaDiakon | null>(null);

  const canEdit = currentUser.role === 'admin' || currentUser.role === 'sekretaris';

  // Dynamic Lingkungan synchronized from master settings & global state
  const activeLingkungans = (lingkunganList || []).filter((l) => l.status === 'Aktif');
  const nonActiveLingkungans = (lingkunganList || []).filter((l) => l.status === 'Nonaktif');

  // Fallback defaults if master list is initially empty
  const defaultFallbackLingkungan = [
    'Lingkungan I - Ebenezer',
    'Lingkungan II - Yerusalem',
    'Lingkungan III - Bethel',
    'Lingkungan IV - Sion',
    'Lingkungan V - Filadelfia',
  ];

  // Active names list
  const activeNames = activeLingkungans.length > 0
    ? activeLingkungans.map((l) => l.nama)
    : defaultFallbackLingkungan;

  // Other historical or legacy rayongs present in penatua/diakon list
  const otherRayons = Array.from(
    new Set(
      penatuaDiakonList
        .map((p) => p.rayon)
        .filter((r) => Boolean(r) && !activeNames.includes(r))
    )
  );

  // All combined distinct rayongs for filter & select
  const allLingkungs = Array.from(
    new Set([
      ...activeNames,
      ...nonActiveLingkungans.map((l) => l.nama),
      ...otherRayons,
    ])
  );

  const defaultRayon = activeNames[0] || (allLingkungs[0] || 'Lingkungan I');

  const [formData, setFormData] = useState<Omit<PenatuaDiakon, 'id'>>({
    nama: '',
    gelar: '',
    jabatan: 'Penatua',
    rayon: defaultRayon,
    tanggalPenahbisan: '',
    masaBakti: '2024 - 2029',
    status: 'Aktif',
    noHp: '',
    alamat: '',
  });

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormData({
      nama: '',
      gelar: '',
      jabatan: 'Penatua',
      rayon: defaultRayon,
      tanggalPenahbisan: new Date().toISOString().split('T')[0],
      masaBakti: '2024 - 2029',
      status: 'Aktif',
      noHp: '',
      alamat: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: PenatuaDiakon) => {
    setEditingItem(item);
    setFormData({
      nama: item.nama,
      gelar: item.gelar,
      jabatan: item.jabatan,
      rayon: item.rayon || defaultRayon,
      tanggalPenahbisan: item.tanggalPenahbisan,
      masaBakti: item.masaBakti,
      status: item.status,
      noHp: item.noHp,
      alamat: item.alamat,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingItem) {
      updatePenatuaDiakon(editingItem.id, formData);
    } else {
      addPenatuaDiakon(formData);
    }
    setIsModalOpen(false);
  };

  const filteredList = penatuaDiakonList.filter((item) => {
    const matchesSearch =
      item.nama.toLowerCase().includes(search.toLowerCase()) ||
      item.rayon.toLowerCase().includes(search.toLowerCase());
    const matchesRayon = !selectedRayon || item.rayon === selectedRayon;
    const matchesJabatan = !selectedJabatan || item.jabatan.includes(selectedJabatan);
    return matchesSearch && matchesRayon && matchesJabatan;
  });

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900/80 p-5 rounded-2xl border border-slate-800/80 shadow-lg backdrop-blur-md">
        <div>
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <UserCheck className="w-5 h-5" />
            </div>
            Data Kepengurusan Penatua & Diakon
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Daftar pelayan tahbisan Penatua dan Diakon Majelis Jemaat GKE
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {canEdit && (
            <button
              onClick={handleOpenAdd}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-all shadow-md shadow-indigo-600/30 hover:-translate-y-0.5 active:translate-y-0"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Penatua / Diakon</span>
            </button>
          )}

          <button
            onClick={() =>
              openPrintReport({
                reportType: 'penatua_diakon',
                selectedRayon: selectedRayon || undefined,
              })
            }
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-4 py-2.5 rounded-xl transition-all border border-slate-700 hover:-translate-y-0.5 active:translate-y-0"
          >
            <Printer className="w-4 h-4 text-emerald-400" />
            <span>Cetak Laporan Resmi</span>
          </button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-900/80 p-4 rounded-2xl border border-slate-800/80 text-xs backdrop-blur-md">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Cari nama atau lingkungan..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-xs"
          />
        </div>

        <div>
          <select
            value={selectedRayon}
            onChange={(e) => setSelectedRayon(e.target.value)}
            className="w-full py-2.5 px-3 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-xs"
          >
            <option value="" className="bg-slate-900">Semua Lingkungan / Sektor</option>
            {activeLingkungans.length > 0 ? (
              <optgroup label="Lingkungan Aktif" className="bg-slate-900 text-indigo-300 font-semibold">
                {activeLingkungans.map((ling) => (
                  <option key={ling.id} value={ling.nama} className="bg-slate-900 text-slate-200">
                    {ling.nama} ({ling.kode})
                  </option>
                ))}
              </optgroup>
            ) : (
              defaultFallbackLingkungan.map((r) => (
                <option key={r} value={r} className="bg-slate-900">
                  {r}
                </option>
              ))
            )}
            {nonActiveLingkungans.length > 0 && (
              <optgroup label="Lingkungan Nonaktif" className="bg-slate-900 text-slate-500">
                {nonActiveLingkungans.map((ling) => (
                  <option key={ling.id} value={ling.nama} className="bg-slate-900 text-slate-400">
                    {ling.nama} ({ling.kode} - Nonaktif)
                  </option>
                ))}
              </optgroup>
            )}
            {otherRayons.length > 0 && (
              <optgroup label="Lainnya" className="bg-slate-900 text-slate-500">
                {otherRayons.map((r) => (
                  <option key={r} value={r} className="bg-slate-900 text-slate-400">
                    {r}
                  </option>
                ))}
              </optgroup>
            )}
          </select>
        </div>

        <div>
          <select
            value={selectedJabatan}
            onChange={(e) => setSelectedJabatan(e.target.value)}
            className="w-full py-2.5 px-3 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-xs"
          >
            <option value="" className="bg-slate-900">Semua Jabatan</option>
            <option value="Penatua" className="bg-slate-900">Penatua</option>
            <option value="Diakon" className="bg-slate-900">Diakon</option>
          </select>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-slate-900/80 rounded-2xl border border-slate-800/80 overflow-hidden shadow-lg backdrop-blur-md">
        <div className="overflow-x-auto w-full max-w-full">
          <table className="w-full min-w-[750px] text-xs text-left text-slate-300">
            <thead className="bg-slate-950/80 text-slate-200 font-bold border-b border-slate-800 uppercase text-[11px] tracking-wider whitespace-nowrap">
              <tr>
                <th className="p-3.5 w-12 text-center">No</th>
                <th className="p-3.5">Nama & Gelar</th>
                <th className="p-3.5">Jabatan</th>
                <th className="p-3.5">Lingkungan / Sektor</th>
                <th className="p-3.5">Tgl Penahbisan</th>
                <th className="p-3.5">Masa Bakti</th>
                <th className="p-3.5 text-center">Status</th>
                <th className="p-3.5">No. HP</th>
                {canEdit && <th className="p-3.5 text-center">Aksi</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-500">
                    Tidak ada data penatua dan diakon ditemukan.
                  </td>
                </tr>
              ) : (
                filteredList.map((item, idx) => (
                  <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-3.5 text-center font-mono text-slate-500">{idx + 1}</td>
                    <td className="p-3.5 font-bold text-slate-100">
                      {item.nama}, {item.gelar}
                    </td>
                    <td className="p-3.5">
                      <span
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${
                          item.jabatan.includes('Penatua')
                            ? 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/30'
                            : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                        }`}
                      >
                        {item.jabatan}
                      </span>
                    </td>
                    <td className="p-3.5 font-medium text-slate-300">{item.rayon}</td>
                    <td className="p-3.5 text-slate-400 font-mono">{item.tanggalPenahbisan}</td>
                    <td className="p-3.5 text-slate-400">{item.masaBakti}</td>
                    <td className="p-3.5 text-center">
                      <span className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 font-medium text-[11px] border border-slate-700">
                        {item.status}
                      </span>
                    </td>
                    <td className="p-3.5 font-mono text-slate-400">{item.noHp}</td>
                    {canEdit && (
                      <td className="p-3.5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(item)}
                            className="p-1.5 text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-colors"
                            title="Edit Data"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(item)}
                            className="p-1.5 text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                            title="Hapus Data"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Form Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4 overflow-hidden animate-in fade-in duration-150">
          <div className="bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg border border-slate-800 text-slate-100 flex flex-col max-h-[92dvh] sm:max-h-[88vh] overflow-hidden my-auto">
            <div className="bg-slate-950 p-4 px-5 border-b border-slate-800 flex items-center justify-between shrink-0">
              <h3 className="font-bold text-sm text-slate-100">
                {editingItem ? 'Edit Penatua / Diakon' : 'Tambah Penatua / Diakon Baru'}
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
                  <label className="block font-semibold text-slate-300 mb-1">Nama Lengkap</label>
                  <input
                    type="text"
                    required
                    value={formData.nama || ''}
                    onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Gelar (e.g. S.E., M.Th)</label>
                  <input
                    type="text"
                    value={formData.gelar || ''}
                    onChange={(e) => setFormData({ ...formData, gelar: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Jabatan Tahbisan</label>
                  <select
                    value={formData.jabatan || 'Penatua'}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        jabatan: e.target.value as PenatuaDiakon['jabatan'],
                      })
                    }
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="Penatua" className="bg-slate-900">Penatua</option>
                    <option value="Diakon" className="bg-slate-900">Diakon</option>
                    <option value="Penatua Ketua Lingkungan" className="bg-slate-900">Penatua Ketua Lingkungan</option>
                    <option value="Penatua Sekretaris Lingkungan" className="bg-slate-900">Penatua Sekretaris Lingkungan</option>
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-semibold text-slate-300">Lingkungan / Sektor</label>
                    <span className="text-[10px] text-indigo-400 font-medium">Tersinkronisasi</span>
                  </div>
                  <select
                    value={formData.rayon || defaultRayon}
                    onChange={(e) => setFormData({ ...formData, rayon: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  >
                    {activeLingkungans.length > 0 ? (
                      <optgroup label="Lingkungan Aktif (Tersinkron Master)" className="bg-slate-900 text-indigo-300 font-semibold">
                        {activeLingkungans.map((ling) => (
                          <option key={ling.id} value={ling.nama} className="bg-slate-900 text-slate-100">
                            {ling.nama} ({ling.kode})
                          </option>
                        ))}
                      </optgroup>
                    ) : (
                      defaultFallbackLingkungan.map((r) => (
                        <option key={r} value={r} className="bg-slate-900">
                          {r}
                        </option>
                      ))
                    )}
                    {nonActiveLingkungans.length > 0 && (
                      <optgroup label="Lingkungan Nonaktif" className="bg-slate-900 text-slate-500">
                        {nonActiveLingkungans.map((ling) => (
                          <option key={ling.id} value={ling.nama} className="bg-slate-900 text-slate-400">
                            {ling.nama} ({ling.kode} - Nonaktif)
                          </option>
                        ))}
                      </optgroup>
                    )}
                    {otherRayons.length > 0 && (
                      <optgroup label="Lainnya / Riwayat Lama" className="bg-slate-900 text-slate-500">
                        {otherRayons.map((r) => (
                          <option key={r} value={r} className="bg-slate-900 text-slate-400">
                            {r}
                          </option>
                        ))}
                      </optgroup>
                    )}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Tgl Penahbisan</label>
                  <input
                    type="date"
                    required
                    value={formData.tanggalPenahbisan || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, tanggalPenahbisan: e.target.value })
                    }
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Masa Bakti</label>
                  <input
                    type="text"
                    required
                    value={formData.masaBakti || ''}
                    onChange={(e) => setFormData({ ...formData, masaBakti: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Status Pelayanan</label>
                  <select
                    value={formData.status || 'Aktif'}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        status: e.target.value as PenatuaDiakon['status'],
                      })
                    }
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="Aktif" className="bg-slate-900">Aktif</option>
                    <option value="Purnabakti" className="bg-slate-900">Purnabakti</option>
                    <option value="Pindah" className="bg-slate-900">Pindah</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">No. HP / WhatsApp</label>
                  <input
                    type="text"
                    value={formData.noHp || ''}
                    onChange={(e) => setFormData({ ...formData, noHp: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Alamat Tempat Tinggal</label>
                <textarea
                  rows={2}
                  value={formData.alamat || ''}
                  onChange={(e) => setFormData({ ...formData, alamat: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
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
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold shadow-md shadow-indigo-600/30 cursor-pointer"
              >
                Simpan Data
              </button>
            </div>
          </form>
        </div>
      </div>
    )}

      {/* Modal Konfirmasi Hapus Data Penatua / Diakon */}
      <DeleteConfirmModal
        isOpen={!!deleteTarget}
        title="Konfirmasi Hapus Data Pelayan"
        itemName={
          deleteTarget
            ? `${deleteTarget.nama}${deleteTarget.gelar ? ', ' + deleteTarget.gelar : ''} (${deleteTarget.jabatan} - ${deleteTarget.rayon})`
            : ''
        }
        description="Apakah Anda yakin ingin menghapus data pelayan Penatua / Diakon ini? Data yang telah dihapus akan hilang dari daftar pelayan dan laporan jemaat."
        onConfirm={async () => {
          if (deleteTarget) {
            await deletePenatuaDiakon(deleteTarget.id);
          }
        }}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
};
