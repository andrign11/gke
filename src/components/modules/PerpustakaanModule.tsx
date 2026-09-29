import React, { useState } from 'react';
import {
  BookOpen,
  BookMarked,
  FileText,
  Plus,
  Search,
  Printer,
  Edit2,
  Trash2,
  X,
  Download,
  ExternalLink,
  CheckCircle2,
  Clock,
  AlertCircle,
  FolderOpen,
  Bookmark,
  Share2,
  ArrowDownToLine,
  Layers,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { MateriPengajaran, KatalogBuku, PeminjamanBuku } from '../../types';
import { DeleteConfirmModal } from '../DeleteConfirmModal';

export const PerpustakaanModule: React.FC = () => {
  const {
    materiPengajaranList,
    addMateriPengajaran,
    updateMateriPengajaran,
    deleteMateriPengajaran,
    katalogBukuList,
    addKatalogBuku,
    updateKatalogBuku,
    deleteKatalogBuku,
    peminjamanBukuList,
    addPeminjamanBuku,
    updatePeminjamanBuku,
    deletePeminjamanBuku,
    kembalikanBuku,
    wargaJemaatList,
    currentUser,
    openPrintReport,
  } = useApp();

  const [activeSubTab, setActiveSubTab] = useState<'materi' | 'katalog' | 'peminjaman'>('materi');
  const [search, setSearch] = useState('');
  const [filterKategori, setFilterKategori] = useState('');
  const [filterStatusPinjam, setFilterStatusPinjam] = useState('');

  // Modals
  const [isMateriModalOpen, setIsMateriModalOpen] = useState(false);
  const [editingMateri, setEditingMateri] = useState<MateriPengajaran | null>(null);
  const [deleteMateriTarget, setDeleteMateriTarget] = useState<MateriPengajaran | null>(null);

  const [isBukuModalOpen, setIsBukuModalOpen] = useState(false);
  const [editingBuku, setEditingBuku] = useState<KatalogBuku | null>(null);
  const [deleteBukuTarget, setDeleteBukuTarget] = useState<KatalogBuku | null>(null);

  const [isPinjamModalOpen, setIsPinjamModalOpen] = useState(false);
  const [editingPinjam, setEditingPinjam] = useState<PeminjamanBuku | null>(null);
  const [deletePinjamTarget, setDeletePinjamTarget] = useState<PeminjamanBuku | null>(null);

  // Detail Modal for Previewing Material
  const [previewMateri, setPreviewMateri] = useState<MateriPengajaran | null>(null);

  const canEdit =
    currentUser.role === 'admin' ||
    currentUser.role === 'pendeta' ||
    currentUser.role === 'sekretaris' ||
    currentUser.role === 'majelis';

  // Form State: Materi
  const [materiForm, setMateriForm] = useState<Omit<MateriPengajaran, 'id'>>({
    judul: '',
    kategori: 'Katekisasi',
    penyusun: currentUser?.namaLengkap || 'Majelis Jemaat GKE',
    tanggalTerbit: new Date().toISOString().split('T')[0],
    targetAudiens: 'Semua Warga Jemaat',
    ringkasan: '',
    isiMateri: '',
    fileUrl: '',
    tipeFile: 'PDF',
    ayatAlkitabReferensi: '',
    unduhanCount: 0,
  });

  // Form State: Buku
  const [bukuForm, setBukuForm] = useState<Omit<KatalogBuku, 'id'>>({
    kodeBuku: `BK-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
    judulBuku: '',
    pengarang: '',
    penerbit: '',
    tahunTerbit: String(new Date().getFullYear()),
    kategori: 'Teologi & Doktrin',
    lokasiRak: 'Rak A - Teologi',
    jumlahTotal: 2,
    jumlahTersedia: 2,
    deskripsi: '',
    coverUrl: '',
    status: 'Tersedia',
  });

  // Form State: Peminjaman
  const [pinjamForm, setPinjamForm] = useState<Omit<PeminjamanBuku, 'id'>>({
    bukuId: '',
    kodeBuku: '',
    judulBuku: '',
    namaPeminjam: '',
    noKontak: '',
    rayonPeminjam: '',
    tanggalPinjam: new Date().toISOString().split('T')[0],
    tanggalJatuhTempo: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: 'Dipinjam',
    catatan: '',
    petugas: currentUser?.namaLengkap || 'Petugas Perpustakaan',
  });

  // Category constants
  const kategoriMateriOptions = [
    'Katekisasi',
    'Pemahaman Alkitab (PA)',
    'Bahan Sekolah Minggu',
    'Modul Pemuda',
    'Teologi & Liturgi',
    'Khotbah & Renungan Tematik',
    'Bimbingan Pranikah & Konseling',
  ];

  const kategoriBukuOptions = [
    'Teologi & Doktrin',
    'Biblika & Tafsir Alkitab',
    'Pelayanan Pastoral & Konseling',
    'Pendidikan Agama Kristen (PAK)',
    'Sejarah Gereja & Tokoh Misi',
    'Keluarga Kristen & Pernikahan',
    'Kidung & Musik Gerejawi',
    'Pengembangan Diri Rohani',
  ];

  // Helper to open Add Materi
  const handleOpenAddMateri = () => {
    setEditingMateri(null);
    setMateriForm({
      judul: '',
      kategori: 'Katekisasi',
      penyusun: currentUser?.namaLengkap || 'Majelis Jemaat GKE',
      tanggalTerbit: new Date().toISOString().split('T')[0],
      targetAudiens: 'Semua Warga Jemaat',
      ringkasan: '',
      isiMateri: '',
      fileUrl: '',
      tipeFile: 'PDF',
      ayatAlkitabReferensi: '',
      unduhanCount: 0,
    });
    setIsMateriModalOpen(true);
  };

  const handleOpenEditMateri = (item: MateriPengajaran) => {
    setEditingMateri(item);
    setMateriForm({
      judul: item.judul,
      kategori: item.kategori,
      penyusun: item.penyusun,
      tanggalTerbit: item.tanggalTerbit,
      targetAudiens: item.targetAudiens || 'Semua Warga Jemaat',
      ringkasan: item.ringkasan || '',
      isiMateri: item.isiMateri || '',
      fileUrl: item.fileUrl || '',
      tipeFile: item.tipeFile || 'PDF',
      ayatAlkitabReferensi: item.ayatAlkitabReferensi || '',
      unduhanCount: item.unduhanCount || 0,
    });
    setIsMateriModalOpen(true);
  };

  const handleSaveMateri = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!materiForm.judul.trim()) return;

    if (editingMateri) {
      await updateMateriPengajaran(editingMateri.id, materiForm);
    } else {
      await addMateriPengajaran(materiForm);
    }
    setIsMateriModalOpen(false);
  };

  // Helper to open Add Buku
  const handleOpenAddBuku = () => {
    setEditingBuku(null);
    setBukuForm({
      kodeBuku: `BK-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      judulBuku: '',
      pengarang: '',
      penerbit: '',
      tahunTerbit: String(new Date().getFullYear()),
      kategori: 'Teologi & Doktrin',
      lokasiRak: 'Rak A - Teologi',
      jumlahTotal: 2,
      jumlahTersedia: 2,
      deskripsi: '',
      coverUrl: '',
      status: 'Tersedia',
    });
    setIsBukuModalOpen(true);
  };

  const handleOpenEditBuku = (item: KatalogBuku) => {
    setEditingBuku(item);
    setBukuForm({
      kodeBuku: item.kodeBuku,
      judulBuku: item.judulBuku,
      pengarang: item.pengarang,
      penerbit: item.penerbit || '',
      tahunTerbit: item.tahunTerbit || '',
      kategori: item.kategori,
      lokasiRak: item.lokasiRak || '',
      jumlahTotal: item.jumlahTotal,
      jumlahTersedia: item.jumlahTersedia,
      deskripsi: item.deskripsi || '',
      coverUrl: item.coverUrl || '',
      status: item.status,
    });
    setIsBukuModalOpen(true);
  };

  const handleSaveBuku = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bukuForm.judulBuku.trim()) return;

    if (editingBuku) {
      await updateKatalogBuku(editingBuku.id, bukuForm);
    } else {
      await addKatalogBuku(bukuForm);
    }
    setIsBukuModalOpen(false);
  };

  // Helper to open Pinjam Modal
  const handleOpenPinjamModal = (buku?: KatalogBuku) => {
    setEditingPinjam(null);
    setPinjamForm({
      bukuId: buku ? buku.id : (katalogBukuList[0]?.id || ''),
      kodeBuku: buku ? buku.kodeBuku : (katalogBukuList[0]?.kodeBuku || ''),
      judulBuku: buku ? buku.judulBuku : (katalogBukuList[0]?.judulBuku || ''),
      namaPeminjam: '',
      noKontak: '',
      rayonPeminjam: '',
      tanggalPinjam: new Date().toISOString().split('T')[0],
      tanggalJatuhTempo: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'Dipinjam',
      catatan: '',
      petugas: currentUser?.namaLengkap || 'Petugas Perpustakaan',
    });
    setIsPinjamModalOpen(true);
  };

  const handleSavePinjam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pinjamForm.namaPeminjam.trim() || !pinjamForm.bukuId) return;

    if (editingPinjam) {
      await updatePeminjamanBuku(editingPinjam.id, pinjamForm);
    } else {
      await addPeminjamanBuku(pinjamForm);
    }
    setIsPinjamModalOpen(false);
  };

  // Filtered lists
  const filteredMateri = materiPengajaranList.filter((m) => {
    const matchSearch =
      m.judul.toLowerCase().includes(search.toLowerCase()) ||
      m.penyusun.toLowerCase().includes(search.toLowerCase()) ||
      (m.ringkasan && m.ringkasan.toLowerCase().includes(search.toLowerCase())) ||
      (m.ayatAlkitabReferensi && m.ayatAlkitabReferensi.toLowerCase().includes(search.toLowerCase()));
    const matchKategori = !filterKategori || m.kategori === filterKategori;
    return matchSearch && matchKategori;
  });

  const filteredBuku = katalogBukuList.filter((b) => {
    const matchSearch =
      b.judulBuku.toLowerCase().includes(search.toLowerCase()) ||
      b.pengarang.toLowerCase().includes(search.toLowerCase()) ||
      b.kodeBuku.toLowerCase().includes(search.toLowerCase()) ||
      (b.penerbit && b.penerbit.toLowerCase().includes(search.toLowerCase()));
    const matchKategori = !filterKategori || b.kategori === filterKategori;
    return matchSearch && matchKategori;
  });

  const filteredPinjam = peminjamanBukuList.filter((p) => {
    const matchSearch =
      p.judulBuku.toLowerCase().includes(search.toLowerCase()) ||
      p.namaPeminjam.toLowerCase().includes(search.toLowerCase()) ||
      p.kodeBuku.toLowerCase().includes(search.toLowerCase()) ||
      (p.rayonPeminjam && p.rayonPeminjam.toLowerCase().includes(search.toLowerCase()));
    const matchStatus = !filterStatusPinjam || p.status === filterStatusPinjam;
    return matchSearch && matchStatus;
  });

  // Calculate statistics
  const totalMateri = materiPengajaranList.length;
  const totalJudulBuku = katalogBukuList.length;
  const totalEksemplar = katalogBukuList.reduce((acc, curr) => acc + (curr.jumlahTotal || 0), 0);
  const totalBukuDipinjam = peminjamanBukuList.filter((p) => p.status === 'Dipinjam').length;

  return (
    <div id="perpustakaan-module" className="space-y-6">
      {/* Header Banner */}
      <div
        id="perpustakaan-header"
        className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4"
      >
        <div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                Perpustakaan & Bahan Pengajaran Rohani
              </h1>
              <p className="text-sm text-slate-500 mt-0.5">
                Katalog buku rohani, sirkulasi peminjaman jemaat, dan arsip modul pengajaran iman.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            id="btn-print-perpustakaan"
            onClick={() => openPrintReport('perpustakaan')}
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-sm rounded-xl transition-colors flex items-center gap-2"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Rekapitulasi</span>
          </button>

          {canEdit && (
            <>
              {activeSubTab === 'materi' && (
                <button
                  id="btn-add-materi"
                  onClick={handleOpenAddMateri}
                  className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm rounded-xl transition-colors shadow-xs flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah Bahan Pengajaran</span>
                </button>
              )}
              {activeSubTab === 'katalog' && (
                <button
                  id="btn-add-buku"
                  onClick={handleOpenAddBuku}
                  className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm rounded-xl transition-colors shadow-xs flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah Koleksi Buku</span>
                </button>
              )}
              {activeSubTab === 'peminjaman' && (
                <button
                  id="btn-add-pinjam"
                  onClick={() => handleOpenPinjamModal()}
                  className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm rounded-xl transition-colors shadow-xs flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Catat Peminjaman Baru</span>
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Bahan & Modul Rohani</p>
              <h3 className="text-xl font-bold text-slate-900 mt-0.5">{totalMateri} Judul</h3>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <BookMarked className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Judul Buku Terdaftar</p>
              <h3 className="text-xl font-bold text-slate-900 mt-0.5">{totalJudulBuku} Buku</h3>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Total Eksemplar Fisik</p>
              <h3 className="text-xl font-bold text-slate-900 mt-0.5">{totalEksemplar} Eks</h3>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Buku Sedang Dipinjam</p>
              <h3 className="text-xl font-bold text-slate-900 mt-0.5">{totalBukuDipinjam} Peminjam</h3>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Switcher & Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            <button
              id="subtab-materi"
              onClick={() => {
                setActiveSubTab('materi');
                setFilterKategori('');
              }}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all whitespace-nowrap flex items-center gap-2 ${
                activeSubTab === 'materi'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Bahan Pengajaran Rohani ({materiPengajaranList.length})</span>
            </button>

            <button
              id="subtab-katalog"
              onClick={() => {
                setActiveSubTab('katalog');
                setFilterKategori('');
              }}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all whitespace-nowrap flex items-center gap-2 ${
                activeSubTab === 'katalog'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Katalog Buku ({katalogBukuList.length})</span>
            </button>

            <button
              id="subtab-peminjaman"
              onClick={() => {
                setActiveSubTab('peminjaman');
                setFilterStatusPinjam('');
              }}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all whitespace-nowrap flex items-center gap-2 ${
                activeSubTab === 'peminjaman'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>Sirkulasi & Peminjaman ({peminjamanBukuList.length})</span>
            </button>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={
                activeSubTab === 'materi'
                  ? 'Cari judul materi, penyusun, ayat Alkitab...'
                  : activeSubTab === 'katalog'
                  ? 'Cari judul buku, penulis, kode buku...'
                  : 'Cari peminjam, buku, atau rayon...'
              }
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 font-medium placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-2xs"
            />
          </div>

          {activeSubTab === 'materi' && (
            <select
              value={filterKategori}
              onChange={(e) => setFilterKategori(e.target.value)}
              className="w-full sm:w-56 px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-2xs"
            >
              <option value="">Semua Kategori Pengajaran</option>
              {kategoriMateriOptions.map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </select>
          )}

          {activeSubTab === 'katalog' && (
            <select
              value={filterKategori}
              onChange={(e) => setFilterKategori(e.target.value)}
              className="w-full sm:w-56 px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-2xs"
            >
              <option value="">Semua Kategori Buku</option>
              {kategoriBukuOptions.map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </select>
          )}

          {activeSubTab === 'peminjaman' && (
            <select
              value={filterStatusPinjam}
              onChange={(e) => setFilterStatusPinjam(e.target.value)}
              className="w-full sm:w-48 px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-2xs"
            >
              <option value="">Semua Status Pinjam</option>
              <option value="Dipinjam">Sedang Dipinjam</option>
              <option value="Dikembalikan">Sudah Dikembalikan</option>
              <option value="Terlambat">Terlambat</option>
            </select>
          )}
        </div>
      </div>

      {/* CONTENT FOR TAB 1: BAHAN PENGAJARAN */}
      {activeSubTab === 'materi' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredMateri.length === 0 ? (
            <div className="col-span-full py-16 bg-white rounded-2xl border border-slate-200 text-center">
              <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-slate-800">Belum Ada Materi Pengajaran</h3>
              <p className="text-sm text-slate-500 mt-1">
                {search || filterKategori
                  ? 'Tidak ada bahan pengajaran yang cocok dengan kata kunci pencarian.'
                  : 'Silakan tambahkan modul pembinaan jemaat, katekisasi, atau PA baru.'}
              </p>
            </div>
          ) : (
            filteredMateri.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-blue-50 text-blue-700">
                      {item.kategori}
                    </span>
                    <span className="text-xs font-medium text-slate-400">
                      {(() => {
                        try {
                          const d = new Date(item.tanggalTerbit);
                          return isNaN(d.getTime())
                            ? item.tanggalTerbit || '-'
                            : d.toLocaleDateString('id-ID', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              });
                        } catch {
                          return item.tanggalTerbit || '-';
                        }
                      })()}
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-900 text-base leading-snug line-clamp-2 hover:text-blue-600 transition-colors">
                    {item.judul}
                  </h3>

                  {item.ayatAlkitabReferensi && (
                    <div className="flex items-center gap-1.5 mt-2 text-xs font-medium text-amber-700 bg-amber-50/80 px-2.5 py-1 rounded-md">
                      <Bookmark className="w-3.5 h-3.5" />
                      <span>{item.ayatAlkitabReferensi}</span>
                    </div>
                  )}

                  <p className="text-xs text-slate-600 mt-3 line-clamp-3 leading-relaxed">
                    {item.ringkasan || 'Tidak ada deskripsi ringkas untuk modul pengajaran ini.'}
                  </p>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <span>Oleh: <strong className="text-slate-700 font-medium">{item.penyusun}</strong></span>
                    <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-600 font-mono text-[11px]">
                      {item.targetAudiens || 'Semua'}
                    </span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    onClick={() => setPreviewMateri(item)}
                    className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <BookOpen className="w-3.5 h-3.5 text-white" />
                    <span className="text-white font-bold">Baca Lengkap</span>
                  </button>

                  {item.fileUrl && (
                    <a
                      href={item.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-xl transition-colors shadow-2xs"
                      title="Buka / Unduh File Lampiran"
                    >
                      <Download className="w-4 h-4" />
                    </a>
                  )}

                  {canEdit && (
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleOpenEditMateri(item)}
                        className="p-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl transition-colors shadow-2xs cursor-pointer"
                        title="Edit Materi"
                      >
                        <Edit2 className="w-4 h-4 text-slate-700" />
                      </button>
                      <button
                        onClick={() => setDeleteMateriTarget(item)}
                        className="p-2 bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 rounded-xl transition-colors shadow-2xs cursor-pointer"
                        title="Hapus Materi"
                      >
                        <Trash2 className="w-4 h-4 text-rose-600" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* CONTENT FOR TAB 2: KATALOG BUKU */}
      {activeSubTab === 'katalog' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold text-xs">
                  <th className="py-3.5 px-4">Kode & Judul Buku</th>
                  <th className="py-3.5 px-4">Pengarang & Penerbit</th>
                  <th className="py-3.5 px-4">Kategori & Lokasi Rak</th>
                  <th className="py-3.5 px-4 text-center">Stok (Tersedia / Total)</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredBuku.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      Tidak ada buku dalam katalog yang sesuai kriteria.
                    </td>
                  </tr>
                ) : (
                  filteredBuku.map((buku) => (
                    <tr key={buku.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-12 bg-slate-100 border border-slate-200 rounded flex items-center justify-center text-slate-400 shrink-0">
                            {buku.coverUrl ? (
                              <img
                                src={buku.coverUrl}
                                alt={buku.judulBuku}
                                className="w-full h-full object-cover rounded"
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              <BookOpen className="w-4 h-4" />
                            )}
                          </div>
                          <div>
                            <span className="font-mono text-[11px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                              {buku.kodeBuku}
                            </span>
                            <h4 className="font-semibold text-slate-900 text-sm mt-0.5">{buku.judulBuku}</h4>
                            {buku.tahunTerbit && (
                              <span className="text-xs text-slate-400">Tahun: {buku.tahunTerbit}</span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <p className="font-medium text-slate-800">{buku.pengarang}</p>
                        <p className="text-xs text-slate-500">{buku.penerbit || '-'}</p>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                          {buku.kategori}
                        </span>
                        <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                          <FolderOpen className="w-3 h-3 text-slate-400" />
                          <span>{buku.lokasiRak || 'Gudang / Rak Umum'}</span>
                        </p>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="font-bold text-slate-900">{buku.jumlahTersedia || 0}</span>
                        <span className="text-xs text-slate-400"> / {buku.jumlahTotal}</span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {buku.jumlahTersedia > 0 ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Tersedia</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700">
                            <Clock className="w-3.5 h-3.5" />
                            <span>Habis Dipinjam</span>
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {canEdit && buku.jumlahTersedia > 0 && (
                            <button
                              onClick={() => handleOpenPinjamModal(buku)}
                              className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-lg text-xs font-bold transition-all shadow-xs flex items-center gap-1 cursor-pointer"
                              title="Pinjamkan Buku Ini"
                            >
                              Pinjamkan
                            </button>
                          )}
                          {canEdit && (
                            <>
                              <button
                                onClick={() => handleOpenEditBuku(buku)}
                                className="p-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg transition-colors shadow-2xs cursor-pointer"
                                title="Edit Buku"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setDeleteBukuTarget(buku)}
                                className="p-1.5 bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 rounded-lg transition-colors shadow-2xs cursor-pointer"
                                title="Hapus Buku"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CONTENT FOR TAB 3: SIRKULASI & PEMINJAMAN */}
      {activeSubTab === 'peminjaman' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold text-xs">
                  <th className="py-3.5 px-4">Buku Dipinjam</th>
                  <th className="py-3.5 px-4">Nama Peminjam</th>
                  <th className="py-3.5 px-4">Tgl Pinjam & Jatuh Tempo</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4">Petugas & Catatan</th>
                  <th className="py-3.5 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredPinjam.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      Tidak ada catatan riwayat peminjaman buku yang cocok.
                    </td>
                  </tr>
                ) : (
                  filteredPinjam.map((pinjam) => {
                    const isDueSoon =
                      pinjam.status === 'Dipinjam' &&
                      new Date(pinjam.tanggalJatuhTempo) < new Date();

                    return (
                      <tr key={pinjam.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3.5 px-4">
                          <span className="font-mono text-[11px] font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                            {pinjam.kodeBuku}
                          </span>
                          <h4 className="font-semibold text-slate-900 text-sm mt-0.5">{pinjam.judulBuku}</h4>
                        </td>
                        <td className="py-3.5 px-4">
                          <p className="font-semibold text-slate-800">{pinjam.namaPeminjam}</p>
                          <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                            {pinjam.rayonPeminjam && (
                              <span className="bg-slate-100 px-1.5 py-0.5 rounded text-[11px]">
                                {pinjam.rayonPeminjam}
                              </span>
                            )}
                            {pinjam.noKontak && <span>{pinjam.noKontak}</span>}
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="text-xs space-y-0.5">
                            <p className="text-slate-600">
                              Pinjam: <strong className="font-medium text-slate-800">{pinjam.tanggalPinjam}</strong>
                            </p>
                            <p className={isDueSoon ? 'text-rose-600 font-bold' : 'text-slate-600'}>
                              Tempo: {pinjam.tanggalJatuhTempo}
                            </p>
                            {pinjam.tanggalKembali && (
                              <p className="text-emerald-600">
                                Kembali: {pinjam.tanggalKembali}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          {pinjam.status === 'Dikembalikan' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Dikembalikan</span>
                            </span>
                          ) : isDueSoon ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700">
                              <AlertCircle className="w-3.5 h-3.5" />
                              <span>Terlambat</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700">
                              <Clock className="w-3.5 h-3.5" />
                              <span>Dipinjam</span>
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-xs text-slate-600">
                          <p>Petugas: <strong className="text-slate-700 font-medium">{pinjam.petugas || 'Admin'}</strong></p>
                          {pinjam.catatan && <p className="text-slate-500 italic mt-0.5">{pinjam.catatan}</p>}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {canEdit && pinjam.status === 'Dipinjam' && (
                              <button
                                onClick={() => kembalikanBuku(pinjam.id)}
                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-medium transition-colors shadow-2xs"
                                title="Buku Telah Dikembalikan"
                              >
                                Kembalikan
                              </button>
                            )}
                            {canEdit && (
                              <button
                                onClick={() => setDeletePinjamTarget(pinjam)}
                                className="p-1.5 hover:bg-red-50 text-red-600 rounded-lg transition-colors"
                                title="Hapus Riwayat"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: PREVIEW MATERI PENGAJARAN */}
      {previewMateri && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded bg-blue-50 text-blue-700 text-xs font-bold">
                  {previewMateri.kategori}
                </span>
                <span className="text-xs text-slate-400">
                  {previewMateri.tanggalTerbit}
                </span>
              </div>
              <button
                onClick={() => setPreviewMateri(null)}
                className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4">
              <h2 className="text-xl font-bold text-slate-900 leading-snug">
                {previewMateri.judul}
              </h2>

              {previewMateri.ayatAlkitabReferensi && (
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200/60 text-amber-900 text-sm flex items-center gap-2">
                  <Bookmark className="w-4 h-4 text-amber-700 shrink-0" />
                  <span>Referensi Alkitab: <strong>{previewMateri.ayatAlkitabReferensi}</strong></span>
                </div>
              )}

              <div className="text-xs text-slate-500 flex items-center gap-4">
                <span>Penyusun: <strong className="text-slate-700">{previewMateri.penyusun}</strong></span>
                <span>Sasaran: <strong className="text-slate-700">{previewMateri.targetAudiens || 'Semua'}</strong></span>
              </div>

              {previewMateri.ringkasan && (
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Ringkasan Materi
                  </h4>
                  <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                    {previewMateri.ringkasan}
                  </p>
                </div>
              )}

              {previewMateri.isiMateri && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Uraian & Bahan Lengkap
                  </h4>
                  <div className="p-4 bg-white rounded-xl border border-slate-200 text-sm text-slate-800 leading-relaxed whitespace-pre-line font-sans">
                    {previewMateri.isiMateri}
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
              {previewMateri.fileUrl ? (
                <a
                  href={previewMateri.fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs rounded-xl flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  <span>Unduh File Lengkap ({previewMateri.tipeFile || 'Dokumen'})</span>
                </a>
              ) : (
                <span className="text-xs text-slate-400 italic">Materi berbasis teks digital interaktif</span>
              )}
              <button
                onClick={() => setPreviewMateri(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-medium rounded-xl"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: TAMBAH / EDIT MATERI PENGAJARAN */}
      {isMateriModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-lg">
                {editingMateri ? 'Edit Bahan Pengajaran Rohani' : 'Tambah Bahan Pengajaran Rohani Baru'}
              </h3>
              <button
                onClick={() => setIsMateriModalOpen(false)}
                className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveMateri} className="p-6 overflow-y-auto space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-900 mb-1.5">
                  Judul Modul / Bahan Pengajaran <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={materiForm.judul || ''}
                  onChange={(e) => setMateriForm({ ...materiForm, judul: e.target.value })}
                  placeholder="Contoh: Modul Katekisasi Bab 4: Pengakuan Iman Rasuli"
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-2xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-900 mb-1.5">
                    Kategori Pengajaran
                  </label>
                  <select
                    value={materiForm.kategori || 'Katekisasi & Ajaran GKE'}
                    onChange={(e) => setMateriForm({ ...materiForm, kategori: e.target.value as any })}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-2xs"
                  >
                    {kategoriMateriOptions.map((k) => (
                      <option key={k} value={k} className="text-slate-900 bg-white">
                        {k}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-900 mb-1.5">
                    Sasaran Peserta / Jemaat
                  </label>
                  <input
                    type="text"
                    value={materiForm.targetAudiens || ''}
                    onChange={(e) => setMateriForm({ ...materiForm, targetAudiens: e.target.value })}
                    placeholder="Contoh: Calon Sidi, Anak SM, Pemuda"
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-2xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-900 mb-1.5">
                    Penyusun / Penulis
                  </label>
                  <input
                    type="text"
                    value={materiForm.penyusun || ''}
                    onChange={(e) => setMateriForm({ ...materiForm, penyusun: e.target.value })}
                    placeholder="Nama Pendeta / Tim Liturgi"
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-2xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-900 mb-1.5">
                    Referensi Nats Alkitab
                  </label>
                  <input
                    type="text"
                    value={materiForm.ayatAlkitabReferensi || ''}
                    onChange={(e) => setMateriForm({ ...materiForm, ayatAlkitabReferensi: e.target.value })}
                    placeholder="Contoh: Roma 12:1-2; Efesus 4:11"
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-2xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-900 mb-1.5">
                  Ringkasan / Sinopsis Singkat
                </label>
                <textarea
                  rows={2}
                  value={materiForm.ringkasan || ''}
                  onChange={(e) => setMateriForm({ ...materiForm, ringkasan: e.target.value })}
                  placeholder="Garis besar topik pengajaran..."
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-2xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-900 mb-1.5">
                  Isi Materi / Naskah Pengajaran
                </label>
                <textarea
                  rows={5}
                  value={materiForm.isiMateri || ''}
                  onChange={(e) => setMateriForm({ ...materiForm, isiMateri: e.target.value })}
                  placeholder="Tuliskan naskah pengajaran, pokok diskusi kelompok, atau bahan khotbah di sini..."
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-mono font-medium text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-2xs leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-900 mb-1.5">
                    URL Link Dokumen / Drive (Opsional)
                  </label>
                  <input
                    type="url"
                    value={materiForm.fileUrl || ''}
                    onChange={(e) => setMateriForm({ ...materiForm, fileUrl: e.target.value })}
                    placeholder="https://drive.google.com/..."
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-2xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-900 mb-1.5">
                    Tipe File
                  </label>
                  <select
                    value={materiForm.tipeFile || 'PDF'}
                    onChange={(e) => setMateriForm({ ...materiForm, tipeFile: e.target.value as any })}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-2xs"
                  >
                    <option value="PDF" className="text-slate-900 bg-white">PDF Document</option>
                    <option value="DOCX" className="text-slate-900 bg-white">Word (.docx)</option>
                    <option value="PPTX" className="text-slate-900 bg-white">Presentation (.pptx)</option>
                    <option value="Video" className="text-slate-900 bg-white">Video Link</option>
                    <option value="Audio" className="text-slate-900 bg-white">Audio / Podcast</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsMateriModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-xl transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl transition-colors shadow-xs"
                >
                  {editingMateri ? 'Simpan Perubahan' : 'Simpan Bahan Pengajaran'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: TAMBAH / EDIT BUKU KATALOG */}
      {isBukuModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-lg">
                {editingBuku ? 'Edit Informasi Buku' : 'Tambah Buku ke Perpustakaan'}
              </h3>
              <button
                onClick={() => setIsBukuModalOpen(false)}
                className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBuku} className="p-6 overflow-y-auto space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-900 mb-1.5">
                    Kode Buku / Barcode
                  </label>
                  <input
                    type="text"
                    required
                    value={bukuForm.kodeBuku || ''}
                    onChange={(e) => setBukuForm({ ...bukuForm, kodeBuku: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-mono font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-2xs"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-900 mb-1.5">
                    Judul Buku <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={bukuForm.judulBuku || ''}
                    onChange={(e) => setBukuForm({ ...bukuForm, judulBuku: e.target.value })}
                    placeholder="Contoh: Dogmatika Masa Kini"
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-2xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-900 mb-1.5">
                    Pengarang / Penulis <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={bukuForm.pengarang || ''}
                    onChange={(e) => setBukuForm({ ...bukuForm, pengarang: e.target.value })}
                    placeholder="Nama Pengarang"
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-2xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-900 mb-1.5">
                    Penerbit
                  </label>
                  <input
                    type="text"
                    value={bukuForm.penerbit || ''}
                    onChange={(e) => setBukuForm({ ...bukuForm, penerbit: e.target.value })}
                    placeholder="Contoh: BPK Gunung Mulia"
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-2xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-900 mb-1.5">
                    Kategori Buku
                  </label>
                  <select
                    value={bukuForm.kategori || 'Teologi & Doktrin'}
                    onChange={(e) => setBukuForm({ ...bukuForm, kategori: e.target.value as any })}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-2xs"
                  >
                    {kategoriBukuOptions.map((k) => (
                      <option key={k} value={k} className="text-slate-900 bg-white">
                        {k}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-900 mb-1.5">
                    Lokasi Rak
                  </label>
                  <input
                    type="text"
                    value={bukuForm.lokasiRak || ''}
                    onChange={(e) => setBukuForm({ ...bukuForm, lokasiRak: e.target.value })}
                    placeholder="Rak B - Pastoral"
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-2xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-900 mb-1.5">
                    Tahun Terbit
                  </label>
                  <input
                    type="text"
                    value={bukuForm.tahunTerbit || ''}
                    onChange={(e) => setBukuForm({ ...bukuForm, tahunTerbit: e.target.value })}
                    placeholder="2021"
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-2xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-900 mb-1.5">
                    Jumlah Total Eksemplar
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={bukuForm.jumlahTotal ?? 1}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 1;
                      setBukuForm({
                        ...bukuForm,
                        jumlahTotal: val,
                        jumlahTersedia: Math.min(val, bukuForm.jumlahTersedia || val),
                      });
                    }}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-2xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-900 mb-1.5">
                    Jumlah Tersedia Saat Ini
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={bukuForm.jumlahTotal ?? 1}
                    value={bukuForm.jumlahTersedia ?? 0}
                    onChange={(e) =>
                      setBukuForm({ ...bukuForm, jumlahTersedia: parseInt(e.target.value) || 0 })
                    }
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-2xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-900 mb-1.5">
                  Sinopsis / Ringkasan Buku (Opsional)
                </label>
                <textarea
                  rows={3}
                  value={bukuForm.deskripsi || ''}
                  onChange={(e) => setBukuForm({ ...bukuForm, deskripsi: e.target.value })}
                  placeholder="Catatan ringkas isi buku..."
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-2xs"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsBukuModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-xl transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-xs cursor-pointer"
                >
                  {editingBuku ? 'Simpan Perubahan' : 'Tambahkan ke Katalog'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CATAT PEMINJAMAN */}
      {isPinjamModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-lg">Catat Peminjaman Buku</h3>
              <button
                onClick={() => setIsPinjamModalOpen(false)}
                className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePinjam} className="p-6 overflow-y-auto space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-900 mb-1.5">
                  Pilih Judul Buku <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={pinjamForm.bukuId || ''}
                  onChange={(e) => {
                    const selected = katalogBukuList.find((b) => b.id === e.target.value);
                    if (selected) {
                      setPinjamForm({
                        ...pinjamForm,
                        bukuId: selected.id,
                        kodeBuku: selected.kodeBuku,
                        judulBuku: selected.judulBuku,
                      });
                    }
                  }}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-2xs"
                >
                  {katalogBukuList.map((b) => (
                    <option key={b.id} value={b.id} disabled={b.jumlahTersedia <= 0} className="text-slate-900 bg-white">
                      {b.kodeBuku} - {b.judulBuku} ({b.jumlahTersedia > 0 ? `Tersedia: ${b.jumlahTersedia}` : 'Habis'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-900 mb-1.5">
                  Nama Warga Peminjam <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  list="warga-list-peminjam"
                  value={pinjamForm.namaPeminjam || ''}
                  onChange={(e) => {
                    const name = e.target.value;
                    const matchedWarga = wargaJemaatList.find(
                      (w) => w.namaLengkap.toLowerCase() === name.toLowerCase()
                    );
                    setPinjamForm({
                      ...pinjamForm,
                      namaPeminjam: name,
                      rayonPeminjam: matchedWarga?.lingkungan || pinjamForm.rayonPeminjam,
                      noKontak: matchedWarga?.telepon || pinjamForm.noKontak,
                    });
                  }}
                  placeholder="Ketik nama jemaat..."
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-2xs"
                />
                <datalist id="warga-list-peminjam">
                  {wargaJemaatList.map((w) => (
                    <option key={w.id} value={w.namaLengkap}>
                      {w.lingkungan ? `(${w.lingkungan})` : ''}
                    </option>
                  ))}
                </datalist>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-900 mb-1.5">
                    Lingkungan / Rayon
                  </label>
                  <input
                    type="text"
                    value={pinjamForm.rayonPeminjam || ''}
                    onChange={(e) => setPinjamForm({ ...pinjamForm, rayonPeminjam: e.target.value })}
                    placeholder="Rayon 1"
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-2xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-900 mb-1.5">
                    No. Telepon / WhatsApp
                  </label>
                  <input
                    type="text"
                    value={pinjamForm.noKontak || ''}
                    onChange={(e) => setPinjamForm({ ...pinjamForm, noKontak: e.target.value })}
                    placeholder="0812xxxx"
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-2xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-900 mb-1.5">
                    Tanggal Pinjam
                  </label>
                  <input
                    type="date"
                    required
                    value={pinjamForm.tanggalPinjam || ''}
                    onChange={(e) => setPinjamForm({ ...pinjamForm, tanggalPinjam: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-2xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-900 mb-1.5">
                    Tanggal Jatuh Tempo (Kembali)
                  </label>
                  <input
                    type="date"
                    required
                    value={pinjamForm.tanggalJatuhTempo || ''}
                    onChange={(e) => setPinjamForm({ ...pinjamForm, tanggalJatuhTempo: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-2xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-900 mb-1.5">
                  Catatan / Keterangan Peminjaman
                </label>
                <input
                  type="text"
                  value={pinjamForm.catatan || ''}
                  onChange={(e) => setPinjamForm({ ...pinjamForm, catatan: e.target.value })}
                  placeholder="Misal: Keperluan bahan PA lingkungan..."
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-2xs"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsPinjamModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-xl transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl transition-colors shadow-xs"
                >
                  Proses Peminjaman
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modals */}
      {deleteMateriTarget && (
        <DeleteConfirmModal
          isOpen={!!deleteMateriTarget}
          title="Hapus Bahan Pengajaran Rohani"
          message={`Apakah Anda yakin ingin menghapus materi "${deleteMateriTarget.judul}"? Tindakan ini tidak dapat dibatalkan.`}
          onConfirm={async () => {
            await deleteMateriPengajaran(deleteMateriTarget.id);
            setDeleteMateriTarget(null);
          }}
          onCancel={() => setDeleteMateriTarget(null)}
        />
      )}

      {deleteBukuTarget && (
        <DeleteConfirmModal
          isOpen={!!deleteBukuTarget}
          title="Hapus Buku dari Katalog"
          message={`Apakah Anda yakin ingin menghapus buku "${deleteBukuTarget.judulBuku}" (${deleteBukuTarget.kodeBuku})?`}
          onConfirm={async () => {
            await deleteKatalogBuku(deleteBukuTarget.id);
            setDeleteBukuTarget(null);
          }}
          onCancel={() => setDeleteBukuTarget(null)}
        />
      )}

      {deletePinjamTarget && (
        <DeleteConfirmModal
          isOpen={!!deletePinjamTarget}
          title="Hapus Catatan Peminjaman"
          message={`Apakah Anda yakin ingin menghapus riwayat peminjaman "${deletePinjamTarget.judulBuku}" oleh ${deletePinjamTarget.namaPeminjam}?`}
          onConfirm={async () => {
            await deletePeminjamanBuku(deletePinjamTarget.id);
            setDeletePinjamTarget(null);
          }}
          onCancel={() => setDeletePinjamTarget(null)}
        />
      )}
    </div>
  );
};
