import React, { useState, useMemo } from 'react';
import {
  HeartCrack,
  Users,
  FileText,
  Printer,
  Download,
  Search,
  Plus,
  RotateCcw,
  Edit2,
  Eye,
  BookOpen,
  GitFork,
  Calendar,
  MapPin,
  Church,
  X,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Newspaper,
  FolderArchive,
  ArrowRight,
  ExternalLink,
  ShieldAlert,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { WargaJemaat, BeritaDukaItem } from '../../types';
import { ProfilWargaModal } from '../ProfilWargaModal';
import { downloadDeceasedExcel } from '../../utils/sensusExcelUtils';

export const KematianJemaatModule: React.FC = () => {
  const {
    wargaJemaatList,
    updateWargaJemaat,
    openPrintReport,
    currentUser,
    lingkunganList,
    settings,
    beritaJemaatList,
    updateBeritaJemaat,
    setActiveTab,
    showToast,
  } = useApp();

  // Search and Filters
  const [search, setSearch] = useState('');
  const [selectedRayon, setSelectedRayon] = useState('');
  const [selectedTahun, setSelectedTahun] = useState('');
  const [wartaStatusFilter, setWartaStatusFilter] = useState<'semua' | 'terbit' | 'belum'>('semua');

  // Modals state
  const [isWafatModalOpen, setIsWafatModalOpen] = useState(false);
  const [wafatTarget, setWafatTarget] = useState<WargaJemaat | null>(null);
  const [isEditingExisting, setIsEditingExisting] = useState(false);
  const [isSavingWafat, setIsSavingWafat] = useState(false);
  const [profileTarget, setProfileTarget] = useState<WargaJemaat | null>(null);
  const [revertTarget, setRevertTarget] = useState<WargaJemaat | null>(null);
  const [selectedKkjForDetail, setSelectedKkjForDetail] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [selectedActiveWargaId, setSelectedActiveWargaId] = useState('');
  const [wargaSearchInput, setWargaSearchInput] = useState('');

  // Form State
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

  const lingkungkans =
    lingkunganList && lingkunganList.length > 0
      ? lingkunganList.filter((l) => l.status === 'Aktif').map((l) => l.nama)
      : [
          'Lingkungan I - Ebenezer',
          'Lingkungan II - Yerusalem',
          'Lingkungan III - Galilea',
          'Lingkungan IV - Betlehem',
          'Lingkungan V - Sion',
        ];

  // Active Warta Jemaat (edition currently active / most recent)
  const activeWarta = useMemo(() => {
    if (!beritaJemaatList || beritaJemaatList.length === 0) return null;
    return (
      beritaJemaatList.find((b) => b.status === 'Diterbitkan') ||
      beritaJemaatList.find((b) => b.status === 'Draf') ||
      beritaJemaatList[0]
    );
  }, [beritaJemaatList]);

  // All deceased members
  const allDeceasedList = useMemo(() => {
    return wargaJemaatList.filter((w) => w.statusKeanggotaan === 'Meninggal');
  }, [wargaJemaatList]);

  // Active members for death registration dropdown
  const activeMembersForSelect = useMemo(() => {
    return wargaJemaatList.filter((w) => w.statusKeanggotaan !== 'Meninggal');
  }, [wargaJemaatList]);

  // Filtered active members matching search input
  const filteredActiveMembers = useMemo(() => {
    if (!wargaSearchInput.trim()) return activeMembersForSelect.slice(0, 50);
    const q = wargaSearchInput.toLowerCase();
    return activeMembersForSelect.filter(
      (w) =>
        (w.namaLengkap || '').toLowerCase().includes(q) ||
        (w.noKjj || '').toLowerCase().includes(q) ||
        (w.nik || '').includes(q)
    );
  }, [activeMembersForSelect, wargaSearchInput]);

  // Helper: check if a deceased is present in active Warta's beritaDukaList
  const isDeceasedInWarta = (deceased: WargaJemaat): boolean => {
    if (!activeWarta || !activeWarta.beritaDukaList) return false;
    const cleanName = (deceased.namaLengkap || '').trim().toLowerCase();
    return activeWarta.beritaDukaList.some(
      (item) =>
        (item.namaMeninggal || '').trim().toLowerCase().includes(cleanName) ||
        cleanName.includes((item.namaMeninggal || '').trim().toLowerCase())
    );
  };

  // Helper age calculation
  const calculateAge = (birthDate?: string, deathDate?: string) => {
    if (!birthDate) return '-';
    const b = new Date(birthDate);
    const d = deathDate ? new Date(deathDate) : new Date();
    let age = d.getFullYear() - b.getFullYear();
    const m = d.getMonth() - b.getMonth();
    if (m < 0 || (m === 0 && d.getDate() < b.getDate())) {
      age--;
    }
    return age >= 0 ? `${age} Tahun` : '-';
  };

  // Official Surat Kematian generator
  const generateNomorSuratKematian = () => {
    const year = new Date().getFullYear();
    const count = allDeceasedList.length + 1;
    const formattedNum = String(count).padStart(3, '0');
    return `474.3/${formattedNum}/MJ-GKE/${year}`;
  };

  // Filtered deceased list
  const filteredDeceasedList = useMemo(() => {
    return allDeceasedList.filter((item) => {
      const q = search.toLowerCase();
      const matchesSearch =
        (item.namaLengkap || '').toLowerCase().includes(q) ||
        (item.noKjj || '').toLowerCase().includes(q) ||
        (item.nik || '').includes(q) ||
        (item.nomorSuratKematian || '').toLowerCase().includes(q) ||
        (item.pelayanPemakaman || '').toLowerCase().includes(q) ||
        (item.tempatPemakaman || '').toLowerCase().includes(q) ||
        (item.keluargaDitinggalkan || '').toLowerCase().includes(q);

      const matchesRayon = !selectedRayon || item.rayon === selectedRayon;

      const itemYear = item.tanggalMeninggal
        ? item.tanggalMeninggal.split('-')[0]
        : '';
      const matchesTahun = !selectedTahun || itemYear === selectedTahun;

      let matchesWarta = true;
      if (wartaStatusFilter === 'terbit') {
        matchesWarta = isDeceasedInWarta(item);
      } else if (wartaStatusFilter === 'belum') {
        matchesWarta = !isDeceasedInWarta(item);
      }

      return matchesSearch && matchesRayon && matchesTahun && matchesWarta;
    });
  }, [allDeceasedList, search, selectedRayon, selectedTahun, wartaStatusFilter, activeWarta]);

  // Statistics
  const totalMeninggalCount = allDeceasedList.length;
  const countLaki = allDeceasedList.filter((w) => w.jenisKelamin === 'L').length;
  const countPerempuan = allDeceasedList.filter((w) => w.jenisKelamin === 'P').length;
  const currentYear = new Date().getFullYear();
  const countTahunIni = allDeceasedList.filter(
    (w) => w.tanggalMeninggal && w.tanggalMeninggal.startsWith(String(currentYear))
  ).length;
  const distinctKkjBerduka = new Set(allDeceasedList.map((w) => w.noKjj)).size;
  const countTerbitWarta = allDeceasedList.filter((w) => isDeceasedInWarta(w)).length;

  // Available Years
  const availableYears = useMemo(() => {
    const years = Array.from(
      new Set(
        allDeceasedList
          .filter((w) => w.tanggalMeninggal)
          .map((w) => w.tanggalMeninggal!.split('-')[0])
      )
    );
    return years.sort((a, b) => Number(b) - Number(a));
  }, [allDeceasedList]);

  // Open Death Modal to Record New Deceased
  const handleOpenAddNew = () => {
    setIsEditingExisting(false);
    setWafatTarget(null);
    setSelectedActiveWargaId('');
    setWargaSearchInput('');
    setWafatForm({
      tanggalMeninggal: new Date().toISOString().split('T')[0],
      tempatMeninggal: 'Kediaman Keluarga',
      tempatPemakaman: 'TPU Kristen',
      pelayanPemakaman: '',
      keluargaDitinggalkan: '',
      keteranganMeninggal: 'Telah berpulang ke Rumah Bapa di Sorga dalam damai sejahtera.',
      nomorSuratKematian: generateNomorSuratKematian(),
      updatePasanganStatus: true,
      kepalaKeluargaBaruId: '',
      publishToWartaDuka: true,
    });
    setIsWafatModalOpen(true);
  };

  // Open Death Modal to Edit Existing Deceased Record
  const handleOpenEditWafat = (warga: WargaJemaat) => {
    setIsEditingExisting(true);
    setWafatTarget(warga);
    setSelectedActiveWargaId(warga.id);

    // Find spouse in the same KKJ
    const spouse = wargaJemaatList.find(
      (w) =>
        (w.noKjj || '').trim().toLowerCase() === (warga.noKjj || '').trim().toLowerCase() &&
        w.id !== warga.id &&
        (w.hubunganKeluarga === 'Istri' ||
          (warga.hubunganKeluarga === 'Istri' && w.hubunganKeluarga === 'Kepala Keluarga'))
    );

    // Potential successor for Kepala Keluarga
    const otherFamilyMembers = wargaJemaatList.filter(
      (w) =>
        (w.noKjj || '').trim().toLowerCase() === (warga.noKjj || '').trim().toLowerCase() &&
        w.id !== warga.id &&
        w.statusKeanggotaan !== 'Meninggal'
    );
    const defaultSuccessor = spouse || otherFamilyMembers[0];

    setWafatForm({
      tanggalMeninggal: warga.tanggalMeninggal || new Date().toISOString().split('T')[0],
      tempatMeninggal: warga.tempatMeninggal || 'Kediaman Keluarga',
      tempatPemakaman: warga.tempatPemakaman || 'TPU Kristen',
      pelayanPemakaman: warga.pelayanPemakaman || '',
      keluargaDitinggalkan:
        warga.keluargaDitinggalkan || `Keluarga Besar Alm. ${warga.namaLengkap}`,
      keteranganMeninggal:
        warga.keteranganMeninggal ||
        'Telah berpulang ke Rumah Bapa di Sorga dalam damai sejahtera.',
      nomorSuratKematian: warga.nomorSuratKematian || generateNomorSuratKematian(),
      updatePasanganStatus: true,
      kepalaKeluargaBaruId: defaultSuccessor ? defaultSuccessor.id : '',
      publishToWartaDuka: isDeceasedInWarta(warga) ? false : true,
    });
    setIsWafatModalOpen(true);
  };

  // Handle member selection when adding new deceased
  const handleSelectActiveWarga = (wId: string) => {
    setSelectedActiveWargaId(wId);
    const selected = wargaJemaatList.find((w) => w.id === wId);
    if (!selected) {
      setWafatTarget(null);
      return;
    }
    setWafatTarget(selected);

    // Find spouse
    const spouse = wargaJemaatList.find(
      (w) =>
        (w.noKjj || '').trim().toLowerCase() === (selected.noKjj || '').trim().toLowerCase() &&
        w.id !== selected.id &&
        (w.hubunganKeluarga === 'Istri' ||
          (selected.hubunganKeluarga === 'Istri' && w.hubunganKeluarga === 'Kepala Keluarga'))
    );

    // Other family members in the same KKJ
    const otherFamilyMembers = wargaJemaatList.filter(
      (w) =>
        (w.noKjj || '').trim().toLowerCase() === (selected.noKjj || '').trim().toLowerCase() &&
        w.id !== selected.id &&
        w.statusKeanggotaan !== 'Meninggal'
    );
    const defaultSuccessor = spouse || otherFamilyMembers[0];

    setWafatForm((prev) => ({
      ...prev,
      keluargaDitinggalkan: `Keluarga Besar Alm. ${selected.namaLengkap}`,
      kepalaKeluargaBaruId: defaultSuccessor ? defaultSuccessor.id : '',
      nomorSuratKematian: selected.nomorSuratKematian || generateNomorSuratKematian(),
    }));
  };

  // Save death record
  const handleSaveWafat = async (
    printAfterSave: 'surat_keterangan_kematian' | 'surat_duka_cita' | null = null
  ) => {
    if (!wafatTarget) {
      alert('Pilih warga jemaat yang berpulang terlebih dahulu!');
      return;
    }
    setIsSavingWafat(true);

    try {
      // 1. Update deceased status in warga_jemaat
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
      if (
        wafatTarget.hubunganKeluarga === 'Kepala Keluarga' &&
        wafatForm.kepalaKeluargaBaruId
      ) {
        await updateWargaJemaat(wafatForm.kepalaKeluargaBaruId, {
          hubunganKeluarga: 'Kepala Keluarga',
        });
      }

      // 3. Automated Spousal Status: update spouse to Janda / Duda if requested
      if (
        wafatForm.updatePasanganStatus &&
        (wafatTarget.statusNikah === 'Menikah' || !wafatTarget.statusNikah)
      ) {
        const spouseStatus = wafatTarget.jenisKelamin === 'L' ? 'Janda' : 'Duda';
        const spouse = wargaJemaatList.find(
          (w) =>
            (w.noKjj || '').trim().toLowerCase() ===
              (wafatTarget.noKjj || '').trim().toLowerCase() &&
            w.id !== wafatTarget.id &&
            w.statusKeanggotaan !== 'Meninggal' &&
            (w.hubunganKeluarga === 'Istri' ||
              (wafatTarget.hubunganKeluarga === 'Istri' &&
                w.hubunganKeluarga === 'Kepala Keluarga'))
        );
        if (spouse) {
          await updateWargaJemaat(spouse.id, {
            statusNikah: spouseStatus,
          });
        }
      }

      // 4. Pastoral integration: publish to active Berita Jemaat (Berita Duka)
      if (wafatForm.publishToWartaDuka && activeWarta) {
        const calculatedUsia = calculateAge(
          wafatTarget.tanggalLahir,
          wafatForm.tanggalMeninggal
        ).replace(' Tahun', '');

        const newDukaEntry: BeritaDukaItem = {
          id: `duka-${wafatTarget.id}`,
          namaMeninggal: wafatTarget.namaLengkap,
          usia: parseInt(calculatedUsia, 10) || 70,
          rayon: wafatTarget.rayon || 'Semua Rayon',
          tanggalMeninggal: wafatForm.tanggalMeninggal,
          tempatDuka: wafatForm.tempatMeninggal || 'Kediaman Keluarga',
          jadwalPemakaman: `${wafatForm.tanggalMeninggal}, di ${
            wafatForm.tempatPemakaman || 'TPU Kristen'
          }`,
          keluargaYangBerduka:
            wafatForm.keluargaDitinggalkan || `Keluarga Alm. ${wafatTarget.namaLengkap}`,
          keterangan: wafatForm.keteranganMeninggal,
        };

        const existingList = activeWarta.beritaDukaList || [];
        const isAlreadyInList = existingList.some(
          (item) =>
            item.id === newDukaEntry.id ||
            item.namaMeninggal.toLowerCase() === newDukaEntry.namaMeninggal.toLowerCase()
        );

        const updatedDukaList = isAlreadyInList
          ? existingList.map((item) =>
              item.id === newDukaEntry.id ||
              item.namaMeninggal.toLowerCase() === newDukaEntry.namaMeninggal.toLowerCase()
                ? newDukaEntry
                : item
            )
          : [...existingList, newDukaEntry];

        await updateBeritaJemaat(activeWarta.id, {
          beritaDukaList: updatedDukaList,
        });
      }

      setIsWafatModalOpen(false);
      showToast.success(
        `Data warga berpulang ${wafatTarget.namaLengkap} berhasil disimpan dan terintegrasi dengan Data Keluarga & Warta Jemaat!`,
        'Buku Kematian Diperbarui'
      );

      if (printAfterSave) {
        openPrintReport({
          reportType: printAfterSave,
          wargaId: wafatTarget.id,
        });
      }
    } catch (err: any) {
      console.error('Save wafat error:', err);
      showToast.error(
        'Gagal menyimpan data kematian: ' + (err?.message || 'Error'),
        'Gagal'
      );
    } finally {
      setIsSavingWafat(false);
    }
  };

  // Revert deceased member back to active
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

      // Also remove from active warta if present
      if (activeWarta && activeWarta.beritaDukaList) {
        const cleanName = revertTarget.namaLengkap.toLowerCase();
        const updatedDukaList = activeWarta.beritaDukaList.filter(
          (item) => !item.namaMeninggal.toLowerCase().includes(cleanName)
        );
        if (updatedDukaList.length !== activeWarta.beritaDukaList.length) {
          await updateBeritaJemaat(activeWarta.id, {
            beritaDukaList: updatedDukaList,
          });
        }
      }

      showToast.success(
        `Status keanggotaan ${revertTarget.namaLengkap} berhasil dikembalikan menjadi Anggota Aktif (Tetap).`,
        'Status Dikembalikan'
      );
      setRevertTarget(null);
    } catch (err: any) {
      console.error('Revert error:', err);
      showToast.error('Gagal mengembalikan status keanggotaan.', 'Error');
    }
  };

  // Publish / Sync single deceased to active Warta Jemaat
  const handlePublishToWarta = async (deceased: WargaJemaat) => {
    if (!activeWarta) {
      showToast.error(
        'Belum ada edisi Warta Jemaat aktif yang ditemukan. Buat edisi warta baru terlebih dahulu.',
        'Warta Tidak Ditemukan'
      );
      return;
    }

    try {
      const calculatedUsia = calculateAge(
        deceased.tanggalLahir,
        deceased.tanggalMeninggal
      ).replace(' Tahun', '');

      const newDukaEntry: BeritaDukaItem = {
        id: `duka-${deceased.id}`,
        namaMeninggal: deceased.namaLengkap,
        usia: parseInt(calculatedUsia, 10) || 70,
        rayon: deceased.rayon || 'Semua Rayon',
        tanggalMeninggal: deceased.tanggalMeninggal || '',
        tempatDuka: deceased.tempatMeninggal || 'Kediaman Keluarga',
        jadwalPemakaman: `${deceased.tanggalMeninggal || ''}, di ${
          deceased.tempatPemakaman || 'TPU Kristen'
        }`,
        keluargaYangBerduka:
          deceased.keluargaDitinggalkan || `Keluarga Besar Alm. ${deceased.namaLengkap}`,
        keterangan:
          deceased.keteranganMeninggal ||
          'Telah berpulang ke Rumah Bapa di Sorga dalam damai sejahtera.',
      };

      const existingList = activeWarta.beritaDukaList || [];
      const cleanName = deceased.namaLengkap.toLowerCase();
      const existingIdx = existingList.findIndex(
        (item) =>
          item.id === newDukaEntry.id ||
          item.namaMeninggal.toLowerCase() === cleanName
      );

      let updatedList: BeritaDukaItem[];
      if (existingIdx >= 0) {
        updatedList = [...existingList];
        updatedList[existingIdx] = newDukaEntry;
      } else {
        updatedList = [...existingList, newDukaEntry];
      }

      await updateBeritaJemaat(activeWarta.id, {
        beritaDukaList: updatedList,
      });

      showToast.success(
        `Berita duka Alm. ${deceased.namaLengkap} berhasil diterbitkan di Warta Jemaat Edisi ${activeWarta.nomorEdisi}!`,
        'Terbit di Warta Jemaat'
      );
    } catch (err: any) {
      console.error('Publish to warta error:', err);
      showToast.error('Gagal menerbitkan ke Warta Jemaat.', 'Error');
    }
  };

  // Export Deceased Registry to Excel
  const handleExportWafatExcel = async () => {
    try {
      setIsExporting(true);
      if (allDeceasedList.length === 0) {
        alert('Belum ada data warga yang berpulang untuk diexport.');
        setIsExporting(false);
        return;
      }
      const res = await downloadDeceasedExcel(
        allDeceasedList,
        settings.namaJemaat || 'Gereja Kalimantan Evangelis (GKE)'
      );
      showToast.success(
        `Berhasil mengekspor Buku Registrasi Kematian (${res.totalJiwa} Data) ke Excel: "${res.filename}"`,
        'Export Berhasil'
      );
    } catch (err: any) {
      console.error('Export wafat excel error:', err);
      showToast.error(
        'Gagal mengekspor data ke Excel: ' + (err?.message || 'Error'),
        'Gagal Export'
      );
    } finally {
      setIsExporting(false);
    }
  };

  // Family details for modal
  const familyMembersForKkj = useMemo(() => {
    if (!selectedKkjForDetail) return [];
    return wargaJemaatList.filter(
      (w) =>
        (w.noKjj || '').trim().toLowerCase() === selectedKkjForDetail.trim().toLowerCase()
    );
  }, [selectedKkjForDetail, wargaJemaatList]);

  const kkjInfo = useMemo(() => {
    if (familyMembersForKkj.length === 0) return null;
    const kk =
      familyMembersForKkj.find(
        (w) =>
          w.hubunganKeluarga === 'Kepala Keluarga' &&
          w.statusKeanggotaan !== 'Meninggal'
      ) ||
      familyMembersForKkj.find((w) => w.hubunganKeluarga === 'Kepala Keluarga') ||
      familyMembersForKkj[0];

    const livingCount = familyMembersForKkj.filter(
      (w) => w.statusKeanggotaan !== 'Meninggal'
    ).length;
    const deceasedCount = familyMembersForKkj.filter(
      (w) => w.statusKeanggotaan === 'Meninggal'
    ).length;

    return {
      noKjj: kk.noKjj,
      rayon: kk.rayon,
      alamat: kk.alamat,
      kepalaKeluarga: kk.namaLengkap,
      livingCount,
      deceasedCount,
    };
  }, [familyMembersForKkj]);

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Memorial Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-purple-950 via-slate-900 to-indigo-950 border border-purple-500/30 p-5 sm:p-6 shadow-xl backdrop-blur-md">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5">
          <div className="space-y-2 max-w-3xl">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-bold uppercase tracking-wider bg-purple-500/20 text-purple-300 px-3 py-1 rounded-lg border border-purple-500/30 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-purple-400" />
                Buku Induk Registrasi Kematian Jemaat
              </span>
              <span className="text-[10px] text-purple-300/80 font-mono bg-slate-950/60 px-2 py-0.5 rounded border border-purple-500/20">
                Wahyu 14:13 &bull; 2 Timotius 4:7
              </span>
              <span className="text-[10px] text-emerald-400 font-medium bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/30 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                Terintegrasi Data Keluarga (KKJ) &amp; Warta Jemaat
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-black text-slate-100 tracking-tight">
              Data Kematian &amp; Memorial Warga Jemaat
            </h1>
            <p className="text-xs sm:text-sm text-purple-200/90 italic leading-relaxed">
              "Aku telah mengakhiri pertandingan yang baik, aku telah mencapai garis akhir dan aku telah memelihara iman. Sekarang telah tersedia bagiku mahkota kebenaran."
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 self-stretch lg:self-center">
            {canEdit && (
              <button
                type="button"
                onClick={handleOpenAddNew}
                className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition shadow-lg shadow-purple-600/30 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
                title="Catat warga jemaat yang berpulang baru"
              >
                <Plus className="w-4 h-4" />
                <span>Catat Warga Berpulang</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleExportWafatExcel}
              disabled={isExporting || totalMeninggalCount === 0}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3.5 py-2.5 rounded-xl transition shadow-md shadow-emerald-600/20 disabled:opacity-50 cursor-pointer"
              title="Export Buku Induk Registrasi Kematian ke File Excel Resmi"
            >
              {isExporting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5 text-emerald-200" />
              )}
              <span>Export Buku Kematian (Excel)</span>
            </button>

            <button
              type="button"
              onClick={() =>
                openPrintReport({
                  reportType: 'warga_meninggal_rekap',
                })
              }
              disabled={totalMeninggalCount === 0}
              className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs font-bold px-3.5 py-2.5 rounded-xl transition border border-slate-700 shadow-md cursor-pointer disabled:opacity-50"
              title="Cetak Buku Rekapitulasi Warga Meninggal Dunia"
            >
              <Printer className="w-3.5 h-3.5 text-purple-400" />
              <span>Cetak Buku Rekap</span>
            </button>

            {/* Quick Link to Warta Jemaat */}
            <button
              type="button"
              onClick={() => setActiveTab('berita_jemaat')}
              className="flex items-center gap-1.5 bg-slate-900/80 hover:bg-slate-800 text-emerald-400 text-xs font-semibold px-3 py-2.5 rounded-xl transition border border-emerald-500/30 cursor-pointer"
              title="Buka Modul Berita & Warta Jemaat (Berita Duka)"
            >
              <Newspaper className="w-3.5 h-3.5" />
              <span>Warta Jemaat</span>
              <ArrowRight className="w-3 h-3" />
            </button>

            {/* Quick Link to Family / Warga Jemaat */}
            <button
              type="button"
              onClick={() => setActiveTab('warga_jemaat')}
              className="flex items-center gap-1.5 bg-slate-900/80 hover:bg-slate-800 text-indigo-400 text-xs font-semibold px-3 py-2.5 rounded-xl transition border border-indigo-500/30 cursor-pointer"
              title="Buka Data Keluarga & Sensus Warga Jemaat"
            >
              <GitFork className="w-3.5 h-3.5" />
              <span>Sensus Keluarga</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Pastoral Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl backdrop-blur-md">
          <span className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
            <HeartCrack className="w-3.5 h-3.5 text-purple-400" />
            Total Warga Berpulang
          </span>
          <p className="text-2xl font-black text-purple-300 mt-1">
            {totalMeninggalCount}{' '}
            <span className="text-xs font-normal text-slate-400">Jiwa</span>
          </p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl backdrop-blur-md">
          <span className="text-xs text-slate-400 font-medium">Laki-laki / Perempuan</span>
          <p className="text-xl font-bold text-slate-100 mt-1">
            <span className="text-sky-400 font-black">{countLaki}</span>{' '}
            <span className="text-xs text-slate-400">L</span> &bull;{' '}
            <span className="text-rose-400 font-black">{countPerempuan}</span>{' '}
            <span className="text-xs text-slate-400">P</span>
          </p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl backdrop-blur-md">
          <span className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-amber-400" />
            Berpulang Tahun Ini ({currentYear})
          </span>
          <p className="text-2xl font-black text-amber-300 mt-1">
            {countTahunIni}{' '}
            <span className="text-xs font-normal text-slate-400">Jiwa</span>
          </p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl backdrop-blur-md">
          <span className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-emerald-400" />
            Keluarga Dampingan (KKJ)
          </span>
          <p className="text-2xl font-black text-emerald-300 mt-1">
            {distinctKkjBerduka}{' '}
            <span className="text-xs font-normal text-slate-400">KK</span>
          </p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl backdrop-blur-md col-span-2 sm:col-span-1">
          <span className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
            <Newspaper className="w-3.5 h-3.5 text-indigo-400" />
            Terbit di Warta Jemaat
          </span>
          <p className="text-2xl font-black text-indigo-300 mt-1">
            {countTerbitWarta}{' '}
            <span className="text-xs font-normal text-slate-400">Warta</span>
          </p>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-slate-900/80 p-4 rounded-2xl border border-slate-800 text-xs backdrop-blur-md">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Cari nama almarhum / KJJ / No. Surat Kematian / Tempat..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 text-xs"
          />
        </div>

        <div>
          <select
            value={selectedRayon}
            onChange={(e) => setSelectedRayon(e.target.value)}
            className="w-full py-2.5 px-3 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-200 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 text-xs"
          >
            <option value="" className="bg-slate-900">
              Semua Lingkungan / Sektor
            </option>
            {lingkungkans.map((r) => (
              <option key={r} value={r} className="bg-slate-900">
                {r}
              </option>
            ))}
          </select>
        </div>

        <div>
          <select
            value={selectedTahun}
            onChange={(e) => setSelectedTahun(e.target.value)}
            className="w-full py-2.5 px-3 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-200 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 text-xs"
          >
            <option value="" className="bg-slate-900">
              Semua Tahun Berpulang
            </option>
            {availableYears.map((yr) => (
              <option key={yr} value={yr} className="bg-slate-900">
                Tahun {yr}
              </option>
            ))}
          </select>
        </div>

        <div>
          <select
            value={wartaStatusFilter}
            onChange={(e) => setWartaStatusFilter(e.target.value as any)}
            className="w-full py-2.5 px-3 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-200 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 text-xs"
          >
            <option value="semua" className="bg-slate-900">
              Status Warta: Semua Data
            </option>
            <option value="terbit" className="bg-slate-900">
              Status Warta: Sudah Dimuat di Warta Terkini
            </option>
            <option value="belum" className="bg-slate-900">
              Status Warta: Belum Dimuat di Warta
            </option>
          </select>
        </div>
      </div>

      {/* Deceased Registry Table */}
      <div className="bg-slate-900/80 rounded-2xl border border-slate-800 overflow-hidden shadow-xl backdrop-blur-md">
        <div className="p-4 border-b border-slate-800 bg-slate-950/40 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <FolderArchive className="w-4 h-4 text-purple-400" />
            <span className="font-bold text-slate-200 text-xs sm:text-sm">
              Buku Registrasi Warga Jemaat Berpulang ({filteredDeceasedList.length} Jiwa Ditampilkan)
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <span className="text-[11px] text-slate-400 flex items-center gap-1">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-400"></span>
              Dimuat di Warta
            </span>
            <span className="text-[11px] text-slate-400 flex items-center gap-1">
              <span className="inline-block w-2 h-2 rounded-full bg-amber-400"></span>
              Belum di Warta
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/70 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                <th className="p-3.5 text-center w-12">No</th>
                <th className="p-3.5">No. KKJ &amp; Lingkungan</th>
                <th className="p-3.5">Nama Lengkap &amp; Status Keluarga</th>
                <th className="p-3.5 text-center">L/P</th>
                <th className="p-3.5">Tgl Lahir &amp; Wafat</th>
                <th className="p-3.5 text-center">Usia</th>
                <th className="p-3.5">Pemakaman &amp; Pelayan</th>
                <th className="p-3.5">No. Surat Kematian</th>
                <th className="p-3.5 text-center">Integrasi Warta Jemaat</th>
                <th className="p-3.5 text-center">Aksi Pastoral</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredDeceasedList.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-12 text-center text-slate-400">
                    <FolderArchive className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                    <p className="font-semibold text-slate-300 text-sm">
                      Tidak ada data warga jemaat berpulang yang cocok
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      {search || selectedRayon || selectedTahun || wartaStatusFilter !== 'semua'
                        ? 'Coba atur ulang kata kunci atau filter pencarian Anda.'
                        : 'Klik tombol "Catat Warga Berpulang" untuk menambahkan data kematian baru.'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredDeceasedList.map((item, idx) => {
                  const inWarta = isDeceasedInWarta(item);
                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-800/40 transition-colors group"
                    >
                      <td className="p-3.5 text-center font-mono text-slate-500">{idx + 1}</td>

                      {/* No. KKJ & Family Link */}
                      <td className="p-3.5">
                        <button
                          type="button"
                          onClick={() => setSelectedKkjForDetail(item.noKjj)}
                          className="font-mono font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 group/kkj cursor-pointer text-left"
                          title="Klik untuk melihat Kartu Keluarga (KKJ) & silsilah lengkap"
                        >
                          <GitFork className="w-3.5 h-3.5 text-indigo-400 group-hover/kkj:scale-110 transition-transform" />
                          <span className="group-hover/kkj:underline">{item.noKjj}</span>
                        </button>
                        <span className="text-[10px] text-slate-400 block mt-0.5">
                          {item.rayon}
                        </span>
                        <button
                          type="button"
                          onClick={() => setSelectedKkjForDetail(item.noKjj)}
                          className="text-[9px] text-emerald-400/80 hover:text-emerald-300 hover:underline mt-0.5 flex items-center gap-1 cursor-pointer"
                        >
                          <span>Buka KKJ Keluarga &rarr;</span>
                        </button>
                      </td>

                      {/* Nama Almarhum */}
                      <td className="p-3.5">
                        <button
                          type="button"
                          onClick={() => setProfileTarget(item)}
                          className="font-bold text-slate-100 hover:text-purple-300 transition flex items-center gap-1.5 flex-wrap text-left cursor-pointer"
                          title="Klik untuk membuka profil lengkap warga berpulang"
                        >
                          <span>{item.namaLengkap}</span>
                          <span className="text-[10px] bg-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded font-bold border border-purple-500/30">
                            {item.jenisKelamin === 'P' ? 'Almh.' : 'Alm.'}
                          </span>
                        </button>
                        <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-400">
                          <span className="font-mono">NIK: {item.nik || '-'}</span>
                          <span>&bull;</span>
                          <span className="bg-slate-800 text-slate-300 px-1.5 py-0.2 rounded">
                            {item.hubunganKeluarga || 'Anggota'}
                          </span>
                        </div>
                      </td>

                      {/* Gender */}
                      <td className="p-3.5 text-center font-semibold text-slate-400">
                        {item.jenisKelamin === 'L' ? (
                          <span className="text-sky-400 font-bold">L</span>
                        ) : (
                          <span className="text-rose-400 font-bold">P</span>
                        )}
                      </td>

                      {/* Dates */}
                      <td className="p-3.5">
                        <div className="space-y-0.5">
                          <span className="text-[11px] text-purple-300 block font-bold">
                            ✝ {item.tanggalMeninggal || '-'}
                          </span>
                          <span className="text-[10px] text-slate-400 block font-mono">
                            * {item.tanggalLahir || '-'}
                          </span>
                        </div>
                      </td>

                      {/* Age */}
                      <td className="p-3.5 text-center">
                        <span className="px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20 font-bold text-[11px]">
                          {calculateAge(item.tanggalLahir, item.tanggalMeninggal)}
                        </span>
                      </td>

                      {/* Cemetery & Minister */}
                      <td className="p-3.5">
                        <p className="font-semibold text-slate-200">
                          {item.tempatPemakaman || 'TPU Kristen'}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          Pelayan: {item.pelayanPemakaman || '-'}
                        </p>
                      </td>

                      {/* Surat Kematian */}
                      <td className="p-3.5 font-mono text-[11px] text-amber-300 font-semibold">
                        {item.nomorSuratKematian || '-'}
                      </td>

                      {/* Warta Jemaat Integration Status */}
                      <td className="p-3.5 text-center">
                        {inWarta ? (
                          <div className="flex flex-col items-center gap-1">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold">
                              <CheckCircle2 className="w-3 h-3" />
                              Dimuat di Warta
                            </span>
                            <button
                              type="button"
                              onClick={() => setActiveTab('berita_jemaat')}
                              className="text-[9px] text-emerald-400 hover:text-emerald-300 hover:underline cursor-pointer"
                            >
                              Lihat di Warta &rarr;
                            </button>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center gap-1">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-semibold">
                              <AlertTriangle className="w-3 h-3" />
                              Belum Terbit
                            </span>
                            {canEdit && (
                              <button
                                type="button"
                                onClick={() => handlePublishToWarta(item)}
                                className="text-[9px] bg-indigo-600/80 hover:bg-indigo-600 text-white px-2 py-0.5 rounded transition cursor-pointer font-bold"
                                title="Terbitkan berita duka ini ke Warta Jemaat aktif sekarang"
                              >
                                + Terbitkan
                              </button>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="p-3.5 text-center">
                        <div className="flex items-center justify-center gap-1.5 flex-wrap">
                          {/* Profil */}
                          <button
                            type="button"
                            onClick={() => setProfileTarget(item)}
                            className="p-1.5 text-sky-400 hover:bg-sky-500/10 rounded-lg transition-colors cursor-pointer"
                            title="Buka Profil Lengkap Warga"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* Family Card */}
                          <button
                            type="button"
                            onClick={() => setSelectedKkjForDetail(item.noKjj)}
                            className="p-1.5 text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors cursor-pointer"
                            title="Buka Kartu Keluarga (KKJ) & Silsilah Keluarga"
                          >
                            <GitFork className="w-3.5 h-3.5" />
                          </button>

                          {/* Surat Kematian */}
                          <button
                            type="button"
                            onClick={() =>
                              openPrintReport({
                                reportType: 'surat_keterangan_kematian',
                                wargaId: item.id,
                              })
                            }
                            className="flex items-center gap-1 bg-amber-600 hover:bg-amber-500 text-white text-[10px] font-bold px-2 py-1.5 rounded-lg transition shadow-sm cursor-pointer"
                            title="Cetak Surat Keterangan Kematian Resmi GKE"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>Surat Kematian</span>
                          </button>

                          {/* Surat Duka */}
                          <button
                            type="button"
                            onClick={() =>
                              openPrintReport({
                                reportType: 'surat_duka_cita',
                                wargaId: item.id,
                              })
                            }
                            className="flex items-center gap-1 bg-purple-600 hover:bg-purple-500 text-white text-[10px] font-bold px-2 py-1.5 rounded-lg transition shadow-sm cursor-pointer"
                            title="Cetak Surat Pernyataan Duka Cita & Penguatan Iman (Pastoral)"
                          >
                            <HeartCrack className="w-3.5 h-3.5" />
                            <span>Surat Duka</span>
                          </button>

                          {/* Edit / Revert */}
                          {canEdit && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleOpenEditWafat(item)}
                                className="p-1.5 text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-colors cursor-pointer"
                                title="Edit Data Kematian & Catatan Pastoral"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>

                              <button
                                type="button"
                                onClick={() => setRevertTarget(item)}
                                className="p-1.5 text-teal-400 hover:bg-teal-500/10 rounded-lg transition-colors cursor-pointer"
                                title="Kembalikan Status ke Anggota Aktif (Koreksi Kesalahan Administrasi)"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                              </button>
                            </>
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

      {/* MODAL 1: FAMILY / KKJ DETAIL MODAL (INTEGRASI DATA KELUARGA) */}
      {selectedKkjForDetail && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 overflow-hidden animate-in fade-in duration-150">
          <div className="bg-slate-900 rounded-2xl shadow-2xl w-full max-w-3xl border border-slate-800 text-slate-100 flex flex-col max-h-[90vh] overflow-hidden my-auto">
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-950 via-slate-950 to-purple-950 p-4 px-5 border-b border-slate-800 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center justify-center">
                  <GitFork className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
                    <span>Kartu Keluarga Jemaat (KKJ) &bull; No. {selectedKkjForDetail}</span>
                  </h3>
                  <p className="text-xs text-indigo-300/80 font-mono">
                    {kkjInfo?.rayon || '-'} &bull; Kepala Keluarga: {kkjInfo?.kepalaKeluarga || '-'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedKkjForDetail(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 overflow-y-auto space-y-5 text-xs">
              {/* KKJ Summary Card */}
              <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold">No. Kartu Jemaat</span>
                  <p className="font-mono font-bold text-indigo-300 text-sm mt-0.5">{selectedKkjForDetail}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Lingkungan / Rayon</span>
                  <p className="font-semibold text-slate-200 mt-0.5">{kkjInfo?.rayon || '-'}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Anggota Hidup</span>
                  <p className="font-bold text-emerald-400 mt-0.5">{kkjInfo?.livingCount || 0} Jiwa</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Warga Berpulang</span>
                  <p className="font-bold text-purple-400 mt-0.5">{kkjInfo?.deceasedCount || 0} Jiwa</p>
                </div>
              </div>

              {/* Members List */}
              <div className="space-y-3">
                <h4 className="font-bold text-slate-200 text-xs flex items-center gap-2">
                  <Users className="w-4 h-4 text-indigo-400" />
                  <span>Daftar Seluruh Anggota Keluarga ({familyMembersForKkj.length} Jiwa)</span>
                </h4>

                <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/40">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800 bg-slate-950 text-slate-400 text-[10px] uppercase font-bold">
                        <th className="p-3">Nama Lengkap</th>
                        <th className="p-3">Hubungan</th>
                        <th className="p-3 text-center">L/P</th>
                        <th className="p-3">Tgl Lahir</th>
                        <th className="p-3">Status Anggota</th>
                        <th className="p-3 text-center">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {familyMembersForKkj.map((member) => {
                        const isDeceased = member.statusKeanggotaan === 'Meninggal';
                        return (
                          <tr
                            key={member.id}
                            className={`hover:bg-slate-800/40 transition-colors ${
                              isDeceased ? 'bg-purple-950/20' : ''
                            }`}
                          >
                            <td className="p-3">
                              <span className="font-bold text-slate-100 block">
                                {member.namaLengkap}
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono">
                                NIK: {member.nik || '-'}
                              </span>
                            </td>

                            <td className="p-3">
                              <span className="font-semibold text-slate-300">
                                {member.hubunganKeluarga || '-'}
                              </span>
                              {member.statusNikah && (
                                <span className="text-[10px] text-slate-400 block">
                                  {member.statusNikah}
                                </span>
                              )}
                            </td>

                            <td className="p-3 text-center font-bold">
                              {member.jenisKelamin === 'L' ? (
                                <span className="text-sky-400">L</span>
                              ) : (
                                <span className="text-rose-400">P</span>
                              )}
                            </td>

                            <td className="p-3 font-mono text-slate-300">
                              {member.tanggalLahir || '-'}
                            </td>

                            <td className="p-3">
                              {isDeceased ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[10px] font-bold">
                                  ✝ Berpulang ({member.tanggalMeninggal || '-'})
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
                                  ✓ Aktif ({member.statusKeanggotaan || 'Tetap'})
                                </span>
                              )}
                            </td>

                            <td className="p-3 text-center">
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedKkjForDetail(null);
                                  setProfileTarget(member);
                                }}
                                className="text-sky-400 hover:text-sky-300 p-1 rounded hover:bg-sky-500/10 cursor-pointer text-[11px] font-semibold"
                                title="Lihat Profil Anggota"
                              >
                                Profil
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-slate-950 p-4 px-5 border-t border-slate-800 flex items-center justify-between gap-3 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setSelectedKkjForDetail(null);
                  setActiveTab('warga_jemaat');
                }}
                className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 font-semibold cursor-pointer"
              >
                <GitFork className="w-4 h-4" />
                <span>Buka di Modul Sensus Keluarga &rarr;</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    openPrintReport({
                      reportType: 'kartu_keluarga_jemaat',
                      noKjj: selectedKkjForDetail,
                    })
                  }
                  className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2 rounded-xl transition shadow cursor-pointer"
                  title="Cetak Kartu Keluarga Jemaat Resmi"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Cetak KKJ Keluarga</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedKkjForDetail(null)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold px-4 py-2 rounded-xl transition cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: PASTORAL DEATH RECORDING & EDIT MODAL */}
      {isWafatModalOpen && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 overflow-hidden animate-in fade-in duration-150">
          <div className="bg-slate-900 rounded-2xl shadow-2xl w-full max-w-2xl border border-slate-800 text-slate-100 flex flex-col max-h-[92vh] overflow-hidden my-auto">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-950 via-slate-950 to-indigo-950 p-4 px-5 border-b border-slate-800 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center justify-center">
                  <HeartCrack className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-100">
                    {isEditingExisting
                      ? 'Edit Data Registrasi Warga Berpulang'
                      : 'Pencatatan Warga Jemaat Berpulang Baru'}
                  </h3>
                  <p className="text-[11px] text-purple-300/80">
                    Pelayanan Pastoral, Administrasi Kematian &amp; Integrasi Warta
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsWafatModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <div className="p-5 space-y-4 flex-1 overflow-y-auto text-xs">
              {/* Member Selection if Adding New */}
              {!isEditingExisting ? (
                <div className="space-y-2 bg-slate-950/70 p-3.5 rounded-xl border border-slate-800">
                  <label className="block font-bold text-slate-200">
                    1. Pilih Warga Jemaat yang Berpulang <span className="text-rose-400">*</span>
                  </label>

                  <div className="space-y-2">
                    <input
                      type="text"
                      placeholder="Ketik untuk mencari nama warga / No. KKJ / NIK..."
                      value={wargaSearchInput || ''}
                      onChange={(e) => setWargaSearchInput(e.target.value)}
                      className="w-full p-2.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-purple-500"
                    />

                    <select
                      value={selectedActiveWargaId || ''}
                      onChange={(e) => handleSelectActiveWarga(e.target.value)}
                      className="w-full p-2.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-purple-500"
                      size={4}
                    >
                      {filteredActiveMembers.map((w) => (
                        <option key={w.id} value={w.id} className="p-1">
                          {w.namaLengkap} ({w.jenisKelamin}) &bull; KKJ: {w.noKjj} &bull; {w.hubunganKeluarga || 'Anggota'} &bull; {w.rayon}
                        </option>
                      ))}
                    </select>
                  </div>

                  {wafatTarget && (
                    <div className="mt-2 p-2.5 rounded-lg bg-purple-950/30 border border-purple-500/30 text-purple-200 text-xs">
                      <p className="font-bold text-slate-100">
                        Dipilih: {wafatTarget.namaLengkap} ({wafatTarget.jenisKelamin})
                      </p>
                      <p className="text-[11px] text-slate-400">
                        No. KKJ: {wafatTarget.noKjj} &bull; Hubungan: {wafatTarget.hubunganKeluarga || 'Anggota'} &bull; {wafatTarget.rayon}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-3.5 rounded-xl bg-purple-950/30 border border-purple-500/30 text-purple-200 text-xs">
                  <span className="text-[10px] uppercase font-bold text-purple-400">Warga Terdaftar</span>
                  <p className="font-bold text-slate-100 text-sm mt-0.5">
                    Alm. {wafatTarget?.namaLengkap} ({wafatTarget?.jenisKelamin})
                  </p>
                  <p className="text-[11px] text-slate-400">
                    No. KKJ: {wafatTarget?.noKjj} &bull; {wafatTarget?.rayon} &bull; NIK: {wafatTarget?.nik || '-'}
                  </p>
                </div>
              )}

              {/* Death details */}
              <div className="space-y-3">
                <h4 className="font-bold text-slate-200 text-xs border-b border-slate-800 pb-1">
                  2. Detail Pemakaman &amp; Pencatatan Kematian
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">
                      Tanggal Berpulang <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={wafatForm.tanggalMeninggal || ''}
                      onChange={(e) =>
                        setWafatForm({ ...wafatForm, tanggalMeninggal: e.target.value })
                      }
                      className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-purple-300 font-bold focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">
                      Tempat Meninggal / Rumah Sakit / Rumah Duka
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: RSUD Doris Sylvanus / Kediaman Keluarga"
                      value={wafatForm.tempatMeninggal || ''}
                      onChange={(e) =>
                        setWafatForm({ ...wafatForm, tempatMeninggal: e.target.value })
                      }
                      className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">
                      Tempat Pemakaman
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: TPU Kristen Km. 12"
                      value={wafatForm.tempatPemakaman || ''}
                      onChange={(e) =>
                        setWafatForm({ ...wafatForm, tempatPemakaman: e.target.value })
                      }
                      className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">
                      Pelayan Ibadah Pemakaman (Pendeta / Penatua)
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: Pdt. Yohanes, S.Th"
                      value={wafatForm.pelayanPemakaman || ''}
                      onChange={(e) =>
                        setWafatForm({ ...wafatForm, pelayanPemakaman: e.target.value })
                      }
                      className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Nomor Surat Keterangan Kematian (GKE)
                  </label>
                  <input
                    type="text"
                    value={wafatForm.nomorSuratKematian || ''}
                    onChange={(e) =>
                      setWafatForm({ ...wafatForm, nomorSuratKematian: e.target.value })
                    }
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-amber-300 font-mono font-bold focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Keluarga yang Ditinggalkan / Berduka
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Suami/Istri, Anak-anak, Cucu, Keluarga Besar..."
                    value={wafatForm.keluargaDitinggalkan || ''}
                    onChange={(e) =>
                      setWafatForm({ ...wafatForm, keluargaDitinggalkan: e.target.value })
                    }
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Catatan Pastoral &amp; Ayat Firman Penghiburan
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Catatan pastoral atau ayat firman penguatan untuk keluarga..."
                    value={wafatForm.keteranganMeninggal || ''}
                    onChange={(e) =>
                      setWafatForm({ ...wafatForm, keteranganMeninggal: e.target.value })
                    }
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              {/* Family & Warta Governance Options */}
              <div className="space-y-3 pt-2">
                <h4 className="font-bold text-slate-200 text-xs border-b border-slate-800 pb-1">
                  3. Tata Kelola Silsilah Keluarga (KKJ) &amp; Integrasi Warta Jemaat
                </h4>

                {/* If deceased was Kepala Keluarga, offer successor */}
                {wafatTarget && wafatTarget.hubunganKeluarga === 'Kepala Keluarga' && (
                  <div className="p-3 rounded-xl bg-indigo-950/40 border border-indigo-500/30 space-y-2">
                    <label className="block font-bold text-indigo-200">
                      Penerus Kepala Keluarga Baru dalam Kartu Keluarga Jemaat (KKJ)
                    </label>
                    <p className="text-[11px] text-slate-400">
                      Almarhum berstatus sebagai Kepala Keluarga. Pilih anggota keluarga yang akan otomatis dipromosikan menjadi Kepala Keluarga baru:
                    </p>
                    <select
                      value={wafatForm.kepalaKeluargaBaruId || ''}
                      onChange={(e) =>
                        setWafatForm({ ...wafatForm, kepalaKeluargaBaruId: e.target.value })
                      }
                      className="w-full p-2 rounded-lg bg-slate-900 border border-indigo-500/40 text-slate-100 text-xs"
                    >
                      <option value="">-- Biarkan Kosong (Tentukan Kemudian) --</option>
                      {wargaJemaatList
                        .filter(
                          (w) =>
                            w.noKjj === wafatTarget.noKjj &&
                            w.id !== wafatTarget.id &&
                            w.statusKeanggotaan !== 'Meninggal'
                        )
                        .map((f) => (
                          <option key={f.id} value={f.id}>
                            {f.namaLengkap} ({f.hubunganKeluarga || 'Anggota Keluarga'})
                          </option>
                        ))}
                    </select>
                  </div>
                )}

                {/* Update Spouse Status */}
                <div className="flex items-center gap-2 text-xs">
                  <input
                    type="checkbox"
                    id="updatePasanganStatus"
                    checked={wafatForm.updatePasanganStatus}
                    onChange={(e) =>
                      setWafatForm({ ...wafatForm, updatePasanganStatus: e.target.checked })
                    }
                    className="rounded bg-slate-950 border-slate-700 text-purple-600 focus:ring-purple-500 w-4 h-4 cursor-pointer"
                  />
                  <label htmlFor="updatePasanganStatus" className="text-slate-300 cursor-pointer">
                    Perbarui status perkawinan pasangan hidup menjadi{' '}
                    <strong className="text-purple-300">
                      {wafatTarget?.jenisKelamin === 'L' ? 'Janda' : 'Duda'}
                    </strong>{' '}
                    secara otomatis dalam database
                  </label>
                </div>

                {/* Publish to Warta Jemaat */}
                <div className="flex items-center gap-2 text-xs">
                  <input
                    type="checkbox"
                    id="publishToWartaDuka"
                    checked={wafatForm.publishToWartaDuka}
                    onChange={(e) =>
                      setWafatForm({ ...wafatForm, publishToWartaDuka: e.target.checked })
                    }
                    className="rounded bg-slate-950 border-slate-700 text-purple-600 focus:ring-purple-500 w-4 h-4 cursor-pointer"
                  />
                  <label htmlFor="publishToWartaDuka" className="text-slate-300 cursor-pointer">
                    Terbitkan langsung ke{' '}
                    <strong className="text-emerald-400">Warta Jemaat (Berita Duka Cita)</strong>{' '}
                    pada edisi warta jemaat aktif saat ini
                  </label>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-slate-950 p-4 px-5 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setIsWafatModalOpen(false)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold px-4 py-2.5 rounded-xl transition cursor-pointer"
              >
                Batal
              </button>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  disabled={isSavingWafat || !wafatTarget}
                  onClick={() => handleSaveWafat('surat_keterangan_kematian')}
                  className="flex items-center gap-1.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold px-3.5 py-2.5 rounded-xl transition shadow disabled:opacity-50 cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Simpan &amp; Cetak Surat Kematian</span>
                </button>

                <button
                  type="button"
                  disabled={isSavingWafat || !wafatTarget}
                  onClick={() => handleSaveWafat('surat_duka_cita')}
                  className="flex items-center gap-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold px-3.5 py-2.5 rounded-xl transition shadow disabled:opacity-50 cursor-pointer"
                >
                  <HeartCrack className="w-3.5 h-3.5" />
                  <span>Simpan &amp; Cetak Surat Duka</span>
                </button>

                <button
                  type="button"
                  disabled={isSavingWafat || !wafatTarget}
                  onClick={() => handleSaveWafat(null)}
                  className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition shadow disabled:opacity-50 cursor-pointer"
                >
                  {isSavingWafat ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  )}
                  <span>Simpan Data</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: REVERT CONFIRMATION MODAL */}
      {revertTarget && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-slate-900 rounded-2xl shadow-2xl max-w-md w-full border border-slate-800 text-slate-100 p-5 space-y-4">
            <div className="flex items-center gap-3 text-teal-400">
              <div className="w-10 h-10 rounded-xl bg-teal-500/20 flex items-center justify-center border border-teal-500/30">
                <RotateCcw className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-100">
                  Kembalikan ke Anggota Aktif?
                </h3>
                <p className="text-xs text-slate-400">Koreksi Kesalahan Administrasi</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Anda akan mengembalikan status keanggotaan{' '}
              <strong className="text-white">{revertTarget.namaLengkap}</strong> menjadi{' '}
              <strong className="text-emerald-400">Anggota Aktif (Tetap)</strong>. Seluruh data
              tanggal wafat, tempat pemakaman, dan surat kematian akan dikosongkan.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setRevertTarget(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmRevertActive}
                className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold transition shadow cursor-pointer"
              >
                Ya, Kembalikan ke Aktif
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: PROFIL WARGA MODAL */}
      {profileTarget && (
        <ProfilWargaModal
          warga={profileTarget}
          wargaJemaatList={wargaJemaatList}
          onClose={() => setProfileTarget(null)}
          onSelectWarga={(w) => setProfileTarget(w)}
          onOpenWafatModal={(w) => {
            setProfileTarget(null);
            handleOpenEditWafat(w);
          }}
          onOpenRevertModal={(w) => {
            setProfileTarget(null);
            setRevertTarget(w);
          }}
          onOpenEditModal={(w) => {
            setProfileTarget(null);
            handleOpenEditWafat(w);
          }}
          onPrintReport={openPrintReport}
          canEdit={canEdit}
        />
      )}
    </div>
  );
};
