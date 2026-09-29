import React, { useState, useMemo } from 'react';
import {
  BookOpen,
  HelpCircle,
  Compass,
  Search,
  CheckCircle2,
  ArrowRight,
  ExternalLink,
  FileText,
  Printer,
  Sparkles,
  Smartphone,
  Laptop,
  Users,
  DollarSign,
  Calendar,
  Church,
  ShieldCheck,
  Key,
  Bot,
  MessageCircle,
  Bookmark,
  ChevronRight,
  ChevronDown,
  Info,
  Lightbulb,
  Layers,
  Settings,
  QrCode,
  Package,
  Wrench,
  HeartHandshake,
  BookMarked,
  Check,
  Copy,
  RefreshCw,
  Sliders,
  X,
  Lock,
  UserCheck,
  Heart,
  Vote,
  Library,
  Feather,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import {
  tutorialCategories,
  faqList,
  TutorialCategory,
  TutorialStep,
  FaqItem,
} from '../../data/tutorialData';

export const TutorialModule: React.FC = () => {
  const { setActiveTab, setViewMode, currentUser, settings, openPrintReport } = useApp();

  const [selectedCategory, setSelectedCategory] = useState<string>('semua');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedStepId, setExpandedStepId] = useState<string | null>(null);
  const [expandedFaqId, setExpandedFaqId] = useState<string | null>(null);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Print Official GKE Guide Book
  const handlePrintPanduan = () => {
    openPrintReport({
      reportType: 'buku_panduan',
      customTitle: 'BUKU PANDUAN & PEDOMAN OPERASIONAL SISTEM INFORMASI GKE',
    });
  };

  // Completed checklist stored in localStorage
  const [completedSteps, setCompletedSteps] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('gke_tutorial_completed_steps');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const toggleStepCompleted = (stepKey: string) => {
    setCompletedSteps((prev) => {
      const next = prev.includes(stepKey)
        ? prev.filter((id) => id !== stepKey)
        : [...prev, stepKey];
      try {
        localStorage.setItem('gke_tutorial_completed_steps', JSON.stringify(next));
      } catch (err) {
        console.error('Gagal menyimpan status tutorial:', err);
      }
      return next;
    });
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(id);
    setTimeout(() => setCopiedText(null), 2000);
  };

  // Navigasi Cepat
  const handleNavigate = (tab?: string, portalTab?: string) => {
    if (portalTab) {
      setViewMode('public');
      // Portal tab can be set via AppContext if needed or public view
    } else if (tab) {
      setViewMode('admin');
      setActiveTab(tab);
    }
  };

  // Filter Categories and Steps based on Search
  const filteredCategories = useMemo(() => {
    return tutorialCategories
      .map((cat) => {
        if (selectedCategory !== 'semua' && cat.id !== selectedCategory) {
          return null;
        }

        const matchingSteps = cat.steps.filter((step) => {
          if (!searchQuery.trim()) return true;
          const q = searchQuery.toLowerCase();
          return (
            step.title.toLowerCase().includes(q) ||
            step.description.toLowerCase().includes(q) ||
            (step.tips && step.tips.toLowerCase().includes(q)) ||
            cat.title.toLowerCase().includes(q)
          );
        });

        if (matchingSteps.length === 0) return null;

        return {
          ...cat,
          steps: matchingSteps,
        };
      })
      .filter(Boolean) as TutorialCategory[];
  }, [selectedCategory, searchQuery, tutorialCategories]);

  // Filter FAQ based on Search
  const filteredFaq = useMemo(() => {
    if (!searchQuery.trim()) return faqList;
    const q = searchQuery.toLowerCase();
    return faqList.filter(
      (f) =>
        f.question.toLowerCase().includes(q) ||
        f.answer.toLowerCase().includes(q) ||
        f.category.toLowerCase().includes(q)
    );
  }, [searchQuery, faqList]);

  // Total steps count for progress
  const allStepKeys = useMemo(() => {
    const keys: string[] = [];
    tutorialCategories.forEach((cat) => {
      cat.steps.forEach((step) => {
        keys.push(`${cat.id}-${step.stepNumber}`);
      });
    });
    return keys;
  }, [tutorialCategories]);

  const progressPercentage = Math.round(
    (completedSteps.length / (allStepKeys.length || 1)) * 100
  );

  return (
    <div className="min-h-full pb-16 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white border-b border-indigo-950/80 px-4 sm:px-8 py-8 sm:py-10 shadow-lg relative overflow-hidden">
        {/* Background decorative church watermark */}
        <Church className="absolute right-[-20px] bottom-[-30px] w-64 h-64 text-indigo-700/15 pointer-events-none select-none" />

        <div className="max-w-6xl mx-auto relative z-10 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-200 border border-indigo-400/30 text-xs font-bold backdrop-blur-xs">
              <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
              <span>Pusat Panduan Resmi Jemaat GKE</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrintPanduan}
                className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/20 flex items-center gap-2 transition cursor-pointer backdrop-blur-xs shadow-xs"
                title="Cetak Buku Panduan Resmi Sistem GKE"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak / Simpan PDF Buku Panduan</span>
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight">
              Buku Panduan & Tutorial Penggunaan Sistem
            </h1>
            <p className="text-sm sm:text-base text-indigo-200 font-medium max-w-3xl leading-relaxed">
              Panduan interaktif langkah demi langkah untuk Warga Jemaat, Majelis Pengurus Harian (MPH),
              Bendahara, Sekretariat, dan Administrator dalam mengoperasikan seluruh fitur sistem informasi gereja.
            </p>
          </div>

          {/* Search Box */}
          <div className="pt-2 max-w-2xl">
            <div className="relative">
              <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari tutorial (contoh: QRIS, Kas, Baptis, Cetak, Surat, Jadwal, Akun)..."
                className="w-full pl-11 pr-10 py-3 rounded-2xl bg-white text-slate-900 placeholder:text-slate-400 text-sm font-medium border-2 border-indigo-300/40 focus:border-indigo-400 focus:outline-hidden shadow-xl"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
                  title="Bersihkan Pencarian"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-8 py-8 space-y-8">
        {/* Onboarding Progress Card */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20 shrink-0">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
                  Daftar Periksa Kemajuan Belajar Anda
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                  Centang materi panduan yang telah Anda baca dan kuasai untuk melacak pemahaman sistem.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 self-start sm:self-center">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                {completedSteps.length} dari {allStepKeys.length} Topik Selesai ({progressPercentage}%)
              </span>
              {completedSteps.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm('Reset semua centang kemajuan panduan?')) {
                      setCompletedSteps([]);
                      localStorage.removeItem('gke_tutorial_completed_steps');
                    }
                  }}
                  className="text-[11px] font-bold text-rose-600 hover:text-rose-700 underline cursor-pointer"
                >
                  Reset
                </button>
              )}
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-slate-200 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden border border-slate-300 dark:border-slate-700">
            <div
              className="h-full bg-gradient-to-r from-indigo-600 to-emerald-500 rounded-full transition-all duration-500"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        {/* Category Filter Tabs */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>Pilih Bidang / Kategori Panduan:</span>
            </h2>
            {searchQuery && (
              <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400">
                Menampilkan hasil pencarian "{searchQuery}"
              </span>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setSelectedCategory('semua')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                selectedCategory === 'semua'
                  ? 'bg-indigo-600 text-white border-indigo-700 shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 border-slate-300 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 shadow-2xs'
              }`}
            >
              Semua Panduan ({tutorialCategories.reduce((a, b) => a + b.steps.length, 0)})
            </button>

            {tutorialCategories.map((cat) => {
              const Icon = cat.icon;
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border flex items-center gap-2 ${
                    isSelected
                      ? 'bg-indigo-600 text-white border-indigo-700 shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 border-slate-300 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 shadow-2xs'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-white' : 'text-indigo-600 dark:text-indigo-400'}`} />
                  <span className={isSelected ? 'text-white' : 'text-slate-800 dark:text-slate-100'}>
                    {cat.title.split('(')[0].trim()}
                  </span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-black ${
                      isSelected
                        ? 'bg-white/20 text-white'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300/60 dark:border-slate-600/60'
                    }`}
                  >
                    {cat.steps.length}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Step-by-Step Sections */}
        <div className="space-y-8">
          {filteredCategories.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-10 text-center border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
              <HelpCircle className="w-12 h-12 text-slate-400 mx-auto" />
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
                Tidak ditemukan panduan untuk "{searchQuery}"
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Coba gunakan kata kunci lain seperti "kas", "qris", "surat", "warga", atau klik tombol "Semua Panduan".
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('semua');
                }}
                className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Tampilkan Semua Panduan
              </button>
            </div>
          ) : (
            filteredCategories.map((cat) => {
              const CatIcon = cat.icon;
              return (
                <div
                  key={cat.id}
                  className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden"
                >
                  {/* Category Header Banner */}
                  <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 dark:bg-slate-800/60">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${cat.color} text-white flex items-center justify-center shadow-md shrink-0`}
                      >
                        <CatIcon className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-black text-slate-900 dark:text-slate-100">
                            {cat.title}
                          </h3>
                          <span className="hidden sm:inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                            {cat.roleBadge}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 font-medium">
                          {cat.shortDesc}
                        </p>
                      </div>
                    </div>

                    <span className="sm:hidden self-start px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                      {cat.roleBadge}
                    </span>
                  </div>

                  {/* Steps List */}
                  <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
                    {cat.steps.map((step) => {
                      const stepKey = `${cat.id}-${step.stepNumber}`;
                      const isCompleted = completedSteps.includes(stepKey);
                      const isExpanded =
                        expandedStepId === stepKey ||
                        searchQuery.trim().length > 0 ||
                        filteredCategories.length === 1;

                      return (
                        <div
                          key={step.stepNumber}
                          className={`p-5 sm:p-6 transition-colors ${
                            isCompleted
                              ? 'bg-emerald-50/20 dark:bg-emerald-950/10'
                              : 'hover:bg-slate-50/50 dark:hover:bg-slate-800/30'
                          }`}
                        >
                          <div className="flex items-start gap-3 sm:gap-4">
                            {/* Checkbox for progress */}
                            <button
                              type="button"
                              onClick={() => toggleStepCompleted(stepKey)}
                              className={`mt-0.5 w-7 h-7 rounded-xl flex items-center justify-center transition-all cursor-pointer shrink-0 border-2 group/chk ${
                                isCompleted
                                  ? 'bg-emerald-600 border-emerald-500 text-white shadow-md shadow-emerald-900/30'
                                  : 'bg-slate-50 dark:bg-slate-800/90 border-slate-400 dark:border-slate-500 hover:border-emerald-500 dark:hover:border-emerald-400 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/40 shadow-xs'
                              }`}
                              title={
                                isCompleted
                                  ? 'Selesai dipelajari (Klik untuk batal centang)'
                                  : 'Belum dipelajari (Klik untuk centang sudah selesai)'
                              }
                            >
                              {isCompleted ? (
                                <Check className="w-4 h-4 text-white dark:text-white stroke-[3]" />
                              ) : (
                                <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 opacity-0 group-hover/chk:opacity-60 transition-opacity" />
                              )}
                            </button>

                            {/* Step Number Badge */}
                            <div className="w-7 h-7 rounded-full bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 font-black text-xs flex items-center justify-center shrink-0 border border-indigo-200 dark:border-indigo-800">
                              {step.stepNumber}
                            </div>

                            {/* Main Content */}
                            <div className="flex-1 min-w-0 space-y-2">
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <h4
                                  onClick={() =>
                                    setExpandedStepId(isExpanded ? null : stepKey)
                                  }
                                  className={`text-sm sm:text-base font-black cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400 flex flex-wrap items-center gap-2 ${
                                    isCompleted
                                      ? 'text-slate-800 dark:text-slate-200'
                                      : 'text-slate-900 dark:text-slate-100'
                                  }`}
                                >
                                  <span>{step.title}</span>
                                  {isCompleted && (
                                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 flex items-center gap-1">
                                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                                      <span>Selesai</span>
                                    </span>
                                  )}
                                  {step.badge && (
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/80">
                                      {step.badge}
                                    </span>
                                  )}
                                </h4>

                                <button
                                  type="button"
                                  onClick={() =>
                                    setExpandedStepId(isExpanded ? null : stepKey)
                                  }
                                  className="text-xs font-bold text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center gap-1.5 cursor-pointer bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 transition"
                                >
                                  <span>{isExpanded ? 'Tutup' : 'Lihat Rincian'}</span>
                                  {isExpanded ? (
                                    <ChevronDown className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                                  ) : (
                                    <ChevronRight className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                                  )}
                                </button>
                              </div>

                              {/* Collapsible details */}
                              {isExpanded && (
                                <div className="pt-2 space-y-3 text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-normal">
                                  {step.description.split('\n').map((paragraph, pIdx) => {
                                    if (!paragraph.trim()) return null;
                                    return (
                                      <p key={pIdx} className="leading-relaxed">
                                        {paragraph}
                                      </p>
                                    );
                                  })}

                                  {/* Pro-Tips Callout */}
                                  {step.tips && (
                                    <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200/90 dark:border-amber-800/60 text-amber-900 dark:text-amber-200 text-xs flex items-start gap-2.5">
                                      <Lightbulb className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                                      <div className="space-y-0.5">
                                        <strong className="font-extrabold">Tips Praktis:</strong>
                                        <p>{step.tips}</p>
                                      </div>
                                    </div>
                                  )}

                                  {/* Quick Action Button to Navigate Directly */}
                                  {(step.actionTab || step.actionPortalTab) && (
                                    <div className="pt-2 flex items-center gap-2">
                                      <button
                                        type="button"
                                        onClick={() =>
                                          handleNavigate(
                                            step.actionTab,
                                            step.actionPortalTab
                                          )
                                        }
                                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer"
                                      >
                                        <span>
                                          {step.actionLabel || 'Buka Menu Ini Sekarang'}
                                        </span>
                                        <ArrowRight className="w-3.5 h-3.5" />
                                      </button>
                                      <span className="text-[11px] text-slate-500 font-medium">
                                        Langsung mencoba di aplikasi
                                      </span>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* FAQ (Tanya Jawab Umum) Section */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-200 dark:border-indigo-800 shrink-0">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100">
                Tanya Jawab Umum & Pemecahan Kendala (FAQ)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Pertanyaan yang paling sering diajukan terkait pengoperasian dan pemeliharaan aplikasi gereja.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredFaq.map((faq) => {
              const isFaqExpanded = expandedFaqId === faq.id;
              return (
                <div
                  key={faq.id}
                  className="rounded-2xl border border-slate-200 dark:border-slate-800 p-4 bg-slate-50/50 dark:bg-slate-800/30 hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors space-y-2 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                        {faq.category}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedFaqId(isFaqExpanded ? null : faq.id)
                        }
                        className="text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        {isFaqExpanded ? (
                          <ChevronDown className="w-4 h-4" />
                        ) : (
                          <ChevronRight className="w-4 h-4" />
                        )}
                      </button>
                    </div>

                    <h4
                      onClick={() =>
                        setExpandedFaqId(isFaqExpanded ? null : faq.id)
                      }
                      className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 cursor-pointer hover:text-indigo-600"
                    >
                      {faq.question}
                    </h4>

                    {isFaqExpanded && (
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed pt-1">
                        {faq.answer}
                      </p>
                    )}
                  </div>

                  {faq.relatedTab && isFaqExpanded && (
                    <div className="pt-2 border-t border-slate-200 dark:border-slate-700/60">
                      <button
                        type="button"
                        onClick={() => handleNavigate(faq.relatedTab)}
                        className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <span>{faq.relatedTabLabel || 'Buka Modul Terkait'}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Mobile & Keyboard Shortcut Pro-Tips */}
        <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-xl space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-400/30">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-white">
                Tips Penggunaan di Ponsel (Android & iPhone)
              </h3>
              <p className="text-xs text-indigo-200">
                Optimalkan pengalaman aplikasi di ponsel pintar pengurus dan jemaat.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="bg-white/5 rounded-2xl p-4 border border-white/10 space-y-1.5">
              <strong className="font-bold text-amber-300 flex items-center gap-1.5">
                <Laptop className="w-4 h-4" />
                <span>Instal ke Layar Utama</span>
              </strong>
              <p className="text-slate-300 leading-relaxed">
                Tambahkan aplikasi ke layar utama (Add to Home screen) agar terbuka satu layar penuh tanpa bilah peramban.
              </p>
            </div>

            <div className="bg-white/5 rounded-2xl p-4 border border-white/10 space-y-1.5">
              <strong className="font-bold text-emerald-300 flex items-center gap-1.5">
                <Printer className="w-4 h-4" />
                <span>Cetak Cepat (Ctrl + P)</span>
              </strong>
              <p className="text-slate-300 leading-relaxed">
                Gunakan pintasan keyboard <strong>Ctrl + P</strong> (Windows) atau <strong>Cmd + P</strong> (Mac) untuk langsung mencetak dokumen yang sedang dibuka.
              </p>
            </div>

            <div className="bg-white/5 rounded-2xl p-4 border border-white/10 space-y-1.5">
              <strong className="font-bold text-sky-300 flex items-center gap-1.5">
                <RefreshCw className="w-4 h-4" />
                <span>Penyegaran Data Instan</span>
              </strong>
              <p className="text-slate-300 leading-relaxed">
                Tarik layar ke bawah (pull-to-refresh) di ponsel atau klik ikon profil &gt; "Hapus Cache" jika data belum terbarukan.
              </p>
            </div>
          </div>
        </div>

        {/* Footer info & Contact */}
        <div className="text-center space-y-2 pt-4">
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
            {settings?.namaJemaat || 'Majelis Jemaat GKE'} • Sistem Informasi Manajemen Jemaat
          </p>
          <p className="text-[11px] text-slate-400">
            Buku Panduan & Tutorial Penggunaan Versi 3.0 • Terakhir diperbarui September 2026
          </p>
        </div>
      </div>
    </div>
  );
};
