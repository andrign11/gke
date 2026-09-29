import React, { useState, useEffect, useMemo } from 'react';
import {
  AlertTriangle,
  Briefcase,
  Calendar,
  CheckCircle2,
  ChevronDown,
  Edit2,
  Loader2,
  MessageCircle,
  Phone,
  Plus,
  Printer,
  ShieldCheck,
  Trash2,
  UserCheck,
  X,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { MPHMember } from '../../types';
import defaultGkeLogo from '../../assets/images/gke_logo_official_1785341836111.jpg';

export const MPHModule: React.FC = () => {
  const {
    mphList,
    addMPHMember,
    updateMPHMember,
    deleteMPHMember,
    jabatanList,
    setActiveTab,
    openPrintReport,
    currentUser,
    settings,
  } = useApp();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MPHMember | null>(null);
  const [isCustomJabatan, setIsCustomJabatan] = useState(false);
  const [periodeCetakLaporan, setPeriodeCetakLaporan] = useState<string>('2024 - 2029');

  // Dynamic active positions from AppContext (sorted by urutan)
  const activeJabatanList = useMemo(() => {
    return [...jabatanList]
      .filter((j) => j.aktif)
      .sort((a, b) => (a.urutan || 999) - (b.urutan || 999));
  }, [jabatanList]);

  // Grouped active master jabatan
  const skJabatanList = useMemo(() => {
    return activeJabatanList.filter(
      (j) => j.kategori === 'Seksi Kategorial' || j.kategori === 'Badan & Majelis Pertimbangan'
    );
  }, [activeJabatanList]);

  const mphJabatanList = useMemo(() => {
    return activeJabatanList.filter((j) => j.kategori === 'MPH / Majelis Jemaat');
  }, [activeJabatanList]);

  const panitiaJabatanList = useMemo(() => {
    return activeJabatanList.filter((j) => j.kategori === 'Panitia & Pokja');
  }, [activeJabatanList]);

  useEffect(() => {
    if (settings.periodePelayananMPH) {
      setPeriodeCetakLaporan(settings.periodePelayananMPH);
    } else if (mphList && mphList.length > 0 && mphList[0].periode) {
      setPeriodeCetakLaporan(mphList[0].periode);
    }
  }, [settings.periodePelayananMPH, mphList]);

  // Anti-duplicate saving states with progressbar
  const [isSaving, setIsSaving] = useState(false);
  const [saveProgress, setSaveProgress] = useState(0);
  const [saveStatusText, setSaveStatusText] = useState('');

  // Anti-duplicate deleting states with confirmation & progressbar
  const [deleteTarget, setDeleteTarget] = useState<MPHMember | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteProgress, setDeleteProgress] = useState(0);

  const canEdit =
    currentUser.role === 'admin' || currentUser.role === 'sekretaris';

  const [formData, setFormData] = useState<Omit<MPHMember, 'id'>>({
    jabatan: 'KETUA SPP/R',
    nama: '',
    gelar: 'S.Th.',
    periode: '2024 - 2029',
    noHp: '',
  });

  // Pemetaan dan deteksi data posisi ganda (duplicate jabatan)
  const duplicateJabatanMap = useMemo(() => {
    const map: Record<string, MPHMember[]> = {};
    mphList.forEach((item) => {
      const key = item.jabatan.trim().toLowerCase();
      if (!map[key]) {
        map[key] = [];
      }
      map[key].push(item);
    });
    return map;
  }, [mphList]);

  // Daftar nama jabatan yang terdaftar ganda
  const duplicateJabatanNames = useMemo(() => {
    return Object.entries(duplicateJabatanMap)
      .filter(([_, list]) => (list as MPHMember[]).length > 1)
      .map(([_, list]) => (list as MPHMember[])[0].jabatan);
  }, [duplicateJabatanMap]);

  // Jumlah posisi dan anggota yang terduplikasi
  const totalDuplicatePositions = duplicateJabatanNames.length;
  const totalDuplicateMembers = useMemo(() => {
    return Object.values(duplicateJabatanMap)
      .filter((list) => (list as MPHMember[]).length > 1)
      .reduce((sum: number, list) => sum + (list as MPHMember[]).length, 0);
  }, [duplicateJabatanMap]);

  // Cek apakah posisi yang sedang dipilih/diketik pada formulir sudah terisi oleh pengurus lain
  const formDuplicateMatches = useMemo(() => {
    if (!formData.jabatan || !formData.jabatan.trim()) return [];
    const targetKey = formData.jabatan.trim().toLowerCase();
    return mphList.filter(
      (m) =>
        m.jabatan.trim().toLowerCase() === targetKey &&
        (!editingItem || m.id !== editingItem.id)
    );
  }, [formData.jabatan, mphList, editingItem]);

  const handleOpenAdd = () => {
    setEditingItem(null);
    setIsCustomJabatan(false);
    const defaultJabatan = activeJabatanList[0]?.nama || 'KETUA SPP/R';
    setFormData({
      jabatan: defaultJabatan,
      nama: '',
      gelar: 'S.Th.',
      periode: '2024 - 2029',
      noHp: '',
    });
    setSaveProgress(0);
    setSaveStatusText('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: MPHMember) => {
    setEditingItem(item);
    const isCustom = !activeJabatanList.some(
      (j) => j.nama.trim().toLowerCase() === item.jabatan.trim().toLowerCase()
    );
    setIsCustomJabatan(isCustom);
    setFormData({ ...item });
    setSaveProgress(0);
    setSaveStatusText('');
    setIsModalOpen(true);
  };

  const handleJabatanSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === '__CUSTOM__') {
      setIsCustomJabatan(true);
      setFormData((prev) => ({ ...prev, jabatan: '' }));
    } else {
      setIsCustomJabatan(false);
      setFormData((prev) => ({ ...prev, jabatan: val }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;

    if (!formData.jabatan.trim() || !formData.nama.trim()) {
      alert('Mohon lengkapi Jabatan dan Nama Pengurus!');
      return;
    }

    try {
      setIsSaving(true);
      setSaveProgress(25);
      setSaveStatusText('Memvalidasi data kepengurusan...');
      await new Promise((res) => setTimeout(res, 120));

      setSaveProgress(65);
      setSaveStatusText('Menyimpan ke database cloud & mencegah duplikasi data...');

      if (editingItem) {
        await updateMPHMember(editingItem.id, formData);
      } else {
        await addMPHMember(formData);
      }

      setSaveProgress(100);
      setSaveStatusText('Data berhasil disimpan secara aman!');
      await new Promise((res) => setTimeout(res, 300));
      setIsModalOpen(false);
    } catch (err) {
      console.error('Gagal menyimpan pengurus MPH:', err);
      alert('Terjadi kendala saat menyimpan. Silakan coba lagi.');
    } finally {
      setIsSaving(false);
      setSaveProgress(0);
      setSaveStatusText('');
    }
  };

  const handleExecuteDelete = async () => {
    if (!deleteTarget || isDeleting) return;

    try {
      setIsDeleting(true);
      setDeleteProgress(30);
      await new Promise((res) => setTimeout(res, 100));
      setDeleteProgress(75);
      await deleteMPHMember(deleteTarget.id);
      setDeleteProgress(100);
      await new Promise((res) => setTimeout(res, 250));
      setDeleteTarget(null);
    } catch (err) {
      console.error('Gagal menghapus pengurus MPH:', err);
      alert('Terjadi kesalahan saat menghapus pengurus.');
    } finally {
      setIsDeleting(false);
      setDeleteProgress(0);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner with Official GKE Logo */}
      <div className="bg-slate-900/95 dark:bg-slate-900 p-5 sm:p-6 rounded-3xl border border-slate-800 shadow-xl backdrop-blur-md flex flex-wrap items-center justify-between gap-5">
        <div className="flex items-center gap-4">
          <div className="relative shrink-0">
            <div className="w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center overflow-hidden">
              <img
                src={settings.logoUrl || settings.logoGkeUrl || defaultGkeLogo}
                alt="Logo GKE"
                className="w-full h-full object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = defaultGkeLogo;
                }}
              />
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Sinode GKE &bull; {settings.resortGke || 'Resort GKE'}
              </span>
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Periode: {periodeCetakLaporan}
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-black text-white tracking-tight flex items-center gap-2">
              <span>Majelis Pekerja Harian (MPH)</span>
              <span className="text-amber-400 font-bold text-sm sm:text-base">
                &mdash; {settings.namaJemaat || 'Jemaat GKE'}
              </span>
            </h2>
            <p className="text-xs text-slate-300 mt-1 max-w-xl leading-relaxed">
              Struktur resmi pimpinan harian majelis jemaat dan seksi pelayanan kategorial (SPB, SPPer, SPPR/P, SPA) berdasarkan Surat Keputusan (SK) Majelis Sinode / Resort GKE.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Textbox Set Periode Laporan Cetak MPH */}
          <div className="flex items-center gap-2 bg-slate-950/90 px-3 py-1.5 rounded-xl border border-slate-700/80 focus-within:border-indigo-500 transition shadow-inner">
            <Calendar className="w-4 h-4 text-amber-400 shrink-0" />
            <div className="flex items-center gap-1.5">
              <label className="text-[11px] font-semibold text-slate-300 whitespace-nowrap">
                Set Periode:
              </label>
              <input
                type="text"
                value={periodeCetakLaporan || ''}
                onChange={(e) => setPeriodeCetakLaporan(e.target.value)}
                placeholder="2024 - 2029"
                className="w-28 sm:w-32 px-2 py-1 rounded-lg bg-slate-900 border border-slate-700 text-amber-300 font-bold text-xs focus:outline-none focus:border-amber-400"
                title="Ubah teks periode yang akan ditampilkan pada kop/subtitle laporan cetak"
              />
            </div>
          </div>

          {canEdit && (
            <button
              onClick={handleOpenAdd}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-md shadow-indigo-600/30 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Pengurus MPH</span>
            </button>
          )}

          <button
            onClick={() =>
              openPrintReport({
                reportType: 'mph_jemaat',
                filterJenis: periodeCetakLaporan,
              })
            }
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs font-bold px-4 py-2.5 rounded-xl transition-all border border-slate-700 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer shadow-md"
            title="Buka pratinjau dan cetak laporan kepengurusan MPH"
          >
            <Printer className="w-4 h-4 text-emerald-400" />
            <span>Cetak Struktur MPH</span>
          </button>
        </div>
      </div>

      {/* Banner Peringatan Data Ganda (jika ada posisi yang dimasukkan ganda) */}
      {totalDuplicatePositions > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/30 p-4 rounded-2xl flex items-start gap-3 text-amber-300 shadow-lg backdrop-blur-md">
          <div className="p-2 bg-amber-500/20 rounded-xl border border-amber-500/30 shrink-0 text-amber-400 mt-0.5">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="flex-1 space-y-1">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-xs tracking-wide uppercase text-amber-200">
                ⚠️ Peringatan: Terdapat Posisi Kepengurusan Ganda
              </h3>
              <span className="text-[10px] font-mono font-bold bg-amber-500/20 px-2 py-0.5 rounded-md border border-amber-500/30 text-amber-300">
                {totalDuplicateMembers} Pengurus Terlibat ({totalDuplicatePositions} Posisi)
              </span>
            </div>
            <p className="text-xs text-amber-300/90 leading-relaxed">
              Ditemukan jabatan struktural yang diisi oleh lebih dari satu orang secara bersamaan. Posisi yang ganda ditandai dengan badge khusus pada kartu dan tabel di bawah ini.
            </p>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {duplicateJabatanNames.map((jab) => (
                <span
                  key={jab}
                  className="text-[10px] font-semibold bg-amber-500/20 text-amber-200 px-2.5 py-0.5 rounded-lg border border-amber-500/30"
                >
                  📌 {jab} ({duplicateJabatanMap[jab.trim().toLowerCase()]?.length || 0} orang)
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Grid Cards View of MPH */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {mphList.map((item) => {
          const isDuplicate = (duplicateJabatanMap[item.jabatan.trim().toLowerCase()]?.length || 0) > 1;
          const duplicateCount = duplicateJabatanMap[item.jabatan.trim().toLowerCase()]?.length || 1;

          // Jabatan Color Styling
          const jabLower = item.jabatan.toLowerCase();
          let roleBadgeStyle = 'bg-slate-700/60 text-slate-200 border-slate-600';
          if (jabLower.includes('ketua') && !jabLower.includes('wakil')) {
            roleBadgeStyle = 'bg-blue-600/90 text-white border-blue-400 font-black';
          } else if (jabLower.includes('wakil ketua')) {
            roleBadgeStyle = 'bg-sky-600/90 text-white border-sky-400 font-bold';
          } else if (jabLower.includes('sekretaris')) {
            roleBadgeStyle = 'bg-emerald-600/90 text-white border-emerald-400 font-bold';
          } else if (jabLower.includes('bendahara')) {
            roleBadgeStyle = 'bg-amber-600/90 text-white border-amber-400 font-bold';
          }

          return (
            <div
              key={item.id}
              className={`mph-member-card rounded-2xl p-5 border transition-all shadow-md backdrop-blur-md flex flex-col justify-between ${
                isDuplicate
                  ? 'bg-amber-950/20 border-amber-500/50 hover:border-amber-400 ring-1 ring-amber-500/20'
                  : 'bg-slate-900/90 border-slate-800 hover:border-indigo-500/50'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  {/* Official Logo GKE (Tanpa Border) */}
                  <div className="relative shrink-0 mt-0.5">
                    <div className="w-12 h-12 flex items-center justify-center overflow-hidden">
                      <img
                        src={settings.logoUrl || settings.logoGkeUrl || defaultGkeLogo}
                        alt="Logo GKE"
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = defaultGkeLogo;
                        }}
                      />
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={`text-[10px] uppercase px-2.5 py-0.5 rounded-md border shadow-2xs ${roleBadgeStyle}`}>
                        {item.jabatan}
                      </span>
                      {isDuplicate && (
                        <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase text-amber-300 bg-amber-500/30 px-1.5 py-0.5 rounded border border-amber-500/50 animate-pulse" title={`Posisi ganda: ${duplicateCount} orang mengisi jabatan ini`}>
                          <AlertTriangle className="w-2.5 h-2.5" />
                          <span>Ganda ({duplicateCount})</span>
                        </span>
                      )}
                    </div>
                    <h3 className="font-extrabold text-slate-100 dark:text-slate-100 text-sm sm:text-base mt-1.5 leading-snug tracking-tight truncate" title={`${item.nama}${item.gelar ? `, ${item.gelar}` : ''}`}>
                      {item.nama}{item.gelar ? `, ${item.gelar}` : ''}
                    </h3>
                  </div>
                </div>

                {canEdit && (
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => handleOpenEdit(item)}
                      disabled={isSaving || isDeleting}
                      className="p-1.5 text-slate-400 hover:text-indigo-400 rounded-lg hover:bg-slate-800/60 transition cursor-pointer disabled:opacity-40"
                      title="Edit Pengurus"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(item)}
                      disabled={isSaving || isDeleting}
                      className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800/60 transition cursor-pointer disabled:opacity-40"
                      title="Hapus Pengurus"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap justify-between items-center gap-2 text-xs text-slate-300">
                <div className="flex items-center gap-1 font-medium text-[11px] text-slate-400">
                  <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Masa Bakti: <strong className="text-slate-200">{item.periode}</strong></span>
                </div>
                {item.noHp ? (
                  <a
                    href={`https://wa.me/${item.noHp.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-[11px] font-bold transition shadow-2xs"
                    title={`Hubungi via WhatsApp (${item.noHp})`}
                  >
                    <MessageCircle className="w-3 h-3 text-emerald-400" />
                    <span>{item.noHp}</span>
                  </a>
                ) : (
                  <span className="text-[11px] text-slate-500 italic">No HP belum diisi</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Table Detail */}
      <div className="bg-slate-900/80 rounded-2xl border border-slate-800/80 overflow-hidden shadow-lg backdrop-blur-md">
        <div className="p-3.5 bg-slate-950/80 border-b border-slate-800 font-bold text-slate-200 text-xs tracking-wider uppercase flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span>Tabel Lengkap Kepengurusan MPH Majelis Jemaat GKE Berdasarkan SK</span>
            {totalDuplicatePositions > 0 && (
              <span className="text-[10px] font-bold text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded border border-amber-500/30">
                ⚠️ Ada {totalDuplicatePositions} Posisi Ganda
              </span>
            )}
          </div>
          <span className="text-[11px] font-mono text-indigo-400 font-semibold bg-indigo-500/10 px-2 py-0.5 rounded-md border border-indigo-500/20">
            Total: {mphList.length} Pengurus
          </span>
        </div>
        <div className="overflow-x-auto w-full max-w-full">
          <table className="w-full min-w-[650px] text-xs text-left text-slate-300">
            <thead className="bg-slate-950/60 text-slate-200 font-bold border-b border-slate-800 uppercase text-[11px] tracking-wider whitespace-nowrap">
              <tr>
                <th className="p-3.5 w-12 text-center">No</th>
                <th className="p-3.5">Jabatan Struktural</th>
                <th className="p-3.5">Nama Lengkap &amp; Gelar</th>
                <th className="p-3.5">Periode Jabatan</th>
                <th className="p-3.5">No. HP / Kontak</th>
                {canEdit && <th className="p-3.5 text-center w-24">Aksi</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {mphList.map((item, idx) => {
                const isDuplicate = (duplicateJabatanMap[item.jabatan.trim().toLowerCase()]?.length || 0) > 1;
                return (
                  <tr
                    key={item.id}
                    className={`transition-colors ${
                      isDuplicate ? 'bg-amber-950/15 hover:bg-amber-950/30' : 'hover:bg-slate-800/40'
                    }`}
                  >
                    <td className="p-3.5 text-center font-mono text-slate-500">{idx + 1}</td>
                    <td className="p-3.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-slate-100">{item.jabatan}</span>
                        {isDuplicate && (
                          <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase text-amber-400 bg-amber-500/20 px-1.5 py-0.5 rounded border border-amber-500/40">
                            <AlertTriangle className="w-2.5 h-2.5" />
                            <span>Data Ganda</span>
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-3.5 font-semibold text-indigo-300">
                      {item.nama}{item.gelar ? `, ${item.gelar}` : ''}
                    </td>
                    <td className="p-3.5 text-slate-400">{item.periode}</td>
                    <td className="p-3.5 font-mono text-slate-400">{item.noHp || '-'}</td>
                    {canEdit && (
                      <td className="p-3.5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(item)}
                            disabled={isSaving || isDeleting}
                            className="p-1 text-slate-400 hover:text-indigo-400 rounded-md hover:bg-slate-800/80 transition cursor-pointer disabled:opacity-40"
                            title="Edit"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(item)}
                            disabled={isSaving || isDeleting}
                            className="p-1 text-slate-400 hover:text-rose-400 rounded-md hover:bg-slate-800/80 transition cursor-pointer disabled:opacity-40"
                            title="Hapus"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
              {mphList.length === 0 && (
                <tr>
                  <td colSpan={canEdit ? 6 : 5} className="p-6 text-center text-slate-500 italic">
                    Belum ada data pengurus MPH tersimpan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Tambah / Edit Pengurus dengan Progress Bar Anti Duplikasi */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4 overflow-hidden animate-in fade-in duration-150">
          <div className="bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg border border-slate-800 text-slate-100 flex flex-col max-h-[92dvh] sm:max-h-[88vh] overflow-hidden my-auto">
            <div className="bg-slate-950 p-4 px-5 border-b border-slate-800 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  <UserCheck className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-sm text-slate-100">
                  {editingItem ? 'Edit Pengurus MPH & Seksi' : 'Tambah Pengurus MPH Baru'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => !isSaving && setIsModalOpen(false)}
                disabled={isSaving}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition disabled:opacity-40 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden text-xs">
              <div className="p-4 sm:p-5 space-y-4 flex-1 overflow-y-auto overscroll-contain">
                {/* Dropdown Jabatan Struktural MPH */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="font-bold text-slate-300">
                    Jabatan Struktural MPH &amp; SK Kategorial <span className="text-rose-400">*</span>
                  </label>
                  <div className="flex items-center space-x-2">
                    {isCustomJabatan ? (
                      <button
                        type="button"
                        onClick={() => {
                          setIsCustomJabatan(false);
                          setFormData((p) => ({ ...p, jabatan: activeJabatanList[0]?.nama || 'KETUA SPP/R' }));
                        }}
                        className="text-[11px] text-indigo-400 hover:underline cursor-pointer"
                      >
                        Pilih dari Dropdown
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setIsModalOpen(false);
                          setActiveTab('jabatan_struktural');
                        }}
                        className="inline-flex items-center space-x-1 text-[11px] font-medium text-indigo-400 hover:text-indigo-300 hover:underline cursor-pointer"
                        title="Buka halaman master untuk menambah atau mengurangi jabatan"
                      >
                        <Briefcase className="w-3 h-3" />
                        <span>Kelola Master Jabatan</span>
                      </button>
                    )}
                  </div>
                </div>

                {!isCustomJabatan ? (
                  <div className="relative">
                    <select
                      value={
                        activeJabatanList.some((j) => j.nama.trim().toLowerCase() === formData.jabatan.trim().toLowerCase())
                          ? formData.jabatan
                          : '__CUSTOM__'
                      }
                      onChange={handleJabatanSelectChange}
                      disabled={isSaving}
                      className="w-full p-2.5 pr-9 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 font-bold focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 appearance-none cursor-pointer disabled:opacity-60"
                    >
                      {skJabatanList.length > 0 && (
                        <optgroup label="Jabatan Berdasarkan Surat Keputusan (SK) & Kategorial">
                          {skJabatanList.map((j) => (
                            <option key={j.id} value={j.nama}>
                              {j.nama}
                            </option>
                          ))}
                        </optgroup>
                      )}
                      {mphJabatanList.length > 0 && (
                        <optgroup label="Jabatan Struktural MPH & Majelis Jemaat GKE">
                          {mphJabatanList.map((j) => (
                            <option key={j.id} value={j.nama}>
                              {j.nama}
                            </option>
                          ))}
                        </optgroup>
                      )}
                      {panitiaJabatanList.length > 0 && (
                        <optgroup label="Jabatan Panitia & Pokja Lainnya">
                          {panitiaJabatanList.map((j) => (
                            <option key={j.id} value={j.nama}>
                              {j.nama}
                            </option>
                          ))}
                        </optgroup>
                      )}
                      <option value="__CUSTOM__">➕ Tulis Jabatan Lainnya (Kustom)...</option>
                    </select>
                    <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <input
                      type="text"
                      required
                      value={formData.jabatan || ''}
                      onChange={(e) => setFormData({ ...formData, jabatan: e.target.value })}
                      placeholder="Masukkan nama jabatan struktural kustom..."
                      disabled={isSaving}
                      className="w-full p-2.5 rounded-xl bg-slate-950 border border-indigo-500/60 text-slate-100 font-bold focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                    <p className="text-[10px] text-slate-400">
                      Ketikkan nama jabatan atau tambahkan secara permanen di menu "Jabatan Struktural dan Kategorial".
                    </p>
                  </div>
                )}
              </div>

              {/* Warning jika jabatan yang dipilih sudah ada (ganda) */}
              {formDuplicateMatches.length > 0 && (
                <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-300 flex items-start gap-2 animate-in fade-in duration-150">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <p className="font-bold text-amber-200 uppercase text-[10px] tracking-wider">
                      ⚠️ Peringatan Posisi Ganda:
                    </p>
                    <p className="text-[11px] text-amber-300/90">
                      Jabatan <strong className="text-white">"{formData.jabatan}"</strong> sudah diisi oleh{' '}
                      <span className="font-bold text-amber-200">
                        {formDuplicateMatches.map((m) => `${m.nama} (${m.periode})`).join(', ')}
                      </span>
                      . Menyimpannya akan mengakibatkan posisi tersebut terdaftar ganda.
                    </p>
                  </div>
                </div>
              )}

              {/* Nama & Gelar */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Nama Lengkap</label>
                  <input
                    type="text"
                    required
                    value={formData.nama || ''}
                    onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                    placeholder="e.g. Samuel Kristanto"
                    disabled={isSaving}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 disabled:opacity-60"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Gelar Akademik/Gerejawi</label>
                  <input
                    type="text"
                    value={formData.gelar || ''}
                    onChange={(e) => setFormData({ ...formData, gelar: e.target.value })}
                    placeholder="e.g. S.Th., M.Div., S.Pd.K"
                    disabled={isSaving}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 disabled:opacity-60"
                  />
                </div>
              </div>

              {/* Periode & No. HP */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Periode Masa Bakti</label>
                  <input
                    type="text"
                    required
                    value={formData.periode || ''}
                    onChange={(e) => setFormData({ ...formData, periode: e.target.value })}
                    placeholder="2024 - 2029"
                    disabled={isSaving}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 font-mono focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 disabled:opacity-60"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">No. HP / WhatsApp</label>
                  <input
                    type="text"
                    value={formData.noHp || ''}
                    onChange={(e) => setFormData({ ...formData, noHp: e.target.value })}
                    placeholder="0812-XXXX-XXXX"
                    disabled={isSaving}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 font-mono focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 disabled:opacity-60"
                  />
                </div>
              </div>

              {/* Progress Bar Penyimpanan Real-Time (Mencegah Data Ganda) */}
              {isSaving && (
                <div className="p-3 bg-indigo-950/60 border border-indigo-500/40 rounded-xl space-y-2 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between text-xs font-semibold text-indigo-300">
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
                      <span>{saveStatusText || 'Sedang memproses penyimpanan...'}</span>
                    </div>
                    <span className="font-mono font-bold text-indigo-300">{saveProgress}%</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-indigo-500 h-full rounded-full transition-all duration-200 ease-out"
                      style={{ width: `${saveProgress}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 italic">
                    Koneksi database dikunci sementara untuk mencegah klik berulang &amp; duplikasi data.
                  </p>
                </div>
              )}
            </div>

            <div className="p-3.5 sm:p-4 flex justify-end gap-2 border-t border-slate-800 bg-slate-950/90 shrink-0">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                disabled={isSaving}
                className="px-4 py-2.5 border border-slate-700 rounded-xl hover:bg-slate-800 font-semibold text-slate-300 transition cursor-pointer disabled:opacity-40"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold shadow-md shadow-indigo-600/30 transition flex items-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Menyimpan ({saveProgress}%)...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Simpan Pengurus</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    )}

      {/* Modal Konfirmasi Hapus Data dengan Progress Bar */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-md overflow-hidden bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl text-slate-100">
            {/* Header Modal Hapus */}
            <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950/60">
              <div className="flex items-center gap-2.5 text-rose-400 font-bold text-sm">
                <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20">
                  <AlertTriangle className="w-5 h-5 text-rose-400" />
                </div>
                <span>Konfirmasi Hapus Pengurus MPH</span>
              </div>
              <button
                onClick={() => !isDeleting && setDeleteTarget(null)}
                disabled={isDeleting}
                className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition disabled:opacity-40 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Konten Modal Hapus */}
            <div className="p-5 space-y-4">
              <div className="p-3.5 bg-rose-950/30 border border-rose-500/30 rounded-xl space-y-1">
                <p className="text-[10px] text-rose-300 font-bold uppercase tracking-wider">Target Pengurus yang Dihapus:</p>
                <p className="text-sm font-extrabold text-white">{deleteTarget.nama}{deleteTarget.gelar ? `, ${deleteTarget.gelar}` : ''}</p>
                <p className="text-xs font-semibold text-indigo-300">Jabatan: {deleteTarget.jabatan}</p>
                <p className="text-xs font-mono text-slate-400">Periode: {deleteTarget.periode}</p>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                Apakah Anda yakin ingin menghapus data pengurus ini? Data yang telah dihapus akan diperbarui langsung di laporan MPH.
              </p>

              {/* Progress Bar Hapus (Mencegah Eksekusi Ganda) */}
              {isDeleting && (
                <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/30 space-y-2 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between text-xs text-rose-300 font-semibold">
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-rose-400 shrink-0" />
                      <span>Menghapus data &amp; memperbarui database...</span>
                    </div>
                    <span className="font-mono text-rose-300 font-bold">{deleteProgress}%</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-rose-500 h-full transition-all duration-150 rounded-full"
                      style={{ width: `${deleteProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Tombol Aksi Hapus */}
              <div className="pt-2 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setDeleteTarget(null)}
                  disabled={isDeleting}
                  className="px-4 py-2 border border-slate-700 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-800 transition disabled:opacity-40 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleExecuteDelete}
                  disabled={isDeleting}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold shadow-md shadow-rose-600/30 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Menghapus ({deleteProgress}%)...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      <span>Ya, Hapus Data</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
