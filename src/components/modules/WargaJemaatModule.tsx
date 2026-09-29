import React, { useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  Download,
  Edit2,
  Eye,
  FileSpreadsheet,
  FileText,
  Filter,
  FolderArchive,
  GitFork,
  HeartCrack,
  HeartHandshake,
  Loader2,
  Plus,
  Printer,
  RotateCcw,
  Save,
  Search,
  Sparkles,
  Trash2,
  Upload,
  UserCheck,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { WargaJemaat } from '../../types';
import { DeleteConfirmModal } from '../DeleteConfirmModal';
import { DeleteKeluargaModal } from '../DeleteKeluargaModal';
import { ImportSensusExcelModal } from '../ImportSensusExcelModal';
import { DemografiWargaVisualisasi } from '../DemografiWargaVisualisasi';
import { ProfilWargaModal } from '../ProfilWargaModal';
import {
  generateSensusExcelTemplate,
  downloadSensusExcel,
  downloadDeceasedExcel,
} from '../../utils/sensusExcelUtils';

export const WargaJemaatModule: React.FC = () => {
  const {
    wargaJemaatList,
    addWargaJemaat,
    updateWargaJemaat,
    deleteWargaJemaat,
    openPrintReport,
    currentUser,
    lingkunganList,
    settings,
    beritaJemaatList,
    updateBeritaJemaat,
    setActiveTab: setActiveAppTab,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'sensus' | 'kkj_silsilah' | 'wafat' | 'demografi'>('sensus');
  const [search, setSearch] = useState('');
  const [selectedRayon, setSelectedRayon] = useState('');
  const [statusFilter, setStatusFilter] = useState<'aktif' | 'semua' | 'Tetap' | 'Titipan' | 'Pindah' | 'Meninggal'>('aktif');

  // Wafat Archive Filters
  const [wafatSearch, setWafatSearch] = useState('');
  const [wafatSelectedRayon, setWafatSelectedRayon] = useState('');
  const [wafatSelectedTahun, setWafatSelectedTahun] = useState('');

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isDeleteKeluargaModalOpen, setIsDeleteKeluargaModalOpen] = useState(false);
  const [selectedDeleteKjj, setSelectedDeleteKjj] = useState<string | undefined>(undefined);
  const [isExporting, setIsExporting] = useState(false);
  const [exportNotice, setExportNotice] = useState<string | null>(null);
  const [exportSelectedRayon, setExportSelectedRayon] = useState<string>('');
  const [editingItem, setEditingItem] = useState<WargaJemaat | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<WargaJemaat | null>(null);
  const [revertTarget, setRevertTarget] = useState<WargaJemaat | null>(null);
  const [doubleKepalaWarning, setDoubleKepalaWarning] = useState<{
    noKjj: string;
    existingName: string;
  } | null>(null);

  // Member Profile Modal State
  const [profileTarget, setProfileTarget] = useState<WargaJemaat | null>(null);

  // Pastoral Death Governance Modal State
  const [isWafatModalOpen, setIsWafatModalOpen] = useState(false);
  const [wafatTarget, setWafatTarget] = useState<WargaJemaat | null>(null);
  const [isSavingWafat, setIsSavingWafat] = useState(false);
  const [wafatForm, setWafatForm] = useState({
    tanggalMeninggal: new Date().toISOString().split('T')[0],
    tempatMeninggal: '',
    tempatPemakaman: '',
    pelayanPemakaman: '',
    keluargaDitinggalkan: '',
    keteranganMeninggal: '',
    nomorSuratKematian: '',
    updatePasanganStatus: true,
    kepalaKeluargaBaruId: '',
    publishToWartaDuka: true,
  });

  const canEdit =
    currentUser.role === 'admin' || currentUser.role === 'sekretaris';

  const lingkungkans = lingkunganList && lingkunganList.length > 0
    ? lingkunganList.filter((l) => l.status === 'Aktif').map((l) => l.nama)
    : [
        'Lingkungan I - Ebenezer',
        'Lingkungan II - Yerusalem',
        'Lingkungan III - Bethel',
        'Lingkungan IV - Sion',
        'Lingkungan V - Filadelfia',
      ];

  const [formData, setFormData] = useState<Omit<WargaJemaat, 'id'>>({
    noKjj: 'KJJ-0101-0001',
    namaLengkap: '',
    nik: '',
    jenisKelamin: 'L',
    tempatLahir: 'Palangka Raya',
    tanggalLahir: '1990-01-01',
    rayon: 'Lingkungan I - Ebenezer',
    statusKeanggotaan: 'Tetap',
    statusBaptis: true,
    statusSidi: true,
    statusNikah: 'Belum Menikah',
    pekerjaan: 'Swasta',
    alamat: '',
    noHp: '',
    hubunganKeluarga: 'Kepala Keluarga',
    tanggalMeninggal: '',
    tempatMeninggal: '',
    tempatPemakaman: '',
    pelayanPemakaman: '',
    keluargaDitinggalkan: '',
    nomorSuratKematian: '',
    keteranganMeninggal: '',
  });

  const handleOpenAdd = () => {
    setEditingItem(null);
    const prefix = settings.prefixKjj || 'KJJ-GKE';
    setFormData({
      noKjj: `${prefix}-01${Math.floor(Math.random() * 5) + 1}-00${Math.floor(
        Math.random() * 90
      ) + 10}`,
      namaLengkap: '',
      nik: '',
      jenisKelamin: 'L',
      tempatLahir: 'Palangka Raya',
      tanggalLahir: '1995-05-15',
      rayon: lingkungkans[0] || 'Lingkungan I - Ebenezer',
      statusKeanggotaan: 'Tetap',
      statusBaptis: true,
      statusSidi: true,
      statusNikah: 'Belum Menikah',
      pekerjaan: 'PNS',
      alamat: '',
      noHp: '',
      hubunganKeluarga: 'Kepala Keluarga',
    });
    setIsModalOpen(true);
  };

  const handleOpenAddForKjj = (kjjNum: string, defaultRayon?: string, defaultAlamat?: string) => {
    setEditingItem(null);
    setFormData({
      noKjj: kjjNum,
      namaLengkap: '',
      nik: '',
      jenisKelamin: 'L',
      tempatLahir: 'Palangka Raya',
      tanggalLahir: '2000-01-01',
      rayon: defaultRayon || lingkungkans[0] || 'Lingkungan I - Ebenezer',
      statusKeanggotaan: 'Tetap',
      statusBaptis: true,
      statusSidi: false,
      statusNikah: 'Belum Menikah',
      pekerjaan: 'Pelajar / Mahasiswa',
      alamat: defaultAlamat || '',
      noHp: '',
      hubunganKeluarga: 'Anak',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: WargaJemaat) => {
    setEditingItem(item);
    setFormData({ ...item });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validasi Kepala Keluarga ganda dalam 1 KKJ (noKjj)
    if (formData.hubunganKeluarga === 'Kepala Keluarga') {
      const existingKepala = wargaJemaatList.find((w) => {
        const isSameKjj = (w.noKjj || '').trim().toLowerCase() === (formData.noKjj || '').trim().toLowerCase();
        const isKepala = w.hubunganKeluarga === 'Kepala Keluarga';
        const isNotSelf = editingItem ? w.id !== editingItem.id : true;
        return isSameKjj && isKepala && isNotSelf;
      });

      if (existingKepala) {
        setDoubleKepalaWarning({
          noKjj: formData.noKjj,
          existingName: existingKepala.namaLengkap,
        });
        return;
      }
    }

    if (editingItem) {
      updateWargaJemaat(editingItem.id, formData);
    } else {
      addWargaJemaat(formData);
    }
    setIsModalOpen(false);
  };

  const handleDownloadTemplate = async () => {
    try {
      const blob = await generateSensusExcelTemplate(lingkungkans);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Template_Sensus_Data_Keluarga_Jemaat_GKE.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download template error:', err);
    }
  };

  const handleExportExcel = async (
    scope: 'all' | 'filtered' | 'custom_rayon' | 'single_kk',
    customRayonOrKjj?: string
  ) => {
    try {
      setIsExporting(true);
      let targetList: WargaJemaat[] = [];
      let customTitle: string | undefined;
      let filterRayonName: string | undefined;

      if (scope === 'single_kk' && customRayonOrKjj) {
        targetList = wargaJemaatList.filter(
          (w) => (w.noKjj || '').trim().toLowerCase() === customRayonOrKjj.trim().toLowerCase()
        );
        const kepala = targetList.find((w) => w.hubunganKeluarga === 'Kepala Keluarga');
        customTitle = `DATA SENSUS KELUARGA (KKJ: ${customRayonOrKjj}${kepala ? ` - ${kepala.namaLengkap}` : ''})`;
      } else if (scope === 'custom_rayon' && customRayonOrKjj) {
        targetList = wargaJemaatList.filter((w) => w.rayon === customRayonOrKjj);
        filterRayonName = customRayonOrKjj;
        customTitle = `DATA SENSUS KELUARGA WARGA JEMAAT (${customRayonOrKjj.toUpperCase()})`;
      } else if (scope === 'filtered') {
        targetList = filteredList;
        filterRayonName = selectedRayon || (search ? `Pencarian "${search}"` : undefined);
      } else {
        // scope === 'all'
        targetList = wargaJemaatList;
      }

      if (targetList.length === 0) {
        alert('Tidak ada data jemaat yang dapat diexport.');
        setIsExporting(false);
        return;
      }

      const res = await downloadSensusExcel({
        wargaList: targetList,
        availableLingkungans: lingkungkans,
        churchName: settings.namaJemaat || 'Gereja Kalimantan Evangelis (GKE)',
        resortName: settings.resortGke,
        filterRayon: filterRayonName,
        customTitle,
      });

      setExportNotice(
        `Berhasil mengekspor ${res.totalJiwa} Jiwa (${res.totalKk} KK) ke file Excel sesuai template: "${res.filename}"`
      );
      setTimeout(() => setExportNotice(null), 6000);
      setIsExportModalOpen(false);
    } catch (err: any) {
      console.error('Export excel error:', err);
      alert('Terjadi kesalahan saat mengekspor data ke Excel: ' + (err?.message || 'Error'));
    } finally {
      setIsExporting(false);
    }
  };

  // Helper calculate age
  const calculateAge = (birthDate?: string, refDate?: string) => {
    if (!birthDate) return '-';
    const b = new Date(birthDate);
    const r = refDate ? new Date(refDate) : new Date();
    let age = r.getFullYear() - b.getFullYear();
    const m = r.getMonth() - b.getMonth();
    if (m < 0 || (m === 0 && r.getDate() < b.getDate())) {
      age--;
    }
    return age >= 0 ? `${age} Tahun` : '-';
  };

  // Generate official Surat Kematian number
  const generateNomorSuratKematian = () => {
    const year = new Date().getFullYear();
    const existingCount = wargaJemaatList.filter((w) => w.statusKeanggotaan === 'Meninggal').length + 1;
    const formattedNum = String(existingCount).padStart(3, '0');
    return `474.3/${formattedNum}/MJ-GKE/${year}`;
  };

  // Open Pastoral Care & Death Registration Modal
  const handleOpenWafatModal = (warga: WargaJemaat) => {
    setWafatTarget(warga);
    // Find spouse in the same KKJ
    const spouse = wargaJemaatList.find(
      (w) =>
        (w.noKjj || '').trim().toLowerCase() === (warga.noKjj || '').trim().toLowerCase() &&
        w.id !== warga.id &&
        (w.hubunganKeluarga === 'Istri' || (warga.hubunganKeluarga === 'Istri' && w.hubunganKeluarga === 'Kepala Keluarga'))
    );
    // Successor candidates for Kepala Keluarga if the deceased is Kepala Keluarga
    const otherFamilyMembers = wargaJemaatList.filter(
      (w) =>
        (w.noKjj || '').trim().toLowerCase() === (warga.noKjj || '').trim().toLowerCase() &&
        w.id !== warga.id &&
        w.statusKeanggotaan !== 'Meninggal'
    );
    const defaultSuccessor = spouse || otherFamilyMembers[0];

    setWafatForm({
      tanggalMeninggal: warga.tanggalMeninggal || new Date().toISOString().split('T')[0],
      tempatMeninggal: warga.tempatMeninggal || 'RSUD Doris Sylvanus',
      tempatPemakaman: warga.tempatPemakaman || 'TPU Kristen Km. 2.5',
      pelayanPemakaman: warga.pelayanPemakaman || 'Pdt. Pembimbing Rayon',
      keluargaDitinggalkan: warga.keluargaDitinggalkan || `Keluarga Besar Alm. ${warga.namaLengkap}`,
      keteranganMeninggal: warga.keteranganMeninggal || 'Telah berpulang ke Rumah Bapa di Sorga dalam damai sejahtera.',
      nomorSuratKematian: warga.nomorSuratKematian || generateNomorSuratKematian(),
      updatePasanganStatus: true,
      kepalaKeluargaBaruId: defaultSuccessor ? defaultSuccessor.id : '',
      publishToWartaDuka: true,
    });
    setIsWafatModalOpen(true);
  };

  // Confirm and Save Wafat Record
  const handleSaveWafat = async (
    printAfterSave: 'surat_keterangan_kematian' | 'surat_duka_cita' | null = null
  ) => {
    if (!wafatTarget) return;
    setIsSavingWafat(true);
    try {
      // 1. Update deceased member status to 'Meninggal' with full pastoral details
      const updatedDeceased: Partial<WargaJemaat> = {
        statusKeanggotaan: 'Meninggal',
        tanggalMeninggal: wafatForm.tanggalMeninggal,
        tempatMeninggal: wafatForm.tempatMeninggal,
        tempatPemakaman: wafatForm.tempatPemakaman,
        pelayanPemakaman: wafatForm.pelayanPemakaman,
        keluargaDitinggalkan: wafatForm.keluargaDitinggalkan,
        keteranganMeninggal: wafatForm.keteranganMeninggal,
        nomorSuratKematian: wafatForm.nomorSuratKematian,
      };
      await updateWargaJemaat(wafatTarget.id, updatedDeceased);

      // 2. Automated KKJ Updates: If deceased was Kepala Keluarga and successor chosen
      if (wafatTarget.hubunganKeluarga === 'Kepala Keluarga' && wafatForm.kepalaKeluargaBaruId) {
        await updateWargaJemaat(wafatForm.kepalaKeluargaBaruId, {
          hubunganKeluarga: 'Kepala Keluarga',
        });
      }

      // 3. Automated Spousal Status: update spouse to Janda / Duda if requested
      if (wafatForm.updatePasanganStatus && (wafatTarget.statusNikah === 'Menikah' || !wafatTarget.statusNikah)) {
        const spouseStatus = wafatTarget.jenisKelamin === 'L' ? 'Janda' : 'Duda';
        const spouse = wargaJemaatList.find(
          (w) =>
            (w.noKjj || '').trim().toLowerCase() === (wafatTarget.noKjj || '').trim().toLowerCase() &&
            w.id !== wafatTarget.id &&
            w.statusKeanggotaan !== 'Meninggal' &&
            (w.hubunganKeluarga === 'Istri' || (wafatTarget.hubunganKeluarga === 'Istri' && w.hubunganKeluarga === 'Kepala Keluarga'))
        );
        if (spouse) {
          await updateWargaJemaat(spouse.id, {
            statusNikah: spouseStatus,
          });
        }
      }

      // 4. Pastoral integration: publish to active Berita Jemaat (Berita Duka)
      if (wafatForm.publishToWartaDuka && beritaJemaatList && beritaJemaatList.length > 0) {
        const activeBerita = beritaJemaatList.find((b) => b.status === 'Aktif') || beritaJemaatList[0];
        if (activeBerita) {
          const newDukaEntry = {
            id: `duka-${Date.now()}`,
            namaAlmarhum: wafatTarget.namaLengkap,
            usia: calculateAge(wafatTarget.tanggalLahir, wafatForm.tanggalMeninggal),
            tanggalMeninggal: wafatForm.tanggalMeninggal,
            alamatDuka: wafatTarget.alamat || '-',
            keluargaDuka: wafatForm.keluargaDitinggalkan || `Keluarga ${wafatTarget.namaLengkap}`,
            jadwalIbadahDuka: 'Pukul 19.00 WIB (Ibadah Penghiburan)',
            jadwalPemakaman: `${wafatForm.tanggalMeninggal}, di ${wafatForm.tempatPemakaman || 'TPU Kristen'}`,
            keterangan: wafatForm.keteranganMeninggal,
          };
          const updatedDukaList = [...(activeBerita.beritaDuka || []), newDukaEntry];
          await updateBeritaJemaat(activeBerita.id, { beritaDuka: updatedDukaList });
        }
      }

      setIsWafatModalOpen(false);
      setExportNotice(`Data warga berpulang ${wafatTarget.namaLengkap} berhasil dicatat dalam Buku Induk Registrasi Kematian.`);
      setTimeout(() => setExportNotice(null), 5000);

      if (printAfterSave) {
        openPrintReport({
          reportType: printAfterSave,
          wargaId: wafatTarget.id,
        });
      }
    } catch (err: any) {
      console.error('Save wafat error:', err);
      alert('Gagal menyimpan data kematian: ' + (err?.message || 'Error'));
    } finally {
      setIsSavingWafat(false);
    }
  };

  // Revert deceased member to active status (e.g. in case of clerical error)
  const handleConfirmRevertActive = async () => {
    if (!revertTarget) return;
    try {
      await updateWargaJemaat(revertTarget.id, {
        statusKeanggotaan: 'Tetap',
        tanggalMeninggal: undefined,
        tempatMeninggal: undefined,
        tempatPemakaman: undefined,
        pelayanPemakaman: undefined,
        nomorSuratKematian: undefined,
        keteranganMeninggal: undefined,
        keluargaDitinggalkan: undefined,
      });
      setExportNotice(`Status keanggotaan ${revertTarget.namaLengkap} berhasil dikembalikan menjadi Aktif (Tetap).`);
      setTimeout(() => setExportNotice(null), 5000);
      setRevertTarget(null);
    } catch (err: any) {
      console.error('Revert error:', err);
      alert('Gagal mengembalikan status keanggotaan: ' + (err?.message || 'Error'));
    }
  };

  const handleExportWafatExcel = async () => {
    try {
      setIsExporting(true);
      const allDeceased = wargaJemaatList.filter((w) => w.statusKeanggotaan === 'Meninggal');
      if (allDeceased.length === 0) {
        alert('Belum ada data warga yang berpulang untuk diexport.');
        setIsExporting(false);
        return;
      }
      const res = await downloadDeceasedExcel(allDeceased, settings.namaJemaat || 'Gereja Kalimantan Evangelis (GKE)');
      setExportNotice(`Berhasil mengekspor Buku Registrasi Kematian (${res.totalJiwa} Data) ke Excel: "${res.filename}"`);
      setTimeout(() => setExportNotice(null), 5000);
    } catch (err: any) {
      console.error('Export wafat excel error:', err);
      alert('Gagal mengekspor data ke Excel: ' + (err?.message || 'Error'));
    } finally {
      setIsExporting(false);
    }
  };

  const filteredList = wargaJemaatList.filter((item) => {
    const matchesSearch =
      (item.namaLengkap || '').toLowerCase().includes(search.toLowerCase()) ||
      (item.noKjj || '').toLowerCase().includes(search.toLowerCase()) ||
      (item.nik || '').includes(search);
    const matchesRayon = !selectedRayon || item.rayon === selectedRayon;
    
    // Status keanggotaan filter
    let matchesStatus = true;
    if (statusFilter === 'aktif') {
      matchesStatus = item.statusKeanggotaan === 'Tetap' || item.statusKeanggotaan === 'Titipan';
    } else if (statusFilter === 'semua') {
      matchesStatus = true;
    } else {
      matchesStatus = item.statusKeanggotaan === statusFilter;
    }

    return matchesSearch && matchesRayon && matchesStatus;
  });

  // Deceased List for Wafat Tab
  const deceasedList = wargaJemaatList.filter((item) => {
    if (item.statusKeanggotaan !== 'Meninggal') return false;
    const matchesSearch =
      (item.namaLengkap || '').toLowerCase().includes(wafatSearch.toLowerCase()) ||
      (item.noKjj || '').toLowerCase().includes(wafatSearch.toLowerCase()) ||
      (item.nik || '').includes(wafatSearch) ||
      (item.nomorSuratKematian || '').toLowerCase().includes(wafatSearch.toLowerCase());
    const matchesRayon = !wafatSelectedRayon || item.rayon === wafatSelectedRayon;
    const matchesTahun = !wafatSelectedTahun || (item.tanggalMeninggal && item.tanggalMeninggal.startsWith(wafatSelectedTahun));
    return matchesSearch && matchesRayon && matchesTahun;
  });

  const totalKk = new Set(filteredList.map((w) => w.noKjj)).size;
  const totalKkAll = new Set(wargaJemaatList.map((w) => w.noKjj)).size;
  const totalMeninggalCount = wargaJemaatList.filter((w) => w.statusKeanggotaan === 'Meninggal').length;

  return (
    <div className="space-y-6">
      {/* Toast Notice */}
      {exportNotice && (
        <div className="bg-emerald-950/90 border border-emerald-500/40 text-emerald-200 p-3.5 px-4 rounded-2xl flex items-center justify-between shadow-lg shadow-emerald-950/50 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2.5 text-xs">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span className="font-medium">{exportNotice}</span>
          </div>
          <button
            onClick={() => setExportNotice(null)}
            className="text-emerald-400 hover:text-white p-1 rounded-lg hover:bg-emerald-900/50 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800/80 shadow-lg backdrop-blur-md flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Users className="w-5 h-5" />
            </div>
            Sensus Data Keluarga Jemaat
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Pencatatan Kartu Keluarga Jemaat (KJJ), Sektor Lingkungan, Status Sakramen &amp; Rincian Anggota Keluarga
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {canEdit && (
            <>
              <button
                onClick={handleOpenAdd}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-all shadow-md shadow-indigo-600/30 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Anggota Keluarga</span>
              </button>

              <button
                onClick={() => setIsImportModalOpen(true)}
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-all shadow-md shadow-emerald-600/30 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
                title="Import Sensus Data Keluarga Jemaat dari Spreadsheet Excel / CSV"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-200" />
                <span>Import Sensus (Excel)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSelectedDeleteKjj(undefined);
                  setIsDeleteKeluargaModalOpen(true);
                }}
                className="flex items-center gap-2 bg-rose-950/60 hover:bg-rose-900/80 text-rose-200 border border-rose-800/80 text-xs font-semibold px-4 py-2.5 rounded-xl transition-all shadow-md shadow-rose-950/30 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
                title="Hapus / Kosongkan Data Keluarga Jemaat untuk Mengganti Data Baru (Dilindungi Password)"
              >
                <Trash2 className="w-4 h-4 text-rose-400" />
                <span>Hapus Data Keluarga</span>
              </button>
            </>
          )}

          {/* Export Excel Sensus Button */}
          <button
            onClick={() => setIsExportModalOpen(true)}
            disabled={isExporting || wargaJemaatList.length === 0}
            className="flex items-center gap-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-md shadow-emerald-600/30 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
            title="Export Data Sensus Keluarga ke File Excel Sesuai Format Template Resmi"
          >
            {isExporting ? (
              <Loader2 className="w-4 h-4 animate-spin text-white" />
            ) : (
              <Download className="w-4 h-4 text-emerald-200" />
            )}
            <span>Export Sensus (Excel)</span>
          </button>

          <button
            onClick={() =>
              openPrintReport({
                reportType: 'warga_jemaat',
                selectedRayon: selectedRayon || undefined,
              })
            }
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-4 py-2.5 rounded-xl transition-all border border-slate-700 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
          >
            <Printer className="w-4 h-4 text-emerald-400" />
            <span>Cetak Laporan Sensus</span>
          </button>
        </div>
      </div>

      {/* Filter & Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-slate-900/80 p-4 rounded-2xl border border-slate-800/80 text-xs backdrop-blur-md">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Cari nama / KJJ / NIK..."
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
            {lingkungkans.map((r) => (
              <option key={r} value={r} className="bg-slate-900">
                {r}
              </option>
            ))}
          </select>
        </div>

        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="w-full py-2.5 px-3 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-xs"
          >
            <option value="aktif" className="bg-slate-900">Status: Anggota Aktif (Tetap &amp; Titipan)</option>
            <option value="semua" className="bg-slate-900">Status: Semua Data (Termasuk Pindah/Meninggal)</option>
            <option value="Tetap" className="bg-slate-900">Status: Warga Tetap Saja</option>
            <option value="Titipan" className="bg-slate-900">Status: Warga Titipan Saja</option>
            <option value="Pindah" className="bg-slate-900">Status: Warga Pindah / Atestasi Keluar</option>
            <option value="Meninggal" className="bg-slate-900">Status: Warga Berpulang (Meninggal)</option>
          </select>
        </div>

        <div className="flex items-center justify-between bg-indigo-500/10 px-4 py-2.5 rounded-xl border border-indigo-500/20 text-indigo-300 font-bold text-xs">
          <span>Total Jiwa: {filteredList.length}</span>
          <span>Jumlah KK: {totalKk}</span>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex border-b border-slate-800 gap-2 flex-wrap sm:flex-nowrap">
        <button
          onClick={() => setActiveTab('sensus')}
          className={`flex items-center gap-2 px-4 py-2.5 font-semibold text-xs rounded-t-xl transition-all border-b-2 cursor-pointer ${
            activeTab === 'sensus'
              ? 'bg-slate-900 text-indigo-400 border-indigo-500 shadow-md'
              : 'text-slate-400 border-transparent hover:text-slate-200 hover:bg-slate-900/50'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Sensus Anggota ({filteredList.length} Jiwa)</span>
        </button>

        <button
          onClick={() => setActiveTab('kkj_silsilah')}
          className={`flex items-center gap-2 px-4 py-2.5 font-semibold text-xs rounded-t-xl transition-all border-b-2 cursor-pointer ${
            activeTab === 'kkj_silsilah'
              ? 'bg-slate-900 text-emerald-400 border-emerald-500 shadow-md'
              : 'text-slate-400 border-transparent hover:text-slate-200 hover:bg-slate-900/50'
          }`}
        >
          <GitFork className="w-4 h-4" />
          <span>Rincian Kartu Keluarga &amp; Silsilah ({totalKk} KK)</span>
        </button>

        <button
          onClick={() => setActiveAppTab('kematian_jemaat')}
          className="flex items-center gap-2 px-4 py-2.5 font-semibold text-xs rounded-t-xl transition-all border-b-2 text-purple-400 border-transparent hover:text-purple-300 hover:border-purple-500 hover:bg-slate-900/50 cursor-pointer"
          title="Buka Halaman Mandiri Data Kematian Jemaat"
        >
          <HeartCrack className="w-4 h-4 text-purple-400" />
          <span>Data Kematian Jemaat ({totalMeninggalCount} Jiwa)</span>
          <span className="text-[9px] bg-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider flex items-center gap-0.5">
            Halaman Baru <ArrowRight className="w-2.5 h-2.5" />
          </span>
        </button>

        <button
          onClick={() => setActiveTab('demografi')}
          className={`flex items-center gap-2 px-4 py-2.5 font-semibold text-xs rounded-t-xl transition-all border-b-2 cursor-pointer ${
            activeTab === 'demografi'
              ? 'bg-slate-900 text-sky-400 border-sky-500 shadow-md'
              : 'text-slate-400 border-transparent hover:text-slate-200 hover:bg-slate-900/50'
          }`}
        >
          <BarChart3 className="w-4 h-4 text-sky-400" />
          <span>Grafik Demografi &amp; Usia/Gender</span>
        </button>
      </div>

      {activeTab === 'demografi' ? (
        /* Demographic Recharts Visualization View */
        <DemografiWargaVisualisasi
          wargaJemaatList={wargaJemaatList}
          availableLingkungans={lingkungkans}
          selectedRayonFilter={selectedRayon}
          onRayonChange={setSelectedRayon}
        />
      ) : activeTab === 'wafat' ? (
        <div className="bg-slate-900 border border-purple-500/30 rounded-2xl p-8 text-center space-y-4 max-w-2xl mx-auto my-8 shadow-xl animate-in fade-in">
          <div className="w-14 h-14 rounded-2xl bg-purple-500/20 text-purple-400 mx-auto flex items-center justify-center border border-purple-500/30">
            <HeartCrack className="w-7 h-7" />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-base sm:text-lg font-bold text-slate-100">
              Data Kematian Jemaat Kini Menjadi Halaman Mandiri
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed max-w-lg mx-auto">
              Halaman pencatatan kematian, arsip memorial, dan administrasi surat duka warga jemaat kini telah dipisahkan ke modul mandiri <strong>"Data Kematian Jemaat"</strong> di menu navigasi utama, dengan integrasi langsung ke Data Keluarga (KKJ) dan Warta Jemaat.
            </p>
          </div>
          <div className="pt-2">
            <button
              onClick={() => setActiveAppTab('kematian_jemaat')}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold px-5 py-3 rounded-xl transition shadow-lg shadow-purple-600/30 cursor-pointer hover:scale-105"
            >
              <span>Buka Halaman Data Kematian Jemaat Sekarang</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : activeTab === 'sensus' ? (
        /* Table View */
        <div className="bg-slate-900/80 rounded-2xl border border-slate-800/80 overflow-hidden shadow-lg backdrop-blur-md">
          <div className="overflow-x-auto w-full max-w-full">
            <table className="w-full min-w-[850px] text-xs text-left text-slate-300">
              <thead className="bg-slate-950/80 text-slate-200 font-bold border-b border-slate-800 uppercase text-[11px] tracking-wider whitespace-nowrap">
                <tr>
                  <th className="p-3.5 w-12 text-center">No</th>
                  <th className="p-3.5">No. KJJ</th>
                  <th className="p-3.5">Nama Lengkap</th>
                  <th className="p-3.5 text-center">L/P</th>
                  <th className="p-3.5">Lingkungan</th>
                  <th className="p-3.5">Hub. Keluarga</th>
                  <th className="p-3.5 text-center">Baptis</th>
                  <th className="p-3.5 text-center">Sidi</th>
                  <th className="p-3.5">No. HP</th>
                  <th className="p-3.5 text-center">Cetak KKJ / Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredList.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="p-8 text-center text-slate-500">
                      Tidak ada data anggota keluarga jemaat ditemukan.
                    </td>
                  </tr>
                ) : (
                  filteredList.map((item, idx) => (
                    <tr key={item.id} className={`hover:bg-slate-800/40 transition-colors ${item.statusKeanggotaan === 'Meninggal' ? 'bg-purple-950/20' : ''}`}>
                      <td className="p-3.5 text-center font-mono text-slate-500">{idx + 1}</td>
                      <td className="p-3.5 font-mono text-[11px] font-bold text-indigo-400">{item.noKjj}</td>
                      <td className="p-3.5 font-bold text-slate-100">
                        <button
                          type="button"
                          onClick={() => setProfileTarget(item)}
                          className="font-bold text-slate-100 hover:text-indigo-300 transition flex items-center gap-1.5 flex-wrap text-left cursor-pointer group"
                          title="Klik untuk membuka profil lengkap warga"
                        >
                          <span className="group-hover:underline">{item.namaLengkap}</span>
                          {item.statusKeanggotaan === 'Meninggal' && (
                            <span className="text-[10px] bg-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded font-bold border border-purple-500/30">
                              {item.jenisKelamin === 'P' ? 'Almh.' : 'Alm.'}
                            </span>
                          )}
                          {item.statusKeanggotaan === 'Pindah' && (
                            <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded font-semibold border border-amber-500/30">
                              Pindah
                            </span>
                          )}
                        </button>
                      </td>
                      <td className="p-3.5 text-center font-semibold text-slate-400">{item.jenisKelamin}</td>
                      <td className="p-3.5 font-medium text-slate-300">{item.rayon}</td>
                      <td className="p-3.5 font-medium text-slate-400">{item.hubunganKeluarga}</td>
                      <td className="p-3.5 text-center">
                        <span
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${
                            item.statusBaptis
                              ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                              : 'bg-slate-800 text-slate-400 border border-slate-700'
                          }`}
                        >
                          {item.statusBaptis ? 'Ya' : 'Belum'}
                        </span>
                      </td>
                      <td className="p-3.5 text-center">
                        <span
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${
                            item.statusSidi
                              ? 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/30'
                              : 'bg-slate-800 text-slate-400 border border-slate-700'
                          }`}
                        >
                          {item.statusSidi ? 'Ya' : 'Belum'}
                        </span>
                      </td>
                      <td className="p-3.5 font-mono text-slate-400">{item.noHp}</td>
                      <td className="p-3.5 text-center">
                        <div className="flex items-center justify-center gap-1.5 flex-wrap">
                          <button
                            type="button"
                            onClick={() => setProfileTarget(item)}
                            className="p-1.5 text-sky-400 hover:bg-sky-500/10 rounded-lg transition-colors cursor-pointer"
                            title="Lihat Profil Lengkap Warga"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              openPrintReport({
                                reportType: 'kartu_keluarga_jemaat',
                                noKjj: item.noKjj,
                              })
                            }
                            className="p-1.5 text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors flex items-center gap-1 bg-slate-950 border border-emerald-500/30 text-[10px] font-bold px-2 py-1 cursor-pointer"
                            title="Cetak Kartu Keluarga Jemaat (KKJ)"
                          >
                            <Printer className="w-3.5 h-3.5 text-emerald-400" />
                            <span>KKJ</span>
                          </button>

                          {canEdit && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleOpenEdit(item)}
                                className="p-1.5 text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-colors cursor-pointer"
                                title="Edit Data Anggota"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>

                              {/* Tombol Catat Wafat diantara tombol Edit dan Hapus */}
                              {item.statusKeanggotaan !== 'Meninggal' ? (
                                <button
                                  type="button"
                                  onClick={() => handleOpenWafatModal(item)}
                                  className="p-1.5 text-purple-400 hover:bg-purple-500/10 rounded-lg transition-colors cursor-pointer"
                                  title="Catat Warga Berpulang (Tata Kelola Wafat & Pelayanan Pastoral)"
                                >
                                  <HeartCrack className="w-3.5 h-3.5" />
                                </button>
                              ) : (
                                <>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      openPrintReport({
                                        reportType: 'surat_keterangan_kematian',
                                        wargaId: item.id,
                                      })
                                    }
                                    className="p-1.5 text-amber-400 hover:bg-amber-500/10 rounded-lg transition-colors cursor-pointer"
                                    title="Cetak Surat Keterangan Kematian Resmi"
                                  >
                                    <FileText className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      openPrintReport({
                                        reportType: 'surat_duka_cita',
                                        wargaId: item.id,
                                      })
                                    }
                                    className="p-1.5 text-purple-400 hover:bg-purple-500/10 rounded-lg transition-colors cursor-pointer"
                                    title="Cetak Surat Duka Cita (Pastoral)"
                                  >
                                    <HeartCrack className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setRevertTarget(item)}
                                    className="p-1.5 text-teal-400 hover:bg-teal-500/10 rounded-lg transition-colors cursor-pointer"
                                    title="Kembalikan ke Anggota Aktif (Koreksi Administrasi)"
                                  >
                                    <RotateCcw className="w-3.5 h-3.5" />
                                  </button>
                                </>
                              )}

                              <button
                                type="button"
                                onClick={() => setDeleteTarget(item)}
                                className="p-2 sm:p-1.5 text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 rounded-lg transition-colors cursor-pointer flex items-center justify-center min-w-[36px] min-h-[36px]"
                                title="Hapus Data Anggota"
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
      ) : (
        /* Kartu Keluarga & Silsilah View */
        <div className="space-y-6">
          {Array.from(new Set(filteredList.map((w) => w.noKjj))).map((kjjNum) => {
            const family = filteredList.filter((w) => w.noKjj === kjjNum);
            const kepala = family.find((f) => f.hubunganKeluarga === 'Kepala Keluarga') || family[0];
            const istri = family.find((f) => f.hubunganKeluarga === 'Istri');
            const anakList = family.filter((f) => f.hubunganKeluarga === 'Anak');
            const familiLainList = family.filter((f) => f.hubunganKeluarga === 'Famili Lain');

            return (
              <div
                key={kjjNum}
                className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 shadow-lg backdrop-blur-md space-y-4"
              >
                {/* Family Header */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                        {kjjNum}
                      </span>
                      <h3 className="font-bold text-slate-100 text-sm">
                        Keluarga {kepala?.namaLengkap || '-'}
                      </h3>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      {kepala?.rayon} • {kepala?.alamat || 'Alamat Belum Diisi'}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {canEdit && (
                      <button
                        onClick={() => handleOpenAddForKjj(String(kjjNum), kepala?.rayon, kepala?.alamat)}
                        className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-3 py-2 rounded-xl transition-all shadow-md shadow-indigo-600/20 cursor-pointer"
                        title="Tambah Anggota ke KK Ini"
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                        <span>Tambah Anggota KK</span>
                      </button>
                    )}
                    <button
                      onClick={() => handleExportExcel('single_kk', String(kjjNum))}
                      disabled={isExporting}
                      className="flex items-center gap-1.5 bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold px-3 py-2 rounded-xl transition-all shadow-md shadow-teal-600/20 cursor-pointer"
                      title="Export Data Kartu Keluarga ini ke File Excel"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5 text-teal-200" />
                      <span>Export KK (Excel)</span>
                    </button>
                    <button
                      onClick={() =>
                        openPrintReport({
                          reportType: 'kartu_keluarga_jemaat',
                          noKjj: kjjNum,
                        })
                      }
                      className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-md shadow-emerald-600/30 cursor-pointer"
                    >
                      <Printer className="w-4 h-4" />
                      <span>Cetak KKJ</span>
                    </button>

                    {canEdit && (
                      <button
                        onClick={() => {
                          setSelectedDeleteKjj(String(kjjNum));
                          setIsDeleteKeluargaModalOpen(true);
                        }}
                        className="flex items-center gap-1.5 bg-rose-950/50 hover:bg-rose-900/80 text-rose-300 border border-rose-800/60 text-xs font-semibold px-3 py-2 rounded-xl transition-all shadow-md shadow-rose-950/20 cursor-pointer"
                        title="Hapus Data 1 Keluarga Ini (Dilindungi Password)"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                        <span>Hapus KK</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Family Tree Graphic */}
                <div className="bg-slate-950/80 rounded-xl p-4 border border-slate-800/80 space-y-4">
                  <div className="text-center">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Rincian Data Anggota Keluarga & Bagan Silsilah ({family.length} Jiwa)
                    </span>
                  </div>

                  {/* Parents Level */}
                  <div className="flex flex-wrap items-center justify-center gap-4">
                    {/* Kepala Keluarga */}
                    <div
                      className={`relative group rounded-xl p-3 text-center min-w-[200px] border transition ${
                        kepala?.statusKeanggotaan === 'Meninggal'
                          ? 'bg-purple-950/50 border-purple-500/50 shadow-purple-950/40 shadow-md'
                          : 'bg-blue-950/40 border-blue-500/30'
                      }`}
                    >
                      <div className="absolute top-2 right-2 flex items-center gap-1 opacity-80 group-hover:opacity-100 transition">
                        {kepala && (
                          <button
                            type="button"
                            onClick={() => setProfileTarget(kepala)}
                            className="p-1 text-sky-300 hover:bg-sky-500/20 rounded cursor-pointer"
                            title="Lihat Profil Lengkap"
                          >
                            <Eye className="w-3 h-3" />
                          </button>
                        )}
                        {canEdit && kepala && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(kepala)}
                              className="p-1 text-indigo-300 hover:bg-indigo-500/20 rounded cursor-pointer"
                              title="Edit Kepala Keluarga"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteTarget(kepala)}
                              className="p-1 text-rose-300 hover:bg-rose-500/20 rounded cursor-pointer"
                              title="Hapus Kepala Keluarga"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </>
                        )}
                      </div>
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <span className="text-[9px] font-bold uppercase tracking-wider text-blue-400 bg-blue-500/20 px-2 py-0.5 rounded-md inline-block">
                          Kepala Keluarga
                        </span>
                        {kepala?.statusKeanggotaan === 'Meninggal' && (
                          <span className="text-[9px] font-bold text-purple-300 bg-purple-500/30 border border-purple-500/40 px-1.5 py-0.5 rounded-md inline-block">
                            ✝ Alm.
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => kepala && setProfileTarget(kepala)}
                        className="font-bold text-slate-100 hover:text-indigo-300 text-xs text-center mx-auto block cursor-pointer"
                      >
                        {kepala?.namaLengkap}
                      </button>
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5">NIK: {kepala?.nik || '-'}</p>
                      <div className="text-[10px] text-slate-300 mt-1.5 flex justify-center gap-2 font-medium">
                        <span>{kepala?.statusBaptis ? '✓ Baptis' : 'Belum Baptis'}</span>
                        <span>•</span>
                        <span>{kepala?.statusSidi ? '✓ Sidi' : 'Belum Sidi'}</span>
                      </div>
                    </div>

                    {/* Connection */}
                    {istri && (
                      <div className="text-slate-500 text-xs font-bold px-2">
                        <span className="bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-full text-[10px] text-pink-400">
                          💍 Suami - Istri
                        </span>
                      </div>
                    )}

                    {/* Istri */}
                    {istri && (
                      <div
                        className={`relative group rounded-xl p-3 text-center min-w-[200px] border transition ${
                          istri.statusKeanggotaan === 'Meninggal'
                            ? 'bg-purple-950/50 border-purple-500/50 shadow-purple-950/40 shadow-md'
                            : 'bg-purple-950/40 border-purple-500/30'
                        }`}
                      >
                        <div className="absolute top-2 right-2 flex items-center gap-1 opacity-80 group-hover:opacity-100 transition">
                          <button
                            type="button"
                            onClick={() => setProfileTarget(istri)}
                            className="p-1 text-sky-300 hover:bg-sky-500/20 rounded cursor-pointer"
                            title="Lihat Profil Lengkap"
                          >
                            <Eye className="w-3 h-3" />
                          </button>
                          {canEdit && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleOpenEdit(istri)}
                                className="p-1 text-purple-300 hover:bg-purple-500/20 rounded cursor-pointer"
                                title="Edit Istri"
                              >
                                <Edit2 className="w-3 h-3" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeleteTarget(istri)}
                                className="p-1 text-rose-300 hover:bg-rose-500/20 rounded cursor-pointer"
                                title="Hapus Data Istri"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </>
                          )}
                        </div>
                        <div className="flex items-center justify-center gap-1 mb-1">
                          <span className="text-[9px] font-bold uppercase tracking-wider text-purple-400 bg-purple-500/20 px-2 py-0.5 rounded-md inline-block">
                            Istri
                          </span>
                          {istri.statusKeanggotaan === 'Meninggal' && (
                            <span className="text-[9px] font-bold text-purple-300 bg-purple-500/30 border border-purple-500/40 px-1.5 py-0.5 rounded-md inline-block">
                              ✝ Almh.
                            </span>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => setProfileTarget(istri)}
                          className="font-bold text-slate-100 hover:text-purple-300 text-xs text-center mx-auto block cursor-pointer"
                        >
                          {istri.namaLengkap}
                        </button>
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5">NIK: {istri.nik || '-'}</p>
                        <div className="text-[10px] text-slate-300 mt-1.5 flex justify-center gap-2 font-medium">
                          <span>{istri.statusBaptis ? '✓ Baptis' : 'Belum Baptis'}</span>
                          <span>•</span>
                          <span>{istri.statusSidi ? '✓ Sidi' : 'Belum Sidi'}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Children Level */}
                  {anakList.length > 0 && (
                    <div className="pt-3 border-t border-slate-800">
                      <p className="text-center text-[10px] font-bold text-emerald-400 uppercase tracking-wider mb-2">
                        Anak-Anak Kandung ({anakList.length} Orang)
                      </p>
                      <div className="flex flex-wrap justify-center gap-3">
                        {anakList.map((anak, idx) => (
                          <div
                            key={anak.id}
                            className={`relative group rounded-xl p-2.5 text-center min-w-[160px] border transition ${
                              anak.statusKeanggotaan === 'Meninggal'
                                ? 'bg-purple-950/40 border-purple-500/40'
                                : 'bg-emerald-950/30 border-emerald-500/30'
                            }`}
                          >
                            <div className="absolute top-1.5 right-1.5 flex items-center gap-1 opacity-80 group-hover:opacity-100 transition">
                              <button
                                type="button"
                                onClick={() => setProfileTarget(anak)}
                                className="p-1 text-sky-300 hover:bg-sky-500/20 rounded cursor-pointer"
                                title="Lihat Profil Anak"
                              >
                                <Eye className="w-3 h-3" />
                              </button>
                              {canEdit && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => handleOpenEdit(anak)}
                                    className="p-1 text-emerald-300 hover:bg-emerald-500/20 rounded cursor-pointer"
                                    title="Edit Anak"
                                  >
                                    <Edit2 className="w-3 h-3" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setDeleteTarget(anak)}
                                    className="p-1 text-rose-300 hover:bg-rose-500/20 rounded cursor-pointer"
                                    title="Hapus Data Anak"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </>
                              )}
                            </div>
                            <div className="flex items-center justify-center gap-1 mb-1">
                              <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded inline-block">
                                Anak Ke-{idx + 1}
                              </span>
                              {anak.statusKeanggotaan === 'Meninggal' && (
                                <span className="text-[9px] font-bold text-purple-300 bg-purple-500/30 px-1 py-0.5 rounded inline-block">
                                  ✝ {anak.jenisKelamin === 'P' ? 'Almh.' : 'Alm.'}
                                </span>
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={() => setProfileTarget(anak)}
                              className="font-bold text-slate-100 hover:text-emerald-300 text-xs text-center mx-auto block cursor-pointer"
                            >
                              {anak.namaLengkap}
                            </button>
                            <p className="text-[10px] text-slate-400 font-mono mt-0.5">Lahir: {anak.tanggalLahir || '-'}</p>
                            <p className="text-[10px] text-slate-300 mt-0.5">{anak.pekerjaan}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Famili Lain Level */}
                  {familiLainList.length > 0 && (
                    <div className="pt-3 border-t border-slate-800">
                      <p className="text-center text-[10px] font-bold text-amber-400 uppercase tracking-wider mb-2">
                        Famili Lain ({familiLainList.length} Orang)
                      </p>
                      <div className="flex flex-wrap justify-center gap-3">
                        {familiLainList.map((fmLain) => (
                          <div
                            key={fmLain.id}
                            className={`relative group rounded-xl p-2.5 text-center min-w-[160px] border transition ${
                              fmLain.statusKeanggotaan === 'Meninggal'
                                ? 'bg-purple-950/40 border-purple-500/40'
                                : 'bg-amber-950/30 border-amber-500/30'
                            }`}
                          >
                            <div className="absolute top-1.5 right-1.5 flex items-center gap-1 opacity-80 group-hover:opacity-100 transition">
                              <button
                                type="button"
                                onClick={() => setProfileTarget(fmLain)}
                                className="p-1 text-sky-300 hover:bg-sky-500/20 rounded cursor-pointer"
                                title="Lihat Profil Famili Lain"
                              >
                                <Eye className="w-3 h-3" />
                              </button>
                              {canEdit && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => handleOpenEdit(fmLain)}
                                    className="p-1 text-amber-300 hover:bg-amber-500/20 rounded cursor-pointer"
                                    title="Edit Famili Lain"
                                  >
                                    <Edit2 className="w-3 h-3" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setDeleteTarget(fmLain)}
                                    className="p-1 text-rose-300 hover:bg-rose-500/20 rounded cursor-pointer"
                                    title="Hapus Famili Lain"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </>
                              )}
                            </div>
                            <div className="flex items-center justify-center gap-1 mb-1">
                              <span className="text-[9px] font-bold uppercase tracking-wider text-amber-400 bg-amber-500/20 px-2 py-0.5 rounded inline-block">
                                Famili Lain
                              </span>
                              {fmLain.statusKeanggotaan === 'Meninggal' && (
                                <span className="text-[9px] font-bold text-purple-300 bg-purple-500/30 px-1 py-0.5 rounded inline-block">
                                  ✝ {fmLain.jenisKelamin === 'P' ? 'Almh.' : 'Alm.'}
                                </span>
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={() => setProfileTarget(fmLain)}
                              className="font-bold text-slate-100 hover:text-amber-300 text-xs text-center mx-auto block cursor-pointer"
                            >
                              {fmLain.namaLengkap}
                            </button>
                            <p className="text-[10px] text-slate-400 font-mono mt-0.5">Lahir: {fmLain.tanggalLahir || '-'}</p>
                            <p className="text-[10px] text-slate-300 mt-0.5">{fmLain.pekerjaan}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4 overflow-hidden animate-in fade-in duration-150">
          <div className="bg-slate-900 rounded-2xl shadow-2xl w-full max-w-2xl border border-slate-800 text-slate-100 flex flex-col max-h-[92dvh] sm:max-h-[88vh] overflow-hidden my-auto">
            <div className="bg-slate-950 p-4 px-5 border-b border-slate-800 flex items-center justify-between shrink-0">
              <h3 className="font-bold text-sm text-slate-100">
                {editingItem ? 'Edit Data Anggota Keluarga' : 'Tambah Anggota Keluarga Baru'}
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
                <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">No. KJJ (Kartu Jemaat)</label>
                  <input
                    type="text"
                    required
                    value={formData.noKjj || ''}
                    onChange={(e) => setFormData({ ...formData, noKjj: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-indigo-300 font-mono font-bold focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Nama Lengkap</label>
                  <input
                    type="text"
                    required
                    value={formData.namaLengkap || ''}
                    onChange={(e) => setFormData({ ...formData, namaLengkap: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">NIK (16 digit)</label>
                  <input
                    type="text"
                    value={formData.nik || ''}
                    onChange={(e) => setFormData({ ...formData, nik: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 font-mono focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Jenis Kelamin</label>
                  <select
                    value={formData.jenisKelamin || 'L'}
                    onChange={(e) =>
                      setFormData({ ...formData, jenisKelamin: e.target.value as 'L' | 'P' })
                    }
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="L" className="bg-slate-900">Laki-laki (L)</option>
                    <option value="P" className="bg-slate-900">Perempuan (P)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Tempat Lahir</label>
                  <input
                    type="text"
                    value={formData.tempatLahir || ''}
                    onChange={(e) => setFormData({ ...formData, tempatLahir: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Tanggal Lahir</label>
                  <input
                    type="date"
                    value={formData.tanggalLahir || ''}
                    onChange={(e) => setFormData({ ...formData, tanggalLahir: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Lingkungan / Sektor</label>
                  <select
                    value={formData.rayon || (lingkungkans[0] || 'Lingkungan 1')}
                    onChange={(e) => setFormData({ ...formData, rayon: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  >
                    {lingkungkans.map((r) => {
                      const matchedL = lingkunganList?.find((l) => l.nama === r);
                      return (
                        <option key={r} value={r} className="bg-slate-900">
                          {r} {matchedL?.wilayahSektor ? `(${matchedL.wilayahSektor})` : ''}
                        </option>
                      );
                    })}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Hubungan Keluarga</label>
                  <select
                    value={formData.hubunganKeluarga || 'Kepala Keluarga'}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        hubunganKeluarga: e.target.value as WargaJemaat['hubunganKeluarga'],
                      })
                    }
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="Kepala Keluarga" className="bg-slate-900">Kepala Keluarga</option>
                    <option value="Istri" className="bg-slate-900">Istri</option>
                    <option value="Anak" className="bg-slate-900">Anak</option>
                    <option value="Famili Lain" className="bg-slate-900">Famili Lain</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Pekerjaan</label>
                  <input
                    type="text"
                    value={formData.pekerjaan || ''}
                    onChange={(e) => setFormData({ ...formData, pekerjaan: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="statusBaptis"
                    checked={!!formData.statusBaptis}
                    onChange={(e) => setFormData({ ...formData, statusBaptis: e.target.checked })}
                    className="w-4 h-4 text-indigo-600 rounded bg-slate-900 border-slate-700"
                  />
                  <label htmlFor="statusBaptis" className="font-semibold text-slate-200">
                    Sudah Dibaptis
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="statusSidi"
                    checked={!!formData.statusSidi}
                    onChange={(e) => setFormData({ ...formData, statusSidi: e.target.checked })}
                    className="w-4 h-4 text-indigo-600 rounded bg-slate-900 border-slate-700"
                  />
                  <label htmlFor="statusSidi" className="font-semibold text-slate-200">
                    Sudah SIDI
                  </label>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Status Keanggotaan</label>
                  <select
                    value={formData.statusKeanggotaan || 'Tetap'}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        statusKeanggotaan: e.target.value as WargaJemaat['statusKeanggotaan'],
                      })
                    }
                    className="w-full p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Tetap" className="bg-slate-900">Tetap</option>
                    <option value="Titipan" className="bg-slate-900">Titipan</option>
                    <option value="Pindah" className="bg-slate-900">Pindah</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Status Pernikahan</label>
                  <select
                    value={formData.statusNikah || 'Belum Menikah'}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        statusNikah: e.target.value as WargaJemaat['statusNikah'],
                      })
                    }
                    className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Belum Menikah" className="bg-slate-900">Belum Menikah</option>
                    <option value="Menikah" className="bg-slate-900">Menikah (Sudah Nikah Kudus)</option>
                    <option value="Janda" className="bg-slate-900">Janda</option>
                    <option value="Duda" className="bg-slate-900">Duda</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Tanggal Pernikahan {formData.statusNikah === 'Menikah' ? '(Kudus)' : ''}
                  </label>
                  <input
                    type="date"
                    value={formData.tanggalPernikahan || ''}
                    onChange={(e) => setFormData({ ...formData, tanggalPernikahan: e.target.value })}
                    placeholder="Pilih Tanggal Pernikahan"
                    className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">No. HP / WhatsApp</label>
                  <input
                    type="text"
                    value={formData.noHp || ''}
                    onChange={(e) => setFormData({ ...formData, noHp: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Alamat Lengkap</label>
                  <input
                    type="text"
                    value={formData.alamat || ''}
                    onChange={(e) => setFormData({ ...formData, alamat: e.target.value })}
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
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold shadow-md shadow-indigo-600/30 cursor-pointer"
              >
                Simpan Data Anggota
              </button>
            </div>
          </form>
        </div>
      </div>
    )}

      {/* Modal Confirm Delete */}
      <DeleteConfirmModal
        isOpen={!!deleteTarget}
        title="Konfirmasi Hapus Data Keluarga Jemaat"
        itemName={
          deleteTarget
            ? `${deleteTarget.namaLengkap} - No. KJJ: ${deleteTarget.noKjj}`
            : ''
        }
        description="Apakah Anda yakin ingin menghapus data anggota keluarga jemaat ini? Data pendaftaran anggota jemaat baru serta akun pengguna dan role hak akses user yang terhubung akan secara otomatis ikut terhapus dari sistem."
        onConfirm={async () => {
          if (deleteTarget) {
            await deleteWargaJemaat(deleteTarget.id);
          }
        }}
        onClose={() => setDeleteTarget(null)}
      />

      {/* Modal Popup Peringatan Kepala Keluarga Ganda */}
      {doubleKepalaWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-md overflow-hidden bg-slate-900 border border-amber-500/30 rounded-2xl shadow-2xl text-slate-100">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-amber-950/30">
              <div className="flex items-center gap-2.5 text-amber-400 font-bold text-sm sm:text-base">
                <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20">
                  <AlertTriangle className="w-5 h-5 text-amber-400" />
                </div>
                <span>Peringatan: Kepala Keluarga Ganda</span>
              </div>
              <button
                onClick={() => setDoubleKepalaWarning(null)}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-5 space-y-4">
              <div className="p-3.5 bg-amber-950/40 border border-amber-500/30 rounded-xl">
                <p className="text-[11px] text-amber-300/80 uppercase font-bold tracking-wider mb-1">
                  Kartu Keluarga Jemaat (KJJ): {doubleKepalaWarning.noKjj}
                </p>
                <p className="text-sm font-extrabold text-amber-100 leading-snug break-words">
                  Kepala Keluarga Terdaftar: {doubleKepalaWarning.existingName}
                </p>
              </div>

              <p className="text-xs text-slate-200 leading-relaxed">
                Rincian data anggota keluarga pada Kartu Keluarga (KJJ) ini <strong>telah memiliki Kepala Keluarga</strong>. Sistem tidak mengizinkan penambahan atau penetapan hubungan keluarga sebagai <strong>Kepala Keluarga ganda</strong>.
              </p>

              <p className="text-xs text-slate-400 italic bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                💡 Silakan ubah opsi Hubungan Keluarga (misalnya Istri, Anak, atau Famili Lain), atau perbarui data Kepala Keluarga yang ada terlebih dahulu.
              </p>
            </div>

            {/* Action Button */}
            <div className="flex items-center justify-end p-4 bg-slate-950/80 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setDoubleKepalaWarning(null)}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 transition shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer min-h-[44px]"
              >
                <span>Mengerti & Tutup</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Export Sensus Data Keluarga ke Excel */}
      {isExportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-xl overflow-hidden bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl text-slate-100 flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-100">
                    Export Data Sensus Keluarga (Excel)
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Format file .xlsx standar resmi sesuai template sensus GKE
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsExportModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 space-y-4 overflow-y-auto">
              {/* Info banner */}
              <div className="bg-blue-950/40 border border-blue-500/30 rounded-xl p-3.5 text-xs text-slate-200 space-y-1.5">
                <p className="font-bold text-blue-300 flex items-center gap-1.5">
                  <span>✨ Fitur &amp; Struktur File Excel Sensus:</span>
                </p>
                <ul className="list-disc list-inside text-slate-300 space-y-1 text-[11px]">
                  <li><strong>Sheet 1 (Data Sensus Keluarga):</strong> Kolom lengkap dari No. KJJ, NIK, Nama, Lingkungan, Sakramen hingga No. HP dengan pemisahan warna antar KK.</li>
                  <li><strong>Sheet 2 (Ringkasan Statistik):</strong> Rekapitulasi jumlah KK/Jiwa per Lingkungan serta persentase Golongan Usia (Anak, Remaja, Dewasa, Lansia).</li>
                  <li><strong>Sheet 3 (Petunjuk &amp; Referensi):</strong> Panduan format dan nama Lingkungan resmi agar dapat diedit &amp; diimport kembali kapan saja.</li>
                </ul>
              </div>

              {/* Option 1: Export Semua Data */}
              <div className="bg-slate-950/70 border border-slate-800 hover:border-slate-700 rounded-xl p-4 transition">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-100">1. Seluruh Data Sensus Jemaat</span>
                      <span className="bg-emerald-500/20 text-emerald-300 font-mono text-[11px] px-2 py-0.5 rounded-md border border-emerald-500/30 font-bold">
                        {wargaJemaatList.length} Jiwa ({totalKkAll} KK)
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      Mengekspor seluruh anggota keluarga jemaat yang terdaftar dari semua lingkungan.
                    </p>
                  </div>
                  <button
                    onClick={() => handleExportExcel('all')}
                    disabled={isExporting || wargaJemaatList.length === 0}
                    className="shrink-0 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition shadow-md shadow-emerald-600/30 cursor-pointer disabled:opacity-50"
                  >
                    {isExporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                    <span>Unduh Semua</span>
                  </button>
                </div>
              </div>

              {/* Option 2: Export Data Terfilter */}
              <div className="bg-slate-950/70 border border-slate-800 hover:border-slate-700 rounded-xl p-4 transition">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-100">2. Data Sesuai Filter &amp; Pencarian Aktif</span>
                      <span className="bg-blue-500/20 text-blue-300 font-mono text-[11px] px-2 py-0.5 rounded-md border border-blue-500/30 font-bold">
                        {filteredList.length} Jiwa ({totalKk} KK)
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      Filter saat ini: {selectedRayon ? <strong className="text-blue-300">{selectedRayon}</strong> : 'Semua Lingkungan'}
                      {search ? <span> • Pencarian: &ldquo;{search}&rdquo;</span> : ''}
                    </p>
                  </div>
                  <button
                    onClick={() => handleExportExcel('filtered')}
                    disabled={isExporting || filteredList.length === 0}
                    className="shrink-0 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition shadow-md shadow-blue-600/30 cursor-pointer disabled:opacity-50"
                  >
                    {isExporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                    <span>Unduh Terfilter</span>
                  </button>
                </div>
              </div>

              {/* Option 3: Export Per Lingkungan Tertentu */}
              <div className="bg-slate-950/70 border border-slate-800 hover:border-slate-700 rounded-xl p-4 transition space-y-3">
                <div>
                  <span className="font-bold text-sm text-slate-100">3. Export Berdasarkan Lingkungan / Rayon Tertentu</span>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Pilih salah satu lingkungan spesifik untuk diekspor ke Excel:
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2.5">
                  <select
                    value={exportSelectedRayon || (lingkungkans[0] || '')}
                    onChange={(e) => setExportSelectedRayon(e.target.value)}
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-teal-500"
                  >
                    {lingkungkans.map((ling) => {
                      const count = wargaJemaatList.filter((w) => w.rayon === ling).length;
                      return (
                        <option key={ling} value={ling}>
                          {ling} ({count} Jiwa)
                        </option>
                      );
                    })}
                  </select>
                  <button
                    onClick={() => {
                      const chosen = exportSelectedRayon || lingkungkans[0];
                      if (chosen) handleExportExcel('custom_rayon', chosen);
                    }}
                    disabled={isExporting}
                    className="flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition shadow-md shadow-teal-600/30 cursor-pointer disabled:opacity-50"
                  >
                    {isExporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                    <span>Unduh Lingkungan</span>
                  </button>
                </div>
              </div>

              {/* Option 4: Template Kosong */}
              <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                <span className="text-xs text-slate-400">Butuh template kosong dengan format contoh pengisian?</span>
                <button
                  onClick={handleDownloadTemplate}
                  className="flex items-center gap-1.5 text-xs text-teal-400 hover:text-teal-300 font-semibold hover:underline cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Unduh Template Kosong</span>
                </button>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end p-4 border-t border-slate-800 bg-slate-950/80">
              <button
                type="button"
                onClick={() => setIsExportModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Import Sensus Data Keluarga via Excel */}
      <ImportSensusExcelModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
      />

      {/* Modal Hapus Data Sensus Keluarga (Dilindungi Password) */}
      <DeleteKeluargaModal
        isOpen={isDeleteKeluargaModalOpen}
        onClose={() => {
          setIsDeleteKeluargaModalOpen(false);
          setSelectedDeleteKjj(undefined);
        }}
        initialNoKjj={selectedDeleteKjj}
      />

      {/* Modal Pencatatan Warga Berpulang (Tata Kelola Kematian & Pelayanan Pastoral) */}
      {isWafatModalOpen && wafatTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="relative w-full max-w-2xl overflow-hidden bg-slate-900 border border-purple-500/40 rounded-2xl shadow-2xl text-slate-100 my-auto flex flex-col max-h-[92vh]">
            {/* Header */}
            <div className="flex items-center justify-between p-4 px-5 border-b border-slate-800 bg-gradient-to-r from-purple-950/80 via-slate-950 to-slate-900 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  <HeartCrack className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-100 flex items-center gap-2">
                    <span>Pencatatan Warga Jemaat Berpulang</span>
                    <span className="text-[11px] bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-md border border-purple-500/30 font-bold">
                      {wafatTarget.jenisKelamin === 'P' ? 'Almh.' : 'Alm.'}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {wafatTarget.namaLengkap} • No. KJJ: {wafatTarget.noKjj} ({wafatTarget.rayon})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsWafatModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Pastoral Quote */}
            <div className="px-5 py-2.5 bg-purple-950/40 border-b border-purple-500/20 text-[11px] text-purple-200/90 italic flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-purple-400 shrink-0" />
              <span>"Berbahagialah orang-orang mati yang mati dalam Tuhan, sejak sekarang ini." — Wahyu 14:13</span>
            </div>

            {/* Form Content */}
            <div className="p-5 space-y-4 text-xs overflow-y-auto flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Tanggal Berpulang / Meninggal <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={wafatForm.tanggalMeninggal || ''}
                    onChange={(e) => setWafatForm({ ...wafatForm, tanggalMeninggal: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Tempat Meninggal Dunia <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: RSUD Doris Sylvanus / Kediaman"
                    value={wafatForm.tempatMeninggal || ''}
                    onChange={(e) => setWafatForm({ ...wafatForm, tempatMeninggal: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Tempat Pemakaman <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: TPU Kristen Km. 2.5 Tjilik Riwut"
                    value={wafatForm.tempatPemakaman || ''}
                    onChange={(e) => setWafatForm({ ...wafatForm, tempatPemakaman: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Pelayan Ibadah Pemakaman
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Pdt. Pembimbing Lingkungan / Majelis"
                    value={wafatForm.pelayanPemakaman || ''}
                    onChange={(e) => setWafatForm({ ...wafatForm, pelayanPemakaman: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Keluarga yang Ditinggalkan (Dukacita)
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Keluarga Besar Bpk. / Ibu..."
                    value={wafatForm.keluargaDitinggalkan || ''}
                    onChange={(e) => setWafatForm({ ...wafatForm, keluargaDitinggalkan: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Nomor Surat Keterangan Kematian Resmi
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: 474.3/001/MJ-GKE/2026"
                    value={wafatForm.nomorSuratKematian || ''}
                    onChange={(e) => setWafatForm({ ...wafatForm, nomorSuratKematian: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-amber-300 font-mono font-bold focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Catatan Pastoral &amp; Riwayat Khusus
                </label>
                <textarea
                  rows={2}
                  placeholder="Catatan penghiburan pastoral, riwayat sakit, atau pesan keluarga..."
                  value={wafatForm.keteranganMeninggal || ''}
                  onChange={(e) => setWafatForm({ ...wafatForm, keteranganMeninggal: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                />
              </div>

              {/* Tata Kelola Otomatisasi Administrasi KKJ & Pastoral */}
              <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5 space-y-3">
                <span className="font-bold text-slate-200 flex items-center gap-1.5 text-xs text-purple-300">
                  <HeartHandshake className="w-4 h-4" />
                  Otomatisasi Tata Kelola KKJ &amp; Pelayanan Pastoral
                </span>

                {/* If deceased was Kepala Keluarga, select successor */}
                {wafatTarget.hubunganKeluarga === 'Kepala Keluarga' && (
                  <div className="bg-purple-950/30 border border-purple-500/30 p-3 rounded-lg space-y-2">
                    <label className="block font-bold text-purple-200">
                      Penetapan Kepala Keluarga Baru untuk Kartu Keluarga Ini:
                    </label>
                    <select
                      value={wafatForm.kepalaKeluargaBaruId || ''}
                      onChange={(e) => setWafatForm({ ...wafatForm, kepalaKeluargaBaruId: e.target.value })}
                      className="w-full p-2 rounded-lg bg-slate-900 border border-purple-500/30 text-slate-200 focus:outline-none text-xs"
                    >
                      <option value="">-- Tetapkan Nanti / Belum Ada Penerus --</option>
                      {wargaJemaatList
                        .filter(
                          (w) =>
                            (w.noKjj || '').trim().toLowerCase() === (wafatTarget.noKjj || '').trim().toLowerCase() &&
                            w.id !== wafatTarget.id &&
                            w.statusKeanggotaan !== 'Meninggal'
                        )
                        .map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.namaLengkap} ({m.hubunganKeluarga} • Usia: {calculateAge(m.tanggalLahir)})
                          </option>
                        ))}
                    </select>
                    <p className="text-[10px] text-slate-400">
                      Sistem akan memperbarui hubungan keluarga anggota terpilih menjadi 'Kepala Keluarga' pada KKJ {wafatTarget.noKjj}.
                    </p>
                  </div>
                )}

                <label className="flex items-start gap-2.5 cursor-pointer text-slate-300 hover:text-slate-100">
                  <input
                    type="checkbox"
                    checked={wafatForm.updatePasanganStatus}
                    onChange={(e) => setWafatForm({ ...wafatForm, updatePasanganStatus: e.target.checked })}
                    className="rounded border-slate-700 text-purple-600 focus:ring-purple-500 mt-0.5"
                  />
                  <span>
                    Perbarui status nikah pasangan hidup di dalam KK menjadi <strong>{wafatTarget.jenisKelamin === 'L' ? 'Janda' : 'Duda'}</strong>
                  </span>
                </label>

                <label className="flex items-start gap-2.5 cursor-pointer text-slate-300 hover:text-slate-100">
                  <input
                    type="checkbox"
                    checked={wafatForm.publishToWartaDuka}
                    onChange={(e) => setWafatForm({ ...wafatForm, publishToWartaDuka: e.target.checked })}
                    className="rounded border-slate-700 text-purple-600 focus:ring-purple-500 mt-0.5"
                  />
                  <span>
                    Otomatis sinkronisasikan kabar duka cita ke <strong>Warta Jemaat / Berita Duka</strong> aktif
                  </span>
                </label>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-800 bg-slate-950/90 flex flex-wrap items-center justify-between gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setIsWafatModalOpen(false)}
                className="px-4 py-2 border border-slate-700 rounded-xl text-slate-300 hover:bg-slate-800 font-semibold cursor-pointer"
              >
                Batal
              </button>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  disabled={isSavingWafat}
                  onClick={() => handleSaveWafat('surat_keterangan_kematian')}
                  className="px-3 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl font-bold flex items-center gap-1.5 transition shadow-md shadow-amber-600/20 cursor-pointer disabled:opacity-50 text-xs"
                  title="Simpan data kematian dan langsung buka Surat Keterangan Kematian untuk dicetak"
                >
                  <FileText className="w-4 h-4" />
                  <span>Simpan &amp; Cetak Surat Kematian</span>
                </button>

                <button
                  type="button"
                  disabled={isSavingWafat}
                  onClick={() => handleSaveWafat('surat_duka_cita')}
                  className="px-3 py-2 bg-purple-700 hover:bg-purple-600 text-white rounded-xl font-bold flex items-center gap-1.5 transition shadow-md shadow-purple-700/20 cursor-pointer disabled:opacity-50 text-xs"
                  title="Simpan data kematian dan langsung buka Surat Pernyataan Duka Cita untuk dicetak"
                >
                  <HeartCrack className="w-4 h-4" />
                  <span>Simpan &amp; Cetak Surat Duka</span>
                </button>

                <button
                  type="button"
                  disabled={isSavingWafat}
                  onClick={() => handleSaveWafat(null)}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-bold flex items-center gap-1.5 transition shadow-md shadow-purple-600/30 cursor-pointer disabled:opacity-50 text-xs"
                >
                  {isSavingWafat ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  <span>Simpan Buku Kematian</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Kembalikan Status Anggota Aktif */}
      {revertTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-md overflow-hidden bg-slate-900 border border-teal-500/30 rounded-2xl shadow-2xl text-slate-100">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-teal-950/30">
              <div className="flex items-center gap-2.5 text-teal-400 font-bold text-sm sm:text-base">
                <div className="p-2 rounded-xl bg-teal-500/10 border border-teal-500/20">
                  <RotateCcw className="w-5 h-5 text-teal-400" />
                </div>
                <span>Kembalikan Status Anggota Aktif</span>
              </div>
              <button
                onClick={() => setRevertTarget(null)}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <p className="text-slate-200 leading-relaxed">
                Apakah Anda yakin ingin mengembalikan status keanggotaan warga jemaat berikut menjadi <strong>Warga Tetap (Aktif)</strong>?
              </p>
              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 space-y-1">
                <p className="font-bold text-teal-300 text-sm">{revertTarget.namaLengkap}</p>
                <p className="text-slate-400 text-[11px] font-mono">No. KJJ: {revertTarget.noKjj} • Lingkungan: {revertTarget.rayon}</p>
              </div>
              <p className="text-slate-400 italic">
                Tindakan ini digunakan untuk mengoreksi jika terjadi kekeliruan pencatatan administrasi. Riwayat tanggal wafat akan dibersihkan.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 p-4 bg-slate-950/80 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setRevertTarget(null)}
                className="px-4 py-2 border border-slate-700 rounded-xl text-slate-300 hover:bg-slate-800 font-semibold cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmRevertActive}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl font-bold transition shadow-md shadow-teal-600/30 cursor-pointer"
              >
                Ya, Aktifkan Kembali
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Detail Profil Warga Jemaat */}
      {profileTarget && (
        <ProfilWargaModal
          warga={profileTarget}
          wargaJemaatList={wargaJemaatList}
          onClose={() => setProfileTarget(null)}
          onSelectWarga={(w) => setProfileTarget(w)}
          onOpenEdit={(w) => {
            setProfileTarget(null);
            handleOpenEdit(w);
          }}
          onOpenWafatModal={(w) => {
            setProfileTarget(null);
            handleOpenWafatModal(w);
          }}
          onPrintKKJ={(noKjj) => {
            openPrintReport({
              reportType: 'kartu_keluarga_jemaat',
              noKjj,
            });
          }}
          onPrintSuratKematian={(wargaId) => {
            openPrintReport({
              reportType: 'surat_keterangan_kematian',
              wargaId,
            });
          }}
          onPrintSuratDukaCita={(wargaId) => {
            openPrintReport({
              reportType: 'surat_duka_cita',
              wargaId,
            });
          }}
          canEdit={canEdit}
        />
      )}
    </div>
  );
};

