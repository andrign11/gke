import React, { useState } from 'react';
import {
  BookOpen,
  Calendar,
  DollarSign,
  Package,
  Printer,
  TrendingDown,
  TrendingUp,
  UserCheck,
  Users,
  ArrowRight,
  Sparkles,
  Settings,
  Cake,
  Gift,
  Heart,
  Phone,
  MessageSquare,
  Search,
  Filter,
  PartyPopper,
  Send,
  Copy,
  CheckCircle2,
  X,
  ChevronRight,
  CheckSquare,
  ListTodo,
  Wrench,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { WargaJemaat } from '../../types';
import { StatistikWargaVisualisasi } from '../StatistikWargaVisualisasi';

const MONTH_NAMES = [
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

interface BirthInfo {
  year: number;
  month: number;
  day: number;
  age: number;
  formattedDate: string;
}

const parseBirthDate = (dateStr: string, currentYear: number): BirthInfo | null => {
  if (!dateStr) return null;
  const cleanStr = dateStr.trim();
  const parts = cleanStr.split(/[-/]/);
  let y = 0,
    m = -1,
    d = 0;

  if (parts.length === 3) {
    if (parts[0].length === 4) {
      y = parseInt(parts[0], 10);
      m = parseInt(parts[1], 10) - 1;
      d = parseInt(parts[2], 10);
    } else if (parts[2].length === 4) {
      d = parseInt(parts[0], 10);
      m = parseInt(parts[1], 10) - 1;
      y = parseInt(parts[2], 10);
    }
  }

  if (isNaN(y) || isNaN(m) || isNaN(d) || m < 0 || m > 11 || d < 1 || d > 31) {
    const dt = new Date(cleanStr);
    if (!isNaN(dt.getTime())) {
      y = dt.getFullYear();
      m = dt.getMonth();
      d = dt.getDate();
    } else {
      return null;
    }
  }

  const age = y > 0 ? Math.max(0, currentYear - y) : 0;
  const formattedDate = `${d} ${MONTH_NAMES[m]}`;
  return { year: y, month: m, day: d, age, formattedDate };
};

export const DashboardModule: React.FC = () => {
  const {
    penatuaDiakonList,
    keuanganList,
    wargaJemaatList,
    pendaftaranAnggotaList,
    jadwalIbadahList,
    inventarisList,
    renunganList,
    pelayananTaskList,
    openPrintReport,
    setActiveTab,
    settings,
    currentUser,
    dueSoonMaintenanceCount,
    overdueMaintenanceCount,
  } = useApp();

  const currentDate = new Date();
  const currentMonth = currentDate.getMonth();
  const currentDay = currentDate.getDate();
  const currentYear = currentDate.getFullYear();

  // Birthday Notification Module State
  const [selectedMonth, setSelectedMonth] = useState<number>(currentMonth);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedRayon, setSelectedRayon] = useState<string>('semua');
  const [timeFilter, setTimeFilter] = useState<'semua' | 'hari_ini' | '7_hari'>('semua');
  const [selectedMemberModal, setSelectedMemberModal] = useState<{
    member: WargaJemaat;
    birthInfo: BirthInfo;
  } | null>(null);
  const [customPastoralText, setCustomPastoralText] = useState<string>('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const totalPenatua = penatuaDiakonList.filter((p) => p.jabatan.includes('Penatua')).length;
  const totalDiakon = penatuaDiakonList.filter((p) => p.jabatan.includes('Diakon')).length;

  const totalPemasukan = keuanganList
    .filter((k) => k.jenis === 'pemasukan')
    .reduce((acc, curr) => acc + curr.jumlah, 0);

  const totalPengeluaran = keuanganList
    .filter((k) => k.jenis === 'pengeluaran')
    .reduce((acc, curr) => acc + curr.jumlah, 0);

  const saldoKas = totalPemasukan - totalPengeluaran;

  const totalWarga = wargaJemaatList.length;
  const totalKK = new Set(wargaJemaatList.map((w) => w.noKjj)).size;

  const totalNilaiAset = inventarisList.reduce(
    (sum, item) => sum + item.nilaiAset * item.kuantitas,
    0
  );

  // Birthday Calculations
  const availableRayons = Array.from(
    new Set(wargaJemaatList.map((w) => w.rayon).filter(Boolean))
  );

  const membersWithBirth = wargaJemaatList
    .map((member) => ({
      member,
      birthInfo: parseBirthDate(member.tanggalLahir, currentYear),
    }))
    .filter(
      (item): item is { member: WargaJemaat; birthInfo: BirthInfo } =>
        item.birthInfo !== null
    );

  const monthlyBirthdayMembers = membersWithBirth.filter(
    ({ birthInfo }) => birthInfo.month === selectedMonth
  );

  const filteredBirthdayMembers = monthlyBirthdayMembers
    .filter(({ member, birthInfo }) => {
      const matchSearch =
        !searchQuery ||
        member.namaLengkap.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.alamat.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.rayon.toLowerCase().includes(searchQuery.toLowerCase());

      const matchRayon = selectedRayon === 'semua' || member.rayon === selectedRayon;

      let matchTime = true;
      if (timeFilter === 'hari_ini') {
        matchTime = birthInfo.month === currentMonth && birthInfo.day === currentDay;
      } else if (timeFilter === '7_hari') {
        if (birthInfo.month === currentMonth) {
          matchTime = birthInfo.day >= currentDay && birthInfo.day <= currentDay + 7;
        } else {
          matchTime = false;
        }
      }

      return matchSearch && matchRayon && matchTime;
    })
    .sort((a, b) => a.birthInfo.day - b.birthInfo.day);

  // Counts for badge notifications
  const todayCount = membersWithBirth.filter(
    ({ birthInfo }) => birthInfo.month === currentMonth && birthInfo.day === currentDay
  ).length;

  const next7DaysCount = membersWithBirth.filter(
    ({ birthInfo }) =>
      birthInfo.month === currentMonth &&
      birthInfo.day >= currentDay &&
      birthInfo.day <= currentDay + 7
  ).length;

  const generatePastoralText = (namaLengkap: string, age: number) => {
    return `Shalom, Selamat Ulang Tahun untuk ${namaLengkap} (${age} Tahun)! 🎉🎂\n\nMajelis & Jemaat ${settings.namaJemaat} mengucapkan Selamat Hari Ulang Tahun. Mendoakan agar senantiasa dilimpahi kesehatan, kedamaian, serta berkat kelimpahan dari Tuhan Yesus Kristus.\n\n"TUHAN memberkati engkau dan memelihara engkau; TUHAN menyinari engkau dengan wajah-Nya dan memberi engkau kasih karunia." (Bilangan 6:24-25)\n\nSalam & Doa Pelayanan Pastoral,\nMajelis Jemaat ${settings.namaJemaat}`;
  };

  const handleOpenModal = (item: { member: WargaJemaat; birthInfo: BirthInfo }) => {
    setSelectedMemberModal(item);
    setCustomPastoralText(
      generatePastoralText(item.member.namaLengkap, item.birthInfo.age)
    );
  };

  const handleCopyText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const getWhatsAppLink = (noHp: string, text: string) => {
    if (!noHp) return '#';
    let cleanNumber = noHp.replace(/\D/g, '');
    if (cleanNumber.startsWith('0')) {
      cleanNumber = '62' + cleanNumber.substring(1);
    }
    return `https://wa.me/${cleanNumber}?text=${encodeURIComponent(text)}`;
  };

  return (
    <div className="space-y-6">
      {/* Top Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white shadow-xl border border-indigo-500/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest bg-indigo-500/20 px-3 py-1 rounded-full border border-indigo-500/30 flex items-center gap-1.5 w-max">
              <Sparkles className="w-3 h-3 text-indigo-400" /> Sistem Informasi Jemaat GKE
            </span>
            <h2 className="text-2xl font-extrabold mt-3 tracking-tight bg-gradient-to-r from-white via-slate-100 to-indigo-200 bg-clip-text text-transparent">
              Selamat Datang di Panel MPH {settings.namaJemaat}
            </h2>
            <p className="text-xs text-slate-300 mt-1.5 max-w-2xl leading-relaxed">
              Pengelolaan terpadu kepengurusan Penatua & Diakon, keuangan kas, sensus warga
              jemaat, jadwal ibadah, inventaris aset, dan buletin renungan harian.
            </p>
          </div>
        </div>
      </div>

      {/* Maintenance Notification Banner if any asset is due or overdue */}
      {(overdueMaintenanceCount > 0 || dueSoonMaintenanceCount > 0) && (
        <div
          className={`p-4 rounded-2xl border shadow-lg backdrop-blur-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all ${
            overdueMaintenanceCount > 0
              ? 'bg-rose-950/40 border-rose-500/40 text-rose-200'
              : 'bg-amber-950/40 border-amber-500/40 text-amber-200'
          }`}
        >
          <div className="flex items-start gap-3">
            <div
              className={`p-2.5 rounded-xl border flex-shrink-0 ${
                overdueMaintenanceCount > 0
                  ? 'bg-rose-500/20 border-rose-500/30 text-rose-400 animate-pulse'
                  : 'bg-amber-500/20 border-amber-500/30 text-amber-400'
              }`}
            >
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h4 className="text-xs font-bold uppercase tracking-wider">
                  Pengingat Jadwal Servis &amp; Pemeliharaan Aset Gereja
                </h4>
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
              </div>
              <p className="text-xs text-slate-300 mt-1">
                Terdapat peralatan atau inventaris gereja yang memerlukan servis berkala atau sudah melewati batas waktu jatuh tempo pemeliharaan.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setActiveTab('pemeliharaan_aset')}
            className="px-4 py-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-100 text-xs font-bold border border-slate-700 flex items-center gap-2 transition flex-shrink-0 shadow hover:-translate-y-0.5 cursor-pointer"
          >
            <span>Buka Modul Pemeliharaan</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Saldo Kas */}
        <div className="bg-slate-900/80 rounded-2xl p-5 border border-slate-800/80 shadow-lg flex flex-col justify-between backdrop-blur-md">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Saldo Kas Jemaat
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black text-slate-100 tracking-tight">
              Rp {saldoKas.toLocaleString('id-ID')}
            </h3>
            <div className="flex items-center gap-3 text-[11px] mt-2 text-slate-400">
              <span className="text-emerald-400 font-semibold flex items-center gap-1">
                <TrendingUp className="w-3 h-3" /> +{totalPemasukan.toLocaleString('id-ID')}
              </span>
              <span className="text-rose-400 font-semibold flex items-center gap-1">
                <TrendingDown className="w-3 h-3" /> -{totalPengeluaran.toLocaleString('id-ID')}
              </span>
            </div>
          </div>
        </div>

        {/* Warga Jemaat */}
        <div className="bg-slate-900/80 rounded-2xl p-5 border border-slate-800/80 shadow-lg flex flex-col justify-between backdrop-blur-md">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Warga Jemaat
            </span>
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black text-slate-100 tracking-tight">{totalWarga} Jiwa</h3>
            <p className="text-xs text-slate-400 mt-1.5">
              Terdaftar dalam <strong className="text-indigo-300 font-bold">{totalKK} KK</strong> (Kartu Keluarga)
            </p>
          </div>
        </div>

        {/* Penatua & Diakon */}
        <div className="bg-slate-900/80 rounded-2xl p-5 border border-slate-800/80 shadow-lg flex flex-col justify-between backdrop-blur-md">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Penatua & Diakon
            </span>
            <div className="w-9 h-9 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20 flex items-center justify-center">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black text-slate-100 tracking-tight">
              {penatuaDiakonList.length} Pelayan
            </h3>
            <p className="text-xs text-slate-400 mt-1.5">
              {totalPenatua} Penatua & {totalDiakon} Diakon Aktif
            </p>
          </div>
        </div>

        {/* Inventaris & Valuasi Aset */}
        <div className="bg-slate-900/80 rounded-2xl p-5 border border-slate-800/80 shadow-lg flex flex-col justify-between backdrop-blur-md">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Valuasi Aset Jemaat
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black text-slate-100 tracking-tight">
              Rp {(totalNilaiAset / 1000000000).toFixed(2)} Miliar
            </h3>
            <p className="text-xs text-slate-400 mt-1.5">
              {inventarisList.length} Sarana & Inventaris Terdaftar
            </p>
          </div>
        </div>
      </div>

      {/* Visualisasi Statistik Recharts: Pertumbuhan Jemaat & Kategori Usia */}
      <StatistikWargaVisualisasi
        wargaJemaatList={wargaJemaatList}
        pendaftaranAnggotaList={pendaftaranAnggotaList}
        namaJemaat={settings.namaJemaat}
        onNavigateToSensus={() => setActiveTab('warga_jemaat')}
      />

      {/* ------------------------------------------------------------- */}
      {/* MODUL NOTIFIKASI ULANG TAHUN WARGA JEMAAT (PELAYANAN PASTORAL) */}
      {/* ------------------------------------------------------------- */}
      <div className="bg-white dark:bg-slate-900/90 rounded-2xl border border-slate-200 dark:border-indigo-500/30 shadow-xl dark:shadow-2xl backdrop-blur-md overflow-hidden transition-all">
        {/* Header Modul */}
        <div className="p-5 bg-gradient-to-r from-slate-50 via-indigo-50/40 to-slate-50 dark:from-slate-900 dark:via-indigo-950/80 dark:to-slate-900 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="p-3 rounded-2xl bg-pink-100 dark:bg-pink-500/15 border border-pink-200 dark:border-pink-500/30 text-pink-600 dark:text-pink-400 shadow-inner flex-shrink-0">
              <Cake className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2 flex-wrap">
                  <span>Notifikasi Ulang Tahun Warga Jemaat</span>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-pink-100 dark:bg-pink-500/20 text-pink-700 dark:text-pink-300 border border-pink-200 dark:border-pink-500/30 inline-flex items-center gap-1 whitespace-nowrap shadow-2xs">
                    <Heart className="w-3 h-3 fill-pink-500 dark:fill-pink-400 text-pink-500 dark:text-pink-400" />
                    Pelayanan Pastoral
                  </span>
                </h3>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 leading-relaxed">
                Daftar warga jemaat yang berulang tahun pada bulan{' '}
                <strong className="text-indigo-600 dark:text-indigo-300 font-bold">
                  {MONTH_NAMES[selectedMonth]} {currentYear}
                </strong>{' '}
                untuk kebutuhan sapaan, ucapan, dan kunjungan doa pastoral.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-start md:self-center flex-wrap">
            {todayCount > 0 && (
              <div className="flex items-center gap-1.5 bg-gradient-to-r from-amber-500/20 to-pink-500/20 text-amber-700 dark:text-amber-300 font-bold text-xs px-3.5 py-2 rounded-xl border border-amber-500/40 shadow-md animate-bounce">
                <PartyPopper className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span>{todayCount} Berulang Tahun Hari Ini!</span>
              </div>
            )}

            <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-950/80 p-1.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
              <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 pl-2">Bulan:</span>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(parseInt(e.target.value, 10))}
                className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs font-bold px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 focus:outline-none focus:border-indigo-500"
              >
                {MONTH_NAMES.map((mName, idx) => (
                  <option key={mName} value={idx}>
                    {mName} {idx === currentMonth ? '(Bulan Ini)' : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Filter & Sub-bar Controls */}
        <div className="p-4 bg-slate-50/70 dark:bg-slate-950/50 border-b border-slate-200 dark:border-slate-800/80 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 text-xs">
          {/* Sub-filters buttons - responsive layout without cut-off text */}
          <div className="grid grid-cols-3 sm:flex sm:items-center gap-1.5 sm:gap-2">
            <button
              onClick={() => setTimeFilter('semua')}
              className={`px-2.5 sm:px-3.5 py-2 rounded-xl font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer select-none text-xs ${
                timeFilter === 'semua'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 border border-indigo-500'
                  : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-800'
              }`}
            >
              <span>Semua<span className="hidden sm:inline"> Bulan Ini</span></span>
              <span
                className="badge-count-number"
                style={{
                  backgroundColor: timeFilter === 'semua' ? '#ffffff' : undefined,
                  color: timeFilter === 'semua' ? '#1e1b4b' : undefined,
                  WebkitTextFillColor: timeFilter === 'semua' ? '#1e1b4b' : undefined,
                }}
              >
                {monthlyBirthdayMembers.length}
              </span>
            </button>

            <button
              onClick={() => setTimeFilter('hari_ini')}
              className={`px-2.5 sm:px-3.5 py-2 rounded-xl font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer select-none text-xs ${
                timeFilter === 'hari_ini'
                  ? 'bg-pink-600 text-white shadow-md shadow-pink-600/30 border border-pink-500'
                  : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-800'
              }`}
            >
              <PartyPopper className="w-3.5 h-3.5 text-pink-500 dark:text-pink-300 shrink-0" />
              <span>Hari Ini</span>
              {todayCount > 0 && (
                <span
                  className="badge-count-number"
                  style={{
                    backgroundColor: timeFilter === 'hari_ini' ? '#ffffff' : undefined,
                    color: timeFilter === 'hari_ini' ? '#831843' : undefined,
                    WebkitTextFillColor: timeFilter === 'hari_ini' ? '#831843' : undefined,
                  }}
                >
                  {todayCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setTimeFilter('7_hari')}
              className={`px-2.5 sm:px-3.5 py-2 rounded-xl font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer select-none text-xs ${
                timeFilter === '7_hari'
                  ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30 border border-amber-500'
                  : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-800'
              }`}
            >
              <Gift className="w-3.5 h-3.5 text-amber-500 dark:text-amber-300 shrink-0" />
              <span>7 Hari<span className="hidden sm:inline"> Ke Depan</span></span>
              <span
                className="badge-count-number"
                style={{
                  backgroundColor: timeFilter === '7_hari' ? '#ffffff' : undefined,
                  color: timeFilter === '7_hari' ? '#78350f' : undefined,
                  WebkitTextFillColor: timeFilter === '7_hari' ? '#78350f' : undefined,
                }}
              >
                {next7DaysCount}
              </span>
            </button>
          </div>

          {/* Search & Rayon Filter - responsive layout with ample room */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full md:w-auto">
            <div className="relative w-full sm:w-56 md:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari nama warga..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 text-xs focus:outline-none focus:border-indigo-500 shadow-2xs"
              />
            </div>

            {availableRayons.length > 0 && (
              <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-800 text-slate-700 dark:text-slate-300 shrink-0 shadow-2xs">
                <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <select
                  value={selectedRayon}
                  onChange={(e) => setSelectedRayon(e.target.value)}
                  className="bg-transparent text-xs font-semibold focus:outline-none cursor-pointer text-slate-800 dark:text-slate-200"
                >
                  <option value="semua" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">Semua Rayon</option>
                  {availableRayons.map((r) => (
                    <option key={r} value={r} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
                      {r}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Content List / Grid */}
        <div className="p-5">
          {filteredBirthdayMembers.length === 0 ? (
            <div className="py-12 text-center space-y-3 bg-slate-50 dark:bg-slate-950/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
              <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-900 text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-800 flex items-center justify-center mx-auto shadow-2xs">
                <Cake className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-slate-800 dark:text-slate-300 text-sm">
                Tidak ada data warga berulang tahun
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
                {searchQuery || selectedRayon !== 'semua' || timeFilter !== 'semua'
                  ? 'Tidak ditemukan warga jemaat dengan kriteria filter saat ini. Coba bersihkan filter pencarian.'
                  : `Belum ada warga jemaat yang tercatat berulang tahun pada bulan ${MONTH_NAMES[selectedMonth]}. Anda dapat berpindah ke bulan lain melalui menu pilihan di atas.`}
              </p>
              {(searchQuery || selectedRayon !== 'semua' || timeFilter !== 'semua') && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedRayon('semua');
                    setTimeFilter('semua');
                  }}
                  className="mt-2 text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-bold hover:underline cursor-pointer"
                >
                  Reset Filter Pencarian
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredBirthdayMembers.map(({ member, birthInfo }) => {
                const isToday =
                  birthInfo.month === currentMonth && birthInfo.day === currentDay;

                return (
                  <div
                    key={member.id}
                    className={`p-4 rounded-2xl border transition-all duration-200 relative flex flex-col justify-between space-y-3 ${
                      isToday
                        ? 'bg-gradient-to-b from-pink-50 via-white to-white dark:from-pink-950/40 dark:via-slate-900 dark:to-slate-900 border-pink-300 dark:border-pink-500/50 shadow-md shadow-pink-500/10 ring-1 ring-pink-400/40 dark:ring-pink-500/30'
                        : 'bg-white dark:bg-slate-950/60 hover:bg-slate-50 dark:hover:bg-slate-900/80 border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-500/40 shadow-xs'
                    }`}
                  >
                    {/* Header Card: Name & Birthday Badge */}
                    <div>
                      {isToday && (
                        <div className="mb-2.5 px-2.5 py-1 rounded-lg bg-gradient-to-r from-pink-100 to-amber-100 dark:from-pink-500/20 dark:to-amber-500/20 border border-pink-300 dark:border-pink-500/40 text-pink-800 dark:text-pink-300 text-[10px] font-black uppercase tracking-wider flex items-center justify-between shadow-2xs">
                          <span className="flex items-center gap-1">
                            <PartyPopper className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                            Hari Ini Berulang Tahun!
                          </span>
                          <span className="text-amber-600 dark:text-amber-300">🎉</span>
                        </div>
                      )}

                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-10 h-10 rounded-xl font-bold flex items-center justify-center text-sm shadow-inner flex-shrink-0 ${
                              member.jenisKelamin === 'L'
                                ? 'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30'
                                : 'bg-pink-100 dark:bg-pink-500/20 text-pink-700 dark:text-pink-300 border border-pink-200 dark:border-pink-500/30'
                            }`}
                          >
                            {member.namaLengkap.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm leading-snug line-clamp-1">
                              {member.namaLengkap}
                            </h4>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
                              <span className="px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[10px] font-semibold text-slate-700 dark:text-slate-300">
                                {member.hubunganKeluarga || 'Anggota'}
                              </span>
                              <span>•</span>
                              <span>{member.rayon || 'Rayon Jemaat'}</span>
                            </p>
                          </div>
                        </div>

                        <div className="text-right flex-shrink-0">
                          <span
                            className={`px-2.5 py-1 rounded-xl text-xs font-black border ${
                              isToday
                                ? 'bg-pink-100 dark:bg-pink-500/30 text-pink-800 dark:text-pink-200 border-pink-300 dark:border-pink-400/50 shadow-2xs'
                                : 'bg-indigo-50 dark:bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-500/30'
                            }`}
                          >
                            {birthInfo.formattedDate}
                          </span>
                          <p className="text-[10px] font-bold text-amber-600 dark:text-amber-400 mt-1">
                            {birthInfo.age > 0 ? `Usia ${birthInfo.age} Thn` : 'Berulang Tahun'}
                          </p>
                        </div>
                      </div>

                      {/* Detail Info Alamat & No HP */}
                      <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/60 text-[11px] text-slate-600 dark:text-slate-400 space-y-1">
                        <p className="line-clamp-1 text-slate-700 dark:text-slate-300">
                          <strong className="text-slate-400 dark:text-slate-500 font-semibold">Alamat:</strong>{' '}
                          {member.alamat || 'Alamat belum diisi'}
                        </p>
                        {member.noHp && (
                          <p className="flex items-center gap-1.5 text-slate-800 dark:text-slate-300 font-mono">
                            <Phone className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                            <span>{member.noHp}</span>
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Pastoral Care Action Buttons */}
                    <div className="pt-2 flex items-center gap-2 border-t border-slate-100 dark:border-slate-800/80">
                      {member.noHp ? (
                        <a
                          href={getWhatsAppLink(
                            member.noHp,
                            generatePastoralText(member.namaLengkap, birthInfo.age)
                          )}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-50 hover:bg-emerald-600 dark:bg-emerald-600/20 dark:hover:bg-emerald-600 text-emerald-700 hover:text-white dark:text-emerald-300 dark:hover:text-white border border-emerald-200 dark:border-emerald-500/30 font-bold py-2 px-3 rounded-xl text-xs transition-all active:scale-95 shadow-2xs cursor-pointer"
                          title="Kirim Ucapan via WhatsApp"
                        >
                          <Send className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 group-hover:text-white" />
                          <span>Kirim WA</span>
                        </a>
                      ) : (
                        <button
                          disabled
                          className="flex-1 flex items-center justify-center gap-1 bg-slate-100 dark:bg-slate-900 text-slate-400 dark:text-slate-600 border border-slate-200 dark:border-slate-800 font-bold py-2 px-3 rounded-xl text-xs cursor-not-allowed opacity-60"
                          title="No HP belum terdaftar"
                        >
                          <Phone className="w-3.5 h-3.5" />
                          <span>No HP (-)</span>
                        </button>
                      )}

                      <button
                        onClick={() => handleOpenModal({ member, birthInfo })}
                        className="flex items-center justify-center gap-1.5 bg-indigo-50 hover:bg-indigo-600 dark:bg-indigo-600/20 dark:hover:bg-indigo-600 text-indigo-700 hover:text-white dark:text-indigo-300 dark:hover:text-white border border-indigo-200 dark:border-indigo-500/30 font-bold py-2 px-3 rounded-xl text-xs transition-all active:scale-95 shadow-2xs cursor-pointer"
                        title="Buka Pesan Doa Pastoral"
                      >
                        <MessageSquare className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                        <span>Doa Pastoral</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Three Column Layout for Quick Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upcoming Worship Schedules */}
        <div className="bg-slate-900/80 rounded-2xl p-5 border border-slate-800/80 shadow-lg backdrop-blur-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-slate-800/80">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  <Calendar className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-slate-100 text-sm">Jadwal Ibadah Mendatang</h3>
              </div>
              <button
                onClick={() => setActiveTab('jadwal_ibadah')}
                className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 group"
              >
                <span>Lihat Semua</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

            <div className="space-y-3">
              {jadwalIbadahList.slice(0, 3).map((ji) => (
                <div
                  key={ji.id}
                  className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-indigo-500/40 transition-all flex justify-between items-start text-xs"
                >
                  <div>
                    <h4 className="font-bold text-slate-100 text-sm">{ji.namaIbadah}</h4>
                    <p className="text-slate-400 mt-0.5">{ji.tempat}</p>
                    <p className="text-indigo-300 font-medium mt-1.5">
                      Pelayan Firman: {ji.pengkhotbah}
                    </p>
                  </div>
                  <div className="text-right flex flex-col items-end">
                    <span className="px-2.5 py-1 bg-indigo-500/15 text-indigo-300 font-bold rounded-lg text-[11px] border border-indigo-500/30">
                      {ji.tanggal}
                    </span>
                    <p className="text-slate-400 text-[11px] mt-1 font-mono">{ji.waktu}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tugas Pelayanan Aktif (Task Board Overview) */}
        <div className="bg-slate-900/80 rounded-2xl p-5 border border-slate-800/80 shadow-lg backdrop-blur-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-slate-800/80">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <CheckSquare className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-slate-100 text-sm">Tugas Pelayanan & Majelis</h3>
              </div>
              <button
                onClick={() => setActiveTab('manajemen_tugas')}
                className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 group"
              >
                <span>Task Board</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

            <div className="space-y-3">
              {pelayananTaskList.length === 0 ? (
                <div className="p-6 text-center text-slate-500 bg-slate-950/40 rounded-xl border border-slate-800/60 text-xs">
                  Belum ada tugas pelayanan aktif.
                </div>
              ) : (
                pelayananTaskList.slice(0, 3).map((task) => {
                  const doneSub = task.subtasks.filter((st) => st.isDone).length;
                  const totalSub = task.subtasks.length;
                  return (
                    <div
                      key={task.id}
                      onClick={() => setActiveTab('manajemen_tugas')}
                      className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-emerald-500/40 transition-all cursor-pointer text-xs space-y-1.5"
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-bold text-slate-200 line-clamp-1">{task.judul}</span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            task.status === 'COMPLETED'
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                              : task.status === 'IN_PROGRESS'
                              ? 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                              : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                          }`}
                        >
                          {task.status === 'TODO'
                            ? 'To-Do'
                            : task.status === 'IN_PROGRESS'
                            ? 'Proses'
                            : task.status === 'REVIEW'
                            ? 'Review'
                            : 'Selesai'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <span>PJ: <strong className="text-slate-300">{task.penanggungJawab}</strong></span>
                        <span>Tenggat: {task.tenggatWaktu}</span>
                      </div>
                      {totalSub > 0 && (
                        <div className="flex items-center gap-2 pt-1">
                          <div className="flex-1 bg-slate-800 h-1.5 rounded-full overflow-hidden">
                            <div
                              className="bg-emerald-500 h-full rounded-full"
                              style={{ width: `${Math.round((doneSub / totalSub) * 100)}%` }}
                            />
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono">{doneSub}/{totalSub}</span>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Recent Daily Devotions */}
        <div className="bg-slate-900/80 rounded-2xl p-5 border border-slate-800/80 shadow-lg backdrop-blur-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-slate-800/80">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  <BookOpen className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-slate-100 text-sm">Renungan Harian Terkini</h3>
              </div>
              <button
                onClick={() => setActiveTab('renungan_khotbah')}
                className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 group"
              >
                <span>Kelola Buletin</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

            <div className="space-y-3">
              {renunganList.slice(0, 2).map((rng) => (
                <div
                  key={rng.id}
                  className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2 hover:border-indigo-500/40 transition-all"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-indigo-300 text-sm">{rng.judul}</span>
                    <span className="text-[10px] text-slate-400 font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-800 font-medium">
                      {rng.tanggal}
                    </span>
                  </div>
                  <p className="text-xs text-indigo-400 italic font-medium">
                    Nats: {rng.natsAlkitab}
                  </p>
                  <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                    {rng.isi}
                  </p>
                  <div className="pt-2 flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-800/60">
                    <span>Oleh: {rng.penulis}</span>
                    <button
                      onClick={() =>
                        openPrintReport({
                          reportType: 'buletin_renungan',
                          renunganId: rng.id,
                        })
                      }
                      className="text-indigo-400 hover:text-indigo-300 font-semibold hover:underline"
                    >
                      Cetak Buletin
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Modal Pesan Ucapan & Doa Pastoral */}
      {selectedMemberModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-indigo-500/30 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl space-y-4">
            <div className="p-4 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-pink-100 dark:bg-pink-500/15 text-pink-600 dark:text-pink-400 border border-pink-200 dark:border-pink-500/30">
                  <Cake className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                    Pesan & Doa Ulang Tahun Pastoral
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Sapaan resmi dari Majelis Jemaat {settings.namaJemaat}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedMemberModal(null)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                    {selectedMemberModal.member.namaLengkap}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Tgl Lahir: <span className="font-semibold text-slate-700 dark:text-slate-300">{selectedMemberModal.birthInfo.formattedDate}</span> (Usia{' '}
                    <span className="font-semibold text-slate-700 dark:text-slate-300">{selectedMemberModal.birthInfo.age} Tahun</span>)
                  </p>
                </div>
                <div className="text-right font-mono text-[11px] text-indigo-600 dark:text-indigo-300 font-semibold">
                  {selectedMemberModal.member.noHp || 'Tanpa No. HP'}
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Pratinjau Teks Pesan Pastoral (Dapat Disesuaikan):
                </label>
                <textarea
                  rows={8}
                  value={customPastoralText || ''}
                  onChange={(e) => setCustomPastoralText(e.target.value)}
                  className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-slate-200 leading-relaxed font-sans focus:outline-none focus:border-indigo-500 text-xs shadow-inner"
                />
              </div>

              <div className="flex items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  onClick={() =>
                    handleCopyText(selectedMemberModal.member.id, customPastoralText)
                  }
                  className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 font-bold px-4 py-2.5 rounded-xl transition cursor-pointer"
                >
                  {copiedId === selectedMemberModal.member.id ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <span className="text-emerald-700 dark:text-emerald-300 font-bold">Tersalin ke Clipboard!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                      <span>Salin Teks Doa</span>
                    </>
                  )}
                </button>

                {selectedMemberModal.member.noHp ? (
                  <a
                    href={getWhatsAppLink(
                      selectedMemberModal.member.noHp,
                      customPastoralText
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-5 py-2.5 rounded-xl shadow-lg shadow-emerald-600/30 transition active:scale-95 cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                    <span>Kirim via WhatsApp</span>
                  </a>
                ) : (
                  <span className="text-amber-600 dark:text-amber-400 text-[11px] italic font-semibold">
                    *Nomor WhatsApp belum diisi
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

