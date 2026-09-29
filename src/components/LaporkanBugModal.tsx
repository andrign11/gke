import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Bug,
  AlertTriangle,
  UploadCloud,
  CheckCircle2,
  X,
  Laptop,
  Smartphone,
  Info,
  Send,
  Trash2,
  FileImage,
  Sparkles,
  ShieldAlert,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { BugKategori, BugPrioritas, InfoPerangkat } from '../types';

interface LaporkanBugModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultHalaman?: string;
}

const KATEGORI_OPTIONS: BugKategori[] = [
  'Tampilan (UI/UX)',
  'Fungsionalitas / Fitur Rusak',
  'Keuangan & Buku Kas',
  'Data Warga & Sensus',
  'Jadwal & Ibadah',
  'Cetak & Ekspor Dokumen',
  'Performa & Koneksi',
  'Keamanan & Akun',
  'Lainnya',
];

const MODUL_OPTIONS = [
  'Dashboard Utama',
  'Buku Kas & Keuangan',
  'Data Warga & Sensus KKJ',
  'Jadwal Ibadah & Liturgi',
  'Pendaftaran Anggota (Mandiri)',
  'Struktur Pengurus MPH',
  'Penatua & Diakon',
  'Inventaris & Aset Gereja',
  'Pelayanan Nikah, Baptis & Sidi',
  'Surat & Administrasi',
  'Perpustakaan & E-Book',
  'Pemilihan & E-Voting',
  'WhatsApp Bot & Gateway',
  'Manajemen Tugas Pelayanan',
  'Portal Warga Jemaat',
  'Pengaturan Kop & Identitas',
  'Lainnya / Umum',
];

export const LaporkanBugModal: React.FC<LaporkanBugModalProps> = ({
  isOpen,
  onClose,
  defaultHalaman,
}) => {
  const { currentUser, activeTab, addLaporanBug, isOnline } = useApp();

  const [judul, setJudul] = useState('');
  const [kategori, setKategori] = useState<BugKategori>('Fungsionalitas / Fitur Rusak');
  const [prioritas, setPrioritas] = useState<BugPrioritas>('Sedang');
  const [halamanTerkait, setHalamanTerkait] = useState('');
  const [deskripsi, setDeskripsi] = useState('');
  const [langkahReproduksi, setLangkahReproduksi] = useState('');
  const [pesanError, setPesanError] = useState('');
  const [lampiranUrl, setLampiranUrl] = useState<string>('');
  const [namaPelapor, setNamaPelapor] = useState('');
  const [emailPelapor, setEmailPelapor] = useState('');
  const [noHpPelapor, setNoHpPelapor] = useState('');
  const [showTechInfo, setShowTechInfo] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Auto-detect technical context
  const [infoPerangkat, setInfoPerangkat] = useState<InfoPerangkat>({});

  useEffect(() => {
    if (isOpen) {
      // Auto-detect browser and OS info
      const ua = navigator.userAgent;
      let browserName = 'Browser Web';
      if (ua.indexOf('Firefox') > -1) browserName = 'Mozilla Firefox';
      else if (ua.indexOf('SamsungBrowser') > -1) browserName = 'Samsung Internet';
      else if (ua.indexOf('Opera') > -1 || ua.indexOf('OPR') > -1) browserName = 'Opera';
      else if (ua.indexOf('Trident') > -1) browserName = 'Internet Explorer';
      else if (ua.indexOf('Edge') > -1 || ua.indexOf('Edg') > -1) browserName = 'Microsoft Edge';
      else if (ua.indexOf('Chrome') > -1) browserName = 'Google Chrome';
      else if (ua.indexOf('Safari') > -1) browserName = 'Apple Safari';

      let osName = 'Desktop OS';
      if (ua.indexOf('Win') > -1) osName = 'Windows';
      else if (ua.indexOf('Android') > -1) osName = 'Android';
      else if (ua.indexOf('iPhone') > -1 || ua.indexOf('iPad') > -1) osName = 'iOS';
      else if (ua.indexOf('Mac') > -1) osName = 'macOS';
      else if (ua.indexOf('Linux') > -1) osName = 'Linux';

      const screenRes = `${window.screen?.width || window.innerWidth}x${window.screen?.height || window.innerHeight}`;

      setInfoPerangkat({
        browser: browserName,
        os: osName,
        screenResolution: screenRes,
        url: window.location.pathname || `tab:${activeTab}`,
        onlineStatus: isOnline,
      });

      // Default pelapor info
      setNamaPelapor(currentUser?.namaLengkap || currentUser?.namaPanggilan || '');
      setEmailPelapor(currentUser?.email || '');
      setNoHpPelapor(currentUser?.noHp || '');
      setHalamanTerkait(defaultHalaman || (activeTab ? `Modul: ${activeTab}` : 'Dashboard Utama'));
      setIsSuccess(false);
    }
  }, [isOpen, currentUser, activeTab, defaultHalaman, isOnline]);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (< 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Ukuran file tangkapan layar maksimal 5 MB.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setLampiranUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!judul.trim() || !deskripsi.trim()) {
      alert('Mohon isi judul masalah dan deskripsi lengkap kendala.');
      return;
    }

    setIsSubmitting(true);
    try {
      await addLaporanBug({
        judul: judul.trim(),
        kategori,
        prioritas,
        halamanTerkait: halamanTerkait.trim() || 'Umum',
        deskripsi: deskripsi.trim(),
        langkahReproduksi: langkahReproduksi.trim() || undefined,
        pesanError: pesanError.trim() || undefined,
        lampiranUrl: lampiranUrl || undefined,
        pelapor: {
          nama: namaPelapor.trim() || 'Pengguna Anonim',
          email: emailPelapor.trim() || undefined,
          noHp: noHpPelapor.trim() || undefined,
          role: currentUser?.role || 'warga',
          userId: currentUser?.id,
        },
        infoPerangkat,
      });

      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        onClose();
        // Reset form
        setJudul('');
        setDeskripsi('');
        setLangkahReproduksi('');
        setPesanError('');
        setLampiranUrl('');
      }, 1800);
    } catch (err) {
      console.error('Gagal mengirim laporan bug:', err);
      alert('Terjadi kendala saat mengirim laporan. Silakan coba kembali.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return createPortal(
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 lg:left-64 z-[9999] flex items-center justify-center bg-slate-950/70 dark:bg-slate-950/80 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200"
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Header Modal */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/90 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20 flex-shrink-0">
              <Bug className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base flex items-center gap-2">
                <span>Laporkan Bug / Kendala Sistem</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-500/30">
                  Pusat Bantuan & QA
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Sampaikan masalah teknis atau masukan perbaikan untuk pengembangan aplikasi GKE
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form Content */}
        {isSuccess ? (
          <div className="p-8 text-center space-y-4 my-auto">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto animate-bounce">
              <CheckCircle2 className="w-9 h-9" />
            </div>
            <h4 className="text-lg font-bold text-white">Laporan Bug Berhasil Dikirim!</h4>
            <p className="text-xs text-slate-300 max-w-md mx-auto leading-relaxed">
              Terima kasih atas bantuan Anda. Tim pengembang SI Jemaat GKE telah mencatat laporan ini dan akan segera menindaklanjuti perbaikannya.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4 text-xs text-slate-200">
            {/* Auto System Banner */}
            <div className="bg-indigo-950/40 border border-indigo-500/30 rounded-xl p-3 flex items-start gap-3">
              <Sparkles className="w-4 h-4 text-indigo-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-indigo-200">Deteksi Otomatis Lingkungan Perangkat</span>
                  <button
                    type="button"
                    onClick={() => setShowTechInfo(!showTechInfo)}
                    className="text-[11px] text-indigo-300 hover:text-indigo-100 underline cursor-pointer"
                  >
                    {showTechInfo ? 'Sembunyikan' : 'Lihat Info Teknis'}
                  </button>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Browser: {infoPerangkat.browser} • OS: {infoPerangkat.os} • Layar: {infoPerangkat.screenResolution}
                </p>

                {showTechInfo && (
                  <div className="mt-2.5 pt-2.5 border-t border-indigo-500/20 grid grid-cols-2 gap-2 text-[11px] text-slate-300">
                    <div>
                      <span className="text-slate-400">User Agent:</span>
                      <p className="font-mono text-[10px] text-indigo-200 truncate">{navigator.userAgent}</p>
                    </div>
                    <div>
                      <span className="text-slate-400">Status Jaringan:</span>
                      <p className="font-semibold text-emerald-400">
                        {isOnline ? 'Online (Terhubung)' : 'Offline (Lokal)'}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Judul Kendala */}
            <div className="space-y-1.5">
              <label className="block font-semibold text-slate-700 dark:text-slate-200">
                Judul Masalah / Ringkasan Kendala <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={judul || ''}
                onChange={(e) => setJudul(e.target.value)}
                placeholder="Contoh: Tombol cetak PDF buku kas tidak merespon di browser HP"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-xs"
              />
            </div>

            {/* Row: Kategori, Prioritas & Modul Terkait */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Kategori */}
              <div className="space-y-1.5">
                <label className="block font-semibold text-slate-700 dark:text-slate-200">Kategori Bug</label>
                <select
                  value={kategori || 'Fungsionalitas / Fitur Rusak'}
                  onChange={(e) => setKategori(e.target.value as BugKategori)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 text-xs cursor-pointer"
                >
                  {KATEGORI_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              {/* Prioritas / Urgensi */}
              <div className="space-y-1.5">
                <label className="block font-semibold text-slate-700 dark:text-slate-200">Tingkat Urgensi</label>
                <select
                  value={prioritas || 'Sedang'}
                  onChange={(e) => setPrioritas(e.target.value as BugPrioritas)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 text-xs cursor-pointer"
                >
                  <option value="Rendah">🟢 Rendah (Kosmetik/Koreksi Teks)</option>
                  <option value="Sedang">🟡 Sedang (Fitur masih bisa dipakai)</option>
                  <option value="Tinggi">🟠 Tinggi (Fitur penting terganggu)</option>
                  <option value="Kritis">🔴 Kritis (Aplikasi macet / data terancam)</option>
                </select>
              </div>

              {/* Modul / Halaman Terkait */}
              <div className="space-y-1.5">
                <label className="block font-semibold text-slate-700 dark:text-slate-200">Modul / Halaman</label>
                <input
                  type="text"
                  list="modul-list"
                  value={halamanTerkait || ''}
                  onChange={(e) => setHalamanTerkait(e.target.value)}
                  placeholder="Pilih atau ketik modul..."
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-xs"
                />
                <datalist id="modul-list">
                  {MODUL_OPTIONS.map((m) => (
                    <option key={m} value={m} />
                  ))}
                </datalist>
              </div>
            </div>

            {/* Deskripsi Masalah Lengkap */}
            <div className="space-y-1.5">
              <label className="block font-semibold text-slate-700 dark:text-slate-200">
                Deskripsi Detail Masalah <span className="text-rose-500">*</span>
              </label>
              <textarea
                required
                rows={3}
                value={deskripsi || ''}
                onChange={(e) => setDeskripsi(e.target.value)}
                placeholder="Jelaskan secara rinci apa yang terjadi, perilaku yang salah, dan apa yang seharusnya diharapkan..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-xs resize-y"
              />
            </div>

            {/* Langkah-langkah Reproduksi & Pesan Error */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="block font-semibold text-slate-700 dark:text-slate-200">Langkah Memicu Masalah (Opsional)</label>
                <textarea
                  rows={2}
                  value={langkahReproduksi || ''}
                  onChange={(e) => setLangkahReproduksi(e.target.value)}
                  placeholder="1. Buka halaman Keuangan&#10;2. Klik tombol cetak..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-xs resize-y"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block font-semibold text-slate-700 dark:text-slate-200">Pesan Error / Kode Kesalahan (Opsional)</label>
                <textarea
                  rows={2}
                  value={pesanError || ''}
                  onChange={(e) => setPesanError(e.target.value)}
                  placeholder="Salin teks error atau pesan peringatan jika ada..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-xs font-mono resize-y"
                />
              </div>
            </div>

            {/* Unggah Screenshot / Bukti Foto */}
            <div className="space-y-1.5">
              <label className="block font-semibold text-slate-700 dark:text-slate-200">Tangkapan Layar / Bukti Gambar (Opsional)</label>
              {lampiranUrl ? (
                <div className="relative inline-block border border-slate-300 dark:border-slate-700 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-950 p-1 group">
                  <img
                    src={lampiranUrl}
                    alt="Screenshot Bug"
                    className="max-h-36 max-w-full rounded-lg object-contain"
                  />
                  <button
                    type="button"
                    onClick={() => setLampiranUrl('')}
                    className="absolute top-2 right-2 p-1.5 rounded-lg bg-rose-600/90 text-white hover:bg-rose-700 transition cursor-pointer shadow-md"
                    title="Hapus gambar"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center p-3.5 border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-500 rounded-xl bg-slate-50 dark:bg-slate-950/60 hover:bg-slate-100 dark:hover:bg-slate-950 cursor-pointer transition">
                  <UploadCloud className="w-5 h-5 text-slate-400 mb-1" />
                  <span className="text-slate-700 dark:text-slate-300 font-medium">Klik untuk unggah screenshot atau bukti foto</span>
                  <span className="text-[10px] text-slate-500">Format PNG/JPG/WebP, maks 5 MB</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            {/* Identitas Pelapor */}
            <div className="p-3 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200 dark:border-slate-800/80 space-y-2">
              <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-semibold">
                <ShieldAlert className="w-3.5 h-3.5 text-indigo-500" />
                <span>Identitas Pelapor</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <input
                  type="text"
                  required
                  value={namaPelapor || ''}
                  onChange={(e) => setNamaPelapor(e.target.value)}
                  placeholder="Nama Lengkap *"
                  className="px-2.5 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-indigo-500"
                />
                <input
                  type="email"
                  value={emailPelapor || ''}
                  onChange={(e) => setEmailPelapor(e.target.value)}
                  placeholder="Email (opsional)"
                  className="px-2.5 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-indigo-500"
                />
                <input
                  type="tel"
                  value={noHpPelapor || ''}
                  onChange={(e) => setNoHpPelapor(e.target.value)}
                  placeholder="No. WhatsApp / HP"
                  className="px-2.5 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-bold flex items-center gap-2 shadow-lg shadow-rose-600/30 transition cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Mengirim Laporan...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Kirim Laporan Bug</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>,
    document.body
  );
};
