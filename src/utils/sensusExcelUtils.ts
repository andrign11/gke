import ExcelJS from 'exceljs';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { WargaJemaat } from '../types';

export interface ParsedSensusRow {
  rowNumber: number;
  noKjj: string;
  namaLengkap: string;
  nik: string;
  jenisKelamin: 'L' | 'P';
  tempatLahir: string;
  tanggalLahir: string; // YYYY-MM-DD
  rayon: string;
  hubunganKeluarga: 'Kepala Keluarga' | 'Istri' | 'Anak' | 'Orang Tua' | 'Mertua' | 'Famili Lain';
  statusKeanggotaan: 'Tetap' | 'Titipan' | 'Pindah';
  statusBaptis: boolean;
  statusSidi: boolean;
  statusNikah: 'Belum Menikah' | 'Menikah' | 'Janda' | 'Duda';
  pekerjaan: string;
  alamat: string;
  noHp: string;
  catatan?: string;
  isValid: boolean;
  validationIssues: string[];
  isExistingInDb?: boolean;
}

export interface SensusImportSummary {
  totalRows: number;
  validRows: number;
  invalidRows: number;
  totalKkCount: number;
  newKkCount: number;
  existingRecordsCount: number;
  maleCount: number;
  femaleCount: number;
  baptisCount: number;
  sidiCount: number;
}

/**
 * Accurately parses Excel serial date numbers without timezone or epoch drift
 */
export function parseExcelDateSerial(serial: number): { y: number; m: number; d: number } | null {
  if (XLSX && (XLSX as any).SSF && typeof (XLSX as any).SSF.parse_date_code === 'function') {
    try {
      const p = (XLSX as any).SSF.parse_date_code(serial);
      if (p && p.y && p.m && p.d) {
        return { y: p.y, m: p.m, d: p.d };
      }
    } catch {
      // fallback to pure math
    }
  }

  // Safe Excel 1900 date system math (UTC-based)
  // Day 60 in Excel is Feb 29, 1900 (the Lotus 1-2-3 leap year bug)
  let days = Math.floor(serial);
  if (days > 60) {
    days -= 1;
  }
  const epoch = Date.UTC(1899, 11, 31);
  const dateObj = new Date(epoch + days * 86400000);
  if (!isNaN(dateObj.getTime())) {
    return {
      y: dateObj.getUTCFullYear(),
      m: dateObj.getUTCMonth() + 1,
      d: dateObj.getUTCDate(),
    };
  }
  return null;
}

/**
 * Standardize various date inputs to ISO format (YYYY-MM-DD)
 * Perfectly handles Excel serial numbers, Indonesian date formats, and timezone variations
 */
export function normalizeDateToIso(input: any): string {
  if (!input && input !== 0) return '';

  // 1. Handle JavaScript Date object
  if (input instanceof Date && !isNaN(input.getTime())) {
    // Check UTC first to prevent negative timezone shifts from corrupting midnight-UTC dates
    const utcH = input.getUTCHours();
    if (utcH === 0 || utcH >= 23 || utcH <= 1) {
      const year = input.getUTCFullYear();
      const month = String(input.getUTCMonth() + 1).padStart(2, '0');
      const day = String(input.getUTCDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
    const year = input.getFullYear();
    const month = String(input.getMonth() + 1).padStart(2, '0');
    const day = String(input.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // 2. Handle Excel Serial Date number (e.g. 31182 = 1985-05-15)
  if (typeof input === 'number') {
    if (input > 1 && input < 100000) {
      const parsed = parseExcelDateSerial(input);
      if (parsed) {
        const year = parsed.y;
        const month = String(parsed.m).padStart(2, '0');
        const day = String(parsed.d).padStart(2, '0');
        return `${year}-${month}-${day}`;
      }
    }
  }

  const rawStr = String(input).trim();
  if (!rawStr) return '';

  // 3. Pure numeric string resembling Excel serial (e.g. "31182")
  if (/^\d{4,5}(\.\d+)?$/.test(rawStr)) {
    const num = parseFloat(rawStr);
    if (num > 1000 && num < 100000) {
      const parsed = parseExcelDateSerial(num);
      if (parsed) {
        const year = parsed.y;
        const month = String(parsed.m).padStart(2, '0');
        const day = String(parsed.d).padStart(2, '0');
        return `${year}-${month}-${day}`;
      }
    }
  }

  // 4. ISO format (YYYY-MM-DD) or ISO datetime string (e.g. "1985-05-15T00:00:00.000Z" or "1985-05-15 00:00")
  const isoMatch = rawStr.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (isoMatch) {
    const year = isoMatch[1];
    const month = isoMatch[2].padStart(2, '0');
    const day = isoMatch[3].padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // 5. Format DD/MM/YYYY or MM/DD/YYYY or DD-MM-YYYY or DD.MM.YYYY or DD MM YYYY
  const dmyMatch = rawStr.match(/^(\d{1,2})[\/\-\.\s](\d{1,2})[\/\-\.\s](\d{4})$/);
  if (dmyMatch) {
    const p1 = parseInt(dmyMatch[1], 10);
    const p2 = parseInt(dmyMatch[2], 10);
    const year = dmyMatch[3];
    let day = p1;
    let month = p2;
    // If first number is <= 12 and second number is > 12, it's definitely MM/DD/YYYY
    if (p1 <= 12 && p2 > 12) {
      month = p1;
      day = p2;
    } else {
      // Standard Indonesian DD/MM/YYYY
      day = p1;
      month = p2;
    }
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }

  // 6. Format YYYY/MM/DD or YYYY.MM.DD or YYYY-MM-DD
  const ymdMatch = rawStr.match(/^(\d{4})[\/\-\.\s](\d{1,2})[\/\-\.\s](\d{1,2})$/);
  if (ymdMatch) {
    const year = ymdMatch[1];
    const month = ymdMatch[2].padStart(2, '0');
    const day = ymdMatch[3].padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // 7. Format 2-digit year (DD/MM/YY or DD-MM-YY)
  const dmy2Match = rawStr.match(/^(\d{1,2})[\/\-\.\s](\d{1,2})[\/\-\.\s](\d{2})$/);
  if (dmy2Match) {
    const p1 = parseInt(dmy2Match[1], 10);
    const p2 = parseInt(dmy2Match[2], 10);
    const y2 = parseInt(dmy2Match[3], 10);
    const year = y2 >= 30 ? 1900 + y2 : 2000 + y2;
    let day = p1;
    let month = p2;
    if (p1 <= 12 && p2 > 12) {
      month = p1;
      day = p2;
    }
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }

  // 8. Format with Indonesian & English month names, e.g. "15 Mei 1985" or "10-Agustus-1990"
  const monthMap: Record<string, string> = {
    januari: '01', jan: '01', january: '01',
    februari: '02', feb: '02', february: '02',
    maret: '03', mar: '03', march: '03',
    april: '04', apr: '04',
    mei: '05', may: '05',
    juni: '06', jun: '06', june: '06',
    juli: '07', jul: '07', july: '07',
    agustus: '08', ags: '08', agu: '08', aug: '08', august: '08',
    september: '09', sep: '09', sept: '09',
    oktober: '10', okt: '10', oct: '10', october: '10',
    november: '11', nov: '11',
    desember: '12', des: '12', dec: '12', december: '12',
  };

  // Pattern: "15 Mei 1985" or "15-Mei-1985"
  const indoDateMatch = rawStr.match(/^(\d{1,2})[\s\-\/\.]([a-zA-Z]+)[\s\-\/\.](\d{4})$/);
  if (indoDateMatch) {
    const day = indoDateMatch[1].padStart(2, '0');
    const mStr = indoDateMatch[2].toLowerCase();
    const year = indoDateMatch[3];
    const month = monthMap[mStr] || '01';
    return `${year}-${month}-${day}`;
  }

  // Pattern: "Mei 15, 1985" or "May 15 1985"
  const engDateMatch = rawStr.match(/^([a-zA-Z]+)[\s\-\/\.](\d{1,2})[\,\s\-\/\.]+(\d{4})$/);
  if (engDateMatch) {
    const mStr = engDateMatch[1].toLowerCase();
    const day = engDateMatch[2].padStart(2, '0');
    const year = engDateMatch[3];
    const month = monthMap[mStr] || '01';
    return `${year}-${month}-${day}`;
  }

  // 9. If user only wrote year, e.g. "1985"
  if (/^\d{4}$/.test(rawStr)) {
    return `${rawStr}-01-01`;
  }

  // 10. Fallback standard Date parsing (check UTC first)
  const parsed = new Date(rawStr);
  if (!isNaN(parsed.getTime())) {
    const utcH = parsed.getUTCHours();
    if (utcH === 0 || utcH >= 23 || utcH <= 1) {
      const year = parsed.getUTCFullYear();
      const month = String(parsed.getUTCMonth() + 1).padStart(2, '0');
      const day = String(parsed.getUTCDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
    const year = parsed.getFullYear();
    const month = String(parsed.getMonth() + 1).padStart(2, '0');
    const day = String(parsed.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  return rawStr;
}

/**
 * Normalizes boolean values from various Indonesian & English conventions
 */
export function normalizeBoolean(val: any, defaultVal = false): boolean {
  if (val === true || val === 1 || val === '1') return true;
  if (val === false || val === 0 || val === '0') return false;
  if (!val) return defaultVal;

  const str = String(val).trim().toLowerCase();
  if (['ya', 'y', 'true', 'sudah', 'v', 'yes', 'baptis', 'sidi'].includes(str)) return true;
  if (['tidak', 't', 'false', 'belum', 'no', 'bukan', '-'].includes(str)) return false;
  return defaultVal;
}

/**
 * Normalizes gender to 'L' or 'P'
 */
export function normalizeGender(val: any): 'L' | 'P' {
  if (!val) return 'L';
  const str = String(val).trim().toUpperCase();
  if (str.startsWith('P') || str === 'WANITA' || str === 'PEREMPUAN' || str === 'F' || str === 'FEMALE') {
    return 'P';
  }
  return 'L';
}

/**
 * Normalizes family relationship string
 */
export function normalizeHubunganKeluarga(
  val: any
): 'Kepala Keluarga' | 'Istri' | 'Anak' | 'Orang Tua' | 'Mertua' | 'Famili Lain' {
  if (!val) return 'Kepala Keluarga';
  const str = String(val).trim().toLowerCase();

  if (str.includes('kepala') || str === 'kk' || str === 'suami' || str === 'ayah' || str === 'bapak') {
    return 'Kepala Keluarga';
  }
  if (str.includes('istri') || str.includes('ibu') || str === 'mama') {
    return 'Istri';
  }
  if (str.includes('anak') || str.includes('putra') || str.includes('putri')) {
    return 'Anak';
  }
  if (str.includes('mertua')) {
    return 'Mertua';
  }
  if (str.includes('orang tua') || str.includes('ayah') || str.includes('ibu') || str.includes('kakek') || str.includes('nenek')) {
    return 'Orang Tua';
  }
  return 'Famili Lain';
}

/**
 * Normalizes marital status
 */
export function normalizeStatusNikah(val: any): 'Belum Menikah' | 'Menikah' | 'Janda' | 'Duda' {
  if (!val) return 'Belum Menikah';
  const str = String(val).trim().toLowerCase();
  if (str.includes('menikah') || str.includes('kawin') || str.includes('nikah')) {
    if (str.includes('belum') || str.includes('tidak') || str.includes('single')) return 'Belum Menikah';
    return 'Menikah';
  }
  if (str.includes('janda')) return 'Janda';
  if (str.includes('duda')) return 'Duda';
  if (str.includes('cerai')) return 'Janda';
  return 'Belum Menikah';
}

/**
 * Generate a beautifully formatted Excel template for Sensus Data Keluarga Jemaat GKE
 */
export async function generateSensusExcelTemplate(
  availableLingkungans: string[] = []
): Promise<Blob> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'GKE Digital System';
  workbook.created = new Date();

  // Sheet 1: Data Sensus Keluarga
  const worksheet = workbook.addWorksheet('Data Sensus Keluarga', {
    views: [{ showGridLines: true, state: 'frozen', ySplit: 4 }],
  });

  // Title Headers
  worksheet.mergeCells('A1:O1');
  const titleCell = worksheet.getCell('A1');
  titleCell.value = 'FORMULIR IMPORT SENSUS DATA KELUARGA JEMAAT GKE';
  titleCell.font = { name: 'Arial', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A8A' } };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  worksheet.getRow(1).height = 32;

  worksheet.mergeCells('A2:O2');
  const subTitleCell = worksheet.getCell('A2');
  subTitleCell.value = 'Petunjuk: Isi data setiap anggota keluarga. Baris dengan No KJJ yang sama akan otomatis dikelompokkan dalam satu Kartu Keluarga Jemaat.';
  subTitleCell.font = { name: 'Arial', size: 10, italic: true, color: { argb: 'FF334155' } };
  subTitleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' } };
  subTitleCell.alignment = { horizontal: 'left', vertical: 'middle' };
  worksheet.getRow(2).height = 22;

  // Empty row 3
  worksheet.getRow(3).height = 10;

  // Column Headers (Row 4)
  const headers = [
    { key: 'noKjj', header: 'No. KJJ (*)', width: 18, desc: 'Nomor Kartu Keluarga Jemaat (Wajib, Contoh: KJJ-0101-0001)' },
    { key: 'namaLengkap', header: 'Nama Lengkap (*)', width: 28, desc: 'Nama Lengkap Warga Jemaat (Wajib)' },
    { key: 'nik', header: 'NIK (KTP)', width: 20, desc: 'Nomor Induk Kependudukan 16 Digit' },
    { key: 'jenisKelamin', header: 'L/P (*)', width: 10, desc: 'L = Laki-laki, P = Perempuan' },
    { key: 'tempatLahir', header: 'Tempat Lahir', width: 18, desc: 'Kota/Kabupaten Tempat Lahir' },
    { key: 'tanggalLahir', header: 'Tanggal Lahir (*)', width: 16, desc: 'Format: YYYY-MM-DD atau DD/MM/YYYY (Contoh: 1985-05-15)' },
    { key: 'rayon', header: 'Lingkungan / Sektor (*)', width: 26, desc: 'Nama Lingkungan / Rayon Pelayanan' },
    { key: 'hubunganKeluarga', header: 'Hubungan Keluarga (*)', width: 22, desc: 'Kepala Keluarga / Istri / Anak / Orang Tua / Mertua / Famili Lain' },
    { key: 'statusKeanggotaan', header: 'Status Anggota', width: 16, desc: 'Tetap / Titipan / Pindah' },
    { key: 'statusBaptis', header: 'Baptis (Ya/Tidak)', width: 16, desc: 'Ya = Sudah Baptis, Tidak = Belum' },
    { key: 'statusSidi', header: 'Sidi (Ya/Tidak)', width: 16, desc: 'Ya = Sudah Sidi, Tidak = Belum' },
    { key: 'statusNikah', header: 'Status Nikah', width: 18, desc: 'Belum Menikah / Menikah / Janda / Duda' },
    { key: 'pekerjaan', header: 'Pekerjaan', width: 20, desc: 'PNS / Swasta / Wiraswasta / Pelajar / dll' },
    { key: 'alamat', header: 'Alamat Domisili', width: 32, desc: 'Alamat tempat tinggal keluarga saat ini' },
    { key: 'noHp', header: 'No. HP / WhatsApp', width: 18, desc: 'Nomor kontak aktif (Contoh: 081234567890)' },
  ];

  const headerRow = worksheet.getRow(4);
  headerRow.height = 28;

  headers.forEach((h, index) => {
    const colNumber = index + 1;
    worksheet.getColumn(colNumber).width = h.width;
    const cell = headerRow.getCell(colNumber);
    cell.value = h.header;
    cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF3B82F6' } };
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FF1E40AF' } },
      left: { style: 'thin', color: { argb: 'FF1E40AF' } },
      bottom: { style: 'medium', color: { argb: 'FF1E40AF' } },
      right: { style: 'thin', color: { argb: 'FF1E40AF' } },
    };
  });

  const defaultLingkungan = availableLingkungans.length > 0 ? availableLingkungans[0] : 'Lingkungan I - Ebenezer';
  const defaultLingkungan2 = availableLingkungans.length > 1 ? availableLingkungans[1] : 'Lingkungan II - Yerusalem';

  // Sample data rows (Family 1 & Family 2)
  const sampleRows = [
    // Keluarga 1: Bpk. Markus & Keluarga
    [
      'KJJ-0101-0001',
      'Markus Hendra, S.Pd',
      '6271011505800001',
      'L',
      'Palangka Raya',
      '1980-05-15',
      defaultLingkungan,
      'Kepala Keluarga',
      'Tetap',
      'Ya',
      'Ya',
      'Menikah',
      'PNS / Guru',
      'Jl. RTA Milono Km 4.5 No. 12',
      '081255567890',
    ],
    [
      'KJJ-0101-0001',
      'Maria Magdalena',
      '6271015208830002',
      'P',
      'Kuala Kapuas',
      '1983-08-12',
      defaultLingkungan,
      'Istri',
      'Tetap',
      'Ya',
      'Ya',
      'Menikah',
      'Wiraswasta',
      'Jl. RTA Milono Km 4.5 No. 12',
      '081399887766',
    ],
    [
      'KJJ-0101-0001',
      'Daniel Pratama',
      '6271011003050003',
      'L',
      'Palangka Raya',
      '2005-03-10',
      defaultLingkungan,
      'Anak',
      'Tetap',
      'Ya',
      'Ya',
      'Belum Menikah',
      'Mahasiswa',
      'Jl. RTA Milono Km 4.5 No. 12',
      '085244332211',
    ],
    [
      'KJJ-0101-0001',
      'Grace Natalie',
      '6271014511100004',
      'P',
      'Palangka Raya',
      '2010-11-05',
      defaultLingkungan,
      'Anak',
      'Tetap',
      'Ya',
      'Tidak',
      'Belum Menikah',
      'Pelajar SMP',
      'Jl. RTA Milono Km 4.5 No. 12',
      '',
    ],
    // Keluarga 2: Bpk. Yohanes & Keluarga
    [
      'KJJ-0102-0002',
      'Yohanes Christian',
      '6271021402850001',
      'L',
      'Sampit',
      '1985-02-14',
      defaultLingkungan2,
      'Kepala Keluarga',
      'Tetap',
      'Ya',
      'Ya',
      'Menikah',
      'Karyawan Swasta',
      'Jl. G. Obos XIV No. 28',
      '081122334455',
    ],
    [
      'KJJ-0102-0002',
      'Debora Christine, S.E.',
      '6271025807880002',
      'P',
      'Banjarmasin',
      '1988-07-18',
      defaultLingkungan2,
      'Istri',
      'Tetap',
      'Ya',
      'Ya',
      'Menikah',
      'Perbankan',
      'Jl. G. Obos XIV No. 28',
      '081233445566',
    ],
  ];

  sampleRows.forEach((rowValues, rIdx) => {
    const row = worksheet.addRow(rowValues);
    row.height = 22;
    const isEvenKjj = rowValues[0] === 'KJJ-0101-0001';
    
    row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      cell.font = { name: 'Arial', size: 9.5 };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: isEvenKjj ? 'FFF8FAFC' : 'FFFFFFFF' },
      };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      };

      // Alignment tweaks
      if ([1, 3, 4, 6, 9, 10, 11, 12, 15].includes(colNumber)) {
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      } else {
        cell.alignment = { horizontal: 'left', vertical: 'middle' };
      }
    });
  });

  // Sheet 2: Petunjuk & Daftar Lingkungan Referensi
  const refSheet = workbook.addWorksheet('Petunjuk & Referensi Lingkungan');
  refSheet.columns = [
    { header: 'No', key: 'no', width: 8 },
    { header: 'Daftar Lingkungan / Rayon Terdaftar di Sistem', key: 'nama', width: 38 },
    { header: 'Keterangan Pengisian Kolom', key: 'desc', width: 45 },
  ];

  refSheet.getRow(1).height = 24;
  refSheet.getRow(1).font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
  refSheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A8A' } };

  const lingList = availableLingkungans.length > 0 ? availableLingkungans : [
    'Lingkungan I - Ebenezer',
    'Lingkungan II - Yerusalem',
    'Lingkungan III - Bethel',
    'Lingkungan IV - Sion',
    'Lingkungan V - Filadelfia',
  ];

  lingList.forEach((ling, idx) => {
    let note = '';
    if (idx === 0) note = 'Gunakan persis teks nama lingkungan di atas pada kolom "Lingkungan / Sektor"';
    if (idx === 1) note = 'Kolom L/P diisi "L" untuk Laki-laki dan "P" untuk Perempuan';
    if (idx === 2) note = 'Kolom Tanggal Lahir dianjurkan format YYYY-MM-DD (Contoh: 1990-01-25)';
    if (idx === 3) note = 'Kolom Baptis dan Sidi diisi "Ya" atau "Tidak"';
    if (idx === 4) note = 'Kolom No. KJJ mengelompokkan satu keluarga ke satu Kartu Keluarga';
    refSheet.addRow([idx + 1, ling, note]);
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
}

export interface ExportSensusOptions {
  wargaList: WargaJemaat[];
  availableLingkungans?: string[];
  churchName?: string;
  resortName?: string;
  filterRayon?: string;
  customTitle?: string;
  customFilename?: string;
}

/**
 * Calculates age from birth date string (YYYY-MM-DD)
 */
function calculateAge(birthDateStr?: string): number {
  if (!birthDateStr) return 0;
  try {
    const today = new Date();
    const birthDate = new Date(birthDateStr);
    if (isNaN(birthDate.getTime())) return 0;
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age >= 0 ? age : 0;
  } catch {
    return 0;
  }
}

/**
 * Export Sensus Data Keluarga Jemaat to a beautifully styled Excel (.xlsx) file
 * completely conforming to the standard Sensus template format.
 */
export async function exportSensusToExcel(options: ExportSensusOptions): Promise<{
  blob: Blob;
  filename: string;
}> {
  const {
    wargaList = [],
    availableLingkungans = [],
    churchName = 'GKE (Gereja Kalimantan Evangelis)',
    resortName = '',
    filterRayon = '',
    customTitle,
    customFilename,
  } = options;

  const workbook = new ExcelJS.Workbook();
  workbook.creator = churchName || 'GKE Digital System';
  workbook.lastModifiedBy = 'Admin GKE';
  workbook.created = new Date();
  workbook.modified = new Date();

  // 1. Group and Sort Members by KJJ & Family Hierarchy
  const familyMap = new Map<string, WargaJemaat[]>();
  const relationshipWeights: Record<string, number> = {
    'Kepala Keluarga': 1,
    'Istri': 2,
    'Anak': 3,
    'Orang Tua': 4,
    'Mertua': 5,
    'Famili Lain': 6,
  };

  wargaList.forEach((w) => {
    const kjjKey = (w.noKjj || 'TANPA-KJJ').trim();
    if (!familyMap.has(kjjKey)) {
      familyMap.set(kjjKey, []);
    }
    familyMap.get(kjjKey)!.push(w);
  });

  const sortedRows: { data: WargaJemaat; isEvenFamily: boolean; isFamilyHead: boolean }[] = [];
  let familyIndex = 0;

  familyMap.forEach((members) => {
    const isEvenFamily = familyIndex % 2 === 0;
    familyIndex++;

    // Sort family members by role & birthdate
    members.sort((a, b) => {
      const weightA = relationshipWeights[a.hubunganKeluarga || 'Famili Lain'] || 99;
      const weightB = relationshipWeights[b.hubunganKeluarga || 'Famili Lain'] || 99;
      if (weightA !== weightB) return weightA - weightB;

      // If both are 'Anak', sort by birthdate ascending (older first)
      const dateA = a.tanggalLahir || '9999-99-99';
      const dateB = b.tanggalLahir || '9999-99-99';
      return dateA.localeCompare(dateB);
    });

    members.forEach((m) => {
      sortedRows.push({
        data: m,
        isEvenFamily,
        isFamilyHead: m.hubunganKeluarga === 'Kepala Keluarga',
      });
    });
  });

  const totalJiwa = sortedRows.length;
  const totalKk = familyMap.size;
  const totalL = sortedRows.filter((r) => r.data.jenisKelamin === 'L').length;
  const totalP = sortedRows.filter((r) => r.data.jenisKelamin === 'P').length;
  const totalBaptis = sortedRows.filter((r) => r.data.statusBaptis).length;
  const totalSidi = sortedRows.filter((r) => r.data.statusSidi).length;

  const now = new Date();
  const dateStr = now.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
  const timeStr = now.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
  });

  // ==========================================
  // SHEET 1: DATA SENSUS KELUARGA (TEMPLATE FORMAT)
  // ==========================================
  const worksheet = workbook.addWorksheet('Data Sensus Keluarga', {
    views: [{ showGridLines: true, state: 'frozen', ySplit: 4, xSplit: 0 }],
  });

  // Title Header (Row 1)
  worksheet.mergeCells('A1:O1');
  const titleCell = worksheet.getCell('A1');
  titleCell.value = (
    customTitle ||
    `DATA SENSUS KELUARGA WARGA JEMAAT - ${churchName.toUpperCase()}${resortName ? ` (${resortName.toUpperCase()})` : ''}`
  ).trim();
  titleCell.font = { name: 'Arial', size: 13, bold: true, color: { argb: 'FFFFFFFF' } };
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A8A' } }; // GKE Navy Blue
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  worksheet.getRow(1).height = 32;

  // Subtitle / Metadata (Row 2)
  worksheet.mergeCells('A2:O2');
  const subTitleCell = worksheet.getCell('A2');
  const filterDesc = filterRayon ? `Lingkungan: ${filterRayon}` : 'Semua Lingkungan / Sektor';
  subTitleCell.value = `Ringkasan: ${totalJiwa} Jiwa • ${totalKk} Kepala Keluarga (KK) • ${totalL} Laki-laki / ${totalP} Perempuan • ${filterDesc} • Diunduh: ${dateStr} Pukul ${timeStr} WIB`;
  subTitleCell.font = { name: 'Arial', size: 9.5, italic: true, color: { argb: 'FF1E293B' } };
  subTitleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' } };
  subTitleCell.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };
  worksheet.getRow(2).height = 24;

  // Row 3 Spacer
  worksheet.getRow(3).height = 8;

  // Column Headers (Row 4)
  const headers = [
    { key: 'noKjj', header: 'No. KJJ (*)', width: 18 },
    { key: 'namaLengkap', header: 'Nama Lengkap (*)', width: 30 },
    { key: 'nik', header: 'NIK (KTP)', width: 22 },
    { key: 'jenisKelamin', header: 'L/P (*)', width: 10 },
    { key: 'tempatLahir', header: 'Tempat Lahir', width: 20 },
    { key: 'tanggalLahir', header: 'Tanggal Lahir (*)', width: 16 },
    { key: 'rayon', header: 'Lingkungan / Sektor (*)', width: 26 },
    { key: 'hubunganKeluarga', header: 'Hubungan Keluarga (*)', width: 22 },
    { key: 'statusKeanggotaan', header: 'Status Anggota', width: 16 },
    { key: 'statusBaptis', header: 'Baptis (Ya/Tidak)', width: 16 },
    { key: 'statusSidi', header: 'Sidi (Ya/Tidak)', width: 16 },
    { key: 'statusNikah', header: 'Status Nikah', width: 18 },
    { key: 'pekerjaan', header: 'Pekerjaan', width: 22 },
    { key: 'alamat', header: 'Alamat Domisili', width: 34 },
    { key: 'noHp', header: 'No. HP / WhatsApp', width: 20 },
  ];

  const headerRow = worksheet.getRow(4);
  headerRow.height = 28;

  headers.forEach((h, index) => {
    const colNumber = index + 1;
    worksheet.getColumn(colNumber).width = h.width;
    const cell = headerRow.getCell(colNumber);
    cell.value = h.header;
    cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2563EB' } }; // Royal Blue
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FF1D4ED8' } },
      left: { style: 'thin', color: { argb: 'FF1D4ED8' } },
      bottom: { style: 'medium', color: { argb: 'FF1E3A8A' } },
      right: { style: 'thin', color: { argb: 'FF1D4ED8' } },
    };
  });

  // Populate Data Rows
  sortedRows.forEach((item) => {
    const w = item.data;
    const isEven = item.isEvenFamily;
    const isHead = item.isFamilyHead;

    const rowValues = [
      w.noKjj || '',
      w.namaLengkap || '',
      w.nik ? String(w.nik) : '',
      w.jenisKelamin || 'L',
      w.tempatLahir || '',
      w.tanggalLahir || '',
      w.rayon || '',
      w.hubunganKeluarga || 'Kepala Keluarga',
      w.statusKeanggotaan || 'Tetap',
      w.statusBaptis ? 'Ya' : 'Tidak',
      w.statusSidi ? 'Ya' : 'Tidak',
      w.statusNikah || 'Belum Menikah',
      w.pekerjaan || '',
      w.alamat || '',
      w.noHp ? String(w.noHp) : '',
    ];

    const row = worksheet.addRow(rowValues);
    row.height = 22;

    const bgArgb = isEven ? 'FFFFFFFF' : 'FFF8FAFC'; // Alternating family card tint

    row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      cell.font = {
        name: 'Arial',
        size: 9.5,
        bold: isHead && colNumber === 2, // Bold for Head of family name
        color: {
          argb: isHead && colNumber === 2 ? 'FF0F172A' : 'FF334155',
        },
      };

      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: bgArgb },
      };

      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      };

      // Alignment adjustments
      if ([1, 3, 4, 6, 9, 10, 11, 12, 15].includes(colNumber)) {
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      } else {
        cell.alignment = { horizontal: 'left', vertical: 'middle' };
      }

      // Explicit string format for NIK & No HP so Excel doesn't mangle numbers
      if (colNumber === 3 || colNumber === 15) {
        cell.numFmt = '@';
      }
    });
  });

  // ==========================================
  // SHEET 2: RINGKASAN STATISTIK & REKAPITULASI
  // ==========================================
  const summarySheet = workbook.addWorksheet('Ringkasan Statistik Sensus');
  summarySheet.views = [{ showGridLines: true }];

  // Sheet 2 Title
  summarySheet.mergeCells('A1:G1');
  const sumTitle = summarySheet.getCell('A1');
  sumTitle.value = 'REKAPITULASI & STATISTIK SENSUS WARGA JEMAAT';
  sumTitle.font = { name: 'Arial', size: 12, bold: true, color: { argb: 'FFFFFFFF' } };
  sumTitle.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A8A' } };
  sumTitle.alignment = { horizontal: 'center', vertical: 'middle' };
  summarySheet.getRow(1).height = 28;

  // Sheet 2 Subtitle
  summarySheet.mergeCells('A2:G2');
  const sumSub = summarySheet.getCell('A2');
  sumSub.value = `Total Data: ${totalJiwa} Jiwa • ${totalKk} KK • Baptis: ${totalBaptis} • Sidi: ${totalSidi} • Per Tanggal: ${dateStr}`;
  sumSub.font = { name: 'Arial', size: 9.5, italic: true, color: { argb: 'FF1E293B' } };
  sumSub.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' } };
  sumSub.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };
  summarySheet.getRow(2).height = 22;

  summarySheet.getRow(3).height = 12;

  // Table 1: Per Lingkungan
  summarySheet.getCell('A4').value = '1. REKAPITULASI BERDASARKAN LINGKUNGAN / RAYON';
  summarySheet.getCell('A4').font = { name: 'Arial', size: 10.5, bold: true, color: { argb: 'FF1E40AF' } };

  const lingTableHeaders = ['No', 'Lingkungan / Sektor Pelayanan', 'Jumlah KK', 'Total Jiwa', 'Laki-laki', 'Perempuan', 'Sudah Baptis', 'Sudah Sidi'];
  summarySheet.getRow(5).height = 24;
  summarySheet.columns = [
    { width: 6 },
    { width: 34 },
    { width: 14 },
    { width: 14 },
    { width: 14 },
    { width: 14 },
    { width: 16 },
    { width: 16 },
  ];

  lingTableHeaders.forEach((th, idx) => {
    const cell = summarySheet.getRow(5).getCell(idx + 1);
    cell.value = th;
    cell.font = { name: 'Arial', size: 9.5, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF3B82F6' } };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
  });

  const distinctLingkungans = Array.from(
    new Set([
      ...availableLingkungans,
      ...sortedRows.map((r) => r.data.rayon).filter(Boolean),
    ])
  );

  let currentRowIdx = 6;
  distinctLingkungans.forEach((ling, idx) => {
    const lingMembers = sortedRows.filter((r) => r.data.rayon === ling);
    if (lingMembers.length === 0 && !availableLingkungans.includes(ling)) return;

    const lingKk = new Set(lingMembers.map((r) => r.data.noKjj)).size;
    const lingL = lingMembers.filter((r) => r.data.jenisKelamin === 'L').length;
    const lingP = lingMembers.filter((r) => r.data.jenisKelamin === 'P').length;
    const lingBaptis = lingMembers.filter((r) => r.data.statusBaptis).length;
    const lingSidi = lingMembers.filter((r) => r.data.statusSidi).length;

    const row = summarySheet.getRow(currentRowIdx++);
    row.height = 20;
    const vals = [idx + 1, ling, lingKk, lingMembers.length, lingL, lingP, lingBaptis, lingSidi];
    vals.forEach((v, cIdx) => {
      const cell = row.getCell(cIdx + 1);
      cell.value = v;
      cell.font = { name: 'Arial', size: 9 };
      cell.alignment = { horizontal: cIdx === 1 ? 'left' : 'center', vertical: 'middle' };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      };
    });
  });

  // Table 1 Total Row
  const lingTotalRow = summarySheet.getRow(currentRowIdx++);
  lingTotalRow.height = 22;
  const totalRowVals = ['', 'TOTAL KESELURUHAN', totalKk, totalJiwa, totalL, totalP, totalBaptis, totalSidi];
  totalRowVals.forEach((v, cIdx) => {
    const cell = lingTotalRow.getCell(cIdx + 1);
    cell.value = v;
    cell.font = { name: 'Arial', size: 9.5, bold: true, color: { argb: 'FF0F172A' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' } };
    cell.alignment = { horizontal: cIdx === 1 ? 'left' : 'center', vertical: 'middle' };
    cell.border = {
      top: { style: 'medium', color: { argb: 'FF94A3B8' } },
      bottom: { style: 'medium', color: { argb: 'FF94A3B8' } },
    };
  });

  // Table 2: Golongan Usia
  currentRowIdx += 2;
  summarySheet.getCell(`A${currentRowIdx}`).value = '2. REKAPITULASI BERDASARKAN KATEGORI USIA (KATEGORIAL)';
  summarySheet.getCell(`A${currentRowIdx}`).font = { name: 'Arial', size: 10.5, bold: true, color: { argb: 'FF1E40AF' } };
  currentRowIdx++;

  const usiaHeaders = ['Kategori Pelayanan', 'Rentang Usia', 'Jumlah Jiwa', 'Persentase'];
  summarySheet.getRow(currentRowIdx).height = 22;
  usiaHeaders.forEach((th, idx) => {
    const cell = summarySheet.getRow(currentRowIdx).getCell(idx + 1);
    cell.value = th;
    cell.font = { name: 'Arial', size: 9.5, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF10B981' } }; // Emerald Green
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
  });
  currentRowIdx++;

  let anakCount = 0;
  let remajaPemudaCount = 0;
  let dewasaCount = 0;
  let lansiaCount = 0;

  sortedRows.forEach((r) => {
    const age = calculateAge(r.data.tanggalLahir);
    if (age <= 12) anakCount++;
    else if (age <= 25) remajaPemudaCount++;
    else if (age <= 59) dewasaCount++;
    else lansiaCount++;
  });

  const ageCategories = [
    { label: 'Sekolah Hari Minggu / Anak', range: '0 - 12 Tahun', count: anakCount },
    { label: 'Remaja & Pemuda Jemaat', range: '13 - 25 Tahun', count: remajaPemudaCount },
    { label: 'Kaum Bapak / Ibu (Dewasa)', range: '26 - 59 Tahun', count: dewasaCount },
    { label: 'Lanjut Usia (Lansia)', range: '≥ 60 Tahun', count: lansiaCount },
  ];

  ageCategories.forEach((cat) => {
    const pct = totalJiwa > 0 ? ((cat.count / totalJiwa) * 100).toFixed(1) + '%' : '0%';
    const row = summarySheet.getRow(currentRowIdx++);
    row.height = 20;
    const vals = [cat.label, cat.range, cat.count, pct];
    vals.forEach((v, cIdx) => {
      const cell = row.getCell(cIdx + 1);
      cell.value = v;
      cell.font = { name: 'Arial', size: 9 };
      cell.alignment = { horizontal: cIdx === 0 ? 'left' : 'center', vertical: 'middle' };
    });
  });

  // ==========================================
  // SHEET 3: PETUNJUK & REFERENSI LINGKUNGAN
  // ==========================================
  const refSheet = workbook.addWorksheet('Petunjuk & Referensi');
  refSheet.columns = [
    { header: 'No', key: 'no', width: 8 },
    { header: 'Daftar Lingkungan / Rayon Terdaftar', key: 'nama', width: 38 },
    { header: 'Petunjuk Penataan Data', key: 'desc', width: 50 },
  ];

  refSheet.getRow(1).height = 24;
  refSheet.getRow(1).font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
  refSheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A8A' } };

  const refLingList = distinctLingkungans.length > 0 ? distinctLingkungans : [
    'Lingkungan I - Ebenezer',
    'Lingkungan II - Yerusalem',
    'Lingkungan III - Bethel',
    'Lingkungan IV - Sion',
    'Lingkungan V - Filadelfia',
  ];

  refLingList.forEach((ling, idx) => {
    let note = '';
    if (idx === 0) note = 'File ini dapat diedit dan diimport kembali melalui tombol "Import Sensus (Excel)".';
    if (idx === 1) note = 'Pastikan baris anggota satu keluarga memiliki No. KJJ yang sama persis.';
    if (idx === 2) note = 'Format tanggal lahir yang didukung: YYYY-MM-DD (Contoh: 1990-05-15) atau DD/MM/YYYY.';
    if (idx === 3) note = 'Kolom L/P diisi "L" untuk Laki-laki dan "P" untuk Perempuan.';
    if (idx === 4) note = 'Kolom Baptis dan Sidi diisi "Ya" atau "Tidak".';
    refSheet.addRow([idx + 1, ling, note]);
  });

  // Write and produce Blob
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });

  const cleanChurchName = (churchName || 'GKE').replace(/[^a-zA-Z0-9]/g, '_');
  const cleanFilterName = filterRayon ? `_${filterRayon.replace(/[^a-zA-Z0-9]/g, '_')}` : '_Semua_Lingkungan';
  const yyyymmdd = now.toISOString().slice(0, 10).replace(/-/g, '');
  const finalFilename = customFilename || `Data_Sensus_Keluarga_Jemaat_${cleanChurchName}${cleanFilterName}_${yyyymmdd}.xlsx`;

  return {
    blob,
    filename: finalFilename,
  };
}

/**
 * Triggers an immediate browser download for the Sensus Excel file
 */
export async function downloadSensusExcel(options: ExportSensusOptions): Promise<{
  filename: string;
  totalJiwa: number;
  totalKk: number;
}> {
  const result = await exportSensusToExcel(options);
  const url = URL.createObjectURL(result.blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = result.filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  const totalKk = new Set(options.wargaList.map((w) => w.noKjj)).size;
  return {
    filename: result.filename,
    totalJiwa: options.wargaList.length,
    totalKk,
  };
}


/**
 * Parses an uploaded Excel or CSV file containing Sensus Data Keluarga
 */
export async function parseSensusExcelFile(
  file: File,
  existingWargaList: WargaJemaat[] = [],
  availableLingkungans: string[] = []
): Promise<{
  rows: ParsedSensusRow[];
  summary: SensusImportSummary;
  rawCount: number;
}> {
  const fileName = file.name.toLowerCase();
  let raw2dRows: any[][] = [];
  let rawJsonRows: any[] = [];

  if (fileName.endsWith('.csv')) {
    const text = await file.text();
    const parsed = Papa.parse(text, {
      header: false,
      skipEmptyLines: true,
    });
    raw2dRows = (parsed.data as any[][]) || [];
  } else {
    // Read using XLSX for robust cross-format handling (xlsx, xls, xlsm)
    const arrayBuffer = await file.arrayBuffer();
    // Use cellDates: false to prevent timezone offset corruption on date serials
    const workbook = XLSX.read(arrayBuffer, { type: 'array', cellDates: false });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];

    // Convert sheet to 2D array (header: 1)
    raw2dRows = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '', raw: true }) as any[][];
  }

  if (!raw2dRows || raw2dRows.length === 0) {
    return {
      rows: [],
      summary: {
        totalRows: 0,
        validRows: 0,
        invalidRows: 0,
        totalKkCount: 0,
        newKkCount: 0,
        existingRecordsCount: 0,
        maleCount: 0,
        femaleCount: 0,
        baptisCount: 0,
        sidiCount: 0,
      },
      rawCount: 0,
    };
  }

  // 1. SMART MULTI-LAYER HEADER ROW DETECTOR
  // Calculate scoring for candidate header rows (rows 0 to min(25, length))
  let bestHeaderRowIndex = -1;
  let highestHeaderScore = 0;

  for (let r = 0; r < Math.min(25, raw2dRows.length); r++) {
    const row = raw2dRows[r];
    if (!Array.isArray(row)) continue;

    let score = 0;
    let nonBlankCellCount = 0;

    row.forEach((cell) => {
      if (cell === undefined || cell === null) return;
      const str = String(cell).trim().toLowerCase().replace(/[^a-z0-9]/g, '');
      if (!str) return;
      nonBlankCellCount++;

      // Header keyword matching on cell level
      if (str.includes('nama') || str.includes('fullname') || str.includes('name')) score += 35;
      if (str.includes('kjj') || str.includes('kartukeluarga') || str.includes('nokk')) score += 30;
      if (str.includes('nik') || str.includes('ktp') || str.includes('identitas')) score += 25;
      if (str.includes('jeniskelamin') || str.includes('jk') || str === 'lp' || str.includes('gender')) score += 25;
      if (str.includes('tanggallahir') || str.includes('tgllahir') || str.includes('tempatlahir') || str.includes('ttl')) score += 25;
      if (str.includes('hubungan') || str.includes('shdk')) score += 25;
      if (str.includes('baptis') || str.includes('sidi') || str.includes('nikah') || str.includes('perkawinan')) score += 20;
      if (str.includes('rayon') || str.includes('lingkungan') || str.includes('sektor')) score += 20;
      if (str.includes('pekerjaan') || str.includes('alamat') || str.includes('nohp') || str.includes('telepon')) score += 15;
    });

    // Penalize single-cell title banners (e.g. "FORMULIR SENSUS GKE" spanning cell A1 only)
    if (nonBlankCellCount < 2) {
      score = Math.min(score, 10);
    }

    if (score > highestHeaderScore) {
      highestHeaderScore = score;
      bestHeaderRowIndex = r;
    }
  }

  // If no high score header found, fallback to 0 or first non-empty row
  if (bestHeaderRowIndex === -1 || highestHeaderScore < 20) {
    for (let r = 0; r < Math.min(10, raw2dRows.length); r++) {
      const row = raw2dRows[r];
      if (Array.isArray(row) && row.some((c) => c !== undefined && c !== null && String(c).trim() !== '')) {
        bestHeaderRowIndex = r;
        break;
      }
    }
  }

  if (bestHeaderRowIndex === -1) bestHeaderRowIndex = 0;

  // Extract detected headers (combine with previous row if multi-line header)
  const headerRow = raw2dRows[bestHeaderRowIndex] || [];
  const prevHeaderRow = bestHeaderRowIndex > 0 ? raw2dRows[bestHeaderRowIndex - 1] || [] : [];
  const maxColCount = Math.max(
    headerRow.length,
    prevHeaderRow.length,
    ...raw2dRows.slice(bestHeaderRowIndex + 1, bestHeaderRowIndex + 10).map((r) => (Array.isArray(r) ? r.length : 0))
  );

  const columnHeaders: string[] = [];
  for (let c = 0; c < maxColCount; c++) {
    const curVal = String(headerRow[c] || '').trim();
    const prevVal = String(prevHeaderRow[c] || '').trim();
    if (curVal && prevVal && curVal !== prevVal && !curVal.toLowerCase().includes(prevVal.toLowerCase())) {
      columnHeaders[c] = `${prevVal} ${curVal}`;
    } else {
      columnHeaders[c] = curVal || prevVal || `Kolom_${c + 1}`;
    }
  }

  // 2. COLUMN INDEX MAPPING
  const colIndex = {
    kjj: -1,
    nama: -1,
    nik: -1,
    jk: -1,
    tempatLahir: -1,
    tglLahir: -1,
    ttl: -1,
    rayon: -1,
    hubungan: -1,
    statusAnggota: -1,
    baptis: -1,
    sidi: -1,
    nikah: -1,
    pekerjaan: -1,
    alamat: -1,
    noHp: -1,
  };

  columnHeaders.forEach((rawH, idx) => {
    const h = rawH.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (!h) return;

    if (colIndex.nama === -1 && (h.includes('nama') || h.includes('fullname') || h.includes('name') || h.includes('pemohon') || h.includes('warga') || h.includes('jemaat') || h.includes('anggota'))) {
      colIndex.nama = idx;
    }
    if (colIndex.kjj === -1 && (h.includes('kjj') || h.includes('nokjj') || h.includes('kartukeluarga') || h.includes('nokk') || h.includes('kkj') || h.includes('nomorkk') || h.includes('idkk'))) {
      colIndex.kjj = idx;
    }
    if (colIndex.nik === -1 && (h.includes('nik') || h.includes('ktp') || h.includes('nomorktp') || h.includes('nonik') || h.includes('identitas') || h.includes('idktp'))) {
      colIndex.nik = idx;
    }
    if (colIndex.jk === -1 && (h.includes('jeniskelamin') || h.includes('jk') || h === 'lp' || h.includes('gender') || h.includes('sex') || h.includes('kelamin'))) {
      colIndex.jk = idx;
    }
    if (colIndex.ttl === -1 && (h.includes('tempattanggallahir') || h.includes('tmptgllahir') || h.includes('ttllahir') || h === 'ttl' || h.includes('tempat/tgl'))) {
      colIndex.ttl = idx;
    }
    if (colIndex.tempatLahir === -1 && (h.includes('tempatlahir') || h.includes('tmplahir') || h.includes('kota') || h.includes('tmplhr') || h.includes('birthplace') || (h.includes('tempat') && !h.includes('tinggal')))) {
      colIndex.tempatLahir = idx;
    }
    if (colIndex.tglLahir === -1 && (h.includes('tanggallahir') || h.includes('tgllahir') || h.includes('tgllhr') || h.includes('birthdate') || h.includes('dob') || (h.includes('tanggal') && !h.includes('nikah')) || (h.includes('lahir') && !h.includes('tempat') && !h.includes('tmp')) || h === 'tgl')) {
      colIndex.tglLahir = idx;
    }
    if (colIndex.rayon === -1 && (h.includes('lingkungan') || h.includes('rayon') || h.includes('sektor') || h.includes('wilayah') || h.includes('pos') || h.includes('kring') || h.includes('pospelayanan'))) {
      colIndex.rayon = idx;
    }
    if (colIndex.hubungan === -1 && (h.includes('hubungankeluarga') || h.includes('hubungan') || h.includes('posisi') || h.includes('statushubungan') || h.includes('shdk') || h.includes('kedudukan') || h.includes('statusdlmkeluarga'))) {
      colIndex.hubungan = idx;
    }
    if (colIndex.statusAnggota === -1 && (h.includes('statuskeanggotaan') || h.includes('statusanggota') || h.includes('keanggotaan') || h.includes('statuswarga') || h.includes('statusjemaat'))) {
      colIndex.statusAnggota = idx;
    }
    if (colIndex.baptis === -1 && (h.includes('statusbaptis') || h.includes('baptis') || h.includes('baptisan') || h.includes('sakramenbaptis') || h.includes('sdhbaptis'))) {
      colIndex.baptis = idx;
    }
    if (colIndex.sidi === -1 && (h.includes('statussidi') || h.includes('sidi') || h.includes('sakramensidi') || h.includes('sdhsidi'))) {
      colIndex.sidi = idx;
    }
    if (colIndex.nikah === -1 && (h.includes('statusnikah') || h.includes('statuspernikahan') || h.includes('pernikahan') || h.includes('perkawinan') || h.includes('statuskawin') || h.includes('marital'))) {
      colIndex.nikah = idx;
    }
    if (colIndex.pekerjaan === -1 && (h.includes('pekerjaan') || h.includes('profesi') || h.includes('bidang') || h.includes('job') || h.includes('pencaharian'))) {
      colIndex.pekerjaan = idx;
    }
    if (colIndex.alamat === -1 && (h.includes('alamat') || h.includes('domisili') || h.includes('tempattinggal') || h.includes('jalan') || h.includes('address') || h.includes('lokasi'))) {
      colIndex.alamat = idx;
    }
    if (colIndex.noHp === -1 && (h.includes('nohp') || h.includes('hp') || h.includes('wa') || h.includes('whatsapp') || h.includes('telepon') || h.includes('telp') || h.includes('kontak') || h.includes('phone') || h.includes('mobile'))) {
      colIndex.noHp = idx;
    }
  });

  // Fallback positional defaults if header detection missed standard template positions (15 columns layout)
  if (colIndex.nama === -1) {
    // If standard template: Col 0 = KJJ, Col 1 = Nama
    if (columnHeaders.length >= 2) colIndex.nama = 1;
    else colIndex.nama = 0;
  }
  if (colIndex.kjj === -1 && colIndex.nama !== 0) colIndex.kjj = 0;
  if (colIndex.nik === -1 && columnHeaders.length > 2 && colIndex.nama !== 2) colIndex.nik = 2;
  if (colIndex.jk === -1 && columnHeaders.length > 3 && colIndex.nama !== 3) colIndex.jk = 3;
  if (colIndex.tempatLahir === -1 && columnHeaders.length > 4 && colIndex.nama !== 4) colIndex.tempatLahir = 4;
  if (colIndex.tglLahir === -1 && columnHeaders.length > 5 && colIndex.nama !== 5) colIndex.tglLahir = 5;
  if (colIndex.rayon === -1 && columnHeaders.length > 6 && colIndex.nama !== 6) colIndex.rayon = 6;
  if (colIndex.hubungan === -1 && columnHeaders.length > 7 && colIndex.nama !== 7) colIndex.hubungan = 7;
  if (colIndex.statusAnggota === -1 && columnHeaders.length > 8 && colIndex.nama !== 8) colIndex.statusAnggota = 8;
  if (colIndex.baptis === -1 && columnHeaders.length > 9 && colIndex.nama !== 9) colIndex.baptis = 9;
  if (colIndex.sidi === -1 && columnHeaders.length > 10 && colIndex.nama !== 10) colIndex.sidi = 10;
  if (colIndex.nikah === -1 && columnHeaders.length > 11 && colIndex.nama !== 11) colIndex.nikah = 11;
  if (colIndex.pekerjaan === -1 && columnHeaders.length > 12 && colIndex.nama !== 12) colIndex.pekerjaan = 12;
  if (colIndex.alamat === -1 && columnHeaders.length > 13 && colIndex.nama !== 13) colIndex.alamat = 13;
  if (colIndex.noHp === -1 && columnHeaders.length > 14 && colIndex.nama !== 14) colIndex.noHp = 14;

  // Prebuild lookup sets for existing DB matching
  const existingKjjMap = new Map<string, WargaJemaat[]>();
  const existingNikSet = new Set<string>();
  const existingNameSet = new Set<string>();

  existingWargaList.forEach((w) => {
    if (w.noKjj) {
      const cleanKjj = w.noKjj.trim().toLowerCase();
      const arr = existingKjjMap.get(cleanKjj) || [];
      arr.push(w);
      existingKjjMap.set(cleanKjj, arr);
    }
    if (w.nik && w.nik.trim()) {
      existingNikSet.add(w.nik.trim());
    }
    if (w.namaLengkap) {
      existingNameSet.add(w.namaLengkap.trim().toLowerCase());
    }
  });

  const parsedRows: ParsedSensusRow[] = [];
  const kkSet = new Set<string>();
  const newKkSet = new Set<string>();
  let maleCount = 0;
  let femaleCount = 0;
  let baptisCount = 0;
  let sidiCount = 0;
  let validRowsCount = 0;
  let existingRecordsCount = 0;

  // Carry-forward context for family grouping when KJJ/Alamat/Rayon are blank for subsequent family members
  let lastSeenKjj = '';
  let lastSeenRayon = availableLingkungans[0] || 'Lingkungan I - Ebenezer';
  let lastSeenAlamat = '';
  let autoKjjCounter = 1;

  // Process data rows (rows strictly after detected bestHeaderRowIndex)
  const dataRows = raw2dRows.slice(bestHeaderRowIndex + 1);

  dataRows.forEach((row, idx) => {
    if (!Array.isArray(row) || row.length === 0) return;

    // Helper to safely extract cell by column index or fallbacks
    const getCell = (col: number): any => {
      if (col >= 0 && col < row.length) {
        const val = row[col];
        if (val !== undefined && val !== null && String(val).trim() !== '') {
          return val;
        }
      }
      return '';
    };

    let rawNama = String(getCell(colIndex.nama) || '').trim();
    let rawKjj = String(getCell(colIndex.kjj) || '').trim();
    let rawNik = String(getCell(colIndex.nik) || '').trim();
    let rawJk = getCell(colIndex.jk);
    let rawTempatLahir = String(getCell(colIndex.tempatLahir) || '').trim();
    let rawTglLahir = getCell(colIndex.tglLahir);
    let rawTtl = String(getCell(colIndex.ttl) || '').trim();
    let rawRayon = String(getCell(colIndex.rayon) || '').trim();
    let rawHubungan = getCell(colIndex.hubungan);
    let rawStatusAnggota = String(getCell(colIndex.statusAnggota) || '').trim();
    let rawBaptis = getCell(colIndex.baptis);
    let rawSidi = getCell(colIndex.sidi);
    let rawNikah = getCell(colIndex.nikah);
    let rawPekerjaan = String(getCell(colIndex.pekerjaan) || '').trim();
    let rawAlamat = String(getCell(colIndex.alamat) || '').trim();
    let rawNoHp = String(getCell(colIndex.noHp) || '').trim();

    // If rawNama is still empty, scan row for any valid name string (cell with text, no purely numbers/dates/KJJ)
    if (!rawNama) {
      for (let c = 0; c < row.length; c++) {
        if (c === colIndex.kjj || c === colIndex.nik || c === colIndex.noHp) continue;
        const cellStr = String(row[c] || '').trim();
        if (cellStr.length >= 3 && !/^\d+$/.test(cellStr) && !/^kjj-/i.test(cellStr) && !/^\d{4}-\d{2}-\d{2}$/.test(cellStr)) {
          // Check if it's not a header title repetition
          if (!cellStr.toLowerCase().includes('formulir') && !cellStr.toLowerCase().includes('petunjuk')) {
            rawNama = cellStr;
            break;
          }
        }
      }
    }

    // Strip out leading numbering if present (e.g. "1. Budi Santoso" -> "Budi Santoso")
    if (rawNama) {
      rawNama = rawNama.replace(/^\d+[\.\-\)]\s*/, '').trim();
    }

    // Skip row if it's completely empty
    if (!rawNama && !rawKjj && !rawNik && !rawAlamat) {
      return;
    }

    // Skip if row is accidentally header text repetition
    if (rawNama.toLowerCase() === 'nama lengkap' || rawNama.toLowerCase() === 'nama' || rawNama.toLowerCase() === 'no. kjj (*)') {
      return;
    }

    const validationIssues: string[] = [];
    let isNameMissing = false;

    if (!rawNama || rawNama.toLowerCase() === 'tanpa nama') {
      isNameMissing = true;
      validationIssues.push('Nama lengkap belum terisi');
    }

    const hubunganKeluarga = normalizeHubunganKeluarga(rawHubungan);

    // Handle combined TTL (Tempat & Tanggal Lahir) e.g. "Palangka Raya, 12-05-1990" or "Palangka Raya, 12/05/1990"
    if (rawTtl && (!rawTempatLahir || !rawTglLahir)) {
      // Split by comma or semicolon, NEVER by slash which destroys DD/MM/YYYY dates
      const parts = rawTtl.split(/[,;]/);
      if (parts.length >= 2) {
        if (!rawTempatLahir) rawTempatLahir = parts[0].trim();
        if (!rawTglLahir) rawTglLahir = parts.slice(1).join(' ').trim();
      } else if (!rawTempatLahir) {
        const dateAtEndMatch = rawTtl.match(/^(.*?)[,\s]+(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}|\d{1,2}\s+[a-zA-Z]+\s+\d{4})$/);
        if (dateAtEndMatch) {
          if (!rawTempatLahir) rawTempatLahir = dateAtEndMatch[1].trim();
          if (!rawTglLahir) rawTglLahir = dateAtEndMatch[2].trim();
        } else {
          rawTempatLahir = rawTtl;
        }
      }
    }

    // Intelligent KJJ Normalization & Family Grouping
    let normalizedKjj = rawKjj;
    if (normalizedKjj) {
      lastSeenKjj = normalizedKjj;
    } else if (lastSeenKjj && hubunganKeluarga !== 'Kepala Keluarga') {
      // Inherit family KJJ from previous row (e.g. wife / children)
      normalizedKjj = lastSeenKjj;
    } else {
      // Auto-generate safe KJJ
      normalizedKjj = `KJJ-GKE-${String(autoKjjCounter++).padStart(4, '0')}`;
      lastSeenKjj = normalizedKjj;
      validationIssues.push('No. KJJ dibuat otomatis');
    }

    // Normalize Gender
    let jk = normalizeGender(rawJk);
    if (!rawJk) {
      if (hubunganKeluarga === 'Istri') jk = 'P';
      else if (hubunganKeluarga === 'Kepala Keluarga') jk = 'L';
    }

    // Normalize Date of Birth
    let isoDate = normalizeDateToIso(rawTglLahir);

    // Fallback: If date not found in specified column, scan other cells in the row
    if (!isoDate || isoDate.length < 4 || isoDate === '1990-01-01') {
      for (let c = 0; c < row.length; c++) {
        if (c === colIndex.nama || c === colIndex.kjj || c === colIndex.nik || c === colIndex.noHp || c === colIndex.pekerjaan || c === colIndex.alamat) continue;
        const candidate = row[c];
        if (candidate === undefined || candidate === null || candidate === '') continue;
        const testIso = normalizeDateToIso(candidate);
        if (testIso && testIso.length === 10 && /^\d{4}-\d{2}-\d{2}$/.test(testIso) && testIso !== '1990-01-01') {
          isoDate = testIso;
          break;
        }
      }
    }

    if (!isoDate || isoDate.length < 4) {
      isoDate = '1990-01-01'; // Safe default date
      if (rawTglLahir) {
        validationIssues.push(`Tanggal disesuaikan: ${isoDate}`);
      }
    }

    // Normalize Rayon / Lingkungan
    let rayon = rawRayon;
    if (rayon) {
      const matchLing = availableLingkungans.find(
        (l) => l.toLowerCase() === rayon.toLowerCase() || l.toLowerCase().includes(rayon.toLowerCase()) || rayon.toLowerCase().includes(l.toLowerCase())
      );
      if (matchLing) {
        rayon = matchLing;
      }
      lastSeenRayon = rayon;
    } else {
      rayon = lastSeenRayon || availableLingkungans[0] || 'Lingkungan I - Ebenezer';
    }

    // Normalize Alamat
    let alamat = rawAlamat;
    if (alamat) {
      lastSeenAlamat = alamat;
    } else if (lastSeenAlamat) {
      alamat = lastSeenAlamat;
    }

    const statusBaptis = normalizeBoolean(rawBaptis, true);
    const statusSidi = normalizeBoolean(rawSidi, false);
    const statusNikah = normalizeStatusNikah(rawNikah);

    let statusKeanggotaan: 'Tetap' | 'Titipan' | 'Pindah' = 'Tetap';
    if (rawStatusAnggota.toLowerCase().includes('titip')) statusKeanggotaan = 'Titipan';
    if (rawStatusAnggota.toLowerCase().includes('pindah')) statusKeanggotaan = 'Pindah';

    // Clean up NIK
    let cleanNik = rawNik ? String(rawNik).replace(/[^0-9]/g, '') : '';
    if (cleanNik.length > 16) cleanNik = cleanNik.substring(0, 16);

    // Clean up No HP
    let cleanNoHp = rawNoHp ? String(rawNoHp).replace(/[^0-9+\-\s]/g, '') : '';

    // Check if duplicate with existing DB
    const isExistingInDb =
      (cleanNik && existingNikSet.has(cleanNik)) ||
      (rawNama && existingNameSet.has(rawNama.toLowerCase()));

    if (isExistingInDb) {
      existingRecordsCount++;
    }

    // Any row with a valid Name is ready and valid for import
    const isValid = !isNameMissing && rawNama.trim().length > 0;
    if (isValid) {
      validRowsCount++;
      if (jk === 'L') maleCount++;
      else femaleCount++;
      if (statusBaptis) baptisCount++;
      if (statusSidi) sidiCount++;

      kkSet.add(normalizedKjj);
      if (!existingKjjMap.has(normalizedKjj.toLowerCase())) {
        newKkSet.add(normalizedKjj);
      }
    }

    parsedRows.push({
      rowNumber: idx + 1,
      noKjj: normalizedKjj,
      namaLengkap: rawNama || 'Tanpa Nama',
      nik: cleanNik,
      jenisKelamin: jk,
      tempatLahir: rawTempatLahir || 'Palangka Raya',
      tanggalLahir: isoDate,
      rayon,
      hubunganKeluarga,
      statusKeanggotaan,
      statusBaptis,
      statusSidi,
      statusNikah,
      pekerjaan: rawPekerjaan || 'Wiraswasta / Lainnya',
      alamat: alamat || '',
      noHp: cleanNoHp || '',
      isValid,
      validationIssues,
      isExistingInDb,
    });
  });

  return {
    rows: parsedRows,
    summary: {
      totalRows: parsedRows.length,
      validRows: validRowsCount,
      invalidRows: parsedRows.length - validRowsCount,
      totalKkCount: kkSet.size,
      newKkCount: newKkSet.size,
      existingRecordsCount,
      maleCount,
      femaleCount,
      baptisCount,
      sidiCount,
    },
    rawCount: dataRows.length,
  };
}

/**
 * Export Deceased Members Registry (Buku Registrasi Warga Berpulang) to Excel
 */
export async function downloadDeceasedExcel(
  deceasedList: WargaJemaat[],
  churchName: string = 'Gereja Kalimantan Evangelis'
): Promise<{ filename: string; totalJiwa: number }> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = churchName;
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet('Buku Registrasi Kematian', {
    views: [{ showGridLines: true }],
  });

  // Title Banner
  worksheet.mergeCells('A1:N1');
  const titleCell = worksheet.getCell('A1');
  titleCell.value = `BUKU INDUK REGISTRASI KEMATIAN & ARSIP WARGA BERPULANG`;
  titleCell.font = { name: 'Arial', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  titleCell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF1E1B4B' }, // Dark indigo
  };
  worksheet.getRow(1).height = 32;

  worksheet.mergeCells('A2:N2');
  const subCell = worksheet.getCell('A2');
  subCell.value = `${churchName.toUpperCase()} • Diunduh: ${new Date().toLocaleDateString('id-ID', { dateStyle: 'full' })}`;
  subCell.font = { name: 'Arial', size: 10, italic: true, color: { argb: 'FFFFFFFF' } };
  subCell.alignment = { horizontal: 'center', vertical: 'middle' };
  subCell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF312E81' },
  };
  worksheet.getRow(2).height = 20;

  worksheet.addRow([]); // Row 3 blank

  // Headers
  const headers = [
    'No',
    'No. KJJ',
    'Nama Lengkap (Alm/Almh)',
    'NIK',
    'L/P',
    'Tanggal Lahir',
    'Tanggal Wafat',
    'Usia Berpulang',
    'Lingkungan / Sektor',
    'Tempat Meninggal',
    'Tempat Pemakaman',
    'Pelayan Pemakaman',
    'Keluarga Ditinggalkan',
    'No. Surat Kematian',
  ];

  const headerRow = worksheet.addRow(headers);
  headerRow.height = 26;
  headerRow.eachCell((cell) => {
    cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4338CA' },
    };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
      left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
      bottom: { style: 'medium', color: { argb: 'FF1E1B4B' } },
      right: { style: 'thin', color: { argb: 'FFCBD5E1' } },
    };
  });

  // Helper age calc
  const calcAge = (birth?: string, death?: string) => {
    if (!birth) return '-';
    const b = new Date(birth);
    const d = death ? new Date(death) : new Date();
    let diff = d.getFullYear() - b.getFullYear();
    const m = d.getMonth() - b.getMonth();
    if (m < 0 || (m === 0 && d.getDate() < b.getDate())) diff--;
    return diff >= 0 ? `${diff} Thn` : '-';
  };

  // Data rows
  deceasedList.forEach((w, idx) => {
    const row = worksheet.addRow([
      idx + 1,
      w.noKjj || '-',
      w.namaLengkap + (w.jenisKelamin === 'P' ? ' (Almh.)' : ' (Alm.)'),
      w.nik || '-',
      w.jenisKelamin || '-',
      w.tanggalLahir || '-',
      w.tanggalMeninggal || '-',
      calcAge(w.tanggalLahir, w.tanggalMeninggal),
      w.rayon || '-',
      w.tempatMeninggal || '-',
      w.tempatPemakaman || '-',
      w.pelayanPemakaman || '-',
      w.keluargaDitinggalkan || '-',
      w.nomorSuratKematian || '-',
    ]);

    row.height = 22;
    const isEven = idx % 2 === 0;
    row.eachCell((cell, colNum) => {
      cell.font = { name: 'Arial', size: 9.5 };
      cell.alignment = {
        vertical: 'middle',
        horizontal: colNum === 1 || colNum === 5 ? 'center' : 'left',
      };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: isEven ? 'FFFFFFFF' : 'FFF8FAFC' },
      };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      };
    });
  });

  // Set column widths
  worksheet.columns = [
    { width: 6 },  // No
    { width: 16 }, // No. KJJ
    { width: 28 }, // Nama Lengkap
    { width: 18 }, // NIK
    { width: 6 },  // L/P
    { width: 14 }, // Tgl Lahir
    { width: 14 }, // Tgl Wafat
    { width: 14 }, // Usia
    { width: 24 }, // Lingkungan
    { width: 24 }, // Tempat Meninggal
    { width: 24 }, // Tempat Pemakaman
    { width: 24 }, // Pelayan Pemakaman
    { width: 28 }, // Keluarga Ditinggalkan
    { width: 28 }, // No Surat Kematian
  ];

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });

  const filename = `Buku_Registrasi_Kematian_GKE_${new Date().toISOString().split('T')[0]}.xlsx`;
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  return { filename, totalJiwa: deceasedList.length };
}

