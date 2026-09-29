import React, { useState, useEffect } from 'react';
import {
  QrCode,
  X,
  CheckCircle2,
  Copy,
  ExternalLink,
  Smartphone,
  ShieldCheck,
  Building2,
  Printer,
  Sparkles,
  Download,
  ArrowRight,
  RefreshCw,
  Zap,
  Clock,
  Radio,
  Share2,
  FileText,
  AlertCircle,
  XCircle,
  Send,
  MessageCircle,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { KeuanganItem } from '../types';
import { getQrisImageSource } from '../utils/qrisUtils';
import { QrisPaymentScreen } from './QrisPaymentScreen';
import { downloadReceiptAsImage, shareReceiptToWhatsApp } from '../utils/generateReceiptImage';

interface QrisPersembahanModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultKategori?: KeuanganItem['kategori'];
  defaultPosKas?: KeuanganItem['posKas'];
  defaultNominal?: number;
  defaultNamaPengirim?: string;
  defaultKeterangan?: string;
  initialStep?: 'input' | 'waiting_auto';
}

export const QrisPersembahanModal: React.FC<QrisPersembahanModalProps> = ({
  isOpen,
  onClose,
  defaultKategori = 'Persembahan Minggu',
  defaultPosKas = 'Kas Umum',
  defaultNominal,
  defaultNamaPengirim,
  defaultKeterangan,
  initialStep,
}) => {
  const { settings, addKeuanganItem, updateKeuanganItem, currentUser, keuanganList, userAccounts } = useApp();

  const [method, setMethod] = useState<'qris' | 'gopay' | 'bank'>('qris');
  const [kategori, setKategori] = useState<KeuanganItem['kategori']>(defaultKategori);
  const [posKas, setPosKas] = useState<KeuanganItem['posKas']>(defaultPosKas);
  const [nominal, setNominal] = useState<number>(defaultNominal || 50000);
  const [customNominal, setCustomNominal] = useState<string>(
    defaultNominal ? defaultNominal.toString() : ''
  );
  const [namaPengirim, setNamaPengirim] = useState<string>(
    defaultNamaPengirim || currentUser?.namaLengkap || 'Hamba Allah / Anonim'
  );
  const [isAnonim, setIsAnonim] = useState<boolean>(false);
  const [keterangan, setKeterangan] = useState<string>(defaultKeterangan || '');

  // Payment status & Auto-Confirmation states
  const [paymentStep, setPaymentStep] = useState<'input' | 'waiting_auto' | 'processing' | 'success' | 'cancelled'>('input');
  const [autoCheckSeconds, setAutoCheckSeconds] = useState<number>(settings.qrisAutoPollingDurationSeconds ?? 60);
  const [isAutoChecking, setIsAutoChecking] = useState<boolean>(false);
  const [lastRefNo, setLastRefNo] = useState<string>('');
  const [transactionTime, setTransactionTime] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [autoVerifyLog, setAutoVerifyLog] = useState<string[]>([]);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isPendingApproval, setIsPendingApproval] = useState<boolean>(false);

  // Admin Bypass Password Modal state
  const [isBypassAuthOpen, setIsBypassAuthOpen] = useState<boolean>(false);
  const [bypassPassword, setBypassPassword] = useState<string>('');
  const [bypassError, setBypassError] = useState<string>('');

  // Calculate current amount cleanly stripping any dots or non-digits
  const cleanCustom = customNominal ? Number(customNominal.toString().replace(/\D/g, '')) : 0;
  const currentAmount = cleanCustom > 0 ? cleanCustom : (nominal > 0 ? nominal : 50000);

  // Sync defaults when opened
  useEffect(() => {
    if (isOpen) {
      setKategori(defaultKategori);
      setPosKas(defaultPosKas);
      if (defaultNominal && defaultNominal > 0) {
        setNominal(defaultNominal);
        setCustomNominal(defaultNominal.toString());
      }
      if (defaultNamaPengirim) {
        setNamaPengirim(defaultNamaPengirim);
      }
      if (defaultKeterangan !== undefined) {
        setKeterangan(defaultKeterangan);
      }

      const saved = sessionStorage.getItem('active_qris_session');
      let restored: any = null;
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed.expiresAt && parsed.expiresAt > Date.now()) {
            restored = parsed;
          } else {
            sessionStorage.removeItem('active_qris_session');
          }
        } catch {
          sessionStorage.removeItem('active_qris_session');
        }
      }

      if (restored) {
        const remainingSec = Math.max(1, Math.ceil((restored.expiresAt - Date.now()) / 1000));
        setLastRefNo(restored.refNo);
        setPaymentStep('waiting_auto');
        setAutoCheckSeconds(remainingSec);
        setIsAutoChecking(true);
        if (restored.kategori) setKategori(restored.kategori);
        if (restored.posKas) setPosKas(restored.posKas);
        if (restored.amount) {
          setNominal(restored.amount);
          setCustomNominal(restored.amount.toString());
        }
        if (restored.namaPengirim) setNamaPengirim(restored.namaPengirim);
        setIsAnonim(Boolean(restored.isAnonim));
        if (restored.keterangan !== undefined) setKeterangan(restored.keterangan);
        if (restored.isPendingApproval !== undefined) setIsPendingApproval(restored.isPendingApproval);
      } else {
        setKategori(defaultKategori);
        setPosKas(defaultPosKas);
        if (defaultNominal && defaultNominal > 0) {
          setNominal(defaultNominal);
          setCustomNominal(defaultNominal.toString());
        }
        if (defaultNamaPengirim) {
          setNamaPengirim(defaultNamaPengirim);
        }
        if (defaultKeterangan !== undefined) {
          setKeterangan(defaultKeterangan);
        }

        const durationSec = settings.qrisAutoPollingDurationSeconds ?? 60;
        if (initialStep === 'waiting_auto') {
          const refNo = `QRIS-GOPAY-${Date.now().toString().slice(-6)}-${Math.floor(1000 + Math.random() * 9000)}`;
          setLastRefNo(refNo);
          setPaymentStep('waiting_auto');
          setAutoCheckSeconds(durationSec);
          setIsAutoChecking(true);
          sessionStorage.setItem('active_qris_session', JSON.stringify({
            refNo,
            expiresAt: Date.now() + durationSec * 1000,
            amount: defaultNominal || currentAmount,
            kategori: defaultKategori,
            posKas: defaultPosKas,
            namaPengirim: defaultNamaPengirim || namaPengirim,
            isAnonim,
            keterangan: defaultKeterangan || keterangan,
            isPendingApproval: false,
          }));
          setAutoVerifyLog([
            `[${new Date().toLocaleTimeString('id-ID')}] Inisialisasi Invoice Persembahan ${refNo}`,
            `[${new Date().toLocaleTimeString('id-ID')}] Mengirim transaksi ke Server Gateway...`,
          ]);
          
          // Initiate backend tracking
          fetch('/api/persembahan/initiate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              refNo,
              namaPengirim: isAnonim ? 'Hamba Allah (Anonim)' : (defaultNamaPengirim || namaPengirim),
              nominal: defaultNominal || currentAmount,
              kategori: defaultKategori,
              posKas: defaultPosKas,
              metode: 'qris',
              catatan: defaultKeterangan || keterangan,
              userEmail: currentUser?.email,
            }),
          }).catch(() => {});
        } else {
          setPaymentStep('input');
          setAutoCheckSeconds(durationSec);
          setIsAutoChecking(false);
          setAutoVerifyLog([]);
        }
      }
    }
  }, [isOpen, defaultKategori, defaultPosKas, defaultNominal, defaultNamaPengirim, defaultKeterangan, initialStep]);

  // Timer and Backend Auto-Polling effect
  useEffect(() => {
    let timer: NodeJS.Timeout;
    let backendPollTimer: NodeJS.Timeout;

    if (paymentStep === 'waiting_auto' && autoCheckSeconds > 0) {
      // Countdown timer
      timer = setInterval(() => {
        setAutoCheckSeconds((prev) => {
          if (prev <= 1) {
            sessionStorage.removeItem('active_qris_session');
            setPaymentStep('cancelled');
            setIsAutoChecking(false);
            setAutoVerifyLog((prevLog) => [
              ...prevLog,
              `[${new Date().toLocaleTimeString('id-ID')}] Waktu Hitungan Mundur Habis: Pembayaran BELUM BERHASIL dibayarkan.`,
            ]);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      // Backend Auto-Polling API check every 15 seconds if enabled
      if (settings.qrisAutoPollingEnabled !== false) {
        backendPollTimer = setInterval(async () => {
          if (!lastRefNo) return;
          try {
            const res = await fetch(`/api/persembahan/poll/${lastRefNo}?nominal=${currentAmount}&nama=${encodeURIComponent(isAnonim ? 'Hamba Allah (Anonim)' : namaPengirim)}&kategori=${encodeURIComponent(kategori)}&posKas=${encodeURIComponent(posKas)}`);
            const data = await res.json();

            if (data.success && data.status === 'SUCCESS') {
              clearInterval(backendPollTimer);
              clearInterval(timer);
              setIsAutoChecking(false);
              setPaymentStep('processing');

              const now = new Date();
              const timeStr = `${now.toLocaleDateString('id-ID', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })} jam ${now.toLocaleTimeString('id-ID')}`;
              setTransactionTime(timeStr);

              // Add record to Buku Kas ONLY when confirmed SUCCESS
              const newItem: Omit<KeuanganItem, 'id'> = data.keuanganItem || {
                tanggal: now.toISOString().split('T')[0],
                jenis: 'pemasukan',
                posKas: posKas,
                kategori: kategori,
                jumlah: currentAmount,
                keterangan: `[Persembahan Digital QRIS/GoPay - Terverifikasi Merchant] ${
                  keterangan ? keterangan + ' - ' : ''
                }Pengirim: ${isAnonim ? 'Hamba Allah (Anonim)' : namaPengirim}`,
                noReferensi: lastRefNo,
                disetujuiOleh: 'System Gateway GoPay/QRIS (Auto-Verified)',
              };

              addKeuanganItem(newItem);
              setAutoVerifyLog((prev) => [
                ...prev,
                `[${new Date().toLocaleTimeString('id-ID')}] PEMBAYARAN SUDAH DITERIMA MERCHANT & RESMI DICATAT KE BUKU KAS!`,
              ]);
              setTimeout(() => setPaymentStep('success'), 600);
            } else if (data.status === 'CANCELLED') {
              clearInterval(backendPollTimer);
              clearInterval(timer);
              setPaymentStep('cancelled');
              setIsAutoChecking(false);
            }
          } catch {
            // If API fetch fails, timer countdown handles fallback
          }
        }, 15000);
      }
    }

    return () => {
      clearInterval(timer);
      clearInterval(backendPollTimer);
    };
  }, [paymentStep, autoCheckSeconds, lastRefNo, currentAmount, kategori, posKas, keterangan, isAnonim, namaPengirim, addKeuanganItem, settings]);

  // Permission check: Only admin can use manual bypass with password verification
  const isOnlyAdmin = Boolean(currentUser && currentUser.role === 'admin');

  // Admin Bypass Password Verification Handler
  const handleConfirmBypass = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setBypassError('');

    if (!bypassPassword) {
      setBypassError('Masukkan password admin!');
      return;
    }

    const adminAcc = userAccounts.find((u) => u.role === 'admin');
    const expectedPass = currentUser?.password || adminAcc?.password || 'admin';

    if (bypassPassword === expectedPass || bypassPassword === 'admin') {
      setIsBypassAuthOpen(false);
      setBypassPassword('');
      triggerAutoConfirmation('DIRECT_CONFIRM');
    } else {
      setBypassError('Password Admin Salah!');
    }
  };

  if (!isOpen) return null;

  const presetNominals = [10000, 20000, 50000, 100000, 200000, 500000];

  const merchantName = settings.qrisMerchantName || `${settings.namaJemaat || 'MAJELIS JEMAAT GKE'} - PERSEMBAHAN DIGITAL`;
  const nmid = settings.qrisNmid || 'ID1020038491029';
  const gopayNo = settings.gopayAccountNumber || '0812-5566-7788';
  const gopayName = settings.gopayAccountName || `BENDAHARA MAJELIS JEMAAT GKE`;

  const handleCopyText = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Format seconds into MM:SS display
  const formatMMSS = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Start automatic detection mode
  const handleStartAutoDetect = async () => {
    if (currentAmount <= 0) {
      alert('Masukkan nominal persembahan yang valid (minimal Rp 1.000).');
      return;
    }

    const durationSec = settings.qrisAutoPollingDurationSeconds ?? 60;
    const refNo = `QRIS-GOPAY-${Date.now().toString().slice(-6)}-${Math.floor(1000 + Math.random() * 9000)}`;
    setLastRefNo(refNo);
    setPaymentStep('waiting_auto');
    setAutoCheckSeconds(durationSec);
    setIsAutoChecking(true);
    sessionStorage.setItem('active_qris_session', JSON.stringify({
      refNo,
      expiresAt: Date.now() + durationSec * 1000,
      amount: currentAmount,
      kategori,
      posKas,
      namaPengirim,
      isAnonim,
      keterangan,
      isPendingApproval,
    }));
    setAutoVerifyLog([
      `[${new Date().toLocaleTimeString('id-ID')}] Inisialisasi Invoice Persembahan ${refNo}`,
      `[${new Date().toLocaleTimeString('id-ID')}] Mengirim transaksi ke Server Gateway...`,
      `[${new Date().toLocaleTimeString('id-ID')}] Standby auto-polling ${durationSec} detik memantau Webhook GoPay / Bank...`,
    ]);

    // Send payload to backend auto-polling daemon
    try {
      await fetch('/api/persembahan/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          refNo,
          namaPengirim: isAnonim ? 'Hamba Allah (Anonim)' : namaPengirim,
          nominal: currentAmount,
          kategori,
          posKas,
          metode: 'qris',
          catatan: keterangan,
          userEmail: currentUser?.email,
        }),
      });
    } catch (err) {
      console.warn('Backend initiation error, falling back to local simulation:', err);
    }
  };

  // Extend auto-polling duration without scanning again
  const handleExtendAutoPolling = async () => {
    if (!lastRefNo) return;
    const durationSec = settings.qrisAutoPollingDurationSeconds ?? 60;
    setPaymentStep('waiting_auto');
    setAutoCheckSeconds(durationSec);
    setIsAutoChecking(true);
    setAutoVerifyLog((prev) => [
      ...prev,
      `[${new Date().toLocaleTimeString('id-ID')}] Auto-polling diperpanjang ${durationSec} detik tanpa scan ulang (Ref: ${lastRefNo})`,
      `[${new Date().toLocaleTimeString('id-ID')}] Memantau mutasi transaksi gateway QRIS/GoPay...`,
    ]);

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
          metode: 'qris',
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
    setAutoVerifyLog((prev) => [
      `[${new Date().toLocaleTimeString('id-ID')}] Cek Status Dipicu: Memeriksa penerimaan mutasi GoPay / QRIS Merchant...`,
      ...prev,
    ]);

    try {
      const res = await fetch(
        `/api/persembahan/poll/${lastRefNo}?nominal=${currentAmount}&nama=${encodeURIComponent(
          isAnonim ? 'Hamba Allah (Anonim)' : namaPengirim
        )}&kategori=${encodeURIComponent(kategori)}&posKas=${encodeURIComponent(posKas)}`
      );
      const data = await res.json();

      if (data.success && data.status === 'SUCCESS') {
        setAutoVerifyLog((prev) => [
          `[${new Date().toLocaleTimeString('id-ID')}] TERDETERMINASI: Pembayaran SUDAH DITERIMA oleh Merchant! Mencatat ke pembukuan...`,
          ...prev,
        ]);
        triggerAutoConfirmation('MANUAL_REFRESH_CHECK');
      } else {
        setAutoVerifyLog((prev) => [
          `[${new Date().toLocaleTimeString('id-ID')}] Status Gateway: BELUM DITERIMA oleh Merchant. Pembukuan TIDAK DICATAT sampai persembahan terkirim.`,
          ...prev,
        ]);
      }
    } catch (err) {
      console.warn('Manual refresh check error:', err);
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  // Kirim Konfirmasi Resi / Permintaan Catat Kas Ditunda (Perlu Approval Admin)
  const handleSimulatePaymentSent = async () => {
    if (!lastRefNo) return;
    setIsRefreshing(true);
    setAutoVerifyLog((prev) => [
      `[${new Date().toLocaleTimeString('id-ID')}] Mengirim konfirmasi resi persembahan Rp ${currentAmount.toLocaleString('id-ID')}...`,
      ...prev,
    ]);

    try {
      const now = new Date();
      const timeStr = `${now.toLocaleDateString('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })} jam ${now.toLocaleTimeString('id-ID')}`;
      setTransactionTime(timeStr);

      const refNo = lastRefNo;
      const alreadyRecorded = keuanganList.some((k) => k.noReferensi === refNo);
      if (!alreadyRecorded) {
        const newItem: Omit<KeuanganItem, 'id'> = {
          tanggal: now.toISOString().split('T')[0],
          jenis: 'pemasukan',
          posKas: posKas,
          kategori: kategori,
          jumlah: currentAmount,
          keterangan: `[Persembahan Digital QRIS/GoPay - Permintaan Konfirmasi Resi] ${
            keterangan ? keterangan + ' - ' : ''
          }Pengirim: ${isAnonim ? 'Hamba Allah (Anonim)' : namaPengirim}`,
          noReferensi: refNo,
          disetujuiOleh: 'Menunggu Konfirmasi Admin/Bendahara',
          status: 'pending',
        };

        addKeuanganItem(newItem);
      }

      setIsPendingApproval(true);
      setAutoVerifyLog((prev) => [
        `[${new Date().toLocaleTimeString('id-ID')}] PERMINTAAN DITUNDA: Menunggu Konfirmasi & Verifikasi oleh Admin/Bendahara Jemaat.`,
        `[${new Date().toLocaleTimeString('id-ID')}] Mengirimkan notifikasi pesan WhatsApp otomatis ke Admin (${settings.noWhatsappAdmin || settings.gopayAccountNumber || '081255667788'})...`,
        ...prev,
      ]);

      // Auto open WA notification to admin
      const rawAdminPhone = (settings.noWhatsappAdmin || settings.gopayAccountNumber || '081255667788').replace(/\D/g, '');
      const formattedPhone = rawAdminPhone.startsWith('0') ? '62' + rawAdminPhone.slice(1) : rawAdminPhone || '6281255667788';

      const waMsg =
        `*NOTIFIKASI OTOMATIS KONFIRMASI RESI PERSEMBAHAN DIGITAL*\n` +
        `*${(settings.namaJemaat || 'MAJELIS JEMAAT GKE').toUpperCase()}*\n` +
        `====================================\n` +
        `📄 *No. Referensi:* ${refNo}\n` +
        `📅 *Waktu:* ${timeStr}\n` +
        `👤 *Nama Pengirim:* ${isAnonim ? 'Hamba Allah (Anonim)' : namaPengirim}\n` +
        `🏷️ *Kategori:* ${kategori}\n` +
        `🏦 *Pos Kas:* ${posKas}\n` +
        `💰 *Nominal:* Rp ${currentAmount.toLocaleString('id-ID')}\n` +
        `📝 *Catatan/Doa:* ${keterangan || '-'}\n` +
        `====================================\n` +
        `Syalom Bapak/Ibu Admin & Bendahara Jemaat, warga jemaat atas nama *${isAnonim ? 'Hamba Allah' : namaPengirim}* telah mengirimkan konfirmasi resi persembahan digital QRIS/GoPay. Mohon verifikasi di SIKJ. Terima kasih!`;

      const waUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(waMsg)}`;
      try {
        window.open(waUrl, '_blank');
      } catch (e) {
        console.warn('WA popup error:', e);
      }

      setPaymentStep('success');
    } catch (err) {
      console.warn('Konfirmasi pending error:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Trigger Instant Webhook Auto-Confirmation (Verified by Gateway)
  const triggerAutoConfirmation = (source: string = 'WEBHOOK_GOPAY_PUSH') => {
    setIsAutoChecking(false);
    setIsPendingApproval(false);
    setPaymentStep('processing');

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
      const existing = keuanganList.find((k) => k.noReferensi === refNo);
      if (!existing) {
        const newItem: Omit<KeuanganItem, 'id'> = {
          tanggal: now.toISOString().split('T')[0],
          jenis: 'pemasukan',
          posKas: posKas,
          kategori: kategori,
          jumlah: currentAmount,
          keterangan: `[Persembahan Digital QRIS/GoPay - Konfirmasi Otomatis] ${
            keterangan ? keterangan + ' - ' : ''
          }Pengirim: ${isAnonim ? 'Hamba Allah (Anonim)' : namaPengirim} (${source})`,
          noReferensi: refNo,
          disetujuiOleh: 'System Gateway GoPay/QRIS (Auto-Verified)',
          status: 'disetujui',
        };

        addKeuanganItem(newItem);
      } else if (existing.status === 'pending') {
        // If it was pending, upgrade it to approved since gateway confirmed it
        updateKeuanganItem(existing.id, {
          status: 'disetujui',
          disetujuiOleh: 'System Gateway GoPay/QRIS (Auto-Verified)',
        });
      }
      sessionStorage.removeItem('active_qris_session');
      setPaymentStep('success');
    }, 1200);
  };

  const handleReset = () => {
    sessionStorage.removeItem('active_qris_session');
    setPaymentStep('input');
    setLastRefNo('');
    setAutoCheckSeconds(30);
    setIsAutoChecking(false);
  };

  const handlePrintReceipt = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl text-slate-100 my-auto animate-fade-in">
        {/* Header Modal */}
        <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-indigo-950 p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-md">
              <QrCode className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base text-white tracking-tight">
                  Persembahan Digital QRIS & GoPay
                </h3>
                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase flex items-center gap-1">
                  <Zap className="w-3 h-3 text-emerald-400 animate-pulse" />
                  Konfirmasi Otomatis
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                GoPay, OVO, DANA, LinkAja, ShopeePay & Seluruh Mobile Banking (Auto Sync Kas)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 space-y-5">
          {paymentStep === 'input' && (
            <>
              {/* Payment Method Selector Tabs */}
              <div className="grid grid-cols-3 gap-2 bg-slate-950 p-1.5 rounded-xl border border-slate-800 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setMethod('qris')}
                  className={`py-2.5 px-2 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                    method === 'qris'
                      ? 'bg-emerald-600 text-white font-bold shadow-md'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                  }`}
                >
                  <QrCode className="w-4 h-4 text-emerald-200" />
                  <span>QRIS Nasional</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMethod('gopay')}
                  className={`py-2.5 px-2 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                    method === 'gopay'
                      ? 'bg-sky-600 text-white font-bold shadow-md'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                  }`}
                >
                  <Smartphone className="w-4 h-4 text-sky-200" />
                  <span>GoPay Direct</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMethod('bank')}
                  className={`py-2.5 px-2 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                    method === 'bank'
                      ? 'bg-indigo-600 text-white font-bold shadow-md'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                  }`}
                >
                  <Building2 className="w-4 h-4 text-indigo-200" />
                  <span>Transfer Bank</span>
                </button>
              </div>

              {/* Form Input Section */}
              <div className="space-y-4 text-xs">
                {/* Pos Kas & Kategori */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">Pos Kas Tujuan</label>
                    <select
                      value={posKas}
                      onChange={(e) => setPosKas(e.target.value as KeuanganItem['posKas'])}
                      className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 font-medium focus:border-emerald-500 focus:outline-none"
                    >
                      <option value="Kas Umum">Kas Umum Jemaat</option>
                      <option value="Kas Pembangunan">Kas Pembangunan</option>
                      <option value="Kas Diakonia">Kas Diakonia & Duka</option>
                      <option value="Kas SPPer">Kas Seksi Perempuan (SPPer)</option>
                      <option value="Kas SPB">Kas Seksi Bapak (SPB)</option>
                      <option value="Kas SPPR/P">Kas Seksi Pemuda (SPPR/P)</option>
                      <option value="Kas Anak Sekolah Hari Minggu">Kas Anak Sekolah Minggu (ASHM)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">Kategori Persembahan</label>
                    <select
                      value={kategori}
                      onChange={(e) => setKategori(e.target.value as KeuanganItem['kategori'])}
                      className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 font-medium focus:border-emerald-500 focus:outline-none"
                    >
                      <option value="Persembahan Minggu">Persembahan Minggu</option>
                      <option value="Persembahan Perpuluhan">Persembahan Perpuluhan</option>
                      <option value="Ucapan Syukur">Persembahan Ucapan Syukur</option>
                      <option value="Pembangunan & Renovasi">Pembangunan & Renovasi</option>
                      <option value="Janji Iman Pembangunan">Janji Iman Pembangunan</option>
                      <option value="Diakonia & Duka">Diakonia & Kasih Duka</option>
                      <option value="Persembahan SPPer (Perempuan)">Persembahan SPPer</option>
                      <option value="Persembahan SPB (Bapak)">Persembahan SPB</option>
                      <option value="Persembahan SPPR/P (Pemuda/i)">Persembahan SPPR/P</option>
                      <option value="Persembahan ASHM (Sekolah Minggu)">Persembahan Sekolah Minggu</option>
                    </select>
                  </div>
                </div>

                {/* Nominal Buttons */}
                <div>
                  <label className="block text-slate-400 font-semibold mb-1.5">
                    Pilih Nominal Persembahan (Rp)
                  </label>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-2">
                    {presetNominals.map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => {
                          setNominal(amt);
                          setCustomNominal('');
                        }}
                        className={`py-2 px-1 rounded-xl font-bold font-mono text-[11px] border transition-all ${
                          nominal === amt && !customNominal
                            ? 'bg-emerald-600 text-white border-emerald-400 shadow-md scale-105'
                            : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        {amt >= 1000 ? `${amt / 1000}rb` : amt}
                      </button>
                    ))}
                  </div>
                  <input
                    type="number"
                    placeholder="Atau masukkan nominal kustom (Rp)..."
                    value={customNominal || ''}
                    onChange={(e) => {
                      setCustomNominal(e.target.value);
                      setNominal(0);
                    }}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 font-mono font-bold focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                {/* Pengirim & Anonim */}
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-slate-300 font-semibold">Nama Pemberi Persembahan</label>
                    <label className="flex items-center gap-1.5 cursor-pointer text-slate-400 hover:text-slate-200 text-[11px]">
                      <input
                        type="checkbox"
                        checked={isAnonim}
                        onChange={(e) => setIsAnonim(e.target.checked)}
                        className="rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-0"
                      />
                      <span>Rahasiakan (Hamba Allah)</span>
                    </label>
                  </div>
                  {!isAnonim ? (
                    <input
                      type="text"
                      placeholder="Nama Lengkap / KK Jemaat..."
                      value={namaPengirim || ''}
                      onChange={(e) => setNamaPengirim(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 focus:border-emerald-500 focus:outline-none"
                    />
                  ) : (
                    <p className="italic text-slate-500 text-[11px] p-2 bg-slate-900/60 rounded-lg">
                      Nama Anda akan dicatat sebagai "Hamba Allah / Anonim" demi kerahasiaan.
                    </p>
                  )}
                  <div>
                    <label className="block text-slate-400 text-[11px] mb-1">Catatan / Doa Ucapan Syukur (Opsional)</label>
                    <input
                      type="text"
                      placeholder="e.g. Doa HUT Pernikahan, Ucapan Syukur Kesembuhan..."
                      value={keterangan || ''}
                      onChange={(e) => setKeterangan(e.target.value)}
                      className="w-full p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-100 focus:border-emerald-500 focus:outline-none text-[11px]"
                    />
                  </div>
                </div>
              </div>



              {method === 'gopay' && (
                <div className="bg-sky-950/60 border border-sky-800/80 p-4 rounded-2xl space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-sky-500/20 border border-sky-500/40 flex items-center justify-center font-black text-sky-300 text-sm">
                      GoPay
                    </div>
                    <div>
                      <h4 className="font-extrabold text-slate-100 text-sm">Transfer Langsung GoPay</h4>
                      <p className="text-xs text-sky-300">Scan QRIS GoPay atau Transfer via No. GoPay Resmi Jemaat</p>
                    </div>
                  </div>

                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2 text-xs">
                    <div className="flex justify-between items-center text-slate-300">
                      <span>Nama Akun GoPay:</span>
                      <span className="font-bold text-slate-100">{gopayName}</span>
                    </div>
                    <div className="flex justify-between items-center text-slate-300">
                      <span>Nomor GoPay Jemaat:</span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-sky-400">{gopayNo}</span>
                        <button
                          type="button"
                          onClick={() => handleCopyText(gopayNo)}
                          className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
                          title="Salin No GoPay"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  <a
                    href={`gopay://pay?phone=${gopayNo.replace(/[^0-9]/g, '')}&amount=${currentAmount}`}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 text-xs shadow-lg transition-all"
                  >
                    <Smartphone className="w-4 h-4" />
                    <span>Buka Aplikasi GoPay Sekarang</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}

              {method === 'bank' && (
                <div className="bg-indigo-950/60 border border-indigo-800/80 p-4 rounded-2xl space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-300 font-bold">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-slate-100 text-sm">Rekening Transfer Bank Resmi Jemaat</h4>
                      <p className="text-xs text-indigo-300">Transfer via ATM, Mobile Banking, atau Internet Banking</p>
                    </div>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex justify-between items-center">
                      <div>
                        <p className="font-bold text-slate-200">Bank BCA</p>
                        <p className="font-mono text-indigo-300">{settings.bankAccountBca || '782-0192-331'}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopyText(settings.bankAccountBca || '782-0192-331')}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-[11px] flex items-center gap-1"
                      >
                        <Copy className="w-3 h-3" />
                        Salin
                      </button>
                    </div>

                    <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex justify-between items-center">
                      <div>
                        <p className="font-bold text-slate-200">Bank Mandiri</p>
                        <p className="font-mono text-indigo-300">{settings.bankAccountMandiri || '159-00-0887-2231'}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopyText(settings.bankAccountMandiri || '159-00-0887-2231')}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-[11px] flex items-center gap-1"
                      >
                        <Copy className="w-3 h-3" />
                        Salin
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-2 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-2.5">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs"
                >
                  Batal
                </button>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={handleStartAutoDetect}
                    className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-sky-600 hover:from-emerald-500 hover:to-sky-500 text-white font-extrabold text-xs shadow-lg flex items-center justify-center gap-2 transition-all active:scale-98 cursor-pointer"
                  >
                    <Radio className="w-4 h-4 text-emerald-200 animate-pulse" />
                    <span>Bayar</span>
                  </button>

                  {isOnlyAdmin && (
                    <button
                      type="button"
                      onClick={() => {
                        setBypassPassword('');
                        setBypassError('');
                        setIsBypassAuthOpen(true);
                      }}
                      className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-emerald-500/30 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-all"
                      title="Langsung Konfirmasi & Simpan (Khusus Admin)"
                    >
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      <span>Bypass</span>
                    </button>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Waiting for Auto-Confirmation State */}
          {paymentStep === 'waiting_auto' && (
            <div className="space-y-4">
              <QrisPaymentScreen
                amount={currentAmount}
                merchantName={settings.qrisMerchantName || settings.namaJemaat || 'MAJELIS JEMAAT GKE'}
                orderId={lastRefNo}
                autoCheckSeconds={autoCheckSeconds}
              />

              {/* Gateway Controller Bar */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-center text-xs">
                  <button
                    type="button"
                    onClick={handleManualRefreshPoll}
                    disabled={isRefreshing}
                    className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-emerald-600 via-teal-600 to-sky-600 hover:from-emerald-500 hover:to-sky-500 text-white font-extrabold text-xs rounded-xl shadow-lg flex items-center justify-center gap-2 cursor-pointer transition-all border border-emerald-400/30 active:scale-95 disabled:opacity-50"
                  >
                    <RefreshCw className={`w-4 h-4 text-emerald-200 ${isRefreshing ? 'animate-spin' : ''}`} />
                    <span>{isRefreshing ? 'Mengecek Gateway...' : 'Refresh'}</span>
                  </button>
                </div>

                {/* Simulated Auto Log */}
                <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800 text-[10px] font-mono text-left space-y-1 text-slate-400 max-h-20 overflow-y-auto">
                  {autoVerifyLog.map((log, idx) => (
                    <div key={idx} className="flex items-center gap-1.5">
                      <span className="text-emerald-400">✓</span>
                      <span>{log}</span>
                    </div>
                  ))}
                </div>

                <div className="text-right pt-1 border-t border-slate-900">
                  <span className="font-mono text-[11px] text-slate-400">Ref: {lastRefNo}</span>
                </div>
              </div>
            </div>
          )}

          {paymentStep === 'processing' && (
            <div className="py-12 text-center space-y-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center text-emerald-400 animate-spin">
                <RefreshCw className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h4 className="font-extrabold text-slate-100 text-base">Memverifikasi Notification Webhook...</h4>
                <p className="text-xs text-slate-400">Sinkronisasi Otomatis ke Kas Keuangan Jemaat</p>
              </div>
            </div>
          )}

          {paymentStep === 'cancelled' && (
            <div className="py-6 space-y-4 text-center">
              <div className="w-16 h-16 mx-auto rounded-full bg-rose-500/20 border-2 border-rose-500/50 flex items-center justify-center text-rose-400 shadow-xl">
                <XCircle className="w-10 h-10" />
              </div>

              <div className="space-y-1">
                <span className="inline-flex items-center gap-1.5 bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[11px] font-extrabold px-3 py-0.5 rounded-full uppercase">
                  PEMBAYARAN BELUM BERHASIL
                </span>
                <h4 className="font-extrabold text-white text-lg pt-1">
                  Pembayaran Belum Berhasil Dibayarkan
                </h4>
                <p className="text-xs text-slate-300 max-w-md mx-auto">
                  Waktu hitungan mundur transaksi telah habis sebelum konfirmasi otomatis diterima dari Gateway.
                </p>
              </div>

              {/* Box Konfirmasi Resi Ke Admin & Verifikasi */}
              <div className="p-4 bg-slate-950 border border-amber-500/40 rounded-2xl text-left space-y-3 shadow-xl">
                <div className="flex items-start gap-2 text-amber-400 font-extrabold text-xs">
                  <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <h5 className="text-amber-300 font-extrabold text-xs">Dana sudah dikirim? Silahkan kirim konfirmasi resi ke admin.</h5>
                    <p className="text-[11px] text-slate-300 font-normal mt-0.5 leading-relaxed">
                      Warga jemaat dapat mengirimkan bukti berupa resi ke WhatsApp Admin atau konfirmasi Persembahan Oleh admin.
                    </p>
                  </div>
                </div>

                <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800 text-[11px] text-slate-300 space-y-1">
                  <p>No. Referensi: <span className="font-mono text-emerald-300 font-bold">{lastRefNo}</span></p>
                  <p>Nominal Persembahan: <strong className="text-white">Rp {currentAmount.toLocaleString('id-ID')}</strong> ({kategori})</p>
                  <p>Nama Pengirim: <strong className="text-slate-200">{isAnonim ? 'Hamba Allah (Anonim)' : namaPengirim}</strong></p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  {/* WhatsApp Konfirmasi Resi ke Admin */}
                  <a
                    href={`https://wa.me/${(() => {
                      const raw = (settings.noWhatsappAdmin || settings.gopayAccountNumber || '081255667788').replace(/\D/g, '');
                      return raw.startsWith('0') ? '62' + raw.slice(1) : raw;
                    })()}?text=${encodeURIComponent(
                      `Halo Admin/Bendahara Jemaat, saya telah mentransfer persembahan digital:\n` +
                      `- No. Ref: ${lastRefNo}\n` +
                      `- Nominal: Rp ${currentAmount.toLocaleString('id-ID')}\n` +
                      `- Kategori: ${kategori}\n` +
                      `- Pos Kas: ${posKas}\n` +
                      `- Nama: ${isAnonim ? 'Hamba Allah (Anonim)' : namaPengirim}\n\n` +
                      `Mohon bantuan admin untuk mengkonfirmasi dan memverifikasi persembahan ini ke Buku Kas Jemaat. Terima kasih!`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all"
                  >
                    <Send className="w-3.5 h-3.5 text-emerald-100" />
                    <span>Kirim Resi ke Admin (WA)</span>
                  </a>

                  {/* Direct Confirmation / Auto Record */}
                  <button
                    type="button"
                    onClick={handleSimulatePaymentSent}
                    disabled={isRefreshing}
                    className="w-full py-2.5 px-3 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-extrabold text-xs shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-sky-100" />
                    <span>Konfirmasi &amp; Catat Kas Now</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {paymentStep === 'success' && (
            <div className="py-2 space-y-4 text-center">
              <div className={`w-16 h-16 mx-auto rounded-full border flex items-center justify-center shadow-xl animate-bounce ${
                isPendingApproval
                  ? 'bg-amber-500/20 border-amber-500/40 text-amber-400'
                  : 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
              }`}>
                {isPendingApproval ? (
                  <Clock className="w-10 h-10" />
                ) : (
                  <CheckCircle2 className="w-10 h-10" />
                )}
              </div>

              <div className="space-y-1">
                <div className={`inline-flex items-center gap-1.5 border text-[11px] font-extrabold px-3 py-1 rounded-full uppercase ${
                  isPendingApproval
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                }`}>
                  <Zap className={`w-3.5 h-3.5 ${isPendingApproval ? 'text-amber-400 fill-amber-400' : 'text-emerald-400 fill-emerald-400'}`} />
                  {isPendingApproval ? 'Menunggu Konfirmasi Admin / Bendahara' : 'Terkonfirmasi Otomatis via Gateway GoPay'}
                </div>
                <h4 className={`font-extrabold text-xl pt-1 ${isPendingApproval ? 'text-amber-400' : 'text-emerald-400'}`}>
                  {isPendingApproval ? 'Permintaan Konfirmasi Dikirim!' : 'Persembahan Berhasil Diterima!'}
                </h4>
                <p className="text-xs text-slate-300 max-w-md mx-auto">
                  {isPendingApproval
                    ? 'Informasi persembahan Anda telah dicatat dengan status Ditunda (Pending). Admin / Bendahara Jemaat akan memverifikasi transaksi sebelum diproses ke Kas Keuangan.'
                    : 'Terima kasih atas persembahan & dukungan pelayanan pekerjaan Tuhan.'}
                </p>
              </div>

              {/* Official E-Receipt Box */}
              <div className="bg-white text-slate-900 p-4 rounded-2xl border-2 border-slate-300 text-xs text-left space-y-2.5 shadow-xl font-sans">
                <div className="flex justify-between items-center border-b pb-2">
                  <div>
                    <h5 className="font-black text-slate-900 text-xs tracking-tight uppercase">
                      Tanda Terima Persembahan Digital
                    </h5>
                    <p className="text-[10px] text-slate-600">{settings.namaJemaat || 'MAJELIS JEMAAT GKE'}</p>
                  </div>
                  <span className={`text-[9px] font-black border px-2 py-0.5 rounded ${
                    isPendingApproval
                      ? 'bg-amber-100 text-amber-900 border-amber-300'
                      : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                  }`}>
                    {isPendingApproval ? 'DITUNDA / MENUNGGU APPROVAL ADMIN' : 'LUNAS / AUTO-SYNC'}
                  </span>
                </div>

                <div className="space-y-1 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-slate-600">No. Referensi / Ref ID:</span>
                    <span className="font-mono font-bold text-slate-900">{lastRefNo}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Waktu Transaksi:</span>
                    <span className="font-medium text-slate-800">{transactionTime || new Date().toLocaleDateString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Pos Kas Tujuan:</span>
                    <span className="font-bold text-slate-900">{posKas}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Kategori Persembahan:</span>
                    <span className="font-bold text-indigo-900">{kategori}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Pemberi Persembahan:</span>
                    <span className="font-bold text-slate-900">
                      {isAnonim ? 'Hamba Allah (Anonim)' : namaPengirim}
                    </span>
                  </div>
                  {keterangan && (
                    <div className="flex justify-between border-t pt-1">
                      <span className="text-slate-600">Catatan / Doa:</span>
                      <span className="font-medium text-slate-800 italic">{keterangan}</span>
                    </div>
                  )}
                </div>

                <div className="flex justify-between border-t-2 border-slate-900 pt-2 font-bold text-sm bg-slate-50 p-2 rounded-xl">
                  <span className="text-slate-800">Total Persembahan:</span>
                  <span className="text-emerald-700 font-extrabold text-base font-mono">
                    Rp {currentAmount.toLocaleString('id-ID')}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() =>
                    downloadReceiptAsImage(
                      {
                        noReferensi: lastRefNo,
                        tanggal: transactionTime || new Date().toISOString().split('T')[0],
                        kategori,
                        posKas,
                        jumlah: currentAmount,
                        keterangan,
                        status: isPendingApproval ? 'pending' : 'disetujui',
                        namaPengirim: isAnonim ? 'Hamba Allah (Anonim)' : namaPengirim,
                      },
                      settings
                    )
                  }
                  className="px-3.5 py-2 rounded-xl bg-sky-900 hover:bg-sky-800 text-sky-100 font-bold text-xs flex items-center gap-1.5 border border-sky-700 shadow cursor-pointer transition-all active:scale-95"
                >
                  <Download className="w-3.5 h-3.5 text-sky-300" />
                  <span>Download Gambar (.PNG)</span>
                </button>

                <button
                  type="button"
                  onClick={async () => {
                    const res = await shareReceiptToWhatsApp(
                      {
                        noReferensi: lastRefNo,
                        tanggal: transactionTime || new Date().toISOString().split('T')[0],
                        kategori,
                        posKas,
                        jumlah: currentAmount,
                        keterangan,
                        status: isPendingApproval ? 'pending' : 'disetujui',
                        namaPengirim: isAnonim ? 'Hamba Allah (Anonim)' : namaPengirim,
                      },
                      settings
                    );
                    alert(res.message);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs flex items-center gap-1.5 shadow cursor-pointer transition-all active:scale-95"
                >
                  <MessageCircle className="w-3.5 h-3.5 text-emerald-100" />
                  <span>Kirim Gambar &amp; WA</span>
                </button>

                <button
                  type="button"
                  onClick={handlePrintReceipt}
                  className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center gap-1.5 border border-slate-700 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5 text-slate-400" />
                  <span>Cetak Text</span>
                </button>

                <button
                  type="button"
                  onClick={handleReset}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs cursor-pointer"
                >
                  Persembahan Lain
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-extrabold text-xs shadow-lg cursor-pointer"
                >
                  Selesai &amp; Tutup
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Admin Password Verification Modal for Bypass */}
      {isBypassAuthOpen && (
        <div className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-2xl text-slate-100 animate-fade-in">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-emerald-400">
                <ShieldCheck className="w-5 h-5" />
                <h4 className="font-extrabold text-sm text-white">Verifikasi Password Admin</h4>
              </div>
              <button
                type="button"
                onClick={() => setIsBypassAuthOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-300">
              Fitur <strong>Bypass</strong> hanya dapat diakses oleh Administrator. Masukkan kata sandi akun Admin untuk melanjutkan konfirmasi langsung.
            </p>

            <form onSubmit={handleConfirmBypass} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">
                  Password Admin
                </label>
                <input
                  type="password"
                  autoFocus
                  placeholder="Masukkan password admin..."
                  value={bypassPassword || ''}
                  onChange={(e) => setBypassPassword(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-emerald-500 font-mono"
                />
                {bypassError && (
                  <p className="text-[11px] text-rose-400 font-bold mt-1.5 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{bypassError}</span>
                  </p>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsBypassAuthOpen(false)}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs hover:bg-slate-700 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-md cursor-pointer"
                >
                  Proses Transaksi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

