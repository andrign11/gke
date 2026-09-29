import React, { useState } from 'react';
import {
  AlertCircle,
  ArrowDownCircle,
  ArrowUpCircle,
  Award,
  Bell,
  BookMarked,
  BookOpen,
  Briefcase,
  Building,
  Building2,
  Cake,
  Calendar,
  Check,
  CheckCircle2,
  ChevronRight,
  Church,
  Clock,
  Code2,
  DollarSign,
  Download,
  FileText,
  Filter,
  GitFork,
  GraduationCap,
  Heart,
  Layers,
  LogOut,
  Mail,
  MapPin,
  MessageCircle,
  Package,
  Phone,
  PhoneOff,
  Plus,
  Printer,
  QrCode,
  RefreshCw,
  ScrollText,
  Search,
  Send,
  Share2,
  ShieldCheck,
  Sparkles,
  Tag,
  TrendingDown,
  TrendingUp,
  Upload,
  User,
  UserCheck,
  UserPlus,
  Users,
  Users2,
  X,
  XCircle,
  FileCheck2,
  Copy,
  Eye,
  Maximize2,
  CreditCard,
  Smartphone,
  Landmark,
  Gift,
  HeartHandshake,
  HelpCircle,
  Wallet,
} from 'lucide-react';
import defaultGkeLogo from '../../assets/images/gke_logo_official_1785341836111.jpg';
import { useApp } from '../../context/AppContext';
import { QrisPersembahanModal } from '../QrisPersembahanModal';
import { AlmanakNastModule } from '../modules/AlmanakNastModule';
import { AlkitabModule } from '../modules/AlkitabModule';
import { SuratPelimpahanModule } from '../modules/SuratPelimpahanModule';
import { SuratModule } from '../modules/SuratModule';
import { TutorialModule } from '../modules/TutorialModule';
import { KeuanganItem, RancanganKhotbah, BeritaJemaat, PelayananSakramen, JadwalKatekisasi, PengurusKategorial, KegiatanKategorial } from '../../types';
import { downloadReceiptAsImage, shareReceiptToWhatsApp } from '../../utils/generateReceiptImage';
import { getQrisImageSource } from '../../utils/qrisUtils';
import {
  isNikahWithinOneMonth,
  isDukaWithinTwoWeeks,
  isWartaWithinTwoWeeks,
  isWartaWithinOneMonth,
} from '../../utils/dateUtils';

export const PublicPortal: React.FC = () => {
  const {
    settings,
    penatuaDiakonList,
    keuanganList,
    addKeuanganItem,
    wargaJemaatList,
    jadwalIbadahList,
    mphList,
    inventarisList,
    renunganList,
    pendaftaranList,
    addPendaftaran,
    openPrintReport,
    setViewMode,
    lingkunganList,
    beritaJemaatList,
    rancanganKhotbahList,
    pelayananSakramenList,
    jadwalKatekisasiList,
    pengurusKategorialList,
    kegiatanKategorialList,
    pengurusPembangunanList,
    proyekPembangunanList,
    currentUser,
    logout,
    isMobileMenuOpen,
    setIsMobileMenuOpen,
    activePortalTab,
    setActivePortalTab,
  } = useApp();

  const [portalPosKas, setPortalPosKas] = useState<string>('semua');
  const [isQrisModalOpen, setIsQrisModalOpen] = useState<boolean>(false);

  // Helper untuk mengecek visibilitas halaman (Enabled/Disabled dari Pengaturan Admin)
  const isPageEnabled = (pageKey: string): boolean => {
    if (!settings?.portalPageVisibility) return true;
    return settings.portalPageVisibility[pageKey] !== false;
  };

  // Auto fallback jika halaman yang sedang dibuka diset Disabled oleh Admin
  React.useEffect(() => {
    if (activePortalTab && !isPageEnabled(activePortalTab)) {
      setActivePortalTab('beranda');
    }
  }, [activePortalTab, settings?.portalPageVisibility]);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRayonFilter, setSelectedRayonFilter] = useState('semua');
  const [selectedKjjInput, setSelectedKjjInput] = useState('KJJ-0101-0021');

  // Filter state for new portal tabs
  const [activeKategorialSeksi, setActiveKategorialSeksi] = useState<'SPB' | 'SPPer' | 'SPPR/P' | 'ASHM'>('SPB');
  const [kategorialSearch, setKategorialSearch] = useState<string>('');
  const [selectedKegiatanModal, setSelectedKegiatanModal] = useState<KegiatanKategorial | null>(null);
  const [jadwalCategoryFilter, setJadwalCategoryFilter] = useState<'semua' | 'umum' | 'kategorial' | 'rayon'>('semua');
  const [jadwalSearch, setJadwalSearch] = useState<string>('');
  const [sakramenFilter, setSakramenFilter] = useState<string>('semua');
  const [sakramenSearch, setSakramenSearch] = useState<string>('');
  const [selectedSakramenModal, setSelectedSakramenModal] = useState<PelayananSakramen | null>(null);
  const [katekisasiFilter, setKatekisasiFilter] = useState<string>('semua');
  const [katekisasiSearch, setKatekisasiSearch] = useState<string>('');
  const [selectedKatekisasiModal, setSelectedKatekisasiModal] = useState<JadwalKatekisasi | null>(null);
  const [ulangTahunFilter, setUlangTahunFilter] = useState<'semua' | 'lahir' | 'pernikahan'>('semua');
  const [ulangTahunSearch, setUlangTahunSearch] = useState<string>('');
  const [wartaSearch, setWartaSearch] = useState('');
  const [selectedWartaDetail, setSelectedWartaDetail] = useState<BeritaJemaat | null>(null);
  const [copiedWartaId, setCopiedWartaId] = useState<string | null>(null);

  // Helper untuk mendapatkan nama Majelis Jemaat terformat dari pengaturan aplikasi
  const formattedMajelisJemaat = React.useMemo(() => {
    const raw = (settings?.namaJemaat || '').trim();
    if (!raw) return 'GKE';
    const stripped = raw.replace(/^(Majelis\s+Jemaat\s+GKE|Majelis\s+Jemaat|Jemaat\s+GKE|GKE|Jemaat)\s+/i, '').trim();
    return stripped || raw;
  }, [settings?.namaJemaat]);

  // Helper & Memo: Selalu urutkan Warta Jemaat agar Edisi Terbaru / Terakhir selalu tampil pertama
  const sortedBeritaJemaatList = React.useMemo(() => {
    if (!beritaJemaatList || beritaJemaatList.length === 0) return [];

    const parseDate = (dStr?: string) => {
      if (!dStr) return 0;
      const parsed = Date.parse(dStr);
      if (!isNaN(parsed) && parsed > 0) return parsed;
      const indoMonths: Record<string, string> = {
        januari: '01', februari: '02', maret: '03', april: '04', mei: '05', juni: '06',
        juli: '07', agustus: '08', september: '09', oktober: '10', november: '11', desember: '12',
        jan: '01', feb: '02', mar: '03', apr: '04', jun: '06', jul: '07', ags: '08', agu: '08',
        sep: '09', okt: '10', nov: '11', des: '12'
      };
      const tokens = dStr.toLowerCase().replace(/[.,/\\-]/g, ' ').split(/\s+/).filter(Boolean);
      const yearToken = tokens.find((t) => /^\d{4}$/.test(t));
      const dayToken = tokens.find((t) => /^\d{1,2}$/.test(t));
      const monthToken = tokens.find((t) => indoMonths[t]);

      if (yearToken && monthToken && dayToken) {
        const m = indoMonths[monthToken];
        const d = dayToken.padStart(2, '0');
        const res = Date.parse(`${yearToken}-${m}-${d}`);
        if (!isNaN(res)) return res;
      }
      return 0;
    };

    return [...beritaJemaatList].sort((a, b) => {
      // 1. Prioritaskan warta dengan status 'Diterbitkan' di portal publik
      if (a.status === 'Diterbitkan' && b.status !== 'Diterbitkan') return -1;
      if (b.status === 'Diterbitkan' && a.status !== 'Diterbitkan') return 1;

      // 2. Urutkan berdasarkan tanggal terbit (tanggal edisi terbaru di atas)
      const dateA = parseDate(a.tanggalTerbit || (a as any).tanggal);
      const dateB = parseDate(b.tanggalTerbit || (b as any).tanggal);
      if (dateA && dateB && dateA !== dateB) return dateB - dateA;

      // 3. Urutkan berdasarkan nomor urut edisi (contoh: 034 > 033)
      const numA = parseInt((a.nomorEdisi || '').replace(/\D/g, ''), 10) || 0;
      const numB = parseInt((b.nomorEdisi || '').replace(/\D/g, ''), 10) || 0;
      if (numA !== numB) return numB - numA;

      // 4. Fallback ke timestamp publishedAt / createdAt
      const timeA = (a as any).publishedAt ? new Date((a as any).publishedAt).getTime() : ((a as any).createdAt ? new Date((a as any).createdAt).getTime() : 0);
      const timeB = (b as any).publishedAt ? new Date((b as any).publishedAt).getTime() : ((b as any).createdAt ? new Date((b as any).createdAt).getTime() : 0);
      if (timeA && timeB && timeA !== timeB) return timeB - timeA;

      return 0;
    });
  }, [beritaJemaatList]);

  // Edisi Warta Jemaat Terbaru / Terakhir
  const latestWarta = sortedBeritaJemaatList.length > 0 ? sortedBeritaJemaatList[0] : null;

  // Filtered Berita Duka (Masa warta 2 minggu setelah diterbitkan warta jemaat)
  const isLatestWartaDukaActive = latestWarta ? isWartaWithinTwoWeeks(latestWarta.tanggalTerbit) : false;
  const latestFilteredDukaList = latestWarta && isLatestWartaDukaActive
    ? (latestWarta.beritaDukaList || []).filter((d) =>
        isDukaWithinTwoWeeks(
          (d as any).tanggalMeninggal || (d as any).tglMeninggal || (d as any).tanggal,
          latestWarta.tanggalTerbit
        )
      )
    : [];

  // Filtered Undangan Pernikahan (Hanya menampilkan data 1 bulan setelah diterbitkannya warta jemaat)
  const latestFilteredNikahList = latestWarta
    ? (latestWarta.undanganPernikahanList || []).filter((p) =>
        isNikahWithinOneMonth(
          (p as any).tanggalPemberkatan || (p as any).tglPemberkatan || (p as any).tanggal,
          latestWarta.tanggalTerbit
        )
      )
    : [];

  // Halaman Persembahan Digital QRIS & GoPay State
  const [digitalMethod, setDigitalMethod] = useState<'qris' | 'gopay' | 'bank'>('qris');
  const [digitalKategori, setDigitalKategori] = useState<KeuanganItem['kategori']>('Persembahan Minggu');
  const [digitalPosKas, setDigitalPosKas] = useState<KeuanganItem['posKas']>('Kas Umum');
  const [digitalNominal, setDigitalNominal] = useState<number>(50000);
  const [digitalCustomNominal, setDigitalCustomNominal] = useState<string>('');
  const [digitalNamaPengirim, setDigitalNamaPengirim] = useState<string>('Hamba Allah / Anonim');
  const [digitalIsAnonim, setDigitalIsAnonim] = useState<boolean>(true);
  const [digitalNoHp, setDigitalNoHp] = useState<string>('');
  const [digitalKeterangan, setDigitalKeterangan] = useState<string>('');
  const [digitalActiveStep, setDigitalActiveStep] = useState<'form' | 'qris_display'>('form');
  const [digitalGeneratedRef, setDigitalGeneratedRef] = useState<string>('');
  const [digitalCopied, setDigitalCopied] = useState<string | null>(null);
  const [khotbahSearch, setKhotbahSearch] = useState('');
  const [selectedKhotbahDetail, setSelectedKhotbahDetail] = useState<RancanganKhotbah | null>(null);
  const [copiedKhotbahId, setCopiedKhotbahId] = useState<string | null>(null);
  const [pendaftaranSearch, setPendaftaranSearch] = useState('');
  const [showPendaftaranSuccess, setShowPendaftaranSuccess] = useState(false);
  const [showPendaftaranModal, setShowPendaftaranModal] = useState(false);
  const [lastPendaftaranData, setLastPendaftaranData] = useState<{
    namaLengkap: string;
    nik: string;
    noKjj: string;
    rayon: string;
    hubunganKeluarga: string;
    tanggalDaftar: string;
    noHp?: string;
    alamat?: string;
  } | null>(null);
  const [asetSearch, setAsetSearch] = useState('');
  const [asetCategoryFilter, setAsetCategoryFilter] = useState('semua');

  // Notification & Persembahan Verification System State
  const [notifSearch, setNotifSearch] = useState('');
  const [notifFilterStatus, setNotifFilterStatus] = useState<'semua' | 'pending' | 'disetujui' | 'ditolak'>('semua');
  const [isSubmitResiOpen, setIsSubmitResiOpen] = useState(false);
  const [showResiSuccessToast, setShowResiSuccessToast] = useState(false);
  const [lastSubmittedRefNo, setLastSubmittedRefNo] = useState<string>('');
  const [submittedWaUrl, setSubmittedWaUrl] = useState<string>('');
  const [selectedReceiptForPrint, setSelectedReceiptForPrint] = useState<KeuanganItem | null>(null);
  const [waShareNotice, setWaShareNotice] = useState<string | null>(null);

  // Lingkungan & Sektor Pelayanan State in Public Portal
  const [lingkunganSearch, setLingkunganSearch] = useState('');
  const [lingkunganStatusFilter, setLingkunganStatusFilter] = useState<'Semua' | 'Aktif' | 'Nonaktif'>('Semua');
  const [selectedLingkunganModal, setSelectedLingkunganModal] = useState<any | null>(null);
  const [lingkunganModalSearch, setLingkunganModalSearch] = useState('');

  // Helper function to match warga with a Lingkungan
  const getWargaForLingkungan = (lingk: any) => {
    if (!lingk) return [];
    return wargaJemaatList.filter((w) => {
      if (!w.rayon) return false;
      const rayonTrim = w.rayon.trim().toLowerCase();
      const namaTrim = (lingk.nama || lingk.namaLingkungan || '').trim().toLowerCase();
      const kodeTrim = (lingk.kode || '').trim().toLowerCase();
      if (rayonTrim === namaTrim || (kodeTrim && rayonTrim === kodeTrim)) return true;
      if (namaTrim && (rayonTrim.includes(namaTrim) || namaTrim.includes(rayonTrim))) return true;
      if (kodeTrim && (rayonTrim.includes(kodeTrim) || kodeTrim.includes(rayonTrim))) return true;

      // Roman vs digit matcher (e.g., 'Lingkungan 1' vs 'Rayon I')
      const romanMap: Record<string, number> = { i: 1, ii: 2, iii: 3, iv: 4, v: 5, vi: 6, vii: 7, viii: 8, ix: 9, x: 10 };
      const getNum = (str: string) => {
        const parts = str.toLowerCase().split(/[\s\-_]+/);
        for (const p of parts) {
          if (romanMap[p]) return romanMap[p];
          const m = p.match(/\d+/);
          if (m) return parseInt(m[0], 10);
        }
        return null;
      };
      const nW = getNum(rayonTrim);
      const nL = getNum(namaTrim) || getNum(kodeTrim);
      if (nW !== null && nL !== null && nW === nL) return true;

      return false;
    });
  };

  // Helper function to match penatua & diakon with a Lingkungan
  const getPenatuaForLingkungan = (lingk: any) => {
    if (!lingk) return [];
    return penatuaDiakonList.filter((p) => {
      if (!p.rayon) return false;
      const rayonTrim = p.rayon.trim().toLowerCase();
      const namaTrim = (lingk.nama || lingk.namaLingkungan || '').trim().toLowerCase();
      const kodeTrim = (lingk.kode || '').trim().toLowerCase();
      if (rayonTrim === namaTrim || (kodeTrim && rayonTrim === kodeTrim)) return true;
      if (namaTrim && (rayonTrim.includes(namaTrim) || namaTrim.includes(rayonTrim))) return true;
      if (kodeTrim && (rayonTrim.includes(kodeTrim) || kodeTrim.includes(rayonTrim))) return true;
      return false;
    });
  };

  // Form Unggah Resi State
  const [resiFormData, setResiFormData] = useState({
    namaPengirim: '',
    kategori: 'Persembahan Minggu' as KeuanganItem['kategori'],
    posKas: 'Kas Umum' as KeuanganItem['posKas'],
    jumlah: 50000,
    tanggal: new Date().toISOString().split('T')[0],
    noHp: '',
    catatan: '',
    fileResi: '',
  });

  const handleResiFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setResiFormData((prev) => ({ ...prev, fileResi: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleResiSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resiFormData.namaPengirim || !resiFormData.jumlah || resiFormData.jumlah <= 0) {
      alert('Mohon isi Nama Pengirim dan Nominal Persembahan dengan benar!');
      return;
    }

    const refNo = `RESI-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`;

    addKeuanganItem({
      tanggal: resiFormData.tanggal || new Date().toISOString().split('T')[0],
      jenis: 'pemasukan',
      posKas: resiFormData.posKas,
      kategori: resiFormData.kategori,
      jumlah: Number(resiFormData.jumlah),
      keterangan: `[Resi Bukti Persembahan Digital] ${resiFormData.catatan ? resiFormData.catatan + ' - ' : ''}Pengirim: ${resiFormData.namaPengirim}${resiFormData.noHp ? ' (WA: ' + resiFormData.noHp + ')' : ''}`,
      noReferensi: refNo,
      disetujuiOleh: 'Menunggu Konfirmasi Admin/Bendahara',
      status: 'pending',
    });

    // Save to localStorage for quick highlight
    try {
      const savedResis = JSON.parse(localStorage.getItem('gke_my_resis') || '[]');
      savedResis.unshift(refNo);
      localStorage.setItem('gke_my_resis', JSON.stringify(savedResis.slice(0, 20)));
    } catch {
      // ignore
    }

    // Format WA notification message for admin
    const rawAdminPhone = (settings.noWhatsappAdmin || settings.gopayAccountNumber || '081255667788').replace(/\D/g, '');
    const formattedPhone = rawAdminPhone.startsWith('0') ? '62' + rawAdminPhone.slice(1) : rawAdminPhone || '6281255667788';

    const waMsg =
      `*NOTIFIKASI OTOMATIS BUKTI RESI PERSEMBAHAN DIGITAL*\n` +
      `*${(settings?.namaJemaat || 'MAJELIS JEMAAT GKE').toUpperCase()}*\n` +
      `====================================\n` +
      `📄 *No. Referensi:* ${refNo}\n` +
      `📅 *Tanggal:* ${resiFormData.tanggal || new Date().toISOString().split('T')[0]}\n` +
      `👤 *Nama Pengirim:* ${resiFormData.namaPengirim}\n` +
      `📱 *No. WA Pengirim:* ${resiFormData.noHp || '-'}\n` +
      `🏷️ *Kategori:* ${resiFormData.kategori}\n` +
      `🏦 *Pos Kas:* ${resiFormData.posKas}\n` +
      `💰 *Nominal:* Rp ${Number(resiFormData.jumlah).toLocaleString('id-ID')}\n` +
      `📝 *Catatan/Doa:* ${resiFormData.catatan || '-'}\n` +
      `====================================\n` +
      `Syalom Bapak/Ibu Admin & Bendahara, warga jemaat atas nama *${resiFormData.namaPengirim}* telah mengirimkan bukti resi persembahan digital baru. Mohon bantuan verifikasi di SIKJ. Terima kasih, Tuhan memberkati!`;

    const waUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(waMsg)}`;

    setLastSubmittedRefNo(refNo);
    setSubmittedWaUrl(waUrl);

    // Automatically trigger WA window launch for seamless notification
    try {
      window.open(waUrl, '_blank');
    } catch (err) {
      console.warn('WA popup open prevented:', err);
    }

    setIsSubmitResiOpen(false);
    setShowResiSuccessToast(true);

    // Reset form
    setResiFormData({
      namaPengirim: '',
      kategori: 'Persembahan Minggu',
      posKas: 'Kas Umum',
      jumlah: 50000,
      tanggal: new Date().toISOString().split('T')[0],
      noHp: '',
      catatan: '',
      fileResi: '',
    });
  };

  // Notification calculations
  const allPersembahanResi = keuanganList.filter((k) => k.jenis === 'pemasukan');

  const pendingCount = allPersembahanResi.filter(
    (k) => k.status === 'pending' || k.disetujuiOleh?.includes('Menunggu')
  ).length;

  const verifiedCount = allPersembahanResi.filter(
    (k) => k.status === 'disetujui' || (!k.status && !k.disetujuiOleh?.includes('Menunggu'))
  ).length;

  const rejectedCount = allPersembahanResi.filter((k) => k.status === 'ditolak').length;

  let mySavedResisList: string[] = [];
  try {
    mySavedResisList = JSON.parse(localStorage.getItem('gke_my_resis') || '[]');
  } catch {
    mySavedResisList = [];
  }

  const filteredNotifList = allPersembahanResi.filter((item) => {
    const isPending = item.status === 'pending' || item.disetujuiOleh?.includes('Menunggu');
    const isVerified = item.status === 'disetujui' || (!item.status && !item.disetujuiOleh?.includes('Menunggu'));
    const isRejected = item.status === 'ditolak';

    if (notifFilterStatus === 'pending' && !isPending) return false;
    if (notifFilterStatus === 'disetujui' && !isVerified) return false;
    if (notifFilterStatus === 'ditolak' && !isRejected) return false;

    if (!notifSearch.trim()) return true;
    const q = notifSearch.toLowerCase();
    return (
      (item.noReferensi || '').toLowerCase().includes(q) ||
      (item.keterangan || '').toLowerCase().includes(q) ||
      (item.kategori || '').toLowerCase().includes(q) ||
      (item.posKas || '').toLowerCase().includes(q)
    );
  });

  // Pendaftaran Form Data State
  const [pendaftaranFormData, setPendaftaranFormData] = useState({
    namaLengkap: '',
    nik: '',
    noKjj: `KJJ-010${Math.floor(1 + Math.random() * 5)}-00${Math.floor(10 + Math.random() * 89)}`,
    jenisKelamin: 'L' as 'L' | 'P',
    tempatLahir: 'Palangka Raya',
    tanggalLahir: '1995-05-15',
    rayon: 'Lingkungan I - Ebenezer',
    statusKeanggotaan: 'Tetap' as 'Tetap' | 'Titipan' | 'Pindah',
    statusBaptis: true,
    statusSidi: true,
    statusNikah: 'Belum Menikah' as 'Belum Menikah' | 'Menikah' | 'Janda' | 'Duda',
    pekerjaan: '',
    alamat: '',
    noHp: '',
    hubunganKeluarga: 'Kepala Keluarga' as 'Kepala Keluarga' | 'Istri' | 'Anak' | 'Famili Lain',
    catatanTambahan: '',
  });

  const handlePendaftaranSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendaftaranFormData.namaLengkap || !pendaftaranFormData.nik || !pendaftaranFormData.alamat) {
      alert('Mohon isi Nama Lengkap, NIK (16 Digit), dan Alamat Domisili!');
      return;
    }
    const todayDate = new Date().toISOString().split('T')[0];
    const newRegistrationItem = {
      ...pendaftaranFormData,
      tanggalDaftar: todayDate,
      statusKonfirmasiMPH: 'Menunggu Konfirmasi' as const,
    };
    addPendaftaran(newRegistrationItem);
    setLastPendaftaranData({
      namaLengkap: pendaftaranFormData.namaLengkap,
      nik: pendaftaranFormData.nik,
      noKjj: pendaftaranFormData.noKjj || '-',
      rayon: pendaftaranFormData.rayon || '-',
      hubunganKeluarga: pendaftaranFormData.hubunganKeluarga || 'Kepala Keluarga',
      tanggalDaftar: todayDate,
      noHp: pendaftaranFormData.noHp,
      alamat: pendaftaranFormData.alamat,
    });
    setShowPendaftaranSuccess(true);
    setShowPendaftaranModal(true);
    setPendaftaranFormData({
      namaLengkap: '',
      nik: '',
      noKjj: `KJJ-010${Math.floor(1 + Math.random() * 5)}-00${Math.floor(10 + Math.random() * 89)}`,
      jenisKelamin: 'L',
      tempatLahir: 'Palangka Raya',
      tanggalLahir: '1995-05-15',
      rayon: 'Lingkungan I - Ebenezer',
      statusKeanggotaan: 'Tetap',
      statusBaptis: true,
      statusSidi: true,
      statusNikah: 'Belum Menikah',
      pekerjaan: '',
      alamat: '',
      noHp: '',
      hubunganKeluarga: 'Kepala Keluarga',
      catatanTambahan: '',
    });
  };

  // Financial Stats
  const displayKeuanganList = keuanganList.filter(
    (k) => portalPosKas === 'semua' || (k.posKas || 'Kas Umum') === portalPosKas
  );

  const totalPemasukan = displayKeuanganList
    .filter((k) => k.jenis === 'pemasukan')
    .reduce((acc, curr) => acc + curr.jumlah, 0);

  const totalPengeluaran = displayKeuanganList
    .filter((k) => k.jenis === 'pengeluaran')
    .reduce((acc, curr) => acc + curr.jumlah, 0);

  const saldoKas = totalPemasukan - totalPengeluaran;

  const totalNilaiAset = inventarisList.reduce(
    (sum, item) => sum + item.nilaiAset * item.kuantitas,
    0
  );

  const totalWarga = wargaJemaatList.length;
  const totalKK = new Set(wargaJemaatList.map((w) => w.noKjj)).size;

  return (
    <div className="public-portal-container min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans flex flex-col lg:flex-row w-full relative">
      {/* Mobile Backdrop Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Warga Jemaat Sidebar Component - Full Top-to-Bottom */}
      <aside
        className={`fixed lg:sticky top-0 left-0 z-50 lg:z-20 h-screen lg:h-[calc(100vh-4rem)] w-64 md:w-72 bg-slate-950 text-slate-300 border-r border-slate-800 flex flex-col transition-transform duration-300 ease-in-out p-3.5 sm:p-4 space-y-4 flex-shrink-0 shadow-2xl lg:shadow-xl overflow-y-auto rounded-none ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Header & User Info */}
        <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-800/80 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
                <Church className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="font-extrabold text-white text-xs truncate">Warga Jemaat</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(false)}
              className="lg:hidden text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Nama User */}
          <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px]">
            <span className="text-slate-400 font-semibold">Nama User:</span>
            <span className="text-white font-extrabold truncate max-w-[140px]" title={currentUser?.namaLengkap || currentUser?.namaPanggilan || currentUser?.username || (currentUser as any)?.name || 'Tamu / Warga'}>
              {currentUser?.namaLengkap || currentUser?.namaPanggilan || currentUser?.username || (currentUser as any)?.name || 'Tamu / Warga'}
            </span>
          </div>

          {/* Akses User */}
          <div className="pt-1.5 border-t border-slate-800/60 flex items-center justify-between text-[11px]">
            <span className="text-slate-400 font-semibold">Akses User:</span>
            <span className="bg-blue-500/15 text-blue-300 border border-blue-500/30 text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 capitalize">
              <UserCheck className="w-3 h-3 text-blue-400" />
              <span>{currentUser?.role ? currentUser.role : 'Guest / Publik'}</span>
            </span>
          </div>
        </div>

        {/* Grouped Sidebar Menus */}
        <nav className="flex-1 space-y-4 text-xs font-semibold">
          {/* Group 1: Ibadah & Firman Tuhan */}
          <div className="space-y-1">
            <p className="px-2.5 text-[10px] font-extrabold tracking-wider text-slate-500 uppercase">
              Ibadah &amp; Firman Tuhan
            </p>
            <div className="space-y-1 mt-1">
              {isPageEnabled('beranda') && (
                <button
                  type="button"
                  onClick={() => {
                    setActivePortalTab('beranda');
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    activePortalTab === 'beranda'
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-600/25 border border-blue-500/30 font-bold'
                      : 'text-slate-400 hover:bg-slate-900 hover:text-slate-100 hover:translate-x-0.5'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Church className={`w-4 h-4 ${activePortalTab === 'beranda' ? 'text-white' : 'text-slate-400'}`} />
                    <span>Beranda</span>
                  </div>
                </button>
              )}

              {isPageEnabled('warta_jemaat') && (
                <button
                  type="button"
                  onClick={() => {
                    setActivePortalTab('warta_jemaat');
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    activePortalTab === 'warta_jemaat'
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-600/25 border border-blue-500/30 font-bold'
                      : 'text-slate-400 hover:bg-slate-900 hover:text-slate-100 hover:translate-x-0.5'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <FileText className={`w-4 h-4 ${activePortalTab === 'warta_jemaat' ? 'text-white' : 'text-blue-400'}`} />
                    <span>Warta Jemaat</span>
                  </div>
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-blue-500/15 text-blue-900 border border-blue-500/30 font-bold">
                    Cetak
                  </span>
                </button>
              )}

              {isPageEnabled('jadwal') && (
                <button
                  type="button"
                  onClick={() => {
                    setActivePortalTab('jadwal');
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    activePortalTab === 'jadwal'
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-600/25 border border-blue-500/30 font-bold'
                      : 'text-slate-400 hover:bg-slate-900 hover:text-slate-100 hover:translate-x-0.5'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Calendar className={`w-4 h-4 ${activePortalTab === 'jadwal' ? 'text-white' : 'text-slate-400'}`} />
                    <span>Jadwal Ibadah &amp; Pelayanan</span>
                  </div>
                </button>
              )}

              {isPageEnabled('almanak_nast') && (
                <button
                  type="button"
                  onClick={() => {
                    setActivePortalTab('almanak_nast');
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    activePortalTab === 'almanak_nast'
                      ? 'bg-gradient-to-r from-rose-600 to-rose-700 text-white shadow-md shadow-rose-600/25 border border-rose-500/30 font-bold'
                      : 'text-rose-300/90 hover:bg-slate-900 hover:text-rose-200 hover:translate-x-0.5'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Calendar className={`w-4 h-4 ${activePortalTab === 'almanak_nast' ? 'text-white' : 'text-rose-400'}`} />
                    <span>Almanak Nast</span>
                  </div>
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-bold border border-rose-500/30">
                    GKE
                  </span>
                </button>
              )}

              {isPageEnabled('rancangan_khotbah') && (
                <button
                  type="button"
                  onClick={() => {
                    setActivePortalTab('rancangan_khotbah');
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    activePortalTab === 'rancangan_khotbah'
                      ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md border border-indigo-500/30 font-bold'
                      : 'text-slate-400 hover:bg-slate-900 hover:text-slate-100 hover:translate-x-0.5'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <ScrollText className={`w-4 h-4 ${activePortalTab === 'rancangan_khotbah' ? 'text-white' : 'text-indigo-400'}`} />
                    <span>Rancangan Khotbah</span>
                  </div>
                </button>
              )}

              {isPageEnabled('renungan') && (
                <button
                  type="button"
                  onClick={() => {
                    setActivePortalTab('renungan');
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    activePortalTab === 'renungan'
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-600/25 border border-blue-500/30 font-bold'
                      : 'text-slate-400 hover:bg-slate-900 hover:text-slate-100 hover:translate-x-0.5'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <BookOpen className={`w-4 h-4 ${activePortalTab === 'renungan' ? 'text-white' : 'text-slate-400'}`} />
                    <span>Buletin &amp; Renungan Harian</span>
                  </div>
                </button>
              )}

              {isPageEnabled('alkitab') && (
                <button
                  type="button"
                  onClick={() => {
                    setActivePortalTab('alkitab');
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    activePortalTab === 'alkitab'
                      ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-600/25 border border-indigo-500/30 font-bold'
                      : 'text-indigo-300/90 hover:bg-slate-900 hover:text-indigo-100 hover:translate-x-0.5'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <BookMarked className={`w-4 h-4 ${activePortalTab === 'alkitab' ? 'text-white' : 'text-indigo-400'}`} />
                    <span>Alkitab</span>
                  </div>
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-bold border border-indigo-500/30">
                    TB
                  </span>
                </button>
              )}
            </div>
          </div>

          {/* Group 2: Keanggotaan & Layanan Jemaat */}
          <div className="space-y-1">
            <p className="px-2.5 text-[10px] font-extrabold tracking-wider text-slate-500 uppercase">
              Keanggotaan &amp; Layanan Jemaat
            </p>
            <div className="space-y-1 mt-1">
              {isPageEnabled('pendaftaran') && (
                <button
                  type="button"
                  onClick={() => {
                    setActivePortalTab('pendaftaran');
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    activePortalTab === 'pendaftaran'
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md border border-blue-500/30 font-bold'
                      : 'text-blue-300 hover:bg-slate-900 hover:text-blue-200 hover:translate-x-0.5'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <UserPlus className={`w-4 h-4 ${activePortalTab === 'pendaftaran' ? 'text-white' : 'text-blue-400'}`} />
                    <span>Pendaftaran Anggota Jemaat</span>
                  </div>
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30 font-bold">
                    Form
                  </span>
                </button>
              )}

              {isPageEnabled('kartu_keluarga') && (
                <button
                  type="button"
                  onClick={() => {
                    setActivePortalTab('kartu_keluarga');
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    activePortalTab === 'kartu_keluarga'
                      ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md border border-emerald-500/30 font-bold'
                      : 'text-slate-400 hover:bg-slate-900 hover:text-slate-100 hover:translate-x-0.5'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <GitFork className={`w-4 h-4 ${activePortalTab === 'kartu_keluarga' ? 'text-white' : 'text-emerald-400'}`} />
                    <span>Kartu Keluarga Jemaat (KKJ)</span>
                  </div>
                </button>
              )}

              {isPageEnabled('sensus') && (
                <button
                  type="button"
                  onClick={() => {
                    setActivePortalTab('sensus');
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    activePortalTab === 'sensus'
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md border border-blue-500/30 font-bold'
                      : 'text-slate-400 hover:bg-slate-900 hover:text-slate-100 hover:translate-x-0.5'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Users className={`w-4 h-4 ${activePortalTab === 'sensus' ? 'text-white' : 'text-slate-400'}`} />
                    <span>Data Warga Jemaat</span>
                  </div>
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30 font-bold">
                    Sensus
                  </span>
                </button>
              )}

              {isPageEnabled('lingkungan_sektor') && (
                <button
                  type="button"
                  onClick={() => {
                    setActivePortalTab('lingkungan_sektor');
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    activePortalTab === 'lingkungan_sektor'
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md border border-blue-500/30 font-bold'
                      : 'text-slate-400 hover:bg-slate-900 hover:text-slate-100 hover:translate-x-0.5'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <MapPin className={`w-4 h-4 ${activePortalTab === 'lingkungan_sektor' ? 'text-white' : 'text-emerald-400'}`} />
                    <span>Data Lingkungan &amp; Sektor</span>
                  </div>
                </button>
              )}

              {isPageEnabled('ulang_tahun') && (
                <button
                  type="button"
                  onClick={() => {
                    setActivePortalTab('ulang_tahun');
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    activePortalTab === 'ulang_tahun'
                      ? 'bg-gradient-to-r from-rose-600 to-pink-600 text-white shadow-md border border-rose-500/30 font-bold'
                      : 'text-slate-400 hover:bg-slate-900 hover:text-slate-100 hover:translate-x-0.5'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Cake className={`w-4 h-4 ${activePortalTab === 'ulang_tahun' ? 'text-white' : 'text-rose-400'}`} />
                    <span>HUT Kelahiran &amp; Pernikahan</span>
                  </div>
                </button>
              )}
            </div>
          </div>

          {/* Group 3: Sakramen, Pembinaan & Kategorial */}
          <div className="space-y-1">
            <p className="px-2.5 text-[10px] font-extrabold tracking-wider text-slate-500 uppercase">
              Sakramen, Pembinaan &amp; Kategorial
            </p>
            <div className="space-y-1 mt-1">
              {isPageEnabled('sakramen_sidi') && (
                <button
                  type="button"
                  onClick={() => {
                    setActivePortalTab('sakramen_sidi');
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    activePortalTab === 'sakramen_sidi'
                      ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md border border-purple-500/30 font-bold'
                      : 'text-slate-400 hover:bg-slate-900 hover:text-slate-100 hover:translate-x-0.5'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Heart className={`w-4 h-4 ${activePortalTab === 'sakramen_sidi' ? 'text-white' : 'text-purple-400'}`} />
                    <span>Data Pernikahan, Baptis &amp; Sidi</span>
                  </div>
                </button>
              )}

              {isPageEnabled('katekisasi') && (
                <button
                  type="button"
                  onClick={() => {
                    setActivePortalTab('katekisasi');
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    activePortalTab === 'katekisasi'
                      ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md border border-purple-500/30 font-bold'
                      : 'text-slate-400 hover:bg-slate-900 hover:text-slate-100 hover:translate-x-0.5'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <GraduationCap className={`w-4 h-4 ${activePortalTab === 'katekisasi' ? 'text-white' : 'text-purple-400'}`} />
                    <span>Katekisasi Sidi &amp; Pernikahan</span>
                  </div>
                </button>
              )}

              {isPageEnabled('kategorial') && (
                <button
                  type="button"
                  onClick={() => {
                    setActivePortalTab('kategorial');
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    activePortalTab === 'kategorial'
                      ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-md border border-blue-500/30 font-bold'
                      : 'text-slate-400 hover:bg-slate-900 hover:text-slate-100 hover:translate-x-0.5'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Users2 className={`w-4 h-4 ${activePortalTab === 'kategorial' ? 'text-white' : 'text-cyan-400'}`} />
                    <span>Pelayanan Kategorial</span>
                  </div>
                </button>
              )}
            </div>
          </div>

          {/* Group 4: Keuangan & Persembahan */}
          <div className="space-y-1">
            <p className="px-2.5 text-[10px] font-extrabold tracking-wider text-slate-500 uppercase">
              Keuangan, Persembahan &amp; Pembangunan
            </p>
            <div className="space-y-1 mt-1">
              {isPageEnabled('persembahan_qris') && (
                <button
                  type="button"
                  onClick={() => {
                    setActivePortalTab('persembahan_qris');
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    activePortalTab === 'persembahan_qris' || activePortalTab === 'persembahan_digital'
                      ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-600/25 border border-emerald-400/40 font-bold'
                      : 'text-emerald-300 hover:bg-slate-900 hover:text-emerald-200 hover:translate-x-0.5'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <QrCode className={`w-4 h-4 ${activePortalTab === 'persembahan_qris' || activePortalTab === 'persembahan_digital' ? 'text-white' : 'text-emerald-400'}`} />
                    <span className="font-bold">Persembahan QRIS &amp; GoPay</span>
                  </div>
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-extrabold border border-emerald-400/40">
                    Digital
                  </span>
                </button>
              )}

              {isPageEnabled('notifikasi_persembahan') && (
                <button
                  type="button"
                  onClick={() => {
                    setActivePortalTab('notifikasi_persembahan');
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    activePortalTab === 'notifikasi_persembahan'
                      ? 'bg-gradient-to-r from-amber-600 to-amber-700 text-white shadow-md border border-amber-500/30 font-bold'
                      : 'text-amber-300/90 hover:bg-slate-900 hover:text-amber-200 hover:translate-x-0.5'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Bell className={`w-4 h-4 ${activePortalTab === 'notifikasi_persembahan' ? 'text-white' : 'text-amber-400'}`} />
                    <span>Verifikasi Persembahan Digital</span>
                  </div>
                  {pendingCount > 0 && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-400 text-slate-950 font-black animate-pulse">
                      {pendingCount}
                    </span>
                  )}
                </button>
              )}

              {isPageEnabled('keuangan') && (
                <button
                  type="button"
                  onClick={() => {
                    setActivePortalTab('keuangan');
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    activePortalTab === 'keuangan'
                      ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md border border-emerald-500/30 font-bold'
                      : 'text-slate-400 hover:bg-slate-900 hover:text-slate-100 hover:translate-x-0.5'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <DollarSign className={`w-4 h-4 ${activePortalTab === 'keuangan' ? 'text-white' : 'text-emerald-400'}`} />
                    <span>Transaksi Keuangan Jemaat</span>
                  </div>
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                    KAS
                  </span>
                </button>
              )}

              {isPageEnabled('panitia_pembangunan') && (
                <button
                  type="button"
                  onClick={() => {
                    setActivePortalTab('panitia_pembangunan');
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    activePortalTab === 'panitia_pembangunan'
                      ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-md border border-amber-500/30 font-bold'
                      : 'text-slate-400 hover:bg-slate-900 hover:text-slate-100 hover:translate-x-0.5'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Building2 className={`w-4 h-4 ${activePortalTab === 'panitia_pembangunan' ? 'text-white' : 'text-amber-400'}`} />
                    <span>Panitia Pembangunan</span>
                  </div>
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-900 font-bold border border-amber-500/30">
                    Progress
                  </span>
                </button>
              )}
            </div>
          </div>

          {/* Group 5: Tata Kelola & Organisasi */}
          <div className="space-y-1">
            <p className="px-2.5 text-[10px] font-extrabold tracking-wider text-slate-500 uppercase">
              Tata Kelola &amp; Organisasi
            </p>
            <div className="space-y-1 mt-1">
              {isPageEnabled('kepengurusan') && (
                <button
                  type="button"
                  onClick={() => {
                    setActivePortalTab('kepengurusan');
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    activePortalTab === 'kepengurusan'
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md border border-blue-500/30 font-bold'
                      : 'text-slate-400 hover:bg-slate-900 hover:text-slate-100 hover:translate-x-0.5'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <ShieldCheck className={`w-4 h-4 ${activePortalTab === 'kepengurusan' ? 'text-white' : 'text-slate-400'}`} />
                    <span>Kepengurusan MPH</span>
                  </div>
                </button>
              )}

              {isPageEnabled('aset') && (
                <button
                  type="button"
                  onClick={() => {
                    setActivePortalTab('aset');
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    activePortalTab === 'aset'
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md border border-blue-500/30 font-bold'
                      : 'text-slate-400 hover:bg-slate-900 hover:text-slate-100 hover:translate-x-0.5'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Package className={`w-4 h-4 ${activePortalTab === 'aset' ? 'text-white' : 'text-slate-400'}`} />
                    <span>Daftar Aset &amp; Inventaris</span>
                  </div>
                </button>
              )}

              {isPageEnabled('agenda_surat') && (
                <button
                  type="button"
                  onClick={() => {
                    setActivePortalTab('agenda_surat');
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    activePortalTab === 'agenda_surat'
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md border border-blue-500/30 font-bold'
                      : 'text-slate-400 hover:bg-slate-900 hover:text-slate-100 hover:translate-x-0.5'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Mail className={`w-4 h-4 ${activePortalTab === 'agenda_surat' ? 'text-white' : 'text-slate-400'}`} />
                    <span>Agenda &amp; Arsip Surat</span>
                  </div>
                </button>
              )}

              {/* BUKU PANDUAN & TUTORIAL PENGGUNAAN */}
              <button
                type="button"
                onClick={() => {
                  setActivePortalTab('panduan');
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  activePortalTab === 'panduan' || activePortalTab === 'tutorial'
                    ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-md border border-indigo-500/40 font-bold'
                    : 'text-slate-400 hover:bg-slate-900 hover:text-slate-100 hover:translate-x-0.5'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <HelpCircle className={`w-4 h-4 ${activePortalTab === 'panduan' || activePortalTab === 'tutorial' ? 'text-white' : 'text-amber-400'}`} />
                  <span>Buku Panduan &amp; Tutorial</span>
                </div>
                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-900 border border-indigo-500/30 font-bold">
                  Bantuan
                </span>
              </button>
            </div>
          </div>
        </nav>

        {/* Footer Action */}
        <div className="pt-3 border-t border-slate-800/80 space-y-2">
          <button
            type="button"
            onClick={() => {
              setIsMobileMenuOpen(false);
              logout();
            }}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white border border-red-500/30 text-xs font-bold transition-all duration-200 shadow-xs cursor-pointer active:scale-95"
            style={{ backgroundColor: '#f40000', color: '#ffffff' }}
          >
            <LogOut className="w-3.5 h-3.5 text-white" />
            <span className="text-white font-bold">Logout</span>
          </button>
          
        </div>
      </aside>

      {/* Right Side Main Content Area */}
      <div className="flex-1 min-w-0 flex flex-col w-full bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100">
        {/* Hero Banner Section - Banner Resmi Jemaat, Resort & Alamat */}
        <div className="portal-hero-church-banner relative text-slate-900 dark:text-white overflow-hidden shadow-md border-b-2 border-blue-200 dark:border-blue-500/40">
          {/* Top Decorative Liturgical Accent Stripe */}
          <div className="h-1.5 w-full bg-gradient-to-r from-amber-400 via-sky-400 to-indigo-500 relative z-20" />

          {/* Background Image with Ambient Church Lighting */}
          <div className="absolute inset-0 z-0 opacity-15 dark:opacity-25">
            <img
              src="/src/assets/images/gke_hero_banner_1785124578038.jpg"
              alt="Interior Gereja GKE"
              className="w-full h-full object-cover object-center"
              referrerPolicy="no-referrer"
              onError={(e) => {
                (e.target as HTMLImageElement).src =
                  'https://picsum.photos/seed/churchsanctuary/1600/900';
              }}
            />
          </div>
          {/* Multi-layered Adaptive Gradient for contrast */}
          <div className="absolute inset-0 bg-gradient-to-r from-amber-50/90 via-sky-50/80 to-indigo-50/90 dark:from-slate-950/95 dark:via-blue-950/90 dark:to-indigo-950/95 z-0" />
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-400/20 dark:bg-blue-500/15 rounded-full blur-3xl pointer-events-none z-0" />
          <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-amber-400/20 dark:bg-amber-500/10 rounded-full blur-3xl pointer-events-none z-0" />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 md:py-8 relative z-10">
            <div className="flex flex-col lg:flex-row items-center lg:items-center justify-between gap-6">
              {/* Church Identity with Official Logo & Badges */}
              <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-4 md:gap-6 flex-1 min-w-0">
                {/* Official Church Logo Emblem - Tampilan Tanpa Border & Logo Utuh */}
                <div className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 flex items-center justify-center shrink-0 p-0">
                  <img
                    src={settings.logoUrl || defaultGkeLogo}
                    alt="Logo Resmi GKE"
                    className="w-full h-full object-contain filter drop-shadow-md"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = defaultGkeLogo;
                    }}
                  />
                </div>

                {/* Church Info & Address */}
                <div className="space-y-2 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-500/25 text-blue-900 dark:text-blue-200 border border-blue-300 dark:border-blue-400/40 text-[11px] font-black uppercase tracking-wider shadow-2xs">
                      <Church className="w-3.5 h-3.5 text-blue-700 dark:text-blue-300" /> Portal Layanan Warga Jemaat
                    </span>
                  </div>

                  <h1 className="banner-church-title text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-slate-900 dark:text-white font-serif tracking-tight drop-shadow-xs leading-tight">
                    JEMAAT GKE {settings.namaJemaat?.toUpperCase()}
                  </h1>

                  {/* Resort GKE - Dihapus teks '— Gereja Kalimantan Evangelis (GKE)' sesuai permintaan */}
                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white/90 dark:bg-slate-900/80 border border-blue-200 dark:border-blue-400/30 text-xs sm:text-sm font-extrabold text-blue-950 dark:text-sky-200 shadow-xs">
                    <Building2 className="w-4 h-4 text-blue-600 dark:text-sky-300 shrink-0" />
                    <span>{settings.resortGke?.toUpperCase()}</span>
                  </div>

                  {/* Alamat Gereja - Warna Jelas dan Tegas */}
                  <div className="flex items-start justify-center sm:justify-start gap-2 text-xs sm:text-sm text-slate-800 dark:text-slate-200 font-semibold max-w-2xl pt-1 banner-address">
                    <MapPin className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                    <span className="leading-relaxed font-sans">{settings.alamatGereja}</span>
                  </div>
                </div>
              </div>

              {/* Transparansi Saldo Kas Akhir - Tampilan Warna Terang & Tulisan Terlihat Jelas */}
              <div className="banner-stat-card bg-white dark:bg-slate-900/90 p-5 rounded-2xl border-2 border-emerald-300 dark:border-emerald-500/40 text-center lg:text-right space-y-2 shadow-xl shrink-0 w-full sm:w-auto min-w-[280px]">
                <div className="flex items-center justify-between lg:justify-end gap-2 text-[11px] font-black uppercase text-emerald-800 dark:text-emerald-400 tracking-wider">
                  <span className="flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> Transparansi Kas Jemaat
                  </span>
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" title="Live Terkoneksi" />
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-300 font-semibold">Saldo Kas Terverifikasi:</div>
                <h3 className="text-3xl sm:text-4xl font-black text-emerald-600 dark:text-emerald-400 font-mono tracking-tight drop-shadow-xs">
                  Rp {saldoKas.toLocaleString('id-ID')}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 flex items-center justify-center lg:justify-end gap-1.5 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> Laporan Resmi Di-input Bendahara Jemaat
                </p>
                <button
                  type="button"
                  onClick={() => setActivePortalTab('keuangan')}
                  className="w-full mt-2 text-xs font-black text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 py-2.5 px-4 rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                >
                  <DollarSign className="w-4 h-4 text-white" /> Buka Laporan Keuangan Lengkap →
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Module Active Content Container */}
        <div className="p-4 sm:p-6 lg:p-8 flex-1 max-w-7xl w-full mx-auto space-y-6 pb-12">
        {/* TAB 1: BERANDA */}
        {activePortalTab === 'beranda' && (
          <div className="space-y-6">
            {/* Quick Banner for Registration */}
            {isPageEnabled('pendaftaran') && (
              <div className="bg-gradient-to-r from-blue-50 via-indigo-50/80 to-white dark:from-slate-900 dark:via-indigo-950 dark:to-blue-950 border-2 border-blue-200 dark:border-indigo-700/60 p-5 sm:p-6 rounded-2xl shadow-md flex flex-col sm:flex-row items-center justify-between gap-5 transition-all">
                <div className="space-y-2 text-center sm:text-left flex-1 min-w-0">
                  <div className="inline-flex items-center gap-1.5 bg-blue-100 dark:bg-blue-500/20 text-blue-900 dark:text-blue-300 border border-blue-300 dark:border-blue-400/40 font-mono text-[10px] sm:text-xs font-black uppercase px-3 py-1 rounded-full shadow-2xs">
                    <Sparkles className="w-3.5 h-3.5 text-blue-700 dark:text-blue-400" />
                    LAYANAN PELAYANAN WARGA &amp; ANGGOTA JEMAAT
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-serif tracking-tight leading-snug">
                    Form Pendaftaran Anggota Jemaat Baru GKE
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 font-medium leading-relaxed max-w-2xl">
                    Ingin mendaftarkan diri atau keluarga sebagai Warga Jemaat GKE? Silakan isi formulir pendaftaran anggota digital di sini secara mandiri, praktis, dan langsung tersimpan di data jemaat resmi.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActivePortalTab('pendaftaran')}
                  className="flex items-center gap-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black text-xs sm:text-sm px-6 py-3 rounded-xl transition-all shadow-md hover:shadow-lg whitespace-nowrap hover:scale-102 active:scale-98 cursor-pointer shrink-0 border border-blue-400/30"
                >
                  <UserPlus className="w-4 h-4 text-white" />
                  <span>Isi Form Pendaftaran Sekarang →</span>
                </button>
              </div>
            )}

            {/* Latest Warta Jemaat Card - Edisi Terbaru & Terakhir */}
            {latestWarta && (
              <div className="bg-gradient-to-br from-indigo-50 via-white to-blue-50/80 dark:bg-gradient-to-r dark:from-slate-950 dark:via-indigo-950 dark:to-slate-900 border-2 border-indigo-300 dark:border-indigo-500/40 rounded-3xl p-5 sm:p-6 text-slate-900 dark:text-white shadow-xl space-y-4">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-indigo-200/80 dark:border-indigo-800/60 pb-4">
                  <div className="space-y-2 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-500/30 text-indigo-900 dark:text-indigo-200 border border-indigo-300 dark:border-indigo-400/40 font-mono font-black text-[10px] uppercase shadow-2xs">
                        <FileText className="w-3 h-3 text-indigo-700 dark:text-indigo-300" />
                        {latestWarta.nomorEdisi || 'Warta Jemaat'}
                      </span>
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-500/20 text-emerald-900 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-400/40 font-black text-[10px] uppercase shadow-2xs">
                        <Sparkles className="w-3 h-3 text-emerald-700 dark:text-emerald-300 animate-pulse" />
                        Edisi Terbaru (Terakhir)
                      </span>
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                        {latestWarta.tanggalTerbit || (latestWarta as any).tanggal || '-'}
                      </span>
                    </div>
                    <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-serif tracking-tight leading-snug">
                      {latestWarta.judulWarta || (latestWarta as any).judul || 'Warta Jemaat & Buletin Minggu'}
                    </h3>
                    {latestWarta.temaKhotbah && (
                      <p className="text-xs sm:text-sm text-indigo-950 dark:text-indigo-200 font-bold line-clamp-2">
                        <span className="text-indigo-700 dark:text-indigo-400 font-black">Tema: </span>
                        {latestWarta.temaKhotbah}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 self-start lg:self-auto shrink-0">
                    <button
                      type="button"
                      onClick={() => setSelectedWartaDetail(latestWarta)}
                      className="px-3.5 py-2 bg-indigo-100 hover:bg-indigo-200 text-indigo-900 border border-indigo-300 dark:bg-indigo-950/80 dark:hover:bg-indigo-900/90 dark:text-indigo-200 dark:hover:text-white dark:border-indigo-500/40 text-xs font-extrabold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                    >
                      <Eye className="w-3.5 h-3.5 text-indigo-700 dark:text-indigo-300" />
                      <span>Ringkasan Edisi Terakhir</span>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        openPrintReport({
                          reportType: 'berita_jemaat',
                          beritaJemaatId: latestWarta.id,
                          customTitle: `WARTA JEMAAT RESMI - ${latestWarta.nomorEdisi || latestWarta.judulWarta}`,
                        })
                      }
                      className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black rounded-xl shadow-md transition-all flex items-center gap-1.5 hover:scale-102 active:scale-98 cursor-pointer border border-emerald-400/40"
                    >
                      <Printer className="w-3.5 h-3.5 text-emerald-100" />
                      <span>Baca &amp; Cetak Lengkap Warta Jemaat</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActivePortalTab('warta_jemaat')}
                      className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 dark:bg-white/10 dark:hover:bg-white/20 dark:text-slate-200 dark:hover:text-white dark:border-transparent text-xs font-bold rounded-xl transition flex items-center gap-1 cursor-pointer shadow-2xs"
                      title="Buka Halaman Seluruh Edisi Warta Jemaat"
                    >
                      <span>Semua Edisi →</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs pt-1">
                  <div className="bg-blue-50/90 dark:bg-slate-900/90 p-3 rounded-2xl border border-blue-200 dark:border-indigo-900/50 shadow-2xs">
                    <span className="text-blue-900 dark:text-blue-300 text-[10px] block font-bold uppercase tracking-wider mb-0.5">
                      Ibadah &amp; Pelayanan:
                    </span>
                    <span className="font-black text-blue-700 dark:text-blue-300 text-sm flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                      <span>{latestWarta.beritaPelayananList?.length || 0} Kebaktian Terjadwal</span>
                    </span>
                  </div>

                  <div className="bg-emerald-50/90 dark:bg-slate-900/90 p-3 rounded-2xl border border-emerald-200 dark:border-indigo-900/50 shadow-2xs">
                    <span className="text-emerald-900 dark:text-emerald-300 text-[10px] block font-bold uppercase tracking-wider mb-0.5">
                      Kas Keuangan Jemaat:
                    </span>
                    <span className="font-black text-emerald-700 dark:text-emerald-300 font-mono text-sm flex items-center gap-1.5">
                      <Wallet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span>Rp {latestWarta.beritaKeuangan?.saldoAkhir?.toLocaleString('id-ID') || 0}</span>
                    </span>
                  </div>

                  <div className="bg-amber-50/90 dark:bg-slate-900/90 p-3 rounded-2xl border border-amber-200 dark:border-indigo-900/50 shadow-2xs">
                    <span className="text-amber-900 dark:text-amber-300 text-[10px] block font-bold uppercase tracking-wider mb-0.5">
                      Ulang Tahun Minggu Ini:
                    </span>
                    <span className="font-black text-amber-700 dark:text-amber-300 text-sm flex items-center gap-1.5">
                      <Gift className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                      <span>{latestWarta.beritaUlangTahunList?.length || 0} Anggota Jemaat</span>
                    </span>
                  </div>

                  <div className="bg-rose-50/90 dark:bg-slate-900/90 p-3 rounded-2xl border border-rose-200 dark:border-indigo-900/50 shadow-2xs">
                    <span className="text-rose-900 dark:text-rose-300 text-[10px] block font-bold uppercase tracking-wider mb-0.5">
                      Berita Duka &amp; Pernikahan:
                    </span>
                    <span className="font-black text-rose-700 dark:text-rose-300 text-sm flex items-center gap-1.5">
                      <HeartHandshake className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 shrink-0" />
                      <span>
                        {(isLatestWartaDukaActive ? latestFilteredDukaList.length : 0) +
                          latestFilteredNikahList.length}{' '}
                        Warta Tambahan
                      </span>
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Announcement Banner - Teks Warta Lengkap Terbaca Semua (Tanpa Terpotong) */}
            {latestWarta && (
              <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700/60 text-amber-950 dark:text-amber-100 p-4 sm:p-5 rounded-2xl text-xs sm:text-sm shadow-xs space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-amber-200/80 dark:border-amber-800/60 pb-2.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-black bg-amber-300 text-amber-950 dark:bg-amber-800 dark:text-amber-100 px-2.5 py-1 rounded-lg text-[10px] sm:text-xs uppercase tracking-wider shrink-0 shadow-2xs">
                      WARTA JEMAAT EDISI TERAKHIR
                    </span>
                    {latestWarta.nomorEdisi && (
                      <span className="text-[11px] sm:text-xs font-black text-amber-900 dark:text-amber-300">
                        &bull; {latestWarta.nomorEdisi}
                      </span>
                    )}
                    {latestWarta.tanggalTerbit && (
                      <span className="text-[11px] font-bold text-slate-700 dark:text-amber-200/80">
                        &bull; Terbit: {latestWarta.tanggalTerbit}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setSelectedWartaDetail(latestWarta)}
                      className="text-[11px] font-bold text-indigo-800 dark:text-indigo-300 hover:underline inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Rincian Warta</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActivePortalTab('warta_jemaat')}
                      className="text-[11px] font-bold text-amber-800 dark:text-amber-300 hover:underline inline-flex items-center gap-1 cursor-pointer"
                    >
                      <span>Buka Semua Warta &rarr;</span>
                    </button>
                  </div>
                </div>

                {/* Teks & Data Warta Edisi Terakhir */}
                <div className="space-y-2.5 text-slate-900 dark:text-amber-50 font-medium leading-relaxed">
                  {/* Judul Warta Edisi Terakhir */}
                  <div>
                    <h4 className="text-sm sm:text-base font-extrabold text-slate-950 dark:text-white font-serif">
                      {latestWarta.judulWarta || 'Warta Jemaat Edisi Resmi'}
                    </h4>
                  </div>

                  {/* Tema Khotbah & Nats Pembimbing */}
                  {(latestWarta.temaKhotbah || latestWarta.natsPembimbing) && (
                    <div className="text-xs space-y-1 pt-1 border-t border-amber-200/80 dark:border-amber-800/60">
                      {latestWarta.temaKhotbah && (
                        <p className="text-amber-950 dark:text-amber-200 font-semibold">
                          <span className="font-bold text-amber-900 dark:text-amber-300">Tema Khotbah:</span> "{latestWarta.temaKhotbah}"
                        </p>
                      )}
                      {latestWarta.natsPembimbing && (
                        <p className="text-purple-950 dark:text-purple-200 font-medium">
                          <span className="font-bold text-purple-900 dark:text-purple-300">Nats Pembimbing:</span> {latestWarta.natsPembimbing}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Pesan Penggembalaan */}
                  {latestWarta.catatanGembala && (
                    <p className="text-xs italic text-amber-950 dark:text-amber-200/90 pt-1 border-t border-amber-200/80 dark:border-amber-800/60">
                      <span className="font-bold not-italic text-amber-900 dark:text-amber-300">Pesan Penggembalaan: </span>
                      "{latestWarta.catatanGembala}"
                    </p>
                  )}

                  {/* Pengumuman & Berita Tambahan dari Edisi Terakhir */}
                  {latestWarta.beritaTambahanList && latestWarta.beritaTambahanList.length > 0 ? (
                    <div className="pt-2 border-t border-amber-200/80 dark:border-amber-800/60 space-y-1.5 text-xs">
                      <span className="font-bold text-amber-950 dark:text-amber-200 block text-[11px] uppercase tracking-wider">
                        Pengumuman Warta Terkini:
                      </span>
                      {latestWarta.beritaTambahanList.map((item, idx) => (
                        <div key={item.id || idx} className="bg-amber-100/60 dark:bg-amber-900/30 p-2 rounded-lg border border-amber-200/80 dark:border-amber-800/40">
                          <span className="font-bold text-amber-950 dark:text-amber-200">
                            &bull; {item.judul}:{' '}
                          </span>
                          <span className="text-slate-800 dark:text-amber-100">{item.isi}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-800 dark:text-amber-100 pt-1 border-t border-amber-200/80 dark:border-amber-800/60">
                      Warta resmi edisi {latestWarta.nomorEdisi || 'terbaru'} berlaku untuk ibadah minggu terbitan {latestWarta.tanggalTerbit || 'terkini'}. Silakan klik &ldquo;Rincian Warta&rdquo; untuk membaca lembaran lengkap.
                    </p>
                  )}

                  {/* Jadwal Kebaktian Terjadwal Warta Terakhir */}
                  {latestWarta.beritaPelayananList && latestWarta.beritaPelayananList.length > 0 && (
                    <div className="pt-2 border-t border-amber-200/80 dark:border-amber-800/60 text-xs space-y-1.5">
                      <span className="font-bold text-amber-950 dark:text-amber-200 block text-[11px] uppercase tracking-wider">
                        Jadwal Pelayanan Ibadah Edisi Ini ({latestWarta.beritaPelayananList.length} Kebaktian):
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {latestWarta.beritaPelayananList.map((pel, idx) => {
                          const timeStr = (pel as any).hariTanggalJam || (pel.tanggal && pel.waktu ? `${pel.tanggal} • ${pel.waktu}` : pel.waktu || pel.tanggal || 'Sesuai Jadwal');
                          return (
                            <div key={pel.id || idx} className="bg-white/80 dark:bg-slate-900/80 p-2 rounded-lg border border-amber-200 dark:border-amber-800/40 text-[11px]">
                              <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                                {pel.namaIbadah}
                              </div>
                              <div className="text-slate-600 dark:text-slate-300 mt-0.5">
                                {timeStr} {pel.tempat ? `• Tempat: ${pel.tempat}` : ''}
                              </div>
                              {pel.pelayanFirman && (
                                <div className="text-indigo-700 dark:text-indigo-300 font-medium">
                                  Pelayan Firman: {pel.pelayanFirman}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Berita Duka Cita jika ada di edisi ini (Masa warta 2 minggu setelah terbit warta) */}
                  {isLatestWartaDukaActive && latestFilteredDukaList.length > 0 && (
                    <div className="pt-1.5 border-t border-amber-200/80 dark:border-amber-800/60 text-xs text-rose-900 dark:text-rose-200">
                      <span className="font-bold text-rose-950 dark:text-rose-300">&bull; Berita Duka Cita: </span>
                      {latestFilteredDukaList.map((d) => {
                        const nama = (d as any).namaMeninggal || (d as any).namaAlmarhum || (d as any).nama || 'Alm/Almh';
                        const usia = (d as any).usia !== undefined && (d as any).usia !== '' ? ` (${(d as any).usia} thn)` : '';
                        const ket = (d as any).keterangan ? ` - ${(d as any).keterangan}` : '';
                        return `${nama}${usia}${ket}`;
                      }).join('; ')}
                    </div>
                  )}

                  {/* Undangan Pernikahan Kudus jika ada di edisi ini (1 bulan setelah diterbitkannya warta jemaat) */}
                  {latestFilteredNikahList.length > 0 && (
                    <div className="pt-1 border-t border-amber-200/80 dark:border-amber-800/60 text-xs text-purple-900 dark:text-purple-200">
                      <span className="font-bold text-purple-950 dark:text-purple-300">&bull; Undangan Pernikahan: </span>
                      {latestFilteredNikahList.map((p) => {
                        const pria = (p as any).namaMempelaiPria || (p as any).mempelaiPria || (p as any).namaPria || (p as any).pria || 'Mempelai Pria';
                        const wanita = (p as any).namaMempelaiWanita || (p as any).mempelaiWanita || (p as any).namaWanita || (p as any).wanita || 'Mempelai Wanita';
                        const tgl = (p as any).tanggalPemberkatan || (p as any).tglPemberkatan || (p as any).tanggal || '-';
                        return `${pria} & ${wanita} (${tgl})`;
                      }).join('; ')}
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Daily Devotional Spotlight */}
              <div className="lg:col-span-2 bg-white rounded-xl p-6 border border-slate-200 shadow-xs space-y-4 font-serif">
                <div className="flex items-center justify-between border-b pb-3 font-sans">
                  <span className="text-xs font-bold text-blue-900 uppercase">
                    Renungan Harian Hari Ini
                  </span>
                  <span className="text-xs text-slate-500">
                    {renunganList[0]?.tanggal}
                  </span>
                </div>

                {renunganList[0] ? (
                  <div className="space-y-3">
                    <h2 className="text-xl font-bold text-slate-900">
                      {renunganList[0].judul}
                    </h2>
                    <p className="text-xs font-bold text-blue-900 italic">
                      Nats Alkitab: {renunganList[0].natsAlkitab}
                    </p>
                    <p className="text-xs text-slate-700 leading-relaxed line-clamp-6 text-justify">
                      {renunganList[0].isi}
                    </p>

                    <div className="pt-3 flex justify-between items-center font-sans text-xs">
                      <span className="text-slate-500">
                        Oleh: {renunganList[0].penulis}
                      </span>
                      <button
                        onClick={() => setActivePortalTab('renungan')}
                        className="text-blue-600 font-bold hover:underline"
                      >
                        Baca Selengkapnya & Buletin →
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 font-sans">Belum ada renungan.</p>
                )}
              </div>

              {/* Worship Schedules Sidebar */}
              <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b pb-2">
                  <h3 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-blue-600" />
                    Jadwal Ibadah Minggu Ini
                  </h3>
                  <button
                    onClick={() => setActivePortalTab('jadwal')}
                    className="text-[11px] font-bold text-blue-600 hover:underline"
                  >
                    Semua
                  </button>
                </div>

                <div className="space-y-3">
                  {jadwalIbadahList.slice(0, 3).map((ji) => (
                    <div
                      key={ji.id}
                      className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 text-xs space-y-1"
                    >
                      <div className="flex justify-between items-start">
                        <h4 className="font-bold text-slate-900 dark:text-white text-xs">{ji.namaIbadah}</h4>
                        <span className="text-[10px] bg-blue-100 dark:bg-blue-950/70 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-700/60 font-bold px-1.5 py-0.5 rounded">
                          {ji.tanggal}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-300">{ji.tempat}</p>
                      <p className="text-[11px] text-blue-900 dark:text-sky-300 font-semibold pt-1">
                        Pelayan: {ji.pengkhotbah}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Public Financial Transparency Overview */}
            <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-emerald-600" />
                    Ringkasan Transparansi Keuangan Kas Jemaat
                  </h3>
                  <p className="text-xs text-slate-500">
                    Laporan terbuka pemasukan dan pengeluaran kas yang dikelola oleh Bendahara
                  </p>
                </div>

                <button
                  onClick={() => openPrintReport({ reportType: 'keuangan_bulanan' })}
                  className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold px-3 py-1.5 rounded-lg"
                >
                  <Printer className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Download Laporan Cetak Resmi</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div className="pemasukan-box-portal p-4 bg-gradient-to-br from-emerald-50 to-teal-50/70 dark:from-slate-900 dark:to-emerald-950/40 dark:bg-slate-900 rounded-2xl border-2 border-emerald-200 dark:border-emerald-500/40 shadow-xs">
                  <span className="text-emerald-900 dark:text-emerald-400 font-black uppercase text-[11px] tracking-wider flex items-center gap-1.5">
                    <ArrowDownCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    Total Pemasukan Kas
                  </span>
                  <p className="ringkasan-keuangan-pemasukan text-2xl font-black text-emerald-950 dark:text-emerald-300 mt-1.5 font-mono tracking-tight">
                    Rp {totalPemasukan.toLocaleString('id-ID')}
                  </p>
                </div>

                <div className="pengeluaran-box-portal p-4 bg-gradient-to-br from-rose-50 to-pink-50/70 dark:from-slate-900 dark:to-rose-950/40 dark:bg-slate-900 rounded-2xl border-2 border-rose-200 dark:border-rose-500/40 shadow-xs">
                  <span className="text-rose-900 dark:text-rose-400 font-black uppercase text-[11px] tracking-wider flex items-center gap-1.5">
                    <ArrowUpCircle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                    Total Pengeluaran Kas
                  </span>
                  <p className="ringkasan-keuangan-pengeluaran text-2xl font-black text-rose-950 dark:text-rose-300 mt-1.5 font-mono tracking-tight">
                    Rp {totalPengeluaran.toLocaleString('id-ID')}
                  </p>
                </div>

                <div className="saldo-box-portal p-4 bg-gradient-to-br from-blue-50 to-indigo-50/80 dark:from-slate-900 dark:to-blue-950/40 dark:bg-slate-900 rounded-2xl border-2 border-blue-300 dark:border-sky-500/40 shadow-sm">
                  <span className="text-blue-900 dark:text-sky-400 font-black uppercase text-[11px] tracking-wider flex items-center gap-1.5">
                    <Wallet className="w-4 h-4 text-blue-600 dark:text-sky-400" />
                    Saldo Netto Kas
                  </span>
                  <p className="ringkasan-keuangan-saldo text-2xl font-black text-blue-950 dark:text-sky-300 mt-1.5 font-mono tracking-tight">
                    Rp {saldoKas.toLocaleString('id-ID')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB: EDISI WARTA JEMAAT */}
        {activePortalTab === 'warta_jemaat' && (
          <div className="space-y-6">
            <div className="portal-dark-card bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 !text-white text-white p-6 rounded-2xl shadow-lg border border-blue-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-[10px] font-extrabold uppercase border border-blue-400/30">
                  <FileText className="w-3 h-3 text-blue-300" /> Publikasi Resmi Gereja
                </span>
                <h2 className="banner-title text-xl md:text-2xl font-extrabold font-serif !text-white text-white" style={{ color: '#ffffff' }}>
                  Edisi Warta Jemaat &amp; Buletin Minggu
                </h2>
                <p className="text-xs !text-slate-200 text-slate-200 max-w-2xl leading-relaxed" style={{ color: '#e2e8f0' }}>
                  Arsip resmi Warta Jemaat {settings.namaJemaat}. Jemaat dapat membaca ringkasan warta, melihat lampiran lengkap, menyalin naskah warta, dan membuka format PDF resmi untuk dicetak atau diunduh.
                </p>
              </div>

              {latestWarta && (
                <button
                  type="button"
                  onClick={() =>
                    openPrintReport({
                      reportType: 'berita_jemaat',
                      beritaJemaatId: latestWarta.id,
                      customTitle: `WARTA JEMAAT RESMI - ${latestWarta.nomorEdisi || latestWarta.judulWarta}`,
                    })
                  }
                  className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-extrabold rounded-xl shadow-lg transition-all flex items-center gap-2 border border-emerald-400/30 hover:scale-102 active:scale-98 cursor-pointer shrink-0"
                >
                  <Printer className="w-4 h-4 text-emerald-200" />
                  <span>Cetak Warta Edisi Terakhir (PDF)</span>
                </button>
              )}
            </div>

            {/* Featured Spotlight: Edisi Warta Jemaat Terbaru & Terakhir */}
            {latestWarta && (
              <div className="bg-gradient-to-br from-indigo-50 via-white to-blue-50/80 dark:bg-gradient-to-br dark:from-slate-900 dark:via-indigo-950 dark:to-slate-950 border-2 border-indigo-300 dark:border-indigo-500/50 rounded-3xl p-6 sm:p-7 text-slate-900 dark:text-white shadow-2xl space-y-5 relative overflow-hidden">
                <div className="absolute -right-12 -bottom-12 w-48 h-48 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-indigo-200/80 dark:border-indigo-800/60 pb-5">
                  <div className="space-y-2 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-emerald-100 dark:bg-emerald-500/25 text-emerald-900 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-400/40 font-black text-xs uppercase tracking-wider animate-pulse shadow-2xs">
                        <Sparkles className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-300" />
                        EDISI TERBARU &amp; TERAKHIR (TERKINI)
                      </span>
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-indigo-100 dark:bg-indigo-500/30 text-indigo-900 dark:text-indigo-200 border border-indigo-300 dark:border-indigo-400/40 font-mono font-black text-xs shadow-2xs">
                        {latestWarta.nomorEdisi || 'Warta Mingguan'}
                      </span>
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                        Terbit: {latestWarta.tanggalTerbit || (latestWarta as any).tanggal || '-'}
                      </span>
                    </div>

                    <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-serif tracking-tight">
                      {latestWarta.judulWarta || (latestWarta as any).judul || 'Warta Jemaat & Buletin Minggu'}
                    </h3>

                    {latestWarta.temaKhotbah && (
                      <p className="text-sm text-indigo-950 dark:text-indigo-200 font-bold">
                        <span className="text-indigo-700 dark:text-indigo-400 font-black">Tema Kebaktian: </span>
                        {latestWarta.temaKhotbah}
                      </p>
                    )}

                    {latestWarta.natsPembimbing && (
                      <p className="text-xs font-mono font-bold text-purple-900 dark:text-purple-300 flex items-center gap-1.5">
                        <BookOpen className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 shrink-0" />
                        <span>Nats Pembimbing: {latestWarta.natsPembimbing}</span>
                      </p>
                    )}

                    {latestWarta.catatanGembala && (
                      <p className="text-xs text-slate-700 dark:text-slate-300 italic bg-indigo-50/70 dark:bg-indigo-950/60 p-3.5 rounded-2xl border border-indigo-200 dark:border-indigo-800/40">
                        <span className="font-bold not-italic text-indigo-900 dark:text-indigo-300 block mb-0.5">Catatan Penggembalaan Gembala:</span>
                        "{latestWarta.catatanGembala}"
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row lg:flex-col gap-2.5 shrink-0 self-start lg:self-center">
                    <button
                      type="button"
                      onClick={() =>
                        openPrintReport({
                          reportType: 'berita_jemaat',
                          beritaJemaatId: latestWarta.id,
                          customTitle: `WARTA JEMAAT RESMI - ${latestWarta.nomorEdisi || latestWarta.judulWarta}`,
                        })
                      }
                      className="px-5 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs shadow-xl flex items-center justify-center gap-2 border border-emerald-400/40 transition-all hover:scale-102 active:scale-98 cursor-pointer"
                    >
                      <Printer className="w-4 h-4 text-emerald-100" />
                      <span>Baca &amp; Cetak Lengkap Warta Jemaat</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedWartaDetail(latestWarta)}
                      className="px-4 py-2.5 rounded-xl bg-indigo-100 hover:bg-indigo-200 text-indigo-950 border border-indigo-300 dark:bg-indigo-900/80 dark:hover:bg-indigo-800 dark:text-white dark:border-indigo-600/50 font-black text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-2xs"
                    >
                      <Eye className="w-4 h-4 text-indigo-700 dark:text-indigo-300" />
                      <span>Buka Ringkasan Edisi Terbaru</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const displayJudul = latestWarta.judulWarta || (latestWarta as any).judul || 'Warta Jemaat';
                        const displayTanggal = latestWarta.tanggalTerbit || (latestWarta as any).tanggal || '-';
                        const displayTema = latestWarta.temaKhotbah || (latestWarta as any).isi || 'Ibadah dan Pelayanan Kasih';
                        const totalPelayanan = latestWarta.beritaPelayananList?.length || 0;
                        const saldoKas = latestWarta.beritaKeuangan?.saldoAkhir;
                        const totalHut = latestWarta.beritaUlangTahunList?.length || 0;

                        const lines = [
                          `=== WARTA JEMAAT ${(settings?.namaJemaat || 'GKE').toUpperCase()} ===`,
                          `Nomor: ${latestWarta.nomorEdisi || '-'}`,
                          `Tanggal Terbit: ${displayTanggal}`,
                          `Judul: ${displayJudul}`,
                          `Tema: ${displayTema}`,
                          latestWarta.natsPembimbing ? `Nats Alkitab: ${latestWarta.natsPembimbing}` : '',
                          latestWarta.catatanGembala ? `\n--- CATATAN GEMBALA ---\n${latestWarta.catatanGembala}` : '',
                          totalPelayanan > 0
                            ? `\n--- JADWAL PELAYANAN IBADAH (${totalPelayanan}) ---\n` +
                              latestWarta.beritaPelayananList
                                .map(
                                  (p) => {
                                    const wkt = (p as any).hariTanggalJam || (p.tanggal && p.waktu ? `${p.tanggal} • ${p.waktu}` : p.waktu || p.tanggal || '-');
                                    return `• ${p.namaIbadah} | ${wkt} | Tempat: ${p.tempat || '-'} | Pelayan: ${p.pelayanFirman || '-'}`;
                                  }
                                )
                                .join('\n')
                            : '',
                          latestWarta.beritaKeuangan
                            ? (() => {
                                const bk = latestWarta.beritaKeuangan;
                                const sAwal = Number(bk.saldoAwal ?? (bk as any).saldoKasAwal ?? 0);
                                const sIn = Number(bk.totalPemasukan ?? (bk as any).totalPenerimaan ?? (bk as any).pemasukan ?? 0);
                                const sOut = Number(bk.totalPengeluaran ?? (bk as any).pengeluaran ?? 0);
                                const sEnd = Number(bk.saldoAkhir ?? (bk as any).saldoKasAkhir ?? (sAwal + sIn - sOut));
                                return `\n--- REKAPITULASI KEUANGAN ---\nSaldo Awal: Rp ${sAwal.toLocaleString('id-ID')}\nPenerimaan: Rp ${sIn.toLocaleString('id-ID')}\nPengeluaran: Rp ${sOut.toLocaleString('id-ID')}\nSaldo Akhir: Rp ${sEnd.toLocaleString('id-ID')}`;
                              })()
                            : '',
                          totalHut > 0
                            ? `\n--- UCAPAN ULANG TAHUN (${totalHut}) ---\n` +
                              latestWarta.beritaUlangTahunList
                                .map((u) => `• ${u.nama} (${u.jenisUlangTahun === 'Pernikahan' ? 'HUT Pernikahan' : 'HUT Kelahiran'} - ${u.tanggal})`)
                                .join('\n')
                            : '',
                        ].filter(Boolean);

                        navigator.clipboard.writeText(lines.join('\n'));
                        setCopiedWartaId(latestWarta.id);
                        setTimeout(() => setCopiedWartaId(null), 2500);
                      }}
                      className="btn-salin-teks px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-900 border border-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-white dark:border-slate-600 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-2xs"
                    >
                      {copiedWartaId === latestWarta.id ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          <span className="text-emerald-800 dark:text-emerald-300 font-bold">Naskah Warta Tersalin!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-slate-700 dark:text-slate-200 shrink-0" />
                          <span className="text-slate-900 dark:text-white font-bold">Salin Teks Warta Edisi Terakhir</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-1">
                  <div className="bg-blue-50/90 dark:bg-slate-900/90 p-3.5 rounded-2xl border border-blue-200 dark:border-indigo-900/50 shadow-2xs">
                    <span className="text-blue-900 dark:text-blue-300 text-[10px] block font-bold uppercase tracking-wider mb-0.5">
                      Ibadah &amp; Pelayanan:
                    </span>
                    <span className="font-black text-blue-700 dark:text-blue-300 text-sm flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                      <span>{latestWarta.beritaPelayananList?.length || 0} Kebaktian Terjadwal</span>
                    </span>
                  </div>

                  <div className="bg-emerald-50/90 dark:bg-slate-900/90 p-3.5 rounded-2xl border border-emerald-200 dark:border-indigo-900/50 shadow-2xs">
                    <span className="text-emerald-900 dark:text-emerald-300 text-[10px] block font-bold uppercase tracking-wider mb-0.5">
                      Kas Keuangan Jemaat:
                    </span>
                    <span className="font-black text-emerald-700 dark:text-emerald-300 text-sm font-mono flex items-center gap-1.5">
                      <Wallet className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span>Rp {latestWarta.beritaKeuangan?.saldoAkhir?.toLocaleString('id-ID') || 0}</span>
                    </span>
                  </div>

                  <div className="bg-amber-50/90 dark:bg-slate-900/90 p-3.5 rounded-2xl border border-amber-200 dark:border-indigo-900/50 shadow-2xs">
                    <span className="text-amber-900 dark:text-amber-300 text-[10px] block font-bold uppercase tracking-wider mb-0.5">
                      Ulang Tahun Minggu Ini:
                    </span>
                    <span className="font-black text-amber-700 dark:text-amber-300 text-sm flex items-center gap-1.5">
                      <Gift className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                      <span>{latestWarta.beritaUlangTahunList?.length || 0} Anggota Jemaat</span>
                    </span>
                  </div>

                  <div className="bg-rose-50/90 dark:bg-slate-900/90 p-3.5 rounded-2xl border border-rose-200 dark:border-indigo-900/50 shadow-2xs">
                    <span className="text-rose-900 dark:text-rose-300 text-[10px] block font-bold uppercase tracking-wider mb-0.5">
                      Berita Duka &amp; Pernikahan:
                    </span>
                    <span className="font-black text-rose-700 dark:text-rose-300 text-sm flex items-center gap-1.5">
                      <HeartHandshake className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                      <span>
                        {(isLatestWartaDukaActive ? latestFilteredDukaList.length : 0) +
                          latestFilteredNikahList.length}{' '}
                        Warta Tambahan
                      </span>
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* List Edisi Warta */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pb-4 border-b">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600 shrink-0" />
                  <h3 className="font-extrabold text-slate-900 text-sm uppercase tracking-wider">
                    Daftar Semua Edisi Warta Jemaat (Terbaru s/d Terlama)
                  </h3>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                    {sortedBeritaJemaatList.length} Edisi
                  </span>
                </div>
                <div className="relative w-full sm:w-72">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Cari edisi / tanggal / tema / nats..."
                    value={wartaSearch}
                    onChange={(e) => setWartaSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {wartaSearch && (
                    <button
                      type="button"
                      onClick={() => setWartaSearch('')}
                      className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 text-xs font-bold"
                    >
                      ×
                    </button>
                  )}
                </div>
              </div>

              {sortedBeritaJemaatList.length === 0 ? (
                <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-300 space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center mx-auto">
                    <FileText className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-800">Belum Ada Edisi Warta Jemaat</h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Warta jemaat mingguan akan tampil di sini begitu diterbitkan oleh Sekretariat Majelis Jemaat.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {sortedBeritaJemaatList
                    .filter((w) => {
                      const searchLower = wartaSearch.toLowerCase();
                      return (
                        (w.judulWarta || (w as any).judul || '').toLowerCase().includes(searchLower) ||
                        (w.nomorEdisi || '').toLowerCase().includes(searchLower) ||
                        (w.tanggalTerbit || (w as any).tanggal || '').toLowerCase().includes(searchLower) ||
                        (w.temaKhotbah || '').toLowerCase().includes(searchLower) ||
                        (w.natsPembimbing || '').toLowerCase().includes(searchLower)
                      );
                    })
                    .map((warta, idx) => {
                      const isLatestItem = idx === 0;
                      const displayJudul = warta.judulWarta || (warta as any).judul || 'Warta Jemaat';
                      const displayTanggal = warta.tanggalTerbit || (warta as any).tanggal || '-';
                      const displayTema = warta.temaKhotbah || (warta as any).isi || 'Ibadah dan Pelayanan Kasih';
                      const displayNats = warta.natsPembimbing || '';
                      const totalPelayanan = warta.beritaPelayananList?.length || 0;
                      const saldoKas = warta.beritaKeuangan?.saldoAkhir;
                      const totalHut = warta.beritaUlangTahunList?.length || 0;
                      const isWartaDukaActive = isWartaWithinTwoWeeks(warta.tanggalTerbit);
                      const filteredWartaDuka = isWartaDukaActive
                        ? (warta.beritaDukaList || []).filter((d) =>
                            isDukaWithinTwoWeeks(
                              (d as any).tanggalMeninggal || (d as any).tglMeninggal || (d as any).tanggal,
                              warta.tanggalTerbit
                            )
                          )
                        : [];
                      const filteredWartaNikah = (warta.undanganPernikahanList || []).filter((p) =>
                        isNikahWithinOneMonth(
                          (p as any).tanggalPemberkatan || (p as any).tglPemberkatan || (p as any).tanggal,
                          warta.tanggalTerbit
                        )
                      );
                      const totalDuka = filteredWartaDuka.length;
                      const totalNikah = filteredWartaNikah.length;

                      const handleCopyWarta = () => {
                        const lines = [
                          `=== WARTA JEMAAT ${(settings?.namaJemaat || 'GKE').toUpperCase()} ===`,
                          `Nomor: ${warta.nomorEdisi || '-'}`,
                          `Tanggal Terbit: ${displayTanggal}`,
                          `Judul: ${displayJudul}`,
                          `Tema: ${displayTema}`,
                          displayNats ? `Nats Alkitab: ${displayNats}` : '',
                          warta.catatanGembala ? `\n--- CATATAN GEMBALA ---\n${warta.catatanGembala}` : '',
                          totalPelayanan > 0
                            ? `\n--- JADWAL PELAYANAN IBADAH (${totalPelayanan}) ---\n` +
                              warta.beritaPelayananList
                                .map(
                                  (p) => {
                                    const wkt = (p as any).hariTanggalJam || (p.tanggal && p.waktu ? `${p.tanggal} • ${p.waktu}` : p.waktu || p.tanggal || '-');
                                    return `• ${p.namaIbadah} | ${wkt} | Tempat: ${p.tempat || '-'} | Pelayan: ${p.pelayanFirman || '-'}`;
                                  }
                                )
                                .join('\n')
                            : '',
                          warta.beritaKeuangan
                            ? (() => {
                                const bk = warta.beritaKeuangan;
                                const sAwal = Number(bk.saldoAwal ?? (bk as any).saldoKasAwal ?? 0);
                                const sIn = Number(bk.totalPemasukan ?? (bk as any).totalPenerimaan ?? (bk as any).pemasukan ?? 0);
                                const sOut = Number(bk.totalPengeluaran ?? (bk as any).pengeluaran ?? 0);
                                const sEnd = Number(bk.saldoAkhir ?? (bk as any).saldoKasAkhir ?? (sAwal + sIn - sOut));
                                return `\n--- REKAPITULASI KEUANGAN ---\nSaldo Awal: Rp ${sAwal.toLocaleString('id-ID')}\nPenerimaan: Rp ${sIn.toLocaleString('id-ID')}\nPengeluaran: Rp ${sOut.toLocaleString('id-ID')}\nSaldo Akhir: Rp ${sEnd.toLocaleString('id-ID')}`;
                              })()
                            : '',
                          totalHut > 0
                            ? `\n--- UCAPAN ULANG TAHUN (${totalHut}) ---\n` +
                              warta.beritaUlangTahunList
                                .map((u) => {
                                  const uNama = u.nama || (u as any).namaLengkap || 'Warga Jemaat';
                                  const isNik = String(u.jenis || (u as any).jenisUlangTahun || '').toLowerCase().includes('nikah');
                                  return `• ${uNama} (${isNik ? 'HUT Pernikahan' : 'HUT Kelahiran'} - ${u.tanggal || '-'})`;
                                })
                                .join('\n')
                            : '',
                          totalDuka > 0
                            ? `\n--- BERITA DUKA CITA (${totalDuka}) ---\n` +
                              filteredWartaDuka
                                .map((d) => {
                                  const dNama = (d as any).namaMeninggal || (d as any).namaAlmarhum || (d as any).nama || 'Alm';
                                  return `• ${dNama} (${(d as any).usia ? (d as any).usia + ' Thn' : ''}) - Meninggal: ${(d as any).tanggalMeninggal || '-'}`;
                                })
                                .join('\n')
                            : '',
                          totalNikah > 0
                            ? `\n--- PENGUMUMAN PEMBERKATAN NIKAH (${totalNikah}) ---\n` +
                              filteredWartaNikah
                                .map((n) => {
                                  const p = (n as any).namaMempelaiPria || (n as any).mempelaiPria || (n as any).namaPria || (n as any).pria || 'Pria';
                                  const w = (n as any).namaMempelaiWanita || (n as any).mempelaiWanita || (n as any).namaWanita || (n as any).wanita || 'Wanita';
                                  return `• ${p} & ${w} - Tanggal: ${(n as any).tanggalPemberkatan || '-'}`;
                                })
                                .join('\n')
                            : '',
                          (warta.beritaTambahanList?.length || 0) > 0
                            ? `\n--- PENGUMUMAN LAINNYA (${warta.beritaTambahanList?.length || 0}) ---\n` +
                              warta.beritaTambahanList
                                .map((t) => `• ${t.judul}: ${t.isi}`)
                                .join('\n')
                            : '',
                        ].filter(Boolean);

                        navigator.clipboard.writeText(lines.join('\n'));
                        setCopiedWartaId(warta.id);
                        setTimeout(() => setCopiedWartaId(null), 2500);
                      };

                      return (
                        <div
                          key={warta.id}
                          className={`rounded-2xl p-5 space-y-4 transition-all hover:shadow-md flex flex-col justify-between ${
                            isLatestItem
                              ? 'bg-gradient-to-br from-indigo-50/80 via-white to-blue-50/60 dark:from-slate-900 dark:via-slate-900 dark:to-indigo-950/60 border-2 border-indigo-400 dark:border-indigo-500/60 shadow-md ring-2 ring-indigo-400/20 dark:ring-indigo-500/20'
                              : 'bg-gradient-to-br from-slate-50 to-blue-50/20 dark:from-slate-900 dark:to-slate-900/95 border border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-700/60'
                          }`}
                        >
                          <div className="space-y-3">
                            {/* Header row: Edisi & Tanggal */}
                            <div className="flex items-center justify-between gap-2 flex-wrap border-b border-slate-200/70 dark:border-slate-800 pb-2.5">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className={`text-[10px] font-mono font-extrabold px-2.5 py-0.5 rounded-md border ${
                                  isLatestItem
                                    ? 'bg-indigo-600 text-white border-indigo-700 shadow-2xs'
                                    : 'bg-blue-100 dark:bg-blue-950/80 text-blue-900 dark:text-blue-300 border-blue-200 dark:border-blue-800/60'
                                }`}>
                                  {warta.nomorEdisi || 'Warta Mingguan'}
                                </span>
                                {isLatestItem && (
                                  <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 rounded-md border border-emerald-300 dark:border-emerald-700/60">
                                    Edisi Terbaru (Terakhir)
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                                <Calendar className="w-3 h-3 text-slate-400 dark:text-slate-400" />
                                {displayTanggal}
                              </span>
                            </div>

                            {/* Title & Status */}
                            <div>
                              <div className="flex items-start justify-between gap-2">
                                <h4 className="font-extrabold text-slate-900 dark:text-white text-sm leading-snug font-serif">
                                  {displayJudul}
                                </h4>
                                {warta.status && (
                                  <span className="shrink-0 text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 rounded-full border border-emerald-200 dark:border-emerald-700/60">
                                    {warta.status}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Theme & Nats Card */}
                            <div className="bg-white dark:bg-slate-950/90 p-3 rounded-xl border border-slate-200 dark:border-slate-800 text-xs space-y-1.5 shadow-2xs">
                              <p className="font-bold text-slate-800 dark:text-slate-200 line-clamp-2">
                                <span className="text-blue-900 dark:text-sky-400 font-extrabold">Tema: </span>
                                {displayTema}
                              </p>
                              {displayNats && (
                                <p className="text-[11px] text-purple-700 dark:text-purple-300 font-mono font-semibold line-clamp-1 flex items-center gap-1">
                                  <BookOpen className="w-3 h-3 text-purple-500 dark:text-purple-400 shrink-0" />
                                  <span>Nats: {displayNats}</span>
                                </p>
                              )}
                              {warta.catatanGembala && (
                                <p className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-2 pt-1 border-t border-slate-100 dark:border-slate-800 italic">
                                  "{warta.catatanGembala}"
                                </p>
                              )}
                            </div>

                            {/* Info Badges */}
                            <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-semibold text-slate-600 dark:text-slate-300">
                              <span className="px-2 py-0.5 bg-blue-50 dark:bg-blue-950/70 text-blue-900 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60 rounded-md font-semibold">
                                {totalPelayanan} Kebaktian
                              </span>
                              {typeof saldoKas === 'number' && (
                                <span className="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 rounded-md font-mono font-bold">
                                  Kas: Rp {saldoKas.toLocaleString('id-ID')}
                                </span>
                              )}
                              {totalHut > 0 && (
                                <span className="px-2 py-0.5 bg-rose-50 dark:bg-rose-950/70 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60 rounded-md font-semibold">
                                  {totalHut} HUT
                                </span>
                              )}
                              {(totalDuka > 0 || totalNikah > 0) && (
                                <span className="px-2 py-0.5 bg-purple-50 dark:bg-purple-950/70 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60 rounded-md font-semibold">
                                  {totalDuka > 0 ? `${totalDuka} Duka` : ''}
                                  {totalDuka > 0 && totalNikah > 0 ? ' • ' : ''}
                                  {totalNikah > 0 ? `${totalNikah} Nikah` : ''}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2">
                            <button
                              type="button"
                              onClick={() => setSelectedWartaDetail(warta)}
                              className={`w-full px-3 py-2.5 rounded-xl !text-white text-white font-bold text-xs shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer hover:scale-[1.01] active:scale-[0.99] btn-solid-white-text ${
                                isLatestItem
                                  ? 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 shadow-blue-500/20'
                                  : 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 shadow-blue-500/20'
                              }`}
                            >
                              <Eye className="w-4 h-4 !text-white text-white shrink-0" />
                              <span className="!text-white text-white font-bold tracking-wide">
                                {isLatestItem ? 'Lihat Ringkasan Edisi Terakhir' : 'Lihat Detail Ringkasan Warta'}
                              </span>
                            </button>

                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={handleCopyWarta}
                                className="btn-salin-teks flex-1 px-2.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-bold text-[11px] border border-slate-300 dark:border-slate-600 flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                                title="Salin Ringkasan Teks Warta"
                              >
                                {copiedWartaId === warta.id ? (
                                  <>
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                                    <span className="text-emerald-700 dark:text-emerald-300 font-extrabold">Tersalin!</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3.5 h-3.5 text-slate-700 dark:text-slate-200 shrink-0" />
                                    <span className="text-slate-900 dark:text-white font-bold">Salin Teks</span>
                                  </>
                                )}
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  openPrintReport({
                                    reportType: 'berita_jemaat',
                                    beritaJemaatId: warta.id,
                                    customTitle: `WARTA JEMAAT - ${warta.nomorEdisi || displayJudul}`,
                                  })
                                }
                                className={`flex-1 px-2.5 py-2 rounded-xl !text-white text-white font-bold text-[11px] shadow-2xs flex items-center justify-center gap-1.5 transition-all cursor-pointer btn-solid-white-text ${
                                  isLatestItem
                                    ? 'bg-emerald-600 hover:bg-emerald-500 ring-1 ring-emerald-400/40'
                                    : 'bg-emerald-700 hover:bg-emerald-600'
                                }`}
                                title="Buka & Cetak Format PDF Resmi"
                              >
                                <Printer className="w-3.5 h-3.5 !text-white text-white shrink-0" />
                                <span className="!text-white text-white font-bold">
                                  {isLatestItem ? 'Cetak Edisi Terakhir' : 'Cetak PDF'}
                                </span>
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB: RANCANGAN KHOTBAH AKTIF */}
        {activePortalTab === 'rancangan_khotbah' && (
          <div className="space-y-6">
            <div className="portal-dark-card bg-gradient-to-r from-purple-950 via-slate-900 to-indigo-950 !text-white text-white p-6 rounded-2xl shadow-lg border border-purple-500/30 space-y-2" style={{ background: 'linear-gradient(135deg, #3b0764 0%, #0f172a 50%, #1e1b4b 100%)', color: '#ffffff' }}>
              <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-[10px] font-extrabold uppercase border border-purple-400/30" style={{ color: '#d8b4fe', WebkitTextFillColor: '#d8b4fe' }}>
                <ScrollText className="w-3 h-3 text-purple-300" /> Bimbingan Firman &amp; Khotbah Minggu
              </span>
              <h2 className="banner-title text-xl md:text-2xl font-extrabold font-serif !text-white text-white" style={{ color: '#ffffff', WebkitTextFillColor: '#ffffff' }}>
                Rancangan Khotbah &amp; Pokok Pengajaran
              </h2>
              <p className="text-xs sm:text-sm !text-slate-200 text-slate-200 max-w-2xl leading-relaxed" style={{ color: '#e2e8f0', WebkitTextFillColor: '#e2e8f0' }}>
                Panduan rancangan khotbah aktif untuk ibadah minggu, ibadah sektor, dan kategorial. Disusun oleh MPH Majelis Jemaat {settings.namaJemaat} untuk pengayaan rohani warga jemaat.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pb-3 border-b">
                <h3 className="font-extrabold text-slate-900 text-sm uppercase tracking-wider flex items-center gap-2">
                  <BookOpen className="w-4.5 h-4.5 text-purple-600" />
                  <span>Daftar Rancangan Khotbah Aktif</span>
                </h3>
                <div className="relative w-full sm:w-64">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Cari tema / nats / pengkhotbah..."
                    value={khotbahSearch}
                    onChange={(e) => setKhotbahSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div className="space-y-4">
                {rancanganKhotbahList
                  .filter((k) => {
                    const q = khotbahSearch.toLowerCase();
                    return (
                      (k.judulKhotbah || (k as any).judulTema || '').toLowerCase().includes(q) ||
                      (k.temaKhotbah || '').toLowerCase().includes(q) ||
                      (k.natsAlkitab || '').toLowerCase().includes(q) ||
                      (k.pengkhotbah || '').toLowerCase().includes(q) ||
                      (k.jenisIbadah || (k as any).kategoriIbadah || '').toLowerCase().includes(q)
                    );
                  })
                  .map((item) => {
                    const displayTitle = item.judulKhotbah || (item as any).judulTema || item.temaKhotbah || 'Rancangan Khotbah';
                    const displayCategory = item.jenisIbadah || (item as any).kategoriIbadah || 'Kebaktian Minggu';
                    const displayPoints = item.poinUtama || [];

                    const handleCopy = () => {
                      const lines = [
                        `RANCANGAN KHOTBAH - ${settings.namaJemaat}`,
                        `Judul: ${displayTitle}`,
                        item.temaKhotbah ? `Tema: ${item.temaKhotbah}` : '',
                        `Nats Alkitab: ${item.natsAlkitab}`,
                        `Pelayan Firman: ${item.pengkhotbah}`,
                        `Tanggal: ${item.tanggal} | Jenis Ibadah: ${displayCategory} | Durasi: ${item.durasiTotalMenit || 20} Menit`,
                        item.metodeHomiletika ? `Metode Homiletika: ${item.metodeHomiletika}` : '',
                        item.nadaPastoral ? `Nada Pastoral: ${item.nadaPastoral}` : '',
                        '',
                        item.pendahuluan ? `--- PENDAHULUAN ---\n${item.pendahuluan}\n` : '',
                        '--- OUTLINE & POIN-POIN KHOTBAH ---',
                        displayPoints.length > 0
                          ? displayPoints.map((p, idx) => `Poin ${idx + 1}: ${p.poin}\nAyat Pendukung: ${p.ayatPendukung || '-'}\nPenjelasan: ${p.penjelasan || '-'}`).join('\n\n')
                          : ((item as any).poinKhotbah || '-'),
                        '',
                        item.penerapanAplikasi ? `--- PENERAPAN & APLIKASI PRAKTIS ---\n${item.penerapanAplikasi}\n` : '',
                        item.penutupDoa ? `--- PENUTUP & DOA ---\n${item.penutupDoa}` : '',
                      ].filter(Boolean);

                      navigator.clipboard.writeText(lines.join('\n'));
                      setCopiedKhotbahId(item.id);
                      setTimeout(() => setCopiedKhotbahId(null), 2500);
                    };

                    return (
                      <div
                        key={item.id}
                        className="bg-gradient-to-br from-slate-50 to-purple-50/20 dark:from-slate-900 dark:to-slate-900/95 border border-slate-200 dark:border-slate-800 hover:border-purple-300 dark:hover:border-purple-700/60 rounded-2xl p-5 space-y-4 transition-all shadow-xs"
                      >
                        {/* Header Row */}
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/80 dark:border-slate-800 pb-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="px-2.5 py-1 bg-purple-100 dark:bg-purple-950/80 text-purple-900 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60 text-[10px] font-extrabold rounded-lg uppercase">
                              {displayCategory}
                            </span>
                            <span className="text-xs font-mono font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5 text-slate-400 dark:text-slate-400" />
                              <span>{item.tanggal}</span>
                            </span>
                            {item.durasiTotalMenit && (
                              <span className="text-[10px] font-bold text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/70 border border-amber-200 dark:border-amber-800/60 px-2 py-0.5 rounded-md flex items-center gap-1">
                                <Clock className="w-2.5 h-2.5 text-amber-600 dark:text-amber-400" />
                                <span>{item.durasiTotalMenit} Menit</span>
                              </span>
                            )}
                          </div>
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 px-3 py-1 rounded-full border border-slate-200 dark:border-slate-700 shadow-2xs">
                            Pelayan Firman: <strong className="text-purple-950 dark:text-purple-300">{item.pengkhotbah}</strong>
                          </span>
                        </div>

                        {/* Title, Theme, Nats */}
                        <div className="space-y-1.5">
                          <h4 className="text-base font-extrabold text-slate-900 dark:text-white font-serif leading-snug">
                            {displayTitle}
                          </h4>
                          {item.temaKhotbah && item.temaKhotbah !== displayTitle && (
                            <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                              Tema: <span className="italic text-slate-800 dark:text-slate-200 font-semibold">{item.temaKhotbah}</span>
                            </p>
                          )}
                          <p className="text-xs font-mono font-extrabold text-purple-800 dark:text-purple-300 flex items-center gap-1.5 pt-0.5">
                            <BookOpen className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 shrink-0" />
                            <span>Nats Alkitab: {item.natsAlkitab}</span>
                          </p>
                        </div>

                        {/* Badges: Homiletika & Pastoral */}
                        {(item.metodeHomiletika || item.nadaPastoral || item.sasaranPendengar) && (
                          <div className="flex flex-wrap gap-1.5">
                            {item.metodeHomiletika && (
                              <span className="text-[10px] font-semibold text-purple-800 bg-purple-100/70 px-2 py-0.5 rounded border border-purple-200">
                                Metode: {item.metodeHomiletika}
                              </span>
                            )}
                            {item.nadaPastoral && (
                              <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-100/70 px-2 py-0.5 rounded border border-emerald-200">
                                Nada: {item.nadaPastoral}
                              </span>
                            )}
                            {item.sasaranPendengar && (
                              <span className="text-[10px] font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                                Sasaran: {item.sasaranPendengar}
                              </span>
                            )}
                          </div>
                        )}

                        {/* Content Preview Box */}
                        <div className="bg-white p-4 rounded-xl border border-slate-200 text-xs text-slate-700 space-y-3 font-sans shadow-2xs">
                          {item.pendahuluan && (
                            <div>
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                                Pendahuluan / Orientasi
                              </span>
                              <p className="line-clamp-2 text-slate-700 text-xs leading-relaxed">
                                {item.pendahuluan}
                              </p>
                            </div>
                          )}

                          {displayPoints.length > 0 && (
                            <div className="space-y-1.5 pt-1 border-t border-slate-100">
                              <span className="text-[10px] font-bold text-purple-900 uppercase tracking-wider block mb-1">
                                Pokok-Pokok Khotbah ({displayPoints.length} Poin)
                              </span>
                              <div className="space-y-1.5">
                                {displayPoints.map((p, idx) => (
                                  <div key={idx} className="flex items-start gap-2 text-xs">
                                    <span className="w-4 h-4 rounded-full bg-purple-100 text-purple-900 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5 border border-purple-200">
                                      {idx + 1}
                                    </span>
                                    <div className="flex-1">
                                      <span className="font-bold text-slate-900">{p.poin}</span>
                                      {p.ayatPendukung && (
                                        <span className="text-[10px] text-purple-700 font-mono ml-2 font-semibold">
                                          ({p.ayatPendukung})
                                        </span>
                                      )}
                                      {p.penjelasan && (
                                        <p className="text-[11px] text-slate-600 line-clamp-1 mt-0.5">
                                          {p.penjelasan}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {displayPoints.length === 0 && !item.pendahuluan && (item as any).poinKhotbah && (
                            <p className="line-clamp-3 text-slate-700 whitespace-pre-line text-xs leading-relaxed">
                              {(item as any).poinKhotbah}
                            </p>
                          )}

                          {item.penerapanAplikasi && (
                            <div className="pt-1 border-t border-slate-100">
                              <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block mb-0.5">
                                Penerapan &amp; Aplikasi Hidup
                              </span>
                              <p className="line-clamp-1 text-slate-600 text-[11px] leading-relaxed">
                                {item.penerapanAplikasi}
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200/80">
                          <button
                            type="button"
                            onClick={() => setSelectedKhotbahDetail(item)}
                            className="px-4 py-2 rounded-xl bg-purple-700 hover:bg-purple-600 text-white font-extrabold text-xs shadow-sm flex items-center gap-1.5 transition-all cursor-pointer hover:scale-102 active:scale-98"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Lihat Detail &amp; Naskah Lengkap</span>
                          </button>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={handleCopy}
                              className="btn-salin-teks px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-bold text-xs border border-slate-300 dark:border-slate-600 flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                              title="Salin Teks Rancangan Khotbah"
                            >
                              {copiedKhotbahId === item.id ? (
                                <>
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                                  <span className="text-emerald-700 dark:text-emerald-300 font-extrabold">Tersalin!</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3.5 h-3.5 text-slate-700 dark:text-slate-200 shrink-0" />
                                  <span className="text-slate-900 dark:text-white font-bold">Salin Teks</span>
                                </>
                              )}
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                openPrintReport({
                                  reportType: 'rancangan_khotbah',
                                  khotbahId: item.id,
                                })
                              }
                              className="px-3 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
                              title="Cetak Format Dokumen PDF Resmi"
                            >
                              <Printer className="w-3.5 h-3.5" />
                              <span>Cetak PDF</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        )}

        {/* TAB: ULANG TAHUN KELAHIRAN & PERNIKAHAN WARGA JEMAAT */}
        {activePortalTab === 'ulang_tahun' && (() => {
          // Helper parsing & processing item ulang tahun kelahiran & pernikahan
          const MONTH_NAMES = [
            'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
            'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
          ];

          const parseDateHelper = (str?: string) => {
            if (!str || !str.trim()) return null;
            const s = str.trim();
            const ymd = s.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
            if (ymd) {
              const y = parseInt(ymd[1], 10);
              const m = parseInt(ymd[2], 10);
              const d = parseInt(ymd[3], 10);
              if (m >= 1 && m <= 12 && d >= 1 && d <= 31) return { year: y, month: m, day: d };
            }
            const dmy = s.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
            if (dmy) {
              const d = parseInt(dmy[1], 10);
              const m = parseInt(dmy[2], 10);
              const y = parseInt(dmy[3], 10);
              if (m >= 1 && m <= 12 && d >= 1 && d <= 31) return { year: y, month: m, day: d };
            }
            return null;
          };

          // 1. Data Ulang Tahun Kelahiran
          const birthItems: Array<{
            id: string;
            jenis: 'lahir' | 'pernikahan';
            namaLengkap: string;
            labelPasangan?: string;
            tanggalFormatted: string;
            rayon: string;
            noKjj: string;
            noHp?: string;
            bulan: number;
            hari: number;
          }> = [];

          wargaJemaatList.forEach((w) => {
            if (w.statusKeanggotaan !== 'Meninggal' && w.tanggalLahir && w.tanggalLahir.trim()) {
              const p = parseDateHelper(w.tanggalLahir);
              birthItems.push({
                id: `birth-${w.id}`,
                jenis: 'lahir',
                namaLengkap: w.namaLengkap,
                tanggalFormatted: p ? `${String(p.day).padStart(2, '0')} ${MONTH_NAMES[p.month - 1]} ${p.year}` : w.tanggalLahir,
                rayon: w.rayon || 'Lingkungan Pelayanan',
                noKjj: w.noKjj || '-',
                noHp: w.noHp,
                bulan: p ? p.month : 99,
                hari: p ? p.day : 99,
              });
            }
          });

          // 2. Data Ulang Tahun Pernikahan
          const weddingItems: Array<{
            id: string;
            jenis: 'lahir' | 'pernikahan';
            namaLengkap: string;
            labelPasangan?: string;
            tanggalFormatted: string;
            rayon: string;
            noKjj: string;
            noHp?: string;
            bulan: number;
            hari: number;
          }> = [];

          const processedCouples = new Set<string>();
          wargaJemaatList.forEach((w) => {
            if (
              w.statusKeanggotaan !== 'Meninggal' &&
              w.tanggalPernikahan &&
              w.tanggalPernikahan.trim() &&
              (w.statusNikah === 'Menikah' || w.tanggalPernikahan)
            ) {
              const coupleKey = `${w.noKjj || 'kjj'}_${w.tanggalPernikahan}`;
              if (!processedCouples.has(coupleKey)) {
                processedCouples.add(coupleKey);
                const family = wargaJemaatList.filter(
                  (m) => m.noKjj === w.noKjj && (m.statusNikah === 'Menikah' || m.tanggalPernikahan === w.tanggalPernikahan)
                );
                const suami = family.find((m) => m.hubunganKeluarga === 'Kepala Keluarga' || m.jenisKelamin === 'L');
                const istri = family.find((m) => m.hubunganKeluarga === 'Istri' || (m.jenisKelamin === 'P' && m.id !== suami?.id));

                let namaLabel = '';
                if (suami && istri) {
                  namaLabel = `Kel. Bpk. ${suami.namaLengkap} & Ny. ${istri.namaLengkap}`;
                } else if (suami) {
                  namaLabel = `Kel. Bpk. ${suami.namaLengkap}`;
                } else if (istri) {
                  namaLabel = `Kel. Ny. ${istri.namaLengkap}`;
                } else {
                  namaLabel = `Kel. ${w.namaLengkap}`;
                }

                const p = parseDateHelper(w.tanggalPernikahan);
                weddingItems.push({
                  id: `wedding-${w.id}`,
                  jenis: 'pernikahan',
                  namaLengkap: namaLabel,
                  labelPasangan: suami && istri ? `${suami.namaLengkap} & ${istri.namaLengkap}` : undefined,
                  tanggalFormatted: p ? `${String(p.day).padStart(2, '0')} ${MONTH_NAMES[p.month - 1]} ${p.year}` : w.tanggalPernikahan,
                  rayon: w.rayon || 'Lingkungan Pelayanan',
                  noKjj: w.noKjj || '-',
                  noHp: suami?.noHp || istri?.noHp || w.noHp,
                  bulan: p ? p.month : 99,
                  hari: p ? p.day : 99,
                });
              }
            }
          });

          // Gabungkan & Filter Jenis
          let combinedList = [...birthItems, ...weddingItems];
          if (ulangTahunFilter === 'lahir') {
            combinedList = birthItems;
          } else if (ulangTahunFilter === 'pernikahan') {
            combinedList = weddingItems;
          }

          // Filter Pencarian
          if (ulangTahunSearch.trim()) {
            const q = ulangTahunSearch.toLowerCase().trim();
            combinedList = combinedList.filter(
              (item) =>
                item.namaLengkap.toLowerCase().includes(q) ||
                item.rayon.toLowerCase().includes(q) ||
                item.noKjj.toLowerCase().includes(q) ||
                item.tanggalFormatted.toLowerCase().includes(q)
            );
          }

          const countSemua = birthItems.length + weddingItems.length;
          const countLahir = birthItems.length;
          const countNikah = weddingItems.length;

          return (
            <div className="space-y-6">
              <div className="portal-dark-card bg-gradient-to-r from-rose-950 via-slate-900 to-pink-950 !text-white text-white p-6 rounded-2xl shadow-lg border border-rose-500/30 space-y-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-rose-500/20 text-rose-300 text-[10px] font-extrabold uppercase border border-rose-400/30">
                  <Cake className="w-3 h-3 text-rose-300" /> Syukuran &amp; Doa Jemaat
                </span>
                <h2 className="banner-title text-xl md:text-2xl font-extrabold font-serif !text-white text-white" style={{ color: '#ffffff' }}>
                  Ulang Tahun Kelahiran &amp; Pernikahan Warga Jemaat
                </h2>
                <p className="text-xs !text-slate-200 text-slate-200 max-w-2xl leading-relaxed" style={{ color: '#e2e8f0' }}>
                  Daftar warga jemaat yang merayakan Ulang Tahun Kelahiran dan Ulang Tahun Pernikahan Kudus. Mari kita saling mendoakan dan mengucapkan selamat!
                </p>
              </div>

              {/* Filter Tabs */}
              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setUlangTahunFilter('semua')}
                  className={`btn-filter-ulang-tahun px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                    ulangTahunFilter === 'semua'
                      ? 'active bg-rose-600 text-white shadow-md'
                      : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 shadow-2xs'
                  }`}
                >
                  <span>Semua Ulang Tahun</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                    ulangTahunFilter === 'semua' ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200'
                  }`}>
                    {countSemua}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setUlangTahunFilter('lahir')}
                  className={`btn-filter-ulang-tahun px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                    ulangTahunFilter === 'lahir'
                      ? 'active bg-rose-600 text-white shadow-md'
                      : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 shadow-2xs'
                  }`}
                >
                  <Cake className="w-4 h-4 text-rose-500 dark:text-rose-400" />
                  <span>Ulang Tahun Kelahiran</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                    ulangTahunFilter === 'lahir' ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200'
                  }`}>
                    {countLahir}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setUlangTahunFilter('pernikahan')}
                  className={`btn-filter-ulang-tahun px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                    ulangTahunFilter === 'pernikahan'
                      ? 'active bg-rose-600 text-white shadow-md'
                      : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 shadow-2xs'
                  }`}
                >
                  <Heart className="w-4 h-4 text-purple-500 dark:text-purple-400" />
                  <span>Ulang Tahun Pernikahan</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                    ulangTahunFilter === 'pernikahan' ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200'
                  }`}>
                    {countNikah}
                  </span>
                </button>
              </div>

              {/* Content Table Card */}
              <div className="ulang-tahun-card bg-white dark:bg-[#0f172a] rounded-2xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-md space-y-4">
                {/* Header inside card: search & total counter */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                      Daftar Warga Jemaat
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-200 border border-rose-200 dark:border-rose-800">
                      {combinedList.length} Terdaftar
                    </span>
                  </div>
                  <div className="relative w-full sm:w-72">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                    <input
                      type="text"
                      placeholder="Cari nama, KJJ, atau sektor..."
                      value={ulangTahunSearch}
                      onChange={(e) => setUlangTahunSearch(e.target.value)}
                      className="w-full pl-9 pr-8 py-2 bg-slate-50 dark:bg-slate-800/90 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/40"
                    />
                    {ulangTahunSearch && (
                      <button
                        type="button"
                        onClick={() => setUlangTahunSearch('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Table Wrapper with explicit styling and background */}
                <div className="ulang-tahun-table-wrapper overflow-x-auto border border-slate-200 dark:border-slate-700/80 rounded-xl shadow-xs">
                  <table className="ulang-tahun-table w-full text-xs text-left">
                    <thead className="bg-slate-100 dark:bg-[#1e293b] text-slate-900 dark:text-white font-extrabold uppercase text-[11px] tracking-wider border-b border-slate-200 dark:border-slate-700">
                      <tr>
                        <th className="p-3.5 text-center w-12">No</th>
                        <th className="p-3.5">Nama Warga Jemaat / Pasangan</th>
                        <th className="p-3.5">Jenis Ulang Tahun</th>
                        <th className="p-3.5 font-mono">Tanggal Syukuran</th>
                        <th className="p-3.5">Sektor / Rayon</th>
                        <th className="p-3.5 text-center">Ucapan Doa WA</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {combinedList.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-8 text-center text-slate-500 dark:text-slate-400 italic">
                            {ulangTahunSearch ? 'Tidak ditemukan data sesuai pencarian.' : 'Belum ada data warga jemaat terdaftar.'}
                          </td>
                        </tr>
                      ) : (
                        combinedList.map((item, idx) => {
                          const waMsg =
                            item.jenis === 'pernikahan'
                              ? `Syalom ${item.namaLengkap}, Selamat Ulang Tahun Pernikahan! Kiranya kasih setia Kristus senantiasa menjaga kerukunan, damai sejahtera, dan kebahagiaan rumah tangga senantiasa. Salam hangat dari Majelis & Warga Jemaat ${formattedMajelisJemaat || settings.namaJemaat}.`
                              : `Syalom ${item.namaLengkap}, Selamat Ulang Tahun! Kiranya Tuhan Yesus senantiasa memberkati kesehatan, umur panjang, dan sukacita dalam hidup serta pelayanan. Salam hangat dari Majelis & Warga Jemaat ${formattedMajelisJemaat || settings.namaJemaat}.`;

                          return (
                            <tr
                              key={item.id}
                              className="bg-white dark:bg-[#0f172a] even:bg-slate-50/60 dark:even:bg-[#141f36] hover:bg-rose-50/60 dark:hover:bg-[#1e293b] transition-colors"
                            >
                              <td className="p-3.5 text-center font-mono font-bold text-slate-500 dark:text-slate-300">
                                {idx + 1}
                              </td>
                              <td className="p-3.5 font-extrabold text-slate-900 dark:text-white text-xs sm:text-sm">
                                <div>{item.namaLengkap}</div>
                                <div className="text-[10px] font-normal text-slate-500 dark:text-slate-400 mt-0.5">
                                  No. KJJ: {item.noKjj}
                                </div>
                              </td>
                              <td className="p-3.5">
                                {item.jenis === 'pernikahan' ? (
                                  <span className="badge-ulang-tahun-nikah inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold shadow-2xs">
                                    <Heart className="w-3.5 h-3.5 shrink-0" />
                                    <span>Ulang Tahun Pernikahan</span>
                                  </span>
                                ) : (
                                  <span className="badge-ulang-tahun-lahir inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold shadow-2xs">
                                    <Cake className="w-3.5 h-3.5 shrink-0" />
                                    <span>Ulang Tahun Kelahiran</span>
                                  </span>
                                )}
                              </td>
                              <td className="p-3.5">
                                <span className="chip-tanggal-syukuran inline-flex items-center gap-1.5 font-mono font-bold text-xs px-2.5 py-1 rounded-lg border">
                                  <Calendar className="w-3 h-3 text-slate-400 dark:text-slate-300" />
                                  <span>{item.tanggalFormatted}</span>
                                </span>
                              </td>
                              <td className="p-3.5 font-semibold text-slate-700 dark:text-slate-200">
                                {item.rayon}
                              </td>
                              <td className="p-3.5 text-center">
                                <a
                                  href={`https://wa.me/?text=${encodeURIComponent(waMsg)}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="btn-wa-ucapan inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold shadow-sm transition-all cursor-pointer"
                                  style={{ color: '#ffffff' }}
                                >
                                  <MessageCircle className="w-3.5 h-3.5 text-white" />
                                  <span className="text-white">Kirim Ucapan WA</span>
                                </a>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          );
        })()}

        {/* TAB: DATA LINGKUNGAN & SEKTOR JEMAAT */}
        {activePortalTab === 'lingkungan_sektor' && (
          <div className="space-y-6">
            <div className="portal-dark-card bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 !text-white text-white p-6 rounded-2xl shadow-lg border border-emerald-500/30 space-y-3" style={{ background: 'linear-gradient(135deg, #022c22 0%, #0f172a 50%, #042f2e 100%)' }}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-extrabold uppercase border border-emerald-400/30 tracking-wide" style={{ color: '#6ee7b7' }}>
                  <MapPin className="w-3.5 h-3.5 text-emerald-300" /> Wilayah Pelayanan Sektor
                </span>
                <span className="text-xs text-emerald-200 bg-emerald-950/70 px-3 py-1 rounded-lg border border-emerald-500/30 font-bold" style={{ color: '#a7f3d0' }}>
                  {formattedMajelisJemaat || settings.namaJemaat || 'GKE JEMAAT'}
                </span>
              </div>
              <h2 className="banner-title text-xl md:text-2xl font-black font-serif !text-white text-white tracking-tight" style={{ color: '#ffffff' }}>
                Data Lingkungan Pelayanan &amp; Sektor Jemaat
              </h2>
              <p className="text-xs sm:text-sm !text-slate-200 text-slate-200 max-w-3xl leading-relaxed" style={{ color: '#e2e8f0' }}>
                Informasi pembagian lingkungan pelayanan, cakupan wilayah sektor, koordinator penatua/diakon penanggung jawab, serta statistik kepala keluarga dan warga jemaat di {formattedMajelisJemaat || settings.namaJemaat || 'GKE'}.
              </p>

              {/* Summary Stats Header */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-emerald-800/40">
                <div className="p-3 rounded-xl border border-emerald-500/30 shadow-xs" style={{ backgroundColor: 'rgba(15, 23, 42, 0.75)' }}>
                  <p className="text-[10px] uppercase font-bold" style={{ color: '#94a3b8' }}>Total Lingkungan</p>
                  <p className="text-lg font-black" style={{ color: '#ffffff' }}>{lingkunganList.length} Wilayah</p>
                </div>
                <div className="p-3 rounded-xl border border-emerald-500/30 shadow-xs" style={{ backgroundColor: 'rgba(15, 23, 42, 0.75)' }}>
                  <p className="text-[10px] uppercase font-bold" style={{ color: '#94a3b8' }}>Lingkungan Aktif</p>
                  <p className="text-lg font-black" style={{ color: '#34d399' }}>
                    {lingkunganList.filter((l) => l.status === 'Aktif').length} Aktif
                  </p>
                </div>
                <div className="p-3 rounded-xl border border-emerald-500/30 shadow-xs" style={{ backgroundColor: 'rgba(15, 23, 42, 0.75)' }}>
                  <p className="text-[10px] uppercase font-bold" style={{ color: '#94a3b8' }}>Total Keluarga (KKJ)</p>
                  <p className="text-lg font-black" style={{ color: '#fcd34d' }}>
                    {new Set(wargaJemaatList.map((w) => w.noKjj).filter(Boolean)).size} KKJ
                  </p>
                </div>
                <div className="p-3 rounded-xl border border-emerald-500/30 shadow-xs" style={{ backgroundColor: 'rgba(15, 23, 42, 0.75)' }}>
                  <p className="text-[10px] uppercase font-bold" style={{ color: '#94a3b8' }}>Total Jiwa Jemaat</p>
                  <p className="text-lg font-black" style={{ color: '#38bdf8' }}>{wargaJemaatList.length} Jiwa</p>
                </div>
              </div>
            </div>

            {/* Filter and Search Bar */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cari kode, nama lingkungan, koordinator, jalan..."
                  value={lingkunganSearch}
                  onChange={(e) => setLingkunganSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-400 text-xs font-medium focus:outline-none focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-800"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <span className="text-slate-500 dark:text-slate-400 font-semibold whitespace-nowrap">Status:</span>
                {(['Semua', 'Aktif', 'Nonaktif'] as const).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setLingkunganStatusFilter(st)}
                    className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                      lingkunganStatusFilter === st
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {/* Lingkungan Cards List */}
            {(() => {
              const filteredLingk = lingkunganList.filter((item) => {
                const q = lingkunganSearch.toLowerCase().trim();
                const nama = (item.nama || (item as any).namaLingkungan || '').toLowerCase();
                const kode = (item.kode || '').toLowerCase();
                const ketua = (item.ketuaLingkungan || (item as any).koordinator || '').toLowerCase();
                const sekr = (item.sekretarisLingkungan || '').toLowerCase();
                const wil = (item.wilayahSektor || '').toLowerCase();
                const ket = (item.keterangan || '').toLowerCase();

                const matchQuery =
                  !q ||
                  nama.includes(q) ||
                  kode.includes(q) ||
                  ketua.includes(q) ||
                  sekr.includes(q) ||
                  wil.includes(q) ||
                  ket.includes(q);

                const matchStatus =
                  lingkunganStatusFilter === 'Semua' || (item.status || 'Aktif') === lingkunganStatusFilter;

                return matchQuery && matchStatus;
              });

              if (filteredLingk.length === 0) {
                return (
                  <div className="bg-white rounded-2xl p-10 border border-slate-200 text-center space-y-3">
                    <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                      <MapPin className="w-6 h-6" />
                    </div>
                    <h3 className="font-bold text-slate-800 text-sm">Tidak ada data lingkungan yang sesuai</h3>
                    <p className="text-xs text-slate-500 max-w-md mx-auto">
                      Silakan sesuaikan kata kunci pencarian Anda atau hubungi admin majelis jemaat untuk pembaruan data wilayah pelayanan.
                    </p>
                  </div>
                );
              }

              return (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {filteredLingk.map((lingk) => {
                    const namaDisplay =
                      lingk.nama || (lingk as any).namaLingkungan || `Lingkungan ${lingk.kode || ''}`;
                    const koordinatorDisplay =
                      lingk.ketuaLingkungan || (lingk as any).koordinator || 'Penatua Wilayah';
                    const cakupanWilayah =
                      lingk.wilayahSektor || lingk.keterangan || 'Wilayah pemukiman jemaat terdaftar';
                    const wargaInLingk = getWargaForLingkungan(lingk);
                    const kkjSet = new Set(wargaInLingk.map((w) => w.noKjj).filter(Boolean));
                    const totalKkj =
                      kkjSet.size || (lingk.jumlahKeluarga || (lingk as any).jumlahKkj || 0);
                    const totalJiwa = wargaInLingk.length;
                    const lakiLaki = wargaInLingk.filter((w) => w.jenisKelamin === 'L').length;
                    const perempuan = wargaInLingk.filter((w) => w.jenisKelamin === 'P').length;
                    const penatuaInLingk = getPenatuaForLingkungan(lingk);

                    return (
                      <div
                        key={lingk.id}
                        className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-emerald-400 transition-all flex flex-col justify-between space-y-4 group"
                      >
                        <div className="space-y-3.5">
                          {/* Card Top: Code & Status */}
                          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                            <div className="flex items-center gap-2">
                              <span className="px-2.5 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-950/80 text-emerald-900 dark:text-emerald-200 font-extrabold text-[11px] border border-emerald-200 dark:border-emerald-800">
                                {lingk.kode || 'L-WIL'}
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded-md font-extrabold text-[10px] border ${
                                  (lingk.status || 'Aktif') === 'Aktif'
                                    ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                                    : 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800'
                                }`}
                              >
                                {lingk.status || 'Aktif'}
                              </span>
                            </div>
                            <span className="px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-200 font-black text-xs border border-emerald-200 dark:border-emerald-800">
                              {totalKkj} KKJ
                            </span>
                          </div>

                          {/* Lingkungan Name & Sector */}
                          <div>
                            <h3 className="font-black text-slate-900 dark:text-white text-base group-hover:text-emerald-500 transition leading-snug">
                              {namaDisplay}
                            </h3>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-0.5 flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                              <span>{lingk.wilayahSektor ? `Sektor: ${lingk.wilayahSektor}` : 'Sektor / Rayon Wilayah'}</span>
                            </p>
                          </div>

                          {/* Quick Demographic Badges */}
                          <div className="grid grid-cols-2 gap-2 bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-700/60 text-center">
                            <div>
                              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold block">Total Jiwa</span>
                              <span className="text-xs font-black text-slate-900 dark:text-white">{totalJiwa} Jiwa</span>
                            </div>
                            <div>
                              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold block">Rasio (L / P)</span>
                              <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{lakiLaki} L / {perempuan} P</span>
                            </div>
                          </div>

                          {/* Coordinator & Officers Info */}
                          <div className="space-y-2 text-xs">
                            <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700/60 space-y-1">
                              <span className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                                Koordinator Penatua / Diakon:
                              </span>
                              <p className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                                <UserCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                                <span>{koordinatorDisplay}</span>
                              </p>
                              {lingk.sekretarisLingkungan && (
                                <p className="text-[11px] text-slate-600 dark:text-slate-300 pt-1 border-t border-slate-200/60 dark:border-slate-700/60 mt-1">
                                  <span className="text-slate-500 dark:text-slate-400 font-semibold">Sekretaris:</span>{' '}
                                  <span className="font-bold text-slate-800 dark:text-slate-200">{lingk.sekretarisLingkungan}</span>
                                </p>
                              )}
                            </div>

                            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/60 space-y-1">
                              <span className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                                Cakupan Wilayah / Jalan:
                              </span>
                              <p className="text-slate-700 dark:text-slate-300 text-xs leading-relaxed font-medium">
                                {cakupanWilayah}
                              </p>
                            </div>

                            {/* Additional Notes if present */}
                            {lingk.keterangan && lingk.keterangan !== cakupanWilayah && (
                              <div className="px-3 py-2 bg-emerald-50/50 dark:bg-emerald-950/40 rounded-xl border border-emerald-100 dark:border-emerald-800/60 text-[11px] text-emerald-900 dark:text-emerald-200 italic">
                                "{lingk.keterangan}"
                              </div>
                            )}

                            {/* Penatua / Diakon Pembina tags if assigned */}
                            {penatuaInLingk.length > 0 && (
                              <div className="space-y-1 pt-1">
                                <span className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                                  Majelis Pembina Wilayah ({penatuaInLingk.length}):
                                </span>
                                <div className="flex flex-wrap gap-1">
                                  {penatuaInLingk.map((p) => (
                                    <span
                                      key={p.id}
                                      className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-[10px] font-bold"
                                    >
                                      {p.gelar ? `${p.gelar} ` : ''}{p.nama} ({p.jabatan || 'Majelis'})
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Button: View Family Details */}
                        <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedLingkunganModal(lingk);
                              setLingkunganModalSearch('');
                            }}
                            className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-98 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm shadow-emerald-700/20 cursor-pointer"
                          >
                            <Users className="w-3.5 h-3.5" />
                            <span>Lihat Rincian &amp; Daftar Warga ({totalJiwa} Jiwa)</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}

            {/* Modal Detail Lingkungan & Rincian Warga */}
            {selectedLingkunganModal && (
              <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in">
                <div className="bg-white dark:bg-slate-900 w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
                  {/* Modal Header */}
                  <div className="modal-dark-header bg-gradient-to-r from-emerald-900 to-slate-900 !text-white text-white p-5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300 font-extrabold">
                        <MapPin className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded bg-emerald-400/20 text-emerald-300 text-[10px] font-mono font-bold border border-emerald-400/30">
                            {selectedLingkunganModal.kode || 'L-WIL'}
                          </span>
                          <h3 className="modal-title font-black text-lg !text-white text-white">
                            {selectedLingkunganModal.nama || selectedLingkunganModal.namaLingkungan}
                          </h3>
                        </div>
                        <p className="text-xs !text-slate-200 text-slate-200 mt-0.5">
                          {selectedLingkunganModal.wilayahSektor
                            ? `Cakupan Sektor: ${selectedLingkunganModal.wilayahSektor}`
                            : 'Wilayah Pelayanan Jemaat'}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedLingkunganModal(null)}
                      className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 hover:text-white transition cursor-pointer"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Modal Body */}
                  <div className="p-5 space-y-5 overflow-y-auto flex-1 text-xs text-slate-700 dark:text-slate-200">
                    {/* Lingkungan Overview Box */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {(() => {
                        const wargaInModal = getWargaForLingkungan(selectedLingkunganModal);
                        const kkjInModal = new Set(wargaInModal.map((w) => w.noKjj).filter(Boolean)).size;
                        const baptisInModal = wargaInModal.filter((w) => w.statusBaptis).length;
                        const sidiInModal = wargaInModal.filter((w) => w.statusSidi).length;

                        return (
                          <>
                            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 rounded-xl border border-emerald-200 dark:border-emerald-800">
                              <span className="text-[10px] font-bold uppercase text-emerald-800 dark:text-emerald-300 block">Total Keluarga</span>
                              <span className="text-lg font-black text-emerald-950 dark:text-emerald-100">{kkjInModal} KKJ</span>
                            </div>
                            <div className="p-3 bg-sky-50 dark:bg-sky-950/60 rounded-xl border border-sky-200 dark:border-sky-800">
                              <span className="text-[10px] font-bold uppercase text-sky-800 dark:text-sky-300 block">Total Jiwa</span>
                              <span className="text-lg font-black text-sky-950 dark:text-sky-100">{wargaInModal.length} Jiwa</span>
                            </div>
                            <div className="p-3 bg-indigo-50 dark:bg-indigo-950/60 rounded-xl border border-indigo-200 dark:border-indigo-800">
                              <span className="text-[10px] font-bold uppercase text-indigo-800 dark:text-indigo-300 block">Warga Baptis</span>
                              <span className="text-lg font-black text-indigo-950 dark:text-indigo-100">{baptisInModal} Jiwa</span>
                            </div>
                            <div className="p-3 bg-purple-50 dark:bg-purple-950/60 rounded-xl border border-purple-200 dark:border-purple-800">
                              <span className="text-[10px] font-bold uppercase text-purple-800 dark:text-purple-300 block">Warga Sidi</span>
                              <span className="text-lg font-black text-purple-950 dark:text-purple-100">{sidiInModal} Jiwa</span>
                            </div>
                          </>
                        );
                      })()}
                    </div>

                    {/* Coordinators & Officers Info */}
                    <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700 grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Koordinator Penatua / Diakon:</span>
                        <p className="font-bold text-slate-900 dark:text-white text-sm mt-0.5">
                          {selectedLingkunganModal.ketuaLingkungan || selectedLingkunganModal.koordinator || 'Penatua Wilayah'}
                        </p>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Sekretaris Lingkungan:</span>
                        <p className="font-bold text-slate-900 dark:text-white text-sm mt-0.5">
                          {selectedLingkunganModal.sekretarisLingkungan || '-'}
                        </p>
                      </div>
                    </div>

                    {/* Search inside Lingkungan */}
                    <div className="flex items-center justify-between gap-3 pt-2">
                      <div className="relative flex-1">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          placeholder="Cari nama warga, nomor KKJ, atau hubungan keluarga..."
                          value={lingkunganModalSearch}
                          onChange={(e) => setLingkunganModalSearch(e.target.value)}
                          className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-400 text-xs font-medium focus:outline-none focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-800"
                        />
                      </div>
                    </div>

                    {/* Member List Table */}
                    <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-2xs">
                      <div className="overflow-x-auto max-h-[350px]">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-white font-extrabold uppercase text-[10px] sticky top-0 border-b border-slate-200 dark:border-slate-800">
                            <tr>
                              <th className="p-3 text-center w-10">No</th>
                              <th className="p-3">No. KKJ</th>
                              <th className="p-3">Nama Lengkap</th>
                              <th className="p-3 text-center">L/P</th>
                              <th className="p-3">Hubungan Keluarga</th>
                              <th className="p-3 text-center">Baptis / Sidi</th>
                              <th className="p-3">Alamat Domisili</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                            {(() => {
                              const wargaAll = getWargaForLingkungan(selectedLingkunganModal);
                              const q = lingkunganModalSearch.toLowerCase().trim();
                              const filtered = wargaAll.filter(
                                (w) =>
                                  !q ||
                                  (w.namaLengkap || '').toLowerCase().includes(q) ||
                                  (w.noKjj || '').toLowerCase().includes(q) ||
                                  (w.hubunganKeluarga || '').toLowerCase().includes(q) ||
                                  (w.alamat || '').toLowerCase().includes(q)
                              );

                              if (filtered.length === 0) {
                                return (
                                  <tr>
                                    <td colSpan={7} className="p-6 text-center text-slate-500 dark:text-slate-300 italic">
                                      Belum ada data warga terdaftar di lingkungan ini atau tidak cocok dengan pencarian.
                                    </td>
                                  </tr>
                                );
                              }

                              return filtered.map((w, idx) => (
                                <tr key={w.id} className="hover:bg-emerald-50/40 dark:hover:bg-slate-800/60 transition">
                                  <td className="p-3 text-center font-mono text-slate-500 dark:text-slate-400">{idx + 1}</td>
                                  <td className="p-3 font-mono font-bold text-slate-900 dark:text-white">{w.noKjj}</td>
                                  <td className="p-3 font-bold text-slate-900 dark:text-white">{w.namaLengkap}</td>
                                  <td className="p-3 text-center font-bold text-slate-700 dark:text-slate-200">{w.jenisKelamin}</td>
                                  <td className="p-3">
                                    <span
                                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                        w.hubunganKeluarga === 'Kepala Keluarga'
                                          ? 'bg-amber-100 dark:bg-amber-950/70 text-amber-900 dark:text-amber-200 border border-amber-200 dark:border-amber-800'
                                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700'
                                      }`}
                                    >
                                      {w.hubunganKeluarga || 'Anggota'}
                                    </span>
                                  </td>
                                  <td className="p-3 text-center">
                                    <div className="inline-flex gap-1">
                                      <span
                                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                          w.statusBaptis
                                            ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800'
                                            : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500'
                                        }`}
                                      >
                                        {w.statusBaptis ? 'Baptis' : '-'}
                                      </span>
                                      <span
                                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                          w.statusSidi
                                            ? 'bg-sky-100 dark:bg-sky-950/80 text-sky-800 dark:text-sky-200 border border-sky-200 dark:border-sky-800'
                                            : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500'
                                        }`}
                                      >
                                        {w.statusSidi ? 'Sidi' : '-'}
                                      </span>
                                    </div>
                                  </td>
                                  <td className="p-3 text-slate-600 dark:text-slate-300 max-w-[200px] truncate">
                                    {w.alamat || selectedLingkunganModal.wilayahSektor || '-'}
                                  </td>
                                </tr>
                              ));
                            })()}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>

                  {/* Modal Footer */}
                  <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex justify-end">
                    <button
                      type="button"
                      onClick={() => setSelectedLingkunganModal(null)}
                      className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 text-white font-bold text-xs transition cursor-pointer border border-transparent dark:border-slate-700"
                    >
                      Tutup
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB: DATA PERNIKAHAN KUDUS, BAPTISAN KUDUS & SIDI */}
        {activePortalTab === 'sakramen_sidi' && (
          <div className="space-y-6">
            <div className="portal-dark-card bg-gradient-to-r from-purple-950 via-slate-900 to-indigo-950 !text-white text-white p-6 rounded-2xl shadow-lg border border-purple-500/30 space-y-3" style={{ background: 'linear-gradient(135deg, #3b0764 0%, #0f172a 50%, #1e1b4b 100%)' }}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-xs font-extrabold uppercase border border-purple-400/30 tracking-wide" style={{ color: '#d8b4fe' }}>
                  <Heart className="w-3.5 h-3.5 text-purple-300" /> Sakramen &amp; Pengakuan Iman
                </span>
                <span className="text-xs text-purple-200 bg-purple-950/70 px-3 py-1 rounded-lg border border-purple-500/30 font-bold" style={{ color: '#e9d5ff' }}>
                  {formattedMajelisJemaat || settings.namaJemaat || 'GKE JEMAAT'}
                </span>
              </div>
              <h2 className="banner-title text-xl md:text-2xl font-black font-serif !text-white text-white tracking-tight" style={{ color: '#ffffff', WebkitTextFillColor: '#ffffff' }}>
                Data Pernikahan Kudus, Baptisan Kudus &amp; Peneguhan Sidi
              </h2>
              <p className="text-xs sm:text-sm !text-slate-200 text-slate-200 max-w-3xl leading-relaxed" style={{ color: '#e2e8f0', WebkitTextFillColor: '#e2e8f0' }}>
                Catatan resmi pelayanan Sakramen Baptisan Kudus, Peneguhan Sidi, dan Pemberkatan Pernikahan Kudus di {formattedMajelisJemaat || settings.namaJemaat || 'GKE'}. Data ini ditampilkan khusus untuk warga jemaat.
              </p>

              {/* Summary Stats Header */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-purple-800/40">
                {(() => {
                  const totalSemua = pelayananSakramenList.length;
                  const totalBaptis = pelayananSakramenList.filter((s) => {
                    const j = (s.jenisPelayanan || '').toLowerCase();
                    return j === 'baptis' || j.includes('baptis');
                  }).length;
                  const totalSidi = pelayananSakramenList.filter((s) => {
                    const j = (s.jenisPelayanan || '').toLowerCase();
                    return j === 'sidi' || j.includes('sidi');
                  }).length;
                  const totalNikah = pelayananSakramenList.filter((s) => {
                    const j = (s.jenisPelayanan || '').toLowerCase();
                    return j === 'nikah' || j.includes('nikah') || j.includes('pernikahan');
                  }).length;

                  return (
                    <>
                      <div className="p-3 rounded-xl border border-purple-500/30 shadow-xs" style={{ backgroundColor: 'rgba(15, 23, 42, 0.75)' }}>
                        <p className="text-[10px] uppercase font-bold" style={{ color: '#94a3b8', WebkitTextFillColor: '#94a3b8' }}>Total Pelayanan</p>
                        <p className="text-lg font-black" style={{ color: '#ffffff', WebkitTextFillColor: '#ffffff' }}>{totalSemua} Terdaftar</p>
                      </div>
                      <div className="p-3 rounded-xl border border-purple-500/30 shadow-xs" style={{ backgroundColor: 'rgba(15, 23, 42, 0.75)' }}>
                        <p className="text-[10px] uppercase font-bold" style={{ color: '#94a3b8', WebkitTextFillColor: '#94a3b8' }}>Baptisan Kudus</p>
                        <p className="text-lg font-black" style={{ color: '#38bdf8', WebkitTextFillColor: '#38bdf8' }}>{totalBaptis} Jiwa</p>
                      </div>
                      <div className="p-3 rounded-xl border border-purple-500/30 shadow-xs" style={{ backgroundColor: 'rgba(15, 23, 42, 0.75)' }}>
                        <p className="text-[10px] uppercase font-bold" style={{ color: '#94a3b8', WebkitTextFillColor: '#94a3b8' }}>Peneguhan Sidi</p>
                        <p className="text-lg font-black" style={{ color: '#c084fc', WebkitTextFillColor: '#c084fc' }}>{totalSidi} Jiwa</p>
                      </div>
                      <div className="p-3 rounded-xl border border-purple-500/30 shadow-xs" style={{ backgroundColor: 'rgba(15, 23, 42, 0.75)' }}>
                        <p className="text-[10px] uppercase font-bold" style={{ color: '#94a3b8', WebkitTextFillColor: '#94a3b8' }}>Pernikahan Kudus</p>
                        <p className="text-lg font-black" style={{ color: '#fb7185', WebkitTextFillColor: '#fb7185' }}>{totalNikah} Pasang</p>
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>

            {/* Filter and Search Bar */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              {/* Search Bar */}
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cari nama, pasangan, no. akta, pendeta..."
                  value={sakramenSearch}
                  onChange={(e) => setSakramenSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 placeholder-slate-400 text-xs font-medium focus:outline-none focus:border-purple-500 focus:bg-white"
                />
              </div>

              {/* Filter Tabs */}
              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setSakramenFilter('semua')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                    sakramenFilter === 'semua'
                      ? 'bg-purple-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                  }`}
                >
                  Semua Pelayanan ({pelayananSakramenList.length})
                </button>
                <button
                  type="button"
                  onClick={() => setSakramenFilter('baptis')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                    sakramenFilter === 'baptis'
                      ? 'bg-sky-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                  }`}
                >
                  Baptisan Kudus
                </button>
                <button
                  type="button"
                  onClick={() => setSakramenFilter('sidi')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                    sakramenFilter === 'sidi'
                      ? 'bg-purple-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                  }`}
                >
                  Peneguhan Sidi
                </button>
                <button
                  type="button"
                  onClick={() => setSakramenFilter('nikah')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                    sakramenFilter === 'nikah'
                      ? 'bg-rose-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                  }`}
                >
                  Pernikahan Kudus
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="sakramen-table-card bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
                <table className="sakramen-table w-full text-xs text-left text-slate-800 dark:text-slate-100">
                  <thead className="bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-extrabold border-b border-slate-200 dark:border-slate-700 uppercase text-[10px]">
                    <tr>
                      <th className="p-3 text-center w-10">No</th>
                      <th className="p-3">Nama Anggota / Pasangan</th>
                      <th className="p-3 text-center">Jenis Sakramen</th>
                      <th className="p-3 font-mono">Tanggal &amp; Tempat</th>
                      <th className="p-3 font-mono">No. Surat / Akta</th>
                      <th className="p-3">Pelayan Pendeta</th>
                      <th className="p-3 text-center">Rincian</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {(() => {
                      const filtered = pelayananSakramenList.filter((sakr) => {
                        const j = (sakr.jenisPelayanan || '').toLowerCase();
                        let matchFilter = true;
                        if (sakramenFilter === 'baptis') {
                          matchFilter = j === 'baptis' || j.includes('baptis');
                        } else if (sakramenFilter === 'sidi') {
                          matchFilter = j === 'sidi' || j.includes('sidi');
                        } else if (sakramenFilter === 'nikah') {
                          matchFilter = j === 'nikah' || j.includes('nikah') || j.includes('pernikahan');
                        }

                        const q = sakramenSearch.toLowerCase().trim();
                        const namaUtama = (sakr.namaUtama || (sakr as any).namaLengkap || (sakr as any).nama || '').toLowerCase();
                        const namaPasangan = (sakr.namaPasangan || '').toLowerCase();
                        const noSurat = (sakr.noSuratResmi || (sakr as any).noSurat || (sakr as any).nomorSurat || '').toLowerCase();
                        const pendeta = (sakr.pelayanFirman || (sakr as any).pelayanPendeta || (sakr as any).pendeta || '').toLowerCase();
                        const tempat = (sakr.tempatPelayanan || '').toLowerCase();
                        const ayah = (sakr.namaAyah || '').toLowerCase();
                        const ibu = (sakr.namaIbu || '').toLowerCase();

                        const matchSearch =
                          !q ||
                          namaUtama.includes(q) ||
                          namaPasangan.includes(q) ||
                          noSurat.includes(q) ||
                          pendeta.includes(q) ||
                          tempat.includes(q) ||
                          ayah.includes(q) ||
                          ibu.includes(q);

                        return matchFilter && matchSearch;
                      });

                      if (filtered.length === 0) {
                        return (
                          <tr>
                            <td colSpan={7} className="p-8 text-center text-slate-400 italic">
                              <div className="space-y-2">
                                <Award className="w-8 h-8 text-slate-300 mx-auto" />
                                <p className="font-semibold text-slate-600 dark:text-slate-300">
                                  Tidak ada catatan pelayanan sakramen yang sesuai.
                                </p>
                                <p className="text-[11px] text-slate-400 dark:text-slate-500">
                                  Silakan sesuaikan pilihan filter atau kata kunci pencarian Anda.
                                </p>
                              </div>
                            </td>
                          </tr>
                        );
                      }

                      return filtered.map((sakr, idx) => {
                        const j = (sakr.jenisPelayanan || '').toLowerCase();
                        const isNikah = j === 'nikah' || j.includes('nikah') || j.includes('pernikahan');
                        const isBaptis = j === 'baptis' || j.includes('baptis');
                        const isSidi = j === 'sidi' || j.includes('sidi');

                        const namaUtamaDisplay = sakr.namaUtama || (sakr as any).namaLengkap || (sakr as any).nama || 'Warga Jemaat';
                        const noSuratDisplay = sakr.noSuratResmi || (sakr as any).noSurat || (sakr as any).nomorSurat || '-';
                        const pelayanDisplay = sakr.pelayanFirman || (sakr as any).pelayanPendeta || (sakr as any).pendeta || '-';
                        const tempatDisplay = sakr.tempatPelayanan || settings.namaJemaat || '-';

                        return (
                          <tr key={sakr.id} className="sakramen-row transition-colors">
                            {/* No */}
                            <td className="p-3 text-center font-mono text-slate-500 dark:text-slate-400 font-bold">{idx + 1}</td>

                            {/* Nama Anggota / Pasangan */}
                            <td className="p-3">
                              {isNikah ? (
                                <div className="space-y-0.5">
                                  <div className="font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                                    <span className="px-1.5 py-0.5 rounded text-[9px] bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300 font-bold uppercase border border-blue-200 dark:border-blue-800/60">
                                      Pria
                                    </span>
                                    <span>{namaUtamaDisplay}</span>
                                  </div>
                                  {sakr.namaPasangan && (
                                    <div className="font-extrabold text-rose-800 dark:text-rose-300 flex items-center gap-1.5">
                                      <span className="px-1.5 py-0.5 rounded text-[9px] bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 font-bold uppercase border border-rose-200 dark:border-rose-800/60">
                                        Wanita
                                      </span>
                                      <span>{sakr.namaPasangan}</span>
                                    </div>
                                  )}
                                </div>
                              ) : isBaptis ? (
                                <div className="space-y-0.5">
                                  <span className="font-extrabold text-slate-900 dark:text-white block">{namaUtamaDisplay}</span>
                                  {(sakr.namaAyah || sakr.namaIbu) && (
                                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-medium">
                                      Orang Tua: {[sakr.namaAyah, sakr.namaIbu].filter(Boolean).join(' & ')}
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <div className="space-y-0.5">
                                  <span className="font-extrabold text-slate-900 dark:text-white block">{namaUtamaDisplay}</span>
                                  {sakr.tempatTanggalLahir && (
                                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-medium">TTL: {sakr.tempatTanggalLahir}</span>
                                  )}
                                </div>
                              )}
                            </td>

                            {/* Jenis Sakramen Badge */}
                            <td className="p-3 text-center">
                              {isNikah ? (
                                <span className="badge-sakramen-nikah px-2.5 py-1 rounded-full text-[10px] font-extrabold border shadow-2xs whitespace-nowrap">
                                  <Heart className="w-3 h-3 shrink-0" />
                                  <span>Pernikahan Kudus</span>
                                </span>
                              ) : isBaptis ? (
                                <span className="badge-sakramen-baptis px-2.5 py-1 rounded-full text-[10px] font-extrabold border shadow-2xs whitespace-nowrap">
                                  <Award className="w-3 h-3 shrink-0" />
                                  <span>Baptisan Kudus</span>
                                </span>
                              ) : isSidi ? (
                                <span className="badge-sakramen-sidi px-2.5 py-1 rounded-full text-[10px] font-extrabold border shadow-2xs whitespace-nowrap">
                                  <Award className="w-3 h-3 shrink-0" />
                                  <span>Peneguhan Sidi</span>
                                </span>
                              ) : (
                                <span className="badge-sakramen-baptis px-2.5 py-1 rounded-full text-[10px] font-extrabold border shadow-2xs whitespace-nowrap capitalize">
                                  <Award className="w-3 h-3 shrink-0" />
                                  <span>{sakr.jenisPelayanan}</span>
                                </span>
                              )}
                            </td>

                            {/* Tanggal & Tempat */}
                            <td className="p-3 font-mono text-slate-800 dark:text-slate-200">
                              <span className="font-bold block text-slate-900 dark:text-white">{sakr.tanggalPelayanan || '-'}</span>
                              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-sans block truncate max-w-[180px]">
                                {tempatDisplay}
                              </span>
                            </td>

                            {/* No Surat / Akta */}
                            <td className="p-3 font-mono font-bold text-slate-900 dark:text-white">
                              <span className="chip-sakramen-surat px-2 py-0.5 rounded border inline-block font-mono text-[11px] font-bold">
                                {noSuratDisplay}
                              </span>
                            </td>

                            {/* Pelayan Pendeta */}
                            <td className="p-3 font-bold text-slate-800 dark:text-slate-200">
                              <div className="flex items-center gap-1.5">
                                <UserCheck className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 shrink-0" />
                                <span>{pelayanDisplay}</span>
                              </div>
                            </td>

                            {/* Tombol Lihat Rincian */}
                            <td className="p-3 text-center">
                              <button
                                type="button"
                                onClick={() => setSelectedSakramenModal(sakr)}
                                className="btn-sakramen-rincian px-2.5 py-1.5 rounded-lg font-extrabold text-[11px] inline-flex items-center gap-1 transition cursor-pointer"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>Rincian</span>
                              </button>
                            </td>
                          </tr>
                        );
                      });
                    })()}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Modal Rincian Resmi Pelayanan Sakramen */}
            {selectedSakramenModal && (
              <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in">
                <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
                  {/* Modal Header */}
                  <div className="modal-dark-header bg-gradient-to-r from-purple-950 to-slate-900 !text-white text-white p-5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-400/30 flex items-center justify-center text-purple-300 font-extrabold">
                        {selectedSakramenModal.jenisPelayanan === 'nikah' ? (
                          <Heart className="w-5 h-5 text-rose-300" />
                        ) : (
                          <Award className="w-5 h-5 text-purple-300" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded bg-purple-400/20 text-purple-300 text-[10px] font-mono font-bold uppercase border border-purple-400/30">
                            {selectedSakramenModal.jenisPelayanan === 'nikah'
                              ? 'Pernikahan Kudus'
                              : selectedSakramenModal.jenisPelayanan === 'baptis'
                              ? 'Baptisan Kudus'
                              : 'Peneguhan Sidi'}
                          </span>
                          <span className="text-xs !text-slate-200 text-slate-200 font-mono">
                            {selectedSakramenModal.noSuratResmi || (selectedSakramenModal as any).noSurat || '-'}
                          </span>
                        </div>
                        <h3 className="modal-title font-black text-lg !text-white text-white mt-0.5">
                          {selectedSakramenModal.namaUtama || (selectedSakramenModal as any).namaLengkap}
                          {selectedSakramenModal.namaPasangan ? ` & ${selectedSakramenModal.namaPasangan}` : ''}
                        </h3>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedSakramenModal(null)}
                      className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 hover:text-white transition cursor-pointer"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Modal Body */}
                  <div className="p-5 space-y-4 overflow-y-auto flex-1 text-xs">
                    {/* Ringkasan Status & Tanggal */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-purple-50/60 p-3.5 rounded-xl border border-purple-100">
                      <div>
                        <span className="text-[10px] font-bold text-slate-500 uppercase block">Tanggal Pelayanan</span>
                        <span className="font-black text-slate-900 text-sm">
                          {selectedSakramenModal.tanggalPelayanan || '-'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-500 uppercase block">Tempat Pelayanan</span>
                        <span className="font-bold text-slate-900 text-xs">
                          {selectedSakramenModal.tempatPelayanan || settings.namaJemaat || '-'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-500 uppercase block">Status Dokumen</span>
                        <span className="font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded text-[11px] inline-block mt-0.5">
                          {selectedSakramenModal.status || 'Disetujui & Diterbitkan'}
                        </span>
                      </div>
                    </div>

                    {/* Data Anggota / Mempelai */}
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                      <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5 border-b pb-2">
                        <User className="w-4 h-4 text-purple-600" />
                        <span>Data Anggota / Mempelai Terdaftar</span>
                      </h4>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold text-slate-400 uppercase">
                            {selectedSakramenModal.jenisPelayanan === 'nikah' ? 'Mempelai Pria' : 'Nama Lengkap'}
                          </span>
                          <p className="font-black text-slate-900 text-sm">
                            {selectedSakramenModal.namaUtama || (selectedSakramenModal as any).namaLengkap}
                          </p>
                          {selectedSakramenModal.tempatTanggalLahir && (
                            <p className="text-[11px] text-slate-600">TTL: {selectedSakramenModal.tempatTanggalLahir}</p>
                          )}
                          {selectedSakramenModal.alamatUtama && (
                            <p className="text-[11px] text-slate-600">Alamat: {selectedSakramenModal.alamatUtama}</p>
                          )}
                        </div>

                        {selectedSakramenModal.namaPasangan && (
                          <div className="space-y-1 sm:border-l sm:pl-4 border-slate-200">
                            <span className="text-[10px] font-bold text-slate-400 uppercase">Mempelai Wanita</span>
                            <p className="font-black text-rose-900 text-sm">{selectedSakramenModal.namaPasangan}</p>
                            {selectedSakramenModal.tempatTanggalLahirPasangan && (
                              <p className="text-[11px] text-slate-600">TTL: {selectedSakramenModal.tempatTanggalLahirPasangan}</p>
                            )}
                            {selectedSakramenModal.alamatPasangan && (
                              <p className="text-[11px] text-slate-600">Alamat: {selectedSakramenModal.alamatPasangan}</p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Data Orang Tua & Saksi jika ada */}
                    {(selectedSakramenModal.namaAyah ||
                      selectedSakramenModal.namaIbu ||
                      selectedSakramenModal.saksi1 ||
                      selectedSakramenModal.saksi2) && (
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                        <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5 border-b pb-2">
                          <Users className="w-4 h-4 text-purple-600" />
                          <span>Orang Tua &amp; Saksi-Saksi</span>
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {(selectedSakramenModal.namaAyah || selectedSakramenModal.namaIbu) && (
                            <div>
                              <span className="text-[10px] font-bold text-slate-400 uppercase block">Orang Tua:</span>
                              <p className="font-bold text-slate-800">
                                Ayah: {selectedSakramenModal.namaAyah || '-'}<br />
                                Ibu: {selectedSakramenModal.namaIbu || '-'}
                              </p>
                            </div>
                          )}
                          {(selectedSakramenModal.saksi1 || selectedSakramenModal.saksi2) && (
                            <div>
                              <span className="text-[10px] font-bold text-slate-400 uppercase block">Saksi-Saksi:</span>
                              <p className="font-bold text-slate-800">
                                Saksi 1: {selectedSakramenModal.saksi1 || '-'}<br />
                                Saksi 2: {selectedSakramenModal.saksi2 || '-'}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Pelayan Firman & Nats Firman */}
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Pelayan Firman (Pendeta):</span>
                      <p className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                        <UserCheck className="w-4 h-4 text-purple-600" />
                        <span>{selectedSakramenModal.pelayanFirman || (selectedSakramenModal as any).pelayanPendeta || '-'}</span>
                        {selectedSakramenModal.jabatanPelayan && (
                          <span className="text-xs text-slate-500 font-normal">({selectedSakramenModal.jabatanPelayan})</span>
                        )}
                      </p>
                      {selectedSakramenModal.nasKhotbah && (
                        <div className="mt-2 pt-2 border-t border-slate-200/60">
                          <span className="text-[10px] font-bold text-purple-900 uppercase block">
                            Nas Peringatan / Firman: {selectedSakramenModal.nasKhotbah}
                          </span>
                          {selectedSakramenModal.isiNasKhotbah && (
                            <p className="italic text-slate-600 text-[11px] mt-0.5">
                              "{selectedSakramenModal.isiNasKhotbah}"
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Modal Footer */}
                  <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
                    <button
                      type="button"
                      onClick={() => setSelectedSakramenModal(null)}
                      className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition cursor-pointer"
                    >
                      Tutup
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB: JADWAL KATEKISASI SIDI & PERNIKAHAN */}
        {activePortalTab === 'katekisasi' && (
          <div className="space-y-6">
            {/* Header Banner */}
            <div className="portal-dark-card bg-gradient-to-r from-indigo-950 via-slate-900 to-purple-950 !text-white text-white p-6 rounded-2xl shadow-lg border border-indigo-500/30 space-y-3" style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #0f172a 50%, #3b0764 100%)' }}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-extrabold uppercase border border-indigo-400/30 tracking-wide" style={{ color: '#a5b4fc' }}>
                  <GraduationCap className="w-3.5 h-3.5 text-indigo-300" /> Kelas Pembinaan Iman &amp; Sakramen GKE
                </span>
                <span className="text-xs text-indigo-200 bg-indigo-950/70 px-3 py-1 rounded-lg border border-indigo-500/30 font-bold" style={{ color: '#c7d2fe' }}>
                  {formattedMajelisJemaat || settings.namaJemaat || 'GKE JEMAAT'}
                </span>
              </div>

              <h2 className="banner-title text-xl md:text-2xl font-black font-serif !text-white text-white tracking-tight" style={{ color: '#ffffff' }}>
                Jadwal Kelas Katekisasi Sidi &amp; Pra-Pernikahan Kudus
              </h2>
              <p className="text-xs sm:text-sm !text-slate-200 text-slate-200 max-w-3xl leading-relaxed" style={{ color: '#e2e8f0' }}>
                Jadwal rutin pertemuan pembinaan katekisasi calon warga Sidi dan bimbingan persiapan Pernikahan Kudus di {formattedMajelisJemaat || settings.namaJemaat || 'GKE'}. Peserta dapat melihat jadwal, materi bahasan, lokasi kelas, dan pendeta pembina.
              </p>

              {/* Stats Summary */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-indigo-800/40">
                {(() => {
                  const totalSemua = jadwalKatekisasiList.length;
                  const totalSidi = jadwalKatekisasiList.filter((j) => (j.kategori || '').toLowerCase() === 'sidi').length;
                  const totalNikah = jadwalKatekisasiList.filter((j) => (j.kategori || '').toLowerCase() === 'pernikahan').length;
                  const totalAktif = jadwalKatekisasiList.filter((j) => j.status === 'Terjadwal' || j.status === 'Berlangsung').length;

                  return (
                    <>
                      <div className="p-3 rounded-xl border border-indigo-500/30 shadow-xs" style={{ backgroundColor: 'rgba(15, 23, 42, 0.75)' }}>
                        <p className="text-[10px] uppercase font-bold" style={{ color: '#94a3b8' }}>Total Program</p>
                        <p className="text-lg font-black" style={{ color: '#ffffff' }}>{totalSemua} Sesi</p>
                      </div>
                      <div className="p-3 rounded-xl border border-indigo-500/30 shadow-xs" style={{ backgroundColor: 'rgba(15, 23, 42, 0.75)' }}>
                        <p className="text-[10px] uppercase font-bold" style={{ color: '#94a3b8' }}>Katekisasi SIDI</p>
                        <p className="text-lg font-black" style={{ color: '#38bdf8' }}>{totalSidi} Kelas</p>
                      </div>
                      <div className="p-3 rounded-xl border border-indigo-500/30 shadow-xs" style={{ backgroundColor: 'rgba(15, 23, 42, 0.75)' }}>
                        <p className="text-[10px] uppercase font-bold" style={{ color: '#94a3b8' }}>Pra-Nikah Kudus</p>
                        <p className="text-lg font-black" style={{ color: '#fb7185' }}>{totalNikah} Kelas</p>
                      </div>
                      <div className="p-3 rounded-xl border border-indigo-500/30 shadow-xs" style={{ backgroundColor: 'rgba(15, 23, 42, 0.75)' }}>
                        <p className="text-[10px] uppercase font-bold" style={{ color: '#94a3b8' }}>Sesi Terjadwal</p>
                        <p className="text-lg font-black" style={{ color: '#34d399' }}>{totalAktif} Aktif</p>
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>

            {/* Filter and Search Bar */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              {/* Search Bar */}
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cari program, materi, pengajar, lokasi..."
                  value={katekisasiSearch}
                  onChange={(e) => setKatekisasiSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 placeholder-slate-400 text-xs font-medium focus:outline-none focus:border-indigo-500 focus:bg-white"
                />
              </div>

              {/* Filter Tabs */}
              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setKatekisasiFilter('semua')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                    katekisasiFilter === 'semua'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                  }`}
                >
                  Semua Kelas ({jadwalKatekisasiList.length})
                </button>
                <button
                  type="button"
                  onClick={() => setKatekisasiFilter('sidi')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer inline-flex items-center gap-1.5 ${
                    katekisasiFilter === 'sidi'
                      ? 'bg-sky-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                  }`}
                >
                  <GraduationCap className="w-3.5 h-3.5" />
                  <span>Katekisasi SIDI</span>
                </button>
                <button
                  type="button"
                  onClick={() => setKatekisasiFilter('pernikahan')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer inline-flex items-center gap-1.5 ${
                    katekisasiFilter === 'pernikahan'
                      ? 'bg-rose-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                  }`}
                >
                  <Heart className="w-3.5 h-3.5" />
                  <span>Pra-Nikah Kudus</span>
                </button>
              </div>
            </div>

            {/* Grid Sesi Katekisasi */}
            {(() => {
              const filteredList = jadwalKatekisasiList.filter((kat) => {
                const k = (kat.kategori || '').toLowerCase();
                let matchCat = true;
                if (katekisasiFilter === 'sidi') {
                  matchCat = k === 'sidi';
                } else if (katekisasiFilter === 'pernikahan') {
                  matchCat = k === 'pernikahan' || k === 'nikah';
                }

                const q = katekisasiSearch.toLowerCase().trim();
                const judul = (kat.judulProgram || (kat as any).judulKelas || '').toLowerCase();
                const materi = (kat.materiBahasan || '').toLowerCase();
                const pengajar = (kat.pengajar || (kat as any).pembina || '').toLowerCase();
                const tempat = (kat.tempat || (kat as any).lokasi || '').toLowerCase();
                const peserta = (kat.pesertaTarget || '').toLowerCase();

                const matchSearch =
                  !q ||
                  judul.includes(q) ||
                  materi.includes(q) ||
                  pengajar.includes(q) ||
                  tempat.includes(q) ||
                  peserta.includes(q);

                return matchCat && matchSearch;
              });

              if (filteredList.length === 0) {
                return (
                  <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center space-y-3">
                    <GraduationCap className="w-12 h-12 text-slate-300 mx-auto" />
                    <h3 className="font-extrabold text-slate-700 text-base">Tidak ada jadwal kelas katekisasi ditemukan</h3>
                    <p className="text-xs text-slate-500 max-w-md mx-auto">
                      Silakan sesuaikan kata kunci pencarian Anda atau pilih kategori lain untuk melihat jadwal kelas.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setKatekisasiFilter('semua');
                        setKatekisasiSearch('');
                      }}
                      className="px-4 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs transition cursor-pointer border border-indigo-200 inline-block"
                    >
                      Tampilkan Semua Kelas
                    </button>
                  </div>
                );
              }

              return (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {filteredList.map((kat) => {
                    const isSidi = (kat.kategori || '').toLowerCase() === 'sidi';
                    const judulDisplay = kat.judulProgram || (kat as any).judulKelas || (isSidi ? 'Kelas Katekisasi SIDI' : 'Bimbingan Pra-Nikah Kudus');
                    const pengajarDisplay = kat.pengajar || (kat as any).pembina || 'Pendeta Jemaat GKE';
                    const tempatDisplay = kat.tempat || (kat as any).lokasi || settings.namaJemaat || 'Gedung Gereja GKE';
                    const tanggalDisplay = kat.tanggal || (kat as any).jadwalRutin || '-';
                    const waktuDisplay = kat.waktu || (kat as any).jam || 'Sesuai Jadwal';

                    return (
                      <div
                        key={kat.id}
                        className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4 hover:border-indigo-300 hover:shadow-md transition-all flex flex-col justify-between"
                      >
                        <div className="space-y-3">
                          {/* Card Header: Category & Status */}
                          <div className="flex items-center justify-between border-b border-slate-100 pb-3 gap-2">
                            <span
                              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-extrabold text-[11px] uppercase border ${
                                isSidi
                                  ? 'bg-sky-100 text-sky-900 border-sky-200'
                                  : 'bg-rose-100 text-rose-900 border-rose-200'
                              }`}
                            >
                              {isSidi ? <GraduationCap className="w-3.5 h-3.5 text-sky-600" /> : <Heart className="w-3.5 h-3.5 text-rose-600" />}
                              <span>{isSidi ? 'Katekisasi SIDI' : 'Pra-Nikah Kudus'}</span>
                            </span>

                            <span
                              className={`text-xs font-mono font-bold px-2.5 py-0.5 rounded-md border ${
                                kat.status === 'Berlangsung'
                                  ? 'bg-amber-50 text-amber-800 border-amber-200'
                                  : kat.status === 'Selesai'
                                  ? 'bg-slate-100 text-slate-700 border-slate-200'
                                  : kat.status === 'Ditunda'
                                  ? 'bg-rose-50 text-rose-800 border-rose-200'
                                  : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              }`}
                            >
                              Status: {kat.status || 'Terjadwal'}
                            </span>
                          </div>

                          {/* Title & Sesi */}
                          <div className="space-y-1">
                            <h4 className="text-base font-extrabold text-slate-900 font-serif leading-snug">
                              {judulDisplay}
                            </h4>
                            {kat.jumlahPertemuan && (
                              <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100 inline-block">
                                {kat.jumlahPertemuan}
                              </span>
                            )}
                          </div>

                          {/* Materi Bahasan */}
                          {kat.materiBahasan && (
                            <div className="bg-indigo-50/50 p-3 rounded-xl border border-indigo-100 text-xs space-y-1">
                              <span className="text-[10px] font-bold text-indigo-900 uppercase tracking-wider block">
                                Materi Pembahasan:
                              </span>
                              <p className="text-slate-800 font-medium leading-relaxed">
                                {kat.materiBahasan}
                              </p>
                            </div>
                          )}

                          {/* Info Grid */}
                          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2.5 text-xs text-slate-700">
                            {/* Pengajar */}
                            <div className="flex items-center gap-2">
                              <UserCheck className="w-4 h-4 text-indigo-600 shrink-0" />
                              <div className="flex-1">
                                <span className="text-slate-500">Pengajar / Pembina: </span>
                                <strong className="text-slate-900 font-bold">{pengajarDisplay}</strong>
                              </div>
                            </div>

                            {/* Jadwal Tanggal & Waktu */}
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-emerald-600 shrink-0" />
                              <div className="flex-1 flex flex-wrap items-center gap-x-2">
                                <span className="font-bold text-slate-900">{tanggalDisplay}</span>
                                <span className="text-slate-500 flex items-center gap-1 font-mono text-[11px]">
                                  <Clock className="w-3 h-3 text-slate-400" />
                                  {waktuDisplay}
                                </span>
                              </div>
                            </div>

                            {/* Lokasi */}
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4 text-rose-600 shrink-0" />
                              <div className="flex-1">
                                <span className="text-slate-500">Lokasi: </span>
                                <span className="font-medium text-slate-900">{tempatDisplay}</span>
                              </div>
                            </div>

                            {/* Target Peserta jika ada */}
                            {kat.pesertaTarget && (
                              <div className="flex items-center gap-2 pt-1 border-t border-slate-200/60">
                                <Users className="w-4 h-4 text-amber-600 shrink-0" />
                                <div className="flex-1 text-[11px]">
                                  <span className="text-slate-500">Target Peserta: </span>
                                  <span className="font-medium text-slate-800">{kat.pesertaTarget}</span>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Keterangan / Persyaratan */}
                          {(kat.persyaratan || kat.keterangan) && (
                            <div className="bg-amber-50/60 p-2.5 rounded-xl border border-amber-200 text-xs text-amber-950 space-y-1">
                              {kat.persyaratan && (
                                <p className="font-medium text-[11px] flex items-center gap-1.5">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                                  <span><strong>Persyaratan:</strong> {kat.persyaratan}</span>
                                </p>
                              )}
                              {kat.keterangan && (
                                <p className="italic text-[11px] text-amber-800">
                                  "{kat.keterangan}"
                                </p>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Card Action */}
                        <div className="pt-2">
                          <button
                            type="button"
                            onClick={() => setSelectedKatekisasiModal(kat)}
                            className="w-full py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-900 font-extrabold text-xs transition cursor-pointer border border-indigo-200 flex items-center justify-center gap-1.5"
                          >
                            <Eye className="w-3.5 h-3.5 text-indigo-600" />
                            <span>Lihat Rincian Lengkap Kelas</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}

            {/* Modal Rincian Kelas Katekisasi */}
            {selectedKatekisasiModal && (
              <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in">
                <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
                  {/* Modal Header */}
                  <div className="modal-dark-header bg-gradient-to-r from-indigo-950 to-slate-900 !text-white text-white p-5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300 font-extrabold">
                        {selectedKatekisasiModal.kategori === 'pernikahan' ? (
                          <Heart className="w-5 h-5 text-rose-300" />
                        ) : (
                          <GraduationCap className="w-5 h-5 text-indigo-300" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded bg-indigo-400/20 text-indigo-300 text-[10px] font-mono font-bold uppercase border border-indigo-400/30">
                            {selectedKatekisasiModal.kategori === 'pernikahan' ? 'Pra-Nikah Kudus' : 'Katekisasi SIDI'}
                          </span>
                          <span className="text-xs text-emerald-300 font-mono font-bold">
                            Status: {selectedKatekisasiModal.status || 'Terjadwal'}
                          </span>
                        </div>
                        <h3 className="modal-title font-black text-lg !text-white text-white mt-0.5">
                          {selectedKatekisasiModal.judulProgram || (selectedKatekisasiModal as any).judulKelas}
                        </h3>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedKatekisasiModal(null)}
                      className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 hover:text-white transition cursor-pointer"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Modal Body */}
                  <div className="p-5 space-y-4 overflow-y-auto flex-1 text-xs">
                    {/* Ringkasan Jadwal */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-indigo-50/60 p-3.5 rounded-xl border border-indigo-100">
                      <div>
                        <span className="text-[10px] font-bold text-slate-500 uppercase block">Tanggal Pertemuan</span>
                        <span className="font-black text-slate-900 text-sm">
                          {selectedKatekisasiModal.tanggal || '-'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-500 uppercase block">Waktu / Jam</span>
                        <span className="font-bold text-slate-900 text-xs">
                          {selectedKatekisasiModal.waktu || '-'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-500 uppercase block">Sesi Pertemuan</span>
                        <span className="font-bold text-indigo-800 bg-indigo-100 px-2 py-0.5 rounded text-[11px] inline-block mt-0.5">
                          {selectedKatekisasiModal.jumlahPertemuan || 'Sesi Terjadwal'}
                        </span>
                      </div>
                    </div>

                    {/* Materi Bahasan */}
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                      <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5 border-b pb-2">
                        <BookOpen className="w-4 h-4 text-indigo-600" />
                        <span>Materi Bahasan &amp; Kurikulum Sesi</span>
                      </h4>
                      <p className="text-slate-800 font-medium text-xs leading-relaxed">
                        {selectedKatekisasiModal.materiBahasan || 'Pendalaman ajaran firman Allah, doktrin gereja, sakramen, dan etika hidup kristiani.'}
                      </p>
                    </div>

                    {/* Pengajar & Lokasi */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1.5">
                        <span className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                          <UserCheck className="w-3.5 h-3.5 text-indigo-600" /> Pengajar / Pembina
                        </span>
                        <p className="font-black text-slate-900 text-sm">
                          {selectedKatekisasiModal.pengajar || '-'}
                        </p>
                        <p className="text-[11px] text-slate-500">Pendeta / Pelayan Firman Jemaat GKE</p>
                      </div>

                      <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1.5">
                        <span className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-rose-600" /> Lokasi Pertemuan
                        </span>
                        <p className="font-black text-slate-900 text-sm">
                          {selectedKatekisasiModal.tempat || settings.namaJemaat}
                        </p>
                        <p className="text-[11px] text-slate-500">{settings.alamatGereja || 'Gedung Gereja GKE'}</p>
                      </div>
                    </div>

                    {/* Peserta & Persyaratan */}
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                      <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5 border-b pb-2">
                        <Users className="w-4 h-4 text-indigo-600" />
                        <span>Peserta Target &amp; Persyaratan Kelas</span>
                      </h4>

                      <div className="space-y-2">
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase block">Peserta Sasaran:</span>
                          <p className="font-bold text-slate-800 text-xs">
                            {selectedKatekisasiModal.pesertaTarget || 'Calon Warga Sidi / Calon Pengantin Terdaftar'}
                          </p>
                        </div>

                        {selectedKatekisasiModal.persyaratan && (
                          <div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase block">Persyaratan Kehadiran:</span>
                            <p className="font-medium text-slate-700 text-xs bg-white p-2.5 rounded-lg border border-slate-200">
                              {selectedKatekisasiModal.persyaratan}
                            </p>
                          </div>
                        )}

                        {selectedKatekisasiModal.keterangan && (
                          <div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase block">Catatan Tambahan:</span>
                            <p className="italic text-slate-600 text-xs bg-amber-50/50 p-2.5 rounded-lg border border-amber-200">
                              "{selectedKatekisasiModal.keterangan}"
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Modal Footer */}
                  <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
                    <button
                      type="button"
                      onClick={() => setSelectedKatekisasiModal(null)}
                      className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition cursor-pointer"
                    >
                      Tutup
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB: SEKSI PELAYANAN KATEGORIAL GKE */}
        {activePortalTab === 'kategorial' && (
          <div className="space-y-6">
            {/* Header Banner */}
            <div className="portal-dark-card bg-gradient-to-r from-cyan-950 via-slate-900 to-blue-950 !text-white text-white p-6 rounded-2xl shadow-lg border border-cyan-500/30 space-y-3" style={{ background: 'linear-gradient(135deg, #083344 0%, #0f172a 50%, #172554 100%)' }}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-20/20 text-cyan-300 text-xs font-extrabold uppercase border border-cyan-400/30 tracking-wide" style={{ color: '#ffffff' }}>
                  <Users2 className="w-3.5 h-3.5 text-cyan-300" /> Wadah Pelayanan Kategorial Jemaat
                </span>
                
              </div>

              <h2 className="banner-title text-xl md:text-2xl font-black font-serif !text-white text-white tracking-tight" style={{ color: '#ffffff' }}>
                Seksi Pelayanan Kategorial (SPB, SPPer, SPPR/P, ASHM) GKE {formattedMajelisJemaat || settings.namaJemaat || 'GKE JEMAAT'}
              </h2>
              <p className="text-xs sm:text-sm !text-slate-200 text-slate-200 max-w-3xl leading-relaxed" style={{ color: '#e2e8f0' }}>
                Struktur kepengurusan dan agenda program pelayanan kategorial di {formattedMajelisJemaat || settings.namaJemaat || 'GKE'}: Seksi Pelayanan Bapak (SPB), Seksi Pelayanan Perempuan (SPPer), Seksi Pelayanan Pemuda/Remaja (SPPR/P), serta Anak Sekolah Minggu (ASHM / SPA).
              </p>

              {/* Stats Summary */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-cyan-800/40">
                {(() => {
                  const isMatchSeksi = (itemSeksi: string, curSeksi: string) => {
                    if (curSeksi === 'ASHM' || curSeksi === 'SPA') {
                      return itemSeksi === 'ASHM' || itemSeksi === 'SPA';
                    }
                    return itemSeksi === curSeksi;
                  };

                  const totalPengurus = pengurusKategorialList.length;
                  const pengurusCurSeksi = pengurusKategorialList.filter((p) => isMatchSeksi(p.seksi, activeKategorialSeksi)).length;
                  const totalAgenda = kegiatanKategorialList.length;
                  const agendaCurSeksi = kegiatanKategorialList.filter((k) => isMatchSeksi(k.seksi, activeKategorialSeksi)).length;

                  return (
                    <>
                      <div className="p-3 rounded-xl border border-cyan-500/30 shadow-xs" style={{ backgroundColor: 'rgba(15, 23, 42, 0.75)' }}>
                        <p className="text-[10px] uppercase font-bold" style={{ color: '#94a3b8' }}>Pengurus {activeKategorialSeksi}</p>
                        <p className="text-lg font-black" style={{ color: '#22d3ee' }}>{pengurusCurSeksi} Personil</p>
                      </div>
                      <div className="p-3 rounded-xl border border-cyan-500/30 shadow-xs" style={{ backgroundColor: 'rgba(15, 23, 42, 0.75)' }}>
                        <p className="text-[10px] uppercase font-bold" style={{ color: '#94a3b8' }}>Agenda {activeKategorialSeksi}</p>
                        <p className="text-lg font-black" style={{ color: '#34d399' }}>{agendaCurSeksi} Kegiatan</p>
                      </div>
                      <div className="p-3 rounded-xl border border-cyan-500/30 shadow-xs" style={{ backgroundColor: 'rgba(15, 23, 42, 0.75)' }}>
                        <p className="text-[10px] uppercase font-bold" style={{ color: '#94a3b8' }}>Total Semua Pengurus</p>
                        <p className="text-lg font-black" style={{ color: '#ffffff' }}>{totalPengurus} Orang</p>
                      </div>
                      <div className="p-3 rounded-xl border border-cyan-500/30 shadow-xs" style={{ backgroundColor: 'rgba(15, 23, 42, 0.75)' }}>
                        <p className="text-[10px] uppercase font-bold" style={{ color: '#94a3b8' }}>Total Semua Agenda</p>
                        <p className="text-lg font-black" style={{ color: '#fbbf24' }}>{totalAgenda} Program</p>
                      </div>
                    </>
                  );
                })()}
              </div>

              {/* Action Bar / Tombol Cetak Dokumen Seksi Kategorial */}
              <div className="pt-3 border-t border-cyan-800/40 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs text-cyan-200 font-bold">
                  <Printer className="w-4 h-4 text-cyan-400" />
                  <span>Cetak Dokumen Resmi Kategorial:</span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      openPrintReport({
                        reportType: 'seksi_kategorial',
                        selectedSeksi: activeKategorialSeksi === 'ASHM' ? 'SPA' : activeKategorialSeksi,
                        customTitle: `LAPORAN RESMI SEKSI PELAYANAN ${activeKategorialSeksi} GKE`,
                      })
                    }
                    className="px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-black text-xs transition-all shadow-sm flex items-center gap-1.5 cursor-pointer border border-cyan-400/40"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Cetak Laporan {activeKategorialSeksi}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      openPrintReport({
                        reportType: 'seksi_kategorial',
                        selectedSeksi: 'ALL',
                        customTitle: 'LAPORAN KESELURUHAN SEKSI PELAYANAN KATEGORIAL GKE',
                      })
                    }
                    className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-200 font-bold text-xs transition-all border border-slate-600 flex items-center gap-1.5 cursor-pointer"
                  >
                    <Users2 className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Cetak Semua Seksi (SPB, SPPer, SPPR/P, ASHM)</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Filter Seksi & Search Bar */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              {/* Search Bar */}
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cari pengurus, program, penanggung jawab, tempat..."
                  value={kategorialSearch}
                  onChange={(e) => setKategorialSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 placeholder-slate-400 text-xs font-medium focus:outline-none focus:border-cyan-500 focus:bg-white"
                />
              </div>

              {/* Seksi Sub Tabs */}
              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                {(['SPB', 'SPPer', 'SPPR/P', 'ASHM'] as const).map((seksi) => {
                  const isMatchSeksi = (itemSeksi: string) => {
                    if (seksi === 'ASHM') return itemSeksi === 'ASHM' || itemSeksi === 'SPA';
                    return itemSeksi === seksi;
                  };
                  const countPengurus = pengurusKategorialList.filter((p) => isMatchSeksi(p.seksi)).length;
                  const countKegiatan = kegiatanKategorialList.filter((k) => isMatchSeksi(k.seksi)).length;

                  return (
                    <button
                      key={seksi}
                      type="button"
                      onClick={() => setActiveKategorialSeksi(seksi)}
                      className={`tab-seksi-kategorial-btn px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${
                        activeKategorialSeksi === seksi
                          ? 'active bg-cyan-600 text-white shadow-md border border-cyan-400/40'
                          : 'inactive bg-slate-800 text-slate-200 hover:bg-slate-700/80 border border-slate-700'
                      }`}
                    >
                      <span>
                        {seksi === 'SPB' && 'SPB (Bapak)'}
                        {seksi === 'SPPer' && 'SPPer (Perempuan)'}
                        {seksi === 'SPPR/P' && 'SPPR/P (Pemuda/Remaja)'}
                        {seksi === 'ASHM' && 'ASHM (Sekolah Minggu)'}
                      </span>
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono font-bold leading-none badge-seksi-counter ${
                          activeKategorialSeksi === seksi
                            ? 'bg-white/20 text-white'
                            : 'bg-slate-700 text-slate-200 border border-slate-600'
                        }`}
                      >
                        {countPengurus + countKegiatan}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Content Display: 2 Columns */}
            {(() => {
              const isMatchSeksi = (itemSeksi: string) => {
                if (activeKategorialSeksi === 'ASHM') {
                  return itemSeksi === 'ASHM' || itemSeksi === 'SPA';
                }
                return itemSeksi === activeKategorialSeksi;
              };

              const q = kategorialSearch.toLowerCase().trim();

              const currentPengurus = pengurusKategorialList.filter((p) => {
                const matchSeksi = isMatchSeksi(p.seksi);
                const nama = (p.nama || (p as any).namaLengkap || '').toLowerCase();
                const jabatan = (p.jabatan || '').toLowerCase();
                const hp = (p.noHp || '').toLowerCase();
                const matchSearch = !q || nama.includes(q) || jabatan.includes(q) || hp.includes(q);
                return matchSeksi && matchSearch;
              });

              const currentKegiatan = kegiatanKategorialList.filter((k) => {
                const matchSeksi = isMatchSeksi(k.seksi);
                const program = (k.namaProgram || (k as any).namaKegiatan || '').toLowerCase();
                const kategori = (k.kategori || '').toLowerCase();
                const pj = (k.penanggungJawab || '').toLowerCase();
                const tempat = (k.tempat || (k as any).lokasi || '').toLowerCase();
                const ket = (k.keterangan || '').toLowerCase();
                const matchSearch =
                  !q ||
                  program.includes(q) ||
                  kategori.includes(q) ||
                  pj.includes(q) ||
                  tempat.includes(q) ||
                  ket.includes(q);
                return matchSeksi && matchSearch;
              });

              const seksiFullTitle =
                activeKategorialSeksi === 'SPB'
                  ? 'Seksi Pelayanan Bapak (SPB)'
                  : activeKategorialSeksi === 'SPPer'
                  ? 'Seksi Pelayanan Perempuan (SPPer)'
                  : activeKategorialSeksi === 'SPPR/P'
                  ? 'Seksi Pelayanan Pemuda & Remaja (SPPR/P)'
                  : 'Seksi Pelayanan Anak & Sekolah Minggu (ASHM / SPA)';

              return (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Left Column: Pengurus Seksi (5 Cols) */}
                  <div className="lg:col-span-5 bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-sm space-y-4 flex flex-col justify-between">
                    <div className="space-y-4">
                      <div className="flex flex-wrap items-center justify-between border-b border-slate-100 pb-3 gap-2">
                        <h3 className="font-black text-slate-900 text-sm uppercase tracking-wide flex items-center gap-2">
                          <ShieldCheck className="w-5 h-5 text-cyan-600 shrink-0" />
                          <span>Pengurus {activeKategorialSeksi}</span>
                        </h3>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-md bg-cyan-950/70 text-cyan-300 border border-cyan-700/50">
                            {currentPengurus.length} Personil
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              openPrintReport({
                                reportType: 'seksi_kategorial',
                                selectedSeksi: activeKategorialSeksi === 'ASHM' ? 'SPA' : activeKategorialSeksi,
                                customTitle: `SUSUNAN PENGURUS SEKSI PELAYANAN ${activeKategorialSeksi} GKE`,
                              })
                            }
                            className="px-2.5 py-1 rounded-lg bg-cyan-900/60 hover:bg-cyan-800 text-cyan-200 font-bold text-[11px] transition-all flex items-center gap-1 border border-cyan-500/40 cursor-pointer shadow-2xs"
                            title={`Cetak Susunan Pengurus ${activeKategorialSeksi}`}
                          >
                            <Printer className="w-3 h-3 text-cyan-300" />
                            <span>Cetak</span>
                          </button>
                        </div>
                      </div>

                      <p className="text-xs text-slate-500 leading-relaxed">
                        Susunan pengurus resmi {seksiFullTitle} periode berjalan di {settings.namaJemaat}.
                      </p>

                      {currentPengurus.length === 0 ? (
                        <div className="p-8 text-center bg-slate-900/60 rounded-xl border border-slate-700/80 space-y-2">
                          <Users2 className="w-8 h-8 text-slate-500 mx-auto" />
                          <p className="text-xs font-bold text-slate-200">Belum ada data pengurus {activeKategorialSeksi}</p>
                          <p className="text-[11px] text-slate-400">Data pengurus akan ditampilkan setelah di-input oleh sekretariat jemaat.</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {currentPengurus.map((pengurus) => {
                            const namaLengkap = `${pengurus.nama || (pengurus as any).namaLengkap || 'Nama Pengurus'}${
                              pengurus.gelar ? `, ${pengurus.gelar}` : ''
                            }`;

                            return (
                              <div
                                key={pengurus.id}
                                className="p-3.5 bg-slate-900/60 hover:bg-slate-800/80 rounded-xl border border-slate-700/80 hover:border-cyan-500/40 transition-all space-y-2 text-xs"
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div className="space-y-0.5">
                                    <p className="font-black text-white text-sm leading-snug">
                                      {namaLengkap}
                                    </p>
                                    <span className="inline-block px-2.5 py-0.5 rounded bg-cyan-950/80 text-cyan-300 font-extrabold text-[10px] uppercase border border-cyan-700/60">
                                      {pengurus.jabatan}
                                    </span>
                                  </div>
                                  <span
                                    className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded shrink-0 ${
                                      pengurus.status === 'Aktif'
                                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                        : 'bg-slate-700/60 text-slate-300 border border-slate-600'
                                    }`}
                                  >
                                    {pengurus.status || 'Aktif'}
                                  </span>
                                </div>

                                {/* Kontak & Info */}
                                <div className="pt-2 border-t border-slate-700/60 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-300">
                                  {pengurus.noHp ? (
                                    <a
                                      href={`https://wa.me/${pengurus.noHp.replace(/[^0-9]/g, '')}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1 text-emerald-400 font-bold hover:underline bg-emerald-950/40 px-2 py-1 rounded border border-emerald-500/30"
                                    >
                                      <Phone className="w-3 h-3" />
                                      <span>{pengurus.noHp}</span>
                                    </a>
                                  ) : (
                                    <span className="text-slate-500 italic">No HP tidak tersedia</span>
                                  )}

                                  {pengurus.periode && (
                                    <span className="text-slate-400 font-medium">
                                      Periode: <strong className="text-slate-200">{pengurus.periode}</strong>
                                    </span>
                                  )}
                                </div>

                                {pengurus.alamat && (
                                  <p className="text-[10px] text-slate-400 flex items-center gap-1">
                                    <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
                                    <span>{pengurus.alamat}</span>
                                  </p>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Agenda & Ibadah Kategorial (7 Cols) */}
                  <div className="lg:col-span-7 bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-sm space-y-4 flex flex-col justify-between">
                    <div className="space-y-4">
                      <div className="flex flex-wrap items-center justify-between border-b border-slate-100 pb-3 gap-2">
                        <h3 className="font-black text-slate-900 text-sm uppercase tracking-wide flex items-center gap-2">
                          <Calendar className="w-5 h-5 text-cyan-600 shrink-0" />
                          <span>Agenda &amp; Ibadah Kategorial {activeKategorialSeksi}</span>
                        </h3>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-md bg-emerald-950/70 text-emerald-300 border border-emerald-700/50">
                            {currentKegiatan.length} Agenda
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              openPrintReport({
                                reportType: 'seksi_kategorial',
                                selectedSeksi: activeKategorialSeksi === 'ASHM' ? 'SPA' : activeKategorialSeksi,
                                customTitle: `AGENDA & PROGRAM KERJA SEKSI PELAYANAN ${activeKategorialSeksi} GKE`,
                              })
                            }
                            className="px-2.5 py-1 rounded-lg bg-emerald-900/60 hover:bg-emerald-800 text-emerald-200 font-bold text-[11px] transition-all flex items-center gap-1 border border-emerald-500/40 cursor-pointer shadow-2xs"
                            title={`Cetak Agenda & Kegiatan ${activeKategorialSeksi}`}
                          >
                            <Printer className="w-3 h-3 text-emerald-300" />
                            <span>Cetak</span>
                          </button>
                        </div>
                      </div>

                      <p className="text-xs text-slate-500 leading-relaxed">
                        Jadwal kebaktian padang, seminar, latihan vocal group, dan kegiatan persekutuan {seksiFullTitle}.
                      </p>

                      {currentKegiatan.length === 0 ? (
                        <div className="p-8 text-center bg-slate-900/60 rounded-xl border border-slate-700/80 space-y-2">
                          <Calendar className="w-8 h-8 text-slate-500 mx-auto" />
                          <p className="text-xs font-bold text-slate-200">Belum ada agenda kegiatan untuk {activeKategorialSeksi}</p>
                          <p className="text-[11px] text-slate-400">Jadwal ibadah dan kegiatan kategorial akan diperbarui secara berkala.</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {currentKegiatan.map((keg) => {
                            const programTitle = keg.namaProgram || (keg as any).namaKegiatan || 'Agenda Seksi';
                            const tanggalDisplay = keg.tanggal || (keg as any).tanggalJadwal || '-';
                            const waktuDisplay = keg.waktu || 'Sesuai Jadwal';
                            const tempatDisplay = keg.tempat || (keg as any).lokasi || settings.namaJemaat;

                            return (
                              <div
                                key={keg.id}
                                className="p-4 bg-slate-900/70 hover:bg-slate-800/80 rounded-xl border border-slate-700/80 hover:border-cyan-500/40 transition-all space-y-3 text-xs"
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div className="space-y-1">
                                    <span className="inline-block text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-700/60">
                                      {keg.kategori || 'Ibadah / Kebaktian Seksi'}
                                    </span>
                                    <h4 className="font-black text-white text-sm leading-snug">
                                      {programTitle}
                                    </h4>
                                  </div>

                                  <span
                                    className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded shrink-0 ${
                                      keg.status === 'Berlangsung'
                                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                        : keg.status === 'Selesai'
                                        ? 'bg-slate-700/60 text-slate-300 border border-slate-600'
                                        : keg.status === 'Batal'
                                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                    }`}
                                  >
                                    Status: {keg.status || 'Rencana'}
                                  </span>
                                </div>

                                {/* Jadwal & Lokasi */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-slate-800/80 p-3 rounded-lg border border-slate-700 text-[11px]">
                                  <div className="flex items-center gap-1.5 text-slate-200">
                                    <Calendar className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                                    <span><strong className="text-white">{tanggalDisplay}</strong> ({waktuDisplay})</span>
                                  </div>
                                  <div className="flex items-center gap-1.5 text-slate-200">
                                    <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                                    <span className="truncate"><strong className="text-white">Tempat:</strong> {tempatDisplay}</span>
                                  </div>
                                </div>

                                {/* Deskripsi / Keterangan */}
                                {keg.keterangan && (
                                  <p className="text-amber-100/90 text-xs italic bg-amber-950/40 p-2.5 rounded-lg border border-amber-500/40 leading-relaxed">
                                    "{keg.keterangan}"
                                  </p>
                                )}

                                {/* Penanggung Jawab & Anggaran */}
                                <div className="pt-2 border-t border-slate-700/60 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                                  <div className="text-slate-300 flex items-center gap-1">
                                    <UserCheck className="w-3 h-3 text-cyan-400" />
                                    <span>PJ: <strong className="text-white">{keg.penanggungJawab || 'Pengurus Seksi'}</strong></span>
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() => setSelectedKegiatanModal(keg)}
                                    className="px-3 py-1 rounded-lg bg-cyan-950 hover:bg-cyan-900 text-cyan-300 font-bold text-[11px] transition cursor-pointer border border-cyan-700/60 flex items-center gap-1"
                                  >
                                    <Eye className="w-3 h-3" />
                                    <span>Lihat Rincian</span>
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Modal Detail Kegiatan Kategorial */}
            {selectedKegiatanModal && (
              <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in">
                <div className="bg-slate-900 w-full max-w-xl rounded-2xl shadow-2xl border border-slate-700 overflow-hidden flex flex-col max-h-[90vh]">
                  <div className="modal-dark-header bg-gradient-to-r from-cyan-950 via-slate-900 to-slate-900 !text-white text-white p-5 flex items-center justify-between border-b border-cyan-900/50">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300 font-extrabold">
                        <Users2 className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="px-2 py-0.5 rounded bg-cyan-400/20 text-cyan-300 text-[10px] font-mono font-bold uppercase border border-cyan-400/30">
                          {selectedKegiatanModal.seksi} • {selectedKegiatanModal.kategori || 'Kegiatan Kategorial'}
                        </span>
                        <h3 className="modal-title font-black text-base sm:text-lg !text-white text-white mt-0.5">
                          {selectedKegiatanModal.namaProgram || (selectedKegiatanModal as any).namaKegiatan}
                        </h3>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedKegiatanModal(null)}
                      className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 hover:text-white transition cursor-pointer"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="p-5 space-y-4 overflow-y-auto flex-1 text-xs modal-kategorial-detail-body">
                    {/* Jadwal Tanggal & Status */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-950/80 p-4 rounded-xl border border-cyan-500/40 shadow-inner box-jadwal-kategorial">
                      <div>
                        <span className="text-[10px] font-extrabold text-cyan-400 uppercase tracking-wider block mb-1">
                          Jadwal Tanggal &amp; Waktu
                        </span>
                        <p className="font-black text-white text-base tracking-tight font-mono">
                          {selectedKegiatanModal.tanggal || '-'}
                        </p>
                        <p className="text-slate-300 text-xs font-mono font-medium mt-0.5">
                          {selectedKegiatanModal.waktu || 'Sesuai Jadwal'}
                        </p>
                      </div>
                      <div>
                        <span className="text-[10px] font-extrabold text-cyan-400 uppercase tracking-wider block mb-1">
                          Status Pelaksanaan
                        </span>
                        <span className={`font-bold px-3 py-1 rounded-lg text-xs inline-flex items-center gap-1.5 mt-0.5 shadow-2xs ${
                          selectedKegiatanModal.status === 'Berlangsung'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                            : selectedKegiatanModal.status === 'Selesai'
                            ? 'bg-slate-700/60 text-slate-200 border border-slate-600'
                            : selectedKegiatanModal.status === 'Batal'
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                            : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        }`}>
                          <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                          <span>{selectedKegiatanModal.status || 'Rencana'}</span>
                        </span>
                      </div>
                    </div>

                    <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700 space-y-1.5 box-lokasi-kategorial">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-rose-500" /> Lokasi / Tempat Pelaksanaan
                      </span>
                      <p className="font-bold text-white text-sm">
                        {selectedKegiatanModal.tempat || (selectedKegiatanModal as any).lokasi || settings.namaJemaat}
                      </p>
                    </div>

                    <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700 space-y-1.5 box-pj-kategorial">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                        <UserCheck className="w-3.5 h-3.5 text-cyan-400" /> Penanggung Jawab Kegiatan
                      </span>
                      <p className="font-bold text-white text-sm">
                        {selectedKegiatanModal.penanggungJawab || 'Pengurus Seksi ' + selectedKegiatanModal.seksi}
                      </p>
                    </div>

                    {selectedKegiatanModal.keterangan && (
                      <div className="bg-amber-950/40 p-3.5 rounded-xl border border-amber-500/40 space-y-1 box-keterangan-kategorial">
                        <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">
                          Keterangan &amp; Petunjuk Khusus
                        </span>
                        <p className="italic text-amber-100/90 leading-relaxed text-xs">
                          "{selectedKegiatanModal.keterangan}"
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const targetSeksi = selectedKegiatanModal.seksi === 'ASHM' ? 'SPA' : selectedKegiatanModal.seksi;
                        setSelectedKegiatanModal(null);
                        openPrintReport({
                          reportType: 'seksi_kategorial',
                          selectedSeksi: targetSeksi,
                          customTitle: `PROGRAM KERJA ${selectedKegiatanModal.seksi} - ${selectedKegiatanModal.namaProgram || (selectedKegiatanModal as any).namaKegiatan || 'GKE'}`,
                        });
                      }}
                      className="px-4 py-2 rounded-xl bg-cyan-700 hover:bg-cyan-600 text-white font-bold text-xs transition cursor-pointer flex items-center gap-1.5 shadow-sm border border-cyan-500/40"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Cetak Laporan {selectedKegiatanModal.seksi}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedKegiatanModal(null)}
                      className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition cursor-pointer border border-slate-700"
                    >
                      Tutup
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB: PANITIA PEMBANGUNAN GKE */}
        {activePortalTab === 'panitia_pembangunan' && (
          <div className="space-y-6">
            <div className="portal-dark-card bg-gradient-to-r from-amber-950 via-slate-900 to-orange-950 !text-white text-white p-6 rounded-2xl shadow-lg border border-amber-500/30 space-y-4" style={{ background: 'linear-gradient(135deg, #451a03 0%, #0f172a 50%, #431407 100%)' }}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-extrabold uppercase border border-amber-400/30" style={{ color: '#fcd34d' }}>
                  <Building2 className="w-3.5 h-3.5 text-amber-300" /> Pembangunan &amp; Renovasi Fisik Gereja
                </span>
                <span className="text-xs text-amber-200 bg-amber-950/70 px-3 py-1 rounded-lg border border-amber-500/30 font-bold" style={{ color: '#fde68a' }}>
                  {formattedMajelisJemaat || settings.namaJemaat || 'GKE JEMAAT'}
                </span>
              </div>

              <div>
                <h2 className="banner-title text-xl md:text-2xl font-black font-serif !text-white text-white tracking-tight" style={{ color: '#ffffff' }}>
                  Panitia Pembangunan &amp; Renovasi Fisik GKE
                </h2>
                <p className="text-xs sm:text-sm !text-slate-200 text-slate-200 max-w-3xl leading-relaxed mt-1" style={{ color: '#e2e8f0' }}>
                  Informasi susunan tim Panitia Pembangunan, target fisik, serta perkembangan dan transparansi pelaksanaan proyek renovasi/pembangunan sarana ibadah di {formattedMajelisJemaat || settings.namaJemaat || 'GKE'}.
                </p>
              </div>

              {/* Action Bar / Tombol Cetak Dokumen Pembangunan */}
              <div className="pt-2 border-t border-amber-500/20 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs text-amber-200 font-bold">
                  <Printer className="w-4 h-4 text-amber-400" />
                  <span>Cetak Dokumen Resmi:</span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => openPrintReport({ reportType: 'panitia_pembangunan', filterJenis: 'panitia', customTitle: 'STRUKTUR & SUSUNAN PANITIA PEMBANGUNAN GKE' })}
                    className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                  >
                    <Briefcase className="w-3.5 h-3.5 text-slate-950" />
                    <span>Cetak Susunan Panitia</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => openPrintReport({ reportType: 'panitia_pembangunan', filterJenis: 'proyek', customTitle: 'LAPORAN AGENDA & PROGRES PROYEK PEMBANGUNAN GKE' })}
                    className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all shadow-sm flex items-center gap-1.5 cursor-pointer border border-emerald-400/40"
                  >
                    <Building2 className="w-3.5 h-3.5" />
                    <span>Cetak Proyek &amp; Progres</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => openPrintReport({ reportType: 'panitia_pembangunan', filterJenis: 'all' })}
                    className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-200 font-bold text-xs transition-all border border-slate-600 flex items-center gap-1.5 cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5 text-amber-400" />
                    <span>Cetak Semua Bagian</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 section-panitia-pembangunan">
              {/* Susunan Panitia (5 Cols) */}
              <div className="lg:col-span-5 bg-slate-900/90 text-white rounded-2xl p-5 sm:p-6 border border-slate-800 shadow-md space-y-4 box-panitia-container">
                <div className="flex flex-wrap items-center justify-between border-b border-slate-800 pb-3 gap-2">
                  <h3 className="font-black text-white text-sm uppercase tracking-wider flex items-center gap-2">
                    <Briefcase className="w-4.5 h-4.5 text-amber-400" />
                    <span>Susunan Panitia Pembangunan</span>
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-md bg-amber-950/70 text-amber-300 border border-amber-600/50 badge-personil-counter">
                      {pengurusPembangunanList.length} Personil
                    </span>
                    <button
                      type="button"
                      onClick={() => openPrintReport({ reportType: 'panitia_pembangunan', filterJenis: 'panitia', customTitle: 'STRUKTUR & SUSUNAN PANITIA PEMBANGUNAN GKE' })}
                      className="px-2.5 py-1 rounded-lg bg-amber-900/60 hover:bg-amber-800 text-amber-200 font-bold text-[11px] transition-all flex items-center gap-1 border border-amber-500/40 cursor-pointer shadow-2xs"
                      title="Cetak Struktur & Susunan Panitia Pembangunan"
                    >
                      <Printer className="w-3 h-3 text-amber-300" />
                      <span>Cetak</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-2.5">
                  {pengurusPembangunanList.length === 0 ? (
                    <div className="p-8 text-center bg-slate-950/60 rounded-xl border border-slate-800 space-y-2">
                      <Briefcase className="w-8 h-8 text-slate-500 mx-auto" />
                      <p className="text-xs font-bold text-slate-200">Belum ada data panitia pembangunan</p>
                      <p className="text-[11px] text-slate-400">Data panitia pembangunan akan ditampilkan setelah di-input oleh sekretariat.</p>
                    </div>
                  ) : (
                    pengurusPembangunanList.map((p) => {
                      const namaLengkap = `${p.nama || (p as any).namaLengkap || 'Nama Panitia'}${
                        p.gelar ? `, ${p.gelar}` : ''
                      }`;

                      return (
                        <div
                          key={p.id}
                          className="p-3.5 bg-slate-950/60 hover:bg-slate-800/80 rounded-xl border border-slate-800 hover:border-amber-500/40 transition-all space-y-2 text-xs card-panitia-item"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="space-y-1">
                              <p className="font-black text-white text-sm leading-snug">{namaLengkap}</p>
                              <span className="inline-block px-2.5 py-0.5 rounded-md bg-amber-950/80 text-amber-300 font-extrabold text-[10px] uppercase tracking-wider border border-amber-600/60 badge-panitia-jabatan">
                                {p.jabatan}
                              </span>
                            </div>
                            {p.status && (
                              <span
                                className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded shrink-0 ${
                                  p.status === 'Aktif'
                                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                    : 'bg-slate-800 text-slate-300 border border-slate-700'
                                }`}
                              >
                                {p.status}
                              </span>
                            )}
                          </div>

                          <div className="pt-2 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-300">
                            {p.noHp ? (
                              <a
                                href={`https://wa.me/${p.noHp.replace(/[^0-9]/g, '')}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-emerald-400 font-bold hover:underline bg-emerald-950/40 hover:bg-emerald-900/60 px-2.5 py-1 rounded-md border border-emerald-500/30"
                              >
                                <Phone className="w-3 h-3" />
                                <span>{p.noHp}</span>
                              </a>
                            ) : (
                              <span className="text-slate-500 italic">Kontak Panitia</span>
                            )}

                            {p.periode && (
                              <span className="text-slate-400 font-medium">
                                Periode: <strong className="text-slate-200">{p.periode}</strong>
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Proyek Pembangunan (7 Cols) */}
              <div className="lg:col-span-7 bg-slate-900/90 text-white rounded-2xl p-5 sm:p-6 border border-slate-800 shadow-md space-y-4 box-proyek-container">
                <div className="flex flex-wrap items-center justify-between border-b border-slate-800 pb-3 gap-2">
                  <h3 className="font-black text-white text-sm uppercase tracking-wider flex items-center gap-2">
                    <Building2 className="w-4.5 h-4.5 text-amber-400" />
                    <span>Proyek &amp; Progres Pembangunan</span>
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-md bg-emerald-950/70 text-emerald-300 border border-emerald-600/50 badge-proyek-counter">
                      {proyekPembangunanList.length} Proyek
                    </span>
                    <button
                      type="button"
                      onClick={() => openPrintReport({ reportType: 'panitia_pembangunan', filterJenis: 'proyek', customTitle: 'LAPORAN AGENDA & PROGRES PROYEK PEMBANGUNAN GKE' })}
                      className="px-2.5 py-1 rounded-lg bg-emerald-900/60 hover:bg-emerald-800 text-emerald-200 font-bold text-[11px] transition-all flex items-center gap-1 border border-emerald-500/40 cursor-pointer shadow-2xs"
                      title="Cetak Agenda & Progres Proyek Pembangunan"
                    >
                      <Printer className="w-3 h-3 text-emerald-300" />
                      <span>Cetak Progres</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  {proyekPembangunanList.length === 0 ? (
                    <div className="p-8 text-center bg-slate-950/60 rounded-xl border border-slate-800 space-y-2">
                      <Building2 className="w-8 h-8 text-slate-500 mx-auto" />
                      <p className="text-xs font-bold text-slate-200">Belum ada data proyek pembangunan</p>
                      <p className="text-[11px] text-slate-400">Target fisik dan progres renovasi sarana akan ditampilkan di sini.</p>
                    </div>
                  ) : (
                    proyekPembangunanList.map((proyek) => {
                      const persen = proyek.progresPersen ?? (proyek as any).progresPercent ?? 0;

                      return (
                        <div
                          key={proyek.id}
                          className="p-4 bg-slate-950/60 hover:bg-slate-800/80 rounded-xl border border-slate-800 hover:border-amber-500/30 transition-all space-y-3 text-xs card-proyek-item"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="space-y-1">
                              <span className="inline-block text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded bg-amber-950/80 text-amber-300 border border-amber-600/60 badge-proyek-kategori">
                                {proyek.kategoriProyek || 'Proyek Fisik'}
                              </span>
                              <h4 className="font-black text-white text-sm leading-snug">{proyek.namaProyek}</h4>
                            </div>
                            <span className="px-2.5 py-1 rounded-md bg-emerald-950/80 text-emerald-300 font-black text-xs border border-emerald-500/40 shadow-2xs shrink-0">
                              {persen}% Selesai
                            </span>
                          </div>

                          {/* Progress Bar */}
                          <div className="space-y-1.5 bg-slate-900/90 p-3 rounded-lg border border-slate-800">
                            <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden border border-slate-700">
                              <div
                                className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-500 shadow-xs"
                                style={{ width: `${Math.min(Math.max(persen, 0), 100)}%` }}
                              />
                            </div>
                            <div className="flex items-center justify-between text-[11px] font-mono">
                              <span className="text-slate-300 font-medium">
                                Mulai: <strong className="text-white font-bold">{proyek.tanggalMulai || '-'}</strong>
                              </span>
                              <span className="text-slate-300 font-medium">
                                Target: <strong className="text-white font-bold">{proyek.targetSelesai || '-'}</strong>
                              </span>
                            </div>
                          </div>

                          {proyek.keterangan && (
                            <p className="text-amber-100/90 text-xs leading-relaxed bg-amber-950/30 p-3 rounded-lg border border-amber-600/30 italic">
                              "{proyek.keterangan}"
                            </p>
                          )}

                          <div className="pt-2 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
                            <div className="text-slate-300 font-mono">
                              <span className="text-slate-400 font-sans">Anggaran: </span>
                              <strong className="text-amber-300 font-black text-sm">
                                Rp {(proyek.targetAnggaran || 0).toLocaleString('id-ID')}
                              </strong>
                            </div>

                            <div className="text-[11px] font-sans text-slate-300">
                              PJ Teknis: <strong className="text-white font-bold">{proyek.penanggungJawabTeknis || '-'}</strong>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: TRANSPARANSI KEUANGAN */}
        {activePortalTab === 'keuangan' && (
          <div className="space-y-6">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-emerald-600" />
                  Transparansi Keuangan Kas Jemaat GKE
                </h2>
                <p className="text-xs text-slate-500">
                  Seluruh data transaksi Kas Umum & Kas Pembangunan Gereja di-input resmi oleh Bendahara Jemaat
                </p>
              </div>

              <button
                onClick={() => openPrintReport({
                  reportType: 'keuangan_bulanan',
                  posKas: portalPosKas !== 'semua' ? portalPosKas : undefined
                })}
                className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-4 py-2 rounded-lg shadow-xs"
              >
                <Printer className="w-4 h-4 text-emerald-400" />
                <span>Cetak Laporan Keuangan Berstempel</span>
              </button>
            </div>

            {/* Switcher Pos Kas */}
            <div className="bg-slate-100 dark:bg-slate-900/90 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs space-y-2">
              <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600 dark:text-slate-300 px-1">
                <span className="font-bold">Pilih Pos Kas Jemaat:</span>
                <span className="font-extrabold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/70 px-2 py-0.5 rounded border border-indigo-200 dark:border-indigo-800/60">
                  Filter: {portalPosKas}
                </span>
              </div>
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
                <button
                  type="button"
                  onClick={() => setPortalPosKas('semua')}
                  className={`whitespace-nowrap py-1.5 px-3 rounded-lg font-bold transition-all text-xs shrink-0 cursor-pointer ${
                    portalPosKas === 'semua'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 shadow-2xs'
                  }`}
                >
                  Semua Pos Kas (Gabungan)
                </button>
                {[
                  'Kas Umum',
                  'Kas Pembangunan',
                  'Kas Kupon',
                  'Kas Diakonia',
                  'Kas Iuran Kewajiban',
                  'Kas Iuran Pembangunan',
                  'Kas SPPer',
                  'Kas SPB',
                  'Kas SPPR/P',
                  'Kas Anak Sekolah Hari Minggu',
                ].map((pos) => (
                  <button
                    key={pos}
                    type="button"
                    onClick={() => setPortalPosKas(pos)}
                    className={`whitespace-nowrap py-1.5 px-3 rounded-lg font-bold transition-all text-xs shrink-0 cursor-pointer ${
                      portalPosKas === pos
                        ? pos === 'Kas Pembangunan' || pos === 'Kas Iuran Pembangunan' || pos === 'Kas Kupon'
                          ? 'bg-amber-600 text-white shadow-xs'
                          : pos === 'Kas Diakonia'
                          ? 'bg-rose-600 text-white shadow-xs'
                          : 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 shadow-2xs'
                    }`}
                  >
                    {pos}
                  </button>
                ))}
              </div>
            </div>

            {/* Financial Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="pemasukan-box-portal bg-emerald-50 dark:bg-slate-900 border border-emerald-200 dark:border-emerald-500/40 p-4 rounded-xl">
                <span className="text-[10px] text-emerald-800 dark:text-emerald-400 font-bold uppercase">
                  Total Pemasukan ({portalPosKas})
                </span>
                <p className="ringkasan-keuangan-pemasukan text-2xl font-black text-emerald-950 dark:text-emerald-300 mt-1">
                  Rp {totalPemasukan.toLocaleString('id-ID')}
                </p>
              </div>

              <div className="pengeluaran-box-portal bg-rose-50 dark:bg-slate-900 border border-rose-200 dark:border-rose-500/40 p-4 rounded-xl">
                <span className="text-[10px] text-rose-800 dark:text-rose-400 font-bold uppercase">
                  Total Pengeluaran ({portalPosKas})
                </span>
                <p className="ringkasan-keuangan-pengeluaran text-2xl font-black text-rose-950 dark:text-rose-300 mt-1">
                  Rp {totalPengeluaran.toLocaleString('id-ID')}
                </p>
              </div>

              <div className="saldo-box-portal bg-blue-50 dark:bg-slate-900 border border-blue-200 dark:border-sky-500/40 p-4 rounded-xl">
                <span className="text-[10px] text-blue-900 dark:text-sky-400 font-bold uppercase">
                  Saldo Kas Akhir ({portalPosKas})
                </span>
                <p className="ringkasan-keuangan-saldo text-2xl font-black text-blue-950 dark:text-sky-300 mt-1">
                  Rp {saldoKas.toLocaleString('id-ID')}
                </p>
              </div>
            </div>

            {/* Detailed Transaction Table for Warga Jemaat */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
              <div className="p-3 bg-slate-100 font-bold text-slate-900 text-xs border-b border-slate-200 flex justify-between items-center">
                <span>Rincian Riwayat Transaksi Kas</span>
                <span className="text-[11px] font-semibold text-slate-500">
                  Menampilkan: {portalPosKas}
                </span>
              </div>
              <div className="overflow-x-auto w-full max-w-full">
                <table className="w-full min-w-[800px] text-xs text-left text-slate-700">
                  <thead className="bg-slate-50 text-slate-900 font-bold border-b border-slate-200 uppercase text-[11px] whitespace-nowrap">
                    <tr>
                      <th className="p-3 w-12 text-center">No</th>
                      <th className="p-3">Tanggal</th>
                      <th className="p-3">Pos Kas</th>
                      <th className="p-3">No Ref</th>
                      <th className="p-3">Kategori</th>
                      <th className="p-3">Keterangan</th>
                      <th className="p-3 text-right">Pemasukan</th>
                      <th className="p-3 text-right">Pengeluaran</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {displayKeuanganList.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="p-6 text-center text-slate-400">
                          Belum ada transaksi pada pos kas ini.
                        </td>
                      </tr>
                    ) : (
                      displayKeuanganList.map((item, idx) => {
                        const pos = item.posKas || 'Kas Umum';
                        return (
                          <tr key={item.id} className="hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors">
                            <td className="p-3 text-center font-mono text-slate-500">{idx + 1}</td>
                            <td className="p-3 whitespace-nowrap">{item.tanggal}</td>
                            <td className="p-3">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  pos === 'Kas Pembangunan'
                                    ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                    : 'bg-indigo-100 text-indigo-900 border border-indigo-200'
                                }`}
                              >
                                {pos}
                              </span>
                            </td>
                            <td className="p-3 font-mono text-[10px] text-slate-500">
                              {item.noReferensi}
                            </td>
                            <td className="p-3">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  item.jenis === 'pemasukan'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-rose-100 text-rose-800'
                                }`}
                              >
                                {item.kategori}
                              </span>
                            </td>
                            <td className="p-3 font-medium text-slate-900">{item.keterangan}</td>
                            <td className="p-3 text-right font-bold text-emerald-700">
                              {item.jenis === 'pemasukan'
                                ? `Rp ${item.jumlah.toLocaleString('id-ID')}`
                                : '-'}
                            </td>
                            <td className="p-3 text-right font-bold text-rose-700">
                              {item.jenis === 'pengeluaran'
                                ? `Rp ${item.jumlah.toLocaleString('id-ID')}`
                                : '-'}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: JADWAL IBADAH */}
        {activePortalTab === 'jadwal' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  Jadwal Ibadah &amp; Petugas Pelayanan
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Daftar Kebaktian Minggu, Ibadah Kategorial (SPB, SPPer, SPPR/P, ASHM), Ibadah Rayon / Lingkungan &amp; Liturgis
                </p>
              </div>

              <button
                onClick={() => openPrintReport({ reportType: 'jadwal_ibadah' })}
                className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs font-bold px-4 py-2 rounded-lg cursor-pointer transition shadow-xs border border-transparent dark:border-slate-700"
              >
                <Printer className="w-4 h-4 text-emerald-400" />
                <span>Cetak Jadwal Ibadah Official</span>
              </button>
            </div>

            {/* Filter and Search Bar for Jadwal */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cari nama ibadah, tempat, pelayan, rayon, seksi..."
                  value={jadwalSearch}
                  onChange={(e) => setJadwalSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 text-xs font-medium focus:outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900"
                />
              </div>

              <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setJadwalCategoryFilter('semua')}
                  className={`px-3 py-1.5 rounded-xl font-bold text-xs transition cursor-pointer ${
                    jadwalCategoryFilter === 'semua'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                  }`}
                >
                  Semua ({jadwalIbadahList.length})
                </button>
                <button
                  type="button"
                  onClick={() => setJadwalCategoryFilter('umum')}
                  className={`px-3 py-1.5 rounded-xl font-bold text-xs transition cursor-pointer ${
                    jadwalCategoryFilter === 'umum'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                  }`}
                >
                  Ibadah Umum / Minggu
                </button>
                <button
                  type="button"
                  onClick={() => setJadwalCategoryFilter('kategorial')}
                  className={`px-3 py-1.5 rounded-xl font-bold text-xs transition cursor-pointer ${
                    jadwalCategoryFilter === 'kategorial'
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                  }`}
                >
                  Kategorial (SPB/SPPer/SPPR/ASHM)
                </button>
                <button
                  type="button"
                  onClick={() => setJadwalCategoryFilter('rayon')}
                  className={`px-3 py-1.5 rounded-xl font-bold text-xs transition cursor-pointer ${
                    jadwalCategoryFilter === 'rayon'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                  }`}
                >
                  Rayon / Lingkungan
                </button>
              </div>
            </div>

            {/* Jadwal Cards Grid */}
            {(() => {
              const filteredJadwal = jadwalIbadahList.filter((item) => {
                const q = jadwalSearch.toLowerCase().trim();
                const matchCategory =
                  jadwalCategoryFilter === 'semua'
                    ? true
                    : jadwalCategoryFilter === 'umum'
                    ? !item.kategoriIbadah || item.kategoriIbadah === 'Umum / Hari Minggu'
                    : jadwalCategoryFilter === 'kategorial'
                    ? item.kategoriIbadah === 'Kategorial' || !!item.seksi
                    : item.kategoriIbadah === 'Rayon / Lingkungan' || !!item.rayon;

                const matchSearch =
                  !q ||
                  (item.namaIbadah || '').toLowerCase().includes(q) ||
                  (item.tempat || '').toLowerCase().includes(q) ||
                  (item.pengkhotbah || item.pelayanFirman || '').toLowerCase().includes(q) ||
                  (item.liturgos || '').toLowerCase().includes(q) ||
                  (item.pemusik || '').toLowerCase().includes(q) ||
                  (item.rayon || '').toLowerCase().includes(q) ||
                  (item.seksi || '').toLowerCase().includes(q) ||
                  (item.tuanRumah || '').toLowerCase().includes(q) ||
                  (item.wartaKhusus || '').toLowerCase().includes(q);

                return matchCategory && matchSearch;
              });

              if (filteredJadwal.length === 0) {
                return (
                  <div className="bg-white dark:bg-slate-900 rounded-2xl p-10 border border-slate-200 dark:border-slate-800 text-center space-y-3">
                    <Calendar className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
                    <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">Tidak ada jadwal ibadah yang sesuai</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Silakan sesuaikan pilihan kategori atau kata kunci pencarian Anda.
                    </p>
                  </div>
                );
              }

              return (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredJadwal.map((item) => {
                    const isKategorial = item.kategoriIbadah === 'Kategorial' || !!item.seksi;
                    const isRayon = item.kategoriIbadah === 'Rayon / Lingkungan' || !!item.rayon;

                    return (
                      <div
                        key={item.id}
                        className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3 hover:shadow-md hover:border-blue-300 dark:hover:border-blue-700/60 transition-all flex flex-col justify-between"
                      >
                        <div className="space-y-3">
                          <div className="flex flex-wrap justify-between items-start border-b border-slate-100 dark:border-slate-800 pb-2 gap-2">
                            <div>
                              <div className="flex flex-wrap items-center gap-1.5 mb-1">
                                <span className="text-[10px] font-bold text-blue-800 dark:text-blue-300 uppercase bg-blue-50 dark:bg-blue-950/70 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-700/60 shadow-2xs">
                                  {item.tanggal} • {item.waktu}
                                </span>
                                {isKategorial && (
                                  <span className="text-[10px] font-extrabold text-purple-800 dark:text-purple-300 bg-purple-100 dark:bg-purple-950/70 px-2 py-0.5 rounded border border-purple-200 dark:border-purple-700/60 shadow-2xs">
                                    Kategorial {item.seksi ? `• ${item.seksi}` : ''}
                                  </span>
                                )}
                                {isRayon && (
                                  <span className="text-[10px] font-extrabold text-emerald-800 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/70 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-700/60 shadow-2xs">
                                    Rayon {item.rayon ? `• ${item.rayon}` : ''}
                                  </span>
                                )}
                              </div>
                              <h3 className="font-black text-slate-900 dark:text-white text-base leading-snug">
                                {item.namaIbadah}
                              </h3>
                            </div>
                          </div>

                          <div className="space-y-1 text-xs text-slate-600 dark:text-slate-300">
                            <p className="font-medium flex items-center gap-1.5 text-slate-700 dark:text-slate-200">
                              <MapPin className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 shrink-0" />
                              <span><strong>Tempat:</strong> {item.tempat}</span>
                            </p>
                            {item.tuanRumah && (
                              <p className="font-semibold text-emerald-800 dark:text-emerald-300 pl-5 text-[11px]">
                                Tuan Rumah (Kel.): {item.tuanRumah}
                              </p>
                            )}
                          </div>

                          <div className="p-3 bg-slate-50 dark:bg-slate-950/70 rounded-lg text-xs space-y-1.5 border border-slate-100 dark:border-slate-800">
                            <p className="flex items-center gap-1 text-slate-800 dark:text-slate-200">
                              <span className="text-slate-500 dark:text-slate-400 font-semibold">Pelayan Firman:</span>{' '}
                              <strong className="text-blue-950 dark:text-sky-300 font-bold">{item.pelayanFirman || item.pengkhotbah}</strong>
                            </p>
                            <p className="text-slate-700 dark:text-slate-300">
                              <span className="text-slate-500 dark:text-slate-400">Liturgos:</span> <span className="font-medium text-slate-900 dark:text-slate-100">{item.liturgos}</span>
                            </p>
                            {(item.pemusik || item.kantoria) && (
                              <p className="text-slate-700 dark:text-slate-300">
                                <span className="text-slate-500 dark:text-slate-400">Pemusik &amp; Singer:</span>{' '}
                                <span className="font-medium text-slate-900 dark:text-slate-100">{[item.pemusik, item.kantoria].filter(Boolean).join(' / ')}</span>
                              </p>
                            )}
                            {item.pembacaanAlkitab && (
                              <p className="text-indigo-900 dark:text-indigo-300 font-semibold text-[11px] pt-1 border-t border-slate-200 dark:border-slate-800">
                                Bacaan: {item.pembacaanAlkitab}
                              </p>
                            )}
                          </div>

                          {item.wartaKhusus && (
                            <p className="text-xs italic text-amber-900 dark:text-amber-200 bg-amber-50 dark:bg-amber-950/40 p-2.5 rounded-lg border border-amber-200 dark:border-amber-700/60 leading-relaxed">
                              Catatan: {item.wartaKhusus}
                            </p>
                          )}
                        </div>

                        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                          <button
                            type="button"
                            onClick={() =>
                              openPrintReport({
                                reportType: 'detail_jadwal_ibadah',
                                jadwalId: item.id,
                              })
                            }
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:hover:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700/60 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-2xs"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span>Cetak Lembar Jadwal Ini</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        )}

        {/* TAB 4: BULETIN RENUNGAN */}
        {activePortalTab === 'renungan' && (
          <div className="space-y-6">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-blue-600" />
                  Buletin Renungan Harian GKE
                </h2>
                <p className="text-xs text-slate-500">
                  Kumpulan bahan renungan harian dan khotbah Minggu untuk pertumbuhan rohani warga jemaat
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-serif">
              {renunganList.map((rng) => (
                <div
                  key={rng.id}
                  className="bg-white rounded-xl p-6 border border-slate-200 shadow-xs space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-xs font-sans">
                      <span className="font-bold text-blue-900 uppercase bg-blue-100 px-2.5 py-0.5 rounded-full text-[10px]">
                        {rng.kategori}
                      </span>
                      <span className="text-slate-500">{rng.tanggal}</span>
                    </div>

                    <h3 className="text-lg font-bold text-slate-900">{rng.judul}</h3>
                    <p className="text-xs font-bold text-blue-900 italic">
                      Nats Alkitab: {rng.natsAlkitab}
                    </p>

                    <p className="text-xs text-slate-700 leading-relaxed text-justify line-clamp-5">
                      {rng.isi}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-sans">
                    <span className="text-slate-500">Oleh: {rng.penulis}</span>
                    <button
                      onClick={() =>
                        openPrintReport({
                          reportType: 'buletin_renungan',
                          renunganId: rng.id,
                        })
                      }
                      className="flex items-center gap-1 text-blue-600 font-bold hover:underline"
                    >
                      <Printer className="w-3.5 h-3.5" /> Cetak Buletin
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB: ALMANAK NAST GKE */}
        {(activePortalTab === 'almanak_nast' || activePortalTab === 'almanak') && (
          <div className="space-y-6">
            <AlmanakNastModule isAdmin={false} />
          </div>
        )}

        {/* TAB 5: KEPENGURISAN MPH & PENATUA */}
        {activePortalTab === 'kepengurusan' && (
          <div className="space-y-6">
            {/* Header Banner Kepengurusan with Official GKE Logo (Tanpa Border) */}
            <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-wrap justify-between items-center gap-4">
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
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                      Sinode GKE &bull; {settings.resortGke || 'Resort GKE'}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                      {settings.namaJemaat || 'Jemaat GKE'}
                    </span>
                  </div>
                  <h2 className="text-base sm:text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0" />
                    <span>Kepengurusan Majelis Jemaat GKE</span>
                  </h2>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                    Majelis Pekerja Harian (MPH) dan Penatua / Diakon Rayon Pelayanan
                  </p>
                </div>
              </div>

              <button
                onClick={() => openPrintReport({ reportType: 'mph_jemaat' })}
                className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-md transition-all cursor-pointer hover:-translate-y-0.5"
              >
                <Printer className="w-4 h-4 text-emerald-400" />
                <span>Cetak Struktur Kepengurusan</span>
              </button>
            </div>

            {/* MPH Cards with high contrast, GKE Logo emblem and details */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-extrabold text-slate-900 dark:text-white text-sm sm:text-base flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                  <span>Majelis Pekerja Harian (MPH) Jemaat</span>
                </h3>
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                  {mphList.length} Pengurus Aktif
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {mphList.map((m) => {
                  const jabLower = (m.jabatan || '').toLowerCase();
                  let roleBadgeStyle = 'bg-slate-100 text-slate-800 border-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700';
                  if (jabLower.includes('ketua') && !jabLower.includes('wakil')) {
                    roleBadgeStyle = 'bg-blue-600 text-white border-blue-500 font-extrabold shadow-2xs';
                  } else if (jabLower.includes('wakil')) {
                    roleBadgeStyle = 'bg-sky-600 text-white border-sky-500 font-bold shadow-2xs';
                  } else if (jabLower.includes('sekretaris')) {
                    roleBadgeStyle = 'bg-emerald-600 text-white border-emerald-500 font-bold shadow-2xs';
                  } else if (jabLower.includes('bendahara')) {
                    roleBadgeStyle = 'bg-amber-600 text-white border-amber-500 font-bold shadow-2xs';
                  }

                  return (
                    <div
                      key={m.id}
                      className="mph-member-card bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs flex flex-col justify-between shadow-xs hover:shadow-md transition-all"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2 mb-3">
                          <span className={`text-[10px] uppercase px-2.5 py-1 rounded-md border tracking-wide ${roleBadgeStyle}`}>
                            {m.jabatan}
                          </span>
                          <div className="w-8 h-8 shrink-0 flex items-center justify-center overflow-hidden">
                            <img
                              src={settings.logoUrl || settings.logoGkeUrl || defaultGkeLogo}
                              alt="GKE"
                              className="w-full h-full object-contain"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = defaultGkeLogo;
                              }}
                            />
                          </div>
                        </div>

                        <h4 className="font-extrabold text-slate-950 dark:text-white text-sm sm:text-base leading-snug tracking-tight">
                          {m.nama}{m.gelar ? `, ${m.gelar}` : ''}
                        </h4>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                        <span className="font-medium">Periode: <strong className="text-slate-800 dark:text-slate-200">{m.periode}</strong></span>
                        {m.noHp && (
                          <a
                            href={`https://wa.me/${m.noHp.replace(/\D/g, '')}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 hover:underline font-bold"
                            title="Hubungi WhatsApp"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                            <span>{m.noHp}</span>
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Penatua Diakon Table */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
              <div className="p-3 bg-slate-100 font-bold text-slate-900 text-xs border-b border-slate-200">
                Daftar Pelayan Tahbisan Penatua & Diakon Per Rayon
              </div>
              <div className="overflow-x-auto w-full max-w-full">
                <table className="w-full min-w-[700px] text-xs text-left text-slate-700">
                  <thead className="bg-slate-50 text-slate-900 font-bold border-b border-slate-200 uppercase text-[11px] whitespace-nowrap">
                    <tr>
                      <th className="p-3 w-12 text-center">No</th>
                      <th className="p-3">Nama & Gelar</th>
                      <th className="p-3">Jabatan</th>
                      <th className="p-3">Rayon</th>
                      <th className="p-3">Masa Bakti</th>
                      <th className="p-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {penatuaDiakonList.map((p, idx) => (
                      <tr key={p.id} className="hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors">
                        <td className="p-3 text-center font-mono text-slate-500">{idx + 1}</td>
                        <td className="p-3 font-bold text-slate-900">
                          {p.nama}, {p.gelar}
                        </td>
                        <td className="p-3 font-semibold text-blue-900">{p.jabatan}</td>
                        <td className="p-3 font-medium">{p.rayon}</td>
                        <td className="p-3">{p.masaBakti}</td>
                        <td className="p-3 text-center font-bold text-emerald-800">
                          {p.status}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: ASET JEMAAT */}
        {activePortalTab === 'aset' && (() => {
          const kategoriOptions = Array.from(
            new Set(inventarisList.map((i) => i.kategori).filter(Boolean))
          );

          const filteredAset = inventarisList.filter((item) => {
            const matchesCategory =
              asetCategoryFilter === 'semua' || item.kategori === asetCategoryFilter;
            const q = asetSearch.toLowerCase().trim();
            const matchesSearch =
              !q ||
              (item.namaBarang || '').toLowerCase().includes(q) ||
              (item.kodeAset || '').toLowerCase().includes(q) ||
              (item.kategori || '').toLowerCase().includes(q) ||
              (item.lokasiPenyimpanan || '').toLowerCase().includes(q) ||
              (item.kondisi || '').toLowerCase().includes(q);
            return matchesCategory && matchesSearch;
          });

          const filteredValuasi = filteredAset.reduce(
            (sum, item) => sum + (item.nilaiAset || 0) * (item.kuantitas || 0),
            0
          );

          return (
            <div className="space-y-6">
              {/* Header Card & Tombol Cetak */}
              <div className="bg-slate-900/90 text-white p-5 sm:p-6 rounded-2xl border border-slate-800 shadow-md flex flex-wrap items-center justify-between gap-4 card-inventaris-header">
                <div className="space-y-1">
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <Package className="w-5 h-5 text-amber-400 shrink-0" />
                    <span>Daftar Sarana &amp; Inventaris Aset Jemaat</span>
                  </h2>
                  <p className="text-xs text-slate-300">
                    Ringkasan fasilitas, gedung, sound system, instrumen musik, dan kendaraan milik Majelis Jemaat GKE
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <div className="text-right bg-blue-950/70 px-4 py-2 rounded-xl border border-blue-800/60 shadow-xs">
                    <span className="text-[10px] text-cyan-300 uppercase font-bold tracking-wider block">
                      Total Valuasi Aset
                    </span>
                    <p className="text-base sm:text-lg font-black text-white font-mono">
                      Rp {totalNilaiAset.toLocaleString('id-ID')}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      openPrintReport({
                        reportType: 'inventaris_aset',
                        customTitle: 'LAPORAN DATA SARANA & INVENTARIS ASET JEMAAT GKE',
                      })
                    }
                    className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl cursor-pointer transition-all shadow-sm border border-emerald-500 hover:shadow-md active:scale-95"
                    title="Cetak Buku Inventaris & Aset Jemaat"
                  >
                    <Printer className="w-4 h-4 text-emerald-100" />
                    <span>Cetak Laporan Aset</span>
                  </button>
                </div>
              </div>

              {/* Filter & Pencarian Bar */}
              <div className="bg-slate-900/90 text-white p-4 rounded-2xl border border-slate-800 shadow-md space-y-3">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                  {/* Search Input */}
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={asetSearch}
                      onChange={(e) => setAsetSearch(e.target.value)}
                      placeholder="Cari nama barang, kode aset, kategori, atau lokasi..."
                      className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-amber-500 transition"
                    />
                    {asetSearch && (
                      <button
                        type="button"
                        onClick={() => setAsetSearch('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Cetak Hasil Filter jika ada filter aktif */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400 font-medium whitespace-nowrap">
                      Menampilkan: <strong className="text-white">{filteredAset.length}</strong> / {inventarisList.length} Aset
                    </span>
                  </div>
                </div>

                {/* Kategori Filter Chips */}
                {kategoriOptions.length > 0 && (
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 scrollbar-none text-xs">
                    <button
                      type="button"
                      onClick={() => setAsetCategoryFilter('semua')}
                      className={`px-3 py-1.5 rounded-lg font-bold transition whitespace-nowrap cursor-pointer ${
                        asetCategoryFilter === 'semua'
                          ? 'bg-amber-600 text-white shadow-sm'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
                      }`}
                    >
                      Semua Kategori ({inventarisList.length})
                    </button>
                    {kategoriOptions.map((kat) => {
                      const count = inventarisList.filter((i) => i.kategori === kat).length;
                      return (
                        <button
                          key={kat}
                          type="button"
                          onClick={() => setAsetCategoryFilter(kat)}
                          className={`px-3 py-1.5 rounded-lg font-semibold transition whitespace-nowrap cursor-pointer ${
                            asetCategoryFilter === kat
                              ? 'bg-amber-600 text-white shadow-sm'
                              : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
                          }`}
                        >
                          {kat} ({count})
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Tabel Data Aset */}
              <div className="bg-slate-900/90 rounded-2xl border border-slate-800 overflow-hidden shadow-md card-inventaris-table">
                <div className="overflow-x-auto w-full max-w-full">
                  <table className="w-full min-w-[800px] text-xs text-left text-slate-200">
                    <thead className="bg-slate-950 text-slate-200 font-extrabold border-b border-slate-800 uppercase text-[11px] whitespace-nowrap tracking-wider">
                      <tr>
                        <th className="p-3.5 w-12 text-center text-slate-400">No</th>
                        <th className="p-3.5 text-amber-400">Kode Aset</th>
                        <th className="p-3.5 text-white">Nama Barang / Aset</th>
                        <th className="p-3.5 text-slate-300">Kategori</th>
                        <th className="p-3.5 text-center text-slate-300">Jumlah</th>
                        <th className="p-3.5 text-center text-slate-300">Kondisi</th>
                        <th className="p-3.5 text-right text-slate-300">Nilai Perolehan (Rp)</th>
                        <th className="p-3.5 text-right text-cyan-300">Total Nilai (Rp)</th>
                        <th className="p-3.5 text-slate-300">Lokasi / Ruangan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/80">
                      {filteredAset.map((item, idx) => {
                        const totalItemNilai = (item.nilaiAset || 0) * (item.kuantitas || 0);
                        const kondisiLower = (item.kondisi || '').toLowerCase();
                        const isBaik = kondisiLower.includes('baik');
                        const isRusakBerat = kondisiLower.includes('berat');

                        return (
                          <tr key={item.id} className="hover:bg-slate-800/80 transition-colors border-b border-slate-800/60 row-inventaris-item">
                            <td className="p-3.5 text-center whitespace-nowrap">
                              <span className="font-mono text-slate-300 font-bold">{idx + 1}</span>
                            </td>
                            <td className="p-3.5 font-mono text-[11px] font-bold whitespace-nowrap">
                              <span className="inline-block px-2.5 py-1 rounded-md bg-amber-500/15 text-amber-300 border border-amber-500/40 font-mono tracking-tight font-bold whitespace-nowrap badge-kode-aset">
                                {item.kodeAset}
                              </span>
                            </td>
                            <td className="p-3.5">
                              <span className="font-bold text-white text-xs leading-snug block">{item.namaBarang}</span>
                            </td>
                            <td className="p-3.5 whitespace-nowrap">
                              <span className="px-2.5 py-1 rounded-md bg-slate-800 text-slate-200 border border-slate-700 font-medium text-[11px] whitespace-nowrap badge-kategori-aset">
                                {item.kategori}
                              </span>
                            </td>
                            <td className="p-3.5 text-center whitespace-nowrap">
                              <span className="font-bold text-slate-100">{item.kuantitas} {item.satuan}</span>
                            </td>
                            <td className="p-3.5 text-center whitespace-nowrap">
                              <span
                                className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border ${
                                  isBaik
                                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 badge-kondisi-baik'
                                    : isRusakBerat
                                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 badge-kondisi-berat'
                                    : 'bg-amber-500/20 text-amber-300 border-amber-500/40 badge-kondisi-ringan'
                                }`}
                              >
                                {item.kondisi}
                              </span>
                            </td>
                            <td className="p-3.5 text-right font-medium font-mono whitespace-nowrap">
                              <span className="text-slate-300 font-mono">Rp {(item.nilaiAset || 0).toLocaleString('id-ID')}</span>
                            </td>
                            <td className="p-3.5 text-right font-bold font-mono bg-slate-950/40 whitespace-nowrap">
                              <span className="text-cyan-300 font-bold font-mono text-total-item-nilai">Rp {totalItemNilai.toLocaleString('id-ID')}</span>
                            </td>
                            <td className="p-3.5 font-medium whitespace-nowrap">
                              <span className="text-slate-300">{item.lokasiPenyimpanan || '-'}</span>
                            </td>
                          </tr>
                        );
                      })}

                      {filteredAset.length === 0 && (
                        <tr>
                          <td colSpan={9} className="p-8 text-center text-slate-400">
                            <Package className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                            <p className="font-semibold text-slate-200">Tidak ada data aset yang sesuai kriteria pencarian</p>
                            <p className="text-xs text-slate-400 mt-1">Coba kata kunci lain atau pilih &apos;Semua Kategori&apos;</p>
                          </td>
                        </tr>
                      )}
                    </tbody>
                    {filteredAset.length > 0 && (
                      <tfoot className="bg-slate-950 font-bold border-t-2 border-slate-800 text-slate-200 text-xs">
                        <tr>
                          <td colSpan={7} className="p-3.5 text-right uppercase text-slate-300">
                            Total Subtotal Terfilter ({filteredAset.length} Barang):
                          </td>
                          <td className="p-3.5 text-right text-cyan-400 font-black text-sm font-mono whitespace-nowrap">
                            <span className="text-total-valuasi font-black text-sm font-mono">Rp {filteredValuasi.toLocaleString('id-ID')}</span>
                          </td>
                          <td></td>
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>
              </div>
            </div>
          );
        })()}

        {/* TAB: SURAT PELIMPAHAN NIKAH */}
        {activePortalTab === 'surat_pelimpahan_nikah' && (
          <div className="space-y-6">
            <SuratPelimpahanModule />
          </div>
        )}

        {/* TAB: ALKITAB DIGITAL (TB) */}
        {activePortalTab === 'alkitab' && (
          <div className="space-y-6">
            <AlkitabModule />
          </div>
        )}

        {/* TAB: AGENDA & ARSIP SURAT GEREJA */}
        {activePortalTab === 'agenda_surat' && (
          <div className="space-y-6">
            <SuratModule />
          </div>
        )}

        {/* TAB: BUKU PANDUAN & TUTORIAL PENGGUNAAN */}
        {(activePortalTab === 'panduan' || activePortalTab === 'tutorial') && (
          <div className="space-y-6">
            <TutorialModule />
          </div>
        )}

        {/* TAB 7: SENSUS WARGA */}
        {activePortalTab === 'sensus' && (
          <div className="space-y-6">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-wrap justify-between items-center gap-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-600" />
                  Sensus Data Anggota Warga Jemaat
                </h2>
                <p className="text-xs text-slate-500">
                  Total {totalWarga} Jiwa terdaftar dalam {totalKK} Kartu Keluarga Jemaat (KJJ)
                </p>
              </div>

              <button
                onClick={() => openPrintReport({ reportType: 'warga_jemaat' })}
                className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-4 py-2 rounded-lg"
              >
                <Printer className="w-4 h-4 text-emerald-400" />
                <span>Cetak Laporan Sensus</span>
              </button>
            </div>

            {/* Privacy Protection Notice Banner */}
            <div className="flex items-center gap-2.5 bg-amber-500/10 border border-amber-500/30 text-amber-900 p-3.5 rounded-xl text-xs font-medium">
              <PhoneOff className="w-4 h-4 text-amber-600 flex-shrink-0" />
              <span>
                <strong>Perlindungan Privasi Data Warga:</strong> Nomor HP dan kontak pribadi disembunyikan pada tampilan Portal Publik Warga Jemaat.
              </span>
            </div>

            {/* Rayon Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {(() => {
                const dynamicRayonList =
                  lingkunganList.length > 0
                    ? lingkunganList.map((l) => l.nama)
                    : Array.from(new Set(wargaJemaatList.map((w) => w.rayon).filter(Boolean))).length > 0
                    ? Array.from(new Set(wargaJemaatList.map((w) => w.rayon).filter(Boolean)))
                    : [
                        'Lingkungan I - Ebenezer',
                        'Lingkungan II - Yerusalem',
                        'Lingkungan III - Bethel',
                        'Lingkungan IV - Sion',
                        'Lingkungan V - Filadelfia',
                      ];

                return dynamicRayonList.map((rayonName) => {
                  const safeRayonTarget = String(rayonName || '').toLowerCase();
                  const members = wargaJemaatList.filter((w) => {
                    const safeWargaRayon = String(w.rayon || '').toLowerCase();
                    return (
                      w.rayon === rayonName ||
                      (safeWargaRayon && safeRayonTarget && safeWargaRayon === safeRayonTarget) ||
                      (safeWargaRayon && safeRayonTarget && safeWargaRayon.includes(safeRayonTarget))
                    );
                  });
                  const kks = new Set(members.map((w) => w.noKjj).filter(Boolean)).size;
                  const isSelected = selectedRayonFilter === rayonName;

                  return (
                    <button
                      key={rayonName}
                      type="button"
                      onClick={() => setSelectedRayonFilter(isSelected ? 'semua' : rayonName)}
                      className={`sensus-rayon-card p-4 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? 'sensus-rayon-card-selected bg-emerald-50 dark:bg-emerald-950/70 border-emerald-500 shadow-sm ring-2 ring-emerald-500/60'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-2xs'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span
                            className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                              isSelected
                                ? 'text-emerald-900 dark:text-emerald-300 bg-emerald-100/90 dark:bg-emerald-900/60'
                                : 'text-emerald-800 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200/60 dark:border-emerald-800/60'
                            }`}
                          >
                            Sektor Wilayah
                          </span>
                          {isSelected && (
                            <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/60 px-1.5 py-0.5 rounded">
                              Dipilih
                            </span>
                          )}
                        </div>
                        <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base leading-snug min-h-[40px] flex items-center">
                          {rayonName}
                        </h3>
                      </div>

                      <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800/90 grid grid-cols-2 gap-2">
                        <div className="stat-box rounded-lg p-2 text-center border">
                          <div className="stat-label text-[10px] font-medium whitespace-nowrap">
                            Total KK
                          </div>
                          <div className="stat-value text-base font-extrabold mt-0.5 font-mono">
                            {kks}{' '}
                            <span className="stat-unit text-[11px] font-bold">KK</span>
                          </div>
                        </div>
                        <div className="stat-box rounded-lg p-2 text-center border">
                          <div className="stat-label text-[10px] font-medium whitespace-nowrap">
                            Total Anggota
                          </div>
                          <div className="stat-value text-base font-extrabold mt-0.5 font-mono">
                            {members.length}{' '}
                            <span className="stat-unit text-[11px] font-bold">Jiwa</span>
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                });
              })()}
            </div>

            {/* Interactive Data Table with Filters */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs space-y-3">
              <div className="p-4 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-3">
                <div className="font-bold text-slate-900 dark:text-white text-xs flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span>Daftar Sensus Anggota Warga Jemaat</span>
                  {selectedRayonFilter !== 'semua' && (
                    <span className="bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 text-[10px] px-2 py-0.5 rounded-full font-semibold">
                      {selectedRayonFilter}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  {/* Search Bar */}
                  <div className="relative flex-1 sm:w-64">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                    <input
                      type="text"
                      placeholder="Cari nama atau No. KJJ..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500 font-medium"
                    />
                  </div>

                  {/* Rayon Selector Dropdown */}
                  <select
                    value={selectedRayonFilter}
                    onChange={(e) => setSelectedRayonFilter(e.target.value)}
                    className="py-1.5 px-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer"
                  >
                    <option value="semua">Semua Rayon / Lingkungan</option>
                    {(() => {
                      const dynamicRayonList =
                        lingkunganList.length > 0
                          ? lingkunganList.map((l) => l.nama)
                          : Array.from(new Set(wargaJemaatList.map((w) => w.rayon).filter(Boolean)));
                      return dynamicRayonList.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ));
                    })()}
                  </select>
                </div>
              </div>

              {/* Table Render */}
              <div className="overflow-x-auto w-full max-w-full">
                <table className="w-full min-w-[850px] text-xs text-left text-slate-700 dark:text-slate-200">
                  <thead className="bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-bold border-b border-slate-200 dark:border-slate-800 uppercase text-[11px] whitespace-nowrap">
                    <tr>
                      <th className="p-3 w-12 text-center">No</th>
                      <th className="p-3">No. KJJ</th>
                      <th className="p-3">Nama Lengkap</th>
                      <th className="p-3 text-center">L/P</th>
                      <th className="p-3">Hubungan Keluarga</th>
                      <th className="p-3">Rayon Pelayanan</th>
                      <th className="p-3 text-center">Baptis / Sidi</th>
                      <th className="p-3 text-center">Status HP</th>
                      <th className="p-3 text-center">Keanggotaan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {(() => {
                      const safeSearchQ = (searchQuery || '').toLowerCase().trim();
                      const safeSelectedRayon = String(selectedRayonFilter || '').toLowerCase();
                      const filteredData = wargaJemaatList.filter((w) => {
                        const safeWargaRayon = String(w.rayon || '').toLowerCase();
                        const matchRayon =
                          selectedRayonFilter === 'semua' ||
                          w.rayon === selectedRayonFilter ||
                          (safeWargaRayon && safeSelectedRayon && safeWargaRayon === safeSelectedRayon) ||
                          (safeWargaRayon && safeSelectedRayon && safeWargaRayon.includes(safeSelectedRayon));
                        const matchSearch =
                          safeSearchQ === '' ||
                          (w.namaLengkap || '').toLowerCase().includes(safeSearchQ) ||
                          (w.noKjj || '').toLowerCase().includes(safeSearchQ);
                        return matchRayon && matchSearch;
                      });

                      if (filteredData.length === 0) {
                        return (
                          <tr>
                            <td colSpan={9} className="p-8 text-center text-slate-400 italic">
                              Tidak ada data warga jemaat yang sesuai dengan pencarian.
                            </td>
                          </tr>
                        );
                      }

                      return filteredData.map((item, idx) => (
                        <tr key={item.id} className="sensus-table-row transition-colors">
                          <td className="p-3 text-center font-mono text-slate-500 dark:text-slate-400">{idx + 1}</td>
                          <td className="p-3 font-mono text-[11px] font-bold text-slate-900 dark:text-slate-100 cell-no-kjj">
                            {item.noKjj}
                          </td>
                          <td className="p-3 font-bold text-slate-900 dark:text-white cell-nama">{item.namaLengkap}</td>
                          <td className="p-3 text-center font-bold text-slate-800 dark:text-slate-200">{item.jenisKelamin}</td>
                          <td className="p-3 font-medium text-slate-700 dark:text-slate-200 cell-hub">
                            {item.hubunganKeluarga || '-'}
                          </td>
                          <td className="p-3 font-medium text-slate-800 dark:text-slate-200 cell-rayon">{item.rayon}</td>
                          <td className="p-3 text-center">
                            <div className="inline-flex gap-1">
                              <span
                                className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                                  item.statusBaptis
                                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                                    : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                                }`}
                              >
                                {item.statusBaptis ? 'Baptis' : '-'}
                              </span>
                              <span
                                className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                                  item.statusSidi
                                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                                    : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                                }`}
                              >
                                {item.statusSidi ? 'Sidi' : '-'}
                              </span>
                            </div>
                          </td>
                          <td className="p-3 text-center">
                            <span
                              className="inline-flex items-center gap-1 text-[10px] text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 px-2 py-0.5 rounded font-medium"
                              title="Nomor HP disembunyikan untuk privasi portal publik"
                            >
                              <PhoneOff className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                              <span>Privasi</span>
                            </span>
                          </td>
                          <td className="p-3 text-center">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                item.statusKeanggotaan === 'Aktif'
                                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700'
                                  : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                              }`}
                            >
                              {item.statusKeanggotaan}
                            </span>
                          </td>
                        </tr>
                      ));
                    })()}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 8: KARTU KELUARGA JEMAAT (KKJ) & CETAK */}
        {activePortalTab === 'kartu_keluarga' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-xs space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-4">
                <div>
                  <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
                    <GitFork className="w-5 h-5 text-emerald-600" />
                    Pencetakan Kartu Keluarga Jemaat (KKJ) & Silsilah Keluarga
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Role Warga: Pilih atau masukkan Nomor Kartu Keluarga (KJJ) untuk melihat susunan silsilah (Kepala Keluarga, Istri, Anak) dan mencetak dokumen resmi.
                  </p>
                </div>

                <button
                  onClick={() =>
                    openPrintReport({
                      reportType: 'kartu_keluarga_jemaat',
                      noKjj: selectedKjjInput,
                    })
                  }
                  className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-all shadow-md hover:-translate-y-0.5 active:translate-y-0"
                >
                  <Printer className="w-4 h-4" />
                  <span>Cetak Lembar Resmi KKJ (PDF)</span>
                </button>
              </div>

              {/* Input KJJ Selector */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Pilih / Masukkan Nomor Kartu Keluarga Jemaat (No. KJJ):
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <select
                    value={selectedKjjInput || ''}
                    onChange={(e) => setSelectedKjjInput(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {Array.from(new Set(wargaJemaatList.map((w) => w.noKjj))).map((kjj) => {
                      const kepala = wargaJemaatList.find(
                        (w) => w.noKjj === kjj && w.hubunganKeluarga === 'Kepala Keluarga'
                      ) || wargaJemaatList.find((w) => w.noKjj === kjj);
                      return (
                        <option key={kjj} value={kjj}>
                          {kjj} — {kepala?.namaLengkap || 'Keluarga'}
                        </option>
                      );
                    })}
                  </select>

                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="Atau ketik No. KJJ manual (cth: KJJ-0101-0021)..."
                      value={selectedKjjInput || ''}
                      onChange={(e) => setSelectedKjjInput(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              </div>

              {/* Family Lineage Display */}
              {(() => {
                const familyMembers = wargaJemaatList.filter((w) => w.noKjj === selectedKjjInput);
                const kepalaKeluarga = familyMembers.find((f) => f.hubunganKeluarga === 'Kepala Keluarga') || familyMembers[0];
                const istri = familyMembers.find((f) => f.hubunganKeluarga === 'Istri');
                const anakList = familyMembers.filter((f) => f.hubunganKeluarga === 'Anak');

                if (familyMembers.length === 0) {
                  return (
                    <div className="p-8 text-center text-slate-500 italic bg-amber-50 rounded-xl border border-amber-200">
                      Nomor KJJ "<strong>{selectedKjjInput}</strong>" tidak ditemukan dalam database jemaat. Silakan periksa kembali nomor KJJ Anda.
                    </div>
                  );
                }

                return (
                  <div className="space-y-6 pt-2">
                    {/* Header Details Card */}
                    <div className="bg-slate-900 text-white rounded-xl p-5 border border-slate-800 shadow-sm space-y-2 font-sans text-xs">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <p className="text-slate-400 font-semibold uppercase text-[10px]">Nomor KKJ</p>
                          <p className="font-mono font-bold text-emerald-400 text-sm">{selectedKjjInput}</p>
                          <p className="text-slate-400 font-semibold uppercase text-[10px] pt-1">Kepala Keluarga</p>
                          <p className="font-bold text-white text-sm">{kepalaKeluarga?.namaLengkap}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-slate-400 font-semibold uppercase text-[10px]">Lingkungan / Alamat</p>
                          <p className="font-medium text-slate-200">{kepalaKeluarga?.rayon}</p>
                          <p className="text-slate-300 italic">{kepalaKeluarga?.alamat}</p>
                          <p className="text-emerald-400 font-bold pt-1">
                            Total: {familyMembers.length} Jiwa (1 Kepala Keluarga, {istri ? '1 Istri' : '0 Istri'}, {anakList.length} Anak)
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Visual Silsilah Tree Diagram */}
                    <div className="bg-slate-50 border border-slate-300 rounded-xl p-5 space-y-4">
                      <h4 className="text-center font-bold text-slate-900 uppercase text-xs tracking-wider border-b border-slate-300 pb-2">
                        Bagan Silsilah Hubungan Keluarga
                      </h4>

                      {/* Parent level */}
                      <div className="flex flex-wrap items-center justify-center gap-6">
                        {/* Kepala Keluarga */}
                        <div className="bg-blue-50 dark:bg-blue-950/60 border-2 border-blue-600 dark:border-blue-400 rounded-xl p-3 text-center min-w-[200px] shadow-xs">
                          <span className="badge-white-text badge-silsilah-kk text-[9px] font-black uppercase tracking-wider bg-blue-700 text-white px-2.5 py-0.5 rounded inline-block mb-1 shadow-2xs">
                            Kepala Keluarga
                          </span>
                          <p className="font-bold text-blue-950 dark:text-blue-100 text-xs">{kepalaKeluarga?.namaLengkap || 'Belum Terdaftar'}</p>
                          <p className="text-[10px] text-slate-600 dark:text-slate-400 font-mono mt-0.5 font-medium">NIK: {kepalaKeluarga?.nik || '-'}</p>
                          <div className="text-[9px] text-slate-700 dark:text-slate-300 mt-1 flex justify-center gap-2 font-semibold">
                            <span className={kepalaKeluarga?.statusBaptis ? 'text-emerald-700 dark:text-emerald-400 font-bold' : 'text-slate-500'}>
                              {kepalaKeluarga?.statusBaptis ? '✓ Baptis' : 'Belum Baptis'}
                            </span>
                            <span>•</span>
                            <span className={kepalaKeluarga?.statusSidi ? 'text-indigo-700 dark:text-indigo-400 font-bold' : 'text-slate-500'}>
                              {kepalaKeluarga?.statusSidi ? '✓ Sidi' : 'Belum Sidi'}
                            </span>
                          </div>
                        </div>

                        {/* Connection */}
                        {istri && (
                          <div className="text-slate-400 text-xs font-bold font-mono">
                            <span className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 px-3 py-1 rounded-full text-[10px] text-purple-700 dark:text-purple-300 shadow-2xs font-semibold">
                              💍 Suami & Istri
                            </span>
                          </div>
                        )}

                        {/* Istri */}
                        {istri && (
                          <div className="bg-purple-50 dark:bg-purple-950/60 border-2 border-purple-600 dark:border-purple-400 rounded-xl p-3 text-center min-w-[200px] shadow-xs">
                            <span className="badge-white-text badge-silsilah-istri text-[9px] font-black uppercase tracking-wider bg-purple-700 text-white px-2.5 py-0.5 rounded inline-block mb-1 shadow-2xs">
                              Istri
                            </span>
                            <p className="font-bold text-purple-950 dark:text-purple-100 text-xs">{istri.namaLengkap}</p>
                            <p className="text-[10px] text-slate-600 dark:text-slate-400 font-mono mt-0.5 font-medium">NIK: {istri.nik || '-'}</p>
                            <div className="text-[9px] text-slate-700 dark:text-slate-300 mt-1 flex justify-center gap-2 font-semibold">
                              <span className={istri.statusBaptis ? 'text-emerald-700 dark:text-emerald-400 font-bold' : 'text-slate-500'}>
                                {istri.statusBaptis ? '✓ Baptis' : 'Belum Baptis'}
                              </span>
                              <span>•</span>
                              <span className={istri.statusSidi ? 'text-indigo-700 dark:text-indigo-400 font-bold' : 'text-slate-500'}>
                                {istri.statusSidi ? '✓ Sidi' : 'Belum Sidi'}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Children level */}
                      {anakList.length > 0 && (
                        <div className="pt-3 border-t border-dashed border-slate-300 dark:border-slate-700">
                          <p className="text-center text-[10px] font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-widest mb-3">
                            Anak-Anak Kandung Dalam Kartu Keluarga ({anakList.length} Orang)
                          </p>
                          <div className="flex flex-wrap justify-center gap-4">
                            {anakList.map((anak, idx) => (
                              <div
                                key={anak.id}
                                className="bg-emerald-50 dark:bg-emerald-950/60 border-2 border-emerald-600 dark:border-emerald-400 rounded-xl p-3 text-center min-w-[170px] shadow-2xs"
                              >
                                <span className="badge-white-text badge-silsilah-anak text-[8px] font-black uppercase tracking-wider bg-emerald-700 text-white px-2 py-0.5 rounded inline-block mb-1 shadow-2xs">
                                  Anak Ke-{idx + 1}
                                </span>
                                <p className="font-bold text-emerald-950 dark:text-emerald-100 text-xs">{anak.namaLengkap}</p>
                                <p className="text-[10px] text-slate-600 dark:text-slate-400 font-mono mt-0.5 font-medium">Tgl Lahir: {anak.tanggalLahir || '-'}</p>
                                <p className="text-[10px] text-slate-700 dark:text-slate-300 font-semibold">{anak.pekerjaan || '-'}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Family Members Table */}
                    <div className="overflow-x-auto w-full max-w-full border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 shadow-sm">
                      <table className="w-full min-w-[750px] text-xs text-left text-slate-800 dark:text-slate-100">
                        <thead className="bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-bold border-b border-slate-200 dark:border-slate-800 uppercase text-[10px] whitespace-nowrap">
                          <tr>
                            <th className="p-3 w-8 text-center">No</th>
                            <th className="p-3">Nama Lengkap</th>
                            <th className="p-3 font-mono">NIK</th>
                            <th className="p-3 text-center">L/P</th>
                            <th className="p-3">Tempat, Tgl Lahir</th>
                            <th className="p-3">Hub. Keluarga</th>
                            <th className="p-3 text-center">Baptis</th>
                            <th className="p-3 text-center">Sidi</th>
                            <th className="p-3">Pekerjaan</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                          {familyMembers.map((item, idx) => (
                            <tr key={item.id} className="portal-kkj-row hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors">
                              <td className="p-3 text-center font-mono text-slate-500 dark:text-slate-400">{idx + 1}</td>
                              <td className="p-3 font-bold text-slate-900 dark:text-white">{item.namaLengkap}</td>
                              <td className="p-3 font-mono text-slate-600 dark:text-slate-300 text-[11px]">{item.nik || '-'}</td>
                              <td className="p-3 text-center font-bold text-slate-800 dark:text-slate-100">{item.jenisKelamin}</td>
                              <td className="p-3 font-medium text-slate-700 dark:text-slate-200">
                                {item.tempatLahir}, {item.tanggalLahir}
                              </td>
                              <td className="p-3 font-bold text-blue-900 dark:text-blue-400 text-hub-keluarga">{item.hubunganKeluarga}</td>
                              <td className="p-3 text-center">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${item.statusBaptis ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700'}`}>
                                  {item.statusBaptis ? 'Ya' : 'Belum'}
                                </span>
                              </td>
                              <td className="p-3 text-center">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${item.statusSidi ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/80 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-700' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700'}`}>
                                  {item.statusSidi ? 'Ya' : 'Belum'}
                                </span>
                              </td>
                              <td className="p-3 text-slate-700 dark:text-slate-200">{item.pekerjaan || '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {/* TAB 9: FORM PENDAFTARAN ANGGOTA JEMAAT BARU */}
        {activePortalTab === 'pendaftaran' && (
          <div className="space-y-6">
            {/* Header Description Card */}
            <div className="portal-dark-card bg-gradient-to-r from-blue-900 to-indigo-900 !text-white text-white rounded-2xl p-6 border border-blue-700/60 shadow-md space-y-3" style={{ background: 'linear-gradient(135deg, #1e3a8a 0%, #1e1b4b 100%)', color: '#ffffff' }}>
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-500/20 border border-blue-400/30 rounded-xl text-blue-300">
                  <UserPlus className="w-6 h-6 text-blue-300" />
                </div>
                <div>
                  <h3 className="banner-title font-bold text-lg !text-white text-white" style={{ color: '#ffffff', WebkitTextFillColor: '#ffffff' }}>
                    Formulir Pendaftaran Digital Anggota Jemaat Baru GKE
                  </h3>
                  <p className="text-xs !text-blue-200 text-blue-200 mt-0.5 font-medium" style={{ color: '#bfdbfe', WebkitTextFillColor: '#bfdbfe' }}>
                    Gereja Kalimantan Evangelis (GKE) - Majelis Jemaat {formattedMajelisJemaat}
                  </p>
                </div>
              </div>
              <p className="text-xs sm:text-sm !text-slate-200 text-slate-200 leading-relaxed text-justify" style={{ color: '#e2e8f0', WebkitTextFillColor: '#e2e8f0' }}>
                Selamat datang di Gereja Kalimantan Evangelis! Silakan isi formulir di bawah ini dengan data yang benar dan sah. 
                Data pendaftaran ini akan langsung diteruskan ke Sekretariat MPH Majelis Jemaat {formattedMajelisJemaat} untuk diverifikasi dan dimasukkan ke dalam Buku Induk Sensus Warga Jemaat GKE.
              </p>
            </div>

            {/* Success Alert Banner */}
            {showPendaftaranSuccess && (
              <div className="bg-emerald-50 border-2 border-emerald-500 text-emerald-900 p-4 rounded-xl shadow-md flex items-start justify-between gap-3 animate-fade-in">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-6 h-6 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <h4 className="font-bold text-sm text-emerald-950">
                      Pendaftaran Berhasil Dikirim!
                    </h4>
                    <p className="text-xs text-emerald-800">
                      Terima kasih, data Anda telah berhasil dikirim. Pengurus MPH Majelis Jemaat {formattedMajelisJemaat} akan meninjau pendaftaran Anda. Status verifikasi dapat Anda pantau pada tabel pelacakan status di bawah.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowPendaftaranSuccess(false)}
                  className="text-emerald-700 hover:text-emerald-950 p-1 font-bold cursor-pointer"
                >
                  ✕
                </button>
              </div>
            )}

            {/* Main Registration Form */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
              <div className="border-b border-slate-200 pb-3">
                <h4 className="font-bold text-slate-900 text-sm uppercase tracking-wider flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-600" />
                  Isi Data Formulir Pendaftaran Warga Jemaat Baru
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  Pastikan semua informasi yang bertanda bintang (*) diisi dengan akurat.
                </p>
              </div>

              <form onSubmit={handlePendaftaranSubmit} className="space-y-6">
                {/* SECTION 1: IDENTITAS PRIBADI */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
                  <h5 className="font-bold text-xs text-blue-900 uppercase tracking-wider border-b pb-2 border-slate-200">
                    1. Identitas Pribadi Calon Warga Jemaat
                  </h5>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Nama Lengkap (dengan Gelar) *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Cth: Ir. Cornelis Rambang M.P."
                        value={pendaftaranFormData.namaLengkap || ''}
                        onChange={(e) =>
                          setPendaftaranFormData({ ...pendaftaranFormData, namaLengkap: e.target.value })
                        }
                        className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        NIK (Nomor Induk Kependudukan - 16 Digit) *
                      </label>
                      <input
                        type="text"
                        required
                        maxLength={16}
                        placeholder="Cth: 6271011504680001"
                        value={pendaftaranFormData.nik || ''}
                        onChange={(e) =>
                          setPendaftaranFormData({ ...pendaftaranFormData, nik: e.target.value })
                        }
                        className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Jenis Kelamin *
                      </label>
                      <select
                        value={pendaftaranFormData.jenisKelamin || 'L'}
                        onChange={(e) =>
                          setPendaftaranFormData({
                            ...pendaftaranFormData,
                            jenisKelamin: e.target.value as 'L' | 'P',
                          })
                        }
                        className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      >
                        <option value="L">Laki-Laki (L)</option>
                        <option value="P">Perempuan (P)</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Tempat Lahir *
                        </label>
                        <input
                          type="text"
                          required
                          value={pendaftaranFormData.tempatLahir || ''}
                          onChange={(e) =>
                            setPendaftaranFormData({ ...pendaftaranFormData, tempatLahir: e.target.value })
                          }
                          className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Tanggal Lahir *
                        </label>
                        <input
                          type="date"
                          required
                          value={pendaftaranFormData.tanggalLahir || ''}
                          onChange={(e) =>
                            setPendaftaranFormData({ ...pendaftaranFormData, tanggalLahir: e.target.value })
                          }
                          className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* SECTION 2: KEANGGOTAAN & GEREJA */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
                  <h5 className="font-bold text-xs text-blue-900 uppercase tracking-wider border-b pb-2 border-slate-200">
                    2. Data Keanggotaan & Gereja
                  </h5>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Nomor Kartu Keluarga Jemaat (No. KJJ)
                      </label>
                      <input
                        type="text"
                        value={pendaftaranFormData.noKjj || ''}
                        onChange={(e) =>
                          setPendaftaranFormData({ ...pendaftaranFormData, noKjj: e.target.value })
                        }
                        placeholder="KJJ-0101-xxxx"
                        className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono font-bold text-blue-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                      <span className="text-[10px] text-slate-500 mt-1 block">
                        Gunakan nomor KJJ keluarga jika bergabung dengan keluarga yang sudah terdaftar.
                      </span>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Lingkungan / Sektor Wilayah *
                      </label>
                      <select
                        value={pendaftaranFormData.rayon || ''}
                        onChange={(e) =>
                          setPendaftaranFormData({ ...pendaftaranFormData, rayon: e.target.value })
                        }
                        className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      >
                        {lingkunganList && lingkunganList.length > 0 ? (
                          lingkunganList
                            .filter((l) => l.status === 'Aktif')
                            .map((l) => (
                              <option key={l.id} value={l.nama}>
                                {l.nama} {l.wilayahSektor ? `(${l.wilayahSektor})` : ''}
                              </option>
                            ))
                        ) : (
                          <>
                            <option value="Lingkungan I - Ebenezer">Lingkungan I - Ebenezer</option>
                            <option value="Lingkungan II - Yerusalem">Lingkungan II - Yerusalem</option>
                            <option value="Lingkungan III - Bethel">Lingkungan III - Bethel</option>
                            <option value="Lingkungan IV - Sion">Lingkungan IV - Sion</option>
                            <option value="Lingkungan V - Filadelfia">Lingkungan V - Filadelfia</option>
                            <option value="Lingkungan VI - Nazaret">Lingkungan VI - Nazaret</option>
                          </>
                        )}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Hubungan Dalam Keluarga *
                      </label>
                      <select
                        value={pendaftaranFormData.hubunganKeluarga || 'Kepala Keluarga'}
                        onChange={(e) =>
                          setPendaftaranFormData({
                            ...pendaftaranFormData,
                            hubunganKeluarga: e.target.value as any,
                          })
                        }
                        className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      >
                        <option value="Kepala Keluarga">Kepala Keluarga</option>
                        <option value="Istri">Istri</option>
                        <option value="Anak">Anak</option>
                        <option value="Famili Lain">Famili Lain</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Status Keanggotaan
                      </label>
                      <select
                        value={pendaftaranFormData.statusKeanggotaan || 'Tetap'}
                        onChange={(e) =>
                          setPendaftaranFormData({
                            ...pendaftaranFormData,
                            statusKeanggotaan: e.target.value as any,
                          })
                        }
                        className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      >
                        <option value="Tetap">Tetap</option>
                        <option value="Titipan">Titipan / Tamu</option>
                        <option value="Pindah">Pindah / Atestasi Masuk</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Status Pernikahan
                      </label>
                      <select
                        value={pendaftaranFormData.statusNikah || 'Belum Menikah'}
                        onChange={(e) =>
                          setPendaftaranFormData({
                            ...pendaftaranFormData,
                            statusNikah: e.target.value as any,
                          })
                        }
                        className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      >
                        <option value="Belum Menikah">Belum Menikah</option>
                        <option value="Menikah">Menikah</option>
                        <option value="Janda">Janda</option>
                        <option value="Duda">Duda</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-6 pt-3">
                      <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-800">
                        <input
                          type="checkbox"
                          checked={pendaftaranFormData.statusBaptis}
                          onChange={(e) =>
                            setPendaftaranFormData({
                              ...pendaftaranFormData,
                              statusBaptis: e.target.checked,
                            })
                          }
                          className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                        />
                        <span>Sudah Baptis Kudus</span>
                      </label>

                      <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-800">
                        <input
                          type="checkbox"
                          checked={pendaftaranFormData.statusSidi}
                          onChange={(e) =>
                            setPendaftaranFormData({
                              ...pendaftaranFormData,
                              statusSidi: e.target.checked,
                            })
                          }
                          className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                        />
                        <span>Sudah Sidi</span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* SECTION 3: KONTAK, DOMISILI & ATANAN */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
                  <h5 className="font-bold text-xs text-blue-900 uppercase tracking-wider border-b pb-2 border-slate-200">
                    3. Kontak, Domisili & Lampiran Surat Atestasi
                  </h5>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Pekerjaan / Profesi
                      </label>
                      <input
                        type="text"
                        placeholder="Cth: PNS / Guru / Swasta / Mahasiswa"
                        value={pendaftaranFormData.pekerjaan || ''}
                        onChange={(e) =>
                          setPendaftaranFormData({ ...pendaftaranFormData, pekerjaan: e.target.value })
                        }
                        className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Nomor Telepon / HP / WhatsApp *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Cth: 081255667788"
                        value={pendaftaranFormData.noHp || ''}
                        onChange={(e) =>
                          setPendaftaranFormData({ ...pendaftaranFormData, noHp: e.target.value })
                        }
                        className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Alamat Lengkap Domisili Saat Ini *
                      </label>
                      <textarea
                        required
                        rows={2}
                        placeholder="Cth: Jl. RTA Milono Km 2.5 No. 14, Kel. Langkai, Palangka Raya"
                        value={pendaftaranFormData.alamat || ''}
                        onChange={(e) =>
                          setPendaftaranFormData({ ...pendaftaranFormData, alamat: e.target.value })
                        }
                        className="w-full bg-white border border-slate-300 rounded-lg p-3 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Catatan Tambahan / Gereja Asal / Nomor Surat Atestasi Pindah
                      </label>
                      <textarea
                        rows={2}
                        placeholder="Cth: Pindahan dari Jemaat GKE Banjarmasin, Surat Atestasi No. 12/GKE/2026 Terlampir"
                        value={pendaftaranFormData.catatanTambahan || ''}
                        onChange={(e) =>
                          setPendaftaranFormData({
                            ...pendaftaranFormData,
                            catatanTambahan: e.target.value,
                          })
                        }
                        className="w-full bg-white border border-slate-300 rounded-lg p-3 text-xs font-medium text-slate-700 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white font-extrabold py-3.5 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 text-sm uppercase tracking-wider"
                >
                  <Send className="w-4 h-4" />
                  <span>Kirim Formulir Pendaftaran Anggota Jemaat Baru</span>
                </button>
              </form>
            </div>

            {/* STATUS TRACKING TABLE */}
            <div id="tracking-pendaftaran-section" className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm uppercase tracking-wider flex items-center gap-2">
                    <Clock className="w-4 h-4 text-blue-600" />
                    Lacak Status Pendaftaran Anggota Jemaat Baru
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Cari berdasarkan Nama atau NIK untuk memeriksa status verifikasi oleh MPH Majelis Jemaat {formattedMajelisJemaat}.
                  </p>
                </div>

                <div className="relative w-full sm:w-64">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Cari NIK / Nama..."
                    value={pendaftaranSearch}
                    onChange={(e) => setPendaftaranSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="overflow-x-auto w-full max-w-full border border-slate-200 dark:border-slate-800 rounded-xl">
                <table className="pendaftaran-tracking-table w-full min-w-[800px] text-xs text-left">
                  <thead className="bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-bold border-b border-slate-200 dark:border-slate-800 uppercase text-[10px] whitespace-nowrap">
                    <tr>
                      <th className="p-3 text-center w-8">No</th>
                      <th className="p-3 font-mono">Tgl Daftar</th>
                      <th className="p-3">Nama Lengkap</th>
                      <th className="p-3 font-mono">NIK</th>
                      <th className="p-3">Rayon</th>
                      <th className="p-3">Hubungan</th>
                      <th className="p-3 text-center">Status Verifikasi MPH</th>
                      <th className="p-3">Catatan MPH</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {pendaftaranList.filter(
                      (p) =>
                        (p.namaLengkap || '').toLowerCase().includes(pendaftaranSearch.toLowerCase()) ||
                        (p.nik || '').includes(pendaftaranSearch) ||
                        (p.noKjj || '').toLowerCase().includes(pendaftaranSearch.toLowerCase())
                    ).length === 0 ? (
                      <tr>
                        <td colSpan={8} className="p-6 text-center text-slate-500 dark:text-slate-400 italic">
                          Belum ada data pendaftaran ditemukan.
                        </td>
                      </tr>
                    ) : (
                      pendaftaranList
                        .filter(
                          (p) =>
                            (p.namaLengkap || '').toLowerCase().includes(pendaftaranSearch.toLowerCase()) ||
                            (p.nik || '').includes(pendaftaranSearch) ||
                            (p.noKjj || '').toLowerCase().includes(pendaftaranSearch.toLowerCase())
                        )
                        .map((item, idx) => (
                          <tr key={item.id} className="pendaftaran-tracking-row transition-colors">
                            <td className="p-3 text-center font-mono text-cell-no font-bold">{idx + 1}</td>
                            <td className="p-3 font-mono text-cell-tgl text-[11px] font-semibold">
                              {item.tanggalDaftar}
                            </td>
                            <td className="p-3 font-bold text-cell-nama text-xs">{item.namaLengkap}</td>
                            <td className="p-3 font-mono text-cell-nik text-[11px] font-semibold">{item.nik}</td>
                            <td className="p-3 font-medium text-cell-rayon">{item.rayon}</td>
                            <td className="p-3 font-semibold text-cell-hubungan">{item.hubunganKeluarga}</td>
                            <td className="p-3 text-center">
                              {item.statusKonfirmasiMPH === 'Disetujui' && (
                                <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 font-bold px-2.5 py-1 rounded-lg text-[10px]">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                                  <span>Disetujui MPH</span>
                                </span>
                              )}
                              {item.statusKonfirmasiMPH === 'Ditolak' && (
                                <span className="inline-flex items-center gap-1 bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 border border-rose-300 dark:border-rose-700 font-bold px-2.5 py-1 rounded-lg text-[10px]">
                                  <XCircle className="w-3 h-3 text-rose-600 dark:text-rose-400" />
                                  <span>Ditolak</span>
                                </span>
                              )}
                              {item.statusKonfirmasiMPH === 'Menunggu Konfirmasi' && (
                                <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-900 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300 dark:border-amber-700 font-bold px-2.5 py-1 rounded-lg text-[10px]">
                                  <Clock className="w-3 h-3 text-amber-700 dark:text-amber-400" />
                                  <span>Menunggu Konfirmasi</span>
                                </span>
                              )}
                            </td>
                            <td className="p-3 text-[11px] italic text-cell-catatan">
                              {item.catatanMPH || '-'}
                            </td>
                          </tr>
                        ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB: NOTIFIKASI & STATUS VERIFIKASI PERSEMBAHAN */}
        {activePortalTab === 'notifikasi_persembahan' && (
          <div className="space-y-6">
            {/* Header Banner */}
            <div className="portal-dark-card bg-gradient-to-r from-amber-950 via-slate-900 to-slate-950 !text-white text-white p-6 rounded-2xl shadow-lg border border-amber-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-extrabold uppercase border border-amber-400/30">
                  <Bell className="w-3 h-3 text-amber-300" /> System Notifikasi & Status Verifikasi Resi
                </span>
                <h2 className="banner-title text-xl md:text-2xl font-extrabold font-serif !text-white text-white" style={{ color: '#ffffff' }}>
                  Status Verifikasi Persembahan Digital Warga Jemaat
                </h2>
                <p className="text-xs !text-slate-200 text-slate-200 max-w-2xl leading-relaxed" style={{ color: '#e2e8f0' }}>
                  Transparansi penuh pencatatan persembahan digital (QRIS, GoPay, Transfer Bank). Setiap bukti resi yang dikirimkan warga jemaat akan diverifikasi secara langsung oleh Tim Bendahara &amp; MPH Majelis Jemaat.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsSubmitResiOpen(true)}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs shadow-lg flex items-center gap-2 border border-emerald-400/30 active:scale-95 transition-all cursor-pointer"
                >
                  <Upload className="w-4 h-4 text-emerald-200" />
                  <span>Unggah / Kirim Bukti Resi Baru</span>
                </button>
              </div>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Total Pengiriman Bukti</span>
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-black text-slate-900 font-mono">{allPersembahanResi.length}</h3>
                  <FileText className="w-5 h-5 text-slate-400" />
                </div>
                <p className="text-[10px] text-slate-500">Total entri persembahan terdaftar</p>
              </div>

              <div className="bg-amber-50/80 p-4 rounded-2xl border border-amber-200 shadow-sm space-y-1">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-800">Menunggu Verifikasi</span>
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-black text-amber-900 font-mono">{pendingCount}</h3>
                  <Clock className="w-5 h-5 text-amber-600 animate-spin" />
                </div>
                <p className="text-[10px] text-amber-700 font-medium">Memerlukan peninjauan Bendahara</p>
              </div>

              <div className="bg-emerald-50/80 p-4 rounded-2xl border border-emerald-200 shadow-sm space-y-1">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800">Telah Diverifikasi</span>
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-black text-emerald-900 font-mono">{verifiedCount}</h3>
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                </div>
                <p className="text-[10px] text-emerald-700 font-medium">Sah &amp; dicatat di Buku Kas</p>
              </div>

              <div className="bg-rose-50/80 p-4 rounded-2xl border border-rose-200 shadow-sm space-y-1">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-rose-800">Ditolak / Perlu Perbaikan</span>
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-black text-rose-900 font-mono">{rejectedCount}</h3>
                  <XCircle className="w-5 h-5 text-rose-600" />
                </div>
                <p className="text-[10px] text-rose-700 font-medium">Bukti tidak sesuai / tidak valid</p>
              </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                {/* Status Filter Buttons */}
                <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => setNotifFilterStatus('semua')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all ${
                      notifFilterStatus === 'semua'
                        ? 'bg-slate-900 text-white shadow'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Semua Status ({allPersembahanResi.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setNotifFilterStatus('pending')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all flex items-center gap-1 ${
                      notifFilterStatus === 'pending'
                        ? 'bg-amber-500 text-slate-950 shadow'
                        : 'bg-amber-100/70 text-amber-900 hover:bg-amber-200/80'
                    }`}
                  >
                    <Clock className="w-3 h-3" />
                    <span>Menunggu ({pendingCount})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setNotifFilterStatus('disetujui')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all flex items-center gap-1 ${
                      notifFilterStatus === 'disetujui'
                        ? 'bg-emerald-600 text-white shadow'
                        : 'bg-emerald-100/70 text-emerald-900 hover:bg-emerald-200/80'
                    }`}
                  >
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Diverifikasi ({verifiedCount})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setNotifFilterStatus('ditolak')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all flex items-center gap-1 ${
                      notifFilterStatus === 'ditolak'
                        ? 'bg-rose-600 text-white shadow'
                        : 'bg-rose-100/70 text-rose-900 hover:bg-rose-200/80'
                    }`}
                  >
                    <XCircle className="w-3 h-3" />
                    <span>Ditolak ({rejectedCount})</span>
                  </button>
                </div>

                {/* Search input */}
                <div className="relative w-full sm:w-64">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Cari No. Ref / Nama / Kategori..."
                    value={notifSearch}
                    onChange={(e) => setNotifSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>
            </div>

            {/* Verification Status List Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-4 p-5">
              <div className="flex items-center justify-between">
                <h4 className="font-extrabold text-slate-900 text-sm uppercase tracking-wider flex items-center gap-2">
                  <Bell className="w-4 h-4 text-amber-600" />
                  Daftar Riwayat Notifikasi &amp; Status Verifikasi Resi
                </h4>
                <span className="text-[11px] text-slate-500 font-mono">
                  Menampilkan {filteredNotifList.length} data
                </span>
              </div>

              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full min-w-[850px] text-xs text-left text-slate-800">
                  <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-200 uppercase text-[10px] whitespace-nowrap">
                    <tr>
                      <th className="p-3 text-center w-10">No</th>
                      <th className="p-3 font-mono">No. Referensi</th>
                      <th className="p-3">Tanggal Transfer</th>
                      <th className="p-3">Kategori &amp; Pos Kas</th>
                      <th className="p-3 text-right">Nominal (Rp)</th>
                      <th className="p-3">Keterangan / Pengirim</th>
                      <th className="p-3 text-center">Status Verifikasi Bendahara</th>
                      <th className="p-3 text-center">Opsi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {filteredNotifList.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="p-8 text-center text-slate-500 italic">
                          Belum ada data konfirmasi resi ditemukan.
                        </td>
                      </tr>
                    ) : (
                      filteredNotifList.map((item, idx) => {
                        const isPending = item.status === 'pending' || item.disetujuiOleh?.includes('Menunggu');
                        const isVerified = item.status === 'disetujui' || (!item.status && !item.disetujuiOleh?.includes('Menunggu'));
                        const isRejected = item.status === 'ditolak';

                        return (
                          <tr key={item.id} className="hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors">
                            <td className="p-3 text-center font-mono text-slate-500">{idx + 1}</td>
                            <td className="p-3 font-mono font-bold text-slate-900">
                              {item.noReferensi || `-`}
                            </td>
                            <td className="p-3 font-mono text-slate-600 text-[11px]">
                              {item.tanggal}
                            </td>
                            <td className="p-3 space-y-0.5">
                              <div className="font-bold text-slate-900">{item.kategori}</div>
                              <span className="inline-block px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-semibold border border-slate-200">
                                {item.posKas || 'Kas Umum'}
                              </span>
                            </td>
                            <td className="p-3 text-right font-mono font-extrabold text-emerald-700 text-xs">
                              Rp {item.jumlah.toLocaleString('id-ID')}
                            </td>
                            <td className="p-3 max-w-xs text-slate-700 text-[11px] leading-snug">
                              {item.keterangan || '-'}
                            </td>
                            <td className="p-3 text-center">
                              {isPending && (
                                <div className="inline-flex flex-col items-center gap-1">
                                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-100 text-amber-900 border border-amber-300 font-extrabold text-[10px] shadow-sm animate-pulse">
                                    <Clock className="w-3.5 h-3.5 text-amber-700 animate-spin" />
                                    <span>MENUNGGU VERIFIKASI</span>
                                  </span>
                                  <span className="text-[9px] text-amber-700 font-mono">Dalam Peninjauan Bendahara</span>
                                  <a
                                    href={`https://wa.me/${(() => {
                                      const raw = (settings.noWhatsappAdmin || settings.gopayAccountNumber || '081255667788').replace(/\D/g, '');
                                      return raw.startsWith('0') ? '62' + raw.slice(1) : raw;
                                    })()}?text=${encodeURIComponent(
                                      `Syalom Bendahara/Pengurus ${settings.namaJemaat}, mohon bantuan verifikasi resi persembahan digital:\n` +
                                      `- No. Ref: ${item.noReferensi || '-'}\n` +
                                      `- Tanggal: ${item.tanggal}\n` +
                                      `- Kategori: ${item.kategori} (${item.posKas || 'Kas Umum'})\n` +
                                      `- Nominal: Rp ${item.jumlah.toLocaleString('id-ID')}\n` +
                                      `- Keterangan: ${item.keterangan || '-'}\n\n` +
                                      `Mohon bantuan Bapak/Ibu Bendahara untuk memverifikasi resi ini. Terima kasih! God bless.`
                                    )}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="mt-0.5 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-[10px] shadow flex items-center gap-1 transition-all active:scale-95 cursor-pointer"
                                    title="Hubungi Pengurus via WhatsApp untuk verifikasi"
                                  >
                                    <MessageCircle className="w-3 h-3 text-emerald-100" />
                                    <span>Hubungi Pengurus (WA)</span>
                                  </a>
                                </div>
                              )}

                              {isVerified && (
                                <div className="inline-flex flex-col items-center gap-0.5">
                                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-100 text-emerald-900 border border-emerald-300 font-extrabold text-[10px] shadow-sm">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                    <span>DIVERIFIKASI &amp; DICATAT</span>
                                  </span>
                                  <span className="text-[9px] text-emerald-700 font-mono">Disetujui: {item.disetujuiOleh || 'Bendahara'}</span>
                                </div>
                              )}

                              {isRejected && (
                                <div className="inline-flex flex-col items-center gap-1">
                                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-rose-100 text-rose-900 border border-rose-300 font-extrabold text-[10px] shadow-sm">
                                    <XCircle className="w-3.5 h-3.5 text-rose-600" />
                                    <span>DITOLAK / TIDAK VALID</span>
                                  </span>
                                  <a
                                    href={`https://wa.me/${(() => {
                                      const raw = (settings.noWhatsappAdmin || settings.gopayAccountNumber || '081255667788').replace(/\D/g, '');
                                      return raw.startsWith('0') ? '62' + raw.slice(1) : raw;
                                    })()}?text=${encodeURIComponent(
                                      `Syalom Bendahara/Pengurus ${settings.namaJemaat}, ingin menanyakan verifikasi resi persembahan yang belum valid (Ref: ${item.noReferensi || '-'}). Terima kasih.`
                                    )}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="mt-0.5 px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-[10px] shadow flex items-center gap-1 transition-all active:scale-95 cursor-pointer"
                                  >
                                    <MessageCircle className="w-3 h-3 text-rose-100" />
                                    <span>Tanya WA Admin</span>
                                  </a>
                                </div>
                              )}
                            </td>
                            <td className="p-3 text-center">
                              <button
                                type="button"
                                onClick={() => setSelectedReceiptForPrint(item)}
                                className="px-2.5 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white font-extrabold text-[10px] shadow flex items-center gap-1 mx-auto transition-all active:scale-95 cursor-pointer"
                              >
                                <Printer className="w-3 h-3" />
                                <span>{isVerified ? 'Cetak Resi' : 'Lihat Resi'}</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB: PERSEMBAHAN DIGITAL QRIS & GOPAY */}
        {(activePortalTab === 'persembahan_qris' || activePortalTab === 'persembahan_digital') && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Header Banner */}
            <div className="portal-dark-card bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 !text-white text-white p-6 sm:p-8 rounded-3xl shadow-xl border-2 border-emerald-500/40 relative overflow-hidden">
              <div className="absolute -right-10 -bottom-10 w-56 h-56 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
              <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div className="space-y-2 max-w-2xl">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/30 text-emerald-300 border border-emerald-400/40 text-xs font-black uppercase tracking-wider">
                      <QrCode className="w-3.5 h-3.5 text-emerald-300" />
                      QRIS Nasional &amp; e-Wallet Resmi
                    </span>
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-400/30 text-[11px] font-bold">
                      <ShieldCheck className="w-3 h-3 text-teal-300" />
                      Rekening Terverifikasi MPH GKE
                    </span>
                  </div>
                  <h2 className="banner-title text-2xl sm:text-3xl font-black font-serif !text-white text-white tracking-tight" style={{ color: '#ffffff' }}>
                    Persembahan Digital QRIS &amp; GoPay
                  </h2>
                  <p className="text-xs sm:text-sm !text-slate-200 text-slate-200 leading-relaxed" style={{ color: '#e2e8f0' }}>
                    Salurkan persembahan syukur, persepuluhan, dana pembangunan, dan persembahan ibadah secara mudah, cepat, dan transparan melalui seluruh aplikasi Mobile Banking dan Dompet Digital (e-Wallet).
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row md:flex-col gap-2.5 shrink-0 w-full md:w-auto">
                  <button
                    type="button"
                    onClick={() => setIsQrisModalOpen(true)}
                    className="px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 transition-all hover:scale-102 active:scale-98 cursor-pointer"
                  >
                    <Maximize2 className="w-4 h-4 text-slate-950" />
                    <span>Buka QRIS Layar Penuh</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsSubmitResiOpen(true);
                      setResiFormData({
                        ...resiFormData,
                        namaPengirim: digitalIsAnonim ? 'Hamba Allah / Anonim' : digitalNamaPengirim,
                        jumlah: digitalNominal,
                        kategori: digitalKategori,
                        posKas: digitalPosKas,
                        noHp: digitalNoHp,
                        catatan: digitalKeterangan,
                      });
                    }}
                    className="px-4 py-2.5 rounded-2xl bg-slate-900/90 hover:bg-slate-800 text-emerald-300 hover:text-white font-bold text-xs border border-emerald-500/40 flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <Upload className="w-4 h-4 text-emerald-400" />
                    <span>Kirim Konfirmasi Resi</span>
                  </button>
                </div>
              </div>

              {/* Supported Payment Channels Pill Badges */}
              <div className="mt-6 pt-4 border-t border-emerald-800/50 flex flex-wrap items-center gap-2 text-xs">
                <span className="text-slate-400 text-[11px] font-bold">Didukung oleh:</span>
                {['GoPay', 'OVO', 'DANA', 'ShopeePay', 'LinkAja', 'BCA Mobile', 'Livin by Mandiri', 'BRImo', 'BNI Mobile', 'Bank Kalteng / Semua Bank'].map((p) => (
                  <span
                    key={p}
                    className="px-2.5 py-1 rounded-lg bg-slate-950/70 border border-emerald-500/25 text-[10px] font-bold text-emerald-200"
                  >
                    {p}
                  </span>
                ))}
              </div>
            </div>

            {/* Interactive Grid: Form & Live QR Code */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column: Form Pengisian Persembahan */}
              <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm space-y-6">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                      <CreditCard className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-slate-900 text-base">
                        Formulir Persembahan Digital
                      </h3>
                      <p className="text-xs text-slate-500">
                        Sesuaikan kategori, pos kas tujuan, dan nominal persembahan Anda
                      </p>
                    </div>
                  </div>
                </div>

                {/* Metode Pembayaran Tab */}
                <div className="space-y-2">
                  <label className="block text-xs font-black text-slate-800 uppercase tracking-wider">
                    1. Pilih Saluran Persembahan:
                  </label>
                  <div className="grid grid-cols-3 gap-2 p-1 bg-slate-100 rounded-2xl">
                    <button
                      type="button"
                      onClick={() => setDigitalMethod('qris')}
                      className={`py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        digitalMethod === 'qris'
                          ? 'bg-white text-emerald-800 shadow-sm border border-emerald-300 font-extrabold'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <QrCode className="w-3.5 h-3.5 text-emerald-600" />
                      <span>QRIS Standar</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setDigitalMethod('gopay')}
                      className={`py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        digitalMethod === 'gopay'
                          ? 'bg-white text-sky-800 shadow-sm border border-sky-300 font-extrabold'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Smartphone className="w-3.5 h-3.5 text-sky-600" />
                      <span>GoPay / e-Wallet</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setDigitalMethod('bank')}
                      className={`py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        digitalMethod === 'bank'
                          ? 'bg-white text-indigo-800 shadow-sm border border-indigo-300 font-extrabold'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Landmark className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Transfer Bank</span>
                    </button>
                  </div>
                </div>

                {/* Kategori & Pos Kas */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-black text-slate-800 uppercase tracking-wider">
                      2. Kategori Persembahan:
                    </label>
                    <select
                      value={digitalKategori}
                      onChange={(e) => setDigitalKategori(e.target.value as any)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    >
                      <option value="Persembahan Minggu">Persembahan Minggu</option>
                      <option value="Persembahan Pembangunan">Persembahan Pembangunan</option>
                      <option value="Persepuluhan">Persepuluhan (10%)</option>
                      <option value="Persembahan Syukuran">Persembahan Syukuran</option>
                      <option value="Persembahan Bulanan">Persembahan Bulanan</option>
                      <option value="Persembahan Diakonia">Persembahan Diakonia (Kasih)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-black text-slate-800 uppercase tracking-wider">
                      3. Pos Kas Tujuan:
                    </label>
                    <select
                      value={digitalPosKas}
                      onChange={(e) => setDigitalPosKas(e.target.value as any)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    >
                      <option value="Kas Umum">Kas Umum</option>
                      <option value="Kas Pembangunan">Kas Pembangunan</option>
                      <option value="Kas Diakonia">Kas Diakonia</option>
                      <option value="Kas Pemuda">Kas Pemuda / Remaja</option>
                      <option value="Kas Sekolah Minggu">Kas Sekolah Minggu</option>
                    </select>
                  </div>
                </div>

                {/* Quick Nominal Selector */}
                <div className="space-y-2">
                  <label className="block text-xs font-black text-slate-800 uppercase tracking-wider">
                    4. Pilih Nominal Persembahan (Rp):
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[10000, 20000, 50000, 100000, 200000, 500000, 1000000].map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => {
                          setDigitalNominal(amt);
                          setDigitalCustomNominal('');
                        }}
                        className={`py-2.5 px-3 rounded-xl text-xs font-black font-mono transition-all cursor-pointer border ${
                          digitalNominal === amt && !digitalCustomNominal
                            ? 'bg-emerald-600 text-white border-emerald-700 shadow-md shadow-emerald-600/25 scale-102'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                        }`}
                      >
                        Rp {amt.toLocaleString('id-ID')}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => {
                        setDigitalCustomNominal('custom');
                      }}
                      className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                        digitalCustomNominal
                          ? 'bg-emerald-600 text-white border-emerald-700 shadow-md scale-102'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      Nominal Lain ✎
                    </button>
                  </div>

                  {digitalCustomNominal && (
                    <div className="mt-2 pt-2 border-t border-slate-100">
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">
                        Masukkan Nominal Bebas (Rp):
                      </label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-2.5 font-mono font-bold text-slate-400 text-xs">
                          Rp
                        </span>
                        <input
                          type="number"
                          min={1000}
                          step={1000}
                          value={digitalNominal || ''}
                          onChange={(e) => setDigitalNominal(Math.max(1000, Number(e.target.value)))}
                          placeholder="Masukkan nominal persembahan..."
                          className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border-2 border-emerald-500 rounded-xl text-sm font-mono font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Data Pengirim */}
                <div className="space-y-3 pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-black text-slate-800 uppercase tracking-wider">
                      5. Data Pengirim Persembahan:
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-emerald-800">
                      <input
                        type="checkbox"
                        checked={digitalIsAnonim}
                        onChange={(e) => {
                          setDigitalIsAnonim(e.target.checked);
                          if (e.target.checked) setDigitalNamaPengirim('Hamba Allah / Anonim');
                          else setDigitalNamaPengirim('');
                        }}
                        className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                      />
                      <span>Sebagai Hamba Allah (Anonim)</span>
                    </label>
                  </div>

                  {!digitalIsAnonim && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">
                          Nama Lengkap / Nama Keluarga *
                        </label>
                        <input
                          type="text"
                          required
                          value={digitalNamaPengirim || ''}
                          onChange={(e) => setDigitalNamaPengirim(e.target.value)}
                          placeholder="Cth: Kel. Bp. Yohanes"
                          className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">
                          No. WhatsApp (Untuk Notifikasi Resi)
                        </label>
                        <input
                          type="text"
                          value={digitalNoHp || ''}
                          onChange={(e) => setDigitalNoHp(e.target.value)}
                          placeholder="Cth: 081234567890"
                          className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                        />
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      Catatan / Pokok Doa (Opsional):
                    </label>
                    <input
                      type="text"
                      value={digitalKeterangan || ''}
                      onChange={(e) => setDigitalKeterangan(e.target.value)}
                      placeholder="Cth: Ucapan syukur kesembuhan anak, doa HUT pernikahan..."
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Trigger buttons */}
                <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      const ref = `GKE-QRIS-${Date.now().toString().slice(-6)}`;
                      setDigitalGeneratedRef(ref);
                      setDigitalActiveStep('qris_display');
                    }}
                    className="w-full sm:flex-1 py-3 px-5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all hover:scale-102 active:scale-98 cursor-pointer"
                  >
                    <QrCode className="w-4 h-4 text-emerald-200" />
                    <span>Perbarui Tampilan Kode QRIS (Pas Rp {digitalNominal.toLocaleString('id-ID')})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsQrisModalOpen(true)}
                    className="w-full sm:w-auto py-3 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Maximize2 className="w-3.5 h-3.5 text-slate-600" />
                    <span>Mode Popup</span>
                  </button>
                </div>
              </div>

              {/* Right Column: Live QRIS Display Card & Actions */}
              <div className="lg:col-span-5 space-y-5">
                {/* Live QRIS Card */}
                <div className="bg-gradient-to-b from-white to-slate-50 rounded-3xl p-6 border-2 border-emerald-400/60 shadow-xl space-y-4 text-center relative overflow-hidden">
                  {/* Top Seal */}
                  <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
                    <div className="text-left">
                      <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        QRIS Standar BI &amp; GPN
                      </span>
                      <h4 className="font-extrabold text-slate-900 text-sm mt-1 uppercase">
                        {settings.namaJemaat}
                      </h4>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
                      GKE
                    </div>
                  </div>

                  {/* QR Image Frame */}
                  <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-inner inline-block mx-auto max-w-[260px] w-full">
                    <img
                      src={getQrisImageSource(settings.qrisImageUrl, digitalNominal, digitalGeneratedRef || 'GKE-QRIS-LIVE')}
                      alt="QRIS Persembahan GKE"
                      className="w-full h-auto object-contain mx-auto rounded-lg"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=' + encodeURIComponent(`GKE:${settings.namaJemaat}:Rp${digitalNominal}`);
                      }}
                    />
                  </div>

                  {/* Info Summary */}
                  <div className="bg-emerald-50/80 rounded-2xl p-3.5 border border-emerald-200/80 text-xs space-y-1">
                    <p className="text-[10px] font-bold uppercase text-emerald-800">Nominal Persembahan:</p>
                    <p className="text-xl font-black font-mono text-emerald-950">
                      Rp {digitalNominal.toLocaleString('id-ID')}
                    </p>
                    <div className="pt-1 flex items-center justify-between text-[11px] text-slate-600 font-semibold border-t border-emerald-200/60">
                      <span>{digitalKategori}</span>
                      <span className="font-mono text-emerald-700 font-bold">{digitalPosKas}</span>
                    </div>
                  </div>

                  {/* Action Buttons underneath QRIS */}
                  <div className="space-y-2 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        const link = document.createElement('a');
                        link.href = getQrisImageSource(settings.qrisImageUrl, digitalNominal, digitalGeneratedRef || 'GKE-QRIS-LIVE');
                        link.download = `QRIS_Persembahan_${settings.namaJemaat.replace(/\s+/g, '_')}_Rp${digitalNominal}.png`;
                        link.click();
                      }}
                      className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Download Gambar QRIS</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const text = `=== PERSEMBAHAN DIGITAL GKE ===\nJemaat: ${settings.namaJemaat}\nKategori: ${digitalKategori}\nPos Kas: ${digitalPosKas}\nNominal: Rp ${digitalNominal.toLocaleString('id-ID')}\nPengirim: ${digitalIsAnonim ? 'Hamba Allah / Anonim' : digitalNamaPengirim}\nRef: ${digitalGeneratedRef || 'GKE-LIVE'}\nRekening BCA: 123-456-7890 (a.n Majelis GKE)\nRekening BRI: 0011-01-002233-50-1`;
                        navigator.clipboard.writeText(text);
                        setDigitalCopied('info');
                        setTimeout(() => setDigitalCopied(null), 2500);
                      }}
                      className="btn-salin-teks w-full py-2 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-bold text-xs border border-slate-300 dark:border-slate-600 flex items-center justify-center gap-2 transition-all cursor-pointer shadow-2xs"
                    >
                      {digitalCopied === 'info' ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          <span className="text-emerald-700 dark:text-emerald-300 font-black">Data Tersalin!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-slate-700 dark:text-slate-200 shrink-0" />
                          <span className="text-slate-900 dark:text-white font-bold">Salin Info Persembahan</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsSubmitResiOpen(true);
                        setResiFormData({
                          ...resiFormData,
                          namaPengirim: digitalIsAnonim ? 'Hamba Allah / Anonim' : digitalNamaPengirim,
                          jumlah: digitalNominal,
                          kategori: digitalKategori,
                          posKas: digitalPosKas,
                          noHp: digitalNoHp,
                          catatan: digitalKeterangan,
                        });
                      }}
                      className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                      <span>Saya Sudah Bayar (Konfirmasi Resi)</span>
                    </button>
                  </div>
                </div>

                {/* Rekening Bank Alternatif */}
                <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-3">
                  <div className="flex items-center gap-2 text-slate-900 font-black text-xs uppercase tracking-wider">
                    <Landmark className="w-4 h-4 text-indigo-600" />
                    <span>Rekening Resmi Transfer Bank Gereja</span>
                  </div>

                  <div className="space-y-2 text-xs">
                    {/* Bank 1 */}
                    <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-extrabold text-blue-900 bg-blue-100 px-2 py-0.5 rounded">
                          BANK BCA
                        </span>
                        <p className="font-mono font-black text-slate-900 text-sm mt-0.5">
                          {settings.bankAccountNumber || '123-456-7890'}
                        </p>
                        <p className="text-[10px] text-slate-500">
                          a.n. {settings.bankAccountName || settings.namaJemaat}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(settings.bankAccountNumber || '123-456-7890');
                          setDigitalCopied('bca');
                          setTimeout(() => setDigitalCopied(null), 2500);
                        }}
                        className="btn-salin-teks px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl text-[11px] font-bold text-slate-900 dark:text-white flex items-center gap-1 transition-all cursor-pointer shadow-2xs"
                      >
                        {digitalCopied === 'bca' ? (
                          <span className="text-emerald-700 dark:text-emerald-300 font-extrabold">Tersalin!</span>
                        ) : (
                          <>
                            <Copy className="w-3 h-3 text-slate-700 dark:text-slate-200 shrink-0" />
                            <span className="text-slate-900 dark:text-white font-bold">Salin No. Rek</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Bank 2 */}
                    <div className="p-3 bg-slate-50 dark:bg-slate-900/80 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-extrabold text-teal-900 dark:text-teal-300 bg-teal-100 dark:bg-teal-950/80 border border-teal-200 dark:border-teal-800 px-2 py-0.5 rounded">
                          BANK BRI / BANK KALTENG
                        </span>
                        <p className="font-mono font-black text-slate-900 dark:text-white text-sm mt-0.5">
                          {settings.gopayAccountNumber || '0011-01-002233-50-1'}
                        </p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400">
                          a.n. Majelis Jemaat GKE
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(settings.gopayAccountNumber || '0011-01-002233-50-1');
                          setDigitalCopied('bri');
                          setTimeout(() => setDigitalCopied(null), 2500);
                        }}
                        className="btn-salin-teks px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl text-[11px] font-bold text-slate-900 dark:text-white flex items-center gap-1 transition-all cursor-pointer shadow-2xs"
                      >
                        {digitalCopied === 'bri' ? (
                          <span className="text-emerald-700 dark:text-emerald-300 font-extrabold">Tersalin!</span>
                        ) : (
                          <>
                            <Copy className="w-3 h-3 text-slate-700 dark:text-slate-200 shrink-0" />
                            <span className="text-slate-900 dark:text-white font-bold">Salin No. Rek</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 4 Steps Guide Card */}
            <div className="portal-dark-card bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 !text-white text-white rounded-3xl p-6 sm:p-7 border border-emerald-500/30 space-y-4 shadow-xl">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-emerald-400" />
                <h3 className="banner-title font-black text-base !text-white text-white" style={{ color: '#ffffff' }}>
                  Panduan 4 Langkah Praktis Memberi Persembahan Digital
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                <div className="bg-slate-950/70 p-4 rounded-2xl border border-emerald-800/40 space-y-1.5">
                  <div className="w-7 h-7 rounded-lg bg-emerald-600/30 text-emerald-400 font-mono font-black flex items-center justify-center text-sm border border-emerald-500/40">
                    1
                  </div>
                  <h4 className="font-extrabold text-white">Buka Aplikasi e-Wallet / M-Banking</h4>
                  <p className="text-slate-300 text-[11px] leading-relaxed">
                    Buka aplikasi GoPay, OVO, DANA, BCA, Mandiri, BRI, BNI atau m-banking kesayangan Anda.
                  </p>
                </div>

                <div className="bg-slate-950/70 p-4 rounded-2xl border border-emerald-800/40 space-y-1.5">
                  <div className="w-7 h-7 rounded-lg bg-emerald-600/30 text-emerald-400 font-mono font-black flex items-center justify-center text-sm border border-emerald-500/40">
                    2
                  </div>
                  <h4 className="font-extrabold text-white">Pilih Menu "Scan QRIS"</h4>
                  <p className="text-slate-300 text-[11px] leading-relaxed">
                    Arahkan kamera ke layar ini atau unggah gambar QRIS yang telah diunduh dari galeri HP.
                  </p>
                </div>

                <div className="bg-slate-950/70 p-4 rounded-2xl border border-emerald-800/40 space-y-1.5">
                  <div className="w-7 h-7 rounded-lg bg-emerald-600/30 text-emerald-400 font-mono font-black flex items-center justify-center text-sm border border-emerald-500/40">
                    3
                  </div>
                  <h4 className="font-extrabold text-white">Konfirmasi Nama &amp; Nominal</h4>
                  <p className="text-slate-300 text-[11px] leading-relaxed">
                    Pastikan nama penerima tertulis <strong>{settings.namaJemaat} - GKE</strong> dan selesaikan pembayaran dengan PIN.
                  </p>
                </div>

                <div className="bg-slate-950/70 p-4 rounded-2xl border border-emerald-800/40 space-y-1.5">
                  <div className="w-7 h-7 rounded-lg bg-emerald-600/30 text-emerald-400 font-mono font-black flex items-center justify-center text-sm border border-emerald-500/40">
                    4
                  </div>
                  <h4 className="font-extrabold text-white">Konfirmasi &amp; Terima Resi Sah</h4>
                  <p className="text-slate-300 text-[11px] leading-relaxed">
                    Klik tombol "Kirim Resi" untuk mendapatkan bukti kuitansi resmi yang terverifikasi Bendahara Gereja.
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Links Footer Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center gap-2 text-xs text-slate-700 font-bold">
                <Bell className="w-4 h-4 text-amber-500" />
                <span>Ingin mengecek kuitansi persembahan sebelumnya?</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActivePortalTab('notifikasi_persembahan')}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Bell className="w-3.5 h-3.5" />
                  <span>Buka Notifikasi Status Resi →</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActivePortalTab('keuangan')}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Laporan Transparansi Kas Jemaat</span>
                </button>
              </div>
            </div>
          </div>
        )}

          {/* Footer Contact Person & Sekretariat Card for Warga Jemaat */}
          <footer className="mt-12 mb-4 bg-white dark:bg-slate-900/90 text-slate-800 dark:text-slate-300 rounded-3xl border border-slate-200 dark:border-slate-800/80 p-6 sm:p-7 shadow-sm dark:shadow-xl space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pb-6 border-b border-slate-200 dark:border-slate-800/80">
              {/* Col 1: Gereja, Logo Resmi MPH & Alamat */}
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 flex items-center justify-center shrink-0 overflow-hidden">
                    <img
                      src={settings.logoUrl || settings.logoGkeUrl || defaultGkeLogo}
                      alt="Logo Resmi GKE MPH"
                      className="w-full h-full object-contain"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = defaultGkeLogo;
                      }}
                    />
                  </div>
                  <div>
                    <h4 className="font-black text-slate-900 dark:text-white text-base sm:text-lg tracking-tight uppercase">
                      {settings.namaJemaat}
                    </h4>
                    <p className="text-xs text-blue-700 dark:text-blue-400 font-black uppercase tracking-wider">
                      {settings.resortGke}
                    </p>
                  </div>
                </div>
                <p className="text-xs text-slate-700 dark:text-slate-300 font-medium leading-relaxed flex items-start gap-2 pt-1">
                  <MapPin className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                  <span>{settings.alamatGereja}</span>
                </p>
              </div>

              {/* Col 2: Contact Persons Pengurus MPH */}
              <div className="space-y-3">
                <h5 className="font-black text-xs text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 flex items-center justify-center shrink-0">
                    <User className="w-3.5 h-3.5" />
                  </div>
                  <span>CONTACT PERSON &amp; PENGURUS MPH</span>
                </h5>
                <ul className="text-xs space-y-2 text-slate-800 dark:text-slate-200">
                  <li className="flex justify-between items-center bg-indigo-50/60 dark:bg-slate-950/70 hover:bg-indigo-50/90 dark:hover:bg-slate-950 px-3 py-2 rounded-xl border border-indigo-100/90 dark:border-slate-800 transition">
                    <span className="text-indigo-950 dark:text-indigo-300 text-xs font-bold">Ketua Majelis:</span>
                    <span className="font-black text-slate-900 dark:text-white text-xs">{settings.namaKetuaJemaat}</span>
                  </li>
                  <li className="flex justify-between items-center bg-indigo-50/60 dark:bg-slate-950/70 hover:bg-indigo-50/90 dark:hover:bg-slate-950 px-3 py-2 rounded-xl border border-indigo-100/90 dark:border-slate-800 transition">
                    <span className="text-indigo-950 dark:text-indigo-300 text-xs font-bold">Sekretaris Majelis:</span>
                    <span className="font-black text-slate-900 dark:text-white text-xs">{settings.namaSekretaris}</span>
                  </li>
                  <li className="flex justify-between items-center bg-indigo-50/60 dark:bg-slate-950/70 hover:bg-indigo-50/90 dark:hover:bg-slate-950 px-3 py-2 rounded-xl border border-indigo-100/90 dark:border-slate-800 transition">
                    <span className="text-indigo-950 dark:text-indigo-300 text-xs font-bold">Bendahara Majelis:</span>
                    <span className="font-black text-slate-900 dark:text-white text-xs">{settings.namaBendahara}</span>
                  </li>
                </ul>
              </div>

              {/* Col 3: Layanan Kontak & WhatsApp */}
              <div className="space-y-3">
                <h5 className="font-black text-xs text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0">
                    <Phone className="w-3.5 h-3.5" />
                  </div>
                  <span>LAYANAN INFORMASI &amp; RESI</span>
                </h5>
                <div className="space-y-2.5 text-xs">
                  <div className="bg-emerald-50 dark:bg-emerald-950/50 border-2 border-emerald-300 dark:border-emerald-700/60 p-3 rounded-2xl space-y-1 shadow-2xs">
                    <p className="text-[10px] text-emerald-900 dark:text-emerald-300 font-black uppercase tracking-wider">
                      TELEPON / WA LAYANAN:
                    </p>
                    <a
                      href={`https://wa.me/${settings.telepon.replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-emerald-800 dark:text-emerald-200 font-mono font-black text-sm flex items-center gap-2 hover:underline hover:text-emerald-900"
                    >
                      <Phone className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <span>{settings.telepon}</span>
                    </a>
                  </div>
                  <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 text-xs font-bold px-1">
                    <Mail className="w-4 h-4 text-slate-500 shrink-0" />
                    <span className="truncate">{settings.email}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between text-xs text-slate-600 dark:text-slate-400 gap-2 font-medium">
              <p className="font-bold">© 2026 {settings.namaJemaat} - System Warga Jemaat GKE</p>
              <p className="text-slate-500 dark:text-slate-500 text-[11px]">Layanan Informasi &amp; Transparansi Terintegrasi</p>
            </div>
          </footer>
        </div>
      </div>

      {/* MODAL: UNGGAH / KONFIRMASI RESI BUKTI PERSEMBAHAN BARU */}
      {isSubmitResiOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Upload className="w-5 h-5 text-emerald-400" />
                <div>
                  <h3 className="font-extrabold text-sm text-white">Unggah Bukti Resi Persembahan Digital</h3>
                  <p className="text-[11px] text-slate-400">Konfirmasi transfer ke Bendahara Majelis Jemaat</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsSubmitResiOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleResiSubmit} className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-slate-700 font-bold mb-1">Nama Pengirim Persembahan *</label>
                  <input
                    type="text"
                    required
                    placeholder="Cth: Kel. Bp. Antonius / Hamba Allah"
                    value={resiFormData.namaPengirim || ''}
                    onChange={(e) => setResiFormData({ ...resiFormData, namaPengirim: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Nominal Persembahan (Rp) *</label>
                  <input
                    type="number"
                    required
                    min={1000}
                    step={1000}
                    value={resiFormData.jumlah ?? ''}
                    onChange={(e) => setResiFormData({ ...resiFormData, jumlah: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-mono font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Tanggal Transfer *</label>
                  <input
                    type="date"
                    required
                    value={resiFormData.tanggal || ''}
                    onChange={(e) => setResiFormData({ ...resiFormData, tanggal: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-mono text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Kategori Persembahan</label>
                  <select
                    value={resiFormData.kategori || 'Persembahan Minggu'}
                    onChange={(e) => setResiFormData({ ...resiFormData, kategori: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    <option value="Persembahan Minggu">Persembahan Minggu</option>
                    <option value="Persembahan Pembangunan">Persembahan Pembangunan</option>
                    <option value="Persepuluhan">Persepuluhan</option>
                    <option value="Persembahan Syukuran">Persembahan Syukuran</option>
                    <option value="Persembahan Bulanan">Persembahan Bulanan</option>
                    <option value="Persembahan Diakonia">Persembahan Diakonia</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Pos Kas Tujuan</label>
                  <select
                    value={resiFormData.posKas || 'Kas Umum'}
                    onChange={(e) => setResiFormData({ ...resiFormData, posKas: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    <option value="Kas Umum">Kas Umum</option>
                    <option value="Kas Pembangunan">Kas Pembangunan</option>
                    <option value="Kas Diakonia">Kas Diakonia</option>
                    <option value="Kas Pemuda">Kas Pemuda</option>
                    <option value="Kas Sekolah Minggu">Kas Sekolah Minggu</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-slate-700 font-bold mb-1">Nomor WhatsApp Pengirim (Opsional)</label>
                  <input
                    type="text"
                    placeholder="Cth: 081234567890"
                    value={resiFormData.noHp || ''}
                    onChange={(e) => setResiFormData({ ...resiFormData, noHp: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-mono text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-slate-700 font-bold mb-1">Unggah Bukti Scan / Foto Resi Transfer</label>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={handleResiFileChange}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 text-slate-700 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-emerald-600 file:text-white file:font-bold hover:file:bg-emerald-500"
                  />
                  {resiFormData.fileResi && (
                    <div className="mt-2 p-2 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-2 text-emerald-800 font-bold text-[11px]">
                      <Check className="w-4 h-4 text-emerald-600" />
                      <span>File foto resi berhasil terlampir.</span>
                    </div>
                  )}
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-slate-700 font-bold mb-1">Pesan / Pokok Doa (Opsional)</label>
                  <textarea
                    rows={2}
                    placeholder="Cth: Mohon doa untuk kesehatan keluarga..."
                    value={resiFormData.catatan || ''}
                    onChange={(e) => setResiFormData({ ...resiFormData, catatan: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsSubmitResiOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-extrabold hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold shadow-lg flex items-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  <span>Kirim Konfirmasi Resi</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CETAK RESI BUKTI DIVERIFIKASI */}
      {selectedReceiptForPrint && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200 text-slate-900">
            <div className="bg-emerald-900 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-100" />
                <h3 className="font-extrabold text-emerald-100">Resi Resmi Persembahan Digital</h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedReceiptForPrint(null);
                  setWaShareNotice(null);
                }}
                className="p-1 rounded-lg hover:bg-emerald-800 text-emerald-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs font-sans">
              <div className="text-center pb-3 border-b border-slate-200 space-y-1">
                <h4 className="font-extrabold text-slate-900 text-sm uppercase">{settings.namaJemaat}</h4>
                <p className="text-[10px] text-slate-500 font-mono">{settings.resortGke} — GKE</p>
                {selectedReceiptForPrint.status === 'ditolak' ? (
                  <span className="inline-block mt-1 px-3 py-0.5 bg-rose-100 text-rose-800 font-extrabold text-[10px] rounded-full border border-rose-300">
                    STATUS: DITOLAK / TIDAK VALID
                  </span>
                ) : selectedReceiptForPrint.status === 'disetujui' || selectedReceiptForPrint.status === 'diverifikasi' || selectedReceiptForPrint.status === 'berhasil' ? (
                  <span className="inline-block mt-1 px-3 py-0.5 bg-emerald-100 text-emerald-800 font-extrabold text-[10px] rounded-full border border-emerald-300">
                    STATUS: TERVERIFIKASI &amp; SAH
                  </span>
                ) : (
                  <span className="inline-block mt-1 px-3 py-0.5 bg-amber-100 text-amber-900 font-extrabold text-[10px] rounded-full border border-amber-300 animate-pulse">
                    STATUS: MENUNGGU VERIFIKASI BENDAHARA
                  </span>
                )}
              </div>

              {/* Callout box when pending verification */}
              {(selectedReceiptForPrint.status === 'menunggu' || !selectedReceiptForPrint.status || selectedReceiptForPrint.status === 'pending') && (
                <div className="bg-amber-50 border border-amber-300 p-3 rounded-xl flex items-center justify-between gap-2">
                  <div className="space-y-0.5 text-left">
                    <p className="font-extrabold text-amber-900 text-[11px] flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-amber-700 animate-spin" />
                      <span>Menunggu Verifikasi Bendahara</span>
                    </p>
                    <p className="text-[10px] text-amber-800">
                      Hubungi pengurus via WhatsApp untuk mempercepat verifikasi kas.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={async () => {
                      const res = await shareReceiptToWhatsApp(selectedReceiptForPrint, settings);
                      setWaShareNotice(res.message);
                    }}
                    className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-[10px] rounded-lg shadow flex items-center gap-1 shrink-0 transition-all cursor-pointer"
                  >
                    <MessageCircle className="w-3 h-3 text-emerald-100" />
                    <span>Hubungi WA</span>
                  </button>
                </div>
              )}

              {waShareNotice && (
                <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-900 text-[11px] font-medium leading-relaxed animate-in fade-in">
                  {waShareNotice}
                </div>
              )}

              <div className="space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">No. Referensi:</span>
                  <span className="font-mono font-bold text-slate-900">{selectedReceiptForPrint.noReferensi || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Tanggal Transaksi:</span>
                  <span className="font-mono text-slate-800">{selectedReceiptForPrint.tanggal}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Kategori:</span>
                  <span className="font-bold text-slate-900">{selectedReceiptForPrint.kategori}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Pos Kas:</span>
                  <span className="font-bold text-slate-900">{selectedReceiptForPrint.posKas || 'Kas Umum'}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-slate-200 font-extrabold text-sm text-emerald-700">
                  <span>Nominal:</span>
                  <span className="font-mono">Rp {selectedReceiptForPrint.jumlah.toLocaleString('id-ID')}</span>
                </div>
              </div>

              <div className="text-[11px] text-slate-600 bg-amber-50 p-3 rounded-xl border border-amber-200 italic">
                "{selectedReceiptForPrint.keterangan || 'Persembahan Digital Warga Jemaat'}"
              </div>

              <div className="text-[10px] text-slate-400 text-center font-mono space-y-1 pt-1">
                <p>Diverifikasi &amp; Disetujui Oleh: <strong>{selectedReceiptForPrint.disetujuiOleh || settings.namaBendahara || 'Bendahara Majelis'}</strong></p>
                <p>Tanda terima digital resmi Gereja Kalimantan Evangelis (GKE)</p>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 space-y-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => downloadReceiptAsImage(selectedReceiptForPrint, settings)}
                    className="w-full py-2.5 px-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-extrabold text-xs shadow flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-95"
                  >
                    <Download className="w-3.5 h-3.5 text-sky-400" />
                    <span>Download Gambar (.PNG)</span>
                  </button>

                  <button
                    type="button"
                    onClick={async () => {
                      const res = await shareReceiptToWhatsApp(selectedReceiptForPrint, settings);
                      setWaShareNotice(res.message);
                    }}
                    className="w-full py-2.5 px-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-95"
                  >
                    <MessageCircle className="w-3.5 h-3.5 text-emerald-100" />
                    <span>Kirim Gambar &amp; WA</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => window.print()}
                  className="w-full py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all border border-slate-300"
                >
                  <Printer className="w-3.5 h-3.5 text-slate-600" />
                  <span>Cetak</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Sukses Upload Resi & Kirim WA Admin */}
      {showResiSuccessToast && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-emerald-500/50 rounded-2xl max-w-md w-full p-6 text-center space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="w-14 h-14 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-lg font-black text-white">Resi Persembahan Digital Berhasil Terkirim!</h3>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                Bukti persembahan digital Anda telah tercatat di sistem dengan No. Ref:{' '}
                <span className="font-mono text-emerald-400 font-bold">{lastSubmittedRefNo}</span>. Status saat ini: <span className="text-amber-300 font-bold">MENUNGGU VERIFIKASI</span>.
              </p>
            </div>

            <div className="p-3 bg-emerald-950/60 border border-emerald-500/30 rounded-xl text-left text-xs text-emerald-200 space-y-1">
              <p className="font-bold text-emerald-300 flex items-center gap-1.5">
                <MessageCircle className="w-4 h-4 text-emerald-400" />
                <span>Notifikasi Otomatis WhatsApp Admin</span>
              </p>
              <p className="text-[11px] text-slate-300 font-normal leading-relaxed">
                Pesan WhatsApp otomatis ke WhatsApp Admin / Bendahara Jemaat ({settings.noWhatsappAdmin || settings.gopayAccountNumber || '081255667788'}) telah disiapkan. Jika jendela WhatsApp belum otomatis terbuka, klik tombol di bawah:
              </p>
            </div>

            <div className="space-y-2 pt-1">
              {submittedWaUrl && (
                <a
                  href={submittedWaUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-lg flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95"
                >
                  <Send className="w-4 h-4 text-emerald-100" />
                  <span>Kirim Notifikasi WA ke Admin Sekarang</span>
                </a>
              )}

              <button
                type="button"
                onClick={() => setShowResiSuccessToast(false)}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs cursor-pointer transition-all"
              >
                Tutup &amp; Kembali ke Portal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: DETAIL RINGKASAN WARTA JEMAAT LENGKAP */}
      {selectedWartaDetail && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-200 text-slate-900 dark:text-slate-100 flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="modal-dark-header bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 !text-white text-white p-5 flex items-start justify-between gap-4 shrink-0">
              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="warta-badge-nomor inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-blue-600 dark:bg-blue-600 text-white font-mono font-black text-[11px] uppercase tracking-wider border border-blue-400/50 shadow-xs">
                    <FileText className="w-3 h-3 text-blue-100 shrink-0" />
                    <span>{selectedWartaDetail.nomorEdisi || 'Warta Jemaat'}</span>
                  </span>
                  <span className="warta-badge-tanggal text-xs font-mono text-slate-100 font-semibold flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/15 border border-white/20 shadow-2xs">
                    <Calendar className="w-3.5 h-3.5 text-sky-300 shrink-0" />
                    <span>{selectedWartaDetail.tanggalTerbit || '-'}</span>
                  </span>
                  {selectedWartaDetail.status && (
                    <span
                      className={`warta-badge-status text-[11px] font-black px-2.5 py-1 rounded-md shadow-xs flex items-center gap-1.5 border ${
                        selectedWartaDetail.status === 'Diterbitkan'
                          ? 'bg-emerald-600 dark:bg-emerald-600 text-white border-emerald-400/60'
                          : selectedWartaDetail.status === 'Draf'
                          ? 'bg-amber-600 dark:bg-amber-600 text-white border-amber-400/60 status-draf'
                          : 'bg-slate-700 dark:bg-slate-700 text-slate-100 border-slate-500 status-arsip'
                      }`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-white shadow-2xs"></span>
                      <span>{selectedWartaDetail.status}</span>
                    </span>
                  )}
                </div>
                <h3 className="modal-title text-lg sm:text-xl font-black !text-white text-white font-serif tracking-tight leading-snug">
                  {selectedWartaDetail.judulWarta || (selectedWartaDetail as any).judul || 'Warta Jemaat & Buletin'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedWartaDetail(null)}
                className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body (Scrollable) */}
            <div className="p-5 overflow-y-auto space-y-6 text-xs text-slate-700 dark:text-slate-300 font-sans flex-1 bg-white dark:bg-slate-900">
              {/* Tema & Nats Pembimbing Card */}
              <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50/40 dark:from-slate-900 dark:to-indigo-950/60 border border-blue-200 dark:border-indigo-800/60 rounded-xl space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1 flex-1">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-900 dark:text-sky-300">
                      Tema Kebaktian Minggu
                    </span>
                    <p className="text-sm font-black text-slate-900 dark:text-white">
                      {selectedWartaDetail.temaKhotbah || 'Ibadah dan Pelayanan Kasih'}
                    </p>
                  </div>
                  {selectedWartaDetail.natsPembimbing && (
                    <div className="space-y-1 text-right">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-purple-900 dark:text-purple-300">
                        Nats Pembimbing
                      </span>
                      <p className="text-xs font-mono font-extrabold text-purple-800 dark:text-purple-300 flex items-center justify-end gap-1">
                        <BookOpen className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                        <span>{selectedWartaDetail.natsPembimbing}</span>
                      </p>
                    </div>
                  )}
                </div>

                {selectedWartaDetail.catatanGembala && (
                  <div className="pt-2 border-t border-blue-200/70 dark:border-indigo-800/70 text-xs text-slate-700 dark:text-slate-200 italic">
                    <span className="font-bold not-italic text-blue-950 dark:text-sky-300 block mb-0.5">
                      Catatan Penggembalaan:
                    </span>
                    "{selectedWartaDetail.catatanGembala}"
                  </div>
                )}
              </div>

              {/* 1. Berita Pelayanan & Jadwal Ibadah */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-1.5">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span>I. Jadwal &amp; Pelayanan Ibadah (1 Minggu yang Akan Datang)</span>
                  </h4>
                  <span className="text-[11px] font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-800">
                    {selectedWartaDetail.beritaPelayananList?.length || 0} Pelayanan (1 Minggu)
                  </span>
                </div>

                {!selectedWartaDetail.beritaPelayananList || selectedWartaDetail.beritaPelayananList.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-2">Tidak ada daftar pelayanan khusus.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {selectedWartaDetail.beritaPelayananList.map((pel, idx) => {
                      const namaIbadah = pel.namaIbadah || (pel as any).nama || 'Ibadah Jemaat';
                      const waktu = pel.waktu || (pel as any).jam || (pel as any).jamPelayanan || '';
                      const tanggal = pel.tanggal || (pel as any).tgl || '';
                      const badgeWaktu = (pel as any).hariTanggalJam || (tanggal && waktu ? `${tanggal} • ${waktu}` : waktu || tanggal || 'Jadwal Ibadah');
                      const tempat = pel.tempat || (pel as any).lokasi || 'Gereja GKE ';
                      const pelayanFirman = pel.pelayanFirman || (pel as any).pengkhotbah || (pel as any).pelayan || '-';
                      const liturgos = pel.liturgos || (pel as any).pemimpinLiturgi || '';
                      const pemusik = pel.pemusik || (pel as any).organis || '';
                      const pemanduLagu = pel.pemanduLagu || (pel as any).kantoria || (pel as any).songleader || '';
                      const pemusikSongleader = (pel as any).pemusikSongleader || (pemusik && pemanduLagu ? `${pemusik} / ${pemanduLagu}` : pemusik || pemanduLagu);
                      const multimedia = pel.operatorMultimedia || (pel as any).multimedia || '';
                      const kolektan = pel.kolektan || (pel as any).petugasKolekte || '';
                      const penerimaTamu = pel.penerimaTamu || '';
                      const alkitab = pel.pembacaanAlkitab || (pel as any).natsAlkitab || '';
                      const ketKhusus = pel.keteranganKhusus || (pel as any).keterangan || '';
                      const kategori = pel.kategoriIbadah || (pel as any).kategori || '';

                      return (
                        <div
                          key={idx}
                          className="p-3.5 bg-slate-50 hover:bg-slate-50/90 dark:bg-slate-900/90 dark:hover:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2 hover:border-blue-300 dark:hover:border-blue-700 transition-all shadow-2xs"
                        >
                          <div className="flex items-start justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
                            <div className="space-y-0.5 min-w-0 flex-1">
                              <span className="font-extrabold text-xs text-blue-950 dark:text-blue-300 block">
                                {namaIbadah}
                              </span>
                              {kategori && (
                                <span className="inline-block text-[10px] font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-800">
                                  {kategori}
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] font-mono font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 shrink-0">
                              {badgeWaktu}
                            </span>
                          </div>

                          <div className="space-y-1 text-[11px] text-slate-600 dark:text-slate-300">
                            <p>
                              <span className="font-bold text-slate-700 dark:text-slate-300">Tempat: </span>
                              <span className="text-slate-900 dark:text-slate-100">{tempat}</span>
                            </p>
                            <p>
                              <span className="font-bold text-blue-900 dark:text-blue-400">Pelayan Firman: </span>
                              <span className="font-bold text-slate-900 dark:text-slate-100">{pelayanFirman}</span>
                            </p>
                            {liturgos && (
                              <p>
                                <span className="font-bold text-slate-700 dark:text-slate-300">Liturgos: </span>
                                <span className="text-slate-800 dark:text-slate-200">{liturgos}</span>
                              </p>
                            )}
                            {pemusikSongleader && (
                              <p>
                                <span className="font-bold text-slate-700 dark:text-slate-300">Pemusik/Pemandu: </span>
                                <span className="text-slate-800 dark:text-slate-200">{pemusikSongleader}</span>
                              </p>
                            )}
                            {multimedia && (
                              <p>
                                <span className="font-bold text-slate-700 dark:text-slate-300">Multimedia/Sound: </span>
                                <span className="text-slate-800 dark:text-slate-200">{multimedia}</span>
                              </p>
                            )}
                            {kolektan && (
                              <p>
                                <span className="font-bold text-slate-700 dark:text-slate-300">Petugas Kolekte: </span>
                                <span className="text-slate-800 dark:text-slate-200">{kolektan}</span>
                              </p>
                            )}
                            {penerimaTamu && (
                              <p>
                                <span className="font-bold text-slate-700 dark:text-slate-300">Penerima Tamu: </span>
                                <span className="text-slate-800 dark:text-slate-200">{penerimaTamu}</span>
                              </p>
                            )}
                            {alkitab && (
                              <p>
                                <span className="font-bold text-slate-700 dark:text-slate-300">Bacaan Alkitab: </span>
                                <span className="text-slate-800 dark:text-slate-200 font-semibold italic">{alkitab}</span>
                              </p>
                            )}
                            {ketKhusus && (
                              <p className="text-[10px] text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 p-1.5 rounded border border-amber-200 dark:border-amber-800 mt-1">
                                <strong>Catatan:</strong> {ketKhusus}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* 2. Laporan Rekapitulasi Keuangan */}
              {selectedWartaDetail.beritaKeuangan && (
                <div className="space-y-2.5">
                  <div className="flex flex-wrap items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-1.5 gap-2">
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                      <DollarSign className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <span>II. Laporan Ringkasan Keuangan Kas Jemaat</span>
                    </h4>
                    {selectedWartaDetail.beritaKeuangan.periodeJudul && (
                      <span className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                        {selectedWartaDetail.beritaKeuangan.periodeJudul}
                      </span>
                    )}
                  </div>

                  {(() => {
                    const bKeu = selectedWartaDetail.beritaKeuangan;
                    const saldoAwal = Number(bKeu.saldoAwal ?? (bKeu as any).saldoKasAwal ?? 0);
                    const totalPemasukan = Number(
                      bKeu.totalPemasukan ??
                        (bKeu as any).totalPenerimaan ??
                        (bKeu as any).pemasukan ??
                        (bKeu as any).penerimaan ??
                        0
                    );
                    const totalPengeluaran = Number(
                      bKeu.totalPengeluaran ?? (bKeu as any).pengeluaran ?? 0
                    );
                    const saldoAkhir = Number(
                      bKeu.saldoAkhir ??
                        (bKeu as any).saldoKasAkhir ??
                        (saldoAwal + totalPemasukan - totalPengeluaran)
                    );

                    return (
                      <div className="space-y-2.5">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
                            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase block">Saldo Awal</span>
                            <p className="text-sm font-bold text-slate-900 dark:text-white mt-0.5 font-mono">
                              Rp {saldoAwal.toLocaleString('id-ID')}
                            </p>
                          </div>

                          <div className="pemasukan-box-portal p-3 bg-emerald-50 dark:bg-slate-900 rounded-xl border border-emerald-200 dark:border-emerald-500/40 shadow-2xs">
                            <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-400 uppercase block">Total Penerimaan</span>
                            <p className="ringkasan-keuangan-pemasukan text-sm font-bold text-emerald-950 dark:text-emerald-300 mt-0.5 font-mono">
                              Rp {totalPemasukan.toLocaleString('id-ID')}
                            </p>
                          </div>

                          <div className="pengeluaran-box-portal p-3 bg-rose-50 dark:bg-slate-900 rounded-xl border border-rose-200 dark:border-rose-500/40 shadow-2xs">
                            <span className="text-[10px] font-bold text-rose-800 dark:text-rose-400 uppercase block">Total Pengeluaran</span>
                            <p className="ringkasan-keuangan-pengeluaran text-sm font-bold text-rose-950 dark:text-rose-300 mt-0.5 font-mono">
                              Rp {totalPengeluaran.toLocaleString('id-ID')}
                            </p>
                          </div>

                          <div className="saldo-box-portal p-3 bg-blue-50 dark:bg-slate-900 rounded-xl border border-blue-200 dark:border-sky-500/40 shadow-2xs">
                            <span className="text-[10px] font-bold text-blue-900 dark:text-sky-400 uppercase block">Saldo Kas Akhir</span>
                            <p className="ringkasan-keuangan-saldo text-sm font-extrabold text-blue-950 dark:text-sky-300 mt-0.5 font-mono">
                              Rp {saldoAkhir.toLocaleString('id-ID')}
                            </p>
                          </div>
                        </div>

                        {/* Rincian Pos Kas jika tersedia */}
                        {bKeu.rincianPosKas && bKeu.rincianPosKas.length > 0 && (
                          <div className="p-3 bg-slate-50 dark:bg-slate-900/90 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                            <span className="text-[10px] font-black uppercase text-slate-700 dark:text-slate-300 block">
                              Rincian Pos Kas Jemaat:
                            </span>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                              {bKeu.rincianPosKas.map((pos, pIdx) => (
                                <div
                                  key={pIdx}
                                  className="p-2.5 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-xs flex justify-between items-center"
                                >
                                  <div>
                                    <p className="font-bold text-slate-900 dark:text-white">{pos.namaPos}</p>
                                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                                      +Rp {(pos.pemasukan || 0).toLocaleString('id-ID')} | -Rp {(pos.pengeluaran || 0).toLocaleString('id-ID')}
                                    </p>
                                  </div>
                                  <span className="font-bold font-mono text-emerald-800 dark:text-emerald-400">
                                    Rp {(pos.saldo || 0).toLocaleString('id-ID')}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Catatan Kas jika ada */}
                        {bKeu.catatanKeuangan && (
                          <p className="text-xs text-slate-700 dark:text-amber-200 italic bg-amber-50/70 dark:bg-amber-950/40 p-2.5 rounded-xl border border-amber-200 dark:border-amber-800/60">
                            <strong className="text-amber-950 dark:text-amber-300 not-italic">Catatan Kas:</strong> {bKeu.catatanKeuangan}
                          </p>
                        )}
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* 3. Berita Ulang Tahun Kelahiran & Pernikahan */}
              {selectedWartaDetail.beritaUlangTahunList && selectedWartaDetail.beritaUlangTahunList.length > 0 && (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-1.5">
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                      <Cake className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                      <span>III. Ucapan Syukur Ulang Tahun Jemaat ({selectedWartaDetail.beritaUlangTahunList.length})</span>
                    </h4>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                    {selectedWartaDetail.beritaUlangTahunList.map((hut, idx) => {
                      const hutNama = hut.nama || (hut as any).namaLengkap || (hut as any).namaWarga || 'Warga Jemaat';
                      const hutJenis = hut.jenis || (hut as any).jenisUlangTahun || (hutNama.includes('&') ? 'pernikahan' : 'kelahiran');
                      const isNikah = String(hutJenis).toLowerCase().includes('nikah') || String(hutJenis).toLowerCase().includes('pernikahan');
                      const hutRayon = hut.rayon || (hut as any).lingkungan || (hut as any).sektor || '';
                      const hutTanggal = hut.tanggal || (hut as any).tanggalLahir || (hut as any).tanggalPernikahan || (hut as any).tgl || '-';
                      const hutKet = hut.keterangan || '';

                      return (
                        <div
                          key={idx}
                          className={`p-3 rounded-xl border flex items-start justify-between gap-2 ${
                            isNikah
                              ? 'bg-indigo-50/60 dark:bg-indigo-950/60 border-indigo-200 dark:border-indigo-800/80'
                              : 'bg-rose-50/60 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800/80'
                          }`}
                        >
                          <div className="space-y-0.5 min-w-0 flex-1">
                            <span className="font-extrabold text-xs text-slate-900 dark:text-white block truncate" title={hutNama}>
                              {hutNama}
                            </span>
                            {hutRayon && (
                              <span className="text-[10px] text-slate-600 dark:text-slate-300 block truncate">
                                {hutRayon.startsWith('Lingkungan') || hutRayon.startsWith('Rayon') ? hutRayon : `Rayon ${hutRayon}`}
                              </span>
                            )}
                            {hutKet && (
                              <span className="text-[9px] text-slate-500 dark:text-slate-400 italic block truncate">
                                {hutKet}
                              </span>
                            )}
                          </div>
                          <div className="text-right shrink-0">
                            <span
                              className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border block ${
                                isNikah
                                  ? 'text-indigo-800 dark:text-indigo-200 bg-white dark:bg-indigo-900/80 border-indigo-200 dark:border-indigo-700'
                                  : 'text-rose-800 dark:text-rose-200 bg-white dark:bg-rose-900/80 border-rose-200 dark:border-rose-700'
                              }`}
                            >
                              {hutTanggal}
                            </span>
                            <span
                              className={`text-[9px] font-bold uppercase mt-0.5 block ${
                                isNikah ? 'text-indigo-700 dark:text-indigo-300' : 'text-rose-700 dark:text-rose-300'
                              }`}
                            >
                              {isNikah ? 'HUT Nikah' : 'HUT Lahir'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 4. Berita Duka / Pernikahan / Tambahan Umum */}
              {((selectedWartaDetail.beritaDukaList && selectedWartaDetail.beritaDukaList.length > 0) ||
                (selectedWartaDetail.undanganPernikahanList && selectedWartaDetail.undanganPernikahanList.length > 0) ||
                (selectedWartaDetail.beritaTambahanList && selectedWartaDetail.beritaTambahanList.length > 0)) && (
                <div className="space-y-3.5">
                  <div className="border-b border-slate-200 dark:border-slate-800 pb-1.5">
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                      <span>IV. Warta Duka, Pernikahan &amp; Pengumuman Umum</span>
                    </h4>
                  </div>

                  {/* Berita Duka (Masa warta 2 minggu setelah terbit warta) */}
                  {isWartaWithinTwoWeeks(selectedWartaDetail.tanggalTerbit) &&
                    selectedWartaDetail.beritaDukaList &&
                    selectedWartaDetail.beritaDukaList.filter((d) =>
                      isDukaWithinTwoWeeks(
                        (d as any).tanggalMeninggal || (d as any).tglMeninggal || (d as any).tanggal,
                        selectedWartaDetail.tanggalTerbit
                      )
                    ).length > 0 && (
                    <div className="space-y-2">
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 block">
                        Berita Duka Cita &amp; Belasungkawa (Masa Warta 2 Minggu)
                      </span>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                        {selectedWartaDetail.beritaDukaList
                          .filter((d) =>
                            isDukaWithinTwoWeeks(
                              (d as any).tanggalMeninggal || (d as any).tglMeninggal || (d as any).tanggal,
                              selectedWartaDetail.tanggalTerbit
                            )
                          )
                          .map((duka, idx) => {
                          const nama = (duka as any).namaMeninggal || (duka as any).namaAlmarhum || (duka as any).nama || 'Warga Jemaat';
                          const usia = (duka as any).usia ? `${(duka as any).usia} Thn` : '';
                          const tgl = (duka as any).tanggalMeninggal || (duka as any).tglMeninggal || (duka as any).tanggal || '';
                          const tempat = (duka as any).tempatDuka || (duka as any).alamatDuka || '';
                          const pemakaman = (duka as any).jadwalPemakaman || (duka as any).pemakaman || (duka as any).tempatPemakaman || '';
                          const keluarga = (duka as any).keluargaYangBerduka || (duka as any).keluarga || '';
                          const rayon = (duka as any).rayon || (duka as any).lingkungan || '';

                          return (
                            <div
                              key={idx}
                              className="duka-warta-card p-3.5 bg-slate-100 dark:bg-slate-900/90 rounded-2xl border border-slate-300 dark:border-slate-700/80 text-xs space-y-1.5 shadow-2xs"
                            >
                              <div className="flex items-center justify-between gap-2">
                                <p className="duka-nama font-extrabold text-slate-900 dark:text-white text-sm flex items-center gap-1.5">
                                  <span className="text-rose-600 dark:text-rose-400 font-serif">✝</span>
                                  <span>Telah Berpulang: {nama} {usia ? `(${usia})` : ''}</span>
                                </p>
                                {rayon && (
                                  <span className="duka-rayon text-[10px] font-bold px-2 py-0.5 bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-md border border-slate-300 dark:border-slate-700 shrink-0">
                                    {rayon}
                                  </span>
                                )}
                              </div>
                              {(tgl || tempat) && (
                                <p className="duka-info text-[11px] text-slate-700 dark:text-slate-300">
                                  {tgl ? `Meninggal: ${tgl}` : ''} {tempat ? ` | Rumah Duka: ${tempat}` : ''}
                                </p>
                              )}
                              {pemakaman && (
                                <p className="duka-pemakaman text-[11px] text-slate-800 dark:text-slate-200 font-semibold">
                                  Pemakaman: {pemakaman}
                                </p>
                              )}
                              {keluarga && (
                                <p className="duka-keluarga text-[10px] text-slate-600 dark:text-slate-400 italic">
                                  Keluarga yang Berduka: {keluarga}
                                </p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Undangan Pernikahan (1 bulan setelah diterbitkannya warta jemaat) */}
                  {selectedWartaDetail.undanganPernikahanList &&
                    selectedWartaDetail.undanganPernikahanList.filter((nikah) =>
                      isNikahWithinOneMonth(
                        (nikah as any).tanggalPemberkatan || (nikah as any).tglPemberkatan || (nikah as any).tanggal,
                        selectedWartaDetail.tanggalTerbit
                      )
                    ).length > 0 && (
                    <div className="space-y-2">
                      <span className="text-[10px] font-black uppercase tracking-wider text-purple-800 dark:text-purple-300 block">
                        Pengumuman Pemberkatan Nikah Kudus (1 Bulan ke Depan)
                      </span>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                        {selectedWartaDetail.undanganPernikahanList
                          .filter((nikah) =>
                            isNikahWithinOneMonth(
                              (nikah as any).tanggalPemberkatan || (nikah as any).tglPemberkatan || (nikah as any).tanggal,
                              selectedWartaDetail.tanggalTerbit
                            )
                          )
                          .map((nikah, idx) => {
                          const pria =
                            (nikah as any).namaMempelaiPria ||
                            (nikah as any).mempelaiPria ||
                            (nikah as any).namaPria ||
                            (nikah as any).pria ||
                            'Mempelai Pria';
                          const wanita =
                            (nikah as any).namaMempelaiWanita ||
                            (nikah as any).mempelaiWanita ||
                            (nikah as any).namaWanita ||
                            (nikah as any).wanita ||
                            'Mempelai Wanita';
                          const tgl =
                            (nikah as any).tanggalPemberkatan ||
                            (nikah as any).tglPemberkatan ||
                            (nikah as any).tanggal ||
                            '-';
                          const waktu =
                            (nikah as any).waktuPemberkatan ||
                            (nikah as any).jamPemberkatan ||
                            (nikah as any).waktu ||
                            (nikah as any).jam ||
                            '';
                          const tempat =
                            (nikah as any).tempatGereja ||
                            (nikah as any).tempatPemberkatan ||
                            (nikah as any).tempat ||
                            (nikah as any).lokasi ||
                            settings.namaJemaat;
                          const ortuPria = (nikah as any).orangTuaPria || (nikah as any).namaOrangTuaPria || '';
                          const ortuWanita = (nikah as any).orangTuaWanita || (nikah as any).namaOrangTuaWanita || '';
                          const rayon = (nikah as any).rayonAtauJemaatAsal || (nikah as any).rayon || (nikah as any).asalJemaat || '';
                          const ket = (nikah as any).keterangan || '';

                          return (
                            <div
                              key={idx}
                              className="p-3.5 bg-purple-50/90 dark:bg-purple-950/60 rounded-2xl border border-purple-200 dark:border-purple-800/80 text-xs space-y-1.5 shadow-2xs"
                            >
                              <div className="flex items-center justify-between gap-2">
                                <p className="font-extrabold text-purple-950 dark:text-purple-100 text-sm">
                                  {pria} &amp; {wanita}
                                </p>
                                <span className="text-[10px] font-bold px-2 py-0.5 bg-purple-100 dark:bg-purple-900/80 text-purple-800 dark:text-purple-200 rounded-md border border-purple-200 dark:border-purple-700 shrink-0">
                                  Nikah Kudus
                                </span>
                              </div>
                              <p className="text-[11px] text-purple-900 dark:text-purple-200 font-medium">
                                Tanggal: <strong className="font-bold text-purple-950 dark:text-white">{tgl}</strong>{' '}
                                {waktu ? `• Pukul ${waktu}` : ''} | Tempat:{' '}
                                <strong className="font-bold text-purple-950 dark:text-white">{tempat}</strong>
                              </p>
                              {(ortuPria || ortuWanita) && (
                                <p className="text-[10px] text-purple-800/90 dark:text-purple-300">
                                  {ortuPria ? `Ortu Pria: ${ortuPria}` : ''}{' '}
                                  {ortuWanita ? `| Ortu Wanita: ${ortuWanita}` : ''}
                                </p>
                              )}
                              {rayon && (
                                <p className="text-[10px] text-purple-700 dark:text-purple-300">
                                  Asal Rayon / Jemaat: {rayon}
                                </p>
                              )}
                              {ket && (
                                <p className="text-[10px] text-purple-600 dark:text-purple-300/80 italic">
                                  Catatan: {ket}
                                </p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Berita Tambahan Umum */}
                  {selectedWartaDetail.beritaTambahanList && selectedWartaDetail.beritaTambahanList.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 block">
                        Pengumuman / Berita Lainnya
                      </span>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                        {selectedWartaDetail.beritaTambahanList.map((tam, idx) => {
                          const judul = (tam as any).judul || (tam as any).nama || 'Pengumuman';
                          const kat = (tam as any).kategori || 'Pengumuman Umum';
                          const isi = (tam as any).isi || (tam as any).keterangan || (tam as any).deskripsi || '';
                          const tgl = (tam as any).tanggal || '';

                          return (
                            <div
                              key={idx}
                              className="p-3.5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs space-y-1 shadow-2xs"
                            >
                              <div className="flex items-center justify-between gap-2">
                                <p className="font-extrabold text-slate-900 dark:text-white text-sm">{judul}</p>
                                <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-md border border-slate-200 dark:border-slate-700">
                                  {kat}
                                </span>
                              </div>
                              {tgl && <p className="text-[10px] font-mono text-slate-400 dark:text-slate-400">{tgl}</p>}
                              <p className="text-[11px] text-slate-600 dark:text-slate-300 whitespace-pre-line leading-relaxed">{isi}</p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  const w = selectedWartaDetail;
                  const displayJudul = w.judulWarta || (w as any).judul || 'Warta Jemaat';
                  const displayTanggal = w.tanggalTerbit || (w as any).tanggal || '-';
                  const displayTema = w.temaKhotbah || (w as any).isi || 'Ibadah dan Pelayanan Kasih';
                  const displayNats = w.natsPembimbing || '';
                  const totalPelayanan = w.beritaPelayananList?.length || 0;
                  const saldoKas = w.beritaKeuangan?.saldoAkhir;
                  const totalHut = w.beritaUlangTahunList?.length || 0;
                  const isModalDukaActive = isWartaWithinTwoWeeks(w.tanggalTerbit);
                  const filteredModalDuka = isModalDukaActive
                    ? (w.beritaDukaList || []).filter((d) =>
                        isDukaWithinTwoWeeks(
                          (d as any).tanggalMeninggal || (d as any).tglMeninggal || (d as any).tanggal,
                          w.tanggalTerbit
                        )
                      )
                    : [];
                  const filteredModalNikah = (w.undanganPernikahanList || []).filter((n) =>
                    isNikahWithinOneMonth(
                      (n as any).tanggalPemberkatan || (n as any).tglPemberkatan || (n as any).tanggal,
                      w.tanggalTerbit
                    )
                  );
                  const totalDuka = filteredModalDuka.length;
                  const totalNikah = filteredModalNikah.length;
                  const totalPengumuman = w.beritaTambahanList?.length || 0;

                  const lines = [
                    `=== WARTA JEMAAT ${(settings?.namaJemaat || 'GKE').toUpperCase()} ===`,
                    `Nomor: ${w.nomorEdisi || '-'}`,
                    `Tanggal Terbit: ${displayTanggal}`,
                    `Judul: ${displayJudul}`,
                    `Tema: ${displayTema}`,
                    displayNats ? `Nats Alkitab: ${displayNats}` : '',
                    w.catatanGembala ? `\n--- CATATAN GEMBALA ---\n${w.catatanGembala}` : '',
                    totalPelayanan > 0
                      ? `\n--- JADWAL PELAYANAN IBADAH (${totalPelayanan}) ---\n` +
                        w.beritaPelayananList
                          .map(
                            (p) => {
                              const wkt = (p as any).hariTanggalJam || (p.tanggal && p.waktu ? `${p.tanggal} • ${p.waktu}` : p.waktu || p.tanggal || '-');
                              return `• ${p.namaIbadah} | ${wkt} | Tempat: ${p.tempat || '-'} | Pelayan: ${p.pelayanFirman || '-'}`;
                            }
                          )
                          .join('\n')
                      : '',
                    w.beritaKeuangan
                      ? (() => {
                          const bk = w.beritaKeuangan;
                          const sAwal = Number(bk.saldoAwal ?? (bk as any).saldoKasAwal ?? 0);
                          const sIn = Number(bk.totalPemasukan ?? (bk as any).totalPenerimaan ?? (bk as any).pemasukan ?? 0);
                          const sOut = Number(bk.totalPengeluaran ?? (bk as any).pengeluaran ?? 0);
                          const sEnd = Number(bk.saldoAkhir ?? (bk as any).saldoKasAkhir ?? (sAwal + sIn - sOut));
                          return `\n--- REKAPITULASI KEUANGAN ---\nSaldo Awal: Rp ${sAwal.toLocaleString('id-ID')}\nPenerimaan: Rp ${sIn.toLocaleString('id-ID')}\nPengeluaran: Rp ${sOut.toLocaleString('id-ID')}\nSaldo Akhir: Rp ${sEnd.toLocaleString('id-ID')}`;
                        })()
                      : '',
                    totalHut > 0
                      ? `\n--- UCAPAN ULANG TAHUN (${totalHut}) ---\n` +
                        w.beritaUlangTahunList
                          .map((u) => {
                            const uNama = u.nama || (u as any).namaLengkap || 'Warga Jemaat';
                            const isNik = String(u.jenis || (u as any).jenisUlangTahun || '').toLowerCase().includes('nikah');
                            return `• ${uNama} (${isNik ? 'HUT Pernikahan' : 'HUT Kelahiran'} - ${u.tanggal || '-'})`;
                          })
                          .join('\n')
                      : '',
                    totalDuka > 0
                      ? `\n--- BERITA DUKA CITA (${totalDuka}) ---\n` +
                        filteredModalDuka
                          .map((d) => {
                            const dNama = (d as any).namaMeninggal || (d as any).namaAlmarhum || (d as any).nama || 'Alm';
                            return `• ${dNama} (${(d as any).usia ? (d as any).usia + ' Thn' : ''}) - Meninggal: ${(d as any).tanggalMeninggal || '-'}`;
                          })
                          .join('\n')
                      : '',
                    totalNikah > 0
                      ? `\n--- PENGUMUMAN PEMBERKATAN NIKAH (${totalNikah}) ---\n` +
                        filteredModalNikah
                          .map((n) => {
                            const p = (n as any).namaMempelaiPria || (n as any).mempelaiPria || (n as any).namaPria || (n as any).pria || 'Pria';
                            const w = (n as any).namaMempelaiWanita || (n as any).mempelaiWanita || (n as any).namaWanita || (n as any).wanita || 'Wanita';
                            return `• ${p} & ${w} - Tanggal: ${(n as any).tanggalPemberkatan || '-'}`;
                          })
                          .join('\n')
                      : '',
                    totalPengumuman > 0
                      ? `\n--- PENGUMUMAN LAINNYA (${totalPengumuman}) ---\n` +
                        w.beritaTambahanList
                          .map((t) => `• ${t.judul}: ${t.isi}`)
                          .join('\n')
                      : '',
                  ].filter(Boolean);

                  navigator.clipboard.writeText(lines.join('\n'));
                  setCopiedWartaId(w.id);
                  setTimeout(() => setCopiedWartaId(null), 2500);
                }}
                className="btn-salin-teks px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-bold text-xs border border-slate-300 dark:border-slate-600 flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
              >
                {copiedWartaId === selectedWartaDetail.id ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span className="text-emerald-700 dark:text-emerald-300 font-extrabold">Teks Warta Tersalin!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-700 dark:text-slate-200 shrink-0" />
                    <span className="text-slate-900 dark:text-white font-bold">Salin Naskah Warta</span>
                  </>
                )}
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    openPrintReport({
                      reportType: 'berita_jemaat',
                      beritaJemaatId: selectedWartaDetail.id,
                      customTitle: `WARTA JEMAAT - ${selectedWartaDetail.nomorEdisi || selectedWartaDetail.judulWarta}`,
                    })
                  }
                  className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-extrabold text-xs shadow-md flex items-center gap-1.5 transition-all cursor-pointer hover:scale-102 active:scale-98"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Cetak Format Dokumen PDF Resmi</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedWartaDetail(null)}
                  className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs transition-all cursor-pointer border border-transparent dark:border-slate-700"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: DETAIL & NASKAH RANCANGAN KHOTBAH LENGKAP */}
      {selectedKhotbahDetail && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-200 text-slate-900 dark:text-slate-100 flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="modal-dark-header bg-gradient-to-r from-purple-950 via-slate-900 to-indigo-950 !text-white text-white p-5 flex items-start justify-between gap-4 shrink-0">
              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-md bg-purple-500/30 text-purple-200 border border-purple-400/30 font-bold text-[10px] uppercase">
                    {selectedKhotbahDetail.jenisIbadah || (selectedKhotbahDetail as any).kategoriIbadah || 'Kebaktian Minggu'}
                  </span>
                  <span className="text-xs font-mono text-purple-300 font-semibold">
                    {selectedKhotbahDetail.tanggal}
                  </span>
                  {selectedKhotbahDetail.durasiTotalMenit && (
                    <span className="text-[10px] font-bold text-amber-300 bg-amber-500/20 border border-amber-400/30 px-2 py-0.5 rounded flex items-center gap-1">
                      <Clock className="w-3 h-3 text-amber-300" />
                      <span>{selectedKhotbahDetail.durasiTotalMenit} Menit</span>
                    </span>
                  )}
                </div>
                <h3 className="modal-title text-lg sm:text-xl font-black !text-white text-white font-serif tracking-tight leading-snug">
                  {selectedKhotbahDetail.judulKhotbah || (selectedKhotbahDetail as any).judulTema || selectedKhotbahDetail.temaKhotbah || 'Rancangan Khotbah'}
                </h3>
                {selectedKhotbahDetail.temaKhotbah && selectedKhotbahDetail.temaKhotbah !== selectedKhotbahDetail.judulKhotbah && (
                  <p className="text-xs !text-purple-200 text-purple-200 italic font-medium">
                    Tema: {selectedKhotbahDetail.temaKhotbah}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setSelectedKhotbahDetail(null)}
                className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body (Scrollable) */}
            <div className="p-5 overflow-y-auto space-y-5 text-xs text-slate-700 dark:text-slate-300 font-sans flex-1">
              {/* Primary Meta Card */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 bg-purple-50/50 dark:bg-purple-950/40 border border-purple-200/80 dark:border-purple-800/60 rounded-xl">
                <div>
                  <span className="text-[10px] font-bold text-slate-500 dark:text-purple-300 uppercase tracking-wider block">
                    Pelayan Firman / Pengkhotbah:
                  </span>
                  <p className="text-sm font-extrabold text-purple-950 dark:text-purple-100 mt-0.5">
                    {selectedKhotbahDetail.pengkhotbah || '-'}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-500 dark:text-purple-300 uppercase tracking-wider block">
                    Nats / Bacaan Alkitab:
                  </span>
                  <p className="text-sm font-mono font-extrabold text-purple-900 dark:text-purple-200 mt-0.5 flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0" />
                    <span>{selectedKhotbahDetail.natsAlkitab || '-'}</span>
                  </p>
                </div>
              </div>

              {/* Badges / Karakteristik Pastoral */}
              {(selectedKhotbahDetail.metodeHomiletika ||
                selectedKhotbahDetail.nadaPastoral ||
                selectedKhotbahDetail.sasaranPendengar) && (
                <div className="flex flex-wrap gap-2 pt-1 pb-1">
                  {selectedKhotbahDetail.metodeHomiletika && (
                    <span className="px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold text-slate-800 dark:text-slate-200 text-xs">
                      Metode: <strong className="text-purple-900 dark:text-purple-300">{selectedKhotbahDetail.metodeHomiletika}</strong>
                    </span>
                  )}
                  {selectedKhotbahDetail.nadaPastoral && (
                    <span className="px-3 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/60 font-semibold text-emerald-900 dark:text-emerald-200 text-xs">
                      Nada Pastoral: <strong className="text-emerald-950 dark:text-emerald-300">{selectedKhotbahDetail.nadaPastoral}</strong>
                    </span>
                  )}
                  {selectedKhotbahDetail.sasaranPendengar && (
                    <span className="px-3 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800/60 font-semibold text-indigo-900 dark:text-indigo-200 text-xs">
                      Sasaran: <strong className="text-indigo-950 dark:text-indigo-300">{selectedKhotbahDetail.sasaranPendengar}</strong>
                    </span>
                  )}
                </div>
              )}

              {/* Tritunggal Tujuan Pastoral */}
              {selectedKhotbahDetail.tujuanPastoral &&
                (selectedKhotbahDetail.tujuanPastoral.kognitif ||
                  selectedKhotbahDetail.tujuanPastoral.afektif ||
                  selectedKhotbahDetail.tujuanPastoral.psikomotorik) && (
                  <div className="space-y-2 bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                    <span className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                      Tujuan Pelayanan Firman (Tritunggal Pastoral)
                    </span>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {selectedKhotbahDetail.tujuanPastoral.kognitif && (
                        <div className="p-2.5 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                          <span className="text-[10px] font-bold text-blue-700 dark:text-blue-300 block uppercase">1. Kognitif (Pikiran)</span>
                          <p className="text-[11px] text-slate-700 dark:text-slate-300 mt-1 leading-relaxed">
                            {selectedKhotbahDetail.tujuanPastoral.kognitif}
                          </p>
                        </div>
                      )}
                      {selectedKhotbahDetail.tujuanPastoral.afektif && (
                        <div className="p-2.5 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                          <span className="text-[10px] font-bold text-rose-700 dark:text-rose-300 block uppercase">2. Afektif (Rasa / Hati)</span>
                          <p className="text-[11px] text-slate-700 dark:text-slate-300 mt-1 leading-relaxed">
                            {selectedKhotbahDetail.tujuanPastoral.afektif}
                          </p>
                        </div>
                      )}
                      {selectedKhotbahDetail.tujuanPastoral.psikomotorik && (
                        <div className="p-2.5 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                          <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 block uppercase">3. Psikomotorik (Tindakan)</span>
                          <p className="text-[11px] text-slate-700 dark:text-slate-300 mt-1 leading-relaxed">
                            {selectedKhotbahDetail.tujuanPastoral.psikomotorik}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

              {/* 1. Pendahuluan */}
              {selectedKhotbahDetail.pendahuluan && (
                <div className="space-y-1.5">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-slate-100 border-b border-slate-200 dark:border-slate-800 pb-1 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-purple-600 dark:bg-purple-400"></span>
                    <span>I. Pendahuluan &amp; Pengantar</span>
                  </h4>
                  <div className="p-3.5 bg-white dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 leading-relaxed whitespace-pre-line text-xs">
                    {selectedKhotbahDetail.pendahuluan}
                  </div>
                </div>
              )}

              {/* 2. Poin-Poin Utama Homiletika */}
              {selectedKhotbahDetail.poinUtama && selectedKhotbahDetail.poinUtama.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-slate-100 border-b border-slate-200 dark:border-slate-800 pb-1 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-purple-600 dark:bg-purple-400"></span>
                    <span>II. Pokok-Pokok &amp; Penguraian Firman</span>
                  </h4>
                  <div className="space-y-3">
                    {selectedKhotbahDetail.poinUtama.map((p, idx) => (
                      <div
                        key={idx}
                        className="p-4 bg-purple-50/40 dark:bg-purple-950/30 rounded-xl border border-purple-200/80 dark:border-purple-800/60 space-y-2"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-purple-700 text-white font-extrabold text-xs flex items-center justify-center shadow-xs">
                              {idx + 1}
                            </span>
                            <span className="font-extrabold text-sm text-slate-900 dark:text-white">{p.poin}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {p.ayatPendukung && (
                              <span className="px-2 py-0.5 rounded bg-purple-100 dark:bg-purple-900/80 text-purple-900 dark:text-purple-200 font-mono text-[10px] font-bold border border-purple-200 dark:border-purple-700">
                                {p.ayatPendukung}
                              </span>
                            )}
                            {p.durasiMenit && (
                              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">
                                ± {p.durasiMenit} Menit
                              </span>
                            )}
                          </div>
                        </div>

                        {p.penjelasan && (
                          <div className="pt-2 text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line border-t border-purple-200/60 dark:border-purple-800/40 font-sans">
                            {p.penjelasan}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Plain/Legacy Poin Khotbah fallback */}
              {(!selectedKhotbahDetail.poinUtama || selectedKhotbahDetail.poinUtama.length === 0) &&
                (selectedKhotbahDetail as any).poinKhotbah && (
                  <div className="space-y-1.5">
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-slate-100 border-b border-slate-200 dark:border-slate-800 pb-1 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-purple-600 dark:bg-purple-400"></span>
                      <span>II. Poin-Poin Khotbah</span>
                    </h4>
                    <div className="p-4 bg-white dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 leading-relaxed whitespace-pre-line text-xs">
                      {(selectedKhotbahDetail as any).poinKhotbah}
                    </div>
                  </div>
                )}

              {/* 3. Penerapan & Aplikasi Praktis */}
              {selectedKhotbahDetail.penerapanAplikasi && (
                <div className="space-y-1.5">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-slate-100 border-b border-slate-200 dark:border-slate-800 pb-1 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-600 dark:bg-emerald-400"></span>
                    <span>III. Penerapan &amp; Aplikasi Kehidupan Nyata</span>
                  </h4>
                  <div className="p-3.5 bg-emerald-50/50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800/60 text-emerald-950 dark:text-emerald-200 leading-relaxed whitespace-pre-line text-xs">
                    {selectedKhotbahDetail.penerapanAplikasi}
                  </div>
                </div>
              )}

              {/* 4. Penutup & Doa */}
              {selectedKhotbahDetail.penutupDoa && (
                <div className="space-y-1.5">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-slate-100 border-b border-slate-200 dark:border-slate-800 pb-1 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-indigo-600 dark:bg-indigo-400"></span>
                    <span>IV. Penutup &amp; Pokok Doa Firman</span>
                  </h4>
                  <div className="p-3.5 bg-indigo-50/50 dark:bg-indigo-950/40 rounded-xl border border-indigo-200 dark:border-indigo-800/60 text-indigo-950 dark:text-indigo-200 leading-relaxed whitespace-pre-line text-xs">
                    {selectedKhotbahDetail.penutupDoa}
                  </div>
                </div>
              )}

              {/* 5. Catatan Liturgis */}
              {selectedKhotbahDetail.catatanLiturgis && (
                <div className="space-y-1.5">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-slate-100 border-b border-slate-200 dark:border-slate-800 pb-1 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-600 dark:bg-amber-400"></span>
                    <span>V. Catatan Liturgis &amp; Konteks Ibadah</span>
                  </h4>
                  <div className="p-3 bg-amber-50/50 dark:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-800/60 text-amber-950 dark:text-amber-200 leading-relaxed text-xs">
                    {selectedKhotbahDetail.catatanLiturgis}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer Actions */}
            <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  const k = selectedKhotbahDetail;
                  const displayTitle = k.judulKhotbah || (k as any).judulTema || k.temaKhotbah || 'Rancangan Khotbah';
                  const displayCategory = k.jenisIbadah || (k as any).kategoriIbadah || 'Kebaktian Minggu';
                  const displayPoints = k.poinUtama || [];

                  const lines = [
                    `RANCANGAN KHOTBAH - ${settings.namaJemaat}`,
                    `Judul: ${displayTitle}`,
                    k.temaKhotbah ? `Tema: ${k.temaKhotbah}` : '',
                    `Nats Alkitab: ${k.natsAlkitab}`,
                    `Pelayan Firman: ${k.pengkhotbah}`,
                    `Tanggal: ${k.tanggal} | Jenis Ibadah: ${displayCategory} | Durasi: ${k.durasiTotalMenit || 20} Menit`,
                    k.metodeHomiletika ? `Metode Homiletika: ${k.metodeHomiletika}` : '',
                    k.nadaPastoral ? `Nada Pastoral: ${k.nadaPastoral}` : '',
                    '',
                    k.pendahuluan ? `--- PENDAHULUAN ---\n${k.pendahuluan}\n` : '',
                    '--- OUTLINE & POIN-POIN KHOTBAH ---',
                    displayPoints.length > 0
                      ? displayPoints.map((p, idx) => `Poin ${idx + 1}: ${p.poin}\nAyat Pendukung: ${p.ayatPendukung || '-'}\nPenjelasan: ${p.penjelasan || '-'}`).join('\n\n')
                      : ((k as any).poinKhotbah || '-'),
                    '',
                    k.penerapanAplikasi ? `--- PENERAPAN & APLIKASI PRAKTIS ---\n${k.penerapanAplikasi}\n` : '',
                    k.penutupDoa ? `--- PENUTUP & DOA ---\n${k.penutupDoa}` : '',
                  ].filter(Boolean);

                  navigator.clipboard.writeText(lines.join('\n'));
                  setCopiedKhotbahId(k.id);
                  setTimeout(() => setCopiedKhotbahId(null), 2500);
                }}
                className="btn-salin-teks px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-bold text-xs border border-slate-300 dark:border-slate-600 flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
              >
                {copiedKhotbahId === selectedKhotbahDetail.id ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span className="text-emerald-700 dark:text-emerald-300 font-extrabold">Naskah Tersalin!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-700 dark:text-slate-200 shrink-0" />
                    <span className="text-slate-900 dark:text-white font-bold">Salin Naskah Lengkap</span>
                  </>
                )}
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    openPrintReport({
                      reportType: 'rancangan_khotbah',
                      khotbahId: selectedKhotbahDetail.id,
                    })
                  }
                  className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-extrabold text-xs shadow-md flex items-center gap-1.5 transition-all cursor-pointer hover:scale-102 active:scale-98"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Cetak Dokumen PDF Resmi</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedKhotbahDetail(null)}
                  className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs transition-all cursor-pointer border border-transparent dark:border-slate-700"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* POPUP MODAL: PENDAFTARAN ANGGOTA JEMAAT BARU BERHASIL */}
      {showPendaftaranModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in">
          <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-6 transform transition-all">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-emerald-600 via-emerald-700 to-teal-800 p-6 text-white text-center relative">
              <button
                type="button"
                onClick={() => setShowPendaftaranModal(false)}
                className="absolute right-4 top-4 p-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white transition cursor-pointer"
                title="Tutup Popup"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-inner border border-white/30">
                <CheckCircle2 className="w-10 h-10 text-white" />
              </div>

              <span className="inline-block px-3.5 py-1 rounded-full bg-emerald-950/40 text-emerald-100 text-[11px] font-extrabold uppercase tracking-wider border border-white/20">
                Pendaftaran Berhasil Dikirim
              </span>

              <h3 className="text-xl sm:text-2xl font-black mt-2 text-white">
                Formulir Telah Diterima!
              </h3>

              <p className="text-xs text-emerald-100 mt-1 max-w-md mx-auto">
                Gereja Kalimantan Evangelis (GKE) • Majelis Jemaat {formattedMajelisJemaat}
              </p>
            </div>

            {/* Modal Body */}
            <div className="p-5 sm:p-6 space-y-4">
              <div className="text-center space-y-1">
                <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-200 leading-relaxed font-medium">
                  Terima kasih, data formulir pendaftaran warga jemaat baru telah berhasil dicatat ke dalam sistem pendaftaran mandiri.
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Data Anda langsung diteruskan ke Sekretariat MPH Majelis Jemaat {formattedMajelisJemaat} untuk diverifikasi dan dicatat pada Buku Induk Sensus Warga Jemaat GKE.
                </p>
              </div>

              {lastPendaftaranData && (
                <div className="bg-slate-50 dark:bg-slate-950/80 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 space-y-2.5 text-xs">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-slate-800">
                    <span className="text-slate-500 dark:text-slate-400 font-semibold">Nama Lengkap:</span>
                    <span className="font-extrabold text-slate-900 dark:text-white text-sm">
                      {lastPendaftaranData.namaLengkap}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-slate-800">
                    <span className="text-slate-500 dark:text-slate-400 font-semibold">NIK:</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-slate-200">
                      {lastPendaftaranData.nik}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-slate-800">
                    <span className="text-slate-500 dark:text-slate-400 font-semibold">Lingkungan / Rayon:</span>
                    <span className="font-bold text-slate-900 dark:text-slate-200">
                      {lastPendaftaranData.rayon}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-slate-800">
                    <span className="text-slate-500 dark:text-slate-400 font-semibold">Hubungan Keluarga:</span>
                    <span className="font-extrabold text-blue-700 dark:text-blue-400">
                      {lastPendaftaranData.hubunganKeluarga}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-0.5">
                    <span className="text-slate-500 dark:text-slate-400 font-semibold">Status Pengajuan:</span>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-950/80 border border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-300 font-extrabold text-[11px]">
                      <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                      Menunggu Konfirmasi MPH
                    </span>
                  </div>
                </div>
              )}

              <div className="p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 rounded-xl flex items-start gap-2.5 text-xs text-blue-950 dark:text-blue-200">
                <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                <p className="leading-normal text-[11px]">
                  Anda dapat memantau proses verifikasi secara berkala pada tabel <strong>"Lacak Status Pendaftaran Anggota Jemaat Baru"</strong> dengan mencari Nama atau NIK Anda.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setShowPendaftaranModal(false);
                    setTimeout(() => {
                      const el = document.getElementById('tracking-pendaftaran-section');
                      if (el) {
                        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }
                    }, 150);
                  }}
                  className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
                >
                  <Search className="w-4 h-4" />
                  <span>Lihat Status di Tabel</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowPendaftaranModal(false)}
                  className="w-full py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs transition-all cursor-pointer border border-slate-300 dark:border-slate-700"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <QrisPersembahanModal
        isOpen={isQrisModalOpen}
        onClose={() => setIsQrisModalOpen(false)}
      />
    </div>
  );
};
