import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  BarChart3,
  LineChart as LineChartIcon,
  PieChart as PieChartIcon,
  Calendar,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Layers,
  Filter,
  Sparkles,
  Award,
  Wallet,
  Building2,
  Coins,
} from 'lucide-react';
import { KeuanganItem } from '../types';

interface KeuanganVisualisasiProps {
  keuanganList: KeuanganItem[];
  activePosKas: string;
  onSelectPosKas?: (pos: string) => void;
  saldoAwalCustom?: number;
}

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

const MONTH_SHORT = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'Mei',
  'Jun',
  'Jul',
  'Agu',
  'Sep',
  'Okt',
  'Nov',
  'Des',
];

const PIE_COLORS = [
  '#10B981', // emerald
  '#3B82F6', // blue
  '#F59E0B', // amber
  '#8B5CF6', // violet
  '#EC4899', // pink
  '#06B6D4', // cyan
  '#14B8A6', // teal
  '#6366F1', // indigo
  '#F97316', // orange
  '#84CC16', // lime
  '#64748B', // slate
];

const formatRupiah = (val: number) => {
  return 'Rp ' + (val || 0).toLocaleString('id-ID');
};

const formatRupiahShort = (val: number) => {
  if (Math.abs(val) >= 1_000_000_000) {
    return `Rp ${(val / 1_000_000_000).toFixed(1)}M`;
  }
  if (Math.abs(val) >= 1_000_000) {
    return `Rp ${(val / 1_000_000).toFixed(1)}Jt`;
  }
  if (Math.abs(val) >= 1_000) {
    return `Rp ${(val / 1_000).toFixed(0)}Rb`;
  }
  return `Rp ${val}`;
};

export const KeuanganVisualisasi: React.FC<KeuanganVisualisasiProps> = ({
  keuanganList,
  activePosKas,
  saldoAwalCustom = 0,
}) => {
  // Available years from dataset
  const availableYears = useMemo(() => {
    const yearsSet = new Set<string>();
    const currentYear = new Date().getFullYear().toString();
    yearsSet.add(currentYear);
    yearsSet.add((new Date().getFullYear() - 1).toString());

    keuanganList.forEach((item) => {
      if (item.tanggal) {
        const y = item.tanggal.split('-')[0];
        if (y && y.length === 4) yearsSet.add(y);
      }
    });
    return Array.from(yearsSet).sort((a, b) => b.localeCompare(a));
  }, [keuanganList]);

  const [selectedYear, setSelectedYear] = useState<string>(
    availableYears[0] || new Date().getFullYear().toString()
  );
  const [chartViewMode, setChartViewMode] = useState<
    'all' | 'bar_monthly' | 'trend_line' | 'category_pie'
  >('all');
  const [selectedPosFilter, setSelectedPosFilter] = useState<string>(activePosKas || 'semua');

  // Sync when parent activePosKas changes if user hasn't chosen custom
  React.useEffect(() => {
    if (activePosKas) {
      setSelectedPosFilter(activePosKas);
    }
  }, [activePosKas]);

  // Filtered dataset according to selected year & posKas
  const yearFilteredData = useMemo(() => {
    return keuanganList.filter((item) => {
      if (item.status === 'pending' || item.status === 'ditolak') return false;
      const isYearMatch = item.tanggal && item.tanggal.startsWith(selectedYear);
      const isPosMatch =
        selectedPosFilter === 'semua' ||
        (item.posKas || 'Kas Umum') === selectedPosFilter;
      return isYearMatch && isPosMatch;
    });
  }, [keuanganList, selectedYear, selectedPosFilter]);

  // Monthly aggregated data for Bar and Line/Area charts
  const monthlyData = useMemo(() => {
    const result = Array.from({ length: 12 }, (_, i) => {
      const monthIndex = i; // 0 to 11
      const monthKey = `${selectedYear}-${String(monthIndex + 1).padStart(2, '0')}`;
      return {
        month: MONTH_NAMES[monthIndex],
        monthShort: MONTH_SHORT[monthIndex],
        monthKey,
        pemasukan: 0,
        pengeluaran: 0,
        netto: 0,
        saldoKumulatif: 0,
        transaksiCount: 0,
      };
    });

    yearFilteredData.forEach((item) => {
      if (!item.tanggal) return;
      const monthPart = parseInt(item.tanggal.split('-')[1], 10) - 1;
      if (monthPart >= 0 && monthPart < 12) {
        if (item.jenis === 'pemasukan') {
          result[monthPart].pemasukan += item.jumlah;
        } else if (item.jenis === 'pengeluaran') {
          result[monthPart].pengeluaran += item.jumlah;
        }
        result[monthPart].transaksiCount += 1;
      }
    });

    // Compute Netto and Cumulative Balance
    let runningSaldo = saldoAwalCustom;
    result.forEach((m) => {
      m.netto = m.pemasukan - m.pengeluaran;
      runningSaldo += m.netto;
      m.saldoKumulatif = runningSaldo;
    });

    return result;
  }, [yearFilteredData, selectedYear, saldoAwalCustom]);

  // Category breakdown for Pemasukan
  const pemasukanByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    yearFilteredData
      .filter((k) => k.jenis === 'pemasukan')
      .forEach((item) => {
        const cat = item.kategori || 'Lain-lain';
        map[cat] = (map[cat] || 0) + item.jumlah;
      });

    return Object.entries(map)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [yearFilteredData]);

  // Category breakdown for Pengeluaran
  const pengeluaranByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    yearFilteredData
      .filter((k) => k.jenis === 'pengeluaran')
      .forEach((item) => {
        const cat = item.kategori || 'Lain-lain';
        map[cat] = (map[cat] || 0) + item.jumlah;
      });

    return Object.entries(map)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [yearFilteredData]);

  // Pos Kas breakdown
  const posKasBreakdown = useMemo(() => {
    const map: Record<string, { pemasukan: number; pengeluaran: number; netto: number }> = {};
    keuanganList
      .filter((k) => {
        if (k.status === 'pending' || k.status === 'ditolak') return false;
        return k.tanggal && k.tanggal.startsWith(selectedYear);
      })
      .forEach((item) => {
        const pos = item.posKas || 'Kas Umum';
        if (!map[pos]) {
          map[pos] = { pemasukan: 0, pengeluaran: 0, netto: 0 };
        }
        if (item.jenis === 'pemasukan') {
          map[pos].pemasukan += item.jumlah;
        } else {
          map[pos].pengeluaran += item.jumlah;
        }
        map[pos].netto = map[pos].pemasukan - map[pos].pengeluaran;
      });

    return Object.entries(map).map(([pos, data]) => ({
      posKas: pos,
      ...data,
    }));
  }, [keuanganList, selectedYear]);

  // Key Statistics
  const stats = useMemo(() => {
    const totalPemasukan = monthlyData.reduce((acc, curr) => acc + curr.pemasukan, 0);
    const totalPengeluaran = monthlyData.reduce((acc, curr) => acc + curr.pengeluaran, 0);
    const totalNetto = totalPemasukan - totalPengeluaran;

    // Filter active months (months with transactions or non-zero)
    const activeMonths = monthlyData.filter((m) => m.pemasukan > 0 || m.pengeluaran > 0);
    const activeCount = Math.max(activeMonths.length, 1);

    const avgPemasukan = totalPemasukan / activeCount;
    const avgPengeluaran = totalPengeluaran / activeCount;

    // Best and lowest month for Pemasukan
    let peakPemasukanMonth = monthlyData[0];
    let peakPengeluaranMonth = monthlyData[0];

    monthlyData.forEach((m) => {
      if (m.pemasukan > peakPemasukanMonth.pemasukan) peakPemasukanMonth = m;
      if (m.pengeluaran > peakPengeluaranMonth.pengeluaran) peakPengeluaranMonth = m;
    });

    const efficiencyRatio =
      totalPemasukan > 0 ? ((totalPengeluaran / totalPemasukan) * 100).toFixed(1) : '0';

    return {
      totalPemasukan,
      totalPengeluaran,
      totalNetto,
      avgPemasukan,
      avgPengeluaran,
      peakPemasukanMonth,
      peakPengeluaranMonth,
      efficiencyRatio,
    };
  }, [monthlyData]);

  // Custom Tooltip for Bar & Line Charts
  const CustomChartTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="chart-tooltip-box min-w-[200px]">
          <p className="tooltip-title border-b border-slate-200 dark:border-slate-800 pb-1.5 mb-2 flex items-center gap-1.5 font-bold">
            <Calendar className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
            {label} {selectedYear}
          </p>
          <div className="space-y-1.5">
            {payload.map((entry: any, index: number) => {
              const color = entry.color || entry.fill || '#10B981';
              return (
                <div key={`item-${index}`} className="flex items-center justify-between gap-4 text-xs">
                  <span className="tooltip-item-label flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
                    {entry.name}:
                  </span>
                  <span className="tooltip-item-value font-bold font-mono">
                    {formatRupiah(entry.value)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      );
    }
    return null;
  };

  // Custom Pie Tooltip
  const CustomPieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      const percent = data.percent ? (data.percent * 100).toFixed(1) : null;
      return (
        <div className="chart-tooltip-box min-w-[180px]">
          <p className="tooltip-title mb-1 font-bold">{data.name}</p>
          <p className="font-black text-emerald-600 dark:text-emerald-400 font-mono text-sm">
            {formatRupiah(data.value)}
          </p>
          {percent && (
            <p className="text-[11px] tooltip-subtitle mt-0.5">
              Kontribusi: <span className="font-semibold text-indigo-600 dark:text-indigo-300">{percent}%</span>
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Header & Filter Controls Bar */}
      <div className="bg-slate-900/90 p-5 rounded-2xl border border-slate-800 shadow-xl backdrop-blur-md flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-500/20 to-emerald-500/20 text-indigo-400 border border-indigo-500/30">
            <BarChart3 className="w-6 h-6 text-indigo-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-100">
                Visualisasi & Analisis Keuangan Recharts
              </h3>
              <span className="text-[10px] font-extrabold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-md border border-indigo-500/30">
                Tahun {selectedYear}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Grafik batang persembahan bulanan, tren garis arus kas kas kumulatif, dan distribusi pos anggaran
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Pos Kas Filter */}
          <div className="flex items-center gap-1.5 bg-slate-950/80 px-2.5 py-1.5 rounded-xl border border-slate-800 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedPosFilter}
              onChange={(e) => setSelectedPosFilter(e.target.value)}
              className="bg-transparent text-slate-200 font-bold focus:outline-none cursor-pointer text-xs"
            >
              <option value="semua" className="bg-slate-900 text-slate-100">
                Semua Pos Kas (Gabungan)
              </option>
              <option value="Kas Umum" className="bg-slate-900 text-slate-100">
                Kas Umum
              </option>
              <option value="Kas Pembangunan" className="bg-slate-900 text-slate-100">
                Kas Pembangunan
              </option>
              <option value="Kas Diakonia" className="bg-slate-900 text-slate-100">
                Kas Diakonia
              </option>
              <option value="Kas Kupon" className="bg-slate-900 text-slate-100">
                Kas Kupon
              </option>
              <option value="Kas Iuran Kewajiban" className="bg-slate-900 text-slate-100">
                Kas Iuran Kewajiban
              </option>
              <option value="Kas Iuran Pembangunan" className="bg-slate-900 text-slate-100">
                Kas Iuran Pembangunan
              </option>
              <option value="Kas SPPer" className="bg-slate-900 text-slate-100">
                Kas SPPer
              </option>
              <option value="Kas SPB" className="bg-slate-900 text-slate-100">
                Kas SPB
              </option>
              <option value="Kas SPPR/P" className="bg-slate-900 text-slate-100">
                Kas SPPR/P
              </option>
              <option value="Kas Anak Sekolah Hari Minggu" className="bg-slate-900 text-slate-100">
                Kas ASHM
              </option>
            </select>
          </div>

          {/* Year Filter */}
          <div className="flex items-center gap-1.5 bg-slate-950/80 px-2.5 py-1.5 rounded-xl border border-slate-800 text-xs">
            <Calendar className="w-3.5 h-3.5 text-emerald-400" />
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="bg-transparent text-slate-200 font-bold focus:outline-none cursor-pointer text-xs"
            >
              {availableYears.map((yr) => (
                <option key={yr} value={yr} className="bg-slate-900 text-slate-100">
                  Tahun {yr}
                </option>
              ))}
            </select>
          </div>

          {/* Chart View Toggle Tabs */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setChartViewMode('all')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                chartViewMode === 'all'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Semua</span>
            </button>
            <button
              onClick={() => setChartViewMode('bar_monthly')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                chartViewMode === 'bar_monthly'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Batang Bulanan</span>
            </button>
            <button
              onClick={() => setChartViewMode('trend_line')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                chartViewMode === 'trend_line'
                  ? 'bg-sky-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <LineChartIcon className="w-3.5 h-3.5" />
              <span>Tren Garis</span>
            </button>
            <button
              onClick={() => setChartViewMode('category_pie')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                chartViewMode === 'category_pie'
                  ? 'bg-amber-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <PieChartIcon className="w-3.5 h-3.5" />
              <span>Kategori & Pos</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Highlight Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Inflow */}
        <div className="bg-slate-900/80 p-4 rounded-2xl border border-emerald-500/20 shadow-lg backdrop-blur-md flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-semibold uppercase tracking-wider text-[10px]">
              Total Penerimaan ({selectedYear})
            </span>
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
              <ArrowDownRight className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <h4 className="text-xl font-black text-emerald-400 tracking-tight">
              {formatRupiah(stats.totalPemasukan)}
            </h4>
            <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
              <span>Rata-rata/Bulan:</span>
              <span className="font-bold text-slate-200">{formatRupiahShort(stats.avgPemasukan)}</span>
            </div>
          </div>
        </div>

        {/* Total Outflow */}
        <div className="bg-slate-900/80 p-4 rounded-2xl border border-rose-500/20 shadow-lg backdrop-blur-md flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-semibold uppercase tracking-wider text-[10px]">
              Total Pengeluaran ({selectedYear})
            </span>
            <div className="w-7 h-7 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center border border-rose-500/20">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <h4 className="text-xl font-black text-rose-400 tracking-tight">
              {formatRupiah(stats.totalPengeluaran)}
            </h4>
            <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
              <span>Rata-rata/Bulan:</span>
              <span className="font-bold text-slate-200">{formatRupiahShort(stats.avgPengeluaran)}</span>
            </div>
          </div>
        </div>

        {/* Net Cash Balance */}
        <div className="bg-slate-900/80 p-4 rounded-2xl border border-indigo-500/20 shadow-lg backdrop-blur-md flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-semibold uppercase tracking-wider text-[10px]">
              Surplus / Netto ({selectedYear})
            </span>
            <div className="w-7 h-7 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <h4
              className={`text-xl font-black tracking-tight ${
                stats.totalNetto >= 0 ? 'text-indigo-300' : 'text-amber-400'
              }`}
            >
              {formatRupiah(stats.totalNetto)}
            </h4>
            <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
              <span>Rasio Belanja:</span>
              <span className="font-bold text-slate-200">{stats.efficiencyRatio}% Penerimaan</span>
            </div>
          </div>
        </div>

        {/* Peak Inflow Month */}
        <div className="bg-slate-900/80 p-4 rounded-2xl border border-amber-500/20 shadow-lg backdrop-blur-md flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-semibold uppercase tracking-wider text-[10px]">
              Bulan Persembahan Tertinggi
            </span>
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <h4 className="text-xl font-black text-amber-300 tracking-tight">
              {stats.peakPemasukanMonth.month || '-'}
            </h4>
            <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
              <span>Penerimaan:</span>
              <span className="font-bold text-emerald-400">
                {formatRupiahShort(stats.peakPemasukanMonth.pemasukan)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 1: DUAL BAR CHART - PERBANDINGAN PEMASUKAN VS PENGELUARAN BULANAN */}
      {(chartViewMode === 'all' || chartViewMode === 'bar_monthly') && (
        <div className="bg-slate-900/90 p-5 rounded-2xl border border-slate-800 shadow-xl backdrop-blur-md space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <BarChart3 className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  Grafik Batang: Rekapitulasi Pemasukan Persembahan & Pengeluaran Kas Bulanan
                </h4>
                <p className="text-xs text-slate-400">
                  Perbandingan nominal realisasi masuk (hijau) dan keluar (merah) per bulan sepanjang {selectedYear}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs font-semibold">
              <div className="flex items-center gap-1.5 text-emerald-400">
                <span className="w-3 h-3 rounded-md bg-emerald-500 inline-block shadow-sm" />
                <span>Pemasukan / Persembahan</span>
              </div>
              <div className="flex items-center gap-1.5 text-rose-400">
                <span className="w-3 h-3 rounded-md bg-rose-500 inline-block shadow-sm" />
                <span>Pengeluaran Kas</span>
              </div>
            </div>
          </div>

          <div className="h-[340px] w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={monthlyData}
                margin={{ top: 20, right: 20, left: 10, bottom: 10 }}
                barGap={6}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} vertical={false} />
                <XAxis
                  dataKey="monthShort"
                  stroke="#94A3B8"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: '#475569' }}
                />
                <YAxis
                  stroke="#94A3B8"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: '#475569' }}
                  tickFormatter={formatRupiahShort}
                  width={75}
                />
                <Tooltip content={<CustomChartTooltip />} />
                <Legend
                  wrapperStyle={{ paddingTop: 12, fontSize: 12 }}
                  formatter={(value) => <span className="text-slate-300 font-medium">{value}</span>}
                />
                <Bar
                  dataKey="pemasukan"
                  name="Pemasukan (Persembahan)"
                  fill="#10B981"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={38}
                />
                <Bar
                  dataKey="pengeluaran"
                  name="Pengeluaran Kas"
                  fill="#F43F5E"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={38}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* SECTION 2: LINE & AREA CHART - TREN ARUS KAS & SALDO KUMULATIF */}
      {(chartViewMode === 'all' || chartViewMode === 'trend_line') && (
        <div className="bg-slate-900/90 p-5 rounded-2xl border border-slate-800 shadow-xl backdrop-blur-md space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
                <TrendingUp className="w-5 h-5 text-sky-400" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  Grafik Tren Garis: Arus Kas Bersih (Netto) & Proyeksi Saldo Kumulatif
                </h4>
                <p className="text-xs text-slate-400">
                  Visualisasi kurva kestabilan likuiditas kas jemaat dan akumulasi saldo akhir per periode
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs font-semibold">
              <div className="flex items-center gap-1.5 text-sky-400">
                <span className="w-3 h-3 rounded-full bg-sky-400 inline-block shadow-sm" />
                <span>Saldo Kumulatif (Area)</span>
              </div>
              <div className="flex items-center gap-1.5 text-amber-400">
                <span className="w-3 h-3 rounded-full bg-amber-400 inline-block shadow-sm" />
                <span>Arus Kas Netto / Bulan (Garis)</span>
              </div>
            </div>
          </div>

          <div className="h-[340px] w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={monthlyData}
                margin={{ top: 20, right: 20, left: 10, bottom: 10 }}
              >
                <defs>
                  <linearGradient id="colorSaldo" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0284C7" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#0284C7" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorNetto" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#F59E0B" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} vertical={false} />
                <XAxis
                  dataKey="monthShort"
                  stroke="#94A3B8"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: '#475569' }}
                />
                <YAxis
                  stroke="#94A3B8"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: '#475569' }}
                  tickFormatter={formatRupiahShort}
                  width={75}
                />
                <Tooltip content={<CustomChartTooltip />} />
                <Legend
                  wrapperStyle={{ paddingTop: 12, fontSize: 12 }}
                  formatter={(value) => <span className="text-slate-300 font-medium">{value}</span>}
                />
                <ReferenceLine y={0} stroke="#64748B" strokeDasharray="3 3" />
                <Area
                  type="monotone"
                  dataKey="saldoKumulatif"
                  name="Saldo Kumulatif Kas"
                  stroke="#38BDF8"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorSaldo)"
                  dot={{ r: 4, fill: '#38BDF8', strokeWidth: 2, stroke: '#0F172A' }}
                  activeDot={{ r: 6, stroke: '#FFFFFF', strokeWidth: 2 }}
                />
                <Line
                  type="monotone"
                  dataKey="netto"
                  name="Surplus/Defisit Netto Bulanan"
                  stroke="#F59E0B"
                  strokeWidth={2.5}
                  strokeDasharray="4 2"
                  dot={{ r: 3, fill: '#F59E0B' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* SECTION 3: BREAKDOWN KATEGORI PERSEMBAHAN & POS KAS */}
      {(chartViewMode === 'all' || chartViewMode === 'category_pie') && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Breakdown Kategori Pemasukan */}
          <div className="bg-slate-900/90 p-5 rounded-2xl border border-slate-800 shadow-xl backdrop-blur-md space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <PieChartIcon className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-100">
                    Distribusi Kategori Pemasukan Persembahan
                  </h4>
                  <p className="text-xs text-slate-400">Komposisi pos persembahan & donasi jemaat</p>
                </div>
              </div>
            </div>

            {pemasukanByCategory.length === 0 ? (
              <div className="py-16 text-center text-slate-500 text-xs">
                Belum ada data transaksi pemasukan untuk periode {selectedYear}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
                <div className="sm:col-span-6 h-[240px] w-full flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pemasukanByCategory}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={85}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {pemasukanByCategory.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={PIE_COLORS[index % PIE_COLORS.length]}
                            stroke="#0F172A"
                            strokeWidth={2}
                          />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomPieTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="sm:col-span-6 space-y-2 max-h-[240px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-800">
                  {pemasukanByCategory.slice(0, 8).map((cat, idx) => {
                    const percent =
                      stats.totalPemasukan > 0
                        ? ((cat.value / stats.totalPemasukan) * 100).toFixed(1)
                        : '0';
                    return (
                      <div
                        key={cat.name}
                        className="bg-slate-950/60 p-2 rounded-xl border border-slate-800 flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }}
                          />
                          <span className="text-slate-300 font-medium truncate" title={cat.name}>
                            {cat.name}
                          </span>
                        </div>
                        <div className="text-right shrink-0 ml-2">
                          <span className="font-bold text-emerald-400 font-mono text-[11px] block">
                            {formatRupiahShort(cat.value)}
                          </span>
                          <span className="text-[10px] text-slate-500 font-semibold">{percent}%</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Breakdown Pengeluaran Kas */}
          <div className="bg-slate-900/90 p-5 rounded-2xl border border-slate-800 shadow-xl backdrop-blur-md space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
                  <PieChartIcon className="w-5 h-5 text-rose-400" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-100">
                    Distribusi Pos Pengeluaran & Belanja
                  </h4>
                  <p className="text-xs text-slate-400">Komposisi pos biaya operasional, gaji, & program</p>
                </div>
              </div>
            </div>

            {pengeluaranByCategory.length === 0 ? (
              <div className="py-16 text-center text-slate-500 text-xs">
                Belum ada data transaksi pengeluaran untuk periode {selectedYear}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
                <div className="sm:col-span-6 h-[240px] w-full flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pengeluaranByCategory}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={85}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {pengeluaranByCategory.map((entry, index) => (
                          <Cell
                            key={`cell-out-${index}`}
                            fill={PIE_COLORS[(index + 3) % PIE_COLORS.length]}
                            stroke="#0F172A"
                            strokeWidth={2}
                          />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomPieTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="sm:col-span-6 space-y-2 max-h-[240px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-800">
                  {pengeluaranByCategory.slice(0, 8).map((cat, idx) => {
                    const percent =
                      stats.totalPengeluaran > 0
                        ? ((cat.value / stats.totalPengeluaran) * 100).toFixed(1)
                        : '0';
                    return (
                      <div
                        key={cat.name}
                        className="bg-slate-950/60 p-2 rounded-xl border border-slate-800 flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: PIE_COLORS[(idx + 3) % PIE_COLORS.length] }}
                          />
                          <span className="text-slate-300 font-medium truncate" title={cat.name}>
                            {cat.name}
                          </span>
                        </div>
                        <div className="text-right shrink-0 ml-2">
                          <span className="font-bold text-rose-400 font-mono text-[11px] block">
                            {formatRupiahShort(cat.value)}
                          </span>
                          <span className="text-[10px] text-slate-500 font-semibold">{percent}%</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SECTION 4: REKAPITULASI POS KAS GEREJA (TABEL MATRIX REKAP POS ANGGARAN) */}
      <div className="bg-slate-900/90 p-5 rounded-2xl border border-slate-800 shadow-xl backdrop-blur-md space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Building2 className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-100">
                Matriks Performa Keuangan Tiap Pos Kas Jemaat ({selectedYear})
              </h4>
              <p className="text-xs text-slate-400">
                Ringkasan komparasi performa antara Kas Umum, Kas Pembangunan, Kas Diakonia, dan Seksi Kategorial
              </p>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800">
              <tr>
                <th className="py-3 px-4 rounded-l-xl">Pos Kas / Rekening</th>
                <th className="py-3 px-4 text-right">Penerimaan</th>
                <th className="py-3 px-4 text-right">Pengeluaran</th>
                <th className="py-3 px-4 text-right">Surplus / Defisit Netto</th>
                <th className="py-3 px-4 text-center rounded-r-xl">Status Anggaran</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {posKasBreakdown.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500">
                    Tidak ada transaksi pada tahun {selectedYear}
                  </td>
                </tr>
              ) : (
                posKasBreakdown.map((row) => {
                  const isPositive = row.netto >= 0;
                  return (
                    <tr key={row.posKas} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-200 flex items-center gap-2">
                        <Coins className="w-3.5 h-3.5 text-amber-400" />
                        {row.posKas}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-semibold text-emerald-400">
                        {formatRupiah(row.pemasukan)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-semibold text-rose-400">
                        {formatRupiah(row.pengeluaran)}
                      </td>
                      <td
                        className={`py-3 px-4 text-right font-mono font-bold ${
                          isPositive ? 'text-indigo-300' : 'text-amber-400'
                        }`}
                      >
                        {formatRupiah(row.netto)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            isPositive
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          }`}
                        >
                          {isPositive ? (
                            <>
                              <TrendingUp className="w-3 h-3" /> Surplus
                            </>
                          ) : (
                            <>
                              <TrendingDown className="w-3 h-3" /> Defisit
                            </>
                          )}
                        </span>
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
};
