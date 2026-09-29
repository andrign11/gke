import React, { useState } from 'react';
import {
  FileCheck2,
  FileText,
  Plus,
  Printer,
  Search,
  Edit2,
  Trash2,
  X,
  CheckCircle2,
  Clock,
  Heart,
  Upload,
  RefreshCw,
  Archive,
  Building2,
  User,
  MapPin,
  CheckSquare,
  Square,
  AlertCircle,
  Eye,
  RotateCcw,
  Copy,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { PelayananSakramen } from '../../types';
import { DeleteConfirmModal } from '../DeleteConfirmModal';

const getFormattedMajelis = (namaJemaat?: string): string => {
  if (!namaJemaat) return 'MAJELIS JEMAAT GKE';
  const str = namaJemaat.trim();
  const upper = str.toUpperCase();
  if (upper.startsWith('MAJELIS JEMAAT GKE')) return upper;
  if (upper.startsWith('MAJELIS JEMAAT')) return `MAJELIS JEMAAT GKE ${upper.substring(14).trim()}`;
  if (upper.startsWith('MAJELIS')) return `MAJELIS JEMAAT GKE ${upper.substring(7).trim()}`;
  if (upper.startsWith('JEMAAT GKE')) return `MAJELIS ${upper}`;
  if (upper.startsWith('GKE')) return `MAJELIS JEMAAT ${upper}`;
  return `MAJELIS JEMAAT GKE ${upper}`;
};

const getFormattedResort = (resort?: string): string => {
  if (!resort) return 'RESORT GKE';
  const str = resort.trim();
  const upper = str.toUpperCase();
  if (upper.startsWith('RESORT GKE')) return upper;
  if (upper.startsWith('RESORT')) return `RESORT GKE ${upper.substring(6).trim()}`;
  return `RESORT GKE ${upper}`;
};

export const SuratPelimpahanModule: React.FC = () => {
  const {
    pelayananSakramenList,
    addPelayananSakramen,
    updatePelayananSakramen,
    deletePelayananSakramen,
    archivePelayananSuratKeAgenda,
    unarchivePelayananSuratKeAgenda,
    openPrintReport,
    currentUser,
    agendaSuratList,
    settings,
    showToast,
  } = useApp();

  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('semua');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PelayananSakramen | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PelayananSakramen | null>(null);
  const [unarchiveTarget, setUnarchiveTarget] = useState<PelayananSakramen | null>(null);
  const [selectedArchivedInfo, setSelectedArchivedInfo] = useState<PelayananSakramen | null>(null);
  const [isUnarchiving, setIsUnarchiving] = useState(false);
  const [isArchivingId, setIsArchivingId] = useState<string | null>(null);

  // Confirmation & Progress State for double-submit prevention
  const [isConfirmSaveModalOpen, setIsConfirmSaveModalOpen] = useState(false);
  const [saveProgress, setSaveProgress] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  const isItemArchived = React.useCallback(
    (item: PelayananSakramen): boolean => {
      if (item.tersimpanKeAgendaSurat) return true;
      const canonicalAgendaId = `srt-sakramen-${item.id}`;
      return agendaSuratList.some(
        (a) =>
          a.id === canonicalAgendaId ||
          a.id.includes(item.id) ||
          (Boolean(item.noSuratResmi) &&
            a.noSurat?.trim().toLowerCase() === item.noSuratResmi?.trim().toLowerCase())
      );
    },
    [agendaSuratList]
  );

  const isManagementRole =
    currentUser?.role === 'admin' ||
    currentUser?.role === 'sekretaris' ||
    currentUser?.role === 'bendahara';

  const defaultNasKhotbah = 'MARKUS 10 : 9';
  const defaultIsiNas = 'Sebab itu, apa yang telah dipersatukan Allah, tidak boleh diceraikan manusia.';

  const generateAutoNoSurat = (targetDate?: string) => {
    const targetD = targetDate ? new Date(targetDate) : new Date();
    const currentYear = isNaN(targetD.getTime()) ? new Date().getFullYear() : targetD.getFullYear();
    const currentMonth = isNaN(targetD.getTime()) ? new Date().getMonth() : targetD.getMonth();

    // Mengikuti tiga nomor urut awal dari Buku Register Surat Keluar (agendaSuratList) pada tahun yang sama
    const outgoingList = agendaSuratList.filter((s) => {
      if (s.jenis !== 'surat_keluar') return false;
      const y = s.tanggalSurat ? new Date(s.tanggalSurat).getFullYear() : currentYear;
      return y === currentYear;
    });

    let maxNum = 0;
    outgoingList.forEach((s) => {
      const match = (s.noSurat || s.noAgenda || '').match(/^(\d+)\//);
      if (match) {
        const parsed = parseInt(match[1], 10);
        if (!isNaN(parsed) && parsed > maxNum) {
          maxNum = parsed;
        }
      }
    });

    // Periksa juga nomor urut dari surat pelimpahan / sakramen nikah yang ada di tahun yang sama
    const nikahList = pelayananSakramenList.filter((s) => {
      if (s.jenisPelayanan !== 'nikah') return false;
      const y = s.tanggalPelayanan
        ? new Date(s.tanggalPelayanan).getFullYear()
        : s.noSuratResmi?.match(/\/(\d{4})$/)
        ? parseInt(s.noSuratResmi.match(/\/(\d{4})$/)![1], 10)
        : currentYear;
      return y === currentYear;
    });

    nikahList.forEach((s) => {
      const match = (s.noSuratResmi || '').match(/^(\d+)\//);
      if (match) {
        const parsed = parseInt(match[1], 10);
        if (!isNaN(parsed) && parsed > maxNum) {
          maxNum = parsed;
        }
      }
    });

    const nextNum = maxNum + 1;
    const count = String(nextNum).padStart(3, '0');
    const monthRoman = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'][
      currentMonth
    ];
    const year = currentYear;
    const kodeOrg = settings.kodeOrganisasiPenomoran || 'MPH-MJ.GKE';
    const kodeJemaat =
      settings.kodeJemaatPenomoran ||
      (settings.namaJemaat
        ? settings.namaJemaat.replace(/[^A-Za-z]/g, '').slice(0, 3).toUpperCase()
        : 'PR');
    return `${count}/${kodeOrg}/${kodeJemaat}/SPPN/${monthRoman}/${year}`;
  };

  const createInitialFormData = (): Omit<PelayananSakramen, 'id' | 'tersimpanKeAgendaSurat'> => ({
    jenisPelayanan: 'nikah',
    noSuratResmi: generateAutoNoSurat(),
    tanggalPelayanan: new Date().toISOString().split('T')[0],
    tempatPelayanan: settings.namaJemaat ? `Gereja GKE ${settings.namaJemaat}` : 'Gedung Gereja GKE',
    pelayanFirman: settings.namaKetuaJemaat || '',
    jabatanPelayan: 'Pendeta Jemaat GKE',
    namaUtama: '',
    tempatTanggalLahir: '',
    alamatUtama: '',
    namaPasangan: '',
    tempatTanggalLahirPasangan: '',
    alamatPasangan: '',
    fotoCoupleUrl: '',
    namaAyah: '',
    namaIbu: '',
    namaAyahPasangan: '',
    namaIbuPasangan: '',
    saksi1: '',
    saksi2: '',
    majelisJemaat: getFormattedMajelis(settings.namaJemaat),
    resortGke: getFormattedResort(settings.resortGke),
    nasKhotbah: defaultNasKhotbah,
    isiNasKhotbah: defaultIsiNas,
    tempatDikeluarkan: settings.tempatDiterbitkan || '',
    tanggalDikeluarkan: new Date().toISOString().split('T')[0],
    ketuaMajelis: settings.namaKetuaJemaat || '',
    sekretarisMajelis: settings.namaSekretaris || '',
    penerimaSurat: '',
    tujuanDi: 'Tempat.',
    jemaatAsalPria: settings.namaJemaat ? `GKE ${settings.namaJemaat}` : '',
    jemaatAsalWanita: '',
    pekerjaanPria: '',
    pekerjaanWanita: '',
    tanggalRencanaIbadahSyukur: '',
    jemaatTujuanPelayanan: '',
    tembusanSurat: '1. Majelis Jemaat GKE Tujuan\n2. Calon Mempelai\n3. Arsip Sekretariat',
    status: 'Disetujui & Diterbitkan',
    catatanPastoral: 'Surat Pelimpahan Peneguhan dan Pemberkatan Nikah diterbitkan resmi untuk pelayanan di resort/gereja lain.',
    scanSuratPelimpahanUrl: '',
    checklistPelimpahan: {
      aktaBaptis: true,
      aktaSidi: true,
      suratPengantarRayon: true,
      suratBebasKomitmen: true,
      pasFotoPasangan: true,
      ktpKkMempelai: true,
    },
  });

  const [formData, setFormData] = useState<Omit<PelayananSakramen, 'id' | 'tersimpanKeAgendaSurat'>>(
    createInitialFormData()
  );

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormData(createInitialFormData());
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: PelayananSakramen) => {
    setEditingItem(item);
    setFormData({
      ...item,
      majelisJemaat: item.majelisJemaat !== undefined && item.majelisJemaat !== '' ? item.majelisJemaat : getFormattedMajelis(settings.namaJemaat),
      resortGke: item.resortGke !== undefined && item.resortGke !== '' ? item.resortGke : getFormattedResort(settings.resortGke),
      ketuaMajelis: item.ketuaMajelis || settings.namaKetuaJemaat || '',
      sekretarisMajelis: item.sekretarisMajelis || settings.namaSekretaris || '',
      tempatDikeluarkan: item.tempatDikeluarkan || settings.tempatDiterbitkan || settings.namaJemaat || '',
      checklistPelimpahan: item.checklistPelimpahan || {
        aktaBaptis: true,
        aktaSidi: true,
        suratPengantarRayon: true,
        suratBebasKomitmen: true,
        pasFotoPasangan: true,
        ktpKkMempelai: true,
      },
    });
    setIsModalOpen(true);
  };

  const handlePreSaveClick = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.namaUtama || !formData.noSuratResmi) {
      alert('Mohon lengkapi Nama Mempelai Utama dan Nomor Surat Resmi!');
      return;
    }
    setIsConfirmSaveModalOpen(true);
  };

  const handleConfirmSave = async () => {
    setIsSaving(true);
    setSaveProgress(30);

    try {
      if (editingItem) {
        await updatePelayananSakramen(editingItem.id, formData);
      } else {
        await addPelayananSakramen(formData);
      }
      setSaveProgress(100);
    } catch (err) {
      console.error('Error saving Surat Pelimpahan:', err);
    } finally {
      setTimeout(() => {
        setIsSaving(false);
        setIsConfirmSaveModalOpen(false);
        setIsModalOpen(false);
        setEditingItem(null);
        setSaveProgress(0);
      }, 200);
    }
  };

  const handleArchiveToAgenda = async (item: PelayananSakramen) => {
    setIsArchivingId(item.id);
    try {
      await archivePelayananSuratKeAgenda(item);
      showToast.success(
        `Surat Pelimpahan No. ${item.noSuratResmi || '-'} berhasil diarsipkan ke Buku Agenda Surat Keluar!`,
        'Arsip Berhasil'
      );
    } catch (err: any) {
      console.error('Error archiving surat pelimpahan:', err);
      showToast.error(err?.message || 'Gagal mengarsipkan surat ke Agenda Surat Keluar', 'Gagal Arsip');
    } finally {
      setIsArchivingId(null);
    }
  };

  const handleConfirmUnarchive = async () => {
    if (!unarchiveTarget) return;
    setIsUnarchiving(true);
    try {
      await unarchivePelayananSuratKeAgenda(unarchiveTarget.id);
      showToast.info('Status pengarsipan surat berhasil dibatalkan dari Agenda Surat Keluar.', 'Reset Status Arsip');
    } catch (err: any) {
      console.error('Error resetting archive status:', err);
      showToast.error(err?.message || 'Gagal membatalkan status arsip surat', 'Error');
    } finally {
      setIsUnarchiving(false);
      setUnarchiveTarget(null);
    }
  };

  // Filter list to only show nikah items or items with pelimpahan notes/recipients
  const pelimpahanList = pelayananSakramenList.filter((item) => {
    if (item.jenisPelayanan !== 'nikah') return false;
    const matchStatus = filterStatus === 'semua' || item.status === filterStatus;
    const q = search.toLowerCase();
    const matchQuery =
      (item.namaUtama || item.namaYangDilayani || '').toLowerCase().includes(q) ||
      (item.namaPasangan && item.namaPasangan.toLowerCase().includes(q)) ||
      (item.noSuratResmi || '').toLowerCase().includes(q) ||
      (item.penerimaSurat && item.penerimaSurat.toLowerCase().includes(q)) ||
      (item.jemaatTujuanPelayanan && item.jemaatTujuanPelayanan.toLowerCase().includes(q));
    return matchStatus && matchQuery;
  });

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Header & Banner */}
      <div className="bg-gradient-to-r from-amber-900 via-amber-800 to-amber-950 p-6 rounded-2xl text-white shadow-xl border border-amber-700/50 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
          <div className="min-w-0 flex-1">
            <div className="inline-flex items-center gap-2 bg-amber-500/20 text-amber-200 text-xs font-extrabold px-3 py-1 rounded-full border border-amber-400/30 mb-2">
              <FileCheck2 className="w-3.5 h-3.5 text-amber-300" />
              <span>Layanan Pelimpahan Resmi GKE</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Surat Pelimpahan Peneguhan &amp; Pemberkatan Nikah
            </h1>
            <p className="text-amber-100/90 text-xs sm:text-sm mt-1.5 max-w-2xl font-medium leading-relaxed">
              Formulir &amp; tata kelola persuratan resmi khusus untuk Anggota Jemaat GKE yang hendak melangsungkan Peneguhan &amp; Pemberkatan Nikah di Resort / Gereja luar.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={handleOpenAdd}
              className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-amber-950/40 flex items-center gap-2 cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Buat Surat Pelimpahan Baru</span>
            </button>
            <button
              onClick={() =>
                openPrintReport({
                  reportType: 'pelayanan_sakramen_rekap',
                  selectedKategori: 'nikah',
                  filterJenis: 'nikah',
                  customTitle: 'Rekapitulasi Surat Pelimpahan Peneguhan & Pemberkatan Nikah',
                })
              }
              className="bg-white/10 hover:bg-white/20 text-white font-bold text-xs px-3.5 py-2.5 rounded-xl transition-all border border-white/20 flex items-center gap-1.5 cursor-pointer shrink-0"
              title="Cetak Laporan Rekapitulasi Surat Pelimpahan"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Rekap</span>
            </button>
          </div>
        </div>
      </div>

      {/* Control Bar: Search & Filters */}
      <div className="bg-slate-800 p-4 rounded-xl border border-slate-700/80 shadow-md flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama mempelai, no. surat, gereja tujuan..."
            className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder:text-slate-500 outline-none focus:border-amber-500"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          <div className="flex items-center gap-2 text-xs text-slate-400 font-semibold shrink-0">
            <span>Status:</span>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200 px-3 py-1.5 outline-none focus:border-amber-500"
            >
              <option value="semua">Semua Status</option>
              <option value="Permohonan">Permohonan Baru</option>
              <option value="Diproses / Katekisasi">Diproses / Katekisasi</option>
              <option value="Disetujui & Diterbitkan">Disetujui &amp; Diterbitkan</option>
              <option value="Diarsipkan">Diarsipkan</option>
            </select>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="pelimpahan-table-card bg-slate-800 border border-slate-700/80 rounded-2xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="pelimpahan-table w-full text-left text-slate-300 text-xs">
            <thead className="pelimpahan-thead bg-slate-900/95 text-slate-300 uppercase font-extrabold text-[11px] tracking-wider border-b border-slate-700/80">
              <tr>
                <th className="p-3.5">No. Surat Resmi</th>
                <th className="p-3.5">Nama Mempelai Pria &amp; Wanita</th>
                <th className="p-3.5">Gereja / Resort Tujuan</th>
                <th className="p-3.5">Tgl. Diterbitkan</th>
                <th className="p-3.5 text-center">Scan Result</th>
                <th className="p-3.5 text-center">Status</th>
                <th className="p-3.5 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/70 font-medium">
              {pelimpahanList.map((item) => (
                <tr key={item.id} className="pelimpahan-row transition-all duration-150 cursor-pointer">
                  <td className="p-3.5 cell-no-surat">
                    <span className="font-mono font-bold text-amber-400 text-xs block no-surat-pelimpahan">{item.noSuratResmi}</span>
                    <span className="text-[10px] text-slate-400 block subtitle-penerima">Penerima: {item.penerimaSurat || '-'}</span>
                  </td>
                  <td className="p-3.5 cell-mempelai">
                    <div className="font-bold text-white text-sm flex items-center gap-1.5 nama-mempelai">
                      <span>{item.namaUtama}</span>
                      <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500 shrink-0 icon-love" />
                      <span>{item.namaPasangan || '(-) Pasangan'}</span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5 subtitle-rute">
                      {item.jemaatAsalPria || 'Asal GKE'} &rarr; {item.jemaatTujuanPelayanan || 'Gereja Tujuan'}
                    </div>
                  </td>
                  <td className="p-3.5 cell-tujuan">
                    <span className="font-bold text-slate-200 block text-gereja-tujuan">{item.jemaatTujuanPelayanan || '-'}</span>
                    <span className="text-[10px] text-slate-400 block subtitle-rencana">{item.tanggalRencanaIbadahSyukur ? `Rencana: ${item.tanggalRencanaIbadahSyukur}` : ''}</span>
                  </td>
                  <td className="p-3.5 text-slate-300 whitespace-nowrap cell-tanggal">
                    <span className="font-mono font-bold text-slate-200 text-xs block text-tgl-diterbitkan">{item.tanggalDikeluarkan || item.tanggalPelayanan}</span>
                  </td>
                  <td className="p-3.5 text-center whitespace-nowrap cell-scan">
                    {item.scanSuratPelimpahanUrl ? (
                      <a
                        href={item.scanSuratPelimpahanUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="badge-pelimpahan-scan inline-flex items-center gap-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded text-[10px] font-bold hover:bg-emerald-500/30 transition-colors"
                        title="Buka berkas scan surat"
                      >
                        <Eye className="w-3 h-3" />
                        <span>Ada Scan</span>
                      </a>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(item)}
                        className="btn-pelimpahan-upload text-slate-400 hover:text-amber-400 text-[10px] italic transition-colors cursor-pointer hover:underline"
                        title="Klik untuk upload hasil scan surat resmi"
                      >
                        + Upload Scan
                      </button>
                    )}
                  </td>
                  <td className="p-3.5 text-center whitespace-nowrap cell-status">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold shadow-2xs ${
                      item.status === 'Disetujui & Diterbitkan'
                        ? 'badge-pelimpahan-approved bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : item.status === 'Diarsipkan'
                        ? 'badge-pelimpahan-archived bg-purple-500/20 text-purple-300 border border-purple-500/40'
                        : 'badge-pelimpahan-pending bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    }`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="p-3.5 text-center whitespace-nowrap">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        onClick={() => openPrintReport({ reportType: 'surat_pelimpahan_nikah', sakramenId: item.id })}
                        className="p-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 rounded-lg transition-colors border border-amber-500/30 cursor-pointer"
                        title="Cetak Surat Pelimpahan Peneguhan & Pemberkatan Nikah"
                      >
                        <Printer className="w-4 h-4" />
                      </button>

                      {isManagementRole && (
                        <>
                          <button
                            onClick={() => handleOpenEdit(item)}
                            className="p-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg transition-colors cursor-pointer"
                            title="Edit Data Surat Pelimpahan"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          {!isItemArchived(item) ? (
                            <button
                              onClick={() => handleArchiveToAgenda(item)}
                              disabled={isArchivingId === item.id}
                              className="p-1.5 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 rounded-lg transition-colors border border-purple-500/30 cursor-pointer disabled:opacity-50"
                              title="Simpan & Arsipkan Otomatis ke Agenda Surat Keluar"
                            >
                              {isArchivingId === item.id ? (
                                <RefreshCw className="w-4 h-4 animate-spin text-purple-400" />
                              ) : (
                                <Archive className="w-4 h-4" />
                              )}
                            </button>
                          ) : (
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedArchivedInfo(item);
                                  showToast.info(
                                    `Surat No. ${item.noSuratResmi || '-'} telah terarsip resmi di Agenda Surat Keluar.`,
                                    'Status Arsip'
                                  );
                                }}
                                className="p-1.5 bg-emerald-500/10 hover:bg-emerald-500/25 text-emerald-400 rounded-lg border border-emerald-500/30 transition-all cursor-pointer shadow-xs hover:scale-105 active:scale-95"
                                title="Sudah Terarsip di Agenda Surat Keluar (Klik untuk lihat info detail)"
                              >
                                <CheckCircle2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setUnarchiveTarget(item)}
                                disabled={isArchivingId === item.id}
                                className="p-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 rounded-lg transition-colors border border-amber-500/30 cursor-pointer disabled:opacity-50"
                                title="Reset / Batalkan status arsip surat ini"
                              >
                                <RotateCcw className="w-4 h-4" />
                              </button>
                            </div>
                          )}

                          <button
                            onClick={() => setDeleteTarget(item)}
                            className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-lg transition-colors border border-rose-500/30 cursor-pointer"
                            title="Hapus Surat Pelimpahan"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}

              {pelimpahanList.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400 italic">
                    Belum ada data Surat Pelimpahan Nikah yang diterbitkan. Silakan klik tombol "Buat Surat Pelimpahan Baru".
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Main Modal Form for Surat Pelimpahan */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 z-50 overflow-hidden animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-4xl w-full max-h-[92dvh] sm:max-h-[88vh] flex flex-col shadow-2xl my-auto overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 bg-gradient-to-r from-amber-900/80 to-slate-900 border-b border-slate-700/80 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-amber-500/20 text-amber-300 rounded-xl border border-amber-500/30">
                  <FileCheck2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-white text-base sm:text-lg">
                    {editingItem ? 'Edit Surat Pelimpahan Nikah' : 'Form Surat Pelimpahan Peneguhan & Pemberkatan Nikah Baru'}
                  </h3>
                  <p className="text-xs text-amber-200/80">
                    Khusus Anggota Jemaat GKE yang akan Menikah Kudus di luar Resort / Gereja tujuan.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1.5 rounded-lg bg-slate-800 border border-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handlePreSaveClick} className="flex flex-col flex-1 min-h-0 overflow-hidden text-xs text-slate-300">
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 overscroll-contain">
                {/* Section 1: Data Surat & Majelis Asal */}
              <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700 space-y-3">
                <h4 className="font-bold text-amber-400 text-xs uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-700 pb-2">
                  <Building2 className="w-4 h-4 text-amber-400" />
                  <span>1. Data Nomor Surat &amp; Majelis Jemaat Asal</span>
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">
                      Nomor Surat Resmi Pelimpahan <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.noSuratResmi || ''}
                      onChange={(e) => setFormData({ ...formData, noSuratResmi: e.target.value })}
                      required
                      placeholder="e.g. 001/MPH-MJ.GKE/PR/SPPN/XII/2026"
                      className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl font-mono font-bold text-amber-300 outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">
                      Majelis Jemaat Asal GKE <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.majelisJemaat || ''}
                      onChange={(e) => setFormData({ ...formData, majelisJemaat: e.target.value })}
                      required
                      placeholder="e.g. MAJELIS JEMAAT GKE EFATA"
                      className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl font-bold text-white outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Data Mempelai Pria & Wanita */}
              <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700 space-y-4">
                <h4 className="font-bold text-amber-400 text-xs uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-700 pb-2">
                  <User className="w-4 h-4 text-amber-400" />
                  <span>2. Identitas Calon Pasangan Mempelai</span>
                </h4>

                {/* Mempelai Pria */}
                <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-700/80 space-y-3">
                  <span className="font-extrabold text-blue-400 text-xs block">Data Mempelai LAKI-LAKI</span>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-300 mb-1">
                        Nama Lengkap Mempelai Pria <span className="text-rose-400">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.namaUtama || ''}
                        onChange={(e) => setFormData({ ...formData, namaUtama: e.target.value })}
                        required
                        placeholder="Nama lengkap mempelai pria"
                        className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl font-bold text-white outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-300 mb-1">Tempat / Tgl. Lahir</label>
                      <input
                        type="text"
                        value={formData.tempatTanggalLahir || ''}
                        onChange={(e) => setFormData({ ...formData, tempatTanggalLahir: e.target.value })}
                        placeholder="Palangka Raya, 12 Agustus 1998"
                        className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-300 mb-1">Pekerjaan</label>
                      <input
                        type="text"
                        value={formData.pekerjaanPria || ''}
                        onChange={(e) => setFormData({ ...formData, pekerjaanPria: e.target.value })}
                        placeholder="Swasta / PNS / dll"
                        className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-300 mb-1">Jemaat / Gereja Asal</label>
                      <input
                        type="text"
                        value={formData.jemaatAsalPria || ''}
                        onChange={(e) => setFormData({ ...formData, jemaatAsalPria: e.target.value })}
                        placeholder="e.g. GKE Efata Palangka Raya"
                        className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-300 mb-1">Nama Ayah Kandung</label>
                      <input
                        type="text"
                        value={formData.namaAyah || ''}
                        onChange={(e) => setFormData({ ...formData, namaAyah: e.target.value })}
                        placeholder="Nama Ayah"
                        className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-300 mb-1">Nama Ibu Kandung</label>
                      <input
                        type="text"
                        value={formData.namaIbu || ''}
                        onChange={(e) => setFormData({ ...formData, namaIbu: e.target.value })}
                        placeholder="Nama Ibu"
                        className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Mempelai Perempuan */}
                <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-700/80 space-y-3">
                  <span className="font-extrabold text-rose-400 text-xs block">Data Mempelai PEREMPUAN</span>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-300 mb-1">
                        Nama Lengkap Mempelai Perempuan <span className="text-rose-400">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.namaPasangan || ''}
                        onChange={(e) => setFormData({ ...formData, namaPasangan: e.target.value })}
                        required
                        placeholder="Nama lengkap mempelai perempuan"
                        className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl font-bold text-white outline-none focus:border-rose-500"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-300 mb-1">Tempat / Tgl. Lahir</label>
                      <input
                        type="text"
                        value={formData.tempatTanggalLahirPasangan || ''}
                        onChange={(e) => setFormData({ ...formData, tempatTanggalLahirPasangan: e.target.value })}
                        placeholder="Tumbang Talaken, 10 Oktober 1999"
                        className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white outline-none focus:border-rose-500"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-300 mb-1">Pekerjaan</label>
                      <input
                        type="text"
                        value={formData.pekerjaanWanita || ''}
                        onChange={(e) => setFormData({ ...formData, pekerjaanWanita: e.target.value })}
                        placeholder="Swasta / PTT / Dll"
                        className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white outline-none focus:border-rose-500"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-300 mb-1">Jemaat / Gereja Asal</label>
                      <input
                        type="text"
                        value={formData.jemaatAsalWanita || ''}
                        onChange={(e) => setFormData({ ...formData, jemaatAsalWanita: e.target.value })}
                        placeholder="e.g. GKE Bukit Sion Tumbang Talaken 1"
                        className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white outline-none focus:border-rose-500"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-300 mb-1">Nama Ayah Kandung</label>
                      <input
                        type="text"
                        value={formData.namaAyahPasangan || ''}
                        onChange={(e) => setFormData({ ...formData, namaAyahPasangan: e.target.value })}
                        placeholder="Nama Ayah"
                        className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white outline-none focus:border-rose-500"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-300 mb-1">Nama Ibu Kandung</label>
                      <input
                        type="text"
                        value={formData.namaIbuPasangan || ''}
                        onChange={(e) => setFormData({ ...formData, namaIbuPasangan: e.target.value })}
                        placeholder="Nama Ibu"
                        className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white outline-none focus:border-rose-500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 3: Gereja / Resort Tujuan & Pelayanan */}
              <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700 space-y-3">
                <h4 className="font-bold text-amber-400 text-xs uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-700 pb-2">
                  <MapPin className="w-4 h-4 text-amber-400" />
                  <span>3. Tujuan Pelimpahan Nikah (Resort / Gereja Tujuan)</span>
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">
                      Penerima Surat (Kepada Yth.)
                    </label>
                    <input
                      type="text"
                      value={formData.penerimaSurat || ''}
                      onChange={(e) => setFormData({ ...formData, penerimaSurat: e.target.value })}
                      placeholder="e.g. Ketua Majelis Jemaat GKE Bukit Sion Tumbang Talaken 1"
                      className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl font-bold text-white outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">
                      Jemaat / Gereja Tempat Pelaksanaan Ibadah Nikah
                    </label>
                    <input
                      type="text"
                      value={formData.jemaatTujuanPelayanan || ''}
                      onChange={(e) => setFormData({ ...formData, jemaatTujuanPelayanan: e.target.value })}
                      placeholder="e.g. Jemaat GKE Bukit Sion Tumbang Talaken 1"
                      className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl font-bold text-amber-300 outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">Tanggal Rencana Ibadah Syukur / Peneguhan</label>
                    <input
                      type="text"
                      value={formData.tanggalRencanaIbadahSyukur || ''}
                      onChange={(e) => setFormData({ ...formData, tanggalRencanaIbadahSyukur: e.target.value })}
                      placeholder="e.g. 13-14 September 2026"
                      className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">Tembusan Surat</label>
                    <input
                      type="text"
                      value={formData.tembusanSurat || ''}
                      onChange={(e) => setFormData({ ...formData, tembusanSurat: e.target.value })}
                      placeholder="Tembusan..."
                      className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
              </div>

              {/* Section 4: Ceklist Kelengkapan & Scan Surat Result */}
              <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700 space-y-4">
                <h4 className="font-bold text-amber-400 text-xs uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-700 pb-2">
                  <CheckSquare className="w-4 h-4 text-amber-400" />
                  <span>4. Ceklist Kelengkapan &amp; Upload Scan Surat Pelimpahan</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                  {[
                    { key: 'aktaBaptis', label: 'Akta Baptis Mempelai Pria & Wanita' },
                    { key: 'aktaSidi', label: 'Akta Sidi Mempelai Pria & Wanita' },
                    { key: 'suratPengantarRayon', label: 'Surat Pengantar dari Lingkungan/Sektor' },
                    { key: 'suratBebasKomitmen', label: 'Surat Pelimpahan' },
                    { key: 'pasFotoPasangan', label: 'Pas Foto Pasangan 4x6 (Berwarna)' },
                    { key: 'ktpKkMempelai', label: 'Fotokopi KTP & KK Mempelai' },
                  ].map((chk) => {
                    const isChecked = !!formData.checklistPelimpahan?.[chk.key as keyof typeof formData.checklistPelimpahan];
                    return (
                      <button
                        type="button"
                        key={chk.key}
                        onClick={() =>
                          setFormData({
                            ...formData,
                            checklistPelimpahan: {
                              ...formData.checklistPelimpahan,
                              [chk.key]: !isChecked,
                            },
                          })
                        }
                        className={`p-2.5 rounded-xl border flex items-center gap-2 text-left transition-all cursor-pointer ${
                          isChecked
                            ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-200'
                            : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {isChecked ? (
                          <CheckSquare className="w-4 h-4 text-emerald-400 shrink-0" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-500 shrink-0" />
                        )}
                        <span className="text-[11px] font-semibold leading-tight">{chk.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Upload Scan Surat */}
                <div className="p-3.5 bg-slate-900/80 rounded-xl border border-slate-700 space-y-2">
                  <label className="block font-bold text-amber-300 text-xs">
                    Hasil Scan Surat Pelimpahan Peneguhan &amp; Pemberkatan Nikah (Resmi TTD/Stempel)
                  </label>
                  <div className="flex flex-col sm:flex-row items-center gap-3">
                    <input
                      type="text"
                      value={formData.scanSuratPelimpahanUrl || ''}
                      onChange={(e) => setFormData({ ...formData, scanSuratPelimpahanUrl: e.target.value })}
                      placeholder="Tempel URL scan atau upload file di bawah..."
                      className="flex-1 p-2 bg-slate-900 border border-slate-700 rounded-lg text-xs font-mono text-amber-300 outline-none focus:border-amber-500 w-full"
                    />
                    <label className="cursor-pointer bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-bold px-3.5 py-2 rounded-lg border border-amber-500/40 transition-all flex items-center gap-1.5 shrink-0">
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload Scan TTD</span>
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (uploadEvent) => {
                              if (uploadEvent.target?.result) {
                                setFormData({
                                  ...formData,
                                  scanSuratPelimpahanUrl: uploadEvent.target.result as string,
                                });
                              }
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </label>
                  </div>
                  {formData.scanSuratPelimpahanUrl && (
                    <div className="flex items-center gap-2 pt-1 text-[11px]">
                      <span className="text-emerald-400 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> File scan surat siap disimpan
                      </span>
                      <a
                        href={formData.scanSuratPelimpahanUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-amber-400 hover:underline font-bold"
                      >
                        Pratinjau File
                      </a>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, scanSuratPelimpahanUrl: '' })}
                        className="text-rose-400 hover:underline font-bold"
                      >
                        Hapus
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Section 5: Pengeluaran Surat & TTD Majelis (LOADED AUTOMATICALLY FROM SETTINGS) */}
              <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-700 pb-2">
                  <h4 className="font-bold text-amber-400 text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-amber-400" />
                    <span>5. Pengeluaran Surat &amp; Penandatangan Majelis Jemaat</span>
                  </h4>
                  <button
                    type="button"
                    onClick={() =>
                      setFormData({
                        ...formData,
                        ketuaMajelis: settings.namaKetuaJemaat || formData.ketuaMajelis,
                        sekretarisMajelis: settings.namaSekretaris || formData.sekretarisMajelis,
                        tempatDikeluarkan: settings.tempatDiterbitkan || formData.tempatDikeluarkan,
                      })
                    }
                    className="text-[11px] font-bold text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 px-2.5 py-1 rounded-lg border border-amber-500/30 transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Sesuai Pejabat Pengaturan</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">Dikeluarkan di (Tempat)</label>
                    <input
                      type="text"
                      value={formData.tempatDikeluarkan || ''}
                      onChange={(e) => setFormData({ ...formData, tempatDikeluarkan: e.target.value })}
                      className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl font-bold text-white outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">Tanggal Surat Diterbitkan</label>
                    <input
                      type="date"
                      value={formData.tanggalDikeluarkan || ''}
                      onChange={(e) => setFormData({ ...formData, tanggalDikeluarkan: e.target.value })}
                      className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl font-bold text-white outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">Nama Ketua Majelis Jemaat</label>
                    <input
                      type="text"
                      value={formData.ketuaMajelis || ''}
                      onChange={(e) => setFormData({ ...formData, ketuaMajelis: e.target.value })}
                      placeholder="Nama Ketua Majelis"
                      className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl font-bold text-amber-300 outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">Nama Sekretaris Majelis Jemaat</label>
                    <input
                      type="text"
                      value={formData.sekretarisMajelis || ''}
                      onChange={(e) => setFormData({ ...formData, sekretarisMajelis: e.target.value })}
                      placeholder="Nama Sekretaris Majelis"
                      className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl font-bold text-amber-300 outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Submit Action Button */}
            <div className="p-3.5 sm:p-4 bg-slate-950 border-t border-slate-700 flex items-center justify-end gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl border border-slate-700 transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black rounded-xl transition-all shadow-lg shadow-amber-950/50 cursor-pointer flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Simpan Data</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    )}

      {/* Confirmation & Animated Progress Bar Modal */}
      {isConfirmSaveModalOpen && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 border-b border-slate-700 pb-3">
              <div className="p-2.5 bg-amber-500/20 text-amber-400 rounded-xl border border-amber-500/30">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-black text-white text-base">Konfirmasi Simpan Surat Pelimpahan</h3>
                <p className="text-xs text-slate-400">Pastikan seluruh data mempelai &amp; surat sudah valid.</p>
              </div>
            </div>

            <div className="p-3.5 bg-slate-900/90 rounded-xl border border-slate-700/80 space-y-2 text-xs text-slate-300">
              <div className="flex justify-between">
                <span className="text-slate-400">Mempelai Pria:</span>
                <span className="font-bold text-white">{formData.namaUtama}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Mempelai Wanita:</span>
                <span className="font-bold text-white">{formData.namaPasangan || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Gereja Tujuan:</span>
                <span className="font-bold text-amber-300">{formData.jemaatTujuanPelayanan || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Nomor Surat:</span>
                <span className="font-mono text-slate-200">{formData.noSuratResmi}</span>
              </div>
            </div>

            {/* Animated Progress Bar during save */}
            {isSaving && (
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between text-xs font-bold text-amber-400">
                  <span>Memproses &amp; Menyimpan Data...</span>
                  <span>{saveProgress}%</span>
                </div>
                <div className="w-full bg-slate-700 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-amber-500 to-amber-300 h-full transition-all duration-300"
                    style={{ width: `${saveProgress}%` }}
                  />
                </div>
              </div>
            )}

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsConfirmSaveModalOpen(false)}
                disabled={isSaving}
                className="flex-1 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold text-xs rounded-xl transition-all cursor-pointer min-h-[44px]"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmSave}
                disabled={isSaving}
                className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl transition-all shadow-lg shadow-amber-500/20 cursor-pointer min-h-[44px] flex items-center justify-center gap-2"
              >
                {isSaving ? (
                  <span>Menyimpan...</span>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Ya, Simpan</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={!!deleteTarget}
        title="Konfirmasi Hapus Surat Pelimpahan Nikah"
        itemName={deleteTarget ? `Surat Pelimpahan Nikah an. ${deleteTarget.namaUtama} & ${deleteTarget.namaPasangan || '-'}` : ''}
        onConfirm={async () => {
          if (deleteTarget) {
            await deletePelayananSakramen(deleteTarget.id);
          }
        }}
        onClose={() => setDeleteTarget(null)}
      />

      {/* Modal Confirm Reset Archive Status */}
      {unarchiveTarget && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-md p-5 sm:p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
                <RotateCcw className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-black text-slate-100 text-base leading-tight">
                  Konfirmasi Reset Arsip Surat Pelimpahan
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Kembalikan status surat ke belum diarsipkan
                </p>
              </div>
            </div>

            <div className="bg-slate-800/80 rounded-xl p-3.5 border border-slate-700 space-y-2 text-xs">
              <div className="flex justify-between border-b border-slate-700/60 pb-1.5">
                <span className="text-slate-400">Jenis Dokumen:</span>
                <span className="font-bold text-slate-200 uppercase">
                  Surat Pelimpahan Nikah
                </span>
              </div>
              <div className="flex justify-between border-b border-slate-700/60 pb-1.5">
                <span className="text-slate-400">Nama Pasangan:</span>
                <span className="font-bold text-slate-100 text-right">
                  {unarchiveTarget.namaUtama} & {unarchiveTarget.namaPasangan || '-'}
                </span>
              </div>
              <div className="flex justify-between border-b border-slate-700/60 pb-1.5">
                <span className="text-slate-400">Nomor Surat:</span>
                <span className="font-mono font-semibold text-amber-300">
                  {unarchiveTarget.noSuratResmi || '-'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Tanggal Pelayanan:</span>
                <span className="font-medium text-slate-300">
                  {unarchiveTarget.tanggalPelayanan}
                </span>
              </div>
            </div>

            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-xs text-amber-200 leading-relaxed flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span>
                Status pengarsipan akan dikembalikan menjadi <strong>Belum Diarsipkan</strong> dan pencatatan nomor surat terkait pada <strong>Buku Agenda Surat Keluar</strong> akan dihapus.
              </span>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setUnarchiveTarget(null)}
                disabled={isUnarchiving}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition-all cursor-pointer min-h-[44px] border border-slate-700"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmUnarchive}
                disabled={isUnarchiving}
                className="flex-1 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-black text-xs rounded-xl transition-all shadow-lg shadow-amber-600/30 cursor-pointer min-h-[44px] flex items-center justify-center gap-2"
              >
                {isUnarchiving ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Memproses...</span>
                  </>
                ) : (
                  <>
                    <RotateCcw className="w-4 h-4" />
                    <span>Ya, Reset Arsip</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Informasi Arsip Dokumen Modal */}
      {selectedArchivedInfo && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-emerald-500/40 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl relative">
            <button
              type="button"
              onClick={() => setSelectedArchivedInfo(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30 shrink-0">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-white">Status Arsip Dokumen Resmi</h3>
                <p className="text-xs text-emerald-300 font-medium">Tercatat &amp; Terarsip di Buku Agenda Surat Keluar</p>
              </div>
            </div>

            <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-4 space-y-3 text-xs">
              <div className="flex justify-between items-center pb-2 border-b border-slate-700">
                <span className="text-slate-400">Nomor Surat Resmi:</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                    {selectedArchivedInfo.noSuratResmi || '-'}
                  </span>
                  {selectedArchivedInfo.noSuratResmi && (
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(selectedArchivedInfo.noSuratResmi || '');
                        showToast.success('Nomor surat berhasil disalin ke clipboard!', 'Disalin');
                      }}
                      className="p-1 hover:bg-slate-700 text-slate-400 hover:text-slate-200 rounded transition cursor-pointer"
                      title="Salin Nomor Surat"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              <div className="flex justify-between items-center pb-2 border-b border-slate-700">
                <span className="text-slate-400">Calon Mempelai:</span>
                <span className="font-bold text-white text-right">
                  {selectedArchivedInfo.namaUtama} &amp; {selectedArchivedInfo.namaPasangan || '-'}
                </span>
              </div>

              <div className="flex justify-between items-center pb-2 border-b border-slate-700">
                <span className="text-slate-400">Tujuan Pelayanan:</span>
                <span className="font-medium text-slate-200 text-right">
                  {selectedArchivedInfo.jemaatTujuanPelayanan || selectedArchivedInfo.penerimaSurat || '-'}
                </span>
              </div>

              <div className="flex justify-between items-center pb-2 border-b border-slate-700">
                <span className="text-slate-400">Tanggal Dikeluarkan:</span>
                <span className="font-medium text-slate-200">
                  {selectedArchivedInfo.tanggalDikeluarkan || selectedArchivedInfo.tanggalPelayanan || '-'}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-400">Status Dokumen:</span>
                <span className="inline-flex items-center gap-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-0.5 rounded-full font-bold text-[10px]">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>{selectedArchivedInfo.status || 'Disetujui & Diterbitkan'}</span>
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  const targetId = selectedArchivedInfo.id;
                  setSelectedArchivedInfo(null);
                  openPrintReport({ reportType: 'surat_pelimpahan_nikah', sakramenId: targetId });
                }}
                className="flex-1 min-w-[130px] py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl transition-all shadow-lg shadow-amber-500/20 cursor-pointer min-h-[44px] flex items-center justify-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak Surat</span>
              </button>

              {isManagementRole && (
                <button
                  type="button"
                  onClick={() => {
                    const target = selectedArchivedInfo;
                    setSelectedArchivedInfo(null);
                    setUnarchiveTarget(target);
                  }}
                  className="py-2.5 px-3 bg-slate-800 hover:bg-amber-500/10 hover:text-amber-300 text-slate-300 border border-slate-700 hover:border-amber-500/30 font-bold text-xs rounded-xl transition-all cursor-pointer min-h-[44px] flex items-center justify-center gap-1.5"
                  title="Batalkan/Reset status pengarsipan"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                  <span>Reset Arsip</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setSelectedArchivedInfo(null)}
                className="py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition-all cursor-pointer min-h-[44px] border border-slate-700"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
