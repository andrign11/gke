import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Download,
  Share2,
  Check,
  Smartphone,
  Building2,
  ShieldCheck,
  Sparkles,
  Info,
  Clock,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { getQrisImageSource } from '../utils/qrisUtils';

interface QrisPaymentScreenProps {
  amount: number;
  merchantName?: string;
  orderId?: string;
  onBack?: () => void;
  onDownloadQr?: () => void;
  onShareQr?: () => void;
  onSuccessSimulated?: () => void;
  autoCheckSeconds?: number;
}

export const QrisPaymentScreen: React.FC<QrisPaymentScreenProps> = ({
  amount = 50000,
  merchantName,
  orderId,
  onBack,
  onDownloadQr,
  onShareQr,
  onSuccessSimulated,
  autoCheckSeconds = 60,
}) => {
  const { settings } = useApp();
  const effectiveAutoCheckSeconds = autoCheckSeconds ?? settings.qrisAutoPollingDurationSeconds ?? 60;
  const [timeLeft, setTimeLeft] = useState<number>(effectiveAutoCheckSeconds);
  const [isInstructionOpen, setIsInstructionOpen] = useState<boolean>(true);
  const [activeInstructionTab, setActiveInstructionTab] = useState<'ewallet' | 'mbanking'>('ewallet');
  const [copiedToast, setCopiedToast] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);

  const displayMerchant = merchantName || settings.qrisMerchantName || settings.namaJemaat || 'MAJELIS JEMAAT GKE';
  const displayOrderId = orderId || `QRIS-GOPAY-${Date.now().toString().slice(-6)}`;
  const qrImageSrc = getQrisImageSource(settings, amount, displayOrderId);

  // Countdown timer calculation (HH : MM : SS)
  useEffect(() => {
    setTimeLeft(effectiveAutoCheckSeconds);
  }, [effectiveAutoCheckSeconds]);

  useEffect(() => {
    if (timeLeft <= 0) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [timeLeft]);

  const formatHHMMSS = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const hh = String(hours).padStart(2, '0');
    const mm = String(minutes).padStart(2, '0');
    const ss = String(seconds).padStart(2, '0');

    return `${hh} : ${mm} : ${ss}`;
  };

  // Canvas Image Download Handler
  const handleDownloadQrCode = async () => {
    if (onDownloadQr) {
      onDownloadQr();
      return;
    }

    setIsDownloading(true);
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 600;
      canvas.height = 780;
      const ctx = canvas.getContext('2d');

      if (ctx) {
        // Background card
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, 600, 780);

        // Header Background
        ctx.fillStyle = '#EE002D';
        ctx.fillRect(0, 0, 600, 80);

        // QRIS Text Header
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 28px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('QRIS NATIONAL PAYMENT', 300, 50);

        // Merchant Name
        ctx.fillStyle = '#1E293B';
        ctx.font = 'bold 20px sans-serif';
        ctx.fillText(displayMerchant.toUpperCase(), 300, 120);

        ctx.fillStyle = '#64748B';
        ctx.font = '14px sans-serif';
        ctx.fillText(`NMID: ${settings.qrisNmid || 'ID1020038491029'} • ${displayOrderId}`, 300, 145);

        // Load QR Code Image
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = qrImageSrc;

        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = () => {
            // Fallback image source if crossOrigin fails
            img.src = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&ecc=M&qzone=1&data=https%3A%2F%2Fgopay.co.id%2Ftransfer`;
            img.onload = resolve;
            img.onerror = reject;
          };
        });

        // Draw QR Image inside card
        ctx.drawImage(img, 100, 170, 400, 400);

        // Amount Box
        ctx.fillStyle = '#F8FAFC';
        ctx.fillRect(50, 600, 500, 90);
        ctx.strokeStyle = '#E2E8F0';
        ctx.lineWidth = 2;
        ctx.strokeRect(50, 600, 500, 90);

        ctx.fillStyle = '#475569';
        ctx.font = 'bold 14px sans-serif';
        ctx.fillText('TOTAL PERSEMBAHAN', 300, 630);

        ctx.fillStyle = '#059669';
        ctx.font = 'bold 28px monospace';
        ctx.fillText(`Rp ${amount.toLocaleString('id-ID')}`, 300, 668);

        // Footer text
        ctx.fillStyle = '#94A3B8';
        ctx.font = '12px sans-serif';
        ctx.fillText('Dicetak otomatis oleh Sistem Informasi Gereja GKE', 300, 745);

        // Download trigger
        const dataUrl = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = `QRIS-Persembahan-${displayOrderId}.png`;
        link.href = dataUrl;
        link.click();

        setCopiedToast('QR Code berhasil diunduh!');
        setTimeout(() => setCopiedToast(null), 2500);
      }
    } catch (err) {
      console.warn('Canvas download fallback:', err);
      // Fallback direct open/download
      const link = document.createElement('a');
      link.href = qrImageSrc;
      link.target = '_blank';
      link.download = `QRIS-${displayOrderId}.png`;
      link.click();
    } finally {
      setIsDownloading(false);
    }
  };

  // Share Handler
  const handleShare = async () => {
    if (onShareQr) {
      onShareQr();
      return;
    }

    const shareData = {
      title: `QRIS Persembahan - ${displayMerchant}`,
      text: `Persembahan Digital GKE sebesar Rp ${amount.toLocaleString('id-ID')} via QRIS (${displayOrderId})`,
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.warn('Share cancelled', err);
      }
    } else {
      navigator.clipboard.writeText(`Scan QRIS Persembahan ${displayMerchant}: Rp ${amount.toLocaleString('id-ID')} (Ref: ${displayOrderId})`);
      setCopiedToast('Tautan QRIS berhasil disalin!');
      setTimeout(() => setCopiedToast(null), 2500);
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto bg-slate-100 min-h-screen sm:min-h-0 sm:rounded-3xl overflow-hidden text-slate-900 shadow-2xl border border-slate-200 font-sans flex flex-col">
      {/* Toast Notification */}
      {copiedToast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white text-xs font-bold px-4 py-2.5 rounded-full shadow-2xl border border-slate-700 flex items-center gap-2 animate-bounce">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{copiedToast}</span>
        </div>
      )}

      {/* Screen Header */}
      <div className="bg-white border-b border-slate-200 px-4 py-3.5 sticky top-0 z-20 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="p-1.5 rounded-full hover:bg-slate-100 text-slate-700 transition-colors cursor-pointer"
              aria-label="Kembali"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight leading-tight">
              Metode Pembayaran
            </h2>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">
              QRIS
            </p>
          </div>
        </div>

        {/* Brand Tag / NMID Badge */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[10px] font-black font-mono text-emerald-800 uppercase tracking-tight">QRIS DINAMIS • GPN</span>
        </div>
      </div>

      {/* Main Body */}
      <div className="p-4 sm:p-6 space-y-4 flex-1 overflow-y-auto">
        {/* Card 1: Main QR Code Container */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-sm flex flex-col items-center text-center">
          <p className="text-xs font-bold text-slate-500 mb-2">
            Pindai QR Code Dinamis di bawah dengan aplikasi Bank / e-Wallet
          </p>
          <div className="inline-flex items-center gap-1.5 bg-emerald-100/80 text-emerald-800 px-3 py-1 rounded-full text-[11px] font-extrabold mb-4 border border-emerald-300/80">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>Nominal Rp {amount.toLocaleString('id-ID')} Otomatis Terkunci di QR</span>
          </div>

          {/* Official QRIS Logo Badge */}
          <div className="mb-4 inline-flex items-center justify-center px-4 py-1.5 bg-white border border-slate-300 rounded-lg shadow-2xs">
            <div className="flex items-center gap-1.5">
              <span className="text-lg font-black tracking-tighter text-slate-900 italic font-serif">
                QRIS
              </span>
              <span className="text-[9px] font-black text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-300 uppercase">
                DINAMIS
              </span>
            </div>
          </div>

          {/* QR Code Image Container */}
          <div className="relative p-3 bg-white border-2 border-slate-900 rounded-2xl shadow-md w-60 h-60 sm:w-64 sm:h-64 flex items-center justify-center">
            <img
              src={qrImageSrc}
              alt="QRIS Payment Code"
              className="w-full h-full object-contain rounded-lg"
              onError={(e) => {
                e.currentTarget.src = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&ecc=M&qzone=1&data=${encodeURIComponent('https://gopay.co.id/transfer')}`;
              }}
            />
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 w-full flex items-center justify-between text-xs text-slate-500">
            <span className="font-medium text-slate-600">Merchant</span>
            <span className="font-bold text-slate-900 truncate max-w-[180px]">
              {displayMerchant}
            </span>
          </div>
        </div>

        {/* Card 2: Countdown Timer Banner */}
        <div className="bg-[#FFF8EE] border border-[#FBEAD2] rounded-2xl p-4 text-center shadow-xs">
          <p className="text-sm font-medium text-slate-700">
            Selesaikan pembayaran dalam
          </p>
          <div className="text-2xl sm:text-3xl font-black font-mono tracking-widest text-slate-900 mt-1">
            {formatHHMMSS(autoCheckSeconds !== undefined ? autoCheckSeconds : timeLeft)}
          </div>
        </div>

        {/* Card 3: Total Bayar Row */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Total Bayar</span>
            <span className="text-base font-extrabold text-slate-900">
              Rp {amount.toLocaleString('id-ID')}
            </span>
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
            <span className="text-slate-500">ID Referensi</span>
            <span className="font-mono font-bold text-slate-700">{displayOrderId}</span>
          </div>
        </div>

        {/* Card 4: Collapsible Instructions Section */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
          <button
            type="button"
            onClick={() => setIsInstructionOpen(!isInstructionOpen)}
            className="w-full px-4 py-3.5 flex items-center justify-between text-left font-bold text-sm text-slate-900 hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <span>Instruksi Pembayaran</span>
            {isInstructionOpen ? (
              <ChevronUp className="w-5 h-5 text-slate-500" />
            ) : (
              <ChevronDown className="w-5 h-5 text-slate-500" />
            )}
          </button>

          {isInstructionOpen && (
            <div className="px-4 pb-4 border-t border-slate-100 text-xs text-slate-600 space-y-3 pt-3">
              {/* Instruction Subtabs */}
              <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                <button
                  type="button"
                  onClick={() => setActiveInstructionTab('ewallet')}
                  className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer ${
                    activeInstructionTab === 'ewallet'
                      ? 'bg-rose-50 text-rose-600 border border-rose-200'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>GoPay / E-Wallet</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveInstructionTab('mbanking')}
                  className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer ${
                    activeInstructionTab === 'mbanking'
                      ? 'bg-rose-50 text-rose-600 border border-rose-200'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Building2 className="w-3.5 h-3.5" />
                  <span>m-Banking (BCA, Mandiri, BRI)</span>
                </button>
              </div>

              {activeInstructionTab === 'ewallet' ? (
                <ol className="list-decimal list-inside space-y-2 text-slate-700 leading-relaxed pl-1">
                  <li>
                    Buka aplikasi <strong className="text-slate-900">GoPay, OVO, DANA, ShopeePay</strong>, atau <strong className="text-slate-900">LinkAja</strong>.
                  </li>
                  <li>
                    Pilih menu <strong className="text-slate-900">Bayar / Scan QRIS</strong>.
                  </li>
                  <li>
                    Arahkan kamera ke gambar QR code di atas, atau klik tombol <strong className="text-rose-600">Unduh QR Code</strong> lalu pilih opsi <strong className="text-slate-900">Upload dari Galeri HP</strong>.
                  </li>
                  <li>
                    Pastikan nama merchant tertera <strong className="text-slate-900">{displayMerchant}</strong> dan nominal <strong className="text-emerald-700 font-mono">Rp {amount.toLocaleString('id-ID')}</strong>.
                  </li>
                  <li>
                    Masukkan PIN e-wallet Anda. Transaksi akan terverifikasi secara otomatis oleh server.
                  </li>
                </ol>
              ) : (
                <ol className="list-decimal list-inside space-y-2 text-slate-700 leading-relaxed pl-1">
                  <li>
                    Buka aplikasi m-Banking (<strong className="text-slate-900">BCA Mobile, Livin' by Mandiri, BRImo, BNI Mobile</strong>, dll).
                  </li>
                  <li>
                    Pilih fitur <strong className="text-slate-900">QRIS / Scan QR</strong> pada beranda aplikasi m-Banking.
                  </li>
                  <li>
                    Scan QR code di atas secara langsung atau unggah hasil unduhan dari galeri Anda.
                  </li>
                  <li>
                    Konfirmasi penerima persembahan <strong className="text-slate-900">{displayMerchant}</strong> dan masukkan PIN m-Banking.
                  </li>
                </ol>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Fixed Bottom Action Buttons */}
      <div className="p-4 bg-white border-t border-slate-200 space-y-2.5 sm:rounded-b-3xl">
        <button
          type="button"
          onClick={handleDownloadQrCode}
          disabled={isDownloading}
          className="w-full py-3.5 rounded-full bg-[#EE002D] hover:bg-[#D00027] text-white font-bold text-sm transition-all shadow-md active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
        >
          <Download className="w-4 h-4" />
          <span>{isDownloading ? 'Mengunduh QR Code...' : 'Unduh QR Code'}</span>
        </button>

        <button
          type="button"
          onClick={handleShare}
          className="w-full py-3.5 rounded-full bg-white hover:bg-slate-50 border-2 border-[#EE002D] text-[#EE002D] font-bold text-sm transition-all active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer"
        >
          <Share2 className="w-4 h-4" />
          <span>Bagikan QR Code</span>
        </button>
      </div>
    </div>
  );
};
