import React, { useState, useRef, useMemo } from 'react';
import {
  Calendar,
  Clock,
  Edit2,
  MapPin,
  Plus,
  Printer,
  Search,
  Trash2,
  Users,
  X,
  Layers,
  Sparkles,
  BookOpen,
  Music,
  CheckCircle2,
  Filter,
  AlertTriangle,
  Loader2,
  ShieldAlert,
  FileSpreadsheet,
  Download,
  UploadCloud,
  FileUp,
  FileDown,
  Check,
  HelpCircle,
  Info,
  RefreshCw,
  FileText,
  AlertCircle,
  ArrowRight,
  Share2,
  MessageCircle,
  Copy,
  ExternalLink,
} from 'lucide-react';
import ExcelJS from 'exceljs';
import Papa from 'papaparse';
import { useApp } from '../../context/AppContext';
import { JadwalIbadah } from '../../types';
import defaultGkeLogo from '../../assets/images/gke_logo_official_1785341836111.jpg';
import { GeneratorJadwalTahunBerikutnyaModal } from './GeneratorJadwalTahunBerikutnyaModal';

export interface ParsedJadwalExcelItem {
  idTemp: string;
  tanggal: string;
  waktu: string;
  namaIbadah: string;
  kategoriIbadah: 'Umum / Hari Minggu' | 'Kategorial' | 'Rayon / Lingkungan' | 'Sakramen / Khusus' | string;
  seksi?: string;
  rayon?: string;
  tempat: string;
  tuanRumah?: string;
  pelayanFirman: string;
  natsKhotbah?: string;
  liturgos?: string;
  pembacaanAlkitab?: string;
  pemusik?: string;
  pemanduLagu?: string;
  kolektan?: string;
  operatorMultimedia?: string;
  penerimaTamu?: string;
  pewartaBerita?: string;
  koordinatorPelayanan?: string;
  kuponUndian?: string;
  wartaKhusus?: string;
  isValid: boolean;
  isDuplicate?: boolean;
  duplicateInfo?: string;
  errorMsg?: string;
}

export const JadwalIbadahModule: React.FC = () => {
  const {
    jadwalIbadahList,
    addJadwalIbadah,
    batchAddJadwalIbadah,
    updateJadwalIbadah,
    deleteJadwalIbadah,
    openPrintReport,
    lingkunganList,
    penatuaDiakonList,
    currentUser,
    settings,
    wargaJemaatList,
  } = useApp();

  const allRayons = useMemo(() => {
    const fromLingkungan = (lingkunganList || []).map((l) => (l.nama || '').trim()).filter(Boolean);
    const fromWarga = (wargaJemaatList || []).map((w) => (w.rayon || '').trim()).filter(Boolean);
    const combined = Array.from(new Set([...fromLingkungan, ...fromWarga])).sort();
    return combined.length > 0 ? combined : ['Lingkungan I', 'Lingkungan II', 'Lingkungan III'];
  }, [lingkunganList, wargaJemaatList]);

  const [categoryFilter, setCategoryFilter] = useState<'semua' | 'umum' | 'kategorial' | 'rayon'>('semua');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isGeneratorModalOpen, setIsGeneratorModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<JadwalIbadah | null>(null);

  // PDF, CSV & WhatsApp Export States
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isExportingCsv, setIsExportingCsv] = useState(false);
  const [isWhatsAppShareModalOpen, setIsWhatsAppShareModalOpen] = useState(false);
  const [copiedWaText, setCopiedWaText] = useState(false);
  const pdfContainerRef = useRef<HTMLDivElement>(null);

  // Excel Import & Export States
  const [isExcelModalOpen, setIsExcelModalOpen] = useState(false);
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [isParsingExcel, setIsParsingExcel] = useState(false);
  const [parsedExcelRows, setParsedExcelRows] = useState<ParsedJadwalExcelItem[]>([]);
  const [isImportingExcel, setIsImportingExcel] = useState(false);
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0 });
  const [skipDuplicates, setSkipDuplicates] = useState(true);
  const [importFilterTab, setImportFilterTab] = useState<'semua' | 'valid' | 'duplikat' | 'error'>('semua');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showGuide, setShowGuide] = useState(false);
  const excelFileInputRef = useRef<HTMLInputElement>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  // States for confirmation & saving progress to prevent duplicates
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveProgress, setSaveProgress] = useState(0);
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);

  // States for delete confirmation
  const [itemToDelete, setItemToDelete] = useState<JadwalIbadah | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const canEdit =
    currentUser?.role === 'admin' || currentUser?.role === 'sekretaris';

  const defaultFormValues: Omit<JadwalIbadah, 'id'> = {
    tanggal: new Date().toISOString().split('T')[0],
    waktu: '09.00 WIB',
    namaIbadah: 'Kebaktian Minggu Pagi Utama',
    kategoriIbadah: 'Umum / Hari Minggu',
    seksi: 'SPB',
    rayon: lingkunganList[0]?.nama || 'Lingkungan I',
    tuanRumah: '',
    tempat: '',
    pelayanFirman: '',
    pengkhotbah: '',
    natsKhotbah: '',
    liturgos: '',
    pembacaanAlkitab: '',
    koordinatorPelayanan: '',
    kolektan: '',
    pemusik: '',
    pemanduLagu: '',
    kantoria: '',
    operatorMultimedia: 'Tim IT, Multimedia & Sound',
    penerimaTamu: '',
    pewartaBerita: '',
    kuponUndian: '',
    wartaKhusus: '',
  };

  const [formData, setFormData] = useState<Omit<JadwalIbadah, 'id'>>(defaultFormValues);

  // Quick Preset Handlers
  const applyPreset = (type: 'minggu_pagi' | 'minggu_sore' | 'spb' | 'spper' | 'sppr' | 'ashm' | 'rayon') => {
    const today = new Date().toISOString().split('T')[0];
    switch (type) {
      case 'minggu_pagi':
        setFormData({
          ...formData,
          tanggal: today,
          waktu: '07.00 WIB',
          namaIbadah: 'Kebaktian Minggu Pagi I',
          kategoriIbadah: 'Umum / Hari Minggu',
          seksi: '',
          rayon: '',
          tuanRumah: '',
          tempat: '',
          pelayanFirman: '',
          pengkhotbah: '',
          natsKhotbah: '',
          liturgos: '',
          pembacaanAlkitab: '',
          pemusik: '',
          pemanduLagu: '',
          kantoria: '',
        });
        break;
      case 'minggu_sore':
        setFormData({
          ...formData,
          tanggal: today,
          waktu: '17.00 WIB',
          namaIbadah: 'Kebaktian Minggu Sore II',
          kategoriIbadah: 'Umum / Hari Minggu',
          seksi: '',
          rayon: '',
          tuanRumah: '',
          tempat: '',
          pelayanFirman: '',
          pengkhotbah: '',
          natsKhotbah: '',
          liturgos: '',
          pembacaanAlkitab: '',
          pemusik: '',
          pemanduLagu: '',
          kantoria: '',
        });
        break;
      case 'spb':
        setFormData({
          ...formData,
          tanggal: today,
          waktu: '19.00 WIB',
          namaIbadah: 'Kebaktian Seksi Pelayanan Bapak (SPB)',
          kategoriIbadah: 'Kategorial',
          seksi: 'SPB',
          rayon: lingkunganList[0]?.nama || 'Lingkungan I',
          tuanRumah: '',
          tempat: '',
          pelayanFirman: '',
          pengkhotbah: '',
          natsKhotbah: '',
          liturgos: '',
          pembacaanAlkitab: '',
          pemusik: '',
          pemanduLagu: '',
          kantoria: '',
        });
        break;
      case 'spper':
        setFormData({
          ...formData,
          tanggal: today,
          waktu: '16.00 WIB',
          namaIbadah: 'Kebaktian Seksi Pelayanan Perempuan (SPPer)',
          kategoriIbadah: 'Kategorial',
          seksi: 'SPPer',
          rayon: lingkunganList[0]?.nama || 'Lingkungan I',
          tuanRumah: '',
          tempat: '',
          pelayanFirman: '',
          pengkhotbah: '',
          natsKhotbah: '',
          liturgos: '',
          pembacaanAlkitab: '',
          pemusik: '',
          pemanduLagu: '',
          kantoria: '',
        });
        break;
      case 'sppr':
        setFormData({
          ...formData,
          tanggal: today,
          waktu: '18.30 WIB',
          namaIbadah: 'Kebaktian Seksi Pelayanan Pemuda & Remaja (SPPR/P)',
          kategoriIbadah: 'Kategorial',
          seksi: 'SPPR/P',
          rayon: lingkunganList[0]?.nama || 'Lingkungan I',
          tuanRumah: '',
          tempat: '',
          pelayanFirman: '',
          pengkhotbah: '',
          natsKhotbah: '',
          liturgos: '',
          pembacaanAlkitab: '',
          pemusik: '',
          pemanduLagu: '',
          kantoria: '',
        });
        break;
      case 'ashm':
        setFormData({
          ...formData,
          tanggal: today,
          waktu: '08.00 WIB',
          namaIbadah: 'Ibadah Anak Sekolah Hari Minggu (ASHM)',
          kategoriIbadah: 'Kategorial',
          seksi: 'ASHM',
          rayon: '',
          tuanRumah: '',
          tempat: '',
          pelayanFirman: '',
          pengkhotbah: '',
          natsKhotbah: '',
          liturgos: '',
          pembacaanAlkitab: '',
          pemusik: '',
          pemanduLagu: '',
          kantoria: '',
        });
        break;
      case 'rayon':
        setFormData({
          ...formData,
          tanggal: today,
          waktu: '19.00 WIB',
          namaIbadah: 'Ibadah Rumah Tangga / Kebaktian Rayon',
          kategoriIbadah: 'Rayon / Lingkungan',
          seksi: '',
          rayon: lingkunganList[0]?.nama || 'Lingkungan I',
          tuanRumah: '',
          tempat: '',
          pelayanFirman: '',
          pengkhotbah: '',
          natsKhotbah: '',
          liturgos: '',
          pembacaanAlkitab: '',
          pemusik: '',
          pemanduLagu: '',
          kantoria: '',
        });
        break;
    }
  };

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormData(defaultFormValues);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: JadwalIbadah) => {
    setEditingItem(item);
    setFormData({
      tanggal: item.tanggal || new Date().toISOString().split('T')[0],
      waktu: item.waktu || '09.00 WIB',
      namaIbadah: item.namaIbadah || '',
      kategoriIbadah: item.kategoriIbadah || 'Umum / Hari Minggu',
      seksi: item.seksi || 'SPB',
      rayon: item.rayon || lingkunganList[0]?.nama || '',
      tuanRumah: item.tuanRumah || '',
      tempat: item.tempat || '',
      pelayanFirman: item.pelayanFirman || item.pengkhotbah || '',
      pengkhotbah: item.pelayanFirman || item.pengkhotbah || '',
      natsKhotbah: item.natsKhotbah || item.pembacaanAlkitab || '',
      koordinatorPelayanan: item.koordinatorPelayanan || '',
      kuponUndian: item.kuponUndian || '',
      liturgos: item.liturgos || '',
      pemusik: item.pemusik || '',
      pewartaBerita: item.pewartaBerita || '',
      pemanduLagu: item.pemanduLagu || item.kantoria || '',
      kantoria: item.pemanduLagu || item.kantoria || '',
      operatorMultimedia: item.operatorMultimedia || '',
      kolektan: item.kolektan || '',
      penerimaTamu: item.penerimaTamu || '',
      pembacaanAlkitab: item.pembacaanAlkitab || '',
      wartaKhusus: item.wartaKhusus || item.keteranganKhusus || '',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Check for potential duplicates (same date, same time, same name/place)
    const normalizedNama = formData.namaIbadah?.trim().toLowerCase();
    const normalizedTanggal = formData.tanggal?.trim();
    const normalizedWaktu = formData.waktu?.trim().toLowerCase();

    const existingDuplicate = jadwalIbadahList.find((item) => {
      if (editingItem && item.id === editingItem.id) return false;
      const isSameDate = item.tanggal?.trim() === normalizedTanggal;
      const isSameTime = item.waktu?.trim().toLowerCase() === normalizedWaktu;
      const isSameName = Boolean(normalizedNama && item.namaIbadah?.trim().toLowerCase() === normalizedNama);
      const isSameTempat =
        Boolean(formData.tempat?.trim()) &&
        (item.tempat || '').trim().toLowerCase() === (formData.tempat || '').trim().toLowerCase();
      return isSameDate && isSameTime && (isSameName || isSameTempat);
    });

    if (existingDuplicate) {
      setDuplicateWarning(
        `Perhatian: Sudah terdapat jadwal "${existingDuplicate.namaIbadah}" pada tanggal ${existingDuplicate.tanggal} pukul ${existingDuplicate.waktu} (${existingDuplicate.tempat || 'Tempat belum diisi'}).`
      );
    } else {
      setDuplicateWarning(null);
    }

    setIsConfirmModalOpen(true);
  };

  const handleExecuteSave = async () => {
    if (isSaving) return;
    setIsSaving(true);
    setSaveProgress(15);

    const dataToSave: Omit<JadwalIbadah, 'id'> = {
      tanggal: formData.tanggal || new Date().toISOString().split('T')[0],
      waktu: formData.waktu || '09.00 WIB',
      namaIbadah: formData.namaIbadah || '',
      kategoriIbadah: formData.kategoriIbadah || 'Umum / Hari Minggu',
      seksi: formData.seksi || '',
      rayon: formData.rayon || '',
      tuanRumah: formData.tuanRumah || '',
      tempat: formData.tempat || '',
      pelayanFirman: formData.pelayanFirman || '',
      pengkhotbah: formData.pelayanFirman || '',
      natsKhotbah: formData.natsKhotbah || '',
      liturgos: formData.liturgos || '',
      pembacaanAlkitab: formData.pembacaanAlkitab || '',
      koordinatorPelayanan: formData.koordinatorPelayanan || '',
      pemusik: formData.pemusik || '',
      pemanduLagu: formData.pemanduLagu || '',
      kantoria: formData.pemanduLagu || '',
      operatorMultimedia: formData.operatorMultimedia || '',
      kolektan: formData.kolektan || '',
      penerimaTamu: formData.penerimaTamu || '',
      pewartaBerita: formData.pewartaBerita || '',
      kuponUndian: formData.kuponUndian || '',
      wartaKhusus: formData.wartaKhusus || '',
      keteranganKhusus: formData.wartaKhusus || '',
    };

    try {
      setSaveProgress(45);
      if (editingItem) {
        await updateJadwalIbadah(editingItem.id, dataToSave);
      } else {
        await addJadwalIbadah(dataToSave);
      }
      setSaveProgress(85);

      // Brief animation for visual feedback & duplicate-click prevention
      setTimeout(() => {
        setSaveProgress(100);
        setTimeout(() => {
          setIsSaving(false);
          setSaveProgress(0);
          setIsConfirmModalOpen(false);
          setIsModalOpen(false);
        }, 350);
      }, 300);
    } catch (err) {
      console.error('Gagal menyimpan jadwal ibadah:', err);
      setIsSaving(false);
      setSaveProgress(0);
    }
  };

  const handleRequestDelete = (item: JadwalIbadah) => {
    setItemToDelete(item);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete || isDeleting) return;
    setIsDeleting(true);
    try {
      await deleteJadwalIbadah(itemToDelete.id);
      setIsDeleteModalOpen(false);
      setItemToDelete(null);
    } catch (err) {
      console.error('Gagal menghapus jadwal ibadah:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  // Helper to parse dates from various formats in Excel
  const parseExcelDate = (val: any): string => {
    if (!val) return new Date().toISOString().split('T')[0];
    if (val instanceof Date && !isNaN(val.getTime())) {
      return val.toISOString().split('T')[0];
    }
    if (typeof val === 'number') {
      const date = new Date(Math.round((val - 25569) * 86400 * 1000));
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0];
      }
    }
    const str = String(val).trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
    const dmyMatch = str.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})/);
    if (dmyMatch) {
      const day = dmyMatch[1].padStart(2, '0');
      const month = dmyMatch[2].padStart(2, '0');
      const year = dmyMatch[3];
      return `${year}-${month}-${day}`;
    }
    return str || new Date().toISOString().split('T')[0];
  };

  // Helper to parse times
  const parseExcelTime = (val: any): string => {
    if (!val) return '09.00 WIB';
    if (val instanceof Date && !isNaN(val.getTime())) {
      const h = String(val.getHours()).padStart(2, '0');
      const m = String(val.getMinutes()).padStart(2, '0');
      return `${h}.${m} WIB`;
    }
    if (typeof val === 'number' && val >= 0 && val < 1) {
      const totalMinutes = Math.round(val * 24 * 60);
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;
      return `${String(hours).padStart(2, '0')}.${String(minutes).padStart(2, '0')} WIB`;
    }
    let str = String(val).trim();
    if (/^\d{1,2}:\d{2}/.test(str)) {
      str = str.replace(':', '.');
    }
    if (/^\d{1,2}\.\d{2}$/.test(str)) {
      str = `${str} WIB`;
    }
    return str || '09.00 WIB';
  };

  // Download official Excel template with sample rows
  const handleDownloadTemplate = async () => {
    try {
      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'Sistem Informasi Majelis Jemaat GKE';
      const worksheet = workbook.addWorksheet('Template Jadwal Ibadah');

      worksheet.columns = [
        { header: 'Tanggal', key: 'tanggal', width: 14 },
        { header: 'Waktu', key: 'waktu', width: 14 },
        { header: 'Nama Ibadah', key: 'namaIbadah', width: 34 },
        { header: 'Kategori Ibadah', key: 'kategoriIbadah', width: 22 },
        { header: 'Seksi', key: 'seksi', width: 12 },
        { header: 'Rayon / Lingkungan', key: 'rayon', width: 22 },
        { header: 'Tempat', key: 'tempat', width: 26 },
        { header: 'Tuan Rumah', key: 'tuanRumah', width: 22 },
        { header: 'Pelayan Firman / Pengkhotbah', key: 'pelayanFirman', width: 28 },
        { header: 'Nats / Tema Khotbah', key: 'natsKhotbah', width: 24 },
        { header: 'Liturgos', key: 'liturgos', width: 24 },
        { header: 'Pembacaan Alkitab', key: 'pembacaanAlkitab', width: 24 },
        { header: 'Pemusik / Organis', key: 'pemusik', width: 24 },
        { header: 'Pemandu Lagu / Singer', key: 'pemanduLagu', width: 26 },
        { header: 'Kolektan', key: 'kolektan', width: 24 },
        { header: 'Sound & Multimedia', key: 'operatorMultimedia', width: 24 },
        { header: 'Penerima Tamu', key: 'penerimaTamu', width: 24 },
        { header: 'Pewarta Berita', key: 'pewartaBerita', width: 22 },
        { header: 'Koordinator Pelayanan', key: 'koordinatorPelayanan', width: 24 },
        { header: 'Kupon Undian', key: 'kuponUndian', width: 16 },
        { header: 'Warta Khusus / Catatan', key: 'wartaKhusus', width: 30 },
      ];

      const headerRow = worksheet.getRow(1);
      headerRow.height = 28;
      headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 10 };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF1E293B' },
      };
      headerRow.alignment = { vertical: 'middle', horizontal: 'center' };

      // Sample Row 1: Kebaktian Minggu Pagi
      worksheet.addRow({
        tanggal: '2026-08-23',
        waktu: '09.00 WIB',
        namaIbadah: 'Kebaktian Minggu Pagi Utama',
        kategoriIbadah: 'Umum / Hari Minggu',
        seksi: '',
        rayon: '',
        tempat: 'Gedung Gereja Utama',
        tuanRumah: '',
        pelayanFirman: 'Pdt. Yohanes, M.Th',
        natsKhotbah: 'Yohanes 3:16-21',
        liturgos: 'Pnt. Maria Kristina',
        pembacaanAlkitab: 'Mazmur 23:1-6',
        pemusik: 'Sdri. Ester (Organis)',
        pemanduLagu: 'Sdri. Sarah & Bpk. Lukas',
        kolektan: 'Dkn. Timotius & Dkn. Ruth',
        operatorMultimedia: 'Tim IT & Multimedia',
        penerimaTamu: 'Seksi Penyambut Jemaat',
        pewartaBerita: 'Pnt. Stefanus',
        koordinatorPelayanan: 'Pnt. Samuel',
        kuponUndian: '',
        wartaKhusus: 'Perjamuan Kudus Triwulan III',
      });

      // Sample Row 2: Ibadah Seksi SPB
      worksheet.addRow({
        tanggal: '2026-08-25',
        waktu: '19.00 WIB',
        namaIbadah: 'Kebaktian Seksi Pelayanan Bapak (SPB)',
        kategoriIbadah: 'Kategorial',
        seksi: 'SPB',
        rayon: 'Lingkungan I',
        tempat: 'Rumah Kel. Bpk. Antonius',
        tuanRumah: 'Kel. Bpk. Antonius',
        pelayanFirman: 'Pnt. Markus, S.Pd',
        natsKhotbah: 'Mazmur 1:1-6',
        liturgos: 'Bpk. Hendra Wijaya',
        pembacaanAlkitab: 'Amsal 3:1-8',
        pemusik: 'Sdr. Daniel',
        pemanduLagu: 'Bpk. Robby',
        kolektan: 'Bpk. Yulius',
        operatorMultimedia: 'Tim Sound SPB',
        penerimaTamu: 'Pengurus SPB Rayon 1',
        pewartaBerita: 'Sekretaris SPB',
        koordinatorPelayanan: 'Ketua SPB',
        kuponUndian: 'Doorprize Kehadiran',
        wartaKhusus: 'Pembahasan Program Kerja Bakti',
      });

      // Sample Row 3: Ibadah Seksi SPPer
      worksheet.addRow({
        tanggal: '2026-08-26',
        waktu: '16.30 WIB',
        namaIbadah: 'Kebaktian Seksi Pelayanan Perempuan (SPPer)',
        kategoriIbadah: 'Kategorial',
        seksi: 'SPPer',
        rayon: 'Lingkungan II',
        tempat: 'Rumah Kel. Ibu Susana',
        tuanRumah: 'Kel. Ibu Susana',
        pelayanFirman: 'Pdt. Mariana, S.Th',
        natsKhotbah: 'Rut 1:16-18',
        liturgos: 'Ibu Debora',
        pembacaanAlkitab: 'Lukas 10:38-42',
        pemusik: 'Sdri. Cindy',
        pemanduLagu: 'Ibu Martha',
        kolektan: 'Ibu Hanna',
        operatorMultimedia: 'Tim IT',
        penerimaTamu: 'Pengurus SPPer',
        pewartaBerita: 'Sekretaris SPPer',
        koordinatorPelayanan: 'Ketua SPPer',
        kuponUndian: '',
        wartaKhusus: 'Pemeriksaan Kesehatan Gratis Setelah Ibadah',
      });

      // Sample Row 4: Ibadah Rayon / Lingkungan
      worksheet.addRow({
        tanggal: '2026-08-27',
        waktu: '19.00 WIB',
        namaIbadah: 'Ibadah Rumah Tangga Rayon II',
        kategoriIbadah: 'Rayon / Lingkungan',
        seksi: '',
        rayon: 'Lingkungan II',
        tempat: 'Rumah Kel. Bpk. David',
        tuanRumah: 'Kel. Bpk. David S.',
        pelayanFirman: 'Dkn. Elizabeth',
        natsKhotbah: 'Filipi 4:4-9',
        liturgos: 'Pnt. Robert',
        pembacaanAlkitab: '1 Tesalonika 5:16-18',
        pemusik: 'Gitaris Rayon II',
        pemanduLagu: 'Ibu Marta & Ibu Debora',
        kolektan: 'Dkn. Andreas',
        operatorMultimedia: '',
        penerimaTamu: 'Pengurus Rayon II',
        pewartaBerita: 'Koordinator Rayon II',
        koordinatorPelayanan: 'Pnt. Robert',
        kuponUndian: '',
        wartaKhusus: 'Mendoakan jemaat yang sedang sakit',
      });

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'Template_Import_Jadwal_Ibadah_GKE.xlsx';
      link.click();
      URL.revokeObjectURL(url);
      showToast('Template Excel berhasil diunduh! Silakan isi dan unggah file Anda.');
    } catch (err) {
      console.error('Failed to download template:', err);
      showToast('Gagal mengunduh template Excel.');
    }
  };

  // Export current schedule data to Excel
  const handleExportExcel = async () => {
    try {
      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'Sistem Informasi Majelis Jemaat GKE';
      workbook.created = new Date();
      const worksheet = workbook.addWorksheet('Jadwal Ibadah');

      worksheet.columns = [
        { header: 'No', key: 'no', width: 6 },
        { header: 'Tanggal', key: 'tanggal', width: 14 },
        { header: 'Waktu', key: 'waktu', width: 14 },
        { header: 'Nama Ibadah', key: 'namaIbadah', width: 34 },
        { header: 'Kategori', key: 'kategoriIbadah', width: 22 },
        { header: 'Seksi', key: 'seksi', width: 12 },
        { header: 'Rayon / Lingkungan', key: 'rayon', width: 22 },
        { header: 'Tempat', key: 'tempat', width: 28 },
        { header: 'Tuan Rumah', key: 'tuanRumah', width: 24 },
        { header: 'Pelayan Firman / Pengkhotbah', key: 'pelayanFirman', width: 30 },
        { header: 'Nats / Tema Khotbah', key: 'natsKhotbah', width: 26 },
        { header: 'Liturgos', key: 'liturgos', width: 24 },
        { header: 'Pembacaan Alkitab', key: 'pembacaanAlkitab', width: 24 },
        { header: 'Pemusik / Organis', key: 'pemusik', width: 24 },
        { header: 'Pemandu Lagu / Singer', key: 'pemanduLagu', width: 26 },
        { header: 'Kolektan', key: 'kolektan', width: 24 },
        { header: 'Sound & Multimedia', key: 'operatorMultimedia', width: 24 },
        { header: 'Penerima Tamu', key: 'penerimaTamu', width: 24 },
        { header: 'Pewarta Berita', key: 'pewartaBerita', width: 22 },
        { header: 'Koordinator Pelayanan', key: 'koordinatorPelayanan', width: 24 },
        { header: 'Kupon Undian', key: 'kuponUndian', width: 16 },
        { header: 'Warta Khusus / Catatan', key: 'wartaKhusus', width: 32 },
      ];

      const headerRow = worksheet.getRow(1);
      headerRow.height = 28;
      headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 10 };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF1E293B' },
      };
      headerRow.alignment = { vertical: 'middle', horizontal: 'center' };

      const dataToExport = filteredList.length > 0 ? filteredList : jadwalIbadahList;
      dataToExport.forEach((item, index) => {
        worksheet.addRow({
          no: index + 1,
          tanggal: item.tanggal,
          waktu: item.waktu,
          namaIbadah: item.namaIbadah,
          kategoriIbadah: item.kategoriIbadah || 'Umum / Hari Minggu',
          seksi: item.seksi || '-',
          rayon: item.rayon || '-',
          tempat: item.tempat || '-',
          tuanRumah: item.tuanRumah || '-',
          pelayanFirman: item.pelayanFirman || item.pengkhotbah || '-',
          natsKhotbah: item.natsKhotbah || '-',
          liturgos: item.liturgos || '-',
          pembacaanAlkitab: item.pembacaanAlkitab || '-',
          pemusik: item.pemusik || '-',
          pemanduLagu: item.pemanduLagu || item.kantoria || '-',
          kolektan: item.kolektan || '-',
          operatorMultimedia: item.operatorMultimedia || '-',
          penerimaTamu: item.penerimaTamu || '-',
          pewartaBerita: item.pewartaBerita || '-',
          koordinatorPelayanan: item.koordinatorPelayanan || '-',
          kuponUndian: item.kuponUndian || '-',
          wartaKhusus: item.wartaKhusus || item.keteranganKhusus || '-',
        });
      });

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Jadwal_Ibadah_Pelayan_Firman_${new Date().toISOString().split('T')[0]}.xlsx`;
      link.click();
      URL.revokeObjectURL(url);
      showToast(`Berhasil mengekspor ${dataToExport.length} data jadwal ke Excel!`);
    } catch (err) {
      console.error('Failed to export Excel:', err);
      showToast('Gagal mengekspor data ke Excel.');
    }
  };

  // Helper to get Indonesian day name
  const getIndonesianDayName = (dateStr?: string): string => {
    if (!dateStr) return '';
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
        const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
        return days[d.getDay()] || '';
      }
      const d = new Date(dateStr);
      if (!isNaN(d.getTime())) {
        const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
        return days[d.getDay()] || '';
      }
    } catch {
      return '';
    }
    return '';
  };

  // Helper to format date in Indonesian standard
  const formatIndonesianDateFull = (dateStr?: string): string => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    const year = parts[0];
    const monthIdx = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    const months = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    return `${day} ${months[monthIdx] || ''} ${year}`;
  };

  // Export schedule to CSV format (.csv)
  const handleExportCSV = () => {
    try {
      setIsExportingCsv(true);
      const dataToExport = filteredList.length > 0 ? filteredList : jadwalIbadahList;
      if (dataToExport.length === 0) {
        showToast('Tidak ada data jadwal ibadah untuk diekspor ke CSV.');
        setIsExportingCsv(false);
        return;
      }

      const csvData = dataToExport.map((item, index) => ({
        'No': index + 1,
        'Hari': getIndonesianDayName(item.tanggal),
        'Tanggal': item.tanggal || '',
        'Waktu': item.waktu || '',
        'Nama Ibadah': item.namaIbadah || '',
        'Kategori Ibadah': item.kategoriIbadah || 'Umum / Hari Minggu',
        'Seksi Kategorial': item.seksi || '-',
        'Rayon / Lingkungan': item.rayon || '-',
        'Tempat Ibadah': item.tempat || '-',
        'Tuan Rumah': item.tuanRumah || '-',
        'Pelayan Firman / Pengkhotbah': item.pelayanFirman || item.pengkhotbah || '-',
        'Nats / Tema Khotbah': item.natsKhotbah || '-',
        'Liturgos': item.liturgos || '-',
        'Pembacaan Alkitab': item.pembacaanAlkitab || '-',
        'Pemusik / Organis': item.pemusik || '-',
        'Pemandu Lagu / Singer': item.pemanduLagu || item.kantoria || '-',
        'Kolektan': item.kolektan || '-',
        'Sound & Multimedia': item.operatorMultimedia || '-',
        'Penerima Tamu': item.penerimaTamu || '-',
        'Pewarta Berita': item.pewartaBerita || '-',
        'Koordinator Pelayanan': item.koordinatorPelayanan || '-',
        'Kupon Undian': item.kuponUndian || '-',
        'Warta Khusus / Catatan': item.wartaKhusus || item.keteranganKhusus || '-',
      }));

      const csvString = Papa.unparse(csvData, {
        quotes: true,
        header: true,
      });

      // Add UTF-8 BOM so Excel opens with proper Indonesian accents and characters
      const blob = new Blob(['\uFEFF' + csvString], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const dateStamp = new Date().toISOString().split('T')[0];
      link.download = `Jadwal_Ibadah_Pelayan_Firman_${dateStamp}.csv`;
      link.click();
      URL.revokeObjectURL(url);

      showToast(`Berhasil mengekspor ${dataToExport.length} data jadwal ke format CSV!`);
    } catch (err) {
      console.error('Failed to export CSV:', err);
      showToast('Gagal mengekspor data ke format CSV.');
    } finally {
      setIsExportingCsv(false);
    }
  };

  // Export schedule directly to PDF format (.pdf)
  const handleExportPDF = async () => {
    if (isExportingPdf) return;
    const dataToExport = filteredList.length > 0 ? filteredList : jadwalIbadahList;
    if (dataToExport.length === 0) {
      showToast('Tidak ada data jadwal ibadah untuk diekspor ke PDF.');
      return;
    }

    setIsExportingPdf(true);
    try {
      const element = pdfContainerRef.current;
      if (!element) {
        throw new Error('Elemen container PDF tidak ditemukan');
      }

      const dateStamp = new Date().toISOString().split('T')[0];
      const fileName = `Jadwal_Ibadah_GKE_${dateStamp}.pdf`;

      const opt = {
        margin: [6, 6, 6, 6] as [number, number, number, number],
        filename: fileName,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          logging: false,
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' as const },
      };

      // @ts-ignore
      const html2pdfModule = (await import('html2pdf.js')).default;
      if (typeof html2pdfModule === 'function') {
        const worker = html2pdfModule().set(opt).from(element);
        const pdfBlob = await worker.output('blob');

        const file = new File([pdfBlob], fileName, { type: 'application/pdf' });
        if (typeof navigator !== 'undefined' && navigator.canShare && navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({
              files: [file],
              title: `Jadwal Ibadah GKE - ${dateStamp}`,
              text: 'Jadwal Ibadah & Petugas Pelayanan Liturgis Majelis Jemaat GKE',
            });
            showToast('Dokumen PDF berhasil dibagikan!');
            setIsExportingPdf(false);
            return;
          } catch (shareErr: any) {
            if (shareErr?.name === 'AbortError') {
              setIsExportingPdf(false);
              return;
            }
          }
        }

        const url = URL.createObjectURL(pdfBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        showToast(`Berhasil mengunduh dokumen PDF jadwal ibadah (${dataToExport.length} jadwal)!`);
      } else {
        openPrintReport({
          reportType: 'jadwal_ibadah',
          startDate: startDate || undefined,
          endDate: endDate || undefined,
        });
      }
    } catch (err) {
      console.error('Failed to export PDF directly:', err);
      showToast('Gagal membuat PDF langsung. Membuka dialog cetak laporan resmi...');
      openPrintReport({
        reportType: 'jadwal_ibadah',
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });
    } finally {
      setIsExportingPdf(false);
    }
  };

  // Generate formatted WhatsApp announcement text
  const getWhatsAppScheduleText = (): string => {
    const dataToShare = filteredList.length > 0 ? filteredList : jadwalIbadahList;
    const churchName = settings.namaGereja || 'GEREJA KALIMANTAN EVANGELIS (GKE)';
    const periodText = startDate && endDate
      ? `Periode: ${formatIndonesianDateFull(startDate)} s/d ${formatIndonesianDateFull(endDate)}`
      : startDate
      ? `Mulai Tanggal: ${formatIndonesianDateFull(startDate)}`
      : `Daftar Lengkap Jadwal Ibadah (${dataToShare.length} Kegiatan)`;

    let text = `🕊️ *WARTA & JADWAL PELAYANAN IBADAH*\n*${churchName.toUpperCase()}*\n_${periodText}_\n\n`;
    text += `Shalom Bapak/Ibu/Saudara(i) warga jemaat yang terkasih dalam Tuhan Yesus Kristus. Berikut warta jadwal ibadah dan penugasan pelayan liturgis:\n\n`;

    dataToShare.forEach((item, index) => {
      const day = getIndonesianDayName(item.tanggal);
      const dateFormatted = formatIndonesianDateFull(item.tanggal);
      const dateLine = day ? `${day}, ${dateFormatted}` : (dateFormatted || item.tanggal);

      text += `━━━━━━━━━━━━━━━━━━━━━\n`;
      text += `📌 *${index + 1}. ${item.namaIbadah?.toUpperCase() || 'IBADAH JEMAAT'}*\n`;
      if (item.kategoriIbadah) {
        text += `🏷️ Kategori: ${item.kategoriIbadah}${item.seksi ? ` (${item.seksi})` : ''}${item.rayon ? ` (${item.rayon})` : ''}\n`;
      }
      text += `📅 Waktu: ${dateLine} | Pukul ${item.waktu || '09.00 WIB'}\n`;
      text += `🏛️ Tempat: ${item.tempat || 'Gedung Gereja'}${item.tuanRumah ? ` (Kel. ${item.tuanRumah})` : ''}\n`;
      text += `📖 Pelayan Firman: *${item.pelayanFirman || item.pengkhotbah || '-'}*\n`;
      if (item.natsKhotbah) text += `📜 Nats Khotbah: ${item.natsKhotbah}\n`;
      if (item.liturgos) text += `🎙️ Liturgos: ${item.liturgos}\n`;
      if (item.pembacaanAlkitab) text += `📕 Pembacaan Alkitab: ${item.pembacaanAlkitab}\n`;
      if (item.pemusik || item.pemanduLagu) {
        text += `🎵 Musik/Singer: ${item.pemusik || '-'} / ${item.pemanduLagu || item.kantoria || '-'}\n`;
      }
      if (item.kolektan) text += `🤝 Kolektan: ${item.kolektan}\n`;
      if (item.operatorMultimedia) text += `💻 Multimedia/Sound: ${item.operatorMultimedia}\n`;
      if (item.wartaKhusus || item.keteranganKhusus) {
        text += `ℹ️ Catatan/Warta: _${item.wartaKhusus || item.keteranganKhusus}_\n`;
      }
      text += `\n`;
    });

    text += `━━━━━━━━━━━━━━━━━━━━━\n`;
    text += `_Tuhan Yesus memberkati seluruh persiapan dan kehadiran kita dalam beribadah memuji nama-Nya._ 🙏✨\n\n`;
    text += `*Majelis Pekerja Harian Jemaat (MPH) GKE*`;

    return text;
  };

  const handleCopyWhatsAppText = async () => {
    try {
      const text = getWhatsAppScheduleText();
      await navigator.clipboard.writeText(text);
      setCopiedWaText(true);
      showToast('Format teks jadwal berhasil disalin! Siap ditempel di grup WhatsApp.');
      setTimeout(() => setCopiedWaText(false), 3000);
    } catch {
      showToast('Gagal menyalin teks secara otomatis.');
    }
  };

  const handleOpenWhatsAppDirect = () => {
    const text = getWhatsAppScheduleText();
    const encoded = encodeURIComponent(text);
    window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank');
  };

  // Process uploaded Excel / CSV file
  const processUploadedFile = async (file: File) => {
    setIsParsingExcel(true);
    setExcelFile(file);

    try {
      let rawRows: any[] = [];
      const extension = file.name.split('.').pop()?.toLowerCase();

      if (extension === 'csv') {
        await new Promise<void>((resolve, reject) => {
          Papa.parse(file, {
            header: true,
            skipEmptyLines: 'greedy',
            complete: (results) => {
              rawRows = results.data;
              resolve();
            },
            error: (err) => reject(err),
          });
        });
      } else {
        const buffer = await file.arrayBuffer();
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(buffer);
        const worksheet = workbook.worksheets[0];

        if (worksheet) {
          const headers: string[] = [];
          const headerRow = worksheet.getRow(1);
          headerRow.eachCell((cell, colNumber) => {
            headers[colNumber] = String(cell.value || '').trim();
          });

          worksheet.eachRow((row, rowNumber) => {
            if (rowNumber === 1) return; // Skip header
            const rowData: Record<string, any> = {};
            let hasAnyValue = false;

            row.eachCell((cell, colNumber) => {
              const header = headers[colNumber] || `col_${colNumber}`;
              let val = cell.value;
              if (val && typeof val === 'object' && 'result' in val) {
                val = (val as any).result;
              } else if (val && typeof val === 'object' && 'text' in val) {
                val = (val as any).text;
              }
              if (val !== undefined && val !== null && String(val).trim() !== '') {
                hasAnyValue = true;
              }
              rowData[header] = val;
            });

            if (hasAnyValue) {
              rawRows.push(rowData);
            }
          });
        }
      }

      if (rawRows.length === 0) {
        showToast('File tidak memiliki baris data atau kosong.');
        setParsedExcelRows([]);
        setIsParsingExcel(false);
        return;
      }

      // Map rows with fuzzy matching
      const mappedRows: ParsedJadwalExcelItem[] = rawRows.map((row, index) => {
        const getVal = (keys: string[]): string => {
          for (const k of keys) {
            const cleanTarget = k.toLowerCase().replace(/[^a-z0-9]/g, '');
            const matchedKey = Object.keys(row).find((rk) => {
              const cleanRowKey = rk.toLowerCase().replace(/[^a-z0-9]/g, '');
              return cleanRowKey.includes(cleanTarget) || cleanTarget.includes(cleanRowKey);
            });
            if (
              matchedKey &&
              row[matchedKey] !== undefined &&
              row[matchedKey] !== null &&
              String(row[matchedKey]).trim() !== ''
            ) {
              return String(row[matchedKey]).trim();
            }
          }
          return '';
        };

        const getRawVal = (keys: string[]): any => {
          for (const k of keys) {
            const cleanTarget = k.toLowerCase().replace(/[^a-z0-9]/g, '');
            const matchedKey = Object.keys(row).find((rk) => {
              const cleanRowKey = rk.toLowerCase().replace(/[^a-z0-9]/g, '');
              return cleanRowKey.includes(cleanTarget) || cleanTarget.includes(cleanRowKey);
            });
            if (matchedKey && row[matchedKey] !== undefined && row[matchedKey] !== null) {
              return row[matchedKey];
            }
          }
          return null;
        };

        const rawTanggal = getRawVal(['tanggal', 'tgl', 'date', 'hari']);
        const tanggal = parseExcelDate(rawTanggal);

        const rawWaktu = getRawVal(['waktu', 'jam', 'pukul', 'time']);
        const waktu = parseExcelTime(rawWaktu);

        let namaIbadah = getVal(['namaibadah', 'namakebaktian', 'ibadah', 'kebaktian', 'acara', 'nama', 'event']);
        if (!namaIbadah) {
          namaIbadah = 'Kebaktian Jemaat';
        }

        let rawKategori = getVal(['kategoriibadah', 'kategori', 'jenisibadah', 'jenis', 'category']);
        let seksi = getVal(['seksi', 'kategorial', 'seksikategorial', 'komisi']);
        let rayon = getVal(['rayon', 'lingkungan', 'sektor', 'wilayah']);
        let tempat = getVal(['tempat', 'lokasi', 'gedung', 'alamat', 'location', 'place']);
        let tuanRumah = getVal(['tuanrumah', 'keluarga', 'tuan_rumah', 'host']);

        // Determine category accurately
        let kategoriIbadah: 'Umum / Hari Minggu' | 'Kategorial' | 'Rayon / Lingkungan' | 'Sakramen / Khusus' = 'Umum / Hari Minggu';
        const lowerNama = namaIbadah.toLowerCase();
        const lowerKat = rawKategori.toLowerCase();

        if (
          lowerKat.includes('kategorial') ||
          lowerNama.includes('spb') ||
          lowerNama.includes('spper') ||
          lowerNama.includes('sppr') ||
          lowerNama.includes('ashm') ||
          lowerNama.includes('sekolah minggu') ||
          lowerNama.includes('pemuda') ||
          lowerNama.includes('perempuan') ||
          lowerNama.includes('bapak')
        ) {
          kategoriIbadah = 'Kategorial';
          if (!seksi) {
            if (lowerNama.includes('spb') || lowerNama.includes('bapak')) seksi = 'SPB';
            else if (lowerNama.includes('spper') || lowerNama.includes('perempuan') || lowerNama.includes('wanita')) seksi = 'SPPer';
            else if (lowerNama.includes('sppr') || lowerNama.includes('pemuda') || lowerNama.includes('remaja')) seksi = 'SPPR/P';
            else if (lowerNama.includes('ashm') || lowerNama.includes('sekolah minggu') || lowerNama.includes('anak')) seksi = 'ASHM';
          }
        } else if (
          lowerKat.includes('rayon') ||
          lowerKat.includes('lingkungan') ||
          lowerKat.includes('rt') ||
          lowerNama.includes('rayon') ||
          lowerNama.includes('lingkungan') ||
          lowerNama.includes('rumah tangga') ||
          rayon
        ) {
          kategoriIbadah = 'Rayon / Lingkungan';
          if (!rayon) {
            rayon = lingkunganList[0]?.nama || 'Lingkungan I';
          }
        } else if (
          lowerKat.includes('sakramen') ||
          lowerKat.includes('khusus') ||
          lowerNama.includes('sakramen') ||
          lowerNama.includes('baptis') ||
          lowerNama.includes('sidi') ||
          lowerNama.includes('perjamuan')
        ) {
          kategoriIbadah = 'Sakramen / Khusus';
        }

        if (!tempat) {
          if (kategoriIbadah === 'Umum / Hari Minggu') {
            tempat = 'Gedung Gereja Utama';
          } else if (tuanRumah) {
            tempat = `Rumah ${tuanRumah}`;
          } else {
            tempat = 'Gedung Gereja';
          }
        }

        const pelayanFirman = getVal(['pelayanfirman', 'pengkhotbah', 'khotbah', 'pembicara', 'preacher', 'firman', 'pf']);
        const natsKhotbah = getVal(['natskhotbah', 'nats', 'temakhotbah', 'tema', 'nas', 'bacaanpokok']);
        const liturgos = getVal(['liturgos', 'liturgis', 'pemimpinibadah', 'pemimpin', 'lit']);
        const pembacaanAlkitab = getVal(['pembacaanalkitab', 'bacaanalkitab', 'pembacaan', 'bacaan', 'alkitab', 'ayat']);
        const pemusik = getVal(['pemusik', 'organis', 'keyboard', 'pemainmusik', 'musik', 'music']);
        const pemanduLagu = getVal(['pemandulagu', 'singer', 'kantoria', 'penyanyi', 'vocal', 'pl']);
        const kolektan = getVal(['kolektan', 'persembahan', 'petugassembahan', 'kolekta']);
        const operatorMultimedia = getVal(['operatormultimedia', 'multimedia', 'sound', 'soundsystem', 'it', 'operator']);
        const penerimaTamu = getVal(['penerimatamu', 'penyambut', 'penyambutjemaat', 'usher', 'tamu']);
        const pewartaBerita = getVal(['pewartaberita', 'warta', 'pewarta', 'beritajemaat', 'warta_jemaat']);
        const koordinatorPelayanan = getVal(['koordinatorpelayanan', 'koordinator', 'pj', 'koordinator_pelayanan']);
        const kuponUndian = getVal(['kuponundian', 'kupon', 'undian', 'doorprize']);
        const wartaKhusus = getVal(['wartakhusus', 'keterangankhusus', 'keterangan', 'catatan', 'notes', 'memo']);

        // Check for duplicates with existing data
        const normalizedNama = namaIbadah.toLowerCase().trim();
        const existingDup = jadwalIbadahList.find((existing) => {
          const isSameDate = existing.tanggal?.trim() === tanggal;
          const isSameTime = existing.waktu?.trim().toLowerCase() === waktu.toLowerCase();
          const isSameNama = existing.namaIbadah?.trim().toLowerCase() === normalizedNama;
          const isSameTempat =
            Boolean(tempat) && (existing.tempat || '').trim().toLowerCase() === tempat.toLowerCase();
          return isSameDate && isSameTime && (isSameNama || isSameTempat);
        });

        const isValid = Boolean(tanggal && namaIbadah);
        let errorMsg = '';
        if (!tanggal) errorMsg = 'Tanggal tidak valid';
        else if (!namaIbadah) errorMsg = 'Nama ibadah tidak boleh kosong';

        return {
          idTemp: `import-row-${index + 1}-${Date.now()}`,
          tanggal,
          waktu,
          namaIbadah,
          kategoriIbadah,
          seksi: seksi || undefined,
          rayon: rayon || undefined,
          tempat,
          tuanRumah: tuanRumah || undefined,
          pelayanFirman: pelayanFirman || '',
          natsKhotbah: natsKhotbah || undefined,
          liturgos: liturgos || undefined,
          pembacaanAlkitab: pembacaanAlkitab || undefined,
          pemusik: pemusik || undefined,
          pemanduLagu: pemanduLagu || undefined,
          kolektan: kolektan || undefined,
          operatorMultimedia: operatorMultimedia || undefined,
          penerimaTamu: penerimaTamu || undefined,
          pewartaBerita: pewartaBerita || undefined,
          koordinatorPelayanan: koordinatorPelayanan || undefined,
          kuponUndian: kuponUndian || undefined,
          wartaKhusus: wartaKhusus || undefined,
          isValid,
          isDuplicate: Boolean(existingDup),
          duplicateInfo: existingDup
            ? `Sudah ada di database: "${existingDup.namaIbadah}" (${existingDup.tanggal}, ${existingDup.waktu})`
            : undefined,
          errorMsg: errorMsg || undefined,
        };
      });

      setParsedExcelRows(mappedRows);
      showToast(`Berhasil memindai ${mappedRows.length} data jadwal dari file!`);
    } catch (err: any) {
      console.error('Failed to parse Excel file:', err);
      showToast(`Gagal membaca file: ${err?.message || 'Format tidak valid'}`);
      setParsedExcelRows([]);
    } finally {
      setIsParsingExcel(false);
    }
  };

  // Batch import parsed items to Firestore
  const handleBatchImportExcel = async () => {
    if (parsedExcelRows.length === 0 || isImportingExcel) return;

    const rowsToImport = parsedExcelRows.filter((item) => {
      if (!item.isValid) return false;
      if (skipDuplicates && item.isDuplicate) return false;
      return true;
    });

    if (rowsToImport.length === 0) {
      showToast('Tidak ada baris data valid yang dapat diimpor.');
      return;
    }

    setIsImportingExcel(true);
    setImportProgress({ current: 0, total: rowsToImport.length });

    let successCount = 0;
    try {
      for (let i = 0; i < rowsToImport.length; i++) {
        const row = rowsToImport[i];
        const dataToSave: Omit<JadwalIbadah, 'id'> = {
          tanggal: row.tanggal,
          waktu: row.waktu,
          namaIbadah: row.namaIbadah,
          kategoriIbadah: row.kategoriIbadah as any,
          seksi: row.seksi || '',
          rayon: row.rayon || '',
          tempat: row.tempat || 'Gedung Gereja',
          tuanRumah: row.tuanRumah || '',
          pelayanFirman: row.pelayanFirman || '',
          pengkhotbah: row.pelayanFirman || '',
          natsKhotbah: row.natsKhotbah || '',
          liturgos: row.liturgos || '',
          pembacaanAlkitab: row.pembacaanAlkitab || '',
          koordinatorPelayanan: row.koordinatorPelayanan || '',
          pemusik: row.pemusik || '',
          pemanduLagu: row.pemanduLagu || '',
          kantoria: row.pemanduLagu || '',
          operatorMultimedia: row.operatorMultimedia || '',
          kolektan: row.kolektan || '',
          penerimaTamu: row.penerimaTamu || '',
          pewartaBerita: row.pewartaBerita || '',
          kuponUndian: row.kuponUndian || '',
          wartaKhusus: row.wartaKhusus || '',
          keteranganKhusus: row.wartaKhusus || '',
        };

        await addJadwalIbadah(dataToSave);
        successCount++;
        setImportProgress({ current: i + 1, total: rowsToImport.length });
      }

      showToast(`Sukses! ${successCount} jadwal ibadah berhasil diimpor ke database.`);
      setTimeout(() => {
        setIsExcelModalOpen(false);
        setExcelFile(null);
        setParsedExcelRows([]);
        setIsImportingExcel(false);
        setImportProgress({ current: 0, total: 0 });
      }, 600);
    } catch (err) {
      console.error('Batch import failed:', err);
      showToast(`Impor terhenti setelah ${successCount} baris. Terjadi kesalahan.`);
      setIsImportingExcel(false);
    }
  };

  const filteredImportRows = useMemo(() => {
    return parsedExcelRows.filter((r) => {
      if (importFilterTab === 'valid') return r.isValid && !r.isDuplicate;
      if (importFilterTab === 'duplikat') return r.isDuplicate;
      if (importFilterTab === 'error') return !r.isValid;
      return true;
    });
  }, [parsedExcelRows, importFilterTab]);

  const filteredList = jadwalIbadahList.filter((item) => {
    const q = search.toLowerCase().trim();
    const matchesSearch =
      !q ||
      item.namaIbadah?.toLowerCase().includes(q) ||
      item.pengkhotbah?.toLowerCase().includes(q) ||
      item.pelayanFirman?.toLowerCase().includes(q) ||
      item.liturgos?.toLowerCase().includes(q) ||
      item.pemusik?.toLowerCase().includes(q) ||
      item.tempat?.toLowerCase().includes(q) ||
      item.rayon?.toLowerCase().includes(q) ||
      item.seksi?.toLowerCase().includes(q) ||
      item.tuanRumah?.toLowerCase().includes(q);

    const matchesStart = !startDate || item.tanggal >= startDate;
    const matchesEnd = !endDate || item.tanggal <= endDate;

    const matchesCategory =
      categoryFilter === 'semua'
        ? true
        : categoryFilter === 'umum'
        ? !item.kategoriIbadah || item.kategoriIbadah === 'Umum / Hari Minggu'
        : categoryFilter === 'kategorial'
        ? (item.kategoriIbadah === 'Kategorial' || (!item.kategoriIbadah && !!item.seksi)) && item.kategoriIbadah !== 'Rayon / Lingkungan'
        : item.kategoriIbadah === 'Rayon / Lingkungan';

    return matchesSearch && matchesStart && matchesEnd && matchesCategory;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800/80 shadow-lg backdrop-blur-md flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Calendar className="w-5 h-5" />
            </div>
            Manajemen Jadwal Ibadah &amp; Pelayan Firman
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Penjadwalan Terintegrasi Kebaktian Minggu, Seksi Kategorial (SPB, SPPer, SPPR/P, ASHM), Ibadah Rayon / Lingkungan &amp; Liturgis
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {canEdit && (
            <>
              <button
                onClick={handleOpenAdd}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-3.5 py-2.5 rounded-xl transition-all shadow-md shadow-indigo-600/30 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Input Jadwal</span>
              </button>

              <button
                onClick={() => {
                  setExcelFile(null);
                  setParsedExcelRows([]);
                  setIsExcelModalOpen(true);
                }}
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3.5 py-2.5 rounded-xl transition-all shadow-md shadow-emerald-600/30 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
                title="Impor jadwal ibadah secara massal dari file Excel (.xlsx) atau CSV"
              >
                <FileSpreadsheet className="w-4 h-4 text-white" />
                <span>Import Excel</span>
              </button>

              <button
                onClick={() => setIsGeneratorModalOpen(true)}
                className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold px-3.5 py-2.5 rounded-xl transition-all shadow-md shadow-purple-600/30 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
                title="Generate dan acak jadwal ibadah otomatis per tahun pelayanan setiap hari Sabtu (atau hari pilihan) menggunakan data liturgi dan Kepengurusan Penatua & Diakon"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>Acak Jadwal Tahunan</span>
              </button>
            </>
          )}

          {/* Export to PDF Button */}
          <button
            onClick={handleExportPDF}
            disabled={isExportingPdf}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-rose-300 text-xs font-semibold px-3.5 py-2.5 rounded-xl transition-all border border-rose-500/30 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer disabled:opacity-50"
            title="Ekspor dokumen PDF jadwal ibadah siap dibagikan kepada warga jemaat"
          >
            {isExportingPdf ? (
              <Loader2 className="w-4 h-4 text-rose-400 animate-spin" />
            ) : (
              <FileDown className="w-4 h-4 text-rose-400" />
            )}
            <span>{isExportingPdf ? 'Membuat PDF...' : 'Ekspor PDF'}</span>
          </button>

          {/* Export to CSV Button */}
          <button
            onClick={handleExportCSV}
            disabled={isExportingCsv}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-semibold px-3.5 py-2.5 rounded-xl transition-all border border-amber-500/30 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer disabled:opacity-50"
            title="Ekspor data jadwal ibadah ke format tabel CSV (.csv)"
          >
            <FileSpreadsheet className="w-4 h-4 text-amber-400" />
            <span>Ekspor CSV</span>
          </button>

          {/* Export to Excel Button */}
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-semibold px-3.5 py-2.5 rounded-xl transition-all border border-cyan-500/30 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
            title="Ekspor seluruh atau hasil filter jadwal ibadah ke format spreadsheet Excel (.xlsx)"
          >
            <Download className="w-4 h-4 text-cyan-400" />
            <span>Ekspor Excel</span>
          </button>

          {/* Share to WhatsApp Button */}
          <button
            onClick={() => setIsWhatsAppShareModalOpen(true)}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-emerald-300 text-xs font-semibold px-3.5 py-2.5 rounded-xl transition-all border border-emerald-500/30 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
            title="Bagikan format warta jadwal ibadah ke grup WhatsApp jemaat"
          >
            <MessageCircle className="w-4 h-4 text-emerald-400" />
            <span>Bagikan ke WA</span>
          </button>

          {/* Print Official Report */}
          <button
            onClick={() =>
              openPrintReport({
                reportType: 'jadwal_ibadah',
                startDate: startDate || undefined,
                endDate: endDate || undefined,
              })
            }
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-3.5 py-2.5 rounded-xl transition-all border border-slate-700 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
            title="Buka dialog cetak laporan resmi kop gereja"
          >
            <Printer className="w-4 h-4 text-slate-300" />
            <span>Cetak Resmi</span>
          </button>
        </div>
      </div>

      {/* Category Pills & Filters */}
      <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800/80 space-y-3 backdrop-blur-md">
        {/* Category Pill Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setCategoryFilter('semua')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                categoryFilter === 'semua'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              Semua Jadwal ({jadwalIbadahList.length})
            </button>
            <button
              type="button"
              onClick={() => setCategoryFilter('umum')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                categoryFilter === 'umum'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              Ibadah Umum / Minggu
            </button>
            <button
              type="button"
              onClick={() => setCategoryFilter('kategorial')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                categoryFilter === 'kategorial'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                  : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              Kategorial (SPB/SPPer/SPPR/ASHM)
            </button>
            <button
              type="button"
              onClick={() => setCategoryFilter('rayon')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                categoryFilter === 'rayon'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                  : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              Rayon / Lingkungan
            </button>
          </div>

          <div className="text-[11px] text-slate-400 font-medium">
            Menampilkan <span className="text-indigo-400 font-bold">{filteredList.length}</span> dari {jadwalIbadahList.length} jadwal ibadah
          </div>
        </div>

        {/* Search and Date Range Filter Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
          <div className="relative col-span-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari ibadah, pelayan firman, liturgos, pemusik, tempat, rayon..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-xs"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-medium text-[11px] whitespace-nowrap">Dari:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full py-2 px-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-xs"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-medium text-[11px] whitespace-nowrap">s/d:</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full py-2 px-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-xs"
            />
          </div>
        </div>
      </div>

      {/* Table & Cards */}
      <div className="bg-slate-900/80 rounded-2xl border border-slate-800/80 overflow-hidden shadow-lg backdrop-blur-md">
        <div className="overflow-x-auto w-full max-w-full">
          <table className="w-full min-w-[950px] text-xs text-left text-slate-300">
            <thead className="bg-slate-950 text-slate-200 font-bold border-b border-slate-800 uppercase text-[10px] tracking-wider whitespace-nowrap">
              <tr>
                <th className="p-3.5 w-12 text-center">No</th>
                <th className="p-3.5">Tgl &amp; Waktu</th>
                <th className="p-3.5">Kategori &amp; Nama Ibadah</th>
                <th className="p-3.5">Tempat &amp; Tuan Rumah</th>
                <th className="p-3.5">Pelayan Firman &amp; Liturgos</th>
                <th className="p-3.5">Pemusik &amp; Singer</th>
                <th className="p-3.5">Sound &amp; Kolektan</th>
                <th className="p-3.5 text-center">Aksi / Cetak</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-10 text-center text-slate-500">
                    <Calendar className="w-8 h-8 text-slate-600 mx-auto mb-2 opacity-50" />
                    <p className="font-semibold">Tidak ada jadwal ibadah ditemukan.</p>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Silakan ubah filter kategori, tanggal, atau kata kunci pencarian.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredList.map((item, idx) => {
                  const isRayon = item.kategoriIbadah === 'Rayon / Lingkungan';
                  const isKategorial = !isRayon && (item.kategoriIbadah === 'Kategorial' || (!item.kategoriIbadah && !!item.seksi));

                  return (
                    <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-3.5 text-center font-mono text-slate-500">{idx + 1}</td>
                      <td className="p-3.5 whitespace-nowrap font-medium">
                        <div className="font-bold text-slate-100">{item.tanggal}</div>
                        <div className="text-[11px] text-indigo-400 font-mono font-bold flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3" />
                          <span>{item.waktu}</span>
                        </div>
                      </td>
                      <td className="p-3.5">
                        <div className="flex flex-wrap items-center gap-1 mb-1">
                          {isKategorial && (
                            <span className="text-[10px] font-extrabold text-purple-300 bg-purple-950/80 px-2 py-0.5 rounded border border-purple-800/50">
                              Kategorial {item.seksi ? `• ${item.seksi}` : ''}
                            </span>
                          )}
                          {isRayon && (
                            <span className="text-[10px] font-extrabold text-emerald-300 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800/50">
                              Rayon {item.rayon ? `• ${item.rayon}` : ''}
                            </span>
                          )}
                          {!isKategorial && !isRayon && (
                            <span className="text-[10px] font-extrabold text-blue-300 bg-blue-950/80 px-2 py-0.5 rounded border border-blue-800/50">
                              Umum / Minggu
                            </span>
                          )}
                        </div>
                        <div className="font-black text-slate-100 text-sm leading-snug">{item.namaIbadah}</div>
                        {item.natsKhotbah && (
                          <div className="text-[10px] text-amber-300 mt-1 font-semibold flex items-center gap-1">
                            <span className="bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-800/40">
                              Nats: {item.natsKhotbah}
                            </span>
                          </div>
                        )}
                        {item.pembacaanAlkitab && !item.natsKhotbah && (
                          <div className="text-[10px] text-indigo-300 mt-1 font-semibold">
                            Bacaan: {item.pembacaanAlkitab}
                          </div>
                        )}
                      </td>
                      <td className="p-3.5">
                        <div className="text-slate-300 font-medium flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-rose-400 shrink-0" />
                          <span>{item.tempat}</span>
                        </div>
                        {item.tuanRumah && (
                          <div className="text-[10px] text-emerald-400 font-bold mt-1 pl-4">
                            Tuan Rumah: Kel. {item.tuanRumah}
                          </div>
                        )}
                      </td>
                      <td className="p-3.5">
                        <div className="font-bold text-indigo-300">
                          {item.pelayanFirman || item.pengkhotbah}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          Liturgos: <span className="text-slate-300 font-medium">{item.liturgos}</span>
                        </div>
                        {item.koordinatorPelayanan && (
                          <div className="text-[10px] text-purple-300 mt-0.5 font-medium">
                            Koord: <span className="text-slate-200">{item.koordinatorPelayanan}</span>
                          </div>
                        )}
                      </td>
                      <td className="p-3.5">
                        <div className="text-slate-300 font-medium flex items-center gap-1">
                          <Music className="w-3 h-3 text-amber-400 shrink-0" />
                          <span>{item.pemusik}</span>
                        </div>
                        {(item.pemanduLagu || item.kantoria) && (
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            Singer: {item.pemanduLagu || item.kantoria}
                          </div>
                        )}
                      </td>
                      <td className="p-3.5 text-[11px] text-slate-400">
                        {item.operatorMultimedia && (
                          <div>Sound/Media: <span className="text-slate-300">{item.operatorMultimedia}</span></div>
                        )}
                        {item.kolektan && (
                          <div>Kolektan: <span className="text-slate-300">{item.kolektan}</span></div>
                        )}
                        {item.kuponUndian && (
                          <div className="text-amber-300 font-medium">Kupon/Undian: <span>{item.kuponUndian}</span></div>
                        )}
                        {item.wartaKhusus && (
                          <div className="text-[10px] italic text-amber-300 mt-1 truncate max-w-[140px]" title={item.wartaKhusus}>
                            Catatan: {item.wartaKhusus}
                          </div>
                        )}
                      </td>
                      <td className="p-3.5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() =>
                              openPrintReport({
                                reportType: 'detail_jadwal_ibadah',
                                jadwalId: item.id,
                              })
                            }
                            className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg text-[11px] font-semibold transition-all cursor-pointer"
                            title="Cetak Lembar Jadwal & Petugas"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span>Cetak</span>
                          </button>

                          {canEdit && (
                            <>
                              <button
                                onClick={() => handleOpenEdit(item)}
                                className="p-1.5 text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-colors cursor-pointer"
                                title="Edit Jadwal"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleRequestDelete(item)}
                                className="p-1.5 text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                                title="Hapus Jadwal Ibadah"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
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

      {/* Form Modal (Tambah / Edit Jadwal) */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4 overflow-hidden animate-in fade-in duration-150">
          <div className="bg-slate-900 rounded-2xl shadow-2xl w-full max-w-2xl border border-slate-800 text-slate-100 flex flex-col max-h-[92dvh] sm:max-h-[88vh] overflow-hidden my-auto">
            <div className="bg-slate-950 p-4 px-5 border-b border-slate-800 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-100">
                    {editingItem ? 'Edit Jadwal Ibadah & Pelayan' : 'Input Jadwal Ibadah & Pelayan Baru'}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Mencakup Ibadah Minggu, Kategorial (SPB/SPPer/SPPR/ASHM), dan Ibadah Rayon
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Preset Buttons (only on create) */}
            {!editingItem && (
              <div className="bg-slate-950/60 p-3 px-5 border-b border-slate-800/80 space-y-1.5">
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-indigo-300">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Preset Pengisian Cepat:</span>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => applyPreset('minggu_pagi')}
                    className="px-2.5 py-1 bg-blue-900/40 hover:bg-blue-800/60 text-blue-200 border border-blue-700/50 rounded-lg text-[10px] font-bold transition cursor-pointer"
                  >
                    Minggu Pagi
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset('minggu_sore')}
                    className="px-2.5 py-1 bg-blue-900/40 hover:bg-blue-800/60 text-blue-200 border border-blue-700/50 rounded-lg text-[10px] font-bold transition cursor-pointer"
                  >
                    Minggu Sore
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset('spb')}
                    className="px-2.5 py-1 bg-blue-900/40 hover:bg-blue-800/60 text-blue-200 border border-blue-700/50 rounded-lg text-[10px] font-bold transition cursor-pointer"
                  >
                    Ibadah SPB (Bapak)
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset('spper')}
                    className="px-2.5 py-1 bg-rose-900/40 hover:bg-rose-800/60 text-rose-200 border border-rose-700/50 rounded-lg text-[10px] font-bold transition cursor-pointer"
                  >
                    Ibadah SPPer (Perempuan)
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset('sppr')}
                    className="px-2.5 py-1 bg-purple-900/40 hover:bg-purple-800/60 text-purple-200 border border-purple-700/50 rounded-lg text-[10px] font-bold transition cursor-pointer"
                  >
                    Ibadah SPPR/P (Pemuda)
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset('ashm')}
                    className="px-2.5 py-1 bg-amber-900/40 hover:bg-amber-800/60 text-amber-200 border border-amber-700/50 rounded-lg text-[10px] font-bold transition cursor-pointer"
                  >
                    Ibadah ASHM (Sekolah Minggu)
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset('rayon')}
                    className="px-2.5 py-1 bg-emerald-900/40 hover:bg-emerald-800/60 text-emerald-200 border border-emerald-700/50 rounded-lg text-[10px] font-bold transition cursor-pointer"
                  >
                    Ibadah Rayon / Rumah Tangga
                  </button>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden text-xs">
              <div className="p-4 sm:p-5 space-y-4 flex-1 overflow-y-auto overscroll-contain">
                {/* Kategori Ibadah & Seksi / Rayon */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                <h4 className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider">
                  1. Klasifikasi &amp; Jenis Ibadah
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">
                      Kategori Pelayanan <span className="text-rose-400">*</span>
                    </label>
                    <select
                      value={formData.kategoriIbadah || 'Umum / Hari Minggu'}
                      onChange={(e) => {
                        const val = e.target.value;
                        setFormData({
                          ...formData,
                          kategoriIbadah: val,
                          seksi: val === 'Kategorial' ? (formData.seksi || 'SPB') : '',
                        });
                      }}
                      className="w-full p-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 font-semibold focus:outline-none focus:border-indigo-500"
                    >
                      <option value="Umum / Hari Minggu">Umum / Hari Minggu</option>
                      <option value="Kategorial">Kategorial (SPB/SPPer/SPPR/ASHM)</option>
                      <option value="Rayon / Lingkungan">Rayon / Lingkungan (Non-Kategorial)</option>
                      <option value="Sakramen / Khusus">Sakramen / Ibadah Khusus</option>
                    </select>
                  </div>

                  {formData.kategoriIbadah === 'Kategorial' && (
                    <div>
                      <label className="block font-semibold text-purple-300 mb-1">
                        Seksi Kategorial <span className="text-rose-400">*</span>
                      </label>
                      <select
                        value={formData.seksi || 'SPB'}
                        onChange={(e) => setFormData({ ...formData, seksi: e.target.value })}
                        className="w-full p-2 rounded-xl bg-purple-950/60 border border-purple-700 text-purple-200 font-bold focus:outline-none focus:border-purple-400"
                      >
                        <option value="SPB">SPB (Seksi Pelayanan Bapak)</option>
                        <option value="SPPer">SPPer (Seksi Pelayanan Perempuan)</option>
                        <option value="SPPR/P">SPPR/P (Pemuda &amp; Remaja)</option>
                        <option value="ASHM">ASHM (Anak Sekolah Hari Minggu)</option>
                      </select>
                    </div>
                  )}

                  {(formData.kategoriIbadah === 'Rayon / Lingkungan' || formData.kategoriIbadah === 'Kategorial') && (
                    <div>
                      <label className="block font-semibold text-emerald-300 mb-1">
                        Rayon / Lingkungan {formData.kategoriIbadah === 'Rayon / Lingkungan' && <span className="text-rose-400">*</span>}
                      </label>
                      <select
                        value={formData.rayon || ''}
                        onChange={(e) => setFormData({ ...formData, rayon: e.target.value })}
                        className="w-full p-2 rounded-xl bg-emerald-950/60 border border-emerald-700 text-emerald-200 font-bold focus:outline-none focus:border-emerald-400"
                      >
                        <option value="">-- Pilih Rayon / Lingkungan (Sesuai Warga Jemaat) --</option>
                        {allRayons.map((rName) => (
                          <option key={rName} value={rName}>
                            {rName}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">
                      Tuan Rumah (Keluarga)
                    </label>
                    <input
                      type="text"
                      value={formData.tuanRumah || ''}
                      onChange={(e) => setFormData({ ...formData, tuanRumah: e.target.value })}
                      placeholder="e.g. Kel. Bpk. Hendra Wijaya"
                      className="w-full p-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>

              {/* Tanggal, Waktu, Nama Ibadah & Tempat */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    2. Tanggal Pelaksanaan <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.tanggal || ''}
                    onChange={(e) => setFormData({ ...formData, tanggal: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 font-semibold focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    3. Waktu Pelaksanaan <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.waktu || ''}
                    onChange={(e) => setFormData({ ...formData, waktu: e.target.value })}
                    placeholder="e.g. 09.00 WIB atau 19.00 WIB"
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 font-semibold focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    4. Nama Kebaktian / Ibadah <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.namaIbadah || ''}
                    onChange={(e) => setFormData({ ...formData, namaIbadah: e.target.value })}
                    placeholder="e.g. Kebaktian Minggu Pagi I"
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 font-bold focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    5. Tempat Pelaksanaan <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.tempat || ''}
                    onChange={(e) => setFormData({ ...formData, tempat: e.target.value })}
                    placeholder="e.g. Gedung Gereja Efata Utama / Rumah Kel..."
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Pelayan Firman & Nats Khotbah */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-indigo-300 mb-1">
                    6. Pelayan Firman (Pengkhotbah) <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.pelayanFirman || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, pelayanFirman: e.target.value, pengkhotbah: e.target.value })
                    }
                    placeholder="e.g. Pdt. Drs. Yansen K. M.Th"
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-indigo-300 font-bold focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-indigo-300 mb-1">
                    7. Nats Khotbah / Tema Firman
                  </label>
                  <input
                    type="text"
                    value={formData.natsKhotbah || ''}
                    onChange={(e) => setFormData({ ...formData, natsKhotbah: e.target.value })}
                    placeholder="e.g. Yeremia 29 : 11 - 14 / Hidup Dalam Anugerah"
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-indigo-200 font-semibold focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Liturgos & Pembacaan Alkitab */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    8. Liturgos / Penuntun Ibadah <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.liturgos || ''}
                    onChange={(e) => setFormData({ ...formData, liturgos: e.target.value })}
                    placeholder="e.g. Pnt. Ir. Cornelis Rambang"
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    9. Pembacaan Alkitab
                  </label>
                  <input
                    type="text"
                    value={formData.pembacaanAlkitab || ''}
                    onChange={(e) => setFormData({ ...formData, pembacaanAlkitab: e.target.value })}
                    placeholder="e.g. Yohanes 3 : 16 - 21"
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 font-semibold focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Koordinator Pelayanan & Kolektan / Petugas */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    10. Koordinator Pelayanan
                  </label>
                  <input
                    type="text"
                    value={formData.koordinatorPelayanan || ''}
                    onChange={(e) => setFormData({ ...formData, koordinatorPelayanan: e.target.value })}
                    placeholder="e.g. Pnt. Dr. Hendra Wijaya / Bpk. Markus"
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    11. Kolektan / Petugas
                  </label>
                  <input
                    type="text"
                    value={formData.kolektan || ''}
                    onChange={(e) => setFormData({ ...formData, kolektan: e.target.value })}
                    placeholder="e.g. Majelis Jemaat Terjadwal"
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Pemusik, Singer & Operator Multimedia */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    12. Pemusik / Organis
                  </label>
                  <input
                    type="text"
                    value={formData.pemusik || ''}
                    onChange={(e) => setFormData({ ...formData, pemusik: e.target.value })}
                    placeholder="e.g. Tim Musik Rayon I / Sdr. Kevin"
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    13. Singer / Pemandu Lagu
                  </label>
                  <input
                    type="text"
                    value={formData.pemanduLagu || formData.kantoria || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, pemanduLagu: e.target.value, kantoria: e.target.value })
                    }
                    placeholder="e.g. Tim Cantoria SPPR/P / Singer 1 & 2"
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    14. Operator Multimedia &amp; Sound
                  </label>
                  <input
                    type="text"
                    value={formData.operatorMultimedia || ''}
                    onChange={(e) => setFormData({ ...formData, operatorMultimedia: e.target.value })}
                    placeholder="e.g. Dkn. Kevin & Tim Media"
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Kolektan 2 / Penerima Tamu, Pewarta Berita & Kupon/Undian */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    15. Kolektan / Petugas
                  </label>
                  <input
                    type="text"
                    value={formData.penerimaTamu || ''}
                    onChange={(e) => setFormData({ ...formData, penerimaTamu: e.target.value })}
                    placeholder="e.g. Petugas Kolektan 2 / Penerima Tamu"
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    16. Pewarta Berita Jemaat
                  </label>
                  <input
                    type="text"
                    value={formData.pewartaBerita || ''}
                    onChange={(e) => setFormData({ ...formData, pewartaBerita: e.target.value })}
                    placeholder="e.g. Pnt. Dr. Hendra Wijaya"
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-amber-300 mb-1">
                    17. Kupon / Undian / Doorprize
                  </label>
                  <input
                    type="text"
                    value={formData.kuponUndian || ''}
                    onChange={(e) => setFormData({ ...formData, kuponUndian: e.target.value })}
                    placeholder="e.g. No. Undian 001 - 150 / Disediakan Panitia"
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-amber-200 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* 18. Warta Khusus / Catatan Tambahan */}
              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  18. Warta Khusus / Catatan Pelayanan
                </label>
                <textarea
                  rows={2}
                  value={formData.wartaKhusus || ''}
                  onChange={(e) => setFormData({ ...formData, wartaKhusus: e.target.value })}
                  placeholder="e.g. Sakramen Perjamuan Kudus, Pengakuan Iman, Persembahan Khusus, dll..."
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
                />
              </div>

              </div>

              {/* Buttons */}
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
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold shadow-md shadow-indigo-600/30 cursor-pointer transition"
                >
                  {editingItem ? 'Lanjut Simpan Perubahan' : 'Lanjut Simpan Jadwal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation & Anti-Duplicate Progress Modal */}
      {isConfirmModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 bg-slate-800/80 border-b border-slate-700/80 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-100">
                    Konfirmasi Penyimpanan Jadwal
                  </h3>
                  <p className="text-xs text-slate-400">
                    Periksa kembali ringkasan data sebelum disimpan ke database
                  </p>
                </div>
              </div>
              {!isSaving && (
                <button
                  onClick={() => setIsConfirmModalOpen(false)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-700 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Content */}
            <div className="p-6 space-y-4 text-sm">
              {/* Duplicate Warning if detected */}
              {duplicateWarning && (
                <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 shrink-0 text-amber-400 mt-0.5" />
                  <div className="text-xs leading-relaxed">
                    <span className="font-bold block text-amber-200 mb-0.5">Potensi Data Jadwal Ganda Terdeteksi!</span>
                    {duplicateWarning}
                  </div>
                </div>
              )}

              {/* Summary Card */}
              <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800/80 space-y-2.5">
                <div className="flex justify-between items-center text-xs pb-2 border-b border-slate-800">
                  <span className="text-slate-400">Nama Ibadah</span>
                  <span className="font-bold text-indigo-300">{formData.namaIbadah || '-'}</span>
                </div>
                <div className="flex justify-between items-center text-xs pb-2 border-b border-slate-800">
                  <span className="text-slate-400">Tanggal & Waktu</span>
                  <span className="font-medium text-slate-200">
                    {formData.tanggal ? new Date(formData.tanggal).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : '-'} ({formData.waktu})
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs pb-2 border-b border-slate-800">
                  <span className="text-slate-400">Tempat Pelaksanaan</span>
                  <span className="font-medium text-slate-200">{formData.tempat || 'Belum diisi'}</span>
                </div>
                <div className="flex justify-between items-center text-xs pb-2 border-b border-slate-800">
                  <span className="text-slate-400">Pelayan Firman</span>
                  <span className="font-medium text-emerald-400">{formData.pelayanFirman || '-'}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">Liturgos / Petugas</span>
                  <span className="font-medium text-slate-300">{formData.liturgos || '-'}</span>
                </div>
              </div>

              {/* Saving Progress Bar */}
              {isSaving && (
                <div className="space-y-2 pt-2 animate-in fade-in duration-150">
                  <div className="flex justify-between items-center text-xs font-semibold">
                    <span className="text-indigo-400 flex items-center gap-1.5">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Sedang memproses penyimpanan ke database...
                    </span>
                    <span className="text-indigo-300 font-mono">{saveProgress}%</span>
                  </div>
                  <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden border border-indigo-500/30 p-0.5">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-600 via-indigo-500 to-emerald-500 rounded-full transition-all duration-300 ease-out shadow-sm shadow-indigo-500/50"
                      style={{ width: `${saveProgress}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 text-center">
                    Mohon tunggu sejenak, sistem sedang mencegah terjadinya duplikasi data...
                  </p>
                </div>
              )}
            </div>

            {/* Footer / Actions */}
            <div className="px-6 py-4 bg-slate-800/50 border-t border-slate-700/80 flex items-center justify-end gap-3">
              <button
                type="button"
                disabled={isSaving}
                onClick={() => setIsConfirmModalOpen(false)}
                className="px-4 py-2 border border-slate-700 rounded-xl hover:bg-slate-800 font-semibold text-slate-300 text-xs transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                Kembali Edit
              </button>
              <button
                type="button"
                disabled={isSaving}
                onClick={handleExecuteSave}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 active:scale-98 text-white rounded-xl font-bold text-xs shadow-md shadow-indigo-600/30 transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Menyimpan ({saveProgress}%)...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    {duplicateWarning ? 'Tetap Simpan Jadwal' : 'Ya, Simpan Jadwal'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && itemToDelete && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-rose-500/40 text-slate-100 animate-scale-in">
            {/* Modal Header */}
            <div className="bg-rose-950/40 p-4 px-5 border-b border-rose-800/50 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-100">
                    Konfirmasi Hapus Jadwal Ibadah
                  </h3>
                  <p className="text-[11px] text-rose-300/80">
                    Tindakan ini permanen dan tidak dapat dibatalkan
                  </p>
                </div>
              </div>
              {!isDeleting && (
                <button
                  type="button"
                  onClick={() => {
                    setIsDeleteModalOpen(false);
                    setItemToDelete(null);
                  }}
                  className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Modal Content */}
            <div className="p-5 space-y-3.5 text-xs">
              <p className="text-slate-300 leading-relaxed">
                Apakah Anda yakin ingin menghapus data jadwal ibadah berikut dari sistem?
              </p>

              {/* Schedule Summary Card */}
              <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 space-y-2">
                <div className="flex justify-between items-start pb-2 border-b border-slate-800/80">
                  <span className="text-slate-400">Nama Ibadah</span>
                  <span className="font-bold text-rose-300 text-right max-w-[200px]">
                    {itemToDelete.namaIbadah || '-'}
                  </span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-slate-800/80">
                  <span className="text-slate-400">Tanggal &amp; Waktu</span>
                  <span className="font-medium text-slate-200">
                    {itemToDelete.tanggal} ({itemToDelete.waktu})
                  </span>
                </div>
                {itemToDelete.tempat && (
                  <div className="flex justify-between items-center pb-2 border-b border-slate-800/80">
                    <span className="text-slate-400">Tempat</span>
                    <span className="font-medium text-slate-200 text-right max-w-[200px] truncate">
                      {itemToDelete.tempat}
                      {itemToDelete.tuanRumah ? ` (Kel. ${itemToDelete.tuanRumah})` : ''}
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Pelayan Firman</span>
                  <span className="font-medium text-indigo-300 text-right max-w-[200px] truncate">
                    {itemToDelete.pelayanFirman || itemToDelete.pengkhotbah || '-'}
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                <span className="text-[11px] leading-relaxed">
                  Data jadwal yang telah dihapus akan hilang dari kalender pelayanan dan warta jemaat.
                </span>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="px-5 py-3.5 bg-slate-950/60 border-t border-slate-800 flex items-center justify-end gap-2.5">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setItemToDelete(null);
                }}
                className="px-4 py-2 border border-slate-700 rounded-xl hover:bg-slate-800 font-semibold text-slate-300 text-xs transition disabled:opacity-50 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 active:scale-98 text-white rounded-xl font-bold text-xs shadow-md shadow-rose-600/30 transition flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Menghapus...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Ya, Hapus Jadwal</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Excel Import Modal */}
      {isExcelModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-5xl w-full max-h-[92vh] flex flex-col overflow-hidden shadow-2xl animate-scaleUp">
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/80 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                    <span>Import Jadwal Ibadah &amp; Pelayan Firman</span>
                    <span className="text-[10px] px-2 py-0.5 bg-emerald-500/20 text-emerald-300 font-semibold rounded-full border border-emerald-500/30">
                      Excel / CSV
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Unggah spreadsheet Excel (.xlsx, .xls) atau CSV untuk input data massal secara instan
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-300 text-xs font-semibold rounded-xl border border-emerald-500/30 transition cursor-pointer"
                  title="Unduh format template Excel resmi dengan contoh pengisian lengkap"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Unduh Format Template (.xlsx)</span>
                </button>

                <button
                  type="button"
                  disabled={isImportingExcel}
                  onClick={() => setIsExcelModalOpen(false)}
                  className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-xl transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-4 flex-1">
              {/* Action & Info Bar for Mobile Template Download */}
              <div className="sm:hidden flex items-center justify-between p-3 bg-slate-950 rounded-xl border border-slate-800 gap-2">
                <span className="text-xs text-slate-300 font-medium">Belum punya format file?</span>
                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  className="flex items-center gap-1.5 px-3 py-1 bg-emerald-600/20 text-emerald-300 text-xs font-semibold rounded-lg border border-emerald-500/30 cursor-pointer"
                >
                  <Download className="w-3 h-3" />
                  <span>Unduh Template</span>
                </button>
              </div>

              {/* Column Guide Collapsible */}
              <div className="bg-slate-950/60 rounded-xl border border-slate-800/80 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setShowGuide(!showGuide)}
                  className="w-full px-4 py-2.5 flex items-center justify-between text-xs font-semibold text-slate-300 hover:text-slate-100 hover:bg-slate-800/40 transition text-left cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <Info className="w-4 h-4 text-cyan-400" />
                    <span>Panduan Format Kolom Spreadsheet Excel yang Didukung</span>
                  </div>
                  <span className="text-[11px] text-cyan-400">{showGuide ? 'Sembunyikan ▲' : 'Lihat Detail ▼'}</span>
                </button>

                {showGuide && (
                  <div className="p-4 border-t border-slate-800/80 bg-slate-950/90 text-xs text-slate-300 space-y-2.5 animate-fadeIn">
                    <p className="text-slate-400 text-[11px]">
                      Sistem menggunakan pencocokan cerdas sehingga kolom spreadsheet Anda dapat menggunakan variasi nama berikut:
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 text-[11px]">
                      <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                        <span className="font-bold text-indigo-300 block">Tanggal &amp; Waktu:</span>
                        <span className="text-slate-400">`Tanggal`, `Waktu` (contoh: 2026-08-23, 09.00 WIB)</span>
                      </div>
                      <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                        <span className="font-bold text-indigo-300 block">Nama &amp; Kategori Ibadah:</span>
                        <span className="text-slate-400">`Nama Ibadah`, `Kategori Ibadah`, `Seksi`, `Rayon`</span>
                      </div>
                      <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                        <span className="font-bold text-indigo-300 block">Tempat &amp; Tuan Rumah:</span>
                        <span className="text-slate-400">`Tempat` (Gedung Gereja / Rumah), `Tuan Rumah`</span>
                      </div>
                      <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                        <span className="font-bold text-indigo-300 block">Pelayan Firman &amp; Khotbah:</span>
                        <span className="text-slate-400">`Pelayan Firman`, `Nats Khotbah` (Yohanes 3:16)</span>
                      </div>
                      <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                        <span className="font-bold text-indigo-300 block">Petugas Liturgis:</span>
                        <span className="text-slate-400">`Liturgos`, `Pembacaan Alkitab`, `Pewarta Berita`</span>
                      </div>
                      <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                        <span className="font-bold text-indigo-300 block">Musik &amp; Petugas Pendukung:</span>
                        <span className="text-slate-400">`Pemusik`, `Pemandu Lagu`, `Kolektan`, `Multimedia`</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* File Dropzone Area */}
              <input
                ref={excelFileInputRef}
                type="file"
                accept=".xlsx, .xls, .csv"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    processUploadedFile(file);
                  }
                  e.target.value = '';
                }}
              />

              {!excelFile ? (
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    const file = e.dataTransfer.files?.[0];
                    if (file) {
                      processUploadedFile(file);
                    }
                  }}
                  onClick={() => excelFileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-700 hover:border-emerald-500 bg-slate-950/60 hover:bg-emerald-950/10 rounded-2xl p-8 text-center cursor-pointer transition-all group"
                >
                  <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <UploadCloud className="w-7 h-7" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-100 group-hover:text-emerald-300 transition-colors">
                    Tarik &amp; Lepas File Excel / CSV di sini
                  </h4>
                  <p className="text-xs text-slate-400 mt-1">atau klik untuk memilih file dari komputer atau ponsel Anda</p>
                  <div className="flex items-center justify-center gap-2 mt-4 text-[11px] text-slate-400">
                    <span className="px-2.5 py-0.5 bg-slate-900 rounded-md border border-slate-800 font-mono">.XLSX</span>
                    <span className="px-2.5 py-0.5 bg-slate-900 rounded-md border border-slate-800 font-mono">.XLS</span>
                    <span className="px-2.5 py-0.5 bg-slate-900 rounded-md border border-slate-800 font-mono">.CSV</span>
                  </div>
                </div>
              ) : (
                <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      <FileSpreadsheet className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-100 flex items-center gap-2">
                        <span>{excelFile.name}</span>
                        <span className="text-[10px] text-slate-400 font-normal">
                          ({(excelFile.size / 1024).toFixed(1)} KB)
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {isParsingExcel ? (
                          <span className="text-cyan-400 flex items-center gap-1">
                            <Loader2 className="w-3 h-3 animate-spin" /> Membaca spreadsheet...
                          </span>
                        ) : (
                          <span className="text-emerald-400 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Berhasil dipindai ({parsedExcelRows.length} baris data)
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={isImportingExcel || isParsingExcel}
                      onClick={() => excelFileInputRef.current?.click()}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition cursor-pointer"
                    >
                      Ganti File
                    </button>
                    <button
                      type="button"
                      disabled={isImportingExcel || isParsingExcel}
                      onClick={() => {
                        setExcelFile(null);
                        setParsedExcelRows([]);
                      }}
                      className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition cursor-pointer"
                      title="Batalkan file"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* Data Preview & Validation Statistics */}
              {parsedExcelRows.length > 0 && (
                <div className="space-y-3">
                  {/* Stats & Filter Bar */}
                  <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-3">
                    {/* Tabs */}
                    <div className="flex flex-wrap items-center gap-1.5 text-xs">
                      <button
                        type="button"
                        onClick={() => setImportFilterTab('semua')}
                        className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                          importFilterTab === 'semua'
                            ? 'bg-slate-800 text-white border border-slate-700'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        Semua ({parsedExcelRows.length})
                      </button>

                      <button
                        type="button"
                        onClick={() => setImportFilterTab('valid')}
                        className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                          importFilterTab === 'valid'
                            ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/40'
                            : 'text-slate-400 hover:text-emerald-400'
                        }`}
                      >
                        Siap Impor ({parsedExcelRows.filter((r) => r.isValid && !r.isDuplicate).length})
                      </button>

                      {parsedExcelRows.some((r) => r.isDuplicate) && (
                        <button
                          type="button"
                          onClick={() => setImportFilterTab('duplikat')}
                          className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                            importFilterTab === 'duplikat'
                              ? 'bg-amber-600/30 text-amber-300 border border-amber-500/40'
                              : 'text-slate-400 hover:text-amber-400'
                          }`}
                        >
                          Duplikat ({parsedExcelRows.filter((r) => r.isDuplicate).length})
                        </button>
                      )}

                      {parsedExcelRows.some((r) => !r.isValid) && (
                        <button
                          type="button"
                          onClick={() => setImportFilterTab('error')}
                          className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                            importFilterTab === 'error'
                              ? 'bg-rose-600/30 text-rose-300 border border-rose-500/40'
                              : 'text-slate-400 hover:text-rose-400'
                          }`}
                        >
                          Error ({parsedExcelRows.filter((r) => !r.isValid).length})
                        </button>
                      )}
                    </div>

                    {/* Duplicate Toggle Checkbox */}
                    <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={skipDuplicates}
                        onChange={(e) => setSkipDuplicates(e.target.checked)}
                        className="rounded border-slate-700 text-emerald-500 focus:ring-emerald-500/30 w-4 h-4 bg-slate-900"
                      />
                      <span>Lewati data yang sudah ada di database</span>
                    </label>
                  </div>

                  {/* Preview Table */}
                  <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/60 max-h-72 overflow-y-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 sticky top-0 z-10 text-[11px]">
                        <tr>
                          <th className="px-3 py-2.5 font-semibold text-center w-10">#</th>
                          <th className="px-3 py-2.5 font-semibold w-24">Status</th>
                          <th className="px-3 py-2.5 font-semibold w-32">Tgl &amp; Waktu</th>
                          <th className="px-3 py-2.5 font-semibold min-w-[180px]">Nama &amp; Kategori</th>
                          <th className="px-3 py-2.5 font-semibold min-w-[160px]">Pelayan Firman &amp; Khotbah</th>
                          <th className="px-3 py-2.5 font-semibold min-w-[150px]">Liturgos &amp; Musik</th>
                          <th className="px-3 py-2.5 font-semibold min-w-[140px]">Tempat</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {filteredImportRows.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="px-4 py-8 text-center text-slate-500 text-xs">
                              Tidak ada baris data dalam kategori filter ini.
                            </td>
                          </tr>
                        ) : (
                          filteredImportRows.map((row, idx) => (
                            <tr key={row.idTemp} className="hover:bg-slate-900/60 transition-colors">
                              <td className="px-3 py-2.5 text-center text-slate-400 text-[11px] font-mono">
                                {idx + 1}
                              </td>

                              <td className="px-3 py-2.5">
                                {!row.isValid ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-300 border border-rose-500/20 text-[10px] font-bold">
                                    <AlertCircle className="w-2.5 h-2.5" /> Error
                                  </span>
                                ) : row.isDuplicate ? (
                                  <span
                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-300 border border-amber-500/20 text-[10px] font-bold"
                                    title={row.duplicateInfo}
                                  >
                                    <AlertTriangle className="w-2.5 h-2.5" /> Duplikat
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 text-[10px] font-bold">
                                    <Check className="w-2.5 h-2.5" /> Valid
                                  </span>
                                )}
                              </td>

                              <td className="px-3 py-2.5">
                                <div className="font-bold text-slate-200">{row.tanggal}</div>
                                <div className="text-[11px] text-slate-400">{row.waktu}</div>
                              </td>

                              <td className="px-3 py-2.5">
                                <div className="font-bold text-slate-100">{row.namaIbadah}</div>
                                <div className="flex items-center gap-1 mt-0.5">
                                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 font-medium">
                                    {row.kategoriIbadah}
                                  </span>
                                  {row.seksi && (
                                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20 font-bold">
                                      {row.seksi}
                                    </span>
                                  )}
                                  {row.rayon && (
                                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 font-medium">
                                      {row.rayon}
                                    </span>
                                  )}
                                </div>
                              </td>

                              <td className="px-3 py-2.5">
                                <div className="font-semibold text-indigo-300">
                                  {row.pelayanFirman || <span className="text-slate-500 italic">Belum diisi</span>}
                                </div>
                                {row.natsKhotbah && (
                                  <div className="text-[10px] text-slate-400">Nats: {row.natsKhotbah}</div>
                                )}
                              </td>

                              <td className="px-3 py-2.5">
                                <div className="text-slate-300">
                                  {row.liturgos ? `Lit: ${row.liturgos}` : <span className="text-slate-500 italic">-</span>}
                                </div>
                                {row.pemusik && (
                                  <div className="text-[10px] text-slate-400">Mus: {row.pemusik}</div>
                                )}
                              </td>

                              <td className="px-3 py-2.5">
                                <div className="text-slate-300 truncate max-w-[150px]">{row.tempat}</div>
                                {row.tuanRumah && (
                                  <div className="text-[10px] text-slate-400 truncate max-w-[150px]">
                                    Host: {row.tuanRumah}
                                  </div>
                                )}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Progress Bar while Importing */}
              {isImportingExcel && (
                <div className="p-4 bg-slate-950 rounded-xl border border-indigo-500/30 space-y-2 animate-fadeIn">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-indigo-300 flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
                      <span>Menyimpan ke Cloud Firestore...</span>
                    </span>
                    <span className="text-slate-400 font-mono">
                      {importProgress.current} / {importProgress.total} (
                      {Math.round((importProgress.current / (importProgress.total || 1)) * 100)}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800">
                    <div
                      className="bg-indigo-500 h-full transition-all duration-200 rounded-full shadow-sm shadow-indigo-500/50"
                      style={{
                        width: `${Math.round((importProgress.current / (importProgress.total || 1)) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-3.5 bg-slate-950/90 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
              <div className="text-xs text-slate-400">
                {parsedExcelRows.length > 0 ? (
                  <span>
                    Siap diproses:{' '}
                    <strong className="text-emerald-400">
                      {
                        parsedExcelRows.filter((r) => {
                          if (!r.isValid) return false;
                          if (skipDuplicates && r.isDuplicate) return false;
                          return true;
                        }).length
                      }{' '}
                      jadwal
                    </strong>
                  </span>
                ) : (
                  <span>Pilih file Excel (.xlsx) untuk memulai proses impor data.</span>
                )}
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  disabled={isImportingExcel}
                  onClick={() => setIsExcelModalOpen(false)}
                  className="px-4 py-2 border border-slate-700 rounded-xl hover:bg-slate-800 font-semibold text-slate-300 text-xs transition disabled:opacity-50 cursor-pointer"
                >
                  Batal
                </button>

                <button
                  type="button"
                  disabled={
                    isImportingExcel ||
                    isParsingExcel ||
                    parsedExcelRows.filter((r) => {
                      if (!r.isValid) return false;
                      if (skipDuplicates && r.isDuplicate) return false;
                      return true;
                    }).length === 0
                  }
                  onClick={handleBatchImportExcel}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 active:scale-98 text-white rounded-xl font-bold text-xs shadow-md shadow-emerald-600/30 transition flex items-center gap-2 disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
                >
                  {isImportingExcel ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Mengimpor Data...</span>
                    </>
                  ) : (
                    <>
                      <FileUp className="w-4 h-4" />
                      <span>
                        Impor{' '}
                        {
                          parsedExcelRows.filter((r) => {
                            if (!r.isValid) return false;
                            if (skipDuplicates && r.isDuplicate) return false;
                            return true;
                          }).length
                        }{' '}
                        Jadwal ke Database
                      </span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* WhatsApp Share Modal */}
      {isWhatsAppShareModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-gradient-to-r from-emerald-950/80 to-slate-900 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <MessageCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-100">
                    Bagikan Jadwal Ibadah ke WhatsApp Jemaat
                  </h3>
                  <p className="text-xs text-slate-400">
                    Format teks siap salin atau kirim langsung ke grup warta warga jemaat
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsWhatsAppShareModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 overflow-y-auto">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="flex items-center gap-1.5">
                  <Info className="w-4 h-4 text-emerald-400" />
                  <span>
                    Menampilkan{' '}
                    <strong className="text-emerald-300 font-bold">
                      {(filteredList.length > 0 ? filteredList : jadwalIbadahList).length} jadwal ibadah
                    </strong>{' '}
                    sesuai filter aktif.
                  </span>
                </span>
                <span className="text-[11px] text-slate-500">
                  {startDate && endDate ? `${startDate} s/d ${endDate}` : 'Semua Jadwal'}
                </span>
              </div>

              {/* Text Area Preview */}
              <div className="relative">
                <textarea
                  readOnly
                  value={getWhatsAppScheduleText()}
                  rows={14}
                  className="w-full bg-slate-950/90 border border-slate-800 rounded-2xl p-4 text-xs font-mono text-slate-200 leading-relaxed focus:outline-none focus:border-emerald-500/50 resize-none shadow-inner"
                />
              </div>

              <div className="p-3 bg-emerald-950/30 border border-emerald-500/20 rounded-2xl text-[11px] text-emerald-300 flex items-start gap-2.5">
                <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <strong>Tips Warta Jemaat:</strong> Anda dapat langsung menekan tombol{' '}
                  <span className="underline font-semibold">Salin Format Teks</span> lalu menempelkannya (Paste) ke grup WhatsApp Lingkungan/Rayon, SPB, SPPer, SPPR/P, atau grup jemaat lainnya.
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-slate-950/80 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setIsWhatsAppShareModalOpen(false)}
                className="px-4 py-2.5 border border-slate-700 rounded-xl hover:bg-slate-800 font-semibold text-slate-300 text-xs transition cursor-pointer"
              >
                Tutup
              </button>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={handleCopyWhatsAppText}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-emerald-500/40 rounded-xl font-bold text-xs shadow-md transition flex items-center gap-2 cursor-pointer active:scale-98"
                >
                  {copiedWaText ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span>Berhasil Disalin!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Salin Format Teks</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleOpenWhatsAppDirect}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs shadow-md shadow-emerald-600/30 transition flex items-center gap-2 cursor-pointer active:scale-98"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Buka WhatsApp</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hidden Print/PDF Document Container */}
      <div style={{ position: 'fixed', left: '-9999px', top: '-9999px', width: '1120px' }}>
        <div
          ref={pdfContainerRef}
          className="p-8 bg-white text-slate-900 font-sans leading-normal"
          style={{ width: '100%', maxWidth: '1120px', backgroundColor: '#ffffff', color: '#0f172a' }}
        >
          {/* Kop Gereja */}
          <div className="flex items-center justify-between border-b-2 border-slate-900 pb-4 mb-4">
            <div className="flex items-center gap-4">
              <img
                src={settings.logoGereja || defaultGkeLogo}
                alt="Logo GKE"
                className="w-16 h-16 object-contain"
                crossOrigin="anonymous"
              />
              <div>
                <div className="text-[11px] font-bold tracking-wider text-slate-600 uppercase">
                  GEREJA KALIMANTAN EVANGELIS (GKE) - ANGGOTA PGI
                </div>
                <div className="text-lg font-black text-slate-900 tracking-tight uppercase">
                  {settings.namaGereja || 'MAJELIS JEMAAT GKE'}
                </div>
                <div className="text-[11px] text-slate-600">
                  {settings.alamatGereja || 'Jl. Gereja No. 01, Palangka Raya'} | Telp: {settings.teleponGereja || '(0536) 3221234'} | Email: {settings.emailGereja || 'gke.jemaat@gmail.com'}
                </div>
              </div>
            </div>
            <div className="text-right text-[11px] text-slate-500">
              <div className="font-bold text-slate-800">DOKUMEN RESMI PELAYANAN</div>
              <div>Dicetak: {formatIndonesianDateFull(new Date().toISOString().split('T')[0])}</div>
            </div>
          </div>

          {/* Judul Dokumen */}
          <div className="text-center my-4">
            <h1 className="text-base font-black uppercase tracking-wider text-slate-900 underline">
              JADWAL IBADAH & PETUGAS PELAYANAN LITURGIS
            </h1>
            <p className="text-xs text-slate-600 mt-1 font-medium">
              {startDate && endDate
                ? `Periode: ${formatIndonesianDateFull(startDate)} s/d ${formatIndonesianDateFull(endDate)}`
                : startDate
                ? `Mulai Tanggal: ${formatIndonesianDateFull(startDate)}`
                : 'Daftar Seluruh Jadwal Ibadah Terdaftar'}
              {categoryFilter !== 'semua' && ` | Kategori: ${categoryFilter.toUpperCase()}`}
            </p>
          </div>

          {/* Tabel Jadwal */}
          <table className="w-full text-[10px] border-collapse border border-slate-300 mb-6">
            <thead>
              <tr className="bg-slate-800 text-white font-bold text-center">
                <th className="border border-slate-400 p-2 w-7">No</th>
                <th className="border border-slate-400 p-2 w-28">Hari, Tgl & Waktu</th>
                <th className="border border-slate-400 p-2 w-36">Nama Ibadah & Kategori</th>
                <th className="border border-slate-400 p-2 w-32">Tempat & Tuan Rumah</th>
                <th className="border border-slate-400 p-2 w-44">Pelayan Firman & Nats</th>
                <th className="border border-slate-400 p-2">Liturgos & Petugas Pelayanan</th>
                <th className="border border-slate-400 p-2 w-32">Warta / Catatan</th>
              </tr>
            </thead>
            <tbody>
              {(filteredList.length > 0 ? filteredList : jadwalIbadahList).map((item, idx) => {
                const day = getIndonesianDayName(item.tanggal);
                const tgl = formatIndonesianDateFull(item.tanggal);
                return (
                  <tr key={item.id || idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                    <td className="border border-slate-300 p-2 text-center font-bold text-slate-700">{idx + 1}</td>
                    <td className="border border-slate-300 p-2">
                      <div className="font-bold text-slate-900">{day ? `${day},` : ''}</div>
                      <div className="text-slate-800">{tgl || item.tanggal}</div>
                      <div className="text-indigo-700 font-bold mt-0.5">⏰ {item.waktu || '09.00 WIB'}</div>
                    </td>
                    <td className="border border-slate-300 p-2">
                      <div className="font-bold text-slate-900">{item.namaIbadah}</div>
                      <div className="text-[9px] text-slate-600 mt-0.5">
                        {item.kategoriIbadah || 'Umum'} {item.seksi ? `• ${item.seksi}` : ''} {item.rayon ? `• ${item.rayon}` : ''}
                      </div>
                    </td>
                    <td className="border border-slate-300 p-2">
                      <div className="font-medium text-slate-800">{item.tempat || 'Gedung Gereja'}</div>
                      {item.tuanRumah && (
                        <div className="text-[9px] text-slate-600">Kel. {item.tuanRumah}</div>
                      )}
                    </td>
                    <td className="border border-slate-300 p-2">
                      <div className="font-bold text-slate-900">{item.pelayanFirman || item.pengkhotbah || '-'}</div>
                      {item.natsKhotbah && (
                        <div className="text-[9px] text-slate-600 italic mt-0.5">Nats: {item.natsKhotbah}</div>
                      )}
                      {item.pembacaanAlkitab && (
                        <div className="text-[9px] text-slate-500">Bacaan: {item.pembacaanAlkitab}</div>
                      )}
                    </td>
                    <td className="border border-slate-300 p-2 space-y-0.5 text-[9px]">
                      {item.liturgos && <div><span className="font-semibold text-slate-700">Liturgos:</span> {item.liturgos}</div>}
                      {(item.pemusik || item.pemanduLagu || item.kantoria) && (
                        <div>
                          <span className="font-semibold text-slate-700">Musik/Singer:</span> {item.pemusik || '-'} / {item.pemanduLagu || item.kantoria || '-'}
                        </div>
                      )}
                      {item.kolektan && <div><span className="font-semibold text-slate-700">Kolektan:</span> {item.kolektan}</div>}
                      {item.operatorMultimedia && <div><span className="font-semibold text-slate-700">Multimedia:</span> {item.operatorMultimedia}</div>}
                      {item.penerimaTamu && <div><span className="font-semibold text-slate-700">Penyambut:</span> {item.penerimaTamu}</div>}
                    </td>
                    <td className="border border-slate-300 p-2 text-[9px] text-slate-600">
                      {item.wartaKhusus || item.keteranganKhusus || '-'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Footer Tanda Tangan & Informasi */}
          <div className="flex justify-between items-end text-[11px] pt-4 border-t border-slate-200">
            <div className="text-slate-500 space-y-1">
              <div>* Jadwal dapat mengalami penyesuaian berdasarkan warta jemaat terkini.</div>
              <div>* Dokumen ini dibuat otomatis oleh Sistem Informasi Majelis Jemaat GKE.</div>
            </div>
            <div className="text-center">
              <div>{settings.kotaGereja || 'Palangka Raya'}, {formatIndonesianDateFull(new Date().toISOString().split('T')[0])}</div>
              <div className="font-bold mt-1 text-slate-800">Majelis Pekerja Harian Jemaat (MPH)</div>
              <div className="h-12 flex items-center justify-center text-slate-400 italic text-[10px]">
                [ Tanda Tangan & Stempel Resmi ]
              </div>
              <div className="font-bold underline text-slate-900">
                {settings.namaKetuaMPH || 'Ketua MPH Jemaat'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Generator Jadwal Tahunan Modal */}
      {isGeneratorModalOpen && (
        <GeneratorJadwalTahunBerikutnyaModal
          isOpen={isGeneratorModalOpen}
          onClose={() => setIsGeneratorModalOpen(false)}
          existingJadwalList={jadwalIbadahList}
          lingkunganList={lingkunganList}
          penatuaDiakonList={penatuaDiakonList}
          wargaJemaatList={wargaJemaatList}
          onBatchSave={batchAddJadwalIbadah}
        />
      )}

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 animate-slideUp">
          <div className="flex items-center gap-2.5 px-4 py-3 bg-slate-900/95 border border-emerald-500/40 text-emerald-300 text-xs font-semibold rounded-2xl shadow-xl backdrop-blur-md">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}
    </div>
  );
};
