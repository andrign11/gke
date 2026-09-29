import React, { useState, useMemo } from 'react';
import {
  Wrench,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Plus,
  Search,
  Filter,
  Trash2,
  Edit,
  MessageCircle,
  Phone,
  DollarSign,
  Package,
  Printer,
  Bell,
  RefreshCw,
  Info,
  ExternalLink,
  ChevronRight,
  ShieldAlert,
  SlidersHorizontal,
  Check,
  X,
  Send,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import {
  PemeliharaanAset,
  InventarisAset,
  JenisPemeliharaan,
  StatusPemeliharaan,
  TingkatPrioritas,
} from '../../types';

interface PemeliharaanAsetModuleProps {
  onOpenPrint?: (reportType: string) => void;
  selectedAssetIdForNewSchedule?: string;
  onClearSelectedAsset?: () => void;
}

export const PemeliharaanAsetModule: React.FC<PemeliharaanAsetModuleProps> = ({
  onOpenPrint,
  selectedAssetIdForNewSchedule,
  onClearSelectedAsset,
}) => {
  const {
    pemeliharaanAsetList,
    inventarisList,
    addPemeliharaanAset,
    updatePemeliharaanAset,
    deletePemeliharaanAset,
    completePemeliharaanAset,
    dueSoonMaintenanceList,
    dueMaintenanceList,
    dueSoonMaintenanceCount,
    overdueMaintenanceCount,
    settings,
    currentUser,
    showToast,
  } = useApp();

  // Filter & Search State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('semua');
  const [priorityFilter, setPriorityFilter] = useState<string>('semua');
  const [categoryFilter, setCategoryFilter] = useState<string>('semua');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  // Modals state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PemeliharaanAset | null>(null);

  const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);
  const [completingItem, setCompletingItem] = useState<PemeliharaanAset | null>(null);
  const [completeDate, setCompleteDate] = useState(new Date().toISOString().split('T')[0]);
  const [completeCost, setCompleteCost] = useState<number>(0);
  const [completeAction, setCompleteAction] = useState('');
  const [completeCondition, setCompleteCondition] = useState<'Baik' | 'Rusak Ringan' | 'Rusak Berat'>('Baik');
  const [completeNextCycle, setCompleteNextCycle] = useState(true);
  const [completeNextMonths, setCompleteNextMonths] = useState(3);

  // WhatsApp Reminder Modal
  const [isWaModalOpen, setIsWaModalOpen] = useState(false);
  const [waModalItem, setWaModalItem] = useState<PemeliharaanAset | null>(null);
  const [waRecipientType, setWaRecipientType] = useState<'teknisi' | 'koordinator' | 'custom'>('teknisi');
  const [waCustomPhone, setWaCustomPhone] = useState('');
  const [waCustomMessage, setWaCustomMessage] = useState('');

  // Delete Confirmation Modal
  const [itemToDelete, setItemToDelete] = useState<PemeliharaanAset | null>(null);

  // Form State for Add / Edit
  const [formAsetId, setFormAsetId] = useState('');
  const [formKodeAset, setFormKodeAset] = useState('');
  const [formNamaBarang, setFormNamaBarang] = useState('');
  const [formKategoriAset, setFormKategoriAset] = useState('');
  const [formLokasiAset, setFormLokasiAset] = useState('');
  const [formJudul, setFormJudul] = useState('');
  const [formJenis, setFormJenis] = useState<JenisPemeliharaan>('Servis Rutin');
  const [formPrioritas, setFormPrioritas] = useState<TingkatPrioritas>('Sedang');
  const [formTanggalJatuhTempo, setFormTanggalJatuhTempo] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [formSiklusBulan, setFormSiklusBulan] = useState<number>(3);
  const [formStatus, setFormStatus] = useState<StatusPemeliharaan>('Terjadwal');
  const [formBiayaEstimasi, setFormBiayaEstimasi] = useState<number>(0);
  const [formPenanggungJawab, setFormPenanggungJawab] = useState(
    currentUser?.namaLengkap || 'Koordinator Sarana & Prasarana'
  );
  const [formKontakPenanggungJawab, setFormKontakPenanggungJawab] = useState(currentUser?.noHp || '');
  const [formTeknisiVendor, setFormTeknisiVendor] = useState('');
  const [formKontakTeknisiVendor, setFormKontakTeknisiVendor] = useState('');
  const [formKeterangan, setFormKeterangan] = useState('');

  // Handle opening form for adding or editing
  const handleOpenAddForm = (initialAssetId?: string) => {
    setEditingItem(null);
    const asset = inventarisList.find((a) => a.id === initialAssetId);
    if (asset) {
      setFormAsetId(asset.id);
      setFormKodeAset(asset.kodeAset || '');
      setFormNamaBarang(asset.namaBarang || '');
      setFormKategoriAset(asset.kategori || 'Sound System & Peralatan Musik');
      setFormLokasiAset(asset.lokasiPenyimpanan || '');
      setFormPenanggungJawab(asset.penanggungJawab || currentUser?.namaLengkap || 'Koordinator Sarana & Prasarana');
      setFormJudul(`Servis Berkala ${asset.namaBarang || ''}`);
      setFormSiklusBulan(asset.siklusPemeliharaanBulan || 3);
    } else {
      setFormAsetId('');
      setFormKodeAset('');
      setFormNamaBarang('');
      setFormKategoriAset('Sound System & Peralatan Musik');
      setFormLokasiAset('');
      setFormPenanggungJawab(currentUser?.namaLengkap || 'Koordinator Sarana & Prasarana');
      setFormJudul('');
      setFormSiklusBulan(3);
    }

    // Default target date: 7 days from today if not set
    const defaultDate = new Date();
    defaultDate.setDate(defaultDate.getDate() + 7);
    setFormTanggalJatuhTempo(defaultDate.toISOString().split('T')[0]);

    setFormJenis('Servis Rutin');
    setFormPrioritas('Sedang');
    setFormStatus('Terjadwal');
    setFormBiayaEstimasi(0);
    setFormKontakPenanggungJawab(currentUser?.noHp || '');
    setFormTeknisiVendor('');
    setFormKontakTeknisiVendor('');
    setFormKeterangan('');
    setIsFormModalOpen(true);
  };

  // Open edit form
  const handleOpenEditForm = (item: PemeliharaanAset) => {
    setEditingItem(item);
    setFormAsetId(item.asetId);
    setFormKodeAset(item.kodeAset);
    setFormNamaBarang(item.namaBarang);
    setFormKategoriAset(item.kategoriAset);
    setFormLokasiAset(item.lokasiAset || '');
    setFormJudul(item.judulPemeliharaan);
    setFormJenis(item.jenisPemeliharaan);
    setFormPrioritas(item.tingkatPrioritas);
    setFormTanggalJatuhTempo(item.tanggalJatuhTempo);
    setFormSiklusBulan(item.siklusBulan || 3);
    setFormStatus(item.status);
    setFormBiayaEstimasi(item.biayaEstimasi || 0);
    setFormPenanggungJawab(item.penanggungJawabInternal);
    setFormKontakPenanggungJawab(item.kontakPenanggungJawab || '');
    setFormTeknisiVendor(item.teknisiVendor || '');
    setFormKontakTeknisiVendor(item.kontakTeknisiVendor || '');
    setFormKeterangan(item.keterangan || '');
    setIsFormModalOpen(true);
  };

  // Auto trigger if navigated with a preselected asset ID
  React.useEffect(() => {
    if (selectedAssetIdForNewSchedule) {
      handleOpenAddForm(selectedAssetIdForNewSchedule);
      if (onClearSelectedAsset) onClearSelectedAsset();
    }
  }, [selectedAssetIdForNewSchedule]);

  // When user selects an asset in form dropdown
  const handleSelectAssetInForm = (assetId: string) => {
    setFormAsetId(assetId || '');
    const asset = inventarisList.find((a) => a.id === assetId);
    if (asset) {
      setFormKodeAset(asset.kodeAset || '');
      setFormNamaBarang(asset.namaBarang || '');
      setFormKategoriAset(asset.kategori || 'Sound System & Peralatan Musik');
      setFormLokasiAset(asset.lokasiPenyimpanan || '');
      if (!formJudul || formJudul.startsWith('Servis Berkala')) {
        setFormJudul(`Servis Berkala ${asset.namaBarang || ''}`);
      }
      if (asset.penanggungJawab) {
        setFormPenanggungJawab(asset.penanggungJawab);
      }
      if (asset.siklusPemeliharaanBulan) {
        setFormSiklusBulan(asset.siklusPemeliharaanBulan);
      }
    }
  };

  // Save Add / Edit Form
  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNamaBarang.trim()) {
      showToast.error('Silakan pilih aset atau masukkan nama barang inventaris!');
      return;
    }
    if (!formJudul.trim()) {
      showToast.error('Silakan masukkan judul kegiatan pemeliharaan!');
      return;
    }
    if (!formTanggalJatuhTempo) {
      showToast.error('Silakan tentukan tanggal jatuh tempo servis!');
      return;
    }

    try {
      const payload: Omit<PemeliharaanAset, 'id'> = {
        asetId: formAsetId || `custom-${Date.now()}`,
        kodeAset: formKodeAset || 'AST-GKE',
        namaBarang: formNamaBarang.trim(),
        kategoriAset: formKategoriAset || 'Lainnya',
        lokasiAset: formLokasiAset.trim(),
        judulPemeliharaan: formJudul.trim(),
        jenisPemeliharaan: formJenis,
        tingkatPrioritas: formPrioritas,
        tanggalJatuhTempo: formTanggalJatuhTempo,
        siklusBulan: formSiklusBulan > 0 ? formSiklusBulan : undefined,
        status: formStatus,
        biayaEstimasi: Number(formBiayaEstimasi) || 0,
        penanggungJawabInternal: formPenanggungJawab.trim(),
        kontakPenanggungJawab: formKontakPenanggungJawab.trim(),
        teknisiVendor: formTeknisiVendor.trim(),
        kontakTeknisiVendor: formKontakTeknisiVendor.trim(),
        keterangan: formKeterangan.trim(),
      };

      if (editingItem) {
        await updatePemeliharaanAset(editingItem.id, payload);
        showToast.success('Jadwal pemeliharaan berhasil diperbarui!');
      } else {
        await addPemeliharaanAset(payload);
        showToast.success('Jadwal pemeliharaan baru berhasil ditambahkan!');
      }

      setIsFormModalOpen(false);
      setEditingItem(null);
    } catch (err) {
      console.error(err);
      showToast.error('Gagal menyimpan jadwal pemeliharaan');
    }
  };

  // Open Complete Modal
  const handleOpenCompleteModal = (item: PemeliharaanAset) => {
    setCompletingItem(item);
    setCompleteDate(new Date().toISOString().split('T')[0]);
    setCompleteCost(item.biayaEstimasi || 0);
    setCompleteAction(`Telah dilakukan pemeriksaan menyeluruh dan ${item.jenisPemeliharaan.toLowerCase()}.`);
    setCompleteCondition('Baik');
    setCompleteNextCycle(Boolean(item.siklusBulan && item.siklusBulan > 0));
    setCompleteNextMonths(item.siklusBulan || 3);
    setIsCompleteModalOpen(true);
  };

  // Save Complete Service
  const handleSaveComplete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!completingItem) return;

    try {
      await completePemeliharaanAset(completingItem.id, {
        tanggalSelesai: completeDate,
        biayaRealisasi: Number(completeCost) || 0,
        tindakanPerbaikan: completeAction,
        kondisiAsetSetelahServis: completeCondition,
        buatJadwalBerikutnya: completeNextCycle,
        siklusBulanBerikutnya: completeNextMonths,
      });

      showToast.success(`Pemeliharaan aset "${completingItem.namaBarang}" berhasil ditandai selesai!`);
      setIsCompleteModalOpen(false);
      setCompletingItem(null);
    } catch (err) {
      console.error(err);
      showToast.error('Gagal menyelesaikan jadwal pemeliharaan.');
    }
  };

  // Delete Action
  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    try {
      await deletePemeliharaanAset(itemToDelete.id);
      showToast.success('Jadwal pemeliharaan berhasil dihapus');
      setItemToDelete(null);
    } catch (err) {
      console.error(err);
      showToast.error('Gagal menghapus jadwal');
    }
  };

  // Generate WhatsApp Message
  const generateWaMessage = (item: PemeliharaanAset) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(item.tanggalJatuhTempo);
    due.setHours(0, 0, 0, 0);
    const diffDays = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    let statusText = '';
    if (diffDays < 0) {
      statusText = `🔴 TERLAMBAT (${Math.abs(diffDays)} HARI YANG LALU)`;
    } else if (diffDays === 0) {
      statusText = `🚨 HARI INI (JATUH TEMPO SEGERA)`;
    } else if (diffDays <= 7) {
      statusText = `🟡 MENDEKATI JATUH TEMPO (${diffDays} HARI LAGI)`;
    } else {
      statusText = `🔵 TERJADWAL (${diffDays} HARI LAGI)`;
    }

    const tglIndo = new Date(item.tanggalJatuhTempo).toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    return (
      `*PENGINGAT PEMELIHARAAN & SERVIS ASET GEREJA*\n` +
      `*MAJELIS JEMAAT GKE ${settings.namaJemaat ? settings.namaJemaat.toUpperCase() : 'JEMAAT GKE'}*\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
      `Shalom Bapak/Ibu/Saudara/i Pelayan & Rekanan Teknisi,\n\n` +
      `Kami menyampaikan pengingat jadwal pemeliharaan sarana prasarana gereja dengan rincian sebagai berikut:\n\n` +
      `📦 *Nama Barang:* ${item.namaBarang}\n` +
      `🏷️ *Kode Aset:* ${item.kodeAset}\n` +
      `📁 *Kategori:* ${item.kategoriAset}\n` +
      `📍 *Lokasi Fisik:* ${item.lokasiAset || 'Gereja Utama'}\n` +
      `🔧 *Kegiatan Servis:* ${item.judulPemeliharaan}\n` +
      `⚙️ *Jenis Pemeliharaan:* ${item.jenisPemeliharaan}\n` +
      `⚡ *Tingkat Prioritas:* ${item.tingkatPrioritas.toUpperCase()}\n` +
      `📅 *Jatuh Tempo:* ${tglIndo}\n` +
      `🚨 *Status Servis:* ${statusText}\n` +
      (item.biayaEstimasi && item.biayaEstimasi > 0
        ? `💰 *Estimasi Biaya:* Rp ${item.biayaEstimasi.toLocaleString('id-ID')}\n`
        : '') +
      (item.teknisiVendor ? `👨‍🔧 *Teknisi/Vendor:* ${item.teknisiVendor}\n` : '') +
      (item.penanggungJawabInternal ? `👤 *Penanggung Jawab:* ${item.penanggungJawabInternal}\n` : '') +
      (item.keterangan ? `📝 *Catatan / Gejala:* ${item.keterangan}\n` : '') +
      `━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `Mohon kesediaannya untuk mempersiapkan dan melaksanakan pemeliharaan agar sarana ibadah senantiasa terpelihara dalam kondisi prima.\n\n` +
      `Terima kasih atas kerja sama dan pelayanannya. Tuhan Yesus memberkati.\n\n` +
      `_Majelis Pekerja Harian (MPH) ${settings.namaJemaat}_\n` +
      `_Sistem Informasi Manajemen Aset Gereja_`
    );
  };

  // Open WhatsApp Modal
  const handleOpenWaModal = (item: PemeliharaanAset) => {
    setWaModalItem(item);
    setWaCustomMessage(generateWaMessage(item));
    if (item.teknisiVendor && item.kontakTeknisiVendor) {
      setWaRecipientType('teknisi');
      setWaCustomPhone(item.kontakTeknisiVendor);
    } else if (item.kontakPenanggungJawab) {
      setWaRecipientType('koordinator');
      setWaCustomPhone(item.kontakPenanggungJawab);
    } else {
      setWaRecipientType('custom');
      setWaCustomPhone('');
    }
    setIsWaModalOpen(true);
  };

  // Format WA phone
  const cleanWaNumber = (phone: string) => {
    let cleaned = phone.replace(/[^0-9]/g, '');
    if (cleaned.startsWith('0')) {
      cleaned = '62' + cleaned.slice(1);
    } else if (!cleaned.startsWith('62') && cleaned.length > 0) {
      cleaned = '62' + cleaned;
    }
    return cleaned;
  };

  // Send WhatsApp Link
  const handleSendWa = async () => {
    if (!waModalItem) return;
    const phone = cleanWaNumber(waCustomPhone);
    const url = phone
      ? `https://wa.me/${phone}?text=${encodeURIComponent(waCustomMessage)}`
      : `https://wa.me/?text=${encodeURIComponent(waCustomMessage)}`;

    window.open(url, '_blank');

    // Update reminder sent flag
    await updatePemeliharaanAset(waModalItem.id, {
      notifikasiTerkirim: true,
      notifikasiTerakhirDikirim: new Date().toISOString(),
    });

    showToast.success('Tautan pengingat WhatsApp berhasil dibuka!');
    setIsWaModalOpen(false);
  };

  // Request browser notification
  const handleTestBrowserNotification = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      showToast.info('Browser ini tidak mendukung fitur Web Desktop Notification.');
      return;
    }

    if (Notification.permission === 'granted') {
      new Notification(`Pengingat Pemeliharaan Aset GKE`, {
        body: `Terdapat ${dueSoonMaintenanceCount} aset jatuh tempo servis. Sistem pengingat aktif!`,
        icon: '/favicon.ico',
      });
      showToast.success('Notifikasi desktop browser berhasil ditampilkan!');
    } else if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        new Notification(`Pengingat Pemeliharaan Aset GKE`, {
          body: `Izin notifikasi desktop aktif! Kami akan mengingatkan saat aset mendekati jatuh tempo.`,
          icon: '/favicon.ico',
        });
        showToast.success('Izin notifikasi desktop berhasil diaktifkan!');
      } else {
        showToast.warning('Izin notifikasi browser belum diberikan.');
      }
    } else {
      showToast.warning('Notifikasi browser diblokir di setelan browser Anda.');
    }
  };

  // Calculate summary metrics
  const totalSchedules = pemeliharaanAsetList.length;
  const inProgressCount = pemeliharaanAsetList.filter((s) => s.status === 'Sedang Dikerjakan').length;
  const completedCount = pemeliharaanAsetList.filter((s) => s.status === 'Selesai').length;
  const scheduledCount = pemeliharaanAsetList.filter((s) => s.status === 'Terjadwal').length;

  const totalEstimatedCost = useMemo(() => {
    return pemeliharaanAsetList.reduce((sum, item) => sum + (item.biayaEstimasi || 0), 0);
  }, [pemeliharaanAsetList]);

  const totalRealizedCost = useMemo(() => {
    return pemeliharaanAsetList.reduce((sum, item) => sum + (item.biayaRealisasi || 0), 0);
  }, [pemeliharaanAsetList]);

  // Filtered List
  const filteredList = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return pemeliharaanAsetList
      .map((item) => {
        const dueDate = new Date(item.tanggalJatuhTempo);
        dueDate.setHours(0, 0, 0, 0);
        const diffTime = dueDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return {
          ...item,
          diffDays,
          isOverdue: item.status !== 'Selesai' && item.status !== 'Dibatalkan' && diffDays < 0,
          isDueSoon:
            item.status !== 'Selesai' &&
            item.status !== 'Dibatalkan' &&
            diffDays >= 0 &&
            diffDays <= 7,
        };
      })
      .filter((item) => {
        // Search filter
        const matchSearch =
          item.namaBarang.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.kodeAset.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.judulPemeliharaan.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (item.teknisiVendor && item.teknisiVendor.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (item.penanggungJawabInternal &&
            item.penanggungJawabInternal.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (item.lokasiAset && item.lokasiAset.toLowerCase().includes(searchTerm.toLowerCase()));

        // Status filter
        let matchStatus = true;
        if (statusFilter === 'perlu_perhatian') {
          matchStatus = item.isOverdue || item.isDueSoon;
        } else if (statusFilter === 'terlambat') {
          matchStatus = item.isOverdue;
        } else if (statusFilter === 'jatuh_tempo_segera') {
          matchStatus = item.isDueSoon;
        } else if (statusFilter !== 'semua') {
          matchStatus = item.status === statusFilter;
        }

        // Priority filter
        const matchPriority = priorityFilter === 'semua' || item.tingkatPrioritas === priorityFilter;

        // Category filter
        const matchCategory = categoryFilter === 'semua' || item.kategoriAset === categoryFilter;

        return matchSearch && matchStatus && matchPriority && matchCategory;
      })
      .sort((a, b) => {
        // Sort priority: overdue & due soon first, then chronological
        if (a.status === 'Selesai' && b.status !== 'Selesai') return 1;
        if (b.status === 'Selesai' && a.status !== 'Selesai') return -1;
        return a.diffDays - b.diffDays;
      });
  }, [pemeliharaanAsetList, searchTerm, statusFilter, priorityFilter, categoryFilter]);

  // Unique categories for filtering
  const categoriesList = useMemo(() => {
    const setCat = new Set<string>();
    pemeliharaanAsetList.forEach((p) => {
      if (p.kategoriAset) setCat.add(p.kategoriAset);
    });
    return Array.from(setCat);
  }, [pemeliharaanAsetList]);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white shadow-xl border border-indigo-500/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="text-[10px] font-bold text-amber-300 uppercase tracking-widest bg-amber-500/20 px-3 py-1 rounded-full border border-amber-500/30 flex items-center gap-1.5 w-max">
              <Wrench className="w-3 h-3 text-amber-400" /> Modul Sarana & Prasarana
            </span>
            <h2 className="text-2xl font-black mt-2.5 tracking-tight bg-gradient-to-r from-white via-slate-100 to-amber-200 bg-clip-text text-transparent">
              Penjadwalan & Pemeliharaan Aset Gereja
            </h2>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Pemantauan berkala servis rutin, kalibrasi peralatan ibadah, notifikasi jatuh tempo otomatis via
              WhatsApp, serta kalkulasi estimasi dan realisasi biaya pemeliharaan.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={handleTestBrowserNotification}
              title="Aktifkan atau uji notifikasi pengingat di browser desktop"
              className="px-3.5 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 flex items-center gap-2 transition shadow-sm"
            >
              <Bell className="w-3.5 h-3.5 text-amber-400" />
              <span>Notifikasi Desktop</span>
            </button>

            {onOpenPrint && (
              <button
                type="button"
                onClick={() => onOpenPrint('jadwal_pemeliharaan_aset')}
                className="px-3.5 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 flex items-center gap-2 transition shadow-sm"
              >
                <Printer className="w-3.5 h-3.5 text-indigo-400" />
                <span>Cetak Jadwal</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => handleOpenAddForm()}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-amber-500/25 transition transform active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Jadwalkan Servis Baru</span>
            </button>
          </div>
        </div>
      </div>

      {/* Urgent Warning Notification Banner (if any item is overdue or due in <= 7 days) */}
      {(overdueMaintenanceCount > 0 || dueSoonMaintenanceCount > 0) && (
        <div
          className={`rounded-2xl p-5 border shadow-lg transition-all ${
            overdueMaintenanceCount > 0
              ? 'bg-rose-950/40 border-rose-500/40 text-rose-200'
              : 'bg-amber-950/40 border-amber-500/40 text-amber-200'
          }`}
        >
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div
                className={`p-2.5 rounded-xl border flex-shrink-0 ${
                  overdueMaintenanceCount > 0
                    ? 'bg-rose-500/20 border-rose-500/40 text-rose-400 animate-pulse'
                    : 'bg-amber-500/20 border-amber-500/40 text-amber-400'
                }`}
              >
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-black tracking-wide flex items-center gap-2">
                  <span>Peringatan Jatuh Tempo Pemeliharaan Aset Gereja</span>
                  {overdueMaintenanceCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-500/30 text-rose-300 border border-rose-500/40">
                      {overdueMaintenanceCount} Terlambat
                    </span>
                  )}
                  {dueSoonMaintenanceCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/30 text-amber-300 border border-amber-500/40">
                      {dueSoonMaintenanceCount} Jatuh Tempo Segera
                    </span>
                  )}
                </h4>
                <p className="text-xs text-slate-300 mt-1">
                  Terdapat sarana/peralatan gereja yang memerlukan tindakan servis berkala atau sudah melewati batas
                  waktu. Harap segera berkoordinasi dengan teknisi atau koordinator terkait.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto">
              <button
                type="button"
                onClick={() => setStatusFilter('perlu_perhatian')}
                className="w-full md:w-auto px-3.5 py-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-100 text-xs font-bold border border-slate-700 flex items-center justify-center gap-2 transition"
              >
                <span>Lihat {overdueMaintenanceCount + dueSoonMaintenanceCount} Aset Kritis</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Metrics Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* Total Terjadwal */}
        <div className="bg-slate-900/80 rounded-2xl p-4 border border-slate-800 shadow-md backdrop-blur-md">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Total Jadwal</span>
            <Calendar className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-100">{totalSchedules}</span>
            <span className="text-[11px] text-slate-400">servis</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between border-t border-slate-800/80 pt-2">
            <span>Terjadwal Aktif:</span>
            <span className="font-bold text-slate-200">{scheduledCount}</span>
          </div>
        </div>

        {/* Mendekati Jatuh Tempo (<= 7 hari) */}
        <div
          onClick={() => setStatusFilter(statusFilter === 'jatuh_tempo_segera' ? 'semua' : 'jatuh_tempo_segera')}
          className={`cursor-pointer rounded-2xl p-4 border shadow-md backdrop-blur-md transition ${
            statusFilter === 'jatuh_tempo_segera'
              ? 'bg-amber-950/60 border-amber-500'
              : 'bg-slate-900/80 border-slate-800 hover:border-amber-500/50'
          }`}
        >
          <div className="flex items-center justify-between text-amber-300 text-xs">
            <span>Jatuh Tempo (≤ 7 Hari)</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-amber-400">{dueSoonMaintenanceCount}</span>
            <span className="text-[11px] text-amber-300/80">aset</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between border-t border-slate-800/80 pt-2">
            <span>Status:</span>
            <span className="font-bold text-amber-400">Siap Servis</span>
          </div>
        </div>

        {/* Terlambat (Overdue) */}
        <div
          onClick={() => setStatusFilter(statusFilter === 'terlambat' ? 'semua' : 'terlambat')}
          className={`cursor-pointer rounded-2xl p-4 border shadow-md backdrop-blur-md transition ${
            statusFilter === 'terlambat'
              ? 'bg-rose-950/60 border-rose-500'
              : 'bg-slate-900/80 border-slate-800 hover:border-rose-500/50'
          }`}
        >
          <div className="flex items-center justify-between text-rose-300 text-xs">
            <span>Terlambat (Overdue)</span>
            <ShieldAlert className="w-4 h-4 text-rose-400 animate-pulse" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-rose-400">{overdueMaintenanceCount}</span>
            <span className="text-[11px] text-rose-300/80">aset</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between border-t border-slate-800/80 pt-2">
            <span>Urgensi:</span>
            <span className="font-bold text-rose-400">Tindakan Cepat</span>
          </div>
        </div>

        {/* Sedang Dikerjakan */}
        <div
          onClick={() =>
            setStatusFilter(statusFilter === 'Sedang Dikerjakan' ? 'semua' : 'Sedang Dikerjakan')
          }
          className={`cursor-pointer rounded-2xl p-4 border shadow-md backdrop-blur-md transition ${
            statusFilter === 'Sedang Dikerjakan'
              ? 'bg-blue-950/60 border-blue-500'
              : 'bg-slate-900/80 border-slate-800 hover:border-blue-500/50'
          }`}
        >
          <div className="flex items-center justify-between text-blue-300 text-xs">
            <span>Sedang Dikerjakan</span>
            <RefreshCw className="w-4 h-4 text-blue-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-blue-400">{inProgressCount}</span>
            <span className="text-[11px] text-blue-300/80">aset</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between border-t border-slate-800/80 pt-2">
            <span>Progress:</span>
            <span className="font-bold text-blue-400">Dalam Pengerjaan</span>
          </div>
        </div>

        {/* Selesai */}
        <div
          onClick={() => setStatusFilter(statusFilter === 'Selesai' ? 'semua' : 'Selesai')}
          className={`cursor-pointer rounded-2xl p-4 border shadow-md backdrop-blur-md transition col-span-2 lg:col-span-1 ${
            statusFilter === 'Selesai'
              ? 'bg-emerald-950/60 border-emerald-500'
              : 'bg-slate-900/80 border-slate-800 hover:border-emerald-500/50'
          }`}
        >
          <div className="flex items-center justify-between text-emerald-300 text-xs">
            <span>Selesai Servis</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-400">{completedCount}</span>
            <span className="text-[11px] text-emerald-300/80">selesai</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between border-t border-slate-800/80 pt-2">
            <span>Biaya Realisasi:</span>
            <span className="font-bold text-emerald-400">Rp {(totalRealizedCost / 1000).toFixed(0)}k</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900/80 rounded-2xl p-4 border border-slate-800 shadow-md backdrop-blur-md space-y-3.5">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari nama barang, kode aset, teknisi, penanggung jawab..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-800/90 border border-slate-700 text-slate-100 placeholder-slate-400 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/50"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick Filter Selects */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Status Select */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/50"
            >
              <option value="semua">Semua Status Servis</option>
              <option value="perlu_perhatian">⚠️ Perlu Perhatian (Kritis)</option>
              <option value="terlambat">🔴 Terlambat Saja</option>
              <option value="jatuh_tempo_segera">🟡 Jatuh Tempo Segera (≤ 7 Hari)</option>
              <option value="Terjadwal">Terjadwal</option>
              <option value="Sedang Dikerjakan">Sedang Dikerjakan</option>
              <option value="Selesai">Selesai</option>
              <option value="Dibatalkan">Dibatalkan</option>
            </select>

            {/* Priority Select */}
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/50"
            >
              <option value="semua">Semua Prioritas</option>
              <option value="Darurat">⚡ Darurat</option>
              <option value="Tinggi">Tinggi</option>
              <option value="Sedang">Sedang</option>
              <option value="Rendah">Rendah</option>
            </select>

            {/* Category Select */}
            {categoriesList.length > 0 && (
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/50"
              >
                <option value="semua">Semua Kategori Aset</option>
                {categoriesList.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            )}

            {/* Toggle View Mode */}
            <div className="flex items-center bg-slate-800 rounded-xl p-0.5 border border-slate-700">
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition ${
                  viewMode === 'table' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-300 hover:text-white'
                }`}
                title="Tampilan Tabel"
              >
                Tabel
              </button>
              <button
                type="button"
                onClick={() => setViewMode('cards')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition ${
                  viewMode === 'cards' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-300 hover:text-white'
                }`}
                title="Tampilan Kartu"
              >
                Kartu
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main List Section */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800 shadow-xl overflow-hidden backdrop-blur-md">
        <div className="p-4 bg-slate-950/40 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wrench className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-bold text-slate-100">
              Daftar Jadwal Pemeliharaan & Riwayat Servis
            </h3>
            <span className="text-xs text-slate-400">({filteredList.length} jadwal ditampilkan)</span>
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-400">
            <span>Estimasi Biaya: <strong className="text-slate-200">Rp {totalEstimatedCost.toLocaleString('id-ID')}</strong></span>
            <span>•</span>
            <span>Realisasi Biaya: <strong className="text-emerald-400">Rp {totalRealizedCost.toLocaleString('id-ID')}</strong></span>
          </div>
        </div>

        {filteredList.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-3">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-500">
              <Wrench className="w-7 h-7" />
            </div>
            <p className="text-sm font-bold text-slate-300">Belum ada jadwal pemeliharaan yang cocok</p>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Silakan sesuaikan filter pencarian Anda atau buat jadwal servis berkala baru untuk peralatan dan
              sarana inventaris gereja.
            </p>
            <button
              type="button"
              onClick={() => handleOpenAddForm()}
              className="mt-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs inline-flex items-center gap-2 shadow"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Buat Jadwal Pertama</span>
            </button>
          </div>
        ) : viewMode === 'table' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300 border-collapse">
              <thead>
                <tr className="bg-slate-950/60 text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800">
                  <th className="p-3.5 font-bold">Barang & Kode Aset</th>
                  <th className="p-3.5 font-bold">Kegiatan & Jenis</th>
                  <th className="p-3.5 font-bold">Jatuh Tempo & Sisa Hari</th>
                  <th className="p-3.5 font-bold text-center">Prioritas</th>
                  <th className="p-3.5 font-bold">Teknisi / Vendor</th>
                  <th className="p-3.5 font-bold text-right">Biaya (Rp)</th>
                  <th className="p-3.5 font-bold text-center">Status</th>
                  <th className="p-3.5 font-bold text-right">Aksi & Notifikasi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredList.map((item) => {
                  const isOverdue = item.isOverdue;
                  const isDueSoon = item.isDueSoon;
                  const isCompleted = item.status === 'Selesai';

                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-slate-800/40 transition ${
                        isOverdue
                          ? 'bg-rose-950/15'
                          : isDueSoon
                          ? 'bg-amber-950/15'
                          : isCompleted
                          ? 'opacity-85'
                          : ''
                      }`}
                    >
                      {/* Barang & Kode */}
                      <td className="p-3.5 align-top">
                        <div className="font-bold text-slate-100 flex items-center gap-1.5">
                          <span>{item.namaBarang}</span>
                        </div>
                        <div className="font-mono text-[11px] text-amber-400/90 mt-0.5">
                          {item.kodeAset}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {item.kategoriAset} {item.lokasiAset ? `• ${item.lokasiAset}` : ''}
                        </div>
                      </td>

                      {/* Kegiatan & Jenis */}
                      <td className="p-3.5 align-top">
                        <div className="font-semibold text-slate-200 leading-snug">
                          {item.judulPemeliharaan}
                        </div>
                        <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-slate-800 text-[10px] text-slate-300 border border-slate-700">
                          {item.jenisPemeliharaan}
                        </span>
                        {item.siklusBulan && (
                          <span className="inline-block mt-1 ml-1 px-1.5 py-0.5 rounded bg-indigo-950/60 text-[9px] text-indigo-300 border border-indigo-800/50">
                            Tiap {item.siklusBulan} bln
                          </span>
                        )}
                        {item.keterangan && (
                          <p className="text-[10px] text-slate-400 mt-1 line-clamp-1" title={item.keterangan}>
                            {item.keterangan}
                          </p>
                        )}
                      </td>

                      {/* Jatuh Tempo */}
                      <td className="p-3.5 align-top">
                        <div className="font-medium text-slate-200">
                          {new Date(item.tanggalJatuhTempo).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </div>
                        {isCompleted ? (
                          <div className="text-[10px] text-emerald-400 mt-1 flex items-center gap-1">
                            <Check className="w-3 h-3" />
                            <span>Selesai {item.tanggalSelesai ? `(${item.tanggalSelesai})` : ''}</span>
                          </div>
                        ) : isOverdue ? (
                          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px] font-bold mt-1 animate-pulse">
                            <AlertTriangle className="w-3 h-3" />
                            <span>Terlambat {Math.abs(item.diffDays)} hari</span>
                          </div>
                        ) : item.diffDays === 0 ? (
                          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold mt-1 animate-bounce">
                            <Clock className="w-3 h-3" />
                            <span>Hari Ini!</span>
                          </div>
                        ) : isDueSoon ? (
                          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-semibold mt-1">
                            <Clock className="w-3 h-3" />
                            <span>Tinggal {item.diffDays} hari</span>
                          </div>
                        ) : (
                          <div className="text-[10px] text-slate-400 mt-1">
                            Dalam {item.diffDays} hari
                          </div>
                        )}
                      </td>

                      {/* Prioritas */}
                      <td className="p-3.5 align-top text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold inline-block ${
                            item.tingkatPrioritas === 'Darurat'
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                              : item.tingkatPrioritas === 'Tinggi'
                              ? 'bg-orange-500/20 text-orange-300 border border-orange-500/30'
                              : item.tingkatPrioritas === 'Sedang'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : 'bg-slate-700 text-slate-300'
                          }`}
                        >
                          {item.tingkatPrioritas}
                        </span>
                      </td>

                      {/* Teknisi / Vendor */}
                      <td className="p-3.5 align-top">
                        {item.teknisiVendor ? (
                          <div className="font-medium text-slate-200">{item.teknisiVendor}</div>
                        ) : (
                          <div className="text-slate-500 italic">Belum ditentukan</div>
                        )}
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          PJ: {item.penanggungJawabInternal || '-'}
                        </div>
                      </td>

                      {/* Biaya */}
                      <td className="p-3.5 align-top text-right font-mono">
                        {item.biayaRealisasi && item.biayaRealisasi > 0 ? (
                          <div>
                            <span className="font-bold text-emerald-400">
                              Rp {item.biayaRealisasi.toLocaleString('id-ID')}
                            </span>
                            <div className="text-[9px] text-slate-400">Realisasi</div>
                          </div>
                        ) : item.biayaEstimasi && item.biayaEstimasi > 0 ? (
                          <div>
                            <span className="text-slate-300">
                              Rp {item.biayaEstimasi.toLocaleString('id-ID')}
                            </span>
                            <div className="text-[9px] text-slate-500">Estimasi</div>
                          </div>
                        ) : (
                          <span className="text-slate-600">-</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="p-3.5 align-top text-center">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold inline-block ${
                            item.status === 'Selesai'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : item.status === 'Sedang Dikerjakan'
                              ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                              : item.status === 'Dibatalkan'
                              ? 'bg-slate-800 text-slate-500'
                              : isOverdue
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                              : isDueSoon
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                              : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>

                      {/* Aksi & Notifikasi */}
                      <td className="p-3.5 align-top text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Tombol Kirim Pengingat WhatsApp */}
                          <button
                            type="button"
                            onClick={() => handleOpenWaModal(item)}
                            title="Kirim Notifikasi Pengingat WhatsApp ke Teknisi atau Koordinator"
                            className="p-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white border border-emerald-700 transition-all shadow-xs flex items-center justify-center cursor-pointer"
                          >
                            <MessageCircle className="w-4 h-4 text-white" />
                          </button>

                          {/* Tombol Tandai Selesai */}
                          {item.status !== 'Selesai' && (
                            <button
                              type="button"
                              onClick={() => handleOpenCompleteModal(item)}
                              title="Tandai Servis Selesai & Catat Realisasi Biaya"
                              className="p-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white border border-blue-700 transition-all shadow-xs flex items-center justify-center cursor-pointer"
                            >
                              <CheckCircle2 className="w-4 h-4 text-white" />
                            </button>
                          )}

                          {/* Tombol Edit */}
                          <button
                            type="button"
                            onClick={() => handleOpenEditForm(item)}
                            title="Ubah Jadwal Pemeliharaan"
                            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 border border-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 dark:border-slate-600 transition-all shadow-2xs flex items-center justify-center cursor-pointer"
                          >
                            <Edit className="w-4 h-4 text-slate-700 dark:text-slate-200" />
                          </button>

                          {/* Tombol Hapus */}
                          <button
                            type="button"
                            onClick={() => setItemToDelete(item)}
                            title="Hapus Jadwal Pemeliharaan"
                            className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 active:scale-95 text-rose-600 border border-rose-200 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 dark:text-rose-300 dark:border-rose-800/60 transition-all shadow-2xs flex items-center justify-center cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4 text-rose-600 dark:text-rose-300" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          /* Cards View */
          <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredList.map((item) => {
              const isOverdue = item.isOverdue;
              const isDueSoon = item.isDueSoon;
              const isCompleted = item.status === 'Selesai';

              return (
                <div
                  key={item.id}
                  className={`rounded-2xl p-4 border transition flex flex-col justify-between ${
                    isOverdue
                      ? 'bg-rose-950/20 border-rose-500/40'
                      : isDueSoon
                      ? 'bg-amber-950/20 border-amber-500/40'
                      : isCompleted
                      ? 'bg-slate-900/60 border-slate-800 opacity-85'
                      : 'bg-slate-900/80 border-slate-800'
                  }`}
                >
                  <div className="space-y-3">
                    {/* Header Card */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="font-mono text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                          {item.kodeAset}
                        </span>
                        <h4 className="font-bold text-slate-100 text-sm mt-1.5">{item.namaBarang}</h4>
                        <div className="text-[10px] text-slate-400">{item.kategoriAset}</div>
                      </div>

                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          isCompleted
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : isOverdue
                            ? 'bg-rose-500/20 text-rose-300 animate-pulse'
                            : 'bg-indigo-500/20 text-indigo-300'
                        }`}
                      >
                        {item.status}
                      </span>
                    </div>

                    {/* Judul & Jenis */}
                    <div className="p-2.5 rounded-xl bg-slate-950/40 border border-slate-800/80 text-xs">
                      <div className="font-semibold text-slate-200">{item.judulPemeliharaan}</div>
                      <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
                        <span>{item.jenisPemeliharaan}</span>
                        <span className="font-bold text-amber-400">Prioritas: {item.tingkatPrioritas}</span>
                      </div>
                    </div>

                    {/* Tanggal & Urgensi */}
                    <div className="space-y-1 text-xs">
                      <div className="flex items-center justify-between text-slate-300">
                        <span className="text-slate-400">Jatuh Tempo:</span>
                        <span className="font-semibold">
                          {new Date(item.tanggalJatuhTempo).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Sisa Waktu:</span>
                        {isCompleted ? (
                          <span className="text-emerald-400 font-bold">Selesai</span>
                        ) : isOverdue ? (
                          <span className="text-rose-400 font-bold">Terlambat {Math.abs(item.diffDays)} hari</span>
                        ) : (
                          <span className="text-amber-400 font-semibold">{item.diffDays} hari lagi</span>
                        )}
                      </div>

                      {item.biayaEstimasi && item.biayaEstimasi > 0 && (
                        <div className="flex items-center justify-between text-slate-300 pt-1 border-t border-slate-800">
                          <span className="text-slate-400">Estimasi Biaya:</span>
                          <span className="font-bold">Rp {item.biayaEstimasi.toLocaleString('id-ID')}</span>
                        </div>
                      )}

                      {item.teknisiVendor && (
                        <div className="flex items-center justify-between text-slate-300">
                          <span className="text-slate-400">Teknisi:</span>
                          <span>{item.teknisiVendor}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => handleOpenWaModal(item)}
                      className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold border border-emerald-700 flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer"
                    >
                      <MessageCircle className="w-4 h-4 text-white" />
                      <span className="text-white font-bold">Kirim WA</span>
                    </button>

                    {item.status !== 'Selesai' && (
                      <button
                        type="button"
                        onClick={() => handleOpenCompleteModal(item)}
                        className="py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-bold border border-blue-700 flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                      >
                        <CheckCircle2 className="w-4 h-4 text-white" />
                        <span className="text-white font-bold">Selesai</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleOpenEditForm(item)}
                      className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 border border-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 dark:border-slate-600 transition-all shadow-2xs cursor-pointer"
                      title="Edit"
                    >
                      <Edit className="w-4 h-4 text-slate-700 dark:text-slate-200" />
                    </button>

                    <button
                      type="button"
                      onClick={() => setItemToDelete(item)}
                      className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 active:scale-95 text-rose-600 border border-rose-200 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 dark:text-rose-300 dark:border-rose-800/60 transition-all shadow-2xs cursor-pointer"
                      title="Hapus"
                    >
                      <Trash2 className="w-4 h-4 text-rose-600 dark:text-rose-300" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------- */}
      {/* MODAL: FORM TAMBAH / EDIT JADWAL PEMELIHARAAN */}
      {/* ------------------------------------------------------------- */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl my-8">
            <div className="p-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  <Wrench className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-100">
                    {editingItem ? 'Ubah Jadwal Pemeliharaan Aset' : 'Jadwalkan Pemeliharaan Aset Baru'}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Pencatatan servis berkala & pengingat otomatis jatuh tempo
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsFormModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveForm} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {/* Pilih Aset dari Inventaris */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Pilih Aset Inventaris Gereja <span className="text-amber-400">*</span>
                </label>
                <select
                  value={formAsetId || ''}
                  onChange={(e) => handleSelectAssetInForm(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                >
                  <option value="">-- Pilih dari Daftar Inventaris atau Ketik Bebas --</option>
                  {inventarisList.map((asset) => (
                    <option key={asset.id} value={asset.id}>
                      [{asset.kodeAset}] {asset.namaBarang} - {asset.kategori} ({asset.lokasiPenyimpanan || 'Gereja'})
                    </option>
                  ))}
                </select>
              </div>

              {/* Rincian Nama Barang & Kode */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Nama Barang / Peralatan <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Misal: Mixer Audio Yamaha 32 Channel"
                    value={formNamaBarang || ''}
                    onChange={(e) => setFormNamaBarang(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Kode Aset
                  </label>
                  <input
                    type="text"
                    placeholder="AST-GKE-001"
                    value={formKodeAset || ''}
                    onChange={(e) => setFormKodeAset(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                  />
                </div>
              </div>

              {/* Kategori & Lokasi */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Kategori Aset
                  </label>
                  <select
                    value={formKategoriAset || 'Sound System & Peralatan Musik'}
                    onChange={(e) => setFormKategoriAset(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                  >
                    <option value="Sound System & Peralatan Musik">Sound System & Peralatan Musik</option>
                    <option value="Alat Elektronik & IT">Alat Elektronik & IT (AC, Proyektor, PC, Genset)</option>
                    <option value="Bangunan & Tanah">Bangunan & Tanah (Gedung Gereja, Konsistori)</option>
                    <option value="Kendaraan Operasional">Kendaraan Operasional</option>
                    <option value="Mebel & Furnitur">Mebel & Furnitur (Bangku Jemaat, Mimbar)</option>
                    <option value="Peralatan Sakramen & Ibadah">Peralatan Sakramen & Ibadah</option>
                    <option value="Lainnya">Lainnya</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Lokasi Fisik Barang
                  </label>
                  <input
                    type="text"
                    placeholder="Misal: Ruang Sound System Lt. 2, Konsistori"
                    value={formLokasiAset || ''}
                    onChange={(e) => setFormLokasiAset(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                  />
                </div>
              </div>

              {/* Judul Kegiatan & Jenis Pemeliharaan */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Judul Pemeliharaan <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Misal: Servis Rutin & Kalibrasi Fader Mixer"
                    value={formJudul || ''}
                    onChange={(e) => setFormJudul(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Jenis Pemeliharaan
                  </label>
                  <select
                    value={formJenis || 'Servis Rutin'}
                    onChange={(e) => setFormJenis(e.target.value as JenisPemeliharaan)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                  >
                    <option value="Servis Rutin">Servis Rutin</option>
                    <option value="Pemeriksaan Berkala">Pemeriksaan Berkala</option>
                    <option value="Perbaikan Kerusakan">Perbaikan Kerusakan</option>
                    <option value="Penggantian Suku Cadang">Penggantian Suku Cadang</option>
                    <option value="Kalibrasi & Tuning">Kalibrasi & Tuning</option>
                    <option value="Pembersihan Menyeluruh">Pembersihan Menyeluruh</option>
                    <option value="Pengecatan / Renovasi Fisik">Pengecatan / Renovasi Fisik</option>
                    <option value="Lainnya">Lainnya</option>
                  </select>
                </div>
              </div>

              {/* Tanggal Jatuh Tempo, Siklus Pengulangan, & Tingkat Prioritas */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Tanggal Jatuh Tempo <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formTanggalJatuhTempo || ''}
                    onChange={(e) => setFormTanggalJatuhTempo(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Siklus Rutin (Bulan)
                  </label>
                  <select
                    value={formSiklusBulan ?? 3}
                    onChange={(e) => setFormSiklusBulan(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                  >
                    <option value={1}>Tiap 1 Bulan</option>
                    <option value={2}>Tiap 2 Bulan</option>
                    <option value={3}>Tiap 3 Bulan (Triwulan)</option>
                    <option value={6}>Tiap 6 Bulan (Semester)</option>
                    <option value={12}>Tiap 12 Bulan (Tahunan)</option>
                    <option value={0}>Tidak Berulang (Sekali)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Tingkat Prioritas
                  </label>
                  <select
                    value={formPrioritas || 'Sedang'}
                    onChange={(e) => setFormPrioritas(e.target.value as TingkatPrioritas)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                  >
                    <option value="Rendah">Rendah</option>
                    <option value="Sedang">Sedang</option>
                    <option value="Tinggi">Tinggi</option>
                    <option value="Darurat">⚡ Darurat (Mendesak)</option>
                  </select>
                </div>
              </div>

              {/* Status & Estimasi Biaya */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Status Pemeliharaan
                  </label>
                  <select
                    value={formStatus || 'Terjadwal'}
                    onChange={(e) => setFormStatus(e.target.value as StatusPemeliharaan)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                  >
                    <option value="Terjadwal">Terjadwal</option>
                    <option value="Sedang Dikerjakan">Sedang Dikerjakan</option>
                    <option value="Selesai">Selesai</option>
                    <option value="Dibatalkan">Dibatalkan</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Estimasi Biaya Servis (Rp)
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={formBiayaEstimasi ?? 0}
                    onChange={(e) => setFormBiayaEstimasi(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                  />
                </div>
              </div>

              {/* Penanggung Jawab & Kontak */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Koordinator / Penanggung Jawab Aset
                  </label>
                  <input
                    type="text"
                    placeholder="Nama Majelis / Pengurus Sarpras"
                    value={formPenanggungJawab || ''}
                    onChange={(e) => setFormPenanggungJawab(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    No. WhatsApp Koordinator
                  </label>
                  <input
                    type="text"
                    placeholder="0812xxxx"
                    value={formKontakPenanggungJawab || ''}
                    onChange={(e) => setFormKontakPenanggungJawab(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                  />
                </div>
              </div>

              {/* Teknisi / Vendor & Kontak */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Nama Teknisi / Vendor Rekanan
                  </label>
                  <input
                    type="text"
                    placeholder="Misal: Toko Musik Harapan / Teknisi AC Bpk. Rudi"
                    value={formTeknisiVendor || ''}
                    onChange={(e) => setFormTeknisiVendor(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    No. WhatsApp Teknisi / Vendor
                  </label>
                  <input
                    type="text"
                    placeholder="0852xxxx (untuk pengiriman pengingat WA)"
                    value={formKontakTeknisiVendor || ''}
                    onChange={(e) => setFormKontakTeknisiVendor(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                  />
                </div>
              </div>

              {/* Keterangan Teknis / Gejala Kerusakan */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Catatan Teknis / Gejala Kerusakan / Petunjuk
                </label>
                <textarea
                  rows={3}
                  placeholder="Catatan kendala suara berdengung di channel 4, atau instruksi penggantian filter oli genset..."
                  value={formKeterangan || ''}
                  onChange={(e) => setFormKeterangan(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                ></textarea>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold shadow-lg shadow-amber-500/25 transition"
                >
                  {editingItem ? 'Simpan Perubahan' : 'Simpan & Jadwalkan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL: KONFIRMASI SELESAI PEMELIHARAAN */}
      {/* ------------------------------------------------------------- */}
      {isCompleteModalOpen && completingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="modal-dark-header p-5 bg-gradient-to-r from-blue-950 via-slate-900 to-slate-900 border-b border-slate-800 flex items-center justify-between !text-white text-white">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="modal-title text-base font-bold !text-white text-white">Selesaikan Pemeliharaan Aset</h3>
                  <p className="text-xs !text-slate-300 text-slate-300 mt-0.5">{completingItem.namaBarang}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCompleteModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveComplete} className="p-6 space-y-4">
              <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-400">Kode Aset:</span>
                  <span className="font-mono text-amber-400 font-bold">{completingItem.kodeAset}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Kegiatan:</span>
                  <span className="font-semibold text-slate-200">{completingItem.judulPemeliharaan}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Estimasi Biaya:</span>
                  <span>Rp {(completingItem.biayaEstimasi || 0).toLocaleString('id-ID')}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Tanggal Selesai Pengerjaan <span className="text-rose-400">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={completeDate || ''}
                  onChange={(e) => setCompleteDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Realisasi Biaya Servis (Rp) <span className="text-rose-400">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={completeCost ?? 0}
                  onChange={(e) => setCompleteCost(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Tindakan & Perbaikan yang Dilakukan
                </label>
                <textarea
                  rows={2}
                  value={completeAction || ''}
                  onChange={(e) => setCompleteAction(e.target.value)}
                  placeholder="Penggantian suku cadang kapasitor, pembersihan filter, kalibrasi..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                ></textarea>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Update Kondisi Aset di Inventaris
                </label>
                <select
                  value={completeCondition}
                  onChange={(e) => setCompleteCondition(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                >
                  <option value="Baik">✅ Baik (Prima & Siap Digunakan)</option>
                  <option value="Rusak Ringan">⚠️ Rusak Ringan</option>
                  <option value="Rusak Berat">🔴 Rusak Berat</option>
                </select>
              </div>

              {/* Next recurring schedule checkbox */}
              <div className="pt-2 border-t border-slate-800">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={completeNextCycle}
                    onChange={(e) => setCompleteNextCycle(e.target.checked)}
                    className="mt-0.5 rounded text-amber-500 focus:ring-amber-500"
                  />
                  <span className="text-xs text-slate-300">
                    Otomatis jadwalkan pemeliharaan berkala berikutnya
                  </span>
                </label>

                {completeNextCycle && (
                  <div className="mt-2.5 pl-6 flex items-center gap-2">
                    <span className="text-xs text-slate-400">Jadwalkan servis</span>
                    <select
                      value={completeNextMonths}
                      onChange={(e) => setCompleteNextMonths(Number(e.target.value))}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 text-xs"
                    >
                      <option value={1}>1 Bulan</option>
                      <option value={3}>3 Bulan (Triwulan)</option>
                      <option value={6}>6 Bulan (Semester)</option>
                      <option value={12}>12 Bulan (Tahunan)</option>
                    </select>
                    <span className="text-xs text-slate-400">ke depan</span>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsCompleteModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-xs font-bold shadow-lg shadow-emerald-500/25 transition"
                >
                  Simpan & Selesaikan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL: PENGIRIMAN PENGINGAT WHATSAPP */}
      {/* ------------------------------------------------------------- */}
      {isWaModalOpen && waModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="p-5 bg-gradient-to-r from-emerald-950 via-slate-900 to-slate-900 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <MessageCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-100">Kirim Notifikasi Pengingat WhatsApp</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Pengingat jatuh tempo servis {waModalItem.namaBarang}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsWaModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Tujuan Penerima Pesan WhatsApp
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setWaRecipientType('teknisi');
                      setWaCustomPhone(waModalItem.kontakTeknisiVendor || '');
                    }}
                    className={`py-2 px-2.5 rounded-xl text-xs font-semibold border transition ${
                      waRecipientType === 'teknisi'
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                        : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    👨‍🔧 Teknisi/Vendor
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setWaRecipientType('koordinator');
                      setWaCustomPhone(waModalItem.kontakPenanggungJawab || '');
                    }}
                    className={`py-2 px-2.5 rounded-xl text-xs font-semibold border transition ${
                      waRecipientType === 'koordinator'
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                        : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    👤 Koordinator
                  </button>

                  <button
                    type="button"
                    onClick={() => setWaRecipientType('custom')}
                    className={`py-2 px-2.5 rounded-xl text-xs font-semibold border transition ${
                      waRecipientType === 'custom'
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                        : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    📱 Nomor Lain
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Nomor WhatsApp Penerima
                </label>
                <input
                  type="text"
                  placeholder="0812xxxxxxxx atau 62812xxxxxxxx"
                  value={waCustomPhone || ''}
                  onChange={(e) => setWaCustomPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Pratinjau Teks Pesan Pengingat
                </label>
                <textarea
                  rows={7}
                  value={waCustomMessage || ''}
                  onChange={(e) => setWaCustomMessage(e.target.value)}
                  className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 font-mono text-xs leading-relaxed focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                ></textarea>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(waCustomMessage);
                    showToast.success('Teks pesan berhasil disalin ke clipboard!');
                  }}
                  className="text-xs text-slate-400 hover:text-slate-200 underline"
                >
                  Salin Teks Saja
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsWaModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={handleSendWa}
                    className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-500/25 transition"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Buka WhatsApp</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL: KONFIRMASI HAPUS JADWAL */}
      {/* ------------------------------------------------------------- */}
      {itemToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/30 flex-shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-100">Hapus Jadwal Pemeliharaan?</h3>
                <p className="text-xs text-slate-400 mt-0.5">Tindakan ini tidak dapat dibatalkan.</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-3 rounded-xl border border-slate-800">
              Jadwal kegiatan <strong>"{itemToDelete.judulPemeliharaan}"</strong> untuk aset{' '}
              <strong>"{itemToDelete.namaBarang}"</strong> ({itemToDelete.kodeAset}) akan dihapus permanen dari sistem.
            </p>

            <div className="pt-2 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setItemToDelete(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition shadow-lg shadow-rose-600/25"
              >
                Ya, Hapus Jadwal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
