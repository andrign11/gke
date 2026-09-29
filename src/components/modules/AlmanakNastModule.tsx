import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Calendar,
  BookOpen,
  Download,
  Upload,
  Plus,
  Search,
  Printer,
  FileSpreadsheet,
  FileText,
  RotateCcw,
  Edit2,
  Trash2,
  Check,
  Copy,
  Share2,
  Filter,
  Sparkles,
  Info,
  CalendarDays,
  Flame,
  AlertCircle,
  AlertTriangle,
  FileDown,
  X,
  CheckCircle2,
  Layers,
  Clock,
  Volume2,
  VolumeX,
  Type,
  BookMarked,
  Bookmark,
  Loader2,
  ExternalLink,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  SearchCode,
  Library,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { AlmanakNastGKE } from '../../types';
import {
  exportAlmanakToExcel,
  exportAlmanakToCsv,
  downloadAlmanakExcelTemplate,
  parseAlmanakExcelFile,
  parseAlmanakCsvFile,
  formatTanggalIndonesia,
  getNamaHari,
  isHolidayOrSunday,
  MONTHS_ID,
} from '../../utils/almanakExcelUtils';
import { findPerikopForReference, getPerikopTitle } from '../../utils/perikopData';

export interface AlmanakNastModuleProps {
  isAdmin?: boolean;
}

export const AlmanakNastModule: React.FC<AlmanakNastModuleProps> = ({ isAdmin: isAdminProp }) => {
  const {
    almanakNastList = [],
    addAlmanakNast,
    updateAlmanakNast,
    deleteAlmanakNast,
    importAlmanakNastBatch,
    resetAlmanakNastDefault,
    openPrintReport,
    viewMode,
    currentUser,
    showToast,
  } = useApp();

  const isAdmin =
    isAdminProp !== undefined
      ? isAdminProp
      : viewMode === 'admin' && currentUser?.role !== 'warga';

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBulan, setSelectedBulan] = useState<string>('semua');
  const [selectedTahun, setSelectedTahun] = useState<string>('semua');
  const [selectedKategori, setSelectedKategori] = useState<'semua' | 'minggu_hari_raya' | 'hari_biasa'>('semua');

  // Modals & UI States
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<AlmanakNastGKE | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [exportDropdownOpen, setExportDropdownOpen] = useState(false);

  // Bible Verse Popup Modal State
  const [selectedBibleModal, setSelectedBibleModal] = useState<{
    item: AlmanakNastGKE;
    activeType: 'bacaan' | 'khotbah';
    refString: string;
  } | null>(null);

  const [bibleLoading, setBibleLoading] = useState(false);
  const [bibleError, setBibleError] = useState<string | null>(null);
  const [bibleData, setBibleData] = useState<{
    reference: string;
    book?: { abbr: string; name: string; fullName: string; testament: string; group: string };
    pasal?: number;
    pasalEnd?: number;
    ayatStart?: number;
    ayatEnd?: number;
    totalVersesFound: number;
    verses: Array<{ id: number; kitab: string; kitabName: string; pasal: number; ayat: number; firman: string }>;
    perikop?: string | null;
  } | null>(null);

  const [fontSizeMode, setFontSizeMode] = useState<'normal' | 'large' | 'xlarge'>('normal');
  const [isSerif, setIsSerif] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [copiedVerseText, setCopiedVerseText] = useState(false);

  // Today's Live Verses Auto-Preview State (Direct from tb.csv)
  const [todayBacaanData, setTodayBacaanData] = useState<{
    reference: string;
    book?: { abbr: string; name: string; fullName: string };
    totalVersesFound: number;
    verses: Array<{ id: number; kitab: string; kitabName: string; pasal: number; ayat: number; firman: string }>;
    perikop?: string | null;
  } | null>(null);
  const [todayKhotbahData, setTodayKhotbahData] = useState<{
    reference: string;
    book?: { abbr: string; name: string; fullName: string };
    totalVersesFound: number;
    verses: Array<{ id: number; kitab: string; kitabName: string; pasal: number; ayat: number; firman: string }>;
    perikop?: string | null;
  } | null>(null);
  const [todayPreviewLoading, setTodayPreviewLoading] = useState(false);
  const [isTodayVersesOpen, setIsTodayVersesOpen] = useState(true);
  const [todayActivePreviewTab, setTodayActivePreviewTab] = useState<'bacaan' | 'khotbah'>('bacaan');

  // Form Live Alkitab Verifier State
  const [formVerifying, setFormVerifying] = useState(false);
  const [formVerifyTarget, setFormVerifyTarget] = useState<'bacaan' | 'khotbah' | null>(null);
  const [formVerifyData, setFormVerifyData] = useState<{
    reference: string;
    target: 'bacaan' | 'khotbah';
    bookName: string;
    totalVerses: number;
    preview: string;
  } | null>(null);
  const [formVerifyError, setFormVerifyError] = useState<string | null>(null);

  // Full-Text Bible Search Modal (tb.csv)
  const [isBibleSearchOpen, setIsBibleSearchOpen] = useState(false);
  const [bibleSearchQuery, setBibleSearchQuery] = useState('');
  const [bibleSearchTestament, setBibleSearchTestament] = useState<'ALL' | 'PL' | 'PB'>('ALL');
  const [bibleSearchResults, setBibleSearchResults] = useState<
    Array<{ id: number; kitab: string; kitabName: string; pasal: number; ayat: number; firman: string }>
  >([]);
  const [bibleSearchTotal, setBibleSearchTotal] = useState(0);
  const [bibleSearchLoading, setBibleSearchLoading] = useState(false);
  const [bibleSearchPage, setBibleSearchPage] = useState(1);
  const [bibleSearchExecuted, setBibleSearchExecuted] = useState(false);

  // Success & Alert Notification Modal State
  const [successModalData, setSuccessModalData] = useState<{
    title: string;
    message: string;
    subDetails?: string[];
    type: 'import' | 'edit' | 'add' | 'delete' | 'reset';
  } | null>(null);

  // Form State
  const [formTanggal, setFormTanggal] = useState('');
  const [formHari, setFormHari] = useState('');
  const [formKeteranganHari, setFormKeteranganHari] = useState('');
  const [formWarnaStola, setFormWarnaStola] = useState('');
  const [formNastBacaan, setFormNastBacaan] = useState('');
  const [formNastKhotbah, setFormNastKhotbah] = useState('');
  const [formJudulPerikop, setFormJudulPerikop] = useState('');
  const [formJudulPerikopKhotbah, setFormJudulPerikopKhotbah] = useState('');
  const [formIsHariRaya, setFormIsHariRaya] = useState(false);

  // Import State
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importMode, setImportMode] = useState<'append' | 'overwrite'>('append');
  const [importPreviewData, setImportPreviewData] = useState<Omit<AlmanakNastGKE, 'id'>[]>([]);
  const [importLoading, setImportLoading] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccessMsg, setImportSuccessMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Available Years from Data
  const availableYears = useMemo(() => {
    const years = new Set<string>();
    almanakNastList.forEach((item) => {
      if (item.tanggal) {
        const yr = item.tanggal.split('-')[0];
        if (yr && yr.length === 4) years.add(yr);
      }
    });
    if (years.size === 0) years.add(new Date().getFullYear().toString());
    return Array.from(years).sort((a, b) => b.localeCompare(a));
  }, [almanakNastList]);

  // Today's Date in local YYYY-MM-DD
  const todayStr = useMemo(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, []);

  // Today's Nast Row from Table
  const todayNast = useMemo(() => {
    if (!almanakNastList || almanakNastList.length === 0) return null;
    const found = almanakNastList.find((n) => n.tanggal === todayStr);
    if (found) return found;
    // If exact date not found, find closest match or fallback
    const sorted = [...almanakNastList].sort((a, b) => a.tanggal.localeCompare(b.tanggal));
    const futureOrToday = sorted.find((n) => n.tanggal >= todayStr);
    return futureOrToday || sorted[0] || null;
  }, [almanakNastList, todayStr]);

  // Nast Khotbah for today based on table (direct or Sunday of current week)
  const todayKhotbahInfo = useMemo(() => {
    if (!todayNast || !almanakNastList || almanakNastList.length === 0) return null;

    // If today's row in the table already has nastKhotbah
    if (todayNast.nastKhotbah && todayNast.nastKhotbah.trim()) {
      return {
        nastKhotbah: todayNast.nastKhotbah.trim(),
        source: 'hari_ini',
        label:
          todayNast.isHariRaya || (todayNast.hari && todayNast.hari.toLowerCase() === 'minggu')
            ? 'Nast Khotbah Ibadah Hari Ini'
            : 'Nast Khotbah Ibadah',
        item: todayNast,
        detail: `Sesuai nats khotbah ${todayNast.hari}, ${formatTanggalIndonesia(todayNast.tanggal)}`,
      };
    }

    // If today's row has empty nastKhotbah (e.g. weekday), look up the Sunday/Ibadah of the week in table
    const itemsWithKhotbah = almanakNastList.filter(
      (item) => item.nastKhotbah && item.nastKhotbah.trim()
    );

    if (itemsWithKhotbah.length === 0) return null;

    const todayDateObj = new Date(todayNast.tanggal);

    // Look for previous Sunday/service within 7 days
    const priorMatches = itemsWithKhotbah
      .filter((item) => {
        const itemDate = new Date(item.tanggal);
        const diff = (todayDateObj.getTime() - itemDate.getTime()) / (1000 * 60 * 60 * 24);
        return diff >= 0 && diff <= 7;
      })
      .sort((a, b) => b.tanggal.localeCompare(a.tanggal));

    if (priorMatches.length > 0) {
      const match = priorMatches[0];
      return {
        nastKhotbah: match.nastKhotbah.trim(),
        source: 'minggu_terkait',
        label: `Nast Khotbah Ibadah (${match.hari})`,
        item: match,
        detail: `Berdasarkan Ibadah ${match.hari}, ${formatTanggalIndonesia(match.tanggal)}`,
      };
    }

    // Look for upcoming Sunday/service within 7 days
    const nextMatches = itemsWithKhotbah
      .filter((item) => {
        const itemDate = new Date(item.tanggal);
        const diff = (itemDate.getTime() - todayDateObj.getTime()) / (1000 * 60 * 60 * 24);
        return diff > 0 && diff <= 7;
      })
      .sort((a, b) => a.tanggal.localeCompare(b.tanggal));

    if (nextMatches.length > 0) {
      const match = nextMatches[0];
      return {
        nastKhotbah: match.nastKhotbah.trim(),
        source: 'minggu_terkait',
        label: `Nast Khotbah Ibadah (${match.hari})`,
        item: match,
        detail: `Berdasarkan Ibadah ${match.hari}, ${formatTanggalIndonesia(match.tanggal)}`,
      };
    }

    // Fallback to first available khotbah entry in table
    const fallback = itemsWithKhotbah[0];
    return {
      nastKhotbah: fallback.nastKhotbah.trim(),
      source: 'tabel',
      label: `Nast Khotbah Ibadah (${fallback.hari})`,
      item: fallback,
      detail: `Berdasarkan jadwal ${fallback.hari}, ${formatTanggalIndonesia(fallback.tanggal)}`,
    };
  }, [todayNast, almanakNastList]);

  // Filtered List
  const filteredList = useMemo(() => {
    return almanakNastList
      .filter((item) => {
        // Search Term Filter
        if (searchTerm.trim()) {
          const term = searchTerm.toLowerCase();
          const matchTanggal = (item.tanggal || '').toLowerCase().includes(term);
          const matchHari = (item.hari || '').toLowerCase().includes(term);
          const matchKet = (item.keteranganHari || '').toLowerCase().includes(term);
          const matchStola = (item.warnaStola || '').toLowerCase().includes(term);
          const matchBacaan = (item.nastBacaan || '').toLowerCase().includes(term);
          const matchKhotbah = (item.nastKhotbah || '').toLowerCase().includes(term);
          const perikopText = (
            (item.judulPerikop || '') +
            ' ' +
            (item.judulPerikopBacaan || '') +
            ' ' +
            (item.judulPerikopKhotbah || '') +
            ' ' +
            (item.perikop || '') +
            ' ' +
            (item.nastBacaan ? findPerikopForReference(item.nastBacaan) || '' : '') +
            ' ' +
            (item.nastKhotbah ? findPerikopForReference(item.nastKhotbah) || '' : '')
          ).toLowerCase();
          const matchPerikop = perikopText.includes(term);

          if (!matchTanggal && !matchHari && !matchKet && !matchStola && !matchBacaan && !matchKhotbah && !matchPerikop) {
            return false;
          }
        }

        // Year Filter
        if (selectedTahun !== 'semua' && item.tanggal) {
          if (!item.tanggal.startsWith(selectedTahun)) return false;
        }

        // Month Filter
        if (selectedBulan !== 'semua' && item.tanggal) {
          const parts = item.tanggal.split('-');
          if (parts.length >= 2) {
            const m = parseInt(parts[1], 10);
            if (m.toString() !== selectedBulan && parts[1] !== selectedBulan) {
              return false;
            }
          }
        }

        // Category Filter
        if (selectedKategori === 'minggu_hari_raya') {
          if (!isHolidayOrSunday(item)) return false;
        } else if (selectedKategori === 'hari_biasa') {
          if (isHolidayOrSunday(item)) return false;
        }

        return true;
      })
      .sort((a, b) => a.tanggal.localeCompare(b.tanggal));
  }, [almanakNastList, searchTerm, selectedTahun, selectedBulan, selectedKategori]);

  // Helper to extract or detect perikop title from database or catalog
  const getPerikopForNast = (
    item?: AlmanakNastGKE | null,
    type: 'bacaan' | 'khotbah' = 'bacaan',
    apiPerikop?: string | null
  ): string | null => {
    if (!item) return apiPerikop || null;
    if (type === 'bacaan') {
      return (
        item.judulPerikop ||
        item.judulPerikopBacaan ||
        item.perikop ||
        apiPerikop ||
        (item.nastBacaan ? findPerikopForReference(item.nastBacaan) : null) ||
        null
      );
    } else {
      return (
        item.judulPerikopKhotbah ||
        apiPerikop ||
        (item.nastKhotbah ? findPerikopForReference(item.nastKhotbah) : null) ||
        null
      );
    }
  };

  // Active Perikop Title in the Bible Popup Modal
  const modalPerikopTitle = useMemo(() => {
    if (!selectedBibleModal) return null;
    const isKhotbah = selectedBibleModal.activeType === 'khotbah';
    const item = selectedBibleModal.item;
    return getPerikopForNast(item, isKhotbah ? 'khotbah' : 'bacaan', bibleData?.perikop);
  }, [selectedBibleModal, bibleData]);

  // Audio Speech Synthesis cleanup
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Auto-fetch today's Bible Verses directly from tb.csv for the Spotlight section
  useEffect(() => {
    let isCancelled = false;

    const loadTodayVerses = async () => {
      if (!todayNast) {
        setTodayBacaanData(null);
        setTodayKhotbahData(null);
        return;
      }

      setTodayPreviewLoading(true);

      try {
        // 1. Fetch Today's Bacaan Harian
        if (todayNast.nastBacaan && todayNast.nastBacaan.trim()) {
          const resBacaan = await fetch(
            `/api/alkitab/lookup?ref=${encodeURIComponent(todayNast.nastBacaan.trim())}`
          );
          const jsonBacaan = await resBacaan.json();
          if (!isCancelled && jsonBacaan.success) {
            setTodayBacaanData(jsonBacaan);
          } else if (!isCancelled) {
            setTodayBacaanData(null);
          }
        } else {
          setTodayBacaanData(null);
        }

        // 2. Fetch Today's / Weekly Khotbah
        const khotbahRef = todayKhotbahInfo?.nastKhotbah;
        if (khotbahRef && khotbahRef.trim()) {
          const resKhotbah = await fetch(
            `/api/alkitab/lookup?ref=${encodeURIComponent(khotbahRef.trim())}`
          );
          const jsonKhotbah = await resKhotbah.json();
          if (!isCancelled && jsonKhotbah.success) {
            setTodayKhotbahData(jsonKhotbah);
          } else if (!isCancelled) {
            setTodayKhotbahData(null);
          }
        } else {
          setTodayKhotbahData(null);
        }
      } catch (err) {
        console.error('Gagal mengambil teks firman hari ini dari tb.csv:', err);
      } finally {
        if (!isCancelled) {
          setTodayPreviewLoading(false);
        }
      }
    };

    loadTodayVerses();

    return () => {
      isCancelled = true;
    };
  }, [todayNast?.id, todayNast?.nastBacaan, todayKhotbahInfo?.nastKhotbah]);

  // Form Live Alkitab Verifier (Direct against tb.csv)
  const handleVerifyFormRef = async (target: 'bacaan' | 'khotbah') => {
    const rawVal = target === 'bacaan' ? formNastBacaan : formNastKhotbah;
    if (!rawVal || !rawVal.trim()) {
      showToast(
        `Silakan ketik nats ${target === 'bacaan' ? 'bacaan harian' : 'khotbah'} terlebih dahulu`,
        'error'
      );
      return;
    }

    setFormVerifying(true);
    setFormVerifyTarget(target);
    setFormVerifyError(null);
    setFormVerifyData(null);

    try {
      const res = await fetch(`/api/alkitab/lookup?ref=${encodeURIComponent(rawVal.trim())}`);
      const json = await res.json();
      if (json.success && json.verses && json.verses.length > 0) {
        const previewText = json.verses
          .slice(0, 2)
          .map((v: any) => `${v.ayat}. ${v.firman}`)
          .join(' ');
        setFormVerifyData({
          reference: json.reference || rawVal,
          target,
          bookName: json.book?.fullName || json.book?.name || 'Alkitab',
          totalVerses: json.totalVersesFound || json.verses.length,
          preview: previewText + (json.verses.length > 2 ? ' ...' : ''),
        });
        showToast(
          `✅ Berhasil diverifikasi: ${json.verses.length} ayat ditemukan di Alkitab (TB.csv)`,
          'success'
        );
      } else {
        setFormVerifyError(
          json.error || `Nats "${rawVal}" tidak ditemukan di database Alkitab Terjemahan Baru (TB.csv).`
        );
      }
    } catch (err: any) {
      setFormVerifyError(err?.message || 'Gagal memeriksa database Alkitab.');
    } finally {
      setFormVerifying(false);
    }
  };

  // Bible Keyword Search Function (tb.csv)
  const handleExecuteBibleSearch = async (queryOverride?: string, page = 1) => {
    const q = queryOverride !== undefined ? queryOverride : bibleSearchQuery;
    if (!q || !q.trim()) {
      showToast('Ketik kata kunci pencarian ayat Alkitab', 'error');
      return;
    }

    setBibleSearchLoading(true);
    setBibleSearchExecuted(true);

    try {
      const testamentParam = bibleSearchTestament !== 'ALL' ? `&testament=${bibleSearchTestament}` : '';
      const res = await fetch(
        `/api/alkitab/search?q=${encodeURIComponent(q.trim())}&limit=40${testamentParam}`
      );
      const json = await res.json();
      if (json.success) {
        setBibleSearchResults(json.results || []);
        setBibleSearchTotal(json.totalMatches || 0);
        setBibleSearchPage(page);
      } else {
        setBibleSearchResults([]);
        setBibleSearchTotal(0);
      }
    } catch (err: any) {
      console.error('Bible search error:', err);
      showToast('Gagal melakukan pencarian Alkitab', 'error');
    } finally {
      setBibleSearchLoading(false);
    }
  };

  // Bible Lookup Functions
  const fetchBibleVerses = async (ref: string) => {
    if (!ref || !ref.trim()) return;
    setBibleLoading(true);
    setBibleError(null);
    setBibleData(null);
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }

    try {
      const res = await fetch(`/api/alkitab/lookup?ref=${encodeURIComponent(ref.trim())}`);
      const json = await res.json();
      if (json.success && json.verses && json.verses.length > 0) {
        setBibleData(json);
      } else {
        setBibleError(
          json.error || `Teks ayat untuk nats "${ref}" tidak ditemukan di database Alkitab Terjemahan Baru.`
        );
      }
    } catch (err: any) {
      setBibleError(err?.message || 'Gagal terhubung ke database Alkitab.');
    } finally {
      setBibleLoading(false);
    }
  };

  const handleOpenBibleModal = (item: AlmanakNastGKE, type: 'bacaan' | 'khotbah') => {
    const targetRef = type === 'bacaan' ? item.nastBacaan : item.nastKhotbah;
    if (!targetRef) return;
    setSelectedBibleModal({
      item,
      activeType: type,
      refString: targetRef,
    });
    fetchBibleVerses(targetRef);
  };

  const handleSwitchBibleTab = (type: 'bacaan' | 'khotbah') => {
    if (!selectedBibleModal) return;
    const targetRef = type === 'bacaan' ? selectedBibleModal.item.nastBacaan : selectedBibleModal.item.nastKhotbah;
    if (!targetRef) return;
    setSelectedBibleModal({
      ...selectedBibleModal,
      activeType: type,
      refString: targetRef,
    });
    fetchBibleVerses(targetRef);
  };

  const handleToggleAudio = () => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      showToast('Fitur Audio TTS tidak didukung browser ini', 'error');
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    if (!bibleData || !bibleData.verses || bibleData.verses.length === 0) return;

    const fullText = bibleData.verses.map((v) => `Ayat ${v.ayat}. ${v.firman}`).join('. ');
    const perikopVoice = modalPerikopTitle ? `Perikop: ${modalPerikopTitle}. ` : '';
    const intro = `${bibleData.book?.fullName || bibleData.book?.name || ''} ${bibleData.reference}. ${perikopVoice}${fullText}`;

    const utterance = new SpeechSynthesisUtterance(intro);
    utterance.lang = 'id-ID';
    utterance.rate = 0.95;
    utterance.pitch = 1.0;

    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  const handleCopyModalVerseText = () => {
    if (!bibleData || !bibleData.verses || !selectedBibleModal) return;
    const versesFormatted = bibleData.verses.map((v) => `${v.ayat}. ${v.firman}`).join('\n');
    const context = selectedBibleModal.item;
    const typeLabel = selectedBibleModal.activeType === 'khotbah' ? 'NAST KHOTBAH IBADAH' : 'NAST BACAAN HARIAN';
    const perikopLine = modalPerikopTitle ? `🏷️ *Perikop:* "${modalPerikopTitle}"\n` : '';

    const text = `📖 *${typeLabel} GKE*\n📅 *${context.hari || ''}, ${context.tanggal ? formatTanggalIndonesia(context.tanggal) : ''}*\n${context.keteranganHari ? `✨ _${context.keteranganHari}_\n` : ''}📜 *${bibleData.reference} (${bibleData.book?.fullName || bibleData.book?.name || ''})*\n${perikopLine}\n${versesFormatted}\n\n✝️ _Gereja Kalimantan Evangelis (GKE) - Terjemahan Baru (TB)_`;

    navigator.clipboard.writeText(text).then(() => {
      setCopiedVerseText(true);
      showToast('Teks nats dan firman berhasil disalin!', 'success');
      setTimeout(() => setCopiedVerseText(false), 3000);
    });
  };

  const handlePrintModalVerse = () => {
    if (!bibleData || !bibleData.verses || !selectedBibleModal) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      showToast('Gagal membuka jendela cetak, periksa izin pop-up browser.', 'error');
      return;
    }
    const versesHtml = bibleData.verses
      .map(
        (v) =>
          `<p style="margin-bottom: 12px; line-height: 1.7; font-size: 16px;"><sup style="font-weight: bold; color: #1e40af; margin-right: 6px; font-size: 13px;">${v.ayat}</sup>${v.firman}</p>`
      )
      .join('');
    const context = selectedBibleModal.item;
    const perikopHtml = modalPerikopTitle
      ? `<div style="font-size: 16px; font-weight: bold; color: #1e3a8a; margin-bottom: 14px; font-style: italic; background-color: #f1f5f9; padding: 8px 12px; border-radius: 6px;">Judul Perikop: &ldquo;${modalPerikopTitle}&rdquo;</div>`
      : '';

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${bibleData.reference} - Firman Tuhan (GKE)</title>
          <meta charset="utf-8" />
          <style>
            body { font-family: 'Times New Roman', Georgia, serif; padding: 40px; color: #0f172a; max-width: 800px; margin: 0 auto; }
            .header { border-bottom: 2px solid #0f172a; padding-bottom: 14px; margin-bottom: 24px; }
            .church-title { font-size: 22px; font-weight: bold; text-transform: uppercase; margin: 0; color: #0f172a; }
            .sub { font-size: 14px; color: #475569; margin-top: 4px; }
            .badge { display: inline-block; background: #e2e8f0; color: #1e293b; padding: 4px 10px; border-radius: 6px; font-size: 12px; font-weight: bold; margin-bottom: 12px; text-transform: uppercase; }
            .nats-title { font-size: 24px; font-weight: bold; margin: 8px 0 10px 0; color: #0f172a; }
            .content { text-align: justify; border-left: 3px solid #cbd5e1; padding-left: 18px; margin-bottom: 30px; }
            .footer { margin-top: 30px; border-top: 1px dashed #cbd5e1; padding-top: 12px; font-size: 12px; color: #64748b; text-align: center; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="church-title">Gereja Kalimantan Evangelis (GKE)</div>
            <div class="sub">Almanak Nast &bull; ${context.hari || ''}, ${context.tanggal ? formatTanggalIndonesia(context.tanggal) : ''} ${context.keteranganHari ? `&bull; ${context.keteranganHari}` : ''} ${context.warnaStola ? `(Stola: ${context.warnaStola})` : ''}</div>
          </div>
          <div>
            <span class="badge">${selectedBibleModal.activeType === 'khotbah' ? '✝️ NAST KHOTBAH IBADAH' : '📖 NAST BACAAN HARIAN'}</span>
            <h1 class="nats-title">${bibleData.reference} &bull; ${bibleData.book?.fullName || bibleData.book?.name || ''}</h1>
            ${perikopHtml}
          </div>
          <div class="content">
            ${versesHtml}
          </div>
          <div class="footer">
            Alkitab Terjemahan Baru (TB) Lembaga Alkitab Indonesia (LAI) &bull; Sistem Digital Pelayanan Jemaat GKE
          </div>
          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Open Form for Create
  const handleOpenCreateModal = () => {
    setEditingId(null);
    const nextDate = todayStr;
    setFormTanggal(nextDate);
    setFormHari(getNamaHari(nextDate));
    setFormKeteranganHari('');
    setFormWarnaStola('Hijau');
    setFormNastBacaan('');
    setFormNastKhotbah('');
    setFormJudulPerikop('');
    setFormJudulPerikopKhotbah('');
    setFormIsHariRaya(false);
    setIsFormModalOpen(true);
  };

  // Open Form for Edit
  const handleOpenEditModal = (item: AlmanakNastGKE) => {
    setEditingId(item.id);
    setFormTanggal(item.tanggal);
    setFormHari(item.hari || getNamaHari(item.tanggal));
    setFormKeteranganHari(item.keteranganHari || '');
    setFormWarnaStola(item.warnaStola || '');
    setFormNastBacaan(item.nastBacaan || '');
    setFormNastKhotbah(item.nastKhotbah || '');
    setFormJudulPerikop(item.judulPerikop || item.judulPerikopBacaan || item.perikop || '');
    setFormJudulPerikopKhotbah(item.judulPerikopKhotbah || '');
    setFormIsHariRaya(item.isHariRaya || false);
    setIsFormModalOpen(true);
  };

  // Handle Date Change in Form to auto-set Day
  const handleDateChange = (dateVal: string) => {
    setFormTanggal(dateVal);
    const day = getNamaHari(dateVal);
    if (day) {
      setFormHari(day);
      if (day === 'Minggu') {
        setFormIsHariRaya(true);
      }
    }
  };

  // Save Form
  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTanggal || !formNastBacaan) {
      alert('Mohon lengkapi Tanggal dan Nast Bacaan.');
      return;
    }

    const isEdit = !!editingId;
    const formattedTgl = formatTanggalIndonesia(formTanggal);
    const detectedBacaanPerikop = formJudulPerikop.trim() || findPerikopForReference(formNastBacaan.trim()) || undefined;
    const detectedKhotbahPerikop = formJudulPerikopKhotbah.trim() || (formNastKhotbah.trim() ? findPerikopForReference(formNastKhotbah.trim()) : undefined) || undefined;

    const payload: Omit<AlmanakNastGKE, 'id'> = {
      tanggal: formTanggal,
      hari: formHari || getNamaHari(formTanggal),
      keteranganHari: formKeteranganHari.trim(),
      warnaStola: formWarnaStola.trim(),
      nastBacaan: formNastBacaan.trim(),
      nastKhotbah: formNastKhotbah.trim(),
      judulPerikop: detectedBacaanPerikop,
      judulPerikopBacaan: detectedBacaanPerikop,
      judulPerikopKhotbah: detectedKhotbahPerikop,
      perikop: detectedBacaanPerikop,
      isHariRaya: formIsHariRaya || isHolidayOrSunday({ tanggal: formTanggal, hari: formHari, keteranganHari: formKeteranganHari }),
    };

    if (isEdit && editingId) {
      await updateAlmanakNast(editingId, payload);
      setIsFormModalOpen(false);
      setEditingId(null);
      showToast(`Data Almanak Nast untuk ${formattedTgl} berhasil diperbarui!`, 'success');
      setSuccessModalData({
        title: 'Data Almanak Nast Berhasil Diperbarui!',
        message: `Perubahan data nast bacaan untuk hari ${formHari || getNamaHari(formTanggal)}, ${formattedTgl} telah berhasil disimpan ke database.`,
        subDetails: [
          `Tanggal & Hari: ${formHari || getNamaHari(formTanggal)}, ${formattedTgl}`,
          `Nast Bacaan: ${formNastBacaan.trim()}`,
          detectedBacaanPerikop ? `Judul Perikop Bacaan: "${detectedBacaanPerikop}"` : '',
          formNastKhotbah.trim() ? `Nast Khotbah: ${formNastKhotbah.trim()}` : '',
          detectedKhotbahPerikop ? `Judul Perikop Khotbah: "${detectedKhotbahPerikop}"` : '',
          formWarnaStola.trim() ? `Warna Stola: ${formWarnaStola.trim()}` : '',
          formKeteranganHari.trim() ? `Keterangan: ${formKeteranganHari.trim()}` : '',
        ].filter(Boolean),
        type: 'edit',
      });
    } else {
      await addAlmanakNast(payload);
      setIsFormModalOpen(false);
      setEditingId(null);
      showToast(`Entri Nast baru untuk ${formattedTgl} berhasil ditambahkan!`, 'success');
      setSuccessModalData({
        title: 'Entri Nast Baru Berhasil Ditambahkan!',
        message: `Data nast bacaan baru untuk hari ${formHari || getNamaHari(formTanggal)}, ${formattedTgl} telah tersimpan dengan aman di database.`,
        subDetails: [
          `Tanggal & Hari: ${formHari || getNamaHari(formTanggal)}, ${formattedTgl}`,
          `Nast Bacaan: ${formNastBacaan.trim()}`,
          detectedBacaanPerikop ? `Judul Perikop Bacaan: "${detectedBacaanPerikop}"` : '',
          formNastKhotbah.trim() ? `Nast Khotbah: ${formNastKhotbah.trim()}` : '',
          detectedKhotbahPerikop ? `Judul Perikop Khotbah: "${detectedKhotbahPerikop}"` : '',
          formWarnaStola.trim() ? `Warna Stola: ${formWarnaStola.trim()}` : '',
          formKeteranganHari.trim() ? `Keterangan: ${formKeteranganHari.trim()}` : '',
        ].filter(Boolean),
        type: 'add',
      });
    }
  };

  // Delete Action
  const handleDeleteItem = async (item: AlmanakNastGKE) => {
    const formattedTgl = formatTanggalIndonesia(item.tanggal);
    await deleteAlmanakNast(item.id);
    setItemToDelete(null);
    showToast(`Data Nast ${formattedTgl} berhasil dihapus.`, 'info');
    setSuccessModalData({
      title: 'Data Almanak Nast Berhasil Dihapus',
      message: `Entri nast bacaan untuk hari ${item.hari}, ${formattedTgl} (${item.nastBacaan}) telah berhasil dihapus dari database sistem.`,
      type: 'delete',
    });
  };

  // Copy WhatsApp format
  const handleCopyWhatsApp = (item: AlmanakNastGKE) => {
    const formattedDate = formatTanggalIndonesia(item.tanggal);
    const khotbahText = item.nastKhotbah || (todayKhotbahInfo && item.id === todayNast?.id ? todayKhotbahInfo.nastKhotbah : '');
    const khotbahNote = !item.nastKhotbah && todayKhotbahInfo && item.id === todayNast?.id ? ` _(${todayKhotbahInfo.detail})_` : '';
    const bacaanPerikop = getPerikopForNast(item, 'bacaan');
    const khotbahPerikop = khotbahText ? (item.nastKhotbah ? getPerikopForNast(item, 'khotbah') : (todayKhotbahInfo ? getPerikopForNast(todayKhotbahInfo.item, 'khotbah') : null)) : null;

    const text = `📖 *ALMANAK NAST GKE — SINODE GEREJA KALIMANTAN EVANGELIS*
🗓 *${item.hari}, ${formattedDate}*
${item.keteranganHari ? `✨ *Keterangan:* ${item.keteranganHari}\n` : ''}${item.warnaStola ? `🎨 *Warna Liturgi/Stola:* ${item.warnaStola}\n` : ''}
📖 *Nast Bacaan Harian:*
👉 ${item.nastBacaan}${bacaanPerikop ? `\n🏷️ *Perikop:* "${bacaanPerikop}"` : ''}
${khotbahText ? `\n✝️ *Nast Khotbah Ibadah:*${khotbahNote}
👉 ${khotbahText}${khotbahPerikop ? `\n🏷️ *Perikop Khotbah:* "${khotbahPerikop}"` : ''}\n` : ''}
_Tuhan Yesus Memberkati Pelayanan dan Persekutuan Kita Bersama!_ 🙏`;

    navigator.clipboard.writeText(text);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 3000);
  };

  // Handle File Selected for Import
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportFile(file);
    setImportError(null);
    setImportSuccessMsg(null);
    setImportLoading(true);

    try {
      let parsed: Omit<AlmanakNastGKE, 'id'>[] = [];
      const fileName = file.name.toLowerCase();

      if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
        parsed = await parseAlmanakExcelFile(file);
      } else if (fileName.endsWith('.csv') || fileName.endsWith('.txt')) {
        parsed = await parseAlmanakCsvFile(file);
      } else {
        throw new Error('Format file tidak didukung. Silakan gunakan file Excel (.xlsx) atau CSV (.csv).');
      }

      if (parsed.length === 0) {
        throw new Error('File tidak memuat data yang valid atau format kolom tidak sesuai.');
      }

      setImportPreviewData(parsed);
    } catch (err: any) {
      setImportError(err.message || 'Gagal membaca isi file.');
      setImportPreviewData([]);
    } finally {
      setImportLoading(false);
    }
  };

  // Commit Batch Import
  const handleCommitImport = async () => {
    if (importPreviewData.length === 0) return;
    const count = importPreviewData.length;
    const currentMode = importMode;
    const fileName = importFile?.name || 'File';
    
    // Sort dates to show date range in summary
    const sortedDates = [...importPreviewData].sort((a, b) => a.tanggal.localeCompare(b.tanggal));
    const firstDate = sortedDates[0]?.tanggal ? formatTanggalIndonesia(sortedDates[0].tanggal) : '';
    const lastDate = sortedDates[sortedDates.length - 1]?.tanggal ? formatTanggalIndonesia(sortedDates[sortedDates.length - 1].tanggal) : '';

    setImportLoading(true);
    setImportError(null);

    const result = await importAlmanakNastBatch(importPreviewData, importMode);
    setImportLoading(false);

    if (result.success) {
      setIsImportModalOpen(false);
      setImportFile(null);
      setImportPreviewData([]);
      setImportSuccessMsg(null);

      showToast(`Sukses mengimpor ${count} data Almanak Nast!`, 'success');
      setSuccessModalData({
        title: 'Impor Data Almanak Nast Berhasil!',
        message: result.message || `Sebanyak ${count} baris data Almanak Nast Sinode GKE berhasil diproses dan disimpan ke database cloud.`,
        subDetails: [
          `File Sumber: ${fileName}`,
          `Total Nast Terimpor: ${count} Baris Data`,
          `Metode Impor: ${currentMode === 'overwrite' ? 'Timpa Seluruh Data Lama (Overwrite)' : 'Tambahkan / Gabungkan Data (Append)'}`,
          firstDate && lastDate ? `Rentang Tanggal: ${firstDate} s/d ${lastDate}` : '',
          'Penyimpanan: Database Firebase Cloud Firestore',
        ].filter(Boolean),
        type: 'import',
      });
    } else {
      setImportError(result.message || 'Gagal menyimpan data impor.');
    }
  };

  // Stola Color Badge Helper
  const getStolaBadgeStyle = (stola?: string) => {
    if (!stola) return 'bg-slate-100 text-slate-700 border-slate-300';
    const s = stola.toLowerCase();
    if (s.includes('putih') && s.includes('kuning')) {
      return 'bg-amber-100 text-amber-900 border-amber-300 font-bold';
    }
    if (s.includes('putih')) return 'bg-slate-100 text-slate-900 border-slate-300 font-bold';
    if (s.includes('hijau')) return 'bg-emerald-100 text-emerald-900 border-emerald-300 font-bold';
    if (s.includes('merah')) return 'bg-rose-100 text-rose-900 border-rose-300 font-bold';
    if (s.includes('ungu')) return 'bg-purple-100 text-purple-900 border-purple-300 font-bold';
    if (s.includes('hitam')) return 'bg-slate-900 text-white border-slate-700 font-bold';
    if (s.includes('kuning')) return 'bg-amber-100 text-amber-900 border-amber-300 font-bold';
    return 'bg-slate-100 text-slate-800 border-slate-300';
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Header Card */}
      <div className="bg-gradient-to-r from-slate-900 via-rose-950 to-slate-900 text-white rounded-2xl p-5 sm:p-6 shadow-xl border border-rose-800/40">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="bg-rose-600/30 text-rose-300 border border-rose-500/40 text-[11px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                Sinode Gereja Kalimantan Evangelis (GKE)
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2.5 tracking-tight text-white">
              <BookOpen className="w-6 h-6 text-rose-400 shrink-0" />
              <span>Almanak Nast GKE</span>
            </h1>
            <p className="text-xs sm:text-sm text-rose-200/80 max-w-2xl">
              Panduan Nast Bacaan Alkitab Harian dan Nast Khotbah Liturgis untuk layanan ibadah, persekutuan jemaat, serta seksi pelayanan kategorial GKE.
            </p>
          </div>

          {/* Header Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Print / PDF Button */}
            <button
              onClick={() => openPrintReport('almanak_nast_gke')}
              className="flex items-center gap-1.5 bg-rose-600 hover:bg-rose-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
              title="Cetak atau Simpan Laporan Nast ke PDF"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak / Save PDF</span>
            </button>

            {/* Export Dropdown */}
            <div className="relative">
              <button
                onClick={() => setExportDropdownOpen(!exportDropdownOpen)}
                className="flex items-center gap-1.5 bg-slate-800/90 hover:bg-slate-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold border border-slate-700 transition cursor-pointer"
              >
                <Download className="w-4 h-4 text-emerald-400" />
                <span>Export Data</span>
              </button>

              {exportDropdownOpen && (
                <div
                  className="absolute right-0 mt-2 w-56 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-30 py-1.5 text-xs text-white divide-y divide-slate-800"
                  onClick={() => setExportDropdownOpen(false)}
                >
                  <div className="p-1">
                    <button
                      onClick={() =>
                        exportAlmanakToExcel(filteredList, {
                          filterBulan: selectedBulan,
                          filterTahun: selectedTahun,
                        })
                      }
                      className="w-full text-left px-3 py-2 hover:bg-slate-800 rounded-lg flex items-center gap-2 cursor-pointer text-emerald-400 font-semibold"
                    >
                      <FileSpreadsheet className="w-4 h-4" />
                      <span>Export Excel (.xlsx) Resmi</span>
                    </button>
                    <button
                      onClick={() => exportAlmanakToCsv(filteredList)}
                      className="w-full text-left px-3 py-2 hover:bg-slate-800 rounded-lg flex items-center gap-2 cursor-pointer text-sky-400 font-semibold"
                    >
                      <FileText className="w-4 h-4" />
                      <span>Export CSV (.csv)</span>
                    </button>
                  </div>
                  <div className="p-1">
                    <button
                      onClick={() => downloadAlmanakExcelTemplate()}
                      className="w-full text-left px-3 py-2 hover:bg-slate-800 rounded-lg flex items-center gap-2 cursor-pointer text-amber-400 font-medium"
                    >
                      <FileDown className="w-4 h-4" />
                      <span>Unduh Template Format</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Cari di Alkitab TB.csv Button */}
            <button
              onClick={() => {
                setIsBibleSearchOpen(true);
                if (!bibleSearchExecuted && todayNast?.nastBacaan) {
                  const bookName = todayNast.nastBacaan.split(' ')[0] || '';
                  if (bookName) {
                    setBibleSearchQuery(bookName);
                    handleExecuteBibleSearch(bookName, 1);
                  }
                }
              }}
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
              title="Cari ayat atau kata kunci firman di database Alkitab Terjemahan Baru (TB.csv)"
            >
              <SearchCode className="w-4 h-4 text-blue-200" />
              <span>Cari Firman (TB.csv)</span>
            </button>

            {/* Admin Import & Add Buttons */}
            {isAdmin && (
              <>
                <button
                  onClick={() => {
                    setImportFile(null);
                    setImportPreviewData([]);
                    setImportError(null);
                    setImportSuccessMsg(null);
                    setIsImportModalOpen(true);
                  }}
                  className="flex items-center gap-1.5 bg-slate-800/90 hover:bg-slate-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold border border-slate-700 transition cursor-pointer"
                  title="Impor Data Nast dari Excel / CSV"
                >
                  <Upload className="w-4 h-4 text-blue-400" />
                  <span>Import Data</span>
                </button>

                <button
                  onClick={handleOpenCreateModal}
                  className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah Nast</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Today / Active Highlighted Card */}
      {todayNast && (
        <div className="almanak-today-card bg-gradient-to-br from-rose-50 via-white to-amber-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950 rounded-2xl p-5 border-2 border-rose-200 dark:border-slate-800 shadow-sm relative overflow-hidden space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1.5 flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className="almanak-today-badge badge-rose-white badge-red-white bg-rose-600 !text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1 shadow-2xs"
                  style={{ color: '#ffffff', backgroundColor: '#e11d48' }}
                >
                  <CalendarDays className="w-3 h-3 !text-white text-white" style={{ color: '#ffffff', stroke: '#ffffff' }} />
                  <span className="!text-white text-white font-bold" style={{ color: '#ffffff' }}>Almanak &amp; Nast Hari Ini: {todayNast.hari}, {formatTanggalIndonesia(todayNast.tanggal)}</span>
                </span>
                {todayNast.warnaStola && (
                  <span className={`text-[10px] px-2.5 py-0.5 rounded-full border ${getStolaBadgeStyle(todayNast.warnaStola)}`}>
                    Stola: {todayNast.warnaStola}
                  </span>
                )}
                {todayNast.keteranganHari && (
                  <span className="text-[11px] font-bold text-rose-800 dark:text-rose-200 bg-rose-100 dark:bg-rose-950/80 border border-rose-300 dark:border-rose-800 px-2.5 py-0.5 rounded-full">
                    {todayNast.keteranganHari}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                {/* Nast Bacaan Harian Card */}
                <div className="almanak-subcard-bacaan bg-white dark:bg-slate-800/95 p-3.5 rounded-xl border border-blue-200 dark:border-blue-700/80 hover:border-blue-400 dark:hover:border-blue-500 shadow-2xs transition group">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-blue-900 dark:text-blue-200 flex items-center gap-1.5">
                      <BookOpen className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      Nast Bacaan Harian:
                    </span>
                    {todayNast.nastBacaan && (
                      <span className="text-[10px] bg-blue-100 dark:bg-blue-900/60 group-hover:bg-blue-600 text-blue-800 dark:text-blue-200 group-hover:text-white dark:group-hover:text-white font-bold px-2 py-0.5 rounded-full border border-blue-200 dark:border-blue-700 transition flex items-center gap-0.5">
                        <span>Buka Firman</span>
                        <ChevronRight className="w-3 h-3" />
                      </span>
                    )}
                  </div>
                  {todayNast.nastBacaan ? (
                    <button
                      type="button"
                      onClick={() => handleOpenBibleModal(todayNast, 'bacaan')}
                      className="text-left w-full cursor-pointer focus:outline-none"
                      title="Klik untuk membuka popup teks ayat Alkitab"
                    >
                      <p className="text-base sm:text-lg font-black text-blue-950 dark:text-white group-hover:text-blue-700 dark:group-hover:text-blue-300 tracking-tight transition flex items-center gap-2">
                        <span>{todayNast.nastBacaan}</span>
                      </p>
                      {getPerikopForNast(todayNast, 'bacaan', todayBacaanData?.perikop) && (
                        <p className="text-xs font-bold text-blue-900 dark:text-blue-200 mt-1 italic flex items-center gap-1.5">
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-200 font-extrabold not-italic border border-blue-200 dark:border-blue-800">
                            Perikop
                          </span>
                          <span>&ldquo;{getPerikopForNast(todayNast, 'bacaan', todayBacaanData?.perikop)}&rdquo;</span>
                        </p>
                      )}
                      <span className="text-[11px] text-blue-700 dark:text-blue-300 font-semibold block mt-1">
                        👆 Klik untuk membaca teks Alkitab lengkap (TB.csv)
                      </span>
                    </button>
                  ) : (
                    <p className="text-xs text-slate-400 italic">-</p>
                  )}
                </div>

                {/* Nast Khotbah Ibadah Card (Today / Week according to table) */}
                <div className="almanak-subcard-khotbah bg-white dark:bg-slate-800/95 p-3.5 rounded-xl border border-purple-200 dark:border-purple-700/80 hover:border-purple-400 dark:hover:border-purple-500 shadow-2xs transition group">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-purple-900 dark:text-purple-200 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                      {todayKhotbahInfo ? todayKhotbahInfo.label : 'Nast Khotbah Ibadah:'}
                    </span>
                    {todayKhotbahInfo?.nastKhotbah ? (
                      <span className="text-[10px] bg-purple-100 dark:bg-purple-900/60 group-hover:bg-purple-600 text-purple-800 dark:text-purple-200 group-hover:text-white dark:group-hover:text-white font-bold px-2 py-0.5 rounded-full border border-purple-200 dark:border-purple-700 transition flex items-center gap-0.5">
                        <span>Buka Firman</span>
                        <ChevronRight className="w-3 h-3" />
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400 font-normal">
                        Hari Khusus / Minggu
                      </span>
                    )}
                  </div>
                  {todayKhotbahInfo?.nastKhotbah ? (
                    <button
                      type="button"
                      onClick={() => handleOpenBibleModal(todayKhotbahInfo.item, 'khotbah')}
                      className="text-left w-full cursor-pointer focus:outline-none"
                      title={`Klik untuk membuka teks ayat khotbah: ${todayKhotbahInfo.nastKhotbah}`}
                    >
                      <p className="text-base sm:text-lg font-black text-purple-950 dark:text-white group-hover:text-purple-700 dark:group-hover:text-purple-300 tracking-tight transition flex items-center gap-2">
                        <span>{todayKhotbahInfo.nastKhotbah}</span>
                      </p>
                      {getPerikopForNast(todayKhotbahInfo.item, 'khotbah', todayKhotbahData?.perikop) && (
                        <p className="text-xs font-bold text-purple-900 dark:text-purple-200 mt-1 italic flex items-center gap-1.5">
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-200 font-extrabold not-italic border border-purple-200 dark:border-purple-800">
                            Perikop
                          </span>
                          <span>&ldquo;{getPerikopForNast(todayKhotbahInfo.item, 'khotbah', todayKhotbahData?.perikop)}&rdquo;</span>
                        </p>
                      )}
                      <span className="text-[11px] text-purple-700 dark:text-purple-300 font-semibold block mt-1">
                        👆 {todayKhotbahInfo.detail || 'Klik untuk membaca firman khotbah lengkap (TB.csv)'}
                      </span>
                    </button>
                  ) : (
                    <p className="text-[11px] text-slate-400 italic pt-1">
                      Nast Khotbah tertera untuk ibadah Minggu &amp; Hari Raya Gerejawi
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row md:flex-col items-stretch gap-2 shrink-0">
              <button
                onClick={() => handleCopyWhatsApp(todayNast)}
                className="flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2.5 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
              >
                {copiedId === todayNast.id ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-200" />
                    <span>Tersalin!</span>
                  </>
                ) : (
                  <>
                    <Share2 className="w-4 h-4" />
                    <span>Salin Format WA</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Expandable Live Scripture Verses Direct from tb.csv */}
          <div className="pt-3 border-t border-rose-200/80 dark:border-slate-800">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setIsTodayVersesOpen(!isTodayVersesOpen)}
                className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-white hover:text-rose-700 dark:hover:text-rose-400 transition cursor-pointer"
              >
                <div className="w-5 h-5 rounded-md bg-rose-100 dark:bg-rose-950/80 border border-rose-200 dark:border-rose-800 flex items-center justify-center text-rose-700 dark:text-rose-300">
                  <Library className="w-3.5 h-3.5" />
                </div>
                <span className="text-slate-900 dark:text-white font-bold">Teks Firman Alkitab Hari Ini (Terjemahan Baru - TB.csv)</span>
                {isTodayVersesOpen ? (
                  <ChevronUp className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                )}
              </button>

              <div className="flex items-center gap-1.5">
                {todayNast.nastBacaan && (
                  <button
                    type="button"
                    onClick={() => setTodayActivePreviewTab('bacaan')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                      todayActivePreviewTab === 'bacaan'
                        ? 'bg-blue-600 text-white shadow-2xs'
                        : 'bg-white dark:bg-slate-800 text-blue-800 dark:text-blue-200 hover:bg-slate-100 dark:hover:bg-slate-700 border border-blue-200 dark:border-blue-700'
                    }`}
                  >
                    📖 Bacaan: {todayNast.nastBacaan}
                  </button>
                )}
                {todayKhotbahInfo?.nastKhotbah && (
                  <button
                    type="button"
                    onClick={() => setTodayActivePreviewTab('khotbah')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                      todayActivePreviewTab === 'khotbah'
                        ? 'bg-purple-600 text-white shadow-2xs'
                        : 'bg-white dark:bg-slate-800 text-purple-800 dark:text-purple-200 hover:bg-slate-100 dark:hover:bg-slate-700 border border-purple-200 dark:border-purple-700'
                    }`}
                  >
                    ✨ Khotbah: {todayKhotbahInfo.nastKhotbah}
                  </button>
                )}
              </div>
            </div>

            {isTodayVersesOpen && (
              <div
                data-verse-preview="true"
                className="verse-preview-container mt-3 bg-white dark:bg-slate-900 rounded-xl border-2 border-slate-300 dark:border-slate-800 p-4 shadow-sm space-y-3"
              >
                {todayPreviewLoading ? (
                  <div className="flex items-center justify-center gap-2 py-6 text-slate-600 dark:text-slate-400 text-xs font-semibold">
                    <Loader2 className="w-4 h-4 animate-spin text-rose-600 dark:text-rose-400" />
                    <span>Memuat ayat Alkitab dari database TB.csv...</span>
                  </div>
                ) : todayActivePreviewTab === 'bacaan' && todayBacaanData && todayBacaanData.verses?.length > 0 ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                      <div>
                        <h4 className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm flex items-center gap-1.5">
                          <span className="text-blue-700 dark:text-blue-400 font-extrabold">📖 {todayBacaanData.book?.fullName || todayBacaanData.book?.name}</span>
                          <span className="text-slate-700 dark:text-slate-300 font-semibold">({todayBacaanData.reference})</span>
                        </h4>
                        {getPerikopForNast(todayNast, 'bacaan', todayBacaanData.perikop) && (
                          <div className="mt-1 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-blue-100 dark:bg-blue-900/60 text-blue-900 dark:text-blue-200 text-xs font-bold border border-blue-200 dark:border-blue-800">
                            <Bookmark className="w-3 h-3 text-blue-600 dark:text-blue-400 fill-blue-500" />
                            <span className="italic font-semibold">&ldquo;{getPerikopForNast(todayNast, 'bacaan', todayBacaanData.perikop)}&rdquo;</span>
                          </div>
                        )}
                        <p className="text-[11px] text-slate-600 dark:text-slate-400 font-medium mt-0.5">
                          Memuat {todayBacaanData.verses.length} ayat dari Alkitab Terjemahan Baru (TB.csv)
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleOpenBibleModal(todayNast, 'bacaan')}
                        className="px-2.5 py-1 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/80 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 rounded-lg text-[11px] font-bold transition flex items-center gap-1 cursor-pointer shadow-2xs"
                      >
                        <span>Tampilan Penuh / Audio</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    </div>

                    <div className="max-h-60 overflow-y-auto pr-1 space-y-2 text-xs sm:text-sm leading-relaxed font-serif">
                      {todayBacaanData.verses.map((v) => (
                        <div key={v.id} className="flex items-start gap-2.5 hover:bg-blue-50/80 dark:hover:bg-blue-950/60 p-2 rounded-lg transition">
                          <span className="verse-num-badge font-sans font-bold text-blue-900 dark:text-blue-200 text-xs bg-blue-100 dark:bg-blue-900/70 px-2 py-0.5 rounded-md shrink-0 border border-blue-200 dark:border-blue-800 mt-0.5">
                            {v.ayat}
                          </span>
                          <p className="verse-content-text text-slate-950 dark:text-slate-50 font-medium leading-relaxed flex-1">
                            {v.firman}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : todayActivePreviewTab === 'khotbah' && todayKhotbahData && todayKhotbahData.verses?.length > 0 ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                      <div>
                        <h4 className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm flex items-center gap-1.5">
                          <span className="text-purple-700 dark:text-purple-400 font-extrabold">✨ {todayKhotbahData.book?.fullName || todayKhotbahData.book?.name}</span>
                          <span className="text-slate-700 dark:text-slate-300 font-semibold">({todayKhotbahData.reference})</span>
                        </h4>
                        {getPerikopForNast(todayKhotbahInfo?.item, 'khotbah', todayKhotbahData.perikop) && (
                          <div className="mt-1 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-purple-100 dark:bg-purple-900/60 text-purple-900 dark:text-purple-200 text-xs font-bold border border-purple-200 dark:border-purple-800">
                            <Bookmark className="w-3 h-3 text-purple-600 dark:text-purple-400 fill-purple-500" />
                            <span className="italic font-semibold">&ldquo;{getPerikopForNast(todayKhotbahInfo?.item, 'khotbah', todayKhotbahData.perikop)}&rdquo;</span>
                          </div>
                        )}
                        <p className="text-[11px] text-slate-600 dark:text-slate-400 font-medium mt-0.5">
                          Memuat {todayKhotbahData.verses.length} ayat dari Alkitab Terjemahan Baru (TB.csv) &bull; {todayKhotbahInfo?.label}
                        </p>
                      </div>
                      {todayKhotbahInfo && (
                        <button
                          type="button"
                          onClick={() => handleOpenBibleModal(todayKhotbahInfo.item, 'khotbah')}
                          className="px-2.5 py-1 bg-purple-50 dark:bg-purple-950/60 hover:bg-purple-100 dark:hover:bg-purple-900/80 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 rounded-lg text-[11px] font-bold transition flex items-center gap-1 cursor-pointer shadow-2xs"
                        >
                          <span>Tampilan Penuh / Audio</span>
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      )}
                    </div>

                    <div className="max-h-60 overflow-y-auto pr-1 space-y-2 text-xs sm:text-sm leading-relaxed font-serif">
                      {todayKhotbahData.verses.map((v) => (
                        <div key={v.id} className="flex items-start gap-2.5 hover:bg-purple-50/80 dark:hover:bg-purple-950/60 p-2 rounded-lg transition">
                          <span className="verse-num-badge font-sans font-bold text-purple-900 dark:text-purple-200 text-xs bg-purple-100 dark:bg-purple-900/70 px-2 py-0.5 rounded-md shrink-0 border border-purple-200 dark:border-purple-800 mt-0.5">
                            {v.ayat}
                          </span>
                          <p className="verse-content-text text-slate-950 dark:text-slate-50 font-medium leading-relaxed flex-1">
                            {v.firman}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-5 text-slate-600 dark:text-slate-400 text-xs font-semibold italic">
                    {todayActivePreviewTab === 'khotbah'
                      ? 'Nast Khotbah tertera untuk ibadah Minggu & Hari Raya Gerejawi.'
                      : 'Teks firman tidak ditemukan atau format referensi sedang diproses.'}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search Input */}
          <div className="relative lg:col-span-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari nast, tanggal, hari..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-rose-500 focus:bg-white transition"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Month Selector */}
          <div>
            <select
              value={selectedBulan}
              onChange={(e) => setSelectedBulan(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-rose-500 font-medium cursor-pointer"
            >
              <option value="semua">Semua Bulan</option>
              {MONTHS_ID.map((bln, idx) => (
                <option key={bln} value={(idx + 1).toString().padStart(2, '0')}>
                  {bln}
                </option>
              ))}
            </select>
          </div>

          {/* Year Selector */}
          <div>
            <select
              value={selectedTahun}
              onChange={(e) => setSelectedTahun(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-rose-500 font-medium cursor-pointer"
            >
              <option value="semua">Semua Tahun</option>
              {availableYears.map((yr) => (
                <option key={yr} value={yr}>
                  Tahun {yr}
                </option>
              ))}
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={selectedKategori}
              onChange={(e) => setSelectedKategori(e.target.value as any)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-rose-500 font-medium cursor-pointer"
            >
              <option value="semua">Semua Hari</option>
              <option value="minggu_hari_raya">Hari Minggu & Hari Raya Saja</option>
              <option value="hari_biasa">Hari Kerja Biasa (Senin - Sabtu)</option>
            </select>
          </div>
        </div>

        {/* Quick summary & Reset Sinode data helper */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span>
              Menampilkan <strong>{filteredList.length}</strong> entri dari total <strong>{almanakNastList.length}</strong> data.
            </span>
          </div>

          {isAdmin && (
            <button
              onClick={() => setIsResetConfirmOpen(true)}
              className="flex items-center gap-1 text-slate-500 hover:text-rose-600 transition font-medium cursor-pointer text-[11px]"
              title="Kembalikan ke data standar Sinode GKE"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Data Default Sinode</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-800 border-b border-slate-200 font-bold uppercase tracking-wider text-[11px]">
                <th className="p-3 text-center w-32 border-r border-slate-200">Tanggal</th>
                <th className="p-3 text-center w-24 border-r border-slate-200">Hari</th>
                <th className="p-3 border-r border-slate-200 min-w-[180px]">Keterangan Hari</th>
                <th className="p-3 text-center w-28 border-r border-slate-200">Warna Stola</th>
                <th className="p-3 border-r border-slate-200 min-w-[160px]">Nast Bacaan</th>
                <th className="p-3 border-r border-slate-200 min-w-[160px]">Nast Khotbah</th>
                <th className="p-3 text-center w-28">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400 italic">
                    Tidak ada data Almanak Nast yang cocok dengan kriteria pencarian.
                  </td>
                </tr>
              ) : (
                filteredList.map((item) => {
                  const isHoliday = isHolidayOrSunday(item);

                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-slate-50/80 transition ${
                        isHoliday ? 'bg-rose-50/40 text-rose-900' : 'text-slate-800'
                      }`}
                    >
                      {/* Tanggal */}
                      <td className="p-3 text-center font-medium border-r border-slate-200 whitespace-nowrap">
                        <span className={isHoliday ? 'text-rose-700 font-bold' : 'text-slate-900'}>
                          {formatTanggalIndonesia(item.tanggal)}
                        </span>
                      </td>

                      {/* Hari */}
                      <td className="p-3 text-center font-bold border-r border-slate-200">
                        <span className={isHoliday ? 'text-rose-700' : 'text-slate-800'}>
                          {item.hari}
                        </span>
                      </td>

                      {/* Keterangan Hari */}
                      <td className="p-3 border-r border-slate-200 whitespace-pre-line font-medium">
                        {item.keteranganHari ? (
                          <span className={isHoliday ? 'font-bold text-rose-800' : 'text-slate-700'}>
                            {item.keteranganHari}
                          </span>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>

                      {/* Warna Stola */}
                      <td className="p-3 text-center border-r border-slate-200">
                        {item.warnaStola ? (
                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] border ${getStolaBadgeStyle(item.warnaStola)}`}>
                            {item.warnaStola}
                          </span>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>

                      {/* Nast Bacaan */}
                      <td className="p-3 border-r border-slate-200 font-bold">
                        {item.nastBacaan ? (
                          <div className="space-y-1">
                            <button
                              type="button"
                              onClick={() => handleOpenBibleModal(item, 'bacaan')}
                              className="group/btn text-left flex items-center justify-between gap-1.5 px-2.5 py-1.5 rounded-lg bg-blue-50/80 hover:bg-blue-100/90 text-blue-900 border border-blue-200/80 hover:border-blue-300 transition shadow-2xs hover:shadow-xs cursor-pointer w-full"
                              title={`Klik untuk membaca ayat: ${item.nastBacaan}`}
                            >
                              <span className="flex items-center gap-1.5 min-w-0">
                                <BookOpen className="w-3.5 h-3.5 text-blue-600 shrink-0 group-hover/btn:scale-110 transition-transform" />
                                <span className="font-bold underline decoration-blue-300 group-hover/btn:decoration-blue-700 underline-offset-2 truncate">
                                  {item.nastBacaan}
                                </span>
                              </span>
                              <span className="text-[10px] text-blue-600 font-semibold opacity-0 group-hover/btn:opacity-100 transition-opacity shrink-0">
                                Buka 📖
                              </span>
                            </button>
                            {getPerikopForNast(item, 'bacaan') && (
                              <span
                                className="text-[11px] text-blue-800/85 font-semibold block truncate px-1 italic"
                                title={`Perikop: "${getPerikopForNast(item, 'bacaan')}"`}
                              >
                                🏷️ &ldquo;{getPerikopForNast(item, 'bacaan')}&rdquo;
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>

                      {/* Nast Khotbah */}
                      <td className="p-3 border-r border-slate-200 font-bold">
                        {item.nastKhotbah ? (
                          <div className="space-y-1">
                            <button
                              type="button"
                              onClick={() => handleOpenBibleModal(item, 'khotbah')}
                              className="group/btn text-left flex items-center justify-between gap-1.5 px-2.5 py-1.5 rounded-lg bg-purple-50/80 hover:bg-purple-100 text-purple-950 border border-purple-200/80 hover:border-purple-300 transition shadow-2xs hover:shadow-xs cursor-pointer w-full"
                              title={`Klik untuk membaca ayat khotbah: ${item.nastKhotbah}`}
                            >
                              <span className="flex items-center gap-1.5 min-w-0">
                                <Sparkles className="w-3.5 h-3.5 text-purple-600 shrink-0 group-hover/btn:scale-110 transition-transform" />
                                <span className="font-bold underline decoration-purple-300 group-hover/btn:decoration-purple-800 underline-offset-2 truncate">
                                  {item.nastKhotbah}
                                </span>
                              </span>
                              <span className="text-[10px] text-purple-600 font-semibold opacity-0 group-hover/btn:opacity-100 transition-opacity shrink-0">
                                Buka ✝️
                              </span>
                            </button>
                            {getPerikopForNast(item, 'khotbah') && (
                              <span
                                className="text-[11px] text-purple-800/85 font-semibold block truncate px-1 italic"
                                title={`Perikop Khotbah: "${getPerikopForNast(item, 'khotbah')}"`}
                              >
                                🏷️ &ldquo;{getPerikopForNast(item, 'khotbah')}&rdquo;
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-300 text-[11px] italic block text-center">-</span>
                        )}
                      </td>

                      {/* Aksi */}
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleCopyWhatsApp(item)}
                            className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                            title="Salin Pesan Format WhatsApp"
                          >
                            {copiedId === item.id ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Share2 className="w-3.5 h-3.5" />
                            )}
                          </button>

                          {isAdmin && (
                            <>
                              <button
                                onClick={() => handleOpenEditModal(item)}
                                className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition cursor-pointer"
                                title="Ubah Data"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setItemToDelete(item)}
                                className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                                title="Hapus Data"
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

      {/* ========================================================================= */}
      {/* MODAL TAMBAH / UBAH NAST */}
      {/* ========================================================================= */}
      {isFormModalOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between border-b border-slate-800">
              <h3 className="font-bold text-sm sm:text-base flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-rose-400" />
                <span>{editingId ? 'Ubah Data Almanak Nast' : 'Tambah Data Almanak Nast Baru'}</span>
              </h3>
              <button
                onClick={() => setIsFormModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveForm} className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tanggal *</label>
                  <input
                    type="date"
                    required
                    value={formTanggal || ''}
                    onChange={(e) => handleDateChange(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-medium focus:outline-none focus:border-rose-500 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Hari *</label>
                  <input
                    type="text"
                    required
                    value={formHari || ''}
                    onChange={(e) => setFormHari(e.target.value)}
                    placeholder="Contoh: Minggu, Senin..."
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-medium focus:outline-none focus:border-rose-500 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Keterangan Hari / Nama Peringatan Liturgis
                </label>
                <textarea
                  rows={2}
                  value={formKeteranganHari || ''}
                  onChange={(e) => setFormKeteranganHari(e.target.value)}
                  placeholder="Contoh: PASKAH I&#10;PERAYAAN HUT KE 187 GKE atau JUMAT AGUNG"
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-medium focus:outline-none focus:border-rose-500 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Warna Stola / Liturgi</label>
                  <input
                    type="text"
                    value={formWarnaStola || ''}
                    onChange={(e) => setFormWarnaStola(e.target.value)}
                    placeholder="Contoh: Putih, Hijau, Merah, Ungu, Hitam"
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-medium focus:outline-none focus:border-rose-500 focus:bg-white"
                  />
                </div>
                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={!!formIsHariRaya}
                      onChange={(e) => setFormIsHariRaya(e.target.checked)}
                      className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500"
                    />
                    <span className="font-semibold text-slate-700">Tandai Hari Raya / Khusus</span>
                  </label>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-slate-700">Nast Bacaan Harian *</label>
                  <button
                    type="button"
                    onClick={() => handleVerifyFormRef('bacaan')}
                    disabled={formVerifying && formVerifyTarget === 'bacaan'}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-2 py-0.5 rounded-md border border-blue-200 transition cursor-pointer"
                  >
                    {formVerifying && formVerifyTarget === 'bacaan' ? (
                      <>
                        <Loader2 className="w-3 h-3 animate-spin text-blue-600" />
                        <span>Memeriksa...</span>
                      </>
                    ) : (
                      <>
                        <SearchCode className="w-3 h-3 text-blue-600" />
                        <span>Cek Firman di Alkitab (TB.csv)</span>
                      </>
                    )}
                  </button>
                </div>
                <input
                  type="text"
                  required
                  value={formNastBacaan || ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    setFormNastBacaan(val);
                    if (formVerifyTarget === 'bacaan') setFormVerifyData(null);
                    const autoPerikop = findPerikopForReference(val);
                    if (autoPerikop && !formJudulPerikop) {
                      setFormJudulPerikop(autoPerikop);
                    }
                  }}
                  placeholder="Contoh: Yesaya 25:6-12 atau Yohanes 13:1-20"
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-bold focus:outline-none focus:border-rose-500 focus:bg-white"
                />
              </div>

              {/* Judul Perikop Bacaan */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-slate-700 flex items-center gap-1">
                    <Bookmark className="w-3 h-3 text-amber-600" />
                    <span>Judul Perikop Alkitab (Bacaan)</span>
                  </label>
                  {formNastBacaan && findPerikopForReference(formNastBacaan) && (
                    <button
                      type="button"
                      onClick={() => {
                        const found = findPerikopForReference(formNastBacaan);
                        if (found) setFormJudulPerikop(found);
                      }}
                      className="text-[10px] font-bold text-amber-800 bg-amber-100 hover:bg-amber-200 px-2 py-0.5 rounded-md transition cursor-pointer"
                      title="Gunakan judul perikop standar dari database"
                    >
                      ⚡ Auto: &ldquo;{findPerikopForReference(formNastBacaan)}&rdquo;
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  value={formJudulPerikop || ''}
                  onChange={(e) => setFormJudulPerikop(e.target.value)}
                  placeholder="Contoh: Percakapan dengan Nikodemus (opsional, terisi otomatis)"
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-medium focus:outline-none focus:border-rose-500 focus:bg-white"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-slate-700">
                    Nast Khotbah Ibadah (Opsional untuk Kebaktian Minggu / Hari Raya)
                  </label>
                  {formNastKhotbah && (
                    <button
                      type="button"
                      onClick={() => handleVerifyFormRef('khotbah')}
                      disabled={formVerifying && formVerifyTarget === 'khotbah'}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-purple-700 hover:text-purple-900 bg-purple-50 hover:bg-purple-100 px-2 py-0.5 rounded-md border border-purple-200 transition cursor-pointer"
                    >
                      {formVerifying && formVerifyTarget === 'khotbah' ? (
                        <>
                          <Loader2 className="w-3 h-3 animate-spin text-purple-600" />
                          <span>Memeriksa...</span>
                        </>
                      ) : (
                        <>
                          <SearchCode className="w-3 h-3 text-purple-600" />
                          <span>Cek Firman (TB.csv)</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  value={formNastKhotbah || ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    setFormNastKhotbah(val);
                    if (formVerifyTarget === 'khotbah') setFormVerifyData(null);
                    const autoPerikop = findPerikopForReference(val);
                    if (autoPerikop && !formJudulPerikopKhotbah) {
                      setFormJudulPerikopKhotbah(autoPerikop);
                    }
                  }}
                  placeholder="Contoh: Lukas 24:36-49 atau 1 Korintus 11:23-26"
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-bold focus:outline-none focus:border-rose-500 focus:bg-white"
                />
              </div>

              {/* Judul Perikop Khotbah */}
              {formNastKhotbah && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-semibold text-slate-700 flex items-center gap-1">
                      <Bookmark className="w-3 h-3 text-purple-600" />
                      <span>Judul Perikop Alkitab (Khotbah)</span>
                    </label>
                    {findPerikopForReference(formNastKhotbah) && (
                      <button
                        type="button"
                        onClick={() => {
                          const found = findPerikopForReference(formNastKhotbah);
                          if (found) setFormJudulPerikopKhotbah(found);
                        }}
                        className="text-[10px] font-bold text-purple-800 bg-purple-100 hover:bg-purple-200 px-2 py-0.5 rounded-md transition cursor-pointer"
                        title="Gunakan judul perikop standar dari database"
                      >
                        ⚡ Auto: &ldquo;{findPerikopForReference(formNastKhotbah)}&rdquo;
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    value={formJudulPerikopKhotbah || ''}
                    onChange={(e) => setFormJudulPerikopKhotbah(e.target.value)}
                    placeholder="Contoh: Yesus menampakkan diri kepada murid-murid-Nya (opsional, terisi otomatis)"
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-medium focus:outline-none focus:border-rose-500 focus:bg-white"
                  />
                </div>
              )}

              {/* Form Live Alkitab Verification Feedback */}
              {formVerifyData && (
                <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-950 space-y-1 animate-in fade-in duration-150">
                  <div className="flex items-center gap-1.5 font-bold text-xs text-emerald-800">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>
                      Terverifikasi di Alkitab (TB.csv): {formVerifyData.bookName} ({formVerifyData.totalVerses} ayat)
                    </span>
                  </div>
                  <p className="text-[11px] text-emerald-900 italic font-serif leading-relaxed line-clamp-2">
                    "{formVerifyData.preview}"
                  </p>
                </div>
              )}

              {formVerifyError && (
                <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl text-amber-950 space-y-1 animate-in fade-in duration-150">
                  <div className="flex items-center gap-1.5 font-bold text-xs text-amber-800">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <span>Peringatan Format Alkitab</span>
                  </div>
                  <p className="text-[11px] text-amber-900">{formVerifyError}</p>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl transition shadow-sm cursor-pointer"
                >
                  Simpan Nast
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL IMPORT EXCEL / CSV */}
      {/* ========================================================================= */}
      {isImportModalOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between border-b border-slate-800 shrink-0">
              <h3 className="font-bold text-sm sm:text-base flex items-center gap-2">
                <Upload className="w-4 h-4 text-blue-400" />
                <span>Impor Data Almanak Nast GKE</span>
              </h3>
              <button
                onClick={() => setIsImportModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs overflow-y-auto flex-1">
              {/* Guidance Info Box */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3.5 text-blue-900 space-y-1.5">
                <div className="flex items-center gap-2 font-bold text-xs">
                  <Info className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>Petunjuk Format Berkas Impor:</span>
                </div>
                <p className="text-[11px] leading-relaxed text-blue-800">
                  Dukung format <strong>Excel (.xlsx)</strong> dan <strong>CSV (.csv)</strong> dengan kolom:{' '}
                  <code>Tanggal</code>, <code>Hari</code>, <code>Keterangan Hari</code>, <code>Warna Stola</code>,{' '}
                  <code>Nast Bacaan</code>, <code>Nast Khotbah</code>.
                </p>
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => downloadAlmanakExcelTemplate()}
                    className="inline-flex items-center gap-1.5 text-blue-700 hover:text-blue-900 underline font-bold text-[11px]"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Unduh Contoh File Template Excel (.xlsx)</span>
                  </button>
                </div>
              </div>

              {/* Upload Drop Area */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 hover:border-rose-500 rounded-2xl p-6 text-center cursor-pointer transition bg-slate-50/50 hover:bg-rose-50/30 group"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <div className="flex flex-col items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 group-hover:scale-110 transition">
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-800">
                      {importFile ? importFile.name : 'Klik untuk memilih file Excel atau CSV'}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {importFile ? `${(importFile.size / 1024).toFixed(1)} KB` : 'Maksimal ukuran berkas 10 MB'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Import Mode Options */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
                <label className="block font-bold text-slate-800">Mode Penyimpanan:</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <label className={`p-2.5 rounded-xl border flex items-start gap-2 cursor-pointer transition ${importMode === 'append' ? 'bg-white border-rose-500 shadow-xs' : 'border-slate-200'}`}>
                    <input
                      type="radio"
                      name="importMode"
                      checked={importMode === 'append'}
                      onChange={() => setImportMode('append')}
                      className="mt-0.5 text-rose-600 focus:ring-rose-500"
                    />
                    <div>
                      <strong className="block text-slate-900">Tambahkan / Gabungkan Data</strong>
                      <span className="text-[10px] text-slate-500">Menambahkan data baru tanpa menghapus data sebelumnya.</span>
                    </div>
                  </label>

                  <label className={`p-2.5 rounded-xl border flex items-start gap-2 cursor-pointer transition ${importMode === 'overwrite' ? 'bg-white border-rose-500 shadow-xs' : 'border-slate-200'}`}>
                    <input
                      type="radio"
                      name="importMode"
                      checked={importMode === 'overwrite'}
                      onChange={() => setImportMode('overwrite')}
                      className="mt-0.5 text-rose-600 focus:ring-rose-500"
                    />
                    <div>
                      <strong className="block text-rose-900">Timpa Seluruh Data</strong>
                      <span className="text-[10px] text-slate-500">Menghapus data lama dan mengganti sepenuhnya dengan data baru.</span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Messages */}
              {importError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{importError}</span>
                </div>
              )}

              {importSuccessMsg && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 flex items-center gap-2 font-bold">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{importSuccessMsg}</span>
                </div>
              )}

              {/* Preview Table */}
              {importPreviewData.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between font-bold text-slate-800">
                    <span>Pratinjau Data Impor ({importPreviewData.length} baris):</span>
                  </div>
                  <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-xl">
                    <table className="w-full text-[11px] text-left border-collapse">
                      <thead className="bg-slate-100 text-slate-700 sticky top-0 font-bold border-b border-slate-200">
                        <tr>
                          <th className="p-2">Tanggal</th>
                          <th className="p-2">Hari</th>
                          <th className="p-2">Keterangan</th>
                          <th className="p-2">Stola</th>
                          <th className="p-2">Nast Bacaan</th>
                          <th className="p-2">Nast Khotbah</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {importPreviewData.slice(0, 10).map((row, idx) => (
                          <tr key={idx} className={row.isHariRaya ? 'bg-rose-50/50 text-rose-950' : ''}>
                            <td className="p-2 font-medium">{row.tanggal}</td>
                            <td className="p-2">{row.hari}</td>
                            <td className="p-2">{row.keteranganHari || '-'}</td>
                            <td className="p-2">{row.warnaStola || '-'}</td>
                            <td className="p-2 font-bold">{row.nastBacaan}</td>
                            <td className="p-2">{row.nastKhotbah || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {importPreviewData.length > 10 && (
                    <p className="text-[10px] text-slate-400 italic text-center">
                      ...dan {importPreviewData.length - 10} baris data lainnya
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="bg-slate-50 p-4 border-t border-slate-200 flex justify-end gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setIsImportModalOpen(false)}
                className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold rounded-xl transition cursor-pointer"
              >
                Tutup
              </button>
              <button
                type="button"
                disabled={importPreviewData.length === 0 || importLoading}
                onClick={handleCommitImport}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-bold rounded-xl transition shadow-sm cursor-pointer"
              >
                {importLoading ? 'Menyimpan ke Cloud...' : `Konfirmasi Impor (${importPreviewData.length} Nast)`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL RESET CONFIRMATION */}
      {/* ========================================================================= */}
      {isResetConfirmOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-200 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto">
              <RotateCcw className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-base text-slate-900">Reset Data Almanak Nast?</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Tindakan ini akan mengembalikan data Almanak Nast ke data bawaan standar Sinode GKE. Data kustom yang tidak ada dalam data bawaan akan digantikan.
              </p>
            </div>
            <div className="flex justify-center gap-2 pt-2">
              <button
                onClick={() => setIsResetConfirmOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={async () => {
                  await resetAlmanakNastDefault();
                  setIsResetConfirmOpen(false);
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl transition shadow-sm cursor-pointer"
              >
                Ya, Reset Sekarang
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL DELETE CONFIRMATION */}
      {/* ========================================================================= */}
      {itemToDelete && (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="bg-rose-50 border-b border-rose-100 p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-rose-600/20">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-base text-rose-950">Konfirmasi Hapus Data Nast</h3>
                <p className="text-xs text-rose-700">Tindakan ini tidak dapat dibatalkan</p>
              </div>
              <button
                type="button"
                onClick={() => setItemToDelete(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content Preview */}
            <div className="p-5 space-y-4 text-xs">
              <p className="text-slate-600 leading-relaxed">
                Apakah Anda yakin ingin menghapus data nast bacaan untuk tanggal berikut dari sistem?
              </p>

              {/* Data Card Preview */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-slate-800">
                <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-rose-600" />
                    <span className="font-bold text-slate-900 text-sm">
                      {itemToDelete.hari}, {formatTanggalIndonesia(itemToDelete.tanggal)}
                    </span>
                  </div>
                  {itemToDelete.warnaStola && (
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${getStolaBadgeStyle(itemToDelete.warnaStola)}`}>
                      {itemToDelete.warnaStola}
                    </span>
                  )}
                </div>

                {itemToDelete.keteranganHari && (
                  <div className="flex items-center gap-1.5 text-rose-700 font-semibold">
                    <Sparkles className="w-3.5 h-3.5 shrink-0" />
                    <span>{itemToDelete.keteranganHari}</span>
                  </div>
                )}

                <div className="space-y-1 pt-1">
                  <div className="flex gap-2">
                    <span className="text-slate-500 shrink-0 font-medium">Nast Bacaan:</span>
                    <span className="font-bold text-slate-900">{itemToDelete.nastBacaan}</span>
                  </div>
                  {itemToDelete.nastKhotbah && (
                    <div className="flex gap-2">
                      <span className="text-slate-500 shrink-0 font-medium">Nast Khotbah:</span>
                      <span className="font-bold text-slate-800">{itemToDelete.nastKhotbah}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="bg-slate-50 p-4 border-t border-slate-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setItemToDelete(null)}
                className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold rounded-xl transition text-xs cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => handleDeleteItem(itemToDelete)}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl transition shadow-md shadow-rose-600/20 text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Ya, Hapus Data</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* POPUP MODAL TEKS AYAT ALKITAB LENGKAP (TERJEMAHAN BARU / TB) */}
      {/* ========================================================================= */}
      {selectedBibleModal && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              if (typeof window !== 'undefined' && window.speechSynthesis) {
                window.speechSynthesis.cancel();
              }
              setIsSpeaking(false);
              setSelectedBibleModal(null);
            }
          }}
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-2.5 sm:p-4 animate-in fade-in duration-200"
        >
          <div
            className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-3xl max-h-[92vh] sm:max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              className={`p-3.5 sm:p-5 flex items-start justify-between gap-3 sm:gap-4 transition-colors shrink-0 ${
                selectedBibleModal.activeType === 'khotbah'
                  ? 'bg-purple-50 dark:bg-slate-950 border-b border-purple-200 dark:border-slate-800'
                  : 'bg-blue-50 dark:bg-slate-950 border-b border-blue-200 dark:border-slate-800'
              }`}
            >
              <div className="flex items-start gap-2.5 sm:gap-3 min-w-0">
                <div
                  className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl flex items-center justify-center shrink-0 shadow-sm ring-2 ${
                    selectedBibleModal.activeType === 'khotbah'
                      ? 'bg-purple-600 text-white ring-purple-300 dark:ring-purple-800'
                      : 'bg-blue-600 text-white ring-blue-300 dark:ring-blue-800'
                  }`}
                >
                  {selectedBibleModal.activeType === 'khotbah' ? (
                    <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  ) : (
                    <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  )}
                </div>

                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-1.5">
                    <span
                      className={`text-[10px] uppercase font-black tracking-wider px-2.5 py-0.5 rounded-full border shadow-2xs ${
                        selectedBibleModal.activeType === 'khotbah'
                          ? 'bg-purple-200/80 text-purple-950 border-purple-300 dark:bg-purple-900/60 dark:text-purple-200 dark:border-purple-700'
                          : 'bg-blue-200/80 text-blue-950 border-blue-300 dark:bg-blue-900/60 dark:text-blue-200 dark:border-blue-700'
                      }`}
                    >
                      {selectedBibleModal.activeType === 'khotbah'
                        ? '✝️ NAST KHOTBAH IBADAH'
                        : '📖 NAST BACAAN HARIAN'}
                    </span>
                    <span className="text-slate-700 dark:text-slate-300 text-xs font-bold">
                      {selectedBibleModal.item.hari},{' '}
                      {formatTanggalIndonesia(selectedBibleModal.item.tanggal)}
                    </span>
                    {selectedBibleModal.item.keteranganHari && (
                      <span className="text-[10px] bg-rose-100 text-rose-900 border border-rose-300 dark:bg-rose-900/50 dark:text-rose-200 dark:border-rose-700 font-extrabold px-2 py-0.5 rounded-full shadow-2xs">
                        {selectedBibleModal.item.keteranganHari.replace(/(\d+)([a-zA-Z]+)/g, '$1 $2')}
                      </span>
                    )}
                  </div>

                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex flex-wrap items-baseline gap-2">
                    <span>{selectedBibleModal.refString}</span>
                    {bibleData?.book && (
                      <span className="text-sm sm:text-base font-bold text-indigo-800 dark:text-indigo-300 font-serif">
                        ({bibleData.book.fullName})
                      </span>
                    )}
                  </h2>
                  {modalPerikopTitle && (
                    <div className="mt-1.5 flex flex-wrap items-center gap-2">
                      <span className="px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200 text-[11px] font-extrabold border border-amber-300 dark:border-amber-700 flex items-center gap-1">
                        <Bookmark className="w-3 h-3 text-amber-600 fill-amber-500" />
                        <span>Judul Perikop:</span>
                      </span>
                      <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 italic">
                        &ldquo;{modalPerikopTitle}&rdquo;
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (typeof window !== 'undefined' && window.speechSynthesis) {
                    window.speechSynthesis.cancel();
                  }
                  setIsSpeaking(false);
                  setSelectedBibleModal(null);
                }}
                className="text-slate-600 hover:text-slate-900 hover:bg-slate-200/80 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800 p-2 rounded-xl transition cursor-pointer shrink-0 border border-slate-300/70 dark:border-slate-700/80 bg-white dark:bg-slate-800/80 shadow-2xs"
                title="Tutup Popup Ayat"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Switch Tabs if both Bacaan & Khotbah exist */}
            {selectedBibleModal.item.nastBacaan && selectedBibleModal.item.nastKhotbah && (
              <div className="bg-slate-100 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 px-4 py-2 sm:py-2.5 flex flex-col sm:flex-row sm:items-center gap-2 text-xs shrink-0">
                <span className="text-slate-600 dark:text-slate-400 font-bold text-[11px] uppercase tracking-wider shrink-0">
                  Pilihan Nats:
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleSwitchBibleTab('bacaan')}
                    className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 cursor-pointer text-xs ${
                      selectedBibleModal.activeType === 'bacaan'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-700'
                    }`}
                  >
                    <BookOpen className="w-3.5 h-3.5 shrink-0" />
                    <span>Nast Bacaan: {selectedBibleModal.item.nastBacaan}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSwitchBibleTab('khotbah')}
                    className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 cursor-pointer text-xs ${
                      selectedBibleModal.activeType === 'khotbah'
                        ? 'bg-purple-600 text-white shadow-xs'
                        : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-700'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5 shrink-0" />
                    <span>Nast Khotbah: {selectedBibleModal.item.nastKhotbah}</span>
                  </button>
                </div>
              </div>
            )}

            {/* Controls Bar: Typography, Audio TTS, Actions */}
            <div className="bg-slate-50 dark:bg-slate-900/90 border-b border-slate-200 dark:border-slate-800 px-4 py-2 sm:py-2.5 flex flex-wrap items-center justify-between gap-2.5 text-xs shrink-0">
              {/* Typography Options */}
              <div className="flex flex-wrap items-center gap-2.5">
                {/* Font Size Selector */}
                <div className="flex items-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-0.5 shadow-2xs">
                  <button
                    type="button"
                    onClick={() => setFontSizeMode('normal')}
                    className={`px-2.5 py-1 rounded text-xs font-bold transition cursor-pointer ${
                      fontSizeMode === 'normal'
                        ? 'bg-blue-600 text-white shadow-2xs'
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white'
                    }`}
                    title="Ukuran Standar"
                  >
                    A
                  </button>
                  <button
                    type="button"
                    onClick={() => setFontSizeMode('large')}
                    className={`px-2.5 py-1 rounded text-xs font-bold transition cursor-pointer ${
                      fontSizeMode === 'large'
                        ? 'bg-blue-600 text-white shadow-2xs'
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white'
                    }`}
                    title="Ukuran Sedang (+)"
                  >
                    A+
                  </button>
                  <button
                    type="button"
                    onClick={() => setFontSizeMode('xlarge')}
                    className={`px-2.5 py-1 rounded text-xs font-bold transition cursor-pointer ${
                      fontSizeMode === 'xlarge'
                        ? 'bg-blue-600 text-white shadow-2xs'
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white'
                    }`}
                    title="Ukuran Besar (++)"
                  >
                    A++
                  </button>
                </div>

                {/* Font Family Toggle */}
                <button
                  type="button"
                  onClick={() => setIsSerif(!isSerif)}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs ${
                    isSerif
                      ? 'bg-white dark:bg-slate-800 border-blue-300 dark:border-blue-700 text-blue-900 dark:text-blue-300 font-serif'
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-sans'
                  }`}
                  title="Ganti Font Serif / Sans"
                >
                  <Type className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  <span>{isSerif ? 'Serif Alkitab' : 'Modern Sans'}</span>
                </button>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Audio TTS Button */}
                <button
                  type="button"
                  onClick={handleToggleAudio}
                  disabled={bibleLoading || !bibleData}
                  className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs ${
                    isSpeaking
                      ? 'bg-rose-600 hover:bg-rose-700 text-white animate-pulse'
                      : 'bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700'
                  }`}
                  title="Dengarkan pembacaan teks Alkitab (Audio TTS)"
                >
                  {isSpeaking ? (
                    <>
                      <VolumeX className="w-3.5 h-3.5" />
                      <span>Berhenti Suara</span>
                    </>
                  ) : (
                    <>
                      <Volume2 className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                      <span>Audio Firman</span>
                    </>
                  )}
                </button>

                {/* Copy Text */}
                <button
                  type="button"
                  onClick={handleCopyModalVerseText}
                  disabled={bibleLoading || !bibleData}
                  className="px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  title="Salin Teks Nats dan Seluruh Ayat"
                >
                  {copiedVerseText ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span className="text-emerald-700 dark:text-emerald-300 font-bold">Tersalin!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
                      <span>Salin</span>
                    </>
                  )}
                </button>

                {/* Print */}
                <button
                  type="button"
                  onClick={handlePrintModalVerse}
                  disabled={bibleLoading || !bibleData}
                  className="px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  title="Cetak Naskah Ayat Alkitab"
                >
                  <Printer className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
                  <span>Cetak</span>
                </button>
              </div>
            </div>

            {/* Modal Body: Scripture Verses Display */}
            <div className="p-4 sm:p-6 overflow-y-auto min-h-0 flex-1 space-y-4 bg-slate-50/70 dark:bg-slate-950/70 pb-12 sm:pb-16">
              {bibleLoading ? (
                <div className="py-16 flex flex-col items-center justify-center gap-3 text-slate-500 dark:text-slate-400">
                  <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                  <p className="text-sm font-semibold">
                    Sedang memuat nats &ldquo;{selectedBibleModal.refString}&rdquo; dari Alkitab Terjemahan Baru...
                  </p>
                </div>
              ) : bibleError ? (
                <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-2xl p-6 text-rose-900 dark:text-rose-200 space-y-3">
                  <div className="flex items-center gap-2 text-rose-700 dark:text-rose-300 font-bold text-sm">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <span>Nats Belum Ditemukan Otomatis</span>
                  </div>
                  <p className="text-xs leading-relaxed text-slate-700 dark:text-slate-300">{bibleError}</p>
                  <div className="text-xs text-slate-600 dark:text-slate-400 bg-white/80 dark:bg-slate-900/80 p-3 rounded-xl border border-rose-100 dark:border-rose-900/50 space-y-1">
                    <p className="font-semibold text-slate-800 dark:text-slate-200">💡 Tips Format Penulisan Nats:</p>
                    <ul className="list-disc pl-4 space-y-0.5 text-[11px]">
                      <li>Contoh format: <code>Yohanes 3:16</code>, <code>Mazmur 23:1-6</code></li>
                      <li>Lintas pasal: <code>Yesaya 52:13-53:12</code>, <code>1 Yohanes 1:5-2:2</code></li>
                      <li>Gunakan nama kitab standar bahasa Indonesia (TB)</li>
                    </ul>
                  </div>
                </div>
              ) : bibleData && bibleData.verses ? (
                <div className="space-y-4">
                  {/* Meta Tag Banner */}
                  {bibleData.book && (
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 sm:p-3.5 rounded-2xl shadow-2xs flex flex-wrap items-center justify-between gap-2.5">
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <span
                          className="badge-white-text bg-indigo-600 dark:bg-indigo-600 !text-white font-black px-2.5 py-0.5 rounded-lg text-[11px] shadow-2xs inline-flex items-center gap-1"
                          style={{ color: '#ffffff', WebkitTextFillColor: '#ffffff' }}
                        >
                          <BookOpen className="w-3 h-3 text-white" />
                          <span>{bibleData.book.name}</span>
                        </span>
                        <span className="bg-blue-100 dark:bg-blue-900/50 text-blue-900 dark:text-blue-200 font-bold px-2.5 py-0.5 rounded-lg text-[10px] border border-blue-200 dark:border-blue-800">
                          {bibleData.book.testament === 'PB' ? 'Perjanjian Baru (PB)' : 'Perjanjian Lama (PL)'}
                        </span>
                        <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium px-2.5 py-0.5 rounded-lg text-[10px] border border-slate-200 dark:border-slate-700">
                          Grup: {bibleData.book.group}
                        </span>
                      </div>
                      <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                        {bibleData.totalVersesFound} Ayat Terpilih
                      </span>
                    </div>
                  )}

                  {/* Perikop Title Banner */}
                  {modalPerikopTitle && (
                    <div className="bg-gradient-to-r from-amber-50 via-orange-50/70 to-amber-50 dark:from-amber-950/40 dark:via-orange-950/30 dark:to-amber-950/40 border-2 border-amber-300 dark:border-amber-700/80 p-4 sm:p-5 rounded-2xl shadow-xs">
                      <div className="flex items-center gap-2 mb-1.5 text-[11px] font-extrabold text-amber-900 dark:text-amber-300 uppercase tracking-wider">
                        <Bookmark className="w-4 h-4 fill-amber-500 text-amber-600 dark:text-amber-400" />
                        <span>Judul Perikop Alkitab (TB - LAI)</span>
                      </div>
                      <h3 className="text-base sm:text-lg md:text-xl font-black text-slate-950 dark:text-amber-100 tracking-tight font-serif">
                        &ldquo;{modalPerikopTitle}&rdquo;
                      </h3>
                      <p className="text-[11px] text-amber-800 dark:text-amber-400 font-medium mt-1">
                        Perikop pembacaan dan perenungan nats {selectedBibleModal.refString}
                      </p>
                    </div>
                  )}

                  {/* Verses Container */}
                  <div
                    data-verse-preview="true"
                    className={`verse-preview-container bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-7 shadow-xs space-y-3.5 leading-relaxed text-slate-900 dark:text-slate-100 transition-all ${
                      isSerif ? 'font-serif' : 'font-sans'
                    } ${
                      fontSizeMode === 'normal'
                        ? 'text-sm sm:text-base'
                        : fontSizeMode === 'large'
                        ? 'text-base sm:text-lg'
                        : 'text-lg sm:text-xl'
                    }`}
                  >
                    {bibleData.verses.map((verse) => (
                      <div
                        key={verse.id}
                        className="flex items-start gap-3 group/verse hover:bg-blue-50/80 dark:hover:bg-blue-950/60 p-2 -mx-2 rounded-xl transition"
                      >
                        <span className="verse-num-badge shrink-0 w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-900/80 text-blue-950 dark:text-blue-200 group-hover/verse:bg-blue-600 group-hover/verse:text-white font-sans font-black text-xs flex items-center justify-center mt-0.5 transition shadow-2xs border border-blue-200 dark:border-blue-800">
                          {verse.ayat}
                        </span>
                        <p className="verse-content-text flex-1 text-justify leading-relaxed text-slate-950 dark:text-slate-50 selection:bg-blue-200 dark:selection:bg-blue-900 font-medium">
                          {verse.firman}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Inspirational GKE Verse Footer Quote */}
                  <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/20 border border-amber-200/80 dark:border-amber-800/50 rounded-2xl p-4 text-xs flex items-start gap-3">
                    <Flame className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-amber-950 dark:text-amber-200">
                        &ldquo;Firman-Mu itu pelita bagi kakiku dan terang bagi jalanku.&rdquo;
                      </p>
                      <p className="text-amber-800 dark:text-amber-400 text-[11px] mt-0.5 font-medium">
                        Mazmur 119:105 &bull; Gereja Kalimantan Evangelis (GKE)
                      </p>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>

            {/* Modal Footer */}
            <div className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 p-3.5 sm:p-4 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
              <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 text-[11px] font-medium">
                <BookMarked className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                <span>Alkitab Terjemahan Baru (TB) Lembaga Alkitab Indonesia (LAI)</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (typeof window !== 'undefined' && window.speechSynthesis) {
                      window.speechSynthesis.cancel();
                    }
                    setIsSpeaking(false);
                    setSelectedBibleModal(null);
                  }}
                  className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white font-bold rounded-xl shadow-md transition cursor-pointer"
                >
                  Tutup Firman
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL POPUP NOTIFIKASI SUKSES (IMPORT / EDIT / ADD / DELETE) */}
      {/* ========================================================================= */}
      {successModalData && (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden text-slate-800 transform animate-in zoom-in-95 duration-150">
            {/* Header / Banner */}
            <div
              className={`p-5 flex items-center gap-3.5 text-white ${
                successModalData.type === 'import'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-700'
                  : successModalData.type === 'edit'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-700'
                  : successModalData.type === 'delete'
                  ? 'bg-gradient-to-r from-slate-700 to-slate-900'
                  : 'bg-gradient-to-r from-rose-600 to-rose-700'
              }`}
            >
              <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0 border border-white/30 shadow-inner">
                {successModalData.type === 'import' && <CheckCircle2 className="w-6 h-6 text-white" />}
                {successModalData.type === 'edit' && <Check className="w-6 h-6 text-white" />}
                {successModalData.type === 'add' && <Plus className="w-6 h-6 text-white" />}
                {successModalData.type === 'delete' && <Trash2 className="w-6 h-6 text-white" />}
                {successModalData.type === 'reset' && <RotateCcw className="w-6 h-6 text-white" />}
              </div>
              <div className="flex-1">
                <div className="text-[10px] uppercase font-bold tracking-wider text-white/80">
                  Notifikasi Sistem
                </div>
                <h3 className="font-bold text-base leading-tight text-white">
                  {successModalData.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSuccessModalData(null)}
                className="text-white/70 hover:text-white p-1 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 space-y-4 text-xs">
              <p className="text-slate-700 font-medium leading-relaxed">
                {successModalData.message}
              </p>

              {/* Sub-Details */}
              {successModalData.subDetails && successModalData.subDetails.length > 0 && (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
                  <div className="text-[11px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5 text-slate-500" />
                    <span>Rincian Informasi</span>
                  </div>
                  <ul className="space-y-1.5 text-slate-700 font-medium">
                    {successModalData.subDetails.map((detail, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0 mt-1.5" />
                        <span className="leading-snug">{detail}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="bg-slate-50 p-4 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setSuccessModalData(null)}
                className={`px-5 py-2.5 font-bold rounded-xl text-white text-xs shadow-md transition cursor-pointer ${
                  successModalData.type === 'import'
                    ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20'
                    : successModalData.type === 'edit'
                    ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/20'
                    : successModalData.type === 'delete'
                    ? 'bg-slate-800 hover:bg-slate-900 shadow-slate-800/20'
                    : 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/20'
                }`}
              >
                Tutup & Lanjutkan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL PENCARIAN FIRMAN DI DATABASE ALKITAB (TB.CSV) */}
      {/* ========================================================================= */}
      {isBibleSearchOpen && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIsBibleSearchOpen(false);
            }
          }}
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150"
        >
          <div
            className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bg-blue-50 dark:bg-slate-950 p-4 sm:p-5 flex items-center justify-between border-b border-blue-200 dark:border-slate-800 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-sm ring-2 ring-blue-300 dark:ring-blue-800">
                  <SearchCode className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-sm sm:text-base text-slate-900 dark:text-white flex items-center gap-2">
                    <span>Pencarian Firman di Alkitab (TB.csv)</span>
                  </h3>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">
                    Cari teks firman, kata kunci, atau nama kitab dari 31.102 ayat Alkitab Terjemahan Baru
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsBibleSearchOpen(false)}
                className="text-slate-600 hover:text-slate-900 hover:bg-slate-200/80 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800 p-2 rounded-xl transition cursor-pointer border border-slate-300/70 dark:border-slate-700/80 bg-white dark:bg-slate-800/80 shadow-2xs"
                title="Tutup Pencarian"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search Input Bar */}
            <div className="p-4 bg-slate-50 dark:bg-slate-900/90 border-b border-slate-200 dark:border-slate-800 shrink-0">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleExecuteBibleSearch(bibleSearchQuery, 1);
                }}
                className="flex items-center gap-2"
              >
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={bibleSearchQuery}
                    onChange={(e) => setBibleSearchQuery(e.target.value)}
                    placeholder="Ketik kata firman (misal: 'kasih', 'damai sejahtera', 'gembala') atau nama kitab..."
                    className="w-full pl-9 pr-3 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-600 font-medium shadow-xs"
                    autoFocus
                  />
                </div>
                <button
                  type="submit"
                  disabled={bibleSearchLoading}
                  className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shrink-0"
                >
                  {bibleSearchLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Search className="w-4 h-4" />
                  )}
                  <span>Cari</span>
                </button>
              </form>

              {/* Quick Tags */}
              <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
                <span className="text-[10px] text-slate-600 dark:text-slate-400 font-bold">Saran Pencarian:</span>
                {['Kasih', 'Damai sejahtera', 'Tuhan adalah gembalaku', 'Kudus', 'Iman', 'Sukacita'].map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => {
                      setBibleSearchQuery(tag);
                      handleExecuteBibleSearch(tag, 1);
                    }}
                    className="px-2.5 py-0.5 bg-white dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950/50 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800 rounded-md text-[10px] font-bold transition cursor-pointer shadow-2xs"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Results Content */}
            <div className="p-4 flex-1 overflow-y-auto space-y-3 bg-slate-50/50 dark:bg-slate-950/50">
              {bibleSearchLoading ? (
                <div className="flex flex-col items-center justify-center py-12 text-slate-500 dark:text-slate-400 space-y-2">
                  <Loader2 className="w-7 h-7 animate-spin text-blue-600" />
                  <p className="text-xs font-semibold">Mencari di seluruh kitab Alkitab TB.csv...</p>
                </div>
              ) : bibleSearchResults && bibleSearchResults.length > 0 ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-slate-700 dark:text-slate-300 pb-1 border-b border-slate-200 dark:border-slate-800">
                    <span className="font-semibold">
                      Ditemukan <span className="text-blue-700 dark:text-blue-400 font-bold">{bibleSearchTotal}</span> ayat untuk kata kunci &ldquo;{bibleSearchQuery}&rdquo;
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      Menampilkan {bibleSearchResults.length} ayat teratas
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    {bibleSearchResults.map((verse) => (
                      <div
                        key={verse.id}
                        className="verse-preview-container bg-white dark:bg-slate-900 hover:bg-blue-50/80 dark:hover:bg-blue-950/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-700 transition space-y-1.5 group shadow-2xs"
                      >
                        <div className="flex items-center justify-between">
                          <span className="verse-num-badge font-sans font-bold text-xs text-blue-950 dark:text-blue-200 bg-blue-100 dark:bg-blue-900/70 px-2 py-0.5 rounded-md border border-blue-200 dark:border-blue-800">
                            {verse.kitabName || verse.kitab} {verse.pasal}:{verse.ayat}
                          </span>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold">
                            {verse.kitab}
                          </span>
                        </div>
                        <p className="verse-content-text font-serif text-slate-950 dark:text-slate-50 font-medium text-xs sm:text-sm leading-relaxed pt-0.5">
                          {verse.firman}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : bibleSearchExecuted ? (
                <div className="text-center py-10 text-slate-500 dark:text-slate-400 space-y-2">
                  <BookOpen className="w-8 h-8 text-slate-400 mx-auto" />
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-200">Tidak ada ayat yang cocok</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Coba gunakan kata dasar atau periksa ejaan kata kunci pencarian.
                  </p>
                </div>
              ) : (
                <div className="text-center py-10 text-slate-400 space-y-2">
                  <SearchCode className="w-8 h-8 text-blue-400 mx-auto" />
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Masukkan kata kunci di atas untuk mencari ayat dari kitab Alkitab Terjemahan Baru (TB.csv).
                  </p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3 bg-slate-100 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex justify-end shrink-0">
              <button
                type="button"
                onClick={() => setIsBibleSearchOpen(false)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition cursor-pointer shadow-sm"
              >
                Tutup Pencarian
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
