import React, { useState } from 'react';
import {
  QrCode,
  X,
  Copy,
  Download,
  Share2,
  Printer,
  Check,
  Sparkles,
  ShieldCheck,
  Building2,
  ExternalLink,
  MessageCircle,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { getQrisImageSource } from '../utils/qrisUtils';
import { getPathFromTab } from '../utils/urlRouter';

interface ShareQrisModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShareQrisModal: React.FC<ShareQrisModalProps> = ({ isOpen, onClose }) => {
  const { settings, openPrintReport } = useApp();
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedNmid, setCopiedNmid] = useState(false);

  if (!isOpen) return null;

  const merchantName = settings.qrisMerchantName || settings.namaJemaat || 'MAJELIS JEMAAT GKE';
  const nmid = settings.qrisNmid || 'ID1025453826063';
  const gopayNum = settings.gopayAccountNumber || '081255667788';
  
  // Clean URL format: www.domain.com/persembahan-digital
  const cleanPath = getPathFromTab('persembahan_digital');
  const shareUrl = typeof window !== 'undefined'
    ? `${window.location.origin}${cleanPath}`
    : `https://www.gke-palangkaraya.org${cleanPath}`;

  const qrImageSrc = getQrisImageSource(settings, 0);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyNmid = () => {
    navigator.clipboard.writeText(nmid);
    setCopiedNmid(true);
    setTimeout(() => setCopiedNmid(false), 2000);
  };

  const handleWhatsAppShare = () => {
    const text = encodeURIComponent(
      `Shalom Bapak/Ibu/Sdr Jemaat,\n\n` +
      `Berikut adalah link resmi Persembahan Digital & QRIS ${settings.namaJemaat || 'GKE'}:\n` +
      `📌 ${shareUrl}\n\n` +
      `Dapat di-scan menggunakan seluruh aplikasi M-Banking (BCA, Mandiri, BRI, BNI) & e-Wallet (GoPay, OVO, Dana, LinkAja).\n\n` +
      `Tuhan Yesus Memberkati.`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const handleDownloadQr = () => {
    const link = document.createElement('a');
    link.href = qrImageSrc;
    link.download = `QRIS_Resmi_${merchantName.replace(/\s+/g, '_')}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header Modal */}
        <div className="p-5 bg-gradient-to-r from-emerald-950 via-slate-900 to-indigo-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white">Bagikan QRIS Resmi Jemaat</h3>
              <p className="text-xs text-slate-300 font-medium">{settings.namaJemaat || 'MAJELIS JEMAAT GKE'}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          {/* QRIS Code Card Display */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-md flex flex-col items-center text-center">
            {/* Standard QRIS Header Badge */}
            <div className="mb-3 inline-flex items-center justify-center px-4 py-1 bg-white border border-slate-300 rounded-lg">
              <span className="text-lg font-black tracking-tighter text-slate-900 italic font-serif">
                QRIS
              </span>
              <span className="ml-1 text-[9px] font-extrabold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 uppercase">
                GPN • DOKUMEN RESMI
              </span>
            </div>

            {/* Merchant Info */}
            <div className="mb-3">
              <p className="text-sm font-black text-slate-900 uppercase tracking-wide">
                {merchantName}
              </p>
              <p className="text-[11px] font-mono text-slate-500">
                NMID: <span className="font-bold text-slate-800">{nmid}</span>
              </p>
            </div>

            {/* Scannable Image Frame */}
            <div className="relative p-3 bg-white border-2 border-slate-900 rounded-xl shadow-inner">
              <img
                src={qrImageSrc}
                alt="QRIS Persembahan"
                className="w-56 h-56 object-contain rounded-lg"
                referrerPolicy="no-referrer"
              />
            </div>

            <p className="text-[11px] font-semibold text-slate-500 mt-3">
              Menerima Seluruh Aplikasi M-Banking & e-Wallet di Indonesia
            </p>
          </div>

          {/* Quick Info & Share URL Box */}
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800/80 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 font-medium">Link Persembahan Digital:</span>
              <span className="text-emerald-400 font-mono font-bold text-[11px]">
                {cleanPath}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={shareUrl}
                className="flex-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-slate-300 select-all focus:outline-none"
              />
              <button
                type="button"
                onClick={handleCopyLink}
                className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow flex items-center gap-1.5 transition"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedLink ? 'Tersalin' : 'Salin'}</span>
              </button>
            </div>
          </div>

          {/* Share Actions Grid */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={handleWhatsAppShare}
              className="p-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-md flex items-center justify-center gap-2 transition"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Bagikan WA</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadQr}
              className="p-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs shadow-md flex items-center justify-center gap-2 transition"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span>Unduh Gambar</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              onClose();
              openPrintReport({ reportType: 'qris_banner' });
            }}
            className="w-full p-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-extrabold text-xs shadow-lg flex items-center justify-center gap-2 transition"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Standee / Banner QRIS Untuk Gereja</span>
          </button>
        </div>
      </div>
    </div>
  );
};
