import ExcelJS from 'exceljs';
import Papa from 'papaparse';
import { PelayananSakramen } from '../types';

export interface ParsedSakramenRow {
  rowNumber: number;
  jenisPelayanan: 'baptis' | 'sidi' | 'nikah';
  noSuratResmi: string;
  tanggalPelayanan: string;
  tempatPelayanan: string;
  pelayanFirman: string;
  namaUtama: string;
  tempatTanggalLahir: string;
  alamatUtama: string;
  namaPasangan: string;
  tempatTanggalLahirPasangan: string;
  alamatPasangan: string;
  namaAyah: string;
  namaIbu: string;
  namaAyahPasangan: string;
  namaIbuPasangan: string;
  saksi1: string;
  saksi2: string;
  status: 'Permohonan' | 'Diproses / Katekisasi' | 'Disetujui & Diterbitkan';
  nasKhotbah: string;
  nasPeringatan: string;
  catatanPastoral: string;
  isValid: boolean;
  validationIssues: string[];
}

const MONTHS_ID = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

/**
 * Normalisasi format tanggal ke format YYYY-MM-DD
 */
export const normalizeDateToIso = (input: any): string => {
  if (!input) return '';
  if (input instanceof Date && !isNaN(input.getTime())) {
    const y = input.getFullYear();
    const m = String(input.getMonth() + 1).padStart(2, '0');
    const d = String(input.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  const str = String(input).trim();
  if (!str) return '';

  // Standard ISO
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    return str;
  }

  // DD/MM/YYYY or DD-MM-YYYY
  const dmyMatch = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (dmyMatch) {
    const d = dmyMatch[1].padStart(2, '0');
    const m = dmyMatch[2].padStart(2, '0');
    const y = dmyMatch[3];
    return `${y}-${m}-${d}`;
  }

  // DD MMMM YYYY (e.g. 19 Juni 2023)
  const idMatch = str.match(/^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})/);
  if (idMatch) {
    const d = idMatch[1].padStart(2, '0');
    const mName = idMatch[2].toLowerCase();
    const y = idMatch[3];
    const mIdx = MONTHS_ID.findIndex((m) => m.toLowerCase() === mName);
    if (mIdx !== -1) {
      return `${y}-${String(mIdx + 1).padStart(2, '0')}-${d}`;
    }
  }

  // If already free text like "Lamandau, 19 Juni 2023", return as is or extract date
  return str;
};

/**
 * Normalisasi Jenis Pelayanan
 */
export const normalizeJenisPelayanan = (raw: any): 'baptis' | 'sidi' | 'nikah' => {
  const val = String(raw || '').toLowerCase().trim();
  if (val.includes('nikah') || val.includes('kawin') || val.includes('pernikahan') || val.includes('mempelai')) {
    return 'nikah';
  }
  if (val.includes('sidi') || val.includes('katekisasi') || val.includes('pengakuan')) {
    return 'sidi';
  }
  return 'baptis';
};

/**
 * Format label jenis pelayanan untuk tampilan
 */
export const getLabelJenisPelayanan = (jenis: 'baptis' | 'sidi' | 'nikah'): string => {
  switch (jenis) {
    case 'baptis':
      return 'Baptisan Kudus';
    case 'sidi':
      return 'Peneguhan Sidi';
    case 'nikah':
      return 'Pernikahan Kudus';
  }
};

/**
 * Ekspor Data Pelayanan Sakramen ke file Excel (.xlsx) dengan formatting lengkap
 */
export const exportSakramenToExcel = async (
  items: PelayananSakramen[],
  settings?: any,
  filename?: string
) => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = settings?.namaAplikasi || 'Sistem Informasi Gereja GKE';
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet('Pelayanan Sakramen', {
    views: [{ showGridLines: true, state: 'frozen', ySplit: 5, xSplit: 0 }],
  });

  // 1. Header Institusi Gereja
  const namaGereja = (settings?.namaJemaat ? `JEMAAT GKE ${settings.namaJemaat}` : 'GEREJA KALIMANTAN EVANGELIS').toUpperCase();
  const namaResort = (settings?.resortGke ? `RESORT GKE ${settings.resortGke}` : '').toUpperCase();

  worksheet.mergeCells('A1:W1');
  const title1 = worksheet.getCell('A1');
  title1.value = `GEREJA KALIMANTAN EVANGELIS (GKE) - ${namaGereja}`;
  title1.font = { name: 'Arial', size: 13, bold: true, color: { argb: 'FFFFFFFF' } };
  title1.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF1E3A8A' }, // GKE Navy Blue
  };
  title1.alignment = { horizontal: 'center', vertical: 'middle' };
  worksheet.getRow(1).height = 32;

  worksheet.mergeCells('A2:W2');
  const title2 = worksheet.getCell('A2');
  title2.value = namaResort
    ? `${namaResort} • BUKU REKAPITULASI PELAYANAN SAKRAMEN RESMI (NIKAH, BAPTISAN KUDUS & PENEGUHAN SIDI)`
    : 'BUKU REKAPITULASI PELAYANAN SAKRAMEN RESMI (NIKAH, BAPTISAN KUDUS & PENEGUHAN SIDI)';
  title2.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
  title2.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF2563EB' }, // Royal Blue
  };
  title2.alignment = { horizontal: 'center', vertical: 'middle' };
  worksheet.getRow(2).height = 24;

  worksheet.mergeCells('A3:W3');
  const title3 = worksheet.getCell('A3');
  title3.value = `Data Diekspor pada: ${new Date().toLocaleDateString('id-ID', { dateStyle: 'full' })} | Total: ${items.length} Berkas Pelayanan | Format Resmi Majelis Jemaat GKE`;
  title3.font = { name: 'Arial', size: 9, italic: true, color: { argb: 'FF334155' } };
  title3.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFF1F5F9' },
  };
  title3.alignment = { horizontal: 'center', vertical: 'middle' };
  worksheet.getRow(3).height = 20;

  worksheet.addRow([]); // Blank spacer at row 4
  worksheet.getRow(4).height = 8;

  // 2. Definisi Kolom & Header Tabel (Baris 5)
  const columnDefs = [
    { key: 'no', header: 'No', width: 6 },
    { key: 'jenisPelayanan', header: 'Jenis Pelayanan', width: 20 },
    { key: 'noSuratResmi', header: 'Nomor Surat Resmi', width: 28 },
    { key: 'status', header: 'Status Pelayanan', width: 22 },
    { key: 'namaUtama', header: 'Nama Bersangkutan / Mempelai Pria', width: 32 },
    { key: 'tempatTanggalLahir', header: 'TTL Bersangkutan / Pria', width: 28 },
    { key: 'alamatUtama', header: 'Alamat Bersangkutan / Pria', width: 30 },
    { key: 'namaPasangan', header: 'Nama Pasangan / Mempelai Wanita', width: 32 },
    { key: 'tempatTanggalLahirPasangan', header: 'TTL Pasangan / Wanita', width: 28 },
    { key: 'alamatPasangan', header: 'Alamat Pasangan / Wanita', width: 30 },
    { key: 'namaAyah', header: 'Nama Ayah', width: 26 },
    { key: 'namaIbu', header: 'Nama Ibu', width: 26 },
    { key: 'namaAyahPasangan', header: 'Nama Ayah Pasangan', width: 26 },
    { key: 'namaIbuPasangan', header: 'Nama Ibu Pasangan', width: 26 },
    { key: 'pelayanFirman', header: 'Pelayan Firman (Pendeta/Vikaris)', width: 30 },
    { key: 'tanggalPelayanan', header: 'Tanggal Pelayanan', width: 20 },
    { key: 'tempatPelayanan', header: 'Tempat / Gedung Ibadah', width: 30 },
    { key: 'saksi1', header: 'Saksi 1', width: 24 },
    { key: 'saksi2', header: 'Saksi 2', width: 24 },
    { key: 'nasKhotbah', header: 'Nas Khotbah', width: 26 },
    { key: 'nasPeringatan', header: 'Nas Peringatan', width: 26 },
    { key: 'tersimpanKeAgendaSurat', header: 'Arsip Surat Keluar', width: 20 },
    { key: 'catatanPastoral', header: 'Catatan Pastoral', width: 32 },
  ];

  // Atur lebar tiap kolom
  columnDefs.forEach((col, idx) => {
    worksheet.getColumn(idx + 1).width = col.width;
  });

  // Tuliskan JUDUL TABEL di Baris 5 dengan teks kontras tinggi (Putih Tebal di atas Slate Gelap)
  const headerRow = worksheet.getRow(5);
  headerRow.height = 34;
  columnDefs.forEach((col, idx) => {
    const colNumber = idx + 1;
    const cell = headerRow.getCell(colNumber);
    cell.value = col.header;
    cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1E293B' }, // Slate 800 - kontras tinggi dengan teks putih
    };
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FF475569' } },
      left: { style: 'thin', color: { argb: 'FF475569' } },
      bottom: { style: 'medium', color: { argb: 'FF0F172A' } },
      right: { style: 'thin', color: { argb: 'FF475569' } },
    };
  });

  // Pasang autoFilter pada judul tabel
  worksheet.autoFilter = 'A5:W5';

  // 3. Masukkan Data Baris (Mulai Baris 6)
  items.forEach((item, index) => {
    const rowValues = [
      index + 1,
      getLabelJenisPelayanan(item.jenisPelayanan),
      item.noSuratResmi || '-',
      item.status || 'Disetujui & Diterbitkan',
      item.namaUtama || '-',
      item.tempatTanggalLahir || '-',
      item.alamatUtama || '-',
      item.namaPasangan || '-',
      item.tempatTanggalLahirPasangan || '-',
      item.alamatPasangan || '-',
      item.namaAyah || '-',
      item.namaIbu || '-',
      item.namaAyahPasangan || '-',
      item.namaIbuPasangan || '-',
      item.pelayanFirman || '-',
      item.tanggalPelayanan || '-',
      item.tempatPelayanan || '-',
      item.saksi1 || '-',
      item.saksi2 || '-',
      item.nasKhotbah || '-',
      item.nasPeringatan || '-',
      item.tersimpanKeAgendaSurat ? 'Terarsip' : 'Belum',
      item.catatanPastoral || '-',
    ];

    const row = worksheet.addRow(rowValues);
    row.height = 24;
    const isEven = index % 2 === 0;

    row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      cell.font = { name: 'Arial', size: 9.5, color: { argb: 'FF0F172A' } };
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

      // Alignment berdasarkan tipe data kolom
      // Kolom 1 (No), 2 (Jenis), 4 (Status), 16 (Tgl Pelayanan), 22 (Arsip) berada di tengah
      if (colNumber === 1 || colNumber === 2 || colNumber === 4 || colNumber === 16 || colNumber === 22) {
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
      } else {
        cell.alignment = { vertical: 'middle', horizontal: 'left' };
      }

      // Format visual warna khusus pada kolom Jenis Pelayanan
      if (colNumber === 2) {
        cell.font = { name: 'Arial', size: 9.5, bold: true, color: { argb: 'FF0F172A' } };
        if (item.jenisPelayanan === 'nikah') {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF1F2' } }; // Rose 50
        } else if (item.jenisPelayanan === 'baptis') {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0F9FF' } }; // Sky 50
        } else if (item.jenisPelayanan === 'sidi') {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEEF2FF' } }; // Indigo 50
        }
      }
    });
  });

  // Download File Excel
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const safeDate = new Date().toISOString().split('T')[0];
  link.download = filename || `Data_Pelayanan_Sakramen_GKE_${safeDate}.xlsx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Ekspor Data Pelayanan Sakramen ke file CSV (.csv) dengan BOM UTF-8
 */
export const exportSakramenToCsv = (
  items: PelayananSakramen[],
  settings?: any,
  filename?: string
) => {
  const dataRows = items.map((item, idx) => ({
    No: idx + 1,
    'Jenis Pelayanan': getLabelJenisPelayanan(item.jenisPelayanan),
    'Nomor Surat Resmi': item.noSuratResmi || '',
    'Status Pelayanan': item.status || 'Disetujui & Diterbitkan',
    'Nama Bersangkutan / Mempelai Pria': item.namaUtama || '',
    'TTL Bersangkutan / Pria': item.tempatTanggalLahir || '',
    'Alamat Bersangkutan / Pria': item.alamatUtama || '',
    'Nama Pasangan / Mempelai Wanita': item.namaPasangan || '',
    'TTL Pasangan / Wanita': item.tempatTanggalLahirPasangan || '',
    'Alamat Pasangan / Wanita': item.alamatPasangan || '',
    'Nama Ayah': item.namaAyah || '',
    'Nama Ibu': item.namaIbu || '',
    'Nama Ayah Pasangan': item.namaAyahPasangan || '',
    'Nama Ibu Pasangan': item.namaIbuPasangan || '',
    'Pelayan Firman': item.pelayanFirman || '',
    'Tanggal Pelayanan': item.tanggalPelayanan || '',
    'Tempat / Gedung Pelayanan': item.tempatPelayanan || '',
    'Saksi 1': item.saksi1 || '',
    'Saksi 2': item.saksi2 || '',
    'Nas Khotbah': item.nasKhotbah || '',
    'Nas Peringatan': item.nasPeringatan || '',
    'Terarsip ke Agenda Surat': item.tersimpanKeAgendaSurat ? 'Ya' : 'Belum',
    'Catatan Pastoral': item.catatanPastoral || '',
  }));

  const csvString = Papa.unparse(dataRows);
  const blob = new Blob(['\uFEFF' + csvString], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const safeDate = new Date().toISOString().split('T')[0];
  link.download = filename || `Data_Pelayanan_Sakramen_GKE_${safeDate}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Unduh Format Template Excel untuk Pengisian Data Impor Sakramen
 */
export const downloadSakramenTemplateExcel = async () => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Template Impor Sakramen');

  worksheet.columns = [
    { header: 'Jenis Pelayanan (*baptis/sidi/nikah)', key: 'jenisPelayanan', width: 30 },
    { header: 'Nomor Surat Resmi (Boleh Kosong/Auto)', key: 'noSuratResmi', width: 32 },
    { header: 'Nama Bersangkutan / Mempelai Pria (*Wajib)', key: 'namaUtama', width: 35 },
    { header: 'TTL Bersangkutan (cth: Palangka Raya, 10 Mei 1995)', key: 'tempatTanggalLahir', width: 38 },
    { header: 'Alamat Bersangkutan', key: 'alamatUtama', width: 30 },
    { header: 'Nama Pasangan / Mempelai Wanita (Khusus Nikah)', key: 'namaPasangan', width: 35 },
    { header: 'TTL Pasangan (Khusus Nikah)', key: 'tempatTanggalLahirPasangan', width: 32 },
    { header: 'Alamat Pasangan (Khusus Nikah)', key: 'alamatPasangan', width: 30 },
    { header: 'Nama Ayah', key: 'namaAyah', width: 25 },
    { header: 'Nama Ibu', key: 'namaIbu', width: 25 },
    { header: 'Nama Ayah Pasangan', key: 'namaAyahPasangan', width: 25 },
    { header: 'Nama Ibu Pasangan', key: 'namaIbuPasangan', width: 25 },
    { header: 'Pelayan Firman / Pendeta (*Wajib)', key: 'pelayanFirman', width: 30 },
    { header: 'Tanggal Pelayanan (*YYYY-MM-DD)', key: 'tanggalPelayanan', width: 25 },
    { header: 'Tempat / Gedung Ibadah (*Wajib)', key: 'tempatPelayanan', width: 30 },
    { header: 'Saksi 1', key: 'saksi1', width: 22 },
    { header: 'Saksi 2', key: 'saksi2', width: 22 },
    { header: 'Status Pelayanan (Permohonan/Diproses / Katekisasi/Disetujui & Diterbitkan)', key: 'status', width: 45 },
    { header: 'Nas Khotbah', key: 'nasKhotbah', width: 25 },
    { header: 'Nas Peringatan', key: 'nasPeringatan', width: 25 },
    { header: 'Catatan Pastoral', key: 'catatanPastoral', width: 30 },
  ];

  const headerRow = worksheet.getRow(1);
  headerRow.height = 32;
  headerRow.font = { name: 'Arial', bold: true, color: { argb: 'FFFFFFFF' }, size: 10 };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF0F766E' }, // Teal 700
  };
  headerRow.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };

  // Sample row 1: Baptisan Kudus
  worksheet.addRow({
    jenisPelayanan: 'baptis',
    noSuratResmi: '01/BAPTIS/J-GKE-GUCI/VI/2026',
    namaUtama: 'TIMOTHY CHRISTIAN',
    tempatTanggalLahir: 'Palangka Raya, 12 Januari 2024',
    alamatUtama: 'Jl. Ahmad Yani No. 12, Guci',
    namaPasangan: '',
    tempatTanggalLahirPasangan: '',
    alamatPasangan: '',
    namaAyah: 'YOHANES',
    namaIbu: 'MARIA',
    namaAyahPasangan: '',
    namaIbuPasangan: '',
    pelayanFirman: 'Pdt. Andreas, M.Th',
    tanggalPelayanan: '2026-06-14',
    tempatPelayanan: 'Gedung Gereja GKE Guci',
    saksi1: 'Markus',
    saksi2: 'Lukas',
    status: 'Disetujui & Diterbitkan',
    nasKhotbah: 'Matius 28:19',
    nasPeringatan: 'Kisah Para Rasul 2:38',
    catatanPastoral: 'Baptisan Anak Kudus',
  });

  // Sample row 2: Peneguhan Sidi
  worksheet.addRow({
    jenisPelayanan: 'sidi',
    noSuratResmi: '02/SIDI/J-GKE-GUCI/VI/2026',
    namaUtama: 'GRACELLA NATALIA',
    tempatTanggalLahir: 'Katingan, 25 Desember 2008',
    alamatUtama: 'Jl. Merdeka No. 45',
    namaPasangan: '',
    tempatTanggalLahirPasangan: '',
    alamatPasangan: '',
    namaAyah: 'DANIEL',
    namaIbu: 'SARAH',
    namaAyahPasangan: '',
    namaIbuPasangan: '',
    pelayanFirman: 'Pdt. Andreas, M.Th',
    tanggalPelayanan: '2026-06-21',
    tempatPelayanan: 'Gedung Gereja GKE Guci',
    saksi1: 'Seksi Pemuda GKE',
    saksi2: 'Orang Tua',
    status: 'Disetujui & Diterbitkan',
    nasKhotbah: 'Yosua 24:15',
    nasPeringatan: 'Mazmur 119:105',
    catatanPastoral: 'Telah menyelesaikan masa katekisasi',
  });

  // Sample row 3: Pernikahan Kudus
  worksheet.addRow({
    jenisPelayanan: 'nikah',
    noSuratResmi: '03/NIKAH/J-GKE-GUCI/VI/2026',
    namaUtama: 'DAVID ALEXANDER',
    tempatTanggalLahir: 'Banjarmasin, 15 Agustus 1996',
    alamatUtama: 'Jl. Pangeran Samudra No. 7',
    namaPasangan: 'ESTHER ANGELINA',
    tempatTanggalLahirPasangan: 'Palangka Raya, 02 Mei 1998',
    alamatPasangan: 'Jl. G. Obos No. 23',
    namaAyah: 'SAMUEL',
    namaIbu: 'HANNAH',
    namaAyahPasangan: 'PAULUS',
    namaIbuPasangan: 'RUTH',
    pelayanFirman: 'Pdt. Andreas, M.Th',
    tanggalPelayanan: '2026-06-27',
    tempatPelayanan: 'Gedung Gereja GKE Guci',
    saksi1: 'Bapak Simon',
    saksi2: 'Bapak Filipus',
    status: 'Disetujui & Diterbitkan',
    nasKhotbah: 'Pengkhotbah 4:12',
    nasPeringatan: '1 Korintus 13:4-7',
    catatanPastoral: 'Pemberkatan Nikah Kudus',
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'Template_Impor_Pelayanan_Sakramen_GKE.xlsx';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Unduh Format Template CSV untuk Pengisian Data Impor Sakramen
 */
export const downloadSakramenTemplateCsv = () => {
  const sampleData = [
    {
      'Jenis Pelayanan (*baptis/sidi/nikah)': 'baptis',
      'Nomor Surat Resmi (Boleh Kosong/Auto)': '01/BAPTIS/J-GKE-GUCI/VI/2026',
      'Nama Bersangkutan / Mempelai Pria (*Wajib)': 'TIMOTHY CHRISTIAN',
      'TTL Bersangkutan': 'Palangka Raya, 12 Januari 2024',
      'Alamat Bersangkutan': 'Jl. Ahmad Yani No. 12',
      'Nama Pasangan / Mempelai Wanita': '',
      'TTL Pasangan': '',
      'Alamat Pasangan': '',
      'Nama Ayah': 'YOHANES',
      'Nama Ibu': 'MARIA',
      'Nama Ayah Pasangan': '',
      'Nama Ibu Pasangan': '',
      'Pelayan Firman / Pendeta (*Wajib)': 'Pdt. Andreas, M.Th',
      'Tanggal Pelayanan (*YYYY-MM-DD)': '2026-06-14',
      'Tempat / Gedung Ibadah (*Wajib)': 'Gedung Gereja GKE Guci',
      'Saksi 1': 'Markus',
      'Saksi 2': 'Lukas',
      'Status Pelayanan': 'Disetujui & Diterbitkan',
      'Nas Khotbah': 'Matius 28:19',
      'Nas Peringatan': 'Kisah Para Rasul 2:38',
      'Catatan Pastoral': 'Baptisan Anak Kudus',
    },
    {
      'Jenis Pelayanan (*baptis/sidi/nikah)': 'nikah',
      'Nomor Surat Resmi (Boleh Kosong/Auto)': '02/NIKAH/J-GKE-GUCI/VI/2026',
      'Nama Bersangkutan / Mempelai Pria (*Wajib)': 'DAVID ALEXANDER',
      'TTL Bersangkutan': 'Banjarmasin, 15 Agustus 1996',
      'Alamat Bersangkutan': 'Jl. Pangeran Samudra No. 7',
      'Nama Pasangan / Mempelai Wanita': 'ESTHER ANGELINA',
      'TTL Pasangan': 'Palangka Raya, 02 Mei 1998',
      'Alamat Pasangan': 'Jl. G. Obos No. 23',
      'Nama Ayah': 'SAMUEL',
      'Nama Ibu': 'HANNAH',
      'Nama Ayah Pasangan': 'PAULUS',
      'Nama Ibu Pasangan': 'RUTH',
      'Pelayan Firman / Pendeta (*Wajib)': 'Pdt. Andreas, M.Th',
      'Tanggal Pelayanan (*YYYY-MM-DD)': '2026-06-27',
      'Tempat / Gedung Ibadah (*Wajib)': 'Gedung Gereja GKE Guci',
      'Saksi 1': 'Simon',
      'Saksi 2': 'Filipus',
      'Status Pelayanan': 'Disetujui & Diterbitkan',
      'Nas Khotbah': 'Pengkhotbah 4:12',
      'Nas Peringatan': '1 Korintus 13:4-7',
      'Catatan Pastoral': 'Pemberkatan Nikah Kudus',
    },
  ];

  const csv = Papa.unparse(sampleData);
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'Template_Impor_Pelayanan_Sakramen_GKE.csv';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Parsing file Excel / CSV yang diupload oleh pengguna
 */
export const parseSakramenFile = async (
  file: File
): Promise<{ items: ParsedSakramenRow[]; errors: string[] }> => {
  const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');
  const isCsv = file.name.endsWith('.csv');

  if (!isExcel && !isCsv) {
    return {
      items: [],
      errors: ['Format file tidak didukung. Harap unggah file dengan format .xlsx, .xls, atau .csv.'],
    };
  }

  const rawRows: Record<string, any>[] = [];
  const errors: string[] = [];

  if (isExcel) {
    try {
      const buffer = await file.arrayBuffer();
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer);

      const worksheet = workbook.worksheets[0];
      if (!worksheet) {
        return { items: [], errors: ['File Excel tidak memiliki lembar kerja (worksheet).'] };
      }

      // Cari baris header (biasanya baris 1 atau baris pertama yang berisi teks nama/pelayanan)
      let headerRowIndex = 1;
      for (let r = 1; r <= Math.min(10, worksheet.rowCount); r++) {
        const row = worksheet.getRow(r);
        const rowValues = (row.values as any[]) || [];
        const textJoined = rowValues.map((v) => String(v || '').toLowerCase()).join(' ');
        if (textJoined.includes('nama') || textJoined.includes('jenis') || textJoined.includes('pelayanan') || textJoined.includes('surat')) {
          headerRowIndex = r;
          break;
        }
      }

      const headerRow = worksheet.getRow(headerRowIndex);
      const headersMap: { [colIndex: number]: string } = {};

      headerRow.eachCell({ includeEmpty: false }, (cell, colNumber) => {
        headersMap[colNumber] = String(cell.value || '').trim();
      });

      for (let r = headerRowIndex + 1; r <= worksheet.rowCount; r++) {
        const row = worksheet.getRow(r);
        const rowObj: Record<string, any> = {};
        let hasValue = false;

        row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
          const headerName = headersMap[colNumber];
          if (headerName) {
            let val = cell.value;
            // Handle Excel date objects or formula values
            if (val && typeof val === 'object') {
              if (val instanceof Date) {
                val = normalizeDateToIso(val);
              } else if ('result' in (val as any)) {
                val = (val as any).result;
              } else if ('text' in (val as any)) {
                val = (val as any).text;
              }
            }
            rowObj[headerName] = val;
            if (val !== null && val !== undefined && String(val).trim() !== '') {
              hasValue = true;
            }
          }
        });

        if (hasValue) {
          rawRows.push(rowObj);
        }
      }
    } catch (err: any) {
      return {
        items: [],
        errors: [`Gagal membaca file Excel: ${err?.message || 'Format tidak valid'}`],
      };
    }
  } else {
    // CSV parsing
    try {
      const text = await file.text();
      const parsed = Papa.parse<Record<string, any>>(text, {
        header: true,
        skipEmptyLines: 'greedy',
      });
      if (parsed.errors && parsed.errors.length > 0) {
        parsed.errors.slice(0, 3).forEach((e) => errors.push(`Baris ${e.row}: ${e.message}`));
      }
      rawRows.push(...(parsed.data || []));
    } catch (err: any) {
      return {
        items: [],
        errors: [`Gagal membaca file CSV: ${err?.message || 'Format tidak valid'}`],
      };
    }
  }

  // Map header keys flexibly (fuzzy header matcher)
  const parsedItems: ParsedSakramenRow[] = [];

  rawRows.forEach((row, idx) => {
    const keys = Object.keys(row);
    const getVal = (patterns: string[]): string => {
      for (const p of patterns) {
        const foundKey = keys.find((k) => k.toLowerCase().includes(p.toLowerCase()));
        if (foundKey && row[foundKey] !== undefined && row[foundKey] !== null) {
          return String(row[foundKey]).trim();
        }
      }
      return '';
    };

    const jenisRaw = getVal(['jenis', 'sakramen', 'kategori', 'tipe']);
    const jenisPelayanan = normalizeJenisPelayanan(jenisRaw);

    const namaUtama = getVal(['nama bersangkutan', 'nama utama', 'mempelai pria', 'pengantin pria', 'nama pria', 'nama']);
    const namaPasangan = getVal(['nama pasangan', 'mempelai wanita', 'pengantin wanita', 'nama wanita', 'pasangan', 'istri', 'suami']);
    const noSuratResmi = getVal(['nomor surat', 'no surat', 'no. surat', 'no_surat', 'nosurat', 'nomor resm']);
    const tanggalPelayananRaw = getVal(['tanggal pelayanan', 'tgl pelayanan', 'tgl ibadah', 'tanggal ibadah', 'tanggal', 'tgl']);
    const tanggalPelayanan = normalizeDateToIso(tanggalPelayananRaw) || new Date().toISOString().split('T')[0];

    const tempatPelayanan = getVal(['tempat', 'gedung', 'lokasi', 'gereja']) || 'Gedung Gereja GKE';
    const pelayanFirman = getVal(['pelayan', 'pendeta', 'pengkhotbah', 'firman']) || 'Pendeta Jemaat GKE';

    const tempatTanggalLahir = getVal(['ttl bersangkutan', 'ttl pria', 'tempat tanggal lahir', 'ttl']);
    const tempatTanggalLahirPasangan = getVal(['ttl pasangan', 'ttl wanita']);
    const alamatUtama = getVal(['alamat bersangkutan', 'alamat pria', 'alamat utama', 'alamat']);
    const alamatPasangan = getVal(['alamat pasangan', 'alamat wanita']);

    const namaAyah = getVal(['nama ayah', 'ayah']);
    const namaIbu = getVal(['nama ibu', 'ibu']);
    const namaAyahPasangan = getVal(['nama ayah pasangan', 'ayah pasangan', 'ayah wanita']);
    const namaIbuPasangan = getVal(['nama ibu pasangan', 'ibu pasangan', 'ibu wanita']);

    const saksi1 = getVal(['saksi 1', 'saksi1']);
    const saksi2 = getVal(['saksi 2', 'saksi2']);

    const statusRaw = getVal(['status']) || 'Disetujui & Diterbitkan';
    let status: 'Permohonan' | 'Diproses / Katekisasi' | 'Disetujui & Diterbitkan' = 'Disetujui & Diterbitkan';
    if (statusRaw.toLowerCase().includes('mohon') || statusRaw.toLowerCase().includes('daftar')) {
      status = 'Permohonan';
    } else if (statusRaw.toLowerCase().includes('proses') || statusRaw.toLowerCase().includes('katekisasi')) {
      status = 'Diproses / Katekisasi';
    }

    const nasKhotbah = getVal(['nas khotbah', 'nats khotbah', 'khotbah']);
    const nasPeringatan = getVal(['nas peringatan', 'nats peringatan', 'peringatan']);
    const catatanPastoral = getVal(['catatan', 'keterangan', 'pastoral']);

    // Validasi Baris
    const issues: string[] = [];
    if (!namaUtama) {
      issues.push('Nama bersangkutan / mempelai wajib diisi.');
    }
    if (jenisPelayanan === 'nikah' && !namaPasangan) {
      issues.push('Untuk Pernikahan Kudus, nama pasangan / mempelai wanita wajib diisi.');
    }

    parsedItems.push({
      rowNumber: idx + 1,
      jenisPelayanan,
      noSuratResmi,
      tanggalPelayanan,
      tempatPelayanan,
      pelayanFirman,
      namaUtama,
      tempatTanggalLahir,
      alamatUtama,
      namaPasangan,
      tempatTanggalLahirPasangan,
      alamatPasangan,
      namaAyah,
      namaIbu,
      namaAyahPasangan,
      namaIbuPasangan,
      saksi1,
      saksi2,
      status,
      nasKhotbah,
      nasPeringatan,
      catatanPastoral,
      isValid: issues.length === 0,
      validationIssues: issues,
    });
  });

  return { items: parsedItems, errors };
};
