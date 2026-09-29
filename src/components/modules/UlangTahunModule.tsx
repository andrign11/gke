import React, { useState, useMemo } from 'react';
import {
  Cake,
  Heart,
  Calendar,
  Search,
  Filter,
  Printer,
  Sparkles,
  MessageCircle,
  Copy,
  Check,
  Users,
  MapPin,
  Gift,
  Trash2,
  RefreshCw,
  Info,
  ChevronRight,
  PartyPopper,
  Clock,
  Phone,
  Grid,
  List,
  Flame,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { WargaJemaat } from '../../types';

const NAMA_BULAN_INDONESIA = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
];

interface DateInfo {
  year: number;
  month: number; // 1-12
  day: number; // 1-31
}

function parseDateStr(dateStr?: string): DateInfo | null {
  if (!dateStr || !dateStr.trim()) return null;
  const s = dateStr.trim();

  // Format YYYY-MM-DD
  const ymd = s.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (ymd) {
    const y = parseInt(ymd[1], 10);
    const m = parseInt(ymd[2], 10);
    const d = parseInt(ymd[3], 10);
    if (m >= 1 && m <= 12 && d >= 1 && d <= 31) {
      return { year: y, month: m, day: d };
    }
  }

  // Format DD-MM-YYYY or DD/MM/YYYY
  const dmy = s.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
  if (dmy) {
    const d = parseInt(dmy[1], 10);
    const m = parseInt(dmy[2], 10);
    const y = parseInt(dmy[3], 10);
    if (m >= 1 && m <= 12 && d >= 1 && d <= 31) {
      return { year: y, month: m, day: d };
    }
  }

  return null;
}

export interface ItemUlangTahun {
  id: string;
  wargaId: string;
  jenis: 'kelahiran' | 'pernikahan';
  namaUtama: string;
  namaPasangan?: string;
  labelLengkap: string;
  noKjj: string;
  rayon: string;
  noHp?: string;
  alamat?: string;
  hubunganKeluarga?: string;
  jenisKelamin?: 'L' | 'P';
  tanggalAsli: string;
  day: number;
  month: number; // 1-12
  year: number;
  usiaAtauUsiaNikah: number;
  daysUntil: number; // Selisih hari dari hari ini di tahun berjalan
  statusLabel: 'hari_ini' | 'besok' | 'mendatang' | 'lewat';
}

export const UlangTahunModule: React.FC = () => {
  const { wargaJemaatList, lingkunganList, settings, openPrintReport } = useApp();

  const now = new Date();
  const currentMonth = now.getMonth() + 1; // 1-12
  const currentDay = now.getDate();
  const currentYear = now.getFullYear();

  // Filters State
  const [activeJenisFilter, setActiveJenisFilter] = useState<'semua' | 'kelahiran' | 'pernikahan'>('semua');
  const [selectedMonthFilter, setSelectedMonthFilter] = useState<number>(currentMonth); // Default current month
  const [selectedRayonFilter, setSelectedRayonFilter] = useState<string>('semua');
  const [selectedTimingFilter, setSelectedTimingFilter] = useState<'semua' | 'hari_ini' | 'minggu_ini' | 'bulan_ini'>('bulan_ini');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [copiedWartaStatus, setCopiedWartaStatus] = useState<boolean>(false);

  // Process and compute all birthday/wedding items from live wargaJemaatList
  const allItems = useMemo(() => {
    const items: ItemUlangTahun[] = [];

    // Helper to calculate days until birthday in current year
    const calcDaysUntil = (day: number, month: number) => {
      const bdate = new Date(currentYear, month - 1, day);
      const tdate = new Date(currentYear, now.getMonth(), now.getDate());
      const diffTime = bdate.getTime() - tdate.getTime();
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    };

    // 1. Process Birthdays (Ulang Tahun Kelahiran)
    wargaJemaatList.forEach((w) => {
      const parsed = parseDateStr(w.tanggalLahir);
      if (parsed) {
        const daysUntil = calcDaysUntil(parsed.day, parsed.month);
        let statusLabel: 'hari_ini' | 'besok' | 'mendatang' | 'lewat' = 'mendatang';
        if (daysUntil === 0) statusLabel = 'hari_ini';
        else if (daysUntil === 1) statusLabel = 'besok';
        else if (daysUntil < 0) statusLabel = 'lewat';

        const age = currentYear - parsed.year;

        items.push({
          id: `birth-${w.id}`,
          wargaId: w.id,
          jenis: 'kelahiran',
          namaUtama: w.namaLengkap,
          labelLengkap: w.namaLengkap,
          noKjj: w.noKjj,
          rayon: w.rayon || 'Belum Ditentukan',
          noHp: w.noHp,
          alamat: w.alamat,
          hubunganKeluarga: w.hubunganKeluarga,
          jenisKelamin: w.jenisKelamin,
          tanggalAsli: w.tanggalLahir,
          day: parsed.day,
          month: parsed.month,
          year: parsed.year,
          usiaAtauUsiaNikah: Math.max(0, age),
          daysUntil,
          statusLabel,
        });
      }
    });

    // 2. Process Wedding Anniversaries (Ulang Tahun Pernikahan)
    // Group married couples by noKjj + tanggalPernikahan to avoid duplicate family records
    const processedCouplesKeys = new Set<string>();

    wargaJemaatList.forEach((w) => {
      if (w.tanggalPernikahan && w.tanggalPernikahan.trim() !== '' && w.statusNikah === 'Menikah') {
        const parsedPernikahan = parseDateStr(w.tanggalPernikahan);
        if (parsedPernikahan) {
          const coupleKey = `${w.noKjj}_${w.tanggalPernikahan}`;

          if (!processedCouplesKeys.has(coupleKey)) {
            processedCouplesKeys.add(coupleKey);

            // Find spouse in same KJJ
            const familyMembers = wargaJemaatList.filter((m) => m.noKjj === w.noKjj && m.statusNikah === 'Menikah');
            const suami = familyMembers.find((m) => m.hubunganKeluarga === 'Kepala Keluarga' || m.jenisKelamin === 'L');
            const istri = familyMembers.find((m) => m.hubunganKeluarga === 'Istri' || (m.jenisKelamin === 'P' && m.id !== suami?.id));

            let namaGelarPasangan = '';
            let labelLengkap = '';

            if (suami && istri) {
              namaGelarPasangan = `Bpk. ${suami.namaLengkap} & Ny. ${istri.namaLengkap}`;
              labelLengkap = `Kel. Bpk. ${suami.namaLengkap} & Ny. ${istri.namaLengkap}`;
            } else if (suami) {
              namaGelarPasangan = `Kel. Bpk. ${suami.namaLengkap}`;
              labelLengkap = `Kel. Bpk. ${suami.namaLengkap}`;
            } else if (istri) {
              namaGelarPasangan = `Kel. Ny. ${istri.namaLengkap}`;
              labelLengkap = `Kel. Ny. ${istri.namaLengkap}`;
            } else {
              namaGelarPasangan = `Kel. ${w.namaLengkap}`;
              labelLengkap = `Kel. ${w.namaLengkap}`;
            }

            const daysUntil = calcDaysUntil(parsedPernikahan.day, parsedPernikahan.month);
            let statusLabel: 'hari_ini' | 'besok' | 'mendatang' | 'lewat' = 'mendatang';
            if (daysUntil === 0) statusLabel = 'hari_ini';
            else if (daysUntil === 1) statusLabel = 'besok';
            else if (daysUntil < 0) statusLabel = 'lewat';

            const marriageYears = currentYear - parsedPernikahan.year;

            items.push({
              id: `wedding-${w.id}`,
              wargaId: w.id,
              jenis: 'pernikahan',
              namaUtama: suami ? suami.namaLengkap : w.namaLengkap,
              namaPasangan: istri ? istri.namaLengkap : undefined,
              labelLengkap,
              noKjj: w.noKjj,
              rayon: w.rayon || 'Belum Ditentukan',
              noHp: suami?.noHp || istri?.noHp || w.noHp,
              alamat: w.alamat,
              tanggalAsli: w.tanggalPernikahan,
              day: parsedPernikahan.day,
              month: parsedPernikahan.month,
              year: parsedPernikahan.year,
              usiaAtauUsiaNikah: Math.max(0, marriageYears),
              daysUntil,
              statusLabel,
            });
          }
        }
      }
    });

    // Sort items by Day of month ascending
    return items.sort((a, b) => {
      if (a.month !== b.month) return a.month - b.month;
      return a.day - b.day;
    });
  }, [wargaJemaatList, currentYear, now]);

  // Unique list of Rayons/Lingkungan
  const availableRayons = useMemo(() => {
    const setR = new Set<string>();
    wargaJemaatList.forEach((w) => {
      if (w.rayon && w.rayon.trim() !== '') setR.add(w.rayon);
    });
    lingkunganList.forEach((l) => {
      if (l.nama && l.nama.trim() !== '') setR.add(l.nama);
    });
    return Array.from(setR).sort();
  }, [wargaJemaatList, lingkunganList]);

  // Filtered List based on user selections
  const filteredItems = useMemo(() => {
    return allItems.filter((item) => {
      // 1. Jenis Filter
      if (activeJenisFilter !== 'semua' && item.jenis !== activeJenisFilter) return false;

      // 2. Month Filter (0 = semua bulan)
      if (selectedMonthFilter !== 0 && item.month !== selectedMonthFilter) return false;

      // 3. Rayon Filter
      if (selectedRayonFilter !== 'semua' && item.rayon !== selectedRayonFilter) return false;

      // 4. Timing Filter
      if (selectedTimingFilter === 'hari_ini' && item.daysUntil !== 0) return false;
      if (selectedTimingFilter === 'minggu_ini' && (item.daysUntil < 0 || item.daysUntil > 7)) return false;
      if (selectedTimingFilter === 'bulan_ini' && item.month !== currentMonth) return false;

      // 5. Search Query
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        const matchName = item.labelLengkap.toLowerCase().includes(q);
        const matchRayon = item.rayon.toLowerCase().includes(q);
        const matchKjj = item.noKjj.toLowerCase().includes(q);
        if (!matchName && !matchRayon && !matchKjj) return false;
      }

      return true;
    });
  }, [
    allItems,
    activeJenisFilter,
    selectedMonthFilter,
    selectedRayonFilter,
    selectedTimingFilter,
    searchQuery,
    currentMonth,
  ]);

  // Statistics calculation for KPI cards
  const statsThisMonth = useMemo(() => {
    const itemsThisMonth = allItems.filter((i) => i.month === currentMonth);
    const birthCount = itemsThisMonth.filter((i) => i.jenis === 'kelahiran').length;
    const weddingCount = itemsThisMonth.filter((i) => i.jenis === 'pernikahan').length;
    const todayCount = itemsThisMonth.filter((i) => i.daysUntil === 0).length;
    const next7DaysCount = itemsThisMonth.filter((i) => i.daysUntil >= 0 && i.daysUntil <= 7).length;

    return {
      totalThisMonth: itemsThisMonth.length,
      birthCount,
      weddingCount,
      todayCount,
      next7DaysCount,
    };
  }, [allItems, currentMonth]);

  // WhatsApp Greeting Modal State
  const [selectedItemForWa, setSelectedItemForWa] = useState<ItemUlangTahun | null>(null);
  const [waPhoneNumber, setWaPhoneNumber] = useState<string>('');
  const [waTemplate, setWaTemplate] = useState<'formal' | 'warm' | 'ayat' | 'singkat'>('formal');
  const [waCustomMessage, setWaCustomMessage] = useState<string>('');
  const [copiedWaMsg, setCopiedWaMsg] = useState<boolean>(false);

  // Helper to format phone number to international 62 format
  const formatWaPhoneNumber = (phone?: string): string => {
    if (!phone) return '';
    let cleaned = phone.replace(/\D/g, '');
    if (!cleaned) return '';
    if (cleaned.startsWith('0')) {
      cleaned = '62' + cleaned.slice(1);
    } else if (cleaned.startsWith('8')) {
      cleaned = '62' + cleaned;
    }
    return cleaned;
  };

  // Helper to generate template text
  const getTemplateText = (
    item: ItemUlangTahun,
    tpl: 'formal' | 'warm' | 'ayat' | 'singkat'
  ): string => {
    const church = settings.namaJemaat || 'GKE JEMAAT';
    const isBirth = item.jenis === 'kelahiran';
    const ageOrYears = item.usiaAtauUsiaNikah;

    if (isBirth) {
      switch (tpl) {
        case 'formal':
          return (
            `*UCAPAN SELAMAT ULANG TAHUN KELAHIRAN*\n` +
            `*${church.toUpperCase()}*\n` +
            `----------------------------------------\n` +
            `Syalom ${item.labelLengkap},\n\n` +
            `Majelis Jemaat dan seluruh Warga Jemaat GKE mengucapkan *Selamat Ulang Tahun Kelahiran ke-${ageOrYears} Tahun*! 🎉🎂\n\n` +
            `*"TUHAN memberkati engkau dan melindungi engkau; TUHAN menyinari engkau dengan wajah-Nya dan memberi engkau kasih karunia."* (Bilangan 6:24-25)\n\n` +
            `Kiranya senantiasa diberikan kesehatan, umur panjang, sukacita, dan penyertaan Tuhan Yesus Kristus dalam hidup dan keluarga. Amin! ✝️🙏`
          );
        case 'warm':
          return (
            `🎉 *Selamat Ulang Tahun Kelahiran ke-${ageOrYears}!* 🎂\n\n` +
            `Syalom Yth. ${item.labelLengkap},\n` +
            `Salam kasih dalam Tuhan Yesus Kristus. Di hari yang penuh ucapan syukur ini, kami segenap Warga Jemaat ${church} turut bersukacita dan mendoakan agar Tuhan senantiasa melimpahkan berkat kesehatan, kebahagiaan, dan damai sejahtera.\n\n` +
            `*"Kasih setia TUHAN tidak berkesudahan, selalu baru tiap pagi."* (Ratapan 3:22-23)\n\n` +
            `Tuhan Yesus memberkati senantiasa! 🌸✝️`
          );
        case 'ayat':
          return (
            `✨ *Selamat Ulang Tahun Kelahiran ke-${ageOrYears} Tahun* ✨\n\n` +
            `Kepada Yth. ${item.labelLengkap},\n\n` +
            `*"Pengajaran orang bijak adalah sumber kehidupan, sehingga orang terhindar dari jerat maut. Umur panjang ada di tangan kanannya, di tangan kirinya kekayaan dan kehormatan."* (Amsal 3:16)\n\n` +
            `Salam doa dan kasih dari Majelis & Warga Jemaat ${church}. Tuhan memberkati keluarga senantiasa! 🙏🎂`
          );
        case 'singkat':
          return (
            `Syalom ${item.labelLengkap}, Selamat Ulang Tahun Kelahiran ke-${ageOrYears} Tahun! 🎉\n` +
            `Kiranya Tuhan Yesus Kristus senantiasa memberkati kesehatan, umur panjang, dan kebahagiaan bagi saudara dan keluarga. (GKE ${church}) ✝️`
          );
      }
    } else {
      switch (tpl) {
        case 'formal':
          return (
            `*UCAPAN SELAMAT ULANG TAHUN PERNIKAHAN*\n` +
            `*${church.toUpperCase()}*\n` +
            `----------------------------------------\n` +
            `Syalom ${item.labelLengkap},\n\n` +
            `Majelis Jemaat dan seluruh Warga Jemaat GKE mengucapkan *Selamat Ulang Tahun Pernikahan (Anniversary) ke-${ageOrYears} Tahun*! 💍💐\n\n` +
            `*"Demikianlah mereka bukan lagi dua, melainkan satu. Karena itu, apa yang telah dipersatukan Allah, tidak boleh diceraikan manusia."* (Matius 19:6)\n\n` +
            `Semoga kasih Kristus senantiasa memimpin rumah tangga Bapak & Ibu dalam kedamaian, kesetiaan, dan kelimpahan berkat. Amin! ✝️❤️`
          );
        case 'warm':
          return (
            `💐 *Selamat Ulang Tahun Pernikahan ke-${ageOrYears}!* 💍\n\n` +
            `Syalom ${item.labelLengkap},\n` +
            `Turut bersukacita atas peringatan ulang tahun pernikahan ke-${ageOrYears} Tahun! Kiranya kasih Kristus senantiasa menjadi pengikat yang sempurna dalam rumah tangga Bapak & Ibu.\n\n` +
            `*"Dan di atas semuanya itu: kenakanlah kasih, sebagai pengikat yang mempersatukan dan menyempurnakan."* (Kolose 3:14)\n\n` +
            `Salam hangat dari Jemaat ${church}! ❤️✝️`
          );
        case 'ayat':
          return (
            `✝️ *Peringatan Ulang Tahun Pernikahan ke-${ageOrYears} Tahun* 🌹\n\n` +
            `Kepada Yth. ${item.labelLengkap},\n\n` +
            `*"Demikian juga suami harus mengasihi isterinya sama seperti tubuhnya sendiri. Rumah dan harta adalah warisan dari orang tua, tetapi isteri yang berakal budi adalah karunia TUHAN."* (Amsal 19:14)\n\n` +
            `Kiranya Tuhan memelihara kerukunan dan kebahagiaan keluarga selalu. (Majelis Jemaat ${church})`
          );
        case 'singkat':
          return (
            `Syalom ${item.labelLengkap}, Selamat Ulang Tahun Pernikahan ke-${ageOrYears} Tahun! 💍💐\n` +
            `Semoga rumah tangga senantiasa dipenuhi damai sejahtera, kesetiaan, dan berkat Tuhan Yesus Kristus. (GKE ${church})`
          );
      }
    }
  };

  // WhatsApp Greeting Handler - Opens Modal
  const handleSendWaGreeting = (item: ItemUlangTahun) => {
    setSelectedItemForWa(item);
    const formatted = item.noHp ? formatWaPhoneNumber(item.noHp) : '';
    setWaPhoneNumber(formatted || (item.noHp || ''));
    setWaTemplate('formal');
    setWaCustomMessage(getTemplateText(item, 'formal'));
    setCopiedWaMsg(false);
  };

  const handleTemplateChange = (tpl: 'formal' | 'warm' | 'ayat' | 'singkat') => {
    setWaTemplate(tpl);
    if (selectedItemForWa) {
      setWaCustomMessage(getTemplateText(selectedItemForWa, tpl));
    }
  };

  // Copy Formatted List for Warta Jemaat
  const handleCopyWartaText = () => {
    const monthName = selectedMonthFilter === 0 ? 'Semua Bulan' : NAMA_BULAN_INDONESIA[selectedMonthFilter - 1];

    const birthList = filteredItems.filter((i) => i.jenis === 'kelahiran');
    const weddingList = filteredItems.filter((i) => i.jenis === 'pernikahan');

    let text =
      `🎉 *DATAR WARGA JEMAAT BERULANG TAHUN KELAHIRAN & PERNIKAHAN*\n` +
      `*${(settings.namaJemaat || 'MAJELIS JEMAAT GKE').toUpperCase()}*\n` +
      `*Periode: ${monthName} ${currentYear}*\n` +
      `==========================================\n\n`;

    text += `🎂 *A. ULANG TAHUN KELAHIRAN (${birthList.length} Jiwa):*\n`;
    if (birthList.length > 0) {
      birthList.forEach((b, idx) => {
        text += `${idx + 1}. ${b.namaUtama} - ${b.day} ${NAMA_BULAN_INDONESIA[b.month - 1]} (${b.usiaAtauUsiaNikah} Th) - [${b.rayon}]\n`;
      });
    } else {
      text += `(Belum ada data untuk periode ini)\n`;
    }

    text += `\n💍 *B. ULANG TAHUN PERNIKAHAN (${weddingList.length} Pasangan):*\n`;
    if (weddingList.length > 0) {
      weddingList.forEach((w, idx) => {
        text += `${idx + 1}. ${w.labelLengkap} - ${w.day} ${NAMA_BULAN_INDONESIA[w.month - 1]} (${w.usiaAtauUsiaNikah} Th Pernikahan) - [${w.rayon}]\n`;
      });
    } else {
      text += `(Belum ada data untuk periode ini)\n`;
    }

    text +=
      `\n==========================================\n` +
      `"Tuhan Yesus Kristus memberkati sukacita dan usia saudara sekalian." 🙏`;

    navigator.clipboard.writeText(text);
    setCopiedWartaStatus(true);
    setTimeout(() => setCopiedWartaStatus(false), 3000);
  };

  return (
    <div className="space-y-6 text-slate-100 font-sans pb-12">
      {/* Module Title Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-5 sm:p-6 rounded-2xl border border-indigo-500/30 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-indigo-600/10 to-transparent pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-extrabold flex items-center gap-1.5 shadow-xs">
                <RefreshCw className="w-3.5 h-3.5 animate-spin-slow text-emerald-400" />
                <span>Otomatis Tersingkronisasi Sensus</span>
              </span>
              <span className="px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-bold flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Pelayanan Digital GKE</span>
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-white tracking-tight flex items-center gap-2.5 font-serif">
              <Cake className="w-7 h-7 sm:w-8 sm:h-8 text-amber-400 shrink-0" />
              <span>Ulang Tahun Kelahiran & Pernikahan Warga</span>
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Modul pemantauan ucapan selamat ulang tahun kelahiran dan pernikahan warga jemaat. Data ini
              diambil langsung secara live dari <strong className="text-white">Daftar Sensus Keluarga Jemaat</strong>.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0 pt-2 md:pt-0">
            <button
              onClick={handleCopyWartaText}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 border border-indigo-500/40 text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer"
              title="Salin daftar ucapan ke clipboard untuk ditempel ke Warta Jemaat / WhatsApp"
            >
              {copiedWartaStatus ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-300 font-extrabold">Tersalin ke Clipboard!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-indigo-400" />
                  <span>Salin Format Warta</span>
                </>
              )}
            </button>

            <button
              onClick={() => openPrintReport({ reportType: 'ulang_tahun' })}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-extrabold shadow-lg shadow-emerald-600/20 border border-emerald-400/30 transition-all active:scale-95 cursor-pointer"
            >
              <Printer className="w-4 h-4 text-white" />
              <span>Cetak Laporan Resmi</span>
            </button>
          </div>
        </div>

        {/* Sync Guarantee Notice */}
        <div className="mt-4 pt-3 border-t border-indigo-900/50 flex items-center gap-2 text-[11px] text-slate-300 bg-slate-950/60 p-2.5 rounded-xl">
          <Info className="w-4 h-4 text-amber-400 shrink-0" />
          <span>
            <strong className="text-amber-300">Jaminan Integritas Data Sensus:</strong> Apabila data warga jemaat
            ditambahkan, diperbarui, atau dihapus pada modul <i>Data Keluarga Jemaat</i>, data ulang tahun pada halaman ini
            akan diperbarui dan terhapus secara otomatis secara real-time.
          </span>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1: Total Bulan Ini */}
        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl shadow-lg relative overflow-hidden group hover:border-indigo-500/50 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              {NAMA_BULAN_INDONESIA[currentMonth - 1]} Ini
            </span>
            <div className="w-8 h-8 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <PartyPopper className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-white font-mono">
              {statsThisMonth.totalThisMonth}
            </span>
            <span className="text-xs text-slate-400 font-semibold">Warga / Pasangan</span>
          </div>
          <p className="text-[11px] text-indigo-300/80 mt-1">Total ucapan berulang tahun bulan ini</p>
        </div>

        {/* Card 2: Kelahiran Bulan Ini */}
        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl shadow-lg relative overflow-hidden group hover:border-amber-500/50 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
              Kelahiran
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Cake className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-amber-300 font-mono">
              {statsThisMonth.birthCount}
            </span>
            <span className="text-xs text-slate-400 font-semibold">Jiwa Berulang Tahun</span>
          </div>
          <p className="text-[11px] text-amber-300/80 mt-1">HUT Kelahiran di bulan {NAMA_BULAN_INDONESIA[currentMonth - 1]}</p>
        </div>

        {/* Card 3: Pernikahan Bulan Ini */}
        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl shadow-lg relative overflow-hidden group hover:border-rose-500/50 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-400 uppercase tracking-wider">
              Pernikahan
            </span>
            <div className="w-8 h-8 rounded-xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <Heart className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-rose-300 font-mono">
              {statsThisMonth.weddingCount}
            </span>
            <span className="text-xs text-slate-400 font-semibold">Pasangan Suami Istri</span>
          </div>
          <p className="text-[11px] text-rose-300/80 mt-1">Ulang tahun pernikahan (Anniversary)</p>
        </div>

        {/* Card 4: Hari Ini / 7 Hari Ke Depan */}
        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl shadow-lg relative overflow-hidden group hover:border-emerald-500/50 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
              Mendatang (7 Hari)
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Flame className="w-4 h-4 animate-bounce" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-emerald-300 font-mono">
              {statsThisMonth.next7DaysCount}
            </span>
            <span className="text-xs text-slate-400 font-semibold">Dalam 7 Hari Ke Depan</span>
          </div>
          <p className="text-[11px] text-emerald-300/80 mt-1">
            {statsThisMonth.todayCount > 0 ? (
              <strong className="text-amber-300 font-extrabold">🎉 {statsThisMonth.todayCount} Berulang Tahun HARI INI!</strong>
            ) : (
              'Siap dikirimkan ucapan selamat'
            )}
          </p>
        </div>
      </div>

      {/* Filter Toolbar Section */}
      <div className="bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-800 space-y-4 shadow-lg">
        {/* Row 1: Type Switcher & Search */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Tabs Jenis Ulang Tahun */}
          <div className="flex items-center bg-slate-950 p-1.5 rounded-xl border border-slate-800/80 gap-1 overflow-x-auto">
            <button
              onClick={() => setActiveJenisFilter('semua')}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
                activeJenisFilter === 'semua'
                  ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              Semua ({allItems.length})
            </button>
            <button
              onClick={() => setActiveJenisFilter('kelahiran')}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
                activeJenisFilter === 'kelahiran'
                  ? 'bg-amber-600 text-white shadow-md font-extrabold'
                  : 'text-slate-400 hover:text-amber-300 hover:bg-slate-900'
              }`}
            >
              <Cake className="w-3.5 h-3.5 text-amber-300" />
              <span>HUT Kelahiran ({allItems.filter((i) => i.jenis === 'kelahiran').length})</span>
            </button>
            <button
              onClick={() => setActiveJenisFilter('pernikahan')}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
                activeJenisFilter === 'pernikahan'
                  ? 'bg-rose-600 text-white shadow-md font-extrabold'
                  : 'text-slate-400 hover:text-rose-300 hover:bg-slate-900'
              }`}
            >
              <Heart className="w-3.5 h-3.5 text-rose-300" />
              <span>HUT Pernikahan ({allItems.filter((i) => i.jenis === 'pernikahan').length})</span>
            </button>
          </div>

          {/* Search Box & View Mode Toggle */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1 md:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari nama, KJJ, atau rayon..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-500 hover:text-white"
                >
                  ✕
                </button>
              )}
            </div>

            <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 shrink-0">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-all cursor-pointer ${
                  viewMode === 'grid' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
                title="Tampilan Grid Kartu"
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-2 rounded-lg transition-all cursor-pointer ${
                  viewMode === 'table' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
                title="Tampilan Tabel Rinci"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Row 2: Secondary Dropdown Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-800/60 text-xs">
          {/* Month Selector Dropdown */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-indigo-400" />
              <span>Filter Bulan:</span>
            </label>
            <select
              value={selectedMonthFilter}
              onChange={(e) => setSelectedMonthFilter(Number(e.target.value))}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-semibold cursor-pointer"
            >
              <option value={0}>Semua Bulan (Januari - Desember)</option>
              {NAMA_BULAN_INDONESIA.map((nama, idx) => (
                <option key={idx + 1} value={idx + 1}>
                  Bulan {nama} {idx + 1 === currentMonth ? '★ (Bulan Ini)' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Rayon / Lingkungan Selector */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-indigo-400" />
              <span>Filter Lingkungan / Rayon:</span>
            </label>
            <select
              value={selectedRayonFilter}
              onChange={(e) => setSelectedRayonFilter(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-semibold cursor-pointer"
            >
              <option value="semua">Semua Lingkungan / Rayon Jemaat</option>
              {availableRayons.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          {/* Timing Filter */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-indigo-400" />
              <span>Rentang Hari / Status:</span>
            </label>
            <select
              value={selectedTimingFilter}
              onChange={(e) => setSelectedTimingFilter(e.target.value as any)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-semibold cursor-pointer"
            >
              <option value="semua">Semua Tanggal Bulan Ini / Pilihan</option>
              <option value="bulan_ini">Hanya Berulang Tahun Bulan Ini</option>
              <option value="hari_ini">🎉 Berulang Tahun HARI INI</option>
              <option value="minggu_ini">🎁 Berulang Tahun 7 Hari Ke Depan</option>
            </select>
          </div>
        </div>

        {/* Quick Month Shortcuts Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-1 pb-0.5 text-xs">
          <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider shrink-0 mr-1">
            Pintasan:
          </span>
          <button
            onClick={() => setSelectedMonthFilter(currentMonth)}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all shrink-0 cursor-pointer border ${
              selectedMonthFilter === currentMonth
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                : 'bg-slate-100 dark:bg-slate-950 text-slate-700 dark:text-slate-400 border-slate-300 dark:border-slate-800 hover:text-indigo-600 dark:hover:text-white'
            }`}
          >
            Bulan Ini ({NAMA_BULAN_INDONESIA[currentMonth - 1]})
          </button>
          <button
            onClick={() => setSelectedMonthFilter(currentMonth === 12 ? 1 : currentMonth + 1)}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all shrink-0 cursor-pointer border ${
              selectedMonthFilter === (currentMonth === 12 ? 1 : currentMonth + 1)
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                : 'bg-slate-100 dark:bg-slate-950 text-slate-700 dark:text-slate-400 border-slate-300 dark:border-slate-800 hover:text-indigo-600 dark:hover:text-white'
            }`}
          >
            Bulan Depan ({NAMA_BULAN_INDONESIA[currentMonth === 12 ? 0 : currentMonth]})
          </button>
          <button
            onClick={() => setSelectedMonthFilter(0)}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all shrink-0 cursor-pointer border ${
              selectedMonthFilter === 0
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                : 'bg-slate-100 dark:bg-slate-950 text-slate-700 dark:text-slate-400 border-slate-300 dark:border-slate-800 hover:text-indigo-600 dark:hover:text-white'
            }`}
          >
            Setahun Penuh (12 Bulan)
          </button>
        </div>
      </div>

      {/* Result Section Header */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 font-bold">
          <span>Menampilkan <strong className="text-slate-900 dark:text-white text-sm font-mono">{filteredItems.length}</strong> data ulang tahun</span>
          {selectedMonthFilter !== 0 && (
            <span className="bg-indigo-100 text-indigo-900 dark:bg-indigo-500/20 dark:text-indigo-300 px-2 py-0.5 rounded border border-indigo-200 dark:border-indigo-500/30 text-[10px] font-bold">
              Bulan {NAMA_BULAN_INDONESIA[selectedMonthFilter - 1]}
            </span>
          )}
          {selectedRayonFilter !== 'semua' && (
            <span className="bg-emerald-100 text-emerald-900 dark:bg-emerald-500/20 dark:text-emerald-300 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-500/30 text-[10px] font-bold">
              {selectedRayonFilter}
            </span>
          )}
        </div>
      </div>

      {/* Display List - Grid Mode or Table Mode */}
      {filteredItems.length === 0 ? (
        <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 sm:p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-500">
            <Cake className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-slate-900 dark:text-white text-base">Tidak Ada Data Ulang Tahun Ditemukan</h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 max-w-md mx-auto">
            Tidak ada warga jemaat atau pasangan yang berulang tahun sesuai filter kriteria yang dipilih.
            Cobalah ubah pilihan bulan, rayon, atau kata kunci pencarian.
          </p>
          <button
            onClick={() => {
              setActiveJenisFilter('semua');
              setSelectedMonthFilter(currentMonth);
              setSelectedRayonFilter('semua');
              setSelectedTimingFilter('semua');
              setSearchQuery('');
            }}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition cursor-pointer shadow-md"
          >
            Reset Semua Filter
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map((item) => {
            const isBirth = item.jenis === 'kelahiran';
            const isToday = item.daysUntil === 0;
            const isTomorrow = item.daysUntil === 1;

            return (
              <div
                key={item.id}
                className={`bg-white dark:bg-slate-900/90 border rounded-2xl p-4 sm:p-5 flex flex-col justify-between transition-all duration-200 hover:shadow-xl relative overflow-hidden group shadow-sm ${
                  isToday
                    ? 'border-amber-500/80 bg-gradient-to-br from-amber-50 dark:from-amber-950/40 via-white dark:via-slate-900 to-white dark:to-slate-900 ring-2 ring-amber-500/30 shadow-amber-500/10'
                    : isBirth
                    ? 'border-slate-200 dark:border-slate-800 hover:border-amber-500/50'
                    : 'border-slate-200 dark:border-slate-800 hover:border-rose-500/50'
                }`}
              >
                {/* Top Header Badge */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 border ${
                        isBirth
                          ? 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/30'
                          : 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-500/20 dark:text-rose-300 dark:border-rose-500/30'
                      }`}
                    >
                      {isBirth ? <Cake className="w-5 h-5 text-amber-700 dark:text-amber-400" /> : <Heart className="w-5 h-5 text-rose-700 dark:text-rose-400" />}
                    </div>

                    <div>
                      <span
                        className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded border inline-block ${
                          isBirth
                            ? 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/30'
                            : 'bg-rose-100 text-rose-900 border-rose-300 dark:bg-rose-500/20 dark:text-rose-300 dark:border-rose-500/30'
                        }`}
                      >
                        {isBirth ? 'HUT KELAHIRAN' : 'HUT PERNIKAHAN'}
                      </span>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 font-mono mt-0.5 font-medium">{item.rayon}</p>
                    </div>
                  </div>

                  {/* Days Until Tag */}
                  {isToday ? (
                    <span className="bg-amber-500 text-slate-950 font-black text-[10px] uppercase px-2.5 py-1 rounded-full animate-pulse shadow-md flex items-center gap-1 shrink-0">
                      <Sparkles className="w-3 h-3" />
                      <span>HARI INI 🎉</span>
                    </span>
                  ) : isTomorrow ? (
                    <span className="bg-emerald-100 text-emerald-900 border border-emerald-300 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/40 font-bold text-[10px] px-2.5 py-0.5 rounded-full shrink-0">
                      Besok 🎁
                    </span>
                  ) : item.daysUntil > 0 && item.daysUntil <= 30 ? (
                    <span className="bg-indigo-100 text-indigo-900 border border-indigo-300 dark:bg-indigo-500/20 dark:text-indigo-300 dark:border-indigo-500/30 font-bold text-[10px] px-2.5 py-0.5 rounded-full shrink-0">
                      {item.daysUntil} Hari Lagi
                    </span>
                  ) : (
                    <span className="bg-slate-100 text-slate-800 border border-slate-300 dark:bg-slate-800 dark:text-slate-300 font-bold text-[10px] px-2 py-0.5 rounded-full shrink-0">
                      Tgl {item.day}
                    </span>
                  )}
                </div>

                {/* Main Content Body */}
                <div className="space-y-2.5 my-2">
                  <h3 className="font-extrabold text-base text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-300 transition-colors leading-snug">
                    {item.labelLengkap}
                  </h3>

                  {/* Date & Age Info Box */}
                  <div className="bg-slate-50 dark:bg-slate-950/80 p-3 rounded-xl border border-slate-200 dark:border-slate-800/80 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
                      <span className="text-slate-600 dark:text-slate-400 flex items-center gap-1.5 font-medium">
                        <Calendar className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                        <span>Tanggal Berulang Tahun:</span>
                      </span>
                      <span className="font-black text-slate-900 dark:text-white font-mono">
                        {item.day} {NAMA_BULAN_INDONESIA[item.month - 1]}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-slate-700 dark:text-slate-300 pt-1 border-t border-slate-200 dark:border-slate-800/60">
                      <span className="text-slate-600 dark:text-slate-400 font-medium">
                        {isBirth ? 'Usia Saat Ini:' : 'Usia Pernikahan:'}
                      </span>
                      <span
                        className={`font-black font-mono text-sm ${
                          isBirth ? 'text-amber-700 dark:text-amber-400' : 'text-rose-700 dark:text-rose-400'
                        }`}
                      >
                        {item.usiaAtauUsiaNikah} Tahun
                      </span>
                    </div>
                  </div>

                  {/* Additional Family Info */}
                  <div className="text-[11px] text-slate-600 dark:text-slate-400 space-y-1 pt-1 font-medium">
                    <div className="flex items-center justify-between">
                      <span>No. Kartu Keluarga (KJJ):</span>
                      <span className="font-mono text-slate-900 dark:text-slate-200 font-bold">{item.noKjj}</span>
                    </div>
                    {item.noHp && (
                      <div className="flex items-center justify-between">
                        <span>Kontak WA:</span>
                        <span className="font-mono text-emerald-700 dark:text-emerald-400 font-bold">{item.noHp}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Footer WhatsApp Action */}
                <div className="pt-3 border-t border-slate-200 dark:border-slate-800/80 mt-2">
                  <button
                    onClick={() => handleSendWaGreeting(item)}
                    className={`w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl font-extrabold text-xs transition-all active:scale-95 cursor-pointer shadow-md text-white ${
                      isBirth
                        ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20'
                        : 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/20'
                    }`}
                  >
                    <MessageCircle className="w-4 h-4 text-white" />
                    <span className="text-white font-extrabold tracking-wide">Kirim Ucapan WA SIKJ</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table View Mode */
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left text-xs text-slate-300 border-collapse">
              <thead>
                <tr className="bg-slate-950 text-slate-200 border-b border-slate-800 font-bold uppercase text-[10px] tracking-wider">
                  <th className="p-3.5 text-center w-10">No</th>
                  <th className="p-3.5">Nama Warga / Pasangan</th>
                  <th className="p-3.5">Kategori</th>
                  <th className="p-3.5">Tanggal HUT</th>
                  <th className="p-3.5 text-center">Usia / Usia Nikah</th>
                  <th className="p-3.5">Lingkungan / Rayon</th>
                  <th className="p-3.5">No. KJJ</th>
                  <th className="p-3.5 text-center">Status</th>
                  <th className="p-3.5 text-center">Aksi Ucapan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredItems.map((item, idx) => {
                  const isBirth = item.jenis === 'kelahiran';
                  const isToday = item.daysUntil === 0;

                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-slate-800/40 transition-colors ${
                        isToday ? 'bg-amber-950/20 font-medium' : ''
                      }`}
                    >
                      <td className="p-3.5 text-center font-mono font-bold text-slate-500">{idx + 1}</td>
                      <td className="p-3.5 font-bold text-white">
                        {item.labelLengkap}
                        {item.noHp && (
                          <span className="block text-[10px] text-slate-400 font-mono font-normal">
                            WA: {item.noHp}
                          </span>
                        )}
                      </td>
                      <td className="p-3.5">
                        <span
                          className={`text-[10px] font-extrabold px-2 py-0.5 rounded border inline-block ${
                            isBirth
                              ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                              : 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                          }`}
                        >
                          {isBirth ? 'Kelahiran' : 'Pernikahan'}
                        </span>
                      </td>
                      <td className="p-3.5 font-mono font-bold text-slate-200">
                        {item.day} {NAMA_BULAN_INDONESIA[item.month - 1]}
                      </td>
                      <td className="p-3.5 text-center font-extrabold font-mono text-amber-400">
                        {item.usiaAtauUsiaNikah} Th
                      </td>
                      <td className="p-3.5 text-slate-300">{item.rayon}</td>
                      <td className="p-3.5 font-mono text-slate-400">{item.noKjj}</td>
                      <td className="p-3.5 text-center">
                        {isToday ? (
                          <span className="bg-amber-500 text-slate-950 font-black text-[9px] uppercase px-2 py-0.5 rounded-full animate-pulse">
                            🎉 HARI INI
                          </span>
                        ) : item.daysUntil === 1 ? (
                          <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold text-[9px] px-2 py-0.5 rounded-full">
                            Besok 🎁
                          </span>
                        ) : item.daysUntil > 0 && item.daysUntil <= 30 ? (
                          <span className="text-indigo-300 text-[10px] font-semibold">
                            {item.daysUntil} Hari Lagi
                          </span>
                        ) : (
                          <span className="text-slate-500 text-[10px]">-</span>
                        )}
                      </td>
                      <td className="p-3.5 text-center">
                        <button
                          onClick={() => handleSendWaGreeting(item)}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold transition cursor-pointer inline-flex items-center gap-1.5 shadow-sm active:scale-95"
                          title="Kirim Ucapan WA"
                        >
                          <MessageCircle className="w-3.5 h-3.5 text-white" />
                          <span className="text-white font-bold">Kirim WA</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* WhatsApp Greeting Modal */}
      {selectedItemForWa && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 bg-gradient-to-r from-emerald-900/60 via-slate-900 to-slate-900 border-b border-slate-800 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
                  <MessageCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-white text-base flex items-center gap-2">
                    <span>Kirim Ucapan WhatsApp</span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    {selectedItemForWa.jenis === 'kelahiran' ? 'HUT Kelahiran' : 'HUT Pernikahan'} • {selectedItemForWa.labelLengkap}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedItemForWa(null)}
                className="w-8 h-8 rounded-lg bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center text-sm font-bold transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-5 space-y-4 overflow-y-auto text-xs">
              {/* Phone Number Field */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-300 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Nomor WhatsApp Tujuan:</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-normal">Format: 628xxx atau 08xxx</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={waPhoneNumber || ''}
                    onChange={(e) => setWaPhoneNumber(e.target.value)}
                    placeholder="Contoh: 628123456789 atau 08123456789"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                  {waPhoneNumber && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono text-emerald-400 font-bold bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/30">
                      Format: +{formatWaPhoneNumber(waPhoneNumber)}
                    </span>
                  )}
                </div>
                {!waPhoneNumber.trim() && (
                  <p className="text-[11px] text-amber-400 flex items-center gap-1 mt-1 font-semibold">
                    <Info className="w-3.5 h-3.5" />
                    <span>Nomor belum terisi pada Sensus. Silakan ketik nomor WA tujuan di atas.</span>
                  </p>
                )}
              </div>

              {/* Template Switcher */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Pilih Gaya / Templat Pesan:</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
                  <button
                    type="button"
                    onClick={() => handleTemplateChange('formal')}
                    className={`py-1.5 px-2 rounded-lg text-[11px] font-bold transition-all text-center cursor-pointer ${
                      waTemplate === 'formal'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white hover:bg-slate-900'
                    }`}
                  >
                    Resmi GKE
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTemplateChange('warm')}
                    className={`py-1.5 px-2 rounded-lg text-[11px] font-bold transition-all text-center cursor-pointer ${
                      waTemplate === 'warm'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white hover:bg-slate-900'
                    }`}
                  >
                    Hangat & Kasih
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTemplateChange('ayat')}
                    className={`py-1.5 px-2 rounded-lg text-[11px] font-bold transition-all text-center cursor-pointer ${
                      waTemplate === 'ayat'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white hover:bg-slate-900'
                    }`}
                  >
                    Ayat Alkitab
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTemplateChange('singkat')}
                    className={`py-1.5 px-2 rounded-lg text-[11px] font-bold transition-all text-center cursor-pointer ${
                      waTemplate === 'singkat'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white hover:bg-slate-900'
                    }`}
                  >
                    Singkat
                  </button>
                </div>
              </div>

              {/* Message Editor Preview */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-300">Pratinjau Teks Pesan (Dapat Diedit):</label>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(waCustomMessage);
                      setCopiedWaMsg(true);
                      setTimeout(() => setCopiedWaMsg(false), 2500);
                    }}
                    className="text-[10px] font-bold text-indigo-300 hover:text-white flex items-center gap-1 bg-indigo-950/60 hover:bg-indigo-900/80 px-2 py-0.5 rounded border border-indigo-500/30 transition cursor-pointer"
                  >
                    {copiedWaMsg ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedWaMsg ? 'Tersalin!' : 'Salin Pesan'}</span>
                  </button>
                </div>
                <textarea
                  rows={6}
                  value={waCustomMessage || ''}
                  onChange={(e) => setWaCustomMessage(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 leading-relaxed font-sans focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-950 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setSelectedItemForWa(null)}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition cursor-pointer"
              >
                Batal
              </button>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                {formatWaPhoneNumber(waPhoneNumber) ? (
                  <a
                    href={`https://wa.me/${formatWaPhoneNumber(waPhoneNumber)}?text=${encodeURIComponent(waCustomMessage)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setSelectedItemForWa(null)}
                    className="w-full sm:w-auto flex-1 flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-lg shadow-emerald-600/30 border border-emerald-400/40 transition active:scale-95 cursor-pointer text-center"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Buka WhatsApp Sekarang</span>
                  </a>
                ) : (
                  <button
                    disabled
                    className="w-full sm:w-auto flex-1 flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 text-slate-500 font-extrabold text-xs cursor-not-allowed text-center"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Isi Nomor HP Terlebih Dahulu</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
