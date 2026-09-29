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
} from 'recharts';
import {
  Package,
  Building2,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  TrendingUp,
  Layers,
  MapPin,
  Sparkles,
  PieChart as PieChartIcon,
  BarChart3,
  Award,
  Filter,
  RefreshCw,
} from 'lucide-react';
import { InventarisAset } from '../types';

interface AsetVisualisasiProps {
  inventarisList: InventarisAset[];
  onFilterKategori?: (kategori: string) => void;
}

const CATEGORY_COLORS: Record<string, string> = {
  'Bangunan & Tanah': '#6366f1', // Indigo
  'Kendaraan Operasional': '#06b6d4', // Cyan
  'Sound System & Peralatan Musik': '#f59e0b', // Amber
  'Mebel & Furnitur': '#10b981', // Emerald
  'Alat Elektronik & IT': '#8b5cf6', // Purple
  'Peralatan Sakramen & Ibadah': '#ec4899', // Pink
};

const DEFAULT_COLORS = ['#6366f1', '#06b6d4', '#f59e0b', '#10b981', '#8b5cf6', '#ec4899', '#3b82f6', '#14b8a6'];

const KONDISI_COLORS: Record<string, string> = {
  Baik: '#10b981',
  'Rusak Ringan': '#f59e0b',
  'Rusak Berat': '#f43f5e',
};

const formatRupiahShort = (value: number) => {
  if (value >= 1_000_000_000) {
    return `Rp ${(value / 1_000_000_000).toFixed(1)} M`;
  }
  if (value >= 1_000_000) {
    return `Rp ${(value / 1_000_000).toFixed(1)} Jt`;
  }
  if (value >= 1_000) {
    return `Rp ${(value / 1_000).toFixed(0)} Rb`;
  }
  return `Rp ${value.toLocaleString('id-ID')}`;
};

export const AsetVisualisasi: React.FC<AsetVisualisasiProps> = ({
  inventarisList,
  onFilterKategori,
}) => {
  const [selectedKategoriFilter, setSelectedKategoriFilter] = useState<string>('semua');
  const [selectedKondisiFilter, setSelectedKondisiFilter] = useState<string>('semua');
  const [chartViewMode, setChartViewMode] = useState<'all' | 'kategori' | 'kondisi' | 'lokasi'>('all');

  // Filtered dataset for statistics
  const filteredData = useMemo(() => {
    return inventarisList.filter((item) => {
      const matchKategori =
        selectedKategoriFilter === 'semua' ? true : item.kategori === selectedKategoriFilter;
      const matchKondisi =
        selectedKondisiFilter === 'semua' ? true : item.kondisi === selectedKondisiFilter;
      return matchKategori && matchKondisi;
    });
  }, [inventarisList, selectedKategoriFilter, selectedKondisiFilter]);

  // 1. Overview Metrics
  const metrics = useMemo(() => {
    const totalItems = filteredData.length;
    const totalUnitFisik = filteredData.reduce((sum, i) => sum + (Number(i.kuantitas) || 0), 0);
    const totalValuasi = filteredData.reduce(
      (sum, i) => sum + (Number(i.nilaiAset) || 0) * (Number(i.kuantitas) || 0),
      0
    );
    const itemsBaik = filteredData.filter((i) => i.kondisi === 'Baik');
    const unitBaik = itemsBaik.reduce((sum, i) => sum + (Number(i.kuantitas) || 0), 0);
    const persenBaik = totalUnitFisik > 0 ? ((unitBaik / totalUnitFisik) * 100).toFixed(1) : '0';
    const rataRataNilaiPerUnit = totalUnitFisik > 0 ? Math.round(totalValuasi / totalUnitFisik) : 0;

    return {
      totalItems,
      totalUnitFisik,
      totalValuasi,
      unitBaik,
      persenBaik,
      rataRataNilaiPerUnit,
    };
  }, [filteredData]);

  // 2. Data per Kategori (Valuasi & Jumlah Unit)
  const dataPerKategori = useMemo(() => {
    const map = new Map<string, { kategori: string; totalNilai: number; totalUnit: number; totalItem: number }>();

    filteredData.forEach((item) => {
      const subtotal = (Number(item.nilaiAset) || 0) * (Number(item.kuantitas) || 0);
      const prev = map.get(item.kategori) || {
        kategori: item.kategori,
        totalNilai: 0,
        totalUnit: 0,
        totalItem: 0,
      };
      prev.totalNilai += subtotal;
      prev.totalUnit += Number(item.kuantitas) || 0;
      prev.totalItem += 1;
      map.set(item.kategori, prev);
    });

    return Array.from(map.values()).sort((a, b) => b.totalNilai - a.totalNilai);
  }, [filteredData]);

  // 3. Data Kondisi Fisik
  const dataKondisi = useMemo(() => {
    const map: Record<string, { count: number; unit: number; nilai: number }> = {
      Baik: { count: 0, unit: 0, nilai: 0 },
      'Rusak Ringan': { count: 0, unit: 0, nilai: 0 },
      'Rusak Berat': { count: 0, unit: 0, nilai: 0 },
    };

    filteredData.forEach((item) => {
      const cond = item.kondisi || 'Baik';
      if (!map[cond]) {
        map[cond] = { count: 0, unit: 0, nilai: 0 };
      }
      const subtotal = (Number(item.nilaiAset) || 0) * (Number(item.kuantitas) || 0);
      map[cond].count += 1;
      map[cond].unit += Number(item.kuantitas) || 0;
      map[cond].nilai += subtotal;
    });

    return Object.keys(map).map((k) => ({
      name: k,
      unit: map[k].unit,
      count: map[k].count,
      nilai: map[k].nilai,
      color: KONDISI_COLORS[k] || '#94a3b8',
    }));
  }, [filteredData]);

  // 4. Data Lokasi Penyimpanan
  const dataPerLokasi = useMemo(() => {
    const map = new Map<string, { lokasi: string; totalNilai: number; totalUnit: number; totalItem: number }>();

    filteredData.forEach((item) => {
      const loc = item.lokasiPenyimpanan?.trim() || 'Lainnya';
      const subtotal = (Number(item.nilaiAset) || 0) * (Number(item.kuantitas) || 0);
      const prev = map.get(loc) || {
        lokasi: loc,
        totalNilai: 0,
        totalUnit: 0,
        totalItem: 0,
      };
      prev.totalNilai += subtotal;
      prev.totalUnit += Number(item.kuantitas) || 0;
      prev.totalItem += 1;
      map.set(loc, prev);
    });

    return Array.from(map.values())
      .sort((a, b) => b.totalNilai - a.totalNilai)
      .slice(0, 8); // Top 8 locations
  }, [filteredData]);

  // 5. Top 5 Aset Valuasi Tertinggi
  const topAsetValuasi = useMemo(() => {
    return [...filteredData]
      .map((item) => ({
        ...item,
        subtotal: (Number(item.nilaiAset) || 0) * (Number(item.kuantitas) || 0),
      }))
      .sort((a, b) => b.subtotal - a.subtotal)
      .slice(0, 5);
  }, [filteredData]);

  // List of all unique categories for filters
  const categoriesList = useMemo(() => {
    const set = new Set<string>();
    inventarisList.forEach((i) => i.kategori && set.add(i.kategori));
    return Array.from(set);
  }, [inventarisList]);

  return (
    <div className="space-y-6">
      {/* Visual Analytics Controls & Filter Bar */}
      <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800 shadow-lg flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-tr from-amber-500 to-indigo-600 text-white shadow-md shadow-amber-500/20">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <span>Dasbor Grafik &amp; Analisis Valuasi Aset Gereja</span>
              <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] px-2 py-0.5 rounded-full font-mono">
                {filteredData.length} Item
              </span>
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Visualisasi distribusi kategori, komposisi kondisi fisik, dan nilai buku aset sarana prasarana.
            </p>
          </div>
        </div>

        {/* View Mode & Filter Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Filter Kategori */}
          <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1.5 rounded-xl border border-slate-800 text-xs">
            <Filter className="w-3.5 h-3.5 text-amber-400" />
            <select
              value={selectedKategoriFilter}
              onChange={(e) => {
                setSelectedKategoriFilter(e.target.value);
                if (onFilterKategori) onFilterKategori(e.target.value === 'semua' ? '' : e.target.value);
              }}
              className="bg-transparent text-slate-200 text-xs focus:outline-none cursor-pointer"
            >
              <option value="semua" className="bg-slate-900">Semua Kategori</option>
              {categoriesList.map((cat) => (
                <option key={cat} value={cat} className="bg-slate-900">
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Filter Kondisi */}
          <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1.5 rounded-xl border border-slate-800 text-xs">
            <select
              value={selectedKondisiFilter}
              onChange={(e) => setSelectedKondisiFilter(e.target.value)}
              className="bg-transparent text-slate-200 text-xs focus:outline-none cursor-pointer"
            >
              <option value="semua" className="bg-slate-900">Semua Kondisi Fisik</option>
              <option value="Baik" className="bg-slate-900">Kondisi Baik</option>
              <option value="Rusak Ringan" className="bg-slate-900">Rusak Ringan</option>
              <option value="Rusak Berat" className="bg-slate-900">Rusak Berat</option>
            </select>
          </div>

          {/* View Tab Buttons */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setChartViewMode('all')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                chartViewMode === 'all'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Semua Grafik
            </button>
            <button
              onClick={() => setChartViewMode('kategori')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                chartViewMode === 'kategori'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Valuasi Kategori
            </button>
            <button
              onClick={() => setChartViewMode('kondisi')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                chartViewMode === 'kondisi'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Kondisi Fisik
            </button>
            <button
              onClick={() => setChartViewMode('lokasi')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                chartViewMode === 'lokasi'
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Per Lokasi
            </button>
          </div>
        </div>
      </div>

      {/* Summary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
        {/* Card 1: Total Valuasi */}
        <div className="bg-slate-900/80 p-4 rounded-2xl border border-amber-500/30 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 font-medium">Total Valuasi Nilai Aset:</span>
            <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-black text-amber-300 mt-2 font-mono">
            Rp {metrics.totalValuasi.toLocaleString('id-ID')}
          </div>
          <p className="text-[10px] text-slate-400 mt-1">
            Akumulasi nilai perolehan dari {metrics.totalItems} macam aset
          </p>
        </div>

        {/* Card 2: Total Unit Fisik */}
        <div className="bg-slate-900/80 p-4 rounded-2xl border border-indigo-500/30 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 font-medium">Total Unit Fisik Barang:</span>
            <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-black text-indigo-300 mt-2 font-mono">
            {metrics.totalUnitFisik.toLocaleString('id-ID')} <span className="text-xs font-semibold text-slate-400">Unit</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1">
            {metrics.totalItems} jenis sarana prasarana terdaftar
          </p>
        </div>

        {/* Card 3: Persentase Kondisi Baik */}
        <div className="bg-slate-900/80 p-4 rounded-2xl border border-emerald-500/30 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 font-medium">Kondisi Layak &amp; Baik:</span>
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-black text-emerald-300 mt-2 font-mono">
            {metrics.persenBaik}% <span className="text-xs font-semibold text-slate-400">({metrics.unitBaik} Unit)</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1">
            Persentase aset dalam kondisi siap operasional
          </p>
        </div>

        {/* Card 4: Rata-rata Nilai per Unit */}
        <div className="bg-slate-900/80 p-4 rounded-2xl border border-cyan-500/30 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 font-medium">Rata-rata Nilai / Unit:</span>
            <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-black text-cyan-300 mt-2 font-mono">
            Rp {metrics.rataRataNilaiPerUnit.toLocaleString('id-ID')}
          </div>
          <p className="text-[10px] text-slate-400 mt-1">
            Estimasi nilai aset per satuan unit fisik
          </p>
        </div>
      </div>

      {/* CHARTS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* CHART 1: Valuasi Nilai Aset per Kategori (Bar Chart) */}
        {(chartViewMode === 'all' || chartViewMode === 'kategori') && (
          <div className="bg-slate-900/80 p-4 sm:p-5 rounded-2xl border border-slate-800 shadow-lg flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  <BarChart3 className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-100 text-xs sm:text-sm">
                    Valuasi Nilai Aset per Kategori (Rp)
                  </h4>
                  <p className="text-[10px] text-slate-400">Total nilai perolehan inventaris berdasarkan rumpun aset</p>
                </div>
              </div>
            </div>

            <div className="h-64 sm:h-72 w-full">
              {dataPerKategori.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={dataPerKategori}
                    margin={{ top: 10, right: 10, left: 0, bottom: 25 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} />
                    <XAxis
                      dataKey="kategori"
                      stroke="#94a3b8"
                      fontSize={10}
                      tickLine={false}
                      angle={-15}
                      textAnchor="end"
                      interval={0}
                      height={40}
                    />
                    <YAxis
                      stroke="#94a3b8"
                      fontSize={10}
                      tickLine={false}
                      tickFormatter={formatRupiahShort}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl shadow-2xl text-xs space-y-1">
                              <p className="font-bold text-amber-400">{data.kategori}</p>
                              <p className="text-slate-200">
                                Total Valuasi: <span className="font-bold text-emerald-400">Rp {data.totalNilai.toLocaleString('id-ID')}</span>
                              </p>
                              <p className="text-slate-400 text-[11px]">
                                Jumlah: {data.totalUnit} Unit ({data.totalItem} macam barang)
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="totalNilai" radius={[6, 6, 0, 0]}>
                      {dataPerKategori.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={CATEGORY_COLORS[entry.kategori] || DEFAULT_COLORS[index % DEFAULT_COLORS.length]}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-500 text-xs italic">
                  Tidak ada data untuk ditampilkan.
                </div>
              )}
            </div>

            {/* Category breakdown mini pills */}
            <div className="mt-3 pt-3 border-t border-slate-800/80 flex flex-wrap gap-2">
              {dataPerKategori.map((item, idx) => (
                <div
                  key={idx}
                  className="bg-slate-950/80 px-2.5 py-1 rounded-lg border border-slate-800 text-[11px] flex items-center gap-1.5"
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: CATEGORY_COLORS[item.kategori] || DEFAULT_COLORS[idx % DEFAULT_COLORS.length] }}
                  ></span>
                  <span className="text-slate-300 font-medium">{item.kategori}:</span>
                  <span className="font-bold font-mono text-amber-300">{formatRupiahShort(item.totalNilai)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CHART 2: Proporsi Jumlah Unit per Kategori (Donut Chart) */}
        {(chartViewMode === 'all' || chartViewMode === 'kategori') && (
          <div className="bg-slate-900/80 p-4 sm:p-5 rounded-2xl border border-slate-800 shadow-lg flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <PieChartIcon className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-100 text-xs sm:text-sm">
                    Distribusi Kuantitas Unit per Kategori
                  </h4>
                  <p className="text-[10px] text-slate-400">Proporsi persentase dan volume fisik sarana prasarana</p>
                </div>
              </div>
            </div>

            <div className="h-64 sm:h-72 w-full flex items-center justify-center">
              {dataPerKategori.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={dataPerKategori}
                      dataKey="totalUnit"
                      nameKey="kategori"
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={3}
                    >
                      {dataPerKategori.map((entry, index) => (
                        <Cell
                          key={`pie-${index}`}
                          fill={CATEGORY_COLORS[entry.kategori] || DEFAULT_COLORS[index % DEFAULT_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          const percent =
                            metrics.totalUnitFisik > 0
                              ? ((data.totalUnit / metrics.totalUnitFisik) * 100).toFixed(1)
                              : 0;
                          return (
                            <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl shadow-2xl text-xs space-y-1">
                              <p className="font-bold text-slate-100">{data.kategori}</p>
                              <p className="text-indigo-300 font-bold">
                                {data.totalUnit} Unit ({percent}%)
                              </p>
                              <p className="text-slate-400 text-[11px]">
                                Valuasi: Rp {data.totalNilai.toLocaleString('id-ID')}
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Legend
                      formatter={(val) => <span className="text-[11px] text-slate-300">{val}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-slate-500 text-xs italic">Tidak ada data untuk ditampilkan.</div>
              )}
            </div>

            <div className="mt-3 pt-3 border-t border-slate-800/80 text-center">
              <p className="text-[11px] text-slate-400">
                Total Akumulasi Fisik: <strong className="text-indigo-300 font-mono">{metrics.totalUnitFisik} Unit</strong>
              </p>
            </div>
          </div>
        )}

        {/* CHART 3: Komposisi Kondisi Fisik Aset (Donut & Status Bar) */}
        {(chartViewMode === 'all' || chartViewMode === 'kondisi') && (
          <div className="bg-slate-900/80 p-4 sm:p-5 rounded-2xl border border-slate-800 shadow-lg flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-100 text-xs sm:text-sm">
                    Status &amp; Kondisi Fisik Inventaris
                  </h4>
                  <p className="text-[10px] text-slate-400">Tingkat kelayakan operasional sarana dan prasarana gereja</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={dataKondisi}
                      dataKey="unit"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={75}
                      paddingAngle={4}
                    >
                      {dataKondisi.map((entry, index) => (
                        <Cell key={`kondisi-cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          const percent =
                            metrics.totalUnitFisik > 0
                              ? ((data.unit / metrics.totalUnitFisik) * 100).toFixed(1)
                              : 0;
                          return (
                            <div className="bg-slate-950 border border-slate-800 p-2.5 rounded-xl shadow-xl text-xs">
                              <p className="font-bold" style={{ color: data.color }}>
                                Kondisi: {data.name}
                              </p>
                              <p className="text-slate-200">
                                {data.unit} Unit ({percent}%)
                              </p>
                              <p className="text-slate-400 text-[10px]">
                                Valuasi: Rp {data.nilai.toLocaleString('id-ID')}
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Detail Breakdown Cards */}
              <div className="space-y-2.5 text-xs">
                {dataKondisi.map((k, idx) => {
                  const percent =
                    metrics.totalUnitFisik > 0 ? ((k.unit / metrics.totalUnitFisik) * 100).toFixed(1) : '0';
                  return (
                    <div
                      key={idx}
                      className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-3 h-3 rounded-full shrink-0"
                            style={{ backgroundColor: k.color }}
                          ></span>
                          <span className="font-bold text-slate-200">{k.name}</span>
                        </div>
                        <span className="font-mono font-bold text-slate-100">
                          {k.unit} Unit ({percent}%)
                        </span>
                      </div>
                      {/* Progress Bar */}
                      <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-300"
                          style={{ width: `${percent}%`, backgroundColor: k.color }}
                        ></div>
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-slate-400">
                        <span>{k.count} Jenis Barang</span>
                        <span className="font-mono">{formatRupiahShort(k.nilai)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* CHART 4: Distribusi Valuasi per Lokasi Penyimpanan (Bar Chart) */}
        {(chartViewMode === 'all' || chartViewMode === 'lokasi') && (
          <div className="bg-slate-900/80 p-4 sm:p-5 rounded-2xl border border-slate-800 shadow-lg flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-100 text-xs sm:text-sm">
                    Distribusi Valuasi Berdasarkan Lokasi Penyimpanan
                  </h4>
                  <p className="text-[10px] text-slate-400">Sebaran aset pada gedung, pastori, dan ruangan gereja</p>
                </div>
              </div>
            </div>

            <div className="h-64 sm:h-72 w-full">
              {dataPerLokasi.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={dataPerLokasi}
                    layout="vertical"
                    margin={{ top: 5, right: 20, left: 40, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} />
                    <XAxis
                      type="number"
                      stroke="#94a3b8"
                      fontSize={10}
                      tickLine={false}
                      tickFormatter={formatRupiahShort}
                    />
                    <YAxis
                      dataKey="lokasi"
                      type="category"
                      stroke="#94a3b8"
                      fontSize={10}
                      tickLine={false}
                      width={100}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl shadow-2xl text-xs space-y-1">
                              <p className="font-bold text-cyan-400">{data.lokasi}</p>
                              <p className="text-slate-200">
                                Valuasi: <span className="font-bold text-emerald-400">Rp {data.totalNilai.toLocaleString('id-ID')}</span>
                              </p>
                              <p className="text-slate-400 text-[11px]">
                                Jumlah Unit: {data.totalUnit} Unit ({data.totalItem} Item)
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="totalNilai" fill="#06b6d4" radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-500 text-xs italic">
                  Tidak ada data lokasi.
                </div>
              )}
            </div>

            <div className="mt-3 pt-3 border-t border-slate-800/80 text-[11px] text-slate-400 flex items-center justify-between">
              <span>Menampilkan {dataPerLokasi.length} lokasi utama</span>
              <span className="text-cyan-300 font-semibold">Tersimpan di berbagai gedung &amp; ruangan</span>
            </div>
          </div>
        )}
      </div>

      {/* TOP 5 HIGH-VALUE ASSETS TABLE CARD */}
      <div className="bg-slate-900/80 rounded-2xl border border-slate-800 shadow-lg overflow-hidden text-xs">
        <div className="bg-slate-950/80 px-5 py-3.5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-400" />
            <h4 className="font-bold text-slate-100 text-xs sm:text-sm">
              Top 5 Aset Gereja dengan Valuasi Tertinggi
            </h4>
          </div>
          <span className="text-[11px] text-amber-400 font-mono font-bold">
            Prioritas Pemeliharaan &amp; Audit
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-950/50 text-slate-400 border-b border-slate-800 text-[11px] font-semibold uppercase">
                <th className="p-3.5 w-12 text-center">Peringkat</th>
                <th className="p-3.5">Kode &amp; Nama Aset</th>
                <th className="p-3.5">Kategori</th>
                <th className="p-3.5">Lokasi &amp; Penanggung Jawab</th>
                <th className="p-3.5 text-center">Kondisi</th>
                <th className="p-3.5 text-center">Kuantitas</th>
                <th className="p-3.5 text-right">Nilai Satuan (Rp)</th>
                <th className="p-3.5 text-right">Total Subtotal (Rp)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {topAsetValuasi.map((aset, idx) => (
                <tr key={aset.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="p-3.5 text-center font-bold">
                    <span
                      className={`w-6 h-6 rounded-full inline-flex items-center justify-center font-mono text-xs ${
                        idx === 0
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-black'
                          : idx === 1
                          ? 'bg-slate-700/60 text-slate-200 border border-slate-600'
                          : idx === 2
                          ? 'bg-amber-800/30 text-amber-400 border border-amber-700/50'
                          : 'bg-slate-800/40 text-slate-400'
                      }`}
                    >
                      {idx + 1}
                    </span>
                  </td>
                  <td className="p-3.5">
                    <div className="font-bold text-slate-100">{aset.namaBarang}</div>
                    <div className="font-mono text-[10px] text-amber-400/90">{aset.kodeAset}</div>
                  </td>
                  <td className="p-3.5">
                    <span className="bg-slate-950 text-indigo-300 px-2 py-0.5 rounded border border-slate-800 text-[11px]">
                      {aset.kategori}
                    </span>
                  </td>
                  <td className="p-3.5">
                    <div className="text-slate-200">{aset.lokasiPenyimpanan}</div>
                    <div className="text-[10px] text-slate-500">PJ: {aset.penanggungJawab}</div>
                  </td>
                  <td className="p-3.5 text-center">
                    <span
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${
                        aset.kondisi === 'Baik'
                          ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                          : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                      }`}
                    >
                      {aset.kondisi}
                    </span>
                  </td>
                  <td className="p-3.5 text-center font-bold text-slate-200">
                    {aset.kuantitas} {aset.satuan}
                  </td>
                  <td className="p-3.5 text-right font-mono text-slate-300">
                    Rp {aset.nilaiAset.toLocaleString('id-ID')}
                  </td>
                  <td className="p-3.5 text-right font-mono font-black text-amber-300">
                    Rp {aset.subtotal.toLocaleString('id-ID')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
