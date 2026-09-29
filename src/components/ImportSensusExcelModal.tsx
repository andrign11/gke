import React, { useState, useRef } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  FileText,
  GitFork,
  HelpCircle,
  Info,
  Loader2,
  RefreshCw,
  Search,
  Upload,
  UploadCloud,
  Users,
  Trash2,
  X,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { WargaJemaat } from '../types';
import { DeleteKeluargaModal } from './DeleteKeluargaModal';
import {
  generateSensusExcelTemplate,
  parseSensusExcelFile,
  ParsedSensusRow,
  SensusImportSummary,
} from '../utils/sensusExcelUtils';

interface ImportSensusExcelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const ImportSensusExcelModal: React.FC<ImportSensusExcelModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const {
    wargaJemaatList,
    lingkunganList,
    addWargaJemaat,
    updateWargaJemaat,
    addAuditLog,
    currentUser,
  } = useApp();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [parsedRows, setParsedRows] = useState<ParsedSensusRow[]>([]);
  const [importSummary, setImportSummary] = useState<SensusImportSummary | null>(null);
  const [activeTab, setActiveTab] = useState<'table' | 'families'>('table');
  const [filterMode, setFilterMode] = useState<'all' | 'valid' | 'issues'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [overwriteExisting, setOverwriteExisting] = useState(true);

  // Import Execution States
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importStepLabel, setImportStepLabel] = useState('');
  const [importResult, setImportResult] = useState<{
    success: boolean;
    insertedCount: number;
    updatedCount: number;
    skippedCount: number;
    errorCount: number;
    message: string;
  } | null>(null);

  if (!isOpen) return null;

  const availableLingkungans =
    lingkunganList && lingkunganList.length > 0
      ? lingkunganList.filter((l) => l.status === 'Aktif').map((l) => l.nama)
      : [
          'Lingkungan I - Ebenezer',
          'Lingkungan II - Yerusalem',
          'Lingkungan III - Bethel',
          'Lingkungan IV - Sion',
          'Lingkungan V - Filadelfia',
        ];

  const handleDownloadTemplate = async () => {
    try {
      const blob = await generateSensusExcelTemplate(availableLingkungans);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Template_Sensus_Data_Keluarga_Jemaat_GKE.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download template error:', err);
    }
  };

  const handleFileChange = async (file: File) => {
    setSelectedFile(file);
    setIsParsing(true);
    setImportResult(null);

    try {
      const result = await parseSensusExcelFile(file, wargaJemaatList, availableLingkungans);
      setParsedRows(result.rows);
      setImportSummary(result.summary);
    } catch (err: any) {
      console.error('Error parsing excel:', err);
      setImportResult({
        success: false,
        insertedCount: 0,
        updatedCount: 0,
        skippedCount: 0,
        errorCount: 1,
        message: err?.message || 'Gagal membaca format file Excel. Pastikan file tidak rusak.',
      });
    } finally {
      setIsParsing(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (
        file.name.endsWith('.xlsx') ||
        file.name.endsWith('.xls') ||
        file.name.endsWith('.csv')
      ) {
        handleFileChange(file);
      }
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleReset = () => {
    setSelectedFile(null);
    setParsedRows([]);
    setImportSummary(null);
    setImportResult(null);
    setImportProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Grouping rows by KKJ
  const familyGroups = parsedRows.reduce((acc, row) => {
    const kjj = row.noKjj || 'KJJ-TANPA-NOMOR';
    if (!acc[kjj]) {
      acc[kjj] = [];
    }
    acc[kjj].push(row);
    return acc;
  }, {} as Record<string, ParsedSensusRow[]>);

  // Execute Import
  const handleExecuteImport = async () => {
    if (parsedRows.length === 0 || isImporting) return;

    // Filter rows that have at least a non-empty name
    const validRows = parsedRows.filter((r) => r.namaLengkap && r.namaLengkap.trim() !== '' && r.namaLengkap !== 'Tanpa Nama');
    if (validRows.length === 0) {
      setImportResult({
        success: false,
        insertedCount: 0,
        updatedCount: 0,
        skippedCount: 0,
        errorCount: parsedRows.length,
        message: 'Tidak ada baris nama jemaat yang dapat diimport. Pastikan kolom "Nama Lengkap" sudah terisi pada file spreadsheet.',
      });
      return;
    }

    setIsImporting(true);
    setImportProgress(5);
    setImportStepLabel('Mempersiapkan sinkronisasi data sensus keluarga ke Cloud Firestore...');

    let inserted = 0;
    let updated = 0;
    let skipped = 0;
    let errors = 0;

    const total = validRows.length;

    try {
      for (let i = 0; i < total; i++) {
        const row = validRows[i];
        const progressPct = Math.round(((i + 1) / total) * 90);
        setImportProgress(progressPct);
        setImportStepLabel(`Menyimpan baris ${i + 1} dari ${total}: ${row.namaLengkap}...`);

        // Check if existing record exists in database (by NIK or matching Name + KJJ)
        const existingRecord = wargaJemaatList.find((w) => {
          if (row.nik && w.nik && row.nik.trim() === w.nik.trim()) return true;
          if (
            row.namaLengkap &&
            w.namaLengkap &&
            row.namaLengkap.trim().toLowerCase() === w.namaLengkap.trim().toLowerCase() &&
            row.noKjj &&
            w.noKjj &&
            row.noKjj.trim().toLowerCase() === w.noKjj.trim().toLowerCase()
          ) {
            return true;
          }
          return false;
        });

        const wargaData: Omit<WargaJemaat, 'id'> = {
          noKjj: row.noKjj || `KJJ-GKE-${String(i + 1).padStart(4, '0')}`,
          namaLengkap: row.namaLengkap.trim(),
          nik: row.nik ? row.nik.trim() : '',
          jenisKelamin: row.jenisKelamin || 'L',
          tempatLahir: row.tempatLahir || 'Palangka Raya',
          tanggalLahir: row.tanggalLahir || '1990-01-01',
          rayon: row.rayon || availableLingkungans[0] || 'Lingkungan I - Ebenezer',
          hubunganKeluarga: row.hubunganKeluarga || 'Kepala Keluarga',
          statusKeanggotaan: row.statusKeanggotaan || 'Tetap',
          statusBaptis: typeof row.statusBaptis === 'boolean' ? row.statusBaptis : true,
          statusSidi: typeof row.statusSidi === 'boolean' ? row.statusSidi : false,
          statusNikah: row.statusNikah || 'Belum Menikah',
          pekerjaan: row.pekerjaan || 'Wiraswasta / Lainnya',
          alamat: row.alamat || '',
          noHp: row.noHp || '',
        };

        try {
          if (existingRecord) {
            if (overwriteExisting) {
              await updateWargaJemaat(existingRecord.id, wargaData);
              updated++;
            } else {
              skipped++;
            }
          } else {
            await addWargaJemaat(wargaData);
            inserted++;
          }
        } catch (rowErr) {
          console.error(`Error saving row ${i + 1} (${row.namaLengkap}):`, rowErr);
          errors++;
        }

        // Small delay to prevent UI lockup
        if (i % 8 === 0) {
          await new Promise((r) => setTimeout(r, 20));
        }
      }

      setImportProgress(100);
      setImportStepLabel('Menyelesaikan pencatatan audit log...');

      try {
        await addAuditLog({
          kategori: 'SENSUS',
          aktivitas: 'Import Sensus Data Keluarga (Excel)',
          detail: `Import data sensus keluarga berhasil: ${inserted} warga baru ditambahkan, ${updated} diperbarui, ${skipped} dilewati (Total file: ${total} jiwa).`,
          modulTerkait: 'Sensus Data Keluarga',
        });
      } catch (logErr) {
        console.warn('Audit log write skipped:', logErr);
      }

      setImportResult({
        success: true,
        insertedCount: inserted,
        updatedCount: updated,
        skippedCount: skipped,
        errorCount: errors,
        message: `Import sensus keluarga selesai! Berhasil menyimpan ${inserted} data warga baru dan memperbarui ${updated} data ke Cloud Firestore.`,
      });

      onSuccess?.();
    } catch (err: any) {
      console.error('Import execution fatal error:', err);
      setImportResult({
        success: false,
        insertedCount: inserted,
        updatedCount: updated,
        skippedCount: skipped,
        errorCount: errors + 1,
        message: err?.message || 'Terjadi kendala saat menyimpan data ke database server. Pastikan koneksi internet aktif.',
      });
    } finally {
      setIsImporting(false);
    }
  };

  const filteredPreviewRows = parsedRows.filter((r) => {
    if (filterMode === 'valid' && !r.isValid) return false;
    if (filterMode === 'issues' && r.isValid) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchName = r.namaLengkap.toLowerCase().includes(q);
      const matchKjj = r.noKjj.toLowerCase().includes(q);
      const matchNik = (r.nik || '').includes(q);
      const matchRayon = r.rayon.toLowerCase().includes(q);
      return matchName || matchKjj || matchNik || matchRayon;
    }
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-slate-100">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-white text-base flex items-center gap-2">
                <span>Import Sensus Data Keluarga Jemaat</span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded-full border border-emerald-500/30 font-mono">
                  Excel / CSV
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Unggah spreadsheet data warga jemaat &amp; KJJ untuk diintegrasikan otomatis ke Cloud Firestore.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadTemplate}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200 transition cursor-pointer"
              title="Unduh template Excel resmi untuk pengisian data sensus"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>Unduh Template (.xlsx)</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          {/* Step 1: Upload Drag & Drop Box (If No File Selected) */}
          {!selectedFile ? (
            <div className="space-y-4">
              {/* Optional: Clear Old Data Banner */}
              {wargaJemaatList.length > 0 && (
                <div className="bg-rose-950/30 p-3.5 rounded-xl border border-rose-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs text-rose-200">
                  <div className="flex items-center gap-2">
                    <Trash2 className="w-4 h-4 text-rose-400 shrink-0" />
                    <div>
                      <p className="font-semibold text-rose-200">
                        Ingin mengosongkan data lama sebelum import file baru?
                      </p>
                      <p className="text-[11px] text-rose-300/80">
                        Saat ini database memuat <strong>{wargaJemaatList.length} jiwa</strong>. Anda dapat mengosongkannya agar data baru tidak tumpang tindih.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsDeleteModalOpen(true)}
                    className="px-3.5 py-1.5 rounded-lg bg-rose-900/70 hover:bg-rose-800 text-rose-100 border border-rose-700/60 font-medium text-xs transition-colors shrink-0 flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-300" />
                    <span>Hapus Data Lama</span>
                  </button>
                </div>
              )}

              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-indigo-500/40 hover:border-indigo-400 bg-slate-950/60 hover:bg-slate-950/80 rounded-2xl p-8 sm:p-12 text-center flex flex-col items-center justify-center gap-3 transition-all cursor-pointer group"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      handleFileChange(e.target.files[0]);
                    }
                  }}
                />

                <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 group-hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center transition-all group-hover:scale-110">
                  <UploadCloud className="w-8 h-8" />
                </div>

                <div className="space-y-1">
                  <p className="font-bold text-sm text-slate-200">
                    Klik atau Seret file Excel (.xlsx, .xls) / CSV ke sini
                  </p>
                  <p className="text-xs text-slate-400 max-w-md mx-auto">
                    Sistem akan memvalidasi No. KJJ, nama, NIK, tanggal lahir, lingkungan, hubungan keluarga, serta status baptis &amp; sidi.
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-2 pt-2 text-[11px] text-slate-400">
                  <span className="bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700 font-mono">.xlsx</span>
                  <span className="bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700 font-mono">.xls</span>
                  <span className="bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700 font-mono">.csv</span>
                </div>
              </div>

              {/* Quick Guidance Box */}
              <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800 text-xs space-y-2.5">
                <div className="flex items-center gap-2 text-indigo-300 font-bold">
                  <Info className="w-4 h-4 text-indigo-400" />
                  <span>Format Kolom yang Didukung dalam Spreadsheet:</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-slate-300">
                  <div className="bg-slate-900 p-2 rounded-lg border border-slate-800">
                    <strong className="text-indigo-300">1. No. KJJ:</strong> KJJ-0101-0001
                  </div>
                  <div className="bg-slate-900 p-2 rounded-lg border border-slate-800">
                    <strong className="text-indigo-300">2. Nama:</strong> Nama Lengkap
                  </div>
                  <div className="bg-slate-900 p-2 rounded-lg border border-slate-800">
                    <strong className="text-indigo-300">3. Tanggal Lahir:</strong> YYYY-MM-DD
                  </div>
                  <div className="bg-slate-900 p-2 rounded-lg border border-slate-800">
                    <strong className="text-indigo-300">4. Hubungan:</strong> Kepala Keluarga / Istri / Anak
                  </div>
                </div>
                <div className="flex items-center justify-between pt-1">
                  <p className="text-[11px] text-slate-400">
                    Belum memiliki format yang tepat? Silakan unduh template resmi GKE.
                  </p>
                  <button
                    type="button"
                    onClick={handleDownloadTemplate}
                    className="text-emerald-400 hover:text-emerald-300 font-bold text-xs flex items-center gap-1 underline cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Unduh Template Contoh
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Step 2: Parsed File Preview & Execution Controls */
            <div className="space-y-4">
              {/* Selected File Info Banner */}
              <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-slate-200 text-xs sm:text-sm">{selectedFile.name}</p>
                      <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-mono">
                        {(selectedFile.size / 1024).toFixed(1)} KB
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Berhasil dipindai. Silakan tinjau ringkasan data di bawah sebelum menyimpan ke database.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={handleReset}
                    disabled={isImporting}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Ganti File</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleDownloadTemplate}
                    className="px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Template</span>
                  </button>
                </div>
              </div>

              {/* Parsing Loader */}
              {isParsing && (
                <div className="py-8 text-center space-y-2">
                  <Loader2 className="w-8 h-8 animate-spin text-indigo-400 mx-auto" />
                  <p className="text-xs text-slate-300">Memindai baris spreadsheet &amp; memetakan KKJ...</p>
                </div>
              )}

              {/* Statistics Metrics Cards */}
              {importSummary && !isParsing && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800">
                    <p className="text-[10px] text-slate-400 uppercase font-bold">Total Jiwa Terdeteksi</p>
                    <p className="text-base font-extrabold text-white">{importSummary.totalRows} Jiwa</p>
                    <div className="text-[10px] text-emerald-400 flex items-center gap-1 mt-0.5">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>{importSummary.validRows} Valid</span>
                      {importSummary.invalidRows > 0 && (
                        <span className="text-rose-400 font-semibold">({importSummary.invalidRows} kendala)</span>
                      )}
                    </div>
                  </div>

                  <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800">
                    <p className="text-[10px] text-slate-400 uppercase font-bold">Jumlah Kartu Keluarga (KK)</p>
                    <p className="text-base font-extrabold text-indigo-300">{importSummary.totalKkCount} KK</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {importSummary.newKkCount} KK Baru
                    </p>
                  </div>

                  <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800">
                    <p className="text-[10px] text-slate-400 uppercase font-bold">Komposisi Gender</p>
                    <p className="text-xs font-bold text-slate-200">
                      L: <span className="text-indigo-400">{importSummary.maleCount}</span> | P:{' '}
                      <span className="text-rose-400">{importSummary.femaleCount}</span>
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Baptis: {importSummary.baptisCount} | Sidi: {importSummary.sidiCount}
                    </p>
                  </div>

                  <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800">
                    <p className="text-[10px] text-slate-400 uppercase font-bold">Kesesuaian Database</p>
                    <p className="text-base font-extrabold text-amber-300">
                      {importSummary.existingRecordsCount} Terdaftar
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {overwriteExisting ? 'Akan ditimpa/update' : 'Akan dilewati'}
                    </p>
                  </div>
                </div>
              )}

              {/* Conflict / Overwrite Option */}
              <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800 flex items-center justify-between gap-3 text-xs">
                <div className="space-y-0.5">
                  <p className="font-bold text-slate-200">Opsi Duplikasi / Data yang Sudah Ada:</p>
                  <p className="text-[11px] text-slate-400">
                    Tentukan apakah sistem memperbarui data yang cocok berdasarkan NIK atau Nama Lengkap + No. KJJ.
                  </p>
                </div>

                <label className="flex items-center gap-2 cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={overwriteExisting}
                    onChange={(e) => setOverwriteExisting(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 bg-slate-900 border-slate-700 focus:ring-indigo-500 cursor-pointer"
                  />
                  <span className="text-xs font-semibold text-slate-300">
                    Perbarui data jika sudah ada
                  </span>
                </label>
              </div>

              {/* Search & Filter Bar */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 text-xs">
                {/* Tab buttons */}
                <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
                  <button
                    type="button"
                    onClick={() => setActiveTab('table')}
                    className={`px-3 py-1.5 rounded-lg font-bold text-xs transition ${
                      activeTab === 'table'
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Tabel Semua Jiwa ({parsedRows.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('families')}
                    className={`px-3 py-1.5 rounded-lg font-bold text-xs transition ${
                      activeTab === 'families'
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Grup Kartu Keluarga ({Object.keys(familyGroups).length} KK)
                  </button>
                </div>

                <div className="flex items-center gap-2 flex-1 max-w-sm">
                  <div className="relative flex-1">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="Cari pratinjau..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <select
                    value={filterMode}
                    onChange={(e) => setFilterMode(e.target.value as any)}
                    className="py-1.5 px-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-indigo-500"
                  >
                    <option value="all">Semua ({parsedRows.length})</option>
                    <option value="valid">Hanya Valid</option>
                    <option value="issues">Hanya Kendala</option>
                  </select>
                </div>
              </div>

              {/* Data Preview: Table View */}
              {activeTab === 'table' && (
                <div className="bg-slate-950/90 rounded-xl border border-slate-800 overflow-hidden">
                  <div className="overflow-x-auto max-h-64">
                    <table className="w-full min-w-[760px] text-[11px] text-left text-slate-300">
                      <thead className="bg-slate-900 text-slate-300 uppercase text-[10px] font-bold border-b border-slate-800 sticky top-0">
                        <tr>
                          <th className="p-2.5 text-center w-10">No</th>
                          <th className="p-2.5">No. KJJ</th>
                          <th className="p-2.5">Nama Lengkap</th>
                          <th className="p-2.5 text-center">L/P</th>
                          <th className="p-2.5">Tgl Lahir</th>
                          <th className="p-2.5">Lingkungan</th>
                          <th className="p-2.5">Hubungan</th>
                          <th className="p-2.5 text-center">Baptis</th>
                          <th className="p-2.5 text-center">Sidi</th>
                          <th className="p-2.5 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {filteredPreviewRows.length === 0 ? (
                          <tr>
                            <td colSpan={10} className="p-6 text-center text-slate-500 text-xs">
                              Tidak ada baris data yang cocok dengan kriteria filter.
                            </td>
                          </tr>
                        ) : (
                          filteredPreviewRows.map((row) => (
                            <tr
                              key={row.rowNumber}
                              className={`hover:bg-slate-800/40 transition ${
                                !row.isValid ? 'bg-rose-950/20' : ''
                              }`}
                            >
                              <td className="p-2.5 text-center font-mono text-slate-500">
                                {row.rowNumber}
                              </td>
                              <td className="p-2.5 font-mono text-indigo-400 font-semibold">
                                {row.noKjj}
                              </td>
                              <td className="p-2.5 font-bold text-slate-100">
                                {row.namaLengkap}
                                {row.isExistingInDb && (
                                  <span className="ml-1.5 text-[9px] bg-amber-500/20 text-amber-300 px-1 py-0.2 rounded font-normal">
                                    Sudah Ada
                                  </span>
                                )}
                              </td>
                              <td className="p-2.5 text-center">
                                <span
                                  className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                    row.jenisKelamin === 'L'
                                      ? 'bg-blue-500/20 text-blue-300'
                                      : 'bg-rose-500/20 text-rose-300'
                                  }`}
                                >
                                  {row.jenisKelamin}
                                </span>
                              </td>
                              <td className="p-2.5 font-mono text-slate-400">{row.tanggalLahir}</td>
                              <td className="p-2.5 text-slate-300 truncate max-w-[140px]">
                                {row.rayon}
                              </td>
                              <td className="p-2.5 text-slate-300">{row.hubunganKeluarga}</td>
                              <td className="p-2.5 text-center">
                                {row.statusBaptis ? (
                                  <span className="text-emerald-400">Ya</span>
                                ) : (
                                  <span className="text-slate-500">Tdk</span>
                                )}
                              </td>
                              <td className="p-2.5 text-center">
                                {row.statusSidi ? (
                                  <span className="text-emerald-400">Ya</span>
                                ) : (
                                  <span className="text-slate-500">Tdk</span>
                                )}
                              </td>
                              <td className="p-2.5 text-center">
                                {row.isValid ? (
                                  <span className="inline-flex items-center gap-1 text-emerald-400">
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    <span>Siap</span>
                                  </span>
                                ) : (
                                  <span
                                    className="inline-flex items-center gap-1 text-rose-400 font-semibold"
                                    title={row.validationIssues.join(', ')}
                                  >
                                    <AlertTriangle className="w-3.5 h-3.5" />
                                    <span>{row.validationIssues[0]}</span>
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Data Preview: Family Groups */}
              {activeTab === 'families' && (
                <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                  {(Object.entries(familyGroups) as [string, ParsedSensusRow[]][]).map(([kjj, members]) => {
                    const kepala = members.find((m) => m.hubunganKeluarga === 'Kepala Keluarga');
                    return (
                      <div
                        key={kjj}
                        className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2"
                      >
                        <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-extrabold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                              {kjj}
                            </span>
                            <span className="text-xs font-bold text-white">
                              KK: {kepala ? kepala.namaLengkap : 'Tanpa Kepala Keluarga'}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-400 font-medium">
                            {members.length} Anggota Keluarga
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 text-[11px]">
                          {members.map((m, mIdx) => (
                            <div
                              key={mIdx}
                              className="bg-slate-900/80 p-2 rounded-lg border border-slate-800 flex items-center justify-between gap-2"
                            >
                              <div className="truncate">
                                <p className="font-semibold text-slate-200 truncate">{m.namaLengkap}</p>
                                <p className="text-[10px] text-indigo-300">{m.hubunganKeluarga}</p>
                              </div>
                              <span className="text-[9px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded font-mono shrink-0">
                                {m.tanggalLahir}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Progress Bar during Import */}
              {isImporting && (
                <div className="space-y-2 bg-slate-950 p-4 rounded-xl border border-indigo-500/30">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-indigo-300 font-bold flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
                      <span>{importStepLabel}</span>
                    </span>
                    <span className="font-extrabold text-indigo-300 font-mono">{importProgress}%</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-indigo-500 via-sky-400 to-emerald-400 h-full rounded-full transition-all duration-300"
                      style={{ width: `${importProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Import Result Notification */}
              {importResult && (
                <div
                  className={`p-4 rounded-xl border flex items-start gap-3 text-xs animate-in fade-in duration-200 ${
                    importResult.success
                      ? 'bg-emerald-950/50 border-emerald-500/40 text-emerald-300'
                      : 'bg-rose-950/50 border-rose-500/40 text-rose-300'
                  }`}
                >
                  <div
                    className={`p-1.5 rounded-lg shrink-0 ${
                      importResult.success ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                    }`}
                  >
                    {importResult.success ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : (
                      <AlertTriangle className="w-5 h-5" />
                    )}
                  </div>
                  <div className="space-y-1 flex-1">
                    <p className="font-bold text-sm">
                      {importResult.success ? 'Import Sensus Berhasil' : 'Kendala Import Data'}
                    </p>
                    <p className="opacity-90 leading-relaxed">{importResult.message}</p>
                    {importResult.success && (
                      <div className="flex items-center gap-3 pt-1 text-[11px] font-mono">
                        <span className="text-emerald-200">
                          + {importResult.insertedCount} Data Baru
                        </span>
                        <span className="text-amber-200">
                          ↻ {importResult.updatedCount} Diperbarui
                        </span>
                        {importResult.skippedCount > 0 && (
                          <span className="text-slate-400">
                            - {importResult.skippedCount} Dilewati
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/70 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-400">
            {selectedFile && parsedRows.length > 0 && (
              <span>
                Siap mengimport <strong className="text-emerald-400">{parsedRows.filter((r) => r.namaLengkap && r.namaLengkap.trim() !== '' && r.namaLengkap !== 'Tanpa Nama').length}</strong> dari{' '}
                <strong className="text-white">{parsedRows.length}</strong> jiwa ke database.
              </span>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isImporting}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition cursor-pointer"
            >
              {importResult?.success ? 'Tutup' : 'Batal'}
            </button>

            {selectedFile && !importResult?.success && (
              <button
                type="button"
                onClick={handleExecuteImport}
                disabled={isImporting || parsedRows.filter((r) => r.namaLengkap && r.namaLengkap.trim() !== '' && r.namaLengkap !== 'Tanpa Nama').length === 0}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs shadow-lg shadow-emerald-600/30 active:scale-95 disabled:opacity-50 transition cursor-pointer"
              >
                {isImporting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Mengimport ({importProgress}%)...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 text-emerald-200" />
                    <span>Simpan ke Database ({parsedRows.filter((r) => r.namaLengkap && r.namaLengkap.trim() !== '' && r.namaLengkap !== 'Tanpa Nama').length} Jiwa)</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Delete / Clear Modal inside Import flow */}
      <DeleteKeluargaModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
      />
    </div>
  );
};
