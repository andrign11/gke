import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  BookOpen,
  BookMarked,
  Search,
  Share2,
  Copy,
  Printer,
  Check,
  Bookmark,
  BookmarkPlus,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
  Type,
  Maximize2,
  Sliders,
  CheckCircle2,
  Trash2,
  FileText,
  Heart,
  Volume2,
  RefreshCw,
  X,
  ExternalLink,
  ChevronDown,
  Layers,
  ArrowRight,
  Filter,
  Church,
  BookmarkCheck,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { AlkitabBook, AlkitabVerse, AlkitabBookmark, AlkitabSearchResult } from '../../types';
import {
  ALKITAB_BOOKS,
  PL_BOOKS,
  PB_BOOKS,
  findBook,
  parseNats,
  formatVerseText,
  generateWhatsAppBibleUrl,
} from '../../utils/alkitabData';
import {
  getChapterPerikopes,
  getPerikopStartingAtVerse,
  getPerikopTitle,
  findPerikopForReference,
  PerikopItem,
} from '../../utils/perikopData';

type ReadingTheme = 'light' | 'sepia' | 'dark' | 'cream';
type FontSize = 'sm' | 'base' | 'lg' | 'xl' | '2xl';
type VerseSpacing = 'compact' | 'normal' | 'relaxed';

export const AlkitabModule: React.FC = () => {
  const { settings, openPrintReport, currentUser, setActiveTab } = useApp();

  // Navigation & View Mode
  const [activeView, setActiveView] = useState<'reader' | 'search' | 'daily' | 'bookmarks'>('reader');

  // Reader State
  const [selectedBook, setSelectedBook] = useState<AlkitabBook>(
    ALKITAB_BOOKS.find((b) => b.abbr === 'Yoh') || ALKITAB_BOOKS[0]
  );
  const [selectedChapter, setSelectedChapter] = useState<number>(1);
  const [verses, setVerses] = useState<AlkitabVerse[]>([]);
  const [isLoadingVerses, setIsLoadingVerses] = useState<boolean>(false);
  const [targetScrollAyat, setTargetScrollAyat] = useState<number | null>(null);

  // Quick Reference Search Bar (e.g., "Yoh 3:16" or "Mzm 23")
  const [quickJumpInput, setQuickJumpInput] = useState<string>('');
  const [quickJumpError, setQuickJumpError] = useState<string | null>(null);

  // Book & Chapter Picker Modal
  const [isBookPickerOpen, setIsBookPickerOpen] = useState<boolean>(false);
  const [pickerTestament, setPickerTestament] = useState<'ALL' | 'PL' | 'PB'>('ALL');
  const [pickerCategoryFilter, setPickerCategoryFilter] = useState<string>('ALL');
  const [pickerSearch, setPickerSearch] = useState<string>('');
  const [pickerSelectedBookForChapters, setPickerSelectedBookForChapters] = useState<AlkitabBook | null>(null);

  // Reader Customization Settings
  const [theme, setTheme] = useState<ReadingTheme>(() => {
    return (localStorage.getItem('gke_bible_theme') as ReadingTheme) || 'sepia';
  });
  const [fontSize, setFontSize] = useState<FontSize>(() => {
    return (localStorage.getItem('gke_bible_fontsize') as FontSize) || 'base';
  });
  const [fontFamily, setFontFamily] = useState<'serif' | 'sans'>(() => {
    return (localStorage.getItem('gke_bible_fontfamily') as 'serif' | 'sans') || 'serif';
  });
  const [verseSpacing, setVerseSpacing] = useState<VerseSpacing>(() => {
    return (localStorage.getItem('gke_bible_spacing') as VerseSpacing) || 'compact';
  });
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);

  // Perikop Alkitab (Lembaga Alkitab Indonesia - Terjemahan Baru)
  const [showPerikop, setShowPerikop] = useState<boolean>(() => {
    const saved = localStorage.getItem('gke_bible_show_perikop');
    return saved !== null ? saved === 'true' : true;
  });
  const [chapterPerikopes, setChapterPerikopes] = useState<PerikopItem[]>([]);

  // Compute active perikopes for current chapter (from API or direct utility fallback)
  const activeChapterPerikopes = useMemo(() => {
    if (chapterPerikopes && chapterPerikopes.length > 0) {
      return chapterPerikopes;
    }
    return getChapterPerikopes(selectedBook.abbr, selectedChapter);
  }, [chapterPerikopes, selectedBook.abbr, selectedChapter]);

  // Verse Selection & Multi-actions
  const [selectedVerseIds, setSelectedVerseIds] = useState<number[]>([]);
  const [copiedNotification, setCopiedNotification] = useState<string | null>(null);

  // Bookmarks & Highlights (stored locally in localStorage)
  const [bookmarks, setBookmarks] = useState<AlkitabBookmark[]>(() => {
    try {
      const saved = localStorage.getItem('gke_bible_bookmarks');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [bookmarkNoteModal, setBookmarkNoteModal] = useState<{ verse: AlkitabVerse; color: string } | null>(null);
  const [bookmarkNoteInput, setBookmarkNoteInput] = useState<string>('');

  // Search Engine State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchTestament, setSearchTestament] = useState<'ALL' | 'PL' | 'PB'>('ALL');
  const [searchBookFilter, setSearchBookFilter] = useState<string>('');
  const [searchResults, setSearchResults] = useState<AlkitabSearchResult[]>([]);
  const [searchTotalFound, setSearchTotalFound] = useState<number>(0);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [searchPage, setSearchPage] = useState<number>(1);
  const [searchTotalPages, setSearchTotalPages] = useState<number>(1);

  // Daily Devotional Verse State
  const [dailyVerse, setDailyVerse] = useState<AlkitabVerse | null>(null);
  const [isLoadingDaily, setIsLoadingDaily] = useState<boolean>(false);

  // Save display preferences
  useEffect(() => {
    localStorage.setItem('gke_bible_theme', theme);
  }, [theme]);
  useEffect(() => {
    localStorage.setItem('gke_bible_fontsize', fontSize);
  }, [fontSize]);
  useEffect(() => {
    localStorage.setItem('gke_bible_fontfamily', fontFamily);
  }, [fontFamily]);
  useEffect(() => {
    localStorage.setItem('gke_bible_spacing', verseSpacing);
  }, [verseSpacing]);
  useEffect(() => {
    localStorage.setItem('gke_bible_show_perikop', String(showPerikop));
  }, [showPerikop]);
  useEffect(() => {
    localStorage.setItem('gke_bible_bookmarks', JSON.stringify(bookmarks));
  }, [bookmarks]);

  // Load Chapter Verses
  const fetchChapter = async (kitabAbbr: string, pasalNum: number, scrollAyat?: number) => {
    setIsLoadingVerses(true);
    setSelectedVerseIds([]);
    try {
      const res = await fetch(`/api/alkitab/chapter?kitab=${encodeURIComponent(kitabAbbr)}&pasal=${pasalNum}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.verses) {
          setVerses(data.verses);
          if (data.book) {
            setSelectedBook(data.book);
          }
          setSelectedChapter(data.pasal);
          const perikops = (data.perikopes && data.perikopes.length > 0)
            ? data.perikopes
            : getChapterPerikopes(data.book?.abbr || kitabAbbr, data.pasal);
          setChapterPerikopes(perikops);
          if (scrollAyat) {
            setTargetScrollAyat(scrollAyat);
          }
        }
      } else {
        // Fallback: direct parse if needed
        console.warn('API chapter returned non-ok status, checking fallback');
        const fallbackPerikopes = getChapterPerikopes(kitabAbbr, pasalNum);
        setChapterPerikopes(fallbackPerikopes);
      }
    } catch (err) {
      console.error('Error fetching chapter:', err);
      const fallbackPerikopes = getChapterPerikopes(kitabAbbr, pasalNum);
      setChapterPerikopes(fallbackPerikopes);
    } finally {
      setIsLoadingVerses(false);
    }
  };

  // Initial load: Yohanes 1 or last viewed
  useEffect(() => {
    fetchChapter(selectedBook.abbr, selectedChapter);
  }, []);

  // Fetch Daily Verse
  useEffect(() => {
    const fetchDaily = async () => {
      setIsLoadingDaily(true);
      try {
        const res = await fetch('/api/alkitab/daily-verse');
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.verse) {
            setDailyVerse(data.verse);
          }
        }
      } catch (err) {
        console.error('Error fetching daily verse:', err);
      } finally {
        setIsLoadingDaily(false);
      }
    };
    fetchDaily();
  }, []);

  // Scroll to targeted verse when loaded
  useEffect(() => {
    if (targetScrollAyat && verses.length > 0) {
      const timer = setTimeout(() => {
        const elem = document.getElementById(`verse-${targetScrollAyat}`);
        if (elem) {
          elem.scrollIntoView({ behavior: 'smooth', block: 'center' });
          elem.classList.add('ring-2', 'ring-amber-500', 'bg-amber-100/50');
          setTimeout(() => {
            elem.classList.remove('ring-2', 'ring-amber-500');
          }, 3500);
        }
        setTargetScrollAyat(null);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [verses, targetScrollAyat]);

  // Handle Quick Reference Jump (e.g. "Yohanes 3:16", "Mzm 23", "1 Kor 13:4-8")
  const handleQuickJump = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setQuickJumpError(null);
    if (!quickJumpInput.trim()) return;

    const parsed = parseNats(quickJumpInput);
    if (parsed) {
      setSelectedBook(parsed.book);
      setSelectedChapter(parsed.pasal);
      setActiveView('reader');
      await fetchChapter(parsed.book.abbr, parsed.pasal, parsed.ayatStart);
      setQuickJumpInput('');
    } else {
      // Try API lookup
      try {
        const res = await fetch(`/api/alkitab/lookup?ref=${encodeURIComponent(quickJumpInput.trim())}`);
        const data = await res.json();
        if (data.success && data.book) {
          setSelectedBook(data.book);
          setSelectedChapter(data.pasal);
          setActiveView('reader');
          await fetchChapter(data.book.abbr, data.pasal, data.ayatStart);
          setQuickJumpInput('');
        } else {
          setQuickJumpError('Nats tidak ditemukan. Gunakan format seperti: "Yohanes 3:16", "Mzm 23", atau "Kej 1:1"');
        }
      } catch (err) {
        setQuickJumpError('Gagal mencari nats. Periksa penulisan nama kitab dan nomor pasal.');
      }
    }
  };

  // Chapter Navigation (Previous / Next)
  const handlePrevChapter = () => {
    if (selectedChapter > 1) {
      const newPasal = selectedChapter - 1;
      setSelectedChapter(newPasal);
      fetchChapter(selectedBook.abbr, newPasal);
    } else {
      // Go to previous book's last chapter
      const idx = ALKITAB_BOOKS.findIndex((b) => b.abbr === selectedBook.abbr);
      if (idx > 0) {
        const prevBook = ALKITAB_BOOKS[idx - 1];
        setSelectedBook(prevBook);
        setSelectedChapter(prevBook.totalChapters);
        fetchChapter(prevBook.abbr, prevBook.totalChapters);
      }
    }
  };

  const handleNextChapter = () => {
    if (selectedChapter < selectedBook.totalChapters) {
      const newPasal = selectedChapter + 1;
      setSelectedChapter(newPasal);
      fetchChapter(selectedBook.abbr, newPasal);
    } else {
      // Go to next book's chapter 1
      const idx = ALKITAB_BOOKS.findIndex((b) => b.abbr === selectedBook.abbr);
      if (idx < ALKITAB_BOOKS.length - 1) {
        const nextBook = ALKITAB_BOOKS[idx + 1];
        setSelectedBook(nextBook);
        setSelectedChapter(1);
        fetchChapter(nextBook.abbr, 1);
      }
    }
  };

  // Full-Text Search Handler
  const handlePerformSearch = async (pageToFetch = 1) => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) return;
    setIsSearching(true);
    try {
      const params = new URLSearchParams({
        q: searchQuery.trim(),
        testament: searchTestament,
        kitab: searchBookFilter,
        page: pageToFetch.toString(),
        limit: '40',
      });
      const res = await fetch(`/api/alkitab/search?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setSearchResults(data.results || []);
          setSearchTotalFound(data.totalFound || 0);
          setSearchPage(data.page || 1);
          setSearchTotalPages(data.totalPages || 1);
        }
      }
    } catch (err) {
      console.error('Error executing Bible search:', err);
    } finally {
      setIsSearching(false);
    }
  };

  // Verse Selection Toggle
  const toggleVerseSelection = (verseId: number) => {
    setSelectedVerseIds((prev) =>
      prev.includes(verseId) ? prev.filter((id) => id !== verseId) : [...prev, verseId].sort((a, b) => a - b)
    );
  };

  const selectedVersesObjects = useMemo(() => {
    return verses.filter((v) => selectedVerseIds.includes(v.ayat));
  }, [verses, selectedVerseIds]);

  // Copy Verses to Clipboard
  const handleCopySelectedVerses = () => {
    const targetVerses = selectedVersesObjects.length > 0 ? selectedVersesObjects : verses;
    const text = formatVerseText(targetVerses, selectedBook.name, selectedChapter);
    navigator.clipboard.writeText(text);
    setCopiedNotification(
      `Teks ${selectedBook.name} ${selectedChapter}:${
        selectedVersesObjects.length > 0
          ? `${selectedVersesObjects[0].ayat}-${selectedVersesObjects[selectedVersesObjects.length - 1].ayat}`
          : `1-${verses.length}`
      } berhasil disalin ke clipboard!`
    );
    setTimeout(() => setCopiedNotification(null), 3500);
  };

  // WhatsApp Share URL
  const whatsappShareUrl = useMemo(() => {
    const targetVerses = selectedVersesObjects.length > 0 ? selectedVersesObjects : verses.slice(0, 10);
    return generateWhatsAppBibleUrl(targetVerses, selectedBook.name, selectedChapter, settings.namaJemaat);
  }, [selectedVersesObjects, verses, selectedBook, selectedChapter, settings.namaJemaat]);

  // Bookmark Management
  const handleAddBookmark = (verse: AlkitabVerse, color = 'amber', catatan = '') => {
    const existingIndex = bookmarks.findIndex((b) => b.kitab === verse.kitab && b.pasal === verse.pasal && b.ayat === verse.ayat);
    if (existingIndex >= 0) {
      // Remove
      setBookmarks((prev) => prev.filter((_, idx) => idx !== existingIndex));
      setCopiedNotification(`Tanda buku ayat ${verse.kitabName} ${verse.pasal}:${verse.ayat} dihapus.`);
    } else {
      const newBm: AlkitabBookmark = {
        id: `bm-${Date.now()}-${Math.random()}`,
        verseId: verse.id,
        kitab: verse.kitab,
        kitabName: verse.kitabName || selectedBook.name,
        pasal: verse.pasal,
        ayat: verse.ayat,
        firman: verse.firman,
        color,
        catatan,
        createdAt: new Date().toISOString(),
      };
      setBookmarks((prev) => [newBm, ...prev]);
      setCopiedNotification(`Ayat ${verse.kitabName || selectedBook.name} ${verse.pasal}:${verse.ayat} ditambahkan ke Tanda Buku.`);
    }
    setTimeout(() => setCopiedNotification(null), 3000);
  };

  // Check if verse is bookmarked
  const getVerseBookmark = (ayatNum: number) => {
    return bookmarks.find((b) => b.kitab === selectedBook.abbr && b.pasal === selectedChapter && b.ayat === ayatNum);
  };

  // Theme Styling Classes - high contrast, sharp text in light, sepia, cream, and dark
  const themeClasses = {
    light: {
      wrapper: 'bg-white text-slate-900 border-slate-200 shadow-sm',
      header: 'bg-slate-50 border-slate-200 text-slate-900',
      title: 'text-slate-950',
      badge: 'bg-slate-100 text-slate-800 border-slate-200',
      verseNum: 'text-indigo-700 font-extrabold',
      activeVerse: 'bg-indigo-50/90 border-indigo-300 ring-1 ring-indigo-400',
      text: 'text-slate-900 font-medium',
      subtext: 'text-slate-600 font-bold',
    },
    sepia: {
      wrapper: 'bg-[#fbf0d9] text-[#332211] border-[#ebd7b2] shadow-sm',
      header: 'bg-[#f4e4c1] border-[#e8d5a7] text-[#38230b]',
      title: 'text-[#38230b]',
      badge: 'bg-[#edd8aa]/90 text-[#38230b] border-[#dfc58e]',
      verseNum: 'text-[#8b4513] font-black',
      activeVerse: 'bg-[#ebd49e] border-[#d8bc7e] ring-1 ring-[#cfae6a]',
      text: 'text-[#2a1d0d] font-medium',
      subtext: 'text-[#78522c] font-bold',
    },
    cream: {
      wrapper: 'bg-[#faf8f5] text-stone-900 border-[#e7e1d7] shadow-sm',
      header: 'bg-[#eeeae3] border-[#ded8cf] text-stone-900',
      title: 'text-stone-950',
      badge: 'bg-[#eeeae3] text-stone-800 border-[#ded8cf]',
      verseNum: 'text-amber-800 font-black',
      activeVerse: 'bg-[#e8e0d2] border-[#cfc4b0] ring-1 ring-[#bfae94]',
      text: 'text-stone-900 font-medium',
      subtext: 'text-stone-600 font-bold',
    },
    dark: {
      wrapper: 'bg-slate-950 text-slate-100 border-slate-800 shadow-md',
      header: 'bg-slate-900 border-slate-800 text-white',
      title: 'text-white',
      badge: 'bg-slate-900 text-slate-200 border-slate-800',
      verseNum: 'text-amber-400 font-black',
      activeVerse: 'bg-slate-900 border-slate-700 ring-1 ring-indigo-500/50',
      text: 'text-slate-100 font-normal',
      subtext: 'text-slate-400 font-bold',
    },
  };

  // Compact, comfortable font sizing with balanced line height (no loose gaps)
  const fontSizeClasses = {
    sm: 'text-xs sm:text-sm leading-normal sm:leading-relaxed',
    base: 'text-sm sm:text-base leading-normal sm:leading-relaxed',
    lg: 'text-base sm:text-lg leading-normal sm:leading-relaxed',
    xl: 'text-lg sm:text-xl leading-relaxed',
    '2xl': 'text-xl sm:text-2xl leading-relaxed',
  };

  // Tight verse spacing settings
  const verseSpacingClasses: Record<VerseSpacing, { container: string; item: string; gap: string }> = {
    compact: {
      container: 'space-y-1 sm:space-y-1.5',
      item: 'py-1 px-2 sm:py-1 sm:px-2.5 rounded-lg',
      gap: 'gap-2 sm:gap-2.5',
    },
    normal: {
      container: 'space-y-2 sm:space-y-2.5',
      item: 'py-1.5 px-2.5 sm:py-2 sm:px-3 rounded-xl',
      gap: 'gap-2.5 sm:gap-3',
    },
    relaxed: {
      container: 'space-y-3.5 sm:space-y-4',
      item: 'p-2 sm:p-2.5 rounded-xl',
      gap: 'gap-2.5 sm:gap-3.5',
    },
  };

  const currentThemeStyle = themeClasses[theme] || themeClasses.sepia;

  // Filtered Books for the Book Picker
  const filteredPickerBooks = useMemo(() => {
    return ALKITAB_BOOKS.filter((b) => {
      if (pickerTestament !== 'ALL' && b.testament !== pickerTestament) return false;
      if (pickerCategoryFilter !== 'ALL' && b.group !== pickerCategoryFilter) return false;
      if (pickerSearch) {
        const q = pickerSearch.toLowerCase();
        return (
          b.name.toLowerCase().includes(q) ||
          b.abbr.toLowerCase().includes(q) ||
          b.fullName.toLowerCase().includes(q) ||
          b.group.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [pickerTestament, pickerCategoryFilter, pickerSearch]);

  const uniqueCategories = useMemo(() => {
    const set = new Set(ALKITAB_BOOKS.map((b) => b.group));
    return Array.from(set);
  }, []);

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-16">
      {/* Toast Notification */}
      {copiedNotification && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl border border-slate-700 flex items-center gap-3 animate-fade-in text-xs sm:text-sm">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{copiedNotification}</span>
        </div>
      )}

      {/* Main Top Header Banner */}
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white p-4 sm:p-6 rounded-2xl shadow-xl border border-slate-800 relative overflow-hidden">
        <div className="absolute -right-8 -bottom-10 opacity-10 pointer-events-none">
          <Church className="w-64 h-64 text-indigo-300" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-bold">
              <BookOpen className="w-3.5 h-3.5" />
              <span>Terjemahan Baru (TB) • Lembaga Alkitab Indonesia (LAI)</span>
            </div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2.5">
              <span>Alkitab Digital &amp; Naskah Firman Tuhan</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Database teks firman Tuhan lengkap 66 Kitab (39 Perjanjian Lama &amp; 27 Perjanjian Baru) berjumlah 31.102 ayat untuk pembacaan pribadi, liturgi ibadah, rancangan khotbah, dan persekutuan jemaat {settings.namaJemaat}.
            </p>
          </div>

          {/* Quick Tabs */}
          <div className="alkitab-quick-tabs flex items-center gap-1.5 bg-slate-200/90 dark:bg-slate-950/90 p-1.5 rounded-xl border border-slate-300 dark:border-slate-800 shrink-0 overflow-x-auto shadow-inner">
            <button
              type="button"
              onClick={() => setActiveView('reader')}
              className={`alkitab-tab-btn px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                activeView === 'reader'
                  ? 'active bg-indigo-600 text-white shadow-md'
                  : 'text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-white hover:bg-white/90 dark:hover:bg-slate-800'
              }`}
            >
              <BookOpen className={`w-3.5 h-3.5 ${activeView === 'reader' ? 'text-white' : 'text-slate-600 dark:text-slate-400'}`} />
              <span>Mode Baca</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveView('search')}
              className={`alkitab-tab-btn px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                activeView === 'search'
                  ? 'active bg-indigo-600 text-white shadow-md'
                  : 'text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-white hover:bg-white/90 dark:hover:bg-slate-800'
              }`}
            >
              <Search className={`w-3.5 h-3.5 ${activeView === 'search' ? 'text-white' : 'text-slate-600 dark:text-slate-400'}`} />
              <span>Pencarian Ayat</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveView('daily')}
              className={`alkitab-tab-btn px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                activeView === 'daily'
                  ? 'active bg-indigo-600 text-white shadow-md'
                  : 'text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-white hover:bg-white/90 dark:hover:bg-slate-800'
              }`}
            >
              <Sparkles className={`w-3.5 h-3.5 ${activeView === 'daily' ? 'text-amber-300' : 'text-amber-600 dark:text-amber-400'}`} />
              <span>Ayat Emas Hari Ini</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveView('bookmarks')}
              className={`alkitab-tab-btn px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                activeView === 'bookmarks'
                  ? 'active bg-indigo-600 text-white shadow-md'
                  : 'text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-white hover:bg-white/90 dark:hover:bg-slate-800'
              }`}
            >
              <Bookmark className={`w-3.5 h-3.5 ${activeView === 'bookmarks' ? 'text-rose-300' : 'text-rose-600 dark:text-rose-400'}`} />
              <span>Tanda Buku ({bookmarks.length})</span>
            </button>
          </div>
        </div>

        {/* Search Jump Input Bar */}
        <form onSubmit={handleQuickJump} className="mt-4 pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={quickJumpInput}
              onChange={(e) => {
                setQuickJumpInput(e.target.value);
                if (quickJumpError) setQuickJumpError(null);
              }}
              placeholder='Lompat cepat ke nats (Contoh: "Yohanes 3:16", "Mzm 23:1-6", "1 Korintus 13", "Kejadian 1")...'
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950/90 border border-slate-700 text-white text-xs sm:text-sm placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0"
          >
            <span>Buka Nats</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {quickJumpError && (
          <p className="mt-2 text-xs text-rose-400 flex items-center gap-1.5 font-medium">
            <span>⚠️ {quickJumpError}</span>
          </p>
        )}
      </div>

      {/* ========================================================================= */}
      {/* VIEW 1: MODE BACA (READER VIEW) */}
      {/* ========================================================================= */}
      {activeView === 'reader' && (
        <div className="space-y-4">
          {/* Navigation Bar: Book Selector, Chapter Selector, Controls */}
          <div className="bg-white p-3 sm:p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-wrap items-center justify-between gap-3">
            {/* Left: Book & Chapter Trigger */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsBookPickerOpen(true)}
                className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border border-indigo-200 rounded-xl text-xs sm:text-sm font-extrabold flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
              >
                <BookOpen className="w-4 h-4 text-indigo-600" />
                <span>
                  {selectedBook.name} • Pasal {selectedChapter}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-indigo-600" />
              </button>

              {/* Prev / Next Chapter Buttons */}
              <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden shadow-xs bg-slate-50">
                <button
                  type="button"
                  onClick={handlePrevChapter}
                  className="p-2 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                  title="Pasal Sebelumnya"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="px-2.5 text-xs font-bold text-slate-600 border-x border-slate-200">
                  {selectedChapter} / {selectedBook.totalChapters}
                </span>
                <button
                  type="button"
                  onClick={handleNextChapter}
                  className="p-2 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                  title="Pasal Selanjutnya"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Right: Quick Action Controls */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Selected Verses Action Bar if any verse is checked */}
              {selectedVerseIds.length > 0 && (
                <div className="flex items-center gap-1.5 bg-indigo-50 border border-indigo-200 px-3 py-1.5 rounded-xl animate-fade-in">
                  <span className="text-xs font-bold text-indigo-900">
                    {selectedVerseIds.length} Ayat Dipilih
                  </span>

                  <button
                    type="button"
                    onClick={handleCopySelectedVerses}
                    className="p-1.5 hover:bg-indigo-200/80 rounded-lg text-indigo-700 transition-colors cursor-pointer"
                    title="Salin Ayat Terpilih"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>

                  <a
                    href={whatsappShareUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 hover:bg-emerald-100 rounded-lg text-emerald-700 transition-colors cursor-pointer"
                    title="Bagikan Ayat ke WhatsApp"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                  </a>

                  <button
                    type="button"
                    onClick={() => {
                      openPrintReport({
                        reportType: 'alkitab_bacaan',
                        alkitabKitab: selectedBook.abbr,
                        alkitabPasal: selectedChapter,
                        alkitabAyatStart: selectedVerseIds[0],
                        alkitabAyatEnd: selectedVerseIds[selectedVerseIds.length - 1],
                        customTitle: `Naskah Bacaan Alkitab: ${selectedBook.name} ${selectedChapter}:${selectedVerseIds[0]}-${selectedVerseIds[selectedVerseIds.length - 1]} (TB)`,
                      });
                    }}
                    className="p-1.5 hover:bg-indigo-200/80 rounded-lg text-indigo-700 transition-colors cursor-pointer"
                    title="Cetak Naskah Bacaan Resmi"
                  >
                    <Printer className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedVerseIds([])}
                    className="p-1 text-slate-400 hover:text-slate-700 rounded cursor-pointer"
                    title="Batal Pilihan"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Salin Seluruh Pasal */}
              <button
                type="button"
                onClick={handleCopySelectedVerses}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Salin Teks Pasal"
              >
                <Copy className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Salin</span>
              </button>

              {/* Share WhatsApp Seluruh Pasal / Pilihan */}
              <a
                href={whatsappShareUrl}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-semibold rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Bagikan ke WhatsApp"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Bagikan WA</span>
              </a>

              {/* Toggle Perikop Alkitab */}
              <button
                type="button"
                onClick={() => setShowPerikop(!showPerikop)}
                className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border ${
                  showPerikop
                    ? 'bg-amber-100 hover:bg-amber-200 text-amber-900 border-amber-300 font-bold shadow-2xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600 border-slate-200'
                }`}
                title={showPerikop ? 'Perikop Alkitab Aktif (Klik untuk sembunyikan)' : 'Klik untuk tampilkan Perikop Alkitab (LAI TB)'}
              >
                <BookmarkCheck className={`w-3.5 h-3.5 ${showPerikop ? 'text-amber-700' : 'text-slate-400'}`} />
                <span className="hidden sm:inline">Perikop:</span>
                <span>{showPerikop ? 'Aktif' : 'Off'}</span>
              </button>

              {/* Cetak Naskah Bacaan Ibadah */}
              <button
                type="button"
                onClick={() => {
                  openPrintReport({
                    reportType: 'alkitab_bacaan',
                    alkitabKitab: selectedBook.abbr,
                    alkitabPasal: selectedChapter,
                    customTitle: `Naskah Bacaan Alkitab: ${selectedBook.name} Pasal ${selectedChapter} (TB)`,
                  });
                }}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-200"
                title="Cetak Format Lembar Bacaan Resmi GKE"
              >
                <Printer className="w-3.5 h-3.5 text-slate-600" />
                <span className="hidden sm:inline">Cetak Naskah</span>
              </button>

              {/* Display Customizer Toggle */}
              <button
                type="button"
                onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                className={`p-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border ${
                  isSettingsOpen
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                }`}
                title="Pengaturan Tampilan & Huruf"
              >
                <Type className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Collapsible Display Customizer Panel */}
          {isSettingsOpen && (
            <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-lg border border-slate-800 space-y-4 animate-fade-in text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="font-bold flex items-center gap-2 text-indigo-300">
                  <Sliders className="w-4 h-4" />
                  Pengaturan Tampilan &amp; Pembacaan
                </span>
                <button
                  type="button"
                  onClick={() => setIsSettingsOpen(false)}
                  className="text-slate-400 hover:text-white p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                {/* Theme Palette */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-slate-400 block">Warna Kertas / Tema:</label>
                  <div className="grid grid-cols-4 gap-1.5">
                    <button
                      type="button"
                      onClick={() => setTheme('light')}
                      className={`p-2 rounded-lg text-xs font-bold border flex flex-col items-center gap-1 transition-all ${
                        theme === 'light'
                          ? 'border-indigo-500 bg-white text-slate-900 ring-2 ring-indigo-500/30'
                          : 'border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <Sun className="w-3.5 h-3.5 text-amber-500" />
                      <span>Terang</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setTheme('sepia')}
                      className={`p-2 rounded-lg text-xs font-bold border flex flex-col items-center gap-1 transition-all ${
                        theme === 'sepia'
                          ? 'border-amber-600 bg-[#fbf0d9] text-[#433422] ring-2 ring-amber-600/30'
                          : 'border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <BookOpen className="w-3.5 h-3.5 text-amber-700" />
                      <span>Sepia</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setTheme('cream')}
                      className={`p-2 rounded-lg text-xs font-bold border flex flex-col items-center gap-1 transition-all ${
                        theme === 'cream'
                          ? 'border-stone-500 bg-[#faf8f5] text-stone-900 ring-2 ring-stone-500/30'
                          : 'border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <Layers className="w-3.5 h-3.5 text-stone-600" />
                      <span>Krim</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setTheme('dark')}
                      className={`p-2 rounded-lg text-xs font-bold border flex flex-col items-center gap-1 transition-all ${
                        theme === 'dark'
                          ? 'border-indigo-500 bg-slate-950 text-white ring-2 ring-indigo-500/30'
                          : 'border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <Moon className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Gelap</span>
                    </button>
                  </div>
                </div>

                {/* Font Size Adjuster */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-slate-400 block">Ukuran Huruf Firman:</label>
                  <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-xl border border-slate-700">
                    {(['sm', 'base', 'lg', 'xl', '2xl'] as FontSize[]).map((sz) => (
                      <button
                        key={sz}
                        type="button"
                        onClick={() => setFontSize(sz)}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-bold uppercase transition-all ${
                          fontSize === sz ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        {sz}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Font Family Switcher */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-slate-400 block">Gaya Tipografi:</label>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={() => setFontFamily('serif')}
                      className={`py-2 px-3 rounded-lg text-xs font-bold font-serif border transition-all ${
                        fontFamily === 'serif'
                          ? 'bg-indigo-600 text-white border-indigo-500'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700'
                      }`}
                    >
                      Serif (Klasik)
                    </button>
                    <button
                      type="button"
                      onClick={() => setFontFamily('sans')}
                      className={`py-2 px-3 rounded-lg text-xs font-bold font-sans border transition-all ${
                        fontFamily === 'sans'
                          ? 'bg-indigo-600 text-white border-indigo-500'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700'
                      }`}
                    >
                      Sans (Modern)
                    </button>
                  </div>
                </div>

                {/* Verse Spacing Switcher */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-slate-400 block">Jarak Antar Ayat:</label>
                  <div className="grid grid-cols-3 gap-1.5">
                    <button
                      type="button"
                      onClick={() => setVerseSpacing('compact')}
                      className={`py-2 px-2 rounded-lg text-xs font-bold border transition-all ${
                        verseSpacing === 'compact'
                          ? 'bg-indigo-600 text-white border-indigo-500 ring-2 ring-indigo-500/30'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700'
                      }`}
                    >
                      Rapat
                    </button>
                    <button
                      type="button"
                      onClick={() => setVerseSpacing('normal')}
                      className={`py-2 px-2 rounded-lg text-xs font-bold border transition-all ${
                        verseSpacing === 'normal'
                          ? 'bg-indigo-600 text-white border-indigo-500 ring-2 ring-indigo-500/30'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700'
                      }`}
                    >
                      Sedang
                    </button>
                    <button
                      type="button"
                      onClick={() => setVerseSpacing('relaxed')}
                      className={`py-2 px-2 rounded-lg text-xs font-bold border transition-all ${
                        verseSpacing === 'relaxed'
                          ? 'bg-indigo-600 text-white border-indigo-500 ring-2 ring-indigo-500/30'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700'
                      }`}
                    >
                      Renggang
                    </button>
                  </div>
                </div>

                {/* Perikop Alkitab Toggle */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-slate-400 block">Judul Perikop (LAI TB):</label>
                  <button
                    type="button"
                    onClick={() => setShowPerikop(!showPerikop)}
                    className={`w-full py-2 px-2.5 rounded-lg text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${
                      showPerikop
                        ? 'bg-amber-500 text-slate-950 border-amber-400 ring-2 ring-amber-500/30'
                        : 'bg-slate-800 text-slate-300 border-slate-700'
                    }`}
                  >
                    <BookmarkCheck className="w-4 h-4 text-slate-900" />
                    <span>{showPerikop ? 'Perikop Aktif' : 'Sembunyi'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Reading Paper Canvas */}
          <div
            data-theme={theme}
            className={`alkitab-paper-canvas theme-${theme} p-4 sm:p-7 md:p-10 rounded-2xl shadow-md border transition-colors duration-200 ${
              currentThemeStyle.wrapper
            } ${fontFamily === 'serif' ? 'font-serif' : 'font-sans'}`}
          >
            {/* Paper Header */}
            <div className="text-center pb-5 sm:pb-6 border-b border-black/10 space-y-1.5">
              <span className={`alkitab-header-subtext text-xs uppercase tracking-widest font-black ${currentThemeStyle.subtext}`}>
                {selectedBook.testament === 'PL' ? 'Perjanjian Lama' : 'Perjanjian Baru'} • {selectedBook.group}
              </span>
              <h2
                className={`alkitab-book-title title-${theme} text-2xl sm:text-3xl md:text-4xl font-black tracking-tight ${currentThemeStyle.title}`}
                style={{
                  color:
                    theme === 'sepia'
                      ? '#38230b'
                      : theme === 'cream'
                      ? '#1c1917'
                      : theme === 'light'
                      ? '#0f172a'
                      : '#ffffff',
                }}
              >
                {selectedBook.name}
              </h2>
              <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold border ${currentThemeStyle.badge}`}>
                <span>Pasal {selectedChapter}</span>
                <span>•</span>
                <span>{verses.length} Ayat</span>
              </div>
            </div>

            {/* Verses Reading Content */}
            {isLoadingVerses ? (
              <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
                <RefreshCw className="w-8 h-8 animate-spin text-indigo-500" />
                <p className="text-sm font-medium">Memuat ayat Firman Tuhan...</p>
              </div>
            ) : verses.length === 0 ? (
              <div className="py-16 text-center text-slate-400 space-y-2">
                <BookOpen className="w-12 h-12 mx-auto text-slate-300" />
                <p className="text-sm font-bold">Ayat tidak ditemukan untuk pasal ini.</p>
              </div>
            ) : (
              <div className={`mt-4 sm:mt-6 ${verseSpacingClasses[verseSpacing].container} ${fontSizeClasses[fontSize]}`}>
                {verses.map((verse) => {
                  const isSelected = selectedVerseIds.includes(verse.ayat);
                  const bookmark = getVerseBookmark(verse.ayat);
                  const perikopStartingHere = showPerikop
                    ? (activeChapterPerikopes.find((p) => p.ayatStart === verse.ayat) ||
                       getPerikopStartingAtVerse(selectedBook.abbr, selectedChapter, verse.ayat))
                    : null;

                  return (
                    <React.Fragment key={verse.id || verse.ayat}>
                      {/* Authentic Perikop Header Section */}
                      {perikopStartingHere && (
                        <div
                          id={`perikop-${verse.ayat}`}
                          className={`alkitab-perikop-divider text-center select-none ${
                            verse.ayat === 1
                              ? 'my-5 sm:my-6 pb-2'
                              : 'mt-8 sm:mt-10 mb-4 sm:mb-6 pt-6 sm:pt-8 border-t border-black/15'
                          }`}
                        >
                          <div className="flex items-center justify-center gap-3 mb-1.5">
                            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-black/25 to-transparent max-w-[120px] sm:max-w-xs" />
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] sm:text-xs font-bold uppercase tracking-wider bg-amber-500/15 text-amber-900 border border-amber-500/30">
                              <BookmarkCheck className="w-3.5 h-3.5 text-amber-700" />
                              <span>
                                {selectedBook.name} {selectedChapter}:{perikopStartingHere.ayatStart}{perikopStartingHere.ayatEnd !== perikopStartingHere.ayatStart ? `-${perikopStartingHere.ayatEnd}` : ''}
                              </span>
                            </span>
                            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-black/25 to-transparent max-w-[120px] sm:max-w-xs" />
                          </div>
                          <h3
                            className={`text-lg sm:text-xl md:text-2xl font-black font-serif tracking-tight leading-snug px-3 ${
                              theme === 'dark'
                                ? 'text-amber-300'
                                : theme === 'sepia'
                                ? 'text-[#4a2e12]'
                                : 'text-slate-900'
                            }`}
                          >
                            {perikopStartingHere.judul}
                          </h3>
                        </div>
                      )}

                      <div
                        id={`verse-${verse.ayat}`}
                        className={`alkitab-verse-item group relative ${verseSpacingClasses[verseSpacing].item} transition-all cursor-pointer select-text ${
                          isSelected
                            ? currentThemeStyle.activeVerse
                            : 'hover:bg-black/5'
                        }`}
                        onClick={() => toggleVerseSelection(verse.ayat)}
                      >
                        <div className={`flex items-start ${verseSpacingClasses[verseSpacing].gap}`}>
                          {/* Ayat Number */}
                          <span
                            className={`text-xs sm:text-sm font-black shrink-0 mt-0.5 select-none w-6 sm:w-7 text-right ${
                              currentThemeStyle.verseNum
                            }`}
                          >
                            {verse.ayat}
                          </span>

                          {/* Firman Text */}
                          <div className="flex-1 min-w-0">
                            <p className={`font-normal leading-normal sm:leading-relaxed ${currentThemeStyle.text}`}>
                              {verse.firman}
                            </p>

                            {bookmark && (
                              <div className="mt-1.5 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-800 text-[11px] font-bold">
                                <Bookmark className="w-3 h-3 text-amber-600 fill-amber-500" />
                                <span>Ditandai</span>
                                {bookmark.catatan && (
                                  <span className="font-normal italic truncate max-w-xs">
                                    — "{bookmark.catatan}"
                                  </span>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Quick Hover Action Buttons */}
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 shrink-0 bg-black/10 backdrop-blur-sm p-1 rounded-lg">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAddBookmark(verse);
                              }}
                              className="p-1 hover:bg-black/10 rounded text-slate-700"
                              title={bookmark ? 'Hapus Tanda Buku' : 'Tandai Ayat Ini'}
                            >
                              <Bookmark
                                className={`w-3.5 h-3.5 ${
                                  bookmark ? 'text-amber-600 fill-amber-500' : 'text-slate-600'
                                }`}
                              />
                            </button>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                const text = formatVerseText([verse], selectedBook.name, selectedChapter);
                                navigator.clipboard.writeText(text);
                                setCopiedNotification(`Ayat ${selectedBook.name} ${selectedChapter}:${verse.ayat} disalin.`);
                                setTimeout(() => setCopiedNotification(null), 3000);
                              }}
                              className="p-1 hover:bg-black/10 rounded text-slate-700"
                              title="Salin Ayat Ini"
                            >
                              <Copy className="w-3.5 h-3.5 text-slate-600" />
                            </button>

                            <a
                              href={generateWhatsAppBibleUrl([verse], selectedBook.name, selectedChapter, settings.namaJemaat)}
                              target="_blank"
                              rel="noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="p-1 hover:bg-black/10 rounded text-emerald-700"
                              title="Bagikan ke WhatsApp"
                            >
                              <Share2 className="w-3.5 h-3.5 text-emerald-600" />
                            </a>
                          </div>
                        </div>
                      </div>
                    </React.Fragment>
                  );
                })}
              </div>
            )}

            {/* Bottom Footer Navigation in Reader Canvas */}
            <div className="mt-10 pt-6 border-t border-black/10 flex items-center justify-between flex-wrap gap-3">
              <button
                type="button"
                onClick={handlePrevChapter}
                className="px-4 py-2 rounded-xl bg-black/5 hover:bg-black/10 font-bold text-xs sm:text-sm flex items-center gap-2 transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Pasal Sebelumnya</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="text-xs font-semibold hover:underline cursor-pointer"
              >
                Kembali ke Atas ↑
              </button>

              <button
                type="button"
                onClick={handleNextChapter}
                className="px-4 py-2 rounded-xl bg-black/5 hover:bg-black/10 font-bold text-xs sm:text-sm flex items-center gap-2 transition-colors cursor-pointer"
              >
                <span>Pasal Selanjutnya</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 2: PENCARIAN AYAT (FULL-TEXT SEARCH ENGINE) */}
      {/* ========================================================================= */}
      {activeView === 'search' && (
        <div className="space-y-4">
          <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
            <div className="flex items-center gap-2 text-indigo-900 font-extrabold text-base sm:text-lg">
              <Search className="w-5 h-5 text-indigo-600" />
              <span>Mesin Pencarian Nats Alkitab Terjemahan Baru</span>
            </div>

            {/* Search Input & Filters */}
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handlePerformSearch(1);
                    }}
                    placeholder='Ketik kata atau frasa (Contoh: "kasih", "damai sejahtera", "gembala", "terang dunia", "sukacita")...'
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-sm focus:outline-none focus:border-indigo-500 focus:bg-white"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => handlePerformSearch(1)}
                  disabled={isSearching || !searchQuery.trim()}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0"
                >
                  {isSearching ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                  <span>Cari Sekarang</span>
                </button>
              </div>

              {/* Filter Chips: Testament & Specific Book */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-500">Cakupan Perjanjian:</span>
                  <div className="inline-flex rounded-lg bg-slate-100 p-1 border border-slate-200">
                    <button
                      type="button"
                      onClick={() => setSearchTestament('ALL')}
                      className={`px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                        searchTestament === 'ALL' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Semua (PL &amp; PB)
                    </button>
                    <button
                      type="button"
                      onClick={() => setSearchTestament('PL')}
                      className={`px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                        searchTestament === 'PL' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Perjanjian Lama (39)
                    </button>
                    <button
                      type="button"
                      onClick={() => setSearchTestament('PB')}
                      className={`px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                        searchTestament === 'PB' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Perjanjian Baru (27)
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-500">Filter Kitab Spesifik:</span>
                  <select
                    value={searchBookFilter}
                    onChange={(e) => setSearchBookFilter(e.target.value)}
                    className="px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-300 text-slate-700 text-xs font-medium focus:outline-none focus:border-indigo-500"
                  >
                    <option value="">Semua Kitab</option>
                    <optgroup label="Perjanjian Lama">
                      {PL_BOOKS.map((b) => (
                        <option key={b.abbr} value={b.abbr}>
                          {b.name}
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="Perjanjian Baru">
                      {PB_BOOKS.map((b) => (
                        <option key={b.abbr} value={b.abbr}>
                          {b.name}
                        </option>
                      ))}
                    </optgroup>
                  </select>
                </div>
              </div>
            </div>

            {/* Search Results Summary */}
            {searchQuery && !isSearching && searchTotalFound > 0 && (
              <div className="p-3 bg-indigo-50/70 border border-indigo-100 rounded-xl flex items-center justify-between text-xs text-indigo-950">
                <span>
                  Ditemukan <strong>{searchTotalFound.toLocaleString('id-ID')}</strong> ayat mengandung kata "
                  <strong>{searchQuery}</strong>" (Halaman {searchPage} dari {searchTotalPages})
                </span>
              </div>
            )}

            {/* Results List */}
            {isSearching ? (
              <div className="py-16 text-center text-slate-400 space-y-3">
                <RefreshCw className="w-8 h-8 mx-auto animate-spin text-indigo-500" />
                <p className="text-sm font-medium">Mencari di seluruh 31.102 ayat Alkitab...</p>
              </div>
            ) : searchResults.length > 0 ? (
              <div className="space-y-3 pt-2">
                {searchResults.map((result) => {
                  return (
                    <div
                      key={result.id}
                      onClick={() => {
                        const book = findBook(result.kitab);
                        if (book) {
                          setSelectedBook(book);
                          setSelectedChapter(result.pasal);
                          setActiveView('reader');
                          fetchChapter(book.abbr, result.pasal, result.ayat);
                        }
                      }}
                      className="p-4 rounded-xl border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/30 transition-all cursor-pointer group space-y-1.5 shadow-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-extrabold text-indigo-700 flex items-center gap-1.5">
                          <BookOpen className="w-3.5 h-3.5" />
                          <span>
                            {result.kitabName} {result.pasal}:{result.ayat}
                          </span>
                        </span>
                        <span className="text-[10px] uppercase font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                          {result.testament === 'PL' ? 'Perjanjian Lama' : 'Perjanjian Baru'}
                        </span>
                      </div>

                      <p className="text-sm text-slate-800 leading-relaxed font-serif">
                        {result.firman}
                      </p>

                      {(() => {
                        const resultPerikop = getPerikopTitle(result.kitab, result.pasal, result.ayat);
                        return resultPerikop ? (
                          <div className="pt-0.5">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-50 text-amber-800 text-[11px] font-semibold border border-amber-200/80">
                              <BookmarkCheck className="w-3 h-3 text-amber-600" />
                              <span>Perikop: {resultPerikop}</span>
                            </span>
                          </div>
                        ) : null;
                      })()}

                      <div className="pt-1 flex items-center justify-end">
                        <span className="text-[11px] font-bold text-indigo-600 group-hover:translate-x-1 transition-transform flex items-center gap-1">
                          Buka di Pasal {result.pasal} →
                        </span>
                      </div>
                    </div>
                  );
                })}

                {/* Pagination Controls */}
                {searchTotalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 pt-4">
                    <button
                      type="button"
                      onClick={() => handlePerformSearch(Math.max(1, searchPage - 1))}
                      disabled={searchPage <= 1}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-700 text-xs font-bold rounded-lg cursor-pointer"
                    >
                      ← Sebelumnya
                    </button>
                    <span className="text-xs text-slate-600 font-bold px-2">
                      {searchPage} / {searchTotalPages}
                    </span>
                    <button
                      type="button"
                      onClick={() => handlePerformSearch(Math.min(searchTotalPages, searchPage + 1))}
                      disabled={searchPage >= searchTotalPages}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-700 text-xs font-bold rounded-lg cursor-pointer"
                    >
                      Selanjutnya →
                    </button>
                  </div>
                )}
              </div>
            ) : searchQuery ? (
              <div className="py-16 text-center text-slate-400 space-y-2">
                <Search className="w-10 h-10 mx-auto text-slate-300" />
                <p className="text-sm font-bold text-slate-600">Tidak ada ayat yang cocok dengan kata pencarian.</p>
                <p className="text-xs text-slate-400">Coba gunakan kata dasar seperti "kasih", "damai", "berkat", atau periksa ejaan.</p>
              </div>
            ) : (
              <div className="py-12 text-center text-slate-400 space-y-2">
                <Search className="w-10 h-10 mx-auto text-slate-300" />
                <p className="text-sm font-semibold text-slate-600">Masukkan kata kunci untuk mencari di seluruh Alkitab TB.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 3: AYAT EMAS & RENUNGAN HARIAN */}
      {/* ========================================================================= */}
      {activeView === 'daily' && (
        <div className="space-y-4">
          <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-slate-200 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 border border-amber-500/20">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900">Ayat Emas &amp; Mutiara Firman Hari Ini</h3>
                  <p className="text-xs text-slate-500">Inspirasi rohani harian untuk menguatkan iman dan langkah kehidupan</p>
                </div>
              </div>

              <span className="text-xs font-bold text-slate-400 bg-slate-100 px-3 py-1 rounded-full">
                {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </span>
            </div>

            {dailyVerse ? (
              <div className="p-6 sm:p-10 rounded-2xl bg-gradient-to-br from-indigo-900 via-slate-900 to-indigo-950 text-white shadow-xl space-y-6 relative overflow-hidden">
                <div className="absolute top-2 right-4 text-7xl font-serif text-white/5 select-none pointer-events-none">
                  ✝
                </div>

                <div className="space-y-4 relative z-10">
                  <p className="text-lg sm:text-2xl md:text-3xl font-serif font-medium leading-relaxed sm:leading-loose text-indigo-100">
                    "{dailyVerse.firman}"
                  </p>

                  <div className="pt-2 flex items-center justify-between flex-wrap gap-3 border-t border-indigo-800/60">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-3 py-1 rounded-lg bg-amber-500/20 text-amber-300 font-extrabold text-sm sm:text-base border border-amber-500/30">
                        {dailyVerse.kitabName} {dailyVerse.pasal}:{dailyVerse.ayat}
                      </span>
                      {(() => {
                        const dailyPerikop = findPerikopForReference(`${dailyVerse.kitabName} ${dailyVerse.pasal}:${dailyVerse.ayat}`) ||
                          getPerikopTitle(dailyVerse.kitab, dailyVerse.pasal, dailyVerse.ayat);
                        return dailyPerikop ? (
                          <span className="px-3 py-1 rounded-lg bg-white/10 text-amber-200 font-serif font-bold text-xs sm:text-sm border border-white/20 flex items-center gap-1.5">
                            <BookmarkCheck className="w-3.5 h-3.5 text-amber-400" />
                            <span>Perikop: {dailyPerikop}</span>
                          </span>
                        ) : null;
                      })()}
                      <span className="text-xs text-indigo-300">Terjemahan Baru (TB)</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const text = `"${dailyVerse.firman}"\n\n📖 ${dailyVerse.kitabName} ${dailyVerse.pasal}:${dailyVerse.ayat} (TB)\n🏛️ ${settings.namaJemaat}`;
                          navigator.clipboard.writeText(text);
                          setCopiedNotification('Ayat emas berhasil disalin!');
                          setTimeout(() => setCopiedNotification(null), 3000);
                        }}
                        className="px-3 py-2 bg-indigo-800 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>Salin Ayat</span>
                      </button>

                      <a
                        href={generateWhatsAppBibleUrl([dailyVerse], dailyVerse.kitabName || 'Yohanes', dailyVerse.pasal, settings.namaJemaat)}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                        <span>Bagikan ke WhatsApp</span>
                      </a>

                      <button
                        type="button"
                        onClick={() => {
                          const book = findBook(dailyVerse.kitab);
                          if (book) {
                            setSelectedBook(book);
                            setSelectedChapter(dailyVerse.pasal);
                            setActiveView('reader');
                            fetchChapter(book.abbr, dailyVerse.pasal, dailyVerse.ayat);
                          }
                        }}
                        className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Buka Pasal Lengkap</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-slate-400">
                <RefreshCw className="w-6 h-6 mx-auto animate-spin" />
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 4: TANDA BUKU & AYAT PILIHAN (BOOKMARKS) */}
      {/* ========================================================================= */}
      {activeView === 'bookmarks' && (
        <div className="space-y-4">
          <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-indigo-900 font-extrabold text-base sm:text-lg">
                <Bookmark className="w-5 h-5 text-rose-500" />
                <span>Daftar Tanda Buku &amp; Ayat Favorit ({bookmarks.length})</span>
              </div>

              {bookmarks.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    if (confirm('Apakah Anda yakin ingin menghapus seluruh tanda buku tersimpan?')) {
                      setBookmarks([]);
                    }
                  }}
                  className="text-xs text-rose-600 hover:text-rose-700 font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Hapus Semua</span>
                </button>
              )}
            </div>

            {bookmarks.length === 0 ? (
              <div className="py-16 text-center text-slate-400 space-y-2">
                <BookMarked className="w-12 h-12 mx-auto text-slate-300" />
                <p className="text-sm font-bold text-slate-600">Belum ada ayat yang ditandai.</p>
                <p className="text-xs text-slate-400">
                  Klik ikon tanda buku pada ayat saat membaca di Mode Baca untuk menyimpannya di sini.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {bookmarks.map((bm) => (
                  <div
                    key={bm.id}
                    className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-indigo-300 transition-all space-y-2 shadow-xs group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold text-indigo-700 flex items-center gap-1.5">
                        <Bookmark className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                        <span>
                          {bm.kitabName} {bm.pasal}:{bm.ayat}
                        </span>
                      </span>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            const book = findBook(bm.kitab);
                            if (book) {
                              setSelectedBook(book);
                              setSelectedChapter(bm.pasal);
                              setActiveView('reader');
                              fetchChapter(book.abbr, bm.pasal, bm.ayat);
                            }
                          }}
                          className="p-1 text-indigo-600 hover:bg-indigo-50 rounded text-xs font-semibold"
                          title="Buka Ayat di Mode Baca"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setBookmarks((prev) => prev.filter((b) => b.id !== bm.id));
                          }}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded"
                          title="Hapus Tanda Buku"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <p className="text-sm font-serif text-slate-800 leading-relaxed">
                      "{bm.firman}"
                    </p>

                    {bm.catatan && (
                      <p className="text-xs italic text-slate-500 bg-white p-2 rounded-lg border border-slate-100">
                        Catatan: {bm.catatan}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: BOOK & CHAPTER PICKER */}
      {/* ========================================================================= */}
      {isBookPickerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="modal-dark-header p-4 sm:p-5 bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <BookOpen className="w-5 h-5 text-indigo-400" />
                <div>
                  <h3 className="font-extrabold text-sm sm:text-base">Pilih Kitab &amp; Pasal Alkitab TB</h3>
                  <p className="text-[11px] text-slate-300">Pilih salah satu kitab dari 66 Kitab Perjanjian Lama &amp; Baru</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsBookPickerOpen(false);
                  setPickerSelectedBookForChapters(null);
                }}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Sub-header Filters */}
            <div className="p-3 sm:p-4 border-b border-slate-200 bg-slate-50 space-y-3 shrink-0">
              {/* Search in Modal */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={pickerSearch}
                  onChange={(e) => setPickerSearch(e.target.value)}
                  placeholder="Cari nama kitab (contoh: Matius, Kejadian, Roma, Mazmur)..."
                  className="w-full pl-10 pr-4 py-2 rounded-xl bg-white border border-slate-300 text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Testament Segment Switcher */}
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="inline-flex rounded-xl bg-slate-200 p-1 border border-slate-300">
                  <button
                    type="button"
                    onClick={() => {
                      setPickerTestament('ALL');
                      setPickerCategoryFilter('ALL');
                    }}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      pickerTestament === 'ALL' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-700 hover:text-slate-900'
                    }`}
                  >
                    Semua Kitab (66)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPickerTestament('PL');
                      setPickerCategoryFilter('ALL');
                    }}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      pickerTestament === 'PL' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-700 hover:text-slate-900'
                    }`}
                  >
                    Perjanjian Lama (39)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPickerTestament('PB');
                      setPickerCategoryFilter('ALL');
                    }}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      pickerTestament === 'PB' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-700 hover:text-slate-900'
                    }`}
                  >
                    Perjanjian Baru (27)
                  </button>
                </div>

                {pickerSelectedBookForChapters && (
                  <button
                    type="button"
                    onClick={() => setPickerSelectedBookForChapters(null)}
                    className="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-1"
                  >
                    ← Kembali ke Daftar Kitab
                  </button>
                )}
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-6 overflow-y-auto flex-1 bg-slate-50/50">
              {pickerSelectedBookForChapters ? (
                // CHAPTER SELECTOR GRID
                <div className="space-y-4">
                  <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl flex items-center justify-between">
                    <div>
                      <h4 className="font-extrabold text-sm sm:text-base text-indigo-950">
                        {pickerSelectedBookForChapters.fullName}
                      </h4>
                      <p className="text-xs text-indigo-700">
                        {pickerSelectedBookForChapters.group} • {pickerSelectedBookForChapters.totalChapters} Pasal (
                        {pickerSelectedBookForChapters.totalVerses} Ayat)
                      </p>
                    </div>
                    <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-indigo-600 text-white">
                      Pilih Nomor Pasal:
                    </span>
                  </div>

                  <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-2">
                    {Array.from({ length: pickerSelectedBookForChapters.totalChapters }, (_, i) => i + 1).map((pasalNum) => {
                      const isCurrent =
                        selectedBook.abbr === pickerSelectedBookForChapters.abbr && selectedChapter === pasalNum;
                      return (
                        <button
                          key={pasalNum}
                          type="button"
                          onClick={() => {
                            setSelectedBook(pickerSelectedBookForChapters);
                            setSelectedChapter(pasalNum);
                            setIsBookPickerOpen(false);
                            setPickerSelectedBookForChapters(null);
                            setActiveView('reader');
                            fetchChapter(pickerSelectedBookForChapters.abbr, pasalNum);
                          }}
                          className={`p-3 rounded-xl font-extrabold text-sm text-center transition-all cursor-pointer border ${
                            isCurrent
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-md ring-2 ring-indigo-400'
                              : 'bg-white hover:bg-indigo-50 text-slate-800 border-slate-200 hover:border-indigo-300'
                          }`}
                        >
                          {pasalNum}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : (
                // BOOK SELECTOR GRID
                <div className="space-y-6">
                  {/* If showing ALL or PL */}
                  {(pickerTestament === 'ALL' || pickerTestament === 'PL') && (
                    <div className="space-y-2.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-extrabold uppercase tracking-wider text-slate-600 bg-slate-200 px-2.5 py-0.5 rounded">
                          Perjanjian Lama (39 Kitab)
                        </span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                        {PL_BOOKS.filter((b) => filteredPickerBooks.some((fb) => fb.abbr === b.abbr)).map((book) => {
                          const isCurrent = selectedBook.abbr === book.abbr;
                          return (
                            <button
                              key={book.abbr}
                              type="button"
                              onClick={() => setPickerSelectedBookForChapters(book)}
                              className={`p-3 rounded-xl text-left transition-all cursor-pointer border flex flex-col justify-between ${
                                isCurrent
                                  ? 'bg-indigo-50 border-indigo-400 ring-1 ring-indigo-400'
                                  : 'bg-white hover:bg-slate-100/80 border-slate-200 hover:border-indigo-300'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-extrabold text-xs sm:text-sm text-slate-900">{book.name}</span>
                                <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                                  {book.abbr}
                                </span>
                              </div>
                              <span className="text-[10px] text-slate-500 mt-1">
                                {book.totalChapters} Pasal ({book.totalVerses} ayat)
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* If showing ALL or PB */}
                  {(pickerTestament === 'ALL' || pickerTestament === 'PB') && (
                    <div className="space-y-2.5 pt-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-extrabold uppercase tracking-wider text-indigo-700 bg-indigo-100 px-2.5 py-0.5 rounded">
                          Perjanjian Baru (27 Kitab)
                        </span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                        {PB_BOOKS.filter((b) => filteredPickerBooks.some((fb) => fb.abbr === b.abbr)).map((book) => {
                          const isCurrent = selectedBook.abbr === book.abbr;
                          return (
                            <button
                              key={book.abbr}
                              type="button"
                              onClick={() => setPickerSelectedBookForChapters(book)}
                              className={`p-3 rounded-xl text-left transition-all cursor-pointer border flex flex-col justify-between ${
                                isCurrent
                                  ? 'bg-indigo-50 border-indigo-400 ring-1 ring-indigo-400'
                                  : 'bg-white hover:bg-slate-100/80 border-slate-200 hover:border-indigo-300'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-extrabold text-xs sm:text-sm text-slate-900">{book.name}</span>
                                <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                                  {book.abbr}
                                </span>
                              </div>
                              <span className="text-[10px] text-slate-500 mt-1">
                                {book.totalChapters} Pasal ({book.totalVerses} ayat)
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
