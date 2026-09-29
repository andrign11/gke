import React, { useState, useEffect } from 'react';
import { Calendar, FileText, Printer, X, Share2, Smartphone, FileSpreadsheet, Users, Building2, Briefcase, Newspaper, Vote, ShieldCheck, CheckCircle2, AlertCircle, HeartCrack, LayoutTemplate } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ReportType } from '../types';
import { KopSurat } from './KopSurat';
import { SignatureBlock } from './SignatureBlock';
import { BukuPanduanReport } from './BukuPanduanReport';
import { generateUsername } from '../utils/credentialUtils';
import { getQrisImageSource } from '../utils/qrisUtils';
import { findPerikopForReference } from '../utils/perikopData';
import defaultGkeLogo from '../assets/images/gke_logo_official_1785341836111.jpg';

const formatIndonesianDate = (dateStr?: string) => {
  if (!dateStr) return 'Awal';
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

const formatMajelisJemaatText = (namaJemaat?: string): string => {
  if (!namaJemaat) return 'MAJELIS JEMAAT GKE';
  const str = namaJemaat.trim();
  const upper = str.toUpperCase();
  if (upper.startsWith('MAJELIS JEMAAT GKE')) return upper;
  if (upper.startsWith('MAJELIS JEMAAT')) return `MAJELIS JEMAAT GKE ${upper.substring(14).trim()}`;
  if (upper.startsWith('MAJELIS')) return `MAJELIS JEMAAT GKE ${upper.substring(7).trim()}`;
  if (upper.startsWith('JEMAAT GKE')) return `MAJELIS ${upper}`;
  if (upper.startsWith('GKE')) return `MAJELIS JEMAAT ${upper}`;
  return `MAJELIS JEMAAT GKE ${upper}`;
};

const formatResortGkeText = (resort?: string): string => {
  if (!resort) return 'RESORT GKE';
  const str = resort.trim();
  const upper = str.toUpperCase();
  if (upper.startsWith('RESORT GKE')) return upper;
  if (upper.startsWith('RESORT')) return `RESORT GKE ${upper.substring(6).trim()}`;
  return `RESORT GKE ${upper}`;
};

export const PrintModal: React.FC = () => {
  const {
    printConfig,
    closePrintReport,
    penatuaDiakonList,
    keuanganList,
    iuranKewajibanList = [],
    wargaJemaatList,
    jadwalIbadahList,
    mphList,
    inventarisList,
    renunganList,
    pendaftaranList,
    rancanganKhotbahList,
    agendaSuratList,
    beritaJemaatList,
    jadwalKatekisasiList,
    pelayananSakramenList,
    lingkunganList = [],
    pengurusKategorialList = [],
    kegiatanKategorialList = [],
    pengurusPembangunanList = [],
    proyekPembangunanList = [],
    almanakNastList = [],
    auditLogs = [],
    sesiPemilihanList = [],
    kandidatPemilihanList = [],
    suaraVotingList = [],
    nominasiAspirasiList = [],
    pelayananTaskList = [],
    pemeliharaanAsetList = [],
    settings,
    currentUser,
    viewMode,
  } = useApp();

  const pembangunanKeuanganList = React.useMemo(() => {
    return keuanganList.filter((k) => {
      if (k.status === 'ditolak') return false;
      const pos = (k.posAnggaran || '').toUpperCase();
      const ket = (k.keterangan || '').toUpperCase();
      const pk = (k.posKas || '').toUpperCase();
      const kat = (k.kategori || '').toUpperCase();
      const tipe = (k.tipe || '').toUpperCase();
      const kasSumber = (k.kasSumber || '').toUpperCase();
      return (
        pk.includes('PEMBANGUNAN') ||
        pos.includes('PEMBANGUNAN') ||
        ket.includes('PEMBANGUNAN') ||
        kat.includes('PEMBANGUNAN') ||
        tipe.includes('PEMBANGUNAN') ||
        kasSumber.includes('PEMBANGUNAN') ||
        pos.includes('RENOVASI') ||
        ket.includes('RENOVASI') ||
        kat.includes('RENOVASI') ||
        pos.includes('KANOPI') ||
        ket.includes('KANOPI') ||
        pos.includes('DONATUR') ||
        ket.includes('DONATUR') ||
        pos.includes('JANJI IMAN') ||
        ket.includes('JANJI IMAN') ||
        kat.includes('JANJI IMAN') ||
        kat.includes('BAHAN BANGUNAN') ||
        kat.includes('UPAH TUKANG') ||
        kat.includes('KUPON PEMBANGUNAN') ||
        kat.includes('IURAN PEMBANGUNAN') ||
        pk.includes('KUPON') ||
        pk.includes('IURAN PEMBANGUNAN')
      );
    });
  }, [keuanganList]);

  const [localStartDate, setLocalStartDate] = useState<string>('');
  const [localEndDate, setLocalEndDate] = useState<string>('');
  const [localTahun, setLocalTahun] = useState<string>('');
  const [localSelectedSeksi, setLocalSelectedSeksi] = useState<string>('ALL');
  const [localPembangunanSection, setLocalPembangunanSection] = useState<'all' | 'panitia' | 'proyek' | 'kas'>('all');
  const [localCustomSaldoAwal, setLocalCustomSaldoAwal] = useState<number | undefined>(undefined);
  const [localBeritaJemaatId, setLocalBeritaJemaatId] = useState<string>('');
  const [localPeriodeMPH, setLocalPeriodeMPH] = useState<string>('2024 - 2029');
  const [localSesiId, setLocalSesiId] = useState<string>('');
  const [localSakramenId, setLocalSakramenId] = useState<string>('');
  const [localTaskCategory, setLocalTaskCategory] = useState<string>('ALL');
  const [localTaskStatus, setLocalTaskStatus] = useState<string>('ALL');
  const [localTaskPriority, setLocalTaskPriority] = useState<string>('ALL');
  const [localTaskId, setLocalTaskId] = useState<string>('');
  const [localAlkitabVerses, setLocalAlkitabVerses] = useState<{ ayat: number; firman: string }[]>([]);
  const [localAlkitabBookName, setLocalAlkitabBookName] = useState<string>('');
  const [localAlkitabPerikop, setLocalAlkitabPerikop] = useState<string>('');
  const [localWargaId, setLocalWargaId] = useState<string>('');
  const [localReportType, setLocalReportType] = useState<ReportType | null>(null);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [paperOrientation, setPaperOrientation] = useState<'portrait' | 'landscape'>('landscape');
  const reportRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (printConfig) {
      setLocalReportType(null);
      // Default to landscape for Kartu Keluarga, tables, financial reports, rosters, and panitia
      const isNarrowCertificate = [
        'surat_baptis',
        'surat_sidi',
        'surat_nikah',
        'surat_keterangan_kematian',
        'surat_duka_cita',
        'surat_atestasi_masuk',
        'surat_atestasi_keluar',
        'surat_pelimpahan_nikah',
      ].includes(printConfig.reportType);
      setPaperOrientation(isNarrowCertificate ? 'portrait' : 'landscape');
      setLocalStartDate(printConfig.startDate || '');
      setLocalEndDate(printConfig.endDate || '');
      setLocalTahun(printConfig.tahun || new Date().getFullYear().toString());
      setLocalSelectedSeksi(printConfig.selectedSeksi || 'ALL');
      setLocalPembangunanSection((printConfig.filterJenis as any) || 'all');
      setLocalWargaId(printConfig.wargaId || '');
      setLocalBeritaJemaatId(
        printConfig.beritaJemaatId || (beritaJemaatList && beritaJemaatList.length > 0 ? beritaJemaatList[0].id : '')
      );
      setLocalPeriodeMPH(
        printConfig.filterJenis ||
        printConfig.customTitle ||
        settings.periodePelayananMPH ||
        (mphList && mphList.length > 0 ? mphList[0].periode : '2024 - 2029')
      );
      setLocalSesiId(
        printConfig.sesiId ||
        (sesiPemilihanList && sesiPemilihanList.length > 0 ? sesiPemilihanList[0].id : '')
      );

      // Determine matching item for sakramen
      const targetJenis =
        printConfig.reportType === 'pelayanan_baptis'
          ? 'baptis'
          : printConfig.reportType === 'pelayanan_sidi'
          ? 'sidi'
          : printConfig.reportType === 'pelayanan_nikah' || printConfig.reportType === 'surat_pelimpahan_nikah'
          ? 'nikah'
          : null;

      const filteredSakramenList = targetJenis
        ? (pelayananSakramenList || []).filter((s) => s.jenisPelayanan === targetJenis)
        : (pelayananSakramenList || []);

      const matchedSakramen =
        (printConfig.sakramenId ? pelayananSakramenList.find((s) => s.id === printConfig.sakramenId) : null) ||
        filteredSakramenList[0] ||
        pelayananSakramenList[0];

      setLocalSakramenId(
        printConfig.sakramenId ||
        (matchedSakramen ? matchedSakramen.id : '')
      );
      setLocalTaskCategory(printConfig.selectedKategori || 'ALL');
      setLocalTaskStatus(printConfig.selectedStatus || 'ALL');
      setLocalTaskPriority(printConfig.selectedPriority || 'ALL');
      setLocalTaskId(printConfig.taskId || printConfig.selectedId || '');

      const pos = printConfig.posKas;
      let defaultCustomSaldo = printConfig.customSaldoAwal;
      if (defaultCustomSaldo === undefined) {
        if (!pos || pos === 'semua' || pos === 'Kas Umum') defaultCustomSaldo = settings.saldoAwalCustomKasUmum || 0;
        else if (pos === 'Kas Pembangunan') defaultCustomSaldo = settings.saldoAwalCustomKasPembangunan || 0;
        else if (pos === 'Kas Diakonia' || pos.includes('Diakonia')) defaultCustomSaldo = settings.saldoAwalCustomKasDiakonia || 0;
        else if (pos.includes('SPPer') || pos.includes('Perempuan')) defaultCustomSaldo = settings.saldoAwalCustomKasSpper || 0;
        else if (pos.includes('SPB') || pos.includes('Bapak')) defaultCustomSaldo = settings.saldoAwalCustomKasSpb || 0;
        else if (pos.includes('SPPR') || pos.includes('Pemuda')) defaultCustomSaldo = settings.saldoAwalCustomKasSpprp || 0;
        else if (pos.includes('SPA') || pos.includes('Sekolah Minggu')) defaultCustomSaldo = settings.saldoAwalCustomKasSpa || 0;
        else defaultCustomSaldo = 0;
      }
      setLocalCustomSaldoAwal(defaultCustomSaldo);

      if (printConfig.reportType === 'alkitab_bacaan') {
        const kitab = printConfig.alkitabKitab || 'Yoh';
        const pasal = printConfig.alkitabPasal || 1;
        fetch(`/api/alkitab/chapter?kitab=${encodeURIComponent(kitab)}&pasal=${pasal}`)
          .then((res) => res.json())
          .then((data) => {
            if (data.success && data.verses) {
              setLocalAlkitabBookName(data.book?.name || kitab);
              setLocalAlkitabPerikop(data.perikop || '');
              let vList = data.verses;
              if (printConfig.alkitabAyatStart !== undefined) {
                const end = printConfig.alkitabAyatEnd || printConfig.alkitabAyatStart;
                vList = vList.filter((v: any) => v.ayat >= printConfig.alkitabAyatStart! && v.ayat <= end);
              }
              setLocalAlkitabVerses(vList);
            }
          })
          .catch((err) => console.error('Error fetching print Alkitab:', err));
      }
    }
  }, [printConfig, settings, beritaJemaatList]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && printConfig?.isOpen) {
        closePrintReport();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [printConfig, closePrintReport]);

  if (!printConfig || !printConfig.isOpen) return null;

  // Canvas 2D singleton for ultra-fast color conversion to standard sRGB / hex / rgba
  const convertModernColorToSrgb = (colorStr: string): string => {
    if (!colorStr) return colorStr;
    const trimmed = colorStr.trim();
    if (!/(?:oklch|oklab|lab|lch|color|hwb)\s*\(/i.test(trimmed)) {
      return trimmed;
    }

    // 1. Try Canvas 2D context (modern browsers automatically parse OKLCH, OKLab, etc. to standard sRGB hex/rgba)
    try {
      if (typeof document !== 'undefined') {
        const canvas = document.createElement('canvas');
        canvas.width = 1;
        canvas.height = 1;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (ctx) {
          ctx.fillStyle = '#000000';
          ctx.fillStyle = trimmed;
          const res = ctx.fillStyle;
          if (res && !/(?:oklch|oklab|lab|lch|color|hwb)/i.test(res)) {
            return res;
          }
        }
      }
    } catch {
      // fallback to math parser below
    }

    // 2. Exact mathematical OKLab -> Linear sRGB -> sRGB formula
    try {
      if (/oklab/i.test(trimmed)) {
        const match = trimmed.match(/oklab\(\s*([\d.]+%?)\s+([\d.-]+)\s+([\d.-]+)(?:\s*\/\s*([\d.]+%?))?\s*\)/i);
        if (match) {
          const L = match[1].endsWith('%') ? parseFloat(match[1]) / 100 : parseFloat(match[1]);
          const a = parseFloat(match[2]);
          const b = parseFloat(match[3]);
          const alpha = match[4] ? (match[4].endsWith('%') ? parseFloat(match[4]) / 100 : parseFloat(match[4])) : 1;

          const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
          const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
          const s_ = L - 0.0894841775 * a - 1.2914855480 * b;

          const l = l_ * l_ * l_;
          const m = m_ * m_ * m_;
          const s = s_ * s_ * s_;

          const rLin = +4.0767439362 * l - 3.3077115913 * m + 0.2309699292 * s;
          const gLin = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
          const bLin = -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s;

          const toSrgb = (x: number) => {
            const val = x <= 0.0031308 ? 12.92 * x : 1.055 * Math.pow(Math.max(0, x), 1 / 2.4) - 0.055;
            return Math.min(255, Math.max(0, Math.round(val * 255)));
          };

          const r = toSrgb(rLin);
          const g = toSrgb(gLin);
          const bVal = toSrgb(bLin);

          if (alpha < 1) {
            return `rgba(${r}, ${g}, ${bVal}, ${alpha.toFixed(2)})`;
          }
          return `rgb(${r}, ${g}, ${bVal})`;
        }
      }
    } catch {
      // fallback
    }

    // 3. Exact mathematical OKLCH -> OKLab -> Linear sRGB -> sRGB formula
    try {
      if (/oklch/i.test(trimmed)) {
        const match = trimmed.match(/oklch\(\s*([\d.]+%?)\s+([\d.]+)\s+([\d.-]+(?:deg)?)(?:\s*\/\s*([\d.]+%?))?\s*\)/i);
        if (match) {
          const L = match[1].endsWith('%') ? parseFloat(match[1]) / 100 : parseFloat(match[1]);
          const C = parseFloat(match[2]);
          const H = parseFloat(match[3].replace('deg', ''));
          const alpha = match[4] ? (match[4].endsWith('%') ? parseFloat(match[4]) / 100 : parseFloat(match[4])) : 1;

          const hRad = (H * Math.PI) / 180;
          const a = C * Math.cos(hRad);
          const b = C * Math.sin(hRad);

          const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
          const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
          const s_ = L - 0.0894841775 * a - 1.2914855480 * b;

          const l = l_ * l_ * l_;
          const m = m_ * m_ * m_;
          const s = s_ * s_ * s_;

          const rLin = +4.0767439362 * l - 3.3077115913 * m + 0.2309699292 * s;
          const gLin = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
          const bLin = -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s;

          const toSrgb = (x: number) => {
            const val = x <= 0.0031308 ? 12.92 * x : 1.055 * Math.pow(Math.max(0, x), 1 / 2.4) - 0.055;
            return Math.min(255, Math.max(0, Math.round(val * 255)));
          };

          const r = toSrgb(rLin);
          const g = toSrgb(gLin);
          const bVal = toSrgb(bLin);

          if (alpha < 1) {
            return `rgba(${r}, ${g}, ${bVal}, ${alpha.toFixed(2)})`;
          }
          return `rgb(${r}, ${g}, ${bVal})`;
        }
      }
    } catch {
      // fallback
    }

    return '#334155';
  };

  const modernColorCache = new Map<string, string>();

  const sanitizeModernCssColors = (cssText: string): string => {
    if (!cssText) return '';
    if (!/(?:oklch|oklab|lab|lch|color|hwb)\s*\(/i.test(cssText)) {
      return cssText;
    }

    return cssText
      .replace(/oklch\([^)]+\)/gi, (match) => {
        if (modernColorCache.has(match)) return modernColorCache.get(match)!;
        const converted = convertModernColorToSrgb(match);
        modernColorCache.set(match, converted);
        return converted;
      })
      .replace(/oklab\([^)]+\)/gi, (match) => {
        if (modernColorCache.has(match)) return modernColorCache.get(match)!;
        const converted = convertModernColorToSrgb(match);
        modernColorCache.set(match, converted);
        return converted;
      })
      .replace(/\blab\([^)]+\)/gi, (match) => {
        if (modernColorCache.has(match)) return modernColorCache.get(match)!;
        const converted = convertModernColorToSrgb(match);
        modernColorCache.set(match, converted);
        return converted;
      })
      .replace(/\blch\([^)]+\)/gi, (match) => {
        if (modernColorCache.has(match)) return modernColorCache.get(match)!;
        const converted = convertModernColorToSrgb(match);
        modernColorCache.set(match, converted);
        return converted;
      })
      .replace(/\bcolor\([^)]+\)/gi, (match) => {
        if (modernColorCache.has(match)) return modernColorCache.get(match)!;
        const converted = convertModernColorToSrgb(match);
        modernColorCache.set(match, converted);
        return converted;
      })
      .replace(/\bhwb\([^)]+\)/gi, (match) => {
        if (modernColorCache.has(match)) return modernColorCache.get(match)!;
        const converted = convertModernColorToSrgb(match);
        modernColorCache.set(match, converted);
        return converted;
      });
  };

  const generateStandaloneHtml = (): string => {
    if (!reportRef.current) return '';

    let cssText = '';
    document.querySelectorAll('style, link[rel="stylesheet"]').forEach((node) => {
      if (node.tagName.toLowerCase() === 'style') {
        cssText += '\n' + sanitizeModernCssColors(node.textContent || '');
      } else if (node.tagName.toLowerCase() === 'link') {
        cssText += `\n@import url("${(node as HTMLLinkElement).href}");`;
      }
    });

    const bodyHtml = reportRef.current.innerHTML;

    return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Laporan Cetak Resmi GKE - Majelis Jemaat</title>
  <style>
    ${cssText}

    @page { 
      size: ${paperOrientation === 'landscape' ? 'A4 landscape' : 'A4 portrait'}; 
      margin: ${paperOrientation === 'landscape' ? '8mm 10mm 8mm 10mm' : '10mm 12mm 10mm 12mm'}; 
    }
    *, *::before, *::after { box-sizing: border-box; }
    
    html {
      width: 100% !important;
      height: auto !important;
      min-height: 100% !important;
      max-height: none !important;
      overflow-x: auto !important;
      overflow-y: auto !important;
      overflow: auto !important;
      background-color: #0f172a !important;
    }

    body {
      width: 100% !important;
      height: auto !important;
      min-height: 100vh !important;
      max-height: none !important;
      overflow-x: auto !important;
      overflow-y: auto !important;
      overflow: auto !important;
      position: static !important;
      background-color: #0f172a !important;
      color: #0f172a !important;
      margin: 0 !important;
      padding: 0 !important;
      font-family: ui-serif, Georgia, Cambria, "Times New Roman", Times, serif;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    .print-standalone-wrapper {
      background-color: #0f172a;
      min-height: 100vh;
      width: 100%;
      padding-bottom: 40px;
    }

    .print-standalone-container {
      padding: ${paperOrientation === 'landscape' ? '20px 32px' : '24px'};
      max-width: ${paperOrientation === 'landscape' ? '1200px' : '960px'};
      margin: 20px auto;
      background-color: #ffffff !important;
      color: #0f172a !important;
      border-radius: 12px;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3);
      overflow: visible !important;
      height: auto !important;
      max-height: none !important;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 1rem;
      page-break-inside: auto;
      background-color: #ffffff !important;
    }
    thead {
      display: table-header-group;
    }
    tfoot {
      display: table-footer-group;
    }
    tr {
      page-break-inside: avoid;
      break-inside: avoid;
    }
    th, td {
      border: 1px solid #64748b;
      padding: 6px 8px;
      font-size: 11px;
      text-align: left;
      color: #0f172a !important;
      page-break-inside: avoid;
      break-inside: avoid;
    }
    th {
      background-color: #e2e8f0 !important;
      color: #0f172a !important;
      font-weight: bold;
    }
    td {
      background-color: #ffffff !important;
      color: #0f172a !important;
    }
    tr:hover td {
      background-color: #ffffff !important;
      color: #0f172a !important;
    }

    .no-print-toolbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 12px 20px;
      background: #090d16;
      color: white;
      position: sticky;
      top: 0;
      z-index: 99999;
      border-bottom: 1px solid #1e293b;
      box-shadow: 0 4px 12px rgba(0,0,0,0.4);
      font-family: ui-sans-serif, system-ui, -apple-system, sans-serif;
    }

    .no-print-toolbar button {
      background: #2563eb;
      color: white;
      border: none;
      padding: 8px 18px;
      border-radius: 8px;
      font-weight: bold;
      font-size: 13px;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      transition: all 0.2s;
    }

    .no-print-toolbar button:hover {
      background: #1d4ed8;
      transform: translateY(-1px);
    }

    @media print {
      @page {
        size: ${paperOrientation === 'landscape' ? 'A4 landscape' : 'A4 portrait'};
        margin: ${paperOrientation === 'landscape' ? '8mm 10mm 8mm 10mm' : '10mm 12mm 10mm 12mm'};
      }
      html, body {
        background-color: #ffffff !important;
        height: auto !important;
        min-height: auto !important;
        overflow: visible !important;
        margin: 0 !important;
        padding: 0 !important;
      }
      .no-print-toolbar { display: none !important; }
      .print-standalone-wrapper { background-color: #ffffff !important; padding: 0 !important; }
      .print-standalone-container {
        padding: 0 !important;
        max-width: none !important;
        margin: 0 !important;
        box-shadow: none !important;
        border-radius: 0 !important;
        width: 100% !important;
        height: auto !important;
        overflow: visible !important;
      }
      table {
        width: 100% !important;
        border-collapse: collapse !important;
        page-break-inside: auto !important;
        background-color: #ffffff !important;
      }
      th {
        background-color: #e2e8f0 !important;
        color: #0f172a !important;
        border: 1px solid #64748b !important;
      }
      td {
        background-color: #ffffff !important;
        color: #0f172a !important;
        border: 1px solid #94a3b8 !important;
      }
      .kop-surat-red,
      .kop-surat-red *,
      .kop-surat [style*="#dc2626"],
      .kop-surat [style*="rgb(220, 38, 38)"],
      .kop-surat-container [style*="#dc2626"],
      .kop-surat-container [style*="rgb(220, 38, 38)"] {
        color: #dc2626 !important;
        -webkit-text-fill-color: #dc2626 !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      print-color-adjust: exact !important;
      -webkit-print-color-adjust: exact !important;
      tr, td, th, .signature-block, .kop-surat {
        break-inside: avoid !important;
        page-break-inside: avoid !important;
      }
    }
  </style>
</head>
<body>
  <div class="print-standalone-wrapper">
    <div class="no-print-toolbar">
      <div style="font-size: 14px; font-weight: bold; display: flex; align-items: center; gap: 8px;">
        <span>📄 Laporan Resmi GKE</span>
      </div>
      <button onclick="window.print()">
        <span>🖨️ Cetak / Print Dokumen</span>
      </button>
    </div>
    <div class="print-standalone-container">
      ${bodyHtml}
    </div>
  </div>
  <script>
    window.addEventListener('load', function() {
      setTimeout(function() {
        try {
          window.print();
        } catch(e) {}
      }, 400);
    });
  </script>
</body>
</html>`;
  };

  const handlePrint = () => {
    if (!reportRef.current) return;

    const htmlContent = generateStandaloneHtml();
    const isMobile = typeof navigator !== 'undefined' && /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const isIframe = typeof window !== 'undefined' && window.self !== window.top;

    // Mobile or embedded iframe preview: open popup print window with clean blob document
    if (isMobile || isIframe) {
      try {
        const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
        const blobUrl = URL.createObjectURL(blob);
        const printWin = window.open(blobUrl, '_blank');
        if (printWin) {
          printWin.focus();
          return;
        }
      } catch (e) {
        console.warn('Standalone print window open failed:', e);
      }
    }

    // Isolated hidden iframe print for desktop
    try {
      let iframe = document.getElementById('print-iframe-helper') as HTMLIFrameElement;
      if (iframe && iframe.parentNode) {
        iframe.parentNode.removeChild(iframe);
      }

      iframe = document.createElement('iframe');
      iframe.id = 'print-iframe-helper';
      iframe.style.position = 'fixed';
      iframe.style.left = '-9999px';
      iframe.style.top = '-9999px';
      iframe.style.width = '1px';
      iframe.style.height = '1px';
      iframe.style.opacity = '0.01';
      iframe.style.pointerEvents = 'none';
      document.body.appendChild(iframe);

      const iframeDoc = iframe.contentWindow?.document || iframe.contentDocument;
      if (iframeDoc) {
        iframeDoc.open();
        iframeDoc.write(htmlContent);
        iframeDoc.close();

        setTimeout(() => {
          try {
            if (iframe.contentWindow) {
              iframe.contentWindow.focus();
              iframe.contentWindow.print();
            } else {
              window.focus();
              window.print();
            }
          } catch {
            window.focus();
            window.print();
          }
        }, 400);
        return;
      }
    } catch (err) {
      console.warn('Iframe print failed, falling back to direct window print:', err);
    }

    // Direct window print fallback
    try {
      window.focus();
      window.print();
    } catch (err) {
      console.warn('Direct window.print() failed:', err);
    }
  };

  const saveOrShareBlob = async (blob: Blob, fileName: string, mimeType: string) => {
    const file = new File([blob], fileName, { type: mimeType });

    if (typeof navigator !== 'undefined' && navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          files: [file],
          title: fileName,
          text: 'Laporan Cetak Resmi Majelis Jemaat GKE',
        });
        return;
      } catch (shareErr: any) {
        if (shareErr?.name === 'AbortError') return;
      }
    }

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 1000);
  };

  const handleExportDoc = async () => {
    if (!reportRef.current) return;
    setIsExporting(true);
    try {
      const reportName = printConfig?.reportType || 'Laporan';
      const timestamp = new Date().toISOString().slice(0, 10);
      const fileName = `Laporan_GKE_${reportName}_${timestamp}.doc`;

      const content = reportRef.current.innerHTML;
      const docHtml = `<!DOCTYPE html>
<html xmlns:o='urn:schemas-microsoft-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head>
<meta charset='utf-8'>
<title>${fileName}</title>
<style>
  @page Section1 {
    size: ${paperOrientation === 'landscape' ? '841.9pt 595.3pt' : '595.3pt 841.9pt'};
    mso-page-orientation: ${paperOrientation};
    margin: 20pt 30pt 20pt 30pt;
  }
  div.Section1 { page: Section1; }
  body { font-family: 'Times New Roman', Times, serif; font-size: 10pt; color: #000; background: #fff; margin: 20px; }
  h1, h2, h3, h4 { text-align: center; margin: 4px 0; }
  table { width: 100%; border-collapse: collapse; margin-top: 12px; margin-bottom: 12px; }
  th, td { border: 1px solid #000; padding: 5px 7px; font-size: 9.5pt; text-align: left; }
  th { background-color: #f2f2f2; font-weight: bold; text-align: center; }
  .text-center { text-align: center; }
  .text-right { text-align: right; }
  .text-left { text-align: left; }
  .font-bold { font-weight: bold; }
  .underline { text-decoration: underline; }
  .grid { display: table; width: 100%; }
  .grid-cols-2 { display: table-row; }
  .grid-cols-2 > div { display: table-cell; width: 50%; vertical-align: top; text-align: center; }
  .h-16 { height: 60px; }
</style>
</head>
<body>
<div class="Section1">
${content}
</div>
</body>
</html>`;

      const blob = new Blob(['\ufeff', docHtml], { type: 'application/msword' });
      await saveOrShareBlob(blob, fileName, 'application/msword');
    } catch (err) {
      console.error('Export DOC error:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportHTML = async () => {
    if (!reportRef.current) return;
    setIsExporting(true);
    try {
      const reportName = printConfig?.reportType || 'Laporan';
      const timestamp = new Date().toISOString().slice(0, 10);
      const fileName = `Laporan_GKE_${reportName}_${timestamp}.html`;

      const content = reportRef.current.innerHTML;
      const fullHtml = `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${fileName}</title>
<style>
  @page { size: ${paperOrientation === 'landscape' ? 'A4 landscape' : 'A4 portrait'}; margin: 10mm; }
  body { font-family: Georgia, serif; padding: 24px; background: #fff; color: #0f172a; max-width: ${paperOrientation === 'landscape' ? '1200px' : '900px'}; margin: 0 auto; }
  table { width: 100%; border-collapse: collapse; margin: 16px 0; }
  th, td { border: 1px solid #cbd5e1; padding: 8px 10px; font-size: 13px; }
  th { background-color: #f8fafc; font-weight: bold; }
  .text-center { text-align: center; }
  .text-right { text-align: right; }
  .font-bold { font-weight: bold; }
  .underline { text-decoration: underline; }
  @media print { body { padding: 0; max-width: none; } }
</style>
</head>
<body>
${content}
</body>
</html>`;

      const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8' });
      await saveOrShareBlob(blob, fileName, 'text/html');
    } catch (err) {
      console.error('Export HTML error:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const isFinancialReport = [
    'keuangan_mingguan',
    'keuangan_bulanan',
    'keuangan_triwulan',
    'keuangan_tahanan',
    'keuangan_tahunan',
  ].includes(printConfig.reportType);

  const availableYears = Array.from(
    new Set([
      ...keuanganList.map((k) => k.tanggal.split('-')[0]),
      new Date().getFullYear().toString(),
      (new Date().getFullYear() - 1).toString(),
      (new Date().getFullYear() - 2).toString(),
    ])
  ).sort((a, b) => b.localeCompare(a));

  const activeReportType = localReportType || printConfig.reportType;

  // Render report body based on reportType
  const renderReportContent = () => {
    switch (activeReportType) {
      case 'penatua_diakon': {
        const filtered = printConfig.selectedRayon
          ? penatuaDiakonList.filter((p) => p.rayon === printConfig.selectedRayon)
          : penatuaDiakonList;

        return (
          <div>
            <KopSurat
              title="LAPORAN DATA KEPENGURUSAN PENATUA DAN DIAKON"
              subtitle={`Majelis Jemaat GKE${
                printConfig.selectedRayon ? ` (${printConfig.selectedRayon})` : ''
              }`}
            />
            <table className="w-full text-xs text-left border-collapse border border-slate-400 mb-4">
              <thead>
                <tr className="bg-slate-200 text-slate-900 border-b border-slate-400">
                  <th className="p-2 border border-slate-400 w-8 text-center">No</th>
                  <th className="p-2 border border-slate-400">Nama Lengkap & Gelar</th>
                  <th className="p-2 border border-slate-400">Jabatan</th>
                  <th className="p-2 border border-slate-400">Lingkungan / Sektor</th>
                  <th className="p-2 border border-slate-400">Tgl Penahbisan</th>
                  <th className="p-2 border border-slate-400">Masa Bakti</th>
                  <th className="p-2 border border-slate-400 text-center">Status</th>
                  <th className="p-2 border border-slate-400">No. Telp / HP</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item, idx) => (
                  <tr key={item.id} className="border-b border-slate-300">
                    <td className="p-2 border border-slate-300 text-center">{idx + 1}</td>
                    <td className="p-2 border border-slate-300 font-semibold">
                      {item.nama}, {item.gelar}
                    </td>
                    <td className="p-2 border border-slate-300 font-medium">{item.jabatan}</td>
                    <td className="p-2 border border-slate-300">{item.rayon}</td>
                    <td className="p-2 border border-slate-300">{item.tanggalPenahbisan}</td>
                    <td className="p-2 border border-slate-300">{item.masaBakti}</td>
                    <td className="p-2 border border-slate-300 text-center">{item.status}</td>
                    <td className="p-2 border border-slate-300">{item.noHp}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <SignatureBlock signers={['sekretaris', 'ketua']} />
          </div>
        );
      }

      case 'keuangan_mingguan':
      case 'keuangan_bulanan':
      case 'keuangan_triwulan':
      case 'keuangan_tahanan':
      case 'keuangan_tahunan': {
        const titleMap: Record<string, string> = {
          keuangan_mingguan: 'LAPORAN REKAPITULASI KEUANGAN KAS MINGGUAN',
          keuangan_bulanan: 'LAPORAN REKAPITULASI KEUANGAN KAS BULANAN',
          keuangan_triwulan: 'LAPORAN REKAPITULASI KEUANGAN KAS TRIWULAN (Q1 - Q4)',
          keuangan_tahanan: 'LAPORAN REKAPITULASI KEUANGAN KAS TAHUNAN',
          keuangan_tahunan: 'LAPORAN REKAPITULASI KEUANGAN KAS TAHUNAN',
        };

        const isYearly =
          printConfig.reportType === 'keuangan_tahanan' ||
          printConfig.reportType === 'keuangan_tahunan';

        let allApprovedForPos = keuanganList.filter(
          (k) => k.status !== 'pending' && k.status !== 'ditolak'
        );
        if (printConfig.posKas && printConfig.posKas !== 'semua') {
          allApprovedForPos = allApprovedForPos.filter(
            (k) => (k.posKas || 'Kas Umum') === printConfig.posKas
          );
        }

        const startDateCutoff = isYearly
          ? `${localTahun || new Date().getFullYear().toString()}-01-01`
          : localStartDate;

        // Saldo Awal Periode: Saldo awal custom + akumulasi transaksi sebelum tanggal cutoff periode
        const customBase = localCustomSaldoAwal || 0;
        let saldoAwalPeriode = customBase;
        if (startDateCutoff) {
          const priorTransactions = allApprovedForPos.filter((k) => k.tanggal < startDateCutoff);
          const priorPemasukan = priorTransactions
            .filter((k) => k.jenis === 'pemasukan')
            .reduce((acc, curr) => acc + curr.jumlah, 0);
          const priorPengeluaran = priorTransactions
            .filter((k) => k.jenis === 'pengeluaran')
            .reduce((acc, curr) => acc + curr.jumlah, 0);
          saldoAwalPeriode = customBase + (priorPemasukan - priorPengeluaran);
        }

        // Transaksi dalam periode ini
        let filtered = allApprovedForPos;
        if (isYearly) {
          const selectedYear = localTahun || new Date().getFullYear().toString();
          filtered = filtered.filter((k) => k.tanggal.startsWith(selectedYear));
        } else {
          if (localStartDate) {
            filtered = filtered.filter((k) => k.tanggal >= localStartDate);
          }
          if (localEndDate) {
            filtered = filtered.filter((k) => k.tanggal <= localEndDate);
          }
        }

        const totalPemasukan = filtered
          .filter((k) => k.jenis === 'pemasukan')
          .reduce((acc, curr) => acc + curr.jumlah, 0);

        const totalPengeluaran = filtered
          .filter((k) => k.jenis === 'pengeluaran')
          .reduce((acc, curr) => acc + curr.jumlah, 0);

        const totalPenerimaanPlusSaldoAwal = saldoAwalPeriode + totalPemasukan;
        const saldoAkhir = totalPenerimaanPlusSaldoAwal - totalPengeluaran;

        const posKasLabel = printConfig.posKas ? ` (${printConfig.posKas.toUpperCase()})` : '';
        const subtitleText = isYearly
          ? `Periode Tahun Kas${posKasLabel}: ${localTahun || new Date().getFullYear().toString()}`
          : `Pos: ${printConfig.posKas || 'Semua Pos Kas'} | Periode: ${formatIndonesianDate(localStartDate)} s/d ${formatIndonesianDate(
              localEndDate
            )}`;

        const baseTitle = printConfig.posKas
          ? `LAPORAN REKAPITULASI ${printConfig.posKas.toUpperCase()} GKE`
          : titleMap[printConfig.reportType] || 'LAPORAN REKAPITULASI KEUANGAN KAS';

        return (
          <div>
            <KopSurat
              title={printConfig.customTitle || baseTitle}
              subtitle={subtitleText}
            />

            {/* Financial Summary Cards */}
            <div className="grid grid-cols-4 gap-2 mb-4 p-3 bg-slate-50 border border-slate-300 rounded text-xs text-center font-sans">
              <div className="border-r border-slate-200 pr-2">
                <span className="text-slate-500 uppercase text-[9px] font-semibold block">Saldo Awal Periode</span>
                <p className="text-xs sm:text-sm font-bold text-amber-800 mt-0.5">
                  Rp {saldoAwalPeriode.toLocaleString('id-ID')}
                </p>
              </div>
              <div className="border-r border-slate-200 pr-2">
                <span className="text-slate-500 uppercase text-[9px] font-semibold block">Pemasukan Periode Ini</span>
                <p className="text-xs sm:text-sm font-bold text-emerald-700 mt-0.5">
                  + Rp {totalPemasukan.toLocaleString('id-ID')}
                </p>
              </div>
              <div className="border-r border-slate-200 pr-2">
                <span className="text-slate-500 uppercase text-[9px] font-semibold block">Pengeluaran Periode Ini</span>
                <p className="text-xs sm:text-sm font-bold text-rose-700 mt-0.5">
                  - Rp {totalPengeluaran.toLocaleString('id-ID')}
                </p>
              </div>
              <div>
                <span className="text-slate-500 uppercase text-[9px] font-semibold block">Saldo Kas Akhir Periode</span>
                <p
                  className={`text-xs sm:text-sm font-bold mt-0.5 ${
                    saldoAkhir >= 0 ? 'text-indigo-900' : 'text-amber-800'
                  }`}
                >
                  Rp {saldoAkhir.toLocaleString('id-ID')}
                </p>
              </div>
            </div>

            <table className="w-full text-xs text-left border-collapse border border-slate-400 mb-4">
              <thead>
                <tr className="bg-slate-200 text-slate-900 border-b border-slate-400 font-bold">
                  <th className="p-2 border border-slate-400 w-8 text-center">No</th>
                  <th className="p-2 border border-slate-400">Tanggal</th>
                  <th className="p-2 border border-slate-400">No Ref</th>
                  <th className="p-2 border border-slate-400">Jenis & Kategori</th>
                  <th className="p-2 border border-slate-400">Keterangan Transaksi</th>
                  <th className="p-2 border border-slate-400 text-right">Pemasukan (Rp)</th>
                  <th className="p-2 border border-slate-400 text-right">Pengeluaran (Rp)</th>
                </tr>
              </thead>
              <tbody>
                {/* Baris Saldo Awal Periode */}
                <tr className="bg-amber-50/90 font-bold border-b border-slate-400">
                  <td className="p-2 border border-slate-300 text-center font-mono">-</td>
                  <td className="p-2 border border-slate-300 whitespace-nowrap text-amber-900">
                    {startDateCutoff ? formatIndonesianDate(startDateCutoff) : 'Awal Periode'}
                  </td>
                  <td className="p-2 border border-slate-300 font-mono text-[10px] text-amber-900">
                    SALDO-AWAL
                  </td>
                  <td className="p-2 border border-slate-300 text-amber-900 font-bold">
                    [SALDO AWAL PERIODE]
                  </td>
                  <td className="p-2 border border-slate-300 font-semibold text-slate-800">
                    Saldo Kas Awal Dipindahkan Dari Periode Sebelumnya
                  </td>
                  <td className="p-2 border border-slate-300 text-right font-bold text-amber-900">
                    Rp {saldoAwalPeriode.toLocaleString('id-ID')}
                  </td>
                  <td className="p-2 border border-slate-300 text-right font-medium text-slate-400">
                    -
                  </td>
                </tr>

                {filtered.map((item, idx) => (
                  <tr key={item.id} className="border-b border-slate-300">
                    <td className="p-2 border border-slate-300 text-center">{idx + 1}</td>
                    <td className="p-2 border border-slate-300 whitespace-nowrap">
                      {item.tanggal}
                    </td>
                    <td className="p-2 border border-slate-300 font-mono text-[10px]">
                      {item.noReferensi}
                    </td>
                    <td className="p-2 border border-slate-300 font-semibold">
                      <span
                        className={
                          item.jenis === 'pemasukan' ? 'text-emerald-700' : 'text-rose-700'
                        }
                      >
                        [{(item.jenis || 'transaksi').toUpperCase()}]
                      </span>{' '}
                      {item.kategori}
                    </td>
                    <td className="p-2 border border-slate-300">{item.keterangan}</td>
                    <td className="p-2 border border-slate-300 text-right font-medium">
                      {item.jenis === 'pemasukan'
                        ? `Rp ${item.jumlah.toLocaleString('id-ID')}`
                        : '-'}
                    </td>
                    <td className="p-2 border border-slate-300 text-right font-medium">
                      {item.jenis === 'pengeluaran'
                        ? `Rp ${item.jumlah.toLocaleString('id-ID')}`
                        : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-slate-100 font-bold border-t-2 border-slate-400">
                  <td colSpan={5} className="p-2 border border-slate-400 text-right">
                    JUMLAH TRANSAKSI PERIODE INI:
                  </td>
                  <td className="p-2 border border-slate-400 text-right text-emerald-800">
                    Rp {totalPemasukan.toLocaleString('id-ID')}
                  </td>
                  <td className="p-2 border border-slate-400 text-right text-rose-800">
                    Rp {totalPengeluaran.toLocaleString('id-ID')}
                  </td>
                </tr>
                <tr className="bg-amber-50 font-bold border-t border-slate-400">
                  <td colSpan={5} className="p-2 border border-slate-400 text-right text-amber-950">
                    TOTAL PENERIMAAN KAS (+ SALDO AWAL PERIODE):
                  </td>
                  <td colSpan={2} className="p-2 border border-slate-400 text-right text-amber-950 font-extrabold">
                    Rp {totalPenerimaanPlusSaldoAwal.toLocaleString('id-ID')}
                  </td>
                </tr>
                <tr className="bg-slate-200 font-black border-t-2 border-slate-600 text-sm">
                  <td colSpan={5} className="p-2 border border-slate-400 text-right text-slate-950">
                    SALDO KAS AKHIR PERIODE:
                  </td>
                  <td colSpan={2} className="p-2 border border-slate-400 text-right text-indigo-950 font-black">
                    Rp {saldoAkhir.toLocaleString('id-ID')}
                  </td>
                </tr>
              </tfoot>
            </table>

            {/* MANDATORY SIGNATURES ACCORDING TO POS KAS CATEGORY */}
            <SignatureBlock posKas={printConfig.posKas} signers={['bendahara', 'ketua']} />
          </div>
        );
      }

      case 'warga_jemaat': {
        const filtered = printConfig.selectedRayon
          ? wargaJemaatList.filter((w) => w.rayon === printConfig.selectedRayon)
          : wargaJemaatList;

        const totalKk = new Set(filtered.map((w) => w.noKjj)).size;
        const totalL = filtered.filter((w) => w.jenisKelamin === 'L').length;
        const totalP = filtered.filter((w) => w.jenisKelamin === 'P').length;

        return (
          <div>
            <KopSurat
              title="LAPORAN DATA INDUK WARGA JEMAAT"
              subtitle={`Sensus Data Anggota Jemaat GKE ${
                printConfig.selectedRayon ? `(${printConfig.selectedRayon})` : 'Keseluruhan Lingkungan'
              }`}
            />

            <div className="flex justify-between items-center bg-slate-50 border border-slate-300 p-2 text-xs rounded mb-3">
              <div>
                Total Kepala Keluarga (KK): <strong>{totalKk} KK</strong>
              </div>
              <div>
                Total Anggota: <strong>{filtered.length} Jiwa</strong> (Laki-laki: {totalL},
                Perempuan: {totalP})
              </div>
            </div>

            <table className="w-full text-xs text-left border-collapse border border-slate-400 mb-4">
              <thead>
                <tr className="bg-slate-200 text-slate-900 border-b border-slate-400">
                  <th className="p-2 border border-slate-400 w-8 text-center">No</th>
                  <th className="p-2 border border-slate-400">No KJJ</th>
                  <th className="p-2 border border-slate-400">Nama Lengkap</th>
                  <th className="p-2 border border-slate-400 text-center">L/P</th>
                  <th className="p-2 border border-slate-400">Hub. Keluarga</th>
                  <th className="p-2 border border-slate-400">Lingkungan</th>
                  <th className="p-2 border border-slate-400 text-center">Baptis</th>
                  <th className="p-2 border border-slate-400 text-center">Sidi</th>
                  <th className="p-2 border border-slate-400">Status Keanggotaan</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item, idx) => (
                  <tr key={item.id} className="border-b border-slate-300">
                    <td className="p-2 border border-slate-300 text-center">{idx + 1}</td>
                    <td className="p-2 border border-slate-300 font-mono text-[10px]">
                      {item.noKjj}
                    </td>
                    <td className="p-2 border border-slate-300 font-semibold">
                      {item.namaLengkap}
                    </td>
                    <td className="p-2 border border-slate-300 text-center">{item.jenisKelamin}</td>
                    <td className="p-2 border border-slate-300">{item.hubunganKeluarga}</td>
                    <td className="p-2 border border-slate-300">{item.rayon}</td>
                    <td className="p-2 border border-slate-300 text-center">
                      {item.statusBaptis ? 'Sudah' : 'Belum'}
                    </td>
                    <td className="p-2 border border-slate-300 text-center">
                      {item.statusSidi ? 'Sudah' : 'Belum'}
                    </td>
                    <td className="p-2 border border-slate-300">{item.statusKeanggotaan}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <SignatureBlock signers={['sekretaris', 'ketua']} />
          </div>
        );
      }

      case 'jadwal_ibadah': {
        let filtered = [...jadwalIbadahList];
        if (printConfig.startDate) {
          filtered = filtered.filter((j) => j.tanggal >= printConfig.startDate!);
        }
        if (printConfig.endDate) {
          filtered = filtered.filter((j) => j.tanggal <= printConfig.endDate!);
        }

        return (
          <div>
            {/* MANDATORY KOP SURAT AND SIGNATURES BY SEKRETARIS & KETUA JEMAAT */}
            <KopSurat
              title="LAPORAN JADWAL IBADAH DAN PELAYAN FIRMAN"
              subtitle="Jadwal Ibadah Umum, Kebaktian Kategorial & Pelayanan Rayon / Lingkungan"
            />

            <table className="w-full text-xs text-left border-collapse border border-slate-400 mb-4">
              <thead>
                <tr className="bg-slate-200 text-slate-900 border-b border-slate-400">
                  <th className="p-2 border border-slate-400 w-8 text-center">No</th>
                  <th className="p-2 border border-slate-400">Tanggal & Waktu</th>
                  <th className="p-2 border border-slate-400">Kategori & Nama Kebaktian</th>
                  <th className="p-2 border border-slate-400">Tempat & Tuan Rumah</th>
                  <th className="p-2 border border-slate-400">Pelayan Firman & Pewarta</th>
                  <th className="p-2 border border-slate-400">Liturgos & Bacaan Alkitab</th>
                  <th className="p-2 border border-slate-400">Pemusik & Singer/Pemandu</th>
                  <th className="p-2 border border-slate-400">Warta Khusus / Catatan</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item, idx) => (
                  <tr key={item.id} className="border-b border-slate-300">
                    <td className="p-2 border border-slate-300 text-center font-mono">{idx + 1}</td>
                    <td className="p-2 border border-slate-300 whitespace-nowrap font-medium">
                      <div>{item.tanggal}</div>
                      <div className="text-[10px] text-blue-800 font-bold">{item.waktu}</div>
                    </td>
                    <td className="p-2 border border-slate-300">
                      <div className="font-bold text-slate-900">{item.namaIbadah}</div>
                      <div className="text-[10px] text-purple-900 font-semibold">
                        {item.kategoriIbadah || 'Umum'} {item.seksi ? `(${item.seksi})` : item.rayon ? `(${item.rayon})` : ''}
                      </div>
                    </td>
                    <td className="p-2 border border-slate-300">
                      <div>{item.tempat}</div>
                      {item.tuanRumah && (
                        <div className="text-[10px] text-emerald-800 font-medium">Kel: {item.tuanRumah}</div>
                      )}
                    </td>
                    <td className="p-2 border border-slate-300">
                      <div className="font-bold text-blue-900">{item.pelayanFirman || item.pengkhotbah}</div>
                      {item.pewartaBerita && (
                        <div className="text-[10px] text-slate-600">Pewarta: {item.pewartaBerita}</div>
                      )}
                    </td>
                    <td className="p-2 border border-slate-300">
                      <div className="font-semibold text-slate-800">{item.liturgos}</div>
                      {item.pembacaanAlkitab && (
                        <div className="text-[10px] text-indigo-900 font-bold">Nats: {item.pembacaanAlkitab}</div>
                      )}
                    </td>
                    <td className="p-2 border border-slate-300">
                      <div>Pemusik: {item.pemusik}</div>
                      <div className="text-[10px] text-slate-600">Singer: {item.pemanduLagu || item.kantoria}</div>
                    </td>
                    <td className="p-2 border border-slate-300 text-[11px]">
                      {item.operatorMultimedia && (
                        <div className="text-[10px] text-slate-500">Operator: {item.operatorMultimedia}</div>
                      )}
                      {item.wartaKhusus && (
                        <div className="italic text-slate-700">{item.wartaKhusus}</div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* MANDATORY SIGNED BY KETUA (KIRI) & SEKRETARIS (KANAN) */}
            <SignatureBlock signers={['ketua', 'sekretaris']} />
          </div>
        );
      }

      case 'inventaris_aset': {
        const totalNilaiAset = inventarisList.reduce(
          (sum, item) => sum + item.nilaiAset * item.kuantitas,
          0
        );

        return (
          <div>
            <KopSurat
              title="LAPORAN DATA INVENTARIS DAN VALUASI NILAI ASET"
              subtitle="Pencatatan Sarana & Prasarana Milik Majelis Jemaat GKE"
            />

            <div className="bg-slate-100 border border-slate-300 p-3 rounded mb-4 flex justify-between items-center text-xs">
              <div>
                Total Item Aset: <strong>{inventarisList.length} Jenis Barang</strong>
              </div>
              <div className="text-right">
                TOTAL VALUASI NILAI ASET:{' '}
                <strong className="text-sm text-blue-900">
                  Rp {totalNilaiAset.toLocaleString('id-ID')}
                </strong>
              </div>
            </div>

            <table className="w-full text-xs text-left border-collapse border border-slate-400 mb-4">
              <thead>
                <tr className="bg-slate-200 text-slate-900 border-b border-slate-400">
                  <th className="p-2 border border-slate-400 w-8 text-center">No</th>
                  <th className="p-2 border border-slate-400">Kode Aset</th>
                  <th className="p-2 border border-slate-400">Nama Barang / Aset</th>
                  <th className="p-2 border border-slate-400">Kategori</th>
                  <th className="p-2 border border-slate-400 text-center">Jml</th>
                  <th className="p-2 border border-slate-400 text-center">Kondisi</th>
                  <th className="p-2 border border-slate-400 text-right">Nilai Perolehan (Rp)</th>
                  <th className="p-2 border border-slate-400 text-right">Total Nilai (Rp)</th>
                  <th className="p-2 border border-slate-400">Lokasi / Penanggung Jawab</th>
                </tr>
              </thead>
              <tbody>
                {inventarisList.map((item, idx) => {
                  const subtotal = item.nilaiAset * item.kuantitas;
                  return (
                    <tr key={item.id} className="border-b border-slate-300">
                      <td className="p-2 border border-slate-300 text-center">{idx + 1}</td>
                      <td className="p-2 border border-slate-300 font-mono text-[10px]">
                        {item.kodeAset}
                      </td>
                      <td className="p-2 border border-slate-300 font-semibold">
                        {item.namaBarang}
                      </td>
                      <td className="p-2 border border-slate-300">{item.kategori}</td>
                      <td className="p-2 border border-slate-300 text-center font-bold">
                        {item.kuantitas} {item.satuan}
                      </td>
                      <td className="p-2 border border-slate-300 text-center font-medium">
                        {item.kondisi}
                      </td>
                      <td className="p-2 border border-slate-300 text-right">
                        Rp {item.nilaiAset.toLocaleString('id-ID')}
                      </td>
                      <td className="p-2 border border-slate-300 text-right font-bold text-slate-900">
                        Rp {subtotal.toLocaleString('id-ID')}
                      </td>
                      <td className="p-2 border border-slate-300">
                        <div>{item.lokasiPenyimpanan}</div>
                        <div className="text-[10px] text-slate-500">PJ: {item.penanggungJawab}</div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-slate-200 font-bold border-t-2 border-slate-400 text-slate-900">
                  <td colSpan={7} className="p-2 border border-slate-400 text-right">
                    TOTAL KESELURUHAN VALUASI ASET:
                  </td>
                  <td className="p-2 border border-slate-400 text-right text-blue-900 text-sm">
                    Rp {totalNilaiAset.toLocaleString('id-ID')}
                  </td>
                  <td className="p-2 border border-slate-400"></td>
                </tr>
              </tfoot>
            </table>

            <SignatureBlock signers={['sekretaris', 'ketua']} />
          </div>
        );
      }

      case 'jadwal_pemeliharaan_aset': {
        const totalBiayaEstimasi = pemeliharaanAsetList.reduce(
          (sum, item) => sum + (item.biayaEstimasi || 0),
          0
        );
        const totalBiayaRealisasi = pemeliharaanAsetList.reduce(
          (sum, item) => sum + (item.biayaRealisasi || 0),
          0
        );
        const selesaiCount = pemeliharaanAsetList.filter((item) => item.status === 'Selesai').length;
        const prosesCount = pemeliharaanAsetList.filter(
          (item) => item.status === 'Dalam Proses' || item.status === 'Menunggu Servis'
        ).length;

        return (
          <div>
            <KopSurat
              title="JADWAL DAN LAPORAN PEMELIHARAAN INVENTARIS ASET GEREJA"
              subtitle="Rekapitulasi Jadwal Servis Berkala, Perbaikan, dan Perawatan Sarana Prasarana"
            />

            <div className="bg-slate-100 border border-slate-300 p-3 rounded mb-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-slate-500 block">Total Jadwal:</span>
                <strong className="text-slate-900 text-sm">{pemeliharaanAsetList.length} Kegiatan</strong>
              </div>
              <div>
                <span className="text-slate-500 block">Status:</span>
                <strong className="text-emerald-700">{selesaiCount} Selesai</strong>
                <span className="text-slate-400 mx-1">/</span>
                <strong className="text-amber-700">{prosesCount} Berjalan</strong>
              </div>
              <div>
                <span className="text-slate-500 block">Total Estimasi Biaya:</span>
                <strong className="text-slate-900">Rp {totalBiayaEstimasi.toLocaleString('id-ID')}</strong>
              </div>
              <div className="text-right">
                <span className="text-slate-500 block">Total Realisasi Biaya:</span>
                <strong className="text-blue-900 text-sm">Rp {totalBiayaRealisasi.toLocaleString('id-ID')}</strong>
              </div>
            </div>

            <table className="w-full text-xs text-left border-collapse border border-slate-400 mb-4">
              <thead>
                <tr className="bg-slate-200 text-slate-900 border-b border-slate-400">
                  <th className="p-2 border border-slate-400 w-8 text-center">No</th>
                  <th className="p-2 border border-slate-400">Kode &amp; Nama Aset</th>
                  <th className="p-2 border border-slate-400">Jenis &amp; Prioritas</th>
                  <th className="p-2 border border-slate-400">Uraian / Pekerjaan</th>
                  <th className="p-2 border border-slate-400 text-center">Jatuh Tempo</th>
                  <th className="p-2 border border-slate-400 text-right">Biaya (Est / Real)</th>
                  <th className="p-2 border border-slate-400">Vendor / Teknisi</th>
                  <th className="p-2 border border-slate-400 text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {pemeliharaanAsetList.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-4 text-center text-slate-500">
                      Belum ada catatan jadwal pemeliharaan inventaris aset.
                    </td>
                  </tr>
                ) : (
                  pemeliharaanAsetList.map((item, idx) => (
                    <tr key={item.id} className="border-b border-slate-300">
                      <td className="p-2 border border-slate-300 text-center">{idx + 1}</td>
                      <td className="p-2 border border-slate-300">
                        <div className="font-semibold text-slate-900">{item.namaAset}</div>
                        <div className="font-mono text-[10px] text-slate-500">{item.kodeAset}</div>
                      </td>
                      <td className="p-2 border border-slate-300">
                        <div className="font-medium">{item.jenisPemeliharaan}</div>
                        <div className="text-[10px] text-slate-500">Prioritas: {item.prioritas}</div>
                      </td>
                      <td className="p-2 border border-slate-300">
                        <div>{item.deskripsiTindakan}</div>
                        {item.catatanHasil && (
                          <div className="text-[10px] text-slate-500 italic mt-0.5">
                            Hasil: {item.catatanHasil}
                          </div>
                        )}
                      </td>
                      <td className="p-2 border border-slate-300 text-center font-mono">
                        <div>{item.tanggalJatuhTempo}</div>
                        {item.tanggalSelesai && (
                          <div className="text-[10px] text-emerald-700 font-semibold">
                            Selesai: {item.tanggalSelesai}
                          </div>
                        )}
                      </td>
                      <td className="p-2 border border-slate-300 text-right font-mono">
                        <div>Rp {(item.biayaEstimasi || 0).toLocaleString('id-ID')}</div>
                        {item.biayaRealisasi !== undefined && (
                          <div className="font-bold text-blue-900 text-[11px]">
                            Real: Rp {item.biayaRealisasi.toLocaleString('id-ID')}
                          </div>
                        )}
                      </td>
                      <td className="p-2 border border-slate-300">
                        <div>{item.namaTeknisiAtauVendor}</div>
                        {item.kontakTeknisi && (
                          <div className="text-[10px] text-slate-500 font-mono">{item.kontakTeknisi}</div>
                        )}
                      </td>
                      <td className="p-2 border border-slate-300 text-center font-semibold">
                        {item.status}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              {pemeliharaanAsetList.length > 0 && (
                <tfoot>
                  <tr className="bg-slate-200 font-bold border-t-2 border-slate-400 text-slate-900">
                    <td colSpan={5} className="p-2 border border-slate-400 text-right">
                      TOTAL REALISASI BIAYA PEMELIHARAAN:
                    </td>
                    <td className="p-2 border border-slate-400 text-right text-blue-900 text-sm">
                      Rp {totalBiayaRealisasi.toLocaleString('id-ID')}
                    </td>
                    <td colSpan={2} className="p-2 border border-slate-400"></td>
                  </tr>
                </tfoot>
              )}
            </table>

            <SignatureBlock signers={['sekretaris', 'ketua']} />
          </div>
        );
      }

      case 'buletin_renungan': {
        const renungan =
          renunganList.find((r) => r.id === printConfig.renunganId) || renunganList[0];

        if (!renungan) return <div>Data renungan tidak ditemukan.</div>;

        return (
          <div className="max-w-2xl mx-auto p-4 border border-slate-400 rounded bg-white">
            <div className="border-b-2 border-slate-800 pb-3 mb-4 text-center">
              <span className="text-[10px] font-bold tracking-widest text-blue-900 uppercase">
                BULETIN RENUNGAN HARIAN GKE
              </span>
              <h2 className="text-xl font-serif font-bold text-slate-900 mt-1">
                {renungan.judul}
              </h2>
              <p className="text-xs text-slate-600 italic font-serif mt-1">
                Nats Alkitab: <strong className="text-blue-950 font-bold">{renungan.natsAlkitab}</strong>
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Oleh: {renungan.penulis} | Tanggal: {renungan.tanggal}
              </p>
            </div>

            <div className="prose prose-slate max-w-none text-xs leading-relaxed text-slate-800 whitespace-pre-line font-serif mb-6 text-justify">
              {renungan.isi}
            </div>

            <div className="bg-blue-50 border-l-4 border-blue-700 p-3 rounded text-xs font-sans text-slate-800">
              <h4 className="font-bold text-blue-900 text-xs mb-1">APLIKASI & DOA HARIAN:</h4>
              <p className="italic leading-normal">{renungan.aplikasiDoa}</p>
            </div>

            <div className="mt-8 pt-4 border-t border-slate-200 flex justify-between items-center text-[10px] text-slate-500 font-sans">
              <div>{settings.namaJemaat} - Buletin Renungan</div>
              <div>Solus Christus - GKE</div>
            </div>
          </div>
        );
      }

      case 'mph_jemaat': {
        const cleanPeriode = (localPeriodeMPH || '').trim();
        const displayPeriode = cleanPeriode
          ? (cleanPeriode.toLowerCase().includes('periode')
              ? cleanPeriode
              : `Periode Pelayanan ${cleanPeriode}`)
          : 'Periode Pelayanan 2024 - 2029';

        return (
          <div>
            <KopSurat
              title="STRUKTUR ORGANISASI MAJELIS PEKERJA HARIAN (MPH) & KETUA-KETUA SEKSI PELAYANAN KATEGORIAL"
              subtitle={`Berdasarkan Surat Keputusan (SK) - Majelis Jemaat GKE — ${displayPeriode}`}
            />

            <table className="w-full text-xs text-left border-collapse border border-slate-400 mb-4">
              <thead>
                <tr className="bg-slate-200 text-slate-900 border-b border-slate-400">
                  <th className="p-2 border border-slate-400 w-8 text-center">No</th>
                  <th className="p-2 border border-slate-400">Jabatan Struktural / SK</th>
                  <th className="p-2 border border-slate-400">Nama Pengurus & Gelar</th>
                  <th className="p-2 border border-slate-400">Periode Jabatan</th>
                  <th className="p-2 border border-slate-400">No. HP / Telepon</th>
                </tr>
              </thead>
              <tbody>
                {mphList.map((item, idx) => (
                  <tr key={item.id} className="border-b border-slate-300">
                    <td className="p-2 border border-slate-300 text-center">{idx + 1}</td>
                    <td className="p-2 border border-slate-300 font-bold text-slate-900">
                      {item.jabatan}
                    </td>
                    <td className="p-2 border border-slate-300 font-semibold text-blue-950">
                      {item.nama}{item.gelar ? `, ${item.gelar}` : ''}
                    </td>
                    <td className="p-2 border border-slate-300">{item.periode || localPeriodeMPH}</td>
                    <td className="p-2 border border-slate-300">{item.noHp || '-'}</td>
                  </tr>
                ))}
                {mphList.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-4 text-center text-slate-500 italic">
                      Belum ada data pengurus MPH tersimpan.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            <SignatureBlock signers={['ketua', 'sekretaris']} />
          </div>
        );
      }

      case 'detail_jadwal_ibadah': {
        const item = jadwalIbadahList.find((j) => j.id === printConfig.jadwalId) || jadwalIbadahList[0];
        if (!item) return <div>Data jadwal ibadah tidak ditemukan.</div>;

        return (
          <div>
            <KopSurat
              title={`LEMBAR TATA JADWAL & PETUGAS PELAYANAN IBADAH`}
              subtitle={`${item.namaIbadah} — Tanggal: ${item.tanggal} (${item.waktu})`}
            />

            <div className="border border-slate-400 rounded p-4 mb-6 bg-slate-50 font-sans text-xs space-y-3">
              {/* Field 1, 2, 6, 7 */}
              <div className="grid grid-cols-3 gap-4 border-b border-slate-300 pb-3">
                <div>
                  <span className="text-slate-500 font-bold uppercase text-[10px]">Tanggal & Waktu Pelaksanaan</span>
                  <p className="font-bold text-sm text-blue-950">{item.tanggal} • {item.waktu}</p>
                </div>
                <div>
                  <span className="text-slate-500 font-bold uppercase text-[10px]">Kategori & Nama Kebaktian</span>
                  <p className="font-bold text-sm text-slate-900">{item.namaIbadah}</p>
                  <p className="text-[11px] text-purple-900 font-semibold">
                    {item.kategoriIbadah || 'Umum'} {item.seksi ? `(Seksi ${item.seksi})` : item.rayon ? `(Rayon ${item.rayon})` : ''}
                  </p>
                </div>
                <div>
                  <span className="text-slate-500 font-bold uppercase text-[10px]">Tempat & Tuan Rumah</span>
                  <p className="font-semibold text-slate-800 text-xs">{item.tempat}</p>
                  {item.tuanRumah && (
                    <p className="text-emerald-800 font-bold text-[11px]">Tuan Rumah: Kel. {item.tuanRumah}</p>
                  )}
                </div>
              </div>

              {/* Pelayan Firman, Nats Khotbah, Koordinator Pelayanan */}
              <div className="grid grid-cols-3 gap-3 border-b border-slate-300 pb-3">
                <div>
                  <span className="text-slate-500 font-bold uppercase text-[10px]">Pelayan Firman (Pengkhotbah)</span>
                  <p className="font-bold text-indigo-900 text-sm">{item.pelayanFirman || item.pengkhotbah}</p>
                </div>
                <div>
                  <span className="text-slate-500 font-bold uppercase text-[10px]">Nats Khotbah / Tema Firman</span>
                  <p className="font-bold text-indigo-950 text-xs">{item.natsKhotbah || item.pembacaanAlkitab || '-'}</p>
                </div>
                <div>
                  <span className="text-slate-500 font-bold uppercase text-[10px]">Koordinator Pelayanan</span>
                  <p className="font-semibold text-slate-800">{item.koordinatorPelayanan || '-'}</p>
                </div>
              </div>

              {/* Liturgos, Pewarta Berita, Pemusik */}
              <div className="grid grid-cols-3 gap-3 border-b border-slate-300 pb-3">
                <div>
                  <span className="text-slate-500 font-bold uppercase text-[10px]">Liturgos / Penuntun Ibadah</span>
                  <p className="font-semibold text-slate-800">{item.liturgos}</p>
                </div>
                <div>
                  <span className="text-slate-500 font-bold uppercase text-[10px]">Pewarta Berita Jemaat</span>
                  <p className="font-semibold text-slate-800">{item.pewartaBerita || '-'}</p>
                </div>
                <div>
                  <span className="text-slate-500 font-bold uppercase text-[10px]">Pemusik / Organis</span>
                  <p className="font-semibold text-slate-800">{item.pemusik}</p>
                </div>
              </div>

              {/* Singer, Operator Multimedia, Kolektan / Penerima Tamu */}
              <div className="grid grid-cols-3 gap-3 border-b border-slate-300 pb-3">
                <div>
                  <span className="text-slate-500 font-bold uppercase text-[10px]">Singer / Pemandu Lagu</span>
                  <p className="font-semibold text-slate-800">{item.pemanduLagu || item.kantoria || '-'}</p>
                </div>
                <div>
                  <span className="text-slate-500 font-bold uppercase text-[10px]">Operator Multimedia & Sound</span>
                  <p className="font-semibold text-slate-800">{item.operatorMultimedia || '-'}</p>
                </div>
                <div>
                  <span className="text-slate-500 font-bold uppercase text-[10px]">Kolektan & Penerima Tamu</span>
                  <p className="font-semibold text-slate-800">
                    {item.kolektan || '-'}{item.penerimaTamu ? ` • Tamu: ${item.penerimaTamu}` : ''}
                  </p>
                </div>
              </div>

              {/* Pembacaan Alkitab, Kupon/Undian, Warta Khusus */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <span className="text-slate-500 font-bold uppercase text-[10px]">Pembacaan Alkitab</span>
                  <p className="font-bold text-indigo-950 text-xs bg-white p-2 rounded border border-slate-200 mt-0.5">
                    {item.pembacaanAlkitab || '-'}
                  </p>
                </div>
                <div>
                  <span className="text-slate-500 font-bold uppercase text-[10px]">Kupon / Undian / Doorprize</span>
                  <p className="font-semibold text-amber-900 bg-white p-2 rounded border border-slate-200 mt-0.5">
                    {item.kuponUndian || '-'}
                  </p>
                </div>
                <div>
                  <span className="text-slate-500 font-bold uppercase text-[10px]">Warta Khusus / Catatan</span>
                  <p className="italic text-slate-700 bg-white p-2 rounded border border-slate-200 mt-0.5">
                    {item.wartaKhusus || '-'}
                  </p>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <h4 className="font-sans font-bold text-xs text-slate-800 uppercase tracking-wider mb-2 border-b border-slate-300 pb-1">
                DAFTAR PENATUA & DIAKON PETUGAS TATALAKSANA
              </h4>
              <p className="text-xs text-slate-600 font-sans italic">
                Seluruh petugas diharapkan hadir 30 menit sebelum ibadah dimulai dan berkoordinasi di Ruang Konsistori.
              </p>
            </div>

            <SignatureBlock signers={['ketua', 'sekretaris']} />
          </div>
        );
      }

      case 'pendaftaran_warga': {
        return (
          <div>
            <KopSurat
              title="LAPORAN PENDAFTARAN ANGGOTA JEMAAT BARU & AKUN AKSES"
              subtitle="Verifikasi, Rekapitulasi Data & Akun Akses Portal Warga Jemaat - Majelis Pekerja Harian (MPH)"
            />

            <table className="w-full text-xs text-left border-collapse border border-slate-400 mb-4">
              <thead>
                <tr className="bg-slate-200 text-slate-900 border-b border-slate-400">
                  <th className="p-2 border border-slate-400 w-8 text-center">No</th>
                  <th className="p-2 border border-slate-400">Tgl Daftar</th>
                  <th className="p-2 border border-slate-400">No. KJJ / NIK</th>
                  <th className="p-2 border border-slate-400">Nama Lengkap & Alamat</th>
                  <th className="p-2 border border-slate-400">Akun Akses Portal (User & Pass)</th>
                  <th className="p-2 border border-slate-400">Lingkungan / Sakramen</th>
                  <th className="p-2 border border-slate-400 text-center">Status MPH</th>
                </tr>
              </thead>
              <tbody>
                {pendaftaranList.map((item, idx) => {
                  const userVal = item.username || generateUsername(item.namaLengkap, item.nik);
                  const passVal = item.password || 'GKE8x39A';
                  return (
                    <tr key={item.id} className="border-b border-slate-300">
                      <td className="p-2 border border-slate-300 text-center font-mono">{idx + 1}</td>
                      <td className="p-2 border border-slate-300 whitespace-nowrap font-mono">{item.tanggalDaftar}</td>
                      <td className="p-2 border border-slate-300">
                        <div className="font-bold text-slate-900 font-mono">{item.noKjj}</div>
                        <div className="text-[10px] text-slate-500 font-mono">NIK: {item.nik}</div>
                      </td>
                      <td className="p-2 border border-slate-300">
                        <div className="font-bold text-blue-950">{item.namaLengkap}</div>
                        <div className="text-[10px] text-slate-600">{item.alamat}</div>
                      </td>
                      <td className="p-2 border border-slate-300 font-mono">
                        <div className="font-bold text-emerald-800">User: {userVal}</div>
                        <div className="text-[10px] text-slate-700 bg-slate-100 p-0.5 px-1 rounded inline-block mt-0.5 border border-slate-300 font-bold">
                          Pass: {passVal}
                        </div>
                      </td>
                      <td className="p-2 border border-slate-300">
                        <div className="font-semibold text-slate-800">{item.rayon}</div>
                        <div className="text-[10px] text-slate-600">
                          {item.statusBaptis ? '✓ Baptis' : '✗ Baptis'} | {item.statusSidi ? '✓ Sidi' : '✗ Sidi'}
                        </div>
                      </td>
                      <td className="p-2 border border-slate-300 text-center font-bold">
                        <span className={item.statusKonfirmasiMPH === 'Disetujui' ? 'text-emerald-700' : 'text-amber-700'}>
                          {item.statusKonfirmasiMPH}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <SignatureBlock signers={['ketua', 'sekretaris']} />
          </div>
        );
      }

      case 'rancangan_khotbah': {
        const item = rancanganKhotbahList.find((k) => k.id === printConfig.khotbahId) || rancanganKhotbahList[0];
        if (!item) return <div>Data rancangan khotbah tidak ditemukan.</div>;

        return (
          <div>
            <KopSurat
              title="RANCANGAN KHOTBAH & OUTLINE HOMILETIKA PASTORAL GKE"
              subtitle={`Jenis Ibadah: ${item.jenisIbadah || 'Kebaktian'} | Tanggal: ${item.tanggal} | Durasi: ${item.durasiTotalMenit} Menit`}
            />

            {/* General Information Box */}
            <div className="border-2 border-slate-900 rounded-lg p-3.5 mb-4 bg-slate-50 font-sans text-xs space-y-2">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-slate-500 font-bold uppercase text-[10px]">Judul Khotbah</span>
                  <p className="font-bold text-base text-blue-950 leading-tight">{item.judulKhotbah}</p>
                </div>
                <div>
                  <span className="text-slate-500 font-bold uppercase text-[10px]">Nats Alkitab & Tema Utama</span>
                  <p className="font-bold text-slate-900 text-sm">{item.natsAlkitab}</p>
                  <p className="text-indigo-900 font-semibold text-xs">{item.temaKhotbah}</p>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-2 pt-2 border-t border-slate-300 text-[10px] text-slate-700">
                <div>
                  <span className="block text-slate-400 font-bold">Pelayan Firman:</span>
                  <strong className="text-slate-900">{item.pengkhotbah}</strong>
                </div>
                <div>
                  <span className="block text-slate-400 font-bold">Metode Homiletika:</span>
                  <span className="font-semibold text-indigo-900">{item.metodeHomiletika || 'Pastoral-Konseling'}</span>
                </div>
                <div>
                  <span className="block text-slate-400 font-bold">Nada Pastoral:</span>
                  <span className="font-semibold text-emerald-900">{item.nadaPastoral || 'Penguatan & Penghiburan'}</span>
                </div>
                <div>
                  <span className="block text-slate-400 font-bold">Sasaran Pendengar:</span>
                  <span className="font-semibold text-slate-800">{item.sasaranPendengar || 'Seluruh Warga Jemaat'}</span>
                </div>
              </div>
            </div>

            {/* Tujuan Pastoral Box (If available) */}
            {item.tujuanPastoral && (
              <div className="border border-indigo-300 bg-indigo-50/50 rounded-lg p-3 mb-4 font-sans text-xs">
                <h4 className="font-bold text-indigo-950 uppercase text-[10px] tracking-wider mb-2 flex items-center gap-1 border-b border-indigo-200 pb-1">
                  <span>🕊️</span> TRITUNGGAL TUJUAN PASTORAL PELAYANAN FIRMAN
                </h4>
                <div className="grid grid-cols-3 gap-2 text-[11px]">
                  <div className="bg-white p-2 rounded border border-indigo-200">
                    <span className="block font-bold text-blue-900 text-[10px] uppercase">1. Kognitif (Pemahaman)</span>
                    <p className="text-slate-700 mt-0.5">{item.tujuanPastoral.kognitif || '-'}</p>
                  </div>
                  <div className="bg-white p-2 rounded border border-indigo-200">
                    <span className="block font-bold text-emerald-900 text-[10px] uppercase">2. Afektif (Penghayatan Hati)</span>
                    <p className="text-slate-700 mt-0.5">{item.tujuanPastoral.afektif || '-'}</p>
                  </div>
                  <div className="bg-white p-2 rounded border border-indigo-200">
                    <span className="block font-bold text-amber-900 text-[10px] uppercase">3. Psikomotorik (Aksi Nyata)</span>
                    <p className="text-slate-700 mt-0.5">{item.tujuanPastoral.psikomotorik || '-'}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Homiletic Structure Content */}
            <div className="space-y-4 font-sans text-xs mb-6">
              {/* Pendahuluan */}
              <div className="border-l-4 border-blue-900 pl-3 py-1.5 bg-blue-50/80 rounded-r">
                <h4 className="font-bold text-blue-950 uppercase text-[11px]">I. Pendahuluan & Salam Liturgis GKE</h4>
                <p className="text-slate-900 mt-1 leading-relaxed font-serif whitespace-pre-line">{item.pendahuluan}</p>
              </div>

              {/* Poin-poin Utama Homiletis */}
              <div>
                <h4 className="font-bold text-slate-950 uppercase text-[11px] mb-2 border-b-2 border-slate-900 pb-1 flex justify-between items-center">
                  <span>II. Poin-Poin Utama Homiletika & Nasihat Pastoral ({item.poinUtama.length} Poin)</span>
                  <span className="text-[10px] text-slate-600 font-mono font-normal">Alokasi Total: {item.durasiTotalMenit} Menit</span>
                </h4>
                <div className="space-y-2.5">
                  {item.poinUtama.map((poin, idx) => (
                    <div key={idx} className="p-3 border border-slate-300 rounded-lg bg-white shadow-2xs">
                      <div className="flex justify-between items-start font-bold text-slate-900 border-b border-slate-200 pb-1">
                        <span className="text-xs text-blue-950">{poin.judulPoin}</span>
                        <span className="text-indigo-900 text-[10px] bg-indigo-100/80 px-2 py-0.5 rounded font-mono border border-indigo-200 shrink-0 ml-2">
                          ~{poin.durasiMenit} Menit
                        </span>
                      </div>
                      <p className="text-slate-800 mt-1.5 leading-relaxed text-[11px]">{poin.penjelasan}</p>
                      {poin.nasihatPastoral && (
                        <div className="mt-2 pt-1.5 border-t border-dashed border-slate-200 text-slate-700 italic text-[10px] bg-slate-50 p-2 rounded flex items-start gap-1.5">
                          <span className="font-bold text-indigo-900 not-italic shrink-0">💡 Nasihat Pastoral:</span>
                          <span>{poin.nasihatPastoral}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Penerapan & Aplikasi */}
              <div className="border-l-4 border-emerald-800 pl-3 py-1.5 bg-emerald-50/80 rounded-r">
                <h4 className="font-bold text-emerald-950 uppercase text-[11px]">III. Penerapan & Langkah Aksi Pastoral Warga Jemaat</h4>
                <p className="text-slate-900 mt-1 leading-relaxed">{item.penerapanAplikasi}</p>
              </div>

              {/* Penutup & Doa Syafaat */}
              <div className="border-l-4 border-amber-800 pl-3 py-1.5 bg-amber-50/80 rounded-r">
                <h4 className="font-bold text-amber-950 uppercase text-[11px]">IV. Penutup & Doa Syafaat Pastoral GKE</h4>
                <p className="text-slate-900 mt-1 leading-relaxed whitespace-pre-line">{item.penutupDoa}</p>
              </div>

              {/* Catatan Liturgis & Nyanyian */}
              {item.catatanLiturgis && (
                <div className="p-2.5 border border-purple-200 bg-purple-50/50 rounded-lg text-[10px] text-purple-950">
                  <strong className="uppercase font-bold block mb-0.5">🎵 Catatan Liturgis & Rekomendasi Nyanyian:</strong>
                  <span>{item.catatanLiturgis}</span>
                </div>
              )}
            </div>

            <SignatureBlock signers={['ketua']} />
          </div>
        );
      }

      case 'kartu_keluarga_jemaat': {
        // Find family members based on printConfig.noKjj or pick default
        const selectedKjj = printConfig.noKjj || (wargaJemaatList[0]?.noKjj || '');
        const familyMembers = wargaJemaatList.filter((w) => w.noKjj === selectedKjj);

        // Sort family members: Kepala Keluarga -> Istri -> Anak -> Famili Lain
        const sortedFamily = [...familyMembers].sort((a, b) => {
          const order: Record<string, number> = {
            'Kepala Keluarga': 1,
            'Istri': 2,
            'Anak': 3,
            'Famili Lain': 4,
          };
          const orderA = order[a.hubunganKeluarga] || 99;
          const orderB = order[b.hubunganKeluarga] || 99;
          if (orderA !== orderB) return orderA - orderB;
          return a.tanggalLahir.localeCompare(b.tanggalLahir);
        });

        const kepalaKeluarga = sortedFamily.find((f) => f.hubunganKeluarga === 'Kepala Keluarga') || sortedFamily[0];
        const istri = sortedFamily.find((f) => f.hubunganKeluarga === 'Istri');
        const anakList = sortedFamily.filter((f) => f.hubunganKeluarga === 'Anak');
        const familiLainList = sortedFamily.filter((f) => f.hubunganKeluarga === 'Famili Lain');

        return (
          <div>
            <KopSurat
              title="KARTU KELUARGA JEMAAT (KKJ)"
              subtitle={`GEREJA KALIMANTAN EVANGELIS (GKE) - NO. KJJ: ${selectedKjj || '-'}`}
            />

            {/* Header Document Metadata Box */}
            <div className="border-2 border-slate-900 rounded-lg p-3.5 mb-4 bg-slate-50/80 font-sans text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="flex">
                    <span className="w-36 text-slate-600 font-medium">No. Kartu Keluarga (KJJ)</span>
                    <span className="font-bold text-slate-900 font-mono">: {selectedKjj || '-'}</span>
                  </div>
                  <div className="flex">
                    <span className="w-36 text-slate-600 font-medium">Kepala Keluarga</span>
                    <span className="font-bold text-blue-950">: {kepalaKeluarga?.namaLengkap || '-'}</span>
                  </div>
                  <div className="flex">
                    <span className="w-36 text-slate-600 font-medium">Rayon / Sektor</span>
                    <span className="font-semibold text-slate-800">: {kepalaKeluarga?.rayon || '-'}</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex">
                    <span className="w-36 text-slate-600 font-medium">Alamat Tinggal</span>
                    <span className="font-semibold text-slate-800">: {kepalaKeluarga?.alamat || '-'}</span>
                  </div>
                  <div className="flex">
                    <span className="w-36 text-slate-600 font-medium">No. Telepon / HP</span>
                    <span className="font-semibold text-slate-800">: {kepalaKeluarga?.noHp || '-'}</span>
                  </div>
                  <div className="flex">
                    <span className="w-36 text-slate-600 font-medium">Jumlah Jiwa</span>
                    <span className="font-bold text-slate-900">: {sortedFamily.length} Jiwa</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Diagram Silsilah Keluarga (Tree Structure) */}
            <div className="mb-5 border border-slate-300 rounded-lg p-4 bg-slate-50 print:bg-white font-sans">
              <h4 className="text-center font-bold text-slate-900 uppercase text-[11px] tracking-wider mb-3 pb-1 border-b border-slate-300">
                Diagram Silsilah & Susunan Keluarga Jemaat
              </h4>

              {/* Parents Level */}
              <div className="flex items-center justify-center gap-6 mb-4">
                {/* Kepala Keluarga Box */}
                <div className="border-2 border-blue-900 bg-blue-50/90 rounded-lg p-2.5 text-center min-w-[180px] shadow-xs">
                  <span className="badge-white-text badge-silsilah-kk text-[9px] font-black uppercase tracking-wider bg-blue-900 text-white px-2 py-0.5 rounded inline-block mb-1">
                    Kepala Keluarga
                  </span>
                  <p className="font-bold text-blue-950 text-xs">{kepalaKeluarga?.namaLengkap || 'Belum Terdaftar'}</p>
                  <p className="text-[10px] text-slate-600 font-mono mt-0.5 font-medium">NIK: {kepalaKeluarga?.nik || '-'}</p>
                  <div className="text-[9px] text-slate-500 mt-1 flex justify-center gap-1.5 font-semibold">
                    <span>{kepalaKeluarga?.statusBaptis ? '✓ Baptis' : '✗ Baptis'}</span>
                    <span>•</span>
                    <span>{kepalaKeluarga?.statusSidi ? '✓ Sidi' : '✗ Sidi'}</span>
                  </div>
                </div>

                {/* Connection Line */}
                {istri && (
                  <div className="flex items-center text-slate-400 font-mono text-xs font-bold px-1">
                    <span className="bg-slate-200 px-2 py-1 rounded-full text-[10px] text-slate-700 border border-slate-300 font-semibold">
                      💍 PERNIKAHAN
                    </span>
                  </div>
                )}

                {/* Istri Box */}
                {istri && (
                  <div className="border-2 border-purple-900 bg-purple-50/90 rounded-lg p-2.5 text-center min-w-[180px] shadow-xs">
                    <span className="badge-white-text badge-silsilah-istri text-[9px] font-black uppercase tracking-wider bg-purple-900 text-white px-2 py-0.5 rounded inline-block mb-1">
                      Istri
                    </span>
                    <p className="font-bold text-purple-950 text-xs">{istri.namaLengkap}</p>
                    <p className="text-[10px] text-slate-600 font-mono mt-0.5 font-medium">NIK: {istri.nik || '-'}</p>
                    <div className="text-[9px] text-slate-500 mt-1 flex justify-center gap-1.5 font-semibold">
                      <span>{istri.statusBaptis ? '✓ Baptis' : '✗ Baptis'}</span>
                      <span>•</span>
                      <span>{istri.statusSidi ? '✓ Sidi' : '✗ Sidi'}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Children Level */}
              {anakList.length > 0 && (
                <div className="pt-2 border-t border-dashed border-slate-300">
                  <p className="text-center text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">
                    Anak-Anak Kandung ({anakList.length} Orang)
                  </p>
                  <div className="flex flex-wrap justify-center gap-3">
                    {anakList.map((anak, idx) => (
                      <div
                        key={anak.id}
                        className="border border-emerald-600 bg-emerald-50/80 rounded-lg p-2 text-center min-w-[150px] shadow-2xs"
                      >
                        <span className="badge-white-text badge-silsilah-anak text-[8px] font-black uppercase tracking-wider bg-emerald-700 text-white px-1.5 py-0.5 rounded inline-block mb-1">
                          Anak Ke-{idx + 1}
                        </span>
                        <p className="font-bold text-emerald-950 text-[11px]">{anak.namaLengkap}</p>
                        <p className="text-[9px] text-slate-600 font-mono font-medium">Tgl Lahir: {anak.tanggalLahir || '-'}</p>
                        <div className="text-[8px] text-slate-500 mt-0.5 flex justify-center gap-1 font-semibold">
                          <span>{anak.statusBaptis ? '✓ Baptis' : '✗ Baptis'}</span>
                          <span>•</span>
                          <span>{anak.statusSidi ? '✓ Sidi' : '✗ Sidi'}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Tabel Rincian Data Anggota Keluarga */}
            <h4 className="font-bold text-slate-900 uppercase text-xs mb-2 border-b border-slate-400 pb-1 font-sans">
              I. Rincian Data Anggota Keluarga
            </h4>
            <table className="w-full text-[11px] text-left border-collapse border border-slate-400 mb-6 font-sans">
              <thead>
                <tr className="bg-slate-200 text-slate-900 border-b border-slate-400 font-bold uppercase text-[10px]">
                  <th className="p-1.5 border border-slate-400 w-6 text-center">No</th>
                  <th className="p-1.5 border border-slate-400">Nama Lengkap</th>
                  <th className="p-1.5 border border-slate-400 font-mono">NIK</th>
                  <th className="p-1.5 border border-slate-400 text-center">L/P</th>
                  <th className="p-1.5 border border-slate-400">Tempat, Tgl Lahir</th>
                  <th className="p-1.5 border border-slate-400">Hubungan Keluarga</th>
                  <th className="p-1.5 border border-slate-400 text-center">Baptis</th>
                  <th className="p-1.5 border border-slate-400 text-center">Sidi</th>
                  <th className="p-1.5 border border-slate-400">Pekerjaan</th>
                </tr>
              </thead>
              <tbody>
                {sortedFamily.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-4 text-center text-slate-500 italic">
                      Tidak ada data anggota keluarga ditemukan untuk Nomor KJJ: {selectedKjj}
                    </td>
                  </tr>
                ) : (
                  sortedFamily.map((item, idx) => (
                    <tr key={item.id} className="border-b border-slate-300">
                      <td className="p-1.5 border border-slate-300 text-center font-mono">{idx + 1}</td>
                      <td className="p-1.5 border border-slate-300 font-bold text-slate-900">
                        {item.namaLengkap}
                      </td>
                      <td className="p-1.5 border border-slate-300 font-mono text-[10px]">{item.nik}</td>
                      <td className="p-1.5 border border-slate-300 text-center font-bold">{item.jenisKelamin}</td>
                      <td className="p-1.5 border border-slate-300">
                        {item.tempatLahir}, {item.tanggalLahir}
                      </td>
                      <td className="p-1.5 border border-slate-300 font-semibold text-blue-900">
                        {item.hubunganKeluarga}
                      </td>
                      <td className="p-1.5 border border-slate-300 text-center">
                        {item.statusBaptis ? 'Sudah' : 'Belum'}
                      </td>
                      <td className="p-1.5 border border-slate-300 text-center">
                        {item.statusSidi ? 'Sudah' : 'Belum'}
                      </td>
                      <td className="p-1.5 border border-slate-300">{item.pekerjaan}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {/* Signature Block */}
            <div className="mt-8 pt-4 border-t border-slate-300 font-sans">
              <div className="grid grid-cols-2 gap-8 text-center text-xs">
                <div>
                  <p className="text-slate-600 mb-1">Kepala Keluarga Jemaat,</p>
                  <div className="h-16" />
                  <p className="font-bold underline text-slate-900 font-sans">
                    {kepalaKeluarga?.namaLengkap || '...........................................'}
                  </p>
                </div>

                <div>
                  <p className="text-slate-600 mb-1">
                    {settings.tempatDiterbitkan || 'Palangka Raya'}, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                  <p className="text-slate-600 font-medium">Ketua Majelis Jemaat GKE,</p>
                  <div className="h-16" />
                  <p className="font-bold underline text-slate-900 font-sans">
                    {settings.namaKetuaJemaat}
                  </p>
                  <p className="text-[10px] text-slate-500 font-mono">{settings.nipKetuaJemaat}</p>
                </div>
              </div>
            </div>
          </div>
        );
      }

      case 'agenda_surat': {
        const totalMasuk = agendaSuratList.filter((s) => s.jenis === 'surat_masuk').length;
        const totalKeluar = agendaSuratList.filter((s) => s.jenis === 'surat_keluar').length;

        return (
          <div>
            <KopSurat
              title="BUKU AGENDA SURAT MASUK DAN SURAT KELUAR"
              subtitle="Pencatatan Resmi Administrasi Persuratan & Disposisi Majelis Jemaat GKE Efata"
            />

            <div className="flex justify-between items-center bg-slate-50 border border-slate-300 p-2 text-xs rounded mb-3">
              <div>
                Total Surat Masuk: <strong>{totalMasuk} Dokumen</strong>
              </div>
              <div>
                Total Surat Keluar: <strong>{totalKeluar} Dokumen</strong>
              </div>
              <div>
                Total Agenda: <strong>{agendaSuratList.length} Berkas</strong>
              </div>
            </div>

            <table className="w-full text-xs text-left border-collapse border border-slate-400 mb-4 font-sans">
              <thead>
                <tr className="bg-slate-200 text-slate-900 border-b border-slate-400">
                  <th className="p-2 border border-slate-400 w-8 text-center">No</th>
                  <th className="p-2 border border-slate-400">Jenis & No Agenda</th>
                  <th className="p-2 border border-slate-400">No. Surat & Tanggal</th>
                  <th className="p-2 border border-slate-400">Pengirim & Penerima</th>
                  <th className="p-2 border border-slate-400">Perihal & Sifat</th>
                  <th className="p-2 border border-slate-400">Disposisi MPH Jemaat</th>
                  <th className="p-2 border border-slate-400 text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {agendaSuratList.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-4 text-center text-slate-500 italic">
                      Belum ada data agenda surat.
                    </td>
                  </tr>
                ) : (
                  agendaSuratList.map((item, idx) => (
                    <tr key={item.id} className="border-b border-slate-300">
                      <td className="p-2 border border-slate-300 text-center font-mono">{idx + 1}</td>
                      <td className="p-2 border border-slate-300">
                        <div className="font-bold text-slate-800 uppercase text-[10px]">
                          {item.jenis === 'surat_masuk' ? 'Surat Masuk' : 'Surat Keluar'}
                        </div>
                        <div className="font-mono text-slate-900 font-semibold">{item.noAgenda}</div>
                      </td>
                      <td className="p-2 border border-slate-300">
                        <div className="font-semibold text-slate-900">{item.noSurat || '-'}</div>
                        <div className="text-[10px] text-slate-600">Tgl: {item.tanggalSurat}</div>
                      </td>
                      <td className="p-2 border border-slate-300">
                        <div>
                          <span className="text-slate-500">Dari:</span> {item.pengirim}
                        </div>
                        <div className="text-[10px] text-slate-700">
                          <span className="text-slate-500">Kepada:</span> {item.penerima}
                        </div>
                      </td>
                      <td className="p-2 border border-slate-300">
                        <div className="font-bold text-slate-900">{item.perihal}</div>
                        <div className="text-[10px] text-slate-600">Sifat: {item.sifatSurat}</div>
                      </td>
                      <td className="p-2 border border-slate-300 text-[11px]">
                        {item.disposisi || '-'}
                      </td>
                      <td className="p-2 border border-slate-300 text-center font-bold">
                        {item.status}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            <SignatureBlock signers={['sekretaris', 'ketua']} />
          </div>
        );
      }

      case 'berita_jemaat': {
        const targetId = localBeritaJemaatId || printConfig.beritaJemaatId;
        const wartaDoc =
          beritaJemaatList.find((w) => w.id === targetId) ||
          beritaJemaatList[0];

        if (!wartaDoc) {
          return <div className="p-4 text-center text-red-600 font-bold">Dokumen Warta Jemaat tidak ditemukan.</div>;
        }

        const formatFullDate = (dStr?: string) => {
          if (!dStr) return '';
          const d = new Date(dStr);
          if (!isNaN(d.getTime())) {
            return d.toLocaleDateString('id-ID', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            });
          }
          return dStr;
        };

        const formatShortDate = (dStr?: string) => {
          if (!dStr) return '';
          const d = new Date(dStr);
          if (!isNaN(d.getTime())) {
            return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
          }
          return dStr;
        };

        // Live synchronize Jadwal Ibadah with real-time jadwalIbadahList (strictly 1-week upcoming window relative to wartaDoc.tanggalTerbit)
        const refDateObj = wartaDoc.tanggalTerbit ? new Date(wartaDoc.tanggalTerbit) : new Date();
        const startDayTime = new Date(refDateObj.getFullYear(), refDateObj.getMonth(), refDateObj.getDate(), 0, 0, 0, 0).getTime();
        const endDayTime = startDayTime + 7 * 24 * 60 * 60 * 1000 + 23 * 3600 * 1000 + 59 * 60 * 1000;

        const isDateIn1Week = (dStr?: string) => {
          if (!dStr) return false;
          const t = new Date(dStr).getTime();
          if (isNaN(t)) return false;
          return t >= startDayTime && t <= endDayTime;
        };

        const liveJadwalList = (jadwalIbadahList && jadwalIbadahList.length > 0)
          ? [...jadwalIbadahList]
              .filter((j) => isDateIn1Week(j.tanggal))
              .sort((a, b) => {
                const dateComp = (a.tanggal || '').localeCompare(b.tanggal || '');
                if (dateComp !== 0) return dateComp;
                return (a.waktu || '').localeCompare(b.waktu || '');
              })
          : [];

        // Determine synced service schedule list (prioritizing live jadwalIbadahList within 1 week, and appending any unique wartaDoc items within 1 week)
        const combinedPelayananList: Array<{
          id?: string;
          namaIbadah: string;
          kategoriIbadah?: string;
          seksi?: string;
          rayon?: string;
          tanggal: string;
          waktu: string;
          tempat: string;
          tuanRumah?: string;
          pelayanFirman: string;
          natsKhotbah?: string;
          koordinatorPelayanan?: string;
          liturgos: string;
          pembacaanAlkitab?: string;
          pemusik: string;
          pemanduLagu?: string;
          kantoria?: string;
          operatorMultimedia?: string;
          kolektan?: string;
          penerimaTamu?: string;
          pewartaBerita?: string;
          kuponUndian?: string;
          wartaKhusus?: string;
          keteranganKhusus?: string;
        }> = [];

        if (liveJadwalList.length > 0) {
          liveJadwalList.forEach((j) => {
            combinedPelayananList.push({
              id: j.id,
              namaIbadah: j.namaIbadah,
              kategoriIbadah: j.kategoriIbadah || (j.seksi ? `Kategorial ${j.seksi}` : j.rayon ? `Rayon ${j.rayon}` : 'Umum / Hari Minggu'),
              seksi: j.seksi,
              rayon: j.rayon,
              tanggal: j.tanggal,
              waktu: j.waktu,
              tempat: j.tempat,
              tuanRumah: j.tuanRumah,
              pelayanFirman: j.pelayanFirman || j.pengkhotbah || 'Pdt. Majelis Jemaat',
              natsKhotbah: j.natsKhotbah || j.pembacaanAlkitab || '',
              koordinatorPelayanan: j.koordinatorPelayanan || '',
              liturgos: j.liturgos || 'Penatua / Diakon',
              pembacaanAlkitab: j.pembacaanAlkitab || '',
              pemusik: j.pemusik || 'Organis Jemaat',
              pemanduLagu: j.pemanduLagu || j.kantoria || 'Cantoria / Singer',
              operatorMultimedia: j.operatorMultimedia || '',
              kolektan: j.kolektan || '',
              penerimaTamu: j.penerimaTamu || '',
              pewartaBerita: j.pewartaBerita || '',
              kuponUndian: j.kuponUndian || '',
              wartaKhusus: j.wartaKhusus || j.keteranganKhusus || '',
            });
          });

          // Check if wartaDoc has extra custom items not in live jadwal (within 1 week)
          (wartaDoc.beritaPelayananList || [])
            .filter((wItem) => isDateIn1Week(wItem.tanggal))
            .forEach((wItem) => {
              const exists = combinedPelayananList.some(
                (c) => c.tanggal === wItem.tanggal && (c.namaIbadah || '').toLowerCase() === (wItem.namaIbadah || '').toLowerCase()
              );
              if (!exists) {
                combinedPelayananList.push({
                  ...wItem,
                  pelayanFirman: wItem.pelayanFirman || 'Pdt. Majelis Jemaat',
                });
              }
            });
        } else if (wartaDoc.beritaPelayananList && wartaDoc.beritaPelayananList.length > 0) {
          wartaDoc.beritaPelayananList
            .filter((wItem) => isDateIn1Week(wItem.tanggal))
            .forEach((wItem) => combinedPelayananList.push(wItem));
        }

        // Live synchronize Keuangan (strictly 1-week prior to warta publication date: [tanggalTerbit - 7 hari, tanggalTerbit])
        const wartaDateStr = wartaDoc.tanggalTerbit ? wartaDoc.tanggalTerbit.split('T')[0] : new Date().toISOString().split('T')[0];
        const wartaDateObj = new Date(wartaDateStr + 'T23:59:59');
        const startDateObj = new Date(wartaDateObj.getTime() - 7 * 24 * 3600 * 1000);
        const startDateStr = !isNaN(startDateObj.getTime())
          ? startDateObj.toISOString().split('T')[0]
          : wartaDateStr;

        const validKeuangan = (keuanganList || []).filter((k) => k.status !== 'pending' && k.status !== 'ditolak');

        // Filter transactions strictly within the 1-week window prior to warta publication
        const weeklyTransactions = validKeuangan.filter((k) => {
          const tgl = (k.tanggal || '').split('T')[0];
          return tgl >= startDateStr && tgl <= wartaDateStr;
        });

        // Transactions prior to startDateStr to establish opening balance
        const priorTransactions = validKeuangan.filter((k) => {
          const tgl = (k.tanggal || '').split('T')[0];
          return tgl < startDateStr;
        });
        const priorIn = priorTransactions.reduce((acc, curr) => (curr.jenis === 'pemasukan' ? acc + (curr.jumlah || curr.masuk || 0) : acc), 0);
        const priorOut = priorTransactions.reduce((acc, curr) => (curr.jenis === 'pengeluaran' ? acc + (curr.jumlah || curr.keluar || 0) : acc), 0);
        const calculatedWeeklySaldoAwal = (settings?.saldoAwalKasUmum || 0) + (priorIn - priorOut);

        const calculatedWeeklyIn = weeklyTransactions.reduce((acc, curr) => (curr.jenis === 'pemasukan' ? acc + (curr.jumlah || curr.masuk || 0) : acc), 0);
        const calculatedWeeklyOut = weeklyTransactions.reduce((acc, curr) => (curr.jenis === 'pengeluaran' ? acc + (curr.jumlah || curr.keluar || 0) : acc), 0);
        const calculatedWeeklySaldoAkhir = calculatedWeeklySaldoAwal + calculatedWeeklyIn - calculatedWeeklyOut;

        const posKasSummaryMap: Record<string, { pemasukan: number; pengeluaran: number; saldo: number }> = {};
        weeklyTransactions.forEach((k) => {
          const pos = k.posKas || 'Kas Umum Jemaat';
          if (!posKasSummaryMap[pos]) {
            posKasSummaryMap[pos] = { pemasukan: 0, pengeluaran: 0, saldo: 0 };
          }
          const inVal = k.jumlah || k.masuk || 0;
          const outVal = k.jumlah || k.keluar || 0;
          if (k.jenis === 'pemasukan') {
            posKasSummaryMap[pos].pemasukan += inVal;
          } else {
            posKasSummaryMap[pos].pengeluaran += outVal;
          }
          posKasSummaryMap[pos].saldo = posKasSummaryMap[pos].pemasukan - posKasSummaryMap[pos].pengeluaran;
        });

        const liveWeeklyPosKasList = Object.keys(posKasSummaryMap).map((k) => ({
          namaPos: k,
          pemasukan: posKasSummaryMap[k].pemasukan,
          pengeluaran: posKasSummaryMap[k].pengeluaran,
          saldo: posKasSummaryMap[k].saldo,
        }));

        const liveWeeklyTransactionsMapped = [...weeklyTransactions]
          .sort((a, b) => (b.tanggal || '').localeCompare(a.tanggal || ''))
          .map((k) => ({
            id: k.id || `tr-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            tanggal: k.tanggal || wartaDateStr,
            jenis: (k.jenis || (k.masuk ? 'pemasukan' : 'pengeluaran')) as 'pemasukan' | 'pengeluaran',
            namaPosKas: k.posKas || 'Kas Umum',
            kategori: k.kategori || 'Kas Jemaat',
            keterangan: k.keterangan || '-',
            jumlah: k.jumlah || k.masuk || k.keluar || 0,
          }));

        const displayKeuangan = {
          periodeJudul: wartaDoc.beritaKeuangan?.periodeJudul || `Rekapitulasi Kas Keuangan (${formatShortDate(startDateStr)} s.d ${formatShortDate(wartaDateStr)})`,
          tanggalMulai: wartaDoc.beritaKeuangan?.tanggalMulai || startDateStr,
          tanggalSelesai: wartaDoc.beritaKeuangan?.tanggalSelesai || wartaDateStr,
          saldoAwal: wartaDoc.beritaKeuangan?.saldoAwal ?? calculatedWeeklySaldoAwal,
          totalPemasukan: wartaDoc.beritaKeuangan?.totalPemasukan ?? calculatedWeeklyIn,
          totalPengeluaran: wartaDoc.beritaKeuangan?.totalPengeluaran ?? calculatedWeeklyOut,
          saldoAkhir: wartaDoc.beritaKeuangan?.saldoAkhir ?? calculatedWeeklySaldoAkhir,
          rincianPosKas: (wartaDoc.beritaKeuangan?.rincianPosKas && wartaDoc.beritaKeuangan.rincianPosKas.length > 0)
            ? wartaDoc.beritaKeuangan.rincianPosKas
            : liveWeeklyPosKasList,
          rincianTransaksiMingguIni: (wartaDoc.beritaKeuangan?.rincianTransaksiMingguIni && wartaDoc.beritaKeuangan.rincianTransaksiMingguIni.length > 0)
            ? wartaDoc.beritaKeuangan.rincianTransaksiMingguIni
            : liveWeeklyTransactionsMapped,
          catatanKeuangan: wartaDoc.beritaKeuangan?.catatanKeuangan || 'Rekapitulasi kas dan rincian transaksi 1 minggu sebelum terbit warta disinkronkan otomatis dari Kas Keuangan Jemaat.',
        };

        const activePosKasList = (displayKeuangan.rincianPosKas && displayKeuangan.rincianPosKas.length > 0)
          ? displayKeuangan.rincianPosKas
          : liveWeeklyPosKasList;

        return (
          <div className="space-y-6 text-xs text-slate-900 leading-normal font-sans">
            <KopSurat
              title="WARTA JEMAAT & BERITA PELAYANAN RESMI"
              subtitle={`Edisi: ${wartaDoc.nomorEdisi} • Tanggal: ${formatFullDate(wartaDoc.tanggalTerbit)}`}
            />

            <div className="text-center border-b-2 border-slate-900 pb-3">
              <h2 className="text-lg font-black uppercase tracking-wide text-slate-950 font-serif">
                {wartaDoc.judulWarta || 'WARTA JEMAAT GEREJA KALIMANTAN EVANGELIS'}
              </h2>
              <div className="flex flex-wrap items-center justify-center gap-3 text-xs font-bold text-slate-700 mt-1">
                <span className="bg-slate-200 px-2 py-0.5 rounded border border-slate-300 font-mono">
                  {wartaDoc.nomorEdisi}
                </span>
                <span>•</span>
                <span className="text-blue-950">Edisi Ibadah: {formatFullDate(wartaDoc.tanggalTerbit)}</span>
                <span>•</span>
                <span className="text-emerald-800">Status: {wartaDoc.status || 'Diterbitkan'}</span>
              </div>
            </div>

            {/* Tema & Nats Pembimbing */}
            <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-300 text-xs space-y-1.5 shadow-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <p>
                  <strong className="text-blue-950">Tema Khotbah:</strong> {wartaDoc.temaKhotbah || '-'}
                </p>
                <p>
                  <strong className="text-indigo-950">Nats Pembimbing:</strong> {wartaDoc.natsPembimbing || '-'}
                </p>
              </div>
              {wartaDoc.catatanGembala && (
                <p className="italic text-slate-800 pt-1.5 border-t border-slate-200 mt-1">
                  <strong>Pesan Pastoral Gembala Jemaat:</strong> "{wartaDoc.catatanGembala}"
                </p>
              )}
            </div>

            {/* BAGIAN I: JADWAL & PELAYANAN IBADAH RESMI GKE */}
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b-2 border-slate-800 pb-1">
                <h3 className="font-extrabold text-sm uppercase tracking-wide text-slate-950">
                  I. JADWAL IBADAH &amp; RINCIAN PETUGAS PELAYANAN RESMI GKE
                </h3>
                <span className="text-[11px] font-bold text-indigo-900 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                  Total {combinedPelayananList.length} Jadwal Ibadah Terjadwal
                </span>
              </div>

              {combinedPelayananList.length > 0 ? (
                <div className="space-y-4">
                  {/* TABEL RINGKASAN JADWAL PELAYANAN */}
                  <div className="space-y-1.5">
                    <p className="font-bold text-xs uppercase text-slate-800">
                      A. Tabel Ringkasan Jadwal Ibadah Mingguan
                    </p>
                    <table className="w-full text-xs text-left border-collapse border border-slate-400">
                      <thead>
                        <tr className="bg-slate-200 text-slate-950 font-bold border-b border-slate-400">
                          <th className="p-1.5 border border-slate-400 text-center w-7">No</th>
                          <th className="p-1.5 border border-slate-400 w-28">Hari, Tgl &amp; Jam</th>
                          <th className="p-1.5 border border-slate-400">Nama Ibadah &amp; Kategori</th>
                          <th className="p-1.5 border border-slate-400">Tempat &amp; Tuan Rumah</th>
                          <th className="p-1.5 border border-slate-400">Pelayan Firman</th>
                          <th className="p-1.5 border border-slate-400">Liturgos &amp; Petugas</th>
                        </tr>
                      </thead>
                      <tbody>
                        {combinedPelayananList.map((item, idx) => (
                          <tr key={item.id || idx} className="border-b border-slate-300 hover:bg-slate-50">
                            <td className="p-1.5 border border-slate-300 text-center font-bold">{idx + 1}</td>
                            <td className="p-1.5 border border-slate-300 font-medium whitespace-nowrap">
                              <div className="font-bold text-slate-900">{formatShortDate(item.tanggal)}</div>
                              <div className="text-[10px] text-blue-900 font-extrabold">{item.waktu || '09.00 WIB'}</div>
                            </td>
                            <td className="p-1.5 border border-slate-300">
                              <div className="font-bold text-slate-950">{item.namaIbadah}</div>
                              <div className="text-[10px] text-purple-900 font-semibold">
                                {item.kategoriIbadah || 'Umum'} {item.seksi ? `(Seksi ${item.seksi})` : item.rayon ? `(Rayon ${item.rayon})` : ''}
                              </div>
                            </td>
                            <td className="p-1.5 border border-slate-300">
                              <div className="font-medium text-slate-900">{item.tempat}</div>
                              {item.tuanRumah && (
                                <div className="text-[10px] text-emerald-800 font-bold">Kel. {item.tuanRumah}</div>
                              )}
                            </td>
                            <td className="p-1.5 border border-slate-300 font-semibold text-blue-950">
                              <div>{item.pelayanFirman}</div>
                              {item.natsKhotbah && (
                                <div className="text-[10px] text-indigo-900 italic font-normal">Nats: {item.natsKhotbah}</div>
                              )}
                            </td>
                            <td className="p-1.5 border border-slate-300 text-[11px]">
                              <div><strong>Liturgos:</strong> {item.liturgos || '-'}</div>
                              <div><strong>Pemusik:</strong> {item.pemusik || '-'} • <strong>Singer:</strong> {item.pemanduLagu || item.kantoria || '-'}</div>
                              {item.operatorMultimedia && (
                                <div><strong>Multimedia:</strong> {item.operatorMultimedia}</div>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* RINCIAN RESMI DETAIL PETUGAS PER IBADAH */}
                  <div className="space-y-3 pt-2">
                    <p className="font-bold text-xs uppercase text-slate-800 border-b border-slate-300 pb-1">
                      B. Rincian Lengkap Petugas Tata Ibadah &amp; Pelayanan
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {combinedPelayananList.map((item, idx) => (
                        <div
                          key={item.id || idx}
                          className="border border-slate-400 rounded-lg p-3 bg-white space-y-2 shadow-xs"
                        >
                          {/* Card Header: 1. Tanggal, 2. Waktu, 3. Nama Kebaktian */}
                          <div className="border-b border-slate-300 pb-1.5 flex justify-between items-start gap-2">
                            <div>
                              <span className="text-[10px] font-black text-white bg-slate-900 px-1.5 py-0.5 rounded mr-1.5">
                                #{idx + 1}
                              </span>
                              <strong className="text-xs font-bold text-slate-950">
                                {item.namaIbadah}
                              </strong>
                              <p className="text-[10px] font-semibold text-purple-900">
                                {item.kategoriIbadah || 'Umum'} {item.seksi ? `(Seksi ${item.seksi})` : item.rayon ? `(Rayon ${item.rayon})` : ''}
                              </p>
                            </div>
                            <div className="text-right text-[11px] whitespace-nowrap">
                              <span className="font-bold text-blue-950 block">{formatShortDate(item.tanggal)}</span>
                              <span className="font-extrabold text-indigo-900 text-[10px]">{item.waktu || '09.00 WIB'}</span>
                            </div>
                          </div>

                          {/* 4. Tempat & Tuan Rumah */}
                          <div className="bg-slate-50 p-2 rounded border border-slate-200 text-[11px] space-y-0.5">
                            <p>
                              <strong>Tempat Pelaksanaan:</strong> {item.tempat}
                            </p>
                            {item.tuanRumah && (
                              <p className="text-emerald-900 font-bold">
                                <strong>Tuan Rumah:</strong> Keluarga {item.tuanRumah}
                              </p>
                            )}
                          </div>

                          {/* 5. Pelayan Firman, 6. Nats, 7. Liturgos, 8. Pembacaan Alkitab */}
                          <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px] pt-1">
                            <div>
                              <span className="text-slate-500 font-bold block text-[9px] uppercase">Pelayan Firman (Pengkhotbah)</span>
                              <span className="font-bold text-blue-950">{item.pelayanFirman}</span>
                            </div>
                            <div>
                              <span className="text-slate-500 font-bold block text-[9px] uppercase">Liturgos / Penuntun</span>
                              <span className="font-semibold text-slate-900">{item.liturgos || '-'}</span>
                            </div>
                            <div>
                              <span className="text-slate-500 font-bold block text-[9px] uppercase">Nats Khotbah / Tema</span>
                              <span className="font-medium text-slate-900">{item.natsKhotbah || item.pembacaanAlkitab || '-'}</span>
                            </div>
                            <div>
                              <span className="text-slate-500 font-bold block text-[9px] uppercase">Pembacaan Alkitab</span>
                              <span className="font-medium text-slate-900">{item.pembacaanAlkitab || '-'}</span>
                            </div>
                          </div>

                          {/* 9. Koordinator, 10. Kolektan, 11. Pemusik, 12. Singer */}
                          <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px] pt-1 border-t border-slate-200">
                            <div>
                              <span className="text-slate-500 font-bold block text-[9px] uppercase">Koordinator Pelayanan</span>
                              <span className="text-slate-800">{item.koordinatorPelayanan || '-'}</span>
                            </div>
                            <div>
                              <span className="text-slate-500 font-bold block text-[9px] uppercase">Kolektan &amp; Tamu</span>
                              <span className="text-slate-800">{item.kolektan || item.penerimaTamu || '-'}</span>
                            </div>
                            <div>
                              <span className="text-slate-500 font-bold block text-[9px] uppercase">Pemusik / Organis</span>
                              <span className="text-slate-800">{item.pemusik || '-'}</span>
                            </div>
                            <div>
                              <span className="text-slate-500 font-bold block text-[9px] uppercase">Singer / Pemandu Lagu</span>
                              <span className="text-slate-800">{item.pemanduLagu || item.kantoria || '-'}</span>
                            </div>
                          </div>

                          {/* 13. Multimedia, 14. Pewarta, 15. Kupon & Warta Khusus */}
                          {(item.operatorMultimedia || item.pewartaBerita || item.kuponUndian || item.wartaKhusus || item.keteranganKhusus) && (
                            <div className="bg-amber-50/60 p-2 rounded border border-amber-200 text-[10px] space-y-0.5 text-slate-800">
                              {item.operatorMultimedia && (
                                <p><strong>Operator Multimedia &amp; Sound:</strong> {item.operatorMultimedia}</p>
                              )}
                              {item.pewartaBerita && (
                                <p><strong>Pewarta Berita Jemaat:</strong> {item.pewartaBerita}</p>
                              )}
                              {item.kuponUndian && (
                                <p className="text-amber-950 font-bold"><strong>Kupon / Undian:</strong> {item.kuponUndian}</p>
                              )}
                              {(item.wartaKhusus || item.keteranganKhusus) && (
                                <p className="italic"><strong>Warta Khusus / Catatan:</strong> {item.wartaKhusus || item.keteranganKhusus}</p>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-slate-50 border border-slate-300 rounded text-center text-slate-500 italic">
                  Belum ada jadwal ibadah yang terdaftar. Data dapat diisi melalui Modul Jadwal Ibadah &amp; Liturgi.
                </div>
              )}
            </div>

            {/* BAGIAN II: REKAPITULASI KEUANGAN KAS JEMAAT */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between border-b-2 border-slate-800 pb-1">
                <h3 className="font-extrabold text-sm uppercase tracking-wide text-slate-950">
                  II. REKAPITULASI KEUANGAN KAS JEMAAT
                </h3>
                <span className="text-[11px] font-bold text-slate-700">
                  {displayKeuangan.periodeJudul}
                </span>
              </div>

              {/* Table A: Rincian per Pos Kas */}
              <div className="space-y-1.5">
                <p className="font-bold text-xs uppercase text-slate-800">A. Rekapitulasi Saldo per Pos Kas Jemaat</p>
                <table className="w-full text-left border-collapse border border-slate-400 text-xs">
                  <thead>
                    <tr className="bg-slate-200 font-bold border-b border-slate-400 text-slate-950">
                      <th className="p-2 border border-slate-400">Pos Kas Jemaat</th>
                      <th className="p-2 border border-slate-400 text-right">Pemasukan (Rp)</th>
                      <th className="p-2 border border-slate-400 text-right">Pengeluaran (Rp)</th>
                      <th className="p-2 border border-slate-400 text-right">Saldo Kas (Rp)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activePosKasList.map((pos, pIdx) => (
                      <tr key={pIdx} className="border-b border-slate-300 hover:bg-slate-50">
                        <td className="p-2 border border-slate-300 font-semibold">{pos.namaPos}</td>
                        <td className="p-2 border border-slate-300 text-right font-mono text-emerald-900 font-medium">
                          Rp {pos.pemasukan.toLocaleString('id-ID')}
                        </td>
                        <td className="p-2 border border-slate-300 text-right font-mono text-rose-900 font-medium">
                          Rp {pos.pengeluaran.toLocaleString('id-ID')}
                        </td>
                        <td className="p-2 border border-slate-300 text-right font-mono font-bold text-slate-950">
                          Rp {pos.saldo.toLocaleString('id-ID')}
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-slate-200 font-extrabold border-t-2 border-slate-500 text-slate-950">
                      <td className="p-2 border border-slate-400">TOTAL KAS GEREJA</td>
                      <td className="p-2 border border-slate-400 text-right font-mono text-emerald-950">
                        Rp {(displayKeuangan.totalPemasukan ?? 0).toLocaleString('id-ID')}
                      </td>
                      <td className="p-2 border border-slate-400 text-right font-mono text-rose-950">
                        Rp {(displayKeuangan.totalPengeluaran ?? 0).toLocaleString('id-ID')}
                      </td>
                      <td className="p-2 border border-slate-400 text-right font-mono text-blue-950 text-sm">
                        Rp {(displayKeuangan.saldoAkhir ?? 0).toLocaleString('id-ID')}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Table B: Rincian Transaksi Pemasukan & Pengeluaran Minggu Ini */}
              <div className="mt-3 space-y-1.5">
                <div className="flex items-center justify-between">
                  <p className="font-bold text-xs uppercase text-slate-800">
                    B. Rincian Transaksi Penerimaan &amp; Pengeluaran Kas Minggu Ini
                  </p>
                  <span className="text-[10px] text-slate-600 font-medium">
                    Periode: {formatShortDate(displayKeuangan.tanggalMulai)} s.d {formatShortDate(displayKeuangan.tanggalSelesai)}
                  </span>
                </div>
                {displayKeuangan.rincianTransaksiMingguIni && displayKeuangan.rincianTransaksiMingguIni.length > 0 ? (
                  <table className="w-full text-left border-collapse border border-slate-400 text-[11px]">
                    <thead>
                      <tr className="bg-slate-200 font-bold border-b border-slate-400 text-slate-950">
                        <th className="p-1.5 border border-slate-400 text-center w-8">No</th>
                        <th className="p-1.5 border border-slate-400 w-24">Tanggal</th>
                        <th className="p-1.5 border border-slate-400 w-28">Pos Kas</th>
                        <th className="p-1.5 border border-slate-400">Kategori &amp; Keterangan Transaksi</th>
                        <th className="p-1.5 border border-slate-400 text-right w-28">Pemasukan (Rp)</th>
                        <th className="p-1.5 border border-slate-400 text-right w-28">Pengeluaran (Rp)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {displayKeuangan.rincianTransaksiMingguIni.map((tr, trIdx) => (
                        <tr key={tr.id || trIdx} className="border-b border-slate-300 hover:bg-slate-50">
                          <td className="p-1.5 border border-slate-300 text-center font-bold">{trIdx + 1}</td>
                          <td className="p-1.5 border border-slate-300 font-mono">{tr.tanggal}</td>
                          <td className="p-1.5 border border-slate-300 font-semibold text-slate-800">{tr.namaPosKas || 'Kas Umum'}</td>
                          <td className="p-1.5 border border-slate-300">
                            <span className="font-bold block text-slate-900">{tr.kategori}</span>
                            <span className="text-slate-600">{tr.keterangan}</span>
                          </td>
                          <td className="p-1.5 border border-slate-300 text-right font-mono text-emerald-800 font-semibold">
                            {tr.jenis === 'pemasukan' ? tr.jumlah.toLocaleString('id-ID') : '-'}
                          </td>
                          <td className="p-1.5 border border-slate-300 text-right font-mono text-rose-800 font-semibold">
                            {tr.jenis === 'pengeluaran' ? tr.jumlah.toLocaleString('id-ID') : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="p-2.5 bg-slate-50 border border-slate-300 rounded text-center text-[10px] text-slate-600 italic">
                    Tidak ada catatan transaksi penerimaan atau pengeluaran kas pada periode 1 minggu sebelum terbit warta ({formatShortDate(displayKeuangan.tanggalMulai)} s.d {formatShortDate(displayKeuangan.tanggalSelesai)}).
                  </p>
                )}
              </div>

              {displayKeuangan.catatanKeuangan && (
                <p className="italic text-[11px] text-slate-700 bg-slate-50 p-2 rounded border border-slate-200">
                  <strong>Catatan Keuangan:</strong> {displayKeuangan.catatanKeuangan}
                </p>
              )}

              {/* Kotak QRIS Persembahan Digital di Warta Cetak */}
              <div className="mt-3 p-3.5 border-2 border-dashed border-slate-400 rounded-lg bg-slate-50 flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <p className="font-extrabold text-xs uppercase tracking-tight text-slate-950">
                    PERSEMBAHAN DIGITAL QRIS &amp; REKENING RESMI JEMAAT
                  </p>
                  <p className="text-[11px] text-slate-700 leading-relaxed">
                    Scan kode QRIS di samping menggunakan Mobile Banking (BCA, Mandiri, BRI, BNI), GoPay, OVO, DANA, LinkAja, atau ShopeePay untuk Persembahan Minggu, Perpuluhan, Ucapan Syukur &amp; Pembangunan.
                  </p>
                  <div className="text-[10px] text-slate-600 font-mono space-y-0.5 pt-0.5">
                    <p>• Merchant: <strong>{settings.qrisMerchantName || settings.namaJemaat || 'MAJELIS JEMAAT GKE'}</strong></p>
                    <p>• Rekening BCA: <strong>{settings.bankAccountBca || '782-0192-331'}</strong></p>
                    <p>• No. Kontak / Konfirmasi: <strong>{settings.gopayAccountNumber || '0812-5566-7788'}</strong> (a.n. Bendahara)</p>
                  </div>
                </div>
                <div className="flex-shrink-0 text-center border-2 border-slate-800 p-1.5 bg-white rounded-lg shadow-sm">
                  <img
                    src={getQrisImageSource(settings)}
                    alt="QRIS Persembahan Digital"
                    className="w-24 h-24 object-contain mx-auto"
                  />
                  <span className="block text-[9px] font-black text-slate-900 tracking-tighter mt-0.5 uppercase">
                    QRIS • GoPay • Bank
                  </span>
                </div>
              </div>
            </div>

            {/* BAGIAN III: WARTA SUKACITA ULANG TAHUN */}
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between border-b-2 border-slate-800 pb-1">
                <h3 className="font-extrabold text-sm uppercase tracking-wide text-slate-950">
                  III. WARTA SUKACITA ULANG TAHUN KELAHIRAN &amp; PERNIKAHAN
                </h3>
              </div>

              {wartaDoc.beritaUlangTahunList && wartaDoc.beritaUlangTahunList.length > 0 ? (
                <table className="w-full text-left border-collapse border border-slate-400 text-xs">
                  <thead>
                    <tr className="bg-slate-200 font-bold border-b border-slate-400 text-slate-950">
                      <th className="p-1.5 border border-slate-400 text-center w-8">No</th>
                      <th className="p-1.5 border border-slate-400 w-36">Kategori Sukacita</th>
                      <th className="p-1.5 border border-slate-400">Nama Anggota / Pasangan Keluarga</th>
                      <th className="p-1.5 border border-slate-400">Rayon / Lingkungan</th>
                      <th className="p-1.5 border border-slate-400 w-28">Tanggal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {wartaDoc.beritaUlangTahunList.map((ut, idx) => {
                      const isNikah = String(ut.jenis || (ut as any).jenisUlangTahun || '').toLowerCase().includes('nikah');
                      const nama = ut.nama || (ut as any).namaLengkap || 'Warga Jemaat';
                      const rayon = ut.rayon || (ut as any).lingkungan || '-';
                      const tgl = ut.tanggal || (ut as any).tanggalLahir || (ut as any).tanggalPernikahan || '-';
                      return (
                        <tr key={ut.id || idx} className="border-b border-slate-300 hover:bg-slate-50">
                          <td className="p-1.5 border border-slate-300 text-center font-bold">{idx + 1}</td>
                          <td className="p-1.5 border border-slate-300 font-semibold text-blue-950">
                            {isNikah ? 'Ultah Pernikahan' : 'Ultah Kelahiran'}
                          </td>
                          <td className="p-1.5 border border-slate-300 font-bold text-slate-950">{nama}</td>
                          <td className="p-1.5 border border-slate-300">{rayon}</td>
                          <td className="p-1.5 border border-slate-300 font-medium">
                            {formatShortDate(tgl)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <p className="italic text-slate-500 p-2 bg-slate-50 border border-slate-200 rounded">
                  Tidak ada warta ulang tahun minggu ini.
                </p>
              )}
            </div>

            {/* BAGIAN IV: BERITA TAMBAHAN (DUKA, PERNIKAHAN & PENGUMUMAN) */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between border-b-2 border-slate-800 pb-1">
                <h3 className="font-extrabold text-sm uppercase tracking-wide text-slate-950">
                  IV. BERITA TAMBAHAN (DUKA, PERNIKAHAN &amp; PENGUMUMAN MAJELIS)
                </h3>
              </div>

              {/* Duka */}
              {wartaDoc.beritaDukaList && wartaDoc.beritaDukaList.length > 0 && (
                <div className="space-y-1.5">
                  <h4 className="font-bold text-xs uppercase text-slate-900 border-b border-slate-300 pb-0.5">
                    A. Berita Duka &amp; Belasungkawa:
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {wartaDoc.beritaDukaList.map((d, dIdx) => {
                      const nama = (d as any).namaMeninggal || (d as any).namaAlmarhum || (d as any).nama || 'Almarhum/ah';
                      const usia = (d as any).usia ? `(${(d as any).usia} Thn)` : '';
                      const rayon = (d as any).rayon || (d as any).lingkungan ? ` - ${(d as any).rayon || (d as any).lingkungan}` : '';
                      const tglMeninggal = (d as any).tanggalMeninggal || (d as any).tglMeninggal || '-';
                      const pemakaman = (d as any).jadwalPemakaman || (d as any).pemakaman || '-';
                      const keluarga = (d as any).keluargaYangBerduka || (d as any).keluarga || '-';

                      return (
                        <div key={d.id || dIdx} className="p-2.5 bg-slate-50 border-l-4 border-slate-800 rounded border border-slate-200 space-y-0.5 text-xs">
                          <p className="font-bold text-slate-950">{nama} {usia}{rayon}</p>
                          <p><strong>Meninggal:</strong> {formatFullDate(tglMeninggal)} | <strong>Pemakaman:</strong> {pemakaman}</p>
                          <p><strong>Keluarga Berduka:</strong> {keluarga}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Nikah */}
              {wartaDoc.undanganPernikahanList && wartaDoc.undanganPernikahanList.length > 0 && (
                <div className="space-y-1.5">
                  <h4 className="font-bold text-xs uppercase text-indigo-950 border-b border-slate-300 pb-0.5">
                    B. Warta Peneguhan &amp; Pemberkatan Nikah Kudus:
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {wartaDoc.undanganPernikahanList.map((n, nIdx) => {
                      const pria = (n as any).namaMempelaiPria || (n as any).mempelaiPria || 'Mempelai Pria';
                      const wanita = (n as any).namaMempelaiWanita || (n as any).mempelaiWanita || 'Mempelai Wanita';
                      const tgl = (n as any).tanggalPemberkatan || (n as any).tglPemberkatan || '-';
                      const jam = (n as any).waktuPemberkatan || (n as any).jamPemberkatan || (n as any).jam || '';
                      const tempat = (n as any).tempatGereja || (n as any).tempatPemberkatan || (n as any).tempat || settings.namaJemaat;
                      const ket = (n as any).keterangan || '-';

                      return (
                        <div key={n.id || nIdx} className="p-2.5 bg-indigo-50/60 border-l-4 border-indigo-800 rounded border border-indigo-200 space-y-0.5 text-xs">
                          <p className="font-bold text-indigo-950">{pria} &amp; {wanita}</p>
                          <p><strong>Pemberkatan:</strong> {formatFullDate(tgl)} {jam ? `Pukul ${jam}` : ''} di {tempat}</p>
                          <p><strong>Keterangan:</strong> {ket}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Pengumuman */}
              {wartaDoc.beritaTambahanList && wartaDoc.beritaTambahanList.length > 0 && (
                <div className="space-y-1.5">
                  <h4 className="font-bold text-xs uppercase text-slate-900 border-b border-slate-300 pb-0.5">
                    C. Pengumuman &amp; Informasi Majelis Jemaat:
                  </h4>
                  <div className="space-y-2">
                    {wartaDoc.beritaTambahanList.map((p, pIdx) => (
                      <div key={p.id || pIdx} className="p-2.5 bg-slate-50 border-l-4 border-blue-800 rounded border border-slate-200 space-y-0.5 text-xs">
                        <p className="font-bold text-blue-950">{(p as any).judul || 'Pengumuman'} ({(p as any).kategori || 'Umum'})</p>
                        <p className="text-slate-800 leading-relaxed">{(p as any).isi || (p as any).keterangan || '-'}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* MANDATORY SIGNED BY SEKRETARIS & KETUA JEMAAT */}
            <div className="pt-4">
              <SignatureBlock signers={['sekretaris', 'ketua']} />
            </div>
          </div>
        );
      }

      case 'qris_banner': {
        const merchantName = settings.qrisMerchantName || settings.namaJemaat || 'MAJELIS JEMAAT GKE';
        const nmid = settings.qrisNmid || 'ID1025453826063';
        const qrImageSrc = getQrisImageSource(settings, 0);

        return (
          <div className="flex flex-col items-center justify-center p-6 text-center space-y-6 max-w-2xl mx-auto border-4 border-slate-900 rounded-3xl bg-white shadow-2xl print:border-4 print:p-8">
            <KopSurat
              title="PERSEMBAHAN DIGITAL & DONASI JEMAAT"
              subtitle="QRIS Resmi Majelis Jemaat Gereja Kalimantan Evangelis"
            />

            <div className="w-full bg-slate-900 text-white py-3 px-4 rounded-xl shadow-md">
              <span className="text-xs tracking-widest font-mono text-emerald-400 font-bold uppercase block">
                PAPAN PETUNJUK BARCODE QRIS RESMI
              </span>
              <h2 className="text-xl font-black uppercase text-white mt-0.5">
                {merchantName}
              </h2>
              <p className="text-xs text-slate-300 font-mono mt-0.5">
                NMID: <span className="font-bold text-emerald-300">{nmid}</span>
              </p>
            </div>

            <div className="inline-flex items-center justify-center px-6 py-2 bg-slate-100 border-2 border-slate-900 rounded-xl">
              <span className="text-2xl font-black text-slate-900 tracking-tighter italic font-serif">
                QRIS
              </span>
              <span className="ml-2 text-xs font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300 uppercase">
                GPN • RESMI MAJELIS GKE
              </span>
            </div>

            <div className="p-4 bg-white border-4 border-slate-900 rounded-2xl shadow-xl inline-block">
              <img
                src={qrImageSrc}
                alt="QRIS Standee Banner"
                className="w-72 h-72 sm:w-80 sm:h-80 object-contain mx-auto rounded-lg"
                referrerPolicy="no-referrer"
              />
            </div>

            <div className="w-full max-w-lg bg-slate-50 border border-slate-300 p-4 rounded-2xl text-left text-xs space-y-2">
              <p className="font-bold text-slate-900 text-center text-sm border-b border-slate-300 pb-1">
                Dapat Di-Scan Menggunakan Seluruh Aplikasi M-Banking & e-Wallet:
              </p>
              <div className="grid grid-cols-2 gap-2 font-medium text-slate-700">
                <p>✓ BCA Mobile / Livin Mandiri</p>
                <p>✓ GoPay / OVO / DANA</p>
                <p>✓ BRImo / BNI Mobile Banking</p>
                <p>✓ ShopeePay / LinkAja / Sakuku</p>
              </div>
            </div>

            {(settings.gopayAccountNumber || settings.bankAccountBca || settings.bankAccountMandiri) && (
              <div className="w-full max-w-lg bg-emerald-50 border border-emerald-300 p-3 rounded-xl text-xs text-slate-800 space-y-1 text-left font-mono">
                <p className="font-bold text-emerald-900 font-sans border-b border-emerald-200 pb-0.5">
                  Alternatif Transfer Direct Rekening / No. HP:
                </p>
                {settings.gopayAccountNumber && (
                  <p>• GoPay / QRIS HP: <span className="font-bold">{settings.gopayAccountNumber}</span> ({settings.gopayAccountName || 'GKE'})</p>
                )}
                {settings.bankAccountBca && (
                  <p>• Bank BCA: <span className="font-bold">{settings.bankAccountBca}</span></p>
                )}
                {settings.bankAccountMandiri && (
                  <p>• Bank Mandiri: <span className="font-bold">{settings.bankAccountMandiri}</span></p>
                )}
              </div>
            )}

            <div className="text-xs italic text-slate-500 font-serif">
              "Hendaklah masing-masing memberikan menurut kerelaan hatinya, jangan dengan sedih hati atau karena paksaan, sebab Allah mengasihi orang yang memberi dengan sukacita." (2 Korintus 9:7)
            </div>

            <SignatureBlock signers={['bendahara', 'ketua']} />
          </div>
        );
      }

      case 'jadwal_katekisasi': {
        return (
          <div className="space-y-6 text-slate-800">
            <KopSurat
              title="JADWAL PROGRAM KATEKISASI PERNIKAHAN & SIDI"
              subtitle="Majelis Jemaat Gereja Kalimantan Evangelis (GKE)"
            />

            <div className="text-center font-bold text-sm border-b pb-2 text-slate-900 uppercase">
              DAFTAR JADWAL KATEKISASI PRA-NIKAH & PENEGUHAN SIDI
            </div>

            <table className="w-full text-xs border-collapse border border-slate-300">
              <thead>
                <tr className="bg-slate-100 font-bold text-slate-800 text-left">
                  <th className="border border-slate-300 p-2 text-center w-8">No</th>
                  <th className="border border-slate-300 p-2">Kategori & Program</th>
                  <th className="border border-slate-300 p-2">Materi Bahasan</th>
                  <th className="border border-slate-300 p-2">Pengajar / Pembimbing</th>
                  <th className="border border-slate-300 p-2">Waktu & Tempat</th>
                  <th className="border border-slate-300 p-2">Peserta / Sasaran</th>
                  <th className="border border-slate-300 p-2 text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {jadwalKatekisasiList.map((item, index) => (
                  <tr key={item.id} className="border-b border-slate-200 hover:bg-slate-50">
                    <td className="border border-slate-300 p-2 text-center">{index + 1}</td>
                    <td className="border border-slate-300 p-2 font-bold">
                      <span className={`inline-block px-1.5 py-0.5 text-[10px] uppercase font-bold rounded mr-1 ${item.kategori === 'sidi' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                        {item.kategori.toUpperCase()}
                      </span>
                      <div>{item.judulProgram}</div>
                      {item.jumlahPertemuan && <div className="text-[10px] text-slate-500 font-normal">{item.jumlahPertemuan}</div>}
                    </td>
                    <td className="border border-slate-300 p-2">{item.materiBahasan}</td>
                    <td className="border border-slate-300 p-2 font-medium">{item.pengajar}</td>
                    <td className="border border-slate-300 p-2 whitespace-nowrap">
                      <div className="font-semibold">{formatIndonesianDate(item.tanggal)}</div>
                      <div className="text-slate-600">{item.waktu}</div>
                      <div className="text-slate-500 italic">{item.tempat}</div>
                    </td>
                    <td className="border border-slate-300 p-2">
                      <div className="font-medium">{item.pesertaTarget}</div>
                      {item.keterangan && (
                        <div className="mt-1 text-[10px] text-emerald-900 bg-emerald-50 border border-emerald-200 p-1.5 rounded leading-normal">
                          <strong className="block text-emerald-950 font-semibold mb-0.5">Kelulusan & Sakramen:</strong>
                          <span className="whitespace-pre-line">{item.keterangan}</span>
                        </div>
                      )}
                    </td>
                    <td className="border border-slate-300 p-2 text-center font-bold">
                      {item.status}
                    </td>
                  </tr>
                ))}
                {jadwalKatekisasiList.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-4 text-center text-slate-500 italic">
                      Belum ada jadwal katekisasi yang tercatat.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            <SignatureBlock signers={['sekretaris', 'ketua']} />
          </div>
        );
      }

      case 'pelayanan_baptis': {
        const filteredBaptis = (pelayananSakramenList || []).filter((s) => s.jenisPelayanan === 'baptis');
        const item =
          filteredBaptis.find((s) => s.id === localSakramenId) ||
          filteredBaptis.find((s) => s.id === printConfig.sakramenId) ||
          (localSakramenId ? pelayananSakramenList.find((s) => s.id === localSakramenId) : null) ||
          filteredBaptis[0] ||
          pelayananSakramenList[0];

        if (!item) {
          return (
            <div className="max-w-xl mx-auto p-8 my-8 text-center bg-white rounded-xl border border-slate-200 shadow-sm font-sans">
              <AlertCircle className="w-12 h-12 text-blue-500 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-900 mb-1">Belum Ada Data Pelayanan Baptis</h3>
              <p className="text-xs text-slate-600 mb-4">
                Belum ada data input Surat Baptisan Kudus. Silakan tambahkan data melalui modul <strong>Pelayanan Sakramen</strong> terlebih dahulu untuk mencetak dokumen ini.
              </p>
            </div>
          );
        }

        const activeLogo = settings.logoUrl || settings.logoGkeUrl || defaultGkeLogo;
        const majelis = item.majelisJemaat ? item.majelisJemaat.trim() : formatMajelisJemaatText(settings.namaJemaat);
        const resort = item.resortGke ? item.resortGke.trim() : formatResortGkeText(settings.resortGke);

        return (
          <div className="max-w-3xl mx-auto p-8 border-4 border-double border-slate-800 rounded-sm bg-white font-serif text-slate-900 relative">
            {/* Header / Kop Certificate */}
            <div className="text-center border-b-2 border-slate-900 pb-4 mb-6">
              <div className="flex items-center justify-center gap-4 mb-2">
                <img
                  src={activeLogo}
                  alt="Logo GKE"
                  className="w-16 h-16 object-contain"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = defaultGkeLogo;
                  }}
                />
                <div>
                  <h3 className="text-sm font-bold tracking-widest uppercase text-slate-800">
                    GEREJA KALIMANTAN EVANGELIS
                  </h3>
                  <p className="text-[11px] font-bold tracking-wider text-slate-700 uppercase">
                    (ANGGOTA PGI)
                  </p>
                  <h1 className="text-xl font-extrabold tracking-wider text-blue-950 mt-1 uppercase border-t border-b border-slate-400 py-0.5 px-4 inline-block">
                    SURAT BAPTISAN KUDUS
                  </h1>
                </div>
              </div>

              <div className="mt-2 text-xs font-mono font-bold text-slate-800">
                No. : <span className="underline">{item.noSuratResmi || '-'}</span>
              </div>

              <div className="mt-3 flex justify-between items-center text-xs font-semibold px-4 border-t border-slate-200 pt-2">
                <div>Majelis Jemaat : <span className="font-bold">{majelis}</span></div>
                <div>Resort : <span className="font-bold">{resort}</span></div>
              </div>
            </div>

            {/* Menerangkan bahwa */}
            <div className="text-xs leading-relaxed space-y-4 px-4 my-6">
              <p className="font-semibold italic text-center text-sm">
                Dengan ini menerangkan, bahwa :
              </p>

              <div className="space-y-2 border-l-2 border-slate-300 pl-4 py-1">
                <div className="grid grid-cols-12 gap-2">
                  <span className="col-span-4 font-bold text-slate-700">Nama</span>
                  <span className="col-span-1 text-center font-bold">:</span>
                  <span className="col-span-7 font-extrabold text-slate-950 text-sm uppercase">
                    {item.namaUtama || '-'}
                  </span>
                </div>

                <div className="grid grid-cols-12 gap-2">
                  <span className="col-span-4 font-bold text-slate-700">Tempat/Tgl. Lahir</span>
                  <span className="col-span-1 text-center font-bold">:</span>
                  <span className="col-span-7 font-bold text-slate-900">
                    {item.tempatTanggalLahir || '-'}
                  </span>
                </div>

                <div className="grid grid-cols-12 gap-2">
                  <span className="col-span-4 font-bold text-slate-700">Nama : Ayah</span>
                  <span className="col-span-1 text-center font-bold">:</span>
                  <span className="col-span-7 font-semibold text-slate-900">
                    {item.namaAyah || '-'}
                  </span>
                </div>

                <div className="grid grid-cols-12 gap-2">
                  <span className="col-span-4 font-bold text-slate-700">Ibu</span>
                  <span className="col-span-1 text-center font-bold">:</span>
                  <span className="col-span-7 font-semibold text-slate-900">
                    {item.namaIbu || '-'}
                  </span>
                </div>
              </div>

              {/* Deklarasi Baptisan */}
              <div className="text-center my-6 py-2 border-y border-slate-200">
                <p className="font-bold text-slate-900 text-sm italic">
                  Sudah menerima Baptisan Kudus sesuai dengan peraturan Gereja Kalimantan Evangelis
                </p>
              </div>

              {/* Tanggal & Saksi */}
              <div className="space-y-2 border-l-2 border-slate-300 pl-4 py-1">
                <div className="grid grid-cols-12 gap-2">
                  <span className="col-span-4 font-bold text-slate-700">Hari / Tanggal</span>
                  <span className="col-span-1 text-center font-bold">:</span>
                  <span className="col-span-7 font-bold text-slate-900">
                    {item.tanggalPelayanan ? formatIndonesianDate(item.tanggalPelayanan) : '-'}
                  </span>
                </div>

                <div className="grid grid-cols-12 gap-2">
                  <span className="col-span-4 font-bold text-slate-700">Saksi - saksi</span>
                  <span className="col-span-1 text-center font-bold">:</span>
                  <span className="col-span-7 font-medium text-slate-900">
                    1. {item.saksi1 || '-'}
                    <br />
                    2. {item.saksi2 || '-'}
                  </span>
                </div>
              </div>

              {/* Yang Melaksanakan Baptisan Kudus */}
              <div className="mt-6 space-y-2 border-l-2 border-amber-400 pl-4 py-2 bg-amber-50/40 rounded-r">
                <p className="font-bold text-slate-900 uppercase text-xs tracking-wider">
                  Yang melaksanakan Baptisan Kudus :
                </p>
                <div className="grid grid-cols-12 gap-2">
                  <span className="col-span-4 font-bold text-slate-700">Nama</span>
                  <span className="col-span-1 text-center font-bold">:</span>
                  <span className="col-span-7 font-bold text-slate-950">
                    {item.pelayanFirman || '-'}
                  </span>
                </div>
                <div className="grid grid-cols-12 gap-2">
                  <span className="col-span-4 font-bold text-slate-700">Jabatan</span>
                  <span className="col-span-1 text-center font-bold">:</span>
                  <span className="col-span-7 font-semibold text-slate-800">
                    {item.jabatanPelayan || 'Pendeta Jemaat GKE'}
                  </span>
                </div>
                <div className="grid grid-cols-12 gap-2">
                  <span className="col-span-4 font-bold text-slate-700">Nas Khotbah</span>
                  <span className="col-span-1 text-center font-bold">:</span>
                  <span className="col-span-7 font-bold text-indigo-950">
                    {item.nasKhotbah || '-'}
                  </span>
                </div>
                {item.isiNasKhotbah && (
                  <p className="italic text-slate-800 text-[11px] mt-1 pl-1 font-serif border-t border-amber-200 pt-1">
                    "{item.isiNasKhotbah}"
                  </p>
                )}
              </div>
            </div>

            {/* Signature Block */}
            <div className="mt-8 pt-4 border-t border-slate-300 text-xs px-4">
              <div className="text-right mb-6">
                <p>Dikeluarkan di : <strong className="underline">{item.tempatDikeluarkan || settings.tempatDiterbitkan || settings.namaJemaat || '-'}</strong></p>
                <p>Pada tanggal : <strong className="underline">{item.tanggalDikeluarkan || item.tanggalPelayanan ? formatIndonesianDate(item.tanggalDikeluarkan || item.tanggalPelayanan) : '-'}</strong></p>
              </div>

              <div className="text-center mb-2 font-bold text-slate-900 uppercase">
                {majelis}
              </div>

              <div className="grid grid-cols-2 gap-8 text-center mt-4">
                <div>
                  <p className="font-bold text-slate-800">Ketua,</p>
                  <div className="h-16 flex items-center justify-center italic text-slate-400 text-[10px]">
                    (Tanda Tangan & Cap Majelis)
                  </div>
                  <p className="font-bold underline text-slate-950 uppercase">
                    {item.ketuaMajelis || settings.namaKetuaJemaat || '-'}
                  </p>
                </div>

                <div>
                  <p className="font-bold text-slate-800">Sekretaris,</p>
                  <div className="h-16 flex items-center justify-center italic text-slate-400 text-[10px]">
                    (Tanda Tangan & Cap Majelis)
                  </div>
                  <p className="font-bold underline text-slate-950 uppercase">
                    {item.sekretarisMajelis || settings.namaSekretaris || '-'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        );
      }

      case 'pelayanan_sidi': {
        const filteredSidi = (pelayananSakramenList || []).filter((s) => s.jenisPelayanan === 'sidi');
        const item =
          filteredSidi.find((s) => s.id === localSakramenId) ||
          filteredSidi.find((s) => s.id === printConfig.sakramenId) ||
          (localSakramenId ? pelayananSakramenList.find((s) => s.id === localSakramenId) : null) ||
          filteredSidi[0] ||
          pelayananSakramenList[0];

        if (!item) {
          return (
            <div className="max-w-xl mx-auto p-8 my-8 text-center bg-white rounded-xl border border-slate-200 shadow-sm font-sans">
              <AlertCircle className="w-12 h-12 text-indigo-500 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-900 mb-1">Belum Ada Data Peneguhan Sidi</h3>
              <p className="text-xs text-slate-600 mb-4">
                Belum ada data input Surat Peneguhan Sidi. Silakan tambahkan data melalui modul <strong>Pelayanan Sakramen</strong> terlebih dahulu untuk mencetak dokumen ini.
              </p>
            </div>
          );
        }

        const activeLogo = settings.logoUrl || settings.logoGkeUrl || defaultGkeLogo;
        const majelis = item.majelisJemaat ? item.majelisJemaat.trim() : formatMajelisJemaatText(settings.namaJemaat);
        const resort = item.resortGke ? item.resortGke.trim() : formatResortGkeText(settings.resortGke);

        return (
          <div className="max-w-3xl mx-auto p-8 border-4 border-double border-indigo-900 rounded-sm bg-white font-serif text-slate-900">
            {/* Header: Logo GKE + Title */}
            <div className="text-center border-b-2 border-indigo-950 pb-4 mb-4">
              <div className="flex items-center justify-center gap-4 mb-2">
                <img
                  src={activeLogo}
                  alt="Logo GKE"
                  className="w-16 h-16 object-contain"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = defaultGkeLogo;
                  }}
                />
                <div>
                  <h3 className="text-sm font-extrabold tracking-widest uppercase text-slate-900">
                    GEREJA KALIMANTAN EVANGELIS
                  </h3>
                  <p className="text-[11px] font-bold tracking-wider text-slate-700 uppercase">
                    ANGGOTA PGI
                  </p>
                  <h1 className="text-2xl font-black tracking-widest text-indigo-950 mt-1 uppercase border-2 border-indigo-900 py-1 px-8 inline-block bg-white shadow-xs">
                    SURAT SIDI
                  </h1>
                </div>
              </div>

              <p className="text-xs font-mono font-bold text-slate-900 mt-2">
                No. : <span className="underline font-black">{item.noSuratResmi || '-'}</span>
              </p>
            </div>

            {/* Jurisdiction Info */}
            <div className="space-y-1 text-xs font-bold text-slate-900 mb-4 px-2">
              <div className="grid grid-cols-12 gap-2">
                <span className="col-span-3 font-bold text-slate-800">Majelis Jemaat</span>
                <span className="col-span-1 text-center font-bold">:</span>
                <span className="col-span-8 font-black text-slate-950">{majelis}</span>
              </div>
              <div className="grid grid-cols-12 gap-2">
                <span className="col-span-3 font-bold text-slate-800">Resort</span>
                <span className="col-span-1 text-center font-bold">:</span>
                <span className="col-span-8 font-bold text-slate-900">{resort}</span>
              </div>
            </div>

            {/* Main Statement */}
            <div className="text-xs leading-relaxed space-y-3 px-2 my-4">
              <p className="font-bold text-slate-900 text-sm">
                Dengan ini menerangkan, bahwa :
              </p>

              {/* Data Person */}
              <div className="space-y-1.5 pl-2">
                <div className="grid grid-cols-12 gap-2">
                  <span className="col-span-3 font-bold text-slate-800">Nama</span>
                  <span className="col-span-1 text-center font-bold">:</span>
                  <span className="col-span-8 font-black text-slate-950 text-sm uppercase">
                    {item.namaUtama || '-'}
                  </span>
                </div>
                <div className="grid grid-cols-12 gap-2">
                  <span className="col-span-3 font-bold text-slate-800">Tempat/Tgl. Lahir</span>
                  <span className="col-span-1 text-center font-bold">:</span>
                  <span className="col-span-8 font-bold text-slate-900">
                    {item.tempatTanggalLahir || '-'}
                  </span>
                </div>
                <div className="grid grid-cols-12 gap-2">
                  <span className="col-span-3 font-bold text-slate-800">Nama : Ayah</span>
                  <span className="col-span-1 text-center font-bold">:</span>
                  <span className="col-span-8 font-bold text-slate-900">
                    {item.namaAyah || '-'}
                  </span>
                </div>
                <div className="grid grid-cols-12 gap-2">
                  <span className="col-span-3 font-bold text-slate-800">Ibu</span>
                  <span className="col-span-1 text-center font-bold">:</span>
                  <span className="col-span-8 font-bold text-slate-900">
                    {item.namaIbu || '-'}
                  </span>
                </div>
              </div>

              {/* Statement of Sidi */}
              <div className="text-center my-4 py-2 border-y border-indigo-200 bg-indigo-50/30">
                <p className="font-bold text-slate-950 text-sm italic">
                  Sudah menerima Sidi sesuai dengan peraturan Gereja Kalimantan Evangelis
                </p>
              </div>

              {/* Day / Date */}
              <div className="space-y-1.5 pl-2">
                <div className="grid grid-cols-12 gap-2">
                  <span className="col-span-3 font-bold text-slate-800">Hari / Tanggal</span>
                  <span className="col-span-1 text-center font-bold">:</span>
                  <span className="col-span-8 font-black text-slate-950">
                    {item.tanggalPelayanan ? formatIndonesianDate(item.tanggalPelayanan) : '-'}
                  </span>
                </div>
              </div>

              {/* Yang melaksanakan Sidi */}
              <div className="mt-4 pt-3 border-t border-slate-200 space-y-1.5 pl-2">
                <p className="font-bold text-slate-950 uppercase text-xs">
                  Yang melaksanakan Sidi
                </p>
                <div className="grid grid-cols-12 gap-2">
                  <span className="col-span-3 font-bold text-slate-800">Nama</span>
                  <span className="col-span-1 text-center font-bold">:</span>
                  <span className="col-span-8 font-bold text-slate-950">
                    {item.pelayanFirman || '-'}
                  </span>
                </div>
                <div className="grid grid-cols-12 gap-2">
                  <span className="col-span-3 font-bold text-slate-800">Jabatan</span>
                  <span className="col-span-1 text-center font-bold">:</span>
                  <span className="col-span-8 font-semibold text-slate-900">
                    {item.jabatanPelayan || 'Pendeta Jemaat GKE'}
                  </span>
                </div>
                <div className="grid grid-cols-12 gap-2">
                  <span className="col-span-3 font-bold text-slate-800">Nas Khotbah</span>
                  <span className="col-span-1 text-center font-bold">:</span>
                  <span className="col-span-8 font-extrabold text-indigo-950">
                    {item.nasKhotbah || '-'}
                  </span>
                </div>
                <div className="grid grid-cols-12 gap-2">
                  <span className="col-span-3 font-bold text-slate-800">Nas Peringatan</span>
                  <span className="col-span-1 text-center font-bold">:</span>
                  <span className="col-span-8 font-extrabold text-indigo-950">
                    {item.nasPeringatan || '-'}
                  </span>
                </div>
              </div>
            </div>

            {/* Signature Block */}
            <div className="mt-8 pt-4 border-t border-slate-300 text-xs px-2">
              <div className="text-right mb-6">
                <p>Dikeluarkan di : <strong className="underline">{item.tempatDikeluarkan || settings.tempatDiterbitkan || settings.namaJemaat || '-'}</strong></p>
                <p>Pada tanggal : <strong className="underline">{item.tanggalDikeluarkan || item.tanggalPelayanan ? formatIndonesianDate(item.tanggalDikeluarkan || item.tanggalPelayanan) : '-'}</strong></p>
              </div>

              <div className="text-center mb-2 font-bold text-slate-950 uppercase text-xs">
                {majelis}
              </div>

              <div className="grid grid-cols-2 gap-8 text-center mt-4">
                <div>
                  <p className="font-bold text-slate-800">Ketua,</p>
                  <div className="h-16 flex items-center justify-center italic text-slate-400 text-[10px]">
                    (Tanda Tangan & Cap Majelis)
                  </div>
                  <p className="font-bold underline text-slate-950 uppercase">
                    {item.ketuaMajelis || settings.namaKetuaJemaat || '-'}
                  </p>
                </div>

                <div>
                  <p className="font-bold text-slate-800">Sekretaris,</p>
                  <div className="h-16 flex items-center justify-center italic text-slate-400 text-[10px]">
                    (Tanda Tangan & Cap Majelis)
                  </div>
                  <p className="font-bold underline text-slate-950 uppercase">
                    {item.sekretarisMajelis || settings.namaSekretaris || '-'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        );
      }

      case 'pelayanan_nikah': {
        const filteredNikah = (pelayananSakramenList || []).filter((s) => s.jenisPelayanan === 'nikah');
        const item =
          filteredNikah.find((s) => s.id === localSakramenId) ||
          filteredNikah.find((s) => s.id === printConfig.sakramenId) ||
          (localSakramenId ? pelayananSakramenList.find((s) => s.id === localSakramenId) : null) ||
          filteredNikah[0] ||
          pelayananSakramenList[0];

        if (!item) {
          return (
            <div className="max-w-xl mx-auto p-8 my-8 text-center bg-white rounded-xl border border-slate-200 shadow-sm font-sans">
              <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-900 mb-1">Belum Ada Data Pemberkatan Nikah</h3>
              <p className="text-xs text-slate-600 mb-4">
                Belum ada data input Surat Peneguhan dan Pemberkatan Nikah. Silakan tambahkan data melalui modul <strong>Pelayanan Sakramen</strong> terlebih dahulu untuk mencetak dokumen ini.
              </p>
            </div>
          );
        }

        const activeLogo = settings.logoUrl || settings.logoGkeUrl || defaultGkeLogo;
        const majelis = item.majelisJemaat ? item.majelisJemaat.trim() : formatMajelisJemaatText(settings.namaJemaat);
        const resort = item.resortGke ? item.resortGke.trim() : formatResortGkeText(settings.resortGke);

        return (
          <div className="max-w-3xl mx-auto p-8 border-8 border-double border-amber-800 rounded-lg bg-amber-50/20 font-serif text-slate-900 relative shadow-lg">
            {/* Kop & Certificate Header */}
            <div className="text-center border-b-2 border-amber-900 pb-4 mb-6">
              <div className="flex items-center justify-center gap-4 mb-2">
                <img
                  src={activeLogo}
                  alt="Logo GKE"
                  className="w-16 h-16 object-contain"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = defaultGkeLogo;
                  }}
                />
                <div>
                  <h3 className="text-sm font-extrabold tracking-widest uppercase text-slate-900">
                    GEREJA KALIMANTAN EVANGELIS (GKE)
                  </h3>
                  <p className="text-[11px] font-bold tracking-wider text-slate-700 uppercase">
                    (ANGGOTA PGI)
                  </p>
                  <h1 className="text-2xl font-black tracking-widest text-amber-950 mt-1 uppercase border-2 border-amber-900 py-1 px-6 inline-block bg-white shadow-xs">
                    Surat Peneguhan Pernikahan
                  </h1>
                </div>
              </div>

              {/* Document Number & Jurisdiction Info */}
              <div className="mt-3 bg-white p-2.5 rounded-lg border border-amber-800/40 text-xs font-semibold space-y-1">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-1 text-center font-bold">
                  <div>
                    <span className="text-slate-600 font-normal">Nomor:</span>{' '}
                    <span className="font-mono text-amber-950 font-extrabold underline">{item.noSuratResmi || '-'}</span>
                  </div>
                  <div>
                    <span className="text-slate-600 font-normal">Majelis Jemaat:</span>{' '}
                    <span className="text-slate-900 font-bold">{majelis}</span>
                  </div>
                  <div>
                    <span className="text-slate-600 font-normal">Resort:</span>{' '}
                    <span className="text-slate-900 font-bold">{resort}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Menerangkan Bahwa */}
            <div className="text-xs leading-relaxed space-y-4 px-2 my-4">
              <p className="font-bold text-slate-900 text-center text-sm">
                Dengan ini menerangkan bahwa :
              </p>

              {/* LAKI-LAKI */}
              <div className="bg-white p-3.5 rounded-lg border border-slate-300 shadow-2xs space-y-1.5">
                <p className="font-black text-slate-900 uppercase text-xs border-b border-slate-200 pb-1 tracking-wider text-amber-950">
                  LAKI - LAKI :
                </p>
                <div className="grid grid-cols-12 gap-1.5 pl-2">
                  <span className="col-span-4 font-bold text-slate-700">Nama</span>
                  <span className="col-span-1 text-center font-bold">:</span>
                  <span className="col-span-7 font-black text-slate-950 text-sm uppercase">
                    {item.namaUtama || '-'}
                  </span>
                </div>
                <div className="grid grid-cols-12 gap-1.5 pl-2">
                  <span className="col-span-4 font-bold text-slate-700">Tempat / Tgl. Lahir</span>
                  <span className="col-span-1 text-center font-bold">:</span>
                  <span className="col-span-7 font-bold text-slate-900">
                    {item.tempatTanggalLahir || '-'}
                  </span>
                </div>
                <div className="grid grid-cols-12 gap-1.5 pl-2">
                  <span className="col-span-4 font-bold text-slate-700">Alamat</span>
                  <span className="col-span-1 text-center font-bold">:</span>
                  <span className="col-span-7 font-medium text-slate-900">
                    {item.alamatUtama || '-'}
                  </span>
                </div>
              </div>

              <div className="text-center font-black text-sm uppercase text-amber-900 italic">
                — dan —
              </div>

              {/* PEREMPUAN */}
              <div className="bg-white p-3.5 rounded-lg border border-slate-300 shadow-2xs space-y-1.5">
                <p className="font-black text-slate-900 uppercase text-xs border-b border-slate-200 pb-1 tracking-wider text-rose-950">
                  PEREMPUAN :
                </p>
                <div className="grid grid-cols-12 gap-1.5 pl-2">
                  <span className="col-span-4 font-bold text-slate-700">Nama</span>
                  <span className="col-span-1 text-center font-bold">:</span>
                  <span className="col-span-7 font-black text-slate-950 text-sm uppercase">
                    {item.namaPasangan || '-'}
                  </span>
                </div>
                <div className="grid grid-cols-12 gap-1.5 pl-2">
                  <span className="col-span-4 font-bold text-slate-700">Tempat / Tgl. Lahir</span>
                  <span className="col-span-1 text-center font-bold">:</span>
                  <span className="col-span-7 font-bold text-slate-900">
                    {item.tempatTanggalLahirPasangan || '-'}
                  </span>
                </div>
                <div className="grid grid-cols-12 gap-1.5 pl-2">
                  <span className="col-span-4 font-bold text-slate-700">Alamat</span>
                  <span className="col-span-1 text-center font-bold">:</span>
                  <span className="col-span-7 font-medium text-slate-900">
                    {item.alamatPasangan || '-'}
                  </span>
                </div>
              </div>

              {/* Deklarasi Peneguhan & Pemberkatan Nikah */}
              <div className="bg-amber-100/50 p-3 rounded-lg border border-amber-300 text-center space-y-2">
                <p className="font-bold text-slate-900 text-xs leading-relaxed">
                  Sudah diteguhkan dan diberkati pernikahannya menurut Peraturan Gereja Kalimantan Evangelis (GKE) pada :
                </p>

                <div className="max-w-md mx-auto space-y-1 text-left bg-white p-2.5 rounded border border-amber-200 text-xs">
                  <div className="grid grid-cols-12 gap-1">
                    <span className="col-span-4 font-bold text-slate-700">Hari / Tanggal</span>
                    <span className="col-span-1 text-center font-bold">:</span>
                    <span className="col-span-7 font-black text-slate-950">
                      {item.tanggalPelayanan ? formatIndonesianDate(item.tanggalPelayanan) : '-'}
                    </span>
                  </div>
                  <div className="grid grid-cols-12 gap-1">
                    <span className="col-span-4 font-bold text-slate-700">Tempat</span>
                    <span className="col-span-1 text-center font-bold">:</span>
                    <span className="col-span-7 font-bold text-slate-900">
                      {item.tempatPelayanan || '-'}
                    </span>
                  </div>
                  <div className="grid grid-cols-12 gap-1">
                    <span className="col-span-4 font-bold text-slate-700">Nast Khotbah</span>
                    <span className="col-span-1 text-center font-bold">:</span>
                    <span className="col-span-7 font-black text-amber-950">
                      {item.nasKhotbah || '-'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Yang Melaksanakan Peneguhan */}
              <div className="bg-white p-3 rounded-lg border border-slate-300 space-y-1">
                <p className="font-bold text-slate-900 text-xs uppercase border-b border-slate-200 pb-1">
                  Yang melaksanakan peneguhan :
                </p>
                <div className="grid grid-cols-12 gap-1 pl-2">
                  <span className="col-span-4 font-bold text-slate-700">Nama</span>
                  <span className="col-span-1 text-center font-bold">:</span>
                  <span className="col-span-7 font-bold text-slate-950">
                    {item.pelayanFirman || '-'}
                  </span>
                </div>
                <div className="grid grid-cols-12 gap-1 pl-2">
                  <span className="col-span-4 font-bold text-slate-700">Jabatan</span>
                  <span className="col-span-1 text-center font-bold">:</span>
                  <span className="col-span-7 font-semibold text-slate-800">
                    {item.jabatanPelayan || 'Pendeta Jemaat GKE'}
                  </span>
                </div>
              </div>

              <p className="italic text-center text-slate-800 font-medium my-2">
                Demikian Kartu Tanda Nikah ini diberikan agar dapat diketahui dan dipergunakan sebagaimana mestinya.
              </p>
            </div>

            {/* Bottom Section: Photo + Date & Signatures */}
            <div className="mt-6 pt-4 border-t-2 border-amber-900 grid grid-cols-12 gap-4 items-end text-xs">
              {/* Foto orang yang dinikahkan */}
              <div className="col-span-5 flex flex-col items-center justify-center">
                <div className="w-32 h-40 border-2 border-slate-800 rounded bg-slate-100 flex items-center justify-center overflow-hidden p-0.5 shadow-sm">
                  {item.fotoCoupleUrl ? (
                    <img
                      src={item.fotoCoupleUrl}
                      alt="Foto Pasangan Mempelai"
                      className="w-full h-full object-cover rounded-xs"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="text-center p-2 text-[10px] font-bold text-slate-400 uppercase tracking-tight space-y-1">
                      <div className="w-8 h-8 rounded-full border border-slate-300 mx-auto flex items-center justify-center text-slate-300">
                        📷
                      </div>
                      <span>Pas Foto 4x6 Orang Yang Dinikahkan</span>
                    </div>
                  )}
                </div>
                <span className="text-[10px] font-bold text-slate-600 mt-1 uppercase tracking-tight">
                  Foto Orang Yang Dinikahkan
                </span>
              </div>

              {/* Dikeluarkan di & Signatures */}
              <div className="col-span-7 space-y-4 text-center">
                <div className="text-right">
                  <p>Dikeluarkan di : <strong className="underline">{item.tempatDikeluarkan || settings.tempatDiterbitkan || settings.namaJemaat || '-'}</strong></p>
                  <p>Pada tanggal : <strong className="underline">{item.tanggalDikeluarkan || item.tanggalPelayanan ? formatIndonesianDate(item.tanggalDikeluarkan || item.tanggalPelayanan) : '-'}</strong></p>
                </div>

                <div>
                  <p className="font-bold text-slate-900 uppercase tracking-wide text-[11px] mb-2">
                    {majelis}
                  </p>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="font-bold text-slate-800">Ketua,</p>
                      <div className="h-14 flex items-center justify-center italic text-slate-400 text-[9px]">
                        ( Cap & Tanda Tangan )
                      </div>
                      <p className="font-bold underline text-slate-950 uppercase text-[11px]">
                        {item.ketuaMajelis || settings.namaKetuaJemaat || '-'}
                      </p>
                    </div>

                    <div>
                      <p className="font-bold text-slate-800">Sekretaris,</p>
                      <div className="h-14 flex items-center justify-center italic text-slate-400 text-[9px]">
                        ( Cap & Tanda Tangan )
                      </div>
                      <p className="font-bold underline text-slate-950 uppercase text-[11px]">
                        {item.sekretarisMajelis || settings.namaSekretaris || '-'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      }

      case 'surat_pelimpahan_nikah': {
        const filteredNikah = (pelayananSakramenList || []).filter((s) => s.jenisPelayanan === 'nikah');
        const item =
          filteredNikah.find((s) => s.id === localSakramenId) ||
          filteredNikah.find((s) => s.id === printConfig.sakramenId) ||
          (localSakramenId ? pelayananSakramenList.find((s) => s.id === localSakramenId) : null) ||
          filteredNikah[0] ||
          pelayananSakramenList.find((s) => s.jenisPelayanan === 'nikah');

        if (!item) {
          return (
            <div className="max-w-xl mx-auto p-8 my-8 text-center bg-white rounded-xl border border-slate-200 shadow-sm font-sans">
              <AlertCircle className="w-12 h-12 text-purple-500 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-900 mb-1">Belum Ada Data Surat Pelimpahan Nikah</h3>
              <p className="text-xs text-slate-600 mb-4">
                Belum ada data input Surat Pelimpahan Peneguhan dan Pemberkatan Nikah yang tersimpan. Silakan tambahkan data melalui modul <strong>Pelayanan Sakramen / Surat Pelimpahan Nikah</strong> terlebih dahulu untuk melihat dan mencetak dokumen resmi ini.
              </p>
            </div>
          );
        }

        const noSurat = item.noSuratResmi || '-';
        const majelis = item.majelisJemaat ? item.majelisJemaat.trim() : formatMajelisJemaatText(settings.namaJemaat);
        const resort = item.resortGke ? item.resortGke.trim() : formatResortGkeText(settings.resortGke);

        const tempatSurat = item.tempatDikeluarkan || settings.tempatDiterbitkan || settings.namaJemaat || '-';
        const tanggalSurat = item.tanggalDikeluarkan || item.tanggalPelayanan ? formatIndonesianDate(item.tanggalDikeluarkan || item.tanggalPelayanan) : '-';

        const penerimaSurat = item.penerimaSurat || '-';
        const tujuanDi = item.tujuanDi || 'Tempat.';

        const namaPria = item.namaUtama || '-';
        const ttlPria = item.tempatTanggalLahir || '-';
        const pekerjaanPria = item.pekerjaanPria || '-';
        const jemaatAsalPria = item.jemaatAsalPria || (settings.namaJemaat ? `GKE ${settings.namaJemaat}` : '-');
        const ayahPria = item.namaAyah || '-';
        const ibuPria = item.namaIbu || '-';
        const alamatPria = item.alamatUtama || '-';

        const namaWanita = item.namaPasangan || '-';
        const ttlWanita = item.tempatTanggalLahirPasangan || '-';
        const pekerjaanWanita = item.pekerjaanWanita || '-';
        const jemaatAsalWanita = item.jemaatAsalWanita || '-';
        const ayahWanita = item.namaAyahPasangan || '-';
        const ibuWanita = item.namaIbuPasangan || '-';
        const alamatWanita = item.alamatPasangan || '-';

        const tglRencanaSyukur = item.tanggalRencanaIbadahSyukur
          ? formatIndonesianDate(item.tanggalRencanaIbadahSyukur)
          : (item.tanggalPelayanan ? formatIndonesianDate(item.tanggalPelayanan) : '-');
        const jemaatTujuanPelayanan = item.jemaatTujuanPelayanan || item.penerimaSurat || '-';

        const ketua = item.ketuaMajelis || settings.namaKetuaJemaat || '-';
        const sekretaris = item.sekretarisMajelis || settings.namaSekretaris || '-';

        const tembusanList = item.tembusanSurat
          ? item.tembusanSurat.split('\n').filter((l) => l.trim().length > 0)
          : [penerimaSurat !== '-' ? penerimaSurat : 'Majelis Jemaat Tujuan', 'Calon mempelai', 'Arsip.'];

        return (
          <div className="max-w-3xl mx-auto p-4 sm:p-8 bg-white font-serif text-slate-950 text-xs sm:text-sm leading-relaxed">
            {/* Kop Surat Resmi GKE */}
            <KopSurat />

            {/* Tanggal Surat Top Right */}
            <div className="text-right font-medium mb-4">
              {tempatSurat}, {tanggalSurat}
            </div>

            {/* Nomor & Perihal Header */}
            <div className="mb-5 space-y-1">
              <div className="flex gap-2">
                <span className="w-20 font-medium shrink-0">Nomor</span>
                <span className="shrink-0">:</span>
                <span className="font-mono font-medium">{noSurat}</span>
              </div>
              <div className="flex gap-2">
                <span className="w-20 font-medium shrink-0">Perihal</span>
                <span className="shrink-0">:</span>
                <span className="font-bold underline">
                  Pelimpahan Peneguhan dan Pemberkatan Nikah.
                </span>
              </div>
            </div>

            {/* Kepada Yth. */}
            <div className="mb-5 space-y-0.5">
              <p>Kepada Yth.</p>
              <p className="font-bold">{penerimaSurat}</p>
              <p>di-</p>
              <p className="pl-6 font-medium underline">{tujuanDi}</p>
            </div>

            {/* Salam Pembuka */}
            <div className="mb-4 space-y-2">
              <p className="italic font-bold">
                Syalom, Salam Sejahtera dalam kasih Tuhan Yesus Kristus.
              </p>
              <p className="text-justify leading-relaxed">
                Majelis Pekerja Harian (MPH) {majelis}, {resort} dengan ini memberikan pelimpahan kepada {penerimaSurat}; untuk melaksanakan Peneguhan dan Pemberkatan Nikah:
              </p>
            </div>

            {/* Data Mempelai Pria */}
            <div className="my-3 space-y-1 pl-2 sm:pl-4">
              <div className="flex gap-2">
                <span className="w-40 sm:w-48 shrink-0">Nama</span>
                <span className="shrink-0">:</span>
                <span className="font-extrabold uppercase">{namaPria}</span>
              </div>
              <div className="flex gap-2">
                <span className="w-40 sm:w-48 shrink-0">Tempat / Tanggal lahir</span>
                <span className="shrink-0">:</span>
                <span>{ttlPria}</span>
              </div>
              <div className="flex gap-2">
                <span className="w-40 sm:w-48 shrink-0">Jenis Kelamin</span>
                <span className="shrink-0">:</span>
                <span>Laki-laki</span>
              </div>
              <div className="flex gap-2">
                <span className="w-40 sm:w-48 shrink-0">Pekerjaan</span>
                <span className="shrink-0">:</span>
                <span>{pekerjaanPria}</span>
              </div>
              <div className="flex gap-2">
                <span className="w-40 sm:w-48 shrink-0">Anggota Jemaat</span>
                <span className="shrink-0">:</span>
                <span>{jemaatAsalPria}</span>
              </div>
              <div className="flex gap-2">
                <span className="w-40 sm:w-48 shrink-0">Nama orang tua :</span>
              </div>
              <div className="flex gap-2 pl-4">
                <span className="w-36 sm:w-44 shrink-0">Ayah</span>
                <span className="shrink-0">:</span>
                <span className="font-semibold">{ayahPria}</span>
              </div>
              <div className="flex gap-2 pl-4">
                <span className="w-36 sm:w-44 shrink-0">Ibu</span>
                <span className="shrink-0">:</span>
                <span className="font-semibold">{ibuPria}</span>
              </div>
              <div className="flex gap-2">
                <span className="w-40 sm:w-48 shrink-0">Alamat</span>
                <span className="shrink-0">:</span>
                <span>{alamatPria}</span>
              </div>
            </div>

            {/* Separator / Dengan */}
            <div className="text-center font-bold my-4 uppercase tracking-wider">
              Dengan :
            </div>

            {/* Data Mempelai Wanita */}
            <div className="my-3 space-y-1 pl-2 sm:pl-4">
              <div className="flex gap-2">
                <span className="w-40 sm:w-48 shrink-0">Nama</span>
                <span className="shrink-0">:</span>
                <span className="font-extrabold uppercase">{namaWanita}</span>
              </div>
              <div className="flex gap-2">
                <span className="w-40 sm:w-48 shrink-0">Jenis Kelamin</span>
                <span className="shrink-0">:</span>
                <span>Perempuan</span>
              </div>
              <div className="flex gap-2">
                <span className="w-40 sm:w-48 shrink-0">Tempat / Tanggal lahir</span>
                <span className="shrink-0">:</span>
                <span>{ttlWanita}</span>
              </div>
              <div className="flex gap-2">
                <span className="w-40 sm:w-48 shrink-0">Pekerjaan</span>
                <span className="shrink-0">:</span>
                <span>{pekerjaanWanita}</span>
              </div>
              <div className="flex gap-2">
                <span className="w-40 sm:w-48 shrink-0">Anggota Jemaat</span>
                <span className="shrink-0">:</span>
                <span>{jemaatAsalWanita}</span>
              </div>
              <div className="flex gap-2">
                <span className="w-40 sm:w-48 shrink-0">Nama orang tua :</span>
              </div>
              <div className="flex gap-2 pl-4">
                <span className="w-36 sm:w-44 shrink-0">Ayah</span>
                <span className="shrink-0">:</span>
                <span className="font-semibold">{ayahWanita}</span>
              </div>
              <div className="flex gap-2 pl-4">
                <span className="w-36 sm:w-44 shrink-0">Ibu</span>
                <span className="shrink-0">:</span>
                <span className="font-semibold">{ibuWanita}</span>
              </div>
              <div className="flex gap-2">
                <span className="w-40 sm:w-48 shrink-0">Alamat</span>
                <span className="shrink-0">:</span>
                <span>{alamatWanita}</span>
              </div>
            </div>

            {/* Paragraf Penutup */}
            <div className="my-5 space-y-3 text-justify leading-relaxed">
              <p>
                Sesuai dengan permintaan yang bersangkutan untuk dilayani baik dalam ibadah syukur dan untuk diteguhkan nikahnya pada tanggal {tglRencanaSyukur} di {jemaatTujuanPelayanan}. Pelayanan Peneguhan nikah tersebut sepenuhnya kami serahkan kepada pihak {jemaatTujuanPelayanan}, sesuai dengan Peraturan dan Tata Gereja GKE yang berlaku.
              </p>
              <p>
                Demikian surat pelimpahan peneguhan dan pemberkatan nikah ini kami sampaikan. Atas perhatian dan kerjasamanya diucapkan terimakasih. Tuhan Yesus memberkati pelayanan kita.
              </p>
            </div>

            {/* Tanda Tangan Block */}
            <div className="mt-8 text-center space-y-0.5">
              <p className="font-bold uppercase tracking-wide">MAJELIS PEKERJA HARIAN (MPH)</p>
              <p className="font-bold uppercase tracking-wide">{majelis}</p>

              <div className="grid grid-cols-2 gap-8 text-center pt-6">
                <div>
                  <p className="font-bold">Ketua,</p>
                  <div className="h-16 flex items-center justify-center italic text-slate-400 text-[10px]">
                    ( Cap & Tanda Tangan )
                  </div>
                  <p className="font-bold underline uppercase">{ketua}</p>
                </div>

                <div>
                  <p className="font-bold">Sekretaris,</p>
                  <div className="h-16 flex items-center justify-center italic text-slate-400 text-[10px]">
                    ( Cap & Tanda Tangan )
                  </div>
                  <p className="font-bold underline uppercase">{sekretaris}</p>
                </div>
              </div>
            </div>

            {/* Tembusan Block */}
            <div className="mt-6 text-xs space-y-0.5 pt-2">
              <p className="font-bold underline">Tembusan :</p>
              <ol className="list-decimal list-inside pl-1 space-y-0.5">
                {tembusanList.map((t, idx) => (
                  <li key={idx}>{t.replace(/^\d+[\.\)]\s*/, '')}</li>
                ))}
              </ol>
            </div>
          </div>
        );
      }

      case 'pelayanan_sakramen_rekap': {
        const activeCat = printConfig.selectedKategori || printConfig.filterJenis;
        const filteredList =
          activeCat && activeCat !== 'semua'
            ? pelayananSakramenList.filter((s) => s.jenisPelayanan === activeCat)
            : pelayananSakramenList;

        const totalNikah = filteredList.filter((s) => s.jenisPelayanan === 'nikah').length;
        const totalBaptis = filteredList.filter((s) => s.jenisPelayanan === 'baptis').length;
        const totalSidi = filteredList.filter((s) => s.jenisPelayanan === 'sidi').length;

        const subTitleKategori =
          printConfig.customTitle ||
          (activeCat === 'baptis'
            ? 'Rekapitulasi Pelayanan Baptisan Kudus'
            : activeCat === 'sidi'
            ? 'Rekapitulasi Pelayanan Peneguhan Sidi'
            : activeCat === 'nikah'
            ? 'Rekapitulasi Surat Pelimpahan & Pemberkatan Nikah'
            : 'Pemberkatan Nikah, Baptisan Kudus & Peneguhan Sidi');

        return (
          <div>
            <KopSurat
              title="LAPORAN REKAPITULASI PELAYANAN SAKRAMEN"
              subtitle={`${subTitleKategori} — ${settings.namaJemaat || 'Majelis Jemaat GKE Efata'}`}
            />

            {/* Ringkasan Jumlah Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs mb-4 p-3 bg-slate-50 border border-slate-300 rounded">
              <div>
                <span className="text-slate-600 block">Pemberkatan Nikah:</span>
                <strong className="text-sm text-rose-700">{totalNikah} Berkas</strong>
              </div>
              <div>
                <span className="text-slate-600 block">Baptisan Kudus:</span>
                <strong className="text-sm text-sky-700">{totalBaptis} Berkas</strong>
              </div>
              <div>
                <span className="text-slate-600 block">Peneguhan Sidi:</span>
                <strong className="text-sm text-indigo-700">{totalSidi} Berkas</strong>
              </div>
              <div>
                <span className="text-slate-600 block">Total Keseluruhan:</span>
                <strong className="text-sm text-slate-900">{filteredList.length} Berkas</strong>
              </div>
            </div>

            <table className="w-full text-xs text-left border-collapse border border-slate-400 mb-4">
              <thead>
                <tr className="bg-slate-200 text-slate-900 border-b border-slate-400">
                  <th className="p-2 border border-slate-400 w-8 text-center">No</th>
                  <th className="p-2 border border-slate-400">Jenis Pelayanan</th>
                  <th className="p-2 border border-slate-400">No. Surat Resmi</th>
                  <th className="p-2 border border-slate-400">Nama Bersangkutan / Mempelai</th>
                  <th className="p-2 border border-slate-400">Pelayan Firman & Lokasi</th>
                  <th className="p-2 border border-slate-400">Tgl Pelayanan</th>
                  <th className="p-2 border border-slate-400 text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredList.map((item, idx) => (
                  <tr key={item.id} className="border-b border-slate-300">
                    <td className="p-2 border border-slate-300 text-center">{idx + 1}</td>
                    <td className="p-2 border border-slate-300 font-bold text-[11px] uppercase">
                      {item.jenisPelayanan === 'baptis'
                        ? 'Baptisan Kudus'
                        : item.jenisPelayanan === 'sidi'
                        ? 'Peneguhan Sidi'
                        : 'Pemberkatan Nikah'}
                    </td>
                    <td className="p-2 border border-slate-300 font-mono font-bold">{item.noSuratResmi}</td>
                    <td className="p-2 border border-slate-300">
                      <div className="font-bold">{item.namaUtama}</div>
                      {item.namaPasangan && (
                        <div className="text-slate-700 font-semibold text-[11px]">
                          & {item.namaPasangan}
                        </div>
                      )}
                      {item.tempatTanggalLahir && (
                        <div className="text-[10px] text-slate-500">TTL: {item.tempatTanggalLahir}</div>
                      )}
                    </td>
                    <td className="p-2 border border-slate-300">
                      <div className="font-semibold">{item.pelayanFirman}</div>
                      <div className="text-[10px] text-slate-500">{item.tempatPelayanan}</div>
                    </td>
                    <td className="p-2 border border-slate-300 whitespace-nowrap font-medium">
                      {formatIndonesianDate(item.tanggalPelayanan)}
                    </td>
                    <td className="p-2 border border-slate-300 text-center font-semibold">{item.status}</td>
                  </tr>
                ))}
                {filteredList.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-4 text-center text-slate-500 italic">
                      Belum ada data pelayanan sakramen.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            <SignatureBlock signers={['sekretaris', 'ketua']} />
          </div>
        );
      }

      case 'panitia_pembangunan': {
        const getMasukNominal = (item: any): number => {
          if (typeof item.masuk === 'number' && item.masuk > 0) return item.masuk;
          if (item.jenis === 'pemasukan' || item.jenis === 'masuk') {
            return typeof item.jumlah === 'number' && item.jumlah > 0 ? item.jumlah : 0;
          }
          return 0;
        };

        const getKeluarNominal = (item: any): number => {
          if (typeof item.keluar === 'number' && item.keluar > 0) return item.keluar;
          if (item.jenis === 'pengeluaran' || item.jenis === 'keluar') {
            return typeof item.jumlah === 'number' && item.jumlah > 0 ? item.jumlah : 0;
          }
          return 0;
        };

        const totalMasuk = pembangunanKeuanganList.reduce((acc, curr) => acc + getMasukNominal(curr), 0);
        const totalKeluar = pembangunanKeuanganList.reduce((acc, curr) => acc + getKeluarNominal(curr), 0);
        const customSaldoAwal = localCustomSaldoAwal ?? (settings.saldoAwalCustomKasPembangunan || 0);
        const sisaSaldo = customSaldoAwal + totalMasuk - totalKeluar;
        const totalTargetProyek = proyekPembangunanList.reduce((acc, curr) => acc + (curr.targetAnggaran || 0), 0);

        const sectionFilter = localPembangunanSection || 'all';
        const showProyek = sectionFilter === 'all' || sectionFilter === 'proyek';
        const showPanitia = sectionFilter === 'all' || sectionFilter === 'panitia';
        const showKas = sectionFilter === 'all' || sectionFilter === 'kas';

        const docTitle = printConfig.customTitle || (
          sectionFilter === 'panitia'
            ? 'SUSUNAN PANITIA PEMBANGUNAN GKE'
            : sectionFilter === 'proyek'
            ? 'LAPORAN AGENDA & PROGRES PROYEK PEMBANGUNAN GKE'
            : sectionFilter === 'kas'
            ? 'LAPORAN KAS & DONASI JANJI IMAN PEMBANGUNAN GKE'
            : 'LAPORAN RESMI PANITIA PEMBANGUNAN GKE'
        );

        const docSubtitle = sectionFilter === 'panitia'
          ? `Struktur & Susunan Personil Tim Panitia Pembangunan / Renovasi — ${settings.namaJemaat || 'Majelis Jemaat GKE Efata'}`
          : sectionFilter === 'proyek'
          ? `Laporan Progres Fisik, Realisasi & Target Anggaran Proyek — ${settings.namaJemaat || 'Majelis Jemaat GKE Efata'}`
          : sectionFilter === 'kas'
          ? `Laporan Rekapitulasi Penerimaan Janji Iman & Pengeluaran Kas — ${settings.namaJemaat || 'Majelis Jemaat GKE Efata'}`
          : `Laporan Progres Fisik, Struktur Panitia & Kas Pembangunan — ${settings.namaJemaat || 'Majelis Jemaat GKE Efata'}`;

        return (
          <div>
            <KopSurat
              title={docTitle}
              subtitle={docSubtitle}
            />

            {/* Ringkasan Statistik Eksekutif */}
            {(showProyek || showKas || sectionFilter === 'all') && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs mb-5 p-3 bg-slate-50 border border-slate-300 rounded">
                <div>
                  <span className="text-slate-600 block font-medium">Total Proyek Fisik:</span>
                  <strong className="text-sm text-slate-900">{proyekPembangunanList.length} Agenda Proyek</strong>
                </div>
                <div>
                  <span className="text-slate-600 block font-medium">Target Anggaran Proyek:</span>
                  <strong className="text-sm text-blue-700">Rp {totalTargetProyek.toLocaleString('id-ID')}</strong>
                </div>
                <div>
                  <span className="text-slate-600 block font-medium">Penerimaan & Donasi Janji Iman:</span>
                  <strong className="text-sm text-emerald-700">Rp {totalMasuk.toLocaleString('id-ID')}</strong>
                </div>
                <div>
                  <span className="text-slate-600 block font-medium">Sisa Saldo Kas Pembangunan:</span>
                  <strong className="text-sm text-amber-700">Rp {sisaSaldo.toLocaleString('id-ID')}</strong>
                </div>
              </div>
            )}

            {/* Sub Bagian 1: Proyek Pembangunan Fisik */}
            {showProyek && (
              <div className="mb-6">
                <h4 className="text-xs font-bold uppercase text-slate-900 border-b-2 border-slate-700 pb-1 mb-2">
                  {sectionFilter === 'all' ? 'I. Agenda & Proyek Pembangunan / Renovasi Gedung Gereja' : 'Daftar Agenda & Progres Proyek Pembangunan'}
                </h4>
                <table className="w-full text-xs text-left border-collapse border border-slate-400 mb-2">
                  <thead>
                    <tr className="bg-slate-200 text-slate-900 border-b border-slate-400">
                      <th className="p-1.5 border border-slate-400 w-8 text-center">No</th>
                      <th className="p-1.5 border border-slate-400">Nama Proyek</th>
                      <th className="p-1.5 border border-slate-400">Kategori</th>
                      <th className="p-1.5 border border-slate-400">Penanggung Jawab Teknis</th>
                      <th className="p-1.5 border border-slate-400 text-right">Target Anggaran (Rp)</th>
                      <th className="p-1.5 border border-slate-400 text-right">Realisasi (Rp)</th>
                      <th className="p-1.5 border border-slate-400 text-center w-16">Progres</th>
                      <th className="p-1.5 border border-slate-400 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {proyekPembangunanList.map((pr, idx) => (
                      <tr key={pr.id} className="border-b border-slate-300">
                        <td className="p-1.5 border border-slate-300 text-center font-medium">{idx + 1}</td>
                        <td className="p-1.5 border border-slate-300 font-bold text-slate-900">
                          {pr.namaProyek}
                          {pr.keterangan && <div className="text-[10px] text-slate-600 font-normal">{pr.keterangan}</div>}
                        </td>
                        <td className="p-1.5 border border-slate-300 text-slate-700">{pr.kategoriProyek}</td>
                        <td className="p-1.5 border border-slate-300 font-medium">{pr.penanggungJawabTeknis}</td>
                        <td className="p-1.5 border border-slate-300 text-right font-semibold">
                          Rp {pr.targetAnggaran.toLocaleString('id-ID')}
                        </td>
                        <td className="p-1.5 border border-slate-300 text-right text-emerald-700 font-semibold">
                          Rp {pr.realisasiAnggaran.toLocaleString('id-ID')}
                        </td>
                        <td className="p-1.5 border border-slate-300 text-center font-bold text-amber-800">
                          {pr.progresPersen}%
                        </td>
                        <td className="p-1.5 border border-slate-300 text-center font-semibold text-slate-900">
                          {pr.status}
                        </td>
                      </tr>
                    ))}
                    {proyekPembangunanList.length === 0 && (
                      <tr>
                        <td colSpan={8} className="p-3 text-center text-slate-500 italic">
                          Belum ada data proyek pembangunan terdaftar.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* Sub Bagian 2: Struktur Panitia Pembangunan */}
            {showPanitia && (
              <div className="mb-6">
                <h4 className="text-xs font-bold uppercase text-slate-900 border-b-2 border-slate-700 pb-1 mb-2">
                  {sectionFilter === 'all' ? 'II. Susunan Pengurus & Panitia Pembangunan' : 'Susunan Tim & Personil Panitia Pembangunan'}
                </h4>
                <table className="w-full text-xs text-left border-collapse border border-slate-400 mb-2">
                  <thead>
                    <tr className="bg-slate-200 text-slate-900 border-b border-slate-400">
                      <th className="p-1.5 border border-slate-400 w-8 text-center">No</th>
                      <th className="p-1.5 border border-slate-400">Jabatan Panitia</th>
                      <th className="p-1.5 border border-slate-400">Nama Lengkap & Gelar</th>
                      <th className="p-1.5 border border-slate-400 text-center">Periode SK</th>
                      <th className="p-1.5 border border-slate-400">No. Kontak / HP</th>
                      <th className="p-1.5 border border-slate-400 text-center w-20">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pengurusPembangunanList.map((p, idx) => (
                      <tr key={p.id} className="border-b border-slate-300">
                        <td className="p-1.5 border border-slate-300 text-center font-medium">{idx + 1}</td>
                        <td className="p-1.5 border border-slate-300 font-bold text-slate-900">{p.jabatan}</td>
                        <td className="p-1.5 border border-slate-300 font-semibold text-slate-900">
                          {p.nama} {p.gelar ? `, ${p.gelar}` : ''}
                        </td>
                        <td className="p-1.5 border border-slate-300 text-center">{p.periode}</td>
                        <td className="p-1.5 border border-slate-300 font-mono text-[11px]">{p.noHp || '-'}</td>
                        <td className="p-1.5 border border-slate-300 text-center font-semibold">{p.status}</td>
                      </tr>
                    ))}
                    {pengurusPembangunanList.length === 0 && (
                      <tr>
                        <td colSpan={6} className="p-3 text-center text-slate-500 italic">
                          Belum ada susunan panitia pembangunan terdaftar.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* Sub Bagian 3: Laporan Rekapitulasi Kas & Donasi Janji Iman */}
            {showKas && (
              <div className="mb-6">
                <h4 className="text-xs font-bold uppercase text-slate-900 border-b-2 border-slate-700 pb-1 mb-2">
                  {sectionFilter === 'all' ? 'III. Laporan Rekapitulasi Kas & Donasi Janji Iman Pembangunan (Sinkron Kas Jemaat)' : 'Laporan Rekapitulasi Kas & Donasi Janji Iman Pembangunan'}
                </h4>
                <table className="w-full text-xs text-left border-collapse border border-slate-400 mb-2">
                  <thead>
                    <tr className="bg-slate-200 text-slate-900 border-b border-slate-400">
                      <th className="p-1.5 border border-slate-400 w-8 text-center">No</th>
                      <th className="p-1.5 border border-slate-400 w-24">Tanggal</th>
                      <th className="p-1.5 border border-slate-400">Keterangan / Donatur / Transaksi</th>
                      <th className="p-1.5 border border-slate-400">Pos Anggaran</th>
                      <th className="p-1.5 border border-slate-400 text-right w-28">Pemasukan (Rp)</th>
                      <th className="p-1.5 border border-slate-400 text-right w-28">Pengeluaran (Rp)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customSaldoAwal > 0 && (
                      <tr className="bg-amber-50 font-semibold border-b border-slate-300">
                        <td className="p-1.5 border border-slate-300 text-center">-</td>
                        <td className="p-1.5 border border-slate-300 text-slate-600">Saldo Awal</td>
                        <td className="p-1.5 border border-slate-300 text-slate-800" colSpan={2}>
                          Saldo Awal Kas Pembangunan Disinkronkan
                        </td>
                        <td className="p-1.5 border border-slate-300 text-right text-emerald-700 font-bold">
                          Rp {customSaldoAwal.toLocaleString('id-ID')}
                        </td>
                        <td className="p-1.5 border border-slate-300 text-right text-slate-400">-</td>
                      </tr>
                    )}
                    {pembangunanKeuanganList.map((k, idx) => {
                      const itemMasuk = getMasukNominal(k);
                      const itemKeluar = getKeluarNominal(k);
                      return (
                        <tr key={k.id} className="border-b border-slate-300">
                          <td className="p-1.5 border border-slate-300 text-center font-medium">{idx + 1}</td>
                          <td className="p-1.5 border border-slate-300 whitespace-nowrap">{formatIndonesianDate(k.tanggal)}</td>
                          <td className="p-1.5 border border-slate-300 font-medium text-slate-900">{k.keterangan}</td>
                          <td className="p-1.5 border border-slate-300 text-slate-700">{k.posAnggaran || k.posKas || 'Kas Pembangunan'}</td>
                          <td className="p-1.5 border border-slate-300 text-right text-emerald-700 font-semibold">
                            {itemMasuk > 0 ? `Rp ${itemMasuk.toLocaleString('id-ID')}` : '-'}
                          </td>
                          <td className="p-1.5 border border-slate-300 text-right text-rose-700 font-semibold">
                            {itemKeluar > 0 ? `Rp ${itemKeluar.toLocaleString('id-ID')}` : '-'}
                          </td>
                        </tr>
                      );
                    })}
                    {pembangunanKeuanganList.length === 0 && customSaldoAwal === 0 && (
                      <tr>
                        <td colSpan={6} className="p-3 text-center text-slate-500 italic">
                          Belum ada transaksi kas pembangunan dalam Buku Kas Keuangan Jemaat.
                        </td>
                      </tr>
                    )}
                    <tr className="bg-slate-200 font-bold text-slate-900 border-t-2 border-slate-600">
                      <td colSpan={4} className="p-2 border border-slate-400 text-right uppercase">
                        TOTAL PENERIMAAN & SISA SALDO KAS PEMBANGUNAN:
                      </td>
                      <td className="p-2 border border-slate-400 text-right text-emerald-800">
                        Rp {(customSaldoAwal + totalMasuk).toLocaleString('id-ID')}
                      </td>
                      <td className="p-2 border border-slate-400 text-right text-rose-800">
                        Rp {totalKeluar.toLocaleString('id-ID')}
                      </td>
                    </tr>
                    <tr className="bg-amber-100 font-extrabold text-amber-950 border-t border-slate-600">
                      <td colSpan={4} className="p-2 border border-slate-400 text-right uppercase">
                        SISA SALDO BERSIH KAS PEMBANGUNAN:
                      </td>
                      <td colSpan={2} className="p-2 border border-slate-400 text-right text-sm text-emerald-900">
                        Rp {sisaSaldo.toLocaleString('id-ID')}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            <SignatureBlock posKas="Kas Pembangunan" />
          </div>
        );
      }

      case 'lingkungan':
      case 'lingkungan_jemaat': {
        const filtered = printConfig.selectedRayon
          ? lingkunganList.filter((l) => l.nama === printConfig.selectedRayon)
          : lingkunganList;

        return (
          <div className="space-y-4">
            <KopSurat
              title={printConfig.customTitle || "LAPORAN DATA PENGELOLAAN LINGKUNGAN & SEKTOR JEMAAT"}
              subtitle={`Majelis Jemaat GKE ${settings.namaJemaat || ''} - Data Wilayah Sektor & Pengurus Lingkungan`}
            />

            <div className="bg-slate-50 border border-slate-300 p-3 rounded-lg text-xs flex justify-between items-center font-bold text-slate-800">
              <span>Total Sektor/Lingkungan Terdaftar: {filtered.length} Sektor</span>
              <span>Diperbarui: {formatIndonesianDate(new Date().toISOString().split('T')[0])}</span>
            </div>

            <div className="overflow-x-auto w-full">
              <table className="w-full text-xs text-left border-collapse border border-slate-400 mb-4">
                <thead>
                  <tr className="bg-slate-200 text-slate-900 border-b border-slate-400 font-bold">
                    <th className="p-2 border border-slate-400 w-8 text-center">No</th>
                    <th className="p-2 border border-slate-400 w-16">Kode</th>
                    <th className="p-2 border border-slate-400">Nama Lingkungan / Rayon</th>
                    <th className="p-2 border border-slate-400">Wilayah / Sektor Cakupan Jalan</th>
                    <th className="p-2 border border-slate-400">Ketua Lingkungan</th>
                    <th className="p-2 border border-slate-400">Sekretaris Lingkungan</th>
                    <th className="p-2 border border-slate-400 text-center">Data Jemaat (KK / Jiwa)</th>
                    <th className="p-2 border border-slate-400 text-center">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length > 0 ? (
                    filtered.map((item, idx) => {
                      const memberCount = wargaJemaatList.filter(
                        (w) => w.rayon === item.nama || w.sektorRayon === item.nama
                      ).length;
                      const kkSet = new Set(
                        wargaJemaatList
                          .filter((w) => w.rayon === item.nama || w.sektorRayon === item.nama)
                          .map((w) => w.noKjj)
                          .filter(Boolean)
                      );

                      return (
                        <tr key={item.id} className="border-b border-slate-300">
                          <td className="p-2 border border-slate-300 text-center">{idx + 1}</td>
                          <td className="p-2 border border-slate-300 font-mono font-bold text-slate-800">{item.kode}</td>
                          <td className="p-2 border border-slate-300 font-bold">{item.nama}</td>
                          <td className="p-2 border border-slate-300">{item.wilayahSektor || '-'}</td>
                          <td className="p-2 border border-slate-300 font-medium">{item.ketuaLingkungan || '-'}</td>
                          <td className="p-2 border border-slate-300">{item.sekretarisLingkungan || '-'}</td>
                          <td className="p-2 border border-slate-300 text-center font-bold">
                            {kkSet.size} KK ({memberCount} Jiwa)
                          </td>
                          <td className="p-2 border border-slate-300 text-center font-semibold">{item.status}</td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={8} className="p-4 text-center text-slate-500 italic">
                        Belum ada data lingkungan/sektor yang tersimpan.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <SignatureBlock signers={['sekretaris', 'ketua']} />
          </div>
        );
      }

      case 'seksi_kategorial': {
        const seksiFullNames: Record<string, string> = {
          SPB: 'Seksi Pelayanan Bapak (SPB)',
          SPPer: 'Seksi Pelayanan Perempuan (SPPer)',
          'SPPR/P': 'Seksi Pelayanan Pemuda & Remaja (SPPR/P)',
          SPA: 'Seksi Pelayanan Anak (ASHM / SPA)',
          ASHM: 'Seksi Pelayanan Anak & Sekolah Minggu (ASHM / SPA)',
        };

        const isMatchSeksi = (itemSeksi: string, selectedKey: string) => {
          if (!selectedKey || selectedKey === 'ALL') return true;
          if (selectedKey === 'ASHM' || selectedKey === 'SPA') {
            return itemSeksi === 'ASHM' || itemSeksi === 'SPA';
          }
          return itemSeksi === selectedKey;
        };

        const targetSeksiList =
          localSelectedSeksi && localSelectedSeksi !== 'ALL'
            ? [localSelectedSeksi === 'ASHM' ? 'SPA' : localSelectedSeksi]
            : ['SPB', 'SPPer', 'SPPR/P', 'SPA'];

        const detectSeksiForPrint = (jabatan: string): string => {
          const j = (jabatan || '').toUpperCase();
          if (j.includes('SPB') || j.includes('BAPAK')) return 'SPB';
          if (j.includes('SPPER') || j.includes('SP PER') || j.includes('PEREMPUAN') || j.includes('WANITA')) return 'SPPer';
          if (j.includes('SPPR') || j.includes('SPP/R') || j.includes('PEMUDA') || j.includes('REMAJA')) return 'SPPR/P';
          if (j.includes('SPA') || j.includes('ASHM') || j.includes('SEKOLAH MINGGU') || j.includes('ANAK') || j.includes('GRARP')) return 'SPA';
          return 'LAINNYA';
        };

        const mphKategorialList = mphList.map((m) => ({
          id: m.id,
          seksi: detectSeksiForPrint(m.jabatan),
          jabatan: m.jabatan,
          nama: m.nama,
          gelar: m.gelar,
          periode: m.periode || settings.periodePelayananMPH || '2024 - 2029',
          noHp: m.noHp,
          status: 'Aktif',
        }));

        const sourcePengurus = mphKategorialList.length > 0 ? mphKategorialList : pengurusKategorialList;

        const filteredPengurus = sourcePengurus.filter(
          (p) => isMatchSeksi(p.seksi, localSelectedSeksi || 'ALL')
        );

        const filteredKegiatan = kegiatanKategorialList.filter(
          (k) => isMatchSeksi(k.seksi, localSelectedSeksi || 'ALL')
        );

        // Calculate kas per seksi
        const kasBySeksi = targetSeksiList.map((sekKey) => {
          const items = keuanganList.filter((k) => {
            const pos = (k.posKas || k.kategoriKas || k.kategori || k.keterangan || '').toUpperCase();
            if (sekKey === 'SPB') return pos.includes('SPB') || pos.includes('BAPAK');
            if (sekKey === 'SPPer') return pos.includes('SPPER') || pos.includes('PEREMPUAN');
            if (sekKey === 'SPPR/P') return pos.includes('SPPR') || pos.includes('PEMUDA') || pos.includes('REMAJA');
            if (sekKey === 'SPA' || sekKey === 'ASHM') return pos.includes('SPA') || pos.includes('ASHM') || pos.includes('SEKOLAH MINGGU') || pos.includes('ANAK');
            return false;
          });

          const masuk = items.filter((i) => i.jenis === 'pemasukan' || i.jenis === 'masuk').reduce((acc, i) => acc + (i.jumlah || i.masuk || 0), 0);
          const keluar = items.filter((i) => i.jenis === 'pengeluaran' || i.jenis === 'keluar').reduce((acc, i) => acc + (i.jumlah || i.keluar || 0), 0);

          return {
            seksiKey: sekKey,
            seksiName: seksiFullNames[sekKey] || sekKey,
            pemasukan: masuk,
            pengeluaran: keluar,
            saldo: masuk - keluar,
          };
        });

        const totalKasMasuk = kasBySeksi.reduce((a, b) => a + b.pemasukan, 0);
        const totalKasKeluar = kasBySeksi.reduce((a, b) => a + b.pengeluaran, 0);
        const totalSaldo = totalKasMasuk - totalKasKeluar;

        return (
          <div className="space-y-6">
            <KopSurat
              title={
                localSelectedSeksi && localSelectedSeksi !== 'ALL'
                  ? `LAPORAN SEKSI PELAYANAN KATEGORIAL - ${seksiFullNames[localSelectedSeksi] || localSelectedSeksi}`
                  : "LAPORAN KESELURUHAN SEKSI PELAYANAN KATEGORIAL GKE"
              }
              subtitle={`Majelis Jemaat GKE ${settings.namaJemaat || ''} - Kepengurusan, Program Kerja & Keuangan Seksi`}
            />

            <div className="bg-slate-50 border border-slate-300 p-3 rounded-lg text-xs space-y-1">
              <div className="flex flex-wrap justify-between font-bold text-slate-800 gap-2">
                <span>Filter Tampilan: {localSelectedSeksi === 'ALL' ? 'Semua Seksi Pelayanan Kategorial' : seksiFullNames[localSelectedSeksi] || localSelectedSeksi}</span>
                <span>Periode Pelayanan: 2024 - 2029</span>
              </div>
              <p className="text-slate-600">
                Laporan resmi terpadu mencakup susunan pengurus kategorial, agenda program kerja pelayanan, dan rekapitulasi kas keuangan seksi.
              </p>
            </div>

            {/* Section 1: Kepengurusan */}
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 mb-2 uppercase border-b-2 border-slate-800 pb-1 flex justify-between items-center">
                <span>I. Data Kepengurusan Seksi Pelayanan Kategorial</span>
                <span className="text-xs font-semibold text-slate-600">Total: {filteredPengurus.length} Pengurus</span>
              </h3>
              <div className="overflow-x-auto w-full">
                <table className="w-full text-xs text-left border-collapse border border-slate-400">
                  <thead>
                    <tr className="bg-slate-200 text-slate-900 border-b border-slate-400">
                      <th className="p-2 border border-slate-400 w-8 text-center">No</th>
                      <th className="p-2 border border-slate-400">Seksi Kategorial</th>
                      <th className="p-2 border border-slate-400">Jabatan</th>
                      <th className="p-2 border border-slate-400">Nama Lengkap & Gelar</th>
                      <th className="p-2 border border-slate-400 text-center">Periode</th>
                      <th className="p-2 border border-slate-400">No. HP / Kontak</th>
                      <th className="p-2 border border-slate-400 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPengurus.length > 0 ? (
                      filteredPengurus.map((p, idx) => (
                        <tr key={p.id} className="border-b border-slate-300">
                          <td className="p-2 border border-slate-300 text-center">{idx + 1}</td>
                          <td className="p-2 border border-slate-300 font-bold">{p.seksi}</td>
                          <td className="p-2 border border-slate-300 font-semibold">{p.jabatan}</td>
                          <td className="p-2 border border-slate-300 font-bold">{p.nama}{p.gelar ? `, ${p.gelar}` : ''}</td>
                          <td className="p-2 border border-slate-300 text-center">{p.periode}</td>
                          <td className="p-2 border border-slate-300">{p.noHp || '-'}</td>
                          <td className="p-2 border border-slate-300 text-center font-semibold">{p.status}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="p-4 text-center text-slate-500 italic">
                          Belum ada data pengurus kategorial.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Section 2: Program Kerja */}
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 mb-2 uppercase border-b-2 border-slate-800 pb-1 flex justify-between items-center">
                <span>II. Agenda & Program Kerja Seksi</span>
                <span className="text-xs font-semibold text-slate-600">Total: {filteredKegiatan.length} Program</span>
              </h3>
              <div className="overflow-x-auto w-full">
                <table className="w-full text-xs text-left border-collapse border border-slate-400">
                  <thead>
                    <tr className="bg-slate-200 text-slate-900 border-b border-slate-400">
                      <th className="p-2 border border-slate-400 w-8 text-center">No</th>
                      <th className="p-2 border border-slate-400">Seksi</th>
                      <th className="p-2 border border-slate-400">Nama Program / Kegiatan</th>
                      <th className="p-2 border border-slate-400">Kategori</th>
                      <th className="p-2 border border-slate-400">Tanggal / Waktu</th>
                      <th className="p-2 border border-slate-400">Tempat</th>
                      <th className="p-2 border border-slate-400">Penanggung Jawab</th>
                      <th className="p-2 border border-slate-400 text-right">Anggaran Estimasi</th>
                      <th className="p-2 border border-slate-400 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredKegiatan.length > 0 ? (
                      filteredKegiatan.map((k, idx) => (
                        <tr key={k.id} className="border-b border-slate-300">
                          <td className="p-2 border border-slate-300 text-center">{idx + 1}</td>
                          <td className="p-2 border border-slate-300 font-bold">{k.seksi}</td>
                          <td className="p-2 border border-slate-300 font-bold">{k.namaProgram}</td>
                          <td className="p-2 border border-slate-300">{k.kategori}</td>
                          <td className="p-2 border border-slate-300">{k.tanggal} ({k.waktu})</td>
                          <td className="p-2 border border-slate-300">{k.tempat}</td>
                          <td className="p-2 border border-slate-300">{k.penanggungJawab || '-'}</td>
                          <td className="p-2 border border-slate-300 text-right font-mono">Rp {(k.anggaranEstimasi || 0).toLocaleString('id-ID')}</td>
                          <td className="p-2 border border-slate-300 text-center font-semibold">{k.status}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={9} className="p-4 text-center text-slate-500 italic">
                          Belum ada program kerja untuk seksi ini.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Section 3: Keuangan Kas Seksi */}
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 mb-2 uppercase border-b-2 border-slate-800 pb-1">
                III. Rekapitulasi Keuangan Kas Seksi Pelayanan Kategorial
              </h3>
              <div className="overflow-x-auto w-full">
                <table className="w-full text-xs text-left border-collapse border border-slate-400">
                  <thead>
                    <tr className="bg-slate-200 text-slate-900 border-b border-slate-400">
                      <th className="p-2 border border-slate-400 w-8 text-center">No</th>
                      <th className="p-2 border border-slate-400">Seksi Pelayanan Kategorial</th>
                      <th className="p-2 border border-slate-400 text-right">Total Pemasukan</th>
                      <th className="p-2 border border-slate-400 text-right">Total Pengeluaran</th>
                      <th className="p-2 border border-slate-400 text-right">Saldo Kas Akhir</th>
                    </tr>
                  </thead>
                  <tbody>
                    {kasBySeksi.map((kas, idx) => (
                      <tr key={kas.seksiKey} className="border-b border-slate-300">
                        <td className="p-2 border border-slate-300 text-center">{idx + 1}</td>
                        <td className="p-2 border border-slate-300 font-bold">{kas.seksiName}</td>
                        <td className="p-2 border border-slate-300 text-right font-mono text-emerald-800 font-semibold">Rp {kas.pemasukan.toLocaleString('id-ID')}</td>
                        <td className="p-2 border border-slate-300 text-right font-mono text-rose-800 font-semibold">Rp {kas.pengeluaran.toLocaleString('id-ID')}</td>
                        <td className="p-2 border border-slate-300 text-right font-mono font-extrabold text-slate-900">Rp {kas.saldo.toLocaleString('id-ID')}</td>
                      </tr>
                    ))}
                    <tr className="bg-slate-100 font-extrabold border-t-2 border-slate-800">
                      <td colSpan={2} className="p-2 border border-slate-400 text-right uppercase">Total Seluruh Kas Seksi:</td>
                      <td className="p-2 border border-slate-400 text-right font-mono text-emerald-900">Rp {totalKasMasuk.toLocaleString('id-ID')}</td>
                      <td className="p-2 border border-slate-400 text-right font-mono text-rose-900">Rp {totalKasKeluar.toLocaleString('id-ID')}</td>
                      <td className="p-2 border border-slate-400 text-right font-mono text-indigo-950 text-sm">Rp {totalSaldo.toLocaleString('id-ID')}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <SignatureBlock signers={['sekretaris', 'ketua']} />
          </div>
        );
      }

      case 'ulang_tahun': {
        const indonesianMonths = [
          'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
          'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
        ];

        const parseDate = (dateStr?: string) => {
          if (!dateStr) return null;
          const s = dateStr.trim();
          const ymd = s.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
          if (ymd) return { year: parseInt(ymd[1], 10), month: parseInt(ymd[2], 10), day: parseInt(ymd[3], 10) };
          const dmy = s.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
          if (dmy) return { day: parseInt(dmy[1], 10), month: parseInt(dmy[2], 10), year: parseInt(dmy[3], 10) };
          return null;
        };

        const currentYr = new Date().getFullYear();

        // 1. Birthdays
        const birthItems: { nama: string; rayon: string; noKjj: string; day: number; month: number; age: number }[] = [];
        wargaJemaatList.forEach((w) => {
          const pd = parseDate(w.tanggalLahir);
          if (pd) {
            birthItems.push({
              nama: w.namaLengkap,
              rayon: w.rayon || '-',
              noKjj: w.noKjj || '-',
              day: pd.day,
              month: pd.month,
              age: Math.max(0, currentYr - pd.year),
            });
          }
        });
        birthItems.sort((a, b) => a.month - b.month || a.day - b.day);

        // 2. Wedding Anniversaries
        const processedCoupleKeys = new Set<string>();
        const weddingItems: { label: string; rayon: string; noKjj: string; day: number; month: number; years: number }[] = [];

        wargaJemaatList.forEach((w) => {
          if (w.tanggalPernikahan && w.tanggalPernikahan.trim() !== '' && w.statusNikah === 'Menikah') {
            const pd = parseDate(w.tanggalPernikahan);
            if (pd) {
              const ckey = `${w.noKjj}_${w.tanggalPernikahan}`;
              if (!processedCoupleKeys.has(ckey)) {
                processedCoupleKeys.add(ckey);
                const family = wargaJemaatList.filter((m) => m.noKjj === w.noKjj && m.statusNikah === 'Menikah');
                const suami = family.find((m) => m.hubunganKeluarga === 'Kepala Keluarga' || m.jenisKelamin === 'L');
                const istri = family.find((m) => m.hubunganKeluarga === 'Istri' || (m.jenisKelamin === 'P' && m.id !== suami?.id));

                let label = '';
                if (suami && istri) label = `Kel. Bpk. ${suami.namaLengkap} & Ny. ${istri.namaLengkap}`;
                else if (suami) label = `Kel. Bpk. ${suami.namaLengkap}`;
                else if (istri) label = `Kel. Ny. ${istri.namaLengkap}`;
                else label = `Kel. ${w.namaLengkap}`;

                weddingItems.push({
                  label,
                  rayon: w.rayon || '-',
                  noKjj: w.noKjj || '-',
                  day: pd.day,
                  month: pd.month,
                  years: Math.max(0, currentYr - pd.year),
                });
              }
            }
          }
        });
        weddingItems.sort((a, b) => a.month - b.month || a.day - b.day);

        return (
          <div className="space-y-4">
            <KopSurat
              title={printConfig.customTitle || "LAPORAN DATA WARGA JEMAAT BERULANG TAHUN KELAHIRAN & PERNIKAHAN"}
              subtitle={`Majelis Jemaat GKE ${settings.namaJemaat || ''} - Rekapitulasi Otomatis Sensus Jemaat`}
            />

            <div className="bg-slate-50 border border-slate-300 p-2.5 rounded-lg text-xs flex justify-between items-center font-bold text-slate-800">
              <span>Total Terdaftar Sensus: {birthItems.length} HUT Kelahiran &amp; {weddingItems.length} HUT Pernikahan</span>
              <span>Diperbarui Live: {formatIndonesianDate(new Date().toISOString().split('T')[0])}</span>
            </div>

            {/* Section I: HUT Kelahiran */}
            <div>
              <h3 className="text-xs font-extrabold text-slate-900 mb-2 uppercase border-b-2 border-slate-800 pb-1 flex justify-between">
                <span>I. Daftar Warga Jemaat Berulang Tahun Kelahiran</span>
                <span className="text-slate-600 font-normal font-mono">Total: {birthItems.length} Jiwa</span>
              </h3>
              <div className="overflow-x-auto w-full">
                <table className="w-full text-xs text-left border-collapse border border-slate-400">
                  <thead>
                    <tr className="bg-slate-200 text-slate-900 border-b border-slate-400 font-bold">
                      <th className="p-1.5 border border-slate-400 w-8 text-center">No</th>
                      <th className="p-1.5 border border-slate-400">Nama Lengkap Warga Jemaat</th>
                      <th className="p-1.5 border border-slate-400">Tanggal Berulang Tahun</th>
                      <th className="p-1.5 border border-slate-400 text-center">Usia Saat Ini</th>
                      <th className="p-1.5 border border-slate-400">Lingkungan / Rayon</th>
                      <th className="p-1.5 border border-slate-400">No. KJJ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {birthItems.length > 0 ? (
                      birthItems.map((item, idx) => (
                        <tr key={idx} className="border-b border-slate-300">
                          <td className="p-1.5 border border-slate-300 text-center">{idx + 1}</td>
                          <td className="p-1.5 border border-slate-300 font-bold text-slate-900">{item.nama}</td>
                          <td className="p-1.5 border border-slate-300 font-semibold">{item.day} {indonesianMonths[item.month - 1]}</td>
                          <td className="p-1.5 border border-slate-300 text-center font-bold">{item.age} Tahun</td>
                          <td className="p-1.5 border border-slate-300">{item.rayon}</td>
                          <td className="p-1.5 border border-slate-300 font-mono text-slate-600">{item.noKjj}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="p-3 text-center text-slate-500 italic">
                          Belum ada data warga jemaat dengan tanggal lahir.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Section II: HUT Pernikahan */}
            <div>
              <h3 className="text-xs font-extrabold text-slate-900 mb-2 uppercase border-b-2 border-slate-800 pb-1 flex justify-between">
                <span>II. Daftar Pasangan Berulang Tahun Pernikahan (Anniversary)</span>
                <span className="text-slate-600 font-normal font-mono">Total: {weddingItems.length} Pasangan</span>
              </h3>
              <div className="overflow-x-auto w-full">
                <table className="w-full text-xs text-left border-collapse border border-slate-400">
                  <thead>
                    <tr className="bg-slate-200 text-slate-900 border-b border-slate-400 font-bold">
                      <th className="p-1.5 border border-slate-400 w-8 text-center">No</th>
                      <th className="p-1.5 border border-slate-400">Nama Pasangan Suami Istri</th>
                      <th className="p-1.5 border border-slate-400">Tanggal Pernikahan</th>
                      <th className="p-1.5 border border-slate-400 text-center">Usia Pernikahan</th>
                      <th className="p-1.5 border border-slate-400">Lingkungan / Rayon</th>
                      <th className="p-1.5 border border-slate-400">No. KJJ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {weddingItems.length > 0 ? (
                      weddingItems.map((item, idx) => (
                        <tr key={idx} className="border-b border-slate-300">
                          <td className="p-1.5 border border-slate-300 text-center">{idx + 1}</td>
                          <td className="p-1.5 border border-slate-300 font-bold text-slate-900">{item.label}</td>
                          <td className="p-1.5 border border-slate-300 font-semibold">{item.day} {indonesianMonths[item.month - 1]}</td>
                          <td className="p-1.5 border border-slate-300 text-center font-bold">{item.years} Tahun</td>
                          <td className="p-1.5 border border-slate-300">{item.rayon}</td>
                          <td className="p-1.5 border border-slate-300 font-mono text-slate-600">{item.noKjj}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="p-3 text-center text-slate-500 italic">
                          Belum ada data tanggal pernikahan warga jemaat.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <SignatureBlock signers={['sekretaris', 'ketua']} />
          </div>
        );
      }

      case 'audit_keamanan': {
        return (
          <div className="space-y-6">
            <KopSurat />
            <div className="text-center space-y-1">
              <h2 className="text-lg font-black uppercase tracking-wider text-slate-900 border-b-2 border-slate-900 pb-1 inline-block">
                LAPORAN AUDIT KEAMANAN &amp; LOG AKTIVITAS SISTEM
              </h2>
              <p className="text-xs font-semibold text-slate-600">
                Gereja Kalimantan Evangelist (GKE) {settings.namaJemaat || 'Efata'} - Periode Audit Real-Time
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-300 p-3 rounded-lg text-xs space-y-1">
              <div className="flex justify-between">
                <span className="font-bold text-slate-700">Tanggal Cetak Audit:</span>
                <span className="font-mono text-slate-900">{new Date().toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-bold text-slate-700">Total Catatan Activity Log:</span>
                <span className="font-bold text-slate-900">{auditLogs.length} Entri</span>
              </div>
              <div className="flex justify-between">
                <span className="font-bold text-slate-700">Status Keamanan Sistem:</span>
                <span className="font-extrabold text-emerald-700">SANGAT AMAN (RBAC &amp; Firestore Rules Terkunci)</span>
              </div>
            </div>

            <table className="w-full text-left border-collapse border border-slate-400">
              <thead>
                <tr className="bg-slate-200 text-[10px] font-bold uppercase text-slate-800">
                  <th className="border border-slate-400 p-1.5">Waktu</th>
                  <th className="border border-slate-400 p-1.5">Tingkat</th>
                  <th className="border border-slate-400 p-1.5">Kategori &amp; Aktivitas</th>
                  <th className="border border-slate-400 p-1.5">Pengguna (Role)</th>
                  <th className="border border-slate-400 p-1.5">Rincian Peristiwa</th>
                  <th className="border border-slate-400 p-1.5 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="text-[10px]">
                {auditLogs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center p-4 border border-slate-400 text-slate-500">
                      Belum ada catatan log aktivitas keamanan.
                    </td>
                  </tr>
                ) : (
                  auditLogs.map((log) => (
                    <tr key={log.id} className="border-b border-slate-300">
                      <td className="border border-slate-300 p-1.5 font-mono whitespace-nowrap">
                        {new Date(log.waktu).toLocaleString('id-ID')}
                      </td>
                      <td className="border border-slate-300 p-1.5 font-bold uppercase">
                        {log.level}
                      </td>
                      <td className="border border-slate-300 p-1.5">
                        <div className="font-bold text-slate-900">{log.aktivitas}</div>
                        <div className="text-[9px] text-slate-600 font-mono">{log.kategori}</div>
                      </td>
                      <td className="border border-slate-300 p-1.5">
                        <div className="font-semibold">{log.pengguna}</div>
                        <div className="text-[9px] text-slate-500 uppercase">{log.role}</div>
                      </td>
                      <td className="border border-slate-300 p-1.5 text-slate-800">
                        {log.detail}
                      </td>
                      <td className="border border-slate-300 p-1.5 text-center font-bold">
                        {log.status}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            <SignatureBlock />
          </div>
        );
      }

      case 'almanak_nast_gke': {
        const sortedNast = [...almanakNastList].sort((a, b) => a.tanggal.localeCompare(b.tanggal));
        const filteredNast = sortedNast.filter((item) => {
          if (localStartDate && item.tanggal < localStartDate) return false;
          if (localEndDate && item.tanggal > localEndDate) return false;
          if (localTahun && !item.tanggal.startsWith(localTahun)) return false;
          return true;
        });

        const totalHari = filteredNast.length;
        const totalHariRaya = filteredNast.filter((n) => n.isHariRaya || (n.keteranganHari && n.keteranganHari.trim().length > 0)).length;
        const totalMinggu = filteredNast.filter((n) => (n.hari || '').toLowerCase() === 'minggu').length;

        return (
          <div>
            <KopSurat
              title="ALMANAK NAST GKE — BACAAN HARIAN & LITURGIS"
              subtitle={`Gereja Kalimantan Evangelis (GKE) • Periode: ${
                localStartDate && localEndDate
                  ? `${formatIndonesianDate(localStartDate)} s/d ${formatIndonesianDate(localEndDate)}`
                  : localTahun
                  ? `Tahun ${localTahun}`
                  : 'Seluruh Data Terdaftar'
              }`}
            />

            {/* Header Metadata Statistics Box */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs mb-4 p-3 bg-slate-50 border border-slate-300 rounded font-sans">
              <div>
                <span className="text-slate-600 block">Total Hari Terjadwal:</span>
                <strong className="text-sm text-slate-900">{totalHari} Hari</strong>
              </div>
              <div>
                <span className="text-slate-600 block">Ibadah Hari Minggu:</span>
                <strong className="text-sm text-blue-700">{totalMinggu} Kali</strong>
              </div>
              <div>
                <span className="text-slate-600 block">Hari Raya & Peringatan:</span>
                <strong className="text-sm text-rose-700">{totalHariRaya} Hari</strong>
              </div>
              <div>
                <span className="text-slate-600 block">Sumber Liturgis:</span>
                <strong className="text-sm text-emerald-700">Sinode GKE</strong>
              </div>
            </div>

            <table className="w-full text-xs text-left border-collapse border border-slate-400 mb-4 font-sans">
              <thead>
                <tr className="bg-slate-200 text-slate-900 border-b border-slate-400 font-bold text-center">
                  <th className="p-2 border border-slate-400 w-28 text-center">Tanggal</th>
                  <th className="p-2 border border-slate-400 w-20 text-center">Hari</th>
                  <th className="p-2 border border-slate-400 text-left">Keterangan Hari</th>
                  <th className="p-2 border border-slate-400 w-28 text-center">Warna Stola</th>
                  <th className="p-2 border border-slate-400 text-left">Nast Bacaan</th>
                  <th className="p-2 border border-slate-400 text-left">Nast Khotbah</th>
                </tr>
              </thead>
              <tbody>
                {filteredNast.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-4 text-center text-slate-500 italic border border-slate-300">
                      Belum ada data Almanak Nast GKE pada rentang waktu yang dipilih.
                    </td>
                  </tr>
                ) : (
                  filteredNast.map((item) => {
                    const isHoliday =
                      item.isHariRaya ||
                      (item.hari || '').toLowerCase() === 'minggu' ||
                      (item.keteranganHari &&
                        (item.keteranganHari.toLowerCase().includes('jumat agung') ||
                          item.keteranganHari.toLowerCase().includes('paskah') ||
                          item.keteranganHari.toLowerCase().includes('natal') ||
                          item.keteranganHari.toLowerCase().includes('kenaikan') ||
                          item.keteranganHari.toLowerCase().includes('pentakosta') ||
                          item.keteranganHari.toLowerCase().includes('advent') ||
                          item.keteranganHari.toLowerCase().includes('hut gke') ||
                          item.keteranganHari.toLowerCase().includes('tahun baru')));

                    return (
                      <tr
                        key={item.id}
                        className={`border-b border-slate-300 ${
                          isHoliday ? 'text-rose-700 font-semibold bg-rose-50/40' : 'text-slate-900'
                        }`}
                      >
                        <td className="p-2 border border-slate-300 text-center whitespace-nowrap font-medium">
                          {formatIndonesianDate(item.tanggal)}
                        </td>
                        <td className="p-2 border border-slate-300 text-center font-bold">
                          {item.hari}
                        </td>
                        <td className="p-2 border border-slate-300 whitespace-pre-line">
                          {item.keteranganHari || '-'}
                        </td>
                        <td className="p-2 border border-slate-300 text-center font-medium">
                          {item.warnaStola || '-'}
                        </td>
                        <td className="p-2 border border-slate-300 font-bold">
                          {item.nastBacaan ? (
                            <div>
                              <div>{item.nastBacaan}</div>
                              {(item.judulPerikop || item.judulPerikopBacaan || findPerikopForReference(item.nastBacaan)) && (
                                <div className="text-[10px] font-normal italic text-slate-600 mt-0.5">
                                  🏷️ &ldquo;{item.judulPerikop || item.judulPerikopBacaan || findPerikopForReference(item.nastBacaan)}&rdquo;
                                </div>
                              )}
                            </div>
                          ) : (
                            '-'
                          )}
                        </td>
                        <td className="p-2 border border-slate-300 font-bold">
                          {item.nastKhotbah ? (
                            <div>
                              <div>{item.nastKhotbah}</div>
                              {(item.judulPerikopKhotbah || findPerikopForReference(item.nastKhotbah)) && (
                                <div className="text-[10px] font-normal italic text-slate-600 mt-0.5">
                                  🏷️ &ldquo;{item.judulPerikopKhotbah || findPerikopForReference(item.nastKhotbah)}&rdquo;
                                </div>
                              )}
                            </div>
                          ) : (
                            '-'
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>

            <SignatureBlock signers={['sekretaris', 'ketua']} />
          </div>
        );
      }

      case 'pemilihan':
      case 'pemilihan_rekap':
      case 'pemilihan_hasil':
      case 'pemilihan_berita_acara': {
        const targetSesi =
          sesiPemilihanList.find((s) => s.id === localSesiId) ||
          (sesiPemilihanList.length > 0 ? sesiPemilihanList[0] : null);

        const sessionCandidates = targetSesi
          ? kandidatPemilihanList
              .filter((k) => k.sesiId === targetSesi.id)
              .sort((a, b) => (b.jumlahSuara || 0) - (a.jumlahSuara || 0))
          : [];

        const sessionVotes = targetSesi
          ? suaraVotingList.filter((v) => v.sesiId === targetSesi.id)
          : [];

        const totalVotesAccumulated = sessionCandidates.reduce(
          (acc, curr) => acc + (curr.jumlahSuara || 0),
          0
        );

        // Group votes by Rayon for participation demographic
        const votesByRayon: Record<string, number> = {};
        sessionVotes.forEach((v) => {
          const r = v.voterRayon || 'Rayon Jemaat';
          votesByRayon[r] = (votesByRayon[r] || 0) + 1;
        });

        return (
          <div className="space-y-6 text-slate-800 text-sm leading-relaxed">
            <KopSurat />

            <div className="text-center space-y-1 border-b-2 border-slate-900 pb-3">
              <h2 className="text-lg font-black tracking-wide uppercase text-slate-900">
                BERITA ACARA & REKAPITULASI HASIL PEMILIHAN (E-VOTING)
              </h2>
              <p className="text-xs font-bold text-purple-900 uppercase">
                {targetSesi?.judulPemilihan || 'PEMILIHAN MAJELIS / PANITIA GKE'}
              </p>
              <p className="text-xs text-slate-600 font-medium">
                Periode Masa Bakti Pelayanan: <strong className="text-slate-900">{targetSesi?.periode || '2024 - 2029'}</strong> | Tanggal Pelaksanaan: <strong className="text-slate-900">{targetSesi?.tanggalMulai} s/d {targetSesi?.tanggalSelesai}</strong>
              </p>
            </div>

            {/* Sesi Metadata Card */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs">
              <div>
                <span className="text-slate-500 block text-[11px]">Sesi Pemilihan:</span>
                <span className="font-bold text-slate-900">{targetSesi?.judulPemilihan || '-'}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Status Sesi:</span>
                <span className="font-bold text-purple-800 uppercase">{targetSesi?.status || 'Aktif'}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Total Pemilih Masuk:</span>
                <span className="font-bold text-slate-900">{sessionVotes.length} Orang Pemilih</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Total Suara Terkumpul:</span>
                <span className="font-bold text-purple-700">{totalVotesAccumulated} Suara Sah</span>
              </div>
            </div>

            {/* Table Hasil Perolehan Suara */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                  I. DAFTAR PEROLEHAN SUARA KANDIDAT / CALON (HASIL AKHIR REAL-TIME)
                </h3>
                <span className="text-[11px] text-slate-500">
                  Maks. Pilihan: {targetSesi?.maksimalPilihan || 1} Calon per Pemilih
                </span>
              </div>

              <table className="w-full border-collapse border border-slate-300 text-xs">
                <thead>
                  <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300">
                    <th className="p-2 border border-slate-300 text-center w-10">Rank</th>
                    <th className="p-2 border border-slate-300 text-center w-14">No. Urut</th>
                    <th className="p-2 border border-slate-300 text-left">Nama Calon / Kandidat</th>
                    <th className="p-2 border border-slate-300 text-left">Jabatan Dicalonkan</th>
                    <th className="p-2 border border-slate-300 text-left">Rayon / Lingkungan</th>
                    <th className="p-2 border border-slate-300 text-center w-24">Jumlah Suara</th>
                    <th className="p-2 border border-slate-300 text-center w-20">Persentase</th>
                    <th className="p-2 border border-slate-300 text-center w-28">Keterangan</th>
                  </tr>
                </thead>
                <tbody>
                  {sessionCandidates.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-6 text-center text-slate-400">
                        Belum ada kandidat yang terdaftar pada sesi pemilihan ini.
                      </td>
                    </tr>
                  ) : (
                    sessionCandidates.map((c, idx) => {
                      const votes = c.jumlahSuara || 0;
                      const percentage =
                        totalVotesAccumulated > 0
                          ? ((votes / totalVotesAccumulated) * 100).toFixed(1)
                          : '0.0';
                      const isTopWinner = idx < (targetSesi?.maksimalPilihan || 1);

                      return (
                        <tr
                          key={c.id}
                          className={isTopWinner ? 'bg-purple-50/40 font-semibold' : ''}
                        >
                          <td className="p-2 border border-slate-300 text-center font-bold">
                            {idx + 1}
                          </td>
                          <td className="p-2 border border-slate-300 text-center font-bold text-purple-800">
                            #{c.nomorUrut}
                          </td>
                          <td className="p-2 border border-slate-300 font-bold text-slate-900">
                            {c.namaLengkap} {c.gelar ? `(${c.gelar})` : ''}
                          </td>
                          <td className="p-2 border border-slate-300">{c.jabatanDicalonkan}</td>
                          <td className="p-2 border border-slate-300">{c.lingkungan || '-'}</td>
                          <td className="p-2 border border-slate-300 text-center font-bold text-purple-900 text-sm">
                            {votes}
                          </td>
                          <td className="p-2 border border-slate-300 text-center font-mono">
                            {percentage}%
                          </td>
                          <td className="p-2 border border-slate-300 text-center text-[11px]">
                            {isTopWinner ? (
                              <span className="text-emerald-700 font-bold">Terpilih (Kuorum)</span>
                            ) : (
                              <span className="text-slate-500">Calon Tetap</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-100 font-bold border-t-2 border-slate-300 text-slate-900">
                    <td colSpan={5} className="p-2 border border-slate-300 text-right uppercase">
                      Total Akumulasi Suara Sah Terhitung:
                    </td>
                    <td className="p-2 border border-slate-300 text-center font-black text-purple-900 text-sm">
                      {totalVotesAccumulated}
                    </td>
                    <td className="p-2 border border-slate-300 text-center font-mono">100.0%</td>
                    <td className="p-2 border border-slate-300 text-center text-[11px] text-slate-600">
                      Sah & Terverifikasi
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Partisipasi Pemilih per Rayon */}
            {Object.keys(votesByRayon).length > 0 && (
              <div className="space-y-2 pt-2">
                <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                  II. REKAPITULASI PARTISIPASI PEMILIH PER LINGKUNGAN / RAYON JEMAAT
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  {Object.entries(votesByRayon).map(([rayon, count]) => (
                    <div
                      key={rayon}
                      className="p-2 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between"
                    >
                      <span className="font-medium text-slate-700">{rayon}</span>
                      <strong className="text-purple-700">{count} Pemilih</strong>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Berita Acara Text & Pernyataan Resmi */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 text-xs text-slate-700">
              <h4 className="font-bold text-slate-900 uppercase text-[11px]">
                III. PERNYATAAN PENGESAHAN PANITIA PEMILIHAN
              </h4>
              <p className="leading-relaxed text-[11px]">
                Berita Acara ini diterbitkan secara sah berdasarkan hasil pemungutan suara elektronik (E-Voting) yang diselenggarakan secara Langsung, Umum, Bebas, Rahasia, Jujur, dan Adil (LUBER-JURDIL). Seluruh data perolehan suara terekam secara aman, terenkripsi, dan dapat dipertanggungjawabkan dalam Sidang Majelis Jemaat GKE.
              </p>
            </div>

            {/* Signature Block Panitia & MPH */}
            <div className="pt-4">
              <SignatureBlock signers={['sekretaris', 'ketua']} />
            </div>
          </div>
        );
      }

      case 'task_board':
      case 'tugas_pelayanan': {
        const categoryLabels: Record<string, string> = {
          IBADAH: 'Ibadah & Liturgi',
          DIAKONIA: 'Diakonia & Kasih',
          PEMBANGUNAN: 'Pembangunan & Fisik',
          KATEKISASI: 'Katekisasi & Ajaran',
          SEKRETARIAT: 'Sekretariat & Tata Usaha',
          KEUANGAN: 'Keuangan & Perbendaharaan',
          SARPRAS: 'Sarana & Prasarana',
          ACARA_KHUSUS: 'Acara & Hari Besar Gerejawi',
          PELAYANAN_ANAK_REMAJA: 'Pelayanan Anak & Remaja (SPA/SPPR)',
        };

        const priorityLabels: Record<string, string> = {
          RENDAH: 'Rendah',
          SEDANG: 'Sedang',
          TINGGI: 'Tinggi',
          MENDESAK: 'Mendesak / Urgent',
        };

        const statusLabels: Record<string, string> = {
          TODO: 'Antrean (Belum Mulai)',
          IN_PROGRESS: 'Sedang Dikerjakan',
          REVIEW: 'Tahap Review / Evaluasi',
          COMPLETED: 'Selesai Dilaksanakan',
        };

        // Determine if printing a single specific task
        const activeTaskId = localTaskId || printConfig.taskId || printConfig.selectedId;
        const singleTask = activeTaskId ? pelayananTaskList.find((t) => t.id === activeTaskId) : null;

        if (singleTask) {
          const completedSubtasksCount = singleTask.subtasks.filter((s) => s.isDone).length;
          const totalSubtasks = singleTask.subtasks.length;
          const progressPercent = totalSubtasks > 0 ? Math.round((completedSubtasksCount / totalSubtasks) * 100) : (singleTask.status === 'COMPLETED' ? 100 : 0);

          return (
            <div className="space-y-6">
              <KopSurat
                title="LEMBAR DISPOSISI & PENUGASAN PELAYANAN GEREJA"
                subtitle={`Surat Tugas Resmi Pelayanan — Majelis Jemaat GKE`}
              />

              {/* Header Details Card */}
              <div className="border border-slate-300 rounded-xl p-4 bg-slate-50 font-sans text-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-200 gap-2">
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block">Judul Tugas Pelayanan:</span>
                    <h2 className="text-base font-serif font-bold text-slate-900 mt-0.5">{singleTask.judul}</h2>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="px-2.5 py-1 rounded bg-slate-200 text-slate-800 font-bold text-[11px] border border-slate-300">
                      {categoryLabels[singleTask.kategori] || singleTask.kategori}
                    </span>
                    <span className="px-2.5 py-1 rounded bg-blue-100 text-blue-900 font-bold text-[11px] border border-blue-200">
                      {statusLabels[singleTask.status] || singleTask.status}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div>
                    <span className="text-slate-500 font-bold uppercase text-[10px] block">Penanggung Jawab (PIC)</span>
                    <strong className="text-slate-900 text-xs block mt-0.5">{singleTask.penanggungJawab}</strong>
                    <span className="text-slate-500 text-[10px] block">{singleTask.penanggungJawabRole || 'Pelayan Jemaat'}</span>
                    {singleTask.penanggungJawabHp && (
                      <span className="text-emerald-700 font-medium text-[10px] block">WA: {singleTask.penanggungJawabHp}</span>
                    )}
                  </div>

                  <div>
                    <span className="text-slate-500 font-bold uppercase text-[10px] block">Pemberi Tugas / Mandat</span>
                    <strong className="text-slate-900 text-xs block mt-0.5">{singleTask.pemberiTugas || 'MPH Majelis Jemaat'}</strong>
                    <span className="text-slate-500 text-[10px] block">Tgl Dibuat: {formatIndonesianDate(singleTask.tanggalDibuat)}</span>
                  </div>

                  <div>
                    <span className="text-slate-500 font-bold uppercase text-[10px] block">Tenggat Waktu (Target)</span>
                    <strong className="text-rose-900 text-xs block mt-0.5">{formatIndonesianDate(singleTask.tenggatWaktu)}</strong>
                    <span className="text-slate-500 text-[10px] block">
                      Prioritas: <strong>{priorityLabels[singleTask.prioritas] || singleTask.prioritas}</strong>
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-500 font-bold uppercase text-[10px] block">Anggaran & Realisasi</span>
                    <strong className="text-slate-900 text-xs block mt-0.5">
                      {singleTask.anggaran ? `Rp ${singleTask.anggaran.toLocaleString('id-ID')}` : 'Non-Anggaran'}
                    </strong>
                    {singleTask.realisasiAnggaran ? (
                      <span className="text-emerald-700 text-[10px] block">
                        Realisasi: Rp {singleTask.realisasiAnggaran.toLocaleString('id-ID')}
                      </span>
                    ) : null}
                  </div>
                </div>

                {singleTask.lokasiTerkait && (
                  <div className="pt-2 border-t border-slate-200">
                    <span className="text-slate-500 font-bold uppercase text-[10px]">Lokasi Pelaksanaan: </span>
                    <span className="font-semibold text-slate-800">{singleTask.lokasiTerkait}</span>
                  </div>
                )}
              </div>

              {/* Description */}
              <div className="border border-slate-300 rounded-xl p-4 bg-white">
                <h4 className="text-xs font-bold font-sans uppercase text-slate-700 mb-2 pb-1 border-b border-slate-100">
                  I. Deskripsi & Instruksi Pelaksanaan Tugas
                </h4>
                <p className="text-xs text-slate-800 font-serif leading-relaxed whitespace-pre-line">
                  {singleTask.deskripsi || 'Tidak ada uraian deskripsi tertulis.'}
                </p>
              </div>

              {/* Subtasks Checklist */}
              <div className="border border-slate-300 rounded-xl p-4 bg-white">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-3">
                  <h4 className="text-xs font-bold font-sans uppercase text-slate-700">
                    II. Rincian Subtask & Checklist Progres Pelayanan
                  </h4>
                  <span className="text-xs font-bold font-sans text-blue-900 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                    {completedSubtasksCount} dari {totalSubtasks} Selesai ({progressPercent}%)
                  </span>
                </div>

                {singleTask.subtasks.length > 0 ? (
                  <table className="w-full text-xs text-left border-collapse border border-slate-300">
                    <thead>
                      <tr className="bg-slate-100 text-slate-800 font-sans">
                        <th className="p-2 border border-slate-300 w-10 text-center">Status</th>
                        <th className="p-2 border border-slate-300">Uraian Butir Subtask / Rencana Kerja</th>
                        <th className="p-2 border border-slate-300 w-44">PIC Pelaksana</th>
                      </tr>
                    </thead>
                    <tbody>
                      {singleTask.subtasks.map((st, idx) => (
                        <tr key={st.id || idx} className="border-b border-slate-200 font-serif">
                          <td className="p-2 border border-slate-300 text-center font-sans font-bold">
                            {st.isDone ? (
                              <span className="text-emerald-700">[ ✓ ] Selesai</span>
                            ) : (
                              <span className="text-slate-400">[ &nbsp; ] Belum</span>
                            )}
                          </td>
                          <td className={`p-2 border border-slate-300 ${st.isDone ? 'line-through text-slate-500' : 'font-medium text-slate-900'}`}>
                            {st.judul}
                          </td>
                          <td className="p-2 border border-slate-300 font-sans text-slate-600">
                            {st.assignedTo || singleTask.penanggungJawab}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="text-xs text-slate-500 italic">Belum ada item checklist subtask yang ditambahkan.</p>
                )}
              </div>

              {/* Progress Log Notes */}
              {(singleTask.catatanProgres || []).length > 0 && (
                <div className="border border-slate-300 rounded-xl p-4 bg-white">
                  <h4 className="text-xs font-bold font-sans uppercase text-slate-700 mb-3 pb-1 border-b border-slate-100">
                    III. Catatan Riwayat Koordinasi & Perkembangan Tugas
                  </h4>
                  <div className="space-y-2 font-sans text-xs">
                    {singleTask.catatanProgres.map((note, idx) => (
                      <div key={note.id || idx} className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
                        <div className="flex items-center justify-between text-[11px] mb-1">
                          <strong className="text-slate-900">{note.penulis} {note.userRole ? `(${note.userRole})` : ''}</strong>
                          <span className="text-slate-500">{note.waktu}</span>
                        </div>
                        <p className="text-slate-700 font-serif text-xs leading-relaxed">{note.catatan}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Disposisi Signatures */}
              <div className="pt-4 border-t border-slate-200">
                <div className="grid grid-cols-2 gap-8 text-center font-sans text-xs">
                  <div>
                    <p className="text-slate-500 mb-1">Pemberi Tugas / Majelis Pekerja Harian (MPH)</p>
                    <p className="text-slate-700 font-bold mb-16">Ketua Majelis Jemaat</p>
                    <p className="font-bold underline text-slate-900 uppercase">{settings.namaKetuaJemaat || 'Pdt. Ketua Majelis Jemaat'}</p>
                    <p className="text-[11px] text-slate-500">Majelis Jemaat GKE</p>
                  </div>
                  <div>
                    <p className="text-slate-500 mb-1">Penerima Tugas / Penanggung Jawab</p>
                    <p className="text-slate-700 font-bold mb-16">{singleTask.penanggungJawabRole || 'Pelaksana Pelayanan'}</p>
                    <p className="font-bold underline text-slate-900 uppercase">{singleTask.penanggungJawab}</p>
                    <p className="text-[11px] text-slate-500">{singleTask.penanggungJawabHp ? `WA: ${singleTask.penanggungJawabHp}` : 'Pelayan Jemaat'}</p>
                  </div>
                </div>
              </div>
            </div>
          );
        }

        // Full Task Board Rekapitulasi Table
        let filteredTasks = [...pelayananTaskList];

        if (localTaskCategory && localTaskCategory !== 'ALL') {
          filteredTasks = filteredTasks.filter((t) => t.kategori === localTaskCategory);
        }
        if (localTaskStatus && localTaskStatus !== 'ALL') {
          filteredTasks = filteredTasks.filter((t) => t.status === localTaskStatus);
        }
        if (localTaskPriority && localTaskPriority !== 'ALL') {
          filteredTasks = filteredTasks.filter((t) => t.prioritas === localTaskPriority);
        }
        if (localStartDate) {
          filteredTasks = filteredTasks.filter((t) => t.tenggatWaktu >= localStartDate || t.tanggalDibuat >= localStartDate);
        }
        if (localEndDate) {
          filteredTasks = filteredTasks.filter((t) => t.tenggatWaktu <= localEndDate || t.tanggalDibuat <= localEndDate);
        }

        // Sort: Urgent first, then by deadline
        const priorityOrder: Record<string, number> = { MENDESAK: 1, TINGGI: 2, SEDANG: 3, RENDAH: 4 };
        filteredTasks.sort((a, b) => {
          const pA = priorityOrder[a.prioritas] || 5;
          const pB = priorityOrder[b.prioritas] || 5;
          if (pA !== pB) return pA - pB;
          return a.tenggatWaktu.localeCompare(b.tenggatWaktu);
        });

        // Summary metrics
        const totalTasks = filteredTasks.length;
        const totalCompleted = filteredTasks.filter((t) => t.status === 'COMPLETED').length;
        const totalInProgress = filteredTasks.filter((t) => t.status === 'IN_PROGRESS').length;
        const totalReview = filteredTasks.filter((t) => t.status === 'REVIEW').length;
        const totalTodo = filteredTasks.filter((t) => t.status === 'TODO').length;
        const totalAnggaran = filteredTasks.reduce((acc, t) => acc + (t.anggaran || 0), 0);
        const completionRate = totalTasks > 0 ? Math.round((totalCompleted / totalTasks) * 100) : 0;

        const subtitleText = [
          localTaskCategory !== 'ALL' ? `Kategori: ${categoryLabels[localTaskCategory] || localTaskCategory}` : null,
          localTaskStatus !== 'ALL' ? `Status: ${statusLabels[localTaskStatus] || localTaskStatus}` : null,
          localTaskPriority !== 'ALL' ? `Prioritas: ${priorityLabels[localTaskPriority] || localTaskPriority}` : null,
        ].filter(Boolean).join(' | ') || 'Seluruh Divisi & Seksi Pelayanan Jemaat';

        return (
          <div className="space-y-4">
            <KopSurat
              title="LAPORAN REKAPITULASI MANAJEMEN TUGAS PELAYANAN (TASK BOARD)"
              subtitle={`Majelis Jemaat GKE — ${subtitleText}`}
            />

            {/* Summary Metrics Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-4 p-3 bg-slate-50 border border-slate-300 rounded-lg text-xs font-sans text-center">
              <div className="border-r border-slate-200 pr-2">
                <span className="text-slate-500 uppercase text-[9px] font-bold block">Total Tugas</span>
                <p className="text-sm font-bold text-slate-900 mt-0.5">{totalTasks} Tugas</p>
              </div>
              <div className="border-r border-slate-200 pr-2">
                <span className="text-slate-500 uppercase text-[9px] font-bold block">Sedang Berjalan</span>
                <p className="text-sm font-bold text-blue-700 mt-0.5">{totalInProgress} Tugas</p>
              </div>
              <div className="border-r border-slate-200 pr-2">
                <span className="text-slate-500 uppercase text-[9px] font-bold block">Evaluasi / Review</span>
                <p className="text-sm font-bold text-amber-700 mt-0.5">{totalReview} Tugas</p>
              </div>
              <div className="border-r border-slate-200 pr-2">
                <span className="text-slate-500 uppercase text-[9px] font-bold block">Selesai ({completionRate}%)</span>
                <p className="text-sm font-bold text-emerald-700 mt-0.5">{totalCompleted} Tugas</p>
              </div>
              <div>
                <span className="text-slate-500 uppercase text-[9px] font-bold block">Total Alokasi Anggaran</span>
                <p className="text-xs sm:text-sm font-bold text-indigo-900 mt-0.5">
                  Rp {totalAnggaran.toLocaleString('id-ID')}
                </p>
              </div>
            </div>

            {/* Tasks Table */}
            <table className="w-full text-xs text-left border-collapse border border-slate-400 mb-4 font-sans">
              <thead>
                <tr className="bg-slate-200 text-slate-900 border-b border-slate-400">
                  <th className="p-2 border border-slate-400 w-8 text-center">No</th>
                  <th className="p-2 border border-slate-400">Tugas Pelayanan & Kategori</th>
                  <th className="p-2 border border-slate-400">Penanggung Jawab (PIC)</th>
                  <th className="p-2 border border-slate-400">Tenggat Target</th>
                  <th className="p-2 border border-slate-400 text-center">Prioritas</th>
                  <th className="p-2 border border-slate-400 text-center">Status</th>
                  <th className="p-2 border border-slate-400 text-center">Subtask</th>
                  <th className="p-2 border border-slate-400 text-right">Alokasi Anggaran</th>
                </tr>
              </thead>
              <tbody>
                {filteredTasks.map((t, idx) => {
                  const doneSubtasks = t.subtasks.filter((s) => s.isDone).length;
                  const totalSub = t.subtasks.length;
                  return (
                    <tr key={t.id} className="border-b border-slate-300 hover:bg-slate-50">
                      <td className="p-2 border border-slate-300 text-center font-bold text-slate-600">{idx + 1}</td>
                      <td className="p-2 border border-slate-300">
                        <div className="font-bold text-slate-900 font-serif text-[13px]">{t.judul}</div>
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          {categoryLabels[t.kategori] || t.kategori} {t.lokasiTerkait ? `• Lokasi: ${t.lokasiTerkait}` : ''}
                        </div>
                      </td>
                      <td className="p-2 border border-slate-300">
                        <div className="font-semibold text-slate-900">{t.penanggungJawab}</div>
                        <div className="text-[10px] text-slate-500">{t.penanggungJawabRole || 'PIC'}</div>
                      </td>
                      <td className="p-2 border border-slate-300 whitespace-nowrap">
                        <span className="font-medium text-slate-800">{t.tenggatWaktu}</span>
                      </td>
                      <td className="p-2 border border-slate-300 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                            t.prioritas === 'MENDESAK'
                              ? 'bg-rose-100 text-rose-800'
                              : t.prioritas === 'TINGGI'
                              ? 'bg-amber-100 text-amber-800'
                              : t.prioritas === 'SEDANG'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {priorityLabels[t.prioritas] || t.prioritas}
                        </span>
                      </td>
                      <td className="p-2 border border-slate-300 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                            t.status === 'COMPLETED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : t.status === 'IN_PROGRESS'
                              ? 'bg-blue-100 text-blue-800'
                              : t.status === 'REVIEW'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {statusLabels[t.status] || t.status}
                        </span>
                      </td>
                      <td className="p-2 border border-slate-300 text-center text-[11px] font-medium text-slate-600">
                        {totalSub > 0 ? `${doneSubtasks}/${totalSub}` : '-'}
                      </td>
                      <td className="p-2 border border-slate-300 text-right font-mono text-[11px]">
                        {t.anggaran ? `Rp ${t.anggaran.toLocaleString('id-ID')}` : '-'}
                      </td>
                    </tr>
                  );
                })}
                {filteredTasks.length === 0 && (
                  <tr>
                    <td colSpan={8} className="p-6 text-center text-slate-500 italic">
                      Tidak ada data tugas pelayanan yang cocok dengan filter yang dipilih.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            <SignatureBlock signers={['sekretaris', 'ketua']} />
          </div>
        );
      }

      case 'alkitab_bacaan': {
        const bookName = localAlkitabBookName || printConfig.alkitabKitab || 'Alkitab';
        const pasal = printConfig.alkitabPasal || 1;
        const ayatStart = printConfig.alkitabAyatStart;
        const ayatEnd = printConfig.alkitabAyatEnd || ayatStart;
        const rangeText = ayatStart ? `Ayat ${ayatStart}${ayatEnd && ayatEnd !== ayatStart ? ` - ${ayatEnd}` : ''}` : `Pasal ${pasal} Lengkap`;

        return (
          <div className="space-y-6 text-slate-900 font-serif">
            <KopSurat />

            <div className="text-center space-y-1.5 border-b-2 border-slate-900 pb-4">
              <h2 className="text-lg font-bold uppercase tracking-wider text-slate-900">
                LEMBAR NASKAH BACAAN ALKITAB IBADAH
              </h2>
              <p className="text-sm font-semibold text-slate-700">
                Gereja Kalimantan Evangelis (GKE) • Terjemahan Baru (TB) LAI
              </p>
              <div className="inline-block mt-2 px-4 py-1 rounded-full bg-slate-100 border border-slate-300 font-sans font-bold text-sm text-indigo-900">
                📖 {bookName} {pasal} : {rangeText}
              </div>
              {localAlkitabPerikop && (
                <div className="text-base font-bold italic text-slate-800 pt-1">
                  "{localAlkitabPerikop}"
                </div>
              )}
            </div>

            {/* Verses Container */}
            <div className="space-y-3.5 text-sm sm:text-base leading-relaxed sm:leading-loose text-justify">
              {localAlkitabVerses.length > 0 ? (
                localAlkitabVerses.map((v) => (
                  <div key={v.ayat} className="flex items-start gap-2.5">
                    <span className="font-sans font-bold text-xs text-indigo-800 bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 rounded shrink-0 select-none mt-0.5">
                      {v.ayat}
                    </span>
                    <p className="flex-1 text-slate-900">{v.firman}</p>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-slate-500 italic">
                  Sedang menyiapkan naskah bacaan Alkitab...
                </div>
              )}
            </div>

            {/* Notes / Liturgy Reflection Box */}
            <div className="mt-6 p-4 rounded-xl border border-slate-300 bg-slate-50/50 space-y-1 text-xs font-sans">
              <p className="font-bold text-slate-800">Catatan Pelayanan / Renungan:</p>
              <p className="text-slate-600 italic">
                "Segala tulisan yang diilhamkan Allah memang bermanfaat untuk mengajar, untuk menyatakan kesalahan, untuk memperbaiki kelakuan dan untuk mendidik orang dalam kebenaran." (2 Timotius 3:16)
              </p>
            </div>

            <SignatureBlock signers={['liturgos', 'pelayan_firman']} />
          </div>
        );
      }

      case 'iuran_kewajiban': {
        const year = (printConfig as any)?.selectedYear || new Date().getFullYear();
        const filterRayon = (printConfig as any)?.selectedRayon || 'semua';
        const defaultNominal = settings.nominalIuranWajibPerBulan || 25000;

        // Build distinct KK list
        const kkMap = new Map<string, { noKjj: string; namaKepalaKeluarga: string; rayon: string }>();
        wargaJemaatList.forEach((w) => {
          const kjj = (w.noKjj || '').trim();
          if (!kjj) return;
          if (!kkMap.has(kjj)) {
            kkMap.set(kjj, {
              noKjj: kjj,
              namaKepalaKeluarga: w.hubunganKeluarga === 'Kepala Keluarga' ? w.namaLengkap : `Kel. ${w.namaLengkap}`,
              rayon: w.rayon || 'Rayon 1',
            });
          } else if (w.hubunganKeluarga === 'Kepala Keluarga') {
            const cur = kkMap.get(kjj)!;
            cur.namaKepalaKeluarga = w.namaLengkap;
            if (w.rayon) cur.rayon = w.rayon;
          }
        });

        iuranKewajibanList.forEach((ik) => {
          if (ik.noKjj && !kkMap.has(ik.noKjj)) {
            kkMap.set(ik.noKjj, {
              noKjj: ik.noKjj,
              namaKepalaKeluarga: ik.namaKepalaKeluarga,
              rayon: ik.rayon || 'Rayon 1',
            });
          }
        });

        const list = Array.from(kkMap.values())
          .filter((kk) => filterRayon === 'semua' || kk.rayon === filterRayon)
          .sort((a, b) => a.namaKepalaKeluarga.localeCompare(b.namaKepalaKeluarga))
          .map((kk) => {
            const record = iuranKewajibanList.find(
              (x) => x.tahun === year && x.noKjj === kk.noKjj
            );
            const nominal = record?.nominalPerBulan || defaultNominal;
            let totalBayar = 0;
            const bulanan: { [m: number]: boolean } = {};
            for (let m = 1; m <= 12; m++) {
              const det = record?.iuranBulanan?.[m];
              if (det && det.lunas) {
                bulanan[m] = true;
                totalBayar += det.nominal || nominal;
              } else {
                bulanan[m] = false;
              }
            }
            const target = nominal * 12;
            const tunggakan = Math.max(0, target - totalBayar);
            return {
              ...kk,
              bulanan,
              totalBayar,
              target,
              tunggakan,
              status: totalBayar >= target ? 'Lunas' : totalBayar > 0 ? 'Sebagian' : 'Belum Bayar',
            };
          });

        const grandTotalSetor = list.reduce((sum, item) => sum + item.totalBayar, 0);
        const grandTotalTarget = list.reduce((sum, item) => sum + item.target, 0);
        const grandTotalTunggakan = list.reduce((sum, item) => sum + item.tunggakan, 0);

        return (
          <div className="space-y-6 text-slate-900 font-serif">
            <KopSurat />

            <div className="text-center space-y-1 border-b-2 border-slate-900 pb-3">
              <h2 className="text-base sm:text-lg font-bold uppercase tracking-wider text-slate-950 font-sans">
                REKAPITULASI MATRIKS IURAN KEWAJIBAN WARGA JEMAAT (JAN - DES)
              </h2>
              <p className="text-xs font-semibold text-slate-700 font-sans">
                Tahun Pembukuan: <strong>{year}</strong> • Rayon / Lingkungan:{' '}
                <strong>{filterRayon === 'semua' ? 'Semua Rayon' : filterRayon}</strong> • Acuan Iuran:{' '}
                <strong>Rp {defaultNominal.toLocaleString('id-ID')}/Bulan</strong>
              </p>
            </div>

            {/* Table Matrix */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[11px] border-collapse border border-slate-400 font-sans">
                <thead>
                  <tr className="bg-slate-100 text-slate-900 font-bold border-b border-slate-400 text-center">
                    <th className="p-1.5 border border-slate-400 w-8">No</th>
                    <th className="p-1.5 border border-slate-400 text-left min-w-[140px]">Kepala Keluarga (No KJJ)</th>
                    <th className="p-1.5 border border-slate-400 min-w-[65px]">Rayon</th>
                    {['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'].map((b) => (
                      <th key={b} className="p-1 border border-slate-400 w-8 text-center text-[10px]">
                        {b}
                      </th>
                    ))}
                    <th className="p-1.5 border border-slate-400 text-right min-w-[85px]">Terbayar</th>
                    <th className="p-1.5 border border-slate-400 text-right min-w-[80px]">Tunggakan</th>
                    <th className="p-1.5 border border-slate-400 min-w-[70px]">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {list.length === 0 ? (
                    <tr>
                      <td colSpan={18} className="p-6 text-center text-slate-500 italic">
                        Tidak ada data warga / KK yang ditemukan.
                      </td>
                    </tr>
                  ) : (
                    list.map((item, idx) => (
                      <tr key={item.noKjj} className="border-b border-slate-300">
                        <td className="p-1.5 border border-slate-300 text-center font-mono">{idx + 1}</td>
                        <td className="p-1.5 border border-slate-300">
                          <div className="font-bold text-slate-950">{item.namaKepalaKeluarga}</div>
                          <div className="text-[10px] text-slate-600 font-mono">{item.noKjj}</div>
                        </td>
                        <td className="p-1.5 border border-slate-300 text-center">{item.rayon}</td>
                        {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                          <td
                            key={m}
                            className={`p-1 border border-slate-300 text-center font-mono font-bold text-[10px] ${
                              item.bulanan[m] ? 'bg-emerald-50 text-emerald-800' : 'text-slate-400'
                            }`}
                          >
                            {item.bulanan[m] ? '✓' : '-'}
                          </td>
                        ))}
                        <td className="p-1.5 border border-slate-300 text-right font-mono font-bold text-slate-950">
                          Rp {item.totalBayar.toLocaleString('id-ID')}
                        </td>
                        <td className="p-1.5 border border-slate-300 text-right font-mono text-slate-700">
                          Rp {item.tunggakan.toLocaleString('id-ID')}
                        </td>
                        <td className="p-1.5 border border-slate-300 text-center text-[10px] font-bold">
                          <span
                            className={
                              item.status === 'Lunas'
                                ? 'text-emerald-700'
                                : item.status === 'Sebagian'
                                ? 'text-indigo-700'
                                : 'text-rose-700'
                            }
                          >
                            {item.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-100 font-bold border-t-2 border-slate-900 text-slate-950">
                    <td colSpan={15} className="p-2 text-right border border-slate-400 uppercase text-xs">
                      TOTAL PENERIMAAN IURAN ({list.length} KK):
                    </td>
                    <td className="p-2 text-right border border-slate-400 font-mono text-xs text-emerald-800">
                      Rp {grandTotalSetor.toLocaleString('id-ID')}
                    </td>
                    <td className="p-2 text-right border border-slate-400 font-mono text-xs text-amber-800">
                      Rp {grandTotalTunggakan.toLocaleString('id-ID')}
                    </td>
                    <td className="p-2 text-center border border-slate-400 text-xs">
                      {grandTotalTarget > 0 ? `${Math.round((grandTotalSetor / grandTotalTarget) * 100)}%` : '-'}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Note & Signatures */}
            <div className="text-xs font-sans text-slate-600 italic">
              * Seluruh penerimaan iuran kewajiban di atas telah dibukukan dan diverifikasi pada Buku Kas Jemaat GKE.
            </div>

            <SignatureBlock signers={['bendahara', 'ketua']} />
          </div>
        );
      }

      case 'surat_keterangan_kematian': {
        const item =
          (localWargaId ? wargaJemaatList.find((w) => w.id === localWargaId) : null) ||
          (printConfig.wargaId ? wargaJemaatList.find((w) => w.id === printConfig.wargaId) : null) ||
          wargaJemaatList.find((w) => w.statusKeanggotaan === 'Meninggal') ||
          wargaJemaatList[0];

        if (!item) {
          return (
            <div className="max-w-xl mx-auto p-8 my-8 text-center bg-white rounded-xl border border-slate-200 shadow-sm font-sans">
              <AlertCircle className="w-12 h-12 text-slate-400 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-900 mb-1">Data Warga Belum Tersedia</h3>
              <p className="text-xs text-slate-600">
                Silakan pilih warga jemaat yang akan dicetak surat keterangan kematiannya.
              </p>
            </div>
          );
        }

        // Calculate age
        const birthDate = item.tanggalLahir ? new Date(item.tanggalLahir) : null;
        const deathDate = item.tanggalMeninggal ? new Date(item.tanggalMeninggal) : new Date();
        let calculatedAge = 0;
        if (birthDate && !isNaN(birthDate.getTime())) {
          calculatedAge = deathDate.getFullYear() - birthDate.getFullYear();
          const m = deathDate.getMonth() - birthDate.getMonth();
          if (m < 0 || (m === 0 && deathDate.getDate() < birthDate.getDate())) {
            calculatedAge--;
          }
        }

        const nomorSurat = item.nomorSuratKematian || `.../MJ-GKE/${(settings.namaJemaat || 'JMT').toUpperCase().replace(/\\s+/g, '-')}/SKK/${new Date().getFullYear()}`;
        const tempatSurat = settings.tempatDiterbitkan || settings.namaJemaat || 'Palangka Raya';
        const tanggalSurat = item.tanggalMeninggal ? formatIndonesianDate(item.tanggalMeninggal) : formatIndonesianDate(new Date().toISOString().split('T')[0]);

        return (
          <div className="font-serif text-slate-900 leading-relaxed px-4 py-2 sm:px-6">
            <KopSurat
              title=""
              subtitle=""
              hideTitle={true}
            />

            {/* Document Title Header */}
            <div className="text-center my-4">
              <h2 className="text-base sm:text-lg font-bold uppercase tracking-wider underline text-slate-950 font-serif">
                SURAT KETERANGAN KEMATIAN
              </h2>
              <p className="text-xs font-sans tracking-wide text-slate-700 mt-0.5">
                (AKTA KEMATIAN WARGA JEMAAT GKE)
              </p>
              <p className="text-xs font-mono font-semibold text-slate-800 mt-1">
                Nomor: {nomorSurat}
              </p>
            </div>

            {/* Scripture Verse Quote */}
            <div className="border border-slate-300 bg-slate-50/80 p-3 rounded-lg my-4 text-center text-xs font-serif italic text-slate-800 leading-normal">
              &ldquo;Berbahagialah orang-orang mati yang mati dalam Tuhan, sejak sekarang ini. &lsquo;Sungguh,&rsquo; kata Roh, &lsquo;supaya mereka boleh beristirahat dari jerih lelah mereka, karena segala perbuatan mereka menyertai mereka.&rsquo;&rdquo;
              <span className="block not-italic font-bold font-sans text-[11px] text-slate-600 mt-1">
                (Wahyu 14:13)
              </span>
            </div>

            {/* Introductory Text */}
            <p className="text-xs sm:text-sm font-serif text-justify mb-3">
              Majelis Pekerja Harian (MPH) Jemaat Gereja Kalimantan Evangelis (GKE) <strong>{settings.namaJemaat || '........................'}</strong>, Resort GKE <strong>{settings.resortGke || '........................'}</strong>, dengan ini menerangkan dengan sesungguhnya bahwa:
            </p>

            {/* Person Details Table */}
            <div className="bg-white border border-slate-300 rounded-lg p-3.5 mb-4 text-xs font-sans">
              <table className="w-full border-collapse">
                <tbody>
                  <tr className="border-b border-slate-200">
                    <td className="py-1.5 pr-2 font-semibold text-slate-600 w-44">Nama Lengkap</td>
                    <td className="py-1.5 px-1 font-bold text-slate-900 w-3">:</td>
                    <td className="py-1.5 font-bold text-slate-950 uppercase text-sm">
                      {item.namaLengkap} <span className="text-xs font-semibold text-slate-600">(Almarhum / Almarhumah)</span>
                    </td>
                  </tr>
                  <tr className="border-b border-slate-200">
                    <td className="py-1.5 pr-2 font-semibold text-slate-600">Nomor KJJ (Kartu Keluarga)</td>
                    <td className="py-1.5 px-1 font-bold text-slate-900">:</td>
                    <td className="py-1.5 font-mono font-semibold text-slate-800">{item.noKjj || '-'}</td>
                  </tr>
                  <tr className="border-b border-slate-200">
                    <td className="py-1.5 pr-2 font-semibold text-slate-600">Nomor Induk Kependudukan (NIK)</td>
                    <td className="py-1.5 px-1 font-bold text-slate-900">:</td>
                    <td className="py-1.5 font-mono text-slate-800">{item.nik || '-'}</td>
                  </tr>
                  <tr className="border-b border-slate-200">
                    <td className="py-1.5 pr-2 font-semibold text-slate-600">Tempat, Tanggal Lahir</td>
                    <td className="py-1.5 px-1 font-bold text-slate-900">:</td>
                    <td className="py-1.5 text-slate-800">
                      {item.tempatLahir || '-'}, {item.tanggalLahir ? formatIndonesianDate(item.tanggalLahir) : '-'} ({calculatedAge > 0 ? `${calculatedAge} Tahun` : '-'})
                    </td>
                  </tr>
                  <tr className="border-b border-slate-200">
                    <td className="py-1.5 pr-2 font-semibold text-slate-600">Jenis Kelamin</td>
                    <td className="py-1.5 px-1 font-bold text-slate-900">:</td>
                    <td className="py-1.5 text-slate-800">{item.jenisKelamin === 'L' ? 'Laki-Laki' : 'Perempuan'}</td>
                  </tr>
                  <tr className="border-b border-slate-200">
                    <td className="py-1.5 pr-2 font-semibold text-slate-600">Status Sakramen</td>
                    <td className="py-1.5 px-1 font-bold text-slate-900">:</td>
                    <td className="py-1.5 text-slate-800">
                      Baptis: <strong>{item.statusBaptis ? 'Sudah Dibaptis' : 'Belum'}</strong> | Sidi: <strong>{item.statusSidi ? 'Sudah Sidi' : 'Belum'}</strong> | Status Nikah: <strong>{item.statusNikah || '-'}</strong>
                    </td>
                  </tr>
                  <tr className="border-b border-slate-200">
                    <td className="py-1.5 pr-2 font-semibold text-slate-600">Lingkungan / Rayon Pelayanan</td>
                    <td className="py-1.5 px-1 font-bold text-slate-900">:</td>
                    <td className="py-1.5 font-semibold text-slate-800">{item.rayon || '-'}</td>
                  </tr>
                  <tr>
                    <td className="py-1.5 pr-2 font-semibold text-slate-600">Alamat Terakhir</td>
                    <td className="py-1.5 px-1 font-bold text-slate-900">:</td>
                    <td className="py-1.5 text-slate-800">{item.alamat || '-'}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Death Event Section */}
            <p className="text-xs sm:text-sm font-serif text-justify mb-2">
              Telah berpulang ke pangkuan Bapa di Sorga pada:
            </p>
            <div className="bg-slate-50 border border-slate-300 rounded-lg p-3.5 mb-4 text-xs font-sans">
              <table className="w-full border-collapse">
                <tbody>
                  <tr className="border-b border-slate-200">
                    <td className="py-1.5 pr-2 font-semibold text-slate-600 w-44">Hari, Tanggal Berpulang</td>
                    <td className="py-1.5 px-1 font-bold text-slate-900 w-3">:</td>
                    <td className="py-1.5 font-bold text-slate-900">
                      {item.tanggalMeninggal ? formatIndonesianDate(item.tanggalMeninggal) : '-'}
                    </td>
                  </tr>
                  <tr className="border-b border-slate-200">
                    <td className="py-1.5 pr-2 font-semibold text-slate-600">Tempat Meninggal / Rumah Duka</td>
                    <td className="py-1.5 px-1 font-bold text-slate-900">:</td>
                    <td className="py-1.5 text-slate-800">{item.tempatMeninggal || item.alamat || 'Rumah Duka'}</td>
                  </tr>
                  <tr className="border-b border-slate-200">
                    <td className="py-1.5 pr-2 font-semibold text-slate-600">Tempat Pemakaman / TPU</td>
                    <td className="py-1.5 px-1 font-bold text-slate-900">:</td>
                    <td className="py-1.5 font-semibold text-slate-800">{item.tempatPemakaman || 'TPU Kristen'}</td>
                  </tr>
                  <tr className="border-b border-slate-200">
                    <td className="py-1.5 pr-2 font-semibold text-slate-600">Pelayan Ibadah Pemakaman</td>
                    <td className="py-1.5 px-1 font-bold text-slate-900">:</td>
                    <td className="py-1.5 text-slate-800">{item.pelayanPemakaman || 'Pendeta / Majelis Jemaat GKE'}</td>
                  </tr>
                  <tr>
                    <td className="py-1.5 pr-2 font-semibold text-slate-600">Keluarga yang Ditinggalkan</td>
                    <td className="py-1.5 px-1 font-bold text-slate-900">:</td>
                    <td className="py-1.5 text-slate-800">{item.keluargaDitinggalkan || `Keluarga Besar (KJJ: ${item.noKjj})`}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Confirmation & Closing */}
            <p className="text-xs sm:text-sm font-serif text-justify mb-6 leading-relaxed">
              Bahwa benar yang bersangkutan semasa hidupnya adalah anggota warga jemaat Gereja Kalimantan Evangelis (GKE) <strong>{settings.namaJemaat || '........................'}</strong> dan telah dilayankan ibadah pelepasan serta pemakaman secara kristiani menurut Tata Ibadah Gereja Kalimantan Evangelis (GKE). Surat keterangan ini dibuat dengan sesungguhnya untuk dapat dipergunakan sebagaimana mestinya oleh keluarga / ahli waris yang bersangkutan.
            </p>

            {/* Signature Block */}
            <div className="mt-8 text-xs font-sans">
              <div className="flex justify-end mb-4">
                <p className="text-slate-800">
                  Dikeluarkan di: <strong>{tempatSurat}</strong><br />
                  Pada tanggal: <strong>{tanggalSurat}</strong>
                </p>
              </div>

              <div className="text-center font-bold uppercase text-slate-900 mb-2 tracking-wide text-[11px] leading-relaxed">
                <div>MAJELIS PEKERJA HARIAN</div>
                <div>JEMAAT GKE {settings.namaJemaat?.toUpperCase() || 'JEMAAT GKE GUCI'}</div>
              </div>

              <SignatureBlock signers={['ketua', 'sekretaris']} hideDate={true} />
            </div>
          </div>
        );
      }

      case 'surat_duka_cita': {
        const item =
          (localWargaId ? wargaJemaatList.find((w) => w.id === localWargaId) : null) ||
          (printConfig.wargaId ? wargaJemaatList.find((w) => w.id === printConfig.wargaId) : null) ||
          wargaJemaatList.find((w) => w.statusKeanggotaan === 'Meninggal') ||
          wargaJemaatList[0];

        if (!item) {
          return (
            <div className="max-w-xl mx-auto p-8 my-8 text-center bg-white rounded-xl border border-slate-200 shadow-sm font-sans">
              <AlertCircle className="w-12 h-12 text-slate-400 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-900 mb-1">Data Warga Belum Tersedia</h3>
              <p className="text-xs text-slate-600">
                Silakan pilih warga jemaat yang akan dicetak surat duka cita atau belasungkawanya.
              </p>
            </div>
          );
        }

        // Calculate age
        const birthDate = item.tanggalLahir ? new Date(item.tanggalLahir) : null;
        const deathDate = item.tanggalMeninggal ? new Date(item.tanggalMeninggal) : new Date();
        let calculatedAge = 0;
        if (birthDate && !isNaN(birthDate.getTime())) {
          calculatedAge = deathDate.getFullYear() - birthDate.getFullYear();
          const m = deathDate.getMonth() - birthDate.getMonth();
          if (m < 0 || (m === 0 && deathDate.getDate() < birthDate.getDate())) {
            calculatedAge--;
          }
        }

        const nomorSurat = item.nomorSuratKematian
          ? item.nomorSuratKematian.replace('/SKK/', '/SDK/')
          : `.../MPH-GKE/${(settings.namaJemaat || 'JMT').toUpperCase().replace(/\\s+/g, '-')}/SDK/${new Date().getFullYear()}`;
        const tempatSurat = settings.tempatDiterbitkan || settings.namaJemaat || 'Palangka Raya';
        const tanggalSurat = item.tanggalMeninggal ? formatIndonesianDate(item.tanggalMeninggal) : formatIndonesianDate(new Date().toISOString().split('T')[0]);
        const keluargaTujuan = item.keluargaDitinggalkan || `Keluarga Besar Alm./Almh. ${item.namaLengkap}`;

        return (
          <div className="font-serif text-slate-900 leading-relaxed px-4 py-2 sm:px-6">
            <KopSurat
              title=""
              subtitle=""
              hideTitle={true}
            />

            {/* Document Title Header */}
            <div className="text-center my-4">
              <h2 className="text-base sm:text-lg font-bold uppercase tracking-wider underline text-slate-950 font-serif">
                SURAT PERNYATAAN DUKA CITA &amp; PENGUATAN IMAN
              </h2>
              <p className="text-xs font-sans tracking-wide text-purple-950 mt-0.5 font-bold uppercase">
                (PIAGAM BELASUNGKAWA MAJELIS JEMAAT GKE)
              </p>
              <p className="text-xs font-mono font-semibold text-slate-800 mt-1">
                Nomor: {nomorSurat}
              </p>
            </div>

            {/* Target Family Header */}
            <div className="my-3 text-xs sm:text-sm font-serif">
              <p className="text-slate-700">Kepada Yang Terkasih:</p>
              <p className="font-bold text-slate-950 text-sm sm:text-base mt-0.5">
                {keluargaTujuan}
              </p>
              <p className="text-xs text-slate-600 italic">di Tempat / Rumah Duka</p>
            </div>

            {/* Scripture Verse Quote */}
            <div className="border-2 border-purple-900/30 bg-purple-50/60 p-4 rounded-xl my-3.5 text-center text-xs sm:text-sm font-serif italic text-slate-900 leading-relaxed shadow-xs">
              &ldquo;Aku telah mengakhiri pertandingan yang baik, aku telah mencapai garis akhir dan aku telah memelihara iman. Sekarang telah tersedia bagiku mahkota kebenaran yang akan dikaruniakan kepadaku oleh Tuhan, Hakim yang adil, pada hari-Nya; tetapi bukan hanya kepadaku, melainkan juga kepada semua orang yang merindukan kedatangan-Nya.&rdquo;
              <span className="block not-italic font-bold font-sans text-xs text-purple-900 mt-1.5">
                (2 Timotius 4:7-8)
              </span>
            </div>

            {/* Greeting & Condolence Statement */}
            <p className="text-xs sm:text-sm font-serif text-justify mb-2 leading-relaxed">
              <em>Salam sejahtera dalam kasih Yesus Kristus, Sang Penebus dan Kebangkitan Hidup.</em>
            </p>
            <p className="text-xs sm:text-sm font-serif text-justify mb-3 leading-relaxed">
              Majelis Pekerja Harian (MPH) beserta seluruh jajaran Majelis Jemaat dan segenap Warga Gereja Kalimantan Evangelis (GKE) <strong>{settings.namaJemaat || '........................'}</strong>, Resort GKE <strong>{settings.resortGke || '........................'}</strong>, dengan hati yang penuh belasungkawa menyatakan rasa duka cita yang mendalam atas berpulangnya ke pangkuan Bapa di Sorga saudara kekasih kita seiman:
            </p>

            {/* Deceased Profile Box */}
            <div className="bg-white border border-slate-300 rounded-xl p-4 mb-4 text-xs font-sans shadow-xs">
              <div className="text-center pb-2.5 mb-2.5 border-b border-slate-200">
                <span className="text-[11px] uppercase font-bold text-purple-900 tracking-wider">
                  Mengenang Saudara Seiman Kita:
                </span>
                <h3 className="text-base sm:text-lg font-bold text-slate-950 uppercase mt-0.5">
                  {item.namaLengkap} <span className="text-xs font-semibold text-slate-600">({item.jenisKelamin === 'P' ? 'Almarhumah' : 'Almarhum'})</span>
                </h3>
                <p className="text-xs text-slate-600 mt-0.5">
                  No. KJJ: <span className="font-mono font-bold text-slate-800">{item.noKjj || '-'}</span> • Lingkungan: <span className="font-semibold text-slate-800">{item.rayon || '-'}</span>
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-xs">
                <div>
                  <span className="text-slate-500 font-semibold block text-[11px]">Tempat, Tanggal Lahir:</span>
                  <span className="font-medium text-slate-900">
                    {item.tempatLahir || '-'}, {item.tanggalLahir ? formatIndonesianDate(item.tanggalLahir) : '-'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 font-semibold block text-[11px]">Hari, Tanggal Berpulang:</span>
                  <span className="font-bold text-purple-950">
                    {item.tanggalMeninggal ? formatIndonesianDate(item.tanggalMeninggal) : '-'} ({calculatedAge > 0 ? `${calculatedAge} Tahun` : '-'})
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 font-semibold block text-[11px]">Tempat Meninggal / Rumah Duka:</span>
                  <span className="text-slate-900">{item.tempatMeninggal || item.alamat || 'Rumah Duka'}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-semibold block text-[11px]">Tempat Peristirahatan Terakhir (TPU):</span>
                  <span className="text-slate-900 font-semibold">{item.tempatPemakaman || 'TPU Kristen'}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-semibold block text-[11px]">Pelayan Ibadah Pelepasan:</span>
                  <span className="text-slate-900">{item.pelayanPemakaman || 'Pendeta / Majelis Jemaat GKE'}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-semibold block text-[11px]">Status Sakramen Semasa Hidup:</span>
                  <span className="text-slate-900 font-medium">
                    Baptis: {item.statusBaptis ? 'Sudah' : 'Belum'} • Sidi: {item.statusSidi ? 'Sudah' : 'Belum'}
                  </span>
                </div>
              </div>
            </div>

            {/* Pastoral Consolation Message */}
            <p className="text-xs sm:text-sm font-serif text-justify mb-3 leading-relaxed">
              Kami percaya bahwa bagi orang beriman, kematian bukanlah akhir dari kehidupan melainkan awal dari persekutuan kekal bersama Allah Bapa di Sorga. Segala jerih lelah, dedikasi kasih, serta teladan iman yang telah ditaburkan oleh Almarhum/Almarhumah semasa hidupnya di tengah keluarga maupun dalam persekutuan gerejawi jemaat senantiasa kita kenang dengan penuh rasa syukur.
            </p>
            <p className="text-xs sm:text-sm font-serif text-justify mb-6 leading-relaxed">
              Doa kami senantiasa menyertai seluruh keluarga yang ditinggalkan. Kiranya Tuhan Yesus Kristus, Sumber segala penghiburan dan kekuatan, melalui kuasa Roh Kudus senantiasa membalut luka hati, mencurahkan damai sejahtera, serta memelihara ketabahan iman Bapak/Ibu/Saudara sekalian dalam pengharapan akan keselamatan kekal.
            </p>

            {/* Signature Block */}
            <div className="mt-6 text-xs font-sans">
              <div className="flex justify-end mb-4">
                <p className="text-slate-800">
                  Dikeluarkan di: <strong>{tempatSurat}</strong><br />
                  Pada tanggal: <strong>{tanggalSurat}</strong>
                </p>
              </div>

              <div className="text-center font-bold uppercase text-slate-900 mb-2 tracking-wide text-[11px] leading-relaxed">
                <div>MAJELIS PEKERJA HARIAN</div>
                <div>JEMAAT GKE {settings.namaJemaat?.toUpperCase() || 'JEMAAT GKE GUCI'}</div>
              </div>

              <SignatureBlock signers={['ketua', 'sekretaris']} hideDate={true} />
            </div>
          </div>
        );
      }

      case 'warga_meninggal_rekap': {
        const deceasedList = wargaJemaatList.filter(
          (w) => w.statusKeanggotaan === 'Meninggal' || !!w.tanggalMeninggal
        );

        const filterRayon = printConfig.selectedRayon;
        const finalDeceasedList = filterRayon
          ? deceasedList.filter((w) => w.rayon === filterRayon)
          : deceasedList;

        const totalL = finalDeceasedList.filter((w) => w.jenisKelamin === 'L').length;
        const totalP = finalDeceasedList.filter((w) => w.jenisKelamin === 'P').length;

        return (
          <div className="font-sans text-xs text-slate-900 leading-normal">
            <KopSurat
              title="BUKU REGISTRASI & REKAPITULASI WARGA JEMAAT BERPULANG"
              subtitle={`Gereja Kalimantan Evangelis (GKE) ${settings.namaJemaat || ''} • Resort GKE ${settings.resortGke || ''} ${filterRayon ? `• Rayon: ${filterRayon}` : ''}`}
            />

            {/* Summary Highlights */}
            <div className="grid grid-cols-3 gap-3 my-4 p-3 bg-slate-50 border border-slate-300 rounded text-center">
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-bold block">Total Warga Berpulang</span>
                <p className="text-base font-bold text-slate-900 mt-0.5">{finalDeceasedList.length} Jiwa</p>
              </div>
              <div className="border-x border-slate-200">
                <span className="text-[10px] text-slate-500 uppercase font-bold block">Laki-Laki</span>
                <p className="text-base font-bold text-blue-900 mt-0.5">{totalL} Jiwa</p>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-bold block">Perempuan</span>
                <p className="text-base font-bold text-rose-900 mt-0.5">{totalP} Jiwa</p>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto w-full my-3">
              <table className="w-full border-collapse border border-slate-400 text-[10px]">
                <thead>
                  <tr className="bg-slate-100 font-bold border-b border-slate-400 text-slate-900 uppercase">
                    <th className="p-1.5 border border-slate-300 text-center w-8">No</th>
                    <th className="p-1.5 border border-slate-300 text-left">Nama Lengkap (Alm/Almh)</th>
                    <th className="p-1.5 border border-slate-300 text-center w-8">L/P</th>
                    <th className="p-1.5 border border-slate-300 text-center">Tgl Lahir</th>
                    <th className="p-1.5 border border-slate-300 text-center">Tgl Wafat</th>
                    <th className="p-1.5 border border-slate-300 text-center w-12">Usia</th>
                    <th className="p-1.5 border border-slate-300 text-left">Lingkungan</th>
                    <th className="p-1.5 border border-slate-300 text-left">Tempat Pemakaman</th>
                    <th className="p-1.5 border border-slate-300 text-left">Keluarga Ditinggalkan</th>
                    <th className="p-1.5 border border-slate-300 text-center">No. Surat Kematian</th>
                  </tr>
                </thead>
                <tbody>
                  {finalDeceasedList.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="p-6 text-center text-slate-500 italic">
                        Belum ada data warga jemaat berpulang (meninggal dunia) yang tercatat.
                      </td>
                    </tr>
                  ) : (
                    finalDeceasedList.map((item, idx) => {
                      const birthDate = item.tanggalLahir ? new Date(item.tanggalLahir) : null;
                      const deathDate = item.tanggalMeninggal ? new Date(item.tanggalMeninggal) : new Date();
                      let age = 0;
                      if (birthDate && !isNaN(birthDate.getTime())) {
                        age = deathDate.getFullYear() - birthDate.getFullYear();
                        const m = deathDate.getMonth() - birthDate.getMonth();
                        if (m < 0 || (m === 0 && deathDate.getDate() < birthDate.getDate())) {
                          age--;
                        }
                      }

                      return (
                        <tr key={item.id} className="border-b border-slate-300 hover:bg-slate-50">
                          <td className="p-1.5 border border-slate-300 text-center font-mono">{idx + 1}</td>
                          <td className="p-1.5 border border-slate-300 font-bold text-slate-900">
                            {item.namaLengkap}
                          </td>
                          <td className="p-1.5 border border-slate-300 text-center">{item.jenisKelamin}</td>
                          <td className="p-1.5 border border-slate-300 text-center">{item.tanggalLahir || '-'}</td>
                          <td className="p-1.5 border border-slate-300 text-center font-bold text-rose-900">
                            {item.tanggalMeninggal || '-'}
                          </td>
                          <td className="p-1.5 border border-slate-300 text-center font-bold">
                            {age > 0 ? `${age} Thn` : '-'}
                          </td>
                          <td className="p-1.5 border border-slate-300">{item.rayon || '-'}</td>
                          <td className="p-1.5 border border-slate-300">{item.tempatPemakaman || '-'}</td>
                          <td className="p-1.5 border border-slate-300">{item.keluargaDitinggalkan || `Kel. (KJJ: ${item.noKjj})`}</td>
                          <td className="p-1.5 border border-slate-300 text-center font-mono text-[9px]">
                            {item.nomorSuratKematian || '-'}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div className="mt-6 text-xs text-slate-500 italic">
              * Dokumen ini merupakan buku induk registrasi kematian warga jemaat resmi Gereja Kalimantan Evangelis (GKE).
            </div>

            <SignatureBlock signers={['ketua', 'sekretaris']} />
          </div>
        );
      }

      case 'buku_panduan':
      case 'tutorial_aplikasi': {
        return <BukuPanduanReport />;
      }

      default:
        return <div>Laporan tidak dikenal.</div>;
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4 overflow-hidden print-modal-backdrop print:static print:inset-auto print:bg-white print:p-0 print:m-0 print:overflow-visible print:block print:w-full print:h-auto animate-in fade-in duration-150">
      <div className={`bg-white rounded-2xl shadow-2xl border border-slate-200 w-full ${paperOrientation === 'landscape' ? 'max-w-6xl 2xl:max-w-7xl' : 'max-w-4xl'} my-auto overflow-hidden flex flex-col max-h-[94dvh] sm:max-h-[90vh] print-modal-card print:static print:max-h-none print:h-auto print:w-full print:max-w-none print:my-0 print:p-0 print:border-none print:shadow-none print:overflow-visible print:block transition-all duration-200`}>
        {/* Header toolbar */}
        <div className="bg-slate-900 text-white p-3.5 sm:p-4 flex flex-col gap-3 print:hidden border-b border-slate-800 shrink-0">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-400 shrink-0" />
              <div>
                <h3 className="font-bold text-sm sm:text-base leading-tight">Pratinjau Laporan Cetak Resmi GKE</h3>
                <p className="text-[11px] text-emerald-400 flex items-center gap-1 mt-0.5">
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>Cetak Langsung / Simpan Dokumen Word & HTML di Smartphone/PC</span>
                </p>
              </div>
            </div>
            <button
              onClick={closePrintReport}
              className="flex items-center gap-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 hover:text-white px-3 py-1.5 rounded-lg border border-rose-500/30 font-bold text-xs transition cursor-pointer shrink-0 ml-auto"
              title="Keluar / Tutup Pratinjau (Esc)"
            >
              <span>Keluar</span>
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-800/80">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-all shadow-sm cursor-pointer"
              title="Cetak via printer atau Simpan ke PDF sistem HP/Laptop"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak / Print Dokumen</span>
            </button>
            <button
              onClick={handleExportDoc}
              disabled={isExporting}
              className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-all shadow-sm cursor-pointer"
              title="Simpan Dokumen Word (.doc) untuk Microsoft Word / WPS Office HP"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Simpan Word (.doc)</span>
            </button>
            <button
              onClick={handleExportHTML}
              disabled={isExporting}
              className="flex items-center gap-1.5 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-all shadow-sm cursor-pointer"
              title="Simpan Dokumen Halaman Web HTML"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Simpan HTML</span>
            </button>
            <button
              type="button"
              onClick={() => setPaperOrientation((prev) => (prev === 'landscape' ? 'portrait' : 'landscape'))}
              className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg border transition-all shadow-sm cursor-pointer ${
                paperOrientation === 'landscape'
                  ? 'bg-amber-500/20 text-amber-300 border-amber-400/50 hover:bg-amber-500/30'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
              }`}
              title="Ganti orientasi posisi kertas cetak (Landscape / Portrait)"
            >
              <LayoutTemplate className="w-3.5 h-3.5" />
              <span>Posisi Kertas: {paperOrientation === 'landscape' ? 'Landscape (Mendatar)' : 'Portrait (Tegak)'}</span>
            </button>
          </div>

          {/* Filter Controls for Financial Reports */}
          {isFinancialReport && (
            <div className="bg-slate-100 dark:bg-slate-950/90 p-2.5 rounded-xl border border-slate-300 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs shadow-xs">
              <div className="flex items-center gap-1.5 text-indigo-700 dark:text-indigo-400 font-bold">
                <Calendar className="w-4 h-4 text-indigo-700 dark:text-indigo-400 shrink-0" />
                <span className="text-slate-900 dark:text-slate-200">Atur Periode Cetak:</span>
              </div>

              {printConfig.reportType === 'keuangan_tahunan' ||
              printConfig.reportType === 'keuangan_tahanan' ? (
                <div className="flex items-center gap-2">
                  <label className="text-slate-800 dark:text-slate-300 font-semibold">Pilih Periode Tahun Kas:</label>
                  <select
                    value={localTahun}
                    onChange={(e) => setLocalTahun(e.target.value)}
                    className="p-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-bold focus:outline-none focus:border-indigo-500 cursor-pointer shadow-xs"
                  >
                    {availableYears.map((yr) => (
                      <option key={yr} value={yr} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                        Tahun {yr}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="flex flex-wrap items-center gap-2.5">
                  <div className="flex items-center gap-1.5">
                    <label className="text-slate-800 dark:text-slate-300 font-medium">Periode Awal:</label>
                    <input
                      type="date"
                      value={localStartDate}
                      onChange={(e) => setLocalStartDate(e.target.value)}
                      className="p-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-medium focus:outline-none focus:border-indigo-500 shadow-xs"
                    />
                  </div>
                  <span className="text-slate-600 dark:text-slate-400 font-bold">s/d</span>
                  <div className="flex items-center gap-1.5">
                    <label className="text-slate-800 dark:text-slate-300 font-medium">Periode Akhir:</label>
                    <input
                      type="date"
                      value={localEndDate}
                      onChange={(e) => setLocalEndDate(e.target.value)}
                      className="p-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-medium focus:outline-none focus:border-indigo-500 shadow-xs"
                    />
                  </div>
                </div>
              )}

              {/* Input Custom Saldo Awal Direct Control (Khusus MPH/Admin, disembunyikan untuk Warga) */}
              {viewMode !== 'public' && currentUser?.role !== 'warga' && (
                <div className="flex items-center gap-1.5 bg-amber-50 dark:bg-slate-900/90 px-2.5 py-1 rounded-lg border border-amber-300 dark:border-amber-500/30">
                  <label className="text-amber-900 dark:text-amber-300 font-bold text-[11px] whitespace-nowrap">
                    Saldo Awal Custom (Rp):
                  </label>
                  <input
                    type="number"
                    value={localCustomSaldoAwal !== undefined ? localCustomSaldoAwal : ''}
                    onChange={(e) => setLocalCustomSaldoAwal(parseFloat(e.target.value) || 0)}
                    placeholder="0"
                    className="w-28 p-1 rounded bg-white dark:bg-slate-950 border border-amber-400 dark:border-amber-500/40 text-amber-900 dark:text-amber-300 font-mono font-bold text-xs text-right focus:outline-none focus:border-amber-500 shadow-xs"
                  />
                </div>
              )}
            </div>
          )}

          {/* Filter Controls for Seksi Kategorial Reports */}
          {printConfig.reportType === 'seksi_kategorial' && (
            <div className="bg-slate-100 dark:bg-slate-950/90 p-2.5 rounded-xl border border-slate-300 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs shadow-xs">
              <div className="flex items-center gap-1.5 text-indigo-700 dark:text-indigo-400 font-bold">
                <Users className="w-4 h-4 text-indigo-700 dark:text-indigo-400 shrink-0" />
                <span className="text-slate-900 dark:text-slate-200">Pilih Seksi Kategorial:</span>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                {[
                  { id: 'ALL', label: 'Semua Seksi' },
                  { id: 'SPB', label: 'SPB (Bapak)' },
                  { id: 'SPPer', label: 'SPPer (Perempuan)' },
                  { id: 'SPPR/P', label: 'SPPR/P (Pemuda/Remaja)' },
                  { id: 'ASHM', label: 'ASHM / SPA (Sekolah Minggu)' },
                ].map((s) => {
                  const isSelected =
                    localSelectedSeksi === s.id ||
                    (s.id === 'ASHM' && localSelectedSeksi === 'SPA') ||
                    (s.id === 'SPA' && localSelectedSeksi === 'ASHM');
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setLocalSelectedSeksi(s.id)}
                      className={`px-2.5 py-1.5 rounded-lg font-bold text-xs transition cursor-pointer ${
                        isSelected
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-700'
                      }`}
                    >
                      {s.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Filter & Custom Period Control for MPH Report */}
          {printConfig.reportType === 'mph_jemaat' && (
            <div className="bg-indigo-50/70 dark:bg-slate-950/95 p-3 rounded-xl border border-indigo-300 dark:border-indigo-500/50 flex flex-col gap-2.5 text-xs shadow-md">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 min-w-0">
                <div className="flex items-center gap-2 text-indigo-800 dark:text-indigo-300 font-bold shrink-0">
                  <Calendar className="w-4 h-4 text-indigo-700 dark:text-indigo-400 shrink-0" />
                  <span className="text-slate-900 dark:text-white font-bold text-xs sm:text-sm">Set Periode Laporan Cetak MPH:</span>
                </div>

                <div className="flex items-center gap-1 overflow-x-auto max-w-full pb-0.5 sm:pb-0">
                  {['2024 - 2029', '2019 - 2024', '2025 - 2030'].map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setLocalPeriodeMPH(p)}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-bold border transition cursor-pointer shrink-0 whitespace-nowrap ${
                        localPeriodeMPH === p
                          ? 'bg-indigo-600 text-white border-indigo-500 shadow-xs'
                          : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <div className="w-full min-w-0">
                <input
                  type="text"
                  value={localPeriodeMPH}
                  onChange={(e) => setLocalPeriodeMPH(e.target.value)}
                  placeholder="e.g. 2024 - 2029 atau Periode Pelayanan 2024 - 2029"
                  className="w-full max-w-full truncate px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-indigo-300 dark:border-indigo-500/60 text-slate-900 dark:text-indigo-100 font-semibold focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-400 text-xs shadow-xs block"
                />
              </div>
            </div>
          )}

          {/* Filter Controls for Panitia & Proyek Pembangunan */}
          {printConfig.reportType === 'panitia_pembangunan' && (
            <div className="bg-amber-50/70 dark:bg-slate-950/90 p-2.5 rounded-xl border border-amber-300 dark:border-amber-500/40 flex flex-wrap items-center justify-between gap-3 text-xs shadow-xs">
              <div className="flex items-center gap-1.5 text-amber-800 dark:text-amber-400 font-bold">
                <Building2 className="w-4 h-4 text-amber-700 dark:text-amber-400 shrink-0" />
                <span className="text-slate-900 dark:text-slate-200">Bagian Dokumen Pembangunan:</span>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                {[
                  { id: 'all', label: 'Laporan Lengkap (Semua Bagian)' },
                  { id: 'panitia', label: 'Susunan Panitia' },
                  { id: 'proyek', label: 'Agenda & Progres Proyek' },
                  { id: 'kas', label: 'Kas & Donasi Janji Iman' },
                ].map((sec) => (
                  <button
                    key={sec.id}
                    type="button"
                    onClick={() => setLocalPembangunanSection(sec.id as any)}
                    className={`px-3 py-1.5 rounded-lg font-bold text-xs transition cursor-pointer ${
                      localPembangunanSection === sec.id
                        ? 'bg-amber-600 text-white shadow-sm font-black'
                        : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-amber-100/60 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-700'
                    }`}
                  >
                    {sec.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Filter & Session Selector Controls for Pemilihan & E-Voting */}
          {(printConfig.reportType === 'pemilihan' ||
            printConfig.reportType === 'pemilihan_rekap' ||
            printConfig.reportType === 'pemilihan_hasil' ||
            printConfig.reportType === 'pemilihan_berita_acara') && (
            <div className="bg-purple-50/70 dark:bg-slate-950/95 p-3 rounded-xl border border-purple-300 dark:border-purple-500/50 flex flex-col gap-2.5 text-xs shadow-md">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 min-w-0">
                <div className="flex items-center gap-2 text-purple-800 dark:text-purple-300 font-bold shrink-0">
                  <Vote className="w-4 h-4 text-purple-700 dark:text-purple-400 shrink-0" />
                  <span className="text-slate-900 dark:text-white font-bold text-xs sm:text-sm">Pilih Sesi Pemilihan / E-Voting:</span>
                </div>

                {sesiPemilihanList.length > 1 && (
                  <div className="flex items-center gap-1 overflow-x-auto max-w-full pb-0.5 sm:pb-0">
                    {sesiPemilihanList.map((s) => {
                      const isSelected = (localSesiId || (sesiPemilihanList.length > 0 ? sesiPemilihanList[0].id : '')) === s.id;
                      return (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => setLocalSesiId(s.id)}
                          className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition cursor-pointer shrink-0 whitespace-nowrap ${
                            isSelected
                              ? 'bg-purple-600 text-white shadow-xs'
                              : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:text-purple-900 dark:hover:text-slate-100 hover:bg-purple-100/50 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-800'
                          }`}
                          title={`${s.judulPemilihan} (${s.periode})`}
                        >
                          {s.periode} ({s.status})
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="w-full min-w-0">
                <select
                  id="select-sesi-pemilihan-modal"
                  value={localSesiId || (sesiPemilihanList.length > 0 ? sesiPemilihanList[0].id : '')}
                  onChange={(e) => setLocalSesiId(e.target.value)}
                  className="w-full max-w-full truncate px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-purple-400 dark:border-purple-500/60 text-slate-900 dark:text-purple-200 font-bold focus:outline-none focus:border-purple-600 dark:focus:border-purple-400 text-xs cursor-pointer shadow-xs block"
                >
                  {sesiPemilihanList.map((s) => (
                    <option key={s.id} value={s.id} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
                      {s.judulPemilihan} ({s.status}) - Periode {s.periode}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Filter & Edition Selector Controls for Berita & Warta Jemaat */}
          {printConfig.reportType === 'berita_jemaat' && (
            <div className="bg-cyan-50/70 dark:bg-slate-950/95 p-3 rounded-xl border border-cyan-300 dark:border-cyan-500/50 flex flex-col gap-2.5 text-xs shadow-md">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 min-w-0">
                <div className="flex items-center gap-2 text-cyan-800 dark:text-cyan-300 font-bold shrink-0">
                  <Newspaper className="w-4 h-4 text-cyan-700 dark:text-cyan-400 shrink-0" />
                  <span className="text-slate-900 dark:text-white font-bold text-xs sm:text-sm">Pilih Edisi Warta yang Ingin Dicetak:</span>
                </div>

                <div className="flex items-center gap-1 overflow-x-auto max-w-full pb-0.5 sm:pb-0">
                  {beritaJemaatList.slice(0, 5).map((w, idx) => {
                    const isSelected = (localBeritaJemaatId || printConfig.beritaJemaatId) === w.id || (!localBeritaJemaatId && idx === 0);
                    return (
                      <button
                        key={w.id || idx}
                        type="button"
                        onClick={() => setLocalBeritaJemaatId(w.id)}
                        className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition cursor-pointer shrink-0 whitespace-nowrap ${
                          isSelected
                            ? 'bg-cyan-600 text-white shadow-xs'
                            : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:text-cyan-900 dark:hover:text-slate-100 hover:bg-cyan-100/50 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-800'
                        }`}
                        title={`${w.nomorEdisi} (${w.tanggalTerbit})`}
                      >
                        {w.nomorEdisi}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="w-full min-w-0">
                <select
                  id="select-warta-jemaat-modal"
                  value={localBeritaJemaatId || (beritaJemaatList && beritaJemaatList.length > 0 ? beritaJemaatList[0].id : '')}
                  onChange={(e) => setLocalBeritaJemaatId(e.target.value)}
                  className="w-full max-w-full truncate px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-cyan-400 dark:border-cyan-500/60 text-slate-900 dark:text-cyan-200 font-bold focus:outline-none focus:border-cyan-600 dark:focus:border-cyan-400 text-xs cursor-pointer shadow-xs block"
                >
                  {beritaJemaatList.map((w, idx) => (
                    <option key={w.id || idx} value={w.id} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
                      {w.nomorEdisi} • {w.tanggalTerbit} • {w.judulWarta} ({w.status || 'Diterbitkan'})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Selector for Pelayanan Sakramen / Surat Pelimpahan */}
          {['pelayanan_baptis', 'pelayanan_sidi', 'pelayanan_nikah', 'surat_pelimpahan_nikah'].includes(printConfig.reportType) &&
            pelayananSakramenList.length > 0 && (
              <div className="bg-amber-50/70 dark:bg-slate-950/95 p-3 rounded-xl border border-amber-300 dark:border-amber-500/50 flex flex-col gap-2 text-xs shadow-md">
                <div className="flex items-center justify-between gap-2 min-w-0">
                  <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-bold shrink-0">
                    <FileText className="w-4 h-4 text-amber-700 dark:text-amber-400 shrink-0" />
                    <span className="text-slate-900 dark:text-white font-bold text-xs sm:text-sm">Pilih Data yang Dicetak:</span>
                  </div>
                </div>
                <div className="w-full min-w-0">
                  <select
                    id="select-sakramen-modal"
                    value={(() => {
                      const targetJenis =
                        printConfig.reportType === 'pelayanan_baptis'
                          ? 'baptis'
                          : printConfig.reportType === 'pelayanan_sidi'
                          ? 'sidi'
                          : 'nikah';
                      const filtered = pelayananSakramenList.filter((s) => s.jenisPelayanan === targetJenis);
                      if (localSakramenId && filtered.some((s) => s.id === localSakramenId)) {
                        return localSakramenId;
                      }
                      return filtered[0]?.id || localSakramenId || (pelayananSakramenList.length > 0 ? pelayananSakramenList[0].id : '');
                    })()}
                    onChange={(e) => setLocalSakramenId(e.target.value)}
                    className="w-full max-w-full truncate px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-amber-400 dark:border-amber-500/60 text-slate-900 dark:text-amber-200 font-bold focus:outline-none focus:border-amber-600 dark:focus:border-amber-400 text-xs cursor-pointer shadow-xs block"
                  >
                    {pelayananSakramenList
                      .filter((s) => {
                        if (printConfig.reportType === 'pelayanan_baptis') return s.jenisPelayanan === 'baptis';
                        if (printConfig.reportType === 'pelayanan_sidi') return s.jenisPelayanan === 'sidi';
                        if (printConfig.reportType === 'pelayanan_nikah' || printConfig.reportType === 'surat_pelimpahan_nikah') return s.jenisPelayanan === 'nikah';
                        return true;
                      })
                      .map((s) => (
                        <option key={s.id} value={s.id} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
                          {s.noSuratResmi ? `[${s.noSuratResmi}] ` : ''}{s.namaUtama} {s.namaPasangan ? `& ${s.namaPasangan}` : ''} ({s.tanggalPelayanan || s.tanggalDikeluarkan || '-'})
                        </option>
                      ))}
                  </select>
                </div>
              </div>
            )}

          {/* Selector for Surat Keterangan Kematian & Surat Duka Cita */}
          {['surat_keterangan_kematian', 'surat_duka_cita'].includes(activeReportType) && (
            <div className="bg-purple-50/70 dark:bg-slate-950/95 p-3 rounded-xl border border-purple-300 dark:border-purple-500/50 flex flex-col gap-2.5 text-xs shadow-md">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 min-w-0">
                <div className="flex items-center gap-2 text-purple-800 dark:text-purple-300 font-bold shrink-0">
                  <HeartCrack className="w-4 h-4 text-purple-700 dark:text-purple-400 shrink-0" />
                  <span className="text-slate-900 dark:text-white font-bold text-xs sm:text-sm">Pilih Warga Jemaat Berpulang (Alm/Almh):</span>
                </div>

                {/* Switcher between Surat Keterangan Kematian & Surat Duka Cita */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => setLocalReportType('surat_keterangan_kematian')}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition cursor-pointer ${
                      activeReportType === 'surat_keterangan_kematian'
                        ? 'bg-amber-600 text-white shadow-xs'
                        : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-200 border border-slate-300 dark:border-slate-800'
                    }`}
                  >
                    Surat Keterangan Kematian (Akta)
                  </button>
                  <button
                    type="button"
                    onClick={() => setLocalReportType('surat_duka_cita')}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition cursor-pointer ${
                      activeReportType === 'surat_duka_cita'
                        ? 'bg-purple-600 text-white shadow-xs'
                        : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-200 border border-slate-300 dark:border-slate-800'
                    }`}
                  >
                    Surat Duka Cita (Pastoral)
                  </button>
                </div>
              </div>
              <div className="w-full min-w-0">
                <select
                  id="select-warga-kematian-modal"
                  value={localWargaId || printConfig.wargaId || (wargaJemaatList.find((w) => w.statusKeanggotaan === 'Meninggal')?.id || wargaJemaatList[0]?.id || '')}
                  onChange={(e) => setLocalWargaId(e.target.value)}
                  className="w-full max-w-full truncate px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-purple-400 dark:border-purple-500/50 text-slate-900 dark:text-slate-100 font-bold focus:outline-none focus:border-purple-600 dark:focus:border-purple-400 text-xs cursor-pointer shadow-xs block"
                >
                  {wargaJemaatList
                    .filter((w) => w.statusKeanggotaan === 'Meninggal' || !!w.tanggalMeninggal)
                    .map((w) => (
                      <option key={w.id} value={w.id} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
                        {w.namaLengkap} (Alm/Almh) • Wafat: {w.tanggalMeninggal || '-'} • KJJ: {w.noKjj} ({w.rayon})
                      </option>
                    ))}
                  {wargaJemaatList.filter((w) => w.statusKeanggotaan === 'Meninggal' || !!w.tanggalMeninggal).length === 0 &&
                    wargaJemaatList.slice(0, 10).map((w) => (
                      <option key={w.id} value={w.id} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
                        {w.namaLengkap} • KJJ: {w.noKjj} ({w.rayon})
                      </option>
                    ))}
                </select>
              </div>
            </div>
          )}

          {/* Filter & Period Controls for Almanak Nast GKE */}
          {printConfig.reportType === 'almanak_nast_gke' && (
            <div className="bg-rose-50/70 dark:bg-slate-950/95 p-3 rounded-xl border border-rose-300 dark:border-rose-500/40 flex flex-wrap items-center justify-between gap-3 text-xs shadow-md">
              <div className="flex items-center gap-2 text-rose-800 dark:text-rose-400 font-bold">
                <Calendar className="w-4 h-4 text-rose-700 dark:text-rose-400 shrink-0" />
                <span className="text-slate-900 dark:text-white font-bold text-xs sm:text-sm">Filter Almanak Nast GKE:</span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1.5">
                  <label className="text-slate-700 dark:text-slate-300 text-[11px] font-semibold">Dari:</label>
                  <input
                    type="date"
                    value={localStartDate}
                    onChange={(e) => setLocalStartDate(e.target.value)}
                    className="p-1 rounded bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-medium text-xs focus:outline-none focus:border-rose-500 shadow-xs"
                  />
                </div>
                <div className="flex items-center gap-1.5">
                  <label className="text-slate-700 dark:text-slate-300 text-[11px] font-semibold">Sampai:</label>
                  <input
                    type="date"
                    value={localEndDate}
                    onChange={(e) => setLocalEndDate(e.target.value)}
                    className="p-1 rounded bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-medium text-xs focus:outline-none focus:border-rose-500 shadow-xs"
                  />
                </div>
                {(localStartDate || localEndDate) && (
                  <button
                    type="button"
                    onClick={() => {
                      setLocalStartDate('');
                      setLocalEndDate('');
                    }}
                    className="px-2 py-1 rounded bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-300 hover:bg-slate-300 dark:hover:text-white text-[10px] font-bold cursor-pointer"
                  >
                    Reset Filter
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Filter & Task Selector Controls for Task Board & Tugas Pelayanan */}
          {(printConfig.reportType === 'task_board' || printConfig.reportType === 'tugas_pelayanan') && (
            <div className="bg-emerald-50/70 dark:bg-slate-950/95 p-3 rounded-xl border border-emerald-300 dark:border-emerald-500/50 flex flex-col gap-2.5 text-xs shadow-md">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 min-w-0">
                <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold shrink-0">
                  <FileText className="w-4 h-4 text-emerald-700 dark:text-emerald-400 shrink-0" />
                  <span className="text-slate-900 dark:text-white font-bold text-xs sm:text-sm">Pilih Tampilan Dokumen Tugas Pelayanan:</span>
                </div>

                <div className="flex items-center gap-1 overflow-x-auto max-w-full pb-0.5 sm:pb-0">
                  <button
                    type="button"
                    onClick={() => setLocalTaskId('')}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition cursor-pointer shrink-0 whitespace-nowrap ${
                      !localTaskId
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-800'
                    }`}
                  >
                    Rekapitulasi Semua Tugas
                  </button>
                  {pelayananTaskList.slice(0, 4).map((t) => {
                    const isSelected = localTaskId === t.id;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setLocalTaskId(t.id)}
                        className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition cursor-pointer shrink-0 whitespace-nowrap ${
                          isSelected
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-800'
                        }`}
                        title={t.judul}
                      >
                        {t.judul.length > 20 ? t.judul.slice(0, 20) + '...' : t.judul}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Selector dropdown and quick filters */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div className="sm:col-span-3">
                  <select
                    id="select-task-modal"
                    value={localTaskId}
                    onChange={(e) => setLocalTaskId(e.target.value)}
                    className="w-full max-w-full truncate px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-emerald-400 dark:border-emerald-500/60 text-slate-900 dark:text-emerald-200 font-bold focus:outline-none focus:border-emerald-600 dark:focus:border-emerald-400 text-xs cursor-pointer shadow-xs block"
                  >
                    <option value="" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">-- [REKAPITULASI KESELURUHAN TASK BOARD] --</option>
                    {pelayananTaskList.map((t) => (
                      <option key={t.id} value={t.id} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
                        [LEMBAR DISPOSISI] {t.judul} — PIC: {t.penanggungJawab} ({t.status})
                      </option>
                    ))}
                  </select>
                </div>

                {!localTaskId && (
                  <>
                    <div>
                      <label className="text-[10px] text-slate-600 dark:text-slate-400 font-semibold block mb-0.5">Filter Kategori:</label>
                      <select
                        value={localTaskCategory}
                        onChange={(e) => setLocalTaskCategory(e.target.value)}
                        className="w-full px-2 py-1 rounded bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-200 text-xs focus:outline-none focus:border-emerald-500 shadow-xs"
                      >
                        <option value="ALL">Semua Kategori</option>
                        <option value="IBADAH">Ibadah & Liturgi</option>
                        <option value="DIAKONIA">Diakonia & Kasih</option>
                        <option value="PEMBANGUNAN">Pembangunan & Fisik</option>
                        <option value="KATEKISASI">Katekisasi & Ajaran</option>
                        <option value="SEKRETARIAT">Sekretariat & Dokumen</option>
                        <option value="KEUANGAN">Keuangan & Perbendaharaan</option>
                        <option value="SARPRAS">Sarana & Prasarana</option>
                        <option value="ACARA_KHUSUS">Acara & Hari Besar</option>
                        <option value="PELAYANAN_ANAK_REMAJA">Anak & Remaja</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] text-slate-600 dark:text-slate-400 font-semibold block mb-0.5">Filter Status:</label>
                      <select
                        value={localTaskStatus}
                        onChange={(e) => setLocalTaskStatus(e.target.value)}
                        className="w-full px-2 py-1 rounded bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-200 text-xs focus:outline-none focus:border-emerald-500 shadow-xs"
                      >
                        <option value="ALL">Semua Status</option>
                        <option value="TODO">Antrean (TODO)</option>
                        <option value="IN_PROGRESS">Sedang Dikerjakan</option>
                        <option value="REVIEW">Evaluasi / Review</option>
                        <option value="COMPLETED">Selesai</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] text-slate-600 dark:text-slate-400 font-semibold block mb-0.5">Filter Prioritas:</label>
                      <select
                        value={localTaskPriority}
                        onChange={(e) => setLocalTaskPriority(e.target.value)}
                        className="w-full px-2 py-1 rounded bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-200 text-xs focus:outline-none focus:border-emerald-500 shadow-xs"
                      >
                        <option value="ALL">Semua Prioritas</option>
                        <option value="MENDESAK">Mendesak / Urgent</option>
                        <option value="TINGGI">Tinggi</option>
                        <option value="SEDANG">Sedang</option>
                        <option value="RENDAH">Rendah</option>
                      </select>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Printable Paper View */}
        <div className="overflow-x-auto flex-1 bg-slate-100 dark:bg-slate-950/60 p-2 sm:p-5 print:bg-white print:p-0 print:m-0 print:overflow-visible">
          <div
            id="printable-report-content"
            data-report-container="true"
            data-orientation={paperOrientation}
            ref={reportRef}
            className={`p-4 sm:p-8 overflow-y-auto bg-white text-slate-900 font-serif print-paper-view print:p-0 print:m-0 print:overflow-visible print:max-h-none print:h-auto print:w-full print:block shadow-md mx-auto transition-all ${
              paperOrientation === 'landscape'
                ? 'print-paper-landscape min-w-[880px] md:min-w-[980px] lg:min-w-[1060px] max-w-full'
                : 'print-paper-portrait max-w-[850px] w-full'
            }`}
          >
            {renderReportContent()}
          </div>
        </div>
      </div>
    </div>
  );
};
