import React, { useState } from 'react';
import {
  Archive,
  Award,
  CheckCircle2,
  Clock,
  FileCheck,
  FileText,
  Filter,
  Heart,
  HeartHandshake,
  Plus,
  Printer,
  RefreshCw,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  Trash2,
  User,
  Users,
  X,
  Upload,
  Eye,
  CheckSquare,
  Square,
  AlertCircle,
  RotateCcw,
  Download,
  FileSpreadsheet,
  ChevronDown,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { PelayananSakramen } from '../../types';
import { DeleteConfirmModal } from '../DeleteConfirmModal';
import { ImportPelayananSakramenModal } from './ImportPelayananSakramenModal';
import {
  exportSakramenToExcel,
  exportSakramenToCsv,
  downloadSakramenTemplateExcel,
} from '../../utils/sakramenExcelUtils';

const getFormattedMajelis = (namaJemaat?: string): string => {
  if (!namaJemaat) return 'Majelis Jemaat GKE';
  const str = namaJemaat.trim();
  const upper = str.toUpperCase();
  if (upper.startsWith('MAJELIS JEMAAT GKE')) return str;
  if (upper.startsWith('MAJELIS JEMAAT')) return `Majelis Jemaat GKE ${str.substring(14).trim()}`;
  if (upper.startsWith('MAJELIS')) return `Majelis Jemaat GKE ${str.substring(7).trim()}`;
  if (upper.startsWith('JEMAAT GKE')) return `Majelis ${str}`;
  if (upper.startsWith('GKE')) return `Majelis Jemaat ${str}`;
  return `Majelis Jemaat GKE ${str}`;
};

const getFormattedResort = (resort?: string): string => {
  if (!resort) return 'Resort GKE';
  const str = resort.trim();
  const upper = str.toUpperCase();
  if (upper.startsWith('RESORT GKE')) return str;
  if (upper.startsWith('RESORT')) return `Resort GKE ${str.substring(6).trim()}`;
  return `Resort GKE ${str}`;
};

export const PelayananSakramenModule: React.FC = () => {
  const {
    activeTab,
    pelayananSakramenList,
    addPelayananSakramen,
    importBatchPelayananSakramen,
    updatePelayananSakramen,
    deletePelayananSakramen,
    archivePelayananSuratKeAgenda,
    unarchivePelayananSuratKeAgenda,
    openPrintReport,
    currentUser,
    agendaSuratList,
    settings,
  } = useApp();

  const [search, setSearch] = useState('');
  const [filterJenis, setFilterJenis] = useState<'semua' | 'baptis' | 'sidi' | 'nikah'>('semua');
  const [filterStatus, setFilterStatus] = useState<string>('semua');
  const [filterArsip, setFilterArsip] = useState<'semua' | 'terarsip' | 'belum'>('semua');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isExportDropdownOpen, setIsExportDropdownOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PelayananSakramen | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PelayananSakramen | null>(null);
  const [unarchiveTarget, setUnarchiveTarget] = useState<PelayananSakramen | null>(null);
  const [isUnarchiving, setIsUnarchiving] = useState(false);
  const [isArchivingId, setIsArchivingId] = useState<string | null>(null);

  // Confirmation & Progress State for double-submit prevention
  const [isConfirmSaveOpen, setIsConfirmSaveOpen] = useState(false);
  const [saveProgress, setSaveProgress] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  // Helper to reliably check if a sakramen item is archived in agenda_surat
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

  React.useEffect(() => {
    if (activeTab === 'surat_pelimpahan_nikah') {
      setFilterJenis('nikah');
    }
  }, [activeTab]);

  // Form state
  const [formData, setFormData] = useState<Omit<PelayananSakramen, 'id' | 'tersimpanKeAgendaSurat'>>({
    jenisPelayanan: 'nikah',
    noSuratResmi: '',
    tanggalPelayanan: new Date().toISOString().split('T')[0],
    tempatPelayanan: settings.namaJemaat ? `Gereja GKE ${settings.namaJemaat}` : 'Gedung Gereja GKE',
    pelayanFirman: settings.namaKetuaJemaat || '',
    jabatanPelayan: 'Pendeta Jemaat GKE',
    namaUtama: '',
    tempatTanggalLahir: '',
    namaPasangan: '',
    namaAyah: '',
    namaIbu: '',
    namaAyahPasangan: '',
    namaIbuPasangan: '',
    saksi1: '',
    saksi2: '',
    majelisJemaat: getFormattedMajelis(settings.namaJemaat),
    resortGke: getFormattedResort(settings.resortGke),
    nasKhotbah: 'MARKUS 10 : 15 - 16',
    isiNasKhotbah: 'Aku berkata kepadamu: Sesungguhnya barang siapa tidak menyambut Kerajaan Allah seperti seorang anak kecil, ia tidak akan masuk ke dalamnya.',
    tempatDikeluarkan: settings.tempatDiterbitkan || '',
    tanggalDikeluarkan: new Date().toISOString().split('T')[0],
    ketuaMajelis: settings.namaKetuaJemaat || '',
    sekretarisMajelis: settings.namaSekretaris || '',
    status: 'Disetujui & Diterbitkan',
    catatanPastoral: '',
  });

  const isMPHOrAdmin =
    currentUser.role === 'admin' ||
    currentUser.role === 'sekretaris' ||
    currentUser.role === 'bendahara';

  // Calculations & Progress Statistics
  const totalNikah = pelayananSakramenList.filter((s) => s.jenisPelayanan === 'nikah').length;
  const totalBaptis = pelayananSakramenList.filter((s) => s.jenisPelayanan === 'baptis').length;
  const totalSidi = pelayananSakramenList.filter((s) => s.jenisPelayanan === 'sidi').length;
  const totalSemua = pelayananSakramenList.length;

  const nikahTerarsip = pelayananSakramenList.filter((s) => s.jenisPelayanan === 'nikah' && isItemArchived(s)).length;
  const baptisTerarsip = pelayananSakramenList.filter((s) => s.jenisPelayanan === 'baptis' && isItemArchived(s)).length;
  const sidiTerarsip = pelayananSakramenList.filter((s) => s.jenisPelayanan === 'sidi' && isItemArchived(s)).length;
  const totalTerarsip = pelayananSakramenList.filter((s) => isItemArchived(s)).length;

  const nikahBelum = totalNikah - nikahTerarsip;
  const baptisBelum = totalBaptis - baptisTerarsip;
  const sidiBelum = totalSidi - sidiTerarsip;
  const totalBelum = totalSemua - totalTerarsip;

  const nikahPercent = totalNikah > 0 ? Math.round((nikahTerarsip / totalNikah) * 100) : 0;
  const baptisPercent = totalBaptis > 0 ? Math.round((baptisTerarsip / totalBaptis) * 100) : 0;
  const sidiPercent = totalSidi > 0 ? Math.round((sidiTerarsip / totalSidi) * 100) : 0;
  const totalPercent = totalSemua > 0 ? Math.round((totalTerarsip / totalSemua) * 100) : 0;

  const filteredList = pelayananSakramenList.filter((item) => {
    const matchJenis = filterJenis === 'semua' || item.jenisPelayanan === filterJenis;
    const matchStatus = filterStatus === 'semua' || item.status === filterStatus;
    const isArchived = isItemArchived(item);
    const matchArsip =
      filterArsip === 'semua' ||
      (filterArsip === 'terarsip' && isArchived) ||
      (filterArsip === 'belum' && !isArchived);
    const q = search.toLowerCase();
    const matchQuery =
      !search ||
      item.namaUtama.toLowerCase().includes(q) ||
      (item.namaPasangan && item.namaPasangan.toLowerCase().includes(q)) ||
      item.noSuratResmi.toLowerCase().includes(q) ||
      item.pelayanFirman.toLowerCase().includes(q);

    return matchJenis && matchStatus && matchArsip && matchQuery;
  });

  const generateAutoNoSurat = (jenis: 'baptis' | 'sidi' | 'nikah', targetDate?: string) => {
    const targetD = targetDate ? new Date(targetDate) : new Date();
    const currentYear = isNaN(targetD.getTime()) ? new Date().getFullYear() : targetD.getFullYear();
    const currentMonth = isNaN(targetD.getTime()) ? new Date().getMonth() : targetD.getMonth();

    // Filter sakramen dari jenis yang sama khusus pada tahun yang bersangkutan sehingga reset otomatis ke 001 setiap awal tahun
    const list = pelayananSakramenList.filter((s) => {
      if (s.jenisPelayanan !== jenis) return false;
      const y = s.tanggalPelayanan
        ? new Date(s.tanggalPelayanan).getFullYear()
        : s.noSuratResmi?.match(/\/(\d{4})$/)
        ? parseInt(s.noSuratResmi.match(/\/(\d{4})$/)![1], 10)
        : currentYear;
      return y === currentYear;
    });

    let maxNum = 0;
    list.forEach((s) => {
      const match = (s.noSuratResmi || '').match(/^(\d+)\//);
      if (match) {
        const parsed = parseInt(match[1], 10);
        if (!isNaN(parsed) && parsed > maxNum) {
          maxNum = parsed;
        }
      }
    });
    const nextNum = maxNum + 1;
    const numPadded = String(nextNum).padStart(3, '0');
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

    if (jenis === 'baptis') {
      const prefix = settings.prefixSuratBaptis || 'SBK';
      return `${numPadded}/${kodeOrg}/${kodeJemaat}/${prefix}/${monthRoman}/${year}`;
    } else if (jenis === 'sidi') {
      const prefix = settings.prefixSuratSidi || 'SIDI';
      return `${numPadded}/${kodeOrg}/${kodeJemaat}/${prefix}/${monthRoman}/${year}`;
    } else {
      const prefix = settings.prefixSuratNikah || 'SN';
      return `${numPadded}/${kodeOrg}/${kodeJemaat}/${prefix}/${monthRoman}/${year}`;
    }
  };

  const getExampleFormData = (jenis: 'baptis' | 'sidi' | 'nikah') => {
    const defaultNasKhotbah =
      jenis === 'sidi'
        ? '1 TIMOTIUS 6 : 12'
        : jenis === 'baptis'
        ? 'MARKUS 10 : 15 - 16'
        : 'MATIUS 19 : 6';

    const defaultIsiNas =
      jenis === 'sidi'
        ? 'Bertandinglah dalam pertandingan iman yang benar dan rebutlah hidup yang kekal.'
        : jenis === 'baptis'
        ? 'Aku berkata kepadamu: Sesungguhnya barang siapa tidak menyambut Kerajaan Allah seperti seorang anak kecil, ia tidak akan masuk ke dalamnya.'
        : 'Demikianlah mereka bukan lagi dua, melainkan satu. Karena itu, apa yang telah dipersatukan Allah, tidak boleh diceraikan manusia.';

    const baseMajelis = getFormattedMajelis(settings.namaJemaat);
    const baseResort = getFormattedResort(settings.resortGke);
    const baseTempat = settings.namaJemaat ? `Gedung Gereja GKE ${settings.namaJemaat}` : 'Gedung Gereja GKE';

    if (jenis === 'nikah') {
      return {
        jenisPelayanan: 'nikah' as const,
        noSuratResmi: generateAutoNoSurat('nikah'),
        tanggalPelayanan: new Date().toISOString().split('T')[0],
        tempatPelayanan: baseTempat,
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
        majelisJemaat: baseMajelis,
        resortGke: baseResort,
        nasKhotbah: defaultNasKhotbah,
        isiNasKhotbah: defaultIsiNas,
        nasPeringatan: '',
        tempatDikeluarkan: settings.tempatDiterbitkan || settings.namaJemaat || '',
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
        tembusanSurat: '1. Majelis Jemaat GKE Tujuan\n2. Calon Mempelai\n3. Arsip.',
        status: 'Disetujui & Diterbitkan' as const,
        catatanPastoral: '',
      };
    } else if (jenis === 'baptis') {
      return {
        jenisPelayanan: 'baptis' as const,
        noSuratResmi: generateAutoNoSurat('baptis'),
        tanggalPelayanan: new Date().toISOString().split('T')[0],
        tempatPelayanan: baseTempat,
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
        majelisJemaat: baseMajelis,
        resortGke: baseResort,
        nasKhotbah: defaultNasKhotbah,
        isiNasKhotbah: defaultIsiNas,
        nasPeringatan: '',
        tempatDikeluarkan: settings.tempatDiterbitkan || settings.namaJemaat || '',
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
        tembusanSurat: '',
        status: 'Disetujui & Diterbitkan' as const,
        catatanPastoral: '',
      };
    } else {
      return {
        jenisPelayanan: 'sidi' as const,
        noSuratResmi: generateAutoNoSurat('sidi'),
        tanggalPelayanan: new Date().toISOString().split('T')[0],
        tempatPelayanan: baseTempat,
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
        majelisJemaat: baseMajelis,
        resortGke: baseResort,
        nasKhotbah: defaultNasKhotbah,
        isiNasKhotbah: defaultIsiNas,
        nasPeringatan: 'WAHYU 2 : 10b',
        tempatDikeluarkan: settings.tempatDiterbitkan || settings.namaJemaat || '',
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
        tembusanSurat: '',
        status: 'Disetujui & Diterbitkan' as const,
        catatanPastoral: '',
      };
    }
  };

  const handleOpenAdd = (jenis: 'baptis' | 'sidi' | 'nikah' = 'nikah') => {
    setEditingItem(null);
    setFormData(getExampleFormData(jenis));
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: PelayananSakramen) => {
    setEditingItem(item);
    setFormData({
      jenisPelayanan: item.jenisPelayanan,
      noSuratResmi: item.noSuratResmi,
      tanggalPelayanan: item.tanggalPelayanan,
      tempatPelayanan: item.tempatPelayanan,
      pelayanFirman: item.pelayanFirman,
      jabatanPelayan: item.jabatanPelayan || 'Pendeta Jemaat GKE',
      namaUtama: item.namaUtama,
      tempatTanggalLahir: item.tempatTanggalLahir || '',
      alamatUtama: item.alamatUtama || '',
      namaPasangan: item.namaPasangan || '',
      tempatTanggalLahirPasangan: item.tempatTanggalLahirPasangan || '',
      alamatPasangan: item.alamatPasangan || '',
      fotoCoupleUrl: item.fotoCoupleUrl || '',
      namaAyah: item.namaAyah || '',
      namaIbu: item.namaIbu || '',
      namaAyahPasangan: item.namaAyahPasangan || '',
      namaIbuPasangan: item.namaIbuPasangan || '',
      saksi1: item.saksi1 || '',
      saksi2: item.saksi2 || '',
      majelisJemaat: item.majelisJemaat !== undefined && item.majelisJemaat !== '' ? item.majelisJemaat : getFormattedMajelis(settings.namaJemaat),
      resortGke: item.resortGke !== undefined && item.resortGke !== '' ? item.resortGke : getFormattedResort(settings.resortGke),
      nasKhotbah: item.nasKhotbah || (item.jenisPelayanan === 'sidi' ? '1 TIMOTIUS 6 : 12' : 'MATIUS 19 : 6'),
      isiNasKhotbah: item.isiNasKhotbah || '',
      nasPeringatan: item.nasPeringatan || (item.jenisPelayanan === 'sidi' ? 'WAHYU 2 : 10b' : ''),
      tempatDikeluarkan: item.tempatDikeluarkan || settings.tempatDiterbitkan || '',
      tanggalDikeluarkan: item.tanggalDikeluarkan || item.tanggalPelayanan || new Date().toISOString().split('T')[0],
      ketuaMajelis: item.ketuaMajelis || settings.namaKetuaJemaat || '',
      sekretarisMajelis: item.sekretarisMajelis || settings.namaSekretaris || '',
      penerimaSurat: item.penerimaSurat || '',
      tujuanDi: item.tujuanDi || 'Tempat.',
      jemaatAsalPria: item.jemaatAsalPria || (settings.namaJemaat ? `GKE ${settings.namaJemaat}` : ''),
      jemaatAsalWanita: item.jemaatAsalWanita || '',
      pekerjaanPria: item.pekerjaanPria || '',
      pekerjaanWanita: item.pekerjaanWanita || '',
      tanggalRencanaIbadahSyukur: item.tanggalRencanaIbadahSyukur || '',
      jemaatTujuanPelayanan: item.jemaatTujuanPelayanan || 'Jemaat GKE "Bukit Sion" Tumbang Talaken 1',
      tembusanSurat: item.tembusanSurat || '1. Ketua Majelis Jemaat GKE Bukit Sion Tumbang Talaken 1\n2. Calon mempelai\n3. Arsip.',
      status: item.status,
      catatanPastoral: item.catatanPastoral || '',
    });
    setIsModalOpen(true);
  };

  const handlePreSaveClick = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.namaUtama || !formData.noSuratResmi) {
      alert('Mohon isi nama utama dan nomor surat resmi!');
      return;
    }
    setIsConfirmSaveOpen(true);
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
      console.error('Error saving sakramen data:', err);
    } finally {
      setTimeout(() => {
        setIsSaving(false);
        setIsConfirmSaveOpen(false);
        setIsModalOpen(false);
        setEditingItem(null);
        setSaveProgress(0);
      }, 200);
    }
  };

  const handleArchiveToAgenda = async (item: PelayananSakramen) => {
    setIsArchivingId(item.id);
    await archivePelayananSuratKeAgenda(item);
    setIsArchivingId(null);
  };

  const handleConfirmUnarchive = async () => {
    if (!unarchiveTarget) return;
    setIsUnarchiving(true);
    try {
      await unarchivePelayananSuratKeAgenda(unarchiveTarget.id);
    } catch (err) {
      console.error('Error resetting archive status:', err);
    } finally {
      setIsUnarchiving(false);
      setUnarchiveTarget(null);
    }
  };

  const getJenisBadge = (jenis: 'baptis' | 'sidi' | 'nikah') => {
    switch (jenis) {
      case 'nikah':
        return (
          <span className="badge-sakramen-nikah inline-flex items-center gap-1 bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60 text-xs font-bold px-2.5 py-1 rounded-full">
            <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500" />
            <span>Pernikahan Kudus</span>
          </span>
        );
      case 'baptis':
        return (
          <span className="badge-sakramen-baptis inline-flex items-center gap-1 bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800/60 text-xs font-bold px-2.5 py-1 rounded-full">
            <Sparkles className="w-3.5 h-3.5 text-sky-500" />
            <span>Baptisan Kudus</span>
          </span>
        );
      case 'sidi':
        return (
          <span className="badge-sakramen-sidi inline-flex items-center gap-1 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60 text-xs font-bold px-2.5 py-1 rounded-full">
            <Award className="w-3.5 h-3.5 text-indigo-500" />
            <span>Peneguhan Sidi</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 shadow-xl border border-indigo-800/30">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-rose-500/20 text-rose-300 text-xs font-bold px-2.5 py-0.5 rounded-full border border-rose-500/30">
                Pencatatan Resmi Sakramen & Pelayanan
              </span>
              <span className="bg-emerald-500/20 text-emerald-300 text-xs font-bold px-2.5 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1">
                <Archive className="w-3 h-3" />
                Integrated Cloud Archive
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <HeartHandshake className="w-7 h-7 text-rose-400" />
              Pelayanan Menikah, Baptisan Kudus & Peneguhan Sidi
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-2xl">
              Pengelolaan pendaftaran pelayanan ibadah, pencetakan surat piagam resmi sakramen, dan pengarsipan nomor surat ke Buku Agenda Surat Keluar Majelis Jemaat GKE {settings.namaJemaat || 'Efata'}.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
            {/* Tombol Impor Data */}
            <button
              type="button"
              onClick={() => setIsImportModalOpen(true)}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-md shadow-teal-900/20 cursor-pointer"
              title="Impor data sakramen massal dari Excel atau CSV"
            >
              <Upload className="w-4 h-4" />
              <span>Import Data</span>
            </button>

            {/* Tombol Ekspor Data Dropdown */}
            <div className="relative flex-1 md:flex-none">
              <button
                type="button"
                onClick={() => setIsExportDropdownOpen(!isExportDropdownOpen)}
                className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-md shadow-emerald-900/20 cursor-pointer"
                title="Ekspor data sakramen ke Excel atau CSV"
              >
                <Download className="w-4 h-4" />
                <span>Export Data</span>
                <ChevronDown className="w-3.5 h-3.5 opacity-80" />
              </button>

              {isExportDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-20"
                    onClick={() => setIsExportDropdownOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 py-2 z-30 text-xs text-slate-800 dark:text-slate-100 animate-in fade-in zoom-in-95 duration-150">
                    <div className="px-3.5 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Opsi Ekspor Sakramen
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setIsExportDropdownOpen(false);
                        const safeDate = new Date().toISOString().split('T')[0];
                        exportSakramenToExcel(
                          filteredList,
                          settings,
                          `Data_Pelayanan_Sakramen_Filter_${safeDate}.xlsx`
                        );
                      }}
                      className="w-full px-3.5 py-2 text-left hover:bg-slate-100 dark:hover:bg-slate-700/80 flex items-center gap-2.5 font-medium transition cursor-pointer"
                    >
                      <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                      <div>
                        <div>Ekspor Excel Terfilter</div>
                        <div className="text-[10px] text-slate-400">{filteredList.length} data terpilih</div>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsExportDropdownOpen(false);
                        const safeDate = new Date().toISOString().split('T')[0];
                        exportSakramenToExcel(
                          pelayananSakramenList,
                          settings,
                          `Data_Pelayanan_Sakramen_Semua_${safeDate}.xlsx`
                        );
                      }}
                      className="w-full px-3.5 py-2 text-left hover:bg-slate-100 dark:hover:bg-slate-700/80 flex items-center gap-2.5 font-medium transition cursor-pointer"
                    >
                      <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                      <div>
                        <div>Ekspor Seluruh Database</div>
                        <div className="text-[10px] text-slate-400">{pelayananSakramenList.length} total berkas</div>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsExportDropdownOpen(false);
                        const safeDate = new Date().toISOString().split('T')[0];
                        exportSakramenToCsv(
                          filteredList,
                          settings,
                          `Data_Pelayanan_Sakramen_${safeDate}.csv`
                        );
                      }}
                      className="w-full px-3.5 py-2 text-left hover:bg-slate-100 dark:hover:bg-slate-700/80 flex items-center gap-2.5 font-medium transition cursor-pointer"
                    >
                      <Download className="w-4 h-4 text-sky-600" />
                      <div>
                        <div>Ekspor File CSV (.csv)</div>
                        <div className="text-[10px] text-slate-400">Kompatibel Spreadsheet / Database</div>
                      </div>
                    </button>
                    <div className="border-t border-slate-200 dark:border-slate-700 my-1" />
                    <button
                      type="button"
                      onClick={() => {
                        setIsExportDropdownOpen(false);
                        downloadSakramenTemplateExcel();
                      }}
                      className="w-full px-3.5 py-2 text-left text-teal-700 dark:text-teal-400 hover:bg-slate-100 dark:hover:bg-slate-700/80 flex items-center gap-2.5 font-semibold transition cursor-pointer"
                    >
                      <Download className="w-4 h-4" />
                      <div>
                        <div>Unduh Template Impor Excel</div>
                        <div className="text-[10px] opacity-75">Format resmi untuk input data</div>
                      </div>
                    </button>
                  </div>
                </>
              )}
            </div>

            <button
              onClick={() => {
                const nikahItem = pelayananSakramenList.find((s) => s.jenisPelayanan === 'nikah');
                openPrintReport({
                  reportType: 'surat_pelimpahan_nikah',
                  sakramenId: nikahItem?.id,
                });
              }}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-md shadow-amber-900/20"
            >
              <FileText className="w-4 h-4" />
              <span>Cetak Surat Pelimpahan Nikah</span>
            </button>
            <button
              onClick={() =>
                openPrintReport({
                  reportType: 'pelayanan_sakramen_rekap',
                  selectedKategori: filterJenis !== 'semua' ? filterJenis : undefined,
                })
              }
              className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs font-semibold px-4 py-2.5 rounded-xl border border-slate-700 transition-all shadow-sm"
            >
              <Printer className="w-4 h-4 text-slate-300" />
              <span>Cetak Rekap Pelayanan</span>
            </button>
            {isMPHOrAdmin && (
              <button
                onClick={() => handleOpenAdd('nikah')}
                className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-gradient-to-r from-rose-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-rose-900/30"
              >
                <Plus className="w-4 h-4" />
                <span>Input Pelayanan Baru</span>
              </button>
            )}
          </div>
        </div>

        {/* Stats Grid with Dynamic Progress Bars */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-800/80">
          {/* Card Pernikahan Kudus */}
          <div className="bg-slate-800/70 backdrop-blur border border-slate-700/70 p-3.5 rounded-xl flex flex-col justify-between hover:border-rose-500/40 transition-all">
            <div>
              <div className="flex items-center justify-between text-rose-300 text-xs font-medium mb-1">
                <span>Pernikahan Kudus</span>
                <Heart className="w-4 h-4 text-rose-400" />
              </div>
              <div className="text-2xl font-black text-white">{totalNikah} Berkas</div>
              <p className="text-[10px] text-slate-400 mt-0.5">Pemberkatan Nikah</p>
            </div>
            <div className="mt-3 pt-2.5 border-t border-slate-700/60">
              <div className="flex items-center justify-between text-[11px] mb-1">
                <span className="text-slate-300 font-medium">Progres Arsip</span>
                <span className="text-rose-300 font-bold">{nikahTerarsip}/{totalNikah} ({nikahPercent}%)</span>
              </div>
              <div className="w-full bg-slate-700/80 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-rose-500 to-pink-400 h-full rounded-full transition-all duration-500"
                  style={{ width: `${nikahPercent}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1.5">
                <span className="text-emerald-400 font-medium">✓ {nikahTerarsip} Terarsip</span>
                <span className={nikahBelum > 0 ? 'text-amber-300 font-medium' : 'text-slate-500'}>
                  {nikahBelum} Belum
                </span>
              </div>
            </div>
          </div>

          {/* Card Baptisan Kudus */}
          <div className="bg-slate-800/70 backdrop-blur border border-slate-700/70 p-3.5 rounded-xl flex flex-col justify-between hover:border-sky-500/40 transition-all">
            <div>
              <div className="flex items-center justify-between text-sky-300 text-xs font-medium mb-1">
                <span>Baptisan Kudus</span>
                <Sparkles className="w-4 h-4 text-sky-400" />
              </div>
              <div className="text-2xl font-black text-white">{totalBaptis} Berkas</div>
              <p className="text-[10px] text-slate-400 mt-0.5">Anak & Dewasa</p>
            </div>
            <div className="mt-3 pt-2.5 border-t border-slate-700/60">
              <div className="flex items-center justify-between text-[11px] mb-1">
                <span className="text-slate-300 font-medium">Progres Arsip</span>
                <span className="text-sky-300 font-bold">{baptisTerarsip}/{totalBaptis} ({baptisPercent}%)</span>
              </div>
              <div className="w-full bg-slate-700/80 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-sky-500 to-blue-400 h-full rounded-full transition-all duration-500"
                  style={{ width: `${baptisPercent}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1.5">
                <span className="text-emerald-400 font-medium">✓ {baptisTerarsip} Terarsip</span>
                <span className={baptisBelum > 0 ? 'text-amber-300 font-medium' : 'text-slate-500'}>
                  {baptisBelum} Belum
                </span>
              </div>
            </div>
          </div>

          {/* Card Peneguhan Sidi */}
          <div className="bg-slate-800/70 backdrop-blur border border-slate-700/70 p-3.5 rounded-xl flex flex-col justify-between hover:border-indigo-500/40 transition-all">
            <div>
              <div className="flex items-center justify-between text-indigo-300 text-xs font-medium mb-1">
                <span>Peneguhan Sidi</span>
                <Award className="w-4 h-4 text-indigo-400" />
              </div>
              <div className="text-2xl font-black text-white">{totalSidi} Berkas</div>
              <p className="text-[10px] text-slate-400 mt-0.5">Pengakuan Iman</p>
            </div>
            <div className="mt-3 pt-2.5 border-t border-slate-700/60">
              <div className="flex items-center justify-between text-[11px] mb-1">
                <span className="text-slate-300 font-medium">Progres Arsip</span>
                <span className="text-indigo-300 font-bold">{sidiTerarsip}/{totalSidi} ({sidiPercent}%)</span>
              </div>
              <div className="w-full bg-slate-700/80 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-indigo-500 to-purple-400 h-full rounded-full transition-all duration-500"
                  style={{ width: `${sidiPercent}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1.5">
                <span className="text-emerald-400 font-medium">✓ {sidiTerarsip} Terarsip</span>
                <span className={sidiBelum > 0 ? 'text-amber-300 font-medium' : 'text-slate-500'}>
                  {sidiBelum} Belum
                </span>
              </div>
            </div>
          </div>

          {/* Card Total Terarsip ke Agenda */}
          <div className="bg-slate-800/70 backdrop-blur border border-slate-700/70 p-3.5 rounded-xl flex flex-col justify-between hover:border-emerald-500/40 transition-all">
            <div>
              <div className="flex items-center justify-between text-emerald-300 text-xs font-medium mb-1">
                <span>Total Terarsip Agenda</span>
                <FileCheck className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-black text-emerald-300">
                {totalTerarsip} / {totalSemua}
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5">Surat Keluar Resmi</p>
            </div>
            <div className="mt-3 pt-2.5 border-t border-slate-700/60">
              <div className="flex items-center justify-between text-[11px] mb-1">
                <span className="text-slate-300 font-medium">Total Terarsip</span>
                <span className="text-emerald-300 font-bold">{totalPercent}%</span>
              </div>
              <div className="w-full bg-slate-700/80 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-500"
                  style={{ width: `${totalPercent}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1.5">
                <span className="text-emerald-400 font-medium">✓ {totalTerarsip} Selesai</span>
                <span className={totalBelum > 0 ? 'text-amber-300 font-medium' : 'text-slate-500'}>
                  {totalBelum} Belum
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter & Controls */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        {/* Jenis Tabs */}
        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl overflow-x-auto text-xs font-semibold text-slate-600 dark:text-slate-300">
          <button
            onClick={() => setFilterJenis('semua')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              filterJenis === 'semua'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm font-bold'
                : 'hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Semua Pelayanan ({totalSemua})
          </button>
          <button
            onClick={() => setFilterJenis('nikah')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              filterJenis === 'nikah'
                ? 'bg-rose-500 text-white shadow-sm font-bold'
                : 'hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Heart className="w-3.5 h-3.5" />
            Menikah ({totalNikah})
          </button>
          <button
            onClick={() => setFilterJenis('baptis')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              filterJenis === 'baptis'
                ? 'bg-sky-500 text-white shadow-sm font-bold'
                : 'hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Baptisan Kudus ({totalBaptis})
          </button>
          <button
            onClick={() => setFilterJenis('sidi')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              filterJenis === 'sidi'
                ? 'bg-indigo-600 text-white shadow-sm font-bold'
                : 'hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            Peneguhan Sidi ({totalSidi})
          </button>
        </div>

        {/* Search, Status & Pengarsipan Filter */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 sm:w-56">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari nama, no surat, pelayan..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-rose-500 focus:bg-white dark:focus:bg-slate-800 outline-none"
            />
          </div>

          <select
            value={filterArsip}
            onChange={(e) => setFilterArsip(e.target.value as any)}
            className="bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs py-1.5 px-3 focus:ring-2 focus:ring-rose-500 outline-none text-slate-700 dark:text-slate-200 font-medium"
          >
            <option value="semua">Semua Status Arsip</option>
            <option value="terarsip">Sudah Terarsip ({totalTerarsip})</option>
            <option value="belum">Belum Diarsipkan ({totalBelum})</option>
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs py-1.5 px-3 focus:ring-2 focus:ring-rose-500 outline-none text-slate-700 dark:text-slate-200 font-medium"
          >
            <option value="semua">Semua Status</option>
            <option value="Permohonan">Permohonan</option>
            <option value="Diproses / Katekisasi">Diproses / Katekisasi</option>
            <option value="Disetujui & Diterbitkan">Disetujui & Diterbitkan</option>
          </select>
        </div>
      </div>

      {/* Main List Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="overflow-x-auto w-full max-w-full">
          <table className="w-full min-w-[750px] text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/90 border-b border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold uppercase tracking-wider text-[11px] whitespace-nowrap">
                <th className="py-3 px-4 w-12 text-center">No</th>
                <th className="py-3 px-4">Jenis & No. Surat Resmi</th>
                <th className="py-3 px-4">Nama Bersangkutan / Mempelai</th>
                <th className="py-3 px-4">Pelayan & Lokasi Ibadah</th>
                <th className="py-3 px-4">Tanggal Pelayanan</th>
                <th className="py-3 px-4 text-center">Pengarsipan Surat</th>
                <th className="py-3 px-4 text-center">Aksi / Cetak</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-800 dark:text-slate-100">
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400 italic">
                    Belum ada data pelayanan nikah, baptis, atau sidi yang sesuai.
                  </td>
                </tr>
              ) : (
                filteredList.map((item, idx) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/60 transition-colors">
                    <td className="py-3.5 px-4 text-center font-mono text-slate-500 dark:text-slate-400 font-semibold">
                      {idx + 1}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="mb-1">{getJenisBadge(item.jenisPelayanan)}</div>
                      <div className="font-mono text-slate-900 dark:text-slate-100 font-bold text-xs">
                        {item.noSuratResmi}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                        {item.namaUtama}
                      </div>
                      {item.namaPasangan && (
                        <div className="text-rose-600 dark:text-rose-400 font-semibold text-xs flex items-center gap-1 mt-0.5">
                          <Heart className="w-3 h-3 fill-rose-500" />
                          <span>{item.namaPasangan}</span>
                        </div>
                      )}
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                        {item.tempatTanggalLahir && (
                          <div>TTL: {item.tempatTanggalLahir}</div>
                        )}
                        {item.namaAyah && (
                          <div>
                            Orang Tua: {item.namaAyah} & {item.namaIbu || '-'}
                          </div>
                        )}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900 dark:text-slate-100">{item.pelayanFirman}</div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        {item.tempatPelayanan}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 dark:text-slate-100">{item.tanggalPelayanan}</div>
                      <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded font-medium border border-slate-200 dark:border-slate-700">
                        {item.status}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      {isItemArchived(item) ? (
                        <div className="inline-flex items-center gap-1.5">
                          <span className="inline-flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 text-[11px] font-semibold px-2.5 py-1 rounded-full">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Terarsip di Surat Keluar</span>
                          </span>
                          {isMPHOrAdmin && (
                            <button
                              onClick={() => setUnarchiveTarget(item)}
                              disabled={isArchivingId === item.id}
                              title="Reset / Batalkan status arsip surat ini"
                              className="p-1 text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/60 rounded border border-transparent hover:border-amber-200 dark:hover:border-amber-800 transition cursor-pointer"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      ) : (
                        <button
                          onClick={() => handleArchiveToAgenda(item)}
                          disabled={isArchivingId === item.id || !isMPHOrAdmin}
                          className="inline-flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-white text-[11px] font-semibold px-3 py-1 rounded-lg shadow-sm transition cursor-pointer disabled:opacity-50"
                        >
                          {isArchivingId === item.id ? (
                            <RefreshCw className="w-3 h-3 animate-spin" />
                          ) : (
                            <Archive className="w-3 h-3" />
                          )}
                          <span>Arsipkan Ke Agenda Surat</span>
                        </button>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() =>
                            openPrintReport({
                              reportType:
                                item.jenisPelayanan === 'baptis'
                                  ? 'pelayanan_baptis'
                                  : item.jenisPelayanan === 'sidi'
                                  ? 'pelayanan_sidi'
                                  : 'pelayanan_nikah',
                              sakramenId: item.id,
                            })
                          }
                          title={item.jenisPelayanan === 'nikah' ? 'Cetak Piagam / Kartu Tanda Nikah' : 'Cetak Surat Piagam Resmi Sakramen'}
                          className="p-1.5 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 rounded-lg border border-indigo-200 dark:border-indigo-800/60 transition"
                        >
                          <Printer className="w-4 h-4" />
                        </button>

                        {item.jenisPelayanan === 'nikah' && (
                          <button
                            onClick={() =>
                              openPrintReport({
                                reportType: 'surat_pelimpahan_nikah',
                                sakramenId: item.id,
                              })
                            }
                            title="Cetak Surat Pelimpahan Peneguhan dan Pemberkatan Nikah"
                            className="p-1.5 bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 rounded-lg border border-rose-200 dark:border-rose-800/60 transition flex items-center gap-1 font-bold text-[10px]"
                          >
                            <FileText className="w-3.5 h-3.5 text-rose-600" />
                            <span className="hidden sm:inline">Surat Pelimpahan</span>
                          </button>
                        )}

                        {isMPHOrAdmin && (
                          <>
                            <button
                              onClick={() => handleOpenEdit(item)}
                              className="p-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg border border-slate-300 dark:border-slate-700 transition"
                              title="Edit Data Pelayanan"
                            >
                              <FileText className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setDeleteTarget(item)}
                              className="p-2 sm:p-1.5 bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 rounded-lg border border-rose-200 dark:border-rose-800/60 transition cursor-pointer min-w-[36px] min-h-[36px] flex items-center justify-center"
                              title={`Hapus Surat ${
                                item.jenisPelayanan === 'baptis'
                                  ? 'Baptisan Kudus'
                                  : item.jenisPelayanan === 'sidi'
                                  ? 'Peneguhan Sidi'
                                  : 'Pernikahan Kudus'
                              }`}
                            >
                              <Trash2 className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
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

      {/* Modal Form Input / Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-hidden animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-3xl w-full border border-slate-200 dark:border-slate-800 overflow-hidden my-auto max-h-[92dvh] sm:max-h-[88vh] flex flex-col text-slate-800 dark:text-slate-100">
            {/* Modal Header */}
            <div className="shrink-0 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-4 sm:p-5 text-white flex justify-between items-center border-b border-indigo-800/80">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 shadow-md">
                  <HeartHandshake className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                    {editingItem ? 'Edit Data Pelayanan Sakramen' : 'Pendaftaran Pelayanan Sakramen Baru'}
                  </h3>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Lengkapi data permohonan untuk pencetakan piagam & pengarsipan nomor surat resmi.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <form onSubmit={handlePreSaveClick} className="flex flex-col flex-1 min-h-0 overflow-hidden text-xs">
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 overscroll-contain">
                {/* Jenis Pelayanan Selector */}
                <div>
                  <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1.5 text-xs">
                    Pilih Jenis Pelayanan / Sakramen <span className="text-rose-500">*</span>
                  </label>
                <div className="grid grid-cols-3 gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      const j = 'nikah';
                      setFormData((prev) => ({
                        ...prev,
                        jenisPelayanan: j,
                        noSuratResmi: generateAutoNoSurat(j),
                      }));
                    }}
                    className={`py-2.5 px-3 rounded-xl border font-bold flex flex-col sm:flex-row items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      formData.jenisPelayanan === 'nikah'
                        ? 'bg-rose-600 text-white border-rose-600 shadow-md'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700'
                    }`}
                  >
                    <Heart className="w-4 h-4 fill-current" />
                    <span>Pernikahan (Nikah)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const j = 'baptis';
                      setFormData((prev) => ({
                        ...prev,
                        jenisPelayanan: j,
                        noSuratResmi: generateAutoNoSurat(j),
                      }));
                    }}
                    className={`py-2.5 px-3 rounded-xl border font-bold flex flex-col sm:flex-row items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      formData.jenisPelayanan === 'baptis'
                        ? 'bg-sky-600 text-white border-sky-600 shadow-md'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700'
                    }`}
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Baptisan Kudus</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const j = 'sidi';
                      setFormData((prev) => ({
                        ...prev,
                        jenisPelayanan: j,
                        noSuratResmi: generateAutoNoSurat(j),
                      }));
                    }}
                    className={`py-2.5 px-3 rounded-xl border font-bold flex flex-col sm:flex-row items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      formData.jenisPelayanan === 'sidi'
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700'
                    }`}
                  >
                    <Award className="w-4 h-4" />
                    <span>Peneguhan Sidi</span>
                  </button>
                </div>
              </div>

              {/* Section 1: Data Surat & Majelis/Resort GKE */}
              <div className="bg-slate-50 p-3.5 sm:p-4 rounded-xl border border-slate-200 space-y-3">
                <h4 className="font-bold text-slate-800 text-xs flex items-center gap-1.5 border-b border-slate-200 pb-2">
                  <FileText className="w-4 h-4 text-indigo-600" />
                  <span>
                    {formData.jenisPelayanan === 'baptis'
                      ? 'Kop & Penomoran Resmi Surat Baptisan Kudus'
                      : 'Informasi Surat Resmi & Pelayanan Ibadah'}
                  </span>
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Nomor Surat Resmi Sakramen <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.noSuratResmi || ''}
                      onChange={(e) => setFormData({ ...formData, noSuratResmi: e.target.value })}
                      placeholder="e.g. 001/MPH-MJ.GKE/PR/SBK/XII/2026"
                      className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-mono text-slate-950 font-extrabold outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Majelis Jemaat GKE
                    </label>
                    <input
                      type="text"
                      value={formData.majelisJemaat || ''}
                      onChange={(e) => setFormData({ ...formData, majelisJemaat: e.target.value })}
                      placeholder="e.g. Majelis Jemaat GKE Efata"
                      className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-bold text-slate-950 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Resort GKE
                    </label>
                    <input
                      type="text"
                      value={formData.resortGke || ''}
                      onChange={(e) => setFormData({ ...formData, resortGke: e.target.value })}
                      placeholder="e.g. Resort GKE Palangka Raya"
                      className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-bold text-slate-950 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Data Utama (Menerangkan Bahwa) */}
              <div className="bg-slate-50 p-3.5 sm:p-4 rounded-xl border border-slate-200 space-y-3">
                <h4 className="font-bold text-slate-800 text-xs flex items-center gap-1.5 border-b border-slate-200 pb-2">
                  <User className="w-4 h-4 text-emerald-600" />
                  <span>
                    {formData.jenisPelayanan === 'nikah'
                      ? 'Data Mempelai LAKI-LAKI'
                      : formData.jenisPelayanan === 'baptis'
                      ? 'Data Yang Dibaptis (Dengan Ini Menerangkan Bahwa)'
                      : 'Data Calon Sidi (Dengan Ini Menerangkan Bahwa)'}
                  </span>
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      {formData.jenisPelayanan === 'nikah'
                        ? 'Nama Lengkap Mempelai Laki-Laki'
                        : formData.jenisPelayanan === 'baptis'
                        ? 'Nama Lengkap Yang Dibaptis'
                        : 'Nama Lengkap Calon Sidi'} <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.namaUtama || ''}
                      onChange={(e) => setFormData({ ...formData, namaUtama: e.target.value })}
                      placeholder="Nama lengkap sesuai KTP/Akte"
                      className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-extrabold text-slate-950 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Tempat / Tgl. Lahir
                    </label>
                    <input
                      type="text"
                      value={formData.tempatTanggalLahir || ''}
                      onChange={(e) => setFormData({ ...formData, tempatTanggalLahir: e.target.value })}
                      placeholder="Contoh: Palangka Raya, 12 Januari 1998"
                      className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-semibold text-slate-950 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                {formData.jenisPelayanan === 'nikah' && (
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Alamat Mempelai Laki-Laki
                    </label>
                    <input
                      type="text"
                      value={formData.alamatUtama || ''}
                      onChange={(e) => setFormData({ ...formData, alamatUtama: e.target.value })}
                      placeholder="Contoh: Jl. Diponegoro No. 14, Palangka Raya"
                      className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-semibold text-slate-950 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Nama Ayah Kandung
                    </label>
                    <input
                      type="text"
                      value={formData.namaAyah || ''}
                      onChange={(e) => setFormData({ ...formData, namaAyah: e.target.value })}
                      placeholder="Nama ayah kandung"
                      className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-semibold text-slate-950 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Nama Ibu Kandung
                    </label>
                    <input
                      type="text"
                      value={formData.namaIbu || ''}
                      onChange={(e) => setFormData({ ...formData, namaIbu: e.target.value })}
                      placeholder="Nama ibu kandung"
                      className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-semibold text-slate-950 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              </div>

              {/* Section 3: Data Mempelai PEREMPUAN & Foto Pasangan (Khusus Pernikahan) */}
              {formData.jenisPelayanan === 'nikah' && (
                <div className="bg-rose-50/60 p-3.5 sm:p-4 rounded-xl border border-rose-200/80 space-y-3">
                  <h4 className="font-bold text-rose-900 text-xs flex items-center gap-1.5 border-b border-rose-200/80 pb-2">
                    <Heart className="w-4 h-4 text-rose-600 fill-rose-600" />
                    <span>Data Mempelai PEREMPUAN & Foto Pasangan</span>
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-rose-900 mb-1">
                        Nama Lengkap Mempelai Perempuan <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.namaPasangan || ''}
                        onChange={(e) => setFormData({ ...formData, namaPasangan: e.target.value })}
                        placeholder="Nama lengkap mempelai perempuan"
                        className="w-full p-2.5 bg-white border border-rose-300 rounded-xl font-extrabold text-slate-950 outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-rose-900 mb-1">
                        Tempat / Tgl. Lahir Mempelai Perempuan
                      </label>
                      <input
                        type="text"
                        value={formData.tempatTanggalLahirPasangan || ''}
                        onChange={(e) => setFormData({ ...formData, tempatTanggalLahirPasangan: e.target.value })}
                        placeholder="Contoh: Sampit, 25 Agustus 2000"
                        className="w-full p-2.5 bg-white border border-rose-200 rounded-xl font-semibold text-slate-950 outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-rose-900 mb-1">
                      Alamat Mempelai Perempuan
                    </label>
                    <input
                      type="text"
                      value={formData.alamatPasangan || ''}
                      onChange={(e) => setFormData({ ...formData, alamatPasangan: e.target.value })}
                      placeholder="Contoh: Jl. Ahmad Yani No. 88, Palangka Raya"
                      className="w-full p-2.5 bg-white border border-rose-200 rounded-xl font-semibold text-slate-950 outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-rose-900 mb-1">
                        Nama Ayah Kandung Mempelai Perempuan
                      </label>
                      <input
                        type="text"
                        value={formData.namaAyahPasangan || ''}
                        onChange={(e) => setFormData({ ...formData, namaAyahPasangan: e.target.value })}
                        placeholder="Nama ayah mempelai perempuan"
                        className="w-full p-2.5 bg-white border border-rose-200 rounded-xl font-semibold text-slate-950 outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-rose-900 mb-1">
                        Nama Ibu Kandung Mempelai Perempuan
                      </label>
                      <input
                        type="text"
                        value={formData.namaIbuPasangan || ''}
                        onChange={(e) => setFormData({ ...formData, namaIbuPasangan: e.target.value })}
                        placeholder="Nama ibu mempelai perempuan"
                        className="w-full p-2.5 bg-white border border-rose-200 rounded-xl font-semibold text-slate-950 outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
                      />
                    </div>
                  </div>

                  {/* Foto Pasangan / Couple Photo Upload */}
                  <div className="p-3 bg-white border border-rose-200 rounded-xl space-y-2">
                    <label className="block font-semibold text-rose-900 text-xs">
                      Foto Orang Yang Dinikahkan (Foto Pasangan Mempelai 4x6)
                    </label>
                    <div className="flex flex-col sm:flex-row items-center gap-3">
                      <div className="w-20 h-24 bg-slate-100 border-2 border-dashed border-rose-300 rounded-lg flex items-center justify-center overflow-hidden shrink-0">
                        {formData.fotoCoupleUrl ? (
                          <img
                            src={formData.fotoCoupleUrl}
                            alt="Foto Pasangan"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-[10px] text-slate-400 text-center px-1 font-bold">
                            Foto 4x6 Pasangan
                          </span>
                        )}
                      </div>

                      <div className="flex-1 space-y-2 w-full">
                        <input
                          type="text"
                          value={formData.fotoCoupleUrl || ''}
                          onChange={(e) => setFormData({ ...formData, fotoCoupleUrl: e.target.value })}
                          placeholder="Tempel Link Foto (https://...) atau pilih file gambar di bawah"
                          className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-950 outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
                        />
                        <div className="flex items-center gap-2">
                          <label className="cursor-pointer bg-rose-100 hover:bg-rose-200 text-rose-800 text-xs font-bold px-3 py-1.5 rounded-lg border border-rose-300 transition-all inline-block">
                            <span>Upload Foto Pasangan</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  const reader = new FileReader();
                                  reader.onload = (uploadEvent) => {
                                    if (uploadEvent.target?.result) {
                                      setFormData({
                                        ...formData,
                                        fotoCoupleUrl: uploadEvent.target.result as string,
                                      });
                                    }
                                  };
                                  reader.readAsDataURL(file);
                                }
                              }}
                            />
                          </label>
                          {formData.fotoCoupleUrl && (
                            <button
                              type="button"
                              onClick={() => setFormData({ ...formData, fotoCoupleUrl: '' })}
                              className="text-xs text-rose-600 hover:underline font-bold cursor-pointer"
                            >
                              Hapus Foto
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Section 3.1: Kelengkapan Berkas Surat Pra-Nikah */}
              {formData.jenisPelayanan === 'nikah' && (
                <div className="bg-amber-50/70 p-3.5 sm:p-4 rounded-xl border border-amber-200 space-y-3">
                  <h4 className="font-bold text-amber-950 text-xs flex items-center gap-1.5 border-b border-amber-200 pb-2">
                    <FileText className="w-4 h-4 text-amber-700" />
                    <span>Kelengkapan Berkas Surat Pra-Nikah</span>
                  </h4>

                  {/* Ceklist Berkas & Scan Result */}
                  <div className="pt-1 space-y-2.5">
                    <label className="block font-bold text-amber-950 text-xs">
                      Ceklist Kelengkapan Berkas Surat Pra-Nikah:
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                      {[
                        { key: 'aktaBaptis', label: 'Akta Baptis Mempelai Pria & Wanita' },
                        { key: 'aktaSidi', label: 'Akta Sidi Mempelai Pria & Wanita' },
                        { key: 'suratPengantarRayon', label: 'Surat Pengantar dari Lingkungan/Sektor' },
                        { key: 'suratBebasKomitmen', label: 'Surat Pelimpahan' },
                        { key: 'pasFotoPasangan', label: 'Pas Foto 4x6 Pasangan (Warna)' },
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
                            className={`p-2 rounded-lg border text-left flex items-center gap-2 transition-all cursor-pointer ${
                              isChecked
                                ? 'bg-amber-100/90 border-amber-400 text-amber-950 font-bold'
                                : 'bg-white border-amber-200 text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            {isChecked ? (
                              <CheckSquare className="w-4 h-4 text-amber-700 shrink-0" />
                            ) : (
                              <Square className="w-4 h-4 text-slate-400 shrink-0" />
                            )}
                            <span className="text-[11px] leading-tight">{chk.label}</span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Button Upload Scan Hasil Surat Pelimpahan */}
                    <div className="p-3 bg-white border border-amber-300 rounded-xl space-y-2 mt-2">
                      <label className="block font-bold text-amber-900 text-xs">
                        Upload Scan Hasil Surat Pelimpahan Peneguhan &amp; Pemberkatan Nikah
                      </label>
                      <div className="flex flex-col sm:flex-row items-center gap-2.5">
                        <input
                          type="text"
                          value={formData.scanSuratPelimpahanUrl || ''}
                          onChange={(e) => setFormData({ ...formData, scanSuratPelimpahanUrl: e.target.value })}
                          placeholder="Tempel URL scan atau upload file..."
                          className="flex-1 p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono text-slate-900 outline-none focus:border-amber-500 w-full"
                        />
                        <label className="cursor-pointer bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold px-3.5 py-2 rounded-lg transition-all flex items-center gap-1.5 shrink-0 shadow-sm">
                          <Upload className="w-3.5 h-3.5" />
                          <span>Upload File Scan</span>
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
                          <span className="text-emerald-700 font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> File scan surat terunggah
                          </span>
                          <a
                            href={formData.scanSuratPelimpahanUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-amber-800 hover:underline font-bold"
                          >
                            Pratinjau File
                          </a>
                          <button
                            type="button"
                            onClick={() => setFormData({ ...formData, scanSuratPelimpahanUrl: '' })}
                            className="text-rose-600 hover:underline font-bold"
                          >
                            Hapus
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Section 4: Detail Pelaksanaan & Saksi-saksi */}
              <div className="bg-slate-50 p-3.5 sm:p-4 rounded-xl border border-slate-200 space-y-3">
                <h4 className="font-bold text-slate-800 text-xs flex items-center gap-1.5 border-b border-slate-200 pb-2">
                  <Users className="w-4 h-4 text-sky-600" />
                  <span>
                    {formData.jenisPelayanan === 'baptis'
                      ? 'Pelaksanaan Baptisan Kudus & Saksi-Saksi'
                      : formData.jenisPelayanan === 'sidi'
                      ? 'Pelaksanaan Peneguhan Sidi'
                      : 'Pelaksanaan Pemberkatan Nikah & Saksi-Saksi'}
                  </span>
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      {formData.jenisPelayanan === 'baptis'
                        ? 'Hari / Tanggal Baptisan Kudus'
                        : formData.jenisPelayanan === 'sidi'
                        ? 'Hari / Tanggal Peneguhan Sidi'
                        : 'Hari / Tanggal Pemberkatan Nikah'} <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.tanggalPelayanan || ''}
                      onChange={(e) => setFormData({ ...formData, tanggalPelayanan: e.target.value })}
                      className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-bold text-slate-950 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Tempat Pelayanan / Gereja
                    </label>
                    <input
                      type="text"
                      value={formData.tempatPelayanan || ''}
                      onChange={(e) => setFormData({ ...formData, tempatPelayanan: e.target.value })}
                      placeholder="Contoh: Gereja GKE Efata Palangka Raya"
                      className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-semibold text-slate-950 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                {formData.jenisPelayanan !== 'sidi' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Saksi 1
                      </label>
                      <input
                        type="text"
                        value={formData.saksi1 || ''}
                        onChange={(e) => setFormData({ ...formData, saksi1: e.target.value })}
                        placeholder="Nama Saksi 1"
                        className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-semibold text-slate-950 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Saksi 2
                      </label>
                      <input
                        type="text"
                        value={formData.saksi2 || ''}
                        onChange={(e) => setFormData({ ...formData, saksi2: e.target.value })}
                        placeholder="Nama Saksi 2"
                        className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-semibold text-slate-950 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Section 5: Yang Melaksanakan Pelayanan (Pelayan, Nas Khotbah & Nas Peringatan) */}
              <div className="bg-slate-50 p-3.5 sm:p-4 rounded-xl border border-slate-200 space-y-3">
                <h4 className="font-bold text-slate-800 text-xs flex items-center gap-1.5 border-b border-slate-200 pb-2">
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  <span>
                    {formData.jenisPelayanan === 'sidi'
                      ? 'Yang Melaksanakan Peneguhan Sidi & Nas'
                      : 'Yang Melaksanakan Sakramen & Nas Khotbah'}
                  </span>
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      {formData.jenisPelayanan === 'sidi'
                        ? 'Yang Melaksanakan Sidi (Nama Pendeta)'
                        : 'Nama Pendeta / Pelayan Sakramen'}
                    </label>
                    <input
                      type="text"
                      value={formData.pelayanFirman || ''}
                      onChange={(e) => setFormData({ ...formData, pelayanFirman: e.target.value })}
                      placeholder="Nama Pendeta Pelayan"
                      className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-extrabold text-slate-950 outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Jabatan Pendeta / Pelayan
                    </label>
                    <input
                      type="text"
                      value={formData.jabatanPelayan || ''}
                      onChange={(e) => setFormData({ ...formData, jabatanPelayan: e.target.value })}
                      placeholder="e.g. Pendeta Jemaat GKE"
                      className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-semibold text-slate-950 outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Nas Khotbah
                    </label>
                    <input
                      type="text"
                      value={formData.nasKhotbah || ''}
                      onChange={(e) => setFormData({ ...formData, nasKhotbah: e.target.value })}
                      placeholder={formData.jenisPelayanan === 'sidi' ? 'e.g. 1 TIMOTIUS 6 : 12' : 'e.g. MARKUS 10 : 15 - 16'}
                      className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-extrabold text-slate-950 outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                    />
                  </div>

                  {formData.jenisPelayanan === 'sidi' ? (
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Nas Peringatan (Sidi)
                      </label>
                      <input
                        type="text"
                        value={formData.nasPeringatan || ''}
                        onChange={(e) => setFormData({ ...formData, nasPeringatan: e.target.value })}
                        placeholder="e.g. WAHYU 2 : 10b"
                        className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-extrabold text-slate-950 outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                      />
                    </div>
                  ) : (
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Isi Kutipan Ayat Nas Khotbah
                      </label>
                      <input
                        type="text"
                        value={formData.isiNasKhotbah || ''}
                        onChange={(e) => setFormData({ ...formData, isiNasKhotbah: e.target.value })}
                        placeholder="e.g. Aku berkata kepadamu: Sesungguhnya..."
                        className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-semibold text-slate-950 outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Section 6: Pengeluaran Surat & Tanda Tangan Majelis Jemaat */}
              <div className="bg-slate-50 p-3.5 sm:p-4 rounded-xl border border-slate-200 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2">
                  <h4 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-blue-600" />
                    <span>Pengeluaran Surat & Penandatangan Majelis Jemaat</span>
                  </h4>
                  {(settings.namaKetuaJemaat || settings.namaSekretaris) && (
                    <button
                      type="button"
                      onClick={() =>
                        setFormData({
                          ...formData,
                          ketuaMajelis: settings.namaKetuaJemaat || formData.ketuaMajelis,
                          sekretarisMajelis: settings.namaSekretaris || formData.sekretarisMajelis,
                        })
                      }
                      className="text-[11px] font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-lg border border-blue-200 transition-colors flex items-center gap-1 cursor-pointer"
                      title="Sinkronkan nama Ketua & Sekretaris dengan Pejabat Penandatangan Resmi di Pengaturan Aplikasi"
                    >
                      <RefreshCw className="w-3 h-3 text-blue-600" />
                      <span>Sesuai Pejabat Pengaturan</span>
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Dikeluarkan di (Tempat Surat)
                    </label>
                    <input
                      type="text"
                      value={formData.tempatDikeluarkan || ''}
                      onChange={(e) => setFormData({ ...formData, tempatDikeluarkan: e.target.value })}
                      placeholder="e.g. Palangka Raya"
                      className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-bold text-slate-950 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Pada Tanggal Surat Diterbitkan
                    </label>
                    <input
                      type="date"
                      value={formData.tanggalDikeluarkan || ''}
                      onChange={(e) => setFormData({ ...formData, tanggalDikeluarkan: e.target.value })}
                      className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-bold text-slate-950 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Nama Ketua Majelis Jemaat
                    </label>
                    <input
                      type="text"
                      value={formData.ketuaMajelis || ''}
                      onChange={(e) => setFormData({ ...formData, ketuaMajelis: e.target.value })}
                      placeholder="Nama Ketua Majelis"
                      className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-bold text-slate-950 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Nama Sekretaris Majelis Jemaat
                    </label>
                    <input
                      type="text"
                      value={formData.sekretarisMajelis || ''}
                      onChange={(e) => setFormData({ ...formData, sekretarisMajelis: e.target.value })}
                      placeholder="Nama Sekretaris Majelis"
                      className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-bold text-slate-950 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Section 5: Status & Catatan Pastoral */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-slate-50 p-3.5 sm:p-4 rounded-xl border border-slate-200">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Status Pelayanan
                  </label>
                  <select
                    value={formData.status || 'Permohonan'}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-extrabold text-slate-950 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="Permohonan">Permohonan Baru</option>
                    <option value="Diproses / Katekisasi">Diproses / Katekisasi Pastoral</option>
                    <option value="Disetujui & Diterbitkan">Disetujui & Diterbitkan</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Catatan Pastoral / Keterangan
                  </label>
                  <input
                    type="text"
                    value={formData.catatanPastoral || ''}
                    onChange={(e) => setFormData({ ...formData, catatanPastoral: e.target.value })}
                    placeholder="Catatan pendaftaran, konseling, atau katekisasi..."
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-semibold text-slate-950 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-3.5 sm:p-4 bg-slate-50 border-t border-slate-200 flex justify-end items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl font-bold transition text-xs cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 bg-gradient-to-r from-rose-600 via-indigo-600 to-indigo-700 hover:from-rose-500 hover:to-indigo-600 text-white rounded-xl font-extrabold transition text-xs shadow-lg shadow-indigo-950/20 active:scale-98 flex items-center gap-1.5 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Simpan Data Sakramen</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    )}

      {/* Confirmation & Animated Progress Bar Modal for Double-Submit Prevention */}
      {isConfirmSaveOpen && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 border-b border-slate-700 pb-3">
              <div className="p-2.5 bg-indigo-500/20 text-indigo-400 rounded-xl border border-indigo-500/30">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-black text-white text-base">Konfirmasi Simpan Data Sakramen</h3>
                <p className="text-xs text-slate-400">Pastikan seluruh data sudah benar sebelum disimpan.</p>
              </div>
            </div>

            <div className="p-3.5 bg-slate-900/90 rounded-xl border border-slate-700/80 space-y-2 text-xs text-slate-300">
              <div className="flex justify-between">
                <span className="text-slate-400">Jenis Sakramen:</span>
                <span className="font-bold text-amber-300 capitalize">{formData.jenisPelayanan}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Nama Utama:</span>
                <span className="font-bold text-white">{formData.namaUtama}</span>
              </div>
              {formData.namaPasangan && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Nama Pasangan:</span>
                  <span className="font-bold text-white">{formData.namaPasangan}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-slate-400">Nomor Surat:</span>
                <span className="font-mono text-slate-200">{formData.noSuratResmi}</span>
              </div>
            </div>

            {/* Animated Progress Bar during save */}
            {isSaving && (
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between text-xs font-bold text-indigo-400">
                  <span>Memproses &amp; Menyimpan Data...</span>
                  <span>{saveProgress}%</span>
                </div>
                <div className="w-full bg-slate-700 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-indigo-500 to-sky-400 h-full transition-all duration-300"
                    style={{ width: `${saveProgress}%` }}
                  />
                </div>
              </div>
            )}

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsConfirmSaveOpen(false)}
                disabled={isSaving}
                className="flex-1 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold text-xs rounded-xl transition-all cursor-pointer min-h-[44px]"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmSave}
                disabled={isSaving}
                className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs rounded-xl transition-all shadow-lg shadow-indigo-600/30 cursor-pointer min-h-[44px] flex items-center justify-center gap-2"
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

      {/* Modal Confirm Delete */}
      <DeleteConfirmModal
        isOpen={!!deleteTarget}
        title={
          deleteTarget
            ? deleteTarget.jenisPelayanan === 'baptis'
              ? 'Konfirmasi Hapus Surat Baptisan Kudus'
              : deleteTarget.jenisPelayanan === 'sidi'
              ? 'Konfirmasi Hapus Surat Peneguhan Sidi'
              : 'Konfirmasi Hapus Surat Pernikahan Kudus'
            : 'Konfirmasi Hapus Data Pelayanan Sakramen'
        }
        itemName={
          deleteTarget
            ? `${deleteTarget.namaUtama}${
                deleteTarget.namaPasangan ? ` & ${deleteTarget.namaPasangan}` : ''
              } [No. Surat: ${deleteTarget.noSuratResmi || '-'}] (${
                deleteTarget.jenisPelayanan === 'baptis'
                  ? 'Surat Baptisan Kudus'
                  : deleteTarget.jenisPelayanan === 'sidi'
                  ? 'Surat Peneguhan Sidi'
                  : 'Surat Pernikahan Kudus'
              })`
            : ''
        }
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
                  {unarchiveTarget.jenisPelayanan === 'baptis'
                    ? 'Konfirmasi Reset Arsip Surat Baptis'
                    : unarchiveTarget.jenisPelayanan === 'sidi'
                    ? 'Konfirmasi Reset Arsip Surat Sidi'
                    : 'Konfirmasi Reset Arsip Surat Pernikahan'}
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
                  {unarchiveTarget.jenisPelayanan === 'baptis'
                    ? 'Surat Baptisan Kudus'
                    : unarchiveTarget.jenisPelayanan === 'sidi'
                    ? 'Surat Peneguhan Sidi'
                    : 'Surat Pernikahan Kudus'}
                </span>
              </div>
              <div className="flex justify-between border-b border-slate-700/60 pb-1.5">
                <span className="text-slate-400">Nama Warga / Pasangan:</span>
                <span className="font-bold text-slate-100 text-right">
                  {unarchiveTarget.namaUtama}
                  {unarchiveTarget.namaPasangan ? ` & ${unarchiveTarget.namaPasangan}` : ''}
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

      {/* Import Modal */}
      <ImportPelayananSakramenModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImportBatch={importBatchPelayananSakramen}
        existingList={pelayananSakramenList}
        generateAutoNoSurat={generateAutoNoSurat}
      />
    </div>
  );
};
