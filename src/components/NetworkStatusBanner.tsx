import React, { useState, useEffect, useCallback } from 'react';
import {
  Wifi,
  WifiOff,
  AlertTriangle,
  RefreshCw,
  X,
  CheckCircle2,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  CloudOff,
  Info,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export const NetworkStatusBanner: React.FC = () => {
  const { isOnline, checkConnection, isReconnecting } = useApp();
  const [showReconnectedAlert, setShowReconnectedAlert] = useState(false);
  const [wasOffline, setWasOffline] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [showTroubleshoot, setShowTroubleshoot] = useState(false);
  const [lastCheckMessage, setLastCheckMessage] = useState<string | null>(null);

  // Monitor online / offline transitions
  useEffect(() => {
    if (!isOnline) {
      setWasOffline(true);
      setIsDismissed(false); // Always re-show when going offline
      setShowReconnectedAlert(false);
    } else if (wasOffline && isOnline) {
      // Just came back online
      setShowReconnectedAlert(true);
      setIsDismissed(false);
      const timer = setTimeout(() => {
        setShowReconnectedAlert(false);
        setWasOffline(false);
      }, 6000);
      return () => clearTimeout(timer);
    }
  }, [isOnline, wasOffline]);

  const handleManualCheck = async () => {
    setLastCheckMessage('Memeriksa koneksi internet...');
    const online = await checkConnection();
    if (online) {
      setLastCheckMessage('Internet terhubung dengan baik!');
      setTimeout(() => setLastCheckMessage(null), 3000);
    } else {
      setLastCheckMessage('Masih offline. Periksa Wi-Fi atau kuota data Anda.');
      setTimeout(() => setLastCheckMessage(null), 4000);
    }
  };

  // 1. Back Online Alert Banner (Green Success Toast)
  if (showReconnectedAlert && isOnline) {
    return (
      <div
        id="network-reconnected-banner"
        className="w-full bg-emerald-600 text-white px-4 py-2.5 shadow-md flex items-center justify-between gap-3 text-xs z-50 animate-in slide-in-from-top-2 duration-300 print:hidden"
      >
        <div className="flex items-center gap-2.5 max-w-5xl mx-auto flex-1">
          <div className="p-1 bg-emerald-700/80 rounded-lg shrink-0">
            <CheckCircle2 className="w-4 h-4 text-emerald-100" />
          </div>
          <div className="flex-1">
            <span className="font-bold">Koneksi Internet Pulih Kembali!</span>{' '}
            <span className="opacity-90 hidden sm:inline">
              Perangkat Anda telah terhubung ke internet. Sinkronisasi data ke database Cloud Firestore aktif.
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowReconnectedAlert(false)}
          className="p-1 rounded-lg hover:bg-emerald-700 text-emerald-100 transition cursor-pointer"
          title="Tutup pemberitahuan"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  // 2. Offline Warning Banner (Red/Amber Alert)
  if (!isOnline && !isDismissed) {
    return (
      <div
        id="network-offline-banner"
        className="w-full bg-gradient-to-r from-rose-950 via-rose-900 to-amber-950 border-b-2 border-rose-600 text-white shadow-2xl z-50 print:hidden animate-in slide-in-from-top duration-300"
        style={{ color: '#ffffff' }}
      >
        <div className="max-w-7xl mx-auto px-4 py-3 sm:py-3.5">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
            {/* Left Info */}
            <div className="flex items-start gap-3 flex-1">
              <div className="p-2.5 rounded-xl bg-rose-900/90 border border-rose-400 text-rose-200 shrink-0 mt-0.5 animate-pulse shadow-sm">
                <CloudOff className="w-5 h-5 text-white" />
              </div>
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-black text-sm sm:text-base text-white flex items-center gap-1.5 drop-shadow-sm">
                    <span>⚠️ Perangkat Tidak Memiliki Koneksi Internet (Offline)</span>
                  </span>
                  <span className="text-[11px] bg-white text-rose-950 font-black px-2.5 py-0.5 rounded-full border border-rose-200 uppercase tracking-wider shadow-sm">
                    Data Tidak Tersimpan
                  </span>
                </div>
                <p className="text-xs text-white/95 leading-relaxed max-w-4xl font-normal drop-shadow-sm">
                  Sistem mendeteksi perangkat Anda terputus dari jaringan internet. Segala penambahan, perubahan data warga jemaat, transaksi kas keuangan, pendaftaran, atau jadwal ibadah <strong className="text-amber-200 font-black underline decoration-amber-400/80">tidak dapat tersimpan ke database server Firestore</strong> sampai internet Anda terhubung kembali.
                </p>
                {lastCheckMessage && (
                  <p className="text-xs font-mono font-bold text-amber-200 bg-black/60 border border-amber-500/40 px-2.5 py-1 rounded-lg inline-block">
                    {lastCheckMessage}
                  </p>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
              <button
                type="button"
                onClick={handleManualCheck}
                disabled={isReconnecting}
                className="flex items-center gap-1.5 bg-white hover:bg-amber-50 text-rose-950 px-4 py-2 rounded-xl font-black text-xs shadow-md border border-white transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                title="Cek ulang ketersediaan koneksi internet sekarang"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 text-rose-800 ${
                    isReconnecting ? 'animate-spin' : ''
                  }`}
                />
                <span>{isReconnecting ? 'Memeriksa...' : 'Cek Koneksi'}</span>
              </button>

              <button
                type="button"
                onClick={() => setShowTroubleshoot(!showTroubleshoot)}
                className="flex items-center gap-1.5 bg-rose-900/90 hover:bg-rose-800 text-white border border-rose-400/70 px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer shadow-sm"
                title="Petunjuk mengatasi koneksi terputus"
              >
                <HelpCircle className="w-3.5 h-3.5 text-amber-300" />
                <span className="hidden sm:inline">Petunjuk</span>
                {showTroubleshoot ? (
                  <ChevronUp className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
              </button>

              <button
                type="button"
                onClick={() => setIsDismissed(true)}
                className="p-2 rounded-xl bg-rose-900/80 hover:bg-rose-800 text-white border border-rose-400/60 transition cursor-pointer"
                title="Sembunyikan peringatan sementara"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Collapsible Troubleshooting Box */}
          {showTroubleshoot && (
            <div className="mt-3.5 pt-3.5 border-t border-rose-700/80 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-white animate-in fade-in duration-200">
              <div className="bg-rose-950/90 p-3 rounded-xl border border-rose-500/50 space-y-1 shadow-inner">
                <p className="font-extrabold text-amber-300 flex items-center gap-1.5 text-xs">
                  <span>1. Periksa Wi-Fi &amp; Data</span>
                </p>
                <p className="text-[11px] text-white/95 leading-normal font-medium">
                  Pastikan kabel LAN, router Wi-Fi, atau paket data seluler pada perangkat Anda aktif dan memiliki kuota internet.
                </p>
              </div>

              <div className="bg-rose-950/90 p-3 rounded-xl border border-rose-500/50 space-y-1 shadow-inner">
                <p className="font-extrabold text-amber-300 flex items-center gap-1.5 text-xs">
                  <span>2. Jangan Muat Ulang Halaman</span>
                </p>
                <p className="text-[11px] text-white/95 leading-normal font-medium">
                  Hindari menekan tombol *Refresh/F5* saat sedang mengisi formulir penting agar ketikan Anda tidak hilang sebelum internet pulih.
                </p>
              </div>

              <div className="bg-rose-950/90 p-3 rounded-xl border border-rose-500/50 space-y-1 shadow-inner">
                <p className="font-extrabold text-amber-300 flex items-center gap-1.5 text-xs">
                  <span>3. Sinkronisasi Otomatis</span>
                </p>
                <p className="text-[11px] text-white/95 leading-normal font-medium">
                  Begitu koneksi internet aktif kembali, banner ini akan otomatis berubah hijau dan sistem siap menyimpan data seperti biasa.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // If dismissed while still offline, show a discreet mini pill indicator in corner
  if (!isOnline && isDismissed) {
    return (
      <div
        id="network-offline-mini-pill"
        onClick={() => setIsDismissed(false)}
        className="fixed bottom-4 left-4 z-50 bg-rose-600 hover:bg-rose-700 text-white px-3 py-2 rounded-xl shadow-2xl border border-rose-400 flex items-center gap-2 text-xs font-bold cursor-pointer transition-all hover:scale-105 animate-pulse print:hidden"
        title="Klik untuk membuka peringatan status offline"
      >
        <WifiOff className="w-4 h-4 text-white" />
        <span>Status: Offline (Tidak Ada Internet)</span>
      </div>
    );
  }

  return null;
};
