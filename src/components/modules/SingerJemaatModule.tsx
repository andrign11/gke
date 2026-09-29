import React, { useState, useMemo, useRef } from 'react';
import {
  Mic2,
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  Printer,
  Download,
  Upload,
  UserCheck,
  CheckCircle2,
  XCircle,
  Phone,
  Music,
  MapPin,
  FileSpreadsheet,
  RefreshCw,
  Info,
  X,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { SingerJemaat } from '../../types';
import { DeleteConfirmModal } from '../DeleteConfirmModal';

const VOICE_TYPES = ['Sopran', 'Alto', 'Tenor', 'Bass', 'Campuran', 'Pemandu Umum'] as const;

export const SingerJemaatModule: React.FC = () => {
  const {
    singerJemaatList,
    addSingerJemaat,
    updateSingerJemaat,
    deleteSingerJemaat,
    batchAddSingerJemaat,
    lingkunganList,
    wargaJemaatList,
    currentUser,
    openPrintReport,
  } = useApp();

  const [search, setSearch] = useState('');
  const [filterRayon, setFilterRayon] = useState('semua');
  const [filterSuara, setFilterSuara] = useState('semua');
  const [filterStatus, setFilterStatus] = useState('semua');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<SingerJemaat | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SingerJemaat | null>(null);

  // Form State
  const [formNama, setFormNama] = useState('');
  const [formSuara, setFormSuara] = useState<string>('Pemandu Umum');
  const [formRayon, setFormRayon] = useState('');
  const [formNoHp, setFormNoHp] = useState('');
  const [formWargaId, setFormWargaId] = useState('');
  const [formStatus, setFormStatus] = useState<'Aktif' | 'Nonaktif'>('Aktif');
  const [formKeterangan, setFormKeterangan] = useState('');
  const [selectedWargaSearch, setSelectedWargaSearch] = useState('');

  // Import Modal State
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importText, setImportText] = useState('');
  const [importPreview, setImportPreview] = useState<Omit<SingerJemaat, 'id'>[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const canEdit = currentUser.role === 'admin' || currentUser.role === 'sekretaris';

  // Rayon options
  const rayonOptions = useMemo(() => {
    const list = new Set<string>();
    (lingkunganList || []).forEach((l) => {
      if (l.nama) list.add(l.nama);
    });
    (singerJemaatList || []).forEach((s) => {
      if (s.rayon) list.add(s.rayon);
    });
    return Array.from(list).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  }, [lingkunganList, singerJemaatList]);

  // Filtered List with unique id guarantee
  const filteredList = useMemo(() => {
    const raw = (singerJemaatList || []).filter((item) => {
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchName = item.nama?.toLowerCase().includes(q);
        const matchRayon = item.rayon?.toLowerCase().includes(q);
        const matchSuara = item.suara?.toLowerCase().includes(q);
        const matchHp = item.noHp?.toLowerCase().includes(q);
        const matchKet = item.keterangan?.toLowerCase().includes(q);
        if (!matchName && !matchRayon && !matchSuara && !matchHp && !matchKet) return false;
      }
      if (filterRayon !== 'semua' && item.rayon !== filterRayon) return false;
      if (filterSuara !== 'semua' && item.suara !== filterSuara) return false;
      if (filterStatus !== 'semua' && item.status !== filterStatus) return false;
      return true;
    });

    // Deduplicate by id to guarantee unique keys in list rendering
    const seenIds = new Set<string>();
    return raw.filter((item) => {
      if (!item.id || seenIds.has(item.id)) return false;
      seenIds.add(item.id);
      return true;
    });
  }, [singerJemaatList, search, filterRayon, filterSuara, filterStatus]);

  // Statistics
  const stats = useMemo(() => {
    const total = singerJemaatList?.length || 0;
    const aktif = (singerJemaatList || []).filter((s) => s.status === 'Aktif').length;
    const sopran = (singerJemaatList || []).filter((s) => s.suara === 'Sopran' && s.status === 'Aktif').length;
    const alto = (singerJemaatList || []).filter((s) => s.suara === 'Alto' && s.status === 'Aktif').length;
    const tenor = (singerJemaatList || []).filter((s) => s.suara === 'Tenor' && s.status === 'Aktif').length;
    const bass = (singerJemaatList || []).filter((s) => s.suara === 'Bass' && s.status === 'Aktif').length;
    return { total, aktif, sopran, alto, tenor, bass };
  }, [singerJemaatList]);

  // Warga candidates for quick picker
  const wargaCandidates = useMemo(() => {
    if (!selectedWargaSearch.trim()) return [];
    const q = selectedWargaSearch.toLowerCase();
    return (wargaJemaatList || [])
      .filter((w) => {
        if (w.statusKeanggotaan === 'Meninggal' || w.statusKeanggotaan === 'Pindah') return false;
        return (
          w.namaLengkap?.toLowerCase().includes(q) ||
          w.noKjj?.toLowerCase().includes(q) ||
          w.rayon?.toLowerCase().includes(q)
        );
      })
      .slice(0, 10);
  }, [wargaJemaatList, selectedWargaSearch]);

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormNama('');
    setFormSuara('Pemandu Umum');
    setFormRayon(rayonOptions[0] || '');
    setFormNoHp('');
    setFormWargaId('');
    setFormStatus('Aktif');
    setFormKeterangan('');
    setSelectedWargaSearch('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: SingerJemaat) => {
    setEditingItem(item);
    setFormNama(item.nama || '');
    setFormSuara(item.suara || 'Pemandu Umum');
    setFormRayon(item.rayon || '');
    setFormNoHp(item.noHp || '');
    setFormWargaId(item.wargaId || '');
    setFormStatus(item.status || 'Aktif');
    setFormKeterangan(item.keterangan || '');
    setSelectedWargaSearch('');
    setIsModalOpen(true);
  };

  const handleSelectWarga = (w: (typeof wargaJemaatList)[0]) => {
    setFormNama(w.namaLengkap || '');
    setFormRayon(w.rayon || w.sektorRayon || '');
    setFormNoHp(w.telepon || w.noHp || '');
    setFormWargaId(w.id || '');
    setSelectedWargaSearch('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNama.trim()) return;

    if (editingItem) {
      await updateSingerJemaat(editingItem.id, {
        nama: formNama.trim(),
        suara: formSuara,
        rayon: formRayon.trim(),
        noHp: formNoHp.trim(),
        wargaId: formWargaId || undefined,
        status: formStatus,
        keterangan: formKeterangan.trim(),
      });
    } else {
      await addSingerJemaat({
        nama: formNama.trim(),
        suara: formSuara,
        rayon: formRayon.trim(),
        noHp: formNoHp.trim(),
        wargaId: formWargaId || undefined,
        status: formStatus,
        keterangan: formKeterangan.trim(),
      });
    }

    setIsModalOpen(false);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    await deleteSingerJemaat(deleteTarget.id);
    setDeleteTarget(null);
  };

  // Export to CSV
  const handleExportCSV = () => {
    const headers = ['No', 'Nama Singer', 'Jenis Suara', 'Lingkungan/Rayon', 'Nomor HP', 'Status', 'Keterangan'];
    const rows = filteredList.map((s, idx) => [
      idx + 1,
      `"${(s.nama || '').replace(/"/g, '""')}"`,
      `"${s.suara || '-'}"`,
      `"${(s.rayon || '-').replace(/"/g, '""')}"`,
      `"${s.noHp || '-'}"`,
      `"${s.status || 'Aktif'}"`,
      `"${(s.keterangan || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `data-singer-jemaat-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Parse Text / CSV for Import
  const parseImportData = (rawText: string) => {
    const lines = rawText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    const items: Omit<SingerJemaat, 'id'>[] = [];

    lines.forEach((line, idx) => {
      // Skip header if line matches common header words
      if (idx === 0 && /nama|singer|suara|rayon|lingkungan/i.test(line)) {
        return;
      }
      // Split by tab, comma or semicolon
      let cols = line.split('\t');
      if (cols.length === 1) cols = line.split(',');
      if (cols.length === 1) cols = line.split(';');

      const nama = (cols[0] || '').replace(/^["']|["']$/g, '').trim();
      if (!nama) return;

      const suara = (cols[1] || 'Pemandu Umum').replace(/^["']|["']$/g, '').trim();
      const rayon = (cols[2] || '').replace(/^["']|["']$/g, '').trim();
      const noHp = (cols[3] || '').replace(/^["']|["']$/g, '').trim();
      const statusRaw = (cols[4] || 'Aktif').replace(/^["']|["']$/g, '').trim();
      const keterangan = (cols[5] || '').replace(/^["']|["']$/g, '').trim();

      const status: 'Aktif' | 'Nonaktif' = /nonaktif|tidak|pensiun|off/i.test(statusRaw) ? 'Nonaktif' : 'Aktif';

      items.push({
        nama,
        suara: VOICE_TYPES.includes(suara as any) ? suara : 'Pemandu Umum',
        rayon,
        noHp,
        status,
        keterangan,
      });
    });

    setImportPreview(items);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setImportText(content);
        parseImportData(content);
      }
    };
    reader.readAsText(file);
  };

  const handleExecuteImport = async () => {
    if (importPreview.length === 0) return;
    await batchAddSingerJemaat(importPreview);
    setIsImportModalOpen(false);
    setImportText('');
    setImportPreview([]);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header & Title */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shrink-0">
              <Mic2 className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                Data Singer &amp; Pemandu Lagu Jemaat
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/20 font-medium">
                  {stats.total} Terdata
                </span>
              </h1>
              <p className="text-slate-400 text-xs mt-0.5">
                Master data pemandu pujian &amp; kantoria jemaat. Terhubung langsung dengan Generator Jadwal Ibadah.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-medium border border-slate-700 transition"
              title="Unduh file CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Ekspor CSV</span>
            </button>

            {canEdit && (
              <>
                <button
                  onClick={() => setIsImportModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-medium border border-slate-700 transition"
                  title="Impor dari Excel / CSV"
                >
                  <Upload className="w-3.5 h-3.5 text-blue-400" />
                  <span>Impor Data</span>
                </button>

                <button
                  onClick={handleOpenAdd}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-semibold shadow-sm transition"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah Singer Baru</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Integration Notification Banner */}
        <div className="mt-5 p-3 rounded-xl bg-purple-950/30 border border-purple-800/40 text-xs text-purple-200 flex items-start gap-2.5">
          <Info className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <span className="font-semibold text-purple-100">Aturan Sinkronisasi Generator Jadwal:</span>{' '}
            Generator Jadwal Ibadah mengambil petugas singer <b>hanya</b> dari daftar Singer Jemaat ini.
            Jika halaman ini belum memiliki data, kolom singer pada jadwal baru akan <b>dikosongkan</b> secara otomatis.
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-4">
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3">
            <span className="text-[11px] text-slate-400 block font-medium">Total Singer</span>
            <div className="text-lg font-bold text-slate-100 mt-0.5">{stats.total}</div>
          </div>
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3">
            <span className="text-[11px] text-emerald-400 block font-medium">Status Aktif</span>
            <div className="text-lg font-bold text-emerald-300 mt-0.5">{stats.aktif}</div>
          </div>
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3">
            <span className="text-[11px] text-purple-400 block font-medium">Sopran</span>
            <div className="text-lg font-bold text-purple-300 mt-0.5">{stats.sopran}</div>
          </div>
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3">
            <span className="text-[11px] text-blue-400 block font-medium">Alto</span>
            <div className="text-lg font-bold text-blue-300 mt-0.5">{stats.alto}</div>
          </div>
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3">
            <span className="text-[11px] text-amber-400 block font-medium">Tenor</span>
            <div className="text-lg font-bold text-amber-300 mt-0.5">{stats.tenor}</div>
          </div>
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3">
            <span className="text-[11px] text-rose-400 block font-medium">Bass</span>
            <div className="text-lg font-bold text-rose-300 mt-0.5">{stats.bass}</div>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari nama singer, telepon, atau keterangan..."
            value={search || ''}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto flex-wrap">
          <select
            value={filterRayon || 'semua'}
            onChange={(e) => setFilterRayon(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
          >
            <option value="semua">Semua Lingkungan / Rayon</option>
            {rayonOptions.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>

          <select
            value={filterSuara || 'semua'}
            onChange={(e) => setFilterSuara(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
          >
            <option value="semua">Semua Jenis Suara</option>
            {VOICE_TYPES.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>

          <select
            value={filterStatus || 'semua'}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
          >
            <option value="semua">Semua Status</option>
            <option value="Aktif">Aktif</option>
            <option value="Nonaktif">Nonaktif</option>
          </select>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        {filteredList.length === 0 ? (
          <div className="p-12 text-center">
            <Mic2 className="w-12 h-12 text-slate-600 mx-auto mb-3 stroke-[1.5]" />
            <h3 className="text-base font-semibold text-slate-300">Belum Ada Data Singer Jemaat</h3>
            <p className="text-slate-500 text-xs mt-1 max-w-md mx-auto">
              {singerJemaatList.length === 0
                ? 'Data Singer Jemaat masih kosong. Generator jadwal tidak akan mengisi kolom singer secara otomatis sampai Anda mendaftarkan singer di sini.'
                : 'Tidak ada data singer yang cocok dengan filter pencarian.'}
            </p>
            {canEdit && singerJemaatList.length === 0 && (
              <button
                onClick={handleOpenAdd}
                className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-semibold transition"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Singer Sekarang</span>
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/70 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="p-3.5 w-12 text-center">No</th>
                  <th className="p-3.5">Nama Singer / Pemandu</th>
                  <th className="p-3.5">Jenis Suara</th>
                  <th className="p-3.5">Lingkungan / Rayon</th>
                  <th className="p-3.5">Kontak (HP)</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5">Keterangan</th>
                  {canEdit && <th className="p-3.5 text-right w-24">Aksi</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredList.map((item, idx) => {
                  const isAktif = item.status !== 'Nonaktif';
                  const rowKey = item.id ? `${item.id}-${idx}` : `singer-${idx}`;
                  return (
                    <tr key={rowKey} className="hover:bg-slate-800/40 transition">
                      <td className="p-3.5 text-center text-slate-500 font-mono">{idx + 1}</td>
                      <td className="p-3.5">
                        <div className="font-semibold text-slate-100 flex items-center gap-2">
                          <Mic2 className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                          <span>{item.nama}</span>
                        </div>
                      </td>
                      <td className="p-3.5">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-[11px] font-medium bg-purple-950/40 text-purple-300 border border-purple-800/40">
                          {item.suara || 'Pemandu Umum'}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <div className="flex items-center gap-1.5 text-slate-300">
                          <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
                          <span>{item.rayon || '-'}</span>
                        </div>
                      </td>
                      <td className="p-3.5">
                        {item.noHp ? (
                          <a
                            href={`https://wa.me/${item.noHp.replace(/[^0-9]/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-emerald-400 hover:text-emerald-300 hover:underline"
                          >
                            <Phone className="w-3 h-3" />
                            <span>{item.noHp}</span>
                          </a>
                        ) : (
                          <span className="text-slate-600">-</span>
                        )}
                      </td>
                      <td className="p-3.5">
                        {isAktif ? (
                          <span className="inline-flex items-center gap-1 text-emerald-400 text-[11px] font-medium">
                            <CheckCircle2 className="w-3 h-3" />
                            Aktif
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-slate-500 text-[11px] font-medium">
                            <XCircle className="w-3 h-3" />
                            Nonaktif
                          </span>
                        )}
                      </td>
                      <td className="p-3.5 text-slate-400 max-w-xs truncate">{item.keterangan || '-'}</td>
                      {canEdit && (
                        <td className="p-3.5 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleOpenEdit(item)}
                              className="p-1.5 text-slate-400 hover:text-purple-400 hover:bg-slate-800 rounded-lg transition"
                              title="Ubah Data"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setDeleteTarget(item)}
                              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition"
                              title="Hapus Data"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center">
                  <Mic2 className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-100">
                  {editingItem ? 'Edit Data Singer Jemaat' : 'Tambah Singer Jemaat Baru'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-200 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto">
              {/* Quick Pick from Warga Jemaat */}
              {!editingItem && (
                <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 space-y-2">
                  <label className="text-[11px] font-semibold text-slate-300 block">
                    Pilih Cepat dari Data Warga Jemaat (Opsional):
                  </label>
                  <input
                    type="text"
                    placeholder="Ketik nama warga jemaat..."
                    value={selectedWargaSearch || ''}
                    onChange={(e) => setSelectedWargaSearch(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500"
                  />
                  {wargaCandidates.length > 0 && (
                    <div className="max-h-36 overflow-y-auto divide-y divide-slate-800 rounded-lg border border-slate-800 bg-slate-900">
                      {wargaCandidates.map((w, wIdx) => (
                        <button
                          key={`${w.id || 'warga'}-${wIdx}`}
                          type="button"
                          onClick={() => handleSelectWarga(w)}
                          className="w-full text-left px-3 py-2 hover:bg-purple-950/40 flex items-center justify-between text-xs transition"
                        >
                          <div>
                            <div className="font-semibold text-slate-200">{w.namaLengkap}</div>
                            <div className="text-[10px] text-slate-400">
                              {w.rayon || w.sektorRayon || 'Tanpa Rayon'} • No KJJ: {w.noKjj || '-'}
                            </div>
                          </div>
                          <span className="text-[10px] text-purple-400 font-semibold">Pilih</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Nama Singer */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Nama Lengkap Singer / Pemandu Lagu <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Sdri. Debora atau Ibu Martha"
                  value={formNama || ''}
                  onChange={(e) => setFormNama(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500"
                />
              </div>

              {/* Jenis Suara & Status */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Jenis Suara / Posisi</label>
                  <select
                    value={formSuara || 'Pemandu Umum'}
                    onChange={(e) => setFormSuara(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-purple-500"
                  >
                    {VOICE_TYPES.map((v) => (
                      <option key={v} value={v}>
                        {v}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Status Keaktifan</label>
                  <select
                    value={formStatus || 'Aktif'}
                    onChange={(e) => setFormStatus(e.target.value as 'Aktif' | 'Nonaktif')}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-purple-500"
                  >
                    <option value="Aktif">Aktif (Bisa Ditugaskan)</option>
                    <option value="Nonaktif">Nonaktif</option>
                  </select>
                </div>
              </div>

              {/* Lingkungan / Rayon & Kontak */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Lingkungan / Rayon</label>
                  <input
                    type="text"
                    placeholder="Contoh: Lingkungan 1"
                    value={formRayon || ''}
                    onChange={(e) => setFormRayon(e.target.value)}
                    list="rayon-suggestions"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500"
                  />
                  <datalist id="rayon-suggestions">
                    {rayonOptions.map((r) => (
                      <option key={r} value={r} />
                    ))}
                  </datalist>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Nomor WhatsApp / HP</label>
                  <input
                    type="text"
                    placeholder="081234567890"
                    value={formNoHp || ''}
                    onChange={(e) => setFormNoHp(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              {/* Keterangan */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Keterangan / Catatan Tambahan</label>
                <textarea
                  rows={2}
                  placeholder="Contoh: Pemandu vokal ibadah kategorial, solois, dll"
                  value={formKeterangan || ''}
                  onChange={(e) => setFormKeterangan(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-semibold transition"
                >
                  {editingItem ? 'Simpan Perubahan' : 'Tambahkan Singer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-purple-400" />
                <h3 className="text-sm font-bold text-slate-100">Impor Data Singer Jemaat</h3>
              </div>
              <button
                onClick={() => setIsImportModalOpen(false)}
                className="text-slate-400 hover:text-slate-200 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto">
              <div className="text-xs text-slate-300 bg-slate-950/60 p-3 rounded-xl border border-slate-800 space-y-1">
                <p className="font-semibold text-slate-100">Format kolom yang didukung (CSV atau Paste Tabel):</p>
                <p className="text-slate-400 font-mono text-[11px]">
                  Nama Singer [Tab/Koma] Jenis Suara [Tab/Koma] Lingkungan/Rayon [Tab/Koma] No HP [Tab/Koma] Status
                </p>
              </div>

              <div>
                <input
                  type="file"
                  accept=".csv,.txt,.tsv"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-medium border border-slate-700 transition"
                >
                  <Upload className="w-3.5 h-3.5 text-blue-400" />
                  <span>Pilih File CSV / TXT</span>
                </button>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Atau Tempel (Paste) Teks / Tabel di sini:
                </label>
                <textarea
                  rows={6}
                  placeholder={`Contoh:\nSdri. Sarah\tSopran\tLingkungan 1\t08123456789\tAktif\nBpk. Lukas\tTenor\tLingkungan 2\t08129876543\tAktif`}
                  value={importText || ''}
                  onChange={(e) => {
                    setImportText(e.target.value);
                    parseImportData(e.target.value);
                  }}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-slate-100 placeholder-slate-600 focus:outline-none focus:border-purple-500"
                />
              </div>

              {importPreview.length > 0 && (
                <div>
                  <span className="text-xs font-semibold text-emerald-400 block mb-1">
                    Pratinjau: {importPreview.length} data siap diimpor
                  </span>
                  <div className="max-h-48 overflow-y-auto border border-slate-800 rounded-xl bg-slate-950">
                    <table className="w-full text-left text-[11px]">
                      <thead className="bg-slate-900 border-b border-slate-800 text-slate-400">
                        <tr>
                          <th className="p-2">Nama</th>
                          <th className="p-2">Suara</th>
                          <th className="p-2">Rayon</th>
                          <th className="p-2">HP</th>
                          <th className="p-2">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/50">
                        {importPreview.slice(0, 15).map((p, idx) => (
                          <tr key={idx} className="text-slate-200">
                            <td className="p-2 font-medium">{p.nama}</td>
                            <td className="p-2">{p.suara}</td>
                            <td className="p-2">{p.rayon || '-'}</td>
                            <td className="p-2">{p.noHp || '-'}</td>
                            <td className="p-2 text-emerald-400">{p.status}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {importPreview.length > 15 && (
                      <div className="p-2 text-center text-[10px] text-slate-500 bg-slate-900">
                        Dan {importPreview.length - 15} data lainnya...
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsImportModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium transition"
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={importPreview.length === 0}
                  onClick={handleExecuteImport}
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold transition"
                >
                  Impor Sekarang ({importPreview.length})
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {deleteTarget && (
        <DeleteConfirmModal
          isOpen={Boolean(deleteTarget)}
          title="Hapus Data Singer Jemaat"
          itemName={`${deleteTarget.nama} (${deleteTarget.suara || 'Singer'}, ${deleteTarget.rayon || 'Semua Rayon'})`}
          description={`Apakah Anda yakin ingin menghapus "${deleteTarget.nama}" dari daftar singer jemaat? Tindakan ini tidak dapat dibatalkan.`}
          onConfirm={handleConfirmDelete}
          onClose={() => setDeleteTarget(null)}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
};
