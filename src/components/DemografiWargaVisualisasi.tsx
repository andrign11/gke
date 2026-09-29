import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ComposedChart,
  Line,
} from 'recharts';
import {
  Users,
  PieChart as PieIcon,
  BarChart3,
  Layers,
  Filter,
  Sparkles,
  Baby,
  GraduationCap,
  Briefcase,
  ShieldCheck,
  HeartHandshake,
  TrendingUp,
  MapPin,
  CheckCircle2,
  Calendar,
  UserCheck,
} from 'lucide-react';
import { WargaJemaat } from '../types';

interface DemografiWargaVisualisasiProps {
  wargaJemaatList: WargaJemaat[];
  availableLingkungans?: string[];
  selectedRayonFilter?: string;
  onRayonChange?: (rayon: string) => void;
}

// Konfigurasi 5 Kelompok Usia Kategorial Gerejawi
export const AGE_GROUPS_CONFIG = [
  {
    id: 'anak',
    nama: 'Anak & Balita',
    rentang: '0 - 12 Thn',
    kategorial: 'ASHM (Sekolah Minggu)',
    minAge: 0,
    maxAge: 12,
    color: '#38BDF8', // Sky 400
    colorL: '#0284C7',
    colorP: '#38BDF8',
    icon: Baby,
    deskripsi: 'Anak Sekolah Hari Minggu & Balita',
  },
  {
    id: 'pemuda',
    nama: 'Remaja & Pemuda',
    rentang: '13 - 25 Thn',
    kategorial: 'SPPR / SPP (Pemuda)',
    minAge: 13,
    maxAge: 25,
    color: '#818CF8', // Indigo 400
    colorL: '#4F46E5',
    colorP: '#818CF8',
    icon: GraduationCap,
    deskripsi: 'Seksi Pelayanan Pemuda & Remaja',
  },
  {
    id: 'dewasa_muda',
    nama: 'Dewasa Muda',
    rentang: '26 - 45 Thn',
    kategorial: 'SPB / SPPer Muda',
    minAge: 26,
    maxAge: 45,
    color: '#34D399', // Emerald 400
    colorL: '#059669',
    colorP: '#34D399',
    icon: Briefcase,
    deskripsi: 'Warga Usia Produktif & Keluarga Muda',
  },
  {
    id: 'dewasa_madya',
    nama: 'Dewasa Madya',
    rentang: '46 - 59 Thn',
    kategorial: 'SPB / SPPer Senior',
    minAge: 46,
    maxAge: 59,
    color: '#FBBF24', // Amber 400
    colorL: '#D97706',
    colorP: '#FBBF24',
    icon: ShieldCheck,
    deskripsi: 'Tokoh Jemaat & Penopang Pelayanan',
  },
  {
    id: 'lansia',
    nama: 'Lansia (Usia Emas)',
    rentang: '60+ Thn',
    kategorial: 'Persekutuan Lansia',
    minAge: 60,
    maxAge: 150,
    color: '#F472B6', // Pink 400
    colorL: '#DB2777',
    colorP: '#F472B6',
    icon: HeartHandshake,
    deskripsi: 'Warga Usia Emas & Sesepuh Jemaat',
  },
];

// 5-Year Age Brackets for Population Pyramid
const PYRAMID_BRACKETS = [
  { label: '0-4', min: 0, max: 4 },
  { label: '5-9', min: 5, max: 9 },
  { label: '10-14', min: 10, max: 14 },
  { label: '15-19', min: 15, max: 19 },
  { label: '20-24', min: 20, max: 24 },
  { label: '25-29', min: 25, max: 29 },
  { label: '30-34', min: 30, max: 34 },
  { label: '35-39', min: 35, max: 39 },
  { label: '40-44', min: 40, max: 44 },
  { label: '45-49', min: 45, max: 49 },
  { label: '50-54', min: 50, max: 54 },
  { label: '55-59', min: 55, max: 59 },
  { label: '60-64', min: 60, max: 64 },
  { label: '65+', min: 65, max: 150 },
];

const GENDER_COLORS = {
  L: '#38BDF8', // Cyan / Sky blue
  P: '#F472B6', // Pink / Rose
};

// Helper parse birth year & calculate age accurately
const calculateAge = (dateStr: string, currentYear: number): number | null => {
  if (!dateStr) return null;
  const cleanStr = dateStr.trim();
  const parts = cleanStr.split(/[-/]/);
  let y = 0;

  if (parts.length === 3) {
    if (parts[0].length === 4) {
      y = parseInt(parts[0], 10);
    } else if (parts[2].length === 4) {
      y = parseInt(parts[2], 10);
    }
  }

  if (isNaN(y) || y <= 1900 || y > currentYear + 1) {
    const dt = new Date(cleanStr);
    if (!isNaN(dt.getTime())) {
      y = dt.getFullYear();
    } else {
      return null;
    }
  }

  return Math.max(0, currentYear - y);
};

export const DemografiWargaVisualisasi: React.FC<DemografiWargaVisualisasiProps> = ({
  wargaJemaatList,
  availableLingkungans = [],
  selectedRayonFilter = '',
  onRayonChange,
}) => {
  const currentYear = new Date().getFullYear();

  // Internal Filter & UI Controls
  const [internalRayon, setInternalRayon] = useState<string>(selectedRayonFilter || '');
  const [membershipFilter, setMembershipFilter] = useState<string>('semua');
  const [barChartMode, setBarChartMode] = useState<'grouped' | 'stacked'>('grouped');
  const [activeDemographyView, setActiveDemographyView] = useState<'kategori' | 'piramida' | 'lingkungan'>('kategori');

  // Handle Rayon change sync
  const currentRayon = onRayonChange ? selectedRayonFilter : internalRayon;
  const handleRayonSelect = (val: string) => {
    if (onRayonChange) {
      onRayonChange(val);
    } else {
      setInternalRayon(val);
    }
  };

  // 1. Data Filtering
  const filteredData = useMemo(() => {
    return wargaJemaatList.filter((item) => {
      const matchRayon = !currentRayon || item.rayon === currentRayon;
      const matchMembership =
        membershipFilter === 'semua' ||
        (membershipFilter === 'Tetap' && item.statusKeanggotaan === 'Tetap') ||
        (membershipFilter === 'Titipan' && item.statusKeanggotaan === 'Titipan') ||
        (membershipFilter === 'Pindah' && item.statusKeanggotaan === 'Pindah') ||
        (membershipFilter === 'Meninggal' && item.statusKeanggotaan === 'Meninggal');
      return matchRayon && matchMembership;
    });
  }, [wargaJemaatList, currentRayon, membershipFilter]);

  // 2. Demographic Calculations: Age Groups & Gender
  const {
    ageCategoryData,
    genderSummary,
    pyramidData,
    rayonDemographyData,
    avgAge,
    maxAgeGroup,
  } = useMemo(() => {
    let totalL = 0;
    let totalP = 0;
    let sumAge = 0;
    let validAgeCount = 0;

    // Structure for 5 Main Age Groups
    const groupCounts: Record<string, { L: number; P: number; total: number }> = {
      anak: { L: 0, P: 0, total: 0 },
      pemuda: { L: 0, P: 0, total: 0 },
      dewasa_muda: { L: 0, P: 0, total: 0 },
      dewasa_madya: { L: 0, P: 0, total: 0 },
      lansia: { L: 0, P: 0, total: 0 },
    };

    // Structure for 5-Year Population Pyramid
    const pyramidCounts: Record<string, { L: number; P: number }> = {};
    PYRAMID_BRACKETS.forEach((b) => {
      pyramidCounts[b.label] = { L: 0, P: 0 };
    });

    // Structure for Lingkungan / Rayon Breakdown
    const rayonCounts: Record<string, { L: number; P: number; total: number }> = {};

    filteredData.forEach((warga) => {
      const isL = warga.jenisKelamin === 'L';
      if (isL) totalL++;
      else totalP++;

      // Rayon counting
      const rName = warga.rayon || 'Belum Terdaftar';
      if (!rayonCounts[rName]) {
        rayonCounts[rName] = { L: 0, P: 0, total: 0 };
      }
      if (isL) rayonCounts[rName].L++;
      else rayonCounts[rName].P++;
      rayonCounts[rName].total++;

      // Age calculation
      const age = calculateAge(warga.tanggalLahir, currentYear);
      if (age !== null) {
        sumAge += age;
        validAgeCount++;

        // Categorize into 5 main groups
        if (age <= 12) {
          groupCounts.anak.total++;
          if (isL) groupCounts.anak.L++;
          else groupCounts.anak.P++;
        } else if (age <= 25) {
          groupCounts.pemuda.total++;
          if (isL) groupCounts.pemuda.L++;
          else groupCounts.pemuda.P++;
        } else if (age <= 45) {
          groupCounts.dewasa_muda.total++;
          if (isL) groupCounts.dewasa_muda.L++;
          else groupCounts.dewasa_muda.P++;
        } else if (age <= 59) {
          groupCounts.dewasa_madya.total++;
          if (isL) groupCounts.dewasa_madya.L++;
          else groupCounts.dewasa_madya.P++;
        } else {
          groupCounts.lansia.total++;
          if (isL) groupCounts.lansia.L++;
          else groupCounts.lansia.P++;
        }

        // Categorize into Population Pyramid brackets
        const bracket = PYRAMID_BRACKETS.find((b) => age >= b.min && age <= b.max);
        if (bracket) {
          if (isL) pyramidCounts[bracket.label].L++;
          else pyramidCounts[bracket.label].P++;
        }
      }
    });

    const totalCalculated = totalL + totalP;

    // Format 5 Age Categories Data for Recharts
    const ageCategoryFormatted = AGE_GROUPS_CONFIG.map((cfg) => {
      const counts = groupCounts[cfg.id] || { L: 0, P: 0, total: 0 };
      const pct = totalCalculated > 0 ? (counts.total / totalCalculated) * 100 : 0;
      const pctL = counts.total > 0 ? (counts.L / counts.total) * 100 : 0;
      const pctP = counts.total > 0 ? (counts.P / counts.total) * 100 : 0;

      return {
        id: cfg.id,
        name: cfg.nama,
        shortName: cfg.nama.split(' ')[0],
        rentang: cfg.rentang,
        kategorial: cfg.kategorial,
        lakiLaki: counts.L,
        perempuan: counts.P,
        total: counts.total,
        percentage: parseFloat(pct.toFixed(1)),
        pctL: parseFloat(pctL.toFixed(1)),
        pctP: parseFloat(pctP.toFixed(1)),
        color: cfg.color,
        icon: cfg.icon,
        deskripsi: cfg.deskripsi,
      };
    });

    // Determine largest age group
    let maxGroup = ageCategoryFormatted[0];
    ageCategoryFormatted.forEach((g) => {
      if (g.total > (maxGroup?.total || 0)) {
        maxGroup = g;
      }
    });

    // Format Population Pyramid
    const pyramidFormatted = PYRAMID_BRACKETS.map((b) => {
      const data = pyramidCounts[b.label] || { L: 0, P: 0 };
      return {
        rentang: b.label,
        lakiLaki: data.L,
        // Inverted or positive representation
        lakiLakiNeg: -data.L,
        perempuan: data.P,
        total: data.L + data.P,
      };
    });

    // Format Rayon Demography
    const rayonFormatted = Object.entries(rayonCounts)
      .map(([name, counts]) => ({
        name: name.replace(/^Lingkungan\s+/i, 'Lingk. '),
        fullName: name,
        lakiLaki: counts.L,
        perempuan: counts.P,
        total: counts.total,
      }))
      .sort((a, b) => b.total - a.total);

    // Gender Summary Data
    const genderFormatted = [
      {
        name: 'Laki-laki',
        value: totalL,
        color: GENDER_COLORS.L,
        percentage: totalCalculated > 0 ? parseFloat(((totalL / totalCalculated) * 100).toFixed(1)) : 0,
      },
      {
        name: 'Perempuan',
        value: totalP,
        color: GENDER_COLORS.P,
        percentage: totalCalculated > 0 ? parseFloat(((totalP / totalCalculated) * 100).toFixed(1)) : 0,
      },
    ];

    const averageAge = validAgeCount > 0 ? (sumAge / validAgeCount).toFixed(1) : '0';

    return {
      ageCategoryData: ageCategoryFormatted,
      genderSummary: genderFormatted,
      pyramidData: pyramidFormatted,
      rayonDemographyData: rayonFormatted,
      avgAge: averageAge,
      maxAgeGroup: maxGroup,
    };
  }, [filteredData, currentYear]);

  const totalJiwa = filteredData.length;
  const totalL = genderSummary.find((g) => g.name === 'Laki-laki')?.value || 0;
  const totalP = genderSummary.find((g) => g.name === 'Perempuan')?.value || 0;
  const sexRatio = totalP > 0 ? ((totalL / totalP) * 100).toFixed(1) : '100';

  // Custom Tooltip for Age Category Chart
  const CustomAgeTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="chart-tooltip-box">
          <div className="tooltip-title flex items-center justify-between">
            <span>{data.name}</span>
            <span className="text-[10px] font-mono text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded">
              {data.rentang}
            </span>
          </div>
          <div className="tooltip-subtitle text-[11px] font-medium">
            Kategorial: <span className="text-slate-800 dark:text-slate-200">{data.kategorial}</span>
          </div>
          <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-1.5 text-sky-500 dark:text-sky-400 font-semibold">
              <div className="w-2.5 h-2.5 rounded-full bg-sky-400" />
              <span>L: {data.lakiLaki} Jiwa ({data.pctL}%)</span>
            </div>
            <div className="flex items-center gap-1.5 text-pink-500 dark:text-pink-400 font-semibold">
              <div className="w-2.5 h-2.5 rounded-full bg-pink-400" />
              <span>P: {data.perempuan} Jiwa ({data.pctP}%)</span>
            </div>
          </div>
          <div className="flex items-center justify-between pt-1 border-t border-slate-200 dark:border-slate-800 font-bold">
            <span className="tooltip-item-label">Total Kelompok:</span>
            <span className="tooltip-item-value text-indigo-600 dark:text-indigo-400">{data.total} Jiwa ({data.percentage}%)</span>
          </div>
        </div>
      );
    }
    return null;
  };

  // Custom Tooltip for Population Pyramid
  const CustomPyramidTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="chart-tooltip-box">
          <div className="tooltip-title">
            Rentang Usia: {data.rentang} Tahun
          </div>
          <div className="flex items-center justify-between gap-4 text-sky-500 dark:text-sky-400">
            <span>Laki-laki:</span>
            <span className="font-bold font-mono">{data.lakiLaki} Jiwa</span>
          </div>
          <div className="flex items-center justify-between gap-4 text-pink-500 dark:text-pink-400">
            <span>Perempuan:</span>
            <span className="font-bold font-mono">{data.perempuan} Jiwa</span>
          </div>
          <div className="flex items-center justify-between gap-4 font-bold pt-1 border-t border-slate-200 dark:border-slate-800">
            <span className="tooltip-item-label">Total:</span>
            <span className="tooltip-item-value font-mono text-indigo-600 dark:text-indigo-400">{data.total} Jiwa</span>
          </div>
        </div>
      );
    }
    return null;
  };

  // Custom Tooltip for Rayon Breakdown
  const CustomRayonTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="chart-tooltip-box">
          <div className="tooltip-title">
            {data.rayon || label}
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-between gap-3 text-xs text-sky-500 dark:text-sky-400">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-400 shrink-0" />
                <span>Laki-laki:</span>
              </span>
              <span className="font-bold font-mono">{data.lakiLaki} Jiwa</span>
            </div>
            <div className="flex items-center justify-between gap-3 text-xs text-pink-500 dark:text-pink-400">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-pink-400 shrink-0" />
                <span>Perempuan:</span>
              </span>
              <span className="font-bold font-mono">{data.perempuan} Jiwa</span>
            </div>
            <div className="flex items-center justify-between gap-3 text-xs pt-1 border-t border-slate-200 dark:border-slate-800 font-bold">
              <span className="tooltip-item-label">Total Rayon:</span>
              <span className="tooltip-item-value font-mono text-indigo-600 dark:text-indigo-400">{data.total} Jiwa</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  // Custom Tooltip for Gender Proportion
  const CustomGenderTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="chart-tooltip-box">
          <div className="tooltip-title flex items-center justify-between">
            <span>{data.name}</span>
            <span className="font-mono text-xs">{data.persentase || Math.round((data.value / (totalJiwa || 1)) * 100)}%</span>
          </div>
          <div className="flex items-center justify-between gap-3 text-xs pt-1">
            <span className="tooltip-item-label flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: data.color }} />
              <span>Jumlah Jiwa:</span>
            </span>
            <span className="tooltip-item-value font-bold font-mono">{data.value} Jiwa</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Filter Controls */}
      <div className="bg-slate-900/90 p-4 sm:p-5 rounded-2xl border border-slate-800 shadow-xl backdrop-blur-md flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              Visualisasi Demografi Warga Jemaat
              <span className="text-[10px] font-semibold bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-md border border-indigo-500/30">
                Recharts Dynamic Engine
              </span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Grafik interaktif distribusi kelompok usia kategorial, rasio jenis kelamin, dan piramida penduduk
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Filter Lingkungan */}
          <div className="relative">
            <select
              value={currentRayon}
              onChange={(e) => handleRayonSelect(e.target.value)}
              className="py-2 pl-3 pr-8 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs font-medium focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="">Semua Lingkungan / Sektor</option>
              {availableLingkungans.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          {/* Filter Keanggotaan */}
          <div className="relative">
            <select
              value={membershipFilter}
              onChange={(e) => setMembershipFilter(e.target.value)}
              className="py-2 pl-3 pr-8 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs font-medium focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="semua">Semua Status Keanggotaan</option>
              <option value="Tetap">Anggota Tetap</option>
              <option value="Titipan">Anggota Titipan</option>
              <option value="Pindah">Anggota Pindah</option>
              <option value="Meninggal">Warga Meninggal (Wafat)</option>
            </select>
          </div>
        </div>
      </div>

      {/* 2. Key Metrics Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Total Jiwa */}
        <div className="bg-slate-900/80 p-3.5 rounded-2xl border border-slate-800 backdrop-blur-md space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-semibold">Total Jiwa</span>
            <Users className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-xl font-black text-slate-100">{totalJiwa}</div>
          <div className="text-[10px] text-slate-500">Warga Terdata</div>
        </div>

        {/* Laki-laki */}
        <div className="bg-slate-900/80 p-3.5 rounded-2xl border border-sky-500/20 backdrop-blur-md space-y-1">
          <div className="flex items-center justify-between text-sky-400">
            <span className="text-[11px] font-semibold">Laki-laki</span>
            <span className="text-[10px] font-bold bg-sky-500/10 px-1.5 py-0.5 rounded">
              {genderSummary.find((g) => g.name === 'Laki-laki')?.percentage}%
            </span>
          </div>
          <div className="text-xl font-black text-sky-300">{totalL}</div>
          <div className="text-[10px] text-sky-500/80">Jiwa (L)</div>
        </div>

        {/* Perempuan */}
        <div className="bg-slate-900/80 p-3.5 rounded-2xl border border-pink-500/20 backdrop-blur-md space-y-1">
          <div className="flex items-center justify-between text-pink-400">
            <span className="text-[11px] font-semibold">Perempuan</span>
            <span className="text-[10px] font-bold bg-pink-500/10 px-1.5 py-0.5 rounded">
              {genderSummary.find((g) => g.name === 'Perempuan')?.percentage}%
            </span>
          </div>
          <div className="text-xl font-black text-pink-300">{totalP}</div>
          <div className="text-[10px] text-pink-500/80">Jiwa (P)</div>
        </div>

        {/* Rasio Gender */}
        <div className="bg-slate-900/80 p-3.5 rounded-2xl border border-slate-800 backdrop-blur-md space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-semibold">Rasio Gender</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl font-black text-emerald-300">{sexRatio}</div>
          <div className="text-[10px] text-slate-500">100 L / 100 P</div>
        </div>

        {/* Rata-rata Usia */}
        <div className="bg-slate-900/80 p-3.5 rounded-2xl border border-slate-800 backdrop-blur-md space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-semibold">Rata-rata Usia</span>
            <Calendar className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-xl font-black text-amber-300">{avgAge} <span className="text-xs font-normal">Thn</span></div>
          <div className="text-[10px] text-slate-500">Profil Umur Jemaat</div>
        </div>

        {/* Kelompok Terbesar */}
        <div className="bg-slate-900/80 p-3.5 rounded-2xl border border-indigo-500/20 backdrop-blur-md space-y-1">
          <div className="flex items-center justify-between text-indigo-400">
            <span className="text-[11px] font-semibold">Kelompok Dominan</span>
            <Sparkles className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-sm font-black text-indigo-200 truncate" title={maxAgeGroup?.name}>
            {maxAgeGroup?.name || '-'}
          </div>
          <div className="text-[10px] text-indigo-400/80">
            {maxAgeGroup?.total || 0} Jiwa ({maxAgeGroup?.percentage || 0}%)
          </div>
        </div>
      </div>

      {/* 3. Main Chart Controls & Visualizations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Main Interactive Demographic Chart */}
        <div className="lg:col-span-2 bg-slate-900/90 p-5 rounded-2xl border border-slate-800 shadow-xl backdrop-blur-md space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
            <div>
              <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <span>Grafik Distribusi Kelompok Usia &amp; Gender</span>
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Perbandingan jumlah warga jemaat Laki-laki vs Perempuan di setiap kelompok usia kategorial
              </p>
            </div>

            <div className="flex items-center gap-2">
              {/* View Switcher: Kategori / Piramida / Lingkungan */}
              <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-[11px]">
                <button
                  onClick={() => setActiveDemographyView('kategori')}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                    activeDemographyView === 'kategori'
                      ? 'bg-indigo-600 text-white shadow'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Kategorial Usia
                </button>
                <button
                  onClick={() => setActiveDemographyView('piramida')}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                    activeDemographyView === 'piramida'
                      ? 'bg-indigo-600 text-white shadow'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Piramida Usia
                </button>
                <button
                  onClick={() => setActiveDemographyView('lingkungan')}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                    activeDemographyView === 'lingkungan'
                      ? 'bg-indigo-600 text-white shadow'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Per Lingkungan
                </button>
              </div>

              {/* Bar mode toggle for Kategorial view */}
              {activeDemographyView === 'kategori' && (
                <button
                  onClick={() => setBarChartMode(barChartMode === 'grouped' ? 'stacked' : 'grouped')}
                  className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-semibold rounded-xl border border-slate-700 transition cursor-pointer flex items-center gap-1.5"
                  title="Ganti Mode Tampilan Grafik Batang"
                >
                  <Layers className="w-3.5 h-3.5 text-indigo-400" />
                  <span>{barChartMode === 'grouped' ? 'Grup' : 'Tumpuk'}</span>
                </button>
              )}
            </div>
          </div>

          {/* Render Active Chart based on user selection */}
          <div className="h-80 w-full pt-2">
            {totalJiwa === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 text-xs">
                <Users className="w-8 h-8 mb-2 opacity-40" />
                <p>Tidak ada data warga jemaat pada filter yang dipilih.</p>
              </div>
            ) : activeDemographyView === 'kategori' ? (
              /* VIEW 1: Kategorial Usia (Bar / Composed Chart) */
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={ageCategoryData}
                  margin={{ top: 15, right: 15, left: -10, bottom: 25 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                  <XAxis
                    dataKey="name"
                    stroke="#64748B"
                    tick={{ fill: '#94A3B8', fontSize: 11 }}
                    interval={0}
                    dy={8}
                  />
                  <YAxis stroke="#64748B" tick={{ fill: '#94A3B8', fontSize: 11 }} allowDecimals={false} />
                  <Tooltip content={<CustomAgeTooltip />} />
                  <Legend
                    verticalAlign="top"
                    align="right"
                    wrapperStyle={{ paddingBottom: '10px', fontSize: '11px' }}
                  />
                  <Bar
                    dataKey="lakiLaki"
                    name="Laki-laki (L)"
                    fill={GENDER_COLORS.L}
                    stackId={barChartMode === 'stacked' ? 'a' : undefined}
                    radius={barChartMode === 'stacked' ? [0, 0, 0, 0] : [6, 6, 0, 0]}
                    maxBarSize={45}
                  />
                  <Bar
                    dataKey="perempuan"
                    name="Perempuan (P)"
                    fill={GENDER_COLORS.P}
                    stackId={barChartMode === 'stacked' ? 'a' : undefined}
                    radius={barChartMode === 'stacked' ? [6, 6, 0, 0] : [6, 6, 0, 0]}
                    maxBarSize={45}
                  />
                  <Line
                    type="monotone"
                    dataKey="total"
                    name="Total Jiwa"
                    stroke="#A78BFA"
                    strokeWidth={2.5}
                    dot={{ fill: '#8B5CF6', r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            ) : activeDemographyView === 'piramida' ? (
              /* VIEW 2: Population Pyramid (5-Year Intervals) */
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={pyramidData}
                  layout="vertical"
                  margin={{ top: 5, right: 15, left: 10, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" horizontal={false} />
                  <XAxis
                    type="number"
                    stroke="#64748B"
                    tick={{ fill: '#94A3B8', fontSize: 11 }}
                    allowDecimals={false}
                  />
                  <YAxis
                    dataKey="rentang"
                    type="category"
                    stroke="#64748B"
                    tick={{ fill: '#94A3B8', fontSize: 10 }}
                    width={45}
                  />
                  <Tooltip content={<CustomPyramidTooltip />} />
                  <Legend
                    verticalAlign="top"
                    align="right"
                    wrapperStyle={{ paddingBottom: '8px', fontSize: '11px' }}
                  />
                  <Bar
                    dataKey="lakiLaki"
                    name="Laki-laki (L)"
                    fill={GENDER_COLORS.L}
                    radius={[0, 4, 4, 0]}
                    maxBarSize={18}
                  />
                  <Bar
                    dataKey="perempuan"
                    name="Perempuan (P)"
                    fill={GENDER_COLORS.P}
                    radius={[0, 4, 4, 0]}
                    maxBarSize={18}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              /* VIEW 3: Per Lingkungan / Rayon */
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={rayonDemographyData}
                  margin={{ top: 10, right: 15, left: -10, bottom: 25 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                  <XAxis
                    dataKey="name"
                    stroke="#64748B"
                    tick={{ fill: '#94A3B8', fontSize: 10 }}
                    interval={0}
                    angle={-15}
                    textAnchor="end"
                  />
                  <YAxis stroke="#64748B" tick={{ fill: '#94A3B8', fontSize: 11 }} allowDecimals={false} />
                  <Tooltip content={<CustomRayonTooltip />} />
                  <Legend verticalAlign="top" align="right" wrapperStyle={{ paddingBottom: '10px', fontSize: '11px' }} />
                  <Bar dataKey="lakiLaki" name="Laki-laki" fill={GENDER_COLORS.L} radius={[4, 4, 0, 0]} maxBarSize={30} />
                  <Bar dataKey="perempuan" name="Perempuan" fill={GENDER_COLORS.P} radius={[4, 4, 0, 0]} maxBarSize={30} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Right 1 Col: Donut Charts (Gender Proportion & Age Categories) */}
        <div className="bg-slate-900/90 p-5 rounded-2xl border border-slate-800 shadow-xl backdrop-blur-md space-y-4 flex flex-col justify-between">
          <div>
            <h4 className="text-sm font-bold text-slate-100 flex items-center justify-between">
              <span>Proporsi Rasio Gender</span>
              <PieIcon className="w-4 h-4 text-indigo-400" />
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">Persentase jemaat Laki-laki vs Perempuan</p>
          </div>

          <div className="h-44 w-full relative flex items-center justify-center">
            {totalJiwa === 0 ? (
              <span className="text-xs text-slate-500">Tidak ada data</span>
            ) : (
              <>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={genderSummary}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={68}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {genderSummary.map((entry, index) => (
                        <Cell key={`gender-cell-${index}`} fill={entry.color} stroke="#0F172A" strokeWidth={2} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomGenderTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                {/* Center Stats */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-lg font-black text-slate-100">{totalJiwa}</span>
                  <span className="text-[10px] text-slate-400 font-semibold">Total Jiwa</span>
                </div>
              </>
            )}
          </div>

          {/* Gender Legend Badges */}
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80">
            <div className="bg-sky-500/10 border border-sky-500/20 p-2 rounded-xl text-center">
              <div className="flex items-center justify-center gap-1 text-[11px] text-sky-400 font-semibold">
                <div className="w-2 h-2 rounded-full bg-sky-400" />
                <span>Laki-laki</span>
              </div>
              <div className="text-sm font-bold text-sky-200 mt-0.5">
                {totalL} <span className="text-[10px] font-normal text-sky-400/80">({genderSummary[0]?.percentage}%)</span>
              </div>
            </div>

            <div className="bg-pink-500/10 border border-pink-500/20 p-2 rounded-xl text-center">
              <div className="flex items-center justify-center gap-1 text-[11px] text-pink-400 font-semibold">
                <div className="w-2 h-2 rounded-full bg-pink-400" />
                <span>Perempuan</span>
              </div>
              <div className="text-sm font-bold text-pink-200 mt-0.5">
                {totalP} <span className="text-[10px] font-normal text-pink-400/80">({genderSummary[1]?.percentage}%)</span>
              </div>
            </div>
          </div>

          {/* Age Category Mini Breakdown */}
          <div className="space-y-1.5 pt-2 border-t border-slate-800/80">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Komposisi Kelompok Usia:
            </span>
            <div className="space-y-1.5">
              {ageCategoryData.map((cat) => (
                <div key={cat.id} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />
                    <span className="text-slate-300 font-medium">{cat.name}</span>
                  </div>
                  <div className="font-mono text-slate-400 text-[11px]">
                    <span className="font-bold text-slate-200">{cat.total}</span> ({cat.percentage}%)
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 4. Detailed Demographic Table Breakdown */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800 shadow-xl overflow-hidden backdrop-blur-md">
        <div className="p-4 sm:p-5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <span>Tabel Rincian Demografi &amp; Kategorial Pelayanan Jemaat</span>
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">
              Distribusi lengkap jumlah warga berdasarkan klasifikasi usia gerejawi dan persentase gender
            </p>
          </div>
          <div className="text-xs text-slate-400 font-medium">
            Total Tercakup: <span className="text-indigo-400 font-bold">{totalJiwa} Jiwa</span>
          </div>
        </div>

        <div className="overflow-x-auto w-full">
          <table className="w-full text-xs text-left text-slate-300">
            <thead className="bg-slate-950/80 text-slate-200 font-bold border-b border-slate-800 uppercase text-[11px] tracking-wider whitespace-nowrap">
              <tr>
                <th className="p-3.5">Kelompok Usia</th>
                <th className="p-3.5">Rentang Umur</th>
                <th className="p-3.5">Kategorial Pelayanan</th>
                <th className="p-3.5 text-center text-sky-400">Laki-laki (L)</th>
                <th className="p-3.5 text-center text-pink-400">Perempuan (P)</th>
                <th className="p-3.5 text-center">Rasio L/P</th>
                <th className="p-3.5 text-right font-mono">Total Jiwa</th>
                <th className="p-3.5 text-right">Persentase</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {ageCategoryData.map((row) => {
                const IconComponent = row.icon;
                const ratio = row.perempuan > 0 ? ((row.lakiLaki / row.perempuan) * 100).toFixed(0) : '100';

                return (
                  <tr key={row.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-3.5 font-bold text-slate-100 flex items-center gap-2.5">
                      <div
                        className="p-1.5 rounded-lg text-white shrink-0"
                        style={{ backgroundColor: `${row.color}33`, color: row.color }}
                      >
                        <IconComponent className="w-4 h-4" />
                      </div>
                      <div>
                        <div>{row.name}</div>
                        <div className="text-[10px] text-slate-500 font-normal">{row.deskripsi}</div>
                      </div>
                    </td>
                    <td className="p-3.5 font-mono font-semibold text-slate-300">{row.rentang}</td>
                    <td className="p-3.5">
                      <span className="bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 px-2 py-0.5 rounded-md font-medium text-[11px]">
                        {row.kategorial}
                      </span>
                    </td>
                    <td className="p-3.5 text-center font-mono font-bold text-sky-400">
                      {row.lakiLaki} <span className="text-[10px] text-sky-500/70 font-normal">({row.pctL}%)</span>
                    </td>
                    <td className="p-3.5 text-center font-mono font-bold text-pink-400">
                      {row.perempuan} <span className="text-[10px] text-pink-500/70 font-normal">({row.pctP}%)</span>
                    </td>
                    <td className="p-3.5 text-center font-mono text-slate-400">{ratio} : 100</td>
                    <td className="p-3.5 text-right font-mono font-bold text-slate-100 text-sm">{row.total}</td>
                    <td className="p-3.5 text-right font-mono font-semibold text-indigo-300">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-16 bg-slate-800 rounded-full h-1.5 overflow-hidden hidden sm:block">
                          <div
                            className="h-full rounded-full"
                            style={{ width: `${row.percentage}%`, backgroundColor: row.color }}
                          />
                        </div>
                        <span>{row.percentage}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="bg-slate-950/90 font-bold border-t-2 border-slate-700 text-slate-100">
              <tr>
                <td colSpan={3} className="p-3.5 uppercase tracking-wider text-xs">
                  Total Seluruh Warga Jemaat
                </td>
                <td className="p-3.5 text-center font-mono text-sky-300">{totalL} Jiwa</td>
                <td className="p-3.5 text-center font-mono text-pink-300">{totalP} Jiwa</td>
                <td className="p-3.5 text-center font-mono text-slate-300">{sexRatio} : 100</td>
                <td className="p-3.5 text-right font-mono text-indigo-300 text-base">{totalJiwa}</td>
                <td className="p-3.5 text-right font-mono text-emerald-400">100.0%</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};
