import React, { useState, useRef } from 'react';
import {
  Upload,
  X,
  FileSpreadsheet,
  Download,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Heart,
  Sparkles,
  Award,
  Filter,
  ArrowRight,
  Database,
  Check,
} from 'lucide-react';
import {
  parseSakramenFile,
  downloadSakramenTemplateExcel,
  downloadSakramenTemplateCsv,
  ParsedSakramenRow,
  getLabelJenisPelayanan,
} from '../../utils/sakramenExcelUtils';
import { PelayananSakramen } from '../../types';

interface ImportPelayananSakramenModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportBatch: (
    items: Omit<PelayananSakramen, 'id' | 'tersimpanKeAgendaSurat'>[],
    options?: { skipDuplicates?: boolean }
  ) => Promise<{ success: boolean; count: number; skipped: number; message?: string }>;
  existingList: PelayananSakramen[];
  generateAutoNoSurat: (jenis: 'baptis' | 'sidi' | 'nikah') => string;
}

export const ImportPelayananSakramenModal: React.FC<ImportPelayananSakramenModalProps> = ({
  isOpen,
  onClose,
  onImportBatch,
  existingList,
  generateAutoNoSurat,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [parsedRows, setParsedRows] = useState<ParsedSakramenRow[]>([]);
  const [filterTab, setFilterTab] = useState<'semua' | 'valid' | 'invalid'>('semua');
  const [skipDuplicates, setSkipDuplicates] = useState(true);
  const [autoGenerateNoSuratIfEmpty, setAutoGenerateNoSuratIfEmpty] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [importResult, setImportResult] = useState<{
    success: boolean;
    count: number;
    skipped: number;
    message?: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  if (!isOpen) return null;

  const handleReset = () => {
    setFile(null);
    setParsedRows([]);
    setParseErrors([]);
    setImportResult(null);
    setIsParsing(false);
    setIsSubmitting(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleFileChange = async (selectedFile: File) => {
    setFile(selectedFile);
    setIsParsing(true);
    setParseErrors([]);
    setParsedRows([]);
    setImportResult(null);

    try {
      const { items, errors } = await parseSakramenFile(selectedFile);
      setParsedRows(items);
      setParseErrors(errors);
    } catch (err: any) {
      setParseErrors([err?.message || 'Terjadi kesalahan saat memproses file.']);
    } finally {
      setIsParsing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const validRows = parsedRows.filter((r) => r.isValid);
  const invalidRows = parsedRows.filter((r) => !r.isValid);

  const displayedRows =
    filterTab === 'valid'
      ? validRows
      : filterTab === 'invalid'
      ? invalidRows
      : parsedRows;

  const handleExecuteImport = async () => {
    if (validRows.length === 0) return;

    setIsSubmitting(true);
    try {
      const itemsToImport: Omit<PelayananSakramen, 'id' | 'tersimpanKeAgendaSurat'>[] =
        validRows.map((r) => {
          let noSurat = r.noSuratResmi.trim();
          if (!noSurat && autoGenerateNoSuratIfEmpty) {
            noSurat = generateAutoNoSurat(r.jenisPelayanan);
          }

          return {
            jenisPelayanan: r.jenisPelayanan,
            noSuratResmi: noSurat,
            tanggalPelayanan: r.tanggalPelayanan,
            tempatPelayanan: r.tempatPelayanan || 'Gedung Gereja GKE',
            pelayanFirman: r.pelayanFirman || 'Pendeta Jemaat GKE',
            namaUtama: r.namaUtama,
            tempatTanggalLahir: r.tempatTanggalLahir || '',
            alamatUtama: r.alamatUtama || '',
            namaPasangan: r.namaPasangan || '',
            tempatTanggalLahirPasangan: r.tempatTanggalLahirPasangan || '',
            alamatPasangan: r.alamatPasangan || '',
            namaAyah: r.namaAyah || '',
            namaIbu: r.namaIbu || '',
            namaAyahPasangan: r.namaAyahPasangan || '',
            namaIbuPasangan: r.namaIbuPasangan || '',
            saksi1: r.saksi1 || '',
            saksi2: r.saksi2 || '',
            status: r.status || 'Disetujui & Diterbitkan',
            nasKhotbah: r.nasKhotbah || '',
            nasPeringatan: r.nasPeringatan || '',
            catatanPastoral: r.catatanPastoral || '',
          };
        });

      const res = await onImportBatch(itemsToImport, { skipDuplicates });
      setImportResult(res);
    } catch (err: any) {
      setImportResult({
        success: false,
        count: 0,
        skipped: 0,
        message: err?.message || 'Gagal menyimpan data ke database.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getBadgeIcon = (jenis: 'baptis' | 'sidi' | 'nikah') => {
    switch (jenis) {
      case 'nikah':
        return <Heart className="w-3 h-3 text-rose-500 fill-rose-500" />;
      case 'baptis':
        return <Sparkles className="w-3 h-3 text-sky-500" />;
      case 'sidi':
        return <Award className="w-3 h-3 text-indigo-500" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-hidden animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden text-slate-800 dark:text-slate-100">
        {/* Header */}
        <div className="shrink-0 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-4 sm:p-5 text-white flex justify-between items-center border-b border-indigo-800/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/20 border border-teal-500/40 flex items-center justify-center text-teal-400 shadow-md">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-extrabold text-white flex items-center gap-2">
                Import Data Pelayanan Sakramen
              </h2>
              <p className="text-xs text-slate-300 mt-0.5">
                Unggah berkas Excel (.xlsx, .xls) atau CSV untuk memasukkan data Nikah, Baptis & Sidi secara massal.
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              handleReset();
              onClose();
            }}
            className="text-slate-400 hover:text-white p-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 text-xs">
          {/* Success Banner if Completed */}
          {importResult && (
            <div
              className={`p-4 rounded-xl border flex items-start gap-3.5 ${
                importResult.success
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-100'
                  : 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-100'
              }`}
            >
              {importResult.success ? (
                <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-6 h-6 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <h4 className="font-bold text-sm">
                  {importResult.success ? 'Import Data Berhasil!' : 'Gagal Mengimpor Data'}
                </h4>
                <p className="text-xs mt-1">
                  {importResult.message ||
                    `Berhasil menambahkan ${importResult.count} data pelayanan sakramen ke database. ${
                      importResult.skipped > 0
                        ? `Dilewati ${importResult.skipped} data duplikat.`
                        : ''
                    }`}
                </p>
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => {
                      handleReset();
                      onClose();
                    }}
                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition"
                  >
                    Tutup & Lihat Data
                  </button>
                  <button
                    onClick={handleReset}
                    className="px-3.5 py-1.5 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 font-semibold rounded-lg hover:bg-slate-50 transition"
                  >
                    Import File Lain
                  </button>
                </div>
              </div>
            </div>
          )}

          {!importResult && (
            <>
              {/* Template Download Card */}
              <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 sm:p-4 rounded-xl border border-slate-200 dark:border-slate-700/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Download className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                    <span>Format & Template Berkas Impor</span>
                  </div>
                  <p className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5">
                    Gunakan template standar agar nama kolom dan format data terbaca otomatis oleh sistem.
                  </p>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={downloadSakramenTemplateExcel}
                    className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-lg shadow-sm transition cursor-pointer"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    <span>Unduh Excel (.xlsx)</span>
                  </button>
                  <button
                    type="button"
                    onClick={downloadSakramenTemplateCsv}
                    className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 font-semibold rounded-lg transition cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>CSV (.csv)</span>
                  </button>
                </div>
              </div>

              {/* Upload Dropzone */}
              {!file && (
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragOver(true);
                  }}
                  onDragLeave={() => setIsDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-8 sm:p-10 text-center cursor-pointer transition-all ${
                    isDragOver
                      ? 'border-teal-500 bg-teal-50/50 dark:bg-teal-950/20 ring-4 ring-teal-500/20'
                      : 'border-slate-300 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/30 hover:bg-slate-100/70 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        handleFileChange(e.target.files[0]);
                      }
                    }}
                  />
                  <div className="w-14 h-14 rounded-2xl bg-teal-100 dark:bg-teal-900/40 text-teal-600 dark:text-teal-400 mx-auto flex items-center justify-center mb-3 shadow-inner">
                    <Upload className="w-7 h-7" />
                  </div>
                  <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">
                    Pilih atau Seret Berkas Excel / CSV ke Sini
                  </h3>
                  <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">
                    Mendukung file .xlsx, .xls, dan .csv (Maks. 10MB)
                  </p>
                  <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs shadow-md transition">
                    <FileSpreadsheet className="w-4 h-4" />
                    <span>Pilih Berkas dari Komputer</span>
                  </div>
                </div>
              )}

              {/* Parsing Indicator */}
              {isParsing && (
                <div className="py-12 text-center text-slate-500 dark:text-slate-400 space-y-2">
                  <RefreshCw className="w-8 h-8 mx-auto animate-spin text-teal-500" />
                  <p className="font-semibold text-xs">Membaca dan memvalidasi isi berkas...</p>
                </div>
              )}

              {/* Error Box */}
              {parseErrors.length > 0 && (
                <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl space-y-1.5 text-xs text-rose-800 dark:text-rose-200">
                  <div className="font-bold flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                    <span>Peringatan Pembacaan Berkas:</span>
                  </div>
                  <ul className="list-disc list-inside space-y-1 pl-1">
                    {parseErrors.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Parsed Preview Section */}
              {file && !isParsing && (
                <div className="space-y-4">
                  {/* File Info Bar */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <FileSpreadsheet className="w-5 h-5 text-teal-600 dark:text-teal-400 shrink-0" />
                      <div className="truncate">
                        <span className="font-bold text-slate-800 dark:text-slate-200 truncate block">
                          {file.name}
                        </span>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400">
                          {(file.size / 1024).toFixed(1)} KB • Terbaca {parsedRows.length} baris data
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleReset}
                      className="text-xs text-rose-600 dark:text-rose-400 hover:underline font-semibold flex items-center gap-1 self-end sm:self-center"
                    >
                      <X className="w-3.5 h-3.5" />
                      Ganti Berkas
                    </button>
                  </div>

                  {/* Summary & Filter Tabs */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl font-semibold text-xs">
                      <button
                        type="button"
                        onClick={() => setFilterTab('semua')}
                        className={`px-3 py-1.5 rounded-lg transition ${
                          filterTab === 'semua'
                            ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm font-bold'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        Semua Baris ({parsedRows.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setFilterTab('valid')}
                        className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
                          filterTab === 'valid'
                            ? 'bg-emerald-600 text-white shadow-sm font-bold'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        <Check className="w-3.5 h-3.5" />
                        Valid ({validRows.length})
                      </button>
                      {invalidRows.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setFilterTab('invalid')}
                          className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
                            filterTab === 'invalid'
                              ? 'bg-rose-600 text-white shadow-sm font-bold'
                              : 'text-rose-600 dark:text-rose-400 hover:text-rose-700'
                          }`}
                        >
                          <AlertCircle className="w-3.5 h-3.5" />
                          Tidak Lengkap ({invalidRows.length})
                        </button>
                      )}
                    </div>

                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 text-[11px]">
                      <label className="flex items-center gap-1.5 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={skipDuplicates}
                          onChange={(e) => setSkipDuplicates(e.target.checked)}
                          className="rounded border-slate-300 text-teal-600 focus:ring-teal-500 w-3.5 h-3.5"
                        />
                        <span className="text-slate-700 dark:text-slate-300 font-medium">
                          Lewati jika Nomor Surat / Nama sudah ada di sistem
                        </span>
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={autoGenerateNoSuratIfEmpty}
                          onChange={(e) => setAutoGenerateNoSuratIfEmpty(e.target.checked)}
                          className="rounded border-slate-300 text-teal-600 focus:ring-teal-500 w-3.5 h-3.5"
                        />
                        <span className="text-slate-700 dark:text-slate-300 font-medium">
                          Otomatis buat No. Surat jika kosong
                        </span>
                      </label>
                    </div>
                  </div>

                  {/* Preview Table */}
                  <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs bg-white dark:bg-slate-900">
                    <div className="overflow-x-auto max-h-[300px]">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead className="bg-slate-100 dark:bg-slate-800/90 text-slate-700 dark:text-slate-300 sticky top-0 z-10 border-b border-slate-200 dark:border-slate-700 font-bold">
                          <tr>
                            <th className="py-2.5 px-3 text-center w-12">No</th>
                            <th className="py-2.5 px-3">Jenis</th>
                            <th className="py-2.5 px-3">Nama Bersangkutan / Pria</th>
                            <th className="py-2.5 px-3">Pasangan / Wanita</th>
                            <th className="py-2.5 px-3">No. Surat Resmi</th>
                            <th className="py-2.5 px-3">Tanggal & Tempat</th>
                            <th className="py-2.5 px-3">Pelayan Firman</th>
                            <th className="py-2.5 px-3 text-center">Status Data</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          {displayedRows.length === 0 ? (
                            <tr>
                              <td colSpan={8} className="py-6 text-center text-slate-400 italic">
                                Tidak ada baris yang cocok dengan filter.
                              </td>
                            </tr>
                          ) : (
                            displayedRows.map((row) => (
                              <tr
                                key={row.rowNumber}
                                className={`transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/60 ${
                                  !row.isValid ? 'bg-rose-50/40 dark:bg-rose-950/20' : ''
                                }`}
                              >
                                <td className="py-2 px-3 text-center font-mono text-slate-500">
                                  {row.rowNumber}
                                </td>
                                <td className="py-2 px-3 whitespace-nowrap">
                                  <span className="inline-flex items-center gap-1 font-semibold text-[11px]">
                                    {getBadgeIcon(row.jenisPelayanan)}
                                    <span>{getLabelJenisPelayanan(row.jenisPelayanan)}</span>
                                  </span>
                                </td>
                                <td className="py-2 px-3 font-semibold text-slate-900 dark:text-slate-100">
                                  {row.namaUtama || (
                                    <span className="text-rose-500 italic">Kosong (Wajib)</span>
                                  )}
                                  {row.tempatTanggalLahir && (
                                    <div className="text-[10px] text-slate-500 font-normal">
                                      {row.tempatTanggalLahir}
                                    </div>
                                  )}
                                </td>
                                <td className="py-2 px-3">
                                  {row.jenisPelayanan === 'nikah' ? (
                                    row.namaPasangan ? (
                                      <span className="text-rose-600 dark:text-rose-400 font-medium">
                                        {row.namaPasangan}
                                      </span>
                                    ) : (
                                      <span className="text-rose-500 italic">Kosong (Wajib Nikah)</span>
                                    )
                                  ) : (
                                    <span className="text-slate-400">-</span>
                                  )}
                                </td>
                                <td className="py-2 px-3 font-mono text-[11px] text-slate-700 dark:text-slate-300">
                                  {row.noSuratResmi || (
                                    <span className="text-slate-400 italic">
                                      {autoGenerateNoSuratIfEmpty ? '(Auto-generate)' : 'Kosong'}
                                    </span>
                                  )}
                                </td>
                                <td className="py-2 px-3 whitespace-nowrap">
                                  <div className="font-medium text-slate-800 dark:text-slate-200">
                                    {row.tanggalPelayanan}
                                  </div>
                                  <div className="text-[10px] text-slate-500">{row.tempatPelayanan}</div>
                                </td>
                                <td className="py-2 px-3 text-slate-700 dark:text-slate-300">
                                  {row.pelayanFirman}
                                </td>
                                <td className="py-2 px-3 text-center whitespace-nowrap">
                                  {row.isValid ? (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold">
                                      <CheckCircle2 className="w-3 h-3" />
                                      Siap Impor
                                    </span>
                                  ) : (
                                    <span
                                      title={row.validationIssues.join(', ')}
                                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 text-[10px] font-bold cursor-help"
                                    >
                                      <AlertCircle className="w-3 h-3" />
                                      Perlu Perbaikan
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
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="shrink-0 p-4 bg-slate-50 dark:bg-slate-800/90 border-t border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row justify-between items-center gap-3">
          <div className="text-xs text-slate-500 dark:text-slate-400 text-center sm:text-left">
            {parsedRows.length > 0 && !importResult && (
              <span>
                Total <strong className="text-slate-800 dark:text-slate-200">{validRows.length}</strong> data valid
                siap diimpor ke buku agenda dan arsip digital.
              </span>
            )}
          </div>
          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => {
                handleReset();
                onClose();
              }}
              className="flex-1 sm:flex-none px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 font-semibold transition cursor-pointer"
            >
              {importResult ? 'Tutup' : 'Batal'}
            </button>
            {!importResult && file && validRows.length > 0 && (
              <button
                type="button"
                onClick={handleExecuteImport}
                disabled={isSubmitting || validRows.length === 0}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-teal-600 to-indigo-600 hover:from-teal-500 hover:to-indigo-500 text-white font-bold shadow-lg shadow-teal-900/30 transition cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Menyimpan ke Cloud...</span>
                  </>
                ) : (
                  <>
                    <Database className="w-4 h-4" />
                    <span>Simpan {validRows.length} Data Sakramen</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
