import React, { useState, useEffect } from 'react';
import {
  QrCode,
  Smartphone,
  Building2,
  CheckCircle2,
  Zap,
  Clock,
  Radio,
  Printer,
  Search,
  Copy,
  Check,
  Sparkles,
  DollarSign,
  Filter,
  ShieldCheck,
  RefreshCw,
  Heart,
  ArrowRight,
  Share2,
  AlertCircle,
  FileText,
  XCircle,
  Webhook,
  Send,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { KeuanganItem } from '../../types';
import { getQrisImageSource } from '../../utils/qrisUtils';
import { QrisPaymentScreen } from '../QrisPaymentScreen';
import { ShareQrisModal } from '../ShareQrisModal';
import { QrisPersembahanModal } from '../QrisPersembahanModal';

export const PersembahanDigitalModule: React.FC = () => {
  const { settings, keuanganList, addKeuanganItem, updateKeuanganItem, openPrintReport, currentUser } = useApp();

  const isStaffOrAdmin = Boolean(currentUser && ['admin', 'bendahara', 'sekretaris'].includes(currentUser.role));

  const [isShareModalOpen, setIsShareModalOpen] = useState<boolean>(false);
  const [isQrisPopupOpen, setIsQrisPopupOpen] = useState<boolean>(false);

  // Auto-restore active QRIS session when opening Persembahan Digital view
  useEffect(() => {
    const saved = sessionStorage.getItem('active_qris_session');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.expiresAt && parsed.expiresAt > Date.now()) {
          setIsQrisPopupOpen(true);
        } else {
          sessionStorage.removeItem('active_qris_session');
        }
      } catch {
        sessionStorage.removeItem('active_qris_session');
      }
    }
  }, []);
  const [kategori, setKategori] = useState<KeuanganItem['kategori']>('Persembahan Minggu');
  const [posKas, setPosKas] = useState<KeuanganItem['posKas']>('Kas Umum');
  const [nominal, setNominal] = useState<number>(50000);
  const [customNominal, setCustomNominal] = useState<string>('50000');
  const [namaPengirim, setNamaPengirim] = useState<string>('Bapak / Ibu / Sdr');
  const [isAnonim, setIsAnonim] = useState<boolean>(false);
  const [keterangan, setKeterangan] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'qris' | 'gopay' | 'bank'>('qris');

  // Transaction Lifecycle
  const [paymentStep, setPaymentStep] = useState<'input' | 'waiting' | 'verifying' | 'success' | 'cancelled'>('input');
  const [autoSeconds, setAutoSeconds] = useState<number>(settings.qrisAutoPollingDurationSeconds ?? 60);
  const [lastRefNo, setLastRefNo] = useState<string>('');
  const [transactionTime, setTransactionTime] = useState<string>('');
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Filter State for History
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [posKasFilter, setPosKasFilter] = useState<string>('semua');

  // Effective nominal calculation stripping non-digits
  const cleanCustom = customNominal ? Number(customNominal.toString().replace(/\D/g, '')) : 0;
  const currentAmount = cleanCustom > 0 ? cleanCustom : (nominal > 0 ? nominal : 50000);

  // Preset Nominals
  const presetNominals = [10000, 20000, 50000, 100000, 200000, 500000, 1000000, 2000000];

  // Timer & Backend Auto-Polling Effect
  useEffect(() => {
    let timer: NodeJS.Timeout;
    let backendPollTimer: NodeJS.Timeout;

    if (paymentStep === 'waiting' && autoSeconds > 0) {
      // Countdown timer
      timer = setInterval(() => {
        setAutoSeconds((prev) => {
          if (prev <= 1) {
            setPaymentStep('cancelled');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      // Backend Auto-Polling API check every 20 seconds
      backendPollTimer = setInterval(async () => {
        if (!lastRefNo) return;
        try {
          const res = await fetch(`/api/persembahan/poll/${lastRefNo}?nominal=${currentAmount}&nama=${encodeURIComponent(isAnonim ? 'Hamba Allah (Anonim)' : namaPengirim)}&kategori=${encodeURIComponent(kategori)}&posKas=${encodeURIComponent(posKas)}`);
          const data = await res.json();

          if (data.success && data.status === 'SUCCESS') {
            clearInterval(backendPollTimer);
            clearInterval(timer);
            setPaymentStep('verifying');

            const now = new Date();
            const timeStr = `${now.toLocaleDateString('id-ID', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })} jam ${now.toLocaleTimeString('id-ID')}`;
            setTransactionTime(timeStr);

            const newItem: Omit<KeuanganItem, 'id'> = data.keuanganItem || {
              tanggal: now.toISOString().split('T')[0],
              jenis: 'pemasukan',
              posKas: posKas,
              kategori: kategori,
              jumlah: currentAmount,
              keterangan: `[Persembahan Digital - Terverifikasi Merchant] ${
                keterangan ? keterangan + ' - ' : ''
              }Pengirim: ${isAnonim ? 'Hamba Allah (Anonim)' : namaPengirim}`,
              noReferensi: lastRefNo,
              disetujuiOleh: 'Gateway GoPay / QRIS (Auto-Verified)',
            };

            addKeuanganItem(newItem);
            setTimeout(() => setPaymentStep('success'), 600);
          } else if (data.status === 'CANCELLED') {
            clearInterval(backendPollTimer);
            clearInterval(timer);
            setPaymentStep('cancelled');
          }
        } catch {
          // If API fetch fails, local client timer acts as fallback
        }
      }, 20000);
    }

    return () => {
      clearInterval(timer);
      clearInterval(backendPollTimer);
    };
  }, [paymentStep, autoSeconds, lastRefNo, currentAmount, kategori, posKas, keterangan, isAnonim, namaPengirim, addKeuanganItem]);

  // Format seconds into MM:SS display
  const formatMMSS = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const handleStartPayment = async () => {
    if (currentAmount <= 0) {
      alert('Masukkan nominal persembahan yang valid (minimal Rp 1.000).');
      return;
    }
    const durationSec = settings.qrisAutoPollingDurationSeconds ?? 60;
    const ref = `QRIS-GOPAY-${Date.now().toString().slice(-6)}-${Math.floor(1000 + Math.random() * 9000)}`;
    setLastRefNo(ref);
    setPaymentStep('waiting');
    setAutoSeconds(durationSec);

    // Register into backend auto-polling engine
    try {
      await fetch('/api/persembahan/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          refNo: ref,
          namaPengirim: isAnonim ? 'Hamba Allah (Anonim)' : namaPengirim,
          nominal: currentAmount,
          kategori,
          posKas,
          metode: paymentMethod,
          catatan: keterangan,
          userEmail: currentUser?.email,
        }),
      });
    } catch (err) {
      console.warn('Backend initiation error, falling back to local simulation:', err);
    }
  };

  // Extend auto-polling for 20 seconds without scanning again
  const handleExtendPayment = async () => {
    if (!lastRefNo) return;
    const durationSec = settings.qrisAutoPollingDurationSeconds ?? 60;
    setPaymentStep('waiting');
    setAutoSeconds(durationSec);

    try {
      await fetch('/api/persembahan/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          refNo: lastRefNo,
          namaPengirim: isAnonim ? 'Hamba Allah (Anonim)' : namaPengirim,
          nominal: currentAmount,
          kategori,
          posKas,
          metode: paymentMethod,
          catatan: keterangan,
          userEmail: currentUser?.email,
        }),
      });
    } catch (err) {
      console.warn('Backend extend error:', err);
    }
  };

  // Manual Refresh / Immediate Gateway Poll Check
  const handleManualRefreshPoll = async () => {
    if (!lastRefNo) return;
    setIsRefreshing(true);

    try {
      const res = await fetch(
        `/api/persembahan/poll/${lastRefNo}?nominal=${currentAmount}&nama=${encodeURIComponent(
          isAnonim ? 'Hamba Allah (Anonim)' : namaPengirim
        )}&kategori=${encodeURIComponent(kategori)}&posKas=${encodeURIComponent(posKas)}`
      );
      const data = await res.json();

      if (data.success && data.status === 'SUCCESS') {
        triggerAutoVerify('MANUAL_REFRESH_CHECK');
      } else {
        alert('Status Gateway: Belum Diterima. Pembayaran belum masuk ke GoPay/QRIS merchant. Aplikasi belum mencatat ke pembukuan.');
      }
    } catch (err) {
      console.warn('Manual refresh check error:', err);
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  // Kirim / Bayar Persembahan ke Merchant (GoPay / QRIS) Simulation
  const handleSimulatePaymentSent = async () => {
    if (!lastRefNo) return;
    setIsRefreshing(true);

    try {
      const res = await fetch('/api/persembahan/simulate-pay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refNo: lastRefNo, status: 'SUCCESS' }),
      });
      const data = await res.json();

      if (data.success && data.status === 'SUCCESS') {
        triggerAutoVerify('SIMULATE_PAYMENT_SENT');
      }
    } catch (err) {
      console.warn('Simulate payment error:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  const triggerAutoVerify = (source: string = 'WEBHOOK_GOPAY_PUSH') => {
    setPaymentStep('verifying');
    const now = new Date();
    const timeStr = `${now.toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })} jam ${now.toLocaleTimeString('id-ID')}`;
    setTransactionTime(timeStr);

    const refNo = lastRefNo || `GOPAY-AUTO-${Date.now().toString().slice(-6)}`;
    setLastRefNo(refNo);

    setTimeout(() => {
      // Deduplication Check: Prevent double recording if backend auto-sync already recorded this refNo
      const alreadyRecorded = keuanganList.some((k) => k.noReferensi === refNo);
      if (!alreadyRecorded) {
        const newItem: Omit<KeuanganItem, 'id'> = {
          tanggal: now.toISOString().split('T')[0],
          jenis: 'pemasukan',
          posKas: posKas,
          kategori: kategori,
          jumlah: currentAmount,
          keterangan: `[Persembahan Digital QRIS/GoPay - Auto Verified] ${
            keterangan ? keterangan + ' - ' : ''
          }Pengirim: ${isAnonim ? 'Hamba Allah (Anonim)' : namaPengirim} (${source})`,
          noReferensi: refNo,
          disetujuiOleh: 'Gateway GoPay / QRIS Auto-Verified',
        };

        addKeuanganItem(newItem);
      }
      setPaymentStep('success');
    }, 1200);
  };

  const handleResetForm = () => {
    setPaymentStep('input');
    setLastRefNo('');
    setAutoSeconds(30);
  };

  // Filter digital persembahan transactions from keuanganList
  const digitalTransactions = keuanganList.filter((item) => {
    const isDigital =
      item.keterangan.toLowerCase().includes('qris') ||
      item.keterangan.toLowerCase().includes('gopay') ||
      item.keterangan.toLowerCase().includes('digital') ||
      item.disetujuiOleh?.toLowerCase().includes('gateway') ||
      item.disetujuiOleh?.toLowerCase().includes('auto-verified');

    if (!isDigital) return false;

    const matchesSearch =
      item.keterangan.toLowerCase().includes(searchFilter.toLowerCase()) ||
      item.noReferensi.toLowerCase().includes(searchFilter.toLowerCase()) ||
      item.kategori.toLowerCase().includes(searchFilter.toLowerCase());

    const matchesPosKas = posKasFilter === 'semua' || item.posKas === posKasFilter;

    return matchesSearch && matchesPosKas;
  });

  const totalDigitalCollected = digitalTransactions
    .filter((item) => item.status !== 'pending' && item.status !== 'ditolak')
    .reduce((acc, curr) => acc + curr.jumlah, 0);

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-950 via-slate-900 to-indigo-950 p-6 md:p-8 text-white shadow-2xl border border-emerald-500/30">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-bold uppercase tracking-wider">
              <Zap className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400 animate-pulse" />
              <span>Sistem Konfirmasi Otomatis Active</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white">
              Halaman Persembahan Digital QRIS & GoPay
            </h1>
            <p className="text-slate-300 text-xs md:text-sm max-w-2xl leading-relaxed">
              Layanan persembahan & ucapan syukur digital {settings.namaJemaat || 'MAJELIS JEMAAT GKE'}. Transaksi secara otomatis terverifikasi dan langsung tercatat ke dalam Kas Keuangan Jemaat.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => openPrintReport({ reportType: 'keuangan_mingguan' })}
              className="px-4 py-2.5 rounded-2xl bg-slate-800/80 hover:bg-slate-800 text-slate-200 font-bold text-xs border border-slate-700/80 shadow-md flex items-center gap-2 transition"
            >
              <Printer className="w-4 h-4 text-emerald-400" />
              <span>Cetak Laporan Kas</span>
            </button>
            <button
              type="button"
              onClick={() => setIsShareModalOpen(true)}
              className="px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-lg flex items-center gap-2 transition"
            >
              <Share2 className="w-4 h-4" />
              <span>Bagikan QRIS Jemaat</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Form Work Area */}
      <div className="space-y-6">
        {/* Form Setup Persembahan */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 md:p-6 shadow-xl space-y-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                <Heart className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-white text-base">Form Persembahan & Ucapan Syukur</h3>
                <p className="text-xs text-slate-400">Pilih kategori, nominal, dan kirim persembahan digital</p>
              </div>
            </div>
            <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/80 px-2.5 py-1 rounded-lg border border-emerald-500/30">
              100% Real-time
            </span>
          </div>

          {/* Form Fields */}
          <div className="space-y-4">
            {/* Kategori Persembahan */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Kategori Persembahan <span className="text-emerald-400">*</span>
              </label>
              <select
                value={kategori}
                onChange={(e) => setKategori(e.target.value as KeuanganItem['kategori'])}
                className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 font-bold text-xs focus:outline-none focus:border-emerald-500"
              >
                <option value="Persembahan Minggu">Persembahan Minggu</option>
                <option value="Persembahan Perpuluhan">Persembahan Perpuluhan</option>
                <option value="Ucapan Syukur">Persembahan Ucapan Syukur</option>
                <option value="Pembangunan & Renovasi">Pembangunan & Renovasi Gereja</option>
                <option value="Diakonia & Duka">Diakonia & Kas Duka</option>
                <option value="Persembahan SPPer (Perempuan)">Persembahan SPPer (Perempuan)</option>
                <option value="Persembahan SPB (Bapak)">Persembahan SPB (Bapak)</option>
                <option value="Persembahan SPPR/P (Pemuda/i)">Persembahan SPPR/P (Pemuda/i)</option>
                <option value="Persembahan ASHM (Sekolah Minggu)">Persembahan ASHM (Sekolah Minggu)</option>
                <option value="Persembahan Kebaktian Lingkungan">Kebaktian Lingkungan / Sektor</option>
              </select>
            </div>

            {/* Pos Kas Tujuan */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Pos Kas Tujuan Pencatatan <span className="text-emerald-400">*</span>
              </label>
              <select
                value={posKas}
                onChange={(e) => setPosKas(e.target.value as KeuanganItem['posKas'])}
                className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 font-bold text-xs focus:outline-none focus:border-emerald-500"
              >
                <option value="Kas Umum">Kas Umum Jemaat</option>
                <option value="Kas Pembangunan">Kas Pembangunan</option>
                <option value="Kas Kupon">Kas Kupon / Bazar</option>
                <option value="Kas Diakonia">Kas Diakonia & Sosial</option>
                <option value="Kas SPPer">Kas SPPer (Perempuan)</option>
                <option value="Kas SPB">Kas SPB (Bapak)</option>
                <option value="Kas SPPR/P">Kas SPPR/P (Pemuda)</option>
                <option value="Kas Anak Sekolah Hari Minggu">Kas ASHM (Sekolah Minggu)</option>
              </select>
            </div>

            {/* Nominal Quick Buttons */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Pilih Nominal Persembahan (Rp)
              </label>
              <div className="grid grid-cols-4 gap-2 mb-2">
                {presetNominals.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => {
                      setNominal(preset);
                      setCustomNominal(preset.toString());
                    }}
                    className={`p-2.5 rounded-xl text-xs font-mono font-bold transition border ${
                      currentAmount === preset
                        ? 'bg-emerald-600 text-white border-emerald-400 shadow-lg scale-102'
                        : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                    }`}
                  >
                    {preset >= 1000000
                      ? `${preset / 1000000} Jt`
                      : `${preset / 1000}rb`}
                  </button>
                ))}
              </div>

              <div className="relative">
                <span className="absolute left-3 top-3 text-slate-400 font-mono text-sm font-bold">
                  Rp
                </span>
                <input
                  type="number"
                  value={customNominal}
                  onChange={(e) => {
                    setCustomNominal(e.target.value);
                    setNominal(Number(e.target.value) || 0);
                  }}
                  placeholder="Atau ketik nominal kustom..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-emerald-400 font-mono font-bold text-base focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Identitas Pemberi */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Nama Pemberi / Keluarga
                </label>
                <input
                  type="text"
                  disabled={isAnonim}
                  value={namaPengirim}
                  onChange={(e) => setNamaPengirim(e.target.value)}
                  placeholder="Nama Lengkap / Keluarga"
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-emerald-500 disabled:opacity-40"
                />
              </div>
              <div className="flex items-end pb-1">
                <label className="flex items-center gap-2 cursor-pointer p-2.5 rounded-xl bg-slate-950 border border-slate-800 w-full hover:border-slate-700">
                  <input
                    type="checkbox"
                    checked={isAnonim}
                    onChange={(e) => setIsAnonim(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 bg-slate-900 border-slate-700 focus:ring-emerald-500"
                  />
                  <span className="text-xs text-slate-300 font-bold">Sembunyikan (Hamba Allah)</span>
                </label>
              </div>
            </div>

            {/* Catatan / Doa */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Catatan / Pokok Doa (Opsional)
              </label>
              <textarea
                rows={2}
                value={keterangan}
                onChange={(e) => setKeterangan(e.target.value)}
                placeholder="Contoh: Ucapan syukur ulang tahun / Permohonan doa keluarga..."
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Action Button */}
            <button
              type="button"
              onClick={() => {
                handleStartPayment();
                setIsQrisPopupOpen(true);
              }}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-sky-600 hover:from-emerald-500 hover:to-sky-500 text-white font-extrabold text-sm shadow-xl flex items-center justify-center gap-2 transition-all active:scale-98 cursor-pointer"
            >
              <Send className="w-5 h-5 text-emerald-200" />
              <span>Kirim Persembahan</span>
              <ArrowRight className="w-4 h-4 text-emerald-200" />
            </button>
          </div>
        </div>
      </div>

      {/* Recent Digital Offerings History Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 md:p-6 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-emerald-400" />
              <h3 className="font-extrabold text-white text-base">
                Riwayat Persembahan Digital QRIS & GoPay Terverifikasi
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Seluruh transaksi persembahan digital yang berhasil diverifikasi secara otomatis
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-emerald-950/80 px-4 py-2 rounded-xl border border-emerald-500/30 text-right">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Persembahan Digital</span>
              <span className="text-emerald-400 font-mono font-extrabold text-base">
                Rp {totalDigitalCollected.toLocaleString('id-ID')}
              </span>
            </div>
          </div>
        </div>

        {/* Filters & Search */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Cari referensi, pengirim..."
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={posKasFilter}
              onChange={(e) => setPosKasFilter(e.target.value)}
              className="w-full sm:w-auto p-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 font-bold focus:outline-none focus:border-emerald-500"
            >
              <option value="semua">Semua Pos Kas</option>
              <option value="Kas Umum">Kas Umum</option>
              <option value="Kas Pembangunan">Kas Pembangunan</option>
              <option value="Kas Kupon">Kas Kupon</option>
              <option value="Kas Diakonia">Kas Diakonia</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-bold border-b border-slate-800">
              <tr>
                <th className="p-3">Tanggal</th>
                <th className="p-3">No. Referensi</th>
                <th className="p-3">Kategori</th>
                <th className="p-3">Pos Kas</th>
                <th className="p-3">Rincian / Pengirim</th>
                <th className="p-3 text-right">Nominal (Rp)</th>
                <th className="p-3 text-center">Status Verifikasi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {digitalTransactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">
                    <QrCode className="w-8 h-8 mx-auto mb-2 text-slate-600" />
                    Belum ada riwayat persembahan digital QRIS/GoPay.
                  </td>
                </tr>
              ) : (
                digitalTransactions.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-800/50 transition">
                    <td className="p-3 font-mono text-slate-400">{item.tanggal}</td>
                    <td className="p-3 font-mono font-bold text-sky-400">{item.noReferensi}</td>
                    <td className="p-3 font-semibold text-slate-200">{item.kategori}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 font-medium text-[11px]">
                        {item.posKas}
                      </span>
                    </td>
                    <td className="p-3 max-w-xs truncate text-slate-300">{item.keterangan}</td>
                    <td className="p-3 text-right font-mono font-bold text-emerald-400 text-sm">
                      Rp {item.jumlah.toLocaleString('id-ID')}
                    </td>
                    <td className="p-3 text-center whitespace-nowrap">
                      {item.status === 'pending' ? (
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-1.5">
                          <span className="inline-flex items-center gap-1 bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                            <Clock className="w-3 h-3 text-amber-400 animate-pulse" />
                            Ditunda (Perlu Admin)
                          </span>
                          {isStaffOrAdmin && (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() =>
                                  updateKeuanganItem(item.id, {
                                    status: 'disetujui',
                                    disetujuiOleh: currentUser?.namaLengkap || 'Admin',
                                  })
                                }
                                className="px-2 py-0.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[10px] font-bold transition-colors"
                                title="Setujui dan masukkan ke Kas Keuangan"
                              >
                                Setujui Kas
                              </button>
                              <button
                                onClick={() =>
                                  updateKeuanganItem(item.id, {
                                    status: 'ditolak',
                                    disetujuiOleh: 'Ditolak Admin',
                                  })
                                }
                                className="px-2 py-0.5 bg-rose-900/80 hover:bg-rose-800 text-rose-200 rounded text-[10px] font-bold transition-colors"
                                title="Tolak"
                              >
                                Tolak
                              </button>
                            </div>
                          )}
                        </div>
                      ) : item.status === 'ditolak' ? (
                        <span className="inline-flex items-center gap-1 bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[10px] font-bold px-2 py-0.5 rounded-full">
                          <XCircle className="w-3 h-3 text-rose-400" />
                          Ditolak Admin
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full">
                          <CheckCircle2 className="w-3 h-3" />
                          Kas Live
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

      {/* Modal Popup Bagikan QRIS */}
      <ShareQrisModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
      />

      {/* Modal Popup Kirim Persembahan / Barcode QRIS */}
      <QrisPersembahanModal
        isOpen={isQrisPopupOpen}
        onClose={() => setIsQrisPopupOpen(false)}
        defaultKategori={kategori}
        defaultPosKas={posKas}
        defaultNominal={currentAmount}
        defaultNamaPengirim={isAnonim ? 'Hamba Allah (Anonim)' : namaPengirim}
        defaultKeterangan={keterangan}
        initialStep="waiting_auto"
      />
    </div>
  );
};
