import ExcelJS from 'exceljs';
import Papa from 'papaparse';
import { AlmanakNastGKE } from '../types';

export const DAYS_ID = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
export const MONTHS_ID = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

/**
 * Format tanggal standar Indonesia (contoh: "05 April 2026")
 */
export const formatTanggalIndonesia = (dateStr: string): string => {
  if (!dateStr) return '';
  // Check if already in DD MMMM YYYY format
  if (dateStr.includes(' ') && isNaN(Date.parse(dateStr))) {
    return dateStr;
  }
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) {
    // If format like "01 April 2026" or other
    return dateStr;
  }
  const day = String(d.getDate()).padStart(2, '0');
  const month = MONTHS_ID[d.getMonth()];
  const year = d.getFullYear();
  return `${day} ${month} ${year}`;
};

/**
 * Parse tanggal berbagai format ke format YYYY-MM-DD
 */
export const parseToIsoDate = (input: any): string => {
  if (!input) return '';
  if (input instanceof Date && !isNaN(input.getTime())) {
    return input.toISOString().split('T')[0];
  }
  const str = String(input).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    return str;
  }

  // Check format "DD/MM/YYYY" or "DD-MM-YYYY"
  const dmyMatch = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (dmyMatch) {
    const day = dmyMatch[1].padStart(2, '0');
    const month = dmyMatch[2].padStart(2, '0');
    const year = dmyMatch[3];
    return `${year}-${month}-${day}`;
  }

  // Check format "DD MMMM YYYY" (e.g. "05 April 2026")
  const idMatch = str.match(/^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})/);
  if (idMatch) {
    const day = idMatch[1].padStart(2, '0');
    const monthName = idMatch[2].toLowerCase();
    const year = idMatch[3];
    const monthIdx = MONTHS_ID.findIndex((m) => m.toLowerCase() === monthName);
    if (monthIdx !== -1) {
      const month = String(monthIdx + 1).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
  }

  const parsed = Date.parse(str);
  if (!isNaN(parsed)) {
    return new Date(parsed).toISOString().split('T')[0];
  }

  return str;
};

/**
 * Ambil nama hari dalam Bahasa Indonesia dari tanggal ISO
 */
export const getNamaHari = (dateStr: string): string => {
  const iso = parseToIsoDate(dateStr);
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return '';
  const d = new Date(iso + 'T12:00:00');
  if (isNaN(d.getTime())) return '';
  return DAYS_ID[d.getDay()];
};

/**
 * Cek apakah baris merupakan Hari Minggu atau Hari Raya Gerejawi
 */
export const isHolidayOrSunday = (item: Partial<AlmanakNastGKE>): boolean => {
  if (item.isHariRaya) return true;
  const hari = item.hari || getNamaHari(item.tanggal || '');
  if (hari.toLowerCase() === 'minggu') return true;
  const ket = (item.keteranganHari || '').toLowerCase();
  if (
    ket.includes('jumat agung') ||
    ket.includes('paskah') ||
    ket.includes('natal') ||
    ket.includes('kenaikan') ||
    ket.includes('pentakosta') ||
    ket.includes('trinitatis') ||
    ket.includes('advent') ||
    ket.includes('hut gke') ||
    ket.includes('tahun baru')
  ) {
    return true;
  }
  return false;
};

/**
 * Ekspor Data ke Excel (.xlsx) dengan Format Persis Seperti Lampiran User
 */
export const exportAlmanakToExcel = async (
  items: AlmanakNastGKE[],
  options: {
    namaJemaat?: string;
    filterBulan?: string;
    filterTahun?: string;
  } = {}
): Promise<void> => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Sistem Informasi Jemaat GKE';
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet('Almanak Nast GKE', {
    pageSetup: { paperSize: 9, orientation: 'portrait', fitToPage: true },
  });

  // Define Columns exactly matching User's attached screenshot
  worksheet.columns = [
    { header: 'Tanggal', key: 'tanggal', width: 18 },
    { header: 'Hari', key: 'hari', width: 14 },
    { header: 'Keterangan Hari', key: 'keteranganHari', width: 34 },
    { header: 'Warna Stola', key: 'warnaStola', width: 16 },
    { header: 'Nast Bacaan', key: 'nastBacaan', width: 26 },
    { header: 'Nast Khotbah', key: 'nastKhotbah', width: 26 },
  ];

  // Header Row Style
  const headerRow = worksheet.getRow(1);
  headerRow.height = 28;
  headerRow.eachCell((cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE2E8F0' }, // Slate 200
    };
    cell.font = {
      name: 'Calibri',
      size: 11,
      bold: true,
      color: { argb: 'FF0F172A' }, // Slate 900
    };
    cell.alignment = {
      vertical: 'middle',
      horizontal: 'center',
      wrapText: true,
    };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FF94A3B8' } },
      left: { style: 'thin', color: { argb: 'FF94A3B8' } },
      bottom: { style: 'medium', color: { argb: 'FF64748B' } },
      right: { style: 'thin', color: { argb: 'FF94A3B8' } },
    };
  });

  // Sort items chronologically
  const sorted = [...items].sort((a, b) => a.tanggal.localeCompare(b.tanggal));

  // Add Rows
  sorted.forEach((item) => {
    const isHoliday = isHolidayOrSunday(item);
    const displayTanggal = formatTanggalIndonesia(item.tanggal);
    const displayHari = item.hari || getNamaHari(item.tanggal);

    const row = worksheet.addRow({
      tanggal: displayTanggal,
      hari: displayHari,
      keteranganHari: item.keteranganHari || '',
      warnaStola: item.warnaStola || '',
      nastBacaan: item.nastBacaan || '',
      nastKhotbah: item.nastKhotbah || '',
    });

    row.height = item.keteranganHari && item.keteranganHari.includes('\n') ? 34 : 22;

    // Apply cell formatting
    row.eachCell((cell, colNumber) => {
      // Font: Red for holidays/Sundays (columns A, B, C, D, E, F as appropriate)
      const fontColor = isHoliday ? 'FFDC2626' : 'FF1E293B'; // Red or Dark Slate
      cell.font = {
        name: 'Calibri',
        size: 11,
        bold: isHoliday,
        color: { argb: fontColor },
      };

      // Alignment
      if (colNumber === 1 || colNumber === 2 || colNumber === 4) {
        cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
      } else {
        cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
      }

      // Background highlight for Holy days / Sundays
      if (isHoliday) {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFFF1F2' }, // Very light rose tint for readability
        };
      }

      // Borders
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      };
    });
  });

  // Generate buffer and download
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  const monthSuffix = options.filterBulan && options.filterBulan !== 'semua' ? `_${options.filterBulan}` : '';
  const yearSuffix = options.filterTahun && options.filterTahun !== 'semua' ? `_${options.filterTahun}` : '';
  a.href = url;
  a.download = `Almanak_Nast_GKE${monthSuffix}${yearSuffix}.xlsx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
};

/**
 * Buat File Template Excel (.xlsx) Resmi untuk Pengisian Data Nast
 */
export const downloadAlmanakExcelTemplate = async (): Promise<void> => {
  const sampleItems: AlmanakNastGKE[] = [
    {
      id: 'template-1',
      tanggal: '2026-04-01',
      hari: 'Rabu',
      keteranganHari: '',
      warnaStola: '',
      nastBacaan: 'Yohanes 13:21-30',
      nastKhotbah: '',
      isHariRaya: false,
    },
    {
      id: 'template-2',
      tanggal: '2026-04-02',
      hari: 'Kamis',
      keteranganHari: 'Kamis Putih',
      warnaStola: 'Putih',
      nastBacaan: 'Yohanes 13:1-20',
      nastKhotbah: '1 Korintus 11:23-26',
      isHariRaya: false,
    },
    {
      id: 'template-3',
      tanggal: '2026-04-03',
      hari: 'Jumat',
      keteranganHari: 'JUMAT AGUNG',
      warnaStola: 'Hitam',
      nastBacaan: 'Yesaya 52:13-53:12',
      nastKhotbah: 'Lukas 23:13-32',
      isHariRaya: true,
    },
    {
      id: 'template-4',
      tanggal: '2026-04-04',
      hari: 'Sabtu',
      keteranganHari: '',
      warnaStola: '',
      nastBacaan: 'Yohanes 19:38-42',
      nastKhotbah: '',
      isHariRaya: false,
    },
    {
      id: 'template-5',
      tanggal: '2026-04-05',
      hari: 'Minggu',
      keteranganHari: 'PASKAH I\nPERAYAAN HUT KE 187 GKE',
      warnaStola: 'Putih/Kuning',
      nastBacaan: 'Yesaya 25:6-12',
      nastKhotbah: 'Lukas 24:36-49',
      isHariRaya: true,
    },
    {
      id: 'template-6',
      tanggal: '2026-04-06',
      hari: 'Senin',
      keteranganHari: 'Paskah II',
      warnaStola: 'Putih',
      nastBacaan: 'Keluaran 14:10-31',
      nastKhotbah: 'Kolose 3:5-11',
      isHariRaya: true,
    },
    {
      id: 'template-7',
      tanggal: '2026-04-12',
      hari: 'Minggu',
      keteranganHari: '1 Ses. Paskah, Quasimodogeniti',
      warnaStola: 'Putih',
      nastBacaan: 'Mazmur 16:1-11',
      nastKhotbah: 'Yohanes 20:24-31',
      isHariRaya: true,
    },
  ];

  await exportAlmanakToExcel(sampleItems, { filterBulan: 'Template', filterTahun: 'Format' });
};

/**
 * Ekspor Data ke CSV (.csv)
 */
export const exportAlmanakToCsv = (items: AlmanakNastGKE[]): void => {
  const sorted = [...items].sort((a, b) => a.tanggal.localeCompare(b.tanggal));
  const rows = sorted.map((item) => ({
    Tanggal: formatTanggalIndonesia(item.tanggal),
    Hari: item.hari || getNamaHari(item.tanggal),
    'Keterangan Hari': item.keteranganHari || '',
    'Warna Stola': item.warnaStola || '',
    'Nast Bacaan': item.nastBacaan || '',
    'Nast Khotbah': item.nastKhotbah || '',
  }));

  const csvContent = Papa.unparse(rows);
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Almanak_Nast_GKE_${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

/**
 * Parse File Excel (.xlsx / .xls) yang Diunggah Pengguna
 */
export const parseAlmanakExcelFile = async (file: File): Promise<Omit<AlmanakNastGKE, 'id'>[]> => {
  const buffer = await file.arrayBuffer();
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);

  const worksheet = workbook.worksheets[0];
  if (!worksheet) {
    throw new Error('Lembar kerja (worksheet) Excel kosong atau tidak terbaca.');
  }

  const results: Omit<AlmanakNastGKE, 'id'>[] = [];
  let headerMap: { [colNumber: number]: string } = {};
  let headerRowIndex = 1;

  // Find header row
  worksheet.eachRow((row, rowNumber) => {
    if (Object.keys(headerMap).length > 0) return; // already found
    let foundCount = 0;
    row.eachCell((cell, colNumber) => {
      const val = String(cell.value || '').trim().toLowerCase();
      if (val.includes('tanggal') || val.includes('date')) {
        headerMap[colNumber] = 'tanggal';
        foundCount++;
      } else if (val.includes('hari') && !val.includes('keterangan')) {
        headerMap[colNumber] = 'hari';
        foundCount++;
      } else if (val.includes('keterangan') || val.includes('hari raya') || val.includes('perayaan')) {
        headerMap[colNumber] = 'keteranganHari';
        foundCount++;
      } else if (val.includes('stola') || val.includes('warna')) {
        headerMap[colNumber] = 'warnaStola';
        foundCount++;
      } else if (val.includes('bacaan') || val.includes('nast bacaan') || val.includes('nats bacaan')) {
        headerMap[colNumber] = 'nastBacaan';
        foundCount++;
      } else if (val.includes('khotbah') || val.includes('nast khotbah') || val.includes('nats khotbah')) {
        headerMap[colNumber] = 'nastKhotbah';
        foundCount++;
      }
    });

    if (foundCount >= 2) {
      headerRowIndex = rowNumber;
    } else {
      headerMap = {};
    }
  });

  // If no header row matched, fallback to positional matching (A=tanggal, B=hari, C=keterangan, D=stola, E=bacaan, F=khotbah)
  if (Object.keys(headerMap).length === 0) {
    headerMap = {
      1: 'tanggal',
      2: 'hari',
      3: 'keteranganHari',
      4: 'warnaStola',
      5: 'nastBacaan',
      6: 'nastKhotbah',
    };
    headerRowIndex = 1;
  }

  // Parse data rows
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber <= headerRowIndex) return;

    const rowData: any = {};
    row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      const key = headerMap[colNumber];
      if (key) {
        let cellVal = cell.value;
        // Check if cell is rich text
        if (cellVal && typeof cellVal === 'object') {
          if ('richText' in cellVal) {
            cellVal = (cellVal as any).richText.map((t: any) => t.text).join('');
          } else if ('text' in cellVal) {
            cellVal = (cellVal as any).text;
          } else if (cellVal instanceof Date) {
            cellVal = cellVal.toISOString().split('T')[0];
          }
        }
        rowData[key] = String(cellVal || '').trim();
      }
    });

    if (!rowData.tanggal && !rowData.nastBacaan) return;

    const isoTanggal = parseToIsoDate(rowData.tanggal);
    const calculatedHari = rowData.hari || getNamaHari(isoTanggal);
    const isHoliday = isHolidayOrSunday({
      tanggal: isoTanggal,
      hari: calculatedHari,
      keteranganHari: rowData.keteranganHari,
    });

    results.push({
      tanggal: isoTanggal || rowData.tanggal,
      hari: calculatedHari,
      keteranganHari: rowData.keteranganHari || '',
      warnaStola: rowData.warnaStola || '',
      nastBacaan: rowData.nastBacaan || '',
      nastKhotbah: rowData.nastKhotbah || '',
      isHariRaya: isHoliday,
    });
  });

  return results;
};

/**
 * Parse File CSV yang Diunggah Pengguna
 */
export const parseAlmanakCsvFile = async (file: File): Promise<Omit<AlmanakNastGKE, 'id'>[]> => {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          const rows = results.data as any[];
          const parsed: Omit<AlmanakNastGKE, 'id'>[] = [];

          rows.forEach((row) => {
            // Find fields by key aliases
            let rawTanggal = '';
            let rawHari = '';
            let rawKeterangan = '';
            let rawStola = '';
            let rawBacaan = '';
            let rawKhotbah = '';

            Object.entries(row).forEach(([k, v]) => {
              const keyLower = k.trim().toLowerCase();
              const strVal = String(v || '').trim();
              if (keyLower.includes('tanggal') || keyLower.includes('date')) rawTanggal = strVal;
              else if (keyLower.includes('hari') && !keyLower.includes('keterangan')) rawHari = strVal;
              else if (keyLower.includes('keterangan') || keyLower.includes('hari raya')) rawKeterangan = strVal;
              else if (keyLower.includes('stola') || keyLower.includes('warna')) rawStola = strVal;
              else if (keyLower.includes('bacaan')) rawBacaan = strVal;
              else if (keyLower.includes('khotbah')) rawKhotbah = strVal;
            });

            if (!rawTanggal && !rawBacaan) return;

            const isoTanggal = parseToIsoDate(rawTanggal);
            const calculatedHari = rawHari || getNamaHari(isoTanggal);
            const isHoliday = isHolidayOrSunday({
              tanggal: isoTanggal,
              hari: calculatedHari,
              keteranganHari: rawKeterangan,
            });

            parsed.push({
              tanggal: isoTanggal || rawTanggal,
              hari: calculatedHari,
              keteranganHari: rawKeterangan,
              warnaStola: rawStola,
              nastBacaan: rawBacaan,
              nastKhotbah: rawKhotbah,
              isHariRaya: isHoliday,
            });
          });

          resolve(parsed);
        } catch (err) {
          reject(err);
        }
      },
      error: (err) => reject(err),
    });
  });
};
